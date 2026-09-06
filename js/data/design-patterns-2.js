appendTopic("design-patterns", [
{
  q: "Design a rate limiter class (LLD)",
  level: "advanced", hot: true, tags: ["lld", "design-question"],
  a: `<pre><code>public interface RateLimiter {
    boolean tryAcquire(String key, int permits);
}

// Token bucket — allows controlled bursts while capping the average rate
public class TokenBucketRateLimiter implements RateLimiter {

    private record Bucket(double tokens, long lastRefillNanos) { }

    private final ConcurrentHashMap&lt;String, Bucket&gt; buckets = new ConcurrentHashMap&lt;&gt;();
    private final double capacity;
    private final double refillPerNano;
    private final Clock clock;                       // injected — makes it testable

    @Override
    public boolean tryAcquire(String key, int permits) {
        // compute() is atomic per key, so no lost updates under contention
        var result = buckets.compute(key, (k, b) -&gt; {
            long now = clock.nanoTime();
            if (b == null) return new Bucket(capacity - permits, now);

            double refilled = Math.min(capacity,
                    b.tokens() + (now - b.lastRefillNanos()) * refillPerNano);
            return refilled &gt;= permits
                    ? new Bucket(refilled - permits, now)
                    : new Bucket(refilled, now);      // unchanged token count = rejected
        });
        return result.tokens() &gt;= 0;
    }
}</code></pre>
<p><strong>Design decisions to talk through:</strong></p>
<ul>
<li><strong>Interface first</strong>, so the algorithm is swappable — token bucket, sliding window, leaky bucket all satisfy the same contract (Strategy pattern).</li>
<li><strong>Lazy refill</strong> — compute tokens from elapsed time on access rather than running a background thread per key. That is the trick that makes this scale to millions of keys.</li>
<li><strong>Inject the clock</strong> — otherwise the class is untestable without <code>Thread.sleep</code>.</li>
<li><strong>Atomicity</strong> — <code>compute</code> holds the bucket lock, so concurrent requests for the same key cannot both consume the last token.</li>
<li><strong>Eviction</strong> — this map grows forever. Bound it with an LRU or a TTL, or you have built a memory leak.</li>
</ul>
<p><strong>The follow-up to anticipate:</strong> "now make it work across ten instances." The answer is a shared store — Redis with a Lua script so check-and-consume stays atomic in one round trip — plus a decision about the failure mode when Redis is unavailable (fail open for availability, fail closed for protection).</p>`
},
{
  q: "Design a notification service with multiple channels (LLD)",
  level: "advanced", tags: ["lld", "design-question"],
  a: `<pre><code>// Strategy: one implementation per channel
public interface NotificationChannel {
    ChannelType type();
    boolean supports(Notification n);
    DeliveryResult send(Notification n);
}

@Component class EmailChannel implements NotificationChannel { }
@Component class SmsChannel   implements NotificationChannel { }
@Component class PushChannel  implements NotificationChannel { }

// Factory/registry built from injected strategies
@Service
public class NotificationDispatcher {
    private final Map&lt;ChannelType, NotificationChannel&gt; channels;
    private final PreferenceService preferences;
    private final TemplateRenderer renderer;
    private final DeduplicationService dedup;

    public NotificationDispatcher(List&lt;NotificationChannel&gt; all, ...) {
        this.channels = all.stream().collect(toMap(NotificationChannel::type, identity()));
    }

    public void dispatch(NotificationRequest req) {
        if (!dedup.firstTime(req.dedupKey())) return;                 // idempotency

        for (ChannelType ch : preferences.channelsFor(req.userId(), req.type())) {
            if (preferences.inQuietHours(req.userId())) { schedule(req, ch); continue; }
            var rendered = renderer.render(req.templateId(), ch, req.locale(), req.data());
            outbox.enqueue(ch, rendered);                              // never send inline
        }
    }
}

// Decorator: add retry and metrics without touching the channel implementations
public class RetryingChannel implements NotificationChannel {
    private final NotificationChannel delegate;
    public DeliveryResult send(Notification n) {
        return retryTemplate.execute(ctx -&gt; delegate.send(n));
    }
}</code></pre>
<p><strong>Patterns used, and why:</strong> <strong>Strategy</strong> for channels (adding WhatsApp is a new class, nothing else changes), <strong>Factory/registry</strong> for lookup, <strong>Decorator</strong> for retry, circuit breaking and metrics, <strong>Template Method</strong> for the render-then-send skeleton, and <strong>Observer</strong> for delivery-status events.</p>
<p><strong>The design points that separate a good answer:</strong> never call a third-party provider inside the request transaction — enqueue and let workers deliver; deduplicate so a retry upstream does not send five emails; check user preferences and quiet hours <em>centrally</em> rather than in each producer, or compliance becomes unenforceable; and abstract the provider behind the channel so a vendor outage is a configuration change rather than an incident.</p>`
},
{
  q: "What is the Adapter pattern and how do you use it for third-party integrations?",
  level: "advanced", hot: true, tags: ["patterns", "architecture"],
  a: `<p>An adapter converts a third-party interface into the interface <em>your</em> domain wants, so their model never leaks into your code.</p>
<pre><code>// YOUR interface — expressed in your domain's language
public interface PaymentGateway {
    PaymentResult charge(Money amount, PaymentMethod method, String idempotencyKey);
    RefundResult refund(String paymentId, Money amount);
}

// Adapter for a specific vendor — all their concepts stop here
@Component
class StripePaymentGateway implements PaymentGateway {
    private final StripeClient stripe;

    public PaymentResult charge(Money amount, PaymentMethod method, String key) {
        try {
            var params = PaymentIntentCreateParams.builder()
                    .setAmount(amount.minorUnits())        // their API wants minor units
                    .setCurrency(amount.currency().getCurrencyCode().toLowerCase())
                    .setPaymentMethod(method.token())
                    .build();
            var intent = stripe.paymentIntents().create(params, requestOptions(key));
            return PaymentResult.success(intent.getId());
        } catch (CardException e) {
            return PaymentResult.declined(mapDeclineReason(e.getDeclineCode()));  // THEIR codes -&gt; YOURS
        } catch (StripeException e) {
            throw new PaymentGatewayException("stripe call failed", e);           // THEIR exception -&gt; YOURS
        }
    }
}</code></pre>
<p><strong>Why this matters more than it looks:</strong></p>
<ul>
<li><strong>Your domain never imports a vendor class.</strong> Switching provider, or running two in parallel for failover, is adding one class.</li>
<li><strong>Testability</strong> — unit tests use a fake <code>PaymentGateway</code>; only the adapter needs integration tests against the real API.</li>
<li><strong>Error translation happens in one place.</strong> Vendor error codes, retry semantics and exception types are mapped at the boundary, so business code deals with <code>PaymentResult.declined(INSUFFICIENT_FUNDS)</code> rather than a vendor string.</li>
<li><strong>It contains breaking changes</strong> — a vendor SDK upgrade touches one file.</li>
</ul>
<p>This is the <strong>ports and adapters</strong> (hexagonal) idea in miniature: the interface is the port, the vendor-specific class is the adapter, and the dependency points inward. It is the single highest-value structural pattern for any system that integrates with external services — which is most systems.</p>`
},
{
  q: "Design an LRU cache from scratch (LLD)",
  level: "advanced", hot: true, tags: ["lld", "data-structures"],
  a: `<p><strong>Requirement:</strong> O(1) <code>get</code> and <code>put</code>, evicting the least recently used entry when full. The key insight is that no single data structure gives you both — you need <strong>a hash map for lookup plus a doubly linked list for ordering</strong>.</p>
<pre><code>public class LRUCache&lt;K, V&gt; {
    private static class Node&lt;K, V&gt; { K key; V value; Node&lt;K,V&gt; prev, next; }

    private final Map&lt;K, Node&lt;K,V&gt;&gt; map = new HashMap&lt;&gt;();
    private final Node&lt;K,V&gt; head = new Node&lt;&gt;();      // sentinels remove all null checks
    private final Node&lt;K,V&gt; tail = new Node&lt;&gt;();
    private final int capacity;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail; tail.prev = head;
    }

    public V get(K key) {
        Node&lt;K,V&gt; n = map.get(key);
        if (n == null) return null;
        moveToFront(n);                               // mark as most recently used
        return n.value;
    }

    public void put(K key, V value) {
        Node&lt;K,V&gt; existing = map.get(key);
        if (existing != null) { existing.value = value; moveToFront(existing); return; }

        if (map.size() == capacity) {
            Node&lt;K,V&gt; lru = tail.prev;                // least recently used is at the tail
            remove(lru);
            map.remove(lru.key);                      // MUST remove from the map too
        }
        Node&lt;K,V&gt; node = new Node&lt;&gt;(key, value);
        addFirst(node);
        map.put(key, node);
    }

    private void moveToFront(Node&lt;K,V&gt; n) { remove(n); addFirst(n); }
    private void remove(Node&lt;K,V&gt; n)      { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFirst(Node&lt;K,V&gt; n)    { n.next = head.next; n.prev = head;
                                            head.next.prev = n; head.next = n; }
}</code></pre>
<p><strong>Points that earn marks:</strong> the sentinel head and tail nodes eliminate every null check in the pointer surgery — the most common source of bugs in this problem. Remembering to remove the evicted key from the <em>map</em> as well as the list is the second. And the doubly linked list is required because removing a node in O(1) needs its predecessor.</p>
<p><strong>Follow-ups:</strong> thread safety (wrap in a lock, or use <code>ConcurrentHashMap</code> plus a concurrent ordering structure — genuinely hard, which is why real implementations use sampling); TTL support; and the practical answer that <code>LinkedHashMap</code> with <code>accessOrder=true</code> and <code>removeEldestEntry</code> gives you this in six lines, while <strong>Caffeine</strong> is what you would actually use in production.</p>`
},
{
  q: "What is the Specification pattern and when is it useful?",
  level: "advanced", tags: ["patterns", "design"],
  a: `<p>Encapsulate a business rule as an object that can be evaluated, combined and reused — instead of scattering the same condition across services, validators and queries.</p>
<pre><code>public interface Specification&lt;T&gt; {
    boolean isSatisfiedBy(T candidate);

    default Specification&lt;T&gt; and(Specification&lt;T&gt; other) {
        return c -&gt; this.isSatisfiedBy(c) &amp;&amp; other.isSatisfiedBy(c);
    }
    default Specification&lt;T&gt; or(Specification&lt;T&gt; other) {
        return c -&gt; this.isSatisfiedBy(c) || other.isSatisfiedBy(c);
    }
    default Specification&lt;T&gt; not() { return c -&gt; !this.isSatisfiedBy(c); }
}

// Rules become named, testable, reusable objects
class PremiumCustomer implements Specification&lt;Customer&gt; {
    public boolean isSatisfiedBy(Customer c) { return c.lifetimeValue().compareTo(THRESHOLD) &gt; 0; }
}
class InGoodStanding implements Specification&lt;Customer&gt; {
    public boolean isSatisfiedBy(Customer c) { return !c.hasOverduePayments(); }
}

var eligibleForCredit = new PremiumCustomer().and(new InGoodStanding());
if (eligibleForCredit.isSatisfiedBy(customer)) { ... }</code></pre>
<p><strong>Why this is more than a fancy predicate:</strong> the rule gets a <em>name</em> from the business domain, it lives in one place, it is unit-testable in isolation, and it can be composed without modification. When the definition of "premium" changes, you change one class — not the seven services that each reimplemented the check slightly differently.</p>
<p><strong>The version you have probably used:</strong> Spring Data's <code>Specification</code> applies the same idea to queries, translating the composed rule into a JPA Criteria predicate — so the same composition mechanism builds dynamic SQL for a search screen:</p>
<pre><code>public static Specification&lt;Order&gt; hasStatus(OrderStatus s) {
    return (root, q, cb) -&gt; s == null ? null : cb.equal(root.get("status"), s);
}
repo.findAll(hasStatus(status).and(createdAfter(from)).and(totalAbove(min)), pageable);</code></pre>
<p><strong>The limitation to acknowledge:</strong> an in-memory specification cannot be pushed into the database, so filtering a million rows in Java is wrong. That is exactly why Spring Data has a query-building variant — and knowing when you need the query version rather than the predicate version is the real skill.</p>`
},
{
  q: "Design a parking lot's pricing and reservation module (LLD follow-up)",
  level: "advanced", tags: ["lld", "design-question"],
  a: `<pre><code>// Strategy for pricing — rules change constantly, so isolate them
public interface PricingStrategy {
    Money calculate(Ticket ticket, Instant exitTime);
}

@Component
public class TieredHourlyPricing implements PricingStrategy {
    public Money calculate(Ticket t, Instant exit) {
        Duration parked = Duration.between(t.entryTime(), exit);

        if (parked.compareTo(GRACE_PERIOD) &lt;= 0) return Money.ZERO;      // free grace period

        long billableHours = (long) Math.ceil(parked.toMinutes() / 60.0); // round UP
        Money total = rateTable.forVehicle(t.vehicleType())
                               .costFor(billableHours);

        return Money.min(total, dailyCapFor(t.vehicleType())            // daily cap
                                  .multiply(daysSpanned(t.entryTime(), exit)));
    }
}

// Reservations with expiry — the concurrency-sensitive part
@Service
public class ReservationService {

    @Transactional
    public Reservation reserve(VehicleType type, Instant from, Duration window) {
        // Atomic claim: 0 rows updated means someone else won the race
        int claimed = spotRepo.claimAvailableSpot(type, from, from.plus(window));
        if (claimed == 0) throw new NoSpotAvailableException(type);
        return reservationRepo.save(new Reservation(..., from.plus(HOLD_TTL)));
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireStaleReservations() {
        int released = reservationRepo.expireOlderThan(Instant.now());   // sweep
        if (released &gt; 0) log.info("released {} expired reservations", released);
    }
}</code></pre>
<pre><code>-- The allocation query: compare-and-set, no table lock
UPDATE parking_spot SET status = 'RESERVED', reserved_until = :until
WHERE id = (SELECT id FROM parking_spot
            WHERE type = :type AND status = 'FREE'
            ORDER BY level, id
            LIMIT 1 FOR UPDATE SKIP LOCKED)      -- SKIP LOCKED avoids contention
RETURNING id;</code></pre>
<p><strong>The details interviewers probe:</strong> money as <code>BigDecimal</code> or minor units with explicit rounding (<code>Math.ceil</code> on billable hours is a business decision — state it); a grace period and daily cap because real car parks have them; <code>FOR UPDATE SKIP LOCKED</code> so concurrent allocations do not queue behind each other; and a background sweeper, because a reservation that is never confirmed must return the spot to inventory or the car park slowly fills with phantom holds.</p>`
},
{
  q: "What is the Null Object pattern and other ways to avoid null checks?",
  level: "beginner", tags: ["patterns", "design"],
  a: `<p>The <strong>Null Object</strong> pattern provides a neutral implementation with do-nothing behaviour, so callers never branch on null.</p>
<pre><code>public interface AuditLogger {
    void record(String event, Object detail);
}

// Real implementation
@Component @ConditionalOnProperty("audit.enabled")
class DatabaseAuditLogger implements AuditLogger { }

// Null object — used when auditing is disabled
@Component @ConditionalOnMissingBean(AuditLogger.class)
class NoOpAuditLogger implements AuditLogger {
    public void record(String event, Object detail) { /* deliberately nothing */ }
}

// Caller — no null check, no conditional, no flag
auditLogger.record("ORDER_PLACED", order);</code></pre>
<p><strong>The other techniques, and when each fits:</strong></p>
<ul>
<li><strong><code>Optional&lt;T&gt;</code> as a return type</strong> — for "this may legitimately not exist". Not for fields or parameters.</li>
<li><strong>Empty collections, never null</strong> — <code>return List.of()</code>. Removes an entire class of NPE at the source.</li>
<li><strong><code>Objects.requireNonNull</code> at constructors and public boundaries</strong> — fail immediately at the point of the mistake rather than three layers deeper with no context.</li>
<li><strong>Default values in the domain</strong> — <code>Money.ZERO</code>, <code>Address.UNKNOWN</code>, <code>Period.EMPTY</code>.</li>
<li><strong>Records and immutability</strong> — validate once in the compact constructor and the object can never be in a half-null state.</li>
<li><strong>Bean validation at the API boundary</strong> — <code>@NotNull</code> on request DTOs, so nulls never enter the system.</li>
</ul>
<p><strong>The framing worth giving:</strong> "The goal is not to check for null everywhere — it is to design so null cannot occur. Null checks scattered through business logic are a symptom that the boundaries are not validating. I push validation to the edges and keep the core working with objects that are always valid."</p>
<p>Also worth noting: Java 14's helpful NullPointerException messages make the remaining nulls far easier to diagnose, naming the exact expression that was null.</p>`
}
]);
