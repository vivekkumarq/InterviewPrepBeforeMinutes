appendTopic("java-collections", [
{
  q: "How would you remove duplicates from a list while preserving order?",
  level: "beginner", hot: true, tags: ["collections", "practice"],
  companies: ["TCS", "Infosys", "Cognizant", "Capgemini", "Zoho"],
  a: `<pre><code>List&lt;String&gt; input = List.of("b", "a", "c", "a", "b", "d");

// 1. LinkedHashSet — preserves insertion order, O(n)
List&lt;String&gt; unique = new ArrayList&lt;&gt;(new LinkedHashSet&lt;&gt;(input));   // [b, a, c, d]

// 2. Stream distinct() — same result, uses equals/hashCode
List&lt;String&gt; unique = input.stream().distinct().toList();

// 3. By a FIELD rather than the whole object — the follow-up they ask
List&lt;Employee&gt; byEmail = employees.stream()
    .collect(collectingAndThen(
        toCollection(() -&gt; new TreeSet&lt;&gt;(comparing(Employee::email))),
        ArrayList::new));

// 4. Stateful predicate — works for any key, keeps the FIRST occurrence
Set&lt;String&gt; seen = ConcurrentHashMap.newKeySet();
List&lt;Employee&gt; unique = employees.stream()
    .filter(e -&gt; seen.add(e.email()))          // add() returns false if already present
    .toList();</code></pre>
<p><strong>Why <code>HashSet</code> is the wrong answer here:</strong> it deduplicates but destroys order — and the question specifically says "preserving order". <code>LinkedHashSet</code> maintains a doubly linked list through its entries, so iteration follows insertion order at no extra lookup cost.</p>
<p><strong>The trap in option 4:</strong> a stateful predicate inside <code>filter</code> is explicitly discouraged by the Stream documentation because it breaks under <code>parallelStream()</code>. It is fine sequentially, and worth saying you know the limitation — that is what separates a memorised answer from an understood one.</p>
<p><strong>Follow-up they often add:</strong> "what if the objects have no <code>equals</code>?" — then <code>distinct()</code> falls back to identity and removes nothing. Either implement <code>equals</code>/<code>hashCode</code>, use a record, or deduplicate by an explicit key as in options 3 and 4.</p>`
},
{
  q: "How do you sort a HashMap by key and by value?",
  level: "beginner", hot: true, tags: ["map", "sorting"],
  companies: ["TCS", "Infosys", "Wipro", "Accenture", "HCL", "Tech Mahindra"],
  a: `<pre><code>Map&lt;String, Integer&gt; scores = Map.of("bob", 85, "alice", 92, "carol", 78);

// BY KEY — a TreeMap sorts on insertion
Map&lt;String, Integer&gt; byKey = new TreeMap&lt;&gt;(scores);

// BY KEY, stream form
Map&lt;String, Integer&gt; byKey2 = scores.entrySet().stream()
    .sorted(Map.Entry.comparingByKey())
    .collect(toMap(Entry::getKey, Entry::getValue, (a, b) -&gt; a, LinkedHashMap::new));

// BY VALUE descending, with a key tie-break for deterministic output
Map&lt;String, Integer&gt; byValue = scores.entrySet().stream()
    .sorted(Map.Entry.&lt;String, Integer&gt;comparingByValue().reversed()
              .thenComparing(Map.Entry.comparingByKey()))
    .collect(toMap(Entry::getKey, Entry::getValue,
                   (a, b) -&gt; a,
                   LinkedHashMap::new));       // &lt;-- WITHOUT this you get a HashMap
                                                //     and your ordering is thrown away</code></pre>
<p><strong>The two mistakes interviewers watch for:</strong></p>
<ol>
<li><strong>Forgetting <code>LinkedHashMap::new</code></strong> — <code>Collectors.toMap</code> returns a <code>HashMap</code> by default, so all that careful sorting is discarded the moment you collect. This is the single most common bug in this answer.</li>
<li><strong>Forgetting the merge function</strong> — the two-argument <code>toMap</code> throws <code>IllegalStateException</code> on duplicate keys. Keys are unique here so it is safe, but stating the four-argument form shows you know why.</li>
</ol>
<p><strong>The generics detail:</strong> <code>Map.Entry.comparingByValue().reversed()</code> alone fails to compile because type inference cannot resolve it after <code>reversed()</code>. The explicit type witness <code>Map.Entry.&lt;String, Integer&gt;comparingByValue()</code> fixes it — a genuinely confusing error that catches people in a live coding round.</p>
<p><strong>If you only need the top N</strong>, a bounded <code>PriorityQueue</code> is O(n log k) rather than sorting everything at O(n log n).</p>`
},
{
  q: "What is the internal working of ConcurrentHashMap in Java 8 vs Java 7?",
  level: "advanced", hot: true, tags: ["concurrency", "internals"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "Morgan Stanley", "Flipkart", "Walmart"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 190" role="img" aria-label="ConcurrentHashMap Java 7 segments versus Java 8 bucket locking">
  <text class="dg-t" x="150" y="18" text-anchor="middle">Java 7 — segment locking</text>
  <rect class="dg-fill2" x="20" y="30" width="76" height="54" rx="7"/><text class="dg-s" x="58" y="52" text-anchor="middle">Segment 0</text><text class="dg-s" x="58" y="68" text-anchor="middle">🔒 lock</text>
  <rect class="dg-fill2" x="104" y="30" width="76" height="54" rx="7"/><text class="dg-s" x="142" y="52" text-anchor="middle">Segment 1</text><text class="dg-s" x="142" y="68" text-anchor="middle">🔒 lock</text>
  <rect class="dg-fill2" x="188" y="30" width="86" height="54" rx="7"/><text class="dg-s" x="231" y="52" text-anchor="middle">Segment 15</text><text class="dg-s" x="231" y="68" text-anchor="middle">🔒 lock</text>
  <text class="dg-s" x="150" y="102" text-anchor="middle">max 16 concurrent writers</text>
  <text class="dg-t" x="450" y="18" text-anchor="middle">Java 8 — per-bucket</text>
  <rect class="dg-box" x="330" y="30" width="46" height="24" rx="4"/><text class="dg-m" x="353" y="47" text-anchor="middle">[0]</text>
  <rect class="dg-box" x="330" y="58" width="46" height="24" rx="4"/><text class="dg-m" x="353" y="75" text-anchor="middle">[1]</text>
  <rect class="dg-box" x="330" y="86" width="46" height="24" rx="4"/><text class="dg-m" x="353" y="103" text-anchor="middle">[2]</text>
  <rect class="dg-box" x="330" y="114" width="46" height="24" rx="4"/><text class="dg-m" x="353" y="131" text-anchor="middle">[n]</text>
  <text class="dg-s" x="470" y="47" text-anchor="middle">empty → CAS, no lock</text>
  <text class="dg-s" x="480" y="75" text-anchor="middle">occupied → sync on head node</text>
  <text class="dg-s" x="452" y="103" text-anchor="middle">reads → fully lock-free</text>
  <text class="dg-s" x="470" y="131" text-anchor="middle">resize → threads cooperate</text>
  <text class="dg-s" x="450" y="160" text-anchor="middle">concurrency = number of buckets</text>
</svg>
</figure>
<table>
<tr><th></th><th>Java 7</th><th>Java 8+</th></tr>
<tr><td>Structure</td><td>Array of 16 <code>Segment</code>s, each a mini hash table</td><td>Single <code>Node[]</code> table, like <code>HashMap</code></td></tr>
<tr><td>Lock granularity</td><td>Per segment (<code>ReentrantLock</code>)</td><td>Per <strong>bucket</strong> (<code>synchronized</code> on the head node)</td></tr>
<tr><td>Write concurrency</td><td>Capped at the segment count</td><td>Effectively the bucket count</td></tr>
<tr><td>Empty bucket insert</td><td>Takes the segment lock</td><td><strong>CAS</strong> — no lock at all</td></tr>
<tr><td>Reads</td><td>Mostly lock-free</td><td>Fully lock-free (<code>volatile</code> table and nodes)</td></tr>
<tr><td>Collision handling</td><td>Linked list</td><td>List, converting to a <strong>red-black tree</strong> past 8 nodes</td></tr>
<tr><td><code>size()</code></td><td>Locks all segments if needed</td><td>Striped counters (<code>CounterCell</code>) — an estimate</td></tr>
<tr><td>Resize</td><td>Per segment</td><td><strong>Cooperative</strong> — several threads help transfer</td></tr>
</table>
<p><strong>Why nulls are forbidden</strong> — a favourite follow-up: <code>map.get(k) == null</code> would be ambiguous between "absent" and "present with a null value". In a single-threaded map you can disambiguate with <code>containsKey</code>; in a concurrent map another thread can change the answer between the two calls, so the API removes the ambiguity by banning nulls entirely.</p>
<p><strong>Always use the atomic composite methods</strong> — <code>computeIfAbsent</code>, <code>merge</code>, <code>putIfAbsent</code> — because thread-safe <em>operations</em> do not compose into thread-safe <em>logic</em>. And never do I/O or call the same map inside <code>computeIfAbsent</code>: it holds the bucket lock and can deadlock.</p>`
},
{
  q: "Find the first non-repeating character in a string",
  level: "beginner", hot: true, tags: ["practice", "collections"],
  companies: ["Amazon", "Zoho", "Paytm", "TCS", "Infosys", "Adobe"],
  a: `<pre><code>// LinkedHashMap preserves insertion order, so the first entry with count 1
// is the answer — one pass to count, one pass to find. O(n).
public static Character firstNonRepeating(String s) {
    Map&lt;Character, Integer&gt; counts = new LinkedHashMap&lt;&gt;();
    for (char c : s.toCharArray()) {
        counts.merge(c, 1, Integer::sum);
    }
    return counts.entrySet().stream()
            .filter(e -&gt; e.getValue() == 1)
            .map(Map.Entry::getKey)
            .findFirst()
            .orElse(null);
}

// Array version for ASCII — faster, no boxing, no hashing
public static Character firstNonRepeatingFast(String s) {
    int[] freq = new int[256];
    for (int i = 0; i &lt; s.length(); i++) freq[s.charAt(i)]++;
    for (int i = 0; i &lt; s.length(); i++) {
        if (freq[s.charAt(i)] == 1) return s.charAt(i);   // scan the STRING, not the array
    }
    return null;
}</code></pre>
<p><strong>The key insight to say out loud:</strong> a plain <code>HashMap</code> loses ordering, so you cannot tell which qualifying character came <em>first</em>. Either use <code>LinkedHashMap</code>, or count into any map and then re-scan the original string in order — which is what the array version does.</p>
<p><strong>Complexity:</strong> O(n) time, O(k) space where k is the alphabet size. Two passes, not nested loops — the naive O(n²) version compares every character with every other, and interviewers are specifically checking whether you avoid it.</p>
<p><strong>Edge cases to mention before coding:</strong> empty string, all characters repeating (return null or a sentinel — ask which), case sensitivity, and non-ASCII input. For real Unicode, <code>charAt</code> returns UTF-16 code units so emoji are surrogate pairs — use <code>codePoints()</code> if that matters.</p>`
},
{
  q: "What is the difference between Iterator and ListIterator, and when do you need ListIterator?",
  level: "beginner", tags: ["iterator", "collections"],
  companies: ["Infosys", "Capgemini", "HCL", "Mindtree", "IBM"],
  a: `<table>
<tr><th></th><th><code>Iterator</code></th><th><code>ListIterator</code></th></tr>
<tr><td>Applies to</td><td>Any <code>Collection</code></td><td><code>List</code> only</td></tr>
<tr><td>Direction</td><td>Forward only</td><td>Both — <code>hasPrevious()</code>, <code>previous()</code></td></tr>
<tr><td>Modify</td><td><code>remove()</code></td><td><code>remove()</code>, <code>set()</code>, <code>add()</code></td></tr>
<tr><td>Index access</td><td>No</td><td><code>nextIndex()</code>, <code>previousIndex()</code></td></tr>
<tr><td>Start position</td><td>Beginning</td><td>Any index — <code>list.listIterator(5)</code></td></tr>
</table>
<pre><code>// Replacing elements in place — Iterator CANNOT do this
ListIterator&lt;String&gt; it = list.listIterator();
while (it.hasNext()) {
    String value = it.next();
    if (value.startsWith("old")) {
        it.set(value.replace("old", "new"));      // replace the CURRENT element
    }
    if (value.equals("marker")) {
        it.add("inserted");                        // insert AFTER the current position
    }
}

// Iterating backwards
ListIterator&lt;String&gt; back = list.listIterator(list.size());
while (back.hasPrevious()) {
    process(back.previous());
}</code></pre>
<p><strong>When you genuinely need <code>ListIterator</code>:</strong> replacing elements during iteration, inserting at a specific point while traversing, or walking backwards — none of which a plain <code>Iterator</code> supports. In practice most of these have cleaner alternatives (<code>replaceAll</code>, <code>removeIf</code>, a reversed stream), so <code>ListIterator</code> appears mainly in older code and in algorithms that must mutate a list positionally.</p>
<p><strong>The <code>add()</code> subtlety</strong> that catches people: it inserts <em>before</em> the implicit cursor, so the newly added element is <strong>not</strong> returned by the subsequent <code>next()</code> call — the iteration continues past it. That behaviour is exactly what prevents an infinite loop when you add during traversal.</p>`
},
{
  q: "How does TreeMap handle null keys and a custom Comparator?",
  level: "advanced", tags: ["treemap", "gotcha"],
  companies: ["Oracle", "SAP", "Deloitte", "Persistent", "Societe Generale"],
  a: `<pre><code>TreeMap&lt;String, Integer&gt; map = new TreeMap&lt;&gt;();
map.put(null, 1);         // ✘ NullPointerException — it must COMPARE the key

HashMap&lt;String, Integer&gt; hm = new HashMap&lt;&gt;();
hm.put(null, 1);          // ✔ allowed — one null key, stored in bucket 0

// Null-tolerant TreeMap via a comparator
TreeMap&lt;String, Integer&gt; safe =
        new TreeMap&lt;&gt;(Comparator.nullsFirst(Comparator.naturalOrder()));
safe.put(null, 1);        // ✔ now fine</code></pre>
<p><strong>The deeper trap — <code>TreeMap</code> uses <code>compareTo</code>, not <code>equals</code>, to decide key identity:</strong></p>
<pre><code>record Person(String name, int age) { }

TreeMap&lt;Person, String&gt; byAge = new TreeMap&lt;&gt;(comparing(Person::age));
byAge.put(new Person("Alice", 30), "first");
byAge.put(new Person("Bob",   30), "second");    // SAME age -> comparator returns 0

byAge.size();                                     // 1  — Bob OVERWROTE Alice
byAge.get(new Person("Carol", 30));               // "second" — matches by age alone!</code></pre>
<p>Two objects that are not <code>equals</code> are treated as the same key because the comparator says they compare to zero. The <code>SortedMap</code> contract explicitly warns that a comparator inconsistent with <code>equals</code> makes the map behave "strangely" — this is what that means in practice, and it silently loses data.</p>
<p><strong>The fix</strong> is always to make the comparator total by adding a tie-breaker:</p>
<pre><code>new TreeMap&lt;&gt;(comparing(Person::age).thenComparing(Person::name));</code></pre>
<p><strong>Worth adding:</strong> <code>TreeMap</code>'s real value is the <code>NavigableMap</code> API — <code>floorEntry</code>, <code>ceilingKey</code>, <code>headMap</code>, <code>subMap</code>, <code>descendingMap</code>. <code>floorEntry(date)</code> on a date-keyed map is the clean answer to "which price/rate/config version applied at time T", which no <code>HashMap</code> can do.</p>`
},
{
  q: "Which collection would you choose for each of these scenarios?",
  level: "beginner", hot: true, tags: ["design", "collections"],
  companies: ["TCS", "Infosys", "Cognizant", "Wipro", "Accenture", "LTIMindtree"],
  a: `<table>
<tr><th>Requirement</th><th>Choice</th><th>Why</th></tr>
<tr><td>Frequent index access, rare inserts</td><td><code>ArrayList</code></td><td>O(1) get, contiguous memory, great cache locality</td></tr>
<tr><td>Unique elements, order irrelevant</td><td><code>HashSet</code></td><td>O(1) add/contains</td></tr>
<tr><td>Unique, insertion order matters</td><td><code>LinkedHashSet</code></td><td>Hash speed + a linked list for order</td></tr>
<tr><td>Always need min/max, or range queries</td><td><code>TreeSet</code> / <code>TreeMap</code></td><td>Sorted, with <code>floor</code>/<code>ceiling</code>/<code>subSet</code></td></tr>
<tr><td>LRU cache</td><td><code>LinkedHashMap</code> (access order)</td><td>Override <code>removeEldestEntry</code></td></tr>
<tr><td>Enum keys</td><td><code>EnumMap</code> / <code>EnumSet</code></td><td>Array-backed by ordinal — extremely fast and compact</td></tr>
<tr><td>Stack or queue</td><td><code>ArrayDeque</code></td><td>Beats <code>Stack</code> (synchronised) and <code>LinkedList</code> (pointer chasing)</td></tr>
<tr><td>Producer/consumer with backpressure</td><td><code>ArrayBlockingQueue</code></td><td><strong>Bounded</strong> — blocks the producer instead of an OOM</td></tr>
<tr><td>Always pull the highest priority</td><td><code>PriorityQueue</code></td><td>Binary heap, O(log n) insert and poll</td></tr>
<tr><td>Shared map, many threads</td><td><code>ConcurrentHashMap</code></td><td>Lock-free reads, per-bucket write locking</td></tr>
<tr><td>Read-mostly shared list (listeners, config)</td><td><code>CopyOnWriteArrayList</code></td><td>Lock-free reads; writes copy, so keep it small</td></tr>
<tr><td>Never changes after construction</td><td><code>List.of()</code> / <code>Map.of()</code></td><td>Immutable, thread-safe, memory-optimised</td></tr>
</table>
<p><strong>The decision process to describe</strong> rather than reciting the table: first, <em>what shape is the data</em> — key/value, unique elements, or an ordered sequence? Second, <em>do I need ordering</em> — none, insertion, or sorted? Third, <em>is it shared across threads</em>? Those three questions land on the right answer almost every time.</p>
<p><strong>The honest default:</strong> <code>ArrayList</code> and <code>HashMap</code> are correct for the large majority of code. Choosing something exotic without a measured reason is itself a smell — and interviewers respect a candidate who says so rather than reaching for <code>LinkedList</code> to sound clever.</p>`
},
{
  q: "How do you make an ArrayList thread-safe, and what are the trade-offs?",
  level: "advanced", tags: ["concurrency", "collections"],
  companies: ["Amazon", "Oracle", "Barclays", "JPMorgan", "Optum", "Maersk"],
  a: `<pre><code>// 1. Synchronized wrapper — one global lock
List&lt;String&gt; sync = Collections.synchronizedList(new ArrayList&lt;&gt;());
sync.add("x");                       // safe

synchronized (sync) {                // ITERATION STILL NEEDS MANUAL SYNC
    for (String s : sync) { ... }    // without this: ConcurrentModificationException
}

// 2. CopyOnWriteArrayList — lock-free reads, O(n) copy per write
List&lt;String&gt; cow = new CopyOnWriteArrayList&lt;&gt;();

// 3. Immutable — no synchronisation needed at all
List&lt;String&gt; frozen = List.copyOf(source);

// 4. Confinement — keep it inside one thread and never share it</code></pre>
<table>
<tr><th></th><th>synchronizedList</th><th>CopyOnWriteArrayList</th></tr>
<tr><td>Reads</td><td>Take the lock</td><td><strong>Lock-free</strong></td></tr>
<tr><td>Writes</td><td>Take the lock, O(1) amortised</td><td><strong>O(n)</strong> — copies the whole array</td></tr>
<tr><td>Iteration</td><td>Manual <code>synchronized</code> block required</td><td>Snapshot — never throws CME</td></tr>
<tr><td><code>iterator.remove()</code></td><td>Supported</td><td><strong>Unsupported</strong></td></tr>
<tr><td>Best for</td><td>Balanced read/write, small collections</td><td>Read-dominant: listeners, config, route tables</td></tr>
</table>
<p><strong>The point most candidates miss:</strong> making each <em>operation</em> atomic does not make your <em>logic</em> atomic. This is still a race on any of the above:</p>
<pre><code>if (!list.contains(x)) list.add(x);      // two threads can both pass the check</code></pre>
<p>You need an external lock around the compound operation, or a data structure with an atomic equivalent (<code>ConcurrentHashMap.putIfAbsent</code>, or <code>CopyOnWriteArrayList.addIfAbsent</code>).</p>
<p><strong>What I would actually recommend:</strong> prefer immutability or confinement first — they eliminate the problem rather than managing it. Reach for <code>CopyOnWriteArrayList</code> only when reads vastly outnumber writes and the list is small, because a write on a 100,000-element list copies 100,000 references.</p>`
},
{
  q: "What happens when two threads modify a HashMap concurrently?",
  level: "advanced", hot: true, tags: ["hashmap", "concurrency"],
  companies: ["Amazon", "Flipkart", "Walmart", "Goldman Sachs", "Paytm"],
  a: `<p><code>HashMap</code> is not thread-safe, and the failure modes go far beyond "you might lose an entry":</p>
<ol>
<li><strong>Lost updates</strong> — two threads write to the same bucket and one overwrites the other's node.</li>
<li><strong>Stale reads</strong> — the table reference is not <code>volatile</code>, so a thread may not see a resize performed by another.</li>
<li><strong>Corrupted size</strong> — <code>size++</code> is read-modify-write, so the count drifts from reality.</li>
<li><strong>Infinite loop (Java 7)</strong> — concurrent resize could form a <strong>circular linked list</strong>, so a later <code>get()</code> spun forever at 100% CPU. A famous production hang, and still worth knowing because it explains why the resize algorithm changed.</li>
<li><strong>Data loss on resize (Java 8)</strong> — the circular-list bug was fixed, but concurrent writes during a resize can still drop entries silently. The failure is quieter, which arguably makes it worse.</li>
</ol>
<pre><code>// The fix — and note that ConcurrentHashMap ALSO needs atomic composites
Map&lt;String, Integer&gt; counts = new ConcurrentHashMap&lt;&gt;();

counts.put(k, counts.getOrDefault(k, 0) + 1);   // ✘ STILL a race: read-then-write
counts.merge(k, 1, Integer::sum);                // ✔ atomic
counts.computeIfAbsent(k, key -&gt; load(key));     // ✔ atomic, loads once per key</code></pre>
<p><strong>The Spring-specific version of this bug</strong>, which is where it actually bites: a <code>@Service</code> is a singleton shared by every request thread, so a plain <code>HashMap</code> as an instance field is concurrently mutated under load. It passes every test and corrupts data in production.</p>
<pre><code>@Service
public class RateCache {
    private final Map&lt;String, Rate&gt; cache = new HashMap&lt;&gt;();            // ✘ data race
    private final Map&lt;String, Rate&gt; cache = new ConcurrentHashMap&lt;&gt;();  // ✔
}</code></pre>
<p><strong>The line to close with:</strong> "The dangerous part is that it usually <em>appears</em> to work — you get no exception, just occasional wrong answers under load, which is the hardest class of bug to reproduce."</p>`
},
{
  q: "Explain time and space complexity of ArrayList vs LinkedList operations with real numbers",
  level: "advanced", tags: ["complexity", "performance"],
  companies: ["Amazon", "Microsoft", "Adobe", "EPAM", "Nagarro"],
  a: `<table>
<tr><th>Operation</th><th>ArrayList</th><th>LinkedList</th><th>Reality</th></tr>
<tr><td><code>get(i)</code></td><td>O(1)</td><td>O(n)</td><td>ArrayList wins decisively</td></tr>
<tr><td><code>add(e)</code> at end</td><td>O(1) amortised</td><td>O(1)</td><td>ArrayList still faster — no node allocation</td></tr>
<tr><td><code>add(0, e)</code></td><td>O(n)</td><td>O(1)</td><td>LinkedList wins on paper; <code>ArrayDeque</code> beats both</td></tr>
<tr><td><code>remove(i)</code></td><td>O(n) shift</td><td>O(n) traversal + O(1) unlink</td><td>Similar in practice</td></tr>
<tr><td><code>contains(e)</code></td><td>O(n)</td><td>O(n)</td><td>ArrayList much faster — cache locality</td></tr>
<tr><td>Memory per element</td><td>~4–8 bytes (reference)</td><td>~40 bytes (node + 2 pointers + header)</td><td>~5× overhead</td></tr>
</table>
<p><strong>Why the Big-O table misleads.</strong> An <code>ArrayList</code> stores references contiguously, so iterating it streams through cache lines — the CPU prefetcher predicts the next address perfectly. A <code>LinkedList</code> scatters nodes across the heap, so every step is a potential cache miss, and a cache miss costs roughly 100× an L1 hit. In practice <code>ArrayList</code> often beats <code>LinkedList</code> even at operations where it is asymptotically worse, because <em>n</em> has to get large before O(n) shifting of contiguous memory loses to O(n) pointer chasing.</p>
<pre><code>// ArrayList growth: oldCapacity + (oldCapacity >> 1)  == 1.5x
// 10 -> 15 -> 22 -> 33 -> 49 ...  each step is an Arrays.copyOf

// Pre-size when you know the count — avoids every intermediate copy
List&lt;Order&gt; orders = new ArrayList&lt;&gt;(expectedSize);</code></pre>
<p><strong>The answer interviewers are looking for:</strong> "I default to <code>ArrayList</code>. <code>LinkedList</code>'s only genuine advantage is O(1) insertion when you already hold a <code>ListIterator</code> at the position — and for a queue or stack, <code>ArrayDeque</code> beats it on every axis. I would only choose <code>LinkedList</code> after a benchmark showed it winning, which in my experience it does not."</p>
<p>Java's own maintainers agree — the <code>ArrayDeque</code> Javadoc explicitly states it is faster than <code>LinkedList</code> when used as a queue.</p>`
}
]);
