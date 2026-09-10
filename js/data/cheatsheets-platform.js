registerSheet("rest-api", [
  { h: "Status codes that matter", t: "table", rows: [
    ["Code", "When"],
    ["200 / 201 / 204", "OK / Created (+ <code>Location</code>) / No content"],
    ["400", "Malformed request, missing field"],
    ["401 / 403", "Not authenticated / authenticated but not permitted"],
    ["404", "Does not exist (or you must not know it does)"],
    ["409", "Conflict — duplicate, version mismatch"],
    ["422", "Syntactically valid, semantically wrong"],
    ["429", "Rate limited — send <code>Retry-After</code>"],
    ["500 / 503", "Server fault / dependency down"]
  ]},
  { h: "Method semantics", t: "table", rows: [
    ["Method", "Safe", "Idempotent"],
    ["GET, HEAD", "Yes", "Yes"],
    ["PUT", "No", "<b>Yes</b>"],
    ["DELETE", "No", "<b>Yes</b>"],
    ["POST", "No", "<b>No</b> — needs an idempotency key"],
    ["PATCH", "No", "Depends on the body"]
  ]},
  { h: "Pagination", t: "table", rows: [
    ["", "Offset", "Keyset / cursor"],
    ["Jump to page N", "Yes", "No"],
    ["Deep pages", "<b>Slow</b> — scans and discards", "Constant time"],
    ["Concurrent inserts", "<b>Skips or repeats rows</b>", "Stable"],
    ["Use for", "Admin tables", "Feeds, infinite scroll, exports"]
  ]},
  { h: "Idempotency", t: "code", lang: "http", code:
"POST /api/payments\nIdempotency-Key: 4f3a2b1c-...      # CLIENT generates one per logical op\n\n# Store the key WITH the response, in the same transaction as the effect.\n# Same key + different body -> 422. Key still in flight -> 409 + Retry-After.\n# Use a unique constraint, not check-then-insert: two retries race." },
  { h: "Versioning", t: "list", items: [
    "URI path <code>/api/v1/...</code> — most common, visible, cacheable.",
    "<b>Non-breaking</b>: adding an optional field, a new endpoint, relaxing validation.",
    "<b>Breaking</b>: removing/renaming a field, changing a type, tightening validation.",
    "Tolerant reader: clients must ignore unknown fields, so the server can add freely.",
    "Announce removal with <code>Deprecation</code> and <code>Sunset</code> headers, and instrument usage per client."
  ]}
]);

registerSheet("graphql", [
  { h: "The three operations", t: "code", lang: "graphql", code:
"type Query    { order(id: ID!): Order }        # read\ntype Mutation { createOrder(input: NewOrder!): CreateResult! }   # write\ntype Subscription { orderUpdated(id: ID!): Order }              # stream\n\n# Queries run in PARALLEL, mutations run in SERIES — top to bottom." },
  { h: "Nullability", t: "table", rows: [
    ["Type", "List null?", "Items null?"],
    ["<code>[Order]</code>", "Yes", "Yes"],
    ["<code>[Order]!</code>", "No", "Yes"],
    ["<code>[Order!]</code>", "Yes", "No"],
    ["<code>[Order!]!</code>", "No", "No — the usual choice"]
  ]},
  { h: "Security controls", t: "table", rows: [
    ["Control", "Stops"],
    ["Depth limit (7–10)", "The nesting bomb"],
    ["Complexity scoring", "Wide, shallow, expensive queries"],
    ["<b>Persisted queries</b>", "<b>Arbitrary queries entirely</b> — strongest control"],
    ["Disable introspection in prod", "Trivial schema enumeration"],
    ["Rate limit by <i>cost</i>", "One expensive query ≠ ten cheap ones"],
    ["Field-level authorization", "Nesting from a public object into a private one"]
  ]},
  { h: "N+1 and DataLoader", t: "code", lang: "java", code:
"// Without batching: 1 query for orders, then 1 per order for its customer.\n@BatchMapping                       // Spring for GraphQL\npublic Map<Order, Customer> customer(List<Order> orders) {\n    return customerRepo.findAllById(ids(orders))...;   // ONE query\n}\n// This is the single most important GraphQL performance fix." },
  { h: "Errors", t: "list", items: [
    "GraphQL returns <b>HTTP 200</b> even on failure — errors live in the body.",
    "Partial data is normal: one failed field nulls itself, not the whole response.",
    "A non-null field that fails <b>bubbles up</b> and nulls its nearest nullable ancestor.",
    "Model expected failures in the schema (a union result); keep <code>errors</code> for bugs and outages."
  ]}
]);

