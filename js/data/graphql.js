registerTopic("graphql", [
{
  q: "What is GraphQL and what problems does it solve?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>GraphQL is a query language and runtime for APIs. The client sends a query describing exactly the data it wants, and the server returns exactly that shape.</p>
<p><strong>The two problems it solves:</strong></p>
<ul>
<li><strong>Over-fetching</strong> — <code>GET /users/1</code> returns 40 fields when the mobile screen needs 3.</li>
<li><strong>Under-fetching</strong> — the client makes 5 sequential REST calls to build one screen (user → orders → items → product → reviews), each round trip adding latency.</li>
</ul>
<pre><code>query {
  customer(id: "42") {
    name
    email
    orders(last: 5) {
      total
      items { sku, quantity, product { name } }
    }
  }
}</code></pre>
<p>One request, one response, exactly the fields asked for. Other benefits: a strongly typed schema that doubles as always-current documentation, introspection-powered tooling (GraphiQL, code generation), and the ability to add fields without versioning.</p>`
},
{
  q: "What are the core building blocks of a GraphQL schema?",
  level: "beginner", hot: true, tags: ["schema"],
  a: `<pre><code>type Query {                       # entry point for reads
  order(id: ID!): Order
  orders(status: OrderStatus, first: Int = 20, after: String): OrderConnection!
}

type Mutation {                    # entry point for writes
  createOrder(input: CreateOrderInput!): CreateOrderPayload!
}

type Subscription {                # entry point for real-time push
  orderStatusChanged(orderId: ID!): Order!
}

type Order {
  id: ID!                          # ! means non-nullable
  reference: String!
  total: BigDecimal!
  status: OrderStatus!
  items: [OrderItem!]!             # non-null list of non-null items
  customer: Customer!
}

enum OrderStatus { PENDING PAID SHIPPED CANCELLED }

input CreateOrderInput {           # 'input' types are for arguments only
  customerId: ID!
  items: [OrderItemInput!]!
}

interface Node { id: ID! }
union SearchResult = Order | Customer | Product
scalar DateTime                    # custom scalar</code></pre>
<p><strong>Points worth stating:</strong> <code>Query</code>, <code>Mutation</code> and <code>Subscription</code> are the three root types. Input types are structurally separate from output types (they cannot contain interfaces or unions). And <code>[Order!]!</code> versus <code>[Order]</code> matters — nullability is part of the contract and drives client code generation.</p>`
},
{
  q: "How do queries, mutations and subscriptions differ?",
  level: "beginner", tags: ["basics"],
  a: `<table>
<tr><th></th><th>Query</th><th>Mutation</th><th>Subscription</th></tr>
<tr><td>Purpose</td><td>Read</td><td>Write</td><td>Real-time stream</td></tr>
<tr><td>Execution</td><td>Top-level fields run <strong>in parallel</strong></td><td>Top-level fields run <strong>sequentially</strong></td><td>Long-lived</td></tr>
<tr><td>Transport</td><td>HTTP POST (or GET)</td><td>HTTP POST</td><td>WebSocket / SSE</td></tr>
<tr><td>Idempotent</td><td>Should be</td><td>No</td><td>N/A</td></tr>
</table>
<p>The sequential execution of mutations is deliberate and worth knowing: if you send two mutations in one document, the second sees the effect of the first. Query fields run in parallel because they are supposed to be side-effect free.</p>
<pre><code>mutation {
  addItem(orderId: "1", sku: "A") { id }     # runs first
  checkout(orderId: "1") { status }          # then this, seeing the added item
}</code></pre>
<p>Note that GraphQL itself has <em>no</em> concept of transactions — if the second mutation fails, the first is not rolled back. Wrap multi-step operations in a single mutation backed by one database transaction rather than relying on the client to compose them.</p>`
},
{
  q: "What is a resolver and how does execution work?",
  level: "advanced", hot: true, tags: ["resolvers"],
  a: `<p>A resolver is a function that produces the value for one field. GraphQL executes a query by walking the tree and calling a resolver per field, passing the parent's result down.</p>
<pre><code>@Controller
public class OrderGraphQLController {

    @QueryMapping                                    // Query.order
    public Order order(@Argument String id) {
        return orderService.findById(id);
    }

    @SchemaMapping(typeName = "Order", field = "customer")   // Order.customer
    public Customer customer(Order order) {                  // parent is injected
        return customerService.findById(order.getCustomerId());
    }

    @MutationMapping
    public Order createOrder(@Argument @Valid CreateOrderInput input) {
        return orderService.create(input);
    }

    @SubscriptionMapping
    public Flux&lt;Order&gt; orderStatusChanged(@Argument String orderId) {
        return orderEventPublisher.streamFor(orderId);
    }
}</code></pre>
<p><strong>Execution order:</strong> parse → validate against the schema → execute the tree (breadth-first per level, parallel across sibling fields) → assemble the response. A default resolver exists for every field: if no explicit resolver is registered, it reads the property of the parent object by name — which is why simple scalar fields need no code.</p>
<p><strong>The performance consequence</strong> is the whole reason the next question exists: a nested field resolver is called <em>once per parent object</em>, so a list of 100 orders calls <code>Order.customer</code> 100 times.</p>`
},
{
  q: "What is the N+1 problem in GraphQL and how does DataLoader solve it?",
  level: "advanced", hot: true, tags: ["performance", "dataloader"],
  a: `<pre><code>query { orders(first: 100) { id customer { name } } }
// 1 query for orders + 100 queries for customers = 101</code></pre>
<p>The resolver for <code>customer</code> runs once per order, and it cannot see that 99 other calls are happening at the same time.</p>
<p><strong>DataLoader</strong> fixes this with <em>batching</em> and <em>caching</em>: instead of resolving immediately, it collects all the keys requested during one execution tick, then calls your batch function once.</p>
<pre><code>@Configuration
public class DataLoaderConfig {

    @Bean
    public BatchLoaderRegistry.Registration&lt;String, Customer&gt; customerLoader(
            BatchLoaderRegistry registry, CustomerService service) {
        return registry.forTypePair(String.class, Customer.class)
            .registerMappedBatchLoader((customerIds, env) -&gt;
                Mono.fromCallable(() -&gt; service.findAllById(customerIds)   // ONE query
                        .stream().collect(toMap(Customer::getId, identity())))
                    .subscribeOn(Schedulers.boundedElastic()));
    }
}

@SchemaMapping(typeName = "Order", field = "customer")
public CompletableFuture&lt;Customer&gt; customer(Order order, DataLoader&lt;String, Customer&gt; loader) {
    return loader.load(order.getCustomerId());        // batched automatically
}</code></pre>
<p>Result: 101 queries become 2. The DataLoader cache is scoped <strong>per request</strong>, not global — which is correct, because caching across requests would serve stale or another user's data.</p>
<p>The alternative for simple cases is a <strong>lookahead</strong>: inspect the selection set (<code>DataFetchingFieldSelectionSet</code>) and JOIN FETCH the associations the client actually asked for, in the root query.</p>`
},
{
  q: "GraphQL vs REST — trade-offs and when would you choose each?",
  level: "advanced", hot: true, tags: ["architecture"],
  a: `<table>
<tr><th></th><th>REST</th><th>GraphQL</th></tr>
<tr><td>Endpoints</td><td>Many, one per resource</td><td>One (<code>/graphql</code>)</td></tr>
<tr><td>Data shape</td><td>Fixed by the server</td><td>Chosen by the client</td></tr>
<tr><td>Over/under-fetching</td><td>Common</td><td>Solved</td></tr>
<tr><td>HTTP caching</td><td><strong>Native</strong> — ETag, CDN, browser</td><td>Hard — everything is a POST to one URL</td></tr>
<tr><td>Versioning</td><td>Explicit versions</td><td>Evolve by adding fields and deprecating</td></tr>
<tr><td>Error handling</td><td>Status codes</td><td>Always 200 with an <code>errors</code> array</td></tr>
<tr><td>Monitoring</td><td>Per-endpoint metrics are natural</td><td>Needs per-operation instrumentation</td></tr>
<tr><td>File upload</td><td>Native multipart</td><td>Needs a spec extension</td></tr>
<tr><td>Security surface</td><td>Bounded per endpoint</td><td>Query complexity and depth attacks</td></tr>
</table>
<p><strong>Choose GraphQL when:</strong> you have several client types with genuinely different data needs, your UI is composed of many nested entities, mobile bandwidth matters, or you are building an aggregation layer over multiple backends (this is where I have used the GraphQL-to-REST proxy pattern — GraphQL at the edge, existing REST services behind it).</p>
<p><strong>Choose REST when:</strong> the API is CRUD-shaped, HTTP caching and CDN are valuable, consumers are simple, or the team does not want to own the operational complexity of query cost analysis and schema governance.</p>
<p><strong>Do not present it as a replacement.</strong> The mature answer is that they solve different problems and most large systems run both.</p>`
},
{
  q: "How do you handle errors in GraphQL?",
  level: "advanced", hot: true, tags: ["errors"],
  a: `<p>GraphQL returns <strong>HTTP 200</strong> even when things fail — errors go in a top-level <code>errors</code> array, and partial data may still be returned:</p>
<pre><code>{
  "data": { "order": { "id": "42", "customer": null } },
  "errors": [{
    "message": "Customer service unavailable",
    "path": ["order", "customer"],
    "locations": [{ "line": 3, "column": 5 }],
    "extensions": { "code": "DOWNSTREAM_UNAVAILABLE", "traceId": "b7d3f1" }
  }]
}</code></pre>
<p><strong>Null propagation matters:</strong> if a resolver for a non-nullable field (<code>Customer!</code>) errors, the null bubbles <em>up</em> to the nearest nullable ancestor — potentially nulling the entire <code>order</code>. Schema nullability is therefore an error-resilience decision, not just a typing one.</p>
<pre><code>@Component
public class GraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {
    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof EntityNotFoundException e) {
            return GraphqlErrorBuilder.newError(env)
                .message(e.getMessage())
                .errorType(ErrorType.NOT_FOUND)
                .extensions(Map.of("code", "NOT_FOUND"))
                .build();
        }
        return null;   // fall through to the default handler
    }
}</code></pre>
<p><strong>Advanced pattern worth mentioning:</strong> model <em>expected</em> business failures as part of the schema using union or result types, and reserve the <code>errors</code> array for genuinely exceptional conditions:</p>
<pre><code>union CreateOrderResult = Order | InsufficientStockError | PaymentDeclinedError</code></pre>
<p>That makes failure handling type-safe and forces clients to deal with it, instead of parsing error strings.</p>`
},
{
  q: "How do you secure a GraphQL API?",
  level: "advanced", hot: true, tags: ["security"],
  a: `<p>GraphQL's flexibility is also its attack surface. The specific defences:</p>
<ol>
<li><strong>Query depth limiting</strong> — a recursive schema lets an attacker nest <code>order → customer → orders → customer …</code> forever. Cap depth (typically 10–15).</li>
<li><strong>Query complexity analysis</strong> — assign a cost per field and per list multiplier, reject queries over a budget. Depth alone does not stop <code>orders(first: 10000)</code>.</li>
<li><strong>Pagination limits</strong> — enforce a maximum <code>first</code>/<code>last</code> value in the schema and the resolver.</li>
<li><strong>Disable introspection in production</strong> — or restrict it to authenticated internal users; it hands an attacker your whole schema.</li>
<li><strong>Persisted queries</strong> — clients send a hash of a pre-registered query rather than arbitrary text. This is the strongest control: the server only ever runs queries you have approved, which also improves caching and payload size.</li>
<li><strong>Field-level authorization</strong> — a single endpoint does not mean uniform permissions. Check per field or per resolver, not just at the entry point.</li>
<li><strong>Rate limit by cost, not request count</strong> — one GraphQL request can be a thousand REST requests' worth of work.</li>
<li><strong>Batching limits</strong> — cap the number of operations in one batched request, or an attacker amplifies a single HTTP call.</li>
<li><strong>Timeouts</strong> on resolvers and the whole operation.</li>
</ol>
<pre><code>spring.graphql.schema.introspection.enabled: false

@Bean
Instrumentation complexityInstrumentation() {
    return new MaxQueryComplexityInstrumentation(200);
}
@Bean
Instrumentation depthInstrumentation() {
    return new MaxQueryDepthInstrumentation(12);
}</code></pre>`
},
{
  q: "How do you version and evolve a GraphQL schema?",
  level: "advanced", tags: ["schema", "design"],
  a: `<p>GraphQL's stated position is that you <strong>do not version</strong> — you evolve the schema continuously. That works because clients request specific fields, so adding a field breaks nobody.</p>
<table>
<tr><th>Change</th><th>Safe?</th></tr>
<tr><td>Add a field or type</td><td>✔ Always safe</td></tr>
<tr><td>Add an optional argument</td><td>✔ Safe</td></tr>
<tr><td>Add a required argument</td><td>✘ Breaking</td></tr>
<tr><td>Remove or rename a field</td><td>✘ Breaking</td></tr>
<tr><td>Change a field's type</td><td>✘ Breaking</td></tr>
<tr><td>Make a nullable field non-nullable</td><td>✔ Safe for clients (output); ✘ for inputs</td></tr>
<tr><td>Make a non-nullable field nullable</td><td>✘ Breaking (clients assumed a value)</td></tr>
<tr><td>Add an enum value</td><td>⚠ Breaking in practice — clients may not handle it</td></tr>
</table>
<pre><code>type Order {
  total: Float! @deprecated(reason: "Use totalAmount, which carries currency")
  totalAmount: Money!
}</code></pre>
<p><strong>The process that makes this work in practice:</strong> deprecate rather than delete; instrument <strong>field-level usage metrics</strong> so you know exactly which clients still request the deprecated field; only remove when usage hits zero; and run schema-diff checks in CI (Apollo Rover, GraphQL Inspector) so a breaking change fails the build.</p>
<p>Also worth naming for large organisations: <strong>schema federation</strong> (Apollo Federation), where each team owns a subgraph and a gateway composes them into one supergraph — the microservices answer to "who owns the schema?"</p>`
},
{
  q: "How do you implement pagination in GraphQL?",
  level: "advanced", tags: ["pagination"],
  a: `<p>The community standard is the <strong>Relay Cursor Connection specification</strong>:</p>
<pre><code>type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}
type OrderEdge {
  node: Order!
  cursor: String!          # opaque, base64-encoded
}
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  orders(first: Int, after: String, last: Int, before: String): OrderConnection!
}</code></pre>
<pre><code>query {
  orders(first: 20, after: "eyJpZCI6OTF9") {
    edges { cursor node { id total } }
    pageInfo { hasNextPage endCursor }
  }
}</code></pre>
<p><strong>Why edges and cursors rather than page numbers:</strong> cursors are keyset-based, so they stay O(log n) at any depth and remain stable when rows are inserted or deleted during paging. The <code>edge</code> wrapper exists so you can attach metadata about the <em>relationship</em> (a <code>role</code> on a membership edge, for example), not just the node.</p>
<p><strong>Practical notes:</strong> make <code>totalCount</code> optional and lazy — computing it forces an extra count query on every page. Enforce a maximum for <code>first</code>. And make cursors opaque (base64 of the sort keys) so you can change the implementation without breaking clients.</p>`
},
{
  q: "What are fragments, variables and directives?",
  level: "beginner", tags: ["queries"],
  a: `<pre><code># Variables — never string-interpolate user input into a query
