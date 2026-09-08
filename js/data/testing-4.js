appendTopic("testing", [
{
  q: "What is the testing pyramid and where do most teams get it wrong?",
  level: "beginner", hot: true, tags: ["strategy", "basics"],
  companies: ["Amazon", "TCS", "Infosys", "ThoughtWorks", "Optum", "Accenture"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 190" role="img" aria-label="Testing pyramid with unit, integration and end to end layers">
  <polygon class="dg-box" points="200,20 320,20 400,150 120,150"/>
  <line class="dg-line" x1="152" y1="80" x2="368" y2="80"/>
  <line class="dg-line" x1="176" y1="118" x2="344" y2="118"/>
  <text class="dg-s" x="260" y="52" text-anchor="middle">E2E — few</text>
  <text class="dg-s" x="260" y="104" text-anchor="middle">Integration</text>
  <text class="dg-s" x="260" y="140" text-anchor="middle">Unit — many</text>
  <text class="dg-s" x="430" y="46">slow, brittle, high confidence</text>
  <text class="dg-s" x="430" y="104">real DB / HTTP, moderate speed</text>
  <text class="dg-s" x="430" y="140">milliseconds, precise failures</text>
</svg>
</figure>
<table>
<tr><th>Layer</th><th>Scope</th><th>Speed</th><th>Tools</th></tr>
<tr><td><strong>Unit</strong></td><td>One class, dependencies mocked</td><td>&lt; 10 ms</td><td>JUnit 5, Mockito, AssertJ</td></tr>
<tr><td><strong>Integration</strong></td><td>Several components + a real DB or broker</td><td>0.1–2 s</td><td><code>@SpringBootTest</code>, Testcontainers</td></tr>
<tr><td><strong>Contract</strong></td><td>Producer/consumer API agreement</td><td>Fast</td><td>Pact, Spring Cloud Contract</td></tr>
<tr><td><strong>E2E</strong></td><td>Whole system through the UI or public API</td><td>10 s – minutes</td><td>Playwright, Cypress, RestAssured</td></tr>
</table>
<p><strong>The two anti-patterns to name</strong> — this is what separates a real answer from a textbook one:</p>
<ul>
<li><strong>The ice-cream cone</strong> — mostly E2E tests, few unit tests. Every failure takes an hour to diagnose because any of forty things could have caused it, and the suite is so flaky people re-run it until it passes.</li>
<li><strong>The hourglass</strong> — many unit tests, many E2E tests, nothing in between. Every unit is individually correct and the system still does not work, because the wiring is untested.</li>
</ul>
<p><strong>The nuance worth adding:</strong> the pyramid is about <em>cost and feedback speed</em>, not a quota. Modern tooling changed the economics — Testcontainers makes an integration test against a real PostgreSQL take two seconds, so the middle layer is much cheaper than when the pyramid was drawn. Many teams now run a "testing trophy" with integration tests as the widest layer, because that is where the bugs actually are.</p>
<pre><code>// The rule I apply to each test: what would break it?
// If a REFACTOR breaks it, it is testing implementation -> low value, high maintenance.
// If a BEHAVIOUR CHANGE breaks it, it is testing behaviour   -> that is the one to keep.</code></pre>`
},
{
  q: "How do you write a Spring Boot integration test with Testcontainers?",
  level: "advanced", hot: true, tags: ["spring", "integration"],
  companies: ["Amazon", "Optum", "SAP", "EPAM", "Maersk", "Publicis Sapient"],
  a: `<pre><code>@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@AutoConfigureMockMvc
class OrderApiIT {

    @Container   // static = ONE container for the whole class, not per test
    static PostgreSQLContainer&lt;?&gt; db =
        new PostgreSQLContainer&lt;&gt;("postgres:16-alpine")
            .withReuse(true);                 // reuses across runs locally

    @Container
    static KafkaContainer kafka =
        new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

    @DynamicPropertySource                    // wires the random ports into Spring
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",      db::getJdbcUrl);
        r.add("spring.datasource.username", db::getUsername);
        r.add("spring.datasource.password", db::getPassword);
        r.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired MockMvc mvc;
    @Autowired OrderRepository repo;

    @Test
    void createsOrderAndPersistsIt() throws Exception {
        mvc.perform(post("/api/orders")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"customerId":42,"items":[{"sku":"A1","qty":2}]}
                    """))
           .andExpect(status().isCreated())
           .andExpect(header().exists("Location"))
           .andExpect(jsonPath("$.status").value("PENDING"));

        assertThat(repo.findAll()).hasSize(1);
    }
}</code></pre>
<p><strong>Why Testcontainers rather than H2</strong> — the strongest single argument in this answer: H2 is a <em>different database</em>. It does not have PostgreSQL's JSONB, window function details, <code>ON CONFLICT</code> semantics, array types, or its locking behaviour. Tests pass against H2 and the same code fails in production. Testcontainers runs the exact image and version production runs, so the test is meaningful.</p>
<table>
<tr><th>Annotation</th><th>Loads</th><th>Use for</th></tr>
<tr><td><code>@SpringBootTest</code></td><td>The whole context</td><td>Full integration — slowest</td></tr>
<tr><td><code>@DataJpaTest</code></td><td>JPA layer only + a test DB</td><td>Repository and query tests</td></tr>
<tr><td><code>@WebMvcTest(X.class)</code></td><td>One controller + MVC infrastructure</td><td>Validation, status codes, JSON shape</td></tr>
<tr><td><code>@RestClientTest</code></td><td><code>RestTemplate</code>/<code>WebClient</code> only</td><td>Outbound HTTP clients</td></tr>
</table>
<p><strong>Performance points to volunteer:</strong> use a <code>static</code> container so it starts once per class; keep the number of distinct context configurations small, because Spring caches contexts by configuration and every unique combination costs another startup; and prefer <code>@Transactional</code> rollback or explicit truncation over recreating the schema between tests.</p>
<pre><code>// Anti-pattern: this creates a NEW application context and defeats the cache
@SpringBootTest
@TestPropertySource(properties = "some.flag=true")   // unique config -> new context
// Prefer a shared profile or a @MockitoBean, so the cached context is reused.</code></pre>`
},
{
  q: "When should you mock, and what are the alternatives?",
  level: "advanced", tags: ["mockito", "design"],
  companies: ["Amazon", "ThoughtWorks", "Optum", "SAP", "Infosys", "Nagarro"],
  a: `<table>
<tr><th>Mock it</th><th>Do NOT mock it</th></tr>
<tr><td>External HTTP services</td><td>The class under test</td></tr>
<tr><td>Message brokers in a unit test</td><td>Value objects and DTOs — just construct them</td></tr>
<tr><td>Slow or non-deterministic things (clock, random, UUID)</td><td>The database — use Testcontainers</td></tr>
<tr><td>Failure paths you cannot otherwise trigger</td><td>Types you do not own (mock a thin wrapper instead)</td></tr>
<tr><td>Things that cost money or send email</td><td>Everything, in an integration test</td></tr>
</table>
<pre><code>// State-based (preferred): assert the OUTCOME
@Test void appliesLoyaltyDiscount() {
    var pricing = new PricingService(new FixedRateProvider(0.10));  // a fake, not a mock
    var total   = pricing.total(order, GOLD);
    assertThat(total).isEqualTo(Money.of(900));                     // behaviour
}

// Interaction-based: only when the interaction IS the requirement
@Test void publishesEventOnConfirmation() {
    orderService.confirm(42L);
    verify(events).publish(argThat(e -&gt; e.orderId() == 42L));       // the side effect IS the point
}

// Over-mocking — the test that proves nothing
@Test void bad() {
    when(repo.findById(1L)).thenReturn(Optional.of(order));
    when(mapper.toDto(order)).thenReturn(dto);
    assertThat(service.get(1L)).isEqualTo(dto);
    // This asserts that the code calls the methods you told it to call.
    // Rewrite the implementation identically in behaviour and it fails.
}</code></pre>
<p><strong>The alternatives to reach for first:</strong></p>
<ul>
<li><strong>Fakes</strong> — a real working implementation, simplified. An in-memory repository backed by a <code>HashMap</code> is often better than five <code>when(...)</code> lines and survives refactoring.</li>
<li><strong>Stubs</strong> — canned answers, no verification.</li>
<li><strong>WireMock</strong> — a real HTTP server returning canned responses. Tests your serialisation, timeouts and error handling, which a mocked client cannot.</li>
<li><strong>Test doubles you design for</strong> — injecting a <code>Clock</code> or a <code>Supplier&lt;UUID&gt;</code> removes the need to mock static calls entirely.</li>
</ul>
<p><strong>The signal to mention:</strong> "If a test needs five mocks, that is design feedback, not a testing problem — the class has too many collaborators. I usually extract the logic into something pure that needs no mocks at all, and keep the thin coordinating layer covered by an integration test."</p>`
},
{
  q: "What is contract testing and why does it matter in microservices?",
  level: "advanced", tags: ["microservices", "contract"],
  companies: ["Amazon", "Flipkart", "ThoughtWorks", "Maersk", "Optum", "Societe Generale"],
  a: `<p><strong>The problem it solves:</strong> in a system of thirty services, end-to-end tests across all of them are slow, flaky and impossible to keep green. But if each team only tests its own service with mocks, everyone's mocks drift from reality and integration breaks in production.</p>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Consumer driven contract testing flow">
  <rect class="dg-fill" x="16" y="30" width="130" height="48" rx="8"/>
  <text class="dg-s" x="81" y="50" text-anchor="middle">Consumer test</text><text class="dg-s" x="81" y="68" text-anchor="middle">(order-service)</text>
  <path class="dg-line" d="M150 54 H236" marker-end="url(#ct1)"/>
  <text class="dg-s" x="193" y="44" text-anchor="middle">publishes</text>
  <rect class="dg-box" x="240" y="24" width="130" height="60" rx="8"/>
  <text class="dg-s" x="305" y="46" text-anchor="middle">Contract / pact</text><text class="dg-s" x="305" y="64" text-anchor="middle">broker</text>
  <path class="dg-line" d="M374 54 H460" marker-end="url(#ct1)"/>
  <text class="dg-s" x="417" y="44" text-anchor="middle">verifies</text>
  <rect class="dg-fill2" x="464" y="30" width="140" height="48" rx="8"/>
  <text class="dg-s" x="534" y="50" text-anchor="middle">Provider build</text><text class="dg-s" x="534" y="68" text-anchor="middle">(payment-service)</text>
  <text class="dg-s" x="310" y="120" text-anchor="middle">provider build FAILS if a change would break a real consumer —</text>
  <text class="dg-s" x="310" y="138" text-anchor="middle">without ever deploying the two together</text>
  <defs><marker id="ct1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// CONSUMER side (Pact) — describes what it actually needs
@Pact(consumer = "order-service", provider = "payment-service")
public RequestResponsePact chargePact(PactDslWithProvider b) {
    return b.given("customer 42 has a valid card")
        .uponReceiving("a charge request")
            .path("/payments").method("POST")
            .body(newJsonBody(o -&gt; { o.numberType("amount", 100); o.stringType("currency","INR"); }).build())
        .willRespondWith()
            .status(201)
            .body(newJsonBody(o -&gt; { o.stringType("paymentId"); o.stringValue("status","CAPTURED"); }).build())
        .toPact();
}

// PROVIDER side — replays every consumer's contract against the real service
@Provider("payment-service")
@PactBroker(url = "https://pacts.internal")
class PaymentContractTest {
    @State("customer 42 has a valid card")
    void setup() { /* seed the fixture */ }
}</code></pre>
<p><strong>The key property:</strong> contracts are <em>consumer-driven</em> — they encode only the fields consumers actually read. The provider is free to add fields, and free to remove ones nobody uses. Removing one that a consumer depends on fails the provider's build immediately, at the cheapest possible point.</p>
<table>
<tr><th></th><th>E2E tests</th><th>Contract tests</th></tr>
<tr><td>Needs all services running</td><td>Yes</td><td>No — each side runs alone</td></tr>
<tr><td>Runtime</td><td>Minutes to hours</td><td>Seconds</td></tr>
<tr><td>Flakiness</td><td>High</td><td>Low</td></tr>
<tr><td>Catches</td><td>Anything, eventually</td><td>Interface breakage only</td></tr>
</table>
<p><strong>Be honest about the limits:</strong> contract tests verify the <em>shape and semantics of the interface</em>, not business correctness across services. You still want a small end-to-end suite for the two or three critical user journeys. Contract testing lets that suite stay small instead of growing to cover every pair of services.</p>`
}
]);
