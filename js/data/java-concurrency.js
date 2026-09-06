registerTopic("java-concurrency", [
{
  q: "What is the difference between a process and a thread?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<table>
<tr><th></th><th>Process</th><th>Thread</th></tr>
<tr><td>Memory</td><td>Own address space</td><td>Shares heap and metaspace with sibling threads</td></tr>
<tr><td>Private area</td><td>Everything</td><td>Own stack, program counter, native stack</td></tr>
<tr><td>Creation cost</td><td>Heavy</td><td>Light (~1 MB stack by default)</td></tr>
<tr><td>Communication</td><td>IPC — sockets, pipes, shared memory</td><td>Shared variables (which is why you need synchronisation)</td></tr>
<tr><td>Failure</td><td>Isolated</td><td>An uncaught error can take down the JVM</td></tr>
</table>
<p>The key consequence: threads share the heap, so <strong>every object reachable by two threads is a potential race</strong>. Each thread's local variables and method frames live on its own stack and are automatically safe.</p>`
},
{
  q: "What are the states in a thread's lifecycle?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<figure class="fig">
<svg viewBox="0 0 640 200" role="img" aria-label="Thread lifecycle states">
  <rect class="dg-fill" x="10" y="80" width="96" height="34" rx="7"/><text class="dg-t" x="58" y="102" text-anchor="middle">NEW</text>
  <path class="dg-line" d="M110 97 H160" marker-end="url(#t1)"/><text class="dg-m" x="135" y="88" text-anchor="middle">start()</text>
  <rect class="dg-fill2" x="164" y="80" width="110" height="34" rx="7"/><text class="dg-t" x="219" y="102" text-anchor="middle">RUNNABLE</text>
  <path class="dg-line" d="M219 80 V44 H360" marker-end="url(#t1)"/><text class="dg-m" x="290" y="38" text-anchor="middle">lock held by other</text>
  <rect class="dg-box" x="364" y="28" width="110" height="32" rx="7"/><text class="dg-t" x="419" y="49" text-anchor="middle">BLOCKED</text>
  <path class="dg-line" d="M364 44 H300 V80" marker-end="url(#t1)"/>
  <path class="dg-line" d="M274 97 H360" marker-end="url(#t1)"/><text class="dg-m" x="317" y="90" text-anchor="middle">wait()/join()</text>
  <rect class="dg-box" x="364" y="80" width="110" height="34" rx="7"/><text class="dg-t" x="419" y="102" text-anchor="middle">WAITING</text>
  <path class="dg-line" d="M274 110 H340 V150 H360" marker-end="url(#t1)"/><text class="dg-m" x="300" y="146" text-anchor="middle">sleep(t)</text>
  <rect class="dg-box" x="364" y="134" width="140" height="34" rx="7"/><text class="dg-t" x="434" y="156" text-anchor="middle">TIMED_WAITING</text>
  <path class="dg-line" d="M219 114 V180 H540 V114" marker-end="url(#t1)"/>
  <rect class="dg-fill" x="516" y="80" width="112" height="34" rx="7"/><text class="dg-t" x="572" y="102" text-anchor="middle">TERMINATED</text>
  <text class="dg-m" x="380" y="192" text-anchor="middle">run() returns or throws</text>
  <defs><marker id="t1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Six states from Thread.State — note RUNNABLE covers both "running" and "ready".</figcaption>
</figure>
<ul>
<li><strong>NEW</strong> — created, <code>start()</code> not called. Calling <code>start()</code> twice throws <code>IllegalThreadStateException</code>.</li>
<li><strong>RUNNABLE</strong> — eligible to run; the OS scheduler decides. Java does not distinguish "ready" from "running".</li>
<li><strong>BLOCKED</strong> — waiting to acquire a <code>synchronized</code> monitor.</li>
<li><strong>WAITING</strong> — <code>wait()</code>, <code>join()</code>, <code>LockSupport.park()</code> with no timeout.</li>
<li><strong>TIMED_WAITING</strong> — <code>sleep(t)</code>, <code>wait(t)</code>, <code>join(t)</code>, <code>tryLock(t)</code>.</li>
<li><strong>TERMINATED</strong> — <code>run()</code> finished. A thread cannot be restarted.</li>
</ul>`
},
{
  q: "start() vs run() — what happens if you call run() directly?",
  level: "beginner", hot: true, tags: ["basics", "gotcha"],
  a: `<p><code>start()</code> asks the JVM to allocate a new OS thread and invoke <code>run()</code> on it. <code>run()</code> called directly is just an ordinary method call <strong>on the current thread</strong> — no concurrency at all.</p>
<pre><code>Thread t = new Thread(() -&gt; System.out.println(Thread.currentThread().getName()));
t.run();    // prints "main"     &lt;- no new thread
t.start();  // prints "Thread-0" &lt;- actual new thread</code></pre>
<p>This is the single most common beginner interview trap, and it also appears as: "you have a thread pool but everything runs sequentially — why?"</p>`
},
{
  q: "Runnable vs Callable vs Future",
  level: "beginner", hot: true, tags: ["executors"],
  a: `<table>
<tr><th></th><th>Runnable</th><th>Callable&lt;V&gt;</th></tr>
<tr><td>Method</td><td><code>void run()</code></td><td><code>V call() throws Exception</code></td></tr>
<tr><td>Returns a value</td><td>No</td><td>Yes</td></tr>
<tr><td>Checked exceptions</td><td>Cannot throw</td><td>Can throw</td></tr>
<tr><td>Since</td><td>1.0</td><td>1.5</td></tr>
</table>
<p><code>Future&lt;V&gt;</code> is the handle to a pending result: <code>get()</code> (blocks), <code>get(timeout)</code>, <code>cancel(mayInterrupt)</code>, <code>isDone()</code>.</p>
<pre><code>ExecutorService pool = Executors.newFixedThreadPool(4);
Future&lt;Invoice&gt; f = pool.submit(() -&gt; billingService.generate(orderId));  // Callable
try {
    Invoice inv = f.get(2, TimeUnit.SECONDS);
} catch (ExecutionException e) {
    // the task's exception is wrapped — unwrap with e.getCause()
} catch (TimeoutException e) {
    f.cancel(true);
}</code></pre>
<p><strong>Future's weaknesses</strong> — and the reason <code>CompletableFuture</code> exists: <code>get()</code> blocks, you cannot chain or combine futures, and there is no callback on completion.</p>`
},
{
  q: "What is synchronized? Method-level vs block-level, instance vs class lock",
  level: "beginner", hot: true, tags: ["locks"],
  a: `<p><code>synchronized</code> acquires an object's <strong>monitor</strong>. Only one thread may hold a given monitor at a time, and releasing it establishes a happens-before edge, so it provides both <em>mutual exclusion</em> and <em>visibility</em>.</p>
<pre><code>class Counter {
    private int count;

    public synchronized void inc() { count++; }          // locks 'this'
    public static synchronized void stat() { }           // locks Counter.class

    private final Object lock = new Object();
    public void incBlock() {
        // do expensive non-shared work here, outside the lock
        synchronized (lock) { count++; }                   // narrower critical section
    }
}</code></pre>
<ul>
<li><strong>Instance lock</strong> (<code>this</code>) and <strong>class lock</strong> (<code>Class</code> object) are independent — a static synchronized method does not block an instance one.</li>
<li>Prefer a <strong>private final lock object</strong> over <code>this</code>: with <code>this</code>, any external code can <code>synchronized(yourObject)</code> and deadlock you.</li>
<li>Locks are <strong>reentrant</strong> — a thread can re-enter a monitor it already holds.</li>
<li>Never synchronize on a <code>String</code> literal or boxed <code>Integer</code> — they are interned/cached and shared JVM-wide.</li>
</ul>`
},
{
  q: "What does volatile do, and what does it NOT do?",
  level: "beginner", hot: true, tags: ["jmm", "volatile"],
  a: `<p><strong>It does two things:</strong></p>
<ul>
<li><strong>Visibility</strong> — a write is flushed to main memory and every subsequent read sees it. Without it, a thread may cache the value in a register forever.</li>
<li><strong>Ordering</strong> — inserts memory barriers, preventing the compiler/CPU from reordering across it. Everything written <em>before</em> a volatile write is visible to a thread that reads that volatile.</li>
</ul>
<p><strong>It does NOT provide atomicity.</strong> <code>count++</code> is read-modify-write — three operations — so it is still racy on a volatile field.</p>
<pre><code>// Correct use: a flag
private volatile boolean running = true;
public void stop() { running = false; }
public void run() { while (running) { work(); } }   // without volatile: may loop forever

// Incorrect use: a counter
private volatile int count;
public void inc() { count++; }   // STILL RACY — use AtomicInteger</code></pre>
<p>The canonical correct use beyond flags is the <strong>double-checked locking singleton</strong>, where volatile prevents another thread from seeing a partially-constructed object due to reordering of allocation and assignment.</p>`
},
{
  q: "What is a race condition, and what is the difference from a data race?",
  level: "beginner", tags: ["jmm"],
  a: `<ul>
<li>A <strong>data race</strong> is a precise JMM term: two threads access the same memory location, at least one writes, and there is no happens-before ordering between them. The result is <em>undefined</em>, not merely unpredictable.</li>
<li>A <strong>race condition</strong> is a correctness bug where the outcome depends on timing. You can have one even with fully synchronised code — check-then-act across two atomic calls is the classic case.</li>
</ul>
<pre><code>// No data race (ConcurrentHashMap is thread-safe) but a REAL race condition
if (!map.containsKey(k)) {      // thread A and B both see false
    map.put(k, compute());      // one overwrites the other
}
// Fix: one atomic operation
map.computeIfAbsent(k, key -&gt; compute());</code></pre>
<p>The lesson to state: <em>thread-safe components do not compose into a thread-safe program.</em> Atomicity must cover the whole invariant, not each call.</p>`
},
{
  q: "wait(), notify(), notifyAll() — how do they work and why must they be in a loop?",
  level: "advanced", hot: true, tags: ["locks"],
  a: `<p>These are <code>Object</code> methods and may only be called while holding that object's monitor, otherwise <code>IllegalMonitorStateException</code>. <code>wait()</code> <strong>releases the lock</strong> and parks the thread; <code>notify()</code> wakes one waiter; <code>notifyAll()</code> wakes all. The woken thread must reacquire the lock before continuing.</p>
<pre><code>synchronized (lock) {
    while (queue.isEmpty()) {     // WHILE, never IF
        lock.wait();
    }
    process(queue.poll());
}</code></pre>
<p><strong>Why <code>while</code>:</strong></p>
<ol>
<li><strong>Spurious wakeups</strong> are permitted by the specification — a thread can return from <code>wait()</code> with nobody notifying.</li>
<li><strong>Barging</strong> — between the notify and your reacquisition of the lock, another thread may have consumed the condition.</li>
</ol>
<p><strong>notify vs notifyAll:</strong> <code>notify()</code> is only safe when all waiters are interchangeable and waiting on the same condition; otherwise you can wake the wrong thread and the right one sleeps forever (a "missed signal" deadlock). Default to <code>notifyAll()</code>, or better, use <code>Condition</code> objects with a <code>ReentrantLock</code>, which allow separate wait sets (<code>notFull</code>, <code>notEmpty</code>).</p>
<p><code>sleep()</code> vs <code>wait()</code>: <code>sleep</code> is a <code>Thread</code> static that <strong>keeps</strong> the lock; <code>wait</code> is an <code>Object</code> method that <strong>releases</strong> it.</p>`
},
{
  q: "What is a deadlock? How do you detect and prevent it?",
  level: "advanced", hot: true, tags: ["deadlock", "production"],
  a: `<p>Two or more threads each hold a lock the other needs, so none can proceed. It requires all four Coffman conditions simultaneously: <strong>mutual exclusion, hold-and-wait, no preemption, circular wait</strong>. Break any one and deadlock is impossible.</p>
<pre><code>// Classic deadlock — inconsistent lock ordering
void transfer(Account from, Account to, BigDecimal amt) {
    synchronized (from) {
        synchronized (to) { from.debit(amt); to.credit(amt); }
    }
}
// transfer(A,B) on thread 1 and transfer(B,A) on thread 2 deadlock.

// Fix 1: global lock ordering
void transfer(Account from, Account to, BigDecimal amt) {
    Account first  = from.id() &lt; to.id() ? from : to;
    Account second = from.id() &lt; to.id() ? to   : from;
    synchronized (first) { synchronized (second) { ... } }
}

// Fix 2: timeout — break hold-and-wait
if (fromLock.tryLock(1, SECONDS)) {
    try { if (toLock.tryLock(1, SECONDS)) { try { ... } finally { toLock.unlock(); } } }
    finally { fromLock.unlock(); }
}</code></pre>
<p><strong>Detection in production:</strong> <code>jstack &lt;pid&gt;</code> prints "Found one Java-level deadlock" with the exact cycle; <code>jcmd &lt;pid&gt; Thread.print</code>, VisualVM, or <code>ThreadMXBean.findDeadlockedThreads()</code> for programmatic alerting.</p>
<p>Also name the cousins: <strong>livelock</strong> (threads keep reacting to each other and make no progress) and <strong>starvation</strong> (a thread never gets scheduled or never wins the lock).</p>`
},
{
  q: "Explain the ExecutorService and thread pool parameters",
  level: "advanced", hot: true, tags: ["executors", "production"],
  a: `<pre><code>new ThreadPoolExecutor(
    corePoolSize,       // threads kept alive even when idle
    maximumPoolSize,    // hard ceiling
    keepAliveTime, unit,// idle timeout for threads above core
    workQueue,          // where tasks wait
    threadFactory,      // naming — do this, it saves you in thread dumps
    handler);           // rejection policy</code></pre>
<p><strong>The submission algorithm — and the counter-intuitive part:</strong></p>
<ol>
<li>Fewer than <code>core</code> threads → create a new thread.</li>
<li>Otherwise → <strong>queue the task</strong>.</li>
<li>Queue full → create threads up to <code>max</code>.</li>
<li>Queue full and at <code>max</code> → apply the rejection handler.</li>
</ol>
<blockquote><p>With an <strong>unbounded</strong> queue, step 3 is never reached — <code>maximumPoolSize</code> is silently ignored. That is why <code>Executors.newFixedThreadPool</code> can queue millions of tasks until it OOMs.</p></blockquote>
<table>
<tr><th>Factory</th><th>Reality</th></tr>
<tr><td><code>newFixedThreadPool(n)</code></td><td>Unbounded <code>LinkedBlockingQueue</code> → OOM risk</td></tr>
<tr><td><code>newCachedThreadPool()</code></td><td><code>SynchronousQueue</code>, max = Integer.MAX_VALUE → unbounded thread creation</td></tr>
<tr><td><code>newSingleThreadExecutor()</code></td><td>Serial execution, unbounded queue</td></tr>
<tr><td><code>newVirtualThreadPerTaskExecutor()</code></td><td>Java 21 — one virtual thread per task</td></tr>
</table>
<p><strong>Production advice:</strong> construct <code>ThreadPoolExecutor</code> explicitly with a bounded queue and <code>CallerRunsPolicy</code> (which applies natural backpressure by making the submitter do the work). Size it: CPU-bound ≈ cores + 1; I/O-bound ≈ cores × (1 + wait/compute).</p>
<p>Always shut down: <code>shutdown()</code> then <code>awaitTermination()</code> then <code>shutdownNow()</code>.</p>`
},
{
  q: "What is the Java Memory Model and happens-before?",
  level: "advanced", hot: true, tags: ["jmm"],
  a: `<p>The JMM defines when a write by one thread becomes <em>visible</em> to another. Without it, compilers, CPUs and caches are free to reorder and cache anything, so "the code order" means nothing across threads.</p>
<p><strong>happens-before</strong> is the ordering guarantee: if A happens-before B, everything A did is visible to B. The rules you should be able to list:</p>
<ol>
<li><strong>Program order</strong> — within one thread, statements happen-before later ones.</li>
<li><strong>Monitor lock</strong> — unlocking a monitor happens-before any subsequent lock of the same monitor.</li>
<li><strong>Volatile</strong> — a write to a volatile happens-before every later read of it.</li>
<li><strong>Thread start</strong> — <code>t.start()</code> happens-before anything in <code>t</code>.</li>
<li><strong>Thread join</strong> — everything in <code>t</code> happens-before <code>t.join()</code> returning.</li>
<li><strong>Final fields</strong> — correctly constructed final fields are visible without synchronisation.</li>
<li><strong>Transitivity</strong> — A hb B and B hb C implies A hb C.</li>
</ol>
<p>Practical translations: submitting to an executor happens-before the task runs; <code>CountDownLatch.countDown()</code> happens-before <code>await()</code> returns; putting into a <code>BlockingQueue</code> happens-before taking it out. That is why safely publishing an object through a concurrent collection needs no extra synchronisation.</p>`
},
{
  q: "Atomic classes and CAS — how does AtomicInteger work without locks?",
  level: "advanced", hot: true, tags: ["atomics"],
  a: `<p>Atomics use <strong>compare-and-swap</strong>, a single CPU instruction (<code>lock cmpxchg</code> on x86) exposed through <code>Unsafe</code>/<code>VarHandle</code>: "if the memory location still holds the expected value, replace it; otherwise fail." <code>incrementAndGet</code> is a retry loop around it.</p>
<pre><code>// Conceptually what incrementAndGet does
int prev, next;
do {
    prev = get();
    next = prev + 1;
} while (!compareAndSet(prev, next));</code></pre>
<ul>
<li><strong>Non-blocking</strong> — no thread is ever suspended, so no deadlock and no context-switch cost.</li>
<li><strong>Under heavy contention</strong>, the retry loop burns CPU. That is why Java 8 added <code>LongAdder</code>/<code>DoubleAdder</code>, which keep per-thread striped cells and sum on read — far faster for hot counters (metrics!) where you write often and read rarely.</li>
<li><strong>The ABA problem</strong>: a value changes A→B→A and CAS wrongly succeeds. <code>AtomicStampedReference</code> adds a version stamp to solve it.</li>
</ul>
<p>The family: <code>AtomicInteger/Long/Boolean/Reference</code>, array variants, <code>AtomicIntegerFieldUpdater</code>, and modern <code>VarHandle</code> (Java 9+) which replaces <code>Unsafe</code>.</p>`
},
{
  q: "ReentrantLock vs synchronized — when do you need the explicit lock?",
  level: "advanced", tags: ["locks"],
  a: `<table>
<tr><th></th><th>synchronized</th><th>ReentrantLock</th></tr>
<tr><td>Release</td><td>Automatic (JVM)</td><td>Manual — <strong>must</strong> be in <code>finally</code></td></tr>
<tr><td>Try without blocking</td><td>No</td><td><code>tryLock()</code> / <code>tryLock(timeout)</code></td></tr>
<tr><td>Interruptible wait</td><td>No</td><td><code>lockInterruptibly()</code></td></tr>
<tr><td>Fairness</td><td>Always barging</td><td>Optional FIFO fairness</td></tr>
<tr><td>Condition variables</td><td>One wait set per object</td><td>Multiple <code>Condition</code>s</td></tr>
<tr><td>Lock across methods</td><td>No (block-scoped)</td><td>Yes</td></tr>
</table>
<pre><code>private final ReentrantLock lock = new ReentrantLock();
private final Condition notEmpty = lock.newCondition();
private final Condition notFull  = lock.newCondition();

public void put(T item) throws InterruptedException {
    lock.lock();
    try {
        while (isFull()) notFull.await();
        enqueue(item);
        notEmpty.signal();          // wakes only consumers, not producers
    } finally {
        lock.unlock();              // ALWAYS in finally
    }
}</code></pre>
<p><strong>Default to <code>synchronized</code></strong> — it is simpler, cannot leak a lock, and modern JVMs optimise it well. Reach for <code>ReentrantLock</code> when you specifically need timeout, interruptibility, fairness or multiple conditions. Also mention <code>ReentrantReadWriteLock</code> (many readers, one writer) and <code>StampedLock</code> (Java 8, optimistic reads, but not reentrant).</p>`
},
{
  q: "CompletableFuture — how do you compose asynchronous calls?",
  level: "advanced", hot: true, tags: ["async"],
  a: `<pre><code>CompletableFuture&lt;Customer&gt; cf = CompletableFuture
    .supplyAsync(() -&gt; customerClient.fetch(id), ioPool)          // run async
    .thenApply(Customer::enrich)                                   // transform (sync)
    .thenCompose(c -&gt; CompletableFuture.supplyAsync(               // flatMap another future
            () -&gt; addressClient.fetch(c.addressId()), ioPool)
        .thenApply(c::withAddress))
    .orTimeout(3, TimeUnit.SECONDS)                                // Java 9+
    .exceptionally(ex -&gt; { log.warn("fallback", ex); return Customer.EMPTY; });

// Fan out and join
var orders  = CompletableFuture.supplyAsync(() -&gt; orderClient.byCustomer(id), ioPool);
var tickets = CompletableFuture.supplyAsync(() -&gt; ticketClient.byCustomer(id), ioPool);
CompletableFuture.allOf(orders, tickets).join();
var view = new CustomerView(orders.join(), tickets.join());</code></pre>
<p><strong>The distinctions they probe:</strong></p>
<ul>
<li><code>thenApply</code> (returns a value) vs <code>thenCompose</code> (returns another future — the flatMap) vs <code>thenCombine</code> (merges two independent futures).</li>
<li><code>xxx</code> vs <code>xxxAsync</code>: without <code>Async</code>, the callback may run on the completing thread — which can be a Netty I/O thread you must not block.</li>
<li><code>exceptionally</code> (recover) vs <code>handle</code> (sees both value and exception) vs <code>whenComplete</code> (side effect, does not change the result).</li>
<li><strong>Always pass your own executor.</strong> The default is the common ForkJoinPool, sized to cores−1 and shared with parallel streams; one blocking call there starves the whole JVM.</li>
</ul>`
},
{
  q: "What are CountDownLatch, CyclicBarrier, Semaphore and Phaser?",
  level: "advanced", tags: ["synchronizers"],
  a: `<table>
<tr><th>Class</th><th>Purpose</th><th>Reusable</th><th>Typical use</th></tr>
<tr><td><code>CountDownLatch</code></td><td>Wait for N events to happen once</td><td><strong>No</strong> — one-shot</td><td>Wait for all services to warm up before serving traffic</td></tr>
<tr><td><code>CyclicBarrier</code></td><td>N threads wait for <em>each other</em></td><td>Yes</td><td>Iterative parallel simulations, batch phases</td></tr>
<tr><td><code>Semaphore</code></td><td>Limit concurrent access to N permits</td><td>Yes</td><td>Cap concurrent calls to a fragile downstream API</td></tr>
<tr><td><code>Phaser</code></td><td>Barrier with dynamic party registration</td><td>Yes</td><td>Variable-size phased workloads</td></tr>
<tr><td><code>Exchanger</code></td><td>Two threads swap objects</td><td>Yes</td><td>Buffer handoff pipelines</td></tr>
</table>
<pre><code>// Semaphore as a concurrency limiter — very common in microservices
private final Semaphore permits = new Semaphore(10);

public Response call(Request r) throws InterruptedException {
    if (!permits.tryAcquire(200, MILLISECONDS)) throw new TooManyRequestsException();
    try { return downstream.send(r); }
    finally { permits.release(); }   // finally, always
}</code></pre>
<p>The key contrast interviewers want: a latch counts <em>events</em> and cannot be reset; a barrier counts <em>threads</em> and resets automatically for the next round.</p>`
},
{
  q: "What are virtual threads (Project Loom) and when do they help?",
  level: "advanced", hot: true, tags: ["loom", "modern-java"],
  a: `<p>Virtual threads (final in <strong>Java 21</strong>) are lightweight threads scheduled by the JVM onto a small pool of OS carrier threads. Creating millions is fine — each starts with a few hundred bytes of heap-allocated stack instead of ~1 MB of native stack.</p>
<pre><code>// One virtual thread per task — no pool sizing needed
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var request : requests) {
        executor.submit(() -&gt; handle(request));   // blocking I/O is now fine
    }
}
// Spring Boot 3.2+: spring.threads.virtual.enabled=true</code></pre>
<p><strong>Why they matter:</strong> when a virtual thread blocks on I/O, the JVM <em>unmounts</em> it from the carrier thread, which goes on to run other work. You get the scalability of reactive programming while keeping simple, debuggable, blocking, sequential code — with real stack traces.</p>
<p><strong>They help</strong> with I/O-bound, high-concurrency workloads (typical microservices calling databases and other services). <strong>They do not help</strong> CPU-bound work — you still cannot exceed your cores.</p>
<p><strong>Caveats to mention:</strong> pinning — a virtual thread inside a <code>synchronized</code> block holding a lock across blocking I/O cannot unmount (largely fixed in Java 24, but use <code>ReentrantLock</code> to be safe); and thread pools become an anti-pattern since virtual threads are meant to be created per task, not pooled.</p>`
},
{
  q: "How would you implement a thread-safe singleton?",
  level: "advanced", hot: true, tags: ["patterns", "locks"],
  a: `<p>Four approaches, best first:</p>
<pre><code>// 1. Enum — Effective Java's recommendation. Serialization- and reflection-safe.
public enum ConfigService {
    INSTANCE;
    public String get(String key) { ... }
}

// 2. Initialization-on-demand holder — lazy, no synchronisation, JVM-guaranteed
public class ConfigService {
    private ConfigService() {}
    private static class Holder { static final ConfigService INSTANCE = new ConfigService(); }
    public static ConfigService getInstance() { return Holder.INSTANCE; }
}

// 3. Double-checked locking — volatile is MANDATORY
public class ConfigService {
    private static volatile ConfigService instance;
    public static ConfigService getInstance() {
        if (instance == null) {                      // no lock on the hot path
            synchronized (ConfigService.class) {
                if (instance == null) instance = new ConfigService();
            }
        }
        return instance;
    }
}</code></pre>
<p><strong>Why volatile is mandatory in #3:</strong> <code>new</code> is three steps — allocate, run constructor, assign reference. Without volatile, steps 2 and 3 can be reordered, so another thread can see a non-null reference to a half-constructed object. The barrier prevents that.</p>
<p><strong>In practice with Spring:</strong> just declare a <code>@Component</code>. Spring beans are singletons managed by the container, testable and mockable — unlike a static singleton, which is global mutable state and a testing nightmare.</p>`
},
{
  q: "What is ThreadLocal and what is its danger?",
  level: "advanced", tags: ["threadlocal", "memory"],
  a: `<p><code>ThreadLocal&lt;T&gt;</code> gives each thread its own independent copy of a variable — stored in a map on the <code>Thread</code> object itself.</p>
<pre><code>private static final ThreadLocal&lt;SimpleDateFormat&gt; FORMAT =
    ThreadLocal.withInitial(() -&gt; new SimpleDateFormat("yyyy-MM-dd"));  // SDF is not thread-safe

// Real-world uses
MDC.put("traceId", traceId);         // SLF4J logging context = ThreadLocal
SecurityContextHolder.getContext();  // Spring Security's authenticated user
TransactionSynchronizationManager;   // Spring's current transaction/connection</code></pre>
<p><strong>The danger — memory leaks in thread pools.</strong> Pool threads live forever, so anything you put in a ThreadLocal stays reachable after the request ends. Worse in web containers: the value may reference a classloader, preventing the whole application from being unloaded on redeploy.</p>
<pre><code>try {
    context.set(tenantId);
    process();
} finally {
    context.remove();   // NON-NEGOTIABLE in a pooled environment
}</code></pre>
<p><strong>Also note:</strong> ThreadLocals do not propagate to child threads (use <code>InheritableThreadLocal</code>, with its own leak risks) and are invisible across async boundaries — one of the real difficulties of reactive code, which is why Java 21 added <code>ScopedValue</code> as a safer, immutable, automatically-scoped replacement.</p>`
},
{
  q: "What is the ForkJoinPool and work stealing?",
  level: "advanced", tags: ["parallel"],
  a: `<p><code>ForkJoinPool</code> targets divide-and-conquer work. Each worker thread has its own <strong>double-ended queue</strong>: it pushes and pops subtasks at the head (LIFO — good cache locality), and when it runs dry it <strong>steals</strong> from the <em>tail</em> of another thread's queue (FIFO — steals the biggest, oldest chunk). This keeps all cores busy with minimal contention.</p>
<pre><code>class SumTask extends RecursiveTask&lt;Long&gt; {
    private static final int THRESHOLD = 10_000;
    private final int[] a; private final int lo, hi;

    protected Long compute() {
        if (hi - lo &lt;= THRESHOLD) {              // small enough: do it directly
            long s = 0; for (int i = lo; i &lt; hi; i++) s += a[i]; return s;
        }
        int mid = (lo + hi) &gt;&gt;&gt; 1;
        SumTask left = new SumTask(a, lo, mid);
        left.fork();                              // async
        long right = new SumTask(a, mid, hi).compute();  // do half yourself
        return right + left.join();
    }
}</code></pre>
<p>Parallel streams use the <strong>common</strong> ForkJoinPool, sized <code>cores - 1</code> and shared JVM-wide. Blocking inside a parallel stream therefore starves every other parallel stream and every default <code>CompletableFuture</code> in the process — the single most common production misuse.</p>`
},
{
  q: "How do you handle exceptions in threads and executors?",
  level: "advanced", tags: ["executors", "production"],
  a: `<p>An exception escaping <code>run()</code> kills that thread silently — no stack trace unless you catch it. The behaviour differs by submission method, which is the trap:</p>
<ul>
<li><code>execute(Runnable)</code> → the exception reaches the thread's <code>UncaughtExceptionHandler</code> and gets printed.</li>
<li><code>submit(...)</code> → the exception is <strong>captured in the Future and swallowed</strong>. If nobody calls <code>get()</code>, you never learn it happened. This silently loses errors in production.</li>
</ul>
<pre><code>// 1. Global safety net
Thread.setDefaultUncaughtExceptionHandler((t, e) -&gt; log.error("Uncaught in {}", t.getName(), e));

// 2. Named threads + handler via a factory (use Spring's or Guava's builder)
ThreadFactory tf = r -&gt; {
    Thread t = new Thread(r, "billing-worker");
    t.setUncaughtExceptionHandler((th, e) -&gt; log.error("worker died", e));
    return t;
};

// 3. Best: never let it escape the task
executor.submit(() -&gt; {
    try { doWork(); }
    catch (Exception e) { log.error("task failed for {}", id, e); metrics.increment("task.failed"); }
});

// 4. With CompletableFuture
future.exceptionally(ex -&gt; { log.error("async failed", ex); return fallback; });</code></pre>
<p>Also handle <code>InterruptedException</code> correctly: either propagate it, or restore the flag with <code>Thread.currentThread().interrupt()</code>. Swallowing it breaks cancellation and graceful shutdown everywhere up the stack.</p>`
},
{
  q: "What is the difference between concurrency and parallelism?",
  level: "beginner", tags: ["fundamentals"],
  a: `<ul>
<li><strong>Concurrency</strong> — dealing with many things at once (structure). Tasks make progress in overlapping time periods; a single core can be concurrent by interleaving.</li>
<li><strong>Parallelism</strong> — doing many things at once (execution). Requires multiple cores.</li>
</ul>
<p>Rob Pike's line is the one to use: <em>"Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once."</em></p>
<p>Practical consequence: a web server handling 10,000 connections on 8 cores is highly concurrent and barely parallel. Optimising it means reducing blocking (async I/O, virtual threads), not adding cores.</p>`
},
{
  q: "How do you stop a thread gracefully? Why is stop() deprecated?",
  level: "advanced", tags: ["lifecycle", "production"],
  a: `<p><code>Thread.stop()</code> was deprecated (and removed in Java 20) because it throws <code>ThreadDeath</code> at an arbitrary bytecode, releasing all locks instantly and leaving shared objects in a <strong>corrupted, half-updated state</strong> — unrecoverable and undetectable.</p>
<p><strong>The correct mechanism is cooperative interruption:</strong></p>
<pre><code>class Worker implements Runnable {
    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                Task t = queue.take();       // throws InterruptedException, CLEARS the flag
                process(t);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();   // restore the flag
                break;                                // then exit
            }
        }
        cleanup();
    }
}
thread.interrupt();   // request, not command</code></pre>
<p>Interruption is only a <em>request</em>: it sets a flag, and blocking methods (<code>sleep</code>, <code>wait</code>, <code>take</code>, <code>join</code>) respond by throwing <code>InterruptedException</code>. Code that never checks the flag or never blocks will not stop — so long CPU loops must poll <code>isInterrupted()</code> themselves. Note that <code>InputStream.read()</code> on a socket is <em>not</em> interruptible; close the socket instead.</p>
<p>For executors: <code>shutdown()</code> stops accepting work and drains the queue; <code>shutdownNow()</code> interrupts running tasks and returns the pending ones.</p>`
},
{
  q: "Explain the producer-consumer problem and implement it three ways",
  level: "advanced", tags: ["patterns"],
  a: `<pre><code>// 1. BlockingQueue — always the right answer in real code
BlockingQueue&lt;Order&gt; q = new ArrayBlockingQueue&lt;&gt;(100);
// producer
q.put(order);          // blocks when full = backpressure
// consumer
Order o = q.take();    // blocks when empty

// 2. wait/notify — what they ask you to write on the whiteboard
class Buffer&lt;T&gt; {
    private final Queue&lt;T&gt; q = new LinkedList&lt;&gt;();
    private final int cap;

    public synchronized void put(T item) throws InterruptedException {
        while (q.size() == cap) wait();
        q.add(item);
        notifyAll();
    }
    public synchronized T take() throws InterruptedException {
        while (q.isEmpty()) wait();
        T item = q.poll();
        notifyAll();
        return item;
    }
}

// 3. Lock + Conditions — the precise version, no lost wakeups
private final ReentrantLock lock = new ReentrantLock();
private final Condition notFull = lock.newCondition(), notEmpty = lock.newCondition();
// put: while(full) notFull.await(); ... notEmpty.signal();
// take: while(empty) notEmpty.await(); ... notFull.signal();</code></pre>
<p>Version 3 is strictly better than 2 because <code>signal()</code> on a specific condition wakes only the threads that can actually proceed, avoiding the thundering herd of <code>notifyAll()</code>.</p>`
},
{
  q: "You see high CPU in production on a Java service. How do you find the cause?",
  level: "advanced", hot: true, tags: ["production", "debugging"],
  a: `<ol>
<li><strong>Confirm it is the JVM:</strong> <code>top</code> → note the PID.</li>
<li><strong>Find the hot thread:</strong> <code>top -H -p &lt;pid&gt;</code> gives per-thread CPU. Take the offending TID and convert to hex: <code>printf '%x\\n' &lt;tid&gt;</code>.</li>
<li><strong>Take a thread dump:</strong> <code>jstack &lt;pid&gt; &gt; dump.txt</code> (three dumps, ten seconds apart, so you can see what is <em>stuck</em> versus <em>churning</em>). Search the hex TID as <code>nid=0x...</code> and read that stack.</li>
<li><strong>Interpret the pattern:</strong>
  <ul>
  <li>GC threads hot → memory problem, not CPU. Check <code>jstat -gcutil &lt;pid&gt; 1000</code>; a full GC loop pegs all cores.</li>
  <li>Your business thread in a tight loop → infinite loop or an O(n²) algorithm on grown data.</li>
  <li>Many threads in <code>BLOCKED</code> on the same monitor → lock contention.</li>
  <li>Regex in the stack → catastrophic backtracking (ReDoS).</li>
  </ul>
</li>
<li><strong>Profile properly:</strong> async-profiler or JFR (<code>jcmd &lt;pid&gt; JFR.start duration=60s filename=r.jfr</code>) gives a flame graph that names the method in seconds.</li>
<li><strong>Correlate with a deploy or traffic change</strong> — Micrometer/Prometheus timelines usually point straight at the release.</li>
</ol>
<blockquote><p>Give this as a <em>procedure</em>, not a guess. Interviewers score the systematic approach far more than the eventual root cause.</p></blockquote>`
}
]);
