appendTopic("coding-trees", [
{
  q: "Which traversal do you pick, and why does in-order matter for a BST?",
  level: "beginner", hot: true, tags: ["trees", "traversal", "bst", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "TCS", "Infosys", "Flipkart", "Oracle"],
  a: `<table>
<tr><th>Traversal</th><th>Order</th><th>Use it for</th></tr>
<tr><td><strong>In-order</strong></td><td>Left, <b>Node</b>, Right</td><td><strong>BST → sorted output.</strong> Validation, k-th smallest, BST-to-list</td></tr>
<tr><td><strong>Pre-order</strong></td><td><b>Node</b>, Left, Right</td><td>Copying a tree, serialisation, prefix expressions</td></tr>
<tr><td><strong>Post-order</strong></td><td>Left, Right, <b>Node</b></td><td><strong>Anything needing children's results first</strong> — height, diameter, deletion</td></tr>
<tr><td><strong>Level-order</strong></td><td>BFS by depth</td><td>Right side view, zigzag, minimum depth, level averages</td></tr>
</table>
<p><strong>The decision rule:</strong> does the node's answer depend on its children's answers? Then it is post-order — compute below, combine above. Almost every "return a value up the tree" problem is post-order, even when nobody says the word.</p>
<pre><code>// VALIDATE A BST — the bug everyone writes first
boolean bad(TreeNode n) {                    // WRONG
    return n.left.val &lt; n.val &amp;&amp; n.right.val &gt; n.val;   // only checks NEIGHBOURS
}
//        10
//       /  \
//      5    15
//          /  \
//         6    20      <- 6 < 15 locally, but it is in the RIGHT subtree of 10
//                         and 6 < 10. Not a BST. The local check passes.

// CORRECT — carry the allowed range down
boolean isBST(TreeNode n, long min, long max) {
    if (n == null) return true;
    if (n.val &lt;= min || n.val &gt;= max) return false;
    return isBST(n.left, min, n.val) &amp;&amp; isBST(n.right, n.val, max);
}
isBST(root, Long.MIN_VALUE, Long.MAX_VALUE);
// long, not int: a node holding Integer.MIN_VALUE breaks the int version.

// Or: in-order traverse and assert strictly increasing. Same thing, and it is
// why in-order is THE traversal for a BST.</code></pre>
<pre><code>// ITERATIVE IN-ORDER — asked when the interviewer says "now without recursion"
Deque&lt;TreeNode&gt; st = new ArrayDeque&lt;&gt;();
TreeNode cur = root;
while (cur != null || !st.isEmpty()) {
    while (cur != null) { st.push(cur); cur = cur.left; }   // run left, stacking
    cur = st.pop();
    visit(cur);                                             // node
    cur = cur.right;                                        // then right
}
// MORRIS traversal does the same in O(1) space by temporarily threading each
// node's rightmost predecessor back to it, then undoing the link. Worth naming
// as "there is an O(1)-space version" even if you write the stack one.</code></pre>
<table>
<tr><th>Problem</th><th>Traversal</th></tr>
<tr><td>Height / maximum depth</td><td>Post-order — <code>1 + max(left, right)</code></td></tr>
<tr><td>Diameter</td><td>Post-order, returning height while updating a global best</td></tr>
<tr><td>Balanced tree check</td><td>Post-order returning −1 as the "unbalanced" sentinel</td></tr>
<tr><td>Lowest common ancestor</td><td>Post-order — the node where both sides return non-null</td></tr>
<tr><td>K-th smallest in a BST</td><td>In-order with a counter, stop early</td></tr>
<tr><td>Serialise / deserialise</td><td>Pre-order with explicit null markers</td></tr>
<tr><td>Right side view</td><td>Level-order, last node of each level</td></tr>
<tr><td>Path sum / root-to-leaf paths</td><td>Pre-order with backtracking</td></tr>
</table>
<p><strong>Complexity across all of them:</strong> O(n) time — every node is visited once. Space is O(h): O(log n) balanced, O(n) skewed. That <em>h</em>, not <em>n</em>, is the answer to "what is the space complexity", and the skewed case is the follow-up.</p>`
},
{
  q: "Lowest common ancestor — the three versions you should know",
  level: "advanced", hot: true, tags: ["trees", "lca", "recursion", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<pre><code>// 1. BINARY TREE — the famous six-line solution
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left  = lca(root.left,  p, q);
    TreeNode right = lca(root.right, p, q);
    if (left != null &amp;&amp; right != null) return root;   // found on BOTH sides -> here
    return left != null ? left : right;               // both on one side, pass it up
}
// Read it as: "return a node if it is p, q, or the meeting point below me."
// If p and q come back from opposite subtrees, THIS node is the split point.
// O(n) time, O(h) space.
//
// The unstated assumption: both nodes EXIST in the tree. If one might be
// absent this returns the other one, which is wrong — you then need a
// found-both flag. Interviewers ask this exact follow-up.</code></pre>
<pre><code>// 2. BST — the extra structure makes it O(h) and iterative
TreeNode lcaBst(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val &lt; root.val &amp;&amp; q.val &lt; root.val)      root = root.left;
        else if (p.val &gt; root.val &amp;&amp; q.val &gt; root.val) root = root.right;
        else return root;              // the values SPLIT here — this is the LCA
    }
    return null;
}
// No recursion, O(1) space. The first node whose value lies between p and q
// is the answer, by definition of a BST.</code></pre>
<pre><code>// 3. WITH PARENT POINTERS — it becomes the linked-list intersection problem
// Walk up from each node collecting ancestors into a set, or use two pointers
// that switch to the other node's start on reaching the root. They meet at the
// LCA after at most two passes. O(h) time, O(1) space.
//
// 4. MANY QUERIES on a static tree -> BINARY LIFTING.
// Precompute up[k][v] = the 2^k-th ancestor of v in O(n log n), then each
// query is O(log n). This is the answer to "what if I ask a million times?" —
// naming it matters more than writing it.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="LCA found where the two search paths diverge">
  <circle class="dg-fill2" cx="300" cy="28" r="17"/><text class="dg-t" x="300" y="33" text-anchor="middle">3</text>
  <circle class="dg-fill" cx="220" cy="84" r="17"/><text class="dg-t" x="220" y="89" text-anchor="middle">5</text>
  <circle class="dg-fill" cx="380" cy="84" r="17"/><text class="dg-t" x="380" y="89" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="170" cy="140" r="17"/><text class="dg-t" x="170" y="145" text-anchor="middle">6</text>
  <circle class="dg-fill" cx="268" cy="140" r="17"/><text class="dg-t" x="268" y="145" text-anchor="middle">2</text>
  <circle class="dg-fill" cx="430" cy="140" r="17"/><text class="dg-t" x="430" y="145" text-anchor="middle">8</text>
  <path class="dg-line" d="M287 42 L233 70 M313 42 L367 70 M209 98 L181 126 M231 98 L257 126 M392 98 L418 126"/>
  <text class="dg-s" x="20" y="34">LCA(6, 8) = 3</text>
  <text class="dg-s" x="20" y="56">one in each subtree</text>
  <text class="dg-s" x="470" y="34">LCA(5, 6) = 5</text>
  <text class="dg-s" x="470" y="56">an ancestor can be</text>
  <text class="dg-s" x="470" y="78">one of the nodes itself</text>
</svg>
</figure>
<table>
<tr><th>Built on the same idea</th><th>How</th></tr>
<tr><td>Distance between two nodes</td><td><code>depth(p) + depth(q) − 2·depth(lca)</code></td></tr>
<tr><td>Path between two nodes</td><td>Up from p to the LCA, then down to q</td></tr>
<tr><td>Deepest leaves' LCA</td><td>Post-order returning <code>(depth, lca)</code> together</td></tr>
<tr><td>Binary tree maximum path sum</td><td>Post-order; the "split" node is where the best path bends</td></tr>
</table>
<p><strong>The edge case to state before coding:</strong> is a node its own ancestor? By the standard definition, yes — <code>LCA(5, 6)</code> is 5 when 6 is below 5. The base case <code>root == p || root == q</code> is what encodes that, and saying so out loud shows you understood the line rather than memorised it.</p>`
},
{
  q: "Tries, heaps and balanced trees — which structure for which requirement?",
  level: "advanced", tags: ["trie", "heap", "bst", "data-structures"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Oracle"],
  a: `<pre><code>// TRIE — prefix search in O(length), independent of how many words are stored
class Trie {
    private final Trie[] next = new Trie[26];
    private boolean isWord;

    void insert(String w) {
        Trie node = this;
        for (char c : w.toCharArray()) {
            int i = c - 'a';
            if (node.next[i] == null) node.next[i] = new Trie();
            node = node.next[i];
        }
        node.isWord = true;              // WITHOUT this flag, "app" would match
    }                                    // just because "apple" was inserted

    boolean startsWith(String p) { return walk(p) != null; }
    boolean search(String w)     { Trie n = walk(w); return n != null &amp;&amp; n.isWord; }

    private Trie walk(String s) {
        Trie node = this;
        for (char c : s.toCharArray()) {
            node = node.next[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }
}
// A HashMap gives O(1) exact lookup but CANNOT answer "all words starting
// with 'pre'" without scanning every key. That is the whole reason tries exist.
// Cost: 26 references per node. For sparse alphabets use a HashMap per node.</code></pre>
<table>
<tr><th>Requirement</th><th>Structure</th><th>Why</th></tr>
<tr><td>Exact key lookup</td><td><code>HashMap</code></td><td>O(1) average</td></tr>
<tr><td><strong>Prefix</strong> / autocomplete</td><td><strong>Trie</strong></td><td>O(length), shares prefixes</td></tr>
<tr><td>Sorted iteration, range queries</td><td><code>TreeMap</code> (red-black)</td><td>O(log n) with order preserved</td></tr>
<tr><td>Always the min or max</td><td><code>PriorityQueue</code></td><td>O(1) peek, O(log n) update</td></tr>
<tr><td>Range sum with live updates</td><td>Fenwick / segment tree</td><td>O(log n) for both</td></tr>
<tr><td>Nearest neighbour in 2D</td><td>k-d tree, quadtree</td><td>Spatial partitioning</td></tr>
<tr><td>"Same group?" with merges</td><td>Union-Find</td><td>≈O(1) amortised</td></tr>
<tr><td>LRU cache</td><td><code>HashMap</code> + doubly linked list</td><td>O(1) lookup <em>and</em> O(1) eviction</td></tr>
</table>
<pre><code>// HEAP vs BST — the comparison that gets asked directly
                    Heap                    Balanced BST (TreeMap)
find min/max        O(1)                    O(log n)
insert / delete     O(log n)                O(log n)
search arbitrary    O(n)                    O(log n)
sorted traversal    NO                      YES, in-order
build from array    O(n) heapify            O(n log n)
memory              contiguous array        node per entry + pointers

// A heap is only PARTIALLY ordered — parent versus child, nothing sideways.
// That weaker invariant is exactly what makes it cheaper to maintain.
// Use a heap when you only ever want the extreme; a BST when you want ORDER.</code></pre>
<table>
<tr><th>Trie problem</th><th>Addition to the base structure</th></tr>
<tr><td>Word search II (trie + grid DFS)</td><td>Prune the DFS the moment no child matches</td></tr>
<tr><td>Replace words / longest prefix</td><td>Stop at the first <code>isWord</code></td></tr>
<tr><td>Design an autocomplete</td><td>Store the top-k at each node, or DFS the subtree</td></tr>
<tr><td>Maximum XOR of two numbers</td><td>Binary trie over the 32 bits, greedily take the opposite bit</td></tr>
<tr><td>Wildcard matching <code>.</code></td><td>Branch into all 26 children on a dot</td></tr>
</table>
<p><strong>Red-black vs AVL, if pushed:</strong> AVL is more strictly balanced, so lookups are marginally faster; red-black rebalances less on write, so inserts and deletes are cheaper. Java picked red-black for <code>TreeMap</code> — and for the treeified <code>HashMap</code> buckets added in Java 8 — because mixed read/write workloads are the common case.</p>`
}
]);
