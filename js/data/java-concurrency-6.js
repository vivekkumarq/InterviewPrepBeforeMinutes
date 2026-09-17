appendTopic("java-concurrency", [
{
  q: "Explain the Java Memory Model — happens-before, visibility and reordering",
  level: "advanced", hot: true, tags: ["jmm", "volatile", "memory-model", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Oracle", "Goldman Sachs", "SAP", "Adobe", "Flipkart"],
  a: `<p>The JMM is not about locks. It answers one question: <strong>when is a write made by one thread guaranteed to be visible to another?</strong> Without a happens-before relationship, the answer is "never guaranteed" — regardless of how much time passes.</p>
<pre><code>// The bug that runs fine for years and then does not
class Worker {
    private boolean running = true;              // NOT volatile

    public void run() {
        while (running) { doWork(); }             // may never see the change
    }
    public void stop() { running = false; }       // called from another thread
}
// The JIT is ALLOWED to hoist the read out of the loop:
//     if (running) while (true) doWork();
// because within this thread nothing writes to running. That is a legal
// optimisation, and it is why the loop never exits.
//
// Three things are at play and they are commonly confused:
//   1. Compiler/JIT reordering and hoisting
//   2. CPU store buffers — a write may sit in a core-local buffer
//   3. Cache coherence delays
// volatile addresses all three by inserting the right memory barriers.</code></pre>
<table>
<tr><th>Happens-before is established by</th></tr>
<tr><td><strong>Program order</strong> within a single thread</td></tr>
<tr><td><strong>Monitor</strong>: unlocking a lock happens-before any later lock of the same monitor</td></tr>
<tr><td><strong>Volatile</strong>: a write happens-before every later read of that field</td></tr>
<tr><td><strong>Thread start</strong>: everything before <code>t.start()</code> is visible inside the new thread</td></tr>
<tr><td><strong>Thread join</strong>: everything in the thread is visible after <code>t.join()</code> returns</td></tr>
<tr><td><strong>Final fields</strong>: correctly published after the constructor completes</td></tr>
<tr><td><strong>Concurrent collections</strong>: putting an item happens-before taking it</td></tr>
</table>
<pre><code>// VOLATILE gives visibility and ordering. It does NOT give atomicity.
volatile int count;
count++;            // STILL BROKEN — this is read, add, write: three steps
                    // Two threads can both read 5 and both write 6.

// Use AtomicInteger (a CAS loop) or a lock for compound actions.
AtomicInteger count = new AtomicInteger();
count.incrementAndGet();        // atomic AND visible

// Where volatile IS correct: a one-way flag, or the "published reference"
// half of double-checked locking.
private volatile Config config;              // written once, read by many</code></pre>
<pre><code>// DOUBLE-CHECKED LOCKING — and why volatile is mandatory here
class Holder {
    private static volatile Singleton instance;      // remove volatile -> broken
    static Singleton get() {
        if (instance == null) {                      // no lock on the fast path
            synchronized (Holder.class) {
                if (instance == null) instance = new Singleton();
            }
        }
        return instance;
    }
}
// Without volatile: new Singleton() is (a) allocate, (b) run the constructor,
// (c) assign the reference. Steps b and c CAN BE REORDERED. Another thread
// then sees a non-null reference to a partially constructed object and uses
// fields that are still zero. volatile forbids that reordering.
//
// The simpler answer in real code: a static holder class, or an enum.
// Say that too — recognising when NOT to write the clever version counts.</code></pre>
<p><strong>The framing that shows real understanding:</strong> "Without a happens-before edge, there is no guarantee at all — not a weak one, not a delayed one. The JMM is a <em>contract about legal reorderings</em>, and it exists because CPUs and compilers must reorder to be fast. My job is to place the barriers where correctness actually depends on ordering."</p>`
},
{
  q: "CompletableFuture: composing async work without blocking",
  level: "advanced", hot: true, tags: ["completablefuture", "async", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "SAP", "Uber", "Goldman Sachs", "Flipkart", "Adobe"],
  a: `<pre><code>// The problem it solves: three independent calls, run in PARALLEL, combined.
CompletableFuture&lt;User&gt;    user  = CompletableFuture.supplyAsync(() -&gt; api.user(id), pool);
CompletableFuture&lt;List&lt;Order&gt;&gt; ords = CompletableFuture.supplyAsync(() -&gt; api.orders(id), pool);
CompletableFuture&lt;Prefs&gt;   prefs = CompletableFuture.supplyAsync(() -&gt; api.prefs(id), pool);

return CompletableFuture.allOf(user, ords, prefs)
        .thenApply(v -&gt; new Dashboard(user.join(), ords.join(), prefs.join()))
        .orTimeout(2, TimeUnit.SECONDS)                  // Java 9+
        .exceptionally(ex -&gt; Dashboard.degraded());
// Total latency = the SLOWEST call, not the sum. That is the whole point.
// allOf returns CompletableFuture&lt;Void&gt;, so you join() each one afterwards —
// they have all completed by then, so join() does not block.</code></pre>
<table>
<tr><th>Method</th><th>Takes</th><th>Use for</th></tr>
<tr><td><code>thenApply</code></td><td><code>Function</code></td><td>Transform the value — like <code>map</code></td></tr>
<tr><td><code>thenCompose</code></td><td><code>Function</code> returning a future</td><td><strong>Chain</strong> a dependent async call — like <code>flatMap</code></td></tr>
<tr><td><code>thenCombine</code></td><td>Another future + <code>BiFunction</code></td><td>Merge two <em>independent</em> results</td></tr>
<tr><td><code>thenAccept</code> / <code>thenRun</code></td><td>Consumer / Runnable</td><td>Side effects at the end of a chain</td></tr>
<tr><td><code>allOf</code> / <code>anyOf</code></td><td>Varargs of futures</td><td>Wait for all, or for the first</td></tr>
<tr><td><code>exceptionally</code></td><td><code>Function&lt;Throwable,T&gt;</code></td><td>Fallback value on failure</td></tr>
<tr><td><code>handle</code> / <code>whenComplete</code></td><td><code>(result, error)</code></td><td>See both outcomes; <code>handle</code> can transform, <code>whenComplete</code> cannot</td></tr>
</table>
<pre><code>// thenApply vs thenCompose — the distinction that gets asked
CompletableFuture&lt;CompletableFuture&lt;Order&gt;&gt; nested =
        userFuture.thenApply(u -&gt; fetchOrderAsync(u));      // nested, awkward
CompletableFuture&lt;Order&gt; flat =
        userFuture.thenCompose(u -&gt; fetchOrderAsync(u));    // flattened. Use this.
// Identical to map versus flatMap in Streams and Optional. If the lambda
// already returns a future, you want thenCompose.</code></pre>
<pre><code>// THE TRAPS

// 1. get() BLOCKS and throws checked exceptions. Inside a chain it is a bug.
//    Prefer join() (unchecked) at the boundary, or stay non-blocking.

// 2. The DEFAULT EXECUTOR is ForkJoinPool.commonPool() — sized to (cores - 1)
//    and SHARED with parallel streams. One blocking JDBC call in there stalls
//    unrelated work across the whole application.
//    ALWAYS pass your own executor for I/O.
Executor io = Executors.newFixedThreadPool(50);
CompletableFuture.supplyAsync(this::callDb, io);

// 3. SWALLOWED EXCEPTIONS. A failed future with no exceptionally/handle and
//    nobody joining it fails silently — no stack trace anywhere.

// 4. thenApply vs thenApplyAsync: the non-Async form may run on whichever
//    thread completed the previous stage, including the caller's. For a
//    long-running transformation, use the Async variant with an executor.</code></pre>
<pre><code>// TIMEOUT PER CALL, with a fallback — the production shape
CompletableFuture.supplyAsync(() -&gt; inventory.check(sku), io)
    .completeOnTimeout(Stock.UNKNOWN, 300, TimeUnit.MILLISECONDS)
    .exceptionally(ex -&gt; { log.warn("inventory down", ex); return Stock.UNKNOWN; });</code></pre>
<p><strong>In Java 21, say this:</strong> "Virtual threads plus structured concurrency cover most of what I used <code>CompletableFuture</code> for, and the code reads as ordinary sequential blocking calls. I would still reach for <code>CompletableFuture</code> for callback-style composition and when working with existing async APIs." Knowing when a tool has been superseded is worth as much as knowing the tool.</p>`
},
{
  q: "Deadlock, livelock and starvation — causes, detection and prevention",
  level: "advanced", hot: true, tags: ["deadlock", "locks", "debugging", "must-know"],
  companies: ["Amazon", "Microsoft", "Oracle", "Goldman Sachs", "SAP", "Infosys", "TCS", "Adobe"],
  a: `<pre><code>// A DEADLOCK, in the shape it actually appears — a bank transfer
void transfer(Account from, Account to, BigDecimal amt) {
    synchronized (from) {
        synchronized (to) {                  // thread A: 1 then 2
            from.debit(amt); to.credit(amt); // thread B: 2 then 1  -> DEADLOCK
        }
    }
}

// THE FIX: impose a GLOBAL ORDER on lock acquisition.
void transfer(Account a, Account b, BigDecimal amt) {
    Account first  = a.id() &lt; b.id() ? a : b;      // always lock lower id first
    Account second = a.id() &lt; b.id() ? b : a;
    synchronized (first) {
        synchronized (second) { a.debit(amt); b.credit(amt); }
    }
}
// Equal ids must be handled too — transferring to yourself would self-deadlock
// on a non-reentrant lock (synchronized IS reentrant, so it survives, but a
// ReentrantReadWriteLock read-then-write does not).</code></pre>
<table>
<tr><th>Coffman condition</th><th>Break it by</th></tr>
<tr><td>Mutual exclusion</td><td>Immutable data, or lock-free structures</td></tr>
<tr><td>Hold and wait</td><td>Acquire everything at once, or nothing</td></tr>
<tr><td>No pre-emption</td><td><code>tryLock(timeout)</code> — back off and retry</td></tr>
<tr><td><strong>Circular wait</strong></td><td><strong>Global lock ordering</strong> — the practical fix, and the one to name</td></tr>
</table>
<pre><code>// tryLock — break the "no pre-emption" condition instead
if (from.lock.tryLock(100, MILLISECONDS)) {
    try {
        if (to.lock.tryLock(100, MILLISECONDS)) {
            try { /* transfer */ } finally { to.lock.unlock(); }
        } else { /* back off, jitter, retry — do NOT spin tightly */ }
    } finally { from.lock.unlock(); }
}
// Now the worst case is a retry rather than a permanent hang. Add jitter or
// two threads can retry in lockstep forever — which is LIVELOCK.</code></pre>
<table>
<tr><th>Problem</th><th>What it looks like</th><th>Cause</th></tr>
<tr><td><strong>Deadlock</strong></td><td>Threads blocked forever, CPU at 0%</td><td>Circular lock wait</td></tr>
<tr><td><strong>Livelock</strong></td><td>Threads busy, no progress, CPU high</td><td>Retrying in lockstep, no jitter</td></tr>
<tr><td><strong>Starvation</strong></td><td>One thread never scheduled</td><td>Unfair locks, priority imbalance, a greedy holder</td></tr>
<tr><td><strong>Thread leak</strong></td><td>Thread count climbing steadily</td><td>Executors never shut down; unbounded creation</td></tr>
<tr><td><strong>Lock convoy</strong></td><td>Throughput collapses under load</td><td>Every thread queueing on one hot lock</td></tr>
</table>
<pre><code># DIAGNOSING IT IN PRODUCTION — know these commands cold
jcmd &lt;pid&gt; Thread.print            # thread dump; the JVM NAMES the deadlock:
                                   # "Found one Java-level deadlock"
jstack &lt;pid&gt; | grep -A5 BLOCKED    # who is blocked, and on which monitor
jcmd &lt;pid&gt; Thread.print | grep -c "java.lang.Thread.State"   # thread count

# Take THREE dumps ~10 seconds apart. Threads stuck on the same lock across
# all three is a deadlock; threads that move are just contention.
# In code: ThreadMXBean.findDeadlockedThreads() can detect it at runtime.</code></pre>
<table>
<tr><th>Prevention habit</th><th>Why</th></tr>
<tr><td>Hold locks for the shortest possible time</td><td>Never do I/O or call unknown code while holding one</td></tr>
<tr><td><strong>Never call out to foreign code under a lock</strong></td><td>A listener or callback may acquire another lock — this is "lock leakage"</td></tr>
<tr><td>Prefer concurrent collections to explicit locks</td><td><code>ConcurrentHashMap</code> is already correct and finer-grained</td></tr>
<tr><td>Prefer immutability</td><td>No shared mutable state means no lock at all</td></tr>
<tr><td>Use <code>ReentrantLock(true)</code> when starvation appears</td><td>Fair ordering, at a real throughput cost — measure it</td></tr>
<tr><td>Name your threads</td><td>A dump full of <code>pool-1-thread-7</code> is unreadable at 3am</td></tr>
</table>
<p><strong>The answer that stands out:</strong> "The cheapest deadlock fix is not to share mutable state. Where I must, I take locks in a globally consistent order and never hold one across an I/O call or a callback. If contention is the real problem rather than correctness, I reach for a concurrent collection or partitioning before adding fairness, because fair locks trade a lot of throughput for the guarantee."</p>`
}
]);
