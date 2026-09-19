registerCode("bst", {
intro: `<p>A binary search tree adds one invariant to a binary tree: <strong>everything in the left subtree is smaller, everything in the right is larger</strong>. That single rule turns an O(n) scan into an O(h) descent, because at every node you discard half the remaining possibilities.</p>
<table>
<tr><th>Operation</th><th>Balanced</th><th>Skewed</th></tr>
<tr><td>Search / insert / delete</td><td>O(log n)</td><td><strong>O(n)</strong></td></tr>
<tr><td>Minimum / maximum</td><td>O(log n)</td><td>O(n)</td></tr>
<tr><td>In-order traversal</td><td>O(n), sorted</td><td>O(n), sorted</td></tr>
</table>
<p><strong>The skewed case is the catch.</strong> Insert 1,2,3,4,5 in order into a plain BST and you get a linked list — every operation becomes O(n). Self-balancing trees (AVL, red-black) exist entirely to prevent that, which is why <code>TreeMap</code> is a red-black tree rather than a plain BST.</p>
<p><strong>The property to remember:</strong> an in-order traversal of a BST is sorted. Validation, k-th smallest, range queries and BST-to-list all fall straight out of it.</p>`,
questions: [
{
  slug: "search-bst", n: 147, title: "Search in a BST", difficulty: "easy",
  statement: `<p>Find the node with a given value, or return null.</p>`,
  approaches: [
    { name: "Recursive descent", time: "O(h)", space: "O(h)",
      note: "Compare, then go left or right. Half the tree is discarded at every step.",
      java: `public static TreeNode search(TreeNode node, int target) {
    if (node == null || node.val == target) return node;
    return target < node.val ? search(node.left, target)
                             : search(node.right, target);
}`,
      python: `def search(node, target: int):
    if node is None or node.val == target:
        return node
    return search(node.left, target) if target < node.val else search(node.right, target)` },
    { name: "Iterative", time: "O(h)", space: "O(1)", best: true,
      note: "The descent never branches, so no stack is needed at all. Prefer this — it is shorter and cannot overflow on a skewed tree.",
      java: `public static TreeNode search(TreeNode root, int target) {
    while (root != null && root.val != target)
        root = target < root.val ? root.left : root.right;
    return root;
}`,
      python: `def search(root, target: int):
    while root and root.val != target:
        root = root.left if target < root.val else root.right
    return root` }
  ],
  note: `<p>O(h), not O(log n). Those are the same only when the tree is balanced, and saying "O(h), which is O(log n) if balanced and O(n) if skewed" is the answer that shows you know the difference.</p>`
},
{
  slug: "insert-bst", n: 148, title: "Insert Into a BST", difficulty: "medium",
  statement: `<p>Insert a value, keeping the BST property. The new node always becomes a leaf.</p>`,
  approaches: [
    { name: "Recursive", time: "O(h)", space: "O(h)", best: true,
      note: "Reassigning the returned child is what stitches the new node in — that is why the function returns a node rather than void.",
      java: `public static TreeNode insert(TreeNode node, int value) {
    if (node == null) return new TreeNode(value);
    if (value < node.val)      node.left  = insert(node.left, value);
    else if (value > node.val) node.right = insert(node.right, value);
    // equal: ignore, or keep a count on the node
    return node;
}`,
      python: `def insert(node, value: int):
    if node is None:
        return TreeNode(value)
    if value < node.val:
        node.left = insert(node.left, value)
    elif value > node.val:
        node.right = insert(node.right, value)
    return node` },
    { name: "Iterative", time: "O(h)", space: "O(1)",
      note: "Walk down holding the parent, then attach on the correct side.",
      java: `public static TreeNode insert(TreeNode root, int value) {
    TreeNode fresh = new TreeNode(value);
    if (root == null) return fresh;

    TreeNode cur = root, parent = null;
    while (cur != null) {
        parent = cur;
        if (value == cur.val) return root;          // already present
        cur = value < cur.val ? cur.left : cur.right;
    }
    if (value < parent.val) parent.left = fresh; else parent.right = fresh;
    return root;
}`,
      python: `def insert(root, value: int):
    fresh = TreeNode(value)
    if root is None:
        return fresh

    cur, parent = root, None
    while cur:
        parent = cur
        if value == cur.val:
            return root
        cur = cur.left if value < cur.val else cur.right
    if value < parent.val:
        parent.left = fresh
    else:
        parent.right = fresh
    return root` }
  ],
  note: `<p><strong>Ask what duplicates should do.</strong> Ignore them, keep a count on the node, or always send them one way — all three are defensible, and the question does not answer itself.</p>`
},
{
  slug: "delete-bst", n: 149, title: "Delete From a BST", difficulty: "medium",
  statement: `<p>Remove a value while preserving the BST property.</p>`,
  approaches: [
    { name: "Three cases, replacing with the successor", time: "O(h)", space: "O(h)", best: true,
      note: "A leaf just goes. One child is promoted. Two children is the real case: replace the value with the in-order successor — the smallest in the right subtree — then delete that successor, which by definition has no left child.",
      java: `public static TreeNode delete(TreeNode node, int target) {
    if (node == null) return null;

    if (target < node.val)      node.left  = delete(node.left, target);
    else if (target > node.val) node.right = delete(node.right, target);
    else {
        if (node.left == null)  return node.right;   // 0 or 1 child
        if (node.right == null) return node.left;

        TreeNode successor = node.right;             // smallest on the right
        while (successor.left != null) successor = successor.left;
        node.val = successor.val;                    // copy the value up
        node.right = delete(node.right, successor.val);   // remove the original
    }
    return node;
}`,
      python: `def delete(node, target: int):
    if node is None:
        return None

    if target < node.val:
        node.left = delete(node.left, target)
    elif target > node.val:
        node.right = delete(node.right, target)
    else:
        if node.left is None:
            return node.right
        if node.right is None:
            return node.left

        successor = node.right
        while successor.left:
            successor = successor.left
        node.val = successor.val
        node.right = delete(node.right, successor.val)
    return node` }
  ],
  note: `<p>Why the successor works: it is the next value in sorted order, so putting it here keeps everything on the left smaller and everything on the right larger. The in-order <em>predecessor</em> — largest on the left — works equally well.</p>
<p>The recursive delete of the successor terminates immediately, because a leftmost node has no left child and therefore hits the one-child case.</p>`
},
{
  slug: "validate-bst", n: 150, title: "Is It a Valid BST?", difficulty: "medium",
  statement: `<p>Decide whether a binary tree satisfies the BST property everywhere.</p>`,
  approaches: [
    { name: "Compare with the immediate children", time: "O(n)", space: "O(h)",
      note: "WRONG, and it is the trap the question exists for. It checks neighbours, not the whole subtree.",
      java: `// WRONG: only compares each node with its direct children.
//        10
//       /  \\
//      5    15
//          /  \\
//         6    20     <- 6 < 15 locally, but 6 is in the RIGHT
//                        subtree of 10 and 6 < 10. Not a BST.`,
      python: `# WRONG: only compares each node with its direct children.
#        10
#       /  \\
#      5    15
#          /  \\
#         6    20     <- 6 < 15 locally, but 6 is in the RIGHT
#                        subtree of 10 and 6 < 10. Not a BST.` },
    { name: "Carry a valid range down", time: "O(n)", space: "O(h)", best: true,
      note: "Every node must fit an open interval that narrows as you descend. Use long bounds, or a node holding Integer.MIN_VALUE breaks the comparison.",
      java: `public static boolean isValid(TreeNode root) {
    return check(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private static boolean check(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return check(node.left, min, node.val)
        && check(node.right, node.val, max);
}`,
      python: `def is_valid(root) -> bool:
    def check(node, low: float, high: float) -> bool:
        if node is None:
            return True
        if not low < node.val < high:
            return False
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, float("-inf"), float("inf"))` },
    { name: "In-order must be strictly increasing", time: "O(n)", space: "O(h)",
      note: "Traverse in order and check each value exceeds the previous. Uses the defining property directly, and needs only one variable of state.",
      java: `private static Integer previous = null;

public static boolean isValid(TreeNode node) {
    if (node == null) return true;
    if (!isValid(node.left)) return false;
    if (previous != null && node.val <= previous) return false;
    previous = node.val;
    return isValid(node.right);
}`,
      python: `def is_valid(root) -> bool:
    previous = None

    def walk(node) -> bool:
        nonlocal previous
        if node is None:
            return True
        if not walk(node.left):
            return False
        if previous is not None and node.val <= previous:
            return False
        previous = node.val
        return walk(node.right)

    return walk(root)` }
  ],
  note: `<p>Note <code>&lt;=</code> not <code>&lt;</code> in both correct versions: duplicates break the strict BST property, and using <code>&lt;</code> silently accepts them.</p>`
},
{
  slug: "kth-smallest-bst", n: 151, title: "K-th Smallest Value in a BST", difficulty: "medium",
  statement: `<p>Return the k-th smallest value.</p>`,
  approaches: [
    { name: "Full in-order, then index", time: "O(n)", space: "O(n)",
      note: "Collect everything sorted and take position k−1. Simple, but it walks the whole tree even when k is 1.",
      java: `public static int kthSmallest(TreeNode root, int k) {
    List<Integer> values = new ArrayList<>();
    inorder(root, values);
    return values.get(k - 1);
}`,
      python: `def kth_smallest(root, k: int) -> int:
    values: list[int] = []
    inorder(root, values)
    return values[k - 1]` },
    { name: "In-order with an early exit", time: "O(h + k)", space: "O(h)", best: true,
      note: "Stop the moment the count reaches k. The iterative form makes the early exit natural.",
      java: `public static int kthSmallest(TreeNode root, int k) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }
        cur = stack.pop();
        if (--k == 0) return cur.val;        // stop as soon as we arrive
        cur = cur.right;
    }
    throw new IllegalArgumentException("k is larger than the tree");
}`,
      python: `def kth_smallest(root, k: int) -> int:
    stack, cur = [], root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        k -= 1
        if k == 0:
            return cur.val
        cur = cur.right
    raise ValueError("k is larger than the tree")` }
  ],
  note: `<p><strong>The follow-up:</strong> "what if the tree is modified often and this is queried constantly?" Store a subtree-size count on every node. Then the k-th smallest is an O(h) descent — compare k with the left subtree's size and go one way or the other.</p>`
},
{
  slug: "lca-bst", n: 152, title: "Lowest Common Ancestor in a BST", difficulty: "easy",
  statement: `<p>Find the deepest node that is an ancestor of both given nodes.</p>`,
  approaches: [
    { name: "Walk until the values split", time: "O(h)", space: "O(1)", best: true,
      note: "If both targets are smaller, go left; both larger, go right. The first node that sits between them is the split point, and therefore the LCA.",
      java: `public static TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val)      root = root.left;
        else if (p.val > root.val && q.val > root.val) root = root.right;
        else return root;              // they SPLIT here
    }
    return null;
}`,
      python: `def lca(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val:
            root = root.left
        elif p.val > root.val and q.val > root.val:
            root = root.right
        else:
            return root
    return None` }
  ],
  note: `<p>Much simpler than the general binary-tree LCA, which has to search both subtrees. Here the ordering tells you which way to go, so it is a single O(h) descent with no recursion and no extra space.</p>
<p>A node counts as its own ancestor: <code>LCA(5, 6)</code> is 5 when 6 sits below 5. The <code>else return root</code> branch is what encodes that.</p>`
},
{
  slug: "sorted-array-to-bst", n: 153, title: "Sorted Array to a Balanced BST", difficulty: "easy",
  statement: `<p>Build a height-balanced BST from a sorted array.</p>`,
  approaches: [
    { name: "Middle element as the root", time: "O(n)", space: "O(log n)", best: true,
      note: "Take the middle as the root and recurse on each half. Balance comes free because both halves differ in size by at most one.",
      java: `public static TreeNode build(int[] sorted) {
    return build(sorted, 0, sorted.length - 1);
}

private static TreeNode build(int[] a, int lo, int hi) {
    if (lo > hi) return null;
    int mid = lo + (hi - lo) / 2;
    TreeNode node = new TreeNode(a[mid]);
    node.left  = build(a, lo, mid - 1);
    node.right = build(a, mid + 1, hi);
    return node;
}`,
      python: `def build(sorted_values: list[int]):
    def helper(lo: int, hi: int):
        if lo > hi:
            return None
        mid = lo + (hi - lo) // 2
        node = TreeNode(sorted_values[mid])
        node.left = helper(lo, mid - 1)
        node.right = helper(mid + 1, hi)
        return node

    return helper(0, len(sorted_values) - 1)` }
  ],
  note: `<p>Inserting the values one at a time instead would produce a completely skewed tree — every value larger than the last, so every node becomes a right child. That contrast is exactly why the question is asked.</p>
<p>Passing indices rather than slicing keeps it O(n). Slicing the array at each level would copy O(n) per level and make it O(n log n).</p>`
}
]});
