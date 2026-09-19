registerCode("searching", {
intro: `<p>Searching and sorting are where complexity stops being theory. The gap between O(n) and O(log n) is the difference between reading a million records and reading twenty.</p>
<table>
<tr><th>Sort</th><th>Average</th><th>Worst</th><th>Space</th><th>Stable</th></tr>
<tr><td>Bubble</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>Yes</td></tr>
<tr><td>Selection</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>No</td></tr>
<tr><td>Insertion</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>Yes</td></tr>
<tr><td><strong>Merge</strong></td><td>O(n log n)</td><td><strong>O(n log n)</strong></td><td>O(n)</td><td><strong>Yes</strong></td></tr>
<tr><td><strong>Quick</strong></td><td>O(n log n)</td><td>O(n²)</td><td>O(log n)</td><td>No</td></tr>
<tr><td>Heap</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>No</td></tr>
<tr><td>Counting</td><td>O(n + k)</td><td>O(n + k)</td><td>O(k)</td><td>Yes</td></tr>
</table>
<p><strong>Stable</strong> means equal elements keep their original order — it matters when you sort by one field having already sorted by another.</p>
<p><strong>Why Java ships two sorts:</strong> <code>Arrays.sort(int[])</code> uses dual-pivot quicksort — fast, in place, and primitives have no identity so stability is meaningless. <code>Arrays.sort(Object[])</code> uses TimSort, which is stable and guarantees O(n log n), because objects <em>do</em> have identity and a quadratic worst case on user data is unacceptable. That answer alone is worth knowing.</p>
<p>Comparison sorting cannot beat <strong>Ω(n log n)</strong>: distinguishing n! orderings needs log₂(n!) ≈ n log n comparisons. Counting sort beats it only by not comparing at all.</p>`,
questions: [
{
  slug: "binary-search", n: 47, title: "Binary Search", difficulty: "easy",
  statement: `<p>Find a target in a sorted array, or report that it is absent.</p>`,
  approaches: [
    { name: "Linear scan", time: "O(n)", space: "O(1)",
      note: "Works on any array, but throws away the fact that this one is sorted.",
      java: `public static int search(int[] a, int target) {
    for (int i = 0; i < a.length; i++)
        if (a[i] == target) return i;
    return -1;
}`,
      python: `def search(a: list[int], target: int) -> int:
    for i, x in enumerate(a):
        if x == target:
            return i
    return -1` },
    { name: "Binary search", time: "O(log n)", space: "O(1)", best: true,
      note: "Halve the range each step. Compute mid as lo + (hi - lo) / 2, never (lo + hi) / 2 — the latter overflows past two billion.",
      java: `public static int search(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;          // overflow-safe
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
      python: `def search(a: list[int], target: int) -> int:
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1` }
  ],
  note: `<p>Binary search does not require a sorted array so much as a <strong>monotone predicate</strong> — a condition that is false, false, then true forever. Once you see it that way you can binary-search the answer itself, not just an index.</p>`
},
{
  slug: "first-last-position", n: 48, title: "First and Last Position of a Value", difficulty: "medium",
  statement: `<p>In a sorted array with duplicates, return the first and last index of a target, or <code>[-1,-1]</code>.</p>`,
  approaches: [
    { name: "Find one, then walk outwards", time: "O(n)", space: "O(1)",
      note: "Correct, but an array of all-identical values degrades it to a full scan.",
      java: `// Binary search for any hit, then expand left and right while equal.
// O(n) when every element matches.`,
      python: `# Binary search for any hit, then expand left and right while equal.
# O(n) when every element matches.` },
    { name: "Two boundary searches", time: "O(log n)", space: "O(1)", best: true,
      note: "One search for the leftmost position, one for the rightmost. On a match keep searching that side rather than returning.",
      java: `public static int[] searchRange(int[] a, int target) {
    int first = bound(a, target, true), last = bound(a, target, false);
    return new int[]{first, last};
}

private static int bound(int[] a, int target, boolean wantFirst) {
    int lo = 0, hi = a.length - 1, found = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) {
            found = mid;
            if (wantFirst) hi = mid - 1;      // keep going left
            else lo = mid + 1;                // keep going right
        } else if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return found;
}`,
      python: `def search_range(a: list[int], target: int) -> list[int]:
    def bound(want_first: bool) -> int:
        lo, hi, found = 0, len(a) - 1, -1
        while lo <= hi:
            mid = lo + (hi - lo) // 2
            if a[mid] == target:
                found = mid
                if want_first:
                    hi = mid - 1
                else:
                    lo = mid + 1
            elif a[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return found

    return [bound(True), bound(False)]` }
  ],
  note: `<p>This is <code>lowerBound</code> and <code>upperBound</code> in disguise — the same two primitives behind <code>TreeMap.floorKey</code> and Python's <code>bisect</code>.</p>`
},
{
  slug: "search-rotated", n: 49, title: "Search in a Rotated Sorted Array", difficulty: "medium",
  statement: `<p>A sorted array was rotated at an unknown pivot. Find a target in O(log n).</p>`,
  approaches: [
    { name: "Identify the sorted half", time: "O(log n)", space: "O(1)", best: true,
      note: "After any split, at least one half is still properly sorted. Work out which, check whether the target lies inside it, and discard the other half.",
      java: `public static int search(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;

        if (a[lo] <= a[mid]) {                        // left half is sorted
            if (a[lo] <= target && target < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                      // right half is sorted
            if (a[mid] < target && target <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`,
      python: `def search(a: list[int], target: int) -> int:
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:                 # left half sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                               # right half sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1` }
  ],
  note: `<p>With duplicates allowed, <code>a[lo] == a[mid] == a[hi]</code> tells you nothing about which side is sorted, and the worst case degrades to O(n). Mention it — it is the standard follow-up.</p>`
},
{
  slug: "find-peak", n: 50, title: "Find a Peak Element", difficulty: "medium",
  statement: `<p>A peak is any element greater than both neighbours. Return the index of any one, in O(log n). Treat out-of-range neighbours as −∞.</p>`,
  approaches: [
    { name: "Scan for a rise then a fall", time: "O(n)", space: "O(1)",
      note: "Straightforward, but linear.",
      java: `public static int findPeak(int[] a) {
    for (int i = 0; i < a.length; i++) {
        boolean leftOk  = i == 0 || a[i] > a[i - 1];
        boolean rightOk = i == a.length - 1 || a[i] > a[i + 1];
        if (leftOk && rightOk) return i;
    }
    return -1;
}`,
      python: `def find_peak(a: list[int]) -> int:
    for i in range(len(a)):
        left_ok = i == 0 or a[i] > a[i - 1]
        right_ok = i == len(a) - 1 or a[i] > a[i + 1]
        if left_ok and right_ok:
            return i
    return -1` },
    { name: "Binary search uphill", time: "O(log n)", space: "O(1)", best: true,
      note: "Walk towards the higher neighbour. Climbing uphill on a finite array must end at a peak, so half the range can always be discarded — even though the array is unsorted.",
      java: `public static int findPeak(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1;   // uphill to the right
        else hi = mid;                            // peak is mid or left of it
    }
    return lo;
}`,
      python: `def find_peak(a: list[int]) -> int:
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < a[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo` }
  ],
  note: `<p>The surprise here is that binary search works on an <em>unsorted</em> array. What it needs is not sortedness but a direction that provably contains an answer.</p>`
},
{
  slug: "integer-sqrt", n: 51, title: "Integer Square Root", difficulty: "easy",
  statement: `<p>Return the floor of the square root of a non-negative integer, without using a library sqrt.</p>`,
  approaches: [
    { name: "Count upwards", time: "O(√n)", space: "O(1)",
      note: "Increment while the square still fits.",
      java: `public static int mySqrt(int n) {
    int i = 0;
    while ((long) (i + 1) * (i + 1) <= n) i++;
    return i;
}`,
      python: `def my_sqrt(n: int) -> int:
    i = 0
    while (i + 1) * (i + 1) <= n:
        i += 1
    return i` },
    { name: "Binary search on the answer", time: "O(log n)", space: "O(1)", best: true,
      note: "The predicate mid² ≤ n is monotone, so binary search applies. This is the smallest example of searching the answer space rather than an array.",
      java: `public static int mySqrt(int n) {
    long lo = 0, hi = n;
    while (lo <= hi) {
        long mid = lo + (hi - lo) / 2;
        if (mid * mid <= n) lo = mid + 1;    // mid is feasible, try bigger
        else hi = mid - 1;
    }
    return (int) hi;                          // hi is the last feasible value
}`,
      python: `def my_sqrt(n: int) -> int:
    lo, hi = 0, n
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if mid * mid <= n:
            lo = mid + 1
        else:
            hi = mid - 1
    return hi` }
  ],
  note: `<p><code>mid * mid</code> must be computed in <code>long</code>. For n near <code>Integer.MAX_VALUE</code> the product overflows an int, the comparison flips, and the loop returns nonsense.</p>`
},
{
  slug: "bubble-sort", n: 52, title: "Bubble Sort", difficulty: "easy",
  statement: `<p>Repeatedly swap adjacent out-of-order pairs until the array is sorted.</p>`,
  approaches: [
    { name: "With an early exit", time: "O(n²)", space: "O(1)", best: true,
      note: "The swapped flag turns an already-sorted array into a single O(n) pass. Without it the best case is quadratic too.",
      java: `public static void bubbleSort(int[] a) {
    for (int i = 0; i < a.length - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < a.length - 1 - i; j++) {   // -i: tail is settled
            if (a[j] > a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) return;                          // already sorted
    }
}`,
      python: `def bubble_sort(a: list[int]) -> None:
    for i in range(len(a) - 1):
        swapped = False
        for j in range(len(a) - 1 - i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
        if not swapped:
            return` }
  ],
  note: `<p>Never the right production choice, but it is asked because it is the clearest place to demonstrate loop invariants: after pass i, the last i elements are final.</p>`
},
{
  slug: "selection-sort", n: 53, title: "Selection Sort", difficulty: "easy",
  statement: `<p>Repeatedly select the smallest remaining element and put it in place.</p>`,
  approaches: [
    { name: "Find the minimum, swap", time: "O(n²)", space: "O(1)", best: true,
      note: "Always exactly n−1 swaps — the fewest writes of any simple sort. That matters when writing is far more expensive than reading, as on flash memory.",
      java: `public static void selectionSort(int[] a) {
    for (int i = 0; i < a.length - 1; i++) {
        int min = i;
        for (int j = i + 1; j < a.length; j++)
            if (a[j] < a[min]) min = j;
        if (min != i) {
            int t = a[i]; a[i] = a[min]; a[min] = t;
        }
    }
}`,
      python: `def selection_sort(a: list[int]) -> None:
    for i in range(len(a) - 1):
        lo = min(range(i, len(a)), key=lambda j: a[j])
        if lo != i:
            a[i], a[lo] = a[lo], a[i]` }
  ],
  note: `<p>It is <strong>not stable</strong>: the long-range swap can jump an equal element past its twin. Insertion sort is stable and usually faster, which is why selection sort is rarely chosen.</p>`
},
{
  slug: "insertion-sort", n: 54, title: "Insertion Sort", difficulty: "easy",
  statement: `<p>Grow a sorted prefix, inserting each new element into its correct position.</p>`,
  approaches: [
    { name: "Shift and insert", time: "O(n²)", space: "O(1)", best: true,
      note: "O(n) on nearly-sorted input, stable, and in place. This is why every production sort falls back to it for small partitions.",
      java: `public static void insertionSort(int[] a) {
    for (int i = 1; i < a.length; i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) {      // > not >=, which keeps it stable
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}`,
      python: `def insertion_sort(a: list[int]) -> None:
    for i in range(1, len(a)):
        key, j = a[i], i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key` }
  ],
  note: `<p>Using <code>&gt;</code> rather than <code>&gt;=</code> is what makes it stable: an equal element stops the shift, so the newcomer lands after its twin rather than before it.</p>`
},
{
  slug: "merge-sort", n: 55, title: "Merge Sort", difficulty: "medium",
  statement: `<p>Divide the array in half, sort each half, then merge them.</p>`,
  approaches: [
    { name: "Divide and conquer", time: "O(n log n)", space: "O(n)", best: true,
      note: "Guaranteed O(n log n) in every case, and stable. The cost is the O(n) buffer — which is exactly why quicksort is often preferred in memory-tight code.",
      java: `public static void mergeSort(int[] a) {
    if (a.length < 2) return;
    sort(a, new int[a.length], 0, a.length - 1);
}

private static void sort(int[] a, int[] buf, int lo, int hi) {
    if (lo >= hi) return;
    int mid = lo + (hi - lo) / 2;
    sort(a, buf, lo, mid);
    sort(a, buf, mid + 1, hi);
    merge(a, buf, lo, mid, hi);
}

private static void merge(int[] a, int[] buf, int lo, int mid, int hi) {
    System.arraycopy(a, lo, buf, lo, hi - lo + 1);
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid)            a[k] = buf[j++];
        else if (j > hi)        a[k] = buf[i++];
        else if (buf[j] < buf[i]) a[k] = buf[j++];   // < keeps it stable
        else                    a[k] = buf[i++];
    }
}`,
      python: `def merge_sort(a: list[int]) -> list[int]:
    if len(a) < 2:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])

    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if right[j] < left[i]:          # < keeps it stable
            out.append(right[j])
            j += 1
        else:
            out.append(left[i])
            i += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out` }
  ],
  note: `<p>On a <strong>linked list</strong> merge sort needs only O(log n) extra space, because merging is pointer relinking rather than copying. That is why it is the standard list sort.</p>`
},
{
  slug: "quick-sort", n: 56, title: "Quick Sort", difficulty: "medium",
  statement: `<p>Partition around a pivot so smaller values go left and larger right, then recurse.</p>`,
  approaches: [
    { name: "Lomuto partition", time: "O(n log n) avg", space: "O(log n)", best: true,
      note: "In place and cache-friendly. The worst case is O(n²) on already-sorted input with a fixed pivot — which is why the pivot is chosen randomly here.",
      java: `public static void quickSort(int[] a, int lo, int hi) {
    while (lo < hi) {
        int p = partition(a, lo, hi);
        /* Recurse into the SMALLER side and loop on the larger:
           bounds stack depth at O(log n) even on bad input. */
        if (p - lo < hi - p) { quickSort(a, lo, p - 1); lo = p + 1; }
        else                 { quickSort(a, p + 1, hi); hi = p - 1; }
    }
}

private static int partition(int[] a, int lo, int hi) {
    int r = lo + new Random().nextInt(hi - lo + 1);   // random pivot
    swap(a, r, hi);
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot) swap(a, i++, j);
    swap(a, i, hi);
    return i;
}

private static void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}`,
      python: `import random

def quick_sort(a: list[int], lo: int = 0, hi: int | None = None) -> None:
    if hi is None:
        hi = len(a) - 1
    while lo < hi:
        p = _partition(a, lo, hi)
        if p - lo < hi - p:
            quick_sort(a, lo, p - 1)
            lo = p + 1
        else:
            quick_sort(a, p + 1, hi)
            hi = p - 1

def _partition(a: list[int], lo: int, hi: int) -> int:
    r = random.randint(lo, hi)
    a[r], a[hi] = a[hi], a[r]
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    return i` }
  ],
  note: `<p>Two production details worth saying: recursing into the smaller partition bounds stack depth at O(log n), and an array of all-equal values still degrades Lomuto to O(n²) — three-way partitioning fixes that.</p>`
},
{
  slug: "heap-sort", n: 57, title: "Heap Sort", difficulty: "medium",
  statement: `<p>Build a max-heap, then repeatedly move the root to the end.</p>`,
  approaches: [
    { name: "Heapify, then extract", time: "O(n log n)", space: "O(1)", best: true,
      note: "The only common sort that is both guaranteed O(n log n) and truly in place. Building the heap bottom-up is O(n), not O(n log n).",
      java: `public static void heapSort(int[] a) {
    for (int i = a.length / 2 - 1; i >= 0; i--) siftDown(a, i, a.length);
    for (int end = a.length - 1; end > 0; end--) {
        int t = a[0]; a[0] = a[end]; a[end] = t;    // biggest to the back
        siftDown(a, 0, end);
    }
}

private static void siftDown(int[] a, int i, int size) {
    while (true) {
        int largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < size && a[l] > a[largest]) largest = l;
        if (r < size && a[r] > a[largest]) largest = r;
        if (largest == i) return;
        int t = a[i]; a[i] = a[largest]; a[largest] = t;
        i = largest;
    }
}`,
      python: `def heap_sort(a: list[int]) -> None:
    def sift_down(i: int, size: int) -> None:
        while True:
            largest, l, r = i, 2 * i + 1, 2 * i + 2
            if l < size and a[l] > a[largest]:
                largest = l
            if r < size and a[r] > a[largest]:
                largest = r
            if largest == i:
                return
            a[i], a[largest] = a[largest], a[i]
            i = largest

    for i in range(len(a) // 2 - 1, -1, -1):
        sift_down(i, len(a))
    for end in range(len(a) - 1, 0, -1):
        a[0], a[end] = a[end], a[0]
        sift_down(0, end)` }
  ],
  note: `<p>Despite matching merge sort's bound and beating its memory, heap sort is usually slower in practice: it jumps around the array and misses cache constantly, where merge and quick sort read sequentially.</p>`
},
{
  slug: "counting-sort", n: 58, title: "Counting Sort", difficulty: "medium",
  statement: `<p>Sort integers in a known small range without comparing them.</p>`,
  approaches: [
    { name: "Tally and rebuild", time: "O(n + k)", space: "O(k)", best: true,
      note: "Counts occurrences and rewrites the array. Beats the Ω(n log n) comparison bound by never comparing — but only works when k, the value range, is small.",
      java: `public static void countingSort(int[] a, int min, int max) {
    int[] count = new int[max - min + 1];
    for (int x : a) count[x - min]++;
    int i = 0;
    for (int v = 0; v < count.length; v++)
        while (count[v]-- > 0) a[i++] = v + min;
}`,
      python: `def counting_sort(a: list[int], lo: int, hi: int) -> None:
    count = [0] * (hi - lo + 1)
    for x in a:
        count[x - lo] += 1
    i = 0
    for v, c in enumerate(count):
        for _ in range(c):
            a[i] = v + lo
            i += 1` }
  ],
  note: `<p>The trap: k can dwarf n. Sorting ten values ranging over a billion allocates a billion counters. Use it for ages, grades, digits and bytes — never for arbitrary integers. Radix sort extends it to larger ranges by sorting digit by digit.</p>`
},
{
  slug: "median-two-sorted", n: 59, title: "Median of Two Sorted Arrays", difficulty: "hard",
  statement: `<p>Find the median of two sorted arrays in O(log(m+n)).</p>`,
  approaches: [
    { name: "Merge and take the middle", time: "O(m+n)", space: "O(m+n)",
      note: "Correct and easy. Say it first, then note that the required bound is logarithmic.",
      java: `// Merge both into one sorted array, then index the middle
// (or average the two middles when the total length is even).`,
      python: `def median(a: list[int], b: list[int]) -> float:
    m = sorted(a + b)
    n = len(m)
    return m[n // 2] if n % 2 else (m[n // 2 - 1] + m[n // 2]) / 2` },
    { name: "Binary search the partition", time: "O(log min(m,n))", space: "O(1)", best: true,
      note: "Split both arrays so the left halves together hold exactly half the elements and every left value is at most every right value. Binary search the split point in the SHORTER array.",
      java: `public static double findMedian(int[] a, int[] b) {
    if (a.length > b.length) return findMedian(b, a);   // search the shorter
    int m = a.length, n = b.length, half = (m + n + 1) / 2;
    int lo = 0, hi = m;

    while (lo <= hi) {
        int i = lo + (hi - lo) / 2;      // taken from a
        int j = half - i;                // taken from b

        int aLeft  = (i == 0) ? Integer.MIN_VALUE : a[i - 1];
        int aRight = (i == m) ? Integer.MAX_VALUE : a[i];
        int bLeft  = (j == 0) ? Integer.MIN_VALUE : b[j - 1];
        int bRight = (j == n) ? Integer.MAX_VALUE : b[j];

        if (aLeft <= bRight && bLeft <= aRight) {        // correct split
            if ((m + n) % 2 == 1) return Math.max(aLeft, bLeft);
            return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2.0;
        }
        if (aLeft > bRight) hi = i - 1;   // took too many from a
        else                lo = i + 1;   // took too few
    }
    throw new IllegalArgumentException("arrays are not sorted");
}`,
      python: `def find_median(a: list[int], b: list[int]) -> float:
    if len(a) > len(b):
        a, b = b, a
    m, n = len(a), len(b)
    half = (m + n + 1) // 2
    lo, hi = 0, m

    while lo <= hi:
        i = lo + (hi - lo) // 2
        j = half - i
        a_left = float("-inf") if i == 0 else a[i - 1]
        a_right = float("inf") if i == m else a[i]
        b_left = float("-inf") if j == 0 else b[j - 1]
        b_right = float("inf") if j == n else b[j]

        if a_left <= b_right and b_left <= a_right:
            if (m + n) % 2:
                return max(a_left, b_left)
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        if a_left > b_right:
            hi = i - 1
        else:
            lo = i + 1
    raise ValueError("arrays are not sorted")` }
  ],
  note: `<p>The ±∞ sentinels are what remove every boundary special case — they let an empty side always compare correctly. Recursing on the shorter array is what guarantees the log(min(m,n)) bound.</p>`
}
]});
