registerTopic("react", [
{
  q: "What is React and what is the virtual DOM?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>React is a library for building user interfaces from composable components. You describe <em>what</em> the UI should look like for a given state, and React figures out the DOM operations needed to get there.</p>
<p><strong>The virtual DOM</strong> is a lightweight JavaScript representation of the UI tree. On a state change React builds a new tree, <strong>diffs</strong> it against the previous one (reconciliation), and applies the minimal set of real DOM mutations.</p>
<pre><code>// You write this — declarative
function OrderList({ orders }) {
  return (
    &lt;ul&gt;
      {orders.map(o =&gt; &lt;li key={o.id}&gt;{o.reference}&lt;/li&gt;)}
    &lt;/ul&gt;
  );
}
// React works out that only item 3's text changed, and updates one text node.</code></pre>
<p><strong>Why it matters:</strong> direct DOM manipulation is slow and imperative code describing <em>how</em> to update is where bugs live. Batching changes and applying a minimal diff is both faster and far easier to reason about.</p>
<p><strong>An honest nuance worth adding:</strong> the virtual DOM is not inherently faster than well-written manual DOM code — Svelte and SolidJS skip it entirely and are faster. Its real value is the <em>programming model</em>: you stop thinking about transitions and only describe states.</p>`
},
{
  q: "What are the rules of hooks and why do they exist?",
  level: "beginner", hot: true, tags: ["hooks"],
  a: `<p><strong>Two rules:</strong></p>
<ol>
<li><strong>Only call hooks at the top level</strong> — never inside conditions, loops or nested functions.</li>
<li><strong>Only call hooks from React function components or custom hooks.</strong></li>
</ol>
<pre><code>// ✘ BREAKS — the hook order changes between renders
function Bad({ show }) {
  if (show) { const [x, setX] = useState(0); }   // conditional hook
}

// ✔ Correct
function Good({ show }) {
  const [x, setX] = useState(0);
  if (!show) return null;
}</code></pre>
<p><strong>Why:</strong> React stores hook state in an <em>ordered list</em> per component instance, not by name. It relies entirely on hooks being called in the same order every render. Skip one conditionally and every subsequent hook reads the wrong slot — you get another hook's state, silently.</p>
<p><strong>Custom hooks</strong> are just functions starting with <code>use</code> that call other hooks. They are the mechanism for sharing stateful logic, replacing the old higher-order component and render-prop patterns:</p>
<pre><code>function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() =&gt; {
    const t = setTimeout(() =&gt; setDebounced(value), delay);
    return () =&gt; clearTimeout(t);        // cleanup — cancels the previous timer
  }, [value, delay]);
  return debounced;
}</code></pre>
<p>Enforce the rules with the <code>eslint-plugin-react-hooks</code> lint rule — mention it, because it catches these mistakes automatically.</p>`
},
{
  q: "Explain useState, useEffect and useRef",
  level: "beginner", hot: true, tags: ["hooks"],
  a: `<pre><code>// useState — local state; setting it triggers a re-render
const [count, setCount] = useState(0);
setCount(c =&gt; c + 1);            // functional update — use when based on the previous value
const [state] = useState(() =&gt; expensiveInit());   // lazy initialiser, runs once

// useEffect — synchronise with something OUTSIDE React
useEffect(() =&gt; {
  const controller = new AbortController();
  fetch(\`/api/orders/\${id}\`, { signal: controller.signal })
    .then(r =&gt; r.json())
    .then(setOrder)
    .catch(e =&gt; { if (e.name !== 'AbortError') setError(e); });

  return () =&gt; controller.abort();      // CLEANUP — runs before the next effect and on unmount
}, [id]);                                // dependency array

// useRef — a mutable box that does NOT trigger re-renders
const inputRef = useRef(null);           // DOM access
const renderCount = useRef(0);           // instance variable across renders
renderCount.current++;                   // changing .current re-renders nothing</code></pre>
<table>
<tr><th>Dependency array</th><th>Effect runs</th></tr>
<tr><td>omitted</td><td>After <em>every</em> render — usually a bug</td></tr>
<tr><td><code>[]</code></td><td>Once after mount (plus cleanup on unmount)</td></tr>
<tr><td><code>[a, b]</code></td><td>On mount and whenever <code>a</code> or <code>b</code> changes by <code>Object.is</code></td></tr>
</table>
<p><strong>The most important modern guidance:</strong> <code>useEffect</code> is for <em>synchronising with external systems</em> — subscriptions, timers, DOM APIs, analytics. It is <strong>not</strong> for transforming data (compute it during render), not for reacting to user events (do it in the handler), and increasingly not for data fetching (use a framework loader or TanStack Query, which handle caching, races and errors properly).</p>`
},
{
  q: "What is the dependency array and what goes wrong with it?",
  level: "advanced", hot: true, tags: ["hooks", "gotcha"],
  a: `<pre><code>// ✘ Infinite loop: the object is recreated every render, so the effect reruns forever
const filters = { status: 'PAID' };
useEffect(() =&gt; { fetchOrders(filters); }, [filters]);

// ✔ Fix 1 — depend on primitives
useEffect(() =&gt; { fetchOrders({ status }); }, [status]);
// ✔ Fix 2 — memoise the object
const filters = useMemo(() =&gt; ({ status }), [status]);

// ✘ Stale closure: the effect captured count === 0 forever
useEffect(() =&gt; {
  const id = setInterval(() =&gt; setCount(count + 1), 1000);   // always 0 + 1
  return () =&gt; clearInterval(id);
}, []);

// ✔ Functional update — no dependency on count at all
useEffect(() =&gt; {
  const id = setInterval(() =&gt; setCount(c =&gt; c + 1), 1000);
  return () =&gt; clearInterval(id);
}, []);</code></pre>
<p><strong>The two failure modes:</strong></p>
<ul>
<li><strong>Missing dependencies → stale closures.</strong> The effect captured old values and silently uses them forever. The bug is invisible until someone notices the wrong number.</li>
<li><strong>Unstable dependencies → infinite loops.</strong> Objects, arrays and functions get a new identity every render, so a dependency on one always differs.</li>
</ul>
<p><strong>Guidance:</strong> never suppress the <code>exhaustive-deps</code> lint rule to "fix" a loop — that hides the real problem. Instead remove the need for the dependency: use functional state updates, move the function inside the effect, memoise with <code>useCallback</code>/<code>useMemo</code>, or lift the value out of the component entirely if it never changes.</p>
<p>Note that React 19's compiler auto-memoises much of this, which will reduce (but not eliminate) manual dependency management.</p>`
},
{
  q: "What is reconciliation and why do list keys matter?",
  level: "advanced", hot: true, tags: ["internals", "performance"],
  a: `<p>Reconciliation is React's diffing algorithm. To keep it O(n) rather than O(n³) it makes two assumptions:</p>
<ol>
<li><strong>Different element types produce different trees.</strong> If a <code>&lt;div&gt;</code> becomes a <code>&lt;span&gt;</code>, React destroys the whole subtree and rebuilds it — losing all its state.</li>
<li><strong>Keys tell React which items are the same across renders.</strong></li>
</ol>
<pre><code>// ✘ Index as key — breaks on insert, delete or reorder
{items.map((item, i) =&gt; &lt;Row key={i} item={item} /&gt;)}

// ✔ Stable, unique identity
{items.map(item =&gt; &lt;Row key={item.id} item={item} /&gt;)}</code></pre>
<p><strong>Why index keys are a real bug, not a style preference:</strong> insert an item at the top of the list and every index shifts. React thinks item 0's <em>content</em> changed rather than that a new item appeared, so it reuses the existing DOM node and its component state. The visible symptom is a checked checkbox, focused input or in-progress edit attached to the wrong row — a genuinely confusing bug to diagnose.</p>
<p><strong>Keys are also a tool:</strong> changing a component's <code>key</code> deliberately forces React to unmount and remount it, resetting all its state. That is the idiomatic way to reset a form when the selected record changes:</p>
<pre><code>&lt;EditForm key={selectedId} record={record} /&gt;   // fresh state per record</code></pre>
<p>Also worth mentioning: keys must be unique among <em>siblings</em>, not globally, and they are never passed to the component as a prop.</p>`
},
{
  q: "useMemo, useCallback and React.memo — when should you actually use them?",
  level: "advanced", hot: true, tags: ["performance"],
  a: `<pre><code>// React.memo — skip re-render if props are shallowly equal
const Row = React.memo(function Row({ item, onSelect }) { ... });

// useCallback — stable function identity across renders
const onSelect = useCallback((id) =&gt; setSelected(id), []);

// useMemo — cache an expensive computation
const sorted = useMemo(
  () =&gt; items.slice().sort((a, b) =&gt; b.total - a.total),
  [items]
);</code></pre>
<p><strong>The key insight most candidates miss:</strong> <code>React.memo</code> is useless if you pass a new object or function on every render. That is <em>why</em> <code>useCallback</code> and <code>useMemo</code> exist — they exist to preserve referential identity so memoisation can work, not to speed up computation in isolation.</p>
<pre><code>// React.memo does nothing here — the arrow function is new every render
&lt;Row item={item} onSelect={(id) =&gt; setSelected(id)} /&gt;</code></pre>
<p><strong>When to use them:</strong></p>
<ul>
<li>A genuinely expensive computation (sorting thousands of rows, parsing).</li>
<li>A value used as a dependency of an effect, where instability would cause loops.</li>
<li>A prop passed to a memoised child that renders frequently.</li>
</ul>
<p><strong>When not to:</strong> everywhere by default. Memoisation is not free — it costs memory, adds a comparison on every render, and clutters the code. Premature memoisation frequently makes an app <em>slower</em> and always makes it harder to read. Profile with React DevTools first and memoise the component that actually shows up.</p>
<p><strong>Worth mentioning:</strong> the React Compiler (React 19) auto-memoises, which is expected to make most manual <code>useMemo</code>/<code>useCallback</code> unnecessary — a good currency signal.</p>`
},
{
  q: "How do you manage state in React — local, context, or a library?",
  level: "advanced", hot: true, tags: ["state", "architecture"],
  a: `<ol>
<li><strong><code>useState</code> / <code>useReducer</code></strong> — local component state. Most state belongs here. Use <code>useReducer</code> when the next state depends on the previous one in complex ways, or several values change together.</li>
<li><strong>Lift state up</strong> — move it to the nearest common ancestor when siblings need it.</li>
<li><strong>Context</strong> — for genuinely global, <em>rarely changing</em> values: theme, current user, locale, feature flags.</li>
<li><strong>A state library</strong> — Zustand (minimal), Redux Toolkit (structured, great devtools), Jotai/Recoil (atomic) — when many distant components share frequently changing state.</li>
<li><strong>Server state is different</strong> — TanStack Query or SWR. This is the most valuable distinction to draw.</li>
</ol>
<pre><code>// Context has a real performance caveat: EVERY consumer re-renders when the value changes
const value = useMemo(() =&gt; ({ user, login, logout }), [user]);   // memoise the value
return &lt;AuthContext.Provider value={value}&gt;{children}&lt;/AuthContext.Provider&gt;;
// and split contexts so a fast-changing value does not re-render theme consumers</code></pre>
<blockquote><p><strong>The distinction that impresses:</strong> most "state management" problems are actually <em>server cache</em> problems. Data fetched from an API is not application state — it is a cache of someone else's state, and it needs deduplication, background refetching, staleness and invalidation. Redux was never designed for that; TanStack Query is. Separating the two usually removes 80% of a Redux store.</p></blockquote>`
},
{
  q: "What is the difference between controlled and uncontrolled components?",
  level: "beginner", tags: ["forms"],
  a: `<pre><code>// Controlled — React state is the single source of truth
function ControlledInput() {
  const [value, setValue] = useState('');
  return &lt;input value={value} onChange={e =&gt; setValue(e.target.value)} /&gt;;
}

// Uncontrolled — the DOM holds the value; read it when you need it
function UncontrolledInput() {
  const ref = useRef(null);
  const submit = () =&gt; console.log(ref.current.value);
  return &lt;input ref={ref} defaultValue="" /&gt;;
}</code></pre>
<table>
<tr><th></th><th>Controlled</th><th>Uncontrolled</th></tr>
<tr><td>Source of truth</td><td>React state</td><td>The DOM</td></tr>
<tr><td>Validation as you type</td><td>Easy</td><td>Awkward</td></tr>
<tr><td>Conditional formatting/masking</td><td>Easy</td><td>Hard</td></tr>
<tr><td>Re-renders</td><td>On every keystroke</td><td>None</td></tr>
<tr><td>File inputs</td><td>Not possible</td><td>Required</td></tr>
</table>
<p><strong>Default to controlled</strong> — it makes the form's state explicit and testable. Reach for uncontrolled when performance matters on a very large form (every keystroke re-rendering 60 fields is noticeable), or for file inputs, which are always uncontrolled.</p>
<p><strong>The common bug to mention:</strong> switching between the two produces React's "A component is changing an uncontrolled input to be controlled" warning. It happens when <code>value</code> starts as <code>undefined</code> — always initialise to <code>''</code>, never <code>undefined</code> or <code>null</code>.</p>
<p>In practice, libraries like React Hook Form use the uncontrolled approach deliberately for performance while still giving you validation and typed values.</p>`
},
{
  q: "How do you fetch data in React properly?",
  level: "advanced", hot: true, tags: ["data-fetching"],
  a: `<pre><code>// The naive useEffect version — and everything wrong with it
useEffect(() =&gt; {
  fetch(\`/api/orders/\${id}\`).then(r =&gt; r.json()).then(setData);
}, [id]);
// Missing: loading state, error handling, race conditions (a slow earlier request can
// resolve last and overwrite newer data), cleanup, caching, refetch on focus, retries.

// Minimum correct version with plain hooks
useEffect(() =&gt; {
  const controller = new AbortController();
  setLoading(true);
  fetch(\`/api/orders/\${id}\`, { signal: controller.signal })
    .then(r =&gt; { if (!r.ok) throw new Error(r.statusText); return r.json(); })
    .then(setData)
    .catch(e =&gt; { if (e.name !== 'AbortError') setError(e); })
    .finally(() =&gt; setLoading(false));
  return () =&gt; controller.abort();      // cancels on unmount AND when id changes
}, [id]);

// What you should actually use
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['order', id],
  queryFn: () =&gt; api.getOrder(id),
  staleTime: 30_000,
  retry: 2,
});</code></pre>
<p><strong>The answer that shows experience:</strong> hand-rolled fetching in <code>useEffect</code> is a well-known source of bugs — race conditions, missing cleanup, duplicated requests across components, no cache. <strong>TanStack Query</strong> (or SWR) solves all of it: request deduplication, caching with configurable staleness, background refetching, retries with backoff, optimistic updates, and pagination.</p>
<p>In a framework context (Next.js, React Router v7, Remix), data loading moves to <strong>server components or route loaders</strong>, which fetch before render and avoid client waterfalls entirely — worth naming as the current direction of the ecosystem.</p>`
},
{
  q: "What are React Server Components and what changed in React 19?",
  level: "advanced", tags: ["modern", "react19"],
  a: `<p><strong>Server Components</strong> render on the server, never ship their JavaScript to the browser, and can access the database or filesystem directly. Client Components (marked <code>'use client'</code>) hydrate and handle interactivity.</p>
<pre><code>// Server Component — the default in Next.js App Router. No bundle cost.
async function OrderPage({ params }) {
  const order = await db.order.findUnique({ where: { id: params.id } });  // direct DB access
  return &lt;&gt;&lt;OrderDetails order={order} /&gt;&lt;CancelButton id={order.id} /&gt;&lt;/&gt;;
}

'use client';                                    // this one needs interactivity
function CancelButton({ id }) {
  const [pending, startTransition] = useTransition();
  return &lt;button onClick={() =&gt; startTransition(() =&gt; cancelOrder(id))}&gt;Cancel&lt;/button&gt;;
}</code></pre>
<p><strong>What you gain:</strong> a smaller client bundle (a markdown renderer or date library used only on the server never ships), no client-server data waterfall, and secrets stay on the server. <strong>What you give up:</strong> no state, effects or browser APIs in server components, and a genuinely new mental model about where code runs.</p>
<p><strong>React 19 additions worth naming:</strong></p>
<ul>
<li><strong>Actions</strong> — async functions in transitions with built-in pending, error and optimistic state; <code>useActionState</code>, <code>useFormStatus</code>, <code>useOptimistic</code>.</li>
<li><strong><code>use()</code></strong> — read a promise or context conditionally, integrating with Suspense.</li>
<li><strong>The React Compiler</strong> — automatic memoisation, removing most manual <code>useMemo</code>/<code>useCallback</code>.</li>
<li><strong>Ref as a prop</strong> — <code>forwardRef</code> is no longer needed.</li>
<li>Native support for document metadata, stylesheets and async scripts in components.</li>
</ul>`
},
{
  q: "How do you optimise React performance?",
  level: "advanced", hot: true, tags: ["performance"],
  a: `<ol>
<li><strong>Profile first.</strong> React DevTools Profiler shows which components re-render and why. Optimising without it is guesswork.</li>
<li><strong>Fix the cause of re-renders</strong> — usually state living too high in the tree. Moving state <em>down</em> to the component that needs it is often a bigger win than any memoisation.</li>
<li><strong>Stable keys</strong> in lists — never the index for dynamic lists.</li>
<li><strong><code>React.memo</code> + <code>useCallback</code>/<code>useMemo</code></strong> for expensive children — but only where measured.</li>
<li><strong>Code splitting</strong> — <code>React.lazy</code> + <code>Suspense</code> per route, so the initial bundle is small.</li>
<li><strong>Virtualise long lists</strong> — <code>react-window</code> / TanStack Virtual renders only visible rows.</li>
<li><strong>Debounce expensive handlers</strong> — search inputs, resize, scroll.</li>
<li><strong>Split contexts</strong> so a frequently changing value does not re-render every consumer of a stable one.</li>
<li><strong><code>useTransition</code> / <code>useDeferredValue</code></strong> to keep typing responsive while an expensive list filters in the background.</li>
<li><strong>Optimise the bundle</strong> — analyse it, avoid importing an entire library for one function, and use modern image formats with lazy loading.</li>
</ol>
<pre><code>const Reports = React.lazy(() =&gt; import('./Reports'));

&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
  &lt;Reports /&gt;
&lt;/Suspense&gt;

// Keep the input responsive while a big list re-filters
const deferredQuery = useDeferredValue(query);
const results = useMemo(() =&gt; filter(items, deferredQuery), [items, deferredQuery]);</code></pre>
<p><strong>The framing to use:</strong> most React performance problems are "too many components re-rendering too often", and the cheapest fix is usually restructuring state rather than adding memoisation.</p>`
},
{
  q: "What is prop drilling and how do you avoid it?",
  level: "beginner", tags: ["patterns"],
  a: `<p><strong>Prop drilling</strong> is passing a prop through several intermediate components that do not use it, just to reach a deep child. It couples unrelated components to data they do not care about and makes refactoring painful.</p>
<pre><code>// Drilling: App -&gt; Layout -&gt; Sidebar -&gt; UserMenu, only UserMenu uses 'user'
&lt;Layout user={user}&gt;&lt;Sidebar user={user}&gt;&lt;UserMenu user={user} /&gt;&lt;/Sidebar&gt;&lt;/Layout&gt;</code></pre>
<p><strong>Solutions, in order of how often they are the right answer:</strong></p>
<ol>
<li><strong>Component composition</strong> — pass elements as <code>children</code> instead of data. This is the underrated fix, and it needs no library:
<pre><code>&lt;Layout sidebar={&lt;Sidebar&gt;&lt;UserMenu user={user} /&gt;&lt;/Sidebar&gt;}&gt;
  &lt;Content /&gt;
&lt;/Layout&gt;
// Layout no longer knows about 'user' at all</code></pre></li>
<li><strong>Context</strong> — for genuinely cross-cutting values: current user, theme, locale.</li>
<li><strong>A state library</strong> — Zustand, Redux, Jotai — when many distant components read and write shared state.</li>
<li><strong>A server-cache library</strong> — TanStack Query means any component can call <code>useQuery(['user'])</code> and get the cached value without any prop passing at all.</li>
</ol>
<p><strong>The nuance worth stating:</strong> two or three levels of prop passing is not a problem — it is explicit and easy to follow. Reaching for context or Redux to avoid it trades explicitness for indirection. Fix it when it genuinely hurts, not on principle.</p>`
},
{
  q: "How do you test React components?",
  level: "advanced", tags: ["testing"],
  a: `<pre><code>import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('shows an error when the order cannot be cancelled', async () =&gt; {
  const user = userEvent.setup();
  server.use(http.post('/api/orders/1/cancel', () =&gt; HttpResponse.error()));

  render(&lt;OrderCard order={sampleOrder} /&gt;);

  // Query the way a USER would — by role and accessible name
  await user.click(screen.getByRole('button', { name: /cancel order/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not cancel/i);
  expect(screen.getByRole('button', { name: /cancel order/i })).toBeEnabled();
});</code></pre>
<p><strong>The React Testing Library philosophy:</strong> "the more your tests resemble the way your software is used, the more confidence they give you." So:</p>
<ul>
<li><strong>Query by role, label and text</strong> — not by class name or component internals. This makes tests survive refactoring <em>and</em> doubles as an accessibility check, since an element with no accessible role is one a screen reader cannot find either.</li>
<li><strong>Never test implementation details</strong> — state variables, method names, whether a hook was called. Test what the user sees and can do.</li>
<li><strong>Use <code>userEvent</code> over <code>fireEvent</code></strong> — it simulates the full interaction (focus, keydown, input, change) rather than dispatching one synthetic event.</li>
<li><strong>Mock the network, not your modules</strong> — <strong>MSW</strong> intercepts at the network layer, so you test your real fetching code against realistic responses instead of stubbing your own API client.</li>
<li><strong><code>findBy*</code> for async</strong>, <code>getBy*</code> for present-now, <code>queryBy*</code> for asserting absence.</li>
</ul>
<p>Round it out with Playwright or Cypress for a handful of end-to-end journeys, and Storybook plus visual regression testing if the UI library is shared.</p>`
}
]);
