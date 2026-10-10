registerSimple("coding-dp", {
"Memoisation vs tabulation — how do you convert between them?":
`<b>Memoisation</b> is recursion plus a cache: start from the big question and save each answer as it is computed. <b>Tabulation</b> uses loops to fill a table from the smallest cases upwards. To convert, keep the same state and recurrence, and fill the table in an order where every value needed is already computed. Tabulation avoids deep recursion and often allows saving memory.`,

"Partition, subset sum and the DP problems that hide behind them":
`<b>Subset sum</b> asks whether some of the numbers add up to a target. Use a true/false table where <code>dp[s]</code> means "sum s is reachable", and update it for each number. Many problems turn into this: splitting into two equal halves is subset sum with target total / 2, and "assign + or - to reach a target" turns into it with a little algebra.`,

"How do you recognise a DP problem, and what are the standard state shapes?":
`Look for "count the ways", "minimum or maximum", or "is it possible", where each step makes a choice and the same smaller situations come up repeatedly. Common state shapes: a single index (stairs, house robber), two indexes into two strings (edit distance), a range from i to j (palindromes), or an index plus remaining capacity (knapsack).`,

"Longest palindromic substring and the interval DP family":
`The simplest approach is to expand around each centre: for every position (and every gap between positions), grow outwards while the characters on both sides match, and remember the longest. That is O(n²) time with no extra memory. The DP version marks <code>dp[i][j]</code> true when the ends match and the inside is also a palindrome.`,

"Bitmask DP and when exponential is the intended answer":
`When n is small (about 20 or fewer), you can represent "which items are used" as the bits of a number, so all 2ⁿ combinations fit in an array. A typical state is (set of visited cities, current city), as in the travelling salesman problem. Small limits in the question are a hint that this exponential approach is what is expected.`,

"Knapsack and its family — subset sum, partition, coin change and target sum":
`In <b>0/1 knapsack</b>, each item can be used at most once: for each item, choose to take it (if it fits) or leave it, maximising value within the capacity. In <b>unbounded knapsack</b>, items can be reused, as in coin change. Many problems are knapsack in disguise: subset sum, equal partition, target sum and coin change.`,

"Sequence DP: LIS, LCS, edit distance and the state that connects them":
`These compare positions within sequences. <b>LIS</b> (longest increasing subsequence): <code>dp[i]</code> is the longest increasing run ending at i. <b>LCS</b> (longest common subsequence) and <b>edit distance</b> use <code>dp[i][j]</code> for the first i characters of one string and the first j of the other: if the characters match, build on <code>dp[i-1][j-1]</code>, otherwise take the best of the neighbouring cells.`,

"Decode ways: how many ways can a digit string be read as letters?":
`With A=1 to Z=26, the number of ways to decode up to position i equals the ways using the last single digit (if it is not 0) plus the ways using the last two digits (if they form 10 to 26). It is like climbing stairs with one or two steps, with conditions. Only the previous two values are needed, so two variables are enough.`,

"Wildcard matching with ? and * using a 2D DP table":
`<code>dp[i][j]</code> means "the first i characters of the text match the first j characters of the pattern". <code>?</code> matches any one character, so it builds on <code>dp[i-1][j-1]</code>. <code>*</code> matches nothing (<code>dp[i][j-1]</code>) or one more character (<code>dp[i-1][j]</code>). A normal letter must equal the text character. The answer is the bottom-right cell.`,

"Climbing stairs, house robber and the 1D DP family":
`Each answer depends on the previous one or two. <b>Climbing stairs</b>: ways to reach step i = ways(i-1) + ways(i-2), like Fibonacci. <b>House robber</b>: best(i) = the larger of best(i-1) (skip this house) and value(i) + best(i-2) (rob it). Since only two previous values are needed, two variables replace the whole array.`,

"0/1 Knapsack — and why the loop direction changes for the unbounded version":
`Use a one-dimensional array <code>dp[w]</code> = best value with capacity w. For 0/1 knapsack (each item once), loop capacity from high to low, so an item is not counted twice in the same round. For unbounded knapsack (items reusable), loop from low to high, which deliberately allows the same item to be added again.`,

"Longest common subsequence and edit distance":
`Both fill a table <code>dp[i][j]</code> for prefixes of the two strings. <b>LCS</b>: if the characters match, take 1 + the diagonal cell; otherwise take the larger of the cell above and the cell to the left. <b>Edit distance</b>: if they match, copy the diagonal; otherwise 1 + the smallest of insert, delete or replace. Both are O(m × n).`,

"Longest increasing subsequence — the O(n log n) solution":
`Keep a list called "tails", where position k holds the smallest possible ending value of an increasing subsequence of length k + 1. For each number, use binary search to find the first tail that is greater than or equal to it and replace it, or append the number if it is bigger than all of them. The list's length is the answer.`,

"Matrix DP — unique paths, minimum path sum and maximal square":
`Each cell's answer comes from its neighbours above and to the left. <b>Unique paths</b>: ways(r, c) = ways from above + ways from the left. <b>Minimum path sum</b>: the cell's cost + the cheaper of above and left. <b>Maximal square</b>: if the cell is 1, its square size = 1 + the smallest of above, left and diagonal.`,

"Word break and partition-style DP":
`<code>dp[i]</code> is true if the first i characters can be split into dictionary words. For each i, look for an earlier position j where <code>dp[j]</code> is true and the text from j to i is a word in the dictionary. Put the dictionary in a <code>HashSet</code> for fast lookups. The answer is <code>dp[n]</code>.`,

"Stock trading DP — one, two and k transactions with cooldown":
`For <b>one</b> trade, track the lowest price so far and the best profit from selling today. For <b>unlimited</b> trades, add up every price rise between consecutive days. For <b>k trades</b> or a <b>cooldown</b>, track a few states each day (holding a share, not holding, cooling down) and update each from the previous day's states.`
});
