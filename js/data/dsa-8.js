registerPrimer("dsa", `<p class="pr-lead"><b>Data structures</b> are ways of organising data in memory: arrays, lists, hash maps, trees, heaps and graphs. <b>Algorithms</b> are the step-by-step methods that work on them. Picking the right structure is often most of the solution, because each structure makes some operations very fast and others slow.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of organising things at home. A numbered shelf (an <b>array</b>) lets you grab item number 5 instantly. A labelled drawer system (a <b>hash map</b>) lets you find "passport" immediately by its label. A queue of tasks on a spike (a <b>stack</b>) gives you the newest one first. A family tree (a <b>tree</b>) shows who belongs under whom. None is best for everything; you choose based on what you need to do most often.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Array / ArrayList</dt><dd>Items in numbered positions. Instant access by position; slow to insert in the middle.</dd>
<dt>Linked list</dt><dd>A chain of nodes, each pointing to the next. Easy to insert; slow to reach a position.</dd>
<dt>Hash map / hash set</dt><dd>Stores items by key for almost instant lookup, with no particular order.</dd>
<dt>Stack / queue</dt><dd>Last in, first out, and first in, first out.</dd>
<dt>Tree / BST</dt><dd>A hierarchy of nodes. A binary search tree keeps values sorted for fast searching.</dd>
<dt>Heap</dt><dd>Always gives you the smallest (or largest) item quickly.</dd>
<dt>Graph</dt><dd>Things connected by links, such as cities and roads.</dd>
<dt>Big O</dt><dd>How the work grows as the data grows: O(1) constant, O(log n), O(n), O(n²).</dd>
</dl>

<h3>Step by step: picking the right structure</h3>
<ol class="pr-steps">
<li>Ask: <b>which operation will this problem do most often?</b> Look up by key, find the smallest, keep things sorted, or access by position?</li>
<li><b>Look up by key or "have I seen this?":</b> hash map or hash set, O(1).</li>
<li><b>Always need the smallest or largest:</b> heap (<code>PriorityQueue</code>), O(log n) per operation.</li>
<li><b>Need sorted order or ranges</b> ("all keys between 10 and 20"): <code>TreeMap</code>, O(log n).</li>
<li><b>Access by position:</b> array or <code>ArrayList</code>, O(1).</li>
<li><b>If no single structure makes every operation fast, combine two</b>, such as a hash map with a linked list.</li>
</ol>
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

<h3>A worked example: an LRU cache from two structures</h3>
<p><b>The task:</b> a cache that holds a fixed number of items, where <code>get</code> and <code>put</code> are instant, and when it is full, the least recently used item is removed.</p>
<pre><code>HashMap: key -&gt; node        finds any item instantly
Doubly linked list           keeps items in order of use:
                             most recent at the front, oldest at the back

get(key):  find the node in the map, move it to the front, return its value
put(key):  add or update the node and move it to the front;
           if the cache is too big, remove the node at the back
           and delete its key from the map</code></pre>
<ol class="pr-steps">
<li>A hash map alone finds items instantly, but does not know which item is the oldest.</li>
<li>A linked list alone keeps the order of use, but finding a key means walking the whole list.</li>
<li>Together, the map finds the node instantly and the list moves or removes it instantly, so every operation is O(1).</li>
<li>The list must be <b>doubly</b> linked, because removing a node from the middle needs access to the node before it.</li>
<li>Java's <code>LinkedHashMap</code> already combines the two; mention it, then build it by hand, because that is what the interviewer is testing.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Using a list for "have I seen this?"</p>
<p><code>list.contains(x)</code> checks every element, so inside a loop it makes the whole solution O(n²).</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use a <code>HashSet</code>, whose <code>contains</code> is O(1).</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Sorting when you only need the top few</p>
<p>Sorting everything is O(n log n) even when you only need the 5 largest items.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> keep a heap of size k, which is O(n log k).</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Memorising solutions instead of patterns</p>
<p>A slightly changed problem then looks completely new and you get stuck.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> learn the patterns (two pointers, sliding window, BFS, DP) and practise recognising which one a problem needs.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Choose a structure by the operation you need to be fast.</li>
<li>Hash map for lookups, heap for smallest or largest, TreeMap for sorted order.</li>
<li>Combine structures when one cannot do everything quickly.</li>
<li>Know the Big O of everyday operations, such as <code>list.contains</code> being O(n).</li>
<li>Learn patterns, not individual answers.</li>
</ul>
<p><b>Next:</b> the questions below cover the core structures, the main problem-solving patterns and how to approach a new problem in an interview.</p>`);

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
