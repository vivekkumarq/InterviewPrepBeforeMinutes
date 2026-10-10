registerPrimer("coding-linked-list", `<p class="pr-lead">A <b>linked list</b> is a chain of small boxes called <b>nodes</b>. Each node holds a value and an arrow (a reference called <code>next</code>) pointing to the following node. Unlike an array, there are no position numbers: to reach the fifth node, you must follow the arrows from the first one. Linked list problems test whether you can rewire those arrows carefully without losing part of the chain.</p>
<div class="pr-analogy"><b>Think of it like this</b>A linked list is like a treasure hunt. Each clue tells you only where the next clue is hidden. You cannot jump to clue number 5; you must follow clues 1, 2, 3 and 4. And if you lose a clue before reading it, every clue after it is lost too. That is why, before changing any arrow, you always save where it was pointing.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Node</dt><dd>One box in the chain, holding a value and a <code>next</code> reference.</dd>
<dt>Head / tail</dt><dd>The first node and the last node. The tail's <code>next</code> is <code>null</code>.</dd>
<dt>Singly / doubly linked</dt><dd>Singly: each node points only forward. Doubly: each node points both forward and back.</dd>
<dt>Dummy node</dt><dd>A fake node placed before the head, so changes at the start of the list need no special case.</dd>
<dt>Fast and slow pointers</dt><dd>Two references moving through the list at different speeds, usually two steps and one step.</dd>
<dt>Cycle</dt><dd>A list where some node points back to an earlier node, so following arrows never ends.</dd>
</dl>

<h3>Step by step: the four tools that solve most list problems</h3>
<ol class="pr-steps">
<li><b>Dummy head node:</b> put a fake node in front of the list. Then inserting or deleting at the head works exactly like anywhere else.</li>
<li><b>Fast and slow pointers:</b> one moves two steps, one moves one. When fast reaches the end, slow is in the middle; if there is a cycle, they eventually meet.</li>
<li><b>A gap of k:</b> move one pointer k steps ahead, then move both together. When the first reaches the end, the second is k nodes from the end.</li>
<li><b>In-place reversal:</b> walk the list turning each arrow to point backwards (shown below).</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 232" role="img" aria-label="Reversing a linked list: prev, curr and next pointers, showing the arrow of the current node flipped to point backwards">
  <defs><marker id="pr-ll" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <text class="dg-t" x="10" y="20">Before:   1 → 2 → 3 → 4 → null</text>
  <text class="dg-t" x="10" y="54">Mid-way through reversing (after handling node 2):</text>
  <rect class="dg-fill2" x="20" y="70" width="60" height="36" rx="6"/><text class="dg-m" x="50" y="93" text-anchor="middle">1</text>
  <rect class="dg-fill2" x="130" y="70" width="60" height="36" rx="6"/><text class="dg-m" x="160" y="93" text-anchor="middle">2</text>
  <rect class="dg-fill" x="240" y="70" width="60" height="36" rx="6"/><text class="dg-m" x="270" y="93" text-anchor="middle">3</text>
  <rect class="dg-box" x="350" y="70" width="60" height="36" rx="6"/><text class="dg-m" x="380" y="93" text-anchor="middle">4</text>
  <text class="dg-s" x="440" y="93">null</text>
  <line class="dg-line" x1="130" y1="88" x2="82" y2="88" marker-end="url(#pr-ll)"/>
  <line class="dg-line" x1="20" y1="88" x2="2" y2="88"/>
  <text class="dg-s" x="2" y="126">null</text>
  <line class="dg-line" x1="300" y1="88" x2="348" y2="88" marker-end="url(#pr-ll)"/>
  <line class="dg-line" x1="410" y1="88" x2="436" y2="88" marker-end="url(#pr-ll)"/>
  <text class="dg-m" x="160" y="134" text-anchor="middle">prev</text>
  <text class="dg-m" x="270" y="134" text-anchor="middle">curr</text>
  <text class="dg-m" x="380" y="134" text-anchor="middle">next</text>
  <text class="dg-s" x="10" y="168">Reversed part (1, 2) points backwards. The rest (3, 4) is still forwards.</text>
  <text class="dg-s" x="10" y="186">Next step: save next = curr.next, flip curr.next = prev, then move prev and curr one step right.</text>
  <text class="dg-s" x="10" y="210">Three arrows are all you ever need. Lose "next" and nodes 4 onward are unreachable.</text>
</svg>
<figcaption>The reversal loop in one picture. Most list problems are this move, plus fast and slow pointers.</figcaption>
</figure>

<h3>A worked example: reverse a linked list</h3>
<pre><code>class ListNode { int val; ListNode next; ListNode(int v) { val = v; } }

static ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;   // 1. save the rest of the list
        curr.next = prev;            // 2. turn this node's arrow backwards
        prev = curr;                 // 3. move prev forward
        curr = next;                 // 4. move curr forward
    }
    return prev;                     // the old last node is the new head
}</code></pre>
<p>Tracing it on <code>1 → 2 → 3</code>:</p>
<ol class="pr-steps">
<li><b>Start:</b> prev = null, curr = 1.</li>
<li><b>Step 1:</b> save 2, point 1 back to null. Now prev = 1, curr = 2. We have <code>null ← 1</code> and <code>2 → 3</code>.</li>
<li><b>Step 2:</b> save 3, point 2 back to 1. Now prev = 2, curr = 3. We have <code>null ← 1 ← 2</code>.</li>
<li><b>Step 3:</b> save null, point 3 back to 2. Now prev = 3, curr = null, so the loop stops.</li>
<li>Return prev, which is 3: the list is now <code>3 → 2 → 1</code>. O(n) time and no extra memory.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Losing the rest of the list</p>
<p>Changing <code>curr.next</code> before saving it cuts off every node after it, and they can never be reached again.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> always store <code>curr.next</code> in a variable before changing it.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ NullPointerException at the edges</p>
<p>Code like <code>fast.next.next</code> crashes when <code>fast</code> or <code>fast.next</code> is null, near the end of the list.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> check both in the loop condition: <code>while (fast != null &amp;&amp; fast.next != null)</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Special-casing the head everywhere</p>
<p>Deleting or inserting at the first node often needs separate code, which is where bugs creep in.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> start with a dummy node pointing to the head and return <code>dummy.next</code> at the end.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Save <code>next</code> before you change it.</li>
<li>Use a dummy node to avoid special cases at the head.</li>
<li>Fast and slow pointers find the middle and detect cycles.</li>
<li>A gap of k finds the kth node from the end in one pass.</li>
<li>Always test with an empty list, one node, two nodes, and odd and even lengths.</li>
</ul>
<p><b>Next:</b> the questions below solve the classic linked list problems: reversal, cycles, merging, LRU cache and more.</p>`);

