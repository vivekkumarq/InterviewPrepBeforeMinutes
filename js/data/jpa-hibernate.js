registerTopic("jpa-hibernate", [
{
  q: "What is JPA, Hibernate and Spring Data JPA — how do they relate?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<ul>
<li><strong>JPA</strong> — a <em>specification</em> (Jakarta Persistence). Interfaces and annotations only: <code>@Entity</code>, <code>EntityManager</code>, JPQL. No implementation.</li>
<li><strong>Hibernate</strong> — the most popular JPA <em>implementation</em>. Also offers features beyond the spec: <code>@Formula</code>, filters, second-level cache providers, its own <code>Session</code> API.</li>
<li><strong>Spring Data JPA</strong> — a layer <em>on top</em> of JPA that removes DAO boilerplate: derived query methods, <code>Pageable</code>, auditing, specifications. It generates repository implementations at runtime.</li>
</ul>
<pre><code>interface OrderRepository extends JpaRepository&lt;Order, Long&gt; {
    // no implementation needed — Spring Data parses the method NAME into a query
    List&lt;Order&gt; findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, Status status);
    Optional&lt;Order&gt; findByReference(String ref);
    boolean existsByReference(String ref);
    long countByStatus(Status status);
}</code></pre>
<p>Stack, top to bottom: <em>Spring Data JPA → JPA (spec) → Hibernate → JDBC → driver → database</em>.</p>`
},
{
  q: "Explain the entity lifecycle states",
  level: "beginner", hot: true, tags: ["lifecycle", "persistence-context"],
  a: `<figure class="fig">
<svg viewBox="0 0 640 180" role="img" aria-label="JPA entity lifecycle states">
  <rect class="dg-box" x="14" y="70" width="112" height="40" rx="8"/><text class="dg-t" x="70" y="94" text-anchor="middle">Transient</text>
  <path class="dg-line" d="M130 90 H206" marker-end="url(#e1)"/><text class="dg-m" x="168" y="82" text-anchor="middle">persist()</text>
  <rect class="dg-fill" x="210" y="70" width="124" height="40" rx="8"/><text class="dg-t" x="272" y="94" text-anchor="middle">Managed</text>
  <path class="dg-line" d="M338 90 H420" marker-end="url(#e1)"/><text class="dg-m" x="379" y="82" text-anchor="middle">detach()/close</text>
  <rect class="dg-box" x="424" y="70" width="112" height="40" rx="8"/><text class="dg-t" x="480" y="94" text-anchor="middle">Detached</text>
  <path class="dg-line" d="M480 70 V40 H272 V70" marker-end="url(#e1)"/><text class="dg-m" x="376" y="34" text-anchor="middle">merge()</text>
  <path class="dg-line" d="M272 110 V148 H150" marker-end="url(#e1)"/><text class="dg-m" x="240" y="164" text-anchor="middle">remove()</text>
  <rect class="dg-fill2" x="26" y="130" width="120" height="38" rx="8"/><text class="dg-t" x="86" y="154" text-anchor="middle">Removed</text>
  <text class="dg-s" x="272" y="128" text-anchor="middle">tracked by the persistence context — dirty checked</text>
  <defs><marker id="e1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Only Managed entities are dirty-checked and auto-flushed.</figcaption>
</figure>
<ul>
<li><strong>Transient</strong> — a plain new object; no database identity, not tracked.</li>
<li><strong>Managed (persistent)</strong> — attached to the persistence context. <strong>Any change to it is automatically written at flush time</strong> — you do not need to call <code>save()</code>.</li>
<li><strong>Detached</strong> — was managed, but the context closed or it was evicted. Changes are ignored until you <code>merge()</code>.</li>
<li><strong>Removed</strong> — scheduled for deletion at flush.</li>
</ul>
<pre><code>@Transactional
public void raisePrice(Long id) {
    Product p = repo.findById(id).orElseThrow();   // MANAGED
    p.setPrice(p.getPrice().multiply(new BigDecimal("1.1")));
    // no repo.save(p) needed — dirty checking issues the UPDATE at commit
}</code></pre>
<p>That automatic dirty checking is the single most important thing to understand about JPA — and the source of most surprises, both good and bad.</p>`
},
{
  q: "What is the persistence context and first-level cache?",
  level: "advanced", hot: true, tags: ["persistence-context"],
  a: `<p>The <strong>persistence context</strong> is the <code>EntityManager</code>'s working memory — a map of entity identity to instance, scoped to the transaction by default. It <em>is</em> the first-level cache, and it is mandatory, not optional.</p>
<p><strong>What it gives you:</strong></p>
<ul>
<li><strong>Identity guarantee</strong> — within one context, the same row is always the same Java object, so <code>==</code> works:
<pre><code>Order a = em.find(Order.class, 1L);
Order b = em.find(Order.class, 1L);   // no second SELECT
assert a == b;                        // true</code></pre></li>
<li><strong>Dirty checking</strong> — Hibernate keeps a snapshot at load time and compares at flush, generating UPDATEs only for changed entities.</li>
<li><strong>Write-behind</strong> — statements are batched and deferred until flush, so ordering and batching can be optimised.</li>
<li><strong>Repeatable reads within the transaction.</strong></li>
</ul>
<p><strong>When does flush happen?</strong> Before a JPQL/native query that might touch dirty state, on commit, or on explicit <code>flush()</code>. <code>FlushModeType.COMMIT</code> defers it further.</p>
<blockquote><p><strong>The danger:</strong> the context holds every entity you load. Reading 500,000 rows in one transaction means 500,000 managed objects plus their snapshots — a memory blow-up. For bulk work, use <code>StatelessSession</code>, paginate with periodic <code>flush()</code> + <code>clear()</code>, or write bulk JPQL/native updates.</p></blockquote>`
},
{
  q: "What is the N+1 select problem and how do you fix it?",
  level: "advanced", hot: true, tags: ["performance", "n+1"],
  a: `<p>You load N parent rows with one query, then touching a lazy association on each triggers one more query per parent — <strong>1 + N</strong> queries. The classic silent killer: fast in dev with 10 rows, catastrophic in production with 10,000.</p>
<pre><code>List&lt;Order&gt; orders = orderRepo.findAll();          // 1 query
for (Order o : orders) {
    o.getCustomer().getName();                     // + 1 query EACH
}</code></pre>
<p><strong>Fixes, in order of preference:</strong></p>
<pre><code>// 1. JOIN FETCH — one query, best for a single collection
@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.customer JOIN FETCH o.items WHERE o.status = :s")
List&lt;Order&gt; findWithDetails(@Param("s") Status s);

// 2. Entity graph — declarative, works with derived queries and Pageable
@EntityGraph(attributePaths = {"customer", "items"})
List&lt;Order&gt; findByStatus(Status status);

// 3. Batch fetching — turns N queries into N/batchSize
@BatchSize(size = 50)                  // on the collection or the entity
// or globally: spring.jpa.properties.hibernate.default_batch_fetch_size=50

// 4. DTO projection — fetch only what you need, no entities at all
@Query("SELECT new com.acme.OrderSummary(o.id, o.total, c.name) FROM Order o JOIN o.customer c")
List&lt;OrderSummary&gt; summaries();</code></pre>
<p><strong>Caveats worth raising:</strong> you cannot <code>JOIN FETCH</code> two collections in one query (it produces a Cartesian product — <code>MultipleBagFetchException</code>); use one fetch plus <code>@BatchSize</code> for the second. And <code>JOIN FETCH</code> with <code>Pageable</code> makes Hibernate paginate <em>in memory</em>, with a warning in the logs — use an entity graph or a two-query approach instead.</p>
<p><strong>How to catch it:</strong> enable <code>spring.jpa.show-sql</code> in tests, or better, assert query counts with <strong>datasource-proxy</strong> so a regression fails the build.</p>`
},
{
  q: "FetchType.LAZY vs EAGER — which and why?",
  level: "beginner", hot: true, tags: ["fetching", "performance"],
  a: `<table>
<tr><th>Association</th><th>JPA default</th><th>What you should use</th></tr>
<tr><td><code>@OneToOne</code></td><td>EAGER</td><td><strong>LAZY</strong> (explicitly)</td></tr>
<tr><td><code>@ManyToOne</code></td><td>EAGER</td><td><strong>LAZY</strong> (explicitly)</td></tr>
<tr><td><code>@OneToMany</code></td><td>LAZY</td><td>LAZY</td></tr>
<tr><td><code>@ManyToMany</code></td><td>LAZY</td><td>LAZY</td></tr>
</table>
<pre><code>@ManyToOne(fetch = FetchType.LAZY)     // ALWAYS write this — the default is wrong
@JoinColumn(name = "customer_id")
private Customer customer;</code></pre>
<p><strong>Why EAGER is almost always wrong:</strong> it applies to <em>every</em> query, everywhere, forever. One eager <code>@ManyToOne</code> on an entity that itself has an eager association produces a cascading join that loads half the database for a query that needed one column. And it makes N+1 impossible to fix locally, because you cannot make an eager association lazy per query.</p>
<p><strong>The right model:</strong> declare everything LAZY, then fetch eagerly <em>per use case</em> with <code>JOIN FETCH</code> or an entity graph. Fetching is a query concern, not a mapping concern.</p>
<p><strong>The consequence to be ready for:</strong> <code>LazyInitializationException</code> when you touch a lazy association after the session closed. The fix is to fetch what you need inside the transaction and return a DTO — <em>not</em> <code>spring.jpa.open-in-view=true</code>, which is on by default and should be disabled (it holds a database connection for the whole request and hides N+1 problems until production).</p>`
},
{
  q: "What is the difference between save(), persist(), merge() and saveAndFlush()?",
  level: "advanced", hot: true, tags: ["crud"],
  a: `<table>
<tr><th>Method</th><th>Origin</th><th>Behaviour</th></tr>
<tr><td><code>persist()</code></td><td>JPA</td><td>Transient → managed. Returns void. Throws if the entity already has an ID and exists.</td></tr>
<tr><td><code>merge()</code></td><td>JPA</td><td>Copies detached state into a managed instance and <strong>returns that managed copy</strong>. The argument stays detached.</td></tr>
<tr><td><code>save()</code></td><td>Spring Data</td><td>Calls <code>persist()</code> if the entity is new (ID null / version null), else <code>merge()</code>.</td></tr>
<tr><td><code>saveAndFlush()</code></td><td>Spring Data</td><td><code>save()</code> then immediate <code>flush()</code> — forces the SQL now.</td></tr>
</table>
<pre><code>// The merge trap — a very common bug
Order detached = ...;
orderRepo.save(detached);         // 'detached' is still DETACHED
detached.setStatus(SHIPPED);      // this change is LOST

Order managed = orderRepo.save(detached);   // use the RETURN value
managed.setStatus(SHIPPED);                 // now dirty checking applies</code></pre>
<p><strong>Performance note:</strong> <code>merge()</code> issues a <code>SELECT</code> first to load the current row before copying, so saving a detached entity costs an extra query. Where the ID is assigned by you rather than generated, Spring Data cannot tell "new" from "detached" — implement <code>Persistable</code> or add a version field to avoid a needless select on every insert.</p>`
},
{
  q: "Explain cascade types and orphanRemoval",
  level: "advanced", tags: ["mapping"],
  a: `<table>
<tr><th>Cascade</th><th>Propagates</th></tr>
<tr><td><code>PERSIST</code></td><td>Saving the parent saves new children</td></tr>
<tr><td><code>MERGE</code></td><td>Merging the parent merges children</td></tr>
<tr><td><code>REMOVE</code></td><td>Deleting the parent deletes children</td></tr>
<tr><td><code>REFRESH</code></td><td>Reloading the parent reloads children</td></tr>
<tr><td><code>DETACH</code></td><td>Detaching cascades</td></tr>
<tr><td><code>ALL</code></td><td>All of the above</td></tr>
</table>
<pre><code>@OneToMany(mappedBy = "order",
           cascade = CascadeType.ALL,
           orphanRemoval = true,          // removing from the list DELETES the row
           fetch = FetchType.LAZY)
private List&lt;OrderLine&gt; lines = new ArrayList&lt;&gt;();

// keep both sides in sync — a helper method, always
public void addLine(OrderLine l) { lines.add(l); l.setOrder(this); }
public void removeLine(OrderLine l) { lines.remove(l); l.setOrder(null); }</code></pre>
<p><strong><code>CascadeType.REMOVE</code> vs <code>orphanRemoval</code>:</strong> REMOVE only fires when the <em>parent</em> is deleted. <code>orphanRemoval = true</code> additionally deletes a child the moment it is removed from the collection — that is what makes <code>order.getLines().clear()</code> actually delete rows.</p>
<p><strong>Design rule:</strong> cascade only along genuine <em>composition</em> (an order owns its lines). Never cascade REMOVE across an association to a shared entity — cascading from <code>Order</code> to <code>Customer</code> would delete the customer when an order is cancelled. That mistake reaches production more often than you would think.</p>`
},
{
  q: "How do you map relationships — @OneToMany, @ManyToOne, @ManyToMany?",
  level: "beginner", hot: true, tags: ["mapping"],
  a: `<pre><code>// Bidirectional one-to-many. The MANY side owns the foreign key.
@Entity
public class Order {
    @Id @GeneratedValue(strategy = IDENTITY) private Long id;

    @OneToMany(mappedBy = "order", cascade = ALL, orphanRemoval = true)
    private List&lt;OrderLine&gt; lines = new ArrayList&lt;&gt;();
}

@Entity
public class OrderLine {
    @ManyToOne(fetch = LAZY)                    // owning side — has the FK column
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
}</code></pre>
<p><strong><code>mappedBy</code> marks the <em>inverse</em> side.</strong> Only the owning side's changes are written; updating just the inverse collection without setting the child's parent silently does nothing. Hence the helper methods.</p>
<pre><code>// Many-to-many — prefer modelling the join table as an entity
@Entity
public class Enrollment {                       // instead of @ManyToMany
    @EmbeddedId private EnrollmentId id;
    @ManyToOne @MapsId("studentId") private Student student;
    @ManyToOne @MapsId("courseId")  private Course course;
    private LocalDate enrolledAt;               // &lt;-- attributes on the relationship
    private BigDecimal grade;
}</code></pre>
<p><strong>Why avoid <code>@ManyToMany</code>:</strong> you cannot add attributes to the relationship, and Hibernate deletes and re-inserts the whole join table when the collection changes. Real relationships almost always acquire attributes eventually — model the join as an entity from the start.</p>
<p>Also prefer <code>Set</code> over <code>List</code> for collections where order does not matter (it avoids the delete-all-reinsert behaviour), and always implement <code>equals</code>/<code>hashCode</code> on a business key or a UUID, never on a generated ID.</p>`
},
{
  q: "What are the ID generation strategies and which should you use?",
  level: "advanced", hot: true, tags: ["mapping", "performance"],
  a: `<table>
<tr><th>Strategy</th><th>How</th><th>Trade-off</th></tr>
<tr><td><code>IDENTITY</code></td><td>Database auto-increment column</td><td><strong>Disables JDBC batch inserts</strong> — Hibernate must execute each insert to learn the ID</td></tr>
<tr><td><code>SEQUENCE</code></td><td>Database sequence</td><td><strong>Best</strong> — supports batching and pooled allocation</td></tr>
<tr><td><code>TABLE</code></td><td>A table simulating a sequence</td><td>Portable but slow and lock-prone. Avoid.</td></tr>
<tr><td><code>AUTO</code></td><td>Provider chooses</td><td>Unpredictable across databases; be explicit</td></tr>
<tr><td>Assigned / UUID</td><td>You set it</td><td>Good for distributed generation; random UUIDs hurt index locality</td></tr>
</table>
<pre><code>@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_seq",
                   allocationSize = 50)     // fetch 50 IDs per round trip
private Long id;</code></pre>
<p><strong>The point that impresses:</strong> with <code>IDENTITY</code>, <code>hibernate.jdbc.batch_size</code> has no effect on inserts, because Hibernate needs the generated key immediately to put the entity in the persistence context. Switching to <code>SEQUENCE</code> with a pooled <code>allocationSize</code> turned a bulk import from thousands of round trips into a handful in projects I have worked on — that is a concrete, credible performance story.</p>
<p>For distributed systems where IDs must be generated without the database, mention <strong>UUIDv7</strong> (time-ordered, so it keeps B-tree locality unlike UUIDv4) or a Snowflake-style ID.</p>`
},
{
  q: "What is optimistic vs pessimistic locking?",
  level: "advanced", hot: true, tags: ["concurrency", "locking"],
  a: `<p><strong>Optimistic locking</strong> — assume conflicts are rare. Add a <code>@Version</code> column; every update includes <code>WHERE version = ?</code> and increments it. If zero rows are affected, someone else changed the row and you get <code>OptimisticLockException</code>.</p>
<pre><code>@Entity
public class Product {
    @Version private Long version;      // Hibernate manages this entirely
    private int stock;
}
// UPDATE product SET stock=?, version=6 WHERE id=? AND version=5
</code></pre>
<p><strong>Pessimistic locking</strong> — take a database lock up front, so others block.</p>
<pre><code>@Lock(LockModeType.PESSIMISTIC_WRITE)          // SELECT ... FOR UPDATE
@Query("SELECT p FROM Product p WHERE p.id = :id")
Optional&lt;Product&gt; findByIdForUpdate(@Param("id") Long id);

@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))</code></pre>
<table>
<tr><th></th><th>Optimistic</th><th>Pessimistic</th></tr>
<tr><td>Cost when uncontended</td><td>Nearly free</td><td>Lock overhead on every read</td></tr>
<tr><td>Behaviour on conflict</td><td>Fails at commit — you must retry</td><td>Waits (or times out)</td></tr>
<tr><td>Deadlock risk</td><td>None</td><td>Real</td></tr>
<tr><td>Use for</td><td>Low contention, long "think time", web requests</td><td>Hot rows, short critical sections, financial ledgers</td></tr>
</table>
<p><strong>Handling the failure properly</strong> is what makes optimistic locking usable — retry with backoff, and reload the entity inside the retry:</p>
<pre><code>@Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional
public void decrementStock(Long id, int qty) { ... }</code></pre>
<p>A third option worth naming for simple counters: an atomic SQL update — <code>UPDATE product SET stock = stock - ? WHERE id = ? AND stock &gt;= ?</code> — which needs no locking or retry at all.</p>`
},
{
  q: "What are the transaction isolation levels and their anomalies?",
  level: "advanced", hot: true, tags: ["transactions"],
  a: `<table>
