appendTopic("typescript", [
{
  q: "What are conditional types, infer and template literal types?",
  level: "advanced", tags: ["types", "advanced"],
  a: `<pre><code>// Conditional type — a type-level if/else
type IsArray&lt;T&gt; = T extends unknown[] ? true : false;
type A = IsArray&lt;string[]&gt;;      // true
type B = IsArray&lt;string&gt;;        // false

// infer — extract a type from within another type
type ElementOf&lt;T&gt; = T extends (infer U)[] ? U : never;
type C = ElementOf&lt;Order[]&gt;;     // Order

type Unwrap&lt;T&gt; = T extends Promise&lt;infer U&gt; ? U : T;
type D = Unwrap&lt;Promise&lt;Order&gt;&gt;; // Order

// This is how the built-in utility types are written
type MyReturnType&lt;T&gt; = T extends (...args: never[]) =&gt; infer R ? R : never;
type MyParameters&lt;T&gt; = T extends (...args: infer P) =&gt; unknown ? P : never;

// Template literal types — build string types from other types
type EventName&lt;T extends string&gt; = \`on\${Capitalize&lt;T&gt;}\`;
type E = EventName&lt;'click'&gt;;     // "onClick"

type ApiRoute = \`/api/v1/\${'orders' | 'customers'}/\${string}\`;
const r: ApiRoute = '/api/v1/orders/42';        // ✔
const bad: ApiRoute = '/api/orders/42';         // ✘ compile error

// Combined: type-safe getters derived from a model
type Getters&lt;T&gt; = {
  [K in keyof T as \`get\${Capitalize&lt;string &amp; K&gt;}\`]: () =&gt; T[K]
};
type OrderGetters = Getters&lt;{ id: string; total: number }&gt;;
// { getId: () =&gt; string; getTotal: () =&gt; number }</code></pre>
<p><strong>Where this is genuinely useful rather than clever:</strong> deriving types instead of duplicating them. An API client can infer response types from a route map; a form library can derive field names from a schema; an event emitter can type its listeners from an event map. In every case the compiler catches a mismatch that would otherwise be a runtime bug.</p>
<p><strong>The caution worth voicing:</strong> deeply nested conditional types produce error messages that are genuinely unreadable, and slow the compiler noticeably on large codebases. I keep advanced type gymnastics to shared library boundaries where the payoff is real, and write plain, obvious types in application code — the next developer has to maintain it.</p>`
},
{
  q: "How do you type an API client and handle unknown data safely?",
  level: "advanced", hot: true, tags: ["types", "validation"],
  a: `<pre><code>// The core problem: TypeScript types are ERASED at runtime.
const user = await res.json() as User;    // a LIE — nothing validated anything

// Zod: one schema gives you runtime validation AND the static type
import { z } from 'zod';

const OrderSchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  total: z.number().nonnegative(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED']),
  placedAt: z.string().datetime().transform(s =&gt; new Date(s)),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive() })).min(1),
});

type Order = z.infer&lt;typeof OrderSchema&gt;;   // the type is DERIVED — they cannot drift

async function getOrder(id: string): Promise&lt;Order&gt; {
  const res = await fetch(\`/api/v1/orders/\${id}\`);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return OrderSchema.parse(await res.json());   // throws on shape mismatch, at the BOUNDARY
}

// safeParse when you want to handle it rather than throw
const result = OrderSchema.safeParse(data);
if (!result.success) { logger.warn('contract violation', result.error.issues); }</code></pre>
<p><strong>Why <code>as</code> is dangerous:</strong> a type assertion tells the compiler to stop checking. If the API returns <code>total</code> as a string, or omits <code>status</code>, TypeScript reports nothing and the failure surfaces later as <code>undefined is not a function</code> somewhere unrelated. Validating at the boundary converts a mysterious downstream crash into a precise, immediate error naming the field.</p>
<p><strong>The principle to state:</strong> validate at every trust boundary — HTTP responses, <code>JSON.parse</code>, <code>localStorage</code>, URL parameters, environment variables, WebSocket messages. Inside that boundary, trust the types completely. That is what makes strict TypeScript actually meaningful rather than decorative.</p>
<p><strong>Generating rather than hand-writing:</strong> if the API has an OpenAPI spec, generate the client and types from it (<code>openapi-typescript</code>, or OpenAPI Generator's <code>typescript-axios</code>) so the frontend cannot drift from the contract — and a breaking backend change becomes a compile error in CI.</p>`
},
{
  q: "What is the difference between unknown, any, never and void?",
  level: "advanced", hot: true, tags: ["types"],
  a: `<table>
<tr><th>Type</th><th>Meaning</th><th>Assignable to</th><th>Use for</th></tr>
<tr><td><code>any</code></td><td>Disables all checking</td><td>Everything</td><td>Escape hatch — avoid</td></tr>
<tr><td><code>unknown</code></td><td>"Some value, type not yet known"</td><td>Nothing without narrowing</td><td><strong>Safe alternative to <code>any</code></strong></td></tr>
<tr><td><code>never</code></td><td>A value that can never occur</td><td>Everything (it is the bottom type)</td><td>Exhaustiveness checks, functions that never return</td></tr>
<tr><td><code>void</code></td><td>No meaningful return value</td><td>—</td><td>Function return type</td></tr>
</table>
<pre><code>// any — the compiler stops helping entirely
function process(data: any) {
  data.foo.bar.baz();          // compiles fine, crashes at runtime
}

// unknown — forces you to prove the type before use
function process(data: unknown) {
  data.foo;                    // ✘ compile error: 'data' is of type 'unknown'
  if (typeof data === 'object' &amp;&amp; data !== null &amp;&amp; 'foo' in data) {
    data.foo;                  // ✔ narrowed
  }
}

// never — exhaustiveness checking, the most valuable use
type Status = 'PENDING' | 'PAID' | 'SHIPPED';

function label(s: Status): string {
  switch (s) {
    case 'PENDING': return 'Awaiting payment';
    case 'PAID':    return 'Paid';
    case 'SHIPPED': return 'On its way';
    default:
      const exhaustive: never = s;      // adding a Status BREAKS THE BUILD here
      throw new Error(\`Unhandled: \${exhaustive}\`);
  }
}

// never as a return type — the function never completes normally
function fail(msg: string): never { throw new Error(msg); }</code></pre>
<p><strong>The practical rule:</strong> replace <code>any</code> with <code>unknown</code> in every signature that accepts arbitrary data — a caught error (<code>catch (e: unknown)</code> is the default under <code>useUnknownInCatchVariables</code>), a JSON payload, a third-party callback. It costs one narrowing check and eliminates a whole class of runtime failure.</p>
<p><strong>The <code>never</code> exhaustiveness trick is worth emphasising</strong> — it turns "someone added an enum value and forgot to handle it" from a production bug into a compile error, in every switch across the codebase. That single pattern justifies discriminated unions on its own.</p>`
},
{
  q: "How do modules, imports and tree-shaking work in modern JavaScript?",
  level: "advanced", tags: ["javascript", "bundling"],
  a: `<pre><code>// ES Modules — STATIC, analysable at build time
import { formatMoney } from './money';           // named — tree-shakeable
import Money from './money';                     // default
import * as utils from './utils';                // namespace — often defeats tree-shaking
export { formatMoney };
export default class Money {}

// Dynamic import — returns a promise, creates a separate chunk
const { heavyChart } = await import('./charts');  // code splitting

// CommonJS — DYNAMIC, resolved at runtime
const { formatMoney } = require('./money');       // cannot be statically analysed</code></pre>
<p><strong>Why the static/dynamic distinction matters:</strong> ES module imports are resolved at <em>compile</em> time, so a bundler can build an exact dependency graph and remove code nothing imports — <strong>tree-shaking</strong>. CommonJS <code>require</code> can be called conditionally with a computed path, so the bundler must keep everything.</p>
<pre><code>// ✘ imports the entire library — often hundreds of kilobytes
import _ from 'lodash';
import * as dateFns from 'date-fns';

// ✔ only what is used survives bundling
import debounce from 'lodash/debounce';
import { format } from 'date-fns';</code></pre>
<p><strong>What breaks tree-shaking</strong> — worth knowing, because it explains most oversized bundles:</p>
<ul>
<li><strong>Side effects at module scope.</strong> If importing a module runs code (registering a polyfill, mutating a prototype), the bundler cannot remove it. Declare <code>"sideEffects": false</code> in <code>package.json</code> when your package is genuinely pure.</li>
<li><strong>CommonJS dependencies</strong> — a single CJS package in the graph can pull in everything.</li>
<li><strong>Namespace imports</strong> and re-export barrels (<code>index.ts</code> re-exporting 200 modules) frequently defeat it.</li>
</ul>
<p><strong>The practical workflow:</strong> analyse the bundle (<code>source-map-explorer</code>, <code>vite-bundle-visualizer</code>, webpack-bundle-analyzer), find the largest entries, and check whether each is imported correctly and actually needed. The usual finds are moment.js, a full icon set, and a chart library imported at the top level rather than lazily.</p>`
},
{
  q: "What is the prototype chain and how does class inheritance work in JavaScript?",
  level: "advanced", tags: ["javascript", "fundamentals"],
  a: `<p>JavaScript has no classes at runtime — <code>class</code> is syntax over <strong>prototypal inheritance</strong>. Every object has an internal link to another object (its prototype), and property lookup walks that chain until it finds the property or reaches <code>null</code>.</p>
<pre><code>const order = new Order();
// lookup: order -&gt; Order.prototype -&gt; Object.prototype -&gt; null

Object.getPrototypeOf(order) === Order.prototype;          // true
order.hasOwnProperty('total');                             // own property?
'toString' in order;                                       // true — found on the chain

class Order {
  #internal = 1;                       // TRUE private field (not just a convention)
  static count = 0;                    // static field
  constructor(total) { this.total = total; }
  describe() { return \`Order \${this.total}\`; }   // lives on Order.prototype, SHARED
}

class RushOrder extends Order {
  constructor(total) { super(total); }            // super() MUST come first
  describe() { return \`RUSH: \${super.describe()}\`; }
}</code></pre>
<p><strong>The key insight:</strong> methods live on the prototype and are <em>shared</em> by every instance — one function object, not one per instance. A method defined as a class <em>field</em> (<code>describe = () =&gt; {}</code>) is created per instance instead: more memory, but it binds <code>this</code> lexically, which is why React class components used that form for event handlers.</p>
<p><strong>Practical consequences worth stating:</strong></p>
<ul>
<li><strong>Never mutate built-in prototypes</strong> (<code>Array.prototype.foo = ...</code>) — it affects every array in the process, breaks <code>for...in</code>, and collides with future language features. This is how the "smoosh-gate" incident happened.</li>
<li><strong><code>Object.create(null)</code></strong> creates an object with no prototype — useful as a dictionary, because it cannot be confused by an inherited <code>toString</code> or the <code>__proto__</code> key. This is also the defence against <strong>prototype pollution</strong>, a real vulnerability class where merging untrusted JSON containing <code>__proto__</code> modifies <code>Object.prototype</code> globally.</li>
<li><strong><code>instanceof</code> walks the prototype chain</strong>, so it fails across realms (iframes, worker threads) where each has its own <code>Array</code>. Use <code>Array.isArray</code> instead.</li>
</ul>`
},
{
  q: "What are the JavaScript memory management and garbage collection concepts?",
  level: "advanced", tags: ["javascript", "memory"],
  a: `<p>JavaScript engines use <strong>mark-and-sweep</strong>: starting from roots (the global object, the current call stack, closures in scope), the collector marks everything reachable and frees the rest. Reference cycles are collected correctly, unlike naive reference counting.</p>
<p><strong>The common leak sources in a browser application:</strong></p>
<pre><code>// 1. Forgotten timers — the closure keeps the whole component alive
useEffect(() =&gt; {
  const id = setInterval(poll, 1000);
  return () =&gt; clearInterval(id);          // MUST clean up
}, []);

// 2. Event listeners never removed
useEffect(() =&gt; {
  const onResize = () =&gt; setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () =&gt; window.removeEventListener('resize', onResize);
}, []);

// 3. Detached DOM nodes — the element is removed from the page but still referenced
const cache = new Map();
cache.set('row', document.getElementById('row'));   // keeps the DOM subtree alive forever

// 4. Growing module-level caches
const cache = new Map();                            // never evicted = a leak with a nice name

// 5. Closures capturing more than intended
function makeHandler(hugeArray) {
  return () =&gt; console.log('clicked');               // captures hugeArray unnecessarily
}</code></pre>
<pre><code>// WeakMap / WeakSet — entries do not prevent collection of their KEYS
const metadata = new WeakMap();
metadata.set(domNode, { clicks: 0 });
// When domNode is removed and unreferenced, the entry disappears automatically.
// Ideal for attaching data to objects you do not own.</code></pre>
<p><strong>How to find a leak in practice:</strong> Chrome DevTools → Memory. Take a heap snapshot, exercise the suspected flow (navigate away and back several times), take another, and use the <strong>Comparison</strong> view to see what grew. Detached DOM nodes appear explicitly. The Performance panel's memory timeline shows whether the sawtooth returns to the same baseline — a rising baseline is the signature of a leak.</p>
<p><strong>The single most common cause in SPAs</strong> is a subscription or listener registered on mount and never cleaned up, so every navigation leaves another copy of the component alive. That is exactly why <code>useEffect</code> returns a cleanup function and why Angular has <code>takeUntilDestroyed</code>.</p>`
}
]);
