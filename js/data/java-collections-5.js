appendTopic("java-collections", [
{
  q: "Which specialised collections are worth knowing beyond List, Set and Map?",
  level: "advanced", tags: ["collections", "performance", "design"],
  companies: ["Amazon", "Oracle", "SAP", "Goldman Sachs", "Optum", "EPAM", "Flipkart"],
  a: `<table>
<tr><th>Collection</th><th>Use for</th><th>Why not the obvious one</th></tr>
<tr><td><strong><code>EnumMap</code></strong></td><td>Keys are an enum</td><td>Backed by an <strong>array indexed by ordinal</strong> — no hashing, no collisions, tiny and fast</td></tr>
<tr><td><code>EnumSet</code></td><td>A set of enum values</td><td>A <strong>bit vector</strong>. A set of 64 constants fits in one <code>long</code>.</td></tr>
<tr><td><code>ArrayDeque</code></td><td>Stack or queue</td><td>Faster than both <code>Stack</code> and <code>LinkedList</code>; circular array, no per-node allocation</td></tr>
<tr><td><code>IdentityHashMap</code></td><td>Keys compared by <code>==</code></td><td>Needed when equal-but-distinct objects must stay distinct — serialisation graphs, object mapping</td></tr>
<tr><td><code>WeakHashMap</code></td><td>Entries that may be collected</td><td>Keys are weak references, so a cache does not pin objects in memory</td></tr>
<tr><td><code>LinkedHashMap</code> (access order)</td><td><strong>An LRU cache in four lines</strong></td><td>Override <code>removeEldestEntry</code> and you are done</td></tr>
<tr><td><code>BitSet</code></td><td>Millions of boolean flags</td><td>1 bit each, not 1 byte — and it does set operations natively</td></tr>
<tr><td><code>PriorityQueue</code></td><td>Always the min or max</td><td>O(1) peek; a sorted list costs O(n) per insert</td></tr>
</table>
<pre><code>// An LRU cache, using what is already in the JDK
Map&lt;K, V&gt; lru = new LinkedHashMap&lt;&gt;(capacity, 0.75f, true) {   // true = ACCESS order
    @Override protected boolean removeEldestEntry(Map.Entry&lt;K, V&gt; e) {
        return size() &gt; capacity;
    }
};
// Wrap it with Collections.synchronizedMap for concurrent use — or use
// Caffeine, which is what you would actually ship.</code></pre>
<pre><code>// EnumMap vs HashMap — not a micro-optimisation
enum Status { PENDING, PAID, SHIPPED, DELIVERED }

Map&lt;Status, Integer&gt; counts = new EnumMap&lt;&gt;(Status.class);
// Internally: new int[Status.values().length], indexed by ordinal().
// No hashCode call, no collision handling, no Entry objects, and iteration
// comes out in DECLARATION order for free.

EnumSet&lt;Status&gt; open = EnumSet.of(PENDING, PAID);
EnumSet&lt;Status&gt; closed = EnumSet.complementOf(open);    // set algebra, on bits</code></pre>
<table>
<tr><th>Immutable factories</th><th>Behaviour</th></tr>
<tr><td><code>List.of</code>, <code>Set.of</code>, <code>Map.of</code></td><td>Truly immutable; <strong>reject nulls</strong>; <code>Set.of</code>/<code>Map.of</code> throw on duplicate keys</td></tr>
<tr><td><code>List.copyOf(x)</code></td><td>An immutable snapshot — the defensive-copy idiom</td></tr>
<tr><td><code>Collections.unmodifiableList(x)</code></td><td>A <strong>view</strong>, not a copy — the underlying list can still change beneath it</td></tr>
<tr><td><code>Arrays.asList(x)</code></td><td>Fixed size but <em>mutable</em>, and writes through to the array</td></tr>
</table>
<p><strong>The point to make:</strong> "<code>HashMap</code> and <code>ArrayList</code> are right most of the time, and I would not swap them without a reason. But when the key is an enum, <code>EnumMap</code> is strictly better on every axis — smaller, faster, ordered — so there is no trade-off to weigh. Knowing the handful of cases like that is worth more than micro-tuning the common ones."</p>`
},
{
  q: "When would you choose an array over a collection, and what are the gotchas?",
  level: "beginner", tags: ["collections", "arrays", "basics"],
  companies: ["TCS", "Infosys", "Wipro", "Amazon", "Cognizant", "Oracle", "Zoho"],
  a: `<table>
<tr><th></th><th>Array</th><th><code>ArrayList</code></th></tr>
<tr><td>Size</td><td><strong>Fixed</strong> at creation</td><td>Grows automatically</td></tr>
<tr><td>Primitives</td><td><strong>Yes</strong> — <code>int[]</code> never boxes</td><td>No — <code>List&lt;Integer&gt;</code> boxes every element</td></tr>
<tr><td>Type safety</td><td><strong>Covariant</strong> — unsafe</td><td>Invariant — checked at compile time</td></tr>
<tr><td>Length</td><td><code>a.length</code> (field)</td><td><code>list.size()</code> (method)</td></tr>
<tr><td>Use for</td><td>Fixed size, primitives, hot loops</td><td>Everything else</td></tr>
</table>
<pre><code>// ARRAY COVARIANCE — a hole in the type system, kept for compatibility
Object[] objects = new String[3];      // compiles
objects[0] = 42;                        // ArrayStoreException at RUNTIME

List&lt;Object&gt; l = new ArrayList&lt;String&gt;();   // ✗ does not compile — generics
                                              // are invariant, and that is why</code></pre>
<pre><code>// Three Arrays.asList traps in one place
List&lt;String&gt; l = Arrays.asList("a", "b");
l.add("c");        // UnsupportedOperationException — FIXED SIZE, not immutable
l.set(0, "z");     // works, and writes through to the backing array

int[] prims = {1, 2, 3};
Arrays.asList(prims).size();     // 1 — a List&lt;int[]&gt; holding ONE array

// ✔ Modern equivalents
List.of("a", "b");                       // genuinely immutable
new ArrayList&lt;&gt;(List.of("a", "b"));      // mutable copy
Arrays.stream(prims).boxed().toList();   // int[] -&gt; List&lt;Integer&gt;</code></pre>
<pre><code>// Equality and copying
int[] a = {1,2,3}, b = {1,2,3};
a.equals(b);                 // FALSE — arrays use identity equality
Arrays.equals(a, b);         // true
Arrays.deepEquals(x, y);     // nested arrays
Arrays.toString(a);          // "[1, 2, 3]"; plain toString gives [I@1b6d3586

int[] grown = Arrays.copyOf(a, 5);
System.arraycopy(src, 0, dst, 0, len);   // fastest — a JIT intrinsic</code></pre>
<p><strong>The performance case:</strong> <code>int[]</code> stores values contiguously with no object headers, so a million ints cost about 4 MB against roughly 20 MB for <code>List&lt;Integer&gt;</code> — and the tight layout is far friendlier to the CPU cache. That is why DSA problems and hot numeric loops use arrays while application code uses collections.</p>`
}
]);