query GetOrder($id: ID!, $withItems: Boolean! = true) {
  order(id: $id) {
    ...OrderSummary
    items @include(if: $withItems) { sku quantity }
  }
}

# Fragment — reusable field selection, keeps queries DRY
fragment OrderSummary on Order {
  id
  reference
  total
  status
}

# Inline fragment — for unions and interfaces
query Search($q: String!) {
  search(query: $q) {
    __typename
    ... on Order    { reference total }
    ... on Customer { name email }
  }
}</code></pre>
<p><strong>Built-in directives:</strong> <code>@include(if:)</code> and <code>@skip(if:)</code> for conditional fields, <code>@deprecated(reason:)</code> in the schema. You can define custom ones — <code>@auth(requires: ADMIN)</code>, <code>@rateLimit</code>, <code>@cacheControl</code> — implemented as schema wiring or instrumentation.</p>
<p>The <code>__typename</code> meta-field is essential when working with unions and interfaces; client caches like Apollo rely on it plus <code>id</code> for normalisation.</p>`
},
{
  q: "How do you build a GraphQL-to-REST proxy layer?",
  level: "advanced", tags: ["architecture", "integration"],
  a: `<p>A common brownfield pattern: existing REST microservices stay as they are, and a GraphQL layer at the edge composes them into one client-facing graph.</p>
