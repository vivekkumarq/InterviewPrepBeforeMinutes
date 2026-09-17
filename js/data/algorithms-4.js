appendTopic("algorithms", [
{
  q: "Backtracking: the template, and the pruning that makes it viable",
  level: "advanced", hot: true, tags: ["backtracking", "recursion", "pattern", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<p>Backtracking is exhaustive search with the ability to abandon a branch early. The template never changes — only the choices, the constraint and the goal.</p>
<pre><code>void backtrack(State s, List&lt;Choice&gt; path) {
    if (isGoal(s)) { results.add(new ArrayList&lt;&gt;(path)); return; }  // COPY it
    for (Choice c : choicesFrom(s)) {
        if (!isValid(s, c)) continue;      // PRUNE — the only thing that matters
        apply(s, c); path.add(c);          // choose
        backtrack(s, path);                // explore
        undo(s, c); path.remove(path.size()-1);   // UN-choose
    }
}
// Two bugs account for nearly every failure here:
// 1. Adding the path list itself to the results instead of a copy — every result
//    ends up pointing at the same list, which is empty at the end.
// 2. Forgetting the undo. State leaks into sibling branches and the answer is
//    silently wrong with no exception anywhere.</code></pre>
<table>
<tr><th>Problem</th><th>Choices</th><th>The pruning</th></tr>
<tr><td>Subsets</td><td>Include or exclude each element</td><td>None needed — all 2ⁿ are valid</td></tr>
<tr><td>Permutations</td><td>Each unused element</td><td>A <code>used[]</code> array</td></tr>
<tr><td>Combination sum</td><td>Each candidate, reusable</td><td>Stop when the remaining target goes negative</td></tr>
<tr><td>N-Queens</td><td>A column per row</td><td>Sets of occupied columns and both diagonals — O(1) validity check</td></tr>
<tr><td>Sudoku</td><td>1–9 per empty cell</td><td>Row, column and box sets; fill the <strong>most constrained</strong> cell first</td></tr>
<tr><td>Word search</td><td>Four neighbours</td><td>Mark the cell, unmark on the way out; a trie prunes whole branches</td></tr>
<tr><td>Palindrome partitioning</td><td>Every prefix cut</td><td>Precompute the palindrome table</td></tr>
<tr><td>Generate parentheses</td><td>Open or close</td><td><code>open &lt; n</code>, and <code>close &lt; open</code></td></tr>
</table>
<pre><code>// DUPLICATES — the detail that separates a correct solution from a nearly one
Arrays.sort(nums);                                  // sorting is the enabler
for (int i = start; i &lt; nums.length; i++) {
    if (i &gt; start &amp;&amp; nums[i] == nums[i-1]) continue; // skip a duplicate at the
                                                     // SAME tree level
    ...
}
// i > start, NOT i > 0. Skipping at i > 0 would also skip legitimate reuse of
// the same value deeper in the path. The distinction is "same level" versus
// "same branch", and it is worth saying out loud.</code></pre>
<pre><code>// N-QUEENS with O(1) validity — the version worth writing
Set&lt;Integer&gt; cols = new HashSet&lt;&gt;(), diag = new HashSet&lt;&gt;(), anti = new HashSet&lt;&gt;();

void place(int row, int n) {
    if (row == n) { count++; return; }
    for (int c = 0; c &lt; n; c++) {
        if (cols.contains(c) || diag.contains(row - c) || anti.contains(row + c))
            continue;
        cols.add(c); diag.add(row - c); anti.add(row + c);
        place(row + 1, n);
        cols.remove(c); diag.remove(row - c); anti.remove(row + c);
    }
}
// row - c is constant along a diagonal; row + c is constant along an
// anti-diagonal. That identity turns an O(n) scan into an O(1) lookup, and
// it is the insight the question is testing.</code></pre>
<table>
<tr><th>Complexity, stated honestly</th></tr>
<tr><td>Subsets: O(2ⁿ · n) — 2ⁿ results, each up to n long to copy</td></tr>
<tr><td>Permutations: O(n! · n)</td></tr>
<tr><td>N-Queens: O(n!) worst case, far less in practice thanks to pruning</td></tr>
<tr><td>Space: O(n) for the recursion and the path — <em>excluding</em> the output</td></tr>
<tr><td>Pruning does not change the worst-case Big-O. It changes the constant by orders of magnitude, which is the only reason these problems are solvable at all</td></tr>
</table>
<p><strong>The distinction to draw:</strong> backtracking explores a tree of <em>choices</em> and undoes them; DP caches answers to overlapping <em>subproblems</em>. If the same subproblem recurs, memoise and it becomes DP. If every path is genuinely distinct — as in permutations — there is nothing to cache, and backtracking with hard pruning is the right and final answer.</p>`
},
{
  q: "String algorithms: rolling hash, Z-function and when to reach past brute force",
  level: "advanced", tags: ["strings", "hashing", "kmp", "algorithms"],
  companies: ["Google", "Amazon", "Microsoft", "Adobe", "Goldman Sachs", "Uber"],
  a: `<table>
<tr><th>Problem</th><th>Brute force</th><th>Better</th></tr>
<tr><td>Find a pattern in a text</td><td>O(n·m)</td><td>KMP or Z-function — O(n+m)</td></tr>
<tr><td>Find <em>many</em> patterns at once</td><td>O(n·m·k)</td><td>Aho–Corasick — O(n + total pattern length)</td></tr>
<tr><td>Compare all substrings of one length</td><td>O(n·m)</td><td><strong>Rolling hash</strong> — O(n)</td></tr>
<tr><td>Longest common substring</td><td>O(n·m) DP</td><td>Binary search on length + rolling hash — O(n log n)</td></tr>
<tr><td>Longest repeated substring</td><td>O(n²)</td><td>Suffix array or suffix automaton</td></tr>
<tr><td>Longest palindromic substring</td><td>O(n²)</td><td>Manacher — O(n)</td></tr>
<tr><td>Autocomplete by prefix</td><td>Scan all keys</td><td>Trie — O(prefix length)</td></tr>
</table>
<pre><code>// ROLLING HASH (Rabin-Karp) — slide a window, update the hash in O(1)
// hash(s) = s[0]*B^(m-1) + s[1]*B^(m-2) + ... + s[m-1]   (mod a large prime)
long B = 31, MOD = 1_000_000_007L;
long hash = 0, power = 1;
for (int i = 0; i &lt; m; i++) { hash = (hash * B + s.charAt(i)) % MOD;
                              if (i &gt; 0) power = power * B % MOD; }

// slide: drop the leading character, shift, add the new one
hash = ((hash - s.charAt(i - m) * power % MOD + MOD * MOD) % MOD * B
        + s.charAt(i)) % MOD;
// The + MOD*MOD before the modulo is not decoration — subtraction can go
// negative and Java's % returns a negative result for a negative left operand.

// ALWAYS VERIFY A HASH MATCH with a real character comparison. A hash
// collision means a wrong answer, and an adversarial input can force them.
// Two different moduli (double hashing) makes a collision vanishingly
// unlikely — that is the answer to "what if it collides?"</code></pre>
<pre><code>// Z-FUNCTION — z[i] = length of the longest prefix of s that starts at i.
// Simpler to derive under pressure than KMP's failure function, and it
// solves the same problems.
int[] z = new int[n];
for (int i = 1, l = 0, r = 0; i &lt; n; i++) {
    if (i &lt; r) z[i] = Math.min(r - i, z[i - l]);      // reuse the known box
    while (i + z[i] &lt; n &amp;&amp; s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
    if (i + z[i] &gt; r) { l = i; r = i + z[i]; }        // extend the box
}
// PATTERN SEARCH: run it on  pattern + '#' + text.
// Every position where z[i] == pattern.length() is a match. O(n + m).</code></pre>
<pre><code>// WHERE EACH ONE IS THE RIGHT CHOICE
// KMP / Z          one pattern, guaranteed linear, no collision risk
// Rabin-Karp       many patterns of the SAME length, or when you need to
//                  compare arbitrary substrings in O(1) after preprocessing
// Aho-Corasick     many patterns at once — spam filters, virus signatures
// Trie             prefix queries, autocomplete
// Suffix array     repeated substring queries over one fixed text
//
// PRECOMPUTED PREFIX HASHES make any substring comparison O(1):
//   hash(i..j) = (pre[j+1] - pre[i] * power[j-i+1]) mod p
// That turns "are these two substrings equal?" into one arithmetic operation,
// which is what makes the binary-search-on-length trick work.</code></pre>
<p><strong>What to say when a string question appears:</strong> state the brute-force complexity first, then name the structure that removes the repeated work. "Comparing every pair of substrings is O(n²·m); precomputing prefix hashes makes each comparison O(1), so it drops to O(n²) — and if I only need one length, a rolling hash makes it O(n)." Naming the mechanism matters more than writing the whole algorithm from memory.</p>`
}
]);
