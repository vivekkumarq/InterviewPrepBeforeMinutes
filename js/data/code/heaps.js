registerCode("heaps", {
intro: `<p>A heap is a binary tree kept in an array, with one rule: every parent is at least as small as its children (min-heap) or at least as large (max-heap). That is a <strong>partial</strong> order — parents beat children, but siblings are unordered — and the weakness is exactly what makes it cheap to maintain.</p>
<table>
<tr><th>Operation</th><th>Heap</th><th>Sorted array</th><th>Balanced BST</th></tr>
<tr><td>Find min / max</td><td><strong>O(1)</strong></td><td>O(1)</td><td>O(log n)</td></tr>
<tr><td>Insert</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Remove min / max</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Search arbitrary</td><td>O(n)</td><td>O(log n)</td><td>O(log n)</td></tr>
<tr><td>Build from n items</td><td><strong>O(n)</strong></td><td>O(n log n)</td><td>O(n log n)</td></tr>
</table>
<p>Because it lives in an array there are no pointers: for index <code>i</code>, the children are <code>2i+1</code> and <code>2i+2</code> and the parent is <code>(i-1)/2</code>.</p>
<p><strong>The counter-intuitive rule for top-K:</strong> to keep the k <em>largest</em> values, use a <strong>min</strong>-heap. You need cheap access to the weakest member you are holding, so you know who to evict. Getting this backwards still compiles and still returns numbers — just the wrong ones.</p>
<p>In Java <code>PriorityQueue</code> is a min-heap by default; pass <code>Comparator.reverseOrder()</code> for a max-heap. Python's <code>heapq</code> is min-only — push negated values for a max-heap.</p>`,
questions: [
{
  slug: "build-a-min-heap", n: 92, title: "Build Your Own Min-Heap", difficulty: "medium",
  statement: `<p>Implement a min-heap with insert, extractMin and peek.</p>`,
  approaches: [
    { name: "Array with sift up and sift down", time: "O(log n)", space: "O(n)", best: true,
      note: "Insert at the end and bubble up; extract by moving the last element to the root and sinking it. Heapifying an existing array bottom-up is O(n), not O(n log n) — most nodes are near the leaves and barely move.",
      java: `public class MinHeap {
    private int[] data = new int[16];
    private int size = 0;

    public void insert(int v) {
        if (size == data.length) data = Arrays.copyOf(data, size * 2);
        data[size] = v;
        siftUp(size++);
    }

    public int peek() {
        if (size == 0) throw new NoSuchElementException("heap is empty");
        return data[0];
    }

    public int extractMin() {
        int min = peek();
        data[0] = data[--size];        // last element to the root
        siftDown(0);
        return min;
    }

    private void siftUp(int i) {
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (data[parent] <= data[i]) break;
            swap(i, parent);
            i = parent;
        }
    }

    private void siftDown(int i) {
        while (true) {
            int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < size && data[l] < data[smallest]) smallest = l;
            if (r < size && data[r] < data[smallest]) smallest = r;
            if (smallest == i) return;
            swap(i, smallest);
            i = smallest;
        }
    }

    private void swap(int i, int j) {
        int t = data[i]; data[i] = data[j]; data[j] = t;
    }

    /** Bottom-up heapify: O(n), not O(n log n). */
    public static MinHeap from(int[] values) {
        MinHeap h = new MinHeap();
        h.data = values.clone();
        h.size = values.length;
        for (int i = h.size / 2 - 1; i >= 0; i--) h.siftDown(i);
        return h;
    }
}`,
      python: `class MinHeap:
    def __init__(self, values: list[int] | None = None) -> None:
        self._data = list(values or [])
        for i in range(len(self._data) // 2 - 1, -1, -1):   # O(n) heapify
            self._sift_down(i)

    def insert(self, v: int) -> None:
        self._data.append(v)
        self._sift_up(len(self._data) - 1)

    def peek(self) -> int:
        if not self._data:
            raise IndexError("heap is empty")
        return self._data[0]

    def extract_min(self) -> int:
        minimum = self.peek()
        last = self._data.pop()
        if self._data:
            self._data[0] = last
            self._sift_down(0)
        return minimum

    def _sift_up(self, i: int) -> None:
        while i > 0:
            parent = (i - 1) // 2
            if self._data[parent] <= self._data[i]:
                break
            self._data[i], self._data[parent] = self._data[parent], self._data[i]
            i = parent

    def _sift_down(self, i: int) -> None:
        n = len(self._data)
        while True:
            smallest, l, r = i, 2 * i + 1, 2 * i + 2
            if l < n and self._data[l] < self._data[smallest]:
                smallest = l
            if r < n and self._data[r] < self._data[smallest]:
                smallest = r
            if smallest == i:
                return
            self._data[i], self._data[smallest] = self._data[smallest], self._data[i]
            i = smallest` }
  ],
  note: `<p>Watch <code>extractMin</code> when the heap empties: moving <code>data[--size]</code> to index 0 is fine in Java because the slot is then outside the live range, but the Python version must not write back at all when the list is empty.</p>`
},
{
  slug: "kth-largest", n: 93, title: "K-th Largest Element", difficulty: "medium",
  statement: `<p>Find the k-th largest value in an unsorted array.</p>`,
  approaches: [
    { name: "Sort and index", time: "O(n log n)", space: "O(1)",
      note: "One line, and perfectly acceptable if you state the cost. It orders everything to answer one question.",
      java: `public static int kthLargest(int[] a, int k) {
    Arrays.sort(a);
    return a[a.length - k];
}`,
      python: `def kth_largest(a: list[int], k: int) -> int:
    return sorted(a)[-k]` },
    { name: "Min-heap of size k", time: "O(n log k)", space: "O(k)", best: true,
      note: "Hold only the k largest seen so far; the root is the weakest of them, which is the k-th largest overall. Works on a stream, where sorting is impossible.",
      java: `public static int kthLargest(int[] a, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();   // min-heap
    for (int x : a) {
        heap.offer(x);
        if (heap.size() > k) heap.poll();     // evict the smallest
    }
    return heap.peek();
}`,
      python: `import heapq

def kth_largest(a: list[int], k: int) -> int:
    heap: list[int] = []
    for x in a:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]` },
    { name: "Quickselect", time: "O(n) average", space: "O(1)",
      note: "Partition like quicksort but recurse into only ONE side. That single word is why it is O(n) while quicksort is O(n log n): n + n/2 + n/4 + … = 2n. Worst case O(n²), mitigated by a random pivot.",
      java: `public static int kthLargest(int[] a, int k) {
    int target = a.length - k;                 // k-th largest = this index sorted
    int lo = 0, hi = a.length - 1;
    Random rnd = new Random();
    while (true) {
        int p = partition(a, lo, hi, lo + rnd.nextInt(hi - lo + 1));
        if (p == target) return a[p];
        if (p < target) lo = p + 1; else hi = p - 1;
    }
}

private static int partition(int[] a, int lo, int hi, int pivotIndex) {
    int pivot = a[pivotIndex];
    swap(a, pivotIndex, hi);
    int i = lo;
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot) swap(a, i++, j);
    swap(a, i, hi);
    return i;
}

private static void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}`,
      python: `import random

def kth_largest(a: list[int], k: int) -> int:
    a = list(a)
    target = len(a) - k
    lo, hi = 0, len(a) - 1
    while True:
        p = _partition(a, lo, hi, random.randint(lo, hi))
        if p == target:
            return a[p]
        if p < target:
            lo = p + 1
        else:
            hi = p - 1

def _partition(a: list[int], lo: int, hi: int, pivot_index: int) -> int:
    pivot = a[pivot_index]
    a[pivot_index], a[hi] = a[hi], a[pivot_index]
    i = lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    return i` }
  ],
  note: `<p>Which to choose: <strong>heap</strong> if the data streams or k is tiny relative to n; <strong>quickselect</strong> if everything is in memory and you want one answer; <strong>sort</strong> if you will need other order statistics too.</p>`
},
{
  slug: "top-k-frequent", n: 94, title: "Top K Most Frequent Numbers", difficulty: "medium",
  statement: `<p>Return the k values that occur most often.</p>`,
  approaches: [
    { name: "Count, then sort by frequency", time: "O(n log n)", space: "O(n)",
      note: "Clear and usually fast enough.",
      java: `public static int[] topK(int[] a, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int x : a) count.merge(x, 1, Integer::sum);
    return count.entrySet().stream()
        .sorted((x, y) -> y.getValue() - x.getValue())
        .limit(k).mapToInt(Map.Entry::getKey).toArray();
}`,
      python: `from collections import Counter

def top_k(a: list[int], k: int) -> list[int]:
    return [v for v, _ in Counter(a).most_common(k)]` },
    { name: "Count, then a min-heap of k", time: "O(n log k)", space: "O(n)",
      note: "Better when k is much smaller than the number of distinct values — you never order the whole map.",
      java: `public static int[] topK(int[] a, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int x : a) count.merge(x, 1, Integer::sum);

    PriorityQueue<Map.Entry<Integer, Integer>> heap =
        new PriorityQueue<>(Map.Entry.comparingByValue());     // min by count
    for (Map.Entry<Integer, Integer> e : count.entrySet()) {
        heap.offer(e);
        if (heap.size() > k) heap.poll();
    }
    int[] out = new int[k];
    for (int i = k - 1; i >= 0; i--) out[i] = heap.poll().getKey();
    return out;
}`,
      python: `import heapq
from collections import Counter

def top_k(a: list[int], k: int) -> list[int]:
    count = Counter(a)
    heap: list[tuple[int, int]] = []
    for value, freq in count.items():
        heapq.heappush(heap, (freq, value))
        if len(heap) > k:
            heapq.heappop(heap)
    return [value for _, value in sorted(heap, reverse=True)]` },
    { name: "Bucket by frequency", time: "O(n)", space: "O(n)", best: true,
      note: "A frequency cannot exceed n, so index buckets by count and read from the top down. Linear, because nothing is ever sorted or heaped.",
      java: `public static int[] topK(int[] a, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int x : a) count.merge(x, 1, Integer::sum);

    List<Integer>[] buckets = new List[a.length + 1];   // index = frequency
    for (Map.Entry<Integer, Integer> e : count.entrySet()) {
        int f = e.getValue();
        if (buckets[f] == null) buckets[f] = new ArrayList<>();
        buckets[f].add(e.getKey());
    }

    int[] out = new int[k];
    int i = 0;
    for (int f = a.length; f >= 1 && i < k; f--) {
        if (buckets[f] == null) continue;
        for (int v : buckets[f]) { if (i < k) out[i++] = v; }
    }
    return out;
}`,
      python: `from collections import Counter

def top_k(a: list[int], k: int) -> list[int]:
    count = Counter(a)
    buckets: list[list[int]] = [[] for _ in range(len(a) + 1)]
    for value, freq in count.items():
        buckets[freq].append(value)

    out: list[int] = []
    for freq in range(len(a), 0, -1):
        for value in buckets[freq]:
            out.append(value)
            if len(out) == k:
                return out
    return out` }
  ],
  note: `<p>Bucket sort works here only because frequencies are bounded by n. That is the same reason counting sort beats the comparison lower bound — a bounded key range lets you index instead of compare.</p>`
},
{
  slug: "merge-k-sorted-lists", n: 95, title: "Merge K Sorted Lists", difficulty: "hard",
  statement: `<p>Merge k sorted linked lists into one sorted list.</p>`,
  approaches: [
    { name: "Merge one at a time", time: "O(N·k)", space: "O(1)",
      note: "Merging the accumulated result with each new list re-walks the growing prefix k times.",
      java: `// result = merge(result, lists[i]) for each i.
// The accumulated list is traversed again every round: O(N*k).`,
      python: `# result = merge(result, lists[i]) for each i.
# The accumulated list is traversed again every round: O(N*k).` },
    { name: "Min-heap of the k heads", time: "O(N log k)", space: "O(k)", best: true,
      note: "Keep one node from each list in a heap. Pop the smallest, append it, push its successor. The heap never exceeds k entries.",
      java: `public static ListNode mergeK(ListNode[] lists) {
    PriorityQueue<ListNode> heap =
        new PriorityQueue<>((x, y) -> Integer.compare(x.val, y.val));
    for (ListNode l : lists) if (l != null) heap.offer(l);

    ListNode dummy = new ListNode(0), tail = dummy;
    while (!heap.isEmpty()) {
        ListNode smallest = heap.poll();
        tail.next = smallest;
        tail = tail.next;
        if (smallest.next != null) heap.offer(smallest.next);
    }
    return dummy.next;
}`,
      python: `import heapq

def merge_k(lists: list) -> object:
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))   # i breaks val ties

    dummy = ListNode(0)
    tail = dummy
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = node
        tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next` },
    { name: "Pairwise merging", time: "O(N log k)", space: "O(1)",
      note: "Merge lists in pairs, halving the count each round — the merge step of merge sort applied across lists. Same bound, no heap, O(1) extra space.",
      java: `public static ListNode mergeK(ListNode[] lists) {
    if (lists.length == 0) return null;
    int n = lists.length;
    while (n > 1) {
        int half = (n + 1) / 2;
        for (int i = 0; i < n / 2; i++)
            lists[i] = merge(lists[i], lists[i + half]);
        n = half;
    }
    return lists[0];
}`,
      python: `def merge_k(lists: list):
    if not lists:
        return None
    while len(lists) > 1:
        merged = []
        for i in range(0, len(lists), 2):
            a = lists[i]
            b = lists[i + 1] if i + 1 < len(lists) else None
            merged.append(merge_two(a, b))
        lists = merged
    return lists[0]` }
  ],
  note: `<p>The Python heap needs the index <code>i</code> as a tie-breaker: when two nodes share a value, <code>heapq</code> would otherwise try to compare the node objects themselves and raise a TypeError. Java sidesteps it because the comparator only ever looks at <code>val</code>.</p>`
},
{
  slug: "running-median", n: 96, title: "Running Median of a Stream", difficulty: "hard",
  statement: `<p>Numbers arrive one at a time. After each, report the median so far.</p>`,
  approaches: [
    { name: "Keep a sorted list", time: "O(n) per insert", space: "O(n)",
      note: "Binary search for the position, then insert — but the insert itself shifts elements, so it is linear.",
      java: `// Collections.binarySearch to find the slot, then list.add(i, v).
// The shift makes each insert O(n).`,
      python: `import bisect

def add(sorted_values: list[int], v: int) -> float:
    bisect.insort(sorted_values, v)     # O(n) because of the shift
    n = len(sorted_values)
    mid = n // 2
    return sorted_values[mid] if n % 2 else (sorted_values[mid - 1] + sorted_values[mid]) / 2` },
    { name: "Two heaps", time: "O(log n) per insert", space: "O(n)", best: true,
      note: "A max-heap for the lower half, a min-heap for the upper. The median is at one or both tops. Keep the sizes within one of each other and rebalance after every insert.",
      java: `public class MedianFinder {
    private final PriorityQueue<Integer> low =
        new PriorityQueue<>(Comparator.reverseOrder());   // max-heap, lower half
    private final PriorityQueue<Integer> high =
        new PriorityQueue<>();                            // min-heap, upper half

    public void add(int v) {
        low.offer(v);
        high.offer(low.poll());              // funnel through to keep order
        if (high.size() > low.size())        // low may hold one extra
            low.offer(high.poll());
    }

    public double median() {
        if (low.isEmpty()) throw new NoSuchElementException("no values yet");
        if (low.size() > high.size()) return low.peek();
        return (low.peek() + high.peek()) / 2.0;
    }
}`,
      python: `import heapq

class MedianFinder:
    def __init__(self) -> None:
        self._low: list[int] = []      # max-heap via negation, lower half
        self._high: list[int] = []     # min-heap, upper half

    def add(self, v: int) -> None:
        heapq.heappush(self._low, -v)
        heapq.heappush(self._high, -heapq.heappop(self._low))
        if len(self._high) > len(self._low):
            heapq.heappush(self._low, -heapq.heappop(self._high))

    def median(self) -> float:
        if not self._low:
            raise IndexError("no values yet")
        if len(self._low) > len(self._high):
            return -self._low[0]
        return (-self._low[0] + self._high[0]) / 2` }
  ],
  note: `<p>The funnel — push into <code>low</code>, immediately move its top to <code>high</code>, then rebalance — is what guarantees every value in <code>low</code> is at most every value in <code>high</code> without any comparison logic of your own.</p>
<p>If the window is bounded rather than unbounded, this becomes "median of a sliding window", which needs lazy deletion or an indexed multiset.</p>`
}
]});
