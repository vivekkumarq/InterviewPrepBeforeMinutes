registerTopic("coding-trees", [
{
  q: "Tree traversals — inorder, preorder, postorder and level order",
  level: "beginner", hot: true, tags: ["trees", "traversal", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "TCS", "Infosys", "Oracle"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 175" role="img" aria-label="Binary tree with the four traversal orders listed">
  <circle class="dg-fill" cx="150" cy="30" r="18"/><text class="dg-t" x="150" y="35" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="96" cy="90" r="18"/><text class="dg-t" x="96" y="95" text-anchor="middle">2</text>
  <circle class="dg-fill" cx="204" cy="90" r="18"/><text class="dg-t" x="204" y="95" text-anchor="middle">3</text>
  <circle class="dg-fill" cx="56" cy="148" r="18"/><text class="dg-t" x="56" y="153" text-anchor="middle">4</text>
  <circle class="dg-fill" cx="136" cy="148" r="18"/><text class="dg-t" x="136" y="153" text-anchor="middle">5</text>
  <path class="dg-line" d="M138 44 L108 76 M162 44 L192 76 M86 106 L66 132 M106 106 L126 132"/>
  <text class="dg-s" x="290" y="42">inorder    (L, root, R)   4 2 5 1 3</text>
  <text class="dg-s" x="290" y="68">preorder   (root, L, R)   1 2 4 5 3</text>
  <text class="dg-s" x="290" y="94">postorder  (L, R, root)   4 5 2 3 1</text>
  <text class="dg-s" x="290" y="120">level order (BFS)         1 2 3 4 5</text>
  <text class="dg-s" x="16" y="168">the name says where the ROOT is visited — the children are always left then right</text>
</svg>
</figure>
<pre><code>// RECURSIVE — the three depth-first orders differ by ONE line's position
void inorder(TreeNode n, List&lt;Integer&gt; out) {
    if (n == null) return;
    inorder(n.left, out);
    out.add(n.val);                 // &lt;- root visited BETWEEN the subtrees
    inorder(n.right, out);
}
void preorder(TreeNode n, List&lt;Integer&gt; out) {
    if (n == null) return;
    out.add(n.val);                 // &lt;- root FIRST
    preorder(n.left, out); preorder(n.right, out);
}
void postorder(TreeNode n, List&lt;Integer&gt; out) {
    if (n == null) return;
    postorder(n.left, out); postorder(n.right, out);
    out.add(n.val);                 // &lt;- root LAST
}</code></pre>
<pre><code>// ITERATIVE INORDER — asked when they want to see you handle the stack yourself
public List&lt;Integer&gt; inorderIterative(TreeNode root) {
    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    Deque&lt;TreeNode&gt; stack = new ArrayDeque&lt;&gt;();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) { stack.push(curr); curr = curr.left; }  // dive left
        curr = stack.pop();
        out.add(curr.val);
        curr = curr.right;                                            // then go right
    }
    return out;
}

// LEVEL ORDER (BFS) — the size snapshot is what separates the levels
public List&lt;List&lt;Integer&gt;&gt; levelOrder(TreeNode root) {
    List&lt;List&lt;Integer&gt;&gt; out = new ArrayList&lt;&gt;();
    if (root == null) return out;
    Queue&lt;TreeNode&gt; q = new LinkedList&lt;&gt;();
    q.offer(root);

    while (!q.isEmpty()) {
        int size = q.size();                   // capture BEFORE adding children
        List&lt;Integer&gt; level = new ArrayList&lt;&gt;();
        for (int i = 0; i &lt; size; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        out.add(level);
    }
    return out;
}</code></pre>
<table>
<tr><th>Traversal</th><th>Use it for</th></tr>
<tr><td><strong>Inorder</strong></td><td>A BST — produces values in <strong>sorted order</strong>. That property is the basis of half of all BST questions.</td></tr>
<tr><td><strong>Preorder</strong></td><td>Copying or serialising a tree — the root arrives before its children, so reconstruction is natural</td></tr>
<tr><td><strong>Postorder</strong></td><td>Deleting a tree, or any computation that needs both children first (height, diameter, sums)</td></tr>
<tr><td><strong>Level order</strong></td><td>Shortest path in an unweighted tree, right-side view, zigzag, level averages</td></tr>
</table>
<div class="cx"><b>O(n) time</b><span>every node visited once</span><b>O(h) space</b><span>DFS recursion depth; BFS is O(width)</span></div>
<p><strong>The follow-up to expect:</strong> "what if the tree is a million nodes deep?" Recursion overflows the stack, so you convert to the iterative form — or, for constant space, mention <strong>Morris traversal</strong>, which threads temporary links to the inorder predecessor and removes them on the way back. You rarely have to write it, but naming it lands well.</p>`
},
{
  q: "Validate a binary search tree",
  level: "advanced", hot: true, tags: ["trees", "bst", "recursion", "gotcha"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<pre><code>// ✗ THE WRONG ANSWER most candidates give first
boolean isBSTWrong(TreeNode n) {
    if (n == null) return true;
    if (n.left != null  && n.left.val  &gt;= n.val) return false;
    if (n.right != null && n.right.val &lt;= n.val) return false;
    return isBSTWrong(n.left) && isBSTWrong(n.right);
}
// Only checks parent against child. This tree passes and is NOT a BST:
//        10
//       /  \\
//      5    15
//          /  \\
//         6    20     &lt;- 6 is in the RIGHT subtree of 10 but smaller than 10</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="Invalid BST where a deep node violates an ancestor bound">
  <circle class="dg-fill" cx="200" cy="28" r="20"/><text class="dg-t" x="200" y="33" text-anchor="middle">10</text>
  <circle class="dg-fill" cx="120" cy="92" r="20"/><text class="dg-t" x="120" y="97" text-anchor="middle">5</text>
  <circle class="dg-fill" cx="290" cy="92" r="20"/><text class="dg-t" x="290" y="97" text-anchor="middle">15</text>
  <circle class="dg-fill2" cx="238" cy="150" r="20"/><text class="dg-t" x="238" y="155" text-anchor="middle">6</text>
  <circle class="dg-fill" cx="350" cy="150" r="20"/><text class="dg-t" x="350" y="155" text-anchor="middle">20</text>
  <path class="dg-line" d="M184 42 L136 78 M216 42 L274 78 M276 108 L252 132 M304 108 L336 132"/>
  <text class="dg-s" x="400" y="70">6 &lt; 15, so the local check passes</text>
  <text class="dg-s" x="400" y="92">but 6 is in 10's RIGHT subtree,</text>
  <text class="dg-s" x="400" y="114">so it must be &gt; 10 — it is not</text>
  <text class="dg-s" x="16" y="168">every node must satisfy the bounds of ALL its ancestors, not just its parent</text>
</svg>
</figure>
<pre><code>// ✔ CORRECT — carry the valid RANGE down the tree
public boolean isValidBST(TreeNode root) {
    return valid(root, null, null);        // Long, not int: values may be MIN/MAX_VALUE
}
private boolean valid(TreeNode n, Long min, Long max) {
    if (n == null) return true;
    if (min != null && n.val &lt;= min) return false;
    if (max != null && n.val &gt;= max) return false;
    return valid(n.left, min, (long) n.val)     // left subtree: upper bound tightens
        && valid(n.right, (long) n.val, max);   // right subtree: lower bound tightens
}</code></pre>
<pre><code>// ✔ ALTERNATIVE — inorder traversal must be STRICTLY increasing
private Integer prev = null;
public boolean isValidBSTInorder(TreeNode n) {
    if (n == null) return true;
    if (!isValidBSTInorder(n.left)) return false;
    if (prev != null && n.val &lt;= prev) return false;   // &lt;= rejects duplicates
    prev = n.val;
    return isValidBSTInorder(n.right);
}
// Elegant, but it uses mutable state across calls — fine here, awkward if
// the method must be reentrant. Say which trade-off you are choosing.</code></pre>
<table>
<tr><th>Trap</th><th>Why it bites</th></tr>
<tr><td>Only comparing parent and child</td><td>Misses violations against distant ancestors — the classic failure</td></tr>
<tr><td>Using <code>Integer.MIN_VALUE</code> as the initial bound</td><td>A node holding exactly <code>MIN_VALUE</code> is then wrongly rejected. Use <code>null</code> or <code>long</code>.</td></tr>
<tr><td>Using <code>&lt;</code> instead of <code>&lt;=</code></td><td>Ask whether duplicates are allowed — the definition changes the operator</td></tr>
<tr><td>Empty tree</td><td>Valid by definition</td></tr>
</table>
<p><strong>The related BST problems that reuse the inorder property:</strong> kth smallest element (stop the inorder walk at k), recover a BST with two swapped nodes (find the two inorder inversions), convert a BST to a sorted doubly linked list, and range sum in a BST (prune subtrees that fall outside the range). Recognising "inorder on a BST is sorted" collapses all of them into one idea.</p>`
},
{
  q: "Lowest common ancestor in a binary tree and in a BST",
  level: "advanced", hot: true, tags: ["trees", "lca", "recursion", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Salesforce"],
  a: `<div class="cx"><b>Binary tree: O(n)</b><span>one post-order pass</span><b>BST: O(h)</b><span>the ordering does the work</span></div>
<pre><code>// GENERAL BINARY TREE — the whole solution is five lines
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;

    TreeNode left  = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    if (left != null && right != null) return root;   // found on BOTH sides -> this is it
    return left != null ? left : right;               // otherwise pass the finding up
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="LCA found where the two search results meet">
  <circle class="dg-fill2" cx="300" cy="26" r="18"/><text class="dg-t" x="300" y="31" text-anchor="middle">3</text>
  <circle class="dg-fill" cx="216" cy="82" r="18"/><text class="dg-t" x="216" y="87" text-anchor="middle">5</text>
  <circle class="dg-fill" cx="386" cy="82" r="18"/><text class="dg-t" x="386" y="87" text-anchor="middle">1</text>
  <circle class="dg-box" cx="160" cy="140" r="18"/><text class="dg-t" x="160" y="145" text-anchor="middle">6</text>
  <circle class="dg-box" cx="264" cy="140" r="18"/><text class="dg-t" x="264" y="145" text-anchor="middle">2</text>
  <circle class="dg-box" cx="336" cy="140" r="18"/><text class="dg-t" x="336" y="145" text-anchor="middle">0</text>
  <circle class="dg-box" cx="440" cy="140" r="18"/><text class="dg-t" x="440" y="145" text-anchor="middle">8</text>
  <path class="dg-line" d="M286 40 L230 68 M314 40 L372 68 M202 96 L174 126 M230 96 L250 126 M372 96 L350 126 M400 96 L426 126"/>
  <text class="dg-s" x="470" y="34">LCA(5, 1) = 3</text>
  <text class="dg-s" x="470" y="56">one match in each subtree,</text>
  <text class="dg-s" x="470" y="78">so the split point is the answer</text>
  <text class="dg-s" x="16" y="166">LCA(5, 6) = 5 — a node is allowed to be its own ancestor, which the first line handles</text>
</svg>
</figure>
<p><strong>Why the algorithm is correct, in one sentence:</strong> the recursion returns "the shallowest interesting node found in this subtree". If both sides return something, the current node is the point where the two paths diverge, so it is the LCA. If only one side returns something, either both targets are down there (and that node is already the LCA) or only one is, and it propagates upward.</p>
<pre><code>// BST — the ordering removes the search entirely, O(h) time, O(1) space
public TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val &lt; root.val && q.val &lt; root.val)      root = root.left;
        else if (p.val &gt; root.val && q.val &gt; root.val) root = root.right;
        else return root;      // they SPLIT here (or one of them IS root) -> LCA
    }
    return null;
}</code></pre>
<table>
<tr><th>Variant</th><th>Approach</th></tr>
<tr><td>Nodes may be absent from the tree</td><td>Track whether both were actually found — the base solution assumes they exist</td></tr>
<tr><td>Nodes have parent pointers</td><td>Walk both to the root collecting depths, then the two-pointer intersection trick</td></tr>
<tr><td>Many LCA queries on a fixed tree</td><td>Binary lifting: O(n log n) preprocessing, then O(log n) per query</td></tr>
<tr><td>Distance between two nodes</td><td><code>depth(p) + depth(q) − 2 × depth(LCA)</code></td></tr>
<tr><td>N-ary tree</td><td>Same shape; count how many children returned non-null</td></tr>
</table>
<p><strong>The clarification to ask:</strong> "Are both nodes guaranteed to be in the tree?" The five-line version returns a wrong answer if one is missing — it returns the other node. If they are not guaranteed, you need a flag pair or a verification pass, and noticing that is exactly the follow-up the interviewer has queued up.</p>`
},
{
  q: "Height, diameter and balance of a binary tree",
  level: "beginner", hot: true, tags: ["trees", "recursion", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Cognizant", "Oracle"],
  a: `<pre><code>// HEIGHT — the base case of everything else
public int height(TreeNode n) {
    return n == null ? 0 : 1 + Math.max(height(n.left), height(n.right));
}

// DIAMETER — longest path between ANY two nodes; it need not pass the root.
// Key idea: compute the height ONCE per node and update the answer on the way up.
private int diameter = 0;
public int diameterOfBinaryTree(TreeNode root) {
    diameter = 0;
    depth(root);
    return diameter;                       // in EDGES; add 1 for nodes
}
private int depth(TreeNode n) {
    if (n == null) return 0;
    int l = depth(n.left), r = depth(n.right);
    diameter = Math.max(diameter, l + r);  // longest path THROUGH this node
    return 1 + Math.max(l, r);             // height reported to the parent
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Diameter as the longest path through one node">
  <circle class="dg-fill" cx="240" cy="26" r="18"/><text class="dg-t" x="240" y="31" text-anchor="middle">1</text>
  <circle class="dg-fill2" cx="170" cy="80" r="18"/><text class="dg-t" x="170" y="85" text-anchor="middle">2</text>
  <circle class="dg-fill" cx="320" cy="80" r="18"/><text class="dg-t" x="320" y="85" text-anchor="middle">3</text>
  <circle class="dg-fill" cx="118" cy="138" r="18"/><text class="dg-t" x="118" y="143" text-anchor="middle">4</text>
  <circle class="dg-fill" cx="222" cy="138" r="18"/><text class="dg-t" x="222" y="143" text-anchor="middle">5</text>
  <path class="dg-line" d="M226 40 L184 66 M254 40 L306 66 M156 94 L132 124 M184 94 L208 124"/>
  <path class="dg-line" d="M118 120 L162 90 L214 122" stroke-dasharray="5 3"/>
  <text class="dg-s" x="400" y="60">the longest path is 4 → 2 → 5</text>
  <text class="dg-s" x="400" y="82">(length 2 in edges) and it never</text>
  <text class="dg-s" x="400" y="104">touches the root — which is why</text>
  <text class="dg-s" x="400" y="126">every node must be considered</text>
</svg>
</figure>
<pre><code>// BALANCED? — height differs by at most 1 at EVERY node.
// The naive version calls height() inside isBalanced() -> O(n^2).
// Returning -1 as a sentinel makes it O(n) with a single traversal.
public boolean isBalanced(TreeNode root) {
    return check(root) != -1;
}
private int check(TreeNode n) {
    if (n == null) return 0;
    int l = check(n.left);
    if (l == -1) return -1;                       // short-circuit: already unbalanced
    int r = check(n.right);
    if (r == -1) return -1;
    if (Math.abs(l - r) &gt; 1) return -1;
    return 1 + Math.max(l, r);
}</code></pre>
<div class="cx"><b>O(n) time</b><span>each node visited once</span><b>O(h) space</b><span>recursion stack; O(n) for a skewed tree</span></div>
<table>
<tr><th>Problem</th><th>What the recursion returns upward</th></tr>
<tr><td>Height</td><td>Height of this subtree</td></tr>
<tr><td>Diameter</td><td>Height — the answer is a side effect recorded at each node</td></tr>
<tr><td>Balanced</td><td>Height, or −1 as a "give up" sentinel</td></tr>
<tr><td>Maximum path sum</td><td>Best <em>downward</em> path; the answer records the through-path</td></tr>
<tr><td>Longest univalue path</td><td>Longest same-value downward run</td></tr>
<tr><td>Count of good nodes</td><td>Nothing — pass the running maximum <em>down</em> instead</td></tr>
</table>
<pre><code>// MAXIMUM PATH SUM — the same shape, and a common hard follow-up
private int best = Integer.MIN_VALUE;
public int maxPathSum(TreeNode root) { best = Integer.MIN_VALUE; gain(root); return best; }
private int gain(TreeNode n) {
    if (n == null) return 0;
    int l = Math.max(gain(n.left), 0);       // clamp at 0: a negative branch is skipped
    int r = Math.max(gain(n.right), 0);
    best = Math.max(best, n.val + l + r);    // path through n uses BOTH children
    return n.val + Math.max(l, r);           // but the parent can only use ONE
}</code></pre>
<p><strong>The pattern to name out loud:</strong> "This family is all the same — a post-order traversal where each node returns one value to its parent while a separate accumulator records the best answer seen anywhere. The trick is noticing that what you report upward differs from what you record, because a parent can only continue through <em>one</em> child."</p>`
},
{
  q: "Serialise and deserialise a binary tree",
  level: "advanced", tags: ["trees", "design", "traversal"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Salesforce"],
  a: `<pre><code>// PREORDER with explicit null markers — the cleanest correct approach
public class Codec {
    private static final String NULL = "#", SEP = ",";

    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        build(root, sb);
        return sb.toString();
    }
    private void build(TreeNode n, StringBuilder sb) {
        if (n == null) { sb.append(NULL).append(SEP); return; }
        sb.append(n.val).append(SEP);
        build(n.left, sb);
        build(n.right, sb);
    }

    public TreeNode deserialize(String data) {
        Queue&lt;String&gt; q = new LinkedList&lt;&gt;(Arrays.asList(data.split(SEP)));
        return parse(q);
    }
    private TreeNode parse(Queue&lt;String&gt; q) {
        String t = q.poll();
        if (NULL.equals(t)) return null;
        TreeNode n = new TreeNode(Integer.parseInt(t));
        n.left = parse(q);                  // consumes exactly its own subtree
        n.right = parse(q);
        return n;
    }
}
// "1,2,#,#,3,4,#,#,5,#,#,"</code></pre>
<div class="cx"><b>O(n) both ways</b><span>each node emitted and parsed once</span><b>O(n) space</b><span>the string plus recursion</span></div>
<p><strong>Why the null markers are essential</strong> — this is the insight the question is testing:</p>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Two different trees producing the same preorder without null markers">
  <circle class="dg-fill" cx="90" cy="30" r="17"/><text class="dg-t" x="90" y="35" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="50" cy="86" r="17"/><text class="dg-t" x="50" y="91" text-anchor="middle">2</text>
  <path class="dg-line" d="M79 44 L61 72"/>
  <text class="dg-s" x="70" y="126" text-anchor="middle">preorder 1,2</text>
  <circle class="dg-fill2" cx="270" cy="30" r="17"/><text class="dg-t" x="270" y="35" text-anchor="middle">1</text>
  <circle class="dg-fill2" cx="310" cy="86" r="17"/><text class="dg-t" x="310" y="91" text-anchor="middle">2</text>
  <path class="dg-line" d="M281 44 L299 72"/>
  <text class="dg-s" x="290" y="126" text-anchor="middle">preorder 1,2</text>
  <text class="dg-s" x="400" y="56">identical output, different trees —</text>
  <text class="dg-s" x="400" y="78">so preorder ALONE is not reversible</text>
  <text class="dg-s" x="400" y="100">"1,2,#,#,#" vs "1,#,2,#,#" separates them</text>
  <text class="dg-s" x="16" y="152">this is also why inorder + preorder together are needed to rebuild a tree from traversals</text>
</svg>
</figure>
<pre><code>// LEVEL-ORDER variant — what LeetCode's own display format uses
public String serializeBFS(TreeNode root) {
    if (root == null) return "";
    StringBuilder sb = new StringBuilder();
    Queue&lt;TreeNode&gt; q = new LinkedList&lt;&gt;();
    q.offer(root);
    while (!q.isEmpty()) {
        TreeNode n = q.poll();
        if (n == null) { sb.append("#,"); continue; }
        sb.append(n.val).append(',');
        q.offer(n.left);
        q.offer(n.right);
    }
    return sb.toString();
}</code></pre>
<table>
<tr><th>Consideration</th><th>Answer</th></tr>
<tr><td>Which traversal?</td><td>Preorder — the root comes first, so reconstruction is a single recursive pass</td></tr>
<tr><td>Can I skip null markers?</td><td>Only for a <strong>BST</strong>, where the value ranges disambiguate the structure</td></tr>
<tr><td>Compactness</td><td>BFS trims trailing nulls; a bitset of "has left/right" is denser still</td></tr>
<tr><td>Deep trees</td><td>Recursive deserialisation can overflow — use an explicit stack</td></tr>
<tr><td>Negative or multi-digit values</td><td>Exactly why a delimiter is required; a per-character format breaks</td></tr>
</table>
<p><strong>Where this shows up for real:</strong> caching a parsed AST, persisting a decision tree, or shipping a DOM snapshot over the wire. The engineering version of the question is "why not just use JSON?" — and the honest answer is that you usually should; the custom format only earns its place when size or parse speed genuinely matter.</p>`
},
{
  q: "Build a tree from traversals, and check if two trees are identical or symmetric",
  level: "advanced", tags: ["trees", "recursion", "divide-conquer"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Infosys", "Oracle"],
  a: `<pre><code>// BUILD FROM PREORDER + INORDER
// preorder gives the ROOT; inorder tells you how many nodes are on each SIDE.
public TreeNode buildTree(int[] preorder, int[] inorder) {
    Map&lt;Integer, Integer&gt; pos = new HashMap&lt;&gt;();        // value -> inorder index
    for (int i = 0; i &lt; inorder.length; i++) pos.put(inorder[i], i);
    return build(preorder, 0, preorder.length - 1, 0, pos);
}
private TreeNode build(int[] preorder, int preL, int preR, int inL,
                       Map&lt;Integer, Integer&gt; pos) {
    if (preL &gt; preR) return null;

    int rootVal = preorder[preL];
    TreeNode root = new TreeNode(rootVal);

    int inRoot = pos.get(rootVal);
    int leftSize = inRoot - inL;                       // nodes left of the root

    root.left  = build(preorder, preL + 1, preL + leftSize, inL, pos);
    root.right = build(preorder, preL + leftSize + 1, preR, inRoot + 1, pos);
    return root;
}
// The HashMap is what makes it O(n). Scanning inorder for the root each
// time is the common mistake and makes it O(n^2).</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Splitting inorder around the preorder root">
  <text class="dg-s" x="16" y="24">preorder:  [3]  9  20  15  7        first element is the root</text>
  <rect class="dg-fill2" x="80" y="10" width="22" height="20" rx="4" opacity=".5"/>
  <text class="dg-s" x="16" y="66">inorder:   9  | 3 |  15  20  7</text>
  <rect class="dg-fill" x="16" y="76" width="66" height="20" rx="4"/><text class="dg-s" x="49" y="91" text-anchor="middle">left</text>
  <rect class="dg-fill2" x="130" y="76" width="130" height="20" rx="4"/><text class="dg-s" x="195" y="91" text-anchor="middle">right</text>
  <text class="dg-s" x="300" y="66">the root's position in inorder</text>
  <text class="dg-s" x="300" y="88">splits it into the two subtrees,</text>
  <text class="dg-s" x="300" y="110">and their SIZES slice preorder</text>
  <text class="dg-s" x="16" y="140">recurse on each side — O(n) with a value→index map</text>
</svg>
</figure>
<pre><code>// IDENTICAL TREES
public boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null || q == null) return p == q;      // both null -> true, one null -> false
    return p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}

// SYMMETRIC (mirror of itself) — compare OUTER with OUTER, INNER with INNER
public boolean isSymmetric(TreeNode root) {
    return root == null || mirror(root.left, root.right);
}
private boolean mirror(TreeNode a, TreeNode b) {
    if (a == null || b == null) return a == b;
    return a.val == b.val
        && mirror(a.left, b.right)      // note the CROSS comparison
        && mirror(a.right, b.left);
}

// SUBTREE OF ANOTHER TREE
public boolean isSubtree(TreeNode root, TreeNode sub) {
    if (root == null) return false;
    return isSameTree(root, sub) || isSubtree(root.left, sub) || isSubtree(root.right, sub);
}   // O(n*m); serialising both and doing string matching gives O(n+m)</code></pre>
<table>
<tr><th>Traversal pair</th><th>Can it rebuild a tree?</th></tr>
<tr><td>Preorder + inorder</td><td><strong>Yes</strong></td></tr>
<tr><td>Postorder + inorder</td><td><strong>Yes</strong> — build right subtree first, walking postorder backwards</td></tr>
<tr><td>Preorder + postorder</td><td><strong>No</strong> for a general tree — ambiguous; yes only if every node has 0 or 2 children</td></tr>
<tr><td>Preorder alone, for a <strong>BST</strong></td><td>Yes — the ordering supplies the missing information</td></tr>
<tr><td>Level order + inorder</td><td>Yes</td></tr>
</table>
<p><strong>The precondition to state:</strong> reconstruction assumes <em>distinct values</em>. With duplicates, the root's position in the inorder array is ambiguous and the tree cannot be recovered uniquely. Raising that before you code is the kind of thing that turns a correct answer into a strong one.</p>`
},
{
  q: "Right side view, zigzag level order and vertical order traversal",
  level: "advanced", tags: ["trees", "bfs", "traversal"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Uber", "Walmart"],
  a: `<pre><code>// RIGHT SIDE VIEW — the last node of each level
public List&lt;Integer&gt; rightSideView(TreeNode root) {
    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    if (root == null) return out;
    Queue&lt;TreeNode&gt; q = new LinkedList&lt;&gt;();
    q.offer(root);

    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i &lt; size; i++) {
            TreeNode n = q.poll();
            if (i == size - 1) out.add(n.val);      // last node on this level
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
    }
    return out;
}
// Left side view: change the condition to i == 0. Nothing else moves.</code></pre>
<pre><code>// ZIGZAG LEVEL ORDER — alternate direction per level
public List&lt;List&lt;Integer&gt;&gt; zigzagLevelOrder(TreeNode root) {
    List&lt;List&lt;Integer&gt;&gt; out = new ArrayList&lt;&gt;();
    if (root == null) return out;
    Queue&lt;TreeNode&gt; q = new LinkedList&lt;&gt;();
    q.offer(root);
    boolean leftToRight = true;

    while (!q.isEmpty()) {
        int size = q.size();
        LinkedList&lt;Integer&gt; level = new LinkedList&lt;&gt;();
        for (int i = 0; i &lt; size; i++) {
            TreeNode n = q.poll();
            // Reverse by INSERTING at the front — O(1) on a LinkedList.
            // Collections.reverse() afterwards also works and is clearer.
            if (leftToRight) level.addLast(n.val); else level.addFirst(n.val);
            if (n.left != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        out.add(level);
        leftToRight = !leftToRight;
    }
    return out;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Vertical columns assigned by horizontal distance from the root">
  <circle class="dg-fill" cx="300" cy="28" r="17"/><text class="dg-t" x="300" y="33" text-anchor="middle">3</text>
  <circle class="dg-fill" cx="230" cy="84" r="17"/><text class="dg-t" x="230" y="89" text-anchor="middle">9</text>
  <circle class="dg-fill" cx="370" cy="84" r="17"/><text class="dg-t" x="370" y="89" text-anchor="middle">20</text>
  <circle class="dg-fill" cx="316" cy="140" r="17"/><text class="dg-t" x="316" y="145" text-anchor="middle">15</text>
  <circle class="dg-fill" cx="430" cy="140" r="17"/><text class="dg-t" x="430" y="145" text-anchor="middle">7</text>
  <path class="dg-line" d="M287 42 L243 70 M313 42 L357 70 M357 98 L329 126 M383 98 L417 126"/>
  <path class="dg-line" d="M230 60 V160 M300 12 V160 M370 60 V160 M430 122 V160" stroke-dasharray="3 3"/>
  <text class="dg-s" x="230" y="20" text-anchor="middle">col -1</text>
  <text class="dg-s" x="300" y="12" text-anchor="middle">col 0</text>
  <text class="dg-s" x="370" y="20" text-anchor="middle">col +1</text>
  <text class="dg-s" x="16" y="60">left child → col−1</text>
  <text class="dg-s" x="16" y="82">right child → col+1</text>
  <text class="dg-s" x="16" y="104">group by column,</text>
  <text class="dg-s" x="16" y="126">left to right</text>
</svg>
</figure>
<pre><code>// VERTICAL ORDER — group by horizontal distance, then by row, then by value
public List&lt;List&lt;Integer&gt;&gt; verticalTraversal(TreeNode root) {
    // col -> row -> sorted values at that exact cell
    TreeMap&lt;Integer, TreeMap&lt;Integer, PriorityQueue&lt;Integer&gt;&gt;&gt; grid = new TreeMap&lt;&gt;();
    dfs(root, 0, 0, grid);

    List&lt;List&lt;Integer&gt;&gt; out = new ArrayList&lt;&gt;();
    for (var rows : grid.values()) {
        List&lt;Integer&gt; col = new ArrayList&lt;&gt;();
        for (var pq : rows.values()) while (!pq.isEmpty()) col.add(pq.poll());
        out.add(col);
    }
    return out;
}
private void dfs(TreeNode n, int row, int col,
                 TreeMap&lt;Integer, TreeMap&lt;Integer, PriorityQueue&lt;Integer&gt;&gt;&gt; grid) {
    if (n == null) return;
    grid.computeIfAbsent(col, k -&gt; new TreeMap&lt;&gt;())
        .computeIfAbsent(row, k -&gt; new PriorityQueue&lt;&gt;())
        .offer(n.val);
    dfs(n.left, row + 1, col - 1, grid);
    dfs(n.right, row + 1, col + 1, grid);
}</code></pre>
<table>
<tr><th>View</th><th>Rule</th></tr>
<tr><td>Right side view</td><td>Last node of each BFS level</td></tr>
<tr><td>Left side view</td><td>First node of each level</td></tr>
<tr><td>Top view</td><td>First node seen for each column</td></tr>
<tr><td>Bottom view</td><td>Last node seen for each column</td></tr>
<tr><td>Boundary traversal</td><td>Left boundary + leaves + reversed right boundary, no duplicates</td></tr>
<tr><td>Vertical order</td><td>Sort by column, then row, then value</td></tr>
</table>
<p><strong>The tie-break is the trap in vertical order:</strong> two nodes can land in the <em>same</em> cell. The problem then requires them ordered by value, which is why the innermost structure is a priority queue rather than a list. Miss that and you pass the simple cases and fail the hidden ones.</p>`
},
{
  q: "Implement a trie (prefix tree) and use it for autocomplete",
  level: "advanced", hot: true, tags: ["trees", "strings", "design", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Salesforce"],
  a: `<div class="cx"><b>O(L) insert and search</b><span>L = word length, independent of how many words are stored</span><b>O(total chars) space</b></div>
<pre><code>class Trie {
    private static class Node {
        Node[] children = new Node[26];    // a HashMap is better for large alphabets
        boolean isWord;
    }
    private final Node root = new Node();

    public void insert(String word) {
        Node n = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (n.children[i] == null) n.children[i] = new Node();
            n = n.children[i];
        }
        n.isWord = true;                   // marks the END of a complete word
    }

    public boolean search(String word) {
        Node n = find(word);
        return n != null && n.isWord;      // isWord distinguishes "car" from "ca"
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;       // no isWord check — any path will do
    }

    private Node find(String s) {
        Node n = root;
        for (char c : s.toCharArray()) {
            n = n.children[c - 'a'];
            if (n == null) return null;
        }
        return n;
    }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Trie sharing prefixes between car cat and card">
  <circle class="dg-box" cx="60" cy="80" r="16"/><text class="dg-s" x="60" y="85" text-anchor="middle">•</text>
  <circle class="dg-fill" cx="140" cy="80" r="16"/><text class="dg-t" x="140" y="85" text-anchor="middle">c</text>
  <circle class="dg-fill" cx="220" cy="80" r="16"/><text class="dg-t" x="220" y="85" text-anchor="middle">a</text>
  <circle class="dg-fill2" cx="310" cy="44" r="16"/><text class="dg-t" x="310" y="49" text-anchor="middle">r</text>
  <circle class="dg-fill2" cx="310" cy="120" r="16"/><text class="dg-t" x="310" y="125" text-anchor="middle">t</text>
  <circle class="dg-fill2" cx="400" cy="44" r="16"/><text class="dg-t" x="400" y="49" text-anchor="middle">d</text>
  <path class="dg-line" d="M78 80 H122 M158 80 H202 M234 70 L294 52 M234 92 L294 112 M328 44 H382"/>
  <text class="dg-s" x="310" y="22" text-anchor="middle">word</text>
  <text class="dg-s" x="400" y="22" text-anchor="middle">word</text>
  <text class="dg-s" x="310" y="150" text-anchor="middle">word</text>
  <text class="dg-s" x="450" y="88">car, cat, card share "ca" —</text>
  <text class="dg-s" x="450" y="110">stored once, not three times</text>
  <text class="dg-s" x="450" y="132">lookup cost depends on the</text>
  <text class="dg-s" x="450" y="154">word length, never on the count</text>
</svg>
</figure>
<pre><code>// AUTOCOMPLETE — walk to the prefix, then collect words below it
public List&lt;String&gt; autocomplete(String prefix, int limit) {
    List&lt;String&gt; out = new ArrayList&lt;&gt;();
    Node start = find(prefix);
    if (start != null) collect(start, new StringBuilder(prefix), out, limit);
    return out;
}
private void collect(Node n, StringBuilder path, List&lt;String&gt; out, int limit) {
    if (out.size() &gt;= limit) return;
    if (n.isWord) out.add(path.toString());
    for (int i = 0; i &lt; 26; i++) {
        if (n.children[i] == null) continue;
        path.append((char) ('a' + i));
        collect(n.children[i], path, out, limit);
        path.deleteCharAt(path.length() - 1);      // backtrack
    }
}</code></pre>
<table>
<tr><th></th><th>Trie</th><th>HashMap</th><th>Sorted array</th></tr>
<tr><td>Exact lookup</td><td>O(L)</td><td>O(L) hash + compare</td><td>O(L log n)</td></tr>
<tr><td><strong>Prefix search</strong></td><td><strong>O(L)</strong></td><td>O(n·L) — scan everything</td><td>O(L log n) with binary search</td></tr>
<tr><td>Wildcard <code>c.t</code></td><td>Natural — branch on <code>.</code></td><td>Impossible</td><td>Impossible</td></tr>
<tr><td>Memory</td><td>High per node</td><td>Compact</td><td>Most compact</td></tr>
<tr><td>Lexicographic order</td><td>Free — DFS in order</td><td>Needs a sort</td><td>Free</td></tr>
</table>
<p><strong>Where tries earn their memory cost:</strong> search-as-you-type, spell checkers, IP routing tables (longest prefix match), and word-search-in-a-grid, where a trie prunes whole branches of the DFS the moment the prefix stops existing. Add a <code>count</code> or a small top-K heap per node and you get ranked suggestions in O(L) — which is essentially how a production autocomplete works.</p>
<p><strong>The follow-up to be ready for:</strong> "how would you support <code>.</code> as a wildcard?" Answer: at a <code>.</code>, recurse into every non-null child instead of one. That turns the search from O(L) into O(26<sup>d</sup>) where d is the number of wildcards — worth stating, because the interviewer wants the complexity, not just the code.</p>`
}
]);
