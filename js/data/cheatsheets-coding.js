registerSheet("coding-basics", [
  { h: "The warm-ups, in one place", t: "code", lang: "java", code:
"// reverse a string\nnew StringBuilder(s).reverse().toString();\n\n// palindrome — two pointers, no allocation\nfor (int i = 0, j = s.length()-1; i < j; i++, j--)\n    if (s.charAt(i) != s.charAt(j)) return false;\n\n// swap without a temp (know the i==j aliasing trap)\na ^= b; b ^= a; a ^= b;\n\n// prime — only to sqrt(n), stepping by 2\nif (n < 2) return false;\nif (n % 2 == 0) return n == 2;\nfor (int i = 3; (long) i * i <= n; i += 2) if (n % i == 0) return false;\n\n// sum of digits / reverse a number\nwhile (n > 0) { sum += n % 10; n /= 10; }" },
  { h: "Anagram, duplicates, frequency", t: "code", lang: "java", code:
"// anagram — counts, O(n); sorting is O(n log n)\nint[] c = new int[26];\nfor (char ch : a.toCharArray()) c[ch-'a']++;\nfor (char ch : b.toCharArray()) if (--c[ch-'a'] < 0) return false;\n\n// first non-repeating character\nMap<Character,Integer> f = new LinkedHashMap<>();\nfor (char ch : s.toCharArray()) f.merge(ch, 1, Integer::sum);\n\n// duplicates\nSet<Integer> seen = new HashSet<>();\nfor (int x : a) if (!seen.add(x)) return x;" },
  { h: "Edge cases they check", t: "list", items: [
    "Empty string / empty array / single element",
    "<code>null</code> input — ask whether it is possible",
    "Negative numbers, and <code>Integer.MIN_VALUE</code> (its absolute value overflows)",
    "Overflow: use <code>long</code>, or <code>lo + (hi-lo)/2</code>",
    "Case sensitivity and Unicode — <code>charAt</code> is a UTF-16 <i>code unit</i>, not always a character",
    "Duplicates, and whether the input is already sorted"
  ]},
  { h: "Say this", t: "quote", text: "State the brute force first — you then have a working solution to fall back on. Then name the bottleneck: what am I recomputing that I could remember?" }
]);

registerSheet("coding-arrays", [
  { h: "Pattern picker", t: "table", rows: [
    ["Signal", "Pattern"],
    ["Sorted + find a pair", "Two pointers from both ends"],
    ["Contiguous window, size k or condition", "Sliding window"],
    ["Range sum queries", "Prefix sums"],
    ["Max/min subarray sum", "Kadane"],
    ["Sorted array, find a value", "Binary search"],
    ["Three-way partition", "Dutch national flag"],
    ["Find pair summing to target (unsorted)", "HashMap of value → index"],
    ["Product except self", "Prefix × suffix passes"]
  ]},
  { h: "Sliding window template", t: "code", lang: "java", code:
"int left = 0, best = 0;\nfor (int right = 0; right < n; right++) {\n    add(a[right]);\n    while (invalid()) { remove(a[left]); left++; }   // left NEVER resets\n    best = Math.max(best, right - left + 1);\n}\n// Total pointer movement is 2n, so this is O(n) despite the nested loop." },
  { h: "Kadane", t: "code", lang: "java", code:
"int cur = a[0], best = a[0];\nfor (int i = 1; i < n; i++) {\n    cur = Math.max(a[i], cur + a[i]);   // extend, or start fresh here\n    best = Math.max(best, cur);\n}\n// Start at a[0], not 0 — an all-negative array must return its largest element." },
  { h: "Two pointers", t: "code", lang: "java", code:
"// sorted two-sum\nint i = 0, j = n - 1;\nwhile (i < j) {\n    int s = a[i] + a[j];\n    if (s == target) return new int[]{i, j};\n    if (s < target) i++; else j--;\n}\n\n// in-place removal / move zeros: slow write pointer, fast read pointer\nint w = 0;\nfor (int r = 0; r < n; r++) if (a[r] != 0) a[w++] = a[r];\nwhile (w < n) a[w++] = 0;" },
  { h: "Rotate", t: "code", lang: "java", code:
"// rotate right by k — the reversal trick, O(1) space\nk %= n;\nreverse(a, 0, n-1); reverse(a, 0, k-1); reverse(a, k, n-1);\n\n// rotate a matrix 90° clockwise: transpose, then reverse each row" }
]);

