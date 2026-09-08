appendTopic("sql", [
{
  q: "Find the second highest salary per department — three ways",
  level: "advanced", hot: true, tags: ["practice", "window-functions"],
  companies: ["Amazon", "TCS", "Infosys", "Cognizant", "Accenture", "Adobe", "Flipkart"],
  a: `<pre><code>-- 1. Window function — the modern answer. Handles ties explicitly.
SELECT department, salary, employee_name
FROM (
    SELECT department, salary, employee_name,
           DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
    FROM employee
) t
WHERE rnk = 2;

-- 2. Correlated subquery — works on old databases, O(n²)
SELECT e1.department, MAX(e1.salary)
FROM employee e1
WHERE e1.salary &lt; (SELECT MAX(e2.salary) FROM employee e2
                   WHERE e2.department = e1.department)
GROUP BY e1.department;

-- 3. LATERAL — efficient when you want the top N, not just the 2nd
SELECT d.name, e.employee_name, e.salary
FROM department d
CROSS JOIN LATERAL (
    SELECT employee_name, salary FROM employee
    WHERE department_id = d.id
    ORDER BY salary DESC OFFSET 1 LIMIT 1
) e;</code></pre>
<table>
<tr><th>Function</th><th>Salaries 100, 90, 90, 80</th><th>"2nd highest" returns</th></tr>
<tr><td><code>ROW_NUMBER()</code></td><td>1, 2, 3, 4</td><td>One of the 90s (arbitrary)</td></tr>
<tr><td><code>RANK()</code></td><td>1, 2, 2, 4</td><td>Both 90s</td></tr>
<tr><td><code>DENSE_RANK()</code></td><td>1, 2, 2, 3</td><td>Both 90s</td></tr>
</table>
<p><strong>The question behind the question:</strong> the interviewer wants you to <em>ask about ties</em>. If two people earn the top salary, is the second highest the same value or the next distinct one? Say that out loud before writing SQL — then pick <code>DENSE_RANK</code> for distinct salary <em>levels</em> and <code>ROW_NUMBER</code> for the second <em>person</em>.</p>
<p><strong>Edge cases to mention:</strong> a department with only one employee returns no row from the window version but <code>NULL</code> from the <code>MAX</code> subquery — decide which the caller wants. And <code>NULL</code> salaries sort last in <code>DESC</code> by default in PostgreSQL, so add <code>NULLS LAST</code> explicitly if they exist.</p>
<p><strong>Performance:</strong> the window version scans once and sorts within partitions — O(n log n). The correlated subquery re-scans per row — O(n²), which is fine on 1,000 rows and unusable on 10 million. Say which you would deploy and why.</p>`
},
{
  q: "Write a query to find employees earning more than their manager",
  level: "beginner", hot: true, tags: ["joins", "practice"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "Cognizant", "Zoho", "Amazon"],
  a: `<pre><code>-- Self join — the same table twice under different aliases
SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager,  m.salary AS mgr_salary
FROM employee e
JOIN employee m ON e.manager_id = m.id      -- INNER: excludes the CEO (no manager)
WHERE e.salary &gt; m.salary;

-- Include employees with no manager
SELECT e.name, m.name AS manager
FROM employee e
LEFT JOIN employee m ON e.manager_id = m.id
WHERE m.id IS NULL OR e.salary &gt; m.salary;

-- Related classics in the same family:
-- Employees with NO reports
SELECT e.* FROM employee e
WHERE NOT EXISTS (SELECT 1 FROM employee r WHERE r.manager_id = e.id);

-- Manager and their team size
SELECT m.name, COUNT(e.id) AS team_size
FROM employee m LEFT JOIN employee e ON e.manager_id = m.id
GROUP BY m.id, m.name
HAVING COUNT(e.id) &gt; 3;

-- Full reporting chain — recursive CTE
WITH RECURSIVE chain AS (
    SELECT id, name, manager_id, 1 AS depth, name::text AS path
    FROM employee WHERE id = :startId
  UNION ALL
    SELECT e.id, e.name, e.manager_id, c.depth + 1, c.path || ' > ' || e.name
    FROM employee e JOIN chain c ON e.manager_id = c.id
    WHERE c.depth &lt; 20                       -- ALWAYS bound the recursion
)
SELECT * FROM chain;</code></pre>
<p><strong>The self-join concept to explain:</strong> the same physical table appears twice in the query, each alias representing a different <em>role</em> — one row as the employee, another as the manager. The join condition links them through the foreign key that points back at the same table.</p>
<p><strong>The follow-up:</strong> "what about the CEO?" — an <code>INNER JOIN</code> silently drops rows where <code>manager_id IS NULL</code>. Whether that is correct depends on the requirement, and noticing it unprompted is what the interviewer is watching for.</p>
<p><strong>Always bound a recursive CTE</strong> with a depth limit — a cycle in the data (A manages B, B manages A) otherwise loops forever, and hierarchy tables acquire cycles more often than you would expect.</p>`
},
{
  q: "What is the difference between clustered index scan, index seek and table scan?",
  level: "advanced", hot: true, tags: ["indexes", "performance"],
  companies: ["Amazon", "Oracle", "Microsoft", "Goldman Sachs", "Barclays", "SAP"],
  a: `<table>
<tr><th>Operation</th><th>What happens</th><th>Cost</th></tr>
<tr><td><strong>Index seek</strong></td><td>Navigate the B-tree directly to the matching key(s)</td><td>O(log n) — best</td></tr>
<tr><td><strong>Index-only scan</strong></td><td>Answer entirely from the index; the table is never read</td><td>Best when it applies</td></tr>
<tr><td><strong>Index scan</strong></td><td>Read the whole index, then fetch rows from the table</td><td>Worse than a table scan if most rows match</td></tr>
<tr><td><strong>Bitmap heap scan</strong></td><td>Collect matching row locations, then read the table in physical order</td><td>Good for medium selectivity</td></tr>
<tr><td><strong>Sequential / table scan</strong></td><td>Read every page</td><td>Correct when returning most of the table</td></tr>
</table>
<pre><code>EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total FROM orders WHERE customer_id = 42;

-- GOOD: the index answers it, no heap access
Index Only Scan using idx_orders_cust_total on orders
  (cost=0.43..8.45 rows=12 width=16) (actual time=0.021..0.028 rows=12 loops=1)
  Index Cond: (customer_id = 42)
  Heap Fetches: 0                       &lt;-- 0 is what you want; high means VACUUM is behind

-- BAD: reading 2 million rows to return 12
Seq Scan on orders (cost=0.00..41000.00 rows=12 width=16)
  Filter: (customer_id = 42)
  Rows Removed by Filter: 1999988       &lt;-- the smoking gun</code></pre>
<p><strong>The counter-intuitive point interviewers look for:</strong> a sequential scan is <em>not</em> always bad. If a query returns 60% of the table, reading it sequentially is faster than an index scan that does 600,000 random page fetches. The optimiser chooses based on estimated selectivity — so a "wrong" plan is usually a <strong>statistics</strong> problem, not a missing index.</p>
<pre><code>-- Fix stale statistics first, before adding indexes
ANALYZE orders;
-- Compare estimated vs actual rows in EXPLAIN ANALYZE. A large divergence
-- means the planner is working from bad information.

-- Make an index-only scan possible by INCLUDing the payload columns
CREATE INDEX idx_orders_cust_total ON orders (customer_id) INCLUDE (total, status);</code></pre>
<p><strong>What defeats an index seek</strong> — the <em>sargability</em> rules: a function on the column (<code>WHERE YEAR(created_at) = 2026</code>), an implicit type conversion, a leading wildcard (<code>LIKE '%x%'</code>), or <code>OR</code> across different columns. In each case the column is no longer available as a search argument, so the planner falls back to a scan.</p>`
},
{
  q: "How do you find and fix a slow query in production?",
  level: "advanced", hot: true, tags: ["performance", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "Oracle", "Optum", "Maersk"],
  a: `<pre><code>-- 1. FIND IT — rank by TOTAL time, not per-call time.
--    A 5ms query called 2 million times costs more than a 3s report run twice.
SELECT calls,
       round(total_exec_time::numeric, 1)              AS total_ms,
       round(mean_exec_time::numeric, 2)               AS mean_ms,
       rows,
       round(100 * total_exec_time / sum(total_exec_time) OVER (), 1) AS pct,
       left(query, 100)
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- 2. WHAT IS RUNNING RIGHT NOW
SELECT pid, now() - query_start AS duration, state, wait_event_type, wait_event,
       left(query, 120)
FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;

-- 3. IS IT BLOCKED rather than slow?
SELECT blocked.pid, blocking.pid AS blocked_by, left(blocked.query, 80)
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

-- 4. GET THE PLAN
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) &lt;the query&gt;;</code></pre>
<p><strong>Reading the plan — in this order:</strong></p>
<ol>
<li><strong>Estimated vs actual rows.</strong> A big divergence means stale statistics — run <code>ANALYZE</code> before doing anything else. Bad estimates cause bad plans, and this is the most common root cause.</li>
<li><strong>The widest node.</strong> Read bottom-up; the deepest expensive node is the problem, not the top line.</li>
<li><strong>Sequential scan on a large table</strong> with a selective filter → missing index, or a non-sargable predicate.</li>
<li><strong>Sort or Hash spilling</strong> (<code>external merge Disk: 24MB</code>) → raise <code>work_mem</code>, or avoid the sort with a matching index.</li>
<li><strong>Nested Loop over many rows</strong> → usually a missing index on the inner side.</li>
<li><strong>Rows Removed by Filter</strong> in the millions → you are reading far more than you return.</li>
</ol>
<pre><code>-- 5. Enable the safety nets BEFORE you need them
log_min_duration_statement = 500ms       -- log anything slower
auto_explain.log_min_duration = 1000ms   -- log the PLAN of slow queries automatically
shared_preload_libraries = 'pg_stat_statements,auto_explain'</code></pre>
<p><strong>The order of investigation to state:</strong> is it one query or everything? Blocked on a lock, or genuinely working? Wrong plan (statistics) or missing index? Bloat or a vacuum problem? Connection pool saturation? Each of the queries above answers exactly one of those — presenting it as a <em>procedure</em> scores far better than naming tools.</p>
<p><strong>And the framing worth adding:</strong> "Most 'slow database' tickets I have seen were an N+1 from the application rather than a slow query — 300 fast queries look fine individually in <code>pg_stat_statements</code> until you notice the call count."</p>`
},
{
  q: "What are ACID and BASE, and when would you choose each?",
  level: "beginner", hot: true, tags: ["transactions", "theory"],
  companies: ["TCS", "Infosys", "Amazon", "Cognizant", "Accenture", "Deloitte"],
  a: `<table>
<tr><th>ACID (relational)</th><th>BASE (many NoSQL)</th></tr>
<tr><td><strong>A</strong>tomicity — all or nothing</td><td><strong>B</strong>asically <strong>A</strong>vailable — responds even when partitioned</td></tr>
<tr><td><strong>C</strong>onsistency — constraints always hold</td><td><strong>S</strong>oft state — may change without input, as replicas converge</td></tr>
<tr><td><strong>I</strong>solation — concurrent transactions do not interfere</td><td><strong>E</strong>ventually consistent — replicas converge given time</td></tr>
<tr><td><strong>D</strong>urability — committed data survives a crash</td><td></td></tr>
</table>
<pre><code>-- ACID: this MUST be atomic, or money is created or destroyed
BEGIN;
  UPDATE account SET balance = balance - 500 WHERE id = 1;
  UPDATE account SET balance = balance + 500 WHERE id = 2;
COMMIT;   -- both, or neither

-- BASE: a follower count being 3 seconds stale harms nobody
INCR user:42:followers          -- fast, available, converges eventually</code></pre>
<p><strong>How to choose — per operation, not per system:</strong></p>
<ul>
<li><strong>ACID</strong> when a wrong value has real consequences: payments, ledgers, inventory allocation, bookings, anything audited or regulated.</li>
<li><strong>BASE</strong> when availability and scale matter more than immediate accuracy: view counts, follower counts, recommendations, activity feeds, search indexes, analytics.</li>
</ul>
<p><strong>The framing that earns marks:</strong> "This is not a database choice, it is a per-operation choice. A single e-commerce system needs ACID for the payment and BASE for the 'customers also bought' panel. Modern systems are polyglot — and PostgreSQL gives you ACID <em>plus</em> JSONB and read replicas, so the two are not as opposed as the acronyms suggest."</p>
<p><strong>The nuance about "C":</strong> the C in ACID (constraints hold) is not the C in CAP (linearizability). They are different properties with the same letter, and conflating them is a common mistake worth showing you avoid.</p>
<p><strong>The engineering work with BASE</strong> is making eventual consistency <em>visible and acceptable</em> — a PENDING status the user understands, a bounded and monitored replication lag, and a reconciliation job. "Eventually" must have a measured limit, or it is just a hope.</p>`
},
{
  q: "How do you write a query to pivot rows into columns?",
  level: "advanced", tags: ["queries", "practice"],
  companies: ["Amazon", "Infosys", "Deloitte", "Optum", "SAP", "Persistent"],
  a: `<pre><code>-- Source: one row per (employee, month)
-- Wanted:  one row per employee, one COLUMN per month

-- 1. Conditional aggregation — portable, works everywhere
SELECT employee_id,
       SUM(CASE WHEN month = 'JAN' THEN amount ELSE 0 END) AS jan,
       SUM(CASE WHEN month = 'FEB' THEN amount ELSE 0 END) AS feb,
       SUM(CASE WHEN month = 'MAR' THEN amount ELSE 0 END) AS mar
FROM sales
GROUP BY employee_id;

-- 2. FILTER — cleaner PostgreSQL syntax for the same thing
SELECT employee_id,
       SUM(amount) FILTER (WHERE month = 'JAN') AS jan,
       SUM(amount) FILTER (WHERE month = 'FEB') AS feb
FROM sales GROUP BY employee_id;

-- 3. crosstab() — the tablefunc extension
CREATE EXTENSION IF NOT EXISTS tablefunc;
SELECT * FROM crosstab(
    'SELECT employee_id, month, amount FROM sales ORDER BY 1,2',
    'SELECT DISTINCT month FROM sales ORDER BY 1'
) AS ct(employee_id int, jan numeric, feb numeric, mar numeric);

-- UNPIVOT — columns back into rows
SELECT employee_id, 'JAN' AS month, jan AS amount FROM wide
UNION ALL SELECT employee_id, 'FEB', feb FROM wide;
-- PostgreSQL shorthand:
SELECT employee_id, m.month, m.amount
FROM wide, LATERAL (VALUES ('JAN', jan), ('FEB', feb)) AS m(month, amount);</code></pre>
<p><strong>The limitation that is the real answer:</strong> SQL requires the result columns to be known at <em>parse</em> time, so a truly dynamic pivot — where the columns come from the data — is not possible in plain SQL. Your options are to build the SQL string in application code, use a stored procedure with dynamic SQL, or return the long format and pivot in the application or reporting layer.</p>
<pre><code>-- Dynamic pivot requires generating SQL
DO $BODY$
DECLARE cols text;
BEGIN
  SELECT string_agg(format('SUM(amount) FILTER (WHERE month = %L) AS %I', month, month), ', ')
    INTO cols FROM (SELECT DISTINCT month FROM sales ORDER BY 1) t;
  EXECUTE format('CREATE TEMP VIEW pivoted AS SELECT employee_id, %s FROM sales GROUP BY 1', cols);
END $BODY$;</code></pre>
<p><strong>The recommendation to give:</strong> pivot in the presentation layer where possible. Databases are excellent at aggregating and terrible at producing dynamic column sets, and a pivot pushed into SQL becomes unmaintainable the moment the categories change. Return <code>(employee, month, total)</code> and let the report or frontend arrange it.</p>`
}
]);