<pre><code>@Controller
@RequiredArgsConstructor
public class CustomerGraphQLController {

    private final WebClient customerClient;
    private final WebClient orderClient;

    @QueryMapping
    public Mono&lt;Customer&gt; customer(@Argument String id) {
        return customerClient.get().uri("/customers/{id}", id)
                .retrieve().bodyToMono(Customer.class)
                .timeout(Duration.ofSeconds(2))
                .transformDeferred(CircuitBreakerOperator.of(breaker));
    }

    @SchemaMapping(typeName = "Customer", field = "orders")
    public Mono&lt;List&lt;Order&gt;&gt; orders(Customer customer,
                                    @Argument int first,
                                    DataLoader&lt;String, List&lt;Order&gt;&gt; loader) {
        return Mono.fromFuture(loader.load(customer.getId()));   // batched
    }
}</code></pre>
<p><strong>What you must get right:</strong></p>
<ul>
<li><strong>Batching</strong> — without DataLoader, one GraphQL query becomes a storm of HTTP calls to downstream services. This is N+1 amplified across the network.</li>
<li><strong>Resilience</strong> — timeouts, circuit breakers and bulkheads per downstream, so one slow service degrades one field rather than the whole response. Return partial data plus an error entry.</li>
<li><strong>Propagate identity and trace context</strong> — forward the bearer token and trace headers to every downstream call.</li>
<li><strong>Do not leak the REST shape into the schema.</strong> The graph should model the domain as clients think about it, not mirror three services' DTOs — otherwise you have added a layer without adding value.</li>
<li><strong>Caching</strong> — you lose HTTP caching at the edge, so cache at the resolver or downstream-client level instead.</li>
</ul>`
},
{
  q: "How do you set up GraphQL in Spring Boot?",
  level: "beginner", tags: ["spring"],
  a: `<pre><code>&lt;dependency&gt;
  &lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;
  &lt;artifactId&gt;spring-boot-starter-graphql&lt;/artifactId&gt;
