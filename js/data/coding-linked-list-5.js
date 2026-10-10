registerSimple("coding-linked-list", {
"Add two numbers represented as linked lists":
`The digits are stored in reverse order, with the ones digit first, so add them just as you would on paper: add the two digits plus any carry, keep the last digit of the result as the new node, and carry 1 if the sum is 10 or more. Continue while either list has digits left or a carry remains.`,

"Sort a linked list, and flatten a multilevel list":
`<b>Sort</b> a linked list with merge sort: split it in half with fast and slow pointers, sort each half, then merge the two sorted halves. It suits lists because it never needs to jump to a position. <b>Flatten</b> a multilevel list by walking it and, whenever a node has a child list, splicing that child list in right after the node.`,

"The fast and slow pointer family — cycles, middles, and the k-th from the end":
`Two pointers moving at different speeds solve many list problems in one pass with no extra memory. Slow moves one step and fast moves two: when fast reaches the end, slow is at the <b>middle</b>; if they ever meet, there is a <b>cycle</b>. For the <b>kth from the end</b>, move one pointer k steps ahead, then move both together.`,

"Reversal patterns: whole list, in groups of k, and between two positions":
`All are built on the same reversal loop: save next, point the current node backwards, move forward. To reverse a section, first walk to the node just before it, reverse that section, then reconnect both ends. For groups of k, repeat this on each block of k nodes. A dummy head node makes the first group no different from the others.`,

"Designing an LRU cache — and why the doubly linked list is mandatory":
`An LRU cache needs instant lookup and instant "move to most recent". A hash map finds an entry instantly; a doubly linked list keeps the usage order, with the most recent at the front. A doubly linked list is needed because removing a node from the middle requires a link to its previous node, which a singly linked list does not have.`,

"Reorder a list as first, last, second, second-last, and so on":
`Do it in three steps. First find the middle with fast and slow pointers. Then reverse the second half. Then merge the two halves by taking one node from each in turn. For 1→2→3→4→5, that gives 1→5→2→4→3, using no extra memory.`,

"Partition a list around a value, and group odd and even positions together":
`Build two separate lists as you walk the original, one for each group (smaller than the value and the rest, or odd and even positions), each starting from its own dummy node. At the end, join the first list's tail to the second list's head and set the final tail's <code>next</code> to null.`,

"Reverse a linked list — iteratively, recursively, and in groups of k":
`<b>Iteratively</b>: walk the list with prev and curr, turning each node's arrow backwards; O(n) time and no extra memory. <b>Recursively</b>: reverse the rest of the list first, then make the next node point back to the current one; this uses stack space for each node. <b>In groups of k</b>: reverse each block of k nodes and connect the blocks.`,

"Detect a cycle in a linked list and find where it begins":
`Move slow one step and fast two steps. If there is a cycle, they eventually meet inside it; if fast reaches null, there is no cycle. To find where the cycle starts, put one pointer back at the head and move both one step at a time; the node where they meet is the start of the cycle.`,

"Merge two sorted linked lists, and merge k sorted lists":
`<b>Two lists</b>: start from a dummy node, repeatedly attach the smaller of the two front nodes, and finally attach whatever remains. <b>k lists</b>: put the first node of each list into a min-heap, repeatedly take the smallest, attach it, and add its next node to the heap. That takes O(N log k) time for N total nodes.`,

"Design an LRU cache":
`Combine a hash map (key to node, for instant lookup) with a doubly linked list (usage order). On every get or put, move the node to the front. When the cache is full, remove the node at the back, which is the least recently used, and delete its key from the map. Every operation takes O(1).`,

"Find the intersection node of two linked lists":
`Start one pointer at each list's head. Move both forward one step at a time; when a pointer reaches the end, restart it at the other list's head. Both pointers then travel the same total distance, so they meet at the shared node, or both reach null together if the lists do not intersect.`,

"Remove the nth node from the end of a list":
`Start with a dummy node before the head. Move a fast pointer n steps ahead, then move fast and slow together until fast reaches the last node. Slow is now just before the node to remove, so set <code>slow.next = slow.next.next</code>. The dummy node handles the case where the head itself must be removed.`,

"Add two numbers represented by linked lists":
`Walk both lists together, adding the digits and the carry like column addition on paper. Create a new node for the last digit of each sum and carry 1 when the sum is 10 or more. Keep going while either list has nodes or a carry is left, which handles lists of different lengths and a final carry.`,

"Flatten a multilevel doubly linked list and copy a list with random pointers":
`<b>Flatten</b>: when a node has a child list, insert the whole child list between that node and its next node, fixing both forward and backward links. <b>Copy with random pointers</b>: insert each copy right after its original, set each copy's random link to the copy of the original's random node, then separate the two lists again.`,

"Sort a linked list in O(n log n) — why merge sort and not quicksort?":
`Merge sort suits linked lists: finding the middle and merging only need to follow arrows forward, and merging needs no extra arrays. Quicksort relies on jumping to positions and swapping, which linked lists cannot do cheaply, and its worst case is O(n²). Merge sort is always O(n log n).`,

"Detect and remove a loop, and check whether a list is a palindrome":
`<b>Loop</b>: find the meeting point with fast and slow pointers, find the loop's start, then walk round the loop to its last node and set its <code>next</code> to null. <b>Palindrome</b>: find the middle, reverse the second half, compare the two halves node by node, and reverse the second half back to restore the list.`
});
