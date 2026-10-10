registerSimple("coding-graphs", {
"Multi-source BFS and shortest path in a grid":
`When several starting points spread at the same time, such as rotting oranges or distance to the nearest exit, put all of them in the BFS queue before starting. BFS then grows outwards from all of them together, ring by ring, and the number of rounds gives the time or distance. Each cell is visited once, so it is O(rows × columns).`,

"Detect and use strongly connected components and bipartite checks":
`A <b>strongly connected component</b> is a group of nodes in a directed graph where each can reach every other; Kosaraju's or Tarjan's algorithm finds them. A graph is <b>bipartite</b> if its nodes can be split into two groups with no edges inside a group; check by colouring nodes in two colours with BFS and making sure neighbours never share a colour.`,

"How do you choose between BFS, DFS, Dijkstra, Bellman-Ford and A*?":
`<b>BFS</b>: fewest steps when every edge costs the same. <b>DFS</b>: exploring, detecting cycles, ordering tasks. <b>Dijkstra</b>: cheapest path when costs are not negative. <b>Bellman-Ford</b>: cheapest path when some costs are negative (slower). <b>A*</b>: like Dijkstra but guided by an estimate of the remaining distance, such as on a map, so it explores less.`,

"Union-Find (Disjoint Set Union) and where it beats DFS":
`Union-Find keeps track of which group each item belongs to. <code>find</code> returns a group's representative, and <code>union</code> merges two groups. With small optimisations, both are almost instant. It beats DFS when connections arrive one at a time and you keep asking "are these two connected now?", because DFS would have to search again each time.`,

"Grid problems: the traversal template and the variations built on it":
`Treat each cell as a node whose neighbours are the cells above, below, left and right. The template: loop over cells; when you find an unvisited cell of interest, explore from it with DFS or BFS, staying inside the grid and marking cells as visited. Islands, flood fill, the largest region and the shortest path in a maze are all small variations.`,

"How do you represent a graph, and how does the representation change the complexity?":
`An <b>adjacency list</b> stores, for each node, a list of its neighbours; it uses little memory and makes visiting neighbours fast, so it is the usual choice. An <b>adjacency matrix</b> is a grid where cell [u][v] says whether an edge exists; checking a specific edge is instant, but it uses V × V memory, so it suits small or very dense graphs.`,

"Connect all cities at minimum cost: minimum spanning trees with Kruskal and Prim":
`A minimum spanning tree connects every city using the cheapest total set of roads, with no loops. <b>Kruskal</b>: sort all roads by cost and add each one unless it would join two cities already connected (checked with Union-Find). <b>Prim</b>: start from one city and repeatedly add the cheapest road leading to a new city.`,

"Work out an alien alphabet from a sorted list of words (topological sort)":
`Compare each pair of neighbouring words: the first position where they differ tells you one letter comes before another, which becomes an edge. Then topologically sort the letters to get an order that respects every edge. If there is a cycle, or a longer word comes before its own prefix, no valid alphabet exists.`,

"Number of islands — the grid DFS/BFS template":
`Scan every cell of the grid. Each time you find land that has not been explored yet, add one island and explore all connected land from it with DFS or BFS, marking those cells as visited (or turning them to water). Each cell is processed a constant number of times, so it runs in O(rows × columns).`,

"Course schedule — topological sort and cycle detection":
`Courses are nodes, and "A must come before B" is an edge. Count how many prerequisites each course has. Start with courses that have none, and as each is "taken", reduce the count for the courses that depend on it, adding any that reach zero. If some courses are never reached, there is a cycle and the schedule is impossible.`,

"Dijkstra's algorithm — shortest path in a weighted graph":
`Keep a priority queue ordered by the distance found so far, starting with the source at 0. Repeatedly take the closest unfinished node, and for each neighbour check whether going through this node gives a shorter distance; if so, update it and add it to the queue. It only works when no edge cost is negative.`,

"Union-Find (disjoint set union) with path compression":
`Each item points to a parent, and the item at the top of the chain represents the group. <b>Path compression</b> makes every item visited during a <code>find</code> point straight to the top, so later lookups are instant. <b>Union by rank</b> attaches the smaller tree under the larger. Together, operations become practically constant time.`,

"Clone a graph and detect a cycle in an undirected graph":
`<b>Clone</b>: walk the graph with DFS or BFS, keeping a map from each original node to its copy. Create a node's copy and store it in the map before visiting its neighbours, so cycles reuse existing copies instead of looping. <b>Cycle in an undirected graph</b>: during DFS, reaching an already-visited node that is not the one you just came from means there is a cycle.`,

"Word ladder and shortest path in an unweighted graph":
`Each word is a node, and words that differ by one letter are connected. The fewest changes from the start word to the end word is a shortest path, so use BFS. To find neighbours quickly, try replacing each letter of the current word with a to z and check whether the result is in the word list.`,

"N-Queens and the backtracking template":
`Backtracking tries choices one at a time and undoes them when they lead nowhere. For N-Queens, place a queen in each row, trying each column that is not attacked; recurse to the next row; if no column works, go back and try the next option in the previous row. Tracking used columns and diagonals in sets makes each check instant.`
});
