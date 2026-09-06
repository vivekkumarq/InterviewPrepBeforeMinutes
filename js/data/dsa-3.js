appendTopic("dsa", [
{
  q: "Explain backtracking with the classic problems",
  level: "advanced", hot: true, tags: ["backtracking", "recursion"],
  a: `<p>Backtracking builds candidates incrementally and abandons a partial candidate as soon as it cannot lead to a solution. The universal template is: <em>choose → explore → un-choose</em>.</p>
<pre><code>// SUBSETS — the simplest backtracking shape
void backtrack(int[] nums, int start, List&lt;Integer&gt; path, List&lt;List&lt;Integer&gt;&gt; result) {
    result.add(new ArrayList&lt;&gt;(path));           // every path is a valid subset
    for (int i = start; i &lt; nums.length; i++) {
        path.add(nums[i]);                        // CHOOSE
        backtrack(nums, i + 1, path, result);     // EXPLORE
        path.remove(path.size() - 1);             // UN-CHOOSE  &lt;- the "backtrack"
    }
}

// PERMUTATIONS — needs a 'used' marker instead of a start index
void permute(int[] nums, boolean[] used, List&lt;Integer&gt; path, List&lt;List&lt;Integer&gt;&gt; out) {
    if (path.size() == nums.length) { out.add(new ArrayList&lt;&gt;(path)); return; }
    for (int i = 0; i &lt; nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;  path.add(nums[i]);
        permute(nums, used, path, out);
        used[i] = false; path.remove(path.size() - 1);
    }
}

// N-QUEENS — the PRUNING is what makes it tractable
boolean isSafe(int[] queens, int row, int col) {
    for (int r = 0; r &lt; row; r++) {
        if (queens[r] == col) return false;                       // same column
        if (Math.abs(queens[r] - col) == row - r) return false;    // same diagonal
    }
    return true;
}</code></pre>
<p><strong>The insight that separates backtracking from brute force is pruning.</strong> N-Queens has 8⁸ ≈ 16 million naive placements; checking safety before recursing cuts it to a few thousand. Always state the pruning condition explicitly — it is the algorithmic content of the answer.</p>
<p><strong>The problems in this family:</strong> subsets, subsets with duplicates, permutations, combination sum, palindrome partitioning, word search in a grid, N-Queens, Sudoku solver, and generating balanced parentheses.</p>
<p><strong>Two implementation details interviewers watch for:</strong> copying the path when adding to the result (<code>new ArrayList&lt;&gt;(path)</code>) — adding the reference means every result mutates together; and handling duplicates by sorting first, then skipping <code>i &gt; start &amp;&amp; nums[i] == nums[i-1]</code>.</p>`
},
{
  q: "What are bit manipulation tricks worth knowing?",
  level: "advanced", tags: ["bits", "techniques"],
  a: `<pre><code>// The essential operations
n &amp; 1                    // is n odd?
n &gt;&gt; 1                    // divide by 2
n &lt;&lt; 1                    // multiply by 2
n &amp; (1 &lt;&lt; i)              // is bit i set?
n | (1 &lt;&lt; i)              // set bit i
n &amp; ~(1 &lt;&lt; i)             // clear bit i
n ^ (1 &lt;&lt; i)              // toggle bit i

// The two most useful identities
n &amp; (n - 1)               // clears the LOWEST set bit
n &amp; (-n)                  // isolates the lowest set bit

// Is n a power of two? (exactly one bit set)
boolean isPowerOfTwo(int n) { return n &gt; 0 &amp;&amp; (n &amp; (n - 1)) == 0; }

// Count set bits — Brian Kernighan: loops once per SET bit, not per bit
int countBits(int n) {
    int count = 0;
    while (n != 0) { n &amp;= (n - 1); count++; }
    return count;
}
// Or just: Integer.bitCount(n)  — compiles to a single CPU instruction

// XOR: the single-number trick. a^a = 0, a^0 = a, and XOR is commutative.
int singleNumber(int[] nums) {
    int result = 0;
    for (int n : nums) result ^= n;     // every pair cancels; the loner survives
    return result;                       // O(n) time, O(1) space
}

// Swap without a temp (a party trick, not production code)
a ^= b; b ^= a; a ^= b;</code></pre>
<p><strong>Where bit manipulation genuinely earns its place</strong> — beyond puzzle questions:</p>
<ul>
<li><strong>Bitmask DP</strong> — representing a subset of up to ~20 items as an integer, which is how the travelling salesman DP works.</li>
<li><strong>Flags and permissions</strong> — <code>READ | WRITE | DELETE</code> in one integer; Java's <code>EnumSet</code> is a bitset under the hood, which is why it is so fast.</li>
<li><strong>Bloom filters and bitsets</strong> for compact membership at scale.</li>
<li><strong>Hash functions</strong> — <code>h ^ (h &gt;&gt;&gt; 16)</code> in <code>HashMap</code> spreads high bits into the low bits used for the bucket index.</li>
</ul>
<p><strong>The Java caveat worth mentioning:</strong> Java has no unsigned integers, so use <code>&gt;&gt;&gt;</code> (unsigned right shift) rather than <code>&gt;&gt;</code> when the sign bit should not propagate — <code>-1 &gt;&gt; 1</code> is <code>-1</code>, while <code>-1 &gt;&gt;&gt; 1</code> is <code>Integer.MAX_VALUE</code>. That distinction causes real bugs in hashing and midpoint calculations.</p>`
},
{
  q: "How do you approach a problem you have never seen before?",
  level: "advanced", hot: true, tags: ["strategy", "process"],
  a: `<p>Interviewers deliberately ask unfamiliar questions to watch your <em>process</em>. Having a method is more valuable than having memorised solutions.</p>
<ol>
<li><strong>Restate and clarify.</strong> Input size, types, duplicates, negatives, empty input, sorted or not, memory constraints. The problem is usually underspecified on purpose.</li>
<li><strong>Work a small example by hand.</strong> This is the highest-value step and the one people skip. Solving n=4 on paper usually reveals the pattern, and it exposes misunderstandings before you write code.</li>
<li><strong>State the brute force and its complexity.</strong> "I could check every pair — that is O(n²)." You now have a working baseline and have shown you can analyse complexity.</li>
<li><strong>Ask where the waste is.</strong> This is the actual optimisation step:
  <ul>
  <li>Recomputing the same thing → <strong>memoise</strong> (DP).</li>
  <li>Repeated lookups → <strong>hash map</strong> for O(1).</li>
  <li>Repeated "is it there?" on sorted data → <strong>binary search</strong>.</li>
  <li>Recomputing over a moving range → <strong>sliding window</strong> or <strong>prefix sums</strong>.</li>
  <li>Repeatedly needing the min or max → <strong>heap</strong>.</li>
  <li>Sorting unlocks a two-pointer sweep → <strong>sort first</strong>.</li>
  </ul>
</li>
<li><strong>Match to a known pattern.</strong> Most interview problems are a variation of about a dozen patterns. Say which one you think it is and why.</li>
<li><strong>Confirm the approach before coding.</strong> "I will use a sliding window with a frequency map — does that sound reasonable?" This saves twenty wasted minutes.</li>
<li><strong>Code cleanly, then trace it</strong> with your example.</li>
<li><strong>Discuss complexity and edge cases</strong> unprompted.</li>
</ol>
<p><strong>When you are genuinely stuck, say so productively:</strong> "I do not immediately see the optimal approach. Let me start with the brute force and look for the redundant work." That is a far stronger signal than silence — and interviewers will usually offer a hint once you have shown a direction.</p>
<blockquote><p><strong>The meta-point:</strong> they are hiring someone to solve problems they have not encountered yet. Demonstrating a repeatable method matters more than producing the optimal solution in silence.</p></blockquote>`
},
{
  q: "What are the string algorithms and problems worth knowing?",
  level: "advanced", tags: ["strings", "algorithms"],
  a: `<pre><code>// Frequency map — the workhorse for anagram and character-count problems
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;      // faster than a HashMap for ASCII

// Anagram check — O(n) with counting, not O(n log n) with sorting
boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;
    int[] count = new int[26];
    for (int i = 0; i &lt; a.length(); i++) { count[a.charAt(i)-'a']++; count[b.charAt(i)-'a']--; }
    for (int c : count) if (c != 0) return false;
    return true;
}

// Group anagrams — the sorted string (or the count signature) is the key
Map&lt;String, List&lt;String&gt;&gt; groups = new HashMap&lt;&gt;();
for (String w : words) {
    char[] chars = w.toCharArray(); Arrays.sort(chars);
    groups.computeIfAbsent(new String(chars), k -&gt; new ArrayList&lt;&gt;()).add(w);
}

// Palindrome — two pointers from the ends
boolean isPalindrome(String s) {
    int lo = 0, hi = s.length() - 1;
    while (lo &lt; hi) {
        while (lo &lt; hi &amp;&amp; !Character.isLetterOrDigit(s.charAt(lo))) lo++;
        while (lo &lt; hi &amp;&amp; !Character.isLetterOrDigit(s.charAt(hi))) hi--;
        if (Character.toLowerCase(s.charAt(lo++)) != Character.toLowerCase(s.charAt(hi--)))
            return false;
    }
    return true;
}

// Longest palindromic substring — EXPAND AROUND CENTRE, O(n^2) time, O(1) space
// (2n-1 centres: n single characters + n-1 gaps between them)</code></pre>
<p><strong>Algorithms worth naming if the problem calls for them:</strong> <strong>KMP</strong> for substring search in O(n+m) using a prefix table (the JDK's <code>indexOf</code> is naive O(n·m)); <strong>Rabin-Karp</strong> with rolling hashes for multiple-pattern search and plagiarism detection; and a <strong>Trie</strong> for prefix problems, autocomplete and word dictionaries.</p>
<p><strong>The Java-specific detail that catches people:</strong> <code>String</code> is immutable, so concatenation in a loop is O(n²) — build with <code>StringBuilder</code>. And <code>s.charAt(i)</code> returns a UTF-16 code unit, not a character: emoji and many CJK characters are surrogate pairs, so <code>length()</code> is not the visible character count. Use <code>s.codePoints()</code> when correctness with real user input matters — that answer stands out.</p>`
}
]);
