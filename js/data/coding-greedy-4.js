registerPrimer("coding-greedy", `<p class="pr-lead">A <b>greedy algorithm</b> solves a problem step by step, always picking the option that looks best <b>right now</b>, and never going back to change it. When greedy works, it is usually the simplest and fastest solution: often just sorting the data and making one pass. The skill is knowing when that "best right now" choice is actually safe. This topic also covers <b>heaps</b>, which make "always take the best next item" fast.</p>
<div class="pr-analogy"><b>Think of it like this</b>Paying ₹80 in cash, you naturally hand over the largest note that fits first: a ₹50, then a ₹20, then a ₹10. Each step takes the biggest note possible, and you never reconsider. For Indian currency this always uses the fewest notes. But with unusual coins, say 1, 3 and 4, paying 6 greedily gives 4 + 1 + 1 (three coins), while 3 + 3 uses only two. Greedy is fast, but it is only correct for some problems.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Greedy choice</dt><dd>The option that looks best at the current step, taken without looking ahead.</dd>
<dt>Counterexample</dt><dd>A small input where greedy gives the wrong answer, proving it cannot be used.</dd>
<dt>Exchange argument</dt><dd>A way to show greedy is correct: swapping any best solution's choice for the greedy one never makes it worse.</dd>
<dt>Interval</dt><dd>A start and end, such as a meeting from 10:00 to 11:00.</dd>
<dt>Heap / priority queue</dt><dd>A structure that always gives you the smallest (or largest) item quickly. Java's <code>PriorityQueue</code>.</dd>
<dt>Top-k</dt><dd>Finding the k largest, smallest or most frequent items.</dd>
</dl>

<h3>Step by step: deciding whether greedy is safe</h3>
<ol class="pr-steps">
<li><b>Name the greedy rule:</b> for example "pick the meeting that ends earliest".</li>
<li><b>Try to break it:</b> spend a minute looking for a small input where the rule fails, like the coin example. If you find one, use dynamic programming instead.</li>
<li><b>Explain why it is safe:</b> show that the greedy choice never leaves you worse off than any other choice.</li>
<li><b>Choose the sort key:</b> most greedy solutions are "sort by the right thing, then one pass". The key (end time, ratio, deadline) is the real decision.</li>
<li><b>Say the reason out loud</b> to the interviewer, not just the code.</li>
</ol>
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

<h3>A worked example: the most meetings in one room</h3>
<pre><code>static int maxMeetings(int[][] meetings) {           // each is {start, end}
    Arrays.sort(meetings, Comparator.comparingInt(m -&gt; m[1]));   // earliest END first
    int count = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] m : meetings) {
        if (m[0] &gt;= lastEnd) {                        // starts after the last one ends
            count++;
            lastEnd = m[1];
        }
    }
    return count;
}
// Meetings: [1,4] [3,5] [0,6] [5,7] [8,9]
// Sorted by end: [1,4] [3,5] [0,6] [5,7] [8,9]</code></pre>
<ol class="pr-steps">
<li>Sort by end time: the meeting that finishes first leaves the most time free for the rest.</li>
<li>Take [1,4], the earliest to finish. lastEnd = 4.</li>
<li>[3,5] starts at 3, before 4, so it overlaps: skip it. [0,6] also overlaps: skip.</li>
<li>[5,7] starts at 5, after 4: take it. lastEnd = 7. Then [8,9] fits: take it.</li>
<li>Answer: 3 meetings. <b>Why it is safe:</b> finishing earlier can never leave less room than any other choice. Sorting takes O(n log n); the pass takes O(n).</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Assuming greedy works without checking</p>
<p>Greedy looks right on the example you were given but fails on others, as with the 1, 3, 4 coins.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> always try to find a counterexample first. If you find one, use DP.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Sorting by the wrong key</p>
<p>For the meetings problem, sorting by start time or by length gives wrong answers; only end time works.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> test your sort key on a small tricky example before coding.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Sorting everything for top-k</p>
<p>Sorting a million items to find the top 10 does far more work than needed.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> keep a heap of size k: O(n log k) instead of O(n log n), and it works on a stream of data.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Greedy takes the best choice now and never goes back.</li>
<li>It is fast and simple, but only correct for some problems.</li>
<li>Look for a counterexample; if one exists, use DP.</li>
<li>Most greedy solutions are "sort by the right key, then one pass".</li>
<li>Use a heap when you repeatedly need the smallest or largest item.</li>
</ul>
<p><b>Next:</b> the questions below cover interval problems, scheduling, heaps and top-k, jump game, Huffman coding and more.</p>`);

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
