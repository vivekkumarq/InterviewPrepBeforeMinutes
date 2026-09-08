appendTopic("sql", [
{
  q: "Write the queries interviewers ask most — Nth highest, duplicates, running totals",
  level: "advanced", hot: true, tags: ["queries", "window-functions", "must-know"],
  companies: ["Amazon", "TCS", "Infosys", "Cognizant", "Goldman Sachs", "Oracle", "Accenture", "Walmart"],
  a: `<pre><code>-- 1. Nth HIGHEST SALARY (handles ties correctly)
SELECT DISTINCT salary
FROM employee
ORDER BY salary DESC
OFFSET 2 LIMIT 1;                      -- 3rd highest DISTINCT salary

-- With window functions, and the difference between the ranking types:
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn,    -- 1,2,3,4  no ties
       RANK()       OVER (ORDER BY salary DESC) AS rnk,   -- 1,2,2,4  gaps after ties
       DENSE_RANK() OVER (ORDER BY salary DESC) AS drnk   -- 1,2,2,3  no gaps
FROM employee;
-- "3rd highest salary" almost always means DENSE_RANK = 3.</code></pre>
<pre><code>-- 2. FIND AND DELETE DUPLICATES, keeping the earliest row
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) AS rn
    FROM users
)
DELETE FROM users WHERE id IN (SELECT id FROM ranked WHERE rn &gt; 1);

-- Just finding them:
SELECT email, COUNT(*), MIN(id) AS keep
FROM users GROUP BY email HAVING COUNT(*) &gt; 1;</code></pre>
<pre><code>-- 3. RUNNING TOTAL and MOVING AVERAGE
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
       AVG(amount) OVER (ORDER BY order_date
                         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS avg_7day
FROM orders;

-- 4. MONTH-OVER-MONTH GROWTH with LAG
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS pct_change
FROM monthly_revenue;
-- NULLIF guards the division: without it, a zero previous month throws.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Window function partitioning rows and computing within each frame">
  <text class="dg-s" x="16" y="20">PARTITION BY dept ORDER BY salary DESC</text>
  <rect class="dg-fill" x="16" y="30" width="250" height="24" rx="4"/><text class="dg-s" x="141" y="47" text-anchor="middle">dept = Sales</text>
  <rect class="dg-box" x="16" y="58" width="250" height="20" rx="3"/><text class="dg-s" x="141" y="73" text-anchor="middle">rank 1 · 2 · 3</text>
  <rect class="dg-fill2" x="16" y="88" width="250" height="24" rx="4"/><text class="dg-s" x="141" y="105" text-anchor="middle">dept = Engineering</text>
  <rect class="dg-box" x="16" y="116" width="250" height="20" rx="3"/><text class="dg-s" x="141" y="131" text-anchor="middle">rank 1 · 2 · 3</text>
  <text class="dg-s" x="300" y="48">ranking RESTARTS in each partition</text>
  <text class="dg-s" x="300" y="76">rows are NOT collapsed — unlike GROUP BY,</text>
  <text class="dg-s" x="300" y="98">every input row survives with its computed value</text>
  <text class="dg-s" x="300" y="126">that is the whole difference</text>
</svg>
</figure>
<pre><code>-- 5. EMPLOYEES EARNING MORE THAN THEIR MANAGER (self-join)
SELECT e.name AS employee, m.name AS manager, e.salary, m.salary AS manager_salary
FROM employee e
JOIN employee m ON e.manager_id = m.id
WHERE e.salary &gt; m.salary;

-- 6. DEPARTMENTS WITH NO EMPLOYEES — three ways, and they differ with NULLs
SELECT d.* FROM department d LEFT JOIN employee e ON e.dept_id = d.id
WHERE e.id IS NULL;                                          -- anti-join, usually fastest

SELECT * FROM department d WHERE NOT EXISTS
    (SELECT 1 FROM employee e WHERE e.dept_id = d.id);       -- NULL-safe

SELECT * FROM department WHERE id NOT IN (SELECT dept_id FROM employee);
-- ⚠ If ANY dept_id is NULL this returns ZERO ROWS, because NOT IN with a NULL
-- evaluates to UNKNOWN for every row. This is the single most common SQL trap.</code></pre>
<table>
<tr><th>Task</th><th>Reach for</th></tr>
<tr><td>Nth highest / top-N per group</td><td><code>DENSE_RANK</code> or <code>ROW_NUMBER</code> in a CTE</td></tr>
<tr><td>Deduplicate</td><td><code>ROW_NUMBER() PARTITION BY key</code></td></tr>
<tr><td>Running totals, moving averages</td><td>Window aggregate with a frame clause</td></tr>
<tr><td>Compare to the previous or next row</td><td><code>LAG</code> / <code>LEAD</code></td></tr>
<tr><td>"Not present in the other table"</td><td><code>NOT EXISTS</code> or a <code>LEFT JOIN ... IS NULL</code>, never <code>NOT IN</code></td></tr>
<tr><td>Hierarchies (org chart, categories)</td><td><code>WITH RECURSIVE</code></td></tr>
</table>
<p><strong>The habit that scores:</strong> say what the query returns before writing it, and name the edge case you are handling — ties, NULLs, empty groups, division by zero. Interviewers ask these questions precisely because the naive answer is nearly right, and the difference is in the edges.</p>`
},
{
  q: "How do you read an execution plan and decide what to fix?",
  level: "advanced", hot: true, tags: ["performance", "indexes", "debugging"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "Optum", "SAP", "Walmart", "Barclays", "Flipkart"],
  a: `<pre><code>EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, c.name FROM orders o JOIN customer c ON c.id = o.customer_id
WHERE o.status = 'PENDING' AND o.created_at &gt; now() - interval '7 days';

Hash Join  (cost=1250.00..48200.00 rows=1200 width=48)
           (actual time=45.2..2103.8 rows=98450 loops=1)
  Hash Cond: (o.customer_id = c.id)
  -&gt;  Seq Scan on orders o  (cost=0..44000 rows=1200 width=16)
                            (actual time=0.1..1890.4 rows=98450 loops=1)
        Filter: (status = 'PENDING' AND created_at &gt; ...)
        Rows Removed by Filter: 4901550
        Buffers: shared read=44000
  -&gt;  Hash  (cost=800..800 rows=20000 width=40) (actual time=44.1..44.1 ...)
Planning Time: 0.4 ms
Execution Time: 2150.3 ms</code></pre>
<table>
<tr><th>What to look at</th><th>What it tells you</th></tr>
<tr><td><strong>estimated vs actual rows</strong></td><td>1,200 estimated, 98,450 actual — an <strong>80× misestimate</strong>. The planner chose a bad plan on bad information. Run <code>ANALYZE</code>.</td></tr>
<tr><td><strong>Rows Removed by Filter</strong></td><td>4.9M rows read and thrown away — a missing index, screaming</td></tr>
<tr><td><strong>Seq Scan on a large table</strong></td><td>Fine for small tables or when returning most rows; a problem for a selective filter</td></tr>
<tr><td><strong><code>loops=N</code></strong></td><td>Multiply the per-loop cost by N. A nested loop with 50,000 iterations is where time hides.</td></tr>
<tr><td><strong>Buffers: read vs hit</strong></td><td><code>read</code> means disk. High reads means the working set does not fit in cache.</td></tr>
<tr><td><strong>Sort with external merge</strong></td><td>Spilled to disk — raise <code>work_mem</code> or add an index that provides the order</td></tr>
<tr><td>Planning ≫ Execution</td><td>Over-partitioned table, or too many joins; consider a prepared statement</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Join strategies and when the planner picks each">
  <rect class="dg-fill" x="16" y="30" width="180" height="52" rx="8"/>
  <text class="dg-s" x="106" y="52" text-anchor="middle">Nested Loop</text>
  <text class="dg-s" x="106" y="70" text-anchor="middle">small outer + indexed inner</text>
  <rect class="dg-fill2" x="216" y="30" width="180" height="52" rx="8"/>
  <text class="dg-s" x="306" y="52" text-anchor="middle">Hash Join</text>
  <text class="dg-s" x="306" y="70" text-anchor="middle">large unsorted, equality only</text>
  <rect class="dg-box" x="416" y="30" width="188" height="52" rx="8"/>
  <text class="dg-s" x="510" y="52" text-anchor="middle">Merge Join</text>
  <text class="dg-s" x="510" y="70" text-anchor="middle">both already sorted on the key</text>
  <text class="dg-s" x="16" y="118">a Nested Loop on two large tables is the classic disaster —</text>
  <text class="dg-s" x="16" y="138">usually caused by a row misestimate, so fix the STATISTICS before the query</text>
</svg>
</figure>
<pre><code>-- The fix for the plan above
CREATE INDEX CONCURRENTLY idx_orders_status_created
  ON orders (status, created_at DESC)
  WHERE status = 'PENDING';        -- PARTIAL: only ~2% of the table

-- Re-run EXPLAIN ANALYZE and confirm:
Index Scan using idx_orders_status_created  (actual time=0.05..12.4 rows=98450)
Execution Time: 61.2 ms                     -- 2150ms -> 61ms

-- Before adding an index, always check whether the query can use one at all:
WHERE YEAR(created_at) = 2026        -- ✗ function on the column: index unusable
WHERE created_at &gt;= '2026-01-01'     -- ✔ sargable
    AND created_at &lt;  '2027-01-01'
WHERE status::text = 'PENDING'       -- ✗ a cast can also defeat the index</code></pre>
<table>
<tr><th>Symptom</th><th>Usual fix</th></tr>
<tr><td>Sequential scan with a selective filter</td><td>Add an index matching the predicate</td></tr>
<tr><td>Index exists but is not used</td><td>Non-sargable predicate, type mismatch, or stale statistics</td></tr>
<tr><td>Estimates far from actuals</td><td><code>ANALYZE</code>; raise the statistics target; consider extended statistics for correlated columns</td></tr>
<tr><td>Sort in the plan</td><td>Add an index that already provides the order (including <code>DESC</code>)</td></tr>
<tr><td>Slow only for some parameters</td><td>Parameter sniffing / skewed data — the plan suits one value and not another</td></tr>
</table>
<p><strong>The discipline to state:</strong> "I use <code>EXPLAIN ANALYZE</code>, not plain <code>EXPLAIN</code>, because the estimates are the thing I am checking. The first question is always whether the planner's row counts match reality — if they do not, the plan is a symptom and the statistics are the cause. Adding an index to fix a misestimate usually just moves the problem."</p>`
}
]);
