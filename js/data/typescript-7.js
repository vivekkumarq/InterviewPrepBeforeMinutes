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
