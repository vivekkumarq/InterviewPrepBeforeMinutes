registerPrimer("microservices", `<h3>The mental model: small services that each own their data</h3>
<p>A monolith is one deployable application with one database. Microservices split it into several small applications, each built around one business capability (orders, payments, inventory), each with <strong>its own database</strong> that no other service touches directly. Services talk over the network: synchronously with HTTP or gRPC when the caller needs an answer now, and asynchronously with events when it does not.</p>
<p>The benefit is independence: teams deploy, scale and change their service without coordinating with everyone else. The price is that every function call that used to be in-memory is now a network call that can be slow, fail, or succeed on one side only. <strong>Most microservices questions are about paying that price well.</strong></p>
<figure class="fig">
<svg viewBox="0 0 620 250" role="img" aria-label="Clients go through an API gateway to order, payment and inventory services, each with its own database, connected by an event broker">
  <defs><marker id="pr-ms" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="98" width="80" height="50" rx="8"/>
  <text class="dg-t" x="50" y="120" text-anchor="middle">Web /</text>
  <text class="dg-t" x="50" y="136" text-anchor="middle">Mobile</text>
  <line class="dg-line" x1="90" y1="123" x2="116" y2="123" marker-end="url(#pr-ms)"/>
  <rect class="dg-fill" x="118" y="86" width="96" height="74" rx="9"/>
  <text class="dg-t" x="166" y="112" text-anchor="middle">API</text>
  <text class="dg-t" x="166" y="128" text-anchor="middle">gateway</text>
  <text class="dg-s" x="166" y="146" text-anchor="middle">auth, rate limits</text>
  <line class="dg-line" x1="214" y1="110" x2="258" y2="52" marker-end="url(#pr-ms)"/>
  <line class="dg-line" x1="214" y1="123" x2="258" y2="123" marker-end="url(#pr-ms)"/>
  <line class="dg-line" x1="214" y1="136" x2="258" y2="194" marker-end="url(#pr-ms)"/>
  <rect class="dg-fill2" x="260" y="26" width="120" height="50" rx="8"/><text class="dg-t" x="320" y="48" text-anchor="middle">Order</text><text class="dg-s" x="320" y="64" text-anchor="middle">service</text>
  <rect class="dg-fill2" x="260" y="98" width="120" height="50" rx="8"/><text class="dg-t" x="320" y="120" text-anchor="middle">Payment</text><text class="dg-s" x="320" y="136" text-anchor="middle">service</text>
  <rect class="dg-fill2" x="260" y="170" width="120" height="50" rx="8"/><text class="dg-t" x="320" y="192" text-anchor="middle">Inventory</text><text class="dg-s" x="320" y="208" text-anchor="middle">service</text>
  <line class="dg-line" x1="380" y1="51" x2="406" y2="51" marker-end="url(#pr-ms)"/>
  <line class="dg-line" x1="380" y1="123" x2="406" y2="123" marker-end="url(#pr-ms)"/>
  <line class="dg-line" x1="380" y1="195" x2="406" y2="195" marker-end="url(#pr-ms)"/>
  <rect class="dg-box" x="408" y="32" width="64" height="38" rx="6"/><text class="dg-s" x="440" y="55" text-anchor="middle">orders DB</text>
  <rect class="dg-box" x="408" y="104" width="64" height="38" rx="6"/><text class="dg-s" x="440" y="127" text-anchor="middle">pay DB</text>
  <rect class="dg-box" x="408" y="176" width="64" height="38" rx="6"/><text class="dg-s" x="440" y="199" text-anchor="middle">stock DB</text>
  <rect class="dg-fill" x="500" y="26" width="110" height="194" rx="10"/>
  <text class="dg-t" x="555" y="50" text-anchor="middle">Event broker</text>
  <text class="dg-s" x="555" y="68" text-anchor="middle">Kafka / RabbitMQ</text>
  <text class="dg-m" x="555" y="104" text-anchor="middle">OrderPlaced</text>
  <text class="dg-m" x="555" y="132" text-anchor="middle">PaymentDone</text>
  <text class="dg-m" x="555" y="160" text-anchor="middle">StockReserved</text>
  <text class="dg-s" x="555" y="196" text-anchor="middle">services react to</text>
  <text class="dg-s" x="555" y="210" text-anchor="middle">each other's events</text>
  <text class="dg-s" x="10" y="242">No service reads another's database. Data crosses a boundary only through an API call or an event.</text>
</svg>
<figcaption>Database per service is the rule that makes services independent, and also the reason cross-service consistency needs sagas.</figcaption>
</figure>
<h3>Worked example: placing an order when three services each own a piece</h3>
<p>In a monolith, placing an order is one database transaction: insert the order, charge the card, decrement stock, commit. With three databases there is no single transaction. Instead the work is a <strong>saga</strong>: a sequence of local transactions, where each step has a <em>compensating</em> action that undoes it if a later step fails.</p>
<pre><code>HAPPY PATH (choreography: each service reacts to events)
  Order      creates order, status=PENDING           -&gt; emits OrderPlaced
  Inventory  reserves stock                          -&gt; emits StockReserved
  Payment    charges the card                        -&gt; emits PaymentDone
  Order      marks order CONFIRMED

FAILURE: the card is declined
  Payment    charge fails                            -&gt; emits PaymentFailed
  Inventory  RELEASES the reserved stock             (compensation)
  Order      marks order CANCELLED, tells the user   (compensation)

Nothing was ever "rolled back" in the database sense. Each service
undid its own step with a new, forward-moving transaction.</code></pre>
<table>
<tr><th>Pattern</th><th>Problem it solves</th></tr>
<tr><td><strong>API gateway</strong></td><td>One entry point for clients; auth and rate limiting in one place</td></tr>
<tr><td><strong>Saga</strong></td><td>A business transaction across several databases</td></tr>
<tr><td><strong>Outbox</strong></td><td>Save to your database and publish an event without losing either one</td></tr>
<tr><td><strong>Circuit breaker, timeout, retry</strong></td><td>One slow service dragging all its callers down</td></tr>
<tr><td><strong>Idempotent consumers</strong></td><td>Events are delivered at least once, so duplicates must be harmless</td></tr>
<tr><td><strong>Distributed tracing</strong></td><td>Following one request through ten services</td></tr>
</table>
<p><strong>When not to do this at all:</strong> a small team, an unclear domain, or no need for independent scaling. A well-structured monolith (clear modules, no shared tables between modules) gives most of the benefit with none of the network problems, and can be split later along the module lines.</p>`);

