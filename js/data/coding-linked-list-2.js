appendTopic("coding-linked-list", [
{
  q: "Add two numbers represented as linked lists",
  level: "advanced", hot: true, tags: ["linked-list", "math", "interview-favourite"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Uber", "Zoho", "Oracle"],
  a: `<div class="cx"><b>O(max(m,n)) time</b><span>one pass</span><b>O(max(m,n)) space</b><span>the result list</span></div>
<pre><code>// Digits stored in REVERSE order: 342 + 465 is 2->4->3 plus 5->6->4
public ListNode addTwoNumbers(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), cur = dummy;
    int carry = 0;

    // One loop handles unequal lengths AND the final carry
    while (a != null || b != null || carry != 0) {
        int sum = carry;
        if (a != null) { sum += a.val; a = a.next; }
        if (b != null) { sum += b.val; b = b.next; }

        carry = sum / 10;
        cur.next = new ListNode(sum % 10);
        cur = cur.next;
    }
    return dummy.next;
}</code></pre>
<table>
<tr><th>Edge case</th><th>Handled by</th></tr>
<tr><td>Lists of different lengths</td><td>The <code>!= null</code> guards inside the loop</td></tr>
<tr><td><strong>A final carry</strong> — 99 + 1</td><td><code>|| carry != 0</code> in the condition</td></tr>
<tr><td>One list empty</td><td>Same guards</td></tr>
<tr><td>Result longer than both inputs</td><td>The loop simply runs one more time</td></tr>
</table>
<p><strong>The follow-up that changes everything:</strong> "what if the digits are in <em>forward</em> order?" Now you cannot add left to right, because carries propagate the other way. Three options — reverse both lists, add, reverse the result; push both onto stacks and pop; or recurse to the end and carry back. The stack version is usually cleanest and does not mutate the input.</p>
<pre><code>// FORWARD order, using two stacks
Deque&lt;Integer&gt; s1 = new ArrayDeque&lt;&gt;(), s2 = new ArrayDeque&lt;&gt;();
while (a != null) { s1.push(a.val); a = a.next; }
while (b != null) { s2.push(b.val); b = b.next; }

ListNode head = null;
int carry = 0;
while (!s1.isEmpty() || !s2.isEmpty() || carry != 0) {
    int sum = carry + (s1.isEmpty() ? 0 : s1.pop()) + (s2.isEmpty() ? 0 : s2.pop());
    carry = sum / 10;
    ListNode node = new ListNode(sum % 10);
    node.next = head;          // PREPEND, so the result comes out forward
    head = node;
}
return head;</code></pre>
<p><strong>Why not convert to a number?</strong> Because the lists can be thousands of digits long — that is the whole point of the representation. Converting to <code>long</code> overflows; <code>BigInteger</code> works but sidesteps what is being tested. Say that out loud rather than just avoiding it.</p>`
},
{
  q: "Sort a linked list, and flatten a multilevel list",
  level: "advanced", tags: ["linked-list", "sorting", "recursion", "merge-sort"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Oracle", "Goldman Sachs"],
  a: `<div class="cx"><b>O(n log n) time</b><span>merge sort</span><b>O(log n) space</b><span>recursion depth only</span></div>
<pre><code>// MERGE SORT is the right choice for a list: no random access needed, and
// unlike arrays it needs no auxiliary array — you just relink nodes.
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;

    // 1. SPLIT at the middle. prev is kept so the first half can be terminated.
    ListNode slow = head, fast = head, prev = null;
    while (fast != null &amp;&amp; fast.next != null) {
        prev = slow; slow = slow.next; fast = fast.next.next;
    }
    prev.next = null;                       // cut — forgetting this loops forever

    // 2. Sort each half
    ListNode l = sortList(head), r = sortList(slow);

    // 3. Merge
    return merge(l, r);
}

private ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), cur = dummy;
    while (a != null &amp;&amp; b != null) {
        if (a.val &lt;= b.val) { cur.next = a; a = a.next; }   // <= keeps it STABLE
        else                { cur.next = b; b = b.next; }
        cur = cur.next;
    }
    cur.next = (a != null) ? a : b;          // attach the remainder
    return dummy.next;
}</code></pre>
<table>
<tr><th>Why not…</th><th>Reason</th></tr>
<tr><td>Quicksort</td><td>Needs random access for a good pivot; worst case O(n²) and no cache benefit here</td></tr>
<tr><td>Heap sort</td><td>Needs indexed access to children</td></tr>
<tr><td>Copy to an array, sort, rebuild</td><td>Works and is O(n) extra space — say it as the simple option, then give merge sort</td></tr>
</table>
<pre><code>// FLATTEN A MULTILEVEL DOUBLY LINKED LIST — each node may have a child list
public Node flatten(Node head) {
    for (Node cur = head; cur != null; cur = cur.next) {
        if (cur.child == null) continue;

        Node next = cur.next;
        Node child = flatten(cur.child);      // flatten the sub-list first

        cur.next = child;  child.prev = cur;
        cur.child = null;                      // MUST clear it

        Node tail = child;
        while (tail.next != null) tail = tail.next;   // walk to the child's end
        tail.next = next;
        if (next != null) next.prev = tail;
    }
    return head;
}
// An explicit stack version avoids the recursion depth on a deeply nested list.</code></pre>
<p><strong>The detail that decides both problems:</strong> cutting the link. In sortList, failing to set <code>prev.next = null</code> means both halves still see the whole list and the recursion never terminates. In flatten, failing to clear <code>cur.child</code> leaves the structure inconsistent even though traversal looks right. Both are invisible until you trace a small example.</p>`
}
]);