registerSheet("coding-linked-list", [
  { h: "The three primitives", t: "code", lang: "java", code:
"// REVERSE\nListNode prev = null, cur = head;\nwhile (cur != null) { ListNode nx = cur.next; cur.next = prev; prev = cur; cur = nx; }\nreturn prev;\n\n// MIDDLE (slow/fast)\nListNode s = head, f = head;\nwhile (f != null && f.next != null) { s = s.next; f = f.next.next; }\n\n// CYCLE — Floyd, then find the entry\nwhile (f != null && f.next != null) {\n    s = s.next; f = f.next.next;\n    if (s == f) { s = head; while (s != f) { s = s.next; f = f.next; } return s; }\n}" },
  { h: "Why the entry-finding works", t: "quote", text: "Meeting point is a distance k inside the cycle, where k is the distance from head to the cycle entry modulo the loop length. Restart one pointer at head, move both one step, and they meet at the entry." },
  { h: "Dummy head", t: "code", lang: "java", code:
"ListNode dummy = new ListNode(0, head);\n// Removes every 'is it the first node?' special case:\n// remove Nth from end, merge two lists, remove duplicates, partition.\nreturn dummy.next;" },
  { h: "Problem map", t: "table", rows: [
    ["Problem", "Technique"],
    ["Reverse in k-groups", "Reverse, recursing on the remainder"],
    ["Merge two sorted lists", "Dummy head + two pointers"],
    ["Merge k sorted lists", "Min-heap, O(N log k)"],
    ["Remove Nth from end", "Two pointers n apart, one pass"],
    ["Palindrome list", "Find middle, reverse half, compare"],
    ["Intersection of two lists", "Swap heads at the end — both walk a+b"],
    ["<b>LRU cache</b>", "<b>HashMap + doubly linked list</b>"],
    ["Copy list with random pointer", "Interleave copies, or a map"]
  ]},
  { h: "LRU cache", t: "code", lang: "java", code:
"// O(1) get and put: HashMap for lookup, DLL for recency order.\n// get  -> move node to front\n// put  -> insert at front; if over capacity, evict the tail\n\n// Or, in Java, for free:\nnew LinkedHashMap<K,V>(cap, 0.75f, true) {   // true = ACCESS order\n    protected boolean removeEldestEntry(Map.Entry<K,V> e) { return size() > cap; }\n};" }
]);

registerSheet("coding-stack-queue", [
  { h: "Monotonic stack", t: "code", lang: "java", code:
"// NEXT GREATER ELEMENT — stack holds INDICES, values decreasing\nDeque<Integer> st = new ArrayDeque<>();\nfor (int i = 0; i < n; i++) {\n    while (!st.isEmpty() && a[st.peek()] < a[i]) out[st.pop()] = a[i];\n    st.push(i);\n}\n// Each index pushed and popped once -> O(n), not O(n^2)." },
  { h: "Which direction", t: "table", rows: [
    ["Problem", "Stack keeps", "Pop when"],
    ["Next greater right", "Decreasing", "current &gt; top"],
    ["Next smaller right", "Increasing", "current &lt; top"],
    ["Daily temperatures", "Decreasing indices", "Answer is the index difference"],
    ["Largest rectangle in histogram", "Increasing heights", "Width spans prev/next smaller"],
    ["Trapping rain water", "Decreasing", "Each pop bounds a water layer"],
    ["Stock span", "Decreasing", "Count consecutive smaller days"]
  ]},
  { h: "Sliding window maximum", t: "code", lang: "java", code:
"Deque<Integer> dq = new ArrayDeque<>();          // indices, values decreasing\nfor (int i = 0; i < n; i++) {\n    if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();   // slid out\n    while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();\n    dq.offerLast(i);\n    if (i >= k-1) out[i-k+1] = a[dq.peekFirst()];\n}\n// Anything smaller that arrived earlier can never win: store INDICES." },
  { h: "Min stack", t: "code", lang: "java", code:
"void push(int x) {\n    data.push(x);\n    mins.push(mins.isEmpty() || x <= mins.peek() ? x : mins.peek());\n}\n// <= not < : duplicates of the minimum must each be recorded, or popping\n// one of them loses the minimum. Interviewers test push(2); push(2); pop()." },
  { h: "Balanced brackets", t: "quote", text: "With one bracket type a counter is enough. With three, \"([)]\" has balanced counts and invalid nesting — that case is the whole reason the problem needs a stack. Use ArrayDeque, not Stack (which extends Vector and iterates the wrong way)." }
]);

