registerPrimer("algorithms", `<p class="pr-lead">An <b>algorithm</b> is a step-by-step method for solving a problem. For the same problem there are often several algorithms, and some are enormously faster than others on large inputs. <b>Big O notation</b> is the common language for comparing them: it describes how the amount of work grows as the input gets bigger.</p>
<div class="pr-analogy"><b>Think of it like this</b>Looking for a name in a phone book with a million names: reading every page from the start could take a million checks (<b>O(n)</b>). Opening the book in the middle, deciding which half the name is in, and repeating takes only about 20 checks (<b>O(log n)</b>). Comparing every name with every other name would take a trillion steps (<b>O(n²)</b>). Same book, very different amounts of work.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Big O</dt><dd>How the running time (or memory) grows as the input size <code>n</code> grows, ignoring small details.</dd>
<dt>O(1), O(log n), O(n)</dt><dd>Constant (same work whatever the size), logarithmic (grows very slowly), linear (grows in step with the input).</dd>
<dt>O(n log n), O(n²)</dt><dd>Typical of good sorting, and of checking every pair, which is too slow for large inputs.</dd>
<dt>Space complexity</dt><dd>How much extra memory an algorithm needs as the input grows.</dd>
<dt>Divide and conquer</dt><dd>Split the problem into halves, solve each, then combine, as in merge sort.</dd>
<dt>Backtracking</dt><dd>Build a solution step by step, and undo a step as soon as it cannot lead to an answer.</dd>
</dl>

<h3>Step by step: how fast does it need to be?</h3>
<p>A computer does very roughly 100 million simple steps per second. So the input size in the question tells you what speed the intended solution has:</p>
<ol class="pr-steps">
<li><b>n up to about 20:</b> trying every subset (O(2ⁿ)) is fine, so backtracking is likely expected.</li>
<li><b>n up to about 500:</b> three nested loops (O(n³)) are fine.</li>
<li><b>n up to about 5,000:</b> two nested loops (O(n²)) are fine.</li>
<li><b>n around 100,000 to 1,000,000:</b> you need O(n log n): sorting, heaps, binary search or divide and conquer.</li>
<li><b>Larger than that:</b> you need O(n) or better: one pass, hashing or two pointers.</li>
</ol>
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

<h3>A worked example: binary search</h3>
<pre><code>// Find target in a SORTED array; return its index, or -1.
static int binarySearch(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo &lt;= hi) {
        int mid = lo + (hi - lo) / 2;      // middle, written this way to avoid overflow
        if (a[mid] == target) return mid;  // found it
        if (a[mid] &lt; target) lo = mid + 1; // target must be in the right half
        else hi = mid - 1;                 // target must be in the left half
    }
    return -1;                             // not present
}
// a = [2, 5, 8, 12, 16, 23, 38], target = 23</code></pre>
<ol class="pr-steps">
<li>lo = 0, hi = 6, so mid = 3. a[3] = 12, which is less than 23, so the target must be to the right: lo = 4.</li>
<li>lo = 4, hi = 6, so mid = 5. a[5] = 23: found at index 5.</li>
<li>Each step throws away half of what is left, so a million items need only about 20 steps: O(log n).</li>
<li><code>lo + (hi - lo) / 2</code> gives the same middle as <code>(lo + hi) / 2</code>, but cannot overflow when lo and hi are very large.</li>
<li>It only works on <b>sorted</b> data, because that is what lets one comparison rule out half the array.</li>
</ol>

<h3>The main families of algorithms</h3>
<ul>
<li><b>Divide and conquer:</b> split, solve the halves, combine (merge sort, quicksort).</li>
<li><b>Binary search:</b> discard half of the remaining possibilities at each step.</li>
<li><b>Greedy:</b> take the best choice now and never undo it.</li>
<li><b>Dynamic programming:</b> store answers to repeated subproblems.</li>
<li><b>Backtracking:</b> try choices step by step, undoing dead ends.</li>
<li><b>Graph search:</b> BFS, DFS and Dijkstra explore connected data without revisiting.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Ignoring the input size</p>
<p>Writing a neat O(n²) solution for an input of a million items: it would take hours.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> read the constraints first and aim for the complexity they allow.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Off-by-one errors in binary search</p>
<p>Mixing up <code>&lt;</code> and <code>&lt;=</code>, or <code>mid</code> and <code>mid + 1</code>, causes infinite loops or missed answers.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> stick to one template and test it on arrays of size 0, 1 and 2.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting space complexity</p>
<p>A fast solution that copies the input many times, or recurses very deeply, can run out of memory.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> state both time and space complexity, including recursion depth.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Big O describes how work grows with input size.</li>
<li>Read the constraints: they tell you which complexity is expected.</li>
<li>Binary search halves the problem each step, but needs sorted data.</li>
<li>Know the main families: divide and conquer, greedy, DP, backtracking, graph search.</li>
<li>Always state both time and space complexity.</li>
</ul>
<p><b>Next:</b> the questions below cover complexity analysis, sorting, binary search, string matching, bit tricks and more.</p>`);

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
