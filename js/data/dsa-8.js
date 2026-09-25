registerPrimer("dsa", `<h3>The mental model: pick the structure by the operation you need to be fast</h3>
<p>Every data structure makes some operations cheap by making others expensive. An array gives instant access by position but slow insertion in the middle. A hash map gives instant lookup by key but no order. A heap gives the smallest item instantly but cannot search. So the question is never "which structure is best", but <strong>"which operation does this problem do most often?"</strong>. Name that operation, and the structure follows.</p>
<figure class="fig">
<svg viewBox="0 0 620 244" role="img" aria-label="Choosing a data structure from the operation a problem needs most: lookup, order, min or max, prefix, recency, connectivity">
  <defs><marker id="pr-dsa" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="10" y="98" width="130" height="48" rx="9"/><text class="dg-t" x="75" y="118" text-anchor="middle">What must be</text><text class="dg-t" x="75" y="134" text-anchor="middle">fast?</text>
  <line class="dg-line" x1="140" y1="112" x2="206" y2="30" marker-end="url(#pr-dsa)"/>
  <line class="dg-line" x1="140" y1="116" x2="206" y2="66" marker-end="url(#pr-dsa)"/>
  <line class="dg-line" x1="140" y1="120" x2="206" y2="102" marker-end="url(#pr-dsa)"/>
  <line class="dg-line" x1="140" y1="126" x2="206" y2="138" marker-end="url(#pr-dsa)"/>
  <line class="dg-line" x1="140" y1="130" x2="206" y2="174" marker-end="url(#pr-dsa)"/>
  <line class="dg-line" x1="140" y1="134" x2="206" y2="210" marker-end="url(#pr-dsa)"/>
  <text class="dg-s" x="212" y="34">"have I seen X?"  lookup by key</text><text class="dg-m" x="470" y="34">HashMap / HashSet</text>
  <text class="dg-s" x="212" y="70">sorted order, floor / ceiling, ranges</text><text class="dg-m" x="470" y="70">TreeMap / TreeSet</text>
  <text class="dg-s" x="212" y="106">smallest or largest, repeatedly</text><text class="dg-m" x="470" y="106">PriorityQueue</text>
  <text class="dg-s" x="212" y="142">most recent unfinished thing</text><text class="dg-m" x="470" y="142">Stack (ArrayDeque)</text>
  <text class="dg-s" x="212" y="178">words by prefix</text><text class="dg-m" x="470" y="178">Trie</text>
  <text class="dg-s" x="212" y="214">"are A and B connected?", merging</text><text class="dg-m" x="470" y="214">Union-Find</text>
</svg>
<figcaption>When one structure cannot make every needed operation fast, combine two (a map plus a list, a map plus a heap).</figcaption>
</figure>
<h3>Worked example: combining structures for an LRU cache</h3>
<p><strong>Requirement:</strong> <code>get(key)</code> and <code>put(key, value)</code> in O(1), evicting the least recently used entry when full. No single structure does both "find by key fast" and "know the oldest item and move items to the front fast".</p>
<pre><code>HashMap    : key -&gt; node          O(1) find
Doubly linked list of nodes      O(1) move to front, O(1) remove from back
Together   : every operation O(1)

// Java already ships the combination:
class LruCache&lt;K, V&gt; extends LinkedHashMap&lt;K, V&gt; {
    private final int capacity;
    LruCache(int capacity) {
        super(16, 0.75f, true);          // true = order by ACCESS, not insertion
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry&lt;K, V&gt; eldest) {
        return size() &gt; capacity;        // evict the least recently used
    }
}
// In an interview, mention this, then build it by hand with the map and
// the doubly linked list, because that is what is being tested.</code></pre>
<h3>Operation costs to know without thinking</h3>
<table>
<tr><th>Structure</th><th>Access</th><th>Search</th><th>Insert / delete</th><th>Note</th></tr>
<tr><td>Array / ArrayList</td><td>O(1)</td><td>O(n)</td><td>O(n) middle, O(1) end</td><td>Cache-friendly, the default</td></tr>
<tr><td>Linked list</td><td>O(n)</td><td>O(n)</td><td>O(1) with a reference to the node</td><td>Rarely the right choice alone</td></tr>
<tr><td>HashMap</td><td>—</td><td>O(1) average</td><td>O(1) average</td><td>No ordering</td></tr>
<tr><td>TreeMap (red-black)</td><td>—</td><td>O(log n)</td><td>O(log n)</td><td>Sorted; floor, ceiling, ranges</td></tr>
<tr><td>Heap</td><td>O(1) min only</td><td>O(n)</td><td>O(log n)</td><td>Top-k, scheduling, Dijkstra</td></tr>
<tr><td>Trie</td><td>—</td><td>O(word length)</td><td>O(word length)</td><td>Autocomplete, prefix counts</td></tr>
<tr><td>Union-Find</td><td>—</td><td>~O(1)</td><td>~O(1) union</td><td>Connectivity, grouping</td></tr>
</table>`);

