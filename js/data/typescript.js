registerTopic("typescript", [
{
  q: "What is TypeScript and what does it give you over JavaScript?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. All types are erased at compile time — <strong>there is no runtime type checking</strong>.</p>
<ul>
<li><strong>Catches errors at compile time</strong> — typos, wrong arguments, null dereferences.</li>
<li><strong>Editor tooling</strong> — accurate autocomplete, safe rename, find-references. This is arguably the biggest day-to-day benefit.</li>
<li><strong>Types as documentation</strong> that cannot go stale, because the compiler checks them.</li>
<li><strong>Safer refactoring</strong> at scale — change a type and the compiler lists every place to update.</li>
</ul>
<pre><code>interface Order { id: string; total: number; status: 'PENDING' | 'PAID'; }

function applyDiscount(order: Order, rate: number): Order {
  return { ...order, total: order.total * (1 - rate) };
}
applyDiscount(order, "10");     // ✘ compile error: string is not assignable to number</code></pre>
<p><strong>The limitation to state honestly:</strong> because types are erased, data crossing a boundary — an API response, <code>JSON.parse</code>, <code>localStorage</code> — is <em>not</em> validated. Declaring <code>const user = await res.json() as User</code> is a promise, not a check. Use a runtime validator such as <strong>Zod</strong> at the boundary and infer the type from the schema, so the compile-time and runtime shapes cannot diverge.</p>`
},
{
  q: "What is the difference between interface and type?",
  level: "beginner", hot: true, tags: ["types"],
  a: `<table>
<tr><th></th><th><code>interface</code></th><th><code>type</code></th></tr>
<tr><td>Declaration merging</td><td><strong>Yes</strong> — reopening adds members</td><td>No — duplicate name is an error</td></tr>
<tr><td>Extends</td><td><code>extends</code></td><td>Intersection <code>&amp;</code></td></tr>
<tr><td>Unions</td><td>No</td><td><strong>Yes</strong></td></tr>
<tr><td>Primitives, tuples, mapped types</td><td>No</td><td><strong>Yes</strong></td></tr>
<tr><td>Error messages</td><td>Often clearer</td><td>Can expand into large inline types</td></tr>
</table>
<pre><code>interface Order { id: string }
interface Order { total: number }        // merged — Order now has both

type Status = 'PENDING' | 'PAID';        // only 'type' can do this
type Pair = [string, number];
type Handler = (e: Event) =&gt; void;
type WithTimestamps&lt;T&gt; = T &amp; { createdAt: Date };</code></pre>
<p><strong>Practical guidance:</strong> use <code>interface</code> for object shapes you expect others to extend or implement — especially public APIs, where declaration merging lets consumers augment your types. Use <code>type</code> for unions, tuples, function types, mapped and conditional types.</p>
<p>Beyond that the difference rarely matters. Pick one convention per codebase and be consistent — that answer is better than arguing for a universal rule.</p>`
},
{
  q: "Explain generics with a real example",
  level: "advanced", hot: true, tags: ["generics"],
  a: `<p>Generics let a function or type work over many types while preserving the relationship between input and output.</p>
<pre><code>// Without generics you lose the type
function firstAny(items: any[]): any { return items[0]; }

// With generics the caller keeps full type information
function first&lt;T&gt;(items: T[]): T | undefined { return items[0]; }
const o = first(orders);      // inferred as Order | undefined

// Constraints
function pluck&lt;T, K extends keyof T&gt;(items: T[], key: K): T[K][] {
  return items.map(i =&gt; i[key]);
}
pluck(orders, 'total');       // number[]   — checked and inferred
pluck(orders, 'nope');        // ✘ compile error

// A typed API client
async function get&lt;T&gt;(url: string): Promise&lt;T&gt; {
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise&lt;T&gt;;
}
const order = await get&lt;Order&gt;('/api/orders/1');

// Generic with a default and multiple parameters
interface Paged&lt;T, M = Record&lt;string, unknown&gt;&gt; {
  content: T[];
  page: { number: number; totalElements: number };
  meta?: M;
}</code></pre>
<p><strong>The point to articulate:</strong> generics are about <em>preserving relationships</em>. <code>any</code> also accepts anything, but it throws the information away — the caller gets no autocomplete and no checking downstream. A generic says "whatever type goes in, this type comes out", which the compiler can then verify everywhere.</p>`
},
{
  q: "What are utility types and which do you use?",
  level: "advanced", hot: true, tags: ["types"],
  a: `<pre><code>interface Order { id: string; total: number; status: Status; notes?: string; }

Partial&lt;Order&gt;                  // all properties optional — PATCH payloads
Required&lt;Order&gt;                 // all required
Readonly&lt;Order&gt;                 // all readonly
Pick&lt;Order, 'id' | 'total'&gt;     // subset
Omit&lt;Order, 'id'&gt;               // everything except — create-request DTOs
Record&lt;Status, string&gt;          // a map with exhaustive keys
Exclude&lt;Status, 'PAID'&gt;         // remove union members
Extract&lt;A | B, A&gt;               // keep matching members
NonNullable&lt;string | null&gt;      // string
ReturnType&lt;typeof createOrder&gt;  // infer a function's return type
Parameters&lt;typeof fn&gt;           // tuple of parameter types
Awaited&lt;Promise&lt;Order&gt;&gt;         // unwrap a promise</code></pre>
<pre><code>// Real usage: derive DTOs from the domain type so they cannot drift
type CreateOrderRequest = Omit&lt;Order, 'id' | 'createdAt'&gt;;
type UpdateOrderRequest = Partial&lt;CreateOrderRequest&gt;;

// Record with a union key is exhaustive — adding a Status breaks the build until handled
const LABELS: Record&lt;Status, string&gt; = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  SHIPPED: 'On its way',
};

// Writing your own
type Nullable&lt;T&gt; = { [K in keyof T]: T[K] | null };
type DeepPartial&lt;T&gt; = { [K in keyof T]?: T[K] extends object ? DeepPartial&lt;T[K]&gt; : T[K] };</code></pre>
<p><strong>Why this matters practically:</strong> deriving types instead of duplicating them means a change to <code>Order</code> automatically propagates to every DTO, and any place that no longer compiles is a place you genuinely needed to update. That is the whole value proposition of TypeScript in one pattern.</p>`
},
{
  q: "What are union types, discriminated unions and type narrowing?",
  level: "advanced", hot: true, tags: ["types"],
  a: `<pre><code>// Discriminated union — a shared literal field distinguishes the variants
type Result =
  | { status: 'loading' }
  | { status: 'success'; data: Order[] }
  | { status: 'error'; error: string };

function render(result: Result) {
  switch (result.status) {
    case 'loading': return &lt;Spinner /&gt;;
    case 'success': return &lt;List items={result.data} /&gt;;    // data is available HERE only
    case 'error':   return &lt;Alert msg={result.error} /&gt;;
    default:
      const _exhaustive: never = result;                    // compile error if a case is added
      return _exhaustive;
  }
}</code></pre>
<p><strong>Narrowing mechanisms:</strong></p>
<pre><code>if (typeof x === 'string')        // typeof guard
if (x instanceof Error)           // instanceof guard
if ('total' in obj)               // in operator
if (x !== null)                    // truthiness / equality
if (Array.isArray(x))

// Custom type guard — the 'is' predicate teaches the compiler
function isOrder(v: unknown): v is Order {
  return typeof v === 'object' &amp;&amp; v !== null &amp;&amp; 'id' in v &amp;&amp; 'total' in v;
}</code></pre>
<p><strong>Why discriminated unions are the most valuable pattern in TypeScript:</strong> they make illegal states unrepresentable. Instead of <code>{ loading: boolean; data?: Order[]; error?: string }</code> — which permits the nonsensical "loading and error at the same time, with data" — the union guarantees exactly one shape is active, and the compiler forces you to handle each.</p>
<p>The <code>never</code> exhaustiveness check is the finishing touch: adding a new variant produces a compile error in every switch that has not handled it, turning a runtime bug into a build failure.</p>`
},
{
  q: "What is strict mode and what does strictNullChecks do?",
  level: "beginner", hot: true, tags: ["config"],
  a: `<pre><code>{
  "compilerOptions": {
    "strict": true,                         // enables all of the below
    "noUncheckedIndexedAccess": true,       // arr[0] is T | undefined — very valuable
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true
  }
}</code></pre>
<p><code>strict</code> turns on: <code>strictNullChecks</code>, <code>noImplicitAny</code>, <code>strictFunctionTypes</code>, <code>strictBindCallApply</code>, <code>strictPropertyInitialization</code>, <code>alwaysStrict</code>, <code>useUnknownInCatchVariables</code>.</p>
<p><strong><code>strictNullChecks</code> is the important one.</strong> Without it, <code>null</code> and <code>undefined</code> are assignable to every type, so TypeScript cannot catch the single most common runtime error in JavaScript. With it, nullability becomes part of the type:</p>
<pre><code>function find(id: string): Order | undefined { ... }

const order = find('1');
order.total;             // ✘ 'order' is possibly undefined
order?.total;            // ✔ optional chaining
if (order) order.total;  // ✔ narrowed
const total = order?.total ?? 0;   // ✔ nullish coalescing</code></pre>
<p><strong>Always enable <code>strict</code> on a new project.</strong> Retrofitting it onto a large codebase is painful, which is exactly why it should be on from day one. For migration, enable flags incrementally and use <code>// @ts-expect-error</code> (not <code>@ts-ignore</code>) so the suppression itself errors once the underlying problem is fixed.</p>`
},
{
  q: "Explain the JavaScript event loop",
  level: "advanced", hot: true, tags: ["javascript", "async"],
  a: `<p>JavaScript is single-threaded. The event loop is what lets it handle concurrency without blocking.</p>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="JavaScript event loop">
  <rect class="dg-fill" x="20" y="30" width="140" height="100" rx="8"/>
  <text class="dg-t" x="90" y="52" text-anchor="middle">Call stack</text>
  <rect class="dg-fill2" x="34" y="62" width="112" height="20" rx="4"/><text class="dg-s" x="90" y="76" text-anchor="middle">foo()</text>
  <rect class="dg-fill2" x="34" y="86" width="112" height="20" rx="4"/><text class="dg-s" x="90" y="100" text-anchor="middle">main()</text>
  <path class="dg-line" d="M164 80 H210" marker-end="url(#el)"/>
  <rect class="dg-box" x="214" y="14" width="150" height="44" rx="8"/>
  <text class="dg-s" x="289" y="34" text-anchor="middle">Microtask queue</text><text class="dg-s" x="289" y="50" text-anchor="middle">promises — drained FIRST</text>
  <rect class="dg-box" x="214" y="66" width="150" height="44" rx="8"/>
  <text class="dg-s" x="289" y="86" text-anchor="middle">Macrotask queue</text><text class="dg-s" x="289" y="102" text-anchor="middle">setTimeout, I/O, events</text>
  <path class="dg-line" d="M368 60 H420" marker-end="url(#el)"/>
  <circle cx="480" cy="72" r="42" class="dg-fill" fill="none"/>
  <text class="dg-t" x="480" y="70" text-anchor="middle">Event</text><text class="dg-t" x="480" y="86" text-anchor="middle">loop</text>
  <path class="dg-line" d="M480 114 V140 H90 V130" marker-end="url(#el)"/>
  <text class="dg-s" x="290" y="156" text-anchor="middle">pushes the next callback onto the stack when it is empty</text>
  <defs><marker id="el" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>console.log('1');
setTimeout(() =&gt; console.log('2'), 0);          // macrotask
Promise.resolve().then(() =&gt; console.log('3')); // microtask
queueMicrotask(() =&gt; console.log('4'));
console.log('5');

// Output: 1, 5, 3, 4, 2</code></pre>
<p><strong>The rule that explains the output:</strong> after the current synchronous code finishes, the event loop drains the <strong>entire microtask queue</strong> before taking a single macrotask. Promises are microtasks; <code>setTimeout</code> is a macrotask — so <code>setTimeout(fn, 0)</code> always runs after every pending promise callback.</p>
<p><strong>The practical consequence:</strong> a long synchronous loop blocks everything — rendering, clicks, timers — because nothing else can run until the stack empties. And an infinitely self-scheduling microtask chain starves macrotasks completely, freezing the page. That is why heavy work belongs in a Web Worker or must be chunked with <code>setTimeout</code>/<code>scheduler.yield()</code>.</p>`
},
{
  q: "Explain closures with a practical example",
  level: "beginner", hot: true, tags: ["javascript"],
  a: `<p>A closure is a function together with the lexical scope it was created in — it keeps access to those variables even after the outer function has returned.</p>
<pre><code>function createCounter() {
  let count = 0;                       // private — not reachable from outside
  return {
    increment: () =&gt; ++count,
    get value() { return count; }
  };
}
const c = createCounter();
c.increment(); c.increment();
c.value;        // 2
c.count;        // undefined — genuinely encapsulated</code></pre>
<pre><code>// Practical: debounce — the timer id is captured in the closure
function debounce(fn, delay = 300) {
  let timer;                                   // persists across calls
  return (...args) =&gt; {
    clearTimeout(timer);
    timer = setTimeout(() =&gt; fn(...args), delay);
  };
}

// The classic loop bug — and why 'let' fixes it
for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);   // 3, 3, 3
for (let i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 0);   // 0, 1, 2</code></pre>
<p><strong>Why the <code>var</code> version prints 3,3,3:</strong> <code>var</code> is function-scoped, so all three callbacks close over the <em>same</em> variable, which is 3 by the time they run. <code>let</code> is block-scoped and creates a fresh binding per iteration.</p>
<p><strong>Where closures appear in real code:</strong> module privacy, React hooks (<code>useState</code>'s setter closes over the component instance), event handlers, memoisation caches, currying, and every callback that captures surrounding state. The related pitfall — a callback capturing a stale value — is the "stale closure" bug in React.</p>`
},
{
  q: "What is the difference between var, let and const?",
  level: "beginner", hot: true, tags: ["javascript"],
  a: `<table>
<tr><th></th><th><code>var</code></th><th><code>let</code></th><th><code>const</code></th></tr>
<tr><td>Scope</td><td>Function</td><td>Block</td><td>Block</td></tr>
<tr><td>Hoisted</td><td>Yes, initialised to <code>undefined</code></td><td>Yes, but in the temporal dead zone</td><td>Same</td></tr>
<tr><td>Redeclare in same scope</td><td>Allowed</td><td>Error</td><td>Error</td></tr>
<tr><td>Reassign</td><td>Yes</td><td>Yes</td><td><strong>No</strong></td></tr>
<tr><td>Attaches to <code>window</code></td><td>Yes (at top level)</td><td>No</td><td>No</td></tr>
</table>
<pre><code>console.log(a);   // undefined — hoisted
var a = 1;

console.log(b);   // ✘ ReferenceError: Cannot access 'b' before initialization (TDZ)
let b = 1;

const o = { x: 1 };
o.x = 2;          // ✔ allowed — const freezes the BINDING, not the object
o = {};           // ✘ TypeError</code></pre>
<p><strong>Rule:</strong> <code>const</code> by default, <code>let</code> when you must reassign, <code>var</code> never in new code. Defaulting to <code>const</code> makes reassignment visible in review, which catches a surprising number of bugs.</p>
<p>The <strong>temporal dead zone</strong> is worth naming: <code>let</code> and <code>const</code> <em>are</em> hoisted, but accessing them before the declaration throws instead of silently giving <code>undefined</code> — which turns a subtle bug into a clear error.</p>`
},
{
  q: "How does 'this' work in JavaScript?",
  level: "advanced", hot: true, tags: ["javascript", "gotcha"],
  a: `<p><code>this</code> is determined by <strong>how a function is called</strong>, not where it is defined — except for arrow functions.</p>
<pre><code>// 1. Method call — 'this' is the object before the dot
obj.method();                  // this === obj

// 2. Plain function call — undefined in strict mode, globalThis otherwise
const fn = obj.method;
fn();                          // this === undefined  &lt;-- the classic bug

// 3. Explicit binding
fn.call(obj, a, b);
fn.apply(obj, [a, b]);
const bound = fn.bind(obj);    // permanently bound

// 4. Constructor — 'this' is the new object
new Person();

// 5. Arrow function — inherits 'this' LEXICALLY, from where it was written
class Timer {
  count = 0;
  start() {
    setInterval(() =&gt; { this.count++; }, 1000);   // ✔ 'this' is the Timer
    setInterval(function () { this.count++; }, 1000); // ✘ 'this' is undefined
  }
}</code></pre>
<p><strong>The losing-<code>this</code> problem</strong> is the practical form of this question — passing a method as a callback detaches it from its object:</p>
<pre><code>button.addEventListener('click', this.handleClick);          // ✘ 'this' lost
button.addEventListener('click', this.handleClick.bind(this)); // ✔
button.addEventListener('click', (e) =&gt; this.handleClick(e));  // ✔ arrow
handleClick = (e) =&gt; { ... };                                  // ✔ class field arrow</code></pre>
<p><strong>Arrow functions cannot be used</strong> as constructors, do not have their own <code>arguments</code>, and cannot be object methods that need <code>this</code> to be the object. That last one catches people: <code>{ name: 'x', greet: () =&gt; this.name }</code> does not work.</p>`
},
{
  q: "What are promises, async/await, and how do you handle errors?",
  level: "beginner", hot: true, tags: ["javascript", "async"],
  a: `<pre><code>// async/await — syntactic sugar over promises, far more readable
async function loadOrder(id) {
  try {
    const res = await fetch(\`/api/orders/\${id}\`);
    if (!res.ok) throw new ApiError(res.status);        // fetch does NOT reject on 4xx/5xx
    return await res.json();
  } catch (err) {
    logger.error('failed to load order', { id, err });
    throw err;                                          // rethrow — do not swallow
  } finally {
    setLoading(false);
  }
}</code></pre>
<pre><code>// Combinators — know all four
await Promise.all([a, b, c]);        // all succeed, or reject on the FIRST failure
await Promise.allSettled([a, b, c]); // never rejects; array of {status, value|reason}
await Promise.race([req, timeout]);  // first to SETTLE (resolve or reject)
await Promise.any([a, b, c]);        // first to SUCCEED; rejects only if all fail

// The most common performance mistake: sequential awaits in a loop
for (const id of ids) results.push(await fetchOne(id));      // ✘ N round trips, serial
const results = await Promise.all(ids.map(fetchOne));        // ✔ concurrent</code></pre>
<p><strong>Points worth making:</strong></p>
<ul>
<li><code>fetch</code> only rejects on network failure — a 500 response resolves, so you must check <code>res.ok</code> yourself.</li>
<li><code>Promise.all</code> rejects on the first failure but the other promises keep running; use <code>allSettled</code> when you want every result regardless.</li>
<li>An unhandled promise rejection crashes a Node process by default in modern versions — always attach a handler.</li>
<li><code>await</code> in a loop is serial. If the operations are independent, map to promises and <code>Promise.all</code>. If order matters or you must limit concurrency, use a small pool.</li>
</ul>`
},
{
  q: "What are the key ES6+ features you use daily?",
  level: "beginner", tags: ["javascript"],
  a: `<pre><code>// Destructuring with defaults and renaming
const { total, status = 'PENDING', customer: { name } = {} } = order;
const [first, ...rest] = items;

// Spread and rest
const updated = { ...order, status: 'PAID' };            // shallow copy + override
const merged = [...a, ...b];
function sum(...nums) { return nums.reduce((a, b) =&gt; a + b, 0); }

// Optional chaining and nullish coalescing
const city = order?.customer?.address?.city ?? 'unknown';
obj.method?.();                                          // call only if it exists
count ??= 0;                                             // assign only if null/undefined

// Template literals
const url = \`/api/orders/\${id}?status=\${status}\`;

// Modules
import { formatMoney } from './money';
export default OrderService;

// Useful built-ins
Object.entries(obj).map(([k, v]) =&gt; ...);
Object.fromEntries(pairs);
Object.groupBy(orders, o =&gt; o.status);      // ES2024
array.at(-1);                                // last element
array.flatMap(o =&gt; o.items);
structuredClone(obj);                        // real deep clone, handles Dates/Maps</code></pre>
<p><strong>The distinction worth raising:</strong> <code>??</code> is not <code>||</code>. <code>||</code> falls through on any falsy value, so <code>count || 10</code> gives 10 when count is <code>0</code> — a real bug. <code>??</code> only falls through on <code>null</code> and <code>undefined</code>, which is almost always what you meant.</p>
<p>Also note that spread is a <em>shallow</em> copy — nested objects are still shared. <code>structuredClone</code> is the modern deep-copy answer, and it handles Dates, Maps, Sets and cycles that <code>JSON.parse(JSON.stringify(x))</code> destroys.</p>`
},
{
  q: "What is the difference between == and ===, and how does type coercion work?",
  level: "beginner", tags: ["javascript", "gotcha"],
  a: `<ul>
<li><code>===</code> — strict equality. No coercion; different types are never equal.</li>
<li><code>==</code> — loose equality. Coerces operands, following rules almost nobody remembers correctly.</li>
</ul>
<pre><code>0 == '0'            // true
0 == []             // true
'0' == []           // false      &lt;-- non-transitive, which is why == is banned
null == undefined   // true
null == 0           // false
NaN == NaN          // false — NaN is not equal to anything, including itself
[] == ![]           // true

Object.is(NaN, NaN)      // true — the correct way to test for NaN
Number.isNaN(value)      // safe check (unlike the global isNaN, which coerces)</code></pre>
<p><strong>Rule: always use <code>===</code>.</strong> The single documented exception is <code>x == null</code>, which conveniently tests for both <code>null</code> and <code>undefined</code> — and many teams still forbid even that for consistency. Enable the <code>eqeqeq</code> lint rule.</p>
<p><strong>Falsy values</strong> — worth memorising, because they cause real bugs: <code>false</code>, <code>0</code>, <code>-0</code>, <code>0n</code>, <code>''</code>, <code>null</code>, <code>undefined</code>, <code>NaN</code>. Everything else is truthy, <em>including</em> <code>[]</code>, <code>{}</code> and <code>'0'</code> — which is why <code>if (array)</code> never tells you whether an array has elements.</p>`
},
{
  q: "What are decorators and how are they used in Angular/NestJS?",
  level: "advanced", tags: ["typescript", "angular"],
  a: `<p>A decorator is a function that attaches metadata to or modifies a class, method, property or parameter. TypeScript's experimental decorators (used by Angular and NestJS) require <code>experimentalDecorators</code> and <code>emitDecoratorMetadata</code>.</p>
<pre><code>// Angular — decorators supply the metadata the framework compiles against
@Component({ selector: 'app-order', template: '...' })
export class OrderComponent {
  @Input() order!: Order;
  @Output() cancelled = new EventEmitter&lt;string&gt;();
  @ViewChild('form') formRef!: ElementRef;
  constructor(@Inject(API_URL) private apiUrl: string) {}
}

// NestJS — very close to Spring's model, which makes it approachable for a Java developer
@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string): Promise&lt;OrderDto&gt; {
    return this.service.findOne(id);
  }
}

// Writing your own method decorator
function LogTime(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = original.apply(this, args);
    console.log(\`\${key} took \${performance.now() - start}ms\`);
    return result;
  };
  return descriptor;
}</code></pre>
<p><strong>Worth noting:</strong> TC39 decorators reached Stage 3 and TypeScript 5 supports the standard version, but the syntax and semantics differ from the legacy experimental ones — Angular and NestJS still use the legacy form. If you come from Java, the mental model is close to annotations plus a small amount of AOP, which is a useful way to explain it.</p>`
}
]);
