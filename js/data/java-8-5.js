appendTopic("java-8", [
{
  q: "What are the most useful Collectors, and how do you write a custom one?",
  level: "advanced", hot: true, tags: ["collectors", "streams", "must-know"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "EPAM", "Flipkart", "Goldman Sachs", "Cognizant"],
  a: `<pre><code>// GROUPING — the workhorse
Map&lt;String, List&lt;Employee&gt;&gt; byDept =
    employees.stream().collect(Collectors.groupingBy(Employee::dept));

// With a downstream collector — this is the part people do not know
Map&lt;String, Long&gt; countByDept =
    employees.stream().collect(groupingBy(Employee::dept, counting()));

Map&lt;String, Double&gt; avgSalary =
    employees.stream().collect(groupingBy(Employee::dept, averagingInt(Employee::salary)));

Map&lt;String, List&lt;String&gt;&gt; namesByDept =
    employees.stream().collect(groupingBy(Employee::dept,
                               mapping(Employee::name, toList())));

// The highest earner per department
Map&lt;String, Optional&lt;Employee&gt;&gt; topEarner =
    employees.stream().collect(groupingBy(Employee::dept,
                               maxBy(comparingInt(Employee::salary))));

// TWO-LEVEL grouping — a nested map, in one expression
Map&lt;String, Map&lt;String, List&lt;Employee&gt;&gt;&gt; byDeptThenCity =
    employees.stream().collect(groupingBy(Employee::dept, groupingBy(Employee::city)));

// Sorted result: supply the map factory
Map&lt;String, Long&gt; sorted =
    employees.stream().collect(groupingBy(Employee::dept, TreeMap::new, counting()));</code></pre>
<table>
<tr><th>Collector</th><th>Produces</th></tr>
<tr><td><code>toList()</code> / <code>toSet()</code></td><td>A mutable list or set (use <code>stream.toList()</code> for an immutable one)</td></tr>
<tr><td><code>toMap(k, v)</code></td><td>A map — <strong>throws on duplicate keys</strong> unless you supply a merge function</td></tr>
<tr><td><code>groupingBy</code></td><td><code>Map&lt;K, List&lt;T&gt;&gt;</code>, with any downstream collector</td></tr>
<tr><td><code>partitioningBy</code></td><td><code>Map&lt;Boolean, List&lt;T&gt;&gt;</code> — always has both keys, unlike <code>groupingBy</code></td></tr>
<tr><td><code>joining(", ", "[", "]")</code></td><td>A single delimited string</td></tr>
<tr><td><code>summarizingInt</code></td><td>count, sum, min, max and average in one pass</td></tr>
<tr><td><code>teeing(c1, c2, merger)</code></td><td>Java 12+ — two collectors over one stream, merged</td></tr>
<tr><td><code>flatMapping</code> / <code>filtering</code></td><td>Java 9+ downstream collectors, cleaner than filtering before grouping</td></tr>
</table>
<pre><code>// The toMap trap that bites in production
Map&lt;String, Employee&gt; byEmail = employees.stream()
    .collect(toMap(Employee::email, e -&gt; e));
// IllegalStateException: Duplicate key — on the FIRST duplicate email.
// Always decide the merge policy explicitly:
    .collect(toMap(Employee::email, e -&gt; e, (first, dup) -&gt; first, LinkedHashMap::new));

// And toMap does NOT allow null values — it throws NPE, unlike HashMap.put.</code></pre>
<pre><code>// A custom collector: supplier, accumulator, combiner, finisher
Collector&lt;Employee, ?, String&gt; topThreeNames = Collector.of(
    () -&gt; new PriorityQueue&lt;Employee&gt;(comparingInt(Employee::salary)),  // supplier
    (pq, e) -&gt; { pq.offer(e); if (pq.size() &gt; 3) pq.poll(); },           // accumulator
    (a, b) -&gt; { b.forEach(a::offer);                                     // combiner
                while (a.size() &gt; 3) a.poll(); return a; },
    pq -&gt; pq.stream().map(Employee::name).collect(joining(", "))          // finisher
);
// The COMBINER is only used for parallel streams — and getting it wrong
// produces results that are correct sequentially and wrong in parallel,
// which is the worst kind of bug.</code></pre>
<p><strong>The point to make about <code>groupingBy</code> versus a loop:</strong> the stream version is one expression with no mutable accumulator and no <code>computeIfAbsent</code> boilerplate, and the downstream collector composes — you can change "list of employees" to "count" or "sum of salaries" by swapping one argument. That composability is the actual argument for Collectors, not brevity.</p>`
},
{
  q: "How does Optional work, and what are the rules for using it well?",
  level: "beginner", hot: true, tags: ["optional", "best-practice", "modern-java"],
  companies: ["Amazon", "Infosys", "TCS", "SAP", "Optum", "Oracle", "EPAM", "Cognizant"],
  a: `<pre><code>// ✗ Anti-patterns — these defeat the entire purpose
if (opt.isPresent()) { use(opt.get()); }            // just a null check with extra typing
opt.get();                                           // throws NoSuchElementException
Optional&lt;String&gt; o = null;                           // a NULL Optional. Never.
public void setName(Optional&lt;String&gt; n)              // never as a PARAMETER
private Optional&lt;String&gt; name;                       // never as a FIELD — not Serializable

// ✔ How it is meant to be used
String display = repo.findById(id)
    .map(User::name)                    // transform if present
    .filter(n -&gt; !n.isBlank())
    .orElse("Unknown");                 // supply a default

repo.findById(id).ifPresentOrElse(
    user -&gt; audit.log(user),
    ()   -&gt; audit.logMissing(id)
);

User user = repo.findById(id)
    .orElseThrow(() -&gt; new UserNotFoundException(id));   // the common service pattern</code></pre>
<table>
<tr><th>Method</th><th>Use for</th></tr>
<tr><td><code>map</code></td><td>Transform the value if present</td></tr>
<tr><td><code>flatMap</code></td><td>When the mapper itself returns an <code>Optional</code> — avoids nesting</td></tr>
<tr><td><code>filter</code></td><td>Keep it only if it satisfies a predicate</td></tr>
<tr><td><code>orElse(v)</code></td><td>Default value — <strong>always evaluated</strong>, even when present</td></tr>
<tr><td><code>orElseGet(supplier)</code></td><td>Lazy default — use this whenever the default is expensive</td></tr>
<tr><td><code>orElseThrow(supplier)</code></td><td>Convert absence into a domain exception</td></tr>
<tr><td><code>or(supplier)</code></td><td>Java 9+ — fall back to another <code>Optional</code></td></tr>
<tr><td><code>stream()</code></td><td>Java 9+ — flatten a stream of Optionals</td></tr>
<tr><td><code>ifPresentOrElse</code></td><td>Java 9+ — both branches without an <code>isPresent</code> check</td></tr>
</table>
<pre><code>// orElse vs orElseGet — a real performance bug
user.orElse(createExpensiveDefault());     // ✗ createExpensiveDefault() ALWAYS runs
user.orElseGet(() -&gt; createExpensiveDefault());  // ✔ only runs when empty
// If the default has a side effect — a database write, a counter increment —
// orElse silently performs it on every call, including the happy path.

// Chaining nested lookups without a pyramid of null checks
Optional&lt;String&gt; city = Optional.ofNullable(order)
    .map(Order::customer)
    .map(Customer::address)
    .map(Address::city);
// Each map short-circuits on empty, so no NullPointerException anywhere.

// Flattening a stream of Optionals (Java 9+)
List&lt;User&gt; found = ids.stream().map(repo::findById).flatMap(Optional::stream).toList();</code></pre>
<table>
<tr><th>Use <code>Optional</code></th><th>Do NOT use it</th></tr>
<tr><td>As a <strong>return type</strong> where absence is a normal outcome</td><td>As a field — it adds an object per instance and is not <code>Serializable</code></td></tr>
<tr><td>In a stream or chained lookup</td><td>As a method parameter — overload or accept null instead</td></tr>
<tr><td>To make "may be missing" visible in the signature</td><td>For collections — return an empty list, not <code>Optional&lt;List&gt;</code></td></tr>
<tr><td>—</td><td>To wrap something that is never null</td></tr>
</table>
<p><strong>The framing that lands:</strong> "<code>Optional</code> is a documentation tool in the type system, not a null-safety mechanism. It tells the caller 'this can legitimately be absent, handle it' and stops them writing <code>.getName()</code> on a null. It is not a replacement for validating input, and it should not appear in every signature — <code>List&lt;T&gt;</code> returning empty is still better than <code>Optional&lt;List&lt;T&gt;&gt;</code>."</p>`
},
{
  q: "When should you use a parallel stream, and when does it make things worse?",
  level: "advanced", hot: true, tags: ["streams", "parallel", "performance", "gotcha"],
  companies: ["Amazon", "Oracle", "SAP", "Goldman Sachs", "Optum", "Flipkart", "Morgan Stanley"],
  a: `<pre><code>// Parallel streams use the COMMON ForkJoinPool, sized to (cores - 1) and
// SHARED by the whole JVM. That single fact explains most of the guidance.

// ✔ A reasonable use: CPU-bound work over a large, splittable source
long primes = IntStream.rangeClosed(2, 10_000_000)
                       .parallel()
                       .filter(this::isPrime)
                       .count();

// ✗ The dangerous one: blocking IO in a parallel stream
urls.parallelStream().map(this::httpGet).toList();
// Every blocked thread occupies a common-pool thread. One slow endpoint
// stalls parallel streams everywhere else in the application, including
// in library code you did not write.</code></pre>
<table>
<tr><th>Good fit</th><th>Bad fit</th></tr>
<tr><td>Large data — tens of thousands of elements or more</td><td>Small collections — the split and merge cost dominates</td></tr>
<tr><td>Cheap, independent, CPU-bound operations</td><td>Any blocking IO</td></tr>
<tr><td><code>ArrayList</code>, arrays, <code>IntStream.range</code> — splits evenly</td><td><code>LinkedList</code>, <code>Stream.iterate</code> — cannot split cheaply</td></tr>
<tr><td>Stateless, side-effect-free lambdas</td><td>Anything touching shared mutable state</td></tr>
<tr><td>Reduction with an associative operation</td><td>Order-dependent work, or <code>forEach</code> where order matters</td></tr>
</table>
<pre><code>// ✗ SHARED MUTABLE STATE — corrupts silently, and passes in testing
List&lt;String&gt; out = new ArrayList&lt;&gt;();
data.parallelStream().forEach(out::add);      // ArrayList is not thread-safe:
                                              // lost elements, or an ArrayIndexOOBE
// ✔ Let the collector handle it
List&lt;String&gt; out = data.parallelStream().collect(toList());

// ✗ Order-dependent
data.parallelStream().forEach(System.out::println);        // interleaved
// ✔
data.parallelStream().forEachOrdered(System.out::println); // ordered, but serialised

// ✗ A non-associative reduction gives a DIFFERENT answer in parallel
stream.reduce(0, (a, b) -&gt; a - b);            // subtraction is not associative
// ✔ Only associative operations are safe: +, *, max, min, string concat</code></pre>
<pre><code>// Running on your OWN pool, so you do not poison the common one
ForkJoinPool pool = new ForkJoinPool(4);
List&lt;Result&gt; results = pool.submit(() -&gt;
    data.parallelStream().map(this::compute).toList()
).get();
pool.shutdown();
// Undocumented but reliable: a parallel stream started inside a ForkJoinPool
// task runs in that pool. It is the standard workaround.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Parallel stream splitting work across fork join threads">
  <rect class="dg-fill" x="220" y="20" width="180" height="30" rx="6"/><text class="dg-s" x="310" y="40" text-anchor="middle">source (spliterator)</text>
  <path class="dg-line" d="M270 50 L160 82 M350 50 L460 82"/>
  <rect class="dg-fill2" x="96" y="82" width="130" height="28" rx="6"/><text class="dg-s" x="161" y="101" text-anchor="middle">half</text>
  <rect class="dg-fill2" x="396" y="82" width="130" height="28" rx="6"/><text class="dg-s" x="461" y="101" text-anchor="middle">half</text>
  <text class="dg-s" x="16" y="138">an ArrayList splits by index in O(1); a LinkedList must be walked, so parallelism buys nothing</text>
</svg>
</figure>
<p><strong>The rule to state:</strong> "Parallel streams are a specialist tool, not a free speedup. I use them for large, CPU-bound, side-effect-free work on a splittable source — and I <em>measure</em>, because below roughly ten thousand elements the coordination overhead usually makes them slower. For IO-bound concurrency I use an executor with its own pool, or virtual threads on Java 21, so I never contend with the common ForkJoinPool."</p>`
},
{
  q: "What are records, sealed classes and pattern matching — and when do you use them?",
  level: "advanced", tags: ["modern-java", "java21", "design"],
  companies: ["Amazon", "SAP", "Optum", "EPAM", "Oracle", "Goldman Sachs", "ThoughtWorks"],
  a: `<pre><code>// RECORDS (16) — an immutable data carrier. The compiler generates
// the constructor, accessors, equals, hashCode and toString.
public record Money(String currency, long minorUnits) implements Comparable&lt;Money&gt; {

    // COMPACT CONSTRUCTOR — validation, no field assignment needed
    public Money {
        Objects.requireNonNull(currency);
        if (minorUnits &lt; 0) throw new IllegalArgumentException("negative amount");
    }
    public Money plus(Money o) {
        if (!currency.equals(o.currency)) throw new IllegalArgumentException("mixed currency");
        return new Money(currency, minorUnits + o.minorUnits);      // returns a NEW value
    }
    public int compareTo(Money o) { return Long.compare(minorUnits, o.minorUnits); }
}</code></pre>
<pre><code>// SEALED (17) — enumerate the permitted subtypes, so switch can be EXHAUSTIVE
public sealed interface PaymentResult
        permits Approved, Declined, Pending { }

public record Approved(String authCode, Money amount) implements PaymentResult { }
public record Declined(String reason)                 implements PaymentResult { }
public record Pending(Duration retryAfter)            implements PaymentResult { }

// PATTERN MATCHING FOR SWITCH (21) — no default needed, and adding a
// fourth permitted type makes this a COMPILE ERROR until it is handled.
String describe(PaymentResult r) {
    return switch (r) {
        case Approved(String code, Money amt) -&gt; "approved " + amt + " (" + code + ")";
        case Declined d when d.reason().contains("fraud") -&gt; "blocked: review";
        case Declined d -&gt; "declined: " + d.reason();
        case Pending p  -&gt; "retry in " + p.retryAfter();
    };
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Sealed interface with a fixed set of permitted implementations">
  <rect class="dg-fill" x="220" y="18" width="180" height="34" rx="8"/>
  <text class="dg-s" x="310" y="40" text-anchor="middle">sealed PaymentResult</text>
  <path class="dg-line" d="M262 52 L140 92 M310 52 V92 M358 52 L480 92"/>
  <rect class="dg-fill2" x="76" y="92" width="128" height="30" rx="6"/><text class="dg-s" x="140" y="112" text-anchor="middle">Approved</text>
  <rect class="dg-fill2" x="246" y="92" width="128" height="30" rx="6"/><text class="dg-s" x="310" y="112" text-anchor="middle">Declined</text>
  <rect class="dg-fill2" x="416" y="92" width="128" height="30" rx="6"/><text class="dg-s" x="480" y="112" text-anchor="middle">Pending</text>
  <text class="dg-s" x="16" y="144">the compiler knows the set is closed, so it can PROVE a switch covers every case</text>
</svg>
</figure>
<table>
<tr><th>Feature</th><th>Since</th><th>Replaces</th></tr>
<tr><td><code>record</code></td><td>16</td><td>Lombok <code>@Value</code>, hand-written DTOs, IDE-generated equals/hashCode</td></tr>
<tr><td><code>sealed</code></td><td>17</td><td>A comment saying "do not extend this"</td></tr>
<tr><td><code>instanceof</code> pattern</td><td>16</td><td><code>instanceof</code> followed by a cast</td></tr>
<tr><td>Switch patterns + record deconstruction</td><td>21</td><td>Visitor pattern, long if-else chains</td></tr>
<tr><td>Text blocks</td><td>15</td><td>Escaped multi-line strings for JSON and SQL</td></tr>
<tr><td>Virtual threads</td><td>21</td><td>Reactive frameworks for IO-bound concurrency</td></tr>
</table>
<pre><code>// instanceof pattern — the small change that removes a lot of noise
if (obj instanceof String s &amp;&amp; s.length() &gt; 5) { use(s); }   // no cast, scoped binding

// Records still have limits, and it is worth naming them
// - always final, cannot extend a class
// - all components are final: no JPA @Entity (Hibernate needs a no-arg constructor
//   and mutable fields), though they are excellent as JPA PROJECTIONS
// - shallow immutability: a record holding a List can still have that list mutated,
//   so defensive-copy in the compact constructor if it matters</code></pre>
<p><strong>Where these pay off together:</strong> modelling a domain result as a sealed hierarchy of records gives you an algebraic data type — the compiler enforces that every consumer handles every case, and adding a new case produces build errors at exactly the places that need updating. That is a real safety property, not syntax sugar, and it is the strongest argument for the feature set.</p>`
}
]);
