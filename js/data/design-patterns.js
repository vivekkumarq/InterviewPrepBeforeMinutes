registerTopic("design-patterns", [
{
  q: "What are the categories of design patterns?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>The Gang of Four grouped 23 patterns into three categories:</p>
<ul>
<li><strong>Creational (5)</strong> — how objects are created: Singleton, Factory Method, Abstract Factory, Builder, Prototype.</li>
<li><strong>Structural (7)</strong> — how objects are composed: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy.</li>
<li><strong>Behavioural (11)</strong> — how objects interact: Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor.</li>
</ul>
<blockquote><p><strong>How to answer well:</strong> do not recite the list. Interviewers want to hear which ones you have <em>used</em> and why. A strong answer names three or four you apply regularly (Strategy, Builder, Factory, Template Method) and gives a real example from your work — plus the awareness that patterns are a vocabulary for describing solutions, not a checklist to apply.</p></blockquote>`
},
{
  q: "Explain the Singleton pattern and its problems",
  level: "beginner", hot: true, tags: ["creational"],
  a: `<p>Ensures a class has one instance with a global access point. Covered in detail under concurrency, but the design critique matters here.</p>
<pre><code>// Best implementation — enum. Serialization- and reflection-safe by construction.
public enum ConfigService {
    INSTANCE;
    public String get(String key) { ... }
}

// Second best — holder idiom: lazy, thread-safe, no synchronisation
public class ConfigService {
    private ConfigService() {}
    private static class Holder { static final ConfigService INSTANCE = new ConfigService(); }
    public static ConfigService getInstance() { return Holder.INSTANCE; }
}</code></pre>
<p><strong>Why it is often considered an anti-pattern:</strong></p>
<ul>
<li><strong>Global mutable state</strong> — any code anywhere can change it, so behaviour becomes non-local and hard to reason about.</li>
<li><strong>Untestable</strong> — you cannot substitute a test double, and state leaks between tests, making them order-dependent.</li>
<li><strong>Hidden dependencies</strong> — a class calling <code>ConfigService.getInstance()</code> does not declare that dependency in its constructor, so you cannot see what it needs.</li>
<li><strong>Violates SRP</strong> — the class manages both its own responsibility and its lifecycle.</li>
</ul>
<p><strong>The modern answer:</strong> use a dependency-injection container. A Spring <code>@Component</code> is a singleton <em>instance</em> without being a Singleton <em>pattern</em> — one object, but injected, substitutable and testable. That distinction is exactly what interviewers are listening for.</p>`
},
{
  q: "Factory Method vs Abstract Factory vs Builder",
  level: "advanced", hot: true, tags: ["creational"],
  a: `<pre><code>// FACTORY METHOD — one product, subclass/impl decides which
public interface PaymentProcessor { Receipt charge(Order o); }

@Component
public class PaymentProcessorFactory {
    private final Map&lt;PaymentType, PaymentProcessor&gt; processors;

    public PaymentProcessorFactory(List&lt;PaymentProcessor&gt; all) {   // Spring injects all
        this.processors = all.stream().collect(toMap(PaymentProcessor::type, identity()));
    }
    public PaymentProcessor forType(PaymentType t) {
        return Optional.ofNullable(processors.get(t))
                       .orElseThrow(() -&gt; new UnsupportedPaymentException(t));
    }
}

// ABSTRACT FACTORY — a FAMILY of related products that must match
public interface CloudFactory {
    ObjectStore   objectStore();
    MessageQueue  messageQueue();
    SecretManager secrets();
}
class AwsFactory implements CloudFactory { ... }    // S3 + SQS + Secrets Manager
class GcpFactory implements CloudFactory { ... }    // GCS + PubSub + Secret Manager

// BUILDER — one complex product with many optional parameters
Order order = Order.builder()
        .customerId("c-1")
        .addItem("SKU-9", 2)
        .discount(TEN_PERCENT)
        .expedited(true)
        .build();                      // validate invariants here</code></pre>
<table>
<tr><th></th><th>Intent</th><th>Signal you need it</th></tr>
<tr><td>Factory Method</td><td>Defer <em>which</em> implementation to create</td><td>A <code>switch</code> on a type enum keeps growing</td></tr>
<tr><td>Abstract Factory</td><td>Create families of products that belong together</td><td>Swapping one implementation requires swapping three others consistently</td></tr>
<tr><td>Builder</td><td>Construct a complex object step by step</td><td>A constructor with 6+ parameters, or many optional ones (telescoping constructors)</td></tr>
</table>
<p>In Java, mention that records plus a builder (or Lombok's <code>@Builder</code>) covers most needs, and that a builder's <code>build()</code> is the right place to validate invariants so an invalid object can never exist.</p>`
},
{
  q: "Explain the Strategy pattern with a real example",
  level: "beginner", hot: true, tags: ["behavioural"],
  a: `<p>Define a family of interchangeable algorithms behind a common interface, so the algorithm can vary independently of the client that uses it. It is the canonical way to satisfy the Open/Closed Principle.</p>
<pre><code>public interface DiscountStrategy {
    String code();
    BigDecimal apply(Order order);
}

@Component class NoDiscount      implements DiscountStrategy { ... }
@Component class PercentDiscount implements DiscountStrategy { ... }
@Component class LoyaltyDiscount implements DiscountStrategy { ... }
@Component class SeasonalDiscount implements DiscountStrategy { ... }

@Service
@RequiredArgsConstructor
public class PricingService {
    private final Map&lt;String, DiscountStrategy&gt; strategies;   // Spring injects by bean name

    public BigDecimal priceFor(Order order, String discountCode) {
        return strategies.getOrDefault(discountCode, strategies.get("none"))
                         .apply(order);
    }
}</code></pre>
<p><strong>The before/after that makes the point:</strong> without Strategy you have a growing <code>switch (discountType)</code> that must be <em>modified</em> for every new rule — every change risks breaking existing branches, and the method becomes untestable in isolation. With Strategy, a new rule is a new class plus a <code>@Component</code> annotation; nothing existing is touched.</p>
<p><strong>In modern Java</strong>, a simple strategy is often just a lambda or a <code>Function</code> — <code>Comparator</code> is the JDK's most-used Strategy. Reach for the full interface when the strategy needs a name, configuration, or several methods.</p>`
},
{
  q: "What is the Observer pattern and where is it used in Java/Spring?",
  level: "beginner", tags: ["behavioural"],
  a: `<p>A subject maintains a list of dependents and notifies them automatically when its state changes — one-to-many, with loose coupling because the subject knows only the observer interface.</p>
<pre><code>// Spring's implementation — the idiomatic version
public record OrderPlacedEvent(String orderId, BigDecimal total) { }

@Service @RequiredArgsConstructor
class OrderService {
    private final ApplicationEventPublisher publisher;
    @Transactional public void place(Order o) {
        repo.save(o);
        publisher.publishEvent(new OrderPlacedEvent(o.id(), o.total()));
    }
}

@Component
class InventoryListener {
    @TransactionalEventListener(phase = AFTER_COMMIT)   // only if the tx committed
    @Async
    void on(OrderPlacedEvent e) { inventory.reserve(e.orderId()); }
}</code></pre>
<p><strong>Where you find it:</strong> Spring's <code>ApplicationEvent</code>; Java's deprecated <code>Observable</code>/<code>Observer</code> (deprecated in Java 9 because the API was broken — no type safety, no ordering guarantees); every UI listener API; RxJava and Project Reactor (Observer taken to its logical conclusion with backpressure); and message brokers, which are Observer across a network.</p>
<p><strong>Pitfalls to mention:</strong> memory leaks when observers are never deregistered (a real source of production leaks); unclear notification order; and cascading updates that are hard to trace — which is exactly why event-driven code needs good tracing.</p>`
},
{
  q: "Explain Decorator vs Proxy vs Adapter — they all wrap an object",
  level: "advanced", hot: true, tags: ["structural"],
  a: `<p>Structurally identical (all wrap another object and implement the same or a related interface), but the <em>intent</em> differs completely — which is the whole point of the question.</p>
<table>
<tr><th>Pattern</th><th>Intent</th><th>Interface</th><th>Example</th></tr>
<tr><td><strong>Adapter</strong></td><td>Make an <em>incompatible</em> interface usable</td><td><strong>Changes</strong> it</td><td>Wrapping a legacy SOAP client behind your <code>PaymentGateway</code> interface</td></tr>
<tr><td><strong>Decorator</strong></td><td><em>Add behaviour</em> dynamically</td><td>Same</td><td><code>new BufferedInputStream(new FileInputStream(f))</code></td></tr>
<tr><td><strong>Proxy</strong></td><td><em>Control access</em> to the object</td><td>Same</td><td>Spring AOP, lazy loading, remote stubs, caching</td></tr>
<tr><td><strong>Facade</strong></td><td><em>Simplify</em> a complex subsystem</td><td>New, simpler</td><td>A service class hiding five repositories</td></tr>
</table>
<pre><code>// Decorator — stacked, each adds a responsibility
InputStream in = new GZIPInputStream(
                   new BufferedInputStream(
                     new FileInputStream("data.gz")));

// Decorator in your own code
public class CachingProductRepository implements ProductRepository {
    private final ProductRepository delegate;
    private final Cache cache;
    public Product findById(Long id) {
        return cache.get(id, () -&gt; delegate.findById(id));
    }
}</code></pre>
<p><strong>The distinguishing question:</strong> <em>why</em> are you wrapping? To translate → Adapter. To add a feature the caller opted into → Decorator. To intercept and control (lazily, remotely, with security) usually without the caller knowing → Proxy. To hide complexity behind something simpler → Facade.</p>`
},
{
  q: "What is the Builder pattern and when do you need it?",
  level: "beginner", hot: true, tags: ["creational"],
  a: `<p><strong>The problem it solves:</strong> telescoping constructors. With eight parameters, four optional, you either write sixteen constructors or force callers to pass nulls — and <code>new Pizza(12, true, false, true, null, false)</code> is unreadable and easy to get wrong.</p>
<pre><code>public final class HttpRequest {
    private final String url, method, body;
    private final Map&lt;String,String&gt; headers;
    private final Duration timeout;

    private HttpRequest(Builder b) { ... }

    public static Builder builder(String url) { return new Builder(url); }

    public static final class Builder {
        private final String url;                       // required: in the constructor
        private String method = "GET";                  // optional: with defaults
        private Duration timeout = Duration.ofSeconds(30);
        private final Map&lt;String,String&gt; headers = new LinkedHashMap&lt;&gt;();

        private Builder(String url) { this.url = Objects.requireNonNull(url); }

        public Builder method(String m)              { this.method = m; return this; }
        public Builder header(String k, String v)    { headers.put(k, v); return this; }
        public Builder timeout(Duration d)           { this.timeout = d; return this; }

        public HttpRequest build() {
            if (body != null &amp;&amp; method.equals("GET"))
                throw new IllegalStateException("GET cannot have a body");   // validate here
            return new HttpRequest(this);
        }
    }
}</code></pre>
<p><strong>Key design points:</strong> required parameters go in the builder's constructor so they cannot be forgotten; optional ones get defaults; <code>build()</code> is where you validate cross-field invariants, so an invalid object is impossible to construct; and the result should be immutable.</p>
<p><strong>In practice:</strong> Lombok's <code>@Builder</code> generates all of this, and records plus a builder are the modern combination. JDK examples: <code>StringBuilder</code>, <code>Stream.Builder</code>, <code>HttpRequest.newBuilder()</code>, <code>Calendar.Builder</code>.</p>`
},
{
  q: "What is the Repository pattern and how does it relate to DAO?",
  level: "advanced", tags: ["architecture", "patterns"],
  a: `<table>
<tr><th></th><th>DAO</th><th>Repository</th></tr>
<tr><td>Origin</td><td>J2EE patterns</td><td>Domain-Driven Design</td></tr>
<tr><td>Abstraction level</td><td>Close to the database — one per table</td><td>Domain-oriented — one per <em>aggregate root</em></td></tr>
<tr><td>Mental model</td><td>"Persist this row"</td><td>"A collection of domain objects"</td></tr>
<tr><td>Granularity</td><td>CRUD per table</td><td>Business-meaningful queries</td></tr>
</table>
<pre><code>// DAO-flavoured — mirrors the schema
interface OrderDao { void insert(Order o); Order selectById(Long id); void update(Order o); }

// Repository-flavoured — speaks the domain's language, per aggregate
public interface OrderRepository {
    Optional&lt;Order&gt; findById(OrderId id);
    List&lt;Order&gt; findUnfulfilledOlderThan(Duration age);
    void save(Order order);                 // saves the whole aggregate: order + lines
}</code></pre>
<p><strong>Value of the abstraction:</strong> business logic depends on an interface, not on JPA, so it is testable with an in-memory implementation and the persistence technology can change without touching the domain. That is Dependency Inversion in practice.</p>
<p><strong>The honest counterpoint worth voicing:</strong> Spring Data JPA already gives you a repository interface, so wrapping it in another interface is often speculative — a layer that adds indirection without adding a decision. I would introduce a custom port interface when the domain must stay framework-free (hexagonal architecture) or when I genuinely expect to swap the store, and use Spring Data directly otherwise. Recognising when <em>not</em> to add a layer is itself a design skill.</p>`
},
{
  q: "Explain the Chain of Responsibility pattern",
  level: "advanced", tags: ["behavioural"],
  a: `<p>Pass a request along a chain of handlers; each either handles it or forwards it. The sender does not know which handler will deal with it, and handlers can be added, removed or reordered independently.</p>
<pre><code>public interface ValidationHandler {
    void handle(Order order, ValidationChain chain);
}

@Component @Order(1)
class StockValidator implements ValidationHandler {
    public void handle(Order o, ValidationChain chain) {
        if (!inventory.hasStock(o)) throw new OutOfStockException(o);
        chain.next(o);                       // pass it on
    }
}

@Component @Order(2)
class CreditLimitValidator implements ValidationHandler { ... }

@Component @Order(3)
class FraudCheckValidator implements ValidationHandler { ... }</code></pre>
<p><strong>Where you already use it:</strong> the <strong>Spring Security filter chain</strong> is the textbook example — each filter inspects the request and either handles it or calls <code>chain.doFilter()</code>. Also: servlet filters, Spring MVC interceptors, OkHttp and Netty pipelines, and logging handlers.</p>
<p><strong>Why it is valuable:</strong> each handler is a single responsibility, independently testable, and the pipeline is configured rather than coded. Adding an audit step means adding a class, not editing a 200-line method.</p>
<p><strong>Caveats:</strong> the request may reach the end unhandled (decide whether that is an error), long chains are hard to debug (log which handler acted), and ordering becomes an implicit dependency — make it explicit with <code>@Order</code> rather than relying on scan order.</p>`
},
{
  q: "What is Dependency Injection and how is it a pattern?",
  level: "beginner", hot: true, tags: ["patterns", "spring"],
  a: `<p>DI is the pattern that implements the Dependency Inversion Principle: a class receives its collaborators from outside instead of constructing them.</p>
<pre><code>// Without DI: OrderService is welded to a concrete implementation
class OrderService {
    private final EmailNotifier notifier = new EmailNotifier();   // cannot test, cannot swap
}

// With DI: depends on an abstraction, supplied by the caller/container
class OrderService {
    private final Notifier notifier;
    OrderService(Notifier notifier) { this.notifier = notifier; }
}

// In a test — no framework needed at all
var service = new OrderService(mock(Notifier.class));</code></pre>
<p><strong>Three forms:</strong> constructor (preferred — enforces required dependencies and allows <code>final</code> fields), setter (for genuinely optional dependencies), and interface injection (rare).</p>
<p><strong>What it buys you:</strong> testability, swappable implementations, explicit dependencies visible in the signature, and centralised lifecycle management.</p>
<p><strong>The distinction interviewers probe:</strong> DI is a pattern you can apply by hand — passing collaborators into constructors is dependency injection, no framework required. Spring is an <em>IoC container</em> that automates it. Being clear that the pattern is independent of the framework separates understanding from familiarity.</p>`
},
{
  q: "What is the Command pattern and where is it useful?",
  level: "advanced", tags: ["behavioural"],
  a: `<p>Encapsulate a request as an object, so you can parameterise, queue, log, schedule, retry or undo it.</p>
<pre><code>public interface Command {
    void execute();
    default void undo() { throw new UnsupportedOperationException(); }
}

public record TransferCommand(String from, String to, BigDecimal amount,
                              AccountService service) implements Command {
    public void execute() { service.transfer(from, to, amount); }
    public void undo()    { service.transfer(to, from, amount); }   // compensation
}

// Because it is an object, you can do all of this:
history.push(cmd);                     // undo stack
queue.offer(cmd);                      // defer execution
auditLog.record(cmd);                  // log the intent, not just the effect
scheduler.schedule(cmd, delay);        // schedule
retryTemplate.execute(ctx -&gt; cmd);     // retry</code></pre>
<p><strong>Where it appears in systems you know:</strong> every message consumed from a Kafka topic is effectively a Command; CQRS's write side is literally command objects; a saga's compensating transactions are Commands with <code>undo</code> semantics; <code>Runnable</code> and <code>Callable</code> submitted to an executor are Commands; and any undo/redo feature in an editor.</p>
<p><strong>The key insight to state:</strong> turning a method call into an object separates <em>what</em> to do from <em>when</em> and <em>where</em> it happens. That separation is what makes queuing, auditing and retrying possible — and it is exactly why distributed systems are full of this pattern even when nobody calls it "Command".</p>`
},
{
  q: "How would you design a parking lot system? (LLD)",
  level: "advanced", hot: true, tags: ["lld", "design-question"],
  a: `<p>Classic low-level design. Drive it by clarifying requirements first, then classes, then the tricky parts.</p>
<pre><code>enum VehicleType { MOTORCYCLE, CAR, TRUCK }
enum SpotType    { SMALL, MEDIUM, LARGE }

abstract class Vehicle { String plate; VehicleType type; }

class ParkingSpot {
    String id; SpotType type; Level level;
    String occupiedByTicketId;              // null = free
    boolean canFit(VehicleType v) { ... }
}

class Ticket {
    String id; String plate; String spotId;
    Instant entryTime, exitTime;
    TicketStatus status;                    // ACTIVE, PAID, CLOSED
}

interface PricingStrategy { BigDecimal calculate(Ticket t); }   // Strategy
class HourlyPricing implements PricingStrategy { ... }          // with daily cap, grace period

interface SpotAllocationStrategy { Optional&lt;ParkingSpot&gt; allocate(VehicleType t); }
class NearestFirstAllocation implements SpotAllocationStrategy { ... }

class ParkingLot {                          // the aggregate/facade
    Ticket park(Vehicle v);
    Receipt exit(String ticketId, PaymentMethod pm);
}</code></pre>
<p><strong>The part interviewers actually probe — concurrency.</strong> Two cars must never get the same spot. Do not synchronise the whole lot (it does not scale and does not work across instances). Use an atomic <strong>compare-and-set</strong> in the database:</p>
<pre><code>UPDATE parking_spot
   SET occupied_by = :ticketId, status = 'OCCUPIED'
 WHERE id = :spotId AND status = 'FREE';     -- 0 rows updated = someone won the race
-- retry with the next candidate spot</code></pre>
<p>This avoids table locks entirely and works correctly with multiple application instances. Mention alternatives — pessimistic <code>SELECT ... FOR UPDATE SKIP LOCKED</code> is also excellent here.</p>
<p><strong>Patterns used:</strong> Strategy (pricing, allocation), Factory (vehicle/spot creation), State (ticket lifecycle), Observer (notify when the lot is full). <strong>Extensions to volunteer:</strong> reservations with expiry sweeps, electric-vehicle charging spots, monthly passes, and occupancy/revenue reporting.</p>`
},
{
  q: "Design an elevator system (LLD)",
  level: "advanced", tags: ["lld", "design-question"],
  a: `<pre><code>enum Direction { UP, DOWN, IDLE }
enum DoorState { OPEN, CLOSED }

class Request {                                  // two kinds, deliberately distinguished
    int floor; Direction direction;              // external (hall call)
    // internal (car call) has only a target floor
}

class Elevator {
    int id, currentFloor;
    Direction direction = IDLE;
    DoorState door = CLOSED;
    // the key data structure: two sorted sets
    NavigableSet&lt;Integer&gt; up   = new TreeSet&lt;&gt;();            // stops above, ascending
    NavigableSet&lt;Integer&gt; down = new TreeSet&lt;&gt;(reverseOrder()); // stops below, descending

    void step() {                                 // called each tick
        if (direction == UP &amp;&amp; !up.isEmpty()) { moveTo(up.first()); }
        else if (direction == DOWN &amp;&amp; !down.isEmpty()) { moveTo(down.first()); }
        else { switchDirectionOrIdle(); }
    }
}

interface SchedulingStrategy {                    // Strategy — the interesting part
    Elevator select(List&lt;Elevator&gt; elevators, Request r);
}
class ScanStrategy implements SchedulingStrategy { ... }   // "elevator algorithm"

class ElevatorController {                        // Mediator over all cars
    void requestElevator(int floor, Direction d);
    void selectFloor(int elevatorId, int floor);
}</code></pre>
<p><strong>The algorithm is the substance of the answer.</strong> Naive FIFO is terrible — an elevator at floor 1 heading up should not divert to floor 10 because that request came first. The standard solution is <strong>SCAN (the elevator algorithm)</strong>: keep moving in the current direction, serving every stop along the way, then reverse. That is why the two sorted sets exist — <code>up</code> ascending and <code>down</code> descending mean the next stop is always <code>first()</code>.</p>
<p><strong>Selecting which car</strong> for a hall call: prefer an elevator already moving toward the floor in the same direction, then an idle one nearest by, then the least-loaded. Score candidates rather than using a single rule.</p>
<p><strong>Points that earn credit:</strong> distinguish hall calls from car calls; handle capacity limits, door timings and emergency/maintenance modes; make the controller thread-safe since requests arrive concurrently; and mention that this is a real-time system where a tick-based simulation is easier to test than event-driven timers.</p>`
},
{
  q: "What is the State pattern? Design an order state machine",
  level: "advanced", tags: ["behavioural", "lld"],
  a: `<p>Allow an object to alter its behaviour when its internal state changes — the object appears to change class. It replaces sprawling conditionals with one class per state.</p>
<pre><code>public enum OrderStatus {
    CREATED   { public Set&lt;OrderStatus&gt; next() { return Set.of(PAID, CANCELLED); } },
    PAID      { public Set&lt;OrderStatus&gt; next() { return Set.of(SHIPPED, REFUNDED); } },
    SHIPPED   { public Set&lt;OrderStatus&gt; next() { return Set.of(DELIVERED, RETURNED); } },
    DELIVERED { public Set&lt;OrderStatus&gt; next() { return Set.of(RETURNED); } },
    CANCELLED { public Set&lt;OrderStatus&gt; next() { return Set.of(); } },   // terminal
    REFUNDED  { public Set&lt;OrderStatus&gt; next() { return Set.of(); } },
    RETURNED  { public Set&lt;OrderStatus&gt; next() { return Set.of(REFUNDED); } };

    public abstract Set&lt;OrderStatus&gt; next();
    public boolean canTransitionTo(OrderStatus target) { return next().contains(target); }
}

@Entity
public class Order {
    private OrderStatus status = CREATED;

    public void transitionTo(OrderStatus target) {
        if (!status.canTransitionTo(target))
            throw new IllegalStateTransitionException(status, target);   // guard the invariant
        this.status = target;
        registerEvent(new OrderStatusChanged(id, status, target));
    }
}</code></pre>
<p><strong>Why this beats <code>if (status == ...)</code> scattered across services:</strong> the transition rules live in exactly one place, illegal transitions are impossible rather than merely unlikely, and adding a state is a local change. It also makes the state machine <em>documentation</em> — a new team member can read the whole lifecycle in one enum.</p>
<p><strong>Extensions worth mentioning:</strong> persist every transition as an audit trail (who, when, why); publish a domain event on each change so other services react; add guard conditions and side effects per transition; and for genuinely complex workflows use a state machine library (Spring State Machine) or a workflow engine (Temporal, Camunda) rather than hand-rolling.</p>`
},
{
  q: "What is the Facade pattern and when do you use it?",
  level: "beginner", tags: ["structural"],
  a: `<p>Provide a simple, unified interface to a complex subsystem. The subsystem still exists and can be used directly; the facade just gives clients an easier default path.</p>
<pre><code>// Without a facade, the controller must orchestrate five collaborators
@RestController
class CheckoutController {
    // inventory, pricing, payment, shipping, notification, audit... all injected here
}

// With a facade — the controller has one dependency and one call
@Service
@RequiredArgsConstructor
public class CheckoutFacade {
    private final InventoryService inventory;
    private final PricingService pricing;
    private final PaymentService payment;
    private final ShippingService shipping;

    @Transactional
    public CheckoutResult checkout(CheckoutRequest req) {
        inventory.reserve(req.items());
        var total = pricing.calculate(req);
        var receipt = payment.charge(req.paymentMethod(), total);
        shipping.schedule(req.address(), req.items());
        return new CheckoutResult(receipt.id(), total);
    }
}</code></pre>
<p><strong>Where you see it:</strong> a Spring <code>@Service</code> coordinating several repositories is a facade; <code>JdbcTemplate</code> is a facade over raw JDBC; SLF4J is a facade over logging implementations (it is in the name); and an API gateway is a facade over microservices.</p>
<p><strong>Facade vs Adapter:</strong> a facade <em>simplifies</em> an interface you control; an adapter <em>translates</em> an interface you do not. <strong>Warning:</strong> a facade that keeps accumulating responsibilities becomes a god class — if it grows past a few coherent operations, split it.</p>`
},
{
  q: "Which patterns do you actually use day to day, and which do you avoid?",
  level: "advanced", hot: true, tags: ["experience", "judgement"],
  a: `<p><strong>Used constantly:</strong></p>
<ul>
<li><strong>Dependency Injection</strong> — every class.</li>
<li><strong>Strategy</strong> — anywhere a <code>switch</code> on a type would otherwise grow: payment providers, discount rules, export formats, notification channels.</li>
<li><strong>Builder</strong> — complex requests, test data builders, immutable value objects.</li>
<li><strong>Factory</strong> — usually as a Spring-injected map of implementations keyed by an enum.</li>
<li><strong>Template Method</strong> — mostly by <em>using</em> Spring's templates rather than writing my own.</li>
<li><strong>Observer</strong> — domain events for decoupling, then Kafka across services.</li>
<li><strong>Adapter</strong> — every integration with a third-party API gets one, so their model never leaks into my domain.</li>
</ul>
<p><strong>Used rarely or avoided:</strong></p>
<ul>
<li><strong>Singleton</strong> (the classic static form) — replaced by container-managed beans.</li>
<li><strong>Visitor</strong> — powerful but hard to read; pattern matching in Java 21 covers most of its use cases now.</li>
<li><strong>Flyweight, Interpreter, Memento, Bridge</strong> — legitimate, but I have rarely met the problem they solve.</li>
<li><strong>Abstract Factory</strong> — usually over-engineering unless you genuinely swap whole families of implementations.</li>
</ul>
<blockquote><p><strong>The judgement to express:</strong> "Patterns are a vocabulary for solutions that emerge, not a design to impose up front. I reach for one when I notice the problem it solves — a growing conditional, a constructor with too many arguments, a class that changes for three reasons. Applying a pattern before the pain exists usually adds indirection without adding value, and that is a cost the next developer pays."</p></blockquote>`
}
]);
