registerPrimer("java-versions", `<p class="pr-lead">Java keeps improving, with a new version every six months. You do not need to memorise every release. You need to know <b>which versions companies actually use</b>, <b>the handful of big features each one brought</b>, and <b>what it takes to upgrade</b> an older project.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of Java releases like phone software updates. Small updates arrive often, but every couple of years there is a "long-term" release that the manufacturer promises to keep fixing for many years. Businesses stick to those long-term releases, because they cannot rebuild everything every six months.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Release</dt><dd>A new numbered version of Java, such as Java 21. A new one arrives every March and September.</dd>
<dt>LTS</dt><dd>Long-Term Support. A release that keeps getting security fixes for years. The LTS versions that matter are 8, 11, 17, 21 and 25.</dd>
<dt>Preview feature</dt><dd>A new feature you can try out but which may still change or be removed. Not for production code.</dd>
<dt>JDK distribution</dt><dd>A packaged build of Java from a vendor, such as Eclipse Temurin, Amazon Corretto or Oracle. They all run your code the same way.</dd>
</dl>

<h3>Step by step: what each long-term version brought</h3>
<ol class="pr-steps">
<li><b>Java 8 (2014):</b> lambdas, streams, Optional and the new date and time library. This changed how Java is written.</li>
<li><b>Java 11 (2018):</b> <code>var</code> for local variables, a built-in HTTP client, and shortcuts like <code>List.of</code>. The module system arrived on the way, in Java 9.</li>
<li><b>Java 17 (2021):</b> records (short data classes), sealed classes, text blocks for multi-line strings, and switch expressions.</li>
<li><b>Java 21 (2023):</b> virtual threads, which make it cheap to handle huge numbers of requests at once, plus pattern matching in switch.</li>
<li><b>Java 25 (2025):</b> scoped values, stream gatherers, flexible constructors, and a much simpler <code>main</code> method for small programs.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 196" role="img" aria-label="Timeline of Java LTS releases 8, 11, 17, 21 and 25 with their headline features">
  <line class="dg-line" x1="20" y1="70" x2="600" y2="70"/>
  <circle class="dg-fill" cx="50" cy="70" r="11"/><text class="dg-t" x="50" y="40" text-anchor="middle">8</text><text class="dg-s" x="50" y="56" text-anchor="middle">2014</text>
  <circle class="dg-fill" cx="170" cy="70" r="11"/><text class="dg-t" x="170" y="40" text-anchor="middle">11</text><text class="dg-s" x="170" y="56" text-anchor="middle">2018</text>
  <circle class="dg-fill" cx="300" cy="70" r="11"/><text class="dg-t" x="300" y="40" text-anchor="middle">17</text><text class="dg-s" x="300" y="56" text-anchor="middle">2021</text>
  <circle class="dg-fill" cx="430" cy="70" r="11"/><text class="dg-t" x="430" y="40" text-anchor="middle">21</text><text class="dg-s" x="430" y="56" text-anchor="middle">2023</text>
  <circle class="dg-fill2" cx="560" cy="70" r="11"/><text class="dg-t" x="560" y="40" text-anchor="middle">25</text><text class="dg-s" x="560" y="56" text-anchor="middle">2025</text>
  <text class="dg-m" x="50" y="102" text-anchor="middle">lambdas</text>
  <text class="dg-s" x="50" y="118" text-anchor="middle">streams</text>
  <text class="dg-s" x="50" y="134" text-anchor="middle">Optional</text>
  <text class="dg-s" x="50" y="150" text-anchor="middle">java.time</text>
  <text class="dg-m" x="170" y="102" text-anchor="middle">var</text>
  <text class="dg-s" x="170" y="118" text-anchor="middle">HttpClient</text>
  <text class="dg-s" x="170" y="134" text-anchor="middle">List.of / Map.of</text>
  <text class="dg-s" x="170" y="150" text-anchor="middle">modules (9)</text>
  <text class="dg-m" x="300" y="102" text-anchor="middle">records</text>
  <text class="dg-s" x="300" y="118" text-anchor="middle">sealed classes</text>
  <text class="dg-s" x="300" y="134" text-anchor="middle">text blocks</text>
  <text class="dg-s" x="300" y="150" text-anchor="middle">switch expressions</text>
  <text class="dg-m" x="430" y="102" text-anchor="middle">virtual threads</text>
  <text class="dg-s" x="430" y="118" text-anchor="middle">pattern matching switch</text>
  <text class="dg-s" x="430" y="134" text-anchor="middle">record patterns</text>
  <text class="dg-s" x="430" y="150" text-anchor="middle">sequenced collections</text>
  <text class="dg-m" x="560" y="102" text-anchor="middle">scoped values</text>
  <text class="dg-s" x="560" y="118" text-anchor="middle">stream gatherers</text>
  <text class="dg-s" x="560" y="134" text-anchor="middle">flexible constructors</text>
  <text class="dg-s" x="560" y="150" text-anchor="middle">simple main()</text>
  <text class="dg-s" x="310" y="184" text-anchor="middle">non-LTS releases in between (9, 10, 12 … 24) are where features arrive first, often as previews</text>
</svg>
<figcaption>The five LTS releases that matter, and the headline features each one made final (Java 9 features shipped on the way to 11).</figcaption>
</figure>

<h3>A worked example: how a feature becomes official</h3>
<p>New language features are usually tried out as previews for a few releases before becoming final. Pattern matching for switch is a good example:</p>
<pre><code>// Java 17, 18, 19, 20 : preview (may change, needs a special flag)
// Java 21             : final   (safe to use in real projects)

// Trying a preview feature needs the flag when compiling AND running:
javac --release 25 --enable-preview Main.java
java --enable-preview Main</code></pre>
<ol class="pr-steps">
<li>While a feature is in preview, Java can still change how it works, so code written for one version may not compile on the next.</li>
<li>Once it becomes final, it is stable and safe to use at work.</li>
<li>Your build tool fixes the Java level for the whole project, for example <code>&lt;maven.compiler.release&gt;21&lt;/maven.compiler.release&gt;</code> in Maven.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Choosing the very latest non-LTS version for a real project</p>
<p>A non-LTS version only gets free fixes for six months, until the next one comes out. After that you must upgrade again or run without security patches.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> pick the newest LTS your frameworks support. Spring Boot 3 needs Java 17 or later.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Shipping code that relies on preview features</p>
<p>Preview features can change or disappear. String templates, for example, were previewed in Java 21 and 22 and then withdrawn.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> experiment with previews, but only use final features in production.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Thinking an upgrade from Java 8 is just changing a number</p>
<p>The language features are the easy part. Upgrades break on removed libraries (such as the old Java EE packages), older libraries that do not support the new version, and code that relied on Java's internal classes.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> first run the existing app on the new Java, then update libraries, then start using the new language features, testing at each step.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>A new Java version comes out every six months; companies use the LTS ones.</li>
<li>The LTS versions are 8, 11, 17, 21 and 25.</li>
<li>Know two or three headline features for each LTS.</li>
<li>Preview features are for trying out, not for production.</li>
<li>Upgrade in stages: run on the new version first, then change the code.</li>
</ul>
<p><b>Next:</b> the questions below go through each version's features and how to plan a real upgrade.</p>`);

