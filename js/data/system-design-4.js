appendTopic("system-design", [
{
  q: "Design a URL shortener like bit.ly — walk through the whole design",
  level: "advanced", hot: true, tags: ["design-question", "scaling", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Flipkart", "Uber", "Walmart", "Adobe", "Swiggy"],
  a: `<p><strong>Step 1 — clarify and scope.</strong> Ask before designing: read/write ratio, custom aliases, expiry, analytics, and what the latency target is. Assume 100M new URLs a month and a 100:1 read/write ratio, so roughly 40 writes/sec and 4,000 reads/sec — <strong>read-heavy</strong>, which drives every decision that follows.</p>
<figure class="fig">
<svg viewBox="0 0 620 175" role="img" aria-label="URL shortener architecture with cache database and counter service">
  <rect class="dg-box" x="16" y="70" width="76" height="34" rx="6"/><text class="dg-s" x="54" y="92" text-anchor="middle">client</text>
  <path class="dg-line" d="M96 87 H140" marker-end="url(#us1)"/>
  <rect class="dg-fill" x="144" y="70" width="90" height="34" rx="6"/><text class="dg-s" x="189" y="92" text-anchor="middle">CDN / LB</text>
  <path class="dg-line" d="M238 87 H282" marker-end="url(#us1)"/>
  <rect class="dg-fill" x="286" y="70" width="94" height="34" rx="6"/><text class="dg-s" x="333" y="92" text-anchor="middle">app servers</text>
  <path class="dg-line" d="M384 78 H430" marker-end="url(#us1)"/>
  <rect class="dg-fill2" x="434" y="26" width="120" height="34" rx="6"/><text class="dg-s" x="494" y="48" text-anchor="middle">Redis (hot URLs)</text>
  <path class="dg-line" d="M384 96 H430" marker-end="url(#us1)"/>
  <rect class="dg-fill2" x="434" y="80" width="120" height="34" rx="6"/><text class="dg-s" x="494" y="102" text-anchor="middle">key-value store</text>
  <path class="dg-line" d="M333 108 V138" marker-end="url(#us1)"/>
  <rect class="dg-box" x="256" y="138" width="160" height="30" rx="6"/><text class="dg-s" x="336" y="158" text-anchor="middle">counter service (ZooKeeper ranges)</text>
  <text class="dg-s" x="300" y="16">cache hit ≈ 90%: reads rarely touch the DB</text>
  <defs><marker id="us1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<div class="cx"><b>Storage</b><span>100M/month × 5 years × ~500 bytes ≈ 3 TB</span><b>Key space</b><span>62⁷ ≈ 3.5 trillion — 7 base62 characters is ample</span></div>
<pre><code>// KEY GENERATION — the core design decision. Four options:
// 1. Hash the URL (MD5, take 7 chars)  -> collisions need a retry loop;
//    the same URL maps to the same key, which may or may not be wanted
// 2. Random 7 chars                    -> must check for existence on every write
// 3. AUTO-INCREMENT + base62 encode    -> no collisions, but keys are GUESSABLE
//    and a single counter is a bottleneck
// 4. COUNTER RANGES per server         -> each app server claims a block of
//    1,000,000 ids from ZooKeeper and hands them out locally. No coordination
//    per request, no collisions, and it survives a server dying (it just
//    burns the rest of its block).

String encode(long id) {                    // base62
    var sb = new StringBuilder();
    String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    while (id &gt; 0) { sb.append(ALPHABET.charAt((int)(id % 62))); id /= 62; }
    return sb.reverse().toString();
}</code></pre>
<table>
<tr><th>Decision</th><th>Choice</th><th>Reason</th></tr>
<tr><td>Database</td><td>Key-value store (DynamoDB, Cassandra)</td><td>No joins, no transactions, pure lookup by key — a relational DB buys nothing</td></tr>
<tr><td>Cache</td><td>Redis, LRU, cache-aside</td><td>Access is heavily skewed: a few links get most traffic</td></tr>
<tr><td>Redirect status</td><td><strong>302</strong>, not 301</td><td>301 is cached by the browser forever, so you lose all analytics and cannot change the target</td></tr>
<tr><td>Sharding</td><td>By the short key hash</td><td>Uniform distribution, and every read is a single-shard point lookup</td></tr>
<tr><td>Analytics</td><td>Async — publish a click event to Kafka</td><td>Never make the redirect wait for an analytics write</td></tr>
<tr><td>Expiry</td><td>TTL on the row, lazy cleanup</td><td>A scan-and-delete job over 3 TB is expensive; let the store expire it</td></tr>
</table>
<p><strong>The follow-ups to be ready for:</strong></p>
<ul>
<li><em>Custom aliases</em> — a separate uniqueness check with a conditional write, and reserve a blocklist of offensive or system words.</li>
<li><em>Rate limiting</em> — per API key with a token bucket in Redis, or shorteners get abused for spam within days.</li>
<li><em>Preventing abuse</em> — check destinations against a safe-browsing list asynchronously and disable flagged links.</li>
<li><em>Analytics at scale</em> — click events to Kafka, aggregated into a columnar store; never count in the redirect path.</li>
</ul>
<p><strong>How to present it:</strong> requirements and scale first, then the API, then the data model, then the high-level diagram, then one or two deep dives the interviewer picks. Stating your assumptions out loud ("I'll assume no custom aliases for now, and revisit it") is what lets you make progress instead of stalling on ambiguity.</p>`
},
{
  q: "How do you design a rate limiter, and which algorithm would you choose?",
  level: "advanced", hot: true, tags: ["design-question", "algorithms", "distributed"],
  companies: ["Amazon", "Google", "Uber", "Flipkart", "Walmart", "Stripe", "Adobe", "Optum"],
  a: `<table>
<tr><th>Algorithm</th><th>How it works</th><th>Trade-off</th></tr>
<tr><td><strong>Fixed window</strong></td><td>Count per clock minute</td><td>Simplest — but allows a <strong>2× burst</strong> at the window boundary</td></tr>
<tr><td><strong>Sliding window log</strong></td><td>Store every request timestamp</td><td>Exact, but memory grows with the request rate</td></tr>
<tr><td><strong>Sliding window counter</strong></td><td>Weighted blend of the current and previous window</td><td><strong>Good default</strong> — near-exact, O(1) memory</td></tr>
<tr><td><strong>Token bucket</strong></td><td>Tokens refill at a fixed rate; a request costs one</td><td><strong>Allows controlled bursts</strong> — what most APIs actually want</td></tr>
<tr><td><strong>Leaky bucket</strong></td><td>Queue drains at a constant rate</td><td>Smooths output completely; adds queueing latency</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Fixed window boundary burst compared with a token bucket">
  <text class="dg-s" x="16" y="20">fixed window — 100/min</text>
  <rect class="dg-fill" x="16" y="30" width="140" height="30" rx="4"/><text class="dg-s" x="86" y="50" text-anchor="middle">minute 1</text>
  <rect class="dg-fill" x="160" y="30" width="140" height="30" rx="4"/><text class="dg-s" x="230" y="50" text-anchor="middle">minute 2</text>
  <path class="dg-line" d="M120 66 V78 M196 66 V78"/>
  <text class="dg-s" x="160" y="94" text-anchor="middle">100 here + 100 here</text>
  <text class="dg-s" x="330" y="50">200 requests in 2 seconds,</text>
  <text class="dg-s" x="330" y="70">all "within the limit"</text>
  <text class="dg-s" x="16" y="122">token bucket — refills steadily, so a burst is bounded by the bucket SIZE</text>
  <rect class="dg-fill2" x="16" y="130" width="24" height="20" rx="3"/><rect class="dg-fill2" x="44" y="130" width="24" height="20" rx="3"/>
  <rect class="dg-fill2" x="72" y="130" width="24" height="20" rx="3"/><rect class="dg-box" x="100" y="130" width="24" height="20" rx="3"/>
  <rect class="dg-box" x="128" y="130" width="24" height="20" rx="3"/>
  <text class="dg-s" x="180" y="145">3 tokens left of 5</text>
</svg>
</figure>
<pre><code>-- Distributed token bucket in Redis. It MUST be atomic, or two app servers
-- read the same count and both allow the request.
-- A Lua script runs atomically on the Redis server:
local tokens   = tonumber(redis.call('HGET', KEYS[1], 'tokens') or ARGV[1])
local lastFill = tonumber(redis.call('HGET', KEYS[1], 'ts') or ARGV[4])
local refill   = (ARGV[4] - lastFill) * ARGV[2]        -- elapsed x rate
tokens = math.min(ARGV[1], tokens + refill)            -- cap at capacity

if tokens &lt; 1 then return 0 end                        -- reject
redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'ts', ARGV[4])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return 1                                               -- allow

-- Redis 7 alternative: the built-in CL.THROTTLE from RedisBloom, or simply
-- INCR + EXPIRE for a fixed window when approximate is good enough.</code></pre>
<table>
<tr><th>Design question</th><th>Answer</th></tr>
<tr><td>Where does it run?</td><td>API gateway for coarse limits; in the service for per-endpoint cost-based limits</td></tr>
<tr><td>What is the key?</td><td>API key &gt; user id &gt; IP. IP alone punishes everyone behind one NAT.</td></tr>
<tr><td>What do you return?</td><td><strong>429</strong> with <code>Retry-After</code>, plus <code>X-RateLimit-Limit/Remaining/Reset</code></td></tr>
<tr><td>What if Redis is down?</td><td><strong>Fail open</strong> for availability, or fail closed for protection — a deliberate choice, not an accident</td></tr>
<tr><td>Per-node or global?</td><td>Per-node is cheap and approximate; global needs shared state and adds a network hop</td></tr>
<tr><td>Different costs per endpoint?</td><td>Charge more tokens for expensive operations — the right model for GraphQL and search</td></tr>
</table>
<p><strong>The distributed-systems subtlety:</strong> with N app servers each enforcing limit/N locally, a client whose requests land unevenly gets throttled early. Shared state in Redis fixes that but adds a round trip to every request and makes Redis a single point of failure. A common compromise is a local token bucket synchronised periodically with a global count — approximate, but it survives Redis being unavailable.</p>
<p><strong>What to say:</strong> "I would use a token bucket in Redis with a Lua script for atomicity, keyed by API key. Token bucket because real clients are bursty and a fixed window either punishes legitimate bursts or allows a 2× spike at the boundary. And I would fail open if Redis is unreachable — losing rate limiting is better than losing the API, unless the limiter exists for abuse protection rather than capacity."</p>`
},
{
  q: "How do you scale a database — replication, sharding and caching?",
  level: "advanced", hot: true, tags: ["scaling", "database", "distributed", "must-know"],
  companies: ["Amazon", "Google", "Flipkart", "Walmart", "Uber", "Optum", "Swiggy", "Goldman Sachs"],
  a: `<p><strong>Do these in order.</strong> Each step adds complexity, so do not skip to sharding because it sounds impressive.</p>
<table>
<tr><th>#</th><th>Step</th><th>Buys you</th></tr>
<tr><td>1</td><td><strong>Indexes and query tuning</strong></td><td>Often 10–100×, for free. Always start here.</td></tr>
<tr><td>2</td><td><strong>Connection pooling</strong></td><td>Removes connection churn; PgBouncer caps cluster-wide connections</td></tr>
<tr><td>3</td><td><strong>Caching</strong></td><td>Removes most reads entirely — the biggest single win in a read-heavy system</td></tr>
<tr><td>4</td><td><strong>Read replicas</strong></td><td>Scales reads horizontally; writes still go to one primary</td></tr>
<tr><td>5</td><td><strong>Vertical scaling</strong></td><td>Boring and effective. Modern hardware goes a very long way.</td></tr>
<tr><td>6</td><td><strong>Partitioning</strong></td><td>Smaller indexes, cheap bulk deletes by dropping a partition</td></tr>
<tr><td>7</td><td><strong>Sharding</strong></td><td>Scales writes — and costs you joins, transactions and operational simplicity</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Primary with read replicas and a sharded write path">
  <rect class="dg-fill" x="16" y="20" width="110" height="32" rx="6"/><text class="dg-s" x="71" y="41" text-anchor="middle">writes</text>
  <path class="dg-line" d="M130 36 H176" marker-end="url(#db1)"/>
  <rect class="dg-fill2" x="180" y="20" width="100" height="32" rx="6"/><text class="dg-s" x="230" y="41" text-anchor="middle">primary</text>
  <path class="dg-line" d="M284 36 L340 20 M284 40 L340 56 M284 44 L340 92" marker-end="url(#db1)"/>
  <rect class="dg-box" x="344" y="6" width="96" height="26" rx="5"/><text class="dg-s" x="392" y="24" text-anchor="middle">replica 1</text>
  <rect class="dg-box" x="344" y="42" width="96" height="26" rx="5"/><text class="dg-s" x="392" y="60" text-anchor="middle">replica 2</text>
  <rect class="dg-box" x="344" y="78" width="96" height="26" rx="5"/><text class="dg-s" x="392" y="96" text-anchor="middle">replica 3</text>
  <text class="dg-s" x="452" y="42">reads fan out —</text>
  <text class="dg-s" x="452" y="60">but they are STALE</text>
  <text class="dg-s" x="452" y="78">by the replication lag</text>
  <text class="dg-s" x="16" y="130">read-after-write: send a user's read to the PRIMARY for a few seconds after their write,</text>
  <text class="dg-s" x="16" y="150">or they submit a form and see their own change missing</text>
  <defs><marker id="db1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// CACHING STRATEGIES
// Cache-aside (lazy):  read cache -> miss -> read DB -> populate. Most common.
//                      Risk: thundering herd on a popular key expiring.
// Write-through:       write cache and DB together. Cache always fresh, writes slower.
// Write-behind:        write cache, flush to DB async. Fast, risks data loss.
// Refresh-ahead:       refresh hot keys before they expire. Avoids the herd.

// The two problems that bite in production:
// 1. THUNDERING HERD — a hot key expires and 10,000 requests hit the DB at once.
//    Fix: a short lock so only one request rebuilds, or probabilistic early expiry.
// 2. CACHE STAMPEDE ON RESTART — an empty cache after a deploy.
//    Fix: warm the cache, or roll the deployment slowly.</code></pre>
<table>
<tr><th>Sharding key</th><th>Pros</th><th>Cons</th></tr>
<tr><td>Hash of user id</td><td>Even distribution</td><td>Range queries hit every shard</td></tr>
<tr><td>Range (date, id block)</td><td>Range queries stay local</td><td>Hot shard — all today's writes land on one</td></tr>
<tr><td>Geographic</td><td>Data locality, meets residency rules</td><td>Uneven — one region dominates</td></tr>
<tr><td>Directory / lookup table</td><td>Fully flexible, easy rebalancing</td><td>The lookup service becomes a dependency</td></tr>
</table>
<p><strong>What sharding actually costs</strong> — say this before proposing it: cross-shard joins stop working, so you denormalise or join in the application; transactions no longer span shards, so you need sagas; unique constraints across shards need a separate service; and <em>resharding is genuinely hard</em>, which is why consistent hashing exists — it moves only K/N keys when a node is added, instead of remapping everything.</p>
<p><strong>The framing that lands:</strong> "I would exhaust caching, replicas and vertical scaling first, because sharding permanently changes how the application is written. The right time to shard is when the write volume or the dataset genuinely exceeds one machine — and by then I want the shard key chosen from real access patterns, because changing it later is a migration nobody enjoys."</p>`
}
]);