<tr><th>Level</th><th>Dirty read</th><th>Non-repeatable read</th><th>Phantom read</th></tr>
<tr><td>READ UNCOMMITTED</td><td>Possible</td><td>Possible</td><td>Possible</td></tr>
<tr><td>READ COMMITTED</td><td>Prevented</td><td>Possible</td><td>Possible</td></tr>
<tr><td>REPEATABLE READ</td><td>Prevented</td><td>Prevented</td><td>Possible*</td></tr>
<tr><td>SERIALIZABLE</td><td>Prevented</td><td>Prevented</td><td>Prevented</td></tr>
</table>
<ul>
<li><strong>Dirty read</strong> — you read a row another transaction has changed but not committed.</li>
<li><strong>Non-repeatable read</strong> — you read the same row twice and get different values, because another transaction committed in between.</li>
<li><strong>Phantom read</strong> — you run the same range query twice and new rows appear.</li>
<li><strong>Lost update</strong> — two transactions read-modify-write and one overwrites the other. This is the one that actually bites in web applications, and it is why you need <code>@Version</code>.</li>
</ul>
<p>*Under PostgreSQL's MVCC, REPEATABLE READ (snapshot isolation) also prevents phantom reads.</p>
<pre><code>@Transactional(isolation = Isolation.REPEATABLE_READ)</code></pre>
<p><strong>Defaults to know:</strong> PostgreSQL and Oracle default to READ COMMITTED; MySQL InnoDB defaults to REPEATABLE READ. Raising isolation costs concurrency, so the usual production answer is: keep READ COMMITTED and handle the specific anomaly you care about with optimistic locking or an atomic statement, rather than escalating everything to SERIALIZABLE.</p>`
},
{
  q: "What is the second-level cache and when is it worth it?",
  level: "advanced", tags: ["caching", "performance"],
  a: `<p>The <strong>first-level cache</strong> is the persistence context — per transaction, always on. The <strong>second-level cache</strong> is shared across transactions and sessions in the same JVM (or distributed with Hazelcast/Infinispan).</p>
