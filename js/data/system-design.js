registerTopic("system-design", [
{
  q: "How do you approach a system design interview?",
  level: "beginner", hot: true, tags: ["framework", "process"],
  a: `<p>Use a structure — interviewers score your <em>process</em> more than your final diagram.</p>
<ol>
<li><strong>Clarify requirements (5 min).</strong> Functional: what must it do? Non-functional: how many users, read/write ratio, latency target, consistency needs, availability target. <em>Ask, do not assume.</em></li>
<li><strong>Estimate scale (5 min).</strong> Back-of-envelope: QPS, storage per year, bandwidth. This drives every later decision.</li>
<li><strong>Define the API (5 min).</strong> A few endpoints or method signatures pin down the scope.</li>
<li><strong>Data model (5 min).</strong> Entities, relationships, and — critically — SQL or NoSQL <em>with a reason</em>.</li>
<li><strong>High-level design (10 min).</strong> Boxes and arrows: clients, load balancer, services, cache, database, queue.</li>
<li><strong>Deep dive (10 min).</strong> The interviewer will pick a component. Be ready to go deep on sharding, caching strategy, or the specific algorithm.</li>
<li><strong>Identify bottlenecks and scale (5 min).</strong> Single points of failure, hot partitions, cache stampede, what breaks at 10×.</li>
</ol>
<blockquote><p><strong>What actually scores points:</strong> stating trade-offs out loud ("I would use eventual consistency here because…"), driving the conversation, and admitting what you do not know. There is no single correct design; there is only justified reasoning.</p></blockquote>`
},
{
  q: "What numbers should you memorise for capacity estimation?",
  level: "beginner", hot: true, tags: ["estimation"],
  a: `<table>
<tr><th>Operation</th><th>Latency</th></tr>
<tr><td>L1 cache reference</td><td>~1 ns</td></tr>
<tr><td>Main memory reference</td><td>~100 ns</td></tr>
<tr><td>SSD random read</td><td>~100 µs</td></tr>
<tr><td>Round trip within a datacentre</td><td>~0.5 ms</td></tr>
<tr><td>Disk seek (HDD)</td><td>~10 ms</td></tr>
<tr><td>Round trip India → US</td><td>~150 ms</td></tr>
</table>
<p><strong>Useful conversions:</strong></p>
<ul>
<li>1 million requests/day ≈ <strong>12 QPS</strong>. 100 million/day ≈ 1,160 QPS.</li>
<li>Peak is typically <strong>2–3× average</strong>.</li>
<li>1 day ≈ 86,400 s ≈ 10⁵. 1 month ≈ 2.6 million s.</li>
<li>1 KB × 1 million = 1 GB. 1 KB × 1 billion = 1 TB.</li>
<li>A modern server handles roughly 1,000–10,000 QPS for simple work.</li>
</ul>
<pre><code>Example — Twitter-like feed:
  300M monthly active, 50% daily active  -&gt; 150M DAU
  Each posts 2 tweets/day                -&gt; 300M writes/day  -&gt; ~3,500 QPS avg, ~10K peak
  Each reads 100 tweets/day              -&gt; 15B reads/day    -&gt; ~175K QPS  (read heavy: 50:1)
  Tweet ~300 bytes + metadata ~1 KB      -&gt; 300 GB/day       -&gt; ~110 TB/year
Conclusion: read-heavy, so heavy caching and fan-out on write; storage is large but not extreme.</code></pre>
<p>Round aggressively and say your assumptions aloud — precision is not the point, the <em>shape</em> of the answer is.</p>`
},
{
  q: "Explain the CAP theorem and PACELC",
  level: "advanced", hot: true, tags: ["theory", "distributed"],
  a: `<p><strong>CAP:</strong> in the presence of a network <strong>P</strong>artition, a distributed system must choose between <strong>C</strong>onsistency (every read sees the latest write) and <strong>A</strong>vailability (every request gets a response).</p>
<figure class="fig">
<svg viewBox="0 0 560 170" role="img" aria-label="CAP theorem trade-offs">
  <rect class="dg-fill" x="30" y="30" width="150" height="60" rx="9"/>
  <text class="dg-t" x="105" y="55" text-anchor="middle">CP</text>
  <text class="dg-s" x="105" y="74" text-anchor="middle">consistent, may reject</text>
  <rect class="dg-fill2" x="205" y="30" width="150" height="60" rx="9"/>
  <text class="dg-t" x="280" y="55" text-anchor="middle">AP</text>
  <text class="dg-s" x="280" y="74" text-anchor="middle">available, may be stale</text>
  <rect class="dg-box" x="380" y="30" width="150" height="60" rx="9"/>
  <text class="dg-t" x="455" y="55" text-anchor="middle">CA</text>
  <text class="dg-s" x="455" y="74" text-anchor="middle">single node only</text>
  <text class="dg-s" x="105" y="112" text-anchor="middle">PostgreSQL, MongoDB,</text>
  <text class="dg-s" x="105" y="128" text-anchor="middle">HBase, ZooKeeper, etcd</text>
  <text class="dg-s" x="280" y="112" text-anchor="middle">Cassandra, DynamoDB,</text>
  <text class="dg-s" x="280" y="128" text-anchor="middle">CouchDB, Riak</text>
  <text class="dg-s" x="455" y="112" text-anchor="middle">not achievable in a</text>
  <text class="dg-s" x="455" y="128" text-anchor="middle">real distributed system</text>
  <text class="dg-s" x="280" y="158" text-anchor="middle">partitions are not optional — you only choose C or A</text>
</svg>
</figure>
<p><strong>The common misunderstanding:</strong> CAP is not "pick two". Partitions <em>will</em> happen, so P is mandatory; the real choice is C or A <em>during a partition</em>.</p>
<p><strong>PACELC</strong> extends it and is the more useful model: <em>if there is a <strong>P</strong>artition, choose <strong>A</strong> or <strong>C</strong>; <strong>E</strong>lse (normal operation), choose <strong>L</strong>atency or <strong>C</strong>onsistency.</em> This captures the everyday trade-off — even with a healthy network, waiting for a quorum costs latency.</p>
<ul>
<li>PostgreSQL with synchronous replication: PC/EC.</li>
<li>Cassandra with tunable consistency: PA/EL.</li>
<li>DynamoDB: PA/EL by default, PC/EC with strongly consistent reads.</li>
</ul>
<p><strong>The mature framing:</strong> this is a per-operation decision, not a per-system one. Payments need consistency; a follower count does not.</p>`
},
{
  q: "How does caching work and what are the caching strategies?",
  level: "advanced", hot: true, tags: ["caching", "performance"],
  a: `<p><strong>Where to cache:</strong> browser → CDN → API gateway → application (local/Caffeine) → distributed (Redis) → database buffer pool. Each layer is cheaper and faster than the next one down.</p>
<table>
<tr><th>Strategy</th><th>Read</th><th>Write</th><th>Use when</th></tr>
<tr><td><strong>Cache-aside</strong> (lazy loading)</td><td>App checks cache, on miss reads DB and populates</td><td>Write DB, invalidate cache</td><td>The default — most read-heavy workloads</td></tr>
<tr><td><strong>Read-through</strong></td><td>Cache itself loads from DB</td><td>—</td><td>Cleaner app code, needs cache library support</td></tr>
<tr><td><strong>Write-through</strong></td><td>—</td><td>Write cache and DB synchronously</td><td>Consistency matters; slower writes</td></tr>
<tr><td><strong>Write-behind</strong></td><td>—</td><td>Write cache, flush to DB async</td><td>Write-heavy; risk of loss on crash</td></tr>
<tr><td><strong>Refresh-ahead</strong></td><td>Refresh before expiry</td><td>—</td><td>Predictable hot keys, avoids miss latency</td></tr>
</table>
<p><strong>The three failure modes to name:</strong></p>
<ul>
<li><strong>Cache stampede / thundering herd</strong> — a popular key expires and 10,000 requests hit the database simultaneously. Fix with a mutex/single-flight (only one loader per key), probabilistic early expiry, or <code>@Cacheable(sync = true)</code>.</li>
<li><strong>Cache penetration</strong> — repeated queries for keys that do not exist bypass the cache every time. Fix by caching negative results with a short TTL, or a Bloom filter.</li>
<li><strong>Cache avalanche</strong> — many keys expire at the same instant. Fix by adding jitter to TTLs.</li>
</ul>
<p><strong>Invalidation</strong> is the hard part: TTL (simple, allows staleness), event-based invalidation (accurate, more coupling), or versioned keys (<code>user:42:v7</code> — never invalidate, just change the key). Always set a maximum size and eviction policy (LRU/LFU) — an unbounded cache is a memory leak.</p>`
},
{
  q: "What is load balancing and what algorithms exist?",
  level: "beginner", hot: true, tags: ["scaling"],
  a: `<table>
<tr><th>Algorithm</th><th>Behaviour</th><th>Good for</th></tr>
<tr><td>Round robin</td><td>Rotate through servers</td><td>Homogeneous servers, uniform requests</td></tr>
<tr><td>Weighted round robin</td><td>Proportional to capacity</td><td>Mixed hardware</td></tr>
<tr><td>Least connections</td><td>Fewest active connections</td><td>Variable request durations — usually the best default</td></tr>
<tr><td>Least response time</td><td>Fastest observed server</td><td>Latency-sensitive</td></tr>
<tr><td>IP hash / consistent hash</td><td>Same client → same server</td><td>Session affinity, cache locality</td></tr>
<tr><td>Random with two choices</td><td>Pick 2, choose the less loaded</td><td>Excellent in practice, very cheap</td></tr>
</table>
<p><strong>Layer 4 vs Layer 7:</strong> L4 balances on IP and port — fast, protocol-agnostic, no visibility into the request. L7 understands HTTP, so it can route by path or header, terminate TLS, and retry idempotent requests — at higher cost.</p>
<p><strong>Essential behaviours:</strong> active health checks with automatic removal of unhealthy instances, connection draining on shutdown, and no single point of failure (multiple LBs behind DNS or an anycast VIP).</p>
<p>Also worth mentioning: <strong>consistent hashing</strong> matters when the backend set changes — plain <code>hash % N</code> remaps almost every key when N changes, whereas consistent hashing with virtual nodes remaps only ~1/N. That is why it underpins Cassandra, DynamoDB and CDN routing.</p>`
},
{
  q: "How do you scale a database?",
  level: "advanced", hot: true, tags: ["database", "scaling"],
  a: `<p>In order — do not skip steps, most systems never need the last one:</p>
<ol>
<li><strong>Optimise first.</strong> Indexes, query rewrites, connection pooling, N+1 elimination. A missing index is far more often the problem than insufficient hardware.</li>
<li><strong>Vertical scaling.</strong> Bigger machine. Simple, immediate, and modern hardware goes a long way — but there is a ceiling and a single point of failure.</li>
<li><strong>Read replicas.</strong> Route reads to replicas, writes to the primary. Solves read-heavy workloads (the common case). Cost: <strong>replication lag</strong> — a user may not see their own write, so route read-your-own-writes to the primary.</li>
<li><strong>Caching.</strong> Redis in front of the database removes the majority of reads entirely.</li>
<li><strong>Vertical partitioning</strong> — split tables by column groups or move a subsystem's tables to their own database.</li>
<li><strong>Sharding (horizontal partitioning)</strong> — the last resort. Split rows across databases by a shard key.</li>
</ol>
<p><strong>Sharding strategies:</strong></p>
<ul>
<li><strong>Hash-based</strong> — even distribution, but range queries hit every shard and resharding is painful (use consistent hashing).</li>
<li><strong>Range-based</strong> — efficient range scans, but hotspots when data is skewed (everyone signs up this month).</li>
<li><strong>Directory-based</strong> — a lookup service maps key to shard. Flexible; the directory becomes a bottleneck and SPOF.</li>
<li><strong>Geo/tenant-based</strong> — natural for multi-tenant SaaS and data residency requirements.</li>
</ul>
<p><strong>What sharding costs you:</strong> cross-shard joins and transactions become application problems, unique constraints span shards, rebalancing is an operation, and every query must carry the shard key. Say this explicitly — it is why "just shard it" is the wrong first answer.</p>`
},
{
  q: "SQL vs NoSQL — how do you choose?",
  level: "beginner", hot: true, tags: ["database"],
  a: `<table>
<tr><th></th><th>SQL (PostgreSQL, MySQL)</th><th>NoSQL</th></tr>
<tr><td>Schema</td><td>Fixed, enforced</td><td>Flexible</td></tr>
<tr><td>Transactions</td><td>ACID across tables</td><td>Usually limited to one document/partition</td></tr>
<tr><td>Joins</td><td>Native and optimised</td><td>Application-side or denormalised</td></tr>
<tr><td>Scaling</td><td>Vertical + read replicas; sharding is manual</td><td>Horizontal by design</td></tr>
<tr><td>Query flexibility</td><td>Ad hoc SQL over anything</td><td>Optimised for known access patterns</td></tr>
</table>
<p><strong>NoSQL families and their fit:</strong></p>
<ul>
<li><strong>Document</strong> (MongoDB) — varied or evolving schemas, content, catalogues.</li>
<li><strong>Key-value</strong> (Redis, DynamoDB) — sessions, caches, feature flags, very high throughput point lookups.</li>
<li><strong>Wide-column</strong> (Cassandra, HBase) — massive write throughput, time series, write-heavy logs.</li>
<li><strong>Graph</strong> (Neo4j) — relationship traversal: social graphs, fraud rings, recommendations.</li>
<li><strong>Search</strong> (Elasticsearch) — full-text and faceted search.</li>
</ul>
<blockquote><p><strong>The answer that lands:</strong> "Default to PostgreSQL. It does JSONB, full-text search, arrays and geospatial, scales further than most people assume, and gives you transactions and ad hoc queries you will need. Move a specific workload to a specialised store when you have a measured reason — and expect to end up polyglot rather than choosing one for everything."</p></blockquote>`
},
{
  q: "Design a URL shortener (like bit.ly)",
  level: "advanced", hot: true, tags: ["design-question"],
  a: `<p><strong>1. Requirements.</strong> Shorten a URL; redirect; optional custom alias and expiry; analytics. 100M new URLs/day, read:write ≈ 100:1 → ~1,200 writes/s, ~120,000 reads/s. Latency &lt; 100 ms. Highly available — a broken redirect is a broken link forever.</p>
<p><strong>2. API.</strong></p>
<pre><code>POST /api/v1/urls { "longUrl": "...", "alias": "optional", "ttlDays": 365 }
  -&gt; 201 { "shortUrl": "https://sho.rt/aB3xY9" }
GET /{code}  -&gt; 301/302 redirect</code></pre>
<p><strong>3. The core question — how to generate the code:</strong></p>
<ul>
<li><strong>Hash the URL (MD5/SHA) and take 7 chars</strong> — deterministic, but collisions must be handled.</li>
<li><strong>Base62 of an auto-increment ID</strong> — no collisions ever, shortest codes, but sequential and guessable, and the counter is a bottleneck.</li>
<li><strong>Counter with a distributed range allocator</strong> (each instance claims a block of 10,000 IDs from ZooKeeper/Redis) — no collisions, no per-request coordination. <strong>This is the answer I would give.</strong></li>
<li>62⁷ ≈ 3.5 trillion codes — 7 characters is ample for 100M/day over decades.</li>
</ul>
<p><strong>4. Storage.</strong> A key-value store is the natural fit: <code>code → {longUrl, userId, createdAt, expiresAt}</code>. 100M/day × 500 bytes ≈ 50 GB/day → sharded by code hash. Cassandra or DynamoDB; PostgreSQL is fine at lower scale.</p>
<p><strong>5. The read path is everything.</strong> Redirects are 99% of traffic and the data is immutable — so cache aggressively. Redis with an LRU policy in front of the database gives a very high hit rate (link popularity follows a power law: the top 20% of links are ~80% of traffic). Put a CDN in front for geographic latency.</p>
<p><strong>6. Details that impress:</strong> use <strong>302</strong> (temporary) rather than 301 if you want analytics, because browsers cache 301 and you never see the second click. Handle abuse — rate limit creation, check submitted URLs against a malware list, and prevent redirect loops. Analytics should be fire-and-forget onto Kafka, never on the redirect's critical path.</p>`
},
{
  q: "Design a rate limiter",
  level: "advanced", hot: true, tags: ["design-question"],
  a: `<p><strong>Requirements.</strong> Limit requests per user/API key/IP; work across many application instances; low latency (it is on every request); fail open or closed by policy.</p>
<p><strong>Algorithms:</strong></p>
<table>
<tr><th>Algorithm</th><th>Memory</th><th>Accuracy</th><th>Bursts</th></tr>
<tr><td>Fixed window counter</td><td>Tiny</td><td>Poor — 2× burst at boundaries</td><td>Allowed at the edge</td></tr>
<tr><td>Sliding window log</td><td>High — timestamp per request</td><td>Exact</td><td>Smooth</td></tr>
<tr><td>Sliding window counter</td><td>Low</td><td>Very good approximation</td><td>Smooth</td></tr>
<tr><td><strong>Token bucket</strong></td><td>Two numbers per key</td><td>Good</td><td><strong>Allows controlled bursts</strong></td></tr>
<tr><td>Leaky bucket</td><td>Queue</td><td>Good</td><td>Smooths output to a constant rate</td></tr>
</table>
<p><strong>I would choose token bucket</strong> — it is cheap (store <code>tokens</code> and <code>lastRefillTime</code>), and allowing a burst while capping the average matches how real clients behave.</p>
<pre><code>-- Redis Lua script: atomic check-and-consume, one round trip
local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens') or capacity)
local last   = tonumber(redis.call('HGET', KEYS[1], 'ts') or now)
tokens = math.min(capacity, tokens + (now - last) * refillRate)
if tokens &lt; 1 then return 0 end
redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'ts', now)
redis.call('EXPIRE', KEYS[1], ttl)
return 1</code></pre>
<p><strong>Design points:</strong> the counter must be shared (Redis) or each of N instances allows the full quota; use a Lua script or Redis atomic operations to avoid a check-then-act race; return <code>429</code> with <code>Retry-After</code> and <code>X-RateLimit-*</code> headers; and decide the failure mode — if Redis is down, do you fail open (availability) or closed (protection)? For most APIs, fail open with an alert.</p>
<p>At very high scale, add a <strong>local first-tier limiter</strong> per instance with a fraction of the quota to avoid a Redis round trip on every request, syncing periodically — trading a little accuracy for a lot of latency.</p>`
},
{
  q: "Design a news feed (like Twitter/Instagram)",
  level: "advanced", hot: true, tags: ["design-question"],
  a: `<p><strong>The core decision — fan-out on write vs fan-out on read:</strong></p>
<table>
<tr><th></th><th>Fan-out on write (push)</th><th>Fan-out on read (pull)</th></tr>
<tr><td>On post</td><td>Write to every follower's feed cache</td><td>Do nothing</td></tr>
<tr><td>On read</td><td>Read one precomputed list — very fast</td><td>Query all followees and merge — slow</td></tr>
<tr><td>Cost</td><td>Expensive for users with millions of followers</td><td>Expensive for every read</td></tr>
<tr><td>Best for</td><td>Normal users; read-heavy systems</td><td>Celebrities; users who rarely log in</td></tr>
</table>
<p><strong>The real answer is hybrid</strong>, and saying so is the point of the question: fan out on write for ordinary users, and for celebrities (say, &gt;10,000 followers) do not fan out — instead, at read time, merge the precomputed feed with a live pull of the few celebrity accounts the user follows. This is what Twitter actually does.</p>
<p><strong>Components:</strong></p>
<ul>
<li><strong>Post service</strong> → writes the post, publishes an event to Kafka.</li>
<li><strong>Fan-out workers</strong> consume the event and push the post ID into each follower's feed list in Redis (a capped list of ~500–1,000 IDs).</li>
<li><strong>Feed service</strong> reads the ID list from Redis, then <em>hydrates</em> the posts from a cache/database in one batch.</li>
<li><strong>Graph service</strong> stores the follower relationships.</li>
<li><strong>Ranking</strong> — chronological is simplest; a ranked feed adds a scoring service using engagement signals.</li>
</ul>
<p><strong>Details worth raising:</strong> store IDs not content in the feed cache (so an edited or deleted post is handled at hydration); paginate by cursor, not offset; fan-out asynchronously so posting stays fast; and accept eventual consistency — a follower seeing a post a few seconds late is fine, and saying that explicitly shows you know where to spend consistency budget.</p>`
},
{
  q: "Design a chat application (like WhatsApp)",
  level: "advanced", tags: ["design-question"],
  a: `<p><strong>Requirements.</strong> One-to-one and group messaging, online presence, delivery and read receipts, message history, push notifications when offline, and ordering within a conversation.</p>
<p><strong>Transport.</strong> HTTP polling is wrong — use <strong>WebSocket</strong> for a persistent bidirectional connection. Each client holds a connection to a chat server; a <em>session/registry service</em> (Redis) maps <code>userId → serverId</code> so a message can be routed to whichever server holds the recipient's connection.</p>
<pre><code>Alice --WS--&gt; ChatServer1 --&gt; message queue / router --&gt; ChatServer7 --WS--&gt; Bob
                    |
                    +--&gt; message store (Cassandra)   +--&gt; push (APNs/FCM) if Bob offline</code></pre>
<p><strong>Storage.</strong> Messages are write-heavy, append-only, and queried by conversation and time — a perfect fit for <strong>Cassandra</strong> with partition key <code>conversationId</code> and clustering key <code>messageId</code> descending, so fetching the latest N messages is a single sequential read.</p>
<p><strong>Message IDs and ordering.</strong> Do not use timestamps — clocks are not synchronised and collisions happen. Use a <strong>Snowflake-style ID</strong> (timestamp + machine ID + sequence) which is roughly time-sortable and globally unique, or a per-conversation sequence number.</p>
<p><strong>Delivery semantics.</strong> Store first, then deliver, then acknowledge. The client acknowledges receipt, the server marks delivered, and read receipts are a separate event. The client must deduplicate by message ID because retries mean duplicates.</p>
<p><strong>Presence.</strong> A heartbeat every ~30 s writing to Redis with a TTL; absence of a heartbeat means offline. Do not broadcast presence to everyone — only to users currently viewing that contact, or you create an O(n²) storm.</p>
<p><strong>Things worth mentioning:</strong> group messages fan out (cap group size, or fan out asynchronously); end-to-end encryption means the server stores ciphertext and cannot search it; and offline users need a queue plus a push notification, with the message delivered when they reconnect.</p>`
},
{
  q: "What is consistent hashing and why does it matter?",
  level: "advanced", hot: true, tags: ["distributed", "algorithms"],
  a: `<p><strong>The problem with <code>hash(key) % N</code>:</strong> when N changes (a node is added or fails), almost every key maps to a different node. For a distributed cache that means a near-total cache miss storm; for a database it means moving nearly all the data.</p>
<p><strong>Consistent hashing</strong> maps both keys and nodes onto a conceptual ring (hash space 0 to 2³²−1). A key belongs to the first node clockwise from its position. Adding or removing a node only affects the keys between it and its neighbour — <strong>on average only K/N keys move</strong> instead of nearly all of them.</p>
<figure class="fig">
<svg viewBox="0 0 340 200" role="img" aria-label="Consistent hashing ring">
  <circle cx="170" cy="100" r="72" class="dg-line" fill="none" stroke-dasharray="4 4"/>
  <circle cx="170" cy="28" r="8" class="dg-fill"/><text class="dg-s" x="170" y="16" text-anchor="middle">Node A</text>
  <circle cx="242" cy="100" r="8" class="dg-fill"/><text class="dg-s" x="278" y="104" text-anchor="middle">Node B</text>
  <circle cx="170" cy="172" r="8" class="dg-fill"/><text class="dg-s" x="170" y="192" text-anchor="middle">Node C</text>
  <circle cx="98" cy="100" r="8" class="dg-fill"/><text class="dg-s" x="62" y="104" text-anchor="middle">Node D</text>
  <circle cx="221" cy="49" r="4" class="dg-fill2"/><text class="dg-s" x="236" y="42" text-anchor="middle">k1</text>
  <circle cx="228" cy="145" r="4" class="dg-fill2"/><text class="dg-s" x="248" y="152" text-anchor="middle">k2</text>
  <circle cx="112" cy="145" r="4" class="dg-fill2"/><text class="dg-s" x="92" y="156" text-anchor="middle">k3</text>
  <text class="dg-s" x="170" y="104" text-anchor="middle">key → first node</text>
  <text class="dg-s" x="170" y="120" text-anchor="middle">clockwise</text>
</svg>
</figure>
<p><strong>Virtual nodes</strong> solve the remaining problem: with only a few physical nodes, the ring is unevenly divided and load is skewed. Each physical node is placed at 100–200 positions on the ring, which smooths distribution and makes rebalancing after a failure spread across <em>all</em> remaining nodes rather than dumping onto one neighbour.</p>
<p><strong>Where it is used:</strong> Cassandra and DynamoDB partitioning, Memcached/Redis client-side sharding, CDN edge selection, and load balancers with sticky routing. Mention <strong>rendezvous hashing</strong> and <strong>jump consistent hash</strong> as simpler modern alternatives.</p>`
},
{
  q: "How do you design for high availability?",
  level: "advanced", tags: ["availability", "production"],
  a: `<table>
<tr><th>Availability</th><th>Downtime per year</th><th>Typical approach</th></tr>
<tr><td>99% (two nines)</td><td>3.65 days</td><td>Single server</td></tr>
<tr><td>99.9%</td><td>8.8 hours</td><td>Redundancy in one zone</td></tr>
<tr><td>99.99%</td><td>52 minutes</td><td>Multi-AZ, automated failover</td></tr>
<tr><td>99.999%</td><td>5 minutes</td><td>Multi-region, active-active</td></tr>
</table>
<p><strong>Principles:</strong></p>
<ol>
<li><strong>Eliminate single points of failure.</strong> Multiple instances of every component, across availability zones. Ask of every box in your diagram: what happens when this dies?</li>
<li><strong>Redundancy with automatic failover</strong> — and test the failover, because untested failover does not work.</li>
<li><strong>Graceful degradation</strong> — the recommendations service being down should hide a widget, not break checkout.</li>
<li><strong>Isolate failures</strong> — bulkheads, circuit breakers, and cell-based architecture so one bad tenant or shard cannot take down everyone.</li>
<li><strong>Remove correlated failure</strong> — the classic mistake is redundant instances that all depend on one database, one config service, or one certificate.</li>
<li><strong>Design for the failure of dependencies</strong> — timeouts, retries with jitter, fallbacks, and caching that can serve stale data during an outage.</li>
</ol>
<p><strong>Also:</strong> remember that availability multiplies through a synchronous chain — five services at 99.9% give 99.5% end to end. Reducing synchronous dependencies is often the highest-leverage availability work, more than adding replicas.</p>
<p>Round it off with the operational side: health checks that mean something, canary deploys with automatic rollback, runbooks, and chaos testing to verify the theory.</p>`
},
{
  q: "What is the difference between horizontal and vertical scaling?",
  level: "beginner", tags: ["scaling"],
  a: `<table>
<tr><th></th><th>Vertical (scale up)</th><th>Horizontal (scale out)</th></tr>
<tr><td>Method</td><td>Bigger machine</td><td>More machines</td></tr>
<tr><td>Limit</td><td>Hard ceiling</td><td>Effectively unlimited</td></tr>
<tr><td>Complexity</td><td>None — no code changes</td><td>Load balancing, statelessness, distributed data</td></tr>
<tr><td>Downtime</td><td>Usually requires a restart</td><td>Zero — add nodes live</td></tr>
<tr><td>Fault tolerance</td><td>Single point of failure</td><td>Built in</td></tr>
<tr><td>Cost curve</td><td>Superlinear at the high end</td><td>Roughly linear</td></tr>
</table>
<p><strong>The prerequisite for horizontal scaling is statelessness.</strong> If a server holds session state in memory, requests must be pinned to it, which breaks scaling and failover. Move state to Redis or a database, and the application layer becomes trivially scalable — this is why twelve-factor apps insist on it.</p>
<p><strong>Practical advice:</strong> scale vertically first — it is free in engineering time and modern hardware is enormous. Scale horizontally when you hit the ceiling, need fault tolerance, or need to scale components independently. The database is usually the part that resists horizontal scaling, which is why read replicas and caching come before sharding.</p>`
},
{
  q: "How would you design a notification system?",
  level: "advanced", tags: ["design-question"],
  a: `<p><strong>Requirements.</strong> Multiple channels (push, SMS, email, in-app), templating and localisation, user preferences and opt-out, deduplication, rate limiting per user, retries, and delivery tracking. Millions per day, bursty.</p>
<pre><code>Producers (any service)
    -&gt; Kafka topic: notification.requested
    -&gt; Notification service
         validate -&gt; check user preferences -&gt; deduplicate -&gt; render template
         -&gt; route per channel -&gt; channel topics
    -&gt; Channel workers (push / sms / email) -&gt; third-party providers
    -&gt; delivery status events -&gt; tracking store + DLQ</code></pre>
<p><strong>Design decisions worth articulating:</strong></p>
<ul>
<li><strong>Queue-based, always.</strong> The calling service must not wait on a third-party provider. Publishing an event decouples latency and failure.</li>
<li><strong>Separate queue per channel</strong> — SMS providers are slower and rate-limited differently from push; one channel's backlog must not block another.</li>
<li><strong>Preferences and quiet hours</strong> checked centrally, not by every producer — otherwise compliance is impossible to guarantee.</li>
<li><strong>Deduplication</strong> — a notification key (user + event type + entity) with a TTL prevents five duplicate emails when a retry storm happens upstream.</li>
<li><strong>Per-user rate limiting and digesting</strong> — batch "10 people liked your post" into one notification rather than ten.</li>
<li><strong>Retries with exponential backoff</strong> and a DLQ per channel; distinguish permanent failures (invalid number, unsubscribed) from transient ones and stop retrying permanents.</li>
<li><strong>Templates with versioning</strong> stored centrally, rendered at send time, with localisation by user locale.</li>
<li><strong>Provider abstraction and failover</strong> — an interface per channel with more than one provider, so an outage at one SMS vendor is a config change, not an incident.</li>
</ul>
<p>Track everything: requested → rendered → sent → delivered → opened → failed. Without that funnel you cannot debug "the customer says they never got the email".</p>`
},
{
  q: "What is eventual consistency and how do you design around it?",
  level: "advanced", tags: ["consistency", "distributed"],
  a: `<p><strong>Eventual consistency</strong> means that if no new updates occur, all replicas will <em>eventually</em> converge to the same value — but reads in the meantime may return stale data.</p>
<p><strong>The stronger guarantees you can build on top, and should name:</strong></p>
<ul>
<li><strong>Read-your-own-writes</strong> — a user always sees their own changes. Implement by routing that user's reads to the primary for a short window, or by pinning to the replica that has their write (using a version token).</li>
<li><strong>Monotonic reads</strong> — a user never sees time go backwards. Implement with session affinity to one replica.</li>
<li><strong>Causal consistency</strong> — if A caused B, everyone sees A before B. Implement with version vectors.</li>
</ul>
<p><strong>Designing around it in practice:</strong></p>
<ol>
<li><strong>Make the UI honest.</strong> Show a PENDING state rather than pretending the operation completed. Optimistic UI updates work well when paired with reconciliation.</li>
<li><strong>Choose consistency per operation.</strong> Payment balance: strong. Follower count, view count, search index: eventual. Say which and why.</li>
<li><strong>Idempotency and deduplication</strong> everywhere, since retries and reordering are normal.</li>
<li><strong>Conflict resolution strategy</strong> — last-write-wins (simple, loses data), version vectors, or CRDTs for genuinely concurrent edits.</li>
<li><strong>Monitor the lag.</strong> Replication lag and projection lag should be metrics with alerts; "eventually" must have a measured bound.</li>
<li><strong>Reconciliation jobs</strong> — a periodic sweep that detects and repairs divergence. Assume something will go wrong and build the repair path.</li>
</ol>
<blockquote><p>The engineering skill is not avoiding eventual consistency — it is knowing exactly <em>where</em> the business can tolerate it, and making that tolerance visible rather than accidental.</p></blockquote>`
},
{
  q: "How do you design a system for multi-tenancy?",
  level: "advanced", tags: ["saas", "architecture"],
  a: `<table>
<tr><th>Model</th><th>Isolation</th><th>Cost</th><th>Fit</th></tr>
<tr><td><strong>Database per tenant</strong></td><td>Strongest</td><td>Highest</td><td>Enterprise, regulated, data residency requirements</td></tr>
<tr><td><strong>Schema per tenant</strong></td><td>Good</td><td>Medium</td><td>Hundreds of tenants; per-tenant backup/restore</td></tr>
<tr><td><strong>Shared schema + tenant_id</strong></td><td>Logical only</td><td>Lowest</td><td>Thousands of tenants, standard SaaS</td></tr>
</table>
<p><strong>With a shared schema — the usual choice — the risks are all about leakage:</strong></p>
<ul>
<li><strong>Never rely on developers remembering <code>WHERE tenant_id = ?</code>.</strong> Enforce it structurally: a Hibernate filter, a base repository that always applies the predicate, or — best — PostgreSQL <strong>row-level security</strong> so the database itself refuses to return another tenant's rows.</li>
<li><strong>Derive the tenant from the authenticated token</strong> (a JWT claim), never from a request parameter or header a client can set.</li>
<li><strong>Propagate tenant context</strong> through async work and events — a ThreadLocal cleared in a finally block, and an explicit field on every message.</li>
<li><strong>Index on <code>(tenant_id, ...)</code></strong> as the leading column, or every query scans across tenants.</li>
<li><strong>Noisy neighbour</strong> — per-tenant rate limits and quotas, so one tenant's bulk import does not degrade everyone. Consider dedicating infrastructure for the largest tenants.</li>
<li><strong>Test isolation explicitly</strong> — a test that authenticates as tenant A and asserts it cannot read tenant B's data should exist for every endpoint.</li>
</ul>
<p>Also plan for per-tenant configuration, feature flags and plan limits, and for tenant lifecycle: onboarding, suspension, export and deletion (GDPR makes "delete everything for tenant X" a hard requirement — much easier with database-per-tenant, which is a genuine argument for it).</p>`
}
]);
