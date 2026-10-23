registerPrimer("java-oop", `<p class="pr-lead">Object-oriented programming (OOP) is a way of organising code around <b>objects</b>: small units that hold some data and the actions that work on that data. A "Customer" object holds a name and an address and knows how to update them. The goal is code that is easy to understand, easy to change, and hard to break.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of a TV remote. You press "volume up" without knowing anything about the circuits inside. Any brand of TV understands that button in its own way. OOP works the same way: code uses an object through a simple set of buttons (its methods), and each kind of object decides for itself how to do the work.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Class</dt><dd>A blueprint. <code>class Car</code> describes what every car has and can do.</dd>
<dt>Object</dt><dd>One real thing built from a class. Your car and my car are two objects of the class Car.</dd>
<dt>Method</dt><dd>An action an object can perform, like <code>car.start()</code>.</dd>
<dt>Interface</dt><dd>A list of methods a class promises to provide, without saying how. It is a contract.</dd>
<dt>Encapsulation</dt><dd>Keeping an object's data private and only allowing changes through its own methods, so its rules cannot be broken from outside.</dd>
<dt>Abstraction</dt><dd>Showing only what something does and hiding how it does it.</dd>
<dt>Inheritance</dt><dd>One class reusing and extending another, like <code>Dog extends Animal</code>.</dd>
<dt>Polymorphism</dt><dd>One call, different behaviour: <code>payment.pay()</code> runs card code for a card and UPI code for UPI.</dd>
</dl>

<h3>The four pillars, in plain words</h3>
<ol class="pr-steps">
<li><b>Encapsulation: protect the data.</b> A bank account keeps its balance private. The only way to change it is <code>deposit()</code> or <code>withdraw()</code>, and those methods check the rules (no negative amounts, no overdraft). Nobody can just set the balance to any number they like.</li>
<li><b>Abstraction: hide the details.</b> The checkout page only needs to know "this thing can take a payment". It does not care whether that involves a card network, a UPI app or a wallet.</li>
<li><b>Inheritance: reuse what exists.</b> A <code>SavingsAccount</code> can build on a general <code>Account</code> and only add what is different, such as interest.</li>
<li><b>Polymorphism: same call, right behaviour.</b> You write <code>payment.pay(500)</code> once. When the program runs, Java looks at the real object and runs its version of <code>pay</code>. This choice at run time is called <b>dynamic dispatch</b>.</li>
</ol>
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

<h3>A worked example: replacing a long if/else with objects</h3>
<p>Imagine a shop that charges different fees for different payment types. The first version usually looks like this:</p>
<pre><code>double fee(String type, double amount) {
    if (type.equals("CARD")) return amount * 0.02;
    if (type.equals("UPI"))  return 0;
    throw new IllegalArgumentException(type);
}</code></pre>
<p>It works, but every new payment type means editing this method, and every other method that has the same if/else. Here is the object-oriented version:</p>
<pre><code>interface Payment {                       // the promise: every payment has a fee
    double fee(double amount);
}
class CardPayment implements Payment {
    public double fee(double amount) { return amount * 0.02; }
}
class UpiPayment implements Payment {
    public double fee(double amount) { return 0; }
}
class WalletPayment implements Payment {  // new type: nothing else changes
    public double fee(double amount) { return Math.min(amount * 0.01, 10); }
}

double total(Payment p, double amount) {
    return amount + p.fee(amount);        // Java picks the right fee() at run time
}</code></pre>
<ol class="pr-steps">
<li><code>Payment</code> is an interface. It only says "anything that is a Payment can calculate a fee".</li>
<li>Each class keeps that promise in its own way. The card class knows the card rule, the UPI class knows the UPI rule.</li>
<li><code>total()</code> does not know or care which kind of payment it received. It just calls <code>fee()</code>.</li>
<li>To add a wallet, you write one new class. <code>total()</code> and the other classes are not touched, so they cannot break.</li>
</ol>
<p>That last point has a name you will hear in interviews: the <b>Open/Closed principle</b>. Code should be open to new features (add a class) but closed to modification (no editing of working code).</p>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Thinking private fields with getters and setters is encapsulation</p>
<p>If every field has a public setter, anyone can still set the balance to -5000. The data is technically private, but nothing protects the rules.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> offer meaningful actions such as <code>withdraw(amount)</code> that check the rules, instead of a raw <code>setBalance()</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using inheritance just to reuse code</p>
<p>Inheritance ties a child class to every detail of its parent. Change the parent, and children can break in surprising ways. A Square is a Rectangle in maths, but in code a Square that forces width and height to stay equal breaks code that expected a normal Rectangle.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> prefer <b>composition</b>: give the class a helper object to use (it "has a" helper) rather than making it "be a" parent. Use inheritance only for a true "is a kind of" relationship that behaves the same way.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Checking the type with instanceof everywhere</p>
<p>Code full of <code>if (x instanceof Card) ... else if (x instanceof Upi)</code> has to be edited every time a new type appears.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> put the behaviour inside each class and call one method, as in the example above.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Overriding equals() without hashCode()</p>
<p>If two objects are "equal", Java's hash-based collections (HashMap, HashSet) also expect them to have the same hash code. If they do not, the map looks in the wrong place and cannot find your object.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> always override both together, using the same fields in each. A <code>record</code> does this for you automatically.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>An object bundles data with the actions that are allowed on that data.</li>
<li>Code should depend on interfaces (promises), not on specific classes.</li>
<li>Polymorphism lets one method call do the right thing for each type of object.</li>
<li>Prefer composition (has-a) over inheritance (is-a) for reusing code.</li>
<li>Good design means adding a feature by adding code, not by editing working code.</li>
</ul>
<p><b>Next:</b> the questions below cover SOLID, the main design principles, and the classic OOP interview puzzles.</p>`);

appendTopic("java-oop", [
{
  q: "Model a bank account so that invalid states are impossible",
  level: "beginner", hot: true, tags: ["encapsulation", "invariants", "design", "must-know"],
  companies: ["Goldman Sachs", "JPMorgan", "Amazon", "Infosys", "TCS", "Wipro", "Accenture"],
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
