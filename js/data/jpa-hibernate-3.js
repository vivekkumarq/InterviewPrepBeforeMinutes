appendTopic("jpa-hibernate", [
{
  q: "You have a slow endpoint issuing 300 SQL queries — how do you find and fix it?",
  level: "advanced", hot: true, tags: ["n+1", "performance"],
  companies: ["Amazon", "Flipkart", "Walmart", "SAP", "Optum", "Netcracker"],
  a: `<p><strong>Step 1 — prove it is N+1, do not assume.</strong></p>
<pre><code>logging.level.org.hibernate.SQL: DEBUG
logging.level.org.hibernate.orm.jdbc.bind: TRACE
spring.jpa.properties.hibernate.generate_statistics: true
# Better: datasource-proxy or p6spy, which log the query COUNT per request</code></pre>
<pre><code>// The cause
List&lt;Order&gt; orders = orderRepo.findAll();          // 1 query
for (Order o : orders) {
    o.getCustomer().getName();                      // + 1 query EACH -> 1 + N
    o.getItems().size();                            // + another N
}</code></pre>
<p><strong>Step 2 — pick the right fix for the shape of the problem:</strong></p>
<pre><code>// A. JOIN FETCH — one query. Best for a SINGLE collection.
@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.customer JOIN FETCH o.items WHERE o.status = :s")
List&lt;Order&gt; findWithDetails(@Param("s") OrderStatus s);

// B. Entity graph — declarative, and works with derived queries AND Pageable
@EntityGraph(attributePaths = {"customer", "items"})
Page&lt;Order&gt; findByStatus(OrderStatus status, Pageable pageable);

// C. @BatchSize — turns N queries into N/size queries
@BatchSize(size = 50)
@OneToMany(mappedBy = "order") private List&lt;OrderItem&gt; items;
// or globally:
spring.jpa.properties.hibernate.default_batch_fetch_size: 50

// D. DTO projection — fetch only what the endpoint returns
@Query("SELECT new com.acme.OrderRow(o.id, o.total, c.name) FROM Order o JOIN o.customer c")
List&lt;OrderRow&gt; rows();</code></pre>
<p><strong>Step 3 — know the traps:</strong></p>
<ul>
<li><strong>You cannot <code>JOIN FETCH</code> two collections</strong> — it produces a Cartesian product and Hibernate throws <code>MultipleBagFetchException</code>. Fetch one collection and use <code>@BatchSize</code> for the second, or run two queries.</li>
<li><strong><code>JOIN FETCH</code> with <code>Pageable</code></strong> makes Hibernate paginate <strong>in memory</strong> — it loads every row then discards, with a warning in the log. Use an entity graph or a two-step "fetch IDs, then fetch entities" approach.</li>
<li><strong>Use <code>Set</code> instead of <code>List</code></strong> for the fetched collection to avoid the bag duplication that forces <code>DISTINCT</code>.</li>
</ul>
<p><strong>Step 4 — prevent the regression:</strong> assert the query count in a test. An endpoint that goes from 3 queries to 300 should fail the build, not be discovered in production.</p>
<pre><code>@Test void listOrdersIssuesThreeQueries() {
    SQLStatementCountValidator.reset();
    controller.list(PageRequest.of(0, 20));
    SQLStatementCountValidator.assertSelectCount(3);
}</code></pre>`
},
{
  q: "What is the difference between FetchType.LAZY on @ManyToOne and @OneToMany?",
  level: "advanced", hot: true, tags: ["fetching", "mapping"],
  companies: ["Amazon", "Oracle", "Infosys", "SAP", "Persistent", "LTIMindtree"],
  a: `<table>
<tr><th>Association</th><th>JPA default</th><th>What lazy actually means</th></tr>
<tr><td><code>@ManyToOne</code></td><td><strong>EAGER</strong></td><td>A <em>proxy</em> object stands in for the entity</td></tr>
<tr><td><code>@OneToOne</code></td><td><strong>EAGER</strong></td><td>Proxy — but only reliably when the FK is on this side</td></tr>
<tr><td><code>@OneToMany</code></td><td>LAZY</td><td>A <em>lazy collection wrapper</em>, not a proxy entity</td></tr>
<tr><td><code>@ManyToMany</code></td><td>LAZY</td><td>Lazy collection wrapper</td></tr>
</table>
<pre><code>@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY)      // ALWAYS write this — the default is wrong
    @JoinColumn(name = "customer_id")
    private Customer customer;               // becomes Customer$HibernateProxy$xyz

    @OneToMany(mappedBy = "order")           // already lazy by default
    private Set&lt;OrderItem&gt; items;            // becomes PersistentSet
}</code></pre>
<p><strong>The behavioural difference that matters:</strong></p>
<pre><code>Order o = repo.findById(1L).get();
o.getCustomer();              // returns a PROXY instantly — no query yet
o.getCustomer().getId();      // STILL no query! The proxy knows its own id
o.getCustomer().getName();    // NOW the SELECT fires

o.getItems();                 // returns an uninitialised PersistentSet — no query
o.getItems().size();          // query fires (unless @BatchSize/extra-lazy)</code></pre>
<p><strong>Why <code>@ManyToOne</code> defaulting to EAGER is a real problem:</strong> it applies to <em>every</em> query, everywhere, forever, and cannot be made lazy per query. One eager <code>@ManyToOne</code> on an entity that itself has an eager association produces a cascading join that loads a large slice of the database for a query that needed one column.</p>
<p><strong>The lazy <code>@OneToOne</code> caveat</strong> worth knowing: on the <em>inverse</em> side (<code>mappedBy</code>), Hibernate cannot create a proxy — it does not know whether the row exists without querying, and the field cannot be null-or-proxy. So a lazy inverse <code>@OneToOne</code> is silently fetched eagerly. The workarounds are bytecode enhancement, or restructuring so the FK side owns the relationship.</p>
<p><strong>Always set <code>spring.jpa.open-in-view=false</code></strong>, then fetch what each use case needs with <code>JOIN FETCH</code> or an entity graph and return DTOs. Fetching is a <em>query</em> concern, not a mapping concern.</p>`
},
{
  q: "How do you handle a bidirectional relationship correctly?",
  level: "beginner", hot: true, tags: ["mapping", "gotcha"],
  companies: ["TCS", "Infosys", "Cognizant", "Capgemini", "Accenture", "Mindtree"],
  a: `<pre><code>@Entity
public class Order {
    @OneToMany(mappedBy = "order", cascade = ALL, orphanRemoval = true)
    private List&lt;OrderItem&gt; items = new ArrayList&lt;&gt;();

    // HELPER METHODS — keep both sides in sync. Not optional.
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);          // without this the FK is NULL
    }
    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);           // without this orphanRemoval may not fire
    }
}

@Entity
public class OrderItem {
    @ManyToOne(fetch = LAZY)          // the OWNING side — it holds the FK column
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
}</code></pre>
<p><strong>The rule that explains every bug here:</strong> <code>mappedBy</code> marks the <em>inverse</em> side. Hibernate writes the foreign key from the <strong>owning</strong> side only — so adding to <code>order.items</code> without setting <code>item.order</code> saves a row with a null FK, or silently persists nothing.</p>
<pre><code>// ✘ The classic bug
order.getItems().add(item);          // inverse side only
repo.save(order);                     // item.order_id is NULL -> constraint violation

// ✔
order.addItem(item);                  // both sides set</code></pre>
<p><strong>Three more things this question is really testing:</strong></p>
<ul>
<li><strong><code>equals</code>/<code>hashCode</code></strong> — never use Lombok's <code>@Data</code> or <code>@EqualsAndHashCode</code> on a bidirectional entity: it recurses infinitely (order → items → order) and triggers lazy loading. Use a business key or a UUID.</li>
<li><strong><code>toString()</code></strong> — same problem. Exclude the association explicitly.</li>
<li><strong>JSON serialisation</strong> — returning the entity from a controller causes infinite recursion. Fix with a DTO (best), or <code>@JsonManagedReference</code>/<code>@JsonBackReference</code>.</li>
</ul>
<p><strong>The design question to raise:</strong> do you actually need the relationship bidirectional? A unidirectional <code>@ManyToOne</code> with a repository query for the reverse direction is simpler, has no sync problem, and avoids loading a collection you rarely use.</p>`
},
{
  q: "Explain the first-level and second-level cache with a concrete example",
  level: "advanced", hot: true, tags: ["caching", "persistence-context"],
  companies: ["Oracle", "Amazon", "SAP", "Infosys", "Barclays", "Societe Generale"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="First and second level Hibernate cache layers">
  <rect class="dg-box" x="14" y="20" width="180" height="60" rx="8"/>
  <text class="dg-t" x="104" y="40" text-anchor="middle">Session / Transaction A</text>
  <rect class="dg-fill" x="28" y="48" width="152" height="24" rx="5"/><text class="dg-s" x="104" y="65" text-anchor="middle">L1 — persistence context</text>
  <rect class="dg-box" x="14" y="92" width="180" height="60" rx="8"/>
  <text class="dg-t" x="104" y="112" text-anchor="middle">Session / Transaction B</text>
  <rect class="dg-fill" x="28" y="120" width="152" height="24" rx="5"/><text class="dg-s" x="104" y="137" text-anchor="middle">L1 — its OWN context</text>
  <path class="dg-line" d="M198 60 H250 M198 132 H250" marker-end="url(#hc1)"/>
  <rect class="dg-fill2" x="254" y="60" width="150" height="52" rx="8"/>
  <text class="dg-t" x="329" y="82" text-anchor="middle">L2 — shared</text><text class="dg-s" x="329" y="99" text-anchor="middle">across sessions, per JVM</text>
  <path class="dg-line" d="M408 86 H470" marker-end="url(#hc1)"/>
  <rect class="dg-box" x="474" y="66" width="130" height="40" rx="8"/><text class="dg-s" x="539" y="91" text-anchor="middle">Database</text>
  <defs><marker id="hc1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// L1 — mandatory, per persistence context, always on
@Transactional
public void demo() {
    Order a = repo.findById(1L).get();     // SELECT executed
    Order b = repo.findById(1L).get();     // NO query — served from L1
    assert a == b;                          // the SAME Java object (identity guarantee)
}
// A different transaction gets a different L1 and issues its own SELECT.</code></pre>
<pre><code># L2 — optional, shared across sessions in the same JVM
spring.jpa.properties.hibernate.cache.use_second_level_cache: true
spring.jpa.properties.hibernate.cache.region.factory_class: jcache

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_ONLY, region = "country")
public class Country { }        // small, stable reference data</code></pre>
<table>
<tr><th></th><th>L1</th><th>L2</th></tr>
<tr><td>Scope</td><td>One persistence context</td><td>SessionFactory — all sessions</td></tr>
<tr><td>Enabled</td><td>Always, cannot be disabled</td><td>Opt-in per entity</td></tr>
<tr><td>Lifetime</td><td>Until the transaction ends</td><td>Until evicted or TTL expires</td></tr>
<tr><td>Gives you</td><td>Identity, dirty checking, write-behind</td><td>Avoids repeat SELECTs across requests</td></tr>
</table>
<p><strong>The honest recommendation on L2:</strong> it works well for <em>small, stable reference data</em> — countries, currencies, tariff plans — with <code>READ_ONLY</code>. It becomes a liability for frequently updated entities, and it is <strong>bypassed entirely by native queries and bulk JPQL updates</strong>, which leave it silently stale. In a multi-instance deployment each JVM has its own L2, so the caches diverge.</p>
<p><strong>What I would do instead in most services:</strong> an explicit application-level cache (Caffeine or Redis) around a service method returning DTOs. You get clear TTL, visible invalidation, metrics, and no coupling to Hibernate's session lifecycle.</p>
<p><strong>The L1 danger worth mentioning:</strong> it holds <em>every</em> entity you load. Reading 500,000 rows in one transaction means 500,000 managed objects plus dirty-checking snapshots. In batch jobs, <code>flush()</code> and <code>clear()</code> periodically, or use <code>StatelessSession</code>.</p>`
},
{
  q: "What is the difference between JPA repository methods — findBy, existsBy, countBy, deleteBy?",
  level: "beginner", hot: true, tags: ["queries", "jpa"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "HCL", "Zoho"],
  a: `<pre><code>public interface OrderRepository extends JpaRepository&lt;Order, Long&gt; {

    // Derived queries — Spring Data parses the METHOD NAME into SQL
    Optional&lt;Order&gt; findByReference(String reference);
    List&lt;Order&gt;     findByStatusAndTotalGreaterThan(OrderStatus s, BigDecimal min);
    List&lt;Order&gt;     findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Page&lt;Order&gt;     findByStatus(OrderStatus status, Pageable pageable);
    List&lt;Order&gt;     findTop10ByStatusOrderByTotalDesc(OrderStatus status);
    List&lt;Order&gt;     findByCreatedAtBetween(Instant from, Instant to);
    List&lt;Order&gt;     findByCustomerNameContainingIgnoreCase(String fragment);   // nested property

    boolean existsByReference(String reference);      // SELECT 1 ... LIMIT 1 — cheapest check
    long    countByStatus(OrderStatus status);        // SELECT count(*)

    @Modifying @Transactional
    long deleteByStatusAndCreatedAtBefore(OrderStatus s, Instant cutoff);
}</code></pre>
<table>
<tr><th>Prefix</th><th>Generates</th><th>Use for</th></tr>
<tr><td><code>findBy</code></td><td><code>SELECT e FROM ...</code></td><td>Fetching entities</td></tr>
<tr><td><code>existsBy</code></td><td><code>SELECT 1 ... LIMIT 1</code></td><td>Presence check — never <code>findBy().isPresent()</code></td></tr>
<tr><td><code>countBy</code></td><td><code>SELECT count(*)</code></td><td>Counting without loading rows</td></tr>
<tr><td><code>deleteBy</code> / <code>removeBy</code></td><td>Loads then deletes each</td><td>Small sets only — see the warning below</td></tr>
<tr><td><code>streamBy</code></td><td>Cursor-based</td><td>Large result sets, must be in a transaction and closed</td></tr>
</table>
<p><strong>The performance trap in <code>deleteBy</code>:</strong> Spring Data implements derived deletes by <strong>selecting the entities first, then deleting them one by one</strong> — so deleting 100,000 rows issues 100,001 statements and loads them all into the persistence context. For bulk deletion use an explicit modifying query:</p>
<pre><code>@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("DELETE FROM Order o WHERE o.status = :s AND o.createdAt &lt; :cutoff")
int purge(@Param("s") OrderStatus s, @Param("cutoff") Instant cutoff);   // ONE statement</code></pre>
<p><strong>Why <code>existsBy</code> beats <code>findBy(...).isPresent()</code>:</strong> the latter selects every column and materialises an entity into the persistence context just to throw it away. <code>existsBy</code> generates a limit-1 existence check.</p>
<p><strong>When to stop using derived queries:</strong> once the method name exceeds about three conditions it becomes unreadable (<code>findByStatusAndCustomerIdAndCreatedAtBetweenOrderByTotalDesc</code>). Switch to <code>@Query</code> with JPQL, or <code>Specification</code> if the filters are dynamic.</p>`
},
{
  q: "How do you prevent lost updates when two users edit the same record?",
  level: "advanced", hot: true, tags: ["locking", "concurrency"],
  companies: ["Amazon", "Goldman Sachs", "JPMorgan", "Barclays", "Optum", "Maersk"],
  a: `<pre><code>// THE PROBLEM
// 10:00  User A loads order (total = 100)
// 10:01  User B loads order (total = 100)
// 10:02  User A saves total = 150   -> DB has 150
// 10:03  User B saves total = 120   -> DB has 120, A's change is SILENTLY LOST</code></pre>
<pre><code>// SOLUTION 1 — OPTIMISTIC LOCKING (the default choice)
@Entity
public class Order {
    @Version private Long version;       // Hibernate manages it entirely
    private BigDecimal total;
}
// Every UPDATE becomes:
//   UPDATE orders SET total=?, version=6 WHERE id=? AND version=5
// User B's update affects 0 rows -> OptimisticLockException

@Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional
public void updateTotal(Long id, BigDecimal total) {
    Order o = repo.findById(id).orElseThrow();   // RELOAD inside the retry
    o.setTotal(total);
}</code></pre>
<pre><code>// SOLUTION 2 — PESSIMISTIC LOCKING (high contention, short critical section)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
@Query("SELECT o FROM Order o WHERE o.id = :id")
Optional&lt;Order&gt; findByIdForUpdate(@Param("id") Long id);   // SELECT ... FOR UPDATE

// SOLUTION 3 — ATOMIC STATEMENT (no locking at all, best for counters)
@Modifying
@Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock &gt;= :qty")
int decrementStock(@Param("id") Long id, @Param("qty") int qty);   // 0 rows = insufficient</code></pre>
<table>
<tr><th></th><th>Optimistic</th><th>Pessimistic</th></tr>
<tr><td>Cost when uncontended</td><td>Nearly free</td><td>Lock overhead on every read</td></tr>
<tr><td>On conflict</td><td>Fails at commit — you retry</td><td>Blocks, or times out</td></tr>
<tr><td>Deadlock risk</td><td>None</td><td>Real</td></tr>
<tr><td>Fits</td><td>Web requests, long "think time"</td><td>Hot rows, ledgers, short transactions</td></tr>
</table>
<p><strong>Why optimistic is the default for web applications:</strong> a user might open an edit form and go to lunch. Holding a database lock for that period is unacceptable — you would exhaust the connection pool. Optimistic locking detects the conflict at save time instead, which is exactly when you can do something about it.</p>
<p><strong>The UX point worth adding:</strong> on <code>OptimisticLockException</code>, do not just retry blindly — for a user-facing edit, show "this record was changed by someone else" with the current values, so the human resolves the conflict. Blind retry is right for machine-driven updates, wrong when it would silently overwrite another person's edit.</p>`
},
{
  q: "What is the difference between JPA and Hibernate-specific features you should avoid?",
  level: "advanced", tags: ["jpa", "design"],
  companies: ["Oracle", "SAP", "Infosys", "Deloitte", "EPAM"],
  a: `<table>
<tr><th>JPA standard</th><th>Hibernate-specific</th></tr>
<tr><td><code>@Entity</code>, <code>@Table</code>, <code>@Column</code></td><td><code>@Formula</code>, <code>@Where</code>/<code>@SQLRestriction</code></td></tr>
<tr><td><code>EntityManager</code></td><td><code>Session</code>, <code>StatelessSession</code></td></tr>
<tr><td>JPQL</td><td>HQL extensions</td></tr>
<tr><td><code>@NamedEntityGraph</code></td><td><code>@BatchSize</code>, <code>@Fetch(SUBSELECT)</code></td></tr>
<tr><td><code>@Version</code></td><td><code>@OptimisticLocking(type = DIRTY)</code></td></tr>
<tr><td><code>@Cacheable</code></td><td><code>@Cache(usage = ...)</code></td></tr>
<tr><td>—</td><td><code>@SQLDelete</code>, <code>@SoftDelete</code>, <code>@Filter</code>, Envers</td></tr>
</table>
<p><strong>The pragmatic position to take</strong> — and interviewers respect a definite answer here:</p>
<blockquote><p>"Portability between JPA providers is a theoretical benefit almost nobody realises. In fifteen years I have not seen a team migrate from Hibernate to EclipseLink. So I use Hibernate-specific features where they solve a real problem — <code>@BatchSize</code> for N+1, <code>@SQLRestriction</code> for soft deletes, Envers for audit trails — and stay standard where there is no advantage in deviating."</p></blockquote>
<p><strong>The features genuinely worth reaching for:</strong></p>
<pre><code>// @BatchSize — the single most effective N+1 mitigation, no JPA equivalent
@BatchSize(size = 50) @OneToMany(mappedBy = "order") private Set&lt;OrderItem&gt; items;

// Soft delete — Hibernate 6.4+ makes this first-class
@Entity @SoftDelete(columnName = "deleted") public class Order { }

// StatelessSession — batch processing without a growing persistence context
try (StatelessSession s = sessionFactory.openStatelessSession()) {
    s.insert(entity);                    // no dirty checking, no L1 cache, no memory growth
}</code></pre>
<p><strong>The ones to be cautious about:</strong> <code>@Formula</code> embeds raw SQL in the entity and runs on every load; <code>@Filter</code> does <em>not</em> apply to <code>find()</code> by ID or native queries, so it is not a security boundary; and Envers roughly doubles write volume, so it belongs on entities with a genuine regulatory need rather than everywhere.</p>
<p><strong>Where standards do matter:</strong> keep the domain model itself annotation-light where you can. The more Hibernate behaviour is embedded in the entity, the harder it becomes to reason about what a save actually does.</p>`
},
{
  q: "How do you map a legacy database schema you cannot change?",
  level: "advanced", tags: ["mapping", "scenario"],
  companies: ["TCS", "Infosys", "Wipro", "IBM", "Capgemini", "Societe Generale"],
  a: `<pre><code>@Entity
@Table(name = "CUST_MST", schema = "LEGACY")           // ugly table name, fixed schema
public class Customer {

    @Id
    @Column(name = "CUST_ID_NUM")
    private Long id;

    @Column(name = "CUST_FNAME", length = 40)
    private String firstName;

    // Legacy 'Y'/'N' flag -> boolean
    @Convert(converter = YesNoConverter.class)
    @Column(name = "ACTV_FLG", length = 1)
    private boolean active;

    // Legacy date stored as an 8-digit integer: 20260908
    @Convert(converter = YyyyMmDdIntConverter.class)
    @Column(name = "CRT_DT")
    private LocalDate createdAt;

    // Composite natural key on a child table
    @OneToMany
    @JoinColumns({
        @JoinColumn(name = "CUST_ID_NUM", referencedColumnName = "CUST_ID_NUM"),
        @JoinColumn(name = "BRANCH_CD",   referencedColumnName = "BRANCH_CD")
    })
    private List&lt;Account&gt; accounts;

    // A column the schema exposes but we must never write
    @Column(name = "LAST_SYNC_TS", insertable = false, updatable = false)
    private Instant lastSync;

    // Computed by the database (trigger or default)
    @Formula("(SELECT COUNT(*) FROM LEGACY.ACCT_MST a WHERE a.CUST_ID_NUM = CUST_ID_NUM)")
    private int accountCount;
}

@Converter
public class YesNoConverter implements AttributeConverter&lt;Boolean, String&gt; {
    public String convertToDatabaseColumn(Boolean b)   { return Boolean.TRUE.equals(b) ? "Y" : "N"; }
    public Boolean convertToEntityAttribute(String s)  { return "Y".equalsIgnoreCase(s); }
}</code></pre>
<p><strong>The toolkit for legacy schemas:</strong></p>
<ul>
<li><strong><code>AttributeConverter</code></strong> — the workhorse. Y/N flags, packed dates, delimited strings, encrypted columns.</li>
<li><strong><code>@Formula</code></strong> — expose a computed value without a view.</li>
<li><strong><code>insertable=false, updatable=false</code></strong> — read a column owned by a trigger or another system.</li>
<li><strong><code>@SecondaryTable</code></strong> — map one entity across two tables sharing a key.</li>
<li><strong><code>@IdClass</code>/<code>@EmbeddedId</code></strong> — composite keys, which legacy schemas are full of.</li>
<li><strong><code>@Immutable</code></strong> — for read-only reference tables; Hibernate skips dirty checking entirely.</li>
</ul>
<p><strong>The strategic advice to give:</strong> do not force a bad schema into a clean domain model through mapping gymnastics. Map it faithfully in a thin persistence layer, then translate to a well-designed domain model in the service layer. That keeps the ugliness contained in one place and lets the rest of the codebase be written against types that make sense — and it is also what makes an eventual migration feasible.</p>
<p><strong>Always set <code>ddl-auto=validate</code></strong> here: it fails at startup if the mapping and the real schema disagree, which on a legacy database you cannot change is exactly the safety net you want.</p>`
}
]);
