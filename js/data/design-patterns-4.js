appendTopic("design-patterns", [
{
  q: "Design a chess or tic-tac-toe game (LLD round)",
  level: "advanced", hot: true, tags: ["lld", "design-question"],
  companies: ["Amazon", "Microsoft", "Adobe", "Flipkart", "Zoho", "Nagarro"],
  a: `<pre><code>// Value objects — immutable, so a move can never be half-applied
public record Position(int row, int col) {
    public Position { if (row &lt; 0 || row &gt; 7 || col &lt; 0 || col &gt; 7)
        throw new IllegalArgumentException("off board"); }
}
public enum Colour { WHITE, BLACK }

// STRATEGY — each piece owns its movement rule. Adding a piece adds a class.
public abstract class Piece {
    protected final Colour colour;
    public abstract boolean canMove(Board board, Position from, Position to);
    public boolean isOpponent(Piece other) { return other != null &amp;&amp; other.colour != colour; }
}
public class Knight extends Piece {
    public boolean canMove(Board b, Position f, Position t) {
        int dr = Math.abs(f.row() - t.row()), dc = Math.abs(f.col() - t.col());
        return (dr == 2 &amp;&amp; dc == 1) || (dr == 1 &amp;&amp; dc == 2);
    }
}

// The board holds STATE only; it does not know the rules
public class Board {
    private final Piece[][] squares = new Piece[8][8];
    public Piece at(Position p) { return squares[p.row()][p.col()]; }
}

// STATE / rules engine — validation, turn order, win detection
public class Game {
    private final Board board;
    private final Deque&lt;Move&gt; history = new ArrayDeque&lt;&gt;();   // COMMAND -> undo
    private Colour turn = Colour.WHITE;
    private GameStatus status = IN_PROGRESS;

    public MoveResult play(Player player, Position from, Position to) {
        if (player.colour() != turn)          return MoveResult.notYourTurn();
        if (status != IN_PROGRESS)            return MoveResult.gameOver(status);

        Piece piece = board.at(from);
        if (piece == null || piece.colour() != turn) return MoveResult.invalid();
        if (!piece.canMove(board, from, to))         return MoveResult.illegalMove();
        if (wouldLeaveKingInCheck(turn, from, to))   return MoveResult.illegalMove();

        Move move = board.apply(from, to);
        history.push(move);                                   // enables undo
        status = evaluateStatus();
        turn = turn.opposite();
        observers.forEach(o -&gt; o.onMove(move, status));        // OBSERVER
        return MoveResult.ok(status);
    }
}</code></pre>
<p><strong>The patterns and why each is there:</strong> <strong>Strategy</strong> for piece movement (adding a piece is a new class, no existing file edited); <strong>Command</strong> for move history, enabling undo and replay; <strong>Observer</strong> so the UI, a logger and an AI can all react without <code>Game</code> knowing about them; <strong>State</strong> for the game status; and a <strong>Factory</strong> for board setup.</p>
<p><strong>The separation to articulate:</strong> <code>Board</code> holds state, <code>Piece</code> holds movement rules, <code>Game</code> holds game rules. That is why "does this move leave my king in check?" belongs in <code>Game</code> and not in <code>Piece</code> — it is a game rule, not a movement rule.</p>
<p><strong>Extensions to volunteer:</strong> castling and en passant need move history (which the Command stack already gives you); a timer per player; and an AI opponent that plugs in as another <code>Player</code> implementation — which is only possible because the rules engine is independent of the UI.</p>`
},
{
  q: "Design a library management system (LLD round)",
  level: "advanced", hot: true, tags: ["lld", "design-question"],
  companies: ["TCS", "Infosys", "Accenture", "Cognizant", "Wipro", "Capgemini"],
  a: `<pre><code>// Distinguish the ABSTRACT book from the PHYSICAL copy — the key modelling insight
public record Book(String isbn, String title, String author, int publishedYear) { }

@Entity
public class BookCopy {                      // a specific physical item
    @Id private String barcode;
    private String isbn;                      // which Book it is
    @Enumerated(STRING) private CopyStatus status;   // AVAILABLE, ISSUED, RESERVED, LOST
    private String shelfLocation;
}

public class Member {
    private final String memberId;
    private final MembershipType type;         // STUDENT, FACULTY — different limits
    public int maxBooks()          { return type.maxBooks(); }
    public Duration loanPeriod()   { return type.loanPeriod(); }
}

// STRATEGY — fine rules change constantly, so isolate them
public interface FinePolicy { Money calculate(Loan loan, LocalDate returnedOn); }

@Component
public class TieredFinePolicy implements FinePolicy {
    public Money calculate(Loan loan, LocalDate returnedOn) {
        long overdue = DAYS.between(loan.dueDate(), returnedOn);
        if (overdue &lt;= 0) return Money.ZERO;
        if (overdue &lt;= 7) return Money.of(overdue * 5);
        return Money.of(35 + (overdue - 7) * 10);          // escalating rate
    }
}

@Service
public class LendingService {

    @Transactional
    public Loan issue(String memberId, String isbn) {
        Member member = members.findById(memberId).orElseThrow();
        if (loans.countActiveFor(memberId) &gt;= member.maxBooks())
            throw new LoanLimitExceededException(member.maxBooks());
        if (fines.outstandingFor(memberId).isPositive())
            throw new OutstandingFinesException();

        // ATOMIC claim — two librarians cannot issue the same copy
        BookCopy copy = copies.claimAvailable(isbn)
                .orElseGet(() -&gt; { reservations.queue(memberId, isbn);
                                   throw new NoCopyAvailableException(); });

        return loans.save(new Loan(copy.barcode(), memberId,
                                   LocalDate.now(), LocalDate.now().plus(member.loanPeriod())));
    }
}</code></pre>
<pre><code>-- The atomic claim, so concurrency is handled by the database
UPDATE book_copy SET status = 'ISSUED'
WHERE barcode = (SELECT barcode FROM book_copy
                 WHERE isbn = :isbn AND status = 'AVAILABLE'
                 LIMIT 1 FOR UPDATE SKIP LOCKED)
RETURNING barcode;</code></pre>
<p><strong>The modelling point that earns marks:</strong> separating <code>Book</code> (the title) from <code>BookCopy</code> (the physical item). A library owns five copies of one book; loans, reservations and status attach to <em>copies</em>, searches and the catalogue to <em>books</em>. Candidates who conflate them cannot express "two copies available, three on loan".</p>
<p><strong>Extensions to raise:</strong> a reservation queue with notification when a copy is returned (Observer); membership types as a strategy for limits; and a scheduled job for overdue reminders and fine accrual.</p>`
},
{
  q: "Design a vending machine (LLD round)",
  level: "advanced", hot: true, tags: ["lld", "patterns"],
  companies: ["Amazon", "Microsoft", "Adobe", "Zoho", "Nagarro", "Persistent"],
  a: `<p>The classic <strong>State pattern</strong> question — the interviewer wants to see you model the states explicitly rather than with a pile of booleans.</p>
<pre><code>public interface VendingState {
    VendingState insertCoin(VendingMachine m, Coin coin);
    VendingState selectProduct(VendingMachine m, String code);
    VendingState dispense(VendingMachine m);
    VendingState refund(VendingMachine m);
}

public class IdleState implements VendingState {
    public VendingState insertCoin(VendingMachine m, Coin c) {
        m.addCredit(c.value());
        return new HasMoneyState();
    }
    public VendingState selectProduct(VendingMachine m, String code) {
        m.display("Insert coins first");
        return this;                                // illegal transition, state unchanged
    }
    public VendingState dispense(VendingMachine m) { m.display("No selection"); return this; }
    public VendingState refund(VendingMachine m)   { return this; }
}

public class HasMoneyState implements VendingState {
    public VendingState selectProduct(VendingMachine m, String code) {
        Product p = m.inventory().find(code)
                .orElseGet(() -&gt; { m.display("Invalid code"); return null; });
        if (p == null) return this;
        if (m.inventory().stockOf(code) == 0) { m.display("Sold out"); return this; }
        if (m.credit() &lt; p.price())           { m.display("Insufficient credit"); return this; }
        m.select(p);
        return new DispensingState();
    }
    public VendingState refund(VendingMachine m) {
        m.returnCoins(m.credit());
        return new IdleState();
    }
    // ...
}

public class VendingMachine {
    private VendingState state = new IdleState();
    public void insertCoin(Coin c)      { state = state.insertCoin(this, c); }
    public void selectProduct(String s) { state = state.selectProduct(this, s); }
    public void dispense()              { state = state.dispense(this); }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Vending machine state transitions">
  <rect class="dg-fill" x="20" y="46" width="100" height="36" rx="8"/><text class="dg-s" x="70" y="69" text-anchor="middle">IDLE</text>
  <path class="dg-line" d="M124 64 H176" marker-end="url(#vm1)"/><text class="dg-m" x="150" y="56" text-anchor="middle">coin</text>
  <rect class="dg-fill" x="180" y="46" width="110" height="36" rx="8"/><text class="dg-s" x="235" y="69" text-anchor="middle">HAS_MONEY</text>
  <path class="dg-line" d="M294 64 H346" marker-end="url(#vm1)"/><text class="dg-m" x="320" y="56" text-anchor="middle">select</text>
  <rect class="dg-fill" x="350" y="46" width="110" height="36" rx="8"/><text class="dg-s" x="405" y="69" text-anchor="middle">DISPENSING</text>
  <path class="dg-line" d="M464 64 H516" marker-end="url(#vm1)"/><text class="dg-m" x="490" y="56" text-anchor="middle">done</text>
  <rect class="dg-fill2" x="520" y="46" width="80" height="36" rx="8"/><text class="dg-s" x="560" y="69" text-anchor="middle">IDLE</text>
  <path class="dg-line" d="M235 86 V106 H70 V86" marker-end="url(#vm1)"/><text class="dg-m" x="150" y="120" text-anchor="middle">refund</text>
  <defs><marker id="vm1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Why State beats a boolean soup:</strong> the alternative is <code>if (hasMoney &amp;&amp; !dispensing &amp;&amp; selected != null)</code> repeated in every method — which permits nonsensical combinations and grows unreadable. With State, illegal transitions are simply not implemented, and adding a <code>MaintenanceState</code> touches no existing state class.</p>
<p><strong>The details interviewers probe:</strong> use integer <em>minor units</em> (paise/cents) for money, never <code>double</code>; the coin-change problem is a greedy algorithm that fails for some denomination sets, so mention DP for correctness; and concurrency — a real machine is single-user, but a networked one needs an atomic stock decrement exactly like an inventory system.</p>`
},
{
  q: "What is the difference between a Facade and a Mediator?",
  level: "advanced", tags: ["patterns"],
  companies: ["Oracle", "SAP", "EPAM", "ThoughtWorks", "Publicis Sapient"],
  a: `<table>
<tr><th></th><th>Facade</th><th>Mediator</th></tr>
<tr><td>Intent</td><td><strong>Simplify</strong> access to a subsystem</td><td><strong>Decouple</strong> peers from each other</td></tr>
<tr><td>Direction</td><td>One-way: client → subsystem</td><td>Two-way: colleagues ↔ mediator</td></tr>
<tr><td>Subsystem awareness</td><td>Components do not know the facade exists</td><td>Colleagues <em>do</em> know the mediator</td></tr>
<tr><td>Bypassable</td><td>Yes — you can still use the subsystem directly</td><td>No — that is the point</td></tr>
</table>
<pre><code>// FACADE — the subsystem is unaware of it; it just makes the common path easy
@Service
public class CheckoutFacade {
    private final InventoryService inventory;
    private final PricingService pricing;
    private final PaymentService payment;

    public Receipt checkout(CheckoutRequest r) {      // one call instead of five
        inventory.reserve(r.items());
        var total = pricing.calculate(r);
        return payment.charge(r.method(), total);
    }
}
// InventoryService has no idea CheckoutFacade exists, and can still be called directly.

// MEDIATOR — colleagues talk THROUGH it, never to each other
public class OrderMediator {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;

    public void notify(Object sender, OrderEvent event) {
        switch (event) {
            case StockReserved e   -&gt; payment.charge(e.orderId());
            case PaymentDone e     -&gt; shipping.schedule(e.orderId());
            case PaymentFailed e   -&gt; inventory.release(e.orderId());
        }
    }
}
// InventoryService does NOT call PaymentService. It notifies the mediator.
// N components need N connections instead of N×(N−1).</code></pre>
<p><strong>The distinguishing question:</strong> are you hiding complexity from an <em>outside caller</em> (Facade), or preventing <em>peers</em> from referencing each other (Mediator)?</p>
<p><strong>Where you have met each:</strong> a Spring <code>@Service</code> coordinating repositories is a Facade; SLF4J is a Facade over logging implementations (it is in the name); an API gateway is a Facade over microservices. For Mediator: a <strong>saga orchestrator</strong> is exactly this pattern at the distributed-systems scale, and so is a UI dialog controller coordinating widgets.</p>
<p><strong>The shared risk to mention:</strong> both centralise logic, so both can become god objects. A facade that grows past a few coherent operations should be split; a mediator that knows every rule in the system has just moved the coupling rather than removed it.</p>`
},
{
  q: "How do you implement the Observer pattern without memory leaks?",
  level: "advanced", tags: ["patterns", "memory"],
  companies: ["Amazon", "Oracle", "Adobe", "SAP", "Microsoft"],
  a: `<pre><code>// ✘ The classic leak — the subject holds a STRONG reference forever
public class EventBus {
    private final List&lt;Listener&gt; listeners = new ArrayList&lt;&gt;();
    public void register(Listener l) { listeners.add(l); }
    // No unregister, or callers forget it -> every listener ever registered
    // stays reachable, along with everything IT references.
}</code></pre>
<p><strong>Why it leaks so badly:</strong> a listener is usually an inner class or lambda capturing <code>this</code>, so the subject transitively retains the whole component — its fields, its injected services, sometimes an entire UI subtree. In a long-lived singleton bus, nothing is ever collected.</p>
<pre><code>// ✔ 1. Explicit lifecycle — the simplest correct answer
@Component
public class OrderListener implements Listener {
    private final EventBus bus;
    @PostConstruct void register()   { bus.register(this); }
    @PreDestroy  void unregister()   { bus.unregister(this); }   // symmetric, guaranteed
}

// ✔ 2. Return a subscription handle — makes cleanup impossible to forget
public interface Subscription extends AutoCloseable { void close(); }

public Subscription register(Listener l) {
    listeners.add(l);
    return () -&gt; listeners.remove(l);
}
try (var sub = bus.register(this::onEvent)) { ... }   // auto-closed

// ✔ 3. Weak references — the subject does not keep the listener alive
private final Set&lt;Listener&gt; listeners =
        Collections.newSetFromMap(new WeakHashMap&lt;&gt;());
// CAUTION: a lambda with no other strong reference is collected IMMEDIATELY,
// so the listener silently stops working. Only use this when the caller
// definitely holds its own reference.

// ✔ 4. Let the framework own it — usually the right answer
@EventListener                       // Spring manages registration AND removal
public void onOrderPlaced(OrderPlacedEvent e) { ... }</code></pre>
<p><strong>The trap in option 3</strong> is worth stating, because it is a common "clever" answer that backfires: with a <code>WeakHashMap</code>, <code>bus.register(e -&gt; log.info(e))</code> registers a lambda nothing else references, so the next GC removes it and events stop arriving intermittently — a far worse bug than the leak it was meant to fix.</p>
<p><strong>Other Observer pitfalls to name:</strong> a listener that throws should not break the notification loop (catch per listener); notification order is unspecified, so never depend on it; and re-entrant modification — a listener that unregisters itself during iteration causes <code>ConcurrentModificationException</code>, which is why <code>CopyOnWriteArrayList</code> is the usual choice for listener registries.</p>`
},
{
  q: "Design a logging framework (LLD round)",
  level: "advanced", tags: ["lld", "patterns"],
  companies: ["Amazon", "Oracle", "SAP", "Adobe", "EPAM"],
  a: `<pre><code>public enum Level { TRACE, DEBUG, INFO, WARN, ERROR;
    boolean isEnabledFor(Level threshold) { return this.ordinal() &gt;= threshold.ordinal(); }
}

// STRATEGY — where the log goes
public interface Appender extends AutoCloseable {
    void append(LogEvent event);
}
public class ConsoleAppender implements Appender { }
public class FileAppender implements Appender { }          // with rolling
public class AsyncAppender implements Appender {           // DECORATOR
    private final Appender delegate;
    private final BlockingQueue&lt;LogEvent&gt; queue = new ArrayBlockingQueue&lt;&gt;(10_000);
    public void append(LogEvent e) {
        if (!queue.offer(e)) droppedCounter.increment();    // NEVER block the caller
    }
}

// STRATEGY — how it is rendered
public interface Formatter { String format(LogEvent event); }
public class PatternFormatter implements Formatter { }
public class JsonFormatter implements Formatter { }        // structured logging

// CHAIN OF RESPONSIBILITY — logger hierarchy by name
public class Logger {
    private final String name;
    private final Logger parent;                            // "com.acme.order" -&gt; "com.acme"
    private Level threshold;                                 // null = inherit from parent
    private final List&lt;Appender&gt; appenders = new CopyOnWriteArrayList&lt;&gt;();

    public void info(String template, Object... args) { log(Level.INFO, template, args); }

    private void log(Level level, String template, Object... args) {
        if (!level.isEnabledFor(effectiveThreshold())) return;   // CHEAP EXIT, no formatting
        LogEvent e = new LogEvent(level, name, format(template, args),
                                  Instant.now(), Thread.currentThread().getName(), MDC.copy());
        for (Logger l = this; l != null; l = l.parent) {
            l.appenders.forEach(a -&gt; a.append(e));               // walk up the hierarchy
        }
    }
}

// FACTORY + FLYWEIGHT — one Logger instance per name
public final class LoggerFactory {
    private static final Map&lt;String, Logger&gt; CACHE = new ConcurrentHashMap&lt;&gt;();
    public static Logger getLogger(Class&lt;?&gt; c) {
        return CACHE.computeIfAbsent(c.getName(), LoggerFactory::create);
    }
}</code></pre>
<p><strong>The design points that matter most:</strong></p>
<ul>
<li><strong>Check the level before formatting.</strong> <code>log.debug("value " + expensive())</code> builds the string even when DEBUG is off — which is why parameterised logging (<code>log.debug("value {}", x)</code>) exists and why the level check must come first.</li>
<li><strong>Asynchronous appending with a bounded queue.</strong> Logging must never block the application thread, and must never OOM when the disk is slow — so drop and count rather than grow unbounded.</li>
<li><strong>Hierarchy by logger name</strong> so <code>com.acme</code> configures everything beneath it, with per-package overrides.</li>
<li><strong>MDC captured at event creation</strong>, not at write time — by the time the async appender runs, the thread has moved on to another request.</li>
</ul>
<p><strong>Patterns used:</strong> Strategy (appenders, formatters), Decorator (async, filtering), Chain of Responsibility (hierarchy), Factory + Flyweight (logger cache), Facade (the SLF4J API over an implementation).</p>`
}
]);
