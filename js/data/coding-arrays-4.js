registerPrimer("coding-arrays", `<h3>The mental model: most array problems are one of five patterns</h3>
<p>The brute force for an array problem is usually two nested loops over every pair or every subarray: O(n²) or worse. Nearly every optimal solution removes that inner loop by <strong>remembering something</strong> as you go. What you remember decides the pattern.</p>
<table>
<tr><th>Pattern</th><th>Remember</th><th>Signal in the question</th></tr>
<tr><td><strong>Hash map</strong></td><td>Values (or counts) seen so far</td><td>"find a pair", "has it appeared before", "count"</td></tr>
<tr><td><strong>Two pointers</strong></td><td>Two positions moving toward each other</td><td>Sorted input; "pair with sum", "remove in place", palindromes</td></tr>
<tr><td><strong>Sliding window</strong></td><td>A range [left, right] and its contents</td><td>"longest / shortest contiguous subarray or substring such that…"</td></tr>
<tr><td><strong>Prefix sums</strong></td><td>Running totals</td><td>"sum of a subarray", many range-sum queries</td></tr>
<tr><td><strong>Binary search</strong></td><td>A half that cannot contain the answer</td><td>Sorted, rotated, or "minimum value that works"</td></tr>
</table>
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
<h3>Worked example: the same question, three speeds</h3>
<p><strong>"Does any pair in the array add up to the target?"</strong></p>
<pre><code>// 1. Brute force: every pair.  O(n²) time, O(1) space.
for (int i = 0; i &lt; n; i++)
    for (int j = i + 1; j &lt; n; j++)
        if (a[i] + a[j] == target) return true;

// 2. Hash set: for each x, have I already seen target - x?  O(n) time, O(n) space.
Set&lt;Integer&gt; seen = new HashSet&lt;&gt;();
for (int x : a) {
    if (seen.contains(target - x)) return true;
    seen.add(x);
}

// 3. If the array is ALREADY sorted: two pointers.  O(n) time, O(1) space.
int l = 0, r = n - 1;
while (l &lt; r) {
    int sum = a[l] + a[r];
    if (sum == target) return true;
    if (sum &lt; target) l++;          // need bigger: move the small end up
    else r--;                       // need smaller: move the big end down
}
return false;
// Sorting first costs O(n log n), so for UNSORTED input the hash set wins,
// unless memory is tight or you must return pairs in order.</code></pre>
<p><strong>The habit to show:</strong> name the brute force and its cost, then say what it recomputes ("for each element I scan the whole array again for its partner") and what you could remember instead ("the values I have already passed"). That sentence is the optimisation.</p>`);

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
