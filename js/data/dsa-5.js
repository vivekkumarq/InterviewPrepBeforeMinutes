appendTopic("dsa", [
{
  q: "How do you approach a coding problem you have never seen before?",
  level: "beginner", hot: true, tags: ["strategy", "problem-solving", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs", "Walmart"],
  a: `<p>Interviewers grade the <em>process</em> at least as much as the answer. A candidate who narrates a clear method and gets 90% there usually scores above one who silently produces a perfect solution.</p>
<table>
<tr><th>Step</th><th>What to actually say and do</th></tr>
<tr><td><strong>1. Restate and clarify</strong></td><td>"So given an array of integers, I return the two indices that sum to the target. Can values repeat? Is there exactly one answer? Can the array be empty? Are values signed?"</td></tr>
<tr><td><strong>2. Work an example by hand</strong></td><td>Take a small input and trace it aloud. This is where the pattern usually reveals itself.</td></tr>
<tr><td><strong>3. State the brute force</strong></td><td>"The obvious approach is every pair, O(n²)." — you now have <em>a</em> solution, which is a real safety net.</td></tr>
<tr><td><strong>4. Find the bottleneck</strong></td><td>"The inner loop is re-scanning what I already saw. If I remembered it, the lookup is O(1)." — this is where the optimisation comes from.</td></tr>
<tr><td><strong>5. Confirm before coding</strong></td><td>"So: one pass, a hash map of value to index, O(n) time and O(n) space. Shall I code that?"</td></tr>
<tr><td><strong>6. Code cleanly</strong></td><td>Real names, no cleverness, guard the edges. Say what you are doing as you write.</td></tr>
<tr><td><strong>7. Trace it on the example</strong></td><td>Walk your own code line by line. This catches most off-by-one errors before the interviewer does.</td></tr>
<tr><td><strong>8. State complexity and edges</strong></td><td>Time, space, and the cases you handled — empty, single element, all duplicates, overflow.</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Constraint size mapped to the expected algorithmic complexity">
  <text class="dg-s" x="16" y="22">read the constraints backwards — they tell you the intended solution</text>
  <rect class="dg-fill" x="16" y="34" width="104" height="26" rx="4"/><text class="dg-s" x="68" y="52" text-anchor="middle">n ≤ 10⁸</text>
  <text class="dg-s" x="132" y="52">O(n) or O(log n)</text>
  <rect class="dg-fill" x="16" y="64" width="104" height="26" rx="4"/><text class="dg-s" x="68" y="82" text-anchor="middle">n ≤ 10⁶</text>
  <text class="dg-s" x="132" y="82">O(n log n)</text>
  <rect class="dg-fill2" x="16" y="94" width="104" height="26" rx="4"/><text class="dg-s" x="68" y="112" text-anchor="middle">n ≤ 10⁴</text>
  <text class="dg-s" x="132" y="112">O(n²) is fine</text>
  <rect class="dg-box" x="330" y="34" width="104" height="26" rx="4"/><text class="dg-s" x="382" y="52" text-anchor="middle">n ≤ 500</text>
  <text class="dg-s" x="446" y="52">O(n³)</text>
  <rect class="dg-box" x="330" y="64" width="104" height="26" rx="4"/><text class="dg-s" x="382" y="82" text-anchor="middle">n ≤ 20</text>
  <text class="dg-s" x="446" y="82">O(2ⁿ) — bitmask DP</text>
  <rect class="dg-box" x="330" y="94" width="104" height="26" rx="4"/><text class="dg-s" x="382" y="112" text-anchor="middle">n ≤ 11</text>
  <text class="dg-s" x="446" y="112">O(n!) — permutations</text>
</svg>
</figure>
<table>
<tr><th>Clue in the problem</th><th>Technique to try</th></tr>
<tr><td>Sorted array</td><td>Binary search, or two pointers</td></tr>
<tr><td>"Contiguous subarray / substring"</td><td>Sliding window, or prefix sums</td></tr>
<tr><td>"Top K", "K closest", "median of a stream"</td><td>Heap</td></tr>
<tr><td>"All permutations / combinations / valid arrangements"</td><td>Backtracking</td></tr>
<tr><td>"Number of ways", "minimum cost", "is it possible"</td><td>Dynamic programming</td></tr>
<tr><td>"Shortest path", grid, connections</td><td>BFS (unweighted) or Dijkstra (weighted)</td></tr>
<tr><td>"Prefix", autocomplete, dictionary</td><td>Trie</td></tr>
<tr><td>"Next greater / smaller element"</td><td>Monotonic stack</td></tr>
<tr><td>Overlapping ranges</td><td>Sort by start or end, then sweep</td></tr>
<tr><td>Cycle, or "is it connected"</td><td>DFS with states, or union-find</td></tr>
<tr><td>"In place, O(1) space"</td><td>Two pointers, index-as-hash, or bit tricks</td></tr>
</table>
<p><strong>What to do when you are genuinely stuck</strong> — this is the part worth rehearsing, because it will happen:</p>
<ul>
<li><strong>Say what you know.</strong> "I can see this needs the previous state, so it smells like DP — I am working out what the state should be." Silence gives the interviewer nothing to help with.</li>
<li><strong>Solve a smaller version.</strong> Two elements instead of n. One dimension instead of two.</li>
<li><strong>Ask for a hint.</strong> It costs less than five silent minutes, and it is what you would do with a colleague.</li>
<li><strong>Write the brute force.</strong> A working O(n²) beats an unfinished O(n) every time.</li>
</ul>
<p><strong>The single highest-value habit:</strong> think out loud continuously. The interviewer cannot award marks for reasoning they cannot hear, and most of the signal they are looking for — how you decompose a problem, how you handle ambiguity, whether you check your own work — is invisible unless you narrate it.</p>`
},
{
  q: "How do you pick the right data structure for a problem?",
  level: "advanced", hot: true, tags: ["data-structures", "complexity", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Oracle", "Flipkart", "SAP", "Goldman Sachs"],
  a: `<table>
<tr><th>Structure</th><th>Access</th><th>Search</th><th>Insert</th><th>Delete</th><th>Ordered</th></tr>
<tr><td>Array / ArrayList</td><td><strong>O(1)</strong></td><td>O(n)</td><td>O(n)</td><td>O(n)</td><td>By index</td></tr>
<tr><td>Linked list</td><td>O(n)</td><td>O(n)</td><td><strong>O(1)</strong>*</td><td>O(1)*</td><td>Insertion</td></tr>
<tr><td>Hash map / set</td><td>—</td><td><strong>O(1)</strong> avg</td><td>O(1) avg</td><td>O(1) avg</td><td><strong>No</strong></td></tr>
<tr><td>Balanced BST (TreeMap)</td><td>—</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td><td><strong>Sorted</strong></td></tr>
<tr><td>Heap (PriorityQueue)</td><td>O(1) min/max</td><td>O(n)</td><td>O(log n)</td><td>O(log n)</td><td>Partial</td></tr>
<tr><td>Trie</td><td>—</td><td><strong>O(L)</strong></td><td>O(L)</td><td>O(L)</td><td>Lexicographic</td></tr>
<tr><td>Deque (ArrayDeque)</td><td>O(1) ends</td><td>O(n)</td><td>O(1) ends</td><td>O(1) ends</td><td>Insertion</td></tr>
</table>
<p>* only when you already hold the node — reaching it is O(n).</p>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Decision path from access pattern to data structure">
  <rect class="dg-fill" x="16" y="60" width="128" height="34" rx="6"/><text class="dg-s" x="80" y="82" text-anchor="middle">what do I need?</text>
  <path class="dg-line" d="M148 68 H198 M148 77 H198 M148 88 H198" marker-end="url(#ds1)"/>
  <rect class="dg-fill2" x="202" y="16" width="180" height="30" rx="6"/><text class="dg-s" x="292" y="36" text-anchor="middle">fast lookup by key → HashMap</text>
  <rect class="dg-fill2" x="202" y="54" width="180" height="30" rx="6"/><text class="dg-s" x="292" y="74" text-anchor="middle">sorted order / ranges → TreeMap</text>
  <rect class="dg-fill2" x="202" y="92" width="180" height="30" rx="6"/><text class="dg-s" x="292" y="112" text-anchor="middle">always the min/max → Heap</text>
  <rect class="dg-box" x="410" y="16" width="194" height="30" rx="6"/><text class="dg-s" x="507" y="36" text-anchor="middle">prefix matching → Trie</text>
  <rect class="dg-box" x="410" y="54" width="194" height="30" rx="6"/><text class="dg-s" x="507" y="74" text-anchor="middle">both ends → ArrayDeque</text>
  <rect class="dg-box" x="410" y="92" width="194" height="30" rx="6"/><text class="dg-s" x="507" y="112" text-anchor="middle">connectivity over time → Union-Find</text>
  <text class="dg-s" x="16" y="146">start from the ACCESS PATTERN, not from the data — that is the whole method</text>
  <defs><marker id="ds1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Requirement</th><th>Structure</th><th>Why</th></tr>
<tr><td>"Have I seen this before?"</td><td><code>HashSet</code></td><td>O(1) membership</td></tr>
<tr><td>Count occurrences</td><td><code>HashMap</code> + <code>merge</code></td><td>One pass</td></tr>
<tr><td>Preserve insertion order too</td><td><code>LinkedHashMap</code></td><td>Hash speed with predictable iteration</td></tr>
<tr><td>Range query, floor/ceiling, nearest key</td><td><code>TreeMap</code></td><td><code>floorKey</code>, <code>subMap</code> — a HashMap cannot do these at all</td></tr>
<tr><td>Top K, or a streaming median</td><td>Heap (one or two)</td><td>O(log k) per element, bounded memory</td></tr>
<tr><td>LRU cache</td><td>HashMap + doubly linked list</td><td>O(1) lookup and O(1) reordering together</td></tr>
<tr><td>Autocomplete, wildcard search</td><td>Trie</td><td>Cost depends on word length, not dictionary size</td></tr>
<tr><td>Undo, backtracking, matching brackets</td><td>Stack</td><td>LIFO is literally the requirement</td></tr>
<tr><td>Level-order, shortest path</td><td>Queue</td><td>FIFO explores by distance</td></tr>
<tr><td>Merging groups as edges arrive</td><td>Union-Find</td><td>Near-constant, incremental — DFS needs the whole graph up front</td></tr>
<tr><td>Membership at huge scale, some false positives OK</td><td>Bloom filter</td><td>A few bits per element instead of the whole key</td></tr>
</table>
<pre><code>// The combination that solves a surprising number of problems:
// HASH MAP + something ordered.
//   HashMap + doubly linked list  -> LRU cache, O(1) both operations
//   HashMap + heap                -> top-K with updates
//   HashMap + array               -> insert / delete / getRandom, all O(1)

// Insert, delete and getRandom in O(1) — a favourite follow-up
class RandomizedSet {
    private final List&lt;Integer&gt; values = new ArrayList&lt;&gt;();
    private final Map&lt;Integer, Integer&gt; index = new HashMap&lt;&gt;();

    boolean insert(int v) {
        if (index.containsKey(v)) return false;
        index.put(v, values.size());
        values.add(v);
        return true;
    }
    boolean remove(int v) {
        Integer i = index.remove(v);
        if (i == null) return false;
        int last = values.get(values.size() - 1);     // swap the LAST element into
        values.set(i, last);                          // the hole, then trim —
        if (last != v) index.put(last, i);            // that is what keeps it O(1)
        values.remove(values.size() - 1);
        return true;
    }
    int getRandom() { return values.get(rnd.nextInt(values.size())); }
}</code></pre>
<p><strong>The way to answer this in an interview:</strong> "I start from the operations, not the data. If the dominant operation is lookup by key, that is a hash map. If I need order or ranges, a tree map. If I only ever need the extreme, a heap. Then I check whether one structure can serve every required operation in the required time — and if not, I combine two, which is exactly what an LRU cache is."</p>`
}
]);
