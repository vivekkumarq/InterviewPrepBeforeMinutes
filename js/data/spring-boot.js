registerTopic("spring-boot", [
{
  q: "What is Spring Boot and what problem does it solve?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>Spring Boot is an opinionated layer on top of Spring that removes the configuration burden. What it gives you:</p>
<ul>
<li><strong>Auto-configuration</strong> — sensible beans are configured based on what is on the classpath.</li>
<li><strong>Starter dependencies</strong> — one coordinate pulls a curated, version-compatible set of libraries.</li>
<li><strong>Embedded server</strong> — Tomcat/Jetty/Undertow inside the jar; <code>java -jar app.jar</code> and you are running. No WAR, no external container.</li>
<li><strong>Production-ready features</strong> — Actuator health, metrics, info endpoints out of the box.</li>
<li><strong>Externalised configuration</strong> — YAML/properties/env-var binding with clear precedence.</li>
<li><strong>No XML.</strong></li>
</ul>
<blockquote><p><strong>One-line answer:</strong> "Spring gives you the framework; Spring Boot gives you a runnable, configured, production-ready application with almost no boilerplate."</p></blockquote>`
},
{
  q: "How does @SpringBootApplication work?",
  level: "beginner", hot: true, tags: ["annotations"],
  a: `<p>It is a meta-annotation combining three:</p>
<pre><code>@SpringBootConfiguration   // = @Configuration, marks this as the primary config class
@EnableAutoConfiguration   // triggers the auto-configuration machinery
@ComponentScan             // scans this package and everything below it
public @interface SpringBootApplication { }</code></pre>
<p><strong>The consequence people trip on:</strong> <code>@ComponentScan</code> has no explicit base package, so it defaults to <em>the package of the annotated class</em>. Put your main class in <code>com.acme.app</code> and a service in <code>com.other</code> and it will never be found. Always keep the main class in the root package.</p>
<pre><code>@SpringBootApplication(
    scanBasePackages = "com.acme",
    exclude = DataSourceAutoConfiguration.class)   // opt out of a specific auto-config
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}</code></pre>`
},
{
  q: "How does auto-configuration actually work internally?",
  level: "advanced", hot: true, tags: ["autoconfiguration"],
  a: `<ol>
<li><code>@EnableAutoConfiguration</code> imports <code>AutoConfigurationImportSelector</code>.</li>
<li>That selector reads every <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code> file on the classpath (before Boot 2.7 it was <code>spring.factories</code>) — a list of candidate configuration classes, over 150 of them.</li>
<li>Each candidate is filtered by its <strong><code>@Conditional</code></strong> annotations. Only those whose conditions pass get registered.</li>
<li>Auto-configurations are applied <strong>last</strong>, so any bean you define yourself wins.</li>
</ol>
<pre><code>@AutoConfiguration
@ConditionalOnClass(DataSource.class)                  // is the class on the classpath?
@ConditionalOnMissingBean(DataSource.class)            // did the user already define one?
@ConditionalOnProperty(prefix="spring.datasource", name="url")
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration { ... }</code></pre>
<p><strong>Common conditions:</strong> <code>@ConditionalOnClass</code> / <code>OnMissingClass</code>, <code>@ConditionalOnBean</code> / <code>OnMissingBean</code>, <code>@ConditionalOnProperty</code>, <code>@ConditionalOnWebApplication</code>, <code>@ConditionalOnResource</code>, <code>@ConditionalOnExpression</code>.</p>
<p><strong>Debugging it:</strong> run with <code>--debug</code> or set <code>debug=true</code> and Boot prints the <em>Conditions Evaluation Report</em> — every auto-configuration that matched, and for each that did not, the exact condition that failed. That report answers "why is this bean not being created?" in seconds.</p>`
},
{
  q: "What are starter dependencies?",
  level: "beginner", tags: ["build"],
  a: `<p>A starter is an empty POM whose only content is a curated set of transitive dependencies that work together. <code>spring-boot-starter-web</code> brings Spring MVC, Jackson, validation, embedded Tomcat and logging with mutually compatible versions.</p>
<pre><code>&lt;parent&gt;
  &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
  &lt;artifactId&gt;spring-boot-starter-parent&lt;/artifactId&gt;
  &lt;version&gt;3.5.0&lt;/version&gt;
&lt;/parent&gt;
&lt;dependencies&gt;
  &lt;dependency&gt;   &lt;!-- no version needed — the parent's BOM manages it --&gt;
    &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
    &lt;artifactId&gt;spring-boot-starter-web&lt;/artifactId&gt;
  &lt;/dependency&gt;
&lt;/dependencies&gt;</code></pre>
<p>Common ones: <code>-web</code>, <code>-data-jpa</code>, <code>-security</code>, <code>-validation</code>, <code>-actuator</code>, <code>-test</code>, <code>-webflux</code>, <code>-cache</code>, <code>-amqp</code>.</p>
<p>The real value is the <strong>dependency management BOM</strong>: you stop hand-resolving version conflicts between Spring, Jackson, Hibernate and Tomcat. Swapping implementations is an exclusion — exclude <code>spring-boot-starter-tomcat</code> and add <code>-jetty</code>.</p>`
},
{
  q: "How do you handle exceptions globally in a Spring Boot REST API?",
  level: "beginner", hot: true, tags: ["rest", "exceptions"],
  a: `<pre><code>@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail notFound(EntityNotFoundException ex) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Resource not found");
        pd.setProperty("timestamp", Instant.now());
        return pd;                                  // RFC 7807, Spring 6+
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid(MethodArgumentNotValidException ex) {
        Map&lt;String, String&gt; errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(toMap(FieldError::getField, FieldError::getDefaultMessage, (a,b) -&gt; a));
        var pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("errors", errors);
        return pd;
    }

    @ExceptionHandler(Exception.class)              // safety net — never leak a stack trace
    public ProblemDetail unexpected(Exception ex) {
        String ref = UUID.randomUUID().toString();
        log.error("Unhandled error, ref={}", ref, ex);
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                 "Unexpected error. Reference: " + ref);
        return pd;
    }
}</code></pre>
<p>Points worth making: <code>@RestControllerAdvice</code> = <code>@ControllerAdvice</code> + <code>@ResponseBody</code>; you can scope it with <code>basePackages</code> or <code>assignableTypes</code>; the most specific handler wins; and extending <code>ResponseEntityExceptionHandler</code> gives you Spring's built-in handling for the framework's own exceptions. Always log the full trace server-side and return a correlation ID to the client rather than internals.</p>`
},
{
  q: "What is Spring Boot Actuator and which endpoints matter in production?",
  level: "beginner", hot: true, tags: ["actuator", "production"],
  a: `<table>
