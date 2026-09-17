appendTopic("system-design", [
{
  q: "How do you structure the first ten minutes of a system design interview?",
  level: "beginner", hot: true, tags: ["system-design", "framework", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Flipkart", "Adobe", "Walmart", "Goldman Sachs"],
  a: `<p>The failure mode is jumping straight to boxes and arrows. Design rounds are graded on <em>process</em>, and a visible structure is most of the signal.</p>
<table>
<tr><th>Minutes</th><th>Phase</th><th>What you produce</th></tr>
<tr><td>0–5</td><td><strong>Requirements</strong></td><td>Functional list, non-functional targets, explicit out-of-scope</td></tr>
<tr><td>5–10</td><td><strong>Scale estimate</strong></td><td>QPS, storage per year, read:write ratio</td></tr>
<tr><td>10–15</td><td><strong>API + data model</strong></td><td>4–6 endpoints, the core tables or entities</td></tr>
<tr><td>15–30</td><td><strong>High-level design</strong></td><td>The box diagram, and the data flow through it</td></tr>
<tr><td>30–45</td><td><strong>Deep dive</strong></td><td>One or two components, chosen by the interviewer</td></tr>
<tr><td>45+</td><td><strong>Bottlenecks</strong></td><td>What breaks at 10×, and what you would do about it</td></tr>
</table>
<pre><code>// THE QUESTIONS TO ASK FIRST — every one changes the design
Scope:     Which features are in scope? What can I explicitly leave out?
Scale:     How many users? Daily active? Peak versus average?
Ratio:     Read-heavy or write-heavy? (Usually 100:1 reads — it drives caching)
Latency:   p99 target? Is 200 ms acceptable, or is this a trading system?
Consistency: Is stale data by a few seconds acceptable? (Almost always yes —
             and that single answer unlocks caching, replicas and async work)
Durability:  Can we ever lose a write? Payments no, "likes" probably yes.
Geography:   One region or global? Global means replication and data residency.</code></pre>
<pre><code>// NUMBERS TO HAVE MEMORISED — use round ones, do the arithmetic out loud
1 day            ≈ 86,400 s  (use 10^5 — nobody minds)
1 million DAU, 10 actions/day  -> ~100 QPS average, ~300 QPS peak (3x)
1 KB per record, 100M records/day -> 100 GB/day -> ~36 TB/year
Single Postgres instance    ~5-10k simple QPS, comfortably a few TB
Redis                       ~100k+ ops/s per node
Kafka                       ~millions of messages/s across a cluster
One modern server           ~10-50k concurrent connections

// Latency, the classic ladder
L1 cache       0.5 ns      Memory read      100 ns
SSD random     ~100 us     Disk seek        ~10 ms
Same-DC RTT    ~0.5 ms     Cross-continent  ~150 ms
// The last one is why CDNs exist and why chatty cross-region calls fail.</code></pre>
<table>
<tr><th>Habit</th><th>Why it scores</th></tr>
<tr><td>Write the requirements on the board and keep them visible</td><td>You can point back to them when justifying a trade-off</td></tr>
<tr><td>State assumptions aloud and move on</td><td>Waiting for permission burns the clock</td></tr>
<tr><td>Start with the <strong>simplest design that works</strong>, then scale it</td><td>Opening with Kafka and sharding looks like pattern-matching, not reasoning</td></tr>
<tr><td>Name the trade-off for every choice</td><td>"SQL, because I need transactions here; I would accept the sharding work later"</td></tr>
<tr><td>Say what you would monitor</td><td>Very few candidates do, and it reads as production experience</td></tr>
</table>
<p><strong>The most common losing move</strong> is designing for a billion users when asked for a million — over-engineering is judged as harshly as under-engineering. Start with one service, one database, one cache. Add a component only when you have named the specific bottleneck that forces it. "I'd begin with a single Postgres; at roughly 10k writes per second I'd expect to shard, and here is the key I'd shard on" is a much stronger answer than opening with a distributed everything.</p>`
},
{
  q: "Design a URL shortener, end to end",
  level: "advanced", hot: true, tags: ["system-design", "case-study", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart"],
  a: `<p>The classic opener. It looks trivial and every interesting decision hides in the details.</p>
<pre><code>// 1. REQUIREMENTS
Functional:     shorten(longUrl) -> shortUrl;  GET /{code} -> 301/302 redirect
                optional: custom alias, expiry, click analytics
Non-functional: redirects must be FAST (p99 < 50 ms) and highly available
                write:read ratio roughly 1:100 — this is a READ system

// 2. SCALE
100M new URLs/day  -> ~1,200 writes/s, ~3,000 at peak
100:1 reads        -> ~120,000 redirects/s
Storage: 100M x ~500 bytes = 50 GB/day -> ~18 TB/year. Plan for archival.

// 3. HOW LONG IS THE CODE?
base62 = [a-zA-Z0-9] -> 62 characters
62^6 =  56 billion    62^7 = 3.5 trillion
// 7 characters covers 100M/day for decades. Pick 7 and say why.</code></pre>
<table>
<tr><th>Code generation approach</th><th>Pros</th><th>Cons</th></tr>
<tr><td><strong>Counter + base62</strong></td><td>No collisions ever, short codes</td><td>Sequential = guessable and enumerable; needs a distributed counter</td></tr>
<tr><td>Hash the URL, take 7 chars</td><td>Stateless, idempotent for the same URL</td><td>Collisions must be detected and retried</td></tr>
<tr><td>Random 7 chars</td><td>Unguessable</td><td>Needs a uniqueness check on write</td></tr>
<tr><td><strong>Pre-generated key pool</strong></td><td>Write path is a single fast pop</td><td>An extra service to run and refill</td></tr>
</table>
<pre><code>// The answer that shows distributed-systems awareness:
// ZooKeeper or a DB sequence hands each app server a RANGE of counter values
// (say 1,000,000 at a time). The server allocates from its range in memory —
// no coordination per request — and fetches a new range when it runs out.
//
// Losing a range on a crash wastes a few million codes out of 3.5 trillion.
// That is the trade-off, and stating it is the point.

// Then base62-encode and, if sequential codes are a concern, XOR or permute
// the counter with a fixed secret so adjacent URLs are not adjacent codes.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 190" role="img" aria-label="Read path served from cache, write path allocating from a counter range">
  <rect class="dg-fill" x="16" y="24" width="90" height="38" rx="6"/><text class="dg-t" x="61" y="48" text-anchor="middle">client</text>
  <rect class="dg-fill" x="140" y="24" width="90" height="38" rx="6"/><text class="dg-t" x="185" y="48" text-anchor="middle">CDN / LB</text>
  <rect class="dg-fill" x="264" y="24" width="96" height="38" rx="6"/><text class="dg-t" x="312" y="48" text-anchor="middle">app</text>
  <rect class="dg-fill2" x="394" y="10" width="96" height="36" rx="6"/><text class="dg-t" x="442" y="32" text-anchor="middle">Redis</text>
  <rect class="dg-fill" x="394" y="62" width="96" height="36" rx="6"/><text class="dg-t" x="442" y="84" text-anchor="middle">store</text>
  <path class="dg-line" d="M106 43 L140 43 M230 43 L264 43 M360 36 L394 28 M360 52 L394 74"/>
  <text class="dg-s" x="500" y="32">~95% hit</text>
  <text class="dg-s" x="500" y="84">miss only</text>
  <text class="dg-s" x="16" y="124">READ: cache-aside on Redis, keyed by code. Codes are immutable, so cached</text>
  <text class="dg-s" x="16" y="144">entries never go stale — the easiest caching problem there is.</text>
  <text class="dg-s" x="16" y="172">WRITE: allocate from the in-memory counter range, encode, persist, cache.</text>
</svg>
</figure>
<table>
<tr><th>Decision</th><th>Choice and reason</th></tr>
<tr><td>Database</td><td><strong>Key-value</strong> (DynamoDB / Cassandra) — the only access pattern is by primary key, and it shards trivially on the code</td></tr>
<tr><td>Sharding key</td><td>The short code itself — uniformly distributed, and every read has it</td></tr>
<tr><td>Cache</td><td>Redis, cache-aside, LRU. Access is heavily Zipfian, so a small cache catches most traffic</td></tr>
<tr><td><strong>301 or 302?</strong></td><td><strong>302</strong>. A 301 is cached by the browser forever, which kills your analytics and prevents ever changing the target</td></tr>
<tr><td>Analytics</td><td>Fire an event to Kafka, aggregate offline. <strong>Never</strong> write a counter synchronously on the redirect path</td></tr>
<tr><td>Expiry</td><td>A TTL column plus a background cleanup job; lazily treat expired rows as missing on read</td></tr>
</table>
<pre><code>// THE FOLLOW-UPS, with one-line answers ready
// Custom alias?      Separate uniqueness check; reserve a namespace to avoid
//                    collisions with generated codes.
// Abuse / phishing?  Check against a safe-browsing list on write, rate limit
//                    per account, and support takedown by code.
// Analytics at scale? Kafka -> stream aggregation -> a columnar store. The
//                    redirect path only produces an event and never blocks.
// Global users?      Codes are immutable, so replicate read-only copies to
//                    every region and keep writes in one. Perfect fit.
// Hot key?           One viral link overwhelms a shard -> the CDN and local
//                    in-process caches absorb it before it reaches the store.</code></pre>
<p><strong>The insight to state explicitly:</strong> the mapping is <em>immutable</em>. That one property removes cache invalidation, makes replicas always correct, and is why this system scales so gracefully compared with anything that supports updates.</p>`
},
{
  q: "How do you make a distributed system resilient — timeouts, retries, circuit breakers and backpressure?",
  level: "advanced", hot: true, tags: ["resilience", "system-design", "microservices", "must-know"],
  companies: ["Amazon", "Netflix", "Uber", "Microsoft", "Goldman Sachs", "Flipkart", "Walmart", "SAP"],
  a: `<p>Every remote call can be slow, fail, or succeed after you gave up. Resilience is the set of defaults that stop one slow dependency from taking down everything upstream.</p>
<table>
<tr><th>Mechanism</th><th>Protects against</th><th>The detail that matters</th></tr>
<tr><td><strong>Timeout</strong></td><td>A hung dependency exhausting your threads</td><td>Every call needs one. A missing timeout is the single most common outage cause</td></tr>
<tr><td><strong>Retry</strong></td><td>Transient failures</td><td>Only for <em>idempotent</em> operations, with <strong>exponential backoff and jitter</strong></td></tr>
<tr><td><strong>Circuit breaker</strong></td><td>Hammering a service that is already down</td><td>Fail fast, then probe periodically to recover</td></tr>
<tr><td><strong>Bulkhead</strong></td><td>One dependency consuming every thread</td><td>Separate pools per dependency</td></tr>
<tr><td><strong>Rate limit</strong></td><td>Overload, abusive clients</td><td>Token bucket; return 429 with <code>Retry-After</code></td></tr>
<tr><td><strong>Backpressure</strong></td><td>A producer outrunning a consumer</td><td>Bounded queues; shed load rather than growing memory</td></tr>
<tr><td><strong>Fallback</strong></td><td>Total loss of a non-critical feature</td><td>Serve stale cache or a degraded response, never an error page</td></tr>
</table>
<pre><code>// RETRY STORMS — why naive retries make an outage worse
// A service slows down. Every client retries 3 times. Traffic TRIPLES against
// an already struggling service. It dies completely. Clients retry harder.
// That is a retry storm, and it converts a blip into a full outage.
//
// The three rules:
// 1. Exponential backoff WITH JITTER. Without jitter every client retries at
//    exactly the same moment and you get synchronised thundering herds.
       delay = min(cap, base * 2^attempt) * random(0.5, 1.5)
// 2. A retry BUDGET — e.g. retries may not exceed 10% of total requests.
// 3. NEVER retry at more than one layer. Retries at the gateway, the client
//    library AND the service turn 3 attempts into 27.</code></pre>
<pre><code>// CIRCUIT BREAKER — three states
CLOSED     normal; count failures in a sliding window
OPEN       failure rate crossed the threshold -> fail IMMEDIATELY, no call made
HALF_OPEN  after a wait, allow a few probes; success -> CLOSED, failure -> OPEN

// Resilience4j, the Spring Boot default
@CircuitBreaker(name = "inventory", fallbackMethod = "cachedStock")
@Retry(name = "inventory")
@Bulkhead(name = "inventory")
public Stock getStock(String sku) { return client.fetch(sku); }

public Stock cachedStock(String sku, Throwable t) {
    return cache.getStale(sku);       // degraded, not broken
}
// Order matters: Retry wraps CircuitBreaker by default, so retries happen
// INSIDE the breaker's accounting. Get this backwards and the breaker sees
// one failure where there were three.</code></pre>
<pre><code>// TIMEOUT BUDGETS — the part most candidates miss
// If the gateway times out at 1s, a chain of A(800ms) -> B(800ms) -> C(800ms)
// is nonsense: the client gave up long before C was asked.
//
// Each hop must get a SMALLER budget than its caller, and pass the remaining
// budget downstream. If less than the minimum remains, fail immediately
// rather than starting work whose result nobody will wait for.
gateway 1000ms -> A 800ms -> B 500ms -> C 300ms

// And always: timeout < the caller's timeout, retries included in the budget.</code></pre>
<table>
<tr><th>Failure mode</th><th>Defence</th></tr>
<tr><td>Thundering herd after a cache expiry</td><td>Jittered TTLs, request coalescing, early recomputation</td></tr>
<tr><td>Cascading failure</td><td>Circuit breakers plus bulkheads at every boundary</td></tr>
<tr><td>Slow dependency exhausting threads</td><td>Timeouts and a bounded, dedicated pool</td></tr>
<tr><td>Duplicate side effects from retries</td><td><strong>Idempotency keys</strong> — the client generates one, the server deduplicates</td></tr>
<tr><td>Queue growing without limit</td><td>Bounded queue with an explicit rejection policy</td></tr>
<tr><td>Recovery overwhelms a restarted service</td><td>Gradual ramp-up, health-check-gated traffic</td></tr>
</table>
<p><strong>The principle that ties it together:</strong> degrade, do not fail. A product page that shows the item without live stock is far better than a 500. Decide up front which dependencies are <em>critical</em> (no order without payment) and which are <em>optional</em> (recommendations, reviews) — then wire a fallback for every optional one and let the critical ones fail loudly.</p>`
}
]);
