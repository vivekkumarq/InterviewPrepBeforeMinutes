registerTopic("dsa", [
{
  q: "Explain Big-O notation and the complexity of common operations",
  level: "beginner", hot: true, tags: ["complexity"],
  a: `<p>Big-O describes how runtime or space grows as input size grows, ignoring constants and lower-order terms. It is about the <em>growth rate</em>, not the actual speed.</p>
<table>
<tr><th>Complexity</th><th>Name</th><th>Example</th><th>n = 1,000,000</th></tr>
<tr><td>O(1)</td><td>Constant</td><td>HashMap get, array index</td><td>1</td></tr>
<tr><td>O(log n)</td><td>Logarithmic</td><td>Binary search, balanced tree</td><td>~20</td></tr>
<tr><td>O(n)</td><td>Linear</td><td>Single loop, linear scan</td><td>10⁶</td></tr>
<tr><td>O(n log n)</td><td>Linearithmic</td><td>Merge sort, heap sort</td><td>2×10⁷</td></tr>
<tr><td>O(n²)</td><td>Quadratic</td><td>Nested loops, bubble sort</td><td>10¹² — too slow</td></tr>
<tr><td>O(2ⁿ)</td><td>Exponential</td><td>Naive recursive subsets</td><td>Impossible</td></tr>
</table>
<p><strong>Rules for analysing:</strong> drop constants (O(2n) → O(n)), keep the dominant term (O(n² + n) → O(n²)), sequential loops add, nested loops multiply, and a recursive call tree multiplies branching factor by depth.</p>
<p><strong>Nuances worth stating:</strong></p>
<ul>
<li><strong>Amortised</strong> complexity — <code>ArrayList.add</code> is O(1) amortised even though a resize is O(n), because resizes are rare and doubling spreads the cost.</li>
<li><strong>Space complexity counts too</strong> — including the recursion stack, which is O(n) for a linear recursion.</li>
<li><strong>Constants matter in practice.</strong> An O(n) algorithm with terrible cache locality can lose to an O(n log n) one at realistic sizes — which is why <code>ArrayList</code> beats <code>LinkedList</code> almost everywhere.</li>
</ul>`
},
{
  q: "What are the essential array and string techniques?",
  level: "beginner", hot: true, tags: ["patterns", "arrays"],
  a: `<p><strong>Two pointers</strong> — for sorted arrays, palindromes, pair sums. O(n) instead of O(n²):</p>
<pre><code>// Two sum in a SORTED array
int[] twoSum(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo &lt; hi) {
        int sum = a[lo] + a[hi];
        if (sum == target) return new int[]{lo, hi};
        if (sum &lt; target) lo++; else hi--;
    }
    return new int[]{-1, -1};
}</code></pre>
<p><strong>Sliding window</strong> — for contiguous subarray/substring problems:</p>
<pre><code>// Longest substring without repeating characters — O(n)
int lengthOfLongestSubstring(String s) {
    Map&lt;Character, Integer&gt; lastSeen = new HashMap&lt;&gt;();
    int best = 0, start = 0;
    for (int end = 0; end &lt; s.length(); end++) {
        char c = s.charAt(end);
        if (lastSeen.containsKey(c) &amp;&amp; lastSeen.get(c) &gt;= start) {
            start = lastSeen.get(c) + 1;          // shrink the window
        }
        lastSeen.put(c, end);
        best = Math.max(best, end - start + 1);
    }
    return best;
}</code></pre>
<p><strong>Hashing for O(1) lookup</strong> — the single most useful trick:</p>
<pre><code>// Two sum, UNSORTED — one pass
int[] twoSum(int[] a, int target) {
    Map&lt;Integer, Integer&gt; seen = new HashMap&lt;&gt;();
    for (int i = 0; i &lt; a.length; i++) {
        Integer j = seen.get(target - a[i]);
        if (j != null) return new int[]{j, i};
        seen.put(a[i], i);
    }
    return new int[]{-1, -1};
}</code></pre>
<p><strong>Prefix sums</strong> for range queries, <strong>Kadane's algorithm</strong> for maximum subarray, and <strong>sorting first</strong> when order unlocks a two-pointer solution round out the toolkit.</p>`
},
{
  q: "Explain and implement binary search, including its variants",
  level: "beginner", hot: true, tags: ["searching"],
  a: `<pre><code>// Standard — find an exact value in a sorted array. O(log n)
int binarySearch(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo &lt;= hi) {
        int mid = lo + (hi - lo) / 2;        // avoids integer overflow, unlike (lo+hi)/2
        if (a[mid] == target) return mid;
        if (a[mid] &lt; target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

// Leftmost insertion point (lower bound) — the more useful variant
int lowerBound(int[] a, int target) {
    int lo = 0, hi = a.length;               // note: hi = length, not length-1
    while (lo &lt; hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] &lt; target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

// Binary search on the ANSWER — the pattern interviewers really test
// "Minimum capacity to ship all packages within D days"
int shipWithinDays(int[] weights, int days) {
    int lo = Arrays.stream(weights).max().getAsInt();
    int hi = Arrays.stream(weights).sum();
    while (lo &lt; hi) {
        int mid = lo + (hi - lo) / 2;
        if (daysNeeded(weights, mid) &lt;= days) hi = mid;   // feasible: try smaller
        else lo = mid + 1;
    }
    return lo;
}</code></pre>
<p><strong>Three things that get you marks:</strong> using <code>lo + (hi - lo) / 2</code> to avoid overflow (the bug that existed in the JDK's own binary search for nine years); being precise about whether the invariant is <code>lo &lt;= hi</code> with <code>hi = length-1</code> or <code>lo &lt; hi</code> with <code>hi = length</code>; and recognising "binary search on the answer" — whenever the problem asks for a minimum or maximum value with a monotonic feasibility check, binary search applies even though there is no sorted array in sight.</p>`
},
{
  q: "Compare the common sorting algorithms",
  level: "beginner", hot: true, tags: ["sorting"],
  a: `<table>
<tr><th>Algorithm</th><th>Average</th><th>Worst</th><th>Space</th><th>Stable</th></tr>
<tr><td>Bubble / Insertion</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>Yes</td></tr>
<tr><td>Selection</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>No</td></tr>
<tr><td><strong>Merge sort</strong></td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td><strong>Yes</strong></td></tr>
<tr><td><strong>Quick sort</strong></td><td>O(n log n)</td><td><strong>O(n²)</strong></td><td>O(log n)</td><td>No</td></tr>
<tr><td>Heap sort</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>No</td></tr>
<tr><td>Counting / Radix</td><td>O(n + k)</td><td>O(n + k)</td><td>O(k)</td><td>Yes</td></tr>
</table>
<p><strong>What Java actually uses</strong> — a great thing to know:</p>
<ul>
<li><code>Arrays.sort(int[])</code> → <strong>dual-pivot quicksort</strong>. Fast, in place, and stability is irrelevant for primitives.</li>
<li><code>Arrays.sort(Object[])</code> and <code>Collections.sort</code> → <strong>TimSort</strong>, a hybrid of merge sort and insertion sort. It is <em>stable</em> (required, because objects have identity) and exploits already-sorted runs, so nearly-sorted data sorts in close to O(n).</li>
</ul>
<p><strong>Stability matters</strong> when you sort by two keys in sequence: sort by name, then by department, and a stable sort preserves the name order within each department. An unstable sort silently loses it.</p>
<p><strong>Quicksort's O(n²) worst case</strong> comes from consistently bad pivots (already-sorted input with a naive first-element pivot). Randomised or median-of-three pivots make it vanishingly unlikely — which is why it is still the default despite the worse bound.</p>`
},
{
  q: "Implement the common linked list problems",
  level: "beginner", hot: true, tags: ["linked-list"],
  a: `<pre><code>class Node { int val; Node next; }

// Reverse a linked list — iterative, O(n) time, O(1) space
Node reverse(Node head) {
    Node prev = null, curr = head;
    while (curr != null) {
        Node next = curr.next;     // save
        curr.next = prev;          // reverse the pointer
        prev = curr;               // advance
        curr = next;
    }
    return prev;
}

// Detect a cycle — Floyd's tortoise and hare, O(1) space
boolean hasCycle(Node head) {
    Node slow = head, fast = head;
    while (fast != null &amp;&amp; fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

// Find the middle node — same two-pointer idea
Node middle(Node head) {
    Node slow = head, fast = head;
    while (fast != null &amp;&amp; fast.next != null) { slow = slow.next; fast = fast.next.next; }
    return slow;
}

// Merge two sorted lists — a dummy head removes all the edge cases
Node merge(Node a, Node b) {
    Node dummy = new Node(), tail = dummy;
    while (a != null &amp;&amp; b != null) {
        if (a.val &lt;= b.val) { tail.next = a; a = a.next; }
        else                { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}</code></pre>
<p><strong>The two techniques that solve most linked-list problems:</strong> the <strong>dummy head node</strong> (removes special-casing the first element) and <strong>fast/slow pointers</strong> (middle, cycle detection, nth from end, palindrome check). Mention that finding the cycle's <em>start</em> is the follow-up: reset one pointer to the head and advance both one step at a time — they meet at the cycle entrance.</p>`
},
{
  q: "Explain tree traversals and implement them",
  level: "beginner", hot: true, tags: ["trees"],
  a: `<pre><code>// DFS — recursive. The only difference is WHERE you visit the node.
void inorder(Node n, List&lt;Integer&gt; out) {      // Left, Node, Right
    if (n == null) return;
    inorder(n.left, out); out.add(n.val); inorder(n.right, out);
}
void preorder(Node n, List&lt;Integer&gt; out)  { if(n==null) return;
    out.add(n.val); preorder(n.left,out); preorder(n.right,out); }   // Node, L, R
void postorder(Node n, List&lt;Integer&gt; out) { if(n==null) return;
    postorder(n.left,out); postorder(n.right,out); out.add(n.val); } // L, R, Node

// BFS / level order — uses a QUEUE
List&lt;List&lt;Integer&gt;&gt; levelOrder(Node root) {
    List&lt;List&lt;Integer&gt;&gt; result = new ArrayList&lt;&gt;();
    if (root == null) return result;
    Queue&lt;Node&gt; q = new ArrayDeque&lt;&gt;();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();                    // fix the level boundary
        List&lt;Integer&gt; level = new ArrayList&lt;&gt;();
        for (int i = 0; i &lt; size; i++) {
            Node n = q.poll();
            level.add(n.val);
            if (n.left != null)  q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        result.add(level);
    }
    return result;
}</code></pre>
<p><strong>When to use which:</strong></p>
<ul>
<li><strong>Inorder</strong> on a BST gives <em>sorted</em> output — that is how you validate a BST or find the kth smallest.</li>
<li><strong>Preorder</strong> for copying/serialising a tree (the root comes first, so you can rebuild top-down).</li>
<li><strong>Postorder</strong> for deleting a tree, or any computation where children must be processed first (subtree sums, heights).</li>
<li><strong>BFS</strong> for shortest path in an unweighted graph, level-by-level output, or finding the minimum depth.</li>
</ul>
<p>Iterative DFS uses an explicit <code>Deque</code> as a stack — worth knowing when recursion depth could overflow, since Java has no tail-call optimisation.</p>`
},
{
  q: "What are BFS and DFS on graphs, and when do you use each?",
  level: "advanced", hot: true, tags: ["graphs"],
  a: `<pre><code>// Adjacency list is almost always the right representation
Map&lt;Integer, List&lt;Integer&gt;&gt; graph;

// BFS — shortest path in an UNWEIGHTED graph, level by level
int shortestPath(int start, int target) {
    Queue&lt;Integer&gt; q = new ArrayDeque&lt;&gt;();
    Set&lt;Integer&gt; visited = new HashSet&lt;&gt;();
    q.offer(start); visited.add(start);
    int dist = 0;
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i &lt; size; i++) {
            int node = q.poll();
            if (node == target) return dist;
            for (int next : graph.getOrDefault(node, List.of())) {
                if (visited.add(next)) q.offer(next);   // add() returns false if present
            }
        }
        dist++;
    }
    return -1;
}

// DFS — cycle detection, connected components, topological sort
void dfs(int node, Set&lt;Integer&gt; visited) {
    if (!visited.add(node)) return;
    for (int next : graph.getOrDefault(node, List.of())) dfs(next, visited);
}</code></pre>
<table>
<tr><th></th><th>BFS</th><th>DFS</th></tr>
<tr><td>Structure</td><td>Queue</td><td>Stack (or recursion)</td></tr>
<tr><td>Finds</td><td><strong>Shortest path</strong> (unweighted)</td><td>Any path</td></tr>
<tr><td>Space</td><td>O(width) — can be huge</td><td>O(depth)</td></tr>
<tr><td>Use for</td><td>Shortest path, level order, nearest neighbour</td><td>Cycle detection, topological sort, connected components, backtracking</td></tr>
</table>
<p><strong>Both are O(V + E)</strong> with an adjacency list. For <em>weighted</em> graphs, BFS no longer gives the shortest path — you need <strong>Dijkstra</strong> (non-negative weights, a priority queue) or <strong>Bellman-Ford</strong> (handles negative weights and detects negative cycles). Mentioning that distinction unprompted is a strong signal.</p>
<p><strong>The critical implementation detail:</strong> mark nodes visited <em>when you enqueue</em>, not when you dequeue — otherwise the same node is added many times and BFS degrades badly.</p>`
},
{
  q: "What is dynamic programming and how do you recognise it?",
  level: "advanced", hot: true, tags: ["dp"],
  a: `<p>DP applies when a problem has <strong>optimal substructure</strong> (the optimal solution is built from optimal solutions of subproblems) and <strong>overlapping subproblems</strong> (the same subproblem recurs).</p>
<pre><code>// 1. Naive recursion — O(2^n), recomputes everything
int fib(int n) { return n &lt;= 1 ? n : fib(n-1) + fib(n-2); }

// 2. Memoisation (top-down) — cache results. O(n)
int fib(int n, Integer[] memo) {
    if (n &lt;= 1) return n;
    if (memo[n] != null) return memo[n];
    return memo[n] = fib(n-1, memo) + fib(n-2, memo);
}

// 3. Tabulation (bottom-up) — no recursion stack
int fib(int n) {
    int[] dp = new int[n + 1];
    dp[1] = 1;
    for (int i = 2; i &lt;= n; i++) dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}

// 4. Space-optimised — only the last two values are ever needed. O(1) space
int fib(int n) {
    int a = 0, b = 1;
    for (int i = 2; i &lt;= n; i++) { int c = a + b; a = b; b = c; }
    return n == 0 ? 0 : b;
}</code></pre>
<p><strong>How to recognise a DP problem:</strong> it asks for a maximum, minimum, or a count of ways; you can define the answer in terms of smaller versions of the same problem; and a greedy choice provably fails.</p>
<p><strong>The method to state:</strong> (1) define the state — what does <code>dp[i]</code> <em>mean</em>? (2) write the recurrence; (3) identify base cases; (4) determine the iteration order; (5) optimise space if only recent states are needed. Getting the state definition right is 80% of the work, and saying that shows you have solved these rather than memorised solutions.</p>
<p><strong>Classic patterns:</strong> 0/1 knapsack, unbounded knapsack (coin change), longest common subsequence, longest increasing subsequence, edit distance, house robber, matrix path counting, and partition problems.</p>`
},
{
  q: "Solve: find the longest substring without repeating characters",
  level: "advanced", hot: true, tags: ["practice", "sliding-window"],
  a: `<p><strong>Think aloud in this order</strong> — brute force, why it is slow, then the optimisation.</p>
<pre><code>// Brute force: check every substring — O(n^3) or O(n^2) with a set. Too slow.

// Optimal: sliding window with last-seen index. O(n) time, O(min(n, alphabet)) space.
public int lengthOfLongestSubstring(String s) {
    Map&lt;Character, Integer&gt; lastIndex = new HashMap&lt;&gt;();
    int longest = 0, windowStart = 0;

    for (int end = 0; end &lt; s.length(); end++) {
        char c = s.charAt(end);

        // If we have seen c INSIDE the current window, jump the start past it.
        Integer seen = lastIndex.get(c);
        if (seen != null &amp;&amp; seen &gt;= windowStart) {
            windowStart = seen + 1;
        }
        lastIndex.put(c, end);
        longest = Math.max(longest, end - windowStart + 1);
    }
    return longest;
}</code></pre>
<p><strong>Walk through <code>"abcabcbb"</code>:</strong> the window grows to <code>abc</code> (length 3); at index 3 we see <code>a</code> again at index 0, which is inside the window, so start jumps to 1 giving <code>bca</code>; it continues at length 3; by the end the answer is 3.</p>
<p><strong>Edge cases to mention before coding:</strong> empty string → 0; all identical characters → 1; all distinct → length. <strong>The subtle bug</strong> is the <code>seen &gt;= windowStart</code> check — without it, a character seen <em>before</em> the current window incorrectly moves the start backwards, which is the mistake most candidates make.</p>
<p>A follow-up they often ask: replace the map with an <code>int[128]</code> array for ASCII, which is faster and removes hashing entirely.</p>`
},
{
  q: "Solve: merge intervals",
  level: "advanced", hot: true, tags: ["practice", "arrays"],
  a: `<pre><code>public int[][] merge(int[][] intervals) {
    if (intervals.length &lt;= 1) return intervals;

    // 1. Sort by start — this is the whole insight
    Arrays.sort(intervals, Comparator.comparingInt(a -&gt; a[0]));

    List&lt;int[]&gt; merged = new ArrayList&lt;&gt;();
    int[] current = intervals[0];
    merged.add(current);

    for (int[] next : intervals) {
        if (next[0] &lt;= current[1]) {                  // overlap
            current[1] = Math.max(current[1], next[1]);  // extend in place
        } else {
            current = next;                            // start a new interval
            merged.add(current);
        }
    }
    return merged.toArray(new int[0][]);
}
// Time O(n log n) for the sort; space O(n) for the output.</code></pre>
<p><strong>The key insight to say out loud:</strong> once sorted by start time, any interval can only overlap the one immediately before it — so a single pass suffices. Without sorting you would need to compare every pair, O(n²).</p>
<p><strong>Edge cases:</strong> touching intervals (<code>[1,3]</code> and <code>[3,5]</code>) — decide with the interviewer whether those merge; fully contained intervals (<code>[1,10]</code> then <code>[2,3]</code>) — handled by the <code>Math.max</code>; empty input; a single interval.</p>
<p><strong>Related problems from the same family</strong>, worth naming: insert interval, non-overlapping intervals (minimum removals), meeting rooms (can one person attend all?), and meeting rooms II (minimum rooms needed — solved with a min-heap of end times, or a sweep line of +1/−1 events).</p>`
},
{
  q: "Explain HashMap, HashSet and when to use a heap or a trie",
  level: "advanced", tags: ["data-structures"],
  a: `<table>
<tr><th>Structure</th><th>Use when you need</th><th>Key operations</th></tr>
<tr><td><strong>HashMap / HashSet</strong></td><td>O(1) lookup by key; frequency counting; deduplication</td><td>get, put, contains — O(1) average</td></tr>
<tr><td><strong>TreeMap / TreeSet</strong></td><td>Sorted order, range queries, floor/ceiling</td><td>O(log n), plus <code>floorKey</code>, <code>subMap</code></td></tr>
<tr><td><strong>PriorityQueue (heap)</strong></td><td>Repeatedly get the min or max; top-K; scheduling</td><td>peek O(1), offer/poll O(log n)</td></tr>
<tr><td><strong>Deque</strong></td><td>Stack, queue, or sliding-window maximum</td><td>O(1) at both ends</td></tr>
<tr><td><strong>Trie</strong></td><td>Prefix search, autocomplete, word dictionaries</td><td>O(length), not O(n)</td></tr>
<tr><td><strong>Union-Find</strong></td><td>Connectivity, cycle detection in undirected graphs, Kruskal's MST</td><td>Near O(1) amortised</td></tr>
</table>
<pre><code>// Top K frequent elements — heap keeps it O(n log k) instead of O(n log n)
public int[] topKFrequent(int[] nums, int k) {
    Map&lt;Integer, Integer&gt; freq = new HashMap&lt;&gt;();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    PriorityQueue&lt;Integer&gt; heap =                 // MIN-heap of size k
        new PriorityQueue&lt;&gt;(Comparator.comparingInt(freq::get));

    for (int key : freq.keySet()) {
        heap.offer(key);
        if (heap.size() &gt; k) heap.poll();          // evict the least frequent
    }
    return heap.stream().mapToInt(i -&gt; i).toArray();
}</code></pre>
<p><strong>The counter-intuitive detail worth explaining:</strong> for "top K largest" you use a <strong>min-heap</strong> of size K, not a max-heap. The heap's root is the smallest of your current best K, so it is exactly the element to evict when a better one arrives. Getting this backwards is a very common interview slip.</p>`
},
{
  q: "How do you approach a coding problem in an interview?",
  level: "beginner", hot: true, tags: ["process", "strategy"],
  a: `<ol>
<li><strong>Restate and clarify (2 min).</strong> Repeat the problem in your own words. Ask about input size, types, duplicates, negatives, empty input, and whether the input is sorted. <em>Interviewers deliberately leave problems underspecified to see if you ask.</em></li>
<li><strong>Work through an example by hand.</strong> Small input, on the whiteboard. This often reveals the pattern and always reveals misunderstandings.</li>
<li><strong>State the brute force first.</strong> "The naive approach checks every pair, which is O(n²)." This gives you a working baseline and shows you can reason about complexity.</li>
<li><strong>Optimise out loud.</strong> "The repeated work is looking up whether we have seen a value — a hash set makes that O(1), bringing it to O(n)." <em>Explaining why you are optimising matters more than arriving at the answer.</em></li>
<li><strong>Agree on the approach before coding.</strong> "I will use a sliding window with a map of last-seen indices — does that sound right?" This prevents twenty minutes down the wrong path.</li>
<li><strong>Write clean code.</strong> Meaningful names, small helpers, no clever one-liners. Say what each part does as you write it.</li>
<li><strong>Trace through your code</strong> with the example. Do not say "it works" — demonstrate it.</li>
<li><strong>Discuss complexity and edge cases</strong> unprompted: time, space, empty input, single element, overflow, all duplicates.</li>
<li><strong>Mention improvements</strong> you would make with more time.</li>
</ol>
<blockquote><p><strong>The most important habit: think out loud.</strong> A silent candidate who solves the problem often scores lower than one who narrates a partial solution clearly. The interviewer is assessing how you would work with them on a real problem, and they cannot assess silence.</p></blockquote>`
},
{
  q: "Solve: validate a binary search tree and find the kth smallest element",
  level: "advanced", tags: ["practice", "trees"],
  a: `<pre><code>// Validate a BST — the trap is comparing only against the immediate parent
public boolean isValidBST(TreeNode root) {
    return validate(root, null, null);
}
private boolean validate(TreeNode node, Integer min, Integer max) {
    if (node == null) return true;
    if (min != null &amp;&amp; node.val &lt;= min) return false;
    if (max != null &amp;&amp; node.val &gt;= max) return false;
    return validate(node.left,  min, node.val)      // tighten the upper bound
        &amp;&amp; validate(node.right, node.val, max);     // tighten the lower bound
}</code></pre>
<p><strong>Why the naive version fails:</strong> checking only <code>left &lt; node &lt; right</code> at each node accepts this invalid tree — 6 is in the left subtree of 10, so it must be less than 10, but a local check never notices:</p>
<pre><code>        10
       /  \\
      5    15
          /  \\
         6    20        &lt;-- 6 &lt; 15 locally, but violates the BST property globally</code></pre>
<pre><code>// Kth smallest — inorder traversal of a BST is sorted, so stop at k
public int kthSmallest(TreeNode root, int k) {
    Deque&lt;TreeNode&gt; stack = new ArrayDeque&lt;&gt;();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) { stack.push(curr); curr = curr.left; }
        curr = stack.pop();
        if (--k == 0) return curr.val;              // early exit — O(H + k), not O(n)
        curr = curr.right;
    }
    throw new IllegalArgumentException("k larger than tree size");
}</code></pre>
<p><strong>Follow-up they often ask:</strong> "What if kthSmallest is called frequently on a changing tree?" Answer: augment each node with the size of its left subtree, which makes each query O(log n) — a good opportunity to show you think about the access pattern, not just the single call.</p>`
},
{
  q: "What are the most-asked coding problems you should be able to write from memory?",
  level: "beginner", hot: true, tags: ["practice", "checklist"],
  a: `<p><strong>Arrays and strings</strong></p>
<ul>
<li>Two Sum (hash map), Three Sum (sort + two pointers)</li>
<li>Best Time to Buy and Sell Stock (track running minimum)</li>
<li>Maximum Subarray (Kadane's)</li>
<li>Longest Substring Without Repeating Characters (sliding window)</li>
<li>Product of Array Except Self (prefix/suffix products, no division)</li>
<li>Valid Anagram, Group Anagrams, Valid Palindrome</li>
<li>Merge Intervals, Insert Interval</li>
<li>Rotate Array / Rotate Matrix in place</li>
<li>Move Zeroes, Container With Most Water</li>
</ul>
<p><strong>Linked lists</strong> — reverse, detect cycle, merge two sorted, remove nth from end, find the middle.</p>
<p><strong>Trees</strong> — all four traversals, maximum depth, validate BST, lowest common ancestor, level order, invert, diameter, serialise/deserialise.</p>
<p><strong>Graphs</strong> — number of islands, clone graph, course schedule (topological sort/cycle detection), word ladder (BFS).</p>
<p><strong>Dynamic programming</strong> — climbing stairs, coin change, longest increasing subsequence, house robber, edit distance, 0/1 knapsack, longest common subsequence.</p>
<p><strong>Stack/heap/design</strong> — valid parentheses, min stack, top K frequent, merge K sorted lists, LRU cache (<code>LinkedHashMap</code> or map + doubly linked list), implement a trie.</p>
<blockquote><p><strong>Advice:</strong> aim for <em>patterns</em>, not problem counts. Two pointers, sliding window, hashing, BFS/DFS, binary search on the answer, heap for top-K, and DP state design cover the overwhelming majority of interview questions. Fifty problems solved deeply beats three hundred skimmed.</p></blockquote>`
}
]);
