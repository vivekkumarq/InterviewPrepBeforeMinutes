appendTopic("system-design", [
{
  q: "Design a web crawler",
  level: "advanced", hot: true, tags: ["case-study", "system-design", "distributed"],
  companies: ["Google", "Amazon", "Microsoft", "Adobe", "Uber", "Flipkart"],
  a: `<pre><code>// REQUIREMENTS
Functional:     given seed URLs, fetch pages, extract links, repeat; store content
Non-functional: 1 billion pages/month, politeness (do not hammer any host),
                freshness (re-crawl important pages sooner), robustness
Scale:          1B/month ≈ 400 pages/s sustained; 500 KB/page ≈ 500 TB/month</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="Crawler loop from frontier through fetcher to parser and back">
  <rect class="dg-fill2" x="20" y="30" width="110" height="40" rx="6"/><text class="dg-t" x="75" y="55" text-anchor="middle">URL frontier</text>
  <rect class="dg-fill" x="170" y="30" width="100" height="40" rx="6"/><text class="dg-t" x="220" y="55" text-anchor="middle">fetcher</text>
  <rect class="dg-fill" x="310" y="30" width="100" height="40" rx="6"/><text class="dg-t" x="360" y="55" text-anchor="middle">parser</text>
  <rect class="dg-fill" x="450" y="30" width="110" height="40" rx="6"/><text class="dg-t" x="505" y="55" text-anchor="middle">content store</text>
  <path class="dg-line" d="M130 50 L170 50 M270 50 L310 50 M410 50 L450 50" marker-end="url(#wc1)"/>
  <path class="dg-line" d="M360 70 L360 110 L75 110 L75 70" marker-end="url(#wc1)"/>
  <text class="dg-s" x="150" y="130">extracted links, after dedup</text>
  <text class="dg-s" x="20" y="164">the frontier is the whole design: it enforces politeness AND priority,</text>
  <text class="dg-s" x="20" y="186">and it is the component interviewers push on</text>
  <defs><marker id="wc1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// THE URL FRONTIER — two levels of queues, and this is the answer they want
//
// FRONT queues: one per PRIORITY band. A prioritiser assigns each URL a band
//   from PageRank, update frequency, or how deep it sits in the site.
//
// BACK queues: one per HOST. A router maps each URL to its host's queue, and
//   each back queue has exactly ONE worker. That is what enforces politeness:
//   one connection per host at a time, plus a delay between requests.
//
// A heap of (nextAllowedTime, queueId) tells a worker which host is due next.
//
// Why not one global queue? Because a breadth-first crawl of a large site
// would issue thousands of concurrent requests to one server — which is a
// denial-of-service attack, and gets you blocked.</code></pre>
<table>
<tr><th>Problem</th><th>Solution</th></tr>
<tr><td>Same URL seen many times</td><td><strong>Bloom filter</strong> over visited URLs — a false positive only skips a page, which is acceptable</td></tr>
<tr><td>Same <em>content</em> at different URLs</td><td>Hash the content; near-duplicates via <strong>SimHash</strong> or MinHash</td></tr>
<tr><td>URL variants (<code>?utm_source</code>, trailing slash, case)</td><td>Canonicalise before hashing — this alone removes a large fraction of work</td></tr>
<tr><td>Spider traps (infinite calendars, generated links)</td><td>Depth limit, per-domain page cap, URL-length cap</td></tr>
<tr><td><code>robots.txt</code></td><td>Fetch and cache per host; honour <code>Crawl-delay</code>. Non-negotiable</td></tr>
<tr><td>Slow or hanging servers</td><td>Aggressive timeouts; a dead host must not stall its whole queue</td></tr>
<tr><td>JavaScript-rendered pages</td><td>A separate, far more expensive headless-browser pipeline — only for pages worth it</td></tr>
<tr><td>Freshness</td><td>Re-crawl interval derived from observed change rate, not a fixed schedule</td></tr>
</table>
<pre><code>// DISTRIBUTING IT
// Partition by HOST HASH, not by URL hash. All URLs for one host must land on
// one crawler, or politeness is impossible to enforce across machines.
//   crawler = hash(domain) % N
//
// Consistent hashing so that adding a crawler moves only 1/N of the hosts.
//
// Storage: raw HTML to object storage (S3) keyed by content hash; metadata
// (url, fetch time, status, content hash) in a wide-column store.
// Dedup by content hash means storing one copy of identical pages.</code></pre>
<p><strong>The point that separates a good answer:</strong> politeness is not a feature you bolt on — it dictates the entire queue architecture. Once you say "one worker per host queue", the two-level frontier, the host-based partitioning and the per-host <code>robots.txt</code> cache all follow from it. Starting with "a queue and some workers" and being asked "what stops you DDoSing a site?" is the failure path.</p>`
},
{
  q: "Design a video streaming service like YouTube or Netflix",
  level: "advanced", hot: true, tags: ["case-study", "system-design", "cdn", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Netflix", "Adobe", "Flipkart", "Uber"],
  a: `<pre><code>// REQUIREMENTS
Functional:     upload, transcode, stream, search, recommend
Non-functional: fast start (&lt;2 s), no buffering, works on 3G and on fibre
Scale:          read-dominated by orders of magnitude — 1 upload per ~1M views
                so the UPLOAD path and the PLAYBACK path are different systems</code></pre>
<table>
<tr><th>Path</th><th>Shape</th></tr>
<tr><td><strong>Upload</strong></td><td>Write-heavy, latency-tolerant, expensive per item → asynchronous pipeline</td></tr>
<tr><td><strong>Playback</strong></td><td>Read-heavy, latency-critical, cheap per item → CDN plus caching</td></tr>
</table>
<pre><code>// THE UPLOAD AND TRANSCODE PIPELINE
1. Client uploads to object storage DIRECTLY, via a pre-signed URL.
   The application server never touches the bytes — it only issues the URL.
   Use multipart or resumable upload; a 4 GB file over mobile will drop.
2. Upload completion publishes an event.
3. The transcoding pipeline splits the video into CHUNKS (a few seconds each)
   and transcodes chunks IN PARALLEL across a worker fleet.
   Parallelism at chunk level is why a 2-hour film does not take 2 hours.
4. Each chunk is encoded at several bitrates and resolutions
   (240p, 480p, 720p, 1080p, 4K) — this is ADAPTIVE BITRATE.
5. Generate the manifest (HLS .m3u8 or DASH .mpd) listing every
   rendition and chunk URL.
6. Push to the CDN; mark the video ready; notify the uploader.

// Transcoding is a DAG: split -> [transcode, thumbnail, subtitles,
// content-ID match] -> merge -> publish. Model it as a workflow so a failed
// step retries without redoing the whole video.</code></pre>
<pre><code>// PLAYBACK — why adaptive bitrate is the core idea
// The player downloads the manifest, then requests chunks one at a time.
// It measures throughput on each chunk and picks the next rendition
// accordingly: bandwidth drops, the next chunk is 480p instead of 1080p.
//
// The result: quality degrades instead of buffering. That is the entire
// user-visible design goal, and it is why you chunk rather than stream a
// single file.
//
// Start fast: request the FIRST chunk at a low bitrate, then ramp up. A user
// who waits three seconds for a perfect 1080p first frame has already left.</code></pre>
<table>
<tr><th>Concern</th><th>Design decision</th></tr>
<tr><td>Bandwidth cost</td><td><strong>CDN</strong> serves ~95%+ of bytes. Popular titles are pushed to edge caches proactively</td></tr>
<tr><td>Long-tail content</td><td>Not worth pre-pushing — pull through the CDN on first request</td></tr>
<tr><td>Storage cost</td><td>Multiple renditions per video multiplies storage; tier cold content to cheaper classes</td></tr>
<tr><td>Metadata</td><td>Relational or wide-column: video id, owner, title, status, renditions</td></tr>
<tr><td>View count</td><td>Kafka events → stream aggregation. <strong>Never</strong> a synchronous counter update</td></tr>
<tr><td>Search</td><td>Elasticsearch over title, description, transcript</td></tr>
<tr><td>Recommendations</td><td>Offline model training; serve precomputed candidates, re-rank online</td></tr>
<tr><td>DRM / access control</td><td>Signed, short-lived chunk URLs; Widevine or FairPlay for premium content</td></tr>
<tr><td>Live streaming</td><td>Same chunking, much shorter segments, and the transcode must keep up in real time</td></tr>
</table>
<pre><code>// NETFLIX'S ACTUAL TRICK, worth naming: Open Connect
// They place their own caching appliances INSIDE ISP networks. The bytes
// never cross the public internet backbone during peak hours.
//
// The general principle: at video scale, the design problem is not compute or
// database — it is moving bytes as close to the user as possible. Everything
// else is secondary.</code></pre>
<p><strong>The framing to open with:</strong> "This is really two systems. Upload and transcode is an asynchronous batch pipeline where latency does not matter and cost does. Playback is a CDN problem where latency is everything and the origin should almost never be touched. I would design them separately and connect them with an event." That split, stated early, structures the whole rest of the discussion.</p>`
},
{
  q: "Design a real-time leaderboard for 100 million players",
  level: "advanced", tags: ["case-study", "system-design", "redis"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Flipkart", "Adobe", "Zoho"],
  a: `<pre><code>// REQUIREMENTS
Functional:     submit a score, get the top N, get MY rank and neighbours
Non-functional: top-N in &lt;100 ms, near-real-time updates
Scale:          100M players, 10M score updates/day, heavy read on top-10

// THE NAIVE ANSWER AND WHY IT FAILS
SELECT COUNT(*) FROM scores WHERE score &gt; (SELECT score FROM scores WHERE id=?);
// Computing one player's rank scans the table. At 100M rows and thousands of
// requests per second, this is the whole problem.</code></pre>
<pre><code>// THE ANSWER: Redis SORTED SET (ZSET), a skip list ordered by score
ZADD leaderboard 4200 "player:9931"          // O(log n) insert or update
ZREVRANGE leaderboard 0 9 WITHSCORES         // top 10        — O(log n + 10)
ZREVRANK leaderboard "player:9931"           // MY RANK       — O(log n)
ZREVRANGE leaderboard 1200 1210              // my neighbours — O(log n + 10)
ZCARD leaderboard                            // total players — O(1)

// Rank in O(log n) is the entire reason to use this structure. A skip list
// keeps a span count per node, so rank is computed by walking levels rather
// than counting rows.
//
// Memory: roughly 100 bytes per entry -> 100M players ≈ 10 GB. That fits on
// one large node, but you would not want it to.</code></pre>
<table>
<tr><th>Problem</th><th>Approach</th></tr>
<tr><td>10 GB in one Redis instance</td><td><strong>Shard by score range</strong> or by region/game mode. Cross-shard global rank then needs aggregation</td></tr>
<tr><td>Durability — Redis is a cache</td><td>Scores are also written to a durable store; Redis is a rebuildable index</td></tr>
<tr><td>Rebuilding after a Redis loss</td><td>Replay from the durable store, or from the Kafka score topic</td></tr>
<tr><td>Ties</td><td>Encode the timestamp into the low bits of the score so earlier achievers rank higher — deterministic ordering</td></tr>
<tr><td>Hot read on the top 10</td><td>Cache it in the application for 1–2 seconds. It barely changes and it is 99% of the reads</td></tr>
<tr><td>Time-windowed boards (daily, weekly)</td><td>A separate ZSET per window with a TTL — <code>leaderboard:2026-09-18</code></td></tr>
<tr><td>Cheating</td><td>Validate server-side. Never trust a client-submitted score. Anomaly detection on impossible jumps</td></tr>
<tr><td>Absolute global rank across shards</td><td>Approximate it: per-shard histograms of score distribution give a rank estimate. Exact global rank for 100M players is rarely a real requirement — <strong>ask</strong></td></tr>
</table>
<pre><code>// THE WRITE PATH at 10M updates/day (~120/s average, much higher at peak)
game server -> Kafka "score.submitted"
            -> consumer validates, writes to the durable store
            -> ZADD into Redis
            -> (optional) push the new top-10 over WebSocket to viewers

// Kafka in the middle buys you replay, backpressure, and a rebuild path for
// Redis. Without it, a Redis failure means reconstructing 100M ranks from
// the database under load.</code></pre>
<p><strong>The trade-off to raise unprompted:</strong> "Exact real-time rank for every one of 100 million players is the expensive requirement, not the top-10. I would check whether players below the top few thousand need an exact rank or just a percentile — an approximation from score histograms is orders of magnitude cheaper, and in most products nobody notices." Finding the requirement that can be relaxed is the strongest move available in a design round.</p>`
}
]);
