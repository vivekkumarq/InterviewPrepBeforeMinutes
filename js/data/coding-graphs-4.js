appendTopic("coding-graphs", [
{
  q: "How do you represent a graph, and how does the representation change the complexity?",
  level: "beginner", hot: true, tags: ["graphs", "representation", "complexity", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "TCS", "Infosys", "Flipkart", "Oracle"],
  a: `<table>
<tr><th>Representation</th><th>Space</th><th>Has edge (u,v)?</th><th>Iterate neighbours</th></tr>
<tr><td><strong>Adjacency list</strong></td><td>O(V + E)</td><td>O(degree)</td><td><strong>O(degree)</strong></td></tr>
<tr><td><strong>Adjacency matrix</strong></td><td>O(V²)</td><td><strong>O(1)</strong></td><td>O(V) — even for an isolated node</td></tr>
<tr><td>Edge list</td><td>O(E)</td><td>O(E)</td><td>O(E)</td></tr>
</table>
<p><strong>The rule:</strong> adjacency list unless the graph is dense (E approaching V²) or you need constant-time edge lookup. Real-world graphs — roads, social networks, dependencies — are sparse, so the list wins almost always. An edge list is what Kruskal's and Bellman-Ford consume directly.</p>
<pre><code>// BUILDING AN ADJACENCY LIST from an edge array — write this fluently
List&lt;List&lt;Integer&gt;&gt; adj = new ArrayList&lt;&gt;();
for (int i = 0; i &lt; n; i++) adj.add(new ArrayList&lt;&gt;());
for (int[] e : edges) {
    adj.get(e[0]).add(e[1]);
    adj.get(e[1]).add(e[0]);        // OMIT this line for a DIRECTED graph
}
// With weights, store int[]{neighbour, weight} or a small record.
// An array of lists is faster than a Map&lt;Integer,List&lt;Integer&gt;&gt; when the
// nodes are 0..n-1 — which they usually are in interview problems.

// BFS and DFS are both O(V + E) on an adjacency list, and O(V^2) on a matrix.
// If a solution is timing out, the representation is worth checking before
// the algorithm.</code></pre>
<table>
<tr><th>Graph property</th><th>How to detect it</th></tr>
<tr><td>Connected</td><td>One traversal reaches every node</td></tr>
<tr><td>Number of components</td><td>Count how many times you must restart a traversal</td></tr>
<tr><td><strong>Bipartite</strong></td><td>Two-colour with BFS; a conflict means an odd-length cycle exists</td></tr>
<tr><td>Cycle, undirected</td><td>A visited neighbour that is not the parent</td></tr>
<tr><td>Cycle, directed</td><td>A back edge to a node still on the recursion stack (the grey state)</td></tr>
<tr><td><strong>Tree</strong></td><td>Connected, and exactly <code>V − 1</code> edges, and no cycle</td></tr>
<tr><td>DAG</td><td>A topological order exists — equivalently, no cycle</td></tr>
<tr><td>Strongly connected (directed)</td><td>Kosaraju or Tarjan — worth naming, rarely required to code</td></tr>
</table>
<pre><code>// BIPARTITE CHECK — a real interview favourite ("possible bipartition",
// "is graph bipartite", "divide people into two groups")
int[] colour = new int[n];                  // 0 unvisited, 1 and -1 the sides
for (int start = 0; start &lt; n; start++) {
    if (colour[start] != 0) continue;       // handle DISCONNECTED components
    Deque&lt;Integer&gt; q = new ArrayDeque&lt;&gt;();
    q.offer(start); colour[start] = 1;
    while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : adj.get(u)) {
            if (colour[v] == colour[u]) return false;      // same side — clash
            if (colour[v] == 0) { colour[v] = -colour[u]; q.offer(v); }
        }
    }
}
return true;
// The outer loop over every start node is the line people forget. A graph
// can be bipartite in one component and not in another, and a single BFS
// from node 0 never sees the rest.</code></pre>
<pre><code>// IMPLICIT GRAPHS — the ones that do not look like graphs
// Word ladder        nodes = words,  edges = one letter apart  -> BFS
// Open the lock      nodes = 4-digit states, edges = one turn  -> BFS
// Jump game III      nodes = indices, edges = i +/- a[i]       -> BFS/DFS
// Evaluate division  nodes = variables, weighted edges = ratio -> DFS product
// Course schedule    nodes = courses, edges = prerequisites    -> topo sort
// Sliding puzzle     nodes = board configurations              -> BFS
//
// The tell: "shortest number of steps", "can you reach", "in how many moves".
// Recognising a graph inside a problem that never says "graph" is most of
// what these questions test.</code></pre>
<p><strong>Complexity to quote:</strong> BFS and DFS are O(V + E) with an adjacency list — not O(V) and not O(E), because you touch every node and every edge. Space is O(V) for the visited set and the queue, plus O(V) recursion depth for DFS, which is the detail that decides whether DFS overflows the stack on a large graph.</p>`
}
]);
