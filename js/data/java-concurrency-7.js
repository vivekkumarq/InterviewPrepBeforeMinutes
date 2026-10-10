registerPrimer("java-concurrency", `<p class="pr-lead">A <b>thread</b> is a single line of work inside a program. Multithreading means running several threads at the same time, so a server can handle many users at once and your phone app stays responsive while it downloads something. The power comes with one big risk: threads can trip over each other when they touch the same data.</p>
<div class="pr-analogy"><b>Think of it like this</b>Picture several cooks sharing one kitchen. Each cook (a thread) follows their own recipe, but they all share the same fridge and the same counter (the program's memory). If two cooks grab the last egg at the same moment, or both write on the same order slip, things go wrong. Most of concurrency is about agreeing rules for sharing the kitchen.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Thread</dt><dd>One path of execution. Every Java program starts with one, the "main" thread, and can create more.</dd>
<dt>Shared data</dt><dd>Objects that more than one thread can read or change. Every thread has its own local variables, but objects on the heap are shared.</dd>
<dt>Race condition</dt><dd>A bug where the result depends on which thread happens to run first. It may work 99 times and fail on the 100th.</dd>
<dt>Lock / synchronized</dt><dd>A way to say "only one thread at a time may run this part". Others wait their turn.</dd>
<dt>Atomic</dt><dd>An operation that happens all at once, so no other thread can see it half done.</dd>
<dt>volatile</dt><dd>A keyword that makes every thread always see the latest value of a field.</dd>
<dt>Deadlock</dt><dd>Two threads each waiting for something the other holds, so both wait forever.</dd>
<dt>Thread pool</dt><dd>A fixed team of reusable threads that pick up tasks from a queue, instead of creating a new thread for every task.</dd>
</dl>

<h3>Step by step: why count++ is not safe</h3>
<p>Adding one to a number looks like a single step, but the computer actually does three:</p>
<ol class="pr-steps">
<li><b>Read</b> the current value from memory (say 5).</li>
<li><b>Add</b> one to it (6).</li>
<li><b>Write</b> the new value back to memory.</li>
</ol>
<p>Now imagine two threads doing this at the same moment. Thread A reads 5. Before A writes, thread B also reads 5. A writes 6. B writes 6. Two increments happened, but the counter only went up by one. This is called a <b>lost update</b>, and the diagram shows it step by step.</p>
<figure class="fig">
<svg viewBox="0 0 620 226" role="img" aria-label="Two threads interleave read, add and write on a shared counter, losing one update">
  <defs><marker id="pr-con" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <text class="dg-t" x="70" y="22" text-anchor="middle">Thread A</text>
  <text class="dg-t" x="310" y="22" text-anchor="middle">shared count</text>
  <text class="dg-t" x="550" y="22" text-anchor="middle">Thread B</text>
  <line class="dg-line" x1="70" y1="30" x2="70" y2="206" stroke-dasharray="3 4"/>
  <line class="dg-line" x1="550" y1="30" x2="550" y2="206" stroke-dasharray="3 4"/>
  <rect class="dg-box" x="270" y="34" width="80" height="26" rx="6"/><text class="dg-m" x="310" y="52" text-anchor="middle">5</text>
  <rect class="dg-fill" x="20" y="48" width="100" height="26" rx="6"/><text class="dg-m" x="70" y="66" text-anchor="middle">read 5</text>
  <rect class="dg-fill2" x="500" y="78" width="100" height="26" rx="6"/><text class="dg-m" x="550" y="96" text-anchor="middle">read 5</text>
  <rect class="dg-fill" x="20" y="108" width="100" height="26" rx="6"/><text class="dg-m" x="70" y="126" text-anchor="middle">5 + 1 = 6</text>
  <rect class="dg-fill2" x="500" y="108" width="100" height="26" rx="6"/><text class="dg-m" x="550" y="126" text-anchor="middle">5 + 1 = 6</text>
  <rect class="dg-fill" x="20" y="140" width="100" height="26" rx="6"/><text class="dg-m" x="70" y="158" text-anchor="middle">write 6</text>
  <line class="dg-line" x1="120" y1="153" x2="268" y2="153" marker-end="url(#pr-con)"/>
  <rect class="dg-box" x="270" y="140" width="80" height="26" rx="6"/><text class="dg-m" x="310" y="158" text-anchor="middle">6</text>
  <rect class="dg-fill2" x="500" y="172" width="100" height="26" rx="6"/><text class="dg-m" x="550" y="190" text-anchor="middle">write 6</text>
  <line class="dg-line" x1="500" y1="185" x2="352" y2="185" marker-end="url(#pr-con)"/>
  <rect class="dg-box" x="270" y="172" width="80" height="26" rx="6"/><text class="dg-m" x="310" y="190" text-anchor="middle">6</text>
  <text class="dg-s" x="310" y="218" text-anchor="middle">two increments ran, the counter moved by one: a LOST UPDATE</text>
</svg>
<figcaption>count++ is read, add, write. Nothing stops B from reading before A has written.</figcaption>
</figure>
<p>There is also a second, sneakier problem called <b>visibility</b>. To be fast, each CPU core can keep its own copy of a value. One thread may change a value and another thread may keep seeing the old copy for a long time. <code>volatile</code> fixes visibility, but it does <em>not</em> fix the lost update above. A lock (<code>synchronized</code>) or an atomic class fixes both.</p>

<h3>A worked example: one counter, fixed three ways</h3>
<pre><code>// BROKEN: two threads calling inc() at once will lose updates
class Counter {
    private int count;
    void inc() { count++; }
}

// FIX 1: synchronized - only one thread at a time can run inc()
class SyncCounter {
    private int count;
    synchronized void inc() { count++; }
    synchronized int get() { return count; }
}

// FIX 2: AtomicInteger - the read, add and write happen as one step
class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger();
    void inc() { count.incrementAndGet(); }
    int get() { return count.get(); }
}

// FIX 3: LongAdder - best when many threads increment very often
class HotCounter {
    private final LongAdder count = new LongAdder();
    void inc() { count.increment(); }
    long get() { return count.sum(); }
}</code></pre>
<ol class="pr-steps">
<li>If two threads each call the broken <code>inc()</code> 100,000 times, you usually get a number well under 200,000, and a different one every run.</li>
<li><code>synchronized</code> puts a lock around the method, so the three steps of <code>count++</code> can never interleave. The total is always exactly 200,000.</li>
<li><code>AtomicInteger</code> uses a special CPU instruction that does the read, add and write as one unbreakable step, without a lock.</li>
<li><code>LongAdder</code> spreads the counting over several internal cells so threads do not fight over one number. It is the fastest when many threads write and you only read the total occasionally.</li>
</ol>

<h3>Which tool for which job</h3>
<ul>
<li><b>Running many tasks:</b> use an <code>ExecutorService</code> (a thread pool) instead of creating threads by hand. On Java 21 and later, virtual threads make it cheap to run a task per request.</li>
<li><b>Waiting for slow calls without blocking:</b> <code>CompletableFuture</code> lets you chain "when this finishes, do that".</li>
<li><b>Sharing a map between threads:</b> <code>ConcurrentHashMap</code>.</li>
<li><b>Passing work from one group of threads to another:</b> a <code>BlockingQueue</code>.</li>
<li><b>Waiting until several tasks have finished:</b> <code>CountDownLatch</code>.</li>
<li><b>Allowing only N things at once</b> (say, 10 database calls): <code>Semaphore</code>.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Thinking volatile makes count++ safe</p>
<p><code>volatile</code> only guarantees that threads see the latest value. The three steps of read, add and write can still interleave, so updates are still lost.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use <code>AtomicInteger</code> or <code>synchronized</code> for anything that reads and then writes.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Calling run() instead of start()</p>
<p><code>thread.run()</code> just runs the code on the current thread like a normal method call. No new thread is created at all.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> call <code>thread.start()</code>, or better, submit the task to an <code>ExecutorService</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Taking two locks in different orders</p>
<p>If thread A locks the Order and then waits for the Stock, while thread B locks the Stock and then waits for the Order, they wait for each other forever. That is a deadlock.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> always take locks in the same fixed order everywhere, or use <code>tryLock</code> with a timeout so a thread can give up and retry.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Swallowing InterruptedException</p>
<p>Interruption is how Java politely asks a thread to stop. Catching <code>InterruptedException</code> and ignoring it means the request is lost and the thread never stops.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> either let the exception travel up, or restore the signal with <code>Thread.currentThread().interrupt()</code>.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Threads share objects; any shared data that changes needs protection.</li>
<li><code>count++</code> is three steps, so it is not safe across threads.</li>
<li><code>volatile</code> fixes visibility only; locks and atomic classes fix both visibility and lost updates.</li>
<li>Use thread pools and concurrent collections instead of building your own.</li>
<li>The safest shared data is data that never changes (immutable objects).</li>
</ul>
<p><b>Next:</b> the questions below cover thread pools, CompletableFuture, deadlocks, the memory model and virtual threads.</p>`);

