appendTopic("testing", [
{
  q: "What is WireMock and how do you test integrations with external APIs?",
  level: "advanced", hot: true, tags: ["integration", "mocking"],
  a: `<pre><code>@SpringBootTest
@AutoConfigureWireMock(port = 0)                    // random port, injected as wiremock.server.port
class PaymentClientTest {

    @Autowired PaymentClient client;

    @Test
    void retriesOnServerErrorThenSucceeds() {
        stubFor(post(urlEqualTo("/v1/charges"))
                .inScenario("retry").whenScenarioStateIs(STARTED)
                .willReturn(aResponse().withStatus(503))
                .willSetStateTo("second"));

        stubFor(post(urlEqualTo("/v1/charges"))
                .inScenario("retry").whenScenarioStateIs("second")
                .willReturn(okJson("""
                        { "id": "ch_1", "status": "succeeded" }
                        """)));

        var result = client.charge(request);

        assertThat(result.status()).isEqualTo(SUCCEEDED);
        verify(2, postRequestedFor(urlEqualTo("/v1/charges"))
                .withHeader("Idempotency-Key", matching(".+")));   // assert we SENT the key
    }

    @Test
    void handlesTimeout() {
        stubFor(post(urlEqualTo("/v1/charges"))
                .willReturn(aResponse().withFixedDelay(5000)));    // simulate a slow provider

        assertThatThrownBy(() -&gt; client.charge(request))
                .isInstanceOf(PaymentTimeoutException.class);
    }
}</code></pre>
<p><strong>Why WireMock rather than mocking your own client class:</strong> mocking <code>PaymentClient</code> tests nothing about the actual HTTP layer — serialisation, headers, status-code handling, timeouts, retry configuration and error mapping all go untested. WireMock exercises the real client code against a controlled server, so those are covered.</p>
<p><strong>The scenarios worth testing that people skip:</strong> a 500 followed by success (does the retry work?), a timeout (is the timeout actually configured?), a 429 with <code>Retry-After</code>, a malformed body, and a connection reset. Those are the failures that occur in production, and they are trivial to simulate here and nearly impossible to trigger against a real sandbox.</p>
<p><strong>Related tools:</strong> <code>MockRestServiceServer</code> (<code>@RestClientTest</code>) is lighter for pure client tests; <strong>MSW</strong> is the frontend equivalent; and <strong>record and playback</strong> mode lets WireMock capture real responses from a sandbox and replay them — useful for getting realistic fixtures without hand-writing JSON.</p>`
},
{
  q: "How do you organise tests and keep a large suite fast?",
  level: "advanced", tags: ["strategy", "performance"],
  a: `<pre><code>// Tag tests so you can run subsets
@Tag("unit")        class PricingCalculatorTest { }
@Tag("integration") class OrderRepositoryTest { }
@Tag("slow")        class FullImportTest { }</code></pre>
<pre><code>&lt;!-- Maven: fast tests on every push, slow ones on merge --&gt;
&lt;plugin&gt;&lt;artifactId&gt;maven-surefire-plugin&lt;/artifactId&gt;
  &lt;configuration&gt;
    &lt;excludedGroups&gt;integration,slow&lt;/excludedGroups&gt;
    &lt;parallel&gt;classes&lt;/parallel&gt;
    &lt;threadCount&gt;4&lt;/threadCount&gt;
  &lt;/configuration&gt;
&lt;/plugin&gt;
&lt;plugin&gt;&lt;artifactId&gt;maven-failsafe-plugin&lt;/artifactId&gt;   &lt;!-- *IT.java, runs at verify --&gt;
&lt;/plugin&gt;</code></pre>
<p><strong>The biggest win in a Spring codebase is context caching.</strong> Spring caches the application context and reuses it across test classes with <em>identical</em> configuration. Every distinct combination of annotations, properties and mocked beans creates a new context — and each one costs seconds.</p>
<pre><code>// ✘ Three different contexts = three startups
@SpringBootTest                                       class A { }
@SpringBootTest @MockitoBean(OrderService.class)      class B { }
@SpringBootTest @TestPropertySource(properties="x=1") class C { }

// ✔ One shared configuration, one context, reused by every test class
@SpringBootTest
@ActiveProfiles("test")
public abstract class IntegrationTestBase {
    @Container @ServiceConnection
    static final PostgreSQLContainer&lt;?&gt; DB = new PostgreSQLContainer&lt;&gt;("postgres:16-alpine");
    static { DB.start(); }                            // singleton container, started once
}</code></pre>
<p><strong>Other levers, roughly in order of impact:</strong></p>
<ol>
<li><strong>Fewer <code>@SpringBootTest</code> classes</strong> — prefer plain unit tests and slice tests. Most logic needs no container at all.</li>
<li><strong>A singleton Testcontainer</strong> shared across the suite rather than one per class, plus <code>withReuse(true)</code> locally.</li>
<li><strong>Parallel execution</strong> — but only if tests are genuinely independent; shared database state will surface immediately.</li>
<li><strong>Split the pipeline</strong> — unit tests on every push, integration on merge, full end-to-end nightly.</li>
<li><strong>Measure</strong> — surefire reports show the slowest classes; usually a handful dominate the total.</li>
</ol>
<p><strong>The target:</strong> under ten minutes to first feedback. Past that, people batch commits and stop running tests locally, which defeats the purpose of having them.</p>`
},
{
  q: "What is the difference between verification and validation, and what is a test double taxonomy?",
  level: "beginner", tags: ["terminology", "quality"],
  a: `<ul>
<li><strong>Verification</strong> — "are we building the product <em>right</em>?" Does the code meet its specification? Unit tests, integration tests, static analysis.</li>
<li><strong>Validation</strong> — "are we building the <em>right</em> product?" Does it solve the user's actual problem? User acceptance testing, usability testing, A/B tests, and talking to users.</li>
</ul>
<p>A system can be perfectly verified and completely invalid — flawlessly implementing a feature nobody wanted. That distinction is why "all tests pass" is not the same as "this works".</p>
<p><strong>Test double taxonomy</strong> (Meszaros), from simplest to most capable:</p>
<table>
<tr><th>Double</th><th>Behaviour</th><th>Example</th></tr>
<tr><td><strong>Dummy</strong></td><td>Passed but never used</td><td><code>null</code> to satisfy a signature</td></tr>
<tr><td><strong>Stub</strong></td><td>Returns canned answers</td><td><code>given(repo.findById(1)).willReturn(order)</code></td></tr>
<tr><td><strong>Spy</strong></td><td>A real object that records calls</td><td><code>@Spy</code> on a real calculator</td></tr>
<tr><td><strong>Mock</strong></td><td>Pre-programmed with expectations; verification is the point</td><td><code>then(email).should().send(any())</code></td></tr>
<tr><td><strong>Fake</strong></td><td>A working lightweight implementation</td><td>In-memory repository, H2, a <code>Map</code>-backed cache</td></tr>
</table>
<pre><code>// A FAKE is often more readable than a pile of stubbing
class InMemoryOrderRepository implements OrderRepository {
    private final Map&lt;String, Order&gt; store = new ConcurrentHashMap&lt;&gt;();
    public Optional&lt;Order&gt; findById(String id) { return Optional.ofNullable(store.get(id)); }
    public Order save(Order o) { store.put(o.id(), o); return o; }
}
// The test reads like the real thing, and it exercises real logic
// instead of your assumptions about what the repository returns.</code></pre>
<p><strong>The practical guidance:</strong> the distinction that matters day to day is <em>state</em> verification (assert on the result — prefer this) versus <em>behaviour</em> verification (assert on the interaction — use when there is no observable result, like an email being sent). Over-using mocks couples tests to implementation, so a legitimate refactor breaks a hundred tests that were never checking anything real.</p>`
},
{
  q: "How do you test error handling, retries and resilience patterns?",
  level: "advanced", tags: ["resilience", "integration"],
  a: `<pre><code>// 1. Retry — verify it retries the right number of times, on the right exceptions
@Test
void retriesTransientFailuresThenSucceeds() {
    given(client.charge(any()))
            .willThrow(new SocketTimeoutException())
            .willThrow(new SocketTimeoutException())
            .willReturn(Receipt.ok("r-1"));           // succeeds on the third attempt

    var result = service.pay(order);

    assertThat(result.reference()).isEqualTo("r-1");
    then(client).should(times(3)).charge(any());
}

@Test
void doesNotRetryPermanentFailures() {
    given(client.charge(any())).willThrow(new CardDeclinedException());

    assertThatThrownBy(() -&gt; service.pay(order)).isInstanceOf(PaymentDeclinedException.class);
    then(client).should(times(1)).charge(any());       // NOT retried — this is the real test
}

// 2. Circuit breaker — drive it into the OPEN state and assert fail-fast
@Test
void opensCircuitAfterRepeatedFailures() {
    given(client.charge(any())).willThrow(new ServiceUnavailableException());

    for (int i = 0; i &lt; 10; i++) {
        try { service.pay(order); } catch (Exception ignored) { }
    }
    assertThat(registry.circuitBreaker("payment").getState()).isEqualTo(State.OPEN);

    // Once open, calls must fail immediately WITHOUT touching the downstream
    clearInvocations(client);
    assertThatThrownBy(() -&gt; service.pay(order)).isInstanceOf(CallNotPermittedException.class);
    then(client).shouldHaveNoInteractions();
}

// 3. Timeout — WireMock with a fixed delay proves the timeout is configured
stubFor(post("/v1/charges").willReturn(aResponse().withFixedDelay(5000)));</code></pre>
<p><strong>The distinction that matters most:</strong> asserting that transient failures <em>are</em> retried and permanent ones are <em>not</em>. Retrying a card decline eleven times is a real bug — it wastes time, may trip fraud detection, and delays the user's error message. That test is the one that catches a misconfigured <code>retryOn</code> list.</p>
<p><strong>Why testing resilience configuration matters:</strong> circuit breakers, retries and timeouts are usually configured in YAML and never exercised until a real outage — at which point you discover the timeout was never applied or the breaker threshold was unreachable. A configuration you have never seen fire is a guess.</p>
<p>For the whole-system version, mention <strong>chaos testing</strong> — deliberately injecting latency and failures (Chaos Monkey, Litmus, or a Toxiproxy sidecar) against a staging environment to verify the behaviour end to end rather than per unit.</p>`
},
{
  q: "What is snapshot testing and approval testing?",
  level: "advanced", tags: ["techniques"],
  a: `<p><strong>Approval (golden master) testing</strong> compares output against a previously approved file rather than hand-written assertions. It shines where the expected output is large or tedious to assert field by field.</p>
<pre><code>@Test
void generatesInvoicePdfContent() {
    String rendered = invoiceRenderer.renderText(sampleInvoice());
    Approvals.verify(rendered);          // compares against InvoiceTest.approved.txt
    // First run: writes a .received.txt and FAILS.
    // You inspect it, and if correct, rename it to .approved.txt and commit it.
}

// JSON contract snapshot
@Test
void orderResponseShapeIsStable() throws Exception {
    String json = mvc.perform(get("/api/v1/orders/1"))
                     .andReturn().getResponse().getContentAsString();
    Approvals.verifyJson(json);          // any field added/removed/renamed fails the test
}</code></pre>
<p><strong>Where it is genuinely valuable:</strong></p>
<ul>
<li><strong>API response contracts</strong> — a snapshot fails the moment a field is renamed or removed, which is exactly the change that silently breaks consumers.</li>
<li><strong>Generated output</strong> — reports, emails, CSV exports, SQL produced by a query builder.</li>
<li><strong>Characterisation tests on legacy code</strong> — capture current behaviour before refactoring, without needing to understand it first. This is arguably its best use.</li>
</ul>
<p><strong>The dangers, which must be stated:</strong></p>
<ul>
<li><strong>Blind approval.</strong> If the workflow is "test failed, run <code>--update-snapshots</code>, commit", the test verifies nothing. The approval step must be a genuine human review, and the diff must appear in the pull request.</li>
<li><strong>Non-determinism</strong> — timestamps, UUIDs, map ordering and locale-dependent formatting make snapshots flaky. Scrub them: inject a fixed <code>Clock</code>, use deterministic IDs, and normalise before comparing.</li>
<li><strong>Over-broad snapshots</strong> — snapshotting a whole page means every unrelated change fails the test, and people stop reading the diffs.</li>
</ul>
<p><strong>The balanced position:</strong> "I use it for contract shape and for pinning legacy behaviour before a refactor. I would not use it as a substitute for explicit assertions about business rules — a snapshot tells you something changed, not whether the result is <em>correct</em>."</p>`
},
{
  q: "How do you test observability — logs, metrics and traces?",
  level: "advanced", tags: ["observability", "production"],
  a: `<p>Observability code is production code, and it fails silently — a metric with the wrong tag or a log missing its correlation ID is only discovered during an incident, which is the worst possible time.</p>
<pre><code>// Metrics — assert the meter exists with the right name and tags
@Test
void recordsOrderPlacedMetric() {
    var registry = new SimpleMeterRegistry();
    var service = new OrderService(registry, repo);

    service.place(orderFor("web", "INR"));

    assertThat(registry.get("orders.placed")
                       .tags("channel", "web", "currency", "INR")
                       .counter().count()).isEqualTo(1.0);
}

@Test
void doesNotUseUnboundedTagValues() {          // guards against cardinality explosion
    service.place(order);
    var tags = registry.get("orders.placed").counter().getId().getTags();
    assertThat(tags).noneMatch(t -&gt; t.getKey().equals("orderId"));   // NEVER tag by id
}</code></pre>
<pre><code>// Logs — capture with a list appender and assert on structure, not prose
@Test
void logsFailureWithCorrelationId() {
    var appender = new ListAppender&lt;ILoggingEvent&gt;();
    ((Logger) LoggerFactory.getLogger(OrderService.class)).addAppender(appender);
    appender.start();

    MDC.put("traceId", "b7d3f1");
    assertThatThrownBy(() -&gt; service.place(invalid));

    assertThat(appender.list)
            .anySatisfy(e -&gt; {
                assertThat(e.getLevel()).isEqualTo(Level.ERROR);
                assertThat(e.getMDCPropertyMap()).containsEntry("traceId", "b7d3f1");
            });
}

// And the negative test that actually matters
@Test
void neverLogsTheCardNumber() {
    service.pay(paymentWith("4111111111111111"));
    assertThat(appender.list).noneMatch(e -&gt; e.getFormattedMessage().contains("4111"));
}</code></pre>
<p><strong>What is worth testing, and why:</strong> metric names and tags (a renamed metric silently breaks every dashboard and alert); tag cardinality (an unbounded tag value can take down Prometheus, not just degrade it); correlation IDs propagating into the MDC and into downstream calls; and — the one people never write — that secrets and PII are <em>not</em> logged.</p>
<p><strong>The framing:</strong> "Dashboards and alerts are consumers of an interface my code publishes. If I would not rename a public API field without a test failing, I should not be able to rename a metric silently either."</p>`
}
]);
