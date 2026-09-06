registerTopic("kafka", [
{
  q: "What is Apache Kafka and how is it different from a traditional message queue?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>Kafka is a <strong>distributed, append-only, durable commit log</strong>. Producers append records to topic partitions; consumers read them by tracking an <em>offset</em>.</p>
<table>
<tr><th></th><th>Traditional queue (RabbitMQ, ActiveMQ)</th><th>Kafka</th></tr>
<tr><td>After consumption</td><td>Message is deleted</td><td><strong>Retained</strong> for the configured period</td></tr>
<tr><td>Replay</td><td>Not possible</td><td>Reset the offset and re-read</td></tr>
<tr><td>Multiple consumers</td><td>Compete for messages</td><td>Independent groups each read everything</td></tr>
<tr><td>Ordering</td><td>Per queue, lost with multiple consumers</td><td>Guaranteed <strong>per partition</strong></td></tr>
<tr><td>Throughput</td><td>Tens of thousands/s</td><td>Millions/s — sequential disk I/O, zero-copy</td></tr>
<tr><td>Routing</td><td>Rich (exchanges, bindings)</td><td>Simple — topic and partition only</td></tr>
<tr><td>Consumer state</td><td>Broker tracks it</td><td><strong>Consumer</strong> tracks the offset</td></tr>
</table>
<p><strong>The key mental shift:</strong> Kafka is a log you read, not a queue you drain. That is what makes replay, multiple independent consumers, and event sourcing possible — and why the broker stays simple and fast.</p>`
},
{
  q: "Explain topics, partitions, offsets and brokers",
  level: "beginner", hot: true, tags: ["architecture"],
  a: `<figure class="fig">
<svg viewBox="0 0 640 200" role="img" aria-label="Kafka topic partitions and consumer groups">
  <text class="dg-t" x="70" y="20" text-anchor="middle">Topic: orders</text>
  <text class="dg-s" x="70" y="52" text-anchor="middle">Partition 0</text>
  <rect class="dg-fill" x="130" y="36" width="34" height="26" rx="4"/><text class="dg-m" x="147" y="54" text-anchor="middle">0</text>
  <rect class="dg-fill" x="166" y="36" width="34" height="26" rx="4"/><text class="dg-m" x="183" y="54" text-anchor="middle">1</text>
  <rect class="dg-fill" x="202" y="36" width="34" height="26" rx="4"/><text class="dg-m" x="219" y="54" text-anchor="middle">2</text>
  <rect class="dg-box" x="238" y="36" width="34" height="26" rx="4"/><text class="dg-m" x="255" y="54" text-anchor="middle">3</text>
  <text class="dg-s" x="70" y="92" text-anchor="middle">Partition 1</text>
  <rect class="dg-fill2" x="130" y="76" width="34" height="26" rx="4"/><text class="dg-m" x="147" y="94" text-anchor="middle">0</text>
  <rect class="dg-fill2" x="166" y="76" width="34" height="26" rx="4"/><text class="dg-m" x="183" y="94" text-anchor="middle">1</text>
  <rect class="dg-box" x="202" y="76" width="34" height="26" rx="4"/><text class="dg-m" x="219" y="94" text-anchor="middle">2</text>
  <text class="dg-s" x="70" y="132" text-anchor="middle">Partition 2</text>
  <rect class="dg-fill" x="130" y="116" width="34" height="26" rx="4"/><text class="dg-m" x="147" y="134" text-anchor="middle">0</text>
  <rect class="dg-box" x="166" y="116" width="34" height="26" rx="4"/><text class="dg-m" x="183" y="134" text-anchor="middle">1</text>
  <text class="dg-s" x="300" y="160" text-anchor="middle">offsets increase →   appended at the end</text>
  <rect class="dg-box" x="400" y="30" width="110" height="38" rx="7"/><text class="dg-s" x="455" y="53" text-anchor="middle">Consumer A</text>
  <rect class="dg-box" x="400" y="76" width="110" height="38" rx="7"/><text class="dg-s" x="455" y="99" text-anchor="middle">Consumer B</text>
  <rect class="dg-box" x="400" y="122" width="110" height="38" rx="7"/><text class="dg-s" x="455" y="145" text-anchor="middle">Consumer C</text>
  <text class="dg-s" x="575" y="80" text-anchor="middle">group: billing</text>
  <text class="dg-s" x="575" y="96" text-anchor="middle">1 partition each</text>
  <path class="dg-line" d="M276 49 H396 M240 89 H396 M204 129 H396" marker-end="url(#k1)"/>
  <defs><marker id="k1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>A topic is split into partitions; each partition is consumed by exactly one member of a group.</figcaption>
</figure>
<ul>
<li><strong>Broker</strong> — one Kafka server. A cluster is many brokers; each partition has a leader broker and follower replicas.</li>
<li><strong>Topic</strong> — a named stream of records. Purely logical.</li>
<li><strong>Partition</strong> — the unit of parallelism, ordering and storage. An ordered, immutable, append-only sequence.</li>
<li><strong>Offset</strong> — a monotonically increasing ID of a record <em>within</em> a partition. Consumers commit offsets to track progress.</li>
<li><strong>Replication factor</strong> — how many copies of each partition exist. 3 is standard in production.</li>
</ul>
<p><strong>The single most important consequence:</strong> ordering is guaranteed <em>within a partition only</em>, never across a topic. If you need per-customer ordering, use the customer ID as the message key so all their events land in the same partition.</p>`
},
{
  q: "How does a consumer group work and what triggers a rebalance?",
  level: "advanced", hot: true, tags: ["consumers"],
  a: `<p>A <strong>consumer group</strong> is a set of consumers sharing a <code>group.id</code>. Kafka assigns each partition to exactly <strong>one</strong> consumer in the group — that is how you scale out while preserving per-partition ordering.</p>
<ul>
<li>Consumers &lt; partitions → some consumers handle several partitions.</li>
<li>Consumers = partitions → ideal, one each.</li>
<li>Consumers &gt; partitions → <strong>the extras sit idle</strong>. Partition count is your maximum parallelism, so choose it deliberately.</li>
<li>Different groups are independent — each gets every message.</li>
</ul>
<p><strong>A rebalance</strong> reassigns partitions. Triggers: a consumer joins, leaves, or is considered dead; partitions are added; or a subscribed topic matches a new regex.</p>
<p><strong>Why rebalances hurt:</strong> under the classic protocol the whole group stops consuming (stop-the-world) while reassignment happens. Frequent rebalances mean constant pauses.</p>
<pre><code>// The three timeouts that cause most unexplained rebalances
session.timeout.ms: 45000          # broker declares the consumer dead if no heartbeat
heartbeat.interval.ms: 3000        # background heartbeat thread, ~1/3 of session timeout
max.poll.interval.ms: 300000       # MAX TIME BETWEEN poll() CALLS
max.poll.records: 500              # reduce this if processing is slow</code></pre>
<blockquote><p><strong>The classic production bug:</strong> processing a batch takes longer than <code>max.poll.interval.ms</code>, so the broker assumes the consumer is dead and rebalances — the consumer then fails to commit, the partition is reassigned, and the messages are reprocessed. Symptoms are duplicate processing and a group that never stabilises. Fix by lowering <code>max.poll.records</code>, raising the interval, or moving slow work off the poll thread.</p></blockquote>
<p>Mention <strong>cooperative incremental rebalancing</strong> (<code>CooperativeStickyAssignor</code>, the default since 3.x) — only the moved partitions pause, not the whole group — and <strong>static group membership</strong> (<code>group.instance.id</code>) which avoids rebalancing on a rolling restart.</p>`
},
{
  q: "How does Kafka guarantee message ordering?",
  level: "beginner", hot: true, tags: ["ordering"],
  a: `<p><strong>Only within a partition.</strong> There is no global ordering across a topic, and there cannot be — that would eliminate parallelism.</p>
<p>The producer decides the partition:</p>
<ol>
<li><strong>Key provided</strong> → <code>partition = murmur2(key) % numPartitions</code>. Same key → same partition → ordered.</li>
<li><strong>No key</strong> → sticky partitioning: batch to one partition, then switch, for throughput.</li>
<li><strong>Explicit partition</strong> or a custom <code>Partitioner</code>.</li>
</ol>
<pre><code>// All events for one order stay ordered relative to each other
kafkaTemplate.send("order-events", order.getId(), event);</code></pre>
<p><strong>Two things that silently break ordering even with a key:</strong></p>
<ul>
<li><code>max.in.flight.requests.per.connection &gt; 1</code> combined with <code>retries &gt; 0</code> — a failed request can be retried <em>after</em> a later one succeeded, reordering the log. Setting <code>enable.idempotence=true</code> (the default since 3.0) makes the broker deduplicate and preserve order even with up to 5 in-flight requests.</li>
<li><strong>Adding partitions later</strong> — the hash changes, so an existing key can move to a different partition, and its old and new events are no longer ordered relative to each other. Over-provision partitions from the start.</li>
</ul>
<p>Also worth stating: concurrent processing <em>inside</em> the consumer (handing records to a thread pool) destroys the ordering Kafka gave you. If ordering matters, process a partition's records sequentially.</p>`
},
{
  q: "What are the delivery semantics — at-most-once, at-least-once, exactly-once?",
  level: "advanced", hot: true, tags: ["semantics", "reliability"],
  a: `<table>
<tr><th>Semantic</th><th>Configuration</th><th>Risk</th></tr>
<tr><td><strong>At most once</strong></td><td>Commit offset <em>before</em> processing; <code>acks=0/1</code></td><td>Message loss on crash</td></tr>
<tr><td><strong>At least once</strong></td><td>Commit <em>after</em> processing; <code>acks=all</code>, retries</td><td><strong>Duplicates</strong> — the default and the right choice</td></tr>
<tr><td><strong>Exactly once</strong></td><td>Idempotent producer + transactions, or at-least-once + idempotent consumer</td><td>Complexity and throughput cost</td></tr>
</table>
<pre><code># Producer — no data loss
acks: all                      # wait for all in-sync replicas
enable.idempotence: true       # dedupes retries, preserves order (default in 3.x)
retries: 2147483647
max.in.flight.requests.per.connection: 5
min.insync.replicas: 2         # TOPIC-level: at least 2 replicas must ack

# Consumer — at least once
enable.auto.commit: false      # commit manually, AFTER processing</code></pre>
<p><strong>The practical answer interviewers want:</strong> true end-to-end exactly-once across an external system (a database, an email) is impossible. Kafka's transactions give exactly-once only for <em>Kafka-to-Kafka</em> flows (read → process → write, with the offset commit inside the transaction).</p>
<p>For everything else, the industry pattern is <strong>at-least-once delivery plus an idempotent consumer</strong> — which yields <em>effectively-once</em> processing:</p>
<pre><code>@KafkaListener(topics = "payments")
@Transactional
public void handle(PaymentEvent e, Acknowledgment ack) {
    if (processedRepo.existsById(e.eventId())) { ack.acknowledge(); return; }  // dedupe
    paymentService.apply(e);
    processedRepo.save(new ProcessedEvent(e.eventId(), Instant.now()));        // same tx
    ack.acknowledge();
}</code></pre>`
},
{
  q: "What are acks, ISR and min.insync.replicas?",
  level: "advanced", hot: true, tags: ["reliability", "replication"],
  a: `<p><strong><code>acks</code></strong> — how many acknowledgements the producer waits for:</p>
<ul>
<li><code>acks=0</code> — fire and forget. Fastest, loses data freely.</li>
<li><code>acks=1</code> — the leader has written it. Lost if the leader dies before followers replicate.</li>
<li><code>acks=all</code> (or <code>-1</code>) — all <em>in-sync replicas</em> have it. The durable choice.</li>
</ul>
<p><strong>ISR (In-Sync Replicas)</strong> — the set of replicas that are caught up with the leader (within <code>replica.lag.time.max.ms</code>, default 30s). A follower that falls behind is removed from the ISR and re-added when it catches up. Only ISR members are eligible to become leader.</p>
<p><strong><code>min.insync.replicas</code></strong> — the topic-level minimum ISR size required for an <code>acks=all</code> write to succeed. If the ISR shrinks below it, producers get <code>NotEnoughReplicasException</code> — the system chooses <em>consistency over availability</em>.</p>
<pre><code>replication.factor = 3
min.insync.replicas = 2
acks = all
// Tolerates ONE broker failure with no data loss and no write outage.
// Setting min.insync.replicas = 3 here means any single failure stops writes.</code></pre>
<p><strong>The trap:</strong> <code>acks=all</code> with <code>min.insync.replicas=1</code> gives you no real guarantee — "all" can mean "just the leader" if the others fell out of the ISR. The two settings must be reasoned about together.</p>
<p>Also mention <code>unclean.leader.election.enable=false</code> (the default): never promote an out-of-sync replica to leader, because that silently discards committed messages.</p>`
},
{
  q: "How do consumer offsets and commits work?",
  level: "advanced", hot: true, tags: ["consumers", "offsets"],
  a: `<p>Offsets are stored in the internal compacted topic <code>__consumer_offsets</code>, keyed by (group, topic, partition). The committed offset is <em>the next record to read</em>, not the last one processed.</p>
<pre><code># Auto-commit — convenient, but commits on a timer regardless of processing
enable.auto.commit: true
auto.commit.interval.ms: 5000     # can commit records you have not finished processing

# Manual — what you want in production
enable.auto.commit: false</code></pre>
<pre><code>// Spring Kafka
spring.kafka.listener.ack-mode: MANUAL_IMMEDIATE

@KafkaListener(topics = "orders", groupId = "billing")
public void consume(ConsumerRecord&lt;String, OrderEvent&gt; rec, Acknowledgment ack) {
    try {
        process(rec.value());
        ack.acknowledge();          // commit only after successful processing
    } catch (RetryableException e) {
        // do NOT ack — the record is redelivered after a rebalance/restart
        throw e;
    }
}</code></pre>
<p><strong>Sync vs async commit:</strong> <code>commitSync()</code> blocks and retries — use it before shutdown and on rebalance. <code>commitAsync()</code> is faster but does not retry (a retry could overwrite a newer offset). The standard pattern is async during the loop, sync in the <code>finally</code>.</p>
<p><strong><code>auto.offset.reset</code></strong> applies only when there is <em>no</em> committed offset: <code>latest</code> (default, skip history), <code>earliest</code> (read everything), <code>none</code> (throw). This catches people out — a new consumer group with <code>latest</code> silently ignores the entire existing backlog.</p>
<p><strong>Consumer lag</strong> — log end offset minus committed offset — is the single most important metric to alert on.</p>`
},
{
  q: "How do you handle failures and retries in a Kafka consumer?",
  level: "advanced", hot: true, tags: ["reliability", "production"],
  a: `<p><strong>Classify the failure first</strong> — this is the point of the question:</p>
<ul>
<li><strong>Transient</strong> (downstream timeout, deadlock) → retry with backoff.</li>
<li><strong>Permanent</strong> (malformed payload, business rule violation) → retrying forever blocks the partition. Send it to a dead-letter topic immediately.</li>
</ul>
<pre><code>@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate&lt;?, ?&gt; template) {
    var recoverer = new DeadLetterPublishingRecoverer(template,
        (record, ex) -&gt; new TopicPartition(record.topic() + ".DLT", record.partition()));

    var backoff = new ExponentialBackOffWithMaxRetries(3);
    backoff.setInitialInterval(1000);
    backoff.setMultiplier(2.0);

    var handler = new DefaultErrorHandler(recoverer, backoff);
    handler.addNotRetryableExceptions(ValidationException.class,   // straight to DLT
                                      JsonProcessingException.class);
    return handler;
}

@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2),
                dltTopicSuffix = "-dlt")
@KafkaListener(topics = "orders")
public void consume(OrderEvent e) { ... }</code></pre>
<p><strong>Blocking vs non-blocking retry — the key design point:</strong> retrying in place blocks the partition and stops every subsequent message. <code>@RetryableTopic</code> instead republishes to separate delay topics (<code>orders-retry-0</code>, <code>-retry-1</code>…), so the main partition keeps flowing. The trade-off is that you lose ordering for retried messages.</p>
<p><strong>The DLT is not the end of the story.</strong> Alert on DLT depth, store the original headers (topic, partition, offset, exception, stack trace) so you can diagnose, and build a replay mechanism to reprocess after a fix. A dead-letter topic nobody monitors is just a slower way to lose data.</p>`
},
{
  q: "What is the transactional outbox pattern and why do you need it?",
  level: "advanced", hot: true, tags: ["patterns", "consistency"],
  a: `<p><strong>The dual-write problem:</strong> you must save to the database <em>and</em> publish to Kafka. These are two separate systems with no shared transaction, so a crash between them leaves you inconsistent — the order exists but nobody was notified, or the event was sent for an order that rolled back.</p>
<pre><code>@Transactional
public void placeOrder(Order o) {
    orderRepo.save(o);                        // committed
    kafkaTemplate.send("orders", event);      // crash here = event lost
}                                             // or: DB rollback after send = phantom event</code></pre>
<p><strong>The outbox pattern:</strong> write the event to an <code>outbox</code> table <em>in the same database transaction</em> as the business change. A separate process then publishes from that table.</p>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Transactional outbox pattern">
  <rect class="dg-box" x="10" y="50" width="100" height="44" rx="8"/><text class="dg-s" x="60" y="77" text-anchor="middle">Service</text>
  <path class="dg-line" d="M114 72 H160" marker-end="url(#o1)"/>
  <rect class="dg-fill" x="164" y="24" width="150" height="96" rx="8"/>
  <text class="dg-t" x="239" y="46" text-anchor="middle">One DB transaction</text>
  <rect class="dg-fill2" x="176" y="56" width="126" height="24" rx="5"/><text class="dg-s" x="239" y="72" text-anchor="middle">orders table</text>
  <rect class="dg-fill2" x="176" y="86" width="126" height="24" rx="5"/><text class="dg-s" x="239" y="102" text-anchor="middle">outbox table</text>
  <path class="dg-line" d="M318 98 H370" marker-end="url(#o1)"/>
  <rect class="dg-box" x="374" y="76" width="118" height="44" rx="8"/>
  <text class="dg-s" x="433" y="96" text-anchor="middle">Relay / CDC</text><text class="dg-s" x="433" y="112" text-anchor="middle">(Debezium)</text>
  <path class="dg-line" d="M496 98 H544" marker-end="url(#o1)"/>
  <rect class="dg-fill" x="548" y="76" width="64" height="44" rx="8"/><text class="dg-s" x="580" y="102" text-anchor="middle">Kafka</text>
  <defs><marker id="o1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Atomicity comes from the database; the relay provides at-least-once delivery.</figcaption>
</figure>
<pre><code>@Transactional
public void placeOrder(Order o) {
    orderRepo.save(o);
    outboxRepo.save(new OutboxEvent(UUID.randomUUID(), "Order", o.getId(),
                                    "OrderPlaced", toJson(event)));
}   // both commit or neither does — atomic by construction

@Scheduled(fixedDelay = 500)
@Transactional
public void publishOutbox() {
    for (var e : outboxRepo.findUnpublished(PageRequest.of(0, 100))) {
        kafkaTemplate.send("orders", e.aggregateId(), e.payload());
        e.markPublished();
    }
}</code></pre>
<p><strong>Delivery is at-least-once</strong> (the relay can crash after sending but before marking), so consumers must deduplicate by <code>eventId</code>. The production-grade version replaces the polling relay with <strong>Debezium change data capture</strong> reading the database WAL — no polling, lower latency, and it cannot miss a row.</p>`
},
{
  q: "How do you choose the number of partitions?",
  level: "advanced", tags: ["design", "capacity"],
  a: `<p><strong>The formula:</strong> <code>partitions = max(target_throughput / producer_throughput_per_partition, target_throughput / consumer_throughput_per_partition)</code>. In practice you start from the consumer side, because that is usually the bottleneck.</p>
<p><strong>Factors:</strong></p>
<ul>
<li><strong>Parallelism ceiling</strong> — a consumer group can never have more active consumers than partitions. If you expect to scale to 12 pods, you need at least 12 partitions.</li>
<li><strong>Key cardinality</strong> — partitions only help if your keys spread across them. A million events all keyed by one tenant ID land on one partition regardless.</li>
<li><strong>Ordering requirements</strong> — more partitions means weaker ordering guarantees across the topic.</li>
</ul>
<p><strong>Costs of too many partitions:</strong> more open file handles and memory per broker, longer leader election and rebalance times after a failure, more end-to-end latency (each partition adds replication overhead), and higher producer memory for batching. Thousands per broker is where problems start.</p>
<p><strong>The critical constraint:</strong> you can <em>increase</em> partitions but never decrease them, and increasing them <strong>breaks key-to-partition affinity</strong> — existing keys rehash to different partitions, so ordering guarantees are lost for in-flight keys. Over-provision modestly at design time (a common starting point is 2–3× your expected consumer count, rounded up) rather than planning to grow later.</p>`
},
{
  q: "What is log compaction and when would you use it?",
  level: "advanced", tags: ["storage"],
  a: `<p>Two retention policies:</p>
<ul>
<li><strong><code>cleanup.policy=delete</code></strong> (default) — discard segments older than <code>retention.ms</code> or beyond <code>retention.bytes</code>.</li>
<li><strong><code>cleanup.policy=compact</code></strong> — retain <em>at least the latest value for every key</em>, forever. Older versions of the same key are removed.</li>
</ul>
<pre><code>Before compaction:  (k1,v1) (k2,v2) (k1,v3) (k3,v4) (k2,v5) (k1,null)
After compaction:                            (k3,v4) (k2,v5) (k1,null)
                                                              ^ tombstone,
                                                    deleted after delete.retention.ms</code></pre>
<p><strong>Use it when the topic represents <em>state</em> rather than <em>events</em></strong>:</p>
<ul>
<li>A changelog of current values — customer profiles, product catalogue, feature flags, configuration.</li>
<li>Kafka's own <code>__consumer_offsets</code> topic.</li>
<li>Kafka Streams state store changelogs — this is how a stateful stream application restores its state after a restart.</li>
<li>Any topic a new consumer must read from the beginning to rebuild a full picture, without replaying years of history.</li>
</ul>
<p><strong>Requirements and caveats:</strong> messages must have keys (null keys cannot be compacted); the <em>active</em> segment is never compacted, so the newest data always has duplicates; and compaction guarantees the latest value survives but does not guarantee <em>only</em> one copy exists at any moment. Use <code>compact,delete</code> together when you want both a latest-value guarantee and an upper bound on age.</p>`
},
{
  q: "How do you produce and consume messages in Spring Boot?",
  level: "beginner", hot: true, tags: ["spring"],
  a: `<pre><code>spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      properties.enable.idempotence: true
    consumer:
      group-id: billing-service
      auto-offset-reset: earliest
      enable-auto-commit: false
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties.spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
      properties.spring.json.trusted.packages: com.acme.events
    listener.ack-mode: MANUAL_IMMEDIATE</code></pre>
<pre><code>@Service
@RequiredArgsConstructor
public class OrderEventPublisher {
    private final KafkaTemplate&lt;String, OrderEvent&gt; template;

    public void publish(OrderEvent event) {
        template.send("order-events", event.orderId(), event)
                .whenComplete((result, ex) -&gt; {
                    if (ex != null) log.error("publish failed for {}", event.orderId(), ex);
                    else log.debug("sent to partition {} offset {}",
                            result.getRecordMetadata().partition(),
                            result.getRecordMetadata().offset());
                });
    }
}

@Component
public class OrderEventListener {

    @KafkaListener(topics = "order-events", groupId = "billing-service",
                   concurrency = "3")            // 3 consumer threads in this instance
    public void handle(@Payload OrderEvent event,
                       @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                       @Header(KafkaHeaders.OFFSET) long offset,
                       Acknowledgment ack) {
        billingService.process(event);
        ack.acknowledge();
    }
}</code></pre>
<p><strong>Two details worth calling out:</strong> <code>ErrorHandlingDeserializer</code> prevents a single poison message from killing the consumer in an infinite loop (a very real production failure), and <code>concurrency</code> creates that many consumer threads — but they still cannot exceed the partition count.</p>`
},
{
  q: "What is Kafka Streams and how does it differ from a plain consumer?",
  level: "advanced", tags: ["streams"],
  a: `<p>Kafka Streams is a <strong>library</strong> (not a cluster) for stateful stream processing on top of Kafka. You get transformations, joins, windowing and local state stores with no extra infrastructure.</p>
<pre><code>StreamsBuilder builder = new StreamsBuilder();

KStream&lt;String, Order&gt; orders = builder.stream("orders");
KTable&lt;String, Customer&gt; customers = builder.table("customers");   // compacted topic

orders
  .filter((k, o) -&gt; o.total().compareTo(THRESHOLD) &gt; 0)
  .join(customers, (order, customer) -&gt; enrich(order, customer))
  .groupBy((k, v) -&gt; v.region())
  .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
  .aggregate(Revenue::zero, (k, v, agg) -&gt; agg.add(v.total()),
             Materialized.as("revenue-store"))
  .toStream()
  .to("revenue-by-region");</code></pre>
<table>
<tr><th></th><th>Plain consumer</th><th>Kafka Streams</th></tr>
<tr><td>State</td><td>You manage it (database)</td><td>Local RocksDB store, backed by a changelog topic</td></tr>
<tr><td>Joins/windows</td><td>Hand-written</td><td>Built in</td></tr>
<tr><td>Fault tolerance</td><td>You handle it</td><td>State restored from the changelog automatically</td></tr>
<tr><td>Exactly-once</td><td>Manual</td><td><code>processing.guarantee=exactly_once_v2</code></td></tr>
</table>
<p><strong>Core abstractions:</strong> <code>KStream</code> is a record stream (every event matters — an append-only log); <code>KTable</code> is a changelog stream (only the latest value per key matters — a materialised table). Understanding the <em>stream-table duality</em> is what the question is really testing.</p>
<p>Compare briefly with Flink (a separate cluster, richer windowing and event-time handling, better for very large stateful jobs) — Kafka Streams wins on operational simplicity because it is just a jar in your Spring Boot app.</p>`
},
{
  q: "How do you handle schema evolution with Kafka?",
  level: "advanced", hot: true, tags: ["schema", "design"],
  a: `<p>Producers and consumers deploy independently, so the message format must evolve without breaking either. Use a <strong>Schema Registry</strong> with Avro, Protobuf or JSON Schema.</p>
<p>The producer registers the schema and writes only a schema ID plus the binary payload; the consumer fetches the schema by ID and deserializes. Payloads shrink and compatibility is enforced <em>at registration time</em>, so an incompatible schema is rejected before it ever reaches production.</p>
<table>
<tr><th>Compatibility mode</th><th>Allows</th><th>Upgrade order</th></tr>
<tr><td><strong>BACKWARD</strong> (default)</td><td>Delete a field, add an <em>optional</em> field</td><td>Consumers first</td></tr>
<tr><td><strong>FORWARD</strong></td><td>Add a field, delete an optional field</td><td>Producers first</td></tr>
<tr><td><strong>FULL</strong></td><td>Only add/remove optional fields with defaults</td><td>Either order</td></tr>
<tr><td>NONE</td><td>Anything</td><td>Good luck</td></tr>
</table>
<pre><code>{
  "type": "record", "name": "OrderPlaced",
  "fields": [
    { "name": "orderId",  "type": "string" },
    { "name": "total",    "type": "string" },
    { "name": "currency", "type": ["null","string"], "default": null }   // safe addition
  ]
}</code></pre>
<p><strong>Rules that keep you safe:</strong> always give new fields a default; never rename a field (add a new one and deprecate the old); never change a field's type; never remove a required field. If you truly must break compatibility, publish to a new topic (<code>orders.v2</code>) and migrate consumers, rather than breaking the existing one.</p>
<p>If you use JSON without a registry — which many teams do — the same discipline applies manually, plus <code>@JsonIgnoreProperties(ignoreUnknown = true)</code> on every consumer so an added field does not crash it.</p>`
},
{
  q: "How do you monitor Kafka in production?",
  level: "advanced", hot: true, tags: ["production", "observability"],
  a: `<p><strong>The metric that matters most: consumer lag</strong> — the difference between the partition's latest offset and the group's committed offset. Growing lag means consumers cannot keep up; it is the leading indicator of every Kafka incident.</p>
<table>
<tr><th>Area</th><th>Metric</th><th>Why</th></tr>
<tr><td>Consumer</td><td><code>records-lag-max</code></td><td>Alert on sustained growth</td></tr>
<tr><td>Consumer</td><td>Rebalance rate</td><td>Frequent rebalances = timeout misconfiguration</td></tr>
<tr><td>Consumer</td><td><code>fetch-latency</code>, processing time per record</td><td>Find the slow handler</td></tr>
<tr><td>Producer</td><td><code>record-error-rate</code>, <code>record-retry-rate</code></td><td>Broker or network trouble</td></tr>
<tr><td>Producer</td><td><code>request-latency-avg</code>, buffer availability</td><td>Backpressure</td></tr>
<tr><td>Broker</td><td><code>UnderReplicatedPartitions</code></td><td><strong>Should always be 0</strong></td></tr>
<tr><td>Broker</td><td><code>OfflinePartitionsCount</code></td><td>Should be 0 — data unavailable</td></tr>
<tr><td>Broker</td><td><code>ActiveControllerCount</code></td><td>Exactly 1 across the cluster</td></tr>
<tr><td>Broker</td><td>ISR shrink/expand rate</td><td>Replication instability</td></tr>
<tr><td>App</td><td>DLT message count</td><td>Failed messages nobody is looking at</td></tr>
</table>
<pre><code>management:
  metrics.tags.application: billing-service
  endpoints.web.exposure.include: prometheus
# Spring Kafka exports consumer/producer metrics through Micrometer automatically</code></pre>
<p>Tools to name: <strong>Kafka Lag Exporter</strong> or Burrow for lag, JMX → Prometheus → Grafana for broker metrics, and Conduktor / AKHQ / Kafka UI for inspection. Add <strong>distributed tracing</strong> — propagate the trace ID in message headers so a request that crosses Kafka still produces one connected trace.</p>`
},
{
  q: "What is ZooKeeper's role, and what is KRaft?",
  level: "advanced", tags: ["architecture"],
  a: `<p><strong>Historically</strong>, Kafka used Apache ZooKeeper for cluster metadata: broker registration, topic and partition configuration, controller election, and ACLs. Consumer offsets used to live there too, before moving into the <code>__consumer_offsets</code> topic in 0.9.</p>
<p><strong>Problems with that design:</strong> a second distributed system to operate, secure and tune; metadata operations bottlenecked through ZooKeeper; slow controller failover on large clusters; and a hard ceiling on partition count.</p>
<p><strong>KRaft (KIP-500)</strong> replaces ZooKeeper with a built-in Raft consensus protocol. Metadata becomes an internal Kafka topic managed by a quorum of controller nodes.</p>
<ul>
<li><strong>Simpler operations</strong> — one system, one process type.</li>
<li><strong>Much faster failover and startup</strong> — metadata is a log the controllers already have, not a tree to rebuild.</li>
<li><strong>Scales to millions of partitions.</strong></li>
</ul>
<p><strong>Status:</strong> production-ready since Kafka 3.3, the default for new clusters, and ZooKeeper support was <strong>removed in Kafka 4.0</strong>. Any new deployment should be KRaft. Knowing this is a good currency signal — many candidates still describe ZooKeeper as required.</p>`
},
{
  q: "Kafka vs RabbitMQ — when would you choose each?",
  level: "advanced", hot: true, tags: ["architecture", "comparison"],
  a: `<table>
<tr><th></th><th>Kafka</th><th>RabbitMQ</th></tr>
<tr><td>Model</td><td>Distributed log — consumers pull and track offsets</td><td>Broker-managed queues — push, with acknowledgements</td></tr>
<tr><td>Retention</td><td>Time/size based; replay supported</td><td>Deleted after acknowledgement</td></tr>
<tr><td>Routing</td><td>Topic + partition only</td><td>Rich — direct, topic, fanout, headers exchanges</td></tr>
<tr><td>Throughput</td><td>Very high (millions/s)</td><td>High (tens of thousands/s)</td></tr>
<tr><td>Latency</td><td>Low (ms), tuned for batching</td><td>Very low</td></tr>
<tr><td>Per-message features</td><td>None</td><td>TTL, priority, delayed delivery, per-message ack</td></tr>
<tr><td>Ordering</td><td>Per partition</td><td>Per queue, lost with competing consumers</td></tr>
<tr><td>Operational weight</td><td>Heavier</td><td>Lighter</td></tr>
</table>
<p><strong>Choose Kafka for:</strong> event streaming and event sourcing, high-volume ingestion (logs, metrics, clickstream), multiple independent consumers of the same data, replay and reprocessing, stream processing, and as the durable backbone between microservices.</p>
<p><strong>Choose RabbitMQ for:</strong> classic task queues and work distribution, complex routing rules, per-message priority or delay, request/reply patterns, and lower-volume systems where operational simplicity matters more than throughput.</p>
<p><strong>The clean one-liner:</strong> "Kafka is a durable log you replay; RabbitMQ is a smart router you drain. Use Kafka for events, RabbitMQ for tasks." Many organisations run both for exactly those reasons.</p>`
}
]);
