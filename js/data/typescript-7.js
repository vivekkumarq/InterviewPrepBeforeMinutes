registerPrimer("typescript", `<h3>The mental model: JavaScript plus a checker that disappears before runtime</h3>
<p>TypeScript is JavaScript with type annotations. The compiler (<code>tsc</code>) does two separate jobs: it <strong>checks</strong> your types and reports mistakes, and it <strong>erases</strong> the types to produce plain JavaScript. The browser or Node never sees a single type. That one fact explains most TypeScript behaviour: types cannot validate data at runtime, <code>as</code> does not convert anything, and an <code>interface</code> produces no code at all.</p>
<p>The second key idea is that TypeScript is <strong>structural</strong>. A value fits a type if it has the right shape, whatever it is called. Java asks "was this declared as a <code>User</code>?"; TypeScript asks "does it have the fields a <code>User</code> needs?".</p>
<figure class="fig">
<svg viewBox="0 0 620 196" role="img" aria-label="TypeScript source is type-checked and then types are erased, producing plain JavaScript that runs without any type information">
  <defs><marker id="pr-ts" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="20" width="200" height="110" rx="9"/>
  <text class="dg-t" x="22" y="40">user.ts</text>
  <text class="dg-m" x="22" y="64">interface User {</text>
  <text class="dg-m" x="34" y="80">name: string</text>
  <text class="dg-m" x="22" y="96">}</text>
  <text class="dg-m" x="22" y="116">function greet(u: User)</text>
  <line class="dg-line" x1="210" y1="75" x2="246" y2="75" marker-end="url(#pr-ts)"/>
  <rect class="dg-fill" x="248" y="20" width="130" height="110" rx="9"/>
  <text class="dg-t" x="313" y="44" text-anchor="middle">tsc</text>
  <text class="dg-s" x="313" y="68" text-anchor="middle">1. CHECK types</text>
  <text class="dg-s" x="313" y="84" text-anchor="middle">errors stop here</text>
  <text class="dg-s" x="313" y="108" text-anchor="middle">2. ERASE types</text>
  <line class="dg-line" x1="378" y1="75" x2="414" y2="75" marker-end="url(#pr-ts)"/>
  <rect class="dg-fill2" x="416" y="20" width="194" height="110" rx="9"/>
  <text class="dg-t" x="428" y="40">user.js</text>
  <text class="dg-m" x="428" y="64">function greet(u) {</text>
  <text class="dg-m" x="440" y="80">...</text>
  <text class="dg-m" x="428" y="96">}</text>
  <text class="dg-s" x="428" y="118">interface: gone entirely</text>
  <text class="dg-s" x="10" y="160">Compile time: types protect you from your own code.</text>
  <text class="dg-s" x="10" y="178">Runtime: nothing protects you from a server that sends a different shape. Validate at the boundary.</text>
</svg>
<figcaption>Types exist only while you write and build. At runtime it is plain JavaScript.</figcaption>
</figure>
<h3>Worked example: inference, structural typing and narrowing</h3>
<pre><code>// 1. INFERENCE: you rarely need to annotate locals
const count = 3;                    // type: 3 (a literal type, because const)
let total = 0;                      // type: number
const names = ["asha", "ravi"];     // type: string[]

// 2. STRUCTURAL: shape matters, not the declared name
interface Point { x: number; y: number }
const p = { x: 1, y: 2, label: "A" };
function draw(pt: Point) { /* ... */ }
draw(p);                            // OK: p has x and y. The extra field is fine.
draw({ x: 1, y: 2, label: "A" });   // ERROR: an object LITERAL with unknown
                                    // properties is checked strictly, to catch typos

// 3. UNIONS and NARROWING: the compiler follows your checks
function format(value: string | number | null): string {
  if (value === null) return "—";          // here: null
  if (typeof value === "number")
    return value.toFixed(2);               // here: number
  return value.toUpperCase();              // here: must be string
}

// 4. The compiler cannot see runtime data
const data = JSON.parse(text) as Point;    // 'as' checks NOTHING. If the JSON is
                                           // {"x":"1"}, data.x is a string at runtime.</code></pre>
<h3>Types you will use every day</h3>
<table>
<tr><th>Tool</th><th>Use it for</th></tr>
<tr><td><code>interface</code> / <code>type</code></td><td>Describing object shapes; <code>type</code> also names unions</td></tr>
<tr><td>Union <code>A | B</code></td><td>"One of these"; combine with narrowing</td></tr>
<tr><td>Generics <code>&lt;T&gt;</code></td><td>Functions and types that work for any type while keeping it precise</td></tr>
<tr><td><code>unknown</code></td><td>Data you have not checked yet. Safer than <code>any</code>, which turns checking off</td></tr>
<tr><td><code>Partial</code>, <code>Pick</code>, <code>Omit</code>, <code>Record</code></td><td>Deriving new types from existing ones instead of copying fields</td></tr>
<tr><td><code>strict: true</code></td><td>Turns on null checks and more; always on for new projects</td></tr>
</table>`);

