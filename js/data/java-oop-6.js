registerPrimer("java-oop", `<h3>The mental model: code talks to a promise, not a class</h3>
<p>Object-oriented design is mostly one idea. The calling code depends on a small <strong>promise</strong> (an interface such as <code>Payment</code>), and each concrete class keeps that promise in its own way. The caller never asks "which kind are you?". It just calls <code>pay()</code>, and at runtime the JVM runs the version that belongs to the actual object. That runtime choice is called <strong>dynamic dispatch</strong>, and it is what polymorphism means in practice.</p>
<p>The four pillars are four views of that one idea:</p>
<table>
<tr><th>Pillar</th><th>In one sentence</th><th>In the example below</th></tr>
<tr><td><strong>Encapsulation</strong></td><td>An object guards its own data and rules</td><td><code>UpiPayment</code> validates its own UPI id; nobody else can set it to junk</td></tr>
<tr><td><strong>Abstraction</strong></td><td>Callers see what it does, not how</td><td>Checkout only knows <code>pay(amount)</code></td></tr>
<tr><td><strong>Inheritance</strong></td><td>A type is declared to be a kind of another</td><td><code>CardPayment implements Payment</code></td></tr>
<tr><td><strong>Polymorphism</strong></td><td>One call, the right behaviour per object</td><td><code>payment.pay(500)</code> runs card or UPI code</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 220" role="img" aria-label="Checkout depends on the Payment interface; card, UPI and wallet classes implement it and the JVM dispatches at runtime">
  <defs><marker id="pr-oop" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="14" y="24" width="150" height="58" rx="9"/>
  <text class="dg-t" x="89" y="48" text-anchor="middle">Checkout</text>
  <text class="dg-m" x="89" y="68" text-anchor="middle">payment.pay(500)</text>
  <line class="dg-line" x1="164" y1="53" x2="226" y2="53" marker-end="url(#pr-oop)"/>
  <text class="dg-s" x="195" y="44" text-anchor="middle">knows only</text>
  <rect class="dg-fill" x="228" y="24" width="170" height="58" rx="9"/>
  <text class="dg-s" x="313" y="44" text-anchor="middle">interface</text>
  <text class="dg-t" x="313" y="64" text-anchor="middle">Payment { pay() }</text>
  <line class="dg-line" x1="270" y1="82" x2="96" y2="140" marker-end="url(#pr-oop)"/>
  <line class="dg-line" x1="313" y1="82" x2="313" y2="140" marker-end="url(#pr-oop)"/>
  <line class="dg-line" x1="356" y1="82" x2="520" y2="140" marker-end="url(#pr-oop)"/>
  <rect class="dg-fill2" x="20" y="142" width="160" height="48" rx="8"/>
  <text class="dg-t" x="100" y="162" text-anchor="middle">CardPayment</text>
  <text class="dg-s" x="100" y="179" text-anchor="middle">charge the card network</text>
  <rect class="dg-fill2" x="233" y="142" width="160" height="48" rx="8"/>
  <text class="dg-t" x="313" y="162" text-anchor="middle">UpiPayment</text>
  <text class="dg-s" x="313" y="179" text-anchor="middle">send a collect request</text>
  <rect class="dg-fill2" x="446" y="142" width="160" height="48" rx="8"/>
  <text class="dg-t" x="526" y="162" text-anchor="middle">WalletPayment</text>
  <text class="dg-s" x="526" y="179" text-anchor="middle">debit the balance</text>
  <text class="dg-s" x="310" y="212" text-anchor="middle">adding a fourth way to pay = one new class; Checkout is not edited</text>
</svg>
<figcaption>The caller depends on the interface. Which pay() runs is decided at runtime by the real object.</figcaption>
</figure>
<h3>Worked example: from a type switch to polymorphism</h3>
<pre><code>// BEFORE: the caller knows every kind of payment. Adding "wallet" means
// editing this method, and every other method with the same switch.
double fee(String type, double amount) {
    switch (type) {
        case "CARD": return amount * 0.02;
        case "UPI":  return 0;
        default: throw new IllegalArgumentException(type);
    }
}

// AFTER: each class owns its own rule.
interface Payment {
    double fee(double amount);
}
final class CardPayment implements Payment {
    public double fee(double amount) { return amount * 0.02; }
}
final class UpiPayment implements Payment {
    public double fee(double amount) { return 0; }
}
final class WalletPayment implements Payment {          // NEW: nothing else changes
    public double fee(double amount) { return Math.min(amount * 0.01, 10); }
}

// The caller: no switch, no instanceof, no knowledge of the kinds
double total(Payment p, double amount) {
    return amount + p.fee(amount);                     // dynamic dispatch
}</code></pre>
<p><strong>Why interviewers like this example:</strong> it shows the Open/Closed principle (open to new payment types, closed to edits in <code>total</code>), programming to an interface, and polymorphism, all in about twenty lines.</p>
<h3>When NOT to reach for a class hierarchy</h3>
<ul>
<li><strong>Only data, no behaviour?</strong> A <code>record</code> is enough. Do not invent an interface for it.</li>
<li><strong>A fixed, closed set of kinds?</strong> A <code>sealed interface</code> plus a <code>switch</code> with pattern matching is often clearer, and the compiler tells you when a case is missing.</li>
<li><strong>Want to reuse code?</strong> Prefer composition (hold a helper object) over <code>extends</code>. Inheritance ties the child to every detail of the parent.</li>
</ul>`);

