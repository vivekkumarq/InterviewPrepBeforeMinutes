registerTopic("testing", [
{
  q: "What is the testing pyramid and why does it matter?",
  level: "beginner", hot: true, tags: ["strategy"],
  a: `<figure class="fig">
<svg viewBox="0 0 480 190" role="img" aria-label="Testing pyramid">
  <polygon points="240,10 300,60 180,60" class="dg-fill2"/>
  <text class="dg-s" x="240" y="45" text-anchor="middle">E2E</text>
  <polygon points="180,64 300,64 340,116 140,116" class="dg-fill"/>
  <text class="dg-s" x="240" y="96" text-anchor="middle">Integration / service tests</text>
  <polygon points="140,120 340,120 390,176 90,176" class="dg-fill"/>
  <text class="dg-s" x="240" y="153" text-anchor="middle">Unit tests</text>
  <text class="dg-s" x="424" y="40" text-anchor="middle">few</text>
  <text class="dg-s" x="424" y="96" text-anchor="middle">some</text>
  <text class="dg-s" x="424" y="153" text-anchor="middle">many</text>
  <text class="dg-s" x="52" y="40" text-anchor="middle">slow</text>
  <text class="dg-s" x="52" y="153" text-anchor="middle">fast</text>
</svg>
<figcaption>Cost, speed and brittleness all increase as you go up.</figcaption>
</figure>
<ul>
<li><strong>Unit tests</strong> — one class or method in isolation. Milliseconds, deterministic, pinpoint failures. Should be the majority.</li>
<li><strong>Integration tests</strong> — several components together, with a real database or broker. Seconds. Catch wiring, mapping and query bugs that unit tests cannot.</li>
<li><strong>End-to-end tests</strong> — the whole system through the UI or API. Minutes, flaky, expensive to maintain. Keep to critical user journeys only.</li>
</ul>
<p><strong>The anti-pattern is the "ice cream cone"</strong> — few unit tests, many slow end-to-end tests. Symptoms: a 45-minute pipeline, flaky failures people re-run rather than investigate, and a failure message that tells you something is broken but not what.</p>
<p><strong>The point to make:</strong> the pyramid is about <em>feedback speed and diagnostic precision</em>, not dogma about ratios. A test that fails in 50 ms and names the broken method is worth ten that fail in five minutes and say "checkout did not work".</p>`
},
{
  q: "What are the main JUnit 5 annotations and how does it differ from JUnit 4?",
  level: "beginner", hot: true, tags: ["junit"],
  a: `<pre><code>class OrderServiceTest {

    @BeforeAll  static void initAll()  { }      // once per class (must be static)
    @BeforeEach void setUp()           { }      // before every test
    @AfterEach  void tearDown()        { }
    @AfterAll   static void cleanUp()  { }

    @Test
    @DisplayName("rejects an order when stock is insufficient")
    void rejectsWhenOutOfStock() { }

    @ParameterizedTest
    @ValueSource(ints = { -1, 0 })
    void rejectsNonPositiveQuantity(int qty) { }

    @ParameterizedTest
    @CsvSource({ "100, 0.10, 90", "200, 0.25, 150" })
    void appliesDiscount(BigDecimal total, BigDecimal rate, BigDecimal expected) { }

    @ParameterizedTest @MethodSource("invalidOrders")
    void rejectsInvalid(Order o) { }
    static Stream&lt;Order&gt; invalidOrders() { return Stream.of(...); }

    @RepeatedTest(5) void isStable() { }
    @Disabled("flaky — see JIRA-421") void skipped() { }
    @Nested class WhenCustomerIsNew { @Test void appliesWelcomeDiscount() { } }
    @Tag("slow") void heavy() { }
    @Timeout(2) void mustBeFast() { }
}</code></pre>
<table>
<tr><th>JUnit 4</th><th>JUnit 5</th></tr>
<tr><td><code>@Before</code> / <code>@After</code></td><td><code>@BeforeEach</code> / <code>@AfterEach</code></td></tr>
<tr><td><code>@BeforeClass</code> / <code>@AfterClass</code></td><td><code>@BeforeAll</code> / <code>@AfterAll</code></td></tr>
<tr><td><code>@Ignore</code></td><td><code>@Disabled</code></td></tr>
<tr><td><code>@RunWith</code>, one runner only</td><td><code>@ExtendWith</code>, multiple extensions</td></tr>
<tr><td><code>@Test(expected = X.class)</code></td><td><code>assertThrows(X.class, () -&gt; ...)</code></td></tr>
<tr><td>Public test classes/methods required</td><td>Package-private is fine</td></tr>
</table>
<p>JUnit 5 is modular — Platform (the engine), Jupiter (the new API), Vintage (runs JUnit 4 tests) — which is how you migrate incrementally. Highlight <code>@ParameterizedTest</code> and <code>@Nested</code>: they are the features that most improve real test suites.</p>`
},
{
  q: "How do you use Mockito effectively?",
  level: "beginner", hot: true, tags: ["mockito"],
  a: `<pre><code>@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock  OrderRepository repo;
    @Mock  PaymentClient payment;
    @Spy   PricingCalculator calculator = new PricingCalculator();   // real object, partial stub
    @InjectMocks OrderService service;                                // constructor-injected

    @Captor ArgumentCaptor&lt;Order&gt; orderCaptor;

    @Test
    void savesOrderWithCalculatedTotal() {
        given(payment.charge(any())).willReturn(Receipt.ok("r-1"));
        given(repo.save(any(Order.class))).willAnswer(inv -&gt; inv.getArgument(0));

        service.place(new CreateOrderRequest("c-1", List.of(item)));

        then(repo).should().save(orderCaptor.capture());          // verify + capture
        assertThat(orderCaptor.getValue().total()).isEqualByComparingTo("199.00");
        then(payment).should(times(1)).charge(any());
        then(payment).shouldHaveNoMoreInteractions();
    }

    @Test
    void propagatesPaymentFailure() {
        given(payment.charge(any())).willThrow(new PaymentDeclinedException("insufficient"));

        assertThatThrownBy(() -&gt; service.place(request))
            .isInstanceOf(OrderFailedException.class)
            .hasCauseInstanceOf(PaymentDeclinedException.class);

        then(repo).should(never()).save(any());                   // nothing was persisted
    }
}</code></pre>
<p><strong>Points that show maturity:</strong></p>
<ul>
<li><strong>Mock only what you own and what is slow or non-deterministic</strong> — external clients, time, randomness. Do not mock value objects or the class under test.</li>
<li><strong>Prefer <code>@Mock</code> + constructor over <code>@InjectMocks</code></strong>; <code>@InjectMocks</code> fails silently when a dependency cannot be injected, leaving a confusing NPE.</li>
<li><strong>Never mock what you do not own</strong> without wrapping it — mocking a third-party library encodes your <em>assumptions</em> about it, which tests nothing when the library behaves differently.</li>
<li><strong>Over-mocking is a design smell.</strong> If a test needs eight mocks, the class has eight dependencies and should be split.</li>
<li>Static methods need <code>mockStatic</code> (mockito-inline) — but needing it usually means the static call should have been injected instead.</li>
</ul>`
},
{
  q: "What are the Spring Boot test slices and when do you use each?",
  level: "advanced", hot: true, tags: ["spring", "integration"],
  a: `<table>
<tr><th>Annotation</th><th>Loads</th><th>Use for</th></tr>
<tr><td>None (plain JUnit)</td><td>Nothing</td><td>Business logic — fastest, should be most of your tests</td></tr>
<tr><td><code>@WebMvcTest</code></td><td>Controllers, filters, converters, <code>@ControllerAdvice</code></td><td>Request mapping, validation, serialisation, status codes</td></tr>
<tr><td><code>@DataJpaTest</code></td><td>JPA, repositories, an embedded DB; rolls back each test</td><td>Queries, mappings, constraints</td></tr>
<tr><td><code>@JsonTest</code></td><td>Jackson only</td><td>Serialisation contracts</td></tr>
<tr><td><code>@RestClientTest</code></td><td>RestTemplate/WebClient + MockRestServiceServer</td><td>Outbound HTTP clients</td></tr>
<tr><td><code>@DataRedisTest</code>, <code>@JdbcTest</code>, <code>@GraphQlTest</code></td><td>The matching slice</td><td>As named</td></tr>
<tr><td><code>@SpringBootTest</code></td><td>The whole context</td><td>End-to-end integration — use sparingly</td></tr>
</table>
<pre><code>@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;          // @MockBean before Boot 3.4

    @Test void returns400OnInvalidBody() throws Exception {
        mvc.perform(post("/api/v1/orders").contentType(APPLICATION_JSON).content("{}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errors").isArray());
    }
}

@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)     // use the real DB (Testcontainers), not H2
class OrderRepositoryTest {
    @Autowired OrderRepository repo;
    @Autowired TestEntityManager em;
}</code></pre>
<p><strong>The performance point that matters in a real codebase:</strong> Spring <em>caches</em> the application context and reuses it across test classes with identical configuration. Every distinct combination of annotations, properties and mocked beans creates a <em>new</em> context — so carelessly varying <code>@TestPropertySource</code> or adding one extra <code>@MockitoBean</code> per class can multiply your build time. Standardise your test configuration and you can cut a suite's runtime dramatically.</p>
<p>Also: replace H2 with Testcontainers PostgreSQL. H2 accepts SQL PostgreSQL rejects and behaves differently on locking, types and JSON — tests that pass on H2 and fail in production are worse than no tests.</p>`
},
{
  q: "What is Testcontainers and why use it over an in-memory database?",
  level: "advanced", hot: true, tags: ["integration", "testcontainers"],
  a: `<p>Testcontainers starts real dependencies in Docker containers for the duration of your tests — the actual PostgreSQL, Kafka, Redis or Elasticsearch you run in production.</p>
<pre><code>@SpringBootTest
@Testcontainers
class OrderIntegrationTest {

    @Container
    static PostgreSQLContainer&lt;?&gt; postgres =
        new PostgreSQLContainer&lt;&gt;("postgres:16-alpine")
            .withReuse(true);                     // reuse across runs — big speedup locally

    @Container
    static KafkaContainer kafka =
        new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
        r.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }
}

// Spring Boot 3.1+: even simpler with @ServiceConnection — no @DynamicPropertySource needed
@Container @ServiceConnection
static PostgreSQLContainer&lt;?&gt; postgres = new PostgreSQLContainer&lt;&gt;("postgres:16-alpine");</code></pre>
<p><strong>Why it beats H2:</strong> H2's PostgreSQL compatibility mode is an approximation. It differs on JSONB, arrays, window function edge cases, <code>ON CONFLICT</code>, locking semantics, sequence behaviour, and type coercion. Every difference is a bug that passes CI and fails in production — the worst possible failure mode. Testing against the real engine also lets you test migrations, native queries and database-specific features.</p>
<p><strong>Practical notes:</strong> use <code>static</code> containers so one instance is shared across the class (a per-test container is very slow); enable reuse locally; the same image tag as production; and note the cost — Docker must be available in CI, and startup adds seconds, so keep these tests fewer than your unit tests. Singleton container patterns and <code>@ServiceConnection</code> make this manageable at scale.</p>`
},
{
  q: "What makes a good unit test?",
  level: "beginner", hot: true, tags: ["quality"],
  a: `<p><strong>FIRST principles:</strong></p>
<ul>
<li><strong>Fast</strong> — milliseconds. Slow tests get skipped.</li>
<li><strong>Isolated / Independent</strong> — no shared state, any order, no dependence on another test having run.</li>
<li><strong>Repeatable</strong> — same result every time, on any machine. No real time, randomness, network or file system.</li>
<li><strong>Self-validating</strong> — passes or fails automatically; no reading log output to decide.</li>
<li><strong>Timely</strong> — written with (or before) the code.</li>
</ul>
<p><strong>Structure: Arrange-Act-Assert</strong>, with a name that states the behaviour:</p>
<pre><code>@Test
void rejectsOrderWhenStockIsInsufficient() {
    // Arrange
    given(inventory.available("SKU-1")).willReturn(2);
    var request = new CreateOrderRequest("c-1", List.of(new Item("SKU-1", 5)));

    // Act
    var thrown = catchThrowable(() -&gt; service.place(request));

    // Assert — ONE logical assertion about ONE behaviour
    assertThat(thrown).isInstanceOf(InsufficientStockException.class)
                      .hasMessageContaining("SKU-1");
}</code></pre>
<p><strong>The most important rule:</strong> <strong>test behaviour, not implementation.</strong> A test that verifies "the service called <code>repository.save()</code> exactly once with these three fields" breaks every time you refactor, even though nothing is actually wrong. A test that verifies "after placing an order, it can be retrieved with status PENDING" survives refactoring and still catches real bugs. Brittle tests are worse than no tests, because they train the team to distrust the suite.</p>
<p>Also: name tests as sentences (<code>rejectsOrderWhenStockIsInsufficient</code>, not <code>test1</code>) so a CI failure report reads like documentation of what broke.</p>`
},
{
  q: "What is TDD and would you actually use it?",
  level: "advanced", tags: ["process"],
  a: `<p><strong>Red-Green-Refactor:</strong> write a failing test → write the minimum code to pass → refactor with the test as a safety net. Repeat in small cycles.</p>
<p><strong>What TDD genuinely gives you:</strong></p>
<ul>
<li><strong>Better design pressure.</strong> Code that is hard to test is usually badly coupled — TDD surfaces that before you have written 500 lines.</li>
<li><strong>You actually write the tests.</strong> Tests deferred to "after" are frequently never written.</li>
<li><strong>Confidence to refactor</strong>, which is what keeps a codebase healthy over years.</li>
<li><strong>Clear requirements</strong> — you cannot write the test without deciding what the behaviour is.</li>
</ul>
<p><strong>An honest answer about where it fits:</strong></p>
<ul>
<li><strong>Excellent for:</strong> algorithmic and business-rule code with clear inputs and outputs — pricing, validation, state machines, parsers. Also outstanding for <em>bug fixing</em>: write the failing test that reproduces the bug first, and you both prove the fix and prevent regression.</li>
<li><strong>Awkward for:</strong> exploratory work where you do not yet know the design, UI layout, and thin integration glue where the test would just restate the framework.</li>
</ul>
<blockquote><p><strong>How I would answer:</strong> "I use TDD selectively rather than religiously — always for bug fixes and complex domain logic, less so for exploratory or integration code, where I write the tests immediately after but not before. What I insist on is that the code is tested and the tests are meaningful; the order is a tool, not an ideology."</p></blockquote>
<p>That answer is more credible than claiming 100% TDD, which few teams actually practise.</p>`
},
{
  q: "How do you test asynchronous and time-dependent code?",
  level: "advanced", hot: true, tags: ["async", "quality"],
  a: `<p><strong>Never use <code>Thread.sleep()</code> in a test.</strong> It makes the suite slow and flaky — too short and it fails randomly, too long and the build crawls.</p>
<pre><code>// Awaitility — poll until a condition holds, with a timeout
await().atMost(5, SECONDS)
       .pollInterval(100, MILLISECONDS)
       .untilAsserted(() -&gt; assertThat(repo.findByRef("r-1")).isPresent());

// Kafka consumer test
kafkaTemplate.send("orders", event);
await().atMost(10, SECONDS)
       .until(() -&gt; processedRepo.existsById(event.id()));

// CompletableFuture — assert on the future, do not block indefinitely
assertThat(service.fetchAsync(id))
    .succeedsWithin(Duration.ofSeconds(2))
    .satisfies(c -&gt; assertThat(c.name()).isEqualTo("Vivek"));</code></pre>
<p><strong>For time-dependent logic, inject the clock.</strong> This is the key design decision — code calling <code>Instant.now()</code> directly is untestable:</p>
<pre><code>@Service
class TokenService {
    private final Clock clock;                              // injected

    boolean isExpired(Token t) { return Instant.now(clock).isAfter(t.expiresAt()); }
}

@Bean Clock clock() { return Clock.systemUTC(); }

// In the test — time is now deterministic and controllable
var fixed = Clock.fixed(Instant.parse("2026-09-06T10:00:00Z"), ZoneOffset.UTC);
var service = new TokenService(fixed);</code></pre>
<p><strong>Other techniques:</strong> for scheduled jobs, test the <em>method</em> directly rather than waiting for the scheduler; for concurrency, use <code>CountDownLatch</code> to coordinate deterministically; and treat any flaky test as a bug to fix or delete, never to re-run — a suite people re-run on failure has stopped being a safety net.</p>`
},
{
  q: "What is code coverage and is it a useful metric?",
  level: "beginner", tags: ["metrics", "quality"],
  a: `<p>Coverage measures which lines/branches executed during tests. JaCoCo is the standard for Java.</p>
<pre><code>&lt;plugin&gt;
  &lt;groupId&gt;org.jacoco&lt;/groupId&gt;&lt;artifactId&gt;jacoco-maven-plugin&lt;/artifactId&gt;
  &lt;executions&gt;
    &lt;execution&gt;&lt;goals&gt;&lt;goal&gt;prepare-agent&lt;/goal&gt;&lt;/goals&gt;&lt;/execution&gt;
    &lt;execution&gt;&lt;id&gt;check&lt;/id&gt;&lt;phase&gt;verify&lt;/phase&gt;
      &lt;goals&gt;&lt;goal&gt;check&lt;/goal&gt;&lt;/goals&gt;
      &lt;configuration&gt;&lt;rules&gt;&lt;rule&gt;&lt;limits&gt;&lt;limit&gt;
        &lt;counter&gt;BRANCH&lt;/counter&gt;&lt;minimum&gt;0.70&lt;/minimum&gt;
      &lt;/limit&gt;&lt;/limits&gt;&lt;/rule&gt;&lt;/rules&gt;&lt;/configuration&gt;
    &lt;/execution&gt;
  &lt;/executions&gt;
&lt;/plugin&gt;</code></pre>
<p><strong>The honest assessment — and the answer interviewers want:</strong></p>
<ul>
<li>Coverage tells you what is <strong>definitely untested</strong>. That is genuinely useful: 20% coverage is a real problem.</li>
<li>It does <strong>not</strong> tell you the tested code is <em>correct</em>. A test with no assertions gives 100% coverage and verifies nothing.</li>
<li><strong>Goodhart's law applies:</strong> once coverage becomes a target, people write meaningless tests for getters to hit the number. The metric goes up and quality does not.</li>
</ul>
<p><strong>What I would actually do:</strong> track <strong>branch</strong> coverage rather than line coverage (it catches untested conditions), set a floor rather than a target (say 70–80%), enforce that coverage must not <em>decrease</em> on a pull request, focus coverage on business logic rather than DTOs and configuration, and use <strong>mutation testing</strong> (PIT) occasionally — it deliberately introduces bugs and checks whether any test fails, which measures test <em>quality</em> rather than mere execution.</p>`
},
{
  q: "What are contract tests and why do they matter in microservices?",
  level: "advanced", hot: true, tags: ["microservices", "contracts"],
  a: `<p><strong>The problem:</strong> a provider service changes a field name; every test in the provider's repository still passes; the consumer breaks in production. End-to-end tests would catch it, but they are slow, flaky and require every service running.</p>
<p><strong>Consumer-driven contract testing</strong> solves this: the consumer declares what it expects, and the provider's CI verifies it can satisfy every consumer's expectations — <em>before</em> merging.</p>
<pre><code>// Spring Cloud Contract — the contract, written by/with the consumer
Contract.make {
    request {
        method 'GET'
        url '/api/v1/orders/42'
        headers { header('Authorization', anyNonBlankString()) }
    }
    response {
        status 200
        body([ id: 42, status: 'PAID', total: 199.00 ])
        headers { contentType(applicationJson()) }
    }
}</code></pre>
<p><strong>What happens then:</strong></p>
<ul>
<li>The <strong>provider</strong> gets auto-generated tests from the contract; if a change breaks it, the provider's build fails immediately with a clear message.</li>
<li>The <strong>consumer</strong> gets a generated stub (WireMock) that behaves exactly like the contract, so its tests run fast and offline but against a verified shape.</li>
</ul>
<p><strong>Why this is the highest-leverage test type in microservices:</strong> it gives you most of the confidence of end-to-end testing at unit-test speed, without needing a full environment. It turns "will this break someone?" from a hope into a build failure, and it lets teams deploy independently — which is the entire point of microservices.</p>
<p>Tools: Spring Cloud Contract (JVM-centric, generates both sides) and Pact (polyglot, with a broker that tracks which consumer versions are compatible with which provider versions — the "can-i-deploy" check).</p>`
},
{
  q: "How do you test a Kafka consumer and producer?",
  level: "advanced", tags: ["kafka", "integration"],
  a: `<pre><code>// 1. Unit — test the handler directly, no Kafka at all. Do this most.
@Test void marksOrderPaid() {
    handler.handle(new PaymentCompletedEvent("o-1", ...));
    then(orderService).should().markPaid("o-1");
}

// 2. Embedded Kafka — fast, no Docker
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = { "orders" })
class OrderListenerTest {
    @Autowired KafkaTemplate&lt;String, OrderEvent&gt; template;
    @Autowired OrderRepository repo;

    @Test void consumesAndPersists() {
        template.send("orders", "o-1", new OrderEvent("o-1", PAID));

        await().atMost(10, SECONDS)
               .untilAsserted(() -&gt; assertThat(repo.findById("o-1"))
                   .get().extracting(Order::status).isEqualTo(PAID));
    }
}

// 3. Testcontainers Kafka — the real broker, closest to production
@Container static KafkaContainer kafka =
    new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

// 4. Testing the PRODUCER — consume from the topic and assert
@Test void publishesOrderPlaced() {
    var consumer = createTestConsumer("orders");
    service.place(request);
    ConsumerRecord&lt;String, OrderEvent&gt; rec = KafkaTestUtils.getSingleRecord(consumer, "orders");
    assertThat(rec.key()).isEqualTo("o-1");
    assertThat(rec.value().status()).isEqualTo(PLACED);
}</code></pre>
<p><strong>What to test beyond the happy path</strong> — this is what distinguishes the answer:</p>
<ul>
<li><strong>Idempotency</strong> — send the same event twice and assert the effect happened once. This is the most important test for any consumer.</li>
<li><strong>Poison message handling</strong> — send malformed JSON and assert it lands in the DLT rather than looping forever.</li>
<li><strong>Retry behaviour</strong> — a transient failure is retried, a permanent one is not.</li>
<li><strong>Serialisation compatibility</strong> — an event with an extra unknown field still deserialises (tolerant reader).</li>
</ul>
<p>Always use <code>Awaitility</code> rather than sleeping, and be aware that embedded Kafka is faster but less faithful than Testcontainers — I would use embedded for most tests and Testcontainers for the critical paths.</p>`
},
{
  q: "What is the difference between a mock, a stub, a spy, a fake and a dummy?",
  level: "advanced", tags: ["mockito", "terminology"],
  a: `<table>
<tr><th>Type</th><th>Purpose</th><th>Example</th></tr>
<tr><td><strong>Dummy</strong></td><td>Fills a parameter slot; never actually used</td><td><code>null</code> or an empty object passed to satisfy a signature</td></tr>
<tr><td><strong>Stub</strong></td><td>Returns canned answers to calls made during the test</td><td><code>given(repo.findById(1)).willReturn(order)</code></td></tr>
<tr><td><strong>Spy</strong></td><td>A real object that records how it was called; can partially stub</td><td><code>@Spy</code> on a real calculator, verifying it was invoked</td></tr>
<tr><td><strong>Mock</strong></td><td>Pre-programmed with expectations; <em>verification</em> is the point</td><td><code>then(payment).should().charge(any())</code></td></tr>
<tr><td><strong>Fake</strong></td><td>A working lightweight implementation</td><td>An in-memory <code>Map</code>-backed repository</td></tr>
</table>
<p>Mockito blurs the terminology — everything is a "mock" — but the distinction that matters in practice is <strong>state verification vs behaviour verification</strong>:</p>
<ul>
<li>A <strong>stub</strong> supports asserting on the <em>result</em> (state). This is usually what you want.</li>
<li>A <strong>mock</strong> supports asserting on the <em>interaction</em> (behaviour). Necessary when there is no observable result — verifying an email was sent, or that a repository was <em>not</em> called after a validation failure.</li>
</ul>
<p><strong>The judgement to express:</strong> prefer state verification, because interaction verification couples the test to the implementation. Verify interactions only when the interaction <em>is</em> the requirement. And consider <strong>fakes</strong> for repositories — an in-memory implementation often makes tests both faster and far more readable than fifteen lines of <code>given(...)</code> stubbing, and it exercises real logic rather than your assumptions about it.</p>`
},
{
  q: "How do you test security — authentication and authorization?",
  level: "advanced", tags: ["security", "spring"],
  a: `<pre><code>@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)                    // slices exclude your security config by default
class OrderControllerSecurityTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test
    void rejectsAnonymous() throws Exception {
        mvc.perform(get("/api/v1/orders/1")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void forbidsUserFromAdminEndpoint() throws Exception {
        mvc.perform(delete("/api/v1/admin/orders/1")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void allowsAdmin() throws Exception {
        mvc.perform(delete("/api/v1/admin/orders/1")).andExpect(status().isNoContent());
    }

    @Test
    void rejectsAnotherUsersOrder() throws Exception {          // the IDOR test
        mvc.perform(get("/api/v1/orders/99")
                .with(jwt().jwt(j -&gt; j.claim("sub", "user-b"))))
           .andExpect(status().isNotFound());                    // 404, not 403 — do not leak existence
    }

    @Test
    void rejectsWriteWithoutCsrf() throws Exception {
        mvc.perform(post("/api/v1/orders").with(user("u")))      // no .with(csrf())
           .andExpect(status().isForbidden());
    }
}</code></pre>
<p><strong>What to cover, and the one people forget:</strong> unauthenticated access returns 401; wrong role returns 403; and <strong>ownership</strong> — an authenticated user cannot read or modify another user's resource. That last one is broken object-level authorization, the number one item in the OWASP API Top 10, and it is exactly the test that gets skipped because the endpoint "works".</p>
<p>Also test method-level security (<code>@WithMockUser</code> on service tests), token expiry and invalid signature handling, and add automated dependency and container scanning to CI so known CVEs fail the build.</p>`
}
]);