<pre><code>spring.jpa.properties.hibernate.cache.use_second_level_cache: true
spring.jpa.properties.hibernate.cache.use_query_cache: true
spring.jpa.properties.hibernate.cache.region.factory_class: jcache</code></pre>
<pre><code>@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE, region = "country")
public class Country { ... }</code></pre>
<p><strong>Concurrency strategies:</strong> <code>READ_ONLY</code> (immutable reference data — the safest and fastest), <code>NONSTRICT_READ_WRITE</code>, <code>READ_WRITE</code> (soft locks), <code>TRANSACTIONAL</code> (needs a JTA cache provider).</p>
<p><strong>When it is worth it:</strong> small, stable, frequently read reference data — countries, currencies, product categories, tariff plans. <strong>When it is not:</strong> frequently updated entities, anything written by another application or by native bulk SQL (which bypasses the cache and leaves it stale), and highly relational data where you would be better off with a well-shaped query.</p>
<p><strong>The honest senior take:</strong> in a multi-instance deployment, entity-level caching often creates more consistency problems than it solves. An explicit application-level cache (Redis/Caffeine) around a service method gives you clearer TTL, invalidation and observability. Say that — it shows you have run this in production, not just read about it.</p>`
},
{
  q: "JPQL vs Criteria API vs native query vs Specifications — when to use each?",
  level: "advanced", tags: ["queries"],
  a: `<pre><code>// 1. Derived query — simple and readable, but names get absurd beyond 3 conditions
