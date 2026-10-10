registerPrimer("design-patterns", `<p class="pr-lead">A <b>design pattern</b> is a proven, named solution to a problem that keeps coming up in software. It is not code you copy and paste; it is a shape of solution that experienced developers have used so often that it got a name. Knowing the names lets you say "use a Strategy here" instead of explaining the whole idea every time.</p>
<div class="pr-analogy"><b>Think of it like this</b>Patterns are like standard building techniques in architecture. "Arch", "staircase" and "load-bearing wall" are not specific buildings; they are known solutions to known problems (span a gap, change floors, hold up the roof). An architect picks the technique that fits the problem. A developer picks the pattern that fits the code problem.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Creational patterns</dt><dd>About how objects are created: Builder, Factory, Singleton, Prototype.</dd>
<dt>Structural patterns</dt><dd>About how objects fit together: Adapter, Decorator, Proxy, Facade.</dd>
<dt>Behavioural patterns</dt><dd>About how objects work together and share responsibility: Strategy, Observer, State, Command.</dd>
<dt>LLD (low-level design)</dt><dd>An interview round where you design the classes for something like a parking lot or vending machine.</dd>
<dt>Interface</dt><dd>A contract of methods, which most patterns rely on so parts can be swapped.</dd>
</dl>

<h3>The patterns you will meet most, in one line each</h3>
<ol class="pr-steps">
<li><b>Builder:</b> create an object with many optional settings step by step, instead of a constructor with ten parameters.</li>
<li><b>Factory:</b> let one place decide which class to create, so the rest of the code does not need to know.</li>
<li><b>Strategy:</b> make an algorithm swappable, such as different discount rules or payment methods behind one interface.</li>
<li><b>Observer:</b> when something happens, automatically notify everyone who signed up to hear about it.</li>
<li><b>Decorator:</b> wrap an object to add a behaviour (logging, retries) without changing it.</li>
<li><b>Adapter:</b> make one interface look like another, typically to fit a third-party library into your code.</li>
<li><b>State:</b> let an object behave differently depending on its current status, with one class per status.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 214" role="img" aria-label="Three families of design patterns: creational, structural and behavioural, with the question each answers and common examples">
  <rect class="dg-fill" x="10" y="14" width="190" height="186" rx="10"/>
  <text class="dg-t" x="105" y="38" text-anchor="middle">Creational</text>
  <text class="dg-s" x="105" y="56" text-anchor="middle">"How is this object made?"</text>
  <text class="dg-m" x="26" y="88">Builder</text><text class="dg-s" x="96" y="88">many optional fields</text>
  <text class="dg-m" x="26" y="112">Factory</text><text class="dg-s" x="96" y="112">pick a class at runtime</text>
  <text class="dg-m" x="26" y="136">Singleton</text><text class="dg-s" x="96" y="136">exactly one instance</text>
  <text class="dg-m" x="26" y="160">Prototype</text><text class="dg-s" x="96" y="160">copy an existing one</text>
  <rect class="dg-fill2" x="215" y="14" width="190" height="186" rx="10"/>
  <text class="dg-t" x="310" y="38" text-anchor="middle">Structural</text>
  <text class="dg-s" x="310" y="56" text-anchor="middle">"How do objects fit together?"</text>
  <text class="dg-m" x="231" y="88">Adapter</text><text class="dg-s" x="301" y="88">make APIs match</text>
  <text class="dg-m" x="231" y="112">Decorator</text><text class="dg-s" x="301" y="112">adds behaviour</text>
  <text class="dg-m" x="231" y="136">Proxy</text><text class="dg-s" x="301" y="136">control access</text>
  <text class="dg-m" x="231" y="160">Facade</text><text class="dg-s" x="301" y="160">one simple front door</text>
  <rect class="dg-fill" x="420" y="14" width="190" height="186" rx="10"/>
  <text class="dg-t" x="515" y="38" text-anchor="middle">Behavioural</text>
  <text class="dg-s" x="515" y="56" text-anchor="middle">"Who does what, and when?"</text>
  <text class="dg-m" x="436" y="88">Strategy</text><text class="dg-s" x="506" y="88">swap an algorithm</text>
  <text class="dg-m" x="436" y="112">Observer</text><text class="dg-s" x="506" y="112">notify on change</text>
  <text class="dg-m" x="436" y="136">State</text><text class="dg-s" x="506" y="136">behaviour per status</text>
  <text class="dg-m" x="436" y="160">Command</text><text class="dg-s" x="506" y="160">a request as an object</text>
  <text class="dg-s" x="310" y="190" text-anchor="middle">…plus Template Method, Chain of Responsibility, Composite and others</text>
</svg>
<figcaption>Start from the problem ("I need to add retry without editing this class") and the family narrows the choice fast.</figcaption>
</figure>

<h3>A worked example: adding logging and retries with a Decorator</h3>
<p><b>The problem:</b> a payment client works, but now you need logging and automatic retries around every call. Editing the client mixes extra jobs into it, and subclassing leads to a class for every combination.</p>
<pre><code>interface PaymentGateway {
    Receipt charge(String card, long paise);
}

class RazorpayGateway implements PaymentGateway {       // the real thing
    public Receipt charge(String card, long paise) { /* calls the provider */ return null; }
}

class LoggingGateway implements PaymentGateway {        // adds logging
    private final PaymentGateway inner;
    LoggingGateway(PaymentGateway inner) { this.inner = inner; }
    public Receipt charge(String card, long paise) {
        log.info("charging {}", paise);
        return inner.charge(card, paise);
    }
}

// Stack the wrappers you need:
PaymentGateway gateway = new LoggingGateway(new RetryingGateway(new RazorpayGateway()));</code></pre>
<ol class="pr-steps">
<li>Every wrapper implements the same <code>PaymentGateway</code> interface, so callers cannot tell the difference.</li>
<li>Each wrapper does one extra job, then passes the call on to the object inside it.</li>
<li>You combine them like layers: logging around retrying around the real gateway.</li>
<li>The real gateway class is never edited. Adding a new layer (for example timing) is one new small class.</li>
<li>Java's own file reading works this way: <code>new BufferedReader(new FileReader(file))</code>.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Using patterns where none is needed</p>
<p>Adding a Factory, a Strategy interface and three classes for something a simple <code>if</code> would handle makes code harder to read, not better.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> start with the problem. Use a pattern only when it clearly removes repetition or makes change easier.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Memorising definitions without examples</p>
<p>Interviewers quickly spot a textbook definition with no real use behind it.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> learn one real example of each pattern, ideally from Spring or the JDK (for example, Spring's JdbcTemplate is the Template Method pattern).</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Overusing Singleton</p>
<p>A global single instance is easy to write but hides dependencies and makes testing hard, because every test shares the same object.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> let a framework like Spring manage one shared instance and inject it where needed.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>A pattern is a named solution to a recurring design problem.</li>
<li>Creational patterns create objects, structural ones combine them, behavioural ones coordinate them.</li>
<li>Strategy, Builder, Decorator, Observer and Factory cover most everyday needs.</li>
<li>Describe the problem first, then name the pattern that solves it.</li>
<li>Simple code beats a pattern that is not needed.</li>
</ul>
<p><b>Next:</b> the questions below explain each pattern and walk through classic low-level design rounds (parking lot, elevator, vending machine).</p>`);

