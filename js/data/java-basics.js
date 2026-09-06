registerTopic("java-basics", [
{
  q: "What makes Java platform independent?",
  level: "beginner", hot: true, tags: ["jvm", "basics"],
  a: `<p>The compiler (<code>javac</code>) does <strong>not</strong> produce machine code. It produces <strong>bytecode</strong> — an intermediate instruction set stored in <code>.class</code> files. Bytecode is the same on every operating system.</p>
<p>Each platform then ships its own <strong>JVM</strong>, which reads that bytecode and translates it into native instructions for that specific CPU and OS. So the <em>bytecode</em> is portable; the <em>JVM</em> is not.</p>
<figure class="fig">
<svg viewBox="0 0 640 150" role="img" aria-label="Java compilation and execution flow">
  <rect class="dg-fill" x="8" y="52" width="112" height="46" rx="8"/>
  <text class="dg-t" x="64" y="72" text-anchor="middle">Hello.java</text>
  <text class="dg-s" x="64" y="88" text-anchor="middle">source</text>
  <path class="dg-line" d="M124 75 H176" marker-end="url(#a1)"/>
  <text class="dg-m" x="150" y="66" text-anchor="middle">javac</text>
  <rect class="dg-fill2" x="180" y="52" width="120" height="46" rx="8"/>
  <text class="dg-t" x="240" y="72" text-anchor="middle">Hello.class</text>
  <text class="dg-s" x="240" y="88" text-anchor="middle">bytecode</text>
  <path class="dg-line" d="M304 75 H356" marker-end="url(#a1)"/>
  <rect class="dg-box" x="360" y="12" width="130" height="38" rx="8"/>
  <text class="dg-t" x="425" y="36" text-anchor="middle">JVM (Windows)</text>
  <rect class="dg-box" x="360" y="56" width="130" height="38" rx="8"/>
  <text class="dg-t" x="425" y="80" text-anchor="middle">JVM (Linux)</text>
  <rect class="dg-box" x="360" y="100" width="130" height="38" rx="8"/>
  <text class="dg-t" x="425" y="124" text-anchor="middle">JVM (macOS)</text>
  <path class="dg-line" d="M494 31 H556 M494 75 H556 M494 119 H556" marker-end="url(#a1)"/>
  <text class="dg-s" x="600" y="35" text-anchor="middle">native</text>
  <text class="dg-s" x="600" y="79" text-anchor="middle">native</text>
  <text class="dg-s" x="600" y="123" text-anchor="middle">native</text>
  <defs><marker id="a1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Write once, run anywhere — one bytecode, many JVMs.</figcaption>
</figure>
<blockquote><p><strong>Follow-up they always ask:</strong> "Then Java is platform independent but the JVM is platform dependent?" — Yes, exactly. That is the whole trick.</p></blockquote>`
},
{
  q: "Difference between JDK, JRE and JVM",
  level: "beginner", hot: true, tags: ["jvm", "basics"],
  a: `<table>
<tr><th>Term</th><th>What it is</th><th>Contains</th><th>Use it when</th></tr>
<tr><td><strong>JVM</strong></td><td>Java Virtual Machine — the abstract engine that executes bytecode</td><td>Class loader, memory areas, execution engine, JIT, GC</td><td>Nothing to install separately; it is a specification + implementation</td></tr>
<tr><td><strong>JRE</strong></td><td>Java Runtime Environment — everything needed to <em>run</em> a Java app</td><td>JVM + core libraries (<code>java.lang</code>, <code>java.util</code>, …)</td><td>You only need to run a jar</td></tr>
<tr><td><strong>JDK</strong></td><td>Java Development Kit — everything needed to <em>develop</em></td><td>JRE + <code>javac</code>, <code>jdb</code>, <code>javadoc</code>, <code>jar</code>, <code>jshell</code></td><td>You are writing and compiling code</td></tr>
</table>
<p>Containment is simply: <strong>JDK ⊃ JRE ⊃ JVM</strong>.</p>
<p>Note that since Java 11 Oracle no longer ships a standalone JRE — you use <code>jlink</code> to build a trimmed runtime image instead, which is exactly what small Docker images do.</p>`
},
{
  q: "Explain the main() method signature — why is every keyword there?",
  level: "beginner", tags: ["basics"],
  a: `<pre><code>public static void main(String[] args)</code></pre>
<ul>
<li><code>public</code> — the JVM calls it from outside the class, so it must be visible everywhere.</li>
<li><code>static</code> — the JVM must call it <em>without creating an object</em>; there is no instance yet.</li>
<li><code>void</code> — nothing meaningful can be returned to the JVM; the exit status comes from <code>System.exit()</code>.</li>
<li><code>String[] args</code> — command-line arguments. <code>String... args</code> is equally valid; so is <code>String args[]</code>.</li>
<li>The name <code>main</code> is fixed by the launcher specification.</li>
</ul>
<p>You <em>can</em> overload <code>main</code>, but the JVM only ever calls the <code>String[]</code> version. Since Java 21 (preview) / 25 (final), a simplified <code>void main()</code> without <code>public static</code> is allowed in unnamed classes for scripting-style programs.</p>`
},
{
  q: "Why are Java Strings immutable?",
  level: "beginner", hot: true, tags: ["string", "memory"],
  a: `<p><code>String</code> stores its data in a <code>private final byte[]</code> that is never exposed or mutated. Reasons this design was chosen:</p>
<ol>
<li><strong>String pool sharing.</strong> Literals are interned and shared across the whole JVM. If one reference could mutate the value, every other holder would silently see the change.</li>
<li><strong>Security.</strong> Usernames, file paths, JDBC URLs and class names are passed as Strings. If mutable, an attacker could change the value <em>after</em> a security check passed (time-of-check/time-of-use).</li>
<li><strong>Thread safety for free.</strong> Immutable objects need no synchronisation.</li>
<li><strong>Cached hashCode.</strong> <code>String</code> caches its hash, which makes it a fast, safe <code>HashMap</code> key. A mutable key would get lost in its bucket.</li>
</ol>
<pre><code>String a = "java";
String b = "java";          // same pooled object
String c = new String("java"); // new heap object
System.out.println(a == b);          // true
System.out.println(a == c);          // false
System.out.println(a.equals(c));     // true
System.out.println(a == c.intern()); // true</code></pre>`
},
{
  q: "String vs StringBuilder vs StringBuffer",
  level: "beginner", hot: true, tags: ["string"],
  a: `<table>
<tr><th></th><th>String</th><th>StringBuilder</th><th>StringBuffer</th></tr>
<tr><td>Mutable</td><td>No</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Thread-safe</td><td>Yes (immutable)</td><td>No</td><td>Yes (synchronized methods)</td></tr>
<tr><td>Speed</td><td>Slow for concatenation in loops</td><td>Fastest</td><td>Slower than StringBuilder</td></tr>
<tr><td>Since</td><td>1.0</td><td>1.5</td><td>1.0</td></tr>
</table>
<p><strong>Rule of thumb:</strong> single-threaded string building → <code>StringBuilder</code>. Shared mutable buffer across threads → you almost certainly want a different design, not <code>StringBuffer</code>.</p>
<p>Concatenating with <code>+</code> inside a loop creates a new object each iteration — O(n²) copying:</p>
<pre><code>// Bad: allocates a new String on every iteration
String s = "";
for (int i = 0; i &lt; 10000; i++) s += i;

// Good
StringBuilder sb = new StringBuilder();
for (int i = 0; i &lt; 10000; i++) sb.append(i);
String s = sb.toString();</code></pre>
<p>Outside a loop, <code>"a" + b + "c"</code> is fine — since Java 9 the compiler turns it into an <code>invokedynamic</code> call to <code>StringConcatFactory</code>, which is at least as fast as StringBuilder.</p>`
},
{
  q: "== vs equals() — and the contract with hashCode()",
  level: "beginner", hot: true, tags: ["equals", "basics"],
  a: `<p><code>==</code> compares <strong>references</strong> for objects and <strong>values</strong> for primitives. <code>equals()</code> compares <strong>logical equality</strong> as defined by the class; the default <code>Object.equals()</code> is just <code>==</code>.</p>
<p><strong>The contract:</strong> if <code>a.equals(b)</code> is true then <code>a.hashCode() == b.hashCode()</code> <em>must</em> be true. The reverse is not required (collisions are legal).</p>
<p>Break it and hash collections quietly misbehave:</p>
<pre><code>class Point {
    int x, y;
    // equals overridden, hashCode NOT overridden  &lt;-- bug
}
Set&lt;Point&gt; set = new HashSet&lt;&gt;();
set.add(new Point(1,1));
set.contains(new Point(1,1)); // false — wrong bucket</code></pre>
<p>Correct version:</p>
<pre><code>@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Point p)) return false;   // pattern matching, Java 16+
    return x == p.x &amp;&amp; y == p.y;
}
@Override public int hashCode() { return Objects.hash(x, y); }</code></pre>
<p>A <code>record</code> generates both correctly for you — mention that and you look current.</p>`
},
{
  q: "What is autoboxing, and what is the Integer cache gotcha?",
  level: "beginner", tags: ["basics", "gotcha"],
  a: `<p>Autoboxing is the compiler automatically converting a primitive to its wrapper (<code>int</code> → <code>Integer</code> via <code>Integer.valueOf</code>) and unboxing the reverse (<code>intValue()</code>).</p>
<pre><code>Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b); // true
System.out.println(c == d); // false  &lt;-- the classic trap</code></pre>
<p><code>Integer.valueOf</code> caches boxed values from <strong>-128 to 127</strong>, so small values return the same object. Beyond that a new object is allocated. Always compare wrappers with <code>equals()</code>.</p>
<p>Two more traps: unboxing a <code>null</code> Integer throws <code>NullPointerException</code>, and autoboxing inside a hot loop allocates millions of objects (use <code>IntStream</code> / primitive arrays instead).</p>`
},
{
  q: "Checked vs unchecked exceptions — when do you use each?",
  level: "beginner", hot: true, tags: ["exceptions"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="Java exception hierarchy">
  <rect class="dg-fill" x="240" y="8" width="130" height="34" rx="7"/><text class="dg-t" x="305" y="30" text-anchor="middle">Throwable</text>
  <path class="dg-line" d="M305 42 V60 M150 60 H460 M150 60 V78 M460 60 V78"/>
  <rect class="dg-box" x="80" y="78" width="140" height="34" rx="7"/><text class="dg-t" x="150" y="100" text-anchor="middle">Error</text>
  <rect class="dg-fill2" x="390" y="78" width="140" height="34" rx="7"/><text class="dg-t" x="460" y="100" text-anchor="middle">Exception</text>
  <text class="dg-s" x="150" y="128" text-anchor="middle">OutOfMemoryError</text>
  <text class="dg-s" x="150" y="144" text-anchor="middle">StackOverflowError</text>
  <text class="dg-s" x="150" y="160" text-anchor="middle">(never catch)</text>
  <path class="dg-line" d="M460 112 V128 M360 128 H560 M360 128 V146 M560 128 V146"/>
  <rect class="dg-box" x="292" y="146" width="136" height="32" rx="7"/><text class="dg-t" x="360" y="167" text-anchor="middle">IOException…</text>
  <rect class="dg-box" x="482" y="146" width="150" height="32" rx="7"/><text class="dg-t" x="557" y="167" text-anchor="middle">RuntimeException</text>
  <text class="dg-s" x="360" y="194" text-anchor="middle">CHECKED — must handle</text>
  <text class="dg-s" x="557" y="194" text-anchor="middle">UNCHECKED</text>
</svg>
<figcaption>Everything under RuntimeException and Error is unchecked.</figcaption>
</figure>
<ul>
<li><strong>Checked</strong> (<code>IOException</code>, <code>SQLException</code>): the compiler forces you to <code>catch</code> or <code>throws</code>. Use for recoverable, expected conditions the caller can genuinely act on.</li>
<li><strong>Unchecked</strong> (<code>NullPointerException</code>, <code>IllegalArgumentException</code>): programming errors. No compiler obligation.</li>
<li><strong>Error</strong> (<code>OutOfMemoryError</code>): JVM-level problems. Do not catch.</li>
</ul>
<p>Modern frameworks lean unchecked — Spring wraps every <code>SQLException</code> into the unchecked <code>DataAccessException</code> hierarchy, precisely because checked exceptions leak persistence details into business code and pollute signatures.</p>`
},
{
  q: "try-catch-finally: does finally always run? What does try-with-resources add?",
  level: "beginner", hot: true, tags: ["exceptions"],
  a: `<p><code>finally</code> runs in almost every case — including when the try block returns. It does <strong>not</strong> run if the JVM exits (<code>System.exit()</code>), the thread is killed, or the machine dies.</p>
<p>A <code>return</code> inside <code>finally</code> silently swallows exceptions and overrides the earlier return — never do it:</p>
<pre><code>int f() {
    try { return 1; }
    finally { return 2; }   // returns 2, hides everything. Bad.
}</code></pre>
<p><strong>try-with-resources</strong> (Java 7) closes anything implementing <code>AutoCloseable</code>, in reverse order, even on exception — and it keeps the original exception as primary while attaching the close failure as a <em>suppressed</em> exception. Manual finally blocks get that backwards.</p>
<pre><code>try (var conn = dataSource.getConnection();
     var ps = conn.prepareStatement(SQL)) {
    ps.setLong(1, id);
    return ps.executeQuery();
}   // both closed automatically, ps first</code></pre>`
},
{
  q: "What is the difference between final, finally and finalize()?",
  level: "beginner", tags: ["basics"],
  a: `<ul>
<li><code>final</code> — a modifier. On a variable: assign once. On a method: cannot be overridden. On a class: cannot be extended.</li>
<li><code>finally</code> — a block that always executes after try/catch.</li>
<li><code>finalize()</code> — an <code>Object</code> method the GC <em>might</em> have called before collecting. <strong>Deprecated since Java 9 and removed for removal in Java 18</strong>; it was unpredictable, could resurrect objects and delayed collection. Use <code>try-with-resources</code> or <code>java.lang.ref.Cleaner</code> instead.</li>
</ul>
<p>Note <code>final</code> on a reference makes the <em>reference</em> immutable, not the object: <code>final List&lt;String&gt; l = new ArrayList&lt;&gt;(); l.add("x");</code> compiles fine.</p>`
},
{
  q: "Pass by value or pass by reference — which is Java?",
  level: "beginner", hot: true, tags: ["basics", "gotcha"],
  a: `<p>Java is <strong>always pass by value</strong>. For objects, the <em>value being copied is the reference</em>, which is why the distinction confuses people.</p>
<pre><code>void mutate(StringBuilder sb) { sb.append(" world"); }  // caller SEES this
void reassign(StringBuilder sb) { sb = new StringBuilder("bye"); } // caller does NOT

var sb = new StringBuilder("hello");
mutate(sb);    // sb -> "hello world"
reassign(sb);  // sb still "hello world"</code></pre>
<p>You can mutate the object the copied reference points at, but reassigning the parameter only changes the local copy. That is the exact answer to give.</p>`
},
{
  q: "Explain static keyword — variables, methods, blocks and nested classes",
  level: "beginner", tags: ["basics"],
  a: `<p><code>static</code> binds a member to the <strong>class</strong> rather than to any instance.</p>
<ul>
<li><strong>Static variable</strong> — one copy per class loader, shared by all instances. Stored in the metaspace/class object, not the heap per-instance.</li>
<li><strong>Static method</strong> — callable without an object; cannot use <code>this</code> or access instance members directly; cannot be overridden (it is <em>hidden</em>, resolved at compile time).</li>
<li><strong>Static block</strong> — runs once at class initialisation, in source order, before any instance is created.</li>
<li><strong>Static nested class</strong> — does not hold an implicit reference to the outer instance (an inner class does, which is a classic memory-leak source).</li>
</ul>
<pre><code>class A {
    static int count;
    static { count = 10; System.out.println("class init"); }
    static void hello() { }
}</code></pre>
<p><strong>Method hiding trap:</strong> calling a static method through a reference uses the <em>declared</em> type, not the runtime type.</p>`
},
{
  q: "What are access modifiers and their visibility?",
  level: "beginner", tags: ["basics", "oop"],
  a: `<table>
<tr><th>Modifier</th><th>Same class</th><th>Same package</th><th>Subclass (other pkg)</th><th>Everywhere</th></tr>
<tr><td><code>private</code></td><td>✔</td><td>✗</td><td>✗</td><td>✗</td></tr>
<tr><td><em>default</em> (package-private)</td><td>✔</td><td>✔</td><td>✗</td><td>✗</td></tr>
<tr><td><code>protected</code></td><td>✔</td><td>✔</td><td>✔</td><td>✗</td></tr>
<tr><td><code>public</code></td><td>✔</td><td>✔</td><td>✔</td><td>✔</td></tr>
</table>
<p>Two nuances worth stating: a top-level class can only be <code>public</code> or package-private; and <code>protected</code> access from another package works only <em>through a reference of your own subclass type</em>, not on an arbitrary parent instance.</p>`
},
{
  q: "Can you override a static or private method? What about main()?",
  level: "beginner", tags: ["oop", "gotcha"],
  a: `<p><strong>No to all three</strong>, but for different reasons:</p>
<ul>
<li><strong>Static</strong> — redeclaring it in a subclass is <em>method hiding</em>, not overriding. Dispatch is by compile-time type, so no polymorphism.</li>
<li><strong>Private</strong> — not visible to the subclass at all. A same-named method is a brand-new, unrelated method.</li>
<li><strong><code>main</code></strong> — it is static, so same as above. You can overload it, and it will be hidden in a subclass, but never overridden.</li>
<li><strong><code>final</code></strong> methods are explicitly forbidden from being overridden.</li>
</ul>`
},
{
  q: "What is the difference between an array and an ArrayList?",
  level: "beginner", tags: ["collections", "basics"],
  a: `<table>
<tr><th></th><th>Array</th><th>ArrayList</th></tr>
<tr><td>Size</td><td>Fixed at creation</td><td>Grows (typically 1.5×) automatically</td></tr>
<tr><td>Type</td><td>Primitives or objects</td><td>Objects only (autoboxes primitives)</td></tr>
<tr><td>Type safety</td><td>Covariant — <code>Object[] o = new String[1]</code> compiles and can fail at runtime with <code>ArrayStoreException</code></td><td>Invariant generics — caught at compile time</td></tr>
<tr><td>Length</td><td><code>arr.length</code> (field)</td><td><code>list.size()</code> (method)</td></tr>
<tr><td>Performance</td><td>No boxing overhead, contiguous</td><td>Slight overhead, resizing copies</td></tr>
</table>
<p>Interviewer's follow-up: "<code>Arrays.asList()</code> returns what?" — a <em>fixed-size</em> view backed by the array. <code>add()</code> throws <code>UnsupportedOperationException</code>, and <code>set()</code> writes through to the original array. Use <code>new ArrayList&lt;&gt;(Arrays.asList(...))</code> or <code>List.of()</code> (fully immutable) as appropriate.</p>`
},
{
  q: "Explain the this and super keywords",
  level: "beginner", tags: ["oop"],
  a: `<ul>
<li><code>this</code> — reference to the current object. Used to disambiguate a shadowed field, pass the current object along, or chain to another constructor via <code>this(...)</code>.</li>
<li><code>super</code> — reference to the parent. Used to call an overridden parent method (<code>super.save()</code>), a parent field, or the parent constructor via <code>super(...)</code>.</li>
</ul>
<p>Both <code>this(...)</code> and <code>super(...)</code> must be the <em>first statement</em> in a constructor, so you can use only one of them. If you write neither, the compiler inserts an implicit <code>super()</code> — which is exactly why a parent without a no-arg constructor forces every child to call <code>super(args)</code> explicitly.</p>`
},
{
  q: "What is a marker interface? Are they still used?",
  level: "beginner", tags: ["oop"],
  a: `<p>An interface with no methods, used purely to tag a class so that the JVM or a library treats it specially: <code>Serializable</code>, <code>Cloneable</code>, <code>RandomAccess</code>, <code>Remote</code>.</p>
<p>Modern Java mostly replaces them with <strong>annotations</strong>, which carry metadata and parameters. But markers still have one advantage: they create a <em>type</em>, so the compiler can enforce that a method only accepts tagged objects — an annotation cannot do that.</p>
<p>Java 17's <code>sealed</code> interfaces are the current evolution of "restrict who can implement this".</p>`
},
{
  q: "What is the difference between deep copy and shallow copy?",
  level: "beginner", tags: ["basics", "memory"],
  a: `<p><strong>Shallow copy</strong> duplicates the top-level object but copies references for nested objects — both copies share the same children. <code>Object.clone()</code> is shallow by default.</p>
<p><strong>Deep copy</strong> recursively duplicates the whole object graph, so the copies are fully independent.</p>
<pre><code>class Order implements Cloneable {
    String id;
    List&lt;Item&gt; items;

    @Override protected Order clone() throws CloneNotSupportedException {
        Order copy = (Order) super.clone();          // shallow
        copy.items = new ArrayList&lt;&gt;(this.items);    // now deep-ish
        return copy;
    }
}</code></pre>
<p>In real projects people avoid <code>Cloneable</code> entirely (its contract is broken by design) and instead use a copy constructor, a static factory, a mapper like MapStruct, or serialisation round-tripping. Say that — it shows production judgement.</p>`
},
{
  q: "What are var, records, sealed classes and text blocks?",
  level: "beginner", tags: ["modern-java"],
  a: `<ul>
<li><strong><code>var</code></strong> (Java 10) — local variable type inference. Still statically typed; just less typing. Not allowed for fields, parameters or return types.</li>
<li><strong>Records</strong> (Java 16) — immutable data carriers. The compiler generates the constructor, accessors, <code>equals</code>, <code>hashCode</code>, <code>toString</code>. Perfect for DTOs and API responses.</li>
<li><strong>Sealed classes</strong> (Java 17) — restrict which types may extend/implement, enabling exhaustive switch without a default branch.</li>
<li><strong>Text blocks</strong> (Java 15) — multi-line string literals with <code>"""</code>, great for embedded SQL, JSON and GraphQL.</li>
</ul>
<pre><code>public record CustomerDto(Long id, String name, String email) { }

sealed interface Shape permits Circle, Square { }

String query = """
    SELECT id, name
    FROM customer
    WHERE status = ?
    """;</code></pre>`
},
{
  q: "What is the difference between an abstract class and an interface (Java 8+)?",
  level: "beginner", hot: true, tags: ["oop"],
  a: `<table>
<tr><th></th><th>Abstract class</th><th>Interface</th></tr>
<tr><td>State (instance fields)</td><td>Yes</td><td>No — only <code>public static final</code> constants</td></tr>
<tr><td>Constructors</td><td>Yes</td><td>No</td></tr>
<tr><td>Multiple inheritance</td><td>Single only</td><td>A class may implement many</td></tr>
<tr><td>Method bodies</td><td>Concrete + abstract</td><td><code>default</code> and <code>static</code> (Java 8), <code>private</code> (Java 9)</td></tr>
<tr><td>Access modifiers</td><td>Any</td><td>Members implicitly public</td></tr>
</table>
<p><strong>Choose by intent:</strong> an abstract class models an "is-a" with shared <em>state and partial implementation</em>; an interface models a <em>capability</em> or contract ("can-do") that unrelated types can adopt.</p>
<p>Why were <code>default</code> methods added? To evolve existing interfaces without breaking every implementer — that is how <code>Collection.stream()</code> could be added in Java 8.</p>`
},
{
  q: "Explain the diamond problem and how Java handles it",
  level: "advanced", tags: ["oop"],
  a: `<p>Java forbids multiple class inheritance, so the classic diamond cannot occur with classes. Java 8 default methods reintroduced the possibility through interfaces, and the compiler resolves it with three rules:</p>
<ol>
<li><strong>Classes win over interfaces.</strong> A concrete method inherited from a superclass beats any interface default.</li>
<li><strong>More specific interface wins.</strong> If <code>B extends A</code>, B's default beats A's.</li>
<li><strong>Otherwise, ambiguity is a compile error</strong> — you must override and explicitly disambiguate.</li>
</ol>
<pre><code>interface A { default String hi() { return "A"; } }
interface B { default String hi() { return "B"; } }

class C implements A, B {
    @Override public String hi() {
        return A.super.hi();   // explicit qualification
    }
}</code></pre>`
},
{
  q: "How does the String pool work, and what does intern() do?",
  level: "advanced", tags: ["string", "memory"],
  a: `<p>The string pool is a JVM-managed table of unique String instances. Since Java 7 it lives on the <strong>heap</strong> (it was in PermGen before), which means pooled strings can be garbage collected and the pool can be sized with <code>-XX:StringTableSize</code>.</p>
<ul>
<li>String <em>literals</em> are interned automatically at class loading.</li>
<li>Compile-time constant expressions (<code>"ja" + "va"</code>) are folded and interned.</li>
<li>Runtime concatenation produces a <em>new</em>, non-pooled object.</li>
<li><code>intern()</code> returns the canonical pooled instance, adding it if absent.</li>
</ul>
<pre><code>String s1 = "java";
String s2 = "ja" + "va";              // constant-folded  -> pooled
String part = "ja";
String s3 = part + "va";              // runtime -> new object
System.out.println(s1 == s2);         // true
System.out.println(s1 == s3);         // false
System.out.println(s1 == s3.intern());// true</code></pre>
<p>Also worth mentioning: <strong>compact strings</strong> (Java 9) store Latin-1 text in a <code>byte[]</code> with a coder flag instead of <code>char[]</code>, roughly halving heap usage for typical ASCII-heavy applications.</p>`
},
{
  q: "What is the object creation flow — what happens on 'new'?",
  level: "advanced", tags: ["jvm", "memory"],
  a: `<ol>
<li><strong>Class loading check</strong> — if the class is not yet loaded, load → link (verify, prepare, resolve) → initialise (static fields and static blocks run once).</li>
<li><strong>Allocation</strong> — space is reserved in the heap's Eden space, usually with a bump-the-pointer allocation in a thread-local allocation buffer (TLAB), so no locking.</li>
<li><strong>Default initialisation</strong> — all fields zeroed (<code>0</code>, <code>false</code>, <code>null</code>).</li>
<li><strong>Object header set</strong> — mark word (hash, GC age, lock state) plus klass pointer.</li>
<li><strong>Constructor chain</strong> — <code>super()</code> runs first, then instance initialiser blocks and field initialisers in source order, then the constructor body.</li>
<li><strong>Reference assigned</strong> to the variable.</li>
</ol>
<p>Escape analysis can eliminate step 2 entirely: if the JIT proves an object never escapes the method, it may be scalar-replaced and never allocated on the heap at all.</p>`
},
{
  q: "What is serialization? What role does serialVersionUID play?",
  level: "advanced", tags: ["serialization"],
  a: `<p>Serialization converts an object graph into a byte stream (<code>ObjectOutputStream</code>) for persistence or transport; deserialization rebuilds it. The class must implement <code>Serializable</code>.</p>
<ul>
<li><code>serialVersionUID</code> is a version fingerprint. If it differs between the writing and reading class, deserialization fails with <code>InvalidClassException</code>. Declare it explicitly — the auto-generated value changes with almost any class edit.</li>
<li><code>transient</code> fields are skipped (passwords, caches, connections). They come back as defaults.</li>
<li><code>static</code> fields belong to the class, not the instance, so they are never serialized.</li>
<li>The constructor is <strong>not</strong> called during deserialization — the first non-serializable superclass constructor is.</li>
</ul>
<blockquote><p><strong>Production reality:</strong> Java native serialization is a well-known security risk (deserialization gadget chains) and is being phased out. Modern systems use JSON (Jackson), Protobuf or Avro. Saying this earns points.</p></blockquote>`
},
{
  q: "Explain shallow immutability vs true immutability — how do you write a truly immutable class?",
  level: "advanced", tags: ["oop", "design"],
  a: `<p>Checklist for a genuinely immutable class:</p>
<ol>
<li>Mark the class <code>final</code> (or make all constructors private) so behaviour cannot be overridden.</li>
<li>Make every field <code>private final</code>.</li>
<li>No setters, and no method that mutates state.</li>
<li><strong>Defensive-copy mutable inputs in the constructor.</strong></li>
<li><strong>Defensive-copy mutable state in the getters</strong> — otherwise the caller mutates your internals.</li>
</ol>
<pre><code>public final class Invoice {
    private final String id;
    private final List&lt;LineItem&gt; items;
    private final Date issuedAt;

    public Invoice(String id, List&lt;LineItem&gt; items, Date issuedAt) {
        this.id = id;
        this.items = List.copyOf(items);            // defensive copy in
        this.issuedAt = new Date(issuedAt.getTime());
    }
    public List&lt;LineItem&gt; getItems() { return items; }        // already unmodifiable
    public Date getIssuedAt() { return new Date(issuedAt.getTime()); } // copy out
}</code></pre>
<p>Note that a <code>record</code> gives you 1–3 for free but <strong>not</strong> 4 and 5 — a record holding a <code>List</code> is only shallowly immutable unless you copy in the compact constructor.</p>`
},
{
  q: "What is the difference between throw and throws, and how do you design exceptions well?",
  level: "advanced", tags: ["exceptions", "design"],
  a: `<p><code>throw</code> is a statement that raises one exception instance; <code>throws</code> is a method-signature clause declaring what may propagate.</p>
<p><strong>Design guidance interviewers look for:</strong></p>
<ul>
<li>Throw the most <em>specific</em> exception you can; catch the most specific you can handle.</li>
<li>Never <code>catch (Exception e) { }</code> — swallowing is how production incidents become unsolvable.</li>
<li>Always preserve the cause: <code>throw new OrderFailedException("order " + id, e);</code> Losing the stack trace is the most common code-review comment.</li>
<li>Do not use exceptions for control flow — they are expensive because filling in the stack trace is expensive.</li>
<li>In a REST service, translate exceptions to HTTP semantics in one place (<code>@RestControllerAdvice</code>) and return an RFC 7807 problem detail.</li>
</ul>
<pre><code>@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(EntityNotFoundException.class)
    ResponseEntity&lt;ProblemDetail&gt; notFound(EntityNotFoundException e) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
        pd.setTitle("Resource not found");
        return ResponseEntity.of(pd).build();
    }
}</code></pre>`
},
{
  q: "What are generics, type erasure, and PECS?",
  level: "advanced", hot: true, tags: ["generics"],
  a: `<p>Generics give compile-time type safety and remove casts. At runtime the type parameters are <strong>erased</strong> — <code>List&lt;String&gt;</code> and <code>List&lt;Integer&gt;</code> are both just <code>List</code>. That is why you cannot do <code>new T[]</code>, <code>instanceof List&lt;String&gt;</code>, or overload on <code>List&lt;String&gt;</code> vs <code>List&lt;Integer&gt;</code>.</p>
<p><strong>PECS — Producer Extends, Consumer Super:</strong></p>
<pre><code>// producer: you only READ Ts out of it
void printAll(List&lt;? extends Number&gt; src) {
    for (Number n : src) System.out.println(n);   // read OK, add() forbidden
}

// consumer: you only WRITE Ts into it
void addInts(List&lt;? super Integer&gt; dst) {
    dst.add(1);            // write OK, read gives Object
}

// Collections.copy is the canonical example
static &lt;T&gt; void copy(List&lt;? super T&gt; dest, List&lt;? extends T&gt; src)</code></pre>
<p><code>&lt;?&gt;</code> (unbounded wildcard) means "some unknown type" — you can read <code>Object</code> and add only <code>null</code>.</p>`
},
{
  q: "How does the ternary operator's unboxing cause a surprise NullPointerException?",
  level: "advanced", tags: ["gotcha"],
  a: `<pre><code>Integer value = condition ? 1 : getNullableInteger();   // may throw NPE!</code></pre>
<p>When one branch of a conditional expression is a primitive <code>int</code> and the other is <code>Integer</code>, binary numeric promotion applies: the compiler <strong>unboxes both branches to int</strong>. If the chosen branch is <code>null</code>, you get an NPE on a line that appears to only assign a nullable value.</p>
<p>Fix by keeping both branches the same reference type:</p>
<pre><code>Integer value = condition ? Integer.valueOf(1) : getNullableInteger();</code></pre>
<p>This is a favourite "spot the bug" question because the NPE stack trace points at an assignment with no visible dereference.</p>`
},
{
  q: "What is the difference between an inner class, static nested class, local class and anonymous class?",
  level: "advanced", tags: ["oop", "memory"],
  a: `<table>
<tr><th>Type</th><th>Holds outer reference?</th><th>Typical use</th></tr>
<tr><td>Static nested</td><td>No</td><td>Helper/builder tied to the outer type conceptually</td></tr>
<tr><td>Inner (non-static)</td><td><strong>Yes</strong> — implicit <code>Outer.this</code></td><td>Needs outer state; e.g. iterator over the outer collection</td></tr>
<tr><td>Local</td><td>Yes + captured effectively-final locals</td><td>One method's private helper</td></tr>
<tr><td>Anonymous</td><td>Yes</td><td>One-off listener/callback (mostly replaced by lambdas)</td></tr>
</table>
<blockquote><p><strong>The memory-leak angle they are fishing for:</strong> a non-static inner class instance keeps the whole outer object alive. Register such a listener in a long-lived registry and the outer object — with all its fields — can never be collected. Prefer <code>static</code> nested classes unless you genuinely need the outer instance.</p></blockquote>
<p>Note that lambdas are <em>not</em> anonymous classes: they compile to <code>invokedynamic</code> with a method handle, do not create a <code>.class</code> file per lambda, and <code>this</code> inside a lambda refers to the enclosing instance rather than the lambda itself.</p>`
},
{
  q: "What does 'effectively final' mean and why do lambdas require it?",
  level: "advanced", tags: ["lambda", "concurrency"],
  a: `<p>A local variable is <em>effectively final</em> if it is never reassigned after initialisation, even without the <code>final</code> keyword. Lambdas and anonymous classes may only capture such variables.</p>
<p><strong>Why:</strong> local variables live on the thread's stack, which disappears when the method returns. The lambda captures a <em>copy</em> of the value. If the original could change afterwards, the copy and the original would silently diverge — and if the lambda runs on another thread, you would have a data race with no synchronisation.</p>
<pre><code>int counter = 0;
list.forEach(x -&gt; counter++);   // compile error

// Workarounds, in order of preference:
long counter = list.stream().filter(...).count();   // best — no mutation
AtomicInteger c = new AtomicInteger();              // if you truly need mutation
list.forEach(x -&gt; c.incrementAndGet());</code></pre>
<p>Instance and static fields have no such restriction because they live on the heap — which is also why capturing <code>this</code> accidentally is easy.</p>`
},
{
  q: "How would you debug a production NullPointerException with no obvious cause?",
  level: "advanced", tags: ["debugging", "production"],
  a: `<ol>
<li><strong>Enable helpful NPE messages</strong> — on by default since Java 15 (<code>-XX:+ShowCodeDetailsInExceptionMessages</code> in 14). Instead of "NullPointerException", you get: <em>"Cannot invoke String.length() because the return value of Map.get(Object) is null"</em>. This single flag resolves most of these tickets.</li>
<li><strong>Read the whole trace, find your own frame</strong> — the first line of <em>your</em> package is usually the real culprit, not the framework frame at the top.</li>
<li><strong>Check the boundaries</strong> — external API returning null, a JSON field absent so Jackson left the field null, an <code>Optional</code> that was <code>.get()</code>-ed, a <code>Map.get</code> miss, or an uninitialised <code>@Autowired</code> field in an object created with <code>new</code>.</li>
<li><strong>Reproduce with the actual payload</strong> from the request log or DLQ message.</li>
<li><strong>Prevent structurally</strong>: <code>Objects.requireNonNull</code> at constructor boundaries, <code>@NotNull</code> bean validation on request DTOs, <code>Optional</code> as return type for "may be absent", and never returning <code>null</code> collections — return <code>List.of()</code>.</li>
</ol>`
}
]);
