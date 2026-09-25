registerPrimer("coding-graphs", `<h3>The mental model: nodes, edges, and a visited set</h3>
<p>A graph is a set of <strong>nodes</strong> joined by <strong>edges</strong>: cities and roads, users and friendships, courses and prerequisites, cells in a grid and their neighbours. Almost every graph algorithm is a way of <strong>exploring from a starting node without visiting anything twice</strong>. The two basic ways differ only in the order they explore, and that order comes from the data structure holding "places still to visit".</p>
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
<h3>Worked example: shortest number of steps with BFS</h3>
<pre><code>// Graph as an adjacency list: node -&gt; its neighbours
Map&lt;String, List&lt;String&gt;&gt; g = Map.of(
    "A", List.of("B", "C"), "B", List.of("A", "D"),
    "C", List.of("A", "E", "F"), "D", List.of("B"),
    "E", List.of("C"), "F", List.of("C"));

static int steps(Map&lt;String, List&lt;String&gt;&gt; g, String from, String to) {
    Deque&lt;String&gt; queue = new ArrayDeque&lt;&gt;(List.of(from));
    Map&lt;String, Integer&gt; dist = new HashMap&lt;&gt;(Map.of(from, 0));   // doubles as "visited"
    while (!queue.isEmpty()) {
        String node = queue.poll();
        if (node.equals(to)) return dist.get(node);
        for (String next : g.getOrDefault(node, List.of())) {
            if (!dist.containsKey(next)) {           // mark when ADDING to the queue,
                dist.put(next, dist.get(node) + 1);  // not when removing, or a node
                queue.offer(next);                   // can be queued many times
            }
        }
    }
    return -1;                                       // unreachable
}

// steps(g, "A", "F"):
// queue [A]        dist {A:0}
// poll A -&gt; add B, C            dist {A:0, B:1, C:1}
// poll B -&gt; add D               dist {..., D:2}
// poll C -&gt; add E, F            dist {..., E:2, F:2}
// poll D, poll E, poll F -&gt; found: 2</code></pre>
<h3>Picking the algorithm</h3>
<table>
<tr><th>Question asks for</th><th>Use</th><th>Complexity</th></tr>
<tr><td>Fewest steps, all edges equal</td><td>BFS</td><td>O(V + E)</td></tr>
<tr><td>Cheapest path, non-negative weights</td><td>Dijkstra (priority queue)</td><td>O((V + E) log V)</td></tr>
<tr><td>Cheapest path with negative weights</td><td>Bellman-Ford</td><td>O(V · E)</td></tr>
<tr><td>Order tasks with prerequisites</td><td>Topological sort (Kahn's BFS or DFS)</td><td>O(V + E)</td></tr>
<tr><td>Are these connected? Merging groups</td><td>Union-Find</td><td>Almost O(1) per operation</td></tr>
<tr><td>Connect everything at minimum total cost</td><td>Minimum spanning tree (Kruskal, Prim)</td><td>O(E log E)</td></tr>
<tr><td>Explore all possibilities</td><td>DFS with backtracking</td><td>Often exponential</td></tr>
</table>`);

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
