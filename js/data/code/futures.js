registerCode("futures", {
intro: `<p>A future is a handle to a result that does not exist yet. It lets you start work, carry on, and collect the answer later — which is how you turn a chain of slow calls into a parallel fan-out.</p>
<table>
<tr><th>Idea</th><th>Java</th><th>Python</th></tr>
<tr><td>Handle to a pending result</td><td><code>CompletableFuture&lt;T&gt;</code></td><td><code>asyncio.Task</code>, <code>Future</code></td></tr>
<tr><td>Start background work</td><td><code>supplyAsync</code></td><td><code>asyncio.create_task</code></td></tr>
<tr><td>Transform the result</td><td><code>thenApply</code></td><td><code>await</code>, then use it</td></tr>
<tr><td>Chain a dependent call</td><td><code>thenCompose</code></td><td><code>await</code> twice</td></tr>
<tr><td>Wait for all</td><td><code>allOf</code></td><td><code>asyncio.gather</code></td></tr>
<tr><td>First to finish</td><td><code>anyOf</code></td><td><code>asyncio.wait(FIRST_COMPLETED)</code></td></tr>
<tr><td>Cancel</td><td><code>cancel(true)</code>, interrupts</td><td><code>task.cancel()</code></td></tr>
</table>
<p><strong>The point is latency, not throughput.</strong> Three calls of 200 ms run sequentially take 600 ms; run together they take 200 ms. Nothing got faster — you just stopped waiting one at a time.</p>
<p><strong>Java 21 changes the calculus.</strong> With virtual threads, plain blocking code scales as well as this does and reads far better, so <code>CompletableFuture</code> is now mainly for composing existing async APIs. Knowing when a tool has been superseded is worth as much as knowing the tool.</p>`,
questions: [
{
  slug: "background-result", n: 168, title: "Get a Result From Background Work", difficulty: "easy",
  statement: `<p>Start a computation on another thread and collect its result.</p>`,
  approaches: [
    { name: "Future from an executor", time: "—", space: "O(1)",
      note: "submit returns immediately; get blocks until the result is ready. Simple, but get() blocks a whole thread and you cannot chain anything onto it.",
      java: `ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(() -> expensiveCalculation());

doSomethingElse();                       // runs while that computes

Integer result = future.get(5, TimeUnit.SECONDS);   // ALWAYS with a timeout
pool.shutdown();`,
      python: `from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=4) as pool:
    future = pool.submit(expensive_calculation)
    do_something_else()
    result = future.result(timeout=5)` },
    { name: "CompletableFuture", time: "—", space: "O(1)", best: true,
      note: "Composable: you can attach transformations, combine it with other futures and handle failures without ever blocking. Always pass your own executor for I/O.",
      java: `Executor io = Executors.newFixedThreadPool(50);

CompletableFuture<Integer> future =
    CompletableFuture.supplyAsync(() -> expensiveCalculation(), io)
                     .thenApply(value -> value * 2)
                     .exceptionally(error -> {
                         log.warn("failed, using default", error);
                         return 0;
                     });

Integer result = future.join();          // unchecked; get() throws checked`,
      python: `import asyncio

async def main() -> int:
    task = asyncio.create_task(expensive_calculation())   # starts now
    await do_something_else()
    try:
        value = await task
        return value * 2
    except Exception:
        log.warning("failed, using default")
        return 0` }
  ],
  note: `<p><strong>The default executor is a trap.</strong> Without an explicit executor, <code>supplyAsync</code> uses <code>ForkJoinPool.commonPool()</code> — sized to cores−1 and shared with parallel streams. One blocking JDBC call in there stalls unrelated work across the whole application.</p>
<p>Prefer <code>join()</code> to <code>get()</code> inside chains: it throws unchecked, so it composes with lambdas.</p>`
},
{
  slug: "async-await", n: 169, title: "Waiting Without Blocking", difficulty: "medium",
  statement: `<p>Wait for an I/O result without tying up a thread while you wait.</p>`,
  approaches: [
    { name: "Blocking on a platform thread", time: "—", space: "~1 MB per thread",
      note: "The straightforward version. Correct, readable, and it parks an expensive OS thread doing nothing for the whole network round trip.",
      java: `public Order load(String id) {
    User user = userClient.fetch(id);        // thread blocked ~100 ms
    Order order = orderClient.fetch(id);     // thread blocked ~100 ms
    return combine(user, order);             // 200 ms, one thread held
}`,
      python: `def load(order_id: str):
    user = user_client.fetch(order_id)       # thread blocked
    order = order_client.fetch(order_id)
    return combine(user, order)` },
    { name: "Non-blocking composition", time: "—", space: "O(1) per pending call",
      note: "No thread waits. The continuation runs when the result arrives, so a handful of threads can service thousands of in-flight calls.",
      java: `public CompletableFuture<Order> load(String id) {
    CompletableFuture<User> user = userClient.fetchAsync(id);
    CompletableFuture<Detail> detail = orderClient.fetchAsync(id);
    return user.thenCombine(detail, this::combine);     // both, in parallel
}`,
      python: `async def load(order_id: str):
    user, detail = await asyncio.gather(
        user_client.fetch(order_id),
        order_client.fetch(order_id),
    )
    return combine(user, detail)` },
    { name: "Virtual threads (Java 21+)", time: "—", space: "~hundreds of bytes", best: true,
      note: "Blocking code that scales. When the virtual thread blocks, the JVM unmounts it and the carrier thread runs something else — so the simple version is now also the efficient one.",
      java: `// Looks blocking, scales like async
public Order load(String id) {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var user = scope.fork(() -> userClient.fetch(id));
        var detail = scope.fork(() -> orderClient.fetch(id));
        scope.join().throwIfFailed();           // either both, or neither
        return combine(user.get(), detail.get());
    }
}

// Spring Boot 3.2+: one property and every request gets a virtual thread
// spring.threads.virtual.enabled=true`,
      python: `# Python's equivalent is asyncio TaskGroup (3.11+): if one child fails,
# the others are cancelled and the error propagates normally.
async def load(order_id: str):
    async with asyncio.TaskGroup() as group:
        user = group.create_task(user_client.fetch(order_id))
        detail = group.create_task(order_client.fetch(order_id))
    return combine(user.result(), detail.result())` }
  ],
  note: `<p><strong>Pinning</strong> is the virtual-thread trap worth naming: a virtual thread blocking inside a <code>synchronized</code> block cannot unmount, so it pins its carrier. Use <code>ReentrantLock</code> instead, which does not pin.</p>
<p>And virtual threads <em>move</em> the bottleneck rather than removing it. A million of them hitting a ten-connection HikariCP pool just queues a million threads on the pool.</p>`
},
{
  slug: "run-together", n: 170, title: "Run Independent Calls Together", difficulty: "medium",
  statement: `<p>Three independent service calls. Run them in parallel and combine the results.</p>`,
  approaches: [
    { name: "Wait for all", time: "—", space: "O(n)", best: true,
      note: "Total latency becomes the SLOWEST call, not the sum. allOf returns a future of Void, so you join each one afterwards — they have all completed by then, so those joins do not block.",
      java: `CompletableFuture<User> user   = supplyAsync(() -> api.user(id), io);
CompletableFuture<List<Order>> orders = supplyAsync(() -> api.orders(id), io);
CompletableFuture<Prefs> prefs = supplyAsync(() -> api.prefs(id), io);

Dashboard dashboard = CompletableFuture.allOf(user, orders, prefs)
        .thenApply(v -> new Dashboard(user.join(), orders.join(), prefs.join()))
        .join();`,
      python: `import asyncio

async def dashboard(user_id: str) -> Dashboard:
    user, orders, prefs = await asyncio.gather(
        api.user(user_id),
        api.orders(user_id),
        api.prefs(user_id),
    )
    return Dashboard(user, orders, prefs)` },
    { name: "First to finish wins", time: "—", space: "O(n)",
      note: "Useful for hedged requests: ask two replicas and take whichever answers first. Cancel the losers, or they keep consuming resources.",
      java: `CompletableFuture<Response> primary = callAsync(primaryRegion);
CompletableFuture<Response> backup = callAsync(backupRegion);

Response first = (Response) CompletableFuture.anyOf(primary, backup).join();
primary.cancel(true);                     // stop the loser
backup.cancel(true);`,
      python: `import asyncio

async def hedged(primary_url: str, backup_url: str):
    tasks = {asyncio.create_task(fetch(primary_url)),
             asyncio.create_task(fetch(backup_url))}
    done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    for task in pending:
        task.cancel()                     # stop the losers
    return next(iter(done)).result()` }
  ],
  note: `<p><code>gather</code> fails fast by default: one exception propagates immediately while the others keep running in the background. Pass <code>return_exceptions=True</code> to collect every outcome instead — which is what you want when partial results are usable.</p>
<p>In Java, <code>allOf</code> completes exceptionally if any input does, and <code>join()</code> then throws a <code>CompletionException</code> wrapping the real cause.</p>`
},
{
  slug: "timeout", n: 171, title: "Give Up After a Time Limit", difficulty: "medium",
  statement: `<p>Abandon a call that takes too long, and fall back to something usable.</p>`,
  approaches: [
    { name: "Timeout with a fallback", time: "—", space: "O(1)", best: true,
      note: "completeOnTimeout substitutes a default; orTimeout fails instead. Both are non-blocking, unlike passing a timeout to get().",
      java: `CompletableFuture<Stock> stock =
    CompletableFuture.supplyAsync(() -> inventory.check(sku), io)
        .completeOnTimeout(Stock.UNKNOWN, 300, TimeUnit.MILLISECONDS)
        .exceptionally(error -> {
            log.warn("inventory unavailable", error);
            return Stock.UNKNOWN;
        });

// orTimeout fails rather than substituting
CompletableFuture<Payment> payment =
    CompletableFuture.supplyAsync(() -> gateway.charge(order), io)
        .orTimeout(5, TimeUnit.SECONDS);   // TimeoutException on expiry`,
      python: `import asyncio

async def check_stock(sku: str) -> Stock:
    try:
        return await asyncio.wait_for(inventory.check(sku), timeout=0.3)
    except asyncio.TimeoutError:
        return Stock.UNKNOWN               # the task is cancelled for you
    except Exception:
        log.warning("inventory unavailable")
        return Stock.UNKNOWN` }
  ],
  note: `<p><strong>A timeout does not stop the work.</strong> In Java the underlying task keeps running and keeps holding its thread and connection — you have only stopped <em>waiting</em>. Pair the timeout with a cancellation that the task actually observes, or you leak resources under load.</p>
<p><code>asyncio.wait_for</code> is better behaved: it cancels the awaited task on expiry.</p>
<p><strong>Timeout budgets:</strong> each hop downstream must get a smaller budget than its caller. A gateway at 1 s in front of A(800 ms) → B(800 ms) is nonsense — the client gave up long before B was asked.</p>`
},
{
  slug: "continuations", n: 172, title: "Do This, Then That", difficulty: "medium",
  statement: `<p>Chain dependent steps, where each needs the previous result.</p>`,
  approaches: [
    { name: "thenApply vs thenCompose", time: "—", space: "O(1)", best: true,
      note: "thenApply is map; thenCompose is flatMap. If your lambda already returns a future, thenApply gives you a nested future and thenCompose flattens it. The distinction gets asked directly.",
      java: `// thenApply: the lambda returns a plain value
CompletableFuture<String> name =
    fetchUser(id).thenApply(user -> user.getName());

// thenCompose: the lambda returns ANOTHER future - flattened
CompletableFuture<Order> order =
    fetchUser(id).thenCompose(user -> fetchLatestOrder(user));

// Using thenApply here would give the awkward nested type:
CompletableFuture<CompletableFuture<Order>> nested =
    fetchUser(id).thenApply(user -> fetchLatestOrder(user));

// thenCombine merges two INDEPENDENT futures
CompletableFuture<Invoice> invoice =
    fetchOrder(id).thenCombine(fetchCustomer(id), Invoice::new);`,
      python: `# Python has no distinction: await flattens naturally.
async def pipeline(user_id: str) -> Order:
    user = await fetch_user(user_id)       # like thenApply
    order = await fetch_latest_order(user) # like thenCompose
    return order

async def invoice(order_id: str) -> Invoice:
    order, customer = await asyncio.gather(
        fetch_order(order_id),
        fetch_customer(order_id),
    )
    return Invoice(order, customer)` },
    { name: "Async variants and thread control", time: "—", space: "O(1)",
      note: "The non-Async forms may run on whichever thread completed the previous stage — including the caller's. For anything long-running, use the Async variant with your own executor.",
      java: `// May run on the completing thread, or even the caller's
future.thenApply(this::transform);

// Guaranteed to run on the given executor
future.thenApplyAsync(this::transform, io);

// Side effects at the end of a chain
future.thenAccept(result -> log.info("got {}", result))
      .thenRun(() -> metrics.increment("done"));`,
      python: `# asyncio runs continuations on the event loop thread. For CPU-bound
# work, hand it to a pool so the loop is not blocked.
loop = asyncio.get_running_loop()
result = await loop.run_in_executor(None, cpu_heavy_transform, data)` }
  ],
  note: `<p>Same map/flatMap distinction as in Streams and Optional. If the lambda's return type already has the wrapper, you want the <code>compose</code>/<code>flatMap</code> form.</p>`
},
{
  slug: "cancellation", n: 173, title: "Stop Work Early", difficulty: "medium",
  statement: `<p>Cancel an in-flight operation — because the user navigated away, or a faster answer arrived.</p>`,
  approaches: [
    { name: "Cooperative cancellation", time: "—", space: "O(1)", best: true,
      note: "Neither language can forcibly stop a thread safely. Cancellation is a REQUEST the task must check for; code that never checks cannot be cancelled.",
      java: `public void process(List<Item> items) {
    for (Item item : items) {
        if (Thread.currentThread().isInterrupted()) {   // CHECK it
            log.info("cancelled, stopping early");
            return;
        }
        handle(item);
    }
}

// Blocking calls throw InterruptedException. Never swallow it:
try {
    queue.take();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();     // RESTORE the flag
    return;                                  // and stop
}

Future<?> task = pool.submit(job);
task.cancel(true);                           // true = interrupt if running`,
      python: `import asyncio

async def process(items: list) -> None:
    for item in items:
        await handle(item)          # cancellation lands at an await point

task = asyncio.create_task(process(items))
task.cancel()
try:
    await task
except asyncio.CancelledError:
    log.info("cancelled")
    raise                           # do NOT swallow: re-raise` },
    { name: "A shared cancellation flag", time: "—", space: "O(1)",
      note: "For work that never blocks, a volatile flag or an AtomicBoolean is the simplest signal. It must be volatile, or the worker may never observe the change.",
      java: `public class Job implements Runnable {
    private volatile boolean cancelled = false;    // volatile is REQUIRED

    public void cancel() { cancelled = true; }

    @Override public void run() {
        while (!cancelled && hasMoreWork()) {
            doChunk();
        }
    }
}`,
      python: `import threading

class Job:
    def __init__(self) -> None:
        self._stop = threading.Event()

    def cancel(self) -> None:
        self._stop.set()

    def run(self) -> None:
        while not self._stop.is_set() and self.has_more_work():
            self.do_chunk()` }
  ],
  note: `<p><strong>Never swallow <code>InterruptedException</code>.</strong> Catching it clears the interrupt flag, so every layer above yours loses the signal and the thread becomes uncancellable. Either re-throw it, or restore the flag with <code>Thread.currentThread().interrupt()</code> and return.</p>
<p>Same rule in Python: catching <code>CancelledError</code> without re-raising breaks cancellation for everything above you.</p>`
},
{
  slug: "async-errors", n: 174, title: "Handling Errors in Tasks", difficulty: "medium",
  statement: `<p>An exception thrown inside a background task does not reach the caller's try/catch. Handle it properly.</p>`,
  approaches: [
    { name: "exceptionally, handle, whenComplete", time: "—", space: "O(1)", best: true,
      note: "Three tools with different jobs. exceptionally recovers with a value; handle sees both outcomes and can transform; whenComplete observes without changing anything.",
      java: `CompletableFuture<Price> price = supplyAsync(() -> api.quote(sku), io)

    // recover: supply a fallback VALUE on failure
    .exceptionally(error -> {
        log.warn("quote failed for {}", sku, error);
        return Price.UNAVAILABLE;
    })

    // or see both, and transform either
    .handle((value, error) ->
        error != null ? Price.UNAVAILABLE : value.withTax())

    // or just observe: cannot change the outcome
    .whenComplete((value, error) ->
        metrics.record(error == null ? "ok" : "fail"));

// The cause is WRAPPED in a CompletionException
try {
    price.join();
} catch (CompletionException e) {
    Throwable real = e.getCause();      // unwrap to get the original
}`,
      python: `async def quote(sku: str) -> Price:
    try:
        value = await api.quote(sku)
        return value.with_tax()
    except Exception:
        log.warning("quote failed for %s", sku, exc_info=True)
        return Price.UNAVAILABLE
    finally:
        metrics.record("done")          # like whenComplete` },
    { name: "The silent failure", time: "—", space: "O(1)",
      note: "The real danger. A future that fails with no handler and nobody joining it produces NO stack trace anywhere — the exception is stored in the future and discarded when it is collected.",
      java: `// BUG: nothing observes this future, so the failure vanishes
CompletableFuture.supplyAsync(() -> riskyOperation(), io);

// Fixed: always terminate a chain with a handler
CompletableFuture.supplyAsync(() -> riskyOperation(), io)
    .whenComplete((value, error) -> {
        if (error != null) log.error("background job failed", error);
    });`,
      python: `# BUG: a fire-and-forget task whose exception nobody retrieves
asyncio.create_task(risky_operation())      # warning only at GC time

# Fixed: keep a reference and attach a callback
task = asyncio.create_task(risky_operation())
task.add_done_callback(
    lambda t: log.error("failed", exc_info=t.exception()) if not t.cancelled()
    and t.exception() else None
)` }
  ],
  note: `<p>Always unwrap in Java. The exception surfaces as <code>CompletionException</code> (or <code>ExecutionException</code> from <code>get()</code>) wrapping the real cause, so catching your own exception type directly never matches.</p>
<p>Fire-and-forget is the most common source of invisible production failures in async code: the work fails, nothing logs, and the symptom appears somewhere else entirely.</p>`
},
{
  slug: "async-streams", n: 175, title: "Process Items as They Arrive", difficulty: "hard",
  statement: `<p>Consume results one at a time as they become available, rather than waiting for the whole batch.</p>`,
  approaches: [
    { name: "Stream results as they complete", time: "—", space: "O(1) per item", best: true,
      note: "Start processing the first result immediately instead of blocking for the slowest. Essential when the producer is unbounded or the batch is large.",
      java: `// Process each future in COMPLETION order, not submission order
ExecutorCompletionService<Result> service =
    new ExecutorCompletionService<>(pool);

for (Request r : requests) service.submit(() -> call(r));

for (int i = 0; i < requests.size(); i++) {
    Future<Result> next = service.take();      // whichever finished first
    handle(next.get());
}`,
      python: `import asyncio

async def process_as_they_arrive(requests: list) -> None:
    tasks = [asyncio.create_task(call(r)) for r in requests]
    for finished in asyncio.as_completed(tasks):
        result = await finished                # completion order
        handle(result)


# Or a true async generator, for an unbounded source
async def read_pages(url: str):
    while url:
        page = await fetch(url)
        for item in page.items:
            yield item                         # consumer sees it immediately
        url = page.next_url


async def consume() -> None:
    async for item in read_pages(start_url):
        await handle(item)` },
    { name: "Backpressure with a bounded channel", time: "—", space: "O(capacity)",
      note: "Without a bound, a fast producer fills memory until the process dies. A bounded queue makes the producer wait, which is real backpressure rather than hope.",
      java: `BlockingQueue<Item> queue = new ArrayBlockingQueue<>(1000);   // BOUNDED

// producer blocks when full
producerPool.submit(() -> {
    for (Item i : source) queue.put(i);        // put() blocks, offer() drops
    queue.put(POISON_PILL);                    // signal the end
});

// consumer
consumerPool.submit(() -> {
    while (true) {
        Item item = queue.take();
        if (item == POISON_PILL) break;
        handle(item);
    }
});`,
      python: `import asyncio

async def pipeline() -> None:
    queue: asyncio.Queue = asyncio.Queue(maxsize=1000)   # BOUNDED

    async def producer() -> None:
        async for item in source():
            await queue.put(item)          # blocks when full
        await queue.put(None)              # sentinel

    async def consumer() -> None:
        while True:
            item = await queue.get()
            if item is None:
                break
            await handle(item)

    await asyncio.gather(producer(), consumer())` }
  ],
  note: `<p>An <strong>unbounded</strong> queue converts backpressure into an out-of-memory error. Bound it, and decide explicitly what happens when it is full: block the producer, drop the item, or reject with an error. All three are valid; silently growing is not.</p>`
},
{
  slug: "bounded-parallelism", n: 176, title: "Many Async Calls, a Few at a Time", difficulty: "medium",
  statement: `<p>Make ten thousand HTTP calls, but never more than twenty concurrently.</p>`,
  approaches: [
    { name: "Semaphore around the call", time: "—", space: "O(limit)", best: true,
      note: "The limit exists to protect the downstream service, not you. Firing all ten thousand at once is how you take out someone else's API — and get rate-limited or blocked.",
      java: `public List<Result> callAll(List<Request> requests) {
    Semaphore permits = new Semaphore(20);

    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<Result>> futures = requests.stream()
            .map(r -> executor.submit(() -> {
                permits.acquire();
                try { return client.send(r); }
                finally { permits.release(); }
            }))
            .toList();

        List<Result> out = new ArrayList<>();
        for (Future<Result> f : futures) out.add(f.get());
        return out;
    } catch (Exception e) {
        throw new RuntimeException(e);
    }
}`,
      python: `import asyncio

async def call_all(requests: list, limit: int = 20) -> list:
    semaphore = asyncio.Semaphore(limit)

    async def one(request):
        async with semaphore:              # at most "limit" in flight
            return await client.send(request)

    return await asyncio.gather(*(one(r) for r in requests))` },
    { name: "A fixed pool as the limit", time: "—", space: "O(pool)",
      note: "The pool size IS the concurrency limit. Simpler, but it couples the limit to the thread count, so one limit applies to every downstream service.",
      java: `// The pool size bounds concurrency implicitly
ExecutorService pool = Executors.newFixedThreadPool(20);
List<Future<Result>> futures = requests.stream()
        .map(r -> pool.submit(() -> client.send(r)))
        .toList();`,
      python: `from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=20) as pool:
    results = list(pool.map(client.send, requests))` }
  ],
  note: `<p>With virtual threads the pool no longer bounds anything, so the semaphore becomes <em>necessary</em> rather than optional. That is the important consequence of Java 21: thread count used to provide rate limiting by accident, and now nothing does.</p>
<p>Use a separate semaphore per downstream service. One shared limit means a slow service starves calls to a healthy one.</p>`
},
{
  slug: "callback-to-future", n: 177, title: "Turn a Callback API Into a Future", difficulty: "hard",
  statement: `<p>Wrap an old callback-style API so it can be awaited and composed like any other future.</p>`,
  approaches: [
    { name: "Complete a future from the callback", time: "—", space: "O(1)", best: true,
      note: "Create an empty future, hand its completion methods to the callback, and return it. Both the success and failure paths must complete it, or the caller waits forever.",
      java: `public CompletableFuture<Response> sendAsync(Request request) {
    CompletableFuture<Response> future = new CompletableFuture<>();

    legacyClient.send(request, new Callback() {
        @Override public void onSuccess(Response r) {
            future.complete(r);
        }
        @Override public void onFailure(Throwable error) {
            future.completeExceptionally(error);    // MUST handle this path
        }
    });

    return future;
}

// Now it composes like anything else
sendAsync(request)
    .orTimeout(5, TimeUnit.SECONDS)
    .thenApply(Response::body)
    .exceptionally(e -> "fallback");`,
      python: `import asyncio

def send_async(request) -> asyncio.Future:
    loop = asyncio.get_running_loop()
    future = loop.create_future()

    def on_success(response) -> None:
        # callbacks fire on another thread: hop back to the loop
        loop.call_soon_threadsafe(future.set_result, response)

    def on_failure(error: Exception) -> None:
        loop.call_soon_threadsafe(future.set_exception, error)

    legacy_client.send(request, on_success, on_failure)
    return future


async def use() -> str:
    try:
        response = await asyncio.wait_for(send_async(request), timeout=5)
        return response.body
    except Exception:
        return "fallback"` }
  ],
  note: `<p>Three ways to get this wrong, all of which hang the caller: forgetting the failure path, letting the callback throw before completing the future, and a callback that never fires at all. Always pair it with a timeout at the call site.</p>
<p>In Python the callback usually arrives on a different thread, so completing the future directly is unsafe — <code>call_soon_threadsafe</code> hops back onto the event loop.</p>`
}
]});
