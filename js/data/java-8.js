registerTopic("java-8", [
{
  q: "What are the major features introduced in Java 8?",
  level: "beginner", hot: true, tags: ["java8"],
  a: `<ul>
<li><strong>Lambda expressions</strong> — behaviour as a parameter.</li>
<li><strong>Functional interfaces</strong> and <code>@FunctionalInterface</code>.</li>
<li><strong>Stream API</strong> — declarative bulk data operations.</li>
<li><strong>Optional</strong> — a container for "value may be absent".</li>
<li><strong>Default and static methods on interfaces</strong> — API evolution without breaking implementers.</li>
<li><strong>Method references</strong> — <code>Customer::getName</code>.</li>
<li><strong>New Date/Time API</strong> (<code>java.time</code>) — immutable and thread-safe, replacing <code>Date</code>/<code>Calendar</code>.</li>
<li><strong>CompletableFuture</strong> — composable async.</li>
<li><strong>Nashorn</strong> JS engine (since removed) and <strong>PermGen removal</strong> in favour of Metaspace.</li>
<li><strong>StringJoiner</strong>, <code>Collectors</code>, <code>ConcurrentHashMap</code> rewrite, <code>LongAdder</code>.</li>
</ul>
<p>The headline: Java 8 made functional-style programming idiomatic while staying object-oriented.</p>`
},
{
  q: "What is a lambda expression and what is a functional interface?",
  level: "beginner", hot: true, tags: ["lambda"],
  a: `<p>A <strong>lambda</strong> is an anonymous function — parameters, an arrow, a body. A <strong>functional interface</strong> is an interface with exactly one abstract method (SAM); it is the <em>type</em> a lambda gets assigned to.</p>
<pre><code>@FunctionalInterface           // optional, but the compiler then enforces one abstract method
interface Validator&lt;T&gt; {
    boolean validate(T value);          // the single abstract method
    default Validator&lt;T&gt; and(Validator&lt;T&gt; other) {   // defaults do not count
        return v -&gt; this.validate(v) &amp;&amp; other.validate(v);
    }
}

Validator&lt;String&gt; notBlank = s -&gt; s != null &amp;&amp; !s.isBlank();
Validator&lt;String&gt; maxLen   = s -&gt; s.length() &lt;= 50;
Validator&lt;String&gt; rule = notBlank.and(maxLen);</code></pre>
<p><strong>Important nuance:</strong> a lambda is <em>not</em> an anonymous inner class. It compiles to an <code>invokedynamic</code> instruction bound by <code>LambdaMetafactory</code> at first use — no extra <code>.class</code> file per lambda, and <code>this</code> inside a lambda refers to the <em>enclosing</em> instance, not the lambda object.</p>
<p><code>public abstract</code> overrides of <code>Object</code> methods (like <code>equals</code>) do not count towards the SAM rule — that is how <code>Comparator</code> stays functional.</p>`
},
{
  q: "Name the built-in functional interfaces in java.util.function",
  level: "beginner", hot: true, tags: ["lambda"],
  a: `<table>
<tr><th>Interface</th><th>Method</th><th>Meaning</th><th>Typical use</th></tr>
<tr><td><code>Function&lt;T,R&gt;</code></td><td><code>R apply(T)</code></td><td>Transform</td><td><code>map()</code></td></tr>
<tr><td><code>Predicate&lt;T&gt;</code></td><td><code>boolean test(T)</code></td><td>Condition</td><td><code>filter()</code></td></tr>
<tr><td><code>Consumer&lt;T&gt;</code></td><td><code>void accept(T)</code></td><td>Side effect</td><td><code>forEach()</code></td></tr>
<tr><td><code>Supplier&lt;T&gt;</code></td><td><code>T get()</code></td><td>Lazy produce</td><td><code>orElseGet()</code></td></tr>
<tr><td><code>UnaryOperator&lt;T&gt;</code></td><td><code>T apply(T)</code></td><td>Same-type transform</td><td><code>replaceAll()</code></td></tr>
<tr><td><code>BiFunction&lt;T,U,R&gt;</code></td><td><code>R apply(T,U)</code></td><td>Two-arg transform</td><td><code>merge()</code></td></tr>
<tr><td><code>BinaryOperator&lt;T&gt;</code></td><td><code>T apply(T,T)</code></td><td>Combine two</td><td><code>reduce()</code></td></tr>
</table>
<p>Primitive specialisations (<code>IntPredicate</code>, <code>ToIntFunction</code>, <code>IntSupplier</code>…) exist purely to avoid boxing in hot loops — mention them, it shows performance awareness.</p>
<p>They compose: <code>f.andThen(g)</code>, <code>f.compose(g)</code>, <code>p.and(q)</code>, <code>p.or(q)</code>, <code>p.negate()</code>, <code>Predicate.not(p)</code> (Java 11).</p>`
},
{
  q: "What is a Stream? How is it different from a Collection?",
  level: "beginner", hot: true, tags: ["streams"],
  a: `<table>
<tr><th></th><th>Collection</th><th>Stream</th></tr>
<tr><td>Purpose</td><td>Store and manage data</td><td>Compute over data</td></tr>
<tr><td>Storage</td><td>Holds elements</td><td>Holds none — it is a pipeline</td></tr>
<tr><td>Evaluation</td><td>Eager</td><td><strong>Lazy</strong> until a terminal operation</td></tr>
<tr><td>Traversal</td><td>Any number of times</td><td>Once — reuse throws <code>IllegalStateException</code></td></tr>
<tr><td>Mutation</td><td>Add/remove allowed</td><td>Source must not be modified during the pipeline</td></tr>
<tr><td>Iteration</td><td>External (you write the loop)</td><td>Internal (the library loops)</td></tr>
</table>
<p><strong>Pipeline anatomy:</strong> source → zero or more <em>intermediate</em> operations (lazy, return a Stream) → one <em>terminal</em> operation (triggers execution).</p>
<pre><code>List&lt;String&gt; names = employees.stream()          // source
    .filter(e -&gt; e.salary().compareTo(LIMIT) &gt; 0) // intermediate — lazy
    .map(Employee::name)                          // intermediate — lazy
    .sorted()                                     // stateful intermediate
    .toList();                                    // terminal — runs everything now</code></pre>
<p>Laziness matters: with <code>filter().findFirst()</code>, the filter runs only until the first match, not over the whole list. That short-circuiting is a favourite follow-up.</p>`
},
{
  q: "Intermediate vs terminal operations — list the common ones",
  level: "beginner", hot: true, tags: ["streams"],
  a: `<p><strong>Intermediate</strong> (lazy, return a Stream):</p>
<ul>
<li><em>Stateless:</em> <code>filter</code>, <code>map</code>, <code>flatMap</code>, <code>peek</code>, <code>mapToInt</code></li>
<li><em>Stateful:</em> <code>sorted</code>, <code>distinct</code>, <code>limit</code>, <code>skip</code>, <code>takeWhile</code>/<code>dropWhile</code> (Java 9)</li>
</ul>
<p><strong>Terminal</strong> (trigger execution, return a non-Stream):</p>
<ul>
<li><em>Reduction:</em> <code>reduce</code>, <code>collect</code>, <code>count</code>, <code>min</code>, <code>max</code>, <code>sum</code>/<code>average</code></li>
<li><em>Short-circuiting:</em> <code>findFirst</code>, <code>findAny</code>, <code>anyMatch</code>, <code>allMatch</code>, <code>noneMatch</code></li>
<li><em>Terminal side effects:</em> <code>forEach</code>, <code>forEachOrdered</code>, <code>toArray</code>, <code>toList</code> (Java 16)</li>
</ul>
<p>Stateful operations are the ones that hurt in parallel — <code>sorted()</code> and <code>distinct()</code> must buffer the whole stream, defeating much of the parallelism.</p>
<p><strong>Trap:</strong> <code>peek()</code> without a terminal operation does nothing at all, because nothing runs. And using <code>peek()</code> for business logic rather than debugging is a code smell the spec explicitly warns about.</p>`
},
{
  q: "map() vs flatMap()",
  level: "beginner", hot: true, tags: ["streams"],
  a: `<p><code>map</code> is one-to-one: each element becomes exactly one element. <code>flatMap</code> is one-to-many: each element becomes a <em>Stream</em>, and all those streams are flattened into one.</p>
<pre><code>List&lt;Order&gt; orders = ...;   // each Order has List&lt;LineItem&gt; items

// map gives you a stream of LISTS — usually not what you want
Stream&lt;List&lt;LineItem&gt;&gt; nested = orders.stream().map(Order::items);

// flatMap gives you a stream of ITEMS
List&lt;LineItem&gt; allItems = orders.stream()
        .flatMap(o -&gt; o.items().stream())
        .toList();

// Classic use: split lines into words
List&lt;String&gt; words = lines.stream()
        .flatMap(l -&gt; Arrays.stream(l.split("\\\\s+")))
        .toList();</code></pre>
<p>Also applies outside Streams: <code>Optional.flatMap</code> avoids <code>Optional&lt;Optional&lt;T&gt;&gt;</code>, and <code>CompletableFuture.thenCompose</code> is the flatMap of futures. Naming that generalisation is a strong answer.</p>`
},
{
  q: "Explain Collectors — groupingBy, partitioningBy, joining, toMap",
  level: "advanced", hot: true, tags: ["streams", "collectors"],
  a: `<pre><code>// group into Map&lt;Dept, List&lt;Employee&gt;&gt;
Map&lt;String, List&lt;Employee&gt;&gt; byDept =
    emps.stream().collect(groupingBy(Employee::dept));

// downstream collector: count per dept
Map&lt;String, Long&gt; countByDept =
    emps.stream().collect(groupingBy(Employee::dept, counting()));

// average salary per dept, into a TreeMap for sorted keys
Map&lt;String, Double&gt; avg = emps.stream().collect(
    groupingBy(Employee::dept, TreeMap::new, averagingDouble(e -&gt; e.salary().doubleValue())));

// two-level grouping
Map&lt;String, Map&lt;String, List&lt;Employee&gt;&gt;&gt; byDeptThenCity =
    emps.stream().collect(groupingBy(Employee::dept, groupingBy(Employee::city)));

// boolean split — always exactly two keys, true and false
Map&lt;Boolean, List&lt;Employee&gt;&gt; split =
    emps.stream().collect(partitioningBy(e -&gt; e.salary().compareTo(LIMIT) &gt; 0));

// join
String csv = emps.stream().map(Employee::name).collect(joining(", ", "[", "]"));

// toMap with a merge function — WITHOUT it, duplicate keys throw IllegalStateException
Map&lt;String, BigDecimal&gt; totals = orders.stream()
    .collect(toMap(Order::customerId, Order::amount, BigDecimal::add));

// summary statistics in one pass
IntSummaryStatistics stats = emps.stream().mapToInt(Employee::age).summaryStatistics();</code></pre>
<p><strong>Two facts they probe:</strong> <code>toMap</code> throws on duplicate keys unless you pass a merge function, and it returns a <code>HashMap</code>, so any ordering you carefully created upstream is lost — pass <code>LinkedHashMap::new</code> as the fourth argument.</p>`
},
{
  q: "What is Optional and how should it be used properly?",
  level: "beginner", hot: true, tags: ["optional"],
  a: `<p><code>Optional&lt;T&gt;</code> is a container that either holds a value or is empty. It exists to make "may be absent" explicit <strong>in a return type</strong>, so callers cannot forget the null check.</p>
<pre><code>// GOOD
public Optional&lt;Customer&gt; findByEmail(String email) { ... }

repo.findByEmail(email)
    .map(Customer::name)
    .filter(n -&gt; !n.isBlank())
    .orElseGet(() -&gt; defaultName());          // lazy, only runs if empty

repo.findByEmail(email)
    .orElseThrow(() -&gt; new CustomerNotFoundException(email));

repo.findByEmail(email).ifPresentOrElse(this::send, this::logMissing);  // Java 9</code></pre>
<p><strong>Anti-patterns to avoid (and to name in the interview):</strong></p>
<ul>
<li><code>opt.get()</code> without checking — you replaced an NPE with a <code>NoSuchElementException</code>. Use <code>orElseThrow()</code>.</li>
<li><code>if (opt.isPresent()) opt.get()</code> — that is the null check you were trying to remove; use <code>map</code>/<code>ifPresent</code>.</li>
<li><code>Optional</code> as a <strong>field</strong> — it is not <code>Serializable</code> and adds an object per field.</li>
<li><code>Optional</code> as a <strong>method parameter</strong> — callers now must wrap; overload instead.</li>
<li><code>orElse(expensive())</code> — the argument is evaluated <em>always</em>, even when a value is present. Use <code>orElseGet</code>.</li>
<li>Returning <code>Optional&lt;List&lt;T&gt;&gt;</code> — return an empty list instead.</li>
</ul>`
},
{
  q: "How do method references work? What are the four kinds?",
  level: "beginner", tags: ["lambda"],
  a: `<table>
<tr><th>Kind</th><th>Syntax</th><th>Equivalent lambda</th></tr>
<tr><td>Static method</td><td><code>Integer::parseInt</code></td><td><code>s -&gt; Integer.parseInt(s)</code></td></tr>
<tr><td>Instance method of a <em>particular</em> object</td><td><code>System.out::println</code></td><td><code>x -&gt; System.out.println(x)</code></td></tr>
<tr><td>Instance method of an <em>arbitrary</em> object of a type</td><td><code>String::toUpperCase</code></td><td><code>s -&gt; s.toUpperCase()</code></td></tr>
<tr><td>Constructor</td><td><code>ArrayList::new</code></td><td><code>() -&gt; new ArrayList&lt;&gt;()</code></td></tr>
</table>
<p>The third kind is the one that confuses people: the receiver becomes the first parameter. <code>Employee::name</code> as a <code>Function&lt;Employee,String&gt;</code> takes the employee <em>as the argument</em>.</p>
<pre><code>list.sort(Comparator.comparing(Employee::name));
map.forEach((k, v) -&gt; ...);
Stream.generate(AtomicInteger::new);
list.stream().map(String::trim).filter(Predicate.not(String::isEmpty));</code></pre>`
},
{
  q: "When should you use a parallel stream — and when should you not?",
  level: "advanced", hot: true, tags: ["streams", "performance"],
  a: `<p>A parallel stream splits the source across the <strong>common ForkJoinPool</strong> (size = cores − 1). Use it only when the NQ model favours it: N (element count) × Q (cost per element) must be large — a rough threshold is 10,000+ elements with non-trivial work.</p>
<p><strong>Do not use it when:</strong></p>
<ul>
<li>The source splits poorly — <code>LinkedList</code>, <code>Stream.iterate</code>, <code>BufferedReader.lines()</code>. Arrays and <code>ArrayList</code> split perfectly.</li>
<li>The operation is <strong>blocking I/O</strong> — you starve the shared common pool and every parallel stream in the JVM stalls with it.</li>
<li>You are in a web container. Each request already has a thread; parallelising per-request work multiplies contention and usually reduces total throughput.</li>
<li>Order matters — <code>forEach</code> is unordered (use <code>forEachOrdered</code>, which throws the benefit away).</li>
<li>The lambda touches shared mutable state — that is a race, not a speedup.</li>
</ul>
<pre><code>// Broken: shared mutable state
List&lt;String&gt; out = new ArrayList&lt;&gt;();
list.parallelStream().forEach(out::add);        // race, may lose elements or throw

// Correct: let collect handle it
List&lt;String&gt; out = list.parallelStream().collect(toList());

// If you must use a specific pool (and not the common one):
ForkJoinPool pool = new ForkJoinPool(4);
pool.submit(() -&gt; list.parallelStream().map(this::heavy).toList()).get();</code></pre>
<p><strong>Always measure with JMH.</strong> The honest interview answer is: "I default to sequential and only parallelise after benchmarking a real bottleneck."</p>`
},
{
  q: "Explain reduce() and its three overloads",
  level: "advanced", tags: ["streams"],
  a: `<pre><code>// 1. Optional&lt;T&gt; reduce(BinaryOperator&lt;T&gt;) — no identity, so may be empty
Optional&lt;BigDecimal&gt; total = amounts.stream().reduce(BigDecimal::add);

// 2. T reduce(T identity, BinaryOperator&lt;T&gt;) — identity avoids Optional
BigDecimal total = amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);

// 3. &lt;U&gt; U reduce(U identity, BiFunction&lt;U,T,U&gt; accumulator, BinaryOperator&lt;U&gt; combiner)
//    the combiner merges partial results — only used in PARALLEL
int totalChars = words.stream()
    .reduce(0, (sum, w) -&gt; sum + w.length(), Integer::sum);</code></pre>
<p><strong>Contract requirements</strong> that interviewers test:</p>
<ul>
<li>The identity must be a true identity: <code>op(identity, x) == x</code>. Using <code>1</code> as the identity for a sum silently gives wrong answers in parallel, because each split adds its own 1.</li>
<li>The operator must be <strong>associative</strong> — subtraction and division are not, so their parallel results are non-deterministic.</li>
<li>It should be stateless and side-effect free.</li>
</ul>
<p><code>reduce</code> is for immutable accumulation; use <code>collect</code> for mutable accumulation (building a list, a StringBuilder, a map) — reducing into a mutable container is a common performance bug because it copies on every step.</p>`
},
{
  q: "What is the difference between reduce() and collect()?",
  level: "advanced", tags: ["streams"],
  a: `<table>
<tr><th></th><th>reduce</th><th>collect</th></tr>
<tr><td>Accumulation</td><td>Immutable — creates a new value each step</td><td>Mutable — accumulates into a container</td></tr>
<tr><td>Parallel cost</td><td>Cheap for primitives, expensive for objects</td><td>Designed for it — one container per thread, then combined</td></tr>
<tr><td>Signature</td><td>identity, accumulator, combiner</td><td>supplier, accumulator, combiner</td></tr>
<tr><td>Use for</td><td>Sums, min/max, folding values</td><td>Lists, maps, sets, strings, grouping</td></tr>
</table>
<pre><code>// Wrong: O(n^2) string building — a new String per element
String s = words.stream().reduce("", String::concat);

// Right: mutable accumulation
String s = words.stream().collect(joining());

// A custom collector, three-argument form
List&lt;String&gt; list = stream.collect(ArrayList::new, ArrayList::add, ArrayList::addAll);</code></pre>`
},
{
  q: "What is the new java.time API and why replace Date and Calendar?",
  level: "beginner", tags: ["datetime"],
  a: `<p><code>java.util.Date</code> and <code>Calendar</code> were <strong>mutable</strong> (so not thread-safe), had a zero-based month, mixed date and time concerns, and <code>SimpleDateFormat</code> was famously not thread-safe — a real production bug generator when stored in a static field.</p>
<table>
<tr><th>Type</th><th>Represents</th><th>Example</th></tr>
<tr><td><code>LocalDate</code></td><td>Date, no time, no zone</td><td>Birth date</td></tr>
<tr><td><code>LocalTime</code></td><td>Time, no date</td><td>Shop opening hour</td></tr>
<tr><td><code>LocalDateTime</code></td><td>Both, still no zone</td><td>Local calendar entry</td></tr>
<tr><td><code>Instant</code></td><td>A point on the UTC timeline</td><td><strong>Database timestamps, event times</strong></td></tr>
<tr><td><code>ZonedDateTime</code></td><td>Instant + zone rules (DST)</td><td>User-facing scheduling</td></tr>
<tr><td><code>Duration</code> / <code>Period</code></td><td>Time-based / date-based amount</td><td>Timeouts / age</td></tr>
</table>
<pre><code>LocalDate due = LocalDate.now().plusDays(30).with(TemporalAdjusters.lastDayOfMonth());
Instant now = Instant.now();                      // store this in the DB
ZonedDateTime local = now.atZone(ZoneId.of("Asia/Kolkata"));
Duration took = Duration.between(start, Instant.now());
boolean expired = Instant.now().isAfter(token.expiresAt());</code></pre>
<p>All types are immutable and thread-safe, so <code>DateTimeFormatter</code> can safely be a static constant. <strong>Rule for services:</strong> store <code>Instant</code> (UTC) everywhere, convert to a zone only at the presentation edge.</p>`
},
{
  q: "What is the difference between findFirst() and findAny(), anyMatch and allMatch?",
  level: "advanced", tags: ["streams"],
  a: `<ul>
<li><code>findFirst()</code> — respects encounter order; in a parallel stream it must coordinate to identify the genuinely first element, which costs something.</li>
<li><code>findAny()</code> — returns whichever element any thread finds first. Faster in parallel; identical to <code>findFirst</code> in a sequential stream.</li>
<li><code>anyMatch(p)</code> — true if at least one matches; short-circuits on the first hit.</li>
<li><code>allMatch(p)</code> — true if every element matches; short-circuits on the first failure. <strong>Returns <code>true</code> for an empty stream</strong> (vacuous truth) — a classic trick question.</li>
<li><code>noneMatch(p)</code> — the negation of <code>anyMatch</code>; also <code>true</code> on an empty stream.</li>
</ul>
<pre><code>Stream.&lt;String&gt;empty().allMatch(s -&gt; false);   // true!
Stream.&lt;String&gt;empty().anyMatch(s -&gt; true);    // false</code></pre>`
},
{
  q: "How do you create streams? What is an infinite stream?",
  level: "advanced", tags: ["streams"],
  a: `<pre><code>// From collections and arrays
list.stream();  list.parallelStream();  Arrays.stream(arr);

// Of values
Stream.of("a", "b", "c");
IntStream.range(0, 10);          // 0..9
IntStream.rangeClosed(1, 10);    // 1..10

// Infinite — MUST be bounded by limit/takeWhile or it never terminates
Stream.iterate(1, n -&gt; n * 2).limit(20);
Stream.iterate(1, n -&gt; n &lt; 1000, n -&gt; n * 2);   // 3-arg form, Java 9 — self-bounding
Stream.generate(Math::random).limit(5);

// From I/O — always in try-with-resources, these hold a file handle
try (Stream&lt;String&gt; lines = Files.lines(path)) { ... }

// From other sources
"a,b,c".chars();  Pattern.compile(",").splitAsStream("a,b,c");
Optional.of(x).stream();          // Java 9
new Random().ints(10, 0, 100);</code></pre>
<p><strong>Infinite streams work because of laziness</strong> — elements are produced only as the terminal operation pulls them. <code>Stream.iterate(1, n -&gt; n+1).filter(this::isPrime).limit(5)</code> evaluates only until it finds five primes.</p>
<p>The lethal mistake: a stateful or sorted operation on an infinite stream (<code>sorted()</code>, <code>distinct()</code> before a <code>limit</code>) hangs forever, because it must consume everything first.</p>`
},
{
  q: "What are default and static methods on interfaces, and why were they added?",
  level: "beginner", tags: ["interfaces"],
  a: `<p><strong>Why:</strong> backward compatibility. Java 8 needed to add <code>stream()</code>, <code>forEach()</code>, <code>removeIf()</code> to <code>Collection</code>. Adding an abstract method would have broken every implementation ever written. A <code>default</code> method carries an implementation, so existing classes keep compiling.</p>
<pre><code>public interface Auditable {
    Instant createdAt();

    default boolean isRecent() {                    // inheritable behaviour
        return createdAt().isAfter(Instant.now().minus(Duration.ofDays(7)));
    }
    static Auditable of(Instant t) { return () -&gt; t; }   // factory, not inherited

    private Duration age() { return Duration.between(createdAt(), Instant.now()); } // Java 9
}</code></pre>
<ul>
<li><code>default</code> methods are inherited and overridable.</li>
<li><code>static</code> interface methods are <strong>not</strong> inherited — you call them on the interface itself. Good for factories and helpers (<code>Comparator.comparing</code>, <code>Predicate.not</code>).</li>
<li><code>private</code> methods (Java 9) let several defaults share code without exposing it.</li>
</ul>
<p><strong>Caveat to state:</strong> defaults are for API evolution, not for turning interfaces into abstract classes. They still cannot hold state, and abusing them recreates the diamond ambiguity.</p>`
},
{
  q: "What arrived in Java 9 through 21 that you actually use?",
  level: "advanced", hot: true, tags: ["modern-java"],
  a: `<ul>
<li><strong>9</strong> — Module system (JPMS), <code>List.of/Set.of/Map.of</code>, <code>Stream.takeWhile/dropWhile/ofNullable</code>, private interface methods, <code>Optional.ifPresentOrElse/stream</code>, compact strings, G1 as default GC.</li>
<li><strong>10</strong> — <code>var</code>, <code>Collectors.toUnmodifiableList</code>, container-aware heap sizing (matters in Docker).</li>
<li><strong>11 (LTS)</strong> — new <code>HttpClient</code> (HTTP/2, async), <code>String.isBlank/lines/strip/repeat</code>, <code>Files.readString/writeString</code>, running a single-file source directly, ZGC (experimental), Flight Recorder open-sourced.</li>
<li><strong>14</strong> — helpful NullPointerException messages, <code>switch</code> expressions.</li>
<li><strong>15</strong> — text blocks.</li>
<li><strong>16</strong> — <strong>records</strong>, pattern matching for <code>instanceof</code>, <code>Stream.toList()</code>.</li>
<li><strong>17 (LTS)</strong> — <strong>sealed classes</strong>, the finalised versions of the above, strong encapsulation of JDK internals.</li>
<li><strong>21 (LTS)</strong> — <strong>virtual threads</strong>, <strong>pattern matching for switch</strong>, record patterns, sequenced collections (<code>getFirst()</code>/<code>getLast()</code>), generational ZGC.</li>
</ul>
<pre><code>// Java 21 pattern matching for switch + record patterns
static String describe(Object o) {
    return switch (o) {
        case Integer i when i &gt; 100 -&gt; "big int " + i;
        case Integer i               -&gt; "int " + i;
        case Point(int x, int y)     -&gt; "point at " + x + "," + y;   // record pattern
        case null                    -&gt; "nothing";
        default                      -&gt; "unknown";
    };
}</code></pre>`
},
{
  q: "How do you write a custom Collector?",
  level: "advanced", tags: ["collectors"],
  a: `<p>A <code>Collector&lt;T, A, R&gt;</code> has five parts: <strong>supplier</strong> (create the container), <strong>accumulator</strong> (add one element), <strong>combiner</strong> (merge two containers, used in parallel), <strong>finisher</strong> (convert container to result), and <strong>characteristics</strong>.</p>
<pre><code>// Simplest: the 3-arg collect
StringBuilder sb = stream.collect(StringBuilder::new, StringBuilder::append, StringBuilder::append);

// Full custom collector: immutable list
static &lt;T&gt; Collector&lt;T, ?, List&lt;T&gt;&gt; toImmutableList() {
    return Collector.of(
        ArrayList::new,                          // supplier
        List::add,                               // accumulator
        (a, b) -&gt; { a.addAll(b); return a; },    // combiner
        Collections::unmodifiableList);          // finisher
}

// Usually you can compose instead of writing one:
Collectors.collectingAndThen(toList(), Collections::unmodifiableList);
Collectors.mapping(Employee::name, toList());
Collectors.filtering(e -&gt; e.active(), toList());   // Java 9
Collectors.flatMapping(o -&gt; o.items().stream(), toList());
Collectors.teeing(minBy(cmp), maxBy(cmp), Range::new);   // Java 12, two collectors at once</code></pre>
<p>The honest senior answer: reach for <code>collectingAndThen</code>, <code>mapping</code> and <code>teeing</code> first — a genuinely custom collector is rare, and the combiner must be associative or parallel results will be wrong.</p>`
},
{
  q: "What are records and where do they fit in a Spring service?",
  level: "advanced", tags: ["records", "modern-java"],
  a: `<p>A <code>record</code> is a transparent carrier for immutable data. The compiler generates the canonical constructor, accessors (<code>name()</code>, not <code>getName()</code>), <code>equals</code>, <code>hashCode</code> and <code>toString</code>.</p>
<pre><code>public record CreateOrderRequest(
        @NotBlank String customerId,
        @NotEmpty List&lt;LineItemDto&gt; items,
        @Positive BigDecimal total) {

    public CreateOrderRequest {                 // compact constructor: validate/normalise
        Objects.requireNonNull(customerId);
        items = List.copyOf(items);             // defensive copy for real immutability
    }
    public static CreateOrderRequest from(Order o) { ... }   // static factory
}</code></pre>
<p><strong>Where they fit:</strong> request/response DTOs, projections from Spring Data queries, value objects (<code>Money</code>, <code>Address</code>), events published to Kafka, and configuration via <code>@ConfigurationProperties</code> (constructor binding works out of the box).</p>
<p><strong>Where they do not:</strong> JPA entities. Hibernate needs a no-arg constructor, mutable fields and non-final classes for proxying, so a record cannot be an <code>@Entity</code> — though it is excellent as a DTO projection target in a JPQL <code>select new</code>.</p>`
},
{
  q: "Explain lazy evaluation in streams with an example that proves it",
  level: "advanced", tags: ["streams"],
  a: `<pre><code>List&lt;String&gt; names = List.of("alpha", "beta", "gamma", "delta");

Optional&lt;String&gt; first = names.stream()
    .peek(n -&gt; System.out.println("filter sees: " + n))
    .filter(n -&gt; n.length() == 4)
    .peek(n -&gt; System.out.println("map sees: " + n))
    .map(String::toUpperCase)
    .findFirst();</code></pre>
<p><strong>Output:</strong></p>
<pre><code>filter sees: alpha
filter sees: beta
map sees: beta</code></pre>
<p>Two things this proves:</p>
<ol>
<li><strong>Vertical, element-at-a-time processing.</strong> The pipeline does not run filter over the whole list then map over the whole list; each element flows all the way through before the next starts.</li>
<li><strong>Short-circuiting.</strong> "gamma" and "delta" are never touched, because <code>findFirst</code> was satisfied.</li>
</ol>
<p>Practical consequence: ordering matters for performance. Put <code>filter</code> before <code>map</code> so you transform fewer elements, and put the cheapest, most selective filter first.</p>`
},
{
  q: "Convert this imperative code to streams — and say when you would not",
  level: "advanced", tags: ["streams", "practice"],
  a: `<pre><code>// Imperative
Map&lt;String, List&lt;String&gt;&gt; result = new HashMap&lt;&gt;();
for (Employee e : employees) {
    if (e.salary().compareTo(THRESHOLD) &gt; 0) {
        result.computeIfAbsent(e.dept(), k -&gt; new ArrayList&lt;&gt;()).add(e.name());
    }
}

// Streams
Map&lt;String, List&lt;String&gt;&gt; result = employees.stream()
    .filter(e -&gt; e.salary().compareTo(THRESHOLD) &gt; 0)
    .collect(groupingBy(Employee::dept, mapping(Employee::name, toList())));</code></pre>
<p><strong>When to stay imperative</strong> — a genuinely valuable thing to volunteer:</p>
<ul>
<li>You need to <code>break</code> out early on a complex condition, or use indices across two collections.</li>
<li>The lambda must throw checked exceptions — streams force you into ugly wrappers.</li>
<li>Debugging matters: stepping through a stream in a debugger is painful compared to a loop.</li>
<li>It is a hot loop over primitives — a plain <code>for</code> avoids all pipeline overhead.</li>
<li>The stream version needs three <code>flatMap</code>s and a custom collector — at that point the loop is more readable, and readability is the point.</li>
</ul>`
}
]);
