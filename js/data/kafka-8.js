registerSimple("kafka", {
"What is a Kafka producer's internal flow — batching, linger and compression?":
`When you call <code>send()</code>, the message is not sent straight away. It goes into a memory buffer, and a background thread groups messages for the same partition into batches and sends them together, which is far more efficient. <code>linger.ms</code> is how long it waits to fill a batch, and compression shrinks each batch before sending.`,

"How do you handle consumer lag and scale consumers?":
`Lag is how far behind a consumer is: how many messages are waiting that it has not processed yet. If lag keeps growing, consumers are too slow. Find what is slow first (often a database call), then speed up processing or add more consumers, up to the number of partitions. To go beyond that, add partitions.`,

"What is the difference between at-least-once processing and idempotent consumers in code?":
`<b>At-least-once</b> means Kafka guarantees each message is delivered, but sometimes more than once, for example after a crash. An <b>idempotent consumer</b> is code that makes duplicates harmless: it records each message id it has handled (in the same database transaction as its work) and skips any id it has seen before.`,

"How do you migrate or reprocess data with Kafka?":
`Because Kafka keeps messages after they are read, you can replay them: reset a consumer group's bookmark (offset) to an earlier point, or start a new consumer group that reads from the beginning. This is useful for fixing a bug and reprocessing, or for filling a new service with past data.`,

"What are Kafka Connect and its use cases?":
`Kafka Connect moves data between Kafka and other systems using ready-made connectors, configured rather than coded. Source connectors bring data in, for example every change from a database. Sink connectors send data out, for example into Elasticsearch, S3 or a data warehouse.`,

"How do you secure a Kafka cluster?":
`Use three layers. <b>Encryption</b>: TLS so data cannot be read on the network. <b>Authentication</b>: each client proves who it is with SASL or certificates. <b>Authorization</b>: access rules (ACLs) say which client may read or write which topic. Each layer is configured separately.`,

"What happens when a broker fails, and how does leader election work?":
`Each partition has one leader broker that handles reads and writes, and follower brokers that keep copies. If the leader fails, Kafka promotes one of the up-to-date followers to be the new leader, and clients automatically switch to it. With enough copies, no acknowledged messages are lost.`,

"How do you design Kafka topics and naming conventions?":
`Use clear, consistent names, such as <code>orders.order-placed.v1</code>. Decide whether each topic holds one kind of event or all events for one kind of thing, choose a key that keeps related events in order, plan enough partitions for future load, and set retention to how long messages must be replayable.`,

"What is the difference between Kafka's consumer poll loop and the Spring listener container?":
`With the plain Kafka client, you write a loop that calls <code>poll()</code> to fetch messages, processes them and commits offsets. Spring's listener container runs that loop for you and simply calls your <code>@KafkaListener</code> method. Either way, if processing takes too long between polls, Kafka assumes the consumer is dead and rebalances.`,

"How do you handle large messages and the claim-check pattern in Kafka?":
`Kafka works best with small messages; large ones slow down everything else on the partition. The claim-check pattern stores the large data (such as a file) in object storage like S3 and puts only a small reference to it in the Kafka message. Consumers fetch the data using that reference.`,

"How do you migrate a Kafka cluster or topic without downtime?":
`To move data between brokers, reassign partitions gradually with a speed limit so live traffic is not starved. To move to a new cluster, copy data across with a replication tool such as MirrorMaker, move consumers first and producers last, and check that offsets line up before switching off the old cluster.`,

"Design an order processing pipeline with Kafka — walk through the whole flow":
`The order service saves the order and publishes "order placed" using the outbox pattern. Payment, inventory and shipping services each read the events they care about in their own consumer group, do their part, and publish their own events. Keying by order id keeps each order's events in order; idempotent consumers and dead-letter topics handle duplicates and failures.`,

"How do you guarantee exactly-once processing when writing to a database?":
`Kafka's exactly-once feature only covers reading from and writing to Kafka itself. When your consumer writes to a database, you get exactly-once results by making the write idempotent: store the processed message id (or the offset) in the same database transaction as the change, and skip messages already recorded.`,

"A consumer is lagging badly in production — how do you diagnose and fix it?":
`Check whether all partitions lag or just one. All lagging means consumers are too slow overall: speed up processing or add consumers. One lagging means a "hot" key sends too much to one partition, or one consumer is stuck. Also check for repeated rebalances and slow downstream calls such as the database.`,

"What happens when a consumer in a group fails — explain rebalancing in detail":
`When a consumer stops responding, Kafka redistributes its partitions among the remaining members. This is a rebalance. With the older protocol, the whole group pauses during it. The new owners resume from the last committed offset, so messages handled but not yet committed are processed again.`,

"How do you decide between Kafka, RabbitMQ and a database table as a queue?":
`<b>Kafka</b>: huge volumes, keeping events to replay, and many independent readers. <b>RabbitMQ</b>: classic task queues with flexible routing and per-message acknowledgement. <b>A database table</b>: small volumes when you already have a database and want the job saved in the same transaction as your data.`,

"Consumer lag is growing in production — how do you diagnose and fix it?":
`Lag grows when messages arrive faster than they are processed. Look at whether every partition lags (consumers too slow: optimise or add consumers up to the partition count) or only one (an overloaded key or a stuck consumer). Also look for rebalance loops and slow external calls inside the consumer.`,

"How do you handle a poison message and design retries in Kafka?":
`A poison message is one that always fails. If the consumer keeps retrying it, the whole partition gets stuck. Retry a few times with short waits for temporary errors, and if it still fails, send it to a dead-letter topic and move on. Someone can then inspect and replay it later.`,

"How do you evolve a Kafka message schema without breaking consumers?":
`Producers and consumers are updated at different times, and old messages stay in Kafka, so message formats must change carefully. Use a schema registry with Avro, Protobuf or JSON Schema, which checks every new version is compatible. Safe changes: add optional fields with defaults. Unsafe: removing or renaming fields that others still use.`,

"How do Kafka Streams and event-driven patterns differ from a plain consumer?":
`A plain consumer reads messages and you write everything else yourself. Kafka Streams is a library that adds built-in tools for processing streams: joining streams, counting over time windows, and keeping local state that survives restarts. It suits real-time calculations, such as live totals, without a separate processing cluster.`,

"Size a Kafka topic for 50,000 events per second: partitions, retention and disk":
`Work it out with simple arithmetic. Partitions come from how many messages one consumer can process per second: 50,000 ÷ 2,000 per consumer = 25, doubled for headroom. Disk comes from message size × rate × retention time × number of copies. Then check how long you would need to catch up after an outage.`,

"Messages arrive out of order. Find the five ways ordering breaks in Kafka":
`Kafka only keeps order within one partition, so order breaks when: messages have no key or the wrong key, a consumer processes a batch in parallel, failed messages are retried later through a separate topic, partitions are added (moving keys), or old producer settings reorder retries. Adding a version number to events lets consumers ignore stale ones.`,

"What is Apache Kafka and how is it different from a traditional message queue?":
`Kafka is a durable log of events. Producers append messages, and consumers read them by keeping a bookmark (offset). Unlike a traditional queue, which deletes a message once it is consumed, Kafka keeps messages for a set time, so many different consumers can read the same messages and old ones can be replayed.`,

"Explain topics, partitions, offsets and brokers":
`A <b>topic</b> is a named stream of messages, like "orders". It is split into <b>partitions</b> so it can be spread over machines and read in parallel. Each message has an <b>offset</b>, its position number within the partition. A <b>broker</b> is one Kafka server; a cluster has several, holding copies of each partition.`,

"How does a consumer group work and what triggers a rebalance?":
`Consumers with the same group id form a team that shares a topic's partitions: each partition is read by exactly one team member. A rebalance (reshuffling which member reads which partition) happens when a member joins, leaves or crashes, or takes too long between fetches.`,

"How does Kafka guarantee message ordering?":
`Only within a single partition. Messages with the same key always go to the same partition, so they are read in the order they were written. There is no ordering across different partitions. So give related messages the same key, such as the order id.`,

"What are the delivery semantics — at-most-once, at-least-once, exactly-once?":
`<b>At-most-once</b>: a message may be lost but is never repeated. <b>At-least-once</b>: never lost but may be repeated; this is the common default. <b>Exactly-once</b>: neither lost nor repeated, which Kafka supports for Kafka-to-Kafka processing; with databases you achieve it with idempotent consumers.`,

"What are acks, ISR and min.insync.replicas?":
`<b>acks</b> controls how many brokers must confirm a message before the producer considers it saved; <code>acks=all</code> is the safest. The <b>ISR</b> (in-sync replicas) is the set of copies that are fully up to date. <b>min.insync.replicas</b> sets how many of those must confirm a write, so data survives a broker failure.`,

"How do consumer offsets and commits work?":
`An offset is a consumer group's bookmark in a partition. Committing saves that bookmark in Kafka, meaning "everything before this is done". Commit after processing, not before: committing first risks losing a message if you crash, while committing after may repeat one, which idempotent consumers handle.`,

"How do you handle failures and retries in a Kafka consumer?":
`First decide whether a failure is temporary (a timeout, worth retrying) or permanent (bad data, retrying will not help). Retry temporary failures a few times with growing waits, send permanent failures and exhausted retries to a dead-letter topic, and never let one bad message block the whole partition.`,

"What is the transactional outbox pattern and why do you need it?":
`You often need to save data and also publish an event, but a database and Kafka cannot share one transaction, so a crash in between leaves them out of step. The outbox pattern saves the event into an "outbox" table in the same database transaction as your data, and a separate process reliably publishes outbox rows to Kafka.`,

"How do you choose the number of partitions?":
`Partitions set the maximum number of consumers that can work in parallel in one group. Estimate your peak message rate, divide by how many messages one consumer can handle per second, and add headroom. Adding partitions later changes which partition each key goes to, so it is better to plan generously at the start.`,

"What is log compaction and when would you use it?":
`Normally Kafka deletes messages after a set time. With log compaction, it instead keeps at least the latest message for each key, removing older ones for the same key. That suits topics that represent the current state of something, such as each customer's latest address, which a new service can read to rebuild the full picture.`,

"How do you produce and consume messages in Spring Boot?":
`Add Spring Kafka. Send messages with <code>KafkaTemplate.send(topic, key, value)</code>. Receive them by putting <code>@KafkaListener(topics = "orders", groupId = "billing")</code> on a method. Configure serialisers for your message format, error handling for failures, and safe settings such as <code>acks=all</code>.`,

"What is Kafka Streams and how does it differ from a plain consumer?":
`Kafka Streams is a Java library for processing streams of events, running inside your own application. Beyond reading messages, it gives you filtering, joining streams, counting over time windows and local state, with no separate processing cluster. A plain consumer just hands you messages and leaves the rest to you.`,

"How do you handle schema evolution with Kafka?":
`Use a schema registry that stores the format of each topic's messages and checks every new version is compatible with the old ones. Make only safe changes, such as adding optional fields with defaults, so old consumers can still read new messages and new consumers can still read old ones.`,

"How do you monitor Kafka in production?":
`The most important number is consumer lag: how many messages are waiting to be processed. Also watch partitions that are under-replicated (copies falling behind), broker disk usage, request rates and errors, and how often consumer groups rebalance. Alert on lag that keeps growing.`,

"What is ZooKeeper's role, and what is KRaft?":
`Kafka used to need a separate system, ZooKeeper, to keep track of the cluster: which brokers exist and which partitions they lead. KRaft is Kafka's newer built-in replacement, where Kafka manages this itself. It makes clusters simpler to run, and new versions no longer use ZooKeeper at all.`,

"Kafka vs RabbitMQ — when would you choose each?":
`Choose <b>Kafka</b> for very high volumes, keeping events to replay later, and many independent consumers of the same data. Choose <b>RabbitMQ</b> for classic task queues where each job should be done once by one worker, with flexible routing rules and per-message acknowledgement.`
});
