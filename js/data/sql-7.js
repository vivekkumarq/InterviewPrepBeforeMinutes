registerPrimer("sql", `<p class="pr-lead"><b>SQL</b> is the language for asking questions of a relational database, where data is stored in tables of rows and columns, much like spreadsheets. You describe <i>what</i> you want ("all paid orders over ₹100, grouped by customer"), and the database works out <i>how</i> to fetch it quickly.</p>
<div class="pr-analogy"><b>Think of it like this</b>Imagine a library with a card catalogue. A table is a shelf of books, each row is one book, and each column is a detail such as title or author. An <b>index</b> is the card catalogue: instead of walking every shelf to find books by one author, you look them up in the sorted catalogue and go straight to the right place. A <b>join</b> is matching cards from two catalogues, such as books and their borrowers.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Table, row, column</dt><dd>A table stores one kind of thing (customers). Each row is one item (one customer); each column is one detail (name, city).</dd>
<dt>Primary key</dt><dd>A column whose value uniquely identifies each row, such as <code>id</code>.</dd>
<dt>Foreign key</dt><dd>A column that points to a row in another table, such as <code>orders.customer_id</code> pointing to <code>customers.id</code>.</dd>
<dt>JOIN</dt><dd>Combines rows from two tables that match on some column.</dd>
<dt>GROUP BY</dt><dd>Collects rows into groups (per customer, per city) so you can count or total each group.</dd>
<dt>Index</dt><dd>A sorted lookup structure that lets the database find rows without reading the whole table.</dd>
<dt>Transaction</dt><dd>A set of changes that either all happen or none happen, such as moving money between two accounts.</dd>
<dt>NULL</dt><dd>"Unknown / no value". It is not zero and not an empty string, and it behaves specially in comparisons.</dd>
</dl>

<h3>Step by step: the order SQL actually runs in</h3>
<p>You write <code>SELECT</code> first, but the database runs it near the end. Knowing the real order explains most SQL surprises:</p>
<ol class="pr-steps">
<li><b>FROM / JOIN:</b> collect the rows from the tables.</li>
<li><b>WHERE:</b> throw away individual rows that do not match.</li>
<li><b>GROUP BY:</b> put the remaining rows into groups.</li>
<li><b>HAVING:</b> throw away whole groups that do not match (for example, totals under 100).</li>
<li><b>SELECT:</b> pick the columns and calculate values; aliases like <code>AS total</code> are created here.</li>
<li><b>ORDER BY:</b> sort the result (aliases can be used now).</li>
<li><b>LIMIT:</b> keep only the first few rows.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="Logical order of SQL execution: FROM and JOIN, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT">
  <defs><marker id="pr-sql" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="6" y="30" width="78" height="50" rx="8"/><text class="dg-m" x="45" y="52" text-anchor="middle">1 FROM</text><text class="dg-s" x="45" y="68" text-anchor="middle">+ JOIN</text>
  <line class="dg-line" x1="84" y1="55" x2="92" y2="55" marker-end="url(#pr-sql)"/>
  <rect class="dg-fill" x="94" y="30" width="78" height="50" rx="8"/><text class="dg-m" x="133" y="52" text-anchor="middle">2 WHERE</text><text class="dg-s" x="133" y="68" text-anchor="middle">filter rows</text>
  <line class="dg-line" x1="172" y1="55" x2="180" y2="55" marker-end="url(#pr-sql)"/>
  <rect class="dg-fill2" x="182" y="30" width="78" height="50" rx="8"/><text class="dg-m" x="221" y="52" text-anchor="middle">3 GROUP</text><text class="dg-s" x="221" y="68" text-anchor="middle">rows → groups</text>
  <line class="dg-line" x1="260" y1="55" x2="268" y2="55" marker-end="url(#pr-sql)"/>
  <rect class="dg-fill2" x="270" y="30" width="78" height="50" rx="8"/><text class="dg-m" x="309" y="52" text-anchor="middle">4 HAVING</text><text class="dg-s" x="309" y="68" text-anchor="middle">filter groups</text>
  <line class="dg-line" x1="348" y1="55" x2="356" y2="55" marker-end="url(#pr-sql)"/>
  <rect class="dg-fill" x="358" y="30" width="78" height="50" rx="8"/><text class="dg-m" x="397" y="52" text-anchor="middle">5 SELECT</text><text class="dg-s" x="397" y="68" text-anchor="middle">aliases born</text>
  <line class="dg-line" x1="436" y1="55" x2="444" y2="55" marker-end="url(#pr-sql)"/>
  <rect class="dg-box" x="446" y="30" width="78" height="50" rx="8"/><text class="dg-m" x="485" y="52" text-anchor="middle">6 ORDER</text><text class="dg-s" x="485" y="68" text-anchor="middle">can use aliases</text>
  <line class="dg-line" x1="524" y1="55" x2="532" y2="55" marker-end="url(#pr-sql)"/>
  <rect class="dg-box" x="534" y="30" width="78" height="50" rx="8"/><text class="dg-m" x="573" y="52" text-anchor="middle">7 LIMIT</text><text class="dg-s" x="573" y="68" text-anchor="middle">take N</text>
  <text class="dg-s" x="10" y="112">An alias defined in step 5 does not exist yet in steps 2 to 4, so WHERE total &gt; 100 fails.</text>
  <text class="dg-s" x="10" y="132">Aggregates (SUM, COUNT) exist only from step 3 on, so they can be filtered in HAVING, never in WHERE.</text>
  <text class="dg-s" x="10" y="152">Window functions run in step 5: to filter on one, wrap the query in a CTE or subquery.</text>
</svg>
<figcaption>The logical order. The optimiser may physically reorder work, but the result must be as if it ran in this order.</figcaption>
</figure>

<h3>A worked example: one query on real rows</h3>
<pre><code>orders
 id | customer | amount | status
----+----------+--------+----------
  1 | asha     |   500  | PAID
  2 | asha     |   300  | PAID
  3 | ravi     |   900  | PAID
  4 | ravi     |   200  | REFUNDED
  5 | meera    |    80  | PAID

SELECT customer, SUM(amount) AS total
FROM orders
WHERE status = 'PAID'
GROUP BY customer
HAVING SUM(amount) &gt; 100
ORDER BY total DESC;</code></pre>
<ol class="pr-steps">
<li><b>FROM</b> takes all 5 rows.</li>
<li><b>WHERE</b> removes row 4, because it was refunded. Rows 1, 2, 3 and 5 remain.</li>
<li><b>GROUP BY</b> makes three groups: asha (500, 300), ravi (900), meera (80).</li>
<li><b>HAVING</b> removes meera, because her total of 80 is not more than 100.</li>
<li><b>SELECT</b> calculates the totals: asha 800, ravi 900.</li>
<li><b>ORDER BY</b> sorts highest first. Result: ravi 900, then asha 800.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Using an alias in WHERE</p>
<p><code>WHERE total &gt; 100</code> fails because WHERE runs before SELECT, so the alias does not exist yet. Filtering on a total belongs in HAVING anyway.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use WHERE for row conditions and HAVING for group conditions such as <code>HAVING SUM(amount) &gt; 100</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ A LEFT JOIN that quietly loses rows</p>
<p>You want all customers including those with no orders, but you add <code>WHERE o.status = 'PAID'</code>. Customers without orders have NULL there, so they are removed and it behaves like an inner join.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> put the condition in the join itself: <code>LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'PAID'</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Comparing with NULL using =</p>
<p><code>WHERE phone = NULL</code> never matches anything, because comparing anything with NULL gives "unknown", not true.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> write <code>WHERE phone IS NULL</code> or <code>IS NOT NULL</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Wrapping an indexed column in a function</p>
<p><code>WHERE YEAR(created_at) = 2026</code> forces the database to calculate the year for every row, so the index on <code>created_at</code> cannot be used.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> compare the column directly with a range: <code>WHERE created_at &gt;= '2026-01-01' AND created_at &lt; '2027-01-01'</code>.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>SQL runs FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT, in that order.</li>
<li>WHERE filters rows; HAVING filters groups.</li>
<li>INNER JOIN keeps only matches; LEFT JOIN keeps every row from the left table.</li>
<li>Use IS NULL, never = NULL.</li>
<li>Indexes make lookups fast, but only when the query can use them.</li>
</ul>
<p><b>Next:</b> the questions below cover joins, window functions, indexes, transactions, query tuning and the classic interview queries.</p>`);

