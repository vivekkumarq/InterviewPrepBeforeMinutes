registerPrimer("graphql", `<p class="pr-lead"><b>GraphQL</b> is another way to build an API. With REST, the server decides what each URL returns. With GraphQL, there is one endpoint, and <b>the client describes exactly the data it wants</b>, in one request, and gets back exactly that shape. Nothing missing, nothing extra.</p>
<div class="pr-analogy"><b>Think of it like this</b>A REST API is like a set menu: each dish (URL) comes with fixed sides, and to get a full meal you may need to order several dishes. GraphQL is like ordering à la carte: you write down exactly what you want on one order slip ("the customer's name, their last two orders, and the item titles"), and the kitchen brings exactly that on one plate.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Schema</dt><dd>A description of all the data the API offers and how it connects, such as "a User has a name and a list of Orders".</dd>
<dt>Type</dt><dd>One kind of object in the schema, such as User or Order, with its fields.</dd>
<dt>Query</dt><dd>A request to read data, written in GraphQL's own simple syntax.</dd>
<dt>Mutation</dt><dd>A request that changes data, like creating an order.</dd>
<dt>Subscription</dt><dd>A request to receive live updates as they happen.</dd>
<dt>Resolver</dt><dd>A function on the server that fetches the value for one field.</dd>
<dt>Over-fetching / under-fetching</dt><dd>Getting more data than you need, or too little so you must make more calls. GraphQL solves both.</dd>
</dl>

<h3>Step by step: how one GraphQL request works</h3>
<ol class="pr-steps">
<li>The client sends one query to <code>/graphql</code>, describing the exact shape it wants.</li>
<li>The server checks the query against the schema: do these fields exist, are the types right?</li>
<li>It runs the query level by level, like walking down a tree: first the user, then that user's orders, then each order's items.</li>
<li>For every field, a resolver fetches the value from a database or another service.</li>
<li>The server returns JSON shaped exactly like the query, usually with status 200 even when some parts fail; errors are listed separately in the body.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 228" role="img" aria-label="A GraphQL query tree resolved level by level: user, then orders, then items, each by its own resolver">
  <defs><marker id="pr-gql" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="14" width="200" height="200" rx="10"/>
  <text class="dg-t" x="22" y="34">Query sent by the client</text>
  <text class="dg-m" x="22" y="60">{</text>
  <text class="dg-m" x="34" y="78">user(id: 7) {</text>
  <text class="dg-m" x="48" y="96">name</text>
  <text class="dg-m" x="48" y="114">orders(last: 2) {</text>
  <text class="dg-m" x="62" y="132">total</text>
  <text class="dg-m" x="62" y="150">items { title }</text>
  <text class="dg-m" x="48" y="168">}</text>
  <text class="dg-m" x="34" y="186">}</text>
  <text class="dg-m" x="22" y="204">}</text>
  <line class="dg-line" x1="210" y1="114" x2="236" y2="114" marker-end="url(#pr-gql)"/>
  <rect class="dg-fill" x="238" y="30" width="150" height="42" rx="8"/>
  <text class="dg-t" x="313" y="48" text-anchor="middle">Query.user</text>
  <text class="dg-s" x="313" y="63" text-anchor="middle">1 call: load user 7</text>
  <line class="dg-line" x1="313" y1="72" x2="313" y2="96" marker-end="url(#pr-gql)"/>
  <rect class="dg-fill2" x="238" y="98" width="150" height="42" rx="8"/>
  <text class="dg-t" x="313" y="116" text-anchor="middle">User.orders</text>
  <text class="dg-s" x="313" y="131" text-anchor="middle">1 call: 2 orders</text>
  <line class="dg-line" x1="313" y1="140" x2="313" y2="164" marker-end="url(#pr-gql)"/>
  <rect class="dg-fill" x="238" y="166" width="150" height="42" rx="8"/>
  <text class="dg-t" x="313" y="184" text-anchor="middle">Order.items</text>
  <text class="dg-s" x="313" y="199" text-anchor="middle">once PER order (N+1!)</text>
  <text class="dg-s" x="404" y="50">name: a plain property,</text>
  <text class="dg-s" x="404" y="66">no resolver needed</text>
  <text class="dg-s" x="404" y="118">the response mirrors</text>
  <text class="dg-s" x="404" y="134">the query's shape exactly</text>
  <text class="dg-s" x="404" y="186">batch these with DataLoader</text>
  <text class="dg-s" x="404" y="202">or @BatchMapping</text>
</svg>
<figcaption>The engine resolves one level at a time. A field on a list runs once per element, which is where N+1 comes from.</figcaption>
</figure>

<h3>A worked example: one request instead of three</h3>
<pre><code># The client's query
{
  user(id: 7) {
    name
    orders(last: 2) {
      total
      items { title }
    }
  }
}

# The response: exactly the shape that was asked for
{
  "data": {
    "user": {
      "name": "Asha",
      "orders": [
        { "total": 598.0, "items": [ { "title": "Clean Code" } ] },
        { "total": 120.0, "items": [ { "title": "Pens" } ] }
      ]
    }
  }
}</code></pre>
<ol class="pr-steps">
<li>With REST, this screen might need three calls: the user, then their orders, then each order's items.</li>
<li>With GraphQL it is one request, and only the fields actually shown (name, total, title) are returned.</li>
<li>On the server, separate resolvers fetch the user, the user's orders and each order's items.</li>
<li>If the items resolver runs once per order, it causes many database queries (the "N+1" problem). Batching them into one call, for example with DataLoader or <code>@BatchMapping</code>, fixes it.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Ignoring the N+1 problem in resolvers</p>
<p>A resolver that loads data for one parent at a time runs one database query for every item in a list. A list of 100 orders can trigger 101 queries.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> batch the loading so all children are fetched in one call (DataLoader, or <code>@BatchMapping</code> in Spring).</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Letting clients send any query, however big</p>
<p>Clients can nest queries very deeply or ask for huge lists, accidentally or on purpose, and overload your server.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> limit query depth and size, cap list lengths, and in production allow only known, approved queries.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Checking only the HTTP status code</p>
<p>GraphQL usually returns 200 even when parts of the query failed. The errors are inside the response body.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> always check the <code>errors</code> list in the response, in your app and in your tests.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>GraphQL has one endpoint, and the client chooses exactly what data it gets.</li>
<li>The schema describes everything that can be asked for.</li>
<li>Queries read, mutations change, subscriptions stream live updates.</li>
<li>Each field is filled by a resolver; batch them to avoid N+1 queries.</li>
<li>Protect the server with limits on query depth and size.</li>
</ul>
<p><b>Next:</b> the questions below cover schema design, errors, security, caching, pagination and federation.</p>`);

