registerSimple("react", {
"What is useReducer and when is it better than useState?":
`<code>useReducer</code> keeps state updates in one function: you send "actions" such as <code>{ type: "add" }</code>, and a reducer function decides the new state. It is better than <code>useState</code> when several pieces of state change together or the next state depends on the previous one in complicated ways, because all the update rules live in one place and are easy to test.`,

"How does the Context API work and what are its performance pitfalls?":
`Context lets a parent share a value (such as the logged-in user or the theme) with any component below it, without passing props through every level. The pitfall: whenever the context value changes, every component using it re-renders. Keep contexts small and focused, and avoid creating a new value object on every render.`,

"What are error boundaries and how do you handle errors in React?":
`An error boundary is a component that catches errors thrown while rendering its children and shows a fallback screen instead of a blank page. It does not catch errors in click handlers, in async code such as fetch, or in itself, so handle those with ordinary try/catch and error state.`,

"How do you handle forms in React at scale?":
`For large forms, use a library such as React Hook Form, which avoids re-rendering the whole form on every keystroke, together with a schema library such as Zod to define validation rules once. You get field errors, touched states and submission handling without writing them yourself.`,

"What are the React rendering phases and what is concurrent rendering?":
`Each update has two phases. In the <b>render phase</b>, React calls your components to work out what changed, without touching the page. In the <b>commit phase</b>, it applies the changes to the page. <b>Concurrent rendering</b> lets React pause or drop render work, so urgent updates such as typing stay responsive while slower updates wait.`,

"What are custom hooks and how do you design them well?":
`A custom hook is your own function starting with <code>use</code> that bundles state and effects for reuse, such as <code>useDebounce</code> or <code>useFetch</code>. Design them to share behaviour, not UI; give each one a single job; return a clear, small set of values; and name them after what they do.`,

"How do you handle routing and data loading in React?":
`A router such as React Router maps URLs to components. Modern routers can load a page's data before showing it, using "loaders", instead of fetching inside each component after it appears. That avoids chains of loading spinners where each nested component waits for its parent's data before starting its own fetch.`,

"What is the difference between client-side, server-side and static rendering in React?":
`<b>Client-side</b>: the browser downloads JavaScript and builds the page, so the first view is slower. <b>Server-side</b>: the server builds the HTML for each request, so content appears quickly and is search-engine friendly. <b>Static</b>: pages are built once in advance and served instantly from a CDN, best for content that rarely changes.`,

"How do you structure a large React application?":
`Group files by feature (orders, cart, profile) rather than by type (all components in one folder), so everything for one feature lives together. Keep shared UI pieces in a separate folder, keep business logic and data fetching out of display components, and limit what each feature exposes to the others.`,

"Why is my React component re-rendering, and how do I stop it?":
`A component re-renders when its state changes, its parent re-renders, or a context it uses changes. Use the React DevTools Profiler to see why. Then fix the cause: move state down closer to where it is used, avoid passing newly created objects and functions as props, and use <code>React.memo</code> only where it measurably helps.`,

"How do you fetch data in React without race conditions or memory leaks?":
`In an effect, cancel the request when inputs change or the component disappears, using an <code>AbortController</code> in the cleanup function, so an old slow response cannot overwrite newer data. Better still, use a library such as TanStack Query, which handles caching, cancellation, retries and duplicate requests for you.`,

"How do you manage state in a large React application?":
`First sort state by type. Server data (fetched from APIs) belongs in a data library such as TanStack Query. UI state (an open menu) stays local in <code>useState</code>. URL state (filters, page number) lives in the URL. Only truly shared app state needs context or a store such as Zustand or Redux.`,

"Explain the virtual DOM, reconciliation and why keys matter":
`The <b>virtual DOM</b> is React's lightweight copy of the page in memory. On each update React builds a new copy and compares it with the old one (<b>reconciliation</b>), then changes only what differs on the real page. In lists, <b>keys</b> tell React which item is which, so it can move items instead of rebuilding them or mixing up their state.`,

"Controlled vs uncontrolled inputs — how do you handle forms in React?":
`A <b>controlled</b> input stores its value in React state and updates it on every keystroke, which makes live validation and formatting easy. An <b>uncontrolled</b> input keeps its value in the browser, and you read it when needed, usually on submit. Controlled inputs suit most forms; form libraries mix both for performance.`,

"What are Server Components, and how do they change how you build a React app?":
`Server Components run only on the server. They can read the database directly and send finished output to the browser without shipping their JavaScript, so pages load less code. Interactive parts, such as buttons with state, are marked <code>'use client'</code> and run in the browser. You decide, piece by piece, where each part runs.`,

"How do you manage state in a React application, and when do you need a library?":
`Start with local state (<code>useState</code>) and lift it up only as far as needed. Use context for a few widely shared values such as the theme or user. Use a data-fetching library for server data. Reach for a store such as Zustand or Redux only when many distant components share complex, frequently changing state.`,

"How do you find and fix React performance problems?":
`Measure first with the React DevTools Profiler to see which components render too often or slowly. Common fixes: move state closer to where it is used, show long lists with virtualisation (render only the visible rows), split large bundles with lazy loading, and memoise expensive calculations or components only where measurements show a benefit.`,

"Walk me through exactly what React does between a setState call and the screen updating":
`<code>setState</code> queues an update; React groups several updates from the same event together. In the render phase, it calls the affected components and compares the new output with the old. In the commit phase, it applies the differences to the page and runs layout effects. After the browser paints, it runs normal effects.`,

"Show me a component that re-renders too much, and fix it step by step":
`Profile it first. Then: move state into the smallest component that needs it, so typing in one field does not re-render the whole page; stop creating new objects and functions as props on every render, or stabilise them with <code>useMemo</code> and <code>useCallback</code>; and only then wrap expensive children in <code>React.memo</code>.`,

"How do you decide between useState, useReducer, context, and a store?":
`Ask who needs the state and who owns it. One component: <code>useState</code>. One component with complex update rules: <code>useReducer</code>. A value many components read but rarely change (theme, user): context. Frequently changing state shared across distant parts of the app: a store such as Zustand. Server data: a data-fetching library.`,

"What is React and what is the virtual DOM?":
`React is a JavaScript library for building user interfaces from reusable components. You describe what the screen should look like for the current data, and React updates the page. The virtual DOM is React's in-memory copy of the page, which it compares between updates so it changes only what is necessary on the real page.`,

"What are the rules of hooks and why do they exist?":
`Two rules: call hooks only at the top level of a component (never inside conditions, loops or nested functions), and call them only from React components or custom hooks. React identifies each hook by the order it is called, so if the order changes between renders, state ends up attached to the wrong hook.`,

"Explain useState, useEffect and useRef":
`<code>useState</code> holds data that, when changed, updates the screen. <code>useEffect</code> runs code after rendering to work with the outside world, such as fetching data or setting timers, with a dependency list controlling when it runs again. <code>useRef</code> holds a value that survives renders without causing re-renders, often used to access a DOM element.`,

"What is the dependency array and what goes wrong with it?":
`The dependency array lists the values an effect uses, so React re-runs it when any of them changes. Leave a value out and the effect keeps using an old, stale value. Include an object or function that is recreated every render and the effect runs every time, sometimes in an endless loop. The lint rule <code>exhaustive-deps</code> helps catch both.`,

"What is reconciliation and why do list keys matter?":
`Reconciliation is how React compares the new screen description with the previous one to find the minimum changes. For lists, it matches items by their <code>key</code>. With stable, unique keys, React knows an item moved rather than changed. With index keys, inserting an item at the top can make every row's state shift to the wrong item.`,

"useMemo, useCallback and React.memo — when should you actually use them?":
`<code>useMemo</code> remembers a calculated value, <code>useCallback</code> remembers a function, and <code>React.memo</code> skips re-rendering a component when its props have not changed. They only help together: <code>React.memo</code> is useless if you pass a new object or function each time. Use them when profiling shows a real problem, not everywhere.`,

"How do you manage state in React — local, context, or a library?":
`Keep state local by default, in the component that uses it. Lift it to a shared parent when siblings need it. Use context for app-wide values that change rarely. Use a library such as Zustand or Redux when shared state is large and changes often, and TanStack Query for data from your API.`,

"What is the difference between controlled and uncontrolled components?":
`In a <b>controlled</b> component, React state holds the input's value, so every keystroke goes through your code; this makes validation and formatting easy. In an <b>uncontrolled</b> component, the browser holds the value and you read it with a ref, often only on submit; this is simpler and re-renders less.`,

"How do you fetch data in React properly?":
`Hand-written fetching in <code>useEffect</code> easily goes wrong: race conditions, missing cancellation, no caching and duplicate requests. Use a library such as TanStack Query or SWR, or your framework's loaders, which handle loading and error states, caching, retries and refreshing for you.`,

"What are React Server Components and what changed in React 19?":
`Server Components run on the server, can fetch data directly, and send no JavaScript to the browser for themselves. React 19 also added Actions for handling form submissions, the <code>use</code> hook for reading promises and context, <code>useOptimistic</code> for instant UI updates while saving, and simpler ref handling.`,

"How do you optimise React performance?":
`Profile first with React DevTools. Then fix causes rather than symptoms: keep state close to where it is used, avoid new props objects every render, virtualise long lists, lazy-load heavy parts of the app, and use memoisation only where measurements show it helps.`,

"What is prop drilling and how do you avoid it?":
`Prop drilling is passing a value through several components that do not need it, only so a deeply nested child can use it. Avoid it by passing components as children (composition) so the value goes directly where it is needed, using context for widely shared values, or a small store for complex shared state.`,

"How do you test React components?":
`Use React Testing Library, which tests components the way users use them: find elements by their visible text or role, click and type, then check what appears on screen. Avoid testing internal details such as state variables. Mock network calls with a tool such as MSW, and keep a few end-to-end tests with Playwright for key journeys.`
});
