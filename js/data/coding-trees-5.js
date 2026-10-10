registerPrimer("coding-trees", `<p class="pr-lead">A <b>binary tree</b> is a structure where each item (a <b>node</b>) holds a value and can have up to two children: a left child and a right child. It looks like an upside-down family tree, with the <b>root</b> at the top. Trees store data with a natural hierarchy, such as folders, organisation charts, or sorted data that must be searched quickly.</p>
<div class="pr-analogy"><b>Think of it like this</b>Imagine a company asking "how many people work here?". The CEO does not count everyone personally. They ask each of their two direct managers "how many people are in your team?", add the two answers, and add 1 for themselves. Each manager does exactly the same with their own reports, down to people with no reports, who simply answer "just me". That is how almost every tree problem is solved: ask the children, combine their answers.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Root</dt><dd>The top node of the tree, which has no parent.</dd>
<dt>Leaf</dt><dd>A node with no children.</dd>
<dt>Subtree</dt><dd>A node together with everything below it. Every subtree is itself a tree.</dd>
<dt>Height / depth</dt><dd>Height: the number of levels from a node down to its deepest leaf. Depth: how far a node is from the root.</dd>
<dt>Binary search tree (BST)</dt><dd>A tree where every value on the left of a node is smaller and every value on the right is larger, so searching is fast.</dd>
<dt>Traversal</dt><dd>Visiting every node in a particular order.</dd>
<dt>Recursion</dt><dd>A function that calls itself on smaller parts of the problem, here on the left and right subtrees.</dd>
</dl>

<h3>Step by step: the three-line template</h3>
<p>Most tree problems follow the same pattern:</p>
<ol class="pr-steps">
<li><b>Handle the empty tree:</b> if the node is <code>null</code>, return the simplest answer (often 0, true or null).</li>
<li><b>Ask the children:</b> call the same function on the left subtree and on the right subtree.</li>
<li><b>Combine:</b> use the two answers and the current node's value to produce this node's answer.</li>
</ol>
<p>The real thinking is deciding <b>what each call should return to its parent</b>.</p>
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

<h3>A worked example: the height of a tree</h3>
<pre><code>class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }

static int height(TreeNode node) {
    if (node == null) return 0;                    // 1. an empty tree has height 0
    int left = height(node.left);                  // 2. ask the left child
    int right = height(node.right);                // 2. ask the right child
    return 1 + Math.max(left, right);              // 3. my height = 1 + the taller side
}

//        1
//       / \
//      2   3
//     /
//    4</code></pre>
<ol class="pr-steps">
<li>Node 4 is a leaf: both its children are null, so they return 0, and node 4 returns 1 + 0 = 1.</li>
<li>Node 2 gets 1 from its left child (node 4) and 0 from its missing right child, so it returns 1 + 1 = 2.</li>
<li>Node 3 is a leaf, so it returns 1.</li>
<li>The root gets 2 from the left and 1 from the right, so it returns 1 + 2 = <b>3</b>.</li>
<li>Each node is visited once, so this runs in O(n). Counting nodes, summing values and checking whether two trees are the same all use this exact template.</li>
</ol>

<h3>Which traversal for which job</h3>
<ul>
<li><b>Pre-order</b> (node, left, right): copying or saving a tree, or passing information down, such as the path so far.</li>
<li><b>In-order</b> (left, node, right): on a BST this visits values in sorted order, so it is used to validate a BST or find the kth smallest.</li>
<li><b>Post-order</b> (left, right, node): when a node needs its children's answers first, such as height or diameter.</li>
<li><b>Level-order</b> (level by level, using a queue): anything "per level", such as the right side view.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting the null case</p>
<p>Without <code>if (node == null)</code> at the start, the recursion crashes as soon as it reaches below a leaf.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> always write the empty-tree case first.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Checking a BST only against the parent</p>
<p>A node can be bigger than its parent but still smaller than its grandparent, which breaks the BST rule even though each parent-child pair looks fine.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> pass down an allowed range (min, max) to each node, or check that an in-order traversal is strictly increasing.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Assuming recursion depth is small</p>
<p>A very unbalanced tree is effectively a long list, so recursion can go thousands of levels deep and overflow the stack.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> mention that space is O(height), and use an explicit stack or queue for very deep trees.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Handle null, ask the children, combine their answers.</li>
<li>Decide carefully what each call returns to its parent.</li>
<li>In-order traversal of a BST gives sorted values.</li>
<li>Use level-order (a queue) for per-level questions.</li>
<li>Most tree solutions are O(n) time and O(height) space.</li>
</ul>
<p><b>Next:</b> the questions below cover traversals, BST validation, lowest common ancestor, path sums, tries and more.</p>`);

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
