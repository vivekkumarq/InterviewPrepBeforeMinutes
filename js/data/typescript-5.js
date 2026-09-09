appendTopic("typescript", [
{
  q: "Explain the JavaScript event loop, microtasks and macrotasks",
  level: "advanced", hot: true, tags: ["javascript", "async", "internals", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Uber", "Walmart", "Zoho", "Optum"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 175" role="img" aria-label="Event loop draining the microtask queue before each macrotask">
  <rect class="dg-fill" x="16" y="30" width="140" height="46" rx="8"/>
  <text class="dg-s" x="86" y="50" text-anchor="middle">call stack</text><text class="dg-s" x="86" y="68" text-anchor="middle">runs to completion</text>
  <path class="dg-line" d="M160 53 H210" marker-end="url(#el1)"/>
  <rect class="dg-fill2" x="214" y="24" width="150" height="30" rx="6"/>
  <text class="dg-s" x="289" y="44" text-anchor="middle">microtasks</text>
  <rect class="dg-box" x="214" y="62" width="150" height="30" rx="6"/>
  <text class="dg-s" x="289" y="82" text-anchor="middle">macrotasks</text>
  <text class="dg-s" x="380" y="42">promises, queueMicrotask</text>
  <text class="dg-s" x="380" y="80">setTimeout, I/O, events</text>
  <path class="dg-line" d="M289 96 Q160 140 86 82" marker-end="url(#el1)"/>
  <text class="dg-s" x="16" y="132">after EVERY macrotask, the loop drains the ENTIRE microtask queue —</text>
  <text class="dg-s" x="16" y="152">including microtasks queued by other microtasks. Only then does it render.</text>
  <defs><marker id="el1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>console.log('1');
setTimeout(() =&gt; console.log('2'), 0);          // MACROtask
Promise.resolve().then(() =&gt; console.log('3')); // MICROtask
queueMicrotask(() =&gt; console.log('4'));         // MICROtask
console.log('5');

// Output: 1, 5, 3, 4, 2
// Synchronous code first (1, 5). Then ALL microtasks in order (3, 4).
// Only then the next macrotask (2) — even with a 0 ms timeout.</code></pre>
<pre><code>// The harder version, with async/await
async function a() {
  console.log('a start');
  await b();                     // everything AFTER await is a microtask
  console.log('a end');
}
async function b() { console.log('b'); }

console.log('script start');
a();
setTimeout(() =&gt; console.log('timeout'), 0);
Promise.resolve().then(() =&gt; console.log('promise'));
console.log('script end');

// script start, a start, b, script end, a end, promise, timeout
// 'await' does NOT block — it returns to the caller and schedules the rest.</code></pre>
<table>
<tr><th>Microtask</th><th>Macrotask</th></tr>
<tr><td><code>.then</code> / <code>.catch</code> / <code>.finally</code></td><td><code>setTimeout</code>, <code>setInterval</code></td></tr>
<tr><td>Code after <code>await</code></td><td>I/O callbacks</td></tr>
<tr><td><code>queueMicrotask</code></td><td>DOM events</td></tr>
<tr><td><code>MutationObserver</code></td><td><code>setImmediate</code> (Node), <code>requestAnimationFrame</code> (before paint)</td></tr>
<tr><td colspan="2">The whole microtask queue drains before the next macrotask — <strong>and before the browser paints</strong>.</td></tr>
</table>
<pre><code>// The practical consequence: an infinite microtask chain FREEZES the page.
// The browser never gets to render, because rendering happens between macrotasks.
function starve() { Promise.resolve().then(starve); }   // page is dead, no error

// Breaking up heavy work so the UI stays responsive:
async function processLargeList(items) {
  for (let i = 0; i &lt; items.length; i++) {
    process(items[i]);
    if (i % 100 === 0) await new Promise(r =&gt; setTimeout(r, 0));  // yield a MACROtask
  }
}
// setTimeout, not a promise — only a macrotask boundary lets the browser paint.
// Modern alternative: await scheduler.yield()</code></pre>
<p><strong>Why this matters beyond trivia:</strong> "JavaScript is single-threaded, so a long synchronous function blocks rendering, input handling and everything else. The event loop is what makes async I/O possible without threads — and understanding that microtasks run <em>before</em> the next paint explains both why promise chains feel instant and why an unbounded one hangs the tab."</p>
<p><strong>The Node.js addition, if asked:</strong> Node has phases — timers, pending callbacks, poll, check (<code>setImmediate</code>), close — and <code>process.nextTick</code> runs before <em>all</em> promise microtasks. So <code>setTimeout(fn, 0)</code> versus <code>setImmediate(fn)</code> is non-deterministic at the top level, and deterministic inside an I/O callback where <code>setImmediate</code> always wins.</p>`
},
{
  q: "Explain closures, this binding, and prototypal inheritance",
  level: "advanced", hot: true, tags: ["javascript", "internals", "gotcha"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Zoho", "Uber", "Cognizant", "Optum"],
  a: `<pre><code>// CLOSURE — a function plus the scope it was created in
function counter() {
  let count = 0;                       // not reachable from outside...
  return {
    increment: () =&gt; ++count,          // ...but these keep it alive
    value: () =&gt; count
  };
}
const c = counter();
c.increment(); c.increment();
c.value();      // 2 — genuine private state, with no class and no #field

// The classic interview trap
for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);   // 3, 3, 3
for (let i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);   // 0, 1, 2
// 'var' is function-scoped: ONE binding, shared by all three closures.
// 'let' is block-scoped: a NEW binding per iteration.</code></pre>
<table>
<tr><th><code>this</code> is determined by</th><th>Rule</th><th>Value</th></tr>
<tr><td><code>new Foo()</code></td><td>Construction</td><td>The new object — highest precedence</td></tr>
<tr><td><code>fn.call/apply/bind(x)</code></td><td>Explicit</td><td><code>x</code></td></tr>
<tr><td><code>obj.method()</code></td><td>Implicit</td><td><code>obj</code></td></tr>
<tr><td><code>fn()</code></td><td>Default</td><td><code>undefined</code> in strict mode, <code>globalThis</code> otherwise</td></tr>
<tr><td><strong>Arrow function</strong></td><td><strong>Lexical</strong></td><td>Inherited from where it was <em>defined</em> — cannot be rebound at all</td></tr>
</table>
<pre><code>const user = {
  name: 'Vivek',
  greetRegular() { console.log(this.name); },
  greetArrow: () =&gt; console.log(this.name)     // 'this' is the MODULE scope, not user
};
user.greetRegular();                  // 'Vivek'
user.greetArrow();                    // undefined

const detached = user.greetRegular;
detached();                           // undefined — the receiver is LOST on extraction
detached.call(user);                  // 'Vivek'
const bound = user.greetRegular.bind(user);
bound();                              // 'Vivek'

// Why arrows are correct inside a callback:
class Timer {
  seconds = 0;
  start() {
    setInterval(() =&gt; { this.seconds++; }, 1000);   // ✔ arrow keeps the instance
    // setInterval(function () { this.seconds++; }, 1000);  ✗ 'this' is the timer object
  }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Prototype chain lookup from instance to Object prototype">
  <rect class="dg-fill" x="16" y="60" width="120" height="34" rx="6"/><text class="dg-s" x="76" y="82" text-anchor="middle">dog instance</text>
  <path class="dg-line" d="M140 77 H190" marker-end="url(#pt1)"/>
  <text class="dg-s" x="165" y="66" text-anchor="middle">__proto__</text>
  <rect class="dg-fill2" x="194" y="60" width="130" height="34" rx="6"/><text class="dg-s" x="259" y="82" text-anchor="middle">Dog.prototype</text>
  <path class="dg-line" d="M328 77 H378" marker-end="url(#pt1)"/>
  <rect class="dg-fill2" x="382" y="60" width="130" height="34" rx="6"/><text class="dg-s" x="447" y="82" text-anchor="middle">Animal.prototype</text>
  <path class="dg-line" d="M447 96 V122" marker-end="url(#pt1)"/>
  <rect class="dg-box" x="372" y="122" width="150" height="30" rx="6"/><text class="dg-s" x="447" y="142" text-anchor="middle">Object.prototype → null</text>
  <text class="dg-s" x="16" y="30">a property lookup walks UP this chain until it finds the name or hits null</text>
  <defs><marker id="pt1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// class syntax is SUGAR over the prototype chain — not a different mechanism
class Animal {
  constructor(name) { this.name = name; }     // own property, per instance
  speak() { return this.name + ' makes a sound'; }   // on Animal.prototype, SHARED
}
class Dog extends Animal {
  speak() { return super.speak() + ' (barks)'; }
}
const d = new Dog('Rex');
Object.getPrototypeOf(d) === Dog.prototype;              // true
d.hasOwnProperty('speak');                                // false — it is on the prototype
d.hasOwnProperty('name');                                 // true  — own property

// Why methods live on the prototype: 10,000 Dogs share ONE speak function
// rather than allocating 10,000 copies.</code></pre>
<table>
<tr><th>Practical use of closures</th><th>Example</th></tr>
<tr><td>Private state</td><td>The counter above; module pattern</td></tr>
<tr><td>Memoisation</td><td>A cache captured in the enclosing scope</td></tr>
<tr><td>Partial application</td><td><code>const add5 = x =&gt; y =&gt; x + y</code></td></tr>
<tr><td>Debounce and throttle</td><td>The timer id lives in the closure</td></tr>
<tr><td>React hooks</td><td>Every hook is a closure over the component's render — which is exactly why stale-closure bugs happen</td></tr>
</table>
<p><strong>The memory-leak warning worth adding:</strong> a closure keeps its <em>entire</em> enclosing scope alive, not just the variables it uses. A callback that captures one field of a huge object can retain the whole thing — which is a real cause of leaks in long-lived event listeners.</p>`
}
]);
