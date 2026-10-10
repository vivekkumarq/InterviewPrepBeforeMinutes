registerPrimer("coding-stack-queue", `<p class="pr-lead">A <b>stack</b> and a <b>queue</b> are two simple ways of holding items in order. A stack gives back the <b>most recently added</b> item first. A queue gives back the <b>oldest</b> item first. Choosing the right one turns many tricky problems (matching brackets, undo, processing in order) into a few lines of code.</p>
<div class="pr-analogy"><b>Think of it like this</b>A <b>stack</b> is a pile of plates: you add to the top and take from the top, so the last plate you put down is the first you pick up (Last In, First Out). A <b>queue</b> is a line at a ticket counter: people join at the back and are served from the front, so whoever came first is served first (First In, First Out).</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>LIFO / FIFO</dt><dd>Last In, First Out (stack) and First In, First Out (queue).</dd>
<dt>push / pop / peek</dt><dd>Stack operations: add to the top, remove from the top, look at the top without removing it.</dd>
<dt>offer / poll</dt><dd>Queue operations: add to the back, remove from the front.</dd>
<dt>Deque</dt><dd>A double-ended queue: add or remove at either end. Java's <code>ArrayDeque</code> works as both a stack and a queue.</dd>
<dt>Priority queue (heap)</dt><dd>A queue that always gives back the smallest (or largest) item first, whatever order items were added.</dd>
<dt>Monotonic stack</dt><dd>A stack kept in sorted order by popping items that would break it. Used for "next greater element" problems.</dd>
</dl>

<h3>Step by step: which one to use</h3>
<ol class="pr-steps">
<li>Must the <b>most recent unfinished thing</b> be handled first? Matching brackets, undo, nested structures, expression evaluation: use a <b>stack</b>.</li>
<li>Must things be handled <b>in the order they arrived</b>? Tasks, level-by-level tree traversal, breadth-first search: use a <b>queue</b>.</li>
<li>Must you always take the <b>smallest or largest</b> next? Top-k items, scheduling by priority, shortest paths: use a <b>priority queue</b>.</li>
<li>Do you need "the next bigger or smaller item" for every element? Use a <b>monotonic stack</b>.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 214" role="img" aria-label="Checking brackets with a stack: opening brackets are pushed, closing brackets pop and must match; a queue shown for contrast">
  <text class="dg-t" x="10" y="20">Stack: checking "{ [ ( ) ] }"</text>
  <text class="dg-m" x="10" y="46">read {  push</text>
  <text class="dg-m" x="10" y="66">read [  push</text>
  <text class="dg-m" x="10" y="86">read (  push</text>
  <text class="dg-m" x="10" y="106">read )  pop "(" matches</text>
  <text class="dg-m" x="10" y="126">read ]  pop "[" matches</text>
  <text class="dg-m" x="10" y="146">read }  pop "{" matches</text>
  <text class="dg-s" x="10" y="170">stack empty at the end: balanced</text>
  <rect class="dg-box" x="230" y="36" width="70" height="120" rx="4"/>
  <rect class="dg-fill" x="238" y="116" width="54" height="32" rx="4"/><text class="dg-m" x="265" y="137" text-anchor="middle">{</text>
  <rect class="dg-fill" x="238" y="80" width="54" height="32" rx="4"/><text class="dg-m" x="265" y="101" text-anchor="middle">[</text>
  <rect class="dg-fill2" x="238" y="44" width="54" height="32" rx="4"/><text class="dg-m" x="265" y="65" text-anchor="middle">(</text>
  <text class="dg-s" x="265" y="172" text-anchor="middle">after 3 pushes</text>
  <text class="dg-s" x="308" y="62">top: the one to</text>
  <text class="dg-s" x="308" y="76">close next</text>
  <text class="dg-t" x="400" y="20">Queue: first come, first served</text>
  <rect class="dg-fill2" x="400" y="60" width="48" height="36" rx="4"/><text class="dg-m" x="424" y="83" text-anchor="middle">A</text>
  <rect class="dg-fill" x="452" y="60" width="48" height="36" rx="4"/><text class="dg-m" x="476" y="83" text-anchor="middle">B</text>
  <rect class="dg-fill" x="504" y="60" width="48" height="36" rx="4"/><text class="dg-m" x="528" y="83" text-anchor="middle">C</text>
  <text class="dg-s" x="400" y="116">leaves first</text>
  <text class="dg-s" x="504" y="116">joined last</text>
  <text class="dg-s" x="400" y="150">BFS explores a graph level by level</text>
  <text class="dg-s" x="400" y="166">because a queue keeps that order</text>
</svg>
<figcaption>Anything nested (brackets, expressions, tags, "undo") is a stack problem. Anything level-by-level or in arrival order is a queue problem.</figcaption>
</figure>

<h3>A worked example: balanced brackets</h3>
<p>Check whether every bracket in a string such as <code>"{[()]}"</code> is closed in the right order.</p>
<pre><code>static boolean isBalanced(String s) {
    Deque&lt;Character&gt; stack = new ArrayDeque&lt;&gt;();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') {
            stack.push(c);                              // remember the open bracket
        } else if (c == ')' || c == ']' || c == '}') {
            if (stack.isEmpty()) return false;          // closing with nothing open
            char open = stack.pop();                    // the most recent open bracket
            if ((c == ')' &amp;&amp; open != '(') ||
                (c == ']' &amp;&amp; open != '[') ||
                (c == '}' &amp;&amp; open != '{')) return false; // wrong type
        }
    }
    return stack.isEmpty();                             // anything left was never closed
}</code></pre>
<ol class="pr-steps">
<li>Each opening bracket is pushed onto the stack, waiting for its partner.</li>
<li>A closing bracket must match the <b>most recent</b> opening bracket, which is exactly what a stack gives back.</li>
<li><code>"([)]"</code> fails: the <code>)</code> pops <code>[</code>, which is the wrong type.</li>
<li><code>"(("</code> fails: the stack still holds open brackets at the end.</li>
<li><code>"())"</code> fails: the last <code>)</code> finds the stack empty.</li>
<li>Each character is pushed and popped at most once, so it runs in O(n).</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Using Java's old <code>Stack</code> class</p>
<p><code>java.util.Stack</code> is an old, synchronised class that is slower and has confusing behaviour.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use <code>ArrayDeque</code> with <code>push</code>, <code>pop</code> and <code>peek</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Popping an empty stack</p>
<p>Calling <code>pop()</code> on an empty stack throws an exception, for example when the input starts with a closing bracket.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> check <code>isEmpty()</code> before popping.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting the final check</p>
<p>Returning true as soon as the loop ends misses brackets that were opened but never closed.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> end with <code>return stack.isEmpty()</code>.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Stack: last in, first out. Queue: first in, first out.</li>
<li>Nested things (brackets, undo, expressions) are stack problems.</li>
<li>Arrival order and level-by-level work are queue problems.</li>
<li>Use a priority queue for "smallest or largest next".</li>
<li>In Java, use <code>ArrayDeque</code> for both stacks and queues.</li>
</ul>
<p><b>Next:</b> the questions below cover classic stack and queue problems, monotonic stacks, sliding window maximum and designing your own.</p>`);

