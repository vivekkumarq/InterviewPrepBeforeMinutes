registerPrimer("testing", `<p class="pr-lead"><b>Automated tests</b> are small programs that check your real program works. Instead of clicking through the app by hand after every change, you run hundreds of checks in seconds. Good tests catch bugs before users do, and they give you the confidence to change code without fear of breaking something else.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of building a car. You test each part on its own first: does this brake pad grip, does this bulb light up? That is fast and cheap, and when one fails you know exactly which part is broken (<b>unit tests</b>). Then you test parts working together: does the brake pedal actually stop the wheel (<b>integration tests</b>)? Finally, a few test drives of the whole car (<b>end-to-end tests</b>), which are slow and expensive, so you do fewer of them.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Unit test</dt><dd>Tests one small piece (a method or class) on its own. Runs in milliseconds.</dd>
<dt>Integration test</dt><dd>Tests several pieces together, often with a real database or message broker.</dd>
<dt>End-to-end (E2E) test</dt><dd>Tests the whole system the way a user would, such as through a browser.</dd>
<dt>Assertion</dt><dd>The check inside a test: "I expect this value to be 49".</dd>
<dt>Mock</dt><dd>A fake version of a dependency that you control, so you can test your code without the real thing.</dd>
<dt>JUnit / Mockito / AssertJ</dt><dd>The standard Java tools for writing tests, creating mocks and writing readable assertions.</dd>
<dt>Testcontainers</dt><dd>Starts real databases or services in Docker just for your tests.</dd>
<dt>Code coverage</dt><dd>The share of your code that ran during tests. Useful for finding untested code, but not a measure of test quality.</dd>
</dl>

<h3>The testing pyramid</h3>
<p>Every kind of test trades <b>speed</b> against <b>realism</b>. So the healthy shape is a pyramid: many fast unit tests at the bottom, fewer integration tests in the middle, and only a handful of slow end-to-end tests at the top.</p>
<figure class="fig">
<svg viewBox="0 0 620 226" role="img" aria-label="Testing pyramid: many unit tests at the base, fewer integration tests, few end-to-end tests at the top, with speed and realism trade-offs">
  <polygon class="dg-fill2" points="310,14 380,74 240,74"/>
  <text class="dg-t" x="310" y="62" text-anchor="middle">E2E</text>
  <polygon class="dg-fill" points="240,80 380,80 450,146 170,146"/>
  <text class="dg-t" x="310" y="112" text-anchor="middle">Integration</text>
  <text class="dg-s" x="310" y="130" text-anchor="middle">real DB, real HTTP layer</text>
  <polygon class="dg-box" points="170,152 450,152 520,214 100,214"/>
  <text class="dg-t" x="310" y="180" text-anchor="middle">Unit</text>
  <text class="dg-s" x="310" y="198" text-anchor="middle">one class, no I/O, milliseconds</text>
  <text class="dg-s" x="400" y="40">a handful: critical user journeys</text>
  <text class="dg-s" x="468" y="112">tens to hundreds</text>
  <text class="dg-s" x="530" y="186">thousands</text>
  <text class="dg-s" x="10" y="40">slower, more realistic,</text>
  <text class="dg-s" x="10" y="56">flakier, vaguer failures</text>
  <text class="dg-s" x="10" y="186">faster, precise failures,</text>
  <text class="dg-s" x="10" y="202">less realistic</text>
</svg>
<figcaption>Push each check down to the lowest layer that can catch it. Use the higher layers for what only they can see.</figcaption>
</figure>

<h3>Step by step: writing one good unit test</h3>
<p>The rule being tested: orders of ₹1000 or more ship free; below that, shipping costs ₹49.</p>
<pre><code>class ShippingCalculatorTest {

    ShippingCalculator calc = new ShippingCalculator();

    @Test
    void ordersOf1000OrMore_shipFree() {
        Cart cart = cartWithTotal("1000.00");      // 1. Arrange: set up the situation
        Money fee = calc.fee(cart);               // 2. Act: call the code being tested
        assertThat(fee).isEqualTo(Money.ZERO);    // 3. Assert: check the result
    }

    @Test
    void ordersJustBelow1000_payStandardFee() {
        assertThat(calc.fee(cartWithTotal("999.99"))).isEqualTo(Money.of("49.00"));
    }
}</code></pre>
<ol class="pr-steps">
<li><b>Arrange:</b> build exactly the situation you want to test, here a cart worth ₹1000.</li>
<li><b>Act:</b> make one call to the code under test.</li>
<li><b>Assert:</b> check the result precisely.</li>
<li>The test name describes the <b>behaviour</b>, so a failure reads like a broken business rule.</li>
<li>The two tests check the <b>boundary</b> (₹1000 and ₹999.99), because that is where bugs usually hide, for example <code>&gt;</code> written instead of <code>&gt;=</code>.</li>
<li>No database and no Spring, so the tests run in about a millisecond and can run in any order.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Mocking everything</p>
<p>When every dependency is a mock, the test often just repeats the code's internal steps. It breaks on every refactor but misses real bugs, such as a wrong SQL query.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> mock only slow or external things (other services, the clock). Use real objects for everything else, and Testcontainers for the database.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using <code>Thread.sleep</code> to wait</p>
<p>Sleeping too little makes the test fail randomly; sleeping too much makes the whole suite slow.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> wait for the condition with a tool like Awaitility, or inject a controllable clock.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Chasing 100% coverage</p>
<p>A test that runs code but checks nothing still counts towards coverage. High coverage can hide useless tests.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> focus on testing important behaviour and edge cases; treat coverage as a hint about what is untested.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Tests that depend on each other</p>
<p>If one test relies on data left behind by another, tests pass or fail depending on the order they run in.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> every test sets up its own data and cleans up after itself.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Many fast unit tests, fewer integration tests, very few end-to-end tests.</li>
<li>Structure each test as Arrange, Act, Assert.</li>
<li>Name tests after the behaviour they check, and always test the boundaries.</li>
<li>Mock only slow or external dependencies; prefer real databases via Testcontainers.</li>
<li>A test that can never fail is worthless.</li>
</ul>
<p><b>Next:</b> the questions below cover JUnit 5, Mockito, Spring Boot test slices, Testcontainers, contract tests, TDD and testing tricky code.</p>`);

