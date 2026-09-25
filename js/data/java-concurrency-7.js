registerPrimer("java-concurrency", `<h3>The mental model: threads share the heap, and steps interleave</h3>
<p>Every thread has its own stack, but all threads share the same <strong>heap</strong>, so they see the same objects. That sharing is what makes threads useful and what makes them dangerous. A line like <code>count++</code> looks like one step, but the CPU does it as three: <strong>read</strong> the value, <strong>add</strong> one, <strong>write</strong> it back. When two threads run those three steps at the same time, their steps can interleave and one update is lost.</p>
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
<h3>Two separate problems, two separate guarantees</h3>
<table>
<tr><th>Problem</th><th>What goes wrong</th><th>What fixes it</th></tr>
<tr><td><strong>Atomicity</strong></td><td>A multi-step change is interrupted halfway, as in the diagram</td><td><code>synchronized</code>, a <code>Lock</code>, or an atomic class such as <code>AtomicInteger</code></td></tr>
<tr><td><strong>Visibility</strong></td><td>One thread writes a value and another thread keeps seeing the old one, because each core may cache it</td><td><code>volatile</code>, or any lock (entering and leaving a lock also publishes changes)</td></tr>
</table>
<p><code>volatile</code> fixes visibility only. A <code>volatile int count</code> still loses updates on <code>count++</code>, because the read, add and write can still interleave. A lock fixes both.</p>
<h3>Worked example: the same counter, fixed three ways</h3>
<pre><code>class Counter {
    private int count;
    void inc() { count++; }                      // BROKEN under threads
}

// 1. synchronized: only one thread at a time runs inc() on this object
class SyncCounter {
    private int count;
    synchronized void inc() { count++; }
    synchronized int get() { return count; }     // the READ needs the lock too,
}                                                // or it may see a stale value

// 2. AtomicInteger: one CPU instruction (compare-and-swap), no lock
class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger();
    void inc() { count.incrementAndGet(); }
    int get() { return count.get(); }
}

// 3. LongAdder: many threads, mostly writing, rarely reading
class HotCounter {
    private final LongAdder count = new LongAdder();   // spreads writes over
    void inc() { count.increment(); }                  // several cells, so
    long get() { return count.sum(); }                 // threads do not fight
}

// Prove the bug: 2 threads x 100,000 increments each
ExecutorService pool = Executors.newFixedThreadPool(2);
Counter c = new Counter();
for (int t = 0; t &lt; 2; t++) pool.submit(() -&gt; { for (int i = 0; i &lt; 100_000; i++) c.inc(); });
pool.shutdown();
pool.awaitTermination(10, TimeUnit.SECONDS);
// Counter:       usually well under 200000, and different every run
// The fixed ones: exactly 200000 every run</code></pre>
<h3>The toolbox, and when to open each drawer</h3>
<table>
<tr><th>You need to</th><th>Reach for</th></tr>
<tr><td>Run tasks on a pool of threads</td><td><code>ExecutorService</code>; on Java 21+, virtual threads for blocking I/O work</td></tr>
<tr><td>Chain async steps without blocking</td><td><code>CompletableFuture</code></td></tr>
<tr><td>Share a map between threads</td><td><code>ConcurrentHashMap</code>, never a synchronised wrapper around <code>HashMap</code></td></tr>
<tr><td>Hand work from producers to consumers</td><td><code>BlockingQueue</code></td></tr>
<tr><td>Wait until N things have finished</td><td><code>CountDownLatch</code></td></tr>
<tr><td>Allow at most N at once (e.g. DB calls)</td><td><code>Semaphore</code></td></tr>
<tr><td>Avoid sharing at all</td><td>Immutable objects, or data owned by one thread. The safest lock is the one you never need</td></tr>
</table>`);

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
