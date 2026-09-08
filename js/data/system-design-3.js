appendTopic("system-design", [
{
  q: "Design a food delivery system like Swiggy or Zomato",
  level: "advanced", hot: true, tags: ["design-question"],
  companies: ["Swiggy", "Zomato", "Amazon", "Flipkart", "Uber", "Dunzo"],
  a: `<p><strong>Requirements.</strong> Browse restaurants near me, place an order, match a delivery partner, track live location, handle surge. 10M daily users, 2M orders/day → ~25 orders/s average, ~150/s at dinner peak. Location updates from 100k partners every 4s → <strong>25,000 writes/s</strong>, which dominates the write load.</p>
<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="Food delivery architecture">
  <rect class="dg-box" x="10" y="14" width="76" height="30" rx="6"/><text class="dg-s" x="48" y="34" text-anchor="middle">Customer</text>
  <rect class="dg-box" x="10" y="54" width="76" height="30" rx="6"/><text class="dg-s" x="48" y="74" text-anchor="middle">Partner</text>
  <rect class="dg-box" x="10" y="94" width="76" height="30" rx="6"/><text class="dg-s" x="48" y="114" text-anchor="middle">Restaurant</text>
  <path class="dg-line" d="M90 29 H130 M90 69 H130 M90 109 H130" marker-end="url(#fd1)"/>
  <rect class="dg-fill" x="134" y="54" width="86" height="40" rx="7"/><text class="dg-s" x="177" y="79" text-anchor="middle">API Gateway</text>
  <path class="dg-line" d="M224 62 H262 M224 74 H262 M224 86 H262" marker-end="url(#fd1)"/>
  <rect class="dg-fill2" x="266" y="10" width="104" height="28" rx="6"/><text class="dg-s" x="318" y="29" text-anchor="middle">Catalog svc</text>
  <rect class="dg-fill2" x="266" y="44" width="104" height="28" rx="6"/><text class="dg-s" x="318" y="63" text-anchor="middle">Order svc</text>
  <rect class="dg-fill2" x="266" y="78" width="104" height="28" rx="6"/><text class="dg-s" x="318" y="97" text-anchor="middle">Matching svc</text>
  <rect class="dg-fill2" x="266" y="112" width="104" height="28" rx="6"/><text class="dg-s" x="318" y="131" text-anchor="middle">Location svc</text>
  <path class="dg-line" d="M374 24 H412 M374 58 H412 M374 92 H412 M374 126 H412" marker-end="url(#fd1)"/>
  <rect class="dg-box" x="416" y="10" width="96" height="28" rx="6"/><text class="dg-s" x="464" y="29" text-anchor="middle">Elasticsearch</text>
  <rect class="dg-box" x="416" y="44" width="96" height="28" rx="6"/><text class="dg-s" x="464" y="63" text-anchor="middle">PostgreSQL</text>
  <rect class="dg-box" x="416" y="78" width="96" height="28" rx="6"/><text class="dg-s" x="464" y="97" text-anchor="middle">Redis GEO</text>
  <rect class="dg-box" x="416" y="112" width="96" height="28" rx="6"/><text class="dg-s" x="464" y="131" text-anchor="middle">Kafka</text>
  <text class="dg-s" x="300" y="176" text-anchor="middle">location writes bypass the database entirely — Redis + TTL</text>
  <text class="dg-s" x="300" y="192" text-anchor="middle">orders are the only strongly-consistent path</text>
  <defs><marker id="fd1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The three decisions that matter:</strong></p>
<ol>
<li><strong>Location writes never touch the primary database.</strong> 25,000 writes/s of data that is worthless in 10 seconds. Store in Redis with a geospatial index and a 30s TTL; fire a copy to Kafka for analytics. Durability is not required — a lost position is corrected 4 seconds later.</li>
<li><strong>Geospatial search needs a spatial index.</strong> Naive distance-to-every-partner is O(n). Use geohash, H3 cells or <code>GEOSEARCH</code> — query the partner's cell plus its neighbour ring. Rank by <strong>routing ETA, not straight-line distance</strong>, because a partner across a river is 200 m away and 15 minutes distant.</li>
<li><strong>Matching must prevent double-assignment.</strong> One partner, one order at a time — an atomic compare-and-set on partner state, exactly like seat booking:
<pre><code>UPDATE partner SET status='ASSIGNED', order_id=:o
WHERE id=:p AND status='AVAILABLE';        -- 0 rows = someone else won</code></pre>
Offer with a short timeout; on decline or timeout, offer to the next candidate.</li>
</ol>
<p><strong>Scale levers to mention:</strong> geo-sharding (orders never cross cities, so partition by city); read replicas plus Redis for the catalogue, which is read-heavy and rarely changes; and the order lifecycle driven by Kafka events so restaurant, partner and customer views update independently.</p>
<p><strong>Surge pricing</strong> is a stream job: demand and supply counts per cell over a short window, which is a natural Kafka Streams aggregation.</p>`
},
{
  q: "Design a scalable notification system for 50 million users",
  level: "advanced", hot: true, tags: ["design-question"],
  companies: ["Amazon", "Flipkart", "Paytm", "Swiggy", "Meesho", "Adobe"],
  a: `<p><strong>Requirements.</strong> Push, SMS, email and in-app. Bursty — a marketing campaign fires 10M notifications in 10 minutes (~17,000/s) while transactional alerts need sub-second delivery. Respect user preferences, quiet hours and opt-outs.</p>
<pre><code>Producers (any service)
   -&gt; Kafka: notification.requested   (partitioned by userId)
   -&gt; Notification service
        validate -&gt; check preferences + quiet hours -&gt; DEDUPLICATE -&gt; render template
        -&gt; route per channel
   -&gt; Kafka: notify.push | notify.sms | notify.email    (SEPARATE topics)
   -&gt; Channel workers -&gt; provider (FCM / APNs / Twilio / SES)
   -&gt; delivery status events -&gt; tracking store + DLT</code></pre>
<p><strong>The design decisions to justify:</strong></p>
<ol>
<li><strong>A separate topic and worker pool per channel.</strong> SMS providers are slower and rate-limited differently from push. One shared queue means an SMS backlog delays every push notification — a real incident pattern.</li>
<li><strong>Separate the transactional and campaign paths.</strong> A marketing burst must never delay an OTP. Different topics, different consumer groups, and campaigns throttled deliberately.</li>
<li><strong>Preferences and quiet hours checked centrally</strong>, not by each producer. Otherwise compliance is unenforceable and every new service reimplements it slightly differently.</li>
<li><strong>Deduplicate</strong> on <code>(userId + eventType + entityId)</code> with a TTL — this is what stops a retry storm upstream sending five identical emails.</li>
<li><strong>Digest and rate-limit per user</strong> — "10 people liked your post" as one notification, not ten. This is a product requirement as much as a technical one.</li>
</ol>
<pre><code>// Provider abstraction so a vendor outage is a config change, not an incident
public interface PushProvider { DeliveryResult send(PushMessage m); }
@Component class FcmProvider implements PushProvider { }
@Component class ApnsProvider implements PushProvider { }
// with a circuit breaker + automatic failover to a secondary vendor</code></pre>
<p><strong>Scale numbers to state:</strong> 10M notifications over 10 minutes is ~17,000/s. FCM accepts batches of 500 device tokens, so that is ~34 batched calls/s — easily handled by a modest worker pool. The bottleneck is almost never your service; it is the provider's rate limit, which is why per-channel throttling and backpressure matter more than raw throughput.</p>
<p><strong>Track the full funnel:</strong> requested → rendered → sent → delivered → opened → failed. Without it you cannot answer "the customer says they never received it", which is the most common support ticket this system generates.</p>`
},
{
  q: "How would you design a system to handle a flash sale or ticket booking?",
  level: "advanced", hot: true, tags: ["design-question", "consistency"],
  companies: ["Flipkart", "Amazon", "BookMyShow", "Paytm", "Myntra", "IRCTC"],
  a: `<p><strong>The defining problem:</strong> 500,000 users competing for 1,000 items in the first second. Everything else follows from that ratio.</p>
<pre><code>// LAYER 1 — shed load BEFORE it reaches your services
CDN + static page for the sale itself
Waiting room / virtual queue: admit N users per second, hold the rest
Rate limit per user AND per IP at the edge

// LAYER 2 — reserve atomically in Redis, not the database
-- Redis Lua script: check and decrement in ONE atomic operation
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock == nil or stock &lt;= 0 then return -1 end
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return -2 end  -- one per user
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return stock - 1

// LAYER 3 — queue the winners; only they touch the database
Redis reservation succeeds -&gt; publish to Kafka -&gt; order service persists at ITS own pace
// 500k requests hit Redis; only 1,000 reach PostgreSQL.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Flash sale funnel from edge to database">
  <rect class="dg-fill" x="14" y="30" width="120" height="46" rx="8"/><text class="dg-s" x="74" y="50" text-anchor="middle">Edge / queue</text><text class="dg-s" x="74" y="66" text-anchor="middle">500,000 req/s</text>
  <path class="dg-line" d="M138 53 H182" marker-end="url(#fs1)"/>
  <rect class="dg-fill2" x="186" y="30" width="120" height="46" rx="8"/><text class="dg-s" x="246" y="50" text-anchor="middle">Redis atomic</text><text class="dg-s" x="246" y="66" text-anchor="middle">~50,000 req/s</text>
  <path class="dg-line" d="M310 53 H354" marker-end="url(#fs1)"/>
  <rect class="dg-fill2" x="358" y="30" width="110" height="46" rx="8"/><text class="dg-s" x="413" y="50" text-anchor="middle">Kafka</text><text class="dg-s" x="413" y="66" text-anchor="middle">1,000 winners</text>
  <path class="dg-line" d="M472 53 H516" marker-end="url(#fs1)"/>
  <rect class="dg-box" x="520" y="30" width="86" height="46" rx="8"/><text class="dg-s" x="563" y="57" text-anchor="middle">PostgreSQL</text>
  <text class="dg-s" x="300" y="112" text-anchor="middle">each layer removes an order of magnitude before the next</text>
  <defs><marker id="fs1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>For seat booking specifically</strong>, add a hold with expiry — the user needs time to pay:</p>
<pre><code>1. HOLD the seat for 10 minutes (Redis key with TTL, or a DB row with expires_at)
2. User pays
3. CONFIRM -&gt; permanent
4. A sweeper releases expired holds back to inventory
-- Prevents both double-booking and seats being locked forever by abandoned carts.</code></pre>
<p><strong>The database-only alternative</strong>, for lower scale, is a single atomic statement — no locking, no race:</p>
<pre><code>UPDATE inventory SET stock = stock - 1
WHERE sku = :sku AND stock &gt; 0;          -- 0 rows updated = sold out</code></pre>
<p><strong>Points that show experience:</strong> never <code>SELECT</code> then <code>UPDATE</code> — that is a check-then-act race. Overselling is far worse than underselling, so err toward strictness. And make the "sold out" response <em>fast and cacheable</em>: once stock hits zero, 499,000 users should get a cached response from the edge without touching Redis at all.</p>`
},
{
  q: "What is the difference between vertical and horizontal partitioning, and when do you use each?",
  level: "advanced", tags: ["database", "scaling"],
  companies: ["Amazon", "Oracle", "Flipkart", "Walmart", "SAP", "Goldman Sachs"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Vertical versus horizontal partitioning">
  <text class="dg-t" x="150" y="16" text-anchor="middle">Vertical — split COLUMNS</text>
  <rect class="dg-fill" x="26" y="28" width="110" height="70" rx="6"/>
  <text class="dg-s" x="81" y="46" text-anchor="middle">users</text>
  <text class="dg-s" x="81" y="64" text-anchor="middle">id, name, email</text>
  <text class="dg-s" x="81" y="82" text-anchor="middle">(hot, small)</text>
  <rect class="dg-fill2" x="150" y="28" width="120" height="70" rx="6"/>
  <text class="dg-s" x="210" y="46" text-anchor="middle">user_profile</text>
  <text class="dg-s" x="210" y="64" text-anchor="middle">bio, avatar, prefs</text>
  <text class="dg-s" x="210" y="82" text-anchor="middle">(cold, large)</text>
  <text class="dg-s" x="150" y="124" text-anchor="middle">same rows, different columns</text>
  <text class="dg-t" x="460" y="16" text-anchor="middle">Horizontal — split ROWS</text>
  <rect class="dg-fill" x="336" y="28" width="80" height="30" rx="5"/><text class="dg-s" x="376" y="47" text-anchor="middle">users id 1–1M</text>
  <rect class="dg-fill" x="336" y="62" width="80" height="30" rx="5"/><text class="dg-s" x="376" y="81" text-anchor="middle">users 1M–2M</text>
  <rect class="dg-fill" x="336" y="96" width="80" height="30" rx="5"/><text class="dg-s" x="376" y="115" text-anchor="middle">users 2M–3M</text>
  <text class="dg-s" x="510" y="60" text-anchor="middle">same columns,</text>
  <text class="dg-s" x="510" y="78" text-anchor="middle">different rows</text>
  <text class="dg-s" x="510" y="96" text-anchor="middle">= sharding</text>
</svg>
</figure>
<table>
<tr><th></th><th>Vertical partitioning</th><th>Horizontal partitioning (sharding)</th></tr>
<tr><td>Splits</td><td>Columns</td><td>Rows</td></tr>
<tr><td>Solves</td><td>Wide tables, hot vs cold columns, LOB bloat</td><td>Table too large for one machine</td></tr>
<tr><td>Query impact</td><td>A join to reassemble</td><td>Cross-shard queries become hard</td></tr>
<tr><td>Complexity</td><td>Low</td><td><strong>High</strong></td></tr>
</table>
<p><strong>Vertical partitioning is underused and often the right first move.</strong> A <code>users</code> table with a 50 KB <code>bio</code> and a base64 avatar means every <code>SELECT *</code> reads those columns, they get TOASTed, and the row no longer fits in cache. Splitting the cold columns into a side table can be a large win for a small change — and it does not distribute anything.</p>
<p><strong>Horizontal partitioning has two forms worth distinguishing:</strong></p>
<ul>
<li><strong>Table partitioning</strong> (PostgreSQL declarative partitioning) — still one database, but the planner prunes to the relevant partition and retention becomes an instant <code>DROP TABLE</code> instead of an hours-long <code>DELETE</code>. Low cost, high value for time-series data.</li>
<li><strong>Sharding</strong> — rows across <em>different database servers</em>. This is the expensive one: cross-shard joins and transactions become application problems, unique constraints no longer span the dataset, and rebalancing is an operation.</li>
</ul>
<p><strong>The order to attempt things</strong> — and interviewers want to hear you not jumping to sharding: optimise queries and indexes → vertical scaling → read replicas → caching → vertical partitioning → table partitioning → sharding. Most systems never reach the last step, and reaching it prematurely costs far more than it saves.</p>
<p><strong>When sharding, choose the key so that the common query hits one shard.</strong> Sharding orders by <code>order_id</code> when every query is "orders for this customer" means fanning out to every shard — the worst of both worlds.</p>`
},
{
  q: "How do you design for idempotency across an entire distributed system?",
  level: "advanced", hot: true, tags: ["idempotency", "architecture"],
  companies: ["Amazon", "PayPal", "Razorpay", "Stripe", "Goldman Sachs", "Walmart"],
  a: `<p>In a distributed system a timeout tells you <em>nothing</em> about whether the operation succeeded. So retries are inevitable, and every layer must tolerate them.</p>
<pre><code>// LAYER 1 — the API boundary: idempotency keys
POST /api/v1/payments
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

@PostMapping("/payments")
public ResponseEntity&lt;PaymentDto&gt; pay(@RequestHeader("Idempotency-Key") String key,
                                      @Valid @RequestBody PaymentRequest req) {
    var existing = idempotencyRepo.findByKey(key);
    if (existing.isPresent()) {
        var rec = existing.get();
        if (!rec.requestHash().equals(hash(req))) throw new IdempotencyConflictException();
        if (rec.status() == IN_PROGRESS) return status(409).build();
        return status(rec.httpStatus()).body(rec.response());     // REPLAY the original
    }
    idempotencyRepo.save(new IdempotencyRecord(key, hash(req), IN_PROGRESS));  // unique index
    ...
}

// LAYER 2 — message consumers: deduplicate by event id
@Transactional
public void handle(PaymentCompleted e) {
    try { processedRepo.saveAndFlush(new ProcessedEvent(e.eventId())); }
    catch (DataIntegrityViolationException dup) { return; }
    ledger.credit(e.accountId(), e.amount());       // SAME transaction as the dedupe insert
}

// LAYER 3 — the database: make the operation naturally idempotent
UPDATE orders SET status='SHIPPED' WHERE id=:id AND status='PACKED';  -- 2nd run: 0 rows
ALTER TABLE ledger ADD CONSTRAINT uq UNIQUE (account_id, payment_reference);

// LAYER 4 — outbound calls: pass YOUR key through to the provider
stripe.paymentIntents().create(params, RequestOptions.builder()
        .setIdempotencyKey(ourKey).build());</code></pre>
<table>
<tr><th>Operation</th><th>Idempotent?</th></tr>
<tr><td><code>SET status = 'PAID'</code></td><td>✔ absolute value</td></tr>
<tr><td><code>balance = balance - 100</code></td><td>✘ a delta — double-applies</td></tr>
<tr><td><code>INSERT</code> with a unique business key</td><td>✔ second attempt fails loudly</td></tr>
<tr><td><code>INSERT</code> with a generated id</td><td>✘ creates a duplicate row</td></tr>
<tr><td><code>DELETE WHERE id = ?</code></td><td>✔ already gone is fine</td></tr>
<tr><td>Send an email</td><td>✘ needs an explicit dedupe record</td></tr>
</table>
<p><strong>The design rule:</strong> prefer <em>absolute</em> state over deltas wherever the domain allows it. "Set the balance to X" is retry-safe; "subtract 100" is not. Where a delta is unavoidable (a ledger), the unique constraint on a business reference does the work instead.</p>
<p><strong>Two operational details:</strong> store the request hash alongside the key, so the same key with a <em>different</em> body is rejected rather than silently replaying the wrong response; and give dedupe records a TTL matched to your maximum retry window, or the table becomes the largest in the database.</p>
<p><strong>The framing to close with:</strong> "Idempotency is not a feature you add to one endpoint — it is a property the whole system needs, because at-least-once is the only delivery guarantee you can actually build on."</p>`
},
{
  q: "How do you design a multi-region system, and what breaks?",
  level: "advanced", tags: ["distributed", "availability"],
  companies: ["Amazon", "Microsoft", "Google", "Walmart", "Maersk", "SAP"],
  a: `<table>
<tr><th>Pattern</th><th>How</th><th>Cost</th></tr>
<tr><td><strong>Active-passive</strong></td><td>One region serves; the other stands by with replicated data</td><td>Simple; wasted capacity; failover has RPO/RTO</td></tr>
<tr><td><strong>Active-active, partitioned</strong></td><td>Each region owns a subset of users; no shared writes</td><td>Best balance — this is usually the answer</td></tr>
<tr><td><strong>Active-active, shared</strong></td><td>Any region writes any record</td><td><strong>Hardest</strong> — conflicts are inevitable</td></tr>
</table>
<pre><code>// The partitioned approach — route by a stable attribute
user.homeRegion = "ap-south-1"        // decided at signup, stored on the user
GeoDNS / Anycast -&gt; nearest region -&gt; if not the home region, PROXY to it for writes
                                   -&gt; serve READS locally from a replica</code></pre>
<p><strong>What breaks, and this is the substance of the answer:</strong></p>
<ol>
<li><strong>The speed of light.</strong> Mumbai↔Virginia is ~180 ms round trip. Synchronous cross-region replication adds that to <em>every write</em>. Asynchronous replication avoids it but means a failover can lose the last few seconds of data.</li>
<li><strong>Consistency.</strong> You cannot have strong consistency and low latency across regions — PACELC's "else latency or consistency" branch. So you decide <em>per operation</em>: payments strongly consistent within one region; follower counts and view counts eventually consistent globally.</li>
<li><strong>Conflicts.</strong> With shared active-active, two regions updating the same record concurrently must be resolved — last-write-wins (loses data), version vectors, or CRDTs. Avoiding conflicts by partitioning ownership is nearly always cheaper than resolving them.</li>
<li><strong>Data residency.</strong> GDPR and India's DPDP Act may legally require EU or Indian user data to stay in-region — which turns a technical choice into a compliance constraint and often forces partitioning anyway.</li>
<li><strong>Split brain.</strong> If regions cannot see each other, both may believe they are primary. Requires a quorum or an external arbiter.</li>
<li><strong>Cost.</strong> Cross-region data transfer is expensive and often the largest surprise on the bill.</li>
</ol>
<p><strong>The pragmatic recommendation:</strong> "Start with multi-<em>AZ</em> within one region — that covers the overwhelming majority of real failures at a fraction of the complexity. Go multi-region when you have a genuine requirement: regulatory data residency, a latency SLA for a distant user base, or a disaster-recovery RTO that a single region cannot meet. And then partition ownership by user rather than sharing writes, because conflict resolution is the part that never stops costing you."</p>
<p><strong>Define RPO and RTO explicitly</strong> — how much data may be lost, and how long recovery may take. Those two numbers determine the architecture more than any preference does.</p>`
}
]);
