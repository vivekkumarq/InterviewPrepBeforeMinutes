registerCode("sync", {
intro: `<p>Synchronisation primitives exist to answer two different questions: <em>who may touch this data</em>, and <em>when may I proceed</em>. Picking the wrong one is usually what makes concurrent code slow rather than wrong.</p>
<table>
<tr><th>Need</th><th>Java</th><th>Python</th></tr>
<tr><td>Mutual exclusion</td><td><code>synchronized</code>, <code>ReentrantLock</code></td><td><code>threading.Lock</code>, <code>RLock</code></td></tr>
<tr><td>Lock-free counter</td><td><code>AtomicInteger</code>, <code>LongAdder</code></td><td><code>itertools.count</code>, or a lock</td></tr>
<tr><td>Limit concurrency to N</td><td><code>Semaphore</code></td><td><code>threading.Semaphore</code></td></tr>
<tr><td>Many readers, one writer</td><td><code>ReentrantReadWriteLock</code>, <code>StampedLock</code></td><td>No built-in — compose from locks</td></tr>
<tr><td>Wait for a signal</td><td><code>CountDownLatch</code>, <code>Condition</code></td><td><code>threading.Event</code>, <code>Condition</code></td></tr>
<tr><td>Wait for N workers</td><td><code>CountDownLatch</code></td><td><code>Barrier</code> with parties</td></tr>
<tr><td>Repeated rendezvous</td><td><code>CyclicBarrier</code>, <code>Phaser</code></td><td><code>threading.Barrier</code></td></tr>
</table>
<p><strong>The single most useful rule:</strong> hold a lock for the shortest possible time, and <em>never</em> perform I/O or call unknown code while holding one. A callback that acquires another lock is how deadlocks get into production.</p>`,
questions: [
{
  slug: "protect-shared-data", n: 160, title: "Protect Shared Data With a Lock", difficulty: "easy",
  statement: `<p>Make a class safe for concurrent use when several fields must change together.</p>`,
  approaches: [
    { name: "synchronized or a lock", time: "—", space: "O(1)", best: true,
      note: "Both give mutual exclusion and a happens-before edge, so changes made under the lock are visible to the next holder. ReentrantLock adds tryLock, timeouts and interruptibility.",
      java: `public class Account {
    private final ReentrantLock lock = new ReentrantLock();
    private long balance;

    public void deposit(long amount) {
        lock.lock();
        try {
            balance += amount;
        } finally {
            lock.unlock();            // ALWAYS in finally
        }
    }

    // The synchronized equivalent, shorter but less capable
    public synchronized void withdraw(long amount) {
        if (balance < amount) throw new IllegalStateException("insufficient");
        balance -= amount;
    }
}`,
      python: `import threading

class Account:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._balance = 0

    def deposit(self, amount: int) -> None:
        with self._lock:              # released even on exception
            self._balance += amount

    def withdraw(self, amount: int) -> None:
        with self._lock:
            if self._balance < amount:
                raise ValueError("insufficient")
            self._balance -= amount` },
    { name: "Reduce the critical section", time: "—", space: "O(1)",
      note: "Do the expensive work outside the lock and hold it only for the mutation. This one change is usually worth more than any primitive swap.",
      java: `// BAD: the network call happens while holding the lock,
// so every other thread waits on a remote server.
public synchronized void refresh(String id) {
    Data d = httpClient.fetch(id);      // slow, and locked
    cache.put(id, d);
}

// GOOD: fetch first, lock only to publish.
public void refresh(String id) {
    Data d = httpClient.fetch(id);      // no lock held
    lock.lock();
    try { cache.put(id, d); } finally { lock.unlock(); }
}`,
      python: `# BAD: the network call happens while holding the lock.
def refresh_bad(self, key: str) -> None:
    with self._lock:
        self._cache[key] = http_get(key)

# GOOD: fetch first, lock only to publish.
def refresh(self, key: str) -> None:
    value = http_get(key)
    with self._lock:
        self._cache[key] = value` }
  ],
  note: `<p>Both Java forms are <strong>reentrant</strong> — a thread already holding the lock may acquire it again, so one synchronised method can call another without deadlocking itself. Python's plain <code>Lock</code> is <em>not</em>; use <code>RLock</code> if you need that.</p>
<p>Prefer a private lock object over <code>synchronized</code> on the instance. Locking on <code>this</code> lets any outside code lock your object and stall you.</p>`
},
{
  slug: "atomic-updates", n: 161, title: "Lock-Free Updates With Atomics", difficulty: "medium",
  statement: `<p>Update a shared value from many threads without a lock.</p>`,
  approaches: [
    { name: "Compare-and-swap", time: "—", space: "O(1)", best: true,
      note: "CAS is a single hardware instruction: change the value only if it still holds what you last read, otherwise retry. No blocking, no deadlock — but under heavy contention the retries themselves cost.",
      java: `AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();                    // atomic +1
counter.addAndGet(5);
counter.compareAndSet(10, 20);                // only if it is still 10

// Arbitrary update, retried until it sticks
AtomicReference<Config> config = new AtomicReference<>(initial);
config.updateAndGet(c -> c.withTimeout(5000));

// Under HEAVY contention, LongAdder beats AtomicLong: it keeps
// per-thread cells and sums them on read, so threads stop fighting
// over one cache line.
LongAdder requests = new LongAdder();
requests.increment();
long total = requests.sum();`,
      python: `import itertools
import threading

# Python has no CAS primitive exposed. The nearest lock-free thing is a
# C-level atomic like itertools.count, which is a single bytecode.
counter = itertools.count()
next(counter)                                  # atomic under the GIL

# For anything else, a lock is the answer; it is cheap because the GIL
# already serialises bytecode execution.
class AtomicInt:
    def __init__(self, value: int = 0) -> None:
        self._value = value
        self._lock = threading.Lock()

    def increment(self) -> int:
        with self._lock:
            self._value += 1
            return self._value

    def compare_and_set(self, expected: int, new: int) -> bool:
        with self._lock:
            if self._value != expected:
                return False
            self._value = new
            return True` }
  ],
  note: `<p><strong>The ABA problem</strong> is the classic follow-up: a value changes from A to B and back to A, so CAS succeeds even though the state was meddled with in between. <code>AtomicStampedReference</code> attaches a version counter to detect it.</p>
<p>Atomics beat locks for a single variable. For several fields that must change together, a lock is both simpler and correct — CAS on one field cannot make two updates atomic.</p>`
},
{
  slug: "deadlock", n: 162, title: "Deadlock: Two Threads Waiting Forever", difficulty: "medium",
  statement: `<p>Two threads each hold a lock the other needs. Neither can proceed. Show how it happens and how to prevent it.</p>`,
  approaches: [
    { name: "The bug", time: "—", space: "—",
      note: "A bank transfer locking both accounts in argument order. Thread A transfers X to Y while thread B transfers Y to X, and they grab the locks in opposite orders.",
      java: `void transfer(Account from, Account to, long amount) {
    synchronized (from) {              // thread A: locks X then Y
        synchronized (to) {            // thread B: locks Y then X
            from.debit(amount);        // both now wait forever
            to.credit(amount);
        }
    }
}`,
      python: `def transfer(frm, to, amount: int) -> None:
    with frm.lock:            # thread A: X then Y
        with to.lock:         # thread B: Y then X
            frm.balance -= amount
            to.balance += amount` },
    { name: "Global lock ordering", time: "—", space: "—", best: true,
      note: "Break the circular wait by always acquiring in the same order, using any stable total ordering — an id, or identity hash. This is the practical fix and the one to name.",
      java: `void transfer(Account a, Account b, long amount) {
    Account first  = a.id() < b.id() ? a : b;      // always the lower id first
    Account second = a.id() < b.id() ? b : a;
    if (a.id() == b.id()) throw new IllegalArgumentException("same account");

    synchronized (first) {
        synchronized (second) {
            a.debit(amount);
            b.credit(amount);
        }
    }
}`,
      python: `def transfer(a, b, amount: int) -> None:
    if a.id == b.id:
        raise ValueError("same account")
    first, second = (a, b) if a.id < b.id else (b, a)
    with first.lock:
        with second.lock:
            a.balance -= amount
            b.balance += amount` },
    { name: "tryLock with a timeout", time: "—", space: "—",
      note: "Break the no-pre-emption condition instead: if the second lock is not available quickly, release the first and retry. Add jitter or two threads retry in lockstep forever, which is LIVELOCK.",
      java: `boolean transfer(Account from, Account to, long amount)
        throws InterruptedException {
    if (!from.lock.tryLock(100, TimeUnit.MILLISECONDS)) return false;
    try {
        if (!to.lock.tryLock(100, TimeUnit.MILLISECONDS)) return false;
        try {
            from.debit(amount);
            to.credit(amount);
            return true;
        } finally { to.lock.unlock(); }
    } finally { from.lock.unlock(); }
}
// Caller retries with randomised backoff, never in a tight spin.`,
      python: `import random
import time

def transfer(frm, to, amount: int) -> bool:
    if not frm.lock.acquire(timeout=0.1):
        return False
    try:
        if not to.lock.acquire(timeout=0.1):
            return False
        try:
            frm.balance -= amount
            to.balance += amount
            return True
        finally:
            to.lock.release()
    finally:
        frm.lock.release()
        time.sleep(random.uniform(0, 0.05))     # jitter, avoids livelock` }
  ],
  note: `<table>
<tr><th>Coffman condition</th><th>Break it by</th></tr>
<tr><td>Mutual exclusion</td><td>Immutable data, lock-free structures</td></tr>
<tr><td>Hold and wait</td><td>Acquire everything at once, or nothing</td></tr>
<tr><td>No pre-emption</td><td><code>tryLock</code> with a timeout</td></tr>
<tr><td><strong>Circular wait</strong></td><td><strong>Global lock ordering</strong> — the practical fix</td></tr>
</table>
<p><strong>Diagnosing it:</strong> <code>jcmd &lt;pid&gt; Thread.print</code> — the JVM detects and names the cycle outright: "Found one Java-level deadlock". Take three dumps ten seconds apart; threads stuck on the same monitor in all three are deadlocked, threads that move are merely contended.</p>`
},
{
  slug: "limit-concurrency", n: 163, title: "Limit How Many Run at Once", difficulty: "medium",
  statement: `<p>Allow at most N threads into a section at a time — for example to avoid overwhelming a downstream service.</p>`,
  approaches: [
    { name: "Semaphore", time: "—", space: "O(1)", best: true,
      note: "A counter of permits. Acquire blocks when none are left; release returns one. Unlike a lock, a permit may be released by a different thread than acquired it.",
      java: `public class RateLimitedClient {
    private final Semaphore permits = new Semaphore(10);   // at most 10 at once

    public Response call(Request r) throws InterruptedException {
        permits.acquire();
        try {
            return httpClient.send(r);
        } finally {
            permits.release();                 // ALWAYS in finally
        }
    }

    /** Give up rather than queue forever. */
    public Response callOrFail(Request r) throws InterruptedException {
        if (!permits.tryAcquire(2, TimeUnit.SECONDS))
            throw new RejectedExecutionException("too busy");
        try { return httpClient.send(r); } finally { permits.release(); }
    }
}`,
      python: `import threading

class RateLimitedClient:
    def __init__(self, limit: int = 10) -> None:
        self._permits = threading.Semaphore(limit)

    def call(self, request):
        with self._permits:                    # acquire / release
            return http_send(request)

    def call_or_fail(self, request):
        if not self._permits.acquire(timeout=2):
            raise RuntimeError("too busy")
        try:
            return http_send(request)
        finally:
            self._permits.release()` },
    { name: "Async semaphore", time: "—", space: "O(1)",
      note: "The same idea for non-blocking code: bound how many coroutines or futures are in flight without blocking a thread each.",
      java: `// Java 21: virtual threads make the blocking version cheap enough that
// a Semaphore is already the right answer. For reactive code, bound the
// concurrency at the operator instead:
Flux.fromIterable(requests)
    .flatMap(r -> callAsync(r), 10)      // at most 10 in flight
    .collectList();`,
      python: `import asyncio

async def fetch_all(urls: list[str], limit: int = 10) -> list:
    semaphore = asyncio.Semaphore(limit)

    async def one(url: str):
        async with semaphore:              # at most "limit" in flight
            return await fetch(url)

    return await asyncio.gather(*(one(u) for u in urls))` }
  ],
  note: `<p>Releasing a permit you never acquired silently <em>increases</em> the limit — semaphores do not track ownership. That is why the release belongs in a <code>finally</code>, and why a stray release is a nastier bug than a stray unlock.</p>`
},
{
  slug: "read-write-lock", n: 164, title: "Many Readers, One Writer", difficulty: "medium",
  statement: `<p>Allow unlimited concurrent readers, but give a writer exclusive access.</p>`,
  approaches: [
    { name: "ReadWriteLock", time: "—", space: "O(1)",
      note: "Worth it only when reads greatly outnumber writes AND the critical section is long enough to pay for the extra bookkeeping. For short sections a plain lock is often faster.",
      java: `public class Cache<K, V> {
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final Map<K, V> map = new HashMap<>();

    public V get(K key) {
        lock.readLock().lock();              // many readers together
        try { return map.get(key); }
        finally { lock.readLock().unlock(); }
    }

    public void put(K key, V value) {
        lock.writeLock().lock();             // exclusive
        try { map.put(key, value); }
        finally { lock.writeLock().unlock(); }
    }
}`,
      python: `import threading

class ReadWriteLock:
    """Python has no built-in; compose one from a lock and a condition."""

    def __init__(self) -> None:
        self._cond = threading.Condition()
        self._readers = 0
        self._writer = False

    def acquire_read(self) -> None:
        with self._cond:
            while self._writer:
                self._cond.wait()
            self._readers += 1

    def release_read(self) -> None:
        with self._cond:
            self._readers -= 1
            if self._readers == 0:
                self._cond.notify_all()

    def acquire_write(self) -> None:
        with self._cond:
            while self._writer or self._readers:
                self._cond.wait()
            self._writer = True

    def release_write(self) -> None:
        with self._cond:
            self._writer = False
            self._cond.notify_all()` },
    { name: "A concurrent collection instead", time: "—", space: "O(n)", best: true,
      note: "Usually the better answer. ConcurrentHashMap already does fine-grained locking internally and reads are lock-free — no read-write lock needed and far less to get wrong.",
      java: `// Almost always preferable to hand-rolling a read-write lock
private final Map<K, V> map = new ConcurrentHashMap<>();

V get(K key)              { return map.get(key); }          // lock-free read
void put(K key, V value)  { map.put(key, value); }
V computeIfAbsent(K k)    { return map.computeIfAbsent(k, this::load); }

// Iteration-heavy with rare writes? CopyOnWriteArrayList: writers copy
// the whole array, readers never block and never see a torn state.
private final List<Listener> listeners = new CopyOnWriteArrayList<>();`,
      python: `# CPython dict operations are atomic under the GIL, so a plain dict is
# already safe for simple get/put from multiple threads.
cache: dict[str, int] = {}
cache["key"] = 1            # atomic
value = cache.get("key")    # atomic

# But COMPOUND actions still need a lock:
lock = threading.Lock()
with lock:
    if "key" not in cache:      # check and insert must be one unit
        cache["key"] = compute()` }
  ],
  note: `<p><strong>Writer starvation</strong> is the trap: with a constant stream of readers, an unfair read-write lock may never let a writer in. Java's implementation supports a fair mode, at a real throughput cost.</p>
<p>Java 8's <code>StampedLock</code> adds optimistic reading — take a stamp, read, then validate it was not invalidated. Faster still, but it is not reentrant and misusing it corrupts data silently.</p>`
},
{
  slug: "wait-for-signal", n: 165, title: "Wait for a Signal", difficulty: "medium",
  statement: `<p>Block a thread until another thread says it may proceed.</p>`,
  approaches: [
    { name: "Latch or event", time: "—", space: "O(1)", best: true,
      note: "A one-shot gate. Every waiter is released when it opens, and it never closes again — which is exactly right for 'initialisation finished'.",
      java: `public class Service {
    private final CountDownLatch ready = new CountDownLatch(1);

    public void start() {
        new Thread(() -> {
            loadConfiguration();
            warmCaches();
            ready.countDown();              // opens the gate, permanently
        }).start();
    }

    public void handle(Request r) throws InterruptedException {
        if (!ready.await(30, TimeUnit.SECONDS))    // ALWAYS use a timeout
            throw new IllegalStateException("startup timed out");
        process(r);
    }
}`,
      python: `import threading

class Service:
    def __init__(self) -> None:
        self._ready = threading.Event()

    def start(self) -> None:
        def boot() -> None:
            load_configuration()
            warm_caches()
            self._ready.set()               # opens the gate

        threading.Thread(target=boot, daemon=True).start()

    def handle(self, request) -> None:
        if not self._ready.wait(timeout=30):
            raise RuntimeError("startup timed out")
        process(request)` },
    { name: "Condition with a predicate", time: "—", space: "O(1)",
      note: "For a condition that can become true and false repeatedly. The wait MUST sit in a while loop, not an if — spurious wakeups are permitted by both languages.",
      java: `private final ReentrantLock lock = new ReentrantLock();
private final Condition notEmpty = lock.newCondition();
private final Queue<Task> queue = new ArrayDeque<>();

public Task take() throws InterruptedException {
    lock.lock();
    try {
        while (queue.isEmpty())        // WHILE, never if
            notEmpty.await();          // releases the lock while waiting
        return queue.poll();
    } finally { lock.unlock(); }
}

public void put(Task t) {
    lock.lock();
    try {
        queue.add(t);
        notEmpty.signal();             // wake one waiter
    } finally { lock.unlock(); }
}`,
      python: `import threading
from collections import deque

class TaskQueue:
    def __init__(self) -> None:
        self._cond = threading.Condition()
        self._queue: deque = deque()

    def take(self):
        with self._cond:
            while not self._queue:      # WHILE, never if
                self._cond.wait()
            return self._queue.popleft()

    def put(self, task) -> None:
        with self._cond:
            self._queue.append(task)
            self._cond.notify()` }
  ],
  note: `<p><strong>Always <code>while</code>, never <code>if</code>.</strong> A thread can wake without being signalled (a spurious wakeup), and even a real signal does not guarantee the condition still holds by the time it reacquires the lock — another thread may have consumed it first.</p>
<p>Always pass a timeout to <code>await</code>. An untimed wait on a signal that never comes is indistinguishable from a hang.</p>`
},
{
  slug: "wait-for-n-workers", n: 166, title: "Wait for N Workers", difficulty: "medium",
  statement: `<p>Start N tasks and block until every one of them has finished.</p>`,
  approaches: [
    { name: "CountDownLatch", time: "—", space: "O(1)",
      note: "Initialise to N, each worker counts down once, the coordinator awaits zero. The countdown must be in a finally block or one failing task hangs the coordinator forever.",
      java: `public void runAll(List<Task> tasks) throws InterruptedException {
    CountDownLatch done = new CountDownLatch(tasks.size());
    ExecutorService pool = Executors.newFixedThreadPool(8);

    for (Task t : tasks) {
        pool.submit(() -> {
            try {
                t.run();
            } catch (Exception e) {
                log.error("task failed", e);
            } finally {
                done.countDown();          // MUST be in finally
            }
        });
    }
    if (!done.await(5, TimeUnit.MINUTES))
        throw new IllegalStateException("workers did not finish in time");
    pool.shutdown();
}`,
      python: `import threading
from concurrent.futures import ThreadPoolExecutor

def run_all(tasks: list) -> None:
    done = threading.Semaphore(0)          # used as a countdown

    def wrap(task) -> None:
        try:
            task()
        except Exception:
            log.exception("task failed")
        finally:
            done.release()

    with ThreadPoolExecutor(max_workers=8) as pool:
        for t in tasks:
            pool.submit(wrap, t)

    for _ in tasks:
        done.acquire()` },
    { name: "Just close the executor", time: "—", space: "O(1)", best: true,
      note: "Both languages already do this. Java's try-with-resources on an ExecutorService waits for every task on close; Python's with block does the same. No latch needed.",
      java: `// Java 19+: close() waits for all submitted tasks
try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Task t : tasks) pool.submit(t::run);
}   // blocks here until every task finishes

// Or collect futures and join them, which also surfaces failures
List<Future<?>> futures = tasks.stream()
        .map(t -> pool.submit(t::run))
        .toList();
for (Future<?> f : futures) f.get();       // throws if a task threw`,
      python: `from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=8) as pool:
    futures = [pool.submit(t) for t in tasks]
# the with block already waited for all of them

for f in futures:
    f.result()                             # re-raises any task exception` }
  ],
  note: `<p>Prefer futures over a latch when failures matter: a latch tells you tasks <em>finished</em>, not that they <em>succeeded</em>. Calling <code>get()</code> on each future re-throws whatever it threw, so nothing fails silently.</p>
<p>A <code>CountDownLatch</code> cannot be reset. For a repeated rendezvous use <code>CyclicBarrier</code> or <code>Phaser</code>.</p>`
},
{
  slug: "barrier-phases", n: 167, title: "Work in Phases (Barrier)", difficulty: "medium",
  statement: `<p>Several threads each do a chunk of work, all wait for the others, then all start the next phase together.</p>`,
  approaches: [
    { name: "CyclicBarrier", time: "—", space: "O(1)", best: true,
      note: "Reusable, unlike a latch. The last thread to arrive releases everyone and optionally runs a barrier action — the natural place for the merge step between phases.",
      java: `public class Simulation {
    private final CyclicBarrier barrier;

    public Simulation(int workers) {
        // the last arriver runs this, then everyone is released
        barrier = new CyclicBarrier(workers, () -> {
            mergeResults();
            System.out.println("phase complete");
        });
    }

    public void worker(int id) {
        try {
            for (int phase = 0; phase < 10; phase++) {
                computeChunk(id, phase);
                barrier.await(30, TimeUnit.SECONDS);   // wait for the others
            }
        } catch (BrokenBarrierException e) {
            // another thread failed or timed out: the barrier is now broken
            // for EVERYONE, which is the intended fail-fast behaviour
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            Thread.currentThread().interrupt();
        }
    }
}`,
      python: `import threading

class Simulation:
    def __init__(self, workers: int) -> None:
        self._barrier = threading.Barrier(workers, action=self._merge)

    def _merge(self) -> None:
        merge_results()
        print("phase complete")

    def worker(self, worker_id: int) -> None:
        try:
            for phase in range(10):
                compute_chunk(worker_id, phase)
                self._barrier.wait(timeout=30)
        except threading.BrokenBarrierError:
            # one party failed; the barrier is broken for everyone
            pass` }
  ],
  note: `<p><strong>Broken barriers are the point, not a flaw.</strong> If any party times out, is interrupted, or throws, the barrier breaks for <em>all</em> of them — otherwise the rest would wait forever for a party that is never coming.</p>
<p>The party count is fixed at construction. If workers can come and go, use <code>Phaser</code>, which supports registering and deregistering dynamically.</p>`
}
]});
