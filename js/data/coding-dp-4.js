appendTopic("coding-dp", [
{
  q: "Knapsack and its family — subset sum, partition, coin change and target sum",
  level: "advanced", hot: true, tags: ["dp", "knapsack", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Walmart", "Oracle"],
  a: `<p>Half of all DP questions are knapsack in disguise. Learn the two shapes — <strong>0/1</strong> (each item once) and <strong>unbounded</strong> (items reusable) — and the rest are relabelling.</p>
<pre><code>// 0/1 KNAPSACK — dp[w] = best value achievable with capacity w
int[] dp = new int[W + 1];
for (int i = 0; i &lt; n; i++)
    for (int w = W; w &gt;= weight[i]; w--)               // BACKWARD
        dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);

// UNBOUNDED KNAPSACK — identical, except the inner loop direction
for (int i = 0; i &lt; n; i++)
    for (int w = weight[i]; w &lt;= W; w++)               // FORWARD
        dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);

// THE LOOP DIRECTION IS THE WHOLE DIFFERENCE, and it is the most valuable
// single fact in DP:
//   BACKWARD -> dp[w - weight] still holds the PREVIOUS item's row, so item i
//               is used at most once.
//   FORWARD  -> dp[w - weight] may already include item i, so it can be
//               reused any number of times.
// Getting it backwards compiles, runs, and returns a plausible wrong number.</code></pre>
<table>
<tr><th>Problem</th><th>It is really</th><th>The mapping</th></tr>
<tr><td>Subset sum</td><td>0/1 knapsack, boolean</td><td>Can we hit exactly <code>target</code>?</td></tr>
<tr><td>Partition equal subset sum</td><td>Subset sum</td><td>Target = <code>total / 2</code>; odd total → immediately false</td></tr>
<tr><td>Target sum (+/− signs)</td><td>Subset sum</td><td>Choosing the <code>+</code> set: <code>(total + target) / 2</code></td></tr>
<tr><td>Last stone weight II</td><td>Partition</td><td>Minimise the difference of two subsets</td></tr>
<tr><td>Coin change (fewest coins)</td><td><strong>Unbounded</strong>, minimising</td><td>Initialise to a sentinel, not zero</td></tr>
<tr><td>Coin change II (count ways)</td><td><strong>Unbounded</strong>, counting</td><td><strong>Coins outer, amount inner</strong> — see below</td></tr>
<tr><td>Combination sum IV</td><td>Counting <em>permutations</em></td><td><strong>Amount outer, coins inner</strong></td></tr>
<tr><td>Rod cutting</td><td>Unbounded knapsack</td><td>Length is weight, price is value</td></tr>
<tr><td>Ones and zeroes</td><td>0/1 with <em>two</em> capacities</td><td><code>dp[m][n]</code>, both loops backward</td></tr>
</table>
<pre><code>// COMBINATIONS vs PERMUTATIONS — the loop-order trap that catches everyone
// Coins [1,2], amount 3.

// COUNT COMBINATIONS (1+2 and 2+1 are the SAME) -> coins OUTER
for (int coin : coins)
    for (int a = coin; a &lt;= amount; a++) dp[a] += dp[a - coin];
// Answer: 2  ->  {1,1,1} and {1,2}

// COUNT PERMUTATIONS (order matters) -> amount OUTER
for (int a = 1; a &lt;= amount; a++)
    for (int coin : coins) if (a &gt;= coin) dp[a] += dp[a - coin];
// Answer: 3  ->  {1,1,1}, {1,2}, {2,1}
//
// Same three lines, different loop nesting, different question answered.
// If you remember one thing about counting DP, make it this.</code></pre>
<pre><code>// COIN CHANGE (fewest coins) — the sentinel matters
int[] dp = new int[amount + 1];
Arrays.fill(dp, amount + 1);        // NOT Integer.MAX_VALUE: dp[x]+1 overflows
dp[0] = 0;
for (int a = 1; a &lt;= amount; a++)
    for (int c : coins)
        if (c &lt;= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
return dp[amount] &gt; amount ? -1 : dp[amount];
// amount+1 is unreachable (the most coins possible is amount ones), so it
// works as infinity and cannot overflow.</code></pre>
<p><strong>Complexity:</strong> O(n·W) time, O(W) space after rolling the table. Note this is <em>pseudo-polynomial</em> — W is a value, not an input size, so a capacity of 10⁹ is infeasible even with ten items. Saying that is the difference between reciting knapsack and understanding it, and it is the standard follow-up.</p>`
},
{
  q: "Sequence DP: LIS, LCS, edit distance and the state that connects them",
  level: "advanced", hot: true, tags: ["dp", "lcs", "lis", "strings", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<pre><code>// LCS — the two-sequence template. Every variant is this with a changed rule.
int[][] dp = new int[n + 1][m + 1];             // dp[i][j] over PREFIXES
for (int i = 1; i &lt;= n; i++)
    for (int j = 1; j &lt;= m; j++)
        dp[i][j] = a.charAt(i-1) == b.charAt(j-1)
                 ? dp[i-1][j-1] + 1                          // match: extend
                 : Math.max(dp[i-1][j], dp[i][j-1]);         // skip one side
// The 1-based table with a row and column of zeros removes every boundary
// special case. Always size it n+1 by m+1.

// EDIT DISTANCE — same shape, three operations instead of two
dp[i][j] = a.charAt(i-1) == b.charAt(j-1)
         ? dp[i-1][j-1]                                    // no cost
         : 1 + Math.min(dp[i-1][j-1],      // REPLACE
                Math.min(dp[i-1][j],       // DELETE from a
                         dp[i][j-1]));     // INSERT into a
// Base cases carry the meaning: dp[i][0] = i (delete everything),
// dp[0][j] = j (insert everything).</code></pre>
<table>
<tr><th>Problem</th><th>Change to the LCS rule</th></tr>
<tr><td>Longest common substring (contiguous)</td><td>On mismatch set <code>dp[i][j] = 0</code>; track a global max</td></tr>
<tr><td>Shortest common supersequence</td><td><code>n + m − LCS</code></td></tr>
<tr><td>Minimum deletions to make two strings equal</td><td><code>n + m − 2·LCS</code></td></tr>
<tr><td>Longest palindromic subsequence</td><td>LCS of <code>s</code> and <code>reverse(s)</code></td></tr>
<tr><td>Distinct subsequences (count)</td><td>On match <code>dp[i-1][j-1] + dp[i-1][j]</code>, else <code>dp[i-1][j]</code></td></tr>
<tr><td>Wildcard / regex matching</td><td>Same grid; <code>*</code> means "skip it" or "consume one more"</td></tr>
<tr><td>Interleaving string</td><td>Boolean grid over two prefixes</td></tr>
</table>
<pre><code>// LIS — two solutions, and the second one is the interview answer
// (a) O(n^2): dp[i] = longest increasing subsequence ENDING at i
for (int i = 0; i &lt; n; i++)
    for (int j = 0; j &lt; i; j++)
        if (a[j] &lt; a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);

// (b) O(n log n) — patience sorting. tails[k] = the SMALLEST possible tail
//     of an increasing subsequence of length k+1.
List&lt;Integer&gt; tails = new ArrayList&lt;&gt;();
for (int x : a) {
    int pos = Collections.binarySearch(tails, x);
    if (pos &lt; 0) pos = -(pos + 1);              // insertion point
    if (pos == tails.size()) tails.add(x);      // extends the longest run
    else tails.set(pos, x);                     // a better tail at that length
}
return tails.size();
//
// CRITICAL: the tails array is NOT the LIS itself — it is only the right LENGTH.
// Claiming otherwise is a common and easily caught mistake. To recover the
// actual subsequence you must record predecessor indices as you go.
//
// For NON-DECREASING, switch to an upper-bound search instead.</code></pre>
<pre><code>// SPACE OPTIMISATION — the standard follow-up on any 2D DP
// dp[i][j] depends only on row i-1 and the current row, so keep two rows:
int[] prev = new int[m + 1], cur = new int[m + 1];
for (int i = 1; i &lt;= n; i++) {
    for (int j = 1; j &lt;= m; j++) { /* read prev[], write cur[] */ }
    int[] t = prev; prev = cur; cur = t;        // swap, do not reallocate
}
// O(n·m) -> O(m). Reduce m by making the SHORTER string the inner dimension.
//
// The cost: you can no longer reconstruct the actual sequence, only its
// length, because the earlier rows are gone. State that trade-off — it is
// exactly what the interviewer is checking you noticed.</code></pre>
<p><strong>The connecting idea:</strong> every two-sequence DP is "given prefixes of length i and j, what is the answer?" — and the transition is always "characters match, or skip one side". Once you see that, LCS, edit distance, wildcard matching and distinct subsequences stop being four problems and become one grid with four different rules in the cell.</p>`
}
]);
