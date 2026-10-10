registerSimple("coding-stack-queue", {
"Trapping rain water":
`Water above any bar is limited by the shorter of the tallest bar to its left and the tallest bar to its right, minus the bar's own height. Use two pointers from both ends, each remembering the tallest bar it has seen. Always move the side with the smaller maximum, because that side decides the water level. One pass, no extra memory.`,

"Implement a rate limiter and an LFU cache":
`A <b>rate limiter</b> caps requests per user, for example with a token bucket: tokens refill at a steady rate and each request uses one. An <b>LFU cache</b> removes the least frequently used item when full: keep a map from key to value and count, plus lists of keys grouped by count, so you can always find the lowest count instantly.`,

"What is a monotonic stack, and which problems collapse to it?":
`A monotonic stack is kept in increasing or decreasing order: before pushing a new item, pop every item that would break the order. When an item is popped, the new item is the first one bigger (or smaller) than it. This solves "next greater element", daily temperatures, stock span and largest rectangle in a histogram, each in O(n).`,

"Sliding window maximum — why a deque and not a heap?":
`A heap works but takes O(n log k). A deque does it in O(n): store indexes in decreasing order of value. Before adding a new element, remove smaller ones from the back, because they can never be the maximum again. Remove the front when it leaves the window. The front is always the current maximum.`,

"How do you implement a stack, a queue and a min-stack from scratch?":
`A <b>stack</b> can be an array plus a "top" index that moves up on push and down on pop. A <b>queue</b> can be a circular array with front and back indexes that wrap around. A <b>min-stack</b> also stores, with each element, the minimum value at that point, so the current minimum is always on top. In real Java code, use <code>ArrayDeque</code>.`,

"Decode a string like 3[a2[c]] using a stack":
`Read the string left to right. When you see <code>[</code>, push the current text and the repeat count onto stacks and start fresh. When you see <code>]</code>, pop them, repeat the inner text that many times, and append it to the popped text. So 3[a2[c]] becomes 3[acc], which becomes accaccacc.`,

"Find the largest rectangle in a histogram with a monotonic stack":
`For each bar, the biggest rectangle using its full height stretches left and right until it meets a shorter bar. Keep a stack of bar indexes in increasing height. When a shorter bar arrives, pop taller bars; for each popped bar, you now know both its boundaries, so calculate its rectangle's area. Each bar is pushed and popped once.`,

"Check for balanced brackets in an expression":
`Push each opening bracket onto a stack. For each closing bracket, the stack must not be empty, and the top must be the matching opening bracket; pop it. At the end, the stack must be empty. A stack fits because the most recently opened bracket must be closed first.`,

"Design a stack that returns the minimum in O(1)":
`Alongside each value, store the minimum of the stack at the moment it was pushed, either as pairs or in a second stack. The top always tells you the current minimum. When you pop, the previous minimum is automatically restored, because it is stored with the element underneath.`,

"Next greater element and the monotonic stack pattern":
`Go through the array keeping a stack of indexes that are still waiting for a bigger value. For each new number, pop every waiting index with a smaller value: the new number is their "next greater element". Then push the new index. Each index is pushed and popped once, so it is O(n) instead of O(n²).`,

"Sliding window maximum with a monotonic deque":
`Keep a deque of indexes whose values decrease from front to back. For each new element, remove indexes from the back while their values are smaller (they can never be the maximum again), then add the new index. Remove the front if it has slid out of the window. The front is the maximum of the current window.`,

"Implement a queue using stacks and a stack using queues":
`<b>Queue from two stacks</b>: push new items onto an "in" stack. To remove, if the "out" stack is empty, move everything from "in" to "out" (which reverses the order), then pop from "out". Each item moves only once, so it is fast on average. <b>Stack from a queue</b>: after adding an item, rotate all the older items behind it.`,

"Evaluate a postfix expression and convert infix to postfix":
`<b>Postfix</b> (such as <code>3 4 + 2 *</code>) puts operators after their numbers. Push numbers onto a stack; on an operator, pop two numbers, apply it, and push the result. Careful: the second number popped is the left one. To <b>convert infix to postfix</b>, output numbers straight away and use a stack for operators, respecting precedence and brackets.`,

"Implement a circular queue and a min-heap from scratch":
`A <b>circular queue</b> uses a fixed array with front and rear indexes that wrap round to 0 using <code>% capacity</code>, plus a count to tell full from empty. A <b>min-heap</b> stores a tree in an array (children of position i are 2i+1 and 2i+2); after adding, move the item up while it is smaller than its parent; after removing the top, move the last item down to restore order.`
});
