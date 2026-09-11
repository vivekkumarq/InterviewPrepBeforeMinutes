appendTopic("coding-graphs", [
{
  q: "Multi-source BFS and shortest path in a grid",
  level: "advanced", hot: true, tags: ["bfs", "grid", "graphs", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart"],
  a: `<p><strong>The idea:</strong> seed the queue with <em>every</em> source before the loop starts. BFS then expands from all of them simultaneously, and the first time it reaches a cell, that is the distance to the nearest source — with no extra passes.</p>
<pre><code>// ROTTING ORANGES — how many minutes until every fresh orange rots?
public int orangesRotting(int[][] g) {
    Deque&lt;int[]&gt; q = new ArrayDeque&lt;&gt;();
    int fresh = 0;

    for (int r = 0; r &lt; g.length; r++)
        for (int c = 0; c &lt; g[0].length; c++) {
            if (g[r][c] == 2) q.offer(new int[]{r, c});   // EVERY rotten one
            else if (g[r][c] == 1) fresh++;
        }

    if (fresh == 0) return 0;                    // the edge case people miss
    int minutes = 0;
    int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};

    while (!q.isEmpty() &amp;&amp; fresh &gt; 0) {
        int size = q.size();                     // one LEVEL = one minute
        for (int i = 0; i &lt; size; i++) {
            int[] cur = q.poll();
            for (int[] d : DIRS) {
                int r = cur[0] + d[0], c = cur[1] + d[1];
                if (r &lt; 0 || r &gt;= g.length || c &lt; 0 || c &gt;= g[0].length) continue;
                if (g[r][c] != 1) continue;
                g[r][c] = 2;                     // mark on ENQUEUE
                fresh--;
                q.offer(new int[]{r, c});
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;            // some are unreachable
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="BFS expanding from several sources at once">
  <g>
    <rect class="dg-fill2" x="30" y="26" width="34" height="34" rx="4"/>
    <rect class="dg-fill" x="66" y="26" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="102" y="26" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="138" y="26" width="34" height="34" rx="4"/>
    <rect class="dg-fill2" x="174" y="26" width="34" height="34" rx="4"/>
    <rect class="dg-fill" x="30" y="62" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="66" y="62" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="102" y="62" width="34" height="34" rx="4"/>
    <rect class="dg-box" x="138" y="62" width="34" height="34" rx="4"/>
    <rect class="dg-fill" x="174" y="62" width="34" height="34" rx="4"/>
  </g>
  <text class="dg-s" x="250" y="44">two sources seeded together</text>
  <text class="dg-s" x="250" y="68">the wavefronts meet in the middle</text>
  <text class="dg-s" x="250" y="92">→ one BFS, not one per source</text>
  <text class="dg-s" x="16" y="134">single-source BFS from each source would be O(sources × cells); this is O(cells)</text>
</svg>
</figure>
<table>
<tr><th>Problem</th><th>Sources seeded</th></tr>
<tr><td>Rotting oranges</td><td>Every rotten cell</td></tr>
<tr><td>Walls and gates</td><td>Every gate</td></tr>
<tr><td>01 Matrix — distance to nearest 0</td><td>Every zero</td></tr>
<tr><td>As far from land as possible</td><td>Every land cell</td></tr>
<tr><td>Pacific-Atlantic water flow</td><td>Every border cell, <strong>flowing inward</strong></td></tr>
<tr><td>Word ladder (bidirectional)</td><td>Both ends, meeting in the middle</td></tr>
</table>
<pre><code>// The two rules that keep grid BFS correct AND linear
// 1. Mark visited on ENQUEUE, never on dequeue — otherwise a cell is queued
//    many times and the complexity degrades badly.
// 2. Capture q.size() before the inner loop — that is what separates levels,
//    and levels are what give you the distance.

// When the grid has WEIGHTS (cost to enter a cell), BFS is wrong: use
// Dijkstra with a priority queue. If the weights are only 0 and 1, use
// 0-1 BFS with a deque — addFirst for a 0 edge, addLast for a 1 edge.</code></pre>
<p><strong>The edge case that catches people:</strong> if there are no fresh oranges at all, the answer is 0 — not the number of levels BFS happens to run. And if some fresh orange is walled off, the answer is −1. Both come from state you must check <em>after</em> the loop, which is why the fresh counter is worth maintaining rather than rescanning the grid.</p>`
},
{
  q: "Detect and use strongly connected components and bipartite checks",
  level: "advanced", tags: ["graphs", "dfs", "coloring", "algorithms"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Goldman Sachs", "Uber", "Oracle"],
  a: `<pre><code>// BIPARTITE CHECK — can the graph be 2-coloured so no edge joins same colours?
public boolean isBipartite(int[][] adj) {
    int[] colour = new int[adj.length];          // 0 = unvisited, 1 and -1 = sides

    for (int start = 0; start &lt; adj.length; start++) {
        if (colour[start] != 0) continue;        // must handle DISCONNECTED parts
        Deque&lt;Integer&gt; q = new ArrayDeque&lt;&gt;();
        q.offer(start);
        colour[start] = 1;

        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v : adj[u]) {
                if (colour[v] == colour[u]) return false;   // same side — odd cycle
                if (colour[v] == 0) { colour[v] = -colour[u]; q.offer(v); }
            }
        }
    }
    return true;
}
// A graph is bipartite exactly when it has NO ODD-LENGTH CYCLE. That is the
// one-line justification to give.</code></pre>
<table>
<tr><th>Bipartite models</th><th>Example</th></tr>
<tr><td>Two groups with no internal edges</td><td>Splitting people into two teams who all dislike each other</td></tr>
<tr><td>Matching problems</td><td>Jobs to workers, students to projects</td></tr>
<tr><td>Conflict graphs</td><td>"Is this schedule 2-colourable?"</td></tr>
</table>
<pre><code>// STRONGLY CONNECTED COMPONENTS — Kosaraju, two passes, easy to remember
// 1. DFS the graph, pushing each node onto a stack when it FINISHES
// 2. REVERSE every edge
// 3. Pop from the stack; each DFS on the reversed graph is one SCC
//
// An SCC is a maximal set where every node can reach every other node.
// Condensing each SCC to a single node always yields a DAG — which is what
// makes it useful: you can then topologically sort a cyclic graph.

// Tarjan does it in ONE pass using discovery times and low-links. Faster,
// harder to reproduce under pressure. Name both; implement Kosaraju.</code></pre>
<table>
<tr><th>Where SCCs are actually used</th></tr>
<tr><td>Deadlock detection — a cycle in the wait-for graph</td></tr>
<tr><td>Dependency analysis — circular module or package imports</td></tr>
<tr><td>2-SAT solving — a clause set is satisfiable iff no variable shares an SCC with its negation</td></tr>
<tr><td>Collapsing a cyclic graph into a DAG so it can be ordered</td></tr>
</table>
<pre><code>// A related one worth knowing: BRIDGES and ARTICULATION POINTS
// A bridge is an edge whose removal disconnects the graph — a single point
// of failure. Found with one DFS tracking discovery time and low-link:
//   edge (u,v) is a bridge  iff  low[v] > disc[u]
// Real use: which network link, if it fails, partitions the cluster?</code></pre>
<p><strong>Interview framing:</strong> bipartite checking comes up far more often than SCCs and is genuinely easy — 2-colour with BFS and look for a conflict. For SCCs, describing Kosaraju's three steps and what an SCC <em>means</em> scores better than half-remembering Tarjan's low-link arithmetic.</p>`
}
]);
