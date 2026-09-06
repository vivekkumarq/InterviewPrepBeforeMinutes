appendTopic("java-collections", [
{
  q: "How does HashSet guarantee uniqueness internally?",
  level: "beginner", hot: true, tags: ["set", "internals"],
  a: `<p><code>HashSet</code> is a thin wrapper over a <code>HashMap</code>. Your element becomes the <em>key</em>, and every value is the same shared dummy object.</p>
<pre><code>// Straight from the JDK source
private transient HashMap&lt;E, Object&gt; map;
private static final Object PRESENT = new Object();

public boolean add(E e) {
    return map.put(e, PRESENT) == null;   // put returns the OLD value: null means it was new
}
public boolean contains(Object o) { return map.containsKey(o); }</code></pre>
<p>So uniqueness is entirely <code>HashMap</code> key semantics: hash the element, find the bucket, compare with <code>equals()</code> within the bucket. Duplicate means "same hash bucket <em>and</em> <code>equals</code> returns true".</p>
<p><strong>The consequence interviewers probe:</strong> a class with a broken or missing <code>hashCode()</code> will happily allow logical duplicates in a <code>HashSet</code>, because two equal objects land in different buckets and never get compared:</p>
<pre><code>class Point { int x, y;
    @Override public boolean equals(Object o) { ... }   // hashCode NOT overridden
}
Set&lt;Point&gt; set = new HashSet&lt;&gt;();
set.add(new Point(1,1));
set.add(new Point(1,1));
System.out.println(set.size());     // 2 — both "unique"</code></pre>
<p><code>LinkedHashSet</code> and <code>TreeSet</code> follow the same delegation pattern over <code>LinkedHashMap</code> and <code>TreeMap</code>. <code>TreeSet</code> is the exception to the rule above: it decides uniqueness by <code>compareTo</code>/<code>Comparator</code> returning 0, <em>not</em> by <code>equals</code> — which is why a comparator inconsistent with equals silently drops elements.</p>`
},
{
  q: "What happens when a HashMap resizes, and why was Java 8's change important?",
  level: "advanced", hot: true, tags: ["hashmap", "internals"],
  a: `<p>When <code>size &gt; capacity × loadFactor</code>, the table doubles and every entry is redistributed.</p>
<p><strong>Java 7</strong> rehashed each entry and inserted it at the <em>head</em> of the new bucket's list, reversing the order. Under concurrent access this could create a <strong>circular linked list</strong>, making a later <code>get()</code> spin forever at 100% CPU — a famous production hang.</p>
<p><strong>Java 8</strong> exploits the fact that capacity is always a power of two. When capacity doubles, exactly one extra hash bit becomes significant, so each entry either stays at index <code>i</code> or moves to <code>i + oldCapacity</code> — nothing else. The bucket is split into a "lo" and "hi" list in one pass, order is preserved, and no hash is recomputed:</p>
<pre><code>if ((e.hash &amp; oldCapacity) == 0) {   // the newly significant bit
    // stays at index i
} else {
    // moves to index i + oldCapacity
}</code></pre>
<p><strong>Costs worth stating:</strong> a resize is O(n) and allocates a new array — a latency spike in a hot path, and briefly double the memory. Pre-size the map when you know the count (<code>HashMap.newHashMap(n)</code> in Java 19+).</p>
<p><strong>The correct conclusion:</strong> Java 8 made the failure mode less catastrophic, but <code>HashMap</code> is still <em>not</em> thread-safe — concurrent writes can still lose entries and corrupt state. Use <code>ConcurrentHashMap</code>.</p>`
},
{
  q: "How do you iterate and remove safely from a collection?",
  level: "beginner", hot: true, tags: ["iterator", "gotcha"],
  a: `<pre><code>List&lt;String&gt; list = new ArrayList&lt;&gt;(List.of("a","xb","c","xd"));

// ✘ ConcurrentModificationException
for (String s : list) if (s.startsWith("x")) list.remove(s);

// ✔ 1. removeIf — cleanest, Java 8+
list.removeIf(s -&gt; s.startsWith("x"));

// ✔ 2. Explicit iterator
Iterator&lt;String&gt; it = list.iterator();
while (it.hasNext()) if (it.next().startsWith("x")) it.remove();

// ✔ 3. Reverse index loop — indices after i are unaffected by the removal
for (int i = list.size() - 1; i &gt;= 0; i--) if (list.get(i).startsWith("x")) list.remove(i);

// ✔ 4. Collect what to keep (no mutation at all)
list = list.stream().filter(s -&gt; !s.startsWith("x")).collect(toCollection(ArrayList::new));

// Maps
map.entrySet().removeIf(e -&gt; e.getValue() == null);
map.values().removeIf(Objects::isNull);
Iterator&lt;Map.Entry&lt;K,V&gt;&gt; mi = map.entrySet().iterator();
while (mi.hasNext()) { var e = mi.next(); if (test(e)) mi.remove(); }</code></pre>
<p><strong>Two traps worth naming:</strong> a forward index loop skips elements, because removing index <code>i</code> shifts everything left while <code>i</code> still increments. And <code>List.of(...)</code>, <code>Arrays.asList(...)</code> and <code>Collectors.toList()</code>'s result may be immutable or fixed-size — <code>removeIf</code> on them throws <code>UnsupportedOperationException</code>.</p>
<p>Note <code>ArrayList.removeIf</code> is also faster than repeated <code>remove()</code>: it does a single compacting pass rather than an O(n) shift per removal.</p>`
},
{
  q: "What is the difference between Queue, Deque, Stack and their implementations?",
  level: "beginner", tags: ["queue"],
  a: `<table>
<tr><th>Operation</th><th>Throws exception</th><th>Returns special value</th></tr>
<tr><td>Insert</td><td><code>add(e)</code></td><td><code>offer(e)</code> → false</td></tr>
<tr><td>Remove</td><td><code>remove()</code></td><td><code>poll()</code> → null</td></tr>
<tr><td>Examine</td><td><code>element()</code></td><td><code>peek()</code> → null</td></tr>
</table>
<pre><code>Deque&lt;Integer&gt; d = new ArrayDeque&lt;&gt;();
// As a STACK (LIFO)
d.push(1); d.push(2); d.pop();       // 2   — push/pop work on the HEAD
// As a QUEUE (FIFO)
d.offer(1); d.offer(2); d.poll();    // 1   — offer adds to tail, poll takes from head

// Deque-specific, unambiguous names — prefer these
d.offerFirst(x); d.offerLast(x); d.pollFirst(); d.pollLast(); d.peekFirst(); d.peekLast();</code></pre>
<ul>
<li><strong><code>ArrayDeque</code></strong> — the default for both stack and queue. Circular array, no per-node allocation, excellent cache locality. Does not permit <code>null</code>.</li>
<li><strong><code>LinkedList</code></strong> — implements both <code>List</code> and <code>Deque</code>, but has worse constants than <code>ArrayDeque</code>.</li>
<li><strong><code>PriorityQueue</code></strong> — a binary heap; <code>poll()</code> returns the smallest, but iteration order is <em>not</em> sorted.</li>
<li><strong><code>Stack</code></strong> — legacy, synchronised, extends <code>Vector</code>. Avoid.</li>
<li><strong>Blocking variants</strong> — <code>ArrayBlockingQueue</code>, <code>LinkedBlockingDeque</code> for producer/consumer.</li>
</ul>
<p><strong>Practical tip:</strong> in a real codebase prefer the explicit <code>offerLast</code>/<code>pollFirst</code> style over <code>push</code>/<code>pop</code> on a <code>Deque</code> — the intent is unmistakable to the next reader.</p>`
},
{
  q: "How do you choose the right collection for a given problem?",
  level: "beginner", hot: true, tags: ["design"],
  a: `<p>Answer as a decision tree — it shows structured thinking rather than memorised trivia.</p>
<ol>
<li><strong>Key-value pairs?</strong> → a <code>Map</code>.
  <ul>
  <li>Need order? Insertion order → <code>LinkedHashMap</code>. Sorted or range queries → <code>TreeMap</code>. Neither → <code>HashMap</code>.</li>
  <li>Concurrent access → <code>ConcurrentHashMap</code> (or <code>ConcurrentSkipListMap</code> if also sorted).</li>
  <li>Enum keys → <code>EnumMap</code> (array-backed, very fast).</li>
  </ul>
</li>
<li><strong>Uniqueness required?</strong> → a <code>Set</code>, with the same ordering questions.</li>
<li><strong>Indexed access or duplicates allowed?</strong> → a <code>List</code>.
  <ul>
  <li>Almost always <code>ArrayList</code>. Read-mostly and shared across threads → <code>CopyOnWriteArrayList</code>.</li>
  </ul>
</li>
<li><strong>FIFO/LIFO processing?</strong> → <code>ArrayDeque</code>; with blocking/backpressure → a <code>BlockingQueue</code>.</li>
<li><strong>Always need the smallest/largest?</strong> → <code>PriorityQueue</code>.</li>
<li><strong>Never changes after construction?</strong> → <code>List.of</code> / <code>Map.of</code> / <code>Set.of</code>.</li>
</ol>
<p><strong>Then ask the sizing questions:</strong> how many elements, what is the read/write ratio, and is it shared between threads? Those three usually settle any remaining doubt.</p>
<p><strong>Default answer if unsure:</strong> <code>ArrayList</code> and <code>HashMap</code>. They are right most of the time, and choosing something exotic without a measured reason is a smell in itself.</p>`
},
{
  q: "What is the Iterator design pattern and how do you write a custom Iterable?",
  level: "advanced", tags: ["iterator", "patterns"],
  a: `<p>The Iterator pattern gives sequential access to elements without exposing the underlying structure — which is why the same for-each loop works over an <code>ArrayList</code>, a <code>TreeSet</code> and your own class.</p>
<pre><code>public class Page&lt;T&gt; implements Iterable&lt;T&gt; {
    private final List&lt;T&gt; items;

    @Override public Iterator&lt;T&gt; iterator() {
        return new Iterator&lt;&gt;() {
            private int cursor = 0;
            public boolean hasNext() { return cursor &lt; items.size(); }
            public T next() {
                if (!hasNext()) throw new NoSuchElementException();
                return items.get(cursor++);
            }
        };
    }
}
for (T item : new Page&lt;&gt;(list)) { ... }          // for-each now works</code></pre>
<pre><code>// A lazy iterator over paginated API results — this is where it earns its keep
public class PagedResults&lt;T&gt; implements Iterable&lt;T&gt; {
    public Iterator&lt;T&gt; iterator() {
        return new Iterator&lt;&gt;() {
            private Iterator&lt;T&gt; current = fetchPage(0).iterator();
            private int page = 0;
            public boolean hasNext() {
                if (current.hasNext()) return true;
                var next = fetchPage(++page);          // fetch only when needed
                current = next.iterator();
                return current.hasNext();
            }
            public T next() { return current.next(); }
        };
    }
}</code></pre>
<p><strong>Why this matters practically:</strong> the caller writes an ordinary loop while pages are fetched lazily — no need to load a million rows into memory. The same idea underlies <code>Files.lines()</code> and <code>Stream</code>.</p>
<p>For streams, implement <code>Spliterator</code> instead (or wrap with <code>StreamSupport.stream(spliterator, false)</code>) so the source can also be split for parallel processing.</p>`
},
{
  q: "What is the difference between Collections.emptyList(), new ArrayList<>() and null?",
  level: "beginner", hot: true, tags: ["design", "best-practice"],
  a: `<pre><code>// ✘ Never return null for a collection
public List&lt;Order&gt; findOrders(Long id) {
    if (none) return null;          // every caller must now null-check, and one will forget
}

// ✔ Return an empty collection
return List.of();                    // immutable, zero allocation (shared instance)
return Collections.emptyList();      // same idea, pre-Java 9
return new ArrayList&lt;&gt;();            // only if the CALLER is expected to mutate it</code></pre>
<table>
<tr><th></th><th><code>List.of()</code></th><th><code>Collections.emptyList()</code></th><th><code>new ArrayList&lt;&gt;()</code></th></tr>
<tr><td>Mutable</td><td>No</td><td>No</td><td>Yes</td></tr>
<tr><td>Allocation</td><td>None — shared singleton</td><td>None — shared singleton</td><td>New object each call</td></tr>
<tr><td>Nulls allowed</td><td>No</td><td>N/A</td><td>Yes</td></tr>
</table>
<p><strong>Why "never return null" is worth stating firmly:</strong> it removes an entire class of NullPointerException at the source. The caller writes <code>for (Order o : findOrders(id))</code> or <code>findOrders(id).stream()</code> with no guard at all. This is one of the highest-value habits in Java and it costs nothing.</p>
<p>The same applies to method parameters — prefer an empty collection over a null argument, and validate with <code>Objects.requireNonNull</code> at the boundary. For a single value that may be absent, return <code>Optional&lt;T&gt;</code>; for a collection, return an empty one, never <code>Optional&lt;List&lt;T&gt;&gt;</code>.</p>`
},
{
  q: "How does Comparator.comparing work with nulls and multiple keys?",
  level: "advanced", tags: ["sorting"],
  a: `<pre><code>// Multi-key sort: department ascending, then salary descending, then name
Comparator&lt;Employee&gt; cmp = Comparator
        .comparing(Employee::dept)
        .thenComparing(Employee::salary, Comparator.reverseOrder())
        .thenComparing(Employee::name);

// Null-safe on the SORTED FIELD
Comparator&lt;Employee&gt; byManager = Comparator.comparing(
        Employee::manager,
        Comparator.nullsLast(Comparator.naturalOrder()));    // nulls sink to the bottom

// Null-safe on the ELEMENT itself
list.sort(Comparator.nullsFirst(cmp));

// Primitive specialisations avoid boxing in hot sorts
Comparator.comparingInt(Employee::age);
Comparator.comparingDouble(Employee::score);

// Reverse the WHOLE comparator vs one key — a common mix-up
cmp.reversed();                                    // reverses everything
Comparator.comparing(Employee::name).reversed();   // only the name</code></pre>
<p><strong>The generics gotcha</strong> that trips people up — when the first call is <code>reversed()</code> or a method reference is ambiguous, inference fails and you must give an explicit type witness:</p>
<pre><code>// ✘ does not compile
map.entrySet().stream().sorted(Map.Entry.comparingByValue().reversed())
// ✔
map.entrySet().stream().sorted(Map.Entry.&lt;String,Integer&gt;comparingByValue().reversed())</code></pre>
<p><strong>Contract reminder:</strong> a comparator must be transitive and consistent, or <code>Arrays.sort</code> throws <code>IllegalArgumentException: Comparison method violates its general contract!</code> — most often caused by <code>return a.score &gt; b.score ? 1 : -1</code>, which never returns 0 for equal values. Use <code>Integer.compare</code>/<code>Double.compare</code> instead of subtraction, which also avoids overflow.</p>`
},
{
  q: "What are the collection view methods and how do they behave?",
  level: "advanced", tags: ["collections", "gotcha"],
  a: `<p>Several methods return a <strong>view</strong> — a live window onto the original collection, not a copy. Changes propagate in both directions.</p>
<pre><code>Map&lt;String,Integer&gt; map = new HashMap&lt;&gt;(Map.of("a",1,"b",2));

Set&lt;String&gt; keys = map.keySet();
keys.remove("a");               // REMOVES the entry from the map itself
map.containsKey("a");           // false

List&lt;Integer&gt; list = new ArrayList&lt;&gt;(List.of(1,2,3,4,5));
List&lt;Integer&gt; sub = list.subList(1, 3);   // [2, 3] — a VIEW
sub.set(0, 99);                            // list is now [1, 99, 3, 4, 5]
sub.clear();                               // removes that range FROM list

int[] arr = {1,2,3};
List&lt;Integer&gt; fixed = Arrays.asList(1,2,3);
fixed.set(0, 9);                // ✔ writes through to the backing array
fixed.add(4);                   // ✘ UnsupportedOperationException — fixed size</code></pre>
<p><strong>Views to know:</strong> <code>keySet()</code>, <code>values()</code>, <code>entrySet()</code>, <code>subList()</code>, <code>Arrays.asList()</code>, <code>Collections.unmodifiableXxx()</code>, <code>TreeMap.headMap/tailMap/subMap</code>, <code>descendingMap()</code>.</p>
<p><strong>The dangerous behaviour:</strong> a <code>subList</code> view becomes <em>undefined</em> if the backing list is structurally modified through any other route — you get <code>ConcurrentModificationException</code> on the next access. And <code>unmodifiableList(x)</code> only stops modification <em>through the view</em>; whoever holds <code>x</code> can still change it, so it is not a defensive copy. Use <code>List.copyOf(x)</code> when you need a genuine snapshot.</p>
<p>The upside is real though: views avoid copying, so <code>map.values().removeIf(...)</code> and <code>list.subList(a,b).clear()</code> are efficient idioms.</p>`
},
{
  q: "What are the sequenced collections added in Java 21?",
  level: "advanced", tags: ["modern-java"],
  a: `<p>Before Java 21 there was no common way to say "first element" or "last element" across ordered collections — <code>list.get(0)</code>, <code>deque.getFirst()</code>, <code>sortedSet.first()</code>, and <code>LinkedHashSet</code> had no way at all short of iterating.</p>
<p>Java 21 added three interfaces — <code>SequencedCollection</code>, <code>SequencedSet</code>, <code>SequencedMap</code> — retrofitted onto <code>List</code>, <code>Deque</code>, <code>LinkedHashSet</code>, <code>LinkedHashMap</code> and <code>SortedSet</code>/<code>SortedMap</code>.</p>
<pre><code>List&lt;String&gt; list = new ArrayList&lt;&gt;(List.of("a","b","c"));
list.getFirst();            // "a"    — was list.get(0)
list.getLast();             // "c"    — was list.get(list.size()-1)
list.addFirst("z");
list.removeLast();
list.reversed();            // a reversed VIEW, not a copy

LinkedHashSet&lt;String&gt; set = new LinkedHashSet&lt;&gt;(List.of("x","y"));
set.getFirst();             // previously required an iterator

LinkedHashMap&lt;String,Integer&gt; map = new LinkedHashMap&lt;&gt;();
map.firstEntry();
map.lastEntry();
map.putFirst("k", 1);
map.reversed();             // reversed view of the map</code></pre>
<p><strong>Why it is a genuine improvement:</strong> it removes a long-standing inconsistency in the framework, makes "first/last" polymorphic across ordered types, and <code>reversed()</code> is a view rather than an O(n) copy. Mentioning it signals you follow the language rather than stopping at Java 8.</p>`
},
{
  q: "How do you make a defensive copy correctly?",
  level: "advanced", hot: true, tags: ["immutability", "security"],
  a: `<p>A defensive copy protects your object's invariants from callers who hold a reference to your internal state — copy on the way <strong>in</strong> and on the way <strong>out</strong>.</p>
<pre><code>public final class Order {
    private final List&lt;LineItem&gt; items;
    private final Date placedAt;                 // legacy mutable type

    public Order(List&lt;LineItem&gt; items, Date placedAt) {
        this.items = List.copyOf(items);         // COPY IN — caller cannot mutate later
        this.placedAt = new Date(placedAt.getTime());
        validate(this.items);                    // validate the COPY, not the argument
    }

    public List&lt;LineItem&gt; items() { return items; }               // already immutable
    public Date placedAt() { return new Date(placedAt.getTime()); } // COPY OUT
}</code></pre>
<p><strong>The subtle rule:</strong> copy <em>before</em> validating. If you validate the caller's object and then store a reference, a malicious or careless caller can change it between the check and the use — a time-of-check/time-of-use bug.</p>
<pre><code>// ✘ Broken: the copy is not deep enough
this.items = List.copyOf(items);   // list is immutable, but LineItem objects are shared
// If LineItem is mutable, callers can still change quantities.
// Make LineItem immutable (a record) rather than deep-copying every element.</code></pre>
<p><strong>When you can skip it:</strong> if the element type is itself immutable (<code>String</code>, boxed primitives, records of immutables, <code>LocalDate</code>), a shallow copy of the collection is enough. This is a strong argument for making value types immutable — it makes defensive copying cheap and shallow everywhere else.</p>`
},
{
  q: "How would you implement a thread-safe bounded cache with expiry from scratch?",
  level: "advanced", tags: ["design", "concurrency"],
  a: `<pre><code>public class TtlCache&lt;K, V&gt; {
    private record Entry&lt;V&gt;(V value, long expiresAt) {
        boolean expired() { return System.nanoTime() &gt; expiresAt; }
    }

    private final ConcurrentHashMap&lt;K, Entry&lt;V&gt;&gt; map = new ConcurrentHashMap&lt;&gt;();
    private final long ttlNanos;
    private final int maxSize;

    public V get(K key, Function&lt;K, V&gt; loader) {
        Entry&lt;V&gt; e = map.get(key);
        if (e != null &amp;&amp; !e.expired()) return e.value();

        // compute() holds the bucket lock, so only ONE thread loads a given key
        return map.compute(key, (k, existing) -&gt; {
            if (existing != null &amp;&amp; !existing.expired()) return existing;  // another thread won
            return new Entry&lt;&gt;(loader.apply(k), System.nanoTime() + ttlNanos);
        }).value();
    }

    public void evictExpired() {                 // run from a scheduler
        map.values().removeIf(Entry::expired);
    }
}</code></pre>
<p><strong>Design points to raise:</strong></p>
<ul>
<li><strong>Stampede protection</strong> — the fast path is a lock-free <code>get</code>; only on a miss does <code>compute</code> serialise loading <em>per key</em>, so a thousand concurrent requests for a hot key cause one load, not a thousand.</li>
<li><strong>Do not do I/O inside <code>compute</code> carelessly</strong> — it holds the bucket lock. It is acceptable here because it is scoped to one key, but a slow loader blocks other keys in the same bin. Say this: it shows you know the trade-off.</li>
<li><strong>Bounding</strong> — this sketch needs an eviction policy; LRU requires access ordering, which <code>ConcurrentHashMap</code> does not track, so you would add a <code>ConcurrentLinkedDeque</code> or use size-triggered sampling.</li>
<li><strong>Expiry</strong> — lazy (checked on read) plus a periodic sweep, otherwise expired-but-never-read entries leak.</li>
</ul>
<p><strong>Then say the important part:</strong> "In production I would use <strong>Caffeine</strong> rather than this — it gives W-TinyLFU eviction, refresh-after-write, async loading and statistics, all of which I would otherwise have to build and get wrong."</p>`
}
]);
