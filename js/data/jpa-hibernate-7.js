registerPrimer("jpa-hibernate", `<p class="pr-lead"><b>JPA</b> and <b>Hibernate</b> let you work with database rows as normal Java objects. Instead of writing SQL for every insert and update, you write a <code>Customer</code> class, and Hibernate turns your changes to Customer objects into the right SQL. It saves a lot of code, but you need to understand how it decides <em>when</em> to talk to the database.</p>
<div class="pr-analogy"><b>Think of it like this</b>Imagine a secretary with a notebook. When you ask for a customer's file, the secretary fetches it from the archive (the database) and writes a copy in the notebook. You make changes on that copy. At the end of the day (the end of the transaction), the secretary compares the notebook with the original files and sends the archive only the changes. You never have to say "please save this"; anything changed in the notebook gets saved.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>JPA</dt><dd>The Java standard that defines how objects map to database tables. It is a set of rules and annotations.</dd>
<dt>Hibernate</dt><dd>The most popular library that actually implements JPA and generates the SQL.</dd>
<dt>Spring Data JPA</dt><dd>A layer on top that writes your repository classes for you: <code>findByEmail(...)</code> works just from its name.</dd>
<dt>Entity</dt><dd>A Java class mapped to a table, marked <code>@Entity</code>. Each object is one row.</dd>
<dt>Persistence context</dt><dd>The "notebook": the set of entities Hibernate is tracking during one transaction.</dd>
<dt>Managed / detached</dt><dd>A managed entity is in the notebook, and its changes are saved automatically. A detached one is not tracked, so changes to it are ignored.</dd>
<dt>Lazy loading</dt><dd>Related data (such as a customer's orders) is only loaded from the database when you first use it.</dd>
<dt>N+1 problem</dt><dd>One query to load a list, then one more query for every item in the list: 1 + N queries instead of 1 or 2.</dd>
</dl>

<h3>Step by step: what happens inside a transaction</h3>
<ol class="pr-steps">
<li>A method marked <code>@Transactional</code> starts. Hibernate opens an empty notebook (persistence context).</li>
<li>You load a customer: <code>findById(7)</code>. Hibernate runs a SELECT and keeps the object in the notebook. It is now <b>managed</b>.</li>
<li>You load the same customer again. No SQL runs; you get the same object straight from the notebook.</li>
<li>You change a field: <code>customer.setName("Asha")</code>. Still no SQL.</li>
<li>The method ends and the transaction commits. Hibernate compares each managed object with how it looked when loaded (<b>dirty checking</b>), sees the name changed, and runs one UPDATE.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 214" role="img" aria-label="JPA entity lifecycle: transient, managed, detached and removed, with the operations that move between them">
  <defs><marker id="pr-jpa" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="72" width="120" height="56" rx="9"/>
  <text class="dg-t" x="70" y="96" text-anchor="middle">Transient</text>
  <text class="dg-s" x="70" y="114" text-anchor="middle">new Order(), no id</text>
  <line class="dg-line" x1="130" y1="100" x2="236" y2="100" marker-end="url(#pr-jpa)"/>
  <text class="dg-m" x="183" y="92" text-anchor="middle">persist()</text>
  <rect class="dg-fill" x="238" y="60" width="150" height="80" rx="10"/>
  <text class="dg-t" x="313" y="86" text-anchor="middle">Managed</text>
  <text class="dg-s" x="313" y="104" text-anchor="middle">in the persistence context</text>
  <text class="dg-s" x="313" y="120" text-anchor="middle">changes are tracked</text>
  <line class="dg-line" x1="388" y1="86" x2="486" y2="62" marker-end="url(#pr-jpa)"/>
  <text class="dg-s" x="440" y="58" text-anchor="middle">tx ends / detach()</text>
  <rect class="dg-box" x="488" y="30" width="122" height="56" rx="9"/>
  <text class="dg-t" x="549" y="54" text-anchor="middle">Detached</text>
  <text class="dg-s" x="549" y="72" text-anchor="middle">has id, not tracked</text>
  <line class="dg-line" x1="488" y1="76" x2="390" y2="104" marker-end="url(#pr-jpa)"/>
  <text class="dg-m" x="456" y="106" text-anchor="middle">merge()</text>
  <line class="dg-line" x1="388" y1="124" x2="486" y2="152" marker-end="url(#pr-jpa)"/>
  <text class="dg-m" x="424" y="152" text-anchor="middle">remove()</text>
  <rect class="dg-box" x="488" y="130" width="122" height="56" rx="9"/>
  <text class="dg-t" x="549" y="154" text-anchor="middle">Removed</text>
  <text class="dg-s" x="549" y="172" text-anchor="middle">DELETE at flush</text>
  <line class="dg-line" x1="313" y1="140" x2="313" y2="176" marker-end="url(#pr-jpa)"/>
  <text class="dg-s" x="313" y="192" text-anchor="middle">find() / query results arrive here already MANAGED</text>
  <text class="dg-s" x="313" y="30" text-anchor="middle">at commit (flush): changed fields become UPDATE, automatically</text>
  <line class="dg-line" x1="313" y1="36" x2="313" y2="58" stroke-dasharray="3 3"/>
</svg>
<figcaption>Only managed entities are tracked. Most JPA surprises come from an entity that is detached when you thought it was managed, or the other way round.</figcaption>
</figure>

<h3>A worked example, line by line</h3>
<pre><code>@Transactional
public void rename(long customerId, String newName) {
    Customer c = customers.findById(customerId).orElseThrow();
    c.setName(newName);
}   // the UPDATE happens here, when the transaction commits</code></pre>
<ol class="pr-steps">
<li><code>findById</code> runs <code>select ... from customer where id = ?</code> and puts the customer in the notebook.</li>
<li><code>setName</code> only changes the Java object in memory.</li>
<li>There is no <code>save()</code> call, and none is needed: the customer is managed.</li>
<li>When the method returns, the transaction commits and Hibernate sends <code>update customer set name = ? where id = ?</code>.</li>
<li>Without <code>@Transactional</code>, the customer would be detached right after loading, and the change would never be saved.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ The N+1 query problem</p>
<p>You load 100 orders, then loop over them reading <code>order.getCustomer().getName()</code>. Each customer is loaded lazily, so Hibernate runs 1 query for the orders plus 100 more for the customers. Fast with 10 rows in testing, painfully slow with thousands in production.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> load the related data in the same query with <code>JOIN FETCH</code> or an <code>@EntityGraph</code>, or select only the fields you need.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ LazyInitializationException</p>
<p>You read a lazy relationship after the transaction has ended, for example while turning an entity into JSON in the controller. The notebook is closed, so Hibernate cannot load it any more.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> load what you need inside the transaction (with a fetch join) and return a simple DTO object, not the entity.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Making every relationship EAGER</p>
<p>EAGER means "always load this too". It seems convenient, but then every query drags in related tables you did not need, often with extra queries.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> make relationships LAZY and fetch related data explicitly in the queries that need it.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Updating one side of a two-way relationship only</p>
<p>In a two-way relationship, only one side (the owning side) writes the foreign key. Adding an item to <code>order.getItems()</code> without setting <code>item.setOrder(order)</code> saves nothing.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> write a helper like <code>order.addItem(item)</code> that sets both sides.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Entities are Java objects mapped to tables; Hibernate writes the SQL.</li>
<li>Inside a transaction, loaded entities are managed and changes save automatically at commit.</li>
<li>Lazy relationships load on first use and need an open transaction.</li>
<li>Watch for N+1 queries and fix them with fetch joins or projections.</li>
<li>Use database migrations (Flyway or Liquibase) to change tables, not Hibernate auto-update.</li>
</ul>
<p><b>Next:</b> the questions below cover fetching, caching, locking, transactions and performance tuning.</p>`);

