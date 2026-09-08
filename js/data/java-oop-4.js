appendTopic("java-oop", [
{
  q: "Why must you override hashCode whenever you override equals?",
  level: "beginner", hot: true, tags: ["equals", "collections", "gotcha"],
  companies: ["TCS", "Infosys", "Amazon", "Oracle", "Wipro", "Cognizant", "SAP", "Zoho"],
  a: `<pre><code>class User {
    private final String email;
    // equals overridden, hashCode NOT overridden — the classic bug
    @Override public boolean equals(Object o) {
        return o instanceof User u &amp;&amp; email.equals(u.email);
    }
}

Set&lt;User&gt; set = new HashSet&lt;&gt;();
set.add(new User("a@x.com"));
set.contains(new User("a@x.com"));   // FALSE
set.add(new User("a@x.com"));        // adds a DUPLICATE
// Two equal objects landed in different buckets, so the set never compared them.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Two equal objects landing in different hash buckets">
  <rect class="dg-fill" x="16" y="30" width="120" height="34" rx="6"/><text class="dg-s" x="76" y="52" text-anchor="middle">User("a@x.com")</text>
  <rect class="dg-fill" x="16" y="98" width="120" height="34" rx="6"/><text class="dg-s" x="76" y="120" text-anchor="middle">User("a@x.com")</text>
  <path class="dg-line" d="M140 46 H220" marker-end="url(#hc1)"/>
  <path class="dg-line" d="M140 114 H220" marker-end="url(#hc1)"/>
  <text class="dg-s" x="180" y="38" text-anchor="middle">hash 7231</text>
  <text class="dg-s" x="180" y="106" text-anchor="middle">hash 9902</text>
  <rect class="dg-box" x="226" y="24" width="150" height="34" rx="6"/><text class="dg-s" x="301" y="46" text-anchor="middle">bucket 3</text>
  <rect class="dg-box" x="226" y="96" width="150" height="34" rx="6"/><text class="dg-s" x="301" y="118" text-anchor="middle">bucket 11</text>
  <text class="dg-s" x="400" y="56">different buckets → equals() is</text>
  <text class="dg-s" x="400" y="78">never even called → the Set holds</text>
  <text class="dg-s" x="400" y="100">two objects it believes are distinct</text>
  <text class="dg-s" x="16" y="158">HashMap checks the bucket FIRST; equals only decides between collisions inside it</text>
  <defs><marker id="hc1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The contract, stated exactly:</strong></p>
<ol>
<li>If <code>a.equals(b)</code> then <code>a.hashCode() == b.hashCode()</code> — <strong>mandatory</strong>.</li>
<li>The reverse is <em>not</em> required: unequal objects may share a hash code. That is a collision, and it is fine.</li>
<li><code>equals</code> must be reflexive, symmetric, transitive, consistent, and <code>x.equals(null)</code> must be false.</li>
</ol>
<pre><code>// ✔ Correct, modern
@Override public boolean equals(Object o) {
    if (this == o) return true;                      // fast path
    if (!(o instanceof User u)) return false;        // pattern matching, null-safe
    return Objects.equals(email, u.email);
}
@Override public int hashCode() { return Objects.hash(email); }

// ✔ Even better — a record gives you both, correctly, for free
record User(String email, String name) { }</code></pre>
<table>
<tr><th>Mistake</th><th>Effect</th></tr>
<tr><td><code>equals(User o)</code> instead of <code>equals(Object o)</code></td><td>It <strong>overloads</strong> rather than overrides — collections never call it. Always add <code>@Override</code>.</td></tr>
<tr><td>Using a <strong>mutable</strong> field in <code>hashCode</code></td><td>Change the field after insertion and the object is lost in its old bucket — <code>contains</code> returns false for an object that is in the set</td></tr>
<tr><td>Using <code>getClass()</code> vs <code>instanceof</code></td><td><code>getClass()</code> breaks symmetry with subclasses; <code>instanceof</code> can break transitivity. There is no perfect answer for inheritable classes — which is an argument for records and final classes.</td></tr>
<tr><td>Returning a constant from <code>hashCode</code></td><td>Technically legal, but every entry collides and the map degrades to a list</td></tr>
</table>
<p><strong>The mutable-key trap is the strongest thing to raise unprompted:</strong> keys in a <code>HashMap</code> should be immutable. Mutating a field used in <code>hashCode</code> after insertion strands the entry — it is in the map, but no lookup will ever find it, and it is not garbage collected either. That is a genuine memory leak with no visible cause.</p>`
},
{
  q: "Abstract class or interface — how do you choose, and what changed in Java 8+?",
  level: "beginner", hot: true, tags: ["oop", "design", "modern-java"],
  companies: ["TCS", "Infosys", "Wipro", "Amazon", "Cognizant", "Accenture", "Oracle", "SAP"],
  a: `<table>
<tr><th></th><th>Abstract class</th><th>Interface</th></tr>
<tr><td>Multiple inheritance</td><td>No — one superclass only</td><td><strong>Yes</strong> — implement many</td></tr>
<tr><td>Instance fields / state</td><td><strong>Yes</strong></td><td>No — only <code>public static final</code> constants</td></tr>
<tr><td>Constructors</td><td>Yes</td><td>No</td></tr>
<tr><td>Method bodies</td><td>Yes</td><td>Yes, since Java 8 (<code>default</code>, <code>static</code>); <code>private</code> since 9</td></tr>
<tr><td>Access modifiers</td><td>Any</td><td>Public (and private helpers since 9)</td></tr>
<tr><td>Models</td><td>"IS-A" with shared implementation</td><td>"CAN-DO" — a capability</td></tr>
</table>
<pre><code>// Interface — a capability, and a default that new implementers inherit for free
public interface Payable {
    Money amount();                                    // abstract

    default Money withTax(BigDecimal rate) {           // Java 8 — added without
        return amount().multiply(BigDecimal.ONE.add(rate));   // breaking implementers
    }
    static Payable zero() { return () -&gt; Money.ZERO; } // Java 8 — factory on the type
    private Money half() { return amount().divide(2); } // Java 9 — shared helper
}

// Abstract class — shared STATE plus a template method
public abstract class Report {
    protected final Clock clock;                       // state: interfaces cannot do this
    protected Report(Clock clock) { this.clock = clock; }

    public final String render() {                     // TEMPLATE METHOD, final on purpose
        return header() + body() + footer();
    }
    protected String header() { return "Generated " + clock.instant(); }
    protected abstract String body();                  // subclasses must supply this
    protected String footer() { return ""; }
}</code></pre>
<p><strong>Why <code>default</code> methods were added</strong> — the real answer is API evolution: Java 8 needed to add <code>stream()</code> and <code>forEach()</code> to <code>Collection</code>, and adding an abstract method to an interface would have broken every implementation in existence. Defaults let an interface grow without breaking source or binary compatibility.</p>
<pre><code>// The diamond problem, and how Java resolves it
interface A { default String hi() { return "A"; } }
interface B { default String hi() { return "B"; } }

class C implements A, B {
    // COMPILE ERROR unless you override — Java refuses to guess
    @Override public String hi() { return A.super.hi(); }   // explicit qualification
}
// Rules: a CLASS method always beats an interface default; a more specific
// interface beats a less specific one; otherwise you must choose explicitly.</code></pre>
<table>
<tr><th>Choose</th><th>When</th></tr>
<tr><td><strong>Interface</strong></td><td>Defining a contract, needing multiple inheritance, wanting a lambda target, or writing to something you do not own</td></tr>
<tr><td><strong>Abstract class</strong></td><td>Sharing state or constructor logic, or fixing an algorithm's skeleton while letting subclasses fill in steps</td></tr>
<tr><td><strong>Both</strong></td><td>Common in libraries: <code>List</code> (contract) + <code>AbstractList</code> (skeleton) so implementers only write a few methods</td></tr>
<tr><td><strong>Neither — composition</strong></td><td>Usually the better default. "Favour composition over inheritance" exists because inheritance couples you to a superclass you do not control.</td></tr>
</table>
<p><strong>The modern additions worth naming:</strong> <code>sealed</code> interfaces (Java 17) let you enumerate the permitted implementations, which gives exhaustive <code>switch</code> pattern matching — the closest Java has to an algebraic data type. And a <code>@FunctionalInterface</code> with a single abstract method can be implemented by a lambda, which is why <code>Comparator</code> and <code>Runnable</code> are interfaces rather than abstract classes.</p>`
},
{
  q: "What is composition over inheritance, and when does inheritance genuinely break?",
  level: "advanced", hot: true, tags: ["oop", "design", "best-practice"],
  companies: ["Amazon", "Google", "SAP", "ThoughtWorks", "Oracle", "Optum", "EPAM"],
  a: `<pre><code>// ✗ The canonical failure — inheritance leaking implementation details
public class CountingSet&lt;E&gt; extends HashSet&lt;E&gt; {
    private int addCount = 0;

    @Override public boolean add(E e) { addCount++; return super.add(e); }
    @Override public boolean addAll(Collection&lt;? extends E&gt; c) {
        addCount += c.size();
        return super.addAll(c);          // BUG: addAll internally calls add()
    }                                     // so every element is counted TWICE
    public int getAddCount() { return addCount; }
}
new CountingSet&lt;&gt;().addAll(List.of("a","b","c"));   // getAddCount() == 6, not 3</code></pre>
<p>The subclass is broken by an implementation detail of the superclass that is not part of its documented contract — and a future version of <code>HashSet</code> could change it again. This is the fragile base class problem.</p>
<pre><code>// ✔ COMPOSITION — the subclass owns a Set instead of being one
public class CountingSet&lt;E&gt; implements Set&lt;E&gt; {
    private final Set&lt;E&gt; delegate;
    private int addCount = 0;

    public CountingSet(Set&lt;E&gt; delegate) { this.delegate = delegate; }

    @Override public boolean add(E e) { addCount++; return delegate.add(e); }
    @Override public boolean addAll(Collection&lt;? extends E&gt; c) {
        addCount += c.size();
        return delegate.addAll(c);       // correct: delegate.add is not OUR add
    }
    // ... remaining methods delegate straight through
}
// Now it works with ANY Set implementation, and no internal call pattern can break it.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Inheritance coupling versus composition delegation">
  <text class="dg-t" x="16" y="22">inheritance</text>
  <rect class="dg-box" x="16" y="32" width="130" height="32" rx="6"/><text class="dg-s" x="81" y="52" text-anchor="middle">HashSet</text>
  <rect class="dg-fill" x="16" y="92" width="130" height="32" rx="6"/><text class="dg-s" x="81" y="112" text-anchor="middle">CountingSet</text>
  <path class="dg-line" d="M81 92 V68" marker-end="url(#ci2)"/>
  <text class="dg-s" x="160" y="82">inherits EVERYTHING,</text>
  <text class="dg-s" x="160" y="102">including internals</text>
  <text class="dg-t" x="350" y="22">composition</text>
  <rect class="dg-fill" x="350" y="62" width="118" height="32" rx="6"/><text class="dg-s" x="409" y="82" text-anchor="middle">CountingSet</text>
  <path class="dg-line" d="M472 78 H522" marker-end="url(#ci2)"/>
  <rect class="dg-box" x="526" y="62" width="80" height="32" rx="6"/><text class="dg-s" x="566" y="82" text-anchor="middle">Set</text>
  <text class="dg-s" x="350" y="118">delegates through the PUBLIC interface only</text>
  <text class="dg-s" x="16" y="148">inheritance is compile-time and permanent; composition is runtime and swappable</text>
  <defs><marker id="ci2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Inheritance</th><th>Composition</th></tr>
<tr><td>Fixed at compile time</td><td>Swappable at runtime</td></tr>
<tr><td>Exposes the whole superclass API</td><td>You expose only what you choose</td></tr>
<tr><td>Breaks when the superclass changes internally</td><td>Depends only on the public contract</td></tr>
<tr><td>One parent</td><td>Any number of collaborators</td></tr>
<tr><td>Harder to test — the parent comes along</td><td>Inject a fake collaborator</td></tr>
</table>
<p><strong>The Liskov test for when inheritance <em>is</em> right:</strong> a subclass must be usable anywhere the superclass is, without the caller noticing. The classic violation is <code>Square extends Rectangle</code> — <code>setWidth(5); setHeight(4);</code> then asserting area is 20 fails for a square, so a square is not substitutable for a rectangle even though it is one mathematically.</p>
<p><strong>What to say:</strong> "I use inheritance when there is a genuine IS-A relationship <em>and</em> the base class was designed for extension — documented, with <code>protected</code> hooks, as in Spring's <code>AbstractController</code>. Otherwise I compose. Effective Java's rule is 'design for inheritance or prohibit it', which is why I make classes <code>final</code> by default and open them deliberately."</p>`
},
{
  q: "Explain method overloading versus overriding, and the rules Java uses to resolve them",
  level: "beginner", hot: true, tags: ["oop", "polymorphism", "gotcha"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Capgemini", "Accenture", "Oracle", "HCL"],
  a: `<table>
<tr><th></th><th>Overloading</th><th>Overriding</th></tr>
<tr><td>Where</td><td>Same class (or inherited)</td><td>Subclass</td></tr>
<tr><td>Signature</td><td>Same name, <strong>different parameters</strong></td><td><strong>Identical</strong> signature</td></tr>
<tr><td>Return type</td><td>May differ</td><td>Same, or covariant (a subtype)</td></tr>
<tr><td>Resolved</td><td><strong>Compile time</strong> — static binding, by the declared type</td><td><strong>Runtime</strong> — dynamic dispatch, by the actual object</td></tr>
<tr><td>Access</td><td>Anything</td><td>Cannot be more restrictive</td></tr>
<tr><td>Exceptions</td><td>Anything</td><td>No new or broader <em>checked</em> exceptions</td></tr>
<tr><td><code>static</code> / <code>private</code> / <code>final</code></td><td>Can be overloaded</td><td><strong>Cannot</strong> be overridden</td></tr>
</table>
<pre><code>// THE CLASSIC TRICK QUESTION
class Parent { void show() { System.out.println("Parent"); } }
class Child extends Parent { @Override void show() { System.out.println("Child"); } }

Parent p = new Child();
p.show();          // "Child"  — OVERRIDING is resolved at RUNTIME

// Now the overloading version
class Test {
    static void print(Parent p) { System.out.println("parent overload"); }
    static void print(Child c)  { System.out.println("child overload"); }
}
Parent p = new Child();
Test.print(p);     // "parent overload" — OVERLOADING uses the DECLARED type</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Static binding for overloading versus dynamic dispatch for overriding">
  <rect class="dg-fill" x="16" y="30" width="180" height="40" rx="8"/>
  <text class="dg-s" x="106" y="55" text-anchor="middle">overloading → compile time</text>
  <text class="dg-s" x="106" y="92" text-anchor="middle">picks by the DECLARED type</text>
  <rect class="dg-fill2" x="330" y="30" width="180" height="40" rx="8"/>
  <text class="dg-s" x="420" y="55" text-anchor="middle">overriding → runtime</text>
  <text class="dg-s" x="420" y="92" text-anchor="middle">picks by the ACTUAL object</text>
  <text class="dg-s" x="16" y="134">this is why a Parent-typed variable holding a Child gets the Child's override</text>
  <text class="dg-s" x="16" y="146"> </text>
</svg>
</figure>
<pre><code>// Overload resolution order — the compiler tries these in sequence
void f(long x);        // 1. widening primitive
void f(Integer x);     // 2. boxing
void f(Object... x);   // 3. varargs (always LAST resort)

f(5);   // an int → picks f(long). Widening beats boxing, boxing beats varargs.

// Ambiguity the compiler rejects
void g(Integer i); void g(Long l);
g(5);   // ERROR: int boxes only to Integer... actually fine.
void h(Object o); void h(String s);
h(null);  // picks h(String) — the MOST SPECIFIC applicable overload

// Static methods are HIDDEN, not overridden
class A { static void s() { System.out.println("A"); } }
class B extends A { static void s() { System.out.println("B"); } }
A a = new B();
a.s();   // "A" — static calls bind to the declared type. Call it as A.s() instead.</code></pre>
<table>
<tr><th>Trap</th><th>Result</th></tr>
<tr><td>Overloading <code>equals(MyType o)</code></td><td>Does not override <code>equals(Object)</code> — collections ignore it entirely</td></tr>
<tr><td>Overriding with a weaker access modifier</td><td>Compile error</td></tr>
<tr><td>Overriding and adding a checked exception</td><td>Compile error</td></tr>
<tr><td>Calling an overridable method from a constructor</td><td>The subclass override runs <em>before</em> its fields are initialised — a real and nasty bug</td></tr>
<tr><td>Omitting <code>@Override</code></td><td>A typo silently becomes an overload instead of a compile error</td></tr>
</table>
<p><strong>The one habit that prevents most of these:</strong> always write <code>@Override</code>. It is not decoration — it makes the compiler verify that you are actually overriding something, and it catches the <code>equals</code> and typo cases immediately instead of at runtime.</p>`
}
]);
