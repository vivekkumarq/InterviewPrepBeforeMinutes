registerCode("tree-advanced", {
intro: `<p>Three structures that come up once you are past the standard tree questions. Each exists because a plain tree or array is the wrong shape for one specific access pattern.</p>
<table>
<tr><th>Structure</th><th>Solves</th><th>Cost</th></tr>
<tr><td><strong>Trie</strong></td><td>Prefix queries — a hash map cannot answer "all words starting with pre"</td><td>O(length) per operation</td></tr>
<tr><td><strong>Fenwick / segment tree</strong></td><td>Range queries <em>with</em> updates — a prefix-sum array breaks on every write</td><td>O(log n) both</td></tr>
<tr><td><strong>AVL / red-black</strong></td><td>Keeping a BST from degenerating into a linked list</td><td>O(log n) guaranteed</td></tr>
</table>
<p>You are rarely asked to write these from memory. You <em>are</em> asked which one you would reach for and why, so lead with the trade-off and write code only if pushed.</p>`,
questions: [
{
  slug: "trie", n: 154, title: "Trie (Prefix Tree)", difficulty: "medium",
  statement: `<p>Implement a prefix tree with <code>insert</code>, <code>search</code> and <code>startsWith</code>.</p>`,
  approaches: [
    { name: "Array of 26 children", time: "O(length)", space: "O(alphabet·nodes)", best: true,
      note: "Each node holds a child per letter plus a terminal flag. Lookup cost depends only on the word length, not on how many words are stored.",
      java: `public class Trie {
    private final Trie[] next = new Trie[26];
    private boolean isWord;

    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.next[i] == null) node.next[i] = new Trie();
            node = node.next[i];
        }
        node.isWord = true;          // WITHOUT this, "app" matches just because
    }                                // "apple" was inserted

    public boolean search(String word) {
        Trie node = walk(word);
        return node != null && node.isWord;
    }

    public boolean startsWith(String prefix) {
        return walk(prefix) != null;
    }

    private Trie walk(String s) {
        Trie node = this;
        for (char c : s.toCharArray()) {
            node = node.next[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }
}`,
      python: `class Trie:
    def __init__(self) -> None:
        self._next: dict[str, "Trie"] = {}
        self._is_word = False

    def insert(self, word: str) -> None:
        node = self
        for ch in word:
            node = node._next.setdefault(ch, Trie())
        node._is_word = True

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node._is_word

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None

    def _walk(self, s: str) -> "Trie | None":
        node = self
        for ch in s:
            node = node._next.get(ch)
            if node is None:
                return None
        return node` }
  ],
  note: `<p><strong>The <code>isWord</code> flag is not optional.</strong> Without it, inserting "apple" would make "app" report as a stored word, because the path exists. That distinction — path exists versus word ends here — is the whole structure.</p>
<p>A hash map gives O(1) exact lookup but cannot answer prefix queries without scanning every key. That is the reason tries exist, and the answer to "why not just use a map?"</p>
<p>The Java version costs 26 references per node even when most are null. For a sparse alphabet use a map per node, as the Python version does.</p>`
},
{
  slug: "range-sum-updates", n: 155, title: "Range Sums With Updates (Segment & Fenwick Trees)", difficulty: "hard",
  statement: `<p>Support two operations on an array: sum a range, and update a single value. Both must be fast.</p>`,
  approaches: [
    { name: "Plain array", time: "O(n) query, O(1) update", space: "O(1)",
      note: "Updates are instant but every range query rescans.",
      java: `// sum(i, j): loop and add. O(n) per query.
// update(i, v): a[i] = v. O(1).`,
      python: `# sum(i, j): loop and add. O(n) per query.
# update(i, v): a[i] = v. O(1).` },
    { name: "Prefix sum array", time: "O(1) query, O(n) update", space: "O(n)",
      note: "The mirror image: queries become a single subtraction, but ONE update invalidates every prefix after it. Fine for a static array, useless when writes are mixed in.",
      java: `// pre[i+1] = pre[i] + a[i]; sum(i, j) = pre[j+1] - pre[i].
// O(1) query, but any update forces an O(n) rebuild.`,
      python: `# pre[i+1] = pre[i] + a[i]; sum(i, j) = pre[j+1] - pre[i].
# O(1) query, but any update forces an O(n) rebuild.` },
    { name: "Fenwick tree (Binary Indexed Tree)", time: "O(log n) both", space: "O(n)", best: true,
      note: "Each slot stores the sum of a power-of-two sized block, determined by the lowest set bit. Far shorter than a segment tree and the right default for plain sums.",
      java: `public class Fenwick {
    private final long[] tree;      // 1-indexed

    public Fenwick(int n) { tree = new long[n + 1]; }

    /** Add delta at position i (0-indexed). */
    public void add(int i, long delta) {
        for (int x = i + 1; x < tree.length; x += x & -x)   // next block up
            tree[x] += delta;
    }

    /** Sum of [0, i] inclusive. */
    public long prefix(int i) {
        long total = 0;
        for (int x = i + 1; x > 0; x -= x & -x)             // strip lowest bit
            total += tree[x];
        return total;
    }

    public long range(int i, int j) { return prefix(j) - prefix(i - 1); }
}`,
      python: `class Fenwick:
    def __init__(self, n: int) -> None:
        self._tree = [0] * (n + 1)      # 1-indexed

    def add(self, i: int, delta: int) -> None:
        x = i + 1
        while x < len(self._tree):
            self._tree[x] += delta
            x += x & -x                 # next block up

    def prefix(self, i: int) -> int:
        total, x = 0, i + 1
        while x > 0:
            total += self._tree[x]
            x -= x & -x                 # strip the lowest set bit
        return total

    def range(self, i: int, j: int) -> int:
        return self.prefix(j) - (self.prefix(i - 1) if i else 0)` },
    { name: "Segment tree", time: "O(log n) both", space: "O(4n)",
      note: "More code, but it generalises beyond sums — min, max, gcd, and lazy range updates. Reach for it when Fenwick cannot express the operation.",
      java: `public class SegmentTree {
    private final int[] tree, source;
    private final int n;

    public SegmentTree(int[] a) {
        n = a.length;
        source = a;
        tree = new int[4 * n];
        build(1, 0, n - 1);
    }

    private void build(int node, int lo, int hi) {
        if (lo == hi) { tree[node] = source[lo]; return; }
        int mid = (lo + hi) / 2;
        build(2 * node, lo, mid);
        build(2 * node + 1, mid + 1, hi);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public void update(int i, int value) { update(1, 0, n - 1, i, value); }

    private void update(int node, int lo, int hi, int i, int value) {
        if (lo == hi) { tree[node] = value; return; }
        int mid = (lo + hi) / 2;
        if (i <= mid) update(2 * node, lo, mid, i, value);
        else          update(2 * node + 1, mid + 1, hi, i, value);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public int query(int l, int r) { return query(1, 0, n - 1, l, r); }

    private int query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;            // no overlap
        if (l <= lo && hi <= r) return tree[node]; // fully inside
        int mid = (lo + hi) / 2;
        return query(2 * node, lo, mid, l, r)
             + query(2 * node + 1, mid + 1, hi, l, r);
    }
}`,
      python: `class SegmentTree:
    def __init__(self, a: list[int]) -> None:
        self._n = len(a)
        self._tree = [0] * (4 * self._n)
        self._build(a, 1, 0, self._n - 1)

    def _build(self, a: list[int], node: int, lo: int, hi: int) -> None:
        if lo == hi:
            self._tree[node] = a[lo]
            return
        mid = (lo + hi) // 2
        self._build(a, 2 * node, lo, mid)
        self._build(a, 2 * node + 1, mid + 1, hi)
        self._tree[node] = self._tree[2 * node] + self._tree[2 * node + 1]

    def update(self, i: int, value: int) -> None:
        self._update(1, 0, self._n - 1, i, value)

    def _update(self, node: int, lo: int, hi: int, i: int, value: int) -> None:
        if lo == hi:
            self._tree[node] = value
            return
        mid = (lo + hi) // 2
        if i <= mid:
            self._update(2 * node, lo, mid, i, value)
        else:
            self._update(2 * node + 1, mid + 1, hi, i, value)
        self._tree[node] = self._tree[2 * node] + self._tree[2 * node + 1]

    def query(self, l: int, r: int) -> int:
        return self._query(1, 0, self._n - 1, l, r)

    def _query(self, node: int, lo: int, hi: int, l: int, r: int) -> int:
        if r < lo or hi < l:
            return 0
        if l <= lo and hi <= r:
            return self._tree[node]
        mid = (lo + hi) // 2
        return (self._query(2 * node, lo, mid, l, r)
                + self._query(2 * node + 1, mid + 1, hi, l, r))` }
  ],
  note: `<p><strong>The selection answer:</strong> static array with many queries → prefix sums. Mixed reads and writes on sums → Fenwick, because it is a quarter of the code. Anything other than a sum, or range updates → segment tree.</p>
<p><code>x &amp; -x</code> isolates the lowest set bit, which is how Fenwick knows the size of the block each slot covers. That one expression is the entire structure.</p>`
},
{
  slug: "avl-tree", n: 156, title: "AVL Tree (Self-Balancing BST)", difficulty: "hard",
  statement: `<p>Implement a BST that rebalances on insert so height stays O(log n).</p>`,
  approaches: [
    { name: "Height tracking with four rotations", time: "O(log n)", space: "O(n)", best: true,
      note: "After each insert, walk back up checking the balance factor. Four cases — left-left, right-right, left-right, right-left — and the last two are just the first two after one extra rotation.",
      java: `public class AVL {
    private static class Node {
        int value, height = 1;
        Node left, right;
        Node(int v) { value = v; }
    }

    private int height(Node n) { return n == null ? 0 : n.height; }
    private int balance(Node n) { return n == null ? 0 : height(n.left) - height(n.right); }
    private void refresh(Node n) { n.height = 1 + Math.max(height(n.left), height(n.right)); }

    private Node rotateRight(Node y) {
        Node x = y.left, moved = x.right;
        x.right = y;
        y.left = moved;
        refresh(y); refresh(x);      // y first: it is now the child
        return x;
    }

    private Node rotateLeft(Node x) {
        Node y = x.right, moved = y.left;
        y.left = x;
        x.right = moved;
        refresh(x); refresh(y);
        return y;
    }

    public Node insert(Node node, int value) {
        if (node == null) return new Node(value);
        if (value < node.value)      node.left = insert(node.left, value);
        else if (value > node.value) node.right = insert(node.right, value);
        else return node;                       // no duplicates

        refresh(node);
        int b = balance(node);

        if (b > 1 && value < node.left.value)  return rotateRight(node);   // LL
        if (b < -1 && value > node.right.value) return rotateLeft(node);   // RR
        if (b > 1) {                                                       // LR
            node.left = rotateLeft(node.left);
            return rotateRight(node);
        }
        if (b < -1) {                                                      // RL
            node.right = rotateRight(node.right);
            return rotateLeft(node);
        }
        return node;
    }
}`,
      python: `class AVLNode:
    __slots__ = ("value", "height", "left", "right")

    def __init__(self, value: int) -> None:
        self.value = value
        self.height = 1
        self.left: "AVLNode | None" = None
        self.right: "AVLNode | None" = None


def _height(n) -> int:
    return n.height if n else 0

def _balance(n) -> int:
    return _height(n.left) - _height(n.right) if n else 0

def _refresh(n) -> None:
    n.height = 1 + max(_height(n.left), _height(n.right))


def _rotate_right(y: AVLNode) -> AVLNode:
    x, moved = y.left, y.left.right
    x.right, y.left = y, moved
    _refresh(y)          # y first: it is now the child
    _refresh(x)
    return x


def _rotate_left(x: AVLNode) -> AVLNode:
    y, moved = x.right, x.right.left
    y.left, x.right = x, moved
    _refresh(x)
    _refresh(y)
    return y


def insert(node, value: int) -> AVLNode:
    if node is None:
        return AVLNode(value)
    if value < node.value:
        node.left = insert(node.left, value)
    elif value > node.value:
        node.right = insert(node.right, value)
    else:
        return node

    _refresh(node)
    b = _balance(node)

    if b > 1 and value < node.left.value:
        return _rotate_right(node)                 # LL
    if b < -1 and value > node.right.value:
        return _rotate_left(node)                  # RR
    if b > 1:                                      # LR
        node.left = _rotate_left(node.left)
        return _rotate_right(node)
    if b < -1:                                     # RL
        node.right = _rotate_right(node.right)
        return _rotate_left(node)
    return node` }
  ],
  note: `<p>Refresh the heights <strong>bottom-up</strong> inside each rotation — the node that moved down must be updated before the one that moved up, or its height is computed from stale children.</p>
<p><strong>AVL vs red-black, the question actually asked:</strong> AVL is more strictly balanced, so lookups are slightly faster; red-black rebalances less on write, so inserts and deletes are cheaper. Java chose red-black for <code>TreeMap</code> and for treeified <code>HashMap</code> buckets because mixed read/write workloads are the common case.</p>`
}
]});
