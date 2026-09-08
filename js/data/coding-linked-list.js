registerTopic("coding-linked-list", [
{
  q: "Reverse a linked list — iteratively, recursively, and in groups of k",
  level: "beginner", hot: true, tags: ["linked-list", "in-place", "interview-favourite"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Uber", "Walmart", "Zoho"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(1) space</b><span>iterative version</span></div>
<pre><code>// ITERATIVE — three pointers. This is the one to write.
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;   // 1. remember where we were going
        curr.next = prev;            // 2. flip the pointer backwards
        prev = curr;                 // 3. advance both
        curr = next;
    }
    return prev;                     // curr is null; prev is the new head
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Reversing a linked list one pointer at a time">
  <text class="dg-s" x="16" y="20">before</text>
  <rect class="dg-fill" x="16" y="30" width="52" height="30" rx="6"/><text class="dg-t" x="42" y="50" text-anchor="middle">1</text>
  <rect class="dg-fill" x="104" y="30" width="52" height="30" rx="6"/><text class="dg-t" x="130" y="50" text-anchor="middle">2</text>
  <rect class="dg-fill" x="192" y="30" width="52" height="30" rx="6"/><text class="dg-t" x="218" y="50" text-anchor="middle">3</text>
  <path class="dg-line" d="M70 45 H100 M158 45 H188 M246 45 H276" marker-end="url(#ll1)"/>
  <text class="dg-s" x="290" y="50">null</text>
  <text class="dg-s" x="16" y="92">after</text>
  <rect class="dg-fill2" x="16" y="102" width="52" height="30" rx="6"/><text class="dg-t" x="42" y="122" text-anchor="middle">1</text>
  <rect class="dg-fill2" x="104" y="102" width="52" height="30" rx="6"/><text class="dg-t" x="130" y="122" text-anchor="middle">2</text>
  <rect class="dg-fill2" x="192" y="102" width="52" height="30" rx="6"/><text class="dg-t" x="218" y="122" text-anchor="middle">3</text>
  <path class="dg-line" d="M100 117 H72 M188 117 H160 M276 117 H248" marker-end="url(#ll1)"/>
  <text class="dg-s" x="288" y="122">new head</text>
  <text class="dg-s" x="380" y="60">save next before overwriting curr.next —</text>
  <text class="dg-s" x="380" y="80">skip that and the rest of the list is lost</text>
  <defs><marker id="ll1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// RECURSIVE — elegant, but O(n) stack. Say that.
public ListNode reverseRec(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode newHead = reverseRec(head.next);   // reverse everything after head
    head.next.next = head;                      // make the next node point BACK
    head.next = null;                           // and cut the old forward link
    return newHead;
}</code></pre>
<pre><code>// REVERSE IN GROUPS OF K — the hard follow-up, still O(n)/O(1)
public ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0, head), groupPrev = dummy;

    while (true) {
        ListNode kth = groupPrev;
        for (int i = 0; i &lt; k && kth != null; i++) kth = kth.next;
        if (kth == null) break;                 // fewer than k left -> leave as is

        ListNode groupNext = kth.next, prev = groupNext, curr = groupPrev.next;
        while (curr != groupNext) {             // standard reversal, bounded
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        ListNode newGroupPrev = groupPrev.next; // old head is now the group TAIL
        groupPrev.next = kth;
        groupPrev = newGroupPrev;
    }
    return dummy.next;
}</code></pre>
<table>
<tr><th>Variant</th><th>Key change</th></tr>
<tr><td>Reverse between positions m and n</td><td>Walk to m−1, reverse n−m+1 nodes, reconnect both ends</td></tr>
<tr><td>Reverse in groups of k</td><td>As above; ask whether a trailing partial group is reversed</td></tr>
<tr><td>Reverse a doubly linked list</td><td>Swap <code>prev</code> and <code>next</code> on every node, then swap head and tail</td></tr>
<tr><td>Check palindrome list</td><td>Find the middle, reverse the second half, compare, restore</td></tr>
</table>
<p><strong>The habit worth showing:</strong> use a <strong>dummy head node</strong> whenever the head itself might change. It removes every "is this the first node?" special case, and it is the single most useful trick in linked-list problems.</p>`
},
{
  q: "Detect a cycle in a linked list and find where it begins",
  level: "advanced", hot: true, tags: ["linked-list", "fast-slow", "cycle-detection", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Flipkart", "Uber", "Oracle", "Salesforce"],
  a: `<div class="cx"><b>O(n) time</b><span>at most two passes</span><b>O(1) space</b><span>no hash set needed</span></div>
<pre><code>// FLOYD'S TORTOISE AND HARE
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;              // 1 step
        fast = fast.next.next;         // 2 steps
        if (slow == fast) return true; // they can only meet inside a loop
    }
    return false;                      // fast reached the end -> no cycle
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Floyd cycle detection with distances a and b">
  <rect class="dg-fill" x="20" y="60" width="46" height="30" rx="6"/><text class="dg-t" x="43" y="80" text-anchor="middle">1</text>
  <rect class="dg-fill" x="90" y="60" width="46" height="30" rx="6"/><text class="dg-t" x="113" y="80" text-anchor="middle">2</text>
  <rect class="dg-fill2" x="160" y="60" width="46" height="30" rx="6"/><text class="dg-t" x="183" y="80" text-anchor="middle">3</text>
  <rect class="dg-box" x="250" y="24" width="46" height="30" rx="6"/><text class="dg-t" x="273" y="44" text-anchor="middle">4</text>
  <rect class="dg-box" x="330" y="60" width="46" height="30" rx="6"/><text class="dg-t" x="353" y="80" text-anchor="middle">5</text>
  <rect class="dg-box" x="250" y="102" width="46" height="30" rx="6"/><text class="dg-t" x="273" y="122" text-anchor="middle">6</text>
  <path class="dg-line" d="M68 75 H86 M138 75 H156" marker-end="url(#fc1)"/>
  <path class="dg-line" d="M206 70 L246 46" marker-end="url(#fc1)"/>
  <path class="dg-line" d="M298 42 L328 62" marker-end="url(#fc1)"/>
  <path class="dg-line" d="M348 92 L300 112" marker-end="url(#fc1)"/>
  <path class="dg-line" d="M248 112 L208 88" marker-end="url(#fc1)"/>
  <text class="dg-s" x="110" y="112" text-anchor="middle">a = distance to loop start</text>
  <text class="dg-s" x="440" y="70">meeting point is b steps into</text>
  <text class="dg-s" x="440" y="88">the loop; a = remaining distance</text>
  <text class="dg-s" x="440" y="106">back round to the entry</text>
  <text class="dg-s" x="16" y="155">so: reset one pointer to head, advance both by 1 — they meet at the loop start</text>
  <defs><marker id="fc1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// FIND THE START OF THE CYCLE
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {                 // phase 1: they met
            ListNode p = head;              // phase 2: reset one to the head
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;                       // meeting point = cycle entry
        }
    }
    return null;
}</code></pre>
<p><strong>The proof, in two lines</strong> — worth being able to state, because it is the whole reason phase 2 works:</p>
<blockquote><p>Let <code>a</code> be the distance from head to the loop entry, <code>b</code> the distance from the entry to the meeting point, and <code>c</code> the rest of the loop. Slow travelled <code>a + b</code>; fast travelled <code>a + b + (b + c)</code> for one extra lap. Since fast moved twice as far: <code>2(a + b) = a + 2b + c</code>, so <strong><code>a = c</code></strong>. Walking <code>a</code> steps from the head and <code>c</code> steps from the meeting point lands on the same node.</p></blockquote>
<table>
<tr><th>Problem</th><th>Same two-pointer trick</th></tr>
<tr><td>Middle of the list</td><td>Fast moves 2, slow moves 1 — slow ends at the middle in one pass</td></tr>
<tr><td>Nth node from the end</td><td>Advance fast by n, then move both until fast hits null</td></tr>
<tr><td>Palindrome list</td><td>Find the middle, reverse the second half, compare</td></tr>
<tr><td>Cycle length</td><td>After they meet, keep one still and walk the other until it returns</td></tr>
<tr><td>Happy number</td><td>The same algorithm on the digit-square sequence, not on nodes at all</td></tr>
<tr><td>Find the duplicate number</td><td>Treat the array as a linked list where <code>i → nums[i]</code></td></tr>
</table>
<p><strong>The alternative to mention and reject:</strong> a <code>HashSet</code> of visited nodes solves it in O(n) time but O(n) space, and it needs identity comparison rather than <code>equals</code>. Floyd's is the same time with constant space, which is why it is the expected answer.</p>`
},
{
  q: "Merge two sorted linked lists, and merge k sorted lists",
  level: "advanced", hot: true, tags: ["linked-list", "heap", "divide-conquer"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Goldman Sachs", "Walmart"],
  a: `<pre><code>// MERGE TWO — the dummy node removes every head special case
public ListNode mergeTwoLists(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;

    while (a != null && b != null) {
        if (a.val &lt;= b.val) { tail.next = a; a = a.next; }   // &lt;= keeps it STABLE
        else                { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;      // attach whatever remains — no loop needed
    return dummy.next;
}</code></pre>
<div class="cx"><b>Two lists: O(n+m)</b><span>one pass</span><b>k lists: O(N log k)</b><span>N = total nodes</span></div>
<pre><code>// MERGE K LISTS — approach 1: min-heap of the current head of each list
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue&lt;ListNode&gt; pq = new PriorityQueue&lt;&gt;(Comparator.comparingInt(n -&gt; n.val));
    for (ListNode l : lists) if (l != null) pq.offer(l);

    ListNode dummy = new ListNode(0), tail = dummy;
    while (!pq.isEmpty()) {
        ListNode node = pq.poll();
        tail.next = node;
        tail = node;
        if (node.next != null) pq.offer(node.next);   // heap never holds more than k
    }
    return dummy.next;
}</code></pre>
<pre><code>// Approach 2: pairwise divide and conquer — same O(N log k), NO extra space
public ListNode mergeKLists2(ListNode[] lists) {
    if (lists.length == 0) return null;
    int interval = 1;
    while (interval &lt; lists.length) {
        for (int i = 0; i + interval &lt; lists.length; i += interval * 2) {
            lists[i] = mergeTwoLists(lists[i], lists[i + interval]);
        }
        interval *= 2;
    }
    return lists[0];
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Pairwise merging of k sorted lists halves the count each round">
  <rect class="dg-box" x="16" y="20" width="60" height="24" rx="5"/><text class="dg-s" x="46" y="37" text-anchor="middle">L1</text>
  <rect class="dg-box" x="92" y="20" width="60" height="24" rx="5"/><text class="dg-s" x="122" y="37" text-anchor="middle">L2</text>
  <rect class="dg-box" x="168" y="20" width="60" height="24" rx="5"/><text class="dg-s" x="198" y="37" text-anchor="middle">L3</text>
  <rect class="dg-box" x="244" y="20" width="60" height="24" rx="5"/><text class="dg-s" x="274" y="37" text-anchor="middle">L4</text>
  <path class="dg-line" d="M46 48 L84 68 M122 48 L84 68 M198 48 L236 68 M274 48 L236 68"/>
  <rect class="dg-fill" x="46" y="70" width="76" height="24" rx="5"/><text class="dg-s" x="84" y="87" text-anchor="middle">L1+L2</text>
  <rect class="dg-fill" x="198" y="70" width="76" height="24" rx="5"/><text class="dg-s" x="236" y="87" text-anchor="middle">L3+L4</text>
  <path class="dg-line" d="M84 98 L160 118 M236 98 L160 118"/>
  <rect class="dg-fill2" x="112" y="120" width="96" height="24" rx="5"/><text class="dg-s" x="160" y="137" text-anchor="middle">merged</text>
  <text class="dg-s" x="360" y="60">log k rounds, and every round</text>
  <text class="dg-s" x="360" y="80">touches all N nodes once</text>
  <text class="dg-s" x="360" y="100">→ O(N log k)</text>
</svg>
</figure>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th></tr>
<tr><td>Merge one at a time into an accumulator</td><td>O(N·k)</td><td>O(1) — the naive answer, do not stop here</td></tr>
<tr><td>Collect all values, sort, rebuild</td><td>O(N log N)</td><td>O(N) — works, but throws away the sortedness</td></tr>
<tr><td><strong>Min-heap</strong></td><td>O(N log k)</td><td>O(k)</td></tr>
<tr><td><strong>Divide and conquer</strong></td><td>O(N log k)</td><td>O(1)</td></tr>
</table>
<p><strong>The real-world hook:</strong> this is exactly how an external merge sort combines sorted runs from disk, and how a log aggregator merges timestamped streams from k servers. The heap version is what you use when the lists are streams you cannot hold in memory — worth saying, because it turns a puzzle into engineering.</p>`
},
{
  q: "Design an LRU cache",
  level: "advanced", hot: true, tags: ["linked-list", "design", "hashing", "interview-favourite"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Salesforce", "Oracle"],
  a: `<div class="cx"><b>O(1) get</b><span>hash map lookup</span><b>O(1) put</b><span>doubly linked list splice</span></div>
<p><strong>Why the combination is forced:</strong> a hash map gives O(1) lookup but no ordering. A list gives ordering but O(n) lookup. You need both, so the map stores <em>node references</em> into a doubly linked list, and every operation moves a node to the front in O(1).</p>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="LRU cache with a hash map pointing into a doubly linked list">
  <rect class="dg-fill" x="16" y="20" width="150" height="120" rx="10"/>
  <text class="dg-s" x="91" y="40" text-anchor="middle">HashMap</text>
  <text class="dg-s" x="91" y="62" text-anchor="middle">key → node</text>
  <text class="dg-s" x="91" y="86" text-anchor="middle">A → •</text>
  <text class="dg-s" x="91" y="106" text-anchor="middle">B → •</text>
  <text class="dg-s" x="91" y="126" text-anchor="middle">C → •</text>
  <path class="dg-line" d="M170 86 L242 60 M170 106 L242 92 M170 126 L242 124" marker-end="url(#lru1)"/>
  <text class="dg-s" x="410" y="20" text-anchor="middle">doubly linked list — most recent at the head</text>
  <rect class="dg-box" x="248" y="44" width="54" height="30" rx="6"/><text class="dg-t" x="275" y="64" text-anchor="middle">A</text>
  <rect class="dg-box" x="330" y="44" width="54" height="30" rx="6"/><text class="dg-t" x="357" y="64" text-anchor="middle">B</text>
  <rect class="dg-box" x="412" y="44" width="54" height="30" rx="6"/><text class="dg-t" x="439" y="64" text-anchor="middle">C</text>
  <path class="dg-line" d="M304 54 H328 M386 54 H410" marker-end="url(#lru1)"/>
  <path class="dg-line" d="M328 66 H306 M410 66 H388" marker-end="url(#lru1)"/>
  <text class="dg-s" x="275" y="96" text-anchor="middle">head</text>
  <text class="dg-s" x="439" y="96" text-anchor="middle">tail = evict next</text>
  <text class="dg-s" x="248" y="132">the map holds the node itself, so unlinking never needs a scan —</text>
  <text class="dg-s" x="248" y="152">that is the only reason both operations are O(1)</text>
  <defs><marker id="lru1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>public class LRUCache {
    private static class Node {
        int key, val; Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }

    private final int capacity;
    private final Map&lt;Integer, Node&gt; map = new HashMap&lt;&gt;();
    private final Node head = new Node(0, 0);   // sentinels remove all null checks
    private final Node tail = new Node(0, 0);

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        moveToFront(n);
        return n.val;
    }

    public void put(int key, int value) {
        Node n = map.get(key);
        if (n != null) { n.val = value; moveToFront(n); return; }

        if (map.size() == capacity) {
            Node lru = tail.prev;        // the node just before the tail sentinel
            unlink(lru);
            map.remove(lru.key);         // NEEDS lru.key — this is why the node stores it
        }
        Node fresh = new Node(key, value);
        map.put(key, fresh);
        insertAfterHead(fresh);
    }

    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void insertAfterHead(Node n) {
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }
    private void moveToFront(Node n) { unlink(n); insertAfterHead(n); }
}</code></pre>
<p><strong>The detail interviewers probe:</strong> why does the node store its <code>key</code> as well as its value? Because on eviction you have the <em>node</em> and must remove the corresponding <em>map entry</em> — without the key you would have to scan the map, and the O(1) guarantee collapses.</p>
<table>
<tr><th>Follow-up</th><th>Answer</th></tr>
<tr><td>Make it thread-safe</td><td>A single lock around both structures is correct but serialises everything; production caches shard the map and use per-segment locks</td></tr>
<tr><td>Java has this built in</td><td><code>LinkedHashMap</code> with <code>accessOrder=true</code> and an overridden <code>removeEldestEntry</code> — say this, then write the manual version</td></tr>
<tr><td>LFU instead of LRU</td><td>Frequency buckets, each a doubly linked list, plus a pointer to the minimum frequency — still O(1)</td></tr>
<tr><td>Add TTL expiry</td><td>Store a deadline per node; evict lazily on access plus a background sweep</td></tr>
<tr><td>Distributed</td><td>Redis with <code>maxmemory-policy allkeys-lru</code> — do not build it yourself</td></tr>
</table>
<pre><code>// The 5-line production answer
Map&lt;K, V&gt; lru = new LinkedHashMap&lt;&gt;(16, 0.75f, true) {
    protected boolean removeEldestEntry(Map.Entry&lt;K, V&gt; eldest) { return size() &gt; capacity; }
};</code></pre>`
},
{
  q: "Find the intersection node of two linked lists",
  level: "advanced", tags: ["linked-list", "two-pointers", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Oracle", "Flipkart", "Cognizant"],
  a: `<div class="cx"><b>O(n+m) time</b><span>each pointer walks both lists once</span><b>O(1) space</b><span>no set, no length arithmetic</span></div>
<pre><code>// The two-pointer switch trick — the cleanest solution to this problem.
public ListNode getIntersectionNode(ListNode a, ListNode b) {
    if (a == null || b == null) return null;
    ListNode p = a, q = b;
    while (p != q) {
        p = (p == null) ? b : p.next;   // when p finishes list A, restart on B
        q = (q == null) ? a : q.next;   // when q finishes list B, restart on A
    }
    return p;    // either the intersection node, or null if they never meet
}</code></pre>
<p><strong>Why it terminates and why it is correct:</strong> after the switch, both pointers have travelled exactly <code>lenA + lenB</code> steps, so they arrive at the same position simultaneously. If the lists intersect, that position is the intersection node. If they do not, both reach <code>null</code> at the same time and the loop exits — which is why the <code>null</code> case needs no special handling.</p>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Two lists converging at a shared tail">
  <rect class="dg-fill" x="16" y="34" width="44" height="28" rx="6"/><text class="dg-t" x="38" y="53" text-anchor="middle">4</text>
  <rect class="dg-fill" x="80" y="34" width="44" height="28" rx="6"/><text class="dg-t" x="102" y="53" text-anchor="middle">1</text>
  <rect class="dg-fill2" x="16" y="104" width="44" height="28" rx="6"/><text class="dg-t" x="38" y="123" text-anchor="middle">5</text>
  <rect class="dg-fill2" x="80" y="104" width="44" height="28" rx="6"/><text class="dg-t" x="102" y="123" text-anchor="middle">6</text>
  <rect class="dg-fill2" x="144" y="104" width="44" height="28" rx="6"/><text class="dg-t" x="166" y="123" text-anchor="middle">1</text>
  <rect class="dg-box" x="248" y="68" width="44" height="28" rx="6"/><text class="dg-t" x="270" y="87" text-anchor="middle">8</text>
  <rect class="dg-box" x="312" y="68" width="44" height="28" rx="6"/><text class="dg-t" x="334" y="87" text-anchor="middle">4</text>
  <rect class="dg-box" x="376" y="68" width="44" height="28" rx="6"/><text class="dg-t" x="398" y="87" text-anchor="middle">5</text>
  <path class="dg-line" d="M62 48 H78 M126 48 L244 76" marker-end="url(#in1)"/>
  <path class="dg-line" d="M62 118 H78 M126 118 H142 M190 118 L244 96" marker-end="url(#in1)"/>
  <path class="dg-line" d="M294 82 H310 M358 82 H374" marker-end="url(#in1)"/>
  <text class="dg-s" x="270" y="118" text-anchor="middle">intersection</text>
  <text class="dg-s" x="16" y="156">lists share NODES, not values — compare with ==, never with equals()</text>
  <defs><marker id="in1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th><th>Note</th></tr>
<tr><td>Nested loops</td><td>O(n·m)</td><td>O(1)</td><td>Mention and dismiss</td></tr>
<tr><td>HashSet of nodes from list A</td><td>O(n+m)</td><td>O(n)</td><td>Simple; say it first</td></tr>
<tr><td>Length difference, then advance the longer</td><td>O(n+m)</td><td>O(1)</td><td>Correct, more code</td></tr>
<tr><td><strong>Pointer switch</strong></td><td>O(n+m)</td><td><strong>O(1)</strong></td><td>Shortest and cleanest</td></tr>
</table>
<p><strong>The trap in this question</strong> is comparing values instead of references. Two lists can contain equal values without sharing a single node. The problem is about object <em>identity</em>, so <code>p == q</code> is required and <code>p.val == q.val</code> is wrong. Interviewers plant lists with repeated values specifically to catch this.</p>`
},
{
  q: "Remove the nth node from the end of a list",
  level: "beginner", hot: true, tags: ["linked-list", "two-pointers"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Cognizant", "Infosys", "Uber"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass, not two</span><b>O(1) space</b><span>two pointers</span></div>
<pre><code>public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head);   // handles "remove the head itself"
    ListNode fast = dummy, slow = dummy;

    for (int i = 0; i &lt;= n; i++) {            // note &lt;=: gap of n+1 nodes
        if (fast == null) return head;        // n larger than the list
        fast = fast.next;
    }
    while (fast != null) { fast = fast.next; slow = slow.next; }

    slow.next = slow.next.next;               // slow sits just BEFORE the target
    return dummy.next;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Two pointers with a fixed gap of n plus one">
  <rect class="dg-box" x="16" y="40" width="48" height="30" rx="6"/><text class="dg-t" x="40" y="60" text-anchor="middle">D</text>
  <rect class="dg-fill" x="80" y="40" width="48" height="30" rx="6"/><text class="dg-t" x="104" y="60" text-anchor="middle">1</text>
  <rect class="dg-fill" x="144" y="40" width="48" height="30" rx="6"/><text class="dg-t" x="168" y="60" text-anchor="middle">2</text>
  <rect class="dg-fill" x="208" y="40" width="48" height="30" rx="6"/><text class="dg-t" x="232" y="60" text-anchor="middle">3</text>
  <rect class="dg-fill2" x="272" y="40" width="48" height="30" rx="6"/><text class="dg-t" x="296" y="60" text-anchor="middle">4</text>
  <rect class="dg-fill" x="336" y="40" width="48" height="30" rx="6"/><text class="dg-t" x="360" y="60" text-anchor="middle">5</text>
  <text class="dg-s" x="232" y="88" text-anchor="middle">slow</text>
  <text class="dg-s" x="410" y="88" text-anchor="middle">fast = null</text>
  <path class="dg-line" d="M232 74 V82 M400 74 V82"/>
  <path class="dg-line" d="M232 30 H400" stroke-dasharray="4 3"/>
  <text class="dg-s" x="316" y="24" text-anchor="middle">gap held at n+1 = 3</text>
  <text class="dg-s" x="16" y="120">when fast falls off the end, slow is exactly one node before the target (4) — unlink it</text>
</svg>
</figure>
<p><strong>Two details that decide this question:</strong></p>
<ul>
<li><strong>The dummy node.</strong> Removing the head (<code>n == length</code>) has no predecessor to rewire. The dummy gives it one, and the whole special case disappears.</li>
<li><strong>The gap is n+1, not n.</strong> You need <code>slow</code> to land on the node <em>before</em> the one being removed, because a singly linked list cannot look backwards.</li>
</ul>
<table>
<tr><th>Edge case</th><th>Behaviour</th></tr>
<tr><td>Remove the only node</td><td>Returns <code>null</code> — the dummy makes this work with no extra code</td></tr>
<tr><td>Remove the head</td><td><code>slow</code> stays on the dummy; <code>dummy.next</code> is rewired</td></tr>
<tr><td>n &gt; length</td><td><code>fast</code> goes null during the first loop — guard and return unchanged</td></tr>
<tr><td>n == 0</td><td>Ask what it should mean; usually invalid input</td></tr>
</table>
<pre><code>// Related one-pass patterns using the same fixed-gap idea
ListNode middleNode(ListNode head) {                // middle of the list
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
    return slow;      // for even length this returns the SECOND middle — ask which they want
}</code></pre>`
},
{
  q: "Add two numbers represented by linked lists",
  level: "beginner", tags: ["linked-list", "math", "interview-favourite"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Paytm", "Oracle"],
  a: `<pre><code>// Digits stored in REVERSE order: 342 + 465 is 2->4->3 plus 5->6->4 = 7->0->8
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), tail = dummy;
    int carry = 0;

    // One loop covers all three cases: both lists, one list, leftover carry.
    while (l1 != null || l2 != null || carry != 0) {
        int sum = carry;
        if (l1 != null) { sum += l1.val; l1 = l1.next; }
        if (l2 != null) { sum += l2.val; l2 = l2.next; }

        carry = sum / 10;
        tail.next = new ListNode(sum % 10);
        tail = tail.next;
    }
    return dummy.next;
}</code></pre>
<div class="cx"><b>O(max(n,m)) time</b><span>one pass</span><b>O(max(n,m)) space</b><span>the result list</span></div>
<p><strong>The three-condition loop is the elegant part.</strong> Writing separate loops for "both lists", "remaining list" and "final carry" is three times the code and the usual place bugs appear — most often forgetting the trailing carry, so <code>5 + 5</code> returns <code>0</code> instead of <code>0 → 1</code>.</p>
<pre><code>// FORWARD order (most significant digit first) — the harder variant.
// You cannot add left to right, because the carry propagates backwards.
public ListNode addTwoNumbersForward(ListNode l1, ListNode l2) {
    Deque&lt;Integer&gt; s1 = new ArrayDeque&lt;&gt;(), s2 = new ArrayDeque&lt;&gt;();
    for (ListNode n = l1; n != null; n = n.next) s1.push(n.val);
    for (ListNode n = l2; n != null; n = n.next) s2.push(n.val);

    ListNode head = null;
    int carry = 0;
    while (!s1.isEmpty() || !s2.isEmpty() || carry != 0) {
        int sum = carry;
        if (!s1.isEmpty()) sum += s1.pop();
        if (!s2.isEmpty()) sum += s2.pop();
        carry = sum / 10;
        head = new ListNode(sum % 10, head);    // PREPEND, building right to left
    }
    return head;
}
// Alternative without stacks: reverse both lists, add, reverse the result.
// Say which you would pick and why — stacks avoid mutating the inputs.</code></pre>
<table>
<tr><th>Test case</th><th>Why it matters</th></tr>
<tr><td><code>[5] + [5]</code></td><td>Result is <code>[0,1]</code> — catches a missing final carry</td></tr>
<tr><td><code>[9,9,9] + [1]</code></td><td>Cascading carry across every digit</td></tr>
<tr><td><code>[1,2,3] + [4]</code></td><td>Different lengths</td></tr>
<tr><td><code>[0] + [0]</code></td><td>Must return <code>[0]</code>, not an empty list</td></tr>
</table>
<p><strong>Why the problem exists at all:</strong> this is arbitrary-precision arithmetic — exactly what <code>BigInteger</code> does internally, and why bank balances are never stored as <code>double</code>. Mentioning that connection shows you understand the point rather than just the puzzle.</p>`
},
{
  q: "Flatten a multilevel doubly linked list and copy a list with random pointers",
  level: "advanced", tags: ["linked-list", "hashing", "recursion"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Salesforce", "Flipkart"],
  a: `<pre><code>// COPY A LIST WITH RANDOM POINTERS
// The difficulty: when you copy node X, its 'random' may point at a node you
// have not created yet. Two solutions.

// --- Approach 1: hash map, O(n) time, O(n) space. Easiest to explain. ---
public Node copyRandomList(Node head) {
    Map&lt;Node, Node&gt; clone = new HashMap&lt;&gt;();
    for (Node n = head; n != null; n = n.next) clone.put(n, new Node(n.val));
    for (Node n = head; n != null; n = n.next) {
        clone.get(n).next   = clone.get(n.next);      // null maps to null — no guards
        clone.get(n).random = clone.get(n.random);
    }
    return clone.get(head);
}</code></pre>
<pre><code>// --- Approach 2: interleave the copies, O(n) time, O(1) EXTRA space ---
public Node copyRandomListO1(Node head) {
    if (head == null) return null;

    // 1. Weave a copy in after every original:  A -> A' -> B -> B' -> ...
    for (Node n = head; n != null; n = n.next.next) {
        Node copy = new Node(n.val);
        copy.next = n.next;
        n.next = copy;
    }
    // 2. Wire the randoms — the copy of X is always X.next
    for (Node n = head; n != null; n = n.next.next) {
        if (n.random != null) n.next.random = n.random.next;
    }
    // 3. Unweave the two lists, restoring the original
    Node dummy = new Node(0), copyTail = dummy;
    for (Node n = head; n != null; n = n.next) {
        copyTail.next = n.next;
        copyTail = copyTail.next;
        n.next = n.next.next;             // restore the original list
    }
    return dummy.next;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Interleaving copied nodes to resolve random pointers in place">
  <text class="dg-s" x="16" y="20">step 1 — weave</text>
  <rect class="dg-fill" x="16" y="32" width="46" height="28" rx="6"/><text class="dg-t" x="39" y="51" text-anchor="middle">A</text>
  <rect class="dg-fill2" x="76" y="32" width="46" height="28" rx="6"/><text class="dg-t" x="99" y="51" text-anchor="middle">A'</text>
  <rect class="dg-fill" x="136" y="32" width="46" height="28" rx="6"/><text class="dg-t" x="159" y="51" text-anchor="middle">B</text>
  <rect class="dg-fill2" x="196" y="32" width="46" height="28" rx="6"/><text class="dg-t" x="219" y="51" text-anchor="middle">B'</text>
  <rect class="dg-fill" x="256" y="32" width="46" height="28" rx="6"/><text class="dg-t" x="279" y="51" text-anchor="middle">C</text>
  <rect class="dg-fill2" x="316" y="32" width="46" height="28" rx="6"/><text class="dg-t" x="339" y="51" text-anchor="middle">C'</text>
  <path class="dg-line" d="M64 46 H74 M124 46 H134 M184 46 H194 M244 46 H254 M304 46 H314" marker-end="url(#fl1)"/>
  <text class="dg-s" x="400" y="40">every copy sits directly</text>
  <text class="dg-s" x="400" y="58">after its original, so</text>
  <text class="dg-s" x="400" y="76">copy(X) is just X.next</text>
  <text class="dg-s" x="16" y="96">step 2 — A'.random = A.random.next   (no map needed)</text>
  <text class="dg-s" x="16" y="126">step 3 — unweave, restoring the original list exactly as it was</text>
  <defs><marker id="fl1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// FLATTEN A MULTILEVEL LIST — each node may have a 'child' list
public Node flatten(Node head) {
    for (Node n = head; n != null; n = n.next) {
        if (n.child == null) continue;

        Node next = n.next, childTail = n.child;
        while (childTail.next != null) childTail = childTail.next;

        n.next = n.child;                 // splice the child list in
        n.child.prev = n;
        n.child = null;                   // MUST clear it, or the result is invalid
        childTail.next = next;
        if (next != null) next.prev = childTail;
    }
    return head;
}
// Iterative and O(1) space. The recursive/stack version is equally valid
// but uses O(depth) — mention the trade-off rather than assuming one.</code></pre>
<table>
<tr><th>Point</th><th>Why it matters</th></tr>
<tr><td>Step 3 restores the original</td><td>Callers usually expect their input untouched — a mutation that survives is a real bug</td></tr>
<tr><td><code>n.child = null</code></td><td>Leaving it set means the flattened list still claims to be multilevel</td></tr>
<tr><td>The map version maps null to null</td><td>That is why it needs no null checks — worth pointing out, it is not an accident</td></tr>
</table>
<p><strong>How to present it:</strong> give the hash-map solution first — it is obviously correct and takes a minute. Then offer the interleaving version as the O(1)-space refinement. Leading with the clever one and getting a pointer wrong is a much worse outcome than shipping the simple one and improving it.</p>`
},
{
  q: "Sort a linked list in O(n log n) — why merge sort and not quicksort?",
  level: "advanced", tags: ["linked-list", "sorting", "divide-conquer"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "Goldman Sachs", "Oracle"],
  a: `<div class="cx"><b>O(n log n) time</b><span>guaranteed, not just average</span><b>O(log n) space</b><span>recursion only — no array copies</span></div>
<pre><code>public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;

    // 1. SPLIT at the middle. prev is kept so the first half can be cut.
    ListNode slow = head, fast = head, prev = null;
    while (fast != null && fast.next != null) {
        prev = slow;
        slow = slow.next;
        fast = fast.next.next;
    }
    prev.next = null;                       // cut — without this it recurses forever

    // 2. SORT each half
    ListNode left = sortList(head);
    ListNode right = sortList(slow);

    // 3. MERGE
    return merge(left, right);
}

private ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val &lt;= b.val) { tail.next = a; a = a.next; }
        else                { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}</code></pre>
<p><strong>Why merge sort is the right answer for a linked list</strong> — this comparison <em>is</em> the question:</p>
<table>
<tr><th></th><th>Array</th><th>Linked list</th></tr>
<tr><td>Random access</td><td>O(1)</td><td><strong>O(n)</strong> — quicksort's partition needs it</td></tr>
<tr><td>Merge extra space</td><td>O(n) — must allocate</td><td><strong>O(1)</strong> — just relink pointers</td></tr>
<tr><td>Quicksort worst case</td><td>O(n²) on bad pivots</td><td>O(n²), and picking a good pivot needs a traversal</td></tr>
<tr><td>Cache locality</td><td>Excellent</td><td>Poor either way — so quicksort loses its main advantage</td></tr>
<tr><td>Verdict</td><td>Quicksort (or TimSort for objects)</td><td><strong>Merge sort</strong></td></tr>
</table>
<p>So the trade-offs invert. On an array, merge sort's O(n) auxiliary space is its weakness and quicksort's in-place partition is its strength. On a list, merging costs nothing extra and partitioning is what becomes expensive.</p>
<pre><code>// Bottom-up merge sort — O(1) space, no recursion at all.
// Worth mentioning if they ask for constant space including the stack.
public ListNode sortListBottomUp(ListNode head) {
    int n = 0;
    for (ListNode p = head; p != null; p = p.next) n++;

    ListNode dummy = new ListNode(0, head);
    for (int size = 1; size &lt; n; size *= 2) {
        ListNode prev = dummy, curr = dummy.next;
        while (curr != null) {
            ListNode left = curr;
            ListNode right = split(left, size);
            curr = split(right, size);
            prev = mergeInto(prev, left, right);   // append and return the new tail
        }
    }
    return dummy.next;
}</code></pre>
<p><strong>The bugs to guard against:</strong> forgetting <code>prev.next = null</code> means the "first half" still runs to the end of the list and the recursion never terminates. And a two-node list must split into 1+1 — if your midpoint logic puts both nodes in one half, you recurse on the same list forever. Always test with lists of length 1, 2 and 3.</p>`
},
{
  q: "Detect and remove a loop, and check whether a list is a palindrome",
  level: "advanced", tags: ["linked-list", "fast-slow", "in-place"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Paytm", "Zoho", "Cognizant"],
  a: `<pre><code>// REMOVE A LOOP — find the entry with Floyd, then break the link before it
public void removeLoop(ListNode head) {
    ListNode slow = head, fast = head;
    boolean found = false;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) { found = true; break; }
    }
    if (!found) return;

    slow = head;
    if (slow == fast) {                       // loop starts at the head
        while (fast.next != slow) fast = fast.next;
    } else {
        while (slow.next != fast.next) { slow = slow.next; fast = fast.next; }
    }
    fast.next = null;                         // fast is now the loop's last node
}</code></pre>
<p>The head case needs its own branch: if the cycle begins at the head, <code>slow</code> and <code>fast</code> are already equal, so the usual "advance both until they match" loop would terminate immediately without finding the tail.</p>
<pre><code>// PALINDROME LIST — O(n) time, O(1) space
public boolean isPalindrome(ListNode head) {
    if (head == null || head.next == null) return true;

    // 1. Find the middle
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    // 2. Reverse the SECOND half
    ListNode second = reverse(slow.next);

    // 3. Compare the two halves
    ListNode p = head, q = second;
    boolean ok = true;
    while (q != null) {
        if (p.val != q.val) { ok = false; break; }
        p = p.next; q = q.next;
    }
    // 4. RESTORE the list — do not hand back a mutated input
    slow.next = reverse(second);
    return ok;
}

