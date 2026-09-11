appendTopic("java-oop", [
{
  q: "Why should you favour immutability, and how do you make a class properly immutable?",
  level: "advanced", hot: true, tags: ["oop", "immutability", "design", "concurrency"],
  companies: ["Amazon", "Goldman Sachs", "SAP", "Oracle", "Optum", "EPAM", "Morgan Stanley"],
  a: `<pre><code>public final class Money {                        // 1. final class
    private final String currency;                // 2. final fields
    private final long minorUnits;
    private final List&lt;String&gt; tags;

    public Money(String currency, long minorUnits, List&lt;String&gt; tags) {
        this.currency = Objects.requireNonNull(currency);
        this.minorUnits = minorUnits;
        this.tags = List.copyOf(tags);            // 3. DEFENSIVE COPY in
    }
    public List&lt;String&gt; tags() { return tags; }   // 4. already unmodifiable out
    public Money plus(Money o) {                  // 5. return a NEW instance
        return new Money(currency, minorUnits + o.minorUnits, tags);
    }
}</code></pre>
<table>
<tr><th>Rule</th><th>Why</th></tr>
<tr><td>Class <code>final</code>, or a private constructor</td><td>A subclass could add mutable state</td></tr>
<tr><td>All fields <code>private final</code></td><td>No reassignment — and it gives safe publication</td></tr>
<tr><td>No setters</td><td>Obvious, but someone always adds "just one"</td></tr>
<tr><td><strong>Defensive copy on the way in</strong></td><td>Otherwise the caller still holds a reference to your list</td></tr>
<tr><td><strong>Defensive copy on the way out</strong></td><td>Returning the internal collection lets callers mutate you</td></tr>
<tr><td>Deep, not shallow</td><td>A <code>final</code> reference to a mutable object is still mutable</td></tr>
</table>
<pre><code>// The record caveat worth naming out loud
record Order(long id, List&lt;Item&gt; items) { }
var o = new Order(1, myList);
myList.add(extra);            // o.items() JUST CHANGED — records are only
                              // SHALLOWLY immutable

// Fix it in the compact constructor:
record Order(long id, List&lt;Item&gt; items) {
    Order { items = List.copyOf(items); }
}</code></pre>
<p><strong>What immutability buys:</strong> thread safety with no synchronisation at all; a hash code that can be cached (exactly why <code>String</code> is immutable); safe use as a <code>HashMap</code> key; and no defensive copying at every call site, because there is nothing left to defend against.</p>
<p><strong>The memory-model guarantee to mention:</strong> <code>final</code> fields have a special safe-publication rule — once the constructor returns, any thread that sees the object reference is guaranteed to see its fully-initialised final fields, with no synchronisation. That guarantee does <em>not</em> extend to non-final fields, which is precisely why double-checked locking needs <code>volatile</code>.</p>
<p><strong>The pragmatic caveat:</strong> JPA entities cannot be immutable — Hibernate needs a no-arg constructor and mutable fields. So I keep entities mutable and confined to the persistence layer, and use immutable records for everything that crosses a boundary: DTOs, events, value objects.</p>`
},
{
  q: "What is the Law of Demeter, and how do you spot a violation?",
  level: "advanced", tags: ["oop", "design", "best-practice"],
  companies: ["Amazon", "ThoughtWorks", "SAP", "Optum", "EPAM", "Oracle"],
  a: `<p><strong>"Talk only to your immediate friends."</strong> A method should call methods on itself, its own fields, its parameters, and objects it created — <em>not</em> on objects returned by those.</p>
<pre><code>// ✗ A train wreck — this one line now depends on four classes
order.getCustomer().getAddress().getCity().getPostcode();

// Any change to Address or City breaks it, in every file that has it. It also
// means Order has leaked its entire object graph to its callers.

// ✔ Ask the object to answer the question
order.deliveryPostcode();

// ✔ Or take the collaborator you actually need
void ship(Postcode postcode) { }     // instead of taking an Order and digging</code></pre>
<table>
<tr><th>Symptom</th><th>Usually means</th></tr>
<tr><td>Three or more dots of navigation</td><td>The caller is doing work that belongs to the callee</td></tr>
<tr><td>Deep chains stubbed in a test</td><td>You are mocking a graph, not a collaborator</td></tr>
<tr><td>Getters that only feed other getters</td><td>An anaemic model — behaviour lives outside the data</td></tr>
</table>
<p><strong>The important exception:</strong> fluent APIs chain deliberately. <code>stream().filter().map()</code> and <code>HttpRequest.newBuilder().uri(u).build()</code> return <em>the same abstraction</em> at each step, so there is no hidden structural coupling. The rule is about traversing a data structure, not about counting dots.</p>
<p><strong>Say this:</strong> "It is a coupling heuristic, not a law. When I see a long navigation chain I ask whether the caller should be asking a question instead of fetching data to answer it itself — <code>order.canShipTo(country)</code> rather than pulling the address apart from outside."</p>`
}
]);
