appendTopic("system-design", [
{
  q: "Design a distributed ID generator",
  level: "advanced", hot: true, tags: ["design-question"],
  a: `<p><strong>Requirements:</strong> globally unique, roughly time-ordered (so database indexes stay efficient), high throughput, no single point of failure, and ideally not guessable.</p>
<table>
<tr><th>Approach</th><th>Pros</th><th>Cons</th></tr>
<tr><td>Database auto-increment</td><td>Simple, ordered</td><td>Single point of failure, does not scale writes</td></tr>
<tr><td>UUIDv4 (random)</td><td>No coordination at all</td><td>128-bit, <strong>random</strong> — destroys B-tree locality, causes index bloat</td></tr>
<tr><td><strong>UUIDv7</strong></td><td>Time-ordered, no coordination</td><td>Still 128-bit</td></tr>
<tr><td><strong>Snowflake</strong></td><td>64-bit, sortable, ~4M/sec per node</td><td>Needs machine IDs and clock discipline</td></tr>
<tr><td>Ticket server / range allocation</td><td>Compact, sequential</td><td>Central service, though ranges reduce the load</td></tr>
</table>
<pre><code>// Snowflake — 64 bits, the answer I would give
// | 1 unused | 41 bits timestamp (ms) | 10 bits machine id | 12 bits sequence |
public synchronized long nextId() {
    long now = System.currentTimeMillis();
    if (now &lt; lastTimestamp) throw new ClockMovedBackwardsException();   // must handle this
    if (now == lastTimestamp) {
        sequence = (sequence + 1) &amp; 0xFFF;              // 4096 ids per ms per node
        if (sequence == 0) now = waitNextMillis(lastTimestamp);
    } else {
        sequence = 0;
    }
    lastTimestamp = now;
    return ((now - EPOCH) &lt;&lt; 22) | (machineId &lt;&lt; 12) | sequence;
}</code></pre>
<p><strong>The detail that shows depth — why random UUIDs hurt:</strong> a B-tree index on a random key writes to a different page every time, so the working set never fits in cache, pages split constantly, and the index fragments. A time-ordered key appends to the rightmost page. On a large table this is the difference between a fast insert path and a slow one, and it is why UUIDv7 was standardised.</p>
<p><strong>Other points to raise:</strong> clock skew is the hard operational problem with Snowflake — NTP must be reliable, and you need a defined behaviour when the clock jumps backwards. Machine IDs can be assigned via ZooKeeper/etcd or derived from the pod ordinal in a StatefulSet. And if IDs must not be guessable (they appear in URLs), either use a random ID or expose a separate opaque public identifier, because sequential IDs leak your order volume to competitors.</p>`
},
{
  q: "Design a distributed cache like Redis",
  level: "advanced", tags: ["design-question"],
  a: `<p><strong>Requirements:</strong> sub-millisecond reads, horizontal scale, tolerate node failure, bounded memory with eviction.</p>
<p><strong>1. Data distribution.</strong> Use <strong>consistent hashing with virtual nodes</strong> so adding or removing a node remaps only ~1/N of keys rather than nearly all of them. Redis Cluster uses 16,384 fixed hash slots assigned to nodes — the same idea with simpler rebalancing, because you move slots rather than recompute a ring.</p>
<p><strong>2. Replication.</strong> Each shard has a primary and one or more replicas, replicating asynchronously. Async means a failover can lose the last few writes — an acceptable trade for a cache, unacceptable for a system of record.</p>
<p><strong>3. Failure detection and failover.</strong> Nodes gossip; when a quorum agrees a primary is down, a replica is promoted. Redis Sentinel or Cluster mode handles this. The key design point is avoiding <strong>split brain</strong> — require a majority to promote.</p>
<p><strong>4. Eviction.</strong> Memory is bounded, so define a policy:</p>
<pre><code>maxmemory 4gb
maxmemory-policy allkeys-lru       # or allkeys-lfu, volatile-ttl, noeviction</code></pre>
<p><strong>5. Persistence</strong> (optional for a cache): RDB snapshots are compact and fast to load but lose recent writes; AOF logs every write for better durability at higher cost. Many cache deployments disable both deliberately.</p>
<p><strong>The design questions worth raising unprompted:</strong></p>
<ul>
<li><strong>Hot keys</strong> — one celebrity key can saturate a single shard regardless of how well you hash. Mitigate with client-side local caching of hot keys, or key splitting (<code>key:1</code>…<code>key:N</code>).</li>
<li><strong>Cache stampede</strong> on expiry — use a single-flight lock or probabilistic early refresh.</li>
<li><strong>Thundering herd on restart</strong> — a cold cache sends full traffic to the database. Warm it, or roll restarts gradually.</li>
<li><strong>Single-threaded execution</strong> — Redis processes commands on one thread, which is why an <code>O(n)</code> command like <code>KEYS *</code> on a large keyspace blocks every other client. Use <code>SCAN</code>.</li>
</ul>`
},
{
  q: "Design a search / autocomplete system",
  level: "advanced", tags: ["design-question"],
  a: `<p><strong>Requirements:</strong> sub-100 ms suggestions as the user types, ranked by relevance and popularity, handling typos, updated as new content appears.</p>
<p><strong>Autocomplete (prefix search):</strong></p>
<ul>
<li><strong>Trie</strong> — the classic data structure. Each node holds a character; the path spells the prefix. Store the <em>top K completions at each node</em> so a lookup is O(prefix length) with no traversal of the subtree — that precomputation is the key optimisation.</li>
<li><strong>Memory</strong> — a full trie of every query is large; compress it (radix tree / DAWG) and keep it entirely in RAM, sharded by prefix.</li>
<li><strong>Ranking</strong> — weight by historical query frequency, recency, and personalisation. Frequencies are computed offline from a query log and pushed into the trie periodically; you do not update it per keystroke.</li>
<li><strong>Serving</strong> — the trie is read-mostly, so replicate it widely and rebuild rather than mutate.</li>
</ul>
<pre><code>Client types "lap"
 -&gt; debounce ~150ms client-side (do not query every keystroke)
 -&gt; CDN / edge cache (prefixes are highly repetitive — very high hit rate)
 -&gt; autocomplete service -&gt; in-memory trie shard -&gt; top 10 completions</code></pre>
<p><strong>Full-text search:</strong> use an <strong>inverted index</strong> — a map from term to the list of documents containing it, which is exactly what Elasticsearch/Lucene builds. Ranking is typically BM25, plus business signals. Handle typos with edit-distance (fuzzy) matching and n-grams, and use analyzers for stemming and stop words.</p>
<p><strong>Keeping the index current:</strong> do not write to the search index in the request path. Publish domain events, and let an indexer consume them and update Elasticsearch asynchronously — accepting a second or two of lag. That also gives you a natural rebuild path by replaying the topic.</p>
<p><strong>What to volunteer:</strong> for many applications PostgreSQL full-text search plus a <code>pg_trgm</code> index for fuzzy matching is entirely sufficient, and avoids operating a second datastore. Reach for Elasticsearch when you need faceting, relevance tuning and scale that genuinely exceeds the database.</p>`
},
{
  q: "Design a payment processing system",
  level: "advanced", hot: true, tags: ["design-question"],
  a: `<p><strong>Requirements:</strong> never double-charge, never lose a payment, be auditable, handle third-party gateway failures, and reconcile against the provider.</p>
<p><strong>The non-negotiables — this question is about correctness, not scale:</strong></p>
<ol>
<li><strong>Idempotency everywhere.</strong> Every charge request carries an <code>Idempotency-Key</code>; the same key returns the original result rather than charging again. The gateway (Stripe, Razorpay) supports this too — pass it through.</li>
<li><strong>Never store money as a floating-point number.</strong> Use <code>BigDecimal</code>, or an integer of minor units with an explicit currency. Always store the currency alongside the amount.</li>
<li><strong>Double-entry ledger.</strong> Every movement is two entries that sum to zero, and the ledger is <strong>append-only</strong> — you never update or delete a row, you post a reversing entry. Balances are derived, and can be recomputed from the ledger at any time.</li>
<li><strong>A state machine per payment</strong> with explicit terminal states: <code>INITIATED → AUTHORIZED → CAPTURED → SETTLED</code>, plus <code>FAILED</code>, <code>REVERSED</code>, <code>REFUNDED</code>. Illegal transitions must be impossible, not merely unlikely.</li>
<li><strong>Outbox pattern</strong> for publishing payment events, so the ledger write and the event are atomic.</li>
<li><strong>Webhooks from the gateway</strong> are the source of truth for asynchronous outcomes — verify the signature, treat them as at-least-once, and deduplicate by the provider's event ID.</li>
<li><strong>Reconciliation job</strong> — daily, compare your ledger against the provider's settlement report and alert on any discrepancy. This is not optional; timeouts and webhook losses guarantee drift eventually.</li>
</ol>
<pre><code>-- Ledger: append-only, no UPDATE, no DELETE
CREATE TABLE ledger_entry (
    id            bigserial PRIMARY KEY,
    transaction_id uuid NOT NULL,
    account_id    bigint NOT NULL,
    direction     text NOT NULL CHECK (direction IN ('DEBIT','CREDIT')),
    amount_minor  bigint NOT NULL CHECK (amount_minor &gt; 0),
    currency      char(3) NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (transaction_id, account_id, direction)     -- idempotent posting
);
-- Invariant, checkable at any time:
-- SELECT sum(CASE direction WHEN 'DEBIT' THEN amount_minor ELSE -amount_minor END) = 0</code></pre>
<p><strong>The framing that lands:</strong> "In payments I would rather be slow and correct than fast and wrong. Every design choice here — idempotency, append-only ledger, explicit states, reconciliation — exists so that after a failure I can always determine exactly what happened and repair it."</p>`
},
{
  q: "How do you design for observability from the start?",
  level: "advanced", tags: ["production", "architecture"],
  a: `<p>Observability is the ability to answer questions about your system that you did not anticipate. Design it in, because retrofitting it during an incident is impossible.</p>
<ol>
<li><strong>Correlation first.</strong> A trace ID generated at the edge, propagated through every HTTP call and message header (W3C <code>traceparent</code>), present in every log line, and returned to the client in error responses. Without this, nothing else composes.</li>
<li><strong>Structured logs.</strong> JSON with consistent field names — <code>traceId</code>, <code>userId</code>, <code>tenantId</code>, <code>operation</code>, <code>durationMs</code>. Log events, not prose.</li>
<li><strong>The RED metrics per endpoint and per dependency</strong> — Rate, Errors, Duration — plus saturation signals: queue depth, connection pool usage, consumer lag, thread pool rejection count.</li>
<li><strong>Business metrics alongside technical ones</strong> — orders placed per minute, payment success rate. These detect problems that technical metrics miss entirely: a deploy that leaves CPU and latency perfectly healthy while silently rejecting every order.</li>
<li><strong>Distributed tracing with sensible sampling</strong> — head-based sampling at 1–10%, plus tail-based sampling that always keeps errors and slow requests.</li>
<li><strong>Health endpoints that distinguish liveness from readiness.</strong></li>
<li><strong>Deploy markers on dashboards</strong> — so "what changed?" is answerable in seconds, which is the first question in every incident.</li>
</ol>
<pre><code>// One log line that is actually useful during an incident
{"ts":"2026-09-06T10:00:00Z","level":"ERROR","traceId":"b7d3f1a9",
 "service":"order-service","operation":"placeOrder","tenantId":"acme",
 "orderId":"ORD-42","durationMs":3021,"error":"PaymentTimeoutException",
 "downstream":"payment-gateway"}</code></pre>
<p><strong>Alert on symptoms, not causes.</strong> Page on SLO burn rate, error rate and p99 latency — things users feel. High CPU is not an incident; slow checkout is. Every alert needs a runbook, and an alert nobody acts on should be deleted, because alert fatigue is how real incidents get missed.</p>
<p><strong>The test of whether you have it:</strong> can you answer "why was this specific user's request slow at 14:32 yesterday?" If that requires adding logging and redeploying, you have monitoring, not observability.</p>`
},
{
  q: "Design a ride-hailing / delivery matching system",
  level: "advanced", tags: ["design-question"],
  a: `<p><strong>Requirements:</strong> match a rider to a nearby driver in seconds, track locations continuously, handle high write volume, and work in dense cities.</p>
<p><strong>The core problem is geospatial indexing</strong> — finding "drivers within 3 km" efficiently when locations update every few seconds.</p>
<table>
<tr><th>Approach</th><th>Notes</th></tr>
<tr><td>Naive distance to every driver</td><td>O(n) per query — impossible at scale</td></tr>
<tr><td><strong>Geohash</strong></td><td>Encode lat/long into a string prefix; nearby points share a prefix, so it becomes a prefix lookup. Simple, works with any key-value store</td></tr>
<tr><td><strong>Quadtree</strong></td><td>Recursively subdivide space; adapts to density (dense city centre = deeper tree)</td></tr>
<tr><td><strong>H3 / S2</strong></td><td>Hexagonal or spherical cell grids — Uber built H3 for exactly this; uniform neighbours, no geohash edge artefacts</td></tr>
<tr><td>PostGIS / Redis GEO</td><td>Ready-made, good enough for many systems</td></tr>
</table>
<pre><code>// Location updates: extremely high write volume, low durability requirement
Driver app -&gt; every 4s -&gt; location service
   -&gt; Redis GEOADD drivers:h3_8928308280f  &lt;lon&gt; &lt;lat&gt; driver-123   (TTL 30s)
   -&gt; also to Kafka for analytics/history (fire and forget)

// Matching
1. Rider requests -&gt; compute the rider's H3 cell
2. Query that cell + its ring of neighbours for candidate drivers
3. Filter: available, vehicle type, rating, direction of travel
4. Rank by ETA (road distance, not straight line) — call a routing service
5. Offer to the best driver with a short timeout; on decline or timeout, offer the next</code></pre>
<p><strong>Design points worth raising:</strong></p>
<ul>
<li><strong>Location writes do not need durability</strong> — a lost position is corrected 4 seconds later. Keep them in memory with a TTL; do not write them to your primary database.</li>
<li><strong>Straight-line distance is wrong</strong> — a driver across a river is 200 m away and 15 minutes distant. Rank by routing ETA.</li>
<li><strong>Avoid double-assignment</strong> — a driver must be offered to one ride at a time. Use an atomic compare-and-set on driver state, exactly like the parking-bay allocation problem.</li>
<li><strong>Surge and supply/demand</strong> — computed per cell on a short window, which is a natural stream-processing job.</li>
<li><strong>Geo-sharding</strong> — partition services and data by city or region; rides almost never cross those boundaries, so it shards naturally.</li>
</ul>`
},
{
  q: "How do you estimate and plan capacity for a new service?",
  level: "advanced", tags: ["estimation", "production"],
  a: `<p>Work forwards from user behaviour to infrastructure, stating assumptions aloud.</p>
<pre><code>1. TRAFFIC
   1M daily active users x 20 requests/day = 20M requests/day
   20M / 86,400 ≈ 230 QPS average
   Peak = 3x average ≈ 700 QPS       (traffic is never uniform)

2. LATENCY BUDGET (target p99 &lt; 300ms)
   network 20ms + auth 10ms + business logic 30ms + DB 40ms + serialise 10ms
   = 110ms baseline, leaving headroom for GC and outliers

3. THROUGHPUT PER INSTANCE
   Measured: one pod handles ~150 QPS at 60% CPU with p99 180ms
   700 peak QPS / 150 = 5 pods, + 2 for headroom and rolling deploys = 7
   Spread across 3 AZs so losing one zone leaves capacity

4. STORAGE
   20M requests/day x 2KB stored = 40GB/day = 14TB/year
   With 90-day retention: ~3.6TB hot, older archived to object storage

5. DATABASE
   Writes: 230 QPS x 20% = 46 writes/sec — comfortable for one primary
   Reads: 184 QPS, mostly cacheable -&gt; Redis absorbs ~80%, ~37 QPS reaches the DB
   Connection pool: 10 per pod x 7 pods = 70 connections (well under PostgreSQL limits)

6. BANDWIDTH
   700 QPS x 5KB response = 3.5 MB/s ≈ 28 Mbps peak</code></pre>
<p><strong>The principles behind the numbers:</strong></p>
<ul>
<li><strong>Measure one instance, then multiply.</strong> Guessing throughput per pod is the biggest source of error — load test to find it.</li>
<li><strong>Plan for peak, not average</strong>, and know your peak shape (daily cycle, weekly, seasonal, marketing spikes).</li>
<li><strong>Leave headroom</strong> — around 40%. Running at 90% CPU means no capacity for a rolling deploy, a retry storm, or a failed AZ.</li>
<li><strong>Identify the binding constraint</strong> — it is usually the database connections or a downstream API's rate limit, not your own CPU.</li>
<li><strong>State the growth assumption</strong> — capacity for today plus 12 months, with autoscaling for variance.</li>
</ul>
<p>Then say how you would validate it: a load test at 2× expected peak, and a soak test at expected peak for several hours to catch memory leaks and connection exhaustion that a short test misses.</p>`
}
]);
