appendTopic("coding-stack-queue", [
{
  q: "Trapping rain water",
  level: "advanced", hot: true, tags: ["two-pointers", "monotonic", "arrays", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Uber"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(1) space</b><span>with two pointers</span></div>
<p><strong>The key insight:</strong> the water above any position is <code>min(tallest on the left, tallest on the right) − own height</code>. Every solution is a different way of knowing those two maxima.</p>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Water trapped between bars bounded by the shorter side">
  <rect class="dg-fill" x="30" y="110" width="24" height="24"/>
  <rect class="dg-fill2" x="56" y="86" width="24" height="48" opacity=".45"/>
  <rect class="dg-fill" x="82" y="62" width="24" height="72"/>
  <rect class="dg-fill2" x="108" y="62" width="24" height="72" opacity=".45"/>
  <rect class="dg-fill2" x="134" y="62" width="24" height="72" opacity=".45"/>
  <rect class="dg-fill" x="160" y="38" width="24" height="96"/>
  <rect class="dg-fill" x="186" y="86" width="24" height="48"/>
  <path class="dg-line" d="M30 110 H210" stroke-dasharray="3 3"/>
  <path class="dg-line" d="M82 62 H184" stroke-dasharray="3 3"/>
  <text class="dg-s" x="250" y="60">water level = min(leftMax, rightMax)</text>
  <text class="dg-s" x="250" y="84">the SHORTER wall decides — a tall wall</text>
  <text class="dg-s" x="250" y="106">on one side alone holds nothing</text>
  <text class="dg-s" x="16" y="150">shaded blocks are trapped water</text>
</svg>
</figure>
<pre><code>// TWO POINTERS — O(1) space, and the version to aim for
public int trap(int[] h) {
    int left = 0, right = h.length - 1;
    int leftMax = 0, rightMax = 0, water = 0;

    while (left &lt; right) {
        if (h[left] &lt; h[right]) {
            // h[left] < h[right] guarantees a wall AT LEAST h[right] exists to
            // the right, so leftMax alone determines the level here.
            leftMax = Math.max(leftMax, h[left]);
            water += leftMax - h[left];
            left++;
        } else {
            rightMax = Math.max(rightMax, h[right]);
            water += rightMax - h[right];
            right--;
        }
    }
    return water;
}</code></pre>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th></tr>
<tr><td>For each bar, scan both ways</td><td>O(n²)</td><td>O(1)</td></tr>
<tr><td>Precompute leftMax and rightMax arrays</td><td>O(n)</td><td>O(n)</td></tr>
<tr><td>Monotonic stack — fills layer by layer</td><td>O(n)</td><td>O(n)</td></tr>
<tr><td><strong>Two pointers</strong></td><td><strong>O(n)</strong></td><td><strong>O(1)</strong></td></tr>
</table>
<pre><code>// MONOTONIC STACK — the same family as next-greater-element.
// Each pop resolves one HORIZONTAL layer of water.
Deque&lt;Integer&gt; st = new ArrayDeque&lt;&gt;();
for (int i = 0; i &lt; h.length; i++) {
    while (!st.isEmpty() &amp;&amp; h[i] &gt; h[st.peek()]) {
        int bottom = st.pop();
        if (st.isEmpty()) break;                  // no left wall, no water
        int width = i - st.peek() - 1;
        int depth = Math.min(h[i], h[st.peek()]) - h[bottom];
        water += width * depth;
    }
    st.push(i);
}</code></pre>
<p><strong>How to present it:</strong> state the <code>min(leftMax, rightMax) − height</code> insight first — that is the actual answer. Then the O(n) space version, which is easy to justify. Then offer the two-pointer refinement and explain <em>why</em> it is valid: when <code>h[left] &lt; h[right]</code> you already know a wall at least that tall exists on the right, so you never need <code>rightMax</code> to decide the left side.</p>`
},
{
  q: "Implement a rate limiter and an LFU cache",
  level: "advanced", tags: ["design", "queue", "hashing", "system-design"],
  companies: ["Amazon", "Google", "Uber", "Flipkart", "Microsoft", "Walmart", "Salesforce"],
  a: `<pre><code>// SLIDING-WINDOW RATE LIMITER with a deque of timestamps — exact, O(1) amortised
class RateLimiter {
    private final Map&lt;String, Deque&lt;Long&gt;&gt; hits = new ConcurrentHashMap&lt;&gt;();
    private final int limit;
    private final long windowMs;

    public boolean allow(String key, long now) {
        Deque&lt;Long&gt; q = hits.computeIfAbsent(key, k -&gt; new ArrayDeque&lt;&gt;());
        synchronized (q) {
            while (!q.isEmpty() &amp;&amp; q.peekFirst() &lt;= now - windowMs) q.pollFirst();
            if (q.size() &gt;= limit) return false;
            q.offerLast(now);
            return true;
        }
    }
}
// Exact, but memory grows with the request RATE. A token bucket is O(1) memory
// per key and allows controlled bursts — which is what most APIs actually want.</code></pre>
<pre><code>// TOKEN BUCKET — two numbers per key, no list at all
class TokenBucket {
    private double tokens;
    private long last;
    private final double capacity, refillPerMs;

    synchronized boolean allow(long now) {
        tokens = Math.min(capacity, tokens + (now - last) * refillPerMs);
        last = now;
        if (tokens &lt; 1) return false;
        tokens -= 1;
        return true;
    }
}
// Lazy refill: compute how many tokens WOULD have arrived rather than
// running a timer. That is what makes it O(1) memory and O(1) time.</code></pre>
<table>
<tr><th>Algorithm</th><th>Memory per key</th><th>Behaviour</th></tr>
<tr><td>Fixed window</td><td>One counter</td><td>Allows a <strong>2× burst</strong> at the boundary</td></tr>
<tr><td>Sliding window log</td><td>O(requests)</td><td>Exact</td></tr>
<tr><td>Sliding window counter</td><td>Two counters</td><td>Near-exact, O(1)</td></tr>
<tr><td><strong>Token bucket</strong></td><td>Two numbers</td><td><strong>Controlled bursts</strong> — the usual choice</td></tr>
<tr><td>Leaky bucket</td><td>A queue</td><td>Perfectly smooth output; adds latency</td></tr>
</table>
<pre><code>// LFU CACHE — O(1) get and put. The trick is a frequency-bucketed
// doubly-linked list, not a heap.
//
//   key -> node            (lookup)
//   key -> frequency       (how often used)
//   freq -> LinkedHashSet  (insertion-ordered, so LRU breaks frequency ties)
//   minFreq                (so eviction is O(1))
//
// get(k):  move k from bucket[f] to bucket[f+1]; if bucket[minFreq] is now
//          empty, minFreq++
// put(k):  if full, evict the FIRST entry of bucket[minFreq] — least frequent,
//          and among those the least recently used. Insert with freq 1 and
//          set minFreq = 1.</code></pre>
<p><strong>Why LFU is harder than LRU:</strong> LRU needs one ordering, so a HashMap plus one linked list is enough. LFU needs ordering <em>within</em> each frequency class and a way to find the minimum frequency instantly — a heap would make it O(log n). The bucketed-list design is what keeps every operation O(1), and the <code>minFreq</code> counter only ever moves up by one on a get or resets to 1 on a put, which is why maintaining it is cheap.</p>`
}
]);
