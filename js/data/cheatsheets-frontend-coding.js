registerSheet("angular", [
  { h: "Change detection", t: "list", items: [
    "Zone.js patches every async API; when one fires Angular checks the <b>whole tree</b>.",
    "<code>OnPush</code> re-checks only on: an <code>@Input</code> <b>reference</b> change, an event from its own template, an <code>async</code> pipe emission, or <code>markForCheck()</code>.",
    "Mutating an array in place does <b>not</b> change the reference — OnPush children never update.",
    "Signals give fine-grained reactivity; <code>provideZonelessChangeDetection()</code> drops Zone.js entirely.",
    "Slow list? A function call in a template re-runs every cycle, and a missing <code>track</code> recreates every DOM node."
  ]},
  { h: "RxJS operator choice", t: "table", rows: [
    ["Operator", "On a new emission", "Use for"],
    ["<code>switchMap</code>", "<b>Cancels</b> the in-flight one", "Search, autocomplete, navigation"],
    ["<code>concatMap</code>", "Queues, preserves order", "Sequential writes"],
    ["<code>mergeMap</code>", "Runs in parallel", "Independent requests"],
    ["<code>exhaustMap</code>", "Ignores new until done", "<b>Submit buttons</b> — stops double submit"]
  ]},
  { h: "The catchError placement bug", t: "code", lang: "typescript", code:
"results$ = this.search$.pipe(\n  debounceTime(300), distinctUntilChanged(),\n  switchMap(term => this.api.search(term).pipe(\n    catchError(() => of([]))       // ✔ INSIDE — one failure kills one request\n  ))\n);\n// catchError on the OUTER stream completes it, and the search box\n// stops working permanently. This is the most common RxJS bug." },
  { h: "Forms", t: "table", rows: [
    ["", "Reactive", "Template-driven"],
    ["Model lives in", "The component", "The template"],
    ["Dynamic fields", "<b><code>FormArray</code></b>", "Awkward"],
    ["Unit-testable without DOM", "<b>Yes</b>", "No"],
    ["Use for", "Anything non-trivial", "A two-field login"]
  ]},
  { h: "Performance", t: "list", items: [
    "Lazy-load routes with <code>loadChildren</code>; use <code>canMatch</code> so an unauthorised user never downloads the chunk.",
    "<code>@defer (on viewport)</code> for heavy below-the-fold widgets.",
    "<code>track</code> in every <code>@for</code>.",
    "Set build budgets so the build <b>fails</b> when a bundle grows.",
    "Unsubscribe with the <code>async</code> pipe or <code>takeUntilDestroyed()</code>."
  ]}
]);

registerSheet("react", [
  { h: "Rules of hooks — and why", t: "list", items: [
    "Call hooks only at the <b>top level</b>, only from a component or another hook.",
    "React matches hooks <b>by call index</b>, not by name — it keeps an ordered list per component.",
    "A conditional hook shifts every later slot, so state lands in the wrong hook.",
    "Fix by hooking unconditionally and branching inside, or splitting into two components."
  ]},
  { h: "Which hook", t: "table", rows: [
    ["Hook", "For"],
    ["<code>useState</code>", "Local state; pass a function for lazy init"],
    ["<code>useReducer</code>", "Several interdependent fields"],
    ["<code>useEffect</code>", "<b>Synchronising with the outside world</b> — not deriving state"],
    ["<code>useLayoutEffect</code>", "Measuring before paint"],
    ["<code>useRef</code>", "A mutable value that must not re-render; DOM refs"],
    ["<code>useMemo</code>/<code>useCallback</code>", "Stabilise an expensive value or a function identity"],
    ["<code>useTransition</code>", "Mark an update non-urgent"],
    ["<code>useSyncExternalStore</code>", "Subscribe to an outside store safely"]
  ]},
  { h: "The most common misuse", t: "code", lang: "javascript", code:
"// ✗ two renders, an intermediate wrong state, a sync bug waiting\nconst [full, setFull] = useState('');\nuseEffect(() => setFull(first + ' ' + last), [first, last]);\n\n// ✔ it is not state, it is a value\nconst full = first + ' ' + last;\n\n// Rule: if it can be computed from props or existing state, it is NOT state." },
  { h: "Controlled vs uncontrolled", t: "table", rows: [
    ["", "Controlled", "Uncontrolled"],
    ["Value in", "React state", "The DOM node"],
    ["Re-renders", "<b>Every keystroke</b>", "None"],
    ["Read via", "State", "A ref, on submit"],
    ["Use for", "Live validation, small forms", "Large forms, file inputs, 3rd-party widgets"]
  ]},
  { h: "Server Components", t: "table", rows: [
    ["", "Server", "Client (<code>'use client'</code>)"],
    ["Ships JS", "<b>None</b>", "Yes"],
    ["Hooks / state", "No", "Yes"],
    ["DB access / secrets", "<b>Yes</b>", "No"],
    ["Rule", "Server by default; push <code>'use client'</code> to the leaves", "The boundary is viral downward"]
  ]}
]);

