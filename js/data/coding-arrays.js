registerTopic("coding-arrays", [
{
  q: "Two Sum — find two numbers that add up to a target",
  level: "beginner", hot: true, tags: ["arrays", "hashing", "interview-favourite"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Walmart", "Uber", "Zoho"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass with a hash map</span><b>O(n) space</b><span>the map of seen values</span></div>
<pre><code>// The map stores value -> index of everything seen SO FAR.
// For each element we ask: have I already seen its complement?
public int[] twoSum(int[] nums, int target) {
    Map&lt;Integer, Integer&gt; seen = new HashMap&lt;&gt;();
    for (int i = 0; i &lt; nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{j, i};
        seen.put(nums[i], i);          // put AFTER the lookup, so i is not paired with itself
    }
    return new int[0];
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Two sum hash map lookup of the complement">
  <text class="dg-s" x="16" y="20">nums = [2, 7, 11, 15], target = 9</text>
  <rect class="dg-fill" x="16" y="32" width="52" height="32" rx="5"/><text class="dg-t" x="42" y="53" text-anchor="middle">2</text>
  <rect class="dg-fill2" x="72" y="32" width="52" height="32" rx="5"/><text class="dg-t" x="98" y="53" text-anchor="middle">7</text>
  <rect class="dg-box" x="128" y="32" width="52" height="32" rx="5"/><text class="dg-t" x="154" y="53" text-anchor="middle">11</text>
  <rect class="dg-box" x="184" y="32" width="52" height="32" rx="5"/><text class="dg-t" x="210" y="53" text-anchor="middle">15</text>
  <text class="dg-s" x="42" y="80" text-anchor="middle">i=0</text>
  <text class="dg-s" x="98" y="80" text-anchor="middle">i=1</text>
  <text class="dg-s" x="270" y="46">i=0: need 9-2=7 — not seen. Store {2 → 0}</text>
  <text class="dg-s" x="270" y="66">i=1: need 9-7=2 — FOUND at index 0 → [0, 1]</text>
  <text class="dg-s" x="16" y="116">The brute force checks every pair: O(n²). Trading O(n) memory for the</text>
  <text class="dg-s" x="16" y="134">lookup turns it into one pass — the core idea behind most array problems.</text>
</svg>
</figure>
<table>
<tr><th>Variant</th><th>Approach</th></tr>
<tr><td>Array is <strong>sorted</strong>, return values</td><td>Two pointers from both ends — O(n) time, <strong>O(1) space</strong></td></tr>
<tr><td>Count all pairs, duplicates allowed</td><td>Same map, but accumulate <code>count += seen.getOrDefault(complement, 0)</code></td></tr>
<tr><td><strong>3Sum</strong></td><td>Sort, fix one element, two pointers on the rest — O(n²)</td></tr>
<tr><td><strong>4Sum</strong></td><td>Sort, fix two, two pointers — O(n³)</td></tr>
<tr><td>Pair with a given difference</td><td>Same map, look for <code>nums[i] - k</code> and <code>nums[i] + k</code></td></tr>
</table>
<pre><code>// 3Sum — the natural follow-up. The tricky part is SKIPPING DUPLICATES.
public List&lt;List&lt;Integer&gt;&gt; threeSum(int[] nums) {
    Arrays.sort(nums);
    List&lt;List&lt;Integer&gt;&gt; out = new ArrayList&lt;&gt;();
    for (int i = 0; i &lt; nums.length - 2; i++) {
        if (i &gt; 0 && nums[i] == nums[i - 1]) continue;        // skip duplicate anchors
        if (nums[i] &gt; 0) break;                               // sorted: no triple can sum to 0
        int lo = i + 1, hi = nums.length - 1;
        while (lo &lt; hi) {
            int sum = nums[i] + nums[lo] + nums[hi];
            if (sum &lt; 0) lo++;
            else if (sum &gt; 0) hi--;
            else {
                out.add(List.of(nums[i], nums[lo], nums[hi]));
                while (lo &lt; hi && nums[lo] == nums[lo + 1]) lo++;   // skip duplicate pairs
                while (lo &lt; hi && nums[hi] == nums[hi - 1]) hi--;
                lo++; hi--;
            }
        }
    }
    return out;
}</code></pre>
<p><strong>Clarifying questions worth asking:</strong> is there exactly one solution? Can I use the same element twice? Are there duplicates? Should I return indices or values? Each one changes the code, and asking is free.</p>`
},
{
  q: "Kadane's algorithm — maximum subarray sum",
  level: "advanced", hot: true, tags: ["arrays", "kadane", "dp", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Goldman Sachs", "Walmart"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(1) space</b><span>two running values</span></div>
<pre><code>// The whole insight in one line: at each element, either EXTEND the previous
// subarray or START FRESH here — whichever is larger.
public int maxSubArray(int[] nums) {
    int best = nums[0], current = nums[0];
    for (int i = 1; i &lt; nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);   // extend or restart
        best = Math.max(best, current);
    }
    return best;
}
// Seeding with nums[0] (not 0) is what makes all-negative arrays work:
// [-3, -1, -2] correctly returns -1, not 0.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Kadane running sum restarting when it goes negative">
  <text class="dg-s" x="16" y="18">[-2, 1, -3, 4, -1, 2, 1, -5, 4]</text>
  <g>
    <rect class="dg-box" x="16" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="39" y="47" text-anchor="middle">-2</text>
    <rect class="dg-box" x="66" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="89" y="47" text-anchor="middle">1</text>
    <rect class="dg-box" x="116" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="139" y="47" text-anchor="middle">-3</text>
    <rect class="dg-fill" x="166" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="189" y="47" text-anchor="middle">4</text>
    <rect class="dg-fill" x="216" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="239" y="47" text-anchor="middle">-1</text>
    <rect class="dg-fill" x="266" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="289" y="47" text-anchor="middle">2</text>
    <rect class="dg-fill" x="316" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="339" y="47" text-anchor="middle">1</text>
    <rect class="dg-box" x="366" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="389" y="47" text-anchor="middle">-5</text>
    <rect class="dg-box" x="416" y="28" width="46" height="28" rx="4"/><text class="dg-t" x="439" y="47" text-anchor="middle">4</text>
  </g>
  <text class="dg-s" x="16" y="78">current: -2   1  -2   4   3   5   6   1   5</text>
  <text class="dg-s" x="16" y="98">best:    -2   1   1   4   4   5   6   6   6</text>
  <path class="dg-line" d="M166 62 H362" stroke-dasharray="4 3"/>
  <text class="dg-s" x="264" y="120" text-anchor="middle">best subarray [4,-1,2,1] = 6</text>
  <text class="dg-s" x="16" y="150">at index 3 the running sum was negative, so extending would only hurt — restart</text>
</svg>
</figure>
<pre><code>// Returning the INDICES too — the standard follow-up
public int[] maxSubArrayRange(int[] nums) {
    int best = nums[0], current = nums[0], start = 0, bestL = 0, bestR = 0;
    for (int i = 1; i &lt; nums.length; i++) {
        if (current + nums[i] &lt; nums[i]) { current = nums[i]; start = i; }  // restart
        else current += nums[i];
        if (current &gt; best) { best = current; bestL = start; bestR = i; }
    }
    return new int[]{best, bestL, bestR};
}</code></pre>
<table>
<tr><th>Variant</th><th>Trick</th></tr>
<tr><td>Maximum product subarray</td><td>Track <strong>both</strong> max and min — a negative times the min becomes the max</td></tr>
<tr><td>Circular array</td><td>answer = max(normal Kadane, totalSum − <em>minimum</em> subarray); special-case all-negative</td></tr>
<tr><td>At most k elements</td><td>Sliding window with a deque, or prefix sums plus a monotonic structure</td></tr>
<tr><td>2D maximum submatrix</td><td>Fix a column pair, compress rows to 1D, run Kadane — O(n²m)</td></tr>
<tr><td>Must be non-empty vs may be empty</td><td>Ask. If empty is allowed the answer floors at 0 and the seeding changes.</td></tr>
</table>
<p><strong>Frame it as DP when asked:</strong> "<code>dp[i]</code> is the best subarray sum <em>ending at i</em>, and <code>dp[i] = max(nums[i], dp[i-1] + nums[i])</code>. Since <code>dp[i]</code> only needs <code>dp[i-1]</code>, the array collapses to one variable — that is the space optimisation, and it is the same pattern behind house robber and best-time-to-buy-stock."</p>`
},
{
  q: "Move zeros to the end, and the Dutch National Flag (sort 0s, 1s and 2s)",
  level: "advanced", hot: true, tags: ["arrays", "two-pointers", "in-place"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Walmart", "Paytm", "Swiggy"],
  a: `<div class="cx"><b>O(n) time</b><span>single pass</span><b>O(1) space</b><span>fully in place</span></div>
<pre><code>// MOVE ZEROS — keep the relative order of non-zeros
public void moveZeroes(int[] nums) {
    int write = 0;
    for (int read = 0; read &lt; nums.length; read++) {
        if (nums[read] != 0) {
            int t = nums[write]; nums[write] = nums[read]; nums[read] = t;
            write++;
        }
    }
}
// Why SWAP rather than overwrite-then-pad: swapping finishes in one pass and
// never needs a second loop to write the zeros back.</code></pre>
<pre><code>// DUTCH NATIONAL FLAG — sort 0s, 1s, 2s in ONE pass, no counting sort
public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;
    while (mid &lt;= high) {
        switch (nums[mid]) {
            case 0 -&gt; { swap(nums, low++, mid++); }   // 0 goes left,  both advance
            case 1 -&gt; mid++;                          // 1 is already in place
            case 2 -&gt; swap(nums, mid, high--);        // 2 goes right, mid does NOT advance
        }
    }
}
private void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Dutch national flag three region invariant">
  <rect class="dg-fill" x="16" y="34" width="140" height="36" rx="6"/>
  <text class="dg-s" x="86" y="57" text-anchor="middle">all 0s</text>
  <rect class="dg-fill2" x="160" y="34" width="150" height="36" rx="6"/>
  <text class="dg-s" x="235" y="57" text-anchor="middle">all 1s</text>
  <rect class="dg-box" x="314" y="34" width="150" height="36" rx="6"/>
  <text class="dg-s" x="389" y="57" text-anchor="middle">unknown</text>
  <rect class="dg-fill" x="468" y="34" width="136" height="36" rx="6" opacity=".55"/>
  <text class="dg-s" x="536" y="57" text-anchor="middle">all 2s</text>
  <text class="dg-s" x="158" y="90" text-anchor="middle">low</text>
  <text class="dg-s" x="312" y="90" text-anchor="middle">mid</text>
  <text class="dg-s" x="466" y="90" text-anchor="middle">high</text>
  <path class="dg-line" d="M158 74 V84 M312 74 V84 M466 74 V84"/>
  <text class="dg-s" x="310" y="122" text-anchor="middle">invariant: [0,low) = 0s · [low,mid) = 1s · [mid,high] = unseen · (high,n) = 2s</text>
  <text class="dg-s" x="310" y="140" text-anchor="middle">the loop ends when the unknown region is empty</text>
</svg>
</figure>
<p><strong>The subtle rule that gets people:</strong> after swapping with <code>high</code>, <strong><code>mid</code> must not advance</strong> — the value swapped in from the right has never been examined. After swapping with <code>low</code> it is safe to advance, because everything left of <code>mid</code> is already classified. Being able to explain that invariant <em>is</em> the answer to this question.</p>
<table>
<tr><th>Related problem</th><th>Same technique</th></tr>
<tr><td>Segregate even and odd</td><td>Two pointers, one partition boundary</td></tr>
<tr><td>Partition step of quicksort</td><td>Lomuto = move-zeros; Hoare = flag-style</td></tr>
<tr><td>Remove element in place</td><td>Read/write pointers</td></tr>
<tr><td>Sort an array of k distinct values</td><td>Counting sort in O(n + k) — the flag trick only generalises cleanly to 3</td></tr>
</table>
<p><strong>The comparison to make unprompted:</strong> "A two-pass counting sort also solves sort-colors and is easier to get right. The Dutch flag version exists because it is <em>one</em> pass — which matters when the data is streamed or the writes are expensive. I would state both and let the interviewer pick."</p>`
},
{
  q: "Rotate an array by k positions, and rotate a matrix by 90 degrees",
  level: "beginner", hot: true, tags: ["arrays", "matrix", "in-place"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Walmart", "Oracle"],
  a: `<pre><code>// ROTATE ARRAY RIGHT by k — the reversal trick, O(n) time, O(1) space
public void rotate(int[] nums, int k) {
    int n = nums.length;
    k %= n;                       // k can exceed n; without this you loop pointlessly
    if (k &lt; 0) k += n;            // support negative k = rotate left
    reverse(nums, 0, n - 1);      // [1,2,3,4,5,6,7] -> [7,6,5,4,3,2,1]
    reverse(nums, 0, k - 1);      // reverse the first k -> [5,6,7,4,3,2,1]
    reverse(nums, k, n - 1);      // reverse the rest    -> [5,6,7,1,2,3,4]
}
private void reverse(int[] a, int i, int j) {
    while (i &lt; j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Three reversals rotating an array">
  <text class="dg-s" x="16" y="22">1  2  3  4 | 5  6  7        original, k = 3</text>
  <path class="dg-line" d="M16 32 H300" marker-end="url(#ra1)"/>
  <text class="dg-s" x="16" y="58">7  6  5 | 4  3  2  1        reverse everything</text>
  <text class="dg-s" x="16" y="86">5  6  7 | 4  3  2  1        reverse the first k</text>
  <text class="dg-s" x="16" y="114">5  6  7 | 1  2  3  4        reverse the remaining n-k  ✔</text>
  <defs><marker id="ra1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th></tr>
<tr><td>Rotate one step, k times</td><td>O(n·k)</td><td>O(1)</td></tr>
<tr><td>Copy into a new array at <code>(i+k)%n</code></td><td>O(n)</td><td>O(n)</td></tr>
<tr><td><strong>Three reversals</strong></td><td>O(n)</td><td><strong>O(1)</strong></td></tr>
<tr><td>Cyclic replacements (juggling)</td><td>O(n)</td><td>O(1)</td></tr>
</table>
<pre><code>// ROTATE MATRIX 90° CLOCKWISE, in place: TRANSPOSE then REVERSE each row
public void rotate(int[][] m) {
    int n = m.length;
    for (int i = 0; i &lt; n; i++) {
        for (int j = i + 1; j &lt; n; j++) {          // j starts at i+1, not 0 —
            int t = m[i][j]; m[i][j] = m[j][i]; m[j][i] = t;   // else you swap twice
        }
    }
    for (int[] row : m) reverse(row, 0, n - 1);
}
// ANTI-clockwise: transpose, then reverse the COLUMNS (or reverse rows first).</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Matrix rotation as transpose then row reversal">
  <text class="dg-s" x="46" y="20" text-anchor="middle">original</text>
  <text class="dg-t" x="46" y="42" text-anchor="middle">1 2 3</text>
  <text class="dg-t" x="46" y="62" text-anchor="middle">4 5 6</text>
  <text class="dg-t" x="46" y="82" text-anchor="middle">7 8 9</text>
  <path class="dg-line" d="M96 60 H186" marker-end="url(#mr1)"/>
  <text class="dg-s" x="141" y="50" text-anchor="middle">transpose</text>
  <text class="dg-s" x="236" y="20" text-anchor="middle">rows ↔ cols</text>
  <text class="dg-t" x="236" y="42" text-anchor="middle">1 4 7</text>
  <text class="dg-t" x="236" y="62" text-anchor="middle">2 5 8</text>
  <text class="dg-t" x="236" y="82" text-anchor="middle">3 6 9</text>
  <path class="dg-line" d="M286 60 H386" marker-end="url(#mr1)"/>
  <text class="dg-s" x="336" y="50" text-anchor="middle">reverse rows</text>
  <text class="dg-s" x="440" y="20" text-anchor="middle">rotated 90° CW</text>
  <text class="dg-t" x="440" y="42" text-anchor="middle">7 4 1</text>
  <text class="dg-t" x="440" y="62" text-anchor="middle">8 5 2</text>
  <text class="dg-t" x="440" y="82" text-anchor="middle">9 6 3</text>
  <text class="dg-s" x="310" y="118" text-anchor="middle">O(n²) time, O(1) space — no auxiliary matrix needed</text>
  <defs><marker id="mr1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Two bugs the interviewer is watching for:</strong> forgetting <code>k %= n</code> (a k larger than the array does nothing useful and can index out of bounds), and starting the transpose inner loop at <code>j = 0</code>, which swaps each pair twice and leaves the matrix unchanged.</p>`
},
{
  q: "Longest substring without repeating characters — the sliding window template",
  level: "advanced", hot: true, tags: ["strings", "sliding-window", "hashing"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Salesforce"],
  a: `<div class="cx"><b>O(n) time</b><span>each index enters and leaves the window once</span><b>O(min(n,k)) space</b><span>k = alphabet size</span></div>
<pre><code>public int lengthOfLongestSubstring(String s) {
    int[] last = new int[128];
    Arrays.fill(last, -1);                 // last index at which each char was seen
    int best = 0, left = 0;

    for (int right = 0; right &lt; s.length(); right++) {
        char c = s.charAt(right);
        // Math.max is ESSENTIAL: a stale index must never drag 'left' backwards.
        left = Math.max(left, last[c] + 1);
        last[c] = right;
        best = Math.max(best, right - left + 1);
    }
    return best;
}
// Test "abba": without Math.max, left jumps back to 1 at the final 'a'
// and the window wrongly contains a duplicate.</code></pre>
<pre><code>// THE TEMPLATE — memorise this shape, not individual solutions
int left = 0;
for (int right = 0; right &lt; n; right++) {
    add(arr[right]);                        // expand

    while (windowIsInvalid()) {             // shrink only while it must
        remove(arr[left++]);
    }
    best = Math.max(best, right - left + 1);          // LONGEST
    // for SHORTEST: while (windowIsVALID) { record; remove(arr[left++]); }
}</code></pre>
<table>
<tr><th>Problem</th><th>"Invalid" means</th></tr>
<tr><td>Longest without repeats</td><td>A character appears twice</td></tr>
<tr><td>Longest with at most k distinct</td><td><code>map.size() &gt; k</code></td></tr>
<tr><td>Longest repeating char replacement</td><td><code>windowLen − maxFreq &gt; k</code></td></tr>
<tr><td><strong>Minimum window substring</strong></td><td>Window does <em>not</em> cover the target — shrink while it does</td></tr>
<tr><td>Max consecutive ones after k flips</td><td>More than k zeros in the window</td></tr>
<tr><td>Fruit into baskets</td><td>More than 2 distinct types</td></tr>
</table>
<pre><code>// Minimum window substring — the hardest of the family, same skeleton
public String minWindow(String s, String t) {
    int[] need = new int[128];
    for (char c : t.toCharArray()) need[c]++;
    int missing = t.length(), left = 0, bestL = 0, bestLen = Integer.MAX_VALUE;

    for (int right = 0; right &lt; s.length(); right++) {
        if (need[s.charAt(right)]-- &gt; 0) missing--;      // consumed a needed char

        while (missing == 0) {                          // window is VALID -> shrink
            if (right - left + 1 &lt; bestLen) { bestLen = right - left + 1; bestL = left; }
            if (need[s.charAt(left++)]++ == 0) missing++;  // about to break validity
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
}</code></pre>
<p><strong>The precondition worth stating:</strong> a two-pointer window is only valid when the property is <em>monotonic</em> — shrinking must never make an invalid window more invalid. That is why "subarray sum ≥ target" works with positive numbers but breaks with negatives, where you need prefix sums and a map instead.</p>`
},
{
  q: "Product of array except self — without division",
  level: "advanced", hot: true, tags: ["arrays", "prefix-sum", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Walmart", "Salesforce"],
  a: `<div class="cx"><b>O(n) time</b><span>two passes</span><b>O(1) extra</b><span>the output array does not count</span></div>
<pre><code>// answer[i] = (product of everything LEFT of i) x (product of everything RIGHT of i)
public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] out = new int[n];

    out[0] = 1;
    for (int i = 1; i &lt; n; i++) out[i] = out[i - 1] * nums[i - 1];   // prefix products

    int right = 1;
    for (int i = n - 1; i &gt;= 0; i--) {
        out[i] *= right;              // fold the suffix in as we walk back
        right *= nums[i];             // one running variable, no second array
    }
    return out;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Prefix and suffix products combining to the answer">
  <text class="dg-s" x="16" y="20">nums   =  [ 1,  2,  3,  4 ]</text>
  <text class="dg-s" x="16" y="52">prefix =  [ 1,  1,  2,  6 ]      product of everything to the LEFT</text>
  <path class="dg-line" d="M120 60 H320" marker-end="url(#pp1)"/>
  <text class="dg-s" x="16" y="92">suffix =  [24, 12,  4,  1 ]      product of everything to the RIGHT</text>
  <path class="dg-line" d="M320 100 H120" marker-end="url(#pp1)"/>
  <text class="dg-s" x="16" y="132">answer =  [24, 12,  8,  6 ]      element-wise product of the two</text>
  <defs><marker id="pp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Why division is forbidden</strong> — and why the restriction is realistic rather than artificial:</p>
<pre><code>// The tempting solution
int total = 1;
for (int x : nums) total *= x;
for (int i = 0; i &lt; n; i++) out[i] = total / nums[i];
// Breaks completely on a ZERO. With one zero, every other slot must be 0
// and the zero slot must be the product of the rest — division gives
// ArithmeticException instead. With two zeros the whole answer is zeros.
// Handling that needs a zero-count special case; the prefix/suffix version
// needs none, which is why it is the better answer.</code></pre>
<table>
<tr><th>Related problem</th><th>Same prefix/suffix idea</th></tr>
<tr><td>Range sum queries</td><td>Prefix sums: <code>sum(i,j) = pre[j+1] − pre[i]</code></td></tr>
<tr><td>Trapping rain water</td><td>maxLeft and maxRight arrays, then two pointers to drop them</td></tr>
<tr><td>Subarray sum equals k</td><td>Prefix sum + a map of counts, O(n)</td></tr>
<tr><td>Candy distribution</td><td>Left-to-right pass, then right-to-left, take the max</td></tr>
<tr><td>Maximum product subarray</td><td>Track running max <em>and</em> min because of negatives</td></tr>
</table>
<pre><code>// Trapping rain water — the classic that uses exactly this shape, O(n)/O(1)
public int trap(int[] h) {
    int l = 0, r = h.length - 1, maxL = 0, maxR = 0, water = 0;
    while (l &lt; r) {
        if (h[l] &lt; h[r]) {                       // the smaller side bounds the water
            maxL = Math.max(maxL, h[l]);
            water += maxL - h[l];
            l++;
        } else {
            maxR = Math.max(maxR, h[r]);
            water += maxR - h[r];
            r--;
        }
    }
    return water;
}</code></pre>`
},
{
  q: "Merge two sorted arrays in place, and find the median of two sorted arrays",
  level: "advanced", tags: ["arrays", "two-pointers", "binary-search"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Uber", "Oracle"],
  a: `<pre><code>// MERGE SORTED ARRAYS — nums1 has space for m+n. Fill from the BACK.
public void merge(int[] nums1, int m, int[] nums2, int n) {
    int i = m - 1, j = n - 1, k = m + n - 1;
    while (j &gt;= 0) {                       // only nums2 must be drained
        nums1[k--] = (i &gt;= 0 && nums1[i] &gt; nums2[j]) ? nums1[i--] : nums2[j--];
    }
}
// Filling from the FRONT would overwrite unread nums1 values and need a copy.
// Writing backwards into the guaranteed-free tail makes it O(1) space.</code></pre>
<div class="cx"><b>Merge: O(m+n)</b><span>one pass from the back</span><b>Median: O(log min(m,n))</b><span>binary search on the partition</span></div>
<pre><code>// MEDIAN OF TWO SORTED ARRAYS — binary search the CUT, not the values
public double findMedianSortedArrays(int[] a, int[] b) {
    if (a.length &gt; b.length) return findMedianSortedArrays(b, a);   // search the shorter
    int m = a.length, n = b.length, half = (m + n + 1) / 2;
    int lo = 0, hi = m;

    while (lo &lt;= hi) {
        int i = (lo + hi) / 2;          // take i from a
        int j = half - i;               // and j from b

        int aLeft  = i == 0 ? Integer.MIN_VALUE : a[i - 1];
        int aRight = i == m ? Integer.MAX_VALUE : a[i];
        int bLeft  = j == 0 ? Integer.MIN_VALUE : b[j - 1];
        int bRight = j == n ? Integer.MAX_VALUE : b[j];

        if (aLeft &lt;= bRight && bLeft &lt;= aRight) {         // correct partition
            if ((m + n) % 2 == 1) return Math.max(aLeft, bLeft);
            return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2.0;
        }
        if (aLeft &gt; bRight) hi = i - 1; else lo = i + 1;
    }
    throw new IllegalArgumentException("inputs are not sorted");
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Partitioning two sorted arrays for the median">
  <text class="dg-s" x="16" y="22">A:  1  3 | 8  9</text>
  <text class="dg-s" x="16" y="52">B:  7 | 11 18 19 21 25</text>
  <path class="dg-line" d="M74 10 V32 M56 40 V62" stroke-dasharray="3 3"/>
  <rect class="dg-fill" x="300" y="16" width="140" height="46" rx="8"/>
  <text class="dg-s" x="370" y="36" text-anchor="middle">LEFT half</text>
  <text class="dg-s" x="370" y="54" text-anchor="middle">1 3 7</text>
  <rect class="dg-fill2" x="452" y="16" width="152" height="46" rx="8"/>
  <text class="dg-s" x="528" y="36" text-anchor="middle">RIGHT half</text>
  <text class="dg-s" x="528" y="54" text-anchor="middle">8 9 11 18 …</text>
  <text class="dg-s" x="16" y="90">valid cut when  max(aLeft, bLeft)  ≤  min(aRight, bRight)</text>
  <text class="dg-s" x="16" y="112">too big on the left → move the cut in A left; too small → move it right</text>
  <text class="dg-s" x="16" y="134">only one index is searched — j follows from i, which is why it is O(log min(m,n))</text>
</svg>
</figure>
<table>
<tr><th>Approach</th><th>Time</th><th>When to give it</th></tr>
<tr><td>Merge fully, take the middle</td><td>O(m+n)</td><td>Say it first — it is correct and shows you can ship something</td></tr>
<tr><td>Merge halfway only</td><td>O((m+n)/2)</td><td>Small improvement, same class</td></tr>
<tr><td><strong>Binary search the partition</strong></td><td>O(log min(m,n))</td><td>The intended answer; write it after stating the simple one</td></tr>
</table>
<p><strong>The two details that make this work:</strong> always binary-search the <em>shorter</em> array so <code>j</code> can never go out of range, and use <code>MIN_VALUE</code>/<code>MAX_VALUE</code> sentinels for the empty-side cases instead of a thicket of if-statements. Nearly every failed attempt at this problem fails on those edges, not on the idea.</p>`
},
{
  q: "Find the majority element and elements appearing more than n/3 times",
  level: "advanced", tags: ["arrays", "hashing", "must-know"],
  companies: ["Amazon", "Google", "Adobe", "Microsoft", "Flipkart", "Oracle", "Zoho"],
  a: `<div class="cx"><b>O(n) time</b><span>two passes</span><b>O(1) space</b><span>Boyer-Moore voting</span></div>
<pre><code>// BOYER-MOORE VOTING — majority = appears MORE than n/2 times
public int majorityElement(int[] nums) {
    int candidate = nums[0], count = 0;
    for (int x : nums) {
        if (count == 0) candidate = x;             // no standing candidate: adopt x
        count += (x == candidate) ? 1 : -1;        // vote for, or cancel out
    }
    return candidate;
}
// The intuition: pair every majority element with a different one and discard
// both. Since the majority occurs MORE than n/2 times, at least one survives.
// It is guaranteed correct ONLY if a majority exists — otherwise verify:
int c = 0; for (int x : nums) if (x == candidate) c++;
if (c &lt;= nums.length / 2) return -1;   // no majority</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Boyer-Moore voting cancelling pairs">
  <text class="dg-s" x="16" y="20">[2, 2, 1, 1, 1, 2, 2]</text>
  <text class="dg-s" x="16" y="48">cand:  2  2  2  2  1  1  2</text>
  <text class="dg-s" x="16" y="68">count: 1  2  1  0  1  0  1</text>
  <text class="dg-s" x="330" y="42">count hits 0 → the candidate</text>
  <text class="dg-s" x="330" y="62">has been fully cancelled out</text>
  <text class="dg-s" x="330" y="82">and the next element takes over</text>
  <text class="dg-s" x="16" y="110">final candidate = 2, which occurs 4 times out of 7  ✔</text>
</svg>
</figure>
<pre><code>// MORE THAN n/3 — at most TWO such elements can exist, so track two candidates
public List&lt;Integer&gt; majorityElementII(int[] nums) {
    int c1 = 0, c2 = 1, n1 = 0, n2 = 0;          // c1 != c2 to start
    for (int x : nums) {
        if (x == c1) n1++;
        else if (x == c2) n2++;
        else if (n1 == 0) { c1 = x; n1 = 1; }
        else if (n2 == 0) { c2 = x; n2 = 1; }
        else { n1--; n2--; }                      // cancel one of EACH
    }
    // Verification pass is mandatory here — candidates are not guaranteed
    n1 = 0; n2 = 0;
    for (int x : nums) { if (x == c1) n1++; else if (x == c2) n2++; }

    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    if (n1 &gt; nums.length / 3) out.add(c1);
    if (n2 &gt; nums.length / 3) out.add(c2);
    return out;
}
// Generalisation: for "more than n/k", at most k-1 elements qualify,
// so track k-1 candidates. That is the answer to the follow-up.</code></pre>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th></tr>
<tr><td>HashMap of counts</td><td>O(n)</td><td>O(n) — give this first, it is obviously correct</td></tr>
<tr><td>Sort, take <code>nums[n/2]</code></td><td>O(n log n)</td><td>O(1) — neat, worth a sentence</td></tr>
<tr><td><strong>Boyer-Moore</strong></td><td>O(n)</td><td><strong>O(1)</strong></td></tr>
<tr><td>Randomised pick and verify</td><td>O(n) expected</td><td>O(1) — a fun aside, not a real answer</td></tr>
</table>
<p><strong>The point to make about the verification pass:</strong> for the n/2 version it is only needed when a majority is not guaranteed. For the n/3 version it is <em>always</em> needed — the algorithm produces two candidates regardless, and they may occur only once each. Candidates who skip that pass return wrong answers on <code>[1,2,3]</code>.</p>`
},
{
  q: "Search in a rotated sorted array, and find the minimum in it",
  level: "advanced", hot: true, tags: ["arrays", "binary-search", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Walmart", "Goldman Sachs"],
  a: `<div class="cx"><b>O(log n) time</b><span>binary search on a partially ordered array</span><b>O(1) space</b><span>iterative</span></div>
<pre><code>// The key insight: after any rotation, AT LEAST ONE HALF is still fully sorted.
// Work out which, then decide whether the target lies inside it.
public int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo &lt;= hi) {
        int mid = lo + (hi - lo) / 2;               // avoids (lo+hi) overflow
        if (nums[mid] == target) return mid;

        if (nums[lo] &lt;= nums[mid]) {                // LEFT half is sorted
            if (nums[lo] &lt;= target && target &lt; nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                     // RIGHT half is sorted
            if (nums[mid] &lt; target && target &lt;= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Rotated sorted array with one sorted half">
  <g>
    <rect class="dg-fill" x="16" y="30" width="52" height="32" rx="5"/><text class="dg-t" x="42" y="51" text-anchor="middle">4</text>
    <rect class="dg-fill" x="72" y="30" width="52" height="32" rx="5"/><text class="dg-t" x="98" y="51" text-anchor="middle">5</text>
    <rect class="dg-fill" x="128" y="30" width="52" height="32" rx="5"/><text class="dg-t" x="154" y="51" text-anchor="middle">6</text>
    <rect class="dg-fill" x="184" y="30" width="52" height="32" rx="5"/><text class="dg-t" x="210" y="51" text-anchor="middle">7</text>
    <rect class="dg-fill2" x="240" y="30" width="52" height="32" rx="5"/><text class="dg-t" x="266" y="51" text-anchor="middle">0</text>
    <rect class="dg-fill2" x="296" y="30" width="52" height="32" rx="5"/><text class="dg-t" x="322" y="51" text-anchor="middle">1</text>
    <rect class="dg-fill2" x="352" y="30" width="52" height="32" rx="5"/><text class="dg-t" x="378" y="51" text-anchor="middle">2</text>
  </g>
  <text class="dg-s" x="126" y="82" text-anchor="middle">sorted run</text>
  <text class="dg-s" x="322" y="82" text-anchor="middle">sorted run</text>
  <path class="dg-line" d="M240 24 V16 H244" />
  <text class="dg-s" x="266" y="14" text-anchor="middle">pivot — the minimum</text>
  <text class="dg-s" x="16" y="116">mid = index 3 (value 7). nums[lo]=4 ≤ nums[mid]=7, so the LEFT half is sorted.</text>
  <text class="dg-s" x="16" y="136">target 0 is not inside [4,7), so discard the left half and search right.</text>
</svg>
</figure>
<pre><code>// FIND THE MINIMUM (the rotation pivot) — no target to compare against
public int findMin(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo &lt; hi) {                       // note: &lt;, not &lt;=
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] &gt; nums[hi]) lo = mid + 1;   // minimum is strictly right of mid
        else hi = mid;                            // mid could BE the minimum — keep it
    }
    return nums[lo];
}
// Compare against nums[hi], not nums[lo]. Comparing with lo fails on a
// non-rotated array such as [1,2,3,4,5].</code></pre>
<table>
<tr><th>Variant</th><th>Change</th></tr>
<tr><td><strong>Duplicates allowed</strong></td><td>When <code>nums[lo] == nums[mid] == nums[hi]</code> you cannot tell which side is sorted — shrink with <code>lo++; hi--;</code>. Worst case degrades to <strong>O(n)</strong>, and saying that is the point of the follow-up.</td></tr>
<tr><td>Find the rotation count</td><td>It is the index of the minimum</td></tr>
<tr><td>Peak element</td><td>Same shape: compare <code>nums[mid]</code> with <code>nums[mid+1]</code> and walk uphill</td></tr>
<tr><td>Search in a sorted 2D matrix</td><td>Treat it as one flat array: <code>row = mid / cols</code>, <code>col = mid % cols</code></td></tr>
</table>
<p><strong>Two habits to demonstrate:</strong> write <code>mid = lo + (hi - lo) / 2</code> rather than <code>(lo + hi) / 2</code> — the latter overflows for large arrays, and it was a real bug in Java's own binary search for nine years. And be deliberate about <code>while (lo &lt;= hi)</code> versus <code>while (lo &lt; hi)</code>: the first is for "find an exact value", the second for "converge on a boundary".</p>`
},
{
  q: "Set matrix zeros and spiral-order traversal",
  level: "advanced", tags: ["matrix", "arrays", "in-place"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Paytm", "Oracle"],
  a: `<pre><code>// SET MATRIX ZEROS — if a cell is 0, blank its whole row and column.
// The trap: marking as you go floods the matrix. Use the FIRST row and column
// as the marker storage, giving O(1) extra space.
public void setZeroes(int[][] m) {
    int rows = m.length, cols = m[0].length;
    boolean firstColZero = false;

    for (int i = 0; i &lt; rows; i++) {
        if (m[i][0] == 0) firstColZero = true;          // column 0 tracked separately,
        for (int j = 1; j &lt; cols; j++) {                 // because m[0][0] is shared
            if (m[i][j] == 0) { m[i][0] = 0; m[0][j] = 0; }
        }
    }
    // Apply, walking BACKWARDS so the markers are read before being overwritten
    for (int i = rows - 1; i &gt;= 0; i--) {
        for (int j = cols - 1; j &gt;= 1; j--) {
            if (m[i][0] == 0 || m[0][j] == 0) m[i][j] = 0;
        }
        if (firstColZero) m[i][0] = 0;
    }
}</code></pre>
<table>
<tr><th>Approach</th><th>Space</th><th>Note</th></tr>
<tr><td>Copy the matrix</td><td>O(m·n)</td><td>Obvious, correct — say it first</td></tr>
<tr><td>Two boolean arrays</td><td>O(m+n)</td><td>The natural answer</td></tr>
<tr><td><strong>First row/column as markers</strong></td><td><strong>O(1)</strong></td><td>The intended one; needs the <code>firstColZero</code> flag</td></tr>
</table>
<pre><code>// SPIRAL ORDER — shrink four boundaries inward
public List&lt;Integer&gt; spiralOrder(int[][] m) {
    List&lt;Integer&gt; out = new ArrayList&lt;&gt;();
    if (m.length == 0) return out;
    int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;

    while (top &lt;= bottom && left &lt;= right) {
        for (int j = left; j &lt;= right; j++) out.add(m[top][j]);
        top++;
        for (int i = top; i &lt;= bottom; i++) out.add(m[i][right]);
        right--;

        if (top &lt;= bottom) {                       // guard: single row left
            for (int j = right; j &gt;= left; j--) out.add(m[bottom][j]);
            bottom--;
        }
        if (left &lt;= right) {                       // guard: single column left
            for (int i = bottom; i &gt;= top; i--) out.add(m[i][left]);
            left++;
        }
    }
    return out;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Spiral traversal path over a matrix">
  <g>
    <rect class="dg-fill" x="180" y="24" width="46" height="32" rx="4"/><text class="dg-t" x="203" y="45" text-anchor="middle">1</text>
    <rect class="dg-fill" x="230" y="24" width="46" height="32" rx="4"/><text class="dg-t" x="253" y="45" text-anchor="middle">2</text>
    <rect class="dg-fill" x="280" y="24" width="46" height="32" rx="4"/><text class="dg-t" x="303" y="45" text-anchor="middle">3</text>
    <rect class="dg-box" x="180" y="60" width="46" height="32" rx="4"/><text class="dg-t" x="203" y="81" text-anchor="middle">4</text>
    <rect class="dg-box" x="230" y="60" width="46" height="32" rx="4"/><text class="dg-t" x="253" y="81" text-anchor="middle">5</text>
    <rect class="dg-fill" x="280" y="60" width="46" height="32" rx="4"/><text class="dg-t" x="303" y="81" text-anchor="middle">6</text>
    <rect class="dg-fill" x="180" y="96" width="46" height="32" rx="4"/><text class="dg-t" x="203" y="117" text-anchor="middle">7</text>
    <rect class="dg-fill" x="230" y="96" width="46" height="32" rx="4"/><text class="dg-t" x="253" y="117" text-anchor="middle">8</text>
    <rect class="dg-fill" x="280" y="96" width="46" height="32" rx="4"/><text class="dg-t" x="303" y="117" text-anchor="middle">9</text>
  </g>
  <path class="dg-line" d="M186 40 H320 V116 H186 V70" marker-end="url(#sp1)"/>
  <text class="dg-s" x="420" y="46">right → down → left → up</text>
  <text class="dg-s" x="420" y="68">then shrink the boundary</text>
  <text class="dg-s" x="420" y="90">that was just consumed</text>
  <text class="dg-s" x="420" y="112">1 2 3 6 9 8 7 4 5</text>
  <defs><marker id="sp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The guards are the whole difficulty.</strong> Without <code>if (top &lt;= bottom)</code> a single remaining row is traversed twice, and the output repeats values. Test with a 1×n and an n×1 matrix — that is exactly what the interviewer will hand you.</p>`
},
{
  q: "Merge overlapping intervals",
  level: "advanced", hot: true, tags: ["arrays", "intervals", "sorting"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Salesforce", "Walmart"],
  a: `<div class="cx"><b>O(n log n) time</b><span>dominated by the sort</span><b>O(n) space</b><span>the output list</span></div>
<pre><code>public int[][] merge(int[][] intervals) {
    if (intervals.length &lt;= 1) return intervals;

    // Sort by START. Everything else follows from this one line.
    Arrays.sort(intervals, Comparator.comparingInt(a -&gt; a[0]));

    List&lt;int[]&gt; out = new ArrayList&lt;&gt;();
    int[] current = intervals[0];
    out.add(current);                       // add the reference, then MUTATE it

    for (int[] next : intervals) {
        if (next[0] &lt;= current[1]) {        // overlap: extend the current interval
            current[1] = Math.max(current[1], next[1]);
        } else {                            // gap: start a new one
            current = next;
            out.add(current);
        }
    }
    return out.toArray(new int[0][]);
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Overlapping intervals merged into fewer intervals">
  <text class="dg-s" x="16" y="20">sorted by start</text>
  <rect class="dg-fill" x="40" y="30" width="110" height="20" rx="5"/><text class="dg-s" x="95" y="45" text-anchor="middle">1 — 3</text>
  <rect class="dg-fill" x="110" y="56" width="120" height="20" rx="5"/><text class="dg-s" x="170" y="71" text-anchor="middle">2 — 6</text>
  <rect class="dg-fill2" x="300" y="30" width="90" height="20" rx="5"/><text class="dg-s" x="345" y="45" text-anchor="middle">8 — 10</text>
  <rect class="dg-fill2" x="352" y="56" width="110" height="20" rx="5"/><text class="dg-s" x="407" y="71" text-anchor="middle">9 — 12</text>
  <path class="dg-line" d="M40 92 H604" stroke-dasharray="3 3"/>
  <rect class="dg-fill" x="40" y="102" width="190" height="22" rx="5"/><text class="dg-s" x="135" y="118" text-anchor="middle">1 — 6</text>
  <rect class="dg-fill2" x="300" y="102" width="162" height="22" rx="5"/><text class="dg-s" x="381" y="118" text-anchor="middle">8 — 12</text>
  <text class="dg-s" x="16" y="150">overlap test: next.start ≤ current.end  →  extend end to max(current.end, next.end)</text>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Sort by</th><th>Then</th></tr>
<tr><td>Merge intervals</td><td>start</td><td>Extend while <code>next.start ≤ cur.end</code></td></tr>
<tr><td>Insert interval into a sorted list</td><td>already sorted</td><td>Three phases: before, overlapping (merge), after — O(n), no sort</td></tr>
<tr><td>Meeting rooms — can one person attend all?</td><td>start</td><td>Any <code>next.start &lt; cur.end</code> means no</td></tr>
<tr><td><strong>Meeting rooms II</strong> — how many rooms?</td><td>start</td><td>Min-heap of end times; heap size is the answer</td></tr>
<tr><td>Non-overlapping intervals — fewest removals</td><td><strong>end</strong></td><td>Greedy: always keep the interval that ends earliest</td></tr>
<tr><td>Interval intersection of two lists</td><td>both sorted</td><td>Two pointers; advance whichever ends first</td></tr>
</table>
<pre><code>// Meeting rooms II — minimum number of rooms, O(n log n)
public int minMeetingRooms(int[][] intervals) {
    Arrays.sort(intervals, Comparator.comparingInt(a -&gt; a[0]));
    PriorityQueue&lt;Integer&gt; endTimes = new PriorityQueue&lt;&gt;();   // min-heap of end times

    for (int[] m : intervals) {
        if (!endTimes.isEmpty() && endTimes.peek() &lt;= m[0]) endTimes.poll();  // room freed
        endTimes.offer(m[1]);
    }
    return endTimes.size();     // peak concurrency = rooms needed
}</code></pre>
<p><strong>Ask this before coding:</strong> do intervals that merely <em>touch</em> — <code>[1,3]</code> and <code>[3,5]</code> — count as overlapping? It flips the comparison between <code>&lt;=</code> and <code>&lt;</code> and changes the answer. Interviewers deliberately leave it unstated to see whether you notice.</p>`
},
{
  q: "Longest consecutive sequence in an unsorted array",
  level: "advanced", tags: ["arrays", "hashing", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<div class="cx"><b>O(n) time</b><span>yes, genuinely linear — see the proof below</span><b>O(n) space</b><span>the hash set</span></div>
<pre><code>public int longestConsecutive(int[] nums) {
    Set&lt;Integer&gt; set = new HashSet&lt;&gt;();
    for (int x : nums) set.add(x);            // deduplicates as well

    int best = 0;
    for (int x : set) {
        // Only start counting from the BEGINNING of a run. This one line
        // is what keeps the whole thing O(n).
        if (set.contains(x - 1)) continue;

        int length = 1;
        while (set.contains(x + length)) length++;
        best = Math.max(best, length);
    }
    return best;
}</code></pre>
<p><strong>Why it is O(n) despite the nested loop</strong> — this is the question behind the question:</p>
<blockquote><p>The inner <code>while</code> only runs for values that <em>start</em> a run, and it walks each run exactly once. Every element is therefore visited at most twice overall: once by the outer loop, once by the inner walk of its own run. Total work is linear. Remove the <code>set.contains(x - 1)</code> guard and it becomes O(n²), because every element of a long run restarts the whole walk.</p></blockquote>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Only run starts trigger the inner walk">
  <text class="dg-s" x="16" y="20">[100, 4, 200, 1, 3, 2]</text>
  <rect class="dg-fill" x="16" y="34" width="60" height="30" rx="5"/><text class="dg-t" x="46" y="54" text-anchor="middle">1</text>
  <rect class="dg-box" x="80" y="34" width="60" height="30" rx="5"/><text class="dg-t" x="110" y="54" text-anchor="middle">2</text>
  <rect class="dg-box" x="144" y="34" width="60" height="30" rx="5"/><text class="dg-t" x="174" y="54" text-anchor="middle">3</text>
  <rect class="dg-box" x="208" y="34" width="60" height="30" rx="5"/><text class="dg-t" x="238" y="54" text-anchor="middle">4</text>
  <rect class="dg-fill" x="300" y="34" width="76" height="30" rx="5"/><text class="dg-t" x="338" y="54" text-anchor="middle">100</text>
  <rect class="dg-fill" x="392" y="34" width="76" height="30" rx="5"/><text class="dg-t" x="430" y="54" text-anchor="middle">200</text>
  <text class="dg-s" x="46" y="82" text-anchor="middle">start</text>
  <text class="dg-s" x="338" y="82" text-anchor="middle">start</text>
  <text class="dg-s" x="430" y="82" text-anchor="middle">start</text>
  <path class="dg-line" d="M46 68 V76 M338 68 V76 M430 68 V76"/>
  <text class="dg-s" x="16" y="112">2, 3 and 4 are skipped instantly because x−1 is present — no walk is started from them</text>
  <text class="dg-s" x="16" y="134">answer: the run 1,2,3,4 → length 4</text>
</svg>
</figure>
<table>
<tr><th>Approach</th><th>Time</th><th>Note</th></tr>
<tr><td>Sort, then scan</td><td>O(n log n)</td><td>Perfectly acceptable; mention it as the simple answer</td></tr>
<tr><td><strong>Hash set with run-start guard</strong></td><td><strong>O(n)</strong></td><td>The intended answer</td></tr>
<tr><td>Union-find</td><td>O(n·α)</td><td>Works, but heavier than needed — say why you would not</td></tr>
</table>
<p><strong>Edge cases:</strong> an empty array returns 0; duplicates must not inflate the length (the <code>HashSet</code> handles that for free); and negative numbers work unchanged, which is worth pointing out because a counting-array approach would not.</p>
<p><strong>The honest caveat to add:</strong> "O(n) here assumes O(1) hashing. With adversarial input that collides, <code>HashSet</code> degrades — in Java 8+ buckets become red-black trees, so the worst case is O(n log n) rather than O(n²). That is a detail, but it is the kind of thing that matters when the input is attacker-controlled."</p>`
}
]);
