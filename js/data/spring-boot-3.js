appendTopic("spring-boot", [
{
  q: "Walk me through what happens when a Spring Boot application starts",
  level: "advanced", hot: true, tags: ["autoconfiguration", "lifecycle"],
  companies: ["Amazon", "Infosys", "TCS", "Oracle", "SAP", "LTIMindtree"],
  a: `<pre><code>SpringApplication.run(Application.class, args);</code></pre>
<ol>
<li><strong>Create a <code>SpringApplication</code></strong> — deduce the application type (servlet, reactive or none) from what is on the classpath, and load <code>ApplicationContextInitializer</code>s and <code>ApplicationListener</code>s from <code>spring.factories</code>.</li>
<li><strong>Prepare the <code>Environment</code></strong> — merge property sources in precedence order (command line, env vars, <code>application-{profile}.yml</code>, <code>application.yml</code>) and activate profiles.</li>
<li><strong>Print the banner</strong>, create the <code>ApplicationContext</code> (the servlet variant for a web app).</li>
<li><strong>Prepare the context</strong> — register the primary source, apply initialisers, publish <code>ApplicationContextInitializedEvent</code>.</li>
<li><strong><code>refresh()</code></strong> — the twelve-step template method:
  <ul>
  <li>Parse bean <em>definitions</em> (component scan + <code>@Bean</code> methods).</li>
  <li>Run <code>BeanFactoryPostProcessor</code>s — <strong>this is where <code>@Configuration</code> classes are processed and auto-configuration is evaluated</strong>.</li>
  <li>Register <code>BeanPostProcessor</code>s.</li>
  <li><code>onRefresh()</code> — <strong>the embedded Tomcat is created here</strong>.</li>
  <li>Instantiate all non-lazy singletons; AOP proxies are created during this step.</li>
  <li>Publish <code>ContextRefreshedEvent</code>.</li>
  </ul>
</li>
<li><strong>Start the web server</strong> and begin accepting connections.</li>
<li><strong>Run <code>ApplicationRunner</code> and <code>CommandLineRunner</code> beans.</strong></li>
<li><strong>Publish <code>ApplicationReadyEvent</code></strong> — the correct hook for "register with service discovery" or "warm the cache".</li>
</ol>
<pre><code>// Measure where the time actually goes
SpringApplication app = new SpringApplication(Application.class);
app.setApplicationStartup(new BufferingApplicationStartup(2048));
app.run(args);
// then GET /actuator/startup — a ranked breakdown of every step</code></pre>
<p><strong>The two ordering facts that answer follow-up questions:</strong> auto-configuration is applied <em>last</em>, which is why <code>@ConditionalOnMissingBean</code> lets your own beans win. And AOP proxies are created in step 5's final phase, which is why <code>@Transactional</code> does nothing inside <code>@PostConstruct</code> — the proxy does not exist yet.</p>`
},
{
  q: "How do you handle a 404 and other errors for both REST and MVC in one application?",
  level: "advanced", tags: ["errors", "rest"],
  companies: ["TCS", "Infosys", "Accenture", "Cognizant", "Optum"],
  a: `<pre><code>// 1. Make Spring throw instead of forwarding to the default error page
spring:
  mvc.throw-exception-if-no-handler-found: true
  web.resources.add-mappings: false          # required, or static handling catches it first

// 2. Handle everything in one place
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    ProblemDetail notFound(EntityNotFoundException ex) {
        var pd = ProblemDetail.forStatusAndDetail(NOT_FOUND, ex.getMessage());
        pd.setTitle("Resource not found");
        pd.setType(URI.create("https://api.acme.com/errors/not-found"));
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }

    @Override                                   // no handler matched the URL at all
    protected ResponseEntity&lt;Object&gt; handleNoHandlerFoundException(
            NoHandlerFoundException ex, HttpHeaders h, HttpStatusCode s, WebRequest r) {
        var pd = ProblemDetail.forStatusAndDetail(NOT_FOUND, "No endpoint " + ex.getRequestURL());
        return ResponseEntity.status(NOT_FOUND).body(pd);
    }

    @ExceptionHandler(Exception.class)          // safety net — NEVER leak internals
    ProblemDetail unexpected(Exception ex) {
        String ref = UUID.randomUUID().toString();
        log.error("Unhandled error ref={}", ref, ex);      // full detail SERVER-SIDE
        var pd = ProblemDetail.forStatusAndDetail(INTERNAL_SERVER_ERROR,
                 "Unexpected error. Reference: " + ref);
        return pd;
    }
}</code></pre>
<pre><code># Never leak stack traces to clients
server.error:
  include-stacktrace: never
  include-message: never
  include-binding-errors: never</code></pre>
<p><strong>The detail that makes this question non-trivial:</strong> by default Spring Boot does <em>not</em> throw <code>NoHandlerFoundException</code> — it forwards to <code>/error</code>, so a <code>@ControllerAdvice</code> never sees it. You must enable <code>throw-exception-if-no-handler-found</code> <em>and</em> disable default resource mapping, because the static resource handler otherwise matches every unknown path first.</p>
<p><strong>For a mixed MVC + REST application:</strong> scope two advices — <code>@ControllerAdvice(annotations = RestController.class)</code> returning <code>ProblemDetail</code>, and a separate one for <code>@Controller</code> returning a view name. Otherwise your HTML pages start returning JSON error bodies.</p>
<p><strong>Always return a correlation ID</strong> and log the full trace server-side. Support can then find the exact request without the client ever seeing a class name or SQL fragment.</p>`
},
{
  q: "What is the difference between @RestController and @Controller, and how does @ResponseBody work?",
  level: "beginner", hot: true, tags: ["rest", "mvc"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "HCL", "Zoho"],
  a: `<pre><code>@Controller          // returns a VIEW NAME, resolved by a ViewResolver
public class PageController {
    @GetMapping("/orders")
    public String list(Model model) {
        model.addAttribute("orders", service.findAll());
        return "orders";                    // -> templates/orders.html (Thymeleaf)
    }

    @GetMapping("/api/orders")
    @ResponseBody                            // this ONE method returns data, not a view
    public List&lt;OrderDto&gt; listJson() { return service.findAll(); }
}

@RestController      // == @Controller + @ResponseBody on EVERY method
public class OrderApiController {
    @GetMapping("/api/orders")
    public List&lt;OrderDto&gt; list() { return service.findAll(); }   // serialised to JSON
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Controller versus RestController response flow">
  <rect class="dg-box" x="10" y="46" width="86" height="34" rx="7"/><text class="dg-s" x="53" y="68" text-anchor="middle">Request</text>
  <path class="dg-line" d="M100 63 H150" marker-end="url(#rc1)"/>
  <rect class="dg-fill" x="154" y="46" width="120" height="34" rx="7"/><text class="dg-s" x="214" y="68" text-anchor="middle">DispatcherServlet</text>
  <path class="dg-line" d="M278 55 H336 M278 74 H336" marker-end="url(#rc1)"/>
  <rect class="dg-fill2" x="340" y="16" width="150" height="34" rx="7"/><text class="dg-s" x="415" y="37" text-anchor="middle">@Controller → view name</text>
  <rect class="dg-fill2" x="340" y="78" width="150" height="34" rx="7"/><text class="dg-s" x="415" y="99" text-anchor="middle">@RestController → object</text>
  <path class="dg-line" d="M494 33 H548" marker-end="url(#rc1)"/><text class="dg-s" x="576" y="37" text-anchor="middle">HTML</text>
  <path class="dg-line" d="M494 95 H548" marker-end="url(#rc1)"/><text class="dg-s" x="576" y="99" text-anchor="middle">JSON</text>
  <text class="dg-s" x="415" y="63" text-anchor="middle">ViewResolver vs HttpMessageConverter</text>
  <defs><marker id="rc1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>How <code>@ResponseBody</code> actually works:</strong> it tells the <code>DispatcherServlet</code> to skip view resolution and instead pass the return value to an <code>HttpMessageConverter</code>. Spring picks the converter by content negotiation — <code>MappingJackson2HttpMessageConverter</code> for <code>application/json</code>, and others for XML, protobuf or plain text.</p>
<p><strong>The classic bug this explains:</strong> forget <code>@ResponseBody</code> on a <code>@Controller</code> method that returns a DTO, and Spring treats the returned object's <code>toString()</code> as a <em>view name</em> — producing a confusing "Circular view path" or template-not-found error rather than JSON.</p>
<p><strong>Related pairs worth mentioning:</strong> <code>@RequestBody</code> is the inbound counterpart (deserialise the request body into an object), and <code>ResponseEntity&lt;T&gt;</code> is what you return when you need to control the status code and headers rather than just the body.</p>`
},
{
  q: "How do you implement retry and circuit breaking in a Spring Boot service?",
  level: "advanced", hot: true, tags: ["resilience", "production"],
  companies: ["Amazon", "Flipkart", "PayPal", "Walmart", "Maersk", "Ericsson"],
  a: `<pre><code>&lt;dependency&gt;
  &lt;groupId&gt;io.github.resilience4j&lt;/groupId&gt;
  &lt;artifactId&gt;resilience4j-spring-boot3&lt;/artifactId&gt;
&lt;/dependency&gt;</code></pre>
<pre><code>resilience4j:
  circuitbreaker.instances.payment:
    slidingWindowSize: 20
    minimumNumberOfCalls: 10          # do not trip on 1 failure out of 1
    failureRateThreshold: 50
    slowCallRateThreshold: 50
    slowCallDurationThreshold: 2s     # slow calls count as failures — important
    waitDurationInOpenState: 30s
    permittedNumberOfCallsInHalfOpenState: 3
  retry.instances.payment:
    maxAttempts: 3
    waitDuration: 200ms
    exponentialBackoffMultiplier: 2
    retryExceptions: [java.io.IOException, java.util.concurrent.TimeoutException]
    ignoreExceptions: [com.acme.CardDeclinedException]      # do NOT retry a decline
  timelimiter.instances.payment:
    timeoutDuration: 3s
  bulkhead.instances.payment:
    maxConcurrentCalls: 20</code></pre>
<pre><code>@Service
public class PaymentService {

    @CircuitBreaker(name = "payment", fallbackMethod = "fallback")
    @Retry(name = "payment")
    @Bulkhead(name = "payment")
    @TimeLimiter(name = "payment")
    public CompletableFuture&lt;Receipt&gt; charge(PaymentRequest req) {
        return CompletableFuture.supplyAsync(() -&gt; client.charge(req), ioPool);
    }

    // Signature must match + the Throwable parameter
    private CompletableFuture&lt;Receipt&gt; fallback(PaymentRequest req, CallNotPermittedException e) {
        return CompletableFuture.completedFuture(Receipt.queued(req.id()));   // degrade
    }
}</code></pre>
<p><strong>The configuration decisions that matter most:</strong></p>
<ul>
<li><strong><code>ignoreExceptions</code></strong> — retrying a card decline eleven times wastes time, may trip the provider's fraud rules, and delays the user's error message. Retry only <em>transient</em> failures.</li>
<li><strong><code>slowCallDurationThreshold</code></strong> — a dependency that responds in 30 seconds is worse than one that fails fast, because it holds your threads. Counting slow calls as failures is what protects you.</li>
<li><strong><code>minimumNumberOfCalls</code></strong> — without it, one failure on a quiet endpoint opens the breaker.</li>
<li><strong>Annotation order</strong> — Resilience4j applies Retry <em>outside</em> CircuitBreaker by default, so retries do not hammer an open circuit. It is configurable; know that it is deliberate.</li>
</ul>
<p><strong>Make the fallback meaningful:</strong> a cached value, a queued request, or a reduced feature — not a generic 500. And expose breaker state as a metric so you can see it trip on a dashboard rather than inferring it from errors.</p>`
},
{
  q: "How do you expose and secure Actuator endpoints in production?",
  level: "beginner", hot: true, tags: ["actuator", "security"],
  companies: ["TCS", "Infosys", "Amazon", "Deloitte", "Optum", "Barclays"],
  a: `<pre><code>management:
  server.port: 9090                    # SEPARATE port — not reachable from the internet
  endpoints.web.exposure.include: health,info,prometheus,metrics
  endpoints.web.exposure.exclude: env,configprops,heapdump,threaddump
  endpoint:
    health:
      show-details: when-authorized     # never 'always' in production
      probes.enabled: true
    shutdown.enabled: false             # NEVER expose this
  info.env.enabled: false</code></pre>
<pre><code>@Bean
SecurityFilterChain actuatorChain(HttpSecurity http) throws Exception {
    return http
        .securityMatcher(EndpointRequest.toAnyEndpoint())
        .authorizeHttpRequests(a -&gt; a
            .requestMatchers(EndpointRequest.to("health", "info")).permitAll()  // for probes
            .anyRequest().hasRole("OPS"))
        .httpBasic(Customizer.withDefaults())
        .csrf(c -&gt; c.disable())
        .build();
}</code></pre>
<table>
<tr><th>Endpoint</th><th>Risk if exposed</th></tr>
<tr><td><code>/env</code>, <code>/configprops</code></td><td><strong>Prints your database password</strong> and every secret not matched by Spring's masking patterns</td></tr>
<tr><td><code>/heapdump</code></td><td>Downloads the entire heap — tokens, PII, session data</td></tr>
<tr><td><code>/threaddump</code></td><td>Reveals internal structure and can contain arguments</td></tr>
<tr><td><code>/shutdown</code></td><td>Anyone can stop your service</td></tr>
<tr><td><code>/loggers</code></td><td>Attacker can enable DEBUG and flood your logs or leak data</td></tr>
<tr><td><code>/mappings</code></td><td>Full inventory of your API surface</td></tr>
</table>
<p><strong>Only <code>health</code> and <code>info</code> are exposed over HTTP by default</strong> — everything else is opt-in, which is a sensible default that people then override with <code>include: "*"</code> during development and forget to change.</p>
<p><strong>The three-layer answer:</strong> a separate management port that is not routed publicly; authentication and an OPS role on everything except the probe endpoints; and an explicit exclude list so a future Spring Boot upgrade that adds a new endpoint does not expose it silently.</p>
<p><strong>Custom health indicator</strong> worth showing:</p>
<pre><code>@Component
class KafkaHealth implements HealthIndicator {
    public Health health() {
        try { return Health.up().withDetail("brokers", admin.nodes().size()).build(); }
        catch (Exception e) { return Health.down(e).build(); }
    }
}</code></pre>`
},
{
  q: "What is the difference between application.properties and bootstrap.properties?",
  level: "advanced", tags: ["configuration"],
  companies: ["Infosys", "TCS", "Cognizant", "Capgemini", "Tech Mahindra"],
  a: `<p><strong>Historically</strong>, Spring Cloud used a separate <em>bootstrap context</em> that loaded <strong>before</strong> the main application context, so it could fetch configuration from an external source (Config Server, Vault, Consul) before the main context needed it.</p>
<pre><code># bootstrap.yml — loaded FIRST, by the bootstrap context
spring:
  application.name: order-service
  cloud.config.uri: http://config-server:8888

# application.yml — loaded SECOND, and can use values fetched above</code></pre>
<p><strong>The modern answer, which is what interviewers are checking for:</strong> the bootstrap context was <strong>deprecated in Spring Cloud 2020.0</strong> and replaced by <code>spring.config.import</code>. There is now a single context and one loading mechanism.</p>
<pre><code># application.yml — no bootstrap file needed
spring:
  application.name: order-service
  config.import:
    - "optional:configserver:http://config-server:8888"
    - "optional:vault://secret/order-service"
    - "optional:file:./config/local.yml"</code></pre>
<p><strong>Why the change is an improvement:</strong> two contexts meant two <code>Environment</code>s, confusing precedence rules, and beans that mysteriously could not see properties depending on which context they landed in. A single context with an explicit import order removes that whole class of confusion.</p>
<p><strong>The <code>optional:</code> prefix matters:</strong> without it, the application <em>fails to start</em> if the config server is unreachable. With it, startup continues using local defaults — which is usually what you want for resilience, though for production secrets you may deliberately want the hard failure.</p>
<p><strong>If you see <code>bootstrap.yml</code> in a codebase</strong>, it means either an older Spring Cloud version or <code>spring.cloud.bootstrap.enabled=true</code> set for backwards compatibility. Migrating it to <code>spring.config.import</code> is usually a small, worthwhile change.</p>`
},
{
  q: "How do you handle request validation and return meaningful field-level errors?",
  level: "beginner", hot: true, tags: ["validation", "rest"],
  companies: ["TCS", "Infosys", "Accenture", "Wipro", "Zoho", "Persistent"],
  a: `<pre><code>public record CreateOrderRequest(
        @NotBlank(message = "customerId is required")
        String customerId,

        @NotEmpty(message = "at least one item is required")
        @Valid List&lt;ItemDto&gt; items,                    // @Valid CASCADES into each item

        @NotNull @DecimalMin(value = "0.01", message = "total must be positive")
        @Digits(integer = 10, fraction = 2)
        BigDecimal total,

        @Email String notifyEmail,

        @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be a 3-letter code")
        String currency) { }

@PostMapping("/orders")
public ResponseEntity&lt;OrderDto&gt; create(@Valid @RequestBody CreateOrderRequest req) { }</code></pre>
<pre><code>@RestControllerAdvice
public class ValidationHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)     // @RequestBody failures
    ProblemDetail invalidBody(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .map(f -&gt; Map.of("field", f.getField(),
                                 "message", f.getDefaultMessage(),
                                 "rejected", String.valueOf(f.getRejectedValue())))
                .toList();
        var pd = ProblemDetail.forStatus(BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("errors", errors);        // ALL errors, not just the first
        return pd;
    }

    @ExceptionHandler(ConstraintViolationException.class)        // @RequestParam / service layer
    ProblemDetail invalidParam(ConstraintViolationException ex) { ... }
}</code></pre>
<pre><code>{
  "type": "about:blank", "title": "Validation failed", "status": 400,
  "errors": [
    { "field": "customerId", "message": "customerId is required", "rejected": "null" },
    { "field": "items[0].quantity", "message": "must be greater than 0", "rejected": "-1" }
  ]
}</code></pre>
<p><strong>Details that separate a complete answer:</strong></p>
<ul>
<li><strong>Two different exceptions.</strong> <code>@RequestBody</code> failures throw <code>MethodArgumentNotValidException</code>; <code>@RequestParam</code>/<code>@PathVariable</code> and service-layer validation throw <code>ConstraintViolationException</code>. Handle both or half your validation returns a 500.</li>
<li><strong><code>@Validated</code> on the class</strong> is required for method-level validation on service beans — <code>@Valid</code> alone only works on controller parameters.</li>
<li><strong>Return every error at once.</strong> Returning the first one means the user fixes five fields in five round trips.</li>
<li><strong><code>spring-boot-starter-validation</code> is a separate dependency</strong> since Boot 2.3 — a very common "why is validation not working" cause.</li>
</ul>
<p><strong>Custom validator</strong> for business rules (uniqueness, cross-field): implement <code>ConstraintValidator</code>; it is a Spring bean, so you can inject a repository into it.</p>`
},
{
  q: "How do you write integration tests that do not slow the build to a crawl?",
  level: "advanced", hot: true, tags: ["testing", "performance"],
  companies: ["Amazon", "ThoughtWorks", "EPAM", "SAP", "Publicis Sapient"],
  a: `<p>The single biggest factor is <strong>Spring's application context cache</strong>. Spring reuses a context across test classes whose configuration is <em>identical</em> — every variation creates a new one, and each costs seconds.</p>
<pre><code>// ✘ Three DIFFERENT contexts = three full startups
@SpringBootTest                                        class A { }
@SpringBootTest @MockitoBean(PaymentClient.class)      class B { }
@SpringBootTest @TestPropertySource(properties="x=1")  class C { }

// ✔ ONE shared configuration, one context, reused by every test class
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class IntegrationTestBase {
    @Container @ServiceConnection
    static final PostgreSQLContainer&lt;?&gt; DB =
            new PostgreSQLContainer&lt;&gt;("postgres:16-alpine").withReuse(true);
    static { DB.start(); }                  // SINGLETON container, started once per JVM
}

class OrderIT extends IntegrationTestBase { }
class PaymentIT extends IntegrationTestBase { }        // same context, instant startup</code></pre>
<pre><code>&lt;!-- Split fast from slow --&gt;
&lt;plugin&gt;&lt;artifactId&gt;maven-surefire-plugin&lt;/artifactId&gt;   &lt;!-- unit, every push --&gt;
  &lt;configuration&gt;&lt;excludedGroups&gt;integration&lt;/excludedGroups&gt;&lt;/configuration&gt;
&lt;/plugin&gt;
&lt;plugin&gt;&lt;artifactId&gt;maven-failsafe-plugin&lt;/artifactId&gt;&lt;/plugin&gt;  &lt;!-- *IT, on merge --&gt;</code></pre>
<p><strong>The techniques, in order of impact:</strong></p>
<ol>
<li><strong>Use slice tests instead of <code>@SpringBootTest</code></strong> wherever possible — <code>@WebMvcTest</code>, <code>@DataJpaTest</code>, <code>@JsonTest</code> start a fraction of the context.</li>
<li><strong>One shared base class</strong> so every integration test hits the same cached context.</li>
<li><strong>A singleton Testcontainer</strong> with <code>withReuse(true)</code> rather than one container per class.</li>
<li><strong>Roll back rather than recreate</strong> — <code>@Transactional</code> on the test rolls back automatically, so no cleanup between tests.</li>
<li><strong>Most tests should need no Spring at all</strong> — pure unit tests on business logic run in milliseconds.</li>
</ol>
<p><strong>The number to quote:</strong> a suite with 40 distinct context configurations spends several minutes purely on startup. Consolidating to two or three configurations typically cuts total build time by more than half — a change with no risk and immediate payoff.</p>`
}
]);
