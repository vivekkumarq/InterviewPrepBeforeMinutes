appendTopic("jpa-hibernate", [
{
  q: "What causes LazyInitializationException and what is the right fix?",
  level: "advanced", hot: true, tags: ["fetching", "persistence-context", "gotcha"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "TCS", "Cognizant", "EPAM", "Maersk"],
  a: `<pre><code>@Transactional(readOnly = true)
public OrderDto find(Long id) {
    Order order = repo.findById(id).orElseThrow();
    return new OrderDto(order);                  // fine — still inside the transaction
}

public OrderDto findBroken(Long id) {
    Order order = repo.findById(id).orElseThrow();   // transaction ends HERE
    return new OrderDto(order.getItems());           // ✗ LazyInitializationException
}
// A lazy association is a PROXY. Touching it outside the persistence context
// has no session to load from, so Hibernate throws instead of returning null.</code></pre>
<table>
<tr><th>Fix</th><th>Verdict</th></tr>
<tr><td><strong>Fetch join</strong> in the query</td><td><strong>Best</strong> — one query, explicit, no surprises</td></tr>
<tr><td><strong>Entity graph</strong></td><td>Best when the same entity needs different fetch shapes per use case</td></tr>
<tr><td>DTO projection</td><td>Best of all when you only need a few fields — no entities, no proxies</td></tr>
<tr><td>Widen <code>@Transactional</code></td><td>Works, but holds a database connection during rendering</td></tr>
<tr><td><code>Hibernate.initialize(x)</code></td><td>Works; explicit but easy to forget somewhere else</td></tr>
<tr><td><code>FetchType.EAGER</code></td><td><strong>Avoid</strong> — it applies everywhere, forever, and causes N+1 and cartesian products in queries that never needed the data</td></tr>
<tr><td><code>open-in-view=true</code></td><td><strong>Turn it off.</strong> It holds a connection for the whole request and hides the real problem.</td></tr>
</table>
<pre><code>// ✔ Fetch join
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
Optional&lt;Order&gt; findWithItems(@Param("id") Long id);

// ✔ Entity graph — same entity, different shapes
@EntityGraph(attributePaths = {"items", "customer"})
Optional&lt;Order&gt; findWithDetailsById(Long id);

// ✔ DTO projection — the fastest option, and it cannot throw this exception
@Query("SELECT new com.app.OrderSummary(o.id, o.total, c.name) " +
       "FROM Order o JOIN o.customer c WHERE o.status = :status")
List&lt;OrderSummary&gt; findSummaries(@Param("status") Status status);</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Entity proxy detached from the persistence context">
  <rect class="dg-fill" x="16" y="30" width="200" height="76" rx="10"/>
  <text class="dg-s" x="116" y="52" text-anchor="middle">persistence context</text>
  <rect class="dg-fill2" x="40" y="62" width="70" height="30" rx="5"/><text class="dg-s" x="75" y="82" text-anchor="middle">Order</text>
  <rect class="dg-box" x="122" y="62" width="70" height="30" rx="5"/><text class="dg-s" x="157" y="82" text-anchor="middle">proxy</text>
  <path class="dg-line" d="M240 68 H300" marker-end="url(#lz1)"/>
  <text class="dg-s" x="270" y="58" text-anchor="middle">tx ends</text>
  <rect class="dg-box" x="306" y="50" width="180" height="46" rx="8" stroke-dasharray="5 4"/>
  <text class="dg-s" x="396" y="70" text-anchor="middle">DETACHED entity</text>
  <text class="dg-s" x="396" y="88" text-anchor="middle">proxy has no session</text>
  <text class="dg-s" x="16" y="132">touching the proxy now throws — the fix is to load what you need BEFORE the boundary</text>
  <defs><marker id="lz1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code># The setting to change on day one of any Spring Boot project
spring.jpa.open-in-view=false
# Boot logs a warning about this at startup and most teams ignore it.
# With it ON, the session stays open for the whole request, so lazy loads
# succeed silently during JSON serialisation — firing one query per element
# while a database connection is held for the entire render.

# And make the queries visible while developing
spring.jpa.properties.hibernate.generate_statistics=true
logging.level.org.hibernate.SQL=DEBUG</code></pre>
<p><strong>The multiple-bags trap to mention:</strong> two <code>JOIN FETCH</code>es on <code>List</code> collections throws <code>MultipleBagFetchException</code>, because the cartesian product makes the row count ambiguous. Fix it by changing the collections to <code>Set</code>, or by fetching one collection per query and letting the persistence context stitch them together.</p>
<p><strong>The rule to state:</strong> "Everything is <code>LAZY</code>, and each query declares exactly what it needs. Eager fetching moves the decision from the use case to the mapping, which is precisely the wrong place — the same entity is read a dozen ways, and only the query knows what this particular caller wants."</p>`
},
{
  q: "Explain the N+1 problem and every way to fix it",
  level: "advanced", hot: true, tags: ["n+1", "performance", "queries", "must-know"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "Flipkart", "Walmart", "EPAM", "Oracle"],
  a: `<div class="cx"><b>Symptom</b><span>fast in dev with 10 rows, unusable in prod with 10,000</span><b>Cause</b><span>one query for the parents, then one per parent for the children</span></div>
<pre><code>List&lt;Order&gt; orders = repo.findAll();                     // 1 query
for (Order o : orders) {
    o.getItems().size();                                  // + N queries, one per order
}
// 200 orders -> 201 round trips. Each is maybe 1 ms of network, so 200 ms
// of pure latency that no index will ever fix.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="One parent query followed by many child queries">
  <rect class="dg-fill" x="16" y="20" width="130" height="30" rx="6"/><text class="dg-s" x="81" y="40" text-anchor="middle">SELECT * FROM orders</text>
  <path class="dg-line" d="M150 35 L216 26 M150 35 H216 M150 35 L216 66 M150 35 L216 96 M150 35 L216 126" marker-end="url(#n1)"/>
  <rect class="dg-box" x="220" y="12" width="230" height="24" rx="4"/><text class="dg-s" x="335" y="29" text-anchor="middle">SELECT * FROM items WHERE order_id = 1</text>
  <rect class="dg-box" x="220" y="42" width="230" height="24" rx="4"/><text class="dg-s" x="335" y="59" text-anchor="middle">SELECT * FROM items WHERE order_id = 2</text>
  <rect class="dg-box" x="220" y="72" width="230" height="24" rx="4"/><text class="dg-s" x="335" y="89" text-anchor="middle">SELECT * FROM items WHERE order_id = 3</text>
  <rect class="dg-box" x="220" y="102" width="230" height="24" rx="4"/><text class="dg-s" x="335" y="119" text-anchor="middle">… once per order</text>
  <text class="dg-s" x="470" y="60">latency scales with the</text>
  <text class="dg-s" x="470" y="80">number of ROWS, not data</text>
  <defs><marker id="n1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Fix</th><th>Queries</th><th>Trade-off</th></tr>
<tr><td><strong>JOIN FETCH</strong></td><td>1</td><td>Duplicate parent rows; pagination in memory (<code>HHH000104</code> warning)</td></tr>
<tr><td><strong>Entity graph</strong></td><td>1</td><td>Same, but declarative and reusable</td></tr>
<tr><td><strong><code>@BatchSize(size=50)</code></strong></td><td>1 + N/50</td><td><strong>Best with pagination</strong> — no cartesian product, no memory paging</td></tr>
<tr><td><code>@Fetch(SUBSELECT)</code></td><td>2</td><td>Re-runs the parent query as a subquery</td></tr>
<tr><td><strong>DTO projection</strong></td><td>1</td><td>Fastest; no entities, so no lazy loading at all</td></tr>
<tr><td>Two queries, join in memory</td><td>2</td><td>Explicit and predictable; more code</td></tr>
</table>
<pre><code>// The pagination trap, which is the follow-up question
@Query("SELECT o FROM Order o JOIN FETCH o.items")
Page&lt;Order&gt; findAllWithItems(Pageable p);
// HHH000104: firstResult/maxResults specified with collection fetch;
// applying in memory. Hibernate loads EVERY row and paginates in Java.
// On a large table this is an OutOfMemoryError waiting to happen.

// ✔ The correct pattern with pagination: batch fetching
@Entity
public class Order {
    @OneToMany(mappedBy = "order")
    @BatchSize(size = 50)              // loads children for 50 orders per query
    private List&lt;OrderItem&gt; items;
}
// Or globally: spring.jpa.properties.hibernate.default_batch_fetch_size=50
// This one property fixes most N+1 in an existing codebase with no code change.</code></pre>
<pre><code># DETECTING it before production
spring.jpa.properties.hibernate.generate_statistics=true
# Then assert on the count in an integration test:
Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
long before = stats.getPrepareStatementCount();
service.listOrders();
assertThat(stats.getPrepareStatementCount() - before).isLessThanOrEqualTo(2);

# Or add the datasource-proxy / p6spy library and fail the test on query count.</code></pre>
<p><strong>The answer that shows judgement:</strong> "I default to <code>default_batch_fetch_size</code> globally, because it fixes the whole application at once and composes with pagination. Then I use fetch joins for the specific hot endpoints where one query matters, and DTO projections wherever I only need a handful of columns. What I do not do is switch associations to <code>EAGER</code> — that trades one N+1 for a cartesian product in every other query."</p>`
},
{
  q: "How do you handle concurrent updates — optimistic or pessimistic locking?",
  level: "advanced", hot: true, tags: ["locking", "transactions", "concurrency"],
  companies: ["Amazon", "Goldman Sachs", "Barclays", "SAP", "Optum", "Oracle", "Morgan Stanley"],
  a: `<pre><code>// The lost update problem
// T1 reads balance = 100        T2 reads balance = 100
// T1 writes 100 - 30 = 70       T2 writes 100 - 50 = 50
// Final balance is 50. T1's withdrawal vanished. No error was raised.

// ✔ OPTIMISTIC — a version column, checked on write
@Entity
public class Account {
    @Id private Long id;
    private BigDecimal balance;
    @Version private long version;      // Hibernate manages it entirely
}
// UPDATE account SET balance = ?, version = 4 WHERE id = ? AND version = 3
// Zero rows updated -> someone else got there first -> OptimisticLockException</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Two transactions racing with a version column detecting the conflict">
  <text class="dg-s" x="120" y="20" text-anchor="middle">T1</text>
  <text class="dg-s" x="400" y="20" text-anchor="middle">T2</text>
  <path class="dg-line" d="M120 28 V140 M400 28 V140" stroke-dasharray="4 3"/>
  <rect class="dg-fill" x="46" y="36" width="148" height="24" rx="4"/><text class="dg-s" x="120" y="53" text-anchor="middle">read v=3</text>
  <rect class="dg-fill2" x="326" y="52" width="148" height="24" rx="4"/><text class="dg-s" x="400" y="69" text-anchor="middle">read v=3</text>
  <rect class="dg-fill" x="46" y="84" width="148" height="24" rx="4"/><text class="dg-s" x="120" y="101" text-anchor="middle">write → v=4 ✔</text>
  <rect class="dg-box" x="326" y="112" width="200" height="24" rx="4"/><text class="dg-s" x="426" y="129" text-anchor="middle">write WHERE v=3 → 0 rows ✘</text>
  <text class="dg-s" x="16" y="158">no lock is ever taken — the conflict is DETECTED at commit rather than prevented</text>
</svg>
</figure>
<pre><code>// Handling the conflict — retry, because a failed optimistic lock is normal
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional
public void withdraw(Long id, BigDecimal amount) {
    Account a = repo.findById(id).orElseThrow();
    if (a.getBalance().compareTo(amount) &lt; 0) throw new InsufficientFundsException();
    a.setBalance(a.getBalance().subtract(amount));
}
// The retry MUST re-read the entity, which is why the whole method is retried
// rather than just the save.</code></pre>
<pre><code>// PESSIMISTIC — take a database lock up front
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT a FROM Account a WHERE a.id = :id")
Optional&lt;Account&gt; findByIdForUpdate(@Param("id") Long id);
// Emits SELECT ... FOR UPDATE. Other transactions BLOCK until this one commits.

// Always bound the wait, or one slow transaction stalls the whole system
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))</code></pre>
<table>
<tr><th></th><th>Optimistic</th><th>Pessimistic</th></tr>
<tr><td>Locks taken</td><td>None</td><td>Database row lock</td></tr>
<tr><td>Conflict handling</td><td>Detected at commit → retry</td><td>Prevented — others wait</td></tr>
<tr><td>Throughput under low contention</td><td><strong>Excellent</strong></td><td>Good</td></tr>
<tr><td>Under high contention</td><td>Poor — retry storms</td><td>Better, but queues</td></tr>
<tr><td>Deadlock risk</td><td>None</td><td><strong>Yes</strong> — needs consistent lock ordering</td></tr>
<tr><td>Works across a long user session</td><td><strong>Yes</strong> — the version travels in the DTO</td><td>No — you cannot hold a DB lock while a user thinks</td></tr>
<tr><td>Use for</td><td>Most web applications</td><td>Inventory decrements, seat booking, anything with real contention</td></tr>
</table>
<pre><code>// The best answer for a simple counter is often NEITHER — make it atomic
@Modifying
@Query("UPDATE Stock s SET s.quantity = s.quantity - :qty " +
       "WHERE s.id = :id AND s.quantity &gt;= :qty")
int decrement(@Param("id") Long id, @Param("qty") int qty);
// Returns 0 if there was not enough stock. One statement, no lock, no retry,
// and the database guarantees atomicity. Always ask whether the read is
// needed at all before reaching for a locking strategy.</code></pre>
<p><strong>The point that impresses:</strong> "Optimistic locking is what lets you protect a <em>long</em> business conversation — the user loads a form, thinks for two minutes, and submits with the version they saw. You cannot hold a database lock for that, but you can detect that someone else edited the row and tell the user, which is what they actually want."</p>`
}
]);