appendTopic("jpa-hibernate", [
{
  q: "Your update saved nothing, or saved something you never asked for. Explain both",
  level: "advanced", hot: true, tags: ["dirty-checking", "persistence-context", "detached", "must-know"],
  companies: ["Amazon", "Goldman Sachs", "JP Morgan", "Walmart", "SAP", "Infosys", "TCS"],
  a: `<p>Both bugs have the same root cause: not knowing whether an entity is <strong>managed</strong> (tracked, changes saved automatically at commit) or <strong>detached</strong> (not tracked, changes ignored). Walk through each.</p>
<p><strong>Bug 1: the change silently disappears.</strong></p>
<pre><code>// No @Transactional on this method or its class
public void deactivate(long id) {
    User u = users.findById(id).orElseThrow();
    // Spring Data's findById runs in its OWN short transaction, which ends
    // as soon as it returns. Outside a web request u is now DETACHED. (With
    // open-in-view it stays attached, but no transaction will flush it.)

    u.setActive(false);
    // No transaction is going to commit this change. No UPDATE is issued.
}   // no error, no warning, no change in the database

// Fix A: make the method transactional, so u stays managed until commit
@Transactional
public void deactivate(long id) {
    users.findById(id).orElseThrow().setActive(false);   // UPDATE at commit
}

// Fix B: explicit save. Works, but hides the misunderstanding
u.setActive(false);
users.save(u);            // merge(): loads the row again and copies the state over</code></pre>
<p><strong>Bug 2: something is saved that you did not intend.</strong></p>
<pre><code>@Transactional
public PriceQuote quote(long productId, String coupon) {
    Product p = products.findById(productId).orElseThrow();   // MANAGED

    // "Just for this calculation" - apply the discount to the entity
    p.setPrice(p.getPrice().multiply(new BigDecimal("0.90")));

    return new PriceQuote(p.getId(), p.getPrice());
}   // COMMIT: dirty check sees price changed -&gt; UPDATE product set price=...
    // Every quote now permanently cuts the real price by 10%.</code></pre>
<p>Nobody called <code>save()</code>, so this is a nasty one to find in code review. The fix is to <strong>never use a managed entity as a scratch pad</strong>:</p>
<pre><code>@Transactional(readOnly = true)             // Hibernate skips dirty checking entirely,
public PriceQuote quote(long productId, String coupon) {   // so accidental writes
    Product p = products.findById(productId).orElseThrow(); // are not flushed
    BigDecimal discounted = p.getPrice().multiply(new BigDecimal("0.90"));
    return new PriceQuote(p.getId(), discounted);            // compute into a new value
}</code></pre>
<table>
<tr><th>Situation</th><th>Entity state</th><th>Setter changes</th></tr>
<tr><td>Inside <code>@Transactional</code>, loaded in that transaction</td><td>Managed</td><td><strong>Saved at commit</strong>, no <code>save()</code> needed</td></tr>
<tr><td>Loaded without a surrounding transaction</td><td>Detached right after loading</td><td>Ignored</td></tr>
<tr><td>Received as a request body (<code>@RequestBody</code>)</td><td>Transient or detached</td><td>Ignored until you <code>save()</code> (merge)</td></tr>
<tr><td>Inside <code>@Transactional(readOnly = true)</code></td><td>Managed, not flushed</td><td>Not written (Hibernate turns off flushing)</td></tr>
<tr><td>After <code>entityManager.clear()</code> or <code>detach()</code></td><td>Detached</td><td>Ignored</td></tr>
</table>
<p><strong>A third trap nearby: merge returns a different object.</strong></p>
<pre><code>User detached = ...;                       // e.g. deserialised from a request
User managed = users.save(detached);       // merge copies INTO a managed instance
detached.setEmail("x@y.com");              // WRONG object: this change is lost
managed.setEmail("x@y.com");               // right: this one is tracked
// Always carry on with the object save() returns.</code></pre>
<p><strong>How to explain it in one breath:</strong> "Inside a transaction, a loaded entity is managed, and any change to it is written at commit whether or not I call save. Outside one, it is detached and changes are ignored. So I keep write methods transactional, mark read-only ones <code>readOnly = true</code>, and never modify an entity just to compute something."</p>`
},
{
  q: "Page through a ten-million-row table without slowing down: offset vs keyset pagination",
  level: "advanced", hot: true, tags: ["pagination", "performance", "sql", "spring-data"],
  companies: ["Amazon", "Flipkart", "Walmart", "Uber", "Swiggy", "LinkedIn", "Atlassian"],
  a: `<p>Spring Data makes pagination one line: <code>findAll(PageRequest.of(page, 50))</code>. It works perfectly in development and gets slower and slower in production, because of how <code>OFFSET</code> works.</p>
<pre><code>// Page 1:     select ... order by id limit 50 offset 0          fast
// Page 1000:  select ... order by id limit 50 offset 49950      slow
// The database cannot jump to row 49,950. It reads and throws away
// 49,950 rows to return 50. The deeper the page, the more wasted work.

// And Page&lt;T&gt; runs a SECOND query every time:
//   select count(*) from orders where ...     on 10M rows, often slower
//                                            than the page itself</code></pre>
<p><strong>Keyset pagination</strong> (also called seek or cursor pagination) remembers where the last page ended and asks for rows <em>after</em> it. With an index on the sort column, the database jumps straight there, so page 1000 is as fast as page 1.</p>
<pre><code>// Page 1
select * from orders where customer_id = ? order by id limit 50;

// Next page: "give me 50 more AFTER the last id I saw"
select * from orders where customer_id = ? and id &gt; :lastId order by id limit 50;

// Spring Data JPA: return a Slice (no count query) or a List
interface OrderRepository extends JpaRepository&lt;Order, Long&gt; {
    List&lt;Order&gt; findTop50ByCustomerIdAndIdGreaterThanOrderByIdAsc(String customerId, long afterId);
}</code></pre>
<p><strong>Sorting by a column that is not unique</strong> (say, newest first by <code>created_at</code>) needs a tie-breaker, or rows with the same timestamp get skipped or repeated across pages:</p>
<pre><code>-- index: (customer_id, created_at DESC, id DESC)
select * from orders
where customer_id = :c
  and (created_at, id) &lt; (:lastCreatedAt, :lastId)     -- row comparison (PostgreSQL)
order by created_at desc, id desc
limit 50;

// The API returns an opaque cursor instead of a page number:
// GET /orders?limit=50
// { "items": [...], "nextCursor": "eyJjIjoiMjAyNi0wMy0xMFQxMDowMFoiLCJpIjo5ODc2fQ" }
// GET /orders?limit=50&amp;cursor=eyJjIjoi...    (base64 of the last created_at + id)</code></pre>
<pre><code>// Spring Data 3.1+ supports this directly with ScrollPosition and Window
Window&lt;Order&gt; first = repo.findFirst50ByCustomerIdOrderByCreatedAtDescIdDesc(
        customerId, ScrollPosition.keyset());
Window&lt;Order&gt; next = repo.findFirst50ByCustomerIdOrderByCreatedAtDescIdDesc(
        customerId, first.positionAt(first.size() - 1));
// first.hasNext() tells you whether to show "Load more"</code></pre>
<table>
<tr><th></th><th>Offset (<code>page=1000</code>)</th><th>Keyset (<code>after=cursor</code>)</th></tr>
<tr><td>Deep page speed</td><td>Degrades linearly</td><td>Constant, with the right index</td></tr>
<tr><td>Jump to page 37</td><td>Yes</td><td>No: only next (and previous)</td></tr>
<tr><td>Total count</td><td>Yes, at the cost of a count query</td><td>No (show "load more" instead)</td></tr>
<tr><td>Rows inserted while paging</td><td>Items shift: duplicates or skipped rows</td><td>Stable</td></tr>
<tr><td>Best for</td><td>Admin tables with page numbers, small data</td><td>Feeds, infinite scroll, APIs, exports, batch jobs</td></tr>
</table>
<p><strong>For offset pagination you must keep:</strong> return <code>Slice</code> instead of <code>Page</code> when the UI only needs "is there a next page" (no count query), cap the maximum page number, and consider an approximate count from database statistics for huge tables.</p>
<p><strong>The summary:</strong> "Offset pagination reads and discards every skipped row and runs a count query, so it gets slower the deeper you go. For large tables, feeds and APIs I use keyset pagination on an indexed, unique sort key, and return a cursor instead of a page number."</p>`
}
]);
