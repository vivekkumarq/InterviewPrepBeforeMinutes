registerTopic("coding-graphs", [
{
  q: "Number of islands — the grid DFS/BFS template",
  level: "beginner", hot: true, tags: ["graphs", "grid", "dfs", "interview-favourite"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Salesforce"],
  a: `<div class="cx"><b>O(m·n) time</b><span>each cell visited once</span><b>O(m·n) space</b><span>recursion depth in the worst case</span></div>
<pre><code>public int numIslands(char[][] grid) {
    int count = 0;
    for (int r = 0; r &lt; grid.length; r++) {
        for (int c = 0; c &lt; grid[0].length; c++) {
            if (grid[r][c] == '1') {
                count++;
                sink(grid, r, c);       // flood the whole island so it is counted once
            }
        }
    }
    return count;
}

private void sink(char[][] g, int r, int c) {
    // Bounds check FIRST, then the water check — one guard covers everything
    if (r &lt; 0 || r &gt;= g.length || c &lt; 0 || c &gt;= g[0].length || g[r][c] != '1') return;

    g[r][c] = '0';                      // mark visited by mutating the grid
    sink(g, r + 1, c);
    sink(g, r - 1, c);
    sink(g, r, c + 1);
    sink(g, r, c - 1);
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Grid with two separate islands of land cells">
  <g>
    <rect class="dg-fill" x="30" y="26" width="34" height="34" rx="4"/><rect class="dg-fill" x="66" y="26" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="102" y="26" width="34" height="34" rx="4"/><rect class="dg-box" x="138" y="26" width="34" height="34" rx="4"/>
    <rect class="dg-fill" x="30" y="62" width="34" height="34" rx="4"/><rect class="dg-box" x="66" y="62" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="102" y="62" width="34" height="34" rx="4"/><rect class="dg-box" x="138" y="62" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="30" y="98" width="34" height="34" rx="4"/><rect class="dg-box" x="66" y="98" width="34" height="34" rx="4"/>
    <rect class="dg-fill2" x="102" y="98" width="34" height="34" rx="4"/><rect class="dg-fill2" x="138" y="98" width="34" height="34" rx="4"/>
  </g>
  <text class="dg-s" x="230" y="46">island 1 — connected through</text>
  <text class="dg-s" x="230" y="66">shared edges, not corners</text>
  <text class="dg-s" x="230" y="112">island 2 — separate component</text>
  <text class="dg-s" x="16" y="156">the outer loop finds one seed per island; the flood fill consumes the rest</text>
</svg>
</figure>
<pre><code>// BFS version — use it when the grid is huge and recursion would overflow
private void sinkBFS(char[][] g, int sr, int sc) {
    int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};
    Deque&lt;int[]&gt; q = new ArrayDeque&lt;&gt;();
    q.offer(new int[]{sr, sc});
    g[sr][sc] = '0';                     // mark on ENQUEUE, not on dequeue —
                                          // otherwise a cell can be queued many times
    while (!q.isEmpty()) {
        int[] cur = q.poll();
        for (int[] d : DIRS) {
            int r = cur[0] + d[0], c = cur[1] + d[1];
            if (r &lt; 0 || r &gt;= g.length || c &lt; 0 || c &gt;= g[0].length || g[r][c] != '1') continue;
            g[r][c] = '0';
            q.offer(new int[]{r, c});
        }
    }
}</code></pre>
<table>
<tr><th>Variant</th><th>Change</th></tr>
<tr><td>Max area of an island</td><td>Return <code>1 + sum of the four calls</code> instead of void</td></tr>
<tr><td>Number of distinct island <em>shapes</em></td><td>Record the path signature relative to the seed, store in a set</td></tr>
<tr><td>Surrounded regions</td><td>Flood from the <strong>borders</strong> first, then flip everything unmarked</td></tr>
<tr><td>Rotting oranges</td><td><strong>Multi-source BFS</strong> — enqueue every rotten cell at once; the level count is the answer</td></tr>
<tr><td>Word search in a grid</td><td>DFS with backtracking — unmark on the way out</td></tr>
<tr><td>Diagonal connectivity too</td><td>8 directions instead of 4 — always ask which is meant</td></tr>
</table>
<p><strong>If you must not mutate the input</strong>, use a separate <code>boolean[][] visited</code> — it costs O(m·n) memory but leaves the caller's grid intact. Mutating is faster and uses no extra space; say which trade-off you are making rather than doing it silently, because a function that destroys its argument is a real API problem.</p>`
},
{
  q: "Course schedule — topological sort and cycle detection",
  level: "beginner", hot: true, tags: ["graphs", "topological-sort", "bfs", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Oracle", "Walmart"],
  a: `<div class="cx"><b>O(V + E) time</b><span>each node and edge processed once</span><b>O(V + E) space</b><span>adjacency list plus queue</span></div>
<pre><code>// KAHN'S ALGORITHM (BFS) — gives the order AND detects a cycle in one pass
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List&lt;List&lt;Integer&gt;&gt; adj = new ArrayList&lt;&gt;();
    for (int i = 0; i &lt; numCourses; i++) adj.add(new ArrayList&lt;&gt;());
    int[] indegree = new int[numCourses];

    for (int[] p : prerequisites) {        // p = [course, prerequisite]
        adj.get(p[1]).add(p[0]);           // prerequisite -> course
        indegree[p[0]]++;
    }

    Deque&lt;Integer&gt; q = new ArrayDeque&lt;&gt;();
    for (int i = 0; i &lt; numCourses; i++) if (indegree[i] == 0) q.offer(i);

    int[] order = new int[numCourses];
    int idx = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[idx++] = u;
        for (int v : adj.get(u)) {
            if (--indegree[v] == 0) q.offer(v);   // all prerequisites satisfied
        }
    }
    // Fewer than numCourses emitted -> some nodes never reached indegree 0 -> CYCLE
    return idx == numCourses ? order : new int[0];
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="Topological ordering by repeatedly removing zero indegree nodes">
  <circle class="dg-fill" cx="60" cy="50" r="20"/><text class="dg-t" x="60" y="55" text-anchor="middle">0</text>
  <circle class="dg-fill" cx="170" cy="30" r="20"/><text class="dg-t" x="170" y="35" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="170" cy="110" r="20"/><text class="dg-t" x="170" y="115" text-anchor="middle">2</text>
  <circle class="dg-fill2" cx="290" cy="70" r="20"/><text class="dg-t" x="290" y="75" text-anchor="middle">3</text>
  <path class="dg-line" d="M80 42 L148 34 M80 62 L148 102 M190 40 L270 62 M190 102 L270 80" marker-end="url(#tg1)"/>
  <text class="dg-s" x="60" y="92" text-anchor="middle">indeg 0</text>
  <text class="dg-s" x="290" y="112" text-anchor="middle">indeg 2</text>
  <text class="dg-s" x="360" y="42">remove 0 → 1 and 2 drop to indegree 0</text>
  <text class="dg-s" x="360" y="66">remove 1 and 2 → 3 drops to 0</text>
  <text class="dg-s" x="360" y="90">order: 0, 1, 2, 3  (or 0, 2, 1, 3)</text>
  <text class="dg-s" x="16" y="152">if any node never reaches indegree 0, it sits inside a cycle — no valid order exists</text>
  <defs><marker id="tg1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// DFS ALTERNATIVE — three colours, and the reverse postorder is the topo order
private static final int UNVISITED = 0, IN_STACK = 1, DONE = 2;

public boolean canFinish(int n, int[][] prereq) {
    List&lt;List&lt;Integer&gt;&gt; adj = build(n, prereq);
    int[] state = new int[n];
    for (int i = 0; i &lt; n; i++) if (state[i] == UNVISITED && hasCycle(i, adj, state)) return false;
    return true;
}
private boolean hasCycle(int u, List&lt;List&lt;Integer&gt;&gt; adj, int[] state) {
    state[u] = IN_STACK;
    for (int v : adj.get(u)) {
        if (state[v] == IN_STACK) return true;             // back edge -> cycle
        if (state[v] == UNVISITED && hasCycle(v, adj, state)) return true;
    }
    state[u] = DONE;                                        // fully explored
    return false;
}</code></pre>
<table>
<tr><th></th><th>Kahn (BFS)</th><th>DFS</th></tr>
<tr><td>Detects cycles</td><td>Count &lt; V</td><td>Back edge to an in-stack node</td></tr>
<tr><td>Produces the order</td><td>Directly</td><td>Reverse of the postorder</td></tr>
<tr><td>Stack overflow risk</td><td>None</td><td>Yes on deep graphs</td></tr>
<tr><td>Lexicographically smallest order</td><td>Use a <strong>PriorityQueue</strong> instead of a deque</td><td>Awkward</td></tr>
<tr><td>Parallel scheduling</td><td>Natural — each BFS level can run concurrently</td><td>No</td></tr>
</table>
<p><strong>The distinction that gets tested:</strong> in an <em>undirected</em> graph, a visited neighbour that is not your parent means a cycle — two states plus a parent check is enough. Applying the three-colour directed algorithm to an undirected graph reports a false cycle on <em>every</em> edge, because <code>u → v</code> and <code>v → u</code> both exist.</p>
<p><strong>Where you have actually used this:</strong> Maven and Gradle resolving module build order, a CI pipeline ordering stages, Spring wiring beans (and reporting a circular-dependency error, which is literally this cycle check), and database migration ordering. Naming one makes the answer concrete.</p>`
},
{
  q: "Dijkstra's algorithm — shortest path in a weighted graph",
  level: "advanced", hot: true, tags: ["graphs", "shortest-path", "heap", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Adobe", "Flipkart", "Goldman Sachs"],
  a: `<div class="cx"><b>O((V + E) log V)</b><span>with a binary heap</span><b>O(V + E) space</b><span>graph plus distance array</span></div>
<pre><code>// Network delay time: shortest path from a source to every node
public int networkDelayTime(int[][] times, int n, int k) {
    Map&lt;Integer, List&lt;int[]&gt;&gt; adj = new HashMap&lt;&gt;();
    for (int[] t : times) adj.computeIfAbsent(t[0], x -&gt; new ArrayList&lt;&gt;()).add(new int[]{t[1], t[2]});

    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    // {node, distanceSoFar}, ordered by distance
    PriorityQueue&lt;int[]&gt; pq = new PriorityQueue&lt;&gt;(Comparator.comparingInt(a -&gt; a[1]));
    pq.offer(new int[]{k, 0});

    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int u = cur[0], d = cur[1];

        if (d &gt; dist[u]) continue;       // STALE entry — this is the lazy-deletion trick

        for (int[] e : adj.getOrDefault(u, List.of())) {
            int v = e[0], w = e[1];
            if (d + w &lt; dist[v]) {       // relaxation
                dist[v] = d + w;
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }

    int max = 0;
    for (int i = 1; i &lt;= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;   // unreachable
        max = Math.max(max, dist[i]);
    }
    return max;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Dijkstra relaxing edges outward from the source">
  <circle class="dg-fill2" cx="60" cy="80" r="20"/><text class="dg-t" x="60" y="85" text-anchor="middle">S</text>
  <circle class="dg-fill" cx="200" cy="34" r="20"/><text class="dg-t" x="200" y="39" text-anchor="middle">A</text>
  <circle class="dg-fill" cx="200" cy="126" r="20"/><text class="dg-t" x="200" y="131" text-anchor="middle">B</text>
  <circle class="dg-fill" cx="350" cy="80" r="20"/><text class="dg-t" x="350" y="85" text-anchor="middle">C</text>
  <path class="dg-line" d="M78 70 L180 42 M78 92 L180 118 M218 44 L332 70 M218 116 L332 90" marker-end="url(#dj1)"/>
  <text class="dg-s" x="120" y="42">4</text>
  <text class="dg-s" x="120" y="122">1</text>
  <text class="dg-s" x="280" y="46">1</text>
  <text class="dg-s" x="280" y="120">5</text>
  <text class="dg-s" x="410" y="60">dist[A] = 4, dist[B] = 1</text>
  <text class="dg-s" x="410" y="82">via A: 4+1 = 5</text>
  <text class="dg-s" x="410" y="104">via B: 1+5 = 6  → keep 5</text>
  <text class="dg-s" x="16" y="158">always expand the closest unfinalised node — that greedy choice is only safe with non-negative weights</text>
  <defs><marker id="dj1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Situation</th><th>Algorithm</th><th>Complexity</th></tr>
<tr><td>Unweighted graph</td><td><strong>Plain BFS</strong> — Dijkstra is overkill</td><td>O(V+E)</td></tr>
<tr><td>Non-negative weights, one source</td><td><strong>Dijkstra</strong></td><td>O((V+E) log V)</td></tr>
<tr><td><strong>Negative</strong> weights</td><td>Bellman-Ford — also detects negative cycles</td><td>O(V·E)</td></tr>
<tr><td>All pairs, dense graph</td><td>Floyd-Warshall — three nested loops</td><td>O(V³)</td></tr>
<tr><td>Weights are only 0 and 1</td><td><strong>0-1 BFS</strong> with a deque</td><td>O(V+E)</td></tr>
<tr><td>Known target, good heuristic</td><td>A* — Dijkstra plus an estimate</td><td>Much faster in practice</td></tr>
</table>
<p><strong>Why negative weights break it:</strong> Dijkstra finalises a node the moment it is popped, on the assumption that no later path can be shorter. A negative edge violates that — a longer route can still reduce the total. It does not merely slow down; it returns wrong answers, which is why Bellman-Ford exists.</p>
<p><strong>Two implementation notes to volunteer:</strong> Java's <code>PriorityQueue</code> has no decrease-key, so the standard trick is to push a duplicate entry and skip stale ones with <code>if (d &gt; dist[u]) continue</code>. And with a Fibonacci heap the bound improves to O(E + V log V) — theoretically better, practically slower, which is worth saying because it shows you know the difference between a bound and a benchmark.</p>`
},
{
  q: "Union-Find (disjoint set union) with path compression",
  level: "advanced", hot: true, tags: ["graphs", "union-find", "data-structures", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Goldman Sachs", "Flipkart"],
  a: `<div class="cx"><b>O(α(n)) amortised</b><span>inverse Ackermann — under 5 for any real input</span><b>O(n) space</b><span>two arrays</span></div>
<pre><code>class UnionFind {
    private final int[] parent, rank;
    private int components;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i &lt; n; i++) parent[i] = i;    // everyone is their own root
    }

    // PATH COMPRESSION: flatten the chain on every lookup
    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];           // point at the grandparent
            x = parent[x];
        }
        return x;
    }

    // UNION BY RANK: attach the shorter tree under the taller one
    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                  // already connected -> a CYCLE

        if (rank[ra] &lt; rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        components--;
        return true;
    }

    boolean connected(int a, int b) { return find(a) == find(b); }
    int count() { return components; }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Path compression flattening a chain of parent pointers">
  <text class="dg-s" x="80" y="20" text-anchor="middle">before find(3)</text>
  <circle class="dg-fill" cx="80" cy="42" r="15"/><text class="dg-t" x="80" y="47" text-anchor="middle">0</text>
  <circle class="dg-fill" cx="80" cy="80" r="15"/><text class="dg-t" x="80" y="85" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="80" cy="118" r="15"/><text class="dg-t" x="80" y="123" text-anchor="middle">2</text>
  <circle class="dg-fill2" cx="140" cy="118" r="15"/><text class="dg-t" x="140" y="123" text-anchor="middle">3</text>
  <path class="dg-line" d="M80 103 V95 M80 65 V57" marker-end="url(#uf1)"/>
  <path class="dg-line" d="M126 114 L96 100" marker-end="url(#uf1)"/>
  <path class="dg-line" d="M220 80 H280" marker-end="url(#uf1)"/>
  <text class="dg-s" x="250" y="68" text-anchor="middle">compress</text>
  <text class="dg-s" x="420" y="20" text-anchor="middle">after</text>
  <circle class="dg-fill" cx="420" cy="42" r="15"/><text class="dg-t" x="420" y="47" text-anchor="middle">0</text>
  <circle class="dg-fill" cx="350" cy="104" r="15"/><text class="dg-t" x="350" y="109" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="420" cy="104" r="15"/><text class="dg-t" x="420" y="109" text-anchor="middle">2</text>
  <circle class="dg-fill2" cx="490" cy="104" r="15"/><text class="dg-t" x="490" y="109" text-anchor="middle">3</text>
  <path class="dg-line" d="M360 92 L406 56 M420 89 V59 M480 92 L434 56" marker-end="url(#uf1)"/>
  <text class="dg-s" x="16" y="148">every node touched by find() is re-pointed straight at the root, so later lookups are O(1)</text>
  <defs><marker id="uf1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Union-Find usage</th></tr>
<tr><td>Number of connected components</td><td><code>count()</code> after unioning every edge</td></tr>
<tr><td>Cycle in an <strong>undirected</strong> graph</td><td><code>union</code> returning false means both ends were already connected</td></tr>
<tr><td><strong>Kruskal's MST</strong></td><td>Sort edges by weight, union while it returns true</td></tr>
<tr><td>Redundant connection</td><td>The first edge whose union fails</td></tr>
<tr><td>Accounts merge / friend circles</td><td>Union on any shared attribute</td></tr>
<tr><td>Number of islands II (streaming)</td><td>Add land one cell at a time and union with existing neighbours</td></tr>
</table>
<pre><code>// KRUSKAL'S MINIMUM SPANNING TREE — five lines once you have Union-Find
public int minimumCost(int n, int[][] edges) {   // edges = {u, v, weight}
    Arrays.sort(edges, Comparator.comparingInt(e -&gt; e[2]));
    UnionFind uf = new UnionFind(n);
    int total = 0;
    for (int[] e : edges) if (uf.union(e[0], e[1])) total += e[2];
    return uf.count() == 1 ? total : -1;         // -1 = the graph is disconnected
}</code></pre>
<p><strong>Union-Find versus DFS for connectivity:</strong> DFS needs the whole graph up front and answers one question per traversal. Union-Find handles edges <em>arriving over time</em> and answers "are these two connected?" in near-constant time at any moment. That incremental property is why it wins for streaming problems — and why it cannot do directed cycles or shortest paths.</p>
<p><strong>The honest note on complexity:</strong> α(n) is the inverse Ackermann function; it is below 5 for any input that fits in the universe, so treating it as constant is fine. But you need <em>both</em> optimisations — path compression alone or union by rank alone gives O(log n), not α(n).</p>`
},
{
  q: "Clone a graph and detect a cycle in an undirected graph",
  level: "advanced", tags: ["graphs", "dfs", "hashing"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Oracle"],
  a: `<pre><code>// CLONE GRAPH — a deep copy of an arbitrary node graph, cycles included.
// The map serves two purposes: it stores the copies AND acts as the visited set.
public Node cloneGraph(Node node) {
    return clone(node, new HashMap&lt;&gt;());
}
private Node clone(Node n, Map&lt;Node, Node&gt; seen) {
    if (n == null) return null;
    if (seen.containsKey(n)) return seen.get(n);      // already copied -> break the cycle

    Node copy = new Node(n.val);
    seen.put(n, copy);                                 // register BEFORE recursing —
                                                       // this is what stops infinite loops
    for (Node nb : n.neighbors) copy.neighbors.add(clone(nb, seen));
    return copy;
}</code></pre>
<p><strong>The ordering is the whole problem.</strong> Putting <code>copy</code> into the map <em>before</em> recursing means that when the recursion comes back around to <code>n</code> through a cycle, it finds the partially built copy and returns it instead of recursing forever. Registering after the loop produces a stack overflow on any cyclic graph.</p>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Cloning a cyclic graph using a map from original to copy">
  <circle class="dg-fill" cx="70" cy="46" r="18"/><text class="dg-t" x="70" y="51" text-anchor="middle">1</text>
  <circle class="dg-fill" cx="170" cy="46" r="18"/><text class="dg-t" x="170" y="51" text-anchor="middle">2</text>
  <circle class="dg-fill" cx="70" cy="118" r="18"/><text class="dg-t" x="70" y="123" text-anchor="middle">4</text>
  <circle class="dg-fill" cx="170" cy="118" r="18"/><text class="dg-t" x="170" y="123" text-anchor="middle">3</text>
  <path class="dg-line" d="M88 46 H152 M70 64 V100 M170 64 V100 M88 118 H152"/>
  <path class="dg-line" d="M210 82 H278" marker-end="url(#cg1)"/>
  <text class="dg-s" x="244" y="70" text-anchor="middle">map</text>
  <circle class="dg-fill2" cx="330" cy="46" r="18"/><text class="dg-t" x="330" y="51" text-anchor="middle">1'</text>
  <circle class="dg-fill2" cx="430" cy="46" r="18"/><text class="dg-t" x="430" y="51" text-anchor="middle">2'</text>
  <circle class="dg-fill2" cx="330" cy="118" r="18"/><text class="dg-t" x="330" y="123" text-anchor="middle">4'</text>
  <circle class="dg-fill2" cx="430" cy="118" r="18"/><text class="dg-t" x="430" y="123" text-anchor="middle">3'</text>
  <path class="dg-line" d="M348 46 H412 M330 64 V100 M430 64 V100 M348 118 H412"/>
  <text class="dg-s" x="468" y="60">each original maps to</text>
  <text class="dg-s" x="468" y="78">exactly one copy, so</text>
  <text class="dg-s" x="468" y="96">shared nodes stay shared</text>
  <text class="dg-s" x="468" y="114">and cycles stay cycles</text>
  <defs><marker id="cg1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// CYCLE IN AN UNDIRECTED GRAPH — track the PARENT, not a recursion stack
public boolean hasCycle(int n, List&lt;List&lt;Integer&gt;&gt; adj) {
    boolean[] visited = new boolean[n];
    for (int i = 0; i &lt; n; i++) {
        if (!visited[i] && dfs(i, -1, adj, visited)) return true;
    }
    return false;
}
private boolean dfs(int u, int parent, List&lt;List&lt;Integer&gt;&gt; adj, boolean[] visited) {
    visited[u] = true;
    for (int v : adj.get(u)) {
        if (v == parent) continue;                 // the edge we arrived on is not a cycle
        if (visited[v]) return true;               // any OTHER visited neighbour is
        if (dfs(v, u, adj, visited)) return true;
    }
    return false;
}
// With parallel edges between the same pair, the parent check is not enough —
// track the edge id instead. Worth mentioning; it is a real follow-up.</code></pre>
<table>
<tr><th>Graph type</th><th>Cycle detection</th></tr>
<tr><td><strong>Undirected</strong>, DFS</td><td>Visited neighbour that is not the parent</td></tr>
<tr><td><strong>Undirected</strong>, Union-Find</td><td><code>union</code> returns false — usually the cleanest</td></tr>
<tr><td><strong>Directed</strong>, DFS</td><td>Back edge to a node still on the recursion stack (three colours)</td></tr>
<tr><td><strong>Directed</strong>, BFS</td><td>Kahn's: fewer than V nodes emitted</td></tr>
<tr><td>Linked list</td><td>Floyd's tortoise and hare</td></tr>
</table>
<p><strong>Where cloning a graph is real work:</strong> deep-copying an object graph with circular references — exactly what Java serialisation, Jackson's cycle handling, and JPA entity detachment have to solve. The identity map here is the same mechanism <code>ObjectOutputStream</code> uses internally to avoid writing the same object twice.</p>`
},
{
  q: "Word ladder and shortest path in an unweighted graph",
  level: "advanced", tags: ["graphs", "bfs", "strings", "shortest-path"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Salesforce"],
  a: `<div class="cx"><b>O(N · L · 26)</b><span>N words, L letters each</span><b>O(N · L) space</b><span>the word set and queue</span></div>
<pre><code>// BFS gives the SHORTEST transformation because every edge costs 1.
public int ladderLength(String begin, String end, List&lt;String&gt; wordList) {
    Set&lt;String&gt; dict = new HashSet&lt;&gt;(wordList);
    if (!dict.contains(end)) return 0;

    Queue&lt;String&gt; q = new LinkedList&lt;&gt;();
    q.offer(begin);
    int steps = 1;

    while (!q.isEmpty()) {
        int size = q.size();                       // process one LEVEL at a time
        for (int i = 0; i &lt; size; i++) {
            char[] word = q.poll().toCharArray();

            for (int j = 0; j &lt; word.length; j++) {
                char original = word[j];
                for (char c = 'a'; c &lt;= 'z'; c++) {
                    if (c == original) continue;
                    word[j] = c;
                    String next = new String(word);

                    if (next.equals(end)) return steps + 1;
                    if (dict.remove(next)) q.offer(next);   // remove = mark visited
                }
                word[j] = original;                // restore before the next position
            }
        }
        steps++;
    }
    return 0;
}</code></pre>
<p><strong>Why generate neighbours instead of comparing every pair:</strong> checking all N² word pairs for a one-letter difference is quadratic in the dictionary size. Generating the L×26 possible mutations and testing set membership is proportional to the <em>word length</em> instead — a huge win once the dictionary is large. Choosing the cheaper neighbour function is the real insight here.</p>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="BFS levels expanding from the start word to the target">
  <circle class="dg-fill2" cx="60" cy="76" r="24"/><text class="dg-s" x="60" y="81" text-anchor="middle">hit</text>
  <circle class="dg-fill" cx="180" cy="76" r="24"/><text class="dg-s" x="180" y="81" text-anchor="middle">hot</text>
  <circle class="dg-fill" cx="310" cy="40" r="24"/><text class="dg-s" x="310" y="45" text-anchor="middle">dot</text>
  <circle class="dg-fill" cx="310" cy="112" r="24"/><text class="dg-s" x="310" y="117" text-anchor="middle">lot</text>
  <circle class="dg-fill" cx="430" cy="40" r="24"/><text class="dg-s" x="430" y="45" text-anchor="middle">dog</text>
  <circle class="dg-fill" cx="430" cy="112" r="24"/><text class="dg-s" x="430" y="117" text-anchor="middle">log</text>
  <circle class="dg-fill2" cx="545" cy="76" r="24"/><text class="dg-s" x="545" y="81" text-anchor="middle">cog</text>
  <path class="dg-line" d="M84 76 H156 M202 66 L288 46 M202 88 L288 106 M334 40 H406 M334 112 H406 M452 50 L523 68 M452 102 L523 86"/>
  <text class="dg-s" x="300" y="146" text-anchor="middle">each level is one transformation — the first time you reach the target, that is the shortest chain</text>
</svg>
</figure>
<table>
<tr><th>Optimisation</th><th>Effect</th></tr>
<tr><td><strong>Bidirectional BFS</strong></td><td>Search from both ends and meet in the middle — roughly halves the exponent, from b^d to 2·b^(d/2)</td></tr>
<tr><td>Remove from the dictionary on enqueue</td><td>Doubles as the visited set and prevents re-queuing</td></tr>
<tr><td>Precompute wildcard buckets (<code>h*t</code>)</td><td>Better when L is large relative to 26</td></tr>
<tr><td>Return the <em>path</em>, not the length</td><td>Store a parent map, then walk it backwards</td></tr>
</table>
<pre><code>// The mark-on-ENQUEUE rule, which applies to every BFS
// ✗ marking on dequeue lets the same node be queued many times
// ✔ dict.remove(next) marks it the moment it is discovered
//
// Same rule in grid BFS: set visited[r][c] = true when you OFFER,
// not when you POLL. This is the most common BFS performance bug.</code></pre>
<p><strong>The general principle to state:</strong> "BFS finds shortest paths only because every edge has the same cost. The moment edges have different weights, the first time you reach a node is no longer the cheapest way, and you need Dijkstra. That single sentence decides which algorithm a problem needs."</p>`
},
{
  q: "N-Queens and the backtracking template",
  level: "advanced", hot: true, tags: ["backtracking", "recursion", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Flipkart", "Oracle"],
  a: `<pre><code>// N-QUEENS — place one queen per row; the sets make conflict checks O(1)
public List&lt;List&lt;String&gt;&gt; solveNQueens(int n) {
    List&lt;List&lt;String&gt;&gt; out = new ArrayList&lt;&gt;();
    int[] queenCol = new int[n];
    Set&lt;Integer&gt; cols = new HashSet&lt;&gt;(), diag = new HashSet&lt;&gt;(), anti = new HashSet&lt;&gt;();
    place(0, n, queenCol, cols, diag, anti, out);
    return out;
}

private void place(int row, int n, int[] q,
                   Set&lt;Integer&gt; cols, Set&lt;Integer&gt; diag, Set&lt;Integer&gt; anti,
                   List&lt;List&lt;String&gt;&gt; out) {
    if (row == n) { out.add(render(q, n)); return; }      // all rows filled

    for (int col = 0; col &lt; n; col++) {
        // Every cell on one diagonal shares (row - col); on one anti-diagonal, (row + col)
        if (cols.contains(col) || diag.contains(row - col) || anti.contains(row + col)) continue;

        q[row] = col;                                     // CHOOSE
        cols.add(col); diag.add(row - col); anti.add(row + col);

        place(row + 1, n, q, cols, diag, anti, out);      // EXPLORE

        cols.remove(col); diag.remove(row - col); anti.remove(row + col);   // UNDO
    }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Diagonal indexing by row minus column and row plus column">
  <g>
    <rect class="dg-box" x="30" y="24" width="32" height="32"/><rect class="dg-fill" x="62" y="24" width="32" height="32"/>
    <rect class="dg-box" x="94" y="24" width="32" height="32"/><rect class="dg-box" x="126" y="24" width="32" height="32"/>
    <rect class="dg-box" x="30" y="56" width="32" height="32"/><rect class="dg-box" x="62" y="56" width="32" height="32"/>
    <rect class="dg-box" x="94" y="56" width="32" height="32"/><rect class="dg-fill" x="126" y="56" width="32" height="32"/>
    <rect class="dg-fill" x="30" y="88" width="32" height="32"/><rect class="dg-box" x="62" y="88" width="32" height="32"/>
    <rect class="dg-box" x="94" y="88" width="32" height="32"/><rect class="dg-box" x="126" y="88" width="32" height="32"/>
    <rect class="dg-box" x="30" y="120" width="32" height="32"/><rect class="dg-box" x="62" y="120" width="32" height="32"/>
    <rect class="dg-fill" x="94" y="120" width="32" height="32"/><rect class="dg-box" x="126" y="120" width="32" height="32"/>
  </g>
  <text class="dg-s" x="200" y="46">one of the two solutions for n = 4</text>
  <text class="dg-s" x="200" y="76">column conflict:  same col</text>
  <text class="dg-s" x="200" y="100">diagonal ↘ :  same (row − col)</text>
  <text class="dg-s" x="200" y="124">diagonal ↙ :  same (row + col)</text>
  <text class="dg-s" x="200" y="150">three hash sets → each check is O(1) instead of O(n)</text>
</svg>
</figure>
<pre><code>// THE TEMPLATE — every backtracking problem is this shape
void backtrack(State state, List&lt;Solution&gt; out) {
    if (isComplete(state)) { out.add(snapshot(state)); return; }

    for (Choice c : candidates(state)) {
        if (!isValid(state, c)) continue;   // PRUNE — this is where the speed comes from
        apply(state, c);                    // choose
        backtrack(state, out);              // explore
        undo(state, c);                     // un-choose
    }
}</code></pre>
<table>
<tr><th>Problem</th><th>Choice at each step</th><th>Pruning rule</th></tr>
<tr><td>N-Queens</td><td>Column for this row</td><td>Column / diagonal already attacked</td></tr>
<tr><td>Sudoku solver</td><td>Digit for the next empty cell</td><td>Row, column or 3×3 box conflict</td></tr>
<tr><td>Permutations</td><td>Next unused element</td><td><code>used[]</code> flag; skip equal siblings for duplicates</td></tr>
<tr><td>Subsets / combinations</td><td>Include or skip index i</td><td>Start index prevents reordering</td></tr>
<tr><td>Combination sum</td><td>Next candidate</td><td>Remaining target goes negative</td></tr>
<tr><td>Word search in a grid</td><td>Adjacent cell</td><td>Character mismatch, or already on the path</td></tr>
<tr><td>Palindrome partitioning</td><td>Next cut position</td><td>Prefix is not a palindrome</td></tr>
</table>
<p><strong>The two things that decide a backtracking answer:</strong></p>
<ul>
<li><strong>Undo exactly what you did.</strong> A missing removal silently corrupts every later branch, and the bug appears far from its cause.</li>
<li><strong>Add a copy, not the live state.</strong> <code>out.add(current)</code> stores a reference that keeps mutating — you end up with a list of identical empty results. It must be <code>new ArrayList&lt;&gt;(current)</code>.</li>
</ul>
<p><strong>On complexity, be honest:</strong> N-Queens is roughly O(n!) in the worst case, and pruning changes the constant rather than the class. Backtracking is exhaustive search made practical, not made polynomial — saying that plainly is better than claiming a bound you cannot defend.</p>`
}
]);