appendTopic("testing", [
{
  q: "Write the tests for this discount function. Which cases do you pick, and why?",
  level: "beginner", hot: true, tags: ["test-design", "boundary-values", "parameterized-tests", "junit5", "must-know"],
  companies: ["Infosys", "TCS", "Wipro", "Accenture", "Amazon", "Microsoft", "Goldman Sachs", "SAP"],
  a: `<p>"Write tests for this" checks whether you choose cases systematically or just try a couple of values. The two techniques to name are <strong>equivalence partitioning</strong> (group inputs that should behave the same, test one from each group) and <strong>boundary value analysis</strong> (test the edges between groups, where off-by-one bugs live).</p>
<pre><code>/**
 * Loyalty discount on an order total (in rupees):
 *   total below 500            -&gt; no discount
 *   500 up to 1999.99          -&gt; 5%
 *   2000 and above             -&gt; 10%, capped at 500 rupees
 *   Gold members get an extra 2% on top, still within the cap.
 *   Negative totals are rejected.
 */
BigDecimal discount(BigDecimal total, boolean gold)</code></pre>
<p><strong>Step 1: find the partitions.</strong> Invalid (negative), no discount (0 to 499.99), 5% (500 to 1999.99), 10% uncapped, 10% capped, and each of those for gold and non-gold.</p>
<p><strong>Step 2: find the boundaries.</strong> 0, 499.99 / 500, 1999.99 / 2000, and where the cap starts to bite: 10% reaches 500 at a total of 5000, and 12% (gold) reaches it at about 4166.67.</p>
<pre><code>@ParameterizedTest(name = "total {0}, gold={1} -&gt; discount {2}")
@CsvSource({
    // total,    gold,  expected
    "0,          false, 0.00",      // lowest valid
    "499.99,     false, 0.00",      // just below the first tier
    "500.00,     false, 25.00",     // first tier starts: 5%
    "1999.99,    false, 100.00",    // top of 5% tier (99.9995 rounds half-even to 100.00)
    "2000.00,    false, 200.00",    // 10% tier starts
    "4999.99,    false, 500.00",    // 10% = 499.999 -&gt; 500.00 after rounding
    "5000.00,    false, 500.00",    // cap reached exactly
    "20000.00,   false, 500.00",    // well above the cap
    "500.00,     true,  35.00",     // gold: 5% + 2% = 7%
    "2000.00,    true,  240.00",    // gold: 12%
    "4166.62,    true,  499.99",    // gold just under the cap (12% = 499.9944)
    "4166.67,    true,  500.00",    // gold cap reached
})
void discountTable(BigDecimal total, boolean gold, BigDecimal expected) {
    assertThat(calc.discount(total, gold)).isEqualByComparingTo(expected);
}

@Test
void negativeTotalIsRejected() {
    assertThatThrownBy(() -&gt; calc.discount(new BigDecimal("-0.01"), false))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("negative");
}

@Test
void nullTotalIsRejected() {
    assertThatThrownBy(() -&gt; calc.discount(null, false))
        .isInstanceOf(NullPointerException.class);
}</code></pre>
<table>
<tr><th>Case type</th><th>Example here</th><th>Catches</th></tr>
<tr><td>Each partition once</td><td>1000 (5%), 3000 (10%)</td><td>A tier with the wrong percentage</td></tr>
<tr><td>Both sides of each boundary</td><td>499.99 and 500.00</td><td><code>&gt;</code> written where <code>&gt;=</code> was meant</td></tr>
<tr><td>Cap boundary</td><td>4999.99, 5000.00, 20000</td><td>Missing or misplaced cap</td></tr>
<tr><td>Combination</td><td>Gold at each tier</td><td>Extras applied in the wrong order, or skipping the cap</td></tr>
<tr><td>Invalid input</td><td>-0.01, null</td><td>Silent garbage instead of a clear error</td></tr>
<tr><td>Rounding</td><td>1999.99, 4999.99</td><td>Half-up vs half-even, scale 2 vs more</td></tr>
</table>
<p><strong>Two details that show experience:</strong> <code>isEqualByComparingTo</code> instead of <code>isEqualTo</code> (for BigDecimal, <code>equals</code> treats 25.0 and 25.00 as different), and writing the rounding rule into the test table. Rounding is where most money bugs hide, and the spec above does not even state it, which is worth pointing out: "What rounding mode do you want? I have assumed HALF_EVEN to 2 places."</p>
<p><strong>The answer's shape:</strong> "Partition the inputs, test one value per partition and both sides of every boundary, add the combinations and invalid inputs, and put them in a parameterized table so each case is one readable line."</p>`
},
{
  q: "What is property-based testing, and what bugs does it find that example tests miss?",
  level: "advanced", tags: ["property-based-testing", "jqwik", "edge-cases", "test-design"],
  companies: ["Google", "Amazon", "Jane Street", "Goldman Sachs", "Atlassian", "Microsoft"],
  a: `<p>An example-based test checks one input you thought of: <code>sort([3, 1, 2]) == [1, 2, 3]</code>. The bugs, though, are usually in inputs you did <em>not</em> think of. A <strong>property-based test</strong> states a rule that must hold for <em>every</em> input, and the library generates hundreds of inputs, including nasty edge cases, trying to break it.</p>
<pre><code>// jqwik: a JUnit 5 engine for property-based testing
@Property
void reversingTwiceGivesTheOriginal(@ForAll List&lt;Integer&gt; list) {
    assertThat(reverse(reverse(list))).isEqualTo(list);
}
// jqwik runs this with 1,000 generated lists by default: empty, one
// element, duplicates, Integer.MIN_VALUE, very long lists...</code></pre>
<p><strong>The power is in shrinking.</strong> When a generated input fails, the library simplifies it step by step to the <em>smallest</em> input that still fails, and reports that. You get <code>[0, 0]</code> instead of a 300-element random list.</p>
<pre><code>// A real-looking bug: a "safe" average
static int average(int a, int b) { return (a + b) / 2; }

@Property
void averageLiesBetweenItsInputs(@ForAll int a, @ForAll int b) {
    int avg = average(a, b);
    assertThat(avg).isBetween(Math.min(a, b), Math.max(a, b));
}

// jqwik output:
//   Shrunk Sample:  a = 1073741824, b = 1073741824
//   Expected avg between 1073741824 and 1073741824 but was -1073741824
// Integer overflow in a + b. Five hand-written examples would never have tried it.
// Fix: a + (b - a) / 2 when the signs match, or (a &amp; b) + ((a ^ b) &gt;&gt; 1)</code></pre>
<p><strong>The hard part is choosing properties.</strong> You rarely know the exact output for a random input, so you test relationships instead:</p>
<table>
<tr><th>Property pattern</th><th>Example</th></tr>
<tr><td><strong>Round trip</strong>: undo gives back the input</td><td><code>parse(format(x)) == x</code>; <code>decrypt(encrypt(m)) == m</code>; JSON serialise then deserialise</td></tr>
<tr><td><strong>Invariant</strong>: something never changes</td><td>Sorting keeps the same elements and size; a transfer keeps the total money constant</td></tr>
<tr><td><strong>Idempotence</strong>: doing it twice equals once</td><td><code>normalise(normalise(s)) == normalise(s)</code>; applying the same event twice</td></tr>
<tr><td><strong>Oracle</strong>: compare with a simple, slow version</td><td>Your optimised search matches a plain linear scan</td></tr>
<tr><td><strong>Never crashes</strong></td><td>The parser throws only its own documented exception on any string</td></tr>
</table>
<pre><code>// Invariant on business logic: splitting a bill must never create or lose money
@Property
void splitSharesAlwaysAddUpToTotal(@ForAll @LongRange(min = 0, max = 10_000_000) long totalPaise,
                                   @ForAll @IntRange(min = 1, max = 50) int people) {
    List&lt;Long&gt; shares = splitEqually(totalPaise, people);
    assertThat(shares).hasSize(people);
    assertThat(shares.stream().mapToLong(Long::longValue).sum()).isEqualTo(totalPaise);
    assertThat(Collections.max(shares) - Collections.min(shares)).isLessThanOrEqualTo(1);
}</code></pre>
<table>
<tr><th>Use property tests for</th><th>Stick to examples for</th></tr>
<tr><td>Parsers, serialisers, encoders</td><td>Specific business cases a product owner can read</td></tr>
<tr><td>Money and rounding logic</td><td>UI flows</td></tr>
<tr><td>Data structures and algorithms</td><td>Documenting one exact expected output</td></tr>
<tr><td>Anything with a clear invariant</td><td>Code whose "property" would be a copy of the implementation</td></tr>
</table>
<p><strong>The summary:</strong> "Example tests check the cases I thought of; property tests check a rule against cases I did not think of, and shrink any failure to a minimal example. They find overflow, empty-input and rounding bugs that are nearly invisible otherwise. I use both: examples for readability, properties for the invariants."</p>`
}
]);
