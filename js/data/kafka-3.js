appendTopic("kafka", [
{
  q: "How do you design Kafka topics and naming conventions?",
  level: "advanced", tags: ["design", "governance"],
  a: `<pre><code># A convention that scales across teams
&lt;domain&gt;.&lt;entity&gt;.&lt;event-type&gt;.&lt;version&gt;

orders.order.placed.v1
orders.order.cancelled.v1
billing.invoice.issued.v1
orders.order.placed.v1.dlt          # dead letter
orders.order.placed.v1.retry-0      # retry tiers</code></pre>
<p><strong>The bigger design decision is granularity — one topic per event type, or one per aggregate?</strong></p>
<table>
<tr><th></th><th>Topic per event type</th><th>Topic per aggregate</th></tr>
<tr><td>Consumers</td><td>Subscribe to exactly what they need</td><td>Must filter events they do not care about</td></tr>
<tr><td>Ordering</td><td>Only within one event type</td><td><strong>Guaranteed across all events for an entity</strong></td></tr>
<tr><td>Topic count</td><td>Grows quickly</td><td>Manageable</td></tr>
</table>
<p><strong>The deciding factor is ordering.</strong> If a consumer must see <code>OrderPlaced</code> before <code>OrderCancelled</code> for the same order, those events must share a topic <em>and</em> a partition key — split across topics, there is no ordering relationship at all. That single consideration usually settles it: one topic per aggregate, keyed by the aggregate ID.</p>
<pre><code># Configuration decisions to make deliberately per topic
partitions: 12                     # = maximum consumer parallelism; cannot be reduced later
replication.factor: 3
min.insync.replicas: 2
retention.ms: 604800000            # 7 days
cleanup.policy: delete             # or 'compact' for state/changelog topics
max.message.bytes: 1048576         # keep messages small; use claim-check for large payloads</code></pre>
<p><strong>Governance points worth raising:</strong> disable <code>auto.create.topics.enable</code> so a typo does not silently create a topic with default settings and no ACLs; treat topic configuration as code (Terraform or a Kafka operator) rather than <code>kafka-topics.sh</code> run by hand; and register a schema per topic so the contract is explicit and compatibility is enforced at registration rather than discovered by a consumer crash.</p>
<p><strong>The claim-check pattern</strong> is worth naming for large payloads: put the blob in object storage and publish only the reference. Kafka is not a file transfer system, and a 50 MB message degrades the whole partition for everyone.</p>`
},
{
  q: "What is the difference between Kafka's consumer poll loop and the Spring listener container?",
  level: "advanced", tags: ["consumers", "spring"],
  a: `<pre><code>// The raw consumer loop — what Spring runs for you
try (var consumer = new KafkaConsumer&lt;String, Order&gt;(props)) {
    consumer.subscribe(List.of("orders"));
    while (running) {
        var records = consumer.poll(Duration.ofMillis(500));   // heartbeats happen HERE too
        for (var record : records) {
            process(record.value());
        }
        consumer.commitSync();                                  // after processing
    }
}</code></pre>
<p><strong>The single most important property:</strong> <code>poll()</code> does more than fetch records — it also drives the consumer's participation in the group. If you take longer than <code>max.poll.interval.ms</code> between polls, the broker considers the consumer dead, triggers a rebalance, and your subsequent commit fails. That is the mechanism behind most "duplicate processing" incidents.</p>
<pre><code>spring.kafka:
  listener:
    type: batch                     # hand the whole poll batch to the listener
    ack-mode: MANUAL_IMMEDIATE
    concurrency: 3                  # 3 consumer threads (≤ partition count)
  consumer:
    max-poll-records: 100           # LOWER this if processing is slow
    properties:
      max.poll.interval.ms: 300000</code></pre>
<pre><code>@KafkaListener(topics = "orders", concurrency = "3")
public void consume(List&lt;ConsumerRecord&lt;String, OrderEvent&gt;&gt; batch, Acknowledgment ack) {
    orderService.processAll(batch.stream().map(ConsumerRecord::value).toList());  // ONE bulk write
    ack.acknowledge();
}</code></pre>
<p><strong>What Spring's container adds:</strong> the poll loop and its lifecycle, thread management via <code>concurrency</code>, deserialisation with error handling, acknowledgement modes, retry and dead-letter routing through <code>DefaultErrorHandler</code>, graceful shutdown, and Micrometer metrics. Writing that correctly by hand is genuinely difficult — particularly rebalance listeners and commit-on-shutdown.</p>
<p><strong>The tuning rule to state:</strong> if a batch of 500 records takes longer than the poll interval to process, you have two choices — reduce <code>max.poll.records</code> so each batch is faster, or increase <code>max.poll.interval.ms</code>. Reducing the batch size is usually correct, because a long interval also delays detecting a genuinely dead consumer.</p>`
},
{
  q: "How do you handle large messages and the claim-check pattern in Kafka?",
  level: "advanced", tags: ["design", "patterns"],
  a: `<p>Kafka's default <code>max.message.bytes</code> is 1 MB, and raising it is usually the wrong instinct — large messages hurt everyone on the partition.</p>
<pre><code>// ✘ Publishing a 20 MB document into the topic
producer.send(new ProducerRecord&lt;&gt;("documents", docId, entireFileBytes));

// ✔ CLAIM CHECK — store the payload, publish the reference
String key = "documents/" + docId + "/" + UUID.randomUUID();
s3.putObject(bucket, key, inputStream);

producer.send(new ProducerRecord&lt;&gt;("documents", docId,
    new DocumentUploaded(docId, bucket, key, sizeBytes, sha256, contentType)));

// Consumer fetches only if it actually needs the bytes
@KafkaListener(topics = "documents")
public void handle(DocumentUploaded event) {
    if (!needsContent(event)) return;                 // many consumers only need metadata
    try (var stream = s3.getObject(event.bucket(), event.key())) {
        process(stream);
    }
}</code></pre>
<p><strong>Why raising the message size limit is the wrong fix:</strong> every broker buffers messages in memory; replication copies them across the cluster; consumers fetch whole batches, so one large message inflates every fetch; and a 20 MB message on a partition delays every subsequent message behind it. Raising the limit also requires coordinated changes on brokers, producers and consumers.</p>
<p><strong>The claim-check benefits beyond size:</strong> consumers that only need metadata never download the payload at all; the object store handles retention independently of the topic; and re-processing an old event still works because the reference is stable, whereas a topic with 7-day retention would have discarded the bytes.</p>
<p><strong>Details to get right:</strong> include a checksum so the consumer can verify integrity; make the object-store write happen <em>before</em> publishing the event (otherwise a consumer may fetch a key that does not exist yet); align the object's lifecycle policy with the topic's retention plus replay window; and use a pre-signed URL if consumers are external rather than granting them bucket credentials.</p>`
},
{
  q: "How do you migrate a Kafka cluster or topic without downtime?",
  level: "advanced", tags: ["operations", "migration"],
  a: `<p><strong>Scenario 1 — moving partitions between brokers (adding capacity):</strong></p>
<pre><code># Generate and execute a reassignment plan
kafka-reassign-partitions.sh --bootstrap-server kafka:9092 \\
  --topics-to-move-json-file topics.json --broker-list "1,2,3,4,5" --generate

kafka-reassign-partitions.sh --bootstrap-server kafka:9092 \\
  --reassignment-json-file plan.json --execute \\
  --throttle 50000000            # THROTTLE — otherwise replication saturates the network

kafka-reassign-partitions.sh --reassignment-json-file plan.json --verify</code></pre>
<p>The throttle is the critical part: an unthrottled reassignment moves terabytes at full speed, starving live produce and consume traffic. Cruise Control automates this with continuous rebalancing.</p>
<p><strong>Scenario 2 — migrating to an entirely new cluster:</strong></p>
<ol>
<li><strong>MirrorMaker 2</strong> replicates topics, consumer groups and offsets from the old cluster to the new one, running continuously until the cut-over.</li>
<li><strong>Move producers first.</strong> They start writing to the new cluster; MirrorMaker keeps the old one populated for consumers that have not moved.</li>
<li><strong>Move consumers</strong> once their lag on the new cluster is caught up. Offset translation means they resume at the right position rather than reprocessing everything.</li>
<li><strong>Verify</strong>, then decommission.</li>
</ol>
<p><strong>Scenario 3 — changing a topic's schema or partition count incompatibly:</strong> create a <em>new</em> topic (<code>orders.v2</code>), dual-write to both, migrate consumers one at a time, then retire v1. This is almost always safer than mutating a live topic, because you can roll back by simply pointing consumers back at v1.</p>
<p><strong>The constraint worth stating:</strong> you can <em>increase</em> partitions but never decrease them, and increasing them breaks key-to-partition affinity — an existing key hashes to a different partition, so its old and new events are no longer ordered relative to each other. If ordering matters, a new topic is the only correct migration path, not <code>--alter --partitions</code>.</p>`
}
]);
