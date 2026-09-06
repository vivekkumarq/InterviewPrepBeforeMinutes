appendTopic("graphql", [
{
  q: "How do you implement authentication and authorization in GraphQL resolvers?",
  level: "advanced", hot: true, tags: ["security"],
  a: `<p>Authentication happens <em>before</em> GraphQL — in a servlet filter or Spring Security chain, exactly as for REST. Authorization happens <em>inside</em>, because a single endpoint can return anything.</p>
<pre><code>// 1. Authenticate in the filter chain (the /graphql endpoint itself)
http.authorizeHttpRequests(a -&gt; a.requestMatchers("/graphql").authenticated());

// 2. Authorize per field or per resolver
@Controller
public class OrderGraphQLController {

    @QueryMapping
    @PreAuthorize("hasAuthority('orders:read')")
    public Order order(@Argument String id, @AuthenticationPrincipal Jwt jwt) {
        return service.findForUser(id, jwt.getSubject());   // ownership enforced in the service
    }

    @SchemaMapping(typeName = "Customer", field = "email")
    @PreAuthorize("hasRole('ADMIN') or #customer.id == authentication.name")
    public String email(Customer customer) { return customer.getEmail(); }
}</code></pre>
<pre><code># A schema directive is the declarative alternative
directive @auth(requires: Role!) on FIELD_DEFINITION | OBJECT

type Customer {
  id: ID!
  name: String!
  email: String! @auth(requires: ADMIN)      # enforced by instrumentation
  ssn: String!   @auth(requires: COMPLIANCE)
}</code></pre>
<p><strong>The thing that makes GraphQL authorization different from REST:</strong> a single query can reach deeply nested data through paths you never anticipated. <code>order → customer → orders → customer → email</code> may expose a field the caller could not reach through any intended route. So authorization must be enforced <strong>at every field that returns sensitive data</strong>, not at the entry point.</p>
<p><strong>Two practical points:</strong> field-level checks run once per parent object, so an expensive permission lookup inside a resolver becomes N calls — cache the decision per request. And errors from authorization should not reveal existence: return <code>null</code> with an error entry rather than "you are not allowed to see order 42", which confirms the order exists.</p>`
},
{
  q: "How do GraphQL subscriptions work?",
  level: "advanced", tags: ["subscriptions", "realtime"],
  a: `<pre><code>type Subscription {
  orderStatusChanged(orderId: ID!): Order!
  notifications: Notification!
}</code></pre>
<pre><code>@Controller
public class OrderSubscriptionController {

    private final Sinks.Many&lt;Order&gt; sink = Sinks.many().multicast().onBackpressureBuffer();

    @SubscriptionMapping
    public Flux&lt;Order&gt; orderStatusChanged(@Argument String orderId) {
        return sink.asFlux()
                   .filter(o -&gt; o.getId().equals(orderId))
                   .timeout(Duration.ofMinutes(30))
                   .onBackpressureLatest();        // slow client: drop, do not buffer forever
    }

    @EventListener                                  // fed by domain events or Kafka
    public void on(OrderStatusChangedEvent e) {
        sink.tryEmitNext(e.order());
    }
}</code></pre>
<pre><code>spring.graphql:
  websocket.path: /graphql          # subscriptions use WebSocket (graphql-transport-ws)
  websocket.connection-init-timeout: 60s</code></pre>
<p><strong>The scaling problem, which is the real content of this question:</strong> WebSocket connections are stateful and pinned to one server instance. With three replicas, a client connected to instance A will not receive an event published on instance B. You need a shared backplane — <strong>Redis pub/sub or Kafka</strong> — where every instance subscribes and fans out to its own local connections.</p>
<p><strong>Other production concerns:</strong> authenticate on the WebSocket <em>connection init</em> payload, not just the HTTP upgrade; enforce a maximum number of subscriptions per connection; apply backpressure so a slow client cannot exhaust server memory; handle reconnection with a resume cursor if missed events matter; and remember load balancers need sticky sessions and long idle timeouts.</p>
<p><strong>Worth stating:</strong> for simple one-way push, Server-Sent Events over plain HTTP is often the better engineering choice — simpler, auto-reconnecting and proxy-friendly. Reserve subscriptions for genuinely interactive features.</p>`
},
{
  q: "What is schema stitching versus federation?",
  level: "advanced", tags: ["architecture", "federation"],
  a: `<table>
<tr><th></th><th>Schema stitching</th><th>Federation (Apollo)</th></tr>
<tr><td>Approach</td><td>A gateway merges remote schemas, with manual conflict resolution</td><td>Each subgraph declares how it extends shared types</td></tr>
<tr><td>Ownership</td><td>Gateway holds the joining logic</td><td>Subgraph teams own their part of the graph</td></tr>
<tr><td>Cross-service references</td><td>Manual resolvers on the gateway</td><td>Declarative via <code>@key</code> and reference resolvers</td></tr>
<tr><td>Status</td><td>Largely superseded</td><td>The standard approach</td></tr>
</table>
<pre><code># Orders subgraph — owns Order, references Customer by key
type Order @key(fields: "id") {
  id: ID!
  total: Money!
  customer: Customer!
}
type Customer @key(fields: "id") @extends {
  id: ID! @external            # owned by the customers subgraph
}

# Customers subgraph — owns Customer
type Customer @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}</code></pre>
<p>A single client query for <code>order { total customer { name } }</code> is planned by the gateway into two subgraph calls, and the gateway joins the results using the <code>@key</code>. Neither team had to know about the other's fields.</p>
<p><strong>Why federation is the microservices answer:</strong> it solves the ownership question. Without it, either one team owns a giant schema that everyone must go through (a bottleneck), or clients call several GraphQL endpoints (defeating the purpose). Federation gives clients one graph while letting each team deploy independently.</p>
<p><strong>The costs to acknowledge:</strong> the gateway is now critical infrastructure and a single point of failure; query planning adds latency; debugging spans multiple services; and you need schema composition checks in CI, because one subgraph can break the supergraph. For two or three services, a single GraphQL service in front of REST backends is simpler and perfectly adequate.</p>`
},
{
  q: "How do you optimise GraphQL query performance beyond DataLoader?",
  level: "advanced", tags: ["performance"],
  a: `<ol>
<li><strong>Lookahead / selection-set inspection</strong> — read what the client actually asked for and fetch exactly that in the root query, rather than resolving field by field:
<pre><code>@QueryMapping
public List&lt;Order&gt; orders(DataFetchingFieldSelectionSet selection) {
    if (selection.contains("customer")) {
        return repo.findAllWithCustomer();      // JOIN FETCH only when requested
    }
    return repo.findAll();
}</code></pre></li>
<li><strong>Projections to the database</strong> — map the GraphQL selection set onto a SQL select list so you never fetch columns nobody asked for. Libraries exist for JPA and jOOQ.</li>
<li><strong>Persisted queries</strong> — clients send a hash instead of the query text. Smaller requests, and because the server only runs pre-registered queries you can pre-plan and pre-optimise each one.</li>
<li><strong>Per-request caching</strong> beyond DataLoader — cache authorization decisions and expensive computed fields for the life of the request.</li>
<li><strong>Field-level caching with <code>@cacheControl</code></strong> — annotate fields with a max age and let a caching gateway (Apollo Router, Stellate) cache partial responses.</li>
<li><strong>Defer and stream directives</strong> — return the fast fields immediately and stream slow ones later, so the page renders sooner:
<pre><code>query { order(id: "1") { total ... @defer { recommendations { name } } } }</code></pre></li>
<li><strong>Complexity budgets</strong> — reject expensive queries rather than serving them slowly.</li>
<li><strong>Async resolvers</strong> — return <code>CompletableFuture</code> so sibling fields resolve concurrently instead of sequentially.</li>
</ol>
<p><strong>The measurement point:</strong> instrument resolver-level timing and the number of data-source calls per request. The failure mode is almost always "one field quietly makes 400 calls", and only per-field metrics reveal which one.</p>`
},
{
  q: "How do you test a GraphQL API?",
  level: "advanced", tags: ["testing"],
  a: `<pre><code>@GraphQlTest(OrderGraphQLController.class)          // slice test — no database, no web server
class OrderGraphQLControllerTest {

    @Autowired GraphQlTester tester;
    @MockitoBean OrderService service;

    @Test
    void returnsOrderWithCustomer() {
        given(service.findById("1")).willReturn(sampleOrder());

        tester.document("""
                query { order(id: "1") { reference total customer { name } } }
                """)
              .execute()
              .path("order.reference").entity(String.class).isEqualTo("ORD-1")
              .path("order.customer.name").entity(String.class).isEqualTo("Vivek");
    }

    @Test
    void returnsNotFoundError() {
        given(service.findById("9")).willThrow(new EntityNotFoundException("no such order"));

        tester.document("{ order(id: \\"9\\") { reference } }")
              .execute()
              .errors()
              .expectSingleError()                       // assert on the errors array
              .satisfies(e -&gt; assertThat(e.getExtensions()).containsEntry("code", "NOT_FOUND"));
    }

    @Test
    void rejectsDeeplyNestedQuery() {
        tester.document(deeplyNested(20)).execute()
              .errors().satisfy(errs -&gt; assertThat(errs).anyMatch(
                  e -&gt; e.getMessage().contains("maximum query depth")));
    }
}</code></pre>
<p><strong>What to test that is specific to GraphQL:</strong></p>
<ul>
<li><strong>Errors, not just data</strong> — a GraphQL failure returns HTTP 200, so a test asserting on status proves nothing. Assert on the <code>errors</code> array and its <code>extensions.code</code>.</li>
<li><strong>Partial responses</strong> — when one field fails, the rest should still return. Verify null propagation behaves as the schema's nullability declares.</li>
<li><strong>Query count</strong> — assert that fetching 100 orders with customers issues 2 queries, not 101. This is the regression test that protects your DataLoader wiring.</li>
<li><strong>Depth and complexity limits</strong> actually reject hostile queries.</li>
<li><strong>Schema compatibility</strong> — diff the schema in CI so a removed field fails the build.</li>
<li><strong>Authorization per field</strong> — a non-admin querying a restricted field gets an error, not the value.</li>
</ul>
<p>Store queries as <code>.graphql</code> files under <code>src/test/resources/graphql-test/</code> and reference them with <code>tester.documentName("orderWithCustomer")</code> — cleaner than embedding long strings.</p>`
},
{
  q: "What are GraphQL scalars and how do you add a custom one?",
  level: "beginner", tags: ["schema"],
  a: `<p>The built-in scalars are deliberately minimal: <code>Int</code>, <code>Float</code>, <code>String</code>, <code>Boolean</code>, <code>ID</code>. Anything else — dates, money, UUIDs — needs a custom scalar or a mapped type.</p>
<pre><code>scalar DateTime
scalar BigDecimal
scalar UUID

type Order {
  id: UUID!
  total: BigDecimal!          # NOT Float — Float loses precision for money
  placedAt: DateTime!
}</code></pre>
<pre><code>@Configuration
public class ScalarConfig {
    @Bean
    RuntimeWiringConfigurer scalars() {
        GraphQLScalarType dateTime = GraphQLScalarType.newScalar()
            .name("DateTime")
            .coercing(new Coercing&lt;Instant, String&gt;() {
                public String serialize(Object o) {            // Java -&gt; JSON
                    return ((Instant) o).toString();
                }
                public Instant parseValue(Object input) {      // JSON variable -&gt; Java
                    try { return Instant.parse(input.toString()); }
                    catch (DateTimeParseException e) {
                        throw new CoercingParseValueException("invalid DateTime: " + input);
                    }
                }
                public Instant parseLiteral(Object literal) {  // inline query literal -&gt; Java
                    return Instant.parse(((StringValue) literal).getValue());
                }
            }).build();

        return wiring -&gt; wiring.scalar(dateTime)
                               .scalar(ExtendedScalars.GraphQLBigDecimal)
                               .scalar(ExtendedScalars.UUID);
    }
}</code></pre>
<p><strong>Why <code>Int</code> and <code>Float</code> are traps:</strong> GraphQL's <code>Int</code> is a signed <strong>32-bit</strong> integer, so a database <code>bigint</code> ID or an epoch-millisecond timestamp overflows it — use <code>ID</code> (a string) or a custom <code>Long</code> scalar. And <code>Float</code> is IEEE 754 double, so representing money with it reintroduces every rounding problem <code>BigDecimal</code> exists to avoid.</p>
<p>The <code>graphql-java-extended-scalars</code> library provides ready-made <code>DateTime</code>, <code>Date</code>, <code>BigDecimal</code>, <code>Long</code>, <code>UUID</code>, <code>URL</code> and constrained scalars like <code>PositiveInt</code> — worth using rather than hand-rolling.</p>`
}
]);