<tr><th>Endpoint</th><th>Use</th></tr>
<tr><td><code>/actuator/health</code></td><td>Liveness and readiness for Kubernetes probes</td></tr>
<tr><td><code>/actuator/metrics</code></td><td>Micrometer metrics (JVM, HTTP, datasource, custom)</td></tr>
<tr><td><code>/actuator/prometheus</code></td><td>Scrape target for Prometheus</td></tr>
<tr><td><code>/actuator/info</code></td><td>Build version, git commit — invaluable for "what is deployed?"</td></tr>
<tr><td><code>/actuator/loggers</code></td><td><strong>Change log levels at runtime</strong> without a restart</td></tr>
<tr><td><code>/actuator/env</code>, <code>/configprops</code></td><td>Effective configuration — sensitive, secure it</td></tr>
<tr><td><code>/actuator/threaddump</code>, <code>/heapdump</code></td><td>Diagnostics without shell access</td></tr>
</table>
<pre><code>management:
  endpoints.web.exposure.include: health,info,metrics,prometheus,loggers
  endpoint.health:
    probes.enabled: true            # /health/liveness and /health/readiness
    show-details: when-authorized
  server.port: 9090                 # separate port — do not expose with app traffic</code></pre>
<pre><code>@Component
class KafkaHealthIndicator implements HealthIndicator {
    public Health health() {
        return reachable() ? Health.up().withDetail("brokers", n).build()
                           : Health.down().withDetail("reason", "no brokers").build();
    }
}</code></pre>
<p><strong>Say this:</strong> only <code>health</code> and <code>info</code> are exposed over HTTP by default; everything else is opt-in, should sit on a separate management port, and must be secured — <code>/env</code> and <code>/heapdump</code> leak credentials and data.</p>`
},
{
  q: "How does Spring Boot externalised configuration and property precedence work?",
  level: "advanced", tags: ["configuration"],
  a: `<p>Precedence, highest wins:</p>
