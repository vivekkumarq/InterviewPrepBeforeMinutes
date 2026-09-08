appendTopic("testing", [
{
  q: "What makes a good unit test, and how do you write them with JUnit 5?",
  level: "beginner", hot: true, tags: ["junit", "best-practice", "assertions"],
  companies: ["Amazon", "TCS", "Infosys", "Optum", "SAP", "Cognizant", "Accenture", "EPAM"],
  a: `<pre><code>class PricingServiceTest {

    @Test
    @DisplayName("applies a 10% discount for gold customers on orders over 1000")
    void goldDiscount() {
        // ARRANGE — only what this test needs
        var service = new PricingService(new FixedRateProvider(0.10));
        var order = anOrder().withTotal(2000).withTier(GOLD).build();   // test data builder

        // ACT — exactly one action
        Money result = service.total(order);

        // ASSERT — the outcome, and nothing else
        assertThat(result).isEqualTo(Money.of(1800));
    }

    @ParameterizedTest(name = "{0} orders below the threshold get no discount")
    @EnumSource(Tier.class)
    void noDiscountBelowThreshold(Tier tier) {
        var order = anOrder().withTotal(500).withTier(tier).build();
        assertThat(service.total(order)).isEqualTo(Money.of(500));
    }

    @ParameterizedTest
    @CsvSource({ "1000, GOLD, 900", "1000, SILVER, 950", "1000, BRONZE, 1000" })
    void discountByTier(int total, Tier tier, int expected) { }
}</code></pre>
<table>
<tr><th>Property</th><th>Meaning</th></tr>
<tr><td><strong>F</strong>ast</td><td>Milliseconds. A slow suite stops being run.</td></tr>
<tr><td><strong>I</strong>solated</td><td>No shared state; any order, any subset, same result</td></tr>
<tr><td><strong>R</strong>epeatable</td><td>No clock, no randomness, no network — inject a <code>Clock</code> and a seed</td></tr>
<tr><td><strong>S</strong>elf-validating</td><td>Passes or fails; nobody reads the output to decide</td></tr>
<tr><td><strong>T</strong>imely</td><td>Written with the code, not months later</td></tr>
</table>
<pre><code>// JUnit 5 features worth knowing
@BeforeEach / @AfterEach          // per test
@BeforeAll  / @AfterAll           // once per class — must be static (or use PER_CLASS)
@Nested class WhenOrderIsEmpty {} // groups related cases, reads like a spec
@Disabled("flaky — see JIRA-421") // quarantine WITH a reason and a ticket
@Timeout(2)                       // fail rather than hang the build
@Tag("slow")                      // filter: mvn test -Dgroups='!slow'

// Exceptions — assert the type AND the message
var ex = assertThrows(InsufficientFundsException.class, () -&gt; account.withdraw(500));
assertThat(ex.getMessage()).contains("balance");

// Multiple assertions that should ALL be reported, not just the first failure
assertAll(
    () -&gt; assertThat(order.status()).isEqualTo(CONFIRMED),
    () -&gt; assertThat(order.total()).isEqualTo(Money.of(1800)),
    () -&gt; assertThat(order.items()).hasSize(3)
);</code></pre>
<table>
<tr><th>Smell</th><th>Fix</th></tr>
<tr><td>Test name says <code>test1</code></td><td>Name the <em>behaviour</em>: <code>rejectsWithdrawalAboveBalance</code></td></tr>
<tr><td>Several unrelated assertions</td><td>One behaviour per test — a failure should name the cause</td></tr>
<tr><td><code>Thread.sleep</code></td><td><code>Awaitility.await().atMost(2, SECONDS).until(...)</code></td></tr>
<tr><td>Logic in the test (loops, ifs)</td><td>Use a parameterised test — a bug in the test is invisible</td></tr>
<tr><td>Tests depend on execution order</td><td>Real isolation. Randomise the order to expose it.</td></tr>
<tr><td>Asserting on log output</td><td>Assert on the return value or a collaborator interaction</td></tr>
<tr><td>Copy-pasted setup everywhere</td><td>Test data builders — <code>anOrder().withTotal(...)</code></td></tr>
</table>
<pre><code>// The question to ask of every test: WHAT WOULD BREAK IT?
// - A refactor with no behaviour change breaks it -> testing implementation.
//   Low value, high maintenance. Delete or rewrite it.
// - A behaviour change breaks it -> testing behaviour. Keep it.
//
// This is why over-mocking is a design smell: a test that verifies which
// private methods were called fails on every refactor and catches no bugs.</code></pre>
<p><strong>On coverage, be precise:</strong> "Coverage tells me what is <em>not</em> tested; it says nothing about whether what is tested is tested well. A test with no assertions gives full coverage. I use it to find untested branches in critical code, and I do not chase a percentage target — teams that do end up writing tests for getters."</p>`
},
{
  q: "How do you test asynchronous, time-dependent and concurrent code?",
  level: "advanced", tags: ["techniques", "async", "concurrency"],
  companies: ["Amazon", "Goldman Sachs", "SAP", "Optum", "Flipkart", "ThoughtWorks", "Oracle"],
  a: `<pre><code>// ✗ The flaky test everyone writes first
@Test void processesOrderAsync() {
    service.processAsync(order);
    Thread.sleep(1000);                      // hope it finished
    assertThat(repo.findById(order.id())).isPresent();
}
// Fails on a loaded CI machine, wastes a second when it passes, and gives
// no signal about WHY it failed. Sleeping is never the answer.

// ✔ Await a CONDITION, with a timeout
@Test void processesOrderAsync() {
    service.processAsync(order);
    await().atMost(5, SECONDS)
           .pollInterval(50, MILLISECONDS)
           .untilAsserted(() -&gt; assertThat(repo.findById(order.id())).isPresent());
}</code></pre>
<pre><code>// ✔ Better still — remove the asynchrony from the test entirely
@TestConfiguration
static class SyncConfig {
    @Bean TaskExecutor taskExecutor() { return new SyncTaskExecutor(); }   // runs inline
}
// Now the test is deterministic and instant. Test the ASYNC WIRING separately,
// in one integration test, rather than in every behavioural test.</code></pre>
<pre><code>// TIME — the fix is to inject it, never to call now() directly
@Service
public class SubscriptionService {
    private final Clock clock;                        // injected
    public boolean isExpired(Subscription s) {
        return s.endsAt().isBefore(Instant.now(clock));
    }
}

@Test void detectsExpiry() {
    var clock = Clock.fixed(Instant.parse("2026-09-09T10:00:00Z"), ZoneOffset.UTC);
    var service = new SubscriptionService(clock);
    assertThat(service.isExpired(subEndingAt("2026-09-08T23:59:59Z"))).isTrue();
}
// Testing "does this expire after 30 days" by sleeping for 30 days is not an option,
// so a service that calls Instant.now() directly is simply not testable.
// @Bean Clock systemClock() { return Clock.systemUTC(); }   // one line in production</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Injected clock replacing the system clock in tests">
  <rect class="dg-fill" x="16" y="46" width="150" height="40" rx="8"/><text class="dg-s" x="91" y="70" text-anchor="middle">SubscriptionService</text>
  <path class="dg-line" d="M170 56 H236" marker-end="url(#tm1)"/>
  <path class="dg-line" d="M170 76 H236" marker-end="url(#tm1)"/>
  <rect class="dg-fill2" x="240" y="20" width="180" height="34" rx="6"/><text class="dg-s" x="330" y="42" text-anchor="middle">Clock.systemUTC()  (prod)</text>
  <rect class="dg-box" x="240" y="76" width="180" height="34" rx="6"/><text class="dg-s" x="330" y="98" text-anchor="middle">Clock.fixed(…)  (test)</text>
  <text class="dg-s" x="440" y="70">time becomes an input,</text>
  <text class="dg-s" x="440" y="90">so it can be controlled</text>
  <defs><marker id="tm1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// CONCURRENCY — a race that only appears under real parallelism
@Test void concurrentDecrementsNeverOversell() throws Exception {
    stockRepo.save(new Stock("SKU-1", 100));
    int threads = 50;
    var start = new CountDownLatch(1);            // release them all at once,
    var done  = new CountDownLatch(threads);      // to maximise the overlap
    var errors = new ConcurrentLinkedQueue&lt;Throwable&gt;();

    try (var pool = Executors.newFixedThreadPool(threads)) {
        for (int i = 0; i &lt; threads; i++) {
            pool.submit(() -&gt; {
                try { start.await(); service.decrement("SKU-1", 2); }
                catch (Throwable t) { errors.add(t); }
                finally { done.countDown(); }
            });
        }
        start.countDown();
        assertThat(done.await(10, SECONDS)).isTrue();
    }
    assertThat(errors).isEmpty();
    assertThat(stockRepo.find("SKU-1").quantity()).isZero();   // exactly 0, never negative
}</code></pre>
<table>
<tr><th>Problem</th><th>Technique</th></tr>
<tr><td>Async completion</td><td>Awaitility, or make it synchronous in tests</td></tr>
<tr><td>Time and expiry</td><td>Inject a <code>Clock</code>; <code>Clock.fixed</code> / <code>Clock.offset</code></td></tr>
<tr><td>Randomness</td><td>Inject the source; fixed seed, logged on failure</td></tr>
<tr><td>Race conditions</td><td><code>CountDownLatch</code> to align threads; run the test many times</td></tr>
<tr><td>Scheduled jobs</td><td>Test the method directly; test the schedule with one wiring test</td></tr>
<tr><td>Message consumers</td><td>Testcontainers Kafka + Awaitility on the outcome</td></tr>
<tr><td>Deep concurrency correctness</td><td>jcstress or a Lincheck-style linearizability test — name it, do not write it live</td></tr>
</table>
<p><strong>The honest limitation to state:</strong> "A passing concurrency test proves nothing about the absence of a race — it only failed to trigger one this time. So I lean on design instead: immutable objects, confining state to one thread, and letting the database enforce the invariant with a constraint or a conditional update. The test is a smoke check on top of a design that does not depend on timing."</p>`
}
]);
