appendTopic("system-design", [
{
  q: "Design a news feed like Twitter or Instagram",
  level: "advanced", hot: true, tags: ["design-question", "scaling", "must-know"],
  companies: ["Amazon", "Meta", "Google", "Flipkart", "Swiggy", "Uber", "Walmart", "Adobe"],
  a: `<p><strong>Clarify first:</strong> chronological or ranked? How many follows per user? Read/write ratio? Assume heavily read-dominated — the interesting decision is <em>when</em> you do the work.</p>
<table>
<tr><th></th><th>Fan-out on WRITE (push)</th><th>Fan-out on READ (pull)</th></tr>
<tr><td>On post</td><td>Write into every follower's feed</td><td>Nothing</td></tr>
<tr><td>On read</td><td><strong>One lookup</strong> — precomputed</td><td>Query everyone you follow, merge, sort</td></tr>
<tr><td>Read latency</td><td><strong>Excellent</strong></td><td>Poor</td></tr>
<tr><td>Write cost</td><td>O(followers) — brutal for celebrities</td><td><strong>O(1)</strong></td></tr>
<tr><td>Storage</td><td>Duplicated per follower</td><td>Stored once</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Hybrid feed with push for normal users and pull for celebrities">
  <rect class="dg-fill" x="16" y="24" width="150" height="46" rx="8"/>
  <text class="dg-s" x="91" y="44" text-anchor="middle">normal user posts</text><text class="dg-s" x="91" y="61" text-anchor="middle">~500 followers</text>
  <path class="dg-line" d="M170 47 H226" marker-end="url(#fd9)"/>
  <rect class="dg-fill2" x="230" y="24" width="170" height="46" rx="8"/>
  <text class="dg-s" x="315" y="44" text-anchor="middle">PUSH into 500 feeds</text><text class="dg-s" x="315" y="61" text-anchor="middle">cheap, done async</text>
  <rect class="dg-box" x="16" y="88" width="150" height="46" rx="8"/>
  <text class="dg-s" x="91" y="108" text-anchor="middle">celebrity posts</text><text class="dg-s" x="91" y="125" text-anchor="middle">50M followers</text>
  <path class="dg-line" d="M170 111 H226" marker-end="url(#fd9)"/>
  <rect class="dg-box" x="230" y="88" width="170" height="46" rx="8"/>
  <text class="dg-s" x="315" y="108" text-anchor="middle">do NOTHING</text><text class="dg-s" x="315" y="125" text-anchor="middle">merged in at read time</text>
  <text class="dg-s" x="418" y="82">the hybrid avoids both</text>
  <text class="dg-s" x="418" y="100">the write storm and the</text>
  <text class="dg-s" x="418" y="118">slow read</text>
  <defs><marker id="fd9" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// The hybrid, which is what real systems do:
// - push for ordinary accounts (async, via a queue)
// - skip the fan-out above a follower threshold
// - at read time: feed = precomputed timeline MERGED with recent posts
//                        from the few celebrities this user follows

Redis: feed:{userId} -> a capped sorted set (ZADD, then ZREMRANGEBYRANK to
                        keep ~800 entries). Older pages fall back to the DB.

// Fan-out is a background job, not part of the POST request. The user's
// post returns as soon as it is durably stored.</code></pre>
<table>
<tr><th>Decision</th><th>Choice</th></tr>
<tr><td>Feed storage</td><td>Redis sorted set per user, capped; DB for the long tail</td></tr>
<tr><td>Post storage</td><td>Wide-column (Cassandra) or sharded SQL by post id</td></tr>
<tr><td>Media</td><td>Object store + CDN; never through the app servers</td></tr>
<tr><td>Fan-out</td><td>Kafka consumers; idempotent, retryable</td></tr>
<tr><td>Ranking</td><td>Fetch a candidate set, then score — keep ranking out of the storage layer</td></tr>
<tr><td>Pagination</td><td><strong>Cursor</strong>, never offset — the feed changes under the reader</td></tr>
</table>
<p><strong>The follow-ups to expect:</strong> a deleted post must disappear from feeds already fanned out (filter at read, or tombstone); a new follow needs a backfill; and the feed must be <em>eventually</em> consistent — a user seeing their own post immediately usually means reading their own timeline from the write path.</p>
<p><strong>What scores:</strong> naming the celebrity problem unprompted, and saying that fan-out is asynchronous. Those two show you have thought about the write amplification rather than just drawing boxes.</p>`
},
{
  q: "Design a distributed unique ID generator",
  level: "advanced", tags: ["design-question", "distributed", "must-know"],
  companies: ["Amazon", "Google", "Uber", "Flipkart", "Walmart", "Goldman Sachs", "Swiggy"],
  a: `<table>
<tr><th>Approach</th><th>Pros</th><th>Cons</th></tr>
<tr><td>DB auto-increment</td><td>Simple, sortable</td><td><strong>Single point of failure</strong>; does not shard</td></tr>
<tr><td>UUID v4</td><td>No coordination at all</td><td>128-bit, <strong>random</strong> — terrible as a clustered index key</td></tr>
<tr><td><strong>UUID v7</strong></td><td>Time-ordered, no coordination, standard</td><td>Still 128-bit</td></tr>
<tr><td><strong>Snowflake</strong></td><td>64-bit, sortable, no coordination per id</td><td>Needs unique machine ids and sane clocks</td></tr>
<tr><td>Ticket server / range allocation</td><td>Compact, gap-free-ish</td><td>A service to run</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Snowflake 64-bit id layout">
  <rect class="dg-box" x="16" y="40" width="40" height="34" rx="4"/><text class="dg-s" x="36" y="62" text-anchor="middle">0</text>
  <rect class="dg-fill" x="58" y="40" width="300" height="34" rx="4"/><text class="dg-s" x="208" y="62" text-anchor="middle">timestamp — 41 bits</text>
  <rect class="dg-fill2" x="360" y="40" width="100" height="34" rx="4"/><text class="dg-s" x="410" y="62" text-anchor="middle">machine — 10</text>
  <rect class="dg-fill2" x="462" y="40" width="142" height="34" rx="4"/><text class="dg-s" x="533" y="62" text-anchor="middle">sequence — 12</text>
  <text class="dg-s" x="36" y="32" text-anchor="middle">sign</text>
  <text class="dg-s" x="16" y="98">41 bits of milliseconds ≈ 69 years · 1024 machines · 4096 ids per ms per machine</text>
  <text class="dg-s" x="16" y="118">the timestamp leads, so ids sort by creation time — which is the whole point</text>
</svg>
</figure>
<pre><code>public synchronized long nextId() {
    long now = System.currentTimeMillis();

    if (now &lt; lastTimestamp) {                 // CLOCK WENT BACKWARDS
        throw new IllegalStateException("clock skew");   // or wait it out
    }
    if (now == lastTimestamp) {
        sequence = (sequence + 1) &amp; 4095;      // 12 bits
        if (sequence == 0) now = waitNextMillis(lastTimestamp);   // exhausted
    } else {
        sequence = 0;
    }
    lastTimestamp = now;
    return ((now - EPOCH) &lt;&lt; 22) | (machineId &lt;&lt; 12) | sequence;
}</code></pre>
<p><strong>Why sortable ids matter more than they sound:</strong> a random UUID v4 as a primary key means every insert lands in a random spot in the B-tree, so the index is constantly split and rewritten and the working set never fits in cache. A time-ordered id appends to the right-hand edge. On a large table that difference is dramatic — it is the single most common accidental performance mistake in schema design.</p>
<table>
<tr><th>Problem</th><th>Handling</th></tr>
<tr><td>Clock skew backwards</td><td>Refuse to issue, or wait; never emit a duplicate</td></tr>
<tr><td>Assigning machine ids</td><td>ZooKeeper/etcd lease, or the Kubernetes StatefulSet ordinal</td></tr>
<tr><td>Ids leak volume and timing</td><td>Use a separate opaque public id if that matters</td></tr>
<tr><td>Sequence exhausted within a millisecond</td><td>Spin to the next millisecond</td></tr>
</table>
<p><strong>The pragmatic answer:</strong> "Unless I need 64 bits specifically, I would reach for <strong>UUID v7</strong> — it is time-ordered like Snowflake, needs no machine id allocation and no clock coordination, and it is now a standard. Snowflake is the right answer when the id must be compact, or must be an integer for an existing schema."</p>`
}
]);