appendTopic("dsa", [
{
  q: "Design a set with insert, delete and getRandom, all in O(1)",
  level: "advanced", hot: true, tags: ["design", "hashing", "arrays", "must-know"],
  companies: ["Google", "Amazon", "Meta", "Microsoft", "Uber", "LinkedIn", "Twitter"],
  a: `<div class="cx"><b>O(1) average</b><span>every operation</span><b>O(n) space</b><span>a list plus a map</span></div>
<p>Support <code>insert(x)</code>, <code>remove(x)</code> and <code>getRandom()</code> (every element equally likely), each in O(1) average time. It is a perfect "combine two structures" question.</p>
<table>
<tr><th>Structure alone</th><th>insert</th><th>remove</th><th>getRandom</th></tr>
<tr><td>HashSet</td><td>O(1)</td><td>O(1)</td><td><strong>O(n)</strong>: no index to pick from</td></tr>
<tr><td>ArrayList</td><td>O(1) at end</td><td><strong>O(n)</strong>: find it, then shift</td><td>O(1): random index</td></tr>
<tr><td>Both together</td><td>O(1)</td><td>O(1), with one trick</td><td>O(1)</td></tr>
</table>
<p><strong>The trick for removal:</strong> removing from the middle of an array is slow only because everything after it shifts. But order does not matter here, so <strong>move the last element into the hole</strong> and remove the last slot, which is O(1). The map, from value to index, tells you where the hole is and must be updated for the moved element.</p>
<pre><code>class RandomizedSet {
    private final List&lt;Integer&gt; values = new ArrayList&lt;&gt;();
    private final Map&lt;Integer, Integer&gt; indexOf = new HashMap&lt;&gt;();
    private final Random random = new Random();

    public boolean insert(int x) {
        if (indexOf.containsKey(x)) return false;
        indexOf.put(x, values.size());
        values.add(x);
        return true;
    }

    public boolean remove(int x) {
        Integer i = indexOf.get(x);
        if (i == null) return false;
        int last = values.get(values.size() - 1);
        values.set(i, last);                 // 1. move the last element into the hole
        indexOf.put(last, i);                // 2. record its new position
        values.remove(values.size() - 1);    // 3. drop the last slot: O(1)
        indexOf.remove(x);                   // 4. forget x
        return true;
    }

    public int getRandom() {
        return values.get(random.nextInt(values.size()));
    }
}</code></pre>
<pre><code>Trace: insert 10, 20, 30, then remove 10

values  [10, 20, 30]       indexOf {10:0, 20:1, 30:2}
remove 10: i = 0, last = 30
  values.set(0, 30)   -&gt; [30, 20, 30]
  indexOf.put(30, 0)  -&gt; {10:0, 20:1, 30:0}
  remove last slot    -&gt; [30, 20]
  indexOf.remove(10)  -&gt; {20:1, 30:0}       consistent again</code></pre>
<table>
<tr><th>Bug</th><th>Result</th></tr>
<tr><td>Removing <code>x</code> from the map <em>before</em> updating <code>last</code></td><td>When x is itself the last element, the <code>put</code> re-adds it: a ghost entry</td></tr>
<tr><td><code>values.remove(i)</code> instead of swapping</td><td>Correct, but O(n) because of the shift</td></tr>
<tr><td><code>values.remove(x)</code> with an <code>int</code></td><td>Java calls <code>remove(int index)</code>, not <code>remove(Object)</code>: removes the wrong element or throws</td></tr>
</table>
<p><strong>Follow-up: allow duplicates.</strong> Map each value to a <em>set</em> of indices (<code>Map&lt;Integer, Set&lt;Integer&gt;&gt;</code>). Removal takes any one index from the set; the swap then updates the moved element's index set. getRandom stays uniform over all copies, which is usually what is wanted.</p>`
},
{
  q: "Design a time-based key-value store: get the value as of any timestamp",
  level: "advanced", hot: true, tags: ["design", "binary-search", "treemap", "versioning"],
  companies: ["Google", "Amazon", "Uber", "Netflix", "Stripe", "Atlassian", "Databricks"],
  a: `<div class="cx"><b>O(log k) get</b><span>binary search over one key's versions</span><b>O(1) set</b><span>when timestamps only increase</span></div>
<p><code>set(key, value, timestamp)</code> stores a version. <code>get(key, timestamp)</code> returns the value set at the <strong>largest timestamp that is not after</strong> the one asked for, or empty if there is none. It is how configuration history, price history and database snapshots work.</p>
<pre><code>set("price", "100", 1)
set("price", "120", 4)
get("price", 3)   -&gt; "100"     (latest version at or before time 3 is t=1)
get("price", 4)   -&gt; "120"
get("price", 9)   -&gt; "120"
get("price", 0)   -&gt; ""        (nothing existed yet)</code></pre>
<p><strong>Version 1: TreeMap per key.</strong> <code>floorEntry(t)</code> is exactly "largest key at or below t".</p>
<pre><code>class TimeMap {
    private final Map&lt;String, TreeMap&lt;Integer, String&gt;&gt; store = new HashMap&lt;&gt;();

    public void set(String key, String value, int timestamp) {
        store.computeIfAbsent(key, k -&gt; new TreeMap&lt;&gt;()).put(timestamp, value);
    }

    public String get(String key, int timestamp) {
        TreeMap&lt;Integer, String&gt; versions = store.get(key);
        if (versions == null) return "";
        Map.Entry&lt;Integer, String&gt; e = versions.floorEntry(timestamp);
        return e == null ? "" : e.getValue();
    }
}
// set O(log k), get O(log k), k = versions of that key. Handles timestamps
// arriving in any order.</code></pre>
<p><strong>Version 2: when timestamps always increase</strong> (the usual case, and often stated in the problem), a plain list per key is already sorted. Append in O(1), and binary search for the floor.</p>
<pre><code>class TimeMapList {
    private record Version(int time, String value) {}
    private final Map&lt;String, List&lt;Version&gt;&gt; store = new HashMap&lt;&gt;();

    public void set(String key, String value, int timestamp) {
        store.computeIfAbsent(key, k -&gt; new ArrayList&lt;&gt;()).add(new Version(timestamp, value));
    }

    public String get(String key, int timestamp) {
        List&lt;Version&gt; list = store.get(key);
        if (list == null) return "";
        int lo = 0, hi = list.size() - 1, found = -1;
        while (lo &lt;= hi) {                          // last index with time &lt;= timestamp
            int mid = lo + (hi - lo) / 2;
            if (list.get(mid).time() &lt;= timestamp) { found = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return found == -1 ? "" : list.get(found).value();
    }
}</code></pre>
<table>
<tr><th></th><th>TreeMap per key</th><th>Sorted list per key</th></tr>
<tr><td>set</td><td>O(log k)</td><td>O(1) amortised</td></tr>
<tr><td>get</td><td>O(log k)</td><td>O(log k)</td></tr>
<tr><td>Out-of-order timestamps</td><td>Handled</td><td>Breaks the sort (would need insertion at the right place)</td></tr>
<tr><td>Memory per version</td><td>A tree node (~40+ bytes of overhead)</td><td>One list slot plus the record</td></tr>
</table>
<p><strong>Follow-ups to be ready for:</strong></p>
<ul>
<li><strong>Memory grows forever:</strong> keep only the last N versions, or drop versions older than a retention window (like database MVCC cleanup).</li>
<li><strong>Concurrent access:</strong> <code>ConcurrentHashMap</code> for the outer map, and a <code>ConcurrentSkipListMap</code> (a concurrent sorted map with <code>floorEntry</code>) per key.</li>
<li><strong>Range queries</strong> ("all values between t1 and t2"): <code>subMap(t1, true, t2, true)</code> on the TreeMap version.</li>
</ul>
<p><strong>The pattern to name:</strong> "floor search over sorted versions". Recognising that <code>floorEntry</code> or an upper-bound binary search is the core turns a design question into ten lines of code.</p>`
}
]);
