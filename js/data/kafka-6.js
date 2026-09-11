appendTopic("kafka", [
{
  q: "How do you evolve a Kafka message schema without breaking consumers?",
  level: "advanced", hot: true, tags: ["schema", "avro", "compatibility", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "SAP", "Goldman Sachs", "Swiggy"],
  a: `<p>A topic is a long-lived contract. Producers and consumers deploy independently and old messages stay on disk for the retention period — so the schema has to change without a coordinated release.</p>
<table>
<tr><th>Compatibility mode</th><th>Allows</th><th>Upgrade first</th></tr>
<tr><td><strong>BACKWARD</strong> (default)</td><td>Delete a field; add an <strong>optional</strong> field</td><td><strong>Consumers</strong></td></tr>
<tr><td>FORWARD</td><td>Add a field; delete an optional one</td><td>Producers</td></tr>
<tr><td><strong>FULL</strong></td><td>Only add/remove optional fields with defaults</td><td>Either — safest</td></tr>
<tr><td>NONE</td><td>Anything</td><td>Good luck</td></tr>
</table>
<pre><code>// Avro — every new field needs a DEFAULT, or old messages cannot be read
{
  "type": "record", "name": "OrderCreated",
  "fields": [
    { "name": "orderId", "type": "long" },
    { "name": "total",   "type": "long" },
    { "name": "channel", "type": ["null", "string"], "default": null }   // ✔ safe
  ]
}
// Safe:    add an optional field with a default; delete a field that has one;
//          add a value to the END of an enum (if consumers tolerate unknowns).
// Unsafe:  rename a field (= delete + add), change its type, make an optional
//          field required, reorder positional fields.</code></pre>
<pre><code># Schema Registry enforces it at PRODUCE time, so a bad schema never ships
spring.kafka.properties.schema.registry.url: http://schema-registry:8081
spring.kafka.producer.value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
spring.kafka.properties.auto.register.schemas: false   # register via CI, not at runtime

# Check compatibility in the pipeline, before merge:
mvn io.confluent:kafka-schema-registry-maven-plugin:test-compatibility</code></pre>
<table>
<tr><th>Format</th><th>Trade-off</th></tr>
<tr><td><strong>Avro</strong></td><td>Compact, schema-registry native, strong evolution rules. The common default.</td></tr>
<tr><td>Protobuf</td><td>Compact, great tooling, field numbers make evolution explicit</td></tr>
<tr><td>JSON Schema</td><td>Readable and debuggable; much larger on the wire</td></tr>
<tr><td>Plain JSON, no registry</td><td>Easy on day one, and the source of the outage on day 400</td></tr>
</table>
<p><strong>The rule for a breaking change:</strong> you cannot make one in place. Publish to a <strong>new topic</strong> (<code>orders.v2</code>), run both for a retention period, migrate consumers, then retire v1. The same expand/contract discipline as a database migration.</p>
<p><strong>The consumer-side habit that saves you:</strong> tolerate unknown fields and unknown enum values. A consumer that throws on an enum value it has not seen turns an additive, "safe" producer change into an outage — and that is the most common way schema evolution still bites teams that did everything else right.</p>`
},
{
  q: "How do Kafka Streams and event-driven patterns differ from a plain consumer?",
  level: "advanced", tags: ["kafka-streams", "architecture", "stateful"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Goldman Sachs", "Uber"],
  a: `<table>
<tr><th></th><th>Plain consumer</th><th>Kafka Streams</th></tr>
<tr><td>State</td><td>You manage it — usually a database</td><td><strong>Local state stores</strong>, backed by a changelog topic</td></tr>
<tr><td>Joins, windows, aggregation</td><td>By hand</td><td>Built in</td></tr>
<tr><td>Exactly-once</td><td>Hard to get right</td><td><code>processing.guarantee=exactly_once_v2</code></td></tr>
<tr><td>Scaling</td><td>Add consumers up to the partition count</td><td>Same, and state is repartitioned with them</td></tr>
<tr><td>Deployment</td><td>A normal service</td><td>A normal service — it is a library, not a cluster</td></tr>
</table>
<pre><code>// Aggregation with local state — no database round trip per message
StreamsBuilder b = new StreamsBuilder();
b.stream("orders", Consumed.with(Serdes.String(), orderSerde))
 .groupBy((k, o) -&gt; o.customerId())
 .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
 .aggregate(() -&gt; 0L,
            (k, o, sum) -&gt; sum + o.total(),
            Materialized.with(Serdes.String(), Serdes.Long()))
 .toStream()
 .to("customer-spend-5m");</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="KStream of events versus KTable of latest state">
  <text class="dg-t" x="16" y="22">KStream — a stream of facts</text>
  <rect class="dg-fill" x="16" y="30" width="98" height="26" rx="4"/><text class="dg-s" x="65" y="48" text-anchor="middle">a: 10</text>
  <rect class="dg-fill" x="118" y="30" width="98" height="26" rx="4"/><text class="dg-s" x="167" y="48" text-anchor="middle">a: 20</text>
  <rect class="dg-fill" x="220" y="30" width="98" height="26" rx="4"/><text class="dg-s" x="269" y="48" text-anchor="middle">b: 5</text>
  <text class="dg-s" x="340" y="48">every event is kept — sum = 35</text>
  <text class="dg-t" x="16" y="92">KTable — the latest value per key</text>
  <rect class="dg-fill2" x="16" y="100" width="98" height="26" rx="4"/><text class="dg-s" x="65" y="118" text-anchor="middle">a: 20</text>
  <rect class="dg-fill2" x="118" y="100" width="98" height="26" rx="4"/><text class="dg-s" x="167" y="118" text-anchor="middle">b: 5</text>
  <text class="dg-s" x="240" y="118">a:10 was OVERWRITTEN — it is an upsert log</text>
</svg>
</figure>
<table>
<tr><th>Abstraction</th><th>Is</th></tr>
<tr><td><code>KStream</code></td><td>An unbounded sequence of independent events (facts)</td></tr>
<tr><td><code>KTable</code></td><td>A changelog — the latest value per key, compacted</td></tr>
<tr><td><code>GlobalKTable</code></td><td>Fully replicated to every instance; joins need no co-partitioning</td></tr>
<tr><td>State store</td><td>Local RocksDB, backed by a Kafka changelog topic so it survives a restart</td></tr>
</table>
<pre><code>// The co-partitioning rule that trips people up:
// to join two KStreams they must have the SAME number of partitions AND the
// same key, or records for one key land on different instances and never meet.
// If they do not match, repartition first — Streams inserts a topic to do it,
// which is a real cost worth knowing about.</code></pre>
<p><strong>When to reach for it:</strong> stateful stream processing — windowed aggregation, joining two streams, deduplication, building a materialised view. For "consume a message and write to the database", a plain <code>@KafkaListener</code> is simpler and easier to debug, and it is what most services actually need.</p>
<p><strong>The alternative to name:</strong> <strong>change data capture</strong> with Debezium reads the database WAL and publishes row changes as events — no application code at all. It is often the better answer to "get our data into Kafka", and it composes with the transactional outbox pattern.</p>`
}
]);
