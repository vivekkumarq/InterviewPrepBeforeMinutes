registerPrimer("coding-greedy", `<h3>The mental model: make the best move now and never look back</h3>
<p>A greedy algorithm builds the answer one step at a time, always taking the choice that looks best <strong>right now</strong>, and never undoing it. When it works it is usually the simplest and fastest solution: often just a sort and one pass. The catch is that it only works for problems where a locally best choice can never block a better overall answer, so the real skill is knowing when greedy is safe.</p>
<figure class="fig">
<svg viewBox="0 0 620 214" role="img" aria-label="Activity selection on a timeline: choosing the meeting that ends earliest leaves the most room for the rest">
  <line class="dg-line" x1="20" y1="190" x2="600" y2="190"/>
  <text class="dg-s" x="20" y="206">9:00</text><text class="dg-s" x="300" y="206">13:00</text><text class="dg-s" x="566" y="206">17:00</text>
  <rect class="dg-box" x="20" y="24" width="420" height="24" rx="5"/><text class="dg-s" x="30" y="41">A 9:00-15:00  (long: blocks everything)</text>
  <rect class="dg-fill" x="60" y="58" width="120" height="24" rx="5"/><text class="dg-m" x="70" y="75">B 9:30-11:00</text>
  <rect class="dg-box" x="150" y="92" width="170" height="24" rx="5"/><text class="dg-s" x="160" y="109">C 10:30-13:00</text>
  <rect class="dg-fill" x="200" y="126" width="140" height="24" rx="5"/><text class="dg-m" x="210" y="143">D 11:15-13:30</text>
  <rect class="dg-fill" x="360" y="58" width="150" height="24" rx="5"/><text class="dg-m" x="370" y="75">E 14:00-16:00</text>
  <rect class="dg-box" x="330" y="126" width="130" height="24" rx="5"/><text class="dg-s" x="340" y="143">F 13:15-15:00</text>
  <text class="dg-s" x="370" y="104">sort by END time; take each</text>
  <text class="dg-s" x="370" y="118">meeting that starts after the last one taken</text>
  <text class="dg-s" x="20" y="172">Picked: B, D, E = 3 meetings. Picking by earliest START would take A first and fit only 1.</text>
</svg>
<figcaption>"Earliest end first" is safe: finishing sooner can never leave you with less room than any other choice.</figcaption>
</figure>
<h3>Worked example: when greedy works, and when it fails</h3>
<pre><code>// WORKS: maximum number of non-overlapping meetings
static int maxMeetings(int[][] m) {                 // m[i] = {start, end}
    Arrays.sort(m, Comparator.comparingInt(x -&gt; x[1]));   // earliest END first
    int count = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] x : m) {
        if (x[0] &gt;= lastEnd) {                      // fits after the last one
            count++;
            lastEnd = x[1];
        }
    }
    return count;
}
// O(n log n). Why is it safe? Swap argument: take ANY best schedule. Its first
// meeting ends no earlier than ours, so replacing it with ours keeps the
// schedule valid and the same size. Repeat for every step.

// FAILS: fewest coins for an amount, with coins {1, 3, 4}, amount 6
// Greedy (largest coin first):  4 + 1 + 1   = 3 coins
// Best:                          3 + 3       = 2 coins
// Taking the 4 looked best but blocked the better answer. This needs DP.
// (Greedy IS correct for the Indian rupee and US coin systems, because they
// were designed that way. It is not correct for every coin system.)</code></pre>
<h3>How to decide whether greedy is safe</h3>
<table>
<tr><th>Test</th><th>What to do</th></tr>
<tr><td>Try to break it</td><td>Spend one minute looking for a small counterexample, like the coin case above. If you find one, switch to DP</td></tr>
<tr><td>Exchange argument</td><td>Show that swapping any optimal solution's first choice for the greedy choice never makes it worse</td></tr>
<tr><td>Sort key</td><td>Most greedy solutions are "sort by the right key, then one pass". Choosing the key (end time, ratio, deadline) is the real decision</td></tr>
<tr><td>Say it out loud</td><td>"I'll go greedy on earliest end time, because finishing earlier never removes options." Interviewers want the reason, not only the code</td></tr>
</table>`);

