appendTopic("coding-dp", [
{
  q: "Memoisation vs tabulation — how do you convert between them?",
  level: "beginner", hot: true, tags: ["dp", "memoisation", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Walmart"],
  a: `<table>
<tr><th></th><th>Memoisation (top-down)</th><th>Tabulation (bottom-up)</th></tr>
<tr><td>Shape</td><td>Recursion + a cache</td><td>Loops filling a table</td></tr>
<tr><td>Computes</td><td><strong>Only the states you need</strong></td><td>Every state</td></tr>
<tr><td>Order</td><td>Works itself out</td><td><strong>You must get it right</strong></td></tr>
<tr><td>Stack</td><td>Can overflow on deep recursion</td><td>No recursion</td></tr>
<tr><td>Space optimisation</td><td>Hard</td><td><strong>Easy</strong> — roll to one or two rows</td></tr>
<tr><td>Write it first when</td><td>Deriving the recurrence</td><td>You already know it</td></tr>
</table>
<pre><code>// STEP 1 — plain recursion. Correct, exponential.
int rob(int[] a, int i) {
    if (i &lt; 0) return 0;
    return Math.max(rob(a, i - 1), rob(a, i - 2) + a[i]);
}

// STEP 2 — add a cache. That single change makes it O(n).
Integer[] memo;
int rob(int[] a, int i) {
    if (i &lt; 0) return 0;
    if (memo[i] != null) return memo[i];
    return memo[i] = Math.max(rob(a, i - 1), rob(a, i - 2) + a[i]);
}

// STEP 3 — turn it inside out. The recursion went from i downward, so the
// loop goes upward; the base case becomes the initial value.
int rob(int[] a) {
    int[] dp = new int[a.length + 2];                  // +2 avoids negative
    for (int i = 0; i &lt; a.length; i++) {                // index guards
        dp[i + 2] = Math.max(dp[i + 1], dp[i] + a[i]);
    }
    return dp[a.length + 1];
}

// STEP 4 — only the last two entries are ever read, so keep two variables.
int rob(int[] a) {
    int skip = 0, take = 0;
    for (int x : a) { int next = Math.max(take, skip + x); skip = take; take = next; }
    return take;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Four stages from recursion to constant space">
  <rect class="dg-box" x="12" y="46" width="132" height="44" rx="8"/><text class="dg-s" x="78" y="64" text-anchor="middle">recursion</text><text class="dg-s" x="78" y="81" text-anchor="middle">O(2ⁿ)</text>
  <path class="dg-line" d="M148 68 H172" marker-end="url(#dp2)"/>
  <rect class="dg-fill" x="176" y="46" width="132" height="44" rx="8"/><text class="dg-s" x="242" y="64" text-anchor="middle">+ memo</text><text class="dg-s" x="242" y="81" text-anchor="middle">O(n) time, O(n) space</text>
  <path class="dg-line" d="M312 68 H336" marker-end="url(#dp2)"/>
  <rect class="dg-fill" x="340" y="46" width="132" height="44" rx="8"/><text class="dg-s" x="406" y="64" text-anchor="middle">tabulate</text><text class="dg-s" x="406" y="81" text-anchor="middle">no recursion</text>
  <path class="dg-line" d="M476 68 H500" marker-end="url(#dp2)"/>
  <rect class="dg-fill2" x="504" y="46" width="104" height="44" rx="8"/><text class="dg-s" x="556" y="64" text-anchor="middle">roll</text><text class="dg-s" x="556" y="81" text-anchor="middle">O(1) space</text>
  <text class="dg-s" x="12" y="126">walk these four steps out loud — it is the clearest way to present any DP answer</text>
  <defs><marker id="dp2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// Memoising on a non-integer state: use a HashMap, and include EVERY
// parameter that varies in the key.
Map&lt;String, Integer&gt; memo = new HashMap&lt;&gt;();
String key = i + "," + j + "," + remaining;     // miss one and you return a
                                                 // cached answer for a different
                                                 // subproblem — silently wrong</code></pre>
<p><strong>Why present it this way:</strong> starting from brute-force recursion means you always have a correct answer to fall back on, and the recurrence is easier to derive top-down than to guess bottom-up. Most interviewers are happy to stop at step 2 — but knowing steps 3 and 4 exist, and saying so, is what makes it look deliberate rather than lucky.</p>`
},
{
  q: "Partition, subset sum and the DP problems that hide behind them",
  level: "advanced", tags: ["dp", "knapsack", "subset-sum"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Oracle"],
  a: `<pre><code>// SUBSET SUM — can any subset reach exactly the target?
public boolean canPartition(int[] nums) {
    int total = Arrays.stream(nums).sum();
    if (total % 2 != 0) return false;            // odd total -> impossible, instantly
    int target = total / 2;

    boolean[] dp = new boolean[target + 1];
    dp[0] = true;                                 // the empty subset makes 0

    for (int num : nums) {
        for (int s = target; s &gt;= num; s--) {     // DOWNWARD: each item ONCE
            dp[s] |= dp[s - num];
        }
    }
    return dp[target];
}
// Iterating upward would let one number be reused, turning this into the
// UNBOUNDED version — which answers a different question entirely.</code></pre>
<table>
<tr><th>Problem</th><th>Reduces to</th></tr>
<tr><td>Partition into two equal subsets</td><td>Subset sum for <code>total / 2</code></td></tr>
<tr><td><strong>Target sum</strong> (assign + or −)</td><td>Subset sum for <code>(total + target) / 2</code></td></tr>
<tr><td>Last stone weight II</td><td>Split as evenly as possible — subset sum again</td></tr>
<tr><td>Partition to K equal subsets</td><td>Backtracking; subset sum is not enough</td></tr>
<tr><td>Count of subsets with a given sum</td><td>Same loop, counting instead of OR-ing</td></tr>
<tr><td>Minimum subset sum difference</td><td>Find the largest reachable <code>s &lt;= total/2</code></td></tr>
</table>
<pre><code>// TARGET SUM — the reduction worth knowing, because it looks like a different
// problem. Split the numbers into a positive set P and a negative set N:
//   sum(P) - sum(N) = target
//   sum(P) + sum(N) = total
//   => sum(P) = (total + target) / 2
// So: COUNT the subsets summing to (total + target) / 2.
public int findTargetSumWays(int[] nums, int target) {
    int total = Arrays.stream(nums).sum();
    if ((total + target) % 2 != 0 || Math.abs(target) &gt; total) return 0;
    int s = (total + target) / 2;

    int[] dp = new int[s + 1];
    dp[0] = 1;
    for (int num : nums)
        for (int j = s; j &gt;= num; j--) dp[j] += dp[j - num];
    return dp[s];
}</code></pre>
<div class="cx"><b>O(n · target)</b><span>pseudo-polynomial — target is a value, not an input size</span></div>
<p><strong>The complexity caveat to state:</strong> subset sum is NP-complete. The DP is efficient only because <code>target</code> is small; with values up to 10⁹ the table is unbuildable. Saying that unprompted shows you understand <em>why</em> the DP works rather than just that it does.</p>
<p><strong>The parity shortcut is worth saying first:</strong> if the total is odd, no equal partition can exist — return immediately. Interviewers notice when you check the cheap impossible case before building a table.</p>`
}
]);
