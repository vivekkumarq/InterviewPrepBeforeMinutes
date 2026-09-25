registerPrimer("java-8", `<h3>The mental model: a lambda is a small object, a stream is an assembly line</h3>
<p><strong>A lambda</strong> is a short way to write an object that has exactly one method. <code>x -&gt; x * 2</code> is an object implementing a <em>functional interface</em> such as <code>Function&lt;Integer, Integer&gt;</code>. That is all it is. You can store it in a variable, pass it to a method, and return it.</p>
<p><strong>A stream</strong> is an assembly line over some data. You describe the stations (<code>filter</code>, <code>map</code>, <code>sorted</code>…) and nothing moves until you add the final station, the <strong>terminal operation</strong> (<code>collect</code>, <code>count</code>, <code>forEach</code>…). Then each element travels down the whole line one at a time, and the line stops early as soon as the answer is known.</p>
<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="Stream pipeline: source, lazy intermediate operations, terminal operation; elements flow one at a time and stop early">
  <defs><marker id="pr-j8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="30" width="110" height="54" rx="9"/>
  <text class="dg-t" x="65" y="52" text-anchor="middle">source</text>
  <text class="dg-m" x="65" y="72" text-anchor="middle">names.stream()</text>
  <line class="dg-line" x1="120" y1="57" x2="146" y2="57" marker-end="url(#pr-j8)"/>
  <rect class="dg-fill" x="148" y="30" width="120" height="54" rx="9"/>
  <text class="dg-t" x="208" y="52" text-anchor="middle">filter</text>
  <text class="dg-m" x="208" y="72" text-anchor="middle">len &gt; 3</text>
  <line class="dg-line" x1="268" y1="57" x2="294" y2="57" marker-end="url(#pr-j8)"/>
  <rect class="dg-fill" x="296" y="30" width="120" height="54" rx="9"/>
  <text class="dg-t" x="356" y="52" text-anchor="middle">map</text>
  <text class="dg-m" x="356" y="72" text-anchor="middle">toUpperCase</text>
  <line class="dg-line" x1="416" y1="57" x2="442" y2="57" marker-end="url(#pr-j8)"/>
  <rect class="dg-fill2" x="444" y="30" width="166" height="54" rx="9"/>
  <text class="dg-t" x="527" y="52" text-anchor="middle">terminal</text>
  <text class="dg-m" x="527" y="72" text-anchor="middle">findFirst()</text>
  <text class="dg-s" x="282" y="18" text-anchor="middle">INTERMEDIATE: lazy, return a new stream, do nothing yet</text>
  <text class="dg-s" x="527" y="18" text-anchor="middle">starts the flow</text>
  <text class="dg-t" x="10" y="122">"Al"</text>
  <text class="dg-s" x="80" y="122">filter says no, dropped. map never sees it</text>
  <text class="dg-t" x="10" y="148">"Asha"</text>
  <text class="dg-s" x="80" y="148">passes filter, mapped to "ASHA", findFirst has its answer</text>
  <text class="dg-t" x="10" y="174">"Ravi"</text>
  <text class="dg-s" x="80" y="174">never read: the pipeline already stopped (short-circuit)</text>
</svg>
<figcaption>Each element goes through every station before the next element starts. Nothing runs until the terminal operation asks.</figcaption>
</figure>
<h3>Worked example: prove it with print statements</h3>
<pre><code>List&lt;String&gt; names = List.of("Al", "Asha", "Ravi", "Meenakshi");

Optional&lt;String&gt; first = names.stream()
    .filter(n -&gt; { System.out.println("filter " + n); return n.length() &gt; 3; })
    .map(n -&gt;    { System.out.println("map    " + n); return n.toUpperCase(); })
    .findFirst();

// Output:
// filter Al
// filter Asha
// map    Asha
// ...and that is all. "Ravi" and "Meenakshi" are never touched.
// Remove findFirst() and NOTHING prints: without a terminal operation
// the pipeline is only a description.</code></pre>
<h3>The four functional interfaces behind almost every lambda</h3>
<table>
<tr><th>Interface</th><th>Shape</th><th>Where you meet it</th></tr>
<tr><td><code>Function&lt;T, R&gt;</code></td><td>takes T, returns R</td><td><code>map</code>, <code>Collectors.groupingBy</code>, <code>computeIfAbsent</code></td></tr>
<tr><td><code>Predicate&lt;T&gt;</code></td><td>takes T, returns boolean</td><td><code>filter</code>, <code>removeIf</code>, <code>anyMatch</code></td></tr>
<tr><td><code>Consumer&lt;T&gt;</code></td><td>takes T, returns nothing</td><td><code>forEach</code>, <code>ifPresent</code></td></tr>
<tr><td><code>Supplier&lt;T&gt;</code></td><td>takes nothing, returns T</td><td><code>orElseGet</code>, <code>Collectors.toCollection</code>, lazy defaults</td></tr>
</table>
<h3>Rules that keep streams correct</h3>
<ul>
<li><strong>No side effects inside <code>map</code> or <code>filter</code>.</strong> Do not add to an outside list from inside a lambda; collect instead. It breaks as soon as someone makes the stream parallel.</li>
<li><strong>A stream is single-use.</strong> Calling a second terminal operation throws <code>IllegalStateException</code>.</li>
<li><strong>Put cheap filters first.</strong> Every element that is dropped early skips all the work after it.</li>
<li><strong>A plain loop is fine.</strong> If the stream needs three comments to explain it, a <code>for</code> loop is the better code.</li>
</ul>`);

