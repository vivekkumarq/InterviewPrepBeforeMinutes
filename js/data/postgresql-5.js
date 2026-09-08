appendTopic("postgresql", [
{
  q: "How do you partition a large table, and when is it worth it?",
  level: "advanced", hot: true, tags: ["partitioning", "performance", "production"],
  companies: ["Amazon", "Optum", "Walmart", "Goldman Sachs", "Maersk", "Flipkart", "Barclays"],
  a: `<pre><code>-- Declarative partitioning (PostgreSQL 10+)
CREATE TABLE events (
    id          bigserial,
    occurred_at timestamptz NOT NULL,
    payload     jsonb,
    PRIMARY KEY (id, occurred_at)      -- the partition key MUST be in the PK
) PARTITION BY RANGE (occurred_at);

CREATE TABLE events_2026_09 PARTITION OF events
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE events_2026_10 PARTITION OF events
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

-- A DEFAULT partition catches rows outside every range, so inserts do not fail
CREATE TABLE events_default PARTITION OF events DEFAULT;</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Partition pruning skipping partitions outside the query range">
  <rect class="dg-box" x="16" y="26" width="588" height="34" rx="6"/>
  <text class="dg-s" x="310" y="48" text-anchor="middle">SELECT … WHERE occurred_at &gt;= '2026-09-01'</text>
  <path class="dg-line" d="M310 62 V78"/>
  <rect class="dg-box" x="16" y="86" width="130" height="40" rx="6" stroke-dasharray="4 3"/>
  <text class="dg-s" x="81" y="105" text-anchor="middle">events_2026_07</text><text class="dg-s" x="81" y="120" text-anchor="middle">PRUNED</text>
  <rect class="dg-box" x="156" y="86" width="130" height="40" rx="6" stroke-dasharray="4 3"/>
  <text class="dg-s" x="221" y="105" text-anchor="middle">events_2026_08</text><text class="dg-s" x="221" y="120" text-anchor="middle">PRUNED</text>
  <rect class="dg-fill" x="296" y="86" width="130" height="40" rx="6"/>
  <text class="dg-s" x="361" y="105" text-anchor="middle">events_2026_09</text><text class="dg-s" x="361" y="120" text-anchor="middle">scanned</text>
  <rect class="dg-fill" x="436" y="86" width="130" height="40" rx="6"/>
  <text class="dg-s" x="501" y="105" text-anchor="middle">events_2026_10</text><text class="dg-s" x="501" y="120" text-anchor="middle">scanned</text>
  <text class="dg-s" x="16" y="148">pruning happens only when the query FILTERS ON THE PARTITION KEY — that is the whole design constraint</text>
</svg>
</figure>
<table>
<tr><th>Strategy</th><th>Use for</th></tr>
<tr><td><strong>RANGE</strong></td><td>Time-series data — the overwhelmingly common case</td></tr>
<tr><td><strong>LIST</strong></td><td>Discrete values: region, tenant, country</td></tr>
<tr><td><strong>HASH</strong></td><td>Even spread when there is no natural range key</td></tr>
</table>
<p><strong>The benefit that actually justifies it</strong> is usually not query speed — it is maintenance:</p>
<pre><code>-- Deleting a month of data from a 2 TB table
DELETE FROM events WHERE occurred_at &lt; '2026-08-01';
-- Hours of work, writes a huge amount of WAL, leaves massive bloat,
-- and autovacuum then has to clean it all up.

DROP TABLE events_2026_07;              -- or DETACH first, then drop
-- Milliseconds. No bloat. No WAL flood. THIS is why you partition time-series data.</code></pre>
<table>
<tr><th>Partitioning helps</th><th>Partitioning hurts</th></tr>
<tr><td>Bulk deletion by dropping partitions</td><td>Queries that do not filter on the partition key scan <em>every</em> partition</td></tr>
<tr><td>Smaller indexes per partition, better cache use</td><td>The primary key must include the partition key — so a global unique constraint on another column is impossible</td></tr>
<tr><td>Vacuum and reindex run per partition</td><td>Hundreds of partitions slow down <em>planning</em> noticeably</td></tr>
<tr><td>Old partitions can move to cheaper storage</td><td>You must create future partitions ahead of time (pg_partman, or a cron job)</td></tr>
</table>
<pre><code>-- Automate creation, or an insert eventually lands with no partition
-- pg_partman handles this; otherwise a scheduled job:
CREATE TABLE events_2026_11 PARTITION OF events
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

-- Attach an existing table without a long lock (add the CHECK first so the
-- validation scan happens BEFORE the exclusive lock is taken)
ALTER TABLE events_archive ADD CONSTRAINT ck
    CHECK (occurred_at &gt;= '2026-01-01' AND occurred_at &lt; '2026-02-01') NOT VALID;
ALTER TABLE events_archive VALIDATE CONSTRAINT ck;
ALTER TABLE events ATTACH PARTITION events_archive
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');</code></pre>
<p><strong>The honest threshold to give:</strong> "Partitioning earns its complexity somewhere above a few hundred million rows, or when there is a retention policy that means deleting large slices regularly. Below that, a good index usually beats partitioning — and I have seen teams partition a 10 million row table and make it slower, because every query that missed the partition key now scans forty tables instead of one."</p>`
},
{
  q: "Explain PostgreSQL replication and how you achieve high availability",
  level: "advanced", tags: ["replication", "ha", "production", "distributed"],
  companies: ["Amazon", "Optum", "Goldman Sachs", "Maersk", "SAP", "Barclays", "Walmart"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Primary streaming WAL to synchronous and asynchronous replicas">
  <rect class="dg-fill" x="16" y="62" width="120" height="42" rx="8"/><text class="dg-s" x="76" y="80" text-anchor="middle">PRIMARY</text><text class="dg-s" x="76" y="96" text-anchor="middle">reads + writes</text>
  <path class="dg-line" d="M140 74 H220" marker-end="url(#rp1)"/>
  <path class="dg-line" d="M140 92 H220" marker-end="url(#rp1)"/>
  <text class="dg-s" x="180" y="64" text-anchor="middle">WAL stream</text>
  <rect class="dg-fill2" x="224" y="46" width="140" height="42" rx="8"/>
  <text class="dg-s" x="294" y="64" text-anchor="middle">SYNC replica</text><text class="dg-s" x="294" y="80" text-anchor="middle">commit waits for it</text>
  <rect class="dg-box" x="224" y="98" width="140" height="42" rx="8"/>
  <text class="dg-s" x="294" y="116" text-anchor="middle">ASYNC replica</text><text class="dg-s" x="294" y="132" text-anchor="middle">may lag</text>
  <text class="dg-s" x="392" y="66">zero data loss,</text>
  <text class="dg-s" x="392" y="84">higher write latency</text>
  <text class="dg-s" x="392" y="118">fast writes,</text>
  <text class="dg-s" x="392" y="136">may lose recent commits</text>
  <defs><marker id="rp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Mode</th><th><code>synchronous_commit</code></th><th>Guarantee</th></tr>
<tr><td>Async (default)</td><td><code>local</code> or <code>on</code> with no sync standby</td><td>Fast; a primary failure can lose the last few commits</td></tr>
<tr><td><code>remote_write</code></td><td>Standby received it into memory</td><td>Survives a primary crash, not a standby crash</td></tr>
<tr><td><code>on</code> (sync)</td><td>Standby flushed to its WAL</td><td><strong>Zero data loss</strong>; every commit pays a network round trip</td></tr>
<tr><td><code>remote_apply</code></td><td>Standby has applied it</td><td>Read-your-writes on the replica; slowest</td></tr>
</table>
<pre><code>-- Monitoring lag, which is what you actually alert on
SELECT client_addr, state, sync_state,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_behind,
       replay_lag
FROM pg_stat_replication;

-- On the replica: how stale is my data, in seconds?
SELECT now() - pg_last_xact_replay_timestamp() AS replication_delay;

-- Replication SLOTS guarantee the primary keeps WAL until the replica has it.
-- ⚠ A disconnected replica with a slot will fill the primary's disk. Always
-- bound it: max_slot_wal_keep_size = '50GB'</code></pre>
<table>
<tr><th></th><th>Physical (streaming)</th><th>Logical</th></tr>
<tr><td>Replicates</td><td>Byte-level WAL — the entire cluster</td><td>Row changes for selected tables</td></tr>
<tr><td>Replica writable</td><td>No — read-only</td><td>Yes</td></tr>
<tr><td>Version differences</td><td>Must match</td><td>Allowed — this is how you do a <strong>major-version upgrade with near-zero downtime</strong></td></tr>
<tr><td>Selective</td><td>No</td><td>Yes — per table, per publication</td></tr>
<tr><td>Use for</td><td>HA and read replicas</td><td>Upgrades, CDC, feeding a data warehouse</td></tr>
</table>
<pre><code>-- Logical replication for a zero-downtime major upgrade
-- On the old primary:
CREATE PUBLICATION allpub FOR ALL TABLES;
-- On the new-version server:
CREATE SUBSCRIPTION allsub
  CONNECTION 'host=old dbname=app' PUBLICATION allpub;
-- Let it catch up, verify row counts, then flip the application's connection
-- string and stop writes to the old server for a few seconds.</code></pre>
<p><strong>Failover is the part that must be automated:</strong> Patroni (with etcd or Consul) or repmgr handles leader election and promotion; a managed service such as RDS or Cloud SQL does it for you. The two dangers are <strong>split brain</strong> — two primaries accepting writes, which needs fencing or STONITH — and promoting a replica that was lagging, which silently loses committed transactions.</p>
<p><strong>The read-replica caveat to raise unprompted:</strong> replicas are eventually consistent. A user submits a form and immediately reads their own change from a replica that has not caught up, so it looks like the save failed. The fix is to route a user's reads to the primary for a few seconds after their write, or to track the LSN they wrote at and wait for it. Routing all reads to replicas without thinking about this is one of the most common production regressions.</p>`
}
]);
