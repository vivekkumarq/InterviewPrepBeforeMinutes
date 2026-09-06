registerTopic("java-oop", [
{
  q: "What are the four pillars of OOP? Give a one-line real example of each.",
  level: "beginner", hot: true, tags: ["oop", "fundamentals"],
  a: `<ol>
<li><strong>Encapsulation</strong> — bundle data with the methods that operate on it and hide the internals. <em>Example:</em> a <code>BankAccount</code> with a private balance and a <code>withdraw()</code> that validates before mutating.</li>
<li><strong>Abstraction</strong> — expose <em>what</em> something does, hide <em>how</em>. <em>Example:</em> <code>PaymentGateway.charge()</code> — the caller does not know whether it is Stripe or Razorpay underneath.</li>
<li><strong>Inheritance</strong> — reuse and specialise. <em>Example:</em> <code>SavingsAccount extends Account</code>.</li>
<li><strong>Polymorphism</strong> — one interface, many runtime behaviours. <em>Example:</em> <code>List&lt;Shape&gt;</code> where each <code>draw()</code> dispatches to the concrete type.</li>
</ol>
<blockquote><p><strong>Interviewer's real test:</strong> they want your own example from work, not the animal/dog textbook one. Have one ready from your codebase.</p></blockquote>`
},
{
  q: "Encapsulation vs abstraction — they sound the same, what is the difference?",
  level: "beginner", hot: true, tags: ["oop"],
  a: `<table>
<tr><th></th><th>Abstraction</th><th>Encapsulation</th></tr>
<tr><td>Concern</td><td>Design — <em>what</em> to expose</td><td>Implementation — <em>how</em> to protect it</td></tr>
<tr><td>Solves</td><td>Complexity</td><td>Data integrity</td></tr>
<tr><td>Achieved with</td><td>Interfaces, abstract classes</td><td>Private fields + accessors, packages, modules</td></tr>
<tr><td>Stage</td><td>Design time</td><td>Compile/run time</td></tr>
</table>
<p>One-liner: <strong>abstraction hides complexity, encapsulation hides data.</strong> You can have encapsulation without abstraction (a concrete class with private fields) and abstraction without encapsulation (an interface over a class with public fields — badly written, but possible).</p>`
},
{
  q: "Method overloading vs overriding",
  level: "beginner", hot: true, tags: ["oop", "polymorphism"],
  a: `<table>
<tr><th></th><th>Overloading</th><th>Overriding</th></tr>
<tr><td>Also called</td><td>Compile-time / static polymorphism</td><td>Runtime / dynamic polymorphism</td></tr>
<tr><td>Where</td><td>Same class (or inherited)</td><td>Subclass redefines parent method</td></tr>
<tr><td>Signature</td><td>Must differ in parameters</td><td>Must be identical</td></tr>
<tr><td>Return type</td><td>Can differ freely</td><td>Same or covariant (subtype)</td></tr>
<tr><td>Access</td><td>Any</td><td>Cannot be more restrictive</td></tr>
<tr><td>Exceptions</td><td>Any</td><td>No new or broader <em>checked</em> exceptions</td></tr>
<tr><td>Resolved</td><td>By the compiler, from the declared type</td><td>By the JVM, from the actual object</td></tr>
</table>
<pre><code>class Parent { Object get() { return "p"; } }
class Child extends Parent {
    @Override String get() { return "c"; }   // covariant return: legal
}
Parent p = new Child();
p.get();   // "c"  -> runtime dispatch</code></pre>`
},
{
  q: "What is dynamic method dispatch and how does the JVM implement it?",
  level: "advanced", tags: ["polymorphism", "jvm"],
  a: `<p>Dynamic dispatch is choosing the overridden implementation based on the <em>runtime</em> type of the object, not the declared type.</p>
<p>The JVM implements it with a <strong>virtual method table (vtable)</strong> per class: an array of method pointers where each overriding method occupies the same slot as the parent's version. <code>invokevirtual</code> looks up the slot on the object's klass pointer — O(1), no searching. Interface calls use <code>invokeinterface</code> with an itable, which is slightly slower.</p>
<p>The JIT then optimises further:</p>
<ul>
<li><strong>Monomorphic inline caching</strong> — if only one type is ever seen at a call site, the call is inlined with a guard.</li>
<li><strong>Class hierarchy analysis</strong> — if only one implementation is currently loaded, the JIT devirtualises and can deoptimise later if a second class loads.</li>
</ul>
<p>This is why "interfaces are slow" is a myth in modern HotSpot for typical single-implementation code.</p>`
},
{
  q: "Explain each SOLID principle with a concrete violation and fix",
  level: "advanced", hot: true, tags: ["solid", "design"],
  a: `<ul>
<li><strong>S — Single Responsibility.</strong> A class has one reason to change. <em>Violation:</em> <code>UserService</code> that validates, saves to DB and sends the welcome email. <em>Fix:</em> split into <code>UserValidator</code>, <code>UserRepository</code>, <code>NotificationService</code>.</li>
<li><strong>O — Open/Closed.</strong> Open for extension, closed for modification. <em>Violation:</em> a <code>switch</code> on payment type that you edit for every new provider. <em>Fix:</em> a <code>PaymentProcessor</code> interface plus a strategy map; new provider = new class only.</li>
<li><strong>L — Liskov Substitution.</strong> A subtype must be usable wherever the parent is. <em>Violation:</em> <code>Square extends Rectangle</code> where <code>setWidth</code> also changes height, breaking callers' assumptions. <em>Fix:</em> compose, or model both under an immutable <code>Shape</code>.</li>
<li><strong>I — Interface Segregation.</strong> No client should depend on methods it does not use. <em>Violation:</em> a fat <code>Repository</code> interface where read-only consumers must stub <code>delete()</code>. <em>Fix:</em> split into <code>ReadRepository</code> and <code>WriteRepository</code>.</li>
<li><strong>D — Dependency Inversion.</strong> Depend on abstractions, not concretions. <em>Violation:</em> <code>OrderService</code> doing <code>new MySqlOrderDao()</code>. <em>Fix:</em> inject an <code>OrderRepository</code> interface — which is literally what Spring's constructor injection gives you.</li>
</ul>
<pre><code>// Open/Closed with a strategy map — the Spring-idiomatic version
public interface PaymentProcessor {
    PaymentType type();
    Receipt charge(Order order);
}

@Service
class PaymentRouter {
    private final Map&lt;PaymentType, PaymentProcessor&gt; byType;

    PaymentRouter(List&lt;PaymentProcessor&gt; processors) {   // Spring injects ALL beans
        this.byType = processors.stream()
            .collect(toMap(PaymentProcessor::type, identity()));
    }
    Receipt charge(Order o) { return byType.get(o.paymentType()).charge(o); }
}</code></pre>`
},
{
  q: "Composition vs inheritance — which should you prefer and why?",
  level: "beginner", hot: true, tags: ["oop", "design"],
  a: `<p><strong>Prefer composition</strong> ("has-a") over inheritance ("is-a"). Reasons:</p>
<ul>
<li>Inheritance is the tightest coupling in OOP — a subclass depends on the parent's <em>implementation details</em>, so a harmless parent change can break it (the fragile base class problem).</li>
<li>Java only allows one superclass, so inheritance is a budget you can spend once.</li>
<li>Composition is chosen at runtime and easy to mock in tests.</li>
</ul>
<pre><code>// Fragile: HashSet.addAll internally calls add(), so the count double-counts
class CountingSet&lt;E&gt; extends HashSet&lt;E&gt; {
    int count;
    @Override public boolean add(E e) { count++; return super.add(e); }
    @Override public boolean addAll(Collection&lt;? extends E&gt; c) { count += c.size(); return super.addAll(c); }
}

// Robust: composition + delegation
class CountingSet&lt;E&gt; implements Set&lt;E&gt; {
    private final Set&lt;E&gt; delegate = new HashSet&lt;&gt;();
    private int count;
    public boolean add(E e) { count++; return delegate.add(e); }
    // ...delegate the rest
}</code></pre>
<p>Use inheritance only when there is a genuine, stable "is-a" relationship <em>and</em> the parent was designed for extension (documented, or sealed/final where not).</p>`
},
{
  q: "What is an association, aggregation and composition relationship?",
  level: "beginner", tags: ["oop", "uml"],
  a: `<ul>
<li><strong>Association</strong> — a general "uses" link. A <code>Teacher</code> and a <code>Student</code> know each other; both live independently.</li>
<li><strong>Aggregation</strong> — a weak "has-a"; the part can survive the whole. A <code>Department</code> has <code>Professor</code>s; delete the department and the professors still exist. Hollow diamond in UML.</li>
<li><strong>Composition</strong> — a strong "has-a"; the part <em>cannot</em> exist without the whole. An <code>Order</code> has <code>OrderLine</code>s; delete the order and the lines are meaningless. Filled diamond in UML — and in JPA this is exactly <code>cascade = ALL, orphanRemoval = true</code>.</li>
</ul>`
},
{
  q: "What is polymorphism in practice — where have you actually used it?",
  level: "beginner", tags: ["polymorphism"],
  a: `<p>Answer with a real pattern rather than a definition. Strong examples:</p>
<ul>
<li><strong>Strategy for pricing/discount rules</strong> — one interface, one implementation per rule, injected as a <code>List</code> and applied in order.</li>
<li><strong>Notification channels</strong> — <code>EmailNotifier</code>, <code>SmsNotifier</code>, <code>PushNotifier</code> behind a <code>Notifier</code> interface, chosen by user preference.</li>
<li><strong>Spring itself</strong> — <code>DataSource</code>, <code>CacheManager</code>, <code>MessageConverter</code> are all interfaces whose implementation is swapped by configuration. That is polymorphism doing production work.</li>
</ul>
<p>The two forms: <em>compile-time</em> (overloading, generics) and <em>runtime</em> (overriding, interface dispatch). Interviewers want you to name both.</p>`
},
{
  q: "What is the Liskov Substitution Principle really testing?",
  level: "advanced", tags: ["solid", "design"],
  a: `<p>LSP is about <strong>behavioural contracts</strong>, not just compilable types. A subtype must:</p>
<ul>
<li>Not <strong>strengthen preconditions</strong> — if the parent accepts any int, the child cannot reject negatives.</li>
<li>Not <strong>weaken postconditions</strong> — if the parent guarantees a sorted result, the child must too.</li>
<li>Preserve <strong>invariants</strong> of the parent.</li>
<li>Not throw new checked exceptions the caller was not prepared for.</li>
</ul>
<p>The smell that reveals a violation: a client that has to do <code>if (x instanceof Square)</code>, or a subclass overriding a method to <code>throw new UnsupportedOperationException()</code> — which is exactly what <code>Arrays.asList().add()</code> does, an LSP violation in the JDK itself.</p>`
},
{
  q: "How do you design a class as thread-safe and immutable at the same time?",
  level: "advanced", tags: ["design", "concurrency"],
  a: `<p>Immutability <em>is</em> the cheapest thread-safety strategy: no mutable state means no races and no locks. The design steps:</p>
<ol>
<li>All fields <code>private final</code>, set only in the constructor.</li>
<li>Class <code>final</code> so no subclass can add mutable state or leak <code>this</code>.</li>
<li>Never let <code>this</code> escape during construction (no registering listeners in the constructor — another thread could see a partially built object).</li>
<li>Defensive copies of mutable collections/dates in and out.</li>
<li>"Mutators" return a new instance — the withers pattern.</li>
</ol>
<pre><code>public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount);
        if (amount.scale() &gt; 2) amount = amount.setScale(2, RoundingMode.HALF_UP);
    }
    public Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(amount.add(other.amount), currency);  // new instance
    }
}</code></pre>
<p><code>final</code> fields also give you a JMM guarantee: their correctly-constructed values are visible to other threads without synchronisation.</p>`
},
{
  q: "What is loose coupling and high cohesion?",
  level: "beginner", tags: ["design"],
  a: `<ul>
<li><strong>Cohesion</strong> — how focused a single module is. High cohesion means everything in the class serves one purpose. A <code>UserService</code> that also parses CSV and sends emails has low cohesion.</li>
<li><strong>Coupling</strong> — how much a module depends on the internals of others. Loose coupling means it depends on interfaces and data, not concrete classes and their internal structure.</li>
</ul>
<p>Target: <strong>high cohesion, loose coupling.</strong> Practical levers — dependency injection, programming to interfaces, events instead of direct calls, and DTOs at boundaries so a database column rename does not ripple into three services.</p>`
},
{
  q: "What is the difference between IS-A and HAS-A, and when does 'is-a' mislead you?",
  level: "beginner", tags: ["oop"],
  a: `<p>IS-A is inheritance (<code>Car extends Vehicle</code>), HAS-A is composition (<code>Car has an Engine</code>).</p>
<p>"Is-a" misleads when the relationship holds in <em>English</em> but not in <em>behaviour</em>. Classic traps:</p>
<ul>
<li>A Square "is a" Rectangle — but not substitutable, because setters break.</li>
<li>A <code>Stack</code> "is a" <code>Vector</code> — the JDK's own mistake; it exposes <code>insertElementAt</code> on a stack.</li>
<li>A <code>Manager</code> "is an" <code>Employee</code> — true today, but promotions mean an object would need to change class, which Java cannot do. Model the role as composition instead.</li>
</ul>
<p>The reliable test is not the sentence; it is: <em>can every caller of the parent use the child without knowing?</em></p>`
},
{
  q: "What are constructors, constructor chaining and constructor overloading?",
  level: "beginner", tags: ["oop"],
  a: `<p>A constructor initialises a new object. It has the class name, no return type, and is not inherited (though it is invoked through <code>super()</code>).</p>
<pre><code>class Employee {
    private final String name;
    private final String dept;
    private final BigDecimal salary;

    Employee(String name) { this(name, "UNASSIGNED", BigDecimal.ZERO); }   // chaining
    Employee(String name, String dept) { this(name, dept, BigDecimal.ZERO); }
    Employee(String name, String dept, BigDecimal salary) {                // canonical
        this.name = name; this.dept = dept; this.salary = salary;
    }
}</code></pre>
<p>Order of execution when you call <code>new Child()</code>: static blocks (once, on class init) → <code>super()</code> chain up to <code>Object</code> → instance initialiser blocks and field initialisers, in source order → constructor body.</p>
<p>If a class has any explicit constructor, the compiler does <strong>not</strong> add the default no-arg one — which is what breaks Hibernate entities and Jackson deserialization until you add it back.</p>`
},
{
  q: "When would you use an abstract class over an interface in real design?",
  level: "advanced", tags: ["oop", "design"],
  a: `<p>Reach for an <strong>abstract class</strong> when:</p>
<ul>
<li>Subtypes share <strong>state</strong> — an <code>AbstractJobProcessor</code> holding a retry counter, a clock and a metrics registry.</li>
<li>You want a <strong>template method</strong>: fixed algorithm skeleton, subclass fills the steps.</li>
<li>You need non-public members or a constructor that enforces invariants.</li>
</ul>
<p>Reach for an <strong>interface</strong> when the capability crosses unrelated hierarchies, when you want multiple inheritance of behaviour, or when the type is a public API you must be free to implement in many ways.</p>
<pre><code>public abstract class AbstractImportJob {
    public final ImportResult run(Path file) {   // final: skeleton is fixed
        validate(file);
        var rows = parse(file);                  // subclass decides
        var saved = persist(rows);               // subclass decides
        return new ImportResult(saved, Instant.now());
    }
    protected void validate(Path f) { /* shared default */ }
    protected abstract List&lt;Row&gt; parse(Path f);
    protected abstract int persist(List&lt;Row&gt; rows);
}</code></pre>
<p>The modern combination is common: an interface for the contract, an <code>AbstractXxx</code> skeletal implementation for convenience — exactly how the JDK does <code>List</code> / <code>AbstractList</code>.</p>`
},
{
  q: "What are covariance, contravariance and invariance in Java?",
  level: "advanced", tags: ["generics", "oop"],
  a: `<ul>
<li><strong>Arrays are covariant:</strong> <code>Object[] a = new String[2];</code> compiles — and <code>a[0] = 1;</code> throws <code>ArrayStoreException</code> at runtime. A known JLS design flaw.</li>
<li><strong>Generics are invariant:</strong> <code>List&lt;Object&gt; l = new ArrayList&lt;String&gt;()</code> does not compile — errors are caught at compile time instead.</li>
<li><strong>Wildcards reintroduce variance safely:</strong> <code>? extends T</code> gives covariance (read-only), <code>? super T</code> gives contravariance (write-only).</li>
<li><strong>Return types are covariant</strong> in overriding: an override may return a subtype.</li>
<li><strong>Parameter types are invariant</strong> in overriding — changing the parameter type creates an overload, not an override. This is why <code>@Override</code> is worth always writing: it catches that mistake.</li>
</ul>`
},
{
  q: "Explain the Law of Demeter (principle of least knowledge)",
  level: "advanced", tags: ["design"],
  a: `<p>A method should only talk to its immediate collaborators: its own fields, its parameters, objects it creates. Not the neighbours of neighbours.</p>
<pre><code>// Violation — a "train wreck". Three classes' internals leak into this line.
BigDecimal limit = order.getCustomer().getAccount().getPlan().getCreditLimit();

// Better — the object you own answers the question
BigDecimal limit = order.creditLimit();</code></pre>
<p>Why it matters: the train wreck couples this code to the entire chain, so any refactor anywhere in it breaks compilation here, and every step is a potential NPE. The fix is <strong>"tell, don't ask"</strong> — push the behaviour into the object holding the data.</p>
<p>Fluent builders and streams are the accepted exceptions; they return <code>this</code>/a new stage of the same abstraction, not foreign objects.</p>`
},
{
  q: "What is method hiding vs method overriding — predict the output",
  level: "advanced", tags: ["oop", "gotcha"],
  a: `<pre><code>class Parent {
    static  String who()  { return "Parent static"; }
    String  name()        { return "Parent instance"; }
}
class Child extends Parent {
    static  String who()  { return "Child static"; }     // HIDES
    @Override String name(){ return "Child instance"; }  // OVERRIDES
}

Parent p = new Child();
System.out.println(p.who());   // "Parent static"    &lt;- compile-time type
System.out.println(p.name());  // "Child instance"   &lt;- runtime type</code></pre>
<p>Static methods are dispatched on the <strong>declared</strong> type because there is no object to look up a vtable on. Instance fields behave the same way — fields are never polymorphic, they are <em>shadowed</em>:</p>
<pre><code>class A { String x = "A"; }
class B extends A { String x = "B"; }
A a = new B();
System.out.println(a.x);  // "A"</code></pre>`
},
{
  q: "How do you achieve multiple inheritance of behaviour in Java?",
  level: "beginner", tags: ["oop"],
  a: `<p>Java forbids extending multiple classes (to avoid the diamond problem) but supports:</p>
<ul>
<li><strong>Multiple interface implementation</strong> — a class can implement any number of interfaces.</li>
<li><strong>Default methods (Java 8)</strong> — so those interfaces can carry behaviour, giving you multiple inheritance of <em>behaviour</em> (though never of <em>state</em>).</li>
<li><strong>Composition + delegation</strong> — hold instances of both helpers and forward calls. This is the design most senior engineers reach for.</li>
</ul>
<p>State is deliberately excluded: interfaces cannot have instance fields, which is exactly what makes the diamond resolvable with the three simple precedence rules.</p>`
},
{
  q: "What is the Template Method pattern and where does Spring use it?",
  level: "advanced", tags: ["patterns", "spring"],
  a: `<p>Define the skeleton of an algorithm in a base class, deferring specific steps to subclasses, without letting them change the overall structure. The skeleton method is <code>final</code>; the steps are <code>abstract</code> or <code>protected</code> hooks.</p>
<p><strong>Spring is built on it:</strong></p>
<ul>
<li><code>JdbcTemplate</code> — handles connection acquisition, statement creation, exception translation and cleanup; you supply only the SQL and the <code>RowMapper</code>.</li>
<li><code>TransactionTemplate</code>, <code>RestTemplate</code>, <code>KafkaTemplate</code>, <code>RedisTemplate</code> — same shape.</li>
<li><code>AbstractApplicationContext.refresh()</code> — a 12-step template method that every context implementation follows.</li>
</ul>
<pre><code>List&lt;Customer&gt; all = jdbcTemplate.query(
    "SELECT id, name FROM customer WHERE status = ?",
    (rs, rowNum) -&gt; new Customer(rs.getLong("id"), rs.getString("name")),
    "ACTIVE");
// You wrote the variable part. The template did resource handling, exception
// translation to DataAccessException, and closing — correctly, every time.</code></pre>`
},
{
  q: "What is 'programming to an interface' and what problem does it solve?",
  level: "beginner", tags: ["design"],
  a: `<p>Declare variables, parameters and return types using the most general type that satisfies the need.</p>
<pre><code>// Rigid — the caller is now locked to an implementation
public ArrayList&lt;Order&gt; findOrders() { ... }

// Flexible — you can switch to LinkedList, an immutable list, or a lazy view
public List&lt;Order&gt; findOrders() { ... }</code></pre>
<p>It solves three things at once: you can swap implementations without touching callers, you can inject test doubles, and your public API stops leaking internal decisions. It is the practical form of the Dependency Inversion Principle.</p>
<p>Counterpoint worth mentioning: do not over-abstract. An interface with exactly one implementation and no realistic second one is speculative generality — the YAGNI cost is real.</p>`
},
{
  q: "How do you design an extensible class hierarchy that will not rot in two years?",
  level: "advanced", tags: ["design", "architecture"],
  a: `<ol>
<li><strong>Design for inheritance or forbid it.</strong> Mark classes <code>final</code> by default; if extension is intended, document the self-use of overridable methods precisely (Effective Java, Item 19). Java 17's <code>sealed</code> lets you permit an explicit list.</li>
<li><strong>Keep hierarchies shallow.</strong> Two levels is usually plenty; depth is where fragility compounds.</li>
<li><strong>Never call an overridable method from a constructor</strong> — the subclass's fields are not initialised yet, so it sees nulls.</li>
<li><strong>Extend by adding types, not by editing switches.</strong> A new requirement should mean a new class plus a registration, not a modified conditional in five places.</li>
<li><strong>Separate the data model from the behaviour model.</strong> Records/DTOs for data, services/strategies for behaviour, so persistence changes do not force behavioural rewrites.</li>
<li><strong>Push variation to the edges.</strong> Keep the core domain free of framework annotations; adapters handle HTTP, Kafka and JPA. That is hexagonal/clean architecture in one line.</li>
</ol>`
},
{
  q: "What is object cloning and why do experienced developers avoid Cloneable?",
  level: "advanced", tags: ["oop", "design"],
  a: `<p><code>Cloneable</code> is a marker interface with no <code>clone()</code> method on it — <code>clone()</code> lives on <code>Object</code> and is <code>protected</code>. Problems:</p>
<ul>
<li>The contract is vague and unenforceable; <code>super.clone()</code> is required but nothing checks it.</li>
<li><code>clone()</code> bypasses constructors, so invariants and <code>final</code> fields cannot be enforced.</li>
<li>Default behaviour is shallow, which silently shares mutable state.</li>
<li>It throws a checked <code>CloneNotSupportedException</code> that can never actually happen if you implemented the interface.</li>
</ul>
<p><strong>Preferred alternatives:</strong> a copy constructor <code>new Order(other)</code>, a static factory <code>Order.copyOf(other)</code>, a <code>toBuilder()</code> method, or for records the withers pattern. All of them run real constructors and are readable.</p>`
},
{
  q: "Explain the Strategy vs State vs Command patterns — they look identical",
  level: "advanced", tags: ["patterns"],
  a: `<p>Structurally similar (an interface with interchangeable implementations), but different in <em>intent</em>:</p>
<table>
<tr><th>Pattern</th><th>Intent</th><th>Who switches</th><th>Example</th></tr>
<tr><td><strong>Strategy</strong></td><td>Interchangeable algorithms for one task</td><td>The client picks up front</td><td>Sorting comparator, discount rule, compression codec</td></tr>
<tr><td><strong>State</strong></td><td>Behaviour changes as internal state changes</td><td>The states transition <em>themselves</em></td><td>Order: NEW → PAID → SHIPPED, each allowing different operations</td></tr>
<tr><td><strong>Command</strong></td><td>Encapsulate a request as an object</td><td>Nobody switches — you queue, log, undo or retry it</td><td>Kafka message handler, undo stack, job queue</td></tr>
</table>
<p>The giveaway: if the object knows what comes next, it is State. If someone hands it to you, it is Strategy. If you store it to run later or reverse it, it is Command.</p>`
},
{
  q: "What is the difference between an object's identity, state and behaviour?",
  level: "beginner", tags: ["oop"],
  a: `<ul>
<li><strong>Identity</strong> — what makes this object <em>this</em> one. In Java, the reference; conceptually, the entity ID. Two orders with identical data are still different orders.</li>
<li><strong>State</strong> — the current values of its fields.</li>
<li><strong>Behaviour</strong> — what it can do, i.e. its methods.</li>
</ul>
<p>This maps directly to Domain-Driven Design: an <strong>Entity</strong> is defined by identity (an <code>Order</code> with an ID — its state changes but it stays the same order), while a <strong>Value Object</strong> is defined entirely by state (a <code>Money</code> of ₹500 is interchangeable with any other ₹500). Getting this distinction right is what decides whether <code>equals()</code> compares IDs or all fields.</p>`
},
{
  q: "What is an anti-pattern? Name the ones you have removed from real code.",
  level: "advanced", tags: ["design", "production"],
  a: `<ul>
<li><strong>God class</strong> — a 3000-line service doing everything. Split by responsibility, guided by which methods touch which fields.</li>
<li><strong>Anemic domain model</strong> — entities are pure getters/setters and all logic sits in services. Push invariants into the entity.</li>
<li><strong>Primitive obsession</strong> — passing <code>String customerId, String orderId</code> everywhere until someone swaps the arguments. Wrap in value types.</li>
<li><strong>Boolean trap</strong> — <code>process(order, true, false)</code>. Use enums or named parameters objects.</li>
<li><strong>Singleton abuse</strong> — global mutable state that makes tests order-dependent. Use DI-managed singletons instead.</li>
<li><strong>Exception swallowing</strong> — <code>catch (Exception e) {}</code>, the reason production incidents have no evidence.</li>
<li><strong>Shotgun surgery</strong> — one requirement change forces edits in 12 files; a sign your abstraction boundary is in the wrong place.</li>
</ul>
<blockquote><p><strong>Tip:</strong> pick one, describe the actual refactor you did and what improved (fewer bugs, faster tests, easier onboarding). Naming anti-patterns is common; having removed one is not.</p></blockquote>`
}
]);
