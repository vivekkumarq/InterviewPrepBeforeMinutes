appendTopic("kafka", [
{
  q: "Consumer lag is growing in production — how do you diagnose and fix it?",
  level: "advanced", hot: true, tags: ["consumers", "production", "debugging", "performance"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Swiggy", "Goldman Sachs", "Uber"],
  a: `<pre><code># 1. Confirm and quantify
kafka-consumer-groups.sh --bootstrap-server $B --describe --group order-processor
# TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG  CONSUMER-ID
# orders 0          1000432         1042110         41678  consumer-1
# orders 1          1041980         1042050            70  consumer-2
#                                                     ^ ONE partition is behind

# 2. Is lag growing, flat, or shrinking? Only growing lag is an emergency.
# 3. Are all partitions behind, or one? -> the answer is different.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Skewed partition lag across a consumer group">
  <text class="dg-s" x="16" y="20">lag per partition</text>
  <rect class="dg-fill" x="16" y="30" width="300" height="24" rx="4"/><text class="dg-s" x="330" y="47">p0 — 41,678</text>
  <rect class="dg-fill2" x="16" y="62" width="22" height="24" rx="4"/><text class="dg-s" x="330" y="79">p1 — 70</text>
  <rect class="dg-fill2" x="16" y="94" width="18" height="24" rx="4"/><text class="dg-s" x="330" y="111">p2 — 55</text>
  <text class="dg-s" x="16" y="146">one hot partition = a key-skew problem, NOT a capacity problem — adding consumers will not help</text>
</svg>
</figure>
<table>
<tr><th>Pattern</th><th>Cause</th><th>Fix</th></tr>
<tr><td>All partitions lagging evenly</td><td>Not enough consumer throughput</td><td>Scale consumers up to the partition count; then add partitions</td></tr>
<tr><td><strong>One partition lagging</strong></td><td><strong>Key skew</strong> — a hot key sends everything to one partition</td><td>Change the partition key, or add a salt to the hot key</td></tr>
<tr><td>Lag spikes then recovers</td><td>Normal traffic burst, or a rebalance</td><td>Nothing, if it drains within the SLO</td></tr>
<tr><td>Lag flat but non-zero</td><td>Keeping up but permanently behind</td><td>Reduce per-message cost, or add capacity</td></tr>
<tr><td>Lag grows during rebalances</td><td>Rebalance storm — sessions timing out</td><td>Raise <code>max.poll.interval.ms</code>, lower <code>max.poll.records</code>, use cooperative rebalancing</td></tr>
<tr><td>Consumers idle but lag high</td><td>Poison message causing repeated failure and re-consumption</td><td>Dead-letter topic with a retry cap</td></tr>
</table>
<pre><code># The hard ceiling to state up front:
# MAX PARALLELISM = NUMBER OF PARTITIONS.
# 3 partitions and 10 consumers means 7 consumers sit completely idle.
# Adding partitions is easy; REMOVING them is not, and it breaks key ordering
# because the hash-to-partition mapping changes.

# Consumer tuning that actually moves the needle
max.poll.records=100            # smaller batches -> poll() returns more often
max.poll.interval.ms=300000     # must exceed the time to PROCESS one batch
fetch.min.bytes=50000           # fewer, larger fetches when throughput matters
enable.auto.commit=false        # commit AFTER processing, manually</code></pre>
<pre><code>// The rebalance trap that causes duplicate processing
// If processing a batch takes longer than max.poll.interval.ms, the broker
// assumes the consumer is dead and reassigns its partitions — while it is
// still working. The work is then done twice, and the commit fails.
//
// Fixes, in order of preference:
//   1. Reduce max.poll.records so a batch is quick
//   2. Move slow work to a separate thread pool and pause()/resume() the consumer
//   3. Raise max.poll.interval.ms — last resort, it slows genuine failure detection

// Parallelism WITHIN a partition, when ordering allows it
@KafkaListener(topics = "orders", concurrency = "3")   // 3 threads, up to 3 partitions</code></pre>
<p><strong>The emergency options, and their cost:</strong> you can skip ahead by resetting offsets to the end (<code>--reset-offsets --to-latest</code>), which drops the backlog entirely — acceptable for metrics, never for payments. Or you can spin up a temporary parallel consumer group to drain the backlog into a side channel. Both are trade-offs worth naming explicitly, because the interviewer wants to hear you weigh data loss against recovery time.</p>
<p><strong>What to monitor:</strong> lag per partition (not just the total, which hides skew), consumer poll latency, rebalance rate, and the age of the oldest unprocessed message — that last one is the metric that actually maps to a customer-visible SLO.</p>`
},
{
  q: "How do you handle a poison message and design retries in Kafka?",
  level: "advanced", hot: true, tags: ["reliability", "consumers", "production", "errors"],
  companies: ["Amazon", "Flipkart", "Optum", "Maersk", "Walmart", "SAP", "Societe Generale"],
  a: `<p><strong>The failure mode:</strong> a message that always throws. With auto-commit off and a naive retry, the consumer reprocesses it forever, the partition stops advancing, and lag grows without bound — a single bad record halts the whole partition.</p>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Retry topics with increasing delay feeding a dead letter topic">
  <rect class="dg-fill" x="16" y="60" width="104" height="34" rx="6"/><text class="dg-s" x="68" y="82" text-anchor="middle">orders</text>
  <path class="dg-line" d="M124 77 H172" marker-end="url(#kr1)"/>
  <text class="dg-s" x="148" y="68" text-anchor="middle">fail</text>
  <rect class="dg-fill2" x="176" y="60" width="112" height="34" rx="6"/><text class="dg-s" x="232" y="82" text-anchor="middle">orders.retry.5s</text>
  <path class="dg-line" d="M292 77 H340" marker-end="url(#kr1)"/>
  <rect class="dg-fill2" x="344" y="60" width="112" height="34" rx="6"/><text class="dg-s" x="400" y="82" text-anchor="middle">orders.retry.1m</text>
  <path class="dg-line" d="M400 98 V126" marker-end="url(#kr1)"/>
  <rect class="dg-box" x="316" y="126" width="170" height="32" rx="6"/><text class="dg-s" x="401" y="147" text-anchor="middle">orders.DLT — alert a human</text>
  <text class="dg-s" x="16" y="26">a failing message moves OFF the main topic immediately,</text>
  <text class="dg-s" x="16" y="44">so healthy messages behind it keep flowing</text>
  <text class="dg-s" x="480" y="80">each retry topic has</text>
  <text class="dg-s" x="480" y="98">its own consumer and delay</text>
  <defs><marker id="kr1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// Spring Kafka: non-blocking retries with a dead-letter topic
@RetryableTopic(
    attempts = "4",
    backoff = @Backoff(delay = 5000, multiplier = 4.0),      // 5s, 20s, 80s
    dltStrategy = DltStrategy.FAIL_ON_ERROR,
    exclude = { ValidationException.class }                  // never retry a 400-class error
)
@KafkaListener(topics = "orders", groupId = "order-processor")
public void handle(OrderEvent event) { service.process(event); }

@DltHandler
public void dlt(OrderEvent event,
                @Header(KafkaHeaders.EXCEPTION_MESSAGE) String error,
                @Header(KafkaHeaders.ORIGINAL_TOPIC) String origin) {
    log.error("dead-lettered from {}: {}", origin, error);
    alerting.raise("order-dlt", event.orderId());     // a DLT nobody watches is a black hole
}</code></pre>
<table>
<tr><th>Error type</th><th>Strategy</th></tr>
<tr><td><strong>Transient</strong> — timeout, 503, deadlock</td><td>Retry with exponential backoff and jitter</td></tr>
<tr><td><strong>Permanent</strong> — validation failure, unknown schema</td><td>Straight to the DLT; retrying will never help</td></tr>
<tr><td><strong>Poison</strong> — deserialisation failure</td><td><code>ErrorHandlingDeserializer</code>, then DLT. Otherwise the consumer cannot even <em>read</em> past it.</td></tr>
<tr><td>Downstream fully down</td><td>Pause the container and back off — do not burn the retry budget while it is known-down</td></tr>
</table>
<pre><code>// Blocking vs non-blocking retry — a decision that changes ordering guarantees
// BLOCKING (retry in place):     preserves ORDER, blocks the partition
// NON-BLOCKING (retry topics):   keeps the partition flowing, LOSES order

// So: for a payment pipeline where order matters, block and alert fast.
// For independent events, use retry topics. State which one the domain needs.

// Deserialisation errors must be handled at the DESERIALIZER, not the listener
spring.kafka.consumer.value-deserializer=\
  org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
spring.kafka.consumer.properties.spring.deserializer.value.delegate.class=\
  org.springframework.kafka.support.serializer.JsonDeserializer</code></pre>
<p><strong>Idempotency is the other half of the answer.</strong> Kafka is at-least-once by default, so every retry may reprocess a message that partly succeeded. Consumers must be idempotent — a unique constraint on the event id, an upsert, or a processed-events table written in the same transaction as the effect. Without that, retries create duplicates and the retry design makes things worse rather than better.</p>
<p><strong>Operational point to close on:</strong> "A dead-letter topic is only useful with a consumer, a dashboard and an alert. I have seen DLTs with two years of messages nobody looked at — at which point it is just a slower way to lose data. I also want a documented replay path, because the whole reason to keep the message is to reprocess it after the fix."</p>`
}
]);
