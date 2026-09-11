appendTopic("rest-api", [
{
  q: "REST, gRPC or GraphQL — how do you choose?",
  level: "advanced", hot: true, tags: ["rest", "grpc", "graphql", "design", "trade-offs"],
  companies: ["Amazon", "Flipkart", "Uber", "Walmart", "SAP", "Optum", "Swiggy", "Salesforce"],
  a: `<table>
<tr><th></th><th>REST</th><th>gRPC</th><th>GraphQL</th></tr>
<tr><td>Transport</td><td>HTTP/1.1 or 2, JSON</td><td>HTTP/2, Protobuf binary</td><td>HTTP, JSON</td></tr>
<tr><td>Contract</td><td>OpenAPI (optional)</td><td><strong>.proto — mandatory</strong></td><td>SDL — mandatory</td></tr>
<tr><td>Payload size</td><td>Baseline</td><td><strong>Much smaller</strong></td><td>Baseline</td></tr>
<tr><td>Streaming</td><td>SSE or WebSocket</td><td><strong>Bidirectional, native</strong></td><td>Subscriptions</td></tr>
<tr><td>Browser support</td><td><strong>Native</strong></td><td>Needs grpc-web + a proxy</td><td>Native</td></tr>
<tr><td>Over/under-fetching</td><td>Common</td><td>Fixed per method</td><td><strong>Client decides</strong></td></tr>
<tr><td>Caching</td><td><strong>HTTP caching for free</strong></td><td>Manual</td><td>Hard — everything is a POST</td></tr>
<tr><td>Debuggability</td><td><strong>curl, browser, logs</strong></td><td>Needs tooling (grpcurl)</td><td>Good — GraphiQL</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Choosing between REST gRPC and GraphQL by consumer">
  <rect class="dg-fill" x="16" y="26" width="186" height="50" rx="9"/>
  <text class="dg-s" x="109" y="48" text-anchor="middle">Public / partner API</text>
  <text class="dg-s" x="109" y="66" text-anchor="middle">→ REST + OpenAPI</text>
  <rect class="dg-fill2" x="216" y="26" width="186" height="50" rx="9"/>
  <text class="dg-s" x="309" y="48" text-anchor="middle">Service ↔ service, internal</text>
  <text class="dg-s" x="309" y="66" text-anchor="middle">→ gRPC</text>
  <rect class="dg-box" x="416" y="26" width="188" height="50" rx="9"/>
  <text class="dg-s" x="510" y="48" text-anchor="middle">Many clients, varied needs</text>
  <text class="dg-s" x="510" y="66" text-anchor="middle">→ GraphQL gateway</text>
  <text class="dg-s" x="16" y="112">these are not exclusive — a common shape is gRPC between services</text>
  <text class="dg-s" x="16" y="132">behind a REST or GraphQL edge that faces the outside world</text>
</svg>
</figure>
<pre><code>// gRPC — the contract IS the source of truth, and it generates both sides
service OrderService {
  rpc GetOrder (GetOrderRequest) returns (Order);
  rpc StreamUpdates (OrderFilter) returns (stream OrderEvent);   // server stream
}
message Order {
  int64 id = 1;              // field NUMBERS are the wire format —
  string status = 2;         // never reuse or renumber them
  reserved 3;                // mark a removed field reserved
}
// Backward compatibility rules: adding an optional field is safe; changing a
// field's number or type is not. That discipline is enforced, unlike in JSON.</code></pre>
<table>
<tr><th>Choose</th><th>When</th></tr>
<tr><td><strong>REST</strong></td><td>Public APIs, third-party integrators, anything a browser calls directly, CDN caching matters</td></tr>
<tr><td><strong>gRPC</strong></td><td>High-volume internal traffic, polyglot services, streaming, latency-sensitive hops</td></tr>
<tr><td><strong>GraphQL</strong></td><td>Many client shapes (web + iOS + Android), aggregating several backends, avoiding a proliferation of bespoke endpoints</td></tr>
</table>
<p><strong>The honest answer to give:</strong> "I would default to REST unless something specific pushes me off it — it is the least surprising for every consumer and every operator, and HTTP caching is real value you get for nothing. gRPC earns its place on hot internal paths where payload size and latency measurably matter. GraphQL earns its place when the <em>client diversity</em> is the actual problem, not when the team just wants flexible queries — because it moves cost from the client onto your caching, authorisation and rate limiting."</p>`
},
{
  q: "How do you design and document an API contract that survives contact with real clients?",
  level: "advanced", tags: ["openapi", "design", "contract", "best-practice"],
  companies: ["Amazon", "SAP", "Optum", "Maersk", "Societe Generale", "Walmart", "Infosys"],
  a: `<pre><code># Contract first: write the OpenAPI spec, review it, then generate
openapi: 3.1.0
paths:
  /orders/{orderId}:
    get:
      operationId: getOrder
      parameters:
        - { name: orderId, in: path, required: true, schema: { type: integer, format: int64 } }
      responses:
        "200": { $ref: "#/components/responses/Order" }
        "404": { $ref: "#/components/responses/Problem" }
components:
  schemas:
    Order:
      required: [id, status, total]        # be explicit; optional is the default
      properties:
        status: { type: string, enum: [PENDING, PAID, SHIPPED] }</code></pre>
<table>
<tr><th>Convention</th><th>Why</th></tr>
<tr><td><strong>Plural nouns</strong> — <code>/orders/42/items</code></td><td>Resources, not actions. <code>/getOrder</code> is RPC wearing a REST costume.</td></tr>
<tr><td>Nest at most one level deep</td><td><code>/a/1/b/2/c/3</code> becomes unmaintainable; use query parameters</td></tr>
<tr><td>One casing everywhere</td><td>Pick <code>snake_case</code> or <code>camelCase</code> and never mix</td></tr>
<tr><td><strong>Envelope collections</strong></td><td><code>{"items": [...], "pageInfo": {...}}</code> — a bare array cannot grow metadata later</td></tr>
<tr><td>ISO 8601 with an offset</td><td><code>2026-09-11T10:00:00Z</code>, never epoch millis in a public API</td></tr>
<tr><td>Money as minor units + currency</td><td><code>{"amount": 4999, "currency": "INR"}</code>, never a float</td></tr>
<tr><td>Enums as strings</td><td>A numeric enum is unreadable in logs and breaks when reordered</td></tr>
<tr><td><code>ProblemDetail</code> (RFC 7807) for errors</td><td>One error shape across the whole API</td></tr>
</table>
<pre><code>// The compatibility rule that prevents most breakages: TOLERANT READER
@JsonIgnoreProperties(ignoreUnknown = true)     // clients ignore new fields
public record OrderResponse(Long id, String status, Money total) { }

spring.jackson.default-property-inclusion: non_null   // never serialise nulls,
                                                       // so adding a field is free

// Consumer-driven contract tests catch a break BEFORE it ships:
// the consumer publishes its expectations (Pact / Spring Cloud Contract),
// and the provider's build fails if it stops meeting them. That is stronger
// than "we documented it" because it runs on every commit.</code></pre>
<p><strong>The operational additions that separate a real API from a demo:</strong> a correlation id echoed back on every response; <code>Retry-After</code> on 429 and 503; consistent pagination across every collection; a health endpoint the load balancer actually uses; and rate limit headers so a client can back off before you have to reject them.</p>
<p><strong>Say this:</strong> "I design the contract first and review it like code, because once a client integrates, the shape is effectively permanent. The single most valuable convention is the tolerant reader — if clients ignore unknown fields, almost every future change becomes additive and I never need a v2."</p>`
}
]);
