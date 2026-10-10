registerSimple("testing", {
"What is AssertJ and why prefer it over JUnit assertions?":
`AssertJ is a library for writing test checks that read like sentences: <code>assertThat(list).hasSize(3).contains("a")</code>. Its biggest benefit is clear failure messages. Instead of JUnit's "expected true but was false", it tells you exactly what was expected and what the list actually contained.`,

"How do you write good test data builders and fixtures?":
`A test data builder creates objects with sensible defaults, so each test sets only the field that matters: <code>anOrder().withStatus(SHIPPED).build()</code>. Readers immediately see what the test is about, and when a new field is added to the class, you update the builder once instead of hundreds of tests.`,

"How do you test exception handling and edge cases properly?":
`Use <code>assertThatThrownBy(() -&gt; ...)</code> or <code>assertThrows</code> to check that the right exception, with the right message, is thrown. Also check that nothing was half-done: no partial saves and no events sent. Test edge cases such as empty input, null, zero, negative numbers, very large values and boundaries.`,

"What is mutation testing and is it worth using?":
`Mutation testing deliberately makes small changes to your code, such as turning <code>&gt;</code> into <code>&gt;=</code>, and runs your tests. If no test fails, your tests are not really checking that line. It measures how good your tests are, not just how much code they run. Tools such as PIT do it; it is slow, so use it on important code.`,

"How do you test a Spring Boot application's database layer properly?":
`Use <code>@DataJpaTest</code> with a real database started by Testcontainers, not an in-memory database that behaves differently. Save data, clear the persistence context so you really read from the database, then check the results. Test your custom queries, mappings and constraints.`,

"What is the difference between stubbing, verifying and argument matchers?":
`<b>Stubbing</b> tells a mock what to return: <code>when(repo.find(1)).thenReturn(user)</code>. <b>Verifying</b> checks that a method was called: <code>verify(mailer).send(any())</code>. <b>Argument matchers</b> such as <code>any()</code> and <code>eq()</code> match arguments flexibly; if you use one matcher in a call, every argument in that call must use a matcher.`,

"How do you test time-dependent and scheduled code?":
`Do not use the real clock in tests. Pass a <code>Clock</code> into your code, and give tests a fixed or controllable clock, so "24 hours later" happens instantly. For scheduled methods, call the method directly in the test instead of waiting for the scheduler to run it.`,

"What is WireMock and how do you test integrations with external APIs?":
`WireMock is a fake HTTP server you control in tests. You tell it "when someone calls /payments, reply with this JSON", or with an error or a slow response. Your real HTTP client code then runs against it, so you test serialisation, headers, timeouts and error handling without calling the real external service.`,

"How do you organise tests and keep a large suite fast?":
`Keep most tests as fast unit tests without Spring. In Spring tests, use the same configuration across test classes so Spring can reuse its context instead of starting again. Share one database container across tests, run tests in parallel, and separate slow tests so they do not block quick feedback.`,

"What is the difference between verification and validation, and what is a test double taxonomy?":
`<b>Verification</b>: "are we building the product right?" (does the code match the specification). <b>Validation</b>: "are we building the right product?" (does it meet users' needs). A test double is any stand-in for a real dependency: dummy, stub, spy, mock or fake, each used for a slightly different purpose.`,

"How do you test error handling, retries and resilience patterns?":
`Simulate failures with WireMock or mocks: make a call time out, return a 500 error, or fail twice and then succeed. Check that temporary errors are retried the right number of times, that permanent errors (such as a declined card) are not retried, and that circuit breakers and fallbacks behave as expected.`,

"What is snapshot testing and approval testing?":
`Instead of writing many individual checks, you save the output once (a big JSON response or a generated report), review it, and approve it. Later test runs compare the new output against the approved copy and fail if anything differs. This works well for large outputs, but you must review changes carefully rather than approving them blindly.`,

"How do you test observability — logs, metrics and traces?":
`Logs, metrics and traces are code too, and they fail silently. In tests, capture log output and check that important messages and correlation ids are present, check that metrics are recorded with the right names and tags, and check that trace ids are passed on to outgoing calls.`,

"What is the testing pyramid and where do most teams get it wrong?":
`The pyramid says: many fast unit tests, fewer integration tests, and very few slow end-to-end tests. Teams often get it upside down, relying on slow and flaky end-to-end tests or starting the full Spring application for every test, which makes the suite slow and unreliable.`,

"How do you write a Spring Boot integration test with Testcontainers?":
`Add Testcontainers, declare a container such as <code>PostgreSQLContainer</code>, and connect Spring to it with <code>@ServiceConnection</code> (or <code>@DynamicPropertySource</code>). The test then runs against a real Postgres in Docker, which catches problems an in-memory database like H2 would hide.`,

"When should you mock, and what are the alternatives?":
`Mock things that are slow, external or unpredictable: other services, payment providers, the clock. Do not mock the class you are testing, simple data objects, or your own database (use Testcontainers instead). Alternatives to mocks include fakes (simple working versions, such as an in-memory repository), WireMock and real dependencies in containers.`,

"What is contract testing and why does it matter in microservices?":
`A contract test checks that two services agree on their API. The consumer records what it expects (fields, status codes), and the provider's build checks it still meets those expectations. Breaking changes are caught in the provider's build, before deployment, without the slow, flaky end-to-end tests across every service.`,

"What makes a good unit test, and how do you write them with JUnit 5?":
`A good unit test is fast, independent of other tests, repeatable, checks one behaviour clearly, and fails when that behaviour breaks. In JUnit 5, mark it with <code>@Test</code>, arrange the data, act by calling the method, and assert the result. Name it after the behaviour, and use <code>@ParameterizedTest</code> for many similar cases.`,

"How do you test asynchronous, time-dependent and concurrent code?":
`For asynchronous code, wait for the result with Awaitility rather than <code>Thread.sleep</code>. For time-dependent code, inject a controllable clock. For concurrent code, start many threads at the same moment with a latch, repeat the test many times, and check for lost updates or duplicates.`,

"What is a flaky test, and how do you deal with one?":
`A flaky test passes and fails randomly without any code change. It is harmful because people learn to ignore failures. Take it out of the required checks quickly, find the cause (usually timing, shared state, test order or a real external service), fix it, and put it back.`,

"What is Test-Driven Development, and do you actually use it?":
`TDD means writing a failing test first, then the minimum code to make it pass, then tidying the code, in small repeated cycles. Its main benefit is that you design how code is used before writing it. Many developers use it for business logic and bug fixes (write a test that reproduces the bug first), but less for exploratory or UI work.`,

"Write the tests for this discount function. Which cases do you pick, and why?":
`Pick cases systematically. Split inputs into groups that should behave the same (equivalence partitioning) and test one from each, then test the exact boundaries between groups, where bugs usually are, for example ₹999, ₹1000 and ₹1001. Add invalid inputs such as negative amounts and null.`,

"What is property-based testing, and what bugs does it find that example tests miss?":
`Instead of testing a few examples you thought of, you state a rule that must always hold, such as "sorting twice gives the same result as sorting once", and the tool tries hundreds of random inputs, including strange ones like empty lists and huge numbers. It finds edge cases you would never think of, and shrinks failures down to the smallest example.`,

"What is the testing pyramid and why does it matter?":
`The pyramid shows how many of each test type to have: lots of unit tests (fast, precise, cheap), fewer integration tests (slower but check that parts work together), and very few end-to-end tests (slowest and most fragile, but check the whole system). Following it gives fast, reliable feedback.`,

"What are the main JUnit 5 annotations and how does it differ from JUnit 4?":
`Key annotations: <code>@Test</code>, <code>@BeforeEach</code> and <code>@AfterEach</code> (run around every test), <code>@BeforeAll</code> and <code>@AfterAll</code> (once per class), <code>@Disabled</code>, <code>@DisplayName</code>, <code>@ParameterizedTest</code> and <code>@Nested</code>. Compared with JUnit 4, it has renamed annotations, a flexible extension model instead of runners, and better support for parameterised and nested tests.`,

"How do you use Mockito effectively?":
`Create mocks with <code>@Mock</code> and inject them with <code>@InjectMocks</code>, stub only what the test needs, and verify only the interactions that matter. Mock dependencies that are slow or external, not simple data objects. If a test needs many mocks, the class under test probably does too much.`,

"What are the Spring Boot test slices and when do you use each?":
`Test slices start only part of the application, so tests run faster. <code>@WebMvcTest</code> loads only controllers, for checking requests and responses. <code>@DataJpaTest</code> loads only JPA and the database. <code>@JsonTest</code> checks JSON conversion. <code>@SpringBootTest</code> loads everything and is the slowest, for full integration tests.`,

"What is Testcontainers and why use it over an in-memory database?":
`Testcontainers starts real services (Postgres, Kafka, Redis) in Docker while your tests run, then removes them. An in-memory database like H2 behaves differently from your real database, so tests can pass while production fails. With Testcontainers you test against exactly what you run in production.`,

"What makes a good unit test?":
`Remember FIRST: <b>Fast</b> (milliseconds), <b>Isolated</b> (no shared state, any order), <b>Repeatable</b> (same result every time, no reliance on the network or clock), <b>Self-validating</b> (passes or fails with no human checking) and <b>Timely</b> (written along with the code). It should also test one clear behaviour.`,

"What is TDD and would you actually use it?":
`TDD follows a short cycle: red (write a failing test), green (write just enough code to pass), refactor (clean up with the test as a safety net). It leads to well-designed, testable code and fewer bugs. It works best for business logic and bug fixes; for exploratory or UI work, writing tests just after the code is also fine.`,

"How do you test asynchronous and time-dependent code?":
`Never use <code>Thread.sleep</code>: it is either too short (random failures) or too long (slow builds). Use Awaitility to wait until a condition becomes true, with a timeout. For time, inject a <code>Clock</code> and control it in tests, so expiry and scheduling can be tested instantly.`,

"What is code coverage and is it a useful metric?":
`Coverage shows what share of your code ran during tests; JaCoCo measures it for Java. It is useful for spotting code that has no tests at all. But it says nothing about whether the tests check the right things: a test with no assertions still increases coverage. Treat it as a guide, not a target.`,

"What are contract tests and why do they matter in microservices?":
`If one service renames a field, its own tests still pass, but the services calling it break in production. Contract tests capture what each consumer expects from the provider and check the provider against it in its own build. This catches breaking changes early, without running every service together.`,

"How do you test a Kafka consumer and producer?":
`Start a real Kafka with Testcontainers, send a message, and use Awaitility to wait until the consumer has processed it, then check the result. Also test what goes wrong in real life: the same message arriving twice, a bad message going to the dead-letter topic, and retries for temporary failures.`,

"What is the difference between a mock, a stub, a spy, a fake and a dummy?":
`A <b>dummy</b> just fills a parameter and is never used. A <b>stub</b> returns ready-made answers. A <b>mock</b> also records calls so you can verify them. A <b>spy</b> wraps a real object and records calls to it. A <b>fake</b> is a simple working version, such as an in-memory repository instead of a database.`,

"How do you test security — authentication and authorization?":
`Use Spring Security's test support, such as <code>@WithMockUser</code> or JWT helpers, with MockMvc. Check that requests without login get 401, users with the wrong role get 403, and the right users get through. Most importantly, check ownership: a logged-in user must not be able to read or change someone else's data.`
});
