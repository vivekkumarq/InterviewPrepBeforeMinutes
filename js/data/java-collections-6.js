registerPrimer("java-collections", `<h3>The mental model: pick the shape first, then the implementation</h3>
<p>Every collection question starts with one choice: what <strong>shape</strong> is your data? An ordered sequence with duplicates is a <code>List</code>. A group of unique things is a <code>Set</code>. A lookup from key to value is a <code>Map</code>. Items waiting to be processed go in a <code>Queue</code> or <code>Deque</code>. Only after that do you pick the class, and the class decides the speed and the ordering.</p>
<table>
<tr><th>Shape</th><th>Default choice</th><th>Pick instead when you need</th></tr>
<tr><td>List</td><td><code>ArrayList</code></td><td>Almost never <code>LinkedList</code>; <code>CopyOnWriteArrayList</code> for rarely-written lists read by many threads</td></tr>
<tr><td>Set</td><td><code>HashSet</code></td><td><code>LinkedHashSet</code> to keep insertion order; <code>TreeSet</code> for sorted order and range queries</td></tr>
<tr><td>Map</td><td><code>HashMap</code></td><td><code>LinkedHashMap</code> for order or an LRU cache; <code>TreeMap</code> for sorted keys; <code>ConcurrentHashMap</code> across threads</td></tr>
<tr><td>Queue / stack</td><td><code>ArrayDeque</code></td><td><code>PriorityQueue</code> for "smallest first"; a <code>BlockingQueue</code> between threads</td></tr>
</table>
<h3>How a HashMap finds your value in one step</h3>
<p>A <code>HashMap</code> is an array of <strong>buckets</strong>. To store a key it turns the key's <code>hashCode()</code> into an array index, and puts the entry in that bucket. To look it up later it does the same maths, jumps straight to the bucket, and uses <code>equals()</code> to find the right entry inside it. That is why a get is O(1) on average, and why <code>hashCode</code> and <code>equals</code> must agree.</p>
<figure class="fig">
<svg viewBox="0 0 620 236" role="img" aria-label="HashMap put: hashCode, spread, index into a bucket array, entries chained in a bucket">
  <defs><marker id="pr-col" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="10" y="16" width="120" height="44" rx="8"/>
  <text class="dg-m" x="70" y="36" text-anchor="middle">put("apple", 5)</text>
  <text class="dg-s" x="70" y="52" text-anchor="middle">your call</text>
  <line class="dg-line" x1="130" y1="38" x2="158" y2="38" marker-end="url(#pr-col)"/>
  <rect class="dg-box" x="160" y="16" width="136" height="44" rx="8"/>
  <text class="dg-t" x="228" y="36" text-anchor="middle">h = hashCode()</text>
  <text class="dg-s" x="228" y="52" text-anchor="middle">93029210</text>
  <line class="dg-line" x1="296" y1="38" x2="324" y2="38" marker-end="url(#pr-col)"/>
  <rect class="dg-box" x="326" y="16" width="130" height="44" rx="8"/>
  <text class="dg-t" x="391" y="36" text-anchor="middle">h ^ (h &gt;&gt;&gt; 16)</text>
  <text class="dg-s" x="391" y="52" text-anchor="middle">mix high bits down</text>
  <line class="dg-line" x1="456" y1="38" x2="484" y2="38" marker-end="url(#pr-col)"/>
  <rect class="dg-fill2" x="486" y="16" width="124" height="44" rx="8"/>
  <text class="dg-t" x="548" y="36" text-anchor="middle">(n - 1) &amp; hash</text>
  <text class="dg-s" x="548" y="52" text-anchor="middle">index 0 .. n-1</text>
  <text class="dg-s" x="12" y="96">table (n = 16)</text>
  <rect class="dg-box" x="12" y="104" width="36" height="26"/><text class="dg-s" x="30" y="121" text-anchor="middle">0</text>
  <rect class="dg-fill" x="48" y="104" width="36" height="26"/><text class="dg-m" x="66" y="121" text-anchor="middle">1</text>
  <rect class="dg-box" x="84" y="104" width="36" height="26"/><text class="dg-s" x="102" y="121" text-anchor="middle">…</text>
  <rect class="dg-box" x="120" y="104" width="36" height="26"/><text class="dg-s" x="138" y="121" text-anchor="middle">9</text>
  <rect class="dg-box" x="156" y="104" width="36" height="26"/><text class="dg-s" x="174" y="121" text-anchor="middle">…</text>
  <rect class="dg-box" x="192" y="104" width="36" height="26"/><text class="dg-s" x="210" y="121" text-anchor="middle">15</text>
  <line class="dg-line" x1="548" y1="60" x2="76" y2="102" marker-end="url(#pr-col)"/>
  <line class="dg-line" x1="66" y1="130" x2="66" y2="158" marker-end="url(#pr-col)"/>
  <rect class="dg-fill2" x="12" y="160" width="116" height="30" rx="6"/>
  <text class="dg-m" x="70" y="180" text-anchor="middle">"cherry" = 7</text>
  <line class="dg-line" x1="128" y1="175" x2="158" y2="175" marker-end="url(#pr-col)"/>
  <rect class="dg-fill" x="160" y="160" width="116" height="30" rx="6"/>
  <text class="dg-m" x="218" y="180" text-anchor="middle">"apple" = 5</text>
  <text class="dg-s" x="292" y="172">"cherry" also lands in bucket 1:</text>
  <text class="dg-s" x="292" y="188">a COLLISION. Entries chain; equals() picks one</text>
  <text class="dg-s" x="12" y="224">8+ entries in one bucket (and 64+ buckets): the chain becomes a red-black tree, O(log n) worst case</text>
</svg>
<figcaption>hashCode picks the bucket, equals picks the entry. Once the entry count passes 75% of the table size, the table doubles and entries are redistributed.</figcaption>
</figure>
<h3>Worked example: why a broken hashCode is slow, not wrong</h3>
<pre><code>class BadKey {
    final String id;
    BadKey(String id) { this.id = id; }
    @Override public boolean equals(Object o) {
        return o instanceof BadKey k &amp;&amp; k.id.equals(id);
    }
    @Override public int hashCode() { return 42; }   // legal, and terrible
}

Map&lt;BadKey, Integer&gt; m = new HashMap&lt;&gt;();
for (int i = 0; i &lt; 100_000; i++) m.put(new BadKey("k" + i), i);
// Still CORRECT: every get finds the right value, because equals decides.
// But every key sits in ONE bucket. Without the Java 8 tree bins every get
// would walk a list of 100,000 entries. With them it is O(log n): better,
// but still far from the O(1) you expected.</code></pre>
<p><strong>The rule that falls out of the picture:</strong> equal objects must have equal hash codes (or a lookup looks in the wrong bucket and misses), but unequal objects may share one (they just end up in the same bucket). Breaking the first rule loses data. Breaking the spirit of the second only costs speed.</p>
<h3>Big-O you should know without thinking</h3>
<table>
<tr><th>Operation</th><th>ArrayList</th><th>HashMap / HashSet</th><th>TreeMap / TreeSet</th><th>ArrayDeque</th></tr>
<tr><td>Get by index / key</td><td>O(1)</td><td>O(1) average</td><td>O(log n)</td><td>—</td></tr>
<tr><td>Add at end / put</td><td>O(1) amortised</td><td>O(1) average</td><td>O(log n)</td><td>O(1) at either end</td></tr>
<tr><td>Insert / remove in the middle</td><td>O(n)</td><td>—</td><td>—</td><td>—</td></tr>
<tr><td>contains(value)</td><td>O(n)</td><td>O(1) average</td><td>O(log n)</td><td>O(n)</td></tr>
<tr><td>Iterate in sorted order</td><td>Sort first, O(n log n)</td><td>No order</td><td>O(n), already sorted</td><td>Insertion order</td></tr>
</table>`);

