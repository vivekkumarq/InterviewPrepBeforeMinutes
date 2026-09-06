appendTopic("java-basics", [
{
  q: "What is the difference between primitive and reference types?",
  level: "beginner", hot: true, tags: ["basics", "memory"],
  a: `<table>
<tr><th></th><th>Primitive</th><th>Reference</th></tr>
<tr><td>Stores</td><td>The actual value</td><td>An address pointing to a heap object</td></tr>
<tr><td>Location</td><td>Stack (locals) or inline in an object</td><td>Variable on the stack, object on the heap</td></tr>
<tr><td>Default</td><td><code>0</code>, <code>false</code>, <code>'\\u0000'</code></td><td><code>null</code></td></tr>
<tr><td>Can be null</td><td>No</td><td>Yes</td></tr>
<tr><td>Comparison</td><td><code>==</code> compares value</td><td><code>==</code> compares identity</td></tr>
</table>
<p>The eight primitives and their sizes: <code>byte</code> (8), <code>short</code> (16), <code>int</code> (32), <code>long</code> (64), <code>float</code> (32), <code>double</code> (64), <code>char</code> (16, unsigned), <code>boolean</code> (JVM-dependent, usually a byte in arrays).</p>
<p><strong>Why primitives still matter:</strong> an <code>int[1_000_000]</code> is 4 MB of contiguous memory; an <code>Integer[1_000_000]</code> is roughly 20 MB of pointers plus separate heap objects, with far worse cache behaviour. That is why <code>IntStream</code> exists and why boxing in a hot loop is a real performance problem.</p>
<p>Project Valhalla's value types aim to close this gap by letting you define types that behave like primitives — worth mentioning as the direction Java is heading.</p>`
},
{
  q: "Explain widening, narrowing and implicit type conversion",
  level: "beginner", tags: ["basics", "gotcha"],
  a: `<p><strong>Widening</strong> (smaller → larger) is implicit and safe: <code>byte → short → int → long → float → double</code>, and <code>char → int</code>.</p>
<p><strong>Narrowing</strong> requires an explicit cast and can silently lose data:</p>
<pre><code>int i = 130;
byte b = (byte) i;        // -126  — overflow wraps around
double d = 9.99;
int n = (int) d;          // 9     — truncates, does NOT round

long big = 10_000_000_000L;
int truncated = (int) big;  // 1410065408 — silently wrong</code></pre>
<p><strong>The trap interviewers love</strong> — integer division and promotion:</p>
<pre><code>System.out.println(5 / 2);          // 2    — integer division
System.out.println(5 / 2.0);        // 2.5  — one operand is double
System.out.println('a' + 1);        // 98   — char promoted to int
System.out.println((char)('a' + 1));// b

byte a = 10, c = 20;
byte sum = a + c;          // ✘ compile error: a + c is promoted to int
byte sum = (byte)(a + c);  // ✔</code></pre>
<p>The rule behind all of it: <strong>binary numeric promotion</strong> — any arithmetic on types narrower than <code>int</code> promotes both operands to <code>int</code> first.</p>`
},
{
  q: "Why should you use BigDecimal for money instead of double?",
  level: "beginner", hot: true, tags: ["basics", "production"],
  a: `<p><code>float</code> and <code>double</code> are binary floating point (IEEE 754). Most decimal fractions cannot be represented exactly in binary, so arithmetic accumulates error.</p>
<pre><code>System.out.println(0.1 + 0.2);            // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);     // false
System.out.println(1.03 - 0.42);          // 0.6100000000000001</code></pre>
<p>On a million transactions that error becomes a real accounting discrepancy, and a comparison that should be true is false.</p>
<pre><code>BigDecimal a = new BigDecimal("0.1");     // ALWAYS the String constructor
BigDecimal b = new BigDecimal("0.2");
a.add(b);                                  // exactly 0.3

// new BigDecimal(0.1) takes the DOUBLE — it inherits the error you were avoiding
new BigDecimal(0.1);   // 0.1000000000000000055511151231257827...

// Division REQUIRES a scale and rounding mode, or it throws on a repeating decimal
BigDecimal share = total.divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP);

// Compare with compareTo, not equals — equals also compares SCALE
new BigDecimal("1.0").equals(new BigDecimal("1.00"));      // false!
new BigDecimal("1.0").compareTo(new BigDecimal("1.00"));   // 0 — equal</code></pre>
<p><strong>The alternative worth naming:</strong> storing money as a <code>long</code> of minor units (paise, cents) is fast and exact, and is what many payment systems do. <code>BigDecimal</code> is the right default when you need arbitrary precision and explicit rounding rules.</p>`
},
{
  q: "What is the difference between an interface constant, enum and static final field?",
  level: "beginner", tags: ["basics", "design"],
  a: `<pre><code>// ✘ Constant interface — an anti-pattern (Effective Java, Item 22)
interface Config { int MAX = 10; }        // pollutes the API of every implementer

// ✔ Utility class or a static final on the owning class
public final class Config {
    private Config() {}                    // prevent instantiation
    public static final int MAX_RETRIES = 10;
}

// ✔✔ Enum — when the constant is one of a fixed set
public enum OrderStatus {
    PENDING("Awaiting payment", false),
    SHIPPED("On its way", false),
    DELIVERED("Delivered", true);

    private final String label;
    private final boolean terminal;

    OrderStatus(String label, boolean terminal) { this.label = label; this.terminal = terminal; }
    public String label()   { return label; }
    public boolean terminal(){ return terminal; }
}</code></pre>
<p><strong>Why enums beat <code>static final int</code> constants:</strong> they are type-safe (you cannot pass <code>7</code> where a status is expected), they can carry behaviour and fields, they work in <code>switch</code> with exhaustiveness checking, they give free <code>values()</code>, <code>name()</code> and <code>ordinal()</code>, they serialise safely, and <code>EnumMap</code>/<code>EnumSet</code> are extremely fast.</p>
<p>One caution: never persist <code>ordinal()</code> — reordering the enum silently corrupts stored data. Persist <code>name()</code> or an explicit code.</p>`
},
{
  q: "How does the switch statement work, and what changed with switch expressions?",
  level: "beginner", tags: ["basics", "modern-java"],
  a: `<pre><code>// Classic statement — fall-through is the default and the usual bug source
switch (status) {
    case PENDING:
        notify();
        // forgot break -> falls through to SHIPPED
    case SHIPPED:
        ship();
        break;
    default:
        log();
}

// Switch EXPRESSION (Java 14) — arrow form, no fall-through, returns a value
String label = switch (status) {
    case PENDING           -> "Awaiting payment";
    case SHIPPED, IN_TRANSIT -> "On its way";        // multiple labels
    case DELIVERED         -> {
        audit(status);
        yield "Delivered";                            // yield from a block
    }
};                                                    // note the semicolon

// Pattern matching for switch (Java 21)
String describe(Object o) {
    return switch (o) {
        case Integer i when i > 100 -> "large int";
        case Integer i              -> "int " + i;
        case String s               -> "string of length " + s.length();
        case null                   -> "null";
        default                     -> "other";
    };
}</code></pre>
<p><strong>Why the expression form is better:</strong> no accidental fall-through, it is exhaustive (over an enum or sealed type the compiler <em>requires</em> every case, so adding a constant breaks the build instead of silently hitting <code>default</code>), and it returns a value so the variable can be <code>final</code>.</p>
<p>Switch supports <code>byte</code>, <code>short</code>, <code>char</code>, <code>int</code>, their wrappers, <code>String</code>, enums, and — since 21 — any type via patterns. A <code>String</code> switch compiles to a <code>hashCode</code> lookup plus an equals check, so it is O(1), not a chain of comparisons.</p>`
},
{
  q: "What are varargs and what are the pitfalls?",
  level: "advanced", tags: ["basics", "gotcha"],
  a: `<pre><code>public static int sum(int... numbers) {     // numbers is an int[]
    int total = 0;
    for (int n : numbers) total += n;
    return total;
}
sum();            // 0  — an empty array, not null
sum(1, 2, 3);
sum(new int[]{1, 2, 3});   // also valid</code></pre>
<p><strong>Rules:</strong> at most one varargs parameter, and it must be last.</p>
<p><strong>Pitfalls:</strong></p>
<ul>
<li><strong>Ambiguous overloads.</strong> The compiler prefers a fixed-arity method over a varargs one, and widening over boxing. <code>f(1, 2)</code> with both <code>f(int, int)</code> and <code>f(int...)</code> calls the fixed one.</li>
<li><strong>Passing <code>null</code></strong> — <code>sum(null)</code> passes a null <em>array</em>, not a single null element, and NPEs on iteration.</li>
<li><strong>Generic varargs are unsafe</strong> — you cannot create a generic array, so the compiler warns about heap pollution. Annotate with <code>@SafeVarargs</code> only when you genuinely never write to the array.</li>
<li><strong>Allocation cost</strong> — every call allocates an array. In a hot path, provide fixed-arity overloads for the common cases, which is exactly what the JDK does for <code>List.of()</code> (overloads up to 10 elements, then varargs).</li>
</ul>`
},
{
  q: "What is the difference between an Error, Exception and RuntimeException in practice?",
  level: "beginner", tags: ["exceptions"],
  a: `<ul>
<li><strong><code>Error</code></strong> — the JVM is in trouble: <code>OutOfMemoryError</code>, <code>StackOverflowError</code>, <code>NoClassDefFoundError</code>. You cannot meaningfully recover. Do not catch — except at a top-level boundary purely to log before dying.</li>
<li><strong>Checked <code>Exception</code></strong> — an expected, recoverable external condition: <code>IOException</code>, <code>SQLException</code>. The caller can plausibly act on it (retry, use a fallback, ask the user).</li>
<li><strong><code>RuntimeException</code></strong> — a programming error: <code>NullPointerException</code>, <code>IllegalArgumentException</code>, <code>IllegalStateException</code>, <code>IndexOutOfBoundsException</code>. The fix is a code change, not a catch block.</li>
</ul>
<pre><code>// Good practice at a service boundary
try {
    return client.fetch(id);
} catch (IOException e) {                       // expected: wrap with context
    throw new CustomerLookupException("customer " + id + " lookup failed", e);
} catch (RuntimeException e) {                  // programming error: let it surface
    throw e;
}</code></pre>
<p><strong>The judgement worth expressing:</strong> most modern APIs (Spring, Hibernate) favour unchecked exceptions, because checked ones force every intermediate layer to either handle or declare them, which pollutes signatures and leads to the worst outcome of all — <code>catch (Exception e) {}</code>. Use checked exceptions sparingly, for genuinely recoverable conditions at a boundary.</p>`
},
{
  q: "What is an immutable object and why are String, Integer and LocalDate immutable?",
  level: "beginner", tags: ["basics", "design"],
  a: `<p>An immutable object's state cannot change after construction. The JDK made its most widely shared types immutable for four reasons:</p>
<ol>
<li><strong>Thread safety with no synchronisation</strong> — no writes means no races. An immutable object can be shared freely across threads.</li>
<li><strong>Safe caching and interning</strong> — the String pool and the <code>Integer</code> cache (−128..127) only work because the shared instances cannot be mutated by one holder.</li>
<li><strong>Safe as map keys</strong> — the hash cannot change, so the entry never becomes unreachable.</li>
<li><strong>Simpler reasoning</strong> — once you have validated the value it stays valid; no defensive copying by callers, no action-at-a-distance bugs.</li>
</ol>
<p><strong>The cost:</strong> every "change" allocates. That is why <code>StringBuilder</code> exists for repeated concatenation, and why <code>java.time</code> operations return new instances.</p>
<pre><code>LocalDate d = LocalDate.of(2026, 9, 6);
d.plusDays(1);              // result DISCARDED — a common bug
d = d.plusDays(1);          // correct

String s = "hello";
s.toUpperCase();            // same mistake
s = s.toUpperCase();</code></pre>
<p>The old <code>Date</code>/<code>Calendar</code> API being mutable — and <code>SimpleDateFormat</code> not being thread-safe as a result — is the clearest cautionary tale in the JDK.</p>`
},
{
  q: "What is the difference between shallow and deep comparison, and how do you compare arrays?",
  level: "advanced", tags: ["basics", "gotcha"],
  a: `<pre><code>int[] a = {1, 2, 3};
int[] b = {1, 2, 3};

a == b                      // false — different objects
a.equals(b)                 // false — arrays inherit Object.equals (identity)
Arrays.equals(a, b)         // true  — element-wise

String[][] x = {{"a"},{"b"}};
String[][] y = {{"a"},{"b"}};
Arrays.equals(x, y)         // false — compares inner arrays by identity
Arrays.deepEquals(x, y)     // true

Arrays.toString(a)          // [1, 2, 3]
Arrays.deepToString(x)      // [[a], [b]]
Arrays.hashCode(a) / Arrays.deepHashCode(x)
Arrays.compare(a, b)        // Java 9 — lexicographic ordering
Arrays.mismatch(a, b)       // Java 9 — index of first difference, or -1</code></pre>
<p><strong>Why arrays behave this way:</strong> arrays are objects but do not override <code>equals</code>, <code>hashCode</code> or <code>toString</code>, so they use <code>Object</code>'s identity-based versions. Printing an array directly gives you <code>[I@1b6d3586</code> — the type descriptor and identity hash.</p>
<p><strong>The practical consequence:</strong> never use an array as a <code>HashMap</code> key or put arrays in a <code>HashSet</code> expecting value semantics — use <code>List.of(...)</code>, a record, or wrap the array. This also catches people out when comparing <code>byte[]</code> hashes or tokens; use <code>Arrays.equals</code>, or <code>MessageDigest.isEqual</code> for constant-time comparison of secrets.</p>`
},
{
  q: "What are annotations and how do you write a custom one?",
  level: "advanced", tags: ["annotations"],
  a: `<p>Annotations attach metadata to code, read at compile time by processors or at runtime by reflection.</p>
<pre><code>@Target({ElementType.METHOD, ElementType.TYPE})   // where it may be applied
@Retention(RetentionPolicy.RUNTIME)               // SOURCE | CLASS | RUNTIME
@Inherited                                        // subclasses inherit it
@Documented
public @interface Auditable {
    String action();                              // no default -> required
    Severity level() default Severity.INFO;
    String[] tags() default {};
}

@Auditable(action = "DELETE_CUSTOMER", level = Severity.HIGH)
public void deleteCustomer(Long id) { ... }

// Read at runtime
Auditable a = method.getAnnotation(Auditable.class);
if (a != null) audit.record(a.action(), a.level());</code></pre>
<table>
<tr><th>Retention</th><th>Available</th><th>Example</th></tr>
<tr><td><code>SOURCE</code></td><td>Discarded after compilation</td><td><code>@Override</code>, Lombok</td></tr>
<tr><td><code>CLASS</code></td><td>In the .class file, not at runtime</td><td>Bytecode tools</td></tr>
<tr><td><code>RUNTIME</code></td><td>Readable by reflection</td><td>Spring, JPA, Jackson, JUnit</td></tr>
</table>
<p><strong>Built-in ones worth knowing:</strong> <code>@Override</code> (catches signature typos — always use it), <code>@Deprecated(since, forRemoval)</code>, <code>@SuppressWarnings</code>, <code>@FunctionalInterface</code>, <code>@SafeVarargs</code>.</p>
<p>An annotation alone does nothing — something must <em>read</em> it. That is the point interviewers probe: Spring's <code>@Transactional</code> works because a <code>BeanPostProcessor</code> finds it and wraps the bean in a proxy, not because the annotation itself has behaviour.</p>`
},
{
  q: "What is reflection, when is it useful, and what does it cost?",
  level: "advanced", hot: true, tags: ["reflection"],
  a: `<p>Reflection lets code inspect and invoke classes, methods and fields at runtime by name, without compile-time knowledge of them.</p>
<pre><code>Class&lt;?&gt; clazz = Class.forName("com.acme.OrderService");
Object instance = clazz.getDeclaredConstructor().newInstance();

Method m = clazz.getDeclaredMethod("process", Order.class);
m.setAccessible(true);                    // bypass private
Object result = m.invoke(instance, order);

for (Field f : clazz.getDeclaredFields()) {
    if (f.isAnnotationPresent(Inject.class)) { ... }
}</code></pre>
<p><strong>Where it is essential:</strong> every framework you use. Spring's dependency injection, JPA/Hibernate entity mapping, Jackson serialisation, JUnit test discovery, mocking libraries and ORMs are all built on it — they must work with classes that did not exist when they were compiled.</p>
<p><strong>The costs, which is what the question is really about:</strong></p>
<ul>
<li><strong>Performance</strong> — reflective invocation is slower than a direct call, and it blocks JIT optimisations like inlining. Frameworks mitigate this by caching <code>Method</code> objects, or by generating bytecode instead.</li>
<li><strong>No compile-time safety</strong> — a renamed method becomes a runtime failure, and refactoring tools cannot see string-based lookups.</li>
<li><strong>Breaks encapsulation</strong> — <code>setAccessible(true)</code> defeats <code>private</code>. Since Java 9's module system and the strong encapsulation enforced in 16+, reflecting into JDK internals now requires explicit <code>--add-opens</code>.</li>
<li><strong>Hostile to GraalVM native image</strong> — anything reflective must be declared in configuration, which is the main friction when compiling a Spring app natively.</li>
</ul>
<p><strong>Modern alternatives:</strong> <code>MethodHandle</code>/<code>VarHandle</code> (faster, JIT-friendly), annotation processors that generate code at compile time (MapStruct, Dagger), and Spring's AOT processing — all trading runtime flexibility for speed and safety.</p>`
},
{
  q: "Explain the Object class methods every Java developer should know",
  level: "beginner", tags: ["basics"],
  a: `<table>
<tr><th>Method</th><th>Purpose</th><th>Contract</th></tr>
<tr><td><code>equals(Object)</code></td><td>Logical equality</td><td>Reflexive, symmetric, transitive, consistent; <code>x.equals(null)</code> is false</td></tr>
<tr><td><code>hashCode()</code></td><td>Hash bucket</td><td>Equal objects <strong>must</strong> have equal hashes</td></tr>
<tr><td><code>toString()</code></td><td>Readable representation</td><td>Override it — the default is useless in logs</td></tr>
<tr><td><code>getClass()</code></td><td>Runtime type</td><td><code>final</code></td></tr>
<tr><td><code>clone()</code></td><td>Shallow copy</td><td>Protected; broken contract — prefer a copy constructor</td></tr>
<tr><td><code>wait/notify/notifyAll</code></td><td>Monitor coordination</td><td>Must hold the lock; use in a <code>while</code> loop</td></tr>
<tr><td><code>finalize()</code></td><td>—</td><td>Removed. Use <code>try-with-resources</code> or <code>Cleaner</code></td></tr>
</table>
<p><strong>A practical <code>toString()</code> matters more than people think</strong> — it is what appears in every log line and exception message during an incident:</p>
<pre><code>@Override public String toString() {
    return "Order{id=" + id + ", status=" + status + ", total=" + total + "}";
}
// Never include secrets, tokens or full PII — toString output ends up in logs.</code></pre>
<p>Records generate all three of <code>equals</code>, <code>hashCode</code> and <code>toString</code> correctly, which is a strong reason to use them for value types. For entities, be careful: Lombok's <code>@Data</code> on a JPA entity generates a <code>toString</code> that triggers lazy loading and can recurse forever across a bidirectional relationship.</p>`
}
]);
