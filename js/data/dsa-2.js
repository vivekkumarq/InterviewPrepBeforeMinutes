appendTopic("dsa", [
{
  q: "Solve: two sum, three sum and the two-pointer family",
  level: "advanced", hot: true, tags: ["practice", "two-pointers"],
  a: `<pre><code>// TWO SUM — unsorted, one pass with a hash map. O(n) time, O(n) space.
public int[] twoSum(int[] nums, int target) {
    Map&lt;Integer, Integer&gt; seen = new HashMap&lt;&gt;();
    for (int i = 0; i &lt; nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{ j, i };
        seen.put(nums[i], i);                       // put AFTER the check: handles x + x
    }
    return new int[]{ -1, -1 };
}

// THREE SUM — sort, then fix one element and two-pointer the rest. O(n^2).
public List&lt;List&lt;Integer&gt;&gt; threeSum(int[] nums) {
    Arrays.sort(nums);
    List&lt;List&lt;Integer&gt;&gt; result = new ArrayList&lt;&gt;();

    for (int i = 0; i &lt; nums.length - 2; i++) {
        if (nums[i] &gt; 0) break;                              // sorted: no triple can sum to 0
        if (i &gt; 0 &amp;&amp; nums[i] == nums[i - 1]) continue;       // skip duplicate anchors

        int lo = i + 1, hi = nums.length - 1;
        while (lo &lt; hi) {
            int sum = nums[i] + nums[lo] + nums[hi];
            if (sum &lt; 0) lo++;
            else if (sum &gt; 0) hi--;
            else {
                result.add(List.of(nums[i], nums[lo], nums[hi]));
                while (lo &lt; hi &amp;&amp; nums[lo] == nums[lo + 1]) lo++;   // skip duplicates
                while (lo &lt; hi &amp;&amp; nums[hi] == nums[hi - 1]) hi--;
                lo++; hi--;
            }
        }
    }
    return result;
}</code></pre>
<p><strong>The duplicate handling is what the interviewer is watching for.</strong> Three Sum is easy to get "working" and wrong — the naive version returns <code>[-1,0,1]</code> three times. There are two distinct places duplicates must be skipped: the anchor <code>i</code>, and both pointers after recording a match. Mention it before you write it.</p>
<p><strong>The family this belongs to</strong> — recognising the pattern is worth more than memorising one solution: container with most water, trapping rain water, sorted array squares, remove duplicates in place, valid palindrome, and 4Sum (the same trick with one more nested loop). The unifying idea: <strong>sorting turns an O(n²) search into an O(n) sweep</strong>, because you can decide which pointer to move from the comparison.</p>`
},
{
  q: "Explain and implement the sliding window pattern variants",
  level: "advanced", hot: true, tags: ["practice", "sliding-window"],
  a: `<pre><code>// FIXED window — maximum sum of any k consecutive elements. O(n).
int maxSum(int[] a, int k) {
    int sum = 0;
    for (int i = 0; i &lt; k; i++) sum += a[i];
    int best = sum;
    for (int i = k; i &lt; a.length; i++) {
        sum += a[i] - a[i - k];              // add the new, drop the old — no re-summing
        best = Math.max(best, sum);
    }
    return best;
}

// VARIABLE window — smallest subarray with sum >= target
int minSubArrayLen(int target, int[] a) {
    int lo = 0, sum = 0, best = Integer.MAX_VALUE;
    for (int hi = 0; hi &lt; a.length; hi++) {
        sum += a[hi];                        // EXPAND
        while (sum &gt;= target) {              // SHRINK while still valid
            best = Math.min(best, hi - lo + 1);
            sum -= a[lo++];
        }
    }
    return best == Integer.MAX_VALUE ? 0 : best;
}

// Window with a COUNT MAP — longest substring with at most k distinct characters
int longestWithKDistinct(String s, int k) {
    Map&lt;Character, Integer&gt; count = new HashMap&lt;&gt;();
    int lo = 0, best = 0;
    for (int hi = 0; hi &lt; s.length(); hi++) {
        count.merge(s.charAt(hi), 1, Integer::sum);
        while (count.size() &gt; k) {                          // shrink until valid again
            char left = s.charAt(lo++);
            if (count.merge(left, -1, Integer::sum) == 0) count.remove(left);
        }
        best = Math.max(best, hi - lo + 1);
    }
    return best;
}</code></pre>
<p><strong>The template to recognise:</strong> expand the right edge unconditionally; while the window is <em>invalid</em> (or while it is still valid, for a minimisation problem), shrink from the left; record the answer at the right moment. Every sliding-window problem is that skeleton with a different validity condition.</p>
<p><strong>Why it is O(n) despite the nested loop:</strong> each element enters the window once and leaves once, so the inner <code>while</code> executes at most n times <em>in total</em> across the whole outer loop — not n times per iteration. Being able to explain that amortised argument is what distinguishes understanding the pattern from having memorised it.</p>
<p><strong>Related problems:</strong> longest substring without repeating characters, permutation in string, minimum window substring, longest repeating character replacement, maximum fruit baskets.</p>`
},
{
  q: "Solve: LRU cache and design questions with data structures",
  level: "advanced", hot: true, tags: ["practice", "design"],
  a: `<p>Design problems in coding interviews test whether you can <em>combine</em> data structures to meet a complexity requirement. The recurring insight: one structure rarely gives you everything, so pair them.</p>
<table>
<tr><th>Requirement</th><th>Combination</th></tr>
<tr><td>O(1) get/put + eviction order</td><td>HashMap + doubly linked list (LRU)</td></tr>
<tr><td>O(1) insert/delete/<strong>getRandom</strong></td><td>HashMap (value → index) + ArrayList</td></tr>
<tr><td>Min element in O(1) alongside a stack</td><td>Two stacks, or one stack of (value, currentMin)</td></tr>
<tr><td>Median of a stream</td><td>Max-heap (lower half) + min-heap (upper half)</td></tr>
<tr><td>Top K frequent</td><td>HashMap counts + bounded min-heap of size K</td></tr>
<tr><td>Prefix search</td><td>Trie</td></tr>
</table>
<pre><code>// Insert / Delete / GetRandom all in O(1) — the trick is swap-with-last
class RandomizedSet {
    private final List&lt;Integer&gt; values = new ArrayList&lt;&gt;();
    private final Map&lt;Integer, Integer&gt; index = new HashMap&lt;&gt;();   // value -&gt; position
    private final Random random = new Random();

    public boolean insert(int val) {
        if (index.containsKey(val)) return false;
        index.put(val, values.size());
        values.add(val);
        return true;
    }

    public boolean remove(int val) {
        Integer i = index.remove(val);
        if (i == null) return false;
        int last = values.get(values.size() - 1);
        values.set(i, last);                       // move the last element into the hole
        if (last != val) index.put(last, i);       // O(1) instead of an O(n) shift
        values.remove(values.size() - 1);
        return true;
    }

    public int getRandom() { return values.get(random.nextInt(values.size())); }
}</code></pre>
<p><strong>The reasoning to say out loud:</strong> "getRandom needs an array for O(1) indexing. Removing from the middle of an array is O(n) — unless order does not matter, in which case I can swap the element with the last one and shrink. The map tracks where each value lives so the swap is O(1)."</p>
<p><strong>The two-heap median trick</strong> is worth having ready as well: keep a max-heap of the smaller half and a min-heap of the larger half, rebalance so their sizes differ by at most one, and the median is either the top of the larger heap or the average of both tops.</p>`
},
{
  q: "What are the graph algorithms you should know beyond BFS and DFS?",
  level: "advanced", tags: ["graphs", "algorithms"],
  a: `<table>
<tr><th>Algorithm</th><th>Solves</th><th>Complexity</th></tr>
<tr><td><strong>Topological sort</strong></td><td>Ordering with dependencies; cycle detection in a DAG</td><td>O(V + E)</td></tr>
<tr><td><strong>Dijkstra</strong></td><td>Shortest path, non-negative weights</td><td>O((V + E) log V)</td></tr>
<tr><td>Bellman-Ford</td><td>Shortest path with negative weights; detects negative cycles</td><td>O(V·E)</td></tr>
<tr><td><strong>Union-Find</strong></td><td>Connectivity, cycle detection in undirected graphs</td><td>~O(1) amortised</td></tr>
<tr><td>Kruskal / Prim</td><td>Minimum spanning tree</td><td>O(E log E)</td></tr>
<tr><td>A*</td><td>Shortest path with a heuristic (routing, games)</td><td>Depends on heuristic</td></tr>
</table>
<pre><code>// Topological sort (Kahn's algorithm) — the most frequently asked of these
List&lt;Integer&gt; topoSort(int n, int[][] edges) {
    List&lt;List&lt;Integer&gt;&gt; adj = new ArrayList&lt;&gt;();
    int[] inDegree = new int[n];
    for (int i = 0; i &lt; n; i++) adj.add(new ArrayList&lt;&gt;());
    for (int[] e : edges) { adj.get(e[0]).add(e[1]); inDegree[e[1]]++; }

    Deque&lt;Integer&gt; queue = new ArrayDeque&lt;&gt;();
    for (int i = 0; i &lt; n; i++) if (inDegree[i] == 0) queue.offer(i);

    List&lt;Integer&gt; order = new ArrayList&lt;&gt;();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int next : adj.get(node))
            if (--inDegree[next] == 0) queue.offer(next);
    }
    // If not every node was output, the remaining ones are in a CYCLE
    return order.size() == n ? order : List.of();
}

// Union-Find with path compression + union by rank
class DSU {
    int[] parent, rank;
    int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }
    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                  // already connected -> a CYCLE
        if (rank[ra] &lt; rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        return true;
    }
}</code></pre>
<p><strong>Where these show up in real interview questions:</strong> topological sort is "course schedule", build systems, and task dependency resolution — and the cycle-detection side effect is usually the actual question. Union-Find is "number of connected components", "redundant connection", and account merging. Dijkstra appears as "cheapest flights", "network delay time", and any shortest-path question where edges have <em>weights</em> — the giveaway that plain BFS is not enough.</p>`
},
{
  q: "Explain the common dynamic programming patterns with examples",
  level: "advanced", hot: true, tags: ["dp", "patterns"],
  a: `<pre><code>// 1. LINEAR DP — dp[i] depends on a few previous states
// House Robber: cannot rob adjacent houses
int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int n : nums) {
        int curr = Math.max(prev1, prev2 + n);     // skip this house, or take it
        prev2 = prev1; prev1 = curr;
    }
    return prev1;                                   // O(n) time, O(1) space
}

// 2. KNAPSACK — choose items under a constraint
// Coin change: fewest coins to make an amount (unbounded knapsack)
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int i = 1; i &lt;= amount; i++)
        for (int c : coins)
            if (c &lt;= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
    return dp[amount] &gt; amount ? -1 : dp[amount];
}

// 3. TWO-SEQUENCE DP — a 2D grid over two inputs
// Longest common subsequence
int lcs(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];
    for (int i = 1; i &lt;= a.length(); i++)
        for (int j = 1; j &lt;= b.length(); j++)
            dp[i][j] = a.charAt(i-1) == b.charAt(j-1)
                     ? dp[i-1][j-1] + 1
                     : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[a.length()][b.length()];
}

// 4. INTERVAL DP  — dp[i][j] over a range (matrix chain, burst balloons)
// 5. STATE MACHINE DP — dp[i][state] (stock trading with cooldown/limits)</code></pre>
<p><strong>The method to describe, which matters more than any single solution:</strong></p>
<ol>
<li><strong>Define the state precisely.</strong> "<code>dp[i]</code> is the maximum profit considering the first <code>i</code> houses." If you cannot say it in one sentence, the recurrence will not come.</li>
<li><strong>Write the recurrence</strong> — how does this state relate to smaller ones?</li>
<li><strong>Identify the base cases.</strong></li>
<li><strong>Determine the iteration order</strong> so dependencies are computed first.</li>
<li><strong>Optimise space</strong> if only the last one or two rows are needed — the House Robber example goes from O(n) to O(1) that way.</li>
</ol>
<p><strong>How to recognise a DP problem:</strong> it asks for a maximum, minimum, or a <em>count of ways</em>; the problem has overlapping subproblems; and a greedy choice provably fails. If a greedy solution works, DP is overkill — mention that you would check greedy first.</p>`
},
{
  q: "How do you handle system-scale problems — external sorting and streaming algorithms?",
  level: "advanced", tags: ["algorithms", "scale"],
  a: `<p>When the data does not fit in memory, the classic algorithms change shape. This comes up as "sort 100 GB with 1 GB of RAM" or "find the top 10 search queries from a billion".</p>
<pre><code>// EXTERNAL MERGE SORT — the standard answer for sorting beyond memory
1. Read the file in chunks that DO fit in memory (say 800 MB)
2. Sort each chunk in memory, write it out as a sorted "run"
3. K-way merge the runs with a min-heap holding one element per run:
   PriorityQueue&lt;Entry&gt; heap = new PriorityQueue&lt;&gt;(comparing(Entry::value));
   // poll the smallest, write it, then push the next element from that run's reader
   // O(n log k) where k = number of runs; memory = k buffers, not n</code></pre>
<pre><code>// TOP-K FROM A STREAM — bounded memory, never store everything
PriorityQueue&lt;Item&gt; heap = new PriorityQueue&lt;&gt;(comparingLong(Item::count));  // MIN-heap
for (Item item : stream) {
    heap.offer(item);
    if (heap.size() &gt; k) heap.poll();       // evict the smallest — O(n log k)
}</code></pre>
<p><strong>Probabilistic structures — trade exactness for constant memory:</strong></p>
<table>
<tr><th>Structure</th><th>Answers</th><th>Memory</th><th>Error</th></tr>
<tr><td><strong>Bloom filter</strong></td><td>"Have I seen this?"</td><td>~10 bits/element</td><td>False positives only, never false negatives</td></tr>
<tr><td><strong>HyperLogLog</strong></td><td>"How many distinct?"</td><td>~12 KB for billions</td><td>~2%</td></tr>
<tr><td><strong>Count-Min Sketch</strong></td><td>"How often did X occur?"</td><td>Fixed grid</td><td>Overestimates only</td></tr>
<tr><td>Reservoir sampling</td><td>"Give me k uniform samples"</td><td>O(k)</td><td>Exact uniformity</td></tr>
</table>
<pre><code>// Bloom filter in practice: avoid an expensive lookup for keys that cannot exist
if (!bloomFilter.mightContain(key)) return null;    // definitely absent — skip the database
return database.get(key);                            // might be present — check properly</code></pre>
<p><strong>Why these matter in real systems:</strong> Bloom filters guard cache and database lookups (this is exactly how Cassandra avoids reading SSTables that cannot contain a key); HyperLogLog powers "unique visitors" dashboards where an exact count would require storing every visitor ID; and reservoir sampling gives representative log samples without buffering the stream.</p>
<p><strong>The framing that scores:</strong> "At this scale the right question is not 'which algorithm is fastest' but 'what am I willing to approximate'. A 2% error on a unique-visitor count is invisible to the business and reduces memory from gigabytes to kilobytes."</p>`
}
]);
