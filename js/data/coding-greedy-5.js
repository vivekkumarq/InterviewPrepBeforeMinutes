registerSimple("coding-greedy", {
"Merge k sorted lists and find the median of a data stream":
`<b>Merge k lists</b>: put the first item of each list in a min-heap, repeatedly take the smallest, and add the next item from the same list. <b>Median of a stream</b>: keep two heaps, a max-heap for the smaller half and a min-heap for the larger half, balanced so their sizes differ by at most one. The median is at the top of one or both heaps.`,

"Scheduling problems — job sequencing, minimum platforms and task assignment":
`<b>Minimum platforms</b> (or meeting rooms): sort all arrival and departure times and sweep through them, adding 1 for each arrival and subtracting 1 for each departure; the highest count is the answer. <b>Job sequencing</b> with deadlines and profits: take jobs in order of profit, each placed in the latest free slot before its deadline.`,

"How do you prove a greedy choice is correct — and when is it not?":
`Greedy is correct when the best choice now is always part of some best overall answer, and what is left afterwards is a smaller version of the same problem. Show it with an exchange argument: take any best solution and swap in the greedy choice without making it worse. If you can find a small counterexample instead, greedy is wrong and you need DP.`,

"The interval problems — merge, insert, meeting rooms, and erase overlaps":
`Most interval problems start with a sort. To <b>merge</b> or <b>insert</b>, sort by start and join overlapping intervals. To find the most non-overlapping intervals, or the fewest to <b>erase</b>, sort by end and keep each interval that starts after the last kept one ends. For <b>meeting rooms</b>, track how many meetings overlap at once with a heap of end times.`,

"Heaps and top-K: when a heap beats sorting":
`To find the top k items, keep a min-heap of size k: add each item, and if the heap grows past k, remove the smallest. What remains are the k largest. This is O(n log k) instead of O(n log n) for sorting, uses only k memory, and works even when data arrives as a stream you cannot fully store.`,

"Boats to save people: two-pointer greedy, and why pairing heaviest with lightest works":
`Sort people by weight. Use one pointer at the lightest and one at the heaviest. The heaviest person needs a boat anyway; if the lightest person fits with them, put them together, otherwise the heaviest goes alone. Pairing with the lightest is safe because if even the lightest does not fit, nobody else would.`,

"Fractional knapsack vs 0/1 knapsack: why greedy solves one and not the other":
`In <b>fractional knapsack</b>, you can take part of an item, so taking items in order of value per kilogram is always best. In <b>0/1 knapsack</b>, you must take an item whole or not at all, so the best-ratio item can waste space and block a better combination. That needs dynamic programming.`,

"When is a greedy algorithm actually correct?":
`Two things must be true: taking the locally best choice never rules out the best overall answer, and after taking it, what remains is a smaller version of the same problem. Interval scheduling by earliest end time and Huffman coding satisfy both. Coin change with unusual coins and 0/1 knapsack do not.`,

"Meeting rooms, merge intervals and the interval pattern":
`Sort the intervals first. <b>Can one person attend all meetings?</b> Sort by start and check that no meeting starts before the previous one ends. <b>How many rooms are needed?</b> Sort by start and keep a min-heap of end times: reuse a room if its meeting has ended, otherwise add a room. The heap's largest size is the answer.`,

"Top K frequent elements and the heap pattern":
`First count how often each item appears with a hash map. Then keep a min-heap of size k ordered by count: add each item, and remove the least frequent whenever the heap has more than k. Alternatively, use bucket sort: put items into buckets indexed by their count and read from the highest bucket down, which is O(n).`,

"Jump game, gas station and candy — greedy on arrays":
`<b>Jump game</b>: track the furthest position reachable so far; if you ever stand beyond it, you are stuck. <b>Gas station</b>: if total gas is at least total cost, a solution exists; whenever your tank goes negative, start again from the next station. <b>Candy</b>: one pass left to right and one right to left, each giving more candy to a higher-rated child than its neighbour.`,

"Huffman coding and building an optimal merge":
`Huffman coding gives frequent characters short codes and rare ones long codes. Put every character in a min-heap by frequency, repeatedly remove the two rarest, combine them into one node with their total frequency, and put it back. The resulting tree defines the codes. Merging the cheapest two first is provably optimal.`,

"Task scheduler and partition labels — greedy with counting":
`<b>Task scheduler</b>: the most frequent task decides the minimum time, because identical tasks must be n slots apart; build "frames" around it and fill gaps with other tasks or idle time. <b>Partition labels</b>: record each letter's last position, then extend the current part until it reaches the furthest last position of any letter inside it, and cut there.`
});
