appendTopic("postgresql", [
{
  q: "How do you use JSONB, full-text search and other Postgres features instead of adding a new datastore?",
  level: "advanced", tags: ["postgresql", "jsonb", "search", "architecture"],
  companies: ["Amazon", "Flipkart", "Optum", "SAP", "Adobe", "Persistent", "Maersk"],
  a: `<p>Reaching for Elasticsearch, Redis and Mongo alongside Postgres means four systems to back up, monitor and keep in sync. Postgres covers a surprising amount of that — often well enough to defer the decision for years.</p>
<pre><code>-- FULL-TEXT SEARCH, no Elasticsearch required
ALTER TABLE article ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')),  'A') ||
    setweight(to_tsvector('english', coalesce(body,'')),   'B')
  ) STORED;                                     -- maintained automatically
CREATE INDEX idx_article_tsv ON article USING GIN (tsv);

SELECT title, ts_rank(tsv, q) AS rank
FROM article, websearch_to_tsquery('english', 'postgres "full text"') q
WHERE tsv @@ q
ORDER BY rank DESC LIMIT 20;
-- websearch_to_tsquery accepts quotes, OR and - exactly as users type them.</code></pre>
<pre><code>-- FUZZY / TYPO-TOLERANT matching
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_name_trgm ON customer USING GIN (name gin_trgm_ops);
SELECT name FROM customer WHERE name % 'jonh smith'      -- similarity operator
ORDER BY similarity(name, 'jonh smith') DESC LIMIT 10;
-- This also makes LIKE '%substring%' indexable, which a B-tree cannot do.</code></pre>
<table>
<tr><th>Instead of</th><th>Postgres offers</th><th>Switch away when</th></tr>
<tr><td>Elasticsearch</td><td>tsvector + GIN, pg_trgm</td><td>You need relevance tuning, aggregations across huge corpora, or fuzzy at very large scale</td></tr>
<tr><td>MongoDB</td><td><code>jsonb</code> + GIN</td><td>The whole model is genuinely schemaless</td></tr>
<tr><td>Redis (cache)</td><td><code>UNLOGGED</code> tables; the buffer cache</td><td>You need sub-millisecond, or cross-service sharing</td></tr>
<tr><td>Redis (queue)</td><td><code>SELECT … FOR UPDATE SKIP LOCKED</code></td><td>Throughput exceeds what one DB can take</td></tr>
<tr><td>A time-series DB</td><td>Partitioning + BRIN, or TimescaleDB</td><td>Ingest is enormous</td></tr>
<tr><td>A vector DB</td><td><code>pgvector</code></td><td>Billions of vectors, or specialised ANN tuning</td></tr>
</table>
<pre><code>-- A reliable job queue in plain SQL. SKIP LOCKED is the key: each worker
-- takes a different row instead of queueing behind the same one.
UPDATE job SET status = 'RUNNING', picked_at = now()
WHERE id = (
  SELECT id FROM job
  WHERE status = 'PENDING' AND run_after &lt;= now()
  ORDER BY priority DESC, id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;
-- Transactional with your business data — no dual-write problem at all.</code></pre>
<pre><code>-- LISTEN/NOTIFY for lightweight pub/sub between app instances
NOTIFY cache_invalidate, 'product:42';
-- ⚠ Fire-and-forget: a disconnected listener misses the message entirely,
-- and the payload is capped at 8000 bytes. Fine for cache invalidation,
-- wrong for anything that must not be lost.</code></pre>
<p><strong>The judgement to show:</strong> "Every additional datastore is a permanent operational commitment — backups, upgrades, monitoring, and someone who understands it at 3am. Postgres will take most teams a very long way, and 'one boring database' is a real architectural advantage. I add a specialised store when a measured requirement forces it, not in anticipation."</p>`
},
{
  q: "Explain VACUUM, autovacuum and transaction ID wraparound",
  level: "advanced", hot: true, tags: ["vacuum", "mvcc", "production", "postgresql"],
  companies: ["Amazon", "Optum", "Goldman Sachs", "Barclays", "Maersk", "Walmart", "SAP"],
  a: `<p>Because MVCC never updates in place, every <code>UPDATE</code> and <code>DELETE</code> leaves a dead tuple. <code>VACUUM</code> is what reclaims them — and if it falls behind, two separate things go wrong.</p>
<table>
<tr><th>VACUUM does</th><th>Why it matters</th></tr>
<tr><td>Marks dead tuple space reusable</td><td>Stops the table growing without bound</td></tr>
<tr><td>Updates the <strong>visibility map</strong></td><td>Enables index-only scans — a large read win</td></tr>
<tr><td><strong>Freezes old transaction ids</strong></td><td>Prevents wraparound, which will otherwise stop writes entirely</td></tr>
<tr><td>Updates statistics (with ANALYZE)</td><td>The planner chooses badly on stale stats</td></tr>
</table>
<pre><code>-- VACUUM         : reclaims space for reuse, no exclusive lock. Routine.
-- VACUUM FULL    : rewrites the table, returns space to the OS,
--                  takes an ACCESS EXCLUSIVE lock. Never on a live table.
-- pg_repack      : the same compaction, ONLINE. This is what you actually use.

-- Is autovacuum keeping up?
SELECT relname, n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum, autovacuum_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC LIMIT 10;</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Transaction id space filling toward wraparound">
  <rect class="dg-box" x="16" y="44" width="588" height="34" rx="6"/>
  <rect class="dg-fill" x="16" y="44" width="300" height="34" rx="6"/>
  <rect class="dg-fill2" x="316" y="44" width="160" height="34"/>
  <text class="dg-s" x="166" y="66" text-anchor="middle">normal</text>
  <text class="dg-s" x="396" y="66" text-anchor="middle">warnings in the log</text>
  <text class="dg-s" x="540" y="66" text-anchor="middle">WRITES STOP</text>
  <path class="dg-line" d="M476 38 V82"/>
  <text class="dg-s" x="16" y="30">2 billion transaction ids</text>
  <text class="dg-s" x="16" y="112">at ~1.5bn Postgres warns; at ~2bn it refuses writes to protect your data —</text>
  <text class="dg-s" x="16" y="132">recovering means a single-user-mode vacuum, with the database DOWN</text>
</svg>
</figure>
<pre><code>-- The query to have on a dashboard. This is a real outage, not a theory.
SELECT datname, age(datfrozenxid),
       round(100 * age(datfrozenxid) / 2000000000.0, 1) AS pct_to_wraparound
FROM pg_database ORDER BY 2 DESC;

-- Per table, to find the one holding everything back:
SELECT relname, age(relfrozenxid) FROM pg_class
WHERE relkind = 'r' ORDER BY 2 DESC LIMIT 10;</code></pre>
<table>
<tr><th>What blocks vacuum</th><th>Fix</th></tr>
<tr><td><strong>Long-running transactions</strong></td><td>Dead tuples still visible to them cannot be removed. Set <code>idle_in_transaction_session_timeout</code>.</td></tr>
<tr><td>Abandoned replication slots</td><td>Hold the WAL <em>and</em> the xmin horizon. Bound with <code>max_slot_wal_keep_size</code>.</td></tr>
<tr><td>Prepared transactions left hanging</td><td>Check <code>pg_prepared_xacts</code> — these are forgotten forever</td></tr>
<tr><td>Autovacuum too slow for the write rate</td><td>Raise <code>autovacuum_max_workers</code>, <code>autovacuum_vacuum_cost_limit</code></td></tr>
<tr><td>Defaults tuned for small tables</td><td>The 20% threshold means a 500M-row table waits for 100M dead rows. Set a per-table <code>autovacuum_vacuum_scale_factor</code>.</td></tr>
</table>
<pre><code>-- Per-table tuning for a hot table
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,     -- vacuum at 1%, not 20%
  autovacuum_vacuum_cost_limit = 2000,
  fillfactor = 85                             -- leave room for HOT updates
);</code></pre>
<p><strong>What to say:</strong> "The symptom people notice is bloat and slow queries, but the one that actually takes a database down is wraparound — and it is entirely preventable. I monitor <code>age(datfrozenxid)</code> and the dead-tuple ratio, and the first thing I check when either climbs is whether something is holding a transaction open, because that is nearly always the cause."</p>`
}
]);
