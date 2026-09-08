appendTopic("rest-api", [
{
  q: "How do you design pagination for a large collection endpoint?",
  level: "advanced", hot: true, tags: ["pagination", "rest", "design", "performance"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "SAP", "Swiggy", "Uber", "Maersk"],
  a: `<table>
<tr><th></th><th>Offset (<code>?page=5&amp;size=20</code>)</th><th>Cursor / keyset (<code>?after=eyJ…</code>)</th></tr>
<tr><td>Jump to page N</td><td><strong>Yes</strong></td><td>No — only next/previous</td></tr>
<tr><td>Total count</td><td>Easy (but a second expensive query)</td><td>Usually omitted</td></tr>
<tr><td>Deep pages</td><td><strong>Slow</strong> — <code>OFFSET 100000</code> scans and discards 100,000 rows</td><td>Constant time at any depth</td></tr>
<tr><td>Concurrent inserts</td><td><strong>Skips or repeats rows</strong></td><td>Stable</td></tr>
<tr><td>Use for</td><td>Admin tables with page numbers</td><td>Infinite scroll, feeds, exports, any large dataset</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Offset pagination shifting rows when an item is inserted">
  <text class="dg-s" x="16" y="20">page 1 read, then a new row is inserted at the top</text>
  <rect class="dg-fill2" x="16" y="30" width="120" height="26" rx="4"/><text class="dg-s" x="76" y="48" text-anchor="middle">NEW</text>
  <rect class="dg-fill" x="16" y="60" width="120" height="26" rx="4"/><text class="dg-s" x="76" y="78" text-anchor="middle">row 1</text>
  <rect class="dg-fill" x="16" y="90" width="120" height="26" rx="4"/><text class="dg-s" x="76" y="108" text-anchor="middle">row 2</text>
  <text class="dg-s" x="170" y="48">was position 1</text>
  <text class="dg-s" x="170" y="78">now position 2</text>
  <text class="dg-s" x="330" y="48">page 2 with OFFSET 2 now starts</text>
  <text class="dg-s" x="330" y="70">at row 2 — which the client ALREADY</text>
  <text class="dg-s" x="330" y="92">saw on page 1. A row is duplicated,</text>
  <text class="dg-s" x="330" y="114">and one further down is skipped.</text>
  <text class="dg-s" x="16" y="146">a cursor anchored to a stable sort key does not move when rows are inserted</text>
</svg>
</figure>
<pre><code>-- Offset: the database must produce and discard every skipped row
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 100000;   -- slow

-- Keyset: anchored on the last row seen. Uses the index directly.
SELECT * FROM orders
WHERE (created_at, id) &lt; (:lastCreatedAt, :lastId)    -- id breaks the tie
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- The composite comparison is essential: created_at alone is not unique,
-- so rows sharing a timestamp would be skipped or repeated.</code></pre>
<pre><code>// The response shape
{
  "items": [ ... ],
  "pageInfo": {
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA5LTA4VDEwOjAwOjAwWiIsImlkIjo0MjF9",
    "hasNext": true
  }
}
// The cursor is an OPAQUE base64 token, not a row number. That is deliberate:
// clients must not construct or reason about it, so you can change the sort
// key later without breaking them.

// Always cap the page size — an unbounded ?size=1000000 is a denial of service
int size = Math.min(requested, MAX_PAGE_SIZE);   // e.g. 100</code></pre>
<table>
<tr><th>Design rule</th><th>Why</th></tr>
<tr><td>Sort must be <strong>deterministic</strong></td><td>Always include a unique tie-breaker such as the id, or pages overlap</td></tr>
<tr><td>Cap and default the page size</td><td>Protects the database and the response payload</td></tr>
<tr><td>Make the total count optional</td><td><code>COUNT(*)</code> on a large table can cost more than the page itself</td></tr>
<tr><td>Return links or a cursor, not just numbers</td><td>The client should not have to build the next URL</td></tr>
<tr><td>Same envelope for every collection</td><td>Consistency across the API matters more than any single choice</td></tr>
</table>
<p><strong>The answer that shows experience:</strong> "I default to keyset pagination for anything a user scrolls through, because offset pagination has two problems that only appear in production — deep pages get slow, and concurrent inserts make rows appear twice or vanish. I keep offset pagination for admin screens that genuinely need to jump to page 40, and I cap the total-count query or drop it entirely."</p>`
},
{
  q: "How do you version a REST API without breaking existing clients?",
  level: "advanced", hot: true, tags: ["versioning", "rest", "design", "enterprise"],
  companies: ["Amazon", "SAP", "Optum", "Maersk", "Salesforce", "Societe Generale", "Walmart"],
  a: `<table>
<tr><th>Strategy</th><th>Example</th><th>Verdict</th></tr>
<tr><td><strong>URI path</strong></td><td><code>/api/v1/orders</code></td><td><strong>Most common</strong> — visible, cacheable, trivially routable. Purists object; everyone uses it.</td></tr>
<tr><td>Query parameter</td><td><code>/api/orders?version=1</code></td><td>Easy to forget, awkward to cache</td></tr>
<tr><td>Custom header</td><td><code>X-API-Version: 1</code></td><td>Clean URLs, but invisible in a browser and easy to omit</td></tr>
<tr><td>Content negotiation</td><td><code>Accept: application/vnd.acme.v1+json</code></td><td>The most "correct" REST answer; verbose and poorly supported by tooling</td></tr>
</table>
<p><strong>The more important question is what actually needs a new version</strong> — most changes do not:</p>
<table>
<tr><th>Non-breaking (no new version)</th><th>Breaking (new version)</th></tr>
<tr><td>Adding a new optional field to a response</td><td>Removing or renaming a field</td></tr>
<tr><td>Adding a new optional request parameter</td><td>Making an optional field required</td></tr>
<tr><td>Adding a new endpoint</td><td>Changing a field's type or format</td></tr>
<tr><td>Adding a new enum value <em>if clients tolerate unknowns</em></td><td>Changing the meaning of an existing field</td></tr>
<tr><td>Relaxing a validation rule</td><td>Tightening validation, or changing a status code</td></tr>
</table>
<pre><code>// Tolerant reader — the single most useful contract rule.
// Clients MUST ignore unknown fields, so the server can add freely.
@JsonIgnoreProperties(ignoreUnknown = true)
public record OrderResponse(Long id, BigDecimal total, String status) { }

// Server side: never serialise nulls, so adding a field costs nothing
spring.jackson.default-property-inclusion=non_null</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Expand and contract API evolution over three releases">
  <rect class="dg-fill" x="16" y="34" width="176" height="54" rx="8"/>
  <text class="dg-s" x="104" y="56" text-anchor="middle">1. ADD the new field</text>
  <text class="dg-s" x="104" y="76" text-anchor="middle">both old and new work</text>
  <path class="dg-line" d="M196 61 H222" marker-end="url(#av1)"/>
  <rect class="dg-fill2" x="226" y="34" width="176" height="54" rx="8"/>
  <text class="dg-s" x="314" y="56" text-anchor="middle">2. MIGRATE clients</text>
  <text class="dg-s" x="314" y="76" text-anchor="middle">deprecate the old field</text>
  <path class="dg-line" d="M406 61 H432" marker-end="url(#av1)"/>
  <rect class="dg-box" x="436" y="34" width="168" height="54" rx="8"/>
  <text class="dg-s" x="520" y="56" text-anchor="middle">3. REMOVE it</text>
  <text class="dg-s" x="520" y="76" text-anchor="middle">once usage is zero</text>
  <text class="dg-s" x="16" y="126">measure step 3 with per-client metrics — "we announced it" is not evidence</text>
  <text class="dg-s" x="16" y="146">this expand/contract cycle avoids a version bump for most changes</text>
  <defs><marker id="av1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// Deprecation, communicated in the protocol rather than only in a changelog
HTTP/1.1 200 OK
Deprecation: Sun, 01 Jun 2026 00:00:00 GMT     // RFC 8594
Sunset: Wed, 01 Sep 2026 00:00:00 GMT
Link: &lt;https://api.example.com/docs/v2&gt;; rel="successor-version"

// And instrument it, so you know when removal is safe
meterRegistry.counter("api.deprecated", "endpoint", "/v1/orders",
                      "client", clientId).increment();</code></pre>
<p><strong>The operational reality to state:</strong> "Every version you keep alive is a branch of code, tests and support you pay for forever. So I try hard to make changes additive and only cut a new version for genuinely breaking ones — and when I do, I set a sunset date, instrument usage per client, and chase the remaining callers directly. An API version with no removal plan is not a version, it is permanent technical debt."</p>`
},
{
  q: "How do you make an API idempotent and safe to retry?",
  level: "advanced", hot: true, tags: ["idempotency", "reliability", "design", "rest"],
  companies: ["Amazon", "Flipkart", "Paytm", "PayPal", "Goldman Sachs", "Swiggy", "Walmart", "Optum"],
  a: `<div class="cx"><b>The problem</b><span>a timeout tells the client nothing — the request may have succeeded</span><b>The fix</b><span>a client-supplied key that makes a repeat a no-op</span></div>
<table>
<tr><th>Method</th><th>Idempotent?</th><th>Safe?</th></tr>
<tr><td>GET, HEAD</td><td>Yes</td><td>Yes — no side effects</td></tr>
<tr><td>PUT</td><td><strong>Yes</strong> — same body, same final state</td><td>No</td></tr>
<tr><td>DELETE</td><td><strong>Yes</strong> — the second call returns 404 or 204, state is unchanged</td><td>No</td></tr>
<tr><td><strong>POST</strong></td><td><strong>No</strong> — this is the one that needs work</td><td>No</td></tr>
<tr><td>PATCH</td><td>Depends — <code>{"set": 5}</code> is; <code>{"increment": 1}</code> is not</td><td>No</td></tr>
</table>
<pre><code>// The pattern: an Idempotency-Key header, stored with the result
POST /api/payments
Idempotency-Key: 4f3a2b1c-...          // client generates a UUID per LOGICAL operation
{ "orderId": 421, "amount": 4999 }

@PostMapping("/payments")
public ResponseEntity&lt;Payment&gt; pay(@RequestHeader("Idempotency-Key") String key,
                                   @RequestBody PaymentRequest req) {
    // Atomic insert-if-absent. The unique constraint is what makes this correct
    // under concurrency — two simultaneous retries cannot both proceed.
    Optional&lt;IdempotencyRecord&gt; existing = store.putIfAbsent(key, req.fingerprint());

    if (existing.isPresent()) {
        IdempotencyRecord r = existing.get();
        if (!r.fingerprint().equals(req.fingerprint()))
            return ResponseEntity.status(422).build();   // same key, DIFFERENT body
        if (r.status() == IN_PROGRESS)
            return ResponseEntity.status(409).header("Retry-After", "1").build();
        return ResponseEntity.ok(r.response());          // replay the stored result
    }

    Payment p = paymentService.charge(req);
    store.complete(key, p);
    return ResponseEntity.ok(p);
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Retry after a timeout replaying the stored response instead of charging twice">
  <rect class="dg-box" x="16" y="24" width="90" height="30" rx="6"/><text class="dg-s" x="61" y="44" text-anchor="middle">client</text>
  <path class="dg-line" d="M110 39 H200" marker-end="url(#id1)"/>
  <text class="dg-s" x="155" y="30" text-anchor="middle">POST key=K</text>
  <rect class="dg-fill" x="204" y="24" width="120" height="30" rx="6"/><text class="dg-s" x="264" y="44" text-anchor="middle">charged ✔</text>
  <path class="dg-line" d="M204 58 H114" stroke-dasharray="4 3" marker-end="url(#id1)"/>
  <text class="dg-s" x="340" y="44">response LOST in transit</text>
  <path class="dg-line" d="M110 100 H200" marker-end="url(#id1)"/>
  <text class="dg-s" x="155" y="91" text-anchor="middle">retry, key=K</text>
  <rect class="dg-fill2" x="204" y="85" width="180" height="30" rx="6"/><text class="dg-s" x="294" y="105" text-anchor="middle">key seen → replay result</text>
  <text class="dg-s" x="400" y="105">no second charge</text>
  <text class="dg-s" x="16" y="152">without the key, the retry is indistinguishable from a genuine second payment</text>
  <defs><marker id="id1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Detail</th><th>Why it matters</th></tr>
<tr><td>The client generates the key</td><td>A server-generated key cannot help — the client must send the <em>same</em> one on retry</td></tr>
<tr><td>Store the <strong>response</strong>, not just the key</td><td>The retry needs the original body and status, not a bare 200</td></tr>
<tr><td>Fingerprint the request body</td><td>Same key with a different body is a client bug — reject it with 422 rather than replaying</td></tr>
<tr><td>Unique constraint, not check-then-insert</td><td>Two concurrent retries would both pass a naive existence check</td></tr>
<tr><td>Expire keys (24–48h)</td><td>The table would grow forever otherwise</td></tr>
<tr><td>Store the key in the <strong>same transaction</strong> as the effect</td><td>Otherwise a crash between them leaves the key recorded and the work undone</td></tr>
</table>
<p><strong>The related patterns to name:</strong> a natural idempotency key from the domain (order id + attempt number) avoids the header entirely; a conditional update (<code>UPDATE … WHERE status = 'PENDING'</code>) is idempotent by construction; and on the consumer side of a message queue you need the same mechanism, because every broker that guarantees at-least-once delivery <em>will</em> deliver duplicates.</p>
<p><strong>The sentence that sums it up:</strong> "Retries are not optional in a distributed system — the network will time out and the client will retry. Idempotency is what makes that safe, and the alternative is charging a customer twice."</p>`
}
]);