appendTopic("sql", [
{
  q: "Write a cohort retention query: of users who signed up each month, how many came back the next month?",
  level: "advanced", hot: true, tags: ["analytics", "cte", "date-functions", "joins", "must-know"],
  companies: ["Amazon", "Meta", "Swiggy", "Zomato", "Uber", "Flipkart", "Myntra", "PhonePe"],
  a: `<p>Retention is the most common "real analytics" SQL question for product companies. It combines date truncation, CTEs, a self-referencing join, and a careful choice of LEFT JOIN. Build it in steps and say each step out loud.</p>
<pre><code>users (id, signed_up_at)
events (user_id, occurred_at)          -- any activity: login, order, view</code></pre>
<pre><code>WITH cohorts AS (                      -- step 1: which month did each user join?
    SELECT id AS user_id,
           date_trunc('month', signed_up_at) AS cohort_month
    FROM users
),
activity AS (                          -- step 2: which months was each user active?
    SELECT DISTINCT user_id,
           date_trunc('month', occurred_at) AS active_month
    FROM events
)
SELECT c.cohort_month,
       COUNT(DISTINCT c.user_id)                          AS signed_up,
       COUNT(DISTINCT a.user_id)                          AS came_back_next_month,
       ROUND(100.0 * COUNT(DISTINCT a.user_id)
                   / COUNT(DISTINCT c.user_id), 1)        AS retention_pct
FROM cohorts c
LEFT JOIN activity a                                      -- step 3: LEFT, so users who
       ON a.user_id = c.user_id                           -- never came back still count
      AND a.active_month = c.cohort_month + INTERVAL '1 month'   -- in the denominator
GROUP BY c.cohort_month
ORDER BY c.cohort_month;</code></pre>
<pre><code> cohort_month | signed_up | came_back_next_month | retention_pct
--------------+-----------+----------------------+--------------
 2026-01-01   |      1200 |                  384 |          32.0
 2026-02-01   |      1450 |                  493 |          34.0
 2026-03-01   |      1610 |                  499 |          31.0</code></pre>
<table>
<tr><th>Detail</th><th>Why it matters</th></tr>
<tr><td><code>LEFT JOIN</code>, not <code>JOIN</code></td><td>An inner join drops everyone who did not return, and retention becomes 100%</td></tr>
<tr><td>The month condition in <code>ON</code>, not <code>WHERE</code></td><td>In WHERE it filters out the NULL rows and turns the LEFT JOIN back into an inner join</td></tr>
<tr><td><code>100.0</code>, not <code>100</code></td><td>Integer division: 384 / 1200 is 0 in integer arithmetic</td></tr>
<tr><td><code>DISTINCT</code> in the activity CTE</td><td>A user with 50 events in a month must count once</td></tr>
<tr><td><code>date_trunc</code> on both sides</td><td>Compares months, not exact timestamps</td></tr>
</table>
<p><strong>The follow-up: the full retention triangle</strong> (month 0, 1, 2, 3… for every cohort), which is what product dashboards show.</p>
<pre><code>WITH cohorts AS (...), activity AS (...)
SELECT c.cohort_month,
       (EXTRACT(YEAR FROM age(a.active_month, c.cohort_month)) * 12
      + EXTRACT(MONTH FROM age(a.active_month, c.cohort_month)))::int AS month_number,
       COUNT(DISTINCT a.user_id) AS active_users
FROM cohorts c
JOIN activity a ON a.user_id = c.user_id AND a.active_month &gt;= c.cohort_month
GROUP BY 1, 2
ORDER BY 1, 2;
-- Then divide each row by its cohort's month-0 count (a window function:
-- FIRST_VALUE(active_users) OVER (PARTITION BY cohort_month ORDER BY month_number)),
-- and pivot month_number into columns in the dashboard tool.</code></pre>
<p><strong>Dialect note:</strong> this is PostgreSQL. MySQL uses <code>DATE_FORMAT(d, '%Y-%m-01')</code> instead of <code>date_trunc</code> and <code>DATE_ADD(d, INTERVAL 1 MONTH)</code>; BigQuery uses <code>DATE_TRUNC(d, MONTH)</code>. Say which one you are writing, and the interviewer will not mind the differences.</p>`
},
{
  q: "Why does NOT IN return no rows? The NULL traps that break correct-looking SQL",
  level: "advanced", hot: true, tags: ["null", "three-valued-logic", "not-in", "gotchas", "must-know"],
  companies: ["Amazon", "Microsoft", "Oracle", "Goldman Sachs", "Infosys", "TCS", "Walmart"],
  a: `<p>SQL uses <strong>three-valued logic</strong>: a comparison is TRUE, FALSE, or <strong>UNKNOWN</strong>. Any comparison with NULL (including <code>NULL = NULL</code>) is UNKNOWN, and <code>WHERE</code> keeps only rows where the condition is TRUE. Nearly every NULL bug follows from those two facts.</p>
<pre><code>customers                 orders
 id | name                 id | customer_id
----+------                ----+------------
  1 | Asha                 10 | 1
  2 | Ravi                 11 | NULL      &lt;- a guest checkout
  3 | Meera

-- "Customers who never ordered". Expected: Ravi, Meera.
SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
-- Returns: NOTHING.</code></pre>
<p><strong>Why:</strong> <code>2 NOT IN (1, NULL)</code> means <code>2 &lt;&gt; 1 AND 2 &lt;&gt; NULL</code>. The second part is UNKNOWN, and TRUE AND UNKNOWN is UNKNOWN. So it is never TRUE for any row. One NULL in the subquery empties the whole result.</p>
<pre><code>-- FIX 1: NOT EXISTS (NULL-safe, and usually just as fast or faster)
SELECT c.name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

-- FIX 2: anti-join
SELECT c.name FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- FIX 3: filter the NULLs out of the subquery
WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);</code></pre>
<p><strong>The other traps from the same root:</strong></p>
<table>
<tr><th>Code</th><th>You expect</th><th>You get</th><th>Fix</th></tr>
<tr><td><code>WHERE discount = NULL</code></td><td>Rows with no discount</td><td>None, ever</td><td><code>IS NULL</code></td></tr>
<tr><td><code>WHERE status &lt;&gt; 'CANCELLED'</code></td><td>All non-cancelled rows</td><td>Rows with NULL status are missing too</td><td><code>status IS DISTINCT FROM 'CANCELLED'</code>, or <code>OR status IS NULL</code></td></tr>
<tr><td><code>COUNT(discount)</code></td><td>Number of rows</td><td>Number of <em>non-NULL</em> discounts</td><td><code>COUNT(*)</code> for rows</td></tr>
<tr><td><code>AVG(rating)</code></td><td>Average treating missing as 0</td><td>Average of non-NULL ratings only</td><td><code>AVG(COALESCE(rating, 0))</code> if that is what you mean</td></tr>
<tr><td><code>SUM(amount)</code> over zero rows</td><td>0</td><td>NULL</td><td><code>COALESCE(SUM(amount), 0)</code></td></tr>
<tr><td><code>price * qty</code> when qty is NULL</td><td>0</td><td>NULL</td><td><code>COALESCE(qty, 0)</code></td></tr>
<tr><td><code>'Hi ' || name</code> when name is NULL</td><td>"Hi "</td><td>NULL (PostgreSQL)</td><td><code>COALESCE(name, '')</code>. PostgreSQL's <code>CONCAT()</code> also skips NULLs; MySQL's does not</td></tr>
</table>
<pre><code>-- Sorting: where do NULLs go? It differs by database.
-- PostgreSQL/Oracle: NULLs sort LAST ascending. MySQL/SQL Server: FIRST.
ORDER BY last_login DESC NULLS LAST;         -- say it explicitly (PostgreSQL, Oracle)

-- UNIQUE constraints: most databases allow MANY NULLs in a unique column,
-- because NULL is not equal to NULL. PostgreSQL 15+ can forbid that:
CREATE UNIQUE INDEX ON users (email) NULLS NOT DISTINCT;

-- GROUP BY and DISTINCT, by contrast, treat all NULLs as ONE group.</code></pre>
<p><strong>The design-level fix:</strong> make columns <code>NOT NULL</code> wherever a missing value makes no sense, and use a real default (0, an empty string, a status like <code>'UNKNOWN'</code>) where that is meaningful. Every nullable column is a place where these traps can fire.</p>
<p><strong>The summary:</strong> "NULL means unknown, so any comparison with it is unknown, and WHERE drops unknowns. That is why NOT IN with a NULL returns nothing. I use NOT EXISTS for anti-joins, IS NULL or IS DISTINCT FROM for comparisons, and NOT NULL constraints wherever I can."</p>`
}
]);
