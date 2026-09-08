registerTopic("coding-greedy", [
{
  q: "When is a greedy algorithm actually correct?",
  level: "beginner", hot: true, tags: ["greedy", "strategy", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Uber", "Flipkart"],
  a: `<p>Greedy makes the locally best choice and never reconsiders. That is only safe when the problem has two properties, and being able to name them is what this question is really about.</p>
<table>
<tr><th>Property</th><th>Meaning</th></tr>
<tr><td><strong>Greedy choice property</strong></td><td>A globally optimal solution can be built by making a locally optimal choice at each step</td></tr>
<tr><td><strong>Optimal substructure</strong></td><td>After that choice, what remains is the same problem on a smaller input</td></tr>
</table>
<pre><code>// ✔ GREEDY WORKS — activity selection.
// Always take the meeting that ENDS EARLIEST among those still compatible.
public int maxMeetings(int[][] meetings) {
    Arrays.sort(meetings, Comparator.comparingInt(m -&gt; m[1]));   // by END time
    int count = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] m : meetings) {
        if (m[0] &gt;= lastEnd) { count++; lastEnd = m[1]; }
    }
    return count;
}
// The exchange argument: any optimal schedule can have its first meeting
// swapped for the earliest-ending one without reducing the count. Repeat,
// and you have transformed any optimum into the greedy solution.</code></pre>
<pre><code>// ✗ GREEDY FAILS — coin change with an arbitrary denomination set
// coins = [1, 3, 4], amount = 6
// Greedy (largest first): 4 + 1 + 1 = THREE coins
// Optimal:                3 + 3     = TWO coins
// The greedy choice of 4 destroys the better structure underneath, so
// this needs DP. Indian and US coin systems happen to be "canonical",
// which is exactly why the greedy intuition feels right and is wrong.</code></pre>
<table>
<tr><th>Problem</th><th>Greedy?</th><th>Why</th></tr>
<tr><td>Activity selection / non-overlapping intervals</td><td>✔</td><td>Earliest finish leaves the most room</td></tr>
<tr><td>Fractional knapsack</td><td>✔</td><td>Items are divisible, so value/weight ordering is exact</td></tr>
<tr><td><strong>0/1 knapsack</strong></td><td>✘</td><td>Indivisible items — needs DP</td></tr>
<tr><td>Huffman coding</td><td>✔</td><td>Merging the two rarest symbols is provably safe</td></tr>
<tr><td>Dijkstra (non-negative weights)</td><td>✔</td><td>The closest unfinalised node can never be improved later</td></tr>
<tr><td>Dijkstra with negative weights</td><td>✘</td><td>That assumption breaks — use Bellman-Ford</td></tr>
<tr><td>Jump game (can you reach the end?)</td><td>✔</td><td>Track the furthest reachable index</td></tr>
<tr><td>Coin change, arbitrary coins</td><td>✘</td><td>Counter-example above</td></tr>
<tr><td>Longest increasing subsequence</td><td>✘</td><td>Taking the smallest next element is not optimal</td></tr>
</table>
<p><strong>How to decide in an interview, in order:</strong></p>
<ol>
<li>Propose a greedy rule and say it out loud.</li>
<li><strong>Try to break it</strong> with a small counter-example before the interviewer does. Three or four elements is usually enough.</li>
<li>If it survives, give a one-line <em>exchange argument</em>: "any optimal solution can be modified to include my greedy choice without getting worse."</li>
<li>If it breaks, fall back to DP — and say what the greedy failure told you about the state you now need.</li>
</ol>
<p><strong>The honest framing:</strong> "Greedy is faster and simpler when it applies, but it applies less often than it looks. I would rather spend thirty seconds hunting a counter-example than write a fast wrong answer — a greedy solution that is subtly incorrect is worse than a correct O(n²) DP, because nothing about it looks wrong."</p>`
},
{
  q: "Meeting rooms, merge intervals and the interval pattern",
  level: "advanced", hot: true, tags: ["intervals", "greedy", "heap", "sorting"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Salesforce", "Walmart"],
  a: `<div class="cx"><b>O(n log n) time</b><span>the sort dominates every variant</span><b>O(n) space</b><span>heap or output list</span></div>
<pre><code>// MEETING ROOMS II — the minimum number of rooms needed
public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, Comparator.comparingInt(a -&gt; a[0]));     // by START
    PriorityQueue&lt;Integer&gt; endTimes = new PriorityQueue&lt;&gt;();        // min-heap of ENDS

    for (int[] m : intervals) {
        // The earliest-finishing room is free if it ended before this meeting starts
        if (!endTimes.isEmpty() && endTimes.peek() &lt;= m[0]) endTimes.poll();
        endTimes.offer(m[1]);
    }
    return endTimes.size();      // peak concurrency = rooms required
}</code></pre>
<pre><code>// SWEEP LINE — the same answer without a heap, and it generalises better
public int minMeetingRoomsSweep(int[][] intervals) {
    int n = intervals.length;
    int[] starts = new int[n], ends = new int[n];
    for (int i = 0; i &lt; n; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
    Arrays.sort(starts);
    Arrays.sort(ends);

    int rooms = 0, best = 0, j = 0;
    for (int i = 0; i &lt; n; i++) {
        while (j &lt; n && ends[j] &lt;= starts[i]) { rooms--; j++; }   // free finished rooms
        rooms++;
        best = Math.max(best, rooms);
    }
    return best;
}
// Decoupling the start and end arrays is the trick: you no longer care WHICH
// meeting ended, only that one did.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Overlapping meetings and the resulting concurrency curve">
  <rect class="dg-fill" x="40" y="24" width="150" height="18" rx="4"/><text class="dg-s" x="115" y="38" text-anchor="middle">0 — 30</text>
  <rect class="dg-fill" x="60" y="48" width="70" height="18" rx="4"/><text class="dg-s" x="95" y="62" text-anchor="middle">5 — 10</text>
  <rect class="dg-fill" x="200" y="48" width="90" height="18" rx="4"/><text class="dg-s" x="245" y="62" text-anchor="middle">15 — 20</text>
  <path class="dg-line" d="M40 84 H360"/>
  <path class="dg-line" d="M40 108 H60 V96 H130 V108 H190 V120"/>
  <text class="dg-s" x="380" y="40">rooms needed = the highest point</text>
  <text class="dg-s" x="380" y="62">of the concurrency curve</text>
  <text class="dg-s" x="16" y="146">every interval problem starts with one decision: sort by START, or sort by END?</text>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Sort by</th><th>Then</th></tr>
<tr><td>Merge intervals</td><td>start</td><td>Extend while <code>next.start ≤ cur.end</code></td></tr>
<tr><td>Can one person attend all?</td><td>start</td><td>Any overlap means no</td></tr>
<tr><td>Minimum rooms</td><td>start</td><td>Min-heap of end times, or sweep line</td></tr>
<tr><td><strong>Non-overlapping intervals</strong> (fewest removals)</td><td><strong>end</strong></td><td>Greedily keep the earliest-ending</td></tr>
<tr><td>Minimum arrows to burst balloons</td><td><strong>end</strong></td><td>Same greedy — shoot at each kept end</td></tr>
<tr><td>Insert interval</td><td>already sorted</td><td>Three phases, no sort at all — O(n)</td></tr>
<tr><td>Employee free time</td><td>start</td><td>Merge everything, the gaps are the answer</td></tr>
</table>
<p><strong>The rule that decides the sort key:</strong> if you are <em>counting or merging</em> overlaps, sort by <strong>start</strong>. If you are <em>selecting the most non-overlapping intervals</em>, sort by <strong>end</strong> — because finishing early leaves the most room for everything after it. Getting that backwards produces a solution that passes the easy tests and fails the rest.</p>
<p><strong>Ask before coding:</strong> do touching intervals — <code>[1,3]</code> and <code>[3,5]</code> — count as overlapping? For meeting rooms they usually do not (a room frees at 3); for merging they usually do. It is one character in the comparison and it flips the answer.</p>`
},
{
  q: "Top K frequent elements and the heap pattern",
  level: "advanced", hot: true, tags: ["heap", "top-k", "hashing", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Salesforce"],
  a: `<div class="cx"><b>O(n log k) with a heap</b><span>k ≪ n, streaming-friendly</span><b>O(n) with bucket sort</b><span>when frequencies are bounded by n</span></div>
<pre><code>// HEAP — O(n log k), and it works on a stream
public int[] topKFrequent(int[] nums, int k) {
    Map&lt;Integer, Integer&gt; freq = new HashMap&lt;&gt;();
    for (int x : nums) freq.merge(x, 1, Integer::sum);

    // MIN-heap of size k: the weakest survivor sits at the root, ready to evict
    PriorityQueue&lt;Map.Entry&lt;Integer, Integer&gt;&gt; pq =
        new PriorityQueue&lt;&gt;(Map.Entry.comparingByValue());

    for (var e : freq.entrySet()) {
        pq.offer(e);
        if (pq.size() &gt; k) pq.poll();
    }
    int[] out = new int[k];
    for (int i = k - 1; i &gt;= 0; i--) out[i] = pq.poll().getKey();
    return out;
}</code></pre>
<pre><code>// BUCKET SORT — O(n), because a frequency can never exceed n
public int[] topKFrequentLinear(int[] nums, int k) {
    Map&lt;Integer, Integer&gt; freq = new HashMap&lt;&gt;();
    for (int x : nums) freq.merge(x, 1, Integer::sum);

    List&lt;Integer&gt;[] buckets = new List[nums.length + 1];   // index = frequency
    for (var e : freq.entrySet()) {
        int f = e.getValue();
        if (buckets[f] == null) buckets[f] = new ArrayList&lt;&gt;();
        buckets[f].add(e.getKey());
    }

    int[] out = new int[k];
    int idx = 0;
    for (int f = buckets.length - 1; f &gt;= 1 && idx &lt; k; f--) {
        if (buckets[f] == null) continue;
        for (int v : buckets[f]) { if (idx &lt; k) out[idx++] = v; }
    }
    return out;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Min heap of size k evicting the weakest element">
  <text class="dg-s" x="16" y="20">min-heap, size k = 3</text>
  <circle class="dg-fill2" cx="120" cy="46" r="20"/><text class="dg-t" x="120" y="51" text-anchor="middle">2</text>
  <circle class="dg-fill" cx="76" cy="106" r="20"/><text class="dg-t" x="76" y="111" text-anchor="middle">5</text>
  <circle class="dg-fill" cx="166" cy="106" r="20"/><text class="dg-t" x="166" y="111" text-anchor="middle">4</text>
  <path class="dg-line" d="M106 60 L90 90 M134 60 L152 90"/>
  <text class="dg-s" x="120" y="140" text-anchor="middle">root = weakest</text>
  <path class="dg-line" d="M200 76 H262" marker-end="url(#tk1)"/>
  <text class="dg-s" x="290" y="52">a new element with frequency 6</text>
  <text class="dg-s" x="290" y="74">arrives → push, then poll the root</text>
  <text class="dg-s" x="290" y="96">the heap never exceeds k, so each</text>
  <text class="dg-s" x="290" y="118">operation costs log k, not log n</text>
  <defs><marker id="tk1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Heap type</th><th>Note</th></tr>
<tr><td>K largest elements</td><td><strong>Min</strong>-heap of size k</td><td>Counter-intuitive but correct — the root is what you evict</td></tr>
<tr><td>K smallest elements</td><td><strong>Max</strong>-heap of size k</td><td>Mirror image</td></tr>
<tr><td>K closest points to origin</td><td>Max-heap on squared distance</td><td>Do not take the square root — it is monotonic</td></tr>
<tr><td>Kth largest in a stream</td><td>Min-heap of size k</td><td>The root <em>is</em> the answer at any moment</td></tr>
<tr><td><strong>Median of a data stream</strong></td><td>Two heaps</td><td>Max-heap for the lower half, min-heap for the upper, sizes within 1</td></tr>
<tr><td>Merge k sorted lists</td><td>Min-heap of size k</td><td>O(N log k)</td></tr>
<tr><td>Task scheduler</td><td>Max-heap by remaining count</td><td>Always run the most frequent available task</td></tr>
</table>
<p><strong>Why a min-heap for the k <em>largest</em></strong> — say this before they ask: the heap holds the current best k. The root is the <em>weakest</em> of those, so it is exactly the one to discard when something better arrives. A max-heap would put the strongest at the root, which is the one element you never want to remove.</p>
<p><strong>The comparison to close with:</strong> "Sorting is O(n log n) and gives more than the question asked for. The heap is O(n log k), and it is the only version that works when the data is a stream too large to hold — which is why it is what I would actually deploy. Bucket sort is O(n) but assumes frequencies are bounded, so it fits this problem and not the general one."</p>`
},
{
  q: "Jump game, gas station and candy — greedy on arrays",
  level: "advanced", tags: ["greedy", "arrays", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<pre><code>// JUMP GAME I — can you reach the last index?
public boolean canJump(int[] nums) {
    int furthest = 0;
    for (int i = 0; i &lt; nums.length; i++) {
        if (i &gt; furthest) return false;               // a gap we can never cross
        furthest = Math.max(furthest, i + nums[i]);
    }
    return true;
}

// JUMP GAME II — minimum number of jumps. This is BFS-by-levels without a queue.
public int jump(int[] nums) {
    int jumps = 0, currentEnd = 0, furthest = 0;
    for (int i = 0; i &lt; nums.length - 1; i++) {       // -1: no jump FROM the last index
        furthest = Math.max(furthest, i + nums[i]);
        if (i == currentEnd) {                        // exhausted this jump's range
            jumps++;
            currentEnd = furthest;                    // the next level's boundary
        }
    }
    return jumps;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Jump ranges forming BFS levels across an array">
  <rect class="dg-fill2" x="16" y="34" width="50" height="30" rx="5"/><text class="dg-t" x="41" y="54" text-anchor="middle">2</text>
  <rect class="dg-fill" x="72" y="34" width="50" height="30" rx="5"/><text class="dg-t" x="97" y="54" text-anchor="middle">3</text>
  <rect class="dg-fill" x="128" y="34" width="50" height="30" rx="5"/><text class="dg-t" x="153" y="54" text-anchor="middle">1</text>
  <rect class="dg-box" x="184" y="34" width="50" height="30" rx="5"/><text class="dg-t" x="209" y="54" text-anchor="middle">1</text>
  <rect class="dg-box" x="240" y="34" width="50" height="30" rx="5"/><text class="dg-t" x="265" y="54" text-anchor="middle">4</text>
  <path class="dg-line" d="M16 78 H122" /><text class="dg-s" x="69" y="96" text-anchor="middle">jump 1 reaches here</text>
  <path class="dg-line" d="M72 112 H290" /><text class="dg-s" x="180" y="130" text-anchor="middle">jump 2 reaches the end</text>
  <text class="dg-s" x="330" y="54">each "level" is the set of indices</text>
  <text class="dg-s" x="330" y="76">reachable in the same number of</text>
  <text class="dg-s" x="330" y="98">jumps — identical to BFS layers</text>
</svg>
</figure>
<pre><code>// GAS STATION — can you complete the circuit, and from where?
public int canCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i &lt; gas.length; i++) {
        int gain = gas[i] - cost[i];
        total += gain;
        tank  += gain;
        if (tank &lt; 0) {          // cannot reach i+1 from the current start...
            start = i + 1;       // ...and no station in between works either
            tank = 0;
        }
    }
    return total &gt;= 0 ? start : -1;
}</code></pre>
<p><strong>The two facts that make gas station a one-pass greedy:</strong> if the total gas is at least the total cost, a solution <em>must</em> exist. And if you run dry between <code>start</code> and <code>i</code>, no station in that range can be a valid start either — every one of them would have even less fuel at that point. Those two observations collapse an O(n²) search into O(n), and stating them is the answer.</p>
<pre><code>// CANDY — each child gets at least 1; a higher rating than a neighbour
// means strictly more candy. Two passes, because the constraint is bidirectional.
public int candy(int[] ratings) {
    int n = ratings.length;
    int[] candy = new int[n];
    Arrays.fill(candy, 1);

    for (int i = 1; i &lt; n; i++)                    // left to right: satisfy the LEFT neighbour
        if (ratings[i] &gt; ratings[i - 1]) candy[i] = candy[i - 1] + 1;

    for (int i = n - 2; i &gt;= 0; i--)               // right to left: satisfy the RIGHT one
        if (ratings[i] &gt; ratings[i + 1]) candy[i] = Math.max(candy[i], candy[i + 1] + 1);

    return Arrays.stream(candy).sum();
}
// Math.max in the second pass is essential — it preserves what the first pass
// established instead of overwriting it.</code></pre>
<table>
<tr><th>Problem</th><th>Greedy rule</th></tr>
<tr><td>Jump game I</td><td>Track the furthest reachable index</td></tr>
<tr><td>Jump game II</td><td>Jump only when the current range is exhausted</td></tr>
<tr><td>Gas station</td><td>Restart wherever the tank goes negative</td></tr>
<tr><td>Candy</td><td>Two passes — one per direction of the constraint</td></tr>
<tr><td>Partition labels</td><td>Extend the partition to the last occurrence of every character seen</td></tr>
<tr><td>Task scheduler</td><td>Schedule the most frequent task first, fill idle slots</td></tr>
</table>
<p><strong>The pattern behind candy:</strong> whenever a constraint applies in both directions, a single pass cannot satisfy it — you sweep once each way and combine with a max. The same shape appears in trapping rain water and product-except-self, which is worth naming because it turns three problems into one technique.</p>`
},
{
  q: "Huffman coding and building an optimal merge",
  level: "advanced", tags: ["greedy", "heap", "algorithms"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Oracle", "SAP", "Goldman Sachs"],
  a: `<div class="cx"><b>O(n log n) time</b><span>n heap operations</span><b>O(n) space</b><span>the tree</span></div>
<pre><code>// HUFFMAN — build a prefix code where frequent symbols get shorter codes
class Node implements Comparable&lt;Node&gt; {
    char ch; int freq; Node left, right;
    Node(char c, int f) { ch = c; freq = f; }
    Node(Node l, Node r) { freq = l.freq + r.freq; left = l; right = r; }
    public int compareTo(Node o) { return Integer.compare(freq, o.freq); }
}

public Node buildHuffman(Map&lt;Character, Integer&gt; freq) {
    PriorityQueue&lt;Node&gt; pq = new PriorityQueue&lt;&gt;();
    freq.forEach((c, f) -&gt; pq.offer(new Node(c, f)));

    while (pq.size() &gt; 1) {
        Node a = pq.poll(), b = pq.poll();      // the two RAREST
        pq.offer(new Node(a, b));               // merge, push the combined weight back
    }
    return pq.poll();
}

public void assignCodes(Node n, String code, Map&lt;Character, String&gt; out) {
    if (n == null) return;
    if (n.left == null && n.right == null) {    // leaf = a real symbol
        out.put(n.ch, code.isEmpty() ? "0" : code);   // single-symbol edge case
        return;
    }
    assignCodes(n.left,  code + "0", out);
    assignCodes(n.right, code + "1", out);
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Huffman tree giving short codes to frequent symbols">
  <circle class="dg-fill" cx="250" cy="26" r="18"/><text class="dg-s" x="250" y="31" text-anchor="middle">100</text>
  <circle class="dg-fill2" cx="180" cy="86" r="18"/><text class="dg-s" x="180" y="91" text-anchor="middle">a:45</text>
  <circle class="dg-fill" cx="330" cy="86" r="18"/><text class="dg-s" x="330" y="91" text-anchor="middle">55</text>
  <circle class="dg-fill2" cx="280" cy="144" r="18"/><text class="dg-s" x="280" y="149" text-anchor="middle">b:30</text>
  <circle class="dg-fill2" cx="386" cy="144" r="18"/><text class="dg-s" x="386" y="149" text-anchor="middle">c:25</text>
  <path class="dg-line" d="M235 38 L194 74 M265 38 L316 74 M316 98 L294 130 M344 98 L372 130"/>
  <text class="dg-s" x="206" y="56">0</text>
  <text class="dg-s" x="300" y="56">1</text>
  <text class="dg-s" x="292" y="116">0</text>
  <text class="dg-s" x="368" y="116">1</text>
  <text class="dg-s" x="440" y="70">a → 0     (1 bit, most frequent)</text>
  <text class="dg-s" x="440" y="92">b → 10    (2 bits)</text>
  <text class="dg-s" x="440" y="114">c → 11    (2 bits)</text>
  <text class="dg-s" x="16" y="160">no code is a prefix of another, so the stream decodes with no delimiters</text>
</svg>
</figure>
<p><strong>Why merging the two rarest is provably optimal:</strong> in any optimal prefix-code tree, the two least frequent symbols must sit at the deepest level and be siblings — if they were not, swapping them with whatever is deeper would reduce the total cost. So merging them first never rules out an optimum. That exchange argument is the whole proof, and it is the answer to "how do you know greedy is right here?"</p>
<table>
<tr><th>Property</th><th>Consequence</th></tr>
<tr><td><strong>Prefix-free</strong></td><td>No code is a prefix of another, so decoding needs no separators</td></tr>
<tr><td>Frequency-weighted depth</td><td>Common symbols land near the root and get short codes</td></tr>
<tr><td>Provably optimal</td><td>No other <em>per-symbol</em> code does better on the same frequencies</td></tr>
<tr><td>Not optimal overall</td><td>Arithmetic coding beats it because it is not limited to whole bits per symbol</td></tr>
</table>
<pre><code>// The same greedy shape: MINIMUM COST TO CONNECT ROPES / merge files
public int minCostToConnect(int[] ropes) {
    PriorityQueue&lt;Integer&gt; pq = new PriorityQueue&lt;&gt;();
    for (int r : ropes) pq.offer(r);
    int cost = 0;
    while (pq.size() &gt; 1) {
        int a = pq.poll(), b = pq.poll();
        cost += a + b;                 // merging the two smallest is always cheapest
        pq.offer(a + b);
    }
    return cost;
}</code></pre>
<p><strong>Where it is used:</strong> Huffman is inside DEFLATE, so it is in every gzip file, every PNG and every JAR. JPEG uses it for the coefficients after the DCT. Knowing that the algorithm you just wrote runs on essentially every file you download makes it a much more interesting answer than the tree alone.</p>`
},
{
  q: "Task scheduler and partition labels — greedy with counting",
  level: "advanced", tags: ["greedy", "heap", "hashing"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Walmart"],
  a: `<pre><code>// TASK SCHEDULER — identical tasks need n cooldown slots between them.
// The answer is decided entirely by the MOST frequent task.
public int leastInterval(char[] tasks, int n) {
    int[] counts = new int[26];
    for (char t : tasks) counts[t - 'A']++;

    int maxCount = 0;
    for (int c : counts) maxCount = Math.max(maxCount, c);

    int numMax = 0;                                   // how many tasks tie for the max
    for (int c : counts) if (c == maxCount) numMax++;

    // Frame layout: (maxCount - 1) full frames of width (n + 1), plus the final row
    int slots = (maxCount - 1) * (n + 1) + numMax;

    // If there are enough OTHER tasks to fill every idle slot, there is no idling
    return Math.max(slots, tasks.length);
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Task scheduling frames built around the most frequent task">
  <text class="dg-s" x="16" y="20">A A A B B C,  n = 2</text>
  <rect class="dg-fill2" x="16" y="32" width="46" height="30" rx="4"/><text class="dg-t" x="39" y="52" text-anchor="middle">A</text>
  <rect class="dg-fill" x="66" y="32" width="46" height="30" rx="4"/><text class="dg-t" x="89" y="52" text-anchor="middle">B</text>
  <rect class="dg-fill" x="116" y="32" width="46" height="30" rx="4"/><text class="dg-t" x="139" y="52" text-anchor="middle">C</text>
  <rect class="dg-fill2" x="176" y="32" width="46" height="30" rx="4"/><text class="dg-t" x="199" y="52" text-anchor="middle">A</text>
  <rect class="dg-fill" x="226" y="32" width="46" height="30" rx="4"/><text class="dg-t" x="249" y="52" text-anchor="middle">B</text>
  <rect class="dg-box" x="276" y="32" width="46" height="30" rx="4"/><text class="dg-t" x="299" y="52" text-anchor="middle">idle</text>
  <rect class="dg-fill2" x="336" y="32" width="46" height="30" rx="4"/><text class="dg-t" x="359" y="52" text-anchor="middle">A</text>
  <path class="dg-line" d="M16 72 H162 M176 72 H322"/>
  <text class="dg-s" x="89" y="90" text-anchor="middle">frame 1 (n+1 = 3)</text>
  <text class="dg-s" x="249" y="90" text-anchor="middle">frame 2</text>
  <text class="dg-s" x="16" y="126">the most frequent task defines (maxCount − 1) frames of width n+1,</text>
  <text class="dg-s" x="16" y="146">plus one final slot per task that ties for the maximum → 7 intervals</text>
</svg>
</figure>
<p><strong>Why <code>Math.max(slots, tasks.length)</code> is needed:</strong> the frame formula assumes idle time exists. With many distinct tasks — say A,B,C,D,E,F and n = 1 — every gap is filled by real work and the answer is simply the number of tasks. Missing that clamp is the standard failure on this problem.</p>
<pre><code>// PARTITION LABELS — cut the string into the most pieces such that each
// letter appears in only one piece.
public List&lt;Integer&gt; partitionLabels(String s) {
    int[] last = new int[26];
    for (int i = 0; i &lt; s.length(); i++) last[s.charAt(i) - 'a'] = i;   // last occurrence

    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    int start = 0, end = 0;
    for (int i = 0; i &lt; s.length(); i++) {
        end = Math.max(end, last[s.charAt(i) - 'a']);   // the partition must stretch
        if (i == end) {                                  // nothing inside reaches further
            out.add(end - start + 1);
            start = i + 1;
        }
    }
    return out;
}</code></pre>
<table>
<tr><th>Problem</th><th>Greedy insight</th></tr>
<tr><td>Task scheduler</td><td>The most frequent task alone determines the minimum length</td></tr>
<tr><td>Partition labels</td><td>A partition must extend to the last occurrence of every letter it contains</td></tr>
<tr><td>Reorganize string</td><td>Always place the currently most frequent character — max-heap; impossible if any count exceeds (n+1)/2</td></tr>
<tr><td>Minimum number of platforms</td><td>Sweep line over arrivals and departures</td></tr>
<tr><td>Rearrange so no two adjacent are equal</td><td>Fill even indices first with the most frequent, then the odd ones</td></tr>
</table>
<p><strong>The alternative worth mentioning for task scheduler:</strong> a max-heap simulation — repeatedly take up to n+1 distinct tasks, decrement them, push back the ones that remain. It is O(n log 26) and much easier to reason about under pressure. The closed-form counting solution is faster and shorter, but if you cannot derive the frame formula on the spot, the simulation is a correct answer you can definitely write.</p>`
}
]);
