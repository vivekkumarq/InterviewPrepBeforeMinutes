registerTopic("coding-stack-queue", [
{
  q: "Check for balanced brackets in an expression",
  level: "beginner", hot: true, tags: ["stack", "strings", "interview-favourite"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "TCS", "Infosys", "Zoho"],
  a: `<div class="cx"><b>O(n) time</b><span>each character pushed and popped once</span><b>O(n) space</b><span>worst case all opening brackets</span></div>
<pre><code>public boolean isValid(String s) {
    Deque&lt;Character&gt; stack = new ArrayDeque&lt;&gt;();
    Map&lt;Character, Character&gt; pairs = Map.of(')', '(', ']', '[', '}', '{');

    for (char c : s.toCharArray()) {
        if (pairs.containsValue(c)) {
            stack.push(c);                                   // opening
        } else if (pairs.containsKey(c)) {
            if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
        }
        // anything else is ignored — ask whether that is wanted
    }
    return stack.isEmpty();          // leftover openers = unbalanced
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Stack rising and falling as brackets are matched">
  <text class="dg-s" x="16" y="20">{ [ ( ) ] }</text>
  <rect class="dg-fill" x="16" y="96" width="52" height="26" rx="4"/><text class="dg-t" x="42" y="114" text-anchor="middle">{</text>
  <rect class="dg-fill" x="82" y="96" width="52" height="26" rx="4"/><text class="dg-t" x="108" y="114" text-anchor="middle">{</text>
  <rect class="dg-fill" x="82" y="66" width="52" height="26" rx="4"/><text class="dg-t" x="108" y="84" text-anchor="middle">[</text>
  <rect class="dg-fill" x="148" y="96" width="52" height="26" rx="4"/><text class="dg-t" x="174" y="114" text-anchor="middle">{</text>
  <rect class="dg-fill" x="148" y="66" width="52" height="26" rx="4"/><text class="dg-t" x="174" y="84" text-anchor="middle">[</text>
  <rect class="dg-fill" x="148" y="36" width="52" height="26" rx="4"/><text class="dg-t" x="174" y="54" text-anchor="middle">(</text>
  <rect class="dg-fill" x="214" y="96" width="52" height="26" rx="4"/><text class="dg-t" x="240" y="114" text-anchor="middle">{</text>
  <rect class="dg-fill" x="214" y="66" width="52" height="26" rx="4"/><text class="dg-t" x="240" y="84" text-anchor="middle">[</text>
  <rect class="dg-fill" x="280" y="96" width="52" height="26" rx="4"/><text class="dg-t" x="306" y="114" text-anchor="middle">{</text>
  <text class="dg-s" x="360" y="80">then '}' pops the last '{' —</text>
  <text class="dg-s" x="360" y="100">the stack is empty, so valid</text>
  <text class="dg-s" x="16" y="146">a closer must match the MOST RECENT opener — that is exactly LIFO</text>
</svg>
</figure>
<table>
<tr><th>Test case</th><th>Expected</th><th>Catches</th></tr>
<tr><td><code>"("</code></td><td>false</td><td>Leftover openers — the final <code>isEmpty()</code> check</td></tr>
<tr><td><code>")"</code></td><td>false</td><td>Popping an empty stack</td></tr>
<tr><td><code>"([)]"</code></td><td>false</td><td>Correct counts, wrong nesting — a counter-based solution fails here</td></tr>
<tr><td><code>""</code></td><td>true</td><td>Empty input</td></tr>
<tr><td><code>"a(b)c"</code></td><td>true</td><td>Non-bracket characters</td></tr>
</table>
<p><strong>Why a counter does not work:</strong> with one bracket type, counting up and down is enough. With three types, <code>"([)]"</code> has balanced counts but invalid nesting. That case is the reason the problem needs a stack, and naming it unprompted is the strongest thing you can say here.</p>
<pre><code>// Follow-up: LONGEST valid parentheses substring, O(n)
public int longestValidParentheses(String s) {
    Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();
    stack.push(-1);                      // sentinel: base for the first valid run
    int best = 0;
    for (int i = 0; i &lt; s.length(); i++) {
        if (s.charAt(i) == '(') stack.push(i);
        else {
            stack.pop();
            if (stack.isEmpty()) stack.push(i);           // new base
            else best = Math.max(best, i - stack.peek()); // length from the base
        }
    }
    return best;
}</code></pre>
<p><strong>A Java note worth making:</strong> use <code>ArrayDeque</code>, not <code>Stack</code>. <code>Stack</code> extends <code>Vector</code>, so every operation is synchronised for no benefit, and it iterates bottom-to-top — the opposite of what a stack should do.</p>`
},
{
  q: "Design a stack that returns the minimum in O(1)",
  level: "advanced", hot: true, tags: ["stack", "design", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Goldman Sachs", "Uber"],
  a: `<div class="cx"><b>O(1) all operations</b><span>push, pop, top, getMin</span><b>O(n) space</b><span>or O(1) extra with the maths trick</span></div>
<pre><code>// Approach 1: a second stack that mirrors the minimum at each depth
class MinStack {
    private final Deque&lt;Integer&gt; data = new ArrayDeque&lt;&gt;();
    private final Deque&lt;Integer&gt; mins = new ArrayDeque&lt;&gt;();

    public void push(int x) {
        data.push(x);
        // &lt;= not &lt; : duplicates of the minimum must each be recorded,
        // otherwise popping one of them loses the minimum too early.
        mins.push(mins.isEmpty() || x &lt;= mins.peek() ? x : mins.peek());
    }
    public void pop()      { data.pop(); mins.pop(); }
    public int top()       { return data.peek(); }
    public int getMin()    { return mins.peek(); }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Data stack alongside a parallel minimum stack">
  <text class="dg-s" x="90" y="20" text-anchor="middle">data</text>
  <rect class="dg-fill" x="50" y="28" width="80" height="26" rx="4"/><text class="dg-t" x="90" y="46" text-anchor="middle">0</text>
  <rect class="dg-fill" x="50" y="58" width="80" height="26" rx="4"/><text class="dg-t" x="90" y="76" text-anchor="middle">-3</text>
  <rect class="dg-fill" x="50" y="88" width="80" height="26" rx="4"/><text class="dg-t" x="90" y="106" text-anchor="middle">2</text>
  <rect class="dg-fill" x="50" y="118" width="80" height="26" rx="4"/><text class="dg-t" x="90" y="136" text-anchor="middle">-2</text>
  <text class="dg-s" x="250" y="20" text-anchor="middle">mins</text>
  <rect class="dg-fill2" x="210" y="28" width="80" height="26" rx="4"/><text class="dg-t" x="250" y="46" text-anchor="middle">-3</text>
  <rect class="dg-fill2" x="210" y="58" width="80" height="26" rx="4"/><text class="dg-t" x="250" y="76" text-anchor="middle">-3</text>
  <rect class="dg-fill2" x="210" y="88" width="80" height="26" rx="4"/><text class="dg-t" x="250" y="106" text-anchor="middle">-2</text>
  <rect class="dg-fill2" x="210" y="118" width="80" height="26" rx="4"/><text class="dg-t" x="250" y="136" text-anchor="middle">-2</text>
  <text class="dg-s" x="340" y="56">mins[i] = the minimum of</text>
  <text class="dg-s" x="340" y="76">everything at or below depth i</text>
  <text class="dg-s" x="340" y="102">pop them together and the</text>
  <text class="dg-s" x="340" y="122">minimum is always mins.peek()</text>
</svg>
</figure>
<pre><code>// Approach 2: ONE stack, O(1) extra space. Store an ENCODED value when a new
// minimum arrives, so the previous minimum can be recovered on pop.
class MinStackO1 {
    private final Deque&lt;Long&gt; stack = new ArrayDeque&lt;&gt;();
    private long min;

    public void push(int x) {
        if (stack.isEmpty()) { stack.push(0L); min = x; }
        else {
            stack.push((long) x - min);       // may be negative
            if (x &lt; min) min = x;
        }
    }
    public void pop() {
        long top = stack.pop();
        if (top &lt; 0) min = min - top;          // restore the previous minimum
    }
    public int top() {
        long top = stack.peek();
        return (int) (top &gt; 0 ? top + min : min);
    }
    public int getMin() { return (int) min; }
}
// Uses long because x - min can overflow int. Clever, but harder to read —
// present the two-stack version first and offer this as the optimisation.</code></pre>
<table>
<tr><th>Variant</th><th>Change</th></tr>
<tr><td>Max stack</td><td>Identical, flip the comparison</td></tr>
<tr><td>Store pairs instead of two stacks</td><td>Push <code>int[]{value, minSoFar}</code> — simplest to explain, same O(n)</td></tr>
<tr><td>Queue with min in O(1)</td><td>Monotonic deque — the sliding-window-maximum technique</td></tr>
<tr><td>Stack using two queues</td><td>Make <code>push</code> O(n) by rotating, so <code>pop</code> stays O(1)</td></tr>
<tr><td>Queue using two stacks</td><td>Amortised O(1): move in→out only when out is empty</td></tr>
</table>
<p><strong>The <code>&lt;=</code> detail decides this question.</strong> Push <code>[2, 2]</code> then pop once. With a strict <code>&lt;</code>, the second 2 was never recorded in the min stack, so the pop removes the only entry and <code>getMin</code> reports the wrong value. Interviewers test exactly that sequence.</p>`
},
{
  q: "Next greater element and the monotonic stack pattern",
  level: "advanced", hot: true, tags: ["stack", "monotonic", "arrays", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart"],
  a: `<div class="cx"><b>O(n) time</b><span>each index pushed and popped at most once</span><b>O(n) space</b><span>the stack</span></div>
<pre><code>// NEXT GREATER ELEMENT — for each element, the first larger value to its right
public int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] out = new int[n];
    Arrays.fill(out, -1);
    Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();   // holds INDICES, decreasing values

    for (int i = 0; i &lt; n; i++) {
        // Everything smaller than nums[i] has just found its answer.
        while (!stack.isEmpty() && nums[stack.peek()] &lt; nums[i]) {
            out[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return out;   // indices left on the stack have no greater element -> -1
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Monotonic decreasing stack resolving next greater elements">
  <text class="dg-s" x="16" y="20">[2, 1, 2, 4, 3]</text>
  <rect class="dg-fill" x="16" y="30" width="52" height="30" rx="5"/><text class="dg-t" x="42" y="50" text-anchor="middle">2</text>
  <rect class="dg-fill" x="76" y="30" width="52" height="30" rx="5"/><text class="dg-t" x="102" y="50" text-anchor="middle">1</text>
  <rect class="dg-fill" x="136" y="30" width="52" height="30" rx="5"/><text class="dg-t" x="162" y="50" text-anchor="middle">2</text>
  <rect class="dg-fill2" x="196" y="30" width="52" height="30" rx="5"/><text class="dg-t" x="222" y="50" text-anchor="middle">4</text>
  <rect class="dg-fill" x="256" y="30" width="52" height="30" rx="5"/><text class="dg-t" x="282" y="50" text-anchor="middle">3</text>
  <path class="dg-line" d="M42 68 Q100 100 156 68" marker-end="url(#ng1)"/>
  <path class="dg-line" d="M102 68 Q130 92 156 68" marker-end="url(#ng1)"/>
  <path class="dg-line" d="M162 68 Q190 92 216 68" marker-end="url(#ng1)"/>
  <text class="dg-s" x="330" y="46">4 arrives and immediately resolves</text>
  <text class="dg-s" x="330" y="66">every smaller value still waiting</text>
  <text class="dg-s" x="16" y="122">answers: [4, 2, 4, -1, -1]</text>
  <text class="dg-s" x="16" y="144">the stack stays DECREASING — that invariant is what makes it linear</text>
  <defs><marker id="ng1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Stack keeps</th><th>Pop when</th></tr>
<tr><td>Next greater to the right</td><td>Decreasing values</td><td>Current &gt; top</td></tr>
<tr><td>Next smaller to the right</td><td>Increasing values</td><td>Current &lt; top</td></tr>
<tr><td>Previous greater</td><td>Decreasing</td><td>Iterate left to right, answer is <code>peek()</code> after popping</td></tr>
<tr><td><strong>Daily temperatures</strong></td><td>Decreasing indices</td><td>Answer is the index <em>difference</em></td></tr>
<tr><td><strong>Largest rectangle in a histogram</strong></td><td>Increasing heights</td><td>Width spans between the previous and next smaller</td></tr>
<tr><td>Stock span</td><td>Decreasing</td><td>Count of consecutive smaller days</td></tr>
<tr><td>Trapping rain water</td><td>Decreasing</td><td>Each pop bounds one horizontal water layer</td></tr>
</table>
<pre><code>// LARGEST RECTANGLE IN A HISTOGRAM — the hardest of the family, O(n)
public int largestRectangleArea(int[] h) {
    Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();
    int best = 0;
    for (int i = 0; i &lt;= h.length; i++) {
        int cur = (i == h.length) ? 0 : h[i];      // sentinel drains the stack
        while (!stack.isEmpty() && h[stack.peek()] &gt;= cur) {
            int height = h[stack.pop()];
            int left = stack.isEmpty() ? -1 : stack.peek();
            best = Math.max(best, height * (i - left - 1));
        }
        stack.push(i);
    }
    return best;
}
// Every bar, when popped, knows its full extent: bounded on the right by i
// and on the left by whatever is now on top of the stack.</code></pre>
<p><strong>The complexity argument to give aloud:</strong> "The nested <code>while</code> makes it look quadratic, but each index is pushed once and popped once across the whole run, so the total work is O(n). That amortised argument is the same one behind the sliding-window and two-pointer patterns."</p>`
},
{
  q: "Sliding window maximum with a monotonic deque",
  level: "advanced", hot: true, tags: ["queue", "monotonic", "sliding-window"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Goldman Sachs"],
  a: `<div class="cx"><b>O(n) time</b><span>each index enters and leaves the deque once</span><b>O(k) space</b><span>the deque</span></div>
<pre><code>public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] out = new int[n - k + 1];
    Deque&lt;Integer&gt; dq = new ArrayDeque&lt;&gt;();   // INDICES, values decreasing front→back

    for (int i = 0; i &lt; n; i++) {
        // 1. Drop indices that have slid out of the window
        if (!dq.isEmpty() && dq.peekFirst() &lt;= i - k) dq.pollFirst();

        // 2. Drop everything smaller than the incoming value — they can never
        //    be the maximum again, because nums[i] is larger AND stays longer.
        while (!dq.isEmpty() && nums[dq.peekLast()] &lt;= nums[i]) dq.pollLast();

        dq.offerLast(i);

        // 3. The front is always the maximum of the current window
        if (i &gt;= k - 1) out[i - k + 1] = nums[dq.peekFirst()];
    }
    return out;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Deque holding indices of a decreasing sequence within the window">
  <text class="dg-s" x="16" y="20">nums = [1, 3, -1, -3, 5, 3, 6, 7],  k = 3</text>
  <rect class="dg-box" x="16" y="30" width="46" height="28" rx="4"/><text class="dg-t" x="39" y="49" text-anchor="middle">1</text>
  <rect class="dg-fill" x="66" y="30" width="46" height="28" rx="4"/><text class="dg-t" x="89" y="49" text-anchor="middle">3</text>
  <rect class="dg-fill" x="116" y="30" width="46" height="28" rx="4"/><text class="dg-t" x="139" y="49" text-anchor="middle">-1</text>
  <rect class="dg-fill" x="166" y="30" width="46" height="28" rx="4"/><text class="dg-t" x="189" y="49" text-anchor="middle">-3</text>
  <rect class="dg-box" x="216" y="30" width="46" height="28" rx="4"/><text class="dg-t" x="239" y="49" text-anchor="middle">5</text>
  <path class="dg-line" d="M66 66 H212" stroke-dasharray="4 3"/>
  <text class="dg-s" x="139" y="82" text-anchor="middle">window</text>
  <text class="dg-s" x="300" y="46">deque holds 3, -1, -3</text>
  <text class="dg-s" x="300" y="66">front = 3 = the answer</text>
  <text class="dg-s" x="16" y="112">when 5 arrives it evicts -3, -1 AND 3 from the back — none can ever win again</text>
  <text class="dg-s" x="16" y="136">deque becomes just [5]; the front is popped only when it slides out of range</text>
</svg>
</figure>
<p><strong>The invariant, stated plainly:</strong> the deque holds indices whose values are strictly decreasing from front to back. The front is the current maximum. Anything smaller that arrived <em>earlier</em> is useless — the newcomer is both larger and will remain in the window longer — so it can be discarded permanently.</p>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th></tr>
<tr><td>Re-scan each window</td><td>O(n·k)</td><td>O(1)</td></tr>
<tr><td>Max-heap with lazy deletion</td><td>O(n log n)</td><td>O(n)</td></tr>
<tr><td><code>TreeMap</code> of counts</td><td>O(n log k)</td><td>O(k)</td></tr>
<tr><td><strong>Monotonic deque</strong></td><td><strong>O(n)</strong></td><td>O(k)</td></tr>
</table>
<pre><code>// Related: shortest subarray with sum at least k, WITH NEGATIVE numbers.
// The plain sliding window breaks here — you need prefix sums plus a
// monotonic deque, which is the natural follow-up to this question.
public int shortestSubarray(int[] nums, int k) {
    int n = nums.length;
    long[] pre = new long[n + 1];
    for (int i = 0; i &lt; n; i++) pre[i + 1] = pre[i] + nums[i];

    Deque&lt;Integer&gt; dq = new ArrayDeque&lt;&gt;();
    int best = n + 1;
    for (int i = 0; i &lt;= n; i++) {
        while (!dq.isEmpty() && pre[i] - pre[dq.peekFirst()] &gt;= k)
            best = Math.min(best, i - dq.pollFirst());
        while (!dq.isEmpty() && pre[dq.peekLast()] &gt;= pre[i]) dq.pollLast();
        dq.offerLast(i);
    }
    return best &lt;= n ? best : -1;
}</code></pre>
<p><strong>Two implementation notes:</strong> store <em>indices</em>, not values, or you cannot tell when an element has slid out of the window. And use <code>ArrayDeque</code> rather than <code>LinkedList</code> — it is backed by a circular array, so it has far better cache behaviour and no per-node allocation.</p>`
},
{
  q: "Implement a queue using stacks and a stack using queues",
  level: "beginner", tags: ["stack", "queue", "design"],
  companies: ["Amazon", "Microsoft", "Adobe", "TCS", "Infosys", "Cognizant", "Oracle"],
  a: `<div class="cx"><b>Amortised O(1)</b><span>queue from two stacks</span><b>O(n) push</b><span>stack from one queue</span></div>
<pre><code>// QUEUE FROM TWO STACKS — amortised O(1) per operation
class MyQueue {
    private final Deque&lt;Integer&gt; in = new ArrayDeque&lt;&gt;();
    private final Deque&lt;Integer&gt; out = new ArrayDeque&lt;&gt;();

    public void push(int x) { in.push(x); }                 // always O(1)

    public int pop() { shift(); return out.pop(); }
    public int peek() { shift(); return out.peek(); }
    public boolean empty() { return in.isEmpty() && out.isEmpty(); }

    // Move elements ONLY when 'out' has run dry. Transferring on every pop
    // would make it O(n); transferring only when empty makes it amortised O(1).
    private void shift() {
        if (out.isEmpty()) while (!in.isEmpty()) out.push(in.pop());
    }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Two stacks forming a queue by reversing order on transfer">
  <text class="dg-s" x="80" y="20" text-anchor="middle">in (newest on top)</text>
  <rect class="dg-fill" x="46" y="30" width="70" height="24" rx="4"/><text class="dg-t" x="81" y="47" text-anchor="middle">3</text>
  <rect class="dg-fill" x="46" y="58" width="70" height="24" rx="4"/><text class="dg-t" x="81" y="75" text-anchor="middle">2</text>
  <rect class="dg-fill" x="46" y="86" width="70" height="24" rx="4"/><text class="dg-t" x="81" y="103" text-anchor="middle">1</text>
  <path class="dg-line" d="M126 70 H236" marker-end="url(#qs1)"/>
  <text class="dg-s" x="181" y="58" text-anchor="middle">drain once</text>
  <text class="dg-s" x="181" y="94" text-anchor="middle">order flips</text>
  <text class="dg-s" x="310" y="20" text-anchor="middle">out (oldest on top)</text>
  <rect class="dg-fill2" x="276" y="30" width="70" height="24" rx="4"/><text class="dg-t" x="311" y="47" text-anchor="middle">1</text>
  <rect class="dg-fill2" x="276" y="58" width="70" height="24" rx="4"/><text class="dg-t" x="311" y="75" text-anchor="middle">2</text>
  <rect class="dg-fill2" x="276" y="86" width="70" height="24" rx="4"/><text class="dg-t" x="311" y="103" text-anchor="middle">3</text>
  <text class="dg-s" x="390" y="60">reversing twice restores</text>
  <text class="dg-s" x="390" y="80">FIFO order from LIFO parts</text>
  <text class="dg-s" x="16" y="138">each element is moved at most once, so n operations cost O(n) total</text>
  <defs><marker id="qs1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// STACK FROM ONE QUEUE — rotate on push so the newest ends up at the front
class MyStack {
    private final Queue&lt;Integer&gt; q = new LinkedList&lt;&gt;();

    public void push(int x) {
        q.offer(x);
        for (int i = 0; i &lt; q.size() - 1; i++) q.offer(q.poll());   // rotate
    }
    public int pop()  { return q.poll(); }     // O(1)
    public int top()  { return q.peek(); }     // O(1)
    public boolean empty() { return q.isEmpty(); }
}
// Push is O(n), pop is O(1). Two queues can invert that trade-off —
// ask which operation should be fast before choosing.</code></pre>
<p><strong>The amortised argument, spelled out:</strong> a single <code>pop</code> can cost O(n) when it triggers a transfer. But each element is moved from <code>in</code> to <code>out</code> <em>exactly once in its lifetime</em>, so n pushes and n pops do O(n) total work — O(1) per operation on average. Being able to distinguish "worst case O(n)" from "amortised O(1)" is the actual content of this question.</p>
<table>
<tr><th>Design</th><th>push</th><th>pop</th><th>Use when</th></tr>
<tr><td>Queue from 2 stacks (lazy transfer)</td><td>O(1)</td><td>Amortised O(1)</td><td>Always — this is the good one</td></tr>
<tr><td>Queue from 2 stacks (eager transfer)</td><td>O(n)</td><td>O(1)</td><td>Reads far outnumber writes</td></tr>
<tr><td>Stack from 1 queue</td><td>O(n)</td><td>O(1)</td><td>Simplest to write</td></tr>
<tr><td>Circular buffer</td><td>O(1)</td><td>O(1)</td><td>What you would actually ship — fixed capacity, no allocation</td></tr>
</table>
<p><strong>Say this at the end:</strong> "This is a structural puzzle rather than production code — in real work I would use <code>ArrayDeque</code>, which is both a stack and a queue with genuine O(1) on both ends. The exercise is about understanding that two order-reversing structures compose into an order-preserving one."</p>`
},
{
  q: "Evaluate a postfix expression and convert infix to postfix",
  level: "beginner", tags: ["stack", "strings", "algorithms"],
  companies: ["Amazon", "Adobe", "Microsoft", "Oracle", "TCS", "Infosys", "Zoho"],
  a: `<pre><code>// EVALUATE POSTFIX (Reverse Polish): "2 3 + 4 *" = 20
public int evalRPN(String[] tokens) {
    Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();
    for (String t : tokens) {
        switch (t) {
            case "+", "-", "*", "/" -&gt; {
                int b = stack.pop(), a = stack.pop();      // ORDER MATTERS
                stack.push(switch (t) {
                    case "+" -&gt; a + b;
                    case "-" -&gt; a - b;                     // a-b, not b-a
                    case "*" -&gt; a * b;
                    default  -&gt; a / b;                     // a/b, and b may be 0
                });
            }
            default -&gt; stack.push(Integer.parseInt(t));
        }
    }
    return stack.pop();
}</code></pre>
<p><strong>The bug this problem exists to catch:</strong> the second value popped is the <em>left</em> operand. Getting <code>a</code> and <code>b</code> the wrong way round still gives correct answers for <code>+</code> and <code>*</code>, so it passes half the tests and fails on subtraction and division — a genuinely nasty class of bug.</p>
<pre><code>// INFIX -> POSTFIX — the shunting-yard algorithm
public String toPostfix(String infix) {
    Map&lt;Character, Integer&gt; prec = Map.of('+', 1, '-', 1, '*', 2, '/', 2, '^', 3);
    StringBuilder out = new StringBuilder();
    Deque&lt;Character&gt; ops = new ArrayDeque&lt;&gt;();

    for (char c : infix.replace(" ", "").toCharArray()) {
        if (Character.isLetterOrDigit(c)) out.append(c);
        else if (c == '(') ops.push(c);
        else if (c == ')') {
            while (!ops.isEmpty() && ops.peek() != '(') out.append(ops.pop());
            ops.pop();                                     // discard the '('
        } else {
            // '^' is RIGHT-associative, so it does not pop an equal precedence
            while (!ops.isEmpty() && ops.peek() != '('
                   && (prec.get(ops.peek()) &gt; prec.get(c)
                       || (prec.get(ops.peek()).equals(prec.get(c)) && c != '^'))) {
                out.append(ops.pop());
            }
            ops.push(c);
        }
    }
    while (!ops.isEmpty()) out.append(ops.pop());
    return out.toString();
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Infix to postfix conversion using an operator stack">
  <text class="dg-s" x="16" y="24">infix:    a + b * c</text>
  <path class="dg-line" d="M120 34 V52" marker-end="url(#pf1)"/>
  <text class="dg-s" x="16" y="66">output builds: a … ab … abc</text>
  <text class="dg-s" x="330" y="66">operator stack: + then *</text>
  <text class="dg-s" x="16" y="104">postfix:  a b c * +      — '*' binds tighter, so it is emitted first</text>
  <defs><marker id="pf1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Notation</th><th><code>a + b * c</code></th><th>Needs</th></tr>
<tr><td>Infix</td><td><code>a + b * c</code></td><td>Precedence rules and brackets</td></tr>
<tr><td>Postfix (RPN)</td><td><code>a b c * +</code></td><td>Nothing — one stack, one pass</td></tr>
<tr><td>Prefix (Polish)</td><td><code>+ a * b c</code></td><td>Scan right to left, same stack</td></tr>
</table>
<p><strong>Why this is not a museum piece:</strong> shunting-yard is how expression parsers, spreadsheet formula engines and query planners turn human-written expressions into an evaluation tree. Postfix needs no brackets and no precedence table, which is exactly why the JVM's own bytecode is stack-based — <code>iadd</code> pops two operands and pushes the result, the same model as this problem.</p>
<p><strong>Edge cases to raise:</strong> multi-digit and negative numbers (single-character parsing breaks), division by zero, unary minus, and mismatched brackets. Naming them before writing code is worth more than the code itself.</p>`
},
{
  q: "Implement a circular queue and a min-heap from scratch",
  level: "advanced", tags: ["queue", "heap", "design", "data-structures"],
  companies: ["Amazon", "Microsoft", "Adobe", "Oracle", "Goldman Sachs", "SAP", "Flipkart"],
  a: `<pre><code>// CIRCULAR QUEUE — fixed capacity, O(1) everything, no shifting
class MyCircularQueue {
    private final int[] a;
    private int head = 0, size = 0;

    MyCircularQueue(int k) { a = new int[k]; }

    boolean enQueue(int v) {
        if (isFull()) return false;
        a[(head + size) % a.length] = v;      // modulo wraps to the front
        size++;
        return true;
    }
    boolean deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % a.length;
        size--;
        return true;
    }
    int Front() { return isEmpty() ? -1 : a[head]; }
    int Rear()  { return isEmpty() ? -1 : a[(head + size - 1) % a.length]; }
    boolean isEmpty() { return size == 0; }
    boolean isFull()  { return size == a.length; }
}
// Tracking 'size' rather than a tail index removes the classic ambiguity where
// head == tail could mean either empty or full.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Circular buffer wrapping head and tail indices">
  <circle class="dg-fill" cx="120" cy="72" r="52"/>
  <circle class="dg-box" cx="120" cy="72" r="28"/>
  <text class="dg-s" x="120" y="18" text-anchor="middle">0</text>
  <text class="dg-s" x="180" y="76" text-anchor="middle">1</text>
  <text class="dg-s" x="120" y="140" text-anchor="middle">2</text>
  <text class="dg-s" x="58" y="76" text-anchor="middle">3</text>
  <path class="dg-line" d="M120 40 A32 32 0 0 1 152 72" marker-end="url(#cq1)"/>
  <text class="dg-s" x="240" y="48">enQueue writes at (head + size) % n</text>
  <text class="dg-s" x="240" y="72">deQueue advances head by 1, modulo n</text>
  <text class="dg-s" x="240" y="96">no element is ever shifted — both ends are O(1)</text>
  <text class="dg-s" x="240" y="120">this is exactly how ArrayDeque works internally</text>
  <defs><marker id="cq1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// MIN-HEAP — a complete binary tree stored in an array.
// For index i: parent = (i-1)/2, children = 2i+1 and 2i+2.
class MinHeap {
    private final List&lt;Integer&gt; h = new ArrayList&lt;&gt;();

    void insert(int v) {
        h.add(v);
        siftUp(h.size() - 1);
    }
    int extractMin() {
        if (h.isEmpty()) throw new NoSuchElementException();
        int min = h.get(0);
        int last = h.remove(h.size() - 1);
        if (!h.isEmpty()) { h.set(0, last); siftDown(0); }
        return min;
    }
    private void siftUp(int i) {
        while (i &gt; 0) {
            int p = (i - 1) / 2;
            if (h.get(p) &lt;= h.get(i)) break;
            swap(i, p); i = p;
        }
    }
    private void siftDown(int i) {
        int n = h.size();
        while (true) {
            int l = 2 * i + 1, r = l + 1, small = i;
            if (l &lt; n && h.get(l) &lt; h.get(small)) small = l;
            if (r &lt; n && h.get(r) &lt; h.get(small)) small = r;
            if (small == i) return;
            swap(i, small); i = small;
        }
    }
    private void swap(int i, int j) { int t = h.get(i); h.set(i, h.get(j)); h.set(j, t); }
}</code></pre>
<table>
<tr><th>Operation</th><th>Heap</th><th>Sorted array</th><th>BST (balanced)</th></tr>
<tr><td>Find min</td><td>O(1)</td><td>O(1)</td><td>O(log n)</td></tr>
<tr><td>Insert</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Extract min</td><td>O(log n)</td><td>O(n)</td><td>O(log n)</td></tr>
<tr><td>Build from n items</td><td><strong>O(n)</strong></td><td>O(n log n)</td><td>O(n log n)</td></tr>
<tr><td>Search arbitrary</td><td>O(n)</td><td>O(log n)</td><td>O(log n)</td></tr>
</table>
<p><strong>The counter-intuitive fact worth knowing:</strong> building a heap from n elements is <strong>O(n)</strong>, not O(n log n). Sifting down from the middle of the array outwards means most nodes are near the leaves and sift almost nowhere — the sum <code>Σ n/2^h × h</code> converges to 2n. That is why <code>new PriorityQueue&lt;&gt;(collection)</code> is faster than n separate inserts, and it is a favourite follow-up.</p>`
}
]);
