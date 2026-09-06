registerTopic("sql", [
{
  q: "Explain all the JOIN types",
  level: "beginner", hot: true, tags: ["joins"],
  a: `<table>
<tr><th>Join</th><th>Returns</th></tr>
<tr><td><code>INNER JOIN</code></td><td>Only rows matching in both tables</td></tr>
<tr><td><code>LEFT [OUTER] JOIN</code></td><td>All left rows + matches; NULLs where no match</td></tr>
<tr><td><code>RIGHT [OUTER] JOIN</code></td><td>All right rows + matches</td></tr>
<tr><td><code>FULL [OUTER] JOIN</code></td><td>All rows from both sides</td></tr>
<tr><td><code>CROSS JOIN</code></td><td>Cartesian product — every combination</td></tr>
<tr><td><code>SELF JOIN</code></td><td>A table joined to itself (employee → manager)</td></tr>
</table>
<pre><code>-- Find customers with NO orders — the "anti-join", a very common question
SELECT c.id, c.name
FROM customer c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;                      -- the giveaway line

-- Self join: employees and their managers
SELECT e.name AS employee, m.name AS manager
FROM employee e
LEFT JOIN employee m ON e.manager_id = m.id;</code></pre>
<blockquote><p><strong>The classic trap:</strong> putting a condition on the right table in the <code>WHERE</code> clause of a LEFT JOIN silently turns it into an INNER JOIN, because <code>NULL = 'X'</code> is never true. Put such conditions in the <code>ON</code> clause instead:</p>
<pre><code>-- WRONG: behaves like an inner join
LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'PAID'
-- RIGHT: keeps customers with no paid orders
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'PAID'</code></pre></blockquote>`
},
{
  q: "What is the logical order of execution of a SQL query?",
  level: "advanced", hot: true, tags: ["fundamentals"],
  a: `<p>SQL is written in one order and executed in another — which explains most beginner errors.</p>
<ol>
<li><code>FROM</code> / <code>JOIN</code> — build the working set</li>
<li><code>WHERE</code> — filter <em>rows</em></li>
<li><code>GROUP BY</code> — form groups</li>
<li><code>HAVING</code> — filter <em>groups</em></li>
<li><code>SELECT</code> — evaluate expressions and aliases</li>
<li><code>DISTINCT</code></li>
<li><code>ORDER BY</code></li>
<li><code>LIMIT</code> / <code>OFFSET</code></li>
</ol>
<p><strong>What this explains:</strong></p>
<ul>
<li>You cannot use a <code>SELECT</code> alias in <code>WHERE</code> — <code>WHERE</code> runs first. (Most databases <em>do</em> allow it in <code>ORDER BY</code>, which runs later.)</li>
<li><code>WHERE</code> cannot contain aggregate functions — groups do not exist yet. Use <code>HAVING</code>.</li>
<li><code>WHERE</code> filters before aggregation (cheaper, filters rows); <code>HAVING</code> filters after (works on aggregate results). Prefer <code>WHERE</code> wherever possible.</li>
</ul>
<pre><code>SELECT department, COUNT(*) AS headcount
FROM employee
WHERE active = true            -- 2: filter rows first (cheap)
GROUP BY department            -- 3
HAVING COUNT(*) &gt; 5            -- 4: filter groups
ORDER BY headcount DESC        -- 7: alias IS allowed here
LIMIT 10;                      -- 8</code></pre>`
},
{
  q: "What are window functions and how do they differ from GROUP BY?",
  level: "advanced", hot: true, tags: ["window-functions"],
  a: `<p><code>GROUP BY</code> <strong>collapses</strong> rows into one row per group. A window function <strong>keeps every row</strong> and adds a computed value based on a related set of rows.</p>
<pre><code>-- Rank employees by salary within each department
SELECT name, department, salary,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn,
       RANK()       OVER (PARTITION BY department ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense,
       AVG(salary)  OVER (PARTITION BY department) AS dept_avg,
       salary - LAG(salary) OVER (ORDER BY salary) AS diff_from_previous
FROM employee;</code></pre>
<table>
<tr><th>Function</th><th>Behaviour on ties (values 100, 90, 90, 80)</th></tr>
<tr><td><code>ROW_NUMBER()</code></td><td>1, 2, 3, 4 — always unique</td></tr>
<tr><td><code>RANK()</code></td><td>1, 2, 2, 4 — gaps after ties</td></tr>
<tr><td><code>DENSE_RANK()</code></td><td>1, 2, 2, 3 — no gaps</td></tr>
</table>
<pre><code>-- The single most-asked window query: top N per group
SELECT * FROM (
  SELECT name, department, salary,
         DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS r
  FROM employee
) t WHERE r &lt;= 3;                     -- top 3 earners per department

-- Running total
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM orders;

-- 7-day moving average
AVG(amount) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)</code></pre>
<p>Other useful ones: <code>LAG</code>/<code>LEAD</code> (previous/next row — great for computing deltas and gaps), <code>FIRST_VALUE</code>/<code>LAST_VALUE</code>, <code>NTILE(n)</code> for percentile buckets.</p>`
},
{
  q: "Find the Nth highest salary",
  level: "beginner", hot: true, tags: ["puzzle", "practice"],
  a: `<pre><code>-- 1. Window function — the modern, correct answer (handles ties explicitly)
SELECT DISTINCT salary
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employee) t
WHERE r = 2;                              -- 2nd highest DISTINCT salary

-- 2. LIMIT/OFFSET — simple, but counts duplicate salaries as separate ranks
SELECT DISTINCT salary FROM employee ORDER BY salary DESC LIMIT 1 OFFSET 1;

-- 3. Correlated subquery — the classic interview answer, O(n^2), avoid in production
SELECT salary FROM employee e1
WHERE 1 = (SELECT COUNT(DISTINCT salary) FROM employee e2 WHERE e2.salary &gt; e1.salary);

-- 4. Self-join variant
SELECT MAX(salary) FROM employee
WHERE salary &lt; (SELECT MAX(salary) FROM employee);   -- 2nd highest only</code></pre>
<p><strong>What the interviewer is really testing:</strong> whether you ask about <em>ties</em>. If two people earn the top salary, is the "2nd highest" the same value or the next distinct one? Say this out loud, then pick <code>DENSE_RANK</code> for distinct salary levels or <code>ROW_NUMBER</code> for the Nth <em>person</em>.</p>
<p>Also mention the edge case: if there is no Nth salary, the window version returns no rows while the <code>MAX</code> subquery returns <code>NULL</code> — which behaviour the caller wants matters.</p>`
},
{
  q: "How do database indexes work?",
  level: "advanced", hot: true, tags: ["indexes", "performance"],
  a: `<p>An index is a separate data structure — almost always a <strong>B+ tree</strong> — that maps column values to row locations, turning an O(n) table scan into an O(log n) lookup.</p>
<figure class="fig">
<svg viewBox="0 0 600 160" role="img" aria-label="B+ tree index structure">
  <rect class="dg-fill" x="240" y="10" width="120" height="30" rx="6"/><text class="dg-m" x="300" y="30" text-anchor="middle">[ 50 | 100 ]</text>
  <path class="dg-line" d="M270 40 V60 H130 V72 M300 40 V72 M330 40 V60 H470 V72"/>
  <rect class="dg-fill2" x="70" y="72" width="120" height="28" rx="5"/><text class="dg-m" x="130" y="91" text-anchor="middle">[20|35]</text>
  <rect class="dg-fill2" x="240" y="72" width="120" height="28" rx="5"/><text class="dg-m" x="300" y="91" text-anchor="middle">[70|85]</text>
  <rect class="dg-fill2" x="410" y="72" width="120" height="28" rx="5"/><text class="dg-m" x="470" y="91" text-anchor="middle">[120|150]</text>
  <rect class="dg-box" x="30" y="116" width="540" height="30" rx="6"/>
  <text class="dg-s" x="300" y="136" text-anchor="middle">leaf level: sorted keys → row pointers, linked left-to-right for range scans</text>
</svg>
<figcaption>Leaves are linked, which is why B+ trees excel at range queries and ORDER BY.</figcaption>
</figure>
<p><strong>Index types:</strong></p>
<ul>
<li><strong>B-tree</strong> — the default. Handles <code>=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>, <code>LIKE 'abc%'</code>, and <code>ORDER BY</code>.</li>
<li><strong>Hash</strong> — equality only, no ranges.</li>
<li><strong>Composite</strong> — multiple columns; order matters enormously (see below).</li>
<li><strong>Covering index</strong> — includes every column the query needs, so the table itself is never read ("index-only scan").</li>
<li><strong>Partial/filtered</strong> — <code>WHERE status = 'ACTIVE'</code>; much smaller when most rows are irrelevant.</li>
<li><strong>Unique</strong> — an index that also enforces a constraint.</li>
</ul>
<p><strong>The costs</strong> — always mention these, because indexes are not free: every <code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code> must maintain every index; they consume disk and memory; and too many indexes slow writes measurably. Index for the queries you actually run, then verify with <code>EXPLAIN</code>.</p>`
},
{
  q: "What is a composite index and why does column order matter?",
  level: "advanced", hot: true, tags: ["indexes"],
  a: `<p>A composite index on <code>(a, b, c)</code> is sorted by <code>a</code>, then within equal <code>a</code> by <code>b</code>, then by <code>c</code> — exactly like a phone book sorted by surname, then first name.</p>
<p><strong>The leftmost-prefix rule:</strong> the index can be used for a query only if it filters on a leading contiguous prefix of the columns.</p>
<pre><code>CREATE INDEX idx ON orders (customer_id, status, created_at);

✔ WHERE customer_id = 1                                    -- prefix (a)
✔ WHERE customer_id = 1 AND status = 'PAID'                -- prefix (a,b)
✔ WHERE customer_id = 1 AND status = 'PAID' AND created_at &gt; ...   -- full
✔ WHERE customer_id = 1 ORDER BY status, created_at        -- sorting for free
✘ WHERE status = 'PAID'                                    -- skips 'a' — cannot use
✘ WHERE created_at &gt; ...                                   -- skips 'a' and 'b'
⚠ WHERE customer_id = 1 AND created_at &gt; ...               -- uses only 'a', then filters</code></pre>
<p><strong>Ordering guidance:</strong></p>
<ul>
<li>Put <strong>equality</strong> columns before <strong>range</strong> columns. Once the index hits a range predicate, later columns can no longer be used for seeking.</li>
<li>Put the most <strong>selective</strong> column first when all else is equal — though the equality-before-range rule matters more.</li>
<li>Match your <code>ORDER BY</code> so the database can skip the sort entirely.</li>
</ul>
<p><strong>A practical consequence:</strong> one well-designed composite index often replaces three single-column indexes — fewer indexes to maintain, and better plans. Interviewers like candidates who realise that "add an index on each column in the WHERE clause" is usually wrong.</p>`
},
{
  q: "What is the difference between WHERE and HAVING?",
  level: "beginner", tags: ["fundamentals"],
  a: `<table>
<tr><th></th><th>WHERE</th><th>HAVING</th></tr>
<tr><td>Filters</td><td>Individual rows</td><td>Groups</td></tr>
<tr><td>Runs</td><td>Before <code>GROUP BY</code></td><td>After <code>GROUP BY</code></td></tr>
<tr><td>Aggregates</td><td>Not allowed</td><td>Allowed</td></tr>
<tr><td>Uses indexes</td><td>Yes</td><td>No — operates on the computed result</td></tr>
</table>
<pre><code>SELECT department, AVG(salary) AS avg_salary
FROM employee
WHERE active = true              -- filter rows BEFORE grouping (fast, uses index)
GROUP BY department
HAVING AVG(salary) &gt; 50000;      -- filter groups AFTER aggregation</code></pre>
<p><strong>Performance rule:</strong> push every condition you can into <code>WHERE</code>. Filtering a million rows down to a thousand before grouping is dramatically cheaper than grouping a million and then discarding groups. A <code>HAVING</code> clause that does not reference an aggregate should almost always be a <code>WHERE</code>.</p>`
},
{
  q: "Explain ACID properties",
  level: "beginner", hot: true, tags: ["transactions"],
  a: `<ul>
<li><strong>Atomicity</strong> — all or nothing. A transfer that debits one account must credit the other, or neither happens. Implemented via undo logs / rollback segments.</li>
<li><strong>Consistency</strong> — the database moves from one valid state to another; all constraints (foreign keys, checks, uniqueness) hold before and after. Note this is partly the <em>application's</em> responsibility, not just the engine's.</li>
<li><strong>Isolation</strong> — concurrent transactions do not interfere; the result is as if they ran in some serial order. Implemented via locking or MVCC, and tunable by isolation level.</li>
<li><strong>Durability</strong> — once committed, the data survives a crash. Implemented via write-ahead logging: the log is fsynced to disk before the commit returns.</li>
</ul>
<p><strong>Nuance worth adding:</strong> the "C" is the odd one out — it is not a property the database enforces alone, and in distributed systems the "C" in CAP means something different (linearizability). Distinguishing those two Cs is a good senior signal.</p>
<p>Also worth stating: isolation is the property you routinely <em>weaken</em> for performance, which is exactly why isolation levels and the anomalies they permit are worth knowing.</p>`
},
{
  q: "What are the transaction isolation levels and the anomalies they prevent?",
  level: "advanced", hot: true, tags: ["transactions"],
  a: `<table>
<tr><th>Level</th><th>Dirty read</th><th>Non-repeatable read</th><th>Phantom read</th></tr>
<tr><td>READ UNCOMMITTED</td><td>✘ possible</td><td>✘</td><td>✘</td></tr>
<tr><td>READ COMMITTED</td><td>✔ prevented</td><td>✘</td><td>✘</td></tr>
<tr><td>REPEATABLE READ</td><td>✔</td><td>✔</td><td>✘ (✔ in PostgreSQL)</td></tr>
<tr><td>SERIALIZABLE</td><td>✔</td><td>✔</td><td>✔</td></tr>
</table>
<ul>
<li><strong>Dirty read</strong> — reading uncommitted data that may be rolled back.</li>
<li><strong>Non-repeatable read</strong> — reading the same <em>row</em> twice gives different values.</li>
<li><strong>Phantom read</strong> — re-running the same <em>range query</em> returns new rows.</li>
<li><strong>Lost update</strong> — two transactions read, modify and write; one overwrites the other. Not in the standard table, but the one that actually causes production bugs.</li>
</ul>
<p><strong>Defaults:</strong> PostgreSQL and Oracle → READ COMMITTED. MySQL InnoDB → REPEATABLE READ. SQL Server → READ COMMITTED.</p>
<p><strong>The practical answer:</strong> raising the isolation level costs concurrency and increases deadlocks. Most systems stay at READ COMMITTED and handle the specific problem they have — optimistic locking with a version column for lost updates, or an atomic statement like <code>UPDATE account SET balance = balance - 100 WHERE id = ? AND balance &gt;= 100</code>, which needs no elevated isolation at all.</p>`
},
{
  q: "What is normalization? Explain 1NF, 2NF, 3NF",
  level: "beginner", hot: true, tags: ["design"],
  a: `<p>Normalisation organises tables to eliminate redundancy and update anomalies.</p>
<ul>
<li><strong>1NF</strong> — atomic values only; no repeating groups or comma-separated lists in a column. Each row is unique.</li>
<li><strong>2NF</strong> — 1NF plus: every non-key column depends on the <em>whole</em> primary key (removes partial dependencies; only relevant with composite keys).</li>
<li><strong>3NF</strong> — 2NF plus: no non-key column depends on another non-key column (removes transitive dependencies).</li>
<li><strong>BCNF</strong> — a stricter 3NF: every determinant is a candidate key.</li>
</ul>
<pre><code>-- Violates 3NF: dept_name depends on dept_id, not on emp_id
employee(emp_id PK, name, dept_id, dept_name, dept_location)

-- 3NF
employee(emp_id PK, name, dept_id FK)
department(dept_id PK, dept_name, dept_location)</code></pre>
<p><strong>Why it matters:</strong> in the un-normalised version, renaming a department means updating thousands of rows (update anomaly), a department with no employees cannot exist (insertion anomaly), and deleting the last employee loses the department (deletion anomaly).</p>
<p><strong>Denormalisation</strong> is the deliberate reverse — duplicating data to avoid joins on read-heavy paths. Legitimate when you have measured the join cost, and it always creates a consistency obligation you must own (triggers, application logic, or an async projection). The standard advice: <em>normalise until it hurts, denormalise until it works.</em></p>`
},
{
  q: "How do you read and use EXPLAIN / EXPLAIN ANALYZE?",
  level: "advanced", hot: true, tags: ["performance", "tuning"],
  a: `<pre><code>EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, c.name FROM orders o JOIN customer c ON c.id = o.customer_id
WHERE o.status = 'PAID' AND o.created_at &gt; now() - interval '7 days';</code></pre>
<p><code>EXPLAIN</code> shows the planner's <em>estimated</em> plan; <code>EXPLAIN ANALYZE</code> actually runs it and shows real timings and row counts.</p>
<table>
<tr><th>Node</th><th>Meaning</th></tr>
<tr><td><strong>Seq Scan</strong></td><td>Full table read. Fine on small tables; a red flag on large ones with a selective filter</td></tr>
<tr><td><strong>Index Scan</strong></td><td>Index lookup then fetch the row from the table</td></tr>
<tr><td><strong>Index Only Scan</strong></td><td>Best case — answered entirely from the index (covering index)</td></tr>
<tr><td><strong>Bitmap Heap Scan</strong></td><td>Many matching rows; collect them, then read the table in physical order</td></tr>
<tr><td><strong>Nested Loop</strong></td><td>Good when the outer side is small; terrible when it is large</td></tr>
<tr><td><strong>Hash Join</strong></td><td>Builds a hash table — good for large unsorted joins</td></tr>
<tr><td><strong>Merge Join</strong></td><td>Both inputs sorted — good with matching indexes</td></tr>
</table>
<p><strong>What to look for, in order:</strong></p>
<ol>
<li><strong>Estimated vs actual rows.</strong> A big divergence means stale statistics — run <code>ANALYZE</code>. Bad estimates cause bad plans, and this is the most common root cause.</li>
<li><strong>The widest/slowest node</strong> — read the plan bottom-up; the deepest expensive node is your problem.</li>
<li><strong>Sequential scans on large tables</strong> with a selective <code>WHERE</code> → missing index.</li>
<li><strong>Sort or Hash spilling to disk</strong> (<code>external merge Disk: 24MB</code>) → increase <code>work_mem</code> or avoid the sort with an index.</li>
<li><strong>Nested loop over many rows</strong> → often a missing index on the inner side.</li>
<li><strong>Rows Removed by Filter</strong> — you read far more than you needed.</li>
</ol>
<p>Say that you would use <a href="https://explain.dalibo.com" target="_blank" rel="noopener">visual plan tools</a> for complex plans, and that you always compare plans <em>before and after</em> a change rather than assuming an index helped.</p>`
},
{
  q: "Write a query to find duplicate rows and delete them",
  level: "advanced", hot: true, tags: ["puzzle", "practice"],
  a: `<pre><code>-- Find duplicates by email
SELECT email, COUNT(*) AS cnt, MIN(id) AS keep_id
FROM users
GROUP BY email
HAVING COUNT(*) &gt; 1;

-- Delete duplicates, keeping the lowest id — window function version (portable, clear)
DELETE FROM users
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM users
  ) t WHERE rn &gt; 1
);

-- PostgreSQL: using the physical row id, very concise
DELETE FROM users a USING users b
WHERE a.id &gt; b.id AND a.email = b.email;

-- Then prevent it happening again — the answer they actually want
CREATE UNIQUE INDEX CONCURRENTLY uq_users_email ON users (lower(email));</code></pre>
<p><strong>What separates a good answer:</strong> after cleaning up, add the unique constraint. Deduplicating without fixing the cause means you will do it again next quarter. Mention that <code>CONCURRENTLY</code> avoids locking the table in PostgreSQL, that you would run the <code>SELECT</code> first to confirm the scope, and that on a large table you would delete in batches to avoid a long transaction and replication lag.</p>`
},
{
  q: "What is the difference between DELETE, TRUNCATE and DROP?",
  level: "beginner", tags: ["ddl"],
  a: `<table>
<tr><th></th><th>DELETE</th><th>TRUNCATE</th><th>DROP</th></tr>
<tr><td>Type</td><td>DML</td><td>DDL</td><td>DDL</td></tr>
<tr><td>Removes</td><td>Selected rows</td><td>All rows</td><td>The table itself</td></tr>
<tr><td><code>WHERE</code></td><td>Yes</td><td>No</td><td>No</td></tr>
<tr><td>Speed</td><td>Slow — row by row, fully logged</td><td>Fast — deallocates pages</td><td>Fast</td></tr>
<tr><td>Rollback</td><td>Yes</td><td>In PostgreSQL yes; in MySQL/Oracle no</td><td>Same caveat</td></tr>
<tr><td>Triggers</td><td>Fire</td><td>Do not fire</td><td>N/A</td></tr>
<tr><td>Identity/sequence</td><td>Not reset</td><td>Usually reset</td><td>Gone</td></tr>
</table>
<p><strong>Practical guidance:</strong> use <code>DELETE</code> for selective removal and when triggers or auditing must run; <code>TRUNCATE</code> to empty a staging table quickly; <code>DROP</code> only in migrations. On a huge table, a single <code>DELETE</code> of millions of rows creates a long transaction, bloats the undo log and blocks vacuum — batch it in chunks of a few thousand with a commit between.</p>`
},
{
  q: "What are CTEs and recursive queries?",
  level: "advanced", tags: ["queries"],
  a: `<p>A <strong>Common Table Expression</strong> (<code>WITH</code>) names a subquery, making complex SQL readable and letting you reference the same result more than once.</p>
<pre><code>WITH monthly AS (
    SELECT date_trunc('month', created_at) AS month,
           customer_id, SUM(total) AS revenue
    FROM orders
    WHERE created_at &gt;= now() - interval '1 year'
    GROUP BY 1, 2
),
ranked AS (
    SELECT *, RANK() OVER (PARTITION BY month ORDER BY revenue DESC) AS r
    FROM monthly
)
SELECT month, customer_id, revenue FROM ranked WHERE r &lt;= 5;</code></pre>
<p><strong>Recursive CTE</strong> — for hierarchies and graphs, which is otherwise very hard in SQL:</p>
<pre><code>WITH RECURSIVE org AS (
    SELECT id, name, manager_id, 1 AS level         -- anchor: the top
    FROM employee WHERE manager_id IS NULL
  UNION ALL
    SELECT e.id, e.name, e.manager_id, org.level + 1 -- recursive part
    FROM employee e
    JOIN org ON e.manager_id = org.id
)
SELECT repeat('  ', level - 1) || name AS tree, level FROM org ORDER BY level;</code></pre>
<p><strong>Uses:</strong> org charts, category trees, bill of materials, graph traversal, and generating date series to fill gaps in reports.</p>
<p><strong>Caveats:</strong> always bound the recursion (<code>WHERE level &lt; 20</code>) or a cycle in the data becomes an infinite loop. And note that in PostgreSQL before version 12 a CTE was an <em>optimisation fence</em> (always materialised); since 12 it can be inlined, with <code>MATERIALIZED</code>/<code>NOT MATERIALIZED</code> to control it explicitly.</p>`
},
{
  q: "How do you optimise a slow SQL query?",
  level: "advanced", hot: true, tags: ["performance", "production"],
  a: `<ol>
<li><strong>Measure first.</strong> Find the actual slow queries — <code>pg_stat_statements</code>, the slow query log, or APM. Do not optimise what you assume is slow.</li>
<li><strong>Run <code>EXPLAIN ANALYZE</code></strong> and identify the expensive node.</li>
<li><strong>Check for missing indexes</strong> — sequential scans with selective filters, and unindexed foreign keys (PostgreSQL does not index them automatically).</li>
<li><strong>Reduce the data touched.</strong> Select only the columns you need (never <code>SELECT *</code> on wide tables); filter as early as possible; avoid <code>DISTINCT</code> that hides a wrong join.</li>
<li><strong>Fix predicates that defeat indexes:</strong>
<pre><code>✘ WHERE YEAR(created_at) = 2026        -- function on the column
✔ WHERE created_at &gt;= '2026-01-01' AND created_at &lt; '2027-01-01'
✘ WHERE LOWER(email) = 'a@b.com'       -- unless you have a functional index
✔ CREATE INDEX ON users (lower(email));
✘ WHERE name LIKE '%smith%'            -- leading wildcard: no index (use trigram/full-text)
✘ WHERE status != 'DONE'               -- low selectivity, often a scan anyway</code></pre></li>
<li><strong>Update statistics</strong> — <code>ANALYZE</code>. Bad row estimates cause bad plans.</li>
<li><strong>Rewrite the query</strong> — replace correlated subqueries with joins or window functions; use <code>EXISTS</code> instead of <code>IN</code> with a large subquery; avoid <code>OR</code> across different columns (a <code>UNION ALL</code> is often faster).</li>
<li><strong>Fix pagination</strong> — deep <code>OFFSET</code> is O(n); switch to keyset pagination.</li>
<li><strong>Consider structure</strong> — partitioning a huge table, a materialised view for an expensive aggregate, or denormalising a hot read path.</li>
<li><strong>Verify the fix</strong> on realistic data volumes, and confirm you have not slowed down writes with a new index.</li>
</ol>`
},
{
  q: "What is the difference between clustered and non-clustered indexes?",
  level: "advanced", tags: ["indexes"],
  a: `<ul>
<li><strong>Clustered index</strong> — determines the <em>physical order</em> of rows in the table. The leaf level <em>is</em> the table data. Only one per table.</li>
<li><strong>Non-clustered (secondary) index</strong> — a separate structure whose leaves hold pointers back to the row. Many per table.</li>
</ul>
<table>
<tr><th></th><th>Clustered</th><th>Non-clustered</th></tr>
<tr><td>Count per table</td><td>1</td><td>Many</td></tr>
<tr><td>Range queries</td><td>Excellent — rows are physically adjacent</td><td>Extra lookups per row</td></tr>
<tr><td>Extra storage</td><td>None (it is the table)</td><td>Yes</td></tr>
<tr><td>Insert cost</td><td>Higher with random keys — causes page splits</td><td>Lower</td></tr>
</table>
<p><strong>Engine differences worth knowing:</strong></p>
<ul>
<li><strong>MySQL InnoDB</strong> — always clusters by the primary key. Secondary indexes store the PK value, so every secondary lookup costs a second traversal of the clustered index. This is why a <em>short, monotonically increasing</em> primary key matters so much in InnoDB — a random UUID PK causes page splits and bloats every secondary index.</li>
<li><strong>PostgreSQL</strong> — has <strong>no</strong> clustered index. All indexes are secondary, pointing at heap tuples. The <code>CLUSTER</code> command physically reorders a table once but does not maintain it.</li>
<li><strong>SQL Server</strong> — primary key is clustered by default, but you can choose.</li>
</ul>
<p>Mentioning that PostgreSQL differs here is a strong signal — many candidates assume the InnoDB model is universal.</p>`
},
{
  q: "What is a deadlock in a database and how do you avoid it?",
  level: "advanced", tags: ["transactions", "production"],
  a: `<p>Two transactions each hold a lock the other needs. The database detects the cycle and kills one as the victim, which the application sees as a serialisation/deadlock error.</p>
<pre><code>-- Transaction A                     -- Transaction B
UPDATE account SET .. WHERE id=1;    UPDATE account SET .. WHERE id=2;
UPDATE account SET .. WHERE id=2;    UPDATE account SET .. WHERE id=1;
-- A waits for B's lock on 2         -- B waits for A's lock on 1  -&gt; deadlock</code></pre>
<p><strong>Prevention:</strong></p>
<ol>
<li><strong>Consistent lock ordering</strong> — always acquire in the same order, e.g. ascending primary key. This single rule eliminates most deadlocks:
<pre><code>UPDATE account SET balance = balance + delta
WHERE id IN (:a, :b) ORDER BY id;   -- or sort the ids in application code</code></pre></li>
<li><strong>Keep transactions short.</strong> Never do an HTTP call, a file read, or user interaction inside a transaction — the lock window becomes seconds instead of milliseconds.</li>
<li><strong>Lower the isolation level</strong> where safe; higher levels take more locks.</li>
<li><strong>Access rows in a predictable order</strong> in batch jobs, and process in smaller batches.</li>
<li><strong>Use optimistic locking</strong> instead of long-held pessimistic locks where contention is low.</li>
<li><strong>Set a <code>lock_timeout</code></strong> so a pathological case fails fast rather than blocking a connection pool.</li>
</ol>
<p><strong>Always retry</strong>: deadlocks are a normal, expected condition in a concurrent system, not a bug to eliminate entirely. Catch the specific exception and retry the whole transaction with a short randomised backoff — that is the answer interviewers want to hear.</p>
<p>Diagnose with PostgreSQL's deadlock log entries (which print both statements) or <code>SHOW ENGINE INNODB STATUS</code> in MySQL.</p>`
},
{
  q: "Write a query for group-wise aggregation with a join and date filtering",
  level: "advanced", tags: ["practice"],
  a: `<pre><code>-- Monthly revenue and order count per customer, including customers with no orders,
-- for the last 12 months, ranked by revenue.
SELECT
    c.id,
    c.name,
    COALESCE(SUM(o.total), 0)              AS revenue,
    COUNT(o.id)                            AS order_count,       -- COUNT(col) ignores NULLs
    COALESCE(AVG(o.total), 0)              AS avg_order_value,
    MAX(o.created_at)                      AS last_order_at,
    COUNT(*) FILTER (WHERE o.status = 'CANCELLED') AS cancelled  -- PostgreSQL
FROM customer c
LEFT JOIN orders o
       ON o.customer_id = c.id
      AND o.created_at &gt;= date_trunc('month', now()) - interval '12 months'
WHERE c.active = true
GROUP BY c.id, c.name
HAVING COALESCE(SUM(o.total), 0) &gt; 0
ORDER BY revenue DESC
LIMIT 50;</code></pre>
<p><strong>Details that demonstrate command of SQL:</strong></p>
<ul>
<li>The date filter is in the <code>ON</code> clause, not <code>WHERE</code> — otherwise the LEFT JOIN collapses to an INNER JOIN.</li>
<li><code>COUNT(o.id)</code> not <code>COUNT(*)</code> — the latter counts 1 for a customer with no orders because the NULL-padded row still exists.</li>
<li><code>COALESCE</code> around aggregates so the API returns 0 rather than null.</li>
<li><code>FILTER</code> (or <code>COUNT(CASE WHEN ... THEN 1 END)</code> for portability) for conditional aggregation without a second query.</li>
<li>An index on <code>orders (customer_id, created_at)</code> makes this fast.</li>
</ul>`
},
{
  q: "What is a stored procedure, and would you use one?",
  level: "beginner", tags: ["procedures"],
  a: `<p>A stored procedure is precompiled SQL (plus procedural logic) stored and executed in the database.</p>
<table>
<tr><th>Pros</th><th>Cons</th></tr>
<tr><td>Reduces network round trips for multi-statement logic</td><td>Business logic split across two codebases</td></tr>
<tr><td>Can be faster — the plan is cached and data stays local</td><td>Hard to version control, review, and test</td></tr>
<tr><td>Centralised access control; callers need no table permissions</td><td>Database-specific — a migration blocker</td></tr>
<tr><td>Useful for bulk data operations</td><td>Poor debugging and observability tooling</td></tr>
<tr><td>—</td><td>Scaling the database is much harder than scaling stateless app servers</td></tr>
</table>
<p><strong>My position, stated honestly:</strong> business logic belongs in the application, where it is versioned, tested, reviewed and observable, and where it scales horizontally. I would use a stored procedure for genuinely data-intensive operations where moving the data to the application is the bottleneck — a large batch update, a complex ETL step, or a bulk merge — and keep the domain rules in code.</p>
<p><strong>Related terms to distinguish:</strong> a <strong>function</strong> returns a value and can be used in a query; a <strong>trigger</strong> fires automatically on DML — powerful but notorious for hidden behaviour that surprises people debugging six months later; a <strong>view</strong> is a stored query, and a <strong>materialised view</strong> stores the result and must be refreshed.</p>`
}
]);