<ol>
<li>Devtools global settings</li>
<li><code>@TestPropertySource</code> / test annotations</li>
<li>Command line arguments (<code>--server.port=9090</code>)</li>
<li><code>SPRING_APPLICATION_JSON</code></li>
<li>ServletConfig / ServletContext parameters</li>
<li>JNDI</li>
<li>Java System properties (<code>-Dserver.port=</code>)</li>
<li><strong>OS environment variables</strong></li>
<li><code>application-{profile}.yml</code> outside the jar, then inside</li>
<li><code>application.yml</code> outside the jar, then inside</li>
<li><code>@PropertySource</code></li>
<li>Default properties</li>
</ol>
<p><strong>Relaxed binding</strong> means <code>app.retry-count</code>, <code>app.retryCount</code>, <code>APP_RETRYCOUNT</code> and <code>app.retry_count</code> all bind to the same property. That is what makes container environment variables work naturally.</p>
<pre><code>@ConfigurationProperties(prefix = "app.payment")
@Validated
public record PaymentProperties(
        @NotBlank String apiUrl,
        @NotNull Duration timeout,
        @Min(0) @Max(10) int retries,
        Map&lt;String, String&gt; headers) { }

// enable with @EnableConfigurationProperties(PaymentProperties.class)
// or @ConfigurationPropertiesScan on the main class</code></pre>
<p>Add <code>spring-boot-configuration-processor</code> and your custom properties get IDE autocompletion. For secrets, bind from environment variables injected by Vault, AWS Secrets Manager or Kubernetes secrets — never commit them to YAML.</p>`
},
{
  q: "What is the embedded server and how do you configure or replace it?",
  level: "beginner", tags: ["server"],
  a: `<p><code>spring-boot-starter-web</code> embeds <strong>Tomcat</strong> by default, so the artifact is a self-contained executable jar. This is what makes container deployment and twelve-factor apps natural: the app owns its runtime instead of being deployed into someone else's.</p>
<pre><code>server:
  port: 8080
  shutdown: graceful               # finish in-flight requests before exiting
  compression.enabled: true
  tomcat:
    threads.max: 200               # the size of your request thread pool
    accept-count: 100
    connection-timeout: 5s
    max-connections: 8192
spring.lifecycle.timeout-per-shutdown-phase: 30s</code></pre>
<pre><code>&lt;!-- Swap Tomcat for Undertow --&gt;
&lt;dependency&gt;
  &lt;artifactId&gt;spring-boot-starter-web&lt;/artifactId&gt;
  &lt;exclusions&gt;&lt;exclusion&gt;&lt;artifactId&gt;spring-boot-starter-tomcat&lt;/artifactId&gt;&lt;/exclusion&gt;&lt;/exclusions&gt;
&lt;/dependency&gt;
&lt;dependency&gt;&lt;artifactId&gt;spring-boot-starter-undertow&lt;/artifactId&gt;&lt;/dependency&gt;</code></pre>
<p><strong>Graceful shutdown matters in Kubernetes:</strong> without it, a rolling deploy kills pods mid-request and users see 502s. With it — plus a <code>preStop</code> sleep so the load balancer stops routing first — deployments become invisible.</p>`
},
{
  q: "How do you handle validation in Spring Boot?",
  level: "beginner", hot: true, tags: ["validation"],
  a: `<pre><code>public record CreateUserRequest(
    @NotBlank(message = "name is required")
    @Size(max = 100) String name,

    @Email @NotBlank String email,

    @Min(18) @Max(120) int age,

    @Pattern(regexp = "^[0-9]{10}$", message = "10 digits required") String phone,

    @Valid @NotNull AddressDto address,        // @Valid cascades into nested objects

    @NotEmpty List&lt;@NotBlank String&gt; roles) { }

