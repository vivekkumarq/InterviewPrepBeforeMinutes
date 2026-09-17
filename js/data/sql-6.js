appendTopic("sql", [
{
  q: "A query got slow in production. Walk me through diagnosing it.",
  level: "advanced", hot: true, tags: ["tuning", "explain", "indexes", "must-know"],
  companies: ["Amazon", "Microsoft", "Oracle", "Infosys", "TCS", "Goldman Sachs", "Flipkart", "SAP"],
  a: `<pre><code>-- STEP 1: get the real plan, with real timings. Not EXPLAIN alone.
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id
WHERE o.created_at &gt;= now() - interval '7 days';

-- EXPLAIN        = the planner's GUESS
-- EXPLAIN ANALYZE = it actually RUNS the query and reports real times
-- BUFFERS         = how many pages came from cache versus disk</code></pre>
<table>
<tr><th>In the plan, look for</th><th>Meaning</th></tr>
<tr><td><strong>Seq Scan</strong> on a large table</td><td>No usable index — or the planner thinks a scan is cheaper</td></tr>
<tr><td><strong>rows=1000 … actual rows=2000000</strong></td><td>Stale statistics. The plan was chosen on a wrong estimate — <code>ANALYZE</code> the table</td></tr>
<tr><td><strong>Nested Loop</strong> with a big inner side</td><td>Fine for a few rows, catastrophic for millions</td></tr>
<tr><td><strong>Hash Join</strong> spilling to disk</td><td><code>work_mem</code> too small</td></tr>
<tr><td><strong>Sort</strong> with "external merge Disk"</td><td>Same — or index the sort column</td></tr>
<tr><td><strong>Filter removed N rows</strong></td><td>Rows fetched then discarded — the index is not selective enough</td></tr>
<tr><td>High <strong>shared read</strong>, low <strong>hit</strong></td><td>Cold cache, or the working set exceeds RAM</td></tr>
</table>
<pre><code>-- STEP 2: WHY IS MY INDEX NOT USED? The usual five reasons.

-- (a) A function on the column kills it
WHERE DATE(created_at) = '2026-09-18'          -- index unusable
WHERE created_at &gt;= '2026-09-18'               -- sargable, index used
      AND created_at &lt; '2026-09-19'
-- or build the matching expression index: CREATE INDEX ON t (DATE(created_at));

-- (b) A leading wildcard
WHERE name LIKE '%smith'                        -- cannot use a b-tree
WHERE name LIKE 'smith%'                        -- can
-- trailing-wildcard only; for both ends you need a trigram or full-text index

-- (c) Type mismatch — an implicit cast disables the index
WHERE user_id = '12345'                         -- text compared to bigint

-- (d) Wrong COLUMN ORDER in a composite index
CREATE INDEX idx ON orders (status, created_at);
WHERE created_at &gt; ...                           -- cannot use it: status is
                                                 -- the leading column
-- Leftmost-prefix rule: (a,b,c) serves a / a,b / a,b,c — never b alone.

-- (e) LOW SELECTIVITY. If the predicate matches 40% of the table, a
--     sequential scan genuinely IS cheaper. The planner is right.</code></pre>
<pre><code>-- STEP 3: the fixes, in the order to try them
1. Add or reorder an index         -- equality columns first, then range, then sort
2. COVERING index (INCLUDE)        -- index-only scan, never touches the heap
   CREATE INDEX idx ON orders (customer_id) INCLUDE (status, total);
3. Rewrite the query               -- remove the function, avoid SELECT *
4. ANALYZE / refresh statistics    -- often the entire fix after a bulk load
5. Partition                       -- when the table is genuinely enormous
6. Materialised view               -- when the aggregate is expensive and can be stale
7. Cache it in the application     -- last, because now you own invalidation</code></pre>
<table>
<tr><th>Symptom</th><th>Likely cause</th></tr>
<tr><td>Fast in dev, slow in production</td><td>Data volume, or statistics never gathered</td></tr>
<tr><td>Slowed down overnight, no deploy</td><td>Crossed a row threshold and the plan flipped</td></tr>
<tr><td>Fast alone, slow under load</td><td>Lock contention or connection-pool exhaustion, not the query</td></tr>
<tr><td>First run slow, later runs fast</td><td>Cold cache — the plan is fine</td></tr>
<tr><td>One customer is slow</td><td>Data skew; the plan suits the average, not that tenant</td></tr>
<tr><td>Writes got slower</td><td>Too many indexes — every one is maintained on every write</td></tr>
</table>
<pre><code>-- FINDING the slow queries in the first place
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;
-- Sort by TOTAL, not mean: a 5 ms query run a million times costs far more
-- than a 2-second report run once a day. That framing is the answer to
-- "which query would you optimise first?"</code></pre>
<p><strong>The habit to describe:</strong> "I measure before changing anything. <code>pg_stat_statements</code> tells me which query is worth the effort, <code>EXPLAIN ANALYZE</code> tells me where the time goes, and I compare estimated versus actual rows first — because a wrong estimate means the planner was misled, and adding an index will not help until the statistics are right."</p>`
},
{
  q: "Window functions: what they solve that GROUP BY cannot",
  level: "advanced", hot: true, tags: ["window-functions", "analytics", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Goldman Sachs", "Walmart", "Flipkart", "Adobe", "Oracle"],
  a: `<p><code>GROUP BY</code> collapses rows. A window function computes across a set of rows <strong>while keeping every row</strong>. That single difference is the whole topic.</p>
<pre><code>-- The question: each employee, plus their department's average salary.
-- With GROUP BY you lose the individual rows and need a self-join.
SELECT name, department, salary,
       AVG(salary) OVER (PARTITION BY department)          AS dept_avg,
       salary - AVG(salary) OVER (PARTITION BY department) AS diff
FROM employees;
-- One pass, every row kept, no join.</code></pre>
<table>
<tr><th>Function</th><th>Behaviour on ties</th><th>Sequence for 100, 90, 90, 80</th></tr>
<tr><td><code>ROW_NUMBER()</code></td><td>Arbitrary but unique</td><td>1, 2, 3, 4</td></tr>
<tr><td><code>RANK()</code></td><td>Ties share, then <strong>skips</strong></td><td>1, 2, 2, <strong>4</strong></td></tr>
<tr><td><code>DENSE_RANK()</code></td><td>Ties share, <strong>no gap</strong></td><td>1, 2, 2, <strong>3</strong></td></tr>
<tr><td><code>NTILE(4)</code></td><td>Splits into buckets</td><td>Quartiles</td></tr>
<tr><td><code>LAG(x, 1)</code> / <code>LEAD(x, 1)</code></td><td>Previous / next row's value</td><td>Month-on-month deltas</td></tr>
<tr><td><code>FIRST_VALUE</code> / <code>LAST_VALUE</code></td><td>Edge of the frame</td><td>Careful — see the frame note below</td></tr>
</table>
<pre><code>-- SECOND HIGHEST SALARY PER DEPARTMENT — the classic, done properly
SELECT * FROM (
  SELECT name, department, salary,
         DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rk
  FROM employees
) t WHERE rk = 2;
-- A window function cannot appear in WHERE (it is evaluated AFTER WHERE),
-- so it must be wrapped in a subquery or CTE. That restriction is itself a
-- favourite interview question.
-- DENSE_RANK, not ROW_NUMBER: with two people tied at the top, ROW_NUMBER
-- would return one of THEM as "second".

-- RUNNING TOTAL
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running
FROM orders;

-- MONTH-ON-MONTH GROWTH
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS pct
FROM monthly;
-- NULLIF guards the division when the previous month was zero.

-- DEDUPLICATE, keeping the newest row per key
DELETE FROM events WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, event_type
                                  ORDER BY created_at DESC) AS rn
    FROM events) t WHERE rn &gt; 1);</code></pre>
<pre><code>-- THE FRAME — the subtlety that produces wrong answers silently
-- With ORDER BY and no explicit frame, the DEFAULT is:
--     RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
-- So this does NOT give the partition's last value:
LAST_VALUE(x) OVER (PARTITION BY g ORDER BY t)             -- = the current row
LAST_VALUE(x) OVER (PARTITION BY g ORDER BY t
                    ROWS BETWEEN UNBOUNDED PRECEDING
                             AND UNBOUNDED FOLLOWING)      -- correct

-- RANGE versus ROWS: RANGE groups PEER rows (equal ORDER BY values) together,
-- ROWS counts physical rows. With duplicate timestamps they differ, and a
-- running total computed with RANGE jumps at each tie.</code></pre>
<table>
<tr><th>Use a window function for</th></tr>
<tr><td>Top N per group</td></tr>
<tr><td>Running totals and moving averages</td></tr>
<tr><td>Comparing a row to its group's aggregate</td></tr>
<tr><td>Period-over-period change</td></tr>
<tr><td>Deduplication by "newest per key"</td></tr>
<tr><td>Gaps and islands — consecutive-run detection via <code>ROW_NUMBER</code> arithmetic</td></tr>
<tr><td>Percentiles and bucketing without a join</td></tr>
</table>
<p><strong>Performance note worth adding:</strong> the window is computed after <code>WHERE</code> and usually requires a sort, so an index matching <code>PARTITION BY … ORDER BY …</code> can remove it entirely. And filter as early as you can — filtering after the window means you ranked rows you were always going to discard.</p>`
}
]);
