registerPrimer("coding-trees", `<h3>The mental model: solve it for one node, and trust the recursion for the rest</h3>
<p>A binary tree is a node with a left subtree and a right subtree, each of which is itself a tree. That self-similar shape means most tree problems have the same three-line answer: <strong>handle the empty tree, ask the children for their answers, combine them</strong>. The hard part is not the code; it is deciding what each call should <em>return</em> to its parent.</p>
<figure class="fig">
<svg viewBox="0 0 620 226" role="img" aria-label="Computing tree height recursively: leaves return 1, each node returns one plus the larger child height, values flowing up to the root">
  <defs><marker id="pr-tr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <line class="dg-line" x1="200" y1="44" x2="120" y2="96"/>
  <line class="dg-line" x1="200" y1="44" x2="280" y2="96"/>
  <line class="dg-line" x1="120" y1="112" x2="70" y2="164"/>
  <line class="dg-line" x1="120" y1="112" x2="170" y2="164"/>
  <line class="dg-line" x1="170" y1="180" x2="200" y2="206"/>
  <circle class="dg-fill" cx="200" cy="36" r="18"/><text class="dg-m" x="200" y="41" text-anchor="middle">8</text>
  <circle class="dg-fill" cx="120" cy="104" r="18"/><text class="dg-m" x="120" y="109" text-anchor="middle">3</text>
  <circle class="dg-fill2" cx="280" cy="104" r="18"/><text class="dg-m" x="280" y="109" text-anchor="middle">10</text>
  <circle class="dg-fill2" cx="70" cy="172" r="18"/><text class="dg-m" x="70" y="177" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="170" cy="172" r="18"/><text class="dg-m" x="170" y="177" text-anchor="middle">6</text>
  <circle class="dg-fill2" cx="206" cy="212" r="12"/><text class="dg-s" x="206" y="216" text-anchor="middle">4</text>
  <text class="dg-s" x="228" y="40">returns 1 + max(3, 1) = 4</text>
  <text class="dg-s" x="140" y="96">1 + max(1, 2) = 3</text>
  <text class="dg-s" x="304" y="108">leaf: 1 + max(0, 0) = 1</text>
  <text class="dg-s" x="24" y="206">leaf: 1</text>
  <text class="dg-s" x="224" y="186">1 + max(0, 1) = 2</text>
  <text class="dg-s" x="400" y="160">answers flow UP:</text>
  <text class="dg-s" x="400" y="176">each node waits for its</text>
  <text class="dg-s" x="400" y="192">children, then combines</text>
</svg>
<figcaption>Post-order thinking: children first, then the node. Null children return 0, which is the base case.</figcaption>
</figure>
<h3>Worked example: three questions, one template</h3>
<pre><code>class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }

// Height: "how tall is the tallest path below me?"
static int height(TreeNode n) {
    if (n == null) return 0;                              // 1. empty tree
    return 1 + Math.max(height(n.left), height(n.right)); // 2+3. ask, combine
}

// Count nodes: "how many nodes are in my subtree?"
static int count(TreeNode n) {
    if (n == null) return 0;
    return 1 + count(n.left) + count(n.right);
}

// Same tree? "are these two subtrees identical?"
static boolean same(TreeNode a, TreeNode b) {
    if (a == null || b == null) return a == b;           // both empty = same
    return a.val == b.val &amp;&amp; same(a.left, b.left) &amp;&amp; same(a.right, b.right);
}</code></pre>
<p><strong>When the answer the parent needs differs from what the caller wants</strong>, return one thing and track the other in a field. Diameter is the classic: each node returns its height to its parent, but the diameter through that node is <code>left height + right height</code>, recorded on the side.</p>
<pre><code>static int diameter;
static int depth(TreeNode n) {
    if (n == null) return 0;
    int l = depth(n.left), r = depth(n.right);
    diameter = Math.max(diameter, l + r);   // the answer the CALLER wants
    return 1 + Math.max(l, r);              // what the PARENT needs
}</code></pre>
<h3>Which traversal for which job</h3>
<table>
<tr><th>Traversal</th><th>Order</th><th>Use it when</th></tr>
<tr><td>Pre-order</td><td>node, left, right</td><td>Copying or serialising a tree; passing information DOWN (depth, path so far)</td></tr>
<tr><td>In-order</td><td>left, node, right</td><td>A BST in sorted order; kth smallest; validating a BST</td></tr>
<tr><td>Post-order</td><td>left, right, node</td><td>Answers that need both children first: height, diameter, deleting a tree</td></tr>
<tr><td>Level-order (BFS)</td><td>level by level, with a queue</td><td>Anything "per level": right side view, minimum depth, zigzag</td></tr>
</table>`);

