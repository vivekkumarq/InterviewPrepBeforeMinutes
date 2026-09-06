appendTopic("typescript", [
{
  q: "What are the browser storage options and when do you use each?",
  level: "beginner", tags: ["javascript", "browser"],
  a: `<table>
<tr><th></th><th>Capacity</th><th>Lifetime</th><th>Sent to server</th><th>Accessible to JS</th></tr>
<tr><td><code>localStorage</code></td><td>~5–10 MB</td><td>Until cleared</td><td>No</td><td>Yes</td></tr>
<tr><td><code>sessionStorage</code></td><td>~5–10 MB</td><td>Per tab, until closed</td><td>No</td><td>Yes</td></tr>
<tr><td>Cookies</td><td>~4 KB</td><td>Configurable expiry</td><td><strong>Yes, automatically</strong></td><td>Unless <code>HttpOnly</code></td></tr>
<tr><td>IndexedDB</td><td>Hundreds of MB+</td><td>Until cleared</td><td>No</td><td>Yes (async)</td></tr>
<tr><td>Cache API</td><td>Large</td><td>Until cleared</td><td>No</td><td>Yes — for service workers</td></tr>
</table>
<pre><code>// localStorage is SYNCHRONOUS and blocks the main thread — keep it small
// It also throws in some contexts, so always guard it
function safeGet&lt;T&gt;(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;               // private mode, quota exceeded, corrupt JSON
  }
}</code></pre>
<p><strong>The security decision that matters — where to keep a JWT:</strong></p>
<ul>
<li><strong><code>localStorage</code></strong> — readable by any JavaScript on the page, so a single XSS (including one in a third-party dependency) exfiltrates the token. Convenient, and the reason most tutorials use it.</li>
<li><strong><code>HttpOnly</code> cookie</strong> — unreadable by JavaScript, so XSS cannot steal it. But it is sent automatically with every request, which reintroduces CSRF — mitigated with <code>SameSite=Strict</code> and a CSRF token.</li>
</ul>
<p>There is no free option; the mature answer is naming the trade-off rather than asserting one is correct. The common production choice is a short-lived access token in memory plus a refresh token in an <code>HttpOnly; Secure; SameSite=Strict</code> cookie scoped to the refresh endpoint.</p>
<p><strong>Other practical notes:</strong> <code>localStorage</code> is shared across tabs and fires a <code>storage</code> event in <em>other</em> tabs, which is a neat way to sync logout across tabs. Use IndexedDB (via <code>idb</code> or Dexie) for anything large or structured — it is asynchronous and does not block rendering.</p>`
},
{
  q: "What is the difference between debouncing and throttling, and how do you implement both?",
  level: "beginner", hot: true, tags: ["javascript", "performance"],
  a: `<ul>
<li><strong>Debounce</strong> — wait until the events <em>stop</em>, then fire once. "Do it when they finish."</li>
<li><strong>Throttle</strong> — fire at most once per interval, regardless of how many events occur. "Do it at most every N ms."</li>
</ul>
<pre><code>function debounce&lt;T extends (...args: any[]) =&gt; void&gt;(fn: T, delay = 300) {
  let timer: ReturnType&lt;typeof setTimeout&gt;;
  return (...args: Parameters&lt;T&gt;) =&gt; {
    clearTimeout(timer);                       // cancel the previous pending call
    timer = setTimeout(() =&gt; fn(...args), delay);
  };
}

function throttle&lt;T extends (...args: any[]) =&gt; void&gt;(fn: T, interval = 200) {
  let last = 0;
  let pending: ReturnType&lt;typeof setTimeout&gt; | null = null;
  return (...args: Parameters&lt;T&gt;) =&gt; {
    const now = Date.now();
    const remaining = interval - (now - last);
    if (remaining &lt;= 0) {
      last = now;
      fn(...args);                             // leading edge
    } else if (!pending) {
      pending = setTimeout(() =&gt; {             // trailing edge — do not drop the last event
        last = Date.now();
        pending = null;
        fn(...args);
      }, remaining);
    }
  };
}</code></pre>
<table>
<tr><th>Use case</th><th>Choose</th><th>Why</th></tr>
<tr><td>Search-as-you-type</td><td>Debounce</td><td>Only the final query matters</td></tr>
<tr><td>Autosave a draft</td><td>Debounce</td><td>Save when they pause typing</td></tr>
<tr><td>Validate a field on input</td><td>Debounce</td><td>Do not shout while they type</td></tr>
<tr><td>Scroll position / infinite scroll</td><td>Throttle</td><td>Need regular updates, not just the end</td></tr>
<tr><td>Window resize re-layout</td><td>Throttle</td><td>Should update during the drag</td></tr>
<tr><td>Rate-limiting API calls</td><td>Throttle</td><td>A hard ceiling on frequency</td></tr>
</table>
<p><strong>Framework equivalents worth naming:</strong> RxJS gives you <code>debounceTime</code> and <code>throttleTime</code> directly — and <code>switchMap</code> alongside <code>debounceTime</code> is the complete type-ahead solution, because it also <em>cancels</em> the previous in-flight request rather than merely delaying the next one. In React, <code>useDeferredValue</code> achieves a similar user-visible effect without any timer.</p>
<p><strong>The detail that separates a good implementation:</strong> handling the <em>trailing edge</em> in throttle. A naive version drops the final event, so a user who stops scrolling mid-way never gets the last update.</p>`
},
{
  q: "How does async iteration, generators and backpressure work in JavaScript?",
  level: "advanced", tags: ["javascript", "async"],
  a: `<pre><code>// Generator — a function that can pause and resume, producing values lazily
function* idGenerator() {
  let id = 1;
  while (true) yield id++;            // infinite, but only computes what you consume
}
const ids = idGenerator();
ids.next().value;                     // 1
ids.next().value;                     // 2

// Async generator — yields promises; consume with for-await-of
async function* fetchAllPages(url: string) {
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    const page = await res.json();
    yield* page.items;                // yield each item individually
    next = page.nextUrl;
  }
}

// The consumer looks like an ordinary loop, but pages load ON DEMAND
for await (const order of fetchAllPages('/api/orders')) {
  await process(order);               // backpressure: the next page waits for this
  if (someCondition) break;           // stops fetching immediately
}</code></pre>
<p><strong>Why this matters:</strong> the naive alternative fetches every page into an array first — unbounded memory, a long wait before anything happens, and no way to stop early. An async generator gives you streaming with natural <strong>backpressure</strong>: the producer cannot run ahead of the consumer, because it only advances when <code>next()</code> is called.</p>
<pre><code>// Streams API — the same idea at the platform level
const response = await fetch('/api/large-export');
const reader = response.body!
  .pipeThrough(new TextDecoderStream())
  .getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  processChunk(value);                // process as it arrives, constant memory
}</code></pre>
<p><strong>Where you meet this in practice:</strong> paginated API traversal, reading a large file in Node without loading it into memory, consuming a server-sent event stream, and processing an LLM's token stream. It is also how <code>ReadableStream</code> and Node's stream module implement backpressure under the hood.</p>
<p><strong>A useful detail:</strong> generators are also how <code>redux-saga</code> works — yielding effect descriptions that a runtime executes, which makes the async flow synchronously testable. And <code>Symbol.asyncIterator</code> is what makes any object usable with <code>for await...of</code>, so you can make your own paginated client iterable.</p>`
},
{
  q: "What are the TypeScript compiler options that matter and how do you configure a project?",
  level: "advanced", tags: ["config", "build"],
  a: `<pre><code>{
  "compilerOptions": {
    // Correctness — the ones that actually catch bugs
    "strict": true,                            // enables the whole strict family
    "noUncheckedIndexedAccess": true,          // arr[0] is T | undefined — very valuable
    "exactOptionalPropertyTypes": true,        // { a?: string } cannot be set to undefined
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,

    // Module resolution
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",             // for Vite/esbuild; "node16" for Node
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,              // makes 'import type' explicit

    // Output
    "declaration": true,                       // .d.ts for a library
    "sourceMap": true,
    "isolatedModules": true,                   // required by esbuild/swc single-file transpile

    // Speed
    "incremental": true,
    "skipLibCheck": true,                      // skip type-checking node_modules — big win

    // Paths
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}</code></pre>
<p><strong>The two underrated flags:</strong></p>
<ul>
<li><strong><code>noUncheckedIndexedAccess</code></strong> — without it, <code>arr[10]</code> is typed <code>T</code> even when the array has three elements, so TypeScript happily lets you dereference <code>undefined</code>. Turning it on catches a genuinely common runtime error, at the cost of some extra narrowing.</li>
<li><strong><code>skipLibCheck</code></strong> — type-checking every <code>.d.ts</code> in <code>node_modules</code> is slow and surfaces errors in code you cannot fix. Almost every real project enables it.</li>
</ul>
<p><strong>Points worth making about the build:</strong> <code>tsc</code> is a type checker <em>and</em> a compiler, but modern toolchains split those roles — esbuild or swc transpiles (fast, no type checking) while <code>tsc --noEmit</code> checks types in parallel or in CI. That is why <code>isolatedModules</code> matters: single-file transpilers cannot see across files, so certain constructs must be explicit.</p>
<p><strong>For a monorepo</strong>, mention project references (<code>composite: true</code>) so packages build incrementally and depend on each other's declaration output rather than re-checking source.</p>`
}
]);
