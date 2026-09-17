appendTopic("algorithms", [
{
  q: "Complexity classes and the operations you use every day",
  level: "beginner", hot: true, tags: ["complexity", "must-know", "data-structures"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "TCS", "Infosys", "Oracle", "Flipkart"],
  a: `<table>
<tr><th>Class</th><th>Name</th><th>Doubling n does what?</th><th>Typical source</th></tr>
<tr><td>O(1)</td><td>Constant</td><td>Nothing</td><td>Array index, hash lookup</td></tr>
<tr><td>O(log n)</td><td>Logarithmic</td><td>Adds one step</td><td>Binary search, balanced tree</td></tr>
<tr><td>O(n)</td><td>Linear</td><td>Doubles</td><td>One pass</td></tr>
<tr><td>O(n log n)</td><td>Linearithmic</td><td>Slightly more than doubles</td><td>Sorting, divide and conquer</td></tr>
<tr><td>O(n²)</td><td>Quadratic</td><td><strong>×4</strong></td><td>Every pair</td></tr>
<tr><td>O(2ⁿ)</td><td>Exponential</td><td><strong>Squares</strong></td><td>Subsets, naive recursion</td></tr>
<tr><td>O(n!)</td><td>Factorial</td><td>Catastrophic</td><td>Permutations</td></tr>
</table>
<pre><code>// Java collection costs — know these cold, they come up constantly
ArrayList    get O(1)   add(end) O(1)*  add(mid) O(n)  contains O(n)  remove(0) O(n)
LinkedList   get O(n)   add(end) O(1)   contains O(n)  remove(node) O(1)
HashMap      get O(1)†  put O(1)†       containsKey O(1)†
TreeMap      get O(log n)  firstKey O(log n)  subMap O(log n)
HashSet      add/contains O(1)†
ArrayDeque   push/pop/peek O(1)*  both ends
PriorityQueue  peek O(1)  offer/poll O(log n)  contains O(n)  build O(n)
String       charAt O(1)  concat O(n)  substring O(n)  indexOf O(n·m)
// * amortised   † average; O(log n) worst case since Java 8 treeified buckets</code></pre>
<table>
<tr><th>Big-O notation</th><th>Means</th></tr>
<tr><td><strong>O(f)</strong></td><td>Upper bound — "grows no faster than"</td></tr>
<tr><td><strong>Ω(f)</strong></td><td>Lower bound — "grows at least as fast as"</td></tr>
<tr><td><strong>Θ(f)</strong></td><td>Tight — both bounds match</td></tr>
<tr><td colspan="2">Comparison sorting is <strong>Ω(n log n)</strong>: distinguishing n! orderings needs log₂(n!) ≈ n log n comparisons. That is a proof about <em>every possible</em> comparison sort, not a statement about one algorithm.</td></tr>
</table>
<pre><code>// Rules for simplifying
O(2n)           -> O(n)          drop constants
O(n^2 + n)      -> O(n^2)        keep the dominant term
O(n + m)        stays O(n + m)   two INDEPENDENT inputs do not merge
O(n * m)        stays            e.g. n strings of length m
O(log2 n)       -> O(log n)      the base is a constant factor

// Careful: sorting strings is O(n log n · k), not O(n log n) — each of the
// n log n comparisons costs O(k) to compare k characters. Interviewers ask
// this one specifically because the k is easy to drop.</code></pre>
<p><strong>Where asymptotics lie:</strong> O(n) with a huge constant loses to O(n log n) with a small one at real sizes. Insertion sort beats quicksort under ~30 elements, which is exactly why every production sort switches to it for small partitions. Big-O describes <em>growth</em>, not speed — and on modern hardware cache locality often matters more than the exponent.</p>`
},
{
  q: "Prefix sums, difference arrays and the two-pointer family",
  level: "advanced", hot: true, tags: ["prefix-sum", "arrays", "technique", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Goldman Sachs"],
  a: `<div class="cx"><b>O(n) preprocess</b><span>then O(1) per range query</span><b>Replaces</b><span>an O(n) scan per query</span></div>
<pre><code>// PREFIX SUM — answer "sum of a[i..j]" in O(1) after one pass
long[] pre = new long[n + 1];
for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
long rangeSum = pre[j + 1] - pre[i];        // inclusive i..j

// The +1 offset removes every "what if i == 0" special case. Always size n+1.

// SUBARRAY SUM EQUALS K — prefix sum + a hash map, O(n)
Map&lt;Long,Integer&gt; seen = new HashMap&lt;&gt;();
seen.put(0L, 1);                             // the empty prefix
long running = 0; int count = 0;
for (int x : a) {
    running += x;
    count += seen.getOrDefault(running - k, 0);   // an earlier prefix completes it
    seen.merge(running, 1, Integer::sum);
}
// Works with NEGATIVE numbers, which is exactly where sliding window fails.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Prefix sums answering a range query by subtraction">
  <text class="dg-s" x="16" y="20">a    =  3   1   4   1   5</text>
  <text class="dg-s" x="16" y="44">pre  = 0  3   4   8   9  14</text>
  <rect class="dg-fill" x="86" y="52" width="106" height="22" rx="4"/>
  <rect class="dg-fill2" x="192" y="52" width="106" height="22" rx="4"/>
  <text class="dg-s" x="16" y="96">sum(a[1..3]) = pre[4] − pre[1] = 9 − 3 = 6</text>
  <text class="dg-s" x="330" y="70">one subtraction,</text>
  <text class="dg-s" x="330" y="92">no matter how wide the range</text>
  <text class="dg-s" x="16" y="126">2D version: sum of a rectangle = a − b − c + d (inclusion–exclusion)</text>
</svg>
</figure>
<pre><code>// DIFFERENCE ARRAY — the inverse. O(1) range UPDATE, O(n) to finalise.
// "Add 5 to every element in [i..j]", thousands of times.
int[] diff = new int[n + 1];
void addRange(int i, int j, int v) { diff[i] += v; diff[j + 1] -= v; }  // O(1)
// then one prefix-sum pass reconstructs the final array:
for (int i = 1; i < n; i++) diff[i] += diff[i - 1];

// This is the answer to car-pooling, meeting-room capacity, and
// "flight bookings" — any problem that is many range updates, one final read.</code></pre>
<table>
<tr><th>Technique</th><th>Use when</th><th>Cost</th></tr>
<tr><td>Prefix sum</td><td>Many range <em>queries</em>, no updates</td><td>O(n) build, O(1) query</td></tr>
<tr><td>Difference array</td><td>Many range <em>updates</em>, one final read</td><td>O(1) update, O(n) finalise</td></tr>
<tr><td><strong>Fenwick (BIT)</strong></td><td><strong>Both</strong> queries and updates interleaved</td><td>O(log n) each</td></tr>
<tr><td>Segment tree</td><td>Both, plus min/max/gcd, or lazy range updates</td><td>O(log n) each</td></tr>
<tr><td>Sliding window</td><td>Contiguous, <strong>non-negative</strong> values</td><td>O(n)</td></tr>
<tr><td>Two pointers</td><td>Sorted input, or a monotone condition</td><td>O(n)</td></tr>
</table>
<p><strong>The decision that catches people:</strong> sliding window only works when growing the window moves the metric in one direction. Add negative numbers and "shrink until valid" is no longer sound — the answer may lie in a window you already shrank past. That is precisely when you switch to prefix sums plus a hash map.</p>`
},
{
  q: "How do you choose an algorithm when the input does not fit in memory?",
  level: "advanced", tags: ["algorithms", "scaling", "external", "design"],
  companies: ["Amazon", "Google", "Microsoft", "Flipkart", "Uber", "Goldman Sachs", "Walmart"],
  a: `<p>A favourite follow-up: "now the file is 100 GB and you have 4 GB of RAM." The answer is always one of three shapes — <strong>stream it, chunk it, or approximate it.</strong></p>
<table>
<tr><th>Problem</th><th>In memory</th><th>Out of memory</th></tr>
<tr><td>Sort</td><td><code>Arrays.sort</code></td><td><strong>External merge sort</strong> — sort chunks to disk, k-way merge with a heap</td></tr>
<tr><td>Top K</td><td>Heap of size k</td><td>Same — the heap is O(k), the data streams past</td></tr>
<tr><td>Count distinct</td><td><code>HashSet</code></td><td><strong>HyperLogLog</strong> — ~2% error in kilobytes</td></tr>
<tr><td>Membership</td><td><code>HashSet</code></td><td><strong>Bloom filter</strong> — a few bits per key, no false negatives</td></tr>
<tr><td>Find duplicates</td><td><code>HashSet</code></td><td>Hash-partition into files by <code>hash(x) % N</code>, then process each</td></tr>
<tr><td>Frequency / heavy hitters</td><td><code>HashMap</code></td><td>Count-Min Sketch</td></tr>
<tr><td>Median</td><td>Quickselect</td><td>Two heaps over a stream, or t-digest for quantiles</td></tr>
<tr><td>Join two datasets</td><td>Hash join</td><td>Sort-merge join, or partition both by the same key</td></tr>
</table>
<pre><code>// EXTERNAL MERGE SORT — the standard answer, and how databases sort
// 1. Read 1 GB at a time, sort in memory, write each run to disk -> 100 runs
// 2. K-way merge: a min-heap holding the head of each run
//    Pop the smallest, write it, pull the next from that run.
//    Memory used = one buffer per run + the heap, not the whole file.

PriorityQueue&lt;Entry&gt; heap = new PriorityQueue&lt;&gt;(comparingLong(e -> e.value));
for (Reader r : runs) heap.offer(new Entry(r.next(), r));
while (!heap.isEmpty()) {
    Entry e = heap.poll();
    out.write(e.value);
    if (e.reader.hasNext()) heap.offer(new Entry(e.reader.next(), e.reader));
}
// O(n log k) merge where k = number of runs.</code></pre>
<pre><code>// BLOOM FILTER — the trade you are making, stated precisely
// "Definitely not present" or "probably present". NO false negatives.
// ~10 bits per element gives ~1% false positives.
//
// Real use: before a disk or network lookup. A negative answer skips the
// expensive call entirely; a positive answer costs you the lookup you were
// going to make anyway. Cassandra and HBase put one in front of every SSTable
// for exactly this reason.</code></pre>
<table>
<tr><th>Ask before choosing</th></tr>
<tr><td>Is an <strong>approximate</strong> answer acceptable? That single question unlocks HyperLogLog, Bloom and Count-Min — orders of magnitude less memory.</td></tr>
<tr><td>Can it be processed as a <strong>stream</strong>, one pass, bounded state?</td></tr>
<tr><td>Can it be <strong>partitioned</strong> so each piece fits — and does the key let you partition without cross-talk?</td></tr>
<tr><td>Is it already sorted, or cheaply sortable? Sorted input makes merge-based algorithms trivial.</td></tr>
</table>
<p><strong>The framing:</strong> "In-memory algorithms optimise comparisons. Out-of-core algorithms optimise <em>passes over the data</em>, because the disk or network read dominates everything else. That is the same reason databases use B+trees rather than binary trees — identical asymptotics, completely different real cost."</p>`
}
]);
