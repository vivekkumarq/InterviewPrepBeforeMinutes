appendTopic("rest-api", [
{
  q: "What is the difference between PUT, PATCH and JSON Patch?",
  level: "advanced", tags: ["http", "design"],
  a: `<pre><code>// PUT — full replacement. Omitted fields are CLEARED.
PUT /api/v1/users/42
{ "name": "Vivek", "email": "v@acme.com" }        // phone is now null

// PATCH with merge semantics (RFC 7396 JSON Merge Patch)
PATCH /api/v1/users/42
Content-Type: application/merge-patch+json
{ "email": "new@acme.com" }                        // only email changes
{ "phone": null }                                  // explicit null MEANS delete

// PATCH with JSON Patch (RFC 6902) — an operation list
PATCH /api/v1/users/42
Content-Type: application/json-patch+json
[
  { "op": "replace", "path": "/email", "value": "new@acme.com" },
  { "op": "add",     "path": "/tags/-", "value": "vip" },
  { "op": "remove",  "path": "/phone" },
  { "op": "test",    "path": "/version", "value": 7 }     // optimistic concurrency
]</code></pre>
<table>
<tr><th></th><th>Merge Patch</th><th>JSON Patch</th></tr>
<tr><td>Readability</td><td>Natural, looks like the resource</td><td>Verbose</td></tr>
<tr><td>Array element edits</td><td>Replaces the whole array</td><td>Precise add/remove/move by index</td></tr>
<tr><td>Distinguishes "absent" from "set to null"</td><td>No — null means delete</td><td>Yes</td></tr>
<tr><td>Conditional application</td><td>No</td><td><code>test</code> op</td></tr>
</table>
<p><strong>The Java problem with merge patch:</strong> Jackson cannot distinguish "field omitted" from "field explicitly null" when binding to a DTO — both arrive as <code>null</code>. Solutions: use <code>JsonNullable</code> (openapi-jackson-nullable), bind to a <code>Map</code>/<code>JsonNode</code> and apply only present keys, or use <code>Optional&lt;T&gt;</code> fields with a custom deserialiser.</p>
<p><strong>Practical recommendation:</strong> merge patch for most APIs — it is what consumers expect and easiest to write. JSON Patch when you need precise array manipulation or conditional updates. And remember PATCH is <em>not</em> guaranteed idempotent: <code>{"op":"add","path":"/tags/-"}</code> appends every time it is applied.</p>`
},
{
  q: "How do you design a bulk/batch API endpoint?",
  level: "advanced", hot: true, tags: ["design"],
  a: `<pre><code>POST /api/v1/orders/bulk
{ "items": [ {...}, {...}, {...} ] }

// 207 Multi-Status — per-item outcomes, because partial failure is the normal case
HTTP/1.1 207 Multi-Status
{
  "succeeded": 2,
  "failed": 1,
  "results": [
    { "index": 0, "status": 201, "id": "ord-1" },
    { "index": 1, "status": 201, "id": "ord-2" },
    { "index": 2, "status": 422,
      "error": { "code": "INSUFFICIENT_STOCK", "detail": "SKU-9 has 2 available, 5 requested" } }
  ]
}</code></pre>
<p><strong>Design decisions to state explicitly:</strong></p>
<ol>
<li><strong>All-or-nothing vs partial success.</strong> Decide and document it. Financial batches usually want atomic (one transaction, one failure rolls back everything); imports usually want partial with a per-item report. Do not leave it ambiguous.</li>
<li><strong>Always return per-item results keyed by index or client-supplied ID</strong>, so the caller knows exactly what to retry.</li>
<li><strong>Cap the batch size</strong> (say 100–1,000) and return <code>413</code> or <code>400</code> above it — an unbounded batch is a denial-of-service and a transaction that holds locks for minutes.</li>
<li><strong>Idempotency</strong> — an <code>Idempotency-Key</code> for the batch, and ideally a client-supplied reference per item so a retry does not duplicate the successful half.</li>
<li><strong>Go asynchronous above a threshold</strong> — return <code>202 Accepted</code> with a job URL rather than holding an HTTP connection for two minutes:</li>
</ol>
<pre><code>POST /api/v1/orders/import   -&gt; 202 Accepted, Location: /api/v1/jobs/8f2c
GET  /api/v1/jobs/8f2c       -&gt; { "status": "RUNNING", "processed": 4200, "total": 10000 }
GET  /api/v1/jobs/8f2c/errors -&gt; downloadable CSV of failures</code></pre>
<p><strong>Implementation notes:</strong> stream and chunk the processing rather than loading everything into memory, commit in batches so a failure at row 9,000 does not lose the first 8,999, and make the job resumable. The most common production incident here is a 50,000-row import that times out at the load balancer after 60 seconds having already written half the rows.</p>`
},
{
  q: "What are the HTTP headers every API developer should know?",
  level: "beginner", tags: ["http"],
  a: `<table>
<tr><th>Header</th><th>Direction</th><th>Purpose</th></tr>
<tr><td><code>Authorization</code></td><td>Request</td><td><code>Bearer &lt;jwt&gt;</code>, <code>Basic ...</code></td></tr>
<tr><td><code>Content-Type</code></td><td>Both</td><td>Format of <em>this</em> body</td></tr>
<tr><td><code>Accept</code></td><td>Request</td><td>Formats the client can handle</td></tr>
<tr><td><code>Accept-Encoding</code> / <code>Content-Encoding</code></td><td>Both</td><td>gzip, br compression</td></tr>
<tr><td><code>Cache-Control</code></td><td>Both</td><td>Caching policy</td></tr>
<tr><td><code>ETag</code> / <code>If-None-Match</code></td><td>Both</td><td>Conditional GET → 304</td></tr>
<tr><td><code>If-Match</code></td><td>Request</td><td>Optimistic concurrency → 412</td></tr>
<tr><td><code>Location</code></td><td>Response</td><td>URI of a created resource (with 201)</td></tr>
<tr><td><code>Retry-After</code></td><td>Response</td><td>With 429 or 503</td></tr>
<tr><td><code>Idempotency-Key</code></td><td>Request</td><td>Safe retry of a POST</td></tr>
<tr><td><code>X-Request-Id</code> / <code>traceparent</code></td><td>Both</td><td>Correlation and distributed tracing</td></tr>
<tr><td><code>Vary</code></td><td>Response</td><td>Which request headers affect the response — critical for CDN correctness</td></tr>
<tr><td><code>Content-Disposition</code></td><td>Response</td><td><code>attachment; filename="x.pdf"</code></td></tr>
<tr><td><code>Strict-Transport-Security</code></td><td>Response</td><td>Force HTTPS</td></tr>
<tr><td><code>X-RateLimit-*</code></td><td>Response</td><td>Quota state so clients can self-throttle</td></tr>
</table>
<p><strong>Two things that catch people out:</strong> omitting <code>Vary: Accept, Accept-Encoding</code> lets a CDN serve a gzipped or XML response to a client that asked for neither. And custom headers no longer use the <code>X-</code> prefix by convention (RFC 6648 deprecated it), though <code>X-Request-Id</code> survives by sheer momentum.</p>
<p>For tracing, prefer the W3C standard <code>traceparent</code> header over a bespoke one — it interoperates with OpenTelemetry, service meshes and cloud providers automatically.</p>`
},
{
  q: "How do you design an API for a mobile client with poor connectivity?",
  level: "advanced", tags: ["design", "mobile"],
  a: `<p>Constraints that change the design: high latency, intermittent connectivity, expensive data, and limited battery.</p>
<ol>
<li><strong>Reduce round trips.</strong> Latency dominates on mobile — one 300 ms request beats five 100 ms ones. Provide a coarse-grained endpoint that returns a whole screen's data (a backend-for-frontend), rather than making the client orchestrate five calls.</li>
<li><strong>Reduce payload size.</strong> gzip/brotli, sparse fieldsets (<code>?fields=id,name,total</code>), pagination with small pages, and avoid sending fields the screen does not render.</li>
<li><strong>Make everything retry-safe.</strong> Connectivity drops mid-request constantly, so <strong>idempotency keys on every mutating endpoint</strong> are not optional — otherwise a retry double-charges.</li>
<li><strong>Support delta sync.</strong> <code>GET /orders?updatedSince=2026-09-06T10:00:00Z</code> so the client fetches only changes, plus tombstones for deletions so it can remove local rows.</li>
<li><strong>Conditional requests.</strong> ETags mean an unchanged resource costs a 304 with no body.</li>
<li><strong>Design for offline-first.</strong> The client queues mutations locally and replays them on reconnect — which requires server-side conflict resolution (last-write-wins, version vectors, or returning 409 with the current state so the client can merge).</li>
<li><strong>Push rather than poll.</strong> Use push notifications or a WebSocket to signal "something changed"; polling drains battery.</li>
<li><strong>Version tolerantly.</strong> Old app versions live on user devices for years — you cannot force an upgrade, so the API must stay backwards compatible far longer than for a web client.</li>
</ol>
<pre><code>GET /api/v1/sync?since=1725609600&amp;limit=200
{
  "changes":  [ { "type": "order", "id": "1", "op": "upsert", "data": {...} },
                { "type": "order", "id": "9", "op": "delete" } ],
  "cursor":   "eyJ0cyI6MTcyNTYxMDAwMH0",
  "hasMore":  true,
  "serverTime": 1725610000
}</code></pre>
<p>Returning <code>serverTime</code> matters — mobile clocks are unreliable, so the client should use the server's cursor rather than its own timestamp.</p>`
},
{
  q: "What is the difference between REST and RPC style APIs?",
  level: "advanced", tags: ["architecture"],
  a: `<table>
<tr><th></th><th>REST (resource-oriented)</th><th>RPC (action-oriented)</th></tr>
<tr><td>Model</td><td>Nouns + standard verbs</td><td>Verbs — remote function calls</td></tr>
<tr><td>URL</td><td><code>POST /orders</code></td><td><code>POST /createOrder</code></td></tr>
<tr><td>HTTP semantics</td><td>Central — methods, status codes, caching</td><td>Mostly a transport; usually all POST, always 200</td></tr>
<tr><td>Caching</td><td>Native</td><td>Manual</td></tr>
<tr><td>Discoverability</td><td>Uniform interface</td><td>Needs documentation or a schema</td></tr>
<tr><td>Fit</td><td>CRUD-shaped domains, public APIs</td><td>Action-shaped domains, internal services</td></tr>
</table>
<p><strong>The honest observation:</strong> most real APIs are a hybrid. Even well-designed REST APIs need actions that are not CRUD — <code>POST /orders/42/cancel</code>, <code>POST /invoices/9/send</code>, <code>POST /sessions</code> for login. Purists dislike them; every production API has them.</p>
<p><strong>How to keep it clean:</strong> model the action as a sub-resource representing the <em>result</em> of the action rather than the verb itself, so it still fits the resource model:</p>
<pre><code>POST /orders/42/cancellation      // creates a cancellation resource
POST /orders/42/refunds           // creates a refund; GET lists them
POST /documents/9/signatures      // creates a signature</code></pre>
<p>That form also gives you a natural place to <code>GET</code> the history of those actions, which a plain <code>/cancelOrder</code> does not.</p>
<p><strong>Where RPC is genuinely the better choice:</strong> internal service-to-service calls where the operations are procedures rather than resources, and where a schema-first contract with generated clients matters more than HTTP caching — which is exactly the case for <strong>gRPC</strong>. Choosing RPC deliberately for internal traffic and REST for public APIs is a defensible, common architecture.</p>`
},
{
  q: "How do you handle long-running operations and streaming responses?",
  level: "advanced", tags: ["design", "async"],
  a: `<p><strong>Three patterns, depending on what the client needs:</strong></p>
<pre><code>// 1. Async job + polling — simplest and most robust
POST /api/v1/reports          -&gt; 202 Accepted
                                 Location: /api/v1/reports/8f2c
GET  /api/v1/reports/8f2c     -&gt; 200 { "status": "PROCESSING", "progress": 45 }
                                 Retry-After: 5
                              -&gt; 200 { "status": "DONE", "resultUrl": "..." }

// 2. Server-Sent Events — one-way server push over plain HTTP
@GetMapping(value = "/reports/{id}/progress", produces = TEXT_EVENT_STREAM_VALUE)
public SseEmitter progress(@PathVariable String id) {
    SseEmitter emitter = new SseEmitter(Duration.ofMinutes(5).toMillis());
    progressService.subscribe(id, pct -&gt; {
        try { emitter.send(SseEmitter.event().name("progress").data(pct)); }
        catch (IOException e) { emitter.completeWithError(e); }
    });
    emitter.onTimeout(emitter::complete);
    return emitter;
}

// 3. Streaming a large response body — constant memory, not buffered
@GetMapping(value = "/orders/export", produces = "text/csv")
public StreamingResponseBody export() {
    return out -&gt; {
        try (var writer = new BufferedWriter(new OutputStreamWriter(out));
             var rows = orderRepo.streamAll()) {              // Stream&lt;Order&gt;, cursor-based
            rows.forEach(o -&gt; writeCsvLine(writer, o));
        }
    };
}</code></pre>
<table>
<tr><th></th><th>Polling</th><th>SSE</th><th>WebSocket</th></tr>
<tr><td>Direction</td><td>Client pulls</td><td>Server → client</td><td>Bidirectional</td></tr>
<tr><td>Protocol</td><td>Plain HTTP</td><td>Plain HTTP</td><td>Upgrade required</td></tr>
<tr><td>Auto-reconnect</td><td>N/A</td><td><strong>Built in</strong></td><td>Manual</td></tr>
<tr><td>Proxy friendly</td><td>Yes</td><td>Yes</td><td>Often problematic</td></tr>
</table>
<p><strong>Guidance:</strong> default to the async job pattern — it survives client disconnects, is trivially load-balanced, and gives you retry and audit for free. SSE is underrated for progress and notifications: it is far simpler than WebSocket and reconnects automatically. Reserve WebSocket for genuinely bidirectional, low-latency interaction like chat or collaborative editing.</p>`
},
{
  q: "How do you design consistent API responses and envelopes?",
  level: "beginner", tags: ["design"],
  a: `<p>Two schools, and having a reasoned position matters more than which you pick:</p>
<pre><code>// A. Bare resource — HTTP carries the metadata
GET /api/v1/orders/42
200 OK
{ "id": 42, "reference": "ORD-42", "total": 199.00 }

// B. Envelope — everything wrapped in a consistent shape
{
  "data":  { "id": 42, "reference": "ORD-42" },
  "meta":  { "requestId": "b7d3f1", "timestamp": "2026-09-06T10:00:00Z" },
  "errors": []
}</code></pre>
<table>
<tr><th></th><th>Bare</th><th>Envelope</th></tr>
<tr><td>Payload size</td><td>Smaller</td><td>Larger</td></tr>
<tr><td>Client parsing</td><td>Direct</td><td>One extra level everywhere</td></tr>
<tr><td>Uses HTTP properly</td><td>Yes</td><td>Tends to duplicate status in the body</td></tr>
<tr><td>Consistent shape</td><td>Varies by endpoint</td><td>Always identical</td></tr>
</table>
<p><strong>My position:</strong> bare resources for single items, and a light envelope only where it carries genuine information — collections need pagination metadata regardless:</p>
<pre><code>GET /api/v1/orders?page=0&amp;size=20
{
  "content": [ ... ],
  "page": { "number": 0, "size": 20, "totalElements": 1543, "totalPages": 78 }
}</code></pre>
<p><strong>Non-negotiables whichever you choose:</strong> one consistent error format across the entire API (RFC 7807 Problem Details), consistent naming convention (pick <code>camelCase</code> or <code>snake_case</code> and never mix), ISO-8601 UTC timestamps, string identifiers rather than numbers where they may exceed JavaScript's safe integer range, and money as a string or minor units with an explicit currency — never a floating-point number.</p>
<p><strong>The anti-pattern to name:</strong> returning <code>200 OK</code> with <code>{"success": false}</code>. It defeats every proxy, cache, retry policy and monitoring dashboard that reads status codes.</p>`
},
{
  q: "What is API-first design and how does it change the workflow?",
  level: "advanced", tags: ["process", "openapi"],
  a: `<p><strong>API-first</strong> means the contract is written and agreed <em>before</em> implementation, rather than generated from finished code.</p>
<pre><code># 1. Write the OpenAPI spec, review it with consumers
paths:
  /orders/{id}:
    get:
      operationId: getOrder
      parameters: [ { name: id, in: path, required: true, schema: { type: string } } ]
      responses:
        '200': { content: { application/json: { schema: { $ref: '#/components/schemas/Order' } } } }
        '404': { content: { application/problem+json: { schema: { $ref: '#/components/schemas/Problem' } } } }

# 2. Generate server stubs and client SDKs from it
openapi-generator generate -i openapi.yaml -g spring        -o server
openapi-generator generate -i openapi.yaml -g typescript-axios -o client-ts</code></pre>
<p><strong>What changes in the workflow:</strong></p>
<ul>
<li><strong>Frontend and backend start on day one.</strong> The frontend generates a client and works against a mock server (Prism, WireMock) while the backend implements — instead of waiting.</li>
<li><strong>The contract is reviewed like code.</strong> Design mistakes are caught in a pull request rather than after three services depend on them.</li>
<li><strong>Breaking changes fail the build.</strong> Diff the committed spec in CI (openapi-diff) and reject incompatible changes.</li>
<li><strong>Consumers never hand-write clients</strong>, so they cannot drift from the contract.</li>
</ul>
<p><strong>The trade-off, stated honestly:</strong> code-first (springdoc annotations generating the spec) is faster for a small internal service and the docs can never lie, because they are derived from the code. API-first pays off when several teams or external partners consume the API, or when the design deserves scrutiny before it is set.</p>
<blockquote><p>Having contributed to <strong>OpenAPI Generator</strong> — the tool that produces those clients and server stubs — is worth mentioning here; it turns a process answer into a concrete one.</p></blockquote>`
},
{
  q: "How do you handle backwards compatibility when evolving an API?",
  level: "advanced", hot: true, tags: ["versioning"],
  a: `<table>
<tr><th>Change</th><th>Breaking?</th></tr>
<tr><td>Add a new optional request field</td><td>No</td></tr>
<tr><td>Add a new response field</td><td>No — if consumers ignore unknown fields</td></tr>
<tr><td>Add a new endpoint</td><td>No</td></tr>
<tr><td>Make an optional request field required</td><td><strong>Yes</strong></td></tr>
<tr><td>Remove or rename any field</td><td><strong>Yes</strong></td></tr>
<tr><td>Change a field's type or format</td><td><strong>Yes</strong></td></tr>
<tr><td>Add a new enum value</td><td><strong>Usually yes</strong> — clients often switch exhaustively</td></tr>
<tr><td>Tighten validation</td><td><strong>Yes</strong> — previously accepted requests now fail</td></tr>
<tr><td>Change error codes or status semantics</td><td><strong>Yes</strong></td></tr>
</table>
<p><strong>The expand–contract migration</strong>, which is the practical answer:</p>
<pre><code>// Renaming "amount" to "totalAmount"
// 1. EXPAND — return both, accept both
{ "amount": 199.00, "totalAmount": { "value": 199.00, "currency": "INR" } }
// 2. Deprecate the old field in the spec and in a Deprecation header
// 3. Monitor per-client usage of the old field
// 4. CONTRACT — remove it only when usage is zero, after the announced sunset date</code></pre>
<pre><code>Deprecation: Sat, 01 Nov 2026 00:00:00 GMT
Sunset: Sun, 01 Feb 2027 00:00:00 GMT
Link: &lt;https://docs.acme.com/migrations/total-amount&gt;; rel="deprecation"</code></pre>
<p><strong>What makes this work operationally:</strong> you need <em>field-level usage metrics per client</em> to know when removal is safe — otherwise "monitor usage" is guesswork. Log which deprecated fields each API key reads, and you can contact the three clients still using it rather than breaking everyone.</p>
<p><strong>The tolerant reader principle</strong> is the other half: your own clients should ignore unknown fields (<code>@JsonIgnoreProperties(ignoreUnknown = true)</code>) and handle unknown enum values gracefully, so <em>your</em> providers can evolve without breaking you.</p>`
}
]);
