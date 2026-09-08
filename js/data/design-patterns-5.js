appendTopic("design-patterns", [
{
  q: "Design a parking lot — the classic low-level design round",
  level: "advanced", hot: true, tags: ["design", "oop", "solid", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Walmart", "Uber", "Oracle", "Optum"],
  a: `<p><strong>Start by clarifying, not coding.</strong> Multiple floors? Vehicle types? Pricing model? Multiple entry and exit gates? Then state your assumptions and move — a candidate who designs in silence for ten minutes scores worse than one who asks three questions and commits.</p>
<pre><code>// 1. MODEL THE DOMAIN — nouns first
public enum VehicleType { MOTORCYCLE, CAR, TRUCK }

public abstract class Vehicle {
    private final String registration;
    private final VehicleType type;
    protected Vehicle(String reg, VehicleType type) { this.registration = reg; this.type = type; }
    public VehicleType type() { return type; }
}
public class Car extends Vehicle { public Car(String r) { super(r, VehicleType.CAR); } }

public class ParkingSpot {
    private final String id;
    private final VehicleType size;
    private Vehicle occupant;              // null = free

    public boolean canFit(Vehicle v) { return occupant == null &amp;&amp; size.ordinal() &gt;= v.type().ordinal(); }
    public synchronized boolean park(Vehicle v) {
        if (!canFit(v)) return false;
        occupant = v;
        return true;
    }
    public synchronized Vehicle release() { Vehicle v = occupant; occupant = null; return v; }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Parking lot class relationships">
  <rect class="dg-fill" x="230" y="14" width="150" height="30" rx="6"/><text class="dg-s" x="305" y="34" text-anchor="middle">ParkingLot</text>
  <path class="dg-line" d="M270 44 L150 76 M340 44 L460 76"/>
  <rect class="dg-fill2" x="86" y="76" width="130" height="30" rx="6"/><text class="dg-s" x="151" y="96" text-anchor="middle">Level *</text>
  <rect class="dg-fill2" x="396" y="76" width="130" height="30" rx="6"/><text class="dg-s" x="461" y="96" text-anchor="middle">Gate *</text>
  <path class="dg-line" d="M151 106 V128"/>
  <rect class="dg-box" x="86" y="128" width="130" height="30" rx="6"/><text class="dg-s" x="151" y="148" text-anchor="middle">ParkingSpot *</text>
  <path class="dg-line" d="M461 106 V128"/>
  <rect class="dg-box" x="396" y="128" width="130" height="30" rx="6"/><text class="dg-s" x="461" y="148" text-anchor="middle">Ticket</text>
  <text class="dg-s" x="16" y="34">strategies plug in:</text>
  <text class="dg-s" x="16" y="54">SpotAllocation,</text>
  <text class="dg-s" x="16" y="74">PricingStrategy</text>
</svg>
</figure>
<pre><code>// 2. PLUG IN THE VARYING PARTS AS STRATEGIES — this is what earns the marks
public interface SpotAllocationStrategy {
    Optional&lt;ParkingSpot&gt; allocate(List&lt;Level&gt; levels, Vehicle vehicle);
}
public class NearestToEntranceStrategy implements SpotAllocationStrategy { }
public class LowestFloorFirstStrategy   implements SpotAllocationStrategy { }

public interface PricingStrategy { Money calculate(Ticket ticket, Instant exit); }
public class HourlyPricing   implements PricingStrategy { }
public class DayPassPricing  implements PricingStrategy { }
public class WeekendSurgePricing implements PricingStrategy { }   // added with NO edits

// 3. THE SERVICE coordinates; it does not contain the rules
public class ParkingLotService {
    private final List&lt;Level&gt; levels;
    private final SpotAllocationStrategy allocation;
    private final PricingStrategy pricing;
    private final Map&lt;String, Ticket&gt; active = new ConcurrentHashMap&lt;&gt;();

    public Ticket park(Vehicle v) {
        ParkingSpot spot = allocation.allocate(levels, v)
            .orElseThrow(() -&gt; new ParkingFullException(v.type()));
        if (!spot.park(v)) return park(v);            // lost the race, retry
        Ticket t = new Ticket(UUID.randomUUID().toString(), v, spot, Instant.now());
        active.put(t.id(), t);
        return t;
    }

    public Money unpark(String ticketId) {
        Ticket t = Optional.ofNullable(active.remove(ticketId))
            .orElseThrow(() -&gt; new InvalidTicketException(ticketId));
        t.spot().release();
        return pricing.calculate(t, Instant.now());
    }
}</code></pre>
<table>
<tr><th>Pattern used</th><th>Where</th><th>Why</th></tr>
<tr><td><strong>Strategy</strong></td><td>Allocation, pricing</td><td>New rules are new classes, not edits — open/closed</td></tr>
<tr><td><strong>Factory</strong></td><td><code>VehicleFactory</code></td><td>Creation logic in one place</td></tr>
<tr><td><strong>Singleton</strong></td><td><code>ParkingLot</code></td><td>Mention it, but prefer DI — a hard-coded singleton is untestable</td></tr>
<tr><td><strong>Observer</strong></td><td>Display boards, notifications</td><td>Availability changes fan out without the service knowing the listeners</td></tr>
<tr><td><strong>State</strong></td><td>Ticket lifecycle</td><td>ISSUED → PAID → EXITED with legal transitions enforced</td></tr>
</table>
<p><strong>The follow-up they will ask:</strong> "two cars arrive at different gates and are assigned the same spot." That is a concurrency question, and the answer is that spot assignment must be atomic — a synchronised claim on the spot, an <code>AtomicReference</code> compare-and-set, or a conditional database update. Handling it with a retry, as above, is what separates a design that works from one that only reads well.</p>
<p><strong>How to be graded well:</strong> talk while you draw, name the patterns as you apply them, and explain <em>why</em> each abstraction exists. An interviewer is checking whether adding "electric vehicle charging spots" or "monthly subscribers" means editing existing classes or adding new ones — that is the real test.</p>`
},
{
  q: "Explain the Builder pattern and when it beats a constructor",
  level: "beginner", hot: true, tags: ["patterns", "design", "best-practice"],
  companies: ["Amazon", "Adobe", "TCS", "Infosys", "Oracle", "SAP", "Cognizant", "Zoho"],
  a: `<pre><code>// The problem — the telescoping constructor
public Pizza(String size) { }
public Pizza(String size, boolean cheese) { }
public Pizza(String size, boolean cheese, boolean pepperoni) { }
public Pizza(String size, boolean cheese, boolean pepperoni, boolean mushroom) { }
new Pizza("L", true, false, true, false, true);   // what does any of that mean?

// The other bad option — a JavaBean with setters
Pizza p = new Pizza();
p.setSize("L");
p.setCheese(true);
// The object is INVALID between construction and the last setter, it can
// never be immutable, and nothing forces the required fields to be set.</code></pre>
<pre><code>// ✔ BUILDER — readable, immutable, validated once
public final class Pizza {
    private final Size size;                 // required
    private final List&lt;Topping&gt; toppings;    // optional
    private final boolean extraCheese;

    private Pizza(Builder b) {
        this.size = b.size;
        this.toppings = List.copyOf(b.toppings);    // defensive copy
        this.extraCheese = b.extraCheese;
    }

    public static Builder builder(Size size) { return new Builder(size); }   // required arg

    public static final class Builder {
        private final Size size;
        private final List&lt;Topping&gt; toppings = new ArrayList&lt;&gt;();
        private boolean extraCheese;

        private Builder(Size size) { this.size = Objects.requireNonNull(size); }

        public Builder topping(Topping t) { toppings.add(t); return this; }   // fluent
        public Builder extraCheese()      { this.extraCheese = true; return this; }

        public Pizza build() {
            if (toppings.size() &gt; 8) throw new IllegalArgumentException("too many toppings");
            return new Pizza(this);          // ONE place to validate invariants
        }
    }
}

Pizza p = Pizza.builder(LARGE).topping(PEPPERONI).topping(OLIVE).extraCheese().build();</code></pre>
<table>
<tr><th>Use a builder when</th><th>Do not bother when</th></tr>
<tr><td>More than about 4 parameters</td><td>2–3 parameters — a constructor is clearer</td></tr>
<tr><td>Many are optional</td><td>All are required</td></tr>
<tr><td>Several have the same type (easy to swap by accident)</td><td>Types are distinct, so the compiler catches mistakes</td></tr>
<tr><td>You want immutability plus validation</td><td>It is a mutable entity anyway (a JPA <code>@Entity</code>)</td></tr>
<tr><td>Construction happens in steps</td><td>Everything is available at once</td></tr>
</table>
<pre><code>// The modern alternatives worth naming
record Pizza(Size size, List&lt;Topping&gt; toppings, boolean extraCheese) {
    Pizza {                                          // compact constructor validates
        toppings = List.copyOf(toppings);            // and defensively copies
    }
}
// Records cover the immutable-data-carrier case with no boilerplate.
// A builder still wins when there are many OPTIONAL fields, because
// a record constructor requires every component.

// Lombok, if the project already uses it
@Builder @Value public class Pizza { }

// And the "step builder" variant, which makes required fields UNSKIPPABLE:
// Pizza.builder().size(LARGE).crust(THIN).build()
// Each method returns a different interface, so the compiler enforces the order.</code></pre>
<p><strong>Where you have already used it:</strong> <code>StringBuilder</code>, <code>Stream.Builder</code>, <code>HttpRequest.newBuilder()</code>, <code>Calendar.Builder</code>, and almost every AWS SDK v2 client. Naming a JDK example rather than a textbook one makes the answer concrete.</p>
<p><strong>The distinction to draw if pushed:</strong> the Gang of Four Builder separates construction from representation so the same steps can build different products (a document exported as HTML or PDF). What most developers call a builder is really Effective Java's <em>fluent construction</em> idiom for readability and immutability. Both are legitimate; knowing they are different is the point.</p>`
},
{
  q: "Design a rate-limited notification service — combining patterns",
  level: "advanced", tags: ["design", "patterns", "scenario"],
  companies: ["Amazon", "Flipkart", "Swiggy", "Uber", "Walmart", "Optum", "Paytm", "Adobe"],
  a: `<p>This is a favourite because it needs several patterns to combine cleanly — and it exposes anyone who has memorised patterns without knowing when to apply them.</p>
<pre><code>// STRATEGY — one per channel, chosen at runtime
public interface NotificationChannel {
    ChannelType type();
    void send(Notification n) throws ChannelException;
}
@Component class EmailChannel implements NotificationChannel { }
@Component class SmsChannel   implements NotificationChannel { }
@Component class PushChannel  implements NotificationChannel { }

// FACTORY via Spring — no switch statement, and adding a channel touches nothing
@Service
public class ChannelRegistry {
    private final Map&lt;ChannelType, NotificationChannel&gt; channels;
    ChannelRegistry(List&lt;NotificationChannel&gt; all) {
        this.channels = all.stream().collect(toMap(NotificationChannel::type, identity()));
    }
    NotificationChannel get(ChannelType t) {
        return Optional.ofNullable(channels.get(t))
            .orElseThrow(() -&gt; new UnsupportedChannelException(t));
    }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Notification pipeline with decorators wrapping a channel">
  <rect class="dg-fill" x="16" y="62" width="86" height="36" rx="6"/><text class="dg-s" x="59" y="84" text-anchor="middle">request</text>
  <path class="dg-line" d="M106 80 H144" marker-end="url(#np1)"/>
  <rect class="dg-fill2" x="148" y="62" width="96" height="36" rx="6"/><text class="dg-s" x="196" y="84" text-anchor="middle">rate limit</text>
  <path class="dg-line" d="M248 80 H286" marker-end="url(#np1)"/>
  <rect class="dg-fill2" x="290" y="62" width="96" height="36" rx="6"/><text class="dg-s" x="338" y="84" text-anchor="middle">preferences</text>
  <path class="dg-line" d="M390 80 H428" marker-end="url(#np1)"/>
  <rect class="dg-fill2" x="432" y="62" width="86" height="36" rx="6"/><text class="dg-s" x="475" y="84" text-anchor="middle">retry</text>
  <path class="dg-line" d="M522 80 H556" marker-end="url(#np1)"/>
  <rect class="dg-box" x="516" y="112" width="96" height="32" rx="6"/><text class="dg-s" x="564" y="132" text-anchor="middle">channel</text>
  <text class="dg-s" x="16" y="32">each stage is a DECORATOR wrapping the next — order is configuration, not code</text>
  <defs><marker id="np1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// DECORATOR — cross-cutting behaviour without touching any channel
public class RateLimitedChannel implements NotificationChannel {
    private final NotificationChannel delegate;
    private final RateLimiter limiter;

    public ChannelType type() { return delegate.type(); }

    public void send(Notification n) {
        if (!limiter.tryAcquire(n.recipientId())) {
            throw new RateLimitExceededException(n.recipientId());
        }
        delegate.send(n);
    }
}

public class RetryingChannel implements NotificationChannel {
    private final NotificationChannel delegate;
    public void send(Notification n) {
        // exponential backoff, then dead-letter
    }
}

// Composition, decided in configuration
NotificationChannel email =
    new RateLimitedChannel(
        new RetryingChannel(
            new MetricsChannel(new EmailChannel())), limiter);</code></pre>
<pre><code>// TEMPLATE METHOD — the fixed pipeline, with variable steps
public abstract class NotificationPipeline {
    public final void process(Notification n) {      // final: the ORDER is invariant
        validate(n);
        if (!shouldSend(n)) return;                  // user preferences, quiet hours
        enrich(n);                                    // localise, personalise
        dispatch(n);
        record(n);
    }
    protected abstract void dispatch(Notification n);
    protected void enrich(Notification n) { }         // optional hook
}

// OBSERVER — delivery events fan out to analytics, audit and the user timeline
publisher.publishEvent(new NotificationDelivered(n.id(), channel.type(), Instant.now()));

// BUILDER — notifications have many optional fields
Notification n = Notification.builder(userId, TEMPLATE_ORDER_SHIPPED)
    .channel(EMAIL).channel(PUSH)
    .param("orderId", 421)
    .priority(HIGH)
    .idempotencyKey(key)
    .build();</code></pre>
<table>
<tr><th>Requirement</th><th>Pattern</th></tr>
<tr><td>Multiple delivery channels</td><td>Strategy + registry factory</td></tr>
<tr><td>Rate limiting, retry, metrics</td><td><strong>Decorator</strong> — stackable, order configurable</td></tr>
<tr><td>Fixed processing order, varying steps</td><td>Template method</td></tr>
<tr><td>Downstream reactions to delivery</td><td>Observer / domain events</td></tr>
<tr><td>Complex optional payloads</td><td>Builder</td></tr>
<tr><td>Channel fails and must fall back</td><td>Chain of responsibility — try push, then SMS, then email</td></tr>
</table>
<p><strong>The judgement to show:</strong> "I would not apply all of these on day one. Strategy and the registry are worth it immediately because channels genuinely vary. Decorators earn their place once there are two or three cross-cutting concerns — before that, a couple of if-statements is clearer. Patterns are a response to change that has actually happened, not a checklist to satisfy up front."</p>`
}
]);
