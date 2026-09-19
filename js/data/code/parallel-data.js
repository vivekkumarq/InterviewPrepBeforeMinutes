registerCode("parallel-data", {
intro: `<p>Data parallelism is splitting one large computation across cores. It is a different problem from concurrency: concurrency is about <em>structure</em> — many things in flight — while parallelism is about <em>speed</em> on work you could have done sequentially.</p>
<table>
<tr><th>Task</th><th>Java</th><th>Python</th></tr>
<tr><td>Parallel loop</td><td><code>IntStream.range().parallel()</code></td><td><code>ProcessPoolExecutor.map</code></td></tr>
<tr><td>Parallel reduce</td><td><code>stream().parallel().reduce()</code></td><td><code>multiprocessing</code> + reduce</td></tr>
<tr><td>Divide and conquer</td><td><code>ForkJoinPool</code>, <code>RecursiveTask</code></td><td><code>ProcessPoolExecutor</code></td></tr>
<tr><td>Independent jobs</td><td><code>invokeAll</code></td><td><code>gather</code> / pool</td></tr>
</table>
<p><strong>Python's GIL makes threads useless for this.</strong> Only one thread executes bytecode at a time, so CPU-bound parallelism needs <em>processes</em> — which means data is pickled between them, and that cost often eats the gain. Java threads are genuinely parallel, so the same code shape behaves completely differently in the two languages.</p>
<p><strong>Parallel is not automatically faster.</strong> Splitting, coordinating and merging all cost. Below roughly 10,000 elements of real work, sequential usually wins — and you must measure rather than assume.</p>`,
questions: [
{
  slug: "parallel-for", n: 178, title: "Use Every Core", difficulty: "medium",
  statement: `<p>Apply an expensive function to every element of a large collection, using all available cores.</p>`,
  approaches: [
    { name: "Parallel stream", time: "O(n/cores)", space: "O(n)", best: true,
      note: "One word turns a sequential stream parallel. The catch is the shared pool: every parallel stream in the JVM uses the same ForkJoinPool.commonPool.",
      java: `// Sequential
List<Result> results = items.stream()
        .map(this::expensiveTransform)
        .toList();

// Parallel: splits across ForkJoinPool.commonPool()
List<Result> parallel = items.parallelStream()
        .map(this::expensiveTransform)
        .toList();

// Run on YOUR pool instead of the shared one
ForkJoinPool pool = new ForkJoinPool(8);
try {
    List<Result> isolated = pool.submit(() ->
        items.parallelStream().map(this::expensiveTransform).toList()
    ).get();
} finally {
    pool.shutdown();
}`,
      python: `from concurrent.futures import ProcessPoolExecutor
import os

# Threads will NOT help here: the GIL serialises bytecode.
# Processes give real parallelism, at the cost of pickling.
def transform_all(items: list) -> list:
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as pool:
        return list(pool.map(expensive_transform, items, chunksize=100))
# chunksize matters: without it each item is a separate IPC round trip` },
    { name: "Fork/join for divide and conquer", time: "O(n/cores)", space: "O(log n)",
      note: "For recursive splitting with a sequential cutoff. Work stealing keeps idle threads busy by taking tasks from the back of other threads' queues.",
      java: `public class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 10_000;     // below this, go direct
    private final long[] data;
    private final int lo, hi;

    SumTask(long[] data, int lo, int hi) {
        this.data = data; this.lo = lo; this.hi = hi;
    }

    @Override protected Long compute() {
        if (hi - lo <= THRESHOLD) {                   // small enough
            long total = 0;
            for (int i = lo; i < hi; i++) total += data[i];
            return total;
        }
        int mid = lo + (hi - lo) / 2;
        SumTask left = new SumTask(data, lo, mid);
        left.fork();                                  // queue the left half
        SumTask right = new SumTask(data, mid, hi);
        long rightResult = right.compute();           // do the right HERE
        return rightResult + left.join();             // then collect
    }
}`,
      python: `from concurrent.futures import ProcessPoolExecutor

def parallel_sum(data: list[int], workers: int = 4) -> int:
    chunk = max(1, len(data) // workers)
    pieces = [data[i:i + chunk] for i in range(0, len(data), chunk)]
    with ProcessPoolExecutor(max_workers=workers) as pool:
        return sum(pool.map(sum, pieces))` }
  ],
  note: `<p><strong>Never block inside a parallel stream.</strong> The common pool has cores−1 threads and is shared JVM-wide; one blocking JDBC call in a parallel stream can stall unrelated parallel work everywhere else.</p>
<p>In fork/join, <code>fork()</code> one half and <code>compute()</code> the other on the current thread. Forking both wastes a thread that then just waits.</p>`
},
{
  slug: "parallel-sum", n: 179, title: "Add Up Numbers in Parallel", difficulty: "medium",
  statement: `<p>Sum a huge array across cores, correctly.</p>`,
  approaches: [
    { name: "Shared accumulator", time: "—", space: "O(1)",
      note: "BROKEN. Every thread read-modify-writes the same variable, so increments are lost. Making it volatile does not help — that fixes visibility, not atomicity.",
      java: `long total = 0;                       // WRONG
items.parallelStream().forEach(x -> total += x);   // will not even compile
                                                    // (not effectively final)
// With an AtomicLong it compiles and is correct, but every thread
// contends on one cache line and it is often SLOWER than sequential.`,
      python: `total = 0                             # WRONG under threads
def add(x):
    global total
    total += x                        # read-modify-write, loses updates` },
    { name: "Reduce with no shared state", time: "O(n/cores)", space: "O(1)", best: true,
      note: "Each thread sums its own chunk, then the partial sums are combined. No shared mutable state, so no locks and no contention.",
      java: `// Each split accumulates independently, then partials are merged
long total = Arrays.stream(data).parallel().sum();

// The general form: identity, accumulator, combiner
long total = items.parallelStream()
        .reduce(0L,
                (partial, item) -> partial + item.value(),   // within a chunk
                Long::sum);                                   // across chunks

// Summary statistics in one pass
LongSummaryStatistics stats = Arrays.stream(data).parallel().summaryStatistics();
System.out.println(stats.getSum() + " " + stats.getAverage());`,
      python: `from concurrent.futures import ProcessPoolExecutor
import functools, operator

def parallel_sum(data: list[int], workers: int = 4) -> int:
    chunk = max(1, len(data) // workers)
    pieces = [data[i:i + chunk] for i in range(0, len(data), chunk)]
    with ProcessPoolExecutor(max_workers=workers) as pool:
        partials = pool.map(sum, pieces)
    return functools.reduce(operator.add, partials, 0)` },
    { name: "LongAdder for genuine counting", time: "—", space: "O(cores)",
      note: "When you really must count across threads — request totals, hit counters — LongAdder keeps per-thread cells and sums on read, so threads stop fighting over one cache line.",
      java: `LongAdder requests = new LongAdder();

// called from many threads, no contention on a single field
requests.increment();
requests.add(5);

long total = requests.sum();          // O(cells), reads all the cells`,
      python: `import threading
from collections import defaultdict

# Per-thread counters, summed on read: the same idea as LongAdder
class ShardedCounter:
    def __init__(self) -> None:
        self._local = threading.local()
        self._all: dict[int, int] = defaultdict(int)
        self._lock = threading.Lock()

    def increment(self) -> None:
        tid = threading.get_ident()
        with self._lock:
            self._all[tid] += 1

    def total(self) -> int:
        with self._lock:
            return sum(self._all.values())` }
  ],
  note: `<p><strong>The reduction must be associative</strong> for a parallel reduce to be correct: the runtime may combine chunks in any order. Addition is; subtraction is not — <code>(a−b)−c ≠ a−(b−c)</code> — so a parallel "reduce by subtraction" silently returns different answers on different runs.</p>
<p>Floating-point addition is <em>not</em> perfectly associative either, so a parallel double sum can differ slightly from the sequential one. That is usually acceptable, but it must be a decision rather than a surprise.</p>`
},
{
  slug: "parallel-query", n: 180, title: "Parallel Queries Over Collections", difficulty: "medium",
  statement: `<p>Filter, transform and aggregate a large collection across cores.</p>`,
  approaches: [
    { name: "Parallel stream pipeline", time: "O(n/cores)", space: "O(n)", best: true,
      note: "The whole pipeline runs in parallel. Splitting works best on structures that divide cheaply — arrays and ArrayList split by index; LinkedList must be walked, so it parallelises badly.",
      java: `// C# PLINQ maps directly onto parallel streams
Map<String, Long> byCategory = products.parallelStream()
        .filter(p -> p.price() > 100)
        .collect(Collectors.groupingByConcurrent(     // CONCURRENT collector
                Product::category,
                Collectors.counting()));

// Order-sensitive work: forEachOrdered costs the parallelism benefit
products.parallelStream()
        .map(this::enrich)
        .forEachOrdered(this::writeInOrder);

// Short-circuit still works
Optional<Product> any = products.parallelStream()
        .filter(p -> p.sku().equals(target))
        .findAny();                 // findAny, not findFirst: cheaper`,
      python: `from concurrent.futures import ProcessPoolExecutor
from collections import Counter

def by_category(products: list, workers: int = 4) -> Counter:
    chunk = max(1, len(products) // workers)
    pieces = [products[i:i + chunk] for i in range(0, len(products), chunk)]

    with ProcessPoolExecutor(max_workers=workers) as pool:
        partials = pool.map(_count_chunk, pieces)

    total: Counter = Counter()
    for c in partials:
        total.update(c)             # merge the partial counters
    return total


def _count_chunk(chunk: list) -> Counter:
    return Counter(p.category for p in chunk if p.price > 100)` }
  ],
  note: `<p><code>groupingByConcurrent</code> rather than <code>groupingBy</code>: the plain collector builds a map per thread and merges them, while the concurrent one shares a single <code>ConcurrentHashMap</code>. Use the concurrent form only for unordered streams.</p>
<p>Prefer <code>findAny</code> to <code>findFirst</code> in parallel: <code>findFirst</code> must respect encounter order, which forces coordination.</p>`
},
{
  slug: "parallel-invoke", n: 181, title: "Run Different Jobs at Once", difficulty: "easy",
  statement: `<p>Three unrelated pieces of work. Run them concurrently and wait for all to finish.</p>`,
  approaches: [
    { name: "Submit all, then join", time: "—", space: "O(jobs)", best: true,
      note: "Unlike a parallel loop, these are different functions rather than the same one over many items. invokeAll submits everything and blocks until all are done.",
      java: `ExecutorService pool = Executors.newFixedThreadPool(3);
try {
    List<Callable<Void>> jobs = List.of(
        () -> { rebuildSearchIndex(); return null; },
        () -> { warmCaches(); return null; },
        () -> { refreshExchangeRates(); return null; }
    );
    List<Future<Void>> done = pool.invokeAll(jobs);   // blocks until all end
    for (Future<Void> f : done) f.get();              // re-throws failures
} finally {
    pool.shutdown();
}

// Java 21 structured version: if one fails, the others are cancelled
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    scope.fork(() -> { rebuildSearchIndex(); return null; });
    scope.fork(() -> { warmCaches(); return null; });
    scope.join().throwIfFailed();
}`,
      python: `from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=3) as pool:
    futures = [
        pool.submit(rebuild_search_index),
        pool.submit(warm_caches),
        pool.submit(refresh_exchange_rates),
    ]
# the with block waits for all of them

for f in futures:
    f.result()                    # re-raises any exception` }
  ],
  note: `<p>Always call <code>get()</code> or <code>result()</code> on each future afterwards. Waiting tells you the jobs <em>finished</em>, not that they <em>succeeded</em> — without that loop, a failed job is silently ignored.</p>`
},
{
  slug: "parallel-merge-sort", n: 182, title: "Parallel Merge Sort", difficulty: "hard",
  statement: `<p>Sort a large array using several cores.</p>`,
  approaches: [
    { name: "Fork/join with a cutoff", time: "O(n log n / cores)", space: "O(n)", best: true,
      note: "Recursion is naturally parallel: the two halves are independent. The cutoff is essential — below it, the coordination costs more than the sort saves.",
      java: `public class ParallelMergeSort extends RecursiveAction {
    private static final int THRESHOLD = 8192;     // tune by measuring
    private final int[] data, buffer;
    private final int lo, hi;

    ParallelMergeSort(int[] data, int[] buffer, int lo, int hi) {
        this.data = data; this.buffer = buffer; this.lo = lo; this.hi = hi;
    }

    @Override protected void compute() {
        if (hi - lo <= THRESHOLD) {                 // small: do it directly
            Arrays.sort(data, lo, hi);
            return;
        }
        int mid = lo + (hi - lo) / 2;
        ParallelMergeSort left  = new ParallelMergeSort(data, buffer, lo, mid);
        ParallelMergeSort right = new ParallelMergeSort(data, buffer, mid, hi);
        invokeAll(left, right);                     // both halves in parallel
        merge(mid);
    }

    private void merge(int mid) {
        System.arraycopy(data, lo, buffer, lo, hi - lo);
        int i = lo, j = mid;
        for (int k = lo; k < hi; k++) {
            if (i >= mid)                 data[k] = buffer[j++];
            else if (j >= hi)             data[k] = buffer[i++];
            else if (buffer[j] < buffer[i]) data[k] = buffer[j++];
            else                          data[k] = buffer[i++];
        }
    }
}

// Or just use the JDK, which already does exactly this:
Arrays.parallelSort(data);`,
      python: `from concurrent.futures import ProcessPoolExecutor
import heapq

def parallel_sort(data: list[int], workers: int = 4) -> list[int]:
    if len(data) < 100_000:
        return sorted(data)                 # not worth the IPC cost

    chunk = len(data) // workers
    pieces = [data[i:i + chunk] for i in range(0, len(data), chunk)]

    with ProcessPoolExecutor(max_workers=workers) as pool:
        sorted_pieces = list(pool.map(sorted, pieces))

    return list(heapq.merge(*sorted_pieces))   # k-way merge of the parts` }
  ],
  note: `<p><strong>Use <code>Arrays.parallelSort</code> in real code.</strong> It is this algorithm, tuned, with a cutoff already chosen — writing your own is an exercise, not a production decision.</p>
<p>In Python this is usually a loss: pickling the array to worker processes and back frequently costs more than the sort itself. Measure before reaching for it.</p>`
},
{
  slug: "parallel-matrix", n: 183, title: "Faster Matrix Multiplication", difficulty: "hard",
  statement: `<p>Multiply two large matrices using all cores.</p>`,
  approaches: [
    { name: "Parallelise the outer loop", time: "O(n³/cores)", space: "O(n²)", best: true,
      note: "Each output row is computed independently, so splitting by row needs no synchronisation at all — every thread writes to its own rows.",
      java: `public static double[][] multiply(double[][] a, double[][] b) {
    int n = a.length, m = b[0].length, k = b.length;
    double[][] out = new double[n][m];

    IntStream.range(0, n).parallel().forEach(i -> {
        for (int j = 0; j < m; j++) {
            double sum = 0;
            for (int x = 0; x < k; x++) sum += a[i][x] * b[x][j];
            out[i][j] = sum;              // only THIS thread writes row i
        }
    });
    return out;
}

// Loop order matters as much as parallelism. i-k-j walks both matrices
// along rows, so it is far more cache-friendly than i-j-k:
IntStream.range(0, n).parallel().forEach(i -> {
    for (int x = 0; x < k; x++) {
        double aix = a[i][x];
        for (int j = 0; j < m; j++) out[i][j] += aix * b[x][j];
    }
});`,
      python: `import numpy as np

# Do NOT hand-roll this in Python. NumPy calls into BLAS, which is
# already parallel, vectorised and cache-blocked.
def multiply(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return a @ b

# A pure-Python parallel version, for illustration only:
from concurrent.futures import ProcessPoolExecutor

def _row(args):
    row, b = args
    return [sum(row[x] * b[x][j] for x in range(len(b)))
            for j in range(len(b[0]))]

def multiply_slow(a: list[list[float]], b: list[list[float]]) -> list:
    with ProcessPoolExecutor() as pool:
        return list(pool.map(_row, ((r, b) for r in a)))` }
  ],
  note: `<p><strong>Loop order can matter more than thread count.</strong> The i-k-j ordering traverses both matrices row-wise, so it hits cache far more often than i-j-k, which strides down a column. A cache-friendly sequential version often beats a naive parallel one.</p>
<p>In Python, use NumPy. Hand-written loops are roughly a hundred times slower than the BLAS call underneath <code>@</code>, and BLAS is already multi-threaded.</p>`
},
{
  slug: "map-reduce", n: 184, title: "Count Words Across Many Documents", difficulty: "medium",
  statement: `<p>Count word frequencies across thousands of documents in parallel.</p>`,
  approaches: [
    { name: "Map, then reduce", time: "O(total words / cores)", space: "O(distinct)", best: true,
      note: "Each worker counts its own documents into a private map; the partial maps are then merged. No shared mutable state during the expensive phase — that is the whole pattern.",
      java: `Map<String, Long> counts = documents.parallelStream()
        .flatMap(doc -> Arrays.stream(doc.text().toLowerCase().split("\\\\W+")))
        .filter(w -> !w.isEmpty())
        .collect(Collectors.groupingByConcurrent(
                Function.identity(),
                Collectors.counting()));

// The explicit map/reduce shape, which shows the structure more clearly
Map<String, Long> counts = documents.parallelStream()
        .map(doc -> countWords(doc))              // MAP: private map each
        .reduce(new HashMap<>(), (a, b) -> {      // REDUCE: merge partials
            b.forEach((word, n) -> a.merge(word, n, Long::sum));
            return a;
        });`,
      python: `from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import re

def count_words(document: str) -> Counter:
    return Counter(re.findall(r"\\w+", document.lower()))

def count_all(documents: list[str], workers: int = 4) -> Counter:
    with ProcessPoolExecutor(max_workers=workers) as pool:
        partials = pool.map(count_words, documents, chunksize=50)

    total: Counter = Counter()
    for partial in partials:
        total.update(partial)          # merge, single-threaded and cheap
    return total` }
  ],
  note: `<p>This is MapReduce in miniature, and the same reasoning scales to Hadoop or Spark: <strong>map</strong> is embarrassingly parallel because each worker touches only its own data, and <strong>reduce</strong> is cheap because it only merges summaries, not raw input.</p>
<p>Set <code>chunksize</code> in Python. Without it, each document is a separate IPC round trip and the overhead swamps the work.</p>`
}
]});