@PostMapping("/users")
public ResponseEntity&lt;UserDto&gt; create(@Valid @RequestBody CreateUserRequest req) { ... }
//                                    ^ triggers validation; failure -> MethodArgumentNotValidException

@Validated                                     // needed on the CLASS for method-level validation
@Service
public class UserService {
    public User find(@NotBlank String id) { ... }   // throws ConstraintViolationException
}</code></pre>
<p><strong>Custom validator:</strong></p>
<pre><code>@Target(FIELD) @Retention(RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
public @interface UniqueEmail { String message() default "email already registered";
    Class&lt;?&gt;[] groups() default {}; Class&lt;? extends Payload&gt;[] payload() default {}; }

@RequiredArgsConstructor
class UniqueEmailValidator implements ConstraintValidator&lt;UniqueEmail, String&gt; {
    private final UserRepository repo;   // validators are Spring beans — injection works
    public boolean isValid(String email, ConstraintValidatorContext ctx) {
        return email == null || !repo.existsByEmail(email);
    }
}</code></pre>
<p>Points to make: <code>@Valid</code> vs <code>@Validated</code> (the latter is Spring's, supports validation <em>groups</em> and enables method-level validation), remember <code>spring-boot-starter-validation</code> is a separate dependency since Boot 2.3, and always pair with a global handler that returns field-level errors.</p>`
},
{
  q: "Explain @RestController, @RequestMapping and parameter binding annotations",
  level: "beginner", tags: ["rest", "mvc"],
  a: `<pre><code>@RestController                       // @Controller + @ResponseBody
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    @GetMapping("/{id}")
    OrderDto get(@PathVariable Long id) { ... }

    @GetMapping
    Page&lt;OrderDto&gt; list(@RequestParam(defaultValue = "0") int page,
                        @RequestParam(required = false) String status,
                        @RequestHeader("X-Tenant-Id") String tenant,
                        Pageable pageable) { ... }

    @PostMapping(consumes = APPLICATION_JSON_VALUE, produces = APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    OrderDto create(@Valid @RequestBody CreateOrderRequest req) { ... }

    @PutMapping("/{id}")
    OrderDto replace(@PathVariable Long id, @Valid @RequestBody UpdateOrderRequest req) { ... }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) { ... }

    @PostMapping(value = "/{id}/attachments", consumes = MULTIPART_FORM_DATA_VALUE)
    void upload(@PathVariable Long id, @RequestPart MultipartFile file) { ... }
}</code></pre>
<p><strong>Return type choice:</strong> return the DTO directly when the status is fixed (use <code>@ResponseStatus</code>); return <code>ResponseEntity&lt;T&gt;</code> when you need to vary the status, set headers, or return a <code>Location</code> on create.</p>`
},
{
  q: "How do you write tests in Spring Boot? @SpringBootTest vs slice tests",
  level: "advanced", hot: true, tags: ["testing"],
  a: `<table>
<tr><th>Annotation</th><th>Loads</th><th>Use for</th></tr>
<tr><td>Plain JUnit + Mockito</td><td>Nothing</td><td>Business logic — fastest, use most often</td></tr>
<tr><td><code>@WebMvcTest</code></td><td>Web layer only</td><td>Controllers, with mocked services</td></tr>
<tr><td><code>@DataJpaTest</code></td><td>JPA + embedded DB, rolls back</td><td>Repositories and queries</td></tr>
<tr><td><code>@JsonTest</code></td><td>Jackson only</td><td>Serialisation contracts</td></tr>
<tr><td><code>@SpringBootTest</code></td><td>The whole context</td><td>End-to-end integration — use sparingly</td></tr>
</table>
<pre><code>@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;        // @MockBean before Boot 3.4

    @Test void returns404WhenMissing() throws Exception {
        given(service.find(9L)).willThrow(new EntityNotFoundException("no"));
        mvc.perform(get("/api/v1/orders/9"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.title").value("Resource not found"));
    }
}

@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class OrderIntegrationTest {
    @Container static PostgreSQLContainer&lt;?&gt; db = new PostgreSQLContainer&lt;&gt;("postgres:16");
    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) { r.add("spring.datasource.url", db::getJdbcUrl); }

    @Autowired TestRestTemplate rest;
}</code></pre>
<p><strong>Key points:</strong> slice tests start in a fraction of the time; the application context is <em>cached</em> across tests with identical configuration, so gratuitously varying <code>@MockitoBean</code> or properties per test class silently multiplies your build time. Testcontainers gives you the real database instead of H2, which matters because H2 does not behave like PostgreSQL.</p>`
},
{
  q: "How do you implement caching in Spring Boot?",
  level: "advanced", tags: ["caching", "performance"],
  a: `<pre><code>@EnableCaching                       // on a @Configuration class
@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id", unless = "#result == null")
    public Product find(Long id) { return repo.findById(id).orElse(null); }

    @CachePut(value = "products", key = "#p.id")     // always executes, updates cache
    public Product update(Product p) { return repo.save(p); }

    @CacheEvict(value = "products", key = "#id")
    public void delete(Long id) { repo.deleteById(id); }

    @CacheEvict(value = "products", allEntries = true)
    @Scheduled(fixedRate = 3_600_000)
    public void evictAll() { }
}</code></pre>
<pre><code>spring:
  cache:
    type: caffeine
    caffeine.spec: maximumSize=10000,expireAfterWrite=10m
# or Redis for a distributed cache
  data.redis.host: redis</code></pre>
<p><strong>Things that show experience:</strong></p>
<ul>
<li>It is proxy-based, so the <strong>self-invocation limitation applies</strong> — an internal call is not cached.</li>
<li>Always set a <strong>TTL and a maximum size</strong>. An unbounded cache is a memory leak with a friendly name.</li>
<li>Cache the <em>value object</em>, never a JPA entity attached to a closed session — you will get <code>LazyInitializationException</code> or stale data.</li>
<li>Local cache (Caffeine) is fast but each instance has its own copy — inconsistent across replicas. Redis is consistent but adds a network hop and serialisation cost. Choose deliberately.</li>
<li>Name the classic problems: <strong>cache stampede</strong> (many threads miss at once — use <code>sync = true</code>), <strong>stale data</strong>, and <strong>cache penetration</strong> on nulls.</li>
</ul>`
},
{
  q: "What is @Async and how do you configure it properly?",
  level: "advanced", tags: ["async"],
  a: `<pre><code>@Configuration @EnableAsync
public class AsyncConfig {
    @Bean("taskExecutor")
    public Executor taskExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(8);
        ex.setMaxPoolSize(16);
        ex.setQueueCapacity(500);                       // BOUNDED
        ex.setThreadNamePrefix("async-");               // shows up in thread dumps
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(30);
        return ex;
    }
}

@Service
public class ReportService {
    @Async("taskExecutor")
    public CompletableFuture&lt;Report&gt; generate(Long id) {
        return CompletableFuture.completedFuture(build(id));
    }
}</code></pre>
<p><strong>Gotchas that get asked:</strong></p>
<ul>
<li>Proxy-based — self-invocation does not go async, and the method must be <code>public</code>.</li>
<li>Return <code>void</code> or <code>CompletableFuture&lt;T&gt;</code>. A plain return value is silently discarded.</li>
<li>Exceptions from a <code>void</code> <code>@Async</code> method vanish unless you register an <code>AsyncUncaughtExceptionHandler</code>.</li>
<li><strong>The default executor</strong> was <code>SimpleAsyncTaskExecutor</code>, which creates an unbounded number of threads. Always define your own.</li>
<li>ThreadLocal context (security, MDC trace IDs, transactions) does <strong>not</strong> propagate. Use <code>DelegatingSecurityContextAsyncTaskExecutor</code> and an MDC-copying task decorator.</li>
<li>A <code>@Transactional</code> caller's transaction does not extend into the async thread — a very common source of "the entity does not exist yet" bugs.</li>
</ul>
<p>With Spring Boot 3.2+ on Java 21, <code>spring.threads.virtual.enabled=true</code> makes much of this pool tuning unnecessary.</p>`
},
{
  q: "What is the difference between Spring MVC and WebFlux?",
  level: "advanced", tags: ["webflux", "architecture"],
  a: `<table>
<tr><th></th><th>Spring MVC</th><th>WebFlux</th></tr>
<tr><td>Model</td><td>Thread per request, blocking</td><td>Event loop, non-blocking</td></tr>
<tr><td>API</td><td>Servlet</td><td>Reactive Streams (<code>Mono</code>, <code>Flux</code>)</td></tr>
<tr><td>Server</td><td>Tomcat/Jetty/Undertow</td><td>Netty (default)</td></tr>
<tr><td>Concurrency limit</td><td>Thread pool size (~200)</td><td>Memory and event loop capacity</td></tr>
<tr><td>Debugging</td><td>Straightforward stack traces</td><td>Hard — fragmented stacks</td></tr>
<tr><td>Ecosystem</td><td>Mature, JPA works</td><td>Needs reactive drivers (R2DBC); JPA blocks</td></tr>
</table>
<pre><code>// MVC
@GetMapping("/{id}") Order get(@PathVariable Long id) { return service.find(id); }

// WebFlux
@GetMapping("/{id}") Mono&lt;Order&gt; get(@PathVariable Long id) { return service.find(id); }
@GetMapping(produces = TEXT_EVENT_STREAM_VALUE) Flux&lt;Event&gt; stream() { ... }</code></pre>
<p><strong>When WebFlux genuinely wins:</strong> very high concurrency with mostly I/O waiting, streaming/SSE/WebSocket workloads, and API gateways fanning out to many services.</p>
<p><strong>The current honest take:</strong> with <strong>virtual threads in Java 21</strong>, plain MVC gets much of WebFlux's scalability while keeping blocking, debuggable, sequential code. For a typical CRUD microservice, MVC + virtual threads is now the pragmatic default, and WebFlux is reserved for genuine streaming needs. Saying this shows you are current rather than repeating 2019 advice.</p>
<p><strong>The cardinal rule:</strong> one blocking call anywhere in a WebFlux chain blocks an event-loop thread and destroys throughput. If you cannot make the whole stack reactive, do not go reactive.</p>`
},
{
  q: "How do you make a Spring Boot application start faster and use less memory?",
  level: "advanced", tags: ["performance", "production"],
  a: `<ol>
<li><strong>Trim the classpath.</strong> Every starter adds auto-configurations to evaluate. Run with <code>--debug</code> and remove what you do not use.</li>
<li><strong>Lazy initialisation</strong> — <code>spring.main.lazy-initialization=true</code> defers bean creation until first use. Great for dev and tests; risky in production because it moves failures from startup to runtime.</li>
<li><strong><code>@Configuration(proxyBeanMethods = false)</code></strong> avoids CGLIB proxying of config classes.</li>
<li><strong>Exclude unneeded auto-configurations</strong> explicitly.</li>
<li><strong>Class Data Sharing (CDS)</strong> — Spring Boot 3.3+ supports AOT-generated CDS archives that cut startup meaningfully.</li>
<li><strong>Spring AOT + GraalVM native image</strong> — startup drops from seconds to tens of milliseconds and memory by 5–10×, at the cost of build time and reflection restrictions. The right tool for serverless and scale-to-zero.</li>
<li><strong>Tune the JVM for containers</strong> — <code>-XX:MaxRAMPercentage=75</code>, and consider <code>-XX:TieredStopAtLevel=1</code> for short-lived jobs.</li>
<li><strong>Defer the expensive work</strong> — do not warm caches or run migrations synchronously in <code>@PostConstruct</code> if a readiness probe can cover it instead.</li>
</ol>
<p>Measure with <code>ApplicationStartup</code>: <code>SpringApplication.setApplicationStartup(new BufferingApplicationStartup(2048))</code> then read <code>/actuator/startup</code> to see exactly which beans cost you.</p>`
},
{
  q: "How would you structure a Spring Boot project?",
  level: "advanced", tags: ["architecture"],
  a: `<p><strong>Package by feature, not by layer</strong> — this is the answer that separates seniors from juniors.</p>
<pre><code>com.acme.orders
├── OrderController.java          // web adapter
├── OrderService.java             // application logic
├── OrderRepository.java          // persistence port
├── Order.java                    // domain entity
├── dto/                          // request/response records
└── OrderNotFoundException.java

com.acme.payments
└── ...same shape

com.acme.common                   // shared config, error handling, security
└── config/</code></pre>
<p><strong>Why:</strong> a change to "orders" touches one package instead of five. Package-private visibility can then enforce that <code>OrderRepository</code> is not reachable from <code>payments</code> — real encapsulation, which layered packaging (<code>controller/</code>, <code>service/</code>, <code>repository/</code>) makes impossible because everything must be public.</p>
<p>For bigger systems, mention <strong>hexagonal/clean architecture</strong>: a framework-free <code>domain</code> at the centre, <code>application</code> use cases around it, and <code>adapters</code> (web, persistence, messaging) at the edge, with dependencies pointing inward. Then admit the trade-off honestly — it is worth it for complex domains and overkill for a CRUD service. And mention <strong>ArchUnit</strong> for enforcing the rules in a test rather than in code review.</p>`
},
{
  q: "How do you implement pagination and sorting?",
  level: "beginner", tags: ["rest", "data"],
  a: `<pre><code>@GetMapping("/orders")
public Page&lt;OrderDto&gt; list(
        @RequestParam(required = false) String status,
        @PageableDefault(size = 20, sort = "createdAt", direction = DESC) Pageable pageable) {
    return service.search(status, pageable).map(mapper::toDto);
}
// GET /orders?page=0&amp;size=20&amp;sort=createdAt,desc&amp;sort=id,asc

// Repository
Page&lt;Order&gt; findByStatus(String status, Pageable pageable);</code></pre>
<p><code>Page</code> runs a second <code>count</code> query to report <code>totalElements</code> and <code>totalPages</code>. If you do not need the total, return <code>Slice</code> instead — it just fetches one extra row to know whether a next page exists, avoiding the expensive count on large tables.</p>
<p><strong>Advanced point worth raising:</strong> offset pagination degrades badly — <code>OFFSET 100000</code> makes the database scan and discard 100,000 rows, and rows shift under the user as data changes. For large or real-time datasets use <strong>keyset (cursor) pagination</strong>:</p>
<pre><code>-- stable and O(log n) regardless of depth
SELECT * FROM orders
WHERE (created_at, id) &lt; (:lastCreatedAt, :lastId)
ORDER BY created_at DESC, id DESC
LIMIT 20;</code></pre>
<p>Also cap the page size server-side — otherwise <code>?size=1000000</code> is a free denial-of-service.</p>`
},
{
  q: "How do you version and document a Spring Boot API?",
  level: "advanced", tags: ["rest", "openapi"],
  a: `<p><strong>Versioning strategies:</strong></p>
<ul>
<li><strong>URI path</strong> — <code>/api/v1/orders</code>. Most common, most visible, easiest to route and cache. My default.</li>
<li><strong>Header</strong> — <code>X-API-Version: 2</code> or content negotiation via <code>Accept: application/vnd.acme.v2+json</code>. Purer REST, harder to test in a browser.</li>
<li><strong>Query parameter</strong> — <code>?version=2</code>. Simple but easy to forget.</li>
</ul>
<p>The rule that matters more than the strategy: <strong>version only on breaking changes</strong>. Adding an optional field is not breaking; removing or renaming one is. Keep the old version alive with a documented deprecation window and a <code>Sunset</code> header.</p>
<pre><code>&lt;dependency&gt;
  &lt;groupId&gt;org.springdoc&lt;/groupId&gt;
  &lt;artifactId&gt;springdoc-openapi-starter-webmvc-ui&lt;/artifactId&gt;
&lt;/dependency&gt;
&lt;!-- Swagger UI at /swagger-ui.html, spec at /v3/api-docs --&gt;</code></pre>
<pre><code>@Operation(summary = "Fetch an order", description = "Returns a single order by id")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Found"),
    @ApiResponse(responseCode = "404", description = "No such order",
                 content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
})
@GetMapping("/{id}")
OrderDto get(@Parameter(description = "Order id") @PathVariable Long id) { ... }</code></pre>
<p>Worth mentioning from experience: generating <em>clients</em> from the spec with <strong>OpenAPI Generator</strong> keeps consumers in sync automatically, and committing the generated spec lets CI diff it to catch accidental breaking changes before release.</p>`
},
{
  q: "What is Spring Boot DevTools and what does it do?",
  level: "beginner", tags: ["tooling"],
  a: `<ul>
<li><strong>Automatic restart</strong> — two classloaders: a base loader for unchanging jars and a restart loader for your classes. Only the second is discarded and reloaded, so restarts are far faster than a cold boot.</li>
<li><strong>LiveReload</strong> — a server that refreshes the browser on resource change.</li>
<li><strong>Sensible dev defaults</strong> — template and static resource caching disabled, more verbose web logging.</li>
<li><strong>Remote debug/update</strong> support (use with care).</li>
</ul>
<pre><code>&lt;dependency&gt;
  &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
  &lt;artifactId&gt;spring-boot-devtools&lt;/artifactId&gt;
  &lt;optional&gt;true&lt;/optional&gt;      &lt;!-- not transitive, excluded from the fat jar --&gt;
&lt;/dependency&gt;</code></pre>
<p>It disables itself automatically when running from a packaged jar, so it never reaches production. For true hot-swapping of method bodies without restart, mention JRebel or the JVM's own HotSwap (limited to method bodies).</p>`
},
{
  q: "How do you handle database migrations in Spring Boot?",
  level: "advanced", hot: true, tags: ["flyway", "database"],
  a: `<p>Use <strong>Flyway</strong> or <strong>Liquibase</strong>. Never <code>spring.jpa.hibernate.ddl-auto=update</code> in production — it cannot drop or rename safely, it is not reviewable, it is not reproducible, and it will happily diverge between environments.</p>
<pre><code>src/main/resources/db/migration/
├── V1__create_order_table.sql
├── V2__add_status_index.sql
└── V3__add_customer_fk.sql</code></pre>
<pre><code>spring:
  flyway:
    enabled: true
    baseline-on-migrate: true      # for an existing database
    locations: classpath:db/migration
  jpa:
    hibernate.ddl-auto: validate   # validate ONLY — catches entity/schema drift at startup</code></pre>
<p><strong>Production practices worth stating:</strong></p>
<ul>
<li>Migrations are <strong>immutable once merged</strong>. Flyway checksums them; editing an applied script breaks every environment.</li>
<li>Write <strong>backwards-compatible</strong> migrations so a rolling deploy works while both versions run: add a nullable column → deploy code that writes both → backfill → make it non-null → remove the old column in a later release. Never rename in one step.</li>
<li>Beware locking DDL on large tables — in PostgreSQL use <code>CREATE INDEX CONCURRENTLY</code> and set a <code>lock_timeout</code>.</li>
<li>Run migrations as a separate init container or job in Kubernetes so several replicas do not race (Flyway does take a lock, but a dedicated step is cleaner and easier to roll back).</li>
</ul>`
}
]);
