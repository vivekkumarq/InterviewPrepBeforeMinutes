registerPrimer("coding-graphs", `<p class="pr-lead">A <b>graph</b> is a set of things (called <b>nodes</b>) connected by links (called <b>edges</b>). Cities joined by roads, people connected as friends, courses linked by prerequisites, and squares on a map next to each other are all graphs. Most graph problems come down to exploring from a starting point without visiting anything twice.</p>
<div class="pr-analogy"><b>Think of it like this</b>Imagine a rumour spreading. On day 1 you tell your friends; on day 2 they tell their friends; and so on, ring by ring. That is <b>breadth-first search (BFS)</b>: explore everyone one step away, then two steps, then three, which naturally finds the fewest steps to anyone. Now imagine exploring a maze by always taking the next unexplored corridor as far as it goes, then backing up. That is <b>depth-first search (DFS)</b>.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Node (vertex) / edge</dt><dd>A thing, and a connection between two things.</dd>
<dt>Directed / undirected</dt><dd>Directed edges go one way (A follows B); undirected edges go both ways (A and B are friends).</dd>
<dt>Weighted</dt><dd>Each edge has a cost, such as a distance or a price.</dd>
<dt>Adjacency list</dt><dd>The usual way to store a graph: for each node, a list of its neighbours.</dd>
<dt>Visited set</dt><dd>A record of nodes already explored, so you never process one twice or loop forever.</dd>
<dt>BFS / DFS</dt><dd>Breadth-first (ring by ring, using a queue) and depth-first (one path as deep as possible, using recursion or a stack).</dd>
<dt>Cycle</dt><dd>A path that leads back to where it started.</dd>
</dl>

<h3>Step by step: breadth-first search</h3>
<ol class="pr-steps">
<li>Put the starting node in a <b>queue</b> and mark it as visited.</li>
<li>Take the node at the front of the queue.</li>
<li>For each of its neighbours that has not been visited, mark it visited and add it to the back of the queue.</li>
<li>Repeat until the queue is empty or you find what you are looking for.</li>
<li>Because nodes are explored in rings, the first time you reach a node is by the fewest possible steps.</li>
</ol>
<p>DFS is the same idea with a stack (or recursion) instead of a queue, which goes deep first instead of wide.</p>
<figure class="fig">
<svg viewBox="0 0 620 230" role="img" aria-label="BFS explores a graph level by level using a queue; DFS goes deep along one path first using a stack or recursion">
  <line class="dg-line" x1="80" y1="40" x2="40" y2="100"/>
  <line class="dg-line" x1="80" y1="40" x2="120" y2="100"/>
  <line class="dg-line" x1="40" y1="100" x2="40" y2="160"/>
  <line class="dg-line" x1="120" y1="100" x2="120" y2="160"/>
  <line class="dg-line" x1="120" y1="100" x2="180" y2="160"/>
  <circle class="dg-fill" cx="80" cy="40" r="16"/><text class="dg-m" x="80" y="45" text-anchor="middle">A</text>
  <circle class="dg-fill2" cx="40" cy="100" r="16"/><text class="dg-m" x="40" y="105" text-anchor="middle">B</text>
  <circle class="dg-fill2" cx="120" cy="100" r="16"/><text class="dg-m" x="120" y="105" text-anchor="middle">C</text>
  <circle class="dg-box" cx="40" cy="160" r="16"/><text class="dg-m" x="40" y="165" text-anchor="middle">D</text>
  <circle class="dg-box" cx="120" cy="160" r="16"/><text class="dg-m" x="120" y="165" text-anchor="middle">E</text>
  <circle class="dg-box" cx="180" cy="160" r="16"/><text class="dg-m" x="180" y="165" text-anchor="middle">F</text>
  <text class="dg-s" x="10" y="204">level 0: A    level 1: B C    level 2: D E F</text>
  <rect class="dg-fill2" x="240" y="24" width="370" height="84" rx="9"/>
  <text class="dg-t" x="254" y="46">BFS (queue): A, B, C, D, E, F</text>
  <text class="dg-s" x="254" y="66">nearest first, ring by ring</text>
  <text class="dg-s" x="254" y="84">gives SHORTEST PATHS when every edge costs the same</text>
  <text class="dg-s" x="254" y="100">grids, "minimum steps", word ladder, levels of a tree</text>
  <rect class="dg-fill" x="240" y="120" width="370" height="84" rx="9"/>
  <text class="dg-t" x="254" y="142">DFS (stack or recursion): A, B, D, C, E, F</text>
  <text class="dg-s" x="254" y="162">one path as deep as it goes, then back up</text>
  <text class="dg-s" x="254" y="180">cycles, connected components, topological sort,</text>
  <text class="dg-s" x="254" y="196">"all paths", backtracking</text>
</svg>
<figcaption>Same graph, same visited set; only the container differs. Queue gives breadth, stack gives depth.</figcaption>
</figure>

<h3>A worked example: number of islands</h3>
<p>A grid of <code>'1'</code> (land) and <code>'0'</code> (water). Count the islands: groups of land squares connected up, down, left or right.</p>
<pre><code>static int numIslands(char[][] grid) {
    int count = 0;
    for (int r = 0; r &lt; grid.length; r++)
        for (int c = 0; c &lt; grid[0].length; c++)
            if (grid[r][c] == '1') {        // found unexplored land
                count++;                    // it starts a new island
                sink(grid, r, c);           // mark the whole island as explored
            }
    return count;
}

static void sink(char[][] g, int r, int c) {
    if (r &lt; 0 || c &lt; 0 || r &gt;= g.length || c &gt;= g[0].length || g[r][c] != '1') return;
    g[r][c] = '0';                          // mark visited by turning it to water
    sink(g, r + 1, c); sink(g, r - 1, c);   // explore down and up
    sink(g, r, c + 1); sink(g, r, c - 1);   // explore right and left
}</code></pre>
<ol class="pr-steps">
<li>The grid is a graph: each land square is a node, and its neighbours are the squares above, below, left and right.</li>
<li>Scanning the grid, the first land square we meet that is unexplored must belong to a new island, so we add 1.</li>
<li><code>sink</code> runs a DFS from there, turning every connected land square into water, so the same island is never counted twice.</li>
<li>The first line of <code>sink</code> stops at the grid's edges, at water, and at squares already explored.</li>
<li>Every square is visited a constant number of times, so it runs in O(rows × columns).</li>
</ol>

<h3>Choosing the right algorithm</h3>
<ul>
<li><b>Fewest steps, all edges equal:</b> BFS.</li>
<li><b>Cheapest path with weights (no negative costs):</b> Dijkstra's algorithm, using a priority queue.</li>
<li><b>Order tasks that depend on each other:</b> topological sort.</li>
<li><b>"Are these two connected?" while links keep being added:</b> Union-Find.</li>
<li><b>Connect everything at the lowest total cost:</b> minimum spanning tree (Kruskal or Prim).</li>
<li><b>Try every possibility:</b> DFS with backtracking.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting to mark nodes as visited</p>
<p>Without a visited set, a cycle sends the search round and round forever.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> keep a visited set and check it before exploring any node.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Marking visited when removing from the queue</p>
<p>If you only mark a node when you take it out, it can be added to the queue many times by different neighbours first.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> mark a node as visited at the moment you add it to the queue.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using BFS for weighted shortest paths</p>
<p>BFS finds the fewest edges, not the lowest total cost, so it gives wrong answers when edges have different weights.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use Dijkstra's algorithm for weighted graphs with non-negative costs.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>A graph is nodes plus edges; store it as an adjacency list.</li>
<li>BFS uses a queue and finds the fewest steps; DFS goes deep using recursion or a stack.</li>
<li>Always keep a visited set.</li>
<li>Grids are graphs whose neighbours are up, down, left and right.</li>
<li>Most graph traversals run in O(V + E): every node and edge once.</li>
</ul>
<p><b>Next:</b> the questions below cover islands, course schedules, Dijkstra, Union-Find, spanning trees and backtracking.</p>`);