appendTopic("java-8", [
{
  q: "Solve five everyday data tasks with streams: distinct by field, top N per group, index, chunk, running total",
  level: "advanced", hot: true, tags: ["streams", "collectors", "coding", "must-know"],
  companies: ["Amazon", "Goldman Sachs", "Morgan Stanley", "Infosys", "TCS", "Accenture", "Walmart"],
  a: `<p>Interviewers who have seen every "filter then map" answer ask for the tasks that streams do <em>not</em> make obvious. Here are the five that come up most, each with the idiomatic answer.</p>
<pre><code>record Employee(String name, String dept, String email, double salary) {}
List&lt;Employee&gt; emps = List.of(
    new Employee("Asha",  "ENG", "asha@x.com",  180_000),
    new Employee("Ravi",  "ENG", "ravi@x.com",  150_000),
    new Employee("Meera", "ENG", "meera@x.com", 210_000),
    new Employee("John",  "OPS", "john@x.com",   90_000),
    new Employee("Asha2", "OPS", "asha@x.com",   95_000));   // duplicate email</code></pre>
<p><strong>1. Distinct by a field.</strong> <code>distinct()</code> uses <code>equals</code> on the whole object, so it cannot do "unique by email".</p>
<pre><code>// Keep the FIRST employee for each email, in the original order
List&lt;Employee&gt; uniqueByEmail = emps.stream()
    .collect(Collectors.toMap(Employee::email, e -&gt; e, (first, dup) -&gt; first,
                              LinkedHashMap::new))
    .values().stream().toList();
// The merge function (first, dup) -&gt; first decides who wins on a clash.
// Without it, toMap throws IllegalStateException on the duplicate key.</code></pre>
<p><strong>2. Top N per group.</strong></p>
<pre><code>// Two highest paid in each department
Map&lt;String, List&lt;String&gt;&gt; top2 = emps.stream()
    .collect(Collectors.groupingBy(Employee::dept, TreeMap::new,
        Collectors.collectingAndThen(Collectors.toList(), list -&gt; list.stream()
            .sorted(Comparator.comparingDouble(Employee::salary).reversed())
            .limit(2)
            .map(Employee::name)
            .toList())));
// {ENG=[Meera, Asha], OPS=[Asha2, John]}</code></pre>
<p><strong>3. With an index.</strong> Streams have no index, so stream over the indices instead.</p>
<pre><code>List&lt;String&gt; numbered = IntStream.range(0, emps.size())
    .mapToObj(i -&gt; (i + 1) + ". " + emps.get(i).name())
    .toList();
// [1. Asha, 2. Ravi, 3. Meera, 4. John, 5. Asha2]
// Only do this on a List (fast get). On a LinkedList, get(i) is O(n) each time.</code></pre>
<p><strong>4. Split into chunks</strong> (batches of 2 for a bulk API call).</p>
<pre><code>int size = 2;
List&lt;List&lt;Employee&gt;&gt; batches = IntStream.range(0, (emps.size() + size - 1) / size)
    .mapToObj(i -&gt; emps.subList(i * size, Math.min((i + 1) * size, emps.size())))
    .toList();
// 3 batches: [Asha, Ravi], [Meera, John], [Asha2]
// On Java 24+: emps.stream().gather(Gatherers.windowFixed(2)).toList()</code></pre>
<p><strong>5. Running total.</strong> Each result depends on the previous one, which streams are bad at. Say so.</p>
<pre><code>double[] salaries = emps.stream().mapToDouble(Employee::salary).toArray();
Arrays.parallelPrefix(salaries, Double::sum);    // built for exactly this
// [180000, 330000, 540000, 630000, 725000]

// Or the honest loop, which is clearer than any stream trick:
double running = 0;
for (Employee e : emps) { running += e.salary(); System.out.println(running); }</code></pre>
<table>
<tr><th>Task</th><th>Tool</th></tr>
<tr><td>Distinct by field</td><td><code>toMap</code> with a merge function and <code>LinkedHashMap::new</code></td></tr>
<tr><td>Top N per group</td><td><code>groupingBy</code> + <code>collectingAndThen</code></td></tr>
<tr><td>Index</td><td><code>IntStream.range</code> over a random-access list</td></tr>
<tr><td>Chunks</td><td><code>subList</code> windows, or <code>Gatherers.windowFixed</code> on Java 24+</td></tr>
<tr><td>Running total</td><td><code>Arrays.parallelPrefix</code> or a loop</td></tr>
</table>
<p><strong>The point worth saying out loud:</strong> knowing when a loop is clearer (the running total) is as much a sign of experience as knowing the collector tricks.</p>`
},
{
  q: "Build a validation pipeline by composing Predicate and Function",
  level: "advanced", tags: ["lambdas", "functional-interfaces", "composition"],
  companies: ["Amazon", "Goldman Sachs", "JP Morgan", "SAP", "Adobe", "Infosys"],
  a: `<p>The functional interfaces are more than lambda targets. <code>Predicate</code> and <code>Function</code> have <strong>default methods that combine them</strong>, which lets you build behaviour out of small named pieces instead of one long method full of <code>if</code> statements.</p>
<pre><code>record Signup(String email, String password, int age, String country) {}

// Small, named, individually testable rules
Predicate&lt;Signup&gt; hasEmail    = s -&gt; s.email() != null &amp;&amp; s.email().contains("@");
Predicate&lt;Signup&gt; strongPass  = s -&gt; s.password() != null &amp;&amp; s.password().length() &gt;= 8;
Predicate&lt;Signup&gt; isAdult     = s -&gt; s.age() &gt;= 18;
Predicate&lt;Signup&gt; blocked     = s -&gt; Set.of("XX", "YY").contains(s.country());

// Combine them like boolean algebra
Predicate&lt;Signup&gt; valid = hasEmail.and(strongPass).and(isAdult).and(blocked.negate());

valid.test(new Signup("a@b.com", "hunter22!", 30, "IN"));   // true
valid.test(new Signup("a@b.com", "short",     30, "IN"));   // false</code></pre>
<p>A plain predicate only answers yes or no. A real form needs to say <strong>which</strong> rules failed. Pair each rule with a message:</p>
<pre><code>record Rule&lt;T&gt;(String message, Predicate&lt;T&gt; check) {}

List&lt;Rule&lt;Signup&gt;&gt; rules = List.of(
    new Rule&lt;&gt;("Enter a valid email",               hasEmail),
    new Rule&lt;&gt;("Password needs 8+ characters",      strongPass),
    new Rule&lt;&gt;("You must be 18 or older",           isAdult),
    new Rule&lt;&gt;("Signups from your region are closed", blocked.negate()));

static &lt;T&gt; List&lt;String&gt; validate(T input, List&lt;Rule&lt;T&gt;&gt; rules) {
    return rules.stream()
        .filter(r -&gt; !r.check().test(input))
        .map(Rule::message)
        .toList();
}

validate(new Signup("nope", "short", 16, "IN"), rules);
// [Enter a valid email, Password needs 8+ characters, You must be 18 or older]
// Adding a rule is one line in the list. No method gets longer.</code></pre>
<p><strong>Function composition</strong> works the same way for transformations: clean the input first, then validate it.</p>
<pre><code>Function&lt;String, String&gt; trim  = String::trim;
Function&lt;String, String&gt; lower = String::toLowerCase;
Function&lt;String, String&gt; normaliseEmail = trim.andThen(lower);   // trim, THEN lower

normaliseEmail.apply("  Asha@Corp.COM ");     // "asha@corp.com"

// andThen vs compose - the order is the whole difference:
Function&lt;Integer, Integer&gt; plus2  = x -&gt; x + 2;
Function&lt;Integer, Integer&gt; times3 = x -&gt; x * 3;
plus2.andThen(times3).apply(1);   // (1 + 2) * 3 = 9    this first, then that
plus2.compose(times3).apply(1);   // (1 * 3) + 2 = 5    that first, then this</code></pre>
<table>
<tr><th>Interface</th><th>Combining methods</th></tr>
<tr><td><code>Predicate</code></td><td><code>and</code>, <code>or</code>, <code>negate</code>, <code>Predicate.not(...)</code>, <code>Predicate.isEqual(...)</code></td></tr>
<tr><td><code>Function</code></td><td><code>andThen</code>, <code>compose</code>, <code>Function.identity()</code></td></tr>
<tr><td><code>Consumer</code></td><td><code>andThen</code>: run one, then the other, on the same input</td></tr>
<tr><td><code>Comparator</code></td><td><code>thenComparing</code>, <code>reversed</code>, <code>nullsFirst</code></td></tr>
</table>
<pre><code>// Predicate.not reads well with method references (Java 11+)
lines.stream().filter(Predicate.not(String::isBlank)).toList();</code></pre>
<p><strong>Why an interviewer asks this:</strong> it separates people who use lambdas as shorter anonymous classes from people who treat behaviour as data. The rule list above is the Strategy pattern with no classes at all, and it is how validation libraries and Spring's own condition matching are built.</p>`
}
]);
