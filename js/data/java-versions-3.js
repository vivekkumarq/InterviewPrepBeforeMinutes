appendTopic("java-versions", [
{
  q: "You are on Java 8 and asked to move to 17 or 21. What actually breaks?",
  level: "advanced", hot: true, tags: ["migration", "java-17", "java-21", "must-know"],
  companies: ["Amazon", "Infosys", "TCS", "Wipro", "Accenture", "Capgemini", "Cognizant", "SAP", "Oracle"],
  a: `<p>This is the question that separates "I read the release notes" from "I have done it". The language features are the easy part; the breakage is in the module system, removed APIs and reflective access.</p>
<table>
<tr><th>What breaks</th><th>Symptom</th><th>Fix</th></tr>
<tr><td><strong>Removed Java EE modules</strong> (Java 11)</td><td><code>NoClassDefFoundError: javax/xml/bind/JAXBException</code></td><td>Add <code>jakarta.xml.bind</code> as an explicit dependency — it is no longer in the JDK</td></tr>
<tr><td><strong>Strong encapsulation</strong> (Java 16/17)</td><td><code>InaccessibleObjectException</code> on <code>setAccessible(true)</code></td><td><code>--add-opens java.base/java.lang=ALL-UNNAMED</code>, or upgrade the library that reflects</td></tr>
<tr><td><strong>Security Manager</strong> removed (17 deprecated, 21+ disabled)</td><td>Startup failure with a policy file</td><td>Replace with OS-level or container isolation</td></tr>
<tr><td><code>javax.*</code> → <code>jakarta.*</code></td><td>Compile errors across every entity and servlet</td><td>Spring Boot 3 requires it — this is usually the biggest single edit</td></tr>
<tr><td><strong>Old bytecode libraries</strong></td><td><code>UnsupportedClassVersionError</code>, ASM/CGLIB failures</td><td>Upgrade Lombok, Mockito, Byte Buddy, Gradle first</td></tr>
<tr><td><strong>GC flags removed</strong></td><td>JVM refuses to start — CMS is gone in 14+</td><td>Move to G1 (default) or ZGC</td></tr>
<tr><td><code>Unsafe</code> / internal APIs</td><td>Warnings, then hard failures</td><td><code>jdeps --jdk-internals</code> finds every use</td></tr>
<tr><td><strong>Date parsing / locale data</strong></td><td>Subtly different formatted output</td><td>CLDR became the default in Java 9; pin with <code>-Djava.locale.providers</code> if needed</td></tr>
</table>
<pre><code># The migration order that actually works — do NOT change source level first
1. Upgrade dependencies and the build tool while STILL on Java 8.
   Most breakage is a stale library, not your code.
2. Run on the new JDK, still compiling with --release 8. Fix runtime failures.
3. Only then raise --release to 17 or 21 and adopt new language features.

# The two commands worth knowing by name
jdeps --jdk-internals --multi-release 17 target/app.jar   # internal API usage
java -Xlog:gc*:file=gc.log -jar app.jar                   # -XX:+PrintGCDetails is gone</code></pre>
<table>
<tr><th>Why bother — the payoff to quote</th></tr>
<tr><td><strong>G1 by default</strong> with far shorter pauses than Parallel GC on large heaps</td></tr>
<tr><td><strong>Compact strings</strong> (Java 9) — Latin-1 text stored as <code>byte[]</code>, typically 10–15% less heap on a real service</td></tr>
<tr><td><strong>Container awareness</strong> — the JVM reads cgroup limits, so it stops sizing the heap from the host's RAM inside Docker</td></tr>
<tr><td><strong>Virtual threads</strong> (21) — blocking I/O stops costing a platform thread</td></tr>
<tr><td><strong>Support</strong> — public Java 8 updates ended long ago; 17 and 21 are the current LTS releases</td></tr>
</table>
<p><strong>The container point is the one worth leading with</strong> in an interview: on Java 8 early builds, a JVM in a 512 MB container read the <em>host</em> memory and sized its heap accordingly, then got OOM-killed. Modern JDKs honour the cgroup limit, and <code>-XX:MaxRAMPercentage</code> replaces hard-coded <code>-Xmx</code> values. That single fix is why many teams upgrade.</p>`
},
{
  q: "Records, sealed classes and pattern matching — what problem does each solve?",
  level: "advanced", hot: true, tags: ["records", "sealed", "pattern-matching", "java-17", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "SAP", "Oracle", "Infosys", "Adobe", "Goldman Sachs"],
  a: `<pre><code>// RECORD (16) — an immutable data carrier. Replaces ~60 lines of boilerplate.
public record Money(BigDecimal amount, Currency currency) {

    // COMPACT CONSTRUCTOR — validation without restating every field
    public Money {
        Objects.requireNonNull(amount);
        if (amount.scale() &gt; 2) throw new IllegalArgumentException("too precise");
    }
    public Money plus(Money other) {                 // records can have methods
        return new Money(amount.add(other.amount), currency);
    }
}
// You get for free: a canonical constructor, accessors (amount(), NOT
// getAmount()), equals, hashCode, toString.
//
// Records are FINAL and their fields are final — they cannot extend anything.
// So they are not a drop-in for a JPA @Entity, which needs a no-arg
// constructor and mutability. They ARE ideal for DTOs, value objects and
// map keys — and being genuinely immutable makes them thread-safe for free.</code></pre>
<pre><code>// SEALED (17) — a closed hierarchy. "These are ALL the possibilities."
public sealed interface Shape permits Circle, Square, Rectangle {}

public record Circle(double radius)             implements Shape {}
public record Square(double side)               implements Shape {}
public record Rectangle(double w, double h)     implements Shape {}

// Every permitted subclass must be final, sealed, or non-sealed.
// The compiler now KNOWS the complete list — which is what makes exhaustive
// switch possible without a default branch.</code></pre>
<pre><code>// PATTERN MATCHING FOR SWITCH (21) — where the two features pay off together
static double area(Shape s) {
    return switch (s) {
        case Circle c        -&gt; Math.PI * c.radius() * c.radius();
        case Square sq       -&gt; sq.side() * sq.side();
        case Rectangle r     -&gt; r.w() * r.h();
        // NO default needed — the compiler proves this is exhaustive.
        // Add a fourth Shape and this method stops COMPILING. That is the
        // whole point: the error surfaces at build time, not at 3am.
    };
}

// RECORD DECONSTRUCTION — pull the fields out in the pattern itself
static String describe(Object o) {
    return switch (o) {
        case Money(BigDecimal amt, var cur) when amt.signum() &lt; 0
                              -&gt; "refund of " + amt.abs() + " " + cur;
        case Money(var amt, var cur) -&gt; amt + " " + cur;
        case null             -&gt; "nothing";      // switch handles null explicitly now
        default               -&gt; o.toString();
    };
}
// The when clause is a GUARD. Order matters — the first matching case wins.</code></pre>
<table>
<tr><th>Feature</th><th>Replaces</th><th>Real benefit</th></tr>
<tr><td>Record</td><td>Lombok <code>@Value</code>, hand-written DTOs</td><td>Immutability by construction, no annotation processor</td></tr>
<tr><td>Sealed</td><td>Enums that carry data; visitor pattern</td><td>Exhaustiveness checked by the compiler</td></tr>
<tr><td>Pattern matching <code>instanceof</code></td><td><code>instanceof</code> + cast</td><td>One less line and one less place to get the cast wrong</td></tr>
<tr><td>Switch patterns</td><td>Chains of <code>if/else instanceof</code></td><td>Adding a case becomes a compile error, not a silent gap</td></tr>
<tr><td>Text blocks (15)</td><td>Escaped multi-line SQL and JSON</td><td>Readable queries; no <code>\\n\\"</code> noise</td></tr>
</table>
<p><strong>The design argument to make:</strong> sealed types plus records give Java algebraic data types — "a Shape is exactly one of these three, each carrying exactly this data." That moves a whole class of bug from runtime to compile time, which is the same reason teams reach for Kotlin or Scala. Saying <em>that</em>, rather than listing syntax, is what the question is really probing.</p>`
},
{
  q: "Virtual threads in Java 21 — what changes and what does not",
  level: "advanced", hot: true, tags: ["virtual-threads", "loom", "java-21", "concurrency", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Uber", "Goldman Sachs", "SAP", "Oracle", "Flipkart"],
  a: `<div class="cx"><b>Platform thread</b><span>1:1 with an OS thread · ~1 MB stack · thousands max</span><b>Virtual thread</b><span>scheduled by the JVM · starts at a few hundred bytes · millions</span></div>
<pre><code>// Before — a bounded pool, and blocking I/O wastes an expensive OS thread
ExecutorService pool = Executors.newFixedThreadPool(200);

// After — one virtual thread PER TASK, created and discarded freely
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var order : orders)
        exec.submit(() -&gt; chargeCard(order));      // blocking is now cheap
}   // close() waits for every task — try-with-resources is the join

// The mechanism: when a virtual thread blocks on I/O, the JVM UNMOUNTS it from
// its carrier (platform) thread and parks the continuation on the heap. The
// carrier immediately runs another virtual thread. Nothing blocks an OS thread.</code></pre>
<table>
<tr><th>Helps</th><th>Does not help</th></tr>
<tr><td><strong>I/O-bound</strong> work: HTTP calls, JDBC, message brokers</td><td><strong>CPU-bound</strong> work — you still have only N cores</td></tr>
<tr><td>Thread-per-request servers at high concurrency</td><td>Anything already fully non-blocking (WebFlux, Netty)</td></tr>
<tr><td>Fan-out to many downstream services</td><td>Making a slow query fast</td></tr>
<tr><td>Replacing reactive code with readable blocking code</td><td>A connection pool that is the real bottleneck</td></tr>
</table>
<pre><code>// THE TRAPS — and these are the follow-up questions

// 1. PINNING. A virtual thread inside a synchronized block that blocks cannot
//    unmount — it pins the carrier thread. (Improved in later releases, but
//    know the concept.)
synchronized (lock) { httpClient.send(req); }   // BAD — pins the carrier
lock.lock();                                    // ReentrantLock does NOT pin
try { httpClient.send(req); } finally { lock.unlock(); }

// 2. DO NOT POOL THEM. They are cheap to create; pooling defeats the purpose.
Executors.newFixedThreadPool(200, Thread.ofVirtual().factory());   // pointless

// 3. ThreadLocal still works but a million threads means a million copies.
//    Scoped values are the intended replacement.

// 4. The BOTTLENECK MOVES. A million virtual threads hitting a 10-connection
//    HikariCP pool just queues a million threads on the pool. Virtual threads
//    remove the thread limit; they do not remove the database limit.
//    You now need rate limiting where thread-count used to provide it
//    implicitly. This is the most important point to make.</code></pre>
<pre><code># Spring Boot 3.2+ — one property, and every request gets a virtual thread
spring.threads.virtual.enabled=true</code></pre>
<pre><code>// STRUCTURED CONCURRENCY — the other half of the story
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var user  = scope.fork(() -&gt; fetchUser(id));
    var order = scope.fork(() -&gt; fetchOrders(id));
    scope.join().throwIfFailed();                  // either both, or neither
    return new Dashboard(user.get(), order.get());
}
// If one subtask fails, the others are CANCELLED. No leaked threads, and the
// error propagates like an ordinary exception — which is exactly what
// CompletableFuture.allOf makes awkward.</code></pre>
<p><strong>The sentence that lands:</strong> "Virtual threads make the simple blocking style scale, so the reason to write reactive code shrinks to backpressure and streaming. But they move the bottleneck rather than removing it — the database connection pool is usually the next wall, and now nothing upstream is throttling you."</p>`
}
]);
