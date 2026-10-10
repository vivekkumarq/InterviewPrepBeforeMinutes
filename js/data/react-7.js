registerPrimer("react", `<p class="pr-lead"><b>React</b> is a JavaScript library for building user interfaces out of small, reusable pieces called <b>components</b>: a button, a search box, a product card. Instead of changing the web page by hand, you describe what the screen should look like for the current data, and React updates the page for you whenever that data changes.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of a scoreboard at a cricket match. The operator does not repaint the whole board after each ball; they just change the score, and the board shows the new number. In React, your <b>state</b> is the score, your component is the board's design, and React is the operator who updates only the digits that changed.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Component</dt><dd>A JavaScript function that returns what a piece of the screen should look like.</dd>
<dt>JSX</dt><dd>HTML-like syntax inside JavaScript, such as <code>&lt;button&gt;Save&lt;/button&gt;</code>, describing what to show.</dd>
<dt>Props</dt><dd>Inputs passed from a parent component to a child, like function arguments. The child must not change them.</dd>
<dt>State</dt><dd>Data that belongs to a component and can change over time, such as what the user typed. Changing it updates the screen.</dd>
<dt>Hook</dt><dd>A special function starting with <code>use</code> (such as <code>useState</code>, <code>useEffect</code>) that adds React features to a component.</dd>
<dt>Render</dt><dd>React calling your component to find out what the screen should look like now.</dd>
<dt>Virtual DOM</dt><dd>React's lightweight copy of the page in memory, compared with the previous copy to find the smallest set of real changes.</dd>
<dt>Effect</dt><dd>Code that talks to the outside world (fetching data, timers), run after the screen updates.</dd>
</dl>

<h3>Step by step: what happens when you click a button</h3>
<ol class="pr-steps">
<li>The user clicks "+1". Your click handler calls <code>setCount(count + 1)</code>.</li>
<li>React records the new state and schedules an update.</li>
<li><b>Render:</b> React calls your component function again. It returns the new description: "the counter shows 6".</li>
<li><b>Compare:</b> React compares the new description with the previous one and finds that only the number changed.</li>
<li><b>Commit:</b> React updates just that piece of text on the real page.</li>
<li>Any effects whose inputs changed run afterwards.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 214" role="img" aria-label="React update cycle: setState triggers render, reconciliation diffs the output, commit updates the DOM, then effects run">
  <defs><marker id="pr-re" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="10" y="40" width="110" height="60" rx="9"/><text class="dg-t" x="65" y="64" text-anchor="middle">Trigger</text><text class="dg-m" x="65" y="84" text-anchor="middle">setCount(1)</text>
  <line class="dg-line" x1="120" y1="70" x2="146" y2="70" marker-end="url(#pr-re)"/>
  <rect class="dg-fill2" x="148" y="40" width="130" height="60" rx="9"/><text class="dg-t" x="213" y="62" text-anchor="middle">Render</text><text class="dg-s" x="213" y="78" text-anchor="middle">call the component,</text><text class="dg-s" x="213" y="91" text-anchor="middle">get new JSX (pure)</text>
  <line class="dg-line" x1="278" y1="70" x2="304" y2="70" marker-end="url(#pr-re)"/>
  <rect class="dg-box" x="306" y="40" width="130" height="60" rx="9"/><text class="dg-t" x="371" y="62" text-anchor="middle">Reconcile</text><text class="dg-s" x="371" y="78" text-anchor="middle">diff with the last</text><text class="dg-s" x="371" y="91" text-anchor="middle">render's output</text>
  <line class="dg-line" x1="436" y1="70" x2="462" y2="70" marker-end="url(#pr-re)"/>
  <rect class="dg-fill" x="464" y="40" width="146" height="60" rx="9"/><text class="dg-t" x="537" y="62" text-anchor="middle">Commit</text><text class="dg-s" x="537" y="78" text-anchor="middle">touch only changed</text><text class="dg-s" x="537" y="91" text-anchor="middle">DOM nodes</text>
  <line class="dg-line" x1="537" y1="100" x2="537" y2="130" marker-end="url(#pr-re)"/>
  <rect class="dg-fill2" x="444" y="132" width="166" height="54" rx="9"/><text class="dg-t" x="527" y="154" text-anchor="middle">Effects</text><text class="dg-s" x="527" y="172" text-anchor="middle">useEffect runs after paint</text>
  <path class="dg-line" d="M444 160 H65 V104" marker-end="url(#pr-re)" stroke-dasharray="4 3"/>
  <text class="dg-s" x="140" y="154">an effect that sets state starts the cycle again</text>
  <text class="dg-s" x="10" y="206">Render must be pure: no fetching, no subscriptions, no DOM writes. Side effects belong in effects or event handlers.</text>
</svg>
<figcaption>One state change, one pass through the cycle. React batches several setState calls in the same event into one render.</figcaption>
</figure>

<h3>A worked example: a counter, line by line</h3>
<pre><code>function Counter() {
  const [count, setCount] = useState(0);      // state starts at 0

  useEffect(() =&gt; {
    document.title = "Clicked " + count + " times";
  }, [count]);                                // run again only when count changes

  return (
    &lt;button onClick={() =&gt; setCount(count + 1)}&gt;
      Clicked {count} times
    &lt;/button&gt;
  );
}</code></pre>
<ol class="pr-steps">
<li><code>useState(0)</code> creates a piece of state starting at 0. It gives back the current value (<code>count</code>) and a function to change it (<code>setCount</code>).</li>
<li>The JSX describes a button showing the current count.</li>
<li>Clicking calls <code>setCount</code>, which makes React render the component again with the new value.</li>
<li><code>useEffect</code> updates the browser tab title after the screen updates. The <code>[count]</code> list means "only re-run when count changes".</li>
<li>You never touch the page directly; you only change state, and React keeps the page in step.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Changing state directly</p>
<p><code>items.push(newItem)</code> changes the existing array, so React sees the "same" array and does not update the screen.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> always create a new array or object: <code>setItems([...items, newItem])</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using the array index as a list key</p>
<p>When items are added, removed or reordered, index keys make React mix up which item is which, so inputs can show the wrong values.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use a stable, unique id from your data: <code>key={item.id}</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Wrong effect dependency list</p>
<p>Leaving out a value the effect uses makes it work with an old, stale value. Leaving out the list entirely makes it run after every render, which can cause endless loops.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> list every value the effect uses, and follow the lint rule that checks this.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Calling hooks inside if statements or loops</p>
<p>React identifies each hook by the order it is called. Skipping one with an <code>if</code> mixes up which state belongs to which hook.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> call hooks only at the top level of your component, every time it runs.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>The screen is a result of state: change the state, and React updates the screen.</li>
<li>Props come in from the parent; state belongs to the component.</li>
<li>Never change state directly; create new arrays and objects.</li>
<li>Give list items stable, unique keys.</li>
<li>Call hooks at the top level and give effects a correct dependency list.</li>
</ul>
<p><b>Next:</b> the questions below cover hooks, rendering, state management, data fetching, performance and testing.</p>`);

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
