registerCode("tree-problems", {
intro: `<p>These are the tree questions that actually get asked in senior rounds. Nearly all of them share one shape, worth internalising before the individual problems:</p>
<pre><code>// TREE DP: return what the PARENT needs; update a global for the answer.
int solve(TreeNode node) {
    if (node == null) return 0;
    int left  = solve(node.left);
    int right = solve(node.right);
    best = Math.max(best, /* answer BENDING at this node */);
    return /* what an ancestor can extend */;
}</code></pre>
<p>The two lines return <strong>different things</strong>, and that is the whole idea. A path <em>through</em> a node uses both children; a path an ancestor can <em>extend</em> may use only one. Diameter, maximum path sum, longest univalue path and the balance check are all this template with the middle line changed.</p>
<table>
<tr><th>Direction</th><th>When</th><th>Examples</th></tr>
<tr><td><strong>Pass information down</strong></td><td>A child's answer depends on its ancestors</td><td>Valid BST, count good nodes, path sum</td></tr>
<tr><td><strong>Return information up</strong></td><td>A parent's answer depends on its children</td><td>Height, diameter, LCA, subtree sums</td></tr>
</table>
<p>Before writing anything, answer one question: <em>what does this function return, in one sentence, and what does it update on the side?</em> Nearly every wrong tree solution conflates those two.</p>`,
questions: [
{
  slug: "diameter", n: 134, title: "Diameter of a Binary Tree", difficulty: "easy",
  statement: `<p>Find the longest path between any two nodes, measured in edges. It need not pass through the root.</p>`,
  approaches: [
    { name: "Height computed at every node", time: "O(n²)", space: "O(h)",
      note: "At each node, diameter = left height + right height. Recomputing the heights from scratch per node is what makes it quadratic.",
      java: `public static int diameter(TreeNode node) {
    if (node == null) return 0;
    int through = height(node.left) + height(node.right);
    return Math.max(through,
           Math.max(diameter(node.left), diameter(node.right)));
}`,
      python: `def diameter(node) -> int:
    if node is None:
        return 0
    through = height(node.left) + height(node.right)
    return max(through, diameter(node.left), diameter(node.right))` },
    { name: "One post-order pass", time: "O(n)", space: "O(h)", best: true,
      note: "Return the height upward while updating the best diameter on the side. Each node is visited once.",
      java: `private int best = 0;

public int diameter(TreeNode root) {
    height(root);
    return best;
}

private int height(TreeNode node) {
    if (node == null) return 0;
    int left = height(node.left), right = height(node.right);
    best = Math.max(best, left + right);        // path BENDING here
    return 1 + Math.max(left, right);           // what the parent extends
}`,
      python: `def diameter(root) -> int:
    best = 0

    def height(node) -> int:
        nonlocal best
        if node is None:
            return 0
        left, right = height(node.left), height(node.right)
        best = max(best, left + right)          # bending here
        return 1 + max(left, right)             # what the parent extends

    height(root)
    return best` }
  ],
  note: `<p>Measured in <strong>edges</strong>, so <code>left + right</code> with no <code>+1</code>. If the problem counts <em>nodes</em> instead, it becomes <code>left + right + 1</code>. Ask which — the off-by-one is deliberate in many versions of this question.</p>`
},
{
  slug: "balanced-tree", n: 135, title: "Is the Tree Balanced?", difficulty: "easy",
  statement: `<p>Decide whether every node's two subtrees differ in height by at most one.</p>`,
  approaches: [
    { name: "Check height at every node", time: "O(n²)", space: "O(h)",
      note: "Correct, but recomputes heights repeatedly down the tree.",
      java: `public static boolean isBalanced(TreeNode node) {
    if (node == null) return true;
    if (Math.abs(height(node.left) - height(node.right)) > 1) return false;
    return isBalanced(node.left) && isBalanced(node.right);
}`,
      python: `def is_balanced(node) -> bool:
    if node is None:
        return True
    if abs(height(node.left) - height(node.right)) > 1:
        return False
    return is_balanced(node.left) and is_balanced(node.right)` },
    { name: "Height with a sentinel", time: "O(n)", space: "O(h)", best: true,
      note: "Return −1 to mean 'already unbalanced below'. It propagates straight up and short-circuits the rest of the tree.",
      java: `public static boolean isBalanced(TreeNode root) {
    return height(root) != -1;
}

private static int height(TreeNode node) {
    if (node == null) return 0;
    int left = height(node.left);
    if (left == -1) return -1;                  // already failed below
    int right = height(node.right);
    if (right == -1) return -1;
    if (Math.abs(left - right) > 1) return -1;  // fails here
    return 1 + Math.max(left, right);
}`,
      python: `def is_balanced(root) -> bool:
    def height(node) -> int:
        if node is None:
            return 0
        left = height(node.left)
        if left == -1:
            return -1
        right = height(node.right)
        if right == -1:
            return -1
        if abs(left - right) > 1:
            return -1
        return 1 + max(left, right)

    return height(root) != -1` }
  ],
  note: `<p>Using an impossible value as a failure signal — a real height is never negative — avoids threading a boolean flag through every call. It is the same trick as the <code>amount + 1</code> sentinel in coin change.</p>`
},
{
  slug: "zigzag-level-order", n: 136, title: "Zigzag Level Order", difficulty: "medium",
  statement: `<p>Level-order traversal, but alternate direction each level: left to right, then right to left.</p>`,
  approaches: [
    { name: "BFS with a direction flag", time: "O(n)", space: "O(w)", best: true,
      note: "Traverse normally and reverse alternate levels — or insert at the front, which avoids the reverse entirely.",
      java: `public static List<List<Integer>> zigzag(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    boolean leftToRight = true;

    while (!queue.isEmpty()) {
        int size = queue.size();
        LinkedList<Integer> level = new LinkedList<>();
        for (int i = 0; i < size; i++) {
            TreeNode n = queue.poll();
            if (leftToRight) level.addLast(n.val);
            else             level.addFirst(n.val);     // no reverse needed
            if (n.left != null) queue.offer(n.left);
            if (n.right != null) queue.offer(n.right);
        }
        out.add(level);
        leftToRight = !leftToRight;
    }
    return out;
}`,
      python: `from collections import deque

def zigzag(root) -> list[list[int]]:
    if not root:
        return []
    out, queue, left_to_right = [], deque([root]), True
    while queue:
        level = deque()
        for _ in range(len(queue)):
            node = queue.popleft()
            if left_to_right:
                level.append(node.val)
            else:
                level.appendleft(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        out.append(list(level))
        left_to_right = not left_to_right
    return out` }
  ],
  note: `<p>Do not reverse the <em>queue</em> — only the output order flips. Reversing the queue changes which children get enqueued first and corrupts every level after.</p>`
},
{
  slug: "right-side-view", n: 137, title: "Right Side View", difficulty: "medium",
  statement: `<p>Return the values visible when looking at the tree from the right — the last node of each level.</p>`,
  approaches: [
    { name: "BFS, last of each level", time: "O(n)", space: "O(w)", best: true,
      note: "The level template with one condition: take the node when the loop index is the last of the level.",
      java: `public static List<Integer> rightSideView(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            TreeNode n = queue.poll();
            if (i == size - 1) out.add(n.val);      // the last one
            if (n.left != null) queue.offer(n.left);
            if (n.right != null) queue.offer(n.right);
        }
    }
    return out;
}`,
      python: `from collections import deque

def right_side_view(root) -> list[int]:
    if not root:
        return []
    out, queue = [], deque([root])
    while queue:
        size = len(queue)
        for i in range(size):
            node = queue.popleft()
            if i == size - 1:
                out.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    return out` },
    { name: "DFS, right child first", time: "O(n)", space: "O(h)",
      note: "Visit right before left and record the first node seen at each depth. Shorter, and it generalises to the left view by flipping the order.",
      java: `public static List<Integer> rightSideView(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    dfs(root, 0, out);
    return out;
}

private static void dfs(TreeNode node, int depth, List<Integer> out) {
    if (node == null) return;
    if (depth == out.size()) out.add(node.val);   // first at this depth
    dfs(node.right, depth + 1, out);              // RIGHT first
    dfs(node.left, depth + 1, out);
}`,
      python: `def right_side_view(root) -> list[int]:
    out: list[int] = []

    def dfs(node, depth: int) -> None:
        if node is None:
            return
        if depth == len(out):
            out.append(node.val)
        dfs(node.right, depth + 1)      # RIGHT first
        dfs(node.left, depth + 1)

    dfs(root, 0)
    return out` }
  ],
  note: `<p><code>depth == out.size()</code> is the neat part: it is true exactly once per depth, for whichever node is reached first — which, going right first, is the rightmost.</p>`
},
{
  slug: "top-view", n: 138, title: "Top View of a Tree", difficulty: "medium",
  statement: `<p>Return the nodes visible from directly above, left to right.</p>`,
  approaches: [
    { name: "BFS with horizontal distance", time: "O(n log n)", space: "O(n)", best: true,
      note: "Give the root column 0, left children column−1, right children column+1. The first node seen in each column is the visible one — and it must be BFS, because DFS could reach a deeper node in a column first.",
      java: `public static List<Integer> topView(TreeNode root) {
    if (root == null) return List.of();
    Map<Integer, Integer> firstAtColumn = new TreeMap<>();   // sorted by column
    Deque<Object[]> queue = new ArrayDeque<>();
    queue.offer(new Object[]{root, 0});

    while (!queue.isEmpty()) {
        Object[] pair = queue.poll();
        TreeNode n = (TreeNode) pair[0];
        int column = (int) pair[1];
        firstAtColumn.putIfAbsent(column, n.val);            // keep the FIRST
        if (n.left != null)  queue.offer(new Object[]{n.left, column - 1});
        if (n.right != null) queue.offer(new Object[]{n.right, column + 1});
    }
    return new ArrayList<>(firstAtColumn.values());
}`,
      python: `from collections import deque

def top_view(root) -> list[int]:
    if not root:
        return []
    first: dict[int, int] = {}
    queue = deque([(root, 0)])
    while queue:
        node, column = queue.popleft()
        if column not in first:            # keep the FIRST at each column
            first[column] = node.val
        if node.left:
            queue.append((node.left, column - 1))
        if node.right:
            queue.append((node.right, column + 1))
    return [first[c] for c in sorted(first)]` }
  ],
  note: `<p><strong>BFS is required, not a preference.</strong> With DFS you might reach a deep left-leaning node in column −2 before a shallow one in the same column, and record the wrong value. Level order guarantees the shallowest arrives first.</p>
<p>Bottom view is the same code with <code>put</code> instead of <code>putIfAbsent</code> — keep the last rather than the first.</p>`
},
{
  slug: "vertical-order", n: 139, title: "Vertical Order Traversal", difficulty: "hard",
  statement: `<p>Group nodes by column, top to bottom. Within the same row and column, order by value.</p>`,
  approaches: [
    { name: "Collect (column, row, value), then sort", time: "O(n log n)", space: "O(n)", best: true,
      note: "Record all three coordinates, then sort by column, then row, then value. That exact tie-break order is the difficulty — getting it wrong passes the simple cases and fails the rest.",
      java: `public static List<List<Integer>> verticalOrder(TreeNode root) {
    List<int[]> nodes = new ArrayList<>();        // {column, row, value}
    collect(root, 0, 0, nodes);
    nodes.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                       : a[1] != b[1] ? Integer.compare(a[1], b[1])
                       : Integer.compare(a[2], b[2]));

    List<List<Integer>> out = new ArrayList<>();
    Integer lastColumn = null;
    for (int[] n : nodes) {
        if (lastColumn == null || n[0] != lastColumn) {
            out.add(new ArrayList<>());
            lastColumn = n[0];
        }
        out.get(out.size() - 1).add(n[2]);
    }
    return out;
}

private static void collect(TreeNode node, int column, int row, List<int[]> out) {
    if (node == null) return;
    out.add(new int[]{column, row, node.val});
    collect(node.left, column - 1, row + 1, out);
    collect(node.right, column + 1, row + 1, out);
}`,
      python: `def vertical_order(root) -> list[list[int]]:
    nodes: list[tuple[int, int, int]] = []       # (column, row, value)

    def collect(node, column: int, row: int) -> None:
        if node is None:
            return
        nodes.append((column, row, node.val))
        collect(node.left, column - 1, row + 1)
        collect(node.right, column + 1, row + 1)

    collect(root, 0, 0)
    nodes.sort()                                  # column, then row, then value

    out: list[list[int]] = []
    last_column = None
    for column, _, value in nodes:
        if column != last_column:
            out.append([])
            last_column = column
        out[-1].append(value)
    return out` }
  ],
  note: `<p>Python's tuple sort gives the three-level tie-break for free, which is why this version is so much shorter. In Java the comparator has to spell it out — and the value tie-break is the part people omit.</p>`
},
{
  slug: "path-sum", n: 140, title: "Root-to-Leaf Paths With a Given Sum", difficulty: "medium",
  statement: `<p>Return every root-to-leaf path whose values add up to a target.</p>`,
  approaches: [
    { name: "DFS with backtracking", time: "O(n²)", space: "O(h)", best: true,
      note: "Carry the remaining target down and the path with you. Two details matter: a LEAF is a node with no children, and the path must be copied when recorded.",
      java: `public static List<List<Integer>> pathSum(TreeNode root, int target) {
    List<List<Integer>> out = new ArrayList<>();
    dfs(root, target, new ArrayList<>(), out);
    return out;
}

private static void dfs(TreeNode node, int remain,
                        List<Integer> path, List<List<Integer>> out) {
    if (node == null) return;
    path.add(node.val);
    remain -= node.val;

    if (node.left == null && node.right == null && remain == 0)
        out.add(new ArrayList<>(path));            // COPY
    else {
        dfs(node.left, remain, path, out);
        dfs(node.right, remain, path, out);
    }
    path.remove(path.size() - 1);                  // BACKTRACK
}`,
      python: `def path_sum(root, target: int) -> list[list[int]]:
    out: list[list[int]] = []

    def dfs(node, remain: int, path: list[int]) -> None:
        if node is None:
            return
        path.append(node.val)
        remain -= node.val

        if node.left is None and node.right is None and remain == 0:
            out.append(path[:])          # COPY
        else:
            dfs(node.left, remain, path)
            dfs(node.right, remain, path)
        path.pop()                       # BACKTRACK

    dfs(root, target, [])
    return out` }
  ],
  note: `<p>A node with one child is <strong>not</strong> a leaf. Checking only <code>node.left == null</code> would accept a path ending mid-tree — and with negative values allowed, that produces genuinely wrong answers rather than merely extra ones.</p>
<p>The O(n²) is the path copying, not the traversal: there can be O(n) paths, each O(n) long.</p>`
},
{
  slug: "lca-binary-tree", n: 141, title: "Lowest Common Ancestor", difficulty: "medium",
  statement: `<p>Find the deepest node that is an ancestor of two given nodes, in a plain binary tree with no ordering.</p>`,
  approaches: [
    { name: "Post-order, six lines", time: "O(n)", space: "O(h)", best: true,
      note: "Return a node if it is p, q, or the meeting point below. If both sides come back non-null, the two targets are in opposite subtrees, so THIS node is the split.",
      java: `public static TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left  = lca(root.left, p, q);
    TreeNode right = lca(root.right, p, q);
    if (left != null && right != null) return root;   // found on BOTH sides
    return left != null ? left : right;               // pass up whichever hit
}`,
      python: `def lca(root, p, q):
    if root is None or root is p or root is q:
        return root
    left, right = lca(root.left, p, q), lca(root.right, p, q)
    if left and right:
        return root
    return left or right` }
  ],
  note: `<p><strong>The unstated assumption:</strong> both nodes exist in the tree. If one might be absent, this returns the other one — which is wrong. Guard it with a second pass confirming both were found. Interviewers ask this follow-up almost every time.</p>
<p>The base case <code>root == p || root == q</code> also encodes that a node is its own ancestor, so <code>LCA(5, 6)</code> is 5 when 6 sits below it.</p>`
},
{
  slug: "max-path-sum", n: 142, title: "Maximum Path Sum", difficulty: "hard",
  statement: `<p>Find the largest sum along any path between two nodes. The path need not touch the root, and values may be negative.</p>`,
  approaches: [
    { name: "Post-order with a global best", time: "O(n)", space: "O(h)", best: true,
      note: "The purest example of the tree-DP template. Clamping a negative branch to zero is the same as choosing not to use it at all.",
      java: `private int best = Integer.MIN_VALUE;

public int maxPathSum(TreeNode root) {
    gain(root);
    return best;
}

private int gain(TreeNode node) {
    if (node == null) return 0;
    int left  = Math.max(gain(node.left), 0);     // drop negative branches
    int right = Math.max(gain(node.right), 0);
    best = Math.max(best, node.val + left + right);   // path BENDS here
    return node.val + Math.max(left, right);          // parent extends ONE side
}`,
      python: `def max_path_sum(root) -> int:
    best = float("-inf")

    def gain(node) -> int:
        nonlocal best
        if node is None:
            return 0
        left = max(gain(node.left), 0)            # drop negative branches
        right = max(gain(node.right), 0)
        best = max(best, node.val + left + right)  # bends here
        return node.val + max(left, right)         # parent extends one side

    gain(root)
    return best` }
  ],
  note: `<p>The two lines <strong>must</strong> differ. Returning <code>node.val + left + right</code> would let an ancestor extend a path that already forks — which is not a path. Candidates who return the bent value get plausible but wrong answers.</p>
<p>Seed <code>best</code> with negative infinity, not 0: a tree of all-negative values has a genuine maximum, and 0 would wrongly win.</p>`
},
{
  slug: "build-from-preorder-inorder", n: 143, title: "Build a Tree From Preorder and Inorder", difficulty: "medium",
  statement: `<p>Reconstruct a binary tree from its preorder and inorder traversals, assuming distinct values.</p>`,
  approaches: [
    { name: "Recursive with a value-to-index map", time: "O(n)", space: "O(n)", best: true,
      note: "Preorder gives the root; inorder says which values are left and right of it. The map turns an O(n) search per node into O(1), and the shared pointer must consume LEFT before RIGHT.",
      java: `private int preIndex = 0;
private Map<Integer, Integer> inorderIndex;

public TreeNode build(int[] preorder, int[] inorder) {
    inorderIndex = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) inorderIndex.put(inorder[i], i);
    preIndex = 0;
    return build(preorder, 0, inorder.length - 1);
}

private TreeNode build(int[] preorder, int inLeft, int inRight) {
    if (inLeft > inRight) return null;
    int value = preorder[preIndex++];
    TreeNode root = new TreeNode(value);
    int mid = inorderIndex.get(value);
    root.left  = build(preorder, inLeft, mid - 1);    // LEFT FIRST: preorder
    root.right = build(preorder, mid + 1, inRight);   // is root, left, right
    return root;
}`,
      python: `def build(preorder: list[int], inorder: list[int]):
    index = {v: i for i, v in enumerate(inorder)}
    pre = 0

    def helper(in_left: int, in_right: int):
        nonlocal pre
        if in_left > in_right:
            return None
        value = preorder[pre]
        pre += 1
        root = TreeNode(value)
        mid = index[value]
        root.left = helper(in_left, mid - 1)       # LEFT FIRST
        root.right = helper(mid + 1, in_right)
        return root

    return helper(0, len(inorder) - 1)` }
  ],
  note: `<table>
<tr><th>Given</th><th>Rebuildable?</th></tr>
<tr><td>Preorder + inorder</td><td><strong>Yes</strong></td></tr>
<tr><td>Postorder + inorder</td><td><strong>Yes</strong> — consume postorder from the END, right subtree first</td></tr>
<tr><td>Preorder + postorder</td><td>Only for a <em>full</em> binary tree; otherwise ambiguous</td></tr>
<tr><td>Inorder alone</td><td><strong>No</strong> — every BST with those keys shares it</td></tr>
</table>`
},
{
  slug: "serialize-deserialize", n: 144, title: "Serialize and Deserialize a Tree", difficulty: "hard",
  statement: `<p>Encode a binary tree as a string and rebuild it exactly.</p>`,
  approaches: [
    { name: "Preorder with null markers", time: "O(n)", space: "O(n)", best: true,
      note: "Preorder ALONE does not determine a tree — several trees share one. Explicit null markers make the encoding unique, and that is the entire insight.",
      java: `public String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    write(root, sb);
    return sb.toString();
}

private void write(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }    // the null marker
    sb.append(n.val).append(',');
    write(n.left, sb);
    write(n.right, sb);
}

public TreeNode deserialize(String data) {
    return read(new ArrayDeque<>(Arrays.asList(data.split(","))));
}

private TreeNode read(Deque<String> tokens) {
    String t = tokens.poll();
    if (t == null || t.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(t));
    n.left = read(tokens);                          // order must MATCH
    n.right = read(tokens);                         // the writer
    return n;
}`,
      python: `def serialize(root) -> str:
    parts: list[str] = []

    def write(node) -> None:
        if node is None:
            parts.append("#")
            return
        parts.append(str(node.val))
        write(node.left)
        write(node.right)

    write(root)
    return ",".join(parts)


def deserialize(data: str):
    tokens = iter(data.split(","))

    def read():
        t = next(tokens)
        if t == "#":
            return None
        node = TreeNode(int(t))
        node.left = read()
        node.right = read()
        return node

    return read()` }
  ],
  note: `<p>The reader must consume in exactly the writer's order. Swap the two lines and you silently build a mirrored tree.</p>
<p>For a <strong>BST</strong> the markers are unnecessary — value ranges disambiguate, so preorder alone suffices and the encoding is shorter. That is a good follow-up answer.</p>`
},
{
  slug: "flatten-tree", n: 145, title: "Flatten a Tree Into a Linked List", difficulty: "medium",
  statement: `<p>Flatten the tree in place into a right-leaning list following preorder, with every left pointer null.</p>`,
  approaches: [
    { name: "Reverse post-order with a pointer", time: "O(n)", space: "O(h)",
      note: "Process right, then left, then the node — the reverse of preorder — so each node can simply point at what was built after it.",
      java: `private TreeNode previous = null;

public void flatten(TreeNode node) {
    if (node == null) return;
    flatten(node.right);            // RIGHT first
    flatten(node.left);
    node.right = previous;          // attach what comes after
    node.left = null;
    previous = node;
}`,
      python: `def flatten(root) -> None:
    previous = None

    def walk(node) -> None:
        nonlocal previous
        if node is None:
            return
        walk(node.right)
        walk(node.left)
        node.right, node.left = previous, None
        previous = node

    walk(root)` },
    { name: "Morris-style rewiring", time: "O(n)", space: "O(1)", best: true,
      note: "For each node with a left child, find that subtree's rightmost node, hang the current right subtree off it, then move the left subtree across. No recursion, no stack.",
      java: `public void flatten(TreeNode root) {
    TreeNode cur = root;
    while (cur != null) {
        if (cur.left != null) {
            TreeNode rightmost = cur.left;
            while (rightmost.right != null) rightmost = rightmost.right;
            rightmost.right = cur.right;      // hang the right subtree there
            cur.right = cur.left;             // move the left across
            cur.left = null;
        }
        cur = cur.right;
    }
}`,
      python: `def flatten(root) -> None:
    cur = root
    while cur:
        if cur.left:
            rightmost = cur.left
            while rightmost.right:
                rightmost = rightmost.right
            rightmost.right = cur.right
            cur.right, cur.left = cur.left, None
        cur = cur.right` }
  ],
  note: `<p>The O(1) version is worth writing out: it is the same threading idea as Morris traversal, and it comes up again in "BST to sorted doubly linked list".</p>`
},
{
  slug: "boundary-traversal", n: 146, title: "Boundary of a Binary Tree", difficulty: "medium",
  statement: `<p>Return the boundary anticlockwise: the root, the left edge downward, all leaves left to right, then the right edge upward.</p>`,
  approaches: [
    { name: "Three separate walks", time: "O(n)", space: "O(h)", best: true,
      note: "Left edge excluding leaves, then every leaf, then the right edge reversed and excluding leaves. The exclusions are what stop corner nodes appearing twice.",
      java: `public List<Integer> boundary(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    if (root == null) return out;
    if (!isLeaf(root)) out.add(root.val);          // root, unless it is a leaf

    TreeNode n = root.left;                        // LEFT EDGE, top down
    while (n != null) {
        if (!isLeaf(n)) out.add(n.val);
        n = (n.left != null) ? n.left : n.right;
    }

    leaves(root, out);                             // ALL LEAVES, left to right

    Deque<Integer> rightEdge = new ArrayDeque<>(); // RIGHT EDGE, bottom up
    n = root.right;
    while (n != null) {
        if (!isLeaf(n)) rightEdge.push(n.val);
        n = (n.right != null) ? n.right : n.left;
    }
    out.addAll(rightEdge);
    return out;
}

private boolean isLeaf(TreeNode n) {
    return n.left == null && n.right == null;
}

private void leaves(TreeNode n, List<Integer> out) {
    if (n == null) return;
    if (isLeaf(n)) { out.add(n.val); return; }
    leaves(n.left, out);
    leaves(n.right, out);
}`,
      python: `def boundary(root) -> list[int]:
    if not root:
        return []

    def is_leaf(n) -> bool:
        return n.left is None and n.right is None

    out: list[int] = []
    if not is_leaf(root):
        out.append(root.val)

    node = root.left                          # left edge, top down
    while node:
        if not is_leaf(node):
            out.append(node.val)
        node = node.left or node.right

    def leaves(n) -> None:                    # all leaves, left to right
        if n is None:
            return
        if is_leaf(n):
            out.append(n.val)
            return
        leaves(n.left)
        leaves(n.right)

    leaves(root)

    right: list[int] = []                     # right edge, bottom up
    node = root.right
    while node:
        if not is_leaf(node):
            right.append(node.val)
        node = node.right or node.left
    out.extend(reversed(right))
    return out` }
  ],
  note: `<p>Fiddly rather than deep, and that is the point — it tests whether you enumerate edge cases before coding. A single-node tree, a tree with only a left spine, and a root that is itself a leaf all break naive versions.</p>`
}
]});
