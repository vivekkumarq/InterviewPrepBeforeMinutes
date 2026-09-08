appendTopic("java-oop", [
{
  q: "Design a class hierarchy for a payment system — walk through your reasoning",
  level: "advanced", hot: true, tags: ["design", "solid"],
  companies: ["Amazon", "PayPal", "Paytm", "Razorpay", "Flipkart", "Walmart"],
  a: `<p>The interviewer is testing whether you reach for inheritance or composition, and whether adding a provider means editing existing code.</p>
<pre><code>// The contract — one capability, not a type hierarchy
public interface PaymentProcessor {
    PaymentMethod method();
    PaymentResult charge(PaymentRequest request);
    RefundResult refund(String paymentId, Money amount);
    default boolean supports(Money amount) { return true; }
}

// One implementation per provider; they share NOTHING structurally
@Component class CardProcessor   implements PaymentProcessor { }
@Component class UpiProcessor    implements PaymentProcessor { }
@Component class WalletProcessor implements PaymentProcessor { }

// Registry built from injected strategies — adding a provider touches NO existing file
@Service
public class PaymentRouter {
    private final Map&lt;PaymentMethod, PaymentProcessor&gt; byMethod;

    public PaymentRouter(List&lt;PaymentProcessor&gt; processors) {
        this.byMethod = processors.stream()
                .collect(toMap(PaymentProcessor::method, identity()));
    }
    public PaymentResult pay(PaymentRequest r) {
        return Optional.ofNullable(byMethod.get(r.method()))
                .orElseThrow(() -&gt; new UnsupportedPaymentMethodException(r.method()))
                .charge(r);
    }
}

// Cross-cutting behaviour by DECORATION, not by a base class
class RetryingProcessor implements PaymentProcessor { private final PaymentProcessor delegate; }
class MeteredProcessor  implements PaymentProcessor { private final PaymentProcessor delegate; }</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Payment strategy and decorator layering">
  <rect class="dg-box" x="10" y="52" width="104" height="44" rx="8"/><text class="dg-s" x="62" y="79" text-anchor="middle">OrderService</text>
  <path class="dg-line" d="M118 74 H160" marker-end="url(#pm1)"/>
  <rect class="dg-fill" x="164" y="52" width="118" height="44" rx="8"/><text class="dg-s" x="223" y="72" text-anchor="middle">PaymentRouter</text><text class="dg-s" x="223" y="88" text-anchor="middle">(registry)</text>
  <path class="dg-line" d="M286 60 H330 M286 74 H330 M286 90 H330" marker-end="url(#pm1)"/>
  <rect class="dg-fill2" x="334" y="16" width="130" height="34" rx="7"/><text class="dg-s" x="399" y="37" text-anchor="middle">CardProcessor</text>
  <rect class="dg-fill2" x="334" y="58" width="130" height="34" rx="7"/><text class="dg-s" x="399" y="79" text-anchor="middle">UpiProcessor</text>
  <rect class="dg-fill2" x="334" y="100" width="130" height="34" rx="7"/><text class="dg-s" x="399" y="121" text-anchor="middle">WalletProcessor</text>
  <text class="dg-s" x="545" y="60" text-anchor="middle">wrapped by</text>
  <text class="dg-s" x="545" y="78" text-anchor="middle">Retry / Metrics</text>
  <text class="dg-s" x="545" y="96" text-anchor="middle">decorators</text>
  <defs><marker id="pm1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>What to say out loud:</strong> "I deliberately avoided an <code>AbstractPaymentProcessor</code> base class. Card, UPI and wallet payments share an <em>interface</em>, not an implementation — forcing shared code into a parent creates the fragile base class problem the first time one provider needs different retry semantics. Cross-cutting concerns go in decorators, which compose."</p>`
},
{
  q: "What is the difference between tight coupling and loose coupling — show a refactor",
  level: "beginner", hot: true, tags: ["design", "di"],
  companies: ["TCS", "Infosys", "Capgemini", "Cognizant", "Accenture"],
  a: `<pre><code>// TIGHTLY COUPLED — OrderService knows the concrete class, creates it, and
// cannot be tested or changed without editing this file
class OrderService {
    private final MySqlOrderRepository repo = new MySqlOrderRepository();
    private final SmtpEmailSender mailer   = new SmtpEmailSender("smtp.acme.com", 587);

    void place(Order o) {
        repo.insert(o);
        mailer.send(o.customerEmail(), "Order placed");
    }
}

// LOOSELY COUPLED — depends on abstractions, supplied from outside
class OrderService {
    private final OrderRepository repo;      // interface
    private final Notifier notifier;         // interface

    OrderService(OrderRepository repo, Notifier notifier) {
        this.repo = repo; this.notifier = notifier;
    }
    void place(Order o) {
        repo.save(o);
        notifier.notify(o.customerId(), OrderPlaced.of(o));
    }
}

// Now this is trivial
var service = new OrderService(new InMemoryOrderRepository(), new FakeNotifier());</code></pre>
<table>
<tr><th></th><th>Tight coupling</th><th>Loose coupling</th></tr>
<tr><td>Testability</td><td>Needs a real DB and SMTP server</td><td>Pass test doubles</td></tr>
<tr><td>Swapping implementation</td><td>Edit the class</td><td>Change configuration</td></tr>
<tr><td>Change ripple</td><td>Spreads to callers</td><td>Contained behind the interface</td></tr>
<tr><td>Reuse</td><td>Locked to one stack</td><td>Reusable</td></tr>
</table>
<p><strong>How to spot tight coupling in review:</strong> the <code>new</code> keyword for a collaborator inside business logic, a concrete class name in a field type, <code>static</code> calls to another module, and a class that cannot be unit tested without infrastructure.</p>
<p><strong>The balancing point worth adding:</strong> loose coupling is not free — every interface is a layer of indirection to navigate. An interface with one implementation and no realistic second one is speculative generality. Decouple at boundaries you expect to change: persistence, external services, and anything crossing a team.</p>`
},
{
  q: "Explain the Liskov Substitution Principle with the Rectangle-Square problem",
  level: "advanced", hot: true, tags: ["solid", "oop"],
  companies: ["Amazon", "Microsoft", "ThoughtWorks", "EPAM", "SAP"],
  a: `<pre><code>class Rectangle {
    protected int width, height;
    public void setWidth(int w)  { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int area() { return width * height; }
}

class Square extends Rectangle {          // "A square IS-A rectangle" — mathematically true
    @Override public void setWidth(int w)  { this.width = w;  this.height = w; }
    @Override public void setHeight(int h) { this.width = h;  this.height = h; }
}

// Code written against Rectangle, which any subtype must satisfy
void resize(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    assert r.area() == 20;                // holds for Rectangle
}
resize(new Square());                     // area() == 16 — the ASSERTION FAILS</code></pre>
<p><strong>Why this violates LSP:</strong> <code>Rectangle</code> has an implicit invariant — setting width does not change height. <code>Square</code> breaks it. The subtype is not substitutable, so correct code written against the parent becomes incorrect. The inheritance is valid in geometry and invalid in code, because <em>mutability</em> changes the contract.</p>
<p><strong>The fixes:</strong></p>
<ul>
<li><strong>Make them immutable</strong> — an immutable <code>Square</code> <em>is</em> substitutable for an immutable <code>Rectangle</code>, because there are no setters to break the invariant. This is the cleanest resolution and a good argument for immutable value objects generally.</li>
<li><strong>Drop the inheritance</strong> — both implement a <code>Shape</code> interface with <code>area()</code>, and neither extends the other.</li>
</ul>
<pre><code>public sealed interface Shape permits Rectangle, Square {
    double area();
}
public record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
}
public record Square(double side) implements Shape {
    public double area() { return side * side; }
}</code></pre>
<p><strong>The lesson to state:</strong> "is-a" in English is not the test. The test is whether every caller of the parent still works with the child. Look for the smell: a subclass that overrides a method to throw <code>UnsupportedOperationException</code>, or a caller doing <code>instanceof</code> to special-case a subtype.</p>`
},
{
  q: "How do you make a class immutable, and why does the interviewer ask this?",
  level: "beginner", hot: true, tags: ["immutability", "design"],
  companies: ["Infosys", "TCS", "Goldman Sachs", "Morgan Stanley", "Barclays", "JPMorgan"],
  a: `<p>Five rules, and the last two are what separate a complete answer from a partial one:</p>
<ol>
<li>Declare the class <code>final</code> so behaviour cannot be overridden.</li>
<li>Make all fields <code>private final</code>.</li>
<li>Provide no setters and no method that mutates state.</li>
<li><strong>Defensive copy mutable arguments in the constructor.</strong></li>
<li><strong>Defensive copy mutable state in getters.</strong></li>
</ol>
<pre><code>public final class Invoice {
    private final String id;
    private final List&lt;LineItem&gt; items;
    private final Date issuedAt;               // legacy mutable type

    public Invoice(String id, List&lt;LineItem&gt; items, Date issuedAt) {
        this.id = Objects.requireNonNull(id);
        this.items = List.copyOf(items);                  // 4 — caller cannot mutate later
        this.issuedAt = new Date(issuedAt.getTime());     // 4
    }
    public List&lt;LineItem&gt; items()  { return items; }                       // already immutable
    public Date issuedAt()          { return new Date(issuedAt.getTime()); } // 5

    public Invoice withItem(LineItem extra) {             // "mutation" returns a NEW object
        var copy = new ArrayList&lt;&gt;(items); copy.add(extra);
        return new Invoice(id, copy, issuedAt);
    }
}</code></pre>
<p><strong>Why interviewers ask it:</strong> immutability is the cheapest thread-safety strategy there is — no mutable state means no races, no locks and no visibility problems. It also makes objects safe as <code>HashMap</code> keys, safe to cache and share, and impossible to leave in a half-valid state. In finance and payments (where this question is most common) that matters directly.</p>
<p><strong>The record caveat to volunteer:</strong> a <code>record</code> gives you rules 1–3 automatically, but <strong>not</strong> 4 and 5. A record holding a <code>List</code> is only <em>shallowly</em> immutable unless you copy in the compact constructor:</p>
<pre><code>public record Invoice(String id, List&lt;LineItem&gt; items) {
    public Invoice { items = List.copyOf(items); }        // now genuinely immutable
}</code></pre>`
},
{
  q: "What is the difference between aggregation and composition in code?",
  level: "beginner", tags: ["oop", "design"],
  companies: ["TCS", "Wipro", "Tech Mahindra", "HCL", "Mindtree"],
  a: `<pre><code>// AGGREGATION — the part survives the whole ("has-a", weak)
class Department {
    private final List&lt;Professor&gt; professors;      // passed IN from outside
    Department(List&lt;Professor&gt; professors) {
        this.professors = professors;               // shared reference — they exist independently
    }
}
// Delete the department; the professors still exist elsewhere in the system.

// COMPOSITION — the part cannot exist without the whole ("owns-a", strong)
class Order {
    private final List&lt;OrderLine&gt; lines = new ArrayList&lt;&gt;();

    OrderLine addLine(String sku, int qty) {
        var line = new OrderLine(this, sku, qty);   // CREATED here, owned here
        lines.add(line);
        return line;
    }
}
// Delete the order and the lines are meaningless — they have no independent identity.</code></pre>
<table>
<tr><th></th><th>Aggregation</th><th>Composition</th></tr>
<tr><td>Lifetime</td><td>Independent</td><td>Part dies with the whole</td></tr>
<tr><td>Ownership</td><td>Shared</td><td>Exclusive</td></tr>
<tr><td>UML</td><td>Hollow diamond ◇</td><td>Filled diamond ◆</td></tr>
<tr><td>Created</td><td>Outside, passed in</td><td>Inside the owner</td></tr>
</table>
<p><strong>The reason this question is worth asking</strong> is that it maps directly onto real decisions:</p>
<ul>
<li><strong>JPA:</strong> composition is <code>cascade = ALL, orphanRemoval = true</code>; aggregation is no cascade at all. Getting this wrong means deleting an order deletes the customer.</li>
<li><strong>DDD:</strong> a composition boundary is an <em>aggregate</em> — the transactional consistency boundary. Order and OrderLine are saved together; Order and Customer are not.</li>
<li><strong>Database:</strong> composition usually means <code>ON DELETE CASCADE</code>; aggregation means <code>ON DELETE RESTRICT</code>.</li>
</ul>`
},
{
  q: "Can a constructor be private? Give three real use cases",
  level: "beginner", hot: true, tags: ["oop", "patterns"],
  companies: ["Infosys", "Cognizant", "Accenture", "Zoho", "Persistent"],
  a: `<p>Yes — a private constructor prevents instantiation from outside the class. Three legitimate reasons:</p>
<pre><code>// 1. UTILITY CLASS — only static members, must never be instantiated
public final class StringUtils {
    private StringUtils() {
        throw new AssertionError("no instances");   // also blocks reflection
    }
    public static boolean isBlank(String s) { ... }
}

// 2. SINGLETON — one controlled instance
public class ConfigService {
    private static final ConfigService INSTANCE = new ConfigService();
    private ConfigService() { }
    public static ConfigService getInstance() { return INSTANCE; }
}

// 3. STATIC FACTORY — named creation with validation, and the freedom to
//    return a cached instance or a subtype
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    private Money(BigDecimal amount, Currency currency) { ... }

    public static Money of(String amount, String currencyCode) {
        return new Money(new BigDecimal(amount), Currency.getInstance(currencyCode));
    }
    public static Money zero(Currency c) { return CACHE.computeIfAbsent(c, ...); }
}</code></pre>
<p><strong>Why static factories beat public constructors</strong> (Effective Java, Item 1) — a strong follow-up answer:</p>
<ul>
<li><strong>They have names</strong> — <code>Money.of()</code> and <code>Money.zero()</code> are clearer than two constructors with different signatures.</li>
<li><strong>They need not create a new object</strong> — they can return a cached or interned instance, which is exactly what <code>Integer.valueOf</code> and <code>Boolean.valueOf</code> do.</li>
<li><strong>They can return a subtype</strong> — <code>List.of()</code> returns a different implementation depending on the number of elements.</li>
<li><strong>They can be constrained</strong> — validation happens before any object exists, so an invalid instance is impossible.</li>
</ul>
<p>The builder pattern also relies on a private constructor, so that <code>build()</code> is the only construction path and can validate cross-field invariants.</p>`
},
{
  q: "What is method chaining vs method cascading, and how do you design a fluent API?",
  level: "advanced", tags: ["design", "patterns"],
  companies: ["Adobe", "Salesforce", "SAP", "Oracle", "Nagarro"],
  a: `<pre><code>// MUTABLE fluent (cascading) — returns 'this', mutates in place
public class QueryBuilder {
    private final StringBuilder sql = new StringBuilder();
    public QueryBuilder select(String... cols) { sql.append("SELECT ").append(join(cols)); return this; }
    public QueryBuilder from(String table)     { sql.append(" FROM ").append(table); return this; }
    public QueryBuilder where(String cond)     { sql.append(" WHERE ").append(cond); return this; }
    public String build() { return sql.toString(); }
}
// Risk: one shared instance mutated by two threads produces nonsense.

// IMMUTABLE fluent — each step returns a NEW object
public record HttpConfig(String baseUrl, Duration timeout, int retries) {
    public HttpConfig withTimeout(Duration t) { return new HttpConfig(baseUrl, t, retries); }
    public HttpConfig withRetries(int r)      { return new HttpConfig(baseUrl, timeout, r); }
}
var config = base.withTimeout(ofSeconds(5)).withRetries(3);   // thread-safe, shareable</code></pre>
<p><strong>Design rules for a fluent API that people actually enjoy using:</strong></p>
<ul>
<li><strong>Make the required steps unavoidable</strong> — use a staged builder where <code>select()</code> returns a type that only exposes <code>from()</code>, so the compiler enforces the order. That turns a runtime error into a compile error.</li>
<li><strong>Validate in the terminal method</strong> (<code>build()</code>), so an invalid object can never be constructed.</li>
<li><strong>Prefer immutable</strong> unless you are building a large object once, in which case a mutable builder avoids allocating an object per step.</li>
<li><strong>Keep the chain honest</strong> — every method should return something meaningful; a chain that quietly returns <code>this</code> from a method that failed is worse than throwing.</li>
</ul>
<p><strong>The trade-off to acknowledge:</strong> debugging a twelve-call chain is painful — the whole expression is one line, so a stack trace and a breakpoint cannot tell you which step failed. Break long chains into named intermediate variables when clarity matters more than elegance. JDK examples worth citing: <code>Stream</code>, <code>Optional</code>, <code>HttpRequest.newBuilder()</code>, <code>Comparator.comparing().thenComparing()</code>.</p>`
},
{
  q: "How would you prevent a class from being subclassed, and what are the alternatives?",
  level: "advanced", tags: ["oop", "design"],
  companies: ["Amazon", "Microsoft", "Oracle", "EPAM", "ThoughtWorks"],
  a: `<pre><code>// 1. final — nobody can extend it, at all
public final class Money { }

// 2. Private constructor + static factory — no accessible super() to call
public class Money {
    private Money() { }
    public static Money of(String amount) { return new Money(); }
}

// 3. sealed (Java 17) — extension by PERMISSION, the modern middle ground
public sealed class Shape permits Circle, Square, Triangle { }
public final class Circle extends Shape { }
public non-sealed class Square extends Shape { }   // reopens it for further extension</code></pre>
<table>
<tr><th></th><th><code>final</code></th><th>Private constructor</th><th><code>sealed</code></th></tr>
<tr><td>Extension</td><td>Impossible</td><td>Impossible outside the file</td><td>Only the permitted list</td></tr>
<tr><td>Exhaustive switch</td><td>N/A</td><td>N/A</td><td><strong>Yes</strong> — compiler-checked</td></tr>
<tr><td>Best for</td><td>Value objects, utilities</td><td>Factory-controlled types</td><td>Closed domain hierarchies</td></tr>
</table>
<p><strong>Why closing a class is a reasonable default</strong> (Effective Java, Item 19): "design for inheritance or prohibit it". A class open to extension has an <em>additional</em> contract — which methods call which other overridable methods — that must be documented and preserved forever. Most classes were never designed with that in mind, so leaving them open is an accidental promise.</p>
<p><strong>What to offer instead of inheritance:</strong> composition and delegation, a strategy interface injected into the constructor, callbacks or events, and configuration. Those give callers the extensibility they actually wanted without exposing your internals.</p>
<p><strong>Why <code>sealed</code> is the interesting answer:</strong> it gives you a closed set the compiler knows about, which enables exhaustive pattern-matching switches with no <code>default</code> branch — so adding a new subtype breaks the build everywhere it must be handled. That converts a whole class of "someone forgot a case" bugs into compile errors.</p>`
},
{
  q: "Explain the Open/Closed principle failing in real code — how do you detect it?",
  level: "advanced", tags: ["solid", "review"],
  companies: ["Infosys", "Accenture", "Deloitte", "Capgemini", "LTIMindtree"],
  a: `<p><strong>The detection signals in code review:</strong></p>
<ul>
<li>A <code>switch</code> or <code>if/else if</code> chain on a type, status or enum that you have edited more than twice.</li>
<li>A method that grows a new branch with every feature request.</li>
<li><code>instanceof</code> checks to decide behaviour.</li>
<li>A "manager" or "handler" class whose git history shows changes from five different feature tickets.</li>
</ul>
<pre><code>// The smell — every new channel edits this method and re-tests everything
public void notifyUser(User u, String msg, String channel) {
    if ("EMAIL".equals(channel))      { smtp.send(u.email(), msg); }
    else if ("SMS".equals(channel))   { twilio.send(u.phone(), msg); }
    else if ("PUSH".equals(channel))  { fcm.send(u.deviceToken(), msg); }
    else if ("WHATSAPP".equals(channel)) { /* added last sprint */ }
    else throw new IllegalArgumentException(channel);
}

// Open for extension, closed for modification
public interface NotificationChannel {
    Channel type();
    void send(User user, String message);
}

@Service
public class NotificationService {
    private final Map&lt;Channel, NotificationChannel&gt; channels;
    public NotificationService(List&lt;NotificationChannel&gt; all) {
        this.channels = all.stream().collect(toMap(NotificationChannel::type, identity()));
    }
    public void notifyUser(User u, String msg, Channel c) { channels.get(c).send(u, msg); }
}
// Adding WhatsApp = one new @Component. NotificationService is never touched again.</code></pre>
<p><strong>The measurable benefit to state:</strong> in the first version, adding a channel means editing a method that four other channels depend on — so the regression surface is every channel. In the second, the change is purely additive, so code review is trivial and existing tests cannot break.</p>
<p><strong>The honest caveat:</strong> do not build the abstraction for two stable branches. The signal to refactor is the <em>third</em> time you edit the same conditional — that is evidence the axis of change is real, not speculation.</p>`
},
{
  q: "What is an interface with a single abstract method used for, and how has it changed?",
  level: "beginner", tags: ["oop", "lambda"],
  companies: ["TCS", "Wipro", "IBM", "Cognizant", "Optum"],
  a: `<p>A <strong>functional interface</strong> — exactly one abstract method — is the target type for a lambda or method reference. Before Java 8 it needed an anonymous class; now it is one expression.</p>
<pre><code>// Before Java 8 — five lines of ceremony for one line of logic
Collections.sort(list, new Comparator&lt;Employee&gt;() {
    @Override public int compare(Employee a, Employee b) {
        return a.name().compareTo(b.name());
    }
});

// After
list.sort(Comparator.comparing(Employee::name));

// Your own
@FunctionalInterface
public interface RetryPolicy {
    Duration delayFor(int attempt);                      // the single abstract method

    default RetryPolicy cappedAt(Duration max) {          // defaults do NOT break the SAM rule
        return attempt -&gt; min(this.delayFor(attempt), max);
    }
    static RetryPolicy exponential(Duration base) {
        return attempt -&gt; base.multipliedBy(1L &lt;&lt; attempt);
    }
}

RetryPolicy policy = RetryPolicy.exponential(ofMillis(100)).cappedAt(ofSeconds(30));</code></pre>
<p><strong>Details worth knowing:</strong></p>
<ul>
<li><code>@FunctionalInterface</code> is optional but makes the compiler <em>enforce</em> exactly one abstract method — so nobody breaks every lambda by adding a second.</li>
<li><code>default</code>, <code>static</code> and <code>private</code> methods do not count toward the SAM rule, nor do public overrides of <code>Object</code> methods like <code>equals</code> — which is how <code>Comparator</code> stays functional despite declaring <code>equals</code>.</li>
<li><strong>A lambda is not an anonymous class.</strong> It compiles to <code>invokedynamic</code> with no extra class file, and <code>this</code> inside it refers to the <em>enclosing</em> instance rather than the lambda.</li>
</ul>
<p><strong>Prefer the built-ins</strong> — <code>Function</code>, <code>Predicate</code>, <code>Supplier</code>, <code>Consumer</code> — so your API composes with the JDK. Define your own only when the name adds domain meaning (<code>RetryPolicy</code>, <code>Validator</code>) or you need default combinators.</p>`
}
]);
