appendTopic("system-design", [
{
  q: "Back-of-the-envelope estimation — the numbers every design round expects",
  level: "beginner", hot: true, tags: ["estimation", "design-question", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Flipkart", "Uber", "Walmart", "Swiggy", "Adobe"],
  a: `<p>You cannot size a system you have not measured. Estimation is the first five minutes of every design round, and interviewers care that the <em>method</em> is sound, not that the number is right.</p>
<table>
<tr><th>Latency</th><th>Time</th><th>Rule of thumb</th></tr>
<tr><td>L1 cache</td><td>~1 ns</td><td rowspan="3">In-process is free</td></tr>
<tr><td>L2 cache</td><td>~4 ns</td></tr>
<tr><td>Main memory</td><td>~100 ns</td></tr>
<tr><td>SSD random read</td><td>~100 µs</td><td>1,000× memory</td></tr>
<tr><td>Same-datacentre round trip</td><td>~0.5 ms</td><td>Cheap, but not free</td></tr>
<tr><td>Disk seek (HDD)</td><td>~10 ms</td><td>Avoid</td></tr>
<tr><td>India → US round trip</td><td>~150 ms</td><td>Physics. No amount of tuning fixes it.</td></tr>
</table>
<pre><code>// The four numbers to memorise, everything else is arithmetic
1 day        ≈ 86,400 s  ≈ 10^5 s        // so 1M/day ≈ 12 QPS
1 million    = 10^6
1 billion    = 10^9
2^10 ≈ 1 thousand, 2^20 ≈ 1 million, 2^30 ≈ 1 billion

// Worked example: 100M daily active users, each posting twice a day
writes/day  = 200M
write QPS   = 200M / 10^5 ≈ 2,000 QPS
peak QPS    ≈ 2-3x average ≈ 5,000 QPS
reads       = 100:1 ratio -> 200,000 read QPS   <- THIS is the design driver

// Storage: 200M posts/day x 1 KB = 200 GB/day
//          x 365 x 5 years ≈ 365 TB, x3 replication ≈ 1.1 PB</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Estimation flowing from users to the architectural decision">
  <rect class="dg-fill" x="12" y="50" width="120" height="46" rx="8"/>
  <text class="dg-s" x="72" y="70" text-anchor="middle">users / day</text><text class="dg-s" x="72" y="88" text-anchor="middle">100M</text>
  <path class="dg-line" d="M136 73 H166" marker-end="url(#es1)"/>
  <rect class="dg-fill" x="170" y="50" width="120" height="46" rx="8"/>
  <text class="dg-s" x="230" y="70" text-anchor="middle">QPS</text><text class="dg-s" x="230" y="88" text-anchor="middle">2k write / 200k read</text>
  <path class="dg-line" d="M294 73 H324" marker-end="url(#es1)"/>
  <rect class="dg-fill2" x="328" y="50" width="130" height="46" rx="8"/>
  <text class="dg-s" x="393" y="70" text-anchor="middle">bottleneck</text><text class="dg-s" x="393" y="88" text-anchor="middle">reads, 100:1</text>
  <path class="dg-line" d="M462 73 H492" marker-end="url(#es1)"/>
  <rect class="dg-box" x="496" y="50" width="112" height="46" rx="8"/>
  <text class="dg-s" x="552" y="70" text-anchor="middle">decision</text><text class="dg-s" x="552" y="88" text-anchor="middle">cache + replicas</text>
  <text class="dg-s" x="12" y="130">the number is not the point — the DECISION it forces is</text>
  <defs><marker id="es1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Capacity of one modern machine</th><th>Roughly</th></tr>
<tr><td>Web/app server</td><td>1,000–10,000 QPS</td></tr>
<tr><td>Postgres/MySQL</td><td>5,000–15,000 simple QPS</td></tr>
<tr><td>Redis</td><td>100,000+ ops/sec</td></tr>
<tr><td>Kafka broker</td><td>100,000+ msg/sec</td></tr>
<tr><td>RAM on one box</td><td>128 GB–2 TB</td></tr>
</table>
<p><strong>Why these matter:</strong> if your estimate says 5,000 write QPS, one database still handles it — so proposing sharding is over-engineering and the interviewer will say so. If it says 200,000 reads, you need caching and replicas, and saying that <em>from the number</em> is the whole exercise.</p>
<p><strong>Say this:</strong> "I'll round aggressively — 100k seconds a day, 100:1 read ratio, 3× peak. I'd rather be within an order of magnitude in thirty seconds than exact in ten minutes, because the number only has to be good enough to pick the architecture."</p>`
},
{
  q: "Design a chat system like WhatsApp or Slack",
  level: "advanced", hot: true, tags: ["design-question", "realtime", "must-know"],
  companies: ["Amazon", "Meta", "Google", "Microsoft", "Flipkart", "Swiggy", "Uber", "Salesforce"],
  a: `<p><strong>Clarify first:</strong> one-to-one only or groups? Group size cap? Delivery receipts? Message history retention? Online presence? Assume 1:1 plus groups to 500, with read receipts.</p>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Chat architecture with websocket servers and a message store">
  <rect class="dg-box" x="12" y="26" width="76" height="30" rx="6"/><text class="dg-s" x="50" y="46" text-anchor="middle">client A</text>
  <rect class="dg-box" x="12" y="106" width="76" height="30" rx="6"/><text class="dg-s" x="50" y="126" text-anchor="middle">client B</text>
  <path class="dg-line" d="M92 41 H140 M92 121 H140" marker-end="url(#ch1)"/>
  <text class="dg-s" x="116" y="86" text-anchor="middle">WS</text>
  <rect class="dg-fill" x="144" y="56" width="110" height="50" rx="8"/>
  <text class="dg-s" x="199" y="76" text-anchor="middle">WebSocket</text><text class="dg-s" x="199" y="94" text-anchor="middle">gateway</text>
  <path class="dg-line" d="M258 81 H306" marker-end="url(#ch1)"/>
  <rect class="dg-fill2" x="310" y="56" width="110" height="50" rx="8"/>
  <text class="dg-s" x="365" y="76" text-anchor="middle">chat service</text><text class="dg-s" x="365" y="94" text-anchor="middle">fan-out</text>
  <path class="dg-line" d="M424 70 H472 M424 92 H472" marker-end="url(#ch1)"/>
  <rect class="dg-box" x="476" y="52" width="132" height="26" rx="5"/><text class="dg-s" x="542" y="70" text-anchor="middle">message store</text>
  <rect class="dg-box" x="476" y="84" width="132" height="26" rx="5"/><text class="dg-s" x="542" y="102" text-anchor="middle">presence (Redis)</text>
  <text class="dg-s" x="12" y="158">the gateway holds the connection; the chat service owns the data. Separating them lets each scale on its own axis.</text>
  <defs><marker id="ch1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Decision</th><th>Choice</th><th>Why</th></tr>
<tr><td>Transport</td><td><strong>WebSocket</strong></td><td>Server must <em>push</em>. Long polling wastes connections; SSE is one-directional.</td></tr>
<tr><td>Message store</td><td>Cassandra / DynamoDB</td><td>Write-heavy, no joins, partition by <code>conversation_id</code>, cluster by <code>message_id DESC</code></td></tr>
<tr><td>Message ID</td><td><strong>Snowflake or UUID v7</strong></td><td>Time-sortable → "fetch messages after X" is a range scan</td></tr>
<tr><td>Presence</td><td>Redis with a TTL</td><td>Heartbeat refreshes it; no heartbeat = offline, no cleanup job needed</td></tr>
<tr><td>Offline delivery</td><td>Per-user inbox queue</td><td>Drain on reconnect</td></tr>
<tr><td>Which gateway holds a user?</td><td>Redis map <code>user → server</code></td><td>The chat service looks it up to route the push</td></tr>
</table>
<pre><code>// The ordering problem, which is the real depth in this question.
// Client clocks are unreliable and network order is not send order.
// Use a per-CONVERSATION sequence number assigned by the server:
//   messages within one conversation are totally ordered
//   across conversations, order does not matter
//
// Client sends with a local temp id -> server assigns seq + id -> echoes back.
// The sender's own UI reconciles the temp id. That is how a message can appear
// instantly and still be correctly ordered once acknowledged.</code></pre>
<table>
<tr><th>Group messages: fan-out</th><th>Trade-off</th></tr>
<tr><td>Write to one conversation log, readers pull</td><td><strong>Best for large groups</strong> — one write regardless of size</td></tr>
<tr><td>Copy into every member's inbox</td><td>Fast reads, but 500 writes per message</td></tr>
</table>
<p><strong>Follow-ups to be ready for:</strong> end-to-end encryption means the server cannot do search or server-side fan-out of plaintext — clients hold keys and the server only routes ciphertext. And "sent / delivered / read" is three separate acknowledgements, each its own small write, which is why read receipts are expensive at scale.</p>`
},
{
  q: "Design a ride-hailing service like Uber",
  level: "advanced", hot: true, tags: ["design-question", "geospatial", "realtime"],
  companies: ["Uber", "Amazon", "Google", "Swiggy", "Flipkart", "Walmart", "Microsoft"],
  a: `<p><strong>The hard part is geospatial matching:</strong> given a rider's location, find nearby available drivers in milliseconds, while millions of drivers move continuously.</p>
<table>
<tr><th>Approach</th><th>Problem</th></tr>
<tr><td><code>WHERE lat BETWEEN ... AND lng BETWEEN ...</code></td><td>Two independent B-tree ranges — the database still scans a huge box</td></tr>
<tr><td>Calculate distance to every driver</td><td>O(n) per request. Hopeless.</td></tr>
<tr><td><strong>Geohash / S2 / H3</strong></td><td><strong>The answer</strong> — turn 2D proximity into a 1D prefix match</td></tr>
</table>
<pre><code>// GEOHASH: interleave latitude and longitude bits into one string.
// Nearby points share a PREFIX, so proximity becomes a string prefix query.
//   tdr1y   -> ~5 km cell
//   tdr1yk  -> ~1 km cell
//   tdr1yk8 -> ~150 m cell
//
// Redis does this natively:
GEOADD drivers 77.5946 12.9716 "driver:421"
GEOSEARCH drivers FROMLONLAT 77.59 12.97 BYRADIUS 3 km ASC COUNT 20

// The edge case interviewers probe: two points either side of a cell BOUNDARY
// can be metres apart with different prefixes. Fix: search the cell AND its
// 8 neighbours. Uber's H3 uses hexagons partly because every neighbour is
// equidistant, which squares behave badly at.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Geohash cells with the rider cell and its neighbours searched">
  <g>
    <rect class="dg-box" x="40" y="20" width="42" height="42"/><rect class="dg-box" x="84" y="20" width="42" height="42"/><rect class="dg-box" x="128" y="20" width="42" height="42"/>
    <rect class="dg-box" x="40" y="64" width="42" height="42"/><rect class="dg-fill2" x="84" y="64" width="42" height="42"/><rect class="dg-box" x="128" y="64" width="42" height="42"/>
    <rect class="dg-box" x="40" y="108" width="42" height="42"/><rect class="dg-box" x="84" y="108" width="42" height="42"/><rect class="dg-box" x="128" y="108" width="42" height="42"/>
  </g>
  <circle class="dg-fill" cx="105" cy="85" r="6"/>
  <text class="dg-s" x="200" y="50">rider is in the shaded cell</text>
  <text class="dg-s" x="200" y="78">search that cell PLUS all 8 neighbours,</text>
  <text class="dg-s" x="200" y="100">or a driver 10 m away across the border</text>
  <text class="dg-s" x="200" y="122">is invisible</text>
</svg>
</figure>
<table>
<tr><th>Component</th><th>Design</th></tr>
<tr><td>Driver location updates</td><td>Every 4–5 s per driver. At 1M drivers that is ~200k writes/sec — <strong>Redis, never the primary DB</strong></td></tr>
<tr><td>Matching</td><td>Query the geo index, filter by availability and vehicle type, rank by ETA not straight-line distance</td></tr>
<tr><td>Trip state</td><td>A state machine: REQUESTED → MATCHED → ARRIVED → STARTED → ENDED → PAID</td></tr>
<tr><td>Trip record</td><td>Relational — it is money, and it needs transactions</td></tr>
<tr><td>Dispatch</td><td>Offer to the best driver with a timeout; on decline or timeout, offer the next</td></tr>
<tr><td>Surge pricing</td><td>Computed per cell from a supply/demand ratio, cached with a short TTL</td></tr>
</table>
<pre><code>// The race everyone misses: two riders matched to ONE driver.
// The driver's availability flag must be claimed ATOMICALLY.
UPDATE driver SET status='ASSIGNED', trip_id=:t
WHERE id=:d AND status='AVAILABLE';     -- 0 rows updated = someone else won
// Or Redis: SET driver:421:lock &lt;tripId&gt; NX EX 30
// Without this you double-book, and it only shows up under load.</code></pre>
<p><strong>The point to make:</strong> "Location writes and trip records have completely different requirements — one is 200k/sec, ephemeral and approximate; the other is low-volume, durable and financial. Putting both in the same store is the mistake. Redis for the geo index, a relational database for trips."</p>`
},
{
  q: "Design a distributed job scheduler",
  level: "advanced", tags: ["design-question", "distributed", "reliability"],
  companies: ["Amazon", "Google", "Flipkart", "Walmart", "Optum", "Uber", "Maersk", "Goldman Sachs"],
  a: `<p><strong>Requirements to pin down:</strong> one-off or recurring? At-least-once or exactly-once? Must a job run at its exact time, or is "within a minute" fine? How long can a job run?</p>
<pre><code>-- The single-node version, which is already most of the answer
CREATE TABLE job (
    id           bigserial PRIMARY KEY,
    run_after    timestamptz NOT NULL,
    status       text NOT NULL DEFAULT 'PENDING',
    attempts     int  NOT NULL DEFAULT 0,
    locked_until timestamptz,
    payload      jsonb
);
CREATE INDEX ON job (status, run_after) WHERE status = 'PENDING';

-- Workers claim jobs WITHOUT queueing behind each other
UPDATE job SET status='RUNNING', locked_until = now() + interval '5 min', attempts = attempts + 1
WHERE id = (
  SELECT id FROM job
  WHERE status='PENDING' AND run_after <= now()
  ORDER BY run_after
  FOR UPDATE SKIP LOCKED          -- the key: each worker takes a DIFFERENT row
  LIMIT 1
) RETURNING *;</code></pre>
<table>
<tr><th>Failure</th><th>Handling</th></tr>
<tr><td><strong>Worker dies mid-job</strong></td><td><code>locked_until</code> expires → another worker reclaims it. This is why a lease beats a boolean flag.</td></tr>
<tr><td>Job fails</td><td>Retry with exponential backoff; move to a dead-letter table after N attempts</td></tr>
<tr><td>Job runs twice</td><td><strong>Unavoidable</strong> under at-least-once — make the job idempotent</td></tr>
<tr><td>Job runs forever</td><td>Lease expires and a second copy starts. Jobs must tolerate that, or hold a separate exclusive lock.</td></tr>
<tr><td>Thundering herd at midnight</td><td>Jitter the <code>run_after</code>; rate-limit the claim query</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Workers claiming leased jobs from a shared table">
  <rect class="dg-fill2" x="230" y="20" width="160" height="40" rx="8"/><text class="dg-s" x="310" y="45" text-anchor="middle">job table (leased)</text>
  <path class="dg-line" d="M260 64 L140 100 M310 64 V100 M360 64 L480 100" marker-end="url(#js1)"/>
  <rect class="dg-fill" x="80" y="102" width="120" height="30" rx="6"/><text class="dg-s" x="140" y="122" text-anchor="middle">worker 1</text>
  <rect class="dg-fill" x="250" y="102" width="120" height="30" rx="6"/><text class="dg-s" x="310" y="122" text-anchor="middle">worker 2</text>
  <rect class="dg-fill" x="420" y="102" width="120" height="30" rx="6"/><text class="dg-s" x="480" y="122" text-anchor="middle">worker 3</text>
  <text class="dg-s" x="12" y="88">SKIP LOCKED means none of them wait on each other — they take different rows</text>
  <defs><marker id="js1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Scale</th><th>Move to</th></tr>
<tr><td>Up to a few thousand jobs/sec</td><td><strong>Postgres + SKIP LOCKED.</strong> Transactional with your business data — no dual-write problem.</td></tr>
<tr><td>Higher throughput, delays acceptable</td><td>Kafka with time-bucketed topics, or SQS with a visibility timeout</td></tr>
<tr><td>Millions of scheduled timers</td><td><strong>Hashed timing wheel</strong> — O(1) insert and expiry, which a sorted set is not</td></tr>
<tr><td>Cron across a cluster</td><td>Quartz with a JDBC store, or Kubernetes CronJob for coarse work</td></tr>
</table>
<p><strong>The honest answer on exactly-once:</strong> it does not exist across a process boundary. You get at-least-once delivery plus an idempotent job, which is <em>observably</em> exactly-once. Claiming true exactly-once is the answer that gets pushed back on.</p>`
},
{
  q: "Design an inventory and checkout system that never oversells",
  level: "advanced", hot: true, tags: ["design-question", "consistency", "concurrency"],
  companies: ["Amazon", "Flipkart", "Walmart", "Swiggy", "Myntra", "Paytm", "Optum", "Uber"],
  a: `<p>This is the design question where <strong>correctness beats scale</strong>. Selling one item twice is a customer-facing failure that no amount of throughput excuses.</p>
<pre><code>-- ✗ The read-modify-write race, which looks fine in testing
SELECT quantity FROM stock WHERE sku = 'X';   -- both see 1
if (quantity >= 1) UPDATE stock SET quantity = quantity - 1 ...;  -- both succeed

-- ✔ ONE atomic conditional statement. The database is the arbiter.
UPDATE stock SET quantity = quantity - :qty
WHERE sku = :sku AND quantity >= :qty;
-- 0 rows updated = insufficient stock. No lock held, no retry loop, no race.</code></pre>
<table>
<tr><th>Strategy</th><th>Use when</th><th>Cost</th></tr>
<tr><td><strong>Atomic conditional UPDATE</strong></td><td>Default — almost always</td><td>None. Simplest correct thing.</td></tr>
<tr><td>Optimistic (<code>@Version</code>)</td><td>Low contention, long user sessions</td><td>Retry on conflict</td></tr>
<tr><td>Pessimistic (<code>FOR UPDATE</code>)</td><td>Real contention on one row</td><td>Others block; deadlock risk</td></tr>
<tr><td><strong>Reservation with TTL</strong></td><td>Multi-step checkout — hold stock while the user pays</td><td>A sweeper to release expirations</td></tr>
<tr><td>Redis <code>DECRBY</code> + async reconcile</td><td>Flash sales, 100k+ req/sec</td><td>Eventual consistency; reconcile carefully</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Checkout saga with reservation, payment and confirmation">
  <rect class="dg-fill" x="12" y="50" width="120" height="44" rx="8"/>
  <text class="dg-s" x="72" y="68" text-anchor="middle">1. RESERVE</text><text class="dg-s" x="72" y="86" text-anchor="middle">stock, 15 min TTL</text>
  <path class="dg-line" d="M136 72 H166" marker-end="url(#in1)"/>
  <rect class="dg-fill" x="170" y="50" width="120" height="44" rx="8"/>
  <text class="dg-s" x="230" y="68" text-anchor="middle">2. PAY</text><text class="dg-s" x="230" y="86" text-anchor="middle">idempotency key</text>
  <path class="dg-line" d="M294 72 H324" marker-end="url(#in1)"/>
  <rect class="dg-fill2" x="328" y="50" width="120" height="44" rx="8"/>
  <text class="dg-s" x="388" y="68" text-anchor="middle">3. CONFIRM</text><text class="dg-s" x="388" y="86" text-anchor="middle">reservation → sold</text>
  <path class="dg-line" d="M388 98 V124" marker-end="url(#in1)"/>
  <rect class="dg-box" x="300" y="124" width="176" height="24" rx="5"/>
  <text class="dg-s" x="388" y="141" text-anchor="middle">payment fails → release the reservation</text>
  <text class="dg-s" x="12" y="130">stock is held, not sold, until money clears</text>
  <defs><marker id="in1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// The reservation model, which is what real checkouts use
CREATE TABLE reservation (
    id bigserial PRIMARY KEY,
    sku text, qty int, cart_id text,
    expires_at timestamptz NOT NULL
);
-- available = stock.quantity - SUM(active reservations)
-- A sweeper deletes expired rows; stock is never decremented until payment
-- clears, so an abandoned cart costs nothing.

// Payment must be idempotent or a retry charges twice:
// client-supplied Idempotency-Key, stored WITH the response in the SAME
// transaction as the charge.</code></pre>
<table>
<tr><th>Hot-row problem</th><th>Fix</th></tr>
<tr><td>One SKU, 50k concurrent buyers — every transaction serialises on one row</td><td><strong>Shard the counter:</strong> split 1,000 units into 10 rows of 100, pick one at random, fall through on failure. Ten-fold less contention.</td></tr>
<tr><td>Flash sale beyond that</td><td>Admit a bounded queue of buyers up front; reject the rest immediately rather than letting them queue on the database</td></tr>
</table>
<p><strong>Say this:</strong> "I would start with a single atomic conditional update, because it is correct with no locks and no retries, and it handles far more load than people expect. I would only add reservations when checkout becomes multi-step, and shard the counter only when a specific SKU is measurably hot."</p>`
}
]);
