appendTopic("dsa", [
{
  q: "Explain the sliding window pattern — and solve 'longest substring without repeating characters'",
  level: "advanced", hot: true, tags: ["sliding-window", "strings"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Walmart", "Uber"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Sliding window expanding and contracting over a string">
  <g>
    <rect class="dg-box" x="40" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="62" y="56" text-anchor="middle">a</text>
    <rect class="dg-fill" x="88" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="110" y="56" text-anchor="middle">b</text>
    <rect class="dg-fill" x="136" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="158" y="56" text-anchor="middle">c</text>
    <rect class="dg-fill" x="184" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="206" y="56" text-anchor="middle">a</text>
    <rect class="dg-box" x="232" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="254" y="56" text-anchor="middle">b</text>
    <rect class="dg-box" x="280" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="302" y="56" text-anchor="middle">c</text>
    <rect class="dg-box" x="328" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="350" y="56" text-anchor="middle">b</text>
    <rect class="dg-box" x="376" y="30" width="44" height="40" rx="4"/><text class="dg-t" x="398" y="56" text-anchor="middle">b</text>
  </g>
  <text class="dg-s" x="110" y="92" text-anchor="middle">left</text>
  <text class="dg-s" x="206" y="92" text-anchor="middle">right</text>
  <path class="dg-line" d="M110 96 V78 M206 96 V78"/>
  <text class="dg-s" x="300" y="126" text-anchor="middle">'a' repeats -&gt; move left past the previous 'a'; each index enters and leaves once =&gt; O(n)</text>
</svg>
</figure>
<pre><code>// O(n) time, O(min(n, charset)) space
public int lengthOfLongestSubstring(String s) {
    Map&lt;Character, Integer&gt; lastSeen = new HashMap&lt;&gt;();
    int best = 0, left = 0;

    for (int right = 0; right &lt; s.length(); right++) {
        char c = s.charAt(right);
        // Jump left PAST the duplicate — never move it backwards
        if (lastSeen.containsKey(c)) {
            left = Math.max(left, lastSeen.get(c) + 1);
        }
        lastSeen.put(c, right);
        best = Math.max(best, right - left + 1);
    }
    return best;
}</code></pre>
<p><strong>The detail interviewers probe:</strong> <code>Math.max(left, ...)</code>. Without it, on <code>"abba"</code>, when the second <code>'a'</code> is reached the stale index would drag <code>left</code> backwards and the window would contain a duplicate. Being able to name that test case is what separates a memorised solution from an understood one.</p>
<table>
<tr><th>Window type</th><th>Signal in the problem</th><th>Examples</th></tr>
<tr><td><strong>Fixed size k</strong></td><td>"subarray of size k"</td><td>Max sum of size k; anagrams in a string</td></tr>
<tr><td><strong>Variable, longest</strong></td><td>"longest ... satisfying X"</td><td>This one; longest with at most k distinct</td></tr>
<tr><td><strong>Variable, shortest</strong></td><td>"minimum window / smallest subarray"</td><td>Minimum window substring; smallest subarray ≥ target</td></tr>
</table>
<pre><code>// The general shape — memorise the SKELETON, not individual solutions
int left = 0;
for (int right = 0; right &lt; n; right++) {
    add(arr[right]);                       // expand
    while (windowIsInvalid()) {            // shrink only while it must
        remove(arr[left++]);
    }
    best = Math.max(best, right - left + 1);   // longest
    // for SHORTEST: shrink while VALID and record inside that loop
}</code></pre>
<p><strong>When it applies:</strong> a contiguous subarray or substring, with a property that can be maintained incrementally as elements enter and leave. It turns the obvious O(n²) — checking every subarray — into O(n), because each pointer only ever moves forward.</p>
<p><strong>The precondition to state:</strong> for the two-pointer version to be valid, the property must be monotonic — shrinking the window must never make an invalid window more invalid. With negative numbers, "subarray sum ≥ target" loses that property, and you need a prefix-sum plus deque or a map instead. Saying this shows you know <em>why</em> the technique works.</p>`
},
{
  q: "How do you approach a dynamic programming problem from scratch?",
  level: "advanced", hot: true, tags: ["dp", "strategy"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Flipkart", "Uber"],
  a: `<p><strong>A five-step recipe that works on almost any DP problem</strong> — walk through it out loud, because the interviewer is grading the process:</p>
<ol>
<li><strong>Is it DP at all?</strong> Look for "count the ways", "minimum/maximum cost", "is it possible" — with <em>overlapping subproblems</em> and <em>optimal substructure</em>. If greedy provably works, DP is overkill; if subproblems do not repeat, it is plain recursion.</li>
<li><strong>Define the state.</strong> What is the smallest set of parameters that fully describes a subproblem? This is the hard step and the one worth spending time on aloud.</li>
<li><strong>Write the recurrence.</strong> How does the answer at this state build from smaller ones?</li>
<li><strong>Base cases</strong> and the iteration order (memoised recursion first — it is easier to get right).</li>
<li><strong>Optimise space</strong> if the recurrence only looks back a row or two.</li>
</ol>
<pre><code>// Worked example: coin change — fewest coins to make 'amount'
// 1. Minimum + repeated subproblems -> DP
// 2. State:  dp[a] = fewest coins to make exactly amount 'a'
// 3. dp[a] = 1 + min(dp[a - coin]) over all coins that fit
// 4. dp[0] = 0; unreachable = infinity

public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);        // sentinel &gt; any real answer
    dp[0] = 0;

    for (int a = 1; a &lt;= amount; a++) {
        for (int c : coins) {
            if (c &lt;= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        }
    }
    return dp[amount] &gt; amount ? -1 : dp[amount];
}
// Time O(amount x coins), space O(amount)</code></pre>
<table>
<tr><th>Family</th><th>State shape</th><th>Representatives</th></tr>
<tr><td>Linear</td><td><code>dp[i]</code></td><td>House robber, climbing stairs, LIS</td></tr>
<tr><td>Two sequences</td><td><code>dp[i][j]</code></td><td>Edit distance, LCS, regex matching</td></tr>
<tr><td>Knapsack</td><td><code>dp[i][capacity]</code></td><td>0/1 knapsack, subset sum, partition</td></tr>
<tr><td>Interval</td><td><code>dp[i][j]</code> over ranges</td><td>Matrix chain, burst balloons, palindrome partitioning</td></tr>
<tr><td>Grid</td><td><code>dp[r][c]</code></td><td>Unique paths, minimum path sum</td></tr>
<tr><td>Bitmask</td><td><code>dp[mask]</code></td><td>Travelling salesman, assignment (n ≤ ~20)</td></tr>
</table>
<pre><code>// The knapsack detail that gets asked: why does the loop direction change?
// 0/1 (each item ONCE)      -> iterate capacity DOWNWARD
for (int w = W; w &gt;= wt[i]; w--) dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
// Unbounded (item reusable) -> iterate capacity UPWARD
for (int w = wt[i]; w &lt;= W; w++) dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
// Downward guarantees dp[w - wt] is still from the PREVIOUS item row.</code></pre>
<p><strong>The interview strategy to state:</strong> "I start with brute-force recursion to establish the recurrence — even if it is exponential — then add memoisation, then convert to a table if I need the space or speed. That way I always have <em>a</em> working solution on the board, and each step is a small verifiable change rather than one leap to a bottom-up table I might get wrong."</p>`
},
{
  q: "Explain BFS vs DFS — and how do you detect a cycle in a directed graph?",
  level: "advanced", hot: true, tags: ["graphs", "traversal"],
  companies: ["Amazon", "Google", "Microsoft", "Flipkart", "Uber", "Walmart", "Oracle"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="Graph traversal order for BFS and DFS">
  <circle class="dg-fill" cx="90" cy="34" r="17"/><text class="dg-s" x="90" y="39" text-anchor="middle">A</text>
  <circle class="dg-fill" cx="46" cy="94" r="17"/><text class="dg-s" x="46" y="99" text-anchor="middle">B</text>
  <circle class="dg-fill" cx="134" cy="94" r="17"/><text class="dg-s" x="134" y="99" text-anchor="middle">C</text>
  <circle class="dg-fill" cx="24" cy="150" r="17"/><text class="dg-s" x="24" y="155" text-anchor="middle">D</text>
  <circle class="dg-fill" cx="90" cy="150" r="17"/><text class="dg-s" x="90" y="155" text-anchor="middle">E</text>
  <circle class="dg-fill" cx="156" cy="150" r="17"/><text class="dg-s" x="156" y="155" text-anchor="middle">F</text>
  <path class="dg-line" d="M80 49 L56 79 M100 49 L124 79 M40 111 L30 133 M54 111 L84 133 M140 111 L152 133"/>
  <text class="dg-t" x="250" y="52">BFS: A B C D E F</text>
  <text class="dg-s" x="250" y="74">queue — level by level, shortest path on unweighted graphs</text>
  <text class="dg-t" x="250" y="112">DFS: A B D E C F</text>
  <text class="dg-s" x="250" y="134">stack/recursion — cycles, topological sort, connected components</text>
</svg>
</figure>
<table>
<tr><th></th><th>BFS</th><th>DFS</th></tr>
<tr><td>Structure</td><td>Queue</td><td>Stack / recursion</td></tr>
<tr><td>Space</td><td>O(width) — can be huge on a wide graph</td><td>O(depth) — can stack-overflow on a deep one</td></tr>
<tr><td>Best for</td><td>Shortest path (unweighted), level order, "minimum steps"</td><td>Cycle detection, topological sort, backtracking, path existence</td></tr>
</table>
<pre><code>// Cycle detection in a DIRECTED graph: three colours.
// The key insight — a back edge to a node still ON THE RECURSION STACK is a cycle.
// An edge to an already-FINISHED node is not.

enum State { UNVISITED, IN_PROGRESS, DONE }

boolean hasCycle(List&lt;List&lt;Integer&gt;&gt; adj, int n) {
    State[] state = new State[n];
    Arrays.fill(state, State.UNVISITED);
    for (int i = 0; i &lt; n; i++)
        if (state[i] == State.UNVISITED && dfs(i, adj, state)) return true;
    return false;
}

boolean dfs(int u, List&lt;List&lt;Integer&gt;&gt; adj, State[] state) {
    state[u] = State.IN_PROGRESS;
    for (int v : adj.get(u)) {
        if (state[v] == State.IN_PROGRESS) return true;      // back edge -> CYCLE
        if (state[v] == State.UNVISITED && dfs(v, adj, state)) return true;
    }
    state[u] = State.DONE;                                    // fully explored
    return false;
}
// O(V + E) time, O(V) space</code></pre>
<pre><code>// The BFS alternative — Kahn's algorithm, which gives a topological order too
int[] indegree = new int[n];
for (var edges : adj) for (int v : edges) indegree[v]++;
Deque&lt;Integer&gt; q = new ArrayDeque&lt;&gt;();
for (int i = 0; i &lt; n; i++) if (indegree[i] == 0) q.add(i);

List&lt;Integer&gt; order = new ArrayList&lt;&gt;();
while (!q.isEmpty()) {
    int u = q.poll(); order.add(u);
    for (int v : adj.get(u)) if (--indegree[v] == 0) q.add(v);
}
return order.size() == n ? order : List.of();   // fewer than n -> a cycle exists</code></pre>
<p><strong>The distinction to state explicitly:</strong> in an <em>undirected</em> graph you do not need three states — a visited neighbour that is not your parent is a cycle. Two states plus a parent check is enough. Applying the directed algorithm to an undirected graph reports a false cycle on every single edge, which is a favourite trap.</p>
<p><strong>Where this shows up in real interviews:</strong> course schedule, build dependency order, deadlock detection, and detecting circular imports — all the same algorithm with different names.</p>`
},
{
  q: "How do you find the Kth largest element, and when do you use a heap versus sorting?",
  level: "advanced", tags: ["heap", "sorting"],
  companies: ["Amazon", "Google", "Microsoft", "Flipkart", "Goldman Sachs", "Adobe", "Salesforce"],
  a: `<table>
<tr><th>Approach</th><th>Time</th><th>Space</th><th>Use when</th></tr>
<tr><td>Sort, take index n-k</td><td>O(n log n)</td><td>O(1)</td><td>n is small, or you need the full order anyway</td></tr>
<tr><td><strong>Min-heap of size k</strong></td><td>O(n log k)</td><td>O(k)</td><td><strong>Streaming data, or k ≪ n</strong></td></tr>
<tr><td>Quickselect</td><td>O(n) average, O(n²) worst</td><td>O(1)</td><td>Whole array in memory, best average case</td></tr>
<tr><td>Counting sort</td><td>O(n + range)</td><td>O(range)</td><td>Small bounded integer range</td></tr>
</table>
<pre><code>// Min-heap of size k — the answer that generalises to a stream of a billion items
public int findKthLargest(int[] nums, int k) {
    PriorityQueue&lt;Integer&gt; heap = new PriorityQueue&lt;&gt;();   // MIN-heap
    for (int n : nums) {
        heap.offer(n);
        if (heap.size() &gt; k) heap.poll();     // evict the smallest
    }
    return heap.peek();                        // the k-th largest is at the root
}
// Counter-intuitive but correct: a MIN-heap for the k LARGEST.
// The root is the weakest survivor, so it is exactly what you evict.</code></pre>
<pre><code>// Quickselect — O(n) average by recursing into ONE side only
public int quickSelect(int[] a, int k) {
    int target = a.length - k, lo = 0, hi = a.length - 1;
    Random rnd = new Random();                 // randomise: defeats adversarial input
    while (lo &lt; hi) {
        int p = partition(a, lo, hi, lo + rnd.nextInt(hi - lo + 1));
        if      (p == target) return a[p];
        else if (p &lt;  target) lo = p + 1;      // discard the left half entirely
        else                  hi = p - 1;
    }
    return a[lo];
}
// Why O(n): n + n/2 + n/4 + ... = 2n, versus quicksort's O(n log n)
// because quicksort must recurse into BOTH halves.</code></pre>
<p><strong>The follow-ups to be ready for:</strong></p>
<ul>
<li><em>"The data does not fit in memory"</em> → the heap solution already handles it; only k elements are held. This is the real reason to prefer it.</li>
<li><em>"Top k frequent elements"</em> → count with a HashMap, then the same size-k heap on the counts; or bucket sort by frequency for O(n).</li>
<li><em>"K closest points to the origin"</em> → identical, with a max-heap on squared distance. Do not take the square root — it is monotonic, so it only costs time.</li>
<li><em>"Median of a data stream"</em> → two heaps, a max-heap for the lower half and a min-heap for the upper, kept balanced within one element.</li>
</ul>
<p><strong>The answer that lands best:</strong> "In an interview I would give the heap solution first — it is O(n log k), it is short, and it handles streams. Then I would mention quickselect as the O(n) average alternative, with the caveat that its worst case is quadratic unless the pivot is randomised, and that it mutates the input array."</p>`
}
]);
