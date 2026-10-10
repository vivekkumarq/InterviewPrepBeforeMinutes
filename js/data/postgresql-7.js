registerPrimer("postgresql", `<p class="pr-lead"><b>PostgreSQL</b> (often called Postgres) is a popular, free, open-source relational database. Everything you know from SQL works here. What makes Postgres interview questions special is <i>how</i> it works inside: it never overwrites a row, it writes every change to a log first, and it gives each connection its own process. Understanding these three ideas explains most of its behaviour.</p>
<div class="pr-analogy"><b>Think of it like this</b>Imagine a shared document where edits are never erased. Each change adds a new version of the paragraph, stamped with who made it and when. Someone who started reading at 10:00 keeps seeing the 10:00 version, undisturbed, even while others edit. Later, a cleaner (<b>VACUUM</b>) comes round and throws away old versions nobody is reading any more. That is exactly how Postgres handles rows.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>MVCC</dt><dd>Multi-version concurrency control: keeping several versions of a row so readers and writers do not block each other.</dd>
<dt>Snapshot</dt><dd>The view of the data a query or transaction sees: everything committed before it started.</dd>
<dt>Dead tuple</dt><dd>An old row version that nobody needs any more but still takes up space.</dd>
<dt>VACUUM / autovacuum</dt><dd>The clean-up process that removes dead tuples. Autovacuum runs it automatically.</dd>
<dt>WAL</dt><dd>Write-ahead log: every change is written here first, so it can be recovered after a crash and sent to replicas.</dd>
<dt>Replica / standby</dt><dd>A copy of the database kept up to date from the WAL, used for reading or for taking over if the main one fails.</dd>
<dt>JSONB</dt><dd>A column type for storing JSON documents that can be indexed and searched.</dd>
<dt>Connection pooler</dt><dd>A tool such as PgBouncer that lets many app connections share a few database connections.</dd>
</dl>

<h3>Step by step: what one UPDATE really does</h3>
<ol class="pr-steps">
<li>Your transaction runs <code>UPDATE accounts SET balance = 450 WHERE id = 1</code>.</li>
<li>Postgres does not change the existing row. It marks the old version (balance 500) as "ended by this transaction".</li>
<li>It writes a brand-new version of the row with balance 450.</li>
<li>It records the change in the WAL. When you <code>COMMIT</code>, the WAL is saved to disk, which makes the change safe even if the server crashes.</li>
<li>Meanwhile, a report that started earlier still sees balance 500, without waiting for any lock.</li>
<li>Later, autovacuum notices nobody can see the old version any more and frees its space.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 238" role="img" aria-label="PostgreSQL MVCC: an update creates a new row version; old snapshots still see the old version; WAL is flushed at commit; vacuum removes dead versions later">
  <defs><marker id="pr-pg" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <text class="dg-t" x="10" y="22">Table page for accounts</text>
  <rect class="dg-box" x="10" y="32" width="300" height="40" rx="6"/>
  <text class="dg-m" x="22" y="50">id=1  balance=500</text>
  <text class="dg-s" x="22" y="64">xmin=100   xmax=205  (ended by tx 205)</text>
  <text class="dg-s" x="236" y="56">DEAD after</text>
  <rect class="dg-fill" x="10" y="80" width="300" height="40" rx="6"/>
  <text class="dg-m" x="22" y="98">id=1  balance=450</text>
  <text class="dg-s" x="22" y="112">xmin=205   xmax=none (current)</text>
  <line class="dg-line" x1="310" y1="52" x2="360" y2="52" marker-end="url(#pr-pg)"/>
  <text class="dg-s" x="366" y="48">tx 190 started before 205 committed:</text>
  <text class="dg-s" x="366" y="62">it still sees balance=500</text>
  <line class="dg-line" x1="310" y1="100" x2="360" y2="100" marker-end="url(#pr-pg)"/>
  <text class="dg-s" x="366" y="96">tx 210 started after:</text>
  <text class="dg-s" x="366" y="110">it sees balance=450</text>
  <rect class="dg-fill2" x="10" y="146" width="180" height="50" rx="8"/>
  <text class="dg-t" x="100" y="166" text-anchor="middle">WAL</text>
  <text class="dg-s" x="100" y="184" text-anchor="middle">flushed at COMMIT: durable</text>
  <rect class="dg-box" x="220" y="146" width="180" height="50" rx="8"/>
  <text class="dg-t" x="310" y="166" text-anchor="middle">Shared buffers</text>
  <text class="dg-s" x="310" y="184" text-anchor="middle">pages in RAM, written later</text>
  <rect class="dg-fill" x="430" y="146" width="180" height="50" rx="8"/>
  <text class="dg-t" x="520" y="166" text-anchor="middle">VACUUM</text>
  <text class="dg-s" x="520" y="184" text-anchor="middle">reclaims dead versions</text>
  <text class="dg-s" x="10" y="224">A crash loses nothing committed: on restart, PostgreSQL replays the WAL onto the table files.</text>
</svg>
<figcaption>Two versions of the same row live side by side. Which one a query sees depends only on its snapshot.</figcaption>
</figure>

<h3>What this explains</h3>
<ul>
<li><b>Tables grow even when the row count stays the same:</b> each update leaves an old version behind until vacuum removes it. This is called <b>bloat</b>.</li>
<li><b>A transaction left open for hours causes trouble:</b> vacuum cannot remove versions that the old transaction might still need.</li>
<li><b>Too many connections hurt:</b> each connection is a separate operating-system process using several megabytes, so apps use a pooler.</li>
<li><b>Readers never block writers:</b> they simply read an older version.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Leaving transactions open</p>
<p>Opening a transaction, then waiting for a slow API call or the user, holds locks and stops vacuum cleaning up. The whole database slowly gets slower.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> keep transactions short and do slow work outside them. Set <code>idle_in_transaction_session_timeout</code> as a safety net.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Opening hundreds of direct connections</p>
<p>Every app instance opening many connections can exhaust memory and slow everything down.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use a small connection pool in the app (HikariCP) and PgBouncer in front of the database.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using <code>timestamp</code> instead of <code>timestamptz</code></p>
<p>Plain <code>timestamp</code> has no time zone, so the same value can mean different moments to different readers.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use <code>timestamptz</code>, which stores an exact moment in time.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Check-then-insert races</p>
<p>"SELECT to see if it exists, then INSERT" lets two requests both see nothing and both insert.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> add a unique constraint and use <code>INSERT ... ON CONFLICT</code>, which does it safely in one step.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Postgres never overwrites a row; an update writes a new version (MVCC).</li>
<li>VACUUM cleans up old versions; long transactions stop it from working.</li>
<li>Every change goes to the WAL first, which gives crash safety and replication.</li>
<li>Each connection is a process, so use a connection pooler.</li>
<li>Postgres has rich extras (JSONB, full-text search, partitioning) that often replace a second datastore.</li>
</ul>
<p><b>Next:</b> the questions below cover MVCC, vacuum, indexes, replication, partitioning, JSONB and production troubleshooting.</p>`);

