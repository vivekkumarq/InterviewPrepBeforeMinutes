appendTopic("algorithms", [
{
  q: "How do hashing, collisions and consistent hashing work?",
  level: "advanced", hot: true, tags: ["hashing", "distributed", "algorithms", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Flipkart", "Walmart", "Adobe", "Oracle"],
  a: `<table>
<tr><th>Collision strategy</th><th>How</th><th>Used by</th></tr>
<tr><td><strong>Chaining</strong></td><td>A list (or tree) per bucket</td><td>Java's <code>HashMap</code></td></tr>
<tr><td>Linear probing</td><td>Try the next slot</td><td>Fast; suffers clustering</td></tr>
<tr><td>Quadratic probing</td><td>Try i² slots away</td><td>Less clustering</td></tr>
<tr><td>Double hashing</td><td>A second hash gives the step</td><td>Best distribution of the probing family</td></tr>
<tr><td>Robin Hood / cuckoo</td><td>Relocate entries to bound probe length</td><td>High-performance libraries</td></tr>
</table>
<pre><code>// Java's HashMap: index = (n - 1) & (h ^ (h >>> 16))
// - the XOR SPREADS high bits into the low ones, because the mask only looks
//   at the low bits and many hashCodes differ only up high
// - the mask works only because n is a POWER OF TWO; it replaces % n
// - load factor 0.75, then double and rehash
// - a bucket with 8+ entries becomes a red-black TREE, capping a hash-collision
//   denial-of-service attack at O(log n) instead of O(n)</code></pre>
<p><strong>Now the distributed problem.</strong> With <code>server = hash(key) % N</code>, adding one server changes N — and <strong>almost every key remaps</strong>. Your entire cache misses at once, and the stampede hits the database.</p>
<figure class="fig">
<svg viewBox="0 0 620 175" role="img" aria-label="Consistent hashing ring with virtual nodes">
  <circle class="dg-box" cx="150" cy="76" r="58" fill="none"/>
  <circle class="dg-fill" cx="150" cy="18" r="8"/><text class="dg-s" x="150" y="12" text-anchor="middle">A</text>
  <circle class="dg-fill2" cx="205" cy="60" r="8"/><text class="dg-s" x="224" y="58">B</text>
  <circle class="dg-fill" cx="186" cy="122" r="8"/><text class="dg-s" x="202" y="134">A</text>
  <circle class="dg-fill2" cx="110" cy="131" r="8"/><text class="dg-s" x="100" y="146">B</text>
  <circle class="dg-fill" cx="95" cy="40" r="8"/><text class="dg-s" x="80" y="32">A</text>
  <text class="dg-s" x="270" y="46">a key hashes onto the ring and walks</text>
  <text class="dg-s" x="270" y="68">CLOCKWISE to the first node</text>
  <text class="dg-s" x="270" y="98">adding a node only steals keys from</text>
  <text class="dg-s" x="270" y="120">its immediate neighbour — about K/N</text>
  <text class="dg-s" x="16" y="168">VIRTUAL NODES (each server appears many times) even out the distribution</text>
</svg>
</figure>
<pre><code>// Consistent hashing with virtual nodes, in about ten lines
TreeMap&lt;Long, String&gt; ring = new TreeMap&lt;&gt;();

void addServer(String server, int vnodes) {
    for (int i = 0; i &lt; vnodes; i++)                  // ~150 in practice
        ring.put(hash(server + "#" + i), server);
}
String serverFor(String key) {
    if (ring.isEmpty()) return null;
    Map.Entry&lt;Long, String&gt; e = ring.ceilingEntry(hash(key));   // clockwise
    return (e != null ? e : ring.firstEntry()).getValue();      // wrap around
}
// ceilingEntry + firstEntry is the whole ring: a TreeMap already IS one.</code></pre>
<table>
<tr><th>Technique</th><th>Solves</th></tr>
<tr><td><strong>Consistent hashing</strong></td><td>Rebalancing cost — only K/N keys move</td></tr>
<tr><td><strong>Virtual nodes</strong></td><td>Uneven distribution and hot spots</td></tr>
<tr><td>Rendezvous (HRW) hashing</td><td>Same goal, no ring — pick the node with the highest <code>hash(key, node)</code></td></tr>
<tr><td>Bloom filter</td><td>"Is this <em>definitely not</em> present?" in a few bits per key</td></tr>
<tr><td>HyperLogLog</td><td>Approximate distinct counts in kilobytes</td></tr>
</table>
<p><strong>Where you have already met it:</strong> Cassandra and DynamoDB partitioning, Memcached client sharding, and load balancers doing session affinity. It is also the reason a Kafka topic's partition count is painful to change — the key-to-partition mapping is a plain modulo, so changing it breaks per-key ordering.</p>`
},
{
  q: "How do you approach a problem you genuinely cannot solve in the interview?",
  level: "beginner", hot: true, tags: ["strategy", "problem-solving", "interview"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs", "TCS"],
  a: `<p>This happens to nearly everyone, and how you handle it is itself a strong signal. Interviewers are far more interested in how you behave when stuck than in whether you happened to have seen the problem.</p>
<table>
<tr><th>Do</th><th>Instead of</th></tr>
<tr><td><strong>Narrate what you know.</strong> "This needs the previous state, so it smells like DP — I am working out what the state should be."</td><td>Silence. Nobody can help a blank screen.</td></tr>
<tr><td><strong>Solve a smaller version.</strong> n = 2. One dimension instead of two.</td><td>Staring at the general case</td></tr>
<tr><td><strong>Write the brute force.</strong></td><td>Holding out for the optimal solution and finishing with nothing</td></tr>
<tr><td><strong>Work a concrete example by hand.</strong></td><td>Reasoning abstractly in your head</td></tr>
<tr><td><strong>Ask for a hint</strong> after a few honest minutes.</td><td>Five silent minutes, which reads far worse</td></tr>
<tr><td>State your invariant and test it against a case</td><td>Writing code you cannot justify</td></tr>
</table>
<pre><code>// Things worth saying out loud, verbatim:
//
// "Let me restate the problem to check I have it right."
// "My first thought is O(n^2) by checking every pair — let me write that,
//  then look for what I am recomputing."
// "I am recomputing the maximum of this window each time. If I remembered it
//  incrementally that would be O(n)."
// "I have two approaches; the trade-off is time against space. Which matters
//  more here?"
// "I have been going in circles for a couple of minutes — could you nudge me?"</code></pre>
<table>
<tr><th>When you finish early</th><th>When time runs out</th></tr>
<tr><td>Walk your own code on an example</td><td>Say what you would do with more time</td></tr>
<tr><td>Name the edge cases and test them</td><td>State the complexity you were aiming for</td></tr>
<tr><td>State time and space complexity</td><td>Name the specific step you had not finished</td></tr>
<tr><td>Offer the trade-off you did not take</td><td>Do not apologise repeatedly — say it once and move on</td></tr>
</table>
<p><strong>What is actually being assessed:</strong> can you decompose an unfamiliar problem, do you communicate while thinking, do you check your own work, and are you someone a colleague could pair with for a day. A candidate who reaches a working brute force while explaining their reasoning usually scores above one who half-writes an optimal solution in silence.</p>
<p><strong>And afterwards:</strong> if a problem beat you, look it up the same evening — not to memorise the answer, but to find the <em>pattern</em> you missed. That is the only part of the experience that compounds.</p>`
}
]);
