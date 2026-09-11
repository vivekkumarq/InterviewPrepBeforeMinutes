appendTopic("typescript", [
{
  q: "How do you validate external data at the TypeScript boundary?",
  level: "advanced", hot: true, tags: ["types", "validation", "runtime", "best-practice"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Optum", "EPAM", "Walmart"],
  a: `<p><strong>The fundamental gap:</strong> TypeScript types are erased at compile time. They describe what you <em>believe</em>; they enforce nothing at runtime. Every value entering your program from outside is unverified.</p>
<pre><code>// ✗ A lie the compiler happily accepts
const user = await res.json() as User;
user.profile.name.toUpperCase();       // TypeError if the API changed anything

// 'as' is an ASSERTION, not a check. It silences the compiler and validates
// nothing. Same for any non-null assertion (!).</code></pre>
<pre><code>// ✔ Parse, don't validate — derive the type FROM the schema
import { z } from 'zod';

const User = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  createdAt: z.coerce.date(),
  profile: z.object({ name: z.string().min(1) }).optional(),
});
type User = z.infer&lt;typeof User&gt;;       // ONE definition, no drift

const user = User.parse(await res.json());        // throws with a precise path
const result = User.safeParse(data);              // or a discriminated result
if (!result.success) return handle(result.error.issues);
// From here the type is EARNED, not asserted.</code></pre>
<table>
<tr><th>Boundary to validate</th><th>Why</th></tr>
<tr><td>HTTP responses</td><td>The API can change without telling you</td></tr>
<tr><td>Request bodies and query params</td><td>User input is adversarial</td></tr>
<tr><td><code>localStorage</code> / cookies</td><td>Written by an older version of your own app, or by the user</td></tr>
<tr><td>Environment variables</td><td>Always strings; often missing. Validate at startup and fail loudly.</td></tr>
<tr><td>Message queue payloads</td><td>A different service's schema, deployed independently</td></tr>
<tr><td>URL params</td><td>Hand-editable</td></tr>
</table>
<pre><code>// Fail at STARTUP, not at the first request
const Env = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});
export const env = Env.parse(process.env);   // crashes on boot if misconfigured</code></pre>
<table>
<tr><th>Also worth knowing</th><th>Detail</th></tr>
<tr><td><code>unknown</code> over <code>any</code></td><td><code>unknown</code> forces you to narrow before use; <code>any</code> disables checking entirely and spreads</td></tr>
<tr><td><code>satisfies</code></td><td>Checks a value against a type <em>without widening</em> it — keeps literal inference</td></tr>
<tr><td>Branded types</td><td><code>type UserId = string &amp; { __brand: 'UserId' }</code> stops passing an OrderId where a UserId belongs</td></tr>
<tr><td><code>strict: true</code></td><td>Non-negotiable. <code>noUncheckedIndexedAccess</code> too — <code>arr[0]</code> really can be undefined.</td></tr>
</table>
<p><strong>The principle to name:</strong> "Parse, don't validate. Rather than checking a value and carrying on with the same loose type, I convert it into a type that <em>cannot</em> be invalid. After the parse boundary, the rest of the code needs no defensive checks — and the compiler enforces that."</p>`
},
{
  q: "Explain async/await, promise combinators and error handling in JavaScript",
  level: "beginner", hot: true, tags: ["async", "promises", "javascript", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Zoho", "Cognizant", "Optum", "Uber"],
  a: `<table>
<tr><th>Combinator</th><th>Resolves when</th><th>Rejects when</th></tr>
<tr><td><code>Promise.all</code></td><td>All succeed — returns an array</td><td><strong>Any</strong> one fails, immediately</td></tr>
<tr><td><strong><code>Promise.allSettled</code></strong></td><td>All settle — never rejects</td><td>Never. Inspect each <code>status</code>.</td></tr>
<tr><td><code>Promise.race</code></td><td>The first to <em>settle</em></td><td>If the first to settle rejects</td></tr>
<tr><td><code>Promise.any</code></td><td>The first to <em>succeed</em></td><td>Only if all fail (<code>AggregateError</code>)</td></tr>
</table>
<pre><code>// Sequential vs parallel — the most common async performance bug
const a = await getUser(id);        // 100ms
const b = await getOrders(id);      // 100ms   -> 200ms total, needlessly

const [a, b] = await Promise.all([getUser(id), getOrders(id)]);   // 100ms

// allSettled when partial success is acceptable
const results = await Promise.allSettled(ids.map(fetchOne));
const ok = results.filter(r =&gt; r.status === 'fulfilled').map(r =&gt; r.value);</code></pre>
<pre><code>// ✗ forEach does not await — the loop finishes before any work does
items.forEach(async (i) =&gt; { await save(i); });
console.log('done');                 // prints FIRST, nothing is saved yet

// ✔ sequential (when order or rate limits matter)
for (const i of items) await save(i);

// ✔ parallel
await Promise.all(items.map(save));

// ✔ bounded parallelism — the version you actually want for a big list
for (const chunk of chunks(items, 10)) await Promise.all(chunk.map(save));</code></pre>
<table>
<tr><th>Trap</th><th>Detail</th></tr>
<tr><td>Unhandled rejection</td><td>A promise created but never awaited or caught. Node can exit non-zero; browsers log it.</td></tr>
<tr><td><code>await</code> in a <code>try</code>, error thrown in <code>finally</code></td><td>Replaces the original error, exactly like Java</td></tr>
<tr><td>Rejecting with a non-Error</td><td><code>throw 'oops'</code> loses the stack trace — always throw an <code>Error</code></td></tr>
<tr><td>Returning inside <code>.then</code> vs awaiting</td><td>Forgetting to return breaks the chain silently</td></tr>
<tr><td>Errors escaping an async callback</td><td>An <code>async</code> function passed where a sync one is expected rejects into nothing</td></tr>
</table>
<pre><code>// Timeouts and cancellation — AbortController is the standard mechanism
const ctrl = new AbortController();
const t = setTimeout(() =&gt; ctrl.abort(), 5000);
try {
  const res = await fetch(url, { signal: ctrl.signal });
} catch (e) {
  if (e.name === 'AbortError') { /* timed out */ }
} finally { clearTimeout(t); }

// Shorthand, where supported:
await fetch(url, { signal: AbortSignal.timeout(5000) });</code></pre>
<p><strong>The mental model to state:</strong> "<code>await</code> does not block — it returns control to the caller and schedules the rest of the function as a microtask. That is why two sequential awaits of independent work waste time for no reason, and why <code>Promise.all</code> is usually the fix. And every <code>await</code> is a point where the world can change underneath you, which is where stale-closure bugs come from."</p>`
}
]);
