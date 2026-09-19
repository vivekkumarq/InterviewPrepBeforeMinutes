registerCode("linked-lists", {
intro: `<p>A linked list stores each value in its own node, with a pointer to the next. Nothing is contiguous, so there is no index arithmetic — reaching position k means walking k nodes.</p>
<table>
<tr><th>Operation</th><th>Array</th><th>Linked list</th></tr>
<tr><td>Access by index</td><td>O(1)</td><td>O(n)</td></tr>
<tr><td>Insert / delete at the front</td><td>O(n)</td><td><strong>O(1)</strong></td></tr>
<tr><td>Insert / delete given the node</td><td>O(n)</td><td><strong>O(1)</strong></td></tr>
<tr><td>Memory per element</td><td>Just the value</td><td>Value + pointer(s)</td></tr>
<tr><td>Cache behaviour</td><td>Excellent</td><td>Poor — nodes scattered</td></tr>
</table>
<p><strong>Two habits remove almost every linked-list bug:</strong></p>
<table>
<tr><td><strong>Use a dummy head node.</strong> Deleting or inserting at position 0 stops being a special case, because there is always a node before the one you are changing.</td></tr>
<tr><td><strong>Save <code>next</code> before you reassign it.</strong> Overwrite a pointer without saving it and the rest of the list is unreachable — the single most common mistake here.</td></tr>
</table>
<p>Draw three nodes on paper before coding. Every pointer bug is visible in a three-node example.</p>`,
questions: [
{
  slug: "build-a-linked-list", n: 60, title: "Build Your Own Linked List", difficulty: "easy",
  statement: `<p>Implement a singly linked list with add, insert at index, delete by value and search.</p>`,
  approaches: [
    { name: "Node class with a tail pointer", time: "varies", space: "O(n)", best: true,
      note: "Keeping a tail reference makes append O(1) instead of O(n). Keeping a size counter makes length O(1). Both are cheap and both get asked about.",
      java: `public class MyLinkedList<T> {
    private static class Node<T> {
        T value; Node<T> next;
        Node(T v) { value = v; }
    }

    private Node<T> head, tail;
    private int size;

    public void add(T value) {                 // append, O(1)
        Node<T> n = new Node<>(value);
        if (head == null) head = tail = n;
        else { tail.next = n; tail = n; }
        size++;
    }

    public void insert(int index, T value) {   // O(index)
        if (index < 0 || index > size) throw new IndexOutOfBoundsException();
        if (index == size) { add(value); return; }
        Node<T> n = new Node<>(value);
        if (index == 0) { n.next = head; head = n; }
        else {
            Node<T> prev = head;
            for (int i = 0; i < index - 1; i++) prev = prev.next;
            n.next = prev.next;
            prev.next = n;
        }
        size++;
    }

    public boolean remove(T value) {           // O(n)
        Node<T> dummy = new Node<>(null);
        dummy.next = head;
        for (Node<T> prev = dummy; prev.next != null; prev = prev.next) {
            if (!Objects.equals(prev.next.value, value)) continue;
            if (prev.next == tail) tail = (prev == dummy) ? null : prev;
            prev.next = prev.next.next;
            head = dummy.next;
            size--;
            return true;
        }
        return false;
    }

    public int size() { return size; }
}`,
      python: `class Node:
    __slots__ = ("value", "next")

    def __init__(self, value) -> None:
        self.value = value
        self.next: "Node | None" = None


class MyLinkedList:
    def __init__(self) -> None:
        self.head: Node | None = None
        self.tail: Node | None = None
        self.size = 0

    def add(self, value) -> None:              # append, O(1)
        node = Node(value)
        if self.head is None:
            self.head = self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.size += 1

    def insert(self, index: int, value) -> None:
        if not 0 <= index <= self.size:
            raise IndexError(index)
        if index == self.size:
            self.add(value)
            return
        node = Node(value)
        if index == 0:
            node.next, self.head = self.head, node
        else:
            prev = self.head
            for _ in range(index - 1):
                prev = prev.next
            node.next, prev.next = prev.next, node
        self.size += 1

    def remove(self, value) -> bool:
        dummy = Node(None)
        dummy.next = self.head
        prev = dummy
        while prev.next:
            if prev.next.value == value:
                if prev.next is self.tail:
                    self.tail = None if prev is dummy else prev
                prev.next = prev.next.next
                self.head = dummy.next
                self.size -= 1
                return True
            prev = prev.next
        return False` }
  ],
  note: `<p>Notice the tail fix-up inside <code>remove</code>. Deleting the last node leaves <code>tail</code> dangling, and the next append then writes into a detached node — a bug that shows up only later, which is what makes it nasty.</p>`
},
{
  slug: "reverse-linked-list", n: 61, title: "Reverse a Linked List", difficulty: "easy",
  statement: `<p>Reverse a singly linked list and return the new head.</p>`,
  approaches: [
    { name: "Iterative, three pointers", time: "O(n)", space: "O(1)", best: true,
      note: "Save next, flip the link, advance both pointers. The order of those four lines is the entire question.",
      java: `public static ListNode reverse(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode next = cur.next;   // 1. SAVE before destroying
        cur.next = prev;            // 2. flip
        prev = cur;                 // 3. advance prev
        cur = next;                 // 4. advance cur
    }
    return prev;                    // cur is null; prev is the new head
}`,
      python: `def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev` },
    { name: "Recursive", time: "O(n)", space: "O(n)",
      note: "Elegant, but one stack frame per node — a million-node list overflows. Python also caps recursion near 1000 by default.",
      java: `public static ListNode reverse(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode newHead = reverse(head.next);
    head.next.next = head;      // the node ahead now points back
    head.next = null;           // and this one ends the list
    return newHead;
}`,
      python: `def reverse(head):
    if head is None or head.next is None:
        return head
    new_head = reverse(head.next)
    head.next.next = head
    head.next = None
    return new_head` }
  ],
  note: `<p>Two ways to get the iterative version wrong, and only two: skip the save and you lose the rest of the list; return <code>cur</code> instead of <code>prev</code> and you return null.</p>`
},
{
  slug: "middle-of-list", n: 62, title: "Middle of a Linked List", difficulty: "easy",
  statement: `<p>Return the middle node. For an even length, return the second of the two middles.</p>`,
  approaches: [
    { name: "Count, then walk again", time: "O(n)", space: "O(1)",
      note: "Two passes: measure the length, then walk half of it.",
      java: `public static ListNode middle(ListNode head) {
    int n = 0;
    for (ListNode p = head; p != null; p = p.next) n++;
    ListNode p = head;
    for (int i = 0; i < n / 2; i++) p = p.next;
    return p;
}`,
      python: `def middle(head):
    n, p = 0, head
    while p:
        n += 1
        p = p.next
    p = head
    for _ in range(n // 2):
        p = p.next
    return p` },
    { name: "Fast and slow pointers", time: "O(n)", space: "O(1)", best: true,
      note: "Fast moves two steps per one of slow, so when fast reaches the end slow is halfway. One pass, and the basis of half the linked-list toolkit.",
      java: `public static ListNode middle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}`,
      python: `def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow` }
  ],
  note: `<p>This returns the <strong>second</strong> middle for an even length. Start <code>fast</code> at <code>head.next</code> to get the first instead — ask which is wanted, because both are "the middle".</p>`
},
{
  slug: "detect-cycle", n: 63, title: "Detect a Cycle in a Linked List", difficulty: "easy",
  statement: `<p>Determine whether the list loops, and if so return the node where the loop begins.</p>`,
  approaches: [
    { name: "Set of visited nodes", time: "O(n)", space: "O(n)",
      note: "Correct and obvious. The only cost is remembering every node.",
      java: `public static ListNode detect(ListNode head) {
    Set<ListNode> seen = new HashSet<>();
    for (ListNode p = head; p != null; p = p.next)
        if (!seen.add(p)) return p;
    return null;
}`,
      python: `def detect(head):
    seen = set()
    p = head
    while p:
        if id(p) in seen:
            return p
        seen.add(id(p))
        p = p.next
    return None` },
    { name: "Floyd's tortoise and hare", time: "O(n)", space: "O(1)", best: true,
      note: "Inside a loop the gap between the two pointers changes by exactly one each step, so it must reach zero — they cannot jump past each other. After they meet, a pointer from the head moves in step with one from the meeting point and they collide at the entry.",
      java: `public static ListNode detect(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow != fast) continue;
        ListNode p = head;                 // find where the loop starts
        while (p != slow) { p = p.next; slow = slow.next; }
        return p;
    }
    return null;
}`,
      python: `def detect(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is not fast:
            continue
        p = head
        while p is not slow:
            p, slow = p.next, slow.next
        return p
    return None` }
  ],
  note: `<p>The entry-point proof: with <em>a</em> = head to entry, <em>b</em> = entry to meeting point and <em>L</em> = loop length, fast has travelled 2(a+b) and slow a+b, and their difference is a whole number of loops. That gives a ≡ L − b, which is exactly why the two walkers meet at the entry.</p>`
},
{
  slug: "merge-two-sorted-lists", n: 64, title: "Merge Two Sorted Lists", difficulty: "easy",
  statement: `<p>Merge two sorted lists into one sorted list by relinking nodes, not copying values.</p>`,
  approaches: [
    { name: "Dummy head and a tail pointer", time: "O(m+n)", space: "O(1)", best: true,
      note: "The dummy removes the &quot;which list starts the result?&quot; special case. Attaching the leftover tail wholesale avoids walking it.",
      java: `public static ListNode merge(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else                { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;     // attach whatever is left
    return dummy.next;
}`,
      python: `def merge(a, b):
    dummy = ListNode(0)
    tail = dummy
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next` }
  ],
  note: `<p><code>&lt;=</code> rather than <code>&lt;</code> keeps the merge stable — equal values keep their original relative order, which matters when this is the merge step of a list-based merge sort.</p>`
},
{
  slug: "remove-nth-from-end", n: 65, title: "Remove the N-th Node From the End", difficulty: "medium",
  statement: `<p>Remove the n-th node counting from the end, in one pass.</p>`,
  approaches: [
    { name: "Two passes", time: "O(n)", space: "O(1)",
      note: "Measure the length, then delete at position length − n.",
      java: `// Walk once to count, then walk again to (length - n) and unlink.`,
      python: `# Walk once to count, then walk again to (length - n) and unlink.` },
    { name: "Gap of n, with a dummy head", time: "O(n)", space: "O(1)", best: true,
      note: "Open an n-node gap, then advance both until the leader falls off the end. Starting from a dummy makes removing the FIRST node just another iteration.",
      java: `public static ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode lead = dummy, trail = dummy;
    for (int i = 0; i < n; i++) lead = lead.next;   // open the gap
    while (lead.next != null) { lead = lead.next; trail = trail.next; }
    trail.next = trail.next.next;                   // unlink
    return dummy.next;
}`,
      python: `def remove_nth_from_end(head, n: int):
    dummy = ListNode(0)
    dummy.next = head
    lead = trail = dummy
    for _ in range(n):
        lead = lead.next
    while lead.next:
        lead, trail = lead.next, trail.next
    trail.next = trail.next.next
    return dummy.next` }
  ],
  note: `<p>Without the dummy, removing the head needs its own branch — and that branch is where the bug always is. Starting both pointers at the dummy makes every position uniform.</p>`
},
{
  slug: "palindrome-linked-list", n: 66, title: "Palindrome Linked List", difficulty: "easy",
  statement: `<p>Decide whether a list reads the same forwards and backwards, in O(1) space.</p>`,
  approaches: [
    { name: "Copy to an array", time: "O(n)", space: "O(n)",
      note: "Copy the values out and two-pointer the array. Perfectly fine unless O(1) space is demanded.",
      java: `public static boolean isPalindrome(ListNode head) {
    List<Integer> vals = new ArrayList<>();
    for (ListNode p = head; p != null; p = p.next) vals.add(p.val);
    for (int i = 0, j = vals.size() - 1; i < j; i++, j--)
        if (!vals.get(i).equals(vals.get(j))) return false;
    return true;
}`,
      python: `def is_palindrome(head) -> bool:
    vals = []
    p = head
    while p:
        vals.append(p.val)
        p = p.next
    return vals == vals[::-1]` },
    { name: "Find middle, reverse half, compare", time: "O(n)", space: "O(1)", best: true,
      note: "Three known techniques composed: fast/slow to the middle, reverse the second half, then walk both. Restoring the list afterwards is the mark of a careful answer.",
      java: `public static boolean isPalindrome(ListNode head) {
    if (head == null || head.next == null) return true;

    ListNode slow = head, fast = head;                 // find the middle
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }

    ListNode second = reverse(slow.next);              // reverse the back half
    boolean ok = true;
    for (ListNode a = head, b = second; b != null; a = a.next, b = b.next)
        if (a.val != b.val) { ok = false; break; }

    slow.next = reverse(second);                       // put it back
    return ok;
}`,
      python: `def is_palindrome(head) -> bool:
    if not head or not head.next:
        return True

    slow = fast = head
    while fast.next and fast.next.next:
        slow, fast = slow.next, fast.next.next

    second = reverse(slow.next)
    ok, a, b = True, head, second
    while b:
        if a.val != b.val:
            ok = False
            break
        a, b = a.next, b.next

    slow.next = reverse(second)      # restore
    return ok` }
  ],
  note: `<p>Comparing only while the <em>second</em> half is non-null handles odd lengths for free — the extra middle node has no partner and does not need one.</p>`
},
{
  slug: "intersection-of-lists", n: 67, title: "Where Two Lists Meet", difficulty: "easy",
  statement: `<p>Two lists may share a common tail. Return the first shared node, or null.</p>`,
  approaches: [
    { name: "Set of one list's nodes", time: "O(m+n)", space: "O(m)",
      note: "Store every node of the first list, then walk the second looking for a hit. Must compare identity, not value.",
      java: `public static ListNode intersection(ListNode a, ListNode b) {
    Set<ListNode> seen = new HashSet<>();
    for (ListNode p = a; p != null; p = p.next) seen.add(p);
    for (ListNode p = b; p != null; p = p.next)
        if (seen.contains(p)) return p;
    return null;
}`,
      python: `def intersection(a, b):
    seen = {id(p) for p in _walk(a)}
    for p in _walk(b):
        if id(p) in seen:
            return p
    return None

def _walk(node):
    while node:
        yield node
        node = node.next` },
    { name: "Two pointers that swap lists", time: "O(m+n)", space: "O(1)", best: true,
      note: "When a pointer hits the end, restart it at the other list's head. Both then travel exactly a+b+c and arrive at the junction together — or at null together if there is none.",
      java: `public static ListNode intersection(ListNode a, ListNode b) {
    if (a == null || b == null) return null;
    ListNode p = a, q = b;
    while (p != q) {
        p = (p == null) ? b : p.next;
        q = (q == null) ? a : q.next;
    }
    return p;                  // the junction, or null
}`,
      python: `def intersection(a, b):
    if not a or not b:
        return None
    p, q = a, b
    while p is not q:
        p = b if p is None else p.next
        q = a if q is None else q.next
    return p` }
  ],
  note: `<p>It terminates even when they never meet: both pointers become null on the same step, and <code>null == null</code> ends the loop. That is why the switch happens <em>at</em> null rather than at the last node.</p>`
},
{
  slug: "add-two-numbers", n: 68, title: "Add Two Numbers Stored in Lists", difficulty: "medium",
  statement: `<p>Each list holds a number with its digits reversed, so the ones digit comes first. Return the sum in the same form.</p>`,
  approaches: [
    { name: "Walk both, carrying", time: "O(max(m,n))", space: "O(1)*", best: true,
      note: "Reversed storage is a gift: you meet the ones digit first, which is exactly the order addition needs. The loop condition keeps going while either list remains OR a carry is outstanding. *Excluding the output.",
      java: `public static ListNode addTwoNumbers(ListNode a, ListNode b) {
    ListNode dummy = new ListNode(0), tail = dummy;
    int carry = 0;
    while (a != null || b != null || carry != 0) {
        int sum = carry;
        if (a != null) { sum += a.val; a = a.next; }
        if (b != null) { sum += b.val; b = b.next; }
        carry = sum / 10;
        tail.next = new ListNode(sum % 10);
        tail = tail.next;
    }
    return dummy.next;
}`,
      python: `def add_two_numbers(a, b):
    dummy = ListNode(0)
    tail, carry = dummy, 0
    while a or b or carry:
        total = carry
        if a:
            total += a.val
            a = a.next
        if b:
            total += b.val
            b = b.next
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit)
        tail = tail.next
    return dummy.next` }
  ],
  note: `<p><code>|| carry != 0</code> is the part people forget: 5 + 5 must produce two nodes, and without it the final carry is silently dropped.</p>
<p>If the digits are stored <strong>most significant first</strong>, either reverse both lists first or push onto two stacks and pop — that is the usual follow-up.</p>`
},
{
  slug: "doubly-linked-list", n: 69, title: "Build a Doubly Linked List", difficulty: "medium",
  statement: `<p>Implement a doubly linked list supporting O(1) insertion and removal at both ends, and O(1) removal of a known node.</p>`,
  approaches: [
    { name: "Sentinel head and tail", time: "O(1) at the ends", space: "O(n)", best: true,
      note: "Two permanent dummy nodes mean every real node always has a neighbour on both sides — so unlink is three lines with no null checks at all.",
      java: `public class DoublyLinkedList<T> {
    public static class Node<T> {
        T value; Node<T> prev, next;
        Node(T v) { value = v; }
    }

    private final Node<T> head = new Node<>(null);   // sentinels
    private final Node<T> tail = new Node<>(null);
    private int size;

    public DoublyLinkedList() { head.next = tail; tail.prev = head; }

    public Node<T> addFirst(T value) { return insertAfter(head, value); }
    public Node<T> addLast(T value)  { return insertAfter(tail.prev, value); }

    private Node<T> insertAfter(Node<T> at, T value) {
        Node<T> n = new Node<>(value);
        n.prev = at;
        n.next = at.next;
        at.next.prev = n;
        at.next = n;
        size++;
        return n;
    }

    public void remove(Node<T> n) {          // O(1) given the node
        n.prev.next = n.next;
        n.next.prev = n.prev;
        n.prev = n.next = null;              // help the collector
        size--;
    }

    public boolean isEmpty() { return size == 0; }
}`,
      python: `class DNode:
    __slots__ = ("value", "prev", "next")

    def __init__(self, value=None) -> None:
        self.value = value
        self.prev: "DNode | None" = None
        self.next: "DNode | None" = None


class DoublyLinkedList:
    def __init__(self) -> None:
        self.head, self.tail = DNode(), DNode()    # sentinels
        self.head.next, self.tail.prev = self.tail, self.head
        self.size = 0

    def _insert_after(self, at: DNode, value) -> DNode:
        node = DNode(value)
        node.prev, node.next = at, at.next
        at.next.prev = node
        at.next = node
        self.size += 1
        return node

    def add_first(self, value) -> DNode:
        return self._insert_after(self.head, value)

    def add_last(self, value) -> DNode:
        return self._insert_after(self.tail.prev, value)

    def remove(self, node: DNode) -> None:         # O(1)
        node.prev.next = node.next
        node.next.prev = node.prev
        node.prev = node.next = None
        self.size -= 1` }
  ],
  note: `<p>The sentinels are why this is worth building: without them, removing the only node, the first node or the last node are three separate branches. With them there are none.</p>`
},
{
  slug: "lru-cache", n: 70, title: "LRU Cache", difficulty: "medium",
  statement: `<p>Build a cache with a fixed capacity where both <code>get</code> and <code>put</code> are O(1), evicting the least recently used entry when full.</p>`,
  approaches: [
    { name: "Hash map plus doubly linked list", time: "O(1)", space: "O(n)", best: true,
      note: "Neither structure can do this alone: a map has no order, a list has no O(1) lookup. The map finds the node, the list reorders and evicts.",
      java: `public class LRUCache {
    private static class Node {
        int key, value; Node prev, next;
    }

    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(), tail = new Node();
    private final int capacity;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        moveToFront(n);
        return n.value;
    }

    public void put(int key, int value) {
        Node n = map.get(key);
        if (n != null) { n.value = value; moveToFront(n); return; }

        if (map.size() == capacity) {
            Node lru = tail.prev;
            unlink(lru);
            map.remove(lru.key);        // the node must carry its KEY
        }
        Node fresh = new Node();
        fresh.key = key;
        fresh.value = value;
        map.put(key, fresh);
        addFront(fresh);
    }

    private void unlink(Node n)   { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFront(Node n) {
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }
    private void moveToFront(Node n) { unlink(n); addFront(n); }
}`,
      python: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self._data: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self._data:
            return -1
        self._data.move_to_end(key)          # most recently used
        return self._data[key]

    def put(self, key: int, value: int) -> None:
        if key in self._data:
            self._data.move_to_end(key)
        elif len(self._data) == self.capacity:
            self._data.popitem(last=False)   # drop the least recent
        self._data[key] = value` }
  ],
  note: `<p>The node must store its <strong>key</strong>, not just its value: on eviction you hold the node and need the key to delete the map entry. Forgetting that is the classic bug.</p>
<p>Java has a one-liner too — <code>LinkedHashMap</code> with access order and an overridden <code>removeEldestEntry</code>. Mention it to show you know the JDK, then write the version above, because that is what is being asked.</p>`
},
{
  slug: "reverse-k-group", n: 71, title: "Reverse Nodes in Groups of K", difficulty: "hard",
  statement: `<p>Reverse the list in consecutive groups of k. A trailing group of fewer than k stays as it is.</p>`,
  approaches: [
    { name: "Group by group, with a dummy", time: "O(n)", space: "O(1)", best: true,
      note: "Check that k nodes remain, reverse exactly that span, then stitch it back. Seeding prev with the node AFTER the group joins it to the rest automatically.",
      java: `public static ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0), groupPrev = dummy;
    dummy.next = head;

    while (true) {
        ListNode kth = groupPrev;
        for (int i = 0; i < k && kth != null; i++) kth = kth.next;
        if (kth == null) break;                    // fewer than k left

        ListNode groupNext = kth.next;
        ListNode prev = groupNext, cur = groupPrev.next;
        while (cur != groupNext) {                 // reverse this span
            ListNode next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        ListNode newGroupPrev = groupPrev.next;    // old head is the new tail
        groupPrev.next = kth;
        groupPrev = newGroupPrev;
    }
    return dummy.next;
}`,
      python: `def reverse_k_group(head, k: int):
    dummy = ListNode(0)
    dummy.next = head
    group_prev = dummy

    while True:
        kth = group_prev
        for _ in range(k):
            kth = kth.next
            if kth is None:
                return dummy.next

        group_next = kth.next
        prev, cur = group_next, group_prev.next
        while cur is not group_next:
            cur.next, prev, cur = prev, cur, cur.next

        new_group_prev = group_prev.next
        group_prev.next = kth
        group_prev = new_group_prev` }
  ],
  note: `<p>Seeding <code>prev</code> with <code>groupNext</code> rather than null is the trick that makes this clean — the reversed group's tail already points at the rest of the list, so no separate re-attachment step is needed.</p>`
}
]});
