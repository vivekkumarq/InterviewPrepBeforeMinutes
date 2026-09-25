appendTopic("react", [
{
  q: "Walk me through exactly what React does between a setState call and the screen updating",
  level: "advanced", hot: true, tags: ["rendering", "reconciliation", "internals", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Salesforce"],
  a: `<p>Most candidates say "it re-renders". The question is testing whether you know that <strong>render and commit are separate phases</strong>, and what that separation buys you.</p>
<table>
<tr><th>Phase</th><th>What happens</th><th>Can it be interrupted?</th></tr>
<tr><td><strong>Trigger</strong></td><td><code>setState</code> marks the component dirty and schedules work</td><td>—</td></tr>
<tr><td><strong>Render</strong></td><td>Your function runs, returning elements. React diffs against the previous tree</td><td><strong>Yes</strong> — may be paused, restarted or thrown away</td></tr>
<tr><td><strong>Commit</strong></td><td>The computed changes are applied to the real DOM</td><td><strong>No</strong> — synchronous and atomic</td></tr>
<tr><td><strong>Effects</strong></td><td><code>useLayoutEffect</code> fires, browser paints, then <code>useEffect</code></td><td>—</td></tr>
</table>
<p><strong>Why render must be side-effect free:</strong> because it can run twice and be discarded. That is not a style rule, it is a correctness requirement — and it is exactly why Strict Mode double-invokes your render in development, to surface the components that break it.</p>
<pre><code>// A WORKED EXAMPLE. What does this print, and in what order?
function Counter() {
    const [n, setN] = useState(0);
    console.log("1. render", n);

    useLayoutEffect(() => console.log("3. layout effect", n));
    useEffect(() => console.log("4. effect", n));

    return &lt;button onClick={() => {
        console.log("2. click");
        setN(n + 1);
        setN(n + 1);          // NOT 2 - both read the same stale n
        console.log("still", n);   // logs the OLD value: n is a const
    }}&gt;{n}&lt;/button&gt;;
}

// First click prints:
//   2. click
//   still 0            <- n is captured by this render's closure
//   1. render 1        <- ONE render, not two: the updates batched
//   3. layout effect 1 <- before paint, blocks it
//   4. effect 1        <- after paint

// Two setN calls, one render, and it only went 0 -> 1.
// To increment twice, pass a FUNCTION so each call sees the latest:
setN(prev => prev + 1);
setN(prev => prev + 1);        // now it is 2</code></pre>
<p><strong>The stale-closure point is the heart of it.</strong> <code>n</code> is a <code>const</code> belonging to one particular render. It cannot change — a new value means a new render with a new <code>n</code>. That single fact explains most confusing React bugs: a timer, an event listener, or a promise callback holds the values from whichever render created it.</p>
<pre><code>// The classic bug it causes
useEffect(() => {
    const id = setInterval(() => {
        setCount(count + 1);    // count is FROZEN at 0 forever
    }, 1000);
    return () => clearInterval(id);
}, []);                          // empty deps: this closure never refreshes

// Fixes, in order of preference:
setCount(c => c + 1);            // 1. functional update - no capture at all
// 2. add count to the deps, accepting the interval is recreated each tick
// 3. useRef to hold a value that survives renders</code></pre>
<p><strong>Where the phases matter in practice:</strong> <code>useLayoutEffect</code> runs before the browser paints, so it is the right place to measure a node and adjust before anyone sees a flicker — a tooltip that must not appear off-screen. Everything else belongs in <code>useEffect</code>, which runs after paint and so never delays it.</p>`
},
{
  q: "Show me a component that re-renders too much, and fix it step by step",
  level: "advanced", hot: true, tags: ["performance", "memo", "hooks", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Walmart"],
  a: `<p>Here is the whole problem in one component. Work through it rather than reaching for <code>memo</code> first.</p>
<pre><code>// SLOW: every keystroke in the filter re-renders all 5,000 rows
function Dashboard({ rows }) {
    const [query, setQuery] = useState("");
    const [theme, setTheme] = useState("dark");

    // PROBLEM 1: recomputed on EVERY render, including theme changes
    const visible = rows.filter(r => r.name.includes(query));

    // PROBLEM 2: a brand-new function identity on every render
    const onSelect = (id) => console.log(id);

    // PROBLEM 3: a brand-new object identity on every render
    const style = { padding: 8 };

    return (
        &lt;&gt;
          &lt;input value={query} onChange={e => setQuery(e.target.value)} /&gt;
          {visible.map(r =&gt;
            &lt;Row key={r.id} row={r} onSelect={onSelect} style={style} /&gt;)}
        &lt;/&gt;
    );
}</code></pre>
<table>
<tr><th>Step</th><th>Fix</th><th>What it actually buys</th></tr>
<tr><td>1</td><td><code>React.memo(Row)</code></td><td><strong>Nothing yet</strong> — props still differ by identity every render</td></tr>
<tr><td>2</td><td><code>useCallback(onSelect, [])</code></td><td>Stable function identity</td></tr>
<tr><td>3</td><td>Hoist <code>style</code> outside the component</td><td>Stable object identity, and zero cost</td></tr>
<tr><td>4</td><td><code>useMemo</code> for <code>visible</code></td><td>Filtering no longer reruns when only the theme changes</td></tr>
<tr><td>5</td><td>Move <code>query</code> state down, or split the component</td><td><strong>The real fix</strong> — the rows stop re-rendering at all</td></tr>
</table>
<pre><code>// FAST
const ROW_STYLE = { padding: 8 };          // 3. hoisted: one object, forever

const Row = React.memo(function Row({ row, onSelect }) {   // 1. memo
    return &lt;div style={ROW_STYLE} onClick={() =&gt; onSelect(row.id)}&gt;{row.name}&lt;/div&gt;;
});

function Dashboard({ rows }) {
    const [query, setQuery] = useState("");
    const visible = useMemo(                // 4. only refilter when inputs change
        () =&gt; rows.filter(r =&gt; r.name.includes(query)),
        [rows, query]
    );
    const onSelect = useCallback((id) =&gt; console.log(id), []);   // 2. stable

    return (
        &lt;&gt;
          &lt;input value={query} onChange={e =&gt; setQuery(e.target.value)} /&gt;
          {visible.map(r =&gt; &lt;Row key={r.id} row={r} onSelect={onSelect} /&gt;)}
        &lt;/&gt;
    );
}</code></pre>
<p><strong>Step 1 alone does nothing, and that is the insight being tested.</strong> <code>React.memo</code> compares props with <code>Object.is</code>. A fresh function and a fresh object fail that comparison every single time, so the memo boundary is paid for and never hits. Memoising the child without stabilising the props is the most common wasted optimisation in React.</p>
<p><strong>Do not memoise everything.</strong> <code>useMemo</code> and <code>useCallback</code> each cost a dependency comparison and hold references alive. For a cheap expression they are a net loss. Measure with the Profiler first: find the component that is actually slow, and check <em>why</em> it re-rendered before assuming memo is the answer.</p>
<p><strong>The composition fix is usually better than any of them.</strong> If the filter input lives in its own component, typing never touches the row list at all — no comparison, no memo, no dependency arrays to get wrong. React Compiler (19+) automates steps 1–4, which is more reason to reach for structure first.</p>`
},
{
  q: "How do you decide between useState, useReducer, context, and a store?",
  level: "advanced", tags: ["state", "architecture", "context", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Uber", "Salesforce", "Walmart"],
  a: `<p>State questions are really <em>scope</em> questions. Ask two things: <strong>who needs this</strong>, and <strong>who owns the truth</strong>.</p>
<table>
<tr><th>Reach for</th><th>When</th><th>Cost</th></tr>
<tr><td><code>useState</code></td><td>One component, a few independent values</td><td>None</td></tr>
<tr><td><code>useReducer</code></td><td>Several values that change <em>together</em>, or next state depends on previous</td><td>Slight ceremony</td></tr>
<tr><td><strong>Lift state up</strong></td><td>Two siblings need it</td><td>Some prop passing</td></tr>
<tr><td><strong>Context</strong></td><td>Many components, deep tree, changes <em>rarely</em></td><td><strong>Every consumer re-renders on any change</strong></td></tr>
<tr><td><strong>Store</strong> (Zustand, Redux)</td><td>Many components, changes often, selective subscriptions needed</td><td>A dependency, some setup</td></tr>
<tr><td><strong>Server-state library</strong></td><td>The data lives on a server</td><td>A dependency — and it is nearly always worth it</td></tr>
</table>
<p><strong>The distinction most people miss:</strong> server data is not really "state", it is a <em>cache</em> of someone else's state. It needs refetching, deduplication, staleness and revalidation — which is why putting it in Redux means reimplementing React Query badly. Split them: server cache in a query library, genuine UI state (which modal is open, which tab is active) in React.</p>
<pre><code>// useReducer earns its place when transitions have RULES
function reducer(state, action) {
    switch (action.type) {
        case "SUBMIT":
            if (state.status === "loading") return state;   // ignore double-submit
            return { ...state, status: "loading", error: null };
        case "SUCCESS":
            return { status: "done", data: action.data, error: null };
        case "FAILURE":
            return { ...state, status: "error", error: action.error };
        default:
            return state;
    }
}
// Three useState calls cannot express "ignore submit while already loading"
// without the caller remembering to check. Here the rule lives in one place
// and every caller gets it for free.</code></pre>
<pre><code>// THE CONTEXT TRAP, and the fix
const AppContext = createContext();

// BAD: a new object every render, so every consumer re-renders every time
&lt;AppContext.Provider value={{ user, theme, setTheme }}&gt;

// BETTER: memoised, so it only changes when its inputs do
const value = useMemo(() =&gt; ({ user, theme, setTheme }), [user, theme]);

// BEST: split by change frequency. A component that only needs the theme
// should not re-render when the user object changes.
&lt;UserContext.Provider value={user}&gt;
  &lt;ThemeContext.Provider value={themeValue}&gt;</code></pre>
<p><strong>Context is a delivery mechanism, not a state manager.</strong> It has no selector: any change re-renders every consumer of that context, however small the slice they actually read. That is fine for a theme or a locale, and wrong for anything updating on every keystroke — which is precisely where a store with selective subscriptions earns its dependency.</p>
<p><strong>The answer that lands:</strong> "I start with <code>useState</code> in the component that owns it and move it only when something forces me to. Most 'we need global state' turns out to be server data that belongs in a query cache, plus two or three genuinely global values that Context handles fine."</p>`
}
]);
