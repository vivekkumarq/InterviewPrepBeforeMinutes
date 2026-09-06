registerTopic("java-collections", [
{
  q: "Draw the Java Collections hierarchy",
  level: "beginner", hot: true, tags: ["collections"],
  a: `<figure class="fig">
<svg viewBox="0 0 660 250" role="img" aria-label="Java collections hierarchy">
  <rect class="dg-fill" x="150" y="6" width="130" height="30" rx="7"/><text class="dg-t" x="215" y="26" text-anchor="middle">Iterable</text>
  <rect class="dg-fill" x="440" y="6" width="130" height="30" rx="7"/><text class="dg-t" x="505" y="26" text-anchor="middle">Map</text>
  <path class="dg-line" d="M215 36 V52"/>
  <rect class="dg-fill2" x="150" y="52" width="130" height="30" rx="7"/><text class="dg-t" x="215" y="72" text-anchor="middle">Collection</text>
  <path class="dg-line" d="M215 82 V96 M60 96 H370 M60 96 V112 M215 96 V112 M370 96 V112"/>
  <rect class="dg-box" x="10" y="112" width="100" height="28" rx="6"/><text class="dg-t" x="60" y="131" text-anchor="middle">List</text>
  <rect class="dg-box" x="165" y="112" width="100" height="28" rx="6"/><text class="dg-t" x="215" y="131" text-anchor="middle">Set</text>
  <rect class="dg-box" x="320" y="112" width="100" height="28" rx="6"/><text class="dg-t" x="370" y="131" text-anchor="middle">Queue</text>
  <text class="dg-s" x="60" y="162" text-anchor="middle">ArrayList</text>
  <text class="dg-s" x="60" y="178" text-anchor="middle">LinkedList</text>
  <text class="dg-s" x="60" y="194" text-anchor="middle">Vector / Stack</text>
  <text class="dg-s" x="60" y="210" text-anchor="middle">CopyOnWriteArrayList</text>
  <text class="dg-s" x="215" y="162" text-anchor="middle">HashSet</text>
  <text class="dg-s" x="215" y="178" text-anchor="middle">LinkedHashSet</text>
  <text class="dg-s" x="215" y="194" text-anchor="middle">TreeSet</text>
  <text class="dg-s" x="370" y="162" text-anchor="middle">ArrayDeque</text>
  <text class="dg-s" x="370" y="178" text-anchor="middle">PriorityQueue</text>
  <text class="dg-s" x="370" y="194" text-anchor="middle">LinkedBlockingQueue</text>
  <path class="dg-line" d="M505 36 V52"/>
  <text class="dg-s" x="505" y="70" text-anchor="middle">HashMap</text>
  <text class="dg-s" x="505" y="86" text-anchor="middle">LinkedHashMap</text>
  <text class="dg-s" x="505" y="102" text-anchor="middle">TreeMap (SortedMap)</text>
  <text class="dg-s" x="505" y="118" text-anchor="middle">Hashtable</text>
  <text class="dg-s" x="505" y="134" text-anchor="middle">ConcurrentHashMap</text>
  <text class="dg-s" x="505" y="150" text-anchor="middle">EnumMap / WeakHashMap</text>
</svg>
<figcaption>Map is deliberately NOT a Collection — it stores pairs, not elements.</figcaption>
</figure>
<p>Key point to state out loud: <strong><code>Map</code> does not extend <code>Collection</code></strong>, because a Map holds key-value pairs rather than single elements. It exposes collection <em>views</em> instead: <code>keySet()</code>, <code>values()</code>, <code>entrySet()</code>.</p>`
},
{
  q: "ArrayList vs LinkedList — when is LinkedList actually better?",
  level: "beginner", hot: true, tags: ["list"],
  a: `<table>
<tr><th>Operation</th><th>ArrayList</th><th>LinkedList</th></tr>
<tr><td><code>get(i)</code></td><td>O(1)</td><td>O(n)</td></tr>
<tr><td><code>add()</code> at end</td><td>O(1) amortised</td><td>O(1)</td></tr>
<tr><td><code>add(0, x)</code> / remove first</td><td>O(n)</td><td>O(1)</td></tr>
<tr><td>Memory per element</td><td>Just the reference</td><td>Node object + 2 pointers (~3× overhead)</td></tr>
<tr><td>Cache locality</td><td>Excellent (contiguous)</td><td>Poor (pointer chasing)</td></tr>
</table>
<p><strong>Honest answer:</strong> almost never. Even for head insertions, <code>ArrayDeque</code> beats <code>LinkedList</code> because of cache locality and no per-node allocation. <code>LinkedList</code>'s only genuine niche is when you already hold a <code>ListIterator</code> at the position and are doing many insertions/removals there — and even then, measure.</p>
<p>Growth detail worth knowing: <code>ArrayList</code> grows by <strong>1.5×</strong> (<code>oldCapacity + (oldCapacity &gt;&gt; 1)</code>), copying via <code>Arrays.copyOf</code>. Pre-size with <code>new ArrayList&lt;&gt;(expectedSize)</code> when you know the count.</p>`
},
{
  q: "How does HashMap work internally?",
  level: "beginner", hot: true, tags: ["hashmap", "internals"],
  a: `<p>A <code>HashMap</code> is an array of buckets; each bucket holds a linked list (or, from Java 8, a red-black tree).</p>
<ol>
<li><code>hash(key)</code> = <code>h = key.hashCode(); h ^ (h &gt;&gt;&gt; 16)</code> — the XOR spreads high bits down, because the index only uses the low bits.</li>
<li><code>index = hash &amp; (n - 1)</code> — a bitmask instead of modulo, which is why capacity is always a power of two.</li>
<li>If the bucket is empty, store the node. If occupied, walk the chain comparing <code>hash</code> first, then <code>equals()</code>. Match → replace value; no match → append.</li>
<li>When a chain reaches <strong>8</strong> nodes <em>and</em> the table is at least <strong>64</strong> buckets, it converts to a red-black tree, making worst-case lookup O(log n) instead of O(n). It untreeifies below 6.</li>
<li>When <code>size &gt; capacity × loadFactor</code> (default 0.75), the table <strong>resizes to 2×</strong> and rehashes. Java 8 splits each bucket into a "lo" and "hi" list without recomputing hashes.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 190" role="img" aria-label="HashMap bucket array with chaining and treeify">
  <text class="dg-s" x="46" y="16" text-anchor="middle">buckets</text>
  <rect class="dg-box" x="10" y="24" width="72" height="26" rx="5"/><text class="dg-m" x="46" y="42" text-anchor="middle">[0]</text>
  <rect class="dg-box" x="10" y="54" width="72" height="26" rx="5"/><text class="dg-m" x="46" y="72" text-anchor="middle">[1]</text>
  <rect class="dg-box" x="10" y="84" width="72" height="26" rx="5"/><text class="dg-m" x="46" y="102" text-anchor="middle">[2]</text>
  <rect class="dg-box" x="10" y="114" width="72" height="26" rx="5"/><text class="dg-m" x="46" y="132" text-anchor="middle">[3]</text>
  <text class="dg-s" x="46" y="158" text-anchor="middle">n = 2^k</text>
  <path class="dg-line" d="M84 67 H120" marker-end="url(#h1)"/>
  <rect class="dg-fill" x="124" y="54" width="86" height="26" rx="5"/><text class="dg-s" x="167" y="72" text-anchor="middle">k1 → v1</text>
  <path class="dg-line" d="M212 67 H240" marker-end="url(#h1)"/>
  <rect class="dg-fill" x="244" y="54" width="86" height="26" rx="5"/><text class="dg-s" x="287" y="72" text-anchor="middle">k9 → v9</text>
  <text class="dg-s" x="420" y="72">collision chain (≤ 8 nodes)</text>
  <path class="dg-line" d="M84 127 H120" marker-end="url(#h1)"/>
  <rect class="dg-fill2" x="124" y="112" width="206" height="30" rx="5"/>
  <text class="dg-s" x="227" y="131" text-anchor="middle">red-black tree — after 8 collisions</text>
  <text class="dg-s" x="420" y="131">lookup degrades to O(log n), not O(n)</text>
  <defs><marker id="h1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Bucket array → chain → tree, the three states of a HashMap bucket.</figcaption>
</figure>`
},
{
  q: "What happens if two keys have the same hashCode? And if hashCode is broken?",
  level: "beginner", hot: true, tags: ["hashmap", "gotcha"],
  a: `<p><strong>Same hashCode is legal</strong> — it is a collision. Both entries land in the same bucket and are distinguished with <code>equals()</code>. Retrieval still returns the right value; it is just slower.</p>
<p><strong>If <code>hashCode()</code> always returns a constant</strong> (say <code>return 1;</code>), the map still works correctly but degenerates into a single bucket — O(n) lookups, or O(log n) once treeified. Correct, but useless as a hash map.</p>
<p><strong>If you mutate a key after inserting it</strong>, its hash changes, the map looks in a different bucket, and the entry becomes unreachable — a genuine memory leak:</p>
<pre><code>var key = new ArrayList&lt;String&gt;(List.of("a"));
Map&lt;List&lt;String&gt;, String&gt; map = new HashMap&lt;&gt;();
map.put(key, "value");
key.add("b");                    // hashCode changed!
System.out.println(map.get(key));  // null — but it IS in the map
System.out.println(map.size());    // 1</code></pre>
<p><strong>Rule:</strong> hash map keys must be immutable, or at least never mutated in the fields used by <code>hashCode</code>/<code>equals</code>. That is why <code>String</code>, boxed primitives and records make good keys.</p>`
},
{
  q: "HashMap vs Hashtable vs ConcurrentHashMap",
  level: "beginner", hot: true, tags: ["hashmap", "concurrency"],
  a: `<table>
<tr><th></th><th>HashMap</th><th>Hashtable</th><th>ConcurrentHashMap</th></tr>
<tr><td>Thread-safe</td><td>No</td><td>Yes — whole-map <code>synchronized</code></td><td>Yes — fine-grained</td></tr>
<tr><td>Null key/value</td><td>1 null key, many null values</td><td>Neither</td><td>Neither</td></tr>
<tr><td>Locking</td><td>—</td><td>One lock for everything</td><td>CAS + per-bucket <code>synchronized</code> (Java 8+; segments before that)</td></tr>
<tr><td>Iterator</td><td>Fail-fast</td><td>Fail-fast (Enumeration is not)</td><td>Weakly consistent — never throws CME</td></tr>
<tr><td>Performance under contention</td><td>N/A</td><td>Poor</td><td>Excellent</td></tr>
<tr><td>Status</td><td>Standard choice</td><td>Legacy since 1.2</td><td>The concurrent choice</td></tr>
</table>
<p><strong>Why does ConcurrentHashMap forbid nulls?</strong> Because <code>map.get(k) == null</code> would be ambiguous — absent, or present-with-null? In a single-threaded map you can disambiguate with <code>containsKey</code>; in a concurrent map another thread could change the answer between the two calls. Use <code>Optional</code> or a sentinel value.</p>
<p><code>Collections.synchronizedMap()</code> is a third option — a wrapper with one lock, so it behaves like Hashtable and should not be your default.</p>`
},
{
  q: "HashSet vs LinkedHashSet vs TreeSet",
  level: "beginner", hot: true, tags: ["set"],
  a: `<table>
<tr><th></th><th>HashSet</th><th>LinkedHashSet</th><th>TreeSet</th></tr>
<tr><td>Ordering</td><td>None (unpredictable)</td><td>Insertion order</td><td>Sorted (natural or Comparator)</td></tr>
<tr><td>add/remove/contains</td><td>O(1)</td><td>O(1)</td><td>O(log n)</td></tr>
<tr><td>Backed by</td><td>HashMap</td><td>LinkedHashMap</td><td>TreeMap (red-black tree)</td></tr>
<tr><td>Nulls</td><td>One allowed</td><td>One allowed</td><td>Not allowed (needs comparison)</td></tr>
<tr><td>Extra API</td><td>—</td><td>—</td><td><code>first()</code>, <code>last()</code>, <code>headSet</code>, <code>ceiling</code>, <code>floor</code></td></tr>
</table>
<p>Every <code>HashSet</code> is literally a <code>HashMap</code> with a shared dummy <code>PRESENT</code> object as the value — worth saying, it shows you have read the source.</p>
<p>Choose <code>TreeSet</code> only when you need ordering or range queries; the O(log n) and the comparison cost are not free.</p>`
},
{
  q: "Fail-fast vs fail-safe iterators — what is ConcurrentModificationException?",
  level: "beginner", hot: true, tags: ["iterator", "gotcha"],
  a: `<p><strong>Fail-fast</strong> iterators (<code>ArrayList</code>, <code>HashMap</code>, <code>HashSet</code>) track a <code>modCount</code>. If the collection is structurally modified during iteration by anything other than the iterator itself, the next <code>next()</code> throws <code>ConcurrentModificationException</code>. It is a best-effort bug detector, not a guarantee.</p>
<pre><code>// Throws CME
for (String s : list) if (s.startsWith("x")) list.remove(s);

// Correct options
list.removeIf(s -&gt; s.startsWith("x"));                  // best, Java 8+

Iterator&lt;String&gt; it = list.iterator();                  // classic
while (it.hasNext()) if (it.next().startsWith("x")) it.remove();</code></pre>
<p><strong>Fail-safe</strong> (more accurately <em>weakly consistent</em>) iterators — <code>ConcurrentHashMap</code>, <code>CopyOnWriteArrayList</code> — iterate over a snapshot or tolerate concurrent change, never throw CME, but may not reflect the very latest state.</p>
<blockquote><p><strong>Trick question:</strong> removing the second-to-last element in a for-each on an <code>ArrayList</code> does <em>not</em> throw — <code>hasNext()</code> returns false early and the loop exits silently. Proof that fail-fast is best-effort.</p></blockquote>`
},
{
  q: "Comparable vs Comparator",
  level: "beginner", hot: true, tags: ["sorting"],
  a: `<table>
<tr><th></th><th>Comparable</th><th>Comparator</th></tr>
<tr><td>Package</td><td><code>java.lang</code></td><td><code>java.util</code></td></tr>
<tr><td>Method</td><td><code>compareTo(T o)</code></td><td><code>compare(T a, T b)</code></td></tr>
<tr><td>Where</td><td>Inside the class being sorted</td><td>External — any number of them</td></tr>
<tr><td>Meaning</td><td>The one <em>natural</em> ordering</td><td>Any alternative ordering</td></tr>
</table>
<pre><code>// Natural order lives with the class
record Employee(String name, BigDecimal salary, LocalDate joined)
        implements Comparable&lt;Employee&gt; {
    public int compareTo(Employee o) { return name.compareTo(o.name); }
}

// Alternative orderings, composed fluently
var bySalaryDescThenName = Comparator
        .comparing(Employee::salary).reversed()
        .thenComparing(Employee::name);

list.sort(bySalaryDescThenName);
list.sort(Comparator.comparing(Employee::joined, Comparator.nullsLast(naturalOrder())));</code></pre>
<p>Both must be consistent with <code>equals()</code> if the objects go into a <code>TreeSet</code>/<code>TreeMap</code> — otherwise the set will treat "equal by comparator" objects as duplicates and drop them.</p>`
},
{
  q: "What is the load factor and initial capacity? How do you size a HashMap correctly?",
  level: "advanced", tags: ["hashmap", "performance"],
  a: `<ul>
<li><strong>Initial capacity</strong> — number of buckets, always rounded up to a power of two (default 16).</li>
<li><strong>Load factor</strong> — how full the table gets before resizing (default 0.75). It is the classic time/space trade-off: lower means fewer collisions but more wasted memory; higher means denser tables and longer chains.</li>
<li><strong>Threshold</strong> = capacity × loadFactor. Crossing it triggers a resize to 2× and a rehash of every entry — an O(n) pause.</li>
</ul>
<p>To hold <em>n</em> entries without a single resize:</p>
<pre><code>int capacity = (int) (expectedSize / 0.75f) + 1;
Map&lt;String,User&gt; map = new HashMap&lt;&gt;(capacity);

// Java 19+ does the arithmetic for you:
Map&lt;String,User&gt; map = HashMap.newHashMap(expectedSize);</code></pre>
<p>Why 0.75? It is the point where, under a uniform hash, the expected number of entries per bucket follows a Poisson distribution making a chain of 8 vanishingly unlikely (~6×10⁻⁸) — which is exactly why the treeify threshold is 8.</p>`
},
{
  q: "How does ConcurrentHashMap achieve thread safety without locking the whole map?",
  level: "advanced", hot: true, tags: ["concurrency", "internals"],
  a: `<p><strong>Java 7</strong> used <em>segment locking</em>: the map was split into 16 segments, each with its own <code>ReentrantLock</code>, so up to 16 writers could proceed concurrently.</p>
<p><strong>Java 8 rewrote it entirely</strong>, dropping segments:</p>
<ul>
<li><strong>Reads are lock-free.</strong> The table is <code>volatile Node[]</code> and node values/next pointers are volatile, so readers see a consistent view with no locking at all.</li>
<li><strong>Writing to an empty bucket</strong> uses a <code>CAS</code> (compare-and-swap) — no lock.</li>
<li><strong>Writing to an occupied bucket</strong> synchronises on the <em>first node of that bucket only</em>. Lock granularity is now one bucket instead of one segment.</li>
<li><strong>Resizing is cooperative</strong> — multiple threads help transfer buckets, each claiming a range, so a resize does not stall all writers.</li>
<li><strong><code>size()</code></strong> uses a striped counter (<code>LongAdder</code>-style <code>CounterCell</code>s) to avoid a single contended counter, which is why it is an estimate.</li>
</ul>
<p>Atomic composite operations you should name: <code>putIfAbsent</code>, <code>computeIfAbsent</code>, <code>compute</code>, <code>merge</code>. Using them is the difference between a correct and a racy counter:</p>
<pre><code>// RACY — check-then-act
if (!map.containsKey(k)) map.put(k, expensive());

// CORRECT — atomic
map.computeIfAbsent(k, key -&gt; expensive());
map.merge(word, 1, Integer::sum);   // atomic word count</code></pre>
<blockquote><p><strong>Caution:</strong> the mapping function in <code>computeIfAbsent</code> runs while holding the bucket lock. Do not perform I/O, call another map operation, or block inside it — that is a real production deadlock.</p></blockquote>`
},
{
  q: "What is CopyOnWriteArrayList and when is it the right choice?",
  level: "advanced", tags: ["concurrency", "list"],
  a: `<p>Every mutation copies the entire backing array under a lock and swaps in the new one; readers work on the old immutable array with no synchronisation at all.</p>
<ul>
<li><strong>Reads:</strong> completely lock-free and fast.</li>
<li><strong>Writes:</strong> O(n) copy — brutal if frequent.</li>
<li><strong>Iterators:</strong> snapshot of the array at creation time. Never throw <code>ConcurrentModificationException</code>, never reflect later writes, and <code>iterator.remove()</code> is unsupported.</li>
</ul>
<p><strong>Right when:</strong> a small, rarely-changing collection read constantly by many threads — event listener registries, configuration/route tables, feature-flag lists, cached whitelists. <strong>Wrong when:</strong> the list is large or writes are more than a trickle.</p>
<p><code>CopyOnWriteArraySet</code> is the same idea for sets.</p>`
},
{
  q: "Explain LinkedHashMap and how to build an LRU cache with it",
  level: "advanced", hot: true, tags: ["map", "cache"],
  a: `<p><code>LinkedHashMap</code> is a <code>HashMap</code> plus a doubly-linked list threading all entries, giving predictable iteration order. Two modes:</p>
<ul>
<li><strong>Insertion order</strong> (default).</li>
<li><strong>Access order</strong> (<code>accessOrder = true</code>) — every <code>get</code>/<code>put</code> moves the entry to the tail. That is exactly LRU semantics.</li>
</ul>
<p>Override <code>removeEldestEntry</code> and you have a bounded LRU cache in six lines:</p>
<pre><code>public class LruCache&lt;K, V&gt; extends LinkedHashMap&lt;K, V&gt; {
    private final int capacity;

    public LruCache(int capacity) {
        super(capacity, 0.75f, true);   // true = access order
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry&lt;K, V&gt; eldest) {
        return size() &gt; capacity;
    }
}
// Thread-safe wrapper if needed:
Map&lt;K,V&gt; cache = Collections.synchronizedMap(new LruCache&lt;&gt;(1000));</code></pre>
<p>For production, prefer <strong>Caffeine</strong> — it adds TTL, refresh-after-write, weight-based eviction, async loading and a W-TinyLFU policy that beats plain LRU on hit ratio. Mentioning that separates a textbook answer from an engineering one.</p>`
},
{
  q: "How do you make a collection thread-safe? Compare the options.",
  level: "advanced", tags: ["concurrency"],
  a: `<ol>
<li><strong>Concurrent collections (best)</strong> — <code>ConcurrentHashMap</code>, <code>ConcurrentLinkedQueue</code>, <code>CopyOnWriteArrayList</code>, <code>ConcurrentSkipListMap</code> (sorted + concurrent). Purpose-built, fine-grained locking.</li>
<li><strong>Synchronized wrappers</strong> — <code>Collections.synchronizedList(list)</code>. One global lock, and <em>iteration still needs manual synchronisation on the wrapper</em>, which people forget:
<pre><code>List&lt;String&gt; sync = Collections.synchronizedList(new ArrayList&lt;&gt;());
synchronized (sync) {              // required!
    for (String s : sync) { ... }
}</code></pre></li>
<li><strong>Immutable collections</strong> — <code>List.of()</code>, <code>Map.of()</code>, <code>List.copyOf()</code>. Thread-safe by construction and the cheapest correct answer when the data does not change.</li>
<li><strong>Confinement</strong> — keep the collection inside one thread (e.g. a per-request scope) and never share it. No synchronisation needed at all.</li>
</ol>
<p>Critical point: making individual operations atomic does <em>not</em> make compound operations atomic. <code>if (!list.contains(x)) list.add(x)</code> is racy on any of these.</p>`
},
{
  q: "What are BlockingQueues and where would you use one?",
  level: "advanced", tags: ["concurrency", "queue"],
  a: `<p>A <code>BlockingQueue</code> blocks the consumer when empty and (for bounded ones) the producer when full — the producer/consumer pattern without a single <code>wait()</code>/<code>notify()</code>.</p>
<table>
<tr><th>Implementation</th><th>Characteristic</th></tr>
<tr><td><code>ArrayBlockingQueue</code></td><td>Bounded, array-backed, single lock, optional fairness</td></tr>
<tr><td><code>LinkedBlockingQueue</code></td><td>Optionally bounded, separate head/tail locks → better throughput</td></tr>
<tr><td><code>SynchronousQueue</code></td><td>Zero capacity — a handoff. Used by <code>Executors.newCachedThreadPool</code></td></tr>
<tr><td><code>PriorityBlockingQueue</code></td><td>Unbounded, ordered by comparator</td></tr>
<tr><td><code>DelayQueue</code></td><td>Elements become available only after their delay expires — scheduled retries</td></tr>
</table>
<pre><code>BlockingQueue&lt;Task&gt; queue = new ArrayBlockingQueue&lt;&gt;(1000);

// producer — blocks if full, applying natural backpressure
queue.put(task);
// or bounded wait:
if (!queue.offer(task, 100, MILLISECONDS)) metrics.increment("queue.full");

// consumer
Task t = queue.take();   // blocks until an element arrives</code></pre>
<p><strong>Always prefer a bounded queue in production.</strong> An unbounded one turns a slow consumer into an <code>OutOfMemoryError</code> instead of visible backpressure — a lesson every team learns once.</p>`
},
{
  q: "What is the difference between Iterator, ListIterator and Enumeration?",
  level: "beginner", tags: ["iterator"],
  a: `<table>
<tr><th></th><th>Enumeration</th><th>Iterator</th><th>ListIterator</th></tr>
<tr><td>Since</td><td>1.0 (legacy)</td><td>1.2</td><td>1.2</td></tr>
<tr><td>Direction</td><td>Forward</td><td>Forward</td><td>Both</td></tr>
<tr><td>Remove</td><td>No</td><td><code>remove()</code></td><td><code>remove()</code>, <code>set()</code>, <code>add()</code></td></tr>
<tr><td>Applies to</td><td>Vector, Hashtable</td><td>All collections</td><td><code>List</code> only</td></tr>
<tr><td>Fail-fast</td><td>No</td><td>Yes</td><td>Yes</td></tr>
</table>
<p>Since Java 8 you also have <code>Iterable.forEach(Consumer)</code> and <code>Spliterator</code> — the latter powers parallel streams by supporting <code>trySplit()</code> to divide the source across threads.</p>`
},
{
  q: "How would you sort a Map by its values?",
  level: "advanced", tags: ["map", "streams"],
  a: `<p>A <code>HashMap</code> cannot be sorted in place; you produce an ordered view. Use a <code>LinkedHashMap</code> as the collector target to <em>preserve</em> the sorted order:</p>
<pre><code>Map&lt;String, Integer&gt; scores = ...;

Map&lt;String, Integer&gt; sorted = scores.entrySet().stream()
    .sorted(Map.Entry.&lt;String,Integer&gt;comparingByValue().reversed()
              .thenComparing(Map.Entry.comparingByKey()))   // tie-break, stable output
    .collect(Collectors.toMap(
        Map.Entry::getKey,
        Map.Entry::getValue,
        (a, b) -&gt; a,
        LinkedHashMap::new));      // &lt;-- without this you get an unordered HashMap</code></pre>
<p>Two things interviewers check: that you know a plain <code>Collectors.toMap</code> returns a <code>HashMap</code> and throws away your ordering, and that you supply the merge function (the 3-arg form) to avoid <code>IllegalStateException</code> on duplicate keys.</p>
<p>Top-N without a full sort is a good bonus answer — a bounded <code>PriorityQueue</code> gives O(n log k) instead of O(n log n).</p>`
},
{
  q: "What are WeakHashMap, IdentityHashMap and EnumMap for?",
  level: "advanced", tags: ["map", "memory"],
  a: `<ul>
<li><strong><code>WeakHashMap</code></strong> — keys are held by weak references, so an entry disappears once nothing else references the key. Use for caches and metadata keyed by object identity where you must not prevent garbage collection. Note: the <em>value</em> is strongly referenced, so a value pointing back at its key defeats the whole mechanism.</li>
<li><strong><code>IdentityHashMap</code></strong> — compares keys with <code>==</code>, not <code>equals()</code>. Used by serialization frameworks and object graph traversal to track "have I already visited this exact instance".</li>
<li><strong><code>EnumMap</code></strong> — backed by a plain array indexed by <code>ordinal()</code>. Extremely fast, compact, and iterates in enum declaration order. Always prefer it over <code>HashMap&lt;MyEnum, V&gt;</code>. <code>EnumSet</code> is its bitset equivalent.</li>
</ul>
<pre><code>Map&lt;OrderStatus, Handler&gt; handlers = new EnumMap&lt;&gt;(OrderStatus.class);
EnumSet&lt;OrderStatus&gt; terminal = EnumSet.of(DELIVERED, CANCELLED);</code></pre>`
},
{
  q: "Explain time complexity of the main collection operations",
  level: "advanced", hot: true, tags: ["complexity"],
  a: `<table>
<tr><th>Structure</th><th>get / contains</th><th>add</th><th>remove</th><th>Notes</th></tr>
<tr><td>ArrayList</td><td>O(1) index, O(n) search</td><td>O(1)*</td><td>O(n)</td><td>* amortised; resize is O(n)</td></tr>
<tr><td>LinkedList</td><td>O(n)</td><td>O(1) ends</td><td>O(1) with iterator</td><td>High constant factor</td></tr>
<tr><td>HashMap / HashSet</td><td>O(1) avg, O(log n) worst</td><td>O(1) avg</td><td>O(1) avg</td><td>Worst case after treeify</td></tr>
<tr><td>TreeMap / TreeSet</td><td>O(log n)</td><td>O(log n)</td><td>O(log n)</td><td>Sorted, range queries</td></tr>
<tr><td>ArrayDeque</td><td>O(n) search</td><td>O(1) both ends</td><td>O(1) both ends</td><td>Best stack/queue</td></tr>
<tr><td>PriorityQueue</td><td>O(1) peek, O(n) contains</td><td>O(log n)</td><td>O(log n) poll</td><td>Binary heap, not sorted on iteration</td></tr>
<tr><td>CopyOnWriteArrayList</td><td>O(1) index</td><td>O(n)</td><td>O(n)</td><td>Read-dominant only</td></tr>
</table>
<p>Note the deliberate trap: <code>PriorityQueue</code>'s <code>toString()</code>/iteration is <strong>not</strong> in sorted order — only <code>poll()</code> is ordered. That question catches a lot of candidates.</p>`
},
{
  q: "Why should you use ArrayDeque instead of Stack?",
  level: "advanced", tags: ["queue", "legacy"],
  a: `<p><code>Stack</code> extends <code>Vector</code>, which brings three problems:</p>
<ul>
<li>Every method is <code>synchronized</code> — you pay for locking you almost never need.</li>
<li>It inherits <code>Vector</code>'s list API, so <code>stack.get(0)</code> and <code>insertElementAt</code> are exposed — an LSP violation that lets callers break stack semantics.</li>
<li>Iteration order is bottom-to-top, the opposite of what a stack should give you.</li>
</ul>
<pre><code>Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();
stack.push(1); stack.push(2);
stack.pop();     // 2

Deque&lt;Integer&gt; queue = new ArrayDeque&lt;&gt;();
queue.offer(1);  queue.poll();</code></pre>
<p>The JDK's own Javadoc says: "A more complete and consistent set of LIFO stack operations is provided by <code>Deque</code>... <code>ArrayDeque</code> is likely to be faster than <code>Stack</code> when used as a stack, and faster than <code>LinkedList</code> when used as a queue." Quote that and you are done.</p>
<p><code>ArrayDeque</code> does not permit <code>null</code> elements, because <code>null</code> is the sentinel returned by <code>poll()</code>/<code>peek()</code> when empty.</p>`
},
{
  q: "What is the difference between Collection and Collections?",
  level: "beginner", tags: ["basics"],
  a: `<ul>
<li><code>Collection</code> (singular) — the root <strong>interface</strong> of the framework: <code>add</code>, <code>remove</code>, <code>size</code>, <code>iterator</code>.</li>
<li><code>Collections</code> (plural) — a <strong>utility class</strong> of static helpers: <code>sort</code>, <code>reverse</code>, <code>shuffle</code>, <code>unmodifiableList</code>, <code>synchronizedMap</code>, <code>emptyList</code>, <code>frequency</code>, <code>binarySearch</code>.</li>
</ul>
<p>Modern equivalents: <code>Collections.unmodifiableList(l)</code> gives an unmodifiable <em>view</em> (the underlying list can still change), whereas <code>List.copyOf(l)</code> makes a genuinely immutable copy. That difference is a common follow-up.</p>`
},
{
  q: "How do immutable collections (List.of, Map.of) differ from Collections.unmodifiableList?",
  level: "advanced", tags: ["immutability"],
  a: `<table>
<tr><th></th><th><code>List.of()</code> (Java 9+)</th><th><code>Collections.unmodifiableList()</code></th></tr>
<tr><td>Nature</td><td>Truly immutable copy</td><td>Unmodifiable <em>view</em> of a mutable list</td></tr>
<tr><td>Backing list changes</td><td>Impossible</td><td>Visible through the view</td></tr>
<tr><td>Nulls</td><td>Rejected (<code>NullPointerException</code>)</td><td>Allowed</td></tr>
<tr><td>Duplicates in <code>Set.of</code>/<code>Map.of</code></td><td>Rejected (<code>IllegalArgumentException</code>)</td><td>N/A</td></tr>
<tr><td>Memory</td><td>Optimised (specialised classes for 0, 1, 2 elements)</td><td>Wrapper object</td></tr>
<tr><td>Iteration order</td><td><code>Set.of</code>/<code>Map.of</code> deliberately randomised per JVM run</td><td>Underlying order</td></tr>
</table>
<p>That last row matters: <code>Set.of(...)</code> randomises iteration order on purpose so nobody writes code that depends on it. Tests that assert on order will pass locally and fail in CI.</p>
<p><code>List.copyOf(existing)</code> is the bridge — an immutable snapshot of a mutable source.</p>`
},
{
  q: "How does TreeMap maintain order and what is a red-black tree?",
  level: "advanced", tags: ["treemap", "internals"],
  a: `<p><code>TreeMap</code> is a <strong>red-black tree</strong> — a self-balancing binary search tree with five invariants (root black, no two consecutive reds, every path from a node to its leaves has the same number of black nodes, etc.). Those invariants guarantee the tree height stays within 2·log(n+1), so all operations are O(log n).</p>
<p>Ordering comes from the key's <code>compareTo</code> or the supplied <code>Comparator</code>. Because of that, <code>TreeMap</code> uses <strong>comparison, not equals</strong>, to decide key identity — so a comparator inconsistent with <code>equals</code> silently merges distinct keys.</p>
<p>The navigation API is the real reason to choose it:</p>
<pre><code>NavigableMap&lt;LocalDate, Rate&gt; rates = new TreeMap&lt;&gt;();
rates.floorEntry(date);          // latest rate effective on or before date
rates.ceilingKey(date);
rates.headMap(date, true);       // range view
rates.subMap(from, true, to, false);
rates.descendingMap();</code></pre>
<p><code>floorEntry</code> on a date-keyed TreeMap is the classic clean solution to "find the applicable price/rate/config version at time T".</p>`
},
{
  q: "What is a Spliterator and how do parallel streams use it?",
  level: "advanced", tags: ["streams", "internals"],
  a: `<p><code>Spliterator</code> ("splittable iterator", Java 8) is the source abstraction behind streams. Beyond <code>tryAdvance</code> (one element), it offers <code>trySplit()</code>, which hands back a second Spliterator covering part of the data so the fork/join pool can process halves in parallel.</p>
<p>It also reports <strong>characteristics</strong> — <code>SIZED</code>, <code>ORDERED</code>, <code>DISTINCT</code>, <code>SORTED</code>, <code>IMMUTABLE</code>, <code>NONNULL</code>, <code>CONCURRENT</code> — that the stream pipeline uses to optimise (e.g. skip a <code>distinct()</code> on an already-<code>DISTINCT</code> source, or size the output array exactly).</p>
<p><strong>Why it matters practically:</strong> splitting quality determines parallel speedup. <code>ArrayList</code> and arrays split perfectly in half (O(1), SIZED); <code>LinkedList</code> and <code>Stream.iterate</code> split badly or not at all, so <code>.parallelStream()</code> on them is usually slower than sequential. That is the answer to "why did my parallel stream get slower?"</p>`
},
{
  q: "You need to count word frequencies in a 10 GB file. Which collections and approach?",
  level: "advanced", tags: ["design", "performance"],
  a: `<p>Talk through constraints first — this is a design question disguised as a collections one.</p>
<ol>
<li><strong>Stream the file, never load it.</strong> <code>Files.lines(path)</code> in a try-with-resources; it is lazy and backed by a buffered reader.</li>
<li><strong>Accumulate into a <code>HashMap&lt;String,Integer&gt;</code></strong> using <code>merge(word, 1, Integer::sum)</code> — one hash lookup, no boxing churn from get/put pairs.</li>
<li><strong>Memory bound is the distinct word count, not the file size.</strong> Natural language tops out around a few million distinct tokens — a few hundred MB. Fine.</li>
<li><strong>If distinct keys do not fit</strong>: shard by <code>hash(word) % N</code> into N spill files, count each independently, then merge — the classic external map-reduce.</li>
<li><strong>Top-K results</strong>: a bounded <code>PriorityQueue</code> of size K, O(n log k), instead of sorting the whole map.</li>
<li><strong>Parallel</strong>: <code>ConcurrentHashMap</code> with <code>merge</code>, or better, per-thread maps merged at the end to avoid contention entirely.</li>
</ol>
<pre><code>try (var lines = Files.lines(path)) {
    Map&lt;String, Long&gt; counts = lines
        .flatMap(l -&gt; Arrays.stream(l.toLowerCase().split("\\\\W+")))
        .filter(w -&gt; !w.isBlank())
        .collect(Collectors.groupingBy(identity(), Collectors.counting()));

    counts.entrySet().stream()
        .sorted(Map.Entry.&lt;String,Long&gt;comparingByValue().reversed())
        .limit(20)
        .forEach(e -&gt; System.out.println(e.getKey() + " " + e.getValue()));
}</code></pre>`
}
]);