&lt;/dependency&gt;</code></pre>
<pre><code># src/main/resources/graphql/schema.graphqls  — schema-first is the default
type Query { order(id: ID!): Order }
type Order { id: ID!, reference: String!, total: Float! }</code></pre>
<pre><code>spring:
  graphql:
    graphiql.enabled: true          # dev UI at /graphiql
    schema.printer.enabled: true
    path: /graphql</code></pre>
<pre><code>@Controller
class OrderController {
    @QueryMapping Order order(@Argument String id) { ... }
    @SchemaMapping(typeName="Order", field="customer") Customer customer(Order o) { ... }
    @MutationMapping Order createOrder(@Argument @Valid CreateOrderInput in) { ... }
}

// Testing
@GraphQlTest(OrderController.class)
class OrderControllerTest {
    @Autowired GraphQlTester tester;

    @Test void fetchesOrder() {
        tester.document("{ order(id: \\"1\\") { reference total } }")
              .execute()
              .path("order.reference").entity(String.class).isEqualTo("ORD-1");
    }
}</code></pre>
<p>Spring for GraphQL is <strong>schema-first</strong> — the <code>.graphqls</code> file is the source of truth and the annotations bind to it, which is the opposite of code-first frameworks. Mention <code>GraphQlTester</code>: it is the MockMvc of GraphQL and makes resolver testing straightforward.</p>`
},
{
  q: "How do you monitor and debug a GraphQL API in production?",
  level: "advanced", tags: ["production", "observability"],
  a: `<p>The hard part is that every request hits the same endpoint with the same status code, so ordinary HTTP metrics tell you nothing.</p>
