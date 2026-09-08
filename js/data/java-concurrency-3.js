appendTopic("java-concurrency", [
{
  q: "Print odd and even numbers using two threads alternately",
  level: "advanced", hot: true, tags: ["practice", "locks"],
  companies: ["Amazon", "Flipkart", "Paytm", "Zoho", "Adobe", "Walmart"],
  a: `<p>The classic thread-coordination exercise. The trick is that both threads must <em>wait for their turn</em>, not just synchronise.</p>
<pre><code>public class OddEvenPrinter {
    private final Object lock = new Object();
    private int number = 1;
    private final int max;

    public void printOdd() {
        synchronized (lock) {
            while (number &lt;= max) {
                while (number % 2 == 0) {          // WHILE, not if — spurious wakeups
                    lock.wait();
                }
                if (number &gt; max) break;
                System.out.println("Odd : " + number++);
                lock.notifyAll();                   // wake the even thread
            }
            lock.notifyAll();                       // release anyone still waiting
        }
    }

    public void printEven() {
        synchronized (lock) {
            while (number &lt;= max) {
                while (number % 2 == 1) lock.wait();
                if (number &gt; max) break;
                System.out.println("Even: " + number++);
                lock.notifyAll();
            }
            lock.notifyAll();
        }
    }
}</code></pre>
<pre><code>// Cleaner with explicit Conditions — signal only the thread that can proceed
private final ReentrantLock lock = new ReentrantLock();
private final Condition oddTurn = lock.newCondition();
private final Condition evenTurn = lock.newCondition();

// Simplest of all — a Semaphore per turn, no wait/notify at all
private final Semaphore odd = new Semaphore(1), even = new Semaphore(0);
void printOdd()  { odd.acquire();  print(n++); even.release(); }
void printEven() { even.acquire(); print(n++); odd.release(); }</code></pre>
<p><strong>The three things they are checking:</strong> that you use <code>while</code> rather than <code>if</code> around <code>wait()</code> (spurious wakeups are permitted by the specification); that you call <code>notifyAll()</code> rather than <code>notify()</code> so you cannot wake the wrong waiter and deadlock; and that you handle termination so neither thread blocks forever at the end.</p>
<p><strong>Say the Semaphore version last</strong> — it is the answer a senior engineer gives, because the ping-pong turn-taking is exactly what a binary semaphore pair expresses, with no condition predicate to get wrong.</p>`
},
{
  q: "What is the difference between CountDownLatch and CyclicBarrier with a real use case?",
  level: "advanced", hot: true, tags: ["synchronizers", "concurrency"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "Morgan Stanley", "SAP"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="CountDownLatch versus CyclicBarrier">
  <text class="dg-t" x="150" y="18" text-anchor="middle">CountDownLatch(3)</text>
  <rect class="dg-fill2" x="20" y="30" width="72" height="26" rx="5"/><text class="dg-s" x="56" y="47" text-anchor="middle">worker 1</text>
  <rect class="dg-fill2" x="20" y="62" width="72" height="26" rx="5"/><text class="dg-s" x="56" y="79" text-anchor="middle">worker 2</text>
  <rect class="dg-fill2" x="20" y="94" width="72" height="26" rx="5"/><text class="dg-s" x="56" y="111" text-anchor="middle">worker 3</text>
  <path class="dg-line" d="M96 43 H180 M96 75 H180 M96 107 H180" marker-end="url(#cl1)"/>
  <text class="dg-m" x="140" y="132" text-anchor="middle">countDown()</text>
  <rect class="dg-fill" x="184" y="58" width="96" height="34" rx="7"/><text class="dg-s" x="232" y="79" text-anchor="middle">main await()</text>
  <text class="dg-s" x="150" y="152" text-anchor="middle">one-shot · a DIFFERENT thread waits</text>
  <text class="dg-t" x="460" y="18" text-anchor="middle">CyclicBarrier(3)</text>
  <rect class="dg-fill2" x="330" y="30" width="72" height="26" rx="5"/><text class="dg-s" x="366" y="47" text-anchor="middle">worker 1</text>
  <rect class="dg-fill2" x="330" y="62" width="72" height="26" rx="5"/><text class="dg-s" x="366" y="79" text-anchor="middle">worker 2</text>
  <rect class="dg-fill2" x="330" y="94" width="72" height="26" rx="5"/><text class="dg-s" x="366" y="111" text-anchor="middle">worker 3</text>
  <path class="dg-line" d="M406 43 H470 M406 75 H470 M406 107 H470"/>
  <rect class="dg-fill" x="474" y="30" width="20" height="90" rx="5"/>
  <text class="dg-s" x="484" y="80" text-anchor="middle" transform="rotate(-90 484 80)">barrier</text>
  <path class="dg-line" d="M498 75 H560" marker-end="url(#cl1)"/>
  <text class="dg-s" x="460" y="152" text-anchor="middle">reusable · the SAME threads continue together</text>
  <defs><marker id="cl1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// CountDownLatch — wait for N one-off EVENTS. Cannot be reset.
CountDownLatch ready = new CountDownLatch(3);
for (var service : List.of(db, cache, kafka)) {
    executor.submit(() -&gt; { service.warmUp(); ready.countDown(); });
}
ready.await(30, SECONDS);              // main thread blocks until all three are warm
startAcceptingTraffic();

// CyclicBarrier — N THREADS wait for each other, then all proceed. Reusable.
CyclicBarrier barrier = new CyclicBarrier(3, () -&gt; log.info("phase complete"));
for (int i = 0; i &lt; 3; i++) {
    executor.submit(() -&gt; {
        for (int phase = 0; phase &lt; 10; phase++) {
            computePartition(phase);
            barrier.await();            // nobody starts phase+1 until all finish this one
        }
    });
}</code></pre>
<table>
<tr><th></th><th>CountDownLatch</th><th>CyclicBarrier</th></tr>
<tr><td>Counts</td><td><strong>Events</strong></td><td><strong>Threads</strong></td></tr>
<tr><td>Reusable</td><td>No — one-shot</td><td>Yes — resets automatically</td></tr>
<tr><td>Who waits</td><td>Usually a different thread</td><td>The participating threads themselves</td></tr>
<tr><td>Barrier action</td><td>None</td><td>Optional <code>Runnable</code> per cycle</td></tr>
<tr><td>On failure</td><td>Others unaffected</td><td>Barrier <em>breaks</em> — everyone gets <code>BrokenBarrierException</code></td></tr>
</table>
<p><strong>Real uses:</strong> a latch for application startup readiness or for firing N test threads simultaneously (the "starting gun" in a concurrency test). A barrier for iterative parallel work — simulations, matrix phases, multi-round batch processing — where every worker must finish round <em>k</em> before any starts <em>k+1</em>.</p>
<p><strong>The "broken barrier" behaviour is the detail interviewers probe:</strong> if one thread times out, is interrupted, or throws, the barrier breaks for <em>everyone</em>. That is deliberate — partial progress in a phased computation is usually worse than failing fast.</p>`
},
{
  q: "How do you implement a thread-safe counter — compare four approaches",
  level: "advanced", hot: true, tags: ["atomics", "performance"],
  companies: ["Amazon", "Oracle", "Flipkart", "Walmart", "PayPal", "Adobe"],
  a: `<pre><code>// 1. synchronized — correct, but every increment serialises on one monitor
class SyncCounter {
    private long count;
    public synchronized void increment() { count++; }
    public synchronized long get()       { return count; }
}

// 2. AtomicLong — CAS retry loop, no blocking
class AtomicCounter {
    private final AtomicLong count = new AtomicLong();
    public void increment() { count.incrementAndGet(); }   // lock-free
    public long get()       { return count.get(); }
}

// 3. LongAdder — striped cells, the RIGHT answer under high contention
class AdderCounter {
    private final LongAdder count = new LongAdder();
    public void increment() { count.increment(); }
    public long get()       { return count.sum(); }        // slightly stale, very cheap
}

// 4. volatile alone — WRONG. Visibility without atomicity.
class BrokenCounter {
    private volatile long count;
    public void increment() { count++; }   // read-modify-write: still a race
}</code></pre>
<table>
<tr><th></th><th>Low contention</th><th>High contention</th><th>Read cost</th></tr>
<tr><td><code>synchronized</code></td><td>Good</td><td>Poor — threads block and context-switch</td><td>Takes the lock</td></tr>
<tr><td><code>AtomicLong</code></td><td><strong>Best</strong></td><td>Degrades — CAS retries burn CPU</td><td>O(1) exact</td></tr>
<tr><td><code>LongAdder</code></td><td>Slightly more memory</td><td><strong>Best</strong> — different threads hit different cells</td><td>O(cells) sum</td></tr>
</table>
<p><strong>Why <code>LongAdder</code> wins under contention</strong> — and this is the part that impresses: <code>AtomicLong</code> keeps one memory location, so every thread's CAS invalidates the same cache line on every other core (false sharing). <code>LongAdder</code> keeps an array of padded <code>Cell</code>s, so threads increment <em>different</em> cache lines with no interference, and <code>sum()</code> adds them up on read.</p>
<p><strong>The rule to state:</strong> use <code>LongAdder</code> when you write far more often than you read — metrics, request counters, hit counts. Use <code>AtomicLong</code> when you need an exact value on every read, or a <code>compareAndSet</code>. Never use <code>volatile</code> for a counter: it guarantees visibility, not atomicity, and <code>count++</code> is three operations.</p>`
},
{
  q: "What is the difference between submit() and execute() in an ExecutorService?",
  level: "advanced", hot: true, tags: ["executors", "production"],
  companies: ["Amazon", "Infosys", "TCS", "Oracle", "Optum", "Barclays"],
  a: `<pre><code>executor.execute(Runnable);              // void, from the Executor interface
Future&lt;?&gt; f = executor.submit(Runnable); // returns a Future
Future&lt;T&gt; f = executor.submit(Callable); // returns a Future carrying a result</code></pre>
<p><strong>The difference that actually matters is exception handling</strong>, and it silently loses errors in production:</p>
<pre><code>// execute() — the exception reaches the thread's UncaughtExceptionHandler
executor.execute(() -&gt; { throw new RuntimeException("boom"); });
// Console shows: Exception in thread "pool-1-thread-1" java.lang.RuntimeException: boom

// submit() — the exception is CAPTURED IN THE FUTURE AND SWALLOWED
executor.submit(() -&gt; { throw new RuntimeException("boom"); });
// Nothing printed. No log. No alert. The task simply did not do its job.

Future&lt;?&gt; f = executor.submit(task);
f.get();   // ONLY here does it surface, wrapped in ExecutionException</code></pre>
<p>Teams lose scheduled work this way for months — a nightly job throws, <code>submit()</code> hides it, and nobody notices until someone asks why a report is missing.</p>
<pre><code>// The fixes
// 1. Never let it escape the task
executor.submit(() -&gt; {
    try { doWork(); }
    catch (Exception e) { log.error("task failed for {}", id, e); metrics.increment("task.failed"); }
});

// 2. Override afterExecute to catch both paths
var pool = new ThreadPoolExecutor(...) {
    @Override protected void afterExecute(Runnable r, Throwable t) {
        super.afterExecute(r, t);
        if (t == null &amp;&amp; r instanceof Future&lt;?&gt; f &amp;&amp; f.isDone()) {
            try { f.get(); } catch (ExecutionException e) { t = e.getCause(); }
              catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
        }
        if (t != null) log.error("task threw", t);
    }
};

// 3. With CompletableFuture
CompletableFuture.runAsync(task, pool)
    .exceptionally(ex -&gt; { log.error("async failed", ex); return null; });</code></pre>
<p><strong>Summary line:</strong> "<code>execute</code> is fire-and-forget with a visible failure; <code>submit</code> gives you a handle but makes failure invisible unless you call <code>get()</code>. In production I always catch inside the task, because relying on someone remembering to inspect a Future is not a strategy."</p>`
},
{
  q: "Explain the producer-consumer problem and solve it with BlockingQueue",
  level: "beginner", hot: true, tags: ["patterns", "queue"],
  companies: ["TCS", "Infosys", "Wipro", "Amazon", "Cognizant", "HCL"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Producer consumer with a bounded blocking queue">
  <rect class="dg-fill2" x="14" y="28" width="94" height="30" rx="6"/><text class="dg-s" x="61" y="48" text-anchor="middle">Producer 1</text>
  <rect class="dg-fill2" x="14" y="68" width="94" height="30" rx="6"/><text class="dg-s" x="61" y="88" text-anchor="middle">Producer 2</text>
  <path class="dg-line" d="M112 43 H190 M112 83 H190" marker-end="url(#pq1)"/>
  <text class="dg-m" x="152" y="34" text-anchor="middle">put()</text>
  <rect class="dg-fill" x="194" y="34" width="200" height="58" rx="8"/>
  <text class="dg-t" x="294" y="56" text-anchor="middle">ArrayBlockingQueue(1000)</text>
  <text class="dg-s" x="294" y="76" text-anchor="middle">full → producer BLOCKS (backpressure)</text>
  <path class="dg-line" d="M398 63 H470" marker-end="url(#pq1)"/>
  <text class="dg-m" x="434" y="54" text-anchor="middle">take()</text>
  <rect class="dg-fill2" x="474" y="28" width="94" height="30" rx="6"/><text class="dg-s" x="521" y="48" text-anchor="middle">Consumer 1</text>
  <rect class="dg-fill2" x="474" y="68" width="94" height="30" rx="6"/><text class="dg-s" x="521" y="88" text-anchor="middle">Consumer 2</text>
  <text class="dg-s" x="300" y="118" text-anchor="middle">empty → consumer BLOCKS</text>
  <defs><marker id="pq1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>public class OrderPipeline {
    private static final Order POISON = new Order("__STOP__");
    private final BlockingQueue&lt;Order&gt; queue = new ArrayBlockingQueue&lt;&gt;(1000);  // BOUNDED

    // Producer
    public void submit(Order order) throws InterruptedException {
        if (!queue.offer(order, 200, MILLISECONDS)) {     // bounded wait, then shed load
            metrics.increment("queue.rejected");
            throw new SystemBusyException();
        }
    }

    // Consumer
    public void consume() {
        try {
            while (true) {
                Order order = queue.take();               // blocks when empty
                if (order == POISON) { queue.put(POISON); return; }   // pass it on, then exit
                try { process(order); }
                catch (Exception e) { log.error("failed {}", order.id(), e); }  // never die
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();            // restore the flag
        }
    }
}</code></pre>
<p><strong>Why <code>BlockingQueue</code> replaces <code>wait</code>/<code>notify</code> entirely:</strong> it handles the blocking, the signalling, and the condition predicate internally, so there is no spurious-wakeup loop to get wrong and no lost-notification deadlock.</p>
<p><strong>The point that separates a production answer: always bound the queue.</strong> <code>LinkedBlockingQueue</code> with no capacity is unbounded, so a slow consumer turns into an <code>OutOfMemoryError</code> instead of visible backpressure. A bounded queue makes the system tell you it is overloaded.</p>
<p><strong>Implementations to name:</strong> <code>ArrayBlockingQueue</code> (bounded, single lock), <code>LinkedBlockingQueue</code> (separate head/tail locks, better throughput), <code>SynchronousQueue</code> (zero capacity — a direct handoff, used by <code>newCachedThreadPool</code>), <code>PriorityBlockingQueue</code>, and <code>DelayQueue</code> for scheduled retries.</p>`
},
{
  q: "What is a ThreadPoolExecutor's rejection policy and when does it trigger?",
  level: "advanced", tags: ["executors", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "PayPal", "Maersk", "Ericsson"],
  a: `<p>Rejection happens only when <strong>the queue is full AND the pool is at maximumPoolSize</strong>. Understanding the submission algorithm is what makes this answerable:</p>
<pre><code>1. threads &lt; corePoolSize        -&gt; create a new thread
2. otherwise                      -&gt; QUEUE the task
3. queue full &amp;&amp; threads &lt; max    -&gt; create a thread up to maximumPoolSize
4. queue full &amp;&amp; threads == max   -&gt; REJECT via the handler</code></pre>
<blockquote><p><strong>The consequence people miss:</strong> with an <strong>unbounded</strong> queue, step 3 is never reached — so <code>maximumPoolSize</code> is silently ignored and rejection never happens. Instead the queue grows until the JVM dies. That is exactly why <code>Executors.newFixedThreadPool</code> can OOM.</p></blockquote>
<table>
<tr><th>Policy</th><th>Behaviour</th><th>Use when</th></tr>
<tr><td><code>AbortPolicy</code> (default)</td><td>Throws <code>RejectedExecutionException</code></td><td>The caller must know and react</td></tr>
<tr><td><strong><code>CallerRunsPolicy</code></strong></td><td>The <em>submitting</em> thread runs the task</td><td><strong>Best default</strong> — natural backpressure, slows producers</td></tr>
<tr><td><code>DiscardPolicy</code></td><td>Silently drops the task</td><td>Only for genuinely optional work (metrics)</td></tr>
<tr><td><code>DiscardOldestPolicy</code></td><td>Drops the oldest queued task</td><td>Latest-value-wins streams</td></tr>
</table>
<pre><code>var executor = new ThreadPoolExecutor(
        8, 16, 60L, SECONDS,
        new ArrayBlockingQueue&lt;&gt;(500),                    // BOUNDED
        new ThreadFactoryBuilder().setNameFormat("order-%d").build(),
        new ThreadPoolExecutor.CallerRunsPolicy());        // backpressure

// Custom: log and record the rejection rather than failing silently
new RejectedExecutionHandler() {
    public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        metrics.increment("pool.rejected");
        log.warn("pool saturated: active={} queue={}", e.getActiveCount(), e.getQueue().size());
        throw new SystemBusyException();
    }
};</code></pre>
<p><strong>Why <code>CallerRunsPolicy</code> is usually right:</strong> it does not drop work and does not throw — it makes the producer do the work itself, which naturally slows the rate of submission until the pool catches up. That is a self-regulating system rather than one that falls over.</p>
<p><strong>What to monitor:</strong> rejection count, queue depth, active thread count and task latency. A rising queue depth is the leading indicator that you are about to start rejecting.</p>`
},
{
  q: "How do you cancel a running task and handle InterruptedException correctly?",
  level: "advanced", hot: true, tags: ["lifecycle", "gotcha"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "SAP", "Nokia"],
  a: `<pre><code>Future&lt;?&gt; future = executor.submit(longTask);
future.cancel(true);      // true  = interrupt the running thread
future.cancel(false);     // false = only prevent it starting if still queued</code></pre>
<p><strong>Interruption is cooperative — it sets a flag, it does not stop anything.</strong> A task that never checks the flag and never blocks will run to completion regardless.</p>
<pre><code>// ✘ WRONG — swallows the interrupt, so cancellation silently fails
try { Thread.sleep(1000); }
catch (InterruptedException e) { log.warn("interrupted"); }   // flag was CLEARED by sleep()

// ✔ RIGHT — either propagate it...
void work() throws InterruptedException {
    Thread.sleep(1000);
}

// ...or restore the flag and stop
try { Thread.sleep(1000); }
catch (InterruptedException e) {
    Thread.currentThread().interrupt();     // RESTORE — callers up the stack can see it
    return;                                  // and actually stop
}

// ✔ A long CPU loop must poll the flag itself — nothing throws for you
while (!Thread.currentThread().isInterrupted()) {
    processChunk();
}</code></pre>
<p><strong>The critical detail:</strong> when a blocking method (<code>sleep</code>, <code>wait</code>, <code>join</code>, <code>take</code>) throws <code>InterruptedException</code>, it <strong>clears the interrupt flag</strong>. So catching and logging destroys the only evidence that cancellation was requested — every layer above you now believes nothing happened. This is why "swallowing InterruptedException" is one of the most-cited Java concurrency bugs.</p>
<p><strong>What is <em>not</em> interruptible:</strong> blocking socket I/O (<code>InputStream.read</code>) and synchronous file I/O do not respond to interruption. To cancel those you must close the socket or channel, which makes the blocked call throw. Worth mentioning — it is the reason a "cancel" button sometimes appears to do nothing.</p>
<p><strong>For executors:</strong> <code>shutdown()</code> stops accepting work and drains the queue; <code>shutdownNow()</code> interrupts running tasks and returns the pending ones. The correct sequence is <code>shutdown()</code> → <code>awaitTermination(timeout)</code> → <code>shutdownNow()</code>.</p>`
},
{
  q: "What is the difference between a synchronized method and a synchronized block on different objects?",
  level: "beginner", hot: true, tags: ["locks", "gotcha"],
  companies: ["TCS", "Infosys", "Capgemini", "Accenture", "IBM", "Mindtree"],
  a: `<pre><code>class Account {
    private int balance;
    private final List&lt;String&gt; log = new ArrayList&lt;&gt;();
    private final Object balanceLock = new Object();
    private final Object logLock = new Object();

    // Locks 'this' — blocks EVERY other synchronized instance method
    public synchronized void deposit(int amount) { balance += amount; }

    // Locks Account.class — independent of 'this'
    public static synchronized void resetStats() { }

    // Narrow, independent locks — deposit and audit can run CONCURRENTLY
    public void depositFine(int amount) {
        expensiveValidation(amount);                 // outside the lock
        synchronized (balanceLock) { balance += amount; }
    }
    public void audit(String entry) {
        synchronized (logLock) { log.add(entry); }
    }
}</code></pre>
<table>
<tr><th>Form</th><th>Lock acquired</th><th>Blocks</th></tr>
<tr><td><code>synchronized</code> instance method</td><td><code>this</code></td><td>All other synchronized instance methods on that object</td></tr>
<tr><td><code>synchronized</code> static method</td><td>The <code>Class</code> object</td><td>All other synchronized static methods</td></tr>
<tr><td><code>synchronized(obj)</code> block</td><td><code>obj</code></td><td>Only code synchronising on that same object</td></tr>
</table>
<p><strong>Two independent facts that surprise people:</strong> an instance lock and a class lock are <em>completely separate</em>, so a static synchronized method does not block an instance one. And two different <code>Account</code> objects have different monitors, so they never block each other.</p>
<p><strong>Why a private lock object beats <code>synchronized</code> on <code>this</code>:</strong> when you lock on <code>this</code>, any external code holding a reference can do <code>synchronized(account) { ... }</code> and block your methods — or deadlock you. A private final lock is unreachable from outside, so the locking protocol stays under your control.</p>
<p><strong>Never synchronise on:</strong> a <code>String</code> literal or a boxed <code>Integer</code> (interned and shared JVM-wide, so unrelated classes collide), a non-final field (the reference can change, and threads then lock different objects), or an object you expose publicly.</p>`
},
{
  q: "Explain how CompletableFuture handles exceptions and timeouts in a service call chain",
  level: "advanced", hot: true, tags: ["async", "resilience"],
  companies: ["Amazon", "Flipkart", "Walmart", "PayPal", "Adobe", "Netcracker"],
  a: `<pre><code>CompletableFuture&lt;CustomerView&gt; view =
    CompletableFuture.supplyAsync(() -&gt; customerClient.fetch(id), ioPool)
        .thenApply(Customer::enrich)                              // sync transform
        .thenCompose(c -&gt;                                          // flatMap another future
            CompletableFuture.supplyAsync(() -&gt; orderClient.byCustomer(c.id()), ioPool)
                             .thenApply(c::withOrders))
        .orTimeout(3, SECONDS)                                     // Java 9+: fails on timeout
        .handle((result, ex) -&gt; {                                  // sees BOTH outcomes
            if (ex != null) {
                log.warn("degraded view for {}", id, ex);
                return CustomerView.partial(id);                   // graceful degradation
            }
            return result;
        });</code></pre>
<table>
<tr><th>Method</th><th>Sees</th><th>Can change the result</th></tr>
<tr><td><code>exceptionally</code></td><td>Only the exception</td><td>Yes — recover with a fallback</td></tr>
<tr><td><code>handle</code></td><td><strong>Both</strong> value and exception</td><td>Yes</td></tr>
<tr><td><code>whenComplete</code></td><td>Both</td><td><strong>No</strong> — side effect only, exception propagates</td></tr>
</table>
<pre><code>// Timeouts
future.orTimeout(2, SECONDS);                        // completes exceptionally
future.completeOnTimeout(fallback, 2, SECONDS);      // completes with a default

// Fan-out then join
var a = supplyAsync(() -&gt; svcA.call(), pool);
var b = supplyAsync(() -&gt; svcB.call(), pool);
allOf(a, b).thenApply(v -&gt; combine(a.join(), b.join()));</code></pre>
<p><strong>Three production rules to state:</strong></p>
<ol>
<li><strong>Always pass your own executor.</strong> The default is the common ForkJoinPool, sized <code>cores − 1</code> and shared with every parallel stream in the JVM. One blocking call there starves everything.</li>
<li><strong>Always set a timeout.</strong> A future with no timeout can hold a request thread indefinitely when a downstream hangs — which is how one slow dependency takes down a whole service.</li>
<li><strong><code>thenApply</code> vs <code>thenApplyAsync</code></strong> — without <code>Async</code>, the callback may run on the thread that <em>completed</em> the future, which could be a Netty I/O thread you must not block.</li>
</ol>
<p><strong>The exception wrapping detail:</strong> exceptions arrive wrapped in <code>CompletionException</code> (or <code>ExecutionException</code> from <code>get()</code>), so always unwrap with <code>ex.getCause()</code> before inspecting the type — otherwise your <code>instanceof</code> checks silently never match.</p>`
},
{
  q: "What is thread confinement and why is it the simplest concurrency strategy?",
  level: "advanced", tags: ["design", "concurrency"],
  companies: ["ThoughtWorks", "EPAM", "Microsoft", "SAP", "Publicis Sapient"],
  a: `<p><strong>Thread confinement</strong> means data is only ever touched by one thread, so no synchronisation is needed at all. It is the cheapest correct answer, and it is often overlooked in favour of locks.</p>
<pre><code>// 1. STACK CONFINEMENT — local variables are inherently confined
public BigDecimal total(List&lt;Order&gt; orders) {
    BigDecimal sum = BigDecimal.ZERO;        // on this thread's stack; unreachable elsewhere
    List&lt;Order&gt; filtered = new ArrayList&lt;&gt;(); // safe — never escapes this method
    for (Order o : orders) { ... }
    return sum;
}
// The moment a reference ESCAPES (stored in a field, returned, passed to another
// thread) confinement is broken and you must reason about sharing again.

// 2. ThreadLocal — per-thread state, explicitly
private static final ThreadLocal&lt;SimpleDateFormat&gt; FMT =
        ThreadLocal.withInitial(() -&gt; new SimpleDateFormat("yyyy-MM-dd"));  // SDF is unsafe

// 3. Single-threaded executor — confine a whole subsystem to one thread
ExecutorService worker = Executors.newSingleThreadExecutor();
worker.submit(() -&gt; mutableState.update());   // all mutations on ONE thread, no locks</code></pre>
<p><strong>Why this is the strategy to reach for first:</strong> locks are correct but cost throughput, add deadlock risk, and are easy to get subtly wrong. Confinement removes the problem rather than managing it — there is no shared state, so there is nothing to synchronise.</p>
<p><strong>Where it shows up in frameworks you already use:</strong> Swing and JavaFX confine all UI mutation to the event dispatch thread; Netty confines a channel to one event-loop thread; Node.js confines everything to one thread by design. Each avoided an entire class of bug by construction.</p>
<p><strong>The ThreadLocal caveat to raise:</strong> in a thread <em>pool</em>, threads live forever, so a value left in a ThreadLocal leaks and — worse — the next request on that thread sees the previous request's data. Always <code>remove()</code> in a <code>finally</code> block. Java 21's <code>ScopedValue</code> fixes this by being immutable and automatically scoped.</p>
<p><strong>The design ladder to state:</strong> confinement first, then immutability, then atomics, then locks. Reach down the list only when the level above cannot express what you need.</p>`
}
]);
