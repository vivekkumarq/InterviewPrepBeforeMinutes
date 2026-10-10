registerSimple("postgresql", {
"What is the difference between a heap, TOAST and the visibility map?":
`The <b>heap</b> is the main table file, where rows are stored in 8 KB pages in no particular order. <b>TOAST</b> is where Postgres moves very large values (long text, big JSON), compressed, so they do not crowd normal rows. The <b>visibility map</b> is a small tracker that records which pages hold only rows everyone can see, so vacuum and index-only scans can skip work.`,

"How do you handle bulk data loading efficiently in PostgreSQL?":
`Use <code>COPY</code> rather than many single INSERTs. COPY streams thousands of rows in one command, which is far faster. For huge loads, add indexes and constraints after loading rather than before, load in batches, and run <code>ANALYZE</code> afterwards so the database knows about the new data.`,

"What are PostgreSQL's locking modes and how do you diagnose lock contention?":
`Postgres has several lock levels: plain reads take the weakest one, writes take a stronger one, and some schema changes take an exclusive lock that blocks everything. When queries are stuck waiting, look at <code>pg_locks</code> and <code>pg_stat_activity</code>, or call <code>pg_blocking_pids()</code>, to find which session is blocking the others.`,

"How does PostgreSQL full-text search work?":
`Postgres turns text into a searchable list of word roots (a <code>tsvector</code>), so "running" and "runs" both match "run". Your search becomes a <code>tsquery</code>, and a GIN index makes matching fast. You can rank results and give title matches more weight than body matches, which is enough for many apps without Elasticsearch.`,

"What are advisory locks and LISTEN/NOTIFY?":
`<b>Advisory locks</b> are locks your application names and uses for its own purposes, such as "only one server runs the nightly job". <b>LISTEN/NOTIFY</b> lets one database session send a short message that other connected sessions receive instantly, which is useful for simple "something changed" signals.`,

"How do you monitor and size a PostgreSQL database in production?":
`Watch replication lag, connection counts, cache hit ratio, slow queries (<code>pg_stat_statements</code>), table bloat, disk usage and transaction ID age. Alert before problems hurt users: lag growing, connections near the limit, disk filling up, or transactions left open for a long time.`,

"What is the difference between DELETE, TRUNCATE and partition dropping for large data removal?":
`<b>DELETE</b> removes rows one at a time, leaves dead rows for vacuum, and is slow for millions of rows. <b>TRUNCATE</b> empties a whole table instantly. <b>Dropping a partition</b> removes one chunk of a partitioned table (such as last year's data) instantly. For regularly removing old data, partition by date and drop old partitions.`,

"How do you choose between a UUID and a bigint primary key?":
`A <b>bigint</b> from a sequence is small (8 bytes), fast and orderly, but the database must create it and the numbers are guessable. A random <b>UUID</b> can be created anywhere and is not guessable, but it is bigger and scatters inserts across the index. <b>UUIDv7</b> starts with the time, so it combines both benefits.`,

"What are database constraints and why enforce them at the database level?":
`Constraints are rules the database enforces: NOT NULL, UNIQUE, CHECK (such as price above 0) and FOREIGN KEY. Enforce them in the database, not only in your app, because other writers (scripts, other services, manual fixes) bypass app checks, and because only the database can safely prevent two simultaneous requests creating duplicates.`,

"How do you design and query time-series data in PostgreSQL?":
`Time-series data, such as sensor readings or events, keeps growing over time. Partition the table by time (one partition per day or month) so old data can be dropped instantly, use a BRIN index on the time column (tiny and efficient for data written in time order), and pre-calculate summaries for dashboards.`,

"What are common PostgreSQL data modelling mistakes?":
`Common ones: using <code>timestamp</code> instead of <code>timestamptz</code>, storing money as a floating-point number instead of <code>numeric</code> or whole paise, putting everything in JSONB when columns would be better, missing foreign keys and constraints, and forgetting indexes on foreign key columns.`,

"Your PostgreSQL database is suddenly slow — walk me through the triage":
`Check <code>pg_stat_activity</code> first: what is running, what is waiting, and for how long. Look for sessions blocked by locks, transactions left idle, a single heavy query, or a sudden spike in connections. Then check CPU, disk and memory, and use <code>pg_stat_statements</code> to find which queries consume the most time.`,

"What is the difference between UPDATE and DELETE in terms of MVCC and bloat?":
`In Postgres, an <b>UPDATE</b> is really "write a new version, mark the old one dead", so it creates a dead row and adds new index entries. A <b>DELETE</b> just marks the row dead. Both leave dead rows that take space until vacuum removes them, so tables with many updates grow (bloat) if vacuum cannot keep up.`,

"How do you choose the right index type and avoid over-indexing?":
`Use <b>B-tree</b> (the default) for equality, ranges and sorting; <b>GIN</b> for JSONB, arrays and full-text search; <b>GiST</b> for geographic data and ranges; <b>BRIN</b> for huge tables stored in time order. Every index slows down writes and uses space, so check <code>pg_stat_user_indexes</code> for indexes that are never used and remove them.`,

"What is connection pooling and why does PostgreSQL need PgBouncer?":
`Postgres starts a separate operating-system process for every connection, each using several megabytes, so hundreds of connections waste memory and slow things down. A pooler such as PgBouncer sits in front and lets thousands of app connections share a small number of real database connections.`,

"How does PostgreSQL handle JSON versus a normalised schema — when do you choose each?":
`Use normal columns for data you filter, join or sort on, or that needs constraints. Use JSONB for data whose shape really varies, such as product attributes that differ by category, or data you store as received from an outside system. A common approach mixes both: core fields as columns and the variable extras in JSONB.`,

"What are PostgreSQL's transaction isolation levels in practice, and what is SSI?":
`Postgres offers Read Committed (the default: each statement sees the latest committed data), Repeatable Read (the whole transaction sees one snapshot), and Serializable. Serializable uses <b>SSI</b>: it lets transactions run freely, detects when they might have conflicted, and cancels one, which your app must retry.`,

"How do you partition a large table, and when is it worth it?":
`Partitioning splits one large table into smaller pieces, usually by date, while you still query it as one table. Queries that filter by date only read the relevant pieces, and old pieces can be dropped instantly. It is worth it for very large tables, typically time-based data with a retention policy, not as a default for every table.`,

"Explain PostgreSQL replication and how you achieve high availability":
`The main server streams its write-ahead log (WAL) to one or more standby servers, which replay it to stay in sync. Asynchronous replication is fast but can lose the last few changes if the main server dies; synchronous waits for a standby to confirm. A tool such as Patroni detects failure and promotes a standby automatically.`,

"How do you use JSONB, full-text search and other Postgres features instead of adding a new datastore?":
`Before adding Elasticsearch, MongoDB or Redis, check whether Postgres can do the job: JSONB for flexible documents, built-in full-text search for basic searching, <code>SKIP LOCKED</code> for job queues, and LISTEN/NOTIFY for simple notifications. One database is much easier to run, back up and keep consistent than several.`,

"Explain VACUUM, autovacuum and transaction ID wraparound":
`Updates and deletes leave dead row versions behind. <b>VACUUM</b> cleans them up, and <b>autovacuum</b> does it automatically. Postgres also numbers transactions with a counter that eventually wraps around, so vacuum must regularly mark old rows as "frozen". If that falls badly behind, Postgres stops accepting writes to protect your data.`,

"Build a reliable job queue in PostgreSQL with SELECT ... FOR UPDATE SKIP LOCKED":
`Store jobs in a table. Each worker runs <code>SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1</code>, which grabs and locks one job that no other worker has locked, skipping the busy ones instead of waiting. Many workers can then pull jobs at the same time without clashing, and a crashed worker's lock is released automatically.`,

"Speed up three real queries with partial, expression and covering indexes":
`A <b>partial index</b> only includes rows matching a condition, such as unpaid orders, so it is small and fast. An <b>expression index</b> indexes a calculated value, such as <code>lower(email)</code>, so case-insensitive searches can use it. A <b>covering index</b> includes extra columns, so the query is answered from the index alone without reading the table.`,

"What is MVCC and how does PostgreSQL implement it?":
`MVCC means Postgres keeps several versions of each row instead of locking rows for reading. Each version is stamped with the transaction that created it and the one that ended it, and every query sees only the versions that were committed when its snapshot was taken. So readers never block writers, and writers never block readers.`,

"What is VACUUM and why is it necessary?":
`Because Postgres keeps old row versions after updates and deletes, they pile up as dead rows. VACUUM removes them so the space can be reused, updates statistics used for planning, and prevents transaction ID wraparound. Autovacuum runs it automatically; <code>VACUUM FULL</code> rewrites the whole table but locks it while doing so.`,

"What index types does PostgreSQL support?":
`<b>B-tree</b> (the default): equality, ranges and sorting. <b>Hash</b>: equality only. <b>GIN</b>: values containing many items, such as JSONB, arrays and full-text search. <b>GiST</b>: geometric data and ranges. <b>BRIN</b>: very large tables whose data is naturally ordered, such as by time.`,

"How does PostgreSQL handle JSON and JSONB?":
`<code>json</code> stores the text exactly as given. <code>jsonb</code> stores it in a parsed binary form, which is slightly slower to write but much faster to query, and it can be indexed with GIN. You query inside documents with operators such as <code>-&gt;&gt;</code> and <code>@&gt;</code>. Use jsonb in almost all cases.`,

"What are the isolation levels in PostgreSQL and how do they differ from the standard?":
`The SQL standard defines four levels. In Postgres, Read Uncommitted behaves the same as Read Committed, because it never shows unsaved data. Its Repeatable Read is stronger than the standard requires (it also prevents "phantom" rows), and Serializable truly behaves as if transactions ran one at a time, cancelling one when they conflict.`,

"How does table partitioning work in PostgreSQL?":
`You declare a parent table and how to split it (by range of dates, by list of values or by hash), then create child tables for each piece. Inserts automatically go to the right piece, and queries that filter on the partition column only touch the relevant pieces, which is called partition pruning.`,

"How does replication and high availability work in PostgreSQL?":
`<b>Streaming replication</b> sends the write-ahead log to standby servers, which keep an exact copy and can serve reads. <b>Logical replication</b> copies changes for chosen tables, useful for upgrades or moving data. For high availability, a tool such as Patroni watches the main server and promotes a standby if it fails.`,

"What is connection pooling and why does PostgreSQL need it?":
`Each Postgres connection is a separate operating-system process with its own memory, so connections are expensive. A pool keeps a small set of connections open and lends them to requests as needed. Use one in the app (HikariCP) and, with many app instances, PgBouncer in front of the database.`,

"What is the difference between UPSERT approaches — ON CONFLICT?":
`An upsert means "insert this row, or update it if it already exists". In Postgres, <code>INSERT ... ON CONFLICT (key) DO UPDATE</code> does this in one safe step. The naive approach, checking with SELECT and then inserting or updating, breaks when two requests run at the same time and both decide to insert.`,

"How do you find and fix a slow PostgreSQL database in production?":
`First decide whether it is one query or everything. Check <code>pg_stat_activity</code> for blocked or long-running sessions and <code>pg_stat_statements</code> for the most expensive queries. Then use <code>EXPLAIN ANALYZE</code> on the worst ones and fix the cause: missing indexes, outdated statistics, bloat, or lock contention.`,

"What is a CTE optimisation fence, and how do LATERAL joins work?":
`Before Postgres 12, a <code>WITH</code> query was always calculated separately, so the planner could not optimise across it; that was the "fence". Newer versions can fold it into the main query. A <b>LATERAL</b> join lets a subquery use values from each row of the preceding table, which is great for "top 3 orders per customer" queries.`,

"What PostgreSQL features would you use that other databases lack?":
`JSONB with indexes, array columns, built-in full-text search, partial and expression indexes, <code>INSERT ... ON CONFLICT</code>, <code>SKIP LOCKED</code> for queues, LISTEN/NOTIFY, row-level security, and extensions such as PostGIS for maps and pgvector for AI embeddings.`,

"How do you do zero-downtime schema migrations in PostgreSQL?":
`Old and new versions of your app run at the same time during a deploy, so every change must work with both. Add new things first and remove old ones in a later release. Use <code>CREATE INDEX CONCURRENTLY</code> so building an index does not block writes, set a short <code>lock_timeout</code>, and fill new columns in small batches.`,

"What are common PostgreSQL performance configuration parameters?":
`Key settings: <code>shared_buffers</code> (memory for caching data, around a quarter of RAM), <code>work_mem</code> (memory per sort or hash operation; set it carefully because one query can use it several times), <code>effective_cache_size</code> (a hint about available memory), and <code>max_connections</code> (keep it modest and use a pooler).`,

"What is row-level security and how would you use it for multi-tenancy?":
`Row-level security lets the database itself decide which rows each session can see or change. For a multi-tenant app, set the current tenant id on each connection and add a policy such as "only rows where tenant_id matches". Then even a buggy query cannot show one customer's data to another.`
});
