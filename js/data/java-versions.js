registerTopic("java-versions", [
{
  q: "What are the Java LTS releases, and which version should a new project target?",
  level: "beginner", hot: true, tags: ["versions", "lts", "release-cadence"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Amazon", "Oracle", "SAP", "Optum"],
  a: `<p>Since Java 9, a new feature release ships <strong>every six months</strong> and one release every two years is designated <strong>LTS</strong> (Long-Term Support). Non-LTS releases are supported only until the next one arrives, so production systems track the LTS line.</p>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Java release timeline with LTS versions marked">
  <path class="dg-line" d="M30 96 H596"/>
  <circle class="dg-fill" cx="60" cy="96" r="12"/><text class="dg-t" x="60" y="74" text-anchor="middle">8</text>
  <text class="dg-s" x="60" y="122" text-anchor="middle">2014</text>
  <circle class="dg-fill" cx="180" cy="96" r="12"/><text class="dg-t" x="180" y="74" text-anchor="middle">11</text>
  <text class="dg-s" x="180" y="122" text-anchor="middle">2018</text>
  <circle class="dg-fill" cx="310" cy="96" r="12"/><text class="dg-t" x="310" y="74" text-anchor="middle">17</text>
  <text class="dg-s" x="310" y="122" text-anchor="middle">2021</text>
  <circle class="dg-fill2" cx="440" cy="96" r="13"/><text class="dg-t" x="440" y="74" text-anchor="middle">21</text>
  <text class="dg-s" x="440" y="122" text-anchor="middle">2023</text>
  <circle class="dg-fill2" cx="560" cy="96" r="13"/><text class="dg-t" x="560" y="74" text-anchor="middle">25</text>
  <text class="dg-s" x="560" y="122" text-anchor="middle">2025</text>
  <text class="dg-s" x="16" y="30">LTS every two years · feature releases every six months in between</text>
  <text class="dg-s" x="16" y="152">the small releases between LTS versions are where features arrive as PREVIEWS first</text>
</svg>
</figure>
<table>
<tr><th>Version</th><th>Released</th><th>Why it mattered</th></tr>
<tr><td><strong>8</strong></td><td>2014</td><td>Lambdas and streams. Still the most deployed version, and the one teams are migrating <em>off</em>.</td></tr>
<tr><td><strong>11</strong></td><td>2018</td><td>First LTS after 8. <code>var</code>, the standard <code>HttpClient</code>, new String methods.</td></tr>
<tr><td><strong>17</strong></td><td>2021</td><td>Records, sealed classes, text blocks and switch expressions all final. The minimum for Spring Boot 3.</td></tr>
<tr><td><strong>21</strong></td><td>2023</td><td><strong>Virtual threads</strong>, pattern matching for switch, record patterns, sequenced collections.</td></tr>
<tr><td><strong>25</strong></td><td>2025</td><td>Current LTS. Scoped values, module imports, simplified source files.</td></tr>
</table>
<pre><code>// What to check, and what to say
java -version              // the JDK you are RUNNING on
mvn -v                     // the JDK Maven is using — often a different one

&lt;properties&gt;
  &lt;maven.compiler.release&gt;21&lt;/maven.compiler.release&gt;   // prefer --release over
&lt;/properties&gt;                                            // source+target: it also
                                                         // checks the API you use
                                                         // exists in that version</code></pre>
<p><strong>The answer to give:</strong> "For a new project I target the newest LTS the ecosystem supports — currently 21 or 25 depending on the libraries. For an existing system I would move to at least 17, because that is the floor for Spring Boot 3 and Jakarta EE 10, and because Java 8's free public updates from Oracle ended years ago. Running a non-LTS release in production means re-upgrading every six months, which no team wants to own."</p>
<p><strong>The distinction interviewers like you to make:</strong> the <em>language version</em>, the <em>JDK you compile with</em>, and the <em>JVM you run on</em> are three separate choices. You can run on a Java 21 JVM while still compiling with <code>--release 11</code> — which is exactly how a careful migration starts, because you get the newer GC and performance work before you change a single line of code.</p>`
},
{
  q: "What did Java 9, 10 and 11 add beyond the module system?",
  level: "beginner", hot: true, tags: ["java9", "java11", "versions"],
  companies: ["TCS", "Infosys", "Amazon", "Oracle", "Cognizant", "SAP", "Optum", "Capgemini"],
  a: `<pre><code>// ---- JAVA 9 ----
List&lt;String&gt; l = List.of("a", "b", "c");        // immutable factory methods
Map&lt;String, Integer&gt; m = Map.of("a", 1, "b", 2);
Set&lt;String&gt; s = Set.of("x", "y");
// These are IMMUTABLE and reject nulls — different from Arrays.asList(),
// which is fixed-size but mutable and allows nulls.

Stream.of(1, 2, 3, 4, 1).takeWhile(n -&gt; n &lt; 4);   // [1, 2, 3]  stops at the first false
Stream.of(1, 2, 3, 4, 1).dropWhile(n -&gt; n &lt; 4);   // [4, 1]     drops until first false
Stream.ofNullable(maybeNull);                      // 0 or 1 elements, no null check
Stream.iterate(1, n -&gt; n &lt; 100, n -&gt; n * 2);       // 3-arg form: a for-loop as a stream

opt.ifPresentOrElse(this::use, this::fallback);    // both branches, no isPresent()
opt.or(() -&gt; findElsewhere());                     // fall back to another Optional
opt.stream();                                      // flatten a stream of Optionals

interface Calc {
    private int helper() { return 1; }             // PRIVATE interface methods
    default int calc() { return helper() * 2; }    // so defaults can share code
}</code></pre>
<pre><code>// ---- JAVA 10 ----
var list = new ArrayList&lt;String&gt;();                // local variable type inference
var entry = Map.entry("k", "v");
List&lt;String&gt; copy = List.copyOf(original);          // defensive immutable copy
opt.orElseThrow();                                  // no-arg: clearer than get()

// ---- JAVA 11 (LTS) ----
"  hi  ".strip();          // Unicode-aware, unlike trim() which only handles ASCII
"".isBlank();              // true for "" and for whitespace-only
"a\\nb".lines();            // Stream&lt;String&gt; of lines, no split("\\n") edge cases
"ab".repeat(3);            // "ababab"

Files.writeString(path, content);                   // no more BufferedWriter ceremony
String text = Files.readString(path);

list.stream().filter(Predicate.not(String::isBlank));   // negate a method reference
String[] arr = list.toArray(String[]::new);             // no zero-length array trick

// The standard HttpClient — HTTP/2, async, no third-party dependency
HttpClient client = HttpClient.newHttpClient();
HttpResponse&lt;String&gt; res = client.send(
    HttpRequest.newBuilder(URI.create("https://api.example.com/orders"))
               .timeout(Duration.ofSeconds(5))
               .header("Accept", "application/json")
               .build(),
    HttpResponse.BodyHandlers.ofString());

// And you can run a single file without compiling it first
// $ java Hello.java</code></pre>
<table>
<tr><th>Version</th><th>Headline additions</th></tr>
<tr><td><strong>9</strong></td><td>Modules (JPMS), JShell, collection factories, stream and Optional additions, private interface methods, <strong>G1 became the default GC</strong>, compact strings</td></tr>
<tr><td><strong>10</strong></td><td><code>var</code>, <code>List.copyOf</code>, <code>orElseThrow()</code>, application class-data sharing</td></tr>
<tr><td><strong>11</strong> (LTS)</td><td>Standard <code>HttpClient</code>, String utilities, <code>Files.readString</code>, <code>Predicate.not</code>, single-file execution, <strong>Java EE and CORBA modules removed</strong>, ZGC (experimental), Flight Recorder open-sourced</td></tr>
</table>
<p><strong>The two invisible wins worth naming:</strong> <strong>compact strings</strong> (Java 9) store Latin-1 text as a <code>byte[]</code> rather than a <code>char[]</code>, roughly halving the memory most applications spend on strings — a free improvement with no code change. And G1 becoming the default replaced a parallel collector whose full GCs could stall a large heap for seconds.</p>
<p><strong>The removal that breaks builds:</strong> Java 11 deleted <code>java.xml.bind</code>, <code>java.activation</code> and the CORBA modules. Code using <code>javax.xml.bind.DatatypeConverter</code> or JAXB stops compiling until you add the artefacts as ordinary dependencies. That is the single most common failure when moving from 8 to 11.</p>`
},
{
  q: "What is `var`, and what are the rules for using it well?",
  level: "beginner", hot: true, tags: ["java10", "syntax", "best-practice"],
  companies: ["Amazon", "TCS", "Infosys", "Oracle", "SAP", "Cognizant", "EPAM", "Zoho"],
  a: `<p><code>var</code> is <strong>local variable type inference</strong>, not dynamic typing. The type is fixed at compile time from the initialiser — the variable is exactly as statically typed as if you had written the type out.</p>
<pre><code>var count = 10;                       // int
var name = "Vivek";                   // String
var list = new ArrayList&lt;String&gt;();   // ArrayList&lt;String&gt;
count = "text";                       // ✗ COMPILE ERROR — still an int

// Where it genuinely helps: removing a repeated, noisy type
Map&lt;String, List&lt;OrderSummary&gt;&gt; byCustomer = new HashMap&lt;String, List&lt;OrderSummary&gt;&gt;();
var byCustomer = new HashMap&lt;String, List&lt;OrderSummary&gt;&gt;();     // same type, half the line

for (var entry : byCustomer.entrySet()) { }                      // Map.Entry&lt;...&gt; inferred
try (var conn = pool.get(); var stmt = conn.prepare(sql)) { }</code></pre>
<table>
<tr><th>Allowed</th><th>Not allowed</th></tr>
<tr><td>Local variables with an initialiser</td><td>Fields</td></tr>
<tr><td><code>for</code> and enhanced-<code>for</code> variables</td><td>Method parameters or return types</td></tr>
<tr><td><code>try</code>-with-resources</td><td><code>var x;</code> with no initialiser</td></tr>
<tr><td>Lambda parameters (Java 11+)</td><td><code>var x = null;</code></td></tr>
<tr><td>—</td><td>Array initialisers: <code>var a = {1, 2};</code></td></tr>
<tr><td>—</td><td>Catch clause parameters</td></tr>
</table>
<pre><code>// ✔ Good — the type is obvious from the right-hand side
var orders = orderRepository.findByCustomerId(id);     // clearly a List&lt;Order&gt;
var writer = new BufferedWriter(new FileWriter(path));

// ✗ Bad — the reader now has to go and look
var result = process(input);          // what IS this?
var x = getConfig().resolve().value(); // three hops to find out
var flag = check();                    // Boolean or boolean? It matters for NPEs.

// ✗ The subtle trap: var infers the CONCRETE type, not the interface
var list = new ArrayList&lt;String&gt;();   // ArrayList&lt;String&gt;, not List&lt;String&gt;
// Fine for a local; but if you were relying on programming to the interface,
// var quietly took that away.

// ✗ And it can infer a type you cannot even name
var x = new Object() { int count = 0; };   // anonymous class type
x.count++;                                  // works, but nothing else can hold x</code></pre>
<p><strong>The rule to state:</strong> "<code>var</code> is for the reader, not the writer. I use it when the initialiser already names the type — <code>new</code>, or a well-named method — and I write the type out when it would otherwise be guesswork. The test is whether someone reviewing the diff in a browser, with no IDE to hover over, can tell what the variable is."</p>
<p><strong>The follow-up:</strong> "does <code>var</code> slow anything down?" No. It is purely compile-time; the generated bytecode is byte-for-byte identical to writing the type explicitly. There is no reflection and no runtime cost.</p>`
},
{
  q: "What is new in Java 17, and what would justify upgrading to it?",
  level: "advanced", hot: true, tags: ["java17", "versions", "lts"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "Oracle", "EPAM", "Goldman Sachs", "Cognizant"],
  a: `<p>Java 17 is the LTS where the language features that had been in preview since 14 all landed together — so it is the version where modern Java stops being experimental.</p>
<pre><code>// SEALED CLASSES (final in 17) — a closed set of subtypes
public sealed interface Shape permits Circle, Square, Triangle { }
public record Circle(double radius) implements Shape { }
public record Square(double side) implements Shape { }
public record Triangle(double b, double h) implements Shape { }

// RECORDS (final in 16) — an immutable data carrier, no boilerplate
public record Point(int x, int y) { }
// constructor, accessors, equals, hashCode and toString are generated

// PATTERN MATCHING FOR instanceof (final in 16) — no cast
if (obj instanceof String s &amp;&amp; s.length() &gt; 3) { use(s); }

// TEXT BLOCKS (final in 15)
String query = """
    SELECT o.id, c.name
    FROM orders o
    JOIN customer c ON c.id = o.customer_id
    WHERE o.status = ?
    """;

// SWITCH EXPRESSIONS (final in 14) — returns a value, no fall-through
String label = switch (status) {
    case PENDING, HOLD -&gt; "waiting";
    case SHIPPED       -&gt; "on its way";
    case DELIVERED     -&gt; "done";
};</code></pre>
<table>
<tr><th>Feature</th><th>Final in</th><th>What it replaces</th></tr>
<tr><td>Switch expressions</td><td>14</td><td><code>break</code>-riddled switch statements and accidental fall-through</td></tr>
<tr><td><strong>Helpful NullPointerExceptions</strong></td><td>14</td><td>"NPE at line 42" → tells you <em>which</em> reference was null</td></tr>
<tr><td>Text blocks</td><td>15</td><td>Escaped multi-line SQL and JSON</td></tr>
<tr><td>Records</td><td>16</td><td>Hand-written DTOs, Lombok <code>@Value</code></td></tr>
<tr><td>Pattern matching for <code>instanceof</code></td><td>16</td><td>The cast on the line after every <code>instanceof</code></td></tr>
<tr><td>Sealed classes</td><td><strong>17</strong></td><td>A comment saying "do not extend this"</td></tr>
<tr><td>Enhanced random generators</td><td>17</td><td>A single <code>Random</code> with no algorithm choice</td></tr>
</table>
<pre><code>// The helpful NPE alone justifies the upgrade for anyone who has debugged one:
// Java 8:  Exception in thread "main" java.lang.NullPointerException
// Java 17: Cannot invoke "String.length()" because the return value of
//          "java.util.Map.get(Object)" is null</code></pre>
<p><strong>What breaks:</strong> Java 17 <strong>strongly encapsulates JDK internals</strong>, and unlike Java 16 there is no <code>--illegal-access=permit</code> escape hatch any more. Anything reflecting into <code>sun.misc.*</code> or private JDK fields now fails at runtime rather than warning. In practice that means old versions of Lombok, cglib, ASM, Mockito, Hibernate and Spring must be upgraded — which is usually the real work of the migration, not your own code.</p>
<pre><code># The temporary escape hatch, if a dependency cannot be upgraded yet
--add-opens java.base/java.lang=ALL-UNNAMED
# Treat this as a migration aid with a ticket attached, not a permanent setting.</code></pre>
<p><strong>The business case to make:</strong> Spring Boot 3 requires Java 17 as a minimum, Oracle's free public updates for 8 ended long ago, and the newer collectors (and later ZGC) cut tail latency without a code change. The strongest argument is usually not the syntax — it is that staying on 8 means an ecosystem that has already moved on, and every year you wait the jump gets larger.</p>`
},
{
  q: "What is new in Java 21, and what does it change in practice?",
  level: "advanced", hot: true, tags: ["java21", "versions", "concurrency", "lts"],
  companies: ["Amazon", "Optum", "SAP", "Goldman Sachs", "Flipkart", "EPAM", "Oracle", "Walmart"],
  a: `<p>Java 21 is the most consequential LTS since 8, because <strong>virtual threads</strong> change how you write concurrent server code.</p>
<pre><code>// VIRTUAL THREADS — lightweight threads managed by the JVM, not the OS.
// Millions of them are practical; blocking is cheap again.
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var id : orderIds) {
        executor.submit(() -&gt; {
            var order = orderClient.fetch(id);   // BLOCKING is fine now —
            return enrich(order);                 // the carrier thread is released
        });
    }
}   // close() waits for every task

// Spring Boot 3.2+: one property and your whole web layer uses them
spring.threads.virtual.enabled=true</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Platform threads blocking versus virtual threads unmounting from carrier threads">
  <text class="dg-t" x="16" y="20">platform threads</text>
  <rect class="dg-fill" x="16" y="30" width="110" height="26" rx="5"/><text class="dg-s" x="71" y="48" text-anchor="middle">thread → OS thread</text>
  <rect class="dg-box" x="140" y="30" width="200" height="26" rx="5"/><text class="dg-s" x="240" y="48" text-anchor="middle">BLOCKED on I/O — OS thread idle</text>
  <text class="dg-s" x="356" y="48">~1 MB stack each, so a pool is required</text>
  <text class="dg-t" x="16" y="96">virtual threads</text>
  <rect class="dg-fill2" x="16" y="106" width="110" height="26" rx="5"/><text class="dg-s" x="71" y="124" text-anchor="middle">virtual thread</text>
  <path class="dg-line" d="M130 119 H176" marker-end="url(#vt1)"/>
  <rect class="dg-box" x="180" y="106" width="160" height="26" rx="5"/><text class="dg-s" x="260" y="124" text-anchor="middle">unmounts while blocked</text>
  <path class="dg-line" d="M344 119 H390" marker-end="url(#vt1)"/>
  <rect class="dg-fill" x="394" y="106" width="180" height="26" rx="5"/><text class="dg-s" x="484" y="124" text-anchor="middle">carrier thread runs another one</text>
  <text class="dg-s" x="16" y="156">the blocking programming model, with the scalability that used to require reactive code</text>
  <defs><marker id="vt1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// PATTERN MATCHING FOR SWITCH + RECORD PATTERNS (both final in 21)
sealed interface Shape permits Circle, Rect { }
record Circle(double r) implements Shape { }
record Rect(double w, double h) implements Shape { }

double area(Shape s) {
    return switch (s) {
        case Circle(double r)          -&gt; Math.PI * r * r;   // DECONSTRUCTS the record
        case Rect(double w, double h)  -&gt; w * h;
    };                       // no default needed — sealed means this is exhaustive,
}                            // and adding a third shape becomes a COMPILE ERROR here

// Guarded patterns
String describe(Object o) {
    return switch (o) {
        case Integer i when i &gt; 100 -&gt; "big number";
        case Integer i              -&gt; "number " + i;
        case String s               -&gt; "text of length " + s.length();
        case null                   -&gt; "nothing";      // null is now a real case
        default                     -&gt; "something else";
    };
}

// SEQUENCED COLLECTIONS — a first/last API that was missing for 25 years
list.getFirst();  list.getLast();  list.reversed();
linkedHashMap.firstEntry();  linkedHashSet.addFirst(x);
// Before: list.get(0) and list.get(list.size() - 1), and nothing at all for LinkedHashSet.</code></pre>
<table>
<tr><th>Feature</th><th>Status in 21</th><th>Why it matters</th></tr>
<tr><td><strong>Virtual threads</strong></td><td>Final</td><td>High concurrency without reactive code</td></tr>
<tr><td>Pattern matching for switch</td><td>Final</td><td>Exhaustive, readable dispatch over a sealed hierarchy</td></tr>
<tr><td>Record patterns</td><td>Final</td><td>Destructure nested records in one line</td></tr>
<tr><td>Sequenced collections</td><td>Final</td><td>Uniform first/last/reversed access</td></tr>
<tr><td>Generational ZGC</td><td>Final</td><td>Sub-millisecond pauses with better throughput</td></tr>
<tr><td>Structured concurrency</td><td>Preview</td><td>Subtask lifetimes tied to a scope; cancellation propagates</td></tr>
<tr><td>Scoped values</td><td>Preview</td><td>An immutable, virtual-thread-friendly <code>ThreadLocal</code></td></tr>
</table>
<p><strong>The caveats to raise about virtual threads,</strong> because "just turn it on" is the wrong answer:</p>
<ul>
<li><strong>Pinning</strong> — a virtual thread inside a <code>synchronized</code> block cannot unmount, so it holds its carrier thread. Replace hot <code>synchronized</code> sections with <code>ReentrantLock</code>. (This was substantially improved in later releases, but it is still the first thing to check.)</li>
<li><strong>They do not help CPU-bound work</strong> — you still have only as many cores as you have.</li>
<li><strong>Pooling them is pointless</strong>; create one per task. The pool was only ever there because platform threads were expensive.</li>
<li><strong>Downstream limits still apply</strong> — 10,000 virtual threads hitting a 20-connection database pool just moves the queue. Use a semaphore to bound concurrency deliberately.</li>
<li><strong><code>ThreadLocal</code> at that scale</strong> costs real memory; scoped values are the intended replacement.</li>
</ul>`
},
{
  q: "Your team is on Java 8 — how would you plan and execute the upgrade?",
  level: "advanced", hot: true, tags: ["migration", "upgrade", "production", "versions"],
  companies: ["Amazon", "Optum", "SAP", "Maersk", "Infosys", "TCS", "Barclays", "Societe Generale"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Four phase Java upgrade from running on a new JDK to adopting new features">
  <rect class="dg-fill" x="12" y="40" width="140" height="54" rx="8"/>
  <text class="dg-s" x="82" y="62" text-anchor="middle">1. RUN on the new JDK</text>
  <text class="dg-s" x="82" y="80" text-anchor="middle">still --release 8</text>
  <path class="dg-line" d="M156 67 H180" marker-end="url(#mg2)"/>
  <rect class="dg-fill" x="184" y="40" width="140" height="54" rx="8"/>
  <text class="dg-s" x="254" y="62" text-anchor="middle">2. Upgrade libraries</text>
  <text class="dg-s" x="254" y="80" text-anchor="middle">and build plugins</text>
  <path class="dg-line" d="M328 67 H352" marker-end="url(#mg2)"/>
  <rect class="dg-fill2" x="356" y="40" width="120" height="54" rx="8"/>
  <text class="dg-s" x="416" y="62" text-anchor="middle">3. Bump</text>
  <text class="dg-s" x="416" y="80" text-anchor="middle">--release 17/21</text>
  <path class="dg-line" d="M480 67 H504" marker-end="url(#mg2)"/>
  <rect class="dg-box" x="508" y="40" width="100" height="54" rx="8"/>
  <text class="dg-s" x="558" y="62" text-anchor="middle">4. Adopt</text>
  <text class="dg-s" x="558" y="80" text-anchor="middle">new features</text>
  <text class="dg-s" x="16" y="128">each phase is independently releasable and independently revertible —</text>
  <text class="dg-s" x="16" y="146">doing all four at once produces a change nobody can review or roll back</text>
  <defs><marker id="mg2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The key insight:</strong> running on a new JVM and compiling to a new bytecode level are separate steps. Phase 1 gets you the newer GC, better diagnostics and security patches with <em>zero</em> source changes — and it is where most runtime surprises surface, so you want it isolated.</p>
<table>
<tr><th>What breaks</th><th>Fix</th></tr>
<tr><td><code>javax.xml.bind</code>, <code>javax.annotation</code>, CORBA removed in 11</td><td>Add <code>jakarta.xml.bind-api</code> and friends as explicit dependencies</td></tr>
<tr><td>Reflection into JDK internals (<code>sun.misc.Unsafe</code>)</td><td>Upgrade the library; <code>--add-opens</code> only as a temporary bridge</td></tr>
<tr><td>Old Lombok, cglib, ASM, Mockito, PowerMock, Hibernate</td><td>Upgrade first — these fail on the <em>class file version</em>, often cryptically</td></tr>
<tr><td>Nashorn JavaScript engine removed in 15</td><td>GraalJS, or remove the scripting</td></tr>
<tr><td><code>UnsupportedClassVersionError</code></td><td>A dependency compiled for a newer JDK than you run, or a stale build plugin</td></tr>
<tr><td>Date formatting output changed subtly</td><td>CLDR became the default locale data in Java 9 — assert on parsed values, not formatted strings</td></tr>
<tr><td><code>String.trim()</code> vs <code>strip()</code> differences</td><td>Only if you deliberately relied on ASCII-only trimming</td></tr>
<tr><td>GC flags no longer recognised</td><td>CMS was removed in 14 — the JVM refuses to start. Move to G1 or ZGC.</td></tr>
<tr><td><code>javax.*</code> → <code>jakarta.*</code></td><td>Not a JDK change — it comes with Spring Boot 3 / Jakarta EE 9+, but it lands at the same time. Budget for it.</td></tr>
</table>
<pre><code># Tools that do most of the work for you
mvn versions:display-dependency-updates          # what is out of date
jdeps --jdk-internals --multi-release 21 app.jar # what uses removed internals
jdeprscan --release 21 app.jar                   # deprecated and removed APIs
# OpenRewrite has recipes that automate large parts of it:
mvn org.openrewrite.maven:rewrite-maven-plugin:run \\
    -Drewrite.activeRecipes=org.openrewrite.java.migrate.UpgradeToJava21</code></pre>
<p><strong>How to sequence it in a real team:</strong> upgrade one low-risk service first and use it to find the shared-library problems, because they will be the same everywhere. Keep the CI matrix building on both JDKs during the transition so you can revert without a code change. And do <em>not</em> mix the upgrade with a feature release — when something breaks in production at 2am, you want the change set to be "we changed the JDK", not "we changed the JDK and forty other things".</p>
<p><strong>The point that shows judgement:</strong> "The upgrade itself is usually easy; the dependencies are the work. So I start by running <code>jdeps</code> and the dependency report to size the job honestly, rather than promising a timeline based on how our own code looks."</p>`
},
{
  q: "Text blocks, switch expressions and sequenced collections — the smaller features you use daily",
  level: "beginner", tags: ["syntax", "modern-java", "versions"],
  companies: ["Amazon", "Infosys", "TCS", "SAP", "Optum", "Cognizant", "EPAM", "Zoho"],
  a: `<pre><code>// TEXT BLOCKS (15) — multi-line strings without escape soup
// Before
String json = "{\\n" +
              "  \\"name\\": \\"Vivek\\",\\n" +
              "  \\"role\\": \\"Engineer\\"\\n" +
              "}";
// After
String json = """
    {
      "name": "Vivek",
      "role": "Engineer"
    }
    """;
// Indentation is stripped relative to the CLOSING delimiter, so the block
// can be indented to match the surrounding code without adding whitespace.

String sql = """
    SELECT id, total FROM orders
    WHERE status = ? AND created_at &gt; ?
    """;
// \\ at end of line joins without a newline; \\s keeps a trailing space.</code></pre>
<pre><code>// SWITCH EXPRESSIONS (14) — a value, not a statement
// Before: four chances to forget a break, and 'label' cannot be final
String label;
switch (status) {
    case PENDING: label = "waiting"; break;
    case SHIPPED: label = "on its way"; break;
    default:      label = "unknown";
}
// After
String label = switch (status) {
    case PENDING, HOLD -&gt; "waiting";      // multiple labels, no fall-through
    case SHIPPED       -&gt; "on its way";
    default            -&gt; "unknown";
};

// yield, when a branch needs a block
int weight = switch (size) {
    case SMALL -&gt; 1;
    case LARGE -&gt; {
        log.debug("large item");
        yield 10;
    }
};
// Over an ENUM with every constant covered, no default is required — and
// adding a constant then becomes a compile error, which is the point.</code></pre>
<pre><code>// SEQUENCED COLLECTIONS (21) — one API for "first" and "last"
List&lt;String&gt; l = new ArrayList&lt;&gt;(List.of("a", "b", "c"));
l.getFirst();        // "a"      — was l.get(0)
l.getLast();         // "c"      — was l.get(l.size() - 1)
l.addFirst("z");
l.reversed();        // a reversed VIEW, not a copy

LinkedHashSet&lt;String&gt; s = new LinkedHashSet&lt;&gt;();
s.getFirst();        // previously required an iterator, or a stream
LinkedHashMap&lt;String, Integer&gt; m = new LinkedHashMap&lt;&gt;();
m.firstEntry(); m.lastEntry(); m.pollFirstEntry();</code></pre>
<table>
<tr><th>Feature</th><th>Since</th><th>Replaces</th></tr>
<tr><td>Text blocks</td><td>15</td><td>Concatenated, escaped multi-line strings</td></tr>
<tr><td>Switch expressions</td><td>14</td><td><code>break</code>-based switch statements</td></tr>
<tr><td>Helpful NPE messages</td><td>14</td><td>Guessing which reference was null</td></tr>
<tr><td><code>instanceof</code> patterns</td><td>16</td><td>The redundant cast on the next line</td></tr>
<tr><td>Sequenced collections</td><td>21</td><td><code>get(size() - 1)</code> and iterator gymnastics</td></tr>
<tr><td><code>Stream.toList()</code></td><td>16</td><td><code>collect(Collectors.toList())</code> — and it returns an <em>immutable</em> list</td></tr>
<tr><td><code>Stream.mapMulti</code>, <code>Collectors.teeing</code></td><td>16 / 12</td><td>Awkward flatMap and two-pass collection</td></tr>
</table>
<p><strong>One difference worth knowing:</strong> <code>stream.toList()</code> returns an <strong>unmodifiable</strong> list, while <code>collect(Collectors.toList())</code> historically returns a mutable <code>ArrayList</code>. Switching mechanically from one to the other will throw <code>UnsupportedOperationException</code> at runtime if anything downstream mutates the result — a small, very common migration bug.</p>`
},
{
  q: "What is the module system (JPMS), and does anyone actually use it?",
  level: "advanced", tags: ["java9", "modules", "trade-offs"],
  companies: ["Oracle", "SAP", "Amazon", "Infosys", "EPAM", "Optum", "Goldman Sachs"],
  a: `<pre><code>// module-info.java at the source root
module com.acme.orders {
    requires java.sql;                      // dependencies, checked at COMPILE and START
    requires transitive com.acme.model;     // consumers get this too

    exports com.acme.orders.api;            // public to everyone
    exports com.acme.orders.spi to com.acme.admin;   // qualified export

    opens com.acme.orders.entity;           // reflection allowed (Hibernate, Jackson)

    provides OrderValidator with DefaultOrderValidator;   // ServiceLoader
    uses PaymentGateway;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Module encapsulation exposing only exported packages">
  <rect class="dg-fill" x="30" y="26" width="200" height="106" rx="10"/>
  <text class="dg-s" x="130" y="48" text-anchor="middle">module com.acme.orders</text>
  <rect class="dg-fill2" x="50" y="60" width="160" height="26" rx="5"/><text class="dg-s" x="130" y="78" text-anchor="middle">…orders.api  (exported)</text>
  <rect class="dg-box" x="50" y="94" width="160" height="26" rx="5"/><text class="dg-s" x="130" y="112" text-anchor="middle">…orders.internal (hidden)</text>
  <path class="dg-line" d="M214 73 H300" marker-end="url(#jp1)"/>
  <path class="dg-line" d="M214 107 H300" stroke-dasharray="4 4"/>
  <text class="dg-s" x="258" y="128" text-anchor="middle">✗</text>
  <rect class="dg-box" x="306" y="60" width="150" height="40" rx="8"/>
  <text class="dg-s" x="381" y="85" text-anchor="middle">other modules</text>
  <text class="dg-s" x="476" y="72">public is no longer</text>
  <text class="dg-s" x="476" y="90">automatically accessible —</text>
  <text class="dg-s" x="476" y="108">the module must export it</text>
  <defs><marker id="jp1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>What JPMS gives you</th><th>Why adoption stayed low</th></tr>
<tr><td>Real encapsulation — <code>public</code> is no longer automatically reachable</td><td>Every dependency in the graph must also be modular, or you fall back to automatic modules</td></tr>
<tr><td>Dependencies verified at startup, not on first <code>ClassNotFoundException</code></td><td>Reflection-heavy frameworks need <code>opens</code>, which reopens most of what you closed</td></tr>
<tr><td>No split packages — the same package cannot come from two jars</td><td>Split packages are common in older libraries, and fixing them is not your call</td></tr>
<tr><td><code>jlink</code> builds a runtime containing only the modules you need</td><td>Containers already solved "ship a small runtime" more simply</td></tr>
<tr><td>Reliable configuration for large platforms</td><td>Spring Boot's fat jar and the classpath already worked well enough</td></tr>
</table>
<pre><code># jlink — the part that IS widely useful, even without modularising your own code
jlink --add-modules java.base,java.sql,java.net.http \\
      --strip-debug --no-header-files --no-man-pages --compress=2 \\
      --output custom-runtime
# A ~40 MB runtime instead of a ~300 MB JDK, which matters for container images.

# jdeps tells you which modules you actually need
jdeps --print-module-deps --ignore-missing-deps app.jar</code></pre>
<p><strong>The honest answer:</strong> "The JDK itself is fully modular, and that is where JPMS delivered — it is why <code>jlink</code> works and why JDK internals could finally be encapsulated. But most <em>applications</em> never adopted it. Spring Boot applications run on the classpath, not the module path, and the encapsulation benefit is largely undone by the <code>opens</code> directives that frameworks require."</p>
<p><strong>What to say if asked whether you would use it:</strong> "For a library with a public API and few dependencies, yes — it documents and enforces the boundary. For a typical Spring service, no; I would get the same benefit far more cheaply from package structure and ArchUnit tests, without constraining the dependency graph. I do use <code>jlink</code> for the runtime image, which needs the JDK to be modular but not my code."</p>`
},
{
  q: "What are preview and incubator features, and how do you use them safely?",
  level: "advanced", tags: ["preview", "versions", "best-practice"],
  companies: ["Oracle", "Amazon", "SAP", "Goldman Sachs", "EPAM", "Optum"],
  a: `<table>
<tr><th></th><th>Preview</th><th>Incubator</th><th>Experimental</th></tr>
<tr><td>Applies to</td><td>Language and JVM features</td><td>APIs and tools</td><td>JVM/GC options</td></tr>
<tr><td>Enable with</td><td><code>--enable-preview</code></td><td><code>--add-modules jdk.incubator.x</code></td><td><code>-XX:+UnlockExperimentalVMOptions</code></td></tr>
<tr><td>Can change</td><td>Yes, between releases</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Complete</td><td><strong>Yes</strong> — fully specified and implemented</td><td>Not necessarily</td><td>No</td></tr>
<tr><td>Production</td><td><strong>No</strong></td><td>No</td><td>Case by case</td></tr>
</table>
<pre><code># Preview features must be enabled at BOTH compile and run time,
# and the class files are then pinned to that exact JDK version.
javac --release 21 --enable-preview Main.java
java  --enable-preview Main

&lt;plugin&gt;
  &lt;artifactId&gt;maven-compiler-plugin&lt;/artifactId&gt;
  &lt;configuration&gt;
    &lt;release&gt;21&lt;/release&gt;
    &lt;compilerArgs&gt;&lt;arg&gt;--enable-preview&lt;/arg&gt;&lt;/compilerArgs&gt;
  &lt;/configuration&gt;
&lt;/plugin&gt;</code></pre>
<p><strong>The constraint that rules them out for production:</strong> a class file compiled with <code>--enable-preview</code> carries a minor version marking the exact JDK it was built with, and <strong>it refuses to load on any other release</strong> — even a newer one. So a preview feature is not merely "might change"; it makes your artefact non-portable across JDK upgrades, which is the opposite of what a deployable build should be.</p>
<pre><code>// A feature typically previews for two or three releases before becoming final:
// Records:                preview 14 → preview 15 → FINAL 16
// Pattern matching switch: preview 17 → … → FINAL 21
// Virtual threads:         preview 19 → preview 20 → FINAL 21
//
// And previewing is not a promise. STRING TEMPLATES previewed in 21 and 22,
// then were WITHDRAWN entirely rather than finalised — the clearest possible
// argument for not shipping preview features to production.</code></pre>
<table>
<tr><th>Where they are genuinely useful</th></tr>
<tr><td>A spike or prototype, to evaluate a feature before it lands</td></tr>
<tr><td>Giving feedback to the JDK team while the design can still change</td></tr>
<tr><td>Internal tooling you rebuild alongside every JDK upgrade</td></tr>
<tr><td>Learning what is coming, so the migration is not a surprise</td></tr>
</table>
<p><strong>How to answer:</strong> "I follow preview features to know what is coming, and I will prototype with them on a branch. I do not ship them, because the class file is pinned to one JDK build and the feature can be changed or dropped — string templates were withdrawn after two previews, and anyone who had adopted them had to remove the code. The whole point of the preview mechanism is that the JDK team can still say no."</p>`
}
]);
