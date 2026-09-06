registerTopic("rest-api", [
{
  q: "What is REST and what are its architectural constraints?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>REST (Representational State Transfer) is an architectural <em>style</em> defined by Roy Fielding, not a protocol. Six constraints:</p>
<ol>
<li><strong>Client-server</strong> — separation of concerns; the UI evolves independently of storage.</li>
<li><strong>Stateless</strong> — every request carries everything needed. The server keeps no client session, which is what makes horizontal scaling trivial.</li>
<li><strong>Cacheable</strong> — responses declare whether they can be cached.</li>
<li><strong>Uniform interface</strong> — resource identification via URIs, manipulation through representations, self-descriptive messages, and HATEOAS.</li>
<li><strong>Layered system</strong> — a client cannot tell whether it is talking to the origin server, a gateway or a cache.</li>
<li><strong>Code on demand</strong> (optional) — the server may send executable code.</li>
</ol>
<p><strong>Be honest in the interview:</strong> almost no production API is fully RESTful — HATEOAS in particular is rarely implemented. What people call "REST" is usually "HTTP + JSON + resource URLs", and saying so shows you understand the difference rather than reciting a definition.</p>`
},
{
  q: "Explain the HTTP methods and their properties",
  level: "beginner", hot: true, tags: ["http"],
  a: `<table>
<tr><th>Method</th><th>Purpose</th><th>Safe</th><th>Idempotent</th><th>Body</th></tr>
<tr><td>GET</td><td>Read a resource</td><td>Yes</td><td>Yes</td><td>No</td></tr>
<tr><td>POST</td><td>Create, or a non-idempotent action</td><td>No</td><td><strong>No</strong></td><td>Yes</td></tr>
<tr><td>PUT</td><td>Full replace (or create at a known URI)</td><td>No</td><td>Yes</td><td>Yes</td></tr>
<tr><td>PATCH</td><td>Partial update</td><td>No</td><td>Not necessarily</td><td>Yes</td></tr>
<tr><td>DELETE</td><td>Remove</td><td>No</td><td>Yes</td><td>No</td></tr>
<tr><td>HEAD</td><td>GET without a body</td><td>Yes</td><td>Yes</td><td>No</td></tr>
<tr><td>OPTIONS</td><td>Supported methods / CORS preflight</td><td>Yes</td><td>Yes</td><td>No</td></tr>
</table>
<ul>
<li><strong>Safe</strong> = does not change server state. Never let a GET modify data — crawlers and prefetchers will find it.</li>
<li><strong>Idempotent</strong> = making the same request N times has the same effect as making it once. Note this is about <em>effect</em>, not response: <code>DELETE</code> twice leaves the resource deleted, even if the second returns 404.</li>
</ul>
<p><strong>PUT vs PATCH:</strong> PUT sends the whole representation and replaces it — omitted fields are cleared. PATCH sends only the changes. PATCH is idempotent if you send absolute values, and <em>not</em> if you send deltas like "increment by 1".</p>`
},
{
  q: "What HTTP status codes should an API return?",
  level: "beginner", hot: true, tags: ["http"],
  a: `<table>
<tr><th>Code</th><th>Meaning</th><th>Use for</th></tr>
<tr><td>200 OK</td><td>Success with body</td><td>GET, PUT, PATCH</td></tr>
<tr><td>201 Created</td><td>Resource created</td><td>POST — include a <code>Location</code> header</td></tr>
<tr><td>202 Accepted</td><td>Queued for async processing</td><td>Long-running jobs</td></tr>
<tr><td>204 No Content</td><td>Success, no body</td><td>DELETE, or PUT with no response</td></tr>
<tr><td>301 / 308</td><td>Moved permanently</td><td>URL restructuring</td></tr>
<tr><td>304 Not Modified</td><td>Cache is still valid</td><td>Conditional GET with ETag</td></tr>
<tr><td>400 Bad Request</td><td>Malformed or invalid input</td><td>Validation failure</td></tr>
<tr><td>401 Unauthorized</td><td><em>Unauthenticated</em></td><td>Missing/invalid token</td></tr>
<tr><td>403 Forbidden</td><td>Authenticated but not permitted</td><td>Insufficient role</td></tr>
<tr><td>404 Not Found</td><td>No such resource</td><td>Also use to hide existence from unauthorised users</td></tr>
<tr><td>405 Method Not Allowed</td><td>Wrong verb</td><td>Include <code>Allow</code> header</td></tr>
<tr><td>409 Conflict</td><td>State conflict</td><td>Duplicate key, optimistic lock failure</td></tr>
<tr><td>412 Precondition Failed</td><td>ETag mismatch</td><td>Conditional update</td></tr>
<tr><td>422 Unprocessable</td><td>Syntactically valid, semantically wrong</td><td>Business rule violation</td></tr>
<tr><td>429 Too Many Requests</td><td>Rate limited</td><td>Include <code>Retry-After</code></td></tr>
<tr><td>500 Internal Server Error</td><td>Unhandled fault</td><td>Never leak a stack trace</td></tr>
<tr><td>502 / 503 / 504</td><td>Bad gateway / unavailable / timeout</td><td>Downstream failure, maintenance</td></tr>
</table>
<blockquote><p><strong>Cardinal sin:</strong> returning <code>200 OK</code> with <code>{"success": false}</code>. It breaks every client, proxy, retry policy and monitoring dashboard that relies on status codes.</p></blockquote>`
},
{
  q: "What is idempotency and how do you implement an idempotent POST?",
  level: "advanced", hot: true, tags: ["idempotency", "design"],
  a: `<p>POST is not idempotent by definition, but real systems need it to be: a client times out, retries, and you must not charge the card twice. The standard solution is an <strong>idempotency key</strong> (Stripe popularised it).</p>
<pre><code>@PostMapping("/payments")
public ResponseEntity&lt;PaymentDto&gt; pay(
        @RequestHeader("Idempotency-Key") @NotBlank String key,
        @Valid @RequestBody PaymentRequest req) {

    // 1. Try to claim the key atomically — the DB unique constraint is the lock
    Optional&lt;IdempotencyRecord&gt; existing = idempotencyRepo.findByKey(key);
    if (existing.isPresent()) {
        var rec = existing.get();
        if (!rec.requestHash().equals(hash(req)))
            throw new IdempotencyConflictException();   // 422: same key, different body
        if (rec.status() == IN_PROGRESS) return status(409).build();
        return ResponseEntity.status(rec.httpStatus()).body(rec.response());  // replay
    }
    // 2. Insert IN_PROGRESS; a concurrent duplicate hits the unique index and fails fast
    idempotencyRepo.save(new IdempotencyRecord(key, hash(req), IN_PROGRESS));

    // 3. Do the work, store the response, return it
    PaymentDto result = paymentService.charge(req);
    idempotencyRepo.complete(key, 201, result);
    return ResponseEntity.status(201).body(result);
}</code></pre>
<p><strong>Details that show real experience:</strong> store the request hash so the same key with a different body is rejected rather than silently replaying; expire keys after 24–48 hours; and make the claim and the work atomic — either in one transaction, or with the outbox pattern if the work involves an external call.</p>
<p>The related concept for message consumers is <strong>deduplication by event ID</strong>: keep a processed-events table with a unique constraint, which turns at-least-once delivery into effectively-once processing.</p>`
},
{
  q: "How do you design good REST resource URLs?",
  level: "beginner", hot: true, tags: ["design"],
  a: `<pre><code>✔  GET    /api/v1/orders                 list
✔  GET    /api/v1/orders/42              one
✔  POST   /api/v1/orders                 create
✔  PUT    /api/v1/orders/42              replace
✔  PATCH  /api/v1/orders/42              partial update
✔  DELETE /api/v1/orders/42              delete
✔  GET    /api/v1/orders/42/items        sub-resource
✔  GET    /api/v1/orders?status=PAID&amp;page=0&amp;size=20&amp;sort=createdAt,desc

✘  GET  /api/getOrders                   verb in the path
✘  POST /api/orders/42/delete            verb + wrong method
✘  GET  /api/order                       inconsistent singular
✘  GET  /api/v1/Orders/42                mixed case</code></pre>
<p><strong>Rules:</strong> plural nouns for collections, lowercase with hyphens (<code>/purchase-orders</code>), no verbs (the HTTP method is the verb), no file extensions (use <code>Accept</code>), filtering and pagination in the query string, and nesting no more than one level deep — <code>/customers/1/orders/42/items/7</code> should be <code>/order-items/7</code>.</p>
<p><strong>The honest exception:</strong> some operations are genuinely not CRUD — <code>POST /orders/42/cancel</code>, <code>POST /invoices/9/send</code>. Purists dislike it; every real API has them. Model them as sub-resources representing the action or its result, and be consistent.</p>`
},
{
  q: "What is HATEOAS and is it worth implementing?",
  level: "advanced", tags: ["design"],
  a: `<p><strong>Hypermedia As The Engine Of Application State</strong> — responses include links telling the client what it can do next, so the client discovers transitions instead of hard-coding URLs.</p>
<pre><code>{
  "id": 42, "status": "PENDING", "total": 199.00,
  "_links": {
    "self":   { "href": "/api/v1/orders/42" },
    "cancel": { "href": "/api/v1/orders/42/cancel", "method": "POST" },
    "pay":    { "href": "/api/v1/orders/42/payment", "method": "POST" }
  }
}</code></pre>
<p>Note what makes it interesting: a <em>shipped</em> order would simply not include the <code>cancel</code> link, so the state machine lives on the server rather than being duplicated in every client.</p>
<pre><code>// Spring HATEOAS
EntityModel&lt;OrderDto&gt; model = EntityModel.of(dto,
    linkTo(methodOn(OrderController.class).get(id)).withSelfRel(),
    linkTo(methodOn(OrderController.class).cancel(id)).withRel("cancel"));</code></pre>
<p><strong>Is it worth it?</strong> Give a balanced answer: it genuinely helps for long-lived public APIs with many independent clients, and for workflow-heavy domains. For an internal microservice consumed by one frontend team that generates a typed client from OpenAPI, it adds payload size and complexity for little benefit. Most teams choose OpenAPI-driven contracts instead — and knowing <em>why</em> is more valuable than knowing the acronym.</p>`
},
{
  q: "How do you do API versioning?",
  level: "advanced", hot: true, tags: ["versioning"],
  a: `<table>
<tr><th>Strategy</th><th>Example</th><th>Pros</th><th>Cons</th></tr>
<tr><td><strong>URI path</strong></td><td><code>/api/v1/orders</code></td><td>Obvious, cacheable, easy routing</td><td>Not "pure" REST — the resource identity changes</td></tr>
<tr><td>Query param</td><td><code>/orders?version=1</code></td><td>Simple</td><td>Easy to forget; messy caching</td></tr>
<tr><td>Custom header</td><td><code>X-API-Version: 1</code></td><td>Clean URLs</td><td>Invisible in a browser, harder to debug</td></tr>
<tr><td>Content negotiation</td><td><code>Accept: application/vnd.acme.v1+json</code></td><td>Most RESTful</td><td>Awkward for clients and tooling</td></tr>
</table>
<p><strong>URI path versioning is the pragmatic default</strong> — GitHub, Stripe and Twilio all effectively do this.</p>
<p><strong>What matters more than the mechanism:</strong></p>
<ul>
<li><strong>Version only on breaking changes.</strong> Adding an optional field, a new endpoint or a new enum value the client can ignore is non-breaking. Removing or renaming a field, changing a type, tightening validation or changing semantics is breaking.</li>
<li><strong>Tolerant reader principle</strong> — clients should ignore unknown fields (<code>@JsonIgnoreProperties(ignoreUnknown = true)</code>), which makes most additive changes free.</li>
<li><strong>Deprecate on a schedule</strong> — announce, emit <code>Deprecation</code> and <code>Sunset</code> headers, monitor usage per version, and only then remove.</li>
<li><strong>Never run more than two versions</strong> if you can help it — every version is a maintenance and testing cost.</li>
</ul>`
},
{
  q: "How do you handle errors consistently in a REST API?",
  level: "beginner", hot: true, tags: ["errors"],
  a: `<p>Use <strong>RFC 7807 Problem Details</strong> — a standard, machine-readable error format that Spring 6 supports natively.</p>
<pre><code>HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type":     "https://api.acme.com/errors/insufficient-funds",
  "title":    "Insufficient funds",
  "status":   422,
  "detail":   "Account balance 120.00 is less than the requested 500.00",
  "instance": "/api/v1/transfers/8f2c",
  "traceId":  "b7d3f1a9c2e",
  "errors":   [ { "field": "amount", "message": "exceeds available balance" } ]
}</code></pre>
<p><strong>Principles:</strong></p>
<ul>
<li><strong>One error shape across the whole API.</strong> Clients should write error handling once.</li>
<li><strong>Never leak internals</strong> — no stack traces, SQL, class names or file paths in the response. Log them server-side against a correlation ID you <em>do</em> return.</li>
<li><strong>Distinguish client from server errors</strong> honestly, so your 5xx alerting means something.</li>
<li><strong>Return all validation errors at once</strong>, not the first one — otherwise the user fixes five fields in five round trips.</li>
<li><strong>Make errors actionable</strong>: say what was wrong and what to do, not "an error occurred".</li>
<li><strong>Use a stable <code>type</code> or error code</strong> so clients branch on a constant rather than parsing English prose.</li>
</ul>`
},
{
  q: "How do you implement pagination, filtering and sorting?",
  level: "beginner", tags: ["design"],
  a: `<pre><code>GET /api/v1/orders?status=PAID&amp;minTotal=100&amp;createdAfter=2026-01-01
    &amp;page=0&amp;size=20&amp;sort=createdAt,desc&amp;sort=id,asc

{
  "content": [ ... ],
  "page":    { "number": 0, "size": 20, "totalElements": 1543, "totalPages": 78 }
}</code></pre>
<p><strong>Offset pagination</strong> (<code>page</code>/<code>size</code>) is simple and lets users jump to page 50, but it degrades — <code>OFFSET 100000</code> forces the database to scan and discard 100,000 rows — and rows shift under the user when data changes concurrently.</p>
<p><strong>Keyset / cursor pagination</strong> stays O(log n) at any depth and is stable:</p>
<pre><code>GET /api/v1/orders?limit=20&amp;cursor=eyJjcmVhdGVkQXQiOiIyMDI2LTA5LTAxIiwiaWQiOjkxfQ

SELECT * FROM orders
WHERE (created_at, id) &lt; (:lastCreatedAt, :lastId)   -- tuple comparison
ORDER BY created_at DESC, id DESC
LIMIT 20;</code></pre>
<p><strong>Always:</strong> cap the maximum page size server-side, apply a default sort (an unsorted paginated query can return the same row twice), validate sort fields against an allowlist to avoid injection, and index the sort columns.</p>
<p>For filtering beyond a handful of parameters, mention <strong>RSQL</strong> (<code>?filter=status==PAID;total&gt;100</code>) or Spring Data <code>Specification</code>s for a composable dynamic query layer.</p>`
},
{
  q: "How do you secure a REST API?",
  level: "advanced", hot: true, tags: ["security"],
  a: `<ol>
<li><strong>TLS everywhere</strong> — HTTPS only, HSTS header, redirect HTTP. Without it nothing else matters.</li>
<li><strong>Authentication</strong> — OAuth2/OIDC with short-lived JWTs for user traffic, <code>client_credentials</code> or mTLS for service-to-service. API keys only for low-risk, non-user integrations.</li>
<li><strong>Authorization on every endpoint</strong> — deny by default. Check <em>ownership</em>, not just role: <code>GET /orders/42</code> must verify that order belongs to the caller (otherwise it is an IDOR vulnerability, the number-one API risk in the OWASP API Top 10).</li>
<li><strong>Validate all input</strong> — bean validation on DTOs, strict types, size limits on bodies and arrays, allowlists for enums and sort fields.</li>
<li><strong>Rate limiting and quotas</strong> — per user, per IP, per endpoint. Return 429 with <code>Retry-After</code>.</li>
<li><strong>Never expose internal identifiers or fields</strong> — use DTOs, not entities; a leaked <code>isAdmin</code> field that Jackson happily binds from the request body is the classic mass-assignment bug.</li>
<li><strong>Security headers and CORS</strong> — explicit origin allowlist, no wildcard with credentials.</li>
<li><strong>Log and monitor</strong> — auth failures, 403s, unusual volumes. Never log tokens, passwords or PII.</li>
<li><strong>Keep dependencies patched</strong> and run a scanner in CI.</li>
</ol>
<pre><code>// Mass assignment protection: use an explicit request DTO
public record UpdateUserRequest(String name, String email) { }  // no 'role', no 'id'
// NOT: public User update(@RequestBody User user)</code></pre>`
},
{
  q: "What is content negotiation?",
  level: "beginner", tags: ["http"],
  a: `<p>The client states what it wants and what it is sending; the server picks a representation.</p>
<pre><code>Request:
  Accept:           application/json, application/xml;q=0.9
  Content-Type:     application/json
  Accept-Language:  en-GB, en;q=0.8
  Accept-Encoding:  gzip, br

Response:
  Content-Type:     application/json
  Content-Language: en-GB
  Content-Encoding: gzip
  Vary:             Accept, Accept-Encoding      &lt;-- so caches key correctly</code></pre>
<pre><code>@GetMapping(value = "/{id}", produces = { APPLICATION_JSON_VALUE, APPLICATION_XML_VALUE })
public OrderDto get(@PathVariable Long id) { ... }</code></pre>
<p>Spring resolves this through <code>HttpMessageConverter</code>s. If nothing matches the <code>Accept</code> header you get <strong>406 Not Acceptable</strong>; if the server cannot parse the request body's <code>Content-Type</code>, <strong>415 Unsupported Media Type</strong>. Knowing which is which is a common quick-fire question.</p>
<p>The <code>Vary</code> header matters in production: without it, a CDN can serve a gzipped or XML response to a client that asked for neither.</p>`
},
{
  q: "How does HTTP caching work — ETag, Cache-Control, Last-Modified?",
  level: "advanced", hot: true, tags: ["caching", "http"],
  a: `<pre><code>Response:
  Cache-Control: public, max-age=3600, stale-while-revalidate=60
  ETag: "a3f5c9"
  Last-Modified: Wed, 03 Sep 2026 10:00:00 GMT

Next request:
  If-None-Match: "a3f5c9"          -&gt; 304 Not Modified (no body!)
  If-Modified-Since: Wed, 03 Sep 2026 10:00:00 GMT</code></pre>
<table>
<tr><th>Directive</th><th>Meaning</th></tr>
<tr><td><code>public</code> / <code>private</code></td><td>Any cache may store it / only the browser</td></tr>
<tr><td><code>max-age=n</code></td><td>Fresh for n seconds</td></tr>
<tr><td><code>no-cache</code></td><td>May store, but must revalidate before use</td></tr>
<tr><td><code>no-store</code></td><td>Do not store at all — for sensitive data</td></tr>
<tr><td><code>must-revalidate</code></td><td>Do not serve stale on error</td></tr>
</table>
<pre><code>// Spring: ETag automatically
@Bean ShallowEtagHeaderFilter etagFilter() { return new ShallowEtagHeaderFilter(); }

// Or explicitly, which also saves the database read
return ResponseEntity.ok()
        .eTag(String.valueOf(order.getVersion()))
        .cacheControl(CacheControl.maxAge(1, HOURS).cachePublic())
        .body(dto);</code></pre>
<p><strong>Two things worth adding:</strong> a <em>shallow</em> ETag filter still executes your whole handler and only saves bandwidth; computing the ETag from a version column lets you return 304 before touching the database. And ETags enable <strong>optimistic concurrency over HTTP</strong> — send <code>If-Match: "a3f5c9"</code> on a PUT and the server returns <strong>412 Precondition Failed</strong> if someone else changed the resource, which is the cleanest way to prevent lost updates in an API.</p>`
},
{
  q: "REST vs GraphQL vs gRPC — how do you choose?",
  level: "advanced", hot: true, tags: ["architecture"],
  a: `<table>
<tr><th></th><th>REST</th><th>GraphQL</th><th>gRPC</th></tr>
<tr><td>Transport</td><td>HTTP/1.1 or 2</td><td>HTTP, usually one POST endpoint</td><td>HTTP/2</td></tr>
<tr><td>Payload</td><td>JSON</td><td>JSON</td><td>Protobuf (binary)</td></tr>
<tr><td>Contract</td><td>OpenAPI (optional)</td><td>Schema (mandatory)</td><td>.proto (mandatory)</td></tr>
<tr><td>Over/under-fetching</td><td>Common problem</td><td>Solved — client picks fields</td><td>Fixed messages</td></tr>
<tr><td>Caching</td><td><strong>Native HTTP caching</strong></td><td>Hard — needs client-side normalisation</td><td>Manual</td></tr>
<tr><td>Streaming</td><td>SSE / WebSocket</td><td>Subscriptions</td><td><strong>Bidirectional, first class</strong></td></tr>
<tr><td>Browser support</td><td>Native</td><td>Native</td><td>Needs grpc-web proxy</td></tr>
<tr><td>Performance</td><td>Good</td><td>Good</td><td><strong>Best</strong> — binary, multiplexed</td></tr>
</table>
<p><strong>How I would choose:</strong></p>
<ul>
<li><strong>REST</strong> — public APIs, CRUD services, anything where HTTP caching, tooling and universal client support matter. The default.</li>
<li><strong>GraphQL</strong> — many heterogeneous clients (web, iOS, Android) with different data needs, or an aggregation layer over several backends. Cost: N+1 resolvers, query-complexity attacks, and caching you must build yourself.</li>
<li><strong>gRPC</strong> — internal service-to-service calls where latency and throughput matter, polyglot teams wanting generated clients, or streaming.</li>
</ul>
<p>A common real architecture uses all three: gRPC between internal services, GraphQL as the client-facing aggregation layer, REST for public and partner APIs.</p>`
},
{
  q: "What is the difference between synchronous and asynchronous API design?",
  level: "advanced", tags: ["design", "architecture"],
  a: `<p><strong>Synchronous</strong> — the client waits for the work to finish. Simple, but the caller is coupled to your latency and availability, and long operations hit timeouts.</p>
<p><strong>Asynchronous</strong> — accept the request, return immediately, do the work in the background.</p>
<pre><code>POST /api/v1/reports
202 Accepted
Location: /api/v1/reports/8f2c/status

GET /api/v1/reports/8f2c/status
200 { "status": "PROCESSING", "progress": 45 }
...
200 { "status": "COMPLETED", "resultUrl": "/api/v1/reports/8f2c/download" }</code></pre>
<p><strong>Ways to tell the client it is done</strong>, in increasing sophistication:</p>
<ul>
<li><strong>Polling</strong> — simplest, works everywhere; wasteful, so return a <code>Retry-After</code> hint.</li>
<li><strong>Webhooks</strong> — you call the client back. Needs retries with backoff, a signed payload (HMAC) so they can verify it, and idempotent delivery.</li>
<li><strong>Server-Sent Events / WebSocket</strong> — real-time push to a browser.</li>
<li><strong>Message queue</strong> — for service-to-service, publish an event and let consumers react.</li>
</ul>
<p><strong>Use async when</strong> the work takes more than a few seconds, involves third parties you do not control, must survive restarts, or needs to be retried independently of the caller. Report generation, bulk imports, payment settlement, email and video processing all belong here.</p>`
},
{
  q: "How do you handle rate limiting?",
  level: "advanced", tags: ["production", "design"],
  a: `<p><strong>Algorithms:</strong></p>
<ul>
<li><strong>Fixed window</strong> — count per minute. Simple, but allows a 2× burst at the window boundary.</li>
<li><strong>Sliding window log/counter</strong> — accurate, more storage.</li>
<li><strong>Token bucket</strong> — tokens refill at a steady rate, up to a cap. <strong>Allows bursts while limiting the average</strong>; the usual choice.</li>
<li><strong>Leaky bucket</strong> — smooths output to a constant rate.</li>
</ul>
<pre><code>HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1757153400</code></pre>
<pre><code>// Bucket4j + Redis for a distributed limit
Bucket bucket = proxyManager.builder().build(userId, () -&gt;
    BucketConfiguration.builder()
        .addLimit(Bandwidth.builder().capacity(1000).refillGreedy(1000, Duration.ofHours(1)).build())
        .addLimit(Bandwidth.builder().capacity(50).refillGreedy(50, Duration.ofMinutes(1)).build())
        .build());

if (!bucket.tryConsume(1)) throw new TooManyRequestsException();</code></pre>
<p><strong>Design points:</strong> limit must be <em>distributed</em> (Redis) or each replica allows the full quota; key by user or API key rather than IP where possible (NAT means many users share an IP); apply different limits per endpoint cost; exempt health checks; and always return the headers so well-behaved clients can self-throttle instead of hammering you. In many architectures this belongs at the API gateway (Kong, Nginx, Spring Cloud Gateway) rather than in each service.</p>`
},
{
  q: "How do you test a REST API?",
  level: "advanced", tags: ["testing"],
  a: `<pre><code>// 1. Controller slice — fast, mocked service layer
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test void createsOrder() throws Exception {
        given(service.create(any())).willReturn(new OrderDto(1L, "PENDING"));
        mvc.perform(post("/api/v1/orders")
                .contentType(APPLICATION_JSON)
                .content("""
                    {"customerId":"c1","items":[{"sku":"A","qty":2}]}
                    """))
           .andExpect(status().isCreated())
           .andExpect(header().exists("Location"))
           .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test void rejectsInvalidPayload() throws Exception {
        mvc.perform(post("/api/v1/orders").contentType(APPLICATION_JSON).content("{}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errors").isArray());
    }
}

// 2. Full integration with a real database
@SpringBootTest(webEnvironment = RANDOM_PORT) @Testcontainers
class OrderApiIT { @Autowired TestRestTemplate rest; }</code></pre>
<p><strong>The layers to name:</strong> unit tests for logic, slice tests for the web layer, integration tests with Testcontainers for the real database, <strong>contract tests</strong> (Spring Cloud Contract or Pact) so a provider change breaks the build rather than the consumer's production, and a small number of end-to-end smoke tests. Add security tests — assert that an unauthenticated call gets 401 and another user's resource gets 403/404 — because that is exactly the test people forget and exactly the bug that matters.</p>
<p><strong>WireMock</strong> for stubbing downstream services, and asserting the OpenAPI spec has not changed incompatibly, are two more things worth mentioning.</p>`
},
{
  q: "What is the difference between PUT and POST for creating a resource?",
  level: "beginner", tags: ["http"],
  a: `<ul>
<li><strong>POST /orders</strong> — the <em>server</em> decides the URI. Send it twice and you create two orders. Respond <code>201 Created</code> with a <code>Location</code> header pointing at the new resource.</li>
<li><strong>PUT /orders/42</strong> — the <em>client</em> chooses the URI. Send it twice and you have one order in the same final state, because PUT is idempotent. Respond <code>201</code> if it was created, <code>200</code>/<code>204</code> if it replaced an existing one.</li>
</ul>
<p>Use PUT-for-create when the client can generate the identifier — a UUID, or a natural key like <code>PUT /users/vivek@example.com/preferences</code>. That is genuinely useful because it makes creation retry-safe without an idempotency key.</p>
<p>The other distinction interviewers probe: PUT replaces the <em>whole</em> representation. If the client omits a field, it should be cleared, not left alone. Treating PUT as a partial update is one of the most common API design mistakes — use PATCH for that.</p>`
},
{
  q: "How do you document an API and keep the docs honest?",
  level: "beginner", tags: ["openapi"],
  a: `<p><strong>OpenAPI (formerly Swagger)</strong> is the standard. Two approaches:</p>
<ul>
<li><strong>Code-first</strong> — annotate controllers, generate the spec (springdoc-openapi). Fast, and the docs cannot drift from the code because they <em>are</em> the code.</li>
<li><strong>Design-first</strong> — write the spec, review it with consumers, then generate server stubs and client SDKs. Better for public and partner APIs where the contract is negotiated before implementation.</li>
</ul>
<pre><code>&lt;dependency&gt;
  &lt;groupId&gt;org.springdoc&lt;/groupId&gt;
  &lt;artifactId&gt;springdoc-openapi-starter-webmvc-ui&lt;/artifactId&gt;
&lt;/dependency&gt;
# UI at /swagger-ui.html, spec at /v3/api-docs</code></pre>
<p><strong>Keeping documentation honest</strong> — the part most candidates miss:</p>
<ul>
<li>Commit the generated spec and <strong>diff it in CI</strong>; fail the build on an unapproved breaking change (openapi-diff does this).</li>
<li>Generate client SDKs from the spec so consumers cannot drift — this is exactly what OpenAPI Generator is for.</li>
<li>Include realistic examples and error responses, not just happy-path schemas.</li>
<li>Document authentication, rate limits, pagination and versioning policy once, at the top.</li>
</ul>
<blockquote><p>If you have contributed to OpenAPI Generator itself, this is the natural place to mention it — it turns a generic answer into a memorable one.</p></blockquote>`
},
{
  q: "What are webhooks and how do you implement them reliably?",
  level: "advanced", tags: ["design", "integration"],
  a: `<p>A webhook is a reverse API call: instead of the client polling you, you HTTP POST an event to a URL they registered. It is push-based integration.</p>
<p><strong>Provider-side requirements for reliability:</strong></p>
<ol>
<li><strong>Sign every payload.</strong> HMAC-SHA256 over the raw body with a per-subscriber secret, sent in a header, plus a timestamp to prevent replay. Without this the receiver cannot trust the call.</li>
<li><strong>Retry with exponential backoff and jitter</strong> on non-2xx or timeout — for example 6 attempts over 24 hours — then move to a dead-letter store and alert the subscriber.</li>
<li><strong>Deliver asynchronously.</strong> Write the event to an outbox in the same transaction as the business change, and let a separate worker deliver it. Never call a third party inside your database transaction.</li>
<li><strong>Include an event ID</strong> so the receiver can deduplicate — you are promising at-least-once, not exactly-once, and you should say so in the docs.</li>
<li><strong>Timeout aggressively</strong> (a few seconds) so one slow subscriber cannot back up your delivery pipeline; isolate subscribers from each other.</li>
<li><strong>Provide a replay/redelivery endpoint</strong> and a delivery log the subscriber can inspect.</li>
</ol>
<pre><code>X-Acme-Event: order.completed
X-Acme-Delivery: 9f1c2e...
X-Acme-Timestamp: 1757153400
X-Acme-Signature: sha256=8d1f...</code></pre>
<p><strong>Consumer-side:</strong> verify the signature before parsing, respond 2xx <em>immediately</em> and process asynchronously (otherwise your slow handler causes duplicate deliveries), and treat every event as possibly duplicated.</p>`
}
]);
