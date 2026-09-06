registerTopic("microservices", [
{
  q: "What are microservices and what are the real trade-offs?",
  level: "beginner", hot: true, tags: ["basics", "architecture"],
  a: `<p>An architectural style where an application is a set of small, independently deployable services, each owning its data and communicating over the network.</p>
<table>
<tr><th>Benefits</th><th>Costs</th></tr>
<tr><td>Independent deployment and release cadence</td><td>Distributed systems complexity — network, partial failure, latency</td></tr>
<tr><td>Independent scaling of hot components</td><td>Data consistency becomes eventual; no distributed transactions</td></tr>
<tr><td>Technology diversity per service</td><td>Operational overhead — CI/CD, observability, service discovery for N services</td></tr>
<tr><td>Fault isolation</td><td>Debugging spans many services and logs</td></tr>
<tr><td>Team autonomy and clear ownership</td><td>Testing end-to-end is genuinely hard</td></tr>
</table>
<blockquote><p><strong>The answer that marks a senior engineer:</strong> "Microservices are a solution to an <em>organisational</em> scaling problem, not a technical one. If you have one team of six people, a well-structured modular monolith will ship faster and break less. Start there, extract services when a specific boundary proves it needs independent scaling or deployment."</p></blockquote>
<p>Martin Fowler's "MonolithFirst" and the idea of the <strong>modular monolith</strong> are worth naming — they show you are not cargo-culting.</p>`
},
{
  q: "How do you decide service boundaries?",
  level: "advanced", hot: true, tags: ["design", "ddd"],
  a: `<p>The wrong way: split by technical layer (a "database service", a "UI service") — that produces a distributed monolith where every feature needs three deployments.</p>
<p><strong>The right way — Domain-Driven Design:</strong></p>
<ol>
<li><strong>Bounded context</strong> — a boundary within which a term has one unambiguous meaning. "Customer" in Sales and "Customer" in Billing are different models; that boundary is a service candidate.</li>
<li><strong>Business capability</strong> — Ordering, Inventory, Payments, Shipping. Each owns a coherent capability end to end.</li>
<li><strong>Aggregate</strong> — the transactional consistency boundary. A service should own whole aggregates so it never needs a distributed transaction.</li>
<li><strong>Team ownership (Conway's Law)</strong> — the architecture will mirror your communication structure, so design them together.</li>
</ol>
<p><strong>Practical tests for a good boundary:</strong></p>
<ul>
<li>Can it be <strong>deployed independently</strong> without coordinating a release with another team?</li>
<li>Does it own its data, with no other service reading its tables?</li>
<li>Do typical features change <em>one</em> service, not five? (High coupling shows up as synchronised deployments.)</li>
<li>Is the chattiness acceptable — are you making 20 network calls to render one screen?</li>
</ul>
<p>If a "service" cannot be deployed without another one, it is not a service — it is a module with network latency.</p>`
},
{
  q: "How do microservices communicate? Synchronous vs asynchronous",
  level: "beginner", hot: true, tags: ["communication"],
  a: `<table>
<tr><th></th><th>Synchronous (REST, gRPC)</th><th>Asynchronous (Kafka, RabbitMQ)</th></tr>
<tr><td>Coupling</td><td>Temporal — the callee must be up</td><td>Decoupled — the broker buffers</td></tr>
<tr><td>Consistency</td><td>Immediate</td><td>Eventual</td></tr>
<tr><td>Failure impact</td><td>Cascades to the caller</td><td>Isolated; messages wait</td></tr>
<tr><td>Complexity</td><td>Simple to reason about</td><td>Harder — ordering, duplicates, debugging</td></tr>
<tr><td>Use for</td><td>Query and read paths needing a fresh answer</td><td>State changes others react to</td></tr>
</table>
<p><strong>The rule I would state:</strong> use synchronous calls for <em>queries</em>, asynchronous events for <em>state changes</em>. A chain of five synchronous calls multiplies latency and failure probability — with 99.9% availability each, five in series gives 99.5%.</p>
<pre><code>// Bad: order service synchronously calls inventory, payment, shipping, email
// One slow service makes checkout slow; one down service makes checkout fail.

// Better: commit the order, publish an event, let consumers react
orderRepo.save(order);
publisher.publish(new OrderPlacedEvent(order.id(), order.items()));
// inventory reserves, payment charges, shipping schedules, email notifies — independently</code></pre>
<p>Also distinguish <strong>orchestration</strong> (a central coordinator tells each service what to do — clearer, but a coupling point) from <strong>choreography</strong> (services react to each other's events — looser, but the overall flow is not written down anywhere).</p>`
},
{
  q: "What is the Saga pattern and how do you implement it?",
  level: "advanced", hot: true, tags: ["patterns", "consistency"],
  a: `<p>Distributed transactions (two-phase commit) do not work across microservices — they lock resources across the network, do not scale, and most modern datastores do not support them. A <strong>saga</strong> is a sequence of local transactions where each step publishes an event triggering the next, and every step has a <strong>compensating action</strong> to undo it.</p>
<figure class="fig">
<svg viewBox="0 0 640 160" role="img" aria-label="Choreographed saga with compensation">
  <rect class="dg-fill" x="10" y="20" width="126" height="42" rx="8"/><text class="dg-s" x="73" y="40" text-anchor="middle">Order created</text><text class="dg-s" x="73" y="55" text-anchor="middle">PENDING</text>
  <path class="dg-line" d="M140 41 H180" marker-end="url(#sa)"/>
  <rect class="dg-fill" x="184" y="20" width="126" height="42" rx="8"/><text class="dg-s" x="247" y="40" text-anchor="middle">Stock reserved</text>
  <path class="dg-line" d="M314 41 H354" marker-end="url(#sa)"/>
  <rect class="dg-fill" x="358" y="20" width="126" height="42" rx="8"/><text class="dg-s" x="421" y="40" text-anchor="middle">Payment taken</text>
  <path class="dg-line" d="M488 41 H528" marker-end="url(#sa)"/>
  <rect class="dg-fill2" x="532" y="20" width="100" height="42" rx="8"/><text class="dg-s" x="582" y="46" text-anchor="middle">CONFIRMED</text>
  <text class="dg-s" x="421" y="88" text-anchor="middle">payment fails ↓</text>
  <rect class="dg-box" x="358" y="98" width="126" height="40" rx="8"/><text class="dg-s" x="421" y="123" text-anchor="middle">Release stock</text>
  <path class="dg-line" d="M354 118 H180" marker-end="url(#sa)"/>
  <rect class="dg-box" x="54" y="98" width="126" height="40" rx="8"/><text class="dg-s" x="117" y="123" text-anchor="middle">Cancel order</text>
  <text class="dg-s" x="270" y="152" text-anchor="middle">compensating transactions, in reverse</text>
  <defs><marker id="sa" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>No rollback — you compensate forward with new transactions.</figcaption>
</figure>
<p><strong>Two styles:</strong></p>
<ul>
<li><strong>Choreography</strong> — each service listens for events and emits its own. No central coordinator; loosely coupled, but the end-to-end flow exists only in people's heads. Good for 3–4 steps.</li>
<li><strong>Orchestration</strong> — a saga orchestrator holds the state machine and issues commands. The flow is explicit, testable and observable; the cost is a component that knows about everyone. Better beyond 4 steps.</li>
</ul>
<p><strong>What you must get right:</strong> compensations must be <em>idempotent</em> and must handle "the thing I am compensating never happened"; steps must tolerate duplicate events (dedupe by event ID); and you need a timeout for stuck sagas. Note also that sagas are <strong>not isolated</strong> — other transactions can see intermediate states, so model that explicitly (a PENDING status, a reserved-but-not-sold stock count).</p>`
},
{
  q: "What is a circuit breaker and how do you configure one?",
  level: "advanced", hot: true, tags: ["resilience"],
  a: `<p>A circuit breaker stops calling a failing dependency, failing fast instead of piling up threads waiting on timeouts — which is how one slow service takes down everything upstream of it (cascading failure).</p>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Circuit breaker states">
  <rect class="dg-fill" x="30" y="44" width="120" height="44" rx="9"/><text class="dg-t" x="90" y="70" text-anchor="middle">CLOSED</text>
  <text class="dg-s" x="90" y="106" text-anchor="middle">calls pass through</text>
  <path class="dg-line" d="M154 60 H236" marker-end="url(#cb)"/><text class="dg-m" x="195" y="52" text-anchor="middle">failure % &gt; 50</text>
  <rect class="dg-fill2" x="240" y="44" width="120" height="44" rx="9"/><text class="dg-t" x="300" y="70" text-anchor="middle">OPEN</text>
  <text class="dg-s" x="300" y="106" text-anchor="middle">fail fast, no calls</text>
  <path class="dg-line" d="M364 60 H446" marker-end="url(#cb)"/><text class="dg-m" x="405" y="52" text-anchor="middle">after 30s</text>
  <rect class="dg-box" x="450" y="44" width="140" height="44" rx="9"/><text class="dg-t" x="520" y="70" text-anchor="middle">HALF-OPEN</text>
  <text class="dg-s" x="520" y="106" text-anchor="middle">a few trial calls</text>
  <path class="dg-line" d="M520 44 V20 H90 V44" marker-end="url(#cb)"/><text class="dg-m" x="300" y="14" text-anchor="middle">trials succeed → close</text>
  <defs><marker id="cb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>resilience4j.circuitbreaker.instances.paymentService:
  slidingWindowType: COUNT_BASED
  slidingWindowSize: 20
  minimumNumberOfCalls: 10          # do not trip on 1 failure out of 1
  failureRateThreshold: 50          # percent
  slowCallRateThreshold: 50
  slowCallDurationThreshold: 2s     # slow calls count as failures — important
  waitDurationInOpenState: 30s
  permittedNumberOfCallsInHalfOpenState: 3
  automaticTransitionFromOpenToHalfOpenEnabled: true</code></pre>
<pre><code>@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
@Retry(name = "paymentService")
@Bulkhead(name = "paymentService")
@TimeLimiter(name = "paymentService")
public PaymentResult charge(PaymentRequest req) { return client.charge(req); }

private PaymentResult paymentFallback(PaymentRequest req, CallNotPermittedException e) {
    return PaymentResult.queued(req.id());     // degrade gracefully, do not just error
}</code></pre>
<p><strong>Points that show experience:</strong> configure a <em>separate</em> breaker per dependency (not one global one); count slow calls as failures, since a timeout storm is worse than an error; never retry inside an open breaker; make the fallback meaningful (cached value, queued for later, reduced feature) rather than a generic 500; and always expose breaker state as a metric so you can see it trip.</p>`
},
{
  q: "What resilience patterns should every microservice have?",
  level: "advanced", hot: true, tags: ["resilience", "production"],
  a: `<ol>
<li><strong>Timeouts</strong> — on every outbound call, always. A call with no timeout is a thread leak waiting to happen. Set them shorter than your own SLA.</li>
<li><strong>Retries with exponential backoff and jitter</strong> — but <em>only for idempotent operations</em>, and with a cap. Jitter matters: synchronised retries cause a thundering herd that keeps the recovering service down.</li>
<li><strong>Circuit breaker</strong> — stop calling a service that is clearly failing.</li>
<li><strong>Bulkhead</strong> — separate thread pools or semaphores per dependency, so a slow downstream cannot consume every thread in your service. Named after ship compartments.</li>
<li><strong>Rate limiting / throttling</strong> — protect yourself and your dependencies.</li>
<li><strong>Fallback and graceful degradation</strong> — serve stale cache, a default, or a reduced feature instead of an error page.</li>
<li><strong>Load shedding</strong> — under overload, reject early rather than accepting work you cannot finish. A fast 503 beats a slow timeout.</li>
<li><strong>Health checks</strong> — separate liveness (am I alive?) from readiness (should I get traffic?). Getting this wrong causes restart loops.</li>
<li><strong>Idempotency</strong> — because retries mean duplicates, always.</li>
</ol>
<blockquote><p><strong>Combining them correctly matters:</strong> the order should be Retry → Circuit Breaker → Bulkhead → Timeout from the outside in, so retries do not fire while the circuit is open, and each attempt is individually bounded. Resilience4j applies its annotations in a defined order; state that you know it is configurable.</p></blockquote>`
},
{
  q: "What is service discovery and an API gateway?",
  level: "beginner", tags: ["infrastructure"],
  a: `<p><strong>Service discovery</strong> solves "where is the inventory service right now?" when instances scale up and down and get new IPs constantly.</p>
<ul>
<li><strong>Client-side discovery</strong> — the client queries a registry (Eureka, Consul) and load-balances itself. More control, more client logic.</li>
<li><strong>Server-side discovery</strong> — the client calls a fixed address and a load balancer routes. In <strong>Kubernetes this is built in</strong>: a Service gives you a stable DNS name and virtual IP, with endpoints updated automatically. Most teams no longer need Eureka.</li>
</ul>
<p><strong>An API gateway</strong> is the single entry point for external clients. Responsibilities:</p>
<ul>
<li>Routing and request aggregation</li>
<li>Authentication and token validation at the edge</li>
<li>Rate limiting and quotas</li>
<li>TLS termination, CORS, request/response transformation</li>
<li>Observability — one place to measure all ingress</li>
</ul>
<pre><code>spring:
  cloud.gateway.routes:
    - id: orders
      uri: lb://order-service
      predicates: [ Path=/api/orders/** ]
      filters:
        - StripPrefix=1
        - name: CircuitBreaker
          args: { name: ordersCB, fallbackUri: forward:/fallback/orders }
        - name: RequestRateLimiter
          args: { redis-rate-limiter.replenishRate: 100, redis-rate-limiter.burstCapacity: 200 }</code></pre>
<p><strong>The warning to voice:</strong> a gateway easily becomes a monolith of business logic and a single point of failure. Keep it to cross-cutting concerns, run several replicas, and never let it own domain rules. The <em>backend-for-frontend</em> (BFF) pattern — one gateway per client type — is a good way to keep aggregation logic honest.</p>`
},
{
  q: "How do you handle distributed tracing and observability?",
  level: "advanced", hot: true, tags: ["observability", "production"],
  a: `<p><strong>The three pillars, and what each answers:</strong></p>
<ul>
<li><strong>Logs</strong> — what happened in detail. Structured JSON, shipped centrally (ELK, Loki), always including the trace ID.</li>
<li><strong>Metrics</strong> — aggregate health over time. Micrometer → Prometheus → Grafana. Cheap to store, good for alerting.</li>
<li><strong>Traces</strong> — the path of one request across services. OpenTelemetry → Jaeger/Tempo/Zipkin. This is what makes "the API is slow" answerable.</li>
</ul>
<p><strong>How tracing works:</strong> the first service generates a <code>traceId</code>; each operation creates a <code>spanId</code> with a parent. The context propagates over HTTP headers (W3C <code>traceparent</code>) and Kafka headers, so the collector can reassemble the whole tree and show you exactly which span consumed the latency.</p>
<pre><code>&lt;dependency&gt;
  &lt;groupId&gt;io.micrometer&lt;/groupId&gt;&lt;artifactId&gt;micrometer-tracing-bridge-otel&lt;/artifactId&gt;
&lt;/dependency&gt;

# every log line carries the ids
logging.pattern.level: "%5p [\${spring.application.name},%X{traceId:-},%X{spanId:-}]"
management.tracing.sampling.probability: 0.1    # sample 10% in production</code></pre>
<p><strong>What to actually alert on</strong> — the RED method for services (Rate, Errors, Duration) and USE for resources (Utilisation, Saturation, Errors). Alert on <em>symptoms users feel</em> (error rate, p99 latency, SLO burn rate), not on causes like CPU — otherwise you drown in noise.</p>
<p>Add <strong>correlation IDs</strong> propagated to the client in error responses, so a support ticket maps directly to a trace.</p>`
},
{
  q: "How do you manage data consistency across microservices?",
  level: "advanced", hot: true, tags: ["consistency", "data"],
  a: `<p><strong>Database per service</strong> is the rule — no shared database, no cross-service joins, no other service reading your tables. That is what makes independent deployment and schema evolution possible. The price is that you cannot use a single ACID transaction.</p>
<p><strong>The toolkit:</strong></p>
<ul>
<li><strong>Saga</strong> — for multi-service business transactions with compensations.</li>
<li><strong>Transactional outbox</strong> — atomically save state and the event to publish, solving the dual-write problem.</li>
<li><strong>Idempotent consumers</strong> — dedupe by event ID, because delivery is at-least-once.</li>
<li><strong>Event sourcing</strong> — store the sequence of events as the source of truth and derive state. Powerful, gives a full audit log and time travel, but a big commitment.</li>
<li><strong>CQRS</strong> — separate write and read models; the read side is a projection built from events, so cross-service queries become local reads of a denormalised view.</li>
<li><strong>Materialised views / data replication</strong> — a service keeps its own read-only copy of the data it needs from another service, updated by events. This removes synchronous calls from the read path.</li>
</ul>
<blockquote><p><strong>The framing to use:</strong> "You trade strong consistency for availability and autonomy. The engineering work is making eventual consistency <em>visible and acceptable to the business</em> — a PENDING status the user understands, a reconciliation job, and monitoring on how far behind projections are."</p></blockquote>
<p>Also mention what you should <em>not</em> do: distributed two-phase commit, and shared databases with a "just this one join" exception, which is how a distributed monolith is born.</p>`
},
{
  q: "What is the difference between orchestration and choreography?",
  level: "advanced", tags: ["patterns"],
  a: `<table>
<tr><th></th><th>Orchestration</th><th>Choreography</th></tr>
<tr><td>Control</td><td>A central orchestrator issues commands</td><td>Each service reacts to events independently</td></tr>
<tr><td>Coupling</td><td>Orchestrator knows all participants</td><td>Services know only event contracts</td></tr>
<tr><td>Visibility</td><td>The whole flow is in one place — easy to reason about and monitor</td><td>Emergent; no single place describes the process</td></tr>
<tr><td>Change</td><td>Adding a step changes the orchestrator</td><td>Adding a consumer changes nothing existing</td></tr>
<tr><td>Failure handling</td><td>Centralised, explicit compensation</td><td>Distributed, harder to guarantee</td></tr>
<tr><td>Risk</td><td>Orchestrator becomes a god service</td><td>Cyclic event chains nobody understands</td></tr>
</table>
<pre><code>// Orchestration — explicit state machine
class OrderSaga {
    void onOrderCreated(e)     { send(new ReserveStock(e.orderId())); }
    void onStockReserved(e)    { send(new ChargePayment(e.orderId())); }
    void onPaymentFailed(e)    { send(new ReleaseStock(e.orderId()));
                                 send(new CancelOrder(e.orderId())); }
}

// Choreography — each service listens and emits
// OrderService: publishes OrderCreated
// InventoryService: on OrderCreated -&gt; publishes StockReserved / StockRejected
// PaymentService: on StockReserved -&gt; publishes PaymentCompleted / PaymentFailed</code></pre>
<p><strong>Practical guidance:</strong> choreography for simple flows of 2–3 steps and for genuinely independent reactions (send an email, update analytics). Orchestration once there are branches, compensations, timeouts or an SLA — you need to be able to answer "where is order 12345 stuck?", and only an orchestrator can tell you. Tools: Temporal, Camunda, AWS Step Functions, or a hand-rolled state machine.</p>`
},
{
  q: "How do you version and evolve microservice APIs without breaking consumers?",
  level: "advanced", tags: ["versioning", "design"],
  a: `<ol>
<li><strong>Additive changes only, wherever possible.</strong> New optional fields and new endpoints break nobody if consumers follow the <em>tolerant reader</em> principle — ignore unknown fields, do not fail on new enum values.</li>
<li><strong>Expand and contract (parallel change)</strong> for breaking changes: add the new field alongside the old → dual-write both → migrate consumers → monitor until the old field has zero usage → remove. Never do it in one deployment.</li>
<li><strong>Consumer-driven contract tests</strong> (Pact, Spring Cloud Contract). Each consumer publishes what it expects; the provider's CI verifies every consumer contract before merge. This is the single most effective control — it turns "will this break someone?" from a guess into a build failure.</li>
<li><strong>Backwards-compatible events.</strong> Same rules for Kafka: schema registry with BACKWARD compatibility, defaults on new fields, never rename or retype.</li>
<li><strong>Deprecation with data</strong> — <code>Deprecation</code> and <code>Sunset</code> headers, usage metrics per client and per version, direct communication with consuming teams, and a real removal date.</li>
<li><strong>Never break during a rolling deploy.</strong> Both versions run simultaneously, so version N+1 must work with data written by N, and vice versa. The same applies to database migrations.</li>
</ol>
<p>The organisational point matters as much as the technical one: with many teams, you cannot coordinate a synchronised release. The entire design goal is to make <em>uncoordinated</em> deployment safe.</p>`
},
{
  q: "What is idempotency in a distributed system and how do you achieve it?",
  level: "advanced", hot: true, tags: ["reliability", "patterns"],
  a: `<p>In a distributed system, retries are unavoidable — a timeout does not tell you whether the operation succeeded. So every operation that can be retried must be safe to apply more than once.</p>
<p><strong>Techniques, in order of preference:</strong></p>
<ol>
<li><strong>Make it naturally idempotent.</strong> <code>SET status = 'SHIPPED'</code> is idempotent; <code>INCREMENT attempts</code> is not. Prefer absolute state over deltas.</li>
<li><strong>Idempotency key</strong> for commands — the client sends a unique key; you store the key with its result and replay the stored response on a repeat.</li>
<li><strong>Deduplication table for events</strong> — a <code>processed_events</code> table with a unique constraint on the event ID, written in the same transaction as the effect.</li>
<li><strong>Conditional updates</strong> — optimistic locking with a version, or <code>UPDATE ... WHERE status = 'PENDING'</code> so the second attempt affects zero rows.</li>
<li><strong>Natural business keys</strong> — a unique constraint on <code>(order_id, payment_reference)</code> makes a duplicate insert fail loudly rather than silently double-charging.</li>
</ol>
<pre><code>@Transactional
public void handle(PaymentEvent event) {
    // unique constraint on event_id makes this the whole mechanism
    try {
        processedRepo.saveAndFlush(new ProcessedEvent(event.id()));
    } catch (DataIntegrityViolationException dup) {
        log.debug("event {} already processed, skipping", event.id());
        return;
    }
    accountService.credit(event.accountId(), event.amount());
}</code></pre>
<p><strong>Two subtleties worth raising:</strong> the dedupe record and the effect must be in the <em>same</em> transaction, or a crash between them reintroduces the bug; and dedupe records need a retention policy, or the table grows forever — usually a TTL matching your maximum retry window.</p>`
},
{
  q: "How do you handle configuration and secrets across many services?",
  level: "advanced", tags: ["configuration", "production"],
  a: `<p><strong>Principle:</strong> configuration lives in the environment, not the artefact. The same image runs in dev, staging and production with different configuration injected.</p>
<ul>
<li><strong>Environment variables / ConfigMaps</strong> — the twelve-factor baseline; Spring Boot's relaxed binding makes this seamless.</li>
<li><strong>Centralised config server</strong> — Spring Cloud Config backed by Git gives versioning, review and audit of configuration changes, with <code>/actuator/refresh</code> or Spring Cloud Bus for runtime updates.</li>
<li><strong>Secrets manager</strong> — HashiCorp Vault, AWS Secrets Manager or sealed secrets. Never Git, never a ConfigMap, never a built image.</li>
<li><strong>Kubernetes Secrets</strong> — remember they are only base64-encoded, not encrypted, unless you enable encryption at rest and RBAC.</li>
</ul>
<p><strong>Practices that matter:</strong></p>
<ul>
<li><strong>Fail fast on missing configuration</strong> — validate with <code>@ConfigurationProperties</code> + <code>@Validated</code> so the app refuses to start rather than failing at 3am on the first request that needs it.</li>
<li><strong>Rotate secrets</strong> without redeploying — short-lived dynamic credentials from Vault are the mature answer.</li>
<li><strong>Never log configuration</strong> — and secure <code>/actuator/env</code> and <code>/configprops</code>, which will happily print your database password.</li>
<li><strong>Separate configuration from feature flags</strong> — flags need runtime toggling and per-user targeting, which a config file cannot do. Use a flag service.</li>
</ul>`
},
{
  q: "How do you test microservices?",
  level: "advanced", hot: true, tags: ["testing"],
  a: `<p>The <strong>test pyramid</strong> reshapes in a distributed system — you cannot rely on end-to-end tests, because they are slow, flaky and require every service running.</p>
<ol>
<li><strong>Unit tests</strong> — the bulk. Pure logic, no Spring context, milliseconds.</li>
<li><strong>Integration tests</strong> — the service with its real database via <strong>Testcontainers</strong>, and its Kafka via an embedded or containerised broker. This is where most real bugs are caught.</li>
<li><strong>Component tests</strong> — the whole service in isolation, with all downstream dependencies stubbed by WireMock. Tests your service's behaviour without anyone else's availability.</li>
<li><strong>Contract tests</strong> — the crucial layer. Consumers declare expectations (Pact / Spring Cloud Contract); the provider's CI verifies them. This replaces most end-to-end testing and catches breaking changes at merge time rather than in staging.</li>
<li><strong>End-to-end tests</strong> — a small number of critical user journeys only. Accept that they are slow and occasionally flaky; do not build your safety net here.</li>
<li><strong>Production verification</strong> — synthetic monitoring, canary releases with automatic rollback on error-rate regression, and feature flags so a bad path can be turned off without a deploy.</li>
</ol>
<pre><code>@SpringBootTest @Testcontainers @AutoConfigureWireMock(port = 0)
class OrderServiceIT {
    @Container static PostgreSQLContainer&lt;?&gt; db = new PostgreSQLContainer&lt;&gt;("postgres:16");
    @Container static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka"));

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", db::getJdbcUrl);
        r.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }
}</code></pre>
<p>Worth adding: <strong>chaos testing</strong> — deliberately inject latency and failures (Chaos Monkey, Litmus) to verify your timeouts, retries and circuit breakers actually behave as configured. Resilience configuration that has never been exercised is a guess.</p>`
},
{
  q: "What is the strangler fig pattern for migrating a monolith?",
  level: "advanced", tags: ["migration", "architecture"],
  a: `<p>Named after a vine that grows around a tree until the tree dies and the vine stands alone. You incrementally replace monolith functionality with services, routing traffic through a facade, until nothing is left of the original.</p>
<ol>
<li><strong>Put a facade in front</strong> — a proxy or gateway that all traffic passes through. Initially it forwards everything to the monolith.</li>
<li><strong>Pick the first slice carefully.</strong> Choose something with a clear boundary, low coupling, and real business value in being separate — often a read-heavy or independently scaling capability. Do not start with the hardest, most central domain.</li>
<li><strong>Build the new service</strong> and route just that path to it. Everything else is unchanged.</li>
<li><strong>Handle the data.</strong> This is the hard part — usually dual-write with the monolith as source of truth, then CDC/events to sync, then flip ownership once confidence is high.</li>
<li><strong>Verify in production</strong> — run both in parallel and compare results (shadow traffic / dark launch) before switching.</li>
<li><strong>Repeat</strong>, and delete the monolith's code as each slice is retired — which is the step teams skip, leaving them running both forever.</li>
</ol>
<p><strong>Why this over a big-bang rewrite:</strong> value is delivered continuously, risk is bounded per slice, you can stop or reverse at any point, and the business keeps running. Big-bang rewrites are the most reliably failed project shape in our industry.</p>
<p><strong>Be honest about the interim state</strong> — you will run a hybrid for a long time, with duplicated logic and sync complexity. That cost is real and must be planned for, not discovered.</p>`
},
{
  q: "How do you deploy microservices safely — blue-green, canary, rolling?",
  level: "advanced", tags: ["deployment", "production"],
  a: `<table>
<tr><th>Strategy</th><th>How</th><th>Trade-off</th></tr>
<tr><td><strong>Rolling</strong></td><td>Replace instances gradually</td><td>Kubernetes default; both versions run together, so backwards compatibility is mandatory</td></tr>
<tr><td><strong>Blue-green</strong></td><td>Two full environments, switch traffic at once</td><td>Instant rollback; doubles infrastructure cost; database schema must serve both</td></tr>
<tr><td><strong>Canary</strong></td><td>Route 1% → 10% → 50% → 100%, watching metrics</td><td>Best risk control; needs good metrics and traffic-splitting infrastructure</td></tr>
<tr><td><strong>Feature flags</strong></td><td>Deploy dark, enable per user/segment</td><td>Decouples deploy from release entirely — the most powerful of the four</td></tr>
</table>
<pre><code># Kubernetes rolling update with zero downtime
strategy:
  rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
readinessProbe:                # do not send traffic until ready
  httpGet: { path: /actuator/health/readiness, port: 8081 }
livenessProbe:                 # restart if genuinely stuck
  httpGet: { path: /actuator/health/liveness, port: 8081 }
lifecycle:
  preStop: { exec: { command: ["sh","-c","sleep 5"] } }   # let the LB deregister first
terminationGracePeriodSeconds: 45</code></pre>
<p><strong>The non-negotiables</strong> whichever you choose: graceful shutdown (finish in-flight requests), backwards-compatible database migrations (expand/contract, never rename in one step), automated rollback triggered by error-rate or latency regression, and a health check that actually reflects readiness rather than returning 200 unconditionally.</p>`
},
{
  q: "What are the anti-patterns in microservices?",
  level: "advanced", hot: true, tags: ["anti-patterns"],
  a: `<ul>
<li><strong>Distributed monolith</strong> — services that must be deployed together. All the operational cost of microservices, none of the autonomy. The clearest symptom is a release train.</li>
<li><strong>Shared database</strong> — two services writing the same tables. You cannot change a schema, and you have coupled at the deepest possible level.</li>
<li><strong>Nano-services</strong> — a service per class or per table. The network overhead and operational burden dwarf any benefit.</li>
<li><strong>Chatty communication</strong> — rendering one page requires 30 synchronous calls. Latency compounds and availability multiplies downwards.</li>
<li><strong>Synchronous call chains</strong> — A → B → C → D. Latency adds up, and any failure propagates to the user.</li>
<li><strong>No API contracts or versioning</strong> — every deploy is a gamble.</li>
<li><strong>Missing observability</strong> — distributed systems without tracing are undebuggable. This must exist <em>before</em> you split, not after.</li>
<li><strong>Entity services</strong> — a "Customer service" that is just CRUD over a table, with all the logic in the callers. Services should own behaviour, not just data.</li>
<li><strong>Ignoring the network</strong> — treating a remote call like a local one, with no timeout, retry or circuit breaker. The fallacies of distributed computing exist for a reason.</li>
<li><strong>Microservices without DevOps maturity</strong> — no CI/CD, no automated tests, manual deployments. You have multiplied your operational pain by N.</li>
</ul>
<blockquote><p><strong>Strongest closing line:</strong> "The most common anti-pattern is adopting microservices at all, for a team and problem that did not need them."</p></blockquote>`
}
]);
