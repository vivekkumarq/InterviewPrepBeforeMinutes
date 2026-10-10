registerSimple("coding-trees", {
"Path sum problems and the prefix-sum-on-a-tree trick":
`For "does a root-to-leaf path add up to X?", subtract each node's value as you go down and check for 0 at a leaf. For "count downward paths of any start that add up to X", keep a map of running totals from the root to the current node: a path ending here sums to X when (current total - X) was seen higher up. Remove the current total when you go back up.`,

"Balanced trees, tries and when a BST is the wrong choice":
`A plain BST becomes as slow as a list if data arrives in sorted order. <b>Balanced trees</b> (red-black or AVL, used by Java's <code>TreeMap</code>) rebalance themselves to stay fast. A <b>trie</b> is better for prefix searches such as autocomplete. And if you only need exact lookups, not sorted order, a <code>HashMap</code> is faster than any tree.`,

"Which traversal do you pick, and why does in-order matter for a BST?":
`<b>In-order</b> (left, node, right) visits a BST's values in sorted order, which is how you validate a BST or find the kth smallest. <b>Pre-order</b> (node first) suits copying or saving a tree. <b>Post-order</b> (children first) suits answers that need the children's results, such as height. <b>Level-order</b> suits anything per level.`,

"Lowest common ancestor — the three versions you should know":
`The lowest common ancestor is the deepest node that has both target nodes below it. <b>In a BST</b>: walk down from the root; the first node whose value lies between the two targets is the answer. <b>In a binary tree</b>: ask both children; if each side finds one target, the current node is the answer. <b>With parent links</b>: it works like finding where two linked lists meet.`,

"Tries, heaps and balanced trees — which structure for which requirement?":
`Exact lookups: <code>HashMap</code>. Prefix search or autocomplete: a <b>trie</b>. Repeatedly taking the smallest or largest item: a <b>heap</b> (<code>PriorityQueue</code>). Sorted data with range queries such as "all keys between 10 and 20": a <b>balanced tree</b> (<code>TreeMap</code>). Choose by which operation must be fast.`,

"Level-order traversal and the problems that need the level boundary":
`Use a queue: start with the root, and repeatedly take a node and add its children. To know where each level ends, record the queue size at the start of each round and process exactly that many nodes. This answers per-level questions: the last node of each level (right side view), level averages, or the depth of the first leaf.`,

"How do you build a tree from traversals, and reason about tree DP?":
`Pre-order tells you the root (it comes first), and in-order tells you what is on its left and right (everything before and after the root). Repeat this for each side to rebuild the whole tree. "Tree DP" means each node combines answers computed for its children, such as best values with and without including the node.`,

"Build a balanced BST from a sorted array, and flatten a binary tree into a linked list":
`<b>Balanced BST</b>: make the middle element the root, then build the left half and the right half the same way, so both sides have equal size. <b>Flatten</b>: for each node, move its left subtree to the right side, attach the old right subtree at the end of it, and set left to null, so the tree becomes a chain in pre-order.`,

"Print the boundary of a binary tree anticlockwise":
`Print it in three parts without repeating any node: the root, then the left edge from top to bottom (excluding leaves), then all the leaves from left to right, then the right edge from bottom to top (excluding leaves). Each part is a simple walk, and together they trace the outline of the tree.`,

"Tree traversals — inorder, preorder, postorder and level order":
`They differ only in when you visit the node. <b>Inorder</b>: left, node, right (sorted order for a BST). <b>Preorder</b>: node, left, right (copying a tree). <b>Postorder</b>: left, right, node (deleting a tree or calculating sizes). <b>Level order</b>: level by level using a queue. All visit every node once, in O(n).`,

"Validate a binary search tree":
`Every node must be greater than <i>all</i> values in its left subtree and smaller than all in its right subtree, not just its direct children. Pass down an allowed range: going left narrows the maximum, going right narrows the minimum. Alternatively, do an in-order traversal and check that the values only ever increase.`,

"Lowest common ancestor in a binary tree and in a BST":
`<b>Binary tree</b>: recursively search both sides. If the left and right each find one of the two nodes, the current node is the answer; if only one side finds something, pass that up. <b>BST</b>: use the ordering. If both values are smaller, go left; if both are larger, go right; otherwise you are at the answer.`,

"Height, diameter and balance of a binary tree":
`<b>Height</b>: 1 + the taller of the two subtrees. <b>Diameter</b>: the longest path between any two nodes, which at each node equals left height + right height; track the best seen while computing heights. <b>Balanced</b>: at every node, the left and right heights differ by at most 1; return -1 early to signal imbalance. Each is one O(n) pass.`,

"Serialise and deserialise a binary tree":
`To serialise, write the tree as text with a pre-order traversal, including a marker such as "#" for every empty child, so the exact shape is kept. To deserialise, read the values back in the same order: each value makes a node, then build its left and right children recursively, and each "#" means null.`,

"Build a tree from traversals, and check if two trees are identical or symmetric":
`<b>Building</b>: the first value in pre-order is the root; locate it within the in-order sequence to know which values belong on the left and right, then repeat for each side. <b>Identical</b>: same value at the root, and both left subtrees and both right subtrees identical. <b>Symmetric</b>: the left subtree is a mirror image of the right subtree.`,

"Right side view, zigzag level order and vertical order traversal":
`All are level-order traversals with a small twist. <b>Right side view</b>: take the last node of each level. <b>Zigzag</b>: reverse the order on every other level. <b>Vertical order</b>: give the root column 0, a left child column - 1 and a right child column + 1, then group nodes by column from left to right.`,

"Implement a trie (prefix tree) and use it for autocomplete":
`A trie stores words letter by letter: each node has children for the next possible letters and a flag marking the end of a word. Inserting or searching a word takes time proportional to its length. For autocomplete, walk down the letters of the prefix, then collect every word in the subtree below that node.`
});
