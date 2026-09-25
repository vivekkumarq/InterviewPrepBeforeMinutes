registerPrimer("graphql", `<h3>The mental model: one endpoint, a typed graph, and the client picks the shape</h3>
<p>With REST the server decides what each URL returns, so a screen that needs a user, their orders and each order's items may take several calls and still receive fields it never shows. GraphQL flips that. The server publishes a <strong>schema</strong>: a typed map of everything that can be asked for and how types connect. The client sends one <strong>query</strong> that describes exactly the shape it wants, and gets back JSON in exactly that shape.</p>
<p>On the server, every field is filled by a <strong>resolver</strong>: a function that knows how to fetch that one field. The engine walks the query like a tree and calls resolvers level by level.</p>
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
<h3>Worked example: schema, resolvers and the response</h3>
<pre><code># schema.graphqls
type Query {
  user(id: ID!): User                 # nullable: the user may not exist
}
type User {
  id: ID!
  name: String!
  orders(last: Int = 10): [Order!]!   # a list that is never null, of orders never null
}
type Order {
  id: ID!
  total: Float!
  items: [Item!]!
}
type Item { title: String! }</code></pre>
<pre><code>// Spring for GraphQL: method names match the schema fields
@Controller
class UserGraph {
    @QueryMapping
    User user(@Argument String id) { return users.find(id); }

    @SchemaMapping                                   // resolves User.orders
    List&lt;Order&gt; orders(User user, @Argument int last) {
        return orders.lastForUser(user.id(), last);
    }

    @BatchMapping                                    // resolves Order.items for ALL
    Map&lt;Order, List&lt;Item&gt;&gt; items(List&lt;Order&gt; orders) {   // orders in ONE call
        return items.forOrders(orders);              // -&gt; no N+1
    }
}</code></pre>
<pre><code>{
  "data": {
    "user": {
      "name": "Asha",
      "orders": [
        { "total": 598.0, "items": [ { "title": "Clean Code" } ] },
        { "total": 120.0, "items": [ { "title": "Pens" }, { "title": "Notebook" } ] }
      ]
    }
  }
}</code></pre>
<h3>What changes compared with REST</h3>
<table>
<tr><th>Concern</th><th>REST</th><th>GraphQL</th></tr>
<tr><td>Endpoints</td><td>Many URLs</td><td>One, usually <code>POST /graphql</code></td></tr>
<tr><td>Response shape</td><td>Fixed by the server</td><td>Chosen by the client, per query</td></tr>
<tr><td>Errors</td><td>HTTP status codes</td><td>Usually 200 with an <code>errors</code> array; partial data is possible</td></tr>
<tr><td>HTTP caching</td><td>Works out of the box</td><td>Needs persisted queries or client-side caches</td></tr>
<tr><td>Evolving</td><td>Versions (<code>/v2</code>)</td><td>Add fields freely; mark old ones <code>@deprecated</code></td></tr>
<tr><td>Main risk</td><td>Over- and under-fetching</td><td>Expensive queries and N+1 in resolvers</td></tr>
</table>`);

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
