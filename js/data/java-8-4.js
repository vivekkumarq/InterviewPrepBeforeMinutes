appendTopic("java-8", [
{
  q: "Given a list of employees, group by department and find the highest paid in each",
  level: "advanced", hot: true, tags: ["collectors", "practice"],
  companies: ["Amazon", "TCS", "Infosys", "Cognizant", "Flipkart", "Walmart", "Adobe"],
  a: `<p>The single most-asked Stream question in Java interviews. Build it up in stages so the interviewer sees your reasoning.</p>
<pre><code>record Employee(String name, String dept, BigDecimal salary, int age) { }

// 1. Group only
Map&lt;String, List&lt;Employee&gt;&gt; byDept =
    emps.stream().collect(groupingBy(Employee::dept));

// 2. Highest paid per department — returns Optional
Map&lt;String, Optional&lt;Employee&gt;&gt; top =
    emps.stream().collect(groupingBy(Employee::dept,
                          maxBy(comparing(Employee::salary))));

// 3. Unwrap the Optional — this is the answer they want
Map&lt;String, Employee&gt; topClean = emps.stream().collect(
    groupingBy(Employee::dept,
        collectingAndThen(maxBy(comparing(Employee::salary)), Optional::get)));

// 4. Just the NAME of the highest paid
Map&lt;String, String&gt; topName = emps.stream().collect(
    groupingBy(Employee::dept,
        collectingAndThen(maxBy(comparing(Employee::salary)),
                          o -&gt; o.map(Employee::name).orElse("none"))));

// 5. Common follow-ups
Map&lt;String, Long&gt; headcount = emps.stream()
    .collect(groupingBy(Employee::dept, counting()));

Map&lt;String, Double&gt; avgSalary = emps.stream()
    .collect(groupingBy(Employee::dept, averagingDouble(e -&gt; e.salary().doubleValue())));

Map&lt;String, BigDecimal&gt; payroll = emps.stream()
    .collect(groupingBy(Employee::dept,
             reducing(BigDecimal.ZERO, Employee::salary, BigDecimal::add)));

// Sorted department keys
Map&lt;String, List&lt;String&gt;&gt; namesSorted = emps.stream().collect(
    groupingBy(Employee::dept, TreeMap::new,
               mapping(Employee::name, toList())));</code></pre>
<p><strong>The mental model to explain:</strong> <code>groupingBy</code> takes a <em>classifier</em> and an optional <em>downstream collector</em> that decides what happens to each group. The default downstream is <code>toList()</code>. Once you see it that way, every variation above is just swapping the downstream — and downstreams nest arbitrarily, which is how you get multi-level aggregation with no loops.</p>
<p><strong>The two follow-ups to be ready for:</strong> "what if two employees tie on salary?" — <code>maxBy</code> returns the first encountered, so add a tie-break comparator if it matters. And "how would you do this without streams?" — a <code>HashMap</code> with <code>merge(dept, emp, (a,b) -&gt; a.salary().compareTo(b.salary()) &gt;= 0 ? a : b)</code>, which is worth knowing because it is often faster and always debuggable.</p>`
},
{
  q: "What is the difference between Collection.stream().forEach() and Collection.forEach()?",
  level: "advanced", tags: ["streams", "gotcha"],
  companies: ["Oracle", "SAP", "EPAM", "Nagarro", "Persistent"],
  a: `<pre><code>list.forEach(System.out::println);              // Iterable.forEach — direct iteration
list.stream().forEach(System.out::println);    // builds a stream pipeline first</code></pre>
<table>
<tr><th></th><th><code>Collection.forEach()</code></th><th><code>stream().forEach()</code></th></tr>
<tr><td>Defined on</td><td><code>Iterable</code></td><td><code>Stream</code></td></tr>
<tr><td>Overhead</td><td>None — a plain loop</td><td>Creates a Spliterator and pipeline</td></tr>
<tr><td>Concurrent modification</td><td>Fail-fast (<code>modCount</code> checked)</td><td>Behaviour undefined</td></tr>
<tr><td>Ordering (parallel)</td><td>N/A</td><td><strong>Not guaranteed</strong> — use <code>forEachOrdered</code></td></tr>
<tr><td>Chaining</td><td>Cannot</td><td>Can filter/map first</td></tr>
</table>
<pre><code>// Use Collection.forEach when you just iterate — simpler and faster
orders.forEach(this::process);

// Use stream() when you actually transform or filter
orders.stream()
      .filter(Order::isPaid)
      .map(Order::id)
      .forEach(this::process);

// PARALLEL: forEach does not preserve encounter order
list.parallelStream().forEach(System.out::println);        // interleaved, any order
list.parallelStream().forEachOrdered(System.out::println); // ordered, but slower</code></pre>
<p><strong>The performance point:</strong> <code>stream().forEach()</code> with no intermediate operations is pure overhead — you construct a pipeline to do what a for-each loop already does. It is a common code-review comment.</p>
<p><strong>The subtler difference:</strong> <code>ArrayList.forEach</code> checks <code>modCount</code> and throws <code>ConcurrentModificationException</code> if the list is structurally modified during iteration. The stream version's behaviour when the source is modified is explicitly <em>undefined</em> by the specification — you might get an exception, a wrong result, or silence. That unpredictability is worth mentioning.</p>
<p><strong>And the design note:</strong> <code>forEach</code> is a terminal <em>side-effect</em> operation. If you are accumulating into a collection inside it, you almost certainly want <code>collect()</code> instead — <code>forEach</code> with a shared mutable accumulator is a data race in parallel.</p>`
},
{
  q: "How do you flatten a list of lists and a Map of lists using Streams?",
  level: "beginner", hot: true, tags: ["streams", "practice"],
  companies: ["TCS", "Infosys", "Amazon", "Capgemini", "Zoho", "Paytm"],
  a: `<pre><code>// List of lists -> single list
List&lt;List&lt;String&gt;&gt; nested = List.of(List.of("a","b"), List.of("c"), List.of("d","e"));
List&lt;String&gt; flat = nested.stream()
        .flatMap(List::stream)
        .toList();                              // [a, b, c, d, e]

// Objects containing collections
List&lt;LineItem&gt; allItems = orders.stream()
        .flatMap(o -&gt; o.items().stream())
        .toList();

// Map&lt;String, List&lt;String&gt;&gt; -> flat list of values
Map&lt;String, List&lt;String&gt;&gt; deptToNames = ...;
List&lt;String&gt; everyone = deptToNames.values().stream()
        .flatMap(List::stream)
        .toList();

// Keep the key alongside each value — the follow-up they ask
List&lt;String&gt; labelled = deptToNames.entrySet().stream()
        .flatMap(e -&gt; e.getValue().stream().map(n -&gt; e.getKey() + ":" + n))
        .toList();

// Split a sentence list into words
List&lt;String&gt; words = lines.stream()
        .flatMap(l -&gt; Arrays.stream(l.split("\\\\s+")))
        .filter(w -&gt; !w.isBlank())
        .toList();

// Deeply nested — flatMap twice
List&lt;String&gt; deep = List.of(List.of(List.of("x","y")), List.of(List.of("z")))
        .stream().flatMap(List::stream).flatMap(List::stream).toList();

// Array of arrays
String[][] grid = {{"a","b"},{"c"}};
List&lt;String&gt; cells = Arrays.stream(grid).flatMap(Arrays::stream).toList();</code></pre>
<p><strong>The distinction to state clearly:</strong> <code>map</code> is one-to-one — each element becomes exactly one element, so mapping over lists gives you a <code>Stream&lt;List&lt;T&gt;&gt;</code>. <code>flatMap</code> is one-to-many — each element becomes a <em>Stream</em>, and all those streams are concatenated into one.</p>
<p><strong>Generalise it if you can:</strong> the same pattern appears as <code>Optional.flatMap</code> (avoiding <code>Optional&lt;Optional&lt;T&gt;&gt;</code>) and <code>CompletableFuture.thenCompose</code> (avoiding a nested future). Naming that connection shows you understand the abstraction rather than one API.</p>
<p><strong>Java 16+ note:</strong> <code>mapMulti</code> is a lower-allocation alternative when each element produces few results, since it pushes into a consumer instead of creating a Stream per element.</p>`
},
{
  q: "What is the difference between Stream.map and Stream.peek in terms of guarantees?",
  level: "advanced", tags: ["streams", "gotcha"],
  companies: ["Oracle", "Amazon", "SAP", "ThoughtWorks"],
  a: `<pre><code>// map — a TRANSFORMATION. Its result is used, so it always runs for every
// element the pipeline consumes.
List&lt;String&gt; upper = names.stream().map(String::toUpperCase).toList();

// peek — a SIDE EFFECT. The specification does NOT guarantee it runs.
long count = names.stream().peek(System.out::println).count();
// Since Java 9 this may print NOTHING: if the source is SIZED and no operation
// changes the count, the pipeline computes count() without traversing at all.</code></pre>
<p><strong>The three ways <code>peek</code> can silently not run:</strong></p>
<ol>
<li><strong>No terminal operation</strong> — the pipeline is lazy, so nothing executes:
<pre><code>list.stream().peek(this::save);      // does absolutely nothing</code></pre></li>
<li><strong>Elision</strong> — <code>.peek(...).count()</code> on a sized source skips traversal entirely.</li>
<li><strong>Short-circuiting</strong> — with <code>findFirst</code> or <code>limit</code>, peek runs only for the elements actually consumed.</li>
</ol>
<pre><code>// ✘ Business logic in peek — the anti-pattern
orders.stream().peek(o -&gt; o.setStatus(PROCESSED)).toList();

// ✔ Be explicit about intent
orders.forEach(o -&gt; o.setStatus(PROCESSED));                    // side effect
List&lt;Order&gt; done = orders.stream().map(Order::processed).toList(); // transformation</code></pre>
<p><strong>What <code>peek</code> is legitimately for:</strong> temporary debugging of a pipeline — seeing what reaches each stage. It demonstrates laziness nicely too:</p>
<pre><code>names.stream()
     .peek(n -&gt; System.out.println("filter sees: " + n))
     .filter(n -&gt; n.length() == 4)
     .peek(n -&gt; System.out.println("map sees: " + n))
     .findFirst();
// Proves elements flow through VERTICALLY one at a time, and that the pipeline
// stops as soon as findFirst is satisfied.</code></pre>
<p><strong>The summary to give:</strong> "<code>map</code> has a contract; <code>peek</code> has a caveat. I use peek while investigating and never leave code that depends on it executing."</p>`
},
{
  q: "How do you convert a List to a Map and handle duplicate keys?",
  level: "beginner", hot: true, tags: ["collectors", "gotcha"],
  companies: ["TCS", "Infosys", "Wipro", "Accenture", "HCL", "IBM"],
  a: `<pre><code>List&lt;Employee&gt; emps = ...;

// ✘ Throws IllegalStateException: Duplicate key ... if two employees share an id
Map&lt;String, Employee&gt; byId = emps.stream()
        .collect(toMap(Employee::id, identity()));

// ✔ Merge function decides the winner
Map&lt;String, Employee&gt; keepFirst = emps.stream()
        .collect(toMap(Employee::id, identity(), (existing, replacement) -&gt; existing));

Map&lt;String, Employee&gt; keepHighestPaid = emps.stream()
        .collect(toMap(Employee::dept, identity(),
                 (a, b) -&gt; a.salary().compareTo(b.salary()) &gt;= 0 ? a : b));

// ✔ Keep ALL duplicates — this is usually what you actually wanted
Map&lt;String, List&lt;Employee&gt;&gt; byDept = emps.stream()
        .collect(groupingBy(Employee::dept));

// ✔ Preserve ordering — toMap returns a HashMap by default
Map&lt;String, Employee&gt; ordered = emps.stream()
        .collect(toMap(Employee::id, identity(), (a, b) -&gt; a, LinkedHashMap::new));</code></pre>
<p><strong>The second trap, which is less well known:</strong> <code>Collectors.toMap</code> throws a <code>NullPointerException</code> if a <em>value</em> is null — unlike <code>HashMap.put</code>, which accepts nulls quite happily. This is a genuine surprise when mapping a nullable field:</p>
<pre><code>// NPE if any employee has a null manager
emps.stream().collect(toMap(Employee::id, Employee::manager));

// Filter first, or use groupingBy which tolerates it
emps.stream().filter(e -&gt; e.manager() != null)
             .collect(toMap(Employee::id, Employee::manager));</code></pre>
<p><strong>Why <code>toMap</code> throws on duplicates by design:</strong> silently overwriting would hide a data problem. Forcing you to supply a merge function makes the decision explicit — which is the same philosophy as <code>Optional</code> making absence explicit.</p>
<p><strong>Interview follow-up:</strong> "invert a map" — <code>map.entrySet().stream().collect(toMap(Entry::getValue, Entry::getKey, (a,b) -&gt; a))</code>, and the merge function is mandatory there because duplicate <em>values</em> become duplicate keys.</p>`
},
{
  q: "Explain lazy evaluation and short-circuiting in Streams with a measurable example",
  level: "advanced", tags: ["streams", "performance"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "Microsoft", "Adobe"],
  a: `<pre><code>// An infinite stream that terminates — only possible because of laziness
List&lt;Integer&gt; firstFivePrimes = Stream.iterate(2, n -&gt; n + 1)
        .filter(this::isPrime)
        .limit(5)                    // short-circuits: stops pulling after 5
        .toList();                    // [2, 3, 5, 7, 11]

// Order of operations changes the WORK done, not just the style
list.stream().map(this::expensive).filter(x -&gt; x &gt; 100).findFirst();   // maps until match
list.stream().filter(x -&gt; x &gt; 100).map(this::expensive).findFirst();   // filters first ✔</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Vertical element-at-a-time stream processing">
  <text class="dg-s" x="46" y="20" text-anchor="middle">source</text>
  <rect class="dg-fill" x="14" y="30" width="64" height="24" rx="4"/><text class="dg-s" x="46" y="47" text-anchor="middle">"alpha"</text>
  <rect class="dg-fill" x="14" y="60" width="64" height="24" rx="4"/><text class="dg-s" x="46" y="77" text-anchor="middle">"beta"</text>
  <rect class="dg-box" x="14" y="90" width="64" height="24" rx="4"/><text class="dg-s" x="46" y="107" text-anchor="middle">"gamma"</text>
  <path class="dg-line" d="M82 42 H150 M82 72 H150" marker-end="url(#lz1)"/>
  <rect class="dg-fill2" x="154" y="30" width="90" height="54" rx="6"/><text class="dg-s" x="199" y="62" text-anchor="middle">filter len==4</text>
  <path class="dg-line" d="M248 72 H316" marker-end="url(#lz1)"/>
  <rect class="dg-fill2" x="320" y="58" width="90" height="28" rx="6"/><text class="dg-s" x="365" y="77" text-anchor="middle">map upper</text>
  <path class="dg-line" d="M414 72 H482" marker-end="url(#lz1)"/>
  <rect class="dg-fill" x="486" y="58" width="106" height="28" rx="6"/><text class="dg-s" x="539" y="77" text-anchor="middle">findFirst → BETA</text>
  <text class="dg-s" x="300" y="132" text-anchor="middle">"gamma" is never read — the pipeline stopped at the first match</text>
  <defs><marker id="lz1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Two properties, often conflated:</strong></p>
<ul>
<li><strong>Laziness</strong> — intermediate operations do nothing until a terminal operation runs, and elements flow through the whole pipeline <em>one at a time</em> rather than stage by stage.</li>
<li><strong>Short-circuiting</strong> — <code>findFirst</code>, <code>findAny</code>, <code>anyMatch</code>, <code>allMatch</code>, <code>noneMatch</code> and <code>limit</code> stop consuming as soon as the answer is determined.</li>
</ul>
<p><strong>The practical rules that follow:</strong> put the cheapest, most selective <code>filter</code> first so you transform fewer elements; never put <code>sorted()</code> or <code>distinct()</code> before a <code>limit</code> on a large or infinite stream, because they are <em>stateful</em> and must buffer everything — that hangs forever on an infinite source.</p>
<p><strong>Interview trap:</strong> <code>Stream.iterate(1, n -&gt; n + 1).sorted().limit(5)</code> never terminates. <code>.limit(5).sorted()</code> works fine. Being able to explain why demonstrates you understand stateful versus stateless operations.</p>`
},
{
  q: "What are the Collectors you would actually use in production code?",
  level: "advanced", tags: ["collectors"],
  companies: ["Amazon", "Flipkart", "SAP", "Optum", "LTIMindtree"],
  a: `<pre><code>// The everyday ones
toList()  toSet()  toMap(k, v, merge, mapSupplier)  toUnmodifiableList()
joining(", ", "[", "]")
counting()  summingInt()  averagingDouble()  summarizingInt()
groupingBy(classifier, downstream)   partitioningBy(predicate)

// The ones that separate a fluent answer from a basic one
collectingAndThen(toList(), Collections::unmodifiableList);   // post-process the result
mapping(Employee::name, toList());                             // transform before collecting
filtering(e -&gt; e.active(), toList());                          // Java 9 — filter per GROUP
flatMapping(o -&gt; o.items().stream(), toList());                // Java 9
teeing(minBy(cmp), maxBy(cmp), Range::new);                    // Java 12 — TWO collectors, one pass
reducing(BigDecimal.ZERO, Employee::salary, BigDecimal::add);</code></pre>
<pre><code>// filtering vs a plain filter — a real difference people miss
// ✘ Departments with no active employees VANISH from the map
emps.stream().filter(Employee::active)
             .collect(groupingBy(Employee::dept));

// ✔ Every department appears, with an empty list where none are active
emps.stream().collect(groupingBy(Employee::dept,
                      filtering(Employee::active, toList())));</code></pre>
<pre><code>// teeing — min and max in ONE pass instead of two
record Range(BigDecimal min, BigDecimal max) { }
Range range = emps.stream().collect(teeing(
        minBy(comparing(Employee::salary)),
        maxBy(comparing(Employee::salary)),
        (lo, hi) -&gt; new Range(lo.get().salary(), hi.get().salary())));</code></pre>
<p><strong>The one that comes up most in review:</strong> <code>collectingAndThen</code>. It is how you return an immutable result from a mutable collector, and how you unwrap the <code>Optional</code> that <code>maxBy</code>/<code>minBy</code> produce inside a <code>groupingBy</code>.</p>
<p><strong>The honest note on custom collectors:</strong> writing a full <code>Collector.of(supplier, accumulator, combiner, finisher)</code> is rarely necessary — the composition above covers almost everything. And if you do write one, the combiner must be associative or parallel results will be silently wrong.</p>`
},
{
  q: "How does Optional help avoid NullPointerException, and where does it not?",
  level: "beginner", hot: true, tags: ["optional", "design"],
  companies: ["TCS", "Infosys", "Oracle", "Cognizant", "Deloitte", "Barclays"],
  a: `<pre><code>// The problem Optional solves: absence is invisible in the type
public Customer findByEmail(String email) { ... }    // can this return null? Read the source.
public Optional&lt;Customer&gt; findByEmail(String email); // now the compiler tells the caller

// Idiomatic chaining
String city = repo.findByEmail(email)
        .map(Customer::address)
        .map(Address::city)
        .filter(c -&gt; !c.isBlank())
        .orElse("UNKNOWN");

repo.findByEmail(email)
        .orElseThrow(() -&gt; new CustomerNotFoundException(email));

repo.findByEmail(email)
        .ifPresentOrElse(this::send, () -&gt; log.warn("no customer for {}", email));</code></pre>
<p><strong>Where Optional does NOT help — the important half of the answer:</strong></p>
<ul>
<li><strong>It does not prevent NPEs.</strong> <code>optional.get()</code> on an empty Optional throws <code>NoSuchElementException</code> — you replaced one runtime failure with another. Use <code>orElseThrow()</code> with a meaningful exception.</li>
<li><strong>An Optional can itself be null.</strong> <code>Optional&lt;X&gt; o = null;</code> compiles. Never return null from a method returning Optional.</li>
<li><strong>It does nothing for fields or parameters.</strong> It is not <code>Serializable</code>, costs an object per field, and as a parameter forces every caller to wrap. Overload instead.</li>
<li><strong>It does not validate data crossing a boundary</strong> — a JSON field absent from the payload still arrives as a null field on your DTO.</li>
</ul>
<pre><code>// The anti-patterns
if (opt.isPresent()) { use(opt.get()); }   // that IS the null check you removed
opt.orElse(expensive());                    // ALWAYS evaluated — use orElseGet
Optional&lt;List&lt;T&gt;&gt; results;                  // return an empty list instead</code></pre>
<p><strong>The rule Brian Goetz stated when designing it:</strong> Optional is intended as a <em>return type</em> for methods where absence is a likely, meaningful outcome. Used as a field, parameter or collection wrapper it adds ceremony without the benefit — and being able to cite that intent is a strong signal.</p>`
},
{
  q: "Write a custom functional interface and use it with a lambda and method reference",
  level: "beginner", tags: ["lambda", "practice"],
  companies: ["Infosys", "TCS", "Capgemini", "Mindtree", "Zoho"],
  a: `<pre><code>@FunctionalInterface
public interface Transformer&lt;T, R&gt; {
    R transform(T input);                                // the single abstract method

    default &lt;V&gt; Transformer&lt;T, V&gt; andThen(Transformer&lt;R, V&gt; next) {
        return input -&gt; next.transform(this.transform(input));
    }
    static &lt;T&gt; Transformer&lt;T, T&gt; identity() { return t -&gt; t; }
}

// 1. Lambda
Transformer&lt;String, Integer&gt; length = s -&gt; s.length();

// 2. Method reference — instance method of an arbitrary object
Transformer&lt;String, Integer&gt; length2 = String::length;

// 3. Static method reference
Transformer&lt;String, Integer&gt; parse = Integer::parseInt;

// 4. Constructor reference
Transformer&lt;String, StringBuilder&gt; build = StringBuilder::new;

// 5. Bound instance method reference
Formatter fmt = new Formatter();
Transformer&lt;Order, String&gt; render = fmt::format;

// Composition
Transformer&lt;String, String&gt; pipeline = ((Transformer&lt;String, String&gt;) String::trim)
        .andThen(String::toUpperCase)
        .andThen(s -&gt; s + "!");
pipeline.transform("  hello  ");        // "HELLO!"</code></pre>
<table>
<tr><th>Method reference kind</th><th>Syntax</th><th>Equivalent lambda</th></tr>
<tr><td>Static</td><td><code>Integer::parseInt</code></td><td><code>s -&gt; Integer.parseInt(s)</code></td></tr>
<tr><td>Bound instance</td><td><code>fmt::format</code></td><td><code>o -&gt; fmt.format(o)</code></td></tr>
<tr><td>Unbound instance</td><td><code>String::length</code></td><td><code>s -&gt; s.length()</code></td></tr>
<tr><td>Constructor</td><td><code>ArrayList::new</code></td><td><code>() -&gt; new ArrayList&lt;&gt;()</code></td></tr>
</table>
<p><strong>The kind that confuses people</strong> is the unbound instance reference: the receiver becomes the <em>first parameter</em>, so <code>String::length</code> works as a <code>Function&lt;String,Integer&gt;</code>.</p>
<p><strong>Two design points to add:</strong> <code>@FunctionalInterface</code> is optional but makes the compiler enforce the single-abstract-method rule, so nobody breaks every lambda by adding a second method. And prefer the built-in <code>Function</code>/<code>Predicate</code>/<code>Supplier</code>/<code>Consumer</code> unless a domain name genuinely adds meaning — a custom interface does not compose with the JDK's combinators.</p>`
}
]);
