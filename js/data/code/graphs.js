registerCode("graphs", {
intro: `<p>A graph is nodes joined by edges. Almost every graph question reduces to picking the right traversal, so learn the selection table before the algorithms.</p>
<table>
<tr><th>Algorithm</th><th>Use when</th><th>Time</th><th>Breaks on</th></tr>
<tr><td><strong>BFS</strong></td><td>Shortest path, <strong>unweighted</strong></td><td>O(V+E)</td><td>Weighted edges</td></tr>
<tr><td><strong>DFS</strong></td><td>Connectivity, cycles, topological order</td><td>O(V+E)</td><td>Shortest path — it finds <em>a</em> path</td></tr>
<tr><td><strong>Dijkstra</strong></td><td>Shortest path, <strong>non-negative</strong> weights</td><td>O((V+E) log V)</td><td><strong>Negative edges</strong></td></tr>
<tr><td><strong>Bellman–Ford</strong></td><td>Negative edges; detecting negative cycles</td><td>O(V·E)</td><td>Just slow</td></tr>
<tr><td><strong>Floyd–Warshall</strong></td><td><strong>All</strong> pairs, dense, small V</td><td>O(V³)</td><td>V beyond a few hundred</td></tr>
<tr><td><strong>Union-Find</strong></td><td>"Same component?", edges arriving online</td><td>≈O(1) amortised</td><td>Cannot undo a union</td></tr>
<tr><td><strong>Topological sort</strong></td><td>Dependency ordering on a DAG</td><td>O(V+E)</td><td>Any cycle — which is the detection signal</td></tr>
</table>
<p><strong>Representation matters:</strong> adjacency list is O(V+E) space and O(degree) to iterate a node's neighbours; a matrix is O(V²) space and O(V) to iterate, even for an isolated node. Real graphs are sparse, so the list nearly always wins.</p>
<p><strong>The tell for an implicit graph:</strong> "shortest number of steps", "can you reach", "in how many moves". Word ladder, open the lock, sliding puzzle and course schedule are all graphs that never use the word.</p>`,
questions: [
{
  slug: "bfs", n: 112, title: "Breadth-First Search (BFS)", difficulty: "easy",
  statement: `<p>Visit every reachable node in order of distance from the start.</p>`,
  approaches: [
    { name: "Queue, marking on enqueue", time: "O(V+E)", space: "O(V)", best: true,
      note: "Mark visited when you ENQUEUE, not when you dequeue. Marking on dequeue lets a node be queued several times before it is first processed.",
      java: `public static List<Integer> bfs(List<List<Integer>> adj, int start) {
    List<Integer> order = new ArrayList<>();
    boolean[] seen = new boolean[adj.size()];
    Deque<Integer> queue = new ArrayDeque<>();

    queue.offer(start);
    seen[start] = true;                     // mark on ENQUEUE
    while (!queue.isEmpty()) {
        int u = queue.poll();
        order.add(u);
        for (int v : adj.get(u))
            if (!seen[v]) { seen[v] = true; queue.offer(v); }
    }
    return order;
}`,
      python: `from collections import deque

def bfs(adj: list[list[int]], start: int) -> list[int]:
    order, seen = [], [False] * len(adj)
    queue = deque([start])
    seen[start] = True
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in adj[u]:
            if not seen[v]:
                seen[v] = True
                queue.append(v)
    return order` },
    { name: "Level by level", time: "O(V+E)", space: "O(V)",
      note: "Freezing the queue size at the top of each round gives you distance for free. Every level-based problem depends on that one line.",
      java: `public static int shortestHops(List<List<Integer>> adj, int start, int goal) {
    boolean[] seen = new boolean[adj.size()];
    Deque<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    seen[start] = true;

    int distance = 0;
    while (!queue.isEmpty()) {
        int levelSize = queue.size();            // SNAPSHOT this level
        for (int i = 0; i < levelSize; i++) {
            int u = queue.poll();
            if (u == goal) return distance;
            for (int v : adj.get(u))
                if (!seen[v]) { seen[v] = true; queue.offer(v); }
        }
        distance++;
    }
    return -1;
}`,
      python: `from collections import deque

def shortest_hops(adj: list[list[int]], start: int, goal: int) -> int:
    seen = [False] * len(adj)
    queue = deque([start])
    seen[start] = True
    distance = 0
    while queue:
        for _ in range(len(queue)):          # snapshot this level
            u = queue.popleft()
            if u == goal:
                return distance
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    queue.append(v)
        distance += 1
    return -1` }
  ],
  note: `<p>BFS finds the shortest path only on an <strong>unweighted</strong> graph, because every edge costs the same. Add weights and the first arrival is no longer the cheapest — that is where Dijkstra begins.</p>`
},
{
  slug: "dfs", n: 113, title: "Depth-First Search (DFS)", difficulty: "easy",
  statement: `<p>Explore as deep as possible before backtracking.</p>`,
  approaches: [
    { name: "Recursive", time: "O(V+E)", space: "O(V)", best: true,
      note: "Natural and short. The risk is stack depth: a path of a million nodes overflows.",
      java: `public static void dfs(List<List<Integer>> adj, int u,
                       boolean[] seen, List<Integer> order) {
    seen[u] = true;
    order.add(u);
    for (int v : adj.get(u))
        if (!seen[v]) dfs(adj, v, seen, order);
}`,
      python: `import sys

def dfs(adj: list[list[int]], u: int, seen: list[bool], order: list[int]) -> None:
    seen[u] = True
    order.append(u)
    for v in adj[u]:
        if not seen[v]:
            dfs(adj, v, seen, order)

# sys.setrecursionlimit(10**6) for deep graphs, or use the iterative form` },
    { name: "Iterative with an explicit stack", time: "O(V+E)", space: "O(V)",
      note: "Same traversal, no stack-overflow ceiling. Mark on POP here, not on push, or a node pushed twice is visited twice.",
      java: `public static List<Integer> dfs(List<List<Integer>> adj, int start) {
    List<Integer> order = new ArrayList<>();
    boolean[] seen = new boolean[adj.size()];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);

    while (!stack.isEmpty()) {
        int u = stack.pop();
        if (seen[u]) continue;               // mark on POP
        seen[u] = true;
        order.add(u);
        for (int v : adj.get(u))
            if (!seen[v]) stack.push(v);
    }
    return order;
}`,
      python: `def dfs(adj: list[list[int]], start: int) -> list[int]:
    order, seen = [], [False] * len(adj)
    stack = [start]
    while stack:
        u = stack.pop()
        if seen[u]:
            continue
        seen[u] = True
        order.append(u)
        for v in adj[u]:
            if not seen[v]:
                stack.append(v)
    return order` }
  ],
  note: `<p>The marking rule differs between the two, and it is not arbitrary: BFS marks on enqueue to avoid duplicate queue entries; iterative DFS marks on pop because a node may legitimately be pushed several times before it is first processed.</p>`
},
{
  slug: "shortest-path-unweighted", n: 114, title: "Shortest Path (Fewest Edges)", difficulty: "medium",
  statement: `<p>Find the shortest route between two nodes in an unweighted graph, and return the path itself.</p>`,
  approaches: [
    { name: "BFS with a parent map", time: "O(V+E)", space: "O(V)", best: true,
      note: "Record who discovered each node, then walk the parents back from the goal and reverse. DFS cannot do this — it finds a path, not the shortest one.",
      java: `public static List<Integer> shortestPath(List<List<Integer>> adj,
                                         int start, int goal) {
    int[] parent = new int[adj.size()];
    Arrays.fill(parent, -1);
    parent[start] = start;

    Deque<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    while (!queue.isEmpty()) {
        int u = queue.poll();
        if (u == goal) break;
        for (int v : adj.get(u))
            if (parent[v] == -1) { parent[v] = u; queue.offer(v); }
    }
    if (parent[goal] == -1) return List.of();       // unreachable

    LinkedList<Integer> path = new LinkedList<>();
    for (int at = goal; at != start; at = parent[at]) path.addFirst(at);
    path.addFirst(start);
    return path;
}`,
      python: `from collections import deque

def shortest_path(adj: list[list[int]], start: int, goal: int) -> list[int]:
    parent = {start: start}
    queue = deque([start])
    while queue:
        u = queue.popleft()
        if u == goal:
            break
        for v in adj[u]:
            if v not in parent:
                parent[v] = u
                queue.append(v)

    if goal not in parent:
        return []
    path, at = [], goal
    while at != start:
        path.append(at)
        at = parent[at]
    path.append(start)
    return path[::-1]` }
  ],
  note: `<p>Using the parent array as the visited marker kills two birds: <code>parent[v] == -1</code> means both "unvisited" and "no route recorded yet".</p>
<p>When edge weights are only 0 and 1, use <strong>0-1 BFS</strong>: a deque, pushing 0-weight edges to the front and 1-weight to the back. Still O(V+E), and it is the variant almost nobody mentions.</p>`
},
{
  slug: "number-of-islands", n: 115, title: "Number of Islands", difficulty: "medium",
  statement: `<p>Count connected groups of land cells in a grid of '1' and '0'.</p>`,
  approaches: [
    { name: "Flood fill each unvisited land cell", time: "O(m·n)", space: "O(m·n)", best: true,
      note: "Scan the grid; every time you meet unvisited land, that is a new island — sink the whole thing so it is never counted again. The answer is how many times you STARTED a fill.",
      java: `public static int numIslands(char[][] grid) {
    int count = 0;
    for (int r = 0; r < grid.length; r++)
        for (int c = 0; c < grid[0].length; c++)
            if (grid[r][c] == '1') { count++; sink(grid, r, c); }
    return count;
}

private static void sink(char[][] g, int r, int c) {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1')
        return;
    g[r][c] = '0';                    // mark BEFORE recursing
    sink(g, r + 1, c); sink(g, r - 1, c);
    sink(g, r, c + 1); sink(g, r, c - 1);
}`,
      python: `def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])

    def sink(r: int, c: int) -> None:
        if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        sink(r + 1, c); sink(r - 1, c)
        sink(r, c + 1); sink(r, c - 1)

    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count` },
    { name: "Iterative BFS", time: "O(m·n)", space: "O(min(m,n))",
      note: "Same idea with a queue. On a 1000x1000 all-land grid the recursive version recurses a million frames deep and throws StackOverflowError; this one does not.",
      java: `private static void sink(char[][] g, int sr, int sc) {
    Deque<int[]> queue = new ArrayDeque<>();
    queue.offer(new int[]{sr, sc});
    g[sr][sc] = '0';
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        for (int[] d : dirs) {
            int r = cell[0] + d[0], c = cell[1] + d[1];
            if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) continue;
            if (g[r][c] != '1') continue;
            g[r][c] = '0';
            queue.offer(new int[]{r, c});
        }
    }
}`,
      python: `from collections import deque

def sink(grid: list[list[str]], sr: int, sc: int) -> None:
    rows, cols = len(grid), len(grid[0])
    queue = deque([(sr, sc)])
    grid[sr][sc] = "0"
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                grid[nr][nc] = "0"
                queue.append((nr, nc))` }
  ],
  note: `<p>Mutating the grid saves the visited array, but it destroys the caller's input. Say "I'm assuming I may modify the grid" — that sentence turns a shortcut into a stated trade-off.</p>`
},
{
  slug: "rotting-oranges", n: 116, title: "Rotting Oranges", difficulty: "medium",
  statement: `<p>Rotten oranges infect their four neighbours each minute. Return the minutes until none are fresh, or −1 if some never rot.</p>`,
  approaches: [
    { name: "Multi-source BFS", time: "O(m·n)", space: "O(m·n)", best: true,
      note: "Seed the queue with EVERY rotten orange at once, then one BFS gives each cell its distance to the nearest source. Running one BFS per source would be far slower.",
      java: `public static int orangesRotting(int[][] grid) {
    Deque<int[]> queue = new ArrayDeque<>();
    int fresh = 0;
    for (int r = 0; r < grid.length; r++)
        for (int c = 0; c < grid[0].length; c++) {
            if (grid[r][c] == 2) queue.offer(new int[]{r, c});   // ALL sources
            else if (grid[r][c] == 1) fresh++;
        }
    if (fresh == 0) return 0;

    int minutes = 0;
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    while (!queue.isEmpty() && fresh > 0) {
        int levelSize = queue.size();                  // one minute per level
        for (int i = 0; i < levelSize; i++) {
            int[] cell = queue.poll();
            for (int[] d : dirs) {
                int r = cell[0] + d[0], c = cell[1] + d[1];
                if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length)
                    continue;
                if (grid[r][c] != 1) continue;
                grid[r][c] = 2;
                fresh--;
                queue.offer(new int[]{r, c});
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}`,
      python: `from collections import deque

def oranges_rotting(grid: list[list[int]]) -> int:
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    if fresh == 0:
        return 0

    minutes = 0
    while queue and fresh:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1` }
  ],
  note: `<p>Two edge cases decide the score: a grid with <strong>no fresh oranges</strong> returns 0, not −1; and a fresh orange walled off from every rotten one returns −1. The <code>fresh</code> counter handles both without a second scan.</p>`
},
{
  slug: "detect-cycle-directed", n: 117, title: "Detect a Cycle in a Directed Graph", difficulty: "medium",
  statement: `<p>Decide whether a directed graph contains a cycle.</p>`,
  approaches: [
    { name: "Three-colour DFS", time: "O(V+E)", space: "O(V)", best: true,
      note: "WHITE unvisited, GREY on the current recursion stack, BLACK finished. An edge to a GREY node is a back edge, which means a cycle. A plain visited boolean is WRONG here — it also flags cross edges, which are harmless.",
      java: `private static final int WHITE = 0, GREY = 1, BLACK = 2;

public static boolean hasCycle(List<List<Integer>> adj) {
    int[] colour = new int[adj.size()];
    for (int u = 0; u < adj.size(); u++)
        if (colour[u] == WHITE && dfs(adj, u, colour)) return true;
    return false;
}

private static boolean dfs(List<List<Integer>> adj, int u, int[] colour) {
    colour[u] = GREY;                       // on the current path
    for (int v : adj.get(u)) {
        if (colour[v] == GREY) return true; // back edge -> cycle
        if (colour[v] == WHITE && dfs(adj, v, colour)) return true;
    }
    colour[u] = BLACK;                      // done with this subtree
    return false;
}`,
      python: `WHITE, GREY, BLACK = 0, 1, 2

def has_cycle(adj: list[list[int]]) -> bool:
    colour = [WHITE] * len(adj)

    def dfs(u: int) -> bool:
        colour[u] = GREY
        for v in adj[u]:
            if colour[v] == GREY:
                return True
            if colour[v] == WHITE and dfs(v):
                return True
        colour[u] = BLACK
        return False

    return any(colour[u] == WHITE and dfs(u) for u in range(len(adj)))` },
    { name: "Kahn's algorithm", time: "O(V+E)", space: "O(V)",
      note: "Repeatedly remove nodes with no incoming edges. If fewer than V come out, the leftovers form a cycle. Gives you a topological order at the same time.",
      java: `public static boolean hasCycle(List<List<Integer>> adj) {
    int n = adj.size();
    int[] indegree = new int[n];
    for (List<Integer> edges : adj) for (int v : edges) indegree[v]++;

    Deque<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (indegree[i] == 0) queue.offer(i);

    int removed = 0;
    while (!queue.isEmpty()) {
        int u = queue.poll();
        removed++;
        for (int v : adj.get(u)) if (--indegree[v] == 0) queue.offer(v);
    }
    return removed != n;              // leftovers mean a cycle
}`,
      python: `from collections import deque

def has_cycle(adj: list[list[int]]) -> bool:
    n = len(adj)
    indegree = [0] * n
    for edges in adj:
        for v in edges:
            indegree[v] += 1

    queue = deque(i for i in range(n) if indegree[i] == 0)
    removed = 0
    while queue:
        u = queue.popleft()
        removed += 1
        for v in adj[u]:
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    return removed != n` }
  ],
  note: `<p><strong>Undirected graphs are different:</strong> there, a cycle is a visited neighbour that is <em>not</em> the parent you came from. Applying the directed rule to an undirected graph reports a cycle for every single edge.</p>`
},
{
  slug: "course-schedule", n: 118, title: "Course Schedule (Topological Sort)", difficulty: "medium",
  statement: `<p>Given courses and prerequisite pairs, return a valid order to take them all, or report that none exists.</p>`,
  approaches: [
    { name: "Kahn's algorithm", time: "O(V+E)", space: "O(V)", best: true,
      note: "Take any course with no unmet prerequisites, then decrement its dependents. If the output is shorter than the course count, a cycle blocked the rest.",
      java: `public static int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
    int[] indegree = new int[numCourses];
    for (int[] p : prerequisites) {        // p = {course, mustComeFirst}
        adj.get(p[1]).add(p[0]);
        indegree[p[0]]++;
    }

    Deque<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < numCourses; i++)
        if (indegree[i] == 0) queue.offer(i);

    int[] order = new int[numCourses];
    int filled = 0;
    while (!queue.isEmpty()) {
        int u = queue.poll();
        order[filled++] = u;
        for (int v : adj.get(u))
            if (--indegree[v] == 0) queue.offer(v);
    }
    return filled == numCourses ? order : new int[0];   // empty = impossible
}`,
      python: `from collections import deque

def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    adj: list[list[int]] = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, must_come_first in prerequisites:
        adj[must_come_first].append(course)
        indegree[course] += 1

    queue = deque(i for i in range(num_courses) if indegree[i] == 0)
    order: list[int] = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in adj[u]:
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    return order if len(order) == num_courses else []` }
  ],
  note: `<p>Get the edge direction right: a prerequisite points <em>towards</em> the course that needs it. Reversing it produces a perfectly valid-looking order that is exactly backwards.</p>
<p>This is the algorithm behind build systems, Maven dependency resolution and database migration ordering.</p>`
},
{
  slug: "is-bipartite", n: 119, title: "Is the Graph Bipartite?", difficulty: "medium",
  statement: `<p>Can the nodes be split into two groups so that every edge joins the two groups?</p>`,
  approaches: [
    { name: "Two-colour BFS", time: "O(V+E)", space: "O(V)", best: true,
      note: "Colour each node the opposite of its neighbour. A conflict means an odd-length cycle, which is exactly what makes a graph non-bipartite. The outer loop over every start node handles disconnected components.",
      java: `public static boolean isBipartite(List<List<Integer>> adj) {
    int[] colour = new int[adj.size()];          // 0 unvisited, 1 and -1 sides
    for (int start = 0; start < adj.size(); start++) {
        if (colour[start] != 0) continue;        // handles DISCONNECTED parts
        Deque<Integer> queue = new ArrayDeque<>();
        queue.offer(start);
        colour[start] = 1;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            for (int v : adj.get(u)) {
                if (colour[v] == colour[u]) return false;   // same side: clash
                if (colour[v] == 0) {
                    colour[v] = -colour[u];
                    queue.offer(v);
                }
            }
        }
    }
    return true;
}`,
      python: `from collections import deque

def is_bipartite(adj: list[list[int]]) -> bool:
    colour = [0] * len(adj)
    for start in range(len(adj)):
        if colour[start]:
            continue
        queue = deque([start])
        colour[start] = 1
        while queue:
            u = queue.popleft()
            for v in adj[u]:
                if colour[v] == colour[u]:
                    return False
                if colour[v] == 0:
                    colour[v] = -colour[u]
                    queue.append(v)
    return True` }
  ],
  note: `<p>The outer loop is the line people forget. A graph can be bipartite in one component and not in another, and a single BFS from node 0 never sees the rest.</p>`
},
{
  slug: "dijkstra", n: 120, title: "Dijkstra's Shortest Paths", difficulty: "hard",
  statement: `<p>Find the shortest distance from a source to every node, with non-negative edge weights.</p>`,
  approaches: [
    { name: "Priority queue with stale-entry skipping", time: "O((V+E) log V)", space: "O(V)", best: true,
      note: "Always expand the closest unsettled node. The JDK heap has no decrease-key, so push duplicates and skip the stale ones on pop — that guard replaces decrease-key entirely.",
      java: `public static int[] dijkstra(List<List<int[]>> adj, int src) {
    int[] dist = new int[adj.size()];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // {node, distance}, smallest distance first
    PriorityQueue<int[]> pq =
        new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
    pq.offer(new int[]{src, 0});

    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        if (cur[1] > dist[cur[0]]) continue;        // STALE entry, skip it
        for (int[] edge : adj.get(cur[0])) {        // edge = {neighbour, weight}
            int nd = cur[1] + edge[1];
            if (nd < dist[edge[0]]) {
                dist[edge[0]] = nd;
                pq.offer(new int[]{edge[0], nd});
            }
        }
    }
    return dist;
}`,
      python: `import heapq

def dijkstra(adj: list[list[tuple[int, int]]], src: int) -> list[float]:
    dist = [float("inf")] * len(adj)
    dist[src] = 0
    pq = [(0, src)]                       # (distance, node)

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:                   # stale
            continue
        for v, weight in adj[u]:
            nd = d + weight
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist` }
  ],
  note: `<p><strong>Why negative edges break it:</strong> Dijkstra assumes that once a node is popped its distance is final. A negative edge can improve a node <em>after</em> it has been settled, which violates that assumption outright.</p>
<p>Marking visited on <em>push</em> rather than on <em>pop</em> is a subtler version of the same mistake, and it produces wrong distances rather than an error.</p>`
},
{
  slug: "bellman-ford", n: 121, title: "Bellman–Ford (Negative Costs)", difficulty: "hard",
  statement: `<p>Shortest paths from a source when edges may be negative, and detect negative cycles.</p>`,
  approaches: [
    { name: "Relax every edge V−1 times", time: "O(V·E)", space: "O(V)", best: true,
      note: "A shortest path uses at most V−1 edges, so V−1 rounds of relaxing every edge settles everything. A further improvement on round V proves a negative cycle exists.",
      java: `public static int[] bellmanFord(int n, int[][] edges, int src) {
    long[] dist = new long[n];
    Arrays.fill(dist, Long.MAX_VALUE / 4);      // /4 leaves room to add
    dist[src] = 0;

    for (int round = 0; round < n - 1; round++) {
        boolean changed = false;
        for (int[] e : edges) {                 // e = {from, to, weight}
            if (dist[e[0]] + e[2] < dist[e[1]]) {
                dist[e[1]] = dist[e[0]] + e[2];
                changed = true;
            }
        }
        if (!changed) break;                    // settled early
    }

    for (int[] e : edges)                       // one more round
        if (dist[e[0]] + e[2] < dist[e[1]])
            throw new IllegalStateException("negative cycle");

    int[] out = new int[n];
    for (int i = 0; i < n; i++) out[i] = (int) dist[i];
    return out;
}`,
      python: `def bellman_ford(n: int, edges: list[tuple[int, int, int]], src: int) -> list[float]:
    dist = [float("inf")] * n
    dist[src] = 0

    for _ in range(n - 1):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break

    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            raise ValueError("negative cycle")
    return dist` }
  ],
  note: `<p>Using <code>Long.MAX_VALUE / 4</code> rather than <code>MAX_VALUE</code> is deliberate: adding a weight to a true infinity overflows to a negative number and the algorithm silently reports impossible distances.</p>
<p>This is the basis of distance-vector routing protocols, and of currency arbitrage detection — where a negative cycle means free money.</p>`
},
{
  slug: "floyd-warshall", n: 122, title: "Floyd–Warshall (All Pairs)", difficulty: "hard",
  statement: `<p>Compute the shortest distance between every pair of nodes.</p>`,
  approaches: [
    { name: "Triple loop over intermediates", time: "O(V³)", space: "O(V²)", best: true,
      note: "Ask, for each intermediate k, whether going through k is shorter. The loop order is not negotiable: k MUST be outermost, because dist[i][j] depends on every earlier intermediate already being finished.",
      java: `public static int[][] floydWarshall(int[][] dist) {
    int n = dist.length;                  // dist[i][j] preset, INF where absent
    for (int k = 0; k < n; k++)           // k OUTERMOST
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] != INF && dist[k][j] != INF
                        && dist[i][k] + dist[k][j] < dist[i][j])
                    dist[i][j] = dist[i][k] + dist[k][j];
    return dist;
}`,
      python: `INF = float("inf")

def floyd_warshall(dist: list[list[float]]) -> list[list[float]]:
    n = len(dist)
    for k in range(n):                    # k OUTERMOST
        for i in range(n):
            if dist[i][k] == INF:
                continue
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist` }
  ],
  note: `<p>Putting <code>k</code> anywhere but outermost gives wrong answers with no error — it reads cells that have not yet accounted for earlier intermediates. It is the single most common Floyd–Warshall bug.</p>
<p>A negative value on the diagonal afterwards means a negative cycle. And V³ means V of a few hundred at most; beyond that run Dijkstra from each source instead.</p>`
},
{
  slug: "union-find-components", n: 123, title: "Connected Components (Union-Find)", difficulty: "medium",
  statement: `<p>Count connected components, with edges arriving one at a time.</p>`,
  approaches: [
    { name: "DFS per component", time: "O(V+E)", space: "O(V)",
      note: "Fine when the whole graph is known up front. Useless if edges arrive online, because each new edge means re-running the traversal.",
      java: `// Loop over nodes; each unvisited node starts a DFS and counts one component.
// O(V+E) but must be redone from scratch when a new edge arrives.`,
      python: `# Loop over nodes; each unvisited node starts a DFS and counts one component.
# O(V+E) but must be redone from scratch when a new edge arrives.` },
    { name: "Union-Find with compression and rank", time: "O(α(n)) amortised", space: "O(n)", best: true,
      note: "Path compression flattens the tree on every find; union by rank keeps it shallow. Together they give inverse-Ackermann time — below 5 for any n you will ever see, so effectively constant.",
      java: `public class DSU {
    private final int[] parent, rank;
    private int components;

    public DSU(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // PATH COMPRESSION
        return parent[x];
    }

    public boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                        // already joined
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;                                   // UNION BY RANK
        if (rank[ra] == rank[rb]) rank[ra]++;
        components--;
        return true;
    }

    public int count() { return components; }
}`,
      python: `class DSU:
    def __init__(self, n: int) -> None:
        self._parent = list(range(n))
        self._rank = [0] * n
        self.components = n

    def find(self, x: int) -> int:
        while self._parent[x] != x:
            self._parent[x] = self._parent[self._parent[x]]   # halving
            x = self._parent[x]
        return x

    def union(self, a: int, b: int) -> bool:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self._rank[ra] < self._rank[rb]:
            ra, rb = rb, ra
        self._parent[rb] = ra
        if self._rank[ra] == self._rank[rb]:
            self._rank[ra] += 1
        self.components -= 1
        return True` }
  ],
  note: `<p>Without both optimisations the structure degenerates into a linked list and <code>find</code> becomes O(n). With only one it is O(log n). You need both for the near-constant bound.</p>
<p><strong>Union-Find cannot undo a union.</strong> If the problem deletes edges, process the events <em>backwards</em> in time so deletions become additions — that reversal is the standard escape.</p>`
},
{
  slug: "minimum-spanning-tree", n: 124, title: "Minimum Spanning Tree", difficulty: "hard",
  statement: `<p>Connect every node with the cheapest possible total edge weight.</p>`,
  approaches: [
    { name: "Kruskal with Union-Find", time: "O(E log E)", space: "O(V)", best: true,
      note: "Sort the edges and add each one unless it would close a cycle. union() returning false IS the cycle check — that is the entire algorithm.",
      java: `public static int kruskal(int n, int[][] edges) {
    Arrays.sort(edges, (a, b) -> Integer.compare(a[2], b[2]));  // by weight
    DSU dsu = new DSU(n);
    int total = 0, used = 0;
    for (int[] e : edges) {
        if (!dsu.union(e[0], e[1])) continue;      // would form a cycle
        total += e[2];
        if (++used == n - 1) break;                // a tree has n-1 edges
    }
    return used == n - 1 ? total : -1;             // -1 = graph is disconnected
}`,
      python: `def kruskal(n: int, edges: list[tuple[int, int, int]]) -> int:
    edges = sorted(edges, key=lambda e: e[2])
    dsu = DSU(n)
    total = used = 0
    for u, v, w in edges:
        if not dsu.union(u, v):
            continue
        total += w
        used += 1
        if used == n - 1:
            break
    return total if used == n - 1 else -1` },
    { name: "Prim with a priority queue", time: "O(E log V)", space: "O(V)",
      note: "Grow one tree outward, always taking the cheapest edge leaving it. Better than Kruskal on dense graphs, because it never sorts the whole edge list.",
      java: `public static int prim(List<List<int[]>> adj) {
    boolean[] inTree = new boolean[adj.size()];
    PriorityQueue<int[]> pq =
        new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
    pq.offer(new int[]{0, 0});                     // {node, edgeWeight}

    int total = 0, count = 0;
    while (!pq.isEmpty() && count < adj.size()) {
        int[] cur = pq.poll();
        if (inTree[cur[0]]) continue;
        inTree[cur[0]] = true;
        total += cur[1];
        count++;
        for (int[] edge : adj.get(cur[0]))
            if (!inTree[edge[0]]) pq.offer(new int[]{edge[0], edge[1]});
    }
    return count == adj.size() ? total : -1;
}`,
      python: `import heapq

def prim(adj: list[list[tuple[int, int]]]) -> int:
    in_tree = [False] * len(adj)
    pq = [(0, 0)]                                  # (weight, node)
    total = count = 0
    while pq and count < len(adj):
        weight, u = heapq.heappop(pq)
        if in_tree[u]:
            continue
        in_tree[u] = True
        total += weight
        count += 1
        for v, w in adj[u]:
            if not in_tree[v]:
                heapq.heappush(pq, (w, v))
    return total if count == len(adj) else -1` }
  ],
  note: `<p>Both are greedy and both are provably optimal, by the cut property: for any split of the nodes, the lightest edge crossing it belongs to some MST. That is the justification to state rather than just asserting "greedy works here".</p>
<p>Check the edge count at the end. Fewer than V−1 edges means the graph was disconnected and no spanning tree exists — returning the partial sum silently would be wrong.</p>`
}
]});
