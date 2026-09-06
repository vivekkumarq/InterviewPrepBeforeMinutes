appendTopic("spring-boot", [
{
  q: "How do you write your own Spring Boot starter?",
  level: "advanced", hot: true, tags: ["autoconfiguration"],
  a: `<p>A starter is two artefacts by convention: <code>acme-spring-boot-starter</code> (just dependencies) and <code>acme-spring-boot-autoconfigure</code> (the configuration). Small libraries often combine them.</p>
<pre><code>// 1. Type-safe properties
@ConfigurationProperties(prefix = "acme.audit")
@Validated
public record AuditProperties(
        boolean enabled,
        @NotBlank String destination,
        @DefaultValue("30s") Duration flushInterval) { }

// 2. The auto-configuration
@AutoConfiguration
@ConditionalOnClass(AuditService.class)                    // library present?
@ConditionalOnProperty(prefix = "acme.audit", name = "enabled", havingValue = "true",
                       matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean                              // let the user override
    public AuditService auditService(AuditProperties props) {
        return new AuditService(props.destination(), props.flushInterval());
    }
}</code></pre>
<pre><code># 3. Registration file (Boot 3.x)
src/main/resources/META-INF/spring/
    org.springframework.boot.autoconfigure.AutoConfiguration.imports

com.acme.audit.AuditAutoConfiguration</code></pre>
<p><strong>The four rules that make a starter well-behaved:</strong></p>
<ul>
<li><strong>Always <code>@ConditionalOnMissingBean</code></strong> so an application can replace your bean without excluding your auto-configuration.</li>
<li><strong>Provide a property to disable it entirely</strong> — <code>@ConditionalOnProperty</code> with <code>matchIfMissing</code>.</li>
<li><strong>Add <code>spring-boot-configuration-processor</code></strong> so users get IDE autocompletion and documentation for your properties.</li>
<li><strong>Name it <code>xxx-spring-boot-starter</code></strong> — <code>spring-boot-starter-xxx</code> is reserved for the Spring team.</li>
</ul>
<p>Use <code>@AutoConfigureAfter</code>/<code>@AutoConfigureBefore</code> when your configuration must see another one's beans, and test with <code>ApplicationContextRunner</code>, which lets you assert exactly which beans appear under which properties.</p>`
},
{
  q: "How do you test auto-configuration with ApplicationContextRunner?",
  level: "advanced", tags: ["testing", "autoconfiguration"],
  a: `<pre><code>class AuditAutoConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(AuditAutoConfiguration.class));

    @Test
    void registersServiceByDefault() {
        runner.run(context -&gt; assertThat(context).hasSingleBean(AuditService.class));
    }

    @Test
    void backsOffWhenDisabled() {
        runner.withPropertyValues("acme.audit.enabled=false")
              .run(context -&gt; assertThat(context).doesNotHaveBean(AuditService.class));
    }

    @Test
    void userBeanWins() {
        runner.withUserConfiguration(CustomAuditConfig.class)
              .run(context -&gt; assertThat(context).getBean(AuditService.class)
                      .isSameAs(context.getBean("customAudit")));
    }

    @Test
    void failsOnInvalidProperties() {
        runner.withPropertyValues("acme.audit.destination=")     // @NotBlank violated
              .run(context -&gt; assertThat(context).hasFailed()
                      .getFailure().hasMessageContaining("destination"));
    }

    @Test
    void bindsProperties() {
        runner.withPropertyValues("acme.audit.flush-interval=10s")
              .run(context -&gt; assertThat(context.getBean(AuditProperties.class).flushInterval())
                      .isEqualTo(Duration.ofSeconds(10)));
    }
}</code></pre>
<p><strong>Why this is the right tool:</strong> each <code>run()</code> builds a tiny context with exactly the configuration under test, in milliseconds — no <code>@SpringBootTest</code>, no database, no web server. It also lets you assert on <em>failure</em>, which is otherwise awkward, and on conditional back-off behaviour that is the whole point of an auto-configuration.</p>
<p>Variants: <code>WebApplicationContextRunner</code> and <code>ReactiveWebApplicationContextRunner</code> for web-specific conditions. <code>withClassLoader(new FilteredClassLoader(SomeLib.class))</code> simulates a missing dependency to test <code>@ConditionalOnClass</code>.</p>`
},
{
  q: "What is the difference between application.properties, application.yml and profiles-specific files?",
  level: "beginner", tags: ["configuration"],
  a: `<pre><code># application.yml — always loaded, holds defaults
spring:
  application.name: order-service
  jpa.open-in-view: false
server.port: 8080
app:
  retry.max: 3

---                                    # multi-document YAML: profile-specific in ONE file
spring:
  config.activate.on-profile: prod
  jpa.hibernate.ddl-auto: validate
logging.level.root: WARN

---
spring:
  config.activate.on-profile: dev
logging.level.com.acme: DEBUG</code></pre>
<p><strong>Loading order:</strong> <code>application.yml</code> is loaded first, then <code>application-{profile}.yml</code> overrides it. Files <em>outside</em> the jar (in <code>./config/</code> or the working directory) override those inside it — which is how you drop a config file next to a jar without rebuilding.</p>
<table>
<tr><th></th><th>.properties</th><th>.yml</th></tr>
<tr><td>Nesting</td><td>Flat, repetitive prefixes</td><td>Hierarchical, less repetition</td></tr>
<tr><td>Lists</td><td><code>app.tags[0]=a</code></td><td><code>- a</code></td></tr>
<tr><td>Multi-document</td><td>No</td><td>Yes (<code>---</code>)</td></tr>
<tr><td>Whitespace sensitive</td><td>No</td><td><strong>Yes</strong> — a real source of bugs</td></tr>
<tr><td><code>@PropertySource</code></td><td>Supported</td><td><strong>Not supported</strong></td></tr>
</table>
<p><strong>Practical guidance:</strong> use YAML for readability, but keep environment-specific <em>secrets</em> out of both — inject them as environment variables from a secret manager. Prefer <code>@ConfigurationProperties</code> over scattered <code>@Value</code> so configuration is validated and typed, and remember that if both a <code>.properties</code> and a <code>.yml</code> exist, <code>.properties</code> wins.</p>
<p>Spring Boot 2.4+ also supports <code>spring.config.import</code> for pulling in extra files, Vault, Consul or Kubernetes ConfigMaps.</p>`
},
{
  q: "How does Spring Boot logging work and how do you configure it?",
  level: "beginner", tags: ["logging", "production"],
  a: `<p>Spring Boot uses <strong>SLF4J</strong> as the facade and <strong>Logback</strong> as the default implementation, with bridges that route JUL, Log4j and Commons Logging through the same pipeline.</p>
<pre><code>logging:
  level:
    root: INFO
    com.acme: DEBUG
    org.hibernate.SQL: DEBUG
    org.springframework.transaction.interceptor: TRACE   # see every transaction decision
  pattern:
    console: "%d{ISO8601} %5p [%X{traceId:-},%X{spanId:-}] %logger{36} - %m%n"
  file:
    name: /var/log/app/application.log
  logback.rollingpolicy:
    max-file-size: 50MB
    max-history: 14</code></pre>
<pre><code>@Slf4j                                          // Lombok, or a manual LoggerFactory line
@Service
public class OrderService {
    public void place(Order o) {
        log.info("placing order id={} customer={}", o.id(), o.customerId());  // PARAMETERISED
        // NOT: log.info("placing order " + o) — builds the string even when INFO is disabled
    }
}</code></pre>
<p><strong>Practices that matter in production:</strong></p>
<ul>
<li><strong>Structured JSON logging</strong> (logstash-logback-encoder) so fields are queryable in ELK/Loki rather than parsed from prose.</li>
<li><strong>MDC for correlation</strong> — put <code>traceId</code>, <code>userId</code> and <code>tenantId</code> in the MDC and include them in the pattern, so one request is traceable across every line. Micrometer Tracing populates these automatically.</li>
<li><strong>Change levels without a restart</strong> — <code>POST /actuator/loggers/com.acme {"configuredLevel":"DEBUG"}</code>. Invaluable during an incident.</li>
<li><strong>Never log secrets or PII</strong> — tokens, passwords, card numbers, full request bodies. Watch out for <code>toString()</code> on entities.</li>
<li><strong>Guard expensive calls</strong> — <code>if (log.isDebugEnabled())</code> only when building the argument is costly; parameterised logging already avoids the common case.</li>
</ul>`
},
{
  q: "What is @ConfigurationProperties with validation and constructor binding?",
  level: "advanced", hot: true, tags: ["configuration"],
  a: `<pre><code>@ConfigurationProperties(prefix = "app.payment")
@Validated                                        // enables JSR-380 validation at startup
public record PaymentProperties(
        @NotBlank String baseUrl,
        @NotNull @DurationMin(seconds = 1) Duration timeout,
        @Min(0) @Max(5) int retries,
        @Valid Gateway gateway,                   // @Valid CASCADES into nested types
        Map&lt;String, String&gt; headers,
        List&lt;@NotBlank String&gt; allowedCurrencies) {

    public record Gateway(@NotBlank String apiKey, @NotBlank String merchantId) { }

    public PaymentProperties {                    // compact constructor: defaults/normalise
        if (retries == 0) retries = 3;
        headers = headers == null ? Map.of() : Map.copyOf(headers);
    }
}

@EnableConfigurationProperties(PaymentProperties.class)   // or @ConfigurationPropertiesScan
@Configuration
class PaymentConfig { }</code></pre>
<pre><code>app:
  payment:
    base-url: https://api.gateway.com     # relaxed binding: base-url = baseUrl = BASE_URL
    timeout: 5s                           # Duration parsed from ISO or a suffixed value
    retries: 3
    gateway:
      api-key: \${PAYMENT_API_KEY}          # from the environment, never committed
    allowed-currencies: [INR, USD]</code></pre>
<p><strong>Why this beats scattered <code>@Value</code>:</strong></p>
<ul>
<li><strong>Fails fast at startup</strong> — a missing or invalid property stops the deployment instead of failing at 2am on the first request that reads it.</li>
<li><strong>Type-safe and immutable</strong> with records; no strings to typo at every usage site.</li>
<li><strong>Relaxed binding</strong> — kebab-case, camelCase and <code>SCREAMING_SNAKE</code> environment variables all bind, which is what makes container configuration painless.</li>
<li><strong>Rich conversions</strong> — <code>Duration</code>, <code>DataSize</code>, enums, <code>List</code>, <code>Map</code> and nested objects out of the box.</li>
<li><strong>IDE autocompletion</strong> via <code>spring-boot-configuration-processor</code>.</li>
</ul>
<p>Constructor binding (automatic for records) makes the properties object genuinely immutable, so nothing can mutate configuration at runtime.</p>`
},
{
  q: "How do you customise the Jackson ObjectMapper in Spring Boot?",
  level: "advanced", tags: ["json"],
  a: `<pre><code># The lightest option — properties only
spring.jackson:
  default-property-inclusion: non_null      # omit nulls from responses
  serialization:
    write-dates-as-timestamps: false        # ISO-8601 instead of epoch millis
    fail-on-empty-beans: false
  deserialization:
    fail-on-unknown-properties: false       # tolerant reader — important for API evolution
  time-zone: UTC</code></pre>
<pre><code>// Preferred for code-level tweaks: customise, do not replace
@Bean
Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
    return builder -&gt; builder
            .serializationInclusion(JsonInclude.Include.NON_NULL)
            .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .modules(new JavaTimeModule())
            .serializerByType(BigDecimal.class, new MoneySerializer());
}

// Per-field control
public record OrderDto(
        Long id,
        @JsonProperty("customer_id") Long customerId,
        @JsonFormat(shape = STRING, pattern = "yyyy-MM-dd") LocalDate placedOn,
        @JsonIgnore String internalNote,
        @JsonInclude(NON_EMPTY) List&lt;String&gt; tags) { }</code></pre>
<p><strong>Why customise rather than define your own <code>ObjectMapper</code> bean:</strong> replacing it wholesale discards Spring Boot's carefully assembled configuration — module registration, parameter names, the <code>JavaTimeModule</code>, and consistency with the rest of the framework. <code>Jackson2ObjectMapperBuilderCustomizer</code> layers on top instead.</p>
<p><strong>Two things that bite in practice:</strong> keeping <code>fail-on-unknown-properties</code> <em>disabled</em> is what lets a producer add a field without breaking every consumer (the tolerant reader principle). And serialising <code>BigDecimal</code> money as a JSON number can lose precision in JavaScript clients — serialise as a string, or send minor units as an integer.</p>`
},
{
  q: "How do you implement file upload and download in Spring Boot?",
  level: "beginner", tags: ["rest", "web"],
  a: `<pre><code>spring.servlet.multipart:
  max-file-size: 10MB
  max-request-size: 12MB
  file-size-threshold: 2KB      # buffer to disk beyond this</code></pre>
<pre><code>@PostMapping(value = "/documents", consumes = MULTIPART_FORM_DATA_VALUE)
public DocumentDto upload(@RequestPart("file") MultipartFile file,
                          @RequestPart("meta") @Valid DocumentMeta meta) {

    if (file.isEmpty()) throw new BadRequestException("file is empty");

    // NEVER trust the client-provided filename or content type
    String contentType = tika.detect(file.getInputStream());          // sniff the real type
    if (!ALLOWED.contains(contentType)) throw new BadRequestException("unsupported type");
    String safeName = UUID.randomUUID() + extensionFor(contentType);  // do not reuse user input

    try (InputStream in = file.getInputStream()) {
        return storage.store(safeName, in, file.getSize(), meta);     // stream, do not getBytes()
    }
}

@GetMapping("/documents/{id}")
public ResponseEntity&lt;Resource&gt; download(@PathVariable String id) {
    var doc = storage.load(id);
    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(doc.contentType()))
            .contentLength(doc.size())
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment().filename(doc.name(), UTF_8).toString())
            .body(new InputStreamResource(doc.stream()));             // streamed, not buffered
}</code></pre>
<p><strong>The security points that matter, and are the real content of this question:</strong></p>
<ul>
<li><strong>Path traversal</strong> — a filename of <code>../../etc/passwd</code>. Never use the client filename for the stored path; generate your own.</li>
<li><strong>Content-type spoofing</strong> — the declared type is client-controlled. Sniff the actual bytes.</li>
<li><strong>Size limits</strong> at the framework <em>and</em> reverse proxy, or an upload becomes a denial of service.</li>
<li><strong>Do not call <code>getBytes()</code></strong> on a large upload — it loads the whole file into heap. Stream it.</li>
<li><strong>Serve downloads with <code>Content-Disposition: attachment</code></strong> so an uploaded HTML file cannot execute as stored XSS on your domain.</li>
</ul>
<p>At scale, prefer <strong>pre-signed URLs</strong> so clients upload directly to S3 and the file never transits your service at all.</p>`
},
{
  q: "What are the Spring Boot Actuator health indicators and Kubernetes probes?",
  level: "advanced", hot: true, tags: ["actuator", "kubernetes"],
  a: `<pre><code>management:
  endpoint.health:
    probes.enabled: true            # enables /health/liveness and /health/readiness
    show-details: when-authorized
    group:
      readiness:
        include: db, kafka, diskSpace
      liveness:
        include: livenessState      # deliberately NO external dependencies
  server.port: 9090                 # separate port from application traffic</code></pre>
<pre><code>@Component
public class KafkaHealthIndicator implements HealthIndicator {
    @Override public Health health() {
        try {
            var nodes = adminClient.describeCluster().nodes().get(2, SECONDS);
            return Health.up().withDetail("brokers", nodes.size()).build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}</code></pre>
<pre><code># Kubernetes
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 9090 }
  failureThreshold: 3
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 9090 }
  failureThreshold: 2
startupProbe:                       # JVM apps boot slowly — prevents restart loops
  httpGet: { path: /actuator/health/liveness, port: 9090 }
  failureThreshold: 30
  periodSeconds: 5</code></pre>
<p><strong>The mistake that causes outages:</strong> including the database in the <strong>liveness</strong> probe. When the database has a brief hiccup, every pod reports unhealthy, Kubernetes restarts all of them at once, and a recoverable blip becomes a full outage — restarting your pod does not fix someone else's database.</p>
<p><strong>The rule:</strong> liveness answers "is this process wedged and beyond recovery?" — cheap and local. Readiness answers "should I receive traffic right now?" — may check dependencies, because removing a pod from load balancing is safe and reversible.</p>
<p>Spring Boot also flips readiness to <code>OUT_OF_SERVICE</code> automatically during graceful shutdown, so traffic stops arriving before the application stops accepting it.</p>`
},
{
  q: "How do you expose custom metrics with Micrometer?",
  level: "advanced", hot: true, tags: ["metrics", "production"],
  a: `<pre><code>@Service
@RequiredArgsConstructor
public class OrderService {
    private final MeterRegistry registry;

    // Counter — monotonically increasing events
    public void place(Order o) {
        registry.counter("orders.placed",
                "channel", o.channel(),
                "currency", o.currency()).increment();
    }

    // Timer — duration + count + max, gives you rate and latency together
    public Receipt charge(Order o) {
        return registry.timer("payment.charge", "provider", o.provider())
                       .record(() -&gt; gateway.charge(o));
    }

    // Gauge — a value sampled at scrape time (queue depth, cache size)
    @PostConstruct void gauges() {
        Gauge.builder("orders.pending", pendingRepo, PendingRepository::count)
             .description("orders awaiting payment")
             .register(registry);
    }

    // DistributionSummary — non-time measurements (payload size, order value)
    registry.summary("order.value", "currency", "INR").record(o.total().doubleValue());
}

// Annotation-driven alternative
@Timed(value = "report.generate", percentiles = {0.5, 0.95, 0.99})
public Report generate(Long id) { ... }</code></pre>
<pre><code>management:
  endpoints.web.exposure.include: health,info,prometheus
  metrics.tags.application: \${spring.application.name}
  metrics.distribution.percentiles-histogram.http.server.requests: true</code></pre>
<p><strong>The critical rule about tags:</strong> every distinct tag combination creates a new time series. Tagging with a user ID, order ID, email or full URL path causes <strong>cardinality explosion</strong> — it will take down your Prometheus server, not just make it slow. Tag with bounded values only: status, endpoint template, provider, region.</p>
<p><strong>What to measure:</strong> business events (orders placed, payments failed), the RED metrics per endpoint (rate, errors, duration), and saturation signals (queue depth, pool usage). Alert on p95/p99 latency and error rate — never on averages, which hide exactly the users having a bad time.</p>`
},
{
  q: "How do you handle CORS, filters and interceptors in Spring Boot?",
  level: "advanced", tags: ["web"],
  a: `<table>
<tr><th></th><th>Filter</th><th>Interceptor</th><th>Aspect</th></tr>
<tr><td>Level</td><td>Servlet container</td><td>Spring MVC</td><td>Any Spring bean</td></tr>
<tr><td>Runs</td><td>Before/after the DispatcherServlet</td><td>Around handler execution</td><td>Around a method call</td></tr>
<tr><td>Knows the handler</td><td>No</td><td><strong>Yes</strong> — the controller method</td><td>Yes</td></tr>
<tr><td>Can modify request/response body</td><td>Yes (wrapping)</td><td>Limited</td><td>No</td></tr>
<tr><td>Use for</td><td>Auth, CORS, compression, request logging, correlation IDs</td><td>Auth by handler annotation, timing, MDC per request</td><td>Business cross-cutting concerns</td></tr>
</table>
<pre><code>@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ... {
        String id = Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                            .orElseGet(() -&gt; UUID.randomUUID().toString());
        MDC.put("correlationId", id);
        res.setHeader("X-Correlation-Id", id);
        try { chain.doFilter(req, res); }
        finally { MDC.clear(); }              // MANDATORY — pooled threads are reused
    }
}

@Component
public class TimingInterceptor implements HandlerInterceptor {
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if (handler instanceof HandlerMethod hm &amp;&amp;
            hm.hasMethodAnnotation(RateLimited.class)) { ... }   // sees the controller method
        return true;
    }
}
@Configuration
class WebConfig implements WebMvcConfigurer {
    public void addInterceptors(InterceptorRegistry r) {
        r.addInterceptor(timingInterceptor).addPathPatterns("/api/**");
    }
}</code></pre>
<p><strong>The MDC cleanup in a <code>finally</code> block is not optional</strong> — pooled request threads are reused, so a leaked MDC value attaches the previous request's correlation ID (or worse, tenant ID) to the next one.</p>
<p><strong>CORS ordering trap:</strong> when Spring Security is on the classpath, its filter chain runs before MVC, so <code>@CrossOrigin</code> alone is not enough — the preflight <code>OPTIONS</code> is rejected as unauthenticated. Enable CORS on the security chain (<code>http.cors(...)</code>) with a <code>CorsConfigurationSource</code> bean. That is the classic "works in Postman, fails in the browser" bug.</p>`
}
]);
