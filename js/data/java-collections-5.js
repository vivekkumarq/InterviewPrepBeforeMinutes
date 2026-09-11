appendTopic("java-collections", [
{
  q: "How does ConcurrentHashMap achieve thread safety without locking the whole map?",
  level: "advanced", hot: true, tags: ["collections", "concurrency", "internals"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "SAP", "Flipkart", "Barclays", "Optum"],
  a: `<table>
<tr><th></th><th>Java 7</th><th>Java 8+</th></tr>
<tr><td>Strategy</td><td>16 <strong>segments</strong>, each with its own lock</td><td><strong>Per-bucket</strong> CAS + <code>synchronized</code> on the first node</td></tr>
<tr><td>Max concurrency</td><td>The segment count</td><td>Effectively the bucket count</td></tr>
<tr><td>Write into an empty bucket</td><td>Take the segment lock</td><td><strong>Lock-free CAS</strong></td></tr>
<tr><td><code>size()</code></td><td>Lock everything, or retry</td><td>Striped counters summed, like <code>LongAdder</code></td></tr>
</table>
<pre><code>// Writing into an EMPTY bucket costs no lock at all:
if (tab[i] == null &amp;&amp; casTabAt(tab, i, null, newNode)) break;

// Only a COLLISION takes a lock, and only on that one bucket:
synchronized (firstNodeInBucket) { /* append or update */ }

// So N threads hitting N different buckets never contend.</code></pre>
<pre><code>// The atomic compound operations — the real reason to choose it
map.putIfAbsent(k, v);
map.computeIfAbsent(k, key -&gt; expensive(key));   // computed ONCE per key
map.merge(k, 1, Integer::sum);                    // the counter idiom
map.compute(k, (key, old) -&gt; old == null ? 1 : old + 1);

// ✗ NOT atomic even on a ConcurrentHashMap — two calls, a race in between
if (!map.containsKey(k)) map.put(k, v);</code></pre>
<table>
<tr><th>Gotcha</th><th>Detail</th></tr>
<tr><td><strong>No null keys or values</strong></td><td>Unlike <code>HashMap</code>. A null from <code>get</code> would be ambiguous under concurrency — absent, or present-and-null?</td></tr>
<tr><td>Iteration is <strong>weakly consistent</strong></td><td>Never throws CME, but may or may not reflect concurrent writes</td></tr>
<tr><td><code>size()</code> is an estimate</td><td>Exact only at a quiescent moment — never branch on it</td></tr>
<tr><td><code>computeIfAbsent</code> holds the bucket lock</td><td>A slow or recursive mapping function can deadlock that bucket</td></tr>
</table>
<p><strong>Versus the alternatives:</strong> <code>Collections.synchronizedMap</code> wraps every method in one lock — correct, but a single contention point, and compound operations still need external synchronisation. <code>Hashtable</code> is the same idea from 1998. <code>ConcurrentHashMap</code> is the only one where uncontended writes are genuinely parallel.</p>`
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
