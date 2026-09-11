appendTopic("java-basics", [
{
  q: "How do you handle money and decimals correctly in Java?",
  level: "beginner", hot: true, tags: ["basics", "gotcha", "best-practice"],
  companies: ["Goldman Sachs", "Barclays", "Morgan Stanley", "PayPal", "Paytm", "Amazon", "TCS", "Infosys"],
  a: `<pre><code>0.1 + 0.2 == 0.3        // FALSE — prints 0.30000000000000004
System.out.println(1.03 - 0.42);   // 0.6100000000000001

// double and float are BINARY floating point. Values like 0.1 have no exact
// binary representation, exactly as 1/3 has no exact decimal one.</code></pre>
<table>
<tr><th>Use</th><th>For</th><th>Why</th></tr>
<tr><td><strong><code>long</code> of minor units</strong></td><td>Money — 4999 = ₹49.99</td><td>Exact, fast, no rounding surprises. What most payment systems actually do.</td></tr>
<tr><td><strong><code>BigDecimal</code></strong></td><td>Money with division or percentages</td><td>Exact decimal arithmetic with an explicit rounding policy</td></tr>
<tr><td><code>double</code></td><td>Physics, graphics, statistics</td><td>Fast, and a tiny relative error is acceptable there</td></tr>
<tr><td>❌ <code>float</code></td><td>Almost nothing</td><td>~7 digits of precision; you will exceed it</td></tr>
</table>
<pre><code>// ✗ The constructor that surprises people
new BigDecimal(0.1);        // 0.1000000000000000055511151231257827021181583404541015625
                            // — it faithfully copies the broken double

// ✔ Always the String (or valueOf) form
new BigDecimal("0.1");      // exactly 0.1
BigDecimal.valueOf(0.1);    // uses Double.toString, so also exact-looking

// Division REQUIRES a scale and rounding, or it throws
a.divide(b);                                    // ArithmeticException on 1/3
a.divide(b, 2, RoundingMode.HALF_UP);           // ✔ 2 dp, explicit policy

// equals vs compareTo — the classic trap
new BigDecimal("1.0").equals(new BigDecimal("1.00"));      // FALSE — scale differs
new BigDecimal("1.0").compareTo(new BigDecimal("1.00"));   // 0 — equal in value
// So a BigDecimal in a HashSet behaves differently from what you expect.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Decimal 0.1 expanding into a repeating binary fraction">
  <text class="dg-s" x="16" y="26">decimal 0.1</text>
  <rect class="dg-fill" x="16" y="36" width="120" height="28" rx="5"/><text class="dg-t" x="76" y="55" text-anchor="middle">0.1</text>
  <path class="dg-line" d="M142 50 H196" marker-end="url(#bd1)"/>
  <text class="dg-s" x="169" y="40" text-anchor="middle">in binary</text>
  <rect class="dg-fill2" x="200" y="36" width="300" height="28" rx="5"/>
  <text class="dg-t" x="350" y="55" text-anchor="middle">0.0001100110011001100…</text>
  <text class="dg-s" x="16" y="94">it repeats forever, so a 64-bit double must TRUNCATE it —</text>
  <text class="dg-s" x="16" y="116">and the leftover shows up the moment you add or compare</text>
  <defs><marker id="bd1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// Rounding modes worth knowing
RoundingMode.HALF_UP      // 2.5 -> 3   what people expect
RoundingMode.HALF_EVEN    // 2.5 -> 2, 3.5 -> 4   "banker's rounding";
                          // removes the upward bias over many operations —
                          // it is the default for BigDecimal money in many systems
RoundingMode.FLOOR / CEILING / DOWN / UP

// In JPA, always pin precision and scale or the column becomes a plain NUMERIC
@Column(precision = 19, scale = 4)
private BigDecimal amount;</code></pre>
<p><strong>The answer to give:</strong> "Never <code>double</code> for money. I default to storing minor units in a <code>long</code> — it is exact, cheap, and dodges the scale and rounding questions entirely. Where the domain needs percentages or division I use <code>BigDecimal</code> built from a <code>String</code>, with an explicit <code>RoundingMode</code> on every divide, and I compare with <code>compareTo</code> rather than <code>equals</code>."</p>`
},
{
  q: "How do you work with dates, times and time zones correctly?",
  level: "beginner", hot: true, tags: ["basics", "java8", "best-practice"],
  companies: ["Amazon", "Optum", "SAP", "Maersk", "TCS", "Infosys", "Walmart", "Societe Generale"],
  a: `<table>
<tr><th>Type</th><th>Represents</th><th>Use for</th></tr>
<tr><td><strong><code>Instant</code></strong></td><td>A point on the UTC timeline</td><td><strong>Timestamps</strong> — created_at, events, logs</td></tr>
<tr><td><code>LocalDate</code></td><td>A date, no time, no zone</td><td>Birthday, invoice date</td></tr>
<tr><td><code>LocalTime</code></td><td>A time, no date, no zone</td><td>Shop opening hours</td></tr>
<tr><td><code>LocalDateTime</code></td><td>Date + time, <strong>no zone</strong></td><td>Rarely what you want — it is ambiguous</td></tr>
<tr><td><code>ZonedDateTime</code></td><td>Date + time + zone, DST-aware</td><td>Future appointments in a place</td></tr>
<tr><td><code>OffsetDateTime</code></td><td>Date + time + fixed offset</td><td>What JDBC and JSON usually map to</td></tr>
<tr><td><code>Duration</code> / <code>Period</code></td><td>Time-based / date-based amount</td><td>Timeouts / "3 months"</td></tr>
</table>
<pre><code>// STORE in UTC, DISPLAY in the user's zone. That one rule prevents most bugs.
Instant now = Instant.now();                                    // UTC timeline
ZonedDateTime shown = now.atZone(ZoneId.of("Asia/Kolkata"));    // for the user

// Never use the three-letter ids — they are ambiguous and deprecated
ZoneId.of("IST")            // ✗ India? Israel? Ireland?
ZoneId.of("Asia/Kolkata")   // ✔ IANA id, carries the DST history

// Parsing and formatting
LocalDate.parse("2026-09-11");                                  // ISO by default
DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.UK).format(d);
// DateTimeFormatter is IMMUTABLE and thread-safe — SimpleDateFormat was not,
// and sharing one as a static field is a classic production race.</code></pre>
<pre><code>// The DST traps
// 1. A local time that does not exist (clocks jump forward)
ZonedDateTime.of(LocalDateTime.of(2026, 3, 29, 2, 30), ZoneId.of("Europe/London"));
//    -> silently shifted to 03:30. It never "was" 02:30 that day.

// 2. A local time that happens TWICE (clocks go back) — resolves to the FIRST
//    by default; use withLaterOffsetAtOverlap() for the second.

// 3. Adding a day is not adding 24 hours
zdt.plusDays(1);                 // ✔ same wall-clock time tomorrow, DST-aware
zdt.plus(Duration.ofDays(1));    // ✗ exactly 24 hours — off by an hour twice a year

// 4. A recurring meeting must store the ZONE, not the offset. Offsets change
//    when a government changes its DST rules; the zone id survives that.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Storing UTC and rendering per user time zone">
  <rect class="dg-fill2" x="16" y="46" width="150" height="42" rx="8"/>
  <text class="dg-s" x="91" y="63" text-anchor="middle">database</text><text class="dg-s" x="91" y="81" text-anchor="middle">UTC instant</text>
  <path class="dg-line" d="M170 58 L246 32 M170 67 H246 M170 76 L246 104" marker-end="url(#dt1)"/>
  <rect class="dg-fill" x="250" y="18" width="170" height="28" rx="6"/><text class="dg-s" x="335" y="37" text-anchor="middle">Asia/Kolkata  +05:30</text>
  <rect class="dg-fill" x="250" y="53" width="170" height="28" rx="6"/><text class="dg-s" x="335" y="72" text-anchor="middle">Europe/London  +00/+01</text>
  <rect class="dg-fill" x="250" y="90" width="170" height="28" rx="6"/><text class="dg-s" x="335" y="109" text-anchor="middle">America/New_York  −05/−04</text>
  <text class="dg-s" x="440" y="60">one stored value,</text>
  <text class="dg-s" x="440" y="80">rendered per reader</text>
  <defs><marker id="dt1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Why <code>java.util.Date</code> was replaced:</strong> it was mutable, its months were 0-based, it mixed date and instant concepts, and <code>SimpleDateFormat</code> was not thread-safe. <code>java.time</code> (JSR-310) is immutable, thread-safe and explicit about whether a value has a zone.</p>
<p><strong>The testability point worth adding:</strong> inject a <code>Clock</code> rather than calling <code>Instant.now()</code> directly. <code>Clock.fixed(...)</code> then makes "does this expire after 30 days" a one-line test instead of an impossible one.</p>`
},
{
  q: "What is the difference between an Error, a RuntimeException and a checked Exception in production?",
  level: "advanced", tags: ["exceptions", "production", "design"],
  companies: ["Amazon", "Oracle", "SAP", "Optum", "Barclays", "Cognizant", "EPAM"],
  a: `<table>
<tr><th></th><th><code>Error</code></th><th><code>RuntimeException</code></th><th>Checked <code>Exception</code></th></tr>
<tr><td>Means</td><td>The JVM is in trouble</td><td>A bug in your code</td><td>An expected, recoverable condition</td></tr>
<tr><td>Catch it?</td><td><strong>Almost never</strong></td><td>At a boundary, to translate it</td><td>Where you can act on it</td></tr>
<tr><td>Examples</td><td><code>OutOfMemoryError</code>, <code>StackOverflowError</code></td><td>NPE, <code>IllegalArgumentException</code></td><td><code>IOException</code>, <code>SQLException</code></td></tr>
<tr><td>Spring rollback</td><td>Yes</td><td>Yes</td><td><strong>No</strong> — needs <code>rollbackFor</code></td></tr>
</table>
<pre><code>// The pattern that matters in a service: translate at the boundary, once.
public Order fetch(long id) {
    try {
        return client.get(id);
    } catch (HttpTimeoutException e) {                 // specific
        throw new OrderUnavailableException(id, e);    // domain type, cause KEPT
    } catch (IOException e) {
        throw new OrderLookupException(id, e);
    }
}
// Callers now handle ONE domain exception, not four transport ones. That is
// exactly what Spring does when it turns every SQLException into an
// unchecked DataAccessException.</code></pre>
<pre><code>// Catching an Error is nearly always wrong — but there is one nuance:
try { ... } catch (Throwable t) { }         // ✗ swallows OOM and StackOverflow
// After an OutOfMemoryError the JVM state is unreliable: other threads may
// have died mid-operation. The right response is to let it kill the process
// and have the orchestrator restart it — with a heap dump on the way out.

// The exception to that: a top-level worker loop may catch Throwable to log
// which task killed it, then RETHROW.
catch (Throwable t) { log.error("task {} died", id, t); throw t; }</code></pre>
<table>
<tr><th>Anti-pattern</th><th>Why it hurts</th></tr>
<tr><td><code>catch (Exception e) { }</code></td><td>Silent failure — the worst possible outcome</td></tr>
<tr><td><code>e.printStackTrace()</code></td><td>Bypasses logging config; no correlation id, no level, no structure</td></tr>
<tr><td><code>throw new RuntimeException()</code></td><td><b>Cause lost</b> — the stack trace becomes useless</td></tr>
<tr><td>Exceptions as control flow</td><td>Filling a stack trace is expensive, and the reader must now follow a jump</td></tr>
<tr><td><code>return null</code> on failure</td><td>Moves the failure to a distant NPE. Throw, or return <code>Optional</code>.</td></tr>
<tr><td>Logging <em>and</em> rethrowing</td><td>The same error appears three times in the log</td></tr>
</table>
<pre><code>// Cheap exceptions, when you genuinely use them for expected control flow:
class NotFound extends RuntimeException {
    NotFound(String m) { super(m, null, false, false); }  // no suppression,
}                                                          // NO stack trace
// Filling in the stack trace is the expensive part — this makes throwing
// roughly as cheap as returning. Only do it where the trace adds nothing.</code></pre>
<p><strong>The rule to state:</strong> "Throw early, catch late. I validate arguments at the boundary and let everything else propagate to one place that knows how to respond — a <code>@RestControllerAdvice</code>, or the message listener's error handler. Catching in the middle to log and rethrow just produces duplicate log lines and hides where the failure was actually handled."</p>`
}
]);
