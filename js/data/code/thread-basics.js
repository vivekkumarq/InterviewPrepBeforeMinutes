registerCode("thread-basics", {
intro: `<p>A thread is an independent path of execution inside one process. Threads share memory, which is what makes them fast to coordinate and dangerous to get wrong.</p>
<table>
<tr><th>Concept</th><th>Java</th><th>Python</th></tr>
<tr><td>Start one</td><td><code>new Thread(runnable).start()</code></td><td><code>threading.Thread(target=fn).start()</code></td></tr>
<tr><td>Pool</td><td><code>ExecutorService</code></td><td><code>ThreadPoolExecutor</code></td></tr>
<tr><td>Wait for one</td><td><code>t.join()</code></td><td><code>t.join()</code></td></tr>
<tr><td>Cheap threads</td><td><strong>Virtual threads</strong> (21+)</td><td><code>asyncio</code> tasks</td></tr>
<tr><td>True CPU parallelism</td><td>Yes</td><td><strong>No — the GIL.</strong> Use <code>multiprocessing</code></td></tr>
</table>
<p><strong>Python's Global Interpreter Lock</strong> allows only one thread to execute bytecode at a time. Threads still help for I/O, because the lock is released while waiting on the network or disk — but they will not use more than one core for computation. That is the single most important difference between the two languages here, and it decides which tool you reach for.</p>
<p><strong>Threads are expensive in Java</strong> — roughly 1 MB of stack each — so you pool them. Java 21's virtual threads change that: they start at a few hundred bytes and you create one per task without a pool.</p>`,
questions: [
{
  slug: "first-threads", n: 157, title: "Your First Threads", difficulty: "easy",
  statement: `<p>Start several threads, have each do some work, and wait for all of them to finish.</p>`,
  approaches: [
    { name: "Raw threads with join", time: "—", space: "O(threads)",
      note: "Fine for a handful of long-lived threads. Creating one per task does not scale — each carries an OS thread and about a megabyte of stack.",
      java: `public static void main(String[] args) throws InterruptedException {
    List<Thread> threads = new ArrayList<>();
    for (int i = 0; i < 5; i++) {
        int id = i;                          // must be effectively final
        Thread t = new Thread(() -> {
            System.out.println("worker " + id + " on " +
                               Thread.currentThread().getName());
        }, "worker-" + id);                  // NAME them: unnamed threads
        threads.add(t);                      // make a 3am thread dump useless
        t.start();                           // start(), NOT run()
    }
    for (Thread t : threads) t.join();       // wait for each
    System.out.println("all done");
}`,
      python: `import threading

def main() -> None:
    threads = []
    for i in range(5):
        t = threading.Thread(target=lambda id=i: print(f"worker {id}"),
                             name=f"worker-{i}")
        threads.append(t)
        t.start()
    for t in threads:
        t.join()
    print("all done")` },
    { name: "Virtual threads (Java 21+)", time: "—", space: "~hundreds of bytes each",
      note: "One virtual thread per task, no pool. When it blocks on I/O the JVM unmounts it from its carrier thread, so blocking stops costing an OS thread.",
      java: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        int id = i;
        executor.submit(() -> {
            callSomeSlowApi(id);             // blocking is now cheap
            return null;
        });
    }
}   // close() waits for every task: try-with-resources IS the join`,
      python: `import asyncio

async def main() -> None:
    async def worker(i: int) -> None:
        await call_some_slow_api(i)          # cooperative, not preemptive

    await asyncio.gather(*(worker(i) for i in range(10_000)))

asyncio.run(main())` }
  ],
  note: `<p><strong>Call <code>start()</code>, never <code>run()</code>.</strong> <code>run()</code> executes the body on the current thread — the code works, produces the right output, and is completely single-threaded. It is the most common beginner bug precisely because nothing looks wrong.</p>
<p>Name your threads. A dump full of <code>Thread-7</code> tells you nothing when you are debugging a hang at 3am.</p>`
},
{
  slug: "thread-pool", n: 158, title: "The Thread Pool", difficulty: "easy",
  statement: `<p>Run many short tasks without creating a thread for each one.</p>`,
  approaches: [
    { name: "Fixed pool", time: "—", space: "O(pool size)", best: true,
      note: "Reuses a fixed set of threads and queues the rest. Always shut it down — pool threads are non-daemon in Java and will keep the JVM alive forever.",
      java: `ExecutorService pool = Executors.newFixedThreadPool(8);
try {
    List<Future<Integer>> futures = new ArrayList<>();
    for (int i = 0; i < 100; i++) {
        int id = i;
        futures.add(pool.submit(() -> process(id)));   // returns a Future
    }
    for (Future<Integer> f : futures)
        System.out.println(f.get());                   // blocks until ready
} finally {
    pool.shutdown();                                   // stop accepting work
    if (!pool.awaitTermination(30, TimeUnit.SECONDS))
        pool.shutdownNow();                            // interrupt stragglers
}`,
      python: `from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=8) as pool:        # closes on exit
    futures = [pool.submit(process, i) for i in range(100)]
    for f in futures:
        print(f.result())                              # blocks until ready` },
    { name: "Sizing it deliberately", time: "—", space: "O(pool size)",
      note: "The right size depends entirely on what the tasks do. Guessing is how you end up with a pool that is simultaneously too big for the database and too small for the CPU.",
      java: `int cores = Runtime.getRuntime().availableProcessors();

// CPU-bound: one thread per core. More just adds context switching.
ExecutorService cpu = Executors.newFixedThreadPool(cores);

// I/O-bound: threads spend most of their time waiting, so more helps.
// Rough rule: cores * (1 + waitTime / computeTime)
ExecutorService io = new ThreadPoolExecutor(
        20, 50, 60L, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(1000),                 // BOUNDED queue
        new ThreadPoolExecutor.CallerRunsPolicy());     // backpressure`,
      python: `import os

cores = os.cpu_count() or 1

# CPU-bound in Python: threads do NOT help because of the GIL.
from concurrent.futures import ProcessPoolExecutor
cpu = ProcessPoolExecutor(max_workers=cores)

# I/O-bound: threads are fine, the GIL is released while waiting.
from concurrent.futures import ThreadPoolExecutor
io = ThreadPoolExecutor(max_workers=32)` }
  ],
  note: `<p><strong>Use a bounded queue.</strong> <code>Executors.newFixedThreadPool</code> uses an unbounded <code>LinkedBlockingQueue</code>, so under overload it queues until the heap is exhausted rather than pushing back. A bounded queue plus <code>CallerRunsPolicy</code> makes the submitter slow down, which is real backpressure.</p>
<p>Two shutdown methods: <code>shutdown()</code> stops accepting new work and lets running tasks finish; <code>shutdownNow()</code> interrupts them. Call the first, wait, then the second.</p>`
},
{
  slug: "race-condition", n: 159, title: "Race Condition: Lost Updates", difficulty: "medium",
  statement: `<p>Two threads each increment a shared counter a million times. Why is the total not two million?</p>`,
  approaches: [
    { name: "Unsynchronised counter", time: "—", space: "O(1)",
      note: "BROKEN. count++ is three operations — read, add, write. Two threads can read the same value, both add one, and both write back the same result. One increment vanishes.",
      java: `class Counter {
    private int count = 0;

    public void increment() {
        count++;          // READ, ADD, WRITE - not atomic
    }

    public int get() { return count; }
}
// Two threads x 1,000,000 increments reliably produces LESS than 2,000,000.`,
      python: `class Counter:
    def __init__(self) -> None:
        self.count = 0

    def increment(self) -> None:
        self.count += 1   # also read-modify-write, also not atomic` },
    { name: "volatile alone", time: "—", space: "O(1)",
      note: "STILL BROKEN, and this is the trap. volatile fixes VISIBILITY — other threads see the latest value — but does nothing for ATOMICITY. The read-add-write can still interleave.",
      java: `private volatile int count = 0;

public void increment() {
    count++;              // visible, but STILL not atomic
}
// volatile is correct for a one-way flag, or for publishing a reference.
// It is never enough for a compound action like increment.`,
      python: `# Python has no volatile. The GIL makes individual bytecodes atomic,
# but += compiles to several, so the same interleaving happens.` },
    { name: "Atomic or lock", time: "—", space: "O(1)", best: true,
      note: "An atomic uses a compare-and-swap loop in hardware — no lock, no blocking. A lock is the general answer when several fields must change together.",
      java: `// Lock-free, and the right choice for a single counter
AtomicInteger count = new AtomicInteger();
count.incrementAndGet();

// Under heavy contention, LongAdder is faster: it keeps per-thread
// cells and sums them on read, avoiding the CAS retry storm.
LongAdder busy = new LongAdder();
busy.increment();

// A lock, when more than one field must change together
private final ReentrantLock lock = new ReentrantLock();
public void transfer(int amount) {
    lock.lock();
    try { from -= amount; to += amount; }    // both, or neither
    finally { lock.unlock(); }               // ALWAYS in finally
}`,
      python: `import threading
import itertools

# A lock is the straightforward answer
class Counter:
    def __init__(self) -> None:
        self._count = 0
        self._lock = threading.Lock()

    def increment(self) -> None:
        with self._lock:
            self._count += 1

    @property
    def value(self) -> int:
        with self._lock:
            return self._count

# Or sidestep it: itertools.count() is atomic at the C level
counter = itertools.count()
next(counter)` }
  ],
  note: `<p><strong>Why the bug is intermittent:</strong> the interleaving needs both threads inside the same three instructions at once. On one core with light load it may never happen; under production load it happens constantly. That is why "it worked on my machine" is worthless evidence for concurrency.</p>
<p>Always release a lock in a <code>finally</code> block. An exception inside the critical section otherwise leaves it held forever, and every other thread hangs.</p>`
}
]});
