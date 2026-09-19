registerCode("concurrent-collections", {
intro: `<p>Wrapping a collection in a lock makes it safe and slow — every thread queues on one monitor. Concurrent collections are designed for contention instead: finer-grained locking, lock-free reads, and iterators that never throw.</p>
<table>
<tr><th>Need</th><th>Java</th><th>Python</th></tr>
<tr><td>Shared map</td><td><code>ConcurrentHashMap</code></td><td><code>dict</code> (atomic ops) + lock for compounds</td></tr>
<tr><td>Shared queue</td><td><code>ConcurrentLinkedQueue</code></td><td><code>collections.deque</code></td></tr>
<tr><td>Producer / consumer</td><td><code>ArrayBlockingQueue</code></td><td><code>queue.Queue</code></td></tr>
<tr><td>Async producer / consumer</td><td><code>Flow</code>, reactive streams</td><td><code>asyncio.Queue</code></td></tr>
<tr><td>Read-mostly list</td><td><code>CopyOnWriteArrayList</code></td><td>Copy on write by hand</td></tr>
</table>
<p><strong>Fail-fast versus weakly consistent:</strong> an <code>ArrayList</code> iterator throws <code>ConcurrentModificationException</code> if the list changes underneath it. A concurrent collection's iterator never throws — it just may not reflect the very latest writes. Both are deliberate; the second is what lets you iterate while others write.</p>
<p><strong>The trap that survives every concurrent collection:</strong> individual operations are atomic, but <em>combinations</em> are not. <code>if (!map.containsKey(k)) map.put(k, v)</code> is a race no matter how thread-safe the map is. Use the atomic compound methods instead.</p>`,
questions: [
{
  slug: "shared-map", n: 185, title: "A Dictionary Shared by Many Threads", difficulty: "medium",
  statement: `<p>Several threads read and update the same map. Make it correct without serialising everything.</p>`,
  approaches: [
    { name: "Synchronised wrapper", time: "—", space: "O(n)",
      note: "Correct, and it funnels every operation through one lock. Reads block reads, which is the worst property for a read-heavy cache.",
      java: `Map<String, Integer> map =
        Collections.synchronizedMap(new HashMap<>());

map.put("a", 1);                      // one global lock

// And iteration STILL needs manual synchronisation:
synchronized (map) {
    for (Map.Entry<String, Integer> e : map.entrySet()) { ... }
}`,
      python: `import threading

lock = threading.Lock()
data: dict[str, int] = {}

with lock:
    data["a"] = 1` },
    { name: "ConcurrentHashMap with atomic compounds", time: "O(1) average", space: "O(n)", best: true,
      note: "Reads are lock-free; writes lock only the affected bin. The compound methods are the important part — they make check-then-act a single atomic operation.",
      java: `ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// RACE: two separate operations, another thread can slip between them
if (!map.containsKey(key)) map.put(key, compute(key));      // WRONG

// Atomic: computed at most once, even under contention
map.computeIfAbsent(key, k -> compute(k));

map.merge(key, 1, Integer::sum);          // atomic increment
map.putIfAbsent(key, 0);                  // atomic insert-if-missing
map.compute(key, (k, v) -> v == null ? 1 : v + 1);
map.replace(key, oldValue, newValue);     // atomic CAS on a value

// No null keys or values: null would be ambiguous with "absent"`,
      python: `import threading

# CPython dict get/set are atomic under the GIL
cache: dict[str, int] = {}
cache["a"] = 1                     # atomic
value = cache.get("a")             # atomic

# But check-then-act is NOT, exactly as in Java:
lock = threading.Lock()

def compute_if_absent(key: str):
    value = cache.get(key)
    if value is not None:
        return value
    with lock:
        if key not in cache:       # re-check INSIDE the lock
            cache[key] = compute(key)
        return cache[key]

# setdefault is atomic, but it evaluates the default eagerly:
cache.setdefault(key, 0)` }
  ],
  note: `<p><strong>Keep the lambda short inside <code>computeIfAbsent</code>.</strong> It runs while the bin is locked, so a slow call there blocks every other key hashing to the same bin — and recursively modifying the same map from inside it can deadlock outright.</p>
<p><code>size()</code> on a <code>ConcurrentHashMap</code> is an estimate under concurrent modification. Do not build logic on it being exact.</p>`
},
{
  slug: "shared-queue", n: 186, title: "A Work Queue Shared by Many Threads", difficulty: "medium",
  statement: `<p>Many threads add work; many take it. Nothing may be lost or handed out twice.</p>`,
  approaches: [
    { name: "Non-blocking queue", time: "O(1)", space: "O(n)",
      note: "Lock-free via compare-and-swap. poll() returns null immediately when empty, so the caller must decide what to do — which usually means a spin loop you did not want.",
      java: `Queue<Task> queue = new ConcurrentLinkedQueue<>();   // unbounded

queue.offer(task);                    // never blocks
Task t = queue.poll();                // null if empty, does NOT wait

// The caller ends up spinning, which burns CPU:
while (running) {
    Task next = queue.poll();
    if (next == null) { Thread.onSpinWait(); continue; }
    handle(next);
}`,
      python: `from collections import deque

queue: deque = deque()                # append/popleft are atomic
queue.append(task)
try:
    task = queue.popleft()
except IndexError:
    task = None                       # empty` },
    { name: "Bounded blocking queue", time: "O(1)", space: "O(capacity)", best: true,
      note: "Consumers block when empty instead of spinning, and producers block when full — which is backpressure. The bound is the important part: unbounded means an out-of-memory error under overload.",
      java: `BlockingQueue<Task> queue = new ArrayBlockingQueue<>(1000);   // BOUNDED

// producer
queue.put(task);                      // blocks when full: BACKPRESSURE
queue.offer(task, 1, TimeUnit.SECONDS);   // or give up

// consumer
Task t = queue.take();                // blocks until something arrives
Task t2 = queue.poll(5, TimeUnit.SECONDS);   // or give up`,
      python: `import queue

work: queue.Queue = queue.Queue(maxsize=1000)    # BOUNDED

work.put(task)                        # blocks when full
work.put(task, timeout=1)             # or raises queue.Full

task = work.get()                     # blocks until available
task = work.get(timeout=5)            # or raises queue.Empty
work.task_done()                      # pairs with join()` }
  ],
  note: `<p><strong>Always bound the queue.</strong> <code>Executors.newFixedThreadPool</code> uses an unbounded <code>LinkedBlockingQueue</code>, so under sustained overload it queues until the heap is gone rather than pushing back. That is the single most common production failure with Java thread pools.</p>`
},
{
  slug: "producer-consumer", n: 187, title: "Producer and Consumers", difficulty: "medium",
  statement: `<p>One or more producers generate work; several consumers process it. Shut down cleanly when the input is exhausted.</p>`,
  approaches: [
    { name: "Blocking queue with poison pills", time: "—", space: "O(capacity)", best: true,
      note: "A sentinel value tells each consumer to stop. Send exactly one per consumer, and re-offer it after taking so it propagates if consumer counts vary.",
      java: `public class Pipeline {
    private static final Task POISON = new Task("STOP");
    private final BlockingQueue<Task> queue = new ArrayBlockingQueue<>(1000);

    public void run(List<Task> work, int consumers) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(consumers);

        for (int i = 0; i < consumers; i++) {
            pool.submit(() -> {
                while (true) {
                    Task t = queue.take();
                    if (t == POISON) {
                        queue.put(POISON);       // pass it on to the next
                        return;
                    }
                    try { handle(t); }
                    catch (Exception e) { log.error("task failed", e); }
                }
            });
        }

        for (Task t : work) queue.put(t);        // blocks when full
        queue.put(POISON);                       // one is enough: it propagates

        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.MINUTES);
    }
}`,
      python: `import queue
import threading

POISON = object()

def run(work: list, consumers: int = 4) -> None:
    q: queue.Queue = queue.Queue(maxsize=1000)

    def consume() -> None:
        while True:
            item = q.get()
            if item is POISON:
                q.put(POISON)            # pass it on
                q.task_done()
                return
            try:
                handle(item)
            except Exception:
                log.exception("task failed")
            finally:
                q.task_done()

    threads = [threading.Thread(target=consume) for _ in range(consumers)]
    for t in threads:
        t.start()

    for item in work:
        q.put(item)
    q.put(POISON)

    for t in threads:
        t.join()` },
    { name: "Shutdown flag with a timeout", time: "—", space: "O(capacity)",
      note: "An alternative when the producer cannot append a sentinel — consumers poll with a timeout and re-check a volatile flag.",
      java: `private volatile boolean running = true;

void consume() {
    while (running || !queue.isEmpty()) {
        Task t = queue.poll(200, TimeUnit.MILLISECONDS);
        if (t != null) handle(t);
    }
}

void stop() { running = false; }`,
      python: `import queue
import threading

stop = threading.Event()

def consume(q: queue.Queue) -> None:
    while not stop.is_set() or not q.empty():
        try:
            item = q.get(timeout=0.2)
        except queue.Empty:
            continue
        handle(item)
        q.task_done()` }
  ],
  note: `<p><strong>Catch exceptions inside the consumer loop.</strong> An uncaught exception kills that consumer thread silently; the queue keeps filling and throughput quietly halves with nothing in the logs to explain it.</p>
<p>The <code>running || !queue.isEmpty()</code> ordering matters in the flag version — checking only the flag would discard whatever is still queued at shutdown.</p>`
},
{
  slug: "async-channels", n: 188, title: "Async Producer and Consumers", difficulty: "hard",
  statement: `<p>The same producer/consumer shape, but without dedicating a thread to each participant.</p>`,
  approaches: [
    { name: "Async queue on an event loop", time: "—", space: "O(capacity)", best: true,
      note: "C#'s Channels map onto asyncio.Queue in Python and onto a blocking queue plus virtual threads in Java. Nothing parks an OS thread while waiting.",
      java: `// Java 21: virtual threads make the blocking version async in effect.
// A blocked virtual thread unmounts, so its carrier runs something else.
BlockingQueue<Task> queue = new ArrayBlockingQueue<>(1000);

try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100; i++) {          // 100 cheap consumers
        executor.submit(() -> {
            while (true) {
                Task t = queue.take();       // unmounts, costs no OS thread
                if (t == POISON) { queue.put(POISON); return; }
                handle(t);
            }
        });
    }
    executor.submit(() -> {
        for (Task t : source) queue.put(t);
        queue.put(POISON);
        return null;
    });
}`,
      python: `import asyncio

async def pipeline(source, consumers: int = 10) -> None:
    queue: asyncio.Queue = asyncio.Queue(maxsize=1000)

    async def consume(worker_id: int) -> None:
        while True:
            item = await queue.get()
            try:
                if item is None:             # sentinel
                    return
                await handle(item)
            finally:
                queue.task_done()

    workers = [asyncio.create_task(consume(i)) for i in range(consumers)]

    async for item in source:
        await queue.put(item)                # waits when full: backpressure

    for _ in workers:
        await queue.put(None)                # one sentinel per consumer

    await asyncio.gather(*workers)` }
  ],
  note: `<p>With an async queue, send <strong>one sentinel per consumer</strong> rather than relying on re-offering — coroutines return immediately on the sentinel and a re-offer can race with the gather.</p>
<p><code>queue.join()</code> waits until every <code>task_done()</code> has been called, which is the cleaner shutdown signal when you do not know how many items there were.</p>`
},
{
  slug: "channel-pipeline", n: 189, title: "A Processing Pipeline", difficulty: "hard",
  statement: `<p>Chain several stages — fetch, parse, enrich, persist — each running concurrently, with backpressure between them.</p>`,
  approaches: [
    { name: "A bounded queue between each stage", time: "—", space: "O(stages·capacity)", best: true,
      note: "Each stage reads from one queue and writes to the next. Bounding every queue means a slow stage slows the whole pipeline instead of growing memory — the entire point of the design.",
      java: `public class Pipeline {
    private final BlockingQueue<Raw> parsed = new ArrayBlockingQueue<>(500);
    private final BlockingQueue<Record> enriched = new ArrayBlockingQueue<>(500);

    public void start() {
        var executor = Executors.newVirtualThreadPerTaskExecutor();

        executor.submit(() -> {                       // stage 1: fetch+parse
            for (String line : source()) parsed.put(parse(line));
            parsed.put(Raw.END);
            return null;
        });

        executor.submit(() -> {                       // stage 2: enrich
            while (true) {
                Raw r = parsed.take();
                if (r == Raw.END) { enriched.put(Record.END); return null; }
                enriched.put(enrich(r));              // blocks if stage 3 lags
            }
        });

        executor.submit(() -> {                       // stage 3: persist
            List<Record> batch = new ArrayList<>(100);
            while (true) {
                Record rec = enriched.take();
                if (rec == Record.END) { flush(batch); return null; }
                batch.add(rec);
                if (batch.size() == 100) { flush(batch); batch.clear(); }
            }
        });
    }
}`,
      python: `import asyncio

async def pipeline(source) -> None:
    parsed: asyncio.Queue = asyncio.Queue(maxsize=500)
    enriched: asyncio.Queue = asyncio.Queue(maxsize=500)

    async def stage_parse() -> None:
        async for line in source:
            await parsed.put(parse(line))
        await parsed.put(None)

    async def stage_enrich() -> None:
        while True:
            item = await parsed.get()
            if item is None:
                await enriched.put(None)
                return
            await enriched.put(await enrich(item))   # blocks if stage 3 lags

    async def stage_persist() -> None:
        batch: list = []
        while True:
            record = await enriched.get()
            if record is None:
                await flush(batch)
                return
            batch.append(record)
            if len(batch) == 100:
                await flush(batch)
                batch.clear()

    await asyncio.gather(stage_parse(), stage_enrich(), stage_persist())` }
  ],
  note: `<p><strong>The slowest stage sets the throughput</strong>, and the bounded queues make that visible: watch which queue sits full and you have found your bottleneck without a profiler.</p>
<p>Batching at the final stage is usually the biggest single win — a hundred inserts in one round trip beats a hundred round trips, regardless of how parallel the earlier stages are.</p>`
}
]});
