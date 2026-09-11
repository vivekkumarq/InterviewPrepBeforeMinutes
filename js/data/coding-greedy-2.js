appendTopic("coding-greedy", [
{
  q: "Merge k sorted lists and find the median of a data stream",
  level: "advanced", hot: true, tags: ["heap", "two-heaps", "streaming", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Goldman Sachs", "Flipkart"],
  a: `<div class="cx"><b>Merge k lists: O(N log k)</b><span>N elements, heap of size k</span><b>Median: O(log n) add, O(1) read</b></div>
<pre><code>// MERGE K SORTED LISTS — a min-heap of the current head of each list
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue&lt;ListNode&gt; pq =
        new PriorityQueue&lt;&gt;(Comparator.comparingInt(n -&gt; n.val));

    for (ListNode l : lists) if (l != null) pq.offer(l);      // k heads

    ListNode dummy = new ListNode(0), cur = dummy;
    while (!pq.isEmpty()) {
        ListNode n = pq.poll();
        cur.next = n; cur = n;
        if (n.next != null) pq.offer(n.next);    // pull the next from THAT list
    }
    return dummy.next;
}
// The heap never exceeds k, so each of the N elements costs log k, not log N.
// Divide-and-conquer pairwise merging gives the same bound with O(1) space.</code></pre>
<pre><code>// MEDIAN OF A DATA STREAM — two heaps facing each other
class MedianFinder {
    private final PriorityQueue&lt;Integer&gt; low  = new PriorityQueue&lt;&gt;(reverseOrder());
    private final PriorityQueue&lt;Integer&gt; high = new PriorityQueue&lt;&gt;();

    public void addNum(int n) {
        low.offer(n);                    // always into low first...
        high.offer(low.poll());          // ...then move its max across,
        if (high.size() &gt; low.size())    // ...then rebalance.
            low.offer(high.poll());
        // This three-line dance keeps both the ordering AND the size invariant
        // without any special cases.
    }
    public double findMedian() {
        return low.size() &gt; high.size()
            ? low.peek()
            : (low.peek() + high.peek()) / 2.0;
    }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Two heaps meeting at the median">
  <rect class="dg-fill" x="40" y="44" width="200" height="46" rx="9"/>
  <text class="dg-s" x="140" y="64" text-anchor="middle">low — MAX-heap</text>
  <text class="dg-s" x="140" y="82" text-anchor="middle">smaller half</text>
  <rect class="dg-fill2" x="380" y="44" width="200" height="46" rx="9"/>
  <text class="dg-s" x="480" y="64" text-anchor="middle">high — MIN-heap</text>
  <text class="dg-s" x="480" y="82" text-anchor="middle">larger half</text>
  <path class="dg-line" d="M244 67 H288 M332 67 H376" marker-end="url(#md1)"/>
  <circle class="dg-box" cx="310" cy="67" r="20"/><text class="dg-s" x="310" y="72" text-anchor="middle">median</text>
  <text class="dg-s" x="16" y="126">both roots sit at the boundary, so the median is always O(1) to read</text>
  <defs><marker id="md1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Follow-up</th><th>Answer</th></tr>
<tr><td>All numbers are 0–100</td><td>A <strong>counting array</strong> of 101 buckets — O(1) add, O(100) median</td></tr>
<tr><td>99% are 0–100, some are not</td><td>Buckets for the common range, heaps for the outliers</td></tr>
<tr><td>Sliding-window median</td><td>Two <code>TreeSet</code>s or a multiset — heaps cannot remove an arbitrary element in O(log n)</td></tr>
<tr><td>Kth largest in a stream</td><td>One min-heap of size k; the root is the answer</td></tr>
<tr><td>Top K frequent in a stream</td><td>Count map + a min-heap of size k</td></tr>
</table>
<p><strong>The invariant to state explicitly:</strong> every element in <code>low</code> is ≤ every element in <code>high</code>, and the sizes differ by at most one. The three-line <code>addNum</code> maintains both without branching — offering into <code>low</code>, moving its maximum to <code>high</code>, then rebalancing is what guarantees the ordering rather than just the sizes.</p>`
},
{
  q: "Scheduling problems — job sequencing, minimum platforms and task assignment",
  level: "advanced", tags: ["greedy", "intervals", "scheduling", "heap"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Walmart", "Uber"],
  a: `<pre><code>// MINIMUM PLATFORMS — the sweep line, and the cleanest interval pattern there is
public int minPlatforms(int[] arrivals, int[] departures) {
    Arrays.sort(arrivals);
    Arrays.sort(departures);          // sort INDEPENDENTLY — which train left
                                      // does not matter, only that one did
    int platforms = 0, best = 0, j = 0;
    for (int i = 0; i &lt; arrivals.length; i++) {
        while (j &lt; departures.length &amp;&amp; departures[j] &lt;= arrivals[i]) { platforms--; j++; }
        platforms++;
        best = Math.max(best, platforms);
    }
    return best;
}
// Decoupling the two arrays is the trick. It turns "which intervals overlap"
// into "how many events are open right now", which is a single pass.</code></pre>
<pre><code>// JOB SEQUENCING WITH DEADLINES — maximise profit, each job takes one slot
// Greedy: take the most profitable jobs, and schedule each as LATE as it can go,
// leaving earlier slots free for jobs with tighter deadlines.
Arrays.sort(jobs, (a, b) -&gt; b.profit - a.profit);       // profit DESC
boolean[] slot = new boolean[maxDeadline + 1];

for (Job job : jobs) {
    for (int t = Math.min(maxDeadline, job.deadline); t &gt; 0; t--) {
        if (!slot[t]) { slot[t] = true; total += job.profit; break; }
    }
}
// O(n·d). With a union-find "find the latest free slot <= d" it becomes
// near-O(n log n) — a nice follow-up if they push on complexity.</code></pre>
<table>
<tr><th>Problem</th><th>Greedy rule</th></tr>
<tr><td>Minimum platforms / meeting rooms</td><td>Sweep arrivals and departures; track peak concurrency</td></tr>
<tr><td>Maximum jobs in one machine</td><td>Sort by <strong>end</strong> time, keep the earliest finisher</td></tr>
<tr><td>Job sequencing with deadlines</td><td>Sort by profit; schedule <strong>as late as possible</strong></td></tr>
<tr><td>Minimum number of machines</td><td>Min-heap of finish times — reuse the earliest-free machine</td></tr>
<tr><td>Task scheduler with cooldown</td><td>The most frequent task determines the length</td></tr>
<tr><td>Car pooling / meeting capacity</td><td>Difference array over the timeline, then prefix sum</td></tr>
</table>
<pre><code>// ASSIGN TASKS TO WORKERS — a min-heap of when each machine becomes free
PriorityQueue&lt;Long&gt; free = new PriorityQueue&lt;&gt;();
for (int i = 0; i &lt; machines; i++) free.offer(0L);

for (int duration : tasks) {
    long earliest = free.poll();          // the machine available soonest
    free.offer(earliest + duration);
}
long makespan = Collections.max(free);
// Greedy is NOT optimal for the general makespan problem (it is NP-hard), but
// longest-processing-time-first is a known 4/3 approximation — worth saying
// rather than claiming optimality you cannot defend.</code></pre>
<p><strong>The honesty that scores:</strong> several scheduling problems are NP-hard, and a greedy answer is an approximation. Saying "this is greedy and gives a good answer, but the optimal version is NP-hard so I would need DP or a solver for an exact result" is a much stronger answer than presenting the heuristic as exact.</p>`
}
]);
