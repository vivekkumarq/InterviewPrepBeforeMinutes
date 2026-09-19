registerCode("dp", {
intro: `<p>Dynamic programming applies when a problem has <strong>overlapping subproblems</strong> — the brute force computes the same thing repeatedly — and <strong>optimal substructure</strong>, meaning the best answer is built from best answers to smaller pieces.</p>
<p><strong>Three questions define every DP, in order:</strong></p>
<table>
<tr><td><strong>1. State</strong></td><td>What does <code>dp[...]</code> mean? One sentence, in English.</td></tr>
<tr><td><strong>2. Transition</strong></td><td>How does it build from smaller states?</td></tr>
<tr><td><strong>3. Base case</strong></td><td>What is trivially known?</td></tr>
</table>
<p>If you cannot say the state in one English sentence, the state is wrong. "<em>dp[i][j] is the length of the longest common subsequence of the first i and first j characters</em>" — that sentence <em>is</em> the solution; the code follows from it.</p>
<table>
<tr><th></th><th>Top-down (memoised)</th><th>Bottom-up (tabulated)</th></tr>
<tr><td>Shape</td><td>Recursion plus a cache</td><td>Loops filling a table</td></tr>
<tr><td>Computes</td><td>Only states you actually need</td><td>Every state</td></tr>
<tr><td>Risk</td><td>Stack depth</td><td>None</td></tr>
<tr><td>Space rolling</td><td>Hard</td><td>Easy — usually the point</td></tr>
</table>
<p><strong>Greedy or DP?</strong> If a locally best choice can make a later choice worse, greedy fails and you need DP. Coins [1,3,4] for 6 is the standard proof.</p>`,
questions: [
{
  slug: "climbing-stairs", n: 101, title: "Climbing Stairs", difficulty: "easy",
  statement: `<p>You can climb 1 or 2 steps at a time. How many distinct ways to reach step n?</p>`,
  approaches: [
    { name: "Naive recursion", time: "O(2ⁿ)", space: "O(n)",
      note: "Ways(n) = ways(n−1) + ways(n−2). Correct, and it recomputes the same subproblems exponentially often.",
      java: `public static int climb(int n) {
    if (n <= 2) return n;
    return climb(n - 1) + climb(n - 2);
}`,
      python: `def climb(n: int) -> int:
    if n <= 2:
        return n
    return climb(n - 1) + climb(n - 2)` },
    { name: "Memoised", time: "O(n)", space: "O(n)",
      note: "Same recursion, each value computed once. This is the smallest example of turning brute force into DP.",
      java: `public static int climb(int n, int[] memo) {
    if (n <= 2) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = climb(n - 1, memo) + climb(n - 2, memo);
}`,
      python: `from functools import lru_cache

@lru_cache(maxsize=None)
def climb(n: int) -> int:
    return n if n <= 2 else climb(n - 1) + climb(n - 2)` },
    { name: "Two variables", time: "O(n)", space: "O(1)", best: true,
      note: "Only the previous two values are ever read, so the whole table collapses to two variables. This is Fibonacci wearing a different hat.",
      java: `public static int climb(int n) {
    if (n <= 2) return n;
    int prev = 1, cur = 2;
    for (int i = 3; i <= n; i++) {
        int next = prev + cur;
        prev = cur;
        cur = next;
    }
    return cur;
}`,
      python: `def climb(n: int) -> int:
    if n <= 2:
        return n
    prev, cur = 1, 2
    for _ in range(3, n + 1):
        prev, cur = cur, prev + cur
    return cur` }
  ],
  note: `<p>If the allowed step sizes become arbitrary, the recurrence becomes a sum over every step size — which is exactly the coin-change counting problem.</p>`
},
{
  slug: "house-robber", n: 102, title: "House Robber", difficulty: "medium",
  statement: `<p>Each house holds some money, but robbing two adjacent houses triggers the alarm. Maximise the take.</p>`,
  approaches: [
    { name: "Table", time: "O(n)", space: "O(n)",
      note: "dp[i] is the best take from the first i houses: either skip house i, or rob it and add the best from i−2.",
      java: `public static int rob(int[] a) {
    if (a.length == 0) return 0;
    int[] dp = new int[a.length + 1];
    dp[1] = a[0];
    for (int i = 2; i <= a.length; i++)
        dp[i] = Math.max(dp[i - 1], dp[i - 2] + a[i - 1]);
    return dp[a.length];
}`,
      python: `def rob(a: list[int]) -> int:
    if not a:
        return 0
    dp = [0] * (len(a) + 1)
    dp[1] = a[0]
    for i in range(2, len(a) + 1):
        dp[i] = max(dp[i - 1], dp[i - 2] + a[i - 1])
    return dp[len(a)]` },
    { name: "Two variables", time: "O(n)", space: "O(1)", best: true,
      note: "The table only ever looks back two cells, so roll it. Same recurrence, constant memory.",
      java: `public static int rob(int[] a) {
    int skip = 0, take = 0;        // best excluding / including the previous
    for (int money : a) {
        int next = Math.max(skip + money, take);
        skip = take;
        take = next;
    }
    return take;
}`,
      python: `def rob(a: list[int]) -> int:
    skip = take = 0
    for money in a:
        skip, take = take, max(skip + money, take)
    return take` }
  ],
  note: `<p><strong>House Robber II</strong> arranges the houses in a circle, so the first and last are adjacent. Run the linear version twice — once excluding the first house, once excluding the last — and take the better. That reduction is the whole trick.</p>`
},
{
  slug: "coin-change", n: 103, title: "Coin Change (Fewest Coins)", difficulty: "medium",
  statement: `<p>Given coin denominations and an amount, return the fewest coins that make it, or −1 if impossible.</p>`,
  approaches: [
    { name: "Greedy, largest coin first", time: "O(n)", space: "O(1)",
      note: "WRONG for arbitrary denominations. Coins [1,3,4] for 6: greedy takes 4+1+1 = three coins, optimal is 3+3 = two. It happens to work for real currency because those systems are canonical.",
      java: `// Taking the largest coin that fits is not optimal in general.
// [1,3,4] making 6 -> greedy 4+1+1, optimal 3+3.`,
      python: `# Taking the largest coin that fits is not optimal in general.
# [1,3,4] making 6 -> greedy 4+1+1, optimal 3+3.` },
    { name: "Bottom-up DP", time: "O(amount·coins)", space: "O(amount)", best: true,
      note: "dp[a] is the fewest coins making amount a. The sentinel must be reachable-but-impossible: amount+1 works and cannot overflow, unlike Integer.MAX_VALUE where dp[x]+1 wraps negative.",
      java: `public static int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);         // NOT MAX_VALUE: dp[x]+1 would overflow
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`,
      python: `def coin_change(coins: list[int], amount: int) -> int:
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return -1 if dp[amount] > amount else dp[amount]` }
  ],
  note: `<p><strong>Counting the ways</strong> instead of minimising is the same table with a different loop nesting — and the nesting decides the question. Coins outer counts <em>combinations</em>; amount outer counts <em>permutations</em>. For coins [1,2] and amount 3 that is 2 versus 3. If you remember one thing about counting DP, make it this.</p>`
},
{
  slug: "knapsack-01", n: 104, title: "0/1 Knapsack", difficulty: "medium",
  statement: `<p>Each item has a weight and a value and may be taken at most once. Maximise value within capacity W.</p>`,
  approaches: [
    { name: "2D table", time: "O(n·W)", space: "O(n·W)",
      note: "dp[i][w] is the best value using the first i items within capacity w. Either skip item i, or take it and add its value to the best from the remaining capacity.",
      java: `public static int knapsack(int[] weight, int[] value, int W) {
    int n = weight.length;
    int[][] dp = new int[n + 1][W + 1];
    for (int i = 1; i <= n; i++)
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i - 1][w];                          // skip
            if (weight[i - 1] <= w)
                dp[i][w] = Math.max(dp[i][w],
                          dp[i - 1][w - weight[i - 1]] + value[i - 1]);
        }
    return dp[n][W];
}`,
      python: `def knapsack(weight: list[int], value: list[int], W: int) -> int:
    n = len(weight)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]
            if weight[i - 1] <= w:
                dp[i][w] = max(dp[i][w],
                               dp[i - 1][w - weight[i - 1]] + value[i - 1])
    return dp[n][W]` },
    { name: "1D table, looping backwards", time: "O(n·W)", space: "O(W)", best: true,
      note: "The loop DIRECTION encodes the rule. Backwards means dp[w - weight] still holds the PREVIOUS item's row, so each item is used at most once. Forwards would allow reuse — that is unbounded knapsack.",
      java: `public static int knapsack(int[] weight, int[] value, int W) {
    int[] dp = new int[W + 1];
    for (int i = 0; i < weight.length; i++)
        for (int w = W; w >= weight[i]; w--)          // BACKWARD = 0/1
            dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);
    return dp[W];
}`,
      python: `def knapsack(weight: list[int], value: list[int], W: int) -> int:
    dp = [0] * (W + 1)
    for wt, val in zip(weight, value):
        for w in range(W, wt - 1, -1):               # BACKWARD = 0/1
            dp[w] = max(dp[w], dp[w - wt] + val)
    return dp[W]` }
  ],
  note: `<p>This is <strong>pseudo-polynomial</strong>: W is a value, not an input size, so a capacity of 10⁹ is infeasible even with ten items. Saying that is the difference between reciting knapsack and understanding it.</p>
<p>Subset sum, partition into equal halves and target sum are all this table with values replaced by booleans or counts.</p>`
},
{
  slug: "longest-increasing-subsequence", n: 105, title: "Longest Increasing Subsequence", difficulty: "medium",
  statement: `<p>Find the length of the longest strictly increasing subsequence. Elements need not be adjacent.</p>`,
  approaches: [
    { name: "DP on each ending position", time: "O(n²)", space: "O(n)",
      note: "dp[i] is the longest run ending exactly at i. For each i, look back at every smaller earlier value.",
      java: `public static int lengthOfLIS(int[] a) {
    int[] dp = new int[a.length];
    Arrays.fill(dp, 1);
    int best = a.length == 0 ? 0 : 1;
    for (int i = 1; i < a.length; i++) {
        for (int j = 0; j < i; j++)
            if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        best = Math.max(best, dp[i]);
    }
    return best;
}`,
      python: `def length_of_lis(a: list[int]) -> int:
    if not a:
        return 0
    dp = [1] * len(a)
    for i in range(1, len(a)):
        for j in range(i):
            if a[j] < a[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)` },
    { name: "Patience sorting with binary search", time: "O(n log n)", space: "O(n)", best: true,
      note: "tails[k] holds the smallest possible tail of an increasing run of length k+1. Binary search for where each value belongs: extend the list, or improve an existing tail.",
      java: `public static int lengthOfLIS(int[] a) {
    List<Integer> tails = new ArrayList<>();
    for (int x : a) {
        int pos = Collections.binarySearch(tails, x);
        if (pos < 0) pos = -(pos + 1);            // the insertion point
        if (pos == tails.size()) tails.add(x);    // extends the longest run
        else tails.set(pos, x);                   // a better tail at that length
    }
    return tails.size();
}`,
      python: `import bisect

def length_of_lis(a: list[int]) -> int:
    tails: list[int] = []
    for x in a:
        pos = bisect.bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
        else:
            tails[pos] = x
    return len(tails)` }
  ],
  note: `<p><strong>tails is not the answer</strong> — only its <em>length</em> is correct. The array itself is usually not a real subsequence of the input. To recover the actual sequence you must record predecessor indices as you go. Claiming otherwise is easy to catch and a common slip.</p>
<p>For <em>non-decreasing</em>, switch to an upper-bound search (<code>bisect_right</code>).</p>`
},
{
  slug: "longest-common-subsequence", n: 106, title: "Longest Common Subsequence", difficulty: "medium",
  statement: `<p>Find the length of the longest subsequence present in both strings.</p>`,
  approaches: [
    { name: "2D table", time: "O(n·m)", space: "O(n·m)", best: true,
      note: "The template for every two-sequence DP. Characters match, so extend the diagonal; otherwise take the better of dropping one character from either side.",
      java: `public static int lcs(String a, String b) {
    int[][] dp = new int[a.length() + 1][b.length() + 1];   // the +1 row/column
    for (int i = 1; i <= a.length(); i++)                   // removes every
        for (int j = 1; j <= b.length(); j++)               // boundary case
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                     ? dp[i - 1][j - 1] + 1
                     : Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[a.length()][b.length()];
}`,
      python: `def lcs(a: str, b: str) -> int:
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[len(a)][len(b)]` },
    { name: "Two rows", time: "O(n·m)", space: "O(m)",
      note: "Each cell reads only the row above and the cell to its left, so two rows suffice. The cost: you can no longer reconstruct the actual subsequence, only its length.",
      java: `public static int lcs(String a, String b) {
    int[] prev = new int[b.length() + 1], cur = new int[b.length() + 1];
    for (int i = 1; i <= a.length(); i++) {
        for (int j = 1; j <= b.length(); j++)
            cur[j] = a.charAt(i - 1) == b.charAt(j - 1)
                   ? prev[j - 1] + 1
                   : Math.max(prev[j], cur[j - 1]);
        int[] t = prev; prev = cur; cur = t;      // swap, do not reallocate
    }
    return prev[b.length()];
}`,
      python: `def lcs(a: str, b: str) -> int:
    prev = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        cur = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1] + 1
            else:
                cur[j] = max(prev[j], cur[j - 1])
        prev = cur
    return prev[len(b)]` }
  ],
  note: `<p>Several problems are this one relabelled: <strong>shortest common supersequence</strong> is <code>n + m − LCS</code>, <strong>minimum deletions to make two strings equal</strong> is <code>n + m − 2·LCS</code>, and <strong>longest palindromic subsequence</strong> is the LCS of a string with its own reverse.</p>`
},
{
  slug: "edit-distance", n: 107, title: "Edit Distance", difficulty: "hard",
  statement: `<p>Find the fewest insert, delete or replace operations to turn one string into another.</p>`,
  approaches: [
    { name: "2D table", time: "O(n·m)", space: "O(n·m)", best: true,
      note: "Same grid as LCS with three operations instead of two. The base cases carry the meaning: converting to an empty string costs one delete per character.",
      java: `public static int editDistance(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 0; i <= n; i++) dp[i][0] = i;     // delete everything
    for (int j = 0; j <= m; j++) dp[0][j] = j;     // insert everything

    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                     ? dp[i - 1][j - 1]                          // free
                     : 1 + Math.min(dp[i - 1][j - 1],            // replace
                           Math.min(dp[i - 1][j],                // delete
                                    dp[i][j - 1]));              // insert
    return dp[n][m];
}`,
      python: `def edit_distance(a: str, b: str) -> int:
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j - 1],   # replace
                                   dp[i - 1][j],       # delete
                                   dp[i][j - 1])       # insert
    return dp[n][m]` }
  ],
  note: `<p>Know which neighbour is which operation: diagonal is replace, up is delete from the first string, left is insert into it. Mixing them up still produces a number, just not the right one.</p>
<p>This is Levenshtein distance — the algorithm behind spell checkers, fuzzy search and DNA alignment.</p>`
},
{
  slug: "unique-paths", n: 108, title: "Unique Paths in a Grid", difficulty: "medium",
  statement: `<p>Count the paths from the top-left to the bottom-right of an m×n grid, moving only right or down.</p>`,
  approaches: [
    { name: "2D table", time: "O(m·n)", space: "O(m·n)",
      note: "Each cell is the sum of the cell above and the cell to its left. The first row and column are all 1 — only one way to walk a straight line.",
      java: `public static int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    for (int[] row : dp) Arrays.fill(row, 1);
    for (int r = 1; r < m; r++)
        for (int c = 1; c < n; c++)
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
    return dp[m - 1][n - 1];
}`,
      python: `def unique_paths(m: int, n: int) -> int:
    dp = [[1] * n for _ in range(m)]
    for r in range(1, m):
        for c in range(1, n):
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
    return dp[m - 1][n - 1]` },
    { name: "One row", time: "O(m·n)", space: "O(n)", best: true,
      note: "Updating in place means row[c] still holds the value from the row above until you overwrite it — exactly the addition you need.",
      java: `public static int uniquePaths(int m, int n) {
    int[] row = new int[n];
    Arrays.fill(row, 1);
    for (int r = 1; r < m; r++)
        for (int c = 1; c < n; c++)
            row[c] += row[c - 1];       // row[c] is still the cell above
    return row[n - 1];
}`,
      python: `def unique_paths(m: int, n: int) -> int:
    row = [1] * n
    for _ in range(1, m):
        for c in range(1, n):
            row[c] += row[c - 1]
    return row[n - 1]` },
    { name: "Combinatorics", time: "O(min(m,n))", space: "O(1)",
      note: "Every path makes exactly m−1 downs and n−1 rights in some order, so the answer is the binomial coefficient C(m+n−2, m−1). No DP at all.",
      java: `public static int uniquePaths(int m, int n) {
    long result = 1;
    for (int i = 1; i <= m - 1; i++)
        result = result * (n - 1 + i) / i;     // exact at every step
    return (int) result;
}`,
      python: `import math

def unique_paths(m: int, n: int) -> int:
    return math.comb(m + n - 2, m - 1)` }
  ],
  note: `<p>With obstacles the closed form dies and you must use the table — set blocked cells to 0 and everything else follows. That is the usual follow-up.</p>`
},
{
  slug: "word-break", n: 109, title: "Word Break", difficulty: "medium",
  statement: `<p>Decide whether a string can be split into a sequence of dictionary words.</p>`,
  approaches: [
    { name: "Backtracking", time: "O(2ⁿ)", space: "O(n)",
      note: "Try every split point and recurse. Exponential, because the same suffix is re-examined along many different prefixes.",
      java: `public static boolean wordBreak(String s, Set<String> dict) {
    if (s.isEmpty()) return true;
    for (int i = 1; i <= s.length(); i++)
        if (dict.contains(s.substring(0, i))
            && wordBreak(s.substring(i), dict)) return true;
    return false;
}`,
      python: `def word_break(s: str, dictionary: set[str]) -> bool:
    if not s:
        return True
    return any(s[:i] in dictionary and word_break(s[i:], dictionary)
               for i in range(1, len(s) + 1))` },
    { name: "DP over prefixes", time: "O(n²·k)", space: "O(n)", best: true,
      note: "dp[i] means the first i characters are breakable. For each end, look for a split where the prefix is breakable and the remainder is a word.",
      java: `public static boolean wordBreak(String s, Set<String> dict) {
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;                                 // empty string is breakable
    for (int end = 1; end <= s.length(); end++)
        for (int start = 0; start < end; start++)
            if (dp[start] && dict.contains(s.substring(start, end))) {
                dp[end] = true;
                break;
            }
    return dp[s.length()];
}`,
      python: `def word_break(s: str, dictionary: set[str]) -> bool:
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for end in range(1, len(s) + 1):
        for start in range(end):
            if dp[start] and s[start:end] in dictionary:
                dp[end] = True
                break
    return dp[len(s)]` }
  ],
  note: `<p>The k in the complexity is the substring cost — <code>substring</code> copies, so it is not free. A trie over the dictionary removes it, and is the right answer when the dictionary is large.</p>
<p><strong>Word Break II</strong>, returning every valid sentence, is backtracking with memoisation on the suffix — the count can be exponential, so no DP table can shortcut it.</p>`
},
{
  slug: "partition-equal-subset", n: 110, title: "Split Into Two Equal Halves", difficulty: "medium",
  statement: `<p>Decide whether an array can be split into two subsets with equal sums.</p>`,
  approaches: [
    { name: "Subset sum DP", time: "O(n·sum)", space: "O(sum)", best: true,
      note: "If the total is odd, stop immediately. Otherwise the question is just: can any subset reach total/2? That is 0/1 knapsack with booleans — hence the backward loop.",
      java: `public static boolean canPartition(int[] a) {
    int total = 0;
    for (int x : a) total += x;
    if (total % 2 != 0) return false;             // odd cannot split evenly

    int target = total / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;                                  // sum 0 always reachable
    for (int x : a)
        for (int s = target; s >= x; s--)          // BACKWARD: use x once
            dp[s] |= dp[s - x];
    return dp[target];
}`,
      python: `def can_partition(a: list[int]) -> bool:
    total = sum(a)
    if total % 2:
        return False

    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for x in a:
        for s in range(target, x - 1, -1):        # BACKWARD: use x once
            dp[s] = dp[s] or dp[s - x]
    return dp[target]` }
  ],
  note: `<p>The odd-total check is not an optimisation, it is a correctness shortcut — and forgetting it just makes the DP return false anyway, so it is free either way. Mention it because it shows you reasoned about the problem before reaching for a table.</p>
<p>Same table answers <strong>last stone weight II</strong> (minimise the difference between two subsets) and <strong>target sum</strong> (assign + and − signs).</p>`
},
{
  slug: "decode-ways", n: 111, title: "Decode Ways", difficulty: "medium",
  statement: `<p>A=1 … Z=26. Count how many ways a digit string decodes into letters. <code>"226"</code> gives 3: BZ, VF, BBF.</p>`,
  approaches: [
    { name: "DP with two look-backs", time: "O(n)", space: "O(n)",
      note: "At each position, take one digit if it is not '0', and take two digits if they form 10–26. Add both possibilities.",
      java: `public static int numDecodings(String s) {
    int n = s.length();
    if (n == 0 || s.charAt(0) == '0') return 0;
    int[] dp = new int[n + 1];
    dp[0] = 1;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        int one = s.charAt(i - 1) - '0';
        int two = Integer.parseInt(s.substring(i - 2, i));
        if (one >= 1)               dp[i] += dp[i - 1];
        if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
        if (dp[i] == 0) return 0;               // a dead prefix, e.g. "30"
    }
    return dp[n];
}`,
      python: `def num_decodings(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    dp = [0] * (len(s) + 1)
    dp[0] = dp[1] = 1
    for i in range(2, len(s) + 1):
        if s[i - 1] != "0":
            dp[i] += dp[i - 1]
        if 10 <= int(s[i - 2:i]) <= 26:
            dp[i] += dp[i - 2]
        if dp[i] == 0:
            return 0
    return dp[len(s)]` },
    { name: "Two variables", time: "O(n)", space: "O(1)", best: true,
      note: "Only the previous two counts matter. Same recurrence, rolled.",
      java: `public static int numDecodings(String s) {
    if (s.isEmpty() || s.charAt(0) == '0') return 0;
    int twoBack = 1, oneBack = 1;
    for (int i = 1; i < s.length(); i++) {
        int cur = 0;
        if (s.charAt(i) != '0') cur += oneBack;
        int pair = (s.charAt(i - 1) - '0') * 10 + (s.charAt(i) - '0');
        if (pair >= 10 && pair <= 26) cur += twoBack;
        if (cur == 0) return 0;
        twoBack = oneBack;
        oneBack = cur;
    }
    return oneBack;
}`,
      python: `def num_decodings(s: str) -> int:
    if not s or s[0] == "0":
        return 0
    two_back = one_back = 1
    for i in range(1, len(s)):
        cur = 0
        if s[i] != "0":
            cur += one_back
        if 10 <= int(s[i - 1:i + 1]) <= 26:
            cur += two_back
        if cur == 0:
            return 0
        two_back, one_back = one_back, cur
    return one_back` }
  ],
  note: `<p>Zeros are the whole difficulty. <code>"0"</code> decodes zero ways, <code>"06"</code> zero ways (no leading zero in a pair), and <code>"10"</code> exactly one. Walk those three through your code before claiming it works.</p>`
}
]});