registerSheet("kafka", [
  { h: "Core model", t: "list", items: [
    "A <b>topic</b> is split into <b>partitions</b>; a partition is an ordered, append-only log.",
    "Ordering is guaranteed <b>per partition</b>, never across a topic.",
    "The partition is chosen by <code>hash(key) % partitions</code> — same key, same partition.",
    "<b>Max parallelism = number of partitions.</b> Extra consumers sit idle.",
    "Consumers in a group each own partitions; offsets are committed per group."
  ]},
  { h: "Delivery semantics", t: "table", rows: [
    ["Guarantee", "Producer config", "Cost"],
    ["At most once", "<code>acks=0</code>", "Data loss"],
    ["<b>At least once</b>", "<code>acks=all</code> + retries", "<b>Duplicates — consumer must be idempotent</b>"],
    ["Exactly once", "<code>enable.idempotence=true</code> + transactions", "Throughput, complexity"]
  ]},
  { h: "Producer / consumer config", t: "code", lang: "properties", code:
"# Producer — durability\nacks=all\nenable.idempotence=true\nmin.insync.replicas=2        # broker/topic side; with RF=3 tolerates one loss\nlinger.ms=10                 # batch a little: big throughput win\ncompression.type=lz4\n\n# Consumer\nenable.auto.commit=false     # commit AFTER processing\nmax.poll.records=100         # keep a batch quick...\nmax.poll.interval.ms=300000  # ...or the broker assumes you died and rebalances" },
  { h: "Lag triage", t: "table", rows: [
    ["Pattern", "Cause"],
    ["All partitions lagging evenly", "Not enough consumer throughput"],
    ["<b>One partition lagging</b>", "<b>Key skew</b> — more consumers will not help"],
    ["Lag grows during rebalances", "Processing exceeds <code>max.poll.interval.ms</code>"],
    ["Consumers idle, lag high", "Poison message reprocessing forever"]
  ]},
  { h: "Commands", t: "code", lang: "bash", code:
"kafka-consumer-groups.sh --bootstrap-server $B --describe --group g\nkafka-topics.sh --bootstrap-server $B --describe --topic orders\nkafka-console-consumer.sh --bootstrap-server $B --topic orders --from-beginning\nkafka-configs.sh --bootstrap-server $B --entity-type topics --entity-name t --describe" }
]);

registerSheet("microservices", [
  { h: "Resilience patterns", t: "table", rows: [
    ["Pattern", "Protects against", "Key setting"],
    ["Timeout", "A hung dependency holding your threads", "Shorter than your own SLO"],
    ["Retry", "Transient blips", "<b>Backoff + jitter</b>, idempotent only"],
    ["Circuit breaker", "Hammering a service already down", "Failure rate over a sliding window"],
    ["Bulkhead", "One slow dep eating the whole pool", "Pool or semaphore per dependency"],
    ["Rate limiter", "Overwhelming a downstream", "Token bucket per client"],
    ["Fallback", "Total failure of a non-critical feature", "Cached or degraded response"]
  ]},
  { h: "Circuit breaker states", t: "list", items: [
    "<b>CLOSED</b> — calls pass; count failures.",
    "<b>OPEN</b> — fail fast immediately, no call made.",
    "<b>HALF-OPEN</b> — after the wait, let a few probes through.",
    "Probes succeed → CLOSED. Probe fails → OPEN again.",
    "Count <b>slow</b> calls as failures too — that catches degradation before an outage."
  ]},
  { h: "Data consistency", t: "table", rows: [
    ["Pattern", "Solves"],
    ["<b>Saga</b>", "Multi-service transactions without locks; compensations undo"],
    ["<b>Transactional outbox</b>", "Commit state and publish an event atomically"],
    ["Idempotent consumer / inbox", "At-least-once duplicates"],
    ["CQRS", "Read models shaped for queries"],
    ["Event sourcing", "Full audit trail — powerful and expensive"]
  ]},
  { h: "Good vs bad boundaries", t: "table", rows: [
    ["Good", "Bad"],
    ["Owns its data exclusively", "Shares a database"],
    ["Maps to a business capability", "Maps to a technical layer"],
    ["Deployable independently", "Always released together"],
    ["One team owns it", "Three teams edit it weekly"]
  ]},
  { h: "Say this", t: "quote", text: "Microservices are an organisational solution — they let teams deploy without coordinating. With one team they add network calls and eventual consistency to solve a coordination problem you do not have." }
]);

