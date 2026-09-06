appendTopic("postgresql", [
{
  q: "What is the difference between a heap, TOAST and the visibility map?",
  level: "advanced", tags: ["internals", "storage"],
  a: `<ul>
<li><strong>Heap</strong> — the main table file, an unordered collection of 8 KB pages. Each page holds tuples plus a line pointer array. PostgreSQL has no clustered index, so rows sit wherever there was space.</li>
<li><strong>TOAST</strong> (The Oversized-Attribute Storage Technique) — a tuple must fit in one 8 KB page, so a value larger than about 2 KB is compressed and, if still too large, moved to a side table in chunks. Applies to <code>text</code>, <code>jsonb</code>, <code>bytea</code>, large arrays.</li>
<li><strong>Visibility map</strong> — one bit per page recording "all tuples on this page are visible to every transaction". Maintained by <code>VACUUM</code>.</li>
</ul>
<pre><code>-- See TOAST in action
SELECT pg_size_pretty(pg_relation_size('orders'))       AS heap,
       pg_size_pretty(pg_total_relation_size('orders')) AS heap_plus_indexes_and_toast;

-- Control TOAST behaviour per column
ALTER TABLE documents ALTER COLUMN body SET STORAGE EXTERNAL;  -- store out-of-line, no compression</code></pre>
<p><strong>Why these matter practically:</strong></p>
<ul>
<li><strong>TOAST makes <code>SELECT *</code> expensive</strong> on tables with large text or JSONB columns — every row fetches and decompresses the TOASTed value even if you never read it. Selecting only the columns you need can be an order of magnitude faster.</li>
<li><strong>The visibility map enables index-only scans.</strong> An index contains the values but not visibility information, so without the map PostgreSQL must check the heap for every row. If autovacuum falls behind, the map goes stale and your index-only scan silently becomes an index scan with heap fetches — visible in <code>EXPLAIN</code> as a high <code>Heap Fetches</code> count.</li>
<li><strong>HOT updates</strong> — if no indexed column changes and the new tuple fits on the same page, PostgreSQL can update without touching any index. Keeping some free space per page (<code>fillfactor</code>) on frequently updated tables makes this more likely and substantially reduces index bloat.</li>
</ul>
<pre><code>ALTER TABLE session SET (fillfactor = 80);   -- leave room for HOT updates</code></pre>`
},
{
  q: "How do you handle bulk data loading efficiently in PostgreSQL?",
  level: "advanced", hot: true, tags: ["performance", "operations"],
  a: `<pre><code>-- 1. COPY is dramatically faster than INSERT — often 10-50x
COPY orders (id, customer_id, total, created_at)
FROM '/data/orders.csv' WITH (FORMAT csv, HEADER true);

-- From an application, use the COPY protocol rather than looping INSERTs
CopyManager cm = ((PGConnection) connection).getCopyAPI();
cm.copyIn("COPY orders FROM STDIN WITH (FORMAT csv)", inputStream);

-- 2. Multi-row INSERT when COPY is not available — still far better than row-by-row
INSERT INTO orders (id, total) VALUES (1, 10), (2, 20), (3, 30), ...;

-- 3. For very large one-off loads: drop indexes, load, rebuild
DROP INDEX idx_orders_customer;
COPY orders FROM ...;
CREATE INDEX CONCURRENTLY idx_orders_customer ON orders (customer_id);
ANALYZE orders;                                -- refresh statistics afterwards</code></pre>
<pre><code>-- 4. Session-level tuning for a bulk load
SET maintenance_work_mem = '2GB';              -- speeds up index builds
SET synchronous_commit = off;                  -- for THIS session only; risks recent commits
-- Note: UNLOGGED tables skip the WAL entirely, but are truncated on crash
CREATE UNLOGGED TABLE staging_orders (LIKE orders);</code></pre>
<p><strong>Why <code>COPY</code> wins:</strong> each <code>INSERT</code> is a separate statement with its own parse, plan, execute and WAL record. <code>COPY</code> streams rows through a single command with far less per-row overhead. From the JDBC side, batching helps but the COPY protocol helps more.</p>
<p><strong>The pattern I would describe for a real import:</strong> load into an <code>UNLOGGED</code> staging table with <code>COPY</code>, validate and transform there with set-based SQL, then <code>INSERT ... SELECT</code> into the real table inside a transaction — often with <code>ON CONFLICT DO UPDATE</code> for an upsert. That keeps the production table locked for the shortest possible time and gives you a clean place to report rejected rows.</p>
<p><strong>Do not forget <code>ANALYZE</code></strong> after a large load. Without fresh statistics the planner still believes the table is small and will choose nested loops over hash joins — a very common cause of "the import worked but now everything is slow".</p>`
},
{
  q: "What are PostgreSQL's locking modes and how do you diagnose lock contention?",
  level: "advanced", hot: true, tags: ["locking", "production"],
  a: `<table>
<tr><th>Lock mode</th><th>Taken by</th><th>Conflicts with</th></tr>
<tr><td><code>ACCESS SHARE</code></td><td><code>SELECT</code></td><td>Only <code>ACCESS EXCLUSIVE</code></td></tr>
<tr><td><code>ROW SHARE</code></td><td><code>SELECT FOR UPDATE</code></td><td>EXCLUSIVE modes</td></tr>
<tr><td><code>ROW EXCLUSIVE</code></td><td><code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></td><td>SHARE and above</td></tr>
<tr><td><code>SHARE UPDATE EXCLUSIVE</code></td><td><code>VACUUM</code>, <code>CREATE INDEX CONCURRENTLY</code>, <code>ANALYZE</code></td><td>Itself and above</td></tr>
<tr><td><code>SHARE</code></td><td><code>CREATE INDEX</code> (non-concurrent)</td><td>Writes</td></tr>
<tr><td><code>ACCESS EXCLUSIVE</code></td><td>Most <code>ALTER TABLE</code>, <code>DROP</code>, <code>TRUNCATE</code>, <code>VACUUM FULL</code></td><td><strong>Everything</strong></td></tr>
</table>
<pre><code>-- Who is blocking whom, right now
SELECT blocked.pid          AS blocked_pid,
       blocked.query        AS blocked_query,
       blocking.pid         AS blocking_pid,
       blocking.query       AS blocking_query,
       now() - blocked.query_start AS blocked_for
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

-- What locks exist
SELECT relation::regclass, mode, granted, pid FROM pg_locks WHERE NOT granted;

SELECT pg_cancel_backend(pid);       -- polite
SELECT pg_terminate_backend(pid);    -- forceful</code></pre>
<p><strong>The failure mode that causes outages:</strong> an <code>ALTER TABLE</code> needs <code>ACCESS EXCLUSIVE</code>. If a long-running <code>SELECT</code> holds <code>ACCESS SHARE</code>, the ALTER waits — and because lock requests queue, <strong>every subsequent query on that table now queues behind the ALTER</strong>, including simple reads that would not have conflicted with the SELECT. A five-second migration takes the table down completely.</p>
<pre><code>-- The mitigation: never let a migration wait
SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN note text;      -- fails fast instead of blocking everything
-- then retry, ideally in a loop, at a quiet moment</code></pre>
<p><strong>Also worth naming:</strong> <code>log_lock_waits = on</code> so waits over <code>deadlock_timeout</code> appear in the log; and remember that idle-in-transaction sessions hold their locks indefinitely — set <code>idle_in_transaction_session_timeout</code> so a forgotten open transaction cannot block maintenance forever.</p>`
},
{
  q: "How does PostgreSQL full-text search work?",
  level: "advanced", tags: ["search"],
  a: `<pre><code>-- tsvector: the document, lexemes with positions.  tsquery: the search terms.
SELECT to_tsvector('english', 'The quick brown foxes are jumping');
-- 'brown':3 'fox':4 'jump':6 'quick':2      (stemmed, stop words removed)

SELECT to_tsvector('english', 'jumping foxes') @@ to_tsquery('english', 'fox &amp; jump');
-- true — stemming matches "foxes" to "fox"</code></pre>
<pre><code>-- Production setup: a generated column plus a GIN index
ALTER TABLE article ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')),   'A') ||
        setweight(to_tsvector('english', coalesce(body, '')),    'B')
    ) STORED;

CREATE INDEX idx_article_search ON article USING gin (search_vector);

-- Query with ranking and highlighting
SELECT id, title,
       ts_rank(search_vector, query) AS rank,
       ts_headline('english', body, query, 'MaxWords=30') AS snippet
FROM article, websearch_to_tsquery('english', :input) AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;</code></pre>
<p><strong>Details that make this production-ready:</strong> <code>setweight</code> lets a title match outrank a body match; a <code>GENERATED ALWAYS ... STORED</code> column keeps the vector in sync automatically (no triggers to maintain); and <code>websearch_to_tsquery</code> accepts natural user input with quotes and <code>OR</code> rather than requiring the <code>&amp;</code>/<code>|</code> syntax, which <code>to_tsquery</code> would reject with a syntax error.</p>
<p><strong>Combine with trigrams for fuzzy matching</strong>, since full-text search does not handle typos:</p>
<pre><code>CREATE EXTENSION pg_trgm;
CREATE INDEX ON article USING gin (title gin_trgm_ops);
SELECT title FROM article WHERE title % 'postgersql' ORDER BY similarity(title, 'postgersql') DESC;</code></pre>
<p><strong>When to reach for Elasticsearch instead:</strong> when you need faceted navigation, fine-grained relevance tuning, cross-language analysers, or search volume that would compete with your transactional workload. For a great many applications, PostgreSQL full-text search is genuinely enough — and it removes an entire system from your architecture, with no sync lag and no second source of truth. Saying that shows engineering judgement rather than reflexive tool adoption.</p>`
},
{
  q: "What are advisory locks and LISTEN/NOTIFY?",
  level: "advanced", tags: ["features", "concurrency"],
  a: `<p><strong>Advisory locks</strong> are application-defined locks that PostgreSQL tracks but attaches no meaning to — you decide what the number represents. They are extremely useful for coordinating application instances without extra infrastructure.</p>
<pre><code>-- Session-level: held until explicitly released or the session ends
SELECT pg_advisory_lock(12345);
SELECT pg_advisory_unlock(12345);

-- Try without blocking — the leader-election / single-runner pattern
SELECT pg_try_advisory_lock(hashtext('nightly-report'));   -- true = I got it

-- Transaction-level: released automatically at commit/rollback. Safer.
SELECT pg_advisory_xact_lock(hashtext('order:' || :orderId));</code></pre>
<p><strong>The scheduled-job use case:</strong> with three application replicas, all three would run the nightly job. Wrapping it in <code>pg_try_advisory_lock</code> means exactly one acquires it and the others skip — which is precisely how ShedLock works, without needing Redis or ZooKeeper.</p>
<pre><code>-- LISTEN/NOTIFY: lightweight pub/sub inside the database
LISTEN order_events;
NOTIFY order_events, '{"orderId": 42, "status": "PAID"}';

-- From a trigger, so the notification is transactional with the write
CREATE FUNCTION notify_order_change() RETURNS trigger AS $BODY$
BEGIN
    PERFORM pg_notify('order_events', json_build_object('id', NEW.id)::text);
    RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;</code></pre>
<p><strong>Why NOTIFY is genuinely useful:</strong> it fires only on commit, so subscribers never see a rolled-back change — solving the dual-write problem for in-process notifications. Good for cache invalidation and waking a worker instead of polling every second.</p>
<p><strong>Its limits, which you should state:</strong> payloads are capped at 8000 bytes, delivery is <strong>at-most-once</strong> with no persistence (a disconnected listener misses everything), and it does not scale to high volume. It is a signalling mechanism, not a message broker — use it to say "something changed, go look", not to carry the data itself.</p>`
},
{
  q: "How do you monitor and size a PostgreSQL database in production?",
  level: "advanced", tags: ["production", "monitoring"],
  a: `<pre><code>-- Size: what is actually consuming disk
SELECT relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total,
       pg_size_pretty(pg_relation_size(relid))       AS table_only,
       pg_size_pretty(pg_indexes_size(relid))        AS indexes
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC LIMIT 20;

-- Cache hit ratio — should be &gt; 0.99; below that, shared_buffers is too small
SELECT sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0) AS hit_ratio
FROM pg_statio_user_tables;

-- Index hit ratio and unused indexes (pure write overhead — drop them)
SELECT relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes WHERE idx_scan &lt; 50
ORDER BY pg_relation_size(indexrelid) DESC;

-- Bloat and vacuum health
SELECT relname, n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric / nullif(n_live_tup, 0), 3) AS dead_ratio,
       last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 20;

-- Transaction ID wraparound risk — this one can take the database DOWN
SELECT datname, age(datfrozenxid),
       round(100 * age(datfrozenxid) / 2000000000.0, 1) AS pct_toward_wraparound
FROM pg_database ORDER BY age(datfrozenxid) DESC;

-- Connections
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
-- watch for many 'idle in transaction' — they hold locks and block vacuum</code></pre>
<p><strong>What to alert on, and why:</strong></p>
<ul>
<li><strong>Replication lag</strong> — stale reads and a data-loss window on failover.</li>
<li><strong>Transaction ID age above ~1 billion</strong> — approaching wraparound, where PostgreSQL refuses writes to protect data. A genuine outage cause.</li>
<li><strong>Cache hit ratio dropping</strong> — the working set no longer fits in memory.</li>
<li><strong>Long-running transactions and idle-in-transaction sessions</strong> — they hold back the vacuum horizon, causing bloat everywhere.</li>
<li><strong>Connection saturation</strong> — usually means the application pool is misconfigured or transactions are too long.</li>
<li><strong>Deadlocks and lock waits</strong> per minute.</li>
</ul>
<p>Enable <code>pg_stat_statements</code> everywhere — it is the single most valuable extension for finding which queries actually consume your database's time, ranked by total rather than per-call duration.</p>`
},
{
  q: "What is the difference between DELETE, TRUNCATE and partition dropping for large data removal?",
  level: "advanced", tags: ["operations", "performance"],
  a: `<pre><code>-- ✘ Deleting 50 million rows in one statement
DELETE FROM events WHERE created_at &lt; now() - interval '90 days';
-- One enormous transaction: bloats the table with dead tuples, generates huge WAL,
-- blocks vacuum, causes replication lag, and may run for hours holding locks.

-- ✔ Batched deletion — small transactions, vacuum can keep up
DO $BODY$
DECLARE deleted int;
BEGIN
  LOOP
    DELETE FROM events WHERE id IN (
      SELECT id FROM events WHERE created_at &lt; now() - interval '90 days' LIMIT 10000
    );
    GET DIAGNOSTICS deleted = ROW_COUNT;
    EXIT WHEN deleted = 0;
    COMMIT;
    PERFORM pg_sleep(0.1);          -- let replicas and autovacuum catch up
  END LOOP;
END $BODY$;

-- ✔✔ Best: partition by time, then dropping old data is INSTANT
DROP TABLE events_2026_01;          -- metadata only, no row scanning, no bloat
ALTER TABLE events DETACH PARTITION events_2026_01;   -- keep it for archival first</code></pre>
<table>
<tr><th></th><th>DELETE</th><th>TRUNCATE</th><th>DROP PARTITION</th></tr>
<tr><td>Speed on 50M rows</td><td>Hours</td><td>Seconds</td><td>Milliseconds</td></tr>
<tr><td>Selective</td><td>Yes</td><td>No — whole table</td><td>By partition boundary</td></tr>
<tr><td>Creates dead tuples</td><td><strong>Yes</strong> — needs vacuum</td><td>No</td><td>No</td></tr>
<tr><td>WAL volume</td><td>Very high</td><td>Minimal</td><td>Minimal</td></tr>
<tr><td>Lock</td><td>Row-level</td><td><code>ACCESS EXCLUSIVE</code></td><td><code>ACCESS EXCLUSIVE</code> briefly</td></tr>
<tr><td>Fires triggers</td><td>Yes</td><td>No</td><td>No</td></tr>
</table>
<p><strong>The point to make:</strong> data <em>retention</em> is a schema design decision, not an operational afterthought. If a table has a lifecycle — events, logs, audit records, sessions — partition it by time from the beginning, and expiry becomes a <code>DROP TABLE</code> instead of a weekend-long deletion job that bloats the table and lags every replica.</p>
<p>Note also that after a large <code>DELETE</code> the space is <em>not</em> returned to the operating system — <code>VACUUM</code> only marks it reusable. Reclaiming it requires <code>VACUUM FULL</code> (which takes an exclusive lock) or <code>pg_repack</code> (which does it online).</p>`
}
]);
