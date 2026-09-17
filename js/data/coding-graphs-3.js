appendTopic("coding-graphs", [
{
  q: "How do you choose between BFS, DFS, Dijkstra, Bellman-Ford and A*?",
  level: "advanced", hot: true, tags: ["graphs", "shortest-path", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Adobe", "Flipkart", "Goldman Sachs", "Ola"],
  a: `<table>
<tr><th>Algorithm</th><th>Use when</th><th>Time</th><th>Fails on</th></tr>
<tr><td><strong>BFS</strong></td><td>Shortest path, <strong>unweighted</strong></td><td>O(V+E)</td><td>Weighted edges</td></tr>
<tr><td><strong>DFS</strong></td><td>Connectivity, cycles, topological order, "any path"</td><td>O(V+E)</td><td>Shortest path — it finds <em>a</em> path, not the shortest</td></tr>
<tr><td><strong>Dijkstra</strong></td><td>Shortest path, <strong>non-negative</strong> weights</td><td>O((V+E) log V)</td><td><strong>Negative edges</strong></td></tr>
<tr><td><strong>Bellman-Ford</strong></td><td>Negative edges; detecting negative cycles</td><td>O(V·E)</td><td>Just slow</td></tr>
<tr><td><strong>Floyd-Warshall</strong></td><td><strong>All</strong> pairs, dense, small V</td><td>O(V³)</td><td>V beyond a few hundred</td></tr>
<tr><td><strong>0-1 BFS</strong></td><td>Weights are only 0 or 1</td><td>O(V+E)</td><td>Other weights</td></tr>
<tr><td><strong>A*</strong></td><td>One target, a good admissible heuristic exists</td><td>Depends</td><td>A heuristic that overestimates → wrong answer</td></tr>
<tr><td><strong>Topological sort</strong></td><td>DAG ordering, dependency resolution</td><td>O(V+E)</td><td>Any cycle — that is the detection signal</td></tr>
</table>
<pre><code>// DIJKSTRA — lazy version, the one to write under pressure
int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE);
dist[src] = 0;
PriorityQueue&lt;int[]&gt; pq = new PriorityQueue&lt;&gt;((a, b) -&gt; a[1] - b[1]);  // {node, dist}
pq.offer(new int[]{src, 0});
while (!pq.isEmpty()) {
    int[] cur = pq.poll();
    if (cur[1] &gt; dist[cur[0]]) continue;          // STALE entry — skip it
    for (int[] e : adj.get(cur[0])) {             // e = {neighbour, weight}
        int nd = cur[1] + e[1];
        if (nd &lt; dist[e[0]]) { dist[e[0]] = nd; pq.offer(new int[]{e[0], nd}); }
    }
}
// The stale-entry guard replaces a decrease-key operation the JDK heap lacks.
// Without it the algorithm still terminates but does redundant work — and if
// you also "mark visited on push" instead of on pop, it becomes WRONG.</code></pre>
<p><strong>Why Dijkstra breaks on negative edges:</strong> it assumes that once a node is popped, its distance is final — nothing later can improve it. A negative edge violates exactly that assumption. Bellman-Ford makes no such assumption: it relaxes every edge V−1 times, and a further relaxation on pass V proves a negative cycle exists.</p>
<pre><code>// TOPOLOGICAL SORT — Kahn's algorithm, and cycle detection for free
int[] indeg = new int[n];
for (int u = 0; u &lt; n; u++) for (int v : adj.get(u)) indeg[v]++;
Deque&lt;Integer&gt; q = new ArrayDeque&lt;&gt;();
for (int i = 0; i &lt; n; i++) if (indeg[i] == 0) q.offer(i);
List&lt;Integer&gt; order = new ArrayList&lt;&gt;();
while (!q.isEmpty()) {
    int u = q.poll(); order.add(u);
    for (int v : adj.get(u)) if (--indeg[v] == 0) q.offer(v);
}
if (order.size() != n) throw new IllegalStateException("cycle — no valid order");
// Course Schedule I and II are literally this. So is build-order, task
// dependency, and Maven resolving your POM.</code></pre>
<pre><code>// CYCLE DETECTION differs by graph type — a classic trip-up
// UNDIRECTED: DFS, seen a visited neighbour that is NOT the parent -> cycle
//             (or union-find: an edge joining two nodes already in one set)
// DIRECTED:   three colours. WHITE unvisited, GREY on the current stack,
//             BLACK done. An edge to a GREY node is a BACK EDGE -> cycle.
//             A "visited" boolean alone is wrong: it flags cross edges too.</code></pre>
<p><strong>The one-line decision:</strong> unweighted → BFS. Non-negative weights → Dijkstra. Negative weights → Bellman-Ford. All pairs on a small dense graph → Floyd-Warshall. Weights of 0 and 1 only → 0-1 BFS with a deque, which is the variant almost nobody mentions and always lands well.</p>`
},
{
  q: "Union-Find (Disjoint Set Union) and where it beats DFS",
  level: "advanced", hot: true, tags: ["union-find", "dsu", "graphs", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Goldman Sachs", "Flipkart"],
  a: `<pre><code>class DSU {
    private final int[] parent, rank;
    private int components;

    DSU(int n) {
        parent = new int[n]; rank = new int[n]; components = n;
        for (int i = 0; i &lt; n; i++) parent[i] = i;
    }
    int find(int x) {                                  // PATH COMPRESSION
        if (parent[x] != x) parent[x] = find(parent[x]);   // re-point to the root
        return parent[x];
    }
    boolean union(int a, int b) {                      // UNION BY RANK
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                    // already together
        if (rank[ra] &lt; rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        components--;
        return true;
    }
    int count() { return components; }
}
// Both optimisations together give O(α(n)) amortised — the inverse Ackermann
// function, below 5 for any n you will ever see. Effectively constant.
// With NEITHER, find degrades to O(n) and the structure becomes a linked list.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Path compression flattening a chain onto the root">
  <text class="dg-s" x="16" y="20">before find(d)</text>
  <circle class="dg-fill" cx="50" cy="52" r="15"/><text class="dg-t" x="50" y="57" text-anchor="middle">a</text>
  <circle class="dg-fill" cx="50" cy="96" r="15"/><text class="dg-t" x="50" y="101" text-anchor="middle">b</text>
  <circle class="dg-fill" cx="50" cy="136" r="15"/><text class="dg-t" x="50" y="141" text-anchor="middle">d</text>
  <path class="dg-line" d="M50 121 L50 111 M50 81 L50 71"/>
  <text class="dg-s" x="150" y="20">after find(d)</text>
  <circle class="dg-fill2" cx="230" cy="52" r="15"/><text class="dg-t" x="230" y="57" text-anchor="middle">a</text>
  <circle class="dg-fill" cx="196" cy="116" r="15"/><text class="dg-t" x="196" y="121" text-anchor="middle">b</text>
  <circle class="dg-fill" cx="264" cy="116" r="15"/><text class="dg-t" x="264" y="121" text-anchor="middle">d</text>
  <path class="dg-line" d="M204 102 L222 66 M256 102 L238 66"/>
  <text class="dg-s" x="330" y="90">every node on the path now points</text>
  <text class="dg-s" x="330" y="112">straight at the root — the next find is O(1)</text>
</svg>
</figure>
<table>
<tr><th>Use DSU when</th><th>Use DFS/BFS when</th></tr>
<tr><td>Edges arrive <strong>incrementally</strong> (streaming, online)</td><td>The whole graph is known up front</td></tr>
<tr><td>You only need "same component?"</td><td>You need the actual path, or distances</td></tr>
<tr><td>Counting components as you merge</td><td>Traversal order matters</td></tr>
<tr><td>Kruskal's MST — cycle check per edge</td><td>Shortest path, level order</td></tr>
<tr><td>Detecting a redundant connection</td><td>Bipartite checking with colours</td></tr>
</table>
<pre><code>// KRUSKAL'S MST is just "sort the edges, union the ones that don't cycle"
Arrays.sort(edges, (a, b) -&gt; a[2] - b[2]);
DSU dsu = new DSU(n);
int cost = 0;
for (int[] e : edges) if (dsu.union(e[0], e[1])) cost += e[2];
// union() returning false IS the cycle check. That is the whole algorithm.

// Problems that are DSU in disguise:
// - Number of provinces / connected components
// - Redundant connection (the edge whose union returns false)
// - Accounts merge — union by shared email
// - Number of islands II (islands appear one at a time)
// - Satisfiability of equality equations (union the ==, then verify the !=)
// - Most stones removed with same row or column</code></pre>
<p><strong>DSU cannot undo a union.</strong> If the problem deletes edges, run it <em>backwards</em> in time so deletions become additions — that reversal trick is the standard escape, and worth naming even if you do not code it.</p>`
},
{
  q: "Grid problems: the traversal template and the variations built on it",
  level: "beginner", hot: true, tags: ["grid", "bfs", "dfs", "matrix", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Walmart", "Uber", "Zoho"],
  a: `<p>A grid is a graph where the neighbours are implied. Write the template once; nearly every matrix question is a variation of it.</p>
<pre><code>private static final int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};   // 8-dir adds diagonals

void dfs(char[][] g, int r, int c) {
    if (r &lt; 0 || r &gt;= g.length || c &lt; 0 || c &gt;= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';                                  // mark BEFORE recursing
    for (int[] d : DIRS) dfs(g, r + d[0], c + d[1]);
}
// Marking before recursing is what prevents infinite mutual recursion.
// Mutating the grid saves the visited[][] array — mention it, and ask whether
// mutating the input is acceptable. In an interview it usually is; in
// production it usually is not.</code></pre>
<pre><code>// MULTI-SOURCE BFS — the pattern people miss, and it is everywhere.
// "Rotting oranges", "walls and gates", "01 matrix", "shortest bridge".
// Seed the queue with ALL sources at once, then one BFS gives every cell its
// distance to the NEAREST source. Running one BFS per source is O(n^2) worse.
Deque&lt;int[]&gt; q = new ArrayDeque&lt;&gt;();
for (int r = 0; r &lt; m; r++)
    for (int c = 0; c &lt; n; c++)
        if (grid[r][c] == ROTTEN) q.offer(new int[]{r, c});

int minutes = 0;
while (!q.isEmpty()) {
    int sz = q.size();                              // freeze the level size
    for (int i = 0; i &lt; sz; i++) { /* expand one cell */ }
    minutes++;                                      // one level = one time step
}
// The level-size snapshot is how BFS counts DISTANCE. Without it you cannot
// tell which "minute" a cell belongs to.</code></pre>
<table>
<tr><th>Problem</th><th>Technique</th><th>The trick</th></tr>
<tr><td>Number of islands</td><td>DFS / BFS flood fill</td><td>Count how many times you <em>start</em> a traversal</td></tr>
<tr><td>Max area of island</td><td>DFS returning a size</td><td><code>1 + sum of the four calls</code></td></tr>
<tr><td>Rotting oranges</td><td>Multi-source BFS</td><td>Level count = elapsed minutes</td></tr>
<tr><td>Surrounded regions</td><td>DFS <strong>from the border inward</strong></td><td>Invert it: mark what is safe, flip the rest</td></tr>
<tr><td>Pacific–Atlantic water flow</td><td>Two BFS from the edges</td><td>Reverse the flow direction, then intersect</td></tr>
<tr><td>Word search</td><td>DFS + backtracking</td><td><strong>Unmark on the way out</strong> — the difference from flood fill</td></tr>
<tr><td>Shortest path in a binary matrix</td><td>BFS, 8 directions</td><td>DFS gives a path, never the shortest</td></tr>
<tr><td>Path with minimum effort</td><td>Dijkstra on the grid</td><td>Cost is <code>max</code> of steps, not the sum</td></tr>
<tr><td>Unique paths / min path sum</td><td>DP, not traversal</td><td>Monotone movement means no revisits</td></tr>
</table>
<pre><code>// FLOOD FILL vs BACKTRACKING — one line apart, completely different meaning
// Flood fill:    mark visited, never unmark   -> "which cells are reachable"
// Backtracking:  mark, recurse, UNMARK        -> "does some path spell WORD"
// Forget the unmark in word search and a cell used by a failed branch stays
// blocked for every later branch. Silently wrong, no crash.</code></pre>
<p><strong>The DFS depth warning:</strong> a 1000×1000 grid of all-land recurses a million frames deep and throws <code>StackOverflowError</code>. BFS with an explicit queue has no such ceiling. Saying that unprompted signals production experience rather than puzzle practice.</p>`
}
]);
