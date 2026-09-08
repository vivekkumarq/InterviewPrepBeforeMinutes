appendTopic("react", [
{
  q: "Why is my React component re-rendering, and how do I stop it?",
  level: "advanced", hot: true, tags: ["performance", "hooks"],
  companies: ["Amazon", "Meta", "Flipkart", "Walmart", "Adobe", "Optum", "EPAM"],
  a: `<p><strong>A component re-renders when</strong> its state changes, its parent re-renders, its context value changes, or a hook it uses signals an update. Note the second one: <em>a parent re-render re-renders every child by default</em>, regardless of whether props changed.</p>
<pre><code>// The bug: a new object/function identity on every parent render
function Parent() {
  const [count, setCount] = useState(0);
  const config = { theme: 'dark' };                 // NEW object each render
  const onSave = () =&gt; api.save();                  // NEW function each render
  return &lt;Child config={config} onSave={onSave} /&gt;; // memo() is useless here
}

// The fix
const Parent = () =&gt; {
  const [count, setCount] = useState(0);
  const config = useMemo(() =&gt; ({ theme: 'dark' }), []);
  const onSave = useCallback(() =&gt; api.save(), []);
  return &lt;Child config={config} onSave={onSave} /&gt;;
};
const Child = memo(function Child({ config, onSave }) { /* ... */ });</code></pre>
<p><strong>But reach for composition before memoisation</strong> — it is free and does not need dependency arrays:</p>
<pre><code>// Pattern 1: move the state DOWN, so the expensive tree is not in its render path
function Parent() {
  return &lt;&gt;&lt;Counter /&gt;&lt;ExpensiveTree /&gt;&lt;/&gt;;   // Counter owns its own state now
}

// Pattern 2: pass the expensive part as CHILDREN — it is created by the grandparent,
// so its element identity is stable and it does not re-render with the state owner
function Wrapper({ children }) {
  const [open, setOpen] = useState(false);
  return &lt;div&gt;{children}&lt;/div&gt;;
}
&lt;Wrapper&gt;&lt;ExpensiveTree /&gt;&lt;/Wrapper&gt;</code></pre>
<table>
<tr><th>Tool</th><th>Memoises</th><th>Cost</th></tr>
<tr><td><code>memo</code></td><td>The component, on shallow prop equality</td><td>A prop comparison per render</td></tr>
<tr><td><code>useMemo</code></td><td>A computed value</td><td>Dependency array comparison + retained memory</td></tr>
<tr><td><code>useCallback</code></td><td>A function identity</td><td>Same — only useful if the consumer is memoised</td></tr>
<tr><td><code>useTransition</code></td><td>—</td><td>Marks an update non-urgent so typing stays responsive</td></tr>
</table>
<p><strong>The context trap:</strong> every consumer of a context re-renders when the provider's <em>value</em> changes — and <code>value={{ user, setUser }}</code> is a new object every render. Memoise the value, or split into two contexts (one for the rarely-changing data, one for the setters, which never change).</p>
<p><strong>What to say about React 19:</strong> "The React Compiler auto-memoises, so most manual <code>useMemo</code>/<code>useCallback</code> becomes unnecessary. Until it is in the project, my rule is still: measure with the Profiler first. Memoising everything adds real overhead and a lot of dependency-array bugs for no gain — the honest answer is that most re-renders are cheap and only the ones the Profiler flags are worth fixing."</p>`
},
{
  q: "How do you fetch data in React without race conditions or memory leaks?",
  level: "advanced", hot: true, tags: ["hooks", "async"],
  companies: ["Amazon", "Meta", "Flipkart", "Adobe", "Walmart", "Optum", "Persistent"],
  a: `<pre><code>// The classic bug: type "a", then "ab" quickly. The "a" response may land LAST
// and overwrite the "ab" results. Users see the wrong data with no error.
useEffect(() =&gt; {
  fetch(\`/api/search?q=\${query}\`)
    .then(r =&gt; r.json())
    .then(setResults);          // ✗ no cancellation, no ordering guarantee
}, [query]);

// Fix 1: AbortController — cancels the request AND ignores the stale response
useEffect(() =&gt; {
  const ac = new AbortController();
  setStatus('loading');

  fetch(\`/api/search?q=\${encodeURIComponent(query)}\`, { signal: ac.signal })
    .then(r =&gt; { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data =&gt; { setResults(data); setStatus('ok'); })
    .catch(e =&gt; { if (e.name !== 'AbortError') setStatus('error'); });

  return () =&gt; ac.abort();      // cleanup runs before the next effect and on unmount
}, [query]);

// Fix 2: an "ignore" flag, when you cannot abort
useEffect(() =&gt; {
  let ignore = false;
  load().then(d =&gt; { if (!ignore) setData(d); });
  return () =&gt; { ignore = true; };
}, [id]);</code></pre>
<p><strong>The honest recommendation:</strong> do not hand-roll this. A data library gives you request deduplication, caching, background refetch, retry, pagination and stale-while-revalidate — hundreds of lines you would otherwise write badly.</p>
<pre><code>// TanStack Query — the same feature in four lines, with caching
const { data, isPending, error } = useQuery({
  queryKey: ['search', query],           // the key IS the cache identity
  queryFn: ({ signal }) =&gt; api.search(query, { signal }),
  staleTime: 30_000,
  placeholderData: keepPreviousData      // no flicker while the next page loads
});

// Mutations with optimistic update and rollback
const { mutate } = useMutation({
  mutationFn: api.updateOrder,
  onMutate: async (next) =&gt; {
    await qc.cancelQueries({ queryKey: ['order', next.id] });
    const prev = qc.getQueryData(['order', next.id]);
    qc.setQueryData(['order', next.id], next);
    return { prev };
  },
  onError: (_e, next, ctx) =&gt; qc.setQueryData(['order', next.id], ctx.prev),
  onSettled: (_d, _e, next) =&gt; qc.invalidateQueries({ queryKey: ['order', next.id] })
});</code></pre>
<table>
<tr><th>Symptom</th><th>Cause</th></tr>
<tr><td>The effect fires twice in dev</td><td>StrictMode double-invokes effects deliberately — to expose missing cleanup. Do not "fix" it with a ref; fix the cleanup.</td></tr>
<tr><td>Infinite loop</td><td>An object or array in the dependency array, recreated each render</td></tr>
<tr><td>Stale value inside the callback</td><td>A closure captured an old render's variable — add it to the deps or use a ref</td></tr>
<tr><td>"Cannot update state on unmounted component"</td><td>Missing cleanup (React 18+ no longer warns, but the leak is real)</td></tr>
</table>
<p><strong>And the framing that scores:</strong> "In a modern app I would not use <code>useEffect</code> for data fetching at all — server components or a route loader fetch on the server, which removes the client waterfall entirely. <code>useEffect</code> is for synchronising with something outside React, not for loading data."</p>`
},
{
  q: "How do you manage state in a large React application?",
  level: "advanced", tags: ["state", "architecture"],
  companies: ["Amazon", "Meta", "Flipkart", "Adobe", "Walmart", "Swiggy", "EPAM"],
  a: `<p><strong>The first move is to classify the state</strong>, because most "state management" problems are really one category being handled with the wrong tool:</p>
<table>
<tr><th>Kind</th><th>Example</th><th>Right tool</th></tr>
<tr><td><strong>Server cache</strong></td><td>Orders fetched from an API</td><td>TanStack Query / RTK Query — <em>not</em> Redux by hand</td></tr>
<tr><td><strong>URL state</strong></td><td>Filters, page number, tab</td><td>Search params — shareable, survives refresh, free back button</td></tr>
<tr><td><strong>Local UI state</strong></td><td>Is the dropdown open</td><td><code>useState</code> in the component</td></tr>
<tr><td><strong>Form state</strong></td><td>The in-progress values</td><td>React Hook Form — uncontrolled, avoids per-keystroke renders</td></tr>
<tr><td><strong>Global client state</strong></td><td>Theme, auth session, cart</td><td>Context (rarely changing) or Zustand/Jotai</td></tr>
</table>
<p><strong>The observation that matters:</strong> the majority of what teams put in Redux is server cache. Once that moves to a query library, the genuinely global client state left over is usually small enough for Context or Zustand, and the Redux boilerplate disappears.</p>
<pre><code>// Zustand — no provider, no boilerplate, selectors prevent over-rendering
const useCart = create&lt;CartState&gt;((set) =&gt; ({
  items: [],
  add:    (item) =&gt; set(s =&gt; ({ items: [...s.items, item] })),
  remove: (id)   =&gt; set(s =&gt; ({ items: s.items.filter(i =&gt; i.id !== id) }))
}));

// This component re-renders ONLY when the count changes, not on every cart change
const count = useCart(s =&gt; s.items.length);</code></pre>
<pre><code>// useReducer for complex local state with interdependent fields
type Action = { type: 'submit' } | { type: 'success'; data: Order } | { type: 'error'; msg: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'submit':  return { ...state, status: 'saving', error: null };
    case 'success': return { status: 'idle', order: action.data, error: null };
    case 'error':   return { ...state, status: 'idle', error: action.msg };
  }
}
// Beats five useState calls: impossible combinations (saving AND error) cannot exist.</code></pre>
<p><strong>Two principles to state:</strong></p>
<ul>
<li><strong>Keep state as local as possible.</strong> Lift it only when a second component genuinely needs it. Global-by-default makes every change a potential app-wide re-render and makes components untestable in isolation.</li>
<li><strong>Do not duplicate derived state.</strong> If <code>total</code> can be computed from <code>items</code>, compute it during render — storing it creates two sources of truth that drift.</li>
</ul>`
},
{
  q: "Explain the virtual DOM, reconciliation and why keys matter",
  level: "beginner", hot: true, tags: ["core", "basics"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Amazon", "Adobe"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="Virtual DOM diff and patch cycle">
  <rect class="dg-fill" x="14" y="52" width="112" height="46" rx="8"/><text class="dg-s" x="70" y="72" text-anchor="middle">setState</text><text class="dg-s" x="70" y="90" text-anchor="middle">triggers render</text>
  <path class="dg-line" d="M130 75 H172" marker-end="url(#r1)"/>
  <rect class="dg-fill" x="176" y="52" width="120" height="46" rx="8"/><text class="dg-s" x="236" y="72" text-anchor="middle">new virtual</text><text class="dg-s" x="236" y="90" text-anchor="middle">tree built</text>
  <path class="dg-line" d="M300 75 H342" marker-end="url(#r1)"/>
  <rect class="dg-fill2" x="346" y="52" width="120" height="46" rx="8"/><text class="dg-s" x="406" y="72" text-anchor="middle">diff against</text><text class="dg-s" x="406" y="90" text-anchor="middle">previous tree</text>
  <path class="dg-line" d="M470 75 H512" marker-end="url(#r1)"/>
  <rect class="dg-box" x="516" y="52" width="92" height="46" rx="8"/><text class="dg-s" x="562" y="72" text-anchor="middle">minimal</text><text class="dg-s" x="562" y="90" text-anchor="middle">DOM writes</text>
  <text class="dg-s" x="300" y="140" text-anchor="middle">the win is batching many changes into ONE layout/paint, not raw diff speed</text>
  <defs><marker id="r1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p>The virtual DOM is a lightweight JavaScript description of the UI. On each render React builds a new one, <strong>diffs it against the previous</strong>, and applies only the differences to the real DOM. Direct DOM manipulation is not slow in itself — what is slow is the layout and paint work triggered by many uncoordinated writes, and batching avoids that.</p>
<p><strong>The diff uses two heuristics</strong> to stay O(n) rather than O(n³):</p>
<ol>
<li><strong>Different element types produce different trees.</strong> Changing <code>&lt;div&gt;</code> to <code>&lt;span&gt;</code> unmounts the whole subtree and rebuilds it — all state inside is lost.</li>
<li><strong>Keys identify children across renders.</strong> Without them React matches list children by position.</li>
</ol>
<pre><code>// The index-as-key bug, with a concrete failure
const [items, setItems] = useState(['Apple', 'Banana', 'Cherry']);

{items.map((item, i) =&gt; &lt;Row key={i} name={item} /&gt;)}   // ✗

// Delete 'Apple'. Now index 0 = 'Banana'.
// React thinks the element at key 0 just changed its NAME prop,
// so it REUSES the DOM node and its internal state:
//   - the checkbox you ticked on Apple is now ticked on Banana
//   - the text you typed in Apple's input stays in Banana's input
//   - a CSS animation does not replay

{items.map(item =&gt; &lt;Row key={item.id} name={item.name} /&gt;)}   // ✔ stable identity</code></pre>
<table>
<tr><th>Key choice</th><th>Verdict</th></tr>
<tr><td>A stable unique ID from the data</td><td>Correct</td></tr>
<tr><td>Array index</td><td>Only if the list never reorders, filters or deletes</td></tr>
<tr><td><code>Math.random()</code></td><td>Never — remounts every row on every render, the worst case</td></tr>
</table>
<p><strong>The trick worth knowing:</strong> because a key change remounts a component, you can use it deliberately — <code>&lt;ProfileForm key={userId} /&gt;</code> resets the entire form when you switch user, with no reset logic at all.</p>`
}
]);
