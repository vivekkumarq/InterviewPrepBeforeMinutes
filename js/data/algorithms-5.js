registerPrimer("algorithms", `<h3>The mental model: the input size tells you which algorithm to look for</h3>
<p>Big-O describes how the work grows as the input grows. The practical use in an interview is backwards: <strong>read the constraints first</strong>, and they tell you roughly which complexity the intended solution has. A typical judge or service does on the order of 10<sup>8</sup> simple operations per second, so an input of 10<sup>5</sup> rules out O(n²) (10<sup>10</sup> steps) before you write a line.</p>
<figure class="fig">
<svg viewBox="0 0 620 230" role="img" aria-label="Growth of common complexities: constant, log n, n, n log n, n squared and 2 to the n, plotted against input size">
  <line class="dg-line" x1="50" y1="200" x2="600" y2="200"/>
  <line class="dg-line" x1="50" y1="200" x2="50" y2="14"/>
  <text class="dg-s" x="560" y="218">input size n</text>
  <text class="dg-s" x="56" y="24">operations</text>
  <path class="dg-line" d="M50 196 H590"/><text class="dg-m" x="530" y="192">O(1)</text>
  <path class="dg-line" d="M50 200 C120 186 300 182 590 178"/><text class="dg-m" x="520" y="172">O(log n)</text>
  <path class="dg-line" d="M50 200 L590 140"/><text class="dg-m" x="540" y="136">O(n)</text>
  <path class="dg-line" d="M50 200 C200 170 400 120 590 90"/><text class="dg-m" x="508" y="96">O(n log n)</text>
  <path class="dg-line" d="M50 200 C200 190 300 120 380 14"/><text class="dg-m" x="386" y="30">O(n²)</text>
  <path class="dg-line" d="M50 200 C140 198 180 150 200 14"/><text class="dg-m" x="206" y="30">O(2ⁿ)</text>
</svg>
<figcaption>For small n everything is fast. The shape of the curve only matters once n is large, which is exactly what the constraints tell you.</figcaption>
</figure>
<h3>Worked example: reading the constraints</h3>
<pre><code>"Given an array of up to 100,000 integers, count the pairs (i, j) with
 i &lt; j and a[i] &gt; a[j]."

n = 10^5
  O(n²)      = 10^10 steps  -&gt; roughly 100 seconds. Too slow.
  O(n log n) ≈ 1.7 × 10^6   -&gt; a few milliseconds.  This is the target.

So the question is really: "which O(n log n) technique counts pairs?"
Sorting-based ones are the natural suspects -&gt; merge sort can count
these "inversions" while it merges (see the question below).</code></pre>
<table>
<tr><th>n up to about</th><th>Intended complexity</th><th>Typical technique</th></tr>
<tr><td>10 to 12</td><td>O(n!)</td><td>All permutations</td></tr>
<tr><td>20 to 25</td><td>O(2ⁿ)</td><td>Subsets, bitmask DP, backtracking</td></tr>
<tr><td>100 to 500</td><td>O(n³)</td><td>Triple loops, interval DP, Floyd-Warshall</td></tr>
<tr><td>1,000 to 5,000</td><td>O(n²)</td><td>2D DP, all pairs</td></tr>
<tr><td>10<sup>5</sup> to 10<sup>6</sup></td><td>O(n log n)</td><td>Sorting, heaps, binary search, divide and conquer</td></tr>
<tr><td>10<sup>7</sup> and beyond</td><td>O(n) or O(log n)</td><td>One pass, hashing, two pointers, math</td></tr>
</table>
<h3>The algorithm families, in one line each</h3>
<table>
<tr><th>Family</th><th>Idea</th></tr>
<tr><td>Divide and conquer</td><td>Split, solve halves, combine (merge sort, quicksort)</td></tr>
<tr><td>Binary search</td><td>Discard half of the remaining candidates each step</td></tr>
<tr><td>Greedy</td><td>Take the best local choice, never undo it</td></tr>
<tr><td>Dynamic programming</td><td>Store answers to overlapping subproblems</td></tr>
<tr><td>Backtracking</td><td>Build a solution step by step, undo when a branch cannot work</td></tr>
<tr><td>Graph search</td><td>BFS, DFS, Dijkstra: explore without revisiting</td></tr>
</table>`);

