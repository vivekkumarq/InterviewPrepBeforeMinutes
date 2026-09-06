appendTopic("kafka", [
{
  q: "What is a Kafka producer's internal flow — batching, linger and compression?",
  level: "advanced", hot: true, tags: ["producer", "performance"],
  a: `<p><code>send()</code> does not write to the network. It appends to an in-memory buffer, and a background <em>sender</em> thread groups records into batches per partition and ships them.</p>
<pre><code>send() -&gt; serialize -&gt; partition -&gt; RecordAccumulator (per-partition batches)
                                        |
                              Sender thread -&gt; broker</code></pre>
<pre><code>batch.size: 65536            # bytes per partition batch; send when full
linger.ms: 10                # OR wait this long to fill the batch — the key throughput knob
compression.type: lz4        # compress the BATCH: bigger batch = better ratio
buffer.memory: 67108864      # total producer buffer; send() blocks when exhausted
max.block.ms: 5000           # how long send() may block before throwing
acks: all
enable.idempotence: true
max.in.flight.requests.per.connection: 5</code></pre>
<p><strong>The <code>linger.ms</code> trade-off is the heart of this question:</strong> the default is 0, meaning "send immediately", which produces many small requests. Setting it to 5–20 ms lets batches fill, which dramatically improves throughput and compression ratio at the cost of a few milliseconds of latency. For most event pipelines that is an excellent trade; for a low-latency request path it is not.</p>
<p><strong>Compression matters more than people expect:</strong> it applies to the whole batch, so bigger batches compress far better. <code>lz4</code> and <code>zstd</code> are the usual choices — <code>gzip</code> costs too much CPU, <code>snappy</code> is fast but compresses less. Compressed batches also stay compressed on disk and are served compressed to consumers, so you save network and storage on every hop.</p>
<pre><code>// send() is ASYNC and returns a Future — never ignore the result
producer.send(record, (metadata, exception) -&gt; {
    if (exception != null) log.error("publish failed key={}", record.key(), exception);
});
// producer.send(record).get();   // synchronous — kills throughput, use only when required</code></pre>
<p>Also mention that a full <code>buffer.memory</code> makes <code>send()</code> block for up to <code>max.block.ms</code> then throw — which is the backpressure signal that a downstream slowdown has reached your producer.</p>`
},
{
  q: "How do you handle consumer lag and scale consumers?",
  level: "advanced", hot: true, tags: ["consumers", "production"],
  a: `<p><strong>Consumer lag</strong> = latest offset in the partition − last committed offset. Growing lag means consumption is slower than production.</p>
<pre><code># Diagnose
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\
    --describe --group billing-service
# TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG  CONSUMER-ID</code></pre>
<p><strong>Fixes, in the order I would try them:</strong></p>
<ol>
<li><strong>Find where the time goes.</strong> Instrument processing time per record. Lag is nearly always caused by a slow downstream call or an N+1 query in the handler, not by Kafka.</li>
<li><strong>Batch the work.</strong> Process the whole poll batch at once — one bulk database write instead of 500 individual ones is often a 10× improvement with no extra infrastructure.
<pre><code>@KafkaListener(topics = "orders", batch = "true")
public void consume(List&lt;OrderEvent&gt; events, Acknowledgment ack) {
    repo.saveAll(map(events));       // one round trip
    ack.acknowledge();
}</code></pre></li>
<li><strong>Add consumers</strong> — up to the partition count. Beyond that, extra instances sit idle.</li>
<li><strong>Add partitions</strong> if you have hit the ceiling — but remember this breaks key-to-partition affinity for existing keys.</li>
<li><strong>Increase <code>concurrency</code></strong> in Spring Kafka, which creates that many consumer threads in one application instance.</li>
<li><strong>Parallelise within a partition</strong> — only if ordering does not matter, since handing records to a thread pool destroys the ordering guarantee Kafka gave you.</li>
<li><strong>Tune the poll loop</strong> — <code>max.poll.records</code>, <code>fetch.min.bytes</code>, <code>max.partition.fetch.bytes</code>.</li>
</ol>
<p><strong>Alert on lag, not on throughput</strong> — and alert on lag <em>trend</em> rather than an absolute number, since a healthy service often has bursty lag. Use Kafka Lag Exporter or Burrow, and consider <strong>KEDA</strong> to autoscale consumer pods on lag directly, which is far more responsive than CPU-based scaling.</p>`
},
{
  q: "What is the difference between at-least-once processing and idempotent consumers in code?",
  level: "advanced", hot: true, tags: ["reliability", "patterns"],
  a: `<pre><code>// The problem: at-least-once delivery means duplicates are NORMAL, not exceptional.
// A rebalance, a redeploy, or a failed commit all cause redelivery.

@KafkaListener(topics = "payments", groupId = "ledger")
@Transactional                                   // dedupe + effect in ONE transaction
public void handle(PaymentCompletedEvent event, Acknowledgment ack) {
    try {
        // Unique constraint on event_id does the work — no check-then-act race
        processedRepo.saveAndFlush(new ProcessedEvent(event.eventId(), Instant.now()));
    } catch (DataIntegrityViolationException duplicate) {
        log.debug("event {} already processed", event.eventId());
        ack.acknowledge();
        return;
    }
    ledgerService.credit(event.accountId(), event.amount());   // the actual side effect
    ack.acknowledge();
}</code></pre>
<p><strong>Why the transaction boundary matters:</strong> if the dedupe insert and the business effect are in separate transactions, a crash between them either double-applies the effect or permanently skips it. They must commit together.</p>
<p><strong>Alternatives that avoid a dedupe table entirely — often better:</strong></p>
<pre><code>// 1. Naturally idempotent operation — absolute state, not a delta
UPDATE orders SET status = 'SHIPPED' WHERE id = ?;        // safe to repeat
UPDATE orders SET retry_count = retry_count + 1 ...       // NOT safe to repeat

// 2. Conditional update — the second attempt affects zero rows
UPDATE orders SET status = 'PAID', paid_at = ?
WHERE id = ? AND status = 'PENDING';

// 3. Business unique constraint
ALTER TABLE ledger_entry ADD CONSTRAINT uq_entry UNIQUE (account_id, payment_reference);</code></pre>
<p><strong>Operational detail people forget:</strong> the <code>processed_events</code> table grows forever. Give it a TTL matched to your maximum redelivery window (a few days) and a scheduled cleanup, or it becomes the largest table in the database and its index slows every consume.</p>
<p><strong>The summary line:</strong> "Kafka gives at-least-once delivery; the consumer turns that into effectively-once <em>processing</em>. Exactly-once end-to-end across an external system does not exist — idempotency is the engineering answer."</p>`
},
{
  q: "How do you migrate or reprocess data with Kafka?",
  level: "advanced", tags: ["operations"],
  a: `<p>Because Kafka retains messages after consumption, replay is a first-class capability — this is one of its main advantages over a queue.</p>
<pre><code># 1. Reset a consumer group's offsets (the group must be INACTIVE)
kafka-consumer-groups.sh --bootstrap-server kafka:9092 --group billing \\
  --reset-offsets --to-earliest --topic orders --execute

# Other reset targets
--to-datetime 2026-09-01T00:00:00.000    # replay from a point in time
--to-offset 12345
--shift-by -1000                          # go back 1000 messages
--by-duration PT2H                        # two hours ago
--dry-run                                 # ALWAYS run this first</code></pre>
<pre><code>// 2. A NEW consumer group replays independently without disturbing the live one
spring.kafka.consumer.group-id: billing-reprocess-2026-09
spring.kafka.consumer.auto-offset-reset: earliest</code></pre>
<p><strong>Common scenarios and the right approach:</strong></p>
<ul>
<li><strong>Bug fix requiring reprocessing</strong> — deploy the fix, then create a <em>new</em> consumer group and replay from the relevant point. The old group is untouched, so you can compare results before switching.</li>
<li><strong>Building a new read model / projection</strong> — a new group reads from <code>earliest</code> and builds the projection from history. This is the core benefit of event sourcing.</li>
<li><strong>Recovering from a poison-pill outage</strong> — fix the handler, then replay from the DLT topic rather than the main topic.</li>
<li><strong>Schema migration</strong> — dual-write to a v2 topic, backfill it from v1, migrate consumers, then retire v1.</li>
</ul>
<p><strong>The critical prerequisite:</strong> replay only works if consumers are <strong>idempotent</strong>. Replaying a million payment events through a non-idempotent consumer charges every customer again. Say this — it is the difference between knowing the command and understanding the practice.</p>
<p>Also consider the blast radius: a replay produces a large burst of load on downstream systems. Throttle the reprocessing consumer, and run it against a separate consumer group with lower concurrency so it does not starve live traffic.</p>`
},
{
  q: "What are Kafka Connect and its use cases?",
  level: "beginner", tags: ["ecosystem"],
  a: `<p>Kafka Connect is a framework for moving data between Kafka and external systems <em>without writing code</em> — you configure connectors instead.</p>
<ul>
<li><strong>Source connectors</strong> pull data <em>into</em> Kafka: databases (Debezium CDC), files, S3, MQTT, JDBC.</li>
<li><strong>Sink connectors</strong> push data <em>out</em>: Elasticsearch, S3, JDBC, BigQuery, Snowflake.</li>
</ul>
<pre><code>{
  "name": "orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres",
    "database.dbname": "orders",
    "table.include.list": "public.orders,public.outbox",
    "plugin.name": "pgoutput",
    "topic.prefix": "acme",
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter"
  }
}</code></pre>
<p><strong>Where it genuinely earns its place:</strong></p>
<ul>
<li><strong>Change Data Capture with Debezium</strong> — reads the database write-ahead log and publishes every row change as an event. This is the production-grade implementation of the <strong>transactional outbox</strong> pattern: no polling, low latency, and it cannot miss a row.</li>
<li><strong>Strangler-fig migrations</strong> — stream a legacy database into Kafka so new services can consume it without the legacy system knowing.</li>
<li><strong>Fanning data into a search index or data warehouse</strong> without adding that responsibility to your service.</li>
</ul>
<p><strong>What you get for free:</strong> distributed execution, offset management, restart-safety, schema handling with the registry, dead-letter queues, and Single Message Transforms for light reshaping. That is a lot of code you would otherwise write, test and operate yourself.</p>
<p><strong>When not to use it:</strong> if the transformation is genuinely business logic rather than plumbing, a Kafka Streams application or a normal consumer is clearer. Connect is for movement, not for domain rules.</p>`
},
{
  q: "How do you secure a Kafka cluster?",
  level: "advanced", tags: ["security", "production"],
  a: `<p>Three independent layers, each configured separately:</p>
<ol>
<li><strong>Encryption in transit — TLS</strong>
<pre><code>security.protocol: SSL
ssl.truststore.location: /etc/kafka/truststore.jks
ssl.keystore.location: /etc/kafka/keystore.jks       # for mTLS client auth</code></pre></li>
<li><strong>Authentication — SASL or mTLS</strong>
<pre><code>security.protocol: SASL_SSL
sasl.mechanism: SCRAM-SHA-512        # or OAUTHBEARER, GSSAPI (Kerberos), PLAIN
sasl.jaas.config: org.apache.kafka.common.security.scram.ScramLoginModule required \\
    username="billing-service" password="\${KAFKA_PASSWORD}";</code></pre>
Prefer SCRAM or mTLS over PLAIN. OAUTHBEARER integrates with an existing IdP such as Keycloak, which avoids a separate credential store.</li>
<li><strong>Authorization — ACLs</strong>
<pre><code>kafka-acls.sh --add --allow-principal User:billing-service \\
  --operation Read --topic orders --group billing-service

kafka-acls.sh --add --allow-principal User:order-service \\
  --operation Write --topic orders</code></pre>
Grant per principal, per topic, per operation — least privilege. Note a consumer needs <code>Read</code> on both the <em>topic</em> and the <em>group</em>.</li>
</ol>
<p><strong>Beyond the three layers:</strong></p>
<ul>
<li><strong>Encryption at rest</strong> — disk encryption on brokers; Kafka itself does not encrypt payloads. For genuinely sensitive fields, encrypt in the producer so brokers and operators never see plaintext.</li>
<li><strong>Network isolation</strong> — brokers in a private subnet, security groups or Kubernetes NetworkPolicies restricting who can reach port 9092.</li>
<li><strong>Set <code>auto.create.topics.enable=false</code></strong> — otherwise a typo in a consumer creates a topic with default settings and no ACLs.</li>
<li><strong>Audit</strong> — enable authorizer logging so denied operations are visible; a sudden spike is a strong signal.</li>
<li><strong>Do not put PII in message keys</strong> — keys appear in metrics, logs and partition tooling.</li>
</ul>`
},
{
  q: "What happens when a broker fails, and how does leader election work?",
  level: "advanced", tags: ["reliability", "internals"],
  a: `<p>Each partition has one <strong>leader</strong> (handling all reads and writes) and several <strong>followers</strong> replicating from it. Only replicas in the <strong>ISR</strong> (in-sync replica set) are eligible to become leader.</p>
<p><strong>When a broker fails:</strong></p>
<ol>
<li>The controller (elected via KRaft, previously ZooKeeper) detects the failure through session expiry.</li>
<li>For every partition that broker led, the controller elects a new leader from the ISR — normally the first replica in the list.</li>
<li>The new leader's endpoint is propagated in metadata; clients receive <code>NOT_LEADER_FOR_PARTITION</code> and refresh their metadata automatically.</li>
<li>Producers and consumers retry transparently. A brief spike in latency and retries is normal; data is not lost provided <code>acks=all</code> and <code>min.insync.replicas ≥ 2</code>.</li>
</ol>
<pre><code># The configuration that determines whether failover is safe
replication.factor: 3
min.insync.replicas: 2
unclean.leader.election.enable: false     # NEVER promote an out-of-sync replica</code></pre>
<p><strong>Why <code>unclean.leader.election</code> must stay false:</strong> setting it true lets an out-of-sync replica become leader when no ISR member is available. The cluster stays writable — but every message the old leader had that this replica lacked is <strong>silently lost</strong>. It trades durability for availability, and the loss is invisible. The default is false for good reason.</p>
<p><strong>What to monitor:</strong> <code>UnderReplicatedPartitions</code> and <code>OfflinePartitionsCount</code> should both be 0; <code>ActiveControllerCount</code> should be exactly 1 across the cluster. ISR shrink/expand churn indicates a struggling broker or network, and usually precedes a real incident.</p>
<p><strong>Also worth mentioning:</strong> rack awareness (<code>broker.rack</code>) spreads replicas across availability zones so one zone failure cannot take all copies of a partition — otherwise replication factor 3 gives you no protection against the failure mode that actually happens.</p>`
}
]);
