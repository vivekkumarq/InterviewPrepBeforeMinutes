appendTopic("graphql", [
{
  q: "How do you secure a GraphQL API against malicious or runaway queries?",
  level: "advanced", hot: true, tags: ["security", "graphql", "production"],
  companies: ["Amazon", "Flipkart", "Adobe", "SAP", "Salesforce", "Walmart", "Publicis Sapient"],
  a: `<p>GraphQL moves query construction to the client, which is the feature — and the attack surface. REST endpoints have a fixed cost; a GraphQL query does not.</p>
<pre><code># The classic denial-of-service query — nothing here is invalid
query Bomb {
  user(id: 1) {
    friends {           # 100
      friends {         # 10,000
        friends {       # 1,000,000
          friends { name }   # 100,000,000 resolver calls
        }
      }
    }
  }
}</code></pre>
<table>
<tr><th>Control</th><th>What it stops</th></tr>
<tr><td><strong>Query depth limit</strong></td><td>The nesting bomb above — cap at 7–10 levels</td></tr>
<tr><td><strong>Query complexity scoring</strong></td><td>A wide, shallow query that is just as expensive. Weight fields by cost and multiply by pagination arguments.</td></tr>
<tr><td><strong>Disable introspection in production</strong></td><td>Stops trivial schema enumeration — though it is obscurity, not security</td></tr>
<tr><td><strong>Persisted queries</strong></td><td><strong>The strongest control</strong> — only pre-registered query hashes are accepted, so arbitrary queries are impossible</td></tr>
<tr><td>Timeouts and pagination caps</td><td>Bounds any single request</td></tr>
<tr><td>Rate limiting by <em>cost</em>, not request count</td><td>One expensive query should cost more budget than ten cheap ones</td></tr>
<tr><td>Field-level authorization</td><td>A user must not read another user's fields by nesting through a public one</td></tr>
</table>
<pre><code>// Spring for GraphQL — depth and complexity instrumentation
@Bean
public Instrumentation queryProtection() {
    return new ChainedInstrumentation(List.of(
        new MaxQueryDepthInstrumentation(10),
        new MaxQueryComplexityInstrumentation(1000)
    ));
}

# Turn introspection off outside development
spring.graphql.schema.introspection.enabled=false</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Query depth expanding exponentially through nested relations">
  <circle class="dg-fill" cx="60" cy="80" r="18"/><text class="dg-s" x="60" y="85" text-anchor="middle">user</text>
  <path class="dg-line" d="M80 74 L146 46 M80 80 H146 M80 86 L146 114" marker-end="url(#gq1)"/>
  <circle class="dg-fill" cx="164" cy="46" r="16"/><circle class="dg-fill" cx="164" cy="80" r="16"/><circle class="dg-fill" cx="164" cy="114" r="16"/>
  <text class="dg-s" x="164" y="18" text-anchor="middle">100</text>
  <path class="dg-line" d="M182 40 L246 26 M182 46 H246 M182 80 H246 M182 114 H246 M182 120 L246 134" marker-end="url(#gq1)"/>
  <circle class="dg-fill2" cx="264" cy="26" r="14"/><circle class="dg-fill2" cx="264" cy="60" r="14"/>
  <circle class="dg-fill2" cx="264" cy="94" r="14"/><circle class="dg-fill2" cx="264" cy="128" r="14"/>
  <text class="dg-s" x="264" y="152" text-anchor="middle">10,000</text>
  <text class="dg-s" x="330" y="70">each level multiplies —</text>
  <text class="dg-s" x="330" y="92">so a short query can request</text>
  <text class="dg-s" x="330" y="114">unbounded work from one HTTP call</text>
  <defs><marker id="gq1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// Persisted queries — the production answer for a first-party client
// Build time: extract every query from the app, hash it, ship the manifest.
// Runtime: the client sends only the hash.
POST /graphql
{ "extensions": { "persistedQuery": { "sha256Hash": "a3f9..." } } }
// The server rejects anything not in the manifest. Arbitrary queries become
// impossible, request payloads shrink, and the queries are cacheable by hash.</code></pre>
<p><strong>The authorization point that is unique to GraphQL:</strong> there is no URL to guard. A single query can traverse from a public object into a private one, so authorization has to live on the <em>resolver</em> — every field that returns sensitive data checks the caller, not just the entry point. Guarding only the top-level query is the most common GraphQL security bug.</p>
<pre><code>@SchemaMapping(typeName = "Order")
@PreAuthorize("#order.customerId == authentication.name or hasRole('ADMIN')")
public PaymentDetails payment(Order order) { }
// Also: return errors that do not distinguish "not found" from "not permitted",
// or you leak the existence of records the caller cannot see.</code></pre>
<p><strong>Say this to close:</strong> "For a public API I would ship persisted queries and disable arbitrary ones entirely. Depth and complexity limits are the fallback when clients genuinely need ad-hoc queries — and I would rate-limit by computed cost rather than by request count, because in GraphQL those two numbers have almost no relationship."</p>`
},
{
  q: "How do you handle errors, nullability and partial responses in GraphQL?",
  level: "advanced", tags: ["errors", "schema", "design"],
  companies: ["Amazon", "Flipkart", "Adobe", "SAP", "Salesforce", "Persistent", "Publicis Sapient"],
  a: `<p><strong>GraphQL always returns HTTP 200</strong>, even for failures. Errors live in the body, and partial data is normal — which is unfamiliar coming from REST.</p>
<pre><code>{
  "data": {
    "order": { "id": "421", "total": 4999, "shipment": null }
  },
  "errors": [{
    "message": "Shipment service unavailable",
    "path": ["order", "shipment"],
    "extensions": { "code": "DOWNSTREAM_UNAVAILABLE", "traceId": "8f2a1c9e" }
  }]
}
// The order still rendered. Only the shipment field failed. That partial
// success is the point of the design — one slow dependency does not fail
// the whole screen.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Null bubbling from a non-null field up to its nearest nullable ancestor">
  <rect class="dg-fill" x="220" y="16" width="170" height="30" rx="6"/><text class="dg-s" x="305" y="36" text-anchor="middle">query (nullable)</text>
  <rect class="dg-fill" x="220" y="62" width="170" height="30" rx="6"/><text class="dg-s" x="305" y="82" text-anchor="middle">order: Order  (nullable)</text>
  <rect class="dg-box" x="220" y="108" width="170" height="30" rx="6"/><text class="dg-s" x="305" y="128" text-anchor="middle">total: Int!  (NON-null)</text>
  <path class="dg-line" d="M305 105 V96" marker-end="url(#gn1)"/>
  <path class="dg-line" d="M305 59 V50" marker-end="url(#gn1)"/>
  <text class="dg-s" x="410" y="128">resolver returns null →</text>
  <text class="dg-s" x="410" y="86">total cannot be null, so the</text>
  <text class="dg-s" x="410" y="104">whole ORDER becomes null</text>
  <text class="dg-s" x="16" y="152">one over-eager "!" can null out an entire response — this is why non-null is used sparingly</text>
  <defs><marker id="gn1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Type</th><th>Meaning</th></tr>
<tr><td><code>[Order]</code></td><td>The list may be null; elements may be null</td></tr>
<tr><td><code>[Order]!</code></td><td>The list is never null; elements may be null</td></tr>
<tr><td><code>[Order!]</code></td><td>The list may be null; elements never are</td></tr>
<tr><td><code>[Order!]!</code></td><td>Neither is null — the usual choice for a collection</td></tr>
</table>
<pre><code># The "errors as data" pattern — model expected failures in the SCHEMA
type Mutation { createOrder(input: CreateOrderInput!): CreateOrderResult! }

union CreateOrderResult = Order | ValidationError | InsufficientStock

type ValidationError  { field: String!, message: String! }
type InsufficientStock { sku: String!, available: Int! }

# The client handles every outcome exhaustively with a fragment per case,
# and the type system guarantees none was forgotten. Reserve the top-level
# "errors" array for UNEXPECTED failures — bugs and outages.</code></pre>
<pre><code>// Spring for GraphQL: map exceptions to typed errors
@Component
public class ErrorAdapter extends DataFetcherExceptionResolverAdapter {
    @Override protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof OrderNotFoundException e) {
            return GraphqlErrorBuilder.newError(env)
                .errorType(ErrorType.NOT_FOUND)
                .message("Order not found")
                .extensions(Map.of("orderId", e.getId()))
                .build();
        }
        return null;   // fall through to the default handler
    }
}</code></pre>
<table>
<tr><th>Rule</th><th>Reason</th></tr>
<tr><td>Be sparing with <code>!</code></td><td>A non-null field that fails nulls its nearest nullable ancestor — the blast radius is bigger than it looks</td></tr>
<tr><td>Expected failures belong in the schema</td><td>Union or interface results make the client handle them exhaustively</td></tr>
<tr><td>Unexpected failures go in <code>errors</code></td><td>With a machine-readable <code>code</code> and a trace id, never a stack trace</td></tr>
<tr><td>Never leak internal details</td><td>Same rule as REST — extensions are visible to the client</td></tr>
<tr><td>Do not distinguish "not found" from "not permitted"</td><td>Otherwise the API confirms which records exist</td></tr>
</table>
<p><strong>The trade-off to state honestly:</strong> "Partial responses are genuinely useful — a dashboard renders what it can when one service is degraded. But they push complexity onto every client, which now has to handle a field being null for a reason. That is why I put predictable failures in the type system and keep the errors array for things nobody planned for."</p>`
}
]);
