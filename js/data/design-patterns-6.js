appendTopic("design-patterns", [
{
  q: "Design an elevator system",
  level: "advanced", hot: true, tags: ["design", "lld", "state", "must-know"],
  companies: ["Amazon", "Microsoft", "Adobe", "Uber", "Flipkart", "Goldman Sachs", "Oracle"],
  a: `<p><strong>Clarify:</strong> how many lifts and floors? Is there a separate up/down call outside? Does the scheduling strategy need to change? Then model the domain before writing any algorithm.</p>
<pre><code>public enum Direction { UP, DOWN, IDLE }

public class Elevator {
    private final int id;
    private int currentFloor = 0;
    private Direction direction = Direction.IDLE;
    private final NavigableSet&lt;Integer&gt; up = new TreeSet&lt;&gt;();          // ascending
    private final NavigableSet&lt;Integer&gt; down = new TreeSet&lt;&gt;(reverseOrder());

    // Two sorted sets is the whole trick: serve everything in the current
    // direction first, then reverse. That IS the elevator (SCAN) algorithm.
    public void addStop(int floor) {
        if (floor &gt; currentFloor) up.add(floor);
        else if (floor &lt; currentFloor) down.add(floor);
    }

    public void step() {
        if (direction == Direction.UP) {
            Integer next = up.ceiling(currentFloor);
            if (next != null) { moveTo(next); return; }
            direction = down.isEmpty() ? Direction.IDLE : Direction.DOWN;
        }
        // symmetric for DOWN
    }
}</code></pre>
<pre><code>// The scheduling rule is what VARIES — so it goes behind an interface
public interface ElevatorSelector {
    Elevator choose(List&lt;Elevator&gt; lifts, Request r);
}
class NearestIdleSelector   implements ElevatorSelector { }
class SameDirectionSelector implements ElevatorSelector { }   // en-route wins
class LeastLoadSelector     implements ElevatorSelector { }

// And the request itself distinguishes the two kinds of button:
record Request(int floor, Direction direction, Source source) { }
// EXTERNAL: "I want to go up from floor 3"  -> direction matters for batching
// INTERNAL: "take me to floor 7"            -> destination only</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Elevator state machine">
  <circle class="dg-fill" cx="110" cy="72" r="40"/><text class="dg-s" x="110" y="77" text-anchor="middle">IDLE</text>
  <circle class="dg-fill2" cx="310" cy="36" r="36"/><text class="dg-s" x="310" y="41" text-anchor="middle">MOVING</text>
  <circle class="dg-fill2" cx="310" cy="116" r="36"/><text class="dg-s" x="310" y="121" text-anchor="middle">DOORS OPEN</text>
  <path class="dg-line" d="M148 60 L276 40" marker-end="url(#el2)"/>
  <text class="dg-s" x="206" y="40" text-anchor="middle">request</text>
  <path class="dg-line" d="M310 72 V80" marker-end="url(#el2)"/>
  <text class="dg-s" x="352" y="78">arrived</text>
  <path class="dg-line" d="M274 122 L150 90" marker-end="url(#el2)"/>
  <text class="dg-s" x="206" y="118" text-anchor="middle">no more stops</text>
  <text class="dg-s" x="400" y="60">MAINTENANCE and EMERGENCY</text>
  <text class="dg-s" x="400" y="80">are states too — mention them</text>
  <defs><marker id="el2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Pattern</th><th>Where</th></tr>
<tr><td><strong>State</strong></td><td>Idle / Moving / Doors open / Maintenance — with legal transitions enforced</td></tr>
<tr><td><strong>Strategy</strong></td><td>Which lift answers a call; swappable at runtime</td></tr>
<tr><td>Observer</td><td>Floor displays, door sensors, the building's monitoring</td></tr>
<tr><td>Command</td><td>A button press as an object — queueable, loggable, replayable</td></tr>
<tr><td>Singleton / DI</td><td>One <code>ElevatorController</code> for the building</td></tr>
</table>
<p><strong>The follow-ups:</strong> what happens when two lifts are equally good (tie-break deterministically, or you get oscillation); how do you stop a lift starving a floor (age the requests); and what is the concurrency model — the usual answer is a single controller thread consuming a request queue, because that removes every race by construction.</p>`
},
{
  q: "What are the anti-patterns — and when does a pattern make things worse?",
  level: "advanced", tags: ["patterns", "design", "trade-offs", "best-practice"],
  companies: ["Amazon", "ThoughtWorks", "SAP", "Optum", "EPAM", "Oracle", "Publicis Sapient"],
  a: `<table>
<tr><th>Anti-pattern</th><th>Looks like</th><th>Fix</th></tr>
<tr><td><strong>God object</strong></td><td>A 3,000-line <code>OrderService</code></td><td>Split by reason to change</td></tr>
<tr><td><strong>Anaemic domain model</strong></td><td>Entities with only getters; all logic in services</td><td>Move invariants onto the entity</td></tr>
<tr><td><strong>Singleton everywhere</strong></td><td><code>getInstance()</code> in every class</td><td>Inject it — global state is untestable</td></tr>
<tr><td>Service locator</td><td>Classes pulling dependencies from a registry</td><td>Constructor injection; dependencies become visible</td></tr>
<tr><td>Primitive obsession</td><td><code>String email, String phone, long amount</code></td><td>Value objects that cannot hold invalid data</td></tr>
<tr><td><strong>Premature abstraction</strong></td><td>An interface with exactly one implementation, forever</td><td>Add it at the second implementation</td></tr>
<tr><td>Pattern for its own sake</td><td>An <code>AbstractFactoryBuilderStrategy</code></td><td>Delete it</td></tr>
<tr><td>Leaky abstraction</td><td>A repository returning <code>ResultSet</code></td><td>Return domain types</td></tr>
</table>
<pre><code>// PRIMITIVE OBSESSION — the trap is that it compiles perfectly
void transfer(String from, String to, long amount, String currency) { }
transfer(to, from, currency.length(), amount + "");   // ✗ compiles. Ships.

// Value objects make the mistake impossible:
record AccountId(String value) {
    AccountId { if (!value.matches("[A-Z]{2}\\\\d{10}")) throw new IllegalArgumentException(); }
}
void transfer(AccountId from, AccountId to, Money amount) { }
// Now the compiler rejects the swapped arguments, and validation happens
// exactly once — at construction.</code></pre>
<pre><code>// The rule of three, which is the honest answer to "should I abstract this?"
// 1st time: write it.
// 2nd time: wince, and duplicate it.
// 3rd time: NOW extract the abstraction — you can finally see what varies.
//
// Abstracting at the first occurrence means guessing the axis of variation,
// and a wrong abstraction is more expensive than duplication: duplication is
// cheap to delete, a wrong abstraction gets built on.</code></pre>
<table>
<tr><th>Question to ask before adding a pattern</th></tr>
<tr><td>What <em>specific</em> change does this make easier?</td></tr>
<tr><td>Has that change actually happened, or am I predicting it?</td></tr>
<tr><td>What does it cost a new reader — how many files to follow one call?</td></tr>
<tr><td>Could a plain function or a parameter do the same job?</td></tr>
</table>
<p><strong>The framing that lands in a senior interview:</strong> "Patterns are a response to change that has already happened, not a checklist to satisfy up front. The cost of a pattern is paid by every person who reads the code afterwards — so I want a concrete requirement it serves. 'We might need to swap the database one day' is not one; in twenty years of that argument, almost nobody has."</p>`
}
]);
