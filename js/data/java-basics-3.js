appendTopic("java-basics", [
{
  q: "What is the output? Explain string pool behaviour with concatenation",
  level: "beginner", hot: true, tags: ["string", "gotcha"],
  companies: ["TCS", "Infosys", "Capgemini", "Cognizant", "Wipro"],
  a: `<pre><code>String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");
String s4 = "Hel" + "lo";              // compile-time constant
final String part = "Hel";
String s5 = part + "lo";               // final -> also folded at compile time
String p = "Hel";
String s6 = p + "lo";                  // runtime concatenation

System.out.println(s1 == s2);          // true  — same pooled literal
System.out.println(s1 == s3);          // false — new object on the heap
System.out.println(s1 == s4);          // true  — constant folding
System.out.println(s1 == s5);          // true  — 'part' is a compile-time constant
System.out.println(s1 == s6);          // false — built at runtime
System.out.println(s1 == s6.intern()); // true</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="String pool versus heap allocation">
  <rect class="dg-box" x="10" y="20" width="280" height="132" rx="10"/>
  <text class="dg-t" x="150" y="42" text-anchor="middle">Heap</text>
  <rect class="dg-fill" x="26" y="56" width="248" height="52" rx="8"/>
  <text class="dg-t" x="150" y="76" text-anchor="middle">String pool (interned)</text>
  <rect class="dg-fill2" x="42" y="82" width="90" height="20" rx="4"/><text class="dg-s" x="87" y="96" text-anchor="middle">"Hello"</text>
  <text class="dg-s" x="205" y="96" text-anchor="middle">shared by s1,s2,s4,s5</text>
  <rect class="dg-box" x="26" y="116" width="110" height="26" rx="6"/><text class="dg-s" x="81" y="133" text-anchor="middle">new String</text>
  <rect class="dg-box" x="150" y="116" width="124" height="26" rx="6"/><text class="dg-s" x="212" y="133" text-anchor="middle">runtime concat</text>
  <text class="dg-s" x="440" y="46" text-anchor="middle">s1 ─┐</text>
  <text class="dg-s" x="440" y="64" text-anchor="middle">s2 ─┼─→ pooled "Hello"</text>
  <text class="dg-s" x="440" y="82" text-anchor="middle">s4 ─┘</text>
  <text class="dg-s" x="443" y="112" text-anchor="middle">s3 ──→ separate object</text>
  <text class="dg-s" x="446" y="134" text-anchor="middle">s6 ──→ separate object</text>
</svg>
<figcaption>Only compile-time constants reach the pool automatically.</figcaption>
</figure>
<p><strong>The rule to state:</strong> the compiler folds constant expressions — literals and <code>final</code> variables initialised with literals — so those end up pooled. Anything assembled at <em>runtime</em> produces a fresh object. This is why <code>==</code> on Strings is unreliable and <code>equals()</code> is mandatory.</p>`
},
{
  q: "What happens if you don't override hashCode but override equals? Show the impact",
  level: "beginner", hot: true, tags: ["equals", "collections"],
  companies: ["Infosys", "Accenture", "TCS", "HCL", "LTIMindtree"],
  a: `<pre><code>class Employee {
    private final int id;
    @Override public boolean equals(Object o) {
        return o instanceof Employee e &amp;&amp; e.id == this.id;
    }
    // hashCode() NOT overridden -> inherits Object's identity hash
}

Map&lt;Employee, String&gt; map = new HashMap&lt;&gt;();
map.put(new Employee(1), "Vivek");
map.get(new Employee(1));        // null  — different bucket
map.containsKey(new Employee(1));// false
map.size();                       // 1, but you can never retrieve it

Set&lt;Employee&gt; set = new HashSet&lt;&gt;();
set.add(new Employee(1));
set.add(new Employee(1));
set.size();                       // 2 — logical duplicates in a Set</code></pre>
<p><strong>Why:</strong> <code>HashMap</code> locates the bucket from <code>hashCode()</code> <em>before</em> it ever calls <code>equals()</code>. Two equal objects with different hashes land in different buckets, so <code>equals</code> is never consulted. The entry is present but unreachable — a real memory leak in a long-lived cache.</p>
<pre><code>// Correct
@Override public int hashCode() { return Objects.hash(id); }
// Or just use a record, which generates both correctly
public record Employee(int id, String name) { }</code></pre>
<p><strong>The follow-up they ask:</strong> "Can two unequal objects have the same hashCode?" — Yes, that is a legal collision; the contract only runs one way. "Can two equal objects have different hashCodes?" — No, that breaks the contract and produces exactly the bug above.</p>`
},
{
  q: "Why is Java not 100% object oriented?",
  level: "beginner", hot: true, tags: ["basics", "oop"],
  companies: ["TCS", "Cognizant", "Wipro", "Tech Mahindra", "Capgemini"],
  a: `<p>Because of the eight <strong>primitive types</strong> — <code>byte</code>, <code>short</code>, <code>int</code>, <code>long</code>, <code>float</code>, <code>double</code>, <code>char</code>, <code>boolean</code>. They are not objects: they have no methods, cannot be <code>null</code>, and do not inherit from <code>Object</code>.</p>
<pre><code>int x = 5;
x.toString();          // ✘ does not compile — primitives have no methods

Integer y = 5;         // wrapper IS an object
y.toString();          // ✔</code></pre>
<p><strong>Why the language kept them:</strong> performance. An <code>int[1_000_000]</code> is 4 MB of contiguous memory; an <code>Integer[1_000_000]</code> is roughly 20 MB of pointers plus a million heap objects with far worse cache behaviour. Forcing everything to be an object would have made Java unusable for numeric work in 1995.</p>
<p><strong>Other arguments that get raised:</strong> <code>static</code> members belong to a class rather than an object, and operators like <code>+</code> are not method calls. But primitives are the answer the interviewer is looking for.</p>
<p><strong>The modern footnote worth adding:</strong> <strong>Project Valhalla</strong> is working on value classes that behave like primitives while being real types — which would largely close this gap. Mentioning it shows you follow where the language is going.</p>`
},
{
  q: "Explain the output of this integer caching and ternary puzzle",
  level: "advanced", hot: true, tags: ["gotcha", "basics"],
  companies: ["Amazon", "Adobe", "Oracle", "Paytm", "Flipkart"],
  a: `<pre><code>Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);            // true  — IntegerCache covers -128..127
System.out.println(c == d);            // false — new objects beyond the cache
System.out.println(c.equals(d));       // true

Long e = 127L;
System.out.println(a.equals(e));       // false! equals checks the TYPE too

Integer nullable = null;
int result = true ? 1 : nullable;      // NullPointerException? No — but...
int r2 = false ? 1 : nullable;         // NPE — unboxing null

Object o = true ? Integer.valueOf(1) : Double.valueOf(2.0);
System.out.println(o);                 // 1.0  — binary numeric promotion to double!</code></pre>
<p><strong>Three separate traps here:</strong></p>
<ol>
<li><strong>Integer cache</strong> — <code>Integer.valueOf</code> returns shared instances for −128..127, so <code>==</code> works accidentally in that range and fails outside it.</li>
<li><strong><code>equals</code> is type-sensitive</strong> — <code>Integer(127).equals(Long(127L))</code> is <code>false</code> because <code>Integer.equals</code> first checks <code>instanceof Integer</code>.</li>
<li><strong>The conditional operator promotes numerically.</strong> When the two branches are different numeric types, both are promoted to the wider one — so an <code>Integer</code> branch becomes <code>1.0</code>, and a <code>null</code> Integer branch throws an NPE on unboxing.</li>
</ol>
<p><strong>The takeaway to give:</strong> always compare wrappers with <code>equals</code>, keep both ternary branches the same type, and prefer primitives where <code>null</code> is not meaningful.</p>`
},
{
  q: "What is the difference between transient, volatile and static?",
  level: "beginner", hot: true, tags: ["basics", "serialization"],
  companies: ["TCS", "Infosys", "IBM", "Deloitte", "Persistent"],
  a: `<table>
<tr><th>Keyword</th><th>Applies to</th><th>Effect</th></tr>
<tr><td><code>transient</code></td><td>Instance field</td><td>Excluded from Java serialization; restored as the default value</td></tr>
<tr><td><code>volatile</code></td><td>Field</td><td>Guarantees visibility across threads and prevents reordering — <em>not</em> atomicity</td></tr>
<tr><td><code>static</code></td><td>Field, method, block, nested class</td><td>Belongs to the class, not an instance; one copy per class loader</td></tr>
</table>
<pre><code>class Session implements Serializable {
    private String username;              // serialised
    private transient String password;     // NOT serialised — comes back null
    private transient Connection conn;      // not serialisable anyway
    private static int activeCount;         // static is never serialised either
    private volatile boolean active;        // visible immediately to other threads
}</code></pre>
<p><strong>The distinction that gets probed:</strong> both <code>transient</code> and <code>static</code> fields are skipped during serialization, but for different reasons — <code>transient</code> is a deliberate opt-out for <em>instance</em> state, while <code>static</code> is skipped because it belongs to the class rather than the object being serialised. A common trap question is "will a static field survive deserialization?" — it keeps whatever value the class currently has in that JVM, which may not be what was serialised.</p>
<p><strong>Use <code>transient</code> for:</strong> passwords and secrets, derived or cacheable values, and anything non-serialisable (connections, threads, streams) that would otherwise throw <code>NotSerializableException</code>.</p>`
},
{
  q: "Can you override a method to throw a different exception?",
  level: "advanced", tags: ["exceptions", "oop"],
  companies: ["Infosys", "Wipro", "Mindtree", "Accenture"],
  a: `<p>The rule concerns <strong>checked</strong> exceptions only: an overriding method may throw the same checked exception, a <em>narrower</em> one, or none at all — but never a broader or new checked exception.</p>
<pre><code>class Parent {
    void save() throws IOException { }
}

class Child extends Parent {
    void save() throws FileNotFoundException { }   // ✔ narrower (subclass of IOException)
}
class Child2 extends Parent {
    void save() { }                                 // ✔ none at all
}
class Child3 extends Parent {
    void save() throws Exception { }                // ✘ broader — does not compile
}
class Child4 extends Parent {
    void save() throws SQLException { }             // ✘ unrelated checked exception
}
class Child5 extends Parent {
    void save() throws RuntimeException { }         // ✔ UNCHECKED — always allowed
}</code></pre>
<p><strong>Why the rule exists — Liskov substitution.</strong> Code written against <code>Parent</code> handles <code>IOException</code>. If a subclass could throw <code>SQLException</code>, that caller would face an exception it never declared or handled, breaking the contract it compiled against.</p>
<p><strong>The related rules for overriding</strong>, worth listing together since they are often asked as one question: the return type must be the same or <em>covariant</em>; access cannot be <em>more</em> restrictive (public cannot become protected); the signature must match exactly; and <code>static</code>, <code>final</code> and <code>private</code> methods cannot be overridden at all.</p>`
},
{
  q: "What is the difference between fail-fast and fail-safe, with a code example?",
  level: "beginner", hot: true, tags: ["collections", "gotcha"],
  companies: ["TCS", "Cognizant", "HCL", "Capgemini", "Zoho"],
  a: `<pre><code>// FAIL-FAST — throws ConcurrentModificationException
List&lt;String&gt; list = new ArrayList&lt;&gt;(List.of("a", "b", "c"));
for (String s : list) {
    if (s.equals("b")) list.remove(s);       // CME on the next iteration
}

// FAIL-SAFE (weakly consistent) — iterates a snapshot, never throws
List&lt;String&gt; cow = new CopyOnWriteArrayList&lt;&gt;(List.of("a", "b", "c"));
for (String s : cow) {
    if (s.equals("b")) cow.remove(s);        // no exception; the loop sees the OLD snapshot
}

Map&lt;String,Integer&gt; chm = new ConcurrentHashMap&lt;&gt;(Map.of("a",1,"b",2));
for (var e : chm.entrySet()) chm.put("c", 3);  // safe — weakly consistent</code></pre>
<table>
<tr><th></th><th>Fail-fast</th><th>Fail-safe</th></tr>
<tr><td>Collections</td><td><code>ArrayList</code>, <code>HashMap</code>, <code>HashSet</code></td><td><code>CopyOnWriteArrayList</code>, <code>ConcurrentHashMap</code></td></tr>
<tr><td>Mechanism</td><td><code>modCount</code> compared on every <code>next()</code></td><td>Snapshot, or tolerates concurrent change</td></tr>
<tr><td>On modification</td><td>Throws <code>ConcurrentModificationException</code></td><td>Continues; may not see the newest data</td></tr>
<tr><td>Memory</td><td>No copy</td><td>May copy the whole array</td></tr>
</table>
<p><strong>The nuance interviewers reward:</strong> fail-fast is <em>best effort</em>, not a guarantee — removing the second-to-last element does not throw, because <code>hasNext()</code> returns false and the loop exits quietly. So never rely on CME to detect a bug; it is a debugging aid, not a contract.</p>`
},
{
  q: "Explain the difference between an abstract class with all abstract methods and an interface",
  level: "beginner", tags: ["oop", "design"],
  companies: ["Infosys", "TCS", "Tech Mahindra", "Accenture", "Nagarro"],
  a: `<p>Even when an abstract class contains only abstract methods, real differences remain:</p>
<table>
<tr><th></th><th>Abstract class (all abstract)</th><th>Interface</th></tr>
<tr><td>Inheritance</td><td>A class extends <strong>one</strong></td><td>A class implements <strong>many</strong></td></tr>
<tr><td>Constructor</td><td>Has one (called via <code>super()</code>)</td><td>None</td></tr>
<tr><td>Instance fields</td><td>Allowed</td><td>Only <code>public static final</code> constants</td></tr>
<tr><td>Member access</td><td>Any modifier, including <code>protected</code></td><td>Implicitly <code>public</code></td></tr>
<tr><td>State</td><td>Can hold it</td><td>Cannot</td></tr>
</table>
<pre><code>abstract class Shape {
    protected final String id;              // state
    protected Shape(String id) { this.id = id; }   // constructor enforcing an invariant
    abstract double area();
    protected void audit() { }              // non-public helper for subclasses
}

interface Drawable { void draw(); }         // a capability any type can adopt</code></pre>
<p><strong>The design answer:</strong> an abstract class expresses "is-a" with shared state and a controlled construction path; an interface expresses a <em>capability</em> that unrelated hierarchies can adopt. A <code>Circle</code> <em>is a</em> <code>Shape</code> but is also <code>Drawable</code>, <code>Serializable</code> and <code>Comparable</code> — only interfaces let you express all four.</p>
<p><strong>Since Java 8</strong> interfaces gained <code>default</code> and <code>static</code> methods, and <code>private</code> methods in Java 9 — so the "interfaces cannot have implementations" answer is outdated. The line that still holds absolutely is <strong>interfaces cannot hold instance state</strong>, which is exactly why the diamond problem stays resolvable.</p>`
},
{
  q: "What is the output of this inheritance and initialisation order puzzle?",
  level: "advanced", hot: true, tags: ["oop", "lifecycle"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "Morgan Stanley", "SAP"],
  a: `<pre><code>class Parent {
    static { System.out.println("1 parent static"); }
    { System.out.println("3 parent instance"); }
    Parent() {
        System.out.println("4 parent constructor");
        print();                                  // calls the OVERRIDDEN method
    }
    void print() { System.out.println("parent print"); }
}

class Child extends Parent {
    static { System.out.println("2 child static"); }
    { System.out.println("6 child instance"); }
    private int value = 42;
    Child() { super(); System.out.println("7 child constructor value=" + value); }
    @Override void print() { System.out.println("5 child print value=" + value); }
}

new Child();</code></pre>
<pre><code>1 parent static
2 child static
3 parent instance
4 parent constructor
5 child print value=0        &lt;-- NOT 42!
6 child instance
7 child constructor value=42</code></pre>
<p><strong>The order:</strong> static blocks run once at class initialisation, parent before child. Then for each instance: parent's instance initialisers → parent's constructor → child's instance initialisers and field initialisers → child's constructor.</p>
<p><strong>The bug this demonstrates</strong> is the important part: calling an <strong>overridable method from a constructor</strong>. <code>print()</code> dispatches to <code>Child.print()</code>, but <code>Child</code>'s fields have not been initialised yet, so <code>value</code> is still <code>0</code>. This is why Effective Java says never call an overridable method from a constructor — and it is a favourite senior-level question because the code looks perfectly reasonable.</p>`
},
{
  q: "How does try-with-resources handle multiple resources and suppressed exceptions?",
  level: "advanced", tags: ["exceptions", "best-practice"],
  companies: ["IBM", "Oracle", "JPMorgan", "Barclays", "Optum"],
  a: `<pre><code>try (var conn = dataSource.getConnection();
     var ps   = conn.prepareStatement(SQL);
     var rs   = ps.executeQuery()) {
    // ...
}   // CLOSED IN REVERSE ORDER: rs, then ps, then conn</code></pre>
<p><strong>Suppressed exceptions</strong> are what make this better than a hand-written <code>finally</code>:</p>
<pre><code>class Resource implements AutoCloseable {
    void work()  { throw new RuntimeException("work failed"); }
    public void close() { throw new RuntimeException("close failed"); }
}

try (Resource r = new Resource()) {
    r.work();
} catch (Exception e) {
    System.out.println(e.getMessage());              // "work failed"  &lt;- the PRIMARY cause
    for (Throwable s : e.getSuppressed()) {
        System.out.println("suppressed: " + s.getMessage());   // "close failed"
    }
}</code></pre>
<p><strong>Why this matters:</strong> with a manual <code>finally { r.close(); }</code>, an exception thrown by <code>close()</code> <em>replaces</em> the original one — so you lose the real cause and debug the wrong problem. try-with-resources keeps the primary exception and attaches the close failure as suppressed.</p>
<p><strong>Two more details worth knowing:</strong> since Java 9 you can use an existing <code>final</code> or effectively-final variable directly in the resource list (<code>try (existingResource) { }</code>), and the resource only needs to implement <code>AutoCloseable</code> — <code>Closeable</code> is the narrower, <code>IOException</code>-specific subinterface.</p>`
},
{
  q: "What is the difference between Comparable and Comparator with a real sorting requirement?",
  level: "beginner", hot: true, tags: ["sorting", "collections"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Publicis Sapient"],
  a: `<p><strong>Scenario they give you:</strong> sort employees by department ascending, then salary descending, then name — and also support a separate "sort by joining date" elsewhere.</p>
<pre><code>// Comparable — the ONE natural ordering, baked into the class
record Employee(String name, String dept, BigDecimal salary, LocalDate joined)
        implements Comparable&lt;Employee&gt; {
    @Override public int compareTo(Employee o) { return name.compareTo(o.name); }
}
Collections.sort(list);                    // uses compareTo

// Comparator — any number of alternative orderings, defined outside
Comparator&lt;Employee&gt; byDeptThenSalaryDesc = Comparator
        .comparing(Employee::dept)
        .thenComparing(Employee::salary, Comparator.reverseOrder())
        .thenComparing(Employee::name);

list.sort(byDeptThenSalaryDesc);
list.sort(Comparator.comparing(Employee::joined));    // a different ordering entirely</code></pre>
<table>
<tr><th></th><th>Comparable</th><th>Comparator</th></tr>
<tr><td>Package</td><td><code>java.lang</code></td><td><code>java.util</code></td></tr>
<tr><td>Method</td><td><code>compareTo(T)</code></td><td><code>compare(T, T)</code></td></tr>
<tr><td>Modifies the class</td><td>Yes</td><td>No</td></tr>
<tr><td>Count</td><td>One</td><td>Unlimited</td></tr>
</table>
<p><strong>The follow-up:</strong> "What if you cannot modify the class?" — then <code>Comparator</code> is your only option, which is exactly why it exists for third-party and JDK types.</p>
<p><strong>The contract trap:</strong> never implement <code>compare</code> as <code>a.value - b.value</code> — it overflows for large values and can violate transitivity. Use <code>Integer.compare(a, b)</code>. A comparator that returns inconsistent results throws <code>IllegalArgumentException: Comparison method violates its general contract!</code> from TimSort, usually only on large inputs in production.</p>`
}
]);
