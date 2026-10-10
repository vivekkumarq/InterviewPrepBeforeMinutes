registerPrimer("microservices", `<p class="pr-lead"><b>Microservices</b> means building one big application as several small, separate applications (services), each responsible for one business area such as orders, payments or inventory. Each service can be changed, deployed and scaled on its own, by its own team. The cost is that the services now talk over the network, which brings its own problems.</p>
<div class="pr-analogy"><b>Think of it like this</b>A <b>monolith</b> is one big restaurant kitchen where every cook shares one fridge and one recipe book. A change to one dish can disrupt everyone. <b>Microservices</b> are a food court: separate stalls, each with its own kitchen, staff and supplies. Each stall can change its menu freely, but if you want a meal from three stalls, you have to coordinate between them, and one stall being slow can hold up your whole order.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Monolith</dt><dd>One application, deployed as a single unit, usually with one database.</dd>
<dt>Service</dt><dd>A small, independent application that owns one business capability and its own data.</dd>
<dt>Database per service</dt><dd>Each service has its own database that no other service reads or writes directly.</dd>
<dt>API gateway</dt><dd>The single front door for all client requests, which forwards them to the right service.</dd>
<dt>Synchronous / asynchronous</dt><dd>Synchronous: call a service and wait for the answer. Asynchronous: send an event and carry on without waiting.</dd>
<dt>Saga</dt><dd>A business process spread over several services, where each step can be undone if a later step fails.</dd>
<dt>Circuit breaker</dt><dd>Stops calling a service that keeps failing, so your own service stays responsive.</dd>
<dt>Distributed tracing</dt><dd>Following one user request as it passes through many services, to find where it was slow or failed.</dd>
</dl>

<h3>Step by step: placing an order across three services</h3>
<p>In a monolith, placing an order is one database transaction. With separate services, each with its own database, there is no single transaction, so the work is done as a <b>saga</b>:</p>
<ol class="pr-steps">
<li>The <b>Order</b> service creates the order with status PENDING and announces "order placed".</li>
<li>The <b>Inventory</b> service hears that, reserves the stock, and announces "stock reserved".</li>
<li>The <b>Payment</b> service hears that and charges the card.</li>
<li>If the payment succeeds, the Order service marks the order CONFIRMED.</li>
<li>If the card is declined, Payment announces "payment failed". Inventory then releases the stock, and Order marks the order CANCELLED. Each service undoes its own step. This undo step is called a <b>compensation</b>.</li>
</ol>
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

<h3>The patterns that make it work</h3>
<ul>
<li><b>API gateway:</b> one entry point for clients, handling login checks and rate limits in one place.</li>
<li><b>Saga:</b> a multi-step business process across services, with an undo step for each part.</li>
<li><b>Outbox:</b> save data and announce an event reliably, without losing one or the other.</li>
<li><b>Timeouts, retries and circuit breakers:</b> stop one slow service from freezing all the services that call it.</li>
<li><b>Idempotent consumers:</b> events can arrive twice, so handling the same event twice must be harmless.</li>
<li><b>Distributed tracing:</b> a shared trace id lets you follow one request through every service.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Services sharing one database</p>
<p>If several services read and write the same tables, no team can change a table without breaking others. You end up with the problems of a monolith plus the problems of a network.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> each service owns its data. Others get it through that service's API or its events.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Calling other services without timeouts</p>
<p>If a service you depend on becomes slow, every one of your threads ends up waiting on it, and your service stops answering too. The failure spreads from service to service.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> set a timeout on every outgoing call, and add a circuit breaker and a fallback.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Splitting too early, or by technical layer</p>
<p>Splitting into "a database service" and "a UI service", or splitting a small app before you understand it, creates services that must always change and deploy together: a "distributed monolith".</p>
<p class="pm-fix"><strong>✅ Fix:</strong> split by business capability (orders, payments), and only when teams and scale really need it. A well-organised monolith is a fine starting point.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ No way to trace a request</p>
<p>When one click passes through eight services and fails, logs scattered over eight places are almost impossible to follow.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> pass a trace id with every call and use distributed tracing, so you can see the whole journey in one view.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Microservices are small, independent services, each owning one business area and its own data.</li>
<li>They give team independence and separate scaling, at the cost of network complexity.</li>
<li>Use sagas instead of cross-service database transactions.</li>
<li>Protect every network call with timeouts, retries and circuit breakers.</li>
<li>Start with a well-structured monolith unless you clearly need microservices.</li>
</ul>
<p><b>Next:</b> the questions below cover service boundaries, communication styles, data consistency, resilience, testing and deployment.</p>`);

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
