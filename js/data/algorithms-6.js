registerSimple("algorithms", {
"How do hashing, collisions and consistent hashing work?":
`A hash function turns a key into a number that picks a slot in an array, so lookups are almost instant. A <b>collision</b> is when two keys land in the same slot; Java's HashMap keeps a small list (or tree) in each slot. <b>Consistent hashing</b> places servers and keys on a circle so that adding or removing a server moves only a few keys, which matters for distributed caches.`,

"How do you approach a problem you genuinely cannot solve in the interview?":
`Stay calm and keep talking. Restate the problem, work through small examples by hand, and write a brute-force solution even if it is slow. Then look for what it repeats or what extra information could help. Ask for a hint when you are truly stuck. Interviewers value a clear, honest thinking process more than a perfect answer.`,

"Complexity classes and the operations you use every day":
`O(1): array access, HashMap get. O(log n): binary search, TreeMap and heap operations. O(n): one loop over the data. O(n log n): sorting. O(n²): nested loops over the same data. Knowing the cost of everyday operations, such as <code>list.contains</code> being O(n) while <code>set.contains</code> is O(1), helps you avoid hidden slowness.`,

"Prefix sums, difference arrays and the two-pointer family":
`A <b>prefix sum</b> array stores running totals, so the sum of any range is one subtraction. A <b>difference array</b> does the opposite: to add a value to a whole range, change only its two ends, then rebuild with a running total. <b>Two pointers</b> move through the data from both ends or at different speeds to avoid nested loops.`,

"How do you choose an algorithm when the input does not fit in memory?":
`Process the data in pieces. <b>Stream</b> it, reading once while keeping only a small summary (counts, a top-k heap). <b>Split</b> it into chunks that fit, process each (for example, sort each chunk), then merge the results. Or <b>distribute</b> the work across many machines, as MapReduce does. Hashing keys into separate files keeps related data together.`,

"Backtracking: the template, and the pruning that makes it viable":
`Backtracking builds a solution one choice at a time: make a choice, explore further, then undo the choice and try the next one. Pruning, stopping as soon as a partial solution cannot possibly work, is what keeps it fast enough. It is used for permutations, subsets, combination sum, N-Queens and Sudoku.`,

"String algorithms: rolling hash, Z-function and when to reach past brute force":
`Checking a pattern at every position of a text is O(n × m), which is fine for short strings. For long texts, <b>KMP</b> and the <b>Z-function</b> find matches in O(n + m) by reusing what earlier comparisons learned. A <b>rolling hash</b> (Rabin-Karp) updates a substring's hash in O(1) as the window slides, which makes comparing many substrings fast.`,

"Count inversions in an array with a modified merge sort":
`An inversion is a pair where a bigger number comes before a smaller one. During merge sort's merge step, whenever an element from the right half is placed before remaining elements of the left half, it forms an inversion with every one of those remaining elements, so add that count. This counts all inversions in O(n log n) instead of O(n²).`,

"Convert a recursive DFS into an iterative one with an explicit stack, and say when you would":
`Replace the recursion with your own stack: push the start node, then repeatedly pop a node, process it, and push its unvisited neighbours. This avoids a stack overflow on very deep structures, such as a long chain of a million nodes, because your stack lives in normal memory instead of the limited call stack.`,

"Compare the sorting algorithms — which does Java actually use, and why two?":
`Simple sorts (bubble, selection, insertion) are O(n²); merge sort, quicksort and heap sort are O(n log n). Java uses <b>dual-pivot quicksort</b> for primitive arrays, which is very fast and stability does not matter for plain numbers, and <b>TimSort</b> (a merge sort variant) for objects, because it is stable, keeping equal items in their original order, and is fast on partly sorted data.`,

"Binary search and its variants — first, last and rotated":
`Binary search halves the search range at each step, so it takes O(log n) on sorted data. To find the <b>first</b> occurrence, keep searching left after a match; for the <b>last</b>, keep searching right. In a <b>rotated</b> sorted array, one half around the middle is always properly sorted, so check whether the target lies in that half.`,

"KMP string matching and the prefix function":
`KMP finds a pattern in a text without ever moving backwards in the text. It first builds a table for the pattern: for each position, the length of the longest part that is both a prefix and a suffix. On a mismatch, that table tells you how far the pattern can safely shift, so matching takes O(n + m).`,

"Bit manipulation tricks every interviewer expects":
`XOR cancels identical numbers (<code>x ^ x = 0</code>), so XOR-ing everything finds the single number without a pair. <code>n &amp; (n - 1)</code> removes the lowest set bit, which counts set bits or checks for a power of two (the result is 0). Shifting left by k multiplies by 2ᵏ. Masks can represent sets of up to 32 or 64 items.`,

"Quickselect, Floyd's cycle detection and other must-know algorithms":
`<b>Quickselect</b> finds the kth smallest item in O(n) on average by partitioning like quicksort but only continuing into the side that contains k. <b>Floyd's cycle detection</b> uses a slow and a fast pointer to detect a loop without extra memory. Others worth knowing: reservoir sampling (a random item from a stream) and Boyer-Moore majority voting.`,

"How do you analyse time and space complexity, including amortised cost?":
`Count how many times the main work runs as the input grows: one loop is O(n), nested loops are O(n²), halving each step is O(log n). For space, count extra memory, including the recursion depth. <b>Amortised</b> cost averages occasional expensive steps over many cheap ones: an ArrayList sometimes copies itself to grow, but adding is still O(1) on average.`
});
