registerCode("classic-concurrency", {
intro: `<p>These are the puzzles interviewers reach for when they want to see whether you can reason about ordering rather than recite API names. Each one is small, and each has a specific trap.</p>
<table>
<tr><th>Puzzle</th><th>What it really tests</th></tr>
<tr><td>Print in order</td><td>Signalling between threads</td></tr>
<tr><td>Odd / even alternation</td><td>Condition variables and the spurious-wakeup rule</td></tr>
<tr><td>FizzBuzz with four threads</td><td>Coordinating more than two participants</td></tr>
<tr><td>Building H₂O</td><td>Barriers and counted rendezvous</td></tr>
<tr><td>Dining philosophers</td><td>Deadlock avoidance</td></tr>
<tr><td>Bounded blocking queue</td><td>Two conditions on one lock</td></tr>
<tr><td>Thread-safe singleton</td><td>The Java Memory Model</td></tr>
<tr><td>Web crawler</td><td>Knowing when concurrent work is finished</td></tr>
<tr><td>Rate limiter</td><td>Time plus shared state</td></tr>
</table>
<p><strong>The rule that solves most of them:</strong> always wait in a <code>while</code> loop testing a predicate, never an <code>if</code>. A thread can wake without being signalled, and even a genuine signal does not guarantee the condition still holds once the lock is reacquired — another thread may have consumed it first.</p>`,
questions: [
{
  slug: "print-in-order", n: 190, title: "Print in Order", difficulty: "easy",
  statement: `<p>Three threads call <code>first()</code>, <code>second()</code> and <code>third()</code> in any order. Ensure the output is always first, second, third.</p>`,
  approaches: [
    { name: "Semaphores as gates", time: "—", space: "O(1)", best: true,
      note: "Start each gate closed and open it when its predecessor finishes. Clean, and it generalises to any number of stages.",
      java: `public class Foo {
    private final Semaphore gateSecond = new Semaphore(0);   // closed
    private final Semaphore gateThird = new Semaphore(0);    // closed

    public void first(Runnable printFirst) {
        printFirst.run();
        gateSecond.release();          // open the gate for second
    }

    public void second(Runnable printSecond) throws InterruptedException {
        gateSecond.acquire();          // wait for first
        printSecond.run();
        gateThird.release();
    }

    public void third(Runnable printThird) throws InterruptedException {
        gateThird.acquire();           // wait for second
        printThird.run();
    }
}`,
      python: `import threading

class Foo:
    def __init__(self) -> None:
        self._gate_second = threading.Semaphore(0)
        self._gate_third = threading.Semaphore(0)

    def first(self, print_first) -> None:
        print_first()
        self._gate_second.release()

    def second(self, print_second) -> None:
        self._gate_second.acquire()
        print_second()
        self._gate_third.release()

    def third(self, print_third) -> None:
        self._gate_third.acquire()
        print_third()` },
    { name: "Latches", time: "—", space: "O(1)",
      note: "Same shape with CountDownLatch. Slightly clearer intent — a latch is explicitly one-shot, where a semaphore could be released more than once.",
      java: `public class Foo {
    private final CountDownLatch firstDone = new CountDownLatch(1);
    private final CountDownLatch secondDone = new CountDownLatch(1);

    public void first(Runnable r) { r.run(); firstDone.countDown(); }

    public void second(Runnable r) throws InterruptedException {
        firstDone.await();
        r.run();
        secondDone.countDown();
    }

    public void third(Runnable r) throws InterruptedException {
        secondDone.await();
        r.run();
    }
}`,
      python: `import threading

class Foo:
    def __init__(self) -> None:
        self._first_done = threading.Event()
        self._second_done = threading.Event()

    def first(self, r) -> None:
        r()
        self._first_done.set()

    def second(self, r) -> None:
        self._first_done.wait()
        r()
        self._second_done.set()

    def third(self, r) -> None:
        self._second_done.wait()
        r()` }
  ],
  note: `<p>A busy-wait on a <code>volatile</code> flag would also "work" and is the wrong answer: it burns a core spinning. Say why you rejected it — that reasoning is what is being graded.</p>`
},
{
  slug: "odd-even-threads", n: 191, title: "Two Threads Take Turns: Odd and Even", difficulty: "medium",
  statement: `<p>One thread prints odd numbers, another prints even, strictly alternating up to n.</p>`,
  approaches: [
    { name: "Condition variable with a turn flag", time: "—", space: "O(1)", best: true,
      note: "Shared state says whose turn it is. Each thread waits WHILE it is not its turn, prints, flips the flag, and signals. The while loop is not optional.",
      java: `public class OddEven {
    private final Object lock = new Object();
    private int value = 1;
    private final int max;

    public OddEven(int max) { this.max = max; }

    public void odd() throws InterruptedException {
        synchronized (lock) {
            while (value <= max) {
                while (value % 2 == 0 && value <= max)   // WHILE, not if
                    lock.wait();
                if (value > max) break;
                System.out.println("odd  " + value++);
                lock.notifyAll();
            }
        }
    }

    public void even() throws InterruptedException {
        synchronized (lock) {
            while (value <= max) {
                while (value % 2 == 1 && value <= max)
                    lock.wait();
                if (value > max) break;
                System.out.println("even " + value++);
                lock.notifyAll();
            }
        }
    }
}`,
      python: `import threading

class OddEven:
    def __init__(self, max_value: int) -> None:
        self._cond = threading.Condition()
        self._value = 1
        self._max = max_value

    def odd(self) -> None:
        with self._cond:
            while self._value <= self._max:
                self._cond.wait_for(
                    lambda: self._value % 2 == 1 or self._value > self._max)
                if self._value > self._max:
                    break
                print("odd ", self._value)
                self._value += 1
                self._cond.notify_all()

    def even(self) -> None:
        with self._cond:
            while self._value <= self._max:
                self._cond.wait_for(
                    lambda: self._value % 2 == 0 or self._value > self._max)
                if self._value > self._max:
                    break
                print("even", self._value)
                self._value += 1
                self._cond.notify_all()` }
  ],
  note: `<p><strong>The termination trap:</strong> when the counter passes <code>max</code>, the waiting thread must be woken and must re-check, or it waits forever for a turn that will never come. That is why the predicate includes <code>value &gt; max</code> and why <code>notifyAll</code> is called on the way out.</p>
<p>Prefer <code>notifyAll</code> to <code>notify</code> here. With only two threads either works, but <code>notify</code> can wake the wrong one in the general case and stall the whole exchange.</p>`
},
{
  slug: "fizzbuzz-threads", n: 192, title: "FizzBuzz With Four Threads", difficulty: "medium",
  statement: `<p>Four threads — fizz, buzz, fizzbuzz and number — cooperate to print FizzBuzz from 1 to n in order.</p>`,
  approaches: [
    { name: "One shared counter, four predicates", time: "—", space: "O(1)", best: true,
      note: "Each thread waits until the counter is a value it owns. Only one predicate can be true at a time, so exactly one thread proceeds per number.",
      java: `public class FizzBuzz {
    private final int n;
    private final Object lock = new Object();
    private int current = 1;

    public FizzBuzz(int n) { this.n = n; }

    private void run(java.util.function.IntPredicate owns, Runnable print)
            throws InterruptedException {
        while (true) {
            synchronized (lock) {
                while (current <= n && !owns.test(current)) lock.wait();
                if (current > n) { lock.notifyAll(); return; }
                print.run();
                current++;
                lock.notifyAll();
            }
        }
    }

    public void fizz(Runnable p) throws InterruptedException {
        run(i -> i % 3 == 0 && i % 5 != 0, p);
    }
    public void buzz(Runnable p) throws InterruptedException {
        run(i -> i % 5 == 0 && i % 3 != 0, p);
    }
    public void fizzbuzz(Runnable p) throws InterruptedException {
        run(i -> i % 15 == 0, p);
    }
    public void number(java.util.function.IntConsumer p)
            throws InterruptedException {
        while (true) {
            synchronized (lock) {
                while (current <= n && (current % 3 == 0 || current % 5 == 0))
                    lock.wait();
                if (current > n) { lock.notifyAll(); return; }
                p.accept(current);
                current++;
                lock.notifyAll();
            }
        }
    }
}`,
      python: `import threading

class FizzBuzz:
    def __init__(self, n: int) -> None:
        self._n = n
        self._cond = threading.Condition()
        self._current = 1

    def _run(self, owns, emit) -> None:
        while True:
            with self._cond:
                self._cond.wait_for(
                    lambda: self._current > self._n or owns(self._current))
                if self._current > self._n:
                    self._cond.notify_all()
                    return
                emit(self._current)
                self._current += 1
                self._cond.notify_all()

    def fizz(self, p) -> None:
        self._run(lambda i: i % 3 == 0 and i % 5 != 0, lambda i: p())

    def buzz(self, p) -> None:
        self._run(lambda i: i % 5 == 0 and i % 3 != 0, lambda i: p())

    def fizzbuzz(self, p) -> None:
        self._run(lambda i: i % 15 == 0, lambda i: p())

    def number(self, p) -> None:
        self._run(lambda i: i % 3 != 0 and i % 5 != 0, p)` }
  ],
  note: `<p>Check the multiple of 15 <em>first</em>, or exclude it from the others as done here — otherwise fizz and buzz both claim it and the ordering breaks. The same precedence bug as single-threaded FizzBuzz, now with a race on top.</p>
<p>Every thread must <code>notifyAll</code> before returning at the end, or the other three wait forever on a counter that will never advance.</p>`
},
{
  slug: "building-h2o", n: 193, title: "Building H₂O", difficulty: "medium",
  statement: `<p>Hydrogen and oxygen threads arrive arbitrarily. Release them only in groups of two hydrogen and one oxygen.</p>`,
  approaches: [
    { name: "Semaphores plus a barrier", time: "—", space: "O(1)", best: true,
      note: "Two hydrogen permits and one oxygen permit control who may enter a group; a three-party barrier holds them until the molecule is complete before any of them leaves.",
      java: `public class H2O {
    private final Semaphore hydrogen = new Semaphore(2);   // 2 at a time
    private final Semaphore oxygen = new Semaphore(1);     // 1 at a time
    private final CyclicBarrier barrier = new CyclicBarrier(3);

    public void hydrogen(Runnable release) throws InterruptedException {
        hydrogen.acquire();
        try {
            barrier.await();          // wait for the full molecule
            release.run();
        } catch (BrokenBarrierException e) {
            Thread.currentThread().interrupt();
        } finally {
            hydrogen.release();
        }
    }

    public void oxygen(Runnable release) throws InterruptedException {
        oxygen.acquire();
        try {
            barrier.await();
            release.run();
        } catch (BrokenBarrierException e) {
            Thread.currentThread().interrupt();
        } finally {
            oxygen.release();
        }
    }
}`,
      python: `import threading

class H2O:
    def __init__(self) -> None:
        self._hydrogen = threading.Semaphore(2)
        self._oxygen = threading.Semaphore(1)
        self._barrier = threading.Barrier(3)

    def hydrogen(self, release) -> None:
        self._hydrogen.acquire()
        try:
            self._barrier.wait()      # wait for the full molecule
            release()
        finally:
            self._hydrogen.release()

    def oxygen(self, release) -> None:
        self._oxygen.acquire()
        try:
            self._barrier.wait()
            release()
        finally:
            self._oxygen.release()` }
  ],
  note: `<p>Both mechanisms are needed and they do different jobs. The <strong>semaphores</strong> control who may join the current molecule; the <strong>barrier</strong> stops anyone leaving until all three have arrived. Drop the barrier and two hydrogens could be emitted before any oxygen shows up.</p>
<p>Release the permit only <em>after</em> the barrier, in a <code>finally</code> — releasing earlier lets a fourth thread into a molecule that is still forming.</p>`
},
{
  slug: "dining-philosophers", n: 194, title: "Dining Philosophers", difficulty: "hard",
  statement: `<p>Five philosophers sit in a circle with one fork between each pair. Each needs both neighbouring forks to eat. Prevent deadlock and starvation.</p>`,
  approaches: [
    { name: "Everyone grabs left first", time: "—", space: "O(1)",
      note: "DEADLOCKS. If all five pick up their left fork simultaneously, every fork is held and every philosopher waits forever for their right. The textbook circular wait.",
      java: `// BROKEN: every philosopher takes left then right
synchronized (forks[i]) {                    // left
    synchronized (forks[(i + 1) % 5]) {      // right
        eat();
    }
}`,
      python: `# BROKEN: same circular wait
with forks[i]:
    with forks[(i + 1) % 5]:
        eat()` },
    { name: "Break the symmetry", time: "—", space: "O(1)", best: true,
      note: "Make one philosopher pick up right first. That single asymmetry breaks the cycle — with no circular wait, deadlock is impossible.",
      java: `public void dine(int id) throws InterruptedException {
    Lock left = forks[id];
    Lock right = forks[(id + 1) % 5];

    // one philosopher reverses the order: no cycle can form
    Lock first = (id == 4) ? right : left;
    Lock second = (id == 4) ? left : right;

    first.lock();
    try {
        second.lock();
        try { eat(); } finally { second.unlock(); }
    } finally { first.unlock(); }
}`,
      python: `import threading

def dine(philosopher_id: int, forks: list[threading.Lock]) -> None:
    left = forks[philosopher_id]
    right = forks[(philosopher_id + 1) % len(forks)]

    first, second = (right, left) if philosopher_id == 4 else (left, right)

    with first:
        with second:
            eat()` },
    { name: "Limit how many sit down", time: "—", space: "O(1)",
      note: "Allow only four philosophers at the table at once. With five forks and four diners, at least one can always get both — a pigeonhole argument rather than an ordering one.",
      java: `private final Semaphore seats = new Semaphore(4);    // one fewer than forks

public void dine(int id) throws InterruptedException {
    seats.acquire();
    try {
        forks[id].lock();
        try {
            forks[(id + 1) % 5].lock();
            try { eat(); } finally { forks[(id + 1) % 5].unlock(); }
        } finally { forks[id].unlock(); }
    } finally {
        seats.release();
    }
}`,
      python: `import threading

seats = threading.Semaphore(4)       # one fewer than the number of forks

def dine(philosopher_id: int, forks: list[threading.Lock]) -> None:
    with seats:
        with forks[philosopher_id]:
            with forks[(philosopher_id + 1) % len(forks)]:
                eat()` }
  ],
  note: `<p>Both fixes attack a different Coffman condition: reversing the order breaks <strong>circular wait</strong>; limiting the seats breaks <strong>hold and wait</strong>. Naming which condition you are breaking is what turns a memorised trick into an argument.</p>
<p><strong>Deadlock-free is not starvation-free.</strong> A philosopher can still be repeatedly unlucky. Fair locks or an explicit queue fix that, at a throughput cost.</p>`
},
{
  slug: "bounded-blocking-queue", n: 195, title: "Build a Bounded Blocking Queue", difficulty: "medium",
  statement: `<p>Implement a thread-safe queue with a fixed capacity: <code>put</code> blocks when full, <code>take</code> blocks when empty.</p>`,
  approaches: [
    { name: "One lock, two conditions", time: "O(1)", space: "O(capacity)", best: true,
      note: "Two separate conditions so a producer waiting for space is not woken by another producer. Using one condition for both works but wakes threads that cannot proceed.",
      java: `public class BoundedQueue<T> {
    private final Queue<T> items = new ArrayDeque<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedQueue(int capacity) { this.capacity = capacity; }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (items.size() == capacity)     // WHILE, not if
                notFull.await();
            items.add(item);
            notEmpty.signal();                   // wake ONE consumer
        } finally { lock.unlock(); }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (items.isEmpty())
                notEmpty.await();
            T item = items.poll();
            notFull.signal();                    // wake ONE producer
            return item;
        } finally { lock.unlock(); }
    }

    public int size() {
        lock.lock();
        try { return items.size(); } finally { lock.unlock(); }
    }
}`,
      python: `import threading
from collections import deque

class BoundedQueue:
    def __init__(self, capacity: int) -> None:
        self._items: deque = deque()
        self._capacity = capacity
        self._lock = threading.Lock()
        self._not_full = threading.Condition(self._lock)
        self._not_empty = threading.Condition(self._lock)

    def put(self, item) -> None:
        with self._not_full:
            while len(self._items) == self._capacity:
                self._not_full.wait()
            self._items.append(item)
            self._not_empty.notify()

    def take(self):
        with self._not_empty:
            while not self._items:
                self._not_empty.wait()
            item = self._items.popleft()
            self._not_full.notify()
            return item

    def size(self) -> int:
        with self._lock:
            return len(self._items)` }
  ],
  note: `<p>Two conditions on <strong>one</strong> lock — not two locks. They guard the same state, so they must share a monitor or the waits and signals race.</p>
<p><code>signal</code> rather than <code>signalAll</code> is safe here because each wake-up makes exactly one slot or item available, so waking one waiter is precisely right. With a single shared condition you would need <code>signalAll</code>, and most wakes would be wasted.</p>`
},
{
  slug: "thread-safe-singleton", n: 196, title: "Thread-Safe Singleton", difficulty: "medium",
  statement: `<p>Create exactly one instance, lazily, safely, with no lock on the common path.</p>`,
  approaches: [
    { name: "Naive lazy initialisation", time: "—", space: "O(1)",
      note: "BROKEN. Two threads can both see null and both construct. Synchronising the whole method fixes it but locks on every single read forever.",
      java: `// BROKEN under concurrency
public static Singleton getInstance() {
    if (instance == null) instance = new Singleton();    // race
    return instance;
}

// Correct but slow: every read takes the lock
public static synchronized Singleton getInstance() {
    if (instance == null) instance = new Singleton();
    return instance;
}`,
      python: `# BROKEN under threads
def get_instance():
    global _instance
    if _instance is None:
        _instance = Singleton()      # two threads can both get here
    return _instance` },
    { name: "Double-checked locking with volatile", time: "—", space: "O(1)",
      note: "No lock on the fast path. The volatile is MANDATORY: object construction is allocate, initialise, assign, and the last two can be reordered — so another thread could see a non-null reference to a half-built object.",
      java: `public class Singleton {
    private static volatile Singleton instance;      // volatile REQUIRED

    public static Singleton getInstance() {
        if (instance == null) {                      // no lock, fast path
            synchronized (Singleton.class) {
                if (instance == null)                // re-check inside
                    instance = new Singleton();
            }
        }
        return instance;
    }
}`,
      python: `import threading

class Singleton:
    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "Singleton":
        if cls._instance is None:            # fast path, no lock
            with cls._lock:
                if cls._instance is None:    # re-check inside
                    cls._instance = cls()
        return cls._instance` },
    { name: "Let the class loader do it", time: "—", space: "O(1)", best: true,
      note: "The JVM already guarantees a class is initialised exactly once, safely. The holder class loads on first access, so it is still lazy — with no lock, no volatile and nothing to get wrong.",
      java: `public class Singleton {
    private Singleton() {}

    private static class Holder {
        static final Singleton INSTANCE = new Singleton();   // JVM guarantees
    }                                                         // once, safely

    public static Singleton getInstance() {
        return Holder.INSTANCE;      // Holder loads on first call: lazy
    }
}

// Or an enum, which also blocks reflection and serialisation attacks:
public enum Config {
    INSTANCE;
    public void doWork() { }
}`,
      python: `# Python modules are imported once and cached in sys.modules, so a
# module-level object IS a thread-safe lazy singleton.
# config.py
class _Config:
    def __init__(self) -> None:
        self.value = load()

instance = _Config()      # created once, on first import

# elsewhere:  from config import instance` }
  ],
  note: `<p><strong>Why double-checked locking needs volatile:</strong> <code>new Singleton()</code> is three steps — allocate, run the constructor, assign the reference. Steps 2 and 3 may be reordered, so another thread can see a non-null reference to an object whose fields are still zero. <code>volatile</code> forbids that reordering.</p>
<p>The holder idiom is the better answer precisely because it has none of that subtlety — it delegates the hard part to a guarantee the JVM already makes.</p>`
},
{
  slug: "concurrent-crawler", n: 197, title: "Concurrent Web Crawler", difficulty: "hard",
  statement: `<p>Crawl pages in parallel, visit each URL once, and terminate when everything reachable has been fetched.</p>`,
  approaches: [
    { name: "Shared visited set plus a task counter", time: "—", space: "O(urls)", best: true,
      note: "The hard part is not the crawling, it is knowing when to STOP — the queue being empty does not mean the work is done, because a running task may still add more.",
      java: `public class Crawler {
    private final Set<String> seen = ConcurrentHashMap.newKeySet();
    private final AtomicInteger pending = new AtomicInteger();
    private final ExecutorService pool = Executors.newFixedThreadPool(16);
    private final CountDownLatch done = new CountDownLatch(1);

    public void crawl(String start) throws InterruptedException {
        submit(start);
        done.await();                      // wait for the whole crawl
        pool.shutdown();
    }

    private void submit(String url) {
        if (!seen.add(url)) return;        // add returns false if present:
                                           // atomic check-and-insert
        pending.incrementAndGet();
        pool.submit(() -> {
            try {
                for (String link : fetchLinks(url)) submit(link);
            } catch (Exception e) {
                log.warn("failed {}", url, e);
            } finally {
                if (pending.decrementAndGet() == 0)
                    done.countDown();      // the LAST task ends the crawl
            }
        });
    }
}`,
      python: `import asyncio

async def crawl(start: str, workers: int = 16) -> set[str]:
    seen: set[str] = {start}
    queue: asyncio.Queue = asyncio.Queue()
    queue.put_nowait(start)

    async def worker() -> None:
        while True:
            url = await queue.get()
            try:
                for link in await fetch_links(url):
                    if link not in seen:       # single-threaded loop:
                        seen.add(link)         # no lock needed
                        queue.put_nowait(link)
            except Exception:
                log.warning("failed %s", url, exc_info=True)
            finally:
                queue.task_done()

    tasks = [asyncio.create_task(worker()) for _ in range(workers)]
    await queue.join()                   # all queued work is done
    for t in tasks:
        t.cancel()
    return seen` }
  ],
  note: `<p><code>seen.add(url)</code> returning false is an <strong>atomic</strong> check-and-insert. Writing <code>if (!seen.contains(url)) seen.add(url)</code> is a race no matter how concurrent the set is, and it fetches some pages twice.</p>
<p>The counter must be decremented in a <code>finally</code>. One task throwing without decrementing means the count never reaches zero and the crawl hangs forever.</p>`
},
{
  slug: "rate-limiter", n: 198, title: "Rate Limiter", difficulty: "hard",
  statement: `<p>Allow at most N operations per time window, safely under concurrent access.</p>`,
  approaches: [
    { name: "Fixed window counter", time: "O(1)", space: "O(1)",
      note: "Simplest, and it allows a burst of 2N across a window boundary — N at the end of one window and N at the start of the next.",
      java: `public class FixedWindowLimiter {
    private final int limit;
    private final long windowMillis;
    private long windowStart = System.currentTimeMillis();
    private int count = 0;

    public FixedWindowLimiter(int limit, long windowMillis) {
        this.limit = limit;
        this.windowMillis = windowMillis;
    }

    public synchronized boolean allow() {
        long now = System.currentTimeMillis();
        if (now - windowStart >= windowMillis) {   // new window
            windowStart = now;
            count = 0;
        }
        if (count < limit) { count++; return true; }
        return false;
    }
}`,
      python: `import threading
import time

class FixedWindowLimiter:
    def __init__(self, limit: int, window: float) -> None:
        self._limit = limit
        self._window = window
        self._start = time.monotonic()
        self._count = 0
        self._lock = threading.Lock()

    def allow(self) -> bool:
        with self._lock:
            now = time.monotonic()
            if now - self._start >= self._window:
                self._start, self._count = now, 0
            if self._count < self._limit:
                self._count += 1
                return True
            return False` },
    { name: "Token bucket", time: "O(1)", space: "O(1)", best: true,
      note: "Tokens refill at a steady rate up to a cap. Allows a controlled burst up to the bucket size while holding the long-run average at the refill rate — which is what real APIs use.",
      java: `public class TokenBucket {
    private final double capacity, refillPerSecond;
    private double tokens;
    private long lastRefillNanos;

    public TokenBucket(double capacity, double refillPerSecond) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.tokens = capacity;
        this.lastRefillNanos = System.nanoTime();
    }

    public synchronized boolean allow(double cost) {
        refill();
        if (tokens >= cost) { tokens -= cost; return true; }
        return false;
    }

    private void refill() {
        long now = System.nanoTime();
        double elapsed = (now - lastRefillNanos) / 1_000_000_000.0;
        tokens = Math.min(capacity, tokens + elapsed * refillPerSecond);
        lastRefillNanos = now;          // nanoTime: monotonic, unlike
    }                                   // currentTimeMillis
}`,
      python: `import threading
import time

class TokenBucket:
    def __init__(self, capacity: float, refill_per_second: float) -> None:
        self._capacity = capacity
        self._refill = refill_per_second
        self._tokens = capacity
        self._last = time.monotonic()        # monotonic, never goes backwards
        self._lock = threading.Lock()

    def allow(self, cost: float = 1.0) -> bool:
        with self._lock:
            now = time.monotonic()
            elapsed = now - self._last
            self._tokens = min(self._capacity, self._tokens + elapsed * self._refill)
            self._last = now
            if self._tokens >= cost:
                self._tokens -= cost
                return True
            return False` },
    { name: "Sliding window log", time: "O(n) per call", space: "O(n)",
      note: "Keep the timestamp of every allowed call and drop those outside the window. Exact, with no boundary burst, but memory grows with the rate.",
      java: `public class SlidingWindowLimiter {
    private final int limit;
    private final long windowMillis;
    private final Deque<Long> stamps = new ArrayDeque<>();

    public synchronized boolean allow() {
        long now = System.currentTimeMillis();
        while (!stamps.isEmpty() && now - stamps.peekFirst() >= windowMillis)
            stamps.pollFirst();                   // drop expired
        if (stamps.size() < limit) { stamps.addLast(now); return true; }
        return false;
    }
}`,
      python: `import threading
import time
from collections import deque

class SlidingWindowLimiter:
    def __init__(self, limit: int, window: float) -> None:
        self._limit = limit
        self._window = window
        self._stamps: deque[float] = deque()
        self._lock = threading.Lock()

    def allow(self) -> bool:
        with self._lock:
            now = time.monotonic()
            while self._stamps and now - self._stamps[0] >= self._window:
                self._stamps.popleft()
            if len(self._stamps) < self._limit:
                self._stamps.append(now)
                return True
            return False` }
  ],
  note: `<p><strong>Use a monotonic clock.</strong> <code>System.currentTimeMillis</code> and <code>time.time</code> can jump backwards when NTP adjusts the system clock, which makes a limiter either stall or let everything through. <code>System.nanoTime</code> and <code>time.monotonic</code> never go backwards.</p>
<p><strong>Distributed rate limiting is a different problem.</strong> Per-instance limits multiply by the number of instances, so the real limit is N × instances. A shared counter in Redis with a Lua script for atomicity is the usual answer, and it is the follow-up worth raising yourself.</p>`
}
]});
