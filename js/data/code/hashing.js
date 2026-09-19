registerCode("hashing", {
intro: `<p>A hash map turns a key into an array index by running it through a hash function. That is why lookup is <strong>O(1) on average</strong> — no searching, just arithmetic and one jump.</p>
<table>
<tr><th>Operation</th><th>Average</th><th>Worst case</th></tr>
<tr><td>get / put / remove</td><td>O(1)</td><td>O(n), or O(log n) in modern Java</td></tr>
<tr><td>containsKey</td><td>O(1)</td><td>Same</td></tr>
<tr><td>Iterate</td><td>O(n)</td><td>Order is not guaranteed</td></tr>
</table>
<p><strong>Collisions</strong> — two keys landing in the same bucket — are handled by chaining them in a list. Java 8 converts a bucket to a red-black tree once it holds eight entries, which bounds the worst case at O(log n) instead of O(n).</p>
<p><strong>Two rules that cause real bugs:</strong></p>
<table>
<tr><td>Equal objects must have equal hash codes. Override <code>hashCode</code> whenever you override <code>equals</code>, or lookups silently miss.</td></tr>
<tr><td>Keys must be <strong>immutable</strong>. Mutate a key after inserting and its hash changes, so it sits in the wrong bucket — unfindable and unremovable.</td></tr>
</table>
<p>The pattern to recognise: whenever a question says "have I seen this before", or asks you to turn an O(n²) pair-scan into one pass, the answer is a hash map.</p>`,
questions: [
{
  slug: "count-frequencies", n: 43, title: "Count How Often Each Number Appears", difficulty: "easy",
  statement: `<p>Return a map from each value to the number of times it occurs.</p>`,
  approaches: [
    { name: "Map with a merge", time: "O(n)", space: "O(n)", best: true,
      note: "One pass. Both languages have a built-in that avoids the manual get-or-zero dance.",
      java: `public static Map<Integer, Integer> counts(int[] a) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int x : a) count.merge(x, 1, Integer::sum);
    return count;
}`,
      python: `from collections import Counter

def counts(a: list[int]) -> dict[int, int]:
    return dict(Counter(a))` },
    { name: "Array counting, bounded values", time: "O(n)", space: "O(k)",
      note: "If the values are small and bounded — digits, letters, ages — an array beats a map outright: no hashing, no boxing, perfect cache locality.",
      java: `public static int[] counts(int[] a, int maxValue) {
    int[] count = new int[maxValue + 1];
    for (int x : a) count[x]++;
    return count;
}`,
      python: `def counts(a: list[int], max_value: int) -> list[int]:
    count = [0] * (max_value + 1)
    for x in a:
        count[x] += 1
    return count` }
  ],
  note: `<p>Ask about the value range. "Bounded 0–100" turns an O(n) map into an O(1)-space array and is exactly the optimisation interviewers are hoping you notice.</p>`
},
{
  slug: "contains-duplicate", n: 44, title: "Contains Duplicate", difficulty: "easy",
  statement: `<p>Return true if any value appears more than once.</p>`,
  approaches: [
    { name: "Compare every pair", time: "O(n²)", space: "O(1)",
      note: "No extra memory, but quadratic.",
      java: `public static boolean hasDuplicate(int[] a) {
    for (int i = 0; i < a.length; i++)
        for (int j = i + 1; j < a.length; j++)
            if (a[i] == a[j]) return true;
    return false;
}`,
      python: `def has_duplicate(a: list[int]) -> bool:
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[i] == a[j]:
                return True
    return False` },
    { name: "Sort and check neighbours", time: "O(n log n)", space: "O(1)",
      note: "Duplicates become adjacent once sorted. Good when memory matters more than time and mutating the input is allowed.",
      java: `public static boolean hasDuplicate(int[] a) {
    Arrays.sort(a);
    for (int i = 1; i < a.length; i++)
        if (a[i] == a[i - 1]) return true;
    return false;
}`,
      python: `def has_duplicate(a: list[int]) -> bool:
    a = sorted(a)
    return any(a[i] == a[i - 1] for i in range(1, len(a)))` },
    { name: "Set, exiting early", time: "O(n)", space: "O(n)", best: true,
      note: "Return the moment an insert fails. On an array that starts with a duplicate this finishes in two steps rather than scanning everything.",
      java: `public static boolean hasDuplicate(int[] a) {
    Set<Integer> seen = new HashSet<>();
    for (int x : a)
        if (!seen.add(x)) return true;    // add returns false if present
    return false;
}`,
      python: `def has_duplicate(a: list[int]) -> bool:
    seen: set[int] = set()
    for x in a:
        if x in seen:
            return True
        seen.add(x)
    return False` }
  ],
  note: `<p><code>len(set(a)) != len(a)</code> is the one-liner, but it always builds the whole set. The early-exit loop is strictly better on inputs that duplicate early, and saying so shows you thought past the one-liner.</p>`
},
{
  slug: "longest-consecutive-sequence", n: 45, title: "Longest Consecutive Sequence", difficulty: "medium",
  statement: `<p>Find the length of the longest run of consecutive integers. <code>[100,4,200,1,3,2]</code> gives 4, from 1,2,3,4. Required in O(n).</p>`,
  approaches: [
    { name: "Sort, then scan", time: "O(n log n)", space: "O(1)",
      note: "Easy to reason about, but the problem explicitly asks for linear time, so this is the version to beat.",
      java: `public static int longest(int[] a) {
    if (a.length == 0) return 0;
    Arrays.sort(a);
    int best = 1, run = 1;
    for (int i = 1; i < a.length; i++) {
        if (a[i] == a[i - 1]) continue;              // ignore duplicates
        if (a[i] == a[i - 1] + 1) run++;
        else run = 1;
        best = Math.max(best, run);
    }
    return best;
}`,
      python: `def longest(a: list[int]) -> int:
    if not a:
        return 0
    a = sorted(set(a))
    best = run = 1
    for i in range(1, len(a)):
        run = run + 1 if a[i] == a[i - 1] + 1 else 1
        best = max(best, run)
    return best` },
    { name: "Set, counting only from run starts", time: "O(n)", space: "O(n)", best: true,
      note: "Put everything in a set, then only start counting at a value whose predecessor is absent — that is the head of a run. Each element is walked at most once across all runs, so it really is O(n).",
      java: `public static int longest(int[] a) {
    Set<Integer> set = new HashSet<>();
    for (int x : a) set.add(x);

    int best = 0;
    for (int x : set) {
        if (set.contains(x - 1)) continue;    // not the start of a run
        int len = 1;
        while (set.contains(x + len)) len++;
        best = Math.max(best, len);
    }
    return best;
}`,
      python: `def longest(a: list[int]) -> int:
    values = set(a)
    best = 0
    for x in values:
        if x - 1 in values:
            continue            # not the start of a run
        length = 1
        while x + length in values:
            length += 1
        best = max(best, length)
    return best` }
  ],
  note: `<p>The <code>continue</code> is what makes it linear. Without it, a long run is re-walked from every one of its members and the whole thing degrades to O(n²) — while still returning the right answer, which is why it is easy to miss.</p>`
},
{
  slug: "build-a-hash-map", n: 46, title: "Build Your Own Hash Map", difficulty: "medium",
  statement: `<p>Implement a hash map from scratch: <code>put</code>, <code>get</code> and <code>remove</code>, handling collisions and resizing.</p>`,
  approaches: [
    { name: "Buckets with chaining", time: "O(1) average", space: "O(n)", best: true,
      note: "An array of buckets, each a chain of entries. Hash to a bucket, then walk its short chain. Double the table when the load factor passes 0.75, or the chains grow and lookups drift towards O(n).",
      java: `public class MyHashMap<K, V> {
    private static class Node<K, V> {
        final K key; V value; Node<K, V> next;
        Node(K k, V v) { key = k; value = v; }
    }

    private Node<K, V>[] table = new Node[16];
    private int size = 0;

    private int indexOf(K key, int capacity) {
        int h = key == null ? 0 : key.hashCode();
        h ^= (h >>> 16);                  // spread the high bits down
        return h & (capacity - 1);        // capacity is a power of two
    }

    public void put(K key, V value) {
        int i = indexOf(key, table.length);
        for (Node<K, V> n = table[i]; n != null; n = n.next)
            if (Objects.equals(n.key, key)) { n.value = value; return; }

        Node<K, V> fresh = new Node<>(key, value);
        fresh.next = table[i];
        table[i] = fresh;
        if (++size > table.length * 0.75) resize();
    }

    public V get(K key) {
        for (Node<K, V> n = table[indexOf(key, table.length)]; n != null; n = n.next)
            if (Objects.equals(n.key, key)) return n.value;
        return null;
    }

    public boolean remove(K key) {
        int i = indexOf(key, table.length);
        Node<K, V> prev = null;
        for (Node<K, V> n = table[i]; n != null; prev = n, n = n.next) {
            if (!Objects.equals(n.key, key)) continue;
            if (prev == null) table[i] = n.next; else prev.next = n.next;
            size--;
            return true;
        }
        return false;
    }

    private void resize() {
        Node<K, V>[] old = table;
        table = new Node[old.length * 2];
        for (Node<K, V> head : old)
            for (Node<K, V> n = head; n != null; ) {
                Node<K, V> next = n.next;
                int i = indexOf(n.key, table.length);
                n.next = table[i];
                table[i] = n;
                n = next;
            }
    }
}`,
      python: `class MyHashMap:
    def __init__(self, capacity: int = 16) -> None:
        self._buckets: list[list[tuple]] = [[] for _ in range(capacity)]
        self._size = 0

    def _index(self, key, capacity: int) -> int:
        return hash(key) & (capacity - 1)      # capacity is a power of two

    def put(self, key, value) -> None:
        bucket = self._buckets[self._index(key, len(self._buckets))]
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value)
                return
        bucket.append((key, value))
        self._size += 1
        if self._size > len(self._buckets) * 0.75:
            self._resize()

    def get(self, key):
        bucket = self._buckets[self._index(key, len(self._buckets))]
        for k, v in bucket:
            if k == key:
                return v
        return None

    def remove(self, key) -> bool:
        bucket = self._buckets[self._index(key, len(self._buckets))]
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket.pop(i)
                self._size -= 1
                return True
        return False

    def _resize(self) -> None:
        old = self._buckets
        self._buckets = [[] for _ in range(len(old) * 2)]
        for bucket in old:
            for k, v in bucket:
                self._buckets[self._index(k, len(self._buckets))].append((k, v))` }
  ],
  note: `<p>Three details interviewers probe for:</p>
<table>
<tr><td><strong>Why a power-of-two capacity?</strong></td><td><code>h &amp; (capacity − 1)</code> replaces a modulo with a single bitwise AND, and gives the same result.</td></tr>
<tr><td><strong>Why XOR the high bits down?</strong></td><td>Only the low bits survive the mask, so keys differing only high up would all collide.</td></tr>
<tr><td><strong>Why double rather than grow by a constant?</strong></td><td>Doubling gives O(1) amortised inserts. Growing by a fixed amount makes n inserts O(n²).</td></tr>
</table>`
}
]});
