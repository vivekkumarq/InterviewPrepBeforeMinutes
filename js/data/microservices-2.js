appendTopic("microservices", [
{
  q: "What is the CQRS pattern and when is it worth the complexity?",
  level: "advanced", hot: true, tags: ["patterns", "architecture"],
  a: `<p><strong>Command Query Responsibility Segregation</strong> separates the model that <em>writes</em> from the model that <em>reads</em>. They can have different schemas, different databases, and scale independently.</p>
<pre><code>Command side                          Query side
-----------                           ----------
POST /orders                          GET /orders?status=PAID
 -&gt; validate, enforce invariants        -&gt; read a denormalised projection
 -&gt; write to the normalised model       -&gt; no joins, no domain logic
 -&gt; publish OrderPlaced event  ------&gt;  -&gt; projection updated by the event</code></pre>
<pre><code>// Write model — rich domain object, enforces rules
@Entity
public class Order {
    public void cancel() {
        if (status != PENDING) throw new IllegalStateTransitionException(status, CANCELLED);
        this.status = CANCELLED;
        registerEvent(new OrderCancelledEvent(id));
    }
}

// Read model — a flat, query-shaped projection, updated by events
@Entity @Table(name = "order_summary_view")
public record OrderSummaryView(String orderId, String customerName, String customerEmail,
                               BigDecimal total, String status, int itemCount) { }</code></pre>
<p><strong>Why you would do this:</strong> reads and writes have genuinely different requirements. Reads are usually 10–100× more frequent, need denormalised shapes to avoid joins, and can tolerate being slightly stale. Writes need normalisation, invariants and transactions. Forcing both through one model means every query fights the domain model, and every domain change breaks a report.</p>
<p><strong>When it is worth it:</strong> a large read/write ratio disparity, complex reporting over data owned by several services, or a domain where the write model is genuinely complex. <strong>When it is not:</strong> ordinary CRUD — you have doubled the number of models and introduced eventual consistency for no benefit.</p>
<p><strong>Be explicit about the cost:</strong> the projection lags behind the write, so a user may not immediately see their own change. That must be designed for — read-your-own-writes routing, an optimistic UI update, or a visible "processing" state. Also monitor projection lag, and have a rebuild mechanism, because projections <em>will</em> drift or get corrupted at some point.</p>
<p>CQRS does <em>not</em> require event sourcing, though they are often paired — that is worth clarifying, as interviewers frequently conflate them.</p>`
},
{
  q: "What is event sourcing and what are its trade-offs?",
  level: "advanced", hot: true, tags: ["patterns", "architecture"],
  a: `<p>Instead of storing current state, you store the <strong>sequence of events</strong> that produced it. Current state is derived by replaying them.</p>
<pre><code>// Traditional:  UPDATE account SET balance = 1500 WHERE id = 1;   (history is lost)

// Event sourced — the event log IS the source of truth
AccountOpened     { accountId: 1, initialBalance: 0     }
MoneyDeposited    { accountId: 1, amount: 2000          }
MoneyWithdrawn    { accountId: 1, amount: 500           }
// current balance = fold(events) = 1500

public class Account {
    private BigDecimal balance = ZERO;

    public void apply(Event e) {
        switch (e) {
            case MoneyDeposited d -&gt; balance = balance.add(d.amount());
            case MoneyWithdrawn w -&gt; balance = balance.subtract(w.amount());
            default -&gt; { }
        }
    }
    public static Account rehydrate(List&lt;Event&gt; history) {
        var a = new Account();
        history.forEach(a::apply);            // replay to reach current state
        return a;
    }
}</code></pre>
<table>
<tr><th>Benefits</th><th>Costs</th></tr>
<tr><td>Complete audit trail — free, and required in finance and healthcare</td><td>Querying current state requires projections</td></tr>
<tr><td>Time travel — reconstruct state at any past moment</td><td>Event schema evolution is genuinely hard; old events are immutable forever</td></tr>
<tr><td>New projections can be built from history</td><td>Steep learning curve; unfamiliar to most teams</td></tr>
<tr><td>Debugging — you can see exactly what happened</td><td>GDPR deletion conflicts with an immutable log (needs crypto-shredding)</td></tr>
<tr><td>Natural fit for event-driven integration</td><td>Storage grows indefinitely; needs snapshots for long-lived aggregates</td></tr>
</table>
<p><strong>Snapshots</strong> are the standard performance answer: replaying 200,000 events per read is unacceptable, so you periodically persist the aggregate state and replay only events after the snapshot.</p>
<p><strong>The judgement to express:</strong> "I would use it where the event log is genuinely valuable to the business — ledgers, order lifecycles, regulated audit trails. For ordinary CRUD it adds substantial complexity for a benefit nobody asked for. And the hardest part in practice is not the writing, it is schema evolution: an event written three years ago must still be readable today."</p>`
},
{
  q: "How do you handle distributed transactions without two-phase commit?",
  level: "advanced", hot: true, tags: ["consistency", "patterns"],
  a: `<p><strong>Why not 2PC:</strong> it holds locks across services for the duration of the transaction, the coordinator is a single point of failure, it blocks if the coordinator dies after prepare, it does not scale, and most modern datastores and message brokers do not support XA. It couples availability of every participant.</p>
<p><strong>The toolkit that replaces it:</strong></p>
<ol>
<li><strong>Saga</strong> — a sequence of local transactions, each with a compensating action. Orchestrated for complex flows, choreographed for simple ones.</li>
<li><strong>Transactional outbox</strong> — solves the dual-write problem: write the business change and the event to publish in the <em>same</em> local transaction, and let a relay (or Debezium CDC) publish from the outbox table.</li>
<li><strong>Idempotent consumers</strong> — delivery is at-least-once, so every consumer deduplicates by event ID.</li>
<li><strong>Reservation pattern</strong> — instead of a distributed transaction, reserve capacity first and confirm later, with a timeout that releases it. This is how seat booking and inventory allocation actually work.</li>
</ol>
<pre><code>// Reservation pattern — avoids the need for cross-service atomicity entirely
1. POST /inventory/reservations { sku, qty, ttl: 15m }   -&gt; reservationId (stock held)
2. POST /payments { orderId, amount }                     -&gt; charged
3. POST /inventory/reservations/{id}/confirm              -&gt; stock committed
   // if step 2 fails, do nothing — the reservation expires and stock is released
   // a background sweeper reclaims expired reservations</code></pre>
<p><strong>The mental shift to articulate:</strong> you stop trying to make several services atomic, and instead design the business process to tolerate intermediate states. An order sits in <code>PENDING</code>; stock is <code>RESERVED</code> not <code>SOLD</code>; the user sees "processing". Those states are not a workaround — they model what is actually happening.</p>
<p><strong>And always plan the reconciliation path:</strong> a scheduled job that finds sagas stuck beyond a timeout, and an operational runbook for resolving them. In a distributed system some transactions <em>will</em> end up in limbo, and the difference between a mature system and a fragile one is whether that case was designed for.</p>`
},
{
  q: "What is the Backend for Frontend (BFF) pattern?",
  level: "advanced", tags: ["architecture", "patterns"],
  a: `<p>Instead of one general-purpose API serving every client, you build a <strong>separate backend per client type</strong> — one for web, one for mobile, one for partners — each owned by the team that owns that frontend.</p>
<pre><code>Web app     -&gt; Web BFF     ─┐
Mobile app  -&gt; Mobile BFF  ─┼-&gt; Order service, Customer service, Payment service...
Partner API -&gt; Partner BFF ─┘</code></pre>
<p><strong>The problem it solves:</strong> a single shared API inevitably becomes a compromise. Mobile needs small payloads and few round trips; the web dashboard needs rich nested data; partners need a stable, restricted contract. Serving all three from one API means every change requires cross-team negotiation, and the API accumulates optional parameters nobody fully understands.</p>
<p><strong>What each BFF does:</strong> aggregates several downstream calls into one response, reshapes data for that specific UI, handles client-specific auth (cookies for web, tokens for mobile), and can cache per client. Crucially, it is <em>owned by the frontend team</em>, so they can change it without waiting on a backend team.</p>
<pre><code>@GetMapping("/mobile/home")                    // one call renders the whole screen
public HomeScreen home(@AuthenticationPrincipal Jwt jwt) {
    var orders  = CompletableFuture.supplyAsync(() -&gt; orderClient.recent(jwt), pool);
    var offers  = CompletableFuture.supplyAsync(() -&gt; offerClient.forUser(jwt), pool);
    var profile = CompletableFuture.supplyAsync(() -&gt; customerClient.summary(jwt), pool);
    CompletableFuture.allOf(orders, offers, profile).join();
    return HomeScreen.of(orders.join(), offers.join(), profile.join());   // trimmed for mobile
}</code></pre>
<p><strong>Costs to acknowledge:</strong> duplicated logic across BFFs, more services to deploy and monitor, and a risk that business rules leak into what should be a thin aggregation layer. Keep BFFs free of domain logic — they orchestrate and reshape, they do not decide.</p>
<p><strong>The alternative worth comparing:</strong> GraphQL solves the same over/under-fetching problem with one endpoint, letting each client request its own shape. BFF is simpler operationally and gives stronger per-client control; GraphQL avoids duplicating aggregation code. Many organisations use GraphQL <em>as</em> the BFF.</p>`
},
{
  q: "How do you handle service versioning and contract evolution across teams?",
  level: "advanced", tags: ["versioning", "process"],
  a: `<p>The hard part is organisational: you cannot coordinate a synchronised release across ten teams, so <strong>uncoordinated deployment must be safe by design</strong>.</p>
<ol>
<li><strong>Consumer-driven contract tests</strong> are the single highest-leverage control. Each consumer publishes what it expects; the provider's CI verifies every consumer's contract before merge. A breaking change fails the build instead of failing in production.
<pre><code># Pact broker — the deployment gate
pact-broker can-i-deploy --pacticipant order-service \\
    --version $GIT_SHA --to-environment production</code></pre></li>
<li><strong>Additive-only changes by default.</strong> New optional fields, new endpoints, new event types. Never rename, retype or remove without a migration.</li>
<li><strong>Tolerant readers.</strong> Every consumer ignores unknown fields and handles unknown enum values, so providers can add without breaking anyone.</li>
<li><strong>Expand and contract</strong> for genuinely breaking changes, over several releases, with usage metrics telling you when the old form is safe to remove.</li>
<li><strong>Schema registry for events</strong> with BACKWARD compatibility enforced at registration, so an incompatible event schema is rejected before it reaches a topic.</li>
<li><strong>Run at most two versions</strong> concurrently, with a published sunset date. Every extra version is permanent maintenance and testing cost.</li>
</ol>
<p><strong>The point to make about ownership:</strong> a contract has two sides, and the provider cannot know every consumer's assumptions. Contract tests invert that — consumers state their expectations explicitly, and the provider is accountable to those specific expectations rather than to an imagined general contract. That is what makes independent deployment genuinely safe rather than merely hoped for.</p>
<p>Pair it with a service catalogue recording who consumes what, so when you do need to break something, you know exactly whom to talk to.</p>`
},
{
  q: "What is a service mesh and do you need one?",
  level: "advanced", tags: ["infrastructure"],
  a: `<p>A service mesh moves cross-cutting network concerns out of your application and into a <strong>sidecar proxy</strong> (Envoy) deployed alongside every pod. Istio, Linkerd and Consul Connect are the common implementations.</p>
<table>
<tr><th>Concern</th><th>In the application</th><th>In the mesh</th></tr>
<tr><td>mTLS between services</td><td>Certificate handling in every service</td><td>Automatic, with rotation</td></tr>
<tr><td>Retries, timeouts, circuit breaking</td><td>Resilience4j per service, per language</td><td>Declarative policy</td></tr>
<tr><td>Traffic splitting (canary)</td><td>Custom routing</td><td>Percentage-based rules</td></tr>
<tr><td>Observability</td><td>Instrument every service</td><td>Uniform metrics and traces for free</td></tr>
<tr><td>Access policy</td><td>Code in each service</td><td>Central authorization policy</td></tr>
</table>
<pre><code>apiVersion: networking.istio.io/v1beta1
kind: VirtualService
spec:
  http:
    - route:
        - destination: { host: orders, subset: v1 }
          weight: 90
        - destination: { host: orders, subset: v2 }     # canary
          weight: 10
      retries: { attempts: 3, perTryTimeout: 2s, retryOn: 5xx,connect-failure }
      timeout: 10s</code></pre>
<p><strong>The genuine benefit:</strong> in a polyglot estate, you implement retries, mTLS and tracing <em>once</em> in the platform instead of once per language. Policy becomes declarative and auditable, and you get consistent golden metrics for every service without touching code.</p>
<p><strong>The honest counterargument:</strong> a mesh adds a proxy to every pod — extra latency (typically single-digit milliseconds), extra memory, and a substantial operational surface. Debugging becomes harder because there is another hop that can fail. For a handful of JVM services, Resilience4j plus Micrometer gives you most of the value with a fraction of the complexity.</p>
<p><strong>My position:</strong> a mesh earns its keep at meaningful scale, with multiple languages, or where zero-trust mTLS is a compliance requirement. Below that, it is infrastructure you will spend more time operating than benefiting from. Linkerd is worth naming as the notably lighter option if you do need one.</p>`
},
{
  q: "How do you migrate a shared database between microservices?",
  level: "advanced", hot: true, tags: ["migration", "data"],
  a: `<p>A shared database is the most damaging coupling in a microservices estate — nobody can change a schema, and every service can corrupt another's invariants. Untangling it must be incremental.</p>
<ol>
<li><strong>Establish ownership.</strong> Decide which service owns each table. This is a design decision, not a technical one, and it is the step teams skip.</li>
<li><strong>Stop cross-service writes first.</strong> Writes are more dangerous than reads. Any service writing to another's tables must switch to calling the owner's API or publishing an event.</li>
<li><strong>Introduce a read API or replicate the data.</strong> For services that only read another's tables, either call the owner's API, or let them keep a local read-only copy kept current by events (a materialised view).</li>
<li><strong>Split the schema.</strong> Move the tables into a separate schema, then a separate database instance. Foreign keys crossing the boundary must be dropped and replaced with application-level references — expect this to be the painful part.</li>
<li><strong>Handle the joins you lose.</strong> A query that joined orders to customers now needs either an API call, a denormalised copy of the customer name on the order, or a read model built from events. Denormalisation is usually correct here.</li>
<li><strong>Verify with dual reads</strong> before cutting over — read from both sources and compare, logging discrepancies until you trust the new path.</li>
</ol>
<pre><code>-- Interim step: enforce the boundary before physically splitting
REVOKE ALL ON orders FROM billing_service_user;
GRANT SELECT ON order_summary_view TO billing_service_user;   -- a deliberate contract</code></pre>
<p><strong>The technique worth naming:</strong> <strong>Debezium CDC</strong> makes this far easier — stream the owner's table changes into Kafka, and let dependent services build their own local projections. That decouples them without requiring the owner to build a bespoke API for every consumer, and it works while both the old and new paths are live.</p>
<p><strong>Set expectations honestly:</strong> this is a multi-quarter effort on a real system, and the right approach is one table group at a time alongside feature work — not a freeze-and-rewrite.</p>`
},
{
  q: "How do you decide between synchronous REST, async messaging and gRPC between services?",
  level: "advanced", tags: ["architecture", "communication"],
  a: `<p>Decide from the <em>interaction pattern</em>, not from preference:</p>
<table>
<tr><th>Need</th><th>Choose</th><th>Why</th></tr>
<tr><td>A fresh answer now, caller cannot proceed without it</td><td><strong>REST or gRPC</strong></td><td>Request/response is the honest model</td></tr>
<tr><td>Notify others that something happened</td><td><strong>Events (Kafka)</strong></td><td>Publisher does not need to know or wait for consumers</td></tr>
<tr><td>Trigger work that can happen later</td><td><strong>Message queue</strong></td><td>Buffering, retry and backpressure for free</td></tr>
<tr><td>High-volume internal calls, latency sensitive</td><td><strong>gRPC</strong></td><td>Binary, multiplexed over HTTP/2, generated clients</td></tr>
<tr><td>Public or partner-facing</td><td><strong>REST</strong></td><td>Universal tooling and client support</td></tr>
<tr><td>Streaming data</td><td><strong>gRPC streams or Kafka</strong></td><td>Purpose-built</td></tr>
</table>
<p><strong>The rule I would state:</strong> <em>queries synchronous, state changes asynchronous.</em> A read that must reflect current state is a synchronous call. Something that <em>happened</em> — an order was placed, a payment settled — is an event, and everyone who cares subscribes.</p>
<p><strong>Why this matters mathematically:</strong> synchronous chains multiply failure. Five services at 99.9% availability in series give 99.5% — roughly 44 hours of downtime a year created purely by coupling. Each synchronous hop also adds its latency to the user-visible total. Events break both chains.</p>
<pre><code>// ✘ Checkout blocked on four services being up and fast
order.save(); inventory.reserve(); payment.charge(); shipping.schedule(); email.send();

// ✔ Commit locally, publish once; consumers react independently and retry on their own
order.save();
publisher.publish(new OrderPlacedEvent(order.id()));</code></pre>
<p><strong>The trade-off to acknowledge:</strong> asynchronous means eventual consistency and harder debugging — you need distributed tracing, correlation IDs and dead-letter monitoring before you rely on it. Do not go event-driven without that observability in place first.</p>`
}
]);