appendTopic("coding-graphs", [
{
  q: "Connect all cities at minimum cost: minimum spanning trees with Kruskal and Prim",
  level: "advanced", hot: true, tags: ["mst", "kruskal", "prim", "union-find", "greedy"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Goldman Sachs", "Samsung", "Walmart"],
  a: `<div class="cx"><b>O(E log E) time</b><span>sorting the edges (Kruskal)</span><b>O(V + E) space</b></div>
<p>You have cities and the cost of building a road between some pairs. Choose roads so every city is reachable from every other, at the lowest total cost. That set of roads is a <strong>minimum spanning tree</strong> (MST): it connects all V nodes with exactly V − 1 edges and no cycles. Same problem: laying cable, connecting servers, "min cost to connect all points".</p>
<pre><code>Cities 0-3, possible roads (a, b, cost):
  (0,1,1)  (1,2,2)  (0,2,3)  (2,3,4)  (1,3,5)

MST: 0-1 (1) + 1-2 (2) + 2-3 (4) = 7
0-2 (3) is skipped: 0 and 2 are already connected through 1.</code></pre>
<p><strong>Kruskal:</strong> sort all edges by cost, then take each edge if it joins two parts that are not yet connected. "Already connected?" is exactly what Union-Find answers in near-constant time.</p>
<pre><code>static int kruskal(int n, int[][] edges) {        // edges: {a, b, cost}
    Arrays.sort(edges, Comparator.comparingInt(e -&gt; e[2]));
    int[] parent = new int[n];
    for (int i = 0; i &lt; n; i++) parent[i] = i;

    int total = 0, used = 0;
    for (int[] e : edges) {
        int ra = find(parent, e[0]), rb = find(parent, e[1]);
        if (ra == rb) continue;                   // would create a cycle
        parent[ra] = rb;                          // union the two groups
        total += e[2];
        if (++used == n - 1) break;               // tree complete
    }
    return used == n - 1 ? total : -1;            // -1: graph not connected
}

static int find(int[] p, int x) {
    while (p[x] != x) { p[x] = p[p[x]]; x = p[x]; }   // path halving
    return x;
}</code></pre>
<p><strong>Prim:</strong> grow one tree from any start node. Repeatedly add the cheapest edge that leaves the tree, using a priority queue.</p>
<pre><code>static int prim(int n, List&lt;List&lt;int[]&gt;&gt; adj) {   // adj.get(u) = list of {v, cost}
    boolean[] inTree = new boolean[n];
    PriorityQueue&lt;int[]&gt; pq = new PriorityQueue&lt;&gt;(Comparator.comparingInt(x -&gt; x[1]));
    pq.offer(new int[]{0, 0});                     // {node, cost to reach it}
    int total = 0, count = 0;
    while (!pq.isEmpty() &amp;&amp; count &lt; n) {
        int[] cur = pq.poll();
        if (inTree[cur[0]]) continue;              // stale entry: already added
        inTree[cur[0]] = true;
        total += cur[1];
        count++;
        for (int[] e : adj.get(cur[0]))
            if (!inTree[e[0]]) pq.offer(new int[]{e[0], e[1]});
    }
    return count == n ? total : -1;
}</code></pre>
<table>
<tr><th></th><th>Kruskal</th><th>Prim</th></tr>
<tr><td>Grows</td><td>A forest that merges into one tree</td><td>One tree, one node at a time</td></tr>
<tr><td>Needs</td><td>An edge list + Union-Find</td><td>An adjacency list + a priority queue</td></tr>
<tr><td>Best for</td><td>Sparse graphs; edges already listed</td><td>Dense graphs; "all points" problems where every pair is an edge</td></tr>
<tr><td>Time</td><td>O(E log E)</td><td>O(E log V) with a heap</td></tr>
</table>
<p><strong>Why greedy works here</strong> (the "cut property"): split the nodes into any two groups; the cheapest edge crossing between them must be in some MST. Both algorithms only ever add such an edge, so they cannot go wrong.</p>
<p><strong>Do not confuse it with shortest paths:</strong> an MST minimises the <em>total</em> cost of the network, not the distance between two particular nodes. The path between two cities in the MST can be much longer than their direct shortest path. Dijkstra answers that question instead.</p>`
},
{
  q: "Work out an alien alphabet from a sorted list of words (topological sort)",
  level: "advanced", hot: true, tags: ["topological-sort", "graphs", "kahn", "hard"],
  companies: ["Google", "Meta", "Amazon", "Airbnb", "Uber", "Microsoft", "Pinterest"],
  a: `<div class="cx"><b>O(C) time</b><span>C = total characters in all words</span><b>O(1) space</b><span>at most 26 letters and their edges</span></div>
<p>An alien language uses English letters in a different order. You get a dictionary sorted in <em>their</em> order, for example <code>["wrt", "wrf", "er", "ett", "rftt"]</code>, and must return a valid letter order, here <code>"wertf"</code>. Return <code>""</code> if the input is contradictory.</p>
<p><strong>Step 1: turn it into a graph.</strong> Compare each pair of neighbouring words. The first position where they differ tells you one letter comes before another. Nothing after that position tells you anything.</p>
<pre><code>wrt  vs wrf   first difference t / f   -&gt;  t before f
wrf  vs er    w / e                    -&gt;  w before e
er   vs ett   r / t                    -&gt;  r before t
ett  vs rftt  e / r                    -&gt;  e before r

Edges: t-&gt;f, w-&gt;e, r-&gt;t, e-&gt;r      Chain: w -&gt; e -&gt; r -&gt; t -&gt; f</code></pre>
<p><strong>Step 2: topological sort</strong> (Kahn's algorithm): repeatedly output a letter with no remaining incoming edges.</p>
<pre><code>static String alienOrder(String[] words) {
    Map&lt;Character, Set&lt;Character&gt;&gt; adj = new HashMap&lt;&gt;();
    Map&lt;Character, Integer&gt; indegree = new HashMap&lt;&gt;();
    for (String w : words)
        for (char c : w.toCharArray()) {
            adj.putIfAbsent(c, new HashSet&lt;&gt;());
            indegree.putIfAbsent(c, 0);
        }

    for (int i = 0; i + 1 &lt; words.length; i++) {
        String a = words[i], b = words[i + 1];
        if (a.length() &gt; b.length() &amp;&amp; a.startsWith(b)) return "";   // "abc" before "ab": invalid
        for (int j = 0; j &lt; Math.min(a.length(), b.length()); j++) {
            char x = a.charAt(j), y = b.charAt(j);
            if (x != y) {
                if (adj.get(x).add(y)) indegree.merge(y, 1, Integer::sum);  // count each edge once
                break;                            // only the FIRST difference counts
            }
        }
    }

    Deque&lt;Character&gt; queue = new ArrayDeque&lt;&gt;();
    indegree.forEach((c, d) -&gt; { if (d == 0) queue.offer(c); });
    StringBuilder order = new StringBuilder();
    while (!queue.isEmpty()) {
        char c = queue.poll();
        order.append(c);
        for (char next : adj.get(c))
            if (indegree.merge(next, -1, Integer::sum) == 0) queue.offer(next);
    }
    return order.length() == indegree.size() ? order.toString() : "";   // leftover = cycle
}</code></pre>
<table>
<tr><th>Trap</th><th>Handling</th></tr>
<tr><td>A word followed by its own prefix (<code>"abc"</code>, <code>"ab"</code>)</td><td>Impossible in a sorted dictionary: return <code>""</code></td></tr>
<tr><td>The same pair seen twice</td><td>Only count indegree when the edge is new (<code>Set.add</code> returns true)</td></tr>
<tr><td>Letters that appear but have no order information</td><td>Still included: they start with indegree 0</td></tr>
<tr><td>Contradictions (a before b, b before a)</td><td>A cycle: the sort outputs fewer letters than exist, so return <code>""</code></td></tr>
<tr><td>Comparing beyond the first difference</td><td>Wrong: later letters are not ordered by that comparison</td></tr>
</table>
<p><strong>The recognisable pattern:</strong> "some things must come before others" means a directed graph plus topological sort. Course schedules, build order, task dependencies and spreadsheet recalculation are all this problem with a different story around it.</p>`
}
]);
