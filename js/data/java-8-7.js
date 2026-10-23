registerPrimer("java-8", `<p class="pr-lead">Java 8 changed how everyday Java is written. Its two big ideas are <b>lambdas</b> (a short way to pass a piece of behaviour around, like "how to compare two items") and <b>streams</b> (a way to process a whole list step by step, such as "keep the active users, take their emails, sort them"), written as one readable pipeline instead of loops.</p>
<div class="pr-analogy"><b>Think of it like this</b>A stream is a factory assembly line. Raw items go in at one end, pass through stations (filter out the bad ones, transform the rest, sort them), and finished results come out at the other end. You describe the stations first, and the line only starts moving when someone at the end asks for the result.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Lambda</dt><dd>A small unnamed function, written like <code>x -&gt; x * 2</code> ("take x, give back x times 2").</dd>
<dt>Functional interface</dt><dd>An interface with exactly one method to fill in. A lambda is a quick way to provide that one method.</dd>
<dt>Method reference</dt><dd>An even shorter lambda that points to an existing method, like <code>String::toUpperCase</code>.</dd>
<dt>Stream</dt><dd>A pipeline that processes items one by one. It does not store data; it flows data through steps.</dd>
<dt>Intermediate operation</dt><dd>A station on the line, such as <code>filter</code>, <code>map</code> or <code>sorted</code>. It does nothing on its own yet.</dd>
<dt>Terminal operation</dt><dd>The final step, such as <code>collect</code>, <code>count</code> or <code>forEach</code>. It starts the line moving and produces the result.</dd>
<dt>Optional</dt><dd>A box that either holds a value or is empty, used instead of returning <code>null</code>.</dd>
</dl>

<h3>Step by step: how a stream runs</h3>
<ol class="pr-steps">
<li><b>Get a stream</b> from your data: <code>names.stream()</code>.</li>
<li><b>Add stations.</b> <code>filter(n -&gt; n.length() &gt; 3)</code> keeps only long names; <code>map(String::toUpperCase)</code> turns each one to capitals. Nothing has happened yet.</li>
<li><b>Add a terminal operation</b> such as <code>findFirst()</code> or <code>collect(...)</code>. Now the line starts.</li>
<li><b>Items flow one at a time</b> through every station. The first name goes through filter and map before the second name even starts.</li>
<li><b>It stops as early as it can.</b> If you only asked for the first match, the stream stops the moment it finds one.</li>
</ol>
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

<h3>A worked example, line by line</h3>
<pre><code>List&lt;String&gt; names = List.of("Al", "Asha", "Ravi", "Meenakshi");

Optional&lt;String&gt; first = names.stream()
    .filter(n -&gt; n.length() &gt; 3)       // keep names longer than 3 letters
    .map(String::toUpperCase)           // turn each one into capitals
    .findFirst();                       // give me the first one, then stop

System.out.println(first.orElse("none"));   // ASHA</code></pre>
<ol class="pr-steps">
<li>"Al" goes to <code>filter</code>. It has only 2 letters, so it is dropped and never reaches <code>map</code>.</li>
<li>"Asha" goes to <code>filter</code>. It has 4 letters, so it passes to <code>map</code> and becomes "ASHA".</li>
<li><code>findFirst()</code> now has its answer, so the stream stops. "Ravi" and "Meenakshi" are never even looked at.</li>
<li><code>findFirst()</code> returns an <code>Optional</code>, because the list might have had no matching name. <code>orElse("none")</code> says what to use if it is empty.</li>
</ol>

<h3>The four lambda shapes you meet most</h3>
<ul>
<li><b>Function</b>: takes a value and returns another. Used in <code>map</code>, for example <code>name -&gt; name.length()</code>.</li>
<li><b>Predicate</b>: takes a value and answers true or false. Used in <code>filter</code>, for example <code>age -&gt; age &gt;= 18</code>.</li>
<li><b>Consumer</b>: takes a value and does something with it, returning nothing. Used in <code>forEach</code>.</li>
<li><b>Supplier</b>: takes nothing and produces a value. Used for defaults, such as <code>orElseGet(() -&gt; loadDefault())</code>.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting the terminal operation</p>
<p>A stream with only <code>filter</code> and <code>map</code> does nothing at all. The steps are just a description until something asks for the result.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> end every stream with a terminal operation such as <code>collect</code>, <code>toList()</code>, <code>count</code> or <code>forEach</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Changing outside variables from inside a lambda</p>
<p>Adding to an outside list from inside <code>map</code> or <code>forEach</code> works by luck. It breaks as soon as the stream runs in parallel, and it makes the code hard to follow.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> let the stream build the result for you with <code>collect(...)</code> or <code>toList()</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using a stream twice</p>
<p>A stream can only be used once. Calling a second terminal operation on the same stream throws an <code>IllegalStateException</code>.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> create a new stream from the list each time: <code>list.stream()</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Calling get() on an Optional without checking</p>
<p><code>optional.get()</code> throws an error if the Optional is empty, so it gives you the same problem null did.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use <code>orElse</code>, <code>orElseGet</code>, <code>orElseThrow</code> or <code>ifPresent</code>, which all handle the empty case.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>A lambda is a small piece of behaviour you can pass to a method.</li>
<li>A stream is a pipeline: create it, add steps, then finish with a terminal operation.</li>
<li>Nothing runs until the terminal operation, and items flow through one at a time.</li>
<li>Use <code>Optional</code> for "there may be no result" instead of returning null.</li>
<li>If a stream gets hard to read, a plain for loop is perfectly fine.</li>
</ul>
<p><b>Next:</b> the questions below cover collectors, grouping, Optional, parallel streams and the newer Java features.</p>`);

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
  companies: ["Amazon", "Goldman Sachs", "JPMorgan", "SAP", "Adobe", "Infosys"],
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
