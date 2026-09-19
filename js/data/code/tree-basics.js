registerCode("tree-basics", {
intro: `<p>A binary tree is nodes with at most two children. Almost every tree problem is a traversal with one line changed, so the first decision is always <em>which traversal</em>.</p>
<table>
<tr><th>Traversal</th><th>Order</th><th>Use it for</th></tr>
<tr><td><strong>Pre-order</strong></td><td><b>Node</b>, Left, Right</td><td>Copying, serialising, prefix expressions</td></tr>
<tr><td><strong>In-order</strong></td><td>Left, <b>Node</b>, Right</td><td><strong>A BST in sorted order</strong></td></tr>
<tr><td><strong>Post-order</strong></td><td>Left, Right, <b>Node</b></td><td>Anything needing children's answers first — height, diameter, deletion</td></tr>
<tr><td><strong>Level-order</strong></td><td>BFS by depth</td><td>Per-level problems, shallowest anything</td></tr>
</table>
<p><strong>The decision rule:</strong> does this node's answer depend on its children's answers? Then it is post-order. Nearly every "return a value up the tree" problem is post-order even when nobody says the word.</p>
<p><strong>Complexity for all of them:</strong> O(n) time, since every node is visited once. Space is <strong>O(h)</strong>, the height — O(log n) balanced, O(n) skewed. That <em>h</em>, and the skewed worst case, is what the follow-up question is about.</p>
<pre><code>class TreeNode {
    int val;
    TreeNode left, right;
}</code></pre>`,
questions: [
{
  slug: "preorder-traversal", n: 125, title: "Preorder Traversal", difficulty: "easy",
  statement: `<p>Visit the node, then the left subtree, then the right.</p>`,
  approaches: [
    { name: "Recursive", time: "O(n)", space: "O(h)", best: true,
      note: "Three lines that read exactly like the definition.",
      java: `public static void preorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    out.add(node.val);                 // node FIRST
    preorder(node.left, out);
    preorder(node.right, out);
}`,
      python: `def preorder(node, out: list[int]) -> None:
    if node is None:
        return
    out.append(node.val)
    preorder(node.left, out)
    preorder(node.right, out)` },
    { name: "Iterative with a stack", time: "O(n)", space: "O(h)",
      note: "Push RIGHT before LEFT, because a stack reverses order and left must come out first.",
      java: `public static List<Integer> preorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode n = stack.pop();
        out.add(n.val);
        if (n.right != null) stack.push(n.right);   // right first
        if (n.left != null) stack.push(n.left);     // so left pops first
    }
    return out;
}`,
      python: `def preorder(root) -> list[int]:
    out, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)
    return out` }
  ],
  note: `<p>Pre-order is what you want when the parent must be processed before its children — copying a tree, or writing it out so it can be rebuilt in the same shape.</p>`
},
{
  slug: "inorder-traversal", n: 126, title: "Inorder Traversal", difficulty: "easy",
  statement: `<p>Visit the left subtree, then the node, then the right.</p>`,
  approaches: [
    { name: "Recursive", time: "O(n)", space: "O(h)",
      note: "On a BST this emits the values in sorted order, which is the whole reason in-order matters.",
      java: `public static void inorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    inorder(node.left, out);
    out.add(node.val);                 // node in the MIDDLE
    inorder(node.right, out);
}`,
      python: `def inorder(node, out: list[int]) -> None:
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.val)
    inorder(node.right, out)` },
    { name: "Iterative with a stack", time: "O(n)", space: "O(h)", best: true,
      note: "Run left as far as possible, stacking as you go; pop, visit, then turn right. This is the one to know, because it is asked as 'now without recursion'.",
      java: `public static List<Integer> inorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }
        cur = stack.pop();
        out.add(cur.val);
        cur = cur.right;
    }
    return out;
}`,
      python: `def inorder(root) -> list[int]:
    out, stack, cur = [], [], root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        out.append(cur.val)
        cur = cur.right
    return out` }
  ],
  note: `<p><strong>Morris traversal</strong> does this in O(1) space by temporarily threading each node's rightmost predecessor back to it, then undoing the link. Worth naming — "there's an O(1)-space version" — even if you write the stack one.</p>`
},
{
  slug: "postorder-traversal", n: 127, title: "Postorder Traversal", difficulty: "easy",
  statement: `<p>Visit the left subtree, then the right, then the node.</p>`,
  approaches: [
    { name: "Recursive", time: "O(n)", space: "O(h)", best: true,
      note: "The traversal behind height, diameter, subtree sums and safe deletion — anything where children must be finished first.",
      java: `public static void postorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    postorder(node.left, out);
    postorder(node.right, out);
    out.add(node.val);                 // node LAST
}`,
      python: `def postorder(node, out: list[int]) -> None:
    if node is None:
        return
    postorder(node.left, out)
    postorder(node.right, out)
    out.append(node.val)` },
    { name: "Reversed modified pre-order", time: "O(n)", space: "O(n)",
      note: "Do node-right-left with one stack, then reverse. Far easier than a true single-stack post-order, and a neat thing to spot.",
      java: `public static List<Integer> postorder(TreeNode root) {
    LinkedList<Integer> out = new LinkedList<>();
    if (root == null) return out;
    Deque<TreeNode> stack = new ArrayDeque<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode n = stack.pop();
        out.addFirst(n.val);                     // prepend = reverse
        if (n.left != null) stack.push(n.left);
        if (n.right != null) stack.push(n.right);
    }
    return out;
}`,
      python: `def postorder(root) -> list[int]:
    out, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        out.append(node.val)
        if node.left:
            stack.append(node.left)
        if node.right:
            stack.append(node.right)
    return out[::-1]` }
  ],
  note: `<p>Post-order is the only safe order for freeing or deleting a tree: touch the node before its children and you have lost the pointers to them.</p>`
},
{
  slug: "level-order-traversal", n: 128, title: "Level Order Traversal", difficulty: "medium",
  statement: `<p>Return the values grouped by depth, top level first.</p>`,
  approaches: [
    { name: "BFS with a level snapshot", time: "O(n)", space: "O(w)", best: true,
      note: "Freezing the queue size at the top of each round is what turns breadth-first order into LEVELS. Without it you still visit correctly, you just cannot tell where one level ends. w is the maximum width.",
      java: `public static List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();                 // SNAPSHOT this level's width
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode n = queue.poll();
            level.add(n.val);
            if (n.left != null) queue.offer(n.left);
            if (n.right != null) queue.offer(n.right);
        }
        out.add(level);
    }
    return out;
}`,
      python: `from collections import deque

def level_order(root) -> list[list[int]]:
    if not root:
        return []
    out, queue = [], deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):        # snapshot
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        out.append(level)
    return out` }
  ],
  note: `<p>This one template answers right side view (last of each level), level averages, zigzag order, minimum depth and connecting next-right pointers. Learn the shape, not the five problems.</p>`
},
{
  slug: "max-depth", n: 129, title: "Maximum Depth (Height)", difficulty: "easy",
  statement: `<p>Return the number of nodes along the longest root-to-leaf path.</p>`,
  approaches: [
    { name: "Post-order recursion", time: "O(n)", space: "O(h)", best: true,
      note: "One plus the taller child. The classic three-liner, and the base for diameter and the balance check.",
      java: `public static int maxDepth(TreeNode node) {
    if (node == null) return 0;
    return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}`,
      python: `def max_depth(node) -> int:
    if node is None:
        return 0
    return 1 + max(max_depth(node.left), max_depth(node.right))` },
    { name: "BFS level counting", time: "O(n)", space: "O(w)",
      note: "Count the levels. No recursion, so no stack-overflow risk on a badly skewed tree.",
      java: `public static int maxDepth(TreeNode root) {
    if (root == null) return 0;
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    int depth = 0;
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            TreeNode n = queue.poll();
            if (n.left != null) queue.offer(n.left);
            if (n.right != null) queue.offer(n.right);
        }
        depth++;
    }
    return depth;
}`,
      python: `from collections import deque

def max_depth(root) -> int:
    if not root:
        return 0
    queue, depth = deque([root]), 0
    while queue:
        for _ in range(len(queue)):
            node = queue.popleft()
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        depth += 1
    return depth` }
  ],
  note: `<p><strong>Minimum depth is not symmetric.</strong> <code>1 + min(left, right)</code> is wrong: a node with only a right child would report 1, treating a missing child as a leaf. It is not a leaf, it is absent. Either special-case the null side, or use BFS and return at the first leaf — which is also faster on a skewed tree.</p>`
},
{
  slug: "count-nodes-leaves", n: 130, title: "Count Nodes and Leaves", difficulty: "easy",
  statement: `<p>Count all nodes, and separately count the leaves.</p>`,
  approaches: [
    { name: "Post-order recursion", time: "O(n)", space: "O(h)", best: true,
      note: "A leaf is a node with no children — check that before recursing, or a null child is miscounted as a leaf.",
      java: `public static int countNodes(TreeNode node) {
    if (node == null) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
}

public static int countLeaves(TreeNode node) {
    if (node == null) return 0;
    if (node.left == null && node.right == null) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
}`,
      python: `def count_nodes(node) -> int:
    if node is None:
        return 0
    return 1 + count_nodes(node.left) + count_nodes(node.right)

def count_leaves(node) -> int:
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return count_leaves(node.left) + count_leaves(node.right)` },
    { name: "Count a COMPLETE tree in O(log²n)", time: "O(log²n)", space: "O(log n)",
      note: "For a complete tree, compare the leftmost and rightmost depths. Equal means the subtree is perfect and holds 2^h − 1 nodes, with no need to walk it.",
      java: `public static int countComplete(TreeNode root) {
    if (root == null) return 0;
    int left = depthLeft(root), right = depthRight(root);
    if (left == right) return (1 << left) - 1;         // perfect subtree
    return 1 + countComplete(root.left) + countComplete(root.right);
}

private static int depthLeft(TreeNode n) {
    int d = 0;
    while (n != null) { d++; n = n.left; }
    return d;
}

private static int depthRight(TreeNode n) {
    int d = 0;
    while (n != null) { d++; n = n.right; }
    return d;
}`,
      python: `def count_complete(root) -> int:
    if root is None:
        return 0

    def depth(node, go_left: bool) -> int:
        d = 0
        while node:
            d += 1
            node = node.left if go_left else node.right
        return d

    left, right = depth(root, True), depth(root, False)
    if left == right:
        return (1 << left) - 1
    return 1 + count_complete(root.left) + count_complete(root.right)` }
  ],
  note: `<p>The complete-tree trick is the interesting follow-up: it beats O(n) by exploiting a structural guarantee. Mention it only if the problem actually promises completeness — applying it to an arbitrary tree gives wrong counts.</p>`
},
{
  slug: "same-tree", n: 131, title: "Are Two Trees the Same?", difficulty: "easy",
  statement: `<p>Decide whether two trees have identical structure and values.</p>`,
  approaches: [
    { name: "Parallel recursion", time: "O(n)", space: "O(h)", best: true,
      note: "Walk both at once. The null handling is the whole question: both null is equal, one null is not.",
      java: `public static boolean isSame(TreeNode a, TreeNode b) {
    if (a == null && b == null) return true;      // both absent: equal
    if (a == null || b == null) return false;     // only one absent: not
    return a.val == b.val
        && isSame(a.left, b.left)
        && isSame(a.right, b.right);
}`,
      python: `def is_same(a, b) -> bool:
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    return (a.val == b.val
            and is_same(a.left, b.left)
            and is_same(a.right, b.right))` }
  ],
  note: `<p><strong>Subtree of another tree</strong> builds directly on this: for each node of the big tree, ask whether <code>isSame</code> holds there. That is O(n·m), and the linear-time version serialises both trees and runs a substring search.</p>`
},
{
  slug: "symmetric-tree", n: 132, title: "Symmetric Tree", difficulty: "easy",
  statement: `<p>Decide whether a tree is a mirror image of itself.</p>`,
  approaches: [
    { name: "Compare mirrored pairs", time: "O(n)", space: "O(h)", best: true,
      note: "Not the same as comparing a tree with itself. Compare LEFT against RIGHT and RIGHT against LEFT — the crossover is the entire problem.",
      java: `public static boolean isSymmetric(TreeNode root) {
    return root == null || isMirror(root.left, root.right);
}

private static boolean isMirror(TreeNode a, TreeNode b) {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return a.val == b.val
        && isMirror(a.left, b.right)      // CROSSED
        && isMirror(a.right, b.left);     // CROSSED
}`,
      python: `def is_symmetric(root) -> bool:
    def mirror(a, b) -> bool:
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        return (a.val == b.val
                and mirror(a.left, b.right)     # CROSSED
                and mirror(a.right, b.left))

    return root is None or mirror(root.left, root.right)` }
  ],
  note: `<p>Write <code>isMirror(a.left, b.left)</code> instead and you have written <code>isSame</code> — which returns true for every tree compared with itself, so the bug passes the obvious test cases.</p>`
},
{
  slug: "invert-tree", n: 133, title: "Invert (Mirror) a Binary Tree", difficulty: "easy",
  statement: `<p>Swap every node's left and right children.</p>`,
  approaches: [
    { name: "Recursive swap", time: "O(n)", space: "O(h)", best: true,
      note: "Swap the children at every node. Famous for being the question that got Homebrew's author rejected by Google.",
      java: `public static TreeNode invert(TreeNode node) {
    if (node == null) return null;
    TreeNode t = node.left;
    node.left = invert(node.right);
    node.right = invert(t);
    return node;
}`,
      python: `def invert(node):
    if node is None:
        return None
    node.left, node.right = invert(node.right), invert(node.left)
    return node` },
    { name: "Iterative with a queue", time: "O(n)", space: "O(w)",
      note: "Any traversal works, because the swap at each node is independent of every other.",
      java: `public static TreeNode invert(TreeNode root) {
    if (root == null) return null;
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        TreeNode n = queue.poll();
        TreeNode t = n.left; n.left = n.right; n.right = t;
        if (n.left != null) queue.offer(n.left);
        if (n.right != null) queue.offer(n.right);
    }
    return root;
}`,
      python: `from collections import deque

def invert(root):
    if not root:
        return None
    queue = deque([root])
    while queue:
        node = queue.popleft()
        node.left, node.right = node.right, node.left
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return root` }
  ],
  note: `<p>The Java version needs the temporary because <code>node.left = invert(node.right)</code> destroys the original left pointer before the second call reads it. Python's tuple assignment evaluates the whole right-hand side first, so it does not.</p>`
}
]});
