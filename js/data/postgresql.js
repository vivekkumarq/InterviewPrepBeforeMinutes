registerTopic("postgresql", [
{
  q: "What is MVCC and how does PostgreSQL implement it?",
  level: "advanced", hot: true, tags: ["mvcc", "internals"],
  a: `<p><strong>Multi-Version Concurrency Control</strong>: instead of locking rows for reads, PostgreSQL keeps multiple versions of each row. Every transaction sees a consistent snapshot as of its start.</p>
<p><strong>The key benefit:</strong> <em>readers never block writers, and writers never block readers.</em> That is the single most important property to state.</p>
<p><strong>How it works:</strong> every row (tuple) carries hidden system columns:</p>
<ul>
<li><code>xmin</code> — the transaction ID that inserted it.</li>
<li><code>xmax</code> — the transaction ID that deleted or superseded it (0 if live).</li>
</ul>
<pre><code>SELECT xmin, xmax, ctid, * FROM orders WHERE id = 1;</code></pre>
<p>An <code>UPDATE</code> does not modify the row in place — it writes a <strong>new tuple</strong> and marks the old one's <code>xmax</code>. A transaction sees a tuple only if <code>xmin</code> is committed and visible to its snapshot, and <code>xmax</code> is not.</p>
<p><strong>The consequence:</strong> dead tuples accumulate, which is exactly why <code>VACUUM</code> exists. It also means an <code>UPDATE</code> in PostgreSQL is as expensive as a delete plus insert, and updating an indexed column requires updating every index (mitigated by HOT updates when no indexed column changes and the new tuple fits on the same page).</p>`
},
{
  q: "What is VACUUM and why is it necessary?",
  level: "advanced", hot: true, tags: ["vacuum", "maintenance"],
  a: `<p>Because MVCC leaves dead tuples behind, <code>VACUUM</code> reclaims that space and does essential bookkeeping.</p>
<table>
<tr><th>Command</th><th>Does</th><th>Locks</th></tr>
<tr><td><code>VACUUM</code></td><td>Marks dead tuple space reusable <em>within</em> the table</td><td>No exclusive lock — safe online</td></tr>
<tr><td><code>VACUUM FULL</code></td><td>Rewrites the table, returning space to the OS</td><td><strong>ACCESS EXCLUSIVE</strong> — blocks everything</td></tr>
<tr><td><code>ANALYZE</code></td><td>Updates planner statistics</td><td>No blocking</td></tr>
<tr><td>Autovacuum</td><td>Runs both automatically based on thresholds</td><td>Background</td></tr>
</table>
<p><strong>Three jobs VACUUM does:</strong></p>
<ol>
<li><strong>Reclaim dead tuple space</strong> — otherwise the table bloats and every scan reads more pages.</li>
<li><strong>Update the visibility map</strong> — which enables <em>index-only scans</em>. Without it, even a covering index must check the heap.</li>
<li><strong>Prevent transaction ID wraparound</strong> — transaction IDs are 32-bit and wrap around after ~2 billion. If vacuum falls too far behind, PostgreSQL <strong>refuses new writes</strong> to protect data. This is a genuine production outage that has hit large companies.</li>
</ol>
<pre><code>-- Find bloat and vacuum status
SELECT relname, n_dead_tup, n_live_tup,
       round(n_dead_tup::numeric / NULLIF(n_live_tup,0), 3) AS dead_ratio,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 20;

-- Tune autovacuum for a hot table (defaults are too lazy for high-churn tables)
ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.02,
                        autovacuum_vacuum_cost_delay = 2);</code></pre>
<p><strong>Practical advice:</strong> never disable autovacuum; tune it to be more aggressive on high-churn tables; avoid <code>VACUUM FULL</code> in production (use <code>pg_repack</code>, which does the same online); and watch out for long-running transactions and abandoned replication slots, which hold back the vacuum horizon and cause bloat even when autovacuum is running.</p>`
},
{
  q: "What index types does PostgreSQL support?",
  level: "advanced", hot: true, tags: ["indexes"],
  a: `<table>
<tr><th>Type</th><th>Best for</th></tr>
<tr><td><strong>B-tree</strong> (default)</td><td>Equality, ranges, sorting, <code>LIKE 'abc%'</code>, unique constraints</td></tr>
<tr><td><strong>GIN</strong></td><td>Multi-valued columns: <code>jsonb</code>, arrays, full-text search. Fast reads, slower writes</td></tr>
<tr><td><strong>GiST</strong></td><td>Geometric and range types, nearest-neighbour, PostGIS, exclusion constraints</td></tr>
<tr><td><strong>BRIN</strong></td><td>Very large tables with naturally ordered data (append-only time series). Tiny index, big win</td></tr>
<tr><td><strong>Hash</strong></td><td>Equality only; rarely worth it over B-tree</td></tr>
<tr><td><strong>SP-GiST</strong></td><td>Non-balanced structures: quadtrees, IP prefix trees</td></tr>
</table>
<pre><code>-- Partial index — much smaller when most rows are irrelevant
CREATE INDEX idx_orders_pending ON orders (created_at) WHERE status = 'PENDING';

-- Expression index — makes a function predicate indexable
CREATE INDEX idx_users_email_lower ON users (lower(email));
-- now: WHERE lower(email) = 'a@b.com'  uses the index

-- Covering index — INCLUDE adds payload columns for index-only scans
CREATE INDEX idx_orders_cust ON orders (customer_id) INCLUDE (total, status);

-- Trigram index — makes LIKE '%substring%' fast
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- Always CONCURRENTLY in production — no table lock
CREATE INDEX CONCURRENTLY idx_x ON t (col);</code></pre>
<p><strong>Two things to volunteer:</strong> <code>CREATE INDEX CONCURRENTLY</code> avoids an <code>ACCESS EXCLUSIVE</code> lock (it takes longer and can leave an invalid index if it fails, which you then drop and retry); and PostgreSQL does <strong>not</strong> automatically index foreign keys — a very common cause of slow deletes and joins.</p>`
},
{
  q: "How does PostgreSQL handle JSON and JSONB?",
  level: "beginner", hot: true, tags: ["jsonb"],
  a: `<table>
<tr><th></th><th><code>json</code></th><th><code>jsonb</code></th></tr>
<tr><td>Storage</td><td>Exact text copy</td><td>Decomposed binary</td></tr>
<tr><td>Write speed</td><td>Faster (no parsing)</td><td>Slower (parsed on write)</td></tr>
<tr><td>Read/query speed</td><td>Slower (reparsed each time)</td><td><strong>Much faster</strong></td></tr>
<tr><td>Indexing</td><td>Not directly</td><td><strong>GIN indexable</strong></td></tr>
<tr><td>Preserves key order / duplicates</td><td>Yes</td><td>No — deduplicated and reordered</td></tr>
</table>
<p><strong>Use <code>jsonb</code> essentially always.</strong> The only reason for <code>json</code> is if you must reproduce the input byte-for-byte.</p>
<pre><code>-- Operators
SELECT data-&gt;'customer'-&gt;&gt;'name'      AS name,      -- -&gt; returns jsonb, -&gt;&gt; returns text
       data#&gt;&gt;'{shipping,address,city}' AS city       -- path
FROM orders
WHERE data @&gt; '{"status":"PAID"}'                     -- containment — GIN indexable
  AND data ? 'coupon'                                 -- key exists
  AND (data-&gt;&gt;'total')::numeric &gt; 100;

CREATE INDEX idx_orders_data ON orders USING gin (data);              -- general
CREATE INDEX idx_orders_data_path ON orders USING gin (data jsonb_path_ops); -- smaller, @&gt; only
CREATE INDEX idx_orders_status ON orders ((data-&gt;&gt;'status'));         -- one key, B-tree

-- Expand an array of objects into rows
SELECT o.id, item-&gt;&gt;'sku' AS sku, (item-&gt;&gt;'qty')::int AS qty
FROM orders o, jsonb_array_elements(o.data-&gt;'items') AS item;</code></pre>
<p><strong>The design advice interviewers want:</strong> use JSONB for genuinely variable or sparse attributes (external API payloads, user-defined fields, event data) — <em>not</em> as a way to avoid designing a schema. Anything you filter, join or constrain on should be a real column, because you lose type checking, foreign keys and clean constraints inside JSONB, and rows get large enough to be TOASTed, which slows access.</p>`
},
{
  q: "What are the isolation levels in PostgreSQL and how do they differ from the standard?",
  level: "advanced", tags: ["transactions"],
  a: `<p>PostgreSQL implements three of the four standard levels — <code>READ UNCOMMITTED</code> behaves identically to <code>READ COMMITTED</code>, because MVCC never exposes uncommitted data.</p>
<table>
<tr><th>Level</th><th>PostgreSQL behaviour</th></tr>
<tr><td>READ UNCOMMITTED</td><td>Treated as READ COMMITTED — dirty reads are impossible</td></tr>
<tr><td><strong>READ COMMITTED</strong> (default)</td><td>A new snapshot per <em>statement</em>. Non-repeatable and phantom reads possible</td></tr>
<tr><td>REPEATABLE READ</td><td>One snapshot for the whole <em>transaction</em>. <strong>Also prevents phantoms</strong> (stricter than the standard requires — it is snapshot isolation)</td></tr>
<tr><td>SERIALIZABLE</td><td>Snapshot isolation + <strong>Serializable Snapshot Isolation</strong> — detects dangerous read/write dependency cycles and aborts a transaction</td></tr>
</table>
<pre><code>BEGIN ISOLATION LEVEL REPEATABLE READ;
-- ...
COMMIT;</code></pre>
<p><strong>The critical practical point:</strong> at REPEATABLE READ and SERIALIZABLE, PostgreSQL does not block — it <strong>aborts</strong> with a serialization failure (SQLSTATE 40001). Your application <em>must</em> catch that and retry the whole transaction. Code written against MySQL's locking behaviour will break here.</p>
<pre><code>@Retryable(retryFor = CannotSerializeTransactionException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional(isolation = Isolation.REPEATABLE_READ)
public void transfer(...) { ... }</code></pre>
<p>SERIALIZABLE in PostgreSQL is genuinely usable — SSI has far lower overhead than classic two-phase locking — which is worth mentioning, since many candidates assume it is unusably slow.</p>`
},
{
  q: "How does table partitioning work in PostgreSQL?",
  level: "advanced", tags: ["partitioning", "scaling"],
  a: `<p>Declarative partitioning (PostgreSQL 10+) splits one logical table into physical child tables. The planner uses <strong>partition pruning</strong> to touch only the relevant ones.</p>
<pre><code>CREATE TABLE events (
    id bigserial,
    occurred_at timestamptz NOT NULL,
    payload jsonb,
    PRIMARY KEY (id, occurred_at)        -- partition key MUST be in the PK
) PARTITION BY RANGE (occurred_at);

CREATE TABLE events_2026_09 PARTITION OF events
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE events_2026_10 PARTITION OF events
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE INDEX ON events_2026_09 (occurred_at);   -- indexes are per partition</code></pre>
<p><strong>Strategies:</strong> <code>RANGE</code> (time series — the most common), <code>LIST</code> (region, tenant, status), <code>HASH</code> (even distribution when there is no natural range).</p>
<p><strong>What you actually gain:</strong></p>
<ul>
<li><strong>Cheap data lifecycle</strong> — <code>DROP TABLE events_2025_01</code> deletes a month instantly, versus a <code>DELETE</code> that takes hours and bloats the table. This is often the main reason to partition.</li>
<li><strong>Smaller indexes per partition</strong>, so they stay in memory.</li>
<li><strong>Partition pruning</strong> — a query filtered on the partition key skips the rest.</li>
<li><strong>Parallel maintenance</strong> — vacuum and reindex per partition.</li>
</ul>
<p><strong>Costs and caveats:</strong> queries that do not filter on the partition key scan every partition; unique constraints must include the partition key; too many partitions (thousands) slows planning; and you need automation to create future partitions (<code>pg_partman</code>, or a scheduled job) — a missing partition means failed inserts at midnight.</p>`
},
{
  q: "How does replication and high availability work in PostgreSQL?",
  level: "advanced", tags: ["replication", "ha"],
  a: `<p>PostgreSQL replicates by shipping the <strong>Write-Ahead Log (WAL)</strong> to standbys.</p>
<ul>
<li><strong>Streaming (physical) replication</strong> — byte-level copy of the whole cluster. Standbys are read-only ("hot standby") and can serve read queries.</li>
<li><strong>Logical replication</strong> — decodes WAL into row changes and publishes per table. Allows replicating a subset, between different major versions, and into other systems — this is what Debezium uses for CDC.</li>
</ul>
<table>
<tr><th>Mode</th><th><code>synchronous_commit</code></th><th>Guarantee</th></tr>
<tr><td>Asynchronous (default)</td><td><code>local</code></td><td>Fast; a failover can lose recent commits</td></tr>
<tr><td>Synchronous</td><td><code>on</code> / <code>remote_apply</code></td><td>No data loss; commit latency includes the network round trip</td></tr>
</table>
<pre><code>-- Monitor replication lag — alert on this
SELECT client_addr, state, sent_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes,
       replay_lag
FROM pg_stat_replication;</code></pre>
<p><strong>Application consequences to raise:</strong> reading from a replica means <strong>replication lag</strong> — a user may not see their own write. Route read-your-own-writes to the primary, or use a session token to wait for the replica to catch up.</p>
<p><strong>For automatic failover</strong> PostgreSQL itself does nothing — you need an external tool: <strong>Patroni</strong> (the de facto standard, using etcd/Consul for leader election), repmgr, or a managed service (RDS, Cloud SQL). Mention connection routing too — PgBouncer or HAProxy so the application follows the new primary. And always have real backups (<code>pgBackRest</code>, WAL archiving with point-in-time recovery); a replica is not a backup, because a dropped table replicates instantly.</p>`
},
{
  q: "What is connection pooling and why does PostgreSQL need it?",
  level: "advanced", hot: true, tags: ["performance", "production"],
  a: `<p>PostgreSQL uses a <strong>process per connection</strong>, not a thread. Each backend consumes several megabytes and OS scheduling overhead, so connections are expensive and a few hundred is already a lot — unlike MySQL's thread model.</p>
<p><strong>Two layers of pooling, and both matter:</strong></p>
<ol>
<li><strong>Application-side (HikariCP)</strong> — reuses connections within one JVM.
<pre><code>spring.datasource.hikari:
  maximum-pool-size: 10        # yes, TEN — see below
  minimum-idle: 10
  connection-timeout: 3000
  max-lifetime: 1800000        # recycle before the DB or a proxy does
  leak-detection-threshold: 60000</code></pre></li>
<li><strong>Server-side (PgBouncer)</strong> — multiplexes many application connections onto few database connections. Essential when you run many service instances, since 20 pods × 20 connections = 400 backends.</li>
</ol>
<p><strong>The counter-intuitive sizing rule:</strong> the right pool size is small. A common formula is <code>connections = cores × 2 + effective_spindles</code> — often 10 to 20, not 100. Beyond the point where the database is saturated, more connections add context-switching and lock contention and make <em>everything</em> slower. Queueing in the application pool is better than thrashing in the database.</p>
<p><strong>PgBouncer pool modes:</strong> <code>session</code> (a connection for the client's whole session), <code>transaction</code> (returned after each transaction — the most efficient and the usual choice), <code>statement</code> (aggressive, breaks multi-statement transactions). With transaction mode, be aware that session-level features — prepared statements, advisory locks, <code>SET</code> — behave differently; that caveat is a good detail to mention.</p>`
},
{
  q: "What is the difference between UPSERT approaches — ON CONFLICT?",
  level: "beginner", tags: ["dml"],
  a: `<pre><code>-- INSERT ... ON CONFLICT (PostgreSQL 9.5+) — atomic, race-free
INSERT INTO product (sku, name, price, updated_at)
VALUES ('A-1', 'Widget', 9.99, now())
ON CONFLICT (sku) DO UPDATE
SET name = EXCLUDED.name,           -- EXCLUDED = the row you tried to insert
    price = EXCLUDED.price,
    updated_at = now()
WHERE product.price IS DISTINCT FROM EXCLUDED.price   -- skip no-op updates
RETURNING id, (xmax = 0) AS was_inserted;             -- neat trick: did it insert or update?

-- Ignore duplicates instead of updating
INSERT INTO processed_event (event_id) VALUES (:id) ON CONFLICT DO NOTHING;</code></pre>
<p><strong>Why this beats the naive approach:</strong> "SELECT, then INSERT or UPDATE" is a check-then-act race — two concurrent requests both see no row and both insert, one failing with a constraint violation. <code>ON CONFLICT</code> is a single atomic statement handled by the engine.</p>
<p><strong>Details worth mentioning:</strong> the conflict target must match a unique index or constraint; <code>EXCLUDED</code> refers to the proposed row; <code>DO NOTHING</code> is the cleanest way to implement idempotent event consumption; and the <code>WHERE</code> clause on <code>DO UPDATE</code> avoids writing a new tuple (and therefore bloat and a WAL record) when nothing actually changed.</p>
<p>The SQL-standard <code>MERGE</code> arrived in PostgreSQL 15, but <code>ON CONFLICT</code> remains the idiomatic choice for single-row upserts.</p>`
},
{
  q: "How do you find and fix a slow PostgreSQL database in production?",
  level: "advanced", hot: true, tags: ["production", "performance"],
  a: `<pre><code>-- 1. What is running RIGHT NOW, and what is blocked?
SELECT pid, now() - query_start AS duration, state, wait_event_type, wait_event,
       left(query, 120) AS query
FROM pg_stat_activity
WHERE state != 'idle' ORDER BY duration DESC;

-- 2. Who is blocking whom?
SELECT blocked.pid AS blocked_pid, blocking.pid AS blocking_pid,
       left(blocked.query,80) AS blocked_query, left(blocking.query,80) AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

-- 3. Worst queries over time (requires pg_stat_statements — enable it everywhere)
SELECT calls, round(total_exec_time::numeric,1) AS total_ms,
       round(mean_exec_time::numeric,2) AS mean_ms, rows,
       left(query, 120) AS query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;

-- 4. Missing indexes: tables with heavy sequential scans
SELECT relname, seq_scan, seq_tup_read, idx_scan,
       seq_tup_read / NULLIF(seq_scan,0) AS avg_rows_per_seq_scan
FROM pg_stat_user_tables WHERE seq_scan &gt; 0 ORDER BY seq_tup_read DESC LIMIT 20;

-- 5. Unused indexes: pure write overhead, drop them
SELECT relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes WHERE idx_scan &lt; 50 ORDER BY pg_relation_size(indexrelid) DESC;

-- 6. Cache hit ratio — should be &gt; 0.99
SELECT sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read),0) FROM pg_statio_user_tables;

-- 7. Kill a runaway query
SELECT pg_cancel_backend(pid);      -- polite
SELECT pg_terminate_backend(pid);   -- forceful</code></pre>
<p><strong>Order of investigation:</strong> is it one query or everything? → blocked on a lock, or working hard? → is the plan wrong (stale statistics) or is an index missing? → is it bloat or a vacuum problem? → is it connection saturation? Each of the queries above answers one of those, which is why presenting it as a <em>procedure</em> scores much better than naming tools.</p>
<p>Also mention <code>log_min_duration_statement</code>, <code>auto_explain</code> for capturing plans of slow queries automatically, and monitoring with pgwatch2 or a managed dashboard.</p>`
},
{
  q: "What is a CTE optimisation fence, and how do LATERAL joins work?",
  level: "advanced", tags: ["queries"],
  a: `<p><strong>CTE fence:</strong> before PostgreSQL 12, a <code>WITH</code> clause was <em>always materialised</em> — the planner could not push predicates into it, which sometimes made a readable query dramatically slower. Since 12, a CTE referenced once and without side effects is inlined by default, and you control it explicitly:</p>
<pre><code>WITH recent AS MATERIALIZED (...)      -- force materialisation (compute once, reuse)
WITH recent AS NOT MATERIALIZED (...)  -- force inlining (allow predicate pushdown)</code></pre>
<p><strong><code>LATERAL</code></strong> lets a subquery in the <code>FROM</code> clause reference columns from tables to its left — effectively a correlated subquery that can return multiple rows and columns. It is the clean solution to "top N per group":</p>
<pre><code>-- The 3 most recent orders for each customer
SELECT c.id, c.name, o.id AS order_id, o.total, o.created_at
FROM customer c
CROSS JOIN LATERAL (
    SELECT o.id, o.total, o.created_at
    FROM orders o
    WHERE o.customer_id = c.id          -- references the OUTER table — only possible with LATERAL
    ORDER BY o.created_at DESC
    LIMIT 3
) o;</code></pre>
<p><strong>Why LATERAL often beats a window function here:</strong> with an index on <code>orders (customer_id, created_at DESC)</code>, the database fetches exactly 3 rows per customer using the index. The window-function version must read <em>every</em> order, rank them all, then discard most. On a large orders table that difference is enormous.</p>
<p>Use <code>LEFT JOIN LATERAL ... ON true</code> when you want to keep customers with no orders.</p>`
},
{
  q: "What PostgreSQL features would you use that other databases lack?",
  level: "beginner", tags: ["features"],
  a: `<ul>
<li><strong>JSONB with GIN indexes</strong> — document-database capability inside a relational database, with real transactions.</li>
<li><strong>Array and composite types</strong> — <code>text[]</code>, <code>int[]</code> with containment operators and GIN indexes.</li>
<li><strong>Range types</strong> — <code>tstzrange</code> plus <strong>exclusion constraints</strong>, which let the database itself prevent overlapping bookings:
<pre><code>ALTER TABLE reservation ADD CONSTRAINT no_overlap
EXCLUDE USING gist (room_id WITH =, during WITH &amp;&amp;);</code></pre>
This is a genuinely elegant feature nothing else offers as cleanly.</li>
<li><strong>Full-text search</strong> — <code>tsvector</code>/<code>tsquery</code> with ranking, often enough to avoid running Elasticsearch.</li>
<li><strong><code>LISTEN</code>/<code>NOTIFY</code></strong> — lightweight pub/sub inside the database.</li>
<li><strong>Rich extensions</strong> — PostGIS (the best geospatial engine anywhere), <code>pg_trgm</code> for fuzzy matching, <code>pgvector</code> for embeddings and semantic search, <code>pg_cron</code>, TimescaleDB, <code>pg_stat_statements</code>.</li>
<li><strong>Row-level security</strong> — enforce multi-tenant isolation in the database so an application bug cannot leak data.</li>
<li><strong>Transactional DDL</strong> — you can wrap <code>ALTER TABLE</code> in a transaction and roll it back. MySQL cannot, which makes failed migrations far messier there.</li>
<li><strong>Generated columns, materialised views, custom types, custom aggregates, foreign data wrappers.</strong></li>
</ul>
<blockquote><p><strong>The point to land:</strong> "PostgreSQL's breadth is why my default answer to 'which database?' is PostgreSQL until there is a measured reason to add another. Document storage, search, geospatial and vector workloads can all live there before they justify a separate system to operate."</p></blockquote>`
},
{
  q: "How do you do zero-downtime schema migrations in PostgreSQL?",
  level: "advanced", hot: true, tags: ["migrations", "production"],
  a: `<p><strong>The core constraint:</strong> during a rolling deploy, the old and new application versions run simultaneously against one schema. Every migration must be compatible with both.</p>
<p><strong>The expand–contract pattern, for renaming a column:</strong></p>
<ol>
<li><strong>Expand:</strong> add the new nullable column. Deploy.</li>
<li><strong>Dual write:</strong> application writes both columns, reads the old one. Deploy.</li>
<li><strong>Backfill</strong> the new column in batches.</li>
<li><strong>Switch reads</strong> to the new column. Deploy.</li>
<li><strong>Stop writing</strong> the old column. Deploy.</li>
<li><strong>Contract:</strong> drop the old column, in a later release.</li>
</ol>
<p><strong>Locking hazards specific to PostgreSQL:</strong></p>
<pre><code>-- SAFE (metadata only, instant)
ALTER TABLE t ADD COLUMN c text;                       -- nullable, no default
ALTER TABLE t ADD COLUMN c int DEFAULT 0;              -- safe since PG 11 (no rewrite)
ALTER TABLE t DROP COLUMN c;
CREATE INDEX CONCURRENTLY ...;

-- DANGEROUS (rewrites the table or takes a long exclusive lock)
ALTER TABLE t ALTER COLUMN c TYPE bigint;              -- full rewrite
ALTER TABLE t ADD COLUMN c text NOT NULL;              -- needs a default + rewrite
ALTER TABLE t ADD CONSTRAINT fk ... ;                  -- validates all rows under a lock
CREATE INDEX ...;                                      -- without CONCURRENTLY: blocks writes

-- Safe alternative for constraints: add NOT VALID, then validate without a heavy lock
ALTER TABLE t ADD CONSTRAINT fk FOREIGN KEY (x) REFERENCES y(id) NOT VALID;
ALTER TABLE t VALIDATE CONSTRAINT fk;</code></pre>
<p><strong>The lock-queue trap</strong> worth mentioning: an <code>ALTER TABLE</code> waiting for an <code>ACCESS EXCLUSIVE</code> lock <em>blocks every query behind it</em>, so a migration waiting on one long-running query can freeze the whole table. Always set <code>lock_timeout</code> (a few seconds) and retry, rather than letting a migration take the site down.</p>`
},
{
  q: "What are common PostgreSQL performance configuration parameters?",
  level: "advanced", tags: ["tuning"],
  a: `<pre><code>-- Memory
shared_buffers = 25% of RAM              -- PostgreSQL's own cache (e.g. 8GB on 32GB)
effective_cache_size = 50-75% of RAM     -- a HINT to the planner about OS cache; not allocated
work_mem = 16MB                          -- PER SORT/HASH NODE, per connection — multiply carefully
maintenance_work_mem = 1GB               -- for VACUUM, CREATE INDEX

-- Write behaviour
wal_buffers = 16MB
checkpoint_completion_target = 0.9       -- spread checkpoint I/O, avoid spikes
max_wal_size = 4GB
synchronous_commit = on                  -- 'off' trades durability for speed on non-critical data

-- Planner
random_page_cost = 1.1                   -- for SSDs (default 4.0 assumes spinning disks)
effective_io_concurrency = 200           -- SSD
default_statistics_target = 100          -- raise to 500+ for skewed columns

-- Connections
max_connections = 200                    -- keep low; use PgBouncer instead of raising this

-- Observability — enable these everywhere
shared_preload_libraries = 'pg_stat_statements,auto_explain'
log_min_duration_statement = 500ms
log_lock_waits = on
log_autovacuum_min_duration = 0</code></pre>
<p><strong>The parameter people get wrong is <code>work_mem</code>:</strong> it is allocated <em>per sort or hash operation</em>, and a single query can have several. With 200 connections and a complex query, <code>work_mem = 256MB</code> can request far more memory than the machine has. Set it modestly globally and raise it per session for known heavy reporting queries.</p>
<p>Mention that you would start from a tool like PGTune for a baseline, then tune from measurements — and that most performance problems are queries and indexes, not configuration.</p>`
},
{
  q: "What is row-level security and how would you use it for multi-tenancy?",
  level: "advanced", tags: ["security", "saas"],
  a: `<p>Row-level security (RLS) lets the <em>database</em> enforce which rows a session may see or modify, so an application bug or a raw SQL query cannot leak another tenant's data.</p>
<pre><code>ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;   -- applies to the table owner too

CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.tenant_id')::uuid)          -- for SELECT/UPDATE/DELETE
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);    -- for INSERT/UPDATE

-- The application sets the tenant once per transaction, from the authenticated token
SET LOCAL app.tenant_id = '3f2a...';
SELECT * FROM orders;      -- automatically filtered — no WHERE clause needed</code></pre>
<pre><code>// Spring: set it in a transaction-scoped interceptor, never from a request parameter
@Component
class TenantConnectionCustomizer {
    void applyTenant(Connection c, UUID tenantId) throws SQLException {
        try (var ps = c.prepareStatement("SELECT set_config('app.tenant_id', ?, true)")) {
            ps.setString(1, tenantId.toString());   // 'true' = transaction-local
            ps.execute();
        }
    }
}</code></pre>
<p><strong>Why this is stronger than application-level filtering:</strong> defence in depth. Every developer forgetting <code>WHERE tenant_id = ?</code> is a data breach; with RLS the database refuses regardless. It also protects ad hoc queries, reporting tools and background jobs.</p>
<p><strong>Caveats to raise:</strong> always derive the tenant from the JWT, never from client input; use <code>SET LOCAL</code> so the setting is transaction-scoped (critical with connection pooling — a leaked session variable would be catastrophic); be careful with PgBouncer transaction mode; index on <code>(tenant_id, ...)</code> since the policy adds a predicate to every query; and note there is a small planning overhead.</p>`
}
]);
