appendTopic("sql", [
{
  q: "How do you run a schema migration on a large table without downtime?",
  level: "advanced", hot: true, tags: ["migration", "production", "ddl", "zero-downtime"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Goldman Sachs", "Societe Generale"],
  a: `<p>During any rolling deploy, the <strong>old and new code run at the same time against one schema</strong>. So every migration must be compatible with both — which is what expand/contract enforces.</p>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Expand migrate contract migration phases">
  <rect class="dg-fill" x="12" y="42" width="180" height="52" rx="9"/>
  <text class="dg-s" x="102" y="63" text-anchor="middle">1. EXPAND</text><text class="dg-s" x="102" y="81" text-anchor="middle">add the new column, nullable</text>
  <path class="dg-line" d="M196 68 H222" marker-end="url(#mg3)"/>
  <rect class="dg-fill" x="226" y="42" width="180" height="52" rx="9"/>
  <text class="dg-s" x="316" y="63" text-anchor="middle">2. MIGRATE</text><text class="dg-s" x="316" y="81" text-anchor="middle">backfill + dual-write</text>
  <path class="dg-line" d="M410 68 H436" marker-end="url(#mg3)"/>
  <rect class="dg-box" x="440" y="42" width="168" height="52" rx="9"/>
  <text class="dg-s" x="524" y="63" text-anchor="middle">3. CONTRACT</text><text class="dg-s" x="524" y="81" text-anchor="middle">drop the old column</text>
  <text class="dg-s" x="12" y="128">each phase is a separate, independently revertible release — never one migration</text>
  <defs><marker id="mg3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Operation</th><th>Safe on a big table?</th><th>Do instead</th></tr>
<tr><td>Add a nullable column</td><td><strong>Yes</strong> — metadata only</td><td>—</td></tr>
<tr><td>Add <code>NOT NULL</code> with a default</td><td>Postgres 11+ yes; older versions rewrite the table</td><td>Add nullable, backfill, then add the constraint</td></tr>
<tr><td><strong>Rename a column</strong></td><td><strong>No</strong> — breaks the running old code instantly</td><td>Add new, dual-write, backfill, migrate reads, drop old</td></tr>
<tr><td>Change a column type</td><td>Usually rewrites and locks</td><td>New column + backfill</td></tr>
<tr><td>Add an index</td><td>Locks writes</td><td><code>CREATE INDEX CONCURRENTLY</code></td></tr>
<tr><td>Add a foreign key</td><td>Validates the whole table under a lock</td><td><code>NOT VALID</code>, then <code>VALIDATE CONSTRAINT</code></td></tr>
<tr><td>Drop a column</td><td>Fast, but breaks old code</td><td>Only in the contract phase</td></tr>
</table>
<pre><code>-- The two-step trick that avoids a long lock, twice
ALTER TABLE orders ADD CONSTRAINT fk_customer
  FOREIGN KEY (customer_id) REFERENCES customer(id) NOT VALID;   -- instant
ALTER TABLE orders VALIDATE CONSTRAINT fk_customer;              -- scans, no
                                                                  -- exclusive lock
CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status);
-- Slower and cannot run in a transaction, but takes no write lock.
-- If it fails it leaves an INVALID index — drop and retry.

-- And always bound the wait, so a migration cannot queue behind a long query
-- and then block everything behind ITSELF:
SET lock_timeout = '3s';
SET statement_timeout = '30s';</code></pre>
<pre><code>-- Backfill in BATCHES. One big UPDATE locks millions of rows, bloats the
-- table and floods replication.
DO $$
DECLARE rows_done int;
BEGIN
  LOOP
    UPDATE orders SET total_minor = total * 100
    WHERE id IN (SELECT id FROM orders WHERE total_minor IS NULL LIMIT 5000);
    GET DIAGNOSTICS rows_done = ROW_COUNT;
    EXIT WHEN rows_done = 0;
    COMMIT;
    PERFORM pg_sleep(0.1);          -- let replicas and autovacuum keep up
  END LOOP;
END $$;</code></pre>
<p><strong>Tooling:</strong> Flyway or Liquibase for versioned, repeatable migrations that run on startup or in the pipeline. The rule that matters more than the tool: <strong>migrations are append-only</strong>. Never edit a migration that has run anywhere — write a new one, because the checksum of the old one is recorded and editing it breaks every environment that already applied it.</p>
<p><strong>Say this:</strong> "I treat a rename as three releases, not one. It feels slow, but it is the only version where I can roll back at any point — and a migration you cannot roll back is the thing that turns a bad deploy into an incident."</p>`
},
{
  q: "When would you choose NoSQL over a relational database?",
  level: "advanced", tags: ["nosql", "design", "trade-offs", "architecture"],
  companies: ["Amazon", "Flipkart", "Walmart", "Uber", "Swiggy", "SAP", "Optum", "Adobe"],
  a: `<table>
<tr><th>Type</th><th>Example</th><th>Fits</th></tr>
<tr><td>Relational</td><td>PostgreSQL, MySQL</td><td><strong>The default.</strong> Joins, transactions, ad-hoc queries, constraints.</td></tr>
<tr><td>Key-value</td><td>Redis, DynamoDB</td><td>Sessions, caches, one known access pattern at huge scale</td></tr>
<tr><td>Document</td><td>MongoDB</td><td>Varying shape per record, read as a whole aggregate</td></tr>
<tr><td>Wide-column</td><td>Cassandra, ScyllaDB</td><td>Enormous write volume, time series, multi-region writes</td></tr>
<tr><td>Search</td><td>Elasticsearch, OpenSearch</td><td>Full text, faceting, relevance ranking</td></tr>
<tr><td>Graph</td><td>Neo4j</td><td>Deep relationship traversal — fraud rings, recommendations</td></tr>
<tr><td>Time series</td><td>TimescaleDB, InfluxDB</td><td>Metrics, IoT, downsampling and retention</td></tr>
</table>
<p><strong>The real question is never "SQL or NoSQL"</strong> — it is <em>what are the access patterns, and does one machine still fit?</em> Relational databases scale much further than people assume, and Postgres now covers JSONB documents, full text and time series competently.</p>
<table>
<tr><th>Choose NoSQL when</th><th>Stay relational when</th></tr>
<tr><td>The access pattern is fixed and known up front</td><td>You will query it in ways not yet known</td></tr>
<tr><td>Write volume genuinely exceeds one primary</td><td>A big machine still comfortably fits</td></tr>
<tr><td>The schema truly varies per record</td><td>Records share a stable shape</td></tr>
<tr><td>You need multi-region <em>writes</em></td><td>One region writes, others read</td></tr>
<tr><td>Eventual consistency is acceptable</td><td>You need real transactions across entities</td></tr>
</table>
<pre><code>// The modelling inversion that catches people out.
// Relational: model the DATA, then query it however you like.
// NoSQL:      model the QUERIES, then store data to serve them.

// DynamoDB single-table design — one table, access patterns encoded in keys:
//  PK              SK                    data
//  USER#42         PROFILE               {name, email}
//  USER#42         ORDER#2026-09-11#901  {total, status}
//  ORDER#901       ITEM#1                {sku, qty}
//
// "Get a user and their recent orders" is ONE query. But "all orders over
// 1000 rupees last month" needs a new index — or a full scan. The flexibility
// you gave up is the price of the speed you bought.</code></pre>
<p><strong>The polyglot answer, with the caveat:</strong> using the right store per job is reasonable — Postgres for the system of record, Redis for sessions, Elasticsearch for search. The cost is that every store is another thing to back up, monitor, patch and staff, and keeping them in sync is your problem. So each additional store needs to earn its place.</p>
<p><strong>What to say:</strong> "I would start with Postgres and stay there until a concrete limit forces a move — because the ad-hoc query ability is the thing you miss most, and you only notice it once it is gone. When I do move, it is for a specific access pattern at a specific scale, and usually alongside Postgres rather than instead of it."</p>`
}
]);
