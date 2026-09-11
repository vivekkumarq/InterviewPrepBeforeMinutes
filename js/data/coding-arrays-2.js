appendTopic("coding-arrays", [
{
  q: "Longest substring without repeating characters",
  level: "advanced", hot: true, tags: ["sliding-window", "strings", "hashing", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Zoho"],
  a: `<div class="cx"><b>O(n) time</b><span>each index visited at most twice</span><b>O(min(n, charset)) space</b></div>
<pre><code>public int lengthOfLongestSubstring(String s) {
    int[] lastSeen = new int[128];              // ASCII; use a HashMap otherwise
    Arrays.fill(lastSeen, -1);

    int best = 0, left = 0;
    for (int right = 0; right &lt; s.length(); right++) {
        char c = s.charAt(right);
        // JUMP the left edge past the previous occurrence — never step it back
        if (lastSeen[c] &gt;= left) left = lastSeen[c] + 1;
        lastSeen[c] = right;
        best = Math.max(best, right - left + 1);
    }
    return best;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Sliding window jumping its left edge past a repeated character">
  <text class="dg-s" x="16" y="20">a b c a b c b b</text>
  <rect class="dg-fill" x="16" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="38" y="50" text-anchor="middle">a</text>
  <rect class="dg-fill" x="64" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="86" y="50" text-anchor="middle">b</text>
  <rect class="dg-fill" x="112" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="134" y="50" text-anchor="middle">c</text>
  <rect class="dg-fill2" x="160" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="182" y="50" text-anchor="middle">a</text>
  <path class="dg-line" d="M38 68 V78 H182 V68" stroke-dasharray="4 3"/>
  <text class="dg-s" x="110" y="96" text-anchor="middle">'a' repeats</text>
  <path class="dg-line" d="M38 104 H82" marker-end="url(#sw1)"/>
  <text class="dg-s" x="230" y="50">left JUMPS to lastSeen['a'] + 1</text>
  <text class="dg-s" x="230" y="72">— not one step at a time, which</text>
  <text class="dg-s" x="230" y="94">is what keeps it linear</text>
  <text class="dg-s" x="16" y="140">the >= left check matters: a stale index from outside the window must be ignored</text>
  <defs><marker id="sw1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Variant</th><th>Change</th></tr>
<tr><td>At most K distinct characters</td><td>Shrink from the left while <code>map.size() &gt; k</code></td></tr>
<tr><td>Exactly K distinct</td><td><code>atMost(k) - atMost(k-1)</code></td></tr>
<tr><td>Longest repeating character replacement</td><td>Window valid while <code>len - maxFreq &lt;= k</code></td></tr>
<tr><td><strong>Minimum window substring</strong></td><td>Expand to satisfy, then shrink while still valid</td></tr>
<tr><td>Permutation in a string</td><td>Fixed-size window + frequency comparison</td></tr>
<tr><td>Longest with at most 2 distinct (fruit baskets)</td><td>Same template, k = 2</td></tr>
</table>
<pre><code>// The general sliding-window template these all fit
int left = 0;
for (int right = 0; right &lt; n; right++) {
    add(s.charAt(right));                       // grow
    while (invalid()) { remove(s.charAt(left)); left++; }   // shrink to valid
    best = Math.max(best, right - left + 1);    // record
}
// For a MINIMUM window, record inside the while instead — you want the
// smallest valid window, not the largest.</code></pre>
<p><strong>The bug to watch for:</strong> <code>if (lastSeen[c] &gt;= left)</code>. Without the <code>&gt;= left</code> check, a character last seen <em>before</em> the current window drags <code>left</code> backwards, the window grows wrongly and the answer is too large. Test with <code>"abba"</code> — that input exists specifically to catch it.</p>`
},
{
  q: "Merge intervals, and the interval problems built on it",
  level: "advanced", hot: true, tags: ["intervals", "sorting", "arrays", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Salesforce", "Walmart"],
  a: `<div class="cx"><b>O(n log n) time</b><span>the sort dominates</span><b>O(n) space</b><span>the output</span></div>
<pre><code>public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, Comparator.comparingInt(a -&gt; a[0]));   // by START

    List&lt;int[]&gt; out = new ArrayList&lt;&gt;();
    int[] current = intervals[0];
    out.add(current);

    for (int[] next : intervals) {
        if (next[0] &lt;= current[1]) {                  // overlaps
            current[1] = Math.max(current[1], next[1]);   // EXTEND in place
        } else {
            current = next;                            // start a new one
            out.add(current);
        }
    }
    return out.toArray(new int[out.size()][]);
}
// current[1] = Math.max(...) and not just next[1]: [1,10] then [2,3] must
// stay [1,10]. A fully-contained interval must not shrink the merged one.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Overlapping intervals merged into fewer ranges">
  <text class="dg-s" x="16" y="20">sorted by start</text>
  <rect class="dg-fill" x="30" y="30" width="130" height="20" rx="4"/><text class="dg-s" x="95" y="45" text-anchor="middle">1 — 3</text>
  <rect class="dg-fill" x="110" y="56" width="130" height="20" rx="4"/><text class="dg-s" x="175" y="71" text-anchor="middle">2 — 6</text>
  <rect class="dg-fill2" x="300" y="30" width="110" height="20" rx="4"/><text class="dg-s" x="355" y="45" text-anchor="middle">8 — 10</text>
  <path class="dg-line" d="M16 92 H560"/>
  <rect class="dg-fill" x="30" y="100" width="210" height="20" rx="4"/><text class="dg-s" x="135" y="115" text-anchor="middle">1 — 6 (merged)</text>
  <rect class="dg-fill2" x="300" y="100" width="110" height="20" rx="4"/><text class="dg-s" x="355" y="115" text-anchor="middle">8 — 10</text>
  <text class="dg-s" x="440" y="45">sorting by start is what</text>
  <text class="dg-s" x="440" y="65">makes one pass sufficient</text>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Sort by</th><th>Then</th></tr>
<tr><td>Merge intervals</td><td>start</td><td>Extend while <code>next.start &lt;= cur.end</code></td></tr>
<tr><td>Insert interval</td><td>already sorted</td><td>Three phases — before, merge, after. <strong>O(n), no sort.</strong></td></tr>
<tr><td>Can attend all meetings</td><td>start</td><td>Any overlap → false</td></tr>
<tr><td>Minimum meeting rooms</td><td>start</td><td>Min-heap of end times, or a sweep line</td></tr>
<tr><td><strong>Non-overlapping intervals</strong></td><td><strong>end</strong></td><td>Greedily keep the earliest finisher</td></tr>
<tr><td>Interval list intersections</td><td>both sorted</td><td>Two pointers; overlap is <code>max(starts)…min(ends)</code></td></tr>
<tr><td>Employee free time</td><td>start</td><td>Merge everything; the gaps are the answer</td></tr>
</table>
<pre><code>// INSERT INTERVAL — O(n) because the input is already sorted
int i = 0, n = intervals.length;
while (i &lt; n &amp;&amp; intervals[i][1] &lt; newInterval[0]) out.add(intervals[i++]);  // before
while (i &lt; n &amp;&amp; intervals[i][0] &lt;= newInterval[1]) {                        // overlap
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
}
out.add(newInterval);
while (i &lt; n) out.add(intervals[i++]);                                      // after</code></pre>
<p><strong>Always ask:</strong> do touching intervals count as overlapping? <code>[1,3]</code> and <code>[3,5]</code> merge into <code>[1,5]</code> if closed, stay separate if half-open. It is one character — <code>&lt;=</code> versus <code>&lt;</code> — and it flips the answer, so confirm it before you write the comparison.</p>`
}
]);
