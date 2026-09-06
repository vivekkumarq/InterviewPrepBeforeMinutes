appendTopic("testing", [
{
  q: "What is AssertJ and why prefer it over JUnit assertions?",
  level: "beginner", tags: ["assertions"],
  a: `<pre><code>// JUnit — argument order is easy to get wrong, failure messages are thin
assertEquals(expected, actual);
assertTrue(order.getTotal().compareTo(BigDecimal.TEN) &gt; 0);   // failure says "expected true"

// AssertJ — fluent, discoverable, and failures explain themselves
assertThat(order.total()).isGreaterThan(BigDecimal.TEN);
assertThat(orders)
        .hasSize(3)
        .extracting(Order::status)
        .containsExactly(PENDING, PAID, SHIPPED);

assertThat(order)
        .usingRecursiveComparison()
        .ignoringFields("id", "createdAt")            // compare whole objects sensibly
        .isEqualTo(expectedOrder);

assertThatThrownBy(() -&gt; service.place(invalid))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("customerId")
        .hasCauseInstanceOf(ConstraintViolationException.class);

assertThat(result).satisfies(r -&gt; {                    // group related assertions
    assertThat(r.status()).isEqualTo(PAID);
    assertThat(r.paidAt()).isNotNull();
});

// SoftAssertions — report ALL failures, not just the first
SoftAssertions.assertSoftly(softly -&gt; {
    softly.assertThat(order.total()).isEqualByComparingTo("199.00");
    softly.assertThat(order.status()).isEqualTo(PAID);
    softly.assertThat(order.items()).hasSize(2);
});</code></pre>
<p><strong>Why it is worth adopting:</strong> the failure messages. AssertJ prints "expected size 3 but was 2, actual: [a, b]" where JUnit prints "expected true but was false" — which tells you nothing and forces a debugger session. Over a large suite that difference compounds enormously.</p>
<p><strong>Two features worth highlighting:</strong> <code>usingRecursiveComparison</code> replaces writing 15 field-by-field assertions and does not depend on the class implementing <code>equals</code>; and <strong>soft assertions</strong> matter because a normal assertion aborts the test at the first failure, so you fix one thing, re-run, and discover the next — three round trips instead of one.</p>
<p>The <code>isEqualByComparingTo</code> detail is a real trap: <code>assertThat(new BigDecimal("1.0")).isEqualTo(new BigDecimal("1.00"))</code> <em>fails</em>, because <code>BigDecimal.equals</code> compares scale. Use <code>isEqualByComparingTo</code> for money.</p>`
},
{
  q: "How do you write good test data builders and fixtures?",
  level: "advanced", tags: ["patterns", "quality"],
  a: `<pre><code>// The problem: every test constructs the full object, so adding a field breaks 200 tests
var order = new Order("ORD-1", customerId, items, total, PENDING, now, null, null, 0);

// Test Data Builder — sensible defaults, override only what the test cares about
public class OrderTestBuilder {
    private String reference = "ORD-" + counter.incrementAndGet();
    private OrderStatus status = OrderStatus.PENDING;
    private BigDecimal total = new BigDecimal("100.00");
    private List&lt;LineItem&gt; items = List.of(anItem().build());

    public static OrderTestBuilder anOrder() { return new OrderTestBuilder(); }

    public OrderTestBuilder paid()                 { this.status = PAID; return this; }
    public OrderTestBuilder withTotal(String t)    { this.total = new BigDecimal(t); return this; }
    public OrderTestBuilder withoutItems()         { this.items = List.of(); return this; }

    public Order build() { return new Order(reference, ..., status, total, items); }
}

// The test now states ONLY what is relevant to it
@Test
void appliesDiscountToLargeOrders() {
    var order = anOrder().withTotal("5000.00").build();      // status/items are irrelevant here
    assertThat(pricing.discountFor(order)).isEqualByComparingTo("500.00");
}</code></pre>
<p><strong>Why this matters more than it looks:</strong> a test should communicate <em>why</em> it passes. When a test constructs nine fields but only one affects the outcome, the reader cannot tell which. A builder makes the significant values explicit and everything else invisible — the test becomes documentation.</p>
<p><strong>It also protects against churn:</strong> adding a required field to <code>Order</code> means changing one builder, not 200 test files. That single property is what keeps a large suite maintainable.</p>
<p><strong>Related practices:</strong> the Object Mother pattern (<code>Orders.paidOrder()</code>) for a few named canonical fixtures; unique values per build (the counter above) so tests never collide on a unique constraint when run in parallel; and for records, a generated <code>toBuilder()</code> or a wither. Avoid shared mutable fixtures in a <code>@BeforeEach</code> field — that reintroduces coupling between tests.</p>`
},
{
  q: "How do you test exception handling and edge cases properly?",
  level: "beginner", tags: ["quality"],
  a: `<pre><code>@Test
void throwsWhenStockIsInsufficient() {
    given(inventory.available("SKU-1")).willReturn(2);

    assertThatThrownBy(() -&gt; service.place(orderFor("SKU-1", 5)))
            .isInstanceOf(InsufficientStockException.class)
            .hasMessageContaining("SKU-1")
            .satisfies(e -&gt; {
                var ex = (InsufficientStockException) e;
                assertThat(ex.available()).isEqualTo(2);      // assert the DATA, not just the type
                assertThat(ex.requested()).isEqualTo(5);
            });

    then(paymentClient).shouldHaveNoInteractions();           // nothing was charged
    then(orderRepo).should(never()).save(any());              // nothing was persisted
}</code></pre>
<p><strong>The part most people miss:</strong> asserting the exception type is not enough. Verify that the failure left the system in a correct state — no partial writes, no external call made, no event published. That is what the bug would actually be.</p>
<p><strong>Edge cases worth a checklist:</strong></p>
<ul>
<li><strong>Boundaries</strong> — 0, 1, n−1, n, n+1, max value, overflow.</li>
<li><strong>Empty and null</strong> — empty list, empty string, blank string, null argument.</li>
<li><strong>Duplicates</strong> — the same item twice, the same request retried.</li>
<li><strong>Ordering</strong> — reversed input, already-sorted input.</li>
<li><strong>Concurrency</strong> — the same operation from two threads.</li>
<li><strong>Money and dates</strong> — negative amounts, rounding at 0.005, leap years, DST transitions, timezone boundaries, month ends.</li>
<li><strong>Unicode</strong> — emoji, right-to-left text, combining characters, and strings whose <code>length()</code> differs from their visible character count.</li>
</ul>
<pre><code>@ParameterizedTest
@ValueSource(strings = { "", " ", "\\t", "\\n" })
@NullSource
void rejectsBlankReference(String ref) {
    assertThatThrownBy(() -&gt; new Order(ref)).isInstanceOf(IllegalArgumentException.class);
}</code></pre>
<p><strong>Also test that you do not over-catch:</strong> a test asserting that a <code>RuntimeException</code> propagates rather than being swallowed into a generic error is genuinely valuable, because exception swallowing is invisible in code review and fatal in production.</p>`
},
{
  q: "What is mutation testing and is it worth using?",
  level: "advanced", tags: ["quality", "metrics"],
  a: `<p>Mutation testing deliberately introduces small bugs ("mutants") into your code and checks whether any test fails. A mutant that survives means that line is executed by your tests but its <em>behaviour is not actually verified</em>.</p>
<pre><code>// Original
if (order.total().compareTo(THRESHOLD) &gt; 0) applyDiscount();

// Mutants PIT will generate
if (order.total().compareTo(THRESHOLD) &gt;= 0) applyDiscount();   // boundary changed
if (order.total().compareTo(THRESHOLD) &lt; 0)  applyDiscount();   // condition negated
if (true)                                    applyDiscount();   // condition removed
// applyDiscount();                                             // call removed</code></pre>
<pre><code>&lt;plugin&gt;
  &lt;groupId&gt;org.pitest&lt;/groupId&gt;&lt;artifactId&gt;pitest-maven&lt;/artifactId&gt;
  &lt;configuration&gt;
    &lt;targetClasses&gt;&lt;param&gt;com.acme.pricing.*&lt;/param&gt;&lt;/targetClasses&gt;
    &lt;mutationThreshold&gt;80&lt;/mutationThreshold&gt;
    &lt;timestampedReports&gt;false&lt;/timestampedReports&gt;
  &lt;/configuration&gt;
&lt;/plugin&gt;
mvn org.pitest:pitest-maven:mutationCoverage</code></pre>
<p><strong>Why it is a better metric than line coverage:</strong> a test with no assertions gives 100% line coverage and kills zero mutants. Coverage measures which lines <em>ran</em>; mutation score measures which behaviours are actually <em>asserted</em>. It is the difference between "the test touched this code" and "the test would notice if this code broke".</p>
<p><strong>Is it worth it?</strong> Yes, but selectively:</p>
<ul>
<li><strong>Run it on business-critical logic</strong> — pricing, tax, eligibility rules, state machines — not on the whole codebase.</li>
<li><strong>It is slow</strong>, because it runs the test suite once per mutant. Scope it to specific packages and run it nightly rather than on every commit.</li>
<li><strong>Expect equivalent mutants</strong> — some mutations do not change observable behaviour and can never be killed, so 100% is not a realistic target.</li>
</ul>
<p><strong>The way I would put it in an interview:</strong> "I would not mandate it across the codebase, but running PIT once on a critical module is genuinely revealing — it typically shows that boundary conditions and error paths are covered but not verified, which is exactly where the bugs are."</p>`
},
{
  q: "How do you test a Spring Boot application's database layer properly?",
  level: "advanced", hot: true, tags: ["integration", "jpa"],
  a: `<pre><code>@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)          // use the REAL database, not H2
@Testcontainers
class OrderRepositoryTest {

    @Container @ServiceConnection                    // Boot 3.1+: wires the datasource
    static PostgreSQLContainer&lt;?&gt; db = new PostgreSQLContainer&lt;&gt;("postgres:16-alpine")
            .withReuse(true);

    @Autowired OrderRepository repo;
    @Autowired TestEntityManager em;

    @Test
    void findsUnfulfilledOrdersOlderThan() {
        em.persist(anOrder().pending().createdAt(now().minusDays(5)).build());
        em.persist(anOrder().paid().createdAt(now().minusDays(5)).build());
        em.flush();
        em.clear();                                   // CRITICAL — force a real database read

        var result = repo.findUnfulfilledOlderThan(Duration.ofDays(3));

        assertThat(result).hasSize(1)
                          .extracting(Order::status).containsExactly(PENDING);
    }

    @Test
    void enforcesUniqueReference() {
        em.persistAndFlush(anOrder().withReference("ORD-1").build());
        assertThatThrownBy(() -&gt; em.persistAndFlush(anOrder().withReference("ORD-1").build()))
                .isInstanceOf(PersistenceException.class);   // the CONSTRAINT is tested
    }
}</code></pre>
<p><strong>The three things that make these tests meaningful:</strong></p>
<ol>
<li><strong><code>em.clear()</code> before the assertion.</strong> Without it, the entity is still in the persistence context and the repository returns the cached instance — your query is never executed against the database, so a broken JPQL query passes. This is the most common false-positive in JPA testing.</li>
<li><strong>The real database, not H2.</strong> H2's PostgreSQL compatibility differs on JSONB, arrays, <code>ON CONFLICT</code>, locking and type coercion. A test passing on H2 and failing in production is the worst possible outcome.</li>
<li><strong>Test constraints and migrations too</strong> — unique constraints, foreign keys and check constraints are part of your correctness guarantees, and Flyway migrations should run in the test so schema drift is caught.</li>
</ol>
<p><strong>Also worth testing:</strong> query counts. Asserting that an endpoint issues 3 queries rather than 300 (with datasource-proxy) is the regression test that catches N+1 problems before production — far more reliably than code review.</p>`
},
{
  q: "What is the difference between stubbing, verifying and argument matchers?",
  level: "beginner", tags: ["mockito"],
  a: `<pre><code>// STUBBING — define what the collaborator returns
given(repo.findById(1L)).willReturn(Optional.of(order));
given(client.charge(any())).willThrow(new PaymentDeclinedException());
given(repo.save(any(Order.class))).willAnswer(inv -&gt; inv.getArgument(0));  // echo the input

// Consecutive calls — useful for retry logic
given(client.fetch()).willThrow(new TimeoutException())
                     .willReturn(response);          // fails once, then succeeds

// VERIFYING — assert the interaction happened
then(repo).should().save(order);
then(repo).should(times(2)).save(any());
then(repo).should(never()).delete(any());
then(client).shouldHaveNoInteractions();
then(repo).should(atLeastOnce()).findById(1L);

// ORDER of interactions
InOrder order = inOrder(inventory, payment);
order.verify(inventory).reserve(any());
order.verify(payment).charge(any());               // reserve MUST happen before charge

// ARGUMENT MATCHERS — all or nothing
given(service.transfer(eq(1L), eq(2L), any()));    // ✔
given(service.transfer(1L, 2L, any()));            // ✘ InvalidUseOfMatchersException

// CAPTOR — inspect what was actually passed
@Captor ArgumentCaptor&lt;Order&gt; captor;
then(repo).should().save(captor.capture());
assertThat(captor.getValue().status()).isEqualTo(PAID);

// Or an inline argument matcher
then(repo).should().save(argThat(o -&gt; o.status() == PAID &amp;&amp; o.total().signum() &gt; 0));</code></pre>
<p><strong>The rule that trips people up:</strong> if you use a matcher for <em>one</em> argument, you must use matchers for <em>all</em> of them — hence <code>eq(1L)</code>. Mockito matchers work by pushing onto a stack, so mixing raw values and matchers corrupts the ordering.</p>
<p><strong>The judgement point:</strong> prefer asserting on the <em>result</em> (state verification) over verifying interactions. <code>then(repo).should().save(any())</code> couples the test to how the code is written, so a legitimate refactor breaks it. Verify interactions only when the interaction <em>is</em> the requirement — an email was sent, a payment was <em>not</em> charged after validation failed.</p>`
},
{
  q: "How do you test time-dependent and scheduled code?",
  level: "advanced", tags: ["quality", "patterns"],
  a: `<pre><code>// The design decision that makes this possible: inject a Clock
@Service
@RequiredArgsConstructor
public class SubscriptionService {
    private final Clock clock;                         // NOT Instant.now() everywhere

    public boolean isExpired(Subscription s) {
        return Instant.now(clock).isAfter(s.expiresAt());
    }
    public Subscription renew(Subscription s) {
        return s.withExpiry(LocalDate.now(clock).plusMonths(1));
    }
}

@Configuration
class ClockConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }   // real clock in production
}</code></pre>
<pre><code>// Tests become fully deterministic
class SubscriptionServiceTest {
    private final Clock fixed = Clock.fixed(Instant.parse("2026-09-06T10:00:00Z"), UTC);
    private final SubscriptionService service = new SubscriptionService(fixed);

    @Test void detectsExpiry() {
        var sub = subscription().expiringAt("2026-09-05T00:00:00Z").build();
        assertThat(service.isExpired(sub)).isTrue();
    }

    @Test void handlesMonthEndCorrectly() {                 // the bug you would never catch
        var jan31 = Clock.fixed(Instant.parse("2026-01-31T00:00:00Z"), UTC);
        assertThat(new SubscriptionService(jan31).renew(sub).expiresAt())
                .isEqualTo(LocalDate.of(2026, 2, 28));      // not "February 31"
    }
}

// Advancing time
Clock advanced = Clock.offset(fixed, Duration.ofDays(31));</code></pre>
<p><strong>Testing the scheduling itself:</strong> do not wait for <code>@Scheduled</code> to fire — call the method directly. The schedule expression is configuration; the logic is what needs testing. If you must verify wiring, assert the cron expression or use <code>@SpringBootTest</code> with a very short interval and Awaitility.</p>
<pre><code>@Test void nightlyJobArchivesOldOrders() {
    job.archiveOldOrders();                            // invoke directly — no waiting
    assertThat(repo.findArchived()).hasSize(3);
}</code></pre>
<p><strong>The broader principle worth stating:</strong> anything non-deterministic — time, randomness, UUID generation, the environment — should be injected rather than called statically. That single habit turns a whole category of untestable code into ordinary unit tests, and it is why <code>Clock</code> exists in <code>java.time</code> at all.</p>`
}
]);
