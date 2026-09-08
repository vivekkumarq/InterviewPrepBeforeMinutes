registerTopic("coding-dp", [
{
  q: "Climbing stairs, house robber and the 1D DP family",
  level: "beginner", hot: true, tags: ["dp", "space-optimisation", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Walmart", "Zoho"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(1) space</b><span>after collapsing the array</span></div>
<pre><code>// CLIMBING STAIRS — 1 or 2 steps at a time. This is Fibonacci in disguise.
// State:      dp[i] = ways to reach step i
// Recurrence: dp[i] = dp[i-1] + dp[i-2]
public int climbStairs(int n) {
    int prev = 1, curr = 1;              // dp[0] = dp[1] = 1
    for (int i = 2; i &lt;= n; i++) {
        int next = prev + curr;
        prev = curr;
        curr = next;
    }
    return curr;
}

// HOUSE ROBBER — cannot rob two adjacent houses
// State:      dp[i] = maximum loot considering houses 0..i
// Recurrence: dp[i] = max(dp[i-1],            // skip house i
//                         dp[i-2] + nums[i])  // rob it, so i-1 is off limits
public int rob(int[] nums) {
    int skip = 0, take = 0;              // dp[i-2], dp[i-1]
    for (int x : nums) {
        int next = Math.max(take, skip + x);
        skip = take;
        take = next;
    }
    return take;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="One dimensional DP where each state depends on the previous two">
  <rect class="dg-box" x="30" y="50" width="60" height="34" rx="6"/><text class="dg-t" x="60" y="72" text-anchor="middle">dp[i-2]</text>
  <rect class="dg-box" x="130" y="50" width="60" height="34" rx="6"/><text class="dg-t" x="160" y="72" text-anchor="middle">dp[i-1]</text>
  <rect class="dg-fill" x="240" y="50" width="60" height="34" rx="6"/><text class="dg-t" x="270" y="72" text-anchor="middle">dp[i]</text>
  <path class="dg-line" d="M90 60 Q165 20 240 58" marker-end="url(#dp1)"/>
  <path class="dg-line" d="M192 70 H236" marker-end="url(#dp1)"/>
  <text class="dg-s" x="360" y="46">only the last TWO states matter,</text>
  <text class="dg-s" x="360" y="68">so the whole array collapses into</text>
  <text class="dg-s" x="360" y="90">two variables — O(n) space → O(1)</text>
  <text class="dg-s" x="16" y="132">this same collapse works for Fibonacci, stairs, robber, and best-time-to-buy-stock</text>
  <defs><marker id="dp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>State</th><th>Recurrence</th></tr>
<tr><td>Climbing stairs</td><td>Ways to reach step i</td><td><code>dp[i-1] + dp[i-2]</code></td></tr>
<tr><td>Min cost climbing stairs</td><td>Cheapest way to reach i</td><td><code>cost[i] + min(dp[i-1], dp[i-2])</code></td></tr>
<tr><td>House robber</td><td>Best loot up to i</td><td><code>max(dp[i-1], dp[i-2] + nums[i])</code></td></tr>
<tr><td><strong>House robber II</strong> (circular)</td><td>Same</td><td>Run it twice: houses 0..n−2 and 1..n−1, take the max</td></tr>
<tr><td>Decode ways</td><td>Decodings of the prefix</td><td><code>dp[i-1]</code> if valid single + <code>dp[i-2]</code> if valid pair</td></tr>
<tr><td>Best time to buy/sell stock</td><td>Min price so far</td><td>Track <code>minPrice</code> and <code>maxProfit</code> — Kadane in disguise</td></tr>
<tr><td>Jump game</td><td>Furthest reachable index</td><td>Greedy beats DP here — worth saying</td></tr>
</table>
<p><strong>How to present a DP answer</strong> — the process matters more than the code:</p>
<ol>
<li>Name the <strong>state</strong> in one sentence. "<code>dp[i]</code> is the maximum loot considering the first i houses."</li>
<li>Write the <strong>recurrence</strong> and justify each branch out loud.</li>
<li>State the <strong>base cases</strong> and the iteration order.</li>
<li><em>Then</em> mention the space optimisation, once the correct version exists.</li>
</ol>
<p><strong>The circular variant is the follow-up to be ready for.</strong> House Robber II wraps the street into a circle, so the first and last houses are adjacent. The insight is that you cannot rob both — so run the linear solution twice, once excluding the last house and once excluding the first, and take the larger. Reducing a new problem to one you already solved is exactly what interviewers are looking for.</p>`
},
{
  q: "0/1 Knapsack — and why the loop direction changes for the unbounded version",
  level: "advanced", hot: true, tags: ["dp", "knapsack", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Flipkart", "Oracle"],
  a: `<div class="cx"><b>O(n·W) time</b><span>pseudo-polynomial — W is a value, not an input size</span><b>O(W) space</b><span>after rolling the 2D table</span></div>
<pre><code>// 2D — the version to write first, because it is easiest to verify
// dp[i][w] = best value using the first i items within capacity w
public int knapsack(int[] weight, int[] value, int W) {
    int n = weight.length;
    int[][] dp = new int[n + 1][W + 1];

    for (int i = 1; i &lt;= n; i++) {
        for (int w = 0; w &lt;= W; w++) {
            dp[i][w] = dp[i - 1][w];                             // skip item i
            if (weight[i - 1] &lt;= w) {                            // or take it
                dp[i][w] = Math.max(dp[i][w],
                                    dp[i - 1][w - weight[i - 1]] + value[i - 1]);
            }
        }
    }
    return dp[n][W];
}</code></pre>
<pre><code>// 1D rolled — and THIS is where the loop direction matters
// 0/1 knapsack: each item used AT MOST ONCE  -> iterate capacity DOWNWARD
for (int i = 0; i &lt; n; i++) {
    for (int w = W; w &gt;= weight[i]; w--) {
        dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);
    }
}

// UNBOUNDED knapsack: each item reusable    -> iterate capacity UPWARD
for (int i = 0; i &lt; n; i++) {
    for (int w = weight[i]; w &lt;= W; w++) {
        dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);
    }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Loop direction determining whether an item can be reused">
  <text class="dg-s" x="16" y="20">downward (0/1)</text>
  <rect class="dg-box" x="16" y="30" width="46" height="28" rx="4"/><text class="dg-s" x="39" y="49" text-anchor="middle">w-2</text>
  <rect class="dg-box" x="66" y="30" width="46" height="28" rx="4"/><text class="dg-s" x="89" y="49" text-anchor="middle">w-1</text>
  <rect class="dg-fill" x="116" y="30" width="46" height="28" rx="4"/><text class="dg-s" x="139" y="49" text-anchor="middle">w</text>
  <path class="dg-line" d="M62 44 H112" marker-end="url(#kp1)"/>
  <text class="dg-s" x="190" y="49">reads a cell not yet updated this round</text>
  <text class="dg-s" x="190" y="67">→ still the PREVIOUS item's row → used once</text>
  <text class="dg-s" x="16" y="104">upward (unbounded)</text>
  <rect class="dg-fill" x="16" y="114" width="46" height="28" rx="4"/><text class="dg-s" x="39" y="133" text-anchor="middle">w-2</text>
  <rect class="dg-fill" x="66" y="114" width="46" height="28" rx="4"/><text class="dg-s" x="89" y="133" text-anchor="middle">w-1</text>
  <rect class="dg-fill" x="116" y="114" width="46" height="28" rx="4"/><text class="dg-s" x="139" y="133" text-anchor="middle">w</text>
  <path class="dg-line" d="M112 128 H62" marker-end="url(#kp1)"/>
  <text class="dg-s" x="190" y="128">reads a cell ALREADY updated with this item</text>
  <text class="dg-s" x="190" y="146">→ the same item is counted again → reusable</text>
  <defs><marker id="kp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Knapsack flavour</th></tr>
<tr><td>Subset sum — can any subset hit the target?</td><td>0/1, boolean table</td></tr>
<tr><td>Partition into two equal halves</td><td>Subset sum for <code>total/2</code>; odd total is instantly false</td></tr>
<tr><td>Target sum (assign + or −)</td><td>Rearranges to subset sum for <code>(total + target)/2</code></td></tr>
<tr><td><strong>Coin change</strong> — fewest coins</td><td>Unbounded, minimising</td></tr>
<tr><td>Coin change II — number of ways</td><td>Unbounded, counting; <strong>loop coins outside, amount inside</strong> or you count permutations</td></tr>
<tr><td>Rod cutting</td><td>Unbounded, maximising</td></tr>
<tr><td>Last stone weight II</td><td>Partition into two subsets as close as possible</td></tr>
</table>
<pre><code>// The coin-change-II loop-order trap, which is a different bug from the direction one
// ✔ COMBINATIONS (1+2 counted once)          ✗ PERMUTATIONS (1+2 and 2+1 both counted)
for (int c : coins)                            for (int a = 1; a &lt;= amount; a++)
    for (int a = c; a &lt;= amount; a++)              for (int c : coins)
        dp[a] += dp[a - c];                            if (c &lt;= a) dp[a] += dp[a - c];</code></pre>
<p><strong>The complexity point worth making:</strong> O(n·W) is <em>pseudo-polynomial</em>. W is a numeric value, so the table grows with the magnitude of the capacity, not with the size of the input — a capacity of 10⁹ is intractable even with 3 items. Knapsack is NP-complete; this DP is efficient only when W is small. Saying that unprompted is a strong signal.</p>`
},
{
  q: "Longest common subsequence and edit distance",
  level: "advanced", hot: true, tags: ["dp", "lcs", "edit-distance", "strings"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Goldman Sachs", "Flipkart"],
  a: `<div class="cx"><b>O(m·n) time</b><span>fill the whole table</span><b>O(min(m,n)) space</b><span>two rows are enough</span></div>
<pre><code>// LONGEST COMMON SUBSEQUENCE
// dp[i][j] = LCS length of a[0..i) and b[0..j)
public int lcs(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i &lt;= m; i++) {
        for (int j = 1; j &lt;= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;                 // match: extend diagonally
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); // drop one character
            }
        }
    }
    return dp[m][n];
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="DP table with diagonal, left and up dependencies">
  <rect class="dg-box" x="120" y="34" width="54" height="34" rx="5"/><text class="dg-s" x="147" y="55" text-anchor="middle">i-1,j-1</text>
  <rect class="dg-box" x="184" y="34" width="54" height="34" rx="5"/><text class="dg-s" x="211" y="55" text-anchor="middle">i-1,j</text>
  <rect class="dg-box" x="120" y="78" width="54" height="34" rx="5"/><text class="dg-s" x="147" y="99" text-anchor="middle">i,j-1</text>
  <rect class="dg-fill" x="184" y="78" width="54" height="34" rx="5"/><text class="dg-s" x="211" y="99" text-anchor="middle">i,j</text>
  <path class="dg-line" d="M170 62 L190 82 M211 70 V76 M178 95 H182" marker-end="url(#lc1)"/>
  <text class="dg-s" x="290" y="52">match  → diagonal + 1</text>
  <text class="dg-s" x="290" y="76">no match → max(up, left)</text>
  <text class="dg-s" x="290" y="100">edit distance → 1 + min(all three)</text>
  <text class="dg-s" x="16" y="144">every cell depends only on the row above and the cell to its left — so two rows suffice</text>
  <defs><marker id="lc1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// EDIT DISTANCE (Levenshtein) — same table shape, three operations
public int minDistance(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 0; i &lt;= m; i++) dp[i][0] = i;      // delete everything
    for (int j = 0; j &lt;= n; j++) dp[0][j] = j;      // insert everything

    for (int i = 1; i &lt;= m; i++) {
        for (int j = 1; j &lt;= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];                    // free — no operation
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],       // REPLACE
                                Math.min(dp[i - 1][j],          // DELETE from a
                                         dp[i][j - 1]));        // INSERT into a
            }
        }
    }
    return dp[m][n];
}</code></pre>
<pre><code>// Reconstructing the actual subsequence — walk the table BACKWARDS
StringBuilder sb = new StringBuilder();
int i = m, j = n;
while (i &gt; 0 && j &gt; 0) {
    if (a.charAt(i - 1) == b.charAt(j - 1)) { sb.append(a.charAt(i - 1)); i--; j--; }
    else if (dp[i - 1][j] &gt;= dp[i][j - 1]) i--;
    else j--;
}
String result = sb.reverse().toString();</code></pre>
<table>
<tr><th>Problem</th><th>Reduces to</th></tr>
<tr><td>Longest common <strong>substring</strong></td><td>Same table, but reset to 0 on a mismatch and track the running max</td></tr>
<tr><td>Shortest common supersequence</td><td><code>m + n − LCS</code></td></tr>
<tr><td>Minimum deletions to make two strings equal</td><td><code>m + n − 2·LCS</code></td></tr>
<tr><td>Longest palindromic subsequence</td><td>LCS of the string and its reverse</td></tr>
<tr><td>Minimum insertions to make a palindrome</td><td><code>n − longest palindromic subsequence</code></td></tr>
<tr><td>Distinct subsequences</td><td>Same table, counting instead of maximising</td></tr>
</table>
<p><strong>Subsequence versus substring</strong> — get this right before writing anything: a <em>subsequence</em> keeps order but allows gaps ("ace" is a subsequence of "abcde"); a <em>substring</em> must be contiguous. The one-word difference changes the recurrence, and mixing them up is the most common way this question is failed.</p>
<p><strong>Where it is used for real:</strong> <code>git diff</code> and every diff tool are LCS on lines; spell checkers and fuzzy search rank by edit distance; and DNA sequence alignment is the same algorithm with a scoring matrix instead of a flat cost of 1.</p>`
},
{
  q: "Longest increasing subsequence — the O(n log n) solution",
  level: "advanced", hot: true, tags: ["dp", "lis", "binary-search", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Goldman Sachs", "Salesforce"],
  a: `<pre><code>// O(n^2) DP — write this first, it is easy to justify
