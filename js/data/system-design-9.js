registerPrimer("system-design", `<h3>The mental model: a handful of building blocks, combined to meet numbers</h3>
<p>System design interviews look open-ended, but almost every design is built from the same dozen parts. What changes from question to question is <strong>which numbers matter</strong> (reads per second, data size, latency target, consistency needs), and those numbers decide which parts you need and where. Learn what each block is for, then practise choosing them from requirements.</p>
<figure class="fig">
<svg viewBox="0 0 620 262" role="img" aria-label="Common system design building blocks: clients, CDN, load balancer, stateless app servers, cache, primary and replica databases, queue, workers and object storage">
  <defs><marker id="pr-sd" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="100" width="74" height="46" rx="8"/><text class="dg-t" x="47" y="128" text-anchor="middle">Clients</text>
  <line class="dg-line" x1="47" y1="100" x2="47" y2="62" marker-end="url(#pr-sd)"/>
  <rect class="dg-fill2" x="10" y="16" width="74" height="44" rx="8"/><text class="dg-t" x="47" y="36" text-anchor="middle">CDN</text><text class="dg-s" x="47" y="51" text-anchor="middle">static, media</text>
  <line class="dg-line" x1="84" y1="123" x2="108" y2="123" marker-end="url(#pr-sd)"/>
  <rect class="dg-fill" x="110" y="96" width="86" height="54" rx="8"/><text class="dg-t" x="153" y="118" text-anchor="middle">Load</text><text class="dg-t" x="153" y="134" text-anchor="middle">balancer</text>
  <line class="dg-line" x1="196" y1="123" x2="220" y2="123" marker-end="url(#pr-sd)"/>
  <rect class="dg-box" x="222" y="74" width="112" height="98" rx="9"/>
  <text class="dg-t" x="278" y="94" text-anchor="middle">App servers</text>
  <rect class="dg-fill" x="236" y="104" width="84" height="18" rx="4"/>
  <rect class="dg-fill" x="236" y="126" width="84" height="18" rx="4"/>
  <rect class="dg-fill" x="236" y="148" width="84" height="18" rx="4"/>
  <text class="dg-s" x="214" y="190" text-anchor="end">stateless: add more</text>
  <line class="dg-line" x1="334" y1="96" x2="378" y2="52" marker-end="url(#pr-sd)"/>
  <rect class="dg-fill2" x="380" y="20" width="100" height="44" rx="8"/><text class="dg-t" x="430" y="40" text-anchor="middle">Cache</text><text class="dg-s" x="430" y="55" text-anchor="middle">Redis: hot reads</text>
  <line class="dg-line" x1="334" y1="123" x2="378" y2="123" marker-end="url(#pr-sd)"/>
  <rect class="dg-fill" x="380" y="98" width="100" height="50" rx="8"/><text class="dg-t" x="430" y="118" text-anchor="middle">DB primary</text><text class="dg-s" x="430" y="134" text-anchor="middle">all writes</text>
  <line class="dg-line" x1="480" y1="123" x2="504" y2="123" marker-end="url(#pr-sd)"/>
  <rect class="dg-box" x="506" y="98" width="104" height="50" rx="8"/><text class="dg-t" x="558" y="118" text-anchor="middle">Read replicas</text><text class="dg-s" x="558" y="134" text-anchor="middle">scale reads</text>
  <line class="dg-line" x1="300" y1="172" x2="300" y2="206" marker-end="url(#pr-sd)"/>
  <rect class="dg-fill2" x="222" y="208" width="112" height="44" rx="8"/><text class="dg-t" x="278" y="228" text-anchor="middle">Queue</text><text class="dg-s" x="278" y="243" text-anchor="middle">slow work, later</text>
  <line class="dg-line" x1="334" y1="230" x2="378" y2="230" marker-end="url(#pr-sd)"/>
  <rect class="dg-box" x="380" y="208" width="100" height="44" rx="8"/><text class="dg-t" x="430" y="228" text-anchor="middle">Workers</text><text class="dg-s" x="430" y="243" text-anchor="middle">emails, video</text>
  <line class="dg-line" x1="480" y1="230" x2="504" y2="230" marker-end="url(#pr-sd)"/>
  <rect class="dg-box" x="506" y="208" width="104" height="44" rx="8"/><text class="dg-t" x="558" y="228" text-anchor="middle">Object store</text><text class="dg-s" x="558" y="243" text-anchor="middle">S3: files, blobs</text>
</svg>
<figcaption>Most designs are this picture with some blocks removed, some duplicated, and one or two specialised stores added.</figcaption>
</figure>
<h3>Worked example: growing one app from 100 users to 10 million</h3>
<pre><code>STAGE 1  ~100 users        One server running the app and the database.
                           Fine. Do not start with microservices.

STAGE 2  ~10,000 users     Database on its own machine. The app server can
                           now be restarted or resized without touching data.

STAGE 3  ~100,000 users    Load balancer + 2 or more STATELESS app servers.
                           Sessions move out of server memory (into Redis or a
                           signed token), so any server can take any request.
                           Also removes the single point of failure.

STAGE 4  ~1 million users  Reads dominate (often 10:1 or more).
                           - Cache hot reads in Redis (cache-aside)
                           - Read replicas for queries that can be a second stale
                           - CDN for images, JS, CSS
                           - Queue + workers for slow work (email, thumbnails),
                             so requests return fast

STAGE 5  ~10 million users The primary cannot take all the WRITES.
                           - Shard the database by a key (user_id)
                           - Split the busiest area into its own service
                           - Multiple regions if users are global

Each stage fixes the bottleneck of the stage before. That is also how to
narrate an interview answer: start simple, then scale the part that breaks.</code></pre>
<h3>The block, the problem it solves, and its catch</h3>
<table>
<tr><th>Block</th><th>Solves</th><th>Catch</th></tr>
<tr><td>Load balancer</td><td>Spread traffic; survive a server dying</td><td>App servers must be stateless</td></tr>
<tr><td>Cache</td><td>Fast repeated reads; less DB load</td><td>Stale data; invalidation</td></tr>
<tr><td>Read replicas</td><td>Scale reads</td><td>Replication lag: a user may not see their own write</td></tr>
<tr><td>Sharding</td><td>Scale writes and data size</td><td>Cross-shard queries and transactions get hard</td></tr>
<tr><td>Queue</td><td>Absorb spikes; do slow work later</td><td>Eventual consistency; duplicate messages</td></tr>
<tr><td>CDN</td><td>Serve static content near users</td><td>Purging stale content</td></tr>
<tr><td>Object storage</td><td>Cheap, durable files of any size</td><td>Not a database: no queries, only keys</td></tr>
</table>`);