List&lt;Order&gt; findByStatusAndTotalGreaterThan(Status s, BigDecimal min);

// 2. JPQL — entity-oriented, portable, my default for anything non-trivial
@Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.createdAt &gt; :since")
List&lt;Order&gt; recent(@Param("since") Instant since);

// 3. Native SQL — for database-specific features: window functions, CTEs, JSONB
@Query(value = "SELECT * FROM orders WHERE data @&gt; :filter::jsonb", nativeQuery = true)
List&lt;Order&gt; byJsonFilter(@Param("filter") String filter);

// 4. Specifications — DYNAMIC filters composed at runtime (the search-screen problem)
public static Specification&lt;Order&gt; hasStatus(Status s) {
    return (root, q, cb) -&gt; s == null ? null : cb.equal(root.get("status"), s);
}
repo.findAll(hasStatus(status).and(createdAfter(from)), pageable);

// 5. Projections — return only the columns you need
interface OrderSummary { Long getId(); BigDecimal getTotal(); String getCustomerName(); }
List&lt;OrderSummary&gt; findByStatus(Status s);</code></pre>
<table>
<tr><th>Approach</th><th>Type-safe</th><th>Dynamic</th><th>Readable</th></tr>
<tr><td>Derived methods</td><td>Partially</td><td>No</td><td>Good, until it isn't</td></tr>
<tr><td>JPQL</td><td>No (string)</td><td>No</td><td>Best</td></tr>
<tr><td>Criteria / Specifications</td><td>Yes</td><td><strong>Yes</strong></td><td>Verbose</td></tr>
<tr><td>Native SQL</td><td>No</td><td>No</td><td>Good, not portable</td></tr>
<tr><td>jOOQ / QueryDSL</td><td><strong>Yes</strong></td><td>Yes</td><td>Very good</td></tr>
</table>
<p>Since you have used <strong>jOOQ</strong>: it is worth saying it gives you type-safe SQL with compile-time validation against the real schema, which is the best of both worlds for query-heavy services where JPA's abstraction gets in the way.</p>`
},
{
  q: "How do you do bulk inserts and updates efficiently?",
  level: "advanced", hot: true, tags: ["performance", "batch"],
  a: `<pre><code>spring:
  jpa.properties.hibernate:
    jdbc.batch_size: 50
    order_inserts: true            # group by table so batches are contiguous
    order_updates: true
    batch_versioned_data: true
  datasource.hikari.data-source-properties:
    reWriteBatchedInserts: true    # PostgreSQL: rewrite into multi-row INSERT</code></pre>
<pre><code>@Transactional
public void importAll(List&lt;Product&gt; products) {
    for (int i = 0; i &lt; products.size(); i++) {
        em.persist(products.get(i));
        if (i % 50 == 0) {           // must match batch_size
            em.flush();
            em.clear();              // CRITICAL — stops the context growing unbounded
        }
    }
}</code></pre>
<p><strong>Requirements for batching to actually happen</strong> (this is what the question tests):</p>
<ul>
<li><strong>Do not use <code>GenerationType.IDENTITY</code></strong> — it silently disables insert batching entirely. Use <code>SEQUENCE</code> with a pooled <code>allocationSize</code>.</li>
<li>Flush and clear periodically, or you will run out of heap.</li>
<li>Verify with <code>hibernate.generate_statistics=true</code> — do not assume it worked.</li>
</ul>
<p><strong>For genuinely large volumes, skip JPA:</strong></p>
<pre><code>// Bulk JPQL — one statement, but it bypasses the persistence context and the cache
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("UPDATE Order o SET o.status = :new WHERE o.status = :old")
int bulkUpdateStatus(Status old, Status new);

// JdbcTemplate batch, or PostgreSQL COPY for millions of rows
jdbcTemplate.batchUpdate(sql, batchArgs);</code></pre>`
},
{
  q: "What is LazyInitializationException and what are the right and wrong fixes?",
  level: "advanced", hot: true, tags: ["fetching", "gotcha"],
  a: `<p>It is thrown when you access a lazy association after the persistence context has closed — typically in the controller or during JSON serialisation, after the <code>@Transactional</code> service method returned.</p>
<p><strong>The right fixes:</strong></p>
<ol>
<li><strong>Fetch what you need inside the transaction</strong> — <code>JOIN FETCH</code> or <code>@EntityGraph</code>, driven by the use case.</li>
<li><strong>Return DTOs, not entities.</strong> Map inside the transactional boundary. This solves the problem structurally and also stops you leaking the database model into the API.</li>
<li><strong>Use projections</strong> — let the query return exactly the shape you need.</li>
</ol>
<p><strong>The wrong fixes, and why:</strong></p>
<ul>
<li><strong><code>spring.jpa.open-in-view=true</code></strong> (the default — Spring even logs a warning). It keeps the persistence context open for the entire HTTP request, so the exception disappears… and is replaced by a database connection held during view rendering and JSON writing, plus N+1 queries fired from the serialiser that no one notices until load testing. <strong>Set it to false</strong> and fix the real cause.</li>
<li><strong>Making everything EAGER</strong> — trades a visible exception for an invisible performance disaster.</li>
<li><strong><code>Hibernate.initialize()</code> in a loop</strong> — that is N+1 by hand.</li>
</ul>
<pre><code>spring.jpa.open-in-view: false     # put this in every new project on day one</code></pre>`
},
{
  q: "How do you map inheritance in JPA?",
  level: "advanced", tags: ["mapping"],
  a: `<table>
<tr><th>Strategy</th><th>Schema</th><th>Pros</th><th>Cons</th></tr>
<tr><td><code>SINGLE_TABLE</code> (default)</td><td>One table + discriminator column</td><td>Fastest — no joins; polymorphic queries are trivial</td><td>Subclass columns must be nullable — no NOT NULL constraints</td></tr>
<tr><td><code>JOINED</code></td><td>Parent table + one per subclass</td><td>Normalised, constraints preserved</td><td>A join per level on every read</td></tr>
<tr><td><code>TABLE_PER_CLASS</code></td><td>One complete table per concrete class</td><td>No joins for a single type</td><td>Polymorphic queries need UNION; ID generation is awkward</td></tr>
<tr><td><code>@MappedSuperclass</code></td><td>No table for the parent</td><td>Pure code reuse for common columns</td><td>Not polymorphic — cannot query by the parent type</td></tr>
</table>
<pre><code>@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "payment_type")
public abstract class Payment { @Id Long id; BigDecimal amount; }

@Entity @DiscriminatorValue("CARD")
public class CardPayment extends Payment { String last4; }

// The most useful one in practice — shared audit columns, no inheritance semantics
@MappedSuperclass @EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {
    @CreatedDate  private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
    @CreatedBy private String createdBy;
}</code></pre>
<p><strong>Practical guidance:</strong> <code>SINGLE_TABLE</code> for a few subclasses with few distinct fields; <code>JOINED</code> when the subclasses differ substantially and data integrity matters. And be honest that deep entity inheritance is often a modelling mistake — composition with an enum discriminator is frequently simpler than a class hierarchy.</p>`
},
{
  q: "How do you write equals() and hashCode() for a JPA entity?",
  level: "advanced", tags: ["mapping", "gotcha"],
  a: `<p>This is subtler than it looks, because a generated ID is <code>null</code> before persist and non-null after — so an entity's hash code would change while it sits in a <code>HashSet</code>, and it would become unreachable.</p>
<pre><code>// RECOMMENDED: a business key, or an application-assigned UUID
@Entity
public class Order {
    @Id @GeneratedValue private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private UUID reference = UUID.randomUUID();   // assigned at construction

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order other)) return false;
        return reference.equals(other.reference);
    }
    @Override public int hashCode() { return reference.hashCode(); }
}</code></pre>
<p><strong>If you must use the generated ID</strong>, the Hibernate-recommended compromise is a constant hash code so it never changes:</p>
<pre><code>@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
    Order other = (Order) o;
    return id != null &amp;&amp; id.equals(other.id);   // null id is never equal to anything
}
@Override public int hashCode() { return getClass().hashCode(); }   // constant, stable</code></pre>
<p><strong>Two traps to name:</strong> use <code>Hibernate.getClass()</code> rather than <code>getClass()</code> because a lazy proxy is a subclass; and never use Lombok's <code>@Data</code> or <code>@EqualsAndHashCode</code> on an entity — it includes every field, which triggers lazy loading and can recurse infinitely across a bidirectional association. The same applies to <code>@ToString</code>.</p>`
},
{
  q: "How do you debug and optimise slow JPA queries?",
  level: "advanced", hot: true, tags: ["performance", "production"],
  a: `<ol>
<li><strong>See the SQL.</strong> Turn on statement logging with bound parameters:
<pre><code>logging.level.org.hibernate.SQL: DEBUG
logging.level.org.hibernate.orm.jdbc.bind: TRACE
spring.jpa.properties.hibernate.generate_statistics: true</code></pre>
Better in real systems: <strong>datasource-proxy</strong> or <strong>p6spy</strong>, which show the query <em>and</em> the execution time and let you assert query counts in tests.</li>
<li><strong>Count the queries.</strong> If one endpoint fires 200 statements, the problem is N+1, not the database.</li>
<li><strong>Run <code>EXPLAIN ANALYZE</code></strong> on the slow statement. Sequential scan on a large table → missing index. Nested loop over many rows → bad join order or stale statistics.</li>
<li><strong>Index the right columns</strong> — foreign keys (PostgreSQL does not index them automatically), plus columns in <code>WHERE</code>, <code>ORDER BY</code> and join predicates. Consider a composite index matching the query's column order.</li>
<li><strong>Fetch less.</strong> DTO projections instead of full entities; avoid <code>SELECT *</code> on wide tables with LOB columns.</li>
<li><strong>Check pagination</strong> — deep <code>OFFSET</code> is O(n); move to keyset pagination.</li>
<li><strong>Look at the connection pool</strong> — Hikari metrics showing threads waiting for a connection means the pool, not the query, is the bottleneck. Long transactions holding connections are the usual cause (see <code>open-in-view</code>).</li>
<li><strong>Consider dropping to SQL.</strong> For reporting and aggregation, a well-written native query or jOOQ beats fighting JPQL.</li>
</ol>
<blockquote><p><strong>The framing that lands well:</strong> "Most JPA performance problems are not the database being slow — they are the application asking the wrong number of questions."</p></blockquote>`
}
]);
