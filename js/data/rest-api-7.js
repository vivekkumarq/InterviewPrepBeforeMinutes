registerSimple("rest-api", {
"What is the difference between PUT, PATCH and JSON Patch?":
`<b>PUT</b> replaces the whole resource with what you send, so anything you leave out is removed or reset. <b>PATCH</b> changes only the fields you send. <b>JSON Patch</b> is a precise PATCH format: a list of instructions like "replace the email" or "remove item 2", useful when you need exact control, for example over items in a list.`,

"How do you design a bulk/batch API endpoint?":
`A batch endpoint accepts many items in one request, such as importing 500 products. Decide up front whether it is all-or-nothing or allows partial success, limit how many items one request can carry, report the result for each item (which succeeded, which failed and why), and use a background job if processing takes long.`,

"What are the HTTP headers every API developer should know?":
`Headers carry extra information about a request or response. The essentials: <code>Authorization</code> (the login token), <code>Content-Type</code> (the format of the body, such as JSON), <code>Accept</code> (the format the client wants back), <code>Cache-Control</code> and <code>ETag</code> (caching), <code>Location</code> (where a new resource was created), and <code>Retry-After</code> (when to try again).`,

"How do you design an API for a mobile client with poor connectivity?":
`Mobile networks are slow and unreliable, so make fewer, smaller requests: return everything a screen needs in one call, compress responses, and support caching. Make writes safe to retry with idempotency keys, use paging, and let the app work offline and sync changes later.`,

"What is the difference between REST and RPC style APIs?":
`<b>REST</b> is built around things (resources) and standard actions on them: <code>POST /orders</code>. <b>RPC</b> is built around calling functions: <code>POST /createOrder</code>. REST uses HTTP's methods and status codes for meaning, which makes it predictable; RPC (gRPC for example) can be faster and more natural for actions that are not simple create, read, update or delete.`,

"How do you handle long-running operations and streaming responses?":
`If something takes a long time, do not keep the request waiting. Reply at once with <code>202 Accepted</code> and a link where the client can check progress, or notify it later with a webhook. For live updates you can stream with Server-Sent Events, or use WebSockets when both sides need to send messages.`,

"How do you design consistent API responses and envelopes?":
`Pick one response style and use it everywhere. Some APIs return the data directly; others wrap it in an "envelope" like <code>{"data": ..., "meta": ...}</code> with paging information. Either is fine if it is consistent, with the same error format for every endpoint and correct HTTP status codes.`,

"What is API-first design and how does it change the workflow?":
`API-first means you write and agree on the API description (usually an OpenAPI document) before writing any code. Frontend and backend teams can then work at the same time, generate code and mock servers from the description, and catch design problems early, before they are expensive to change.`,

"How do you handle backwards compatibility when evolving an API?":
`Adding things is usually safe: new optional fields, new endpoints. Removing or renaming fields, changing their meaning, or making optional input required breaks existing clients. Evolve by adding new things alongside the old, telling clients the old ones are going away, and removing them only once nobody uses them.`,

"Design a REST API for an e-commerce order system — walk through the endpoints":
`Start from the nouns: products, cart, orders, payments. Use standard methods: <code>GET /products</code> to browse, <code>POST /cart/items</code> to add to the cart, <code>POST /orders</code> to check out (with an idempotency key so a retry does not create two orders), <code>GET /orders/{id}</code> to view one, and <code>POST /orders/{id}/cancel</code> to cancel. Plan the error responses too.`,

"What is the difference between 401, 403, 404 and 409 — when do you use each?":
`<b>401</b>: we do not know who you are (no token or a bad one). <b>403</b>: we know who you are, but you are not allowed. <b>404</b>: this thing does not exist, also used to hide things you are not allowed to know about. <b>409</b>: your request clashes with the current state, for example the email is already taken.`,

"How do you design an API that supports both filtering and full-text search?":
`Use query parameters for simple filters (<code>?status=paid&amp;city=Pune</code>) and a parameter such as <code>q=</code> for free-text search, which is usually backed by a search engine like Elasticsearch. For very complex filters, accept a structured search request in a POST body to a <code>/search</code> endpoint.`,

"What is the difference between synchronous request-response and webhooks for integration?":
`With request-response, you call another system and wait for the answer. With webhooks, the other system calls you when something happens, such as "payment completed", so you do not have to keep asking. Webhooks avoid constant polling but need a public endpoint, signature checks and handling of duplicate messages.`,

"How do you version an API when a breaking change is unavoidable?":
`First try to avoid breaking anything by adding new fields alongside old ones. If a break is truly unavoidable, publish a new version (for example <code>/v2/orders</code>), run both versions side by side, give clients clear notice and time to move, and switch the old one off only when nobody uses it any more.`,

"How do you secure a public API against abuse and scraping?":
`Require API keys even for public endpoints so you know who is calling, rate-limit per key and per IP, return pages instead of huge lists, use ids that cannot simply be counted through, watch for unusual traffic, and put a firewall or bot protection in front of the API.`,

"How do you design pagination for a large collection endpoint?":
`Never return everything at once. Simple paging (<code>?page=5&amp;size=20</code>) lets users jump to any page but gets slow deep into large tables. Cursor paging (<code>?after=abc123</code>) remembers where the last page ended and stays fast at any depth, which is better for feeds and very large lists.`,

"How do you version a REST API without breaking existing clients?":
`The common choice is putting the version in the URL, such as <code>/api/v1/orders</code>; it is clear and easy to route. Alternatives are a header or the Accept header. Whatever you choose, prefer additive changes so you rarely need a new version, and keep old versions running while clients migrate.`,

"How do you make an API idempotent and safe to retry?":
`If a request times out, the client does not know whether it worked, so it retries, and a payment might happen twice. The fix: the client sends a unique <b>idempotency key</b> with the request. The server remembers keys it has seen and, on a repeat, returns the original result instead of doing the work again.`,

"REST, gRPC or GraphQL — how do you choose?":
`<b>REST</b> is simple and works everywhere, best for public APIs. <b>gRPC</b> is fast and strongly typed, best for internal service-to-service calls. <b>GraphQL</b> lets the client ask for exactly the fields it needs in one request, best when many different screens need different shapes of data.`,

"How do you design and document an API contract that survives contact with real clients?":
`Use clear, consistent naming (plural nouns, no verbs in URLs), predictable errors, paging and versioning, and describe everything in an OpenAPI document with examples. Keep the document in sync with the code and test against it, so the documentation is always correct.`,

"Review this badly designed API and fix every problem you find":
`Common problems to look for: verbs in URLs (<code>/getUsers</code>), using GET to change data, returning 200 with an error message inside, inconsistent naming, returning huge lists without paging, and leaking stack traces. Fix the dangerous ones first: GET that deletes data and leaked internal details.`,

"Two users edit the same record at once. Prevent the lost update with ETag and If-Match":
`If two people edit the same record, the second save can quietly overwrite the first. The server gives each version of the record a tag (an ETag). When saving, the client sends back the tag it read (<code>If-Match</code>). If the record has changed since then, the tags differ, and the server refuses with <code>412</code> so the user can reload and try again.`,

"What is REST and what are its architectural constraints?":
`REST is a style for designing web APIs. Its main rules: client and server are separate, every request carries all the information needed (the server keeps no session), responses say whether they can be cached, there is a uniform way to address and act on resources, and the system can be layered, for example with proxies in between.`,

"Explain the HTTP methods and their properties":
`<b>GET</b> reads and is safe. <b>POST</b> creates or triggers an action. <b>PUT</b> replaces a whole resource. <b>PATCH</b> updates part of one. <b>DELETE</b> removes one. "Safe" means it changes nothing; "idempotent" means repeating it has the same effect as doing it once. GET, PUT and DELETE are idempotent; POST is not.`,

"What HTTP status codes should an API return?":
`Use the code that matches what happened. 200 OK for success with data, 201 Created for a new resource, 204 No Content for success with no body, 400 for bad input, 401 for not logged in, 403 for not allowed, 404 for not found, 409 for a conflict, 422 for a broken business rule, 429 for too many requests, and 500 for server errors.`,

"What is idempotency and how do you implement an idempotent POST?":
`Idempotent means doing something twice has the same effect as doing it once. POST normally is not, so a retried payment could charge twice. Fix it with an idempotency key: the client sends a unique key, the server saves the key with the result, and a repeat request with the same key gets the saved result instead of being processed again.`,

"How do you design good REST resource URLs?":
`Use plural nouns (<code>/orders</code>), lowercase words with hyphens (<code>/purchase-orders</code>), ids for single items (<code>/orders/42</code>), at most one level of nesting (<code>/orders/42/items</code>), and query parameters for filtering and paging. Do not put verbs in URLs; the HTTP method is the verb.`,

"What is HATEOAS and is it worth implementing?":
`HATEOAS means responses include links telling the client what it can do next, for example an order response containing a "cancel" link only while cancelling is allowed. In theory clients follow links instead of hard-coding URLs. In practice few clients use it, so most teams skip it unless they are building a very general public API.`,

"How do you do API versioning?":
`The main options: in the URL (<code>/v1/orders</code>, the most common), in a query parameter, in a custom header, or in the Accept header. The URL style is clearest and easiest to route and cache. Whichever you pick, version rarely, by making changes that add rather than break.`,

"How do you handle errors consistently in a REST API?":
`Use one error format everywhere, ideally the standard "Problem Details" format, with a status code, a short title, a clear message and a trace id. Map each kind of exception to the right status code in one central place, and never expose internal details such as stack traces.`,

"How do you implement pagination, filtering and sorting?":
`Accept query parameters such as <code>?page=0&amp;size=20&amp;sort=createdAt,desc&amp;status=paid</code>. Return the page of results plus information about whether there are more. Set a default and a maximum page size, allow sorting only on indexed columns, and use cursor paging for very large tables.`,

"How do you secure a REST API?":
`Use HTTPS only, require authentication (usually short-lived tokens), check permissions and ownership on every request, validate all input, rate-limit, never put secrets in URLs, return safe error messages, keep libraries updated, and log security events. Deny by default and open up only what is needed.`,

"What is content negotiation?":
`Content negotiation is how the client and server agree on a data format. The client says what it can accept in the <code>Accept</code> header (for example <code>application/json</code>), and the server picks a format it supports and states it in <code>Content-Type</code>. If it cannot provide any of them, it replies 406.`,

"How does HTTP caching work — ETag, Cache-Control, Last-Modified?":
`<code>Cache-Control</code> tells browsers and proxies how long they may reuse a response. An <code>ETag</code> is a version tag for a response; next time the client asks "has it changed since this tag?", and if not, the server replies <code>304 Not Modified</code> with no body. <code>Last-Modified</code> does the same job using a timestamp.`,

"REST vs GraphQL vs gRPC — how do you choose?":
`REST: simple and universal, great for public APIs and caching. GraphQL: one endpoint where clients choose exactly the data they need, great for apps with many different screens. gRPC: fast binary calls with strict contracts, great between internal services. Many systems use more than one.`,

"What is the difference between synchronous and asynchronous API design?":
`In a synchronous API the client waits until the work is finished, which is simple but ties the client to how fast and available you are. In an asynchronous API, the server accepts the request immediately (202 Accepted) and finishes later, telling the client through a status endpoint, a webhook or a message. Use async for slow or heavy work.`,

"How do you handle rate limiting?":
`Rate limiting caps how many requests a client may make, to protect your service. Common methods: a token bucket (allows short bursts while capping the average) or sliding windows. When a client goes over the limit, return <code>429 Too Many Requests</code> with a <code>Retry-After</code> header. With several servers, keep the counters in a shared store such as Redis or in the API gateway.`,

"How do you test a REST API?":
`Test at several levels: unit tests for the logic, controller tests (MockMvc) for request handling and validation, integration tests against a real database (Testcontainers), and contract tests so the API and its clients agree. Check error cases and security rules as well as the happy path.`,

"What is the difference between PUT and POST for creating a resource?":
`With <b>POST</b> to <code>/orders</code>, the server chooses the new id; sending it twice creates two orders. With <b>PUT</b> to <code>/orders/42</code>, the client chooses the id; sending it twice just sets the same order twice, so it is safe to repeat. Most APIs use POST for creating.`,

"How do you document an API and keep the docs honest?":
`Use OpenAPI (Swagger) to describe every endpoint, its input, output and errors, with examples. Either generate the document from your code so it cannot drift, or write it first and test your code against it. Publish it as an interactive page so people can try the API.`,

"What are webhooks and how do you implement them reliably?":
`A webhook is your system calling a client's URL when something happens, such as "order shipped", instead of the client asking repeatedly. To make it reliable: sign each message so the receiver can trust it, retry with increasing waits if delivery fails, include an event id so duplicates can be ignored, and let clients see failed deliveries.`
});
