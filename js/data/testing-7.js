registerPrimer("testing", `<h3>The mental model: many small fast tests, a few big slow ones</h3>
<p>Every test trades <strong>speed and precision</strong> against <strong>realism</strong>. A unit test runs in milliseconds and points at the exact broken line, but it cannot tell you whether your SQL works against a real database. An end-to-end test proves the whole system works together, but it takes minutes, breaks for reasons unrelated to your change, and says only "something is wrong somewhere". The <strong>testing pyramid</strong> is the resulting shape: lots of the cheap kind at the bottom, fewer of each more expensive kind above.</p>
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
<h3>Worked example: one good unit test, taken apart</h3>
<pre><code>class ShippingCalculatorTest {

    private final ShippingCalculator calc = new ShippingCalculator();

    @Test
    void ordersOverThreshold_shipFree() {                       // NAME: the behaviour,
        // ARRANGE: build exactly the situation under test       // not the method name
        Cart cart = cartWithTotal("1000.00");

        // ACT: one call to the thing being tested
        Money fee = calc.fee(cart);

        // ASSERT: one behaviour, checked precisely
        assertThat(fee).isEqualTo(Money.ZERO);
    }

    @Test
    void ordersJustBelowThreshold_payStandardFee() {
        assertThat(calc.fee(cartWithTotal("999.99"))).isEqualTo(Money.of("49.00"));
    }
}

// What makes these GOOD:
//  - Fast: no Spring context, no database. Runs in about 1 ms.
//  - Independent: no shared state, runs in any order.
//  - Named after behaviour: a failure message reads like a broken rule.
//  - Tests the BOUNDARY (1000.00 vs 999.99), where bugs actually live.
//  - Would fail if the rule broke. A test that cannot fail is decoration.</code></pre>
<h3>Which kind of test for which question</h3>
<table>
<tr><th>You want to know</th><th>Test with</th></tr>
<tr><td>Is this calculation or rule correct?</td><td>Unit test, plain JUnit</td></tr>
<tr><td>Does my SQL / JPA mapping work?</td><td><code>@DataJpaTest</code> with Testcontainers (a real Postgres)</td></tr>
<tr><td>Does the endpoint validate input and return the right status?</td><td><code>@WebMvcTest</code> with MockMvc</td></tr>
<tr><td>Does my client handle the other service's timeouts and errors?</td><td>WireMock</td></tr>
<tr><td>Do the provider and consumer still agree on the API?</td><td>Contract test (Pact, Spring Cloud Contract)</td></tr>
<tr><td>Can a user actually check out?</td><td>A few end-to-end tests (Playwright, Selenium)</td></tr>
</table>
<p><strong>Warning sign:</strong> if most of your tests need <code>@SpringBootTest</code> and a mock for every dependency, the business logic is tangled with the framework. Pull the rules into plain classes and most of those tests become fast unit tests.</p>`);

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