registerSheet("system-design", [
  { h: "Interview method", t: "list", items: [
    "<b>1. Clarify</b> — users, read/write ratio, latency target, what is out of scope.",
    "<b>2. Estimate</b> — QPS, storage per year, bandwidth. Say the assumptions aloud.",
    "<b>3. API</b> — the two or three endpoints that matter.",
    "<b>4. Data model</b> — then pick the store <i>from</i> the access pattern.",
    "<b>5. High level</b> — boxes and arrows.",
    "<b>6. Deep dive</b> — let the interviewer choose.",
    "<b>7. Bottlenecks</b> — what breaks at 10×, and the trade-offs you took."
  ]},
  { h: "Scaling a database, in order", t: "list", items: [
    "Indexes and query tuning — often 10–100×, free.",
    "Connection pooling (PgBouncer for a cluster-wide cap).",
    "Caching — removes most reads in a read-heavy system.",
    "Read replicas — scales reads; <b>they are stale</b>.",
    "Vertical scaling — boring and effective.",
    "Partitioning — smaller indexes, cheap bulk deletes.",
    "<b>Sharding</b> — scales writes, costs you joins and transactions."
  ]},
  { h: "CAP, honestly", t: "table", rows: [
    ["", "Means"],
    ["C", "Every read sees the latest write"],
    ["A", "Every request gets a response"],
    ["P", "Survives dropped messages between nodes"],
    ["Reality", "Partitions happen, so you choose <b>C or A</b> during one"],
    ["PACELC", "…and Else, latency vs consistency when there is no partition"]
  ]},
  { h: "Caching", t: "table", rows: [
    ["Strategy", "Behaviour"],
    ["Cache-aside", "Read cache → miss → DB → populate. Most common."],
    ["Write-through", "Write both; cache always fresh, writes slower"],
    ["Write-behind", "Write cache, flush async; fast, risks loss"],
    ["Refresh-ahead", "Refresh hot keys before expiry — avoids the herd"]
  ]},
  { h: "Two failure modes to name", t: "list", items: [
    "<b>Thundering herd</b> — a hot key expires and thousands hit the DB. Fix: a short rebuild lock, or probabilistic early expiry.",
    "<b>Retry storm</b> — retries at every layer multiply load. Three retries across four services is 81 requests for one action."
  ]}
]);

registerSheet("design-patterns", [
  { h: "Creational", t: "table", rows: [
    ["Pattern", "Use when", "In the JDK"],
    ["Singleton", "Exactly one instance", "<code>Runtime</code> — prefer DI"],
    ["Factory Method", "Subclass decides the type", "<code>Calendar.getInstance()</code>"],
    ["Abstract Factory", "Families of related objects", "<code>DocumentBuilderFactory</code>"],
    ["<b>Builder</b>", "Many optional params, immutability", "<code>StringBuilder</code>, <code>HttpRequest</code>"],
    ["Prototype", "Cloning is cheaper than building", "<code>Object.clone()</code>"]
  ]},
  { h: "Structural", t: "table", rows: [
    ["Adapter", "Make an incompatible interface fit", "<code>Arrays.asList</code>"],
    ["Decorator", "Add behaviour without subclassing", "<code>BufferedReader</code>"],
    ["Facade", "One simple door to a subsystem", "<code>JdbcTemplate</code>"],
    ["Proxy", "Control access, lazy-load, add cross-cutting", "Spring AOP"],
    ["Composite", "Treat a tree like a leaf", "Swing components"],
    ["Flyweight", "Share many small identical objects", "<code>Integer.valueOf</code> cache"]
  ]},
  { h: "Behavioural", t: "table", rows: [
    ["<b>Strategy</b>", "Swap an algorithm at runtime", "<code>Comparator</code>"],
    ["Observer", "Fan out state changes", "Spring events, listeners"],
    ["Template Method", "Fixed skeleton, variable steps", "<code>AbstractList</code>"],
    ["Chain of Responsibility", "Try handlers in order", "Servlet filters"],
    ["Command", "Encapsulate a request", "<code>Runnable</code>"],
    ["State", "Behaviour changes with state", "Order lifecycle"],
    ["Iterator", "Traverse without exposing internals", "<code>Iterator</code>"]
  ]},
  { h: "LLD interview method", t: "list", items: [
    "Clarify scope and state your assumptions — do not design in silence.",
    "Nouns → classes; verbs → methods. Model the domain first.",
    "Find what <b>varies</b> and put it behind an interface (Strategy).",
    "Name patterns as you apply them, and say <i>why</i>.",
    "Expect the concurrency follow-up: two users, one resource.",
    "Test: does a new requirement mean <b>adding</b> a class or <b>editing</b> one?"
  ]}
]);