registerSheet("coding-trees", [
  { h: "Traversals", t: "code", lang: "java", code:
"inorder   : left,  ROOT, right   ->  a BST comes out SORTED\npreorder  : ROOT,  left, right   ->  copy / serialise\npostorder : left,  right, ROOT   ->  delete, height, diameter\nlevel     : BFS with a queue     ->  shortest path, views\n\n// The name says where the ROOT is visited; children are always left then right.\n\n// Iterative inorder\nwhile (cur != null || !st.isEmpty()) {\n    while (cur != null) { st.push(cur); cur = cur.left; }\n    cur = st.pop(); visit(cur); cur = cur.right;\n}" },
  { h: "BFS by level", t: "code", lang: "java", code:
"while (!q.isEmpty()) {\n    int size = q.size();            // CAPTURE before adding children\n    for (int i = 0; i < size; i++) {\n        var n = q.poll();\n        if (i == size - 1) rightView.add(n.val);\n        if (n.left != null) q.offer(n.left);\n        if (n.right != null) q.offer(n.right);\n    }\n}" },
  { h: "The post-order shape", t: "code", lang: "java", code:
"// height, diameter, balanced, max path sum are ALL this:\nint dfs(Node n) {\n    if (n == null) return 0;\n    int l = dfs(n.left), r = dfs(n.right);\n    best = Math.max(best, l + r);        // record the THROUGH path\n    return 1 + Math.max(l, r);           // report ONE side to the parent\n}\n// What you report upward differs from what you record. That is the trick." },
  { h: "Validate a BST", t: "code", lang: "java", code:
"boolean valid(Node n, Long min, Long max) {\n    if (n == null) return true;\n    if (min != null && n.val <= min) return false;\n    if (max != null && n.val >= max) return false;\n    return valid(n.left, min, (long) n.val)\n        && valid(n.right, (long) n.val, max);\n}\n// Comparing only parent-to-child is the classic WRONG answer:\n//   10 -> right 15 -> left 6.  6 < 15 passes, but 6 < 10 is illegal.\n// Use Long/null, not Integer.MIN_VALUE — a node may hold that value." },
  { h: "LCA", t: "code", lang: "java", code:
"// General binary tree — the whole solution\nif (root == null || root == p || root == q) return root;\nvar l = lca(root.left, p, q); var r = lca(root.right, p, q);\nreturn (l != null && r != null) ? root : (l != null ? l : r);\n\n// BST — the ordering removes the search: O(h), O(1) space\nwhile (root != null) {\n    if (p.val < root.val && q.val < root.val) root = root.left;\n    else if (p.val > root.val && q.val > root.val) root = root.right;\n    else return root;\n}" }
]);

