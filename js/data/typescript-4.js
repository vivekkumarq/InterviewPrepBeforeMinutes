appendTopic("typescript", [
{
  q: "How does type narrowing work, and how do you model state with discriminated unions?",
  level: "advanced", hot: true, tags: ["types", "narrowing"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Optum", "EPAM", "Zoho"],
  a: `<p><strong>Narrowing</strong> is the compiler tracking, through control flow, which member of a union a value can still be. Every one of these narrows:</p>
<pre><code>function handle(v: string | number | Date | null | User[]) {
  if (v === null)              return;              // equality
  if (typeof v === 'string')   v.toUpperCase();     // typeof — primitives only
  if (typeof v === 'number')   v.toFixed(2);
  if (v instanceof Date)       v.getTime();         // instanceof — classes
  if (Array.isArray(v))        v.length;            // built-in guard
}

// 'in' narrows by property presence
function area(s: { r: number } | { side: number }) {
  return 'r' in s ? Math.PI * s.r ** 2 : s.side ** 2;
}

// A user-defined guard, for anything the compiler cannot see
function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null && 'id' in v;
}

// An assertion function narrows for the REST of the scope
function assertDefined&lt;T&gt;(v: T): asserts v is NonNullable&lt;T&gt; {
  if (v == null) throw new Error('required');
}
assertDefined(user);
user.name;                    // narrowed from here on</code></pre>
<p><strong>Discriminated unions</strong> are the pattern narrowing was built for — a shared literal field the compiler can switch on:</p>
<pre><code>type RequestState&lt;T&gt; =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }              // data ONLY exists here
  | { status: 'error';   error: Error };        // error ONLY exists here

function render(s: RequestState&lt;Order[]&gt;) {
  switch (s.status) {
    case 'idle':    return null;
    case 'loading': return spinner();
    case 'success': return list(s.data);        // s.data is typed, no optional chaining
    case 'error':   return alert(s.error.message);
  }
}</code></pre>
<p><strong>Why this beats the usual shape</strong> — and this is the point worth making out loud:</p>
<pre><code>// The common alternative makes illegal states REPRESENTABLE
interface Bad&lt;T&gt; {
  loading: boolean;
  data?: T;
  error?: Error;
}
// { loading: true, data: [...], error: someError } compiles fine.
// Every consumer must defensively check all three, forever, and someone
// eventually renders a spinner over stale data next to an error message.</code></pre>
<table>
<tr><th>Narrowing tool</th><th>Works on</th></tr>
<tr><td><code>typeof</code></td><td>Primitives: string, number, boolean, bigint, symbol, undefined, function, object</td></tr>
<tr><td><code>instanceof</code></td><td>Classes — fails across iframes and realms</td></tr>
<tr><td><code>in</code></td><td>Object shapes distinguished by a property</td></tr>
<tr><td>Literal comparison</td><td>Discriminated unions — the most reliable</td></tr>
<tr><td><code>v is T</code> guard</td><td>Anything — but <strong>you</strong> are responsible for it being true</td></tr>
<tr><td><code>asserts v is T</code></td><td>Narrowing for the remainder of the scope</td></tr>
</table>
<pre><code>// The gotcha: narrowing is LOST after a callback or an await, because the
// compiler cannot prove nothing reassigned it in between.
if (this.user) {
  setTimeout(() =&gt; this.user.name, 0);   // ✗ 'this.user' is possibly null
}
const u = this.user;                     // ✔ capture in a const — const cannot change
if (u) setTimeout(() =&gt; u.name, 0);</code></pre>
<p><strong>Close with the design principle:</strong> "Make illegal states unrepresentable. If a combination of fields is impossible in the domain, the type should make it impossible in code — then the compiler catches the bug instead of a code reviewer, and every consumer gets exhaustiveness checking for free."</p>`
},
{
  q: "Explain generics with constraints, conditional types and mapped types",
  level: "advanced", hot: true, tags: ["generics", "advanced"],
  companies: ["Amazon", "Microsoft", "Adobe", "Google", "Optum", "EPAM"],
  a: `<pre><code>// Constraint: T must have the shape we use
function pluck&lt;T, K extends keyof T&gt;(items: T[], key: K): T[K][] {
  return items.map(i =&gt; i[key]);
}
pluck(users, 'email');   // string[]  — inferred, not asserted
pluck(users, 'emial');   // ✗ compile error, typo caught

// Conditional type: types that branch
type Unwrap&lt;T&gt; = T extends Promise&lt;infer U&gt; ? U : T;
type A = Unwrap&lt;Promise&lt;string&gt;&gt;;   // string
type B = Unwrap&lt;number&gt;;             // number

// infer is the powerful part — it extracts a type from a position
type ElementOf&lt;T&gt;   = T extends (infer E)[] ? E : never;
type ReturnOf&lt;F&gt;    = F extends (...a: any[]) =&gt; infer R ? R : never;
type FirstArg&lt;F&gt;    = F extends (a: infer A, ...rest: any[]) =&gt; any ? A : never;</code></pre>
<pre><code>// Mapped types: transform every property
type Optional&lt;T&gt;  = { [K in keyof T]?: T[K] };
type Immutable&lt;T&gt; = { readonly [K in keyof T]: T[K] };
type Nullable&lt;T&gt;  = { [K in keyof T]: T[K] | null };

// Deep versions, with recursion
type DeepPartial&lt;T&gt; = T extends object
  ? { [K in keyof T]?: DeepPartial&lt;T[K]&gt; }
  : T;

// Key remapping + template literal types: generate getters from a shape
type Getters&lt;T&gt; = {
  [K in keyof T as \`get\${Capitalize&lt;string & K&gt;}\`]: () =&gt; T[K]
};
type UserGetters = Getters&lt;{ name: string; age: number }&gt;;
// { getName: () =&gt; string; getAge: () =&gt; number }

// Filtering keys by their value type
type StringKeys&lt;T&gt; = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];</code></pre>
<table>
<tr><th>Built-in</th><th>Definition</th></tr>
<tr><td><code>Partial&lt;T&gt;</code></td><td>All properties optional</td></tr>
<tr><td><code>Required&lt;T&gt;</code></td><td>All properties required</td></tr>
<tr><td><code>Pick&lt;T,K&gt;</code> / <code>Omit&lt;T,K&gt;</code></td><td>Select or exclude keys</td></tr>
<tr><td><code>Record&lt;K,V&gt;</code></td><td>An object with keys K and values V</td></tr>
<tr><td><code>Exclude&lt;T,U&gt;</code> / <code>Extract&lt;T,U&gt;</code></td><td>Filter a union</td></tr>
<tr><td><code>ReturnType&lt;F&gt;</code>, <code>Parameters&lt;F&gt;</code>, <code>Awaited&lt;T&gt;</code></td><td>Extract from function and promise types</td></tr>
<tr><td><code>NoInfer&lt;T&gt;</code> (5.4+)</td><td>Blocks inference at one position — fixes over-eager generic widening</td></tr>
</table>
<p><strong>The one real-world application to give:</strong></p>
<pre><code>// A typed event emitter — the payload type follows from the event name
type Events = {
  'order:created': { orderId: string; total: number };
  'user:login':    { userId: string };
};

class Bus&lt;E&gt; {
  on&lt;K extends keyof E&gt;(k: K, fn: (payload: E[K]) =&gt; void) { }
  emit&lt;K extends keyof E&gt;(k: K, payload: E[K]) { }
}
const bus = new Bus&lt;Events&gt;();
bus.on('order:created', p =&gt; p.total);      // p is fully typed
bus.emit('user:login', { total: 5 });       // ✗ wrong payload, caught at compile time</code></pre>
<p><strong>Say this to close:</strong> "Type-level programming is powerful but has a cost — compile time and readability. I use it for library surfaces and shared utilities where it prevents whole classes of bugs. In application code I keep types simple; a clever conditional type nobody on the team can read is a liability."</p>`
},
{
  q: "What is the difference between an interface and a type alias, and when do you use each?",
  level: "beginner", hot: true, tags: ["types", "basics"],
  companies: ["TCS", "Infosys", "Cognizant", "Accenture", "Wipro", "Amazon", "Adobe"],
  a: `<table>
<tr><th></th><th><code>interface</code></th><th><code>type</code></th></tr>
<tr><td>Object shapes</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Unions</td><td><strong>No</strong></td><td>Yes — <code>type A = B | C</code></td></tr>
<tr><td>Primitives, tuples</td><td>No</td><td>Yes</td></tr>
<tr><td>Mapped / conditional types</td><td>No</td><td>Yes</td></tr>
<tr><td>Declaration merging</td><td><strong>Yes</strong></td><td>No — duplicate name is an error</td></tr>
<tr><td>Extending</td><td><code>extends</code></td><td>Intersection <code>&amp;</code></td></tr>
<tr><td>Error messages</td><td>Usually cleaner (keeps the name)</td><td>Can expand into a wall of text</td></tr>
</table>
<pre><code>// Declaration merging — the reason interfaces still matter.
// It lets you augment types you do not own:
declare global {
  interface Window { dataLayer: unknown[]; }
}
// Or extend a library's types:
declare module 'express' {
  interface Request { user?: AuthenticatedUser; }
}
// A type alias cannot do this.

// Unions, which an interface cannot express
type Result&lt;T&gt; = { ok: true; value: T } | { ok: false; error: string };
type ID = string | number;
type Point = [x: number, y: number];</code></pre>
<p><strong>The practical convention</strong> most teams settle on: <em>interface for object shapes that might be extended or augmented — especially public API surfaces; type for everything else</em> — unions, tuples, function types, and anything computed. Consistency inside the codebase matters more than the choice itself.</p>
<pre><code>// The intersection gotcha worth knowing
interface A { x: string }
interface B extends A { x: number }     // ✗ Error, caught immediately

type C = { x: string } &amp; { x: number };
type X = C['x'];                        // never — silently, no error at the declaration
// You only find out when a value fails to be assignable, far from the cause.</code></pre>
<p><strong>Bonus point that impresses:</strong> "Interfaces are lazily resolved, so they can be recursive without extra work and they cache better in the compiler. On very large codebases, preferring interfaces for object shapes measurably improves type-check time — that is TypeScript's own documented recommendation."</p>`
},
{
  q: "How do you type an API response safely — and why is a type assertion not enough?",
  level: "advanced", tags: ["validation", "practical"],
  companies: ["Amazon", "Adobe", "Flipkart", "Optum", "SAP", "Persistent", "EPAM"],
  a: `<pre><code>// ✗ The lie almost every codebase contains
const user = await res.json() as User;
// 'as' is a compile-time assertion with ZERO runtime effect. If the API
// renamed a field, TypeScript still believes you. The crash happens later,
// somewhere unrelated, with a confusing stack trace.

// ✔ Validate at the boundary, and DERIVE the type from the schema
import { z } from 'zod';

const UserSchema = z.object({
  id:        z.string().uuid(),
  email:     z.string().email(),
  age:       z.number().int().min(0).optional(),
  role:      z.enum(['ADMIN', 'USER']),
  createdAt: z.coerce.date()
});
type User = z.infer&lt;typeof UserSchema&gt;;   // one source of truth

async function getUser(id: string): Promise&lt;User&gt; {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new ApiError(res.status);
  return UserSchema.parse(await res.json());   // throws with a precise path
}

// safeParse when you want to handle it rather than throw
const result = UserSchema.safeParse(json);
if (!result.success) {
  logger.warn({ issues: result.error.issues }, 'contract drift');
  return fallback;
}</code></pre>
<p><strong>The principle:</strong> validate once, at the edge — HTTP responses, <code>localStorage</code>, environment variables, query parameters, webhook payloads. Everything inside that boundary is then genuinely typed, and the failure surfaces at the point of entry with a message naming the exact field, instead of as <code>undefined is not a function</code> three layers deep.</p>
<pre><code>// Environment variables, which are typed 'string | undefined' and often lie
const Env = z.object({
  DATABASE_URL: z.string().url(),
  PORT:         z.coerce.number().default(3000),
  NODE_ENV:     z.enum(['development','test','production'])
});
export const env = Env.parse(process.env);   // fails at STARTUP, not at 3am</code></pre>
<table>
<tr><th>Approach</th><th>Runtime safety</th><th>Notes</th></tr>
<tr><td><code>as User</code></td><td>None</td><td>A promise to the compiler you cannot keep</td></tr>
<tr><td>Type guard (<code>v is User</code>)</td><td>Yes, if written correctly</td><td>Manual, easy to get out of sync with the type</td></tr>
<tr><td>Zod / Valibot / io-ts</td><td>Yes</td><td>Schema is the single source; types are inferred</td></tr>
<tr><td>Generated from OpenAPI/GraphQL</td><td>Types only</td><td><strong>Best when available</strong> — the contract cannot drift; still validate untrusted input</td></tr>
</table>
<p><strong>The trade-off to acknowledge:</strong> validation costs a few microseconds per response and adds bundle size. For a huge payload on a hot path you might validate only the fields you use. But the default should be validating — the cost of a silent contract mismatch in production is far higher.</p>`
}
]);