private ListNode reverse(ListNode head) {
    ListNode prev = null;
    while (head != null) { ListNode n = head.next; head.next = prev; prev = head; head = n; }
    return prev;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Palindrome check by reversing the second half">
  <rect class="dg-fill" x="16" y="34" width="46" height="30" rx="6"/><text class="dg-t" x="39" y="54" text-anchor="middle">1</text>
  <rect class="dg-fill" x="76" y="34" width="46" height="30" rx="6"/><text class="dg-t" x="99" y="54" text-anchor="middle">2</text>
  <rect class="dg-box" x="136" y="34" width="46" height="30" rx="6"/><text class="dg-t" x="159" y="54" text-anchor="middle">2</text>
  <rect class="dg-box" x="196" y="34" width="46" height="30" rx="6"/><text class="dg-t" x="219" y="54" text-anchor="middle">1</text>
  <path class="dg-line" d="M64 48 H74 M124 48 H134 M184 48 H194" marker-end="url(#pl1)"/>
  <text class="dg-s" x="70" y="82" text-anchor="middle">first half</text>
  <text class="dg-s" x="190" y="82" text-anchor="middle">second half, reversed</text>
  <path class="dg-line" d="M39 96 V88 M219 96 V88"/>
  <text class="dg-s" x="16" y="118">walk both inward-facing halves in step; any mismatch ends it</text>
  <text class="dg-s" x="16" y="138">then reverse the second half back, so the caller's list is unchanged</text>
  <defs><marker id="pl1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Approach</th><th>Time</th><th>Space</th></tr>
<tr><td>Copy values into an <code>ArrayList</code>, two pointers</td><td>O(n)</td><td>O(n) — perfectly fine, say it first</td></tr>
<tr><td>Push the first half onto a stack</td><td>O(n)</td><td>O(n/2)</td></tr>
<tr><td>Recursion comparing head and tail</td><td>O(n)</td><td>O(n) stack</td></tr>
<tr><td><strong>Reverse the second half in place</strong></td><td>O(n)</td><td><strong>O(1)</strong></td></tr>
</table>
<p><strong>The step candidates skip is restoration.</strong> Mutating the caller's list and leaving it reversed is a side effect nobody asked for — and in a concurrent reader it is a genuine correctness bug. Restoring costs one more reversal and is the difference between a working answer and a good one.</p>`
}
]);