<ol>
<li><strong>Name every operation</strong> and require it — <code>query GetOrderDetails { ... }</code>. Then tag metrics and traces by operation name, so you have per-operation latency and error rates instead of one meaningless <code>/graphql</code> aggregate.</li>
<li><strong>Field-level tracing</strong> — an <code>Instrumentation</code> that records resolver duration reveals which field is slow. This is where you find the resolver quietly making 400 database calls.</li>
<li><strong>Track resolver counts per request</strong> — a sudden jump means a DataLoader stopped batching.</li>
<li><strong>Log the errors array</strong>, not just HTTP status; alert on error <em>rate per operation</em>, since a 200 response can be entirely errors.</li>
<li><strong>Record query complexity and depth</strong> as metrics — rising values predict an incident before it happens.</li>
<li><strong>Field usage analytics</strong> — which fields does each client actually request? This drives safe deprecation and reveals dead schema.</li>
<li><strong>Distributed tracing</strong> — propagate the trace context into every downstream call so one span tree shows the whole fan-out.</li>
</ol>
<pre><code>@Component
public class TracingInstrumentation extends SimpleInstrumentation {
    @Override
    public InstrumentationContext&lt;ExecutionResult&gt; beginExecution(
            InstrumentationExecutionParameters params) {
        long start = System.nanoTime();
        String op = params.getOperation() == null ? "anonymous" : params.getOperation();
        return SimpleInstrumentationContext.whenCompleted((result, ex) -&gt;
            meterRegistry.timer("graphql.operation", "name", op,
                                "outcome", result.getErrors().isEmpty() ? "ok" : "error")
                         .record(System.nanoTime() - start, NANOSECONDS));
    }
}</code></pre>`
},
{
  q: "What are the downsides of GraphQL that you should be honest about?",
  level: "advanced", tags: ["architecture", "trade-offs"],
  a: `<ul>