registerSheet("coding-graphs", [
  { h: "BFS vs DFS vs Dijkstra", t: "table", rows: [
    ["Situation", "Algorithm", "Cost"],
    ["Unweighted shortest path", "<b>BFS</b>", "O(V+E)"],
    ["Reachability, cycles, components", "DFS", "O(V+E)"],
    ["Non-negative weights", "<b>Dijkstra</b>", "O((V+E) log V)"],
    ["<b>Negative</b> weights", "Bellman-Ford", "O(V·E)"],
    ["All pairs, dense", "Floyd-Warshall", "O(V³)"],
    ["Weights only 0 and 1", "0-1 BFS with a deque", "O(V+E)"]
  ]},
  { h: "Grid flood fill", t: "code", lang: "java", code:
"void sink(char[][] g, int r, int c) {\n    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return;\n    g[r][c] = '0';                       // mark visited\n    sink(g,r+1,c); sink(g,r-1,c); sink(g,r,c+1); sink(g,r,c-1);\n}\n// BFS variant: mark on ENQUEUE, never on dequeue, or cells queue many times.\n// Multi-source BFS (rotting oranges): enqueue every source first." },
  { h: "Topological sort — Kahn", t: "code", lang: "java", code:
"for (int i = 0; i < n; i++) if (indeg[i] == 0) q.offer(i);\nwhile (!q.isEmpty()) {\n    int u = q.poll(); order[idx++] = u;\n    for (int v : adj.get(u)) if (--indeg[v] == 0) q.offer(v);\n}\nreturn idx == n ? order : NO_ORDER;   // fewer than n emitted -> CYCLE\n\n// Use a PriorityQueue for the lexicographically smallest order." },
  { h: "Cycle detection", t: "table", rows: [
    ["Graph", "Method"],
    ["<b>Undirected</b>, DFS", "A visited neighbour that is <b>not the parent</b>"],
    ["<b>Undirected</b>, Union-Find", "<code>union</code> returns false — usually cleanest"],
    ["<b>Directed</b>, DFS", "Back edge to a node still <b>on the stack</b> (3 colours)"],
    ["<b>Directed</b>, BFS", "Kahn emits fewer than V nodes"]
  ]},
  { h: "Union-Find", t: "code", lang: "java", code:
"int find(int x) {                        // path compression\n    while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }\n    return x;\n}\nboolean union(int a, int b) {             // union by rank\n    int ra = find(a), rb = find(b);\n    if (ra == rb) return false;           // already connected -> a CYCLE\n    if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }\n    p[rb] = ra;\n    if (rank[ra] == rank[rb]) rank[ra]++;\n    return true;\n}\n// O(α(n)) — but you need BOTH optimisations; either alone gives O(log n)." },
  { h: "Backtracking template", t: "code", lang: "java", code:
"void backtrack(State s, List<Sol> out) {\n    if (complete(s)) { out.add(new ArrayList<>(s.current)); return; }  // COPY\n    for (Choice c : candidates(s)) {\n        if (!valid(s, c)) continue;    // pruning is where the speed comes from\n        apply(s, c);\n        backtrack(s, out);\n        undo(s, c);                    // undo EXACTLY what you did\n    }\n}\n// N-Queens: same column, same (row-col), same (row+col) -> 3 hash sets, O(1)." }
]);