appendTopic("java-oop", [
{
  q: "Model a bank account so that invalid states are impossible",
  level: "beginner", hot: true, tags: ["encapsulation", "invariants", "design", "must-know"],
  companies: ["Goldman Sachs", "JP Morgan", "Amazon", "Infosys", "TCS", "Wipro", "Accenture"],
  a: `<p>This is the practical test of <strong>encapsulation</strong>. Most candidates write a class with private fields and public getters and setters for every one of them. That is not encapsulation. It is a public struct with extra typing, because any caller can still put the object into a broken state.</p>
<pre><code>// NOT encapsulated, even though the fields are private
public class Account {
    private double balance;
    public double getBalance() { return balance; }
    public void setBalance(double b) { balance = b; }   // anyone can set -5000
}

// Every caller now has to remember the rules:
if (acc.getBalance() &gt;= amount) {
    acc.setBalance(acc.getBalance() - amount);    // and two threads can both
}                                                 // pass this check at once</code></pre>
<p><strong>The fix is to move the rules inside the object</strong> and expose operations with business meaning instead of setters. This is called <em>tell, don't ask</em>: tell the account to withdraw instead of asking for its balance and doing the maths yourself.</p>
<pre><code>public final class Account {
    private final String id;
    private long balancePaise;                     // money as a long of paise, not double
    private final List&lt;Txn&gt; history = new ArrayList&lt;&gt;();

    public Account(String id, long openingPaise) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("id required");
        if (openingPaise &lt; 0) throw new IllegalArgumentException("opening balance &lt; 0");
        this.id = id;
        this.balancePaise = openingPaise;
    }

    public synchronized void deposit(long paise) {
        if (paise &lt;= 0) throw new IllegalArgumentException("deposit must be positive");
        balancePaise = Math.addExact(balancePaise, paise);
        history.add(new Txn("DEPOSIT", paise));
    }

    public synchronized void withdraw(long paise) {
        if (paise &lt;= 0) throw new IllegalArgumentException("withdrawal must be positive");
        if (paise &gt; balancePaise) throw new InsufficientFundsException(id, paise, balancePaise);
        balancePaise -= paise;                     // check and change happen together
        history.add(new Txn("WITHDRAW", paise));
    }

    public synchronized long balance() { return balancePaise; }

    public synchronized List&lt;Txn&gt; history() {
        return List.copyOf(history);               // a copy: callers cannot add fake entries
    }
}</code></pre>
<table>
<tr><th>Rule</th><th>Where it lives now</th></tr>
<tr><td>Balance never negative</td><td>Checked inside <code>withdraw</code>, the only place that lowers it</td></tr>
<tr><td>No zero or negative amounts</td><td>Checked at the start of each operation</td></tr>
<tr><td>History cannot be tampered with</td><td>Private list, handed out only as an immutable copy</td></tr>
<tr><td>Id never changes</td><td><code>final</code> field, validated once in the constructor</td></tr>
<tr><td>No lost updates between threads</td><td>Check and change inside one <code>synchronized</code> method</td></tr>
</table>
<p><strong>The test of good encapsulation:</strong> can any sequence of public method calls leave the object in a state that breaks a business rule? If the answer is no, the class is encapsulated. If the answer is "only if the caller forgets to check first", it is not.</p>
<p><strong>The follow-up to expect:</strong> "What about transfers between two accounts?" Locking both accounts risks a deadlock if two transfers go in opposite directions at once. The standard fix is to always lock the two accounts in a fixed order, for example by id. In a real bank the transfer is a database transaction, and the lock lives in the database, not in Java.</p>`
},
{
  q: "Why do equals() and inheritance fight? Walk through the Point and ColorPoint problem",
  level: "advanced", tags: ["equals", "inheritance", "liskov", "effective-java"],
  companies: ["Google", "Amazon", "Goldman Sachs", "Microsoft", "Adobe", "Oracle"],
  a: `<p>The <code>equals</code> contract has three rules that matter here: <strong>symmetric</strong> (a.equals(b) means b.equals(a)), <strong>transitive</strong> (a = b and b = c means a = c), and consistent with <code>hashCode</code>. Adding a field in a subclass makes it impossible to keep all of them. This is a famous result from <em>Effective Java</em>, and it is a good test of whether someone understands the contract or just generates it with the IDE.</p>
<pre><code>class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    @Override public boolean equals(Object o) {
        if (!(o instanceof Point p)) return false;
        return x == p.x &amp;&amp; y == p.y;
    }
    @Override public int hashCode() { return Objects.hash(x, y); }
}

class ColorPoint extends Point {
    final String color;
    ColorPoint(int x, int y, String c) { super(x, y); color = c; }
    // ...now what should equals do?
}</code></pre>
<p><strong>Attempt 1: compare color too, only against other ColorPoints.</strong></p>
<pre><code>@Override public boolean equals(Object o) {
    if (!(o instanceof ColorPoint cp)) return false;
    return super.equals(cp) &amp;&amp; color.equals(cp.color);
}

Point p = new Point(1, 2);
ColorPoint red = new ColorPoint(1, 2, "red");
p.equals(red);     // true  - Point only compares x and y
red.equals(p);     // false - p is not a ColorPoint
// SYMMETRY broken. Put both in a HashSet and the result depends on insertion order.</code></pre>
<p><strong>Attempt 2: ignore color when compared with a plain Point.</strong></p>
<pre><code>ColorPoint red  = new ColorPoint(1, 2, "red");
Point      p    = new Point(1, 2);
ColorPoint blue = new ColorPoint(1, 2, "blue");

red.equals(p);     // true  (colour ignored)
p.equals(blue);    // true
red.equals(blue);  // false (both have colour, and it differs)
// TRANSITIVITY broken.</code></pre>
<p><strong>Attempt 3: use <code>getClass() != o.getClass()</code> in Point.</strong> Symmetry and transitivity now hold, but a harmless subclass that adds no state (say, a <code>CountingPoint</code> that only tracks instances) is no longer equal to a Point with the same coordinates. That breaks the <strong>Liskov substitution principle</strong>: a subclass can no longer be used where the parent is expected, for example as a key in a set of Points.</p>
<table>
<tr><th>Option</th><th>Symmetric</th><th>Transitive</th><th>Liskov-safe</th></tr>
<tr><td>instanceof, compare color with ColorPoints only</td><td>No</td><td>Yes</td><td>Yes</td></tr>
<tr><td>instanceof, ignore color against Points</td><td>Yes</td><td>No</td><td>Yes</td></tr>
<tr><td>getClass() comparison</td><td>Yes</td><td>Yes</td><td>No</td></tr>
<tr><td><strong>Composition instead of inheritance</strong></td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
</table>
<pre><code>// THE FIX: ColorPoint HAS a Point instead of BEING one.
record ColorPoint(Point point, String color) {
    Point asPoint() { return point; }    // a view, when a Point is needed
}
// Records generate a correct equals and hashCode over all their components,
// and records are final, so no subclass can ever break them.</code></pre>
<p><strong>The answer in one breath:</strong> "You cannot extend an instantiable class, add a value field, and keep the equals contract. Either make the value classes final, which is why records are final, or use composition. In practice I make value types records and never subclass them."</p>`
}
]);