registerSheet("typescript", [
  { h: "Narrowing tools", t: "table", rows: [
    ["Tool", "Works on"],
    ["<code>typeof</code>", "Primitives"],
    ["<code>instanceof</code>", "Classes (fails across realms)"],
    ["<code>in</code>", "Object shapes"],
    ["Literal comparison", "<b>Discriminated unions</b> — most reliable"],
    ["<code>v is T</code>", "Anything — <b>you</b> guarantee it"],
    ["<code>asserts v is T</code>", "Narrows for the rest of the scope"]
  ]},
  { h: "Make illegal states unrepresentable", t: "code", lang: "typescript", code:
"type State<T> =\n  | { status: 'loading' }\n  | { status: 'success'; data: T }      // data ONLY here\n  | { status: 'error'; error: Error };  // error ONLY here\n\n// vs { loading: boolean; data?: T; error?: Error }\n// which lets { loading: true, data: [...], error: e } compile — and someone\n// eventually renders a spinner over stale data next to an error." },
  { h: "Utility types", t: "table", rows: [
    ["<code>Partial&lt;T&gt;</code> / <code>Required&lt;T&gt;</code>", "All optional / all required"],
    ["<code>Pick&lt;T,K&gt;</code> / <code>Omit&lt;T,K&gt;</code>", "Select or exclude keys"],
    ["<code>Record&lt;K,V&gt;</code>", "Object with keys K"],
    ["<code>Exclude&lt;T,U&gt;</code> / <code>Extract&lt;T,U&gt;</code>", "Filter a union"],
    ["<code>ReturnType</code>, <code>Parameters</code>, <code>Awaited</code>", "Extract from functions and promises"],
    ["<code>NoInfer&lt;T&gt;</code>", "Block inference at one position"]
  ]},
  { h: "Event loop order", t: "code", lang: "javascript", code:
"console.log('1');\nsetTimeout(() => console.log('2'), 0);           // MACROtask\nPromise.resolve().then(() => console.log('3'));  // MICROtask\nconsole.log('4');\n// -> 1, 4, 3, 2\n\n// The ENTIRE microtask queue drains after every macrotask — and BEFORE\n// the browser paints. An infinite microtask chain freezes the tab." },
  { h: "this binding, in precedence order", t: "list", items: [
    "<code>new Foo()</code> → the new object",
    "<code>fn.call/apply/bind(x)</code> → <code>x</code>",
    "<code>obj.method()</code> → <code>obj</code>",
    "<code>fn()</code> → <code>undefined</code> (strict) or <code>globalThis</code>",
    "<b>Arrow function</b> → lexical, from where it was <i>defined</i>; cannot be rebound"
  ]}
]);

