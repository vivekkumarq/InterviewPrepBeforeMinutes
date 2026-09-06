appendTopic("jpa-hibernate", [
{
  q: "What is the difference between get() and load() / findById() and getReferenceById()?",
  level: "beginner", hot: true, tags: ["fetching"],
  a: `<table>
<tr><th></th><th><code>findById()</code> / <code>session.get()</code></th><th><code>getReferenceById()</code> / <code>session.load()</code></th></tr>
<tr><td>Hits the database</td><td>Immediately</td><td><strong>Lazily</strong> — only when a property is accessed</td></tr>
<tr><td>Returns</td><td>The entity, or empty <code>Optional</code></td><td>A <strong>proxy</strong>, always non-null</td></tr>
<tr><td>If the row does not exist</td><td>Empty <code>Optional</code></td><td><code>EntityNotFoundException</code> on first access</td></tr>
</table>
<pre><code>// The classic use for getReferenceById: setting a foreign key without loading the row
@Transactional
public void assign(Long orderId, Long customerId) {
    Order order = orderRepo.findById(orderId).orElseThrow();
    order.setCustomer(customerRepo.getReferenceById(customerId));  // NO select on customer
}   // Hibernate only needs the ID to write the FK — one query saved</code></pre>
<p><strong>Where the proxy bites:</strong></p>
<pre><code>Customer c = repo.getReferenceById(1L);
c.getName();                    // triggers the SELECT here — may throw EntityNotFoundException
c instanceof Customer;          // true, but c.getClass() is Customer$HibernateProxy$xyz

// This is why equals() must use Hibernate.getClass(), not getClass()
if (Hibernate.getClass(a) != Hibernate.getClass(b)) return false;</code></pre>
<p><strong>Also note</strong> that accessing a proxy after the persistence context has closed throws <code>LazyInitializationException</code>, so <code>getReferenceById</code> is only safe inside the transaction. And returning a proxy from a service to a controller is a common source of serialisation errors — return a DTO instead.</p>`
},
{
  q: "What is the difference between JPQL, HQL, native SQL and Criteria API?",
  level: "beginner", tags: ["queries"],
  a: `<table>
<tr><th></th><th>Operates on</th><th>Portable</th><th>Type-safe</th></tr>
<tr><td><strong>JPQL</strong></td><td>Entities and fields</td><td>Yes (JPA standard)</td><td>No — a string</td></tr>
<tr><td><strong>HQL</strong></td><td>Entities; Hibernate superset of JPQL</td><td>Hibernate only</td><td>No</td></tr>
<tr><td><strong>Native SQL</strong></td><td>Tables and columns</td><td>No — database specific</td><td>No</td></tr>
<tr><td><strong>Criteria API</strong></td><td>Entities, built programmatically</td><td>Yes</td><td><strong>Yes</strong></td></tr>
</table>
<pre><code>// JPQL — note it references the ENTITY and FIELD names, not tables and columns
@Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.status = :status")
List&lt;Order&gt; findByStatus(@Param("status") OrderStatus status);

// Native — for database-specific features
@Query(value = """
        SELECT * FROM orders
        WHERE data @&gt; :filter::jsonb
        ORDER BY created_at DESC
        """, nativeQuery = true)
List&lt;Order&gt; byJsonFilter(@Param("filter") String filter);

// Criteria — verbose, but composable and refactor-safe
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery&lt;Order&gt; q = cb.createQuery(Order.class);
Root&lt;Order&gt; root = q.from(Order.class);
q.where(cb.and(
    cb.equal(root.get(Order_.status), OrderStatus.PAID),        // metamodel: compile-checked
    cb.greaterThan(root.get(Order_.total), new BigDecimal("100"))));</code></pre>
<p><strong>How to choose in practice:</strong> derived query methods for simple finders; JPQL for anything with a join or projection (most readable); Criteria/Specifications only when the query is genuinely <em>dynamic</em> (a search screen with optional filters); and native SQL for window functions, CTEs, JSONB and bulk operations.</p>
<p><strong>Worth mentioning:</strong> generating the JPA <em>metamodel</em> (<code>Order_.status</code>) makes Criteria queries refactor-safe, and libraries like <strong>QueryDSL</strong> or <strong>jOOQ</strong> give you type-safe queries with far less ceremony than raw Criteria — jOOQ in particular validates against the real schema at compile time.</p>`
},
{
  q: "How do you map an enum, a JSON column and a composite key?",
  level: "advanced", tags: ["mapping"],
  a: `<pre><code>// ENUM — always EnumType.STRING
@Enumerated(EnumType.STRING)          // ✔ stores "PAID"
@Column(length = 20, nullable = false)
private OrderStatus status;
// @Enumerated(EnumType.ORDINAL) stores 0,1,2 — reordering the enum SILENTLY corrupts data

// JSON column (Hibernate 6 supports this natively)
@JdbcTypeCode(SqlTypes.JSON)
@Column(columnDefinition = "jsonb")
private Map&lt;String, Object&gt; metadata;

// COMPOSITE KEY — @EmbeddedId is the cleaner of the two options
@Embeddable
public record EnrollmentId(Long studentId, Long courseId) implements Serializable { }

@Entity
public class Enrollment {
    @EmbeddedId private EnrollmentId id;

    @ManyToOne @MapsId("studentId")     // reuses the key column, no duplicate FK column
    private Student student;

    @ManyToOne @MapsId("courseId")
    private Course course;

    private LocalDate enrolledAt;       // attributes on the relationship
}

// CONVERTER — for a type JPA does not know
@Converter(autoApply = true)
public class MoneyConverter implements AttributeConverter&lt;Money, BigDecimal&gt; {
    public BigDecimal convertToDatabaseColumn(Money m) { return m == null ? null : m.amount(); }
    public Money convertToEntityAttribute(BigDecimal d) { return d == null ? null : new Money(d); }
}</code></pre>
<p><strong>The <code>EnumType.ORDINAL</code> trap is worth emphasising:</strong> it is the default, and it stores the enum's position. Insert a new constant in the middle, or reorder alphabetically during a refactor, and every existing row now means something different — with no error and no migration to catch it. Always write <code>EnumType.STRING</code>, and add a database check constraint or a lookup table if you want referential safety.</p>
<p>For composite keys, <code>@EmbeddedId</code> is preferable to <code>@IdClass</code> because the key is a real object you can pass around, and a <code>record</code> gives you correct <code>equals</code>/<code>hashCode</code> for free — which composite keys absolutely require.</p>`
},
{
  q: "What is the difference between @Transactional on a class, method, and readOnly?",
  level: "advanced", hot: true, tags: ["transactions"],
  a: `<pre><code>@Service
@Transactional(readOnly = true)          // sensible CLASS-level default: reads
public class OrderService {

    public Order find(Long id) { ... }   // inherits readOnly = true

    @Transactional                       // METHOD annotation overrides the class one
    public Order place(CreateOrderRequest r) { ... }   // read-write

    @Transactional(propagation = REQUIRES_NEW)
    public void audit(String event) { ... }            // commits independently
}</code></pre>
<p><strong>Precedence:</strong> method annotation beats class annotation; class beats interface. Spring deliberately does <em>not</em> look at interface annotations when using CGLIB proxies, so always annotate the implementation class.</p>
<p><strong>What <code>readOnly = true</code> actually does</strong> — and it is more than a hint:</p>
<ul>
<li>Hibernate sets the flush mode to <code>MANUAL</code>, so it <strong>skips dirty checking entirely</strong>. On a query returning 10,000 entities that avoids taking and comparing 10,000 snapshots — a real memory and CPU saving.</li>
<li>The JDBC connection is marked read-only, which some drivers and proxies use to route to a <strong>read replica</strong>.</li>
<li>It documents intent, and it will surface an accidental write as a silently-lost update — which is why the class-level default plus explicit read-write methods is a good pattern.</li>
</ul>
<p><strong>The important limitation to state:</strong> <code>readOnly</code> does not <em>prevent</em> writes. Native queries and JDBC calls will still modify data; entity changes are simply never flushed, so the update disappears without error. That silence is exactly why you should be deliberate about which methods are read-write.</p>`
},
{
  q: "How does Hibernate's flush work and when does it happen?",
  level: "advanced", tags: ["persistence-context"],
  a: `<p><strong>Flush</strong> is when Hibernate translates the persistence context's pending changes into SQL. It is <em>not</em> the same as commit — flushing writes the statements; committing makes them durable.</p>
<p><strong>Flush happens:</strong></p>
<ol>
<li>Before the transaction commits.</li>
<li>Before executing a JPQL/HQL query whose result <em>could</em> be affected by pending changes (Hibernate checks the query spaces — the tables involved).</li>
<li>On an explicit <code>em.flush()</code>.</li>
</ol>
<pre><code>@Transactional
public void demo() {
    Order o = new Order("ORD-1");
    repo.save(o);                        // NO insert yet — just queued

    repo.findByReference("ORD-1");       // JPQL touching orders -> triggers a FLUSH first
                                         // so the pending insert is visible to the query
}                                        // commit</code></pre>
<pre><code>// Flush modes
em.setFlushMode(FlushModeType.COMMIT);   // only flush at commit — queries may see stale data
em.setFlushMode(FlushModeType.AUTO);     // default

// Native queries do NOT participate in query-space detection
@Modifying(flushAutomatically = true, clearAutomatically = true)
@Query(value = "UPDATE orders SET status = 'X' WHERE id = :id", nativeQuery = true)
void bulkUpdate(@Param("id") Long id);</code></pre>
<p><strong>The bug this causes:</strong> a native query does not know which entities are pending, so Hibernate does not flush before it — the query runs against the database <em>without</em> your unflushed changes, and afterwards the persistence context holds stale entities that overwrite the bulk update at commit. That is why <code>@Modifying</code> takes <code>flushAutomatically</code> and <code>clearAutomatically</code>.</p>
<p><strong>Batch processing point:</strong> in a long loop you must periodically <code>flush()</code> <em>and</em> <code>clear()</code>. Flushing alone writes the SQL but leaves every entity managed, so the persistence context grows until you run out of heap.</p>`
},
{
  q: "What are Spring Data JPA projections and when do you use them?",
  level: "advanced", hot: true, tags: ["queries", "performance"],
  a: `<pre><code>// 1. Interface (closed) projection — Spring generates a proxy; only these columns are selected
public interface OrderSummary {
    Long getId();
    BigDecimal getTotal();
    String getCustomerName();          // resolves the nested customer.name
}
List&lt;OrderSummary&gt; findByStatus(OrderStatus status);

// 2. Class-based (DTO) projection — a record, constructed directly by the query
public record OrderRow(Long id, String reference, BigDecimal total, String customerName) { }

@Query("""
    SELECT new com.acme.OrderRow(o.id, o.reference, o.total, c.name)
    FROM Order o JOIN o.customer c
    WHERE o.status = :status
    """)
List&lt;OrderRow&gt; findRows(@Param("status") OrderStatus status);

// 3. Dynamic projection — one method, caller chooses the shape
&lt;T&gt; List&lt;T&gt; findByStatus(OrderStatus status, Class&lt;T&gt; type);
var rows = repo.findByStatus(PAID, OrderRow.class);

// 4. Open projection with SpEL — WARNING: fetches the whole entity
public interface OrderView {
    @Value("#{target.customer.name + ' (' + target.reference + ')'}")
    String getLabel();
}</code></pre>
<p><strong>Why projections matter for performance:</strong> loading a full entity selects every column (including large text and LOB columns), places it in the persistence context, takes a dirty-checking snapshot, and initialises proxies for its associations. A projection issues a narrow <code>SELECT id, total, name</code> and returns immutable rows with none of that overhead — commonly the single biggest win on read-heavy endpoints.</p>
<p><strong>The caveat to mention:</strong> a <em>closed</em> interface projection lets Spring Data optimise the select list; an <em>open</em> projection using <code>@Value</code>/SpEL cannot, so it loads the whole entity and defeats the purpose. Prefer records or closed interfaces.</p>
<p>Projections are also read-only by design, which is usually what you want for a query endpoint — no accidental dirty-checking writes.</p>`
},
{
  q: "How do you audit entities with Spring Data JPA?",
  level: "beginner", tags: ["auditing"],
  a: `<pre><code>@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {
    @Bean
    AuditorAware&lt;String&gt; auditorProvider() {
        return () -&gt; Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                             .filter(Authentication::isAuthenticated)
                             .map(Authentication::getName)
                             .or(() -&gt; Optional.of("system"));      // for scheduled jobs
    }
}

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class Auditable {
    @CreatedDate  @Column(updatable = false) private Instant createdAt;
    @LastModifiedDate                        private Instant updatedAt;
    @CreatedBy    @Column(updatable = false) private String createdBy;
    @LastModifiedBy                          private String updatedBy;
    @Version                                 private Long version;   // optimistic locking too
}

@Entity
public class Order extends Auditable { }</code></pre>
<p><strong>Two levels of auditing, and knowing the difference matters:</strong></p>
<ul>
<li><strong>Spring Data auditing</strong> (above) stamps <em>who and when</em> on the current row. Cheap, simple, covers most compliance asks like "when was this last changed and by whom".</li>
<li><strong>Hibernate Envers</strong> keeps a full <em>history</em> — every version of every row in shadow <code>_AUD</code> tables, queryable at a point in time. Add <code>@Audited</code> to an entity and you get temporal queries and diffs.</li>
</ul>
<pre><code>@Audited
@Entity
public class Order { }

AuditReader reader = AuditReaderFactory.get(entityManager);
Order asOfLastWeek = reader.find(Order.class, orderId, revisionNumber);</code></pre>
<p><strong>Trade-off to state:</strong> Envers roughly doubles write volume and storage, and the audit tables grow indefinitely without a retention policy — so use it for entities with genuine regulatory or dispute-resolution requirements (financial records, contracts), not for everything. A third option for high-volume systems is emitting domain events to Kafka and building the audit trail downstream, which keeps the write path fast.</p>`
},
{
  q: "What are the JPA performance anti-patterns you watch for?",
  level: "advanced", hot: true, tags: ["performance", "review"],
  a: `<ul>
<li><strong>N+1 queries</strong> — the most common by far. Fix with <code>JOIN FETCH</code>, <code>@EntityGraph</code> or <code>@BatchSize</code>, and detect it by asserting query counts in tests.</li>
<li><strong><code>FetchType.EAGER</code> on associations</strong> — it applies to every query forever and cannot be undone per use case. Always LAZY, fetch eagerly per query.</li>
<li><strong><code>open-in-view=true</code></strong> (the default) — holds a database connection for the whole request including view rendering, and hides N+1 problems until production load. Set it to <code>false</code>.</li>
<li><strong>Loading entities to delete or update them</strong> — <code>findAll()</code> then <code>delete()</code> in a loop issues N selects plus N deletes. Use a bulk <code>@Modifying</code> query.</li>
<li><strong><code>GenerationType.IDENTITY</code> with batch inserts</strong> — silently disables JDBC batching. Use <code>SEQUENCE</code> with a pooled <code>allocationSize</code>.</li>
<li><strong>Returning entities from controllers</strong> — triggers lazy loading during serialisation, leaks the schema into the API, and risks infinite recursion on bidirectional relationships. Return DTOs.</li>
<li><strong>Lombok <code>@Data</code>/<code>@EqualsAndHashCode</code>/<code>@ToString</code> on entities</strong> — touches every field, triggering lazy loads and potential infinite recursion.</li>
<li><strong>Unbounded queries</strong> — <code>findAll()</code> on a table that grows. Always paginate.</li>
<li><strong>Huge persistence contexts</strong> in batch jobs — flush and clear periodically, or use <code>StatelessSession</code>.</li>
<li><strong><code>ddl-auto=update</code> in production</strong> — not reviewable, not reproducible, cannot drop or rename. Use Flyway with <code>ddl-auto=validate</code>.</li>
<li><strong>Cartesian products</strong> from two <code>JOIN FETCH</code>es on collections — <code>MultipleBagFetchException</code> or a massive result set.</li>
</ul>
<blockquote><p><strong>How to detect them:</strong> enable SQL logging with <code>datasource-proxy</code> in tests and assert the query count for key endpoints. A test that fails when an endpoint goes from 3 queries to 300 catches these before production, which is far more effective than code review alone.</p></blockquote>`
},
{
  q: "How do you handle soft deletes and multi-tenancy in Hibernate?",
  level: "advanced", tags: ["patterns", "saas"],
  a: `<pre><code>// SOFT DELETE — Hibernate 6.4+ has first-class support
@Entity
@SoftDelete(columnName = "deleted", strategy = SoftDeleteType.DELETED)
public class Order { }
// DELETE becomes UPDATE orders SET deleted = true, and every query adds "WHERE deleted = false"

// Pre-6.4 approach
@Entity
@SQLDelete(sql = "UPDATE orders SET deleted = true WHERE id = ? AND version = ?")
@SQLRestriction("deleted = false")            // was @Where
public class Order { }</code></pre>
<pre><code>// MULTI-TENANCY — discriminator strategy with a Hibernate filter
@Entity
@FilterDef(name = "tenantFilter",
           parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Order {
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private String tenantId;
}

// Enable per transaction, from the AUTHENTICATED principal — never a request parameter
@Component
@RequiredArgsConstructor
public class TenantFilterAspect {
    private final EntityManager em;

    @Before("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void enableFilter() {
        em.unwrap(Session.class)
          .enableFilter("tenantFilter")
          .setParameter("tenantId", TenantContext.current());
    }
}</code></pre>
<p><strong>Caveats worth raising for both:</strong></p>
<ul>
<li><strong>Soft delete breaks unique constraints</strong> — a "deleted" row still occupies the unique email. Use a partial index (<code>WHERE deleted = false</code> in PostgreSQL) or include the deleted flag in the constraint.</li>
<li>Soft-deleted rows accumulate forever; plan archival, and remember they still count against index size and query cost.</li>
<li><strong>Hibernate filters do not apply to <code>find()</code> by ID</strong> or to native queries — so filters alone are not a security boundary. For genuine tenant isolation, back it with <strong>PostgreSQL row-level security</strong>, which the database enforces regardless of how the query was written.</li>
<li>Always index on <code>(tenant_id, ...)</code> as the leading column, or every query scans across tenants.</li>
</ul>`
}
]);