appendTopic("java-versions", [
{
  q: "Rewrite this Java 8 class in modern Java, step by step",
  level: "advanced", hot: true, tags: ["records", "sealed", "pattern-matching", "refactoring", "must-know"],
  companies: ["Amazon", "Goldman Sachs", "JPMorgan", "SAP", "Oracle", "Microsoft", "Atlassian"],
  a: `<p>Listing features is weak. Taking typical Java 8 code and modernising it one step at a time shows you actually use them. Here is a small shipping-cost calculator as it would have been written in 2015.</p>
<pre><code>// JAVA 8 VERSION: about 60 lines once equals, hashCode and toString are added
public abstract class Shape { }

public final class Circle extends Shape {
    private final double radius;
    public Circle(double radius) { this.radius = radius; }
    public double getRadius() { return radius; }
    // + equals, hashCode, toString generated by the IDE ...
}
public final class Rect extends Shape {
    private final double w, h;
    public Rect(double w, double h) { this.w = w; this.h = h; }
    public double getW() { return w; }
    public double getH() { return h; }
    // + equals, hashCode, toString ...
}

public static double area(Shape s) {
    if (s instanceof Circle) {
        Circle c = (Circle) s;                         // check, then cast again
        return Math.PI * c.getRadius() * c.getRadius();
    } else if (s instanceof Rect) {
        Rect r = (Rect) s;
        return r.getW() * r.getH();
    }
    throw new IllegalArgumentException("unknown shape"); // a new shape = runtime crash
}

String label = "Shape report:\n" +
               "  kind: " + kind + "\n" +
               "  area: " + area + "\n";</code></pre>
<p><strong>Step 1: records (Java 16).</strong> A class that is just data becomes one line, with constructor, accessors, equals, hashCode and toString generated.</p>
<pre><code>record Circle(double radius) implements Shape {}
record Rect(double w, double h) implements Shape {
    Rect {                                           // compact constructor: validation
        if (w &lt;= 0 || h &lt;= 0) throw new IllegalArgumentException("sides must be positive");
    }
}</code></pre>
<p><strong>Step 2: a sealed interface (Java 17).</strong> The compiler now knows the complete list of shapes.</p>
<pre><code>sealed interface Shape permits Circle, Rect {}</code></pre>
<p><strong>Step 3: pattern matching in switch, with record patterns (Java 21).</strong> No casts, and no default branch needed.</p>
<pre><code>static double area(Shape s) {
    return switch (s) {
        case Circle(double r)         -&gt; Math.PI * r * r;
        case Rect(double w, double h) -&gt; w * h;
    };   // add "record Triangle ... implements Shape" to the permits list and
}        // THIS LINE stops compiling until you handle it. The Java 8 version
         // compiled fine and threw at runtime.</code></pre>
<p><strong>Step 4: guards and unnamed patterns</strong> when some cases need extra conditions (the <code>_</code> became final in Java 22).</p>
<pre><code>static String describe(Shape s) {
    return switch (s) {
        case Circle(double r) when r &gt; 100 -&gt; "large circle";
        case Circle _                      -&gt; "circle";
        case Rect(double w, double h) when w == h -&gt; "square";
        case Rect _                        -&gt; "rectangle";
    };
}</code></pre>
<p><strong>Step 5: text blocks (Java 15) and formatted strings</strong> for multi-line output.</p>
<pre><code>String label = """
        Shape report:
          kind: %s
          area: %.2f
        """.formatted(kind, area);</code></pre>
<table>
<tr><th>Change</th><th>Version</th><th>What it removed</th></tr>
<tr><td>Records</td><td>16</td><td>Constructors, getters, equals, hashCode, toString</td></tr>
<tr><td>Sealed interface</td><td>17</td><td>Unknown subclasses; the <code>throw</code> at the end of the if-chain</td></tr>
<tr><td>Switch pattern matching + record patterns</td><td>21</td><td>instanceof-then-cast, and getter calls</td></tr>
<tr><td>Unnamed patterns <code>_</code></td><td>22</td><td>Variables you had to name but never used</td></tr>
<tr><td>Text blocks</td><td>15</td><td>Quote-plus-newline concatenation</td></tr>
</table>
<p><strong>The design point underneath:</strong> this style is called <em>data-oriented programming</em>. Data is plain records, the set of kinds is closed with <code>sealed</code>, and behaviour lives in exhaustive switches. It is the right fit when the set of kinds is fixed and the operations keep growing. When new kinds keep arriving from other teams (plugins), classic polymorphism with an open interface is still the better choice.</p>`
},
{
  q: "What arrived in Java 22 to 25, and what is worth using today?",
  level: "advanced", tags: ["java-25", "lts", "new-features"],
  companies: ["Oracle", "Amazon", "Goldman Sachs", "SAP", "Microsoft", "Atlassian"],
  a: `<p>Java 25 (September 2025) is the current LTS after 21. Most teams jump straight from 21 to 25, so an interviewer asking "what is new" means everything in 22 to 25 that became <strong>final</strong>. Previews are worth knowing about but not worth building on.</p>
<table>
<tr><th>Feature</th><th>Final in</th><th>What it gives you</th></tr>
<tr><td><strong>Unnamed variables and patterns</strong> (<code>_</code>)</td><td>22</td><td>Say "I do not need this" in catch blocks, lambdas and patterns</td></tr>
<tr><td><strong>Foreign Function and Memory API</strong></td><td>22</td><td>Call C libraries and use off-heap memory without JNI</td></tr>
<tr><td>Markdown in Javadoc comments</td><td>23</td><td><code>///</code> comments written in Markdown instead of HTML</td></tr>
<tr><td><strong>Stream gatherers</strong></td><td>24</td><td>Custom intermediate operations: windows, scans, de-duplication by key</td></tr>
<tr><td><strong>Virtual threads no longer pin on synchronized</strong></td><td>24</td><td>The biggest virtual-thread gotcha is gone. Old libraries with synchronized blocks now scale</td></tr>
<tr><td>Class-File API</td><td>24</td><td>A standard way to read and write bytecode, for framework authors</td></tr>
<tr><td><strong>Scoped values</strong></td><td>25</td><td>An immutable, bounded replacement for <code>ThreadLocal</code> that suits virtual threads</td></tr>
<tr><td><strong>Flexible constructor bodies</strong></td><td>25</td><td>Validate arguments before calling <code>super(...)</code></td></tr>
<tr><td>Module import declarations</td><td>25</td><td><code>import module java.base;</code> imports a whole module's packages</td></tr>
<tr><td>Compact source files and instance main</td><td>25</td><td><code>void main() { IO.println("hi"); }</code>: no class, no <code>static</code>, no <code>String[] args</code></td></tr>
<tr><td>Compact object headers</td><td>25</td><td>Smaller object headers, so less heap per object. Opt in with a JVM flag</td></tr>
</table>
<pre><code>// Unnamed variables (22)
try { parse(s); } catch (NumberFormatException _) { return 0; }
map.forEach((_, value) -&gt; System.out.println(value));

// Flexible constructor bodies (25): check BEFORE the expensive super call
class PositiveAmount extends Amount {
    PositiveAmount(long paise) {
        if (paise &lt;= 0) throw new IllegalArgumentException("must be positive");
        super(paise);        // before 25 this had to be the FIRST statement
    }
}

// Scoped values (25): a request id visible to everything called inside run()
static final ScopedValue&lt;String&gt; REQUEST_ID = ScopedValue.newInstance();

ScopedValue.where(REQUEST_ID, "req-42").run(() -&gt; handle());
// inside handle() and anything it calls: REQUEST_ID.get() returns "req-42".
// It cannot be changed, and it disappears when run() returns. A ThreadLocal
// can be modified by anyone and leaks if you forget remove().

// Stream gatherers (24): sliding windows, previously awkward
List.of(1, 2, 3, 4, 5).stream()
    .gather(Gatherers.windowSliding(3))
    .toList();                            // [[1, 2, 3], [2, 3, 4], [3, 4, 5]]</code></pre>
<p><strong>Still preview in 25, so know them but do not ship on them:</strong> structured concurrency (treat a group of subtasks as one unit that succeeds or fails together) and primitive types in patterns.</p>
<p><strong>Removed or locked down along the way:</strong> the Security Manager is permanently disabled (24), and the 32-bit x86 port is gone (25). If an old library calls <code>System.setSecurityManager</code>, it now throws.</p>
<p><strong>A good one-line answer:</strong> "For everyday code: unnamed variables, gatherers and flexible constructors. For services: virtual threads are now safe with synchronized code, and scoped values replace ThreadLocal for request context. That pinning fix alone is a reason to move from 21 to 25."</p>`
}
]);
