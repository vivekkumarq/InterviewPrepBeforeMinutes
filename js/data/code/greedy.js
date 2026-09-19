registerCode("greedy", {
intro: `<p>A greedy algorithm takes the best-looking option right now and never reconsiders. It is the fastest approach when it works — and silently wrong when it does not, which is why every greedy answer needs a justification.</p>
<table>
<tr><th>Property</th><th>Meaning</th></tr>
<tr><td><strong>Greedy choice property</strong></td><td>Some optimal solution contains the greedy choice, so taking it costs nothing</td></tr>
<tr><td><strong>Optimal substructure</strong></td><td>After that choice, what remains is the same problem, smaller</td></tr>
</table>
<p><strong>Greedy or DP?</strong> Try to build a small counterexample. Coins [1, 3, 4] making 6: greedy takes 4+1+1 for three coins, optimal is 3+3 for two. Found one, greedy is dead — use DP. Fail to find one in a minute and state the exchange argument instead.</p>
<p><strong>The exchange argument</strong> is the proof interviewers want, and it is three lines: take any optimal solution, show that swapping its first choice for the greedy one keeps it valid and no worse, conclude that an optimal solution containing the greedy choice exists, then induct on the rest.</p>
<p><strong>The sort key is usually the whole algorithm.</strong> Sort by end time for activity selection; by start for merging; by ratio for fractional knapsack; by deadline for scheduling. Picking the wrong key gives a confident wrong answer.</p>`,
questions: [
{
  slug: "meeting-rooms-greedy", n: 97, title: "Most Meetings in One Room", difficulty: "medium",
  statement: `<p>Given meetings with start and end times, schedule the maximum number in a single room.</p>`,
  approaches: [
    { name: "Sort by start time", time: "O(n log n)", space: "O(1)",
      note: "Intuitive and WRONG. One long meeting starting first blocks several short ones — it wins the sort but loses the count.",
      java: `// Sorting by start picks a meeting that begins early even if it runs all day,
// blocking everything behind it. Produces a valid schedule, not a maximal one.`,
      python: `# Sorting by start picks a meeting that begins early even if it runs all day,
# blocking everything behind it. Produces a valid schedule, not a maximal one.` },
    { name: "Sort by end time", time: "O(n log n)", space: "O(1)", best: true,
      note: "Finishing earliest leaves the most room for everything after it. This is classic activity selection, and the exchange argument proves it optimal.",
      java: `public static int maxMeetings(int[][] meetings) {
    Arrays.sort(meetings, (a, b) -> Integer.compare(a[1], b[1]));  // by END
    int count = 0, lastEnd = Integer.MIN_VALUE;
    for (int[] m : meetings) {
        if (m[0] >= lastEnd) {          // starts after the previous finished
            count++;
            lastEnd = m[1];
        }
    }
    return count;
}`,
      python: `def max_meetings(meetings: list[list[int]]) -> int:
    meetings = sorted(meetings, key=lambda m: m[1])     # by END
    count, last_end = 0, float("-inf")
    for start, end in meetings:
        if start >= last_end:
            count += 1
            last_end = end
    return count` }
  ],
  note: `<p><strong>The proof, in three lines:</strong> let g be the earliest-finishing meeting and OPT any optimal schedule. If OPT omits g, swap its first meeting for g — since g finishes no later, everything after still fits. The swapped schedule is the same size and contains g, so an optimal solution containing the greedy choice exists.</p>
<p><strong>Ask about boundaries:</strong> does a meeting ending at 10:00 conflict with one starting at 10:00? That decides <code>&gt;=</code> versus <code>&gt;</code>, and it changes the answer.</p>`
},
{
  slug: "jump-game", n: 98, title: "Jump Game", difficulty: "medium",
  statement: `<p>Each value is the maximum jump length from that index. Starting at 0, can you reach the last index?</p>`,
  approaches: [
    { name: "Dynamic programming", time: "O(n²)", space: "O(n)",
      note: "Mark each index reachable if some earlier reachable index can jump to it. Correct, and unnecessary here.",
      java: `public static boolean canJump(int[] a) {
    boolean[] reachable = new boolean[a.length];
    reachable[0] = true;
    for (int i = 0; i < a.length; i++) {
        if (!reachable[i]) continue;
        for (int j = 1; j <= a[i] && i + j < a.length; j++)
            reachable[i + j] = true;
    }
    return reachable[a.length - 1];
}`,
      python: `def can_jump(a: list[int]) -> bool:
    reachable = [False] * len(a)
    reachable[0] = True
    for i in range(len(a)):
        if not reachable[i]:
            continue
        for j in range(1, a[i] + 1):
            if i + j < len(a):
                reachable[i + j] = True
    return reachable[-1]` },
    { name: "Track the furthest reach", time: "O(n)", space: "O(1)", best: true,
      note: "Only the furthest index reachable so far matters — not which path got there. If the loop reaches an index beyond that, no jump can bridge the gap.",
      java: `public static boolean canJump(int[] a) {
    int furthest = 0;
    for (int i = 0; i < a.length; i++) {
        if (i > furthest) return false;            // a gap we cannot cross
        furthest = Math.max(furthest, i + a[i]);
        if (furthest >= a.length - 1) return true; // early exit
    }
    return true;
}`,
      python: `def can_jump(a: list[int]) -> bool:
    furthest = 0
    for i, jump in enumerate(a):
        if i > furthest:
            return False
        furthest = max(furthest, i + jump)
        if furthest >= len(a) - 1:
            return True
    return True` }
  ],
  note: `<p>The greedy works because reachability is <strong>monotone</strong> — if you can reach index i you can reach everything before it, so the single furthest value summarises the entire history.</p>
<p><strong>Jump Game II</strong>, the minimum number of jumps, is the same scan with a level counter: track the end of the current jump's range and increment when you cross it. That is BFS in disguise.</p>`
},
{
  slug: "fractional-knapsack", n: 99, title: "Fractional Knapsack", difficulty: "medium",
  statement: `<p>Fill a bag of capacity W to maximise value. Items may be broken into fractions.</p>`,
  approaches: [
    { name: "Sort by value-to-weight ratio", time: "O(n log n)", space: "O(1)", best: true,
      note: "Take the densest value per kilo first, and split the last item to fill exactly. Divisibility is what makes greedy exact here.",
      java: `public static double maxValue(int[][] items, int capacity) {
    // items[i] = {value, weight}; densest first
    Arrays.sort(items, (a, b) ->
        Double.compare((double) b[0] / b[1], (double) a[0] / a[1]));

    double total = 0;
    int remaining = capacity;
    for (int[] item : items) {
        if (remaining == 0) break;
        if (item[1] <= remaining) {          // whole item fits
            total += item[0];
            remaining -= item[1];
        } else {                             // take the fraction that fits
            total += (double) item[0] * remaining / item[1];
            remaining = 0;
        }
    }
    return total;
}`,
      python: `def max_value(items: list[tuple[int, int]], capacity: int) -> float:
    # items are (value, weight); densest first
    items = sorted(items, key=lambda it: it[0] / it[1], reverse=True)

    total, remaining = 0.0, capacity
    for value, weight in items:
        if remaining == 0:
            break
        if weight <= remaining:
            total += value
            remaining -= weight
        else:
            total += value * remaining / weight
            remaining = 0
    return total` }
  ],
  note: `<p><strong>0/1 knapsack is NOT greedy.</strong> When items are indivisible, a high-ratio item can occupy space that two lower-ratio items would have filled more valuably. That version needs DP, and the difference between the two is the point of asking this one.</p>`
},
{
  slug: "gas-station", n: 100, title: "Gas Station", difficulty: "medium",
  statement: `<p>Stations in a circle each hold some fuel and cost some to reach the next. Find the starting station that completes the loop, or −1.</p>`,
  approaches: [
    { name: "Try every start", time: "O(n²)", space: "O(1)",
      note: "Simulate the full circuit from each station.",
      java: `public static int canComplete(int[] gas, int[] cost) {
    int n = gas.length;
    for (int start = 0; start < n; start++) {
        int tank = 0, steps = 0;
        while (steps < n) {
            int i = (start + steps) % n;
            tank += gas[i] - cost[i];
            if (tank < 0) break;
            steps++;
        }
        if (steps == n) return start;
    }
    return -1;
}`,
      python: `def can_complete(gas: list[int], cost: list[int]) -> int:
    n = len(gas)
    for start in range(n):
        tank, steps = 0, 0
        while steps < n:
            i = (start + steps) % n
            tank += gas[i] - cost[i]
            if tank < 0:
                break
            steps += 1
        if steps == n:
            return start
    return -1` },
    { name: "One pass with a reset", time: "O(n)", space: "O(1)", best: true,
      note: "Two facts do all the work. If total gas is at least total cost, a solution exists. And if the tank goes negative at station i, no station between the current start and i can work either — so jump the start to i+1.",
      java: `public static int canComplete(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.length; i++) {
        int diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) {          // cannot reach i from the current start
            start = i + 1;       // nor from anything in between
            tank = 0;
        }
    }
    return total >= 0 ? start : -1;
}`,
      python: `def can_complete(gas: list[int], cost: list[int]) -> int:
    total = tank = start = 0
    for i, (g, c) in enumerate(zip(gas, cost)):
        diff = g - c
        total += diff
        tank += diff
        if tank < 0:
            start = i + 1
            tank = 0
    return start if total >= 0 else -1` }
  ],
  note: `<p><strong>Why skipping the whole prefix is safe:</strong> if the tank ran dry at i starting from s, then every station between s and i was reached with a non-negative tank — so starting from any of them gives you no more fuel at i than you already had. All of them fail too.</p>
<p>And the existence check is separate from the search: <code>total &gt;= 0</code> decides <em>whether</em> an answer exists, the scan decides <em>where</em> it is.</p>`
}
]});
