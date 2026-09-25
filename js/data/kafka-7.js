registerPrimer("kafka", `<h3>The mental model: an append-only log that many readers can replay</h3>
<p>A traditional queue hands a message to one consumer and then deletes it. Kafka is different: it is a <strong>log</strong>. Producers append records to the end, and records stay there for the retention period (say, seven days) whether or not anyone has read them. Each consumer simply remembers its <strong>offset</strong>, the position it has read up to. Two different services can read the same records independently, and a service can rewind and replay history.</p>
<p>A <strong>topic</strong> is split into <strong>partitions</strong> so that it can be spread over machines and read in parallel. Order is guaranteed <em>within</em> a partition, not across the whole topic. The record's <strong>key</strong> decides its partition, so all records with the same key stay in order.</p>
<figure class="fig">
<svg viewBox="0 0 620 244" role="img" aria-label="Kafka topic with three partitions as logs; producer hashes key to partition; consumer group of two consumers each owns partitions and tracks offsets">
  <defs><marker id="pr-kaf" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="10" y="86" width="100" height="62" rx="9"/>
  <text class="dg-t" x="60" y="108" text-anchor="middle">Producer</text>
  <text class="dg-s" x="60" y="124" text-anchor="middle">key = orderId</text>
  <text class="dg-s" x="60" y="138" text-anchor="middle">hash(key) % 3</text>
  <line class="dg-line" x1="110" y1="104" x2="148" y2="52" marker-end="url(#pr-kaf)"/>
  <line class="dg-line" x1="110" y1="117" x2="148" y2="117" marker-end="url(#pr-kaf)"/>
  <line class="dg-line" x1="110" y1="130" x2="148" y2="182" marker-end="url(#pr-kaf)"/>
  <text class="dg-t" x="150" y="22">topic: orders</text>
  <text class="dg-s" x="150" y="44">P0</text>
  <rect class="dg-box" x="170" y="32" width="30" height="26"/><text class="dg-m" x="185" y="50" text-anchor="middle">0</text>
  <rect class="dg-box" x="200" y="32" width="30" height="26"/><text class="dg-m" x="215" y="50" text-anchor="middle">1</text>
  <rect class="dg-box" x="230" y="32" width="30" height="26"/><text class="dg-m" x="245" y="50" text-anchor="middle">2</text>
  <rect class="dg-fill2" x="260" y="32" width="30" height="26"/><text class="dg-m" x="275" y="50" text-anchor="middle">3</text>
  <text class="dg-s" x="150" y="122">P1</text>
  <rect class="dg-box" x="170" y="104" width="30" height="26"/><text class="dg-m" x="185" y="122" text-anchor="middle">0</text>
  <rect class="dg-box" x="200" y="104" width="30" height="26"/><text class="dg-m" x="215" y="122" text-anchor="middle">1</text>
  <rect class="dg-fill2" x="230" y="104" width="30" height="26"/><text class="dg-m" x="245" y="122" text-anchor="middle">2</text>
  <text class="dg-s" x="150" y="186">P2</text>
  <rect class="dg-box" x="170" y="170" width="30" height="26"/><text class="dg-m" x="185" y="188" text-anchor="middle">0</text>
  <rect class="dg-box" x="200" y="170" width="30" height="26"/><text class="dg-m" x="215" y="188" text-anchor="middle">1</text>
  <rect class="dg-box" x="230" y="170" width="30" height="26"/><text class="dg-m" x="245" y="188" text-anchor="middle">2</text>
  <rect class="dg-box" x="260" y="170" width="30" height="26"/><text class="dg-m" x="275" y="188" text-anchor="middle">3</text>
  <rect class="dg-fill2" x="290" y="170" width="30" height="26"/><text class="dg-m" x="305" y="188" text-anchor="middle">4</text>
  <text class="dg-s" x="170" y="222">new records are appended on the right; old ones stay until retention expires</text>
  <rect class="dg-box" x="372" y="22" width="238" height="190" rx="10"/>
  <text class="dg-t" x="384" y="42">consumer group: billing</text>
  <rect class="dg-fill" x="388" y="56" width="206" height="56" rx="7"/>
  <text class="dg-t" x="400" y="76">Consumer A</text>
  <text class="dg-s" x="400" y="94">owns P0 (at offset 3), P1 (at 2)</text>
  <rect class="dg-fill" x="388" y="124" width="206" height="56" rx="7"/>
  <text class="dg-t" x="400" y="144">Consumer B</text>
  <text class="dg-s" x="400" y="162">owns P2 (at offset 4)</text>
  <text class="dg-s" x="384" y="200">each partition: exactly ONE consumer per group</text>
  <line class="dg-line" x1="292" y1="45" x2="386" y2="76" marker-end="url(#pr-kaf)" stroke-dasharray="3 3"/>
  <line class="dg-line" x1="322" y1="183" x2="386" y2="152" marker-end="url(#pr-kaf)" stroke-dasharray="3 3"/>
</svg>
<figcaption>Same key, same partition, same order. More partitions let more consumers in a group work in parallel.</figcaption>
</figure>
<h3>Worked example: one order's events, end to end</h3>
<pre><code>// Producer: key by orderId so every event for one order lands in one partition
kafka.send("orders", order.id(), new OrderPlaced(order.id(), order.total()));
kafka.send("orders", order.id(), new OrderPaid(order.id()));
kafka.send("orders", order.id(), new OrderShipped(order.id()));
// All three hash to the same partition, so every consumer sees
// Placed -&gt; Paid -&gt; Shipped, never Shipped before Paid.

// Consumer: one group per SERVICE. Billing and email both get every event.
@KafkaListener(topics = "orders", groupId = "billing")
void bill(OrderEvent e) { ... }

@KafkaListener(topics = "orders", groupId = "email")
void email(OrderEvent e) { ... }

// Scaling billing: run 3 instances. Kafka assigns one partition to each.
// A 4th instance would sit idle: there are only 3 partitions to share.

// A billing instance crashes: its partitions are REASSIGNED to the
// survivors (a rebalance), which resume from the last COMMITTED offset.
// Anything processed but not yet committed is processed again, so
// consumers must be idempotent.</code></pre>
<h3>The settings that come up in every Kafka interview</h3>
<table>
<tr><th>Setting</th><th>Controls</th><th>Safe default</th></tr>
<tr><td><code>acks=all</code></td><td>Producer waits until all in-sync replicas have the record</td><td>On (default since Kafka 3.0)</td></tr>
<tr><td><code>enable.idempotence=true</code></td><td>Producer retries cannot create duplicates or reorder</td><td>On (default since 3.0)</td></tr>
<tr><td><code>replication.factor=3</code> + <code>min.insync.replicas=2</code></td><td>Survive one broker loss without losing acknowledged writes</td><td>Standard for production</td></tr>
<tr><td>Offset commit after processing</td><td>At-least-once delivery</td><td>Commit only when work is done</td></tr>
<tr><td>Partition count</td><td>Maximum parallelism per consumer group</td><td>Plan for peak throughput; increasing it later changes key placement</td></tr>
</table>`);

