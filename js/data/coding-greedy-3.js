appendTopic("coding-greedy", [
{
  q: "How do you prove a greedy choice is correct — and when is it not?",
  level: "advanced", hot: true, tags: ["greedy", "proof", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Uber", "Flipkart"],
  a: `<p>Greedy means committing to a local choice and never reconsidering. That is only sound when two properties hold — and naming them is what separates a lucky guess from an argued answer.</p>
<table>
<tr><th>Property</th><th>Meaning</th></tr>
<tr><td><strong>Greedy choice property</strong></td><td>Some optimal solution contains the greedy choice, so taking it costs nothing</td></tr>
<tr><td><strong>Optimal substructure</strong></td><td>After the choice, the remaining problem is the same problem, smaller</td></tr>
</table>
<pre><code>// EXCHANGE ARGUMENT — the proof interviewers actually expect, in three lines.
// Activity selection: pick the activity that FINISHES earliest.
//
// 1. Let OPT be any optimal schedule, and let g be the earliest-finishing activity.
// 2. If OPT does not contain g, take OPT's first activity x. Since g finishes no
//    later than x, swapping x for g keeps every later activity compatible.
// 3. The swapped schedule has the SAME size and contains g. So an optimal
//    solution containing the greedy choice exists. Induct on what remains.
//
// "Exchange argument" is the phrase. Say it — it shows you know greedy needs
// a proof at all, which most candidates skip entirely.</code></pre>
<table>
<tr><th>Problem</th><th>Greedy works?</th><th>Why</th></tr>
<tr><td>Activity selection / non-overlapping intervals</td><td>Yes</td><td>Sort by END time — earliest finish leaves the most room</td></tr>
<tr><td>Fractional knapsack</td><td>Yes</td><td>Items are divisible, so ratio ordering is exact</td></tr>
<tr><td><strong>0/1 knapsack</strong></td><td><strong>No</strong></td><td>Indivisible — a ratio-best item can block two better ones. <strong>DP.</strong></td></tr>
<tr><td>Coin change, canonical coins (1,5,10,25)</td><td>Yes</td><td>The system is canonical</td></tr>
<tr><td><strong>Coin change, arbitrary coins</strong></td><td><strong>No</strong></td><td>[1,3,4] for 6: greedy 4+1+1 = 3 coins, optimal 3+3 = 2. <strong>DP.</strong></td></tr>
<tr><td>Huffman coding</td><td>Yes</td><td>The two rarest symbols are siblings at maximum depth in some optimum</td></tr>
<tr><td>Dijkstra</td><td>Yes*</td><td>*Non-negative weights only — a negative edge breaks the finality of a settled node</td></tr>
<tr><td>Jump game / gas station</td><td>Yes</td><td>Reachability is monotone</td></tr>
</table>
<pre><code>// THE SORT KEY IS THE WHOLE ALGORITHM. Getting it wrong is the usual failure.
sort by END   -> maximum number of non-overlapping intervals
sort by START -> merging intervals, detecting any overlap
sort by ratio -> fractional knapsack
sort by DEADLINE + a heap -> job scheduling with profits
sort by size, place greedily -> the classic wrong answer for bin packing
                                (greedy is only a 1.7x approximation there)</code></pre>
<p><strong>How to decide in the room:</strong> try to build a small counterexample first — three items, tiny numbers. Find one and greedy is dead, so go to DP. Fail to find one in a minute and state the exchange argument instead. "I could not break it and here is why swapping preserves optimality" is a complete answer; "it felt right" is not.</p>`
},
{
  q: "The interval problems — merge, insert, meeting rooms, and erase overlaps",
  level: "beginner", hot: true, tags: ["intervals", "greedy", "sorting", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Salesforce"],
  a: `<p>Four problems, one decision: <strong>sort by start, or sort by end?</strong> Everything else follows.</p>
<pre><code>// MERGE INTERVALS — sort by START
Arrays.sort(iv, (x, y) -> Integer.compare(x[0], y[0]));
List&lt;int[]&gt; out = new ArrayList&lt;&gt;();
for (int[] cur : iv) {
    int[] last = out.isEmpty() ? null : out.get(out.size() - 1);
    if (last != null &amp;&amp; cur[0] &lt;= last[1]) last[1] = Math.max(last[1], cur[1]);
    else out.add(cur);
}
// Math.max matters: [1,10] then [2,3] must stay [1,10], not shrink to [1,3].

// ERASE OVERLAP INTERVALS (remove fewest) — sort by END
Arrays.sort(iv, (x, y) -> Integer.compare(x[1], y[1]));
int end = Integer.MIN_VALUE, kept = 0;
for (int[] cur : iv)
    if (cur[0] &gt;= end) { kept++; end = cur[1]; }
return iv.length - kept;
// Same problem as activity selection, phrased as a removal count.</code></pre>
<pre><code>// MEETING ROOMS II — fewest rooms needed. Two solutions, both worth knowing.

// (a) Min-heap of end times — O(n log n)
Arrays.sort(iv, (x, y) -> Integer.compare(x[0], y[0]));
PriorityQueue&lt;Integer&gt; rooms = new PriorityQueue&lt;&gt;();     // earliest ending first
for (int[] m : iv) {
    if (!rooms.isEmpty() &amp;&amp; rooms.peek() &lt;= m[0]) rooms.poll();  // a room freed up
    rooms.offer(m[1]);
}
return rooms.size();

// (b) SWEEP LINE — often cleaner, and generalises to "max concurrent anything"
// +1 at every start, -1 at every end, sort the events, track the running max.
// Tie-break: process ENDS before STARTS, or a meeting ending exactly when
// another begins wrongly demands two rooms.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Overlapping intervals and the running count of concurrent meetings">
  <rect class="dg-fill" x="30" y="26" width="150" height="18" rx="4"/><text class="dg-s" x="188" y="40">9:00–10:30</text>
  <rect class="dg-fill2" x="100" y="52" width="120" height="18" rx="4"/><text class="dg-s" x="228" y="66">9:45–10:45</text>
  <rect class="dg-fill" x="240" y="78" width="140" height="18" rx="4"/><text class="dg-s" x="388" y="92">11:00–12:00</text>
  <path class="dg-line" d="M30 112 L560 112"/>
  <text class="dg-s" x="30" y="132">concurrent: 1</text>
  <text class="dg-s" x="120" y="132">2</text>
  <text class="dg-s" x="200" y="132">1</text>
  <text class="dg-s" x="300" y="132">1  → peak 2 = rooms needed</text>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Sort by</th><th>Extra structure</th></tr>
<tr><td>Merge intervals</td><td>Start</td><td>—</td></tr>
<tr><td>Insert interval</td><td>Already sorted</td><td>Three phases: before, merging, after</td></tr>
<tr><td>Non-overlapping / erase overlap</td><td><strong>End</strong></td><td>—</td></tr>
<tr><td>Meeting rooms I (can attend all?)</td><td>Start</td><td>Any overlap at all → false</td></tr>
<tr><td>Meeting rooms II (how many rooms?)</td><td>Start</td><td>Min-heap of ends, or sweep line</td></tr>
<tr><td>Minimum arrows to burst balloons</td><td>End</td><td>Same as erase-overlap, inverted</td></tr>
<tr><td>Employee free time</td><td>Start, all merged</td><td>Gaps between merged blocks</td></tr>
</table>
<p><strong>The boundary question always comes:</strong> is <code>[1,2]</code> and <code>[2,3]</code> an overlap? Ask. Half these problems treat endpoints as closed and half as half-open, and the entire answer hinges on <code>&lt;</code> versus <code>&lt;=</code>. Asking is a point in your favour, not a sign of doubt.</p>`
},
{
  q: "Heaps and top-K: when a heap beats sorting",
  level: "beginner", hot: true, tags: ["heap", "top-k", "priority-queue", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Oracle", "Walmart"],
  a: `<div class="cx"><b>Sort everything: O(n log n)</b><span>simple, needs all the data</span><b>Heap of size k: O(n log k)</b><span>and works on a stream</span></div>
<pre><code>// TOP K LARGEST — keep a MIN-heap of size k. The counter-intuitive part.
PriorityQueue&lt;Integer&gt; heap = new PriorityQueue&lt;&gt;();      // min-heap
for (int x : nums) {
    heap.offer(x);
    if (heap.size() &gt; k) heap.poll();                     // evict the smallest
}
// The heap holds the k largest; its ROOT is the k-th largest.
//
// Why a MIN-heap for the LARGEST? Because you need cheap access to the
// weakest member you are holding, to decide who gets evicted. Mixing this up
// is the most common top-K mistake, and it still compiles and still returns
// numbers — just the wrong ones.</code></pre>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th><th>Use when</th></tr>
<tr><td>Sort, take k</td><td>O(n log n)</td><td>O(1)</td><td>k is close to n; you need them ordered anyway</td></tr>
<tr><td><strong>Heap of size k</strong></td><td><strong>O(n log k)</strong></td><td>O(k)</td><td>k ≪ n, or the data is a <strong>stream</strong></td></tr>
<tr><td>Quickselect</td><td>O(n) average</td><td>O(1)</td><td>You need the k-th, one time, all data in memory</td></tr>
<tr><td>Bucket sort by frequency</td><td>O(n)</td><td>O(n)</td><td>Top-K <em>frequent</em> — counts are bounded by n</td></tr>
</table>
<pre><code>// Java PriorityQueue details that get asked
new PriorityQueue&lt;&gt;()                                   // min-heap by default
new PriorityQueue&lt;&gt;(Comparator.reverseOrder())          // max-heap
new PriorityQueue&lt;&gt;(Comparator.comparingInt(a -&gt; a[1])) // by a field
new PriorityQueue&lt;&gt;(existingCollection)                 // HEAPIFY — O(n), not O(n log n)

peek()      O(1)
offer/poll  O(log n)
contains()  O(n)        // it is a heap, not a search tree
remove(obj) O(n)        // the reason "lazy deletion" is a standard trick
// Iteration order is NOT sorted — only the head is guaranteed. People print a
// PriorityQueue, see unsorted output, and think it is broken.</code></pre>
<table>
<tr><th>Problem</th><th>Shape</th></tr>
<tr><td>K-th largest in an array</td><td>Min-heap of k, or quickselect</td></tr>
<tr><td>Top K frequent elements</td><td>Count map → heap of k, or bucket by frequency for O(n)</td></tr>
<tr><td>K closest points to the origin</td><td>Max-heap of k on squared distance — skip the <code>sqrt</code></td></tr>
<tr><td>Merge K sorted lists</td><td>Min-heap of the k heads → O(N log k)</td></tr>
<tr><td>Median from a data stream</td><td><strong>Two heaps</strong> — max-heap below, min-heap above, sizes kept within one</td></tr>
<tr><td>Task scheduler / reorganise string</td><td>Max-heap on remaining count</td></tr>
<tr><td>Find median of a huge file</td><td>Two heaps, or t-digest if approximate is allowed</td></tr>
</table>
<p><strong>The stream framing wins the follow-up:</strong> "If the data does not fit in memory, sorting is not an option at all, but the size-k heap never grows past k regardless of input size. That is why top-K in production is always a heap."</p>`
}
]);
