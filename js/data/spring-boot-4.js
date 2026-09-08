appendTopic("spring-boot", [
{
  q: "How do you externalise configuration, and what is the property precedence order?",
  level: "beginner", hot: true, tags: ["configuration", "production", "best-practice"],
  companies: ["Amazon", "Optum", "TCS", "Infosys", "Wipro", "SAP", "Maersk", "Cognizant"],
  a: `<p><strong>Precedence, highest first</strong> — later sources override earlier ones, and knowing the top three is what matters in practice:</p>
<table>
<tr><th>#</th><th>Source</th></tr>
<tr><td>1</td><td>Command line arguments (<code>--server.port=9090</code>)</td></tr>
<tr><td>2</td><td><code>SPRING_APPLICATION_JSON</code></td></tr>
<tr><td>3</td><td><strong>OS environment variables</strong> — how containers and Kubernetes inject config</td></tr>
<tr><td>4</td><td>Java system properties (<code>-D</code>)</td></tr>
<tr><td>5</td><td><code>application-{profile}.yml</code> <em>outside</em> the jar</td></tr>
<tr><td>6</td><td><code>application-{profile}.yml</code> inside the jar</td></tr>
<tr><td>7</td><td><code>application.yml</code> outside, then inside the jar</td></tr>
<tr><td>8</td><td><code>@PropertySource</code></td></tr>
<tr><td>9</td><td>Defaults set with <code>SpringApplication.setDefaultProperties</code></td></tr>
</table>
<pre><code># The relaxed binding that makes environment variables work
# app.datasource.max-pool-size  ==  APP_DATASOURCE_MAXPOOLSIZE
# Dots become underscores, kebab-case collapses, everything uppercases.
# This is why you can configure any Spring property from a container env var.</code></pre>
<pre><code>// ✔ @ConfigurationProperties — typed, validated, testable
@ConfigurationProperties(prefix = "app.payment")
@Validated
public record PaymentProperties(
    @NotBlank String gatewayUrl,
    @Min(100) @Max(30_000) int timeoutMs,
    @DefaultValue("3") int maxRetries,
    Duration cacheTtl,                       // "30s", "5m" parsed automatically
    List&lt;String&gt; allowedCurrencies
) { }

@EnableConfigurationProperties(PaymentProperties.class)   // or @ConfigurationPropertiesScan
class PaymentConfig { }

// ✗ @Value scattered through the codebase
@Value("\${app.payment.timeout-ms:5000}") private int timeout;
// No validation, no IDE completion, no single place to see the config surface,
// and a typo fails at RUNTIME rather than at startup.</code></pre>
<table>
<tr><th></th><th><code>@Value</code></th><th><code>@ConfigurationProperties</code></th></tr>
<tr><td>Type safety</td><td>String parsing per field</td><td>Full binding, including nested objects and collections</td></tr>
<tr><td>Validation</td><td>None</td><td>JSR-380 via <code>@Validated</code> — <strong>fails at startup</strong></td></tr>
<tr><td>Relaxed binding</td><td>No — exact name only</td><td>Yes</td></tr>
<tr><td>SpEL</td><td>Yes</td><td>No</td></tr>
<tr><td>Metadata / IDE completion</td><td>No</td><td>Yes</td></tr>
<tr><td>Use for</td><td>One-off values</td><td><strong>Everything else</strong></td></tr>
</table>
<pre><code># Profiles, and the modern multi-document form
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: \${DB_URL}                 # no default — fail fast if unset
---
# Fail at STARTUP if a required property is missing, not at first request
# (a missing \${DB_URL} with no default does exactly this)</code></pre>
<p><strong>The rules to state:</strong> configuration comes from the environment, never from the artefact — one image is promoted through every environment. Secrets never live in <code>application.yml</code>; they come from a vault, a Kubernetes secret, or an env var injected at runtime. And prefer failing at startup over defaulting silently: a service that boots with the wrong database URL is worse than one that refuses to boot.</p>`
},
{
  q: "How do you design error handling for a Spring Boot REST API?",
  level: "advanced", hot: true, tags: ["errors", "rest", "best-practice", "design"],
  companies: ["Amazon", "Optum", "SAP", "Maersk", "Infosys", "EPAM", "Societe Generale", "Walmart"],
  a: `<pre><code>// Centralised handling — one place, not try/catch in every controller
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Spring 6 / Boot 3: ProblemDetail implements RFC 7807, the standard error shape
    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(NOT_FOUND, ex.getMessage());
        pd.setTitle("Order not found");
        pd.setType(URI.create("https://api.example.com/errors/order-not-found"));
        pd.setProperty("orderId", ex.getOrderId());
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
            .collect(toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -&gt; a)));
        return pd;
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception ex) {
        String traceId = MDC.get("traceId");
        log.error("unhandled [{}]", traceId, ex);          // full detail in the LOG
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            INTERNAL_SERVER_ERROR, "An unexpected error occurred");  // generic to the CLIENT
        pd.setProperty("traceId", traceId);                // the bridge between the two
        return pd;
    }
}</code></pre>
<pre><code>{
  "type": "https://api.example.com/errors/order-not-found",
  "title": "Order not found",
  "status": 404,
  "detail": "No order with id 4821",
  "instance": "/api/orders/4821",
  "orderId": 4821,
  "traceId": "8f2a1c9e"
}</code></pre>
<table>
<tr><th>Situation</th><th>Status</th></tr>
<tr><td>Malformed JSON, missing required field</td><td><strong>400</strong> Bad Request</td></tr>
<tr><td>No or invalid credentials</td><td><strong>401</strong> Unauthorized</td></tr>
<tr><td>Authenticated but not permitted</td><td><strong>403</strong> Forbidden</td></tr>
<tr><td>Resource does not exist</td><td><strong>404</strong> Not Found</td></tr>
<tr><td>Conflicting state — duplicate, version mismatch</td><td><strong>409</strong> Conflict</td></tr>
<tr><td>Syntactically valid, semantically wrong</td><td><strong>422</strong> Unprocessable Entity</td></tr>
<tr><td>Rate limited</td><td><strong>429</strong> — include <code>Retry-After</code></td></tr>
<tr><td>Unexpected server fault</td><td><strong>500</strong> — never leak the stack trace</td></tr>
<tr><td>Downstream dependency failed</td><td><strong>502/503</strong> — 503 with <code>Retry-After</code> if transient</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Exception flowing from service through advice to a problem detail response">
  <rect class="dg-fill" x="16" y="52" width="110" height="34" rx="6"/><text class="dg-s" x="71" y="74" text-anchor="middle">service throws</text>
  <path class="dg-line" d="M130 69 H186" marker-end="url(#eh1)"/>
  <rect class="dg-fill" x="190" y="52" width="130" height="34" rx="6"/><text class="dg-s" x="255" y="74" text-anchor="middle">@RestControllerAdvice</text>
  <path class="dg-line" d="M324 69 H380" marker-end="url(#eh1)"/>
  <rect class="dg-fill2" x="384" y="42" width="150" height="54" rx="8"/>
  <text class="dg-s" x="459" y="64" text-anchor="middle">ProblemDetail</text>
  <text class="dg-s" x="459" y="82" text-anchor="middle">+ correct status</text>
  <text class="dg-s" x="16" y="122">the controller stays free of try/catch; every error leaves the API in ONE shape</text>
  <defs><marker id="eh1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The security rule to state explicitly:</strong> never return a stack trace, a SQL fragment, or an internal class name to a client — they are reconnaissance for an attacker. Log the full detail server-side with a correlation id, and return that id to the caller. Support can then find the exact request, and the client learns nothing about your internals.</p>
<p><strong>The design rule:</strong> throw domain exceptions from the service layer (<code>OrderNotFoundException</code>), not <code>ResponseStatusException</code>. HTTP status codes are a transport concern; keeping them in the advice means the same service can be called from a message listener or a scheduled job without dragging web semantics along.</p>`
},
{
  q: "What does Actuator give you, and how do you make a Spring Boot service production-ready?",
  level: "advanced", hot: true, tags: ["actuator", "observability", "production"],
  companies: ["Amazon", "Optum", "Maersk", "SAP", "Walmart", "Societe Generale", "Flipkart", "Nagarro"],
  a: `<pre><code>management:
  endpoints.web.exposure.include: health,info,metrics,prometheus,loggers
  endpoint.health:
    probes.enabled: true                 # /readiness and /liveness groups
    show-details: when-authorized
  server.port: 9090                      # separate port — never expose actuator publicly
  metrics.tags.application: order-service
  tracing.sampling.probability: 0.1</code></pre>
<table>
<tr><th>Endpoint</th><th>Use</th></tr>
<tr><td><code>/health/liveness</code></td><td>"Is the process wedged?" — Kubernetes restarts on failure. <strong>Must not check dependencies.</strong></td></tr>
<tr><td><code>/health/readiness</code></td><td>"Can it serve traffic?" — may check the database and downstream services</td></tr>
<tr><td><code>/prometheus</code></td><td>Metrics scrape endpoint (Micrometer)</td></tr>
<tr><td><code>/loggers</code></td><td><strong>Change log levels at runtime</strong> — invaluable mid-incident, no redeploy</td></tr>
<tr><td><code>/env</code>, <code>/configprops</code></td><td>Effective configuration — secure these, they leak config</td></tr>
<tr><td><code>/threaddump</code>, <code>/heapdump</code></td><td>Diagnostics without shell access to the container</td></tr>
<tr><td><code>/httpexchanges</code></td><td>Recent requests — useful in dev</td></tr>
</table>
<pre><code>// Custom health indicator — contributes to readiness
@Component
public class PaymentGatewayHealth implements HealthIndicator {
    @Override public Health health() {
        try {
            gateway.ping(Duration.ofSeconds(2));
            return Health.up().withDetail("region", region).build();
        } catch (Exception e) {
            // DOWN makes the pod NotReady and removes it from the load balancer.
            // Use OUT_OF_SERVICE or a custom status if the dependency is optional —
            // failing readiness for a non-critical dependency takes yourself offline.
            return Health.down(e).build();
        }
    }
}

// Custom metrics
@Timed(value = "order.processing", percentiles = {0.5, 0.95, 0.99})
public Order process(OrderRequest req) { }

meterRegistry.counter("orders.created", "channel", channel).increment();
meterRegistry.gauge("queue.depth", queue, Queue::size);</code></pre>
<p><strong>The liveness rule that causes real outages:</strong> a liveness probe must only answer "is this process alive". If it checks the database and the database has a hiccup, Kubernetes restarts <em>every</em> pod simultaneously — turning a slow dependency into a full outage. Dependency checks belong in <strong>readiness</strong>, which only removes the pod from load balancing.</p>
<pre><code>// Graceful shutdown, so a rolling deploy drops no requests
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s

// Structured logging with correlation, so logs are queryable
logging.structured.format.console=ecs        # Boot 3.4+
// Micrometer Tracing puts traceId and spanId in the MDC automatically</code></pre>
<table>
<tr><th>Production checklist</th><th>Why</th></tr>
<tr><td>Actuator on a separate port, not internet-facing</td><td><code>/env</code> and <code>/heapdump</code> are sensitive</td></tr>
<tr><td>Liveness, readiness and startup probes configured</td><td>A slow-starting app must not be killed while booting</td></tr>
<tr><td>Graceful shutdown + preStop delay</td><td>Endpoint removal is not instantaneous</td></tr>
<tr><td>Bounded connection pools and timeouts on every client</td><td>An unbounded wait is how one slow dependency takes down everything</td></tr>
<tr><td><code>-XX:MaxRAMPercentage</code>, heap dump on OOM</td><td>Container-aware sizing and post-mortem evidence</td></tr>
<tr><td>The four golden signals: latency, traffic, errors, saturation</td><td>Alert on these, not on CPU</td></tr>
</table>
<p><strong>The point to close on:</strong> "Observability is not the same as monitoring. Monitoring tells me a known thing broke; observability lets me ask a question I had not thought of before the incident. That is why I want metrics, structured logs and distributed traces correlated by a trace id — so I can go from an alert to the exact failing request in one hop."</p>`
}
]);