appendTopic("kafka", [
{
  q: "Size a Kafka topic for 50,000 events per second: partitions, retention and disk",
  level: "advanced", hot: true, tags: ["capacity-planning", "partitions", "retention", "system-design"],
  companies: ["Uber", "LinkedIn", "Swiggy", "Zomato", "Flipkart", "Walmart", "Confluent"],
  a: `<p>Capacity questions test whether you can reason with numbers instead of reciting defaults. State your assumptions, do simple arithmetic, add headroom, and say what you would measure.</p>
<pre><code>REQUIREMENTS (stated or assumed out loud)
  Peak rate:        50,000 events/s   (average is 20,000)
  Event size:       1 KB after serialisation
  Retention:        7 days            (consumers may replay a week)
  Replication:      3
  Consumers:        3 groups read everything (billing, search, analytics)</code></pre>
<p><strong>Step 1: throughput.</strong></p>
<pre><code>Write in:   50,000 × 1 KB           =  50 MB/s at peak
Replicated: 50 MB/s × 3             = 150 MB/s written to disk across the cluster
Read out:   50 MB/s × 3 groups      = 150 MB/s  (+ replication traffic between brokers)</code></pre>
<p><strong>Step 2: partitions.</strong> A partition is the unit of parallelism: in a consumer group, one partition feeds at most one consumer. So the partition count comes from the <em>slowest</em> side.</p>
<pre><code>Measured: one consumer instance processes 2,000 events/s
          (it writes each one to a database, so it is the bottleneck)

Needed consumers at peak:  50,000 / 2,000  = 25
Headroom for growth, and to catch up after an outage: × 2  -&gt;  50
Pick 48 or 60 (numbers with many divisors spread evenly across consumer counts)

Producer side, by contrast: one partition easily takes 10+ MB/s,
so 50 MB/s alone would need only about 5. The consumers decide.</code></pre>
<p><strong>Step 3: disk.</strong></p>
<pre><code>Average rate for storage (not peak): 20,000 × 1 KB = 20 MB/s
Per day:     20 MB/s × 86,400 s               ≈ 1.7 TB/day
7 days:      1.7 × 7                           ≈ 12 TB
× 3 replicas                                   ≈ 36 TB
With compression (lz4/zstd on JSON, often 3-5×): say ÷ 3   ≈ 12 TB
Keep disks below ~70% full for safety          ≈ 17 TB of raw disk

6 brokers  -&gt;  roughly 3 TB of disk each</code></pre>
<p><strong>Step 4: the catch-up check</strong>, which people forget. After a two-hour consumer outage, the backlog is:</p>
<pre><code>2 h × 20,000 events/s = 144 million events
With 50 consumers × 2,000/s = 100,000/s total capacity
New traffic still arrives at ~20,000/s, so net drain = 80,000/s
144,000,000 / 80,000 ≈ 30 minutes to catch up.          Acceptable?
If not: more partitions and consumers, or faster processing.</code></pre>
<table>
<tr><th>Decision</th><th>Driven by</th></tr>
<tr><td>Partition count</td><td>Consumer processing rate at peak, with 2× headroom</td></tr>
<tr><td>Broker count</td><td>Disk (retention × rate × replication) and network throughput</td></tr>
<tr><td>Retention</td><td>How far back consumers must be able to replay, not "forever just in case"</td></tr>
<tr><td>Compression</td><td>Almost always on; zstd or lz4 at the producer</td></tr>
</table>
<p><strong>Warnings worth adding:</strong> adding partitions later changes which partition a key maps to, so ordering by key breaks at that moment, which is why you size generously up front. Very high partition counts (tens of thousands per cluster) cost memory and rebalance time; KRaft raised the ceiling, but it still exists.</p>
<p><strong>The summary sentence:</strong> "Partitions come from consumer throughput, brokers come from disk and network, retention comes from how far back anyone must replay. Then check how long it takes to recover from a consumer outage."</p>`
},
{
  q: "Messages arrive out of order. Find the five ways ordering breaks in Kafka",
  level: "advanced", hot: true, tags: ["ordering", "partitions", "producer", "consumer", "debugging"],
  companies: ["Uber", "Goldman Sachs", "Razorpay", "PhonePe", "Swiggy", "Amazon", "LinkedIn"],
  a: `<p>"Kafka guarantees order within a partition" is true, and people repeat it as if it means order is guaranteed end to end. It does not. Here are the five ways events end up out of order in real systems, from most to least common.</p>
<p><strong>1. The key is wrong or missing.</strong></p>
<pre><code>kafka.send("orders", null, event);            // no key: spread across partitions
kafka.send("orders", event.eventId(), event);  // unique key per EVENT: same effect

// Paid lands in P2, Placed lands in P0. Different consumers, different speeds.
// Shipped can easily be processed before Placed.

kafka.send("orders", event.orderId(), event);  // key = the ENTITY whose order matters</code></pre>
<p><strong>2. The consumer processes a batch in parallel.</strong> Kafka delivers records in order; the consumer then scrambles them itself.</p>
<pre><code>@KafkaListener(topics = "orders")
void onBatch(List&lt;OrderEvent&gt; batch) {
    batch.parallelStream().forEach(this::handle);          // order lost here
    batch.forEach(e -&gt; executor.submit(() -&gt; handle(e)));  // and here
}
// Fix: process sequentially, or parallelise BY KEY - one lane per orderId
// (hash the key to one of N single-threaded executors), so different orders
// run in parallel while each order's events stay in sequence.</code></pre>
<p><strong>3. Retries through a separate retry topic.</strong> Event 1 fails and is sent to <code>orders-retry</code> to try again in 30 seconds. Event 2 for the same order succeeds immediately. When event 1 finally succeeds, it is applied <em>after</em> event 2.</p>
<pre><code>Fixes, depending on what the business allows:
  - Blocking retries for ordered topics: retry in place, pause the partition
  - Park the whole KEY: once one event for order 42 goes to retry, route
    all later order-42 events there too until it is cleared
  - Make handlers order-tolerant (see 5)</code></pre>
<p><strong>4. The partition count changed.</strong> The partition is <code>hash(key) % partitionCount</code>. Going from 6 to 12 partitions moves many keys to a new partition. Events already in the old partition and new events in the new one are now read by different consumers, in any order, until the old ones drain.</p>
<p><strong>5. Producer retries with an older, non-idempotent setup.</strong> With <code>max.in.flight.requests.per.connection</code> above 1 and idempotence off, batch 1 fails, batch 2 succeeds, batch 1 is retried and lands after it. Since Kafka 3.0, <code>enable.idempotence=true</code> is the default and prevents this, but older clients and explicit overrides still exist in the wild.</p>
<table>
<tr><th>Cause</th><th>Where to look</th><th>Fix</th></tr>
<tr><td>Wrong or null key</td><td>Producer code</td><td>Key by the entity (orderId, accountId)</td></tr>
<tr><td>Parallel processing</td><td>Listener code, thread pools</td><td>Sequential, or parallel per key</td></tr>
<tr><td>Retry topics</td><td>Error-handling configuration</td><td>Blocking retry, or park the key</td></tr>
<tr><td>Partitions added</td><td>Topic change history</td><td>Size generously up front; migrate to a new topic if needed</td></tr>
<tr><td>Producer retries</td><td>Producer configuration</td><td><code>enable.idempotence=true</code></td></tr>
</table>
<p><strong>The defence that works no matter what: make consumers order-tolerant.</strong> Put a version or sequence number in each event, store the last applied version per entity, and ignore anything older.</p>
<pre><code>// UPDATE only if this event is newer than what we already applied
int rows = jdbc.update("""
    update order_view set status = ?, version = ?
    where order_id = ? and version &lt; ?""",
    e.status(), e.version(), e.orderId(), e.version());
// rows == 0: a stale or duplicate event. Skip it safely.</code></pre>
<p><strong>What to say:</strong> "Kafka only orders records inside one partition. I key by the entity, keep processing sequential per key, and still put a version on every event so that a retry or a repartition cannot apply an old state over a newer one."</p>`
}
]);
