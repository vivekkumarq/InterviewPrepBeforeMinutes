appendTopic("rest-api", [
{
  q: "Design a REST API for an e-commerce order system — walk through the endpoints",
  level: "advanced", hot: true, tags: ["design", "scenario"],
  companies: ["Amazon", "Flipkart", "Walmart", "Myntra", "Paytm", "Swiggy", "Zomato"],
  a: `<pre><code># Resources, not actions
GET    /api/v1/products?category=shoes&amp;minPrice=1000&amp;page=0&amp;size=20&amp;sort=price,asc
GET    /api/v1/products/{id}

GET    /api/v1/cart                                   # the caller's cart, from the token
POST   /api/v1/cart/items          { sku, quantity }
PATCH  /api/v1/cart/items/{itemId} { quantity }
DELETE /api/v1/cart/items/{itemId}

POST   /api/v1/orders                                 # Idempotency-Key REQUIRED
       -&gt; 201 Created, Location: /api/v1/orders/ord_9f2c
GET    /api/v1/orders?status=PAID&amp;page=0
GET    /api/v1/orders/{id}
POST   /api/v1/orders/{id}/cancellation               # action as a SUB-RESOURCE
GET    /api/v1/orders/{id}/shipments

POST   /api/v1/orders/{id}/payments { method, token } # Idempotency-Key REQUIRED
GET    /api/v1/orders/{id}/payments/{paymentId}</code></pre>
<p><strong>The decisions to justify out loud:</strong></p>
<ul>
<li><strong>Cart has no ID in the path.</strong> It belongs to the authenticated caller, so <code>/cart</code> is unambiguous and prevents one user reading another's cart by guessing an ID.</li>
<li><strong>Cancellation is <code>POST /orders/{id}/cancellation</code>, not <code>POST /orders/{id}/cancel</code>.</strong> The sub-resource represents the <em>result</em> of the action, so you can also <code>GET</code> it later to see who cancelled and why. Purists dislike verb endpoints; this form keeps the resource model intact.</li>
<li><strong>Idempotency keys on order creation and payment.</strong> A mobile client on a flaky network <em>will</em> retry, and without this you double-charge. This is the single most important detail in the answer.</li>
<li><strong>Payments nested under orders</strong> because a payment has no independent meaning — that is a composition relationship.</li>
<li><strong>Cursor pagination for order history</strong>, offset for the product catalogue where users jump to page 5.</li>
</ul>
<pre><code># Status transitions are explicit, not free-form updates
PATCH /api/v1/orders/{id}  { "status": "SHIPPED" }    # ✘ lets a client set any state
POST  /api/v1/orders/{id}/shipments                    # ✔ the state machine is server-side</code></pre>
<p><strong>The follow-up they always ask:</strong> "what happens if payment succeeds but order confirmation fails?" — that is the dual-write problem. Answer with the <strong>transactional outbox</strong>: write the order state and the event in one database transaction, publish asynchronously, and make the consumer idempotent. Never call the payment gateway inside your database transaction.</p>`
},
{
  q: "What is the difference between 401, 403, 404 and 409 — when do you use each?",
  level: "beginner", hot: true, tags: ["http", "errors"],
  companies: ["TCS", "Infosys", "Amazon", "Cognizant", "Accenture", "Wipro"],
  a: `<table>
<tr><th>Code</th><th>Meaning</th><th>Client should</th></tr>
<tr><td><strong>401</strong> Unauthorized</td><td>Actually <em>unauthenticated</em> — no or invalid credentials</td><td>Log in, or refresh the token</td></tr>
<tr><td><strong>403</strong> Forbidden</td><td>Authenticated, but not permitted</td><td>Nothing — retrying will never help</td></tr>
<tr><td><strong>404</strong> Not Found</td><td>No such resource — or you are not allowed to know</td><td>Check the identifier</td></tr>
<tr><td><strong>409</strong> Conflict</td><td>State conflict with the current resource</td><td>Re-read and retry, or resolve the conflict</td></tr>
<tr><td><strong>422</strong> Unprocessable</td><td>Syntactically valid, semantically wrong</td><td>Fix the data</td></tr>
</table>
<pre><code>// 401 — no token at all, or an expired one
GET /api/orders/1                       -&gt; 401  { "title": "Authentication required" }

// 403 — valid user, wrong role
DELETE /api/admin/users/5   (as USER)   -&gt; 403  { "title": "Insufficient permissions" }

// 404 — someone ELSE's order. Deliberately NOT 403.
GET /api/orders/99   (belongs to user B) -&gt; 404

// 409 — optimistic lock failure, or a duplicate unique key
PUT /api/orders/1  If-Match: "v5"        -&gt; 409  { "title": "Order was modified" }
POST /api/users  { email: "taken@x.com" } -&gt; 409  { "title": "Email already registered" }

// 422 — valid JSON, valid types, but the business rejects it
POST /api/orders { total: 500, balance: 120 } -&gt; 422 { "title": "Insufficient funds" }</code></pre>
<p><strong>The security decision worth explaining:</strong> for a resource that exists but belongs to another user, <strong>404 is better than 403</strong>. A 403 confirms the ID is real, which lets an attacker enumerate valid order IDs and learn your order volume. Reserve 403 for "you cannot perform this <em>action</em>" and use 404 for "this is not yours to know about".</p>
<p><strong>400 vs 422:</strong> 400 for malformed input the server cannot parse (broken JSON, wrong type). 422 for well-formed input that violates a business rule. Some teams use 400 for both — that is defensible, but be consistent across the whole API.</p>
<p><strong>The cardinal sin:</strong> returning <code>200 OK</code> with <code>{"success": false}</code>. It defeats every proxy, cache, retry policy, load balancer health check and monitoring dashboard that reads status codes.</p>`
},
{
  q: "How do you design an API that supports both filtering and full-text search?",
  level: "advanced", tags: ["design", "queries"],
  companies: ["Amazon", "Flipkart", "Myntra", "Zomato", "Adobe", "Salesforce"],
  a: `<pre><code># Simple filters — one query parameter per field, AND semantics
GET /api/v1/products?category=shoes&amp;brand=nike&amp;minPrice=2000&amp;maxPrice=8000&amp;inStock=true

# Full-text search — a separate, clearly named parameter
GET /api/v1/products?q=running+shoes&amp;category=shoes

# Sorting and pagination
&amp;sort=price,asc&amp;sort=rating,desc&amp;page=0&amp;size=20

# Sparse fieldsets — let mobile clients trim the payload
&amp;fields=id,name,price,thumbnailUrl</code></pre>
<pre><code>@GetMapping("/products")
public Page&lt;ProductDto&gt; search(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) BigDecimal minPrice,
        @PageableDefault(size = 20) Pageable pageable) {

    // Whitelist the sortable fields — NEVER pass user input into ORDER BY
    validateSortFields(pageable.getSort(), Set.of("price", "rating", "createdAt"));
    return service.search(new ProductQuery(q, category, minPrice), pageable);
}</code></pre>
<p><strong>For genuinely complex filtering</strong>, two established options rather than inventing your own:</p>
<pre><code># RSQL / FIQL — expressive and standardised
GET /api/v1/products?filter=category==shoes;price&gt;2000;(brand==nike,brand==adidas)

# Or POST a search body when the query outgrows a URL
POST /api/v1/products/search
{ "filters": [{ "field": "price", "op": "between", "value": [2000, 8000] }],
  "sort": [{ "field": "rating", "dir": "desc" }], "page": 0, "size": 20 }</code></pre>
<p><strong>The trade-off to state:</strong> <code>POST /search</code> breaks REST semantics (a read that uses POST) and loses HTTP caching — but URLs have a practical length limit around 2000 characters, and a filter object with twenty conditions does not fit. Most large APIs end up offering both: query parameters for the common case, a search endpoint for the complex one.</p>
<p><strong>The security points that must be mentioned:</strong> validate sort fields against an allowlist (they cannot be parameter-bound and go straight into <code>ORDER BY</code> — a real SQL injection vector); cap the page size server-side or <code>?size=1000000</code> is a free denial of service; and rate-limit search endpoints separately, since full-text queries are far more expensive than a key lookup.</p>`
},
{
  q: "What is the difference between synchronous request-response and webhooks for integration?",
  level: "advanced", tags: ["integration", "design"],
  companies: ["Amazon", "PayPal", "Razorpay", "Stripe", "Salesforce", "SAP"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Polling versus webhook integration">
  <text class="dg-t" x="150" y="16" text-anchor="middle">Polling</text>
  <rect class="dg-box" x="20" y="34" width="76" height="30" rx="6"/><text class="dg-s" x="58" y="54" text-anchor="middle">You</text>
  <rect class="dg-box" x="200" y="34" width="76" height="30" rx="6"/><text class="dg-s" x="238" y="54" text-anchor="middle">Provider</text>
  <path class="dg-line" d="M100 44 H196" marker-end="url(#wh1)"/><text class="dg-s" x="148" y="38" text-anchor="middle">GET /status</text>
  <path class="dg-line" d="M196 58 H100" marker-end="url(#wh1)"/><text class="dg-s" x="148" y="74" text-anchor="middle">still pending…</text>
  <text class="dg-s" x="148" y="98" text-anchor="middle">repeat every 5s ×1000</text>
  <text class="dg-s" x="148" y="118" text-anchor="middle">wasteful, high latency</text>
  <text class="dg-t" x="460" y="16" text-anchor="middle">Webhook</text>
  <rect class="dg-box" x="330" y="34" width="76" height="30" rx="6"/><text class="dg-s" x="368" y="54" text-anchor="middle">You</text>
  <rect class="dg-box" x="510" y="34" width="76" height="30" rx="6"/><text class="dg-s" x="548" y="54" text-anchor="middle">Provider</text>
  <path class="dg-line" d="M506 48 H410" marker-end="url(#wh1)"/><text class="dg-s" x="458" y="40" text-anchor="middle">POST /hooks</text>
  <text class="dg-s" x="458" y="82" text-anchor="middle">pushed once, when it happens</text>
  <text class="dg-s" x="458" y="102" text-anchor="middle">needs a public endpoint</text>
  <text class="dg-s" x="458" y="122" text-anchor="middle">and signature verification</text>
  <defs><marker id="wh1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th></th><th>Synchronous</th><th>Webhook</th></tr>
<tr><td>Direction</td><td>You call them</td><td>They call you</td></tr>
<tr><td>Latency to know</td><td>Immediate, if fast</td><td>Near-immediate</td></tr>
<tr><td>Coupling</td><td>You wait on their availability</td><td>Decoupled</td></tr>
<tr><td>Needs</td><td>Nothing extra</td><td>A public HTTPS endpoint</td></tr>
<tr><td>Fits</td><td>Reads, and writes that complete in ms</td><td>Long-running or externally-triggered events</td></tr>
</table>
<pre><code>// Consuming a webhook correctly
@PostMapping("/webhooks/payments")
public ResponseEntity&lt;Void&gt; handle(@RequestHeader("X-Signature") String signature,
                                   @RequestHeader("X-Timestamp") long timestamp,
                                   @RequestBody byte[] rawBody) {     // RAW bytes, not a DTO

    // 1. Verify BEFORE parsing — constant-time comparison
    if (!MessageDigest.isEqual(hmacSha256(secret, timestamp + "." + rawBody),
                               decode(signature))) return status(401).build();
    // 2. Reject replays
    if (Math.abs(now() - timestamp) &gt; 300) return status(400).build();

    var event = parse(rawBody);
    // 3. Deduplicate — delivery is AT-LEAST-ONCE
    if (!processedRepo.firstTime(event.id())) return ok().build();
    // 4. Enqueue and return FAST — slow handlers cause duplicate deliveries
    queue.publish(event);
    return ok().build();
}</code></pre>
<p><strong>The four rules for consuming webhooks:</strong> verify the signature over the <em>raw</em> body before deserialising; reject old timestamps to prevent replay; deduplicate by event ID because providers retry; and respond 2xx immediately, processing asynchronously — a handler that takes 30 seconds will be retried while still running.</p>
<p><strong>For producing them:</strong> sign every payload, retry with exponential backoff into a dead-letter store, deliver from an outbox rather than inside the business transaction, and provide a replay endpoint plus a delivery log the subscriber can inspect.</p>`
},
{
  q: "How do you version an API when a breaking change is unavoidable?",
  level: "advanced", hot: true, tags: ["versioning", "migration"],
  companies: ["Amazon", "Microsoft", "Salesforce", "SAP", "Adobe", "Publicis Sapient"],
  a: `<pre><code>// Phase 1 — EXPAND. Both shapes served, old one still authoritative.
{
  "id": 42,
  "amount": 199.00,                                    // deprecated
  "totalAmount": { "value": 199.00, "currency": "INR" } // new
}
Deprecation: Sat, 01 Nov 2026 00:00:00 GMT
Sunset: Sun, 01 Feb 2027 00:00:00 GMT
Link: &lt;https://docs.acme.com/migrations/total-amount&gt;; rel="deprecation"

// Phase 2 — MEASURE. Log which clients still read the old field.
// You cannot remove safely without this data.

// Phase 3 — CONTRACT. Remove only when usage reaches zero, after the sunset date.</code></pre>
<p><strong>When expand-and-contract is genuinely impossible</strong> — the semantics change rather than the shape — introduce a new version:</p>
<pre><code>/api/v1/orders     # frozen: bug fixes only, no new features
/api/v2/orders     # new semantics

// Implementation: keep ONE service, two thin controllers + mappers.
// Never fork the business logic — that is how the two versions diverge and both rot.
@RestController @RequestMapping("/api/v1/orders")
class OrderControllerV1 {
    OrderDtoV1 get(Long id) { return v1Mapper.toDto(service.find(id)); }
}
@RestController @RequestMapping("/api/v2/orders")
class OrderControllerV2 {
    OrderDtoV2 get(Long id) { return v2Mapper.toDto(service.find(id)); }
}</code></pre>
<table>
<tr><th>Change</th><th>Breaking?</th></tr>
<tr><td>Add an optional request field</td><td>No</td></tr>
<tr><td>Add a response field</td><td>No — if clients are tolerant readers</td></tr>
<tr><td>Rename or remove a field</td><td><strong>Yes</strong></td></tr>
<tr><td>Change a type (number → string)</td><td><strong>Yes</strong></td></tr>
<tr><td>Make an optional field required</td><td><strong>Yes</strong></td></tr>
<tr><td>Tighten validation</td><td><strong>Yes</strong> — previously accepted requests now fail</td></tr>
<tr><td>Add an enum value</td><td><strong>Usually</strong> — clients often switch exhaustively</td></tr>
</table>
<p><strong>The operational requirement people miss:</strong> "monitor usage of the deprecated field" needs <em>per-client, per-field</em> metrics. Without them, removal is a guess. Log which API key requested which deprecated field, and you can contact the three clients still using it instead of breaking everyone.</p>
<p><strong>The discipline that avoids most versioning entirely:</strong> the <em>tolerant reader</em> principle — consumers ignore unknown fields (<code>@JsonIgnoreProperties(ignoreUnknown = true)</code>) and handle unknown enum values gracefully. If every client does that, additive changes are free forever, and you version only for genuine semantic breaks.</p>
<p><strong>Never run more than two versions</strong> concurrently. Each one is permanent maintenance, testing and support cost.</p>`
},
{
  q: "How do you secure a public API against abuse and scraping?",
  level: "advanced", tags: ["security", "production"],
  companies: ["Amazon", "Flipkart", "Zomato", "Swiggy", "Paytm", "Adobe"],
  a: `<ol>
<li><strong>Authentication on everything</strong> — even "public" read endpoints get an API key so you can attribute and revoke traffic.</li>
<li><strong>Layered rate limiting</strong> — per API key, per IP, and per endpoint (a search costs far more than a key lookup):
<pre><code>X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1757153400
Retry-After: 30</code></pre></li>
<li><strong>Quotas as well as rate limits</strong> — 10 requests/second <em>and</em> 100,000/day. A scraper obeying your rate limit can still drain your catalogue in a week.</li>
<li><strong>Pagination caps</strong> — a maximum page size, and a maximum reachable offset. Without a cap, <code>?size=1000000</code> is a free denial of service.</li>
<li><strong>Do not expose sequential IDs</strong> — <code>/orders/1001</code> tells a competitor your order volume. Use an opaque public identifier.</li>
<li><strong>Cost-based limiting for expensive operations</strong> — weight search, export and report endpoints more heavily than a simple GET.</li>
<li><strong>Detect anomalies</strong> — a client suddenly requesting sequential IDs, or hitting endpoints in an order no real UI would produce.</li>
<li><strong>Bot mitigation at the edge</strong> — CAPTCHA on signup and login, a WAF, and TLS fingerprinting for high-value endpoints.</li>
<li><strong>Response size limits and timeouts</strong> so one request cannot occupy a thread indefinitely.</li>
</ol>
<pre><code>// Bucket4j + Redis — distributed, so the limit holds across all replicas
Bucket bucket = proxyManager.builder().build(apiKey, () -&gt;
    BucketConfiguration.builder()
        .addLimit(Bandwidth.builder().capacity(100).refillGreedy(100, ofMinutes(1)).build())
        .addLimit(Bandwidth.builder().capacity(10_000).refillGreedy(10_000, ofDays(1)).build())
        .build());

if (!bucket.tryConsume(costOf(endpoint))) {          // weighted by endpoint cost
    response.setHeader("Retry-After", "30");
    throw new TooManyRequestsException();
}</code></pre>
<p><strong>The point that shows real experience:</strong> rate limiting <strong>must be distributed</strong>. Ten replicas each enforcing "100 per minute" locally means an actual limit of 1000 — so the shared counter in Redis is not an optimisation, it is the whole mechanism.</p>
<p><strong>And decide the failure mode deliberately:</strong> if Redis is down, do you fail open (availability, but unlimited traffic) or closed (protected, but an outage)? For most public APIs, fail open with an alert is right — the limiter should not be able to take down the service it protects.</p>`
}
]);
