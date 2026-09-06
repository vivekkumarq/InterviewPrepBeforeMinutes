appendTopic("java-8", [
{
  q: "What is the difference between Stream.of, Arrays.stream and Collection.stream?",
  level: "beginner", tags: ["streams"],
  a: `<pre><code>String[] arr = {"a", "b", "c"};

Arrays.stream(arr);          // Stream&lt;String&gt; of 3 elements
Stream.of(arr);              // Stream&lt;String&gt; of 3 elements (varargs spread)

int[] nums = {1, 2, 3};
Arrays.stream(nums);         // IntStream — 3 elements  ✔
Stream.of(nums);             // Stream&lt;int[]&gt; — ONE element, the array itself!  ✘

Arrays.stream(arr, 1, 3);    // range: only "b","c" — Stream.of cannot do this</code></pre>
<p><strong>The trap:</strong> <code>Stream.of</code> with a primitive array gives you a stream of <em>one</em> element (the array), because varargs cannot spread <code>int[]</code> into <code>Integer</code> arguments. With an object array it works, because <code>String[]</code> matches <code>T...</code>. Always use <code>Arrays.stream</code> for arrays — it is unambiguous and supports ranges.</p>
<pre><code>// Primitive streams avoid boxing entirely
IntStream.of(1, 2, 3).sum();                  // int, no Integer allocation
list.stream().mapToInt(Order::quantity).sum();
IntStream.range(0, 10).boxed().toList();      // back to Stream&lt;Integer&gt; when needed
IntStream.of(1,2,3).average().orElse(0);      // returns OptionalDouble</code></pre>
<p><code>Collection.stream()</code> is the default entry point and is a <code>default</code> method on <code>Collection</code> — which is precisely why <code>default</code> methods were added to Java 8, so <code>stream()</code> could be introduced without breaking every existing implementation.</p>`
},
{
  q: "How do you handle checked exceptions inside a lambda?",
  level: "advanced", hot: true, tags: ["lambda", "gotcha"],
  a: `<p>The built-in functional interfaces do not declare checked exceptions, so this does not compile:</p>
<pre><code>List&lt;String&gt; contents = paths.stream()
        .map(p -&gt; Files.readString(p))     // ✘ unhandled IOException
        .toList();</code></pre>
<p><strong>Options, worst to best:</strong></p>
<pre><code>// 1. Inline try/catch — verbose and it litters the pipeline
.map(p -&gt; { try { return Files.readString(p); }
            catch (IOException e) { throw new UncheckedIOException(e); } })

// 2. A reusable wrapper — much cleaner at the call site
@FunctionalInterface
interface ThrowingFunction&lt;T, R&gt; { R apply(T t) throws Exception; }

static &lt;T, R&gt; Function&lt;T, R&gt; unchecked(ThrowingFunction&lt;T, R&gt; f) {
    return t -&gt; {
        try { return f.apply(t); }
        catch (RuntimeException e) { throw e; }
        catch (Exception e) { throw new RuntimeException(e); }
    };
}
paths.stream().map(unchecked(Files::readString)).toList();

// 3. Return a result type instead of throwing — best when failures are EXPECTED
record Result&lt;T&gt;(T value, Exception error) { }
var results = paths.stream().map(Pipeline::readSafely).toList();
var successes = results.stream().filter(r -&gt; r.error() == null).map(Result::value).toList();
var failures  = results.stream().filter(r -&gt; r.error() != null).toList();

// 4. Just use a for loop — genuinely the right answer sometimes
for (Path p : paths) contents.add(Files.readString(p));   // throws naturally</code></pre>
<p><strong>The judgement to express:</strong> option 2 is fine for "this should never fail" cases, but it discards the type information the checked exception was providing. When individual failures are expected and must be reported (a batch import), option 3 is better because it keeps both outcomes. And when the loop is clearer, use the loop — streams are not an obligation.</p>`
},
{
  q: "What is Collectors.groupingBy with downstream collectors — show three levels",
  level: "advanced", hot: true, tags: ["collectors"],
  a: `<pre><code>record Employee(String name, String dept, String city, BigDecimal salary, int age) {}

// 1. Simple grouping
Map&lt;String, List&lt;Employee&gt;&gt; byDept =
    emps.stream().collect(groupingBy(Employee::dept));

// 2. Count / sum / average per group
Map&lt;String, Long&gt; headcount =
    emps.stream().collect(groupingBy(Employee::dept, counting()));

Map&lt;String, BigDecimal&gt; payroll = emps.stream().collect(
    groupingBy(Employee::dept,
        reducing(BigDecimal.ZERO, Employee::salary, BigDecimal::add)));

// 3. Transform the grouped values
Map&lt;String, List&lt;String&gt;&gt; namesByDept = emps.stream().collect(
    groupingBy(Employee::dept, mapping(Employee::name, toList())));

Map&lt;String, Set&lt;String&gt;&gt; citiesByDept = emps.stream().collect(
    groupingBy(Employee::dept, mapping(Employee::city, toCollection(TreeSet::new))));

// 4. Highest earner per department
Map&lt;String, Optional&lt;Employee&gt;&gt; topEarner = emps.stream().collect(
    groupingBy(Employee::dept, maxBy(comparing(Employee::salary))));

// unwrap the Optional with collectingAndThen
Map&lt;String, Employee&gt; topEarnerClean = emps.stream().collect(
    groupingBy(Employee::dept,
        collectingAndThen(maxBy(comparing(Employee::salary)), Optional::get)));

// 5. Nested grouping, sorted outer keys
Map&lt;String, Map&lt;String, List&lt;Employee&gt;&gt;&gt; byDeptThenCity = emps.stream().collect(
    groupingBy(Employee::dept, TreeMap::new, groupingBy(Employee::city)));

// 6. Statistics in one pass
Map&lt;String, IntSummaryStatistics&gt; ageStats = emps.stream().collect(
    groupingBy(Employee::dept, summarizingInt(Employee::age)));</code></pre>
<p><strong>The mental model to state:</strong> <code>groupingBy</code> takes a classifier and a <em>downstream collector</em> that decides what happens to each group. The default downstream is <code>toList()</code>. Once you see it that way, every combination above is just swapping the downstream — and downstreams nest arbitrarily, which is how you get multi-level aggregation without any loops.</p>`
},
{
  q: "What is the difference between Optional.map and Optional.flatMap?",
  level: "beginner", tags: ["optional"],
  a: `<pre><code>class Customer { Optional&lt;Address&gt; address(); String name(); }
class Address  { Optional&lt;String&gt; city(); String street(); }

Optional&lt;Customer&gt; customer = repo.findById(id);

// map — the function returns a PLAIN value
Optional&lt;String&gt; name = customer.map(Customer::name);

// map with a function that itself returns Optional -> nested, almost never what you want
Optional&lt;Optional&lt;Address&gt;&gt; nested = customer.map(Customer::address);   // ✘

// flatMap — flattens one level
Optional&lt;Address&gt; addr = customer.flatMap(Customer::address);           // ✔
Optional&lt;String&gt; city  = customer.flatMap(Customer::address)
                                 .flatMap(Address::city);                // chains safely

// The full idiomatic chain
String cityName = repo.findById(id)
        .flatMap(Customer::address)
        .flatMap(Address::city)
        .map(String::toUpperCase)
        .filter(c -&gt; !c.isBlank())
        .orElse("UNKNOWN");</code></pre>
<p><strong>The rule:</strong> if the mapping function returns <code>Optional&lt;X&gt;</code>, use <code>flatMap</code>; if it returns <code>X</code>, use <code>map</code>.</p>
<p><strong>Worth generalising:</strong> this is the same distinction as <code>Stream.map</code> vs <code>Stream.flatMap</code> and <code>CompletableFuture.thenApply</code> vs <code>thenCompose</code>. All three are the same pattern — <code>flatMap</code> composes two nested containers into one. Saying that shows you understand the abstraction rather than three separate API rules.</p>
<p>Other useful methods: <code>or(Supplier&lt;Optional&gt;)</code> for a fallback Optional (Java 9), <code>stream()</code> to turn it into a 0-or-1 stream, and <code>ifPresentOrElse</code>.</p>`
},
{
  q: "What are the primitive streams and when do they matter?",
  level: "advanced", tags: ["streams", "performance"],
  a: `<p><code>IntStream</code>, <code>LongStream</code> and <code>DoubleStream</code> exist purely to avoid boxing. A <code>Stream&lt;Integer&gt;</code> allocates an <code>Integer</code> object per element (beyond the −128..127 cache) and dereferences a pointer for every operation.</p>
<pre><code>// Boxing: allocates ~1M Integer objects
list.stream().map(Order::quantity).reduce(0, Integer::sum);

// No boxing at all
list.stream().mapToInt(Order::quantity).sum();

// Conversions
IntStream.range(0, 5);                       // 0..4
IntStream.rangeClosed(1, 5);                 // 1..5
stream.mapToInt(String::length);             // Stream&lt;T&gt; -&gt; IntStream
intStream.boxed();                           // IntStream -&gt; Stream&lt;Integer&gt;
intStream.mapToObj(i -&gt; "item-" + i);        // IntStream -&gt; Stream&lt;String&gt;
intStream.asDoubleStream();

// Terminal operations unique to primitive streams
int total = intStream.sum();                          // no equivalent on Stream&lt;T&gt;
OptionalDouble avg = intStream.average();
IntSummaryStatistics st = intStream.summaryStatistics();   // count, sum, min, max, average
int max = intStream.max().orElse(0);                  // OptionalInt, not Optional&lt;Integer&gt;</code></pre>
<p><strong>When it genuinely matters:</strong> large collections, tight loops, and anything on a hot request path — the difference can be several times faster and dramatically less garbage. For a list of 20 items it is irrelevant, and readability should win.</p>
<p><strong>Two gotchas:</strong> <code>IntStream.average()</code> returns <code>OptionalDouble</code>, not <code>Optional&lt;Double&gt;</code> — different type, same idea. And there is no <code>CharStream</code>; <code>"abc".chars()</code> gives an <code>IntStream</code>, so you need <code>mapToObj(c -&gt; (char) c)</code> to get characters back.</p>`
},
{
  q: "How does Stream.sorted() behave and what is a stable sort here?",
  level: "advanced", tags: ["streams", "sorting"],
  a: `<pre><code>// Natural order — elements must be Comparable, else ClassCastException at runtime
stream.sorted();

// With a comparator
stream.sorted(comparing(Employee::dept).thenComparing(Employee::name));

// Multi-pass stable sorting achieves the same result as a compound comparator
list.stream().sorted(comparing(Employee::name))       // secondary key FIRST
             .sorted(comparing(Employee::dept))       // primary key LAST
             .toList();</code></pre>
<p><strong>Why the two-pass version works:</strong> <code>sorted()</code> is <strong>stable</strong> — equal elements keep their relative order — so sorting by name and then by department leaves names ordered within each department. It is less efficient than one compound comparator, but the property is worth knowing.</p>
<p><strong>Characteristics of <code>sorted()</code> that affect performance:</strong></p>
<ul>
<li>It is a <strong>stateful intermediate operation</strong> — it must buffer the entire stream before emitting anything, so it breaks laziness and is fatal on an infinite stream.</li>
<li>It is a full O(n log n) sort even if you only take the first element afterwards. For "top N", a bounded <code>PriorityQueue</code> is O(n log k) — much better for large n and small k.</li>
<li>If the source is already <code>SORTED</code> with the same comparator, the pipeline can skip it entirely (that is a Spliterator characteristic).</li>
<li>In a parallel stream, <code>sorted()</code> requires a merge step, which limits the speedup.</li>
</ul>
<pre><code>// Cheaper "top 3" than sorting everything
list.stream().collect(collectingAndThen(
    toCollection(() -&gt; new PriorityQueue&lt;&gt;(comparing(Employee::salary))),
    q -&gt; { while (q.size() &gt; 3) q.poll(); return new ArrayList&lt;&gt;(q); }));</code></pre>`
},
{
  q: "What is a functional interface with generics and how do you design a good one?",
  level: "advanced", tags: ["lambda", "design"],
  a: `<pre><code>@FunctionalInterface
public interface Validator&lt;T&gt; {
    ValidationResult validate(T value);              // the single abstract method

    // default methods compose without breaking the SAM rule
    default Validator&lt;T&gt; and(Validator&lt;T&gt; other) {
        return v -&gt; {
            var r = this.validate(v);
            return r.valid() ? other.validate(v) : r;
        };
    }
    default Validator&lt;T&gt; or(Validator&lt;T&gt; other) {
        return v -&gt; { var r = this.validate(v); return r.valid() ? r : other.validate(v); };
    }
    // static factories belong on the interface too
    static &lt;T&gt; Validator&lt;T&gt; of(Predicate&lt;T&gt; p, String message) {
        return v -&gt; p.test(v) ? ValidationResult.ok() : ValidationResult.fail(message);
    }
}

Validator&lt;Order&gt; rules = Validator.&lt;Order&gt;of(o -&gt; o.total().signum() &gt; 0, "total must be positive")
        .and(Validator.of(o -&gt; !o.items().isEmpty(), "order must have items"))
        .and(Validator.of(o -&gt; o.customerId() != null, "customer required"));</code></pre>
<p><strong>Design guidance:</strong></p>
<ul>
<li><strong>Prefer the built-in interfaces</strong> — <code>Function</code>, <code>Predicate</code>, <code>Supplier</code>, <code>Consumer</code> — so your API composes with the rest of the JDK. Define your own only when the name genuinely adds meaning (<code>Validator</code>, <code>RetryPolicy</code>) or you need extra type parameters.</li>
<li><strong>Always annotate <code>@FunctionalInterface</code></strong> — it makes the compiler enforce exactly one abstract method, so nobody accidentally breaks every lambda by adding a second.</li>
<li><strong>Provide <code>default</code> combinators</strong> (<code>and</code>, <code>or</code>, <code>andThen</code>) — that is what turns an interface into a small composable DSL.</li>
<li><strong>Put the function parameter last</strong> in method signatures, so the lambda reads naturally at the call site.</li>
</ul>`
},
{
  q: "What is the CompletableFuture equivalent of Promise.all and how do you handle timeouts?",
  level: "advanced", hot: true, tags: ["async"],
  a: `<pre><code>var a = CompletableFuture.supplyAsync(() -&gt; customerClient.fetch(id), ioPool);
var b = CompletableFuture.supplyAsync(() -&gt; orderClient.fetch(id), ioPool);
var c = CompletableFuture.supplyAsync(() -&gt; ticketClient.fetch(id), ioPool);

// allOf — wait for ALL. Returns Void, so join each future for its value.
CompletableFuture&lt;Void&gt; all = CompletableFuture.allOf(a, b, c);
CustomerView view = all.thenApply(v -&gt; new CustomerView(a.join(), b.join(), c.join()))
                       .orTimeout(3, TimeUnit.SECONDS)
                       .exceptionally(ex -&gt; CustomerView.partial())
                       .join();

// anyOf — first to COMPLETE (success or failure) wins
CompletableFuture&lt;Object&gt; fastest = CompletableFuture.anyOf(primary, secondary);

// Timeouts (Java 9+)
future.orTimeout(2, SECONDS);                          // fails with TimeoutException
future.completeOnTimeout(fallbackValue, 2, SECONDS);   // succeeds with a default

// Collecting a dynamic list of futures
List&lt;CompletableFuture&lt;Order&gt;&gt; futures = ids.stream()
        .map(i -&gt; CompletableFuture.supplyAsync(() -&gt; fetch(i), ioPool))
        .toList();
List&lt;Order&gt; results = CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new))
        .thenApply(v -&gt; futures.stream().map(CompletableFuture::join).toList())
        .join();</code></pre>
<p><strong>Details that matter:</strong> <code>allOf</code> returns <code>CompletableFuture&lt;Void&gt;</code> because the futures may have different types — you join each one afterwards, which is safe because they have all completed. If <em>any</em> fails, <code>allOf</code> completes exceptionally, so add <code>exceptionally</code> or use <code>handle</code> per future if you want partial results.</p>
<p><strong>The production rule:</strong> always pass your own executor and always set a timeout. The default is the common ForkJoinPool sized to cores−1, so one blocking call there degrades every parallel stream in the JVM — and a future with no timeout can hang a request thread indefinitely.</p>`
},
{
  q: "What are the Java 8 date/time formatting and parsing APIs?",
  level: "beginner", tags: ["datetime"],
  a: `<pre><code>// Formatters are IMMUTABLE and thread-safe — make them static constants
private static final DateTimeFormatter ISO   = DateTimeFormatter.ISO_LOCAL_DATE;
private static final DateTimeFormatter INDIA =
        DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm").withZone(ZoneId.of("Asia/Kolkata"));

LocalDate d = LocalDate.parse("2026-09-06");                    // ISO by default
LocalDate d2 = LocalDate.parse("06-09-2026", DateTimeFormatter.ofPattern("dd-MM-yyyy"));
String out = INDIA.format(Instant.now());

// Localised output
DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(Locale.forLanguageTag("en-IN"));

// Parsing failures throw DateTimeParseException — handle at the boundary
try { LocalDate.parse(input, INDIA); }
catch (DateTimeParseException e) { throw new BadRequestException("invalid date: " + input); }</code></pre>
<p><strong>Pattern letters that get confused:</strong></p>
<table>
<tr><th>Letter</th><th>Means</th><th>Common mistake</th></tr>
<tr><td><code>yyyy</code></td><td>Year of era</td><td>Using <code>YYYY</code> (week-based year) — wrong around 31 December</td></tr>
<tr><td><code>MM</code></td><td>Month</td><td>Using <code>mm</code>, which is minutes</td></tr>
<tr><td><code>dd</code></td><td>Day of month</td><td>Using <code>DD</code>, which is day of year</td></tr>
<tr><td><code>HH</code></td><td>Hour 0–23</td><td>Using <code>hh</code> (1–12) without <code>a</code> for AM/PM</td></tr>
</table>
<p><strong>The <code>YYYY-MM-dd</code> bug is a real production classic:</strong> on 31 December 2026 it can print 2027, because ISO week-based years start before the calendar year does. It passes every test written in June.</p>
<p><strong>Rules for services:</strong> store and transmit UTC <code>Instant</code>s in ISO-8601; convert to a zone only for display; and never store a <code>LocalDateTime</code> for an event that happened at a moment in time — it has no zone, so it is ambiguous across DST transitions.</p>`
},
{
  q: "How do you convert between collections, arrays and streams?",
  level: "beginner", tags: ["streams", "collections"],
  a: `<pre><code>// Collection -&gt; Stream -&gt; Collection
List&lt;String&gt; list = stream.toList();                         // Java 16, IMMUTABLE
List&lt;String&gt; mutable = stream.collect(toCollection(ArrayList::new));
Set&lt;String&gt; set = stream.collect(toSet());                    // unordered
Set&lt;String&gt; ordered = stream.collect(toCollection(LinkedHashSet::new));
Map&lt;K,V&gt; map = stream.collect(toMap(K::of, V::of, (a,b) -&gt; a, LinkedHashMap::new));

// Stream -&gt; array
String[] arr = stream.toArray(String[]::new);                 // typed
Object[] objs = stream.toArray();                             // untyped
int[] ints = intStream.toArray();

// Array -&gt; Stream / List
Arrays.stream(arr);
List&lt;String&gt; view = Arrays.asList(arr);                       // FIXED-SIZE view
List&lt;String&gt; copy = new ArrayList&lt;&gt;(Arrays.asList(arr));      // mutable copy
List&lt;String&gt; immutable = List.of(arr);                        // immutable copy

// Map -&gt; Stream
map.entrySet().stream().map(e -&gt; e.getKey() + "=" + e.getValue());
map.keySet().stream(); map.values().stream();

// List -&gt; Map by key
Map&lt;Long, Order&gt; byId = orders.stream()
        .collect(toMap(Order::id, identity()));               // throws on duplicate keys!</code></pre>
<p><strong>Three traps worth naming:</strong></p>
<ul>
<li><code>Stream.toList()</code> (Java 16) returns an <strong>immutable</strong> list, while <code>collect(Collectors.toList())</code> historically returns an <code>ArrayList</code>. Code that worked stops working when you switch — an easy migration bug.</li>
<li><code>toMap</code> with duplicate keys throws <code>IllegalStateException</code>. Always supply the merge function unless keys are provably unique.</li>
<li><code>toMap</code> also throws <code>NullPointerException</code> if a <em>value</em> is null, unlike <code>HashMap.put</code>. Filter nulls first or use <code>groupingBy</code>.</li>
</ul>`
},
{
  q: "What is the Stream.peek() operation and why should you avoid it?",
  level: "advanced", tags: ["streams", "gotcha"],
  a: `<pre><code>// Intended use: debugging a pipeline
list.stream()
    .peek(o -&gt; log.debug("before filter: {}", o))
    .filter(Order::isPaid)
    .peek(o -&gt; log.debug("after filter: {}", o))
    .toList();</code></pre>
<p><strong>Why it is a trap:</strong></p>
<ul>
<li><strong>It may never run.</strong> <code>peek</code> is a lazy intermediate operation, so without a terminal operation nothing executes at all:
<pre><code>list.stream().peek(this::save);       // does absolutely nothing</code></pre></li>
<li><strong>The JDK may skip it entirely.</strong> Since Java 9, if the pipeline can determine the result without traversing elements — for example <code>.peek(...).count()</code> on a <code>SIZED</code> source — it elides the traversal and your peek never fires. The Javadoc explicitly permits this.</li>
<li><strong>Short-circuiting changes what you see</strong> — with <code>findFirst</code> or <code>limit</code>, peek runs only for the elements actually consumed.</li>
<li><strong>Unordered in parallel</strong> — log output interleaves meaninglessly.</li>
</ul>
<pre><code>// ✘ Using peek for business logic — the actual anti-pattern
orders.stream().peek(o -&gt; o.setStatus(PROCESSED)).toList();

// ✔ Make the intent explicit
orders.forEach(o -&gt; o.setStatus(PROCESSED));                 // side effect: use forEach
List&lt;Order&gt; updated = orders.stream().map(Order::processed).toList();  // or map immutably</code></pre>
<p><strong>The summary to give:</strong> "<code>peek</code> is a debugging aid whose execution the specification does not guarantee. I use it temporarily while investigating a pipeline and never leave it in code that depends on it running."</p>`
}
]);
