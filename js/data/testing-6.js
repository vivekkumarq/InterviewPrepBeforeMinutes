appendTopic("testing", [
{
  q: "What is a flaky test, and how do you deal with one?",
  level: "advanced", hot: true, tags: ["flaky", "process", "production", "best-practice"],
  companies: ["Amazon", "Google", "Optum", "SAP", "ThoughtWorks", "Flipkart", "EPAM", "Maersk"],
  a: `<p>A flaky test passes and fails on the same code. It is worse than a failing test, because it destroys the signal: once people expect red, nobody investigates red.</p>
<table>
<tr><th>Cause</th><th>Fix</th></tr>
<tr><td><strong>Timing</strong> — <code>Thread.sleep</code>, races</td><td>Await a condition: <code>await().atMost(5, SECONDS).untilAsserted(...)</code></td></tr>
<tr><td><strong>Shared state between tests</strong></td><td>Reset it; randomise execution order to expose it</td></tr>
<tr><td><strong>Order dependence</strong></td><td>Test B only passes after A ran. Each test must set up its own world.</td></tr>
<tr><td>Real clock / time zone</td><td>Inject a <code>Clock</code>; pin the zone and locale in the build</td></tr>
<tr><td>Randomness</td><td>Fixed seed, logged on failure so you can reproduce it</td></tr>
<tr><td>Network or a real external service</td><td>WireMock or Testcontainers — never the live system</td></tr>
<tr><td>Unordered collections asserted in order</td><td><code>containsExactlyInAnyOrder</code></td></tr>
<tr><td>Leaked ports, files, containers</td><td>Random ports; temp directories; proper teardown</td></tr>
</table>
<pre><code># Find them: run the suite repeatedly, and in random order
mvn test -Dsurefire.rerunFailingTestsCount=0 -Dtest=OrderServiceTest -DfailIfNoTests=false
# JUnit 5: randomise the order so hidden coupling surfaces
junit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random

@RepeatedTest(50)      // a quick way to confirm you have actually fixed one
void notFlakyAnyMore() { }</code></pre>
<pre><code>// ✗ The "fix" that makes it permanent
@Test @Retry(3)                    // now it fails 1 time in 64 instead of 1 in 4,
void order() { }                   // and the real bug ships

// Auto-retry hides race conditions that are ALSO present in production.
// A test that is flaky because of a race is telling you something true.</code></pre>
<table>
<tr><th>Policy</th><th>Why</th></tr>
<tr><td><strong>Quarantine, do not delete</strong></td><td>Move it out of the blocking suite with a ticket and an owner, so it is still visible</td></tr>
<tr><td>Time-box the quarantine</td><td>Fix or delete within a sprint — a permanent quarantine is a deletion with extra steps</td></tr>
<tr><td>Track flake rate as a metric</td><td>It is a health indicator for the whole suite</td></tr>
<tr><td>Never retry to green in CI</td><td>It converts a signal into noise</td></tr>
</table>
<p><strong>The point to make:</strong> "I treat a flaky test as a bug with the same severity as a production bug, because the cost is the same: the team stops trusting the alarm. And a surprising share of them are not test bugs at all — they are genuine race conditions that the test happened to expose and production will expose later, less conveniently."</p>`
},
{
  q: "What is Test-Driven Development, and do you actually use it?",
  level: "beginner", tags: ["tdd", "process", "best-practice"],
  companies: ["ThoughtWorks", "Amazon", "SAP", "Optum", "EPAM", "Infosys", "TCS", "Publicis Sapient"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Red green refactor cycle">
  <circle class="dg-box" cx="120" cy="72" r="44"/><text class="dg-s" x="120" y="70" text-anchor="middle">RED</text><text class="dg-s" x="120" y="88" text-anchor="middle">failing test</text>
  <circle class="dg-fill" cx="310" cy="72" r="44"/><text class="dg-s" x="310" y="70" text-anchor="middle">GREEN</text><text class="dg-s" x="310" y="88" text-anchor="middle">make it pass</text>
  <circle class="dg-fill2" cx="500" cy="72" r="44"/><text class="dg-s" x="500" y="70" text-anchor="middle">REFACTOR</text><text class="dg-s" x="500" y="88" text-anchor="middle">clean it up</text>
  <path class="dg-line" d="M166 72 H262" marker-end="url(#td1)"/>
  <path class="dg-line" d="M356 72 H452" marker-end="url(#td1)"/>
  <path class="dg-line" d="M478 114 Q310 150 142 114" marker-end="url(#td1)"/>
  <text class="dg-s" x="16" y="28">the discipline is writing the SIMPLEST thing that passes, then improving it</text>
  <defs><marker id="td1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>What TDD actually buys</th></tr>
<tr><td>You must <strong>design the API before the implementation</strong>, from the caller's side — which is the real benefit</td></tr>
<tr><td>The test is proven to fail, so you know it tests something</td></tr>
<tr><td>Hard-to-test code is a design smell you feel <em>immediately</em>, not three months later</td></tr>
<tr><td>Refactoring becomes safe, because the net exists first</td></tr>
<tr><td>You write only the code a requirement demands</td></tr>
</table>
<table>
<tr><th>Where it fits well</th><th>Where it does not</th></tr>
<tr><td>Business logic with clear rules</td><td>Exploratory spikes where the design is unknown</td></tr>
<tr><td>Bug fixes — write the failing test first</td><td>UI layout and visual work</td></tr>
<tr><td>Algorithms and parsers</td><td>Thin glue with no logic of its own</td></tr>
<tr><td>Refactoring legacy code — pin behaviour first</td><td>Throwaway prototypes</td></tr>
</table>
<pre><code>// The one place I would insist on it: a BUG FIX.
// 1. Write a test that reproduces the bug. Watch it FAIL.
// 2. Fix the code. Watch it pass.
// 3. That test is now a permanent regression guard.
//
// Skipping step 1 means you never proved you fixed the reported problem —
// only that the symptom you imagined went away.</code></pre>
<p><strong>An honest answer beats a dogmatic one.</strong> Claiming strict TDD on everything is not credible, and interviewers know it. Something like: "I use it where the behaviour is clear enough to express as a test first — business rules, bug fixes, anything algorithmic. For exploratory work I spike first, then throw the spike away and rebuild it test-first. What I do not do is skip tests and promise to add them later, because that never happens."</p>
<p><strong>The related idea to name:</strong> BDD moves the same cycle up a level — tests written in the language of the business (<code>Given/When/Then</code>), readable by a product owner. Useful where the requirements <em>are</em> the hard part; overhead where they are not.</p>`
}
]);