appendTopic("typescript", [
{
  q: "Work through what 'this' refers to in each of these five cases",
  level: "advanced", hot: true, tags: ["javascript", "this", "closures", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Flipkart", "Uber", "Zoho"],
  a: `<p>Six rules decide <code>this</code>, and they apply in order. Learn the order and every trick question collapses.</p>
<table>
<tr><th>#</th><th>Call form</th><th><code>this</code> is</th></tr>
<tr><td>1</td><td><code>new Fn()</code></td><td>The newly created object</td></tr>
<tr><td>2</td><td><code>fn.call(x)</code> / <code>.apply(x)</code> / <code>.bind(x)</code></td><td><code>x</code></td></tr>
<tr><td>3</td><td><code>obj.fn()</code></td><td><code>obj</code> — whatever is left of the dot</td></tr>
<tr><td>4</td><td><code>fn()</code> standalone</td><td><code>undefined</code> in strict mode / modules, else <code>globalThis</code></td></tr>
<tr><td>5</td><td><strong>Arrow function</strong></td><td><strong>Whatever it was where the arrow was written</strong> — it has no <code>this</code></td></tr>
<tr><td>6</td><td>Class field arrow</td><td>The instance, permanently</td></tr>
</table>
<pre><code>const user = {
    name: "Vivek",
    greetRegular() { return "hi " + this.name; },
    greetArrow: () =&gt; "hi " + this?.name
};

user.greetRegular();                 // "hi Vivek"      rule 3
user.greetArrow();                   // "hi undefined"  rule 5: the arrow was
                                     // written at module level, so 'this' is
                                     // NOT the object - a very common bug

const detached = user.greetRegular;
detached();                          // TypeError in strict mode: rule 4.
                                     // The function never belonged to user;
                                     // the dot only decided 'this' AT CALL TIME.

detached.call(user);                 // "hi Vivek"      rule 2
const bound = user.greetRegular.bind(user);
bound();                             // "hi Vivek" - bound forever, and
                                     // bound.call(other) CANNOT change it</code></pre>
<pre><code>// The one that bites in real code: a method passed as a callback.
class Timer {
    seconds = 0;

    tickBroken() { this.seconds++; }              // 'this' lost when detached
    tickFixed = () =&gt; { this.seconds++; };        // class field arrow: rule 6

    start() {
        setInterval(this.tickBroken, 1000);  // BOOM: 'this' is undefined
        setInterval(() =&gt; this.tickBroken(), 1000);  // fine: called ON this
        setInterval(this.tickBroken.bind(this), 1000);  // fine: rule 2
        setInterval(this.tickFixed, 1000);   // fine: the arrow captured 'this'
    }
}
// React class components needed bind-in-the-constructor for exactly this
// reason. Hooks removed the problem by removing 'this' from the picture.</code></pre>
<p><strong>The sentence that answers it:</strong> "In JavaScript <code>this</code> is decided by <em>how a function is called</em>, not where it is defined — except for arrow functions, which have no <code>this</code> of their own and simply read the enclosing scope's. That one exception is why arrows fixed the callback problem."</p>
<p><strong>The follow-up to be ready for:</strong> why does <code>obj.method()</code> work but <code>const m = obj.method; m()</code> throw? Because the dot is not part of the function — it is part of the <em>call</em>. Extracting the reference discards the receiver, and the function is then invoked with nothing on its left.</p>`
},
{
  q: "Predict the output of this event loop puzzle, and explain the ordering",
  level: "advanced", hot: true, tags: ["event-loop", "async", "javascript", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Adobe", "Uber", "Flipkart", "Goldman Sachs"],
  a: `<pre><code>console.log("1 script start");

setTimeout(() =&gt; console.log("2 timeout"), 0);

Promise.resolve()
    .then(() =&gt; console.log("3 promise one"))
    .then(() =&gt; console.log("4 promise two"));

queueMicrotask(() =&gt; console.log("5 microtask"));

(async () =&gt; {
    console.log("6 async body");         // runs SYNCHRONOUSLY up to the await
    await null;
    console.log("7 after await");        // this half is a microtask
})();

console.log("8 script end");</code></pre>
<p><strong>The output:</strong></p>
<pre><code>1 script start
6 async body       <- an async function body runs synchronously UNTIL its
8 script end          first await; it is not deferred wholesale
3 promise one      <- microtasks now drain, in the order they were queued
5 microtask
7 after await
4 promise two      <- queued only once "3" resolved, so it joins later
2 timeout          <- macrotask: LAST, even with a 0ms delay</code></pre>
<table>
<tr><th>Queue</th><th>Holds</th><th>When it runs</th></tr>
<tr><td><strong>Call stack</strong></td><td>Synchronous code</td><td>Now</td></tr>
<tr><td><strong>Microtasks</strong></td><td>Promise callbacks, <code>await</code> continuations, <code>queueMicrotask</code></td><td><strong>Drained completely</strong> after the stack empties</td></tr>
<tr><td><strong>Macrotasks</strong></td><td><code>setTimeout</code>, <code>setInterval</code>, I/O, UI events</td><td>One per loop turn, only after microtasks are empty</td></tr>
<tr><td><strong>Render</strong></td><td>Style, layout, paint</td><td>Between turns — never mid-microtask</td></tr>
</table>
<p><strong>The two facts that decide every puzzle of this kind:</strong> the entire microtask queue drains before <em>one</em> macrotask runs, and <code>await</code> is just "the rest of this function becomes a microtask" — the part before the first <code>await</code> is ordinary synchronous code.</p>
<pre><code>// Why this matters beyond quizzes: an infinite microtask chain FREEZES
// the page. Microtasks drain fully before rendering, so the browser never
// gets to paint.
function starve() { Promise.resolve().then(starve); }   // tab locks up

function breathe() { setTimeout(breathe, 0); }          // fine - yields each
                                                         // turn, page stays live

// And the practical version: chunking heavy work so the UI keeps responding
async function processAll(items) {
    for (let i = 0; i &lt; items.length; i++) {
        process(items[i]);
        if (i % 500 === 0) await new Promise(r =&gt; setTimeout(r, 0));  // yield
    }
}</code></pre>
<p><strong>Node differs in one detail worth naming:</strong> it has extra phases, and <code>process.nextTick</code> jumps ahead of the promise microtask queue. In the browser there is just the one microtask queue.</p>`
},
{
  q: "Take this loosely typed function and tighten it step by step",
  level: "advanced", tags: ["types", "generics", "narrowing", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Adobe", "SAP", "Flipkart", "Uber"],
  a: `<p>TypeScript questions are best answered by refactoring something, not by listing features. Here is one function tightened in four passes.</p>
<pre><code>// PASS 0 - the starting point. Compiles, guarantees nothing.
function getField(obj: any, key: string): any {
    return obj[key];
}
const n: number = getField({ name: "Vivek" }, "name");   // no error. It is a
                                                          // string at runtime.</code></pre>
<pre><code>// PASS 1 - generics: tie the return type to the input.
function getField&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K] {
    return obj[key];
}
const user = { name: "Vivek", age: 30 };
getField(user, "name");     // string  - inferred, no annotation needed
getField(user, "age");      // number
getField(user, "nope");     // COMPILE ERROR: "nope" is not keyof typeof user</code></pre>
<pre><code>// PASS 2 - discriminated unions instead of optional-everything.
// BEFORE: every field optional, so every use needs a null check and
// illegal combinations are representable.
type BadState = { loading?: boolean; data?: User; error?: string };
// nothing stops { loading: true, data: user, error: "x" }

// AFTER: the 'status' field discriminates, and TS narrows on it.
type State =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: User }
    | { status: "error"; error: string };

function render(s: State) {
    switch (s.status) {
        case "success": return s.data.name;   // data EXISTS here, no ?. needed
        case "error":   return s.error;       // error exists, data does not
        case "loading": return "…";
        case "idle":    return "";
    }
}
// Illegal states are now unrepresentable, and each branch has exactly the
// fields it should.</code></pre>
<pre><code>// PASS 3 - exhaustiveness that FAILS THE BUILD when a case is added.
function render(s: State): string {
    switch (s.status) {
        case "idle":    return "";
        case "loading": return "…";
        case "success": return s.data.name;
        case "error":   return s.error;
        default:
            const impossible: never = s;      // add a 5th status and THIS
            return impossible;                // line stops compiling
    }
}
// Assigning to 'never' only works when TS has narrowed s to nothing. That
// is what turns "I forgot a case" from a runtime surprise into a build error.</code></pre>
<pre><code>// PASS 4 - validate at the BOUNDARY. A type assertion is a lie to the
// compiler; it checks nothing at runtime.
const user = await res.json() as User;        // UNSAFE: any shape passes

function isUser(v: unknown): v is User {      // a type PREDICATE
    return typeof v === "object" && v !== null &&
           typeof (v as User).name === "string";
}
const raw: unknown = await res.json();
if (!isUser(raw)) throw new Error("unexpected response shape");
raw.name;                                      // narrowed to User, and CHECKED</code></pre>
<table>
<tr><th>Use</th><th>Not</th><th>Because</th></tr>
<tr><td><code>unknown</code></td><td><code>any</code></td><td><code>unknown</code> forces you to narrow before use; <code>any</code> disables checking entirely</td></tr>
<tr><td>A type predicate</td><td><code>as</code></td><td><code>as</code> is an assertion, not a check — it compiles away to nothing</td></tr>
<tr><td>Discriminated union</td><td>All-optional fields</td><td>Makes illegal states unrepresentable</td></tr>
<tr><td><code>never</code> in <code>default</code></td><td>Silent fallthrough</td><td>A new case becomes a compile error</td></tr>
</table>
<p><strong>The framing:</strong> "TypeScript only helps where the types are honest. Every <code>as</code> and every <code>any</code> at an API boundary is a place where the compiler has been told to stop checking — so I validate once at the edge with a predicate, and everything inside can then be trusted."</p>`
}
]);
