registerSimple("graphql", {
"How do you implement authentication and authorization in GraphQL resolvers?":
`Authentication (who are you?) happens before GraphQL runs, in the same security filter you would use for REST. Authorization (are you allowed?) happens inside, because one GraphQL endpoint can reach any data. So each resolver or field that returns sensitive data checks the user's permissions, ideally in a shared service layer so no path is forgotten.`,

"How do GraphQL subscriptions work?":
`A subscription keeps a connection open, usually a WebSocket, so the server can push updates to the client as they happen, such as "order status changed". The tricky part is scaling: each client is connected to one server, so when an event happens on another server, a message broker such as Redis or Kafka is needed to pass it along.`,

"What is schema stitching versus federation?":
`Both combine several GraphQL services into one big API. <b>Stitching</b> has a central gateway that merges the schemas and needs manual work to join them. <b>Federation</b> lets each team's service describe how its types connect to others, and the gateway combines them automatically. Federation is the more common choice today.`,

"How do you optimise GraphQL query performance beyond DataLoader?":
`Look at exactly which fields the client asked for and fetch only those in one well-shaped database query, instead of resolving field by field. Cache results that are expensive and change rarely, limit query cost, and use persisted queries so the server knows in advance which queries to expect.`,

"How do you test a GraphQL API?":
`Send real queries in your tests and check both the returned data and the <code>errors</code> list, because a failed GraphQL query still returns HTTP 200. Test permissions for each sensitive field, test that very deep or expensive queries are rejected, and check the schema has no accidental breaking changes.`,

"What are GraphQL scalars and how do you add a custom one?":
`Scalars are the basic value types: Int, Float, String, Boolean and ID. For anything else, such as dates, money or email addresses, you define a custom scalar and tell the server how to turn it into text and back, and how to validate it. This keeps values consistent across the whole API.`,

"How do you handle file uploads and large payloads in GraphQL?":
`GraphQL sends JSON, which is not good for large files. The usual approach: the client asks GraphQL for a temporary upload link, uploads the file directly to storage such as S3 using that link, then tells GraphQL the upload is done. Your API server never has to carry the file itself.`,

"What is DataLoader batching versus caching, and what are its limits?":
`DataLoader does two things. <b>Batching</b>: it collects all the ids requested at the same moment and loads them in one call, which fixes the N+1 problem. <b>Caching</b>: within a single request, it remembers what it already loaded. Its cache lasts only one request; it is not a shared cache across users.`,

"How do you design mutations well in GraphQL?":
`Give each mutation a clear name for what it does (<code>addToCart</code>, not <code>updateCart</code>), take a single input object so fields can be added later, and return a payload containing the changed object plus a list of user-facing errors (such as "out of stock"), so normal problems are handled as data rather than crashes.`,

"How do you migrate an existing REST API to GraphQL incrementally?":
`Do not rewrite everything at once. Add a GraphQL endpoint next to the REST API whose resolvers call the existing services or REST endpoints, move screens over one at a time, and retire REST endpoints only when nothing uses them any more.`,

"Why did your team choose GraphQL over REST, and what did it cost you?":
`A good answer names a real problem, such as mobile screens needing several REST calls each, or many apps needing different shapes of the same data, and then honestly names the costs: harder caching, protecting against expensive queries, N+1 problems in resolvers, and a learning curve for the team.`,

"How do you handle authorization at the field level with performance in mind?":
`Because clients can reach sensitive data through many paths in the graph, check permissions on the field or type itself, not just at the top of the query. To keep it fast, load the user's permissions once per request and reuse them, and batch any permission lookups rather than querying for every field.`,

"How do you migrate a GraphQL schema without breaking mobile clients?":
`Old app versions stay on phones for years, so never remove or rename what they use. Add new fields alongside the old ones, mark old fields <code>@deprecated</code>, track which fields are still being requested, and remove a field only when nobody has asked for it for a long time.`,

"What is the N+1 problem in GraphQL and how is it different from ORM N+1?":
`In GraphQL, a nested field's resolver runs once per parent, so a list of 100 orders asking for each customer can cause 100 extra database calls. Unlike the ORM version, you cannot see the loop in your code: the client's query shape decides it. The fix is batching, for example with DataLoader.`,

"How do you secure a GraphQL API against malicious or runaway queries?":
`Clients can build very deep or expensive queries. Defend with a maximum depth, a cost limit per query, caps on list sizes, timeouts and rate limits, and, for your own apps, only allow pre-registered (persisted) queries. Turn off schema exploration (introspection) in production if the API is not public.`,

"How do you handle errors, nullability and partial responses in GraphQL?":
`GraphQL usually returns HTTP 200 and lists any problems in an <code>errors</code> array, and it can return partial data where some fields worked and others failed. If a field marked non-null fails, the null "bubbles up" and wipes out its parent, so only mark fields non-null when they truly can never be missing.`,

"What is federation, and how do you run GraphQL across many teams?":
`Federation lets each team own and run its own part of the GraphQL schema as a separate service, while a gateway combines them so clients see one API. Teams can then change their part independently, as long as they follow agreed rules for linking shared types.`,

"How do you cache and paginate a GraphQL API?":
`Normal web caching does not work well because GraphQL requests are POSTs to one URL. Instead, use caching in the client (such as Apollo's cache), cache data on the server, or use persisted queries sent as GET requests that a CDN can cache. For paging, use cursor-based "connections", which stay fast on large lists.`,

"Design a GraphQL schema for a product catalogue from scratch":
`Start from what the screens need, not from database tables. Define types like Product, Category and Variant, use cursor paging for lists, make fields optional where data might be missing, represent money with an amount and a currency rather than a bare decimal, and design mutations with input objects and clear error results.`,

"What are persisted queries, and why do production GraphQL APIs use them?":
`Instead of sending the full query text each time, the client sends a short id (a hash) for a query that is registered in advance. Requests become smaller, they can be cached with GET, and, if you only allow registered queries, attackers cannot send their own expensive ones.`,

"What is GraphQL and what problems does it solve?":
`GraphQL is a way to build APIs where the client asks for exactly the data it needs in one request. It solves <b>over-fetching</b> (getting more data than you need) and <b>under-fetching</b> (needing several calls to build one screen), and the schema documents the whole API.`,

"What are the core building blocks of a GraphQL schema?":
`A schema is made of <b>types</b> (such as User with its fields), <b>scalars</b> (basic values like String and Int), <b>enums</b> (fixed choices), <b>input types</b> (data sent in), <b>interfaces and unions</b> (types that share or combine shapes), and three entry points: Query (read), Mutation (write) and Subscription (live updates).`,

"How do queries, mutations and subscriptions differ?":
`<b>Queries</b> read data and their top-level fields can run in parallel. <b>Mutations</b> change data and run one after another, in order. <b>Subscriptions</b> keep a connection open and push updates to the client as things happen.`,

"What is a resolver and how does execution work?":
`A resolver is a small function that produces the value of one field. GraphQL runs a query by walking it like a tree: it calls the resolver for the top field, then passes that result down to the resolvers of the fields inside it, and so on, until every requested field has a value.`,

"What is the N+1 problem in GraphQL and how does DataLoader solve it?":
`When a list of 100 items each needs related data, the related field's resolver runs 100 times, causing 100 separate database calls. DataLoader collects all those requests and loads them in one batched call, so it becomes 2 queries instead of 101.`,

"GraphQL vs REST — trade-offs and when would you choose each?":
`REST is simpler, works with normal web caching, and is ideal for public APIs and simple data. GraphQL lets clients get exactly what they need in one call, which suits apps with many different screens or mobile clients, but makes caching, security limits and performance tuning harder.`,

"How do you handle errors in GraphQL?":
`GraphQL usually replies with HTTP 200 and lists problems in an <code>errors</code> array, with partial data where possible. For expected problems, such as validation errors or "out of stock", return them as normal data in the mutation result so clients can handle them clearly. Reserve the errors array for unexpected failures.`,

"How do you secure a GraphQL API?":
`Authenticate every request, check permissions on each sensitive field, limit query depth and cost, cap list sizes, rate-limit clients, turn off schema exploration in production for private APIs, and prefer persisted queries so only approved queries can run.`,

"How do you version and evolve a GraphQL schema?":
`GraphQL avoids version numbers. Because clients ask for specific fields, you can add new fields freely without breaking anyone. When something must go, mark it <code>@deprecated</code>, watch until nobody uses it any more, and only then remove it.`,

"How do you implement pagination in GraphQL?":
`The common approach is "connections": a list returns edges (each with a node and a cursor) plus page information such as whether there is a next page. The client asks for "the first 20 after this cursor". Cursors stay fast and stable even as data changes, unlike page numbers.`,

"What are fragments, variables and directives?":
`<b>Fragments</b> are reusable sets of fields, so you do not repeat the same field list. <b>Variables</b> pass values into a query separately (like function arguments) instead of pasting them into the text. <b>Directives</b> such as <code>@include</code> and <code>@skip</code> include or skip parts of a query based on a condition.`,

"How do you build a GraphQL-to-REST proxy layer?":
`You put a GraphQL server in front of existing REST services: its resolvers call those REST endpoints and combine the results into one graph. To keep it fast, batch and cache the REST calls, call independent services in parallel, and pass the user's login through to each service.`,

"How do you set up GraphQL in Spring Boot?":
`Add the Spring for GraphQL starter, write your schema in a <code>.graphqls</code> file, and create a controller with methods annotated <code>@QueryMapping</code>, <code>@MutationMapping</code> and <code>@SchemaMapping</code> that match the schema's fields. Spring connects them and serves everything at <code>/graphql</code>.`,

"How do you monitor and debug a GraphQL API in production?":
`Every request hits the same URL and usually returns 200, so normal web metrics say little. Require every query to have a name, record timing and errors per query name and per field, trace slow resolvers, and count database calls per request to spot N+1 problems.`,

"What are the downsides of GraphQL that you should be honest about?":
`Normal web caching mostly stops working, clients can send expensive queries that you must guard against, resolvers easily cause N+1 database calls, errors arrive with a 200 status, and the team has more to learn. It is very powerful, but not automatically better than REST.`
});
