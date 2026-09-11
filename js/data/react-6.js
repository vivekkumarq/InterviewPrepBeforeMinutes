appendTopic("react", [
{
  q: "How do you manage state in a React application, and when do you need a library?",
  level: "advanced", hot: true, tags: ["state", "architecture", "react"],
  companies: ["Amazon", "Meta", "Adobe", "Flipkart", "Walmart", "Optum", "EPAM", "Cognizant"],
  a: `<p><strong>Start by separating two things people conflate:</strong> client state (UI: a modal, a filter, a draft) and server state (a cache of data you do not own). They have completely different problems.</p>
<table>
<tr><th>Kind</th><th>Problems</th><th>Use</th></tr>
<tr><td><strong>Server state</strong></td><td>Loading, errors, staleness, refetching, dedupe, invalidation</td><td><strong>TanStack Query</strong>, SWR, or RSC + server actions</td></tr>
<tr><td>Local UI state</td><td>Just needs to change</td><td><code>useState</code> / <code>useReducer</code></td></tr>
<tr><td>Shared UI state</td><td>A few components need it</td><td>Lift it up; Context for low-frequency values</td></tr>
<tr><td>Global client state</td><td>Many readers, frequent writes</td><td>Zustand, Jotai, Redux Toolkit</td></tr>
<tr><td>URL-worthy state</td><td>Should be shareable and back-button correct</td><td><strong>Search params</strong></td></tr>
</table>
<pre><code>// Server state: the loading/error/stale machinery is the library's job
const { data, isPending, error, refetch } = useQuery({
  queryKey: ['orders', customerId],
  queryFn: () =&gt; api.orders(customerId),
  staleTime: 30_000,
});
// Dedupes concurrent requests for the same key, caches across components,
// refetches on window focus, and retries. Writing that by hand with
// useEffect is where most React state bugs come from.</code></pre>
<pre><code>// The Context performance trap
const AppContext = createContext();
&lt;AppContext.Provider value={{ user, theme, cart }}&gt;      // ✗ one object

// EVERY consumer re-renders when ANY of the three changes, because the value
// is a new object every render.
// Fixes: split into separate contexts by change frequency; memoise the value;
// or use a store with selectors so a component subscribes to one slice.</code></pre>
<pre><code>// Zustand — a store with selector subscriptions, very little ceremony
const useCart = create((set) =&gt; ({
  items: [],
  add: (i) =&gt; set((s) =&gt; ({ items: [...s.items, i] })),
}));
const count = useCart((s) =&gt; s.items.length);    // re-renders ONLY when the
                                                  // selected value changes</code></pre>
<table>
<tr><th>Rule</th><th>Reason</th></tr>
<tr><td>Derive, do not store</td><td>If it can be computed from existing state, it is not state</td></tr>
<tr><td>Keep state as local as possible</td><td>Lifting it up is easy later; pulling it down is not</td></tr>
<tr><td>Do not mirror props into state</td><td>The two drift, and you need an effect to sync them</td></tr>
<tr><td>One source of truth per value</td><td>Two copies will disagree</td></tr>
<tr><td>Put filters and pagination in the URL</td><td>Free sharing, refresh and back-button behaviour</td></tr>
</table>
<p><strong>The honest recommendation:</strong> "Most apps that reach for Redux are really solving a server-cache problem. Adding a query library usually removes 60–70% of the store outright, and what is left is small enough for <code>useState</code> plus one lightweight store. I would only reach for Redux Toolkit on a large team where the enforced pattern and the devtools time-travel are worth the boilerplate."</p>`
},
{
  q: "How do you find and fix React performance problems?",
  level: "advanced", tags: ["performance", "profiling", "react"],
  companies: ["Amazon", "Meta", "Adobe", "Flipkart", "Uber", "Walmart", "Optum"],
  a: `<pre><code>// 1. MEASURE FIRST — React DevTools Profiler, "Highlight updates while rendering"
//    It tells you WHICH component re-rendered and WHY.
// 2. Only then optimise. Memoising everything makes things slower, not faster:
//    every memo has a comparison cost and a memory cost.</code></pre>
<table>
<tr><th>Symptom</th><th>Usual cause</th><th>Fix</th></tr>
<tr><td>Typing lags in a form</td><td>Every keystroke re-renders a large tree</td><td><code>useDeferredValue</code>, or keep the input state local</td></tr>
<tr><td>A long list is slow</td><td>Thousands of DOM nodes</td><td><strong>Virtualise</strong> — TanStack Virtual, react-window</td></tr>
<tr><td>Everything re-renders on any change</td><td>One big Context object</td><td>Split contexts; use store selectors</td></tr>
<tr><td>A child re-renders with identical props</td><td>A new object or function created each render</td><td><code>useMemo</code>/<code>useCallback</code> + <code>React.memo</code></td></tr>
<tr><td>Slow first load</td><td>One large bundle</td><td><code>React.lazy</code> + Suspense, route-level splitting</td></tr>
<tr><td>Layout jumps</td><td>Images without dimensions</td><td>Set width/height or an aspect ratio</td></tr>
</table>
<pre><code>// React.memo only helps if the props are actually stable
const Row = React.memo(({ order, onSelect }) =&gt; &lt;li onClick={onSelect}&gt;…&lt;/li&gt;);

// ✗ a NEW function every render defeats the memo entirely
&lt;Row order={o} onSelect={() =&gt; select(o.id)} /&gt;

// ✔ stabilise it
const onSelect = useCallback((id) =&gt; select(id), [select]);
&lt;Row order={o} onSelect={onSelect} /&gt;</code></pre>
<pre><code>// The key prop — a correctness issue that shows up as a performance one
{items.map((it, i) =&gt; &lt;Row key={i} … /&gt;)}     // ✗ index as key
// On insert or reorder, React reuses the wrong DOM node: input values jump
// to the wrong row and animations replay. Use a STABLE id:
{items.map((it) =&gt; &lt;Row key={it.id} … /&gt;)}    // ✔</code></pre>
<pre><code>// Concurrent features, for when work is genuinely expensive
const deferred = useDeferredValue(query);      // the input stays responsive;
                                                // the heavy list lags behind
const [isPending, startTransition] = useTransition();
startTransition(() =&gt; setTab(next));           // mark it non-urgent</code></pre>
<p><strong>The React Compiler is worth naming:</strong> it memoises automatically at build time, which removes most manual <code>useMemo</code> and <code>useCallback</code>. Where it is adopted, the advice shifts from "memoise carefully" to "write plain code and let the compiler handle it" — so it is worth knowing whether the team is using it before optimising by hand.</p>
<p><strong>What to say:</strong> "I profile before changing anything, because the intuitive culprit is usually wrong. The biggest wins are almost never micro-memoisation — they are virtualising a long list, splitting a bundle, or realising a Context was re-rendering the whole tree."</p>`
}
]);