appendTopic("coding-greedy", [
{
  q: "Boats to save people: two-pointer greedy, and why pairing heaviest with lightest works",
  level: "advanced", hot: true, tags: ["greedy", "two-pointers", "sorting", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Flipkart", "Walmart", "Adobe"],
  a: `<div class="cx"><b>O(n log n) time</b><span>the sort</span><b>O(1) extra space</b><span>two pointers</span></div>
<p>Each boat carries at most <strong>two people</strong> and at most <code>limit</code> weight. What is the fewest boats that carry everyone? Weights <code>[3, 2, 2, 1]</code>, limit 3: answer 3 (<code>{1,2}</code>, <code>{2}</code>, <code>{3}</code>).</p>
<p><strong>The greedy idea:</strong> the heaviest person needs a boat no matter what. The best partner for them, if anyone fits, is the lightest person, because the lightest person is the easiest to fit with <em>anyone</em>. If even the lightest does not fit, the heaviest goes alone.</p>
<pre><code>static int numBoats(int[] people, int limit) {
    Arrays.sort(people);
    int light = 0, heavy = people.length - 1, boats = 0;
    while (light &lt;= heavy) {
        if (people[light] + people[heavy] &lt;= limit) light++;   // lightest joins
        heavy--;                                               // heaviest always goes
        boats++;
    }
    return boats;
}</code></pre>
<pre><code>Trace: sorted [1, 2, 2, 3], limit 3

 light  heavy   pair         fits?   boats
  1       3     1 + 3 = 4    no      1   (3 alone)
  1       2     1 + 2 = 3    yes     2   ({1, 2})
  2       2     same person  -       3   (2 alone: light == heavy)
Answer: 3</code></pre>
<p><strong>Why it is correct (exchange argument):</strong> suppose some best arrangement puts the heaviest person <code>H</code> with someone other than the lightest, <code>L</code>. Swap: put <code>L</code> with <code>H</code> and move <code>L</code>'s old partner into <code>L</code>'s old place. <code>L</code> weighs no more than the person it replaced, so every boat still fits, and the boat count is unchanged. So pairing <code>H</code> with <code>L</code> is never worse.</p>
<table>
<tr><th>Variant</th><th>Change</th></tr>
<tr><td>Boats can carry any number of people</td><td>Different problem (bin packing), NP-hard in general: greedy gives only an approximation</td></tr>
<tr><td>Minimum number of pairs with sum at most k</td><td>Same two pointers</td></tr>
<tr><td>Maximum number of pairs with sum at least k</td><td>Sort, pair the smallest usable with the largest, count</td></tr>
<tr><td>Assign cookies to children (greed factors)</td><td>Sort both, give each child the smallest cookie that satisfies them</td></tr>
</table>
<p><strong>Worth pointing out:</strong> the "at most two per boat" rule is what makes greedy work. Mentioning that the general version is bin packing shows you understand <em>why</em> this one is easy.</p>`
},
{
  q: "Fractional knapsack vs 0/1 knapsack: why greedy solves one and not the other",
  level: "advanced", hot: true, tags: ["greedy", "knapsack", "dp", "comparison"],
  companies: ["Amazon", "Goldman Sachs", "Microsoft", "Samsung", "Oracle", "Infosys", "TCS"],
  a: `<div class="cx"><b>O(n log n) time</b><span>fractional: sort by value per kg</span><b>O(n · W)</b><span>0/1: dynamic programming</span></div>
<p>A thief with a bag that holds <code>W = 50</code> kg can choose from three items:</p>
<pre><code>item   weight   value   value per kg
 A       10       60        6.0
 B       20      100        5.0
 C       30      120        4.0</code></pre>
<p><strong>Fractional knapsack: items can be cut</strong> (gold dust, grain, fuel). Greedy is optimal: take the best value per kg first, as much as fits, then the next best.</p>
<pre><code>static double fractional(int[] w, int[] v, int capacity) {
    Integer[] idx = new Integer[w.length];
    for (int i = 0; i &lt; w.length; i++) idx[i] = i;
    Arrays.sort(idx, (a, b) -&gt; Double.compare((double) v[b] / w[b], (double) v[a] / w[a]));

    double total = 0;
    int left = capacity;
    for (int i : idx) {
        if (left == 0) break;
        int take = Math.min(w[i], left);
        total += (double) v[i] * take / w[i];      // a fraction of the item's value
        left -= take;
    }
    return total;
}
// Take all of A (10 kg, 60), all of B (20 kg, 100), then 20 of C's 30 kg:
// 60 + 100 + 120 * 20/30 = 240. Optimal.</code></pre>
<p><strong>0/1 knapsack: whole items only</strong> (a laptop, a painting). The same greedy gives the wrong answer:</p>
<pre><code>Greedy by value per kg:  A (10 kg) + B (20 kg) = 30 kg, value 160.
                         C does not fit in the remaining 20 kg.  Total: 160
Best:                    B (20 kg) + C (30 kg) = 50 kg.          Total: 220</code></pre>
<p>Greedy filled the bag with the "most efficient" items but left 20 kg of space it could not use. Once you cannot cut items, <strong>leftover capacity matters</strong>, and no simple rule decides it. You have to consider combinations, which is what DP does:</p>
<pre><code>static int zeroOne(int[] w, int[] v, int capacity) {
    int[] dp = new int[capacity + 1];              // dp[c] = best value using capacity c
    for (int i = 0; i &lt; w.length; i++)
        for (int c = capacity; c &gt;= w[i]; c--)     // BACKWARDS: each item used once
            dp[c] = Math.max(dp[c], v[i] + dp[c - w[i]]);
    return dp[capacity];
}
// zeroOne({10,20,30}, {60,100,120}, 50) = 220</code></pre>
<table>
<tr><th></th><th>Fractional</th><th>0/1</th></tr>
<tr><td>Items</td><td>Divisible</td><td>Whole or nothing</td></tr>
<tr><td>Algorithm</td><td>Greedy by value/weight</td><td>Dynamic programming</td></tr>
<tr><td>Time</td><td>O(n log n)</td><td>O(n · W): pseudo-polynomial, grows with the capacity number</td></tr>
<tr><td>Why the difference</td><td>Any leftover space is filled with a fraction of the next item, so no space is ever wasted</td><td>A locally efficient item can leave space that nothing else fits into</td></tr>
</table>
<p><strong>The general lesson to state:</strong> greedy works when a choice never reduces what the later choices can achieve. Making items indivisible breaks that property, which is exactly why the same-looking problem needs DP. A useful habit is to test greedy on a small case like this one before trusting it.</p>`
}
]);