appendTopic("coding-stack-queue", [
{
  q: "Decode a string like 3[a2[c]] using a stack",
  level: "advanced", hot: true, tags: ["stack", "strings", "nesting", "must-know"],
  companies: ["Google", "Amazon", "Microsoft", "Bloomberg", "Adobe", "Flipkart", "Uber"],
  a: `<div class="cx"><b>O(output) time</b><span>each output character is built once</span><b>O(n) space</b><span>the stacks</span></div>
<p><code>k[text]</code> means "repeat text k times", and brackets can nest. <code>3[a]2[bc]</code> → <code>aaabcbc</code>, and <code>3[a2[c]]</code> → <code>accaccacc</code>. Nesting is the signal: <strong>use a stack</strong> to remember the unfinished outer part while you work on the inner part.</p>
<p><strong>The idea:</strong> keep a "current string" being built. On <code>[</code>, push the current string and the repeat count, and start a fresh current string. On <code>]</code>, pop them back, repeat the current string k times, and append it to what was popped.</p>
<pre><code>static String decode(String s) {
    Deque&lt;Integer&gt; counts = new ArrayDeque&lt;&gt;();
    Deque&lt;StringBuilder&gt; outers = new ArrayDeque&lt;&gt;();
    StringBuilder current = new StringBuilder();
    int k = 0;

    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            k = k * 10 + (c - '0');              // counts can have several digits: 12[a]
        } else if (c == '[') {
            counts.push(k);                      // remember how many times
            outers.push(current);                // remember what came before
            current = new StringBuilder();       // start the inner part
            k = 0;
        } else if (c == ']') {
            int times = counts.pop();
            StringBuilder outer = outers.pop();
            outer.append(current.toString().repeat(times));   // Java 11+
            current = outer;                     // continue the outer part
        } else {
            current.append(c);                   // a plain letter
        }
    }
    return current.toString();
}</code></pre>
<pre><code>Trace: 3[a2[c]]

 char  action                          counts   outers        current
  3    k = 3                           []       []            ""
  [    push 3 and ""                   [3]      [""]          ""
  a    append                          [3]      [""]          "a"
  2    k = 2                           [3]      [""]          "a"
  [    push 2 and "a"                  [3,2]    ["","a"]      ""
  c    append                          [3,2]    ["","a"]      "c"
  ]    pop 2,"a": "a" + "cc"           [3]      [""]          "acc"
  ]    pop 3,"": "" + "acc" x 3        []       []            "accaccacc"</code></pre>
<table>
<tr><th>Detail</th><th>Why</th></tr>
<tr><td><code>k = k * 10 + digit</code></td><td>Handles multi-digit counts like <code>12[ab]</code>; reading one digit at a time would give 1 and 2</td></tr>
<tr><td>Reset <code>k = 0</code> after pushing</td><td>Otherwise the next count starts from the old value</td></tr>
<tr><td>Two stacks moving together</td><td>Each <code>[</code> needs both its count and its outer string back at the matching <code>]</code></td></tr>
<tr><td><code>StringBuilder</code>, not <code>+</code></td><td>Repeated string concatenation is quadratic</td></tr>
</table>
<p><strong>The recursive version</strong> is equally good and some find it clearer: a function that decodes until it hits <code>]</code> and returns the result plus the position it stopped at. The call stack plays the role of the explicit stacks. Mention that the explicit stack cannot overflow on very deep nesting, while recursion can.</p>
<p><strong>Same pattern:</strong> evaluating nested arithmetic expressions, flattening nested lists, parsing JSON, and "remove the minimum brackets to make it valid".</p>`
},
{
  q: "Find the largest rectangle in a histogram with a monotonic stack",
  level: "advanced", hot: true, tags: ["monotonic-stack", "arrays", "hard"],
  companies: ["Google", "Amazon", "Microsoft", "Uber", "Goldman Sachs", "Adobe", "Walmart"],
  a: `<div class="cx"><b>O(n) time</b><span>each bar pushed and popped once</span><b>O(n) space</b><span>the stack</span></div>
<p>Bars of width 1 with heights <code>[2, 1, 5, 6, 2, 3]</code>. What is the largest rectangle that fits inside? Answer: <strong>10</strong>, using the bars of height 5 and 6 at height 5.</p>
<p><strong>Reframe it:</strong> the best rectangle uses some bar as its <em>shortest</em> bar. For each bar, stretch left and right until you hit a shorter bar; the rectangle is <code>height × width</code>. Doing that for every bar naively is O(n²). The trick is to find each bar's "first shorter bar on the left and on the right" for all bars in one pass with a stack kept in <strong>increasing</strong> order of height.</p>
<pre><code>static int largestRectangle(int[] h) {
    Deque&lt;Integer&gt; stack = new ArrayDeque&lt;&gt;();       // indices, heights increasing
    int best = 0;
    for (int i = 0; i &lt;= h.length; i++) {
        int cur = (i == h.length) ? 0 : h[i];         // a height-0 bar at the end
        while (!stack.isEmpty() &amp;&amp; h[stack.peek()] &gt; cur) {    // flushes the stack
            int height = h[stack.pop()];              // this bar's rectangle ENDS here:
            int left = stack.isEmpty() ? -1 : stack.peek();     // i is its right limit,
            int width = i - left - 1;                 // the new top is its left limit
            best = Math.max(best, height * width);
        }
        stack.push(i);
    }
    return best;
}</code></pre>
<pre><code>Trace: heights [2, 1, 5, 6, 2, 3]

 i  h[i]  pops (height x width)                    stack after (indices)
 0   2    -                                        [0]
 1   1    pop 2: left=-1, width=1-(-1)-1=1  -&gt;  2   [1]
 2   5    -                                        [1,2]
 3   6    -                                        [1,2,3]
 4   2    pop 6: left=2, width=4-2-1=1      -&gt;  6
          pop 5: left=1, width=4-1-1=2      -&gt; 10   [1,4]
 5   3    -                                        [1,4,5]
 6   0    pop 3: left=4, width=6-4-1=1      -&gt;  3
          pop 2: left=1, width=6-1-1=4      -&gt;  8
          pop 1: left=-1, width=6-(-1)-1=6  -&gt;  6   []
 best = 10</code></pre>
<table>
<tr><th>Piece</th><th>Meaning</th></tr>
<tr><td>Why pop when a shorter bar arrives</td><td>The popped bar cannot extend past this shorter bar, so its rectangle is now final</td></tr>
<tr><td>Why the new top is the left limit</td><td>Everything between it and the popped bar was taller and has already been popped</td></tr>
<tr><td>Sentinel height 0 at the end</td><td>Forces every remaining bar to be popped and measured, with no separate clean-up loop</td></tr>
<tr><td>Why O(n)</td><td>Each index is pushed once and popped once, however many times the inner loop runs in total</td></tr>
</table>
<p><strong>Where it leads:</strong> "maximal rectangle of 1s in a binary matrix" is this function called once per row, where each row's heights are the count of consecutive 1s above. That is the usual follow-up, and recognising it is the point of the question.</p>`
}
]);
