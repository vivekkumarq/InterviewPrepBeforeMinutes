registerSimple("sql", {
"What is the difference between UNION, UNION ALL, INTERSECT and EXCEPT?":
`They combine the results of two queries. <b>UNION</b> returns rows from either query with duplicates removed. <b>UNION ALL</b> keeps duplicates and is faster because it skips that check. <b>INTERSECT</b> returns only rows that appear in both. <b>EXCEPT</b> returns rows in the first result that are not in the second.`,

"What is the difference between EXISTS, IN and JOIN for filtering?":
`<b>EXISTS</b> asks "is there at least one matching row?" and stops at the first match; it is usually the clearest choice. <b>IN</b> checks whether a value is in a list, but <code>NOT IN</code> behaves badly when the list contains NULL. A <b>JOIN</b> brings in columns from the other table, but can repeat rows when there are several matches.`,

"How do transactions and locking work in SQL — what is SELECT FOR UPDATE?":
`A transaction groups changes so they all succeed or all fail. <code>SELECT ... FOR UPDATE</code> reads rows and locks them, so no other transaction can change them until yours finishes. Use it for "read, check, then update" steps, such as checking a balance before deducting, so two people cannot spend the same money at once.`,

"What are database views, materialised views and CTEs — when do you use each?":
`A <b>view</b> is a saved query that runs fresh every time you use it. A <b>materialised view</b> saves the query's result, so reading is fast but the data is only as fresh as the last refresh. A <b>CTE</b> (<code>WITH</code>) names a part of one query to make it easier to read, and exists only for that query.`,

"How do you write an efficient pagination query for a large table?":
`<code>OFFSET 100000</code> makes the database read and throw away 100,000 rows every time, so later pages get slower. Instead, remember where the last page ended and ask for rows after it: <code>WHERE (created_at, id) &lt; (:last_time, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20</code>. With an index, every page is equally fast.`,

"What are common SQL query anti-patterns?":
`Common mistakes: <code>SELECT *</code> when you need a few columns, wrapping indexed columns in functions so the index cannot be used, running one query per row in a loop (N+1), <code>NOT IN</code> with NULLs, leading wildcards like <code>LIKE '%abc'</code>, and deep OFFSET pagination.`,

"Write a query to find gaps and islands in a sequence":
`"Islands" are runs of consecutive values (such as days in a row a user logged in) and "gaps" are the missing values between them. The trick: number the rows in order with <code>ROW_NUMBER()</code> and subtract that from the value. Consecutive values give the same difference, so you group by that difference to get each island.`,

"How do you design a schema for a many-to-many relationship with attributes?":
`For students and courses, where a student takes many courses and a course has many students, create a link table such as <code>enrolment(student_id, course_id, enrolled_on, grade)</code>. Each row is one student in one course, and the extra details about that relationship (date, grade) live on that row.`,

"Find the second highest salary per department — three ways":
`Number the salaries within each department from highest to lowest using a window function, then keep rank 2. <code>ROW_NUMBER</code> gives every row a unique number, <code>RANK</code> gives ties the same number and skips the next, and <code>DENSE_RANK</code> gives ties the same number without skipping. Ask how ties should be handled.`,

"Write a query to find employees earning more than their manager":
`Join the employee table to itself: one copy plays the employee, the other the manager. <code>SELECT e.name FROM employee e JOIN employee m ON e.manager_id = m.id WHERE e.salary &gt; m.salary</code>. This is called a self-join.`,

"What is the difference between clustered index scan, index seek and table scan?":
`A <b>table scan</b> reads every row, which is slow on big tables. An <b>index seek</b> uses the index to jump straight to the matching rows, which is fastest. A <b>clustered index scan</b> reads the whole table in index order, which is still essentially reading everything. When a query is slow, you usually want to turn a scan into a seek.`,

"How do you find and fix a slow query in production?":
`First find which queries are actually slow, using <code>pg_stat_statements</code> or a slow query log. Run <code>EXPLAIN ANALYZE</code> to see how the database runs it. Look for full table scans, wrong row estimates and expensive sorts. Usually the fix is an index, refreshing statistics, or rewriting the query.`,

"What are ACID and BASE, and when would you choose each?":
`<b>ACID</b> (traditional databases) promises that transactions are all-or-nothing, keep data valid, do not interfere with each other and are not lost. <b>BASE</b> (many NoSQL systems) favours staying available, accepting that copies may disagree for a while. Choose ACID when correctness matters, such as money; BASE for huge scale where brief staleness is fine.`,

"How do you write a query to pivot rows into columns?":
`Pivoting turns values in rows into columns, such as one column per month. Use conditional aggregation: <code>SUM(CASE WHEN month = 'Jan' THEN amount END) AS jan</code>, one line per column, with GROUP BY. SQL needs the column names known in advance, so truly dynamic columns need code to build the query.`,

"Write the queries interviewers ask most — Nth highest, duplicates, running totals":
`Most come down to window functions. <b>Nth highest</b>: <code>DENSE_RANK()</code> in a subquery, then filter by rank. <b>Duplicates</b>: <code>GROUP BY</code> the columns with <code>HAVING COUNT(*) &gt; 1</code>, or <code>ROW_NUMBER()</code> to keep one copy. <b>Running totals</b>: <code>SUM(amount) OVER (ORDER BY date)</code>.`,

"How do you read an execution plan and decide what to fix?":
`An execution plan shows the steps the database takes to run your query. Find the step that takes most of the time, then compare its estimated row count with the actual one. A big difference means outdated statistics, so run ANALYZE. A full scan on a big table usually means a missing index.`,

"How do you run a schema migration on a large table without downtime?":
`During a deployment, old and new code run at the same time, so changes must work for both. Use "expand and contract": add the new column first, fill it in small batches, switch the code over, and only drop the old column in a later release. Avoid changes that lock a huge table for a long time.`,

"When would you choose NoSQL over a relational database?":
`Start with a relational database; it is the right default. Choose NoSQL for a specific need: a key-value store like Redis for caches and sessions, a document database for flexible data read as one piece, wide-column stores for enormous write volumes, and graph databases for highly connected data.`,

"A query got slow in production. Walk me through diagnosing it.":
`Ask what changed: more data, a new release, or outdated statistics. Run <code>EXPLAIN ANALYZE</code> and look for full table scans, row estimates far from reality, and large sorts. Check whether the query is waiting on locks. Then fix the cause, usually an index, <code>ANALYZE</code>, or a rewritten query.`,

"Window functions: what they solve that GROUP BY cannot":
`<code>GROUP BY</code> squashes rows together, one row per group. A window function calculates across related rows but keeps every row. So you can show each employee next to their department's average salary, rank rows within groups, or compute running totals, all while keeping the individual rows.`,

"Write a cohort retention query: of users who signed up each month, how many came back the next month?":
`Group users by the month they signed up (their cohort). Then, for each cohort, count how many of those users were active in the following month, divided by the cohort size. Use a LEFT JOIN from signups to activity so cohorts where nobody came back still appear with 0.`,

"Why does NOT IN return no rows? The NULL traps that break correct-looking SQL":
`Any comparison with NULL gives "unknown", not true or false. <code>x NOT IN (1, 2, NULL)</code> means "x is not 1 and not 2 and not NULL", and the last part is unknown, so no row ever passes. Use <code>NOT EXISTS</code> instead, and remember to use <code>IS NULL</code> rather than <code>= NULL</code>.`,

"Explain all the JOIN types":
`<b>INNER JOIN</b>: only rows that match in both tables. <b>LEFT JOIN</b>: every row from the left table, with NULLs where there is no match. <b>RIGHT JOIN</b>: the same, keeping every row from the right. <b>FULL JOIN</b>: all rows from both. <b>CROSS JOIN</b>: every combination of rows. <b>Self-join</b>: a table joined to itself.`,

"What is the logical order of execution of a SQL query?":
`SQL runs in this order: FROM and JOIN (gather rows), WHERE (filter rows), GROUP BY (form groups), HAVING (filter groups), SELECT (choose columns and create aliases), ORDER BY (sort), LIMIT (cut). This is why an alias made in SELECT cannot be used in WHERE but can be used in ORDER BY.`,

"What are window functions and how do they differ from GROUP BY?":
`A window function computes a value across a set of related rows, such as rank, running total or the previous row's value, without merging those rows together. <code>GROUP BY</code> returns one row per group; a window function keeps every row and adds the calculated value next to it, using <code>OVER (PARTITION BY ... ORDER BY ...)</code>.`,

"Find the Nth highest salary":
`Rank the distinct salaries from highest to lowest and pick rank N: <code>SELECT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM employee) t WHERE r = N</code>. Ask the interviewer how ties should count; DENSE_RANK treats equal salaries as one position.`,

"How do database indexes work?":
`An index is a separate, sorted structure (usually a B-tree) that maps column values to where the rows are stored, like the index at the back of a book. Instead of reading every row, the database follows the tree to the right place in a few steps. The cost: indexes use space and slow down inserts and updates slightly.`,

"What is a composite index and why does column order matter?":
`A composite index covers several columns, sorted by the first, then the second within that, like a phone book sorted by surname then first name. It helps queries that filter on the first column (or the first and second), but not queries on only the second, just as a phone book cannot find everyone named "Ravi".`,

"What is the difference between WHERE and HAVING?":
`<b>WHERE</b> filters individual rows before they are grouped and cannot use totals such as SUM. <b>HAVING</b> filters groups after <code>GROUP BY</code> and can use totals, for example <code>HAVING COUNT(*) &gt; 5</code>. Filter rows in WHERE whenever possible, because it reduces the work early.`,

"Explain ACID properties":
`<b>Atomicity</b>: a transaction happens completely or not at all. <b>Consistency</b>: data always follows the rules (constraints). <b>Isolation</b>: transactions running at the same time do not see each other's half-finished work. <b>Durability</b>: once committed, data survives a crash. Example: a money transfer must debit and credit together.`,

"What are the transaction isolation levels and the anomalies they prevent?":
`Isolation levels control how much transactions running at the same time can see of each other. <b>Read uncommitted</b> can see unsaved changes. <b>Read committed</b> sees only saved changes. <b>Repeatable read</b> gives the same answer if you re-read a row. <b>Serializable</b> behaves as if transactions ran one at a time. Higher levels are safer but slower.`,

"What is normalization? Explain 1NF, 2NF, 3NF":
`Normalisation organises tables so each fact is stored only once, avoiding repeated data that can get out of sync. <b>1NF</b>: one value per cell, no lists. <b>2NF</b>: every column depends on the whole key, not part of it. <b>3NF</b>: columns depend only on the key, not on other columns (store the city name in a cities table, not on every order).`,

"How do you read and use EXPLAIN / EXPLAIN ANALYZE?":
`<code>EXPLAIN</code> shows the plan the database intends to use for a query. <code>EXPLAIN ANALYZE</code> actually runs it and shows real times and row counts. Look for full scans on big tables (often a missing index), estimates far from actual counts (outdated statistics), and the step that takes the most time.`,

"Write a query to find duplicate rows and delete them":
`Find them by grouping on the columns that should be unique: <code>GROUP BY email HAVING COUNT(*) &gt; 1</code>. To delete all but one, number the copies with <code>ROW_NUMBER() OVER (PARTITION BY email ORDER BY id)</code> and delete rows numbered above 1. Then add a unique constraint so duplicates cannot come back.`,

"What is the difference between DELETE, TRUNCATE and DROP?":
`<b>DELETE</b> removes chosen rows (with WHERE) one by one and can be rolled back. <b>TRUNCATE</b> quickly empties the whole table but keeps the table itself. <b>DROP</b> removes the entire table, structure and all. Use DELETE for specific rows, TRUNCATE to empty a table, and DROP to get rid of it.`,

"What are CTEs and recursive queries?":
`A CTE, written with <code>WITH name AS (...)</code>, gives part of a query a name so the rest reads clearly. A recursive CTE refers to itself, which lets you walk through hierarchies such as an employee and all their managers up to the CEO, or categories and their sub-categories.`,

"How do you optimise a slow SQL query?":
`Measure first to find which query is actually slow. Run <code>EXPLAIN ANALYZE</code>, add indexes that match your filters and joins, select only the columns you need, avoid wrapping indexed columns in functions, fix N+1 query loops, and keep statistics up to date. Measure again after each change.`,

"What is the difference between clustered and non-clustered indexes?":
`A <b>clustered index</b> decides the physical order of the table's rows, so the table is the index; there can be only one. A <b>non-clustered index</b> is a separate sorted structure that points back to the rows, and a table can have many. Lookups through a non-clustered index take an extra step to fetch the row.`,

"What is a deadlock in a database and how do you avoid it?":
`A deadlock is when two transactions each hold a lock the other needs, so both wait forever. The database detects it and cancels one. Avoid it by always locking rows in the same order (for example, lower id first), keeping transactions short, and retrying the cancelled transaction.`,

"Write a query for group-wise aggregation with a join and date filtering":
`Join the tables, filter by date, group and total. If you use a LEFT JOIN to keep customers with no orders, put the date condition in the <code>ON</code> clause, not in WHERE, and use <code>COUNT(o.id)</code> rather than <code>COUNT(*)</code>, so customers with no orders correctly show 0.`,

"What is a stored procedure, and would you use one?":
`A stored procedure is a saved program of SQL steps that runs inside the database. It can be faster for heavy data work because it avoids sending data back and forth. But business logic hidden in the database is harder to version, test and debug, so most teams keep logic in the application and use procedures only for specific data-heavy jobs.`
});