appendTopic("graphql", [
{
  q: "Design a GraphQL schema for a product catalogue from scratch",
  level: "advanced", hot: true, tags: ["schema-design", "nullability", "pagination", "mutations", "must-know"],
  companies: ["Shopify", "Meta", "Atlassian", "Amazon", "Flipkart", "Myntra", "Airbnb"],
  a: `<p>Schema design is where GraphQL projects succeed or fail, because a published schema is hard to change once mobile apps depend on it. Walk through the decisions, not only the final SDL.</p>
<pre><code>type Query {
  product(id: ID!): Product                               # null = not found
  products(filter: ProductFilter, first: Int = 20, after: String): ProductConnection!
  category(slug: String!): Category
}

type Product {
  id: ID!
  name: String!
  description: String                                     # optional content: nullable
  price: Money!
  images: [Image!]!                                       # empty list, never null
  category: Category!
  variants: [Variant!]!
  averageRating: Float                                    # null when there are no reviews
  reviews(first: Int = 10, after: String): ReviewConnection!
}

type Money {                                              # never a bare Float for money
  amount: String!                                         # "499.00": no binary rounding
  currency: String!                                       # "INR"
}

type Variant { id: ID!  sku: String!  size: String  colour: String  inStock: Boolean! }
type Image   { url: String!  alt: String! }
type Category { id: ID!  slug: String!  name: String!  parent: Category }

input ProductFilter {
  categorySlug: String
  priceMin: Int
  priceMax: Int
  inStockOnly: Boolean = false
  search: String
}</code></pre>
<p><strong>Pagination follows the Connection pattern</strong> (from the Relay spec), which most GraphQL clients understand out of the box:</p>
<pre><code>type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int                     # nullable: may be too expensive to compute
}
type ProductEdge { node: Product!  cursor: String! }
type PageInfo { hasNextPage: Boolean!  endCursor: String }</code></pre>
<p><strong>Mutations take one input and return a payload type</strong>, so you can add fields to either side later without breaking clients:</p>
<pre><code>type Mutation {
  addToCart(input: AddToCartInput!): AddToCartPayload!
}
input AddToCartInput { variantId: ID!  quantity: Int! }

type AddToCartPayload {
  cart: Cart                          # the updated cart, so the UI refreshes in one trip
  userErrors: [UserError!]!           # EXPECTED failures are data, not exceptions
}
type UserError { field: [String!]  message: String!  code: UserErrorCode! }
enum UserErrorCode { OUT_OF_STOCK  QUANTITY_TOO_HIGH  VARIANT_NOT_FOUND }</code></pre>
<table>
<tr><th>Decision</th><th>Choice</th><th>Reason</th></tr>
<tr><td>Nullability</td><td>Non-null only when it truly can never be missing</td><td>If a non-null field fails, the null bubbles up and wipes out its parent. Nullable fields fail locally</td></tr>
<tr><td>Lists</td><td><code>[Item!]!</code></td><td>Clients never have to check for a null list or null elements</td></tr>
<tr><td>Money</td><td>An object with a decimal string and currency</td><td>Float loses precision; a bare number has no currency</td></tr>
<tr><td>Pagination</td><td>Cursor connections</td><td>Stable under inserts; clients support it natively</td></tr>
<tr><td>Mutation shape</td><td>Single input, payload with <code>userErrors</code></td><td>Evolvable, and "out of stock" is a normal outcome, not a server error</td></tr>
<tr><td>IDs</td><td>Opaque <code>ID</code> strings</td><td>Lets you change the backing key later without a schema change</td></tr>
<tr><td>Naming</td><td>Domain words (<code>addToCart</code>), not table names</td><td>The schema is a product API, not a view of the database</td></tr>
</table>
<p><strong>What to design against:</strong> a query like <code>categories { products(first: 100) { reviews(first: 100) { author { orders { ... } } } } }</code> can ask for millions of objects. Cap <code>first</code> at a maximum, limit query depth, and assign a cost to list fields so the server can reject a query before running it.</p>
<p><strong>The principle to say out loud:</strong> "Design the schema from what the screens need, not from the database tables. Additive changes are free in GraphQL; removals are expensive. So start small, make fields nullable where failure is possible, and add fields as clients ask for them."</p>`
},
{
  q: "What are persisted queries, and why do production GraphQL APIs use them?",
  level: "advanced", tags: ["persisted-queries", "security", "caching", "performance"],
  companies: ["Meta", "Shopify", "Netflix", "Airbnb", "Atlassian", "Expedia"],
  a: `<p>In plain GraphQL the client sends the full query text with every request. That has three costs: large request bodies, no HTTP caching (it is a POST with a body), and a server that must be ready to execute <strong>any</strong> query anyone can type, including deliberately expensive ones. Persisted queries solve all three.</p>
<p><strong>The idea:</strong> query texts are registered ahead of time and identified by a hash. The client sends only the hash and the variables.</p>
<pre><code>// Without: the whole query, every time (often several KB)
POST /graphql
{ "query": "query ProductPage($id: ID!) { product(id: $id) { name price { amount currency } images { url alt } variants { sku inStock } reviews(first: 5) { ... } } }",
  "variables": { "id": "p-42" } }

// With a persisted query: just the SHA-256 hash of that text (shortened here)
GET /graphql?extensions={"persistedQuery":{"version":1,"sha256Hash":"ecf4edb4…6b38"}}&amp;variables={"id":"p-42"}
// A GET: CDNs and browsers can now cache the response like any REST call.</code></pre>
<table>
<tr><th>Flavour</th><th>How it works</th><th>Gives you</th></tr>
<tr><td><strong>Automatic</strong> persisted queries (APQ)</td><td>Client sends the hash. If the server does not know it, it replies "not found", the client resends with the full text once, and the server stores it</td><td>Smaller requests and GET caching. <strong>No</strong> security: any query can still be registered</td></tr>
<tr><td><strong>Trusted documents</strong> (an allow-list)</td><td>Queries are extracted from the app's code at <em>build time</em> and uploaded. The server executes only hashes on the list</td><td>All of the above, plus: arbitrary queries are rejected outright</td></tr>
</table>
<pre><code>Build pipeline for trusted documents:

  1. The mobile/web build extracts every query from the source code
  2. Computes the hash of each, writes a manifest  { hash: query text }
  3. Uploads the manifest to the GraphQL server (or gateway) before release
  4. In production, the server runs ONLY hashes it has in the manifest.
     Anything else -&gt; rejected before parsing.</code></pre>
<p><strong>Why the allow-list matters for security:</strong> depth limits and cost analysis try to guess whether an unknown query is dangerous. An allow-list removes the question: the only queries that can run are the ones your own apps contain, and each was reviewed and load-tested. Introspection abuse, batch attacks, and deeply nested queries simply fail.</p>
<table>
<tr><th>Trade-off</th><th>Detail</th></tr>
<tr><td>Deploy coupling</td><td>A new app version's queries must be registered <em>before</em> that version is released, and old versions' queries kept until those apps are gone</td></tr>
<tr><td>Public APIs</td><td>An allow-list does not fit an API where third parties write their own queries. Use cost limits and rate limits there instead</td></tr>
<tr><td>Debugging</td><td>Logs show hashes; keep the manifest searchable so you can see what a hash means</td></tr>
</table>
<p><strong>The answer in short:</strong> "Persisted queries replace the query text with a hash. Automatic ones shrink payloads and enable GET caching. Trusted documents also turn the API into an allow-list of the app's own queries, which is the strongest protection there is for a first-party GraphQL API."</p>`
}
]);
