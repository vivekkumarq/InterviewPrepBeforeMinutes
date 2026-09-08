registerTopic("algorithms", [
{
  q: "Compare the sorting algorithms — which does Java actually use, and why two?",
  level: "beginner", hot: true, tags: ["sorting", "complexity", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Oracle", "Goldman Sachs", "TCS", "Infosys"],
  a: `<table>
<tr><th>Algorithm</th><th>Best</th><th>Average</th><th>Worst</th><th>Space</th><th>Stable</th><th>In place</th></tr>
<tr><td>Bubble</td><td>O(n)*</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Selection</td><td>O(n²)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>No</td><td>Yes</td></tr>
<tr><td>Insertion</td><td><strong>O(n)</strong></td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>Yes</td><td>Yes</td></tr>
<tr><td><strong>Merge</strong></td><td>O(n log n)</td><td>O(n log n)</td><td><strong>O(n log n)</strong></td><td>O(n)</td><td><strong>Yes</strong></td><td>No</td></tr>
<tr><td><strong>Quick</strong></td><td>O(n log n)</td><td>O(n log n)</td><td><strong>O(n²)</strong></td><td>O(log n)</td><td>No</td><td>Yes</td></tr>
<tr><td>Heap</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>No</td><td>Yes</td></tr>
<tr><td>Counting</td><td>O(n+k)</td><td>O(n+k)</td><td>O(n+k)</td><td>O(k)</td><td>Yes</td><td>No</td></tr>
<tr><td>Radix</td><td>O(d(n+k))</td><td>O(d(n+k))</td><td>O(d(n+k))</td><td>O(n+k)</td><td>Yes</td><td>No</td></tr>
</table>
<p>* only with the early-exit swap flag.</p>
<pre><code>// QUICKSORT — Lomuto partition, with the randomisation that matters
public void quickSort(int[] a, int lo, int hi) {
    if (lo &gt;= hi) return;
    int p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}
private int partition(int[] a, int lo, int hi) {
    swap(a, hi, lo + new Random().nextInt(hi - lo + 1));   // random pivot: kills the
    int pivot = a[hi], i = lo - 1;                          // sorted-input worst case
    for (int j = lo; j &lt; hi; j++) {
        if (a[j] &lt; pivot) swap(a, ++i, j);
    }
    swap(a, i + 1, hi);
    return i + 1;
}

// MERGE SORT — the merge step is what makes it stable
private void merge(int[] a, int lo, int mid, int hi, int[] buf) {
    System.arraycopy(a, lo, buf, lo, hi - lo + 1);
    int i = lo, j = mid + 1;
    for (int k = lo; k &lt;= hi; k++) {
        if      (i &gt; mid)            a[k] = buf[j++];
        else if (j &gt; hi)             a[k] = buf[i++];
        else if (buf[j] &lt; buf[i])    a[k] = buf[j++];
        else                         a[k] = buf[i++];   // &lt;= keeps LEFT first = STABLE
    }
}</code></pre>
<p><strong>Why Java ships two different sorts</strong> — this is the question behind the question:</p>
<table>
<tr><th></th><th><code>Arrays.sort(int[])</code></th><th><code>Arrays.sort(Object[])</code> / <code>Collections.sort</code></th></tr>
<tr><td>Algorithm</td><td>Dual-pivot quicksort</td><td><strong>TimSort</strong> (merge sort on natural runs + insertion sort)</td></tr>
<tr><td>Stable</td><td>No — and it does not matter</td><td><strong>Yes</strong> — and it is a documented guarantee</td></tr>
<tr><td>Extra space</td><td>O(log n)</td><td>O(n)</td></tr>
<tr><td>Reason</td><td>Two equal <code>int</code>s are indistinguishable, so instability is unobservable. Take the speed and the O(1) space.</td><td>Two equal objects can differ in other fields. Sorting by department then by name must preserve the first sort — that requires stability.</td></tr>
</table>
<div class="cx"><b>Comparison lower bound: Ω(n log n)</b><span>any comparison sort must distinguish n! orderings, and log₂(n!) ≈ n log n</span></div>
<p><strong>How to beat n log n:</strong> stop comparing. Counting sort, radix sort and bucket sort use the <em>values</em> as indices, so the lower bound does not apply — at the cost of assuming a bounded range. That is why radix sort is O(d·n) and not a contradiction.</p>
<p><strong>The practical answer to "which would you use":</strong> the library's. It has been tuned for years, handles small-array cutoffs, presorted runs and cache behaviour, and is almost certainly faster than a hand-rolled version. Write your own only to answer an interview question or to sort by an unusual key that a comparator cannot express.</p>`
},
{
  q: "Binary search and its variants — first, last and rotated",
  level: "advanced", hot: true, tags: ["binary-search", "searching", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Goldman Sachs", "Oracle"],
  a: `<div class="cx"><b>O(log n) time</b><span>halve the range every step</span><b>O(1) space</b><span>iterative form</span></div>
<pre><code>// EXACT MATCH
public int search(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo &lt;= hi) {                         // &lt;= : the range is INCLUSIVE
        int mid = lo + (hi - lo) / 2;          // never (lo + hi) / 2 — that overflows
        if (a[mid] == target) return mid;
        if (a[mid] &lt; target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}

// FIRST occurrence (lower bound) — keep searching left after a match
public int firstOccurrence(int[] a, int target) {
    int lo = 0, hi = a.length - 1, ans = -1;
    while (lo &lt;= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] &gt;= target) { if (a[mid] == target) ans = mid; hi = mid - 1; }
        else lo = mid + 1;
    }
    return ans;
}

// LAST occurrence (upper bound)
public int lastOccurrence(int[] a, int target) {
    int lo = 0, hi = a.length - 1, ans = -1;
    while (lo &lt;= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] &lt;= target) { if (a[mid] == target) ans = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return ans;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Binary search halving the range and the two loop conventions">
  <rect class="dg-fill" x="16" y="34" width="290" height="30" rx="5"/>
  <rect class="dg-box" x="310" y="34" width="290" height="30" rx="5"/>
  <text class="dg-s" x="160" y="54" text-anchor="middle">keep</text>
  <text class="dg-s" x="454" y="54" text-anchor="middle">discard</text>
  <path class="dg-line" d="M308 26 V72"/>
  <text class="dg-s" x="308" y="20" text-anchor="middle">mid</text>
  <text class="dg-s" x="16" y="102">while (lo &lt;= hi)  →  "find an exact value", range is inclusive, terminate on lo &gt; hi</text>
  <text class="dg-s" x="16" y="128">while (lo &lt; hi)   →  "converge on a boundary", answer is a[lo] when the loop ends</text>
</svg>
</figure>
<pre><code>// BINARY SEARCH ON THE ANSWER — the pattern most candidates miss.
// When the answer is monotonic ("if x works, so does x+1"), search the VALUE space.
//
// Koko eating bananas: minimum speed to finish within h hours
public int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = Arrays.stream(piles).max().getAsInt();
    while (lo &lt; hi) {
        int speed = lo + (hi - lo) / 2;
        long hours = 0;
        for (int p : piles) hours += (p + speed - 1) / speed;   // ceiling division
        if (hours &lt;= h) hi = speed;        // feasible -> try slower
        else lo = speed + 1;               // too slow  -> must go faster
    }
    return lo;
}</code></pre>
<table>
<tr><th>Variant</th><th>Change</th></tr>
<tr><td>First / last occurrence</td><td>Record the match, then keep shrinking in that direction</td></tr>
<tr><td>Insert position</td><td>Return <code>lo</code> after the loop</td></tr>
<tr><td>Rotated sorted array</td><td>One half is always sorted — decide which, then whether the target is inside it</td></tr>
<tr><td>Peak element</td><td>Compare <code>a[mid]</code> with <code>a[mid+1]</code> and walk uphill</td></tr>
<tr><td>Search a sorted 2D matrix</td><td>Treat it as flat: <code>row = mid / cols</code>, <code>col = mid % cols</code></td></tr>
<tr><td>Square root of x</td><td>Binary search on the answer, guard the multiplication with <code>long</code></td></tr>
<tr><td>Split array / ship packages / Koko</td><td><strong>Binary search on the answer</strong> with a feasibility check</td></tr>
</table>
<p><strong>The overflow point is not academic:</strong> <code>(lo + hi) / 2</code> overflows once the sum exceeds <code>Integer.MAX_VALUE</code>. That exact bug lived in Java's own <code>Arrays.binarySearch</code> for nine years before it was found in 2006. Writing <code>lo + (hi - lo) / 2</code> costs nothing and signals that you know the history.</p>
<p><strong>How to spot "binary search on the answer":</strong> the problem asks for a minimum or maximum, the answer lies in a numeric range, and there is a cheap way to test whether a candidate value works. If feasibility is monotonic in that value, you can binary search it — turning an O(n·range) scan into O(n log range).</p>`
},
{
  q: "KMP string matching and the prefix function",
  level: "advanced", tags: ["string-matching", "strings", "algorithms"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Oracle", "Goldman Sachs", "Flipkart"],
  a: `<div class="cx"><b>O(n + m) time</b><span>text plus pattern, no backtracking in the text</span><b>O(m) space</b><span>the prefix table</span></div>
<pre><code>// The LPS table: lps[i] = length of the longest proper prefix of pattern[0..i]
// that is also a suffix of it. This is the entire algorithm.
private int[] buildLps(String p) {
    int[] lps = new int[p.length()];
    int len = 0;
    for (int i = 1; i &lt; p.length(); ) {
        if (p.charAt(i) == p.charAt(len)) {
            lps[i++] = ++len;
        } else if (len &gt; 0) {
            len = lps[len - 1];          // fall back, do NOT reset to 0
        } else {
            lps[i++] = 0;
        }
    }
    return lps;
}

public int kmpSearch(String text, String pattern) {
    if (pattern.isEmpty()) return 0;
    int[] lps = buildLps(pattern);
    int i = 0, j = 0;                     // i indexes text, j indexes pattern

    while (i &lt; text.length()) {
        if (text.charAt(i) == pattern.charAt(j)) {
            i++; j++;
            if (j == pattern.length()) return i - j;      // match found
        } else if (j &gt; 0) {
            j = lps[j - 1];               // shift the PATTERN, never rewind i
        } else {
            i++;
        }
    }
    return -1;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="KMP skipping ahead using the longest prefix suffix table">
  <text class="dg-s" x="16" y="22">pattern "ABABC"</text>
  <rect class="dg-fill" x="16" y="32" width="44" height="28" rx="4"/><text class="dg-t" x="38" y="51" text-anchor="middle">A</text>
  <rect class="dg-fill" x="64" y="32" width="44" height="28" rx="4"/><text class="dg-t" x="86" y="51" text-anchor="middle">B</text>
  <rect class="dg-fill2" x="112" y="32" width="44" height="28" rx="4"/><text class="dg-t" x="134" y="51" text-anchor="middle">A</text>
  <rect class="dg-fill2" x="160" y="32" width="44" height="28" rx="4"/><text class="dg-t" x="182" y="51" text-anchor="middle">B</text>
  <rect class="dg-box" x="208" y="32" width="44" height="28" rx="4"/><text class="dg-t" x="230" y="51" text-anchor="middle">C</text>
  <text class="dg-s" x="16" y="82">lps:   0  0  1  2  0</text>
  <path class="dg-line" d="M112 66 Q75 92 38 68" marker-end="url(#kmp1)"/>
  <text class="dg-s" x="300" y="46">"AB" is both a prefix and a suffix</text>
  <text class="dg-s" x="300" y="68">of "ABAB", so on a mismatch at C</text>
  <text class="dg-s" x="300" y="90">we resume at pattern index 2 —</text>
  <text class="dg-s" x="300" y="112">the text pointer never moves back</text>
  <text class="dg-s" x="16" y="146">naive search would restart the text at the next character, giving O(n·m)</text>
  <defs><marker id="kmp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Algorithm</th><th>Time</th><th>Best for</th></tr>
<tr><td>Naive</td><td>O(n·m)</td><td>Short patterns; it is what <code>String.indexOf</code> actually does</td></tr>
<tr><td><strong>KMP</strong></td><td>O(n+m)</td><td>Guaranteed linear; streaming text you cannot rewind</td></tr>
<tr><td>Rabin-Karp</td><td>O(n+m) average</td><td><strong>Multiple</strong> patterns at once; plagiarism detection via rolling hash</td></tr>
<tr><td>Boyer-Moore</td><td>Sublinear in practice</td><td>Long patterns and large alphabets — what <code>grep</code> uses</td></tr>
<tr><td>Aho-Corasick</td><td>O(n + total pattern length)</td><td>Thousands of patterns simultaneously — spam and virus scanners</td></tr>
<tr><td>Z-algorithm</td><td>O(n+m)</td><td>Same guarantees as KMP, often easier to derive under pressure</td></tr>
</table>
<p><strong>Where the LPS table is worth more than the search:</strong> it solves several other problems directly — the shortest palindrome you can make by prepending characters, the smallest repeating unit of a string (<code>n − lps[n−1]</code> divides n), and counting how many times a pattern occurs. Those show up more often in interviews than KMP itself.</p>
<p><strong>Be honest about when to use it:</strong> "Java's <code>indexOf</code> is naive but heavily optimised, and for typical short patterns it wins on constant factors. I would reach for KMP when the pattern is long, the text is a stream I cannot re-read, or I need a worst-case guarantee against adversarial input."</p>`
},
{
  q: "Bit manipulation tricks every interviewer expects",
  level: "advanced", hot: true, tags: ["bit-manipulation", "math", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Oracle", "Goldman Sachs", "Uber", "Zoho"],
  a: `<pre><code>// THE ESSENTIALS
n &amp; 1                 // is it odd?
n &gt;&gt; 1                // divide by 2 (arithmetic, keeps the sign)
n &gt;&gt;&gt; 1               // unsigned shift — fills with 0, use for hashing
n &amp; (n - 1)           // clear the LOWEST set bit
n &amp; -n                // ISOLATE the lowest set bit
n | (1 &lt;&lt; i)          // set bit i
n &amp; ~(1 &lt;&lt; i)         // clear bit i
n ^ (1 &lt;&lt; i)          // toggle bit i
(n &gt;&gt; i) &amp; 1          // read bit i

// POWER OF TWO — one line, because a power of 2 has exactly one set bit
boolean isPowerOfTwo(int n) { return n &gt; 0 &amp;&amp; (n &amp; (n - 1)) == 0; }

// COUNT SET BITS — Brian Kernighan's: loops once per SET bit, not 32 times
int countBits(int n) {
    int count = 0;
    while (n != 0) { n &amp;= (n - 1); count++; }
    return count;
}
// In production: Integer.bitCount(n) — it compiles to a single POPCNT instruction.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="n and n minus one clearing the lowest set bit">
  <text class="dg-s" x="16" y="30">n      = 1 0 1 1 0 0 0</text>
  <text class="dg-s" x="16" y="58">n - 1  = 1 0 1 0 1 1 1</text>
  <path class="dg-line" d="M16 68 H300"/>
  <text class="dg-s" x="16" y="94">n &amp; (n-1) = 1 0 1 0 0 0 0</text>
  <text class="dg-s" x="360" y="40">subtracting 1 flips the lowest set</text>
  <text class="dg-s" x="360" y="62">bit to 0 and everything below it to 1</text>
  <text class="dg-s" x="360" y="90">the AND then wipes exactly that bit</text>
  <text class="dg-s" x="16" y="126">so the loop runs once per set bit — 3 iterations here, not 32</text>
</svg>
</figure>
<pre><code>// SINGLE NUMBER — every element appears twice except one. XOR cancels pairs.
public int singleNumber(int[] nums) {
    int x = 0;
    for (int n : nums) x ^= n;      // a^a = 0, a^0 = a, and XOR is commutative
    return x;
}

// TWO single numbers among pairs — partition by a differing bit
public int[] singleNumberIII(int[] nums) {
    int xor = 0;
    for (int n : nums) xor ^= n;              // = a ^ b
    int lowestBit = xor &amp; -xor;               // a bit where a and b DIFFER

    int a = 0, b = 0;
    for (int n : nums) {
        if ((n &amp; lowestBit) != 0) a ^= n; else b ^= n;
    }
    return new int[]{a, b};
}

// SWAP without a temp (know the aliasing trap: i == j zeroes the value)
a ^= b; b ^= a; a ^= b;

// SUBSETS via bitmask — every integer 0..2^n-1 IS a subset
for (int mask = 0; mask &lt; (1 &lt;&lt; n); mask++) {
    List&lt;Integer&gt; subset = new ArrayList&lt;&gt;();
    for (int i = 0; i &lt; n; i++) if ((mask &gt;&gt; i &amp; 1) == 1) subset.add(nums[i]);
}</code></pre>
<table>
<tr><th>Problem</th><th>Trick</th></tr>
<tr><td>Single number (pairs)</td><td>XOR everything</td></tr>
<tr><td>Missing number in 0..n</td><td>XOR the indices with the values</td></tr>
<tr><td>Two single numbers</td><td>XOR all, isolate a differing bit, partition</td></tr>
<tr><td>Single number among triples</td><td>Count bits mod 3, or two accumulator variables</td></tr>
<tr><td>Reverse bits</td><td>Shift out of one end and into the other, 32 times</td></tr>
<tr><td>Sum of two integers without <code>+</code></td><td><code>carry = (a &amp; b) &lt;&lt; 1</code>, <code>a = a ^ b</code>, repeat</td></tr>
<tr><td>Subsets / travelling salesman</td><td>Bitmask DP for n ≤ ~20</td></tr>
</table>
<p><strong>The Java-specific pitfalls to name:</strong> <code>&gt;&gt;</code> is arithmetic and preserves the sign, so <code>-8 &gt;&gt; 1</code> is <code>-4</code> while <code>-8 &gt;&gt;&gt; 1</code> is a huge positive number — use <code>&gt;&gt;&gt;</code> in hash functions. Shift counts are taken mod 32 for <code>int</code>, so <code>1 &lt;&lt; 32</code> is <code>1</code>, not <code>0</code>. And <code>1 &lt;&lt; 31</code> is <code>Integer.MIN_VALUE</code>, which is why bitmask work over 32 items needs <code>1L &lt;&lt; i</code>.</p>`
},
{
  q: "Quickselect, Floyd's cycle detection and other must-know algorithms",
  level: "advanced", tags: ["algorithms", "divide-conquer", "cycle-detection"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Goldman Sachs", "Salesforce"],
  a: `<pre><code>// QUICKSELECT — kth smallest in O(n) AVERAGE, by recursing into ONE side only
public int quickSelect(int[] a, int k) {          // k is 1-based
    int target = k - 1, lo = 0, hi = a.length - 1;
    Random rnd = new Random();

    while (lo &lt; hi) {
        int p = partition(a, lo, hi, lo + rnd.nextInt(hi - lo + 1));
        if      (p == target) return a[p];
        else if (p &lt;  target) lo = p + 1;         // discard the entire left side
        else                  hi = p - 1;
    }
    return a[lo];
}
// Why O(n): n + n/2 + n/4 + ... = 2n. Quicksort must recurse into BOTH halves,
// which is where its extra log n factor comes from.
// Worst case is O(n^2) unless the pivot is randomised — say this unprompted.</code></pre>
<pre><code>// FLOYD'S CYCLE DETECTION — works on anything with a "next" function,
// not just linked lists.
public int findDuplicate(int[] nums) {          // n+1 numbers in the range 1..n
    // Treat the array as a linked list: i -> nums[i]. A duplicate value means
    // two indices point at the same node, which is exactly a cycle entry.
    int slow = nums[0], fast = nums[0];
    do { slow = nums[slow]; fast = nums[nums[fast]]; } while (slow != fast);

    slow = nums[0];
    while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }
    return slow;                                 // O(n) time, O(1) space, input intact
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Array viewed as a functional graph with a cycle at the duplicate">
  <circle class="dg-fill" cx="60" cy="70" r="20"/><text class="dg-t" x="60" y="75" text-anchor="middle">0</text>
  <circle class="dg-fill" cx="150" cy="70" r="20"/><text class="dg-t" x="150" y="75" text-anchor="middle">3</text>
  <circle class="dg-fill2" cx="250" cy="70" r="20"/><text class="dg-t" x="250" y="75" text-anchor="middle">4</text>
  <circle class="dg-fill" cx="350" cy="34" r="20"/><text class="dg-t" x="350" y="39" text-anchor="middle">2</text>
  <circle class="dg-fill" cx="350" cy="110" r="20"/><text class="dg-t" x="350" y="115" text-anchor="middle">1</text>
  <path class="dg-line" d="M82 70 H126 M172 70 H226 M268 60 L330 40 M330 106 L270 82 M350 54 V90" marker-end="url(#qs1)"/>
  <text class="dg-s" x="250" y="112" text-anchor="middle">cycle entry</text>
  <text class="dg-s" x="430" y="60">the value that two indices both</text>
  <text class="dg-s" x="430" y="82">point at IS the duplicate</text>
  <text class="dg-s" x="16" y="142">any function from a finite set to itself must eventually cycle — that is the whole idea</text>
  <defs><marker id="qs1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Algorithm</th><th>Solves</th><th>Complexity</th></tr>
<tr><td><strong>Quickselect</strong></td><td>Kth smallest/largest, median</td><td>O(n) average, O(n²) worst</td></tr>
<tr><td><strong>Floyd's tortoise and hare</strong></td><td>Cycle in a list, array or any iterated function</td><td>O(n) / O(1)</td></tr>
<tr><td><strong>Boyer-Moore voting</strong></td><td>Majority element</td><td>O(n) / O(1)</td></tr>
<tr><td><strong>Kadane</strong></td><td>Maximum subarray sum</td><td>O(n) / O(1)</td></tr>
<tr><td><strong>Reservoir sampling</strong></td><td>K random items from an unknown-length stream</td><td>O(n) / O(k)</td></tr>
<tr><td><strong>Fisher-Yates shuffle</strong></td><td>Uniformly random permutation</td><td>O(n) / O(1)</td></tr>
<tr><td><strong>Euclid's GCD</strong></td><td>Greatest common divisor</td><td>O(log min(a,b))</td></tr>
<tr><td><strong>Fast exponentiation</strong></td><td>a<sup>b</sup> mod m</td><td>O(log b)</td></tr>
</table>
<pre><code>// FISHER-YATES — the ONLY correct in-place shuffle
public void shuffle(int[] a) {
    Random r = new Random();
    for (int i = a.length - 1; i &gt; 0; i--) {
        int j = r.nextInt(i + 1);        // 0..i INCLUSIVE — this is the whole trick
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
}
// The common broken version uses r.nextInt(a.length), which makes some
// permutations more likely than others. It looks random and is not —
// exactly the bug that biased an online poker shuffle in a famous case.

// RESERVOIR SAMPLING — one item from a stream of unknown length
T sample = null; int seen = 0;
for (T item : stream) {
    seen++;
    if (rnd.nextInt(seen) == 0) sample = item;    // keep with probability 1/seen
}

// FAST EXPONENTIATION
long power(long base, long exp, long mod) {
    long result = 1; base %= mod;
    while (exp &gt; 0) {
        if ((exp &amp; 1) == 1) result = result * base % mod;
        base = base * base % mod;
        exp &gt;&gt;= 1;
    }
    return result;
}</code></pre>
<p><strong>The Fisher-Yates detail is a real interview filter:</strong> the random index must be drawn from the <em>unshuffled</em> remainder, <code>0..i</code>. Drawing from the whole array produces n<sup>n</sup> equally likely execution paths mapped onto n! permutations — and since n<sup>n</sup> is not divisible by n!, the distribution cannot be uniform. That argument is the answer, not the code.</p>`
},
{
  q: "How do you analyse time and space complexity, including amortised cost?",
  level: "beginner", hot: true, tags: ["complexity", "fundamentals", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "TCS", "Infosys", "Wipro", "Oracle"],
  a: `<table>
<tr><th>Complexity</th><th>n = 1,000,000</th><th>Typical source</th></tr>
<tr><td>O(1)</td><td>1</td><td>Hash lookup, array index, arithmetic</td></tr>
<tr><td>O(log n)</td><td>20</td><td>Binary search, balanced tree, heap operation</td></tr>
<tr><td>O(n)</td><td>10⁶</td><td>Single pass, two pointers, sliding window</td></tr>
<tr><td>O(n log n)</td><td>2×10⁷</td><td>Sorting, divide and conquer, heap over all elements</td></tr>
<tr><td>O(n²)</td><td>10¹²</td><td>Nested loops, comparing every pair</td></tr>
<tr><td>O(2ⁿ)</td><td>hopeless past n ≈ 25</td><td>Subsets, naive recursion</td></tr>
<tr><td>O(n!)</td><td>hopeless past n ≈ 11</td><td>Permutations, brute-force TSP</td></tr>
</table>
<p><strong>Reading the constraints backwards</strong> tells you the intended solution before you start:</p>
<table>
<tr><th>n up to</th><th>Target complexity</th></tr>
<tr><td>10⁸+</td><td>O(n) or O(log n)</td></tr>
<tr><td>10⁶</td><td>O(n) or O(n log n)</td></tr>
<tr><td>10⁴</td><td>O(n²) is fine</td></tr>
<tr><td>500</td><td>O(n³)</td></tr>
<tr><td>20</td><td>O(2ⁿ) — bitmask DP or backtracking</td></tr>
<tr><td>11</td><td>O(n!) — permutations</td></tr>
</table>
<pre><code>// AMORTISED analysis — the concept most candidates get wrong.
// ArrayList.add() is O(1) AMORTISED, not O(1) worst case.
//
// Adding n elements with doubling: copies of 1 + 2 + 4 + ... + n/2 + n &lt; 2n
// Total work is O(n), so the average per add is O(1) — even though one
// individual add that triggers a resize costs O(n).
//
// "Amortised O(1)" = the total over a SEQUENCE is O(n).
// "Average O(1)"   = expected over random INPUT (HashMap lookups).
// "Worst case O(1)"= every single call, always (array indexing).
// They are three different claims. Say which one you mean.</code></pre>
<table>
<tr><th>Operation</th><th>Worst case</th><th>Amortised / average</th></tr>
<tr><td><code>ArrayList.add</code></td><td>O(n) on resize</td><td><strong>Amortised O(1)</strong></td></tr>
<tr><td><code>HashMap.get</code></td><td>O(log n) since Java 8 (treeified bucket)</td><td><strong>Average O(1)</strong></td></tr>
<tr><td><code>ArrayList.remove(0)</code></td><td>O(n) — shifts everything</td><td>O(n)</td></tr>
<tr><td><code>ArrayDeque</code> both ends</td><td>O(n) on resize</td><td>Amortised O(1)</td></tr>
<tr><td>Union-Find <code>find</code></td><td>O(log n) once</td><td>Amortised O(α(n)) ≈ O(1)</td></tr>
<tr><td>Sliding window / two pointers</td><td>—</td><td>O(n) total, despite a nested loop</td></tr>
</table>
<p><strong>Space complexity is asked and usually answered badly.</strong> Count the <em>auxiliary</em> space: recursion depth counts (O(h) for a tree, O(n) for a skewed one), the output array usually does not, and a fixed 256-element counting array is O(1) not O(n). Saying "O(1) extra space, not counting the output" is precise and shows you have thought about it.</p>
<pre><code>// The classic misreading — this is O(n), not O(n^2)
int left = 0;
for (int right = 0; right &lt; n; right++) {
    while (left &lt; right &amp;&amp; invalid()) left++;    // left NEVER resets
}
// Each pointer advances at most n times across the entire run, so total work
// is 2n. The nested loop is a red herring; count total pointer movement.</code></pre>
<p><strong>What to say in an interview:</strong> state the complexity of your first solution before you optimise, name what dominates ("the sort is O(n log n), the scan is O(n), so it is O(n log n)"), and drop constants and lower-order terms without being asked. If a bound is amortised or average rather than worst case, say so — an interviewer who has to correct you on that has learned something they did not want to.</p>`
}
]);