// dp[i] = length of the longest increasing subsequence ENDING at i
public int lengthOfLisQuadratic(int[] nums) {
    int[] dp = new int[nums.length];
    Arrays.fill(dp, 1);
    int best = 1;
    for (int i = 1; i &lt; nums.length; i++) {
        for (int j = 0; j &lt; i; j++) {
            if (nums[j] &lt; nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
        best = Math.max(best, dp[i]);
    }
    return best;
}</code></pre>
<div class="cx"><b>O(n log n) time</b><span>binary search per element</span><b>O(n) space</b><span>the tails array</span></div>
<pre><code>// O(n log n) — patience sorting.
// tails[k] = the SMALLEST possible tail value of an increasing subsequence
//            of length k+1 seen so far.
public int lengthOfLIS(int[] nums) {
    List&lt;Integer&gt; tails = new ArrayList&lt;&gt;();

    for (int x : nums) {
        int i = Collections.binarySearch(tails, x);
        if (i &lt; 0) i = -(i + 1);              // insertion point

        if (i == tails.size()) tails.add(x);  // x extends the longest run
        else tails.set(i, x);                 // x makes a length-(i+1) run end SMALLER
    }
    return tails.size();
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Tails array evolving as elements are processed">
  <text class="dg-s" x="16" y="20">[10, 9, 2, 5, 3, 7, 101, 18]</text>
  <text class="dg-s" x="16" y="46">10   → tails [10]</text>
  <text class="dg-s" x="16" y="66">9    → tails [9]          replaced 10 — a length-1 run can end lower</text>
  <text class="dg-s" x="16" y="86">2    → tails [2]</text>
  <text class="dg-s" x="16" y="106">5    → tails [2, 5]       extended</text>
  <text class="dg-s" x="16" y="126">3    → tails [2, 3]       replaced 5</text>
  <text class="dg-s" x="16" y="146">7,101,18 → tails [2,3,7,18]   length 4</text>
  <text class="dg-s" x="380" y="66">tails is NOT the subsequence —</text>
  <text class="dg-s" x="380" y="86">only its LENGTH is meaningful.</text>
  <text class="dg-s" x="380" y="112">Keeping tails as small as possible</text>
  <text class="dg-s" x="380" y="132">leaves the most room to extend later.</text>
</svg>
</figure>
<p><strong>The point interviewers press on:</strong> <code>tails</code> is not the answer subsequence. It is a bookkeeping array whose <em>length</em> equals the LIS length. To recover the actual subsequence you must also store, for each element, the index of its predecessor, then walk that chain backwards. Claiming <code>tails</code> is the subsequence is a very common and very visible error.</p>
<table>
<tr><th>Variant</th><th>Change</th></tr>
<tr><td>Non-decreasing (allow equals)</td><td>Use an upper-bound search instead of lower-bound</td></tr>
<tr><td>Number of LIS</td><td>Second DP array counting how many ways each length is achieved</td></tr>
<tr><td>Longest <em>decreasing</em></td><td>Negate the values, or reverse the comparison</td></tr>
<tr><td><strong>Russian doll envelopes</strong></td><td>Sort by width ascending and height <em>descending</em>, then LIS on heights — the descending tie-break is what prevents two equal widths nesting</td></tr>
<tr><td>Maximum sum increasing subsequence</td><td>O(n²) DP, accumulate sums rather than counts</td></tr>
<tr><td>Minimum deletions to sort</td><td><code>n − LIS</code></td></tr>
<tr><td>Longest bitonic subsequence</td><td>LIS from the left plus LIS from the right, combined at each index</td></tr>
</table>
<p><strong>How to present it:</strong> give the O(n²) DP, confirm it is correct, then say "there is an O(n log n) version using patience sorting — the idea is to keep, for each length, the smallest tail value, which lets binary search find where each new element belongs." Deriving that on the spot is hard; recognising and explaining it is what is actually being tested.</p>`
},
{
  q: "Matrix DP — unique paths, minimum path sum and maximal square",
  level: "beginner", tags: ["dp", "matrix", "grid"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Uber", "Oracle"],
  a: `<pre><code>// UNIQUE PATHS — move only right or down
// dp[r][c] = number of ways to reach cell (r, c)
public int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);                      // the top row has exactly one path each
    for (int r = 1; r &lt; m; r++) {
        for (int c = 1; c &lt; n; c++) {
            dp[c] += dp[c - 1];              // dp[c] is "from above", dp[c-1] is "from left"
        }
    }
    return dp[n - 1];
}
// Closed form: C(m+n-2, m-1) — worth mentioning, it is O(min(m,n)) with no table.

// WITH OBSTACLES — one extra line
if (grid[r][c] == 1) dp[c] = 0; else dp[c] += dp[c - 1];</code></pre>
<pre><code>// MINIMUM PATH SUM
public int minPathSum(int[][] g) {
    int m = g.length, n = g[0].length;
    int[] dp = new int[n];
    dp[0] = g[0][0];
    for (int c = 1; c &lt; n; c++) dp[c] = dp[c - 1] + g[0][c];      // first row

    for (int r = 1; r &lt; m; r++) {
        dp[0] += g[r][0];                                          // first column
        for (int c = 1; c &lt; n; c++) {
            dp[c] = Math.min(dp[c], dp[c - 1]) + g[r][c];          // above vs left
        }
    }
    return dp[n - 1];
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Maximal square where each cell takes the minimum of three neighbours">
  <g>
    <rect class="dg-box" x="40" y="30" width="40" height="40" rx="4"/><text class="dg-t" x="60" y="55" text-anchor="middle">2</text>
    <rect class="dg-box" x="84" y="30" width="40" height="40" rx="4"/><text class="dg-t" x="104" y="55" text-anchor="middle">2</text>
    <rect class="dg-box" x="40" y="74" width="40" height="40" rx="4"/><text class="dg-t" x="60" y="99" text-anchor="middle">2</text>
    <rect class="dg-fill" x="84" y="74" width="40" height="40" rx="4"/><text class="dg-t" x="104" y="99" text-anchor="middle">3</text>
  </g>
  <path class="dg-line" d="M78 52 L92 74 M104 74 V70 M84 96 H80" marker-end="url(#mx1)"/>
  <text class="dg-s" x="170" y="52">dp[r][c] = 1 + min(up, left, diagonal)</text>
  <text class="dg-s" x="170" y="76">a 3×3 square can only end here if all</text>
  <text class="dg-s" x="170" y="98">three neighbours already support 2×2</text>
  <text class="dg-s" x="16" y="140">the MINIMUM is the point — one weak neighbour caps the square, which is why max would be wrong</text>
  <defs><marker id="mx1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// MAXIMAL SQUARE of 1s — dp[r][c] = side length of the largest square
// whose BOTTOM-RIGHT corner is (r, c)
public int maximalSquare(char[][] g) {
    int m = g.length, n = g[0].length, best = 0;
    int[][] dp = new int[m + 1][n + 1];              // padded, so no boundary checks

    for (int r = 1; r &lt;= m; r++) {
        for (int c = 1; c &lt;= n; c++) {
            if (g[r - 1][c - 1] == '1') {
                dp[r][c] = 1 + Math.min(dp[r - 1][c - 1],
                               Math.min(dp[r - 1][c], dp[r][c - 1]));
                best = Math.max(best, dp[r][c]);
            }
        }
    }
    return best * best;                              // AREA, not the side
}</code></pre>
<table>
<tr><th>Problem</th><th>State</th><th>Transition</th></tr>
<tr><td>Unique paths</td><td>Ways to reach (r,c)</td><td><code>up + left</code></td></tr>
<tr><td>Minimum path sum</td><td>Cheapest way to (r,c)</td><td><code>min(up, left) + cost</code></td></tr>
<tr><td>Maximal square</td><td>Side ending at (r,c)</td><td><code>1 + min(up, left, diagonal)</code></td></tr>
<tr><td>Triangle minimum path</td><td>Best from (r,c) downward</td><td>Go <strong>bottom-up</strong> — it removes every boundary case</td></tr>
<tr><td>Dungeon game</td><td>Health needed at (r,c)</td><td>Work <strong>backwards</strong> from the destination</td></tr>
<tr><td>Longest increasing path in a matrix</td><td>Longest path from (r,c)</td><td>Memoised DFS — no fixed direction, so a table order does not exist</td></tr>
</table>
<p><strong>Two habits worth demonstrating:</strong> pad the table with an extra row and column so you never write a boundary check inside the hot loop; and notice when the answer is easier to compute <em>backwards</em> — dungeon game and triangle are far cleaner bottom-up, because the constraint applies at the destination rather than the start.</p>`
},
{
  q: "Word break and partition-style DP",
  level: "advanced", tags: ["dp", "strings", "memoisation"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Salesforce"],
  a: `<div class="cx"><b>O(n²·L) time</b><span>n cut points × substrings × lookup</span><b>O(n) space</b><span>the boolean table</span></div>
<pre><code>// WORD BREAK — can the string be split entirely into dictionary words?
// dp[i] = true if s[0..i) can be fully segmented
public boolean wordBreak(String s, List&lt;String&gt; wordDict) {
    Set&lt;String&gt; dict = new HashSet&lt;&gt;(wordDict);
    int maxLen = wordDict.stream().mapToInt(String::length).max().orElse(0);

    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;                                    // the empty prefix is segmentable

    for (int i = 1; i &lt;= s.length(); i++) {
        // j is the START of the last word; it can never be more than maxLen back
        for (int j = Math.max(0, i - maxLen); j &lt; i; j++) {
            if (dp[j] && dict.contains(s.substring(j, i))) {
                dp[i] = true;
                break;                               // one valid split is enough
            }
        }
    }
    return dp[s.length()];
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Word break table marking segmentable prefixes">
  <text class="dg-s" x="16" y="22">s = "leetcode",  dict = {leet, code}</text>
  <g>
    <rect class="dg-fill" x="16" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="36" y="54" text-anchor="middle">l</text>
    <rect class="dg-fill" x="60" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="80" y="54" text-anchor="middle">e</text>
    <rect class="dg-fill" x="104" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="124" y="54" text-anchor="middle">e</text>
    <rect class="dg-fill" x="148" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="168" y="54" text-anchor="middle">t</text>
    <rect class="dg-fill2" x="196" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="216" y="54" text-anchor="middle">c</text>
    <rect class="dg-fill2" x="240" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="260" y="54" text-anchor="middle">o</text>
    <rect class="dg-fill2" x="284" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="304" y="54" text-anchor="middle">d</text>
    <rect class="dg-fill2" x="328" y="34" width="40" height="30" rx="4"/><text class="dg-t" x="348" y="54" text-anchor="middle">e</text>
  </g>
  <text class="dg-s" x="16" y="88">dp:  T  F  F  F  T  F  F  F  T</text>
  <text class="dg-s" x="16" y="112">dp[4] = true because dp[0] is true and "leet" is a word</text>
  <text class="dg-s" x="16" y="136">dp[8] = true because dp[4] is true and "code" is a word  → answer: yes</text>
</svg>
</figure>
<pre><code>// WORD BREAK II — return every possible sentence. Needs MEMOISED recursion,
// because the answer per suffix is a list, not a boolean.
public List&lt;String&gt; wordBreakII(String s, List&lt;String&gt; wordDict) {
    return dfs(s, new HashSet&lt;&gt;(wordDict), new HashMap&lt;&gt;());
}
private List&lt;String&gt; dfs(String s, Set&lt;String&gt; dict, Map&lt;String, List&lt;String&gt;&gt; memo) {
    if (memo.containsKey(s)) return memo.get(s);

    List&lt;String&gt; out = new ArrayList&lt;&gt;();
    if (s.isEmpty()) { out.add(""); return out; }

    for (int i = 1; i &lt;= s.length(); i++) {
        String prefix = s.substring(0, i);
        if (!dict.contains(prefix)) continue;
        for (String rest : dfs(s.substring(i), dict, memo)) {
            out.add(prefix + (rest.isEmpty() ? "" : " " + rest));
        }
    }
    memo.put(s, out);
    return out;
}
// Without the memo this is exponential — "aaaa...a" with dict {a, aa} is the
// standard adversarial input, and interviewers do use it.</code></pre>
<table>
<tr><th>Problem</th><th>State</th><th>Transition</th></tr>
<tr><td>Word break</td><td>Prefix segmentable?</td><td>Any valid last word</td></tr>
<tr><td>Palindrome partitioning II</td><td>Min cuts for the prefix</td><td>Any palindromic last piece</td></tr>
<tr><td>Decode ways</td><td>Decodings of the prefix</td><td>Last 1 or 2 digits valid</td></tr>
<tr><td>Perfect squares</td><td>Fewest squares summing to n</td><td>Unbounded coin change with square "coins"</td></tr>
<tr><td>Concatenated words</td><td>Word break where the dictionary excludes the word itself</td><td>Same table</td></tr>
</table>
<p><strong>Two optimisations worth naming:</strong> capping <code>j</code> at <code>i - maxWordLength</code> avoids checking substrings longer than any dictionary word, and a <strong>trie</strong> replaces the substring extraction and hashing entirely — you walk the trie forward from each start position and stop the moment the prefix leaves the tree. On long strings with a large dictionary that is a substantial difference.</p>`
},
{
  q: "Stock trading DP — one, two and k transactions with cooldown",
  level: "advanced", tags: ["dp", "state-machine", "arrays"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Morgan Stanley", "Uber"],
  a: `<pre><code>// I — ONE transaction. Kadane in disguise: track the minimum price so far.
public int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, best = 0;
    for (int p : prices) {
        minPrice = Math.min(minPrice, p);
        best = Math.max(best, p - minPrice);
    }
    return best;
}

// II — UNLIMITED transactions. Take every upward move; greedy is provably optimal
// because any increasing run decomposes into consecutive daily gains.
public int maxProfitII(int[] prices) {
    int total = 0;
    for (int i = 1; i &lt; prices.length; i++) {
        if (prices[i] &gt; prices[i - 1]) total += prices[i] - prices[i - 1];
    }
    return total;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="State machine for holding, sold and resting states">
  <circle class="dg-fill" cx="110" cy="60" r="34"/><text class="dg-s" x="110" y="65" text-anchor="middle">HOLD</text>
  <circle class="dg-fill2" cx="300" cy="60" r="34"/><text class="dg-s" x="300" y="65" text-anchor="middle">SOLD</text>
  <circle class="dg-box" cx="205" cy="136" r="34"/><text class="dg-s" x="205" y="141" text-anchor="middle">REST</text>
  <path class="dg-line" d="M144 54 H264" marker-end="url(#st1)"/>
  <text class="dg-s" x="204" y="42" text-anchor="middle">sell (+price)</text>
  <path class="dg-line" d="M288 92 L232 118" marker-end="url(#st1)"/>
  <text class="dg-s" x="290" y="118">cooldown</text>
  <path class="dg-line" d="M180 120 L128 92" marker-end="url(#st1)"/>
  <text class="dg-s" x="96" y="118" text-anchor="end">buy (−price)</text>
  <text class="dg-s" x="380" y="56">each state keeps its own best profit;</text>
  <text class="dg-s" x="380" y="78">transitions are the allowed actions</text>
  <text class="dg-s" x="380" y="100">the cooldown is just one extra state</text>
  <defs><marker id="st1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// III — AT MOST TWO transactions. Four state variables, one pass.
public int maxProfitIII(int[] prices) {
    int buy1 = Integer.MIN_VALUE, sell1 = 0;
    int buy2 = Integer.MIN_VALUE, sell2 = 0;

    for (int p : prices) {
        buy1  = Math.max(buy1,  -p);            // best balance after buying once
        sell1 = Math.max(sell1, buy1 + p);      // after selling once
        buy2  = Math.max(buy2,  sell1 - p);     // after buying a second time
        sell2 = Math.max(sell2, buy2 + p);      // after selling twice
    }
    return sell2;
}

// IV — AT MOST K transactions, generalised
public int maxProfitK(int k, int[] prices) {
    if (k &gt;= prices.length / 2) return maxProfitII(prices);   // effectively unlimited

    int[] buy = new int[k + 1], sell = new int[k + 1];
    Arrays.fill(buy, Integer.MIN_VALUE);

    for (int p : prices) {
        for (int t = 1; t &lt;= k; t++) {
            buy[t]  = Math.max(buy[t],  sell[t - 1] - p);
            sell[t] = Math.max(sell[t], buy[t] + p);
        }
    }
    return sell[k];
}

// WITH COOLDOWN — one day off after every sale
public int maxProfitCooldown(int[] prices) {
    int hold = Integer.MIN_VALUE, sold = 0, rest = 0;
    for (int p : prices) {
        int prevSold = sold;
        sold = hold + p;                        // sell today
        hold = Math.max(hold, rest - p);        // buy today (only from REST)
        rest = Math.max(rest, prevSold);        // cooling down
    }
    return Math.max(sold, rest);
}</code></pre>
<table>
<tr><th>Variant</th><th>Approach</th><th>Complexity</th></tr>
<tr><td>One transaction</td><td>Min price + running max</td><td>O(n) / O(1)</td></tr>
<tr><td>Unlimited</td><td>Sum every daily gain</td><td>O(n) / O(1)</td></tr>
<tr><td>At most two</td><td>Four state variables</td><td>O(n) / O(1)</td></tr>
<tr><td>At most k</td><td>2k state variables</td><td>O(n·k) / O(k)</td></tr>
<tr><td>With cooldown</td><td>Three-state machine</td><td>O(n) / O(1)</td></tr>
<tr><td>With a fee</td><td>Subtract the fee on sale</td><td>O(n) / O(1)</td></tr>
</table>
<p><strong>The framing that makes the whole family easy:</strong> model it as a <strong>state machine</strong>. At each day you are in one of a few states — holding, just sold, resting — and each state carries the best profit achievable in it. The transitions are the legal actions. Once you see it that way, cooldown and transaction fees are one extra state or one extra term rather than new problems.</p>
<p><strong>The <code>k &gt;= n/2</code> shortcut matters:</strong> with n prices there are at most n/2 profitable non-overlapping trades, so a larger k is equivalent to unlimited. Without that check, a k of one billion allocates a billion-entry array and the solution dies on memory rather than on logic.</p>`
}
]);