appendTopic("java-concurrency", [
{
  q: "Implement a thread-safe token bucket rate limiter",
  level: "advanced", hot: true, tags: ["rate-limiting", "synchronization", "lld", "must-know"],
  companies: ["Amazon", "Uber", "Google", "Flipkart", "Razorpay", "Microsoft", "Swiggy"],
  a: `<p>A token bucket is the most common rate limiter, and a favourite machine-coding question because it tests concurrency, time handling and design in about forty lines.</p>
<p><strong>The idea:</strong> a bucket holds up to <em>capacity</em> tokens and refills at a steady rate. Each request takes one token. If the bucket is empty, the request is rejected. A full bucket allows a short <strong>burst</strong> up to the capacity, while the refill rate caps the <strong>long-run average</strong>.</p>
<pre><code>public final class TokenBucket {
    private final long capacity;
    private final double refillPerNano;
    private double tokens;
    private long lastRefill;

    public TokenBucket(long capacity, long refillPerSecond) {
        if (capacity &lt;= 0 || refillPerSecond &lt;= 0) throw new IllegalArgumentException();
        this.capacity = capacity;
        this.refillPerNano = refillPerSecond / 1_000_000_000.0;
        this.tokens = capacity;                      // start full
        this.lastRefill = System.nanoTime();
    }

    public synchronized boolean tryAcquire() {
        refill();
        if (tokens &gt;= 1) {
            tokens -= 1;
            return true;
        }
        return false;
    }

    // Lazy refill: no background thread. Work out how many tokens WOULD have
    // arrived since last time, and add them now.
    private void refill() {
        long now = System.nanoTime();
        double arrived = (now - lastRefill) * refillPerNano;
        tokens = Math.min(capacity, tokens + arrived);
        lastRefill = now;
    }
}

// 10 requests per second on average, bursts of up to 20
TokenBucket limiter = new TokenBucket(20, 10);
if (!limiter.tryAcquire()) return ResponseEntity.status(429).build();   // Too Many Requests</code></pre>
<table>
<tr><th>Design choice</th><th>Why</th></tr>
<tr><td><code>System.nanoTime()</code>, not <code>currentTimeMillis()</code></td><td>nanoTime only moves forward. Wall-clock time can jump back when the clock syncs, which would give out free tokens or none</td></tr>
<tr><td>Lazy refill inside the call</td><td>No timer thread to start, stop or leak. Cost is a subtraction per request</td></tr>
<tr><td><code>synchronized</code> on the whole method</td><td>Refill-then-take must be one atomic step, or two threads can both see 1 token and both take it</td></tr>
<tr><td><code>double</code> tokens</td><td>At 10 per second a request 50 ms later has earned half a token. Integers would round that away forever</td></tr>
</table>
<pre><code>// One limiter PER CLIENT, created on first use.
private final ConcurrentHashMap&lt;String, TokenBucket&gt; buckets = new ConcurrentHashMap&lt;&gt;();

boolean allow(String apiKey) {
    return buckets.computeIfAbsent(apiKey, k -&gt; new TokenBucket(20, 10)).tryAcquire();
}
// computeIfAbsent is atomic per key, so two first requests cannot create two
// buckets for the same client. Evict idle buckets, or this map grows forever.</code></pre>
<table>
<tr><th>Algorithm</th><th>Allows bursts</th><th>Weakness</th></tr>
<tr><td><strong>Token bucket</strong></td><td>Yes, up to capacity</td><td>Needs tuning of two numbers</td></tr>
<tr><td>Leaky bucket</td><td>No, output is perfectly smooth</td><td>Bursty clients are queued or dropped</td></tr>
<tr><td>Fixed window counter</td><td>Yes, badly</td><td>2× the limit can pass at a window edge (end of one minute + start of the next)</td></tr>
<tr><td>Sliding window log</td><td>No</td><td>Stores every timestamp; memory heavy</td></tr>
<tr><td>Sliding window counter</td><td>A little</td><td>An approximation, but cheap and good enough almost everywhere</td></tr>
</table>
<p><strong>The follow-up you will get:</strong> "Now you have ten servers." An in-memory bucket per server lets a client make ten times the limit. The usual answer is to keep the bucket in <strong>Redis</strong> and do the refill-and-take in one Lua script, so it is atomic across servers. Or put the limit in the API gateway, which is where most teams end up.</p>`
},
{
  q: "Read this thread dump: why is the service stuck?",
  level: "advanced", hot: true, tags: ["thread-dump", "deadlock", "debugging", "production"],
  companies: ["Amazon", "Goldman Sachs", "Oracle", "Walmart", "Microsoft", "Uber", "SAP"],
  a: `<p>A thread dump is a snapshot of what every thread is doing right now. It is the first thing to take when a Java service is <strong>up but not responding</strong>: the health check fails, requests time out, and CPU is often low (threads are waiting, not working).</p>
<pre><code># Take one (use the PID from 'jps -l' or 'ps')
jcmd &lt;pid&gt; Thread.print &gt; dump1.txt
# Take 3 dumps about 5 seconds apart. One snapshot shows a moment;
# three show which threads are STUCK in the same place.</code></pre>
<pre><code>"http-nio-8080-exec-7" #41 daemon prio=5 tid=0x... nid=0x2f03 waiting for monitor entry
   java.lang.Thread.State: BLOCKED (on object monitor)
        at com.shop.InventoryService.reserve(InventoryService.java:58)
        - waiting to lock &lt;0x000000076b2a1c30&gt; (a com.shop.Stock)
        - locked &lt;0x000000076b2a1d88&gt; (a com.shop.Order)
        at com.shop.CheckoutController.buy(CheckoutController.java:31)

"http-nio-8080-exec-3" #37 daemon prio=5 tid=0x... nid=0x2eff waiting for monitor entry
   java.lang.Thread.State: BLOCKED (on object monitor)
        at com.shop.OrderService.attach(OrderService.java:92)
        - waiting to lock &lt;0x000000076b2a1d88&gt; (a com.shop.Order)
        - locked &lt;0x000000076b2a1c30&gt; (a com.shop.Stock)

Found one Java-level deadlock:
=============================
"http-nio-8080-exec-7": waiting to lock monitor 0x...1c30 (Stock), held by "http-nio-8080-exec-3"
"http-nio-8080-exec-3": waiting to lock monitor 0x...1d88 (Order), held by "http-nio-8080-exec-7"</code></pre>
<p><strong>Reading it:</strong> thread 7 holds the <code>Order</code> lock and wants <code>Stock</code>. Thread 3 holds <code>Stock</code> and wants <code>Order</code>. Neither will ever let go. The JVM even detects this and prints "Found one Java-level deadlock" at the bottom, so always search the dump for that line first.</p>
<table>
<tr><th>State in the dump</th><th>Means</th><th>Many threads here usually points to</th></tr>
<tr><td><code>RUNNABLE</code></td><td>Running, or in native I/O (reading a socket also shows as RUNNABLE)</td><td>A hot loop if CPU is high; a slow downstream if the stack ends in <code>socketRead</code></td></tr>
<tr><td><code>BLOCKED</code></td><td>Waiting to enter a <code>synchronized</code> block</td><td>Lock contention, or a deadlock</td></tr>
<tr><td><code>WAITING</code></td><td>Parked with no timeout: <code>wait()</code>, <code>join()</code>, <code>LockSupport.park</code></td><td>Pool exhaustion: all waiting for a connection or a Future</td></tr>
<tr><td><code>TIMED_WAITING</code></td><td>Same, with a timeout, or <code>sleep</code></td><td>Usually normal: idle pool threads look like this</td></tr>
</table>
<pre><code># The quick triage on a 300-thread dump
grep -c "java.lang.Thread.State: BLOCKED" dump1.txt       # contention?
grep -A 12 "http-nio" dump1.txt | grep "at com.shop" | sort | uniq -c | sort -rn | head
#   -&gt; which of YOUR methods are request threads sitting in, and how many?

# The most common real finding is not a deadlock. It is this, 200 times:
"http-nio-8080-exec-112" WAITING (parking)
    at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:181)
# Every request thread is waiting for a DB connection. The pool has 10, and
# something is holding them: a slow query, or a connection leaked by code
# that opens one outside a transaction and never closes it.</code></pre>
<p><strong>Fixing the deadlock above:</strong> make every code path take the two locks in the <strong>same order</strong> (say, always Order before Stock), or use <code>ReentrantLock.tryLock(timeout)</code> so a thread gives up and retries instead of waiting forever. Better still, shrink the synchronised sections so that no code holds one lock while asking for another.</p>
<p><strong>How to say it in an interview:</strong> "Three dumps a few seconds apart, then look for the deadlock banner, then count thread states, then group request threads by the frame of our own code they are stuck in. The pattern is almost always one of: a deadlock, everyone waiting on a pool, or everyone waiting on one slow downstream call."</p>`
}
]);
