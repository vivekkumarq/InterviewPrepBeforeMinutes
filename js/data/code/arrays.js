registerCode("arrays", {
intro: `<p>An array stores items side by side in one block of memory. That single fact explains everything about it: reading index <code>i</code> is O(1) because the address is just <code>start + i × size</code>, but inserting in the middle is O(n) because everything after it has to shift.</p>
<table>
<tr><th>Operation</th><th>Cost</th><th>Why</th></tr>
<tr><td>Read / write by index</td><td>O(1)</td><td>Address arithmetic</td></tr>
<tr><td>Search (unsorted)</td><td>O(n)</td><td>Must look at everything</td></tr>
<tr><td>Search (sorted)</td><td>O(log n)</td><td>Binary search</td></tr>
<tr><td>Insert / delete at the end</td><td>O(1) amortised</td><td>Occasional resize</td></tr>
<tr><td>Insert / delete in the middle</td><td>O(n)</td><td>Shift the rest</td></tr>
</table>
<p><strong>The four techniques below solve most array questions.</strong> Recognising which one applies is the skill being tested:</p>
<table>
<tr><th>Technique</th><th>Use when</th></tr>
<tr><td><strong>Two pointers</strong></td><td>Sorted input, or comparing from both ends</td></tr>
<tr><td><strong>Sliding window</strong></td><td>Contiguous subarray, non-negative values</td></tr>
<tr><td><strong>Prefix sums</strong></td><td>Many range queries, or subarray sums with negatives</td></tr>
<tr><td><strong>Hash map</strong></td><td>"Have I seen this before?" in one pass</td></tr>
</table>`,
questions: [
{
  slug: "largest-number", n: 11, title: "Find the Largest Number", difficulty: "easy",
  statement: `<p>Return the maximum value in an array.</p>`,
  approaches: [
    { name: "Sort and take the last", time: "O(n log n)", space: "O(1)",
      note: "Correct but wasteful — you paid to order everything when you only wanted one value. It also destroys the caller's array.",
      java: `public static int max(int[] a) {
    int[] copy = a.clone();
    Arrays.sort(copy);
    return copy[copy.length - 1];
}`,
      python: `def maximum(a: list[int]) -> int:
    return sorted(a)[-1]` },
    { name: "Single pass", time: "O(n)", space: "O(1)", best: true,
      note: "Track the best so far. Seed with the first element, not 0 — seeding with 0 returns 0 for an all-negative array.",
      java: `public static int max(int[] a) {
    if (a.length == 0) throw new IllegalArgumentException("empty");
    int best = a[0];
    for (int i = 1; i < a.length; i++)
        if (a[i] > best) best = a[i];
    return best;
}`,
      python: `def maximum(a: list[int]) -> int:
    if not a:
        raise ValueError("empty")
    best = a[0]
    for x in a[1:]:
        if x > best:
            best = x
    return best` }
  ],
  note: `<p>Seeding with <code>Integer.MIN_VALUE</code> works too, but seeding with <code>0</code> is the classic bug — it silently returns 0 for <code>[-5, -2, -9]</code>.</p>`
},
{
  slug: "second-largest", n: 12, title: "Second Largest Number", difficulty: "easy",
  statement: `<p>Return the second largest <em>distinct</em> value. For <code>[5, 5, 4]</code> the answer is 4, not 5.</p>`,
  approaches: [
    { name: "Sort and scan back", time: "O(n log n)", space: "O(n)",
      note: "Sort, then walk backwards until the value differs from the maximum.",
      java: `public static int secondLargest(int[] a) {
    int[] c = a.clone();
    Arrays.sort(c);
    for (int i = c.length - 2; i >= 0; i--)
        if (c[i] != c[c.length - 1]) return c[i];
    throw new IllegalArgumentException("all equal");
}`,
      python: `def second_largest(a: list[int]) -> int:
    uniq = sorted(set(a))
    if len(uniq) < 2:
        raise ValueError("all equal")
    return uniq[-2]` },
    { name: "One pass, two variables", time: "O(n)", space: "O(1)", best: true,
      note: "Hold the best and the runner-up. The equality skip is what makes it handle duplicates correctly.",
      java: `public static int secondLargest(int[] a) {
    long best = Long.MIN_VALUE, second = Long.MIN_VALUE;
    for (int x : a) {
        if (x > best) { second = best; best = x; }
        else if (x < best && x > second) second = x;   // x == best is skipped
    }
    if (second == Long.MIN_VALUE) throw new IllegalArgumentException("all equal");
    return (int) second;
}`,
      python: `def second_largest(a: list[int]) -> int:
    best = second = float("-inf")
    for x in a:
        if x > best:
            best, second = x, best
        elif x < best and x > second:
            second = x
    if second == float("-inf"):
        raise ValueError("all equal")
    return int(second)` }
  ],
  note: `<p>The <code>x &lt; best</code> guard is the whole question. Without it, a second copy of the maximum overwrites the runner-up and <code>[5, 5, 4]</code> answers 5.</p>`
},
{
  slug: "reverse-array", n: 13, title: "Reverse an Array", difficulty: "easy",
  statement: `<p>Reverse the array in place.</p>`,
  approaches: [
    { name: "Copy into a new array", time: "O(n)", space: "O(n)",
      note: "Simple, but allocates a second array when none is needed.",
      java: `public static int[] reversed(int[] a) {
    int[] out = new int[a.length];
    for (int i = 0; i < a.length; i++)
        out[i] = a[a.length - 1 - i];
    return out;
}`,
      python: `def reversed_copy(a: list[int]) -> list[int]:
    return a[::-1]` },
    { name: "Two pointers, in place", time: "O(n)", space: "O(1)", best: true,
      note: "Swap from both ends inwards. Stops at the middle, so each element moves exactly once.",
      java: `public static void reverse(int[] a) {
    int i = 0, j = a.length - 1;
    while (i < j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
        i++; j--;
    }
}`,
      python: `def reverse(a: list[int]) -> None:
    i, j = 0, len(a) - 1
    while i < j:
        a[i], a[j] = a[j], a[i]
        i += 1
        j -= 1` }
  ]
},
{
  slug: "rotate-array", n: 14, title: "Rotate an Array", difficulty: "medium",
  statement: `<p>Rotate the array right by k steps. <code>[1,2,3,4,5]</code> with k=2 becomes <code>[4,5,1,2,3]</code>.</p>`,
  approaches: [
    { name: "Extra array", time: "O(n)", space: "O(n)",
      note: "Place each element at its final index directly. Clear, but doubles memory.",
      java: `public static void rotate(int[] a, int k) {
    int n = a.length;
    k %= n;
    int[] out = new int[n];
    for (int i = 0; i < n; i++) out[(i + k) % n] = a[i];
    System.arraycopy(out, 0, a, 0, n);
}`,
      python: `def rotate(a: list[int], k: int) -> None:
    n = len(a)
    k %= n
    a[:] = a[-k:] + a[:-k] if k else a` },
    { name: "Reverse three times", time: "O(n)", space: "O(1)", best: true,
      note: "Reverse the whole array, then reverse each of the two parts. Elegant, in place, and the answer they are looking for.",
      java: `public static void rotate(int[] a, int k) {
    int n = a.length;
    k %= n;                       // k may exceed n
    if (k < 0) k += n;
    reverse(a, 0, n - 1);
    reverse(a, 0, k - 1);
    reverse(a, k, n - 1);
}

private static void reverse(int[] a, int i, int j) {
    while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
}`,
      python: `def rotate(a: list[int], k: int) -> None:
    n = len(a)
    k %= n

    def rev(i: int, j: int) -> None:
        while i < j:
            a[i], a[j] = a[j], a[i]
            i += 1
            j -= 1

    rev(0, n - 1)
    rev(0, k - 1)
    rev(k, n - 1)` }
  ],
  note: `<p><code>k %= n</code> first, always. A k larger than the array walks straight off the end, and it is the input interviewers try.</p>`
},
{
  slug: "remove-duplicates-sorted", n: 15, title: "Remove Duplicates from a Sorted Array", difficulty: "easy",
  statement: `<p>Remove duplicates in place from a sorted array and return the new length. The first k slots must hold the unique values.</p>`,
  approaches: [
    { name: "Read and write pointers", time: "O(n)", space: "O(1)", best: true,
      note: "One pointer reads every element, a slower one writes only new values. Because the array is sorted, duplicates are always adjacent.",
      java: `public static int removeDuplicates(int[] a) {
    if (a.length == 0) return 0;
    int write = 1;
    for (int read = 1; read < a.length; read++)
        if (a[read] != a[write - 1]) a[write++] = a[read];
    return write;
}`,
      python: `def remove_duplicates(a: list[int]) -> int:
    if not a:
        return 0
    write = 1
    for read in range(1, len(a)):
        if a[read] != a[write - 1]:
            a[write] = a[read]
            write += 1
    return write` }
  ],
  note: `<p>The read/write pointer pair is the same shape as <em>move zeroes</em> and <em>remove element</em> — one traversal, one compaction. Recognise it once and three problems collapse into one.</p>`
},
{
  slug: "move-zeroes", n: 16, title: "Move Zeroes to the End", difficulty: "easy",
  statement: `<p>Move every zero to the end while keeping the relative order of the non-zero values. Do it in place.</p>`,
  approaches: [
    { name: "Two passes", time: "O(n)", space: "O(1)",
      note: "Compact the non-zeros forward, then fill the tail with zeros. Easy to reason about.",
      java: `public static void moveZeroes(int[] a) {
    int write = 0;
    for (int x : a) if (x != 0) a[write++] = x;
    while (write < a.length) a[write++] = 0;
}`,
      python: `def move_zeroes(a: list[int]) -> None:
    write = 0
    for x in a:
        if x != 0:
            a[write] = x
            write += 1
    for i in range(write, len(a)):
        a[i] = 0` },
    { name: "One pass, swapping", time: "O(n)", space: "O(1)", best: true,
      note: "Swap each non-zero into the write slot. Same complexity, but every element is touched once and order is still preserved.",
      java: `public static void moveZeroes(int[] a) {
    int write = 0;
    for (int read = 0; read < a.length; read++) {
        if (a[read] != 0) {
            int t = a[write]; a[write] = a[read]; a[read] = t;
            write++;
        }
    }
}`,
      python: `def move_zeroes(a: list[int]) -> None:
    write = 0
    for read in range(len(a)):
        if a[read] != 0:
            a[write], a[read] = a[read], a[write]
            write += 1` }
  ]
},
{
  slug: "two-sum", n: 17, title: "Two Sum", difficulty: "easy",
  statement: `<p>Given an array and a target, return the indices of the two numbers that add to the target. Exactly one answer exists.</p>
<p>The most asked array question there is.</p>`,
  approaches: [
    { name: "Check every pair", time: "O(n²)", space: "O(1)",
      note: "The honest starting point. Say it, state its cost, then improve it — that sequence is what is being graded.",
      java: `public static int[] twoSum(int[] a, int target) {
    for (int i = 0; i < a.length; i++)
        for (int j = i + 1; j < a.length; j++)
            if (a[i] + a[j] == target) return new int[]{i, j};
    return new int[0];
}`,
      python: `def two_sum(a: list[int], target: int) -> list[int]:
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[i] + a[j] == target:
                return [i, j]
    return []` },
    { name: "Hash map, one pass", time: "O(n)", space: "O(n)", best: true,
      note: "For each value ask whether its complement was already seen. Check BEFORE inserting, or an element pairs with itself.",
      java: `public static int[] twoSum(int[] a, int target) {
    Map<Integer, Integer> seen = new HashMap<>();   // value -> index
    for (int i = 0; i < a.length; i++) {
        Integer j = seen.get(target - a[i]);
        if (j != null) return new int[]{j, i};
        seen.put(a[i], i);
    }
    return new int[0];
}`,
      python: `def two_sum(a: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, x in enumerate(a):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []` },
    { name: "Sort and two pointers", time: "O(n log n)", space: "O(n)",
      note: "Only if the array is already sorted or you may return VALUES rather than indices — sorting destroys the original positions.",
      java: `public static int[] twoSumSorted(int[] sorted, int target) {
    int i = 0, j = sorted.length - 1;
    while (i < j) {
        int sum = sorted[i] + sorted[j];
        if (sum == target) return new int[]{i, j};
        if (sum < target) i++; else j--;
    }
    return new int[0];
}`,
      python: `def two_sum_sorted(s: list[int], target: int) -> list[int]:
    i, j = 0, len(s) - 1
    while i < j:
        total = s[i] + s[j]
        if total == target:
            return [i, j]
        if total < target:
            i += 1
        else:
            j -= 1
    return []` }
  ],
  note: `<p><strong>Ask whether indices or values are wanted.</strong> If values, sorting is free game and the two-pointer version uses O(1) extra space. If indices, sorting loses them and the hash map wins.</p>`
},
{
  slug: "buy-sell-stock", n: 18, title: "Best Time to Buy and Sell Stock", difficulty: "easy",
  statement: `<p>Given daily prices, find the maximum profit from one buy and one later sell. If no profit is possible, return 0.</p>`,
  approaches: [
    { name: "Every pair", time: "O(n²)", space: "O(1)",
      note: "Try every buy day against every later sell day.",
      java: `public static int maxProfit(int[] p) {
    int best = 0;
    for (int i = 0; i < p.length; i++)
        for (int j = i + 1; j < p.length; j++)
            best = Math.max(best, p[j] - p[i]);
    return best;
}`,
      python: `def max_profit(p: list[int]) -> int:
    best = 0
    for i in range(len(p)):
        for j in range(i + 1, len(p)):
            best = max(best, p[j] - p[i])
    return best` },
    { name: "Track the cheapest so far", time: "O(n)", space: "O(1)", best: true,
      note: "At each day, the best sale today is today's price minus the cheapest price seen before today. One pass, two variables.",
      java: `public static int maxProfit(int[] p) {
    int cheapest = Integer.MAX_VALUE, best = 0;
    for (int price : p) {
        cheapest = Math.min(cheapest, price);
        best = Math.max(best, price - cheapest);
    }
    return best;
}`,
      python: `def max_profit(p: list[int]) -> int:
    cheapest, best = float("inf"), 0
    for price in p:
        cheapest = min(cheapest, price)
        best = max(best, price - cheapest)
    return best` }
  ],
  note: `<p>Updating <code>cheapest</code> before computing the profit is safe: buying and selling on the same day yields 0, which never beats a real profit.</p>`
},
{
  slug: "maximum-subarray", n: 19, title: "Maximum Subarray Sum", difficulty: "medium",
  statement: `<p>Find the contiguous subarray with the largest sum. <code>[-2,1,-3,4,-1,2,1,-5,4]</code> gives 6, from <code>[4,-1,2,1]</code>.</p>`,
  approaches: [
    { name: "Every subarray", time: "O(n²)", space: "O(1)",
      note: "Extend each start point and track the running sum.",
      java: `public static int maxSubArray(int[] a) {
    int best = a[0];
    for (int i = 0; i < a.length; i++) {
        int sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            best = Math.max(best, sum);
        }
    }
    return best;
}`,
      python: `def max_subarray(a: list[int]) -> int:
    best = a[0]
    for i in range(len(a)):
        total = 0
        for j in range(i, len(a)):
            total += a[j]
            best = max(best, total)
    return best` },
    { name: "Kadane's algorithm", time: "O(n)", space: "O(1)", best: true,
      note: "One decision per element: extend the previous run, or start fresh here. If the running sum has gone negative it can only hurt, so drop it.",
      java: `public static int maxSubArray(int[] a) {
    int current = a[0], best = a[0];
    for (int i = 1; i < a.length; i++) {
        current = Math.max(a[i], current + a[i]);   // start fresh, or extend
        best = Math.max(best, current);
    }
    return best;
}`,
      python: `def max_subarray(a: list[int]) -> int:
    current = best = a[0]
    for x in a[1:]:
        current = max(x, current + x)
        best = max(best, current)
    return best` }
  ],
  note: `<p><strong>Seed with <code>a[0]</code>, not 0.</strong> An all-negative array like <code>[-3,-1,-2]</code> must return −1; seeding with 0 wrongly returns 0, because it implies an empty subarray is allowed. Ask whether it is.</p>`
},
{
  slug: "product-except-self", n: 20, title: "Product of Array Except Self", difficulty: "medium",
  statement: `<p>Return an array where each position holds the product of every other element. <strong>Without using division</strong>, in O(n).</p>`,
  approaches: [
    { name: "Divide the total product", time: "O(n)", space: "O(1)",
      note: "Banned by the problem, and genuinely broken: a single zero makes the total zero, and two zeros break it completely. Worth naming as the trap.",
      java: `// Fails on zeros, and the question forbids division anyway.
int total = 1;
for (int x : a) total *= x;
out[i] = total / a[i];`,
      python: `# Fails on zeros, and the question forbids division anyway.
total = 1
for x in a:
    total *= x
out = [total // x for x in a]` },
    { name: "Prefix and suffix products", time: "O(n)", space: "O(1)*", best: true,
      note: "Everything to the left times everything to the right. Build left products in one pass, then multiply by right products on the way back. *The output array does not count as extra space.",
      java: `public static int[] productExceptSelf(int[] a) {
    int n = a.length;
    int[] out = new int[n];

    out[0] = 1;
    for (int i = 1; i < n; i++)
        out[i] = out[i - 1] * a[i - 1];       // product of everything LEFT

    int right = 1;
    for (int i = n - 1; i >= 0; i--) {
        out[i] *= right;                      // times everything RIGHT
        right *= a[i];
    }
    return out;
}`,
      python: `def product_except_self(a: list[int]) -> list[int]:
    n = len(a)
    out = [1] * n
    for i in range(1, n):
        out[i] = out[i - 1] * a[i - 1]
    right = 1
    for i in range(n - 1, -1, -1):
        out[i] *= right
        right *= a[i]
    return out` }
  ],
  note: `<p>Handles zeros for free — nothing is ever divided, so a zero simply contributes a zero factor wherever it belongs.</p>`
},
{
  slug: "majority-element", n: 21, title: "Majority Element", difficulty: "easy",
  statement: `<p>Find the element appearing more than ⌊n/2⌋ times. Assume one always exists.</p>`,
  approaches: [
    { name: "Count with a hash map", time: "O(n)", space: "O(n)",
      note: "Obvious and correct. The only cost is the map.",
      java: `public static int majority(int[] a) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int x : a) {
        int c = count.merge(x, 1, Integer::sum);
        if (c > a.length / 2) return x;
    }
    return -1;
}`,
      python: `from collections import Counter

def majority(a: list[int]) -> int:
    return Counter(a).most_common(1)[0][0]` },
    { name: "Boyer–Moore voting", time: "O(n)", space: "O(1)", best: true,
      note: "Pair each majority element with a different one; they cancel. Since the majority occurs more than half the time, it is what survives.",
      java: `public static int majority(int[] a) {
    int candidate = a[0], count = 0;
    for (int x : a) {
        if (count == 0) candidate = x;
        count += (x == candidate) ? 1 : -1;
    }
    return candidate;
}`,
      python: `def majority(a: list[int]) -> int:
    candidate, count = a[0], 0
    for x in a:
        if count == 0:
            candidate = x
        count += 1 if x == candidate else -1
    return candidate` }
  ],
  note: `<p>Boyer–Moore assumes a majority exists. If it might not, add a second pass to verify the candidate really does occur more than n/2 times — interviewers ask this follow-up almost every time.</p>`
},
{
  slug: "missing-number", n: 22, title: "Missing Number", difficulty: "easy",
  statement: `<p>An array holds n distinct numbers from the range 0..n. Find the one that is missing.</p>`,
  approaches: [
    { name: "Sum formula", time: "O(n)", space: "O(1)",
      note: "The sum of 0..n is n(n+1)/2. Subtract the actual sum and the difference is the missing value.",
      java: `public static int missing(int[] a) {
    int n = a.length;
    long expected = (long) n * (n + 1) / 2;
    long actual = 0;
    for (int x : a) actual += x;
    return (int) (expected - actual);
}`,
      python: `def missing(a: list[int]) -> int:
    n = len(a)
    return n * (n + 1) // 2 - sum(a)` },
    { name: "XOR", time: "O(n)", space: "O(1)", best: true,
      note: "XOR every index and every value. Pairs cancel, leaving the missing number. Cannot overflow, which the sum version can for large n in Java.",
      java: `public static int missing(int[] a) {
    int result = a.length;
    for (int i = 0; i < a.length; i++)
        result ^= i ^ a[i];
    return result;
}`,
      python: `def missing(a: list[int]) -> int:
    result = len(a)
    for i, x in enumerate(a):
        result ^= i ^ x
    return result` }
  ],
  note: `<p>The <code>long</code> in the Java sum version matters: for n near 2 billion, <code>n(n+1)/2</code> overflows an int and silently returns nonsense. XOR sidesteps it entirely.</p>`
},
{
  slug: "sort-colors", n: 23, title: "Sort 0s, 1s and 2s", difficulty: "medium",
  statement: `<p>Sort an array containing only 0, 1 and 2 — in a single pass, in place.</p>`,
  approaches: [
    { name: "Count and overwrite", time: "O(n)", space: "O(1)",
      note: "Count each value, then rewrite the array. Two passes, and it fails if the elements are objects carrying other data.",
      java: `public static void sortColors(int[] a) {
    int[] count = new int[3];
    for (int x : a) count[x]++;
    int i = 0;
    for (int v = 0; v < 3; v++)
        for (int c = 0; c < count[v]; c++) a[i++] = v;
}`,
      python: `def sort_colors(a: list[int]) -> None:
    count = [0, 0, 0]
    for x in a:
        count[x] += 1
    i = 0
    for v in range(3):
        for _ in range(count[v]):
            a[i] = v
            i += 1` },
    { name: "Dutch national flag", time: "O(n)", space: "O(1)", best: true,
      note: "Three pointers, one pass, real swaps. After swapping from the back, mid does NOT advance — the incoming value has not been examined yet.",
      java: `public static void sortColors(int[] a) {
    int low = 0, mid = 0, high = a.length - 1;
    while (mid <= high) {
        if (a[mid] == 0)      swap(a, low++, mid++);
        else if (a[mid] == 1) mid++;
        else                  swap(a, mid, high--);   // mid stays put
    }
}

private static void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}`,
      python: `def sort_colors(a: list[int]) -> None:
    low = mid = 0
    high = len(a) - 1
    while mid <= high:
        if a[mid] == 0:
            a[low], a[mid] = a[mid], a[low]
            low += 1
            mid += 1
        elif a[mid] == 1:
            mid += 1
        else:
            a[mid], a[high] = a[high], a[mid]
            high -= 1          # mid stays put` }
  ],
  note: `<p>That one line — not advancing <code>mid</code> after a swap with <code>high</code> — <em>is</em> the interview question. Advancing it skips an unexamined value and the array comes out subtly wrong.</p>`
},
{
  slug: "merge-intervals", n: 24, title: "Merge Overlapping Intervals", difficulty: "medium",
  statement: `<p>Merge all overlapping intervals. <code>[[1,3],[2,6],[8,10]]</code> becomes <code>[[1,6],[8,10]]</code>.</p>`,
  approaches: [
    { name: "Sort by start, then sweep", time: "O(n log n)", space: "O(n)", best: true,
      note: "Once sorted by start, an interval can only overlap the one immediately before it. Extend or append.",
      java: `public static int[][] merge(int[][] iv) {
    Arrays.sort(iv, (x, y) -> Integer.compare(x[0], y[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : iv) {
        int[] last = out.isEmpty() ? null : out.get(out.size() - 1);
        if (last != null && cur[0] <= last[1])
            last[1] = Math.max(last[1], cur[1]);     // Math.max is essential
        else
            out.add(new int[]{cur[0], cur[1]});
    }
    return out.toArray(new int[0][]);
}`,
      python: `def merge(iv: list[list[int]]) -> list[list[int]]:
    iv.sort(key=lambda p: p[0])
    out: list[list[int]] = []
    for start, end in iv:
        if out and start <= out[-1][1]:
            out[-1][1] = max(out[-1][1], end)
        else:
            out.append([start, end])
    return out` }
  ],
  note: `<p><strong><code>Math.max</code> is not optional.</strong> For <code>[1,10]</code> followed by <code>[2,3]</code>, assigning <code>last[1] = cur[1]</code> shrinks the interval to <code>[1,3]</code> and quietly loses data.</p>`
},
{
  slug: "subarray-sum-k", n: 25, title: "Count Subarrays That Sum to K", difficulty: "medium",
  statement: `<p>Count the contiguous subarrays whose sum equals k. Values may be negative.</p>`,
  approaches: [
    { name: "Every subarray", time: "O(n²)", space: "O(1)",
      note: "Extend from each start and count hits.",
      java: `public static int count(int[] a, int k) {
    int total = 0;
    for (int i = 0; i < a.length; i++) {
        int sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            if (sum == k) total++;
        }
    }
    return total;
}`,
      python: `def count(a: list[int], k: int) -> int:
    total = 0
    for i in range(len(a)):
        s = 0
        for j in range(i, len(a)):
            s += a[j]
            if s == k:
                total += 1
    return total` },
    { name: "Prefix sums in a hash map", time: "O(n)", space: "O(n)", best: true,
      note: "If the running sum is S and some earlier prefix was S−k, the slice between them sums to k. Seed the map with 0 so a prefix that equals k counts itself.",
      java: `public static int count(int[] a, int k) {
    Map<Long, Integer> seen = new HashMap<>();
    seen.put(0L, 1);                       // the empty prefix
    long running = 0;
    int total = 0;
    for (int x : a) {
        running += x;
        total += seen.getOrDefault(running - k, 0);
        seen.merge(running, 1, Integer::sum);
    }
    return total;
}`,
      python: `from collections import defaultdict

def count(a: list[int], k: int) -> int:
    seen = defaultdict(int)
    seen[0] = 1
    running = total = 0
    for x in a:
        running += x
        total += seen[running - k]
        seen[running] += 1
    return total` }
  ],
  note: `<p><strong>Why not a sliding window?</strong> Because negatives are allowed. Growing the window no longer increases the sum monotonically, so "shrink while too big" is unsound. Ask about negatives before choosing — that single question decides the algorithm.</p>`
},
{
  slug: "container-most-water", n: 26, title: "Container With Most Water", difficulty: "medium",
  statement: `<p>Each value is a vertical line's height. Pick two lines that, with the x-axis, hold the most water.</p>`,
  approaches: [
    { name: "Every pair", time: "O(n²)", space: "O(1)",
      note: "Area is the shorter line times the distance between them.",
      java: `public static int maxArea(int[] h) {
    int best = 0;
    for (int i = 0; i < h.length; i++)
        for (int j = i + 1; j < h.length; j++)
            best = Math.max(best, Math.min(h[i], h[j]) * (j - i));
    return best;
}`,
      python: `def max_area(h: list[int]) -> int:
    best = 0
    for i in range(len(h)):
        for j in range(i + 1, len(h)):
            best = max(best, min(h[i], h[j]) * (j - i))
    return best` },
    { name: "Two pointers from the ends", time: "O(n)", space: "O(1)", best: true,
      note: "Start at the widest pair and move the SHORTER line inward. Moving the taller one can only lose area: the width shrinks and the height is still capped by the shorter line.",
      java: `public static int maxArea(int[] h) {
    int i = 0, j = h.length - 1, best = 0;
    while (i < j) {
        best = Math.max(best, Math.min(h[i], h[j]) * (j - i));
        if (h[i] < h[j]) i++; else j--;      // move the shorter side
    }
    return best;
}`,
      python: `def max_area(h: list[int]) -> int:
    i, j, best = 0, len(h) - 1, 0
    while i < j:
        best = max(best, min(h[i], h[j]) * (j - i))
        if h[i] < h[j]:
            i += 1
        else:
            j -= 1
    return best` }
  ],
  note: `<p>That argument — "moving the taller line cannot help" — is the proof the interviewer wants. Say it before you write the loop.</p>`
},
{
  slug: "three-sum", n: 27, title: "Three Numbers That Sum to Zero (3Sum)", difficulty: "medium",
  statement: `<p>Find all unique triplets that sum to zero. No duplicate triplets in the output.</p>`,
  approaches: [
    { name: "Three nested loops", time: "O(n³)", space: "O(n)",
      note: "Correct, far too slow, and deduplicating the result is awkward.",
      java: `// i < j < k over every combination, collecting sums of zero into a Set
// to remove duplicates. O(n^3) and only worth mentioning as the baseline.`,
      python: `# i < j < k over every combination, collecting sums of zero into a set
# to remove duplicates. O(n^3) and only worth mentioning as the baseline.` },
    { name: "Sort, then two pointers", time: "O(n²)", space: "O(1)*", best: true,
      note: "Fix one number, then two-pointer the rest for its negation. Sorting is what makes both the two-pointer scan and duplicate-skipping possible. *Excluding the output.",
      java: `public static List<List<Integer>> threeSum(int[] a) {
    Arrays.sort(a);
    List<List<Integer>> out = new ArrayList<>();
    for (int i = 0; i < a.length - 2; i++) {
        if (a[i] > 0) break;                          // sorted: no zero sum left
        if (i > 0 && a[i] == a[i - 1]) continue;      // skip duplicate anchors
        int j = i + 1, k = a.length - 1;
        while (j < k) {
            int sum = a[i] + a[j] + a[k];
            if (sum < 0) j++;
            else if (sum > 0) k--;
            else {
                out.add(Arrays.asList(a[i], a[j], a[k]));
                while (j < k && a[j] == a[j + 1]) j++;    // skip duplicates
                while (j < k && a[k] == a[k - 1]) k--;
                j++; k--;
            }
        }
    }
    return out;
}`,
      python: `def three_sum(a: list[int]) -> list[list[int]]:
    a.sort()
    out: list[list[int]] = []
    for i in range(len(a) - 2):
        if a[i] > 0:
            break
        if i > 0 and a[i] == a[i - 1]:
            continue
        j, k = i + 1, len(a) - 1
        while j < k:
            total = a[i] + a[j] + a[k]
            if total < 0:
                j += 1
            elif total > 0:
                k -= 1
            else:
                out.append([a[i], a[j], a[k]])
                while j < k and a[j] == a[j + 1]:
                    j += 1
                while j < k and a[k] == a[k - 1]:
                    k -= 1
                j += 1
                k -= 1
    return out` }
  ],
  note: `<p>The three duplicate skips are the whole difficulty. Without them the answer is right but contains repeats — and that is exactly what the test cases check.</p>`
},
{
  slug: "trapping-rain-water", n: 28, title: "Trapping Rain Water", difficulty: "hard",
  statement: `<p>Given an elevation map, compute how much rain water is trapped between the bars.</p>`,
  approaches: [
    { name: "Scan for max on both sides", time: "O(n²)", space: "O(1)",
      note: "Water above a bar is min(tallest left, tallest right) − its own height. Rescanning for those maxima each time is quadratic.",
      java: `public static int trap(int[] h) {
    int total = 0;
    for (int i = 0; i < h.length; i++) {
        int left = 0, right = 0;
        for (int j = 0; j <= i; j++) left = Math.max(left, h[j]);
        for (int j = i; j < h.length; j++) right = Math.max(right, h[j]);
        total += Math.min(left, right) - h[i];
    }
    return total;
}`,
      python: `def trap(h: list[int]) -> int:
    total = 0
    for i in range(len(h)):
        left = max(h[: i + 1])
        right = max(h[i:])
        total += min(left, right) - h[i]
    return total` },
    { name: "Precompute both maxima", time: "O(n)", space: "O(n)",
      note: "Two passes store the running maxima, so each position becomes a lookup. Linear time, at the cost of two arrays.",
      java: `public static int trap(int[] h) {
    int n = h.length;
    if (n == 0) return 0;
    int[] left = new int[n], right = new int[n];
    left[0] = h[0];
    for (int i = 1; i < n; i++) left[i] = Math.max(left[i - 1], h[i]);
    right[n - 1] = h[n - 1];
    for (int i = n - 2; i >= 0; i--) right[i] = Math.max(right[i + 1], h[i]);
    int total = 0;
    for (int i = 0; i < n; i++) total += Math.min(left[i], right[i]) - h[i];
    return total;
}`,
      python: `def trap(h: list[int]) -> int:
    if not h:
        return 0
    n = len(h)
    left, right = [0] * n, [0] * n
    left[0] = h[0]
    for i in range(1, n):
        left[i] = max(left[i - 1], h[i])
    right[-1] = h[-1]
    for i in range(n - 2, -1, -1):
        right[i] = max(right[i + 1], h[i])
    return sum(min(left[i], right[i]) - h[i] for i in range(n))` },
    { name: "Two pointers", time: "O(n)", space: "O(1)", best: true,
      note: "Work inwards from both ends. Whichever side is shorter is the side whose water level is already known, so it can be settled immediately.",
      java: `public static int trap(int[] h) {
    int i = 0, j = h.length - 1, leftMax = 0, rightMax = 0, total = 0;
    while (i < j) {
        if (h[i] < h[j]) {
            leftMax = Math.max(leftMax, h[i]);
            total += leftMax - h[i];
            i++;
        } else {
            rightMax = Math.max(rightMax, h[j]);
            total += rightMax - h[j];
            j--;
        }
    }
    return total;
}`,
      python: `def trap(h: list[int]) -> int:
    i, j = 0, len(h) - 1
    left_max = right_max = total = 0
    while i < j:
        if h[i] < h[j]:
            left_max = max(left_max, h[i])
            total += left_max - h[i]
            i += 1
        else:
            right_max = max(right_max, h[j])
            total += right_max - h[j]
            j -= 1
    return total` }
  ],
  note: `<p>There is also a monotonic-stack solution that fills basin by basin — same O(n), and worth naming if the interviewer asks for another angle.</p>`
},
{
  slug: "spiral-matrix", n: 29, title: "Spiral Order of a Matrix", difficulty: "medium",
  statement: `<p>Return all elements of a matrix in spiral order: right along the top, down the right, left along the bottom, up the left, then inward.</p>`,
  approaches: [
    { name: "Four boundaries", time: "O(m·n)", space: "O(1)*", best: true,
      note: "Track top, bottom, left, right and shrink them after each edge. The two extra checks before the reverse passes are what stops a single remaining row or column being emitted twice. *Excluding the output.",
      java: `public static List<Integer> spiral(int[][] m) {
    List<Integer> out = new ArrayList<>();
    if (m.length == 0) return out;
    int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.add(m[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) out.add(m[r][right]);
        right--;
        if (top <= bottom) {                       // still a row left?
            for (int c = right; c >= left; c--) out.add(m[bottom][c]);
            bottom--;
        }
        if (left <= right) {                       // still a column left?
            for (int r = bottom; r >= top; r--) out.add(m[r][left]);
            left++;
        }
    }
    return out;
}`,
      python: `def spiral(m: list[list[int]]) -> list[int]:
    if not m:
        return []
    out: list[int] = []
    top, bottom = 0, len(m) - 1
    left, right = 0, len(m[0]) - 1
    while top <= bottom and left <= right:
        out.extend(m[top][c] for c in range(left, right + 1))
        top += 1
        out.extend(m[r][right] for r in range(top, bottom + 1))
        right -= 1
        if top <= bottom:
            out.extend(m[bottom][c] for c in range(right, left - 1, -1))
            bottom -= 1
        if left <= right:
            out.extend(m[r][left] for r in range(bottom, top - 1, -1))
            left += 1
    return out` }
  ],
  note: `<p>Test it on a single row <code>[[1,2,3]]</code> and a single column. Those are the inputs the boundary checks exist for, and the ones interviewers reach for first.</p>`
},
{
  slug: "rotate-matrix", n: 30, title: "Rotate a Matrix 90°", difficulty: "medium",
  statement: `<p>Rotate an n×n matrix 90° clockwise, in place.</p>`,
  approaches: [
    { name: "New matrix", time: "O(n²)", space: "O(n²)",
      note: "Column i becomes row i, reversed. Clear, but the question usually says in place.",
      java: `public static int[][] rotated(int[][] m) {
    int n = m.length;
    int[][] out = new int[n][n];
    for (int r = 0; r < n; r++)
        for (int c = 0; c < n; c++)
            out[c][n - 1 - r] = m[r][c];
    return out;
}`,
      python: `def rotated(m: list[list[int]]) -> list[list[int]]:
    return [list(row) for row in zip(*m[::-1])]` },
    { name: "Transpose, then reverse each row", time: "O(n²)", space: "O(1)", best: true,
      note: "Two simple steps instead of one confusing index formula. Transpose mirrors across the diagonal; reversing each row completes the clockwise turn.",
      java: `public static void rotate(int[][] m) {
    int n = m.length;
    for (int r = 0; r < n; r++)                  // transpose
        for (int c = r + 1; c < n; c++) {        // c starts at r+1,
            int t = m[r][c];                     // or you swap twice
            m[r][c] = m[c][r];
            m[c][r] = t;
        }
    for (int[] row : m) {                        // reverse each row
        int i = 0, j = n - 1;
        while (i < j) { int t = row[i]; row[i++] = row[j]; row[j--] = t; }
    }
}`,
      python: `def rotate(m: list[list[int]]) -> None:
    n = len(m)
    for r in range(n):
        for c in range(r + 1, n):
            m[r][c], m[c][r] = m[c][r], m[r][c]
    for row in m:
        row.reverse()` }
  ],
  note: `<p>Starting the inner transpose loop at <code>r + 1</code> is essential: from 0 you swap every pair twice and end up with the original matrix. For anticlockwise, reverse the rows first and then transpose.</p>`
},
{
  slug: "merge-sorted-arrays", n: 31, title: "Merge Two Sorted Arrays", difficulty: "easy",
  statement: `<p>Merge sorted array b into sorted array a, which has exactly enough trailing space. Do it in place.</p>`,
  approaches: [
    { name: "Concatenate and sort", time: "O((m+n) log(m+n))", space: "O(1)",
      note: "Throws away the fact that both inputs are already sorted, which is the only interesting property here.",
      java: `public static void merge(int[] a, int m, int[] b, int n) {
    System.arraycopy(b, 0, a, m, n);
    Arrays.sort(a);
}`,
      python: `def merge(a: list[int], m: int, b: list[int], n: int) -> None:
    a[m:] = b[:n]
    a.sort()` },
    { name: "Fill from the back", time: "O(m+n)", space: "O(1)", best: true,
      note: "Writing forwards would overwrite unread values in a. Writing from the END fills empty space first, so nothing is ever clobbered.",
      java: `public static void merge(int[] a, int m, int[] b, int n) {
    int i = m - 1, j = n - 1, write = m + n - 1;
    while (j >= 0)                                  // only b can be left over
        a[write--] = (i >= 0 && a[i] > b[j]) ? a[i--] : b[j--];
}`,
      python: `def merge(a: list[int], m: int, b: list[int], n: int) -> None:
    i, j, write = m - 1, n - 1, m + n - 1
    while j >= 0:
        if i >= 0 and a[i] > b[j]:
            a[write] = a[i]
            i -= 1
        else:
            a[write] = b[j]
            j -= 1
        write -= 1` }
  ],
  note: `<p>Looping only while <code>j &gt;= 0</code> is correct: anything still left in <code>a</code> is already in its final position. That observation is what the interviewer is checking.</p>`
}
]});
