registerSimple("dsa", {
"Solve: two sum, three sum and the two-pointer family":
`<b>Two Sum</b>: one pass with a hash map, checking whether each number's partner (target minus the number) has been seen. <b>Three Sum</b>: sort the array, fix one number, then find pairs for the rest with two pointers moving inwards. Skip repeated values carefully so the same triple is not reported twice; that is what interviewers watch for.`,

"Explain and implement the sliding window pattern variants":
`A sliding window examines a continuous range of an array or string without restarting. <b>Fixed size</b>: add the new item and drop the oldest as the window moves. <b>Variable size</b>: grow the right edge one step at a time, and shrink the left edge while the window breaks the rule. It turns many O(n²) problems into O(n).`,

"Solve: LRU cache and design questions with data structures":
`These questions test whether you can combine structures to make every operation fast. For an LRU cache, a hash map finds items instantly and a doubly linked list keeps them in order of use, so get, put and evict are all O(1). The method: list the operations, give each a target speed, and choose structures that achieve it together.`,

"What are the graph algorithms you should know beyond BFS and DFS?":
`<b>Topological sort</b>: order tasks with dependencies. <b>Dijkstra</b>: cheapest path when costs are not negative. <b>Bellman-Ford</b>: cheapest path when some costs are negative. <b>Union-Find</b>: track connected groups. <b>Kruskal and Prim</b>: connect everything at the lowest total cost. <b>Floyd-Warshall</b>: shortest paths between every pair of nodes in small graphs.`,

"Explain the common dynamic programming patterns with examples":
`Common families: <b>1D</b> (climbing stairs, house robber), <b>grids</b> (unique paths, minimum path sum), <b>two sequences</b> (longest common subsequence, edit distance), <b>knapsack</b> (subset sum, coin change), and <b>intervals</b> (palindromes, burst balloons). In each, define what <code>dp[...]</code> means, how it is built from smaller answers, and the base case.`,

"How do you handle system-scale problems — external sorting and streaming algorithms?":
`When data does not fit in memory, process it in pieces. <b>External sort</b>: sort chunks that fit in memory, write each to disk, then merge all the chunks using a heap. <b>Streaming</b>: read the data once while keeping a small summary, such as a top-k heap, a count-min sketch for approximate counts, or reservoir sampling for random picks.`,

"Explain backtracking with the classic problems":
`Backtracking builds a solution one choice at a time, and as soon as a partial solution cannot work, it undoes the last choice and tries the next. Classic problems: generate all subsets or permutations, combination sum, N-Queens, Sudoku and word search. Good pruning, stopping early on dead ends, is what makes it fast enough.`,

"What are bit manipulation tricks worth knowing?":
`XOR of a number with itself is 0, so XOR-ing all numbers finds the one without a pair. <code>n &amp; (n - 1)</code> removes the lowest set bit, which counts set bits or checks for a power of two. Shifting left multiplies by 2. A number's bits can represent a set of small items, which is the basis of bitmask DP.`,

"How do you approach a problem you have never seen before?":
`Follow a method: restate the problem, work through small examples by hand, write a brute-force solution, then ask what work it repeats and which pattern might remove it (hash map, two pointers, sliding window, BFS, DP). Think out loud throughout. Interviewers grade your process as much as your final answer.`,

"What are the string algorithms and problems worth knowing?":
`Common problems: palindromes, anagrams, longest substring without repeats, and string compression. Useful tools: counting arrays or maps for character frequencies, two pointers, sliding windows, and <code>StringBuilder</code> for building strings. For fast pattern search, know the names KMP, Z-function and Rabin-Karp (rolling hash), which run in O(n + m).`,

"Explain the sliding window pattern — and solve 'longest substring without repeating characters'":
`Keep a window [left, right] with no repeated characters. Move right one step at a time. If the new character already appeared inside the window, move left just past its previous position, never backwards, which is why <code>Math.max</code> is used. Track each character's last position in a map and the longest window seen. O(n) time.`,

"How do you approach a dynamic programming problem from scratch?":
`Write the brute-force recursion first and describe the choice at each step. Then define the state (what one subproblem needs to know), the recurrence (how its answer comes from smaller ones) and the base case. Add a cache to avoid repeated work, or fill a table bottom-up, and finally reduce memory if only recent values are needed.`,

"Explain BFS vs DFS — and how do you detect a cycle in a directed graph?":
`<b>BFS</b> explores level by level with a queue and finds the fewest steps. <b>DFS</b> goes as deep as possible first, using recursion or a stack. To detect a cycle in a directed graph, run DFS and mark nodes as "in progress" while their descendants are being explored; reaching an "in progress" node again means there is a cycle.`,

"How do you find the Kth largest element, and when do you use a heap versus sorting?":
`Sorting takes O(n log n) and is simplest when the data is small or you need everything ordered anyway. A min-heap of size k takes O(n log k) and works on streams: keep the k largest seen so far, and the top of the heap is the answer. Quickselect averages O(n) but changes the array and can be slow in the worst case.`,

"How do you approach a coding problem you have never seen before?":
`Clarify the problem and its limits, try small examples, and say the brute-force approach out loud. Then look for repeated work and match the problem to a known pattern. Code cleanly while explaining, then test with normal and edge cases. A clear process that gets most of the way often scores better than a silent, perfect answer.`,

"How do you pick the right data structure for a problem?":
`Decide which operation must be fastest. Lookups by key: hash map. Smallest or largest item: heap. Sorted order or ranges: TreeMap. Access by position: array. Most recent item first: stack. Arrival order: queue. Connections between things: graph. If one structure cannot do everything quickly, combine two.`,

"How do you estimate whether your solution will run in time?":
`A computer does roughly 100 million simple operations per second. Put the input size into your solution's Big O: with n = 100,000, O(n²) is 10 billion steps (far too slow) while O(n log n) is about 1.7 million (instant). Doing this quick calculation before coding tells you whether you need a faster approach.`,

"Which data structure and algorithm topics should you prioritise when time is short?":
`Focus on what appears most often: arrays and strings (hash maps, two pointers, sliding window), then trees (traversals, BST), then graphs (BFS, DFS, topological sort), then dynamic programming basics, binary search, heaps and linked lists. Master the common patterns well rather than covering rare topics shallowly.`,

"How do you derive the time complexity of a recursive algorithm?":
`Write how the problem splits: for example, merge sort solves two halves and then does O(n) of merging, so T(n) = 2T(n/2) + n, which works out to O(n log n). Draw the recursion tree, add up the work at each level, and multiply by the number of levels. Binary search does constant work on one half, which gives O(log n).`,

"What is amortised analysis, and where does it actually matter?":
`Amortised analysis averages the cost over many operations. An <code>ArrayList</code> occasionally has to copy everything into a bigger array, which is slow, but this happens so rarely that adding an item is still O(1) on average. It matters when a few operations are expensive but most are cheap, as in dynamic arrays, hash map resizing and Union-Find.`,

"How do you reason about space complexity, including the hidden costs?":
`Count the extra memory your solution uses beyond the input: new arrays, maps and sets. Do not forget the hidden costs: recursion uses stack space for every level (O(n) for a deep recursion), substrings and copies create new objects, and Java's boxed values such as <code>Integer</code> take much more memory than plain <code>int</code>.`,

"Design a set with insert, delete and getRandom, all in O(1)":
`Store the values in an array list, so a random index gives a random element instantly, and keep a hash map from each value to its position in the list. To delete a value, move the last element into its slot, update that element's position in the map, and remove the last slot. Every operation stays O(1).`,

"Design a time-based key-value store: get the value as of any timestamp":
`For each key, keep a list of (timestamp, value) pairs. Timestamps usually arrive in increasing order, so the list stays sorted and adding is O(1). To read the value at a given time, binary-search that key's list for the latest timestamp that is less than or equal to the requested time: O(log k).`,

"Explain Big-O notation and the complexity of common operations":
`Big O describes how running time or memory grows with input size, ignoring constant factors. Common costs: array access and HashMap lookup are O(1); binary search and TreeMap operations are O(log n); a single loop is O(n); sorting is O(n log n); nested loops over the same data are O(n²).`,

"What are the essential array and string techniques?":
`The main tools: <b>hash maps</b> for counting and "seen before", <b>two pointers</b> for sorted data and pairs, <b>sliding window</b> for continuous ranges, <b>prefix sums</b> for range totals, <b>sorting</b> to bring related items together, and <b>binary search</b> for sorted data. Most array problems are solved with one or two of these.`,

"Explain and implement binary search, including its variants":
`Keep a low and a high index, check the middle, and discard the half that cannot contain the target, repeating until found or the range is empty. Use <code>lo + (hi - lo) / 2</code> to avoid overflow. Variants: find the first or last occurrence, search a rotated array, or binary-search the answer itself, such as the smallest capacity that works.`,

"Compare the common sorting algorithms":
`Bubble, selection and insertion sort are simple but O(n²); insertion sort is fast on nearly sorted data. Merge sort is always O(n log n) and stable but needs extra memory. Quicksort is usually fastest in practice but O(n²) in the worst case. Heap sort is O(n log n) with no extra memory. Java uses quicksort for primitives and TimSort for objects.`,

"Implement the common linked list problems":
`Two techniques solve most of them. A <b>dummy head node</b> avoids special cases at the start of the list. <b>Fast and slow pointers</b> find the middle, detect cycles and find the kth node from the end. Add in-place reversal and merging of sorted lists, and you can handle almost every linked list question.`,

"Explain tree traversals and implement them":
`<b>Inorder</b> (left, node, right) gives sorted output for a BST. <b>Preorder</b> (node, left, right) suits copying or saving a tree. <b>Postorder</b> (left, right, node) suits calculations that need the children first, such as height. <b>Level order</b> uses a queue to visit level by level. All are O(n) and are written recursively or with an explicit stack or queue.`,

"What are BFS and DFS on graphs, and when do you use each?":
`<b>BFS</b> uses a queue and explores in rings, so it finds the shortest path when every edge costs the same. <b>DFS</b> uses recursion or a stack and goes deep first, which suits exploring everything, detecting cycles, topological sorting and backtracking. Both visit every node and edge once, O(V + E), with a visited set to avoid loops.`,

"What is dynamic programming and how do you recognise it?":
`Dynamic programming solves a problem by combining answers to smaller versions of it, saving each answer so it is computed only once. Recognise it when the problem asks for a count of ways, a minimum or maximum, or whether something is possible, and a simple recursion would solve the same subproblems again and again.`,

"Solve: find the longest substring without repeating characters":
`Brute force checks every substring for repeats, O(n³). Instead, use a sliding window: move the right edge forward, and when you meet a character already in the window, jump the left edge past that character's previous position. Remember each character's last position in a map. Track the largest window size. O(n) time.`,

"Solve: merge intervals":
`Sort the intervals by start time. Then any interval can only overlap the one just before it in the merged list. Go through them: if the current interval starts on or before the last merged interval ends, extend that end to the larger value; otherwise, start a new merged interval. O(n log n) because of the sort.`,

"Explain HashMap, HashSet and when to use a heap or a trie":
`Use a <b>HashMap</b> to look up values by key instantly, or to count things, and a <b>HashSet</b> to check "have I seen this?" instantly. Use a <b>heap</b> when you repeatedly need the smallest or largest item, as in top-k or scheduling. Use a <b>trie</b> for prefix searches, such as autocomplete or "does any word start with…".`,

"How do you approach a coding problem in an interview?":
`Restate the problem and ask clarifying questions about the input. Work through an example by hand. Describe a brute-force solution and its complexity, then improve it. Code it cleanly while explaining your thinking, then test it with your examples and edge cases, and state the final time and space complexity.`,

"Solve: validate a binary search tree and find the kth smallest element":
`<b>Validate</b>: every node must lie within a range set by its ancestors, not just compare with its direct children. Pass down a minimum and maximum as you go, or check that an inorder traversal is strictly increasing. <b>Kth smallest</b>: an inorder traversal of a BST visits values in sorted order, so stop at the kth node you visit.`,

"What are the most-asked coding problems you should be able to write from memory?":
`A core set: Two Sum, best time to buy and sell stock, longest substring without repeats, merge intervals, valid parentheses, reverse a linked list, detect a cycle, merge two sorted lists, tree traversals, validate a BST, number of islands, course schedule, climbing stairs, coin change, binary search, top-k with a heap, and an LRU cache.`
});