registerSheet("dsa", [
  { h: "Complexity vs input size", t: "table", rows: [
    ["n up to", "Target"],
    ["10⁸+", "O(n) or O(log n)"],
    ["10⁶", "O(n) or O(n log n)"],
    ["10⁴", "O(n²)"],
    ["500", "O(n³)"],
    ["20", "O(2ⁿ) — bitmask DP"],
    ["11", "O(n!) — permutations"]
  ]},
  { h: "Clue → technique", t: "table", rows: [
    ["Sorted array", "Binary search, two pointers"],
    ["Contiguous subarray/substring", "Sliding window, prefix sums"],
    ["Top K / median of a stream", "Heap"],
    ["All permutations / combinations", "Backtracking"],
    ["Number of ways / min cost", "Dynamic programming"],
    ["Shortest path, grid", "BFS (unweighted), Dijkstra (weighted)"],
    ["Prefix / autocomplete", "Trie"],
    ["Next greater element", "Monotonic stack"],
    ["Overlapping ranges", "Sort, then sweep"],
    ["Connectivity over time", "Union-Find"],
    ["In place, O(1) space", "Two pointers, index-as-hash, bit tricks"]
  ]},
  { h: "Amortised vs average vs worst", t: "list", items: [
    "<b>Amortised O(1)</b> — total over a sequence is O(n). <code>ArrayList.add</code>.",
    "<b>Average O(1)</b> — expected over random input. <code>HashMap.get</code>.",
    "<b>Worst-case O(1)</b> — every call, always. Array indexing.",
    "They are three different claims. Say which you mean."
  ]},
  { h: "The method", t: "list", items: [
    "Restate and clarify — nulls, duplicates, empty, ranges, is there exactly one answer?",
    "Work a small example by hand; the pattern usually appears here.",
    "State the brute force — you now have <i>a</i> solution.",
    "Name the bottleneck: what am I recomputing that I could remember?",
    "Confirm the approach and complexity <i>before</i> coding.",
    "Trace your own code on the example, then state edges and complexity.",
    "<b>Think out loud.</b> Interviewers cannot award marks for silent reasoning."
  ]}
]);

registerSheet("hr", [
  { h: "STAR, with the right weight", t: "table", rows: [
    ["Part", "Time", "Content"],
    ["Situation", "15%", "Context in one or two sentences"],
    ["Task", "15%", "What <b>you</b> were responsible for"],
    ["<b>Action</b>", "<b>60%</b>", "What you did, and the trade-off you weighed"],
    ["Result", "10%", "Outcome — a real number if you have one"]
  ]},
  { h: "Questions to expect", t: "list", items: [
    "Tell me about yourself — 90 seconds: now, relevant past, why this role.",
    "A project you are proud of — pick one you can defend under drilling.",
    "A conflict with a teammate — show you sought their reasoning first.",
    "A production incident you caused — own it, then the systemic fix.",
    "Feedback you received and acted on.",
    "Why are you leaving? — forward-looking, never disparaging.",
    "Where do you see yourself? — direction, not a job title."
  ]},
  { h: "Ask them", t: "list", items: [
    "What does a typical week look like for this role?",
    "How does work get from an idea to production?",
    "What is the on-call rotation like, and how often does it fire?",
    "How is technical debt handled — is time allocated?",
    "What would success look like at three and six months?",
    "Why is this role open?",
    "What is one thing you would change about working here?"
  ]},
  { h: "Salary", t: "list", items: [
    "Deflect early: “I'd like to learn more about the role first — what is the band?”",
    "Give a <b>range</b> anchored on researched market data, not your current pay.",
    "Negotiate the whole package: base, bonus, equity, notice, leave, remote.",
    "Never accept on the call. “Thank you — may I have it in writing and respond by Friday?”"
  ]},
  { h: "Say this", t: "quote", text: "The strongest answers are specific. A well-explained bug fix where you found the root cause and added a regression test beats a vague microservices migration — depth of understanding scores, scale does not." }
]);
