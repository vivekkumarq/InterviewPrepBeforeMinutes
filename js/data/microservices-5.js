appendTopic("microservices", [
{
  q: "How do you keep data consistent across services without distributed transactions?",
  level: "advanced", hot: true, tags: ["saga", "consistency", "architecture", "must-know"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Goldman Sachs", "Swiggy", "PayPal"],
  a: `<p><strong>Why not two-phase commit:</strong> 2PC needs every participant to hold locks until the coordinator decides. One slow service blocks all of them, a coordinator crash leaves everyone in doubt, and most modern data stores and message brokers do not support XA at all. So the industry answer is a <strong>saga</strong> — a sequence of local transactions, each with a compensating action.</p>
<figure class="fig">
<svg viewBox="0 0 620 175" role="img" aria-label="Choreographed saga with compensating transactions on failure">
  <rect class="dg-fill" x="16" y="30" width="120" height="34" rx="6"/><text class="dg-s" x="76" y="52" text-anchor="middle">1. Order created</text>
  <path class="dg-line" d="M140 47 H186" marker-end="url(#sg1)"/>
  <rect class="dg-fill" x="190" y="30" width="120" height="34" rx="6"/><text class="dg-s" x="250" y="52" text-anchor="middle">2. Payment taken</text>
  <path class="dg-line" d="M314 47 H360" marker-end="url(#sg1)"/>
  <rect class="dg-fill2" x="364" y="30" width="130" height="34" rx="6"/><text class="dg-s" x="429" y="52" text-anchor="middle">3. Stock reserved ✘</text>
  <path class="dg-line" d="M429 68 V92" marker-end="url(#sg1)"/>
  <rect class="dg-box" x="364" y="92" width="130" height="34" rx="6"/><text class="dg-s" x="429" y="114" text-anchor="middle">out of stock</text>
  <path class="dg-line" d="M360 109 H314" marker-end="url(#sg1)"/>
  <rect class="dg-box" x="190" y="92" width="120" height="34" rx="6"/><text class="dg-s" x="250" y="114" text-anchor="middle">refund payment</text>
  <path class="dg-line" d="M186 109 H140" marker-end="url(#sg1)"/>
  <rect class="dg-box" x="16" y="92" width="120" height="34" rx="6"/><text class="dg-s" x="76" y="114" text-anchor="middle">cancel order</text>
  <text class="dg-s" x="16" y="160">each step commits LOCALLY; failure runs the compensations backwards</text>
  <defs><marker id="sg1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th></th><th>Choreography</th><th>Orchestration</th></tr>
<tr><td>Coordination</td><td>Services react to each other's events</td><td>A central orchestrator issues commands</td></tr>
<tr><td>Coupling</td><td>Loose — no service knows the whole flow</td><td>Orchestrator knows everything</td></tr>
<tr><td>Visibility</td><td><strong>Poor</strong> — the flow exists only as a diagram in someone's head</td><td><strong>Good</strong> — the flow is one readable state machine</td></tr>
<tr><td>Debugging</td><td>Hard; needs distributed tracing</td><td>Easy — inspect the saga state</td></tr>
<tr><td>Use for</td><td>2–3 simple steps</td><td>4+ steps, or anything with real compensation logic</td></tr>
</table>
<pre><code>// The TRANSACTIONAL OUTBOX — how you publish an event and commit atomically.
// Writing to the database and then to Kafka is TWO operations; a crash in
// between loses the event or emits one for work that rolled back.
@Transactional
public Order create(OrderRequest req) {
    Order order = repo.save(new Order(req));               // same transaction...
    outbox.save(new OutboxEvent("OrderCreated", order.getId(), toJson(order)));  // ...as this
    return order;
}
// A separate relay (or Debezium reading the WAL) publishes from the outbox
// and marks rows sent. If the transaction rolls back, the event was never
// written. If publishing fails, it is retried — at-least-once, never zero.</code></pre>
<pre><code>// The consumer side must then be IDEMPOTENT, because at-least-once means
// duplicates are guaranteed, not merely possible.
@Transactional
public void on(OrderCreated event) {
    if (!processed.markIfNew(event.eventId())) return;     // unique constraint on eventId
    inventory.reserve(event.orderId(), event.items());
}</code></pre>
<table>
<tr><th>Pattern</th><th>Solves</th></tr>
<tr><td><strong>Saga</strong></td><td>Multi-service business transactions without locks</td></tr>
<tr><td><strong>Transactional outbox</strong></td><td>Atomically commit state and publish an event</td></tr>
<tr><td><strong>Inbox / idempotent consumer</strong></td><td>Duplicate delivery</td></tr>
<tr><td><strong>Event sourcing</strong></td><td>Full audit trail and temporal queries — powerful and expensive</td></tr>
<tr><td><strong>CQRS</strong></td><td>Read models shaped for queries, updated from events</td></tr>
<tr><td>Change data capture (Debezium)</td><td>Outbox without a polling relay</td></tr>
</table>
<p><strong>The honest caveats to raise:</strong> compensations are not rollbacks — a refund is a new business fact, and some actions (an email sent, a package shipped) cannot be undone at all, so the saga must be designed so the irreversible step comes last. And sagas are only <em>eventually</em> consistent: there is a window where payment succeeded and stock is not yet reserved. The business has to accept that window, which makes this a product conversation as much as a technical one.</p>
<p><strong>The answer that shows judgement:</strong> "Before reaching for a saga I ask whether these operations belong in the same service. Needing a distributed transaction is often a sign the service boundary is wrong — the strongest fix is usually to move the data together, not to build coordination machinery around a split that should not exist."</p>`
},
{
  q: "How do you implement resilience — circuit breakers, retries, timeouts and bulkheads?",
  level: "advanced", hot: true, tags: ["resilience", "production", "microservices", "must-know"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Uber", "Societe Generale", "Nagarro"],
  a: `<pre><code>// Resilience4j — the order of the decorators matters
@Retry(name = "pricing")                    // outermost: retries the whole thing
@CircuitBreaker(name = "pricing", fallbackMethod = "cachedPrice")
@Bulkhead(name = "pricing")                 // limits concurrent calls
@TimeLimiter(name = "pricing")              // innermost: bounds a single attempt
public CompletableFuture&lt;Price&gt; fetch(String sku) { return client.price(sku); }

private CompletableFuture&lt;Price&gt; cachedPrice(String sku, Throwable t) {
    return CompletableFuture.completedFuture(cache.lastKnown(sku));
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Circuit breaker state machine closed open half open">
  <circle class="dg-fill" cx="110" cy="70" r="42"/><text class="dg-s" x="110" y="66" text-anchor="middle">CLOSED</text><text class="dg-s" x="110" y="84" text-anchor="middle">calls pass</text>
  <circle class="dg-box" cx="330" cy="70" r="42"/><text class="dg-s" x="330" y="66" text-anchor="middle">OPEN</text><text class="dg-s" x="330" y="84" text-anchor="middle">fail fast</text>
  <circle class="dg-fill2" cx="530" cy="70" r="46"/><text class="dg-s" x="530" y="66" text-anchor="middle">HALF-OPEN</text><text class="dg-s" x="530" y="84" text-anchor="middle">probe a few</text>
  <path class="dg-line" d="M154 62 H284" marker-end="url(#cb1)"/>
  <text class="dg-s" x="219" y="52" text-anchor="middle">failure rate &gt; 50%</text>
  <path class="dg-line" d="M372 70 H482" marker-end="url(#cb1)"/>
  <text class="dg-s" x="427" y="58" text-anchor="middle">after 30s</text>
  <path class="dg-line" d="M510 112 Q310 152 122 112" marker-end="url(#cb1)"/>
  <text class="dg-s" x="316" y="146" text-anchor="middle">probes succeed → close</text>
  <path class="dg-line" d="M530 24 Q430 -4 340 28" marker-end="url(#cb1)"/>
  <text class="dg-s" x="436" y="16" text-anchor="middle">probe fails → open again</text>
  <defs><marker id="cb1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Pattern</th><th>Protects against</th><th>Key setting</th></tr>
<tr><td><strong>Timeout</strong></td><td>A hung dependency holding your threads forever</td><td>Shorter than your own SLO — an unbounded wait is the root of most cascades</td></tr>
<tr><td><strong>Retry</strong></td><td>Transient blips</td><td><strong>Exponential backoff + jitter</strong>, and only on idempotent operations</td></tr>
<tr><td><strong>Circuit breaker</strong></td><td>Hammering a service that is already down</td><td>Failure-rate threshold over a sliding window</td></tr>
<tr><td><strong>Bulkhead</strong></td><td>One slow dependency consuming the whole thread pool</td><td>Separate pool or semaphore per dependency</td></tr>
<tr><td><strong>Rate limiter</strong></td><td>Overwhelming a downstream, or being overwhelmed</td><td>Token bucket, per client</td></tr>
<tr><td><strong>Fallback</strong></td><td>Total failure of a non-critical feature</td><td>Cached or degraded response</td></tr>
</table>
<pre><code>resilience4j:
  circuitbreaker.instances.pricing:
    slidingWindowType: COUNT_BASED
    slidingWindowSize: 50
    minimumNumberOfCalls: 20        # do not trip on the first 2 failures at startup
    failureRateThreshold: 50
    waitDurationInOpenState: 30s
    permittedNumberOfCallsInHalfOpenState: 5
    slowCallRateThreshold: 80       # a SLOW call counts as a failure too —
    slowCallDurationThreshold: 2s   # this is what catches degradation before an outage
  retry.instances.pricing:
    maxAttempts: 3
    waitDuration: 200ms
    enableExponentialBackoff: true
    enableRandomizedWait: true      # JITTER — without it, every client retries in lockstep
    retryExceptions: [java.io.IOException, java.util.concurrent.TimeoutException]
    ignoreExceptions: [com.app.ValidationException]   # never retry a 4xx</code></pre>
<p><strong>The retry-storm warning worth giving unprompted:</strong> retries <em>amplify</em> load on a struggling service. Three retries at every layer of a four-service chain is 81 requests for one user action — you turn a partial degradation into a full outage. That is why retries need jitter, a budget, and a circuit breaker above them, and why retrying at only one layer is usually the right design.</p>
<p><strong>The bulkhead point:</strong> without it, one dependency that slows from 50 ms to 5 s consumes every thread in a shared pool, and requests that never touch that dependency start timing out too. Separate pools mean the failure stays contained — which is the entire reason the pattern is named after ship compartments.</p>`
},
{
  q: "How do you decide service boundaries, and when should you not use microservices?",
  level: "advanced", hot: true, tags: ["architecture", "ddd", "design", "trade-offs"],
  companies: ["Amazon", "ThoughtWorks", "SAP", "Optum", "Maersk", "Flipkart", "EPAM", "Publicis Sapient"],
  a: `<table>
<tr><th>Good boundary signal</th><th>Bad boundary signal</th></tr>
<tr><td>Owns its data exclusively</td><td>Shares a database with another service</td></tr>
<tr><td>Maps to a business capability</td><td>Maps to a technical layer ("the DAO service")</td></tr>
<tr><td>Deployable independently</td><td>Every release needs two services deployed together</td></tr>
<tr><td>One team owns it end to end</td><td>Three teams change the same service weekly</td></tr>
<tr><td>Changes for one business reason</td><td>Changes whenever anything changes</td></tr>
<tr><td>Communicates through events or a stable API</td><td>Chatty synchronous calls in a loop</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Distributed monolith versus properly bounded services">
  <text class="dg-t" x="16" y="20">distributed monolith</text>
  <circle class="dg-fill" cx="70" cy="72" r="24"/><circle class="dg-fill" cx="160" cy="52" r="24"/><circle class="dg-fill" cx="150" cy="118" r="24"/>
  <path class="dg-line" d="M92 64 H138 M86 88 L130 108 M158 76 L152 96 M138 60 L94 80 M130 112 L88 92"/>
  <rect class="dg-box" x="40" y="140" width="150" height="22" rx="4"/><text class="dg-s" x="115" y="156" text-anchor="middle">one shared database</text>
  <text class="dg-t" x="360" y="20">bounded services</text>
  <circle class="dg-fill2" cx="400" cy="60" r="26"/><rect class="dg-box" x="374" y="94" width="52" height="20" rx="4"/>
  <circle class="dg-fill2" cx="530" cy="60" r="26"/><rect class="dg-box" x="504" y="94" width="52" height="20" rx="4"/>
  <path class="dg-line" d="M428 60 H502" marker-end="url(#mb1)"/>
  <text class="dg-s" x="465" y="50" text-anchor="middle">events</text>
  <text class="dg-s" x="360" y="146">each owns its own data;</text>
  <text class="dg-s" x="360" y="162">deployable independently</text>
  <defs><marker id="mb1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The failure mode to name:</strong> the <em>distributed monolith</em> — services split by technical layer, sharing a database, released together. You pay every cost of distribution (network failures, eventual consistency, tracing, deployment complexity) and get none of the benefits (independent deployment, independent scaling, fault isolation). It is strictly worse than the monolith it replaced.</p>
<table>
<tr><th>Microservices genuinely help when</th><th>A modular monolith is better when</th></tr>
<tr><td>Multiple teams need to deploy independently</td><td>One team, or fewer than about fifteen engineers</td></tr>
<tr><td>Parts of the system have very different scaling profiles</td><td>The whole system scales together</td></tr>
<tr><td>Different parts need different technologies or compliance boundaries</td><td>The domain is not yet well understood</td></tr>
<tr><td>Fault isolation is a hard requirement</td><td>You do not yet have CI/CD, monitoring and tracing</td></tr>
<tr><td>The domain boundaries are stable and well understood</td><td>Boundaries are still moving — refactoring across a network is brutal</td></tr>
</table>
<pre><code>// Domain-driven design gives the vocabulary
// BOUNDED CONTEXT: "customer" means different things in different contexts —
//   sales:    lead source, pipeline stage
//   billing:  payment method, credit limit
//   support:  ticket history, entitlements
// One shared Customer god-object couples all three forever. Three contexts,
// each with its own model and a shared identifier, do not.

// The strangler fig migration, when splitting an existing monolith:
//   1. Put a facade or gateway in front of the monolith
//   2. Extract ONE bounded context with its own data
//   3. Route that traffic to the new service
//   4. Repeat — and delete the old code each time, or you own two systems</code></pre>
<p><strong>What to say when asked "would you use microservices here?":</strong> "It depends on the team more than the technology. Microservices are an organisational solution — they let teams deploy without coordinating. With one team, they add network calls, eventual consistency and operational overhead to solve a coordination problem you do not have. I would start with a modular monolith with clear internal boundaries, and extract a service when a specific pressure justifies it — a scaling need, a compliance boundary, or a second team."</p>
<p>That answer is stronger than an enthusiastic yes, because the most expensive architecture mistakes come from adopting distribution before the boundaries are understood.</p>`
}
]);
