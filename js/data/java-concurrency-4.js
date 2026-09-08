appendTopic("java-concurrency", [
{
  q: "How do you size a thread pool, and what goes wrong with Executors.newFixedThreadPool?",
  level: "advanced", hot: true, tags: ["executors", "production", "performance"],
  companies: ["Amazon", "Flipkart", "Goldman Sachs", "Optum", "SAP", "Walmart", "Oracle", "Barclays"],
  a: `<div class="cx"><b>CPU-bound: cores + 1</b><span>one extra to cover a page fault</span><b>IO-bound: cores × (1 + wait/service)</b><span>threads mostly blocked, so more of them</span></div>
<pre><code>// ✗ Never in production — the queue is UNBOUNDED
ExecutorService pool = Executors.newFixedThreadPool(10);
// Backed by new LinkedBlockingQueue&lt;&gt;() with no capacity. Under load the
// queue grows until the heap dies with OutOfMemoryError, and by then you
// have lost every queued task. There is no backpressure at all.

// ✗ Also dangerous
Executors.newCachedThreadPool();     // unbounded THREAD count — 10,000 threads
Executors.newSingleThreadExecutor(); // unbounded queue again

// ✔ Always construct it explicitly
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 16,                                   // core, max
    60L, TimeUnit.SECONDS,                   // idle keep-alive above core
    new ArrayBlockingQueue&lt;&gt;(500),           // BOUNDED — this is the backpressure
    new ThreadFactoryBuilder().setNameFormat("order-%d").build(),   // NAMED threads
    new ThreadPoolExecutor.CallerRunsPolicy() // saturation: slow the producer down
);</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Thread pool submission path through core threads queue and max threads">
  <rect class="dg-box" x="16" y="62" width="80" height="34" rx="6"/><text class="dg-s" x="56" y="84" text-anchor="middle">submit</text>
  <path class="dg-line" d="M100 79 H146" marker-end="url(#tp1)"/>
  <rect class="dg-fill" x="150" y="62" width="106" height="34" rx="6"/><text class="dg-s" x="203" y="84" text-anchor="middle">core threads free?</text>
  <path class="dg-line" d="M260 79 H306" marker-end="url(#tp1)"/>
  <rect class="dg-fill" x="310" y="62" width="106" height="34" rx="6"/><text class="dg-s" x="363" y="84" text-anchor="middle">queue full?</text>
  <path class="dg-line" d="M420 79 H466" marker-end="url(#tp1)"/>
  <rect class="dg-fill2" x="470" y="62" width="134" height="34" rx="6"/><text class="dg-s" x="537" y="84" text-anchor="middle">grow to maxPoolSize</text>
  <path class="dg-line" d="M537 100 V126" marker-end="url(#tp1)"/>
  <rect class="dg-box" x="452" y="126" width="152" height="30" rx="6"/><text class="dg-s" x="528" y="146" text-anchor="middle">still full → RejectedExecution</text>
  <text class="dg-s" x="16" y="34">the order matters: the QUEUE fills before extra threads are created —</text>
  <text class="dg-s" x="16" y="50">so an unbounded queue means maxPoolSize is never reached at all</text>
  <defs><marker id="tp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Rejection policy</th><th>Behaviour</th><th>Use when</th></tr>
<tr><td><code>AbortPolicy</code> (default)</td><td>Throws <code>RejectedExecutionException</code></td><td>The caller can handle failure</td></tr>
<tr><td><strong><code>CallerRunsPolicy</code></strong></td><td>Runs it on the submitting thread</td><td>Natural backpressure — the producer slows itself down</td></tr>
<tr><td><code>DiscardPolicy</code></td><td>Silently drops it</td><td>Only for genuinely optional work like metrics</td></tr>
<tr><td><code>DiscardOldestPolicy</code></td><td>Drops the oldest queued task</td><td>Latest-value-wins feeds</td></tr>
</table>
<pre><code>// Shutdown that actually works — a forgotten pool keeps the JVM alive
pool.shutdown();                                    // stop accepting, finish queued
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
    pool.shutdownNow();                             // interrupt the stragglers
    pool.awaitTermination(10, TimeUnit.SECONDS);
}

// The silent-failure trap
pool.submit(() -&gt; { throw new RuntimeException("boom"); });
// NOTHING is printed. The exception is captured in the Future. If you never
// call future.get(), it vanishes. Use execute() for fire-and-forget, or
// always inspect the Future, or set an UncaughtExceptionHandler.</code></pre>
<p><strong>The sizing formula to quote:</strong> <code>threads = cores × targetUtilisation × (1 + waitTime/serviceTime)</code>. A service that spends 90 ms waiting on a database and 10 ms computing has a ratio of 9, so on 8 cores you want roughly 80 threads — not 8. For pure computation, more threads than cores only adds context switching.</p>
<p><strong>What to say about virtual threads:</strong> "On Java 21 I would use <code>Executors.newVirtualThreadPerTaskExecutor()</code> for IO-bound work — blocking is cheap, so pool sizing stops being a tuning problem. But pooling still matters for CPU-bound tasks, and for anything that needs to <em>limit</em> concurrency against a downstream system, where a semaphore replaces the pool."</p>`
},
{
  q: "What is the difference between synchronized, ReentrantLock, and the Atomic classes?",
  level: "advanced", hot: true, tags: ["locks", "atomics", "concurrency", "must-know"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "SAP", "Barclays", "Flipkart", "Morgan Stanley"],
  a: `<table>
<tr><th></th><th><code>synchronized</code></th><th><code>ReentrantLock</code></th><th><code>AtomicInteger</code></th></tr>
<tr><td>Mechanism</td><td>JVM monitor</td><td><code>AbstractQueuedSynchronizer</code></td><td>CAS — no lock at all</td></tr>
<tr><td>Released automatically</td><td><strong>Yes</strong>, even on exception</td><td>No — needs <code>finally</code></td><td>n/a</td></tr>
<tr><td>Try without blocking</td><td>No</td><td><code>tryLock()</code>, with timeout</td><td>Inherently non-blocking</td></tr>
<tr><td>Interruptible while waiting</td><td>No</td><td><code>lockInterruptibly()</code></td><td>n/a</td></tr>
<tr><td>Fairness option</td><td>No</td><td>Yes (at a throughput cost)</td><td>n/a</td></tr>
<tr><td>Multiple conditions</td><td>One wait set</td><td>Many <code>Condition</code> objects</td><td>n/a</td></tr>
<tr><td>Best for</td><td><strong>Most cases</strong> — simplest and safest</td><td>Timeouts, fairness, multiple conditions</td><td>Single-variable counters and flags</td></tr>
</table>
<pre><code>// synchronized — the default choice
public synchronized void transfer(int amount) { balance += amount; }
// Equivalent to synchronized(this) { ... }. Prefer a PRIVATE lock object,
// because locking on 'this' lets any caller lock your instance:
private final Object lock = new Object();
public void transfer(int amount) { synchronized (lock) { balance += amount; } }

// ReentrantLock — when you need something synchronized cannot express
private final ReentrantLock lock = new ReentrantLock();
public boolean tryTransfer(int amount, Duration timeout) throws InterruptedException {
    if (!lock.tryLock(timeout.toMillis(), TimeUnit.MILLISECONDS)) return false;
    try { balance += amount; return true; }
    finally { lock.unlock(); }        // ALWAYS in finally — this is not automatic
}

// Atomic — lock-free, for a single variable
private final AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();
counter.updateAndGet(v -&gt; Math.max(v, newValue));    // CAS retry loop, built in
counter.compareAndSet(expected, updated);</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Compare and swap retry loop versus blocking on a lock">
  <text class="dg-t" x="16" y="22">CAS (optimistic)</text>
  <rect class="dg-fill" x="16" y="32" width="90" height="30" rx="6"/><text class="dg-s" x="61" y="52" text-anchor="middle">read v</text>
  <path class="dg-line" d="M110 47 H150" marker-end="url(#cas1)"/>
  <rect class="dg-fill" x="154" y="32" width="106" height="30" rx="6"/><text class="dg-s" x="207" y="52" text-anchor="middle">compute v+1</text>
  <path class="dg-line" d="M264 47 H304" marker-end="url(#cas1)"/>
  <rect class="dg-fill2" x="308" y="32" width="130" height="30" rx="6"/><text class="dg-s" x="373" y="52" text-anchor="middle">CAS(v, v+1)</text>
  <path class="dg-line" d="M373 66 V82 H61 V64" marker-end="url(#cas1)"/>
  <text class="dg-s" x="220" y="96" text-anchor="middle">failed → someone else won → retry</text>
  <text class="dg-s" x="470" y="52">no thread ever blocks</text>
  <text class="dg-s" x="16" y="128">under HIGH contention the retries waste CPU — that is when a lock wins instead</text>
  <defs><marker id="cas1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// LongAdder beats AtomicLong under heavy contention — it shards the count
// across cells and sums them on read. Perfect for metrics counters.
LongAdder hits = new LongAdder();
hits.increment();
long total = hits.sum();     // slightly stale, massively faster to write

// ReadWriteLock — many readers, one writer
ReadWriteLock rw = new ReentrantReadWriteLock();
rw.readLock().lock();  try { return cache.get(k); } finally { rw.readLock().unlock(); }
// StampedLock (Java 8) adds OPTIMISTIC reads that do not block writers at all,
// but it is not reentrant — a real trap if you call back into yourself.</code></pre>
<p><strong>Why <code>synchronized</code> is no longer slow:</strong> the JVM applies biased locking, lock coarsening and lock elision, and an uncontended <code>synchronized</code> block costs almost nothing. The old advice to prefer <code>ReentrantLock</code> for performance is out of date — choose it for the <em>features</em>, not the speed.</p>
<p><strong>The decision to state:</strong> "Atomic for a single variable, <code>synchronized</code> for a compound operation on shared state, <code>ReentrantLock</code> only when I need a timeout, interruptibility, fairness or multiple conditions. And before any of them I ask whether the state needs to be shared at all — an immutable object or a thread-confined one removes the problem entirely."</p>`
},
{
  q: "Explain CompletableFuture — composing, combining and handling failures",
  level: "advanced", hot: true, tags: ["async", "concurrency", "modern-java"],
  companies: ["Amazon", "Flipkart", "Optum", "SAP", "Walmart", "Goldman Sachs", "EPAM"],
  a: `<pre><code>// Sequential -> parallel. This is the value of CompletableFuture in one example.
// ✗ 300 ms — three blocking calls one after another
User user = userService.get(id);
List&lt;Order&gt; orders = orderService.get(id);
Credit credit = creditService.get(id);

// ✔ ~100 ms — all three in flight at once
CompletableFuture&lt;User&gt;        u = CompletableFuture.supplyAsync(() -&gt; userService.get(id), pool);
CompletableFuture&lt;List&lt;Order&gt;&gt; o = CompletableFuture.supplyAsync(() -&gt; orderService.get(id), pool);
CompletableFuture&lt;Credit&gt;      c = CompletableFuture.supplyAsync(() -&gt; creditService.get(id), pool);

CompletableFuture.allOf(u, o, c).join();
Profile profile = new Profile(u.join(), o.join(), c.join());   // join() is now instant</code></pre>
<table>
<tr><th>Method</th><th>Does</th></tr>
<tr><td><code>thenApply(fn)</code></td><td>Transform the result — like <code>map</code></td></tr>
<tr><td><code>thenCompose(fn)</code></td><td>Chain another future — like <code>flatMap</code>. Use this to avoid <code>CompletableFuture&lt;CompletableFuture&lt;T&gt;&gt;</code>.</td></tr>
<tr><td><code>thenCombine(other, fn)</code></td><td>Combine two independent futures</td></tr>
<tr><td><code>allOf</code> / <code>anyOf</code></td><td>Wait for all, or the first to finish</td></tr>
<tr><td><code>exceptionally(fn)</code></td><td>Recover with a fallback value</td></tr>
<tr><td><code>handle((v, e) -&gt; …)</code></td><td>Handle success and failure in one place</td></tr>
<tr><td><code>whenComplete</code></td><td>Side effect (logging) without changing the result</td></tr>
<tr><td><code>orTimeout(…)</code> / <code>completeOnTimeout(…)</code></td><td>Java 9+ — a deadline without a separate scheduler</td></tr>
</table>
<pre><code>// A realistic chain with timeout, fallback and logging
CompletableFuture&lt;Quote&gt; quote = CompletableFuture
    .supplyAsync(() -&gt; pricingClient.fetch(sku), ioPool)   // ALWAYS pass a pool
    .orTimeout(2, TimeUnit.SECONDS)
    .thenApply(this::applyDiscount)
    .exceptionally(ex -&gt; {
        log.warn("pricing failed for {}, using cached", sku, ex);
        return cache.lastKnown(sku);
    })
    .whenComplete((q, ex) -&gt; metrics.record(sku, ex == null));</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Three async calls running in parallel and joining">
  <rect class="dg-box" x="16" y="66" width="70" height="30" rx="6"/><text class="dg-s" x="51" y="86" text-anchor="middle">request</text>
  <path class="dg-line" d="M90 76 L146 34 M90 81 H146 M90 86 L146 126" marker-end="url(#cf1)"/>
  <rect class="dg-fill" x="150" y="20" width="130" height="28" rx="6"/><text class="dg-s" x="215" y="39" text-anchor="middle">userService 100ms</text>
  <rect class="dg-fill" x="150" y="67" width="130" height="28" rx="6"/><text class="dg-s" x="215" y="86" text-anchor="middle">orderService 90ms</text>
  <rect class="dg-fill" x="150" y="112" width="130" height="28" rx="6"/><text class="dg-s" x="215" y="131" text-anchor="middle">creditService 80ms</text>
  <path class="dg-line" d="M284 34 L340 76 M284 81 H340 M284 126 L340 86" marker-end="url(#cf1)"/>
  <rect class="dg-fill2" x="344" y="66" width="110" height="30" rx="6"/><text class="dg-s" x="399" y="86" text-anchor="middle">allOf().join()</text>
  <text class="dg-s" x="470" y="76">total ≈ 100 ms,</text>
  <text class="dg-s" x="470" y="94">not 270 ms</text>
  <defs><marker id="cf1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Trap</th><th>Why it matters</th></tr>
<tr><td>Not passing an <code>Executor</code></td><td>Defaults to the <strong>common ForkJoinPool</strong>, sized to cores−1 and shared with parallel streams. One blocking IO call there starves the whole JVM.</td></tr>
<tr><td><code>get()</code> vs <code>join()</code></td><td><code>get()</code> throws checked exceptions; <code>join()</code> throws unchecked <code>CompletionException</code>. Pick one and be consistent.</td></tr>
<tr><td><code>thenApply</code> where <code>thenCompose</code> is needed</td><td>Produces a nested future you then have to unwrap</td></tr>
<tr><td>Losing the exception</td><td>Without <code>exceptionally</code> or <code>handle</code>, a failure is silent until someone joins</td></tr>
<tr><td><code>allOf</code> returns <code>Void</code></td><td>You must still call <code>join()</code> on each future to collect the results</td></tr>
</table>
<p><strong>What to say about Java 21:</strong> "Structured concurrency (<code>StructuredTaskScope</code>) makes this much cleaner — the scope owns the subtasks, cancellation propagates automatically, and the code reads sequentially while running in parallel. <code>CompletableFuture</code> chains get hard to read past three or four stages, and that is exactly the problem structured concurrency was designed to fix."</p>`
},
{
  q: "What causes a deadlock, and how do you detect and prevent one?",
  level: "advanced", hot: true, tags: ["deadlock", "locks", "debugging", "production"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "Barclays", "SAP", "Optum", "Morgan Stanley"],
  a: `<p><strong>Four conditions must all hold</strong> — break any one and deadlock is impossible:</p>
<table>
<tr><th>Condition</th><th>How to break it</th></tr>
<tr><td>Mutual exclusion</td><td>Use immutable data or lock-free structures</td></tr>
<tr><td>Hold and wait</td><td>Acquire everything at once, or nothing</td></tr>
<tr><td>No pre-emption</td><td><code>tryLock</code> with a timeout, then back off and retry</td></tr>
<tr><td><strong>Circular wait</strong></td><td><strong>Global lock ordering</strong> — the practical fix</td></tr>
</table>
<pre><code>// ✗ The classic: two accounts, two threads, opposite orders
void transfer(Account from, Account to, long amount) {
    synchronized (from) {
        synchronized (to) { from.debit(amount); to.credit(amount); }
    }
}
// Thread A: transfer(acc1, acc2)   holds acc1, wants acc2
// Thread B: transfer(acc2, acc1)   holds acc2, wants acc1   -> deadlock

// ✔ GLOBAL ORDERING — always lock the lower id first
void transfer(Account from, Account to, long amount) {
    Account first  = from.id() &lt; to.id() ? from : to;
    Account second = from.id() &lt; to.id() ? to : from;
    synchronized (first) {
        synchronized (second) { from.debit(amount); to.credit(amount); }
    }
}
// Equal ids need a tie-break lock, or a guard rejecting self-transfer.

// ✔ TIMEOUT — break "no pre-emption" instead
if (fromLock.tryLock(100, MILLISECONDS)) {
    try {
        if (toLock.tryLock(100, MILLISECONDS)) {
            try { /* transfer */ } finally { toLock.unlock(); }
        } else { return retryLater(); }     // back off, do NOT spin
    } finally { fromLock.unlock(); }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Circular wait between two threads and two locks">
  <circle class="dg-fill" cx="130" cy="50" r="30"/><text class="dg-s" x="130" y="55" text-anchor="middle">T1</text>
  <circle class="dg-fill" cx="330" cy="50" r="30"/><text class="dg-s" x="330" y="55" text-anchor="middle">T2</text>
  <rect class="dg-fill2" x="96" y="112" width="68" height="34" rx="6"/><text class="dg-s" x="130" y="134" text-anchor="middle">lock A</text>
  <rect class="dg-fill2" x="296" y="112" width="68" height="34" rx="6"/><text class="dg-s" x="330" y="134" text-anchor="middle">lock B</text>
  <path class="dg-line" d="M130 80 V108" marker-end="url(#dl1)"/>
  <text class="dg-s" x="86" y="100" text-anchor="end">holds</text>
  <path class="dg-line" d="M330 80 V108" marker-end="url(#dl1)"/>
  <path class="dg-line" d="M160 60 L300 118" marker-end="url(#dl1)"/>
  <path class="dg-line" d="M300 60 L162 118" marker-end="url(#dl1)"/>
  <text class="dg-s" x="230" y="80" text-anchor="middle">each waits for the other</text>
  <text class="dg-s" x="410" y="126">a cycle in the wait-for graph</text>
  <text class="dg-s" x="410" y="146">IS the deadlock</text>
  <defs><marker id="dl1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code># DETECTING IT IN PRODUCTION — the JVM finds cycles for you
jcmd &lt;pid&gt; Thread.print | grep -A 30 "Found one Java-level deadlock"
jstack &lt;pid&gt;                       # same output
# Also: jconsole / VisualVM "Detect Deadlock" button, and
# ThreadMXBean.findDeadlockedThreads() to expose it as a health check

# Symptoms: throughput drops to zero for some requests but CPU is IDLE.
# Busy CPU with no progress is a LIVELOCK or a spin, not a deadlock.</code></pre>
<table>
<tr><th>Problem</th><th>Definition</th></tr>
<tr><td><strong>Deadlock</strong></td><td>Threads wait forever in a cycle. CPU idle.</td></tr>
<tr><td><strong>Livelock</strong></td><td>Threads keep responding to each other and make no progress. CPU busy.</td></tr>
<tr><td><strong>Starvation</strong></td><td>A thread never gets the lock because others keep winning it</td></tr>
<tr><td><strong>Thread leak</strong></td><td>Pool exhausted by tasks that never finish — looks like a hang, is not a deadlock</td></tr>
</table>
<p><strong>The prevention rules to state:</strong> hold locks for the shortest possible time and never across an IO call or an external service; never call unknown code (a listener, a callback, an overridable method) while holding a lock; prefer a single coarse lock over several fine ones until profiling says otherwise; and document the lock ordering where more than one lock exists — an undocumented ordering is a deadlock waiting for the next developer.</p>`
}
]);