appendTopic("java-collections", [
{
  q: "Why does a mutable key break a HashMap? Show the entry that gets lost",
  level: "advanced", hot: true, tags: ["hashmap", "hashcode", "immutability", "must-know"],
  companies: ["Amazon", "Goldman Sachs", "Microsoft", "Oracle", "Adobe", "Infosys", "Flipkart"],
  a: `<p>A HashMap decides <strong>which bucket</strong> an entry lives in once, at the moment you call <code>put</code>, using the key's hash code at that moment. If you then change a field that <code>hashCode()</code> reads, the key's hash changes but the entry does not move. It is now sitting in the wrong bucket, and no lookup will ever look there.</p>
<pre><code>class Employee {
    String email;                                // mutable, and used in hashCode
    Employee(String e) { email = e; }
    @Override public boolean equals(Object o) {
        return o instanceof Employee e &amp;&amp; e.email.equals(email);
    }
    @Override public int hashCode() { return email.hashCode(); }
}

Map&lt;Employee, String&gt; desk = new HashMap&lt;&gt;();
Employee asha = new Employee("asha@corp.com");
desk.put(asha, "Desk 14");                       // stored in the bucket for hash A

asha.email = "asha.k@corp.com";                  // hash is now B; the entry did NOT move

desk.get(asha);                                  // null   - looks in bucket B, empty
desk.containsKey(asha);                          // false
desk.get(new Employee("asha@corp.com"));         // null   - right bucket, but equals()
                                                 //          now compares the NEW email
desk.size();                                     // 1      - it is still in there
desk.remove(asha);                               // null   - and you cannot remove it</code></pre>
<p>The entry is <strong>still in the map</strong>: <code>size()</code> counts it and iterating finds it. It is just unreachable by key. In a long-running service that is a memory leak with no error message: a cache that grows forever while every lookup misses.</p>
<table>
<tr><th>Situation</th><th>Result</th></tr>
<tr><td>Change a field used by <code>hashCode</code> after <code>put</code></td><td>Entry stranded in the wrong bucket; get and remove both fail</td></tr>
<tr><td>Same thing with a <code>HashSet</code></td><td><code>contains</code> returns false; <code>add</code> puts in a second copy, so the "set" now has duplicates</td></tr>
<tr><td>Same thing with a <code>TreeMap</code></td><td>The tree's ordering is broken; lookups for <em>other</em> keys can fail too</td></tr>
<tr><td>Change a field NOT used by equals/hashCode</td><td>Harmless</td></tr>
</table>
<p><strong>The fixes, in order of preference:</strong></p>
<pre><code>// 1. Make keys immutable. Records are perfect for this.
record EmployeeKey(String email) {}

// 2. Key by a stable identifier instead of the whole object.
Map&lt;Long, String&gt; deskByEmployeeId = new HashMap&lt;&gt;();

// 3. If you truly must change a key: remove, change, re-insert.
String d = desk.remove(asha);
asha.email = "asha.k@corp.com";
desk.put(asha, d);</code></pre>
<p><strong>Why String, Integer and the other wrappers are immutable</strong> is partly this exact reason. They are the most common map keys in Java, and a key that can change under the map is a key that can silently disappear.</p>
<p><strong>The JPA version of this bug:</strong> an entity whose <code>hashCode</code> uses its generated <code>id</code>. Put a new, unsaved entity in a <code>HashSet</code> (id is null), save it (id becomes 42), and the set can no longer find it. The usual fix is to base equals/hashCode on a natural business key, or to return a constant hash code for entities.</p>`
},
{
  q: "Count word frequencies three ways: merge, compute and groupingBy. Which do you use when?",
  level: "beginner", hot: true, tags: ["hashmap", "streams", "counting", "must-know"],
  companies: ["Amazon", "Microsoft", "Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Capgemini"],
  a: `<p>"Count how many times each word appears" is probably the most common collections warm-up. Everyone can write it with <code>containsKey</code>. The point is to show you know the Java 8 map methods that make it one line, and to know which one to reach for.</p>
<pre><code>String text = "the cat and the hat and the bat";
String[] words = text.split("\\\\s+");

// 0. The long way. Two lookups per word, and easy to get wrong.
Map&lt;String, Integer&gt; counts = new HashMap&lt;&gt;();
for (String w : words) {
    if (counts.containsKey(w)) counts.put(w, counts.get(w) + 1);
    else counts.put(w, 1);
}

// 1. merge: "put 1, or combine with what is there using Integer::sum"
Map&lt;String, Integer&gt; byMerge = new HashMap&lt;&gt;();
for (String w : words) byMerge.merge(w, 1, Integer::sum);

// 2. compute / computeIfAbsent: when the value is a CONTAINER, not a number
Map&lt;Character, List&lt;String&gt;&gt; byFirstLetter = new HashMap&lt;&gt;();
for (String w : words)
    byFirstLetter.computeIfAbsent(w.charAt(0), k -&gt; new ArrayList&lt;&gt;()).add(w);

// 3. groupingBy + counting: when you already have a stream
Map&lt;String, Long&gt; byStream = Arrays.stream(words)
        .collect(Collectors.groupingBy(w -&gt; w, Collectors.counting()));

// All three counts: {the=3, and=2, cat=1, hat=1, bat=1} (HashMap order varies)</code></pre>
<table>
<tr><th>Method</th><th>Best for</th><th>Note</th></tr>
<tr><td><code>merge(k, v, fn)</code></td><td>Counters and sums</td><td>Returning <code>null</code> from <code>fn</code> <strong>removes</strong> the key, which is handy for decrementing to zero</td></tr>
<tr><td><code>computeIfAbsent(k, fn)</code></td><td>Building a map of lists or sets</td><td>Never use it just to insert a default number; <code>merge</code> is clearer</td></tr>
<tr><td><code>getOrDefault(k, d)</code></td><td>Reading without creating an entry</td><td><code>counts.getOrDefault("dog", 0)</code> is 0 and adds nothing</td></tr>
<tr><td><code>groupingBy + counting</code></td><td>The data is already a stream</td><td>Gives <code>Long</code>, not <code>Integer</code>. Pass a map factory for ordering</td></tr>
</table>
<pre><code>// The usual follow-ups, each one line:

// "Now give me the top 2 words"
byStream.entrySet().stream()
        .sorted(Map.Entry.&lt;String, Long&gt;comparingByValue().reversed())
        .limit(2)
        .forEach(e -&gt; System.out.println(e.getKey() + " " + e.getValue()));   // the 3, and 2

// "Keep the words in alphabetical order"
Map&lt;String, Long&gt; sorted = Arrays.stream(words)
        .collect(Collectors.groupingBy(w -&gt; w, TreeMap::new, Collectors.counting()));

// "Ignore case and punctuation"
Arrays.stream(text.toLowerCase().split("[^a-z]+"))
      .filter(w -&gt; !w.isEmpty())
      .collect(Collectors.groupingBy(w -&gt; w, Collectors.counting()));

// "Now do it from many threads at once"
ConcurrentHashMap&lt;String, Long&gt; shared = new ConcurrentHashMap&lt;&gt;();
shared.merge(word, 1L, Long::sum);    // atomic per key on ConcurrentHashMap.
                                      // counts.put(w, counts.get(w) + 1) is NOT.</code></pre>
<p><strong>What to say:</strong> "<code>merge</code> for counters, <code>computeIfAbsent</code> for multimaps, <code>groupingBy</code> when it is already a stream. On a <code>ConcurrentHashMap</code> the same <code>merge</code> call is atomic, so the single-threaded version becomes thread-safe by changing only the map type."</p>`
}
]);