appendTopic("system-design", [
{
  q: "Design a file storage and sharing service like Google Drive or Dropbox",
  level: "advanced", hot: true, tags: ["storage", "sync", "chunking", "must-know"],
  companies: ["Google", "Microsoft", "Amazon", "Dropbox", "Atlassian", "Flipkart", "Adobe"],
  a: `<p><strong>Clarify first.</strong> Users upload files from web, desktop and mobile; files sync across a user's devices; files can be shared with other users. Scale: 50 million users, 10 million active daily, average 200 files and 2 GB stored per user. Files up to 10 GB.</p>
<pre><code>ESTIMATES
  Storage: 50M users × 2 GB              = 100 PB   (before deduplication)
  Uploads: 10M daily users × 5 files/day = 50M uploads/day ≈ 600/s, peaks ~2,000/s
  Metadata: 50M × 200 files              = 10 billion file records
  -&gt; Bytes and metadata have totally different shapes. Store them separately.</code></pre>
<p><strong>The key idea: split every file into chunks</strong> (say 4 MB each), identify each chunk by the hash of its content, and store chunks in object storage. A file becomes a list of chunk hashes.</p>
<pre><code>report.pdf (10 MB)  -&gt;  chunk A (4 MB)  sha256 = 9f2c…
                        chunk B (4 MB)  sha256 = 41ab…
                        chunk C (2 MB)  sha256 = e07d…
file record: { id, owner, name, version: 3, chunks: [9f2c…, 41ab…, e07d…] }

Why chunks win:
  Resumable uploads    a failed upload resumes at the next missing chunk
  Delta sync           edit one page -&gt; usually only 1 chunk changes -&gt; upload 4 MB, not 10
  Deduplication        the same chunk is stored ONCE, however many users have it
  Parallelism          upload/download several chunks at once</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="Upload flow: client asks metadata service which chunks are missing, uploads only those directly to object storage, then commits the new file version; notification service tells other devices">
  <defs><marker id="sd-drv" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="10" y="74" width="96" height="52" rx="8"/><text class="dg-t" x="58" y="96" text-anchor="middle">Client</text><text class="dg-s" x="58" y="112" text-anchor="middle">chunks + hashes</text>
  <line class="dg-line" x1="106" y1="88" x2="226" y2="44" marker-end="url(#sd-drv)"/>
  <text class="dg-s" x="10" y="64">1. which are missing?</text>
  <rect class="dg-box" x="228" y="18" width="150" height="52" rx="8"/><text class="dg-t" x="303" y="40" text-anchor="middle">Metadata service</text><text class="dg-s" x="303" y="56" text-anchor="middle">files, versions, shares</text>
  <line class="dg-line" x1="106" y1="112" x2="226" y2="150" marker-end="url(#sd-drv)"/>
  <text class="dg-s" x="10" y="146">2. upload missing chunks</text>
  <text class="dg-s" x="10" y="160">(pre-signed URLs)</text>
  <rect class="dg-fill2" x="228" y="126" width="150" height="52" rx="8"/><text class="dg-t" x="303" y="148" text-anchor="middle">Object storage</text><text class="dg-s" x="303" y="164" text-anchor="middle">chunks by hash</text>
  <line class="dg-line" x1="378" y1="44" x2="448" y2="44" marker-end="url(#sd-drv)"/>
  <text class="dg-s" x="384" y="36">3. commit v4</text>
  <rect class="dg-box" x="450" y="18" width="160" height="52" rx="8"/><text class="dg-t" x="530" y="40" text-anchor="middle">Notification</text><text class="dg-s" x="530" y="56" text-anchor="middle">"file changed" to devices</text>
  <line class="dg-line" x1="530" y1="70" x2="530" y2="120" marker-end="url(#sd-drv)"/>
  <rect class="dg-box" x="470" y="122" width="120" height="52" rx="8"/><text class="dg-t" x="530" y="144" text-anchor="middle">Other devices</text><text class="dg-s" x="530" y="160" text-anchor="middle">pull changed chunks</text>
</svg>
<figcaption>File bytes never pass through the application servers. They go straight to object storage with short-lived signed URLs.</figcaption>
</figure>
<table>
<tr><th>Component</th><th>Choice</th><th>Why</th></tr>
<tr><td>Chunk storage</td><td>Object storage (S3/GCS), key = content hash</td><td>Cheap, durable, effectively unlimited; the hash key gives dedup for free</td></tr>
<tr><td>Metadata</td><td>Relational DB sharded by owner id</td><td>Folders, versions and permissions need transactions and queries</td></tr>
<tr><td>Sync</td><td>Each device keeps a cursor; server sends "changed" pings (WebSocket or long-poll); device fetches changes since its cursor</td><td>Devices can be offline for weeks and catch up from the cursor</td></tr>
<tr><td>Sharing</td><td>ACL rows: (file or folder, user, role)</td><td>Permissions inherit down the folder tree; check on every access</td></tr>
<tr><td>Downloads</td><td>Pre-signed URLs, via a CDN for popular shared files</td><td>App servers stay out of the data path</td></tr>
</table>
<p><strong>Conflicts:</strong> two devices edit the same file offline. Both upload new versions based on version 3. The server accepts the first as version 4, and the second commit fails its version check. Rather than merging binary files, Dropbox-style systems keep both: the second becomes "report (Asha's conflicted copy).pdf". Simple, and no data is lost.</p>
<p><strong>Deletes and garbage:</strong> deleting a file only removes the metadata reference. A background job counts references to each chunk and deletes chunks nobody points to, after a delay so that "restore from trash" still works.</p>
<p><strong>Security notes worth adding:</strong> cross-user dedup can leak whether someone else has a given file (upload it and see if it was "instant"). Many systems dedup only within one user's account for that reason. Encrypt chunks at rest; for end-to-end encryption, dedup across users is impossible by design.</p>`
},
{
  q: "Design a metrics and monitoring system like Prometheus or Datadog",
  level: "advanced", tags: ["observability", "time-series", "alerting", "storage"],
  companies: ["Datadog", "Uber", "Amazon", "Microsoft", "Atlassian", "Flipkart", "Grafana"],
  a: `<p><strong>Requirements.</strong> Collect metrics (CPU, request rate, latency, error counts) from 10,000 hosts, each exposing about 1,000 time series, every 10 seconds. Show dashboards over any time range and alert within a minute when something crosses a threshold. Keep full detail for 15 days and summaries for a year.</p>
<pre><code>ESTIMATES
  Series:   10,000 hosts × 1,000         = 10 million active time series
  Samples:  10M / 10 s                   = 1 million samples/s written
  Raw size: 16 bytes per sample (8-byte timestamp + 8-byte value)
            1M × 16 B = 16 MB/s ≈ 1.4 TB/day uncompressed
  With time-series compression (Gorilla-style: delta-of-delta timestamps,
  XOR'd values) ~1.4 bytes/sample     ≈ 120 GB/day
  15 days                             ≈ 2 TB. Very manageable.</code></pre>
<p><strong>The data model:</strong> a series is a metric name plus labels, and holds (timestamp, value) pairs.</p>
<pre><code>http_requests_total{service="checkout", status="500", region="ap-south-1"}
   (10:00:00, 18231)  (10:00:10, 18240)  (10:00:20, 18262) ...

rate(http_requests_total{status="500"}[5m])     # errors per second, last 5 minutes</code></pre>
<table>
<tr><th>Component</th><th>Design</th></tr>
<tr><td><strong>Collection</strong></td><td>Pull (the server scrapes <code>/metrics</code> on each host, like Prometheus) or push (agents send to a collector, like Datadog). Pull makes "host is down" obvious; push works through firewalls and for short-lived jobs</td></tr>
<tr><td><strong>Ingestion</strong></td><td>Stateless collectors → a queue (Kafka) → storage writers, partitioned by series hash, so bursts do not drop data</td></tr>
<tr><td><strong>Storage</strong></td><td>A time-series database: recent data in memory plus an append-only log, flushed into compressed 2-hour blocks; an inverted index from label to series ids for fast filtering</td></tr>
<tr><td><strong>Downsampling</strong></td><td>After 15 days keep only 5-minute min/max/avg/count; after 90 days, 1-hour. Old dashboards stay fast and storage stays small</td></tr>
<tr><td><strong>Query</strong></td><td>Fan out to the shards holding the matching series, aggregate, return. Cache recent dashboard queries</td></tr>
<tr><td><strong>Alerting</strong></td><td>A separate evaluator runs rules every 30 seconds against recent data, with a <code>for: 5m</code> condition to avoid flapping, then routes to on-call with de-duplication and grouping</td></tr>
</table>
<p><strong>The biggest real-world problem: cardinality.</strong> Every unique combination of label values is a new series. One developer adds <code>user_id</code> as a label, and 10 million users turns one metric into 10 million series overnight. Memory explodes and queries crawl.</p>
<pre><code>GOOD labels: small, fixed sets     service, endpoint, status, region, method
BAD labels:  unbounded values      user_id, order_id, full URL with ids, email
             -&gt; those belong in LOGS or TRACES, not metrics

Defence: per-tenant limits on active series, and reject or drop new
series above the limit with a clear error.</code></pre>
<p><strong>Reliability of the monitor itself:</strong> the monitoring system must not share a failure with what it monitors. Run it in a separate cluster, and add a "dead man's switch": an alert that fires constantly, routed to an external service that pages you if it ever <em>stops</em> arriving. Otherwise a dead monitoring system looks exactly like a healthy, quiet night.</p>
<p><strong>Summary:</strong> "Label-based time series, a queue in front of sharded time-series storage with heavy compression, downsampling for long retention, a separate alert evaluator, and strict cardinality limits, because unbounded labels are what actually break these systems."</p>`
}
]);
