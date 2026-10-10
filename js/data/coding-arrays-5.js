registerSimple("coding-arrays", {
"Longest substring without repeating characters":
`Use a sliding window: a range of characters with no repeats. Move the right edge forward one character at a time. If the new character is already inside the window, move the left edge just past its previous position. Track each character's last position in a map, and record the largest window size you see.`,

"Merge intervals, and the interval problems built on it":
`Sort the intervals by their start time. Then go through them in order: if the next interval starts before the current one ends, they overlap, so extend the current one's end; otherwise, save the current one and start a new one. Many interval problems (meeting rooms, inserting an interval) use the same "sort, then sweep" idea.`,

"Sliding window: fixed size, variable size, and how to spot which one":
`A sliding window looks at a continuous range and slides it along instead of restarting each time. <b>Fixed size</b> ("the best sum of any 3 in a row"): add the new item and remove the oldest. <b>Variable size</b> ("the longest range with no repeats"): grow the right side, and shrink the left side whenever the rule is broken. Spot it when the question asks about a continuous subarray or substring.`,

"Binary search beyond sorted arrays — search on the answer":
`Binary search works whenever you can ask a yes/no question whose answer switches from "no" to "yes" at one point and stays "yes". Example: "can we ship all parcels in D days with capacity C?" Try a middle C; if yes, try smaller, if no, try bigger. This finds the smallest working answer in a few steps without checking every value.`,

"In-place array manipulation: cyclic sort, index marking, and Dutch national flag":
`When values are within a known range, such as 1 to n, the array itself can store extra information. <b>Cyclic sort</b> swaps each value into its matching position. <b>Index marking</b> flips the sign of the number at position v to remember "v was seen". The <b>Dutch national flag</b> sorts 0s, 1s and 2s in one pass with three pointers. All use no extra memory.`,

"Count subarrays that sum to K using prefix sums and a hash map":
`Keep a running total as you go. A subarray adds up to K whenever (current total - K) equals some earlier running total. So store how many times each running total has appeared in a hash map (starting with total 0 seen once), and for each position add the count of (total - K). One pass, O(n).`,

"Find the next permutation of an array in place":
`Find the next larger arrangement of the numbers. Step 1: from the right, find the first number that is smaller than the one after it. Step 2: from the right, find the first number bigger than it and swap the two. Step 3: reverse everything after the first number's position. If there is no such number, the array is the largest arrangement, so just reverse it.`,

"Two Sum — find two numbers that add up to a target":
`Go through the array once with a hash map. For each number, check whether its partner (<code>target - number</code>) is already in the map; if so, you have found the pair. Otherwise, store the number with its index and continue. This turns an O(n²) check of every pair into one O(n) pass.`,

"Kadane's algorithm — maximum subarray sum":
`Go through the array keeping a running sum of the best subarray ending at the current position. At each number, decide: is it better to extend the previous run or start fresh from this number? Take the larger, and keep track of the best sum seen anywhere. One pass, no extra memory. If all numbers are negative, the answer is the largest single number.`,

"Move zeros to the end, and the Dutch National Flag (sort 0s, 1s and 2s)":
`<b>Move zeros</b>: keep a write position; go through the array and copy each non-zero number to the write position, then fill the rest with zeros. <b>Dutch flag</b>: use three pointers (low, mid, high). A 0 is swapped to the low end, a 2 to the high end, and a 1 stays. Do not move mid forward after swapping with high, because the swapped-in value still needs checking.`,

"Rotate an array by k positions, and rotate a matrix by 90 degrees":
`<b>Array</b>: first set k = k % n. Reverse the whole array, then reverse the first k items, then reverse the rest; this rotates in place with no extra memory. <b>Matrix</b>: to turn it 90° clockwise, swap rows and columns (transpose), then reverse each row.`,

"Longest substring without repeating characters — the sliding window template":
`The general template: move the right edge forward to include a new character; while the window breaks the rule (here, a repeated character), move the left edge forward to remove characters; then record the window size. The same template solves many "longest or shortest substring such that…" problems by changing only the rule.`,

"Product of array except self — without division":
`For each position, the answer is (product of everything to its left) × (product of everything to its right). Make one pass from the left, storing the running product before each position, then a pass from the right, multiplying in the running product after each position. No division is needed, so zeros cause no trouble.`,

"Merge two sorted arrays in place, and find the median of two sorted arrays":
`<b>Merge in place</b>: when the first array has empty space at its end, fill it from the back, always placing the larger of the two current last elements, so nothing is overwritten. <b>Median</b>: binary-search for a split of both arrays so the left halves together hold half the elements and every left value is no larger than every right value.`,

"Find the majority element and elements appearing more than n/3 times":
`<b>Boyer-Moore voting</b>: keep one candidate and a counter. A matching number adds a vote; a different one removes a vote; at zero, switch to the current number. A value appearing more than half the time always survives. For "more than n/3", keep two candidates and two counters, then confirm both with a second pass.`,

"Search in a rotated sorted array, and find the minimum in it":
`A rotated sorted array, such as [4,5,6,1,2,3], is still sorted on at least one side of any middle point. In binary search, check which half is properly sorted, then decide whether the target lies within that half, and discard the other half. To find the minimum, compare the middle with the right end to find which side contains the "drop".`,

"Set matrix zeros and spiral-order traversal":
`<b>Set zeros</b>: if a cell is 0, its whole row and column become 0. First record which rows and columns contain a zero (to save space, use the first row and column as markers), then zero them out. <b>Spiral order</b>: keep four boundaries (top, bottom, left, right), walk right, down, left and up, and shrink the boundary after each side.`,

"Merge overlapping intervals":
`Sort intervals by start. Keep the last merged interval; for each next interval, if it starts on or before the last one's end, they overlap, so extend the end to the larger of the two ends. Otherwise, add it as a new interval. Sorting takes O(n log n) and the sweep O(n).`,

"Longest consecutive sequence in an unsorted array":
`Put all numbers in a hash set. For each number, only start counting if the number just before it (x - 1) is not in the set, meaning x starts a sequence. Then count upwards (x + 1, x + 2…) while numbers exist. Each number is counted at most once, so the whole thing takes O(n), without sorting.`
});
