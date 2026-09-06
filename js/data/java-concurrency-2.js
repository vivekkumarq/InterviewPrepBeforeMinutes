appendTopic("java-concurrency", [
{
  q: "What is thread starvation, livelock and priority inversion?",
  level: "advanced", tags: ["deadlock", "theory"],
  a: `<ul>
<li><strong>Starvation</strong> — a thread never gets the CPU or a lock it needs, because others keep winning. Causes: unfair locks where a barging thread repeatedly beats queued waiters, a thread pool saturated by long tasks, or low-priority threads on a busy system.</li>
<li><strong>Livelock</strong> — threads are <em>active</em> but make no progress, because each keeps reacting to the other. The classic analogy is two people stepping aside in the same direction repeatedly. In code it appears when both threads detect a conflict, both back off, and both retry in lockstep.</li>
<li><strong>Priority inversion</strong> — a high-priority thread waits on a lock held by a low-priority thread that never gets scheduled, often because a medium-priority thread is hogging the CPU. It famously nearly ended the Mars Pathfinder mission.</li>
</ul>
<pre><code>// Livelock: both threads keep releasing and retrying in sync
while (!done) {
    if (lock1.tryLock()) {
        if (lock2.tryLock()) { work(); done = true; }
        else { lock1.unlock(); }        // both back off at the same instant, forever
    }
}
// Fix: randomised backoff breaks the symmetry
Thread.sleep(ThreadLocalRandom.current().nextInt(50));</code></pre>
<p><strong>Fixes to name:</strong> fair locks (<code>new ReentrantLock(true)</code>) prevent starvation at a throughput cost; <strong>randomised exponential backoff</strong> breaks livelock; bounded queues plus separate pools per workload class stop one task type starving another; and never rely on <code>Thread.setPriority</code>, which the JVM maps to OS priorities inconsistently across platforms.</p>`
},
{
  q: "What is false sharing and how does it hurt performance?",
  level: "advanced", tags: ["performance", "internals"],
  a: `<p>CPUs move memory in <strong>cache lines</strong> of 64 bytes, not individual variables. If two threads on different cores write to <em>different</em> variables that happen to sit in the same cache line, every write invalidates the other core's copy. The variables are independent, but the hardware forces them to ping-pong — "false" sharing.</p>
<pre><code>// Two counters, adjacent in memory -> almost certainly the same cache line
class Counters {
    volatile long a;   // thread 1 writes this
    volatile long b;   // thread 2 writes this  -> constant cache invalidation
}

// Fix 1: padding, so each field owns a line
class Padded {
    volatile long a;
    long p1, p2, p3, p4, p5, p6, p7;   // 56 bytes of padding
    volatile long b;
}

// Fix 2: @Contended (JDK internal; needs -XX:-RestrictContended)
@jdk.internal.vm.annotation.Contended
volatile long counter;</code></pre>
<p><strong>Where it matters in practice:</strong> this is precisely why <code>LongAdder</code> exists. Instead of one contended counter, it keeps an array of <code>Cell</code>s — each padded with <code>@Contended</code> — so different threads increment different cache lines and only <code>sum()</code> combines them. Under high write contention it dramatically outperforms <code>AtomicLong</code>.</p>
<pre><code>// Prefer this for hot metrics counters
LongAdder requests = new LongAdder();
requests.increment();      // striped, no shared cache line
long total = requests.sum();  // slightly stale but cheap</code></pre>
<p><strong>The honest framing:</strong> false sharing is a real effect but rarely your first problem. Mention it as something you would look for with a profiler when a supposedly parallel workload does not scale with cores — not something to pad for pre-emptively.</p>`
},
{
  q: "How do you implement a custom thread pool sizing strategy?",
  level: "advanced", hot: true, tags: ["executors", "production"],
  a: `<p>The starting formula is Little's Law applied to threads:</p>
<pre><code>threads = cores × targetUtilisation × (1 + waitTime / computeTime)

CPU-bound   (wait ≈ 0)          -> cores + 1
I/O-bound   (wait 100ms, cpu 5ms) -> cores × (1 + 20) = 21 × cores</code></pre>
<pre><code>@Bean("orderExecutor")
public ThreadPoolTaskExecutor orderExecutor(MeterRegistry registry) {
    int cores = Runtime.getRuntime().availableProcessors();
    var ex = new ThreadPoolTaskExecutor();
    ex.setCorePoolSize(cores * 2);
    ex.setMaxPoolSize(cores * 4);
    ex.setQueueCapacity(500);                         // BOUNDED — always
    ex.setThreadNamePrefix("order-");                 // shows up in thread dumps
    ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    ex.setWaitForTasksToCompleteOnShutdown(true);
    ex.setAwaitTerminationSeconds(30);
    ex.initialize();
    ExecutorServiceMetrics.monitor(registry, ex.getThreadPoolExecutor(), "order-pool");
    return ex;
}</code></pre>
<p><strong>Rejection policies and what they mean operationally:</strong></p>
<ul>
<li><code>AbortPolicy</code> (default) — throws <code>RejectedExecutionException</code>. Fail fast and visible.</li>
<li><code>CallerRunsPolicy</code> — the submitting thread runs the task, which naturally slows producers. <strong>The best default for backpressure.</strong></li>
<li><code>DiscardPolicy</code> / <code>DiscardOldestPolicy</code> — silently drop work. Only acceptable for genuinely optional tasks like metrics.</li>
</ul>
<p><strong>What to say beyond the formula:</strong> the formula gives a starting point; the real answer comes from measuring queue depth, task latency and rejection count under load. Separate pools per workload class (fast API calls vs slow reports) so one cannot starve the other — that is the bulkhead pattern. And on Java 21, for I/O-bound work, virtual threads remove most of this tuning entirely.</p>`
},
{
  q: "What is the difference between synchronized and ReentrantReadWriteLock and StampedLock?",
  level: "advanced", tags: ["locks"],
  a: `<pre><code>// ReentrantReadWriteLock — many concurrent readers, one exclusive writer
private final ReadWriteLock rw = new ReentrantReadWriteLock();

public Config read() {
    rw.readLock().lock();
    try { return config; } finally { rw.readLock().unlock(); }
}
public void write(Config c) {
    rw.writeLock().lock();
    try { config = c; } finally { rw.writeLock().unlock(); }
}

// StampedLock (Java 8) — adds OPTIMISTIC reading: no lock at all on the happy path
private final StampedLock sl = new StampedLock();

public double distanceFromOrigin() {
    long stamp = sl.tryOptimisticRead();     // no lock acquired
    double cx = x, cy = y;                    // read the fields
    if (!sl.validate(stamp)) {                // did a writer intervene?
        stamp = sl.readLock();                // fall back to a real read lock
        try { cx = x; cy = y; } finally { sl.unlockRead(stamp); }
    }
    return Math.sqrt(cx * cx + cy * cy);
}</code></pre>
<table>
<tr><th></th><th><code>synchronized</code></th><th><code>ReadWriteLock</code></th><th><code>StampedLock</code></th></tr>
<tr><td>Concurrent reads</td><td>No</td><td>Yes</td><td>Yes, plus lock-free optimistic</td></tr>
<tr><td>Reentrant</td><td>Yes</td><td>Yes</td><td><strong>No</strong></td></tr>
<tr><td>Condition support</td><td>wait/notify</td><td>Yes</td><td>No</td></tr>
<tr><td>Complexity</td><td>Lowest</td><td>Medium</td><td>Highest — easy to misuse</td></tr>
</table>
<p><strong>When each pays off:</strong> <code>ReadWriteLock</code> only wins when reads greatly outnumber writes <em>and</em> the critical section is long enough to amortise its higher overhead — for a short read it is slower than plain <code>synchronized</code>. <code>StampedLock</code> is faster still but is not reentrant, does not support conditions, and pins virtual threads, so it belongs in carefully measured hot paths only.</p>
<p><strong>The pragmatic default:</strong> an immutable object published through a <code>volatile</code> reference beats all three — readers need no lock whatsoever, and a "write" is a single reference assignment.</p>`
},
{
  q: "How do you write a correct producer-consumer with graceful shutdown?",
  level: "advanced", tags: ["patterns", "production"],
  a: `<pre><code>public class Pipeline implements AutoCloseable {
    private static final Task POISON = new Task("__STOP__");

    private final BlockingQueue&lt;Task&gt; queue = new ArrayBlockingQueue&lt;&gt;(1000);
    private final ExecutorService workers;
    private final int workerCount;
    private volatile boolean accepting = true;

    public Pipeline(int workerCount) {
        this.workerCount = workerCount;
        this.workers = Executors.newFixedThreadPool(workerCount,
                r -&gt; { var t = new Thread(r, "pipeline-worker"); t.setDaemon(false); return t; });
        for (int i = 0; i &lt; workerCount; i++) workers.submit(this::consume);
    }

    public boolean submit(Task t) throws InterruptedException {
        if (!accepting) throw new IllegalStateException("shutting down");
        return queue.offer(t, 200, TimeUnit.MILLISECONDS);   // bounded wait = backpressure
    }

    private void consume() {
        try {
            while (true) {
                Task t = queue.take();
                if (t == POISON) { queue.put(POISON); return; }   // pass it on, then exit
                try { process(t); }
                catch (Exception e) { log.error("task {} failed", t.id(), e); }  // never die
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();               // restore the flag
        }
    }

    @Override public void close() throws InterruptedException {
        accepting = false;
        queue.put(POISON);                                    // drains remaining work first
        workers.shutdown();
        if (!workers.awaitTermination(30, TimeUnit.SECONDS)) workers.shutdownNow();
    }
}</code></pre>
<p><strong>The details that make this correct:</strong> a <em>bounded</em> queue so a slow consumer applies backpressure instead of causing an OOM; a <strong>poison pill</strong> that each worker re-inserts so all of them stop after draining, rather than <code>shutdownNow()</code> discarding queued work; per-task exception handling so one bad message does not kill a worker permanently; restoring the interrupt flag; and a shutdown that waits before escalating.</p>
<p>In Spring, the same shape is a <code>ThreadPoolTaskExecutor</code> with <code>setWaitForTasksToCompleteOnShutdown(true)</code>, tied to context close — worth mentioning so you are not seen as reinventing infrastructure.</p>`
},
{
  q: "What are the common concurrency bugs and how do you find them?",
  level: "advanced", hot: true, tags: ["debugging", "production"],
  a: `<table>
<tr><th>Bug</th><th>Symptom</th><th>How to find it</th></tr>
<tr><td>Race condition (check-then-act)</td><td>Occasional wrong values, duplicates</td><td>Code review of compound operations; stress tests</td></tr>
<tr><td>Visibility (missing <code>volatile</code>)</td><td>Loop never exits; stale reads; works in debug, fails in prod</td><td>Look for shared non-volatile mutable flags</td></tr>
<tr><td>Deadlock</td><td>Requests hang, threads pile up</td><td><code>jstack</code> — it explicitly reports "Found one Java-level deadlock"</td></tr>
<tr><td>Lock contention</td><td>High latency, low CPU</td><td>Many threads <code>BLOCKED</code> on one monitor in a thread dump; JFR lock events</td></tr>
<tr><td>ThreadLocal leak</td><td>Memory grows, wrong tenant/user data</td><td>Heap dump; look for pool threads retaining values</td></tr>
<tr><td>Non-thread-safe object in a singleton</td><td>Corrupt output under load</td><td><code>SimpleDateFormat</code>, <code>StringBuilder</code>, <code>Matcher</code> as instance fields of a bean</td></tr>
<tr><td>Unbounded queue</td><td><code>OutOfMemoryError</code> under load</td><td>Heap dump shows a huge queue; review executor construction</td></tr>
</table>
<p><strong>The classic Spring bug worth calling out:</strong> a <code>@Service</code> is a singleton shared by every request thread. An instance field holding request state — or a <code>SimpleDateFormat</code> — is a data race that only appears under concurrent load, which is why it passes every test and fails in production.</p>
<pre><code>@Service
public class ReportService {
    private final SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd");  // ✘ NOT thread-safe
    private final DateTimeFormatter fmt = DateTimeFormatter.ISO_DATE;          // ✔ immutable
}</code></pre>
<p><strong>Tools:</strong> <code>jstack</code>/<code>jcmd Thread.print</code> for deadlocks and contention, JFR for lock and allocation profiling, and for tests, <strong>jcstress</strong> for JMM-level verification or a simple <code>CountDownLatch</code> to fire N threads simultaneously and assert the invariant afterwards.</p>`
},
{
  q: "How do you test concurrent code?",
  level: "advanced", tags: ["testing", "concurrency"],
  a: `<pre><code>@Test
void counterIsAtomicUnderContention() throws Exception {
    var counter = new Counter();
    int threads = 16, perThread = 10_000;

    var start = new CountDownLatch(1);         // fire all threads at the same instant
    var done  = new CountDownLatch(threads);
    var pool  = Executors.newFixedThreadPool(threads);
    var errors = new ConcurrentLinkedQueue&lt;Throwable&gt;();

    for (int i = 0; i &lt; threads; i++) {
        pool.submit(() -&gt; {
            try {
                start.await();                  // maximise the overlap
                for (int j = 0; j &lt; perThread; j++) counter.increment();
            } catch (Throwable t) { errors.add(t); }
            finally { done.countDown(); }
        });
    }
    start.countDown();
    assertThat(done.await(10, SECONDS)).isTrue();
    pool.shutdownNow();

    assertThat(errors).isEmpty();
    assertThat(counter.get()).isEqualTo(threads * perThread);   // fails if not atomic
}</code></pre>
<p><strong>Techniques that matter:</strong></p>
<ul>
<li><strong><code>CountDownLatch</code> as a starting gun</strong> — without it, threads start staggered and rarely collide, so the test passes even on broken code.</li>
<li><strong>Collect exceptions from worker threads</strong> — an assertion failure inside a pool thread does not fail the test otherwise.</li>
<li><strong>Repeat</strong> (<code>@RepeatedTest(50)</code>) — races are probabilistic; a single run proves little.</li>
<li><strong>Always use a timeout</strong> on <code>await</code> so a deadlock fails the build instead of hanging CI forever.</li>
<li><strong>Never use <code>Thread.sleep</code></strong> to coordinate — use latches, <code>Phaser</code>, or Awaitility.</li>
</ul>
<p><strong>Be honest about the limits:</strong> passing tests do not prove thread safety — they only prove the bug did not surface in that run, on that machine. For genuinely critical lock-free code, mention <strong>jcstress</strong>, which systematically explores JMM interleavings, and that the stronger guarantee comes from design (immutability, confinement) rather than testing.</p>`
},
{
  q: "What is a memory barrier and what do acquire/release semantics mean?",
  level: "advanced", tags: ["jmm", "internals"],
  a: `<p>Compilers and CPUs reorder instructions freely as long as single-threaded behaviour is preserved. A <strong>memory barrier</strong> (fence) is an instruction that forbids specific reorderings across it, and forces caches to become coherent.</p>
<ul>
<li><strong>Acquire</strong> semantics (a volatile <em>read</em>, or acquiring a lock) — no read or write after it may move <em>before</em> it. You "acquire" the visibility of everything the releasing thread did.</li>
<li><strong>Release</strong> semantics (a volatile <em>write</em>, or releasing a lock) — no read or write before it may move <em>after</em> it. You "publish" everything you did.</li>
</ul>
<pre><code>// Thread A
data = computeExpensiveResult();   // ordinary write
ready = true;                       // VOLATILE write = release fence

// Thread B
if (ready) {                        // VOLATILE read = acquire fence
    use(data);                      // guaranteed to see the computed value
}
// Without volatile on 'ready', thread B may see ready == true but stale 'data',
// because the two writes can be reordered or cached independently.</code></pre>
<p><strong>Why this is the mechanism behind everything else:</strong> the happens-before rules in the JMM are the abstract contract; barriers are how the JVM implements them on a given CPU. A <code>synchronized</code> block is an acquire on entry and a release on exit — which is exactly why it provides visibility as well as mutual exclusion.</p>
<p><strong>Modern API:</strong> <code>VarHandle</code> (Java 9+) exposes these explicitly — <code>getAcquire</code>, <code>setRelease</code>, <code>getVolatile</code>, <code>compareAndSet</code>, <code>fullFence()</code> — letting you request the weakest ordering that is still correct, which is faster than full volatile semantics. It replaced the unsafe internal <code>Unsafe</code> API for this purpose.</p>`
},
{
  q: "What is the difference between Executor, ExecutorService and ScheduledExecutorService?",
  level: "beginner", tags: ["executors"],
  a: `<pre><code>// Executor — the minimal contract: "run this"
public interface Executor { void execute(Runnable command); }

// ExecutorService — adds lifecycle and result tracking
Future&lt;T&gt; submit(Callable&lt;T&gt;);
List&lt;Future&lt;T&gt;&gt; invokeAll(Collection&lt;Callable&lt;T&gt;&gt;);   // waits for ALL
T invokeAny(Collection&lt;Callable&lt;T&gt;&gt;);                   // first success wins
void shutdown();                    // no new tasks, finish queued ones
List&lt;Runnable&gt; shutdownNow();       // interrupt running, return queued
boolean awaitTermination(long, TimeUnit);

// ScheduledExecutorService — adds time-based scheduling
schedule(task, 5, SECONDS);                                 // once, after a delay
scheduleAtFixedRate(task, 0, 10, SECONDS);                  // every 10s from START times
scheduleWithFixedDelay(task, 0, 10, SECONDS);               // 10s AFTER each finishes</code></pre>
<p><strong>The distinction that gets asked:</strong> <code>scheduleAtFixedRate</code> measures from each start, so if a run takes longer than the period, executions queue up and run back to back. <code>scheduleWithFixedDelay</code> always leaves the full gap between the end of one run and the start of the next. For anything that talks to a database or an API, <strong>fixed delay is almost always what you want</strong> — fixed rate turns a slow downstream into a pile-up.</p>
<p><strong>The trap:</strong> if a task submitted to a <code>ScheduledExecutorService</code> throws an uncaught exception, <strong>all future executions are silently cancelled</strong>. Wrap the body in try/catch or the job simply stops running one night and nobody notices.</p>
<pre><code>scheduler.scheduleWithFixedDelay(() -&gt; {
    try { syncOrders(); }
    catch (Exception e) { log.error("sync failed", e); }   // MUST catch, or scheduling dies
}, 0, 30, SECONDS);</code></pre>
<p>The canonical shutdown sequence is: <code>shutdown()</code> → <code>awaitTermination(timeout)</code> → <code>shutdownNow()</code> → await again.</p>`
},
{
  q: "Explain the double-checked locking pattern and why it needs volatile",
  level: "advanced", hot: true, tags: ["patterns", "jmm"],
  a: `<pre><code>public class Singleton {
    private static volatile Singleton instance;      // volatile is MANDATORY

    public static Singleton getInstance() {
        if (instance == null) {                       // 1st check — no lock, fast path
            synchronized (Singleton.class) {
                if (instance == null) {               // 2nd check — under the lock
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}</code></pre>
<p><strong>Why the second check exists:</strong> two threads can both pass the first check; only one gets the lock, and the other must re-check or it would construct a second instance.</p>
<p><strong>Why <code>volatile</code> is not optional</strong> — this is the real question. <code>instance = new Singleton()</code> is not atomic. It is three steps:</p>
<ol>
<li>Allocate memory.</li>
<li>Run the constructor.</li>
<li>Assign the reference to <code>instance</code>.</li>
</ol>
<p>The JIT is permitted to reorder 2 and 3, because within a single thread the difference is unobservable. Another thread can then see a <strong>non-null reference to a half-constructed object</strong>, pass the first check, and use an object whose fields are still default values. <code>volatile</code> inserts a release barrier that forbids that reordering — and this is exactly why the pattern was broken in Java versions before the JMM was fixed in Java 5.</p>
<p><strong>What to actually use:</strong> the initialization-on-demand holder idiom is simpler, lazy, and needs no synchronisation at all, because the JVM guarantees class initialisation is thread-safe:</p>
<pre><code>private static class Holder { static final Singleton INSTANCE = new Singleton(); }
public static Singleton getInstance() { return Holder.INSTANCE; }</code></pre>
<p>And in a Spring application, just declare a <code>@Component</code> — the container's singleton is testable and mockable, unlike a static one.</p>`
},
{
  q: "How do virtual threads change how you write concurrent code?",
  level: "advanced", hot: true, tags: ["loom", "modern-java"],
  a: `<p>Virtual threads (Java 21) invert two decades of advice, so being specific about <em>what changes</em> is what scores.</p>
<table>
<tr><th>Platform threads (before)</th><th>Virtual threads (now)</th></tr>
<tr><td>Threads are scarce — pool and reuse them</td><td>Threads are cheap — <strong>one per task</strong>, never pool them</td></tr>
<tr><td>Blocking I/O is expensive; go reactive</td><td>Blocking is fine — the carrier thread is released</td></tr>
<tr><td>Tune core/max pool sizes carefully</td><td>No pool to size</td></tr>
<tr><td>ThreadLocal is cheap (few threads)</td><td>ThreadLocal is costly at millions of threads — use <code>ScopedValue</code></td></tr>
</table>
<pre><code>// Structured concurrency (preview) — the real payoff
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask&lt;Customer&gt; customer = scope.fork(() -&gt; customerClient.fetch(id));
    Subtask&lt;List&lt;Order&gt;&gt; orders = scope.fork(() -&gt; orderClient.fetch(id));

    scope.join().throwIfFailed();          // if either fails, the other is CANCELLED
    return new View(customer.get(), orders.get());
}   // no leaked threads, no orphaned work, errors propagate naturally</code></pre>
<pre><code># Spring Boot 3.2+ — one property makes every request handler a virtual thread
spring.threads.virtual.enabled: true</code></pre>
<p><strong>Caveats to raise unprompted:</strong></p>
<ul>
<li><strong>Pinning</strong> — a virtual thread inside a <code>synchronized</code> block cannot unmount while blocking, so it holds its carrier. Largely resolved in Java 24, but until then prefer <code>ReentrantLock</code> in code that blocks.</li>
<li><strong>They do not help CPU-bound work</strong> — you still have the same number of cores.</li>
<li><strong>Bound your concurrency elsewhere</strong> — infinite threads means you can now overwhelm your database's connection pool or a downstream API. Use a <code>Semaphore</code> for that limit rather than the thread pool.</li>
</ul>`
}
]);
