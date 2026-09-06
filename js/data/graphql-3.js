appendTopic("graphql", [
{
  q: "How do you handle file uploads and large payloads in GraphQL?",
  level: "advanced", tags: ["design", "integration"],
  a: `<p>GraphQL has no native binary type — it is JSON over HTTP. There are three approaches, and the third is usually correct.</p>
<pre><code># 1. The GraphQL multipart request spec — an Upload scalar
scalar Upload
type Mutation { uploadAvatar(file: Upload!): User! }
# The client sends multipart/form-data with an operations map.
# Works, but: no resumability, the file transits your GraphQL server,
# and it complicates caching, logging and request-size limits.

# 2. Base64 in a variable — never do this for real files
# +33% payload size, the whole file is buffered in memory as a string.

# 3. PRE-SIGNED URLS — the file never touches your API at all
type Mutation {
  requestUploadUrl(filename: String!, contentType: String!, sizeBytes: Int!): UploadTicket!
  confirmUpload(ticketId: ID!): Document!
}
type UploadTicket { ticketId: ID!, uploadUrl: String!, expiresAt: DateTime! }</code></pre>
<pre><code>// The flow with pre-signed URLs
1. mutation requestUploadUrl -&gt; server validates type/size, returns an S3 PUT URL (5 min TTL)
2. client PUTs the bytes DIRECTLY to S3 — no load on your service
3. mutation confirmUpload    -&gt; server verifies the object exists, records metadata</code></pre>
<p><strong>Why pre-signed URLs win:</strong> your GraphQL server never handles the bytes, so it needs no large request limits, no streaming support and no extra memory. Uploads scale with S3 rather than with your pod count, resumable multipart upload is available, and a slow client on a mobile connection cannot occupy a request thread for two minutes.</p>
<p><strong>Security details that matter:</strong> validate the content type and size <em>before</em> issuing the URL and encode them in the signed policy so the client cannot upload something else; give the URL a short expiry; generate your own object key rather than trusting the filename (path traversal); and verify the object actually exists in the confirm step, because a client can request a URL and never use it.</p>
<p><strong>For large <em>responses</em></strong>, mention the <code>@defer</code> and <code>@stream</code> directives — the server sends the fast fields immediately and streams slower or larger sections afterwards, so a heavy field does not delay the whole response.</p>`
},
{
  q: "What is DataLoader batching versus caching, and what are its limits?",
  level: "advanced", tags: ["performance", "dataloader"],
  a: `<p>DataLoader does two distinct things, and conflating them causes bugs.</p>
<ul>
<li><strong>Batching</strong> — collects all keys requested during one event-loop tick and issues a single call. This is what solves N+1.</li>
<li><strong>Caching</strong> — memoises by key <em>within one request</em>, so asking for customer 5 three times in one query hits the data source once.</li>
</ul>
<pre><code>@Bean
public BatchLoaderRegistry.Registration&lt;String, Customer&gt; customerLoader(
        BatchLoaderRegistry registry, CustomerService service) {

    return registry.forTypePair(String.class, Customer.class)
        .registerMappedBatchLoader((ids, env) -&gt;
            Mono.fromCallable(() -&gt; {
                var found = service.findAllById(ids);              // ONE query for all ids
                return found.stream().collect(toMap(Customer::getId, identity()));
            }).subscribeOn(Schedulers.boundedElastic()));
}</code></pre>
<p><strong>The three limits worth knowing:</strong></p>
<ol>
<li><strong>The cache must be per request, never global.</strong> A shared cache would serve one user's data to another and return stale values. Spring for GraphQL scopes it per request by default — do not "optimise" that away.</li>
<li><strong>A mapped batch loader must handle missing keys.</strong> If you request 100 ids and only 97 exist, returning a list of 97 in a <em>list</em>-based loader misaligns every result. Use the <em>mapped</em> variant (key → value) so absent keys resolve to null correctly.</li>
<li><strong>Batching only works within one tick.</strong> If a resolver awaits something before calling <code>loader.load()</code>, the batch window has closed and you are back to N calls. This is the subtle failure — the code looks correct and the query count silently rises.</li>
</ol>
<pre><code>// ✘ The await breaks batching — each resolver dispatches its own batch
const config = await fetchConfig();
return loader.load(order.customerId);

// ✔ Load first, then combine
const customer = loader.load(order.customerId);
return Promise.all([customer, fetchConfig()]).then(([c, cfg]) =&gt; enrich(c, cfg));</code></pre>
<p><strong>How to verify it works:</strong> assert query counts in tests. Fetching 100 orders with their customers should issue 2 queries. A test that fails when it becomes 101 is the only reliable protection against this regressing.</p>`
},
{
  q: "How do you design mutations well in GraphQL?",
  level: "advanced", hot: true, tags: ["schema", "design"],
  a: `<pre><code># ✘ Poor: primitive arguments, no room to evolve, unclear failure
type Mutation {
  updateOrder(id: ID!, status: String, total: Float): Order
}

# ✔ Better: a single input type, a payload type, and typed errors
type Mutation {
  cancelOrder(input: CancelOrderInput!): CancelOrderPayload!
}

input CancelOrderInput {
  orderId: ID!
  reason: CancellationReason!
  clientMutationId: String        # echoed back — lets clients correlate responses
}

type CancelOrderPayload {
  order: Order                     # nullable: absent on failure
  errors: [CancelOrderError!]!     # EXPECTED business failures, typed
  clientMutationId: String
}

union CancelOrderError = OrderAlreadyShippedError | RefundFailedError | NotAuthorizedError

type OrderAlreadyShippedError { message: String!, shippedAt: DateTime! }</code></pre>
<p><strong>The four conventions and why each exists:</strong></p>
<ol>
<li><strong>A single <code>input</code> type</strong> — adding a field is a non-breaking change, and clients can pass a whole variable object rather than restructuring their query.</li>
<li><strong>A dedicated payload type</strong> — you can add fields later (an updated related entity, a new count) without changing the mutation's signature.</li>
<li><strong>Typed errors in the payload, not the top-level <code>errors</code> array.</strong> This is the most valuable convention: expected business failures ("already shipped") become part of the schema, so clients handle them in a type-safe way and cannot forget a case. Reserve the top-level errors array for genuinely exceptional conditions like a crashed resolver.</li>
<li><strong>Name mutations by the business action</strong> — <code>cancelOrder</code>, <code>applyDiscount</code> — not <code>updateOrder</code>. A generic update mutation cannot express which transitions are legal, and pushes the state machine into the client.</li>
</ol>
<p><strong>Two more points:</strong> mutations execute <strong>sequentially</strong> when several appear in one document (queries run in parallel), but GraphQL has no transaction concept — if the second fails, the first is not rolled back, so multi-step operations belong in a single mutation backed by one database transaction. And return the mutated entity in the payload so clients can update their normalised cache without a follow-up query.</p>`
},
{
  q: "How do you migrate an existing REST API to GraphQL incrementally?",
  level: "advanced", tags: ["migration", "architecture"],
  a: `<p>A big-bang rewrite is the wrong shape here. The incremental approach is a strangler fig with GraphQL at the edge.</p>
<ol>
<li><strong>Add GraphQL alongside REST</strong> — same application, a new <code>/graphql</code> endpoint. Nothing existing changes, and REST keeps serving every current consumer.</li>
<li><strong>Start with one high-value read path</strong> — typically a screen that currently makes four or five REST calls, because the benefit is immediately measurable in latency and payload size.</li>
<li><strong>Resolvers call the existing service layer</strong>, not new code. The GraphQL layer is a <em>view</em> over logic you already have and already trust.
<pre><code>@QueryMapping
public Order order(@Argument String id) {
    return orderService.findById(id);        // the SAME service the REST controller uses
}</code></pre></li>
<li><strong>Add batching from the first day.</strong> Retrofitting DataLoader after the graph has grown is far more painful than starting with it.</li>
<li><strong>Migrate one client screen at a time</strong>, measuring request count and payload size before and after so the benefit is evidenced rather than asserted.</li>
<li><strong>Keep REST for what it does better</strong> — file upload and download, webhooks, third-party integrations, and anything that benefits from HTTP caching and CDN.</li>
</ol>
<p><strong>The design discipline that decides whether this succeeds:</strong> do <em>not</em> mirror your REST endpoints in the schema. If <code>Query.getOrderList</code> and <code>Query.getOrderById</code> appear, you have added a layer without adding value. Model the graph the way clients think about the domain — <code>order.customer.orders</code> — and let the resolvers map that onto whatever services exist behind it.</p>
<p><strong>What to warn about:</strong> a GraphQL layer in front of REST services multiplies calls unless batching is in place, so one client query can become fifty downstream HTTP requests. You also need per-downstream timeouts and circuit breakers so a slow service degrades one field rather than the whole response — that is where the GraphQL-to-REST proxy pattern either works well or becomes a reliability problem.</p>`
}
]);