registerSheet("coding-dp", [
  { h: "How to present a DP answer", t: "list", items: [
    "Name the <b>state</b> in one sentence: “dp[i] is the max loot using the first i houses.”",
    "Write the <b>recurrence</b> and justify each branch aloud.",
    "State the <b>base cases</b> and the iteration order.",
    "Only <i>then</i> mention the space optimisation."
  ]},
  { h: "Classic recurrences", t: "table", rows: [
    ["Problem", "Recurrence"],
    ["Climbing stairs", "<code>dp[i] = dp[i-1] + dp[i-2]</code>"],
    ["House robber", "<code>max(dp[i-1], dp[i-2] + a[i])</code>"],
    ["House robber II (circular)", "Run it twice, excluding first / last"],
    ["LCS", "match → <code>dp[i-1][j-1]+1</code>; else <code>max(up, left)</code>"],
    ["Edit distance", "match → diagonal; else <code>1 + min(all three)</code>"],
    ["Coin change (min)", "<code>dp[a] = min(dp[a], dp[a-c] + 1)</code>"],
    ["Maximal square", "<code>1 + min(up, left, diagonal)</code>"],
    ["Unique paths", "<code>dp[r][c] = up + left</code>"]
  ]},
  { h: "Knapsack loop direction", t: "code", lang: "java", code:
"// 0/1 — each item ONCE  -> capacity DOWNWARD\nfor (int i = 0; i < n; i++)\n    for (int w = W; w >= wt[i]; w--)\n        dp[w] = Math.max(dp[w], dp[w-wt[i]] + val[i]);\n\n// UNBOUNDED — reusable -> capacity UPWARD\n    for (int w = wt[i]; w <= W; w++)\n\n// Downward reads a cell not yet updated this round (previous item's row).\n// Upward reads one already updated with this item, so it is reused." },
  { h: "Coin change II — the other loop trap", t: "code", lang: "java", code:
"// ✔ COMBINATIONS (1+2 counted once)      ✗ PERMUTATIONS (1+2 and 2+1)\nfor (int c : coins)                        for (int a = 1; a <= amt; a++)\n  for (int a = c; a <= amt; a++)             for (int c : coins)\n    dp[a] += dp[a-c];                          if (c <= a) dp[a] += dp[a-c];" },
  { h: "LIS in O(n log n)", t: "code", lang: "java", code:
"List<Integer> tails = new ArrayList<>();\nfor (int x : nums) {\n    int i = Collections.binarySearch(tails, x);\n    if (i < 0) i = -(i + 1);\n    if (i == tails.size()) tails.add(x); else tails.set(i, x);\n}\nreturn tails.size();\n// tails is NOT the subsequence — only its LENGTH is meaningful.\n// Claiming otherwise is the standard way this question is failed." },
  { h: "Complexity note", t: "quote", text: "Knapsack's O(n·W) is pseudo-polynomial — W is a value, not an input size. A capacity of 10⁹ is intractable with 3 items. Knapsack is NP-complete; the DP is efficient only when W is small." }
]);

registerSheet("coding-greedy", [
  { h: "When greedy is correct", t: "list", items: [
    "<b>Greedy choice property</b> — a locally optimal choice can build a global optimum.",
    "<b>Optimal substructure</b> — what remains is the same problem, smaller.",
    "Prove it with an <b>exchange argument</b>: any optimum can be modified to include my greedy choice without getting worse.",
    "Try to break it with a 3–4 element counter-example <i>before</i> the interviewer does.",
    "Coins [1,3,4], amount 6: greedy gives 4+1+1, optimal is 3+3. That is why coin change needs DP."
  ]},
  { h: "Intervals — which sort key", t: "table", rows: [
    ["Goal", "Sort by", "Then"],
    ["Merge overlaps", "<b>start</b>", "Extend while <code>next.start ≤ cur.end</code>"],
    ["Minimum rooms", "<b>start</b>", "Min-heap of end times, or a sweep line"],
    ["Most non-overlapping", "<b>end</b>", "Greedily keep the earliest finisher"],
    ["Min arrows to burst balloons", "<b>end</b>", "Same greedy"],
    ["Insert interval", "already sorted", "Three phases, O(n), no sort"]
  ]},
  { h: "Heap patterns", t: "table", rows: [
    ["Problem", "Heap"],
    ["K <b>largest</b>", "<b>Min</b>-heap of size k — the root is what you evict"],
    ["K smallest", "Max-heap of size k"],
    ["K closest points", "Max-heap on <i>squared</i> distance"],
    ["Kth largest in a stream", "Min-heap of size k — the root <i>is</i> the answer"],
    ["<b>Median of a stream</b>", "<b>Two heaps</b>, sizes within 1"],
    ["Merge k sorted lists", "Min-heap of size k"],
    ["Task scheduler", "Max-heap by remaining count"]
  ]},
  { h: "Greedy on arrays", t: "code", lang: "java", code:
"// JUMP GAME — furthest reachable\nint furthest = 0;\nfor (int i = 0; i < n; i++) {\n    if (i > furthest) return false;\n    furthest = Math.max(furthest, i + a[i]);\n}\n\n// GAS STATION — restart wherever the tank goes negative\nif (tank < 0) { start = i + 1; tank = 0; }\nreturn total >= 0 ? start : -1;\n\n// CANDY — bidirectional constraint needs TWO passes\nleft-to-right, then right-to-left with Math.max to keep pass one." },
  { h: "Building a heap", t: "quote", text: "Building a heap from n elements is O(n), not O(n log n) — sifting down from the middle outwards means most nodes barely move. That is why new PriorityQueue<>(collection) beats n separate inserts." }
]);

