registerPrimer("coding-arrays", `<p class="pr-lead"><b>Array and string problems</b> are the most common coding interview questions. An <b>array</b> is a numbered row of values, like <code>[4, 1, 7, 3]</code>, where you can jump straight to any position by its index. The simplest solution to most array problems checks every pair with two loops, which gets very slow on big inputs. The skill is spotting how to do it in one pass.</p>
<div class="pr-analogy"><b>Think of it like this</b>Imagine finding two people at a party whose ages add up to 50. The slow way: ask every person about every other person. The smart way: walk around once with a notebook. For each person, check whether you have already written down the age that would make 50 with theirs; if not, write their age down and move on. Remembering what you have already seen is the key idea behind most fast array solutions.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Index</dt><dd>A position in an array, starting from 0. <code>a[0]</code> is the first item.</dd>
<dt>Subarray / substring</dt><dd>A continuous piece of an array or string, with no gaps.</dd>
<dt>Hash map / hash set</dt><dd>A structure that remembers values and answers "have I seen this?" instantly.</dd>
<dt>Two pointers</dt><dd>Two positions that move through the array, often from both ends towards the middle.</dd>
<dt>Sliding window</dt><dd>A range [left, right] that slides along the array, growing and shrinking, to examine subarrays efficiently.</dd>
<dt>Prefix sum</dt><dd>A running total, so the sum of any range can be found by one subtraction.</dd>
<dt>Binary search</dt><dd>Repeatedly halving the search range in sorted data. Very fast: O(log n).</dd>
</dl>

<h3>Step by step: choosing a pattern</h3>
<p>Look for clues in the question:</p>
<ol class="pr-steps">
<li><b>"Find a pair", "seen before", "count how many"</b>: use a <b>hash map</b> or set to remember values as you go.</li>
<li><b>The array is sorted, or "pair with a sum", or "remove in place"</b>: use <b>two pointers</b>.</li>
<li><b>"Longest or shortest continuous subarray or substring such that…"</b>: use a <b>sliding window</b>.</li>
<li><b>"Sum of a subarray" or many range-sum questions</b>: use <b>prefix sums</b>.</li>
<li><b>Sorted, rotated, or "smallest value that works"</b>: use <b>binary search</b>.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 196" role="img" aria-label="Two pointers on a sorted array finding a pair with a target sum; the pointers move inward based on the current sum">
  <text class="dg-t" x="10" y="22">Two pointers: pair summing to 10 in a sorted array</text>
  <rect class="dg-fill" x="20" y="40" width="56" height="36" rx="5"/><text class="dg-m" x="48" y="63" text-anchor="middle">1</text>
  <rect class="dg-box" x="80" y="40" width="56" height="36" rx="5"/><text class="dg-m" x="108" y="63" text-anchor="middle">2</text>
  <rect class="dg-box" x="140" y="40" width="56" height="36" rx="5"/><text class="dg-m" x="168" y="63" text-anchor="middle">4</text>
  <rect class="dg-box" x="200" y="40" width="56" height="36" rx="5"/><text class="dg-m" x="228" y="63" text-anchor="middle">5</text>
  <rect class="dg-box" x="260" y="40" width="56" height="36" rx="5"/><text class="dg-m" x="288" y="63" text-anchor="middle">6</text>
  <rect class="dg-fill2" x="320" y="40" width="56" height="36" rx="5"/><text class="dg-m" x="348" y="63" text-anchor="middle">11</text>
  <text class="dg-s" x="48" y="94" text-anchor="middle">L</text>
  <text class="dg-s" x="348" y="94" text-anchor="middle">R</text>
  <text class="dg-s" x="396" y="54">1 + 11 = 12 &gt; 10</text>
  <text class="dg-s" x="396" y="70">so R moves left</text>
  <text class="dg-m" x="20" y="126">1+6=7  too small  -&gt; L moves right</text>
  <text class="dg-m" x="20" y="146">2+6=8  too small  -&gt; L moves right</text>
  <text class="dg-m" x="20" y="166">4+6=10 found</text>
  <text class="dg-s" x="330" y="146">every step rules out one element for good,</text>
  <text class="dg-s" x="330" y="162">so at most n steps: O(n), not O(n²)</text>
</svg>
<figcaption>Sorted order is what lets one comparison discard a whole row of pairs.</figcaption>
</figure>

<h3>A worked example: one question, three speeds</h3>
<p><b>"Does any pair in the array add up to the target?"</b></p>
<pre><code>// 1. Brute force: check every pair. O(n²) time.
for (int i = 0; i &lt; n; i++)
    for (int j = i + 1; j &lt; n; j++)
        if (a[i] + a[j] == target) return true;

// 2. Hash set: remember what we have seen. O(n) time, O(n) memory.
Set&lt;Integer&gt; seen = new HashSet&lt;&gt;();
for (int x : a) {
    if (seen.contains(target - x)) return true;   // its partner was earlier
    seen.add(x);
}

// 3. If the array is already sorted: two pointers. O(n) time, O(1) memory.
int l = 0, r = n - 1;
while (l &lt; r) {
    int sum = a[l] + a[r];
    if (sum == target) return true;
    if (sum &lt; target) l++;     // too small: move the left pointer to a bigger number
    else r--;                  // too big: move the right pointer to a smaller number
}
return false;</code></pre>
<ol class="pr-steps">
<li><b>Brute force</b> compares every pair: with 10,000 items that is about 50 million checks.</li>
<li><b>Hash set:</b> for each number x, the partner it needs is <code>target - x</code>. If that partner was seen earlier, we are done. Only one pass is needed.</li>
<li><b>Two pointers</b> work because the array is sorted: if the sum is too small, only moving the left pointer right can increase it; if too big, only moving the right pointer left can decrease it.</li>
<li>Sorting first costs O(n log n), so for unsorted input the hash set is usually the best answer.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Off-by-one errors</p>
<p>Using <code>i &lt;= n</code> instead of <code>i &lt; n</code> reads past the end of the array and crashes.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> remember the last index is <code>n - 1</code>, and test your loops on an array of one or two items.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting edge cases</p>
<p>Empty arrays, a single element, all elements the same, or negative numbers often break solutions that work on the "normal" example.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> list these cases before coding and walk through at least one at the end.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Changing the array while looping over it</p>
<p>Removing items from a list inside a for-each loop throws an exception or skips elements.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use an iterator's <code>remove()</code>, build a new list, or use a separate write pointer.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Jumping straight to the clever solution</p>
<p>If you go straight for the optimal trick and get stuck, you have nothing to show.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> state the brute force and its cost first, then say what it repeats and what you could remember instead.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Most fast solutions remove the inner loop by remembering something as you go.</li>
<li>Hash map for "seen before", two pointers for sorted data, sliding window for continuous ranges.</li>
<li>Prefix sums answer range-sum questions quickly; binary search halves the work each step.</li>
<li>Always state the brute force first, then improve it.</li>
<li>Test with empty, single-item and duplicate inputs.</li>
</ul>
<p><b>Next:</b> the questions below solve the classic array and string problems step by step, from Two Sum to merging intervals.</p>`);