<li><strong>Caching is genuinely harder.</strong> You give up HTTP caching, CDNs and <code>304 Not Modified</code>. You replace them with client-side normalised caches (Apollo) and server-side field caching that you have to build and reason about.</li>
<li><strong>Performance is opt-in.</strong> The N+1 problem is the default behaviour; without DataLoader everywhere, a GraphQL API is usually slower than the REST API it replaced.</li>
<li><strong>Unbounded query cost.</strong> A client can construct an expensive query you never anticipated. Complexity analysis and persisted queries are mandatory, not optional.</li>
<li><strong>Operational complexity</strong> — schema governance, federation, versioning discipline, per-field metrics. It is a platform commitment, not a library choice.</li>
<li><strong>Weaker HTTP semantics</strong> — everything is a 200 POST, so proxies, load balancers, retries and monitoring all need special handling.</li>
<li><strong>File uploads and binary data</strong> need out-of-band solutions.</li>
<li><strong>Error handling is less standardised</strong> than HTTP status codes; every team invents its own convention.</li>
<li><strong>It moves complexity, it does not remove it.</strong> The joining and shaping the client used to do now happens in your resolvers, against your database.</li>
</ul>
<blockquote><p><strong>Why this answer scores well:</strong> anyone can list GraphQL's benefits from the homepage. Being able to articulate when <em>not</em> to use it is what signals you have run it in production rather than prototyped with it.</p></blockquote>`
}
]);
