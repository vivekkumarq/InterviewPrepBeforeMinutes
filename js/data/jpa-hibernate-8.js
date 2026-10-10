registerSimple("jpa-hibernate", {
"What is the difference between get() and load() / findById() and getReferenceById()?":
`<code>findById()</code> goes to the database immediately and gives you the real object, or an empty result if it does not exist. <code>getReferenceById()</code> gives you a lightweight placeholder without querying, and only loads data when you touch it. The placeholder is handy when you just need to link to an existing row, for example setting an order's customer.`,

"What is the difference between JPQL, HQL, native SQL and Criteria API?":
`<b>JPQL</b> is a query language like SQL but written against your entity classes and fields, and it works with any JPA library. <b>HQL</b> is Hibernate's extended version of it. <b>Native SQL</b> is plain SQL for your specific database. The <b>Criteria API</b> builds queries in Java code, which is useful when filters change at run time.`,

"How do you map an enum, a JSON column and a composite key?":
`Store enums by name with <code>@Enumerated(EnumType.STRING)</code>; the default stores their position number, which breaks if you reorder them. Map a JSON column with a converter or Hibernate's JSON type. A composite key (a primary key made of two or more columns) uses a small separate key class with <code>@EmbeddedId</code> or <code>@IdClass</code>.`,

"What is the difference between @Transactional on a class, method, and readOnly?":
`On a class, <code>@Transactional</code> applies to every public method; on a method it applies only there, and the method's setting wins. <code>readOnly = true</code> tells Spring and Hibernate the method only reads data, so Hibernate skips change tracking and some databases can route the query to a read replica.`,

"How does Hibernate's flush work and when does it happen?":
`Flushing is Hibernate sending your pending changes to the database as SQL. It happens at commit, before a query that might need those changes, or when you call <code>flush()</code> yourself. Flushing writes the SQL but does not make it permanent; the commit does that.`,

"What are Spring Data JPA projections and when do you use them?":
`A projection loads only the fields you need, such as name and email, instead of the whole entity. You define a small interface or record with just those fields and use it as the repository method's return type. It is faster and uses less memory, ideal for lists and read-only screens.`,

"How do you audit entities with Spring Data JPA?":
`Auditing automatically records who created or changed a row and when. Add fields marked <code>@CreatedDate</code>, <code>@LastModifiedDate</code>, <code>@CreatedBy</code> and <code>@LastModifiedBy</code> and switch on auditing, and Spring fills them in. For a full history of every change, a library such as Hibernate Envers stores old versions too.`,

"What are the JPA performance anti-patterns you watch for?":
`The usual problems: the N+1 query problem, making relationships EAGER, loading whole entities when you only need a few fields, saving rows one at a time instead of in batches, and offset paging through huge tables. Most come from not looking at the SQL Hibernate actually generates.`,

"How do you handle soft deletes and multi-tenancy in Hibernate?":
`<b>Soft delete</b> means marking a row as deleted (with a flag) instead of really removing it, and filtering such rows out of normal queries automatically. <b>Multi-tenancy</b> means several customers share one system, and each query must only see that customer's data, usually by adding a tenant id filter to every query.`,

"You have a slow endpoint issuing 300 SQL queries — how do you find and fix it?":
`Turn on SQL logging or count queries in a test to confirm the cause, which is usually the N+1 problem: one query for a list plus one per item for its related data. Then fix it by loading the related data in the same query with a fetch join or entity graph, by batch loading, or by selecting only the needed fields.`,

"What is the difference between FetchType.LAZY on @ManyToOne and @OneToMany?":
`By default, single relationships (<code>@ManyToOne</code>, <code>@OneToOne</code>) load immediately (EAGER), while collections (<code>@OneToMany</code>) load lazily. Best practice is to make all of them LAZY explicitly, and fetch related data on purpose in the queries that need it.`,

"How do you handle a bidirectional relationship correctly?":
`In a two-way relationship (an Order has Items, each Item knows its Order), only the side with the foreign key, usually the Item, actually saves the link. So when you add an item, set both sides. A small helper method such as <code>order.addItem(item)</code> that does both avoids items silently not being saved.`,

"Explain the first-level and second-level cache with a concrete example":
`The <b>first-level cache</b> lives for one transaction: load the same customer twice and the second time comes from memory, not the database. It is always on. The <b>second-level cache</b> is shared across transactions and must be turned on per entity. It suits data that is read a lot and rarely changes, such as a list of countries.`,

"What is the difference between JPA repository methods — findBy, existsBy, countBy, deleteBy?":
`Spring Data builds queries from method names. <code>findBy...</code> loads matching rows, <code>existsBy...</code> just answers yes or no (fast), <code>countBy...</code> returns how many match, and <code>deleteBy...</code> removes them. Use existsBy rather than loading a row only to check whether it exists.`,

"How do you prevent lost updates when two users edit the same record?":
`If two people edit the same record at once, the second save can silently overwrite the first. <b>Optimistic locking</b> adds a version number: each update checks the version has not changed, and fails if it has, so you can tell the user to reload. <b>Pessimistic locking</b> locks the row while one person edits, making others wait.`,

"What is the difference between JPA and Hibernate-specific features you should avoid?":
`JPA is the standard; Hibernate adds extras on top. Sticking to standard JPA keeps your code portable and easier to understand. Use Hibernate-only features (such as special annotations) only when they solve a real problem the standard cannot, and know that you are tying yourself to Hibernate.`,

"How do you map a legacy database schema you cannot change?":
`When you cannot change an old database, adapt the mapping instead: set table and column names explicitly, use converters for odd formats (such as Y/N flags), and use composite keys or read-only views where needed. Map only the columns you actually use.`,

"What causes LazyInitializationException and what is the right fix?":
`It happens when you touch lazily loaded data after the transaction has ended, so Hibernate can no longer reach the database, often while converting an entity to JSON. The right fix is to load exactly what you need inside the transaction, with a fetch join, an entity graph or a DTO. Keeping the connection open longer only hides the problem.`,

"Explain the N+1 problem and every way to fix it":
`You run one query to load N items, then each item triggers another query for its related data: 1 + N queries. Fixes: a fetch join (one query that loads everything), an entity graph (the same, declared on the repository method), batch fetching (load related data in groups), or a DTO projection that selects exactly the fields needed.`,

"How do you handle concurrent updates — optimistic or pessimistic locking?":
`Optimistic locking assumes conflicts are rare: no lock is taken, and a version number detects a conflict when saving, so you retry. Pessimistic locking assumes conflicts are likely: the database locks the row and others wait. Choose optimistic for most web apps and pessimistic for short, high-contention operations such as reserving the last seat.`,

"Explain transaction propagation, and when would you use REQUIRES_NEW?":
`Propagation decides what happens when one transactional method calls another. With the default (REQUIRED), they share one transaction and roll back together. REQUIRES_NEW pauses the current transaction and runs the inner method in its own, which commits separately. Use it for things that must be saved even if the main work fails, such as an audit log entry.`,

"How do the Hibernate caches work, and when should you enable the second-level cache?":
`The first-level cache is automatic and lasts one transaction. The second-level cache is optional and shared across transactions, so it saves database trips for data that is read often and rarely changes. Do not turn it on for data that changes frequently, because keeping it up to date costs more than it saves.`,

"The N+1 problem: how do you find it, and what are the trade-offs of each fix?":
`Find it by logging SQL or counting queries in a test. Fetch joins load everything in one query but are tricky to combine with paging. Batch fetching keeps paging working and reduces N queries to a few. DTO projections are the most efficient but return read-only data. Pick based on how the data is used.`,

"Explain the persistence context, dirty checking, and the entity lifecycle":
`The persistence context is the set of entities Hibernate is tracking in a transaction. An entity is <b>new</b> before saving, <b>managed</b> while tracked, <b>detached</b> once the transaction ends, and <b>removed</b> when deleted. Dirty checking means Hibernate compares managed entities with their original state at commit and saves only what changed.`,

"Your update saved nothing, or saved something you never asked for. Explain both":
`Both come from not knowing whether an entity is managed. If you change an entity outside a transaction, it is detached, so nothing is saved. If you change a managed entity inside a transaction, even "just to calculate something", Hibernate saves that change at commit without being asked. Keep write methods transactional and do not use entities as scratch pads.`,

"Page through a ten-million-row table without slowing down: offset vs keyset pagination":
`Offset paging ("skip 50,000 rows, give me the next 50") gets slower the deeper you go, because the database still reads all the skipped rows. Keyset paging remembers the last id you saw and asks for rows after it ("id greater than 50,000"), which stays fast on any page when that column is indexed.`,

"What is JPA, Hibernate and Spring Data JPA — how do they relate?":
`<b>JPA</b> is the standard: a set of rules and annotations for mapping objects to tables. <b>Hibernate</b> is the library that does the actual work and generates SQL. <b>Spring Data JPA</b> sits on top and writes repository code for you, so you can just declare <code>findByEmail(String email)</code>.`,

"Explain the entity lifecycle states":
`<b>New</b> (transient): just created with <code>new</code> and not known to Hibernate. <b>Managed</b>: being tracked, so changes save automatically. <b>Detached</b>: was managed, but the transaction ended, so changes are ignored. <b>Removed</b>: marked for deletion when the transaction commits.`,

"What is the persistence context and first-level cache?":
`The persistence context is Hibernate's working memory for one transaction. It keeps one copy of each loaded entity: ask for the same row twice and you get the same object without a second query. That is the first-level cache. It is also where Hibernate tracks changes to save at commit.`,

"What is the N+1 select problem and how do you fix it?":
`Loading a list of N items and then touching a lazy relationship on each one causes one extra query per item, 1 + N queries in total. Fix it by fetching the related data in the same query (<code>JOIN FETCH</code> or <code>@EntityGraph</code>), using batch fetching, or selecting only the fields you need into a DTO.`,

"FetchType.LAZY vs EAGER — which and why?":
`LAZY loads related data only when you use it; EAGER always loads it immediately. Prefer LAZY everywhere, because EAGER drags extra data into every query whether you need it or not, often with extra queries. Then load related data on purpose in the specific queries that need it.`,

"What is the difference between save(), persist(), merge() and saveAndFlush()?":
`<code>persist()</code> starts tracking a brand-new entity. <code>merge()</code> copies a detached entity's data onto a managed copy and returns that copy, which you should use from then on. Spring's <code>save()</code> calls one or the other depending on whether the entity is new. <code>saveAndFlush()</code> also sends the SQL to the database immediately.`,

"Explain cascade types and orphanRemoval":
`Cascade means an action on a parent also applies to its children: with <code>CascadeType.PERSIST</code>, saving an order saves its new items too. <code>orphanRemoval = true</code> deletes a child automatically when it is removed from its parent's collection. Use them for parent-child relationships where the children belong only to that parent.`,

"How do you map relationships — @OneToMany, @ManyToOne, @ManyToMany?":
`<code>@ManyToOne</code>: many items belong to one order (the foreign key lives here). <code>@OneToMany</code>: one order has many items. <code>@ManyToMany</code>: students and courses, through a link table. In two-way relationships, <code>mappedBy</code> marks the side that does not own the foreign key, and you must keep both sides in sync.`,

"What are the ID generation strategies and which should you use?":
`IDs can come from an auto-increment column (IDENTITY), a database sequence (SEQUENCE), a UUID, or a table. SEQUENCE is usually best with JPA because Hibernate can get many ids at once and batch inserts. IDENTITY is simple, but it forces Hibernate to insert rows one at a time.`,

"What is optimistic vs pessimistic locking?":
`<b>Optimistic</b>: no lock; a version column detects that someone else changed the row since you read it, and your save fails so you can retry. <b>Pessimistic</b>: the database locks the row so others must wait until you finish. Optimistic suits most web apps; pessimistic suits short operations with lots of competition.`,

"What are the transaction isolation levels and their anomalies?":
`Isolation levels control how much one transaction sees of others running at the same time. Lower levels are faster but allow odd effects: reading data another transaction has not committed yet (dirty read), the same query returning different results within one transaction, or new rows appearing (phantom read). Higher levels prevent more of these, at a cost in speed.`,

"What is the second-level cache and when is it worth it?":
`The second-level cache keeps entities in memory across transactions, so repeated reads of the same rows skip the database. It is worth it for data that is read very often and changes rarely, such as reference data. For frequently changing data, the effort of keeping the cache correct outweighs the benefit.`,

"JPQL vs Criteria API vs native query vs Specifications — when to use each?":
`Use derived method names for simple queries, JPQL for readable fixed queries, the Criteria API or Specifications when filters change at run time (such as a search form), and native SQL when you need database-specific features. Choose whatever keeps each query clear and correct.`,

"How do you do bulk inserts and updates efficiently?":
`Turn on JDBC batching so Hibernate sends many inserts in one trip, use SEQUENCE ids (IDENTITY disables batching), and flush and clear the persistence context every few hundred rows so memory does not fill up. For huge updates, a single bulk UPDATE query or plain JDBC is often far faster.`,

"What is LazyInitializationException and what are the right and wrong fixes?":
`It means lazily loaded data was accessed after the transaction closed. Right fixes: fetch what you need inside the transaction, and return DTOs instead of entities. Wrong fixes: making everything EAGER, or keeping the connection open for the whole web request, which hides the problem and hurts performance.`,

"How do you map inheritance in JPA?":
`There are three ways to store a class hierarchy. <b>SINGLE_TABLE</b>: all types in one table with a type column; fastest, but many nullable columns. <b>JOINED</b>: one table per class joined together; tidy, but needs joins. <b>TABLE_PER_CLASS</b>: one full table per concrete class; queries across all types are awkward.`,

"How do you write equals() and hashCode() for a JPA entity?":
`It is tricky because a new entity has no id until it is saved, so a hash code based on the id would change after saving and break HashSets. Safe options: use a natural business key that never changes, such as an email, or compare by id when it is set and return a constant hash code.`,

"How do you debug and optimise slow JPA queries?":
`First see the real SQL, with parameter values, using logging or a tool such as p6spy. Count how many queries each request makes, then check the slow ones in the database with EXPLAIN. Fix N+1 problems, add missing indexes, select fewer columns, and batch writes.`
});
