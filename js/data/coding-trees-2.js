appendTopic("coding-trees", [
{
  q: "Path sum problems and the prefix-sum-on-a-tree trick",
  level: "advanced", hot: true, tags: ["trees", "dfs", "prefix-sum", "recursion"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart"],
  a: `<pre><code>// PATH SUM I — does any ROOT-TO-LEAF path add to the target?
public boolean hasPathSum(TreeNode n, int target) {
    if (n == null) return false;
    if (n.left == null &amp;&amp; n.right == null) return target == n.val;   // LEAF check
    return hasPathSum(n.left, target - n.val)
        || hasPathSum(n.right, target - n.val);
}
// The leaf check matters: "root-to-leaf" means a node with NO children.
// Returning true at n == null lets a single-child node fake a leaf.

// PATH SUM II — collect every such path
private void dfs(TreeNode n, int target, List&lt;Integer&gt; path, List&lt;List&lt;Integer&gt;&gt; out) {
    if (n == null) return;
    path.add(n.val);
    if (n.left == null &amp;&amp; n.right == null &amp;&amp; target == n.val) {
        out.add(new ArrayList&lt;&gt;(path));        // COPY — path keeps mutating
    }
    dfs(n.left,  target - n.val, path, out);
    dfs(n.right, target - n.val, path, out);
    path.remove(path.size() - 1);              // backtrack
}</code></pre>
<div class="cx"><b>Path Sum III: O(n)</b><span>with prefix sums</span><b>Naive: O(n²)</b><span>DFS from every node</span></div>
<pre><code>// PATH SUM III — count paths summing to target, starting and ending ANYWHERE
// (downward only). This is the prefix-sum-on-an-array trick, on a tree.
private int count = 0;
private final Map&lt;Long, Integer&gt; prefix = new HashMap&lt;&gt;();

public int pathSum(TreeNode root, int target) {
    prefix.put(0L, 1);                 // the empty prefix — a path from the root
    dfs(root, 0L, target);
    return count;
}
private void dfs(TreeNode n, long running, int target) {
    if (n == null) return;
    running += n.val;

    count += prefix.getOrDefault(running - target, 0);   // any earlier prefix
                                                          // that completes a path
    prefix.merge(running, 1, Integer::sum);
    dfs(n.left, running, target);
    dfs(n.right, running, target);
    prefix.merge(running, -1, Integer::sum);   // BACKTRACK — this prefix only
}                                               // exists on the current root path</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Running prefix sums along a root to node path">
  <circle class="dg-fill" cx="60" cy="40" r="18"/><text class="dg-t" x="60" y="45" text-anchor="middle">5</text>
  <circle class="dg-fill" cx="160" cy="40" r="18"/><text class="dg-t" x="160" y="45" text-anchor="middle">3</text>
  <circle class="dg-fill2" cx="260" cy="40" r="18"/><text class="dg-t" x="260" y="45" text-anchor="middle">2</text>
  <path class="dg-line" d="M80 40 H138 M180 40 H238" marker-end="url(#pt2)"/>
  <text class="dg-s" x="16" y="84">prefix:   5      8      10</text>
  <text class="dg-s" x="16" y="112">target 5 → at prefix 10, look for 10 − 5 = 5. Seen once → one path (3+2).</text>
  <text class="dg-s" x="330" y="40">the map holds only the</text>
  <text class="dg-s" x="330" y="60">CURRENT root-to-node path</text>
  <defs><marker id="pt2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The backtracking line is the whole problem.</strong> Without <code>prefix.merge(running, -1, ...)</code> on the way out, a prefix from the left subtree is still in the map while you walk the right subtree — and you count paths that jump across the tree and do not exist. Removing it is what keeps the map scoped to the current root-to-node path.</p>
<p><strong>Use <code>long</code> for the running sum:</strong> node values can be negative and the path can be long, so an <code>int</code> accumulator can overflow. It is the kind of detail interviewers add to the constraints precisely to see whether you notice.</p>`
},
{
  q: "Balanced trees, tries and when a BST is the wrong choice",
  level: "advanced", tags: ["trees", "bst", "data-structures", "complexity"],
  companies: ["Amazon", "Google", "Microsoft", "Oracle", "Adobe", "Goldman Sachs", "SAP"],
  a: `<p><strong>The problem with a plain BST:</strong> insert sorted data and it degenerates into a linked list — O(n) per operation, not O(log n). Self-balancing trees exist to prevent exactly that.</p>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="A degenerate BST from sorted input versus a balanced one">
  <text class="dg-s" x="16" y="20">insert 1,2,3,4 into a plain BST</text>
  <circle class="dg-fill" cx="46" cy="36" r="14"/><text class="dg-t" x="46" y="41" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="80" cy="66" r="14"/><text class="dg-t" x="80" y="71" text-anchor="middle">2</text>
  <circle class="dg-fill" cx="114" cy="96" r="14"/><text class="dg-t" x="114" y="101" text-anchor="middle">3</text>
  <circle class="dg-fill" cx="148" cy="126" r="14"/><text class="dg-t" x="148" y="131" text-anchor="middle">4</text>
  <path class="dg-line" d="M56 47 L70 55 M90 77 L104 85 M124 107 L138 115"/>
  <text class="dg-s" x="190" y="80">a linked list — O(n)</text>
  <text class="dg-s" x="380" y="20">balanced</text>
  <circle class="dg-fill2" cx="470" cy="40" r="14"/><text class="dg-t" x="470" y="45" text-anchor="middle">2</text>
  <circle class="dg-fill2" cx="430" cy="86" r="14"/><text class="dg-t" x="430" y="91" text-anchor="middle">1</text>
  <circle class="dg-fill2" cx="510" cy="86" r="14"/><text class="dg-t" x="510" y="91" text-anchor="middle">3</text>
  <circle class="dg-fill2" cx="546" cy="126" r="14"/><text class="dg-t" x="546" y="131" text-anchor="middle">4</text>
  <path class="dg-line" d="M459 51 L441 75 M481 51 L499 75 M520 97 L536 115"/>
  <text class="dg-s" x="380" y="130">O(log n)</text>
</svg>
</figure>
<table>
<tr><th>Structure</th><th>Balance rule</th><th>Used by</th></tr>
<tr><td><strong>Red-black</strong></td><td>Loosely balanced; fewer rotations on write</td><td><code>TreeMap</code>, <code>HashMap</code> buckets, Linux scheduler</td></tr>
<tr><td>AVL</td><td>Strictly balanced; faster reads, more rotations</td><td>Read-heavy in-memory indexes</td></tr>
<tr><td><strong>B-tree / B+tree</strong></td><td>High fan-out, shallow</td><td><strong>Database and filesystem indexes</strong></td></tr>
<tr><td>Trie</td><td>Not a BST — one node per character</td><td>Autocomplete, routing tables</td></tr>
<tr><td>Segment / Fenwick tree</td><td>Range queries with updates</td><td>Competitive programming, analytics</td></tr>
</table>
<p><strong>Why databases use B+trees rather than red-black trees:</strong> the cost is <em>disk reads</em>, not comparisons. A B+tree node holds hundreds of keys and fills one page, so a billion rows sit three or four levels deep — three or four reads. A binary tree of a billion rows is thirty levels deep, and each level is potentially a separate random read. Same asymptotic complexity, wildly different real cost.</p>
<table>
<tr><th>Need</th><th>Use</th><th>Not</th></tr>
<tr><td>Key lookup only</td><td><strong>Hash map</strong> — O(1)</td><td>A tree; you are paying for ordering you never use</td></tr>
<tr><td>Ordered iteration, range queries, floor/ceiling</td><td><code>TreeMap</code></td><td>A hash map — it cannot do these at all</td></tr>
<tr><td>Prefix search</td><td><strong>Trie</strong> — O(L)</td><td>A tree of whole strings</td></tr>
<tr><td>Always the min or max</td><td>Heap — O(1) peek</td><td>A BST; it does more than you need</td></tr>
<tr><td>Huge dataset, disk-backed</td><td>B+tree</td><td>Any binary tree</td></tr>
</table>
<pre><code>// What TreeMap gives you that HashMap cannot — this is the practical reason
// to reach for it, and it comes up more often than the balancing details
map.firstKey(); map.lastKey();
map.floorKey(x);      // greatest key <= x
map.ceilingKey(x);    // smallest key >= x
map.headMap(x); map.tailMap(x); map.subMap(a, b);
map.descendingMap();
// "Find the booking closest to this time" is a floorKey/ceilingKey question,
// and it is O(log n) rather than a full scan.</code></pre>
<p><strong>What to say if asked to implement AVL rotations:</strong> describe the four cases — left-left and right-right need a single rotation, left-right and right-left need a double — and be honest that in production you use <code>TreeMap</code>. Knowing <em>why</em> balancing exists matters more than reciting the rotation code.</p>`
}
]);
