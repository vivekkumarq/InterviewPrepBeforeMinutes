appendTopic("java-oop", [
{
  q: "What is the Open/Closed Principle in practice — show a refactor",
  level: "beginner", hot: true, tags: ["solid", "design"],
  a: `<p>Software should be open for extension, closed for modification. The smell that tells you it is violated: a conditional you edit every time a requirement is added.</p>
<pre><code>// Before — every new format means editing this method and re-testing everything
public byte[] export(Report r, String format) {
    if ("PDF".equals(format))       return toPdf(r);
    else if ("CSV".equals(format))  return toCsv(r);
    else if ("XLSX".equals(format)) return toXlsx(r);
    throw new IllegalArgumentException(format);
}

// After — a new format is a new class; nothing existing is touched
public interface ReportExporter {
    String format();
    byte[] export(Report r);
}

@Service
public class ExportService {
    private final Map&lt;String, ReportExporter&gt; exporters;

    public ExportService(List&lt;ReportExporter&gt; all) {          // Spring injects every bean
        this.exporters = all.stream().collect(toMap(ReportExporter::format, identity()));
    }
    public byte[] export(Report r, String format) {
        return Optional.ofNullable(exporters.get(format))
                .orElseThrow(() -&gt; new UnsupportedFormatException(format))
                .export(r);
    }
}</code></pre>
<p><strong>What you gain:</strong> adding XML export cannot break PDF export, each exporter is independently testable, and the change is additive so code review is trivial.</p>
<p><strong>The honest caveat:</strong> do not build this abstraction for a conditional with two stable branches. Apply OCP where you have evidence that variation happens — the third time you edit the same switch is the signal.</p>`
},
{
  q: "What is the difference between association and dependency? Explain coupling types",
  level: "advanced", tags: ["design"],
  a: `<p><strong>Association</strong> is a structural relationship — one object holds a reference to another as a field. <strong>Dependency</strong> is weaker and transient — one class uses another as a method parameter, local variable or return type, without storing it.</p>
<p><strong>Coupling, from worst to best:</strong></p>
<ol>
<li><strong>Content coupling</strong> — one module modifies another's internals directly. The worst.</li>
<li><strong>Common coupling</strong> — modules share global mutable state.</li>
<li><strong>Control coupling</strong> — passing a flag that tells the callee <em>how</em> to behave: <code>process(order, true)</code>. Split the method instead.</li>
<li><strong>Stamp coupling</strong> — passing a whole object when only two fields are needed.</li>
<li><strong>Data coupling</strong> — passing only the data required. Good.</li>
<li><strong>Message coupling</strong> — communicating via events or messages with no direct reference. Loosest.</li>
</ol>
<pre><code>// Control coupling — the boolean trap
void notify(User u, boolean sms) { ... }
notify(user, true);              // unreadable at the call site

// Better
void notifyBySms(User u) { ... }
void notifyByEmail(User u) { ... }
// or an enum: notify(user, Channel.SMS)</code></pre>
<p><strong>Why it matters for interviews:</strong> "loose coupling" is easy to say. Being able to name <em>which kind</em> of coupling a piece of code has, and the specific refactor that reduces it, is what demonstrates you actually apply it.</p>`
},
{
  q: "What is the Interface Segregation Principle and how does it show up in real code?",
  level: "advanced", tags: ["solid"],
  a: `<p>No client should be forced to depend on methods it does not use. The symptom is an implementation full of <code>throw new UnsupportedOperationException()</code> or empty method bodies.</p>
<pre><code>// Violation — a "fat" interface
interface Employee {
    void work();
    void takeBreak();
    void submitTimesheet();
    void attendStandup();
    void reviewCode();          // a contractor doing data entry cannot do this
}

// Segregated — compose the roles a given type actually has
interface Worker      { void work(); void takeBreak(); }
interface Reviewer    { void reviewCode(); }
interface TeamMember  { void attendStandup(); }

class Engineer  implements Worker, Reviewer, TeamMember { }
class DataEntry implements Worker { }</code></pre>
<p><strong>Where it shows up in real systems:</strong></p>
<ul>
<li>A single <code>Repository</code> interface with 20 methods, where a read-only consumer must still see <code>deleteAll()</code>. Split into <code>ReadRepository</code> and <code>WriteRepository</code> — which also makes the CQRS boundary explicit.</li>
<li><strong>Consumer-driven interfaces</strong> — define the narrow interface in the <em>consumer's</em> package describing exactly what it needs, and let the provider implement it. Testing gets far easier because the test double has three methods, not twenty.</li>
</ul>
<p><code>Arrays.asList().add()</code> throwing <code>UnsupportedOperationException</code> is the JDK's own ISP violation — <code>List</code> bundles mutation into an interface that fixed-size views cannot honour. That example makes the point memorably.</p>`
},
{
  q: "What is a value object versus an entity in domain modelling?",
  level: "advanced", hot: true, tags: ["ddd", "design"],
  a: `<table>
<tr><th></th><th>Entity</th><th>Value Object</th></tr>
<tr><td>Identity</td><td>Has an ID; identity persists through change</td><td>Defined entirely by its attributes</td></tr>
<tr><td>Equality</td><td>Compare IDs</td><td>Compare all fields</td></tr>
<tr><td>Mutability</td><td>State changes over time</td><td>Immutable — "change" creates a new one</td></tr>
<tr><td>Examples</td><td><code>Order</code>, <code>Customer</code>, <code>Account</code></td><td><code>Money</code>, <code>Address</code>, <code>DateRange</code>, <code>Email</code></td></tr>
</table>
<pre><code>// Value object — a record is the perfect fit
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        if (amount.scale() &gt; currency.getDefaultFractionDigits())
            throw new IllegalArgumentException("too many decimal places");
    }
    public Money plus(Money o) {
        requireSameCurrency(o);
        return new Money(amount.add(o.amount), currency);   // new instance
    }
}

// Entity — identity survives every field change
@Entity
public class Order {
    @Id private OrderId id;
    private OrderStatus status;
    @Embedded private Money total;          // a value object inside an entity
    // equals/hashCode on id only
}</code></pre>
<p><strong>Why this distinction is worth making:</strong> it decides how you write <code>equals</code>, whether the object needs a database table, and whether it can be shared freely between threads. It also kills <strong>primitive obsession</strong> — <code>transfer(String from, String to, BigDecimal amount)</code> lets you swap the accounts silently; <code>transfer(AccountId from, AccountId to, Money amount)</code> makes that a compile error.</p>`
},
{
  q: "How do you refactor a god class?",
  level: "advanced", hot: true, tags: ["refactoring", "design"],
  a: `<p>A god class does too much — thousands of lines, dozens of dependencies, changed by every feature. The refactor must be incremental, because a big-bang rewrite of the class everything depends on is how you cause an outage.</p>
<ol>
<li><strong>Get it under test first.</strong> Characterisation tests that pin current behaviour, even if that behaviour is odd. Without them you are guessing.</li>
<li><strong>Find the seams.</strong> Group methods by the fields they touch — clusters of methods using the same subset of state are the natural classes hiding inside. Tools can visualise this, but a manual pass usually reveals it.</li>
<li><strong>Extract the clearest cluster</strong> into a new class, and have the god class delegate to it. Nothing outside changes.</li>
<li><strong>Move callers over gradually</strong> to the new class, then remove the delegation.</li>
<li><strong>Repeat.</strong> Each step is independently shippable and revertible.</li>
</ol>
<pre><code>// Before: OrderService — 2,400 lines, 14 dependencies
// Step 1: extract the clearest responsibility, delegate
public class OrderService {
    private final OrderPricing pricing;                 // extracted
    public Money price(Order o) { return pricing.price(o); }   // delegation kept temporarily
}
// Step 2: callers move to OrderPricing directly
// Step 3: delete the delegating method</code></pre>
<p><strong>Common extractions:</strong> validation → a validator, price/tax rules → a calculator, external calls → a client/adapter, mapping → a mapper, persistence → a repository, notifications → a publisher.</p>
<p><strong>What to say about scope:</strong> "I would not stop feature work to rewrite it. I would apply the boy-scout rule — every time I touch that class for a feature, extract one responsibility — so it shrinks continuously without a risky big-bang change."</p>`
},
{
  q: "What is the difference between inheritance of implementation and inheritance of interface?",
  level: "advanced", tags: ["oop"],
  a: `<ul>
<li><strong>Interface inheritance (subtyping)</strong> — inheriting a <em>contract</em>. The subtype promises to behave as the supertype. This is what polymorphism needs and it is almost always safe.</li>
<li><strong>Implementation inheritance</strong> — inheriting <em>code</em>. The subclass depends on the parent's internal behaviour, which is the tightest coupling in OOP.</li>
</ul>
<p>Java's <code>extends</code> conflates both, which is the source of most inheritance problems. <code>implements</code> gives you only the first.</p>
<pre><code>// Implementation inheritance gone wrong — the fragile base class problem
class InstrumentedSet&lt;E&gt; extends HashSet&lt;E&gt; {
    private int added;
    @Override public boolean add(E e) { added++; return super.add(e); }
    @Override public boolean addAll(Collection&lt;? extends E&gt; c) {
        added += c.size();
        return super.addAll(c);      // HashSet.addAll internally calls add() -> double count
    }
}
// The bug depends entirely on an UNDOCUMENTED implementation detail of the parent.</code></pre>
<p><strong>The rule:</strong> inherit interfaces freely; inherit implementation rarely, and only from a class explicitly designed and documented for extension. Otherwise compose and delegate.</p>
<p>Java 17's <code>sealed</code> classes are the modern middle ground: you get a closed hierarchy with exhaustive pattern matching, and you control exactly which types may extend — extension by permission rather than by default.</p>`
},
{
  q: "What is method chaining and the fluent interface pattern?",
  level: "beginner", tags: ["patterns", "design"],
  a: `<p>Each method returns an object (usually <code>this</code> or a new immutable instance) so calls can be chained into a readable expression.</p>
<pre><code>// Mutable fluent builder
String result = new StringBuilder()
        .append("SELECT * FROM orders")
        .append(" WHERE status = ?")
        .toString();

// Immutable fluent — each step returns a NEW object (safer)
LocalDate due = LocalDate.now()
        .plusMonths(1)
        .withDayOfMonth(1)
        .minusDays(1);

// Fluent API you might design
Query.from("orders")
     .where("status").eq("PAID")
     .and("total").greaterThan(100)
     .orderBy("created_at").desc()
     .limit(20)
     .build();</code></pre>
<p><strong>Where the JDK and Spring use it:</strong> <code>Stream</code>, <code>Optional</code>, <code>Comparator.comparing().thenComparing()</code>, <code>HttpRequest.newBuilder()</code>, <code>WebClient</code>, <code>MockMvc</code>, and Spring Security's <code>HttpSecurity</code> configuration.</p>
<p><strong>Trade-offs to mention:</strong> chaining reads beautifully but debugging a 12-call chain is harder (you cannot easily inspect intermediate values), stack traces point at one line, and a mutable fluent object shared between threads is unsafe. Prefer the immutable form, and break very long chains into named intermediate variables — readability is the goal, not the chain itself.</p>`
},
{
  q: "How would you design a class to be extensible without inheritance?",
  level: "advanced", tags: ["design", "patterns"],
  a: `<p>Several mechanisms, each suiting a different kind of variation:</p>
<ol>
<li><strong>Strategy injection</strong> — take the varying behaviour as a constructor parameter.
<pre><code>public final class PriceCalculator {
    private final List&lt;PricingRule&gt; rules;      // extend by adding a rule
    public PriceCalculator(List&lt;PricingRule&gt; rules) { this.rules = List.copyOf(rules); }
}</code></pre></li>
<li><strong>Callbacks / higher-order functions</strong> — pass a <code>Function</code> or <code>Consumer</code> for the variable step. Lightweight, no new type needed.</li>
<li><strong>Events</strong> — publish domain events and let anyone subscribe. Zero coupling to the extenders.</li>
<li><strong>Composition + delegation</strong> — wrap the class and forward, adding behaviour (the Decorator pattern).</li>
<li><strong>Configuration and feature flags</strong> — for variation that is operational rather than structural.</li>
<li><strong>Plugin/SPI</strong> — <code>ServiceLoader</code> or a registry, for third-party extension.</li>
</ol>
<pre><code>// Extension by decoration — no inheritance of the original class
public class CachingPriceCalculator implements PriceCalculator {
    private final PriceCalculator delegate;
    private final Cache cache;
    public Money price(Order o) { return cache.get(o.id(), () -&gt; delegate.price(o)); }
}</code></pre>
<p><strong>Why prefer these:</strong> they keep the base class <code>final</code> and its invariants intact, they compose (you can stack a cache and a metrics decorator), and they are configurable at runtime rather than fixed at compile time. Effective Java's advice — "design for inheritance or prohibit it" — is exactly this: if you are not going to document and maintain an extension contract, close the class and offer these seams instead.</p>`
},
{
  q: "What are the common OOP mistakes you see in code review?",
  level: "advanced", hot: true, tags: ["design", "review"],
  a: `<ul>
<li><strong>Anemic domain model</strong> — entities with only getters and setters and all logic in services. Push invariants into the object that owns the data.</li>
<li><strong>Exposing mutable internals</strong> — <code>return this.items;</code> hands the caller your state. Return an unmodifiable view or a copy.</li>
<li><strong>Setters on everything</strong> by reflex, which makes every invariant unenforceable. Prefer constructor injection of state and meaningful methods (<code>order.cancel()</code>, not <code>order.setStatus(CANCELLED)</code>).</li>
<li><strong>Inheritance used for code reuse</strong> where composition was correct.</li>
<li><strong>Deep hierarchies</strong> — more than two or three levels and nobody can predict behaviour.</li>
<li><strong>Calling overridable methods from a constructor</strong> — the subclass's fields are not initialised yet, so it observes nulls.</li>
<li><strong>Primitive obsession</strong> — <code>String</code> for IDs, emails and currencies; wrap them in types.</li>
<li><strong>Static utility classes holding state</strong>, which is global mutable state with extra steps.</li>
<li><strong>Interfaces with one implementation and no prospect of a second</strong> — speculative abstraction that only adds a file to navigate.</li>
<li><strong>Leaking persistence or transport concerns into the domain</strong> — JPA and Jackson annotations on the same class that holds business rules, so a column rename becomes an API change.</li>
</ul>
<blockquote><p><strong>Good closing line:</strong> "Most of these come from the same root — treating objects as data structures rather than as things with behaviour and invariants."</p></blockquote>`
},
{
  q: "Explain the Builder vs Factory vs Prototype decision",
  level: "advanced", tags: ["patterns"],
  a: `<table>
<tr><th>Pattern</th><th>Question it answers</th><th>Reach for it when</th></tr>
<tr><td><strong>Factory</strong></td><td><em>Which</em> type do I create?</td><td>The concrete class depends on input or configuration</td></tr>
<tr><td><strong>Builder</strong></td><td><em>How</em> do I construct this complex object?</td><td>Many parameters, several optional, invariants to validate</td></tr>
<tr><td><strong>Prototype</strong></td><td>Can I copy an existing one?</td><td>Construction is expensive and an existing instance is close to what you need</td></tr>
</table>
<pre><code>// Prototype — clone a configured template rather than rebuilding it
public class ReportTemplate {
    private final Map&lt;String, String&gt; settings;   // expensive to assemble

    public ReportTemplate withTitle(String title) {   // "copy with change"
        var copy = new LinkedHashMap&lt;&gt;(settings);
        copy.put("title", title);
        return new ReportTemplate(copy);
    }
}

// Records give you the prototype shape for free via a wither
public record HttpConfig(String baseUrl, Duration timeout, int retries) {
    public HttpConfig withTimeout(Duration t) { return new HttpConfig(baseUrl, t, retries); }
}</code></pre>
<p><strong>They combine well:</strong> a factory that returns a builder, or a builder whose <code>build()</code> chooses among several concrete types based on what was configured. Spring's <code>WebClient.builder()</code> is a builder producing an object whose actual implementation is chosen by what is on the classpath — factory and builder together.</p>`
},
{
  q: "What is composition over inheritance in a Spring application specifically?",
  level: "advanced", tags: ["spring", "design"],
  a: `<p>In Spring the choice is usually between an abstract base service and injected collaborators — and injection almost always wins.</p>
<pre><code>// ✘ Inheritance for reuse — common but problematic
public abstract class BaseService {
    @Autowired protected AuditService audit;      // field injection, forced on every child
    @Autowired protected MetricsService metrics;
    protected void logAction(String a) { audit.record(a); }
}
public class OrderService extends BaseService { }
// Every subclass now depends on audit and metrics whether it needs them or not,
// the constructor cannot be used in tests, and one base-class change touches everything.

// ✔ Composition — explicit, testable, per-service dependencies
@Service
@RequiredArgsConstructor
public class OrderService {
    private final AuditService audit;             // only what this service needs
    private final OrderRepository repo;
}</code></pre>
<p><strong>Where cross-cutting behaviour really belongs in Spring:</strong> not a base class, but the mechanisms the framework already gives you — <strong>AOP aspects</strong> for auditing and timing, <strong>interceptors/filters</strong> for request concerns, <strong>events</strong> for reactions, and <strong>decorator beans</strong> for wrapping. Those apply without forcing an inheritance relationship.</p>
<p><strong>The one legitimate case for an abstract base</strong> is a genuine template method — a fixed algorithm with subclass-specific steps, such as an <code>AbstractImportJob</code> where every importer validates, parses and persists in that order. Even then, keep the base class free of injected fields and pass collaborators through the constructor.</p>`
}
]);
