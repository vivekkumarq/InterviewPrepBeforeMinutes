registerCode("stacks-queues", {
intro: `<p>Two structures defined entirely by <em>which end you may touch</em>.</p>
<table>
<tr><th></th><th>Stack</th><th>Queue</th></tr>
<tr><td>Order</td><td>LIFO — last in, first out</td><td>FIFO — first in, first out</td></tr>
<tr><td>Add</td><td><code>push</code></td><td><code>offer</code> / <code>enqueue</code></td></tr>
<tr><td>Remove</td><td><code>pop</code></td><td><code>poll</code> / <code>dequeue</code></td></tr>
<tr><td>Natural fit</td><td>Undo, recursion, matching pairs</td><td>Scheduling, BFS, buffering</td></tr>
</table>
<p><strong>In Java use <code>ArrayDeque</code> for both.</strong> Not <code>Stack</code>, which extends <code>Vector</code>, is synchronised, and iterates bottom-up. Not <code>LinkedList</code>, which allocates a node per element and scatters them across memory. In Python, <code>list</code> works as a stack and <code>collections.deque</code> as a queue — never <code>list.pop(0)</code>, which is O(n).</p>
<p><strong>The monotonic stack</strong> is the pattern worth internalising: keep the stack sorted by popping anything that breaks the order before pushing. Each element enters and leaves once, so the whole pass is O(n) despite the inner loop.</p>`,
questions: [
{
  slug: "build-a-stack", n: 72, title: "Build Your Own Stack", difficulty: "easy",
  statement: `<p>Implement a stack with push, pop, peek and isEmpty.</p>`,
  approaches: [
    { name: "Array with a top index", time: "O(1) amortised", space: "O(n)", best: true,
      note: "Contiguous memory, no per-element allocation. Doubling on growth keeps push amortised O(1); growing by a constant would make n pushes O(n²).",
      java: `public class MyStack {
    private int[] data = new int[16];
    private int top = 0;                       // next free slot

    public void push(int v) {
        if (top == data.length) data = Arrays.copyOf(data, data.length * 2);
        data[top++] = v;
    }

    public int pop() {
        if (top == 0) throw new NoSuchElementException("stack is empty");
        return data[--top];
    }

    public int peek() {
        if (top == 0) throw new NoSuchElementException("stack is empty");
        return data[top - 1];
    }

    public boolean isEmpty() { return top == 0; }
    public int size()        { return top; }
}`,
      python: `class MyStack:
    def __init__(self) -> None:
        self._data: list[int] = []

    def push(self, v: int) -> None:
        self._data.append(v)

    def pop(self) -> int:
        if not self._data:
            raise IndexError("stack is empty")
        return self._data.pop()

    def peek(self) -> int:
        if not self._data:
            raise IndexError("stack is empty")
        return self._data[-1]

    def is_empty(self) -> bool:
        return not self._data` },
    { name: "Linked nodes", time: "O(1) worst case", space: "O(n)",
      note: "Every push is genuinely O(1) with no resize pause — useful when latency spikes matter more than throughput. The cost is a node allocation per element and poor cache locality.",
      java: `public class LinkedStack {
    private record Node(int value, Node next) {}
    private Node top;

    public void push(int v) { top = new Node(v, top); }

    public int pop() {
        if (top == null) throw new NoSuchElementException("stack is empty");
        int v = top.value();
        top = top.next();
        return v;
    }

    public boolean isEmpty() { return top == null; }
}`,
      python: `class LinkedStack:
    def __init__(self) -> None:
        self._top: tuple | None = None       # (value, rest)

    def push(self, v: int) -> None:
        self._top = (v, self._top)

    def pop(self) -> int:
        if self._top is None:
            raise IndexError("stack is empty")
        value, self._top = self._top
        return value

    def is_empty(self) -> bool:
        return self._top is None` }
  ],
  note: `<p>Say the amortised argument out loud: doubling copies 1 + 2 + 4 + … + n &lt; 2n elements in total across n pushes, so the average cost per push is constant even though one individual push is O(n).</p>`
},
{
  slug: "queue-from-stacks", n: 73, title: "Queue Using Two Stacks", difficulty: "easy",
  statement: `<p>Implement a FIFO queue using only stack operations.</p>`,
  approaches: [
    { name: "Shift on every operation", time: "O(n) per call", space: "O(n)",
      note: "Moving everything across on each dequeue works, but repeats the whole transfer every time.",
      java: `// Pour in -> out before every poll, then pour back. Correct, O(n) per call.`,
      python: `# Pour in -> out before every poll, then pour back. Correct, O(n) per call.` },
    { name: "Shift only when the out stack is empty", time: "O(1) amortised", space: "O(n)", best: true,
      note: "The whole trick is the emptiness guard. Reversing once per batch means each element moves exactly twice across its whole lifetime.",
      java: `public class MyQueue {
    private final Deque<Integer> in = new ArrayDeque<>();
    private final Deque<Integer> out = new ArrayDeque<>();

    public void push(int v) { in.push(v); }

    public int pop()  { shift(); return out.pop(); }
    public int peek() { shift(); return out.peek(); }
    public boolean isEmpty() { return in.isEmpty() && out.isEmpty(); }

    private void shift() {
        if (!out.isEmpty()) return;               // the entire trick
        while (!in.isEmpty()) out.push(in.pop());
        if (out.isEmpty()) throw new NoSuchElementException("queue is empty");
    }
}`,
      python: `class MyQueue:
    def __init__(self) -> None:
        self._in: list[int] = []
        self._out: list[int] = []

    def push(self, v: int) -> None:
        self._in.append(v)

    def _shift(self) -> None:
        if self._out:
            return
        while self._in:
            self._out.append(self._in.pop())
        if not self._out:
            raise IndexError("queue is empty")

    def pop(self) -> int:
        self._shift()
        return self._out.pop()

    def peek(self) -> int:
        self._shift()
        return self._out[-1]

    def is_empty(self) -> bool:
        return not self._in and not self._out` }
  ],
  note: `<p>If asked for the reverse — a <strong>stack from two queues</strong> — one side has to be O(n): either push rotates the new element to the front, or pop drains all but the last. There is no amortised trick in that direction.</p>`
},
{
  slug: "valid-parentheses", n: 74, title: "Valid Parentheses", difficulty: "easy",
  statement: `<p>Decide whether a string of brackets is balanced and correctly nested. <code>"([]{})"</code> is valid, <code>"([)]"</code> is not.</p>`,
  approaches: [
    { name: "Stack of expected closers", time: "O(n)", space: "O(n)", best: true,
      note: "Push the closer you will need; on a closing bracket, check it matches what you pop. Two end conditions matter equally.",
      java: `public static boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        switch (c) {
            case '(' -> stack.push(')');
            case '[' -> stack.push(']');
            case '{' -> stack.push('}');
            default  -> {
                // empty means a closer with nothing open
                if (stack.isEmpty() || stack.pop() != c) return false;
            }
        }
    }
    return stack.isEmpty();          // leftovers mean unclosed openers
}`,
      python: `def is_valid(s: str) -> bool:
    pairs = {"(": ")", "[": "]", "{": "}"}
    stack: list[str] = []
    for ch in s:
        if ch in pairs:
            stack.append(pairs[ch])
        else:
            if not stack or stack.pop() != ch:
                return False
    return not stack` }
  ],
  note: `<p>Both checks are required and people routinely forget the second: an empty stack on a closer means <em>unbalanced</em>, and a non-empty stack at the end means <em>unclosed</em>. <code>"("</code> alone fails only the second.</p>`
},
{
  slug: "min-stack", n: 75, title: "Min Stack", difficulty: "medium",
  statement: `<p>A stack where push, pop, top and getMin are all O(1).</p>`,
  approaches: [
    { name: "Parallel stack of running minima", time: "O(1)", space: "O(n)", best: true,
      note: "A single min variable cannot work: popping the current minimum must restore the PREVIOUS one, and a variable has not kept it. A second stack has.",
      java: `public class MinStack {
    private final Deque<Integer> data = new ArrayDeque<>();
    private final Deque<Integer> mins = new ArrayDeque<>();

    public void push(int x) {
        data.push(x);
        mins.push(mins.isEmpty() ? x : Math.min(x, mins.peek()));
    }

    public void pop() { data.pop(); mins.pop(); }     // always in step
    public int top()    { return data.peek(); }
    public int getMin() { return mins.peek(); }
}`,
      python: `class MinStack:
    def __init__(self) -> None:
        self._data: list[int] = []
        self._mins: list[int] = []

    def push(self, x: int) -> None:
        self._data.append(x)
        self._mins.append(x if not self._mins else min(x, self._mins[-1]))

    def pop(self) -> None:
        self._data.pop()
        self._mins.pop()

    def top(self) -> int:
        return self._data[-1]

    def get_min(self) -> int:
        return self._mins[-1]` },
    { name: "Store value and min as a pair", time: "O(1)", space: "O(n)",
      note: "Same idea in one structure. Push a pair instead of keeping two stacks in lockstep — fewer places to get out of sync.",
      java: `public class MinStack {
    private record Entry(int value, int min) {}
    private final Deque<Entry> stack = new ArrayDeque<>();

    public void push(int x) {
        int min = stack.isEmpty() ? x : Math.min(x, stack.peek().min());
        stack.push(new Entry(x, min));
    }

    public void pop()   { stack.pop(); }
    public int top()    { return stack.peek().value(); }
    public int getMin() { return stack.peek().min(); }
}`,
      python: `class MinStack:
    def __init__(self) -> None:
        self._stack: list[tuple[int, int]] = []   # (value, min so far)

    def push(self, x: int) -> None:
        current = x if not self._stack else min(x, self._stack[-1][1])
        self._stack.append((x, current))

    def pop(self) -> None:
        self._stack.pop()

    def top(self) -> int:
        return self._stack[-1][0]

    def get_min(self) -> int:
        return self._stack[-1][1]` }
  ],
  note: `<p>The follow-up is to cut the space: push onto the min stack only when the value is less than or equal to the current minimum, and pop it only when the popped value equals it. The <code>&lt;=</code> is essential — with duplicates of the minimum, <code>&lt;</code> loses one too early.</p>`
},
{
  slug: "next-greater-element", n: 76, title: "Next Greater Element", difficulty: "medium",
  statement: `<p>For each element, find the first larger value to its right, or −1.</p>`,
  approaches: [
    { name: "Scan right for each", time: "O(n²)", space: "O(1)",
      note: "Straightforward and quadratic.",
      java: `public static int[] nextGreater(int[] a) {
    int[] res = new int[a.length];
    for (int i = 0; i < a.length; i++) {
        res[i] = -1;
        for (int j = i + 1; j < a.length; j++)
            if (a[j] > a[i]) { res[i] = a[j]; break; }
    }
    return res;
}`,
      python: `def next_greater(a: list[int]) -> list[int]:
    res = [-1] * len(a)
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[j] > a[i]:
                res[i] = a[j]
                break
    return res` },
    { name: "Monotonic stack of indices", time: "O(n)", space: "O(n)", best: true,
      note: "Keep a decreasing stack. When a bigger value arrives, everything it beats is popped and answered at once. Store INDICES — values alone lose the position to write to.",
      java: `public static int[] nextGreater(int[] a) {
    int[] res = new int[a.length];
    Arrays.fill(res, -1);
    Deque<Integer> stack = new ArrayDeque<>();     // indices, decreasing values
    for (int i = 0; i < a.length; i++) {
        while (!stack.isEmpty() && a[stack.peek()] < a[i])
            res[stack.pop()] = a[i];
        stack.push(i);
    }
    return res;                                    // leftovers keep -1
}`,
      python: `def next_greater(a: list[int]) -> list[int]:
    res = [-1] * len(a)
    stack: list[int] = []            # indices, decreasing values
    for i, x in enumerate(a):
        while stack and a[stack[-1]] < x:
            res[stack.pop()] = x
        stack.append(i)
    return res` }
  ],
  note: `<p>Say the amortised argument: a while inside a for looks quadratic, but each index is pushed once and popped at most once, so total work is bounded by 2n. That is the follow-up every time.</p>
<p>For the <strong>circular</strong> variant, loop <code>i</code> to <code>2n</code> and index with <code>i % n</code>, pushing only on the first lap.</p>`
},
{
  slug: "evaluate-postfix", n: 77, title: "Evaluate a Postfix Expression", difficulty: "medium",
  statement: `<p>Evaluate reverse Polish notation: <code>["2","3","+","4","*"]</code> is (2+3)×4 = 20.</p>`,
  approaches: [
    { name: "Stack of operands", time: "O(n)", space: "O(n)", best: true,
      note: "Push numbers; on an operator pop two and push the result. Postfix needs no brackets and no precedence rules — that is the whole point of it.",
      java: `public static int evaluate(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    for (String t : tokens) {
        switch (t) {
            case "+", "-", "*", "/" -> {
                int b = stack.pop(), a = stack.pop();     // ORDER MATTERS
                stack.push(switch (t) {
                    case "+" -> a + b;
                    case "-" -> a - b;
                    case "*" -> a * b;
                    default  -> a / b;
                });
            }
            default -> stack.push(Integer.parseInt(t));
        }
    }
    return stack.pop();
}`,
      python: `def evaluate(tokens: list[str]) -> int:
    stack: list[int] = []
    for t in tokens:
        if t in ("+", "-", "*", "/"):
            b, a = stack.pop(), stack.pop()      # ORDER MATTERS
            if t == "+":
                stack.append(a + b)
            elif t == "-":
                stack.append(a - b)
            elif t == "*":
                stack.append(a * b)
            else:
                stack.append(int(a / b))         # truncate toward zero
        else:
            stack.append(int(t))
    return stack.pop()` }
  ],
  note: `<p>Two traps. The <strong>second</strong> pop is the left operand, so <code>a - b</code> not <code>b - a</code>. And Python's <code>//</code> floors toward negative infinity while most of these problems want truncation toward zero — hence <code>int(a / b)</code>.</p>`
},
{
  slug: "circular-queue", n: 78, title: "Circular Queue (Ring Buffer)", difficulty: "medium",
  statement: `<p>Implement a fixed-capacity queue on an array that reuses freed slots.</p>`,
  approaches: [
    { name: "Head index plus a size counter", time: "O(1)", space: "O(n)", best: true,
      note: "Keeping SIZE rather than a tail index removes the classic ambiguity where head == tail could mean either full or empty.",
      java: `public class CircularQueue {
    private final int[] buf;
    private int head = 0, size = 0;

    public CircularQueue(int capacity) { buf = new int[capacity]; }

    public boolean offer(int v) {
        if (size == buf.length) return false;
        buf[(head + size) % buf.length] = v;
        size++;
        return true;
    }

    public Integer poll() {
        if (size == 0) return null;
        int v = buf[head];
        head = (head + 1) % buf.length;
        size--;
        return v;
    }

    public Integer peek()   { return size == 0 ? null : buf[head]; }
    public boolean isFull() { return size == buf.length; }
}`,
      python: `class CircularQueue:
    def __init__(self, capacity: int) -> None:
        self._buf = [0] * capacity
        self._head = 0
        self._size = 0

    def offer(self, v: int) -> bool:
        if self._size == len(self._buf):
            return False
        self._buf[(self._head + self._size) % len(self._buf)] = v
        self._size += 1
        return True

    def poll(self) -> int | None:
        if self._size == 0:
            return None
        v = self._buf[self._head]
        self._head = (self._head + 1) % len(self._buf)
        self._size -= 1
        return v

    def peek(self) -> int | None:
        return None if self._size == 0 else self._buf[self._head]

    def is_full(self) -> bool:
        return self._size == len(self._buf)` }
  ],
  note: `<p>This is how real buffers work — audio pipelines, network cards, log ring buffers. The alternative fix for the full/empty ambiguity is to waste one slot so the buffer is never completely filled; the size counter is cleaner.</p>`
},
{
  slug: "sliding-window-maximum", n: 79, title: "Sliding Window Maximum", difficulty: "hard",
  statement: `<p>For every window of size k, report the maximum.</p>`,
  approaches: [
    { name: "Recompute each window", time: "O(n·k)", space: "O(1)",
      note: "Re-reads the same values k times.",
      java: `// For each window start, scan k elements for the max. O(n*k).`,
      python: `def max_sliding_window(a: list[int], k: int) -> list[int]:
    return [max(a[i:i + k]) for i in range(len(a) - k + 1)]` },
    { name: "Max-heap with lazy deletion", time: "O(n log k)", space: "O(n)",
      note: "Accepted, and worth offering if the deque does not come to you. Stale entries are discarded when they surface at the top.",
      java: `public static int[] maxSlidingWindow(int[] a, int k) {
    PriorityQueue<int[]> heap =
        new PriorityQueue<>((x, y) -> Integer.compare(y[0], x[0]));  // value, index
    int[] res = new int[a.length - k + 1];
    for (int i = 0; i < a.length; i++) {
        heap.offer(new int[]{a[i], i});
        while (heap.peek()[1] <= i - k) heap.poll();      // drop stale
        if (i >= k - 1) res[i - k + 1] = heap.peek()[0];
    }
    return res;
}`,
      python: `import heapq

def max_sliding_window(a: list[int], k: int) -> list[int]:
    heap: list[tuple[int, int]] = []
    res = []
    for i, x in enumerate(a):
        heapq.heappush(heap, (-x, i))
        while heap[0][1] <= i - k:
            heapq.heappop(heap)
        if i >= k - 1:
            res.append(-heap[0][0])
    return res` },
    { name: "Monotonic deque", time: "O(n)", space: "O(k)", best: true,
      note: "If an earlier element is smaller than a later one, it is dominated forever — it leaves the window sooner AND is smaller. So it can be discarded permanently, which is what makes this linear.",
      java: `public static int[] maxSlidingWindow(int[] a, int k) {
    int[] res = new int[a.length - k + 1];
    Deque<Integer> dq = new ArrayDeque<>();       // indices, values decreasing
    for (int i = 0; i < a.length; i++) {
        if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();  // slid out
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k - 1) res[i - k + 1] = a[dq.peekFirst()];
    }
    return res;
}`,
      python: `from collections import deque

def max_sliding_window(a: list[int], k: int) -> list[int]:
    dq: deque[int] = deque()      # indices, values decreasing
    res = []
    for i, x in enumerate(a):
        if dq and dq[0] <= i - k:
            dq.popleft()
        while dq and a[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            res.append(a[dq[0]])
    return res` }
  ],
  note: `<p>The same two-deque idea answers "longest subarray where max − min ≤ limit": run one decreasing and one increasing deque at once, and shrink from the left while the spread is too wide.</p>`
},
{
  slug: "largest-rectangle-histogram", n: 80, title: "Largest Rectangle in a Histogram", difficulty: "hard",
  statement: `<p>Given bar heights of width 1, find the largest rectangle that fits inside the histogram.</p>`,
  approaches: [
    { name: "Expand from every bar", time: "O(n²)", space: "O(1)",
      note: "For each bar, walk outwards while the neighbours are at least as tall.",
      java: `// For each i, extend left and right while height >= h[i],
// then area = h[i] * width. O(n^2).`,
      python: `# For each i, extend left and right while height >= h[i],
# then area = h[i] * width. O(n^2).` },
    { name: "Monotonic increasing stack", time: "O(n)", space: "O(n)", best: true,
      note: "Keep bars in increasing order. When a shorter bar arrives, every taller bar popped can extend no further right — so its rectangle is finalised at that moment. The sentinel 0 at the end flushes the stack.",
      java: `public static int largestRectangle(int[] h) {
    Deque<Integer> stack = new ArrayDeque<>();    // indices, heights increasing
    int best = 0;
    for (int i = 0; i <= h.length; i++) {
        int cur = (i == h.length) ? 0 : h[i];     // sentinel flushes the stack
        while (!stack.isEmpty() && h[stack.peek()] >= cur) {
            int height = h[stack.pop()];
            int left = stack.isEmpty() ? -1 : stack.peek();
            best = Math.max(best, height * (i - left - 1));
        }
        stack.push(i);
    }
    return best;
}`,
      python: `def largest_rectangle(h: list[int]) -> int:
    stack: list[int] = []          # indices, heights increasing
    best = 0
    for i in range(len(h) + 1):
        cur = 0 if i == len(h) else h[i]     # sentinel
        while stack and h[stack[-1]] >= cur:
            height = h[stack.pop()]
            left = stack[-1] if stack else -1
            best = max(best, height * (i - left - 1))
        stack.append(i)
    return best` }
  ],
  note: `<p>The width is <code>i − left − 1</code>, not <code>i − left</code>: the bar below on the stack is strictly outside the rectangle, so it must not be counted. That off-by-one is where nearly every attempt fails.</p>
<p><strong>Maximal rectangle in a binary matrix</strong> is this routine run once per row, treating each row as a histogram of consecutive 1s above it.</p>`
}
]});
