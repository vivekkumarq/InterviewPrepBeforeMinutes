appendTopic("coding-arrays", [
{
  q: "Sliding window: fixed size, variable size, and how to spot which one",
  level: "advanced", hot: true, tags: ["sliding-window", "arrays", "strings", "pattern", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Salesforce"],
  a: `<p>Sliding window turns a nested loop into one pass. It applies whenever the answer is a <strong>contiguous</strong> subarray or substring and growing the window moves the metric in one direction only.</p>
<pre><code>// VARIABLE SIZE — the template. Grow on the right, shrink on the left.
int left = 0, best = 0;
Map&lt;Character, Integer&gt; count = new HashMap&lt;&gt;();
for (int right = 0; right &lt; s.length(); right++) {
    count.merge(s.charAt(right), 1, Integer::sum);       // 1. take in the right
    while (/* window is INVALID */ count.size() &gt; k) {   // 2. shrink until valid
        char c = s.charAt(left++);
        if (count.merge(c, -1, Integer::sum) == 0) count.remove(c);
    }
    best = Math.max(best, right - left + 1);             // 3. record while valid
}
// The three steps never change. Only the "invalid" condition does.
// Removing the key at zero matters: count.size() is the distinct-character
// count, and a lingering zero entry inflates it.</code></pre>
<pre><code>// FIXED SIZE — no while loop, just evict one as you admit one
long sum = 0, best = Long.MIN_VALUE;
for (int i = 0; i &lt; n; i++) {
    sum += a[i];
    if (i &gt;= k) sum -= a[i - k];        // the element leaving the window
    if (i &gt;= k - 1) best = Math.max(best, sum);
}
// Off-by-one check: at i == k-1 the window holds exactly k elements.</code></pre>
<table>
<tr><th>Problem</th><th>Window is invalid when</th></tr>
<tr><td>Longest substring without repeating characters</td><td>A character appears twice</td></tr>
<tr><td>Longest substring with at most K distinct</td><td><code>map.size() &gt; k</code></td></tr>
<tr><td>Minimum window substring</td><td>Not all of t is covered — here you shrink <em>while valid</em> to minimise</td></tr>
<tr><td>Maximum consecutive ones III (flip k zeros)</td><td>Zeros in the window exceed k</td></tr>
<tr><td>Permutation in string / find all anagrams</td><td>Fixed size — compare frequency maps</td></tr>
<tr><td>Fruit into baskets</td><td>More than 2 distinct types</td></tr>
<tr><td>Longest repeating character replacement</td><td><code>length − maxFreq &gt; k</code></td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="A window expanding right and shrinking left across an array">
  <g>
    <rect class="dg-fill" x="30" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="52" y="50" text-anchor="middle">a</text>
    <rect class="dg-fill2" x="78" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="100" y="50" text-anchor="middle">b</text>
    <rect class="dg-fill2" x="126" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="148" y="50" text-anchor="middle">c</text>
    <rect class="dg-fill2" x="174" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="196" y="50" text-anchor="middle">a</text>
    <rect class="dg-fill" x="222" y="30" width="44" height="30" rx="4"/><text class="dg-t" x="244" y="50" text-anchor="middle">d</text>
  </g>
  <text class="dg-s" x="78" y="80">left</text>
  <text class="dg-s" x="196" y="80">right</text>
  <text class="dg-s" x="300" y="44">both pointers only ever move FORWARD</text>
  <text class="dg-s" x="300" y="66">total movement ≤ 2n → O(n), not O(n²)</text>
  <text class="dg-s" x="30" y="112">breaks on negative numbers: shrinking can no longer be assumed to help</text>
</svg>
</figure>
<pre><code>// WHEN SLIDING WINDOW IS WRONG — say this before you write it
// "Subarray sum equals K" with NEGATIVE numbers: growing the window no longer
// increases the sum monotonically, so "shrink while too big" is unsound.
// You need PREFIX SUMS + a HashMap instead. The two techniques look alike and
// solve different problems; the sign of the values is the deciding question.
//
// Always ask: "can the values be negative?" It is one sentence and it changes
// the entire solution.</code></pre>
<p><strong>Complexity to state:</strong> O(n) time — each pointer traverses the array at most once, so total work is bounded by 2n even though there is a loop inside a loop. O(k) space for the frequency map, or O(1) if the alphabet is fixed.</p>`
},
{
  q: "Binary search beyond sorted arrays — search on the answer",
  level: "advanced", hot: true, tags: ["binary-search", "arrays", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Goldman Sachs", "Oracle"],
  a: `<p>Binary search does not need a sorted array. It needs a <strong>monotone predicate</strong>: a boolean that is false, false, false, then true forever. Once you can phrase the problem that way, you can binary-search the <em>answer</em> itself.</p>
<pre><code>// THE TEMPLATE THAT DOES NOT HAVE OFF-BY-ONE BUGS — find the FIRST true
int lo = 0, hi = n;                       // hi is EXCLUSIVE
while (lo &lt; hi) {
    int mid = lo + (hi - lo) / 2;         // not (lo+hi)/2 — that overflows
    if (predicate(mid)) hi = mid;         // mid might be the answer, keep it
    else                lo = mid + 1;     // mid is definitely not
}
return lo;                                // first index where predicate is true
// Invariant: the answer is always in [lo, hi). The loop shrinks the range and
// never skips it. Learn ONE template and reuse it; the three-way if-else
// version with lo &lt;= hi is where off-by-ones come from.</code></pre>
<pre><code>// SEARCH ON THE ANSWER — the pattern that unlocks the hard versions
// "Minimum capacity to ship all packages within D days"
//   lo = max(weights)      // must fit the heaviest single package
//   hi = sum(weights)      // one day, everything
//   predicate(cap) = "can we finish within D days at this capacity?"
//   -> monotone: bigger capacity is never worse. Binary search it.
//
// O(n log(sum)) instead of trying every capacity.

// Same shape, different wording:
// - Koko eating bananas          -> minimum speed
// - Split array largest sum      -> minimum achievable maximum
// - Minimum days to make bouquets-> minimum wait
// - Capacity to ship in D days   -> minimum capacity
// - Aggressive cows / magnetic force -> MAXIMUM minimum distance
//
// The tell: "minimise the maximum" or "maximise the minimum". Almost always
// binary search on the answer.</code></pre>
<table>
<tr><th>Variant</th><th>The change</th></tr>
<tr><td>First / last occurrence</td><td>On a match, keep searching that side instead of returning</td></tr>
<tr><td><code>lowerBound</code> / <code>upperBound</code></td><td>Predicate <code>a[i] &gt;= target</code> versus <code>a[i] &gt; target</code></td></tr>
<tr><td>Rotated sorted array</td><td>One half is always sorted — test which, then decide</td></tr>
<tr><td>Find the minimum in a rotated array</td><td>Compare <code>a[mid]</code> with <code>a[hi]</code>, never with <code>a[lo]</code></td></tr>
<tr><td>Peak element</td><td>Move toward the higher neighbour — works on unsorted input</td></tr>
<tr><td>Search a 2D matrix</td><td>Treat it as one array: <code>a[mid / cols][mid % cols]</code></td></tr>
<tr><td>Median of two sorted arrays</td><td>Binary search the <em>partition point</em>, O(log min(m,n))</td></tr>
<tr><td>Duplicates present</td><td>Worst case degrades to O(n) — <code>a[lo]==a[mid]==a[hi]</code> is undecidable</td></tr>
</table>
<pre><code>// The three bugs that account for nearly every failed binary search
1.  mid = (lo + hi) / 2            // overflows past 2^31; use lo + (hi-lo)/2
2.  while (lo &lt;= hi) with hi = mid // infinite loop — the range never shrinks
3.  Applying it to a predicate that is not monotone  // silently wrong answer

// Before writing a single line, say the predicate aloud and check it is
// monotone. If it flips true->false->true, binary search cannot be used.</code></pre>
<p><strong>Java shortcuts worth knowing:</strong> <code>Arrays.binarySearch</code> returns <code>-(insertionPoint) - 1</code> when absent — that negative encoding is the answer to "how do I find where it would go". <code>TreeMap.floorKey</code>/<code>ceilingKey</code> give the same semantics on a map, and <code>Collections.binarySearch</code> needs the list to be sorted by the same comparator or the result is undefined rather than merely wrong.</p>`
},
{
  q: "In-place array manipulation: cyclic sort, index marking, and Dutch national flag",
  level: "advanced", tags: ["arrays", "in-place", "space"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Zoho", "Oracle"],
  a: `<p>The follow-up is always "now do it in O(1) space." When the values are in a bounded range, the <strong>array itself can be the hash map</strong> — its indices store the information you would otherwise allocate.</p>
<pre><code>// CYCLIC SORT — for values in the range 1..n. Put each value at its index.
int i = 0;
while (i &lt; n) {
    int correct = a[i] - 1;                       // where a[i] belongs
    if (a[i] != a[correct]) { int t = a[i]; a[i] = a[correct]; a[correct] = t; }
    else i++;
}
// Then any position where a[i] != i+1 is a missing/duplicate/misplaced value.
// Solves in O(n) time and O(1) space:
//   missing number, find all missing numbers, find the duplicate,
//   find all duplicates, first missing positive, set mismatch.
//
// Compare a[i] != a[correct], NOT i != correct. With duplicates the second
// form swaps forever.</code></pre>
<pre><code>// INDEX MARKING — use the SIGN as a visited bit
for (int x : a) {
    int idx = Math.abs(x) - 1;
    if (a[idx] &gt; 0) a[idx] = -a[idx];            // mark "value idx+1 was seen"
}
for (int i = 0; i &lt; n; i++)
    if (a[i] &gt; 0) missing.add(i + 1);            // never marked -> never present
// O(1) extra space, but it MUTATES the input and needs all values positive.
// State both caveats — "I'm assuming I'm allowed to modify the array" is the
// sentence that turns a hack into a considered trade-off.</code></pre>
<pre><code>// DUTCH NATIONAL FLAG — sort 0s, 1s and 2s in ONE pass
int low = 0, mid = 0, high = n - 1;
while (mid &lt;= high) {
    switch (a[mid]) {
        case 0 -&gt; { swap(a, low++, mid++); }
        case 1 -&gt; mid++;
        case 2 -&gt; swap(a, mid, high--);          // NOTE: mid does NOT advance
    }
}
// After swapping from the back, the incoming value is unexamined — advancing
// mid would skip it. That single line is the whole interview question.
// Invariant: [0,low) are 0s, [low,mid) are 1s, (high,n) are 2s.</code></pre>
<table>
<tr><th>Technique</th><th>Requires</th><th>Classic problem</th></tr>
<tr><td>Cyclic sort</td><td>Values in 1..n</td><td>First missing positive</td></tr>
<tr><td>Sign marking</td><td>Positive values, mutation allowed</td><td>Find all duplicates</td></tr>
<tr><td>Dutch national flag</td><td>Three distinct categories</td><td>Sort colours</td></tr>
<tr><td>Two pointers from both ends</td><td>Sorted input</td><td>Two sum II, container with most water</td></tr>
<tr><td>Reverse three times</td><td>—</td><td>Rotate an array by k in O(1) space</td></tr>
<tr><td>Floyd's cycle detection</td><td>Values act as "next" pointers</td><td>Find the duplicate without mutating</td></tr>
<tr><td>Read/write pointer</td><td>—</td><td>Remove duplicates, move zeros, remove element</td></tr>
</table>
<pre><code>// ROTATE BY K — three reversals, no extra array
reverse(a, 0, n - 1);
reverse(a, 0, k - 1);
reverse(a, k, n - 1);
// And k %= n first, or a k larger than the array walks off the end.</code></pre>
<p><strong>Find the duplicate without mutating</strong> is the elegant one: treat <code>a[i]</code> as a pointer to index <code>a[i]</code>, and the duplicate becomes the entry point of a cycle — so Floyd's tortoise and hare finds it in O(n) time and O(1) space, with the input untouched. Recognising a linked-list algorithm inside an array problem is exactly the transfer interviewers are testing for.</p>`
}
]);
