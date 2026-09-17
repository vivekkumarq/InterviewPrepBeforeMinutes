appendTopic("coding-linked-list", [
{
  q: "The fast and slow pointer family — cycles, middles, and the k-th from the end",
  level: "beginner", hot: true, tags: ["linked-list", "two-pointers", "floyd", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "TCS", "Flipkart", "Oracle", "Walmart"],
  a: `<p>One idea — two pointers moving at different speeds — answers most linked-list questions in one pass with O(1) space.</p>
<pre><code>// DETECT A CYCLE — Floyd's tortoise and hare
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null &amp;&amp; fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
// Why they must meet: inside a loop of length L, the gap between them changes
// by exactly 1 each step, so it eventually hits 0. It cannot "jump past" —
// that is the proof, and it is the follow-up question.

// FIND WHERE THE CYCLE STARTS — the part people cannot derive on the spot
ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null &amp;&amp; fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) {                       // meeting point
            ListNode p = head;
            while (p != slow) { p = p.next; slow = slow.next; }   // same speed
            return p;                             // the cycle's entry node
        }
    }
    return null;
}
// The maths: let a = distance to the entry, b = entry to meeting point,
// L = cycle length. At the meeting, fast has gone 2(a+b) and slow a+b, and
// the difference is a whole number of loops -> a = L - b (mod L). So walking
// a steps from the head and b-to-entry steps from the meeting point coincide.</code></pre>
<pre><code>// MIDDLE OF THE LIST — fast moves twice per slow step
ListNode slow = head, fast = head;
while (fast != null &amp;&amp; fast.next != null) { slow = slow.next; fast = fast.next.next; }
return slow;
// For an EVEN length this returns the SECOND middle. If the problem wants the
// first, start fast at head.next. Ask, or state which one you returned.

// K-TH FROM THE END — the gap technique
ListNode fast = head;
for (int i = 0; i &lt; k; i++) fast = fast.next;    // open a k-node gap
ListNode slow = head;
while (fast != null) { slow = slow.next; fast = fast.next; }
return slow;
// For "remove the n-th from the end", use a DUMMY node before the head —
// otherwise removing the first element is a special case you have to branch on.</code></pre>
<table>
<tr><th>Problem</th><th>Pointer setup</th></tr>
<tr><td>Cycle detection</td><td>slow 1×, fast 2×</td></tr>
<tr><td>Cycle start</td><td>Then reset one to head, both 1×</td></tr>
<tr><td>Middle node</td><td>slow 1×, fast 2×</td></tr>
<tr><td>Palindrome list</td><td>Middle, reverse the second half, compare</td></tr>
<tr><td>Reorder list (L0→Ln→L1…)</td><td>Middle, reverse, then interleave</td></tr>
<tr><td>N-th from the end</td><td>Gap of n, plus a dummy head</td></tr>
<tr><td>Intersection of two lists</td><td>Switch to the other head at the end — both walk a+b+c</td></tr>
<tr><td>Happy number</td><td>Same Floyd cycle detection, on numbers rather than nodes</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Fast and slow pointers meeting inside a cycle">
  <circle class="dg-fill" cx="60" cy="60" r="14"/><circle class="dg-fill" cx="130" cy="60" r="14"/>
  <circle class="dg-fill2" cx="200" cy="60" r="14"/><circle class="dg-fill" cx="270" cy="30" r="14"/>
  <circle class="dg-fill" cx="330" cy="60" r="14"/><circle class="dg-fill" cx="270" cy="92" r="14"/>
  <path class="dg-line" d="M74 60 L116 60 M144 60 L186 60 M212 52 L258 36 M282 38 L320 54 M322 72 L284 88 M258 90 L212 70"/>
  <text class="dg-s" x="168" y="112">cycle entry</text>
  <text class="dg-s" x="380" y="48">the gap shrinks by exactly 1 per step,</text>
  <text class="dg-s" x="380" y="70">so it must reach 0 — they cannot cross</text>
</svg>
</figure>
<p><strong>Why not just use a HashSet of visited nodes?</strong> It works and it is O(n) time — but it is O(n) space. Floyd is O(1). Offer the set first if it gets you moving, then say "the O(1)-space version uses two pointers at different speeds" — showing both, and knowing which is better, is the full answer.</p>`
},
{
  q: "Reversal patterns: whole list, in groups of k, and between two positions",
  level: "advanced", hot: true, tags: ["linked-list", "reversal", "pointers", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Uber", "Goldman Sachs"],
  a: `<pre><code>// REVERSE A LIST — three pointers, and the order of the four lines is the answer
ListNode reverse(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode next = cur.next;    // 1. SAVE before you destroy
        cur.next = prev;             // 2. flip the link
        prev = cur;                  // 3. advance prev
        cur = next;                  // 4. advance cur
    }
    return prev;                     // cur is null; prev is the new head
}
// Skip line 1 and you lose the rest of the list on line 2. Returning cur
// instead of prev returns null. Those are the only two ways to get this wrong,
// and both are worth saying aloud as you write it.</code></pre>
<pre><code>// REVERSE IN GROUPS OF K — the hard version, built on a DUMMY node
ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0, head), groupPrev = dummy;
    while (true) {
        ListNode kth = groupPrev;
        for (int i = 0; i &lt; k &amp;&amp; kth != null; i++) kth = kth.next;
        if (kth == null) break;                  // fewer than k left — leave as is

        ListNode groupNext = kth.next, prev = groupNext, cur = groupPrev.next;
        while (cur != groupNext) {               // reverse this group only
            ListNode next = cur.next;
            cur.next = prev; prev = cur; cur = next;
        }
        ListNode newGroupPrev = groupPrev.next;  // the old head is the new tail
        groupPrev.next = kth;                    // stitch the group back in
        groupPrev = newGroupPrev;
    }
    return dummy.next;
}
// Seeding prev with groupNext (not null) is what stitches the tail of this
// group to the head of the next one automatically.</code></pre>
<table>
<tr><th>Habit</th><th>Why it removes bugs</th></tr>
<tr><td><strong>Dummy head node</strong></td><td>Deleting or inserting at position 0 stops being a special case</td></tr>
<tr><td>Draw three nodes on paper first</td><td>Every pointer bug is visible in a three-node example</td></tr>
<tr><td>Save <code>next</code> before reassigning</td><td>The one mistake that loses the list</td></tr>
<tr><td>Check <code>fast != null &amp;&amp; fast.next != null</code></td><td>Order matters — the reverse throws NPE</td></tr>
<tr><td>Null the old tail</td><td>Splitting a list without this leaves a dangling link</td></tr>
</table>
<pre><code>// REVERSE BETWEEN positions left..right — one pass, head-insertion
ListNode dummy = new ListNode(0, head), prev = dummy;
for (int i = 1; i &lt; left; i++) prev = prev.next;   // node BEFORE the section
ListNode cur = prev.next;
for (int i = 0; i &lt; right - left; i++) {           // pull each next node to the front
    ListNode moved = cur.next;
    cur.next = moved.next;
    moved.next = prev.next;
    prev.next = moved;
}
return dummy.next;</code></pre>
<table>
<tr><th>Built on reversal</th><th>Composition</th></tr>
<tr><td>Palindrome linked list</td><td>Find the middle → reverse the second half → compare → (restore)</td></tr>
<tr><td>Reorder list</td><td>Middle → reverse the second half → interleave</td></tr>
<tr><td>Add two numbers II (most significant first)</td><td>Reverse both, add, reverse the result — or use two stacks</td></tr>
<tr><td>Swap nodes in pairs</td><td>Reverse in groups of k with k = 2</td></tr>
<tr><td>Rotate list by k</td><td>Close it into a ring, walk <code>n − k%n</code>, then break</td></tr>
</table>
<p><strong>The recursive reversal</strong> is four lines and worth knowing — but it is O(n) stack space, so on a million-node list it overflows. If you write it, say that. "Recursive is cleaner, iterative is O(1) space and will not blow the stack" is the kind of trade-off sentence interviewers are listening for.</p>`
},
{
  q: "Designing an LRU cache — and why the doubly linked list is mandatory",
  level: "advanced", hot: true, tags: ["lru", "design", "linked-list", "hashmap", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Salesforce", "Goldman Sachs"],
  a: `<p>The requirement is <strong>O(1) get and O(1) put</strong>. That single constraint forces the structure: a hash map for lookup, plus a doubly linked list for recency ordering.</p>
<pre><code>class LRUCache {
    private static class Node { int key, val; Node prev, next; }

    private final Map&lt;Integer, Node&gt; map = new HashMap&lt;&gt;();
    private final Node head = new Node(), tail = new Node();   // sentinels
    private final int capacity;

    LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail; tail.prev = head;    // empty list, no null checks ever
    }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        moveToFront(n);                        // touching it makes it most recent
        return n.val;
    }

    public void put(int key, int val) {
        Node n = map.get(key);
        if (n != null) { n.val = val; moveToFront(n); return; }
        if (map.size() == capacity) {
            Node lru = tail.prev;              // least recently used
            remove(lru);
            map.remove(lru.key);               // the node must store its KEY —
        }                                      // otherwise you cannot evict it
        Node fresh = new Node(); fresh.key = key; fresh.val = val;
        map.put(key, fresh);
        addFront(fresh);
    }

    private void remove(Node n)   { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFront(Node n) { n.next = head.next; n.prev = head;
                                    head.next.prev = n; head.next = n; }
    private void moveToFront(Node n) { remove(n); addFront(n); }
}</code></pre>
<table>
<tr><th>Design decision</th><th>Reason</th></tr>
<tr><td><strong>Doubly</strong> linked, not singly</td><td>Unlinking a node needs its predecessor. Singly means an O(n) scan, breaking the contract</td></tr>
<tr><td>Head and tail <strong>sentinels</strong></td><td>Removes every null check from the pointer code — the source of most bugs here</td></tr>
<tr><td>The node stores its <strong>key</strong></td><td>On eviction you have the node and need to delete the map entry</td></tr>
<tr><td>Map holds the <strong>node</strong>, not the value</td><td>You must reach the list position in O(1)</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Hash map pointing into a doubly linked list ordered by recency">
  <rect class="dg-fill2" x="20" y="20" width="110" height="50" rx="6"/><text class="dg-t" x="75" y="50" text-anchor="middle">HashMap</text>
  <text class="dg-s" x="20" y="88">key → node</text>
  <rect class="dg-fill" x="200" y="20" width="66" height="36" rx="5"/><text class="dg-t" x="233" y="43" text-anchor="middle">MRU</text>
  <rect class="dg-fill" x="292" y="20" width="66" height="36" rx="5"/><text class="dg-t" x="325" y="43" text-anchor="middle">…</text>
  <rect class="dg-fill" x="384" y="20" width="66" height="36" rx="5"/><text class="dg-t" x="417" y="43" text-anchor="middle">LRU</text>
  <path class="dg-line" d="M266 32 L292 32 M358 32 L384 32 M292 46 L266 46 M384 46 L358 46"/>
  <path class="dg-line" d="M130 40 L200 40" marker-end="url(#lr1)"/>
  <path class="dg-line" d="M130 52 L292 62" marker-end="url(#lr1)"/>
  <text class="dg-s" x="200" y="96">evict from this end ────────────────▶</text>
  <text class="dg-s" x="20" y="130">map gives O(1) FIND · list gives O(1) REORDER and O(1) EVICT</text>
  <defs><marker id="lr1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// The one-liner, if the interviewer allows library code:
new LinkedHashMap&lt;K,V&gt;(capacity, 0.75f, true) {          // true = ACCESS order
    protected boolean removeEldestEntry(Map.Entry&lt;K,V&gt; e) { return size() &gt; capacity; }
};
// Worth mentioning — it shows you know the JDK — but always follow with
// "here is the version built from scratch", because that is what is being asked.

// FOLLOW-UPS you should have an answer ready for:
// - Thread safety? Guard with a lock, or shard by key hash to cut contention.
// - LFU instead? Frequency buckets, each bucket its own list -> still O(1).
// - Distributed? Redis with maxmemory-policy allkeys-lru; per-node LRU
//   otherwise means each node caches a different working set.
// - TTL as well? A second index by expiry, or lazy expiry checked on read.</code></pre>
<p><strong>The framing that lands:</strong> "Neither structure can do this alone. A hash map has no order, a list has no O(1) lookup. Combining them is the point — and that pattern, an index plus an ordered structure, is the same one behind a database index over a heap file."</p>`
}
]);