appendTopic("microservices", [
{
  q: "Your API calls five other services per request. How do you keep its latency down?",
  level: "advanced", hot: true, tags: ["latency", "fan-out", "performance", "resilience", "must-know"],
  companies: ["Amazon", "Uber", "Swiggy", "Zomato", "Flipkart", "Netflix", "Walmart"],
  a: `<p>A product page needs data from the catalogue, pricing, inventory, reviews and recommendations services. Each is fast on its own, but the page is slow and gets slower at the worst moments. Start with the maths, because it explains everything that follows.</p>
<pre><code>Sequential calls: the latencies ADD UP
  catalogue 40ms + pricing 30 + inventory 25 + reviews 60 + recs 80 = 235ms

Parallel calls: you wait for the SLOWEST one
  max(40, 30, 25, 60, 80) = 80ms

The tail problem: if each service is slow (above its p99) 1% of the time,
the chance that at least one of 5 is slow on a given request is
  1 - 0.99^5 = 4.9%
So YOUR p95 is roughly THEIR p99. Fan-out makes tail latency the normal case.</code></pre>
<p><strong>1. Call in parallel</strong> whatever does not depend on another result.</p>
<pre><code>// Java 21: virtual threads make blocking-style parallel calls cheap
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    var product = exec.submit(() -&gt; catalogue.get(id));
    var price   = exec.submit(() -&gt; pricing.get(id));
    var stock   = exec.submit(() -&gt; inventory.get(id));
    var reviews = exec.submit(() -&gt; reviewsClient.top(id, 5));
    var recs    = exec.submit(() -&gt; recommendations.forProduct(id));

    return new ProductPage(product.get(), price.get(), stock.get(),
                           orEmpty(reviews, 150), orEmpty(recs, 150));
}

// Optional parts get a SHORT deadline and a fallback. A page without
// recommendations is fine; a page that takes 3 seconds is not.
static &lt;T&gt; List&lt;T&gt; orEmpty(Future&lt;List&lt;T&gt;&gt; f, long ms) {
    try { return f.get(ms, TimeUnit.MILLISECONDS); }
    catch (Exception e) { f.cancel(true); return List.of(); }
}</code></pre>
<p><strong>2. Split required from optional.</strong> Catalogue and price are required: without them there is no page. Reviews and recommendations are optional: time-box them and degrade gracefully. This single decision usually removes most of the tail.</p>
<p><strong>3. Give every call a deadline, and pass the deadline down.</strong> If the page must answer in 300ms and 200ms have passed, the next call gets 100ms, not its own default of 2 seconds. gRPC propagates deadlines natively; with HTTP, send the remaining budget in a header.</p>
<p><strong>4. Cache what changes rarely.</strong> Catalogue data changes a few times a day; a local cache with a 60-second TTL removes a network call from most requests. Pricing may be cacheable for a few seconds.</p>
<p><strong>5. Hedge the slowest, idempotent calls.</strong> If the reviews call has not answered by its p95 (say 40ms), send a second identical request to another instance and use whichever answers first. It costs a few percent extra load and cuts the tail sharply. Only for reads.</p>
<p><strong>6. Reduce the number of calls.</strong></p>
<table>
<tr><th>Approach</th><th>How</th></tr>
<tr><td>Batch endpoints</td><td><code>GET /prices?ids=1,2,3</code> instead of three calls for a list page</td></tr>
<tr><td>Backend for Frontend</td><td>One service shaped around the page, which does the fan-out close to the data</td></tr>
<tr><td>Local read models</td><td>Keep a copy of the data you need, updated from events, so the read needs no call at all</td></tr>
</table>
<p><strong>What to measure first:</strong> a distributed trace of a slow request. It shows at a glance whether calls run in sequence that could run in parallel, and which single dependency dominates the tail. Guessing without a trace usually optimises the wrong call.</p>
<p><strong>The summary:</strong> "Parallelise independent calls, time-box optional ones with fallbacks, propagate a deadline budget, cache stable data, and reduce the call count with batching or a read model. Fan-out turns other services' p99 into your median, so the tail is what you design for."</p>`
},
{
  q: "Two services need the same data. Share the database, call an API, or replicate with events?",
  level: "advanced", hot: true, tags: ["data-ownership", "events", "consistency", "design", "must-know"],
  companies: ["Amazon", "Uber", "Flipkart", "Atlassian", "Swiggy", "Razorpay", "Walmart"],
  a: `<p>The Shipping service needs each customer's name and address, which belong to the Customer service. There are three ways to get them, and choosing well is one of the most important microservices decisions.</p>
<pre><code>Option A: Shipping queries the customers table directly (shared database)
Option B: Shipping calls  GET /customers/{id}  when it needs the address
Option C: Customer publishes CustomerUpdated events; Shipping keeps its
          own copy of the fields it needs, in its own database</code></pre>
<table>
<tr><th></th><th>A. Shared DB</th><th>B. API call</th><th>C. Replicate via events</th></tr>
<tr><td>Freshness</td><td>Always current</td><td>Always current</td><td>Seconds behind (eventually consistent)</td></tr>
<tr><td>If Customer service is down</td><td>Still works</td><td><strong>Shipping fails too</strong></td><td>Still works, with the last known data</td></tr>
<tr><td>Latency added</td><td>None</td><td>A network call per use</td><td>None at read time</td></tr>
<tr><td>Customer team can change its schema</td><td><strong>No: Shipping breaks</strong></td><td>Yes, behind the API contract</td><td>Yes, behind the event contract</td></tr>
<tr><td>Complexity</td><td>Lowest</td><td>Low</td><td>Highest: consumer, storage, backfill, replays</td></tr>
</table>
<p><strong>Option A is the one to argue against.</strong> It feels simplest, but it couples the two services at the deepest level. The Customer team can no longer rename a column, split a table, or change databases without breaking a service they may not even know reads their tables. You end up with a <em>distributed monolith</em>: separate deployments that still have to change together.</p>
<p><strong>Choosing between B and C:</strong></p>
<table>
<tr><th>Prefer the API call (B) when</th><th>Prefer replication (C) when</th></tr>
<tr><td>You need the latest value <em>right now</em> (a balance before a payment)</td><td>Slightly stale data is fine (a shipping label, a display name)</td></tr>
<tr><td>You need it rarely</td><td>You need it on every request, or in bulk</td></tr>
<tr><td>The data is large and you only need a little of it at a time</td><td>You need a small subset of fields</td></tr>
<tr><td>The owner service is highly available</td><td>You must keep working when the owner is down</td></tr>
</table>
<pre><code>// Option C in practice: keep ONLY the fields you need
@KafkaListener(topics = "customer-events", groupId = "shipping")
void on(CustomerUpdated e) {
    jdbc.update("""
        insert into shipping_customer (id, name, address, version)
        values (?, ?, ?, ?)
        on conflict (id) do update
          set name = excluded.name, address = excluded.address, version = excluded.version
          where shipping_customer.version &lt; excluded.version""",   // ignore stale events
        e.id(), e.name(), e.address(), e.version());
}
// Shipping now reads its own table: fast, and unaffected by Customer outages.
// The Customer service still OWNS the data; Shipping's copy is read-only.</code></pre>
<p><strong>The detail that decides correctness:</strong> for an order, you often do not want the <em>current</em> address at all. You want the address <strong>at the time the order was placed</strong>. Copy it into the order when it is created. That is not duplication, it is a historical fact, and it removes the dependency entirely.</p>
<p><strong>What to say:</strong> "Never share tables across services: that couples their schemas. If I need the data rarely and it must be current, I call the owner's API. If I need it often, or must survive the owner being down, I replicate the few fields I need from its events. And if what I really need is a snapshot, I copy it at the moment it matters."</p>`
}
]);
