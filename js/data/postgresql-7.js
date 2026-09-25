registerPrimer("postgresql", `<h3>The mental model: never overwrite, always add a new version</h3>
<p>PostgreSQL does not change a row in place. An <code>UPDATE</code> writes a <strong>new version</strong> of the row and marks the old one as ended. Each version is stamped with the transaction that created it (<code>xmin</code>) and the one that ended it (<code>xmax</code>). A query sees only the versions that were current when its snapshot was taken. This is <strong>MVCC</strong> (multi-version concurrency control), and it is why readers never block writers and writers never block readers.</p>
<p>The price is garbage: old versions stay in the table until <strong>VACUUM</strong> removes them once no running transaction can still see them. And for safety, every change is first written to the <strong>WAL</strong> (write-ahead log) and flushed to disk at commit; the table files themselves are updated lazily in memory and written out later.</p>
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
<h3>Worked example: what one UPDATE really does</h3>
<pre><code>BEGIN;                                   -- this transaction gets id 205
UPDATE accounts SET balance = 450 WHERE id = 1;
--  1. find the current version of row id=1 (created by tx 100)
--  2. set its xmax = 205                 (ends it, once 205 commits)
--  3. write a NEW version: balance=450, xmin=205
--  4. update every index on the table to point at the new version too
--     (unless it qualifies for a HOT update: same page, no indexed column changed)
--  5. append all of the above to the WAL buffer
COMMIT;
--  6. flush the WAL to disk. Only now does COMMIT return. The table page
--     itself may reach disk minutes later, at a checkpoint.

-- Meanwhile, a report that started at tx 190 keeps reading balance=500,
-- consistently, without taking any lock. Later, autovacuum sees that no
-- transaction older than 205 is still running and frees the old version.</code></pre>
<h3>What this model explains</h3>
<table>
<tr><th>Observation</th><th>Because of</th></tr>
<tr><td>A table grows even though the row count is flat (bloat)</td><td>Every UPDATE leaves a dead version until vacuum runs</td></tr>
<tr><td>A long-running transaction slows everything down</td><td>Vacuum cannot remove versions it might still need to see</td></tr>
<tr><td>Updating one column of a heavily indexed table is slow</td><td>A new row version needs new index entries (unless HOT applies)</td></tr>
<tr><td><code>SELECT count(*)</code> is slow on big tables</td><td>Each row's visibility depends on the snapshot, so it must be checked</td></tr>
<tr><td>Each connection costs a lot of memory</td><td>PostgreSQL runs one OS process per connection, which is why pgBouncer exists</td></tr>
</table>`);

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
