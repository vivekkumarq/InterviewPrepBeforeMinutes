appendTopic("dsa", [
{
  q: "How do you estimate whether your solution will run in time?",
  level: "beginner", hot: true, tags: ["complexity", "strategy", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Uber", "Walmart"],
  a: `<p>A modern machine does roughly <strong>10⁸ simple operations per second</strong> in a typical judge or interview setting. That single number turns "will this pass?" from a guess into arithmetic.</p>
<table>
<tr><th>n</th><th>O(n)</th><th>O(n log n)</th><th>O(n²)</th><th>O(2ⁿ)</th></tr>
<tr><td>10³</td><td>instant</td><td>instant</td><td>instant</td><td>impossible</td></tr>
<tr><td>10⁴</td><td>instant</td><td>instant</td><td>~0.1 s</td><td>impossible</td></tr>
<tr><td>10⁵</td><td>instant</td><td>~0.02 s</td><td><strong>~10 s</strong></td><td>impossible</td></tr>
<tr><td>10⁶</td><td>~0.01 s</td><td>~0.2 s</td><td><strong>~17 min</strong></td><td>impossible</td></tr>
<tr><td>10⁸</td><td>~1 s</td><td>too slow</td><td>—</td><td>—</td></tr>
</table>
<p><strong>Read the constraints backwards</strong> — they tell you the intended complexity before you start thinking:</p>
<table>
<tr><th>Constraint says</th><th>Aim for</th><th>Which usually means</th></tr>
<tr><td>n ≤ 10⁹</td><td>O(log n) or O(1)</td><td>Binary search, maths</td></tr>
<tr><td>n ≤ 10⁶</td><td>O(n) or O(n log n)</td><td>One pass, sort, hash map</td></tr>
<tr><td>n ≤ 10⁵</td><td>O(n log n)</td><td>Sort, heap, binary search on the answer</td></tr>
<tr><td>n ≤ 5·10³</td><td>O(n²)</td><td>DP over pairs</td></tr>
<tr><td>n ≤ 500</td><td>O(n³)</td><td>Floyd-Warshall, interval DP</td></tr>
<tr><td>n ≤ 20</td><td>O(2ⁿ)</td><td><strong>Bitmask DP</strong>, subsets</td></tr>
<tr><td>n ≤ 11</td><td>O(n!)</td><td>Permutations</td></tr>
</table>
<pre><code>// The hidden costs people forget when estimating:
//
// - Sorting inside a loop:        O(n) loop x O(n log n) sort = O(n^2 log n)
// - String concatenation in Java: s += x is O(len), so a loop is O(n^2)
// - list.contains(x) in a loop:   O(n) each -> O(n^2). Use a HashSet.
// - substring / split per element: allocates, and is easy to miss
// - Recursion depth:              O(h) stack; a skewed tree is O(n) and can
//                                 overflow at ~10,000 frames
//
// And the cost that is NOT hidden but is often misjudged: a nested loop where
// the inner pointer never resets is O(n), not O(n^2). Count total pointer
// movement, not loop nesting.</code></pre>
<p><strong>The other half of the estimate is memory.</strong> A judge or service limit of 256 MB means roughly 6×10⁷ <code>int</code>s, or 3×10⁷ <code>long</code>s. A 2D <code>int</code> array of 10⁴ × 10⁴ is 400 MB — so a DP table that looks fine on paper may not fit, and that is often the real constraint pushing you toward a rolled one-dimensional table.</p>
<p><strong>What to say:</strong> "The constraint is n up to 10⁵, so an O(n²) solution is about 10¹⁰ operations and will not finish — I need O(n log n) or better. That rules out checking every pair, so I want a sort, a heap, or a hash map." Saying that before coding shows you are choosing an approach rather than stumbling into one.</p>`
},
{
  q: "Which data structure and algorithm topics should you prioritise when time is short?",
  level: "beginner", tags: ["strategy", "preparation", "problem-solving"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "TCS", "Infosys", "Flipkart", "Walmart"],
  a: `<p>Interview questions are not uniformly distributed. A small number of patterns cover most of what is actually asked, so with limited time the order matters more than the volume.</p>
<table>
<tr><th>Priority</th><th>Topic</th><th>Why</th></tr>
<tr><td><strong>1</strong></td><td>Hash maps and sets</td><td>Appear in more solutions than anything else — usually the O(n²) → O(n) step</td></tr>
<tr><td><strong>2</strong></td><td>Two pointers and sliding window</td><td>Covers a large share of array and string questions</td></tr>
<tr><td><strong>3</strong></td><td>Binary search — <em>including on the answer</em></td><td>Cheap to learn; the "on the answer" variant is widely missed</td></tr>
<tr><td><strong>4</strong></td><td>Trees: traversals, BFS by level, recursion shape</td><td>Nearly guaranteed in some form</td></tr>
<tr><td><strong>5</strong></td><td>Graphs: BFS, DFS, topological sort</td><td>Grids and dependencies are graph problems in disguise</td></tr>
<tr><td><strong>6</strong></td><td>Heaps — top-K, two heaps</td><td>Small surface area, high frequency</td></tr>
<tr><td><strong>7</strong></td><td>Intervals and sorting-based greedy</td><td>A handful of templates cover almost all of them</td></tr>
<tr><td><strong>8</strong></td><td>DP: 1D, then knapsack, then LCS/edit distance</td><td>Highest effort per question — do it after the above</td></tr>
<tr><td>9</td><td>Stacks: monotonic, brackets</td><td>Narrow but distinctive</td></tr>
<tr><td>10</td><td>Backtracking, tries, union-find, bit tricks</td><td>Worth recognising; less often required</td></tr>
</table>
<table>
<tr><th>Habit</th><th>Why it beats volume</th></tr>
<tr><td>Redo a problem you solved a week ago</td><td>Retrieval is what builds recall; re-reading a solution does not</td></tr>
<tr><td>After solving, write the <em>pattern</em> in one line</td><td>You are building an index, not a list of answers</td></tr>
<tr><td>Solve out loud, even alone</td><td>Explaining while thinking is a separate skill and it is assessed</td></tr>
<tr><td>Time yourself — 30 to 40 minutes</td><td>Unlimited time trains a mode you will not have</td></tr>
<tr><td>Write it in a plain editor sometimes</td><td>No autocomplete, no red squiggles — like a shared doc or a whiteboard</td></tr>
<tr><td>Keep a list of problems that beat you</td><td>That list <em>is</em> your study plan</td></tr>
</table>
<pre><code>// The single highest-value drill, if you only do one thing:
// take 20 problems you have already solved, and for each write ONLY:
//
//   - the clue in the problem statement
//   - the pattern it maps to
//   - the one insight that made it work
//
// e.g. "contiguous subarray + condition"  -> sliding window
//                                         -> left pointer never resets, so O(n)
//
// Recognising the pattern in 60 seconds is worth far more than having
// memorised 300 solutions, because the problem you get will be a variant.</code></pre>
<p><strong>On volume, honestly:</strong> roughly 100–150 well-chosen problems, revisited, beats 500 solved once. The goal is not coverage — it is that when you read an unfamiliar problem, something in it feels familiar within the first minute. That recognition is the entire skill being tested.</p>`
}
]);
