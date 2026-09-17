appendTopic("coding-dp", [
{
  q: "How do you recognise a DP problem, and what are the standard state shapes?",
  level: "beginner", hot: true, tags: ["dp", "pattern", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Uber", "Walmart"],
  a: `<table>
<tr><th>Signal in the problem</th><th>Likely DP</th></tr>
<tr><td>"Number of ways to…"</td><td>Counting DP</td></tr>
<tr><td>"Minimum / maximum cost to…"</td><td>Optimisation DP</td></tr>
<tr><td>"Is it possible to…"</td><td>Boolean DP (subset sum)</td></tr>
<tr><td>"Longest / shortest … subsequence"</td><td>LIS or LCS family</td></tr>
<tr><td>Choices at each step that affect later steps</td><td>DP, not greedy</td></tr>
<tr><td>Brute force is exponential and <b>recomputes</b> the same subproblem</td><td><strong>DP — this is the actual test</strong></td></tr>
</table>
<p><strong>The distinguishing question:</strong> does a locally optimal choice stay optimal? If yes, greedy. If a choice now can make a later choice worse, you need DP. Coins [1,3,4] for amount 6 is the standard proof: greedy takes 4+1+1, optimal is 3+3.</p>
<table>
<tr><th>State shape</th><th>Meaning</th><th>Problems</th></tr>
<tr><td><code>dp[i]</code></td><td>Answer considering the first i items</td><td>Stairs, house robber, LIS, decode ways</td></tr>
<tr><td><code>dp[i][j]</code> two sequences</td><td>Prefixes of both</td><td>LCS, edit distance, distinct subsequences</td></tr>
<tr><td><code>dp[i][w]</code> item + budget</td><td>First i items within capacity w</td><td>Knapsack, subset sum, target sum</td></tr>
<tr><td><code>dp[i][j]</code> interval</td><td>Answer for the range i..j</td><td>Matrix chain, burst balloons, palindrome partitioning</td></tr>
<tr><td><code>dp[i][state]</code></td><td>Position plus a small state</td><td>Stocks (holding/sold/rest), cooldown</td></tr>
<tr><td><code>dp[mask]</code></td><td>A subset as a bitmask</td><td>TSP, assignment — only for n ≤ ~20</td></tr>
<tr><td><code>dp[r][c]</code> grid</td><td>Cell in a grid</td><td>Unique paths, min path sum, maximal square</td></tr>
</table>
<pre><code>// The three questions that define any DP, in order:
// 1. STATE      — what does dp[...] MEAN? One sentence, in English.
// 2. TRANSITION — how does it build from smaller states?
// 3. BASE       — what is trivially known?
//
// If you cannot say the state in one English sentence, the state is wrong.
// "dp[i][j] is the length of the longest common subsequence of a[0..i)
//  and b[0..j)" — that sentence IS the solution; the code follows from it.</code></pre>
<pre><code>// INTERVAL DP, the shape people meet least often. Note the loop order:
// length OUTERMOST, because dp[i][j] depends on SHORTER intervals inside it.
for (int len = 2; len <= n; len++)
    for (int i = 0; i + len <= n; i++) {
        int j = i + len - 1;
        for (int k = i; k < j; k++)                       // split point
            dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k+1][j] + cost(i,k,j));
    }
// O(n^3). Getting the loop order wrong here reads a cell that is not
// computed yet, and the bug is silent — you get a wrong number, not a crash.</code></pre>
<p><strong>Say this when you spot one:</strong> "The brute force branches into overlapping subproblems — I'm computing <code>f(3)</code> from several paths. That's the signal for DP. Let me define the state first: <code>dp[i]</code> is …"</p>`
},
{
  q: "Longest palindromic substring and the interval DP family",
  level: "advanced", hot: true, tags: ["dp", "strings", "interval", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Zoho", "Oracle"],
  a: `<div class="cx"><b>Expand around centre: O(n²) time, O(1) space</b><span>the one to write</span><b>DP: O(n²) both</b><span>easier to extend</span></div>
<pre><code>// EXPAND AROUND CENTRE — 2n-1 centres: n characters + n-1 gaps
public String longestPalindrome(String s) {
    int start = 0, len = 0;
    for (int i = 0; i < s.length(); i++) {
        int odd  = expand(s, i, i);        // centred on a character
        int even = expand(s, i, i + 1);    // centred between two
        int best = Math.max(odd, even);
        if (best > len) { len = best; start = i - (best - 1) / 2; }
    }
    return s.substring(start, start + len);
}
private int expand(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    return r - l - 1;                       // l and r overshot by one each
}
// Forgetting the EVEN-length centres is the standard bug: "abba" returns "a".</code></pre>
<pre><code>// DP version — dp[i][j] = is s[i..j] a palindrome?
// Note the loop direction: i goes DOWNWARD because dp[i][j] needs dp[i+1][j-1],
// a row BELOW it. Looping i upward reads uncomputed cells.
boolean[][] dp = new boolean[n][n];
for (int i = n - 1; i >= 0; i--) {
    dp[i][i] = true;
    for (int j = i + 1; j < n; j++) {
        dp[i][j] = s.charAt(i) == s.charAt(j) && (j - i < 3 || dp[i + 1][j - 1]);
    }
}
// j - i < 3 handles "aa" and "aba" without an out-of-range read.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Expanding outward from odd and even centres">
  <text class="dg-s" x="16" y="22">odd centre</text>
  <rect class="dg-fill" x="16" y="32" width="40" height="30" rx="4"/><text class="dg-t" x="36" y="52" text-anchor="middle">a</text>
  <rect class="dg-fill2" x="60" y="32" width="40" height="30" rx="4"/><text class="dg-t" x="80" y="52" text-anchor="middle">b</text>
  <rect class="dg-fill" x="104" y="32" width="40" height="30" rx="4"/><text class="dg-t" x="124" y="52" text-anchor="middle">a</text>
  <path class="dg-line" d="M80 68 L40 68 M80 68 L120 68" marker-end="url(#pd1)"/>
  <text class="dg-s" x="200" y="52">expand from one character</text>
  <text class="dg-s" x="16" y="100">even centre</text>
  <rect class="dg-fill" x="16" y="106" width="40" height="28" rx="4"/><text class="dg-t" x="36" y="125" text-anchor="middle">b</text>
  <rect class="dg-fill" x="60" y="106" width="40" height="28" rx="4"/><text class="dg-t" x="80" y="125" text-anchor="middle">b</text>
  <text class="dg-s" x="200" y="124">expand from the GAP — miss this and "abba" fails</text>
  <defs><marker id="pd1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Related problem</th><th>Approach</th></tr>
<tr><td>Count palindromic substrings</td><td>Same expansion, count instead of maxing</td></tr>
<tr><td>Longest palindromic <em>subsequence</em></td><td><strong>LCS of s and reverse(s)</strong></td></tr>
<tr><td>Minimum insertions to make a palindrome</td><td><code>n − longest palindromic subsequence</code></td></tr>
<tr><td>Palindrome partitioning II (min cuts)</td><td>Precompute the palindrome table, then a 1D cut DP</td></tr>
<tr><td>Burst balloons</td><td>Interval DP — think about the <strong>last</strong> balloon burst, not the first</td></tr>
<tr><td>Matrix chain multiplication</td><td>Interval DP over split points</td></tr>
</table>
<p><strong>Worth naming:</strong> Manacher's algorithm solves longest palindromic substring in <strong>O(n)</strong> by reusing mirror information around a centre. Nobody expects you to write it under pressure — but saying "there's an O(n) solution, Manacher's, though I'd write the O(n²) expansion here unless the constraints force it" is the right level of awareness.</p>`
},
{
  q: "Bitmask DP and when exponential is the intended answer",
  level: "advanced", tags: ["dp", "bitmask", "complexity"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Uber", "Oracle"],
  a: `<p><strong>The constraint is the hint.</strong> When n ≤ 20, O(2ⁿ) is not a failure — it is the intended solution. 2²⁰ ≈ 1 million, which is instant.</p>
<pre><code>// A subset of n items IS an integer. Bit i set = item i included.
//   mask = 0b01011  ->  items 0, 1 and 3 are in the set
//
mask | (1 << i)          // add item i
mask & ~(1 << i)         // remove it
(mask >> i) & 1          // is it in?
Integer.bitCount(mask)   // how many items — a single CPU instruction
mask == (1 << n) - 1     // all items used
for (int s = mask; s > 0; s = (s - 1) & mask)   // iterate every SUBSET of mask</code></pre>
<pre><code>// TRAVELLING SALESMAN — the canonical bitmask DP. O(2^n · n^2).
// dp[mask][i] = cheapest path visiting exactly the cities in mask,
//               currently standing at city i.
int[][] dp = new int[1 << n][n];
for (int[] row : dp) Arrays.fill(row, INF);
dp[1][0] = 0;                                   // start at city 0

for (int mask = 1; mask < (1 << n); mask++)
    for (int i = 0; i < n; i++) {
        if (dp[mask][i] == INF || (mask >> i & 1) == 0) continue;
        for (int j = 0; j < n; j++) {
            if ((mask >> j & 1) == 1) continue;         // already visited
            int next = mask | (1 << j);
            dp[next][j] = Math.min(dp[next][j], dp[mask][i] + cost[i][j]);
        }
    }
// Brute force is O(n!) — 20! is 10^18. This is O(2^20 · 400) ≈ 4x10^8.
// Still exponential, but a completely different universe.</code></pre>
<table>
<tr><th>n up to</th><th>Feasible</th><th>Technique</th></tr>
<tr><td>~11</td><td>O(n!)</td><td>Plain permutations</td></tr>
<tr><td><strong>~20</strong></td><td><strong>O(2ⁿ · n)</strong></td><td><strong>Bitmask DP</strong></td></tr>
<tr><td>~24</td><td>O(2^(n/2))</td><td>Meet in the middle</td></tr>
<tr><td>Larger</td><td>—</td><td>Approximation, or the problem has structure you missed</td></tr>
</table>
<table>
<tr><th>Problem</th><th>Mask represents</th></tr>
<tr><td>Travelling salesman</td><td>Cities visited</td></tr>
<tr><td>Assignment (n tasks to n workers)</td><td>Tasks already assigned</td></tr>
<tr><td>Partition to K equal subsets</td><td>Elements used</td></tr>
<tr><td>Shortest path visiting all nodes</td><td>Nodes seen — BFS over (node, mask)</td></tr>
<tr><td>Count valid seatings / colourings</td><td>The previous row's configuration</td></tr>
</table>
<pre><code>// MEET IN THE MIDDLE — when n is ~24-40 and 2^n is too much.
// Split into two halves, enumerate 2^(n/2) subsets of each (~65k for n=32),
// sort one half, binary search for the complement.
// Turns O(2^n) into O(2^(n/2) · n). Subset-sum on n=40 becomes feasible.</code></pre>
<p><strong>The judgement to show:</strong> "2ⁿ looks alarming, but n ≤ 20 in the constraints is the problem telling me exponential is expected. What matters is that it is 2ⁿ and not n! — and that the memory is 2ⁿ·n ints, which at n=20 is about 80 MB and is usually the real ceiling."</p>`
}
]);