appendTopic("design-patterns", [
{
  q: "Design an expense-sharing app like Splitwise (LLD round)",
  level: "advanced", hot: true, tags: ["lld", "machine-coding", "strategy-pattern", "must-know"],
  companies: ["Flipkart", "Amazon", "Swiggy", "PhonePe", "Razorpay", "Uber", "Atlassian"],
  a: `<p>A very common machine-coding round. <strong>Requirements to confirm:</strong> users add expenses in a group; an expense can be split <em>equally</em>, by <em>exact amounts</em>, or by <em>percentage</em>; show who owes whom; settle up. Bonus: simplify debts so the group needs as few payments as possible.</p>
<pre><code>// Money in paise (long) - never double for money
record User(String id, String name) {}

record Split(User user, long paise) {}

enum SplitType { EQUAL, EXACT, PERCENT }

record Expense(String id, User paidBy, long totalPaise, List&lt;Split&gt; splits, String note) {}</code></pre>
<p><strong>Each split type is a Strategy.</strong> Adding a new type ("by shares") is a new class, not a new branch in a growing switch.</p>
<pre><code>interface SplitStrategy {
    List&lt;Split&gt; split(long totalPaise, List&lt;User&gt; users, List&lt;Double&gt; values);
}

class EqualSplit implements SplitStrategy {
    public List&lt;Split&gt; split(long total, List&lt;User&gt; users, List&lt;Double&gt; ignored) {
        long each = total / users.size();
        long remainder = total % users.size();          // 1000 / 3 = 333 r 1
        List&lt;Split&gt; out = new ArrayList&lt;&gt;();
        for (int i = 0; i &lt; users.size(); i++)
            out.add(new Split(users.get(i), each + (i &lt; remainder ? 1 : 0)));  // 334,333,333
        return out;                                     // shares always add up to total
    }
}

class ExactSplit implements SplitStrategy {
    public List&lt;Split&gt; split(long total, List&lt;User&gt; users, List&lt;Double&gt; amounts) {
        long sum = amounts.stream().mapToLong(Double::longValue).sum();
        if (sum != total) throw new IllegalArgumentException("exact amounts must add up to the total");
        List&lt;Split&gt; out = new ArrayList&lt;&gt;();
        for (int i = 0; i &lt; users.size(); i++) out.add(new Split(users.get(i), amounts.get(i).longValue()));
        return out;
    }
}

class PercentSplit implements SplitStrategy {
    public List&lt;Split&gt; split(long total, List&lt;User&gt; users, List&lt;Double&gt; pct) {
        if (Math.abs(pct.stream().mapToDouble(Double::doubleValue).sum() - 100) &gt; 1e-9)
            throw new IllegalArgumentException("percentages must add up to 100");
        List&lt;Split&gt; out = new ArrayList&lt;&gt;();
        long assigned = 0;
        for (int i = 0; i &lt; users.size(); i++) {
            long share = (i == users.size() - 1) ? total - assigned        // last one absorbs
                                                 : Math.round(total * pct.get(i) / 100);  // rounding
            assigned += share;
            out.add(new Split(users.get(i), share));
        }
        return out;
    }
}</code></pre>
<p><strong>Balances: one net number per person</strong> is simpler and more correct than a matrix of "A owes B".</p>
<pre><code>class ExpenseService {
    private final Map&lt;SplitType, SplitStrategy&gt; strategies = Map.of(
        SplitType.EQUAL, new EqualSplit(),
        SplitType.EXACT, new ExactSplit(),
        SplitType.PERCENT, new PercentSplit());
    private final Map&lt;User, Long&gt; net = new HashMap&lt;&gt;();   // +ve: is owed, -ve: owes

    public synchronized void addExpense(User paidBy, long total, SplitType type,
                                        List&lt;User&gt; users, List&lt;Double&gt; values) {
        List&lt;Split&gt; splits = strategies.get(type).split(total, users, values);
        net.merge(paidBy, total, Long::sum);                        // paid the whole bill
        for (Split s : splits) net.merge(s.user(), -s.paise(), Long::sum);  // owes a share
    }
}</code></pre>
<p><strong>Simplify debts</strong> (the follow-up that separates candidates): repeatedly match the person who owes the most with the person owed the most.</p>
<pre><code>public List&lt;String&gt; settleUp() {
    PriorityQueue&lt;Map.Entry&lt;User, Long&gt;&gt; owed = new PriorityQueue&lt;&gt;((a, b) -&gt; Long.compare(b.getValue(), a.getValue()));
    PriorityQueue&lt;Map.Entry&lt;User, Long&gt;&gt; owes = new PriorityQueue&lt;&gt;((a, b) -&gt; Long.compare(a.getValue(), b.getValue()));
    net.forEach((u, v) -&gt; {
        if (v &gt; 0) owed.add(new AbstractMap.SimpleEntry&lt;&gt;(u, v));
        if (v &lt; 0) owes.add(new AbstractMap.SimpleEntry&lt;&gt;(u, v));
    });
    List&lt;String&gt; payments = new ArrayList&lt;&gt;();
    while (!owed.isEmpty() &amp;&amp; !owes.isEmpty()) {
        var creditor = owed.poll();
        var debtor = owes.poll();
        long amount = Math.min(creditor.getValue(), -debtor.getValue());
        payments.add(debtor.getKey().name() + " pays " + creditor.getKey().name() + " " + amount);
        if (creditor.getValue() - amount &gt; 0) owed.add(new AbstractMap.SimpleEntry&lt;&gt;(creditor.getKey(), creditor.getValue() - amount));
        if (debtor.getValue() + amount &lt; 0) owes.add(new AbstractMap.SimpleEntry&lt;&gt;(debtor.getKey(), debtor.getValue() + amount));
    }
    return payments;
}
// A paid 900 for A, B, C (300 each): net A +600, B -300, C -300
// Result: "B pays A 300", "C pays A 300" - two payments, the minimum here.</code></pre>
<table>
<tr><th>Point the interviewer is checking</th><th>Where it shows</th></tr>
<tr><td>Money handled exactly</td><td><code>long</code> paise; remainders distributed so shares add up</td></tr>
<tr><td>Open/closed design</td><td>Split types as strategies in a map</td></tr>
<tr><td>Validation</td><td>Exact amounts and percentages checked against the total</td></tr>
<tr><td>Simple state</td><td>One net balance per user instead of pairwise debts</td></tr>
<tr><td>Algorithm on top</td><td>Greedy settlement with two heaps, O(n log n)</td></tr>
</table>
<p><strong>Worth saying honestly:</strong> the greedy approach gives few payments but not always the proven minimum. The true minimum is NP-hard in general, so greedy is what real apps use.</p>`
},
{
  q: "Design a movie ticket booking system like BookMyShow (LLD round)",
  level: "advanced", hot: true, tags: ["lld", "concurrency", "seat-locking", "state-pattern", "must-know"],
  companies: ["Amazon", "Flipkart", "Swiggy", "PhonePe", "Paytm", "Uber", "Microsoft"],
  a: `<p>This LLD round is really a <strong>concurrency</strong> question in disguise: two people must never book the same seat. Get the model right, then spend most of the time on how a seat is held and confirmed.</p>
<pre><code>// The model
record City(String id, String name) {}
record Movie(String id, String title, Duration length) {}
record Theatre(String id, City city, List&lt;Screen&gt; screens) {}
record Screen(String id, List&lt;Seat&gt; seats) {}
record Seat(String id, int row, int number, SeatType type) {}
enum SeatType { REGULAR, PREMIUM, RECLINER }

record Show(String id, Movie movie, Screen screen, Instant start,
            Map&lt;SeatType, Long&gt; pricePaise) {}

enum SeatStatus { AVAILABLE, HELD, BOOKED }

class ShowSeat {                             // a seat FOR ONE SHOW: this is what gets booked
    final Seat seat;
    SeatStatus status = SeatStatus.AVAILABLE;
    String heldBy;                           // booking id holding it
    Instant holdExpiresAt;
    ShowSeat(Seat seat) { this.seat = seat; }
}

enum BookingStatus { PENDING_PAYMENT, CONFIRMED, EXPIRED, CANCELLED }</code></pre>
<p><strong>The flow a real user goes through</strong> has a gap in the middle: they pick seats, then spend a minute or more paying. So seats are <strong>held</strong> for a few minutes, not booked immediately.</p>
<pre><code>select seats  -&gt;  HOLD (5 min)  -&gt;  pay  -&gt;  BOOKED
                       |
                       +-- timer expires or payment fails -&gt; AVAILABLE again</code></pre>
<pre><code>class ShowSeatService {
    private final Map&lt;String, ShowSeat&gt; seats;          // seatId -&gt; ShowSeat, for one show
    private static final Duration HOLD = Duration.ofMinutes(5);

    // All-or-nothing: either every requested seat is held, or none is.
    public synchronized boolean hold(List&lt;String&gt; seatIds, String bookingId) {
        Instant now = Instant.now();
        for (String id : seatIds) {
            ShowSeat s = seats.get(id);
            boolean expiredHold = s.status == SeatStatus.HELD &amp;&amp; s.holdExpiresAt.isBefore(now);
            if (s.status != SeatStatus.AVAILABLE &amp;&amp; !expiredHold) return false;   // taken
        }
        for (String id : seatIds) {
            ShowSeat s = seats.get(id);
            s.status = SeatStatus.HELD;
            s.heldBy = bookingId;
            s.holdExpiresAt = now.plus(HOLD);
        }
        return true;
    }

    public synchronized boolean confirm(List&lt;String&gt; seatIds, String bookingId) {
        Instant now = Instant.now();
        for (String id : seatIds) {
            ShowSeat s = seats.get(id);
            if (s.status != SeatStatus.HELD || !bookingId.equals(s.heldBy)
                    || s.holdExpiresAt.isBefore(now)) return false;    // hold lost: refund
        }
        seatIds.forEach(id -&gt; seats.get(id).status = SeatStatus.BOOKED);
        return true;
    }
}
// One lock per SHOW (this object), not one global lock: bookings for
// different shows never wait for each other.</code></pre>
<p><strong>In a real deployment with many servers</strong>, a Java lock is not enough. The database does the job:</p>
<pre><code>-- Hold: succeeds only for seats still free (or whose hold expired)
UPDATE show_seat
SET status = 'HELD', booking_id = :bookingId, hold_expires_at = now() + interval '5 minutes'
WHERE show_id = :showId
  AND seat_id IN (:seatIds)
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at &lt; now()));
-- If rows updated != number of seats requested: ROLLBACK the transaction.
-- Two users racing for seat A7: the row lock makes one UPDATE wait, then
-- its WHERE no longer matches. Exactly one wins, with no explicit locking code.</code></pre>
<table>
<tr><th>Design point</th><th>Choice</th></tr>
<tr><td>What is locked</td><td>A <em>show seat</em>, not a seat: the same physical seat is free at 6pm and booked at 9pm</td></tr>
<tr><td>Double booking</td><td>Conditional UPDATE, all seats in one transaction</td></tr>
<tr><td>Abandoned checkouts</td><td>Holds expire by time; a reaper job, or just treat expired holds as available (as above)</td></tr>
<tr><td>Payment succeeds after the hold expired</td><td><code>confirm</code> fails, so refund automatically. Never book a seat someone else now holds</td></tr>
<tr><td>Booking lifecycle</td><td>State pattern / enum transitions: PENDING_PAYMENT → CONFIRMED or EXPIRED</td></tr>
<tr><td>Pricing</td><td>Per seat type per show; a strategy for weekend or dynamic pricing</td></tr>
</table>
<p><strong>What to say at the end:</strong> "The core is a per-show seat with a time-limited hold. Holds and confirmations are conditional, all-or-nothing updates, so concurrency is handled by the database, and a late payment on an expired hold becomes a refund rather than a double booking."</p>`
}
]);