appendTopic("coding-arrays", [
{
  q: "Count subarrays that sum to K using prefix sums and a hash map",
  level: "advanced", hot: true, tags: ["prefix-sum", "hashing", "subarrays", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Meta", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(n) space</b><span>map of prefix sums</span></div>
<p>Given <code>[1, 2, 3, -2, 5]</code> and <code>k = 3</code>, count the contiguous subarrays that add up to 3. Answer: 4 (<code>[1,2]</code>, <code>[3]</code>, <code>[2,3,-2]</code> and <code>[-2,5]</code>).</p>
<p><strong>Why not a sliding window?</strong> Sliding windows need "adding an element only makes the sum bigger", so you know when to shrink. With negative numbers that is false, and the window breaks. Prefix sums work for any integers.</p>
<p><strong>The key idea.</strong> Let <code>prefix[i]</code> be the sum of the first i elements. The sum of the subarray from <code>j</code> to <code>i-1</code> is <code>prefix[i] - prefix[j]</code>. We want that to equal k, so <code>prefix[j] = prefix[i] - k</code>. For each position, the number of subarrays ending here with sum k is <strong>how many earlier prefix sums equal the current prefix minus k</strong>. A hash map of prefix-sum counts answers that in O(1).</p>
<pre><code>static int subarraySum(int[] nums, int k) {
    Map&lt;Integer, Integer&gt; seen = new HashMap&lt;&gt;();
    seen.put(0, 1);                   // the empty prefix: lets a subarray that
                                      // starts at index 0 be counted
    int prefix = 0, count = 0;
    for (int x : nums) {
        prefix += x;
        count += seen.getOrDefault(prefix - k, 0);   // earlier starts that work
        seen.merge(prefix, 1, Integer::sum);         // record this prefix AFTER
    }                                                // looking it up
    return count;
}</code></pre>
<pre><code>Trace: nums = [1, 2, 3, -2, 5], k = 3

 x    prefix   prefix-k   seen before this step          add to count
 1      1        -2       {0:1}                           0
 2      3         0       {0:1, 1:1}                      1   [1,2]
 3      6         3       {0:1, 1:1, 3:1}                 1   [3]
-2      4         1       {0:1, 1:1, 3:1, 6:1}            1   [2,3,-2]
 5      9         6       {0:1, 1:1, 3:1, 6:1, 4:1}       1   [-2,5]
                                                  total = 4</code></pre>
<p>Each row adds the number of earlier start points that make a subarray ending here sum to k. Tracing a small example like this out loud is also how you catch your own bugs before the interviewer does.</p>
<table>
<tr><th>Detail</th><th>Why</th></tr>
<tr><td><code>seen.put(0, 1)</code> first</td><td>Without it, a subarray starting at index 0 (like <code>[1,2]</code>) is never counted</td></tr>
<tr><td>Look up before inserting</td><td>Inserting first would let a subarray of length zero count when k = 0</td></tr>
<tr><td>A map of <em>counts</em>, not a set</td><td>The same prefix sum can occur several times (zeros, or negatives cancelling), and each is a different start</td></tr>
</table>
<p><strong>The same trick solves:</strong> longest subarray with sum k (store the <em>first</em> index of each prefix instead of a count), subarrays divisible by k (key by <code>Math.floorMod(prefix, k)</code>), equal numbers of 0s and 1s (treat 0 as -1, look for sum 0), and path sum in a binary tree (the same map, carried down the recursion).</p>`
},
{
  q: "Find the next permutation of an array in place",
  level: "advanced", hot: true, tags: ["permutations", "in-place", "two-pointers"],
  companies: ["Google", "Microsoft", "Amazon", "Adobe", "Goldman Sachs", "Uber", "Bloomberg"],
  a: `<div class="cx"><b>O(n) time</b><span>at most three passes</span><b>O(1) space</b><span>in place</span></div>
<p>Rearrange the numbers into the next larger arrangement in dictionary order. <code>[1,2,3]</code> → <code>[1,3,2]</code>, <code>[1,3,2]</code> → <code>[2,1,3]</code>, and the largest, <code>[3,2,1]</code>, wraps around to the smallest, <code>[1,2,3]</code>.</p>
<p><strong>The intuition, using a number:</strong> the next number after 1 5 8 4 7 6 5 3 1 changes as few digits on the <em>right</em> as possible. Walk in from the right while digits keep rising: <code>7 6 5 3 1</code> is already the largest possible ending, so nothing inside it can grow. The first digit that breaks the rise is <code>4</code>. That is the digit that must increase.</p>
<pre><code>1 5 8 [4] 7 6 5 3 1
       ^ pivot: first from the right where a[i] &lt; a[i+1]

Swap it with the SMALLEST digit to its right that is still bigger than it: 5
1 5 8 [5] 7 6 4 3 1

The tail 7 6 4 3 1 is still in descending order. Reverse it to make it
the smallest possible ending:
1 5 8  5  1 3 4 6 7          &lt;- the next permutation</code></pre>
<pre><code>static void nextPermutation(int[] a) {
    int i = a.length - 2;
    while (i &gt;= 0 &amp;&amp; a[i] &gt;= a[i + 1]) i--;       // 1. find the pivot
    if (i &gt;= 0) {
        int j = a.length - 1;
        while (a[j] &lt;= a[i]) j--;                   // 2. rightmost element bigger
        swap(a, i, j);                              //    than the pivot
    }
    reverse(a, i + 1, a.length - 1);                // 3. smallest possible tail
}                                                   //    (whole array if no pivot)

static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
static void reverse(int[] a, int l, int r) { while (l &lt; r) swap(a, l++, r--); }</code></pre>
<table>
<tr><th>Step</th><th>Why it is correct</th></tr>
<tr><td>Pivot = first rise from the right</td><td>Everything to its right is descending, the largest arrangement of those digits, so the change must happen at the pivot</td></tr>
<tr><td>Swap with the smallest larger digit to the right</td><td>Increases the pivot position by the least possible amount. Because the tail is descending, that is the <em>rightmost</em> larger digit</td></tr>
<tr><td>Reverse the tail</td><td>After the swap the tail is still descending; reversing makes it ascending, the smallest arrangement</td></tr>
<tr><td>No pivot</td><td>The whole array is descending, the last permutation; reversing it gives the first</td></tr>
</table>
<p><strong>Edge cases to mention:</strong> duplicates (<code>&gt;=</code> and <code>&lt;=</code> in the loops handle them; <code>[1,1,5]</code> → <code>[1,5,1]</code>), a single element (no change), and all equal (no change).</p>
<p><strong>Where it is used:</strong> generating all permutations in order without recursion (<code>std::next_permutation</code> in C++ is this exact algorithm), "next greater number with the same digits", and "kth permutation" problems.</p>`
}
]);
