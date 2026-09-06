appendTopic("react", [
{
  q: "What are custom hooks and how do you design them well?",
  level: "beginner", hot: true, tags: ["hooks", "design"],
  a: `<pre><code>// A custom hook is just a function starting with 'use' that calls other hooks
function useLocalStorage&lt;T&gt;(key: string, initial: T) {
  const [value, setValue] = useState&lt;T&gt;(() =&gt; {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;                       // private mode, quota, corrupt JSON
    }
  });

  useEffect(() =&gt; {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);

  return [value, setValue] as const;        // 'as const' preserves the tuple types
}

// Composition — a hook built from other hooks
function useDebouncedSearch(delay = 300) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, delay);
  const { data, isLoading } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () =&gt; api.search(debounced),
    enabled: debounced.length &gt;= 2,
  });
  return { query, setQuery, results: data ?? [], isLoading };
}</code></pre>
<p><strong>Design guidance:</strong></p>
<ul>
<li><strong>Extract behaviour, not markup.</strong> A custom hook shares <em>stateful logic</em>; a component shares UI. Trying to return JSX from a hook is a sign it should be a component.</li>
<li><strong>Return an object once you have more than two values</strong> — a tuple is fine for <code>[value, setValue]</code> where the naming is obvious, but a five-element tuple is unreadable at the call site.</li>
<li><strong>Keep them focused.</strong> <code>useAuth</code>, <code>useDebounce</code>, <code>usePagination</code> — one responsibility each, so they compose.</li>
<li><strong>Handle the failure cases inside</strong> — the <code>try/catch</code> above matters because <code>localStorage</code> throws in private browsing and when quota is exceeded, and every consumer would otherwise have to remember.</li>
</ul>
<p><strong>The key insight about instances:</strong> each component calling a hook gets its <em>own</em> state — hooks share logic, not data. Two components calling <code>useLocalStorage('theme', 'dark')</code> have independent state and will not stay in sync. Sharing <em>state</em> requires Context or a store; this trips people up regularly.</p>`
},
{
  q: "How do you handle routing and data loading in React?",
  level: "advanced", tags: ["routing", "data"],
  a: `<pre><code>// React Router v6.4+ — loaders fetch BEFORE the component renders
const router = createBrowserRouter([
  {
    path: '/orders',
    element: &lt;OrdersLayout /&gt;,
    errorElement: &lt;RouteError /&gt;,                  // catches loader AND render errors
    children: [
      {
        path: ':id',
        element: &lt;OrderDetail /&gt;,
        loader: async ({ params, request }) =&gt; {
          const res = await fetch(\`/api/orders/\${params.id}\`, { signal: request.signal });
          if (res.status === 404) throw new Response('Not found', { status: 404 });
          return res.json();
        },
        action: async ({ request, params }) =&gt; {   // handles form submissions
          const form = await request.formData();
          return api.cancelOrder(params.id, form.get('reason'));
        },
      },
    ],
  },
]);

function OrderDetail() {
  const order = useLoaderData() as Order;         // already loaded — no loading state here
  const navigation = useNavigation();             // global pending state
  return &lt;div&gt;{navigation.state === 'loading' &amp;&amp; &lt;Spinner /&gt;}{order.reference}&lt;/div&gt;;
}</code></pre>
<p><strong>Why loaders are better than fetching in <code>useEffect</code>:</strong> the classic pattern renders the component, <em>then</em> starts the fetch, so nested components create a <strong>request waterfall</strong> — parent renders, fetches, renders child, which fetches, and so on. Loaders start every fetch for a route in parallel before rendering anything, which removes the waterfall entirely. The router also handles cancellation on navigation via the request signal.</p>
<p><strong>Other routing essentials:</strong> code-split per route with <code>React.lazy</code> so the initial bundle stays small; use <code>errorElement</code> so a failed load shows a proper error rather than a blank page; and keep filter and pagination state in the URL (<code>useSearchParams</code>) so the page is shareable, bookmarkable and survives a refresh — that is a genuine UX improvement people frequently miss.</p>
<p><strong>The current landscape:</strong> React Router v7 and Next.js App Router both push data loading to the route or server level for this reason. Fetching in <code>useEffect</code> is now the fallback for cases the framework does not cover, not the default.</p>`
},
{
  q: "What is the difference between client-side, server-side and static rendering in React?",
  level: "advanced", tags: ["rendering", "nextjs"],
  a: `<table>
<tr><th></th><th>CSR</th><th>SSR</th><th>SSG</th><th>ISR</th></tr>
<tr><td>HTML generated</td><td>In the browser</td><td>Per request, on the server</td><td>At build time</td><td>At build, revalidated on a schedule</td></tr>
<tr><td>Time to first content</td><td>Slow — blank until JS loads</td><td>Fast</td><td>Fastest</td><td>Fastest</td></tr>
<tr><td>SEO</td><td>Poor without prerendering</td><td>Good</td><td>Good</td><td>Good</td></tr>
<tr><td>Server cost</td><td>None</td><td>Per request</td><td>None</td><td>Occasional</td></tr>
<tr><td>Data freshness</td><td>Live</td><td>Live</td><td>Stale until rebuild</td><td>Bounded staleness</td></tr>
<tr><td>Fits</td><td>Dashboards behind login</td><td>Personalised pages</td><td>Docs, marketing, blogs</td><td>Product catalogues</td></tr>
</table>
<pre><code>// Next.js App Router — the rendering mode follows from the fetch options
export default async function ProductPage({ params }) {
  const product = await fetch(\`\${API}/products/\${params.id}\`, {
    next: { revalidate: 3600 }            // ISR: regenerate at most hourly
    // cache: 'no-store'                  // SSR: fresh on every request
    // cache: 'force-cache'               // SSG: built once
  }).then(r =&gt; r.json());

  return &lt;ProductDetail product={product} /&gt;;     // a Server Component: zero JS shipped
}</code></pre>
<p><strong>The decision framework to state:</strong> ask two questions — does this page need to be indexed or fast on first paint, and how fresh must the data be? A marketing page: SSG. A product page updated a few times a day: ISR. A personalised feed: SSR. An internal dashboard behind authentication: CSR is perfectly fine and simplest.</p>
<p><strong>The honest caveat about SSR:</strong> it is not free. Every request costs server CPU, you now have a server to scale and monitor, and code must be isomorphic — no <code>window</code> or <code>localStorage</code> during render. Teams frequently adopt SSR for a dashboard that nobody will ever Google, paying real complexity for no benefit.</p>
<p><strong>Streaming SSR</strong> is worth mentioning as the modern refinement: with Suspense boundaries, the server sends the shell immediately and streams slower sections as they resolve, so a slow API call delays one widget rather than the whole page.</p>`
},
{
  q: "How do you structure a large React application?",
  level: "advanced", tags: ["architecture"],
  a: `<pre><code>src/
├── app/                       # routing, providers, global setup
│   ├── router.tsx
│   └── providers.tsx
├── features/                  # one folder per business capability
│   ├── orders/
│   │   ├── api/               # queries and mutations — the ONLY place fetch lives
│   │   ├── components/        # feature-specific UI
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── index.ts           # the PUBLIC surface of this feature
│   └── checkout/
├── shared/                    # cross-feature, zero business logic
│   ├── ui/                    # Button, Modal, Table — design system
│   ├── hooks/                 # useDebounce, useLocalStorage
│   └── lib/                   # api client, formatters, validators
└── types/</code></pre>
<p><strong>The organising rules:</strong></p>
<ol>
<li><strong>Group by feature, not by file type.</strong> A <code>components/</code> folder with 300 files is unnavigable, and a change to "orders" should touch one folder rather than five.</li>
<li><strong>Features must not import from each other's internals.</strong> Cross-feature use goes through the feature's <code>index.ts</code>, or the shared layer. Enforce it with ESLint boundary rules so it is a build failure rather than a code-review comment:
<pre><code>'import/no-restricted-paths': ['error', { zones: [
  { target: './src/features/orders', from: './src/features/checkout' }
]}]</code></pre></li>
<li><strong>Shared holds no business logic</strong> — if a "shared" component knows what an Order is, it belongs to a feature.</li>
<li><strong>Colocate</strong> — tests, styles and stories live next to the component they describe.</li>
<li><strong>Separate server state from client state</strong> — TanStack Query for the former, a small store or Context for the latter. Conflating them is the single most common source of over-complicated React state.</li>
</ol>
<p><strong>The convention that scales best:</strong> a feature should be deletable. If removing <code>features/checkout/</code> breaks six unrelated files, the boundaries have leaked — and that is a much more useful test than any folder-naming debate.</p>
<p>For genuinely large codebases, mention an Nx or Turborepo monorepo with per-feature packages and enforced dependency constraints, which gives you affected-project builds so CI only tests what changed.</p>`
}
]);
