appendTopic("dsa", [
{
  q: "How do you derive the time complexity of a recursive algorithm?",
  level: "advanced", hot: true, tags: ["complexity", "recursion", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Flipkart", "Oracle", "Uber"],
  a: `<p>Write the <strong>recurrence</strong>, then solve it. There are only three tools and one of them covers most cases.</p>
<pre><code>// The Master Theorem:  T(n) = a·T(n/b) + f(n)
//   a = number of subproblems
//   b = factor the input shrinks by
//   f(n) = work done outside the recursion
//
// Compare f(n) against n^(log_b a):
//   f(n) smaller  -> T(n) = O(n^(log_b a))        recursion dominates
//   f(n) equal    -> T(n) = O(n^(log_b a) · log n) they tie
//   f(n) larger   -> T(n) = O(f(n))                the split work dominates</code></pre>
<table>
<tr><th>Algorithm</th><th>Recurrence</th><th>Result</th><th>Case</th></tr>
<tr><td>Binary search</td><td>T(n) = T(n/2) + O(1)</td><td>O(log n)</td><td>tie</td></tr>
<tr><td>Merge sort</td><td>T(n) = 2T(n/2) + O(n)</td><td>O(n log n)</td><td>tie</td></tr>
<tr><td>Quickselect (avg)</td><td>T(n) = T(n/2) + O(n)</td><td><strong>O(n)</strong></td><td>f dominates</td></tr>
<tr><td>Karatsuba multiply</td><td>T(n) = 3T(n/2) + O(n)</td><td>O(n<sup>1.58</sup>)</td><td>recursion dominates</td></tr>
<tr><td>Naive Fibonacci</td><td>T(n) = T(n−1) + T(n−2)</td><td>O(2<sup>n</sup>)</td><td>not Master — n shrinks by 1, not ÷b</td></tr>
</table>
<p><strong>Why quickselect is O(n) and merge sort is O(n log n)</strong> is the most useful thing here: merge sort recurses into <em>both</em> halves, quickselect into <em>one</em>. That gives n + n/2 + n/4 + … = 2n. One word — "both" versus "one" — is the entire difference.</p>
<pre><code>// When the Master Theorem does not apply, use the RECURSION TREE:
// draw the levels, sum the work per level, multiply by the depth.
//
// Naive Fibonacci:  branching factor 2, depth n  -> O(2^n)
// Permutations:     n choices, then n-1, ...     -> O(n!)
// Subsets:          include/exclude each element -> O(2^n)
// N-Queens:         n choices per row, pruned    -> O(n!) worst case
//
// SPACE for a recursive function = maximum DEPTH, not total calls.
//   merge sort:   O(log n) stack + O(n) buffer
//   naive fib:    O(n) stack, despite 2^n calls — only one path is live</code></pre>
<pre><code>// The two traps in "count the loops" reasoning
for (int i = 0; i < n; i++)
    for (int j = i; j < n; j++)        // NOT n^2 iterations — it is n(n+1)/2
        work();                         // but still O(n^2). Constants drop.

int left = 0;
for (int right = 0; right < n; right++)
    while (left < right && bad()) left++;   // left NEVER resets
// Looks O(n^2). Each pointer moves at most n times TOTAL -> O(n).
// Count total pointer movement, not loop nesting.</code></pre>
<p><strong>What to say:</strong> "I write the recurrence first. <code>T(n) = 2T(n/2) + O(n)</code> is merge sort, so O(n log n). If it does not fit the Master Theorem I sketch the recursion tree and sum per level — that also tells me the space, which is the depth rather than the node count."</p>`
},
{
  q: "What is amortised analysis, and where does it actually matter?",
  level: "advanced", hot: true, tags: ["complexity", "must-know", "data-structures"],
  companies: ["Amazon", "Google", "Microsoft", "Oracle", "Adobe", "Goldman Sachs", "SAP"],
  a: `<p>Amortised means: <strong>the total cost of a sequence of n operations is O(n)</strong>, so the average per operation is O(1) — even though one individual operation can be O(n).</p>
<pre><code>// ArrayList.add() — the canonical example
// Capacity doubles when full. Adding n elements copies:
//   1 + 2 + 4 + 8 + ... + n/2 + n  <  2n
// Total O(n) work for n adds -> O(1) AMORTISED per add.
//
// Why DOUBLING and not "grow by 10"? Growing by a constant c gives
//   n/c resizes, each copying O(n) -> O(n^2) total. Doubling is what
// makes it linear. Java actually grows 1.5x, which has the same property.</code></pre>
<table>
<tr><th>Claim</th><th>Means</th><th>Example</th></tr>
<tr><td><strong>Worst case O(1)</strong></td><td>Every single call, always</td><td>Array index</td></tr>
<tr><td><strong>Amortised O(1)</strong></td><td>Total over a <em>sequence</em> is O(n)</td><td><code>ArrayList.add</code>, <code>ArrayDeque</code></td></tr>
<tr><td><strong>Average O(1)</strong></td><td>Expected over <em>random input</em></td><td><code>HashMap.get</code></td></tr>
<tr><td colspan="3">These are three different guarantees. Saying "HashMap is O(1)" without "average" is the version interviewers correct.</td></tr>
</table>
<table>
<tr><th>Structure / operation</th><th>Worst case</th><th>Amortised</th></tr>
<tr><td><code>ArrayList.add</code></td><td>O(n) on resize</td><td><strong>O(1)</strong></td></tr>
<tr><td><code>HashMap.put</code></td><td>O(n) on rehash</td><td>O(1)</td></tr>
<tr><td><code>StringBuilder.append</code></td><td>O(n) on grow</td><td>O(1)</td></tr>
<tr><td>Union-Find <code>find</code></td><td>O(log n) once</td><td><strong>O(α(n))</strong> ≈ O(1)</td></tr>
<tr><td>Monotonic stack pass</td><td>O(n) inner loop</td><td>O(n) total — each index pushed and popped once</td></tr>
<tr><td>Sliding window</td><td>Nested loop</td><td>O(n) — pointers move n times total</td></tr>
</table>
<pre><code>// WHERE IT MATTERS IN PRACTICE — and this is the follow-up question:
// amortised O(1) is a bad guarantee for LATENCY-sensitive code.
//
// A trading system or a game loop cannot accept one add in 10,000 taking
// 50 ms because a 10-million-element array is being copied. The average is
// fine; the p99.99 is not.
//
// Fix: pre-size the collection so the resize never happens.
new ArrayList<>(expectedSize);
new HashMap<>((int)(expected / 0.75f) + 1);
// Same reason real-time systems avoid GC'd allocation in the hot path —
// the average is irrelevant when the tail is what you feel.</code></pre>
<p><strong>The three techniques, if pushed:</strong> <em>aggregate</em> (total work ÷ n — what I did above), <em>accounting</em> (overcharge cheap ops to pay for expensive ones), and <em>potential</em> (a function measuring stored "energy"). Aggregate answers almost every interview version; knowing the other two exist is enough.</p>`
},
{
  q: "How do you reason about space complexity, including the hidden costs?",
  level: "advanced", tags: ["complexity", "memory", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Oracle", "Flipkart", "Goldman Sachs"],
  a: `<p>Space complexity is <strong>auxiliary</strong> space — extra memory your algorithm allocates, beyond the input. The costs people miss are the recursion stack and the implicit allocations.</p>
<table>
<tr><th>Counts toward space</th><th>Usually does not</th></tr>
<tr><td><strong>Recursion stack depth</strong></td><td>The input itself</td></tr>
<tr><td>Auxiliary arrays, maps, sets</td><td>The output, when the problem demands it</td></tr>
<tr><td>Strings built during the run</td><td>A fixed 256-element counter — that is O(1)</td></tr>
<tr><td>Boxed objects and their headers</td><td>Constant scratch variables</td></tr>
</table>
<pre><code>// Recursion stack is the most commonly forgotten cost
int height(TreeNode n) { ... }        // O(h) space
// Balanced tree:  h = log n  -> O(log n)
// Skewed tree:    h = n      -> O(n), and it OVERFLOWS around 10,000 frames

// Quicksort: O(log n) stack if you recurse into the SMALLER side and loop on
// the larger; O(n) if you always recurse left.

// Merge sort on an ARRAY: O(n) buffer.
// Merge sort on a LINKED LIST: O(log n) — only the stack, you just relink.</code></pre>
<pre><code>// Java memory, actual numbers — this is what "O(n) space" costs in practice
int              4 bytes
Integer          16 bytes object + 4-8 byte reference   -> ~4x an int
int[1_000_000]   ~4 MB
List&lt;Integer&gt;    ~20 MB for the same million values
long[]           8 bytes each
Object header    12-16 bytes, EVERY object
String           ~40 bytes + the byte[] (Latin-1 since Java 9)

// So "boxing is slow" is really "boxing is 5x the memory AND destroys cache
// locality" — the allocation is not the expensive part, the cache miss is.</code></pre>
<table>
<tr><th>Technique</th><th>Space saved</th></tr>
<tr><td>Roll a 2D DP table to one or two rows</td><td>O(n·m) → O(min(n,m))</td></tr>
<tr><td>Two pointers instead of a hash map</td><td>O(n) → O(1) — needs sorted input</td></tr>
<tr><td>Use the input array as the marker (index-as-hash)</td><td>O(n) → O(1) — mutates the input</td></tr>
<tr><td>Iterative + explicit stack instead of recursion</td><td>Same order, but no stack-overflow ceiling</td></tr>
<tr><td>Morris traversal</td><td>O(h) → O(1) by threading links temporarily</td></tr>
<tr><td>Bit manipulation / <code>BitSet</code></td><td>8× over <code>boolean[]</code></td></tr>
<tr><td>Streaming instead of materialising</td><td>O(n) → O(1)</td></tr>
</table>
<pre><code>// The judge-limit arithmetic worth knowing
// 256 MB ≈ 6x10^7 ints, or 3x10^7 longs.
// A 10^4 x 10^4 int DP table = 400 MB -> does NOT fit.
// That constraint alone is often the hint to roll the table to one row.</code></pre>
<p><strong>How to state it precisely:</strong> "O(1) extra space, not counting the output" is a complete answer. "O(h) for the recursion, which is O(n) on a skewed tree" shows you thought about the worst case rather than the typical one — and that distinction is exactly what the follow-up question is about.</p>`
}
]);