appendTopic("coding-linked-list", [
{
  q: "Reorder a list as first, last, second, second-last, and so on",
  level: "advanced", hot: true, tags: ["linked-list", "fast-slow-pointers", "reversal", "must-know"],
  companies: ["Amazon", "Microsoft", "Meta", "Adobe", "Flipkart", "Uber", "Walmart"],
  a: `<div class="cx"><b>O(n) time</b><span>three linear passes</span><b>O(1) space</b><span>in place</span></div>
<p>Turn <code>1 → 2 → 3 → 4 → 5</code> into <code>1 → 5 → 2 → 4 → 3</code>, in place. This is a favourite because it needs <strong>three</strong> basic techniques combined: find the middle, reverse a half, and merge two lists by alternating.</p>
<pre><code>1 -&gt; 2 -&gt; 3 -&gt; 4 -&gt; 5

Step 1  find the middle (slow/fast)    first half: 1 -&gt; 2 -&gt; 3
                                       second half: 4 -&gt; 5
Step 2  reverse the second half        5 -&gt; 4
Step 3  weave them together            1 -&gt; 5 -&gt; 2 -&gt; 4 -&gt; 3</code></pre>
<pre><code>static void reorderList(ListNode head) {
    if (head == null || head.next == null) return;

    // 1. Middle: when fast reaches the end, slow is at the middle
    ListNode slow = head, fast = head;
    while (fast.next != null &amp;&amp; fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }

    // 2. Cut the list in two, and reverse the second half
    ListNode second = reverse(slow.next);
    slow.next = null;                       // IMPORTANT: end the first half,
                                            // or the weave creates a cycle
    // 3. Weave: take one from each in turn
    ListNode first = head;
    while (second != null) {
        ListNode n1 = first.next, n2 = second.next;   // save both "rests"
        first.next = second;
        second.next = n1;
        first = n1;
        second = n2;
    }
}

static ListNode reverse(ListNode head) {
    ListNode prev = null;
    while (head != null) { ListNode n = head.next; head.next = prev; prev = head; head = n; }
    return prev;
}</code></pre>
<pre><code>Trace of the weave, first = 1-&gt;2-&gt;3, second = 5-&gt;4

 first  second   after linking
   1      5      1 -&gt; 5 -&gt; 2 ...
   2      4      1 -&gt; 5 -&gt; 2 -&gt; 4 -&gt; 3
   3     null    stop. 3.next is already null from the cut.</code></pre>
<table>
<tr><th>Bug</th><th>Symptom</th><th>Cause</th></tr>
<tr><td>Forgetting <code>slow.next = null</code></td><td>Infinite loop when printing</td><td>The first half still points into the reversed half: a cycle</td></tr>
<tr><td>Wrong middle for even lengths</td><td>Order off by one</td><td>The loop condition picks the first or second middle. With the one above, for 1-2-3-4 the first half is 1-2</td></tr>
<tr><td>Not saving <code>first.next</code> before relinking</td><td>Nodes vanish</td><td>The rest of the first list is lost</td></tr>
</table>
<p><strong>What to say:</strong> "It is three problems I already know: middle of a list, reverse a list, merge two lists. Solving it as a combination is easier to get right than a new algorithm, and each part is O(n) with O(1) extra space." The same three pieces also check whether a list is a palindrome.</p>
<p><strong>The simpler alternative, if memory is allowed:</strong> copy the nodes into an <code>ArrayList</code> and relink them with two indexes from both ends. O(n) space, harder to get wrong. Mention it, then do the O(1) version.</p>`
},
{
  q: "Partition a list around a value, and group odd and even positions together",
  level: "beginner", hot: true, tags: ["linked-list", "dummy-node", "partition"],
  companies: ["Amazon", "Microsoft", "Adobe", "Infosys", "TCS", "Samsung", "Oracle"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(1) space</b><span>relinks existing nodes</span></div>
<p>Both problems split one list into two and join them again. The tool that makes them easy is the <strong>dummy head</strong>: start each new list with a fake node, so you never need an "is this the first node?" special case.</p>
<p><strong>Problem 1: partition.</strong> Move every node with value less than <code>x</code> before the others, keeping the original order within each group. <code>1 → 4 → 3 → 2 → 5 → 2</code>, <code>x = 3</code> gives <code>1 → 2 → 2 → 4 → 3 → 5</code>.</p>
<pre><code>static ListNode partition(ListNode head, int x) {
    ListNode lessDummy = new ListNode(0), moreDummy = new ListNode(0);
    ListNode less = lessDummy, more = moreDummy;

    for (ListNode n = head; n != null; n = n.next) {
        if (n.val &lt; x) { less.next = n; less = n; }     // append to "less"
        else           { more.next = n; more = n; }     // append to "more"
    }
    more.next = null;                  // the last "more" node may still point
                                       // at a "less" node: cut it, or a cycle forms
    less.next = moreDummy.next;        // join: less list, then more list
    return lessDummy.next;             // skip the dummy
}</code></pre>
<pre><code>Trace: 1 4 3 2 5 2, x = 3
 node  goes to   less list        more list
  1    less      1
  4    more      1                4
  3    more      1                4 3
  2    less      1 2              4 3
  5    more      1 2              4 3 5
  2    less      1 2 2            4 3 5
 join: 1 -&gt; 2 -&gt; 2 -&gt; 4 -&gt; 3 -&gt; 5</code></pre>
<p><strong>Problem 2: odd-even list.</strong> Group the nodes at odd <em>positions</em> first, then the even positions. <code>1 → 2 → 3 → 4 → 5</code> becomes <code>1 → 3 → 5 → 2 → 4</code>. Here the two lists interleave perfectly, so two pointers are enough, without dummies.</p>
<pre><code>static ListNode oddEvenList(ListNode head) {
    if (head == null) return null;
    ListNode odd = head, even = head.next, evenHead = even;
    while (even != null &amp;&amp; even.next != null) {
        odd.next = even.next;          // skip over the even node
        odd = odd.next;
        even.next = odd.next;          // skip over the odd node
        even = even.next;
    }
    odd.next = evenHead;               // odds, then evens
    return head;
}</code></pre>
<table>
<tr><th>Technique</th><th>Why it helps here</th></tr>
<tr><td>Dummy heads</td><td>Appending to an empty list is the same code as appending to a long one</td></tr>
<tr><td>Relinking, not copying</td><td>O(1) extra space: the nodes are reused as they are</td></tr>
<tr><td>Cutting the tail (<code>more.next = null</code>)</td><td>Reused nodes keep their old <code>next</code>, which can point back into the list</td></tr>
<tr><td>Appending in order</td><td>Keeps the relative order stable, which the problem requires</td></tr>
</table>
<p><strong>Related:</strong> this partition is the linked-list step of quicksort, and the same two-dummy pattern splits a list into k groups, separates negatives from positives, or sorts a list of 0s, 1s and 2s in one pass.</p>`
}
]);
