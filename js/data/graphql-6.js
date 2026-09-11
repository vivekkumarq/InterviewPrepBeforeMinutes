appendTopic("graphql", [
{
  q: "What is federation, and how do you run GraphQL across many teams?",
  level: "advanced", tags: ["federation", "architecture", "graphql"],
  companies: ["Amazon", "Flipkart", "Adobe", "Walmart", "SAP", "Salesforce", "Swiggy"],
  a: `<p>A single monolithic schema owned by one team becomes the bottleneck every other team queues behind. <strong>Federation</strong> lets each service own its slice, and a gateway composes them into one graph.</p>
<pre><code># Orders service owns Order, and EXTENDS User with its own fields
type Order @key(fields: "id") {
  id: ID!
  total: Money!
  customer: User!
}

extend type User @key(fields: "id") {
  id: ID! @external            # owned by the Users service
  orders: [Order!]!            # contributed by THIS service
}

# Users service owns the rest of User
type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Federated gateway composing subgraphs into one schema">
  <rect class="dg-box" x="16" y="58" width="86" height="34" rx="6"/><text class="dg-s" x="59" y="80" text-anchor="middle">client</text>
  <path class="dg-line" d="M106 75 H156" marker-end="url(#gf1)"/>
  <rect class="dg-fill2" x="160" y="50" width="130" height="50" rx="9"/>
  <text class="dg-s" x="225" y="70" text-anchor="middle">gateway</text><text class="dg-s" x="225" y="88" text-anchor="middle">one schema</text>
  <path class="dg-line" d="M294 62 L352 32 M294 75 H352 M294 88 L352 118" marker-end="url(#gf1)"/>
  <rect class="dg-fill" x="356" y="18" width="150" height="28" rx="6"/><text class="dg-s" x="431" y="37" text-anchor="middle">Users subgraph</text>
  <rect class="dg-fill" x="356" y="61" width="150" height="28" rx="6"/><text class="dg-s" x="431" y="80" text-anchor="middle">Orders subgraph</text>
  <rect class="dg-fill" x="356" y="104" width="150" height="28" rx="6"/><text class="dg-s" x="431" y="123" text-anchor="middle">Catalog subgraph</text>
  <text class="dg-s" x="16" y="30">each team owns and deploys its own subgraph independently</text>
  <defs><marker id="gf1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Directive</th><th>Means</th></tr>
<tr><td><code>@key(fields: "id")</code></td><td>How this entity is identified across subgraphs</td></tr>
<tr><td><code>@external</code></td><td>The field is defined elsewhere; I only reference it</td></tr>
<tr><td><code>@requires</code></td><td>I need these fields from another subgraph to resolve mine</td></tr>
<tr><td><code>@provides</code></td><td>I can supply this field without a second hop</td></tr>
<tr><td><code>@shareable</code></td><td>Several subgraphs may resolve this field</td></tr>
</table>
<table>
<tr><th>Alternative</th><th>Trade-off</th></tr>
<tr><td><strong>Federation</strong></td><td>True team autonomy; needs schema-composition checks in CI or the gateway breaks</td></tr>
<tr><td>Schema stitching</td><td>Older, gateway-side glue — the gateway team owns the joins, so the bottleneck returns</td></tr>
<tr><td>BFF per client</td><td>Simpler and often enough — one backend per frontend, no federation machinery</td></tr>
<tr><td>One monolithic graph</td><td>Simplest to operate; fine until several teams contend for it</td></tr>
</table>
<p><strong>What goes wrong in practice:</strong> a subgraph deploy that removes a field breaks the composed schema — so composition checks must run in CI, not at deploy. Tracing gets harder because one query fans out to many services. And an N+1 across subgraph boundaries is worse than a local one, since each hop is a network call — which is exactly what <code>@provides</code> and entity batching exist to reduce.</p>
<p><strong>The judgement to show:</strong> "Federation solves an organisational problem — several teams contributing to one graph. With two or three services I would use a BFF instead; the gateway, the composition pipeline and the extra operational surface are not free."</p>`
},
{
  q: "How do you cache and paginate a GraphQL API?",
  level: "advanced", tags: ["caching", "pagination", "performance", "graphql"],
  companies: ["Amazon", "Flipkart", "Adobe", "SAP", "Walmart", "Persistent", "Publicis Sapient"],
  a: `<p><strong>Why HTTP caching does not work:</strong> every GraphQL request is a <code>POST</code> to one URL with the query in the body. CDNs and browsers cache by URL and method, so there is nothing to key on — you lose the caching REST gets for free.</p>
<table>
<tr><th>Layer</th><th>Approach</th></tr>
<tr><td>CDN / HTTP</td><td><strong>Persisted queries over GET</strong> — the query hash becomes the URL, so it is cacheable again</td></tr>
<tr><td>Client</td><td>Normalised cache (Apollo, Relay, urql) keyed by <code>__typename</code> + <code>id</code></td></tr>
<tr><td>Server, per request</td><td><strong>DataLoader</strong> — batch and dedupe within one query</td></tr>
<tr><td>Server, cross request</td><td>Redis or Caffeine at the <em>resolver</em> or repository level</td></tr>
<tr><td>Field level</td><td><code>@cacheControl(maxAge:)</code> — the response's cache hint is the minimum across all fields</td></tr>
</table>
<pre><code>// Always expose a stable global id, or the client cache cannot normalise
type Order implements Node {
  id: ID!          # globally unique, e.g. base64("Order:42")
  status: String!
}
// Two queries returning the same Order then update ONE cache entry, and
// every screen showing it re-renders consistently.</code></pre>
<pre><code># CURSOR CONNECTIONS — the Relay spec, and the de-facto standard
type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int          # optional: it can be the most expensive field
}
type OrderEdge { node: Order!, cursor: String! }
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

query { orders(first: 20, after: "eyJpZCI6NDIxfQ==") { edges { node { id } } } }</code></pre>
<table>
<tr><th>Why connections rather than <code>limit/offset</code></th></tr>
<tr><td>Stable under concurrent inserts — offset pagination repeats and skips rows</td></tr>
<tr><td>Constant cost at any depth; <code>OFFSET 100000</code> is not</td></tr>
<tr><td>The <code>edges</code> wrapper gives somewhere to put per-edge metadata later</td></tr>
<tr><td>Cursors are opaque, so the sort key can change without breaking clients</td></tr>
</table>
<pre><code>// Bound it, or one query can ask for everything
@Bean Instrumentation limits() {
    return new ChainedInstrumentation(List.of(
        new MaxQueryDepthInstrumentation(10),
        new MaxQueryComplexityInstrumentation(1000)));
}
// And cap 'first': reject first > 100 in the resolver. A nested connection
// with first:1000 at three levels is a billion rows.</code></pre>
<p><strong>The point to make:</strong> "GraphQL moves work from the server to the client, and caching is the bill for that. Persisted queries are the single highest-value fix — they restore CDN caching, shrink requests, and as a side effect stop arbitrary queries entirely, which is also the strongest security control available."</p>`
}
]);
