registerSimple("microservices", {
"What is the CQRS pattern and when is it worth the complexity?":
`CQRS means using separate models for writing data and for reading it. Writes go to a model designed to enforce the business rules; reads come from a separate copy shaped for fast queries, kept up to date by events. It is worth it when reads and writes look very different or must scale differently, but it adds complexity and a short delay before reads catch up.`,

"What is event sourcing and what are its trade-offs?":
`Instead of storing only the current state (balance = 500), you store every event that happened (deposited 1000, withdrew 500) and work out the current state by replaying them. You get a complete history and can rebuild views at any time. The costs: more complex code, slower state rebuilding (helped by snapshots), and old events can never be changed.`,

"How do you handle distributed transactions without two-phase commit?":
`Two-phase commit locks data across services and breaks badly when one service is slow or down, so it is avoided. Instead, use a <b>saga</b>: each service does its part in its own local transaction and announces the result, and if a later step fails, earlier steps are undone with compensating actions. Combine it with the outbox pattern and idempotent consumers.`,

"What is the Backend for Frontend (BFF) pattern?":
`Instead of one general API for every kind of client, you build a small backend for each one: one for the web app, one for the mobile app. Each BFF gathers data from the underlying services and shapes it exactly for its screens, so clients make fewer calls and each team can change its BFF freely.`,

"How do you handle service versioning and contract evolution across teams?":
`Teams deploy at different times, so changes must not break other services. Make only additive changes where possible, have consumers ignore fields they do not know, use contract tests so a breaking change fails the build before it ships, and run old and new versions side by side when a real break is unavoidable.`,

"What is a service mesh and do you need one?":
`A service mesh adds a small proxy next to every service that handles networking for it: encryption between services, retries, timeouts, traffic splitting and metrics, without changing your code. Istio and Linkerd are examples. You need one with many services and teams; with a handful of services it is usually more complexity than it is worth.`,

"How do you migrate a shared database between microservices?":
`Untangle it gradually. Decide which service owns each table, make other services read that data through the owner's API or events instead of directly, copy the tables into the owner's own database while keeping both in sync, switch over, and finally remove the old shared tables. Never try to do it all at once.`,

"How do you decide between synchronous REST, async messaging and gRPC between services?":
`If the caller needs an answer right now to continue, use a synchronous call: REST, or gRPC for faster internal calls. If you are telling others that something happened and do not need to wait, use asynchronous messaging such as Kafka. Asynchronous calls keep services independent; synchronous calls are simpler but tie services' availability together.`,

"How do you handle schema and data migration across services during a release?":
`During a rolling deployment, old and new versions of a service run at the same time against the same database, so every change must work for both. Use "expand and contract": first add the new column or table alongside the old, then move code and data over, and only remove the old part in a later release.`,

"What is a distributed lock and when do you need one?":
`A distributed lock makes sure only one copy of a service, out of many, does something at a time, such as running a nightly job. It is usually built on Redis, a database or ZooKeeper, and always has an expiry time in case the holder crashes. Use it sparingly: database constraints or idempotent operations are often simpler and safer.`,

"How do you design service-level objectives and error budgets?":
`An SLI is a measurement, such as "the share of requests answered within 300 ms". An SLO is the target for it, such as "99.9% over 30 days". The error budget is the 0.1% you are allowed to miss. While budget remains, teams ship features quickly; when it runs out, they focus on reliability.`,

"How do you decide when a microservice is too big or too small?":
`Too big: several teams have to coordinate every change, or it has many unrelated reasons to change. Too small: services always have to change and deploy together, or one user action needs a long chain of calls. The right size is one business capability that one team can own and change independently.`,

"How would you split a monolith into microservices — walk me through your first 90 days":
`First understand the business and find natural boundaries (orders, payments and so on), add monitoring, and clean up the monolith's internal structure. Then extract one low-risk piece behind a routing layer, with its own data and pipeline, and learn from it. Only then continue, one service at a time, measuring as you go.`,

"How do you handle a downstream service being slow rather than down?":
`A slow service is more dangerous than a dead one, because your threads pile up waiting for it until your own service stops responding. Protect yourself with short timeouts, a circuit breaker that stops calling it once it is clearly struggling, a cap on concurrent calls (a bulkhead), and a fallback response.`,

"How do you test a microservice in isolation when it depends on five others?":
`Do not start all six services. Test your logic with unit tests, use Testcontainers for real databases and message brokers, fake the other services with tools such as WireMock, and use contract tests to make sure those fakes match how the real services actually behave.`,

"What is the difference between choreography and orchestration for a checkout flow?":
`In <b>choreography</b>, each service listens for events and reacts on its own, like dancers following the music; it is loosely coupled but the overall flow is hard to see. In <b>orchestration</b>, one coordinator service tells each service what to do next, like a conductor; the flow is clear and easy to monitor, but the coordinator knows about everyone.`,

"How do you propagate correlation IDs and user context across microservices?":
`Give every incoming request a trace id and pass it along in a header on every call and message it triggers, using the W3C <code>traceparent</code> standard. Include it in every log line so one request can be followed across all services. User identity travels the same way, usually as a token each service checks.`,

"How do you keep data consistent across services without distributed transactions?":
`Accept that data across services becomes consistent after a short delay rather than instantly. Use sagas for multi-step business processes with an undo step for each part, the outbox pattern to publish events reliably, idempotent consumers so repeated events are harmless, and design screens to show "processing" states.`,

"How do you implement resilience — circuit breakers, retries, timeouts and bulkheads?":
`<b>Timeouts</b>: never wait forever for a reply. <b>Retries</b>: try again for temporary errors, with growing waits. <b>Circuit breaker</b>: stop calling a service that keeps failing, and fail fast. <b>Bulkhead</b>: give each dependency its own limited share of resources, so one slow dependency cannot use them all. Libraries such as Resilience4j provide all of these.`,

"How do you decide service boundaries, and when should you not use microservices?":
`Draw boundaries around business capabilities that own their own data and can change independently, not around technical layers. Do not use microservices when the team is small, the business is still unclear, or you have no real need to scale or deploy parts separately; a well-structured monolith is simpler.`,

"How do services find and talk to each other, and where does a service mesh fit?":
`Services need to find each other's current addresses as instances come and go. In Kubernetes, built-in DNS names do this for you. Older setups use a registry such as Eureka. A service mesh adds smarter networking on top (encryption, retries, traffic control) through proxies placed next to each service.`,

"How do you handle distributed tracing and debug a request across ten services?":
`Distributed tracing gives each request a trace id and records a "span" for each step in each service, with timings. Tools such as Jaeger or Zipkin, fed by OpenTelemetry, show the whole request as a timeline, so you can see immediately which service was slow or failed, then jump to its logs using the same trace id.`,

"The dual-write problem and the outbox pattern — how do you publish an event and commit atomically?":
`If you save to the database and then publish to Kafka, a crash in between leaves them disagreeing. The outbox pattern fixes this: save the event in an outbox table in the same database transaction as your data, so both happen or neither does, and a separate process publishes outbox rows to Kafka and marks them sent.`,

"What is a distributed monolith, and how do you tell you have built one?":
`A distributed monolith looks like microservices but behaves like one big app: services must be deployed together, share a database, or call each other in long chains, so one change touches many services. You get all the network problems of microservices without their independence.`,

"Your API calls five other services per request. How do you keep its latency down?":
`Call independent services at the same time (in parallel) rather than one after another, so you wait only for the slowest. Give optional parts short timeouts and fallbacks, cache data that rarely changes, ask for data in batches, and pass a time budget down so slow calls give up early.`,

"Two services need the same data. Share the database, call an API, or replicate with events?":
`Do not share the database, because it ties both services to one table structure. Call the owning service's API when you need the very latest data and use it rarely. Keep your own copy, updated from its events, when you need the data often or must keep working while the owner is down. Sometimes you only need a snapshot copied at the right moment.`,

"What are microservices and what are the real trade-offs?":
`Microservices are small, independently deployable services, each owning one business capability and its data. You gain independent deployment, separate scaling and team autonomy. You pay with network failures, data consistency challenges, harder debugging and testing, and more infrastructure to run.`,

"How do you decide service boundaries?":
`Split along business capabilities, often found with Domain-Driven Design: orders, payments, inventory. Each service should own its data and be changeable by one team without coordinating with others. Splitting by technical layer, such as a "database service", creates services that always change together.`,

"How do microservices communicate? Synchronous vs asynchronous":
`<b>Synchronous</b> (REST, gRPC): the caller waits for an answer; simple, but if the other service is slow or down, the caller suffers too. <b>Asynchronous</b> (Kafka, RabbitMQ): the caller sends a message and carries on, and the other service handles it when it can; services stay independent, but results arrive later.`,

"What is the Saga pattern and how do you implement it?":
`A saga is a business process that spans several services, done as a sequence of local steps. Each step has an "undo" (compensating) action, so if a later step fails, earlier ones are undone, for example releasing reserved stock when a payment fails. It can be run by events (choreography) or by a coordinator (orchestration).`,

"What is a circuit breaker and how do you configure one?":
`A circuit breaker watches calls to another service. If too many fail, it "opens" and immediately rejects further calls for a while instead of waiting on timeouts, which protects your service. After a pause it lets a few test calls through, and closes again if they succeed. You configure the failure threshold, the waiting time and a fallback.`,

"What resilience patterns should every microservice have?":
`At minimum: a timeout on every outgoing call, retries with growing waits for temporary errors only, a circuit breaker for each dependency, limits on concurrent calls (bulkheads), fallbacks for optional features, idempotent handling of repeated requests, and health checks.`,

"What is service discovery and an API gateway?":
`<b>Service discovery</b> lets services find each other's current addresses as instances start and stop; in Kubernetes, DNS does this. An <b>API gateway</b> is the single entry point for outside clients: it routes each request to the right service and handles shared concerns such as login checks, rate limiting and logging.`,

"How do you handle distributed tracing and observability?":
`Use three kinds of data. <b>Logs</b> give details of what happened. <b>Metrics</b> show trends and trigger alerts. <b>Traces</b> follow one request across services. Connect them with a shared trace id in every log line, so from an alert you can find the exact failing request and its logs.`,

"How do you manage data consistency across microservices?":
`Each service owns its database, so there are no transactions spanning services. Keep data consistent over time with events: sagas for multi-step processes, the outbox pattern to publish events reliably, and idempotent consumers to handle duplicates. Accept a short delay before all services agree.`,

"What is the difference between orchestration and choreography?":
`<b>Orchestration</b>: one central service directs the others step by step, so the flow is easy to see and change in one place. <b>Choreography</b>: there is no central controller; each service reacts to events from the others, so services are more independent but the overall flow is spread out and harder to follow.`,

"How do you version and evolve microservice APIs without breaking consumers?":
`Prefer changes that only add things, such as new optional fields or new endpoints. Have consumers ignore fields they do not recognise. Use contract tests to catch breaking changes before release. When a real break is needed, run a new version alongside the old until every consumer has moved.`,

"What is idempotency in a distributed system and how do you achieve it?":
`In a distributed system, messages and requests can arrive more than once because of retries. Idempotent means processing the same thing twice has the same result as once. Achieve it with idempotency keys or unique message ids that you record and check, and with operations such as "set status to PAID" rather than "add 100".`,

"How do you handle configuration and secrets across many services?":
`Keep configuration outside the code, so the same build runs in every environment with different settings injected through environment variables or Kubernetes ConfigMaps. Keep secrets in a secret manager such as Vault, give each service only the secrets it needs, and rotate them regularly.`,

"How do you test microservices?":
`Use many fast unit tests, integration tests with real dependencies in containers, contract tests to check services agree on their APIs, and only a few end-to-end tests for the most important user journeys, because end-to-end tests across many services are slow and fragile.`,

"What is the strangler fig pattern for migrating a monolith?":
`Like a vine that slowly grows around a tree and replaces it, you put a routing layer in front of the monolith and move one feature at a time into a new service, sending that feature's traffic to the new service. The monolith shrinks gradually until nothing is left, with no risky big-bang rewrite.`,

"How do you deploy microservices safely — blue-green, canary, rolling?":
`<b>Rolling</b>: replace instances a few at a time. <b>Blue-green</b>: run the new version as a full second copy, then switch all traffic over at once, with instant switch-back. <b>Canary</b>: send a small share of traffic to the new version, watch error rates, then increase it gradually. All of them need old and new versions to work together.`,

"What are the anti-patterns in microservices?":
`Common mistakes: services that must always be deployed together, services sharing one database, long chains of synchronous calls, services split by technical layer instead of business area, services too tiny to be useful, and no tracing or monitoring to see what is going on.`
});
