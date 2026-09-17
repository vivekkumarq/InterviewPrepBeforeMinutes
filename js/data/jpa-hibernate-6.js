appendTopic("jpa-hibernate", [
{
  q: "The N+1 problem: how do you find it, and what are the trade-offs of each fix?",
  level: "advanced", hot: true, tags: ["n+1", "fetch", "performance", "must-know"],
  companies: ["Amazon", "SAP", "Infosys", "TCS", "Wipro", "Oracle", "Flipkart", "Accenture"],
  a: `<pre><code>// The setup that produces it
@Entity class Order {
    @ManyToOne(fetch = FetchType.LAZY) Customer customer;
    @OneToMany(mappedBy = "order") List&lt;OrderLine&gt; lines;   // LAZY by default
}

List&lt;Order&gt; orders = repo.findAll();          // 1 query
for (Order o : orders)
    o.getLines().size();                       // N more queries — one per order
// 100 orders = 101 queries. Each is fast, so nothing looks wrong in the logs
// unless you count them. This is the single most common JPA performance bug.</code></pre>
<table>
<tr><th>Fix</th><th>Queries</th><th>Trade-off</th></tr>
<tr><td><code>JOIN FETCH</code></td><td>1</td><td><strong>Cannot paginate</strong> a collection join safely — see below</td></tr>
<tr><td><code>@EntityGraph</code></td><td>1</td><td>Same as join fetch, declared on the repository method</td></tr>
<tr><td><code>@BatchSize(size = 50)</code></td><td>1 + N/50</td><td><strong>Paginates fine.</strong> Usually the best default</td></tr>
<tr><td><code>FetchMode.SUBSELECT</code></td><td>2</td><td>Second query re-runs the original as a subselect</td></tr>
<tr><td>Projection / DTO query</td><td>1</td><td>No entities, so no dirty checking — <strong>fastest for read-only</strong></td></tr>
<tr><td><code>EAGER</code> on the mapping</td><td>1</td><td><strong>Avoid.</strong> It applies everywhere, forever, including where you did not want it</td></tr>
</table>
<pre><code>// JOIN FETCH, and the trap underneath it
@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.lines WHERE o.status = :s")
List&lt;Order&gt; findWithLines(@Param("s") Status s);
// DISTINCT is needed because the SQL join multiplies rows: an order with
// 3 lines comes back 3 times.

// THE TRAP: combine JOIN FETCH on a collection with Pageable and Hibernate
// logs HHH000104: "firstResult/maxResults specified with collection fetch;
// applying in memory". It loads the ENTIRE result set into memory and
// paginates there. On a large table that is an OutOfMemoryError.
//
// The fix is two queries: page the IDs first, then fetch by those IDs.
Page&lt;Long&gt; ids = repo.findIds(status, pageable);              // paginated
List&lt;Order&gt; full = repo.findByIdInWithLines(ids.getContent()); // fetched

// Or simply use @BatchSize, which paginates correctly by construction.</code></pre>
<pre><code>// FINDING IT — do not rely on reading code
# Count the queries in tests, which is the only way to stop regressions:
#   datasource-proxy or Hypersistence Utils assertSelectCount(2)

# Log what Hibernate actually runs:
spring.jpa.properties.hibernate.generate_statistics=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.stat=DEBUG
# The statistics line prints the query count per session. A request that
# should issue 3 queries and issues 300 is immediately visible.

# open-in-view is the reason N+1 often hides:
spring.jpa.open-in-view=false      # TURN IT OFF
# Left on (the default), the session stays open during view rendering, so
# lazy loads silently succeed in the controller and template layer instead of
# throwing. You never see LazyInitializationException — you just quietly
# issue hundreds of queries per request.</code></pre>
<pre><code>// DTO PROJECTION — the fix people forget, and often the right one
@Query("""
    SELECT new com.app.dto.OrderSummary(o.id, o.total, c.name, COUNT(l))
    FROM Order o JOIN o.customer c JOIN o.lines l
    WHERE o.status = :s GROUP BY o.id, o.total, c.name
    """)
List&lt;OrderSummary&gt; summaries(@Param("s") Status s);
// One query, only the columns needed, no persistence context, no dirty
// checking, no lazy proxies. For a read-only screen this is strictly better
// than loading entities — and it is what most "slow page" tickets need.</code></pre>
<p><strong>The framing:</strong> "I default to LAZY everywhere and fetch explicitly per use case — eager fetching is a decision made once for every caller, which is always wrong somewhere. For lists I use <code>@BatchSize</code> because it survives pagination, <code>JOIN FETCH</code> when I need exactly one aggregate, and a DTO projection whenever the screen is read-only."</p>`
},
{
  q: "Explain the persistence context, dirty checking, and the entity lifecycle",
  level: "advanced", hot: true, tags: ["persistence-context", "lifecycle", "must-know"],
  companies: ["Amazon", "SAP", "Oracle", "Infosys", "TCS", "Capgemini", "Cognizant", "Flipkart"],
  a: `<p>The persistence context is a first-level cache <em>and</em> a unit of work. Understanding it explains almost every surprising Hibernate behaviour.</p>
<table>
<tr><th>State</th><th>Meaning</th><th>How it got there</th></tr>
<tr><td><strong>Transient</strong></td><td>New object, no database identity</td><td><code>new Order()</code></td></tr>
<tr><td><strong>Managed</strong></td><td>Tracked by the persistence context</td><td><code>persist()</code>, <code>find()</code>, a query result</td></tr>
<tr><td><strong>Detached</strong></td><td>Was managed, the context closed</td><td>Transaction ended, <code>evict()</code>, <code>clear()</code></td></tr>
<tr><td><strong>Removed</strong></td><td>Scheduled for deletion at flush</td><td><code>remove()</code></td></tr>
</table>
<pre><code>// DIRTY CHECKING — why this works with no save() call at all
@Transactional
public void rename(Long id, String name) {
    Order o = repo.findById(id).orElseThrow();   // now MANAGED
    o.setName(name);                             // no repository call
}   // at commit, Hibernate compares the entity against the snapshot it kept
    // at load time and issues an UPDATE for the changed columns.

// Consequences people are caught by:
// - Calling save() on a managed entity is redundant (harmless, but noise).
// - Mutating an entity you only meant to READ still writes to the database.
//   Use @Transactional(readOnly = true) — it skips the dirty-check snapshot
//   and is also a meaningful performance win on read paths.
// - A huge result set means a huge snapshot. Reading 100k entities to report
//   on them doubles the memory for nothing.</code></pre>
<pre><code>// save() vs persist() vs merge() — a guaranteed question
persist(e)   // transient -> managed. Returns void. Throws if the entity
             // already has an identifier (it is not for detached objects).
merge(e)     // COPIES the state of a detached entity into a managed instance
             // and RETURNS that instance. The argument stays detached.
save(e)      // Spring Data: persist if new, merge if not (checks the id /
             // @Version). Convenient, and it hides which one happened.

// THE MERGE TRAP
Order detached = ...;             // came back from a web request
em.merge(detached);               // returns a managed COPY
detached.setStatus(SHIPPED);      // modifies the DETACHED one -> NOT saved
Order managed = em.merge(detached);
managed.setStatus(SHIPPED);       // correct: mutate the RETURNED instance</code></pre>
<pre><code>// FLUSH — when SQL actually reaches the database
// Flush happens: at commit, before a query whose results could be affected
// (AUTO mode), or on an explicit flush().
//
// Flush is NOT commit. Statements are sent, the transaction is still open,
// and everything can still roll back.
//
// The classic confusion:
repo.save(order);                  // INSERT may not have been sent yet
jdbcTemplate.query("SELECT ...");  // raw JDBC bypasses Hibernate -> sees nothing
// Mixing JPA and raw JDBC in one transaction needs an explicit flush first.</code></pre>
<table>
<tr><th>Behaviour</th><th>Explained by the persistence context</th></tr>
<tr><td>Two <code>findById</code> calls, one SQL query</td><td>First-level cache — same instance returned, guaranteed by identity</td></tr>
<tr><td><code>LazyInitializationException</code></td><td>Context closed before the proxy was touched</td></tr>
<tr><td>An UPDATE you never asked for</td><td>Dirty checking on a mutated managed entity</td></tr>
<tr><td>Updates appearing in an odd order</td><td>Hibernate orders by operation type at flush, not by your call order</td></tr>
<tr><td><code>OptimisticLockException</code></td><td><code>@Version</code> mismatch — someone else committed first</td></tr>
<tr><td>Memory growth in a batch job</td><td>Every entity stays managed — <code>flush()</code> then <code>clear()</code> every N rows</td></tr>
</table>
<pre><code>// BATCH INSERT that does not exhaust the heap
for (int i = 0; i &lt; records.size(); i++) {
    em.persist(records.get(i));
    if (i % 50 == 0) { em.flush(); em.clear(); }   // release managed entities
}
// Plus the properties, or batching does not actually happen:
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
// And note: GenerationType.IDENTITY DISABLES JDBC batching entirely, because
// Hibernate must round-trip for each generated id. Use a SEQUENCE with a
// pooled optimiser instead. That detail is what a senior answer contains.</code></pre>
<p><strong>The summary line:</strong> "The persistence context is a unit of work, not just a cache. It buffers changes, gives identity guarantees within a transaction, and writes at flush. Almost every Hibernate surprise — phantom updates, lazy exceptions, batch memory growth — follows from forgetting one of those three properties."</p>`
}
]);
