registerPrimer("java-collections", `<p class="pr-lead">A <b>collection</b> is an object that holds many other objects: a list of orders, a set of unique email addresses, a map from product id to price. Java gives you ready-made collections, and choosing the right one makes your code both simpler and faster.</p>
<div class="pr-analogy"><b>Think of it like this</b>A <b>List</b> is a numbered queue of people: order matters and the same person can appear twice. A <b>Set</b> is a guest list: each name appears only once. A <b>Map</b> is a phone book: you look up a name (the key) to find a number (the value).</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>List</dt><dd>An ordered collection that allows duplicates. You can get items by position: the first, the fifth, and so on.</dd>
<dt>Set</dt><dd>A collection with no duplicates. Adding something that is already there does nothing.</dd>
<dt>Map</dt><dd>Pairs of key and value. Each key appears once and leads to one value.</dd>
<dt>Queue / Deque</dt><dd>A line of items waiting to be processed. A deque ("deck") lets you add and remove at both ends, so it also works as a stack.</dd>
<dt>hashCode()</dt><dd>A number calculated from an object, used by hash-based collections to decide where to store it.</dd>
<dt>equals()</dt><dd>The method that decides whether two objects count as "the same" item.</dd>
<dt>Big-O, e.g. O(1), O(n)</dt><dd>A way to describe speed as the collection grows. <b>O(1)</b>: about the same time no matter how big it gets. <b>O(n)</b>: time grows in step with the number of items. <b>O(log n)</b>: grows very slowly.</dd>
</dl>

<h3>Step 1: choose the shape, then the class</h3>
<ol class="pr-steps">
<li><b>Do you need to look things up by a key?</b> Use a Map. The everyday choice is <code>HashMap</code>. Use <code>LinkedHashMap</code> to remember the order items were added, or <code>TreeMap</code> to keep keys sorted.</li>
<li><b>Must every item be unique?</b> Use a Set. The everyday choice is <code>HashSet</code>. Use <code>LinkedHashSet</code> to keep insertion order, or <code>TreeSet</code> to keep it sorted.</li>
<li><b>Just a sequence of items?</b> Use a List. The everyday choice is <code>ArrayList</code>. You will almost never need <code>LinkedList</code>.</li>
<li><b>Items waiting their turn?</b> Use <code>ArrayDeque</code> as a queue or stack, or <code>PriorityQueue</code> when the smallest (or most important) item should come out first.</li>
<li><b>Shared between threads?</b> Use the concurrent versions such as <code>ConcurrentHashMap</code>.</li>
</ol>

<h3>Step 2: how a HashMap finds a value so quickly</h3>
<p>A HashMap is really an array of slots called <b>buckets</b>. When you <code>put(key, value)</code>:</p>
<ol class="pr-steps">
<li>Java calls <code>key.hashCode()</code> to get a number.</li>
<li>It turns that number into a bucket position in the array.</li>
<li>It stores the key and value in that bucket.</li>
</ol>
<p>When you later call <code>get(key)</code>, Java does the same calculation, jumps straight to that one bucket, and uses <code>equals()</code> to find the matching key inside it. It never searches the whole map, which is why a lookup takes about the same time whether the map holds 10 items or 10 million.</p>
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
<p>Sometimes two different keys land in the same bucket. That is called a <b>collision</b>, and it is normal: both are stored in that bucket and <code>equals()</code> tells them apart. When the map gets about 75% full, it doubles its number of buckets and spreads the entries out again, so buckets stay small.</p>

<h3>A worked example: counting words</h3>
<pre><code>String[] words = {"apple", "kiwi", "apple", "mango", "apple"};

Map&lt;String, Integer&gt; counts = new HashMap&lt;&gt;();
for (String w : words) {
    counts.merge(w, 1, Integer::sum);
}
System.out.println(counts);   // {apple=3, kiwi=1, mango=1}  (order may vary)</code></pre>
<ol class="pr-steps">
<li>We need to go from a word to its count, so a Map is the right shape.</li>
<li><code>merge(w, 1, Integer::sum)</code> means: if the word is not in the map yet, store 1; if it is, add 1 to the existing count.</li>
<li>"apple" appears three times, so its count ends at 3.</li>
<li>A plain HashMap does not keep any particular order. If you need the words in the order they first appeared, use a <code>LinkedHashMap</code> instead.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Removing items from a list inside a for-each loop</p>
<p>Changing a list while a for-each loop is walking through it makes Java stop with a <code>ConcurrentModificationException</code>. It is protecting you from skipping or repeating items.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use <code>list.removeIf(x -&gt; condition)</code>, or remove through an Iterator's own <code>remove()</code> method.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using your own class as a map key without equals() and hashCode()</p>
<p>By default, two objects with the same data are still treated as different keys, because Java compares their memory addresses. Your lookups then fail even though "the same" key is in the map.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> override both <code>equals()</code> and <code>hashCode()</code> using the same fields, or use a <code>record</code>, which does it for you.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Changing a key after putting it in a map</p>
<p>The map chose a bucket based on the key's hash code at the moment you added it. If you then change a field that the hash code depends on, the entry is sitting in the wrong bucket and can no longer be found.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> only use keys that cannot change, such as Strings, numbers or records.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Choosing LinkedList because "inserting is faster"</p>
<p>On paper LinkedList inserts quickly, but in practice ArrayList is faster for almost everything, because its items sit next to each other in memory and the computer reads them very efficiently.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use <code>ArrayList</code> for lists and <code>ArrayDeque</code> for queues and stacks.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>List keeps order and allows duplicates; Set keeps items unique; Map looks values up by key.</li>
<li>Default choices: <code>ArrayList</code>, <code>HashSet</code>, <code>HashMap</code>, <code>ArrayDeque</code>.</li>
<li>HashMap uses <code>hashCode()</code> to pick a bucket and <code>equals()</code> to find the item in it.</li>
<li>Equal objects must have equal hash codes, and map keys should never change.</li>
<li>Do not change a collection while a for-each loop is walking through it.</li>
</ul>
<p><b>Next:</b> the questions below go inside HashMap, compare similar collections, and cover thread-safe versions.</p>`);

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
