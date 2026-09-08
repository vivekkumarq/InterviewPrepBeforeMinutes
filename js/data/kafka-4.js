appendTopic("kafka", [
{
  q: "Design an order processing pipeline with Kafka — walk through the whole flow",
  level: "advanced", hot: true, tags: ["design", "scenario"],
  companies: ["Amazon", "Flipkart", "Walmart", "Swiggy", "Zomato", "Paytm", "Maersk"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 210" role="img" aria-label="Kafka order processing pipeline with outbox and DLT">
  <rect class="dg-box" x="10" y="14" width="100" height="38" rx="7"/><text class="dg-s" x="60" y="30" text-anchor="middle">Order API</text><text class="dg-s" x="60" y="45" text-anchor="middle">1 transaction</text>
  <path class="dg-line" d="M114 33 H164" marker-end="url(#k4)"/>
  <rect class="dg-fill" x="168" y="8" width="112" height="50" rx="8"/>
  <text class="dg-s" x="224" y="27" text-anchor="middle">orders table</text><text class="dg-s" x="224" y="45" text-anchor="middle">+ outbox table</text>
  <path class="dg-line" d="M284 33 H334" marker-end="url(#k4)"/>
  <rect class="dg-fill2" x="338" y="14" width="96" height="38" rx="7"/><text class="dg-s" x="386" y="30" text-anchor="middle">Debezium</text><text class="dg-s" x="386" y="45" text-anchor="middle">CDC relay</text>
  <path class="dg-line" d="M438 33 H488" marker-end="url(#k4)"/>
  <rect class="dg-fill" x="492" y="8" width="112" height="50" rx="8"/>
  <text class="dg-t" x="548" y="28" text-anchor="middle">orders.placed.v1</text><text class="dg-s" x="548" y="46" text-anchor="middle">key = orderId</text>
  <path class="dg-line" d="M548 62 V80 M200 80 H548 M200 80 V96 M374 80 V96 M548 80 V96"/>
  <rect class="dg-box" x="140" y="98" width="120" height="34" rx="7"/><text class="dg-s" x="200" y="119" text-anchor="middle">Inventory</text>
  <rect class="dg-box" x="314" y="98" width="120" height="34" rx="7"/><text class="dg-s" x="374" y="119" text-anchor="middle">Payment</text>
  <rect class="dg-box" x="488" y="98" width="120" height="34" rx="7"/><text class="dg-s" x="548" y="119" text-anchor="middle">Notification</text>
  <text class="dg-s" x="300" y="152" text-anchor="middle">each consumer group reads INDEPENDENTLY, dedupes by eventId</text>
  <path class="dg-line" d="M374 136 V158" marker-end="url(#k4)"/>
  <rect class="dg-fill2" x="300" y="160" width="150" height="30" rx="7"/><text class="dg-s" x="375" y="179" text-anchor="middle">orders.placed.v1.DLT</text>
  <defs><marker id="k4" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// 1. PRODUCE — atomically, via the outbox (never publish inside a business transaction)
@Transactional
public Order place(CreateOrderCommand cmd) {
    Order order = orderRepo.save(Order.from(cmd));
    outboxRepo.save(new OutboxEvent(UUID.randomUUID(), "orders.placed.v1",
                                    order.id(), toJson(OrderPlaced.from(order))));
    return order;                     // both rows commit together, or neither does
}

// 2. CONSUME — idempotent, at-least-once
@KafkaListener(topics = "orders.placed.v1", groupId = "inventory", concurrency = "3")
@Transactional
public void reserve(OrderPlaced event, Acknowledgment ack) {
    try {
        processedRepo.saveAndFlush(new ProcessedEvent(event.eventId()));  // unique constraint
    } catch (DataIntegrityViolationException duplicate) {
        ack.acknowledge(); return;                                         // already handled
    }
    inventoryService.reserve(event.orderId(), event.items());
    ack.acknowledge();
}</code></pre>
<p><strong>The design decisions to justify:</strong></p>
<ul>
<li><strong>Key by <code>orderId</code></strong> so every event for one order lands on the same partition and stays ordered relative to itself.</li>
<li><strong>One topic per aggregate</strong> (<code>orders.placed</code>, <code>orders.cancelled</code> on the same topic) rather than per event type — otherwise there is no ordering relationship between "placed" and "cancelled".</li>
<li><strong>Separate consumer groups</strong> so inventory, payment and notification each get every event and fail independently.</li>
<li><strong><code>acks=all</code> + <code>min.insync.replicas=2</code> + idempotent producer</strong> for no data loss.</li>
<li><strong>DLT with the original headers</strong> (topic, partition, offset, exception) so a poison message is diagnosable and replayable.</li>
</ul>
<p><strong>The question they follow up with:</strong> "what if payment succeeds but inventory fails?" — that is a saga. Publish <code>PaymentCompleted</code>, and on <code>StockReservationFailed</code> emit a compensating <code>RefundRequested</code>. There is no distributed transaction; you compensate forward with new events.</p>`
},
{
  q: "How do you guarantee exactly-once processing when writing to a database?",
  level: "advanced", hot: true, tags: ["semantics", "reliability"],
  companies: ["Amazon", "Goldman Sachs", "PayPal", "Walmart", "Barclays", "Maersk"],
  a: `<p><strong>Start by correcting the premise</strong> — that is what the interviewer is testing.</p>
<blockquote><p>Kafka's transactions give exactly-once only for <strong>Kafka-to-Kafka</strong> flows, where the offset commit and the output records are in the same transaction. The moment you write to an external system — a database, an email provider, a payment gateway — exactly-once <em>delivery</em> is impossible, because there is no atomic commit spanning both systems.</p></blockquote>
<p><strong>What you build instead: at-least-once delivery + idempotent processing = effectively-once.</strong></p>
<pre><code>@KafkaListener(topics = "payments")
@Transactional                                   // ONE database transaction
public void handle(PaymentCompleted event, Acknowledgment ack) {

    // The dedupe insert and the business effect MUST commit together.
    // A crash between them would either double-apply or permanently skip.
    try {
        processedRepo.saveAndFlush(new ProcessedEvent(event.eventId(), Instant.now()));
    } catch (DataIntegrityViolationException duplicate) {
        log.debug("event {} already processed", event.eventId());
        ack.acknowledge();
        return;
    }

    ledgerService.credit(event.accountId(), event.amount());
    ack.acknowledge();                            // commit the offset LAST
}</code></pre>
<pre><code>-- Often better: make the operation naturally idempotent, no dedupe table at all
UPDATE orders SET status = 'PAID', paid_at = :ts
WHERE id = :id AND status = 'PENDING';           -- second attempt affects 0 rows

-- Or let a business unique constraint do the work
ALTER TABLE ledger_entry ADD CONSTRAINT uq UNIQUE (account_id, payment_reference);</code></pre>
<p><strong>For Kafka-to-Kafka, transactions genuinely do give exactly-once:</strong></p>
<pre><code>processing.guarantee: exactly_once_v2        # Kafka Streams
# or manually:
producer.initTransactions();
producer.beginTransaction();
producer.send(outputRecord);
producer.sendOffsetsToTransaction(offsets, groupMetadata);   // offsets INSIDE the transaction
producer.commitTransaction();
# Consumers must set isolation.level=read_committed to skip aborted records.</code></pre>
<p><strong>The three things that make the database version correct:</strong> the dedupe record and the effect share one transaction; the offset is committed only after that transaction succeeds; and the dedupe table has a TTL matching your maximum redelivery window, or it becomes the largest table in the database.</p>
<p><strong>The line to close with:</strong> "I would say we achieve <em>effectively-once processing</em>, not exactly-once delivery. Being precise about that distinction matters, because designing as though delivery were exactly-once is how duplicate charges reach production."</p>`
},
{
  q: "A consumer is lagging badly in production — how do you diagnose and fix it?",
  level: "advanced", hot: true, tags: ["production", "debugging"],
  companies: ["Amazon", "Flipkart", "Walmart", "Swiggy", "Ericsson", "Nokia"],
  a: `<pre><code># 1. Confirm and quantify
kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group billing
# TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG      CONSUMER-ID
# orders 0          1,204,332       1,890,551       686,219  consumer-1
# orders 1          1,880,004       1,890,102       10,098   consumer-2

# Is the lag EVEN across partitions, or concentrated?</code></pre>
<table>
<tr><th>Pattern</th><th>Diagnosis</th></tr>
<tr><td>All partitions lagging evenly</td><td>Consumers are simply too slow — scale or optimise</td></tr>
<tr><td><strong>One partition lagging</strong></td><td><strong>Hot key</strong> — poor key distribution, or one consumer is stuck</td></tr>
<tr><td>Lag spikes then recovers</td><td>Producer burst; check whether the recovery rate is acceptable</td></tr>
<tr><td>Lag grows and consumers keep rebalancing</td><td><code>max.poll.interval.ms</code> exceeded — see below</td></tr>
<tr><td>Lag grows, consumers idle</td><td>More consumers than partitions — the extras do nothing</td></tr>
</table>
<pre><code># 2. Where does the time actually go? Instrument the handler.
# Almost always a slow downstream call or an N+1 query, NOT Kafka itself.

# 3. The rebalance death spiral — the most common hidden cause
max.poll.records: 500            # 500 records x 100ms each = 50s
max.poll.interval.ms: 300000     # broker declares the consumer dead if exceeded
# -> rebalance -> offsets not committed -> messages REPROCESSED -> lag grows further</code></pre>
<p><strong>The fixes, in the order I would try them:</strong></p>
<ol>
<li><strong>Batch the work.</strong> Process the whole poll batch in one bulk database write instead of 500 individual ones — frequently a 10× improvement with no new infrastructure.</li>
<li><strong>Lower <code>max.poll.records</code></strong> so each batch completes well inside the poll interval, breaking the rebalance loop.</li>
<li><strong>Add consumers</strong> — up to the partition count. Beyond that they sit idle.</li>
<li><strong>Increase <code>concurrency</code></strong> in Spring Kafka (more consumer threads per instance).</li>
<li><strong>Add partitions</strong> only if you have hit the ceiling — and note it breaks key-to-partition affinity for existing keys.</li>
<li><strong>Move slow work off the poll thread</strong> — but only if ordering does not matter, since a thread pool destroys the per-partition ordering Kafka gave you.</li>
</ol>
<pre><code>@KafkaListener(topics = "orders", batch = "true", concurrency = "6")
public void consume(List&lt;OrderEvent&gt; batch, Acknowledgment ack) {
    repo.saveAll(map(batch));        // ONE round trip instead of 500
    ack.acknowledge();
}</code></pre>
<p><strong>Alert on lag <em>trend</em>, not an absolute number</strong> — healthy services have bursty lag. Use Kafka Lag Exporter or Burrow, and consider KEDA to autoscale consumer pods on lag directly, which is far more responsive than CPU-based scaling.</p>`
},
{
  q: "What happens when a consumer in a group fails — explain rebalancing in detail",
  level: "advanced", hot: true, tags: ["consumers", "internals"],
  companies: ["Amazon", "Oracle", "Flipkart", "Walmart", "Ericsson", "SAP"],
  a: `<pre><code>Group coordinator (a broker) detects the failure via:
  - session.timeout.ms (45s)      : no heartbeat from the background thread
  - max.poll.interval.ms (5min)   : poll() not called in time -> "live but stuck"
  - a clean LeaveGroup on shutdown

Then:
  1. Coordinator increments the GENERATION id
  2. All members are told to rejoin (JoinGroup)
  3. One member is elected LEADER and computes the assignment
  4. SyncGroup distributes it
  5. Consumers resume from their last COMMITTED offsets</code></pre>
<p><strong>Why rebalances hurt:</strong> under the classic (eager) protocol the <em>whole group</em> stops consuming while reassignment happens — a stop-the-world pause across every partition, not just the failed one. Frequent rebalances mean the group spends more time reassigning than consuming.</p>
<table>
<tr><th>Setting</th><th>Purpose</th><th>Typical problem</th></tr>
<tr><td><code>session.timeout.ms</code></td><td>Heartbeat deadline</td><td>Too low → spurious rebalances on GC pauses</td></tr>
<tr><td><code>heartbeat.interval.ms</code></td><td>Heartbeat frequency</td><td>Should be ~1/3 of the session timeout</td></tr>
<tr><td><code>max.poll.interval.ms</code></td><td>Max time between polls</td><td><strong>Slow processing → the group thinks you died</strong></td></tr>
<tr><td><code>max.poll.records</code></td><td>Batch size</td><td>Too high → exceeds the poll interval</td></tr>
</table>
<pre><code># The two modern mitigations
partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
# Incremental rebalancing: only the MOVED partitions pause, not the whole group.

group.instance.id: billing-pod-0
# STATIC membership: a rolling restart within session.timeout does NOT trigger
# a rebalance at all, because the member keeps its identity.</code></pre>
<p><strong>The production bug this explains:</strong> processing takes longer than <code>max.poll.interval.ms</code>, so the broker evicts the consumer mid-batch. The consumer then fails to commit ("Commit cannot be completed since the group has already rebalanced"), the partition is reassigned, and those messages are <strong>reprocessed</strong>. Symptoms are duplicate side effects and a group that never stabilises — and it looks like a Kafka problem when it is actually a slow handler.</p>
<p><strong>Handle partition revocation cleanly</strong> so in-flight work is committed before you lose the partition:</p>
<pre><code>@Component
class RebalanceListener implements ConsumerAwareRebalanceListener {
    public void onPartitionsRevokedBeforeCommit(Consumer&lt;?,?&gt; c, Collection&lt;TopicPartition&gt; p) {
        flushInFlightWork();            // finish and commit before the partition moves
    }
}</code></pre>`
},
{
  q: "How do you decide between Kafka, RabbitMQ and a database table as a queue?",
  level: "advanced", tags: ["architecture", "comparison"],
  companies: ["Amazon", "Infosys", "SAP", "Optum", "Maersk", "Publicis Sapient"],
  a: `<table>
<tr><th></th><th>Kafka</th><th>RabbitMQ</th><th>DB table + SKIP LOCKED</th></tr>
<tr><td>Model</td><td>Durable log, consumers track offsets</td><td>Broker-managed queues, push + ack</td><td>Rows polled by workers</td></tr>
<tr><td>Throughput</td><td>Millions/s</td><td>Tens of thousands/s</td><td>Thousands/s</td></tr>
<tr><td>Replay</td><td><strong>Yes</strong> — reset the offset</td><td>No — deleted on ack</td><td>Yes, if you keep rows</td></tr>
<tr><td>Multiple independent consumers</td><td><strong>Yes</strong> — consumer groups</td><td>Needs fanout exchanges</td><td>Awkward</td></tr>
<tr><td>Ordering</td><td>Per partition</td><td>Per queue, lost with competing consumers</td><td>By query</td></tr>
<tr><td>Per-message TTL / priority / delay</td><td>No</td><td><strong>Yes</strong></td><td>Yes, trivially</td></tr>
<tr><td>Transactional with your data</td><td>No — needs the outbox</td><td>No</td><td><strong>Yes</strong> — same transaction</td></tr>
<tr><td>Operational weight</td><td>High</td><td>Medium</td><td><strong>None</strong></td></tr>
</table>
<pre><code>-- The database queue, done properly. Genuinely sufficient far more often
-- than teams admit, and it needs no new infrastructure.
UPDATE job SET status = 'RUNNING', worker_id = :me, started_at = now()
WHERE id = (
    SELECT id FROM job
    WHERE status = 'PENDING' AND run_after &lt;= now()
    ORDER BY priority DESC, created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED          -- N workers each claim a DIFFERENT row, no contention
)
RETURNING *;</code></pre>
<p><strong>How I would choose:</strong></p>
<ul>
<li><strong>Database table</strong> — until you have a measured reason not to. Under a few thousand jobs a minute it is simpler, transactional with your business data (no dual-write problem at all), and needs nothing to operate. Most "we need a message queue" situations are this.</li>
<li><strong>RabbitMQ</strong> — task distribution with rich routing, per-message priority, delayed delivery, or request/reply. It is a smart router.</li>
<li><strong>Kafka</strong> — event streaming: many independent consumers of the same data, replay and reprocessing, high volume, and as the durable backbone between services. It is a log you read, not a queue you drain.</li>
</ul>
<p><strong>The one-line summary:</strong> "Kafka for events, RabbitMQ for tasks, a database table for jobs — and the database is a perfectly respectable answer that people skip past because it is unglamorous."</p>`
}
]);
