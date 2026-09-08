appendTopic("java-collections", [
{
  q: "How does HashMap work internally, and what changed in Java 8?",
  level: "advanced", hot: true, tags: ["hashmap", "collections", "internals", "must-know"],
  companies: ["Amazon", "Oracle", "TCS", "Infosys", "SAP", "Goldman Sachs", "Flipkart", "Zoho"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 175" role="img" aria-label="HashMap bucket array with a linked list and a treeified bucket">
  <text class="dg-s" x="16" y="20">table (power of two length)</text>
  <rect class="dg-box" x="16" y="30" width="54" height="28" rx="4"/><text class="dg-s" x="43" y="49" text-anchor="middle">0</text>
  <rect class="dg-fill" x="16" y="62" width="54" height="28" rx="4"/><text class="dg-s" x="43" y="81" text-anchor="middle">1</text>
  <rect class="dg-box" x="16" y="94" width="54" height="28" rx="4"/><text class="dg-s" x="43" y="113" text-anchor="middle">2</text>
  <rect class="dg-fill2" x="16" y="126" width="54" height="28" rx="4"/><text class="dg-s" x="43" y="145" text-anchor="middle">3</text>
  <path class="dg-line" d="M74 76 H108" marker-end="url(#hm1)"/>
  <rect class="dg-fill" x="112" y="62" width="70" height="28" rx="4"/><text class="dg-s" x="147" y="81" text-anchor="middle">node</text>
  <path class="dg-line" d="M186 76 H210" marker-end="url(#hm1)"/>
  <rect class="dg-fill" x="214" y="62" width="70" height="28" rx="4"/><text class="dg-s" x="249" y="81" text-anchor="middle">node</text>
  <text class="dg-s" x="310" y="81">linked list — under 8 entries</text>
  <path class="dg-line" d="M74 140 H108" marker-end="url(#hm1)"/>
  <circle class="dg-fill2" cx="140" cy="140" r="14"/><circle class="dg-fill2" cx="184" cy="140" r="14"/><circle class="dg-fill2" cx="228" cy="140" r="14"/>
  <path class="dg-line" d="M154 140 H170 M198 140 H214"/>
  <text class="dg-s" x="310" y="145">red-black TREE — 8+ entries, O(log n)</text>
  <defs><marker id="hm1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// The lookup, step by step
// 1. h = key.hashCode()
// 2. SPREAD: h ^ (h >>> 16)  — mixes the high bits into the low ones, because
//    step 3 only looks at the low bits and many hashCodes differ only up high
// 3. index = (n - 1) &amp; h     — works only because n is a POWER OF TWO;
//                              it is a cheap replacement for h % n
// 4. Walk the bucket: compare hash first, then ==, then equals()</code></pre>
<table>
<tr><th>Java 7</th><th>Java 8+</th></tr>
<tr><td>Bucket is always a linked list</td><td>Converts to a <strong>red-black tree</strong> at 8 entries (and back to a list below 6)</td></tr>
<tr><td>Worst case O(n) per bucket</td><td>Worst case <strong>O(log n)</strong></td></tr>
<tr><td>Resize inserts at the head — could form a <strong>cycle</strong> under concurrency and hang a CPU at 100%</td><td>Resize preserves order, so the infinite loop is gone (it is still not thread-safe)</td></tr>
<tr><td>—</td><td>Treeify only if the table is at least 64 long; otherwise it resizes instead</td></tr>
</table>
<pre><code>// Resizing: default capacity 16, load factor 0.75 -> resize at 12 entries.
// Every resize DOUBLES the table and rehashes everything. Pre-size when you know:
Map&lt;String, User&gt; m = new HashMap&lt;&gt;(expectedSize / 0.75f + 1);

// Why the load factor is 0.75: it is the empirical balance between wasted
// space (lower) and collision chains (higher).</code></pre>
<p><strong>The treeification detail worth knowing:</strong> it exists to defend against <strong>hash-collision denial of service</strong> — an attacker submitting thousands of strings that hash to the same bucket used to turn a map lookup into a linear scan and stall the server. Treeified buckets cap the damage at O(log n). It also requires keys to be <code>Comparable</code> for a proper tree ordering, otherwise it falls back to comparing class names and identity hashes.</p>
<table>
<tr><th>Map</th><th>Ordering</th><th>Null key</th><th>Thread-safe</th><th>Get</th></tr>
<tr><td><code>HashMap</code></td><td>None</td><td>One allowed</td><td>No</td><td>O(1) average</td></tr>
<tr><td><code>LinkedHashMap</code></td><td>Insertion (or access)</td><td>Yes</td><td>No</td><td>O(1)</td></tr>
<tr><td><code>TreeMap</code></td><td>Sorted</td><td><strong>No</strong></td><td>No</td><td>O(log n)</td></tr>
<tr><td><code>ConcurrentHashMap</code></td><td>None</td><td><strong>No</strong></td><td><strong>Yes</strong></td><td>O(1)</td></tr>
<tr><td><code>Hashtable</code></td><td>None</td><td>No</td><td>Yes (fully synchronised)</td><td>O(1)</td></tr>
</table>
<p><strong>The point to close on:</strong> "The invariant that makes all of this work is that keys must be <strong>immutable</strong>, or at least that the fields used in <code>hashCode</code> never change after insertion. Mutate one and the entry is stranded in its old bucket — present in the map, unreachable by lookup, and not garbage collected."</p>`
},
{
  q: "ArrayList vs LinkedList — and why is LinkedList almost never the right answer?",
  level: "beginner", hot: true, tags: ["list", "collections", "performance"],
  companies: ["TCS", "Infosys", "Amazon", "Wipro", "Oracle", "Cognizant", "Accenture", "SAP"],
  a: `<table>
<tr><th>Operation</th><th>ArrayList</th><th>LinkedList</th><th>Reality</th></tr>
<tr><td><code>get(i)</code></td><td><strong>O(1)</strong></td><td>O(n)</td><td>ArrayList wins decisively</td></tr>
<tr><td><code>add(e)</code> at the end</td><td>Amortised O(1)</td><td>O(1)</td><td>ArrayList still faster in practice</td></tr>
<tr><td><code>add(0, e)</code></td><td>O(n)</td><td>O(1)</td><td>LinkedList's only real theoretical win</td></tr>
<tr><td><code>remove</code> during iteration</td><td>O(n)</td><td>O(1) via <code>ListIterator</code></td><td>Rarely the bottleneck</td></tr>
<tr><td>Memory per element</td><td>~4–8 bytes (the slot)</td><td><strong>~40 bytes</strong> (node + 2 pointers + header)</td><td>ArrayList wins by a lot</td></tr>
<tr><td>Cache locality</td><td><strong>Excellent</strong> — contiguous</td><td>Terrible — pointer chasing</td><td>The decisive factor on modern CPUs</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Contiguous array memory versus scattered linked list nodes">
  <text class="dg-s" x="16" y="20">ArrayList — one contiguous block, prefetcher-friendly</text>
  <rect class="dg-fill" x="16" y="28" width="40" height="26" rx="3"/><rect class="dg-fill" x="58" y="28" width="40" height="26" rx="3"/>
  <rect class="dg-fill" x="100" y="28" width="40" height="26" rx="3"/><rect class="dg-fill" x="142" y="28" width="40" height="26" rx="3"/>
  <rect class="dg-fill" x="184" y="28" width="40" height="26" rx="3"/><rect class="dg-fill" x="226" y="28" width="40" height="26" rx="3"/>
  <text class="dg-s" x="300" y="46">one cache line fetches several elements</text>
  <text class="dg-s" x="16" y="86">LinkedList — nodes scattered across the heap</text>
  <rect class="dg-fill2" x="16" y="94" width="40" height="26" rx="3"/>
  <rect class="dg-fill2" x="140" y="94" width="40" height="26" rx="3"/>
  <rect class="dg-fill2" x="252" y="94" width="40" height="26" rx="3"/>
  <rect class="dg-fill2" x="96" y="94" width="40" height="26" rx="3"/>
  <path class="dg-line" d="M58 107 H94 M138 107 H94 M182 107 H250" stroke-dasharray="3 3"/>
  <text class="dg-s" x="330" y="112">every step is a potential cache miss</text>
  <text class="dg-s" x="16" y="144">the theoretical O(1) insert is usually beaten by the O(n) traversal to reach the position</text>
</svg>
</figure>
<pre><code>// The trap: LinkedList's O(1) insert requires you to ALREADY be at the position
list.add(500, item);      // O(n) — it must walk 500 nodes first, THEN insert in O(1)
// So it is only O(1) when using a ListIterator you already hold.

// The measured reality: ArrayList.add(0, x) copies memory with System.arraycopy,
// an intrinsic that moves megabytes per millisecond. LinkedList allocates a node,
// updates two pointers, and adds GC pressure. For lists under a few thousand
// elements, ArrayList usually wins even at the front.</code></pre>
<table>
<tr><th>Need</th><th>Use</th></tr>
<tr><td>Almost anything</td><td><code>ArrayList</code></td></tr>
<tr><td>Queue or deque</td><td><code>ArrayDeque</code> — faster than <code>LinkedList</code> for both</td></tr>
<tr><td>Fixed size, never changes</td><td><code>List.of(...)</code> — immutable and compact</td></tr>
<tr><td>Heavy concurrent reads, rare writes</td><td><code>CopyOnWriteArrayList</code></td></tr>
<tr><td>Producer/consumer handoff</td><td><code>LinkedBlockingQueue</code> / <code>ArrayBlockingQueue</code></td></tr>
</table>
<pre><code>// Sizing and the resize cost
List&lt;String&gt; l = new ArrayList&lt;&gt;(10_000);   // avoids ~10 array copies
// Growth is 1.5x in ArrayList (oldCapacity + oldCapacity &gt;&gt; 1), not 2x.

// The removal gotcha everyone hits once
List&lt;Integer&gt; nums = new ArrayList&lt;&gt;(List.of(1, 2, 3));
nums.remove(1);              // removes the ELEMENT AT INDEX 1 -> the value 2
nums.remove(Integer.valueOf(1));   // removes the VALUE 1
// remove(int) and remove(Object) are different overloads. With a List&lt;Integer&gt;
// this is a genuine and very common bug.</code></pre>
<p><strong>The honest answer to give:</strong> "I use <code>ArrayList</code> unless I have measured a reason not to. <code>LinkedList</code> is the textbook answer for front insertion, but its memory overhead and cache behaviour make it slower in practice for almost every realistic size. If I need a deque I use <code>ArrayDeque</code>, which beats <code>LinkedList</code> at both ends."</p>`
},
{
  q: "What is fail-fast versus fail-safe iteration, and how do you remove safely?",
  level: "advanced", hot: true, tags: ["iterator", "collections", "gotcha", "concurrency"],
  companies: ["Amazon", "Oracle", "TCS", "Infosys", "SAP", "Cognizant", "Optum", "Wipro"],
  a: `<pre><code>// FAIL-FAST — throws ConcurrentModificationException
List&lt;String&gt; list = new ArrayList&lt;&gt;(List.of("a", "b", "c"));
for (String s : list) {
    if (s.equals("b")) list.remove(s);      // CME on the NEXT iteration
}

// How it detects: every structural change increments modCount. The iterator
// snapshots it as expectedModCount and compares on every next().
// It is a BEST-EFFORT bug detector, not a guarantee — never write logic
// that depends on catching CME.</code></pre>
<pre><code>// ✔ Four correct ways to remove while iterating
// 1. Iterator.remove() — the classic
Iterator&lt;String&gt; it = list.iterator();
while (it.hasNext()) { if (it.next().equals("b")) it.remove(); }

// 2. removeIf — the modern one-liner, and usually the fastest
list.removeIf(s -&gt; s.equals("b"));

// 3. Collect into a new list — no mutation at all
List&lt;String&gt; kept = list.stream().filter(s -&gt; !s.equals("b")).toList();

// 4. Iterate a copy, mutate the original
for (String s : new ArrayList&lt;&gt;(list)) { if (cond(s)) list.remove(s); }</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Fail fast modCount check versus fail safe snapshot iteration">
  <text class="dg-t" x="16" y="22">fail-fast</text>
  <rect class="dg-fill" x="16" y="32" width="150" height="34" rx="6"/><text class="dg-s" x="91" y="54" text-anchor="middle">ArrayList  modCount 3</text>
  <path class="dg-line" d="M170 49 H228" marker-end="url(#fs1)"/>
  <rect class="dg-box" x="232" y="32" width="150" height="34" rx="6"/><text class="dg-s" x="307" y="54" text-anchor="middle">iterator expects 3</text>
  <text class="dg-s" x="396" y="54">mismatch → CME</text>
  <text class="dg-t" x="16" y="98">fail-safe</text>
  <rect class="dg-fill2" x="16" y="108" width="150" height="34" rx="6"/><text class="dg-s" x="91" y="130" text-anchor="middle">CopyOnWriteArrayList</text>
  <path class="dg-line" d="M170 125 H228" marker-end="url(#fs1)"/>
  <rect class="dg-box" x="232" y="108" width="150" height="34" rx="6"/><text class="dg-s" x="307" y="130" text-anchor="middle">iterates a SNAPSHOT</text>
  <text class="dg-s" x="396" y="130">never throws; may be stale</text>
  <defs><marker id="fs1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th></th><th>Fail-fast</th><th>Fail-safe (weakly consistent)</th></tr>
<tr><td>Collections</td><td><code>ArrayList</code>, <code>HashMap</code>, <code>HashSet</code>, <code>TreeMap</code></td><td><code>ConcurrentHashMap</code>, <code>CopyOnWriteArrayList</code>, <code>ConcurrentLinkedQueue</code></td></tr>
<tr><td>On concurrent modification</td><td>Throws <code>ConcurrentModificationException</code></td><td>Continues</td></tr>
<tr><td>Sees changes made during iteration</td><td>n/a</td><td>May or may not — no guarantee either way</td></tr>
<tr><td>Memory</td><td>No copy</td><td>Copy-on-write duplicates the whole array on every write</td></tr>
<tr><td>Use for</td><td>Single-threaded code — the exception is a useful bug report</td><td>Concurrent readers with rare writes</td></tr>
</table>
<pre><code>// The subtlety that surprises people: CME is not only about threads.
// Single-threaded code triggers it too, as in the first example — which is
// the whole point. It catches a real logic bug immediately.

// And one case where the for-each seems to "work" and is still wrong:
List&lt;String&gt; l = new ArrayList&lt;&gt;(List.of("a", "b"));
for (String s : l) { if (s.equals("a")) l.remove(s); }
// No exception! Removing the SECOND-TO-LAST element makes cursor == size,
// so hasNext() returns false and the loop exits early — silently skipping "b".
// A missing exception here is worse than a thrown one.</code></pre>
<p><strong>The answer to give:</strong> "In single-threaded code I use <code>removeIf</code> — it is one line, it cannot throw CME, and for an <code>ArrayList</code> it compacts in a single pass instead of shifting on every removal. In concurrent code I use a concurrent collection and accept weakly consistent iteration, because the alternative is locking the whole collection for the duration of the loop."</p>`
},
{
  q: "Comparable vs Comparator, and how do you sort by multiple fields?",
  level: "beginner", hot: true, tags: ["sorting", "collections", "lambda"],
  companies: ["TCS", "Infosys", "Amazon", "Wipro", "Oracle", "Cognizant", "Accenture", "Zoho"],
  a: `<table>
<tr><th></th><th><code>Comparable</code></th><th><code>Comparator</code></th></tr>
<tr><td>Package</td><td><code>java.lang</code></td><td><code>java.util</code></td></tr>
<tr><td>Method</td><td><code>compareTo(T other)</code></td><td><code>compare(T a, T b)</code></td></tr>
<tr><td>Where it lives</td><td>Inside the class</td><td>Outside — any number of them</td></tr>
<tr><td>Meaning</td><td>The <strong>natural</strong> ordering</td><td>An <em>alternative</em> ordering</td></tr>
<tr><td>Use when</td><td>There is one obvious order, and you own the class</td><td>Multiple orders, or the class is not yours</td></tr>
</table>
<pre><code>// Comparable — the natural order, baked into the type
record Employee(String name, String dept, int salary, LocalDate joined)
        implements Comparable&lt;Employee&gt; {
    @Override public int compareTo(Employee o) {
        return name.compareTo(o.name);        // natural order = by name
    }
}
Collections.sort(employees);                  // uses compareTo

// Comparator — chained, readable, and the form interviewers want to see
employees.sort(
    Comparator.comparing(Employee::dept)                  // department ascending
              .thenComparing(Employee::salary,
                             Comparator.reverseOrder())   // then salary DESCENDING
              .thenComparing(Employee::name)              // then name, as a tie-break
);

// Null-safe
Comparator&lt;Employee&gt; byDept =
    Comparator.comparing(Employee::dept, Comparator.nullsLast(Comparator.naturalOrder()));

// Primitive specialisations avoid boxing on every comparison
employees.sort(Comparator.comparingInt(Employee::salary));</code></pre>
<pre><code>// ✗ The bug that breaks sorting for large collections
Comparator&lt;Employee&gt; bad = (a, b) -&gt; a.salary() - b.salary();
// Integer overflow: salary 2_000_000_000 minus -2_000_000_000 wraps NEGATIVE.
// TimSort detects the resulting inconsistency and throws
// "Comparison method violates its general contract!" — usually only in
// production, only on large inputs, and it is very hard to reproduce.

// ✔ Always
Comparator&lt;Employee&gt; good = Comparator.comparingInt(Employee::salary);
// or Integer.compare(a.salary(), b.salary())</code></pre>
<table>
<tr><th>Contract rule</th><th>Meaning</th></tr>
<tr><td>Antisymmetry</td><td><code>sgn(compare(a,b)) == -sgn(compare(b,a))</code></td></tr>
<tr><td>Transitivity</td><td>If a &gt; b and b &gt; c then a &gt; c</td></tr>
<tr><td>Consistency</td><td>Equal elements compare equally against everything else</td></tr>
<tr><td>Recommended</td><td><code>compareTo</code> should be <strong>consistent with <code>equals</code></strong> — otherwise a <code>TreeSet</code> and a <code>HashSet</code> disagree about duplicates</td></tr>
</table>
<pre><code>// The equals-consistency trap, made concrete
record Money(String currency, long amount) implements Comparable&lt;Money&gt; {
    public int compareTo(Money o) { return Long.compare(amount, o.amount); }  // ignores currency
}
Set&lt;Money&gt; hash = new HashSet&lt;&gt;(); Set&lt;Money&gt; tree = new TreeSet&lt;&gt;();
// USD 100 and EUR 100: HashSet keeps both (equals differs),
// TreeSet keeps ONE (compareTo says they are equal). Same data, different size.</code></pre>
<p><strong>Two things to mention unprompted:</strong> <code>Collections.sort</code> and <code>List.sort</code> use TimSort, which is <strong>stable</strong> — so chained sorts compose correctly and <code>thenComparing</code> is not always necessary if you sort twice. And <code>Comparator.comparing</code> takes a key extractor, so it is far less error-prone than writing the subtraction by hand.</p>`
}
]);