appendTopic("algorithms", [
{
  q: "Count inversions in an array with a modified merge sort",
  level: "advanced", hot: true, tags: ["divide-and-conquer", "merge-sort", "counting", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Goldman Sachs", "Adobe", "Samsung", "Flipkart"],
  a: `<div class="cx"><b>O(n log n) time</b><span>merge sort's recurrence</span><b>O(n) space</b><span>the merge buffer</span></div>
<p>An <strong>inversion</strong> is a pair <code>i &lt; j</code> with <code>a[i] &gt; a[j]</code>: two elements in the wrong order. <code>[2, 4, 1, 3, 5]</code> has 3: (2,1), (4,1), (4,3). The count measures how far an array is from sorted; it is used to compare rankings (how similar are two users' movie orderings?).</p>
<p><strong>Checking every pair is O(n²).</strong> The O(n log n) solution piggybacks on merge sort. Split the array in half: every inversion is either inside the left half, inside the right half, or <em>across</em> the halves. The first two are counted recursively. The cross ones are counted during the merge, cheaply, because both halves are sorted by then.</p>
<pre><code>Merging left = [2, 4] and right = [1, 3, 5]  (both sorted)

compare 2 vs 1: 1 is smaller, so 1 comes from the RIGHT.
  Every element still waiting in the LEFT (2 and 4) is bigger than 1
  and was before it in the array: that is 2 inversions in one step.
compare 2 vs 3: 2 from the left, no inversions.
compare 4 vs 3: 3 from the right. Left still has 1 element (4): +1.
compare 4 vs 5: 4 from the left.  Then 5.
Cross inversions = 3</code></pre>
<pre><code>static long countInversions(int[] a) {
    return sortCount(a, new int[a.length], 0, a.length - 1);
}

static long sortCount(int[] a, int[] tmp, int lo, int hi) {
    if (lo &gt;= hi) return 0;
    int mid = lo + (hi - lo) / 2;
    long count = sortCount(a, tmp, lo, mid) + sortCount(a, tmp, mid + 1, hi);

    int i = lo, j = mid + 1, k = lo;
    while (i &lt;= mid &amp;&amp; j &lt;= hi) {
        if (a[i] &lt;= a[j]) {
            tmp[k++] = a[i++];                 // &lt;= : equal values are NOT inversions
        } else {
            tmp[k++] = a[j++];
            count += mid - i + 1;              // every remaining left element
        }                                      // is greater than a[j-1]
    }
    while (i &lt;= mid) tmp[k++] = a[i++];
    while (j &lt;= hi)  tmp[k++] = a[j++];
    System.arraycopy(tmp, lo, a, lo, hi - lo + 1);
    return count;
}
// countInversions(new int[]{2, 4, 1, 3, 5}) == 3
// Note: this sorts the input. Pass a copy if the caller needs the original.</code></pre>
<table>
<tr><th>Detail</th><th>Why</th></tr>
<tr><td><code>long</code> for the count</td><td>A reversed array of 10<sup>5</sup> elements has about 5 × 10<sup>9</sup> inversions, more than an int holds</td></tr>
<tr><td><code>&lt;=</code> in the comparison</td><td>Equal elements are not inversions; <code>&lt;</code> would over-count them</td></tr>
<tr><td><code>mid - i + 1</code></td><td>The left half is sorted, so if <code>a[i]</code> beats <code>a[j]</code>, everything after <code>a[i]</code> in the left half does too</td></tr>
<tr><td>One shared <code>tmp</code> buffer</td><td>Avoids allocating new arrays at every level</td></tr>
</table>
<p><strong>The broader lesson:</strong> "count pairs with some order property" often means "sort, and count while merging". The same shape solves "count of smaller numbers after self" and "reverse pairs" (<code>a[i] &gt; 2 · a[j]</code>). A Fenwick tree over compressed values is the other standard O(n log n) approach, and is worth naming as an alternative.</p>`
},
{
  q: "Convert a recursive DFS into an iterative one with an explicit stack, and say when you would",
  level: "advanced", tags: ["recursion", "stack", "dfs", "stack-overflow"],
  companies: ["Google", "Amazon", "Microsoft", "Oracle", "Goldman Sachs", "Adobe"],
  a: `<div class="cx"><b>Same O(n) time</b><span>as the recursive version</span><b>O(n) heap space</b><span>instead of O(n) call-stack space</span></div>
<p>Every recursive algorithm uses the <strong>call stack</strong> to remember where it was. You can always replace it with a stack data structure that you manage yourself. The main reason to do it: Java's call stack is small (typically a few thousand to tens of thousands of frames by default), while a <code>Deque</code> on the heap can hold millions of entries. A recursive DFS on a 100,000-node path graph, or a very unbalanced tree, throws <code>StackOverflowError</code>.</p>
<pre><code>// Recursive pre-order traversal
static void preorder(TreeNode n, List&lt;Integer&gt; out) {
    if (n == null) return;
    out.add(n.val);
    preorder(n.left, out);
    preorder(n.right, out);
}

// Iterative: push what the recursion would visit LATER
static List&lt;Integer&gt; preorderIter(TreeNode root) {
    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    Deque&lt;TreeNode&gt; stack = new ArrayDeque&lt;&gt;();
    if (root != null) stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode n = stack.pop();
        out.add(n.val);
        if (n.right != null) stack.push(n.right);   // RIGHT first, so that
        if (n.left != null) stack.push(n.left);     // LEFT is popped first
    }
    return out;
}</code></pre>
<p><strong>Graphs work the same way.</strong> One subtle difference: the recursive version marks a node visited when it <em>enters</em> it; with an explicit stack you should mark it when you <em>pop</em> it, or you may visit neighbours in a different order.</p>
<pre><code>static List&lt;Integer&gt; dfs(List&lt;List&lt;Integer&gt;&gt; adj, int start) {
    boolean[] seen = new boolean[adj.size()];
    List&lt;Integer&gt; order = new ArrayList&lt;&gt;();
    Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();
    stack.push(start);
    while (!stack.isEmpty()) {
        int u = stack.pop();
        if (seen[u]) continue;              // a node can be pushed more than once
        seen[u] = true;
        order.add(u);
        List&lt;Integer&gt; next = adj.get(u);
        for (int k = next.size() - 1; k &gt;= 0; k--)       // reverse, to match the
            if (!seen[next.get(k)]) stack.push(next.get(k));   // recursive order
    }
    return order;
}</code></pre>
<p><strong>The hard case: post-order</strong>, where work happens <em>after</em> the children return (heights, topological sort, freeing memory). The explicit stack must remember whether a node's children are done. The cleanest trick is to push each node twice, with a flag:</p>
<pre><code>static List&lt;Integer&gt; postorderIter(TreeNode root) {
    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    Deque&lt;Object[]&gt; stack = new ArrayDeque&lt;&gt;();
    if (root != null) stack.push(new Object[]{root, false});
    while (!stack.isEmpty()) {
        Object[] top = stack.pop();
        TreeNode n = (TreeNode) top[0];
        if ((boolean) top[1]) { out.add(n.val); continue; }   // children done: visit
        stack.push(new Object[]{n, true});                     // come back later
        if (n.right != null) stack.push(new Object[]{n.right, false});
        if (n.left != null) stack.push(new Object[]{n.left, false});
    }
    return out;
}</code></pre>
<table>
<tr><th>Keep it recursive when</th><th>Go iterative when</th></tr>
<tr><td>Depth is bounded and small (balanced trees: ~log n)</td><td>Depth can reach n: linked structures, path graphs, skewed trees</td></tr>
<tr><td>Clarity matters most (most interviews)</td><td>Production code on untrusted or very large input</td></tr>
<tr><td>The logic needs post-processing on return (DP on trees)</td><td>Simple pre-order or level-order work</td></tr>
</table>
<p><strong>Other options worth naming:</strong> <code>-Xss</code> raises the thread stack size (a workaround, not a fix), running the recursion in a <code>new Thread(null, task, "dfs", 256 &lt;&lt; 20)</code> gives that one thread a bigger stack, and Java does <em>not</em> do tail-call elimination, so rewriting as tail recursion does not help.</p>`
}
]);
