appendTopic("sql", [
{
  q: "What is the difference between UNION, UNION ALL, INTERSECT and EXCEPT?",
  level: "beginner", tags: ["queries"],
  a: `<table>
<tr><th>Operator</th><th>Returns</th><th>Removes duplicates</th></tr>
<tr><td><code>UNION</code></td><td>Rows in either set</td><td><strong>Yes</strong> — requires a sort/hash</td></tr>
<tr><td><code>UNION ALL</code></td><td>Rows in either set</td><td>No — <strong>much faster</strong></td></tr>
<tr><td><code>INTERSECT</code></td><td>Rows in both sets</td><td>Yes</td></tr>
<tr><td><code>EXCEPT</code> (<code>MINUS</code> in Oracle)</td><td>Rows in the first but not the second</td><td>Yes</td></tr>
</table>
<pre><code>-- Requirements: same number of columns, compatible types, order matters
SELECT id, name FROM active_customers
UNION ALL                                   -- use ALL unless you NEED deduplication
SELECT id, name FROM archived_customers
ORDER BY name;                              -- ORDER BY applies to the WHOLE result, at the end

-- EXCEPT: customers who have never ordered
SELECT id FROM customer
EXCEPT
SELECT DISTINCT customer_id FROM orders;</code></pre>
<p><strong>The performance point:</strong> <code>UNION</code> must deduplicate the entire combined result, which means a sort or hash over everything — often the most expensive part of the query. If the sets are already disjoint (different tables, different date ranges), <code>UNION ALL</code> is both correct and dramatically faster. Defaulting to <code>UNION</code> "just in case" is a very common and costly habit.</p>
<p><strong>A practical use worth mentioning:</strong> <code>UNION ALL</code> can beat an <code>OR</code> across different columns, because each branch can use its own index:</p>
<pre><code>-- Often a poor plan: the optimiser may not use either index
SELECT * FROM orders WHERE customer_id = 5 OR reference = 'ORD-9';

-- Often much faster: two index lookups
SELECT * FROM orders WHERE customer_id = 5
UNION
SELECT * FROM orders WHERE reference = 'ORD-9';</code></pre>`
},
{
  q: "What is the difference between EXISTS, IN and JOIN for filtering?",
  level: "advanced", hot: true, tags: ["queries", "performance"],
  a: `<pre><code>-- 1. IN with a subquery
SELECT * FROM customer c
WHERE c.id IN (SELECT customer_id FROM orders WHERE total &gt; 1000);

-- 2. EXISTS — correlated, short-circuits on the first match
SELECT * FROM customer c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.total &gt; 1000);

-- 3. JOIN — may produce DUPLICATES if a customer has several matching orders
SELECT DISTINCT c.* FROM customer c
JOIN orders o ON o.customer_id = c.id AND o.total &gt; 1000;</code></pre>
<p><strong>Which to use:</strong></p>
<ul>
<li><strong><code>EXISTS</code></strong> when you only need to know <em>whether</em> a related row exists. It stops at the first match and never produces duplicates. Usually the clearest and safest choice.</li>
<li><strong><code>JOIN</code></strong> when you need <em>columns</em> from the other table. Watch for row multiplication.</li>
<li><strong><code>IN</code></strong> for a small, static list of values. Modern optimisers often rewrite <code>IN</code> as a semi-join, so performance is comparable to <code>EXISTS</code> — but there is one important exception.</li>
</ul>
<p><strong>The <code>NOT IN</code> null trap</strong> — a genuine production bug that silently returns zero rows:</p>
<pre><code>-- If ANY customer_id in orders is NULL, this returns NOTHING at all
SELECT * FROM customer WHERE id NOT IN (SELECT customer_id FROM orders);
-- because  id NOT IN (1, 2, NULL)  evaluates to UNKNOWN, never TRUE

-- Safe alternatives
SELECT * FROM customer c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

SELECT c.* FROM customer c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;                         -- the anti-join</code></pre>
<p><strong>Always prefer <code>NOT EXISTS</code> over <code>NOT IN</code></strong> when the subquery column is nullable. This is one of the most commonly asked SQL gotchas because it produces wrong results rather than an error.</p>`
},
{
  q: "How do transactions and locking work in SQL — what is SELECT FOR UPDATE?",
  level: "advanced", hot: true, tags: ["transactions", "locking"],
  a: `<pre><code>BEGIN;

-- Pessimistic lock: other transactions block on these rows until commit
SELECT * FROM account WHERE id = 1 FOR UPDATE;

UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;

COMMIT;</code></pre>
<table>
<tr><th>Clause</th><th>Behaviour</th></tr>
<tr><td><code>FOR UPDATE</code></td><td>Exclusive lock — blocks other <code>FOR UPDATE</code> and writes</td></tr>
<tr><td><code>FOR SHARE</code></td><td>Shared lock — allows other readers, blocks writers</td></tr>
<tr><td><code>FOR UPDATE NOWAIT</code></td><td>Fails immediately instead of waiting</td></tr>
<tr><td><code>FOR UPDATE SKIP LOCKED</code></td><td><strong>Skips</strong> locked rows — the queue-worker pattern</td></tr>
</table>
<pre><code>-- SKIP LOCKED: N workers each claim different jobs with no contention
UPDATE job SET status = 'RUNNING', worker = :id
WHERE id = (SELECT id FROM job WHERE status = 'PENDING'
            ORDER BY created_at LIMIT 1
            FOR UPDATE SKIP LOCKED)
RETURNING *;</code></pre>
<p><strong><code>SKIP LOCKED</code> is worth knowing well</strong> — it turns a relational table into a usable work queue without any external broker. Each worker atomically claims a different row, so ten workers get ten different jobs rather than nine of them blocking.</p>
<p><strong>Rules for using locks safely:</strong> keep the transaction short (never do HTTP calls or user interaction while holding locks); acquire locks in a <strong>consistent order</strong> across the codebase to avoid deadlocks; set a <code>lock_timeout</code> so a pathological case fails fast rather than exhausting the connection pool; and prefer <strong>optimistic locking</strong> (a version column) when contention is low, since it takes no locks at all.</p>
<p>Also worth stating: an atomic single statement — <code>UPDATE account SET balance = balance - 100 WHERE id = 1 AND balance &gt;= 100</code> — needs no explicit lock at all and is usually the best option for simple counters and balances.</p>`
},
{
  q: "What are database views, materialised views and CTEs — when do you use each?",
  level: "advanced", tags: ["queries", "design"],
  a: `<table>
<tr><th></th><th>View</th><th>Materialised view</th><th>CTE</th></tr>
<tr><td>Storage</td><td>None — a stored query</td><td>Stores the result</td><td>None — scoped to one statement</td></tr>
<tr><td>Freshness</td><td>Always current</td><td>As of the last refresh</td><td>Current</td></tr>
<tr><td>Read cost</td><td>Runs the underlying query every time</td><td>Cheap — reads a table</td><td>Runs each time</td></tr>
<tr><td>Indexable</td><td>No</td><td><strong>Yes</strong></td><td>No</td></tr>
<tr><td>Scope</td><td>Database-wide, reusable</td><td>Database-wide</td><td>One query</td></tr>
</table>
<pre><code>-- View: encapsulate a complex join, or expose a restricted projection
CREATE VIEW active_customer_summary AS
SELECT c.id, c.name, count(o.id) AS order_count, coalesce(sum(o.total), 0) AS lifetime_value
FROM customer c LEFT JOIN orders o ON o.customer_id = c.id
WHERE c.status = 'ACTIVE'
GROUP BY c.id, c.name;

-- Materialised view: expensive aggregate read many times, staleness acceptable
CREATE MATERIALIZED VIEW daily_revenue AS
SELECT date_trunc('day', created_at) AS day, region, sum(total) AS revenue
FROM orders GROUP BY 1, 2;

CREATE UNIQUE INDEX ON daily_revenue (day, region);        -- required for CONCURRENTLY
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;      -- no read lock during refresh</code></pre>
<p><strong>When each earns its place:</strong></p>
<ul>
<li><strong>View</strong> — to hide complexity behind a stable name, or as a <em>security boundary</em>: grant access to a view exposing three columns rather than the whole table. Note it does not make the underlying query faster.</li>
<li><strong>Materialised view</strong> — dashboards and reports over expensive aggregates, where data that is an hour old is perfectly acceptable. The <code>CONCURRENTLY</code> refresh is essential in production; a plain refresh takes an exclusive lock and blocks readers.</li>
<li><strong>CTE</strong> — readability within a single query, and recursion for hierarchies.</li>
</ul>
<p><strong>Caveats:</strong> nested views (a view over a view over a view) produce plans the optimiser handles badly and nobody can debug. And a materialised view must be refreshed by something — a scheduled job or <code>pg_cron</code> — with monitoring, or it silently serves month-old data.</p>`
},
{
  q: "How do you write an efficient pagination query for a large table?",
  level: "advanced", hot: true, tags: ["performance", "pagination"],
  a: `<pre><code>-- ✘ OFFSET pagination — degrades linearly with depth
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 100000;
-- The database must generate and DISCARD 100,000 rows before returning 20.
-- Page 1: 2ms.  Page 5000: 800ms.  It also skips or repeats rows if data
-- changes between pages, because the offset shifts.

-- ✔ KEYSET (cursor) pagination — O(log n) at any depth, and stable
SELECT * FROM orders
WHERE (created_at, id) &lt; (:lastCreatedAt, :lastId)      -- row-value comparison
ORDER BY created_at DESC, id DESC
LIMIT 20;

CREATE INDEX idx_orders_keyset ON orders (created_at DESC, id DESC);</code></pre>
<p><strong>Why the tuple comparison matters:</strong> <code>(created_at, id) &lt; (:ts, :id)</code> is a single row-value comparison the index can seek on directly. Writing it as <code>created_at &lt; :ts OR (created_at = :ts AND id &lt; :id)</code> is logically equivalent but often produces a worse plan, and it is much easier to get wrong. The <code>id</code> tiebreaker is required — without it, rows sharing a timestamp are skipped or duplicated.</p>
<pre><code>-- Encode the cursor as an opaque token so you can change the implementation later
{ "content": [...], "nextCursor": "eyJ0cyI6IjIwMjYtMDktMDYiLCJpZCI6OTF9" }</code></pre>
<p><strong>The other cost of offset pagination:</strong> returning <code>totalElements</code> requires a separate <code>COUNT(*)</code> over the whole filtered set, which on a large table can be slower than the page query itself. Options: return a <code>Slice</code> with only "has next" (fetch <code>limit + 1</code> rows), use an approximate count from statistics, or cache the count.</p>
<p><strong>The honest trade-off:</strong> keyset pagination cannot jump to "page 500" — it only moves forward and backward. For an infinite-scroll feed or an API, that is exactly right. For an admin screen with numbered pages over a modest table, offset is fine. Choose from the access pattern, and always cap the page size server-side.</p>`
},
{
  q: "What are common SQL query anti-patterns?",
  level: "advanced", hot: true, tags: ["performance", "review"],
  a: `<pre><code>-- 1. Functions on indexed columns — kills index usage (not sargable)
✘ WHERE YEAR(created_at) = 2026
✔ WHERE created_at &gt;= '2026-01-01' AND created_at &lt; '2027-01-01'
✘ WHERE UPPER(email) = 'A@B.COM'
✔ CREATE INDEX ON users (lower(email));  -- then WHERE lower(email) = 'a@b.com'

-- 2. Leading wildcard
✘ WHERE name LIKE '%smith%'        -- full scan; use a trigram or full-text index
✔ WHERE name LIKE 'smith%'         -- can use a B-tree index

-- 3. SELECT * on wide tables — reads LOB/TEXT columns you never use,
--    and prevents index-only scans
✔ SELECT id, name, total FROM orders

-- 4. Implicit type conversion
✘ WHERE customer_id = '123'        -- varchar vs bigint may disable the index
✔ WHERE customer_id = 123

-- 5. OR across different columns — often prevents index use
✘ WHERE customer_id = 5 OR reference = 'X'
✔ two queries with UNION

-- 6. Correlated subquery in SELECT — executes once PER ROW
✘ SELECT c.name, (SELECT count(*) FROM orders o WHERE o.customer_id = c.id) FROM customer c
✔ LEFT JOIN with GROUP BY, or a window function

-- 7. DISTINCT to hide a wrong join — masks row multiplication, adds a sort
✘ SELECT DISTINCT c.* FROM customer c JOIN orders o ON ...
✔ WHERE EXISTS (...)

-- 8. Unbounded queries
✘ SELECT * FROM events;            -- fine in dev with 100 rows, fatal at 100 million
✔ always paginate

-- 9. N+1 from the application — one query per row in a loop
✔ one query with an IN clause, or a join

-- 10. NOT IN with a nullable column — silently returns zero rows
✔ NOT EXISTS</code></pre>
<p><strong>The unifying idea to state:</strong> most of these prevent the optimiser from using an index — the term is <em>sargable</em> (Search ARGument ABLE). Any expression that wraps the indexed column in a function, or forces a type conversion, moves the work from an index seek to a full scan. Keep the column bare on one side of the comparison.</p>
<p>And the meta-point: <strong>verify with <code>EXPLAIN ANALYZE</code>, do not assume.</strong> Optimisers differ and improve; something that was slow on an older version may be rewritten automatically now.</p>`
},
{
  q: "Write a query to find gaps and islands in a sequence",
  level: "advanced", tags: ["practice", "window-functions"],
  a: `<p>A classic window-function problem — finding consecutive runs ("islands") and the missing ranges between them ("gaps"). It comes up for attendance streaks, uptime periods, booking availability and invoice number auditing.</p>
<pre><code>-- ISLANDS: group consecutive dates a user was active
WITH numbered AS (
    SELECT user_id, activity_date,
           activity_date - (ROW_NUMBER() OVER (PARTITION BY user_id
                                               ORDER BY activity_date))::int AS grp
    FROM user_activity
)
SELECT user_id,
       MIN(activity_date) AS streak_start,
       MAX(activity_date) AS streak_end,
       COUNT(*)           AS streak_length
FROM numbered
GROUP BY user_id, grp
ORDER BY streak_length DESC;</code></pre>
<p><strong>The trick, which is the whole answer:</strong> for consecutive dates, <code>date − row_number</code> is <em>constant</em>. Day 1 minus row 1, day 2 minus row 2, day 3 minus row 3 all give the same value. A gap breaks the pattern and produces a new constant — so grouping by that difference groups the consecutive runs.</p>
<pre><code>-- GAPS: find missing ranges using LAG
SELECT prev_end + 1 AS gap_start,
       activity_date - 1 AS gap_end
FROM (
    SELECT activity_date,
           LAG(activity_date) OVER (ORDER BY activity_date) AS prev_end
    FROM user_activity WHERE user_id = 1
) t
WHERE activity_date - prev_end &gt; 1;

-- Missing invoice numbers (integer sequence)
SELECT prev_num + 1 AS missing_from, num - 1 AS missing_to
FROM (SELECT num, LAG(num) OVER (ORDER BY num) AS prev_num FROM invoice) t
WHERE num - prev_num &gt; 1;</code></pre>
<p><strong>Related problems in the same family:</strong> longest login streak, consecutive days meeting a target, merging overlapping date ranges, and finding the first available slot. Recognising "this is gaps and islands" is what turns a hard-looking question into a five-line query.</p>`
},
{
  q: "How do you design a schema for a many-to-many relationship with attributes?",
  level: "beginner", hot: true, tags: ["design", "modelling"],
  a: `<pre><code>-- ✘ Plain junction table — cannot record WHEN, WHAT GRADE, or WHO enrolled them
CREATE TABLE student_course (
    student_id bigint REFERENCES student(id),
    course_id  bigint REFERENCES course(id),
    PRIMARY KEY (student_id, course_id)
);

-- ✔ Model the relationship as an ENTITY in its own right
CREATE TABLE enrollment (
    id           bigserial PRIMARY KEY,        -- surrogate key, useful for references
    student_id   bigint NOT NULL REFERENCES student(id),
    course_id    bigint NOT NULL REFERENCES course(id),
    enrolled_at  timestamptz NOT NULL DEFAULT now(),
    status       text NOT NULL DEFAULT 'ACTIVE'
                 CHECK (status IN ('ACTIVE','COMPLETED','WITHDRAWN')),
    grade        numeric(4,2),
    enrolled_by  bigint REFERENCES staff(id),

    UNIQUE (student_id, course_id)             -- business rule, still enforced
);

-- Index BOTH directions — you will query from both sides
CREATE INDEX ON enrollment (student_id, status);
CREATE INDEX ON enrollment (course_id, status);</code></pre>
<p><strong>Why this is almost always the right call:</strong> relationships accumulate attributes. Today it is "student takes course"; in three months someone asks when they enrolled, who approved it, what grade they got, and whether they withdrew. A plain junction table cannot answer any of that without a schema migration and a JPA remodel.</p>
<p><strong>The JPA consequence</strong> is worth connecting: this is exactly why <code>@ManyToMany</code> is discouraged. It maps only the bare junction table, offers nowhere to put attributes, and Hibernate deletes and re-inserts the whole set when the collection changes. Modelling it as an entity with two <code>@ManyToOne</code>s gives you full control.</p>
<p><strong>Design details worth mentioning:</strong> a surrogate primary key (rather than the composite) makes the row easy to reference from elsewhere and simpler in JPA; keep the <code>UNIQUE</code> constraint so the business rule is still enforced by the database; index both foreign keys because you will query from both directions; and remember PostgreSQL does <em>not</em> index foreign keys automatically, which is a common cause of slow deletes on the parent.</p>`
}
]);
