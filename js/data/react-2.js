appendTopic("react", [
{
  q: "What is useReducer and when is it better than useState?",
  level: "advanced", tags: ["hooks", "state"],
  a: `<pre><code>type State = { status: 'idle' | 'loading' | 'success' | 'error';
               data: Order[]; error: string | null; page: number };

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Order[] }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'NEXT_PAGE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':   return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS': return { ...state, status: 'success', data: action.payload };
    case 'FETCH_ERROR':   return { ...state, status: 'error', error: action.error };
    case 'NEXT_PAGE':     return { ...state, page: state.page + 1, status: 'loading' };
  }
}

const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'FETCH_START' });</code></pre>
<table>
<tr><th>Use <code>useState</code></th><th>Use <code>useReducer</code></th></tr>
<tr><td>Independent values</td><td>Several values that change <em>together</em></td></tr>
<tr><td>Simple updates</td><td>Next state depends on the previous in non-trivial ways</td></tr>
<tr><td>1–3 pieces of state</td><td>A state machine with defined transitions</td></tr>
</table>
<p><strong>The strongest argument for <code>useReducer</code>:</strong> it makes <strong>impossible states impossible</strong>. With four <code>useState</code> calls you can accidentally set <code>loading: true</code> and <code>error: 'failed'</code> at the same time. With a reducer, every transition is explicit and reviewable in one function — and that function is a pure function you can unit test without rendering anything.</p>
<p><strong>Two more practical benefits:</strong> <code>dispatch</code> has a <em>stable identity</em> across renders, so passing it to a memoised child does not break memoisation the way an inline callback would — no <code>useCallback</code> needed. And updates are grouped, so a transition that changes four fields is one render rather than four.</p>
<p><strong>When it is overkill:</strong> a toggle, a form field, a counter. Reaching for a reducer there adds ceremony with no benefit. And for <em>server</em> state, neither hook is the right answer — TanStack Query handles loading, error, caching and refetching far better than any hand-written reducer.</p>`
},
{
  q: "How does the Context API work and what are its performance pitfalls?",
  level: "advanced", hot: true, tags: ["context", "performance"],
  a: `<pre><code>const AuthContext = createContext&lt;AuthValue | null&gt;(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login  = useCallback(async (creds) =&gt; setUser(await api.login(creds)), []);
  const logout = useCallback(() =&gt; setUser(null), []);

  // CRITICAL: memoise the value, or every consumer re-renders on EVERY provider render
  const value = useMemo(() =&gt; ({ user, login, logout }), [user, login, logout]);

  return &lt;AuthContext.Provider value={value}&gt;{children}&lt;/AuthContext.Provider&gt;;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');   // fail loudly
  return ctx;
}</code></pre>
<p><strong>The main pitfall:</strong> <em>every</em> consumer of a context re-renders whenever the context value changes — <code>React.memo</code> does not help, because context bypasses props. Two consequences:</p>
<ol>
<li><strong>An unmemoised object literal as the value</strong> creates a new reference every render, so all consumers re-render constantly. The <code>useMemo</code> above is not optional.</li>
<li><strong>Mixing fast-changing and slow-changing values in one context</strong> means a theme consumer re-renders when the cursor position updates. <strong>Split the contexts</strong> by change frequency:</li>
</ol>
<pre><code>// ✘ one context — everything re-renders when 'user' changes
&lt;AppContext.Provider value={{ user, theme, locale, cart }}&gt;

// ✔ separate providers by how often each changes
&lt;ThemeContext.Provider value={theme}&gt;
  &lt;UserContext.Provider value={user}&gt;
    &lt;CartContext.Provider value={cart}&gt;</code></pre>
<p><strong>A useful advanced pattern:</strong> split <em>state</em> and <em>dispatch</em> into two contexts. Components that only dispatch never re-render when the state changes, because <code>dispatch</code> is stable.</p>
<p><strong>The honest positioning:</strong> Context is a <em>dependency injection</em> mechanism, not a state manager. It solves prop drilling well; it does not give you selectors, so a consumer cannot subscribe to one field. For frequently-changing shared state, Zustand or Jotai (which support selector-based subscriptions) will re-render far less.</p>`
},
{
  q: "What are error boundaries and how do you handle errors in React?",
  level: "advanced", tags: ["errors"],
  a: `<pre><code>class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };            // update state to render the fallback
  }

  componentDidCatch(error, errorInfo) {
    logger.error('React render error', { error, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? &lt;ErrorFallback onRetry={() =&gt; this.setState({ hasError: false })} /&gt;;
    }
    return this.props.children;
  }
}

// Granular boundaries — one failing widget should not blank the whole page
&lt;ErrorBoundary fallback={&lt;PageError /&gt;}&gt;
  &lt;Layout&gt;
    &lt;ErrorBoundary fallback={&lt;WidgetError /&gt;}&gt;&lt;Recommendations /&gt;&lt;/ErrorBoundary&gt;
    &lt;OrderList /&gt;
  &lt;/Layout&gt;
&lt;/ErrorBoundary&gt;</code></pre>
<p><strong>What error boundaries do NOT catch</strong> — this is the substance of the question:</p>
<ul>
<li><strong>Event handlers</strong> — an error in an <code>onClick</code> is a normal JavaScript error. Use try/catch.</li>
<li><strong>Asynchronous code</strong> — <code>setTimeout</code>, promises, <code>async</code> functions.</li>
<li><strong>Server-side rendering.</strong></li>
<li><strong>Errors thrown in the boundary itself.</strong></li>
</ul>
<pre><code>// Event handlers and async need their own handling
const handleSubmit = async () =&gt; {
  try { await api.save(form); }
  catch (e) { setError(e.message); logger.error('save failed', e); }
};

// Global safety nets for anything that escapes
window.addEventListener('unhandledrejection', e =&gt; logger.error('unhandled promise', e.reason));
window.addEventListener('error', e =&gt; logger.error('uncaught', e.error));</code></pre>
<p><strong>Important behaviour to mention:</strong> since React 16, an error thrown during render that is <em>not</em> caught by a boundary <strong>unmounts the entire component tree</strong> — the user gets a blank white page. That is deliberate, on the reasoning that a corrupted UI is worse than none, and it is exactly why granular boundaries around independent sections matter.</p>
<p>Note there is still no hook equivalent — boundaries must be class components. <code>react-error-boundary</code> provides a well-tested wrapper with a <code>useErrorBoundary</code> hook for imperatively forwarding async errors into the nearest boundary.</p>`
},
{
  q: "How do you handle forms in React at scale?",
  level: "advanced", tags: ["forms"],
  a: `<pre><code>// Controlled state for every field re-renders the whole form on every keystroke.
// React Hook Form uses UNCONTROLLED inputs with refs — dramatically fewer renders.
const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive() })).min(1),
});
type FormValues = z.infer&lt;typeof schema&gt;;          // types DERIVED from the schema

function OrderForm() {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } =
    useForm&lt;FormValues&gt;({ resolver: zodResolver(schema), mode: 'onBlur' });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (values: FormValues) =&gt; { await api.createOrder(values); };

  return (
    &lt;form onSubmit={handleSubmit(onSubmit)}&gt;
      &lt;input {...register('email')} aria-invalid={!!errors.email} /&gt;
      {errors.email &amp;&amp; &lt;span role="alert"&gt;{errors.email.message}&lt;/span&gt;}

      {fields.map((field, i) =&gt; (
        &lt;div key={field.id}&gt;
          &lt;input {...register(\`items.\${i}.sku\`)} /&gt;
          &lt;button type="button" onClick={() =&gt; remove(i)}&gt;Remove&lt;/button&gt;
        &lt;/div&gt;
      ))}
      &lt;button disabled={isSubmitting}&gt;Submit&lt;/button&gt;
    &lt;/form&gt;
  );
}</code></pre>
<p><strong>Why this combination is the current standard:</strong> React Hook Form avoids re-rendering the entire form on every keystroke (a real problem on a 40-field form), and Zod gives you one schema that provides both <em>runtime</em> validation and the <em>TypeScript type</em> — so the form's type and its validation can never drift apart.</p>
<p><strong>Points worth adding:</strong> validate on <code>blur</code> rather than on every change, so users are not shouted at while typing; always mirror validation on the server, since client validation is UX not security; use <code>aria-invalid</code> and <code>role="alert"</code> so errors are announced by screen readers; and disable the submit button during submission to prevent double posts — paired with an idempotency key on the API, since the button is not a guarantee.</p>`
},
{
  q: "What are the React rendering phases and what is concurrent rendering?",
  level: "advanced", tags: ["internals", "performance"],
  a: `<p><strong>Two phases per update:</strong></p>
<ol>
<li><strong>Render phase</strong> — React calls your components and builds the new tree, diffing against the old one. This phase is <em>pure</em>: no side effects, and since React 18 it can be <strong>interrupted, paused, resumed or abandoned</strong>.</li>
<li><strong>Commit phase</strong> — React applies the calculated DOM mutations and runs layout effects. This is synchronous and cannot be interrupted.</li>
</ol>
<p><strong>Concurrent rendering</strong> means the render phase can yield to the browser, so a long render no longer blocks input. This is what makes the app stay responsive while an expensive list re-filters.</p>
<pre><code>// useTransition — mark an update as non-urgent
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);                    // URGENT: the input must update immediately
  startTransition(() =&gt; {
    setResults(filterLargeList(e.target.value)); // NON-URGENT: may be interrupted
  });
}

// useDeferredValue — the same idea without restructuring the code
const deferredQuery = useDeferredValue(query);
const results = useMemo(() =&gt; filter(items, deferredQuery), [items, deferredQuery]);</code></pre>
<p><strong>Why this matters practically:</strong> without it, typing in a search box that filters 10,000 rows drops characters, because React blocks the main thread rendering the list between keystrokes. With a transition, React abandons the in-progress list render when a new keystroke arrives and starts again — the input stays smooth and only the final list is committed.</p>
<p><strong>Two consequences of an interruptible render phase</strong> that are worth stating:</p>
<ul>
<li><strong>Render must be pure.</strong> A component that mutates a variable or performs a side effect during render can now run twice with no commit — which is exactly why <code>StrictMode</code> in development deliberately double-invokes components, to surface those bugs.</li>
<li><strong>Automatic batching</strong> (React 18) now applies everywhere — including inside promises, timeouts and native event handlers — not just in React event handlers. Multiple <code>setState</code> calls produce one render.</li>
</ul>`
}
]);
