appendTopic("coding-stack-queue", [
{
  q: "What is a monotonic stack, and which problems collapse to it?",
  level: "advanced", hot: true, tags: ["stack", "monotonic", "pattern", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Goldman Sachs"],
  a: `<p>A stack you keep sorted — increasing or decreasing — by popping anything that would break the order <em>before</em> pushing. Every element is pushed once and popped once, so the whole pass is <strong>O(n)</strong> despite the inner while loop.</p>
<pre><code>// NEXT GREATER ELEMENT — the template. Learn this shape, not the problem.
public int[] nextGreater(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque&lt;Integer&gt; st = new ArrayDeque&lt;&gt;();      // holds INDICES, not values
    for (int i = 0; i &lt; n; i++) {
        while (!st.isEmpty() &amp;&amp; a[st.peek()] &lt; a[i])
            res[st.pop()] = a[i];                  // a[i] is the answer for that index
        st.push(i);
    }
    return res;                                    // whatever is left has no greater element
}
// Store INDICES. Values alone lose the position you need to write the answer to.</code></pre>
<table>
<tr><th>You want</th><th>Stack order</th><th>Pop while</th></tr>
<tr><td>Next greater to the right</td><td>Decreasing</td><td><code>a[top] &lt; a[i]</code></td></tr>
<tr><td>Next smaller to the right</td><td>Increasing</td><td><code>a[top] &gt; a[i]</code></td></tr>
<tr><td>Previous greater</td><td>Decreasing</td><td>Same loop, answer read from <code>peek()</code> before pushing</td></tr>
<tr><td>Circular array version</td><td>Either</td><td>Loop <code>i</code> to <code>2n</code>, index with <code>i % n</code></td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="A decreasing stack popping when a larger value arrives">
  <text class="dg-s" x="16" y="20">input  2  1  2  4  3</text>
  <rect class="dg-fill" x="16" y="34" width="46" height="26" rx="4"/><text class="dg-t" x="39" y="52" text-anchor="middle">2</text>
  <rect class="dg-fill" x="16" y="62" width="46" height="26" rx="4"/><text class="dg-t" x="39" y="80" text-anchor="middle">1</text>
  <text class="dg-s" x="76" y="60">stack holds a decreasing run</text>
  <path class="dg-line" d="M250 62 L300 62" marker-end="url(#ms1)"/>
  <text class="dg-s" x="316" y="44">4 arrives → pop 1, pop 2</text>
  <text class="dg-s" x="316" y="66">each pop writes its answer: 4</text>
  <text class="dg-s" x="16" y="126">each index enters and leaves exactly once → O(n) total, not O(n²)</text>
  <defs><marker id="ms1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>What the stack is monotone on</th></tr>
<tr><td>Daily temperatures</td><td>Decreasing — the distance to the next warmer day</td></tr>
<tr><td>Largest rectangle in a histogram</td><td>Increasing — pop gives the bar whose span just ended</td></tr>
<tr><td>Maximal rectangle in a binary matrix</td><td>Histogram per row, then the same routine</td></tr>
<tr><td>Trapping rain water</td><td>Decreasing — each pop is a basin between two walls</td></tr>
<tr><td>Sum of subarray minimums</td><td>Increasing — count how many subarrays each element dominates</td></tr>
<tr><td>Remove K digits / smallest subsequence</td><td>Increasing — pop bigger digits while budget remains</td></tr>
</table>
<p><strong>The complexity argument to say out loud:</strong> "There is a while loop inside a for loop, so it looks quadratic. But every index is pushed once and popped at most once, so total work across the whole run is bounded by 2n. That is amortised O(n)." Interviewers ask exactly this as the follow-up.</p>`
},
{
  q: "Sliding window maximum — why a deque and not a heap?",
  level: "advanced", hot: true, tags: ["deque", "sliding-window", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Flipkart", "Adobe", "Oracle"],
  a: `<div class="cx"><b>Heap: O(n log k)</b><span>works, and is accepted</span><b>Deque: O(n)</b><span>the answer they want</span></div>
<pre><code>// MONOTONIC DEQUE — indices, front is always the window's maximum
public int[] maxSlidingWindow(int[] a, int k) {
    int[] res = new int[a.length - k + 1];
    Deque&lt;Integer&gt; dq = new ArrayDeque&lt;&gt;();       // indices, values decreasing
    for (int i = 0; i &lt; a.length; i++) {
        // 1. drop indices that have slid out of the window
        if (!dq.isEmpty() &amp;&amp; dq.peekFirst() &lt;= i - k) dq.pollFirst();
        // 2. drop everything smaller than a[i] — they can never be the max again
        while (!dq.isEmpty() &amp;&amp; a[dq.peekLast()] &lt;= a[i]) dq.pollLast();
        dq.offerLast(i);
        // 3. once the window is full, the front is the answer
        if (i &gt;= k - 1) res[i - k + 1] = a[dq.peekFirst()];
    }
    return res;
}</code></pre>
<p><strong>The insight, in one sentence:</strong> if <code>a[j] &lt;= a[i]</code> and <code>j &lt; i</code>, then <code>a[j]</code> is useless forever — it leaves the window earlier <em>and</em> it is smaller. So it can be discarded, permanently. That is what makes the deque O(n) rather than O(n log k): elements are never revisited, only dropped.</p>
<table>
<tr><th>Approach</th><th>Time</th><th>Why it loses</th></tr>
<tr><td>Recompute max per window</td><td>O(n·k)</td><td>Re-reads the same values</td></tr>
<tr><td>Max-heap with lazy deletion</td><td>O(n log k)</td><td>Fine, but the heap can grow to n before stale entries are purged</td></tr>
<tr><td><code>TreeMap</code> of counts</td><td>O(n log k)</td><td>Clean and worth mentioning; slower constants</td></tr>
<tr><td><strong>Monotonic deque</strong></td><td><strong>O(n)</strong></td><td>—</td></tr>
</table>
<pre><code>// The same deque idea, different problems:
// - Sliding window MINIMUM: flip the comparison to a[last] >= a[i]
// - "Longest subarray where max - min <= limit": run TWO deques at once,
//   one max, one min, shrink from the left while the spread is too wide
// - Shortest subarray with sum at least K (with negatives):
//   monotonic deque over PREFIX SUMS — the version that defeats sliding window
//
// ArrayDeque, not LinkedList: same O(1) ends, contiguous memory, no node
// allocation per element. And not java.util.Stack, which is synchronised
// and extends Vector.</code></pre>
<p><strong>If you only get the heap version out:</strong> say "this is O(n log k); there is an O(n) monotonic-deque solution because any element smaller than a later one in the window is permanently dominated." Naming the reason is most of the credit.</p>`
},
{
  q: "How do you implement a stack, a queue and a min-stack from scratch?",
  level: "beginner", tags: ["stack", "queue", "implementation", "must-know"],
  companies: ["Amazon", "Microsoft", "TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Capgemini"],
  a: `<pre><code>// MIN STACK — push, pop, top, getMin all O(1). The classic.
class MinStack {
    private final Deque&lt;Integer&gt; data = new ArrayDeque&lt;&gt;();
    private final Deque&lt;Integer&gt; mins = new ArrayDeque&lt;&gt;();   // running minimum

    public void push(int x) {
        data.push(x);
        mins.push(mins.isEmpty() ? x : Math.min(x, mins.peek()));
    }
    public void pop()      { data.pop(); mins.pop(); }        // always in step
    public int top()       { return data.peek(); }
    public int getMin()    { return mins.peek(); }
}
// Why a second stack and not a single min variable? Because when you pop the
// current minimum you must recover the PREVIOUS one — a variable cannot.
// O(n) extra space; the O(1) variant stores (value, minSoFar) pairs instead.</code></pre>
<pre><code>// QUEUE FROM TWO STACKS — amortised O(1) per operation
class MyQueue {
    private final Deque&lt;Integer&gt; in = new ArrayDeque&lt;&gt;(), out = new ArrayDeque&lt;&gt;();
    public void push(int x) { in.push(x); }
    public int pop()  { shift(); return out.pop(); }
    public int peek() { shift(); return out.peek(); }
    private void shift() {
        if (out.isEmpty()) while (!in.isEmpty()) out.push(in.pop());  // reverse ONCE
    }
}
// The guard "if (out.isEmpty())" is the whole trick. Shifting every time makes
// it O(n) per call; shifting only when out runs dry makes each element move
// exactly twice -> amortised O(1).</code></pre>
<pre><code>// CIRCULAR QUEUE on a fixed array — how ring buffers actually work
class CircularQueue {
    private final int[] buf; private int head = 0, size = 0;
    CircularQueue(int cap) { buf = new int[cap]; }
    boolean offer(int x) {
        if (size == buf.length) return false;
        buf[(head + size) % buf.length] = x; size++; return true;
    }
    Integer poll() {
        if (size == 0) return null;
        int v = buf[head]; head = (head + 1) % buf.length; size--; return v;
    }
}
// Keeping SIZE (rather than a tail index) removes the classic
// "is it full or empty?" ambiguity when head == tail.</code></pre>
<table>
<tr><th>In real Java, use</th><th>Not</th><th>Because</th></tr>
<tr><td><code>ArrayDeque</code></td><td><code>Stack</code></td><td><code>Stack</code> extends <code>Vector</code> — synchronised, legacy, iterates bottom-up</td></tr>
<tr><td><code>ArrayDeque</code></td><td><code>LinkedList</code></td><td>Contiguous, no per-node allocation, better cache behaviour</td></tr>
<tr><td><code>ArrayBlockingQueue</code></td><td>Hand-rolled locking</td><td>Bounded, blocking, correct under contention</td></tr>
<tr><td><code>PriorityQueue</code></td><td>Sorting repeatedly</td><td>O(log n) insert versus O(n log n) re-sort</td></tr>
</table>
<p><strong>Balanced brackets</strong> is the other guaranteed one: push openers, and on a closer check the popped character matches. Two details decide the answer — an empty stack on a closer means <em>unbalanced</em>, and a non-empty stack at the end means <em>unclosed</em>. Candidates routinely forget the second.</p>`
}
]);
