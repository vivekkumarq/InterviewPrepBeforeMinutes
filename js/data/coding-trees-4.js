appendTopic("coding-trees", [
{
  q: "Level-order traversal and the problems that need the level boundary",
  level: "beginner", hot: true, tags: ["bfs", "trees", "level-order", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Walmart", "Zoho", "Oracle"],
  a: `<pre><code>// THE TEMPLATE — freezing the queue size is what gives you LEVELS
List&lt;List&lt;Integer&gt;&gt; levelOrder(TreeNode root) {
    List&lt;List&lt;Integer&gt;&gt; out = new ArrayList&lt;&gt;();
    if (root == null) return out;
    Deque&lt;TreeNode&gt; q = new ArrayDeque&lt;&gt;();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();                  // SNAPSHOT — this level's width
        List&lt;Integer&gt; level = new ArrayList&lt;&gt;();
        for (int i = 0; i &lt; size; i++) {      // consume exactly this level
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left  != null) q.offer(n.left);
            if (n.right != null) q.offer(n.right);
        }
        out.add(level);
    }
    return out;
}
// Without the snapshot you still visit every node in breadth-first order —
// you just cannot tell where one level ends. Every "per level" problem
// depends on that one line.</code></pre>
<table>
<tr><th>Problem</th><th>Change to the template</th></tr>
<tr><td>Right side view</td><td>Take the <strong>last</strong> node of each level (<code>i == size - 1</code>)</td></tr>
<tr><td>Level averages / maximums</td><td>Aggregate within the inner loop</td></tr>
<tr><td>Zigzag (spiral) order</td><td>A flag per level; <code>Collections.reverse</code>, or <code>addFirst</code> on a deque</td></tr>
<tr><td><strong>Minimum depth</strong></td><td>Return as soon as a leaf is dequeued — BFS finds it first, DFS explores the whole tree</td></tr>
<tr><td>Bottom-up level order</td><td>Build normally, then reverse — or insert at index 0</td></tr>
<tr><td>Connect next right pointers</td><td>Link each node to the next in the same level pass</td></tr>
<tr><td>Vertical order traversal</td><td>BFS carrying <code>(node, column)</code>; group by column, tie-break by row then value</td></tr>
<tr><td>Cousins / same level check</td><td>Track depth and parent together</td></tr>
</table>
<pre><code>// SERIALISE AND DESERIALISE — the other guaranteed level-order question
// Pre-order with explicit null markers is the simplest correct answer.
String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    dfs(root, sb);
    return sb.toString();
}
void dfs(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }      // the null marker matters
    sb.append(n.val).append(',');
    dfs(n.left, sb); dfs(n.right, sb);
}
TreeNode build(Deque&lt;String&gt; tokens) {
    String t = tokens.poll();
    if (t.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(t));
    n.left = build(tokens); n.right = build(tokens);  // order must MATCH
    return n;
}
// Why the null markers? Pre-order ALONE does not determine a binary tree —
// several trees share a pre-order sequence. Explicit nulls make it unique.
// (For a BST you can skip them: the value ranges disambiguate. That is a
// good follow-up answer.)</code></pre>
<pre><code>// MINIMUM DEPTH — the subtle wrong answer
int minDepth(TreeNode n) {
    if (n == null) return 0;
    return 1 + Math.min(minDepth(n.left), minDepth(n.right));   // WRONG
}
// A node with only a right child returns 1 + min(0, depth) = 1, treating the
// missing child as a leaf. It is not a leaf — it is absent.
// Correct: if one side is null, take the OTHER side's depth.
// Or use BFS and return at the first leaf, which sidesteps the trap entirely
// and is faster on a skewed tree.</code></pre>
<p><strong>When to prefer BFS over DFS on a tree:</strong> anything expressed in terms of levels or of "the shallowest" — minimum depth, level order, right side view. DFS is the default for anything that combines results from children upward. Choosing the traversal by what the question measures, rather than by habit, is the signal.</p>`
},
{
  q: "How do you build a tree from traversals, and reason about tree DP?",
  level: "advanced", tags: ["trees", "construction", "dp", "recursion"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Flipkart"],
  a: `<pre><code>// BUILD FROM PRE-ORDER + IN-ORDER
// Pre-order gives you the ROOT (it is the first element).
// In-order tells you which elements are LEFT and which are RIGHT of it.
Map&lt;Integer,Integer&gt; idx = new HashMap&lt;&gt;();     // value -> in-order index
int pre = 0;

TreeNode build(int[] preorder, int inLeft, int inRight) {
    if (inLeft &gt; inRight) return null;
    int val = preorder[pre++];
    TreeNode root = new TreeNode(val);
    int mid = idx.get(val);                      // O(1) instead of scanning
    root.left  = build(preorder, inLeft, mid - 1);   // LEFT FIRST — pre-order
    root.right = build(preorder, mid + 1, inRight);  // consumes in that order
    return root;
}
// The map turns O(n^2) into O(n). Building the left subtree BEFORE the right
// is mandatory: the shared pre pointer walks the pre-order sequence, and
// pre-order is root, left, right.</code></pre>
<table>
<tr><th>Given</th><th>Can you rebuild it?</th></tr>
<tr><td>Pre-order + in-order</td><td><strong>Yes</strong> — assuming distinct values</td></tr>
<tr><td>Post-order + in-order</td><td><strong>Yes</strong> — consume post-order from the END, right subtree first</td></tr>
<tr><td>Pre-order + post-order</td><td>Only for a <em>full</em> binary tree; otherwise ambiguous</td></tr>
<tr><td>Pre-order alone, for a <strong>BST</strong></td><td>Yes — the value ranges disambiguate</td></tr>
<tr><td>In-order alone</td><td><strong>No</strong> — every BST with the same keys has the same in-order</td></tr>
<tr><td>Level-order + in-order</td><td>Yes</td></tr>
</table>
<pre><code>// TREE DP — one post-order pass, returning a value while updating a global
// The shape: the function returns what the PARENT needs; the global tracks
// the answer that may "bend" at any node.

int best = Integer.MIN_VALUE;

int gain(TreeNode n) {                    // MAXIMUM PATH SUM
    if (n == null) return 0;
    int left  = Math.max(gain(n.left),  0);   // a negative branch is dropped
    int right = Math.max(gain(n.right), 0);
    best = Math.max(best, n.val + left + right);   // path BENDING here
    return n.val + Math.max(left, right);          // what the parent can use
}
// The two lines return DIFFERENT things, and that is the whole idea:
// a path through this node uses both children; a path the PARENT extends
// can only use one. Candidates who return the bent value get wrong answers.

// The same shape solves:
//   Diameter               return height, update best = left + right
//   Balanced check         return height, or -1 as an "unbalanced" sentinel
//   House robber III       return {robThis, skipThis} as a pair
//   Longest univalue path  return the run length upward, update the bend
//   Count good nodes       pass the running maximum DOWN, count on the way</code></pre>
<pre><code>// TOP-DOWN vs BOTTOM-UP — worth naming explicitly
// Pass information DOWN (an allowed range, a running max, a depth) when the
//   child's answer depends on its ancestors:   isValidBST, count good nodes
// Return information UP when the parent's answer depends on its children:
//   height, diameter, subtree sums, LCA
// Some problems need BOTH, which is when you pass a parameter down AND
// return a value up in the same function.</code></pre>
<p><strong>The habit that makes tree problems easy:</strong> before writing anything, answer one question — "what does this function return, in one English sentence, and what does it update on the side?" Nearly every wrong tree solution comes from conflating those two, and the maximum-path-sum problem exists specifically to test whether you separate them.</p>`
}
]);
