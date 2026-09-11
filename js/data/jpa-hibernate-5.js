appendTopic("jpa-hibernate", [
{
  q: "Explain transaction propagation, and when would you use REQUIRES_NEW?",
  level: "advanced", hot: true, tags: ["transactions", "propagation", "must-know"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "TCS", "Barclays", "Societe Generale", "EPAM"],
  a: `<table>
<tr><th>Propagation</th><th>If a transaction exists</th><th>If none exists</th></tr>
<tr><td><strong>REQUIRED</strong> (default)</td><td>Join it</td><td>Start one</td></tr>
<tr><td><strong>REQUIRES_NEW</strong></td><td><strong>Suspend it</strong>, start a new one</td><td>Start one</td></tr>
<tr><td>SUPPORTS</td><td>Join it</td><td>Run without one</td></tr>
<tr><td>NOT_SUPPORTED</td><td>Suspend it</td><td>Run without one</td></tr>
<tr><td>MANDATORY</td><td>Join it</td><td><strong>Throw</strong></td></tr>
<tr><td>NEVER</td><td><strong>Throw</strong></td><td>Run without one</td></tr>
<tr><td>NESTED</td><td>A savepoint inside it</td><td>Start one</td></tr>
</table>
<pre><code>// The canonical REQUIRES_NEW case: an audit record that must survive a rollback
@Transactional
public void placeOrder(Order o) {
    repo.save(o);
    auditService.record("order attempted", o.id());   // REQUIRES_NEW
    payment.charge(o);                                 // throws -> order rolls back
}                                                      // but the audit row stays

@Transactional(propagation = Propagation.REQUIRES_NEW)
public void record(String what, long id) { auditRepo.save(new Audit(what, id)); }</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Outer transaction suspended while an inner REQUIRES_NEW commits">
  <rect class="dg-fill" x="16" y="30" width="470" height="34" rx="6"/>
  <text class="dg-s" x="120" y="52" text-anchor="middle">outer tx (REQUIRED)</text>
  <rect class="dg-box" x="200" y="76" width="180" height="34" rx="6"/>
  <text class="dg-s" x="290" y="98" text-anchor="middle">inner tx (REQUIRES_NEW)</text>
  <path class="dg-line" d="M200 64 V72 M380 72 V64" stroke-dasharray="3 3"/>
  <text class="dg-s" x="290" y="128" text-anchor="middle">commits independently — its own connection</text>
  <text class="dg-s" x="500" y="52">rolls back</text>
  <text class="dg-s" x="500" y="98">survives</text>
</svg>
</figure>
<table>
<tr><th>Cost of REQUIRES_NEW</th><th>Detail</th></tr>
<tr><td><strong>A second connection</strong></td><td>Both are held at once — with a pool of 10, five nested calls can deadlock the pool</td></tr>
<tr><td>The outer transaction's writes are invisible</td><td>They are uncommitted; the inner transaction cannot see them</td></tr>
<tr><td>Possible self-deadlock</td><td>Inner waits on a row the outer has locked, and the outer waits on the inner</td></tr>
<tr><td>Self-invocation still applies</td><td>Calling it via <code>this.</code> bypasses the proxy — no new transaction at all</td></tr>
</table>
<pre><code>// Rollback rules — the part that silently surprises people
@Transactional                                  // rolls back on RuntimeException
@Transactional(rollbackFor = Exception.class)   // ...and on checked ones
@Transactional(noRollbackFor = NotFoundException.class)

// Catching an exception inside the method does NOT prevent the rollback if the
// transaction was already marked rollback-only by an inner @Transactional:
//   UnexpectedRollbackException: Transaction silently rolled back
// That message almost always means an inner REQUIRED transaction failed and
// the outer one swallowed the exception.</code></pre>
<p><strong>The publishing pattern to name:</strong> instead of REQUIRES_NEW for side effects, register a callback that runs <em>after</em> the commit — it avoids the second connection entirely and guarantees you never publish an event for work that rolled back.</p>
<pre><code>@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void on(OrderPlaced e) { notifier.send(e); }</code></pre>`
},
{
  q: "How do the Hibernate caches work, and when should you enable the second-level cache?",
  level: "advanced", tags: ["caching", "performance", "hibernate"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "Oracle", "EPAM", "Cognizant"],
  a: `<table>
<tr><th>Cache</th><th>Scope</th><th>Default</th></tr>
<tr><td><strong>First level</strong> (persistence context)</td><td>One transaction / <code>EntityManager</code></td><td><strong>Always on</strong>, cannot be disabled</td></tr>
<tr><td><strong>Second level</strong></td><td>The whole <code>SessionFactory</code>, across transactions</td><td>Off</td></tr>
<tr><td>Query cache</td><td>Query results — stores <em>ids</em>, not entities</td><td>Off, and needs L2 to be useful</td></tr>
</table>
<pre><code>// L1 in action — the same entity is returned, not re-queried
@Transactional
void demo() {
    Order a = em.find(Order.class, 1L);     // SELECT
    Order b = em.find(Order.class, 1L);     // no SQL — same instance
    assert a == b;                           // identity guarantee within a context
}
// This is also why dirty checking works: the context remembers the loaded
// state and compares on flush.</code></pre>
<pre><code># Second level — Hibernate + a provider
spring.jpa.properties.hibernate.cache.use_second_level_cache: true
spring.jpa.properties.hibernate.cache.region.factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
spring.cache.jcache.provider: org.ehcache.jsr107.EhcacheCachingProvider

@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)   // per entity, opt-in
public class Country { }</code></pre>
<table>
<tr><th>Strategy</th><th>Use for</th></tr>
<tr><td><code>READ_ONLY</code></td><td>Reference data that never changes — fastest, no locking</td></tr>
<tr><td><code>NONSTRICT_READ_WRITE</code></td><td>Rarely updated; a brief stale window is acceptable</td></tr>
<tr><td><code>READ_WRITE</code></td><td>Updated data — uses soft locks, the safe default</td></tr>
<tr><td><code>TRANSACTIONAL</code></td><td>Full XA semantics; needs a JTA provider</td></tr>
</table>
<p><strong>When it is genuinely worth it:</strong> small, hot, rarely-changing reference data — countries, currencies, tax rates, feature configuration. Read-mostly, bounded in size, and read on nearly every request.</p>
<table>
<tr><th>When to avoid it</th><th>Why</th></tr>
<tr><td>Frequently updated entities</td><td>Invalidation churn costs more than the reads save</td></tr>
<tr><td>Large entities or large result sets</td><td>You are trading heap for database load, and heap is the scarcer resource</td></tr>
<tr><td><strong>Multiple application instances</strong></td><td>Each has its own L2 — they drift unless you run a distributed cache, which brings its own consistency problems</td></tr>
<tr><td>Anything written by another system</td><td>Hibernate cannot see those writes and will serve stale data indefinitely</td></tr>
</table>
<p><strong>The recommendation to give:</strong> "I reach for an explicit application-level cache — Caffeine or Redis behind <code>@Cacheable</code> — long before the second-level cache. It is visible in the code, the TTL and eviction policy are mine, and it does not surprise the next developer with stale rows whose cause is invisible. The L2 cache is powerful but it is action at a distance."</p>
<pre><code>// The bulk-update trap worth naming
@Modifying
@Query("UPDATE Order o SET o.status = 'CLOSED' WHERE o.createdAt &lt; :d")
int closeOld(@Param("d") LocalDate d);
// Bypasses the persistence context AND the L2 cache entirely. Entities already
// loaded keep their old values. Use @Modifying(clearAutomatically = true,
// flushAutomatically = true), or evict the region.</code></pre>`
}
]);