appendTopic("coding-trees", [
{
  q: "Build a balanced BST from a sorted array, and flatten a binary tree into a linked list",
  level: "advanced", hot: true, tags: ["bst", "recursion", "divide-and-conquer", "must-know"],
  companies: ["Amazon", "Microsoft", "Meta", "Adobe", "Flipkart", "Walmart", "Oracle"],
  a: `<div class="cx"><b>O(n) time</b><span>each node handled once</span><b>O(log n) / O(h) space</b><span>recursion depth</span></div>
<p>Two classic construction problems. They look unrelated but both are about choosing <strong>which node goes where</strong>, and both reward thinking recursively.</p>
<p><strong>Part 1: sorted array to a height-balanced BST.</strong> <code>[-10, -3, 0, 5, 9]</code>. The middle element must be the root: it has as many smaller values as larger ones, so both sides get half. Then do the same for each half.</p>
<pre><code>static TreeNode sortedArrayToBST(int[] a) {
    return build(a, 0, a.length - 1);
}

static TreeNode build(int[] a, int lo, int hi) {
    if (lo &gt; hi) return null;                 // empty range: no node
    int mid = lo + (hi - lo) / 2;             // overflow-safe middle
    TreeNode node = new TreeNode(a[mid]);
    node.left  = build(a, lo, mid - 1);       // everything smaller
    node.right = build(a, mid + 1, hi);       // everything larger
    return node;
}

//            0
//          /   \\
//       -10     5
//          \\      \\
//          -3      9
// Height difference between any two subtrees is at most 1, and
// an in-order walk gives back the original sorted array.</code></pre>
<p><strong>Part 2: flatten a binary tree to a "linked list"</strong> in place, following pre-order, using the <code>right</code> pointers as <code>next</code> and setting every <code>left</code> to null.</p>
<pre><code>        1                    1
       / \\                    \\
      2   5        -&gt;          2
     / \\   \\                    \\
    3   4   6                    3 -&gt; 4 -&gt; 5 -&gt; 6   (all via right pointers)</code></pre>
<pre><code>// O(1) extra space (Morris-style): for each node with a left child, splice
// the whole left subtree in between the node and its right subtree.
static void flatten(TreeNode root) {
    TreeNode cur = root;
    while (cur != null) {
        if (cur.left != null) {
            TreeNode tail = cur.left;
            while (tail.right != null) tail = tail.right;   // last node of the
                                                            // left subtree in pre-order
            tail.right = cur.right;       // hang the right subtree after it
            cur.right = cur.left;         // move the left subtree to the right
            cur.left = null;
        }
        cur = cur.right;                  // continue down the new chain
    }
}

// The recursive version, processing in REVERSE pre-order (right, left, node):
static TreeNode prev = null;
static void flattenRec(TreeNode n) {
    if (n == null) return;
    flattenRec(n.right);
    flattenRec(n.left);
    n.right = prev;                       // prev = the node that comes after n
    n.left = null;
    prev = n;
}</code></pre>
<table>
<tr><th>Problem</th><th>Key insight</th><th>Common bug</th></tr>
<tr><td>Sorted array to BST</td><td>Middle element is the root; recurse on halves</td><td>Using <code>(lo + hi) / 2</code> on huge arrays (overflow), or off-by-one on the ranges</td></tr>
<tr><td>Flatten (iterative)</td><td>Left subtree's last node connects to the right subtree</td><td>Forgetting <code>cur.left = null</code>, leaving a tree that is not a list</td></tr>
<tr><td>Flatten (recursive)</td><td>Build the list backwards, so "next" is already known</td><td>Processing left before right, which links in the wrong order</td></tr>
</table>
<p><strong>Related:</strong> sorted <em>linked list</em> to BST (find the middle with slow/fast pointers, or build the tree during an in-order walk of the list, for O(n)), and converting a BST to a sorted doubly linked list (in-order with a <code>prev</code> pointer, exactly like the recursive flatten).</p>`
},
{
  q: "Print the boundary of a binary tree anticlockwise",
  level: "advanced", tags: ["traversal", "binary-tree", "edge-cases"],
  companies: ["Amazon", "Microsoft", "Samsung", "Flipkart", "Walmart", "Paytm", "Adobe"],
  a: `<div class="cx"><b>O(n) time</b><span>each node visited at most once per part</span><b>O(h) space</b><span>recursion depth</span></div>
<p>Print the root, then the left boundary top-down, then all the leaves left to right, then the right boundary bottom-up, without printing any node twice. It is a popular question because it is three easy traversals with several easy-to-miss edge cases.</p>
<pre><code>              20
            /    \\
           8      22
          / \\       \\
         4   12      25
            /  \\
           10   14

Root:            20
Left boundary:   8          (top-down, excluding leaves)
Leaves:          4 10 14 25 (left to right)
Right boundary:  22         (bottom-up, excluding leaves)

Answer: 20 8 4 10 14 25 22</code></pre>
<pre><code>static List&lt;Integer&gt; boundary(TreeNode root) {
    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    if (root == null) return out;
    if (!isLeaf(root)) out.add(root.val);     // a lone root is added as a leaf below
    addLeft(root.left, out);
    addLeaves(root, out);
    addRight(root.right, out);
    return out;
}

static boolean isLeaf(TreeNode n) { return n.left == null &amp;&amp; n.right == null; }

// Left boundary: keep going left; go right only when there is no left child
static void addLeft(TreeNode n, List&lt;Integer&gt; out) {
    while (n != null) {
        if (!isLeaf(n)) out.add(n.val);       // leaves are printed with the leaves
        n = (n.left != null) ? n.left : n.right;
    }
}

// Leaves: any traversal that visits left before right
static void addLeaves(TreeNode n, List&lt;Integer&gt; out) {
    if (n == null) return;
    if (isLeaf(n)) { out.add(n.val); return; }
    addLeaves(n.left, out);
    addLeaves(n.right, out);
}

// Right boundary: collect top-down, then add in REVERSE (bottom-up)
static void addRight(TreeNode n, List&lt;Integer&gt; out) {
    Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();
    while (n != null) {
        if (!isLeaf(n)) stack.push(n.val);
        n = (n.right != null) ? n.right : n.left;
    }
    while (!stack.isEmpty()) out.add(stack.pop());
}</code></pre>
<table>
<tr><th>Edge case</th><th>What goes wrong if missed</th></tr>
<tr><td>Leaf nodes on the left or right edge</td><td>Printed twice: once as boundary, once as a leaf</td></tr>
<tr><td>The root is itself a leaf (one-node tree)</td><td>Printed twice, or not at all</td></tr>
<tr><td>Left boundary has a gap (a node with only a right child)</td><td>The boundary stops early; the rule is "left if you can, else right"</td></tr>
<tr><td>Root with no left subtree</td><td>The left boundary is empty. The root's right child is <em>not</em> on the left boundary</td></tr>
<tr><td>Right boundary order</td><td>Printed top-down instead of bottom-up, breaking the anticlockwise order</td></tr>
</table>
<p><strong>How to present it:</strong> draw the tree, split the answer into the three parts before writing code, and list the edge cases out loud. Interviewers mostly score whether you spotted the double-counting of leaves and the one-node tree.</p>`
}
]);
