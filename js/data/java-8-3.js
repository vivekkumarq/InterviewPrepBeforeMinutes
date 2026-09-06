appendTopic("java-8", [
{
  q: "What are the Java 21 pattern matching and record patterns?",
  level: "advanced", hot: true, tags: ["modern-java", "java21"],
  a: `<pre><code>// Pattern matching for instanceof (Java 16) — no cast needed
if (obj instanceof String s &amp;&amp; s.length() &gt; 5) {
    System.out.println(s.toUpperCase());        // 's' is in scope and typed
}

// Pattern matching for switch + record patterns (Java 21)
sealed interface Shape permits Circle, Rectangle, Triangle { }
record Circle(double radius) implements Shape { }
record Rectangle(double width, double height) implements Shape { }
record Triangle(double base, double height) implements Shape { }

static double area(Shape shape) {
    return switch (shape) {
        case Circle c            -&gt; Math.PI * c.radius() * c.radius();
        case Rectangle(double w, double h) -&gt; w * h;          // RECORD PATTERN: destructured
        case Triangle(double b, double h)  -&gt; 0.5 * b * h;
    };                                          // NO default needed — sealed = exhaustive
}

// Guards and nested patterns
static String describe(Object o) {
    return switch (o) {
        case Integer i when i &lt; 0        -&gt; "negative";
        case Integer i                    -&gt; "int " + i;
        case Order(var id, Customer(var name, _), var total) when total.signum() &gt; 0
                                          -&gt; "order " + id + " for " + name;
        case null                         -&gt; "nothing";       // null is now a CASE label
        default                           -&gt; "unknown";
    };
}</code></pre>
<p><strong>Why <code>sealed</code> plus pattern matching is the important combination:</strong> the compiler knows every possible subtype, so it can verify the switch is <strong>exhaustive</strong>. Adding a fourth <code>Shape</code> breaks the build in every switch that has not handled it — turning "someone forgot a case" from a runtime bug into a compile error. Without <code>sealed</code>, you need a <code>default</code> branch, which silently swallows new cases.</p>
<p><strong>The design tension worth mentioning:</strong> classic OOP would put <code>area()</code> on each shape as a polymorphic method. Pattern matching is better when the <em>operations</em> change more often than the types (you keep adding new things to do with shapes), while polymorphism is better when the <em>types</em> change more often. That is the expression problem, and being able to name the trade-off rather than declaring one style superior is what distinguishes the answer.</p>
<p>Also note <code>case null</code> — previously a switch on a null selector always threw <code>NullPointerException</code>; now null can be handled explicitly, which removes a common guard clause.</p>`
},
{
  q: "How do you use Optional correctly with Streams and collections?",
  level: "advanced", tags: ["optional", "streams"],
  a: `<pre><code>// Optional.stream() (Java 9) — flatten a stream of Optionals, dropping the empties
List&lt;Customer&gt; found = ids.stream()
        .map(repo::findById)              // Stream&lt;Optional&lt;Customer&gt;&gt;
        .flatMap(Optional::stream)        // Stream&lt;Customer&gt; — empties disappear
        .toList();

// Pre-Java 9 equivalent, still seen in older code
.filter(Optional::isPresent).map(Optional::get)

// Chaining fallbacks with or() (Java 9)
Optional&lt;Config&gt; config = fromEnvironment()
        .or(this::fromFile)               // lazily evaluated
        .or(this::fromDefaults);

// Terminal operations that RETURN Optional — always handle the empty case
stream.findFirst().orElseThrow(() -&gt; new NotFoundException("no match"));
stream.max(comparing(Order::total)).map(Order::id).orElse("none");
stream.reduce(BigDecimal::add).orElse(BigDecimal.ZERO);

// ifPresentOrElse (Java 9) — both branches without an if/else
repo.findById(id).ifPresentOrElse(
        this::send,
        () -&gt; log.warn("customer {} not found", id));</code></pre>
<p><strong>The anti-patterns to name, because they are extremely common:</strong></p>
<pre><code>// ✘ Optional as a field — not Serializable, adds an object per field
private Optional&lt;String&gt; middleName;

// ✘ Optional as a parameter — forces every caller to wrap
void process(Optional&lt;Config&gt; config)      // overload instead

// ✘ orElse with an expensive call — the argument is evaluated ALWAYS,
//    even when a value is present
opt.orElse(expensiveDefault());            // use orElseGet(this::expensiveDefault)

// ✘ Optional&lt;List&lt;T&gt;&gt; — return an empty list instead
// ✘ opt.isPresent() ? opt.get() : other   — that IS the null check you removed</code></pre>
<p><strong>The rule that ties it together:</strong> <code>Optional</code> is designed as a <em>return type</em> to make absence explicit in an API. Used as a field, a parameter or a collection wrapper it adds allocation and ceremony without the benefit. Brian Goetz, who designed it, stated exactly that intent — which is a useful thing to be able to cite.</p>`
},
{
  q: "What are the Java 9+ collection and stream API additions worth knowing?",
  level: "advanced", tags: ["modern-java", "collections"],
  a: `<pre><code>// Java 9 — factory methods for immutable collections
List.of("a", "b");  Set.of(1, 2);  Map.of("k", 1, "k2", 2);
Map.ofEntries(entry("a", 1), entry("b", 2));      // beyond 10 pairs
List.copyOf(existing);                             // immutable SNAPSHOT

// Java 9 — stream additions
Stream.iterate(1, n -&gt; n &lt; 100, n -&gt; n * 2);       // 3-arg: self-bounding, no limit() needed
stream.takeWhile(n -&gt; n &lt; 10);                     // stop at the first failure
stream.dropWhile(n -&gt; n &lt; 10);                     // skip until the first failure
Stream.ofNullable(mayBeNull);                       // 0 or 1 elements
Optional.stream();

// Java 10/11
var list = new ArrayList&lt;String&gt;();
stream.collect(Collectors.toUnmodifiableList());
"  text  ".strip(); "".isBlank(); "ab".repeat(3); "a\\nb".lines();
Files.readString(path); Files.writeString(path, content);
Predicate.not(String::isBlank);                     // cleaner than s -&gt; !s.isBlank()

// Java 12+
Collectors.teeing(minBy(cmp), maxBy(cmp), Range::new);   // two collectors in one pass
Files.mismatch(path1, path2);
stream.toList();                                    // Java 16 — IMMUTABLE
Collectors.filtering(pred, toList());               // Java 9
Collectors.flatMapping(fn, toList());

// Java 21 — sequenced collections
list.getFirst(); list.getLast(); list.reversed();
map.firstEntry(); map.putFirst(k, v);</code></pre>
<p><strong>Two traps worth flagging:</strong></p>
<ul>
<li><strong><code>Stream.toList()</code> returns an immutable list</strong>, while <code>collect(Collectors.toList())</code> historically returns an <code>ArrayList</code>. Code that sorted or added to the result breaks when you switch — a very common migration surprise.</li>
<li><strong><code>Set.of()</code> and <code>Map.of()</code> deliberately randomise iteration order</strong> per JVM run, specifically so nobody writes code depending on it. A test asserting on order passes locally and fails in CI.</li>
</ul>
<p><strong>The one I would highlight as most useful day to day</strong> is <code>takeWhile</code>/<code>dropWhile</code> on a sorted stream — they short-circuit, so processing a sorted list until a threshold no longer requires filtering the entire collection.</p>`
},
{
  q: "How do you write a parallel stream correctly and measure whether it helps?",
  level: "advanced", tags: ["streams", "performance"],
  a: `<pre><code>// The rules for CORRECTNESS
// 1. The lambda must be stateless and side-effect free
// 2. The reduction operator must be ASSOCIATIVE
// 3. The identity must satisfy op(identity, x) == x
// 4. The source must not be modified during the pipeline

// ✘ Broken — shared mutable state, a data race
List&lt;String&gt; out = new ArrayList&lt;&gt;();
list.parallelStream().forEach(out::add);           // may lose elements or throw

// ✔ Let collect handle the combining
List&lt;String&gt; out = list.parallelStream().collect(toList());

// ✘ Broken — subtraction is NOT associative, so the result is non-deterministic
list.parallelStream().reduce(0, (a, b) -&gt; a - b);

// ✘ Broken — 1 is not an identity for addition; each split adds its own 1
list.parallelStream().reduce(1, Integer::sum);</code></pre>
<pre><code>// Running on YOUR pool rather than the shared common ForkJoinPool
ForkJoinPool pool = new ForkJoinPool(8);
try {
    List&lt;Result&gt; results = pool.submit(() -&gt;
        items.parallelStream().map(this::compute).toList()).get();
} finally { pool.shutdown(); }</code></pre>
<pre><code>// Measuring properly — a naive loop timing is meaningless because of JIT warmup
@Benchmark @BenchmarkMode(Mode.AverageTime) @Fork(1)
@Warmup(iterations = 5) @Measurement(iterations = 10)
public long parallelSum(Blackhole bh) {
    return data.parallelStream().mapToLong(this::compute).sum();
}</code></pre>
<p><strong>The decision framework (the NQ model):</strong> parallelism pays when <em>N</em> (element count) × <em>Q</em> (cost per element) is large — a rough rule is 10,000+ elements with non-trivial work per element. Below that, the cost of splitting, scheduling and merging exceeds the benefit.</p>
<p><strong>What silently ruins it:</strong> a source that splits badly (<code>LinkedList</code>, <code>Stream.iterate</code>, <code>BufferedReader.lines()</code>), any blocking I/O in the lambda (which starves the shared common pool and every other parallel stream in the JVM), stateful operations like <code>sorted()</code> and <code>distinct()</code> that must buffer everything, and running inside a web container where each request already has its own thread.</p>
<p><strong>The honest position to state:</strong> "I default to sequential and only parallelise after a JMH benchmark on realistic data shows a win. In a web service I almost never use parallel streams, because the container is already parallel across requests — adding intra-request parallelism usually reduces total throughput."</p>`
}
]);