registerSheet("algorithms", [
  { h: "Sorting", t: "table", rows: [
    ["Algorithm", "Average", "Worst", "Space", "Stable"],
    ["Insertion", "O(n²)", "O(n²)", "O(1)", "Yes"],
    ["<b>Merge</b>", "O(n log n)", "<b>O(n log n)</b>", "O(n)", "<b>Yes</b>"],
    ["<b>Quick</b>", "O(n log n)", "<b>O(n²)</b>", "O(log n)", "No"],
    ["Heap", "O(n log n)", "O(n log n)", "O(1)", "No"],
    ["Counting / Radix", "O(n+k) / O(d·n)", "same", "O(k)", "Yes"]
  ]},
  { h: "Why Java ships two sorts", t: "quote", text: "Arrays.sort(int[]) uses dual-pivot quicksort — two equal ints are indistinguishable, so instability is unobservable. Arrays.sort(Object[]) uses TimSort because equal objects can differ in other fields, and sorting by department then name requires stability." },
  { h: "Binary search conventions", t: "code", lang: "java", code:
"int mid = lo + (hi - lo) / 2;    // NEVER (lo+hi)/2 — overflowed in the JDK\n                                  // itself for nine years\n\nwhile (lo <= hi)   // \"find an exact value\", inclusive range\nwhile (lo < hi)    // \"converge on a boundary\", answer is a[lo] at the end\n\n// BINARY SEARCH ON THE ANSWER — the pattern most people miss.\n// If the answer is monotonic and feasibility is cheap to test, search\n// the VALUE space: Koko bananas, ship packages, split array." },
  { h: "Bit tricks", t: "code", lang: "java", code:
"n & 1              // odd?\nn & (n - 1)        // clear the lowest set bit  (loop = Kernighan popcount)\nn & -n             // isolate the lowest set bit\nn | (1 << i)       // set        n & ~(1 << i)   // clear\nn ^ (1 << i)       // toggle     (n >> i) & 1    // read\n\nn > 0 && (n & (n-1)) == 0     // power of two\nx ^ x == 0                     // XOR cancels pairs -> single number\n\n// >> keeps the sign, >>> does not — use >>> in hashing.\n// Shift counts are mod 32 for int: 1 << 32 is 1, not 0." },
  { h: "Must-know algorithms", t: "table", rows: [
    ["Algorithm", "Solves", "Cost"],
    ["Quickselect", "Kth smallest, median", "O(n) avg"],
    ["Floyd tortoise/hare", "Cycle in a list, array or any iterated function", "O(n)/O(1)"],
    ["Boyer-Moore voting", "Majority element", "O(n)/O(1)"],
    ["Kadane", "Max subarray", "O(n)/O(1)"],
    ["Reservoir sampling", "K random from an unknown-length stream", "O(n)/O(k)"],
    ["<b>Fisher-Yates</b>", "Uniform shuffle", "O(n)"],
    ["Fast exponentiation", "a^b mod m", "O(log b)"],
    ["KMP / LPS table", "Substring search, smallest repeating unit", "O(n+m)"]
  ]},
  { h: "Fisher-Yates — the detail that matters", t: "code", lang: "java", code:
"for (int i = a.length - 1; i > 0; i--) {\n    int j = rnd.nextInt(i + 1);      // 0..i INCLUSIVE — the whole trick\n    swap(a, i, j);\n}\n// Drawing from the WHOLE array gives n^n equally likely paths mapped onto\n// n! permutations. n^n is not divisible by n!, so it cannot be uniform.\n// This exact bug biased a real online poker shuffle." }
]);