appendTopic("postgresql", [
{
  q: "Build a reliable job queue in PostgreSQL with SELECT ... FOR UPDATE SKIP LOCKED",
  level: "advanced", hot: true, tags: ["skip-locked", "queues", "concurrency", "locking", "must-know"],
  companies: ["Razorpay", "Stripe", "Atlassian", "Swiggy", "Zerodha", "Amazon", "Shopify"],
  a: `<p>Many teams add RabbitMQ or Redis just to run background jobs, when the database they already have can do it safely. The feature that makes it work is <code>FOR UPDATE SKIP LOCKED</code>: <em>lock the rows I select, and skip any row another transaction has already locked</em>. Several workers can pull from the same table at once, and no two ever get the same job.</p>
<pre><code>CREATE TABLE jobs (
    id           bigserial PRIMARY KEY,
    kind         text        NOT NULL,              -- 'send_email', 'make_invoice'
    payload      jsonb       NOT NULL,
    status       text        NOT NULL DEFAULT 'queued',   -- queued | done | failed
    attempts     int         NOT NULL DEFAULT 0,
    run_at       timestamptz NOT NULL DEFAULT now(),  -- supports delays and backoff
    last_error   text,
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- Only queued jobs are ever searched, so index only those (a partial index)
CREATE INDEX jobs_ready ON jobs (run_at) WHERE status = 'queued';</code></pre>
<pre><code>-- A worker's loop, one transaction per job:
BEGIN;

SELECT id, kind, payload, attempts
FROM jobs
WHERE status = 'queued' AND run_at &lt;= now()
ORDER BY run_at
LIMIT 1
FOR UPDATE SKIP LOCKED;          -- the row is now locked by THIS transaction;
                                 -- other workers skip it and take the next one

-- ... do the work in application code ...

UPDATE jobs SET status = 'done' WHERE id = :id;       -- success
COMMIT;

-- On failure: retry later with exponential backoff, or give up
UPDATE jobs
SET attempts = attempts + 1,
    last_error = :error,
    run_at = now() + (interval '30 seconds' * power(2, attempts)),
    status = CASE WHEN attempts + 1 &gt;= 5 THEN 'failed' ELSE 'queued' END
WHERE id = :id;
COMMIT;</code></pre>
<p><strong>What happens if a worker crashes mid-job?</strong> Its transaction is rolled back and its lock released, so the job is simply <code>queued</code> again and another worker picks it up. There is no "stuck in processing" state to clean up, which is the usual problem with home-made queues that use a status update instead of a lock.</p>
<table>
<tr><th>Without SKIP LOCKED</th><th>With it</th></tr>
<tr><td><code>FOR UPDATE</code> alone: every worker queues behind the first worker's lock on the same row</td><td>Each worker instantly takes a different row</td></tr>
<tr><td>No locking: two workers read the same job and both run it</td><td>A job is only ever held by one transaction</td></tr>
<tr><td>A "processing" status: crashes leave jobs stuck forever</td><td>A crash releases the lock automatically</td></tr>
</table>
<p><strong>The best part: transactional enqueueing.</strong> Because the queue is in the same database, you can insert a job in the <em>same transaction</em> as the business change. Either both happen or neither does. With an external broker that needs the outbox pattern.</p>
<pre><code>BEGIN;
INSERT INTO orders (...) VALUES (...);
INSERT INTO jobs (kind, payload) VALUES ('send_confirmation', '{"orderId": 9001}');
COMMIT;      -- the email job exists if and only if the order does</code></pre>
<table>
<tr><th>Good fit</th><th>Poor fit</th></tr>
<tr><td>Hundreds to a few thousand jobs per second</td><td>Hundreds of thousands per second</td></tr>
<tr><td>Jobs tied to database changes</td><td>Fan-out to many independent consumers (use Kafka)</td></tr>
<tr><td>Teams that do not want to run another system</td><td>Very long jobs: holding a transaction open for minutes blocks vacuum. For those, lock, mark as <code>running</code> with a lease time, commit, and let a sweeper requeue expired leases</td></tr>
</table>
<p><strong>Keep the table small:</strong> delete or archive finished jobs regularly (or partition by day and drop old partitions). Libraries such as db-scheduler (Java), Oban (Elixir) and Solid Queue (Rails) use this same pattern.</p>`
},
{
  q: "Speed up three real queries with partial, expression and covering indexes",
  level: "advanced", tags: ["indexes", "performance", "explain", "query-tuning"],
  companies: ["Amazon", "Zerodha", "Razorpay", "Atlassian", "Swiggy", "Microsoft", "Walmart"],
  a: `<p>Most developers know one kind of index: <code>CREATE INDEX ON t (column)</code>. PostgreSQL has three variations that fix whole categories of slow queries, each shown here on a query that a plain index handles badly.</p>
<p><strong>1. Partial index: only index the rows you actually search.</strong></p>
<pre><code>-- 50 million orders; 99.8% are 'DELIVERED'. The app constantly asks for the
-- few thousand still in flight.
SELECT * FROM orders WHERE status = 'PENDING' AND created_at &lt; now() - interval '1 hour';

CREATE INDEX orders_status ON orders (status);            -- indexes all 50M rows
CREATE INDEX orders_pending ON orders (created_at)
    WHERE status = 'PENDING';                             -- indexes ~10,000 rows

-- The partial index is thousands of times smaller, fits in memory, and is
-- cheap to maintain: delivered orders never touch it again.
-- The query's WHERE must imply the index's WHERE for the planner to use it.</code></pre>
<pre><code>-- Also great for "unique among active rows only":
CREATE UNIQUE INDEX one_active_sub ON subscriptions (user_id) WHERE cancelled_at IS NULL;
-- A user may have many cancelled subscriptions but only ONE active one.</code></pre>
<p><strong>2. Expression index: index the value the query actually compares.</strong></p>
<pre><code>SELECT * FROM users WHERE lower(email) = lower('Asha@Corp.com');
-- An index on (email) is useless here: the query compares lower(email),
-- which the index does not contain. Result: a sequential scan.

CREATE INDEX users_email_lower ON users (lower(email));
-- Now the index stores lower(email) and the lookup is instant.

-- Same idea for dates:
SELECT * FROM events WHERE date(created_at) = '2026-03-10';      -- cannot use (created_at)
-- Better: rewrite the QUERY as a range, and a plain index works:
SELECT * FROM events
WHERE created_at &gt;= '2026-03-10' AND created_at &lt; '2026-03-11';</code></pre>
<p><strong>3. Covering index: answer the query from the index alone.</strong></p>
<pre><code>SELECT order_id, total FROM orders
WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;

CREATE INDEX orders_by_customer ON orders (customer_id, created_at DESC)
    INCLUDE (order_id, total);

-- The index is sorted exactly as the query wants (no sort step), and the
-- INCLUDE columns mean the table itself is never visited:
--   Index Only Scan using orders_by_customer on orders
--     Heap Fetches: 0            &lt;- nothing read from the table
-- Heap Fetches stays near 0 only if VACUUM keeps the visibility map current.</code></pre>
<table>
<tr><th>Index type</th><th>Fixes</th><th>Watch out for</th></tr>
<tr><td><strong>Partial</strong></td><td>Queries on a small, well-defined subset of a big table</td><td>The query's condition must match the index's WHERE</td></tr>
<tr><td><strong>Expression</strong></td><td>Queries that wrap a column in a function</td><td>The query must use the exact same expression</td></tr>
<tr><td><strong>Covering (INCLUDE)</strong></td><td>Hot queries that read a few columns</td><td>A bigger index; only worth it for frequent queries</td></tr>
<tr><td><strong>Multi-column order</strong></td><td>Filter and sort in one pass</td><td>Equality columns first, then the range or sort column</td></tr>
</table>
<p><strong>How to prove it worked:</strong> run <code>EXPLAIN (ANALYZE, BUFFERS)</code> before and after, and compare the plan node (<em>Seq Scan</em> becoming <em>Index Scan</em> or <em>Index Only Scan</em>), the actual time, and the buffers read. Then check <code>pg_stat_user_indexes</code> a week later: an index with <code>idx_scan = 0</code> is costing every write and helping no read, so drop it.</p>`
}
]);
