appendTopic("java-concurrency", [
{
  q: "What is the Java Memory Model, and what does happens-before actually guarantee?",
  level: "advanced", hot: true, tags: ["jmm", "concurrency", "internals", "must-know"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "SAP", "Morgan Stanley", "Barclays", "Flipkart"],
  a: `<p>The JMM defines when a write by one thread becomes <strong>visible</strong> to another. Without it, the compiler, the JIT and the CPU are all free to reorder and cache — and they do.</p>
<pre><code>// The classic broken example
boolean running = true;                 // NOT volatile

// Thread A
while (running) { work(); }             // may NEVER see the change

// Thread B
running = false;                        // hoisted into a register? cached?

// The JIT is entitled to hoist the read out of the loop entirely:
if (running) while (true) work();       // a legal transformation!</code></pre>
<table>
<tr><th>happens-before edge</th><th>Guarantees</th></tr>
<tr><td>Program order</td><td>Within <em>one</em> thread, statements appear to run in order</td></tr>
<tr><td><strong>Monitor</strong></td><td>Unlock <em>happens-before</em> a later lock on the same monitor</td></tr>
<tr><td><strong>volatile</strong></td><td>A write <em>happens-before</em> every later read of that field</td></tr>
<tr><td>Thread start</td><td><code>t.start()</code> <em>happens-before</em> anything in <code>t</code></td></tr>
<tr><td>Thread join</td><td>Everything in <code>t</code> <em>happens-before</em> <code>t.join()</code> returning</td></tr>
<tr><td><code>final</code> fields</td><td>Visible fully initialised once the constructor returns</td></tr>
<tr><td>Transitivity</td><td>If A → B and B → C then A → C</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Two threads with a volatile write establishing visibility">
  <text class="dg-s" x="110" y="20" text-anchor="middle">Thread A</text>
  <text class="dg-s" x="420" y="20" text-anchor="middle">Thread B</text>
  <path class="dg-line" d="M110 28 V138 M420 28 V138" stroke-dasharray="4 3"/>
  <rect class="dg-fill" x="34" y="36" width="152" height="24" rx="4"/><text class="dg-s" x="110" y="53" text-anchor="middle">data = 42</text>
  <rect class="dg-fill2" x="34" y="66" width="152" height="24" rx="4"/><text class="dg-s" x="110" y="83" text-anchor="middle">ready = true  (volatile)</text>
  <path class="dg-line" d="M190 78 L344 106" marker-end="url(#jm1)"/>
  <text class="dg-s" x="268" y="84" text-anchor="middle">happens-before</text>
  <rect class="dg-fill2" x="344" y="94" width="152" height="24" rx="4"/><text class="dg-s" x="420" y="111" text-anchor="middle">if (ready)  (volatile read)</text>
  <text class="dg-s" x="16" y="148">the volatile write publishes EVERYTHING written before it — including the non-volatile data</text>
  <defs><marker id="jm1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// volatile gives VISIBILITY and ORDERING — never ATOMICITY
volatile int count;
count++;                    // still a race: read, add, write are three steps

// For a counter: AtomicInteger (CAS) or LongAdder (sharded, high contention)

// Double-checked locking REQUIRES volatile, or another thread can see a
// non-null reference to a partially constructed object:
private static volatile Singleton instance;
if (instance == null) {
    synchronized (Singleton.class) {
        if (instance == null) instance = new Singleton();
    }
}
// Simpler and equivalent — the classloader guarantees it:
private static class Holder { static final Singleton I = new Singleton(); }</code></pre>
<p><strong>The framing that lands:</strong> "The JMM is a contract about <em>visibility</em>, not about timing. It does not say when another thread will see my write — it says that if there is a happens-before edge, it <em>must</em> see it, and if there is not, it may never. So concurrency bugs are not slow-machine bugs; correct code on one CPU can be wrong on another."</p>`
},
{
  q: "What is structured concurrency, and how does it improve on CompletableFuture?",
  level: "advanced", tags: ["java21", "concurrency", "modern-java"],
  companies: ["Amazon", "Optum", "SAP", "Goldman Sachs", "EPAM", "Oracle"],
  a: `<p>The problem with unstructured concurrency: tasks outlive the method that started them, errors surface far from their cause, and cancellation has to be wired by hand.</p>
<pre><code>// CompletableFuture — works, but the lifetime is implicit
var a = CompletableFuture.supplyAsync(this::user, pool);
var b = CompletableFuture.supplyAsync(this::orders, pool);
// If a fails, b keeps running to completion, burning a connection.
// If the caller gives up, nothing is cancelled. Nothing enforces cleanup.

// STRUCTURED CONCURRENCY (preview in 21+) — the scope OWNS the subtasks
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var user   = scope.fork(() -&gt; userService.get(id));
    var orders = scope.fork(() -&gt; orderService.get(id));

    scope.join();              // wait for both
    scope.throwIfFailed();     // propagate the first failure

    return new Profile(user.get(), orders.get());
}   // close() GUARANTEES every subtask has finished or been cancelled</code></pre>
<table>
<tr><th></th><th><code>CompletableFuture</code></th><th>Structured concurrency</th></tr>
<tr><td>Task lifetime</td><td>Implicit — can outlive the caller</td><td><strong>Bounded by the block</strong></td></tr>
<tr><td>One task fails</td><td>Others keep running</td><td><strong>Siblings are cancelled</strong></td></tr>
<tr><td>Caller is interrupted</td><td>Nothing propagates</td><td>Cancellation flows down</td></tr>
<tr><td>Reads like</td><td>A callback chain</td><td>Ordinary sequential code</td></tr>
<tr><td>Stack traces</td><td>Detached from the caller</td><td>Include the parent frame</td></tr>
</table>
<pre><code>// ShutdownOnSuccess — race several sources, take the first answer, cancel the rest
try (var scope = new StructuredTaskScope.ShutdownOnSuccess&lt;Quote&gt;()) {
    scope.fork(() -&gt; providerA.quote(sku));
    scope.fork(() -&gt; providerB.quote(sku));
    scope.fork(() -&gt; providerC.quote(sku));
    scope.join();
    return scope.result();           // the first success; the others are cancelled
}</code></pre>
<p><strong>Why it works now:</strong> it is built on virtual threads, so forking a task per subtask is cheap — the pattern would be unaffordable with platform threads. It is still a <strong>preview</strong> feature, so it needs <code>--enable-preview</code> and the class file will not load on another JDK release.</p>
<p><strong>What to say:</strong> "It restores the property that makes ordinary code readable: a block of code finishes when everything it started has finished. <code>CompletableFuture</code> chains beyond three or four stages become hard to reason about precisely because that property is gone — and structured concurrency is the direct answer to it."</p>`
}
]);
