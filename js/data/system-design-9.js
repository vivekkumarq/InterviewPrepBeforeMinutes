registerPrimer("system-design", `<p class="pr-lead"><b>System design</b> is planning how a large software system fits together so it can serve many users reliably, for example how WhatsApp delivers billions of messages or how a shop survives a flash sale. In interviews there is no single right answer. You are judged on how you think: asking questions, estimating the scale, choosing sensible building blocks and explaining the trade-offs.</p>
<div class="pr-analogy"><b>Think of it like this</b>Designing a system is like planning a restaurant that keeps getting busier. With ten customers, one cook does everything. With a hundred, you add more cooks and a host at the door (a load balancer). With a thousand, you prepare popular dishes in advance (a cache), take orders on tickets so cooks are not interrupted (a queue), and open more branches (more servers and regions). Each step fixes the next bottleneck.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Scalability</dt><dd>Being able to handle more users or data by adding resources.</dd>
<dt>Load balancer</dt><dd>Spreads incoming requests across several servers, and stops sending to any that fail.</dd>
<dt>Cache</dt><dd>A fast store (often Redis) that keeps frequently read data so the database is not asked every time.</dd>
<dt>Database replica</dt><dd>A copy of the database used for reading, to spread the load.</dd>
<dt>Sharding</dt><dd>Splitting data across several databases, for example by user id, when one database is not enough.</dd>
<dt>Queue</dt><dd>A waiting line for work (such as sending emails), so it can be done in the background.</dd>
<dt>CDN</dt><dd>Servers around the world that serve images and files from a location close to each user.</dd>
<dt>Latency / throughput</dt><dd>Latency is how long one request takes. Throughput is how many requests per second the system can handle.</dd>
</dl>

<h3>Step by step: how to answer a design question</h3>
<ol class="pr-steps">
<li><b>Clarify the requirements (about 5 minutes).</b> What must it do? How many users? How fast must it be? What happens if data is a little out of date?</li>
<li><b>Estimate the scale.</b> Rough numbers: requests per second, how much data per day, how much storage per year. They tell you which problems you will actually face.</li>
<li><b>Sketch the big picture.</b> Clients, load balancer, app servers, database, cache, queue. Keep it simple first.</li>
<li><b>Go deep on the hardest part.</b> For a chat app it is delivering messages in real time; for a URL shortener it is generating unique short codes.</li>
<li><b>Discuss trade-offs and failures.</b> What if a server dies? What if traffic is ten times higher? Where could data be lost?</li>
</ol>
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

<h3>A worked example: growing one app from 100 to 10 million users</h3>
<ol class="pr-steps">
<li><b>100 users:</b> one server runs both the app and the database. That is perfectly fine; do not over-build.</li>
<li><b>10,000 users:</b> move the database to its own machine, so the app server can be restarted or resized without touching the data.</li>
<li><b>100,000 users:</b> put a load balancer in front of two or more app servers. Store login sessions outside the servers (in Redis or a token), so any server can handle any request and one server failing does not take the site down.</li>
<li><b>1 million users:</b> most requests are reads, so add a cache for popular data, read replicas for the database, a CDN for images and files, and a queue with background workers for slow jobs like emails.</li>
<li><b>10 million users:</b> one database can no longer handle all the writes, so shard it (split by user id). Move the busiest feature into its own service, and add regions closer to users around the world.</li>
</ol>
<p>Notice the pattern: each step fixes the bottleneck the previous step created. That is also the best way to talk through a design in an interview: start simple, then scale the part that breaks.</p>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Jumping straight to drawing boxes</p>
<p>Without clear requirements and numbers you might design for the wrong problem, such as building for millions of writes when the system is mostly reads.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> spend the first minutes asking questions and doing rough estimates before drawing anything.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Adding every technology you know</p>
<p>Kafka, microservices and sharding everywhere make a design look busy, not good. Every extra part is something else that can fail.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> add a component only when you can say which problem it solves for this system.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting about failure</p>
<p>A design that only works when every server is healthy is not a real design. Servers crash, networks split and traffic spikes.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> for each component, ask "what if this fails?" and add redundancy, timeouts and retries where it matters.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Ignoring trade-offs</p>
<p>Every choice costs something. A cache makes reads faster but data can be slightly out of date. Sharding scales writes but makes queries across shards hard.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> say the trade-off out loud for each major decision.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Clarify requirements and estimate scale before designing.</li>
<li>Most systems are built from the same blocks: load balancer, app servers, database, cache, queue, CDN.</li>
<li>Start simple and scale the part that becomes the bottleneck.</li>
<li>Plan for failures: every component can and will fail.</li>
<li>Explain the trade-off behind each choice; that is what interviewers score.</li>
</ul>
<p><b>Next:</b> the questions below walk through classic designs (URL shortener, chat, news feed, payments) and the core concepts behind them.</p>`);

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
