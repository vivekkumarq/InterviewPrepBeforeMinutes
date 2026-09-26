appendTopic("microservices", [
{
  q: "How would you split a monolith into microservices — walk me through your first 90 days",
  level: "advanced", hot: true, tags: ["migration", "architecture"],
  companies: ["Amazon", "Infosys", "TCS", "Accenture", "Deloitte", "ThoughtWorks", "EPAM"],
  a: `<p><strong>Days 1–30 — understand and prepare. Do not extract anything yet.</strong></p>
<ol>
<li><strong>Map the domain.</strong> Event storming with the business to find bounded contexts. The boundaries come from the <em>business</em>, not from the package structure.</li>
<li><strong>Measure change coupling.</strong> Analyse git history: which files change together? Files that always change in the same commit belong in the same service.</li>
<li><strong>Build the platform first.</strong> CI/CD, centralised logging, metrics, distributed tracing. <strong>Extracting a service before you have tracing is how teams end up unable to debug anything.</strong></li>
<li><strong>Add the facade.</strong> Route all traffic through a gateway that currently forwards everything to the monolith. Nothing changes yet, but the seam now exists.</li>
</ol>
<p><strong>Days 30–60 — extract the first service.</strong></p>
<pre><code>Choose the FIRST slice deliberately:
  ✔ Clear boundary, few dependencies
  ✔ Read-heavy or independently scaling
  ✔ Real business value in separating it
  ✘ NOT the core domain — that is the hardest and highest risk
// Notifications, reporting, or search are typical good first candidates.</code></pre>
<p><strong>Days 60–90 — the data, which is the actual hard part.</strong></p>
<pre><code>1. Stop cross-service WRITES first (more dangerous than reads)
2. Move the tables to a separate schema, still in the same database
3. Replace cross-schema joins with an API call, or a local read model fed by events
4. Move to a separate database instance
5. Run DUAL READS and compare results before cutting over</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Strangler fig migration phases">
  <rect class="dg-fill" x="14" y="46" width="110" height="40" rx="8"/><text class="dg-s" x="69" y="62" text-anchor="middle">Monolith</text><text class="dg-s" x="69" y="78" text-anchor="middle">100%</text>
  <path class="dg-line" d="M128 66 H166" marker-end="url(#sf1)"/>
  <rect class="dg-fill" x="170" y="46" width="110" height="40" rx="8"/><text class="dg-s" x="225" y="62" text-anchor="middle">Monolith 80%</text><text class="dg-s" x="225" y="78" text-anchor="middle">+ svc A</text>
  <path class="dg-line" d="M284 66 H322" marker-end="url(#sf1)"/>
  <rect class="dg-fill2" x="326" y="46" width="110" height="40" rx="8"/><text class="dg-s" x="381" y="62" text-anchor="middle">Monolith 40%</text><text class="dg-s" x="381" y="78" text-anchor="middle">+ A, B, C</text>
  <path class="dg-line" d="M440 66 H478" marker-end="url(#sf1)"/>
  <rect class="dg-box" x="482" y="46" width="120" height="40" rx="8"/><text class="dg-s" x="542" y="62" text-anchor="middle">Monolith DELETED</text><text class="dg-s" x="542" y="78" text-anchor="middle">A…F</text>
  <text class="dg-s" x="300" y="116" text-anchor="middle">a gateway fronts every phase — clients never see the change</text>
  <defs><marker id="sf1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>What to say about pitfalls:</strong> the two failure modes are extracting by <em>technical layer</em> (producing a distributed monolith where every feature needs three deployments) and doing a big-bang rewrite. Also: <strong>delete the monolith's code as each slice retires</strong> — the step teams skip, leaving them running both forever.</p>
<p><strong>And the honest framing:</strong> "I would also challenge whether we need this. If the driver is 'the codebase is messy', a modular monolith fixes that with none of the distributed-systems cost. Microservices solve an organisational scaling problem — independent deployment by independent teams."</p>`
},
{
  q: "How do you handle a downstream service being slow rather than down?",
  level: "advanced", hot: true, tags: ["resilience", "production"],
  companies: ["Amazon", "Flipkart", "PayPal", "Walmart", "Netflix", "Maersk"],
  a: `<p><strong>A slow dependency is more dangerous than a dead one</strong>, and that framing is the answer. A dead service fails fast and you move on. A slow one holds your threads, and once every thread is waiting, <em>your</em> service is down too — for every endpoint, not just the one that calls it.</p>
<pre><code>Request thread pool = 200
Downstream takes 30s instead of 200ms
-&gt; after ~7 seconds of normal traffic, all 200 threads are blocked
-&gt; health checks fail, the load balancer removes you
-&gt; CASCADING FAILURE across an entirely unrelated part of your API</code></pre>
<p><strong>The four defences, in order of importance:</strong></p>
<pre><code>// 1. TIMEOUTS — non-negotiable, and shorter than your own SLA
WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create().responseTimeout(Duration.ofSeconds(2))
                           .option(CONNECT_TIMEOUT_MILLIS, 1000)))
    .build();

// 2. BULKHEAD — cap concurrent calls so one dependency cannot take every thread
resilience4j.bulkhead.instances.inventory:
  maxConcurrentCalls: 20            # 20 threads MAX, whatever happens downstream
  maxWaitDuration: 100ms

// 3. CIRCUIT BREAKER — counting SLOW calls as failures, not just errors
resilience4j.circuitbreaker.instances.inventory:
  slowCallDurationThreshold: 2s
  slowCallRateThreshold: 50         # 50% slow -> OPEN
  failureRateThreshold: 50

// 4. FALLBACK — degrade, do not fail
@CircuitBreaker(name = "inventory", fallbackMethod = "cachedStock")
public Stock check(String sku) { return client.check(sku); }

private Stock cachedStock(String sku, Throwable t) {
    return cache.getIfPresent(sku)          // stale data beats no data
            .orElse(Stock.unknown(sku));     // let the UI say "checking availability"
}</code></pre>
<p><strong>The setting that matters most and is most often missed:</strong> <code>slowCallDurationThreshold</code>. A breaker configured only on <em>errors</em> never opens for a slow dependency — the calls are succeeding, just taking 30 seconds. Counting slow calls as failures is what actually protects you.</p>
<p><strong>The bulkhead is the second-most-missed:</strong> without it, a timeout still lets 200 threads wait 2 seconds each. With <code>maxConcurrentCalls: 20</code>, at most 20 threads are ever tied up and the other 180 keep serving unrelated endpoints.</p>
<p><strong>What to monitor:</strong> p99 latency <em>per downstream dependency</em>, breaker state transitions, and bulkhead rejections. Rising p99 on a dependency is the leading indicator — it appears long before your own error rate does.</p>`
},
{
  q: "How do you test a microservice in isolation when it depends on five others?",
  level: "advanced", hot: true, tags: ["testing", "contracts"],
  companies: ["Amazon", "ThoughtWorks", "EPAM", "SAP", "Publicis Sapient", "Optum"],
  a: `<p>The wrong answer is "spin up all six services". That is slow, flaky, needs a shared environment, and fails for reasons unrelated to your change.</p>
<pre><code>// 1. COMPONENT TEST — your service, real database, all downstreams STUBBED
@SpringBootTest(webEnvironment = RANDOM_PORT)
@AutoConfigureWireMock(port = 0)
@Testcontainers
class OrderServiceComponentTest {

    @Container @ServiceConnection
    static PostgreSQLContainer&lt;?&gt; db = new PostgreSQLContainer&lt;&gt;("postgres:16-alpine");

    @Test
    void createsOrderWhenInventoryAvailable() {
        stubFor(get(urlPathEqualTo("/inventory/SKU-1"))
                .willReturn(okJson("""{"sku":"SKU-1","available":10}""")));
        stubFor(post("/payments").willReturn(okJson("""{"id":"pay_1","status":"OK"}""")));

        var response = rest.postForEntity("/api/orders", request, OrderDto.class);

        assertThat(response.getStatusCode()).isEqualTo(CREATED);
        verify(postRequestedFor(urlEqualTo("/payments"))
                .withHeader("Idempotency-Key", matching(".+")));   // assert what we SENT
    }

    @Test
    void degradesWhenInventoryIsSlow() {
        stubFor(get(urlPathMatching("/inventory/.*"))
                .willReturn(aResponse().withFixedDelay(5000)));     // simulate the real risk
        // assert the circuit breaker opened and the fallback ran
    }
}</code></pre>
<pre><code>// 2. CONTRACT TEST — the stub is VERIFIED against the real provider
// Consumer publishes what it expects; the provider's CI proves it can satisfy it.
pact-broker can-i-deploy --pacticipant order-service --version $GIT_SHA \\
                         --to-environment production</code></pre>
<table>
<tr><th>Level</th><th>What it proves</th><th>Speed</th></tr>
<tr><td>Unit</td><td>Business logic</td><td>ms</td></tr>
<tr><td>Integration</td><td>Your service + its real database</td><td>seconds</td></tr>
<tr><td><strong>Component</strong></td><td>The whole service, downstreams stubbed</td><td>seconds</td></tr>
<tr><td><strong>Contract</strong></td><td>The stubs match reality</td><td>seconds</td></tr>
<tr><td>End-to-end</td><td>The real system, a few journeys only</td><td>minutes, flaky</td></tr>
</table>
<p><strong>The insight to state:</strong> component tests are fast but only prove your service works <em>against your assumptions</em>. Contract tests prove those assumptions match the provider. Together they give you most of the confidence of end-to-end testing at unit-test speed — which is what makes independent deployment safe.</p>
<p><strong>What to stub that people forget:</strong> not just the happy path. Stub a 500, a timeout, a 429, and a malformed response — those are the behaviours that actually break in production, and they are trivial to simulate with WireMock and nearly impossible to trigger against a real sandbox.</p>`
},
{
  q: "What is the difference between choreography and orchestration for a checkout flow?",
  level: "advanced", hot: true, tags: ["saga", "patterns"],
  companies: ["Amazon", "Flipkart", "Swiggy", "Paytm", "SAP", "Walmart"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 190" role="img" aria-label="Choreography versus orchestration for a checkout saga">
  <text class="dg-t" x="150" y="16" text-anchor="middle">Choreography — events</text>
  <rect class="dg-fill" x="20" y="30" width="86" height="30" rx="6"/><text class="dg-s" x="63" y="49" text-anchor="middle">Order</text>
  <path class="dg-line" d="M110 45 H150" marker-end="url(#ch1)"/>
  <rect class="dg-fill" x="154" y="30" width="86" height="30" rx="6"/><text class="dg-s" x="197" y="49" text-anchor="middle">Inventory</text>
  <path class="dg-line" d="M197 64 V84 H63 V104" marker-end="url(#ch1)"/>
  <rect class="dg-fill" x="20" y="106" width="86" height="30" rx="6"/><text class="dg-s" x="63" y="125" text-anchor="middle">Payment</text>
  <path class="dg-line" d="M110 121 H150" marker-end="url(#ch1)"/>
  <rect class="dg-fill" x="154" y="106" width="86" height="30" rx="6"/><text class="dg-s" x="197" y="125" text-anchor="middle">Shipping</text>
  <text class="dg-s" x="16" y="160">no central view: nobody can answer</text>
  <text class="dg-s" x="16" y="176">"where is order 42?"</text>
  <text class="dg-t" x="460" y="16" text-anchor="middle">Orchestration — commands</text>
  <rect class="dg-fill2" x="400" y="66" width="110" height="40" rx="8"/><text class="dg-s" x="455" y="82" text-anchor="middle">Saga</text><text class="dg-s" x="455" y="98" text-anchor="middle">orchestrator</text>
  <path class="dg-line" d="M400 76 H344 M400 86 H344 M400 96 H344" marker-end="url(#ch1)"/>
  <rect class="dg-box" x="260" y="30" width="80" height="26" rx="5"/><text class="dg-s" x="300" y="47" text-anchor="middle">Inventory</text>
  <rect class="dg-box" x="260" y="74" width="80" height="26" rx="5"/><text class="dg-s" x="300" y="91" text-anchor="middle">Payment</text>
  <rect class="dg-box" x="260" y="118" width="80" height="26" rx="5"/><text class="dg-s" x="300" y="135" text-anchor="middle">Shipping</text>
  <text class="dg-s" x="470" y="132" text-anchor="middle">state machine</text>
  <text class="dg-s" x="470" y="166" text-anchor="middle">one place shows the flow and compensations</text>
  <defs><marker id="ch1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// CHOREOGRAPHY — each service reacts to events
OrderService:     places order          -&gt; publishes OrderPlaced
InventoryService: on OrderPlaced        -&gt; publishes StockReserved | StockRejected
PaymentService:   on StockReserved      -&gt; publishes PaymentCompleted | PaymentFailed
ShippingService:  on PaymentCompleted   -&gt; publishes ShipmentScheduled
InventoryService: on PaymentFailed      -&gt; publishes StockReleased  (compensation)

// ORCHESTRATION — one component owns the flow
@Component
public class CheckoutSaga {
    public void onOrderPlaced(OrderPlaced e)  { send(new ReserveStock(e.orderId())); }
    public void onStockReserved(StockReserved e) { send(new ChargePayment(e.orderId())); }
    public void onPaymentFailed(PaymentFailed e) {
        send(new ReleaseStock(e.orderId()));            // compensate, in order
        send(new CancelOrder(e.orderId()));
    }
    @Scheduled(fixedDelay = 60_000)
    public void timeoutStuckSagas() { ... }             // only possible with a coordinator
}</code></pre>
<table>
<tr><th></th><th>Choreography</th><th>Orchestration</th></tr>
<tr><td>Coupling</td><td>Loosest — services know only event contracts</td><td>Orchestrator knows all participants</td></tr>
<tr><td>Visibility</td><td>The flow exists only in people's heads</td><td>One readable state machine</td></tr>
<tr><td>Adding a step</td><td>New subscriber, nothing else changes</td><td>Edit the orchestrator</td></tr>
<tr><td>Debugging "where is order 42?"</td><td>Trace across five services</td><td>Query the saga state</td></tr>
<tr><td>Risk</td><td>Cyclic event chains nobody understands</td><td>Orchestrator becomes a god service</td></tr>
</table>
<p><strong>The decision rule to give:</strong> choreography for two or three steps and for genuinely independent reactions (send an email, update analytics). <strong>Orchestration once there are branches, compensations, timeouts or an SLA</strong> — because someone will eventually ask "why has this order been pending for two hours?", and only a coordinator can answer that.</p>
<p><strong>What both require regardless:</strong> idempotent handlers (delivery is at-least-once), compensations that tolerate "the thing I am undoing never happened", and a timeout sweeper for stuck instances. Tools: Temporal, Camunda, AWS Step Functions, or a hand-rolled state machine with a scheduled reconciler.</p>`
},
{
  q: "How do you propagate correlation IDs and user context across microservices?",
  level: "advanced", tags: ["observability", "production"],
  companies: ["Amazon", "Flipkart", "SAP", "Optum", "Barclays", "Ericsson"],
  a: `<pre><code>// 1. Generate or accept at the EDGE
@Component @Order(HIGHEST_PRECEDENCE)
public class CorrelationFilter extends OncePerRequestFilter {
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ... {
        String id = Optional.ofNullable(req.getHeader("X-Correlation-Id"))
                            .orElseGet(() -&gt; UUID.randomUUID().toString());
        MDC.put("correlationId", id);
        MDC.put("tenantId", TenantContext.current());
        res.setHeader("X-Correlation-Id", id);          // return it so support can quote it
        try { chain.doFilter(req, res); }
        finally { MDC.clear(); }                         // MANDATORY — pooled threads are reused
    }
}

// 2. Propagate on every OUTBOUND call
@Bean
WebClient webClient(WebClient.Builder builder) {
    return builder.filter((request, next) -&gt; {
        var withHeaders = ClientRequest.from(request)
                .header("X-Correlation-Id", MDC.get("correlationId"))
                .header("X-Tenant-Id", MDC.get("tenantId"))
                .build();
        return next.exchange(withHeaders);
    }).build();
}

// 3. Propagate through KAFKA — headers, not the payload
kafkaTemplate.send(MessageBuilder.withPayload(event)
        .setHeader(KafkaHeaders.TOPIC, "orders")
        .setHeader("X-Correlation-Id", MDC.get("correlationId"))
        .build());

// 4. Restore it on the consumer side
@KafkaListener(topics = "orders")
public void consume(OrderEvent e, @Header("X-Correlation-Id") String correlationId) {
    MDC.put("correlationId", correlationId);
    try { process(e); } finally { MDC.clear(); }
}

// 5. Put it in EVERY log line
logging.pattern.level: "%5p [\${spring.application.name},%X{correlationId:-},%X{tenantId:-}]"</code></pre>
<p><strong>Prefer the W3C standard over a bespoke header:</strong> <code>traceparent</code> interoperates automatically with OpenTelemetry, service meshes, cloud load balancers and APM vendors. Micrometer Tracing populates the MDC for you, so most of the above becomes configuration rather than code.</p>
<p><strong>The three failures this prevents:</strong> being unable to answer "why was <em>this user's</em> request slow at 14:32?"; losing the trail the moment a request crosses into Kafka (async is where most tracing setups break); and support tickets with no way to find the corresponding logs — which is why returning the ID in the response header matters.</p>
<p><strong>The bug to warn about:</strong> forgetting <code>MDC.clear()</code> in a <code>finally</code> block. Request threads are pooled and reused, so a leaked value attaches the previous request's correlation ID — or worse, its <em>tenant</em> ID — to the next one. That is a data-isolation bug, not just a logging annoyance. The same applies to <code>@Async</code> and executor tasks, which need a task decorator to copy the MDC across.</p>`
}
]);
