appendTopic("graphql", [
{
  q: "Why did your team choose GraphQL over REST, and what did it cost you?",
  level: "advanced", hot: true, tags: ["architecture", "trade-offs"],
  companies: ["Amazon", "Flipkart", "Swiggy", "Meesho", "Adobe", "Salesforce"],
  a: `<p>Interviewers ask this to check whether you adopted GraphQL for a reason or because it was fashionable. Answer with the specific problem, then the specific cost.</p>
<p><strong>The problem it solved:</strong></p>
<pre><code># Before: one mobile home screen needed five sequential REST calls
GET /customers/42            -&gt; 180ms
GET /customers/42/orders     -&gt; 160ms   (needs the id from call 1)
GET /orders/{id}/items       -&gt; 140ms   x N orders
GET /products/{sku}          -&gt; 120ms   x N items
GET /offers?customer=42      -&gt; 150ms
# ~800ms of latency, most of it round trips, and 60KB of fields the screen never renders.

# After: one query, one round trip, exactly the fields the screen shows
query HomeScreen { customer(id:"42") { name orders(last:5) { total items { sku } } } }</code></pre>
<p><strong>What it cost — be specific, this is the half that impresses:</strong></p>
<ul>
<li><strong>N+1 became the default.</strong> Every nested resolver fires per parent object. Without DataLoader on day one, the GraphQL layer was <em>slower</em> than the REST it replaced. Batching is not an optimisation here, it is a prerequisite.</li>
<li><strong>We lost HTTP caching.</strong> Everything is a POST to one URL, so CDN and browser caching stopped working. We replaced it with client-side normalised caching and per-resolver caching — both of which we had to build and reason about.</li>
<li><strong>Unbounded query cost.</strong> A client can compose a query nobody anticipated. We had to add depth limiting, complexity analysis and eventually persisted queries.</li>
<li><strong>Monitoring needed rework.</strong> Every request is <code>POST /graphql</code> returning 200, so per-endpoint dashboards became meaningless until we tagged metrics by operation name.</li>
<li><strong>Error handling is non-standard</strong> — a 200 response can be entirely errors, so alerting had to read the <code>errors</code> array rather than the status code.</li>
</ul>
<p><strong>The honest conclusion to give:</strong> "It was the right call for a mobile client with genuinely different data needs from the web app. I would <em>not</em> introduce it for a single frontend consuming a CRUD service — the over-fetching problem there is solved by a well-designed REST endpoint, without taking on schema governance and query-cost analysis as permanent responsibilities."</p>`
},
{
  q: "How do you handle authorization at the field level with performance in mind?",
  level: "advanced", tags: ["security", "performance"],
  companies: ["Amazon", "Salesforce", "SAP", "Adobe", "Optum"],
  a: `<pre><code>// The naive approach — correct but slow
@SchemaMapping(typeName = "Customer", field = "email")
@PreAuthorize("hasRole('ADMIN') or #customer.id == authentication.name")
public String email(Customer customer) { return customer.getEmail(); }
// This resolver runs ONCE PER CUSTOMER. Fetch 200 customers and the permission
// check — often a database or policy-service call — runs 200 times.</code></pre>
<pre><code>// Fix 1: cache the decision PER REQUEST
@Component
@RequestScope                                   // one instance per GraphQL request
public class PermissionCache {
    private final Map&lt;String, Boolean&gt; decisions = new HashMap&lt;&gt;();

    public boolean can(String permission, String resourceId) {
        return decisions.computeIfAbsent(permission + ":" + resourceId,
                                         k -&gt; policyService.check(permission, resourceId));
    }
}

// Fix 2: authorise the whole BATCH, not each field
registry.forTypePair(String.class, Customer.class)
    .registerMappedBatchLoader((ids, env) -&gt; Mono.fromCallable(() -&gt; {
        var principal = env.getKeyContext();
        var allowed = policyService.filterVisible(ids, principal);   // ONE call for all ids
        return customerService.findAllById(allowed).stream()
                .collect(toMap(Customer::getId, identity()));
    }));

// Fix 3: push the filter into the QUERY rather than filtering after loading
@QueryMapping
public List&lt;Order&gt; orders(@AuthenticationPrincipal Jwt jwt) {
    return repo.findByTenantId(jwt.getClaim("tenant"));   // the database enforces it
}</code></pre>
<p><strong>The structural point:</strong> GraphQL's flexibility means a client can reach sensitive data through a path you never designed — <code>order → customer → orders → customer → ssn</code>. So authorization must live <strong>at the field or resolver level</strong>, not only at the entry point. But applying it naively multiplies the cost by the result-set size.</p>
<p><strong>The three techniques in order of preference:</strong> push filtering into the data source so unauthorised rows are never loaded; authorise per batch inside the DataLoader; and cache decisions per request for anything left over.</p>
<p><strong>The error-shape detail:</strong> when a field is denied, return <code>null</code> with an entry in the <code>errors</code> array rather than a message naming the resource — "not authorised to view order 42" confirms order 42 exists. And remember that a denied <strong>non-nullable</strong> field nulls its entire parent object through null propagation, so mark sensitive fields nullable in the schema.</p>`
},
{
  q: "How do you migrate a GraphQL schema without breaking mobile clients?",
  level: "advanced", tags: ["schema", "migration"],
  companies: ["Flipkart", "Swiggy", "Zomato", "Meesho", "Adobe", "Salesforce"],
  a: `<p>Mobile is the hard case: old app versions live on user devices for <em>years</em> and you cannot force an upgrade. The schema must stay compatible far longer than for a web client.</p>
<pre><code>type Order {
  # Old field — kept, deprecated, and MEASURED
  total: Float! @deprecated(reason: "Use totalAmount; removal after 2027-06-01")

  # New field alongside it
  totalAmount: Money!
}
type Money { value: String!, currency: String! }   # String, not Float — no precision loss</code></pre>
<table>
<tr><th>Change</th><th>Safe?</th></tr>
<tr><td>Add a field or type</td><td>✔ Always</td></tr>
<tr><td>Add an <em>optional</em> argument</td><td>✔</td></tr>
<tr><td>Make a nullable output field non-null</td><td>✔ for clients</td></tr>
<tr><td>Add a <em>required</em> argument</td><td>✘ Breaking</td></tr>
<tr><td>Remove or rename a field</td><td>✘ Breaking</td></tr>
<tr><td>Change a field's type</td><td>✘ Breaking</td></tr>
<tr><td>Make a non-null field nullable</td><td>✘ Clients assumed a value</td></tr>
<tr><td>Add an enum value</td><td>⚠ Clients may switch exhaustively</td></tr>
</table>
<pre><code># The control that makes this work: FIELD-LEVEL USAGE METRICS
# Instrument every resolver, tagged by client and app version.
graphql.field.usage{field="Order.total", client="android", version="4.2.1"} 18432
graphql.field.usage{field="Order.total", client="android", version="4.8.0"} 0

# Now removal is a data-driven decision, not a guess.

# And enforce it in CI so a breaking change fails the build
rover subgraph check acme@prod --schema ./schema.graphqls
graphql-inspector diff schema-main.graphql schema-pr.graphql</code></pre>
<p><strong>The enum problem deserves emphasis</strong> because it catches people: adding <code>REFUNDED</code> to <code>OrderStatus</code> is additive in the schema but breaks a client whose switch has no default branch — it crashes on an unknown value. The mitigation is to document from day one that clients must handle unknown enum values, and to introduce genuinely new states as a separate nullable field first.</p>
<p><strong>The mobile-specific safety net:</strong> a minimum-supported-version check. When an app version predates a change you must make, the API returns a "please update" response rather than a broken screen. That gives you a bounded compatibility window instead of an unbounded one.</p>`
},
{
  q: "What is the N+1 problem in GraphQL and how is it different from ORM N+1?",
  level: "advanced", hot: true, tags: ["performance", "dataloader"],
  companies: ["Amazon", "Flipkart", "Adobe", "SAP", "Swiggy"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="GraphQL resolver N plus one versus DataLoader batching">
  <text class="dg-t" x="150" y="16" text-anchor="middle">Without DataLoader</text>
  <rect class="dg-fill" x="30" y="28" width="120" height="26" rx="5"/><text class="dg-s" x="90" y="46" text-anchor="middle">orders(first:100)</text>
  <path class="dg-line" d="M90 58 V72"/>
  <text class="dg-s" x="90" y="88" text-anchor="middle">Order.customer resolver</text>
  <path class="dg-line" d="M40 96 V112 M90 96 V112 M140 96 V112" marker-end="url(#dl1)"/>
  <rect class="dg-box" x="20" y="114" width="40" height="22" rx="4"/><text class="dg-s" x="40" y="130" text-anchor="middle">q1</text>
  <rect class="dg-box" x="70" y="114" width="40" height="22" rx="4"/><text class="dg-s" x="90" y="130" text-anchor="middle">q2</text>
  <rect class="dg-box" x="120" y="114" width="60" height="22" rx="4"/><text class="dg-s" x="150" y="130" text-anchor="middle">… q100</text>
  <text class="dg-s" x="105" y="156" text-anchor="middle">101 queries</text>
  <text class="dg-t" x="450" y="16" text-anchor="middle">With DataLoader</text>
  <rect class="dg-fill" x="330" y="28" width="120" height="26" rx="5"/><text class="dg-s" x="390" y="46" text-anchor="middle">orders(first:100)</text>
  <path class="dg-line" d="M390 58 V72"/>
  <text class="dg-s" x="400" y="88" text-anchor="middle">loader.load(id) × 100 — QUEUED</text>
  <path class="dg-line" d="M400 96 V112" marker-end="url(#dl1)"/>
  <rect class="dg-fill2" x="330" y="114" width="180" height="22" rx="4"/>
  <text class="dg-s" x="420" y="130" text-anchor="middle">WHERE id IN (…100 ids)</text>
  <text class="dg-s" x="420" y="156" text-anchor="middle">2 queries</text>
  <defs><marker id="dl1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th></th><th>ORM N+1</th><th>GraphQL N+1</th></tr>
<tr><td>Cause</td><td>Lazy association accessed in a loop</td><td>A nested resolver invoked per parent</td></tr>
<tr><td>Visible in code?</td><td>Yes — you can see the loop</td><td><strong>No</strong> — the client's query shape decides it</td></tr>
<tr><td>Predictable?</td><td>Yes, per method</td><td>No — depends on what the client asks for</td></tr>
<tr><td>Fix</td><td><code>JOIN FETCH</code>, entity graph</td><td>DataLoader batching</td></tr>
<tr><td>Can amplify across</td><td>One database</td><td>Several downstream <em>services</em></td></tr>
</table>
<p><strong>Why the GraphQL version is harder:</strong> with an ORM you can read a method and see the loop. In GraphQL the resolver looks perfectly innocent — it fetches <em>one</em> customer. Whether it runs once or ten thousand times is decided by a query the client writes, possibly months after you shipped the resolver.</p>
<p><strong>And it compounds:</strong> in a GraphQL-over-microservices gateway, each of those N calls is an HTTP request to another service — so one client query becomes a request storm against your whole estate, not just extra database round trips.</p>
<pre><code>// The fix, plus the test that stops it regressing
@Test
void fetchingOrdersWithCustomersIssuesTwoQueries() {
    SQLStatementCountValidator.reset();
    tester.document("{ orders(first:100) { customer { name } } }").execute();
    SQLStatementCountValidator.assertSelectCount(2);   // fails the build if batching breaks
}</code></pre>
<p><strong>The additional GraphQL-only defences:</strong> query <em>complexity</em> analysis and depth limiting, because unlike an ORM you cannot bound the work by reading your own code — the cost is a function of the incoming query, so it must be measured and capped at request time.</p>`
}
]);
