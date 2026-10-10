registerSimple("java-collections", {
"How does HashSet guarantee uniqueness internally?":
`A HashSet secretly uses a HashMap: each item you add becomes a key in that map, and keys in a map are always unique. When you add an item, Java uses its <code>hashCode()</code> to find the right bucket and <code>equals()</code> to check whether an equal item is already there. If one is, nothing is added.`,

"What happens when a HashMap resizes, and why was Java 8's change important?":
`When a HashMap gets about 75% full, it creates a table twice as big and moves every entry into its new bucket, so lookups stay fast. In older Java this moving could, when two threads used the map at once, tangle a bucket into a loop and freeze the program. Java 8 changed the moving method to avoid that, but a HashMap is still not safe to share between threads.`,

"How do you iterate and remove safely from a collection?":
`If you remove items from a list while a for-each loop is walking through it, Java stops with an error to stop you skipping items. Safe options: <code>list.removeIf(x -&gt; ...)</code>, or loop with an Iterator and call its own <code>remove()</code>. Also watch out: lists made by <code>List.of()</code> cannot be changed at all.`,

"What is the difference between Queue, Deque, Stack and their implementations?":
`A <b>Queue</b> is first in, first out, like a line at a shop. A <b>Stack</b> is last in, first out, like a pile of plates. A <b>Deque</b> ("deck") lets you add and remove at both ends, so it can act as either. In Java, use <code>ArrayDeque</code> for both; the old <code>Stack</code> class is outdated.`,

"How do you choose the right collection for a given problem?":
`Ask a few questions in order. Do you look things up by key? Use a Map. Must items be unique? Use a Set. Otherwise use a List. Then decide on ordering (none, insertion order, or sorted) and whether several threads share it. Those answers point to a specific class such as HashMap, LinkedHashSet or ConcurrentHashMap.`,

"What is the Iterator design pattern and how do you write a custom Iterable?":
`An Iterator lets you walk through items one by one without knowing how they are stored inside. That is why the same for-each loop works on a list, a set or your own class. To make your own class work in a for-each loop, implement <code>Iterable</code> and return an Iterator with <code>hasNext()</code> and <code>next()</code>.`,

"What is the difference between Collections.emptyList(), new ArrayList<>() and null?":
`<code>new ArrayList&lt;&gt;()</code> is a new, empty list you can add to. <code>Collections.emptyList()</code> and <code>List.of()</code> are shared, empty lists that cannot be changed and cost nothing to create. <code>null</code> means "no list at all" and causes crashes when someone tries to loop over it, so return an empty list instead of null.`,

"How does Comparator.comparing work with nulls and multiple keys?":
`<code>Comparator.comparing(Employee::getDept)</code> builds a sorting rule from a field. You can add tie-breakers with <code>thenComparing(...)</code>, reverse one part with <code>reversed()</code>, and decide where null values go with <code>Comparator.nullsFirst</code> or <code>nullsLast</code>, so sorting does not crash on missing data.`,

"What are the collection view methods and how do they behave?":
`Some methods, such as <code>keySet()</code>, <code>values()</code> and <code>subList()</code>, do not give you a copy. They give you a live "window" onto the original collection. Changing the original changes the view, and removing through the view removes from the original. Make a copy if you need something independent.`,

"What are the sequenced collections added in Java 21?":
`Before Java 21, getting the first or last item looked different for every collection type. Java 21 added a common set of methods for ordered collections: <code>getFirst()</code>, <code>getLast()</code>, <code>addFirst()</code>, <code>removeLast()</code> and <code>reversed()</code>. Now lists, deques and ordered sets all work the same way.`,

"How do you make a defensive copy correctly?":
`If your object stores a list that someone else passed in, they could still change it later and break your object. So copy it when it comes in, and hand out a copy (or a read-only view) when someone asks for it. Copy before checking it, so it cannot be changed between your check and your copy.`,

"How would you implement a thread-safe bounded cache with expiry from scratch?":
`A cache keeps recently used values so you do not recompute them. To make one safe for many threads, store entries in a <code>ConcurrentHashMap</code> with a timestamp, remove entries that are too old, and cap the size by evicting the least recently used. In real projects a tested library such as Caffeine already does all of this.`,

"How would you remove duplicates from a list while preserving order?":
`Put the items into a <code>LinkedHashSet</code>. A Set keeps only one of each item, and the "Linked" version remembers the order they were first added. Then turn it back into a list. A plain HashSet would also remove duplicates but would scramble the order.`,

"How do you sort a HashMap by key and by value?":
`A HashMap has no order, so you sort its entries and put them into a <code>LinkedHashMap</code>, which remembers the order. Sort by key with <code>Map.Entry.comparingByKey()</code>, or by value with <code>comparingByValue()</code>. For always-sorted keys, you can simply use a <code>TreeMap</code>.`,

"What is the internal working of ConcurrentHashMap in Java 8 vs Java 7?":
`ConcurrentHashMap lets many threads use one map safely and quickly. Java 7 split the map into 16 sections, each with its own lock. Java 8 made it finer: reading needs no lock at all, and writing locks only the single bucket being changed, so many threads can write at the same time.`,

"Find the first non-repeating character in a string":
`Count how many times each character appears, then go through the string again in order and return the first character whose count is 1. Using a <code>LinkedHashMap</code> (or a simple array of counts) keeps it to two quick passes over the string.`,

"What is the difference between Iterator and ListIterator, and when do you need ListIterator?":
`A normal Iterator only moves forward and can remove items. A ListIterator works only on lists, can move both forwards and backwards, and can also replace and insert items while you walk through. Use it when you need to edit a list in place during a loop.`,

"How does TreeMap handle null keys and a custom Comparator?":
`A TreeMap keeps its keys sorted, so it must compare them, and comparing with null crashes unless your Comparator says how to handle null. It also decides whether two keys are "the same" using the comparison, not <code>equals()</code>. So if your Comparator says two different keys compare as equal, one will overwrite the other.`,

"Which collection would you choose for each of these scenarios?":
`Match the need to the class. Fast access by position: ArrayList. Unique items in any order: HashSet. Unique items in insertion order: LinkedHashSet. Sorted items: TreeSet or TreeMap. Lookup by key: HashMap. Shared between threads: ConcurrentHashMap. Smallest-first processing: PriorityQueue.`,

"How do you make an ArrayList thread-safe, and what are the trade-offs?":
`You can wrap it with <code>Collections.synchronizedList</code>, which puts a lock around every call, or use <code>CopyOnWriteArrayList</code>, which copies the whole list on every change. The first is fine for mixed use; the second is great when reads are frequent and writes are rare, but slow when writes are common.`,

"What happens when two threads modify a HashMap concurrently?":
`A HashMap is not built for that. Two threads changing it at once can lose entries, read stale or half-written data, or, in old Java versions, even freeze the program. Use <code>ConcurrentHashMap</code> whenever more than one thread writes to a map.`,

"Explain time and space complexity of ArrayList vs LinkedList operations with real numbers":
`ArrayList keeps items side by side in one block of memory, so reading the 1000th item is instant and looping is very fast. LinkedList stores each item in a separate node linked to the next, so reaching the 1000th item means walking 1000 steps, and each node also uses extra memory. In real programs ArrayList almost always wins.`,

"How does HashMap work internally, and what changed in Java 8?":
`A HashMap is an array of buckets. It uses the key's hash code to pick a bucket and <code>equals()</code> to find the key inside it. Before Java 8, a bucket with many keys became a long list that was slow to search. Since Java 8, a crowded bucket turns into a small tree, so even bad cases stay fast.`,

"ArrayList vs LinkedList — and why is LinkedList almost never the right answer?":
`LinkedList only wins at adding or removing at the very start of a list, and even there <code>ArrayDeque</code> is usually better. For everything else, ArrayList is faster and uses less memory, because its items are stored next to each other and computers read neighbouring memory very quickly.`,

"What is fail-fast versus fail-safe iteration, and how do you remove safely?":
`A fail-fast collection (like ArrayList) throws an error if it is changed while you are looping over it, instead of silently giving wrong results. A fail-safe or concurrent collection allows changes during the loop but may not show you the newest ones. To remove safely during a loop, use <code>removeIf</code> or the Iterator's <code>remove()</code>.`,

"Comparable vs Comparator, and how do you sort by multiple fields?":
`<code>Comparable</code> is a class's own default sort order, written inside the class. <code>Comparator</code> is a separate sorting rule you can create whenever you need one. To sort by several fields, chain them: <code>Comparator.comparing(Emp::getDept).thenComparing(Emp::getName)</code>.`,

"Which specialised collections are worth knowing beyond List, Set and Map?":
`A few are worth knowing. <code>EnumMap</code> and <code>EnumSet</code> are tiny and very fast when keys are enum values. <code>PriorityQueue</code> always hands you the smallest item first. <code>ArrayDeque</code> is the best queue and stack. <code>LinkedHashMap</code> can be turned into a simple cache. Each one fits a specific job better than the general versions.`,

"When would you choose an array over a collection, and what are the gotchas?":
`Use an array when the size is fixed and speed matters, especially for numbers: an <code>int[]</code> stores plain numbers with no wrapping. The gotchas: an array cannot grow, <code>equals()</code> and printing do not look at its contents, and it is less type-safe. For most everyday code, a List is easier.`,

"Why does a mutable key break a HashMap? Show the entry that gets lost":
`The map decides which bucket an entry goes in using the key's hash code at the moment you add it. If you later change the key so its hash code changes, the entry stays in the old bucket while lookups go to the new one, so the map can no longer find it. Use keys that never change.`,

"Count word frequencies three ways: merge, compute and groupingBy. Which do you use when?":
`All three build a map of word to count. <code>merge(word, 1, Integer::sum)</code> is the simplest in a loop. <code>compute</code> gives you full control when updating a value. <code>Collectors.groupingBy(w -&gt; w, Collectors.counting())</code> is the natural choice when you are already using a stream.`,

"Draw the Java Collections hierarchy":
`At the top is <code>Collection</code>, with three main branches: <code>List</code> (ordered, duplicates allowed), <code>Set</code> (unique items) and <code>Queue</code> (items waiting their turn). <code>Map</code> is a separate family, because it stores key-value pairs rather than single items. Each branch has several implementations, such as ArrayList, HashSet and HashMap.`,

"ArrayList vs LinkedList — when is LinkedList actually better?":
`Hardly ever. LinkedList is only better when you constantly add or remove at the front or through an iterator in the middle, and even then <code>ArrayDeque</code> usually beats it. ArrayList reads by position instantly and loops much faster because its items sit together in memory.`,

"How does HashMap work internally?":
`It keeps an array of buckets. When you add a key, it calculates the key's hash code, turns that into a bucket number, and stores the entry there. To look a key up, it repeats the calculation, goes straight to that bucket, and uses <code>equals()</code> to find the exact key. When it gets about 75% full, it doubles in size.`,

"What happens if two keys have the same hashCode? And if hashCode is broken?":
`Two keys with the same hash code is normal and is called a collision: both go into the same bucket and <code>equals()</code> tells them apart, so you still get the right value. If <code>hashCode()</code> returns the same number for every key, everything lands in one bucket. The map still works, but becomes much slower.`,

"HashMap vs Hashtable vs ConcurrentHashMap":
`<b>HashMap</b> is fast but not safe for multiple threads, and allows a null key. <b>Hashtable</b> is an old class that locks the whole map for every action, so it is slow; avoid it. <b>ConcurrentHashMap</b> is the modern thread-safe choice: reads do not lock and writes lock only a small part.`,

"HashSet vs LinkedHashSet vs TreeSet":
`All three keep items unique. <b>HashSet</b> is fastest and keeps no order. <b>LinkedHashSet</b> remembers the order items were added. <b>TreeSet</b> keeps items sorted, but is a little slower. Choose by the order you need.`,

"Fail-fast vs fail-safe iterators — what is ConcurrentModificationException?":
`<code>ConcurrentModificationException</code> is the error you get when a collection is changed while you are looping over it. Normal collections check for this and fail straight away ("fail-fast") rather than giving wrong results. Concurrent collections are "fail-safe": they allow the change and keep looping, possibly without showing the newest items.`,

"Comparable vs Comparator":
`<code>Comparable</code> is written inside a class and gives its one natural order, for example sorting employees by id. <code>Comparator</code> is a separate sorting rule you can create any time, for example by name or by salary. Use Comparable for the obvious default, and Comparators for every other ordering.`,

"What is the load factor and initial capacity? How do you size a HashMap correctly?":
`<b>Capacity</b> is how many buckets the map has (16 by default). The <b>load factor</b> (0.75 by default) is how full it may get before doubling in size. If you know you will store about 1,000 items, create the map with room for them upfront, so it does not have to resize several times as it grows.`,

"How does ConcurrentHashMap achieve thread safety without locking the whole map?":
`Instead of one big lock, it locks tiny pieces. Reading needs no lock at all. Writing to an empty bucket uses a quick atomic operation, and writing to a busy bucket locks only that bucket. So many threads can read and write different parts of the map at the same time.`,

"What is CopyOnWriteArrayList and when is it the right choice?":
`Every time you change this list, it makes a fresh copy of the whole array with the change applied. Readers keep reading the old copy with no locking at all. That makes reads very fast and safe, but writes slow, so it suits lists that are read constantly and changed rarely, such as a list of listeners.`,

"Explain LinkedHashMap and how to build an LRU cache with it":
`A LinkedHashMap is a HashMap that also remembers an order. In "access order" mode, every time you read an entry it moves to the end, so the least recently used entry is always at the front. Override <code>removeEldestEntry</code> to remove that front entry when the map gets too big, and you have an LRU cache in a few lines.`,

"How do you make a collection thread-safe? Compare the options.":
`Best: use a concurrent collection designed for it, such as ConcurrentHashMap. Second: wrap a normal one with <code>Collections.synchronizedList</code> and friends, which locks around every call. Simplest of all: use a collection that never changes, such as <code>List.of(...)</code>, which is always safe to share.`,

"What are BlockingQueues and where would you use one?":
`A BlockingQueue is a queue that makes a thread wait: taking from an empty queue waits until something arrives, and adding to a full queue waits until there is space. It is perfect for producer-consumer work, where some threads create tasks and others process them, without writing any tricky waiting code yourself.`,

"What is the difference between Iterator, ListIterator and Enumeration?":
`<b>Enumeration</b> is the old, legacy way of looping and cannot remove items. <b>Iterator</b> is the standard way: it moves forward and can remove. <b>ListIterator</b> is for lists only and can move both ways, replace and insert. Use Iterator in modern code.`,

"How would you sort a Map by its values?":
`You cannot sort a HashMap in place. Take its entries, sort them with <code>Map.Entry.comparingByValue()</code>, and collect them into a <code>LinkedHashMap</code> so the sorted order is kept. A common bug is collecting into a plain HashMap, which loses the order again.`,

"What are WeakHashMap, IdentityHashMap and EnumMap for?":
`<b>WeakHashMap</b> lets an entry disappear automatically once nothing else uses its key, which is handy for caches. <b>IdentityHashMap</b> compares keys by memory address instead of <code>equals()</code>. <b>EnumMap</b> is a very fast map for enum keys. Each solves a specific, unusual problem.`,

"Explain time complexity of the main collection operations":
`This is about how speed changes as a collection grows. Getting by position in an ArrayList and looking up in a HashMap are about instant at any size. Searching an unsorted list means checking every item. Sorted collections like TreeMap take a little longer than a HashMap, but the time grows very slowly as they get bigger.`,

"Why should you use ArrayDeque instead of Stack?":
`<code>Stack</code> is an old class built on <code>Vector</code>: it locks on every call (making it slow) and exposes list methods that a stack should not have. <code>ArrayDeque</code> is faster, has no unnecessary locking, and offers clean <code>push</code>, <code>pop</code> and <code>peek</code> methods.`,

"What is the difference between Collection and Collections?":
`<code>Collection</code> (singular) is the interface that lists, sets and queues all implement. <code>Collections</code> (plural) is a helper class full of ready-made static methods, such as <code>sort</code>, <code>reverse</code>, <code>shuffle</code> and <code>unmodifiableList</code>.`,

"How do immutable collections (List.of, Map.of) differ from Collections.unmodifiableList?":
`<code>List.of(...)</code> creates a brand-new list that can never change. <code>Collections.unmodifiableList(list)</code> only puts a "read-only" cover over an existing list, so if someone changes the original, you will see that change through the cover. <code>List.of</code> also refuses null values.`,

"How does TreeMap maintain order and what is a red-black tree?":
`A TreeMap stores keys in a sorted tree. A red-black tree is a kind of tree that rebalances itself whenever you add or remove a key, so it never becomes long and lopsided. That keeps every lookup, insert and delete quick, even with millions of keys.`,

"What is a Spliterator and how do parallel streams use it?":
`A Spliterator is a "splittable iterator": besides walking through items, it can split its work into two halves. Parallel streams use this to cut a collection into chunks that different CPU cores process at the same time. Collections that split evenly, like ArrayList, work much better in parallel than ones that split poorly, like LinkedList.`,

"You need to count word frequencies in a 10 GB file. Which collections and approach?":
`Never load the whole file into memory. Read it line by line, split each line into words, and add each word to a <code>HashMap</code> of word to count. If even the counts are too big for memory, split the work: count chunks of the file separately and then combine the results.`
});
