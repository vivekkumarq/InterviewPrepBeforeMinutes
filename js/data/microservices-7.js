appendTopic("microservices", [
{
  q: "The dual-write problem and the outbox pattern — how do you publish an event and commit atomically?",
  level: "advanced", hot: true, tags: ["saga", "outbox", "consistency", "must-know"],
  companies: ["Amazon", "Uber", "Netflix", "Microsoft", "Goldman Sachs", "Flipkart", "Walmart", "SAP"],
  a: `<p>Two-phase commit across services is the answer nobody wants: it needs a coordinator, holds locks across network calls, and blocks everything when a participant dies. The real answer is to accept <strong>eventual consistency</strong> and design the compensation explicitly.</p>
<table>
<tr><th>Pattern</th><th>What it does</th><th>Cost</th></tr>
<tr><td><strong>Saga</strong></td><td>A sequence of local transactions, each with a compensating action</td><td>No isolation — intermediate states are visible</td></tr>
<tr><td><strong>Outbox</strong></td><td>Write the event to the same DB transaction as the data, publish later</td><td>Needs a relay process or CDC</td></tr>
<tr><td><strong>Idempotency key</strong></td><td>Makes retries safe</td><td>A dedupe store with a TTL</td></tr>
<tr><td><strong>Event sourcing</strong></td><td>The event log is the source of truth</td><td>Big conceptual shift; replay and versioning complexity</td></tr>
<tr><td><strong>CQRS</strong></td><td>Separate write model from read model</td><td>The read side is stale by design</td></tr>
</table>
<pre><code>// THE DUAL-WRITE PROBLEM — the bug every candidate should be able to name
@Transactional
public void placeOrder(Order o) {
    orderRepository.save(o);          // 1. commits to the database
    kafka.send("order.placed", o);    // 2. crashes here?
}
// The database has the order; Kafka never got the event. Inventory is never
// reserved. Nothing is retried, because from the service's view it "succeeded".
// Swapping the order just breaks the other way: an event for an order that
// does not exist. You cannot make two systems commit atomically this way.

// THE OUTBOX PATTERN — one transaction, one database
@Transactional
public void placeOrder(Order o) {
    orderRepository.save(o);
    outboxRepository.save(new OutboxEvent("order.placed", toJson(o)));  // SAME tx
}
// Both rows commit or neither does. A separate relay — a poller, or Debezium
// reading the write-ahead log — publishes the outbox rows to Kafka and marks
// them sent.
//
// This gives AT-LEAST-ONCE delivery, never exactly-once. The relay can crash
// after publishing but before marking. So consumers MUST be idempotent —
// that is the non-negotiable consequence, and interviewers check you say it.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="Saga with compensating transactions on failure">
  <rect class="dg-fill" x="14" y="24" width="106" height="38" rx="6"/><text class="dg-t" x="67" y="48" text-anchor="middle">Order</text>
  <rect class="dg-fill" x="150" y="24" width="106" height="38" rx="6"/><text class="dg-t" x="203" y="48" text-anchor="middle">Payment</text>
  <rect class="dg-fill" x="286" y="24" width="106" height="38" rx="6"/><text class="dg-t" x="339" y="48" text-anchor="middle">Inventory</text>
  <rect class="dg-fill2" x="422" y="24" width="106" height="38" rx="6"/><text class="dg-t" x="475" y="48" text-anchor="middle">Shipping ✗</text>
  <path class="dg-line" d="M120 43 L150 43 M256 43 L286 43 M392 43 L422 43" marker-end="url(#sg9)"/>
  <text class="dg-s" x="14" y="96">forward: each step commits locally and emits an event</text>
  <path class="dg-line" d="M422 128 L392 128 M286 128 L256 128 M150 128 L120 128" marker-end="url(#sg9)"/>
  <text class="dg-s" x="14" y="158">compensate: refund payment, release stock, cancel order —</text>
  <text class="dg-s" x="14" y="180">in REVERSE order, and every compensation must be idempotent</text>
  <defs><marker id="sg9" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Saga style</th><th>How it works</th><th>Choose it when</th></tr>
<tr><td><strong>Choreography</strong></td><td>Each service listens for events and reacts</td><td>Few steps; no central owner. Debugging gets hard fast</td></tr>
<tr><td><strong>Orchestration</strong></td><td>A coordinator drives each step explicitly</td><td>Many steps or complex rules — the flow is in one readable place</td></tr>
</table>
<pre><code>// COMPENSATION IS NOT ROLLBACK — the distinction to make explicit
// You cannot un-send an email. You send an apology.
// You cannot un-charge a card atomically. You issue a refund, which is a new
// transaction with its own record.
//
// So design compensations as real business operations, and accept that the
// intermediate state was VISIBLE. If an order must never be seen half-created,
// use a status field: PENDING -> CONFIRMED, and hide PENDING from the UI.
// That is the practical replacement for isolation.

// IDEMPOTENCY — the client supplies the key, the server dedupes
@PostMapping("/payments")
public Payment pay(@RequestHeader("Idempotency-Key") String key, @RequestBody Req r) {
    return store.findByKey(key)                  // seen it? return the SAME result
                .orElseGet(() -&gt; process(key, r));
}
// Store the RESPONSE, not just a "seen" flag — a retry must get the original
// answer, not a fresh charge and not an error.</code></pre>
<p><strong>The sentence that frames it well:</strong> "I would avoid the distributed transaction entirely. First by drawing service boundaries so that one business operation is one service's local transaction wherever possible — and where it genuinely spans services, a saga with an outbox, idempotent consumers, and compensations designed as real business actions rather than pretend rollbacks."</p>`
},
{
  q: "What is a distributed monolith, and how do you tell you have built one?",
  level: "advanced", hot: true, tags: ["ddd", "boundaries", "architecture", "must-know"],
  companies: ["Amazon", "Microsoft", "Uber", "SAP", "Goldman Sachs", "Flipkart", "Walmart", "Infosys"],
  a: `<p>Boundaries are the one decision that is expensive to reverse. Everything else — language, database, deployment — can be changed later. Get the split wrong and you have a distributed monolith: all the operational cost, none of the independence.</p>
<table>
<tr><th>Split by</th><th>Verdict</th></tr>
<tr><td><strong>Business capability / bounded context</strong></td><td><strong>Correct.</strong> Ordering, Payments, Inventory — each owns its data and its rules</td></tr>
<tr><td>Technical layer (a "database service", a "DAO service")</td><td>Wrong. Every feature then touches every service</td></tr>
<tr><td>Entity (a "User service", an "Address service")</td><td>Usually wrong — too fine, and chatty</td></tr>
<tr><td>Team structure</td><td>Partly right — Conway's law is real, so align teams to the boundaries you want</td></tr>
<tr><td>Rate of change / scaling profile</td><td>Good secondary signal — split what deploys or scales differently</td></tr>
</table>
<pre><code>// THE TESTS FOR A GOOD BOUNDARY — apply them honestly
1. Can it be deployed WITHOUT coordinating with another team? If a feature
   always needs two services released together, the boundary is wrong.
2. Does it own its data EXCLUSIVELY? Two services writing one table is one
   service with extra network hops.
3. Can it survive a downstream being down? If not, ask whether they should be
   one service.
4. Is a typical request served by ONE service, or does it fan out to six?
5. Does the team understand the domain language inside it without translation?</code></pre>
<table>
<tr><th>Symptom of a bad split</th><th>What it means</th></tr>
<tr><td>A feature always changes 3+ services</td><td>The boundary cuts through a single concept</td></tr>
<tr><td>Shared database tables</td><td>Not independent services at all</td></tr>
<tr><td>Chatty synchronous calls per request</td><td>Boundaries are too fine — latency and failure multiply</td></tr>
<tr><td>Distributed transactions everywhere</td><td>One transaction boundary was split across services</td></tr>
<tr><td>A shared library every service must upgrade together</td><td>Coupling moved from code to release process</td></tr>
<tr><td>Cannot deploy independently</td><td>The defining failure — this is a distributed monolith</td></tr>
</table>
<pre><code>// THE SAME WORD MEANS DIFFERENT THINGS — the core DDD insight
// "Customer" in three contexts:
//   Sales:    leads, opportunity stage, assigned rep
//   Billing:  payment methods, invoices, tax identity
//   Support:  tickets, entitlements, satisfaction score
//
// One shared canonical Customer model has to satisfy all three, so it becomes
// a 60-field object that every team must coordinate to change.
// Each context should own ITS model, linked by a shared customer ID.
// Recognising that is the difference between a DDD answer and an org-chart one.</code></pre>
<pre><code>// STRANGLER FIG — how you actually migrate, if asked
// 1. Put a routing layer (gateway) in front of the monolith.
// 2. Build the new service for ONE capability.
// 3. Route that capability's traffic to it; everything else still hits the
//    monolith. Run both and compare outputs for a while if the risk is high.
// 4. Repeat, capability by capability, until the monolith is empty.
//
// Never a big-bang rewrite. The routing layer is what makes each step
// reversible — that reversibility is the whole reason the pattern works.</code></pre>
<p><strong>The answer that shows judgement:</strong> "I would start with a well-modularised monolith and extract services when a specific pressure justifies it — a component that needs to scale separately, or a team that is being blocked by another team's release cycle. Microservices are an organisational solution with a technical cost, so if there is no organisational problem, I have paid the cost for nothing."</p>`
}
]);
