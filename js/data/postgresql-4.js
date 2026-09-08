appendTopic("postgresql", [
{
  q: "Your PostgreSQL database is suddenly slow — walk me through the triage",
  level: "advanced", hot: true, tags: ["production", "debugging"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Societe Generale"],
  a: `<pre><code>-- 1. Is it ONE query or everything?
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
-- Many 'active'          -> real load or a bad plan
-- Many 'idle in transaction' -> APPLICATION BUG holding locks and blocking vacuum
-- Near max_connections   -> pool exhaustion, not a database problem at all

-- 2. Is anything BLOCKED?
SELECT blocked.pid, blocking.pid AS blocked_by,
       now() - blocked.query_start AS waiting_for, left(blocked.query, 80)
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

-- 3. What is consuming the time overall?
SELECT calls, round(total_exec_time::numeric,1) AS total_ms,
       round(mean_exec_time::numeric,2) AS mean_ms, left(query,100)
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;

-- 4. Cache hit ratio — should be &gt; 0.99
SELECT sum(heap_blks_hit)/nullif(sum(heap_blks_hit+heap_blks_read),0) FROM pg_statio_user_tables;

-- 5. Bloat and vacuum health
SELECT relname, n_dead_tup, n_live_tup, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;

-- 6. The one that can take the database DOWN
SELECT datname, age(datfrozenxid),
       round(100*age(datfrozenxid)/2000000000.0, 1) AS pct_to_wraparound
FROM pg_database ORDER BY 2 DESC;

-- 7. Emergency
SELECT pg_cancel_backend(pid);      -- polite
SELECT pg_terminate_backend(pid);   -- forceful</code></pre>
<table>
<tr><th>Symptom</th><th>Likely cause</th></tr>
<tr><td>Many <code>idle in transaction</code></td><td>Application opened a transaction and did I/O or waited on a user</td></tr>
<tr><td>Everything waiting on one PID</td><td>A long DDL or a <code>SELECT FOR UPDATE</code> holding locks</td></tr>
<tr><td>Cache hit ratio dropped</td><td>Working set outgrew <code>shared_buffers</code>, or a big scan evicted it</td></tr>
<tr><td>High <code>n_dead_tup</code></td><td>Autovacuum falling behind — bloat, and index-only scans degraded</td></tr>
<tr><td>Slow after a data load</td><td>Stale statistics — run <code>ANALYZE</code></td></tr>
<tr><td>Connections at the limit</td><td>Pool misconfigured, or transactions held too long</td></tr>
</table>
<p><strong>The finding that surprises people most often:</strong> <code>idle in transaction</code>. It means the application ran <code>BEGIN</code>, then did something slow — an HTTP call, or simply held the connection while rendering a view (which is what <code>open-in-view=true</code> causes). Those sessions hold their locks and hold back the vacuum horizon, so bloat grows across the whole database. Set <code>idle_in_transaction_session_timeout</code> so they cannot.</p>
<p><strong>The one that is an actual outage:</strong> transaction ID wraparound. Above roughly 1.5 billion, PostgreSQL starts refusing writes to protect data. It is entirely preventable by not letting autovacuum fall behind — and it has taken down large companies.</p>`
},
{
  q: "What is the difference between UPDATE and DELETE in terms of MVCC and bloat?",
  level: "advanced", tags: ["mvcc", "performance"],
  companies: ["Amazon", "Oracle", "EPAM", "SAP", "Barclays"],
  a: `<p>Under MVCC, <strong>an <code>UPDATE</code> is physically an insert plus a delete</strong> — PostgreSQL never modifies a row in place.</p>
<pre><code>-- Before
tuple v1: xmin=100, xmax=0,   data='PENDING'

UPDATE orders SET status='PAID' WHERE id=1;

-- After: TWO tuples exist
tuple v1: xmin=100, xmax=200, data='PENDING'   &lt;- dead once no snapshot needs it
tuple v2: xmin=200, xmax=0,   data='PAID'      &lt;- the live version</code></pre>
<p><strong>The consequences that follow directly:</strong></p>
<ul>
<li><strong>Every update writes a whole new row</strong>, even if you changed one boolean — so a wide table with a 20 KB JSONB column pays that cost on every small update.</li>
<li><strong>Every index must be updated</strong> to point at the new tuple location, not just indexes on changed columns.</li>
<li><strong>Bloat</strong> — dead tuples accumulate until <code>VACUUM</code> marks their space reusable. A heavily updated table can be several times larger than its live data.</li>
<li><strong>WAL volume</strong> grows, which increases replication lag.</li>
</ul>
<pre><code>-- HOT (Heap-Only Tuple) updates avoid the index churn — when BOTH hold:
--   1. No INDEXED column changed
--   2. The new tuple fits on the SAME page
-- Leave free space per page to make this likely on hot tables:
ALTER TABLE session SET (fillfactor = 80);      -- 20% reserved for updates

-- Check whether you are getting them
SELECT relname, n_tup_upd, n_tup_hot_upd,
       round(100.0 * n_tup_hot_upd / nullif(n_tup_upd,0), 1) AS hot_pct
FROM pg_stat_user_tables ORDER BY n_tup_upd DESC;
-- A LOW hot_pct on a frequently updated table is a tuning opportunity.</code></pre>
<p><strong>Practical design advice that follows:</strong> avoid indexing columns that change on every update (a <code>last_seen</code> timestamp indexed on a session table destroys HOT updates); split volatile columns into a narrow side table so the wide row is not rewritten; and prefer a single targeted <code>UPDATE</code> over read-modify-write, which produces the same tuple churn plus a race.</p>
<p><strong>The <code>DELETE</code> counterpart:</strong> a delete only sets <code>xmax</code> — the row stays until vacuumed, and <strong>the space is not returned to the operating system</strong>, only marked reusable. Reclaiming it needs <code>VACUUM FULL</code> (exclusive lock) or <code>pg_repack</code> (online). This is why bulk deletion is better replaced by partition dropping.</p>`
},
{
  q: "How do you choose the right index type and avoid over-indexing?",
  level: "advanced", hot: true, tags: ["indexes", "design"],
  companies: ["Amazon", "Oracle", "Flipkart", "Walmart", "SAP", "Optum"],
  a: `<pre><code>-- Start from the QUERY, not the column
-- Query: WHERE customer_id = ? AND status = ? ORDER BY created_at DESC

CREATE INDEX idx_orders_lookup
  ON orders (customer_id, status, created_at DESC);
-- Equality columns FIRST, then the range/sort column.
-- This ONE index serves the filter AND removes the sort.

-- Partial — dramatically smaller when most rows are irrelevant
CREATE INDEX idx_orders_pending ON orders (created_at)
  WHERE status = 'PENDING';               -- 2% of the table instead of 100%

-- Covering — enables an index-only scan
CREATE INDEX idx_orders_cust ON orders (customer_id) INCLUDE (total, status);

-- Expression — makes a function predicate indexable
CREATE INDEX idx_users_email_lower ON users (lower(email));

-- Always CONCURRENTLY in production — no ACCESS EXCLUSIVE lock
CREATE INDEX CONCURRENTLY idx_x ON t (col);</code></pre>
<p><strong>Finding the indexes you do not need</strong> — this half of the question is the one candidates skip:</p>
<pre><code>-- Unused indexes: pure write overhead and disk
SELECT relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan &lt; 50 AND indexrelid NOT IN (SELECT conindid FROM pg_constraint)
ORDER BY pg_relation_size(indexrelid) DESC;

-- Redundant: (a) is covered by (a,b) — drop the narrower one
SELECT indexrelname, indkey FROM pg_index JOIN pg_class ON ...;</code></pre>
<table>
<tr><th>Need</th><th>Index type</th></tr>
<tr><td>Equality, ranges, sorting, <code>LIKE 'abc%'</code></td><td><strong>B-tree</strong> (default)</td></tr>
<tr><td><code>jsonb</code> containment, arrays, full-text</td><td><strong>GIN</strong></td></tr>
<tr><td>Ranges, geometry, nearest-neighbour, exclusion constraints</td><td><strong>GiST</strong></td></tr>
<tr><td>Huge append-only table with naturally ordered data</td><td><strong>BRIN</strong> — tiny index, big win</td></tr>
<tr><td><code>LIKE '%substring%'</code>, fuzzy matching</td><td><strong>GIN + pg_trgm</strong></td></tr>
</table>
<p><strong>The cost to state explicitly:</strong> every index must be updated on every <code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code>, consumes memory that competes with the table for cache, and — critically — an index on a frequently-updated column <strong>disables HOT updates</strong>, multiplying write amplification.</p>
<p><strong>The rule to give:</strong> "One well-designed composite index usually replaces three single-column ones. I index for the queries we actually run, verify with <code>EXPLAIN</code>, and periodically drop the ones <code>pg_stat_user_indexes</code> shows nobody uses. And PostgreSQL does <em>not</em> index foreign keys automatically — that is the most common genuinely missing index."</p>`
},
{
  q: "What is connection pooling and why does PostgreSQL need PgBouncer?",
  level: "advanced", hot: true, tags: ["performance", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Ericsson"],
  a: `<p><strong>The root cause:</strong> PostgreSQL uses a <strong>process per connection</strong>, not a thread. Each backend costs several megabytes of memory plus OS scheduling overhead — so a few hundred connections is already heavy, unlike MySQL's thread model.</p>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Application pools and PgBouncer multiplexing onto few backends">
  <rect class="dg-box" x="14" y="18" width="76" height="26" rx="5"/><text class="dg-s" x="52" y="35" text-anchor="middle">Pod 1 (10)</text>
  <rect class="dg-box" x="14" y="52" width="76" height="26" rx="5"/><text class="dg-s" x="52" y="69" text-anchor="middle">Pod 2 (10)</text>
  <rect class="dg-box" x="14" y="86" width="76" height="26" rx="5"/><text class="dg-s" x="52" y="103" text-anchor="middle">Pod N (10)</text>
  <path class="dg-line" d="M94 31 H150 M94 65 H150 M94 99 H150" marker-end="url(#pb1)"/>
  <text class="dg-s" x="122" y="128" text-anchor="middle">200 total</text>
  <rect class="dg-fill" x="154" y="46" width="130" height="40" rx="8"/>
  <text class="dg-s" x="219" y="63" text-anchor="middle">PgBouncer</text><text class="dg-s" x="219" y="79" text-anchor="middle">transaction mode</text>
  <path class="dg-line" d="M288 66 H344" marker-end="url(#pb1)"/>
  <text class="dg-s" x="316" y="90" text-anchor="middle">20</text>
  <rect class="dg-fill2" x="348" y="40" width="120" height="52" rx="8"/>
  <text class="dg-s" x="408" y="60" text-anchor="middle">PostgreSQL</text><text class="dg-s" x="408" y="78" text-anchor="middle">20 backends</text>
  <text class="dg-s" x="540" y="60" text-anchor="middle">1 process each</text>
  <text class="dg-s" x="540" y="78" text-anchor="middle">~5-10 MB each</text>
  <defs><marker id="pb1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code># HikariCP — per JVM. Note how SMALL the pool is.
spring.datasource.hikari:
  maximum-pool-size: 10          # yes, ten
  minimum-idle: 10
  connection-timeout: 3000
  max-lifetime: 1800000          # recycle before the DB or a proxy closes it
  leak-detection-threshold: 60000

# PgBouncer — multiplexes many client connections onto few server ones
pool_mode = transaction          # returns the connection after each TRANSACTION
max_client_conn = 1000
default_pool_size = 20</code></pre>
<p><strong>The counter-intuitive sizing rule:</strong> the right pool is small — roughly <code>cores × 2 + effective_spindles</code>, often 10–20, not 100. Beyond the point where the database is saturated, more connections add context switching and lock contention and make <em>everything</em> slower. Queueing in the application pool is better than thrashing in the database.</p>
<p><strong>Why PgBouncer is needed on top:</strong> Hikari only bounds <em>one</em> JVM. With 20 pods each holding 20 connections you have 400 backends — which PostgreSQL will struggle with regardless of how well each pod behaves. PgBouncer is the only place that can enforce a cluster-wide limit.</p>
<p><strong>The transaction-mode caveat to raise:</strong> because the connection is returned after each transaction, session-level state does not survive — server-side prepared statements, <code>SET</code>, advisory locks and <code>LISTEN</code> all behave differently. With Hikari you must set <code>prepareThreshold=0</code> on the JDBC URL, and never rely on session variables. That trap catches teams the first time they put PgBouncer in front of an existing application.</p>`
},
{
  q: "How does PostgreSQL handle JSON versus a normalised schema — when do you choose each?",
  level: "advanced", tags: ["jsonb", "design"],
  companies: ["Amazon", "Flipkart", "Adobe", "SAP", "Salesforce", "Persistent"],
  a: `<table>
<tr><th>Use a real COLUMN when</th><th>Use JSONB when</th></tr>
<tr><td>You filter, join or sort on it</td><td>The shape is genuinely variable per row</td></tr>
<tr><td>It needs a constraint or foreign key</td><td>It comes from an external API you do not control</td></tr>
<tr><td>It has a stable, known type</td><td>Users define the fields (custom attributes)</td></tr>
<tr><td>It is required for every row</td><td>It is sparse — 200 possible keys, 5 present</td></tr>
</table>
<pre><code>-- The hybrid that works well in practice
CREATE TABLE product (
    id          bigserial PRIMARY KEY,
    sku         text NOT NULL UNIQUE,          -- queried -> a real column
    name        text NOT NULL,                  -- queried -> real column
    price_minor bigint NOT NULL CHECK (price_minor &gt;= 0),
    category_id bigint NOT NULL REFERENCES category(id),
    attributes  jsonb NOT NULL DEFAULT '{}'     -- varies by category
);
-- attributes for a shoe: { "size": 9, "colour": "black", "material": "leather" }
-- attributes for a laptop: { "ram": "16GB", "cpu": "M3", "screen": 14 }

CREATE INDEX idx_product_attrs ON product USING gin (attributes);
CREATE INDEX idx_product_size  ON product ((attributes-&gt;&gt;'size'));   -- one hot key

SELECT * FROM product
WHERE category_id = 5
  AND attributes @&gt; '{"colour":"black"}'        -- GIN-indexed containment
  AND (attributes-&gt;&gt;'size')::int &gt;= 9;</code></pre>
<p><strong>What you give up inside JSONB:</strong> type checking (a "size" can be <code>9</code>, <code>"9"</code> or <code>"nine"</code>), <code>NOT NULL</code> and <code>CHECK</code> constraints, foreign keys, and column-level statistics — so the planner's estimates for JSONB predicates are much weaker, which produces worse plans.</p>
<p><strong>The performance trap:</strong> a large JSONB value is compressed and moved out of line (TOASTed). Every <code>SELECT *</code> then fetches and decompresses it even if you never read it — so selecting only the columns you need can be an order of magnitude faster on a wide table.</p>
<p><strong>The rule to state:</strong> "JSONB is for genuinely dynamic data, not for avoiding schema design. If I find myself indexing five keys inside a JSONB column, those should have been columns — I have built an EAV table with extra steps." That last observation is what interviewers are listening for, because JSONB-as-schema-replacement is the common failure mode.</p>`
},
{
  q: "What are PostgreSQL's transaction isolation levels in practice, and what is SSI?",
  level: "advanced", tags: ["transactions", "mvcc"],
  companies: ["Amazon", "Goldman Sachs", "Barclays", "Oracle", "Morgan Stanley"],
  a: `<table>
<tr><th>Level</th><th>Dirty read</th><th>Non-repeatable</th><th>Phantom</th><th>Write skew</th></tr>
<tr><td>READ UNCOMMITTED</td><td colspan="4">Behaves as READ COMMITTED — MVCC never exposes uncommitted data</td></tr>
<tr><td><strong>READ COMMITTED</strong> (default)</td><td>✔ prevented</td><td>✘</td><td>✘</td><td>✘</td></tr>
<tr><td>REPEATABLE READ</td><td>✔</td><td>✔</td><td><strong>✔</strong> (stricter than the standard)</td><td>✘</td></tr>
<tr><td>SERIALIZABLE</td><td>✔</td><td>✔</td><td>✔</td><td><strong>✔</strong></td></tr>
</table>
<p><strong>Write skew</strong> is the anomaly that only SERIALIZABLE prevents, and it is the interesting part of this question:</p>
<pre><code>-- Rule: at least one doctor must remain on call.
-- Two doctors, both currently on call, both try to go off call simultaneously.

-- Transaction A                          -- Transaction B
SELECT count(*) FROM doctor               SELECT count(*) FROM doctor
WHERE on_call = true;   -- sees 2         WHERE on_call = true;   -- sees 2
UPDATE doctor SET on_call = false         UPDATE doctor SET on_call = false
WHERE id = 1;                             WHERE id = 2;
COMMIT;                                   COMMIT;

-- Result: ZERO doctors on call. Neither transaction wrote the same row,
-- so REPEATABLE READ sees no conflict. The INVARIANT is broken.</code></pre>
<p><strong>PostgreSQL's SERIALIZABLE uses SSI</strong> (Serializable Snapshot Isolation) — it tracks read/write <em>dependencies</em> between concurrent transactions and aborts one when it detects a dangerous cycle. Crucially it does this <em>without locking reads</em>, which is why it performs far better than the classic two-phase-locking implementations people expect.</p>
<pre><code>BEGIN ISOLATION LEVEL SERIALIZABLE;
-- ...
COMMIT;   -- may throw: ERROR: could not serialize access due to read/write dependencies</code></pre>
<p><strong>The application requirement this creates</strong> — and it is the thing that breaks code ported from MySQL: PostgreSQL does not <em>block</em> at these levels, it <strong>aborts</strong> with SQLSTATE 40001. Your application must catch it and retry the whole transaction.</p>
<pre><code>@Retryable(retryFor = CannotSerializeTransactionException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional(isolation = Isolation.SERIALIZABLE)
public void assignOnCall(...) { }</code></pre>
<p><strong>The practical recommendation:</strong> stay at READ COMMITTED and handle the specific anomaly you have — optimistic locking with a version column, or an atomic conditional <code>UPDATE</code>. Reach for SERIALIZABLE when a genuine multi-row invariant is at stake and the retry cost is acceptable, which is exactly the doctor case above.</p>`
}
]);
