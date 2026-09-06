appendTopic("jvm", [
{
  q: "What is the difference between the stack and the heap?",
  level: "beginner", hot: true, tags: ["memory"],
  a: `<table>
<tr><th></th><th>Stack</th><th>Heap</th></tr>
<tr><td>Scope</td><td>Per thread</td><td>Shared by all threads</td></tr>
<tr><td>Holds</td><td>Method frames: locals, parameters, return address, operand stack</td><td>All objects and arrays</td></tr>
<tr><td>Lifetime</td><td>Popped when the method returns</td><td>Until unreachable, then GC</td></tr>
<tr><td>Allocation</td><td>Push/pop — extremely fast</td><td>Bump pointer in TLAB, plus GC cost</td></tr>
<tr><td>Size</td><td><code>-Xss</code>, ~512 KB–1 MB per thread</td><td><code>-Xmx</code>, gigabytes</td></tr>
<tr><td>Overflow</td><td><code>StackOverflowError</code></td><td><code>OutOfMemoryError</code></td></tr>
<tr><td>Thread safety</td><td>Inherently safe — not shared</td><td>Needs synchronisation</td></tr>
</table>
<pre><code>void process() {
    int count = 5;                    // primitive local -> on the STACK
    Order order = new Order();        // reference on the stack, OBJECT on the heap
    int[] data = new int[100];        // reference on stack, array on heap
}   // frame popped: count and the references vanish; the objects become garbage</code></pre>
<p><strong>The key consequence:</strong> local variables and parameters are automatically thread-confined, which is why a method that only touches locals is always thread-safe. The moment a reference escapes to a field, a static, or another thread, you need to think about synchronisation.</p>
<p><strong>Nuance worth adding:</strong> escape analysis can make this less absolute — if the JIT proves an object never escapes the method, it may be scalar-replaced and effectively allocated on the stack, never touching the heap at all.</p>`
},
{
  q: "What is a TLAB and how does object allocation actually work?",
  level: "advanced", tags: ["memory", "performance"],
  a: `<p>A <strong>Thread-Local Allocation Buffer</strong> is a private chunk of Eden handed to each thread. Allocating within it is just a <em>pointer bump</em> — increment a pointer and return the old value — with no locking at all.</p>
<pre><code>// Conceptually, allocating in a TLAB:
if (tlabTop + objectSize &lt;= tlabEnd) {
    address = tlabTop;
    tlabTop += objectSize;        // no CAS, no lock — a few nanoseconds
} else {
    address = allocateSlowPath(); // request a new TLAB, or allocate directly in Eden
}</code></pre>
<p><strong>Why this matters:</strong> without TLABs, every allocation from every thread would contend on a single shared bump pointer via CAS. TLABs make Java allocation genuinely cheap — often cheaper than a C <code>malloc</code>, because there is no free-list search and no locking.</p>
<p><strong>Consequences to state:</strong></p>
<ul>
<li>Large objects that do not fit a TLAB go straight to Eden (or directly to Old if they exceed <code>-XX:PretenureSizeThreshold</code>), which is slower and can fragment.</li>
<li>TLAB size is adaptive per thread; a thread that allocates heavily gets a bigger one.</li>
<li>Wasted space at the end of a TLAB is real but small; <code>-XX:+PrintTLAB</code> or JFR shows it.</li>
</ul>
<p><strong>The practical takeaway for interviews:</strong> "allocation is cheap, collection of short-lived objects is nearly free" — a generational collector's cost is proportional to <em>surviving</em> objects, not garbage. That is why the usual advice to pool objects is wrong in modern Java, and why the real problem is objects that survive longer than they should.</p>`
},
{
  q: "How do you analyse a heap dump?",
  level: "advanced", hot: true, tags: ["production", "debugging"],
  a: `<pre><code># Capture — always have this flag on in production
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app/

# On demand
jcmd &lt;pid&gt; GC.heap_dump /tmp/heap.hprof         # preferred
jmap -dump:live,format=b,file=/tmp/heap.hprof &lt;pid&gt;

# Quick look without a dump — top consumers by class
jmap -histo:live &lt;pid&gt; | head -30</code></pre>
<p><strong>Then open it in Eclipse MAT and work in this order:</strong></p>
<ol>
<li><strong>Leak Suspects report</strong> — MAT's automatic analysis is right surprisingly often; start there.</li>
<li><strong>Dominator tree</strong> — sorts objects by <em>retained</em> heap (everything that would be freed if this object went away). This is the key concept: a <code>HashMap</code> with 5 MB shallow size might retain 800 MB.</li>
<li><strong>Path to GC roots</strong> — on the biggest retainer, ask "exclude weak/soft references" and MAT shows you exactly which chain of references is keeping it alive. That chain <em>is</em> your bug.</li>
<li><strong>Histogram</strong> — group by class to spot "3 million <code>char[]</code>" or "400,000 <code>OrderDto</code>".</li>
<li><strong>OQL</strong> for targeted queries, e.g. finding all maps above a size.</li>
</ol>
<p><strong>Shallow vs retained size</strong> is the distinction interviewers listen for: shallow is the object itself; retained is the object plus everything only it keeps alive. Only retained size tells you what freeing it would recover.</p>
<p><strong>Usual culprits found this way:</strong> a static or singleton-held collection with no eviction, ThreadLocals never removed in a pooled thread, listeners never deregistered, a cache without bounds, duplicated <code>String</code>s (MAT has a dedicated report), and oversized session state.</p>
<p><strong>Practical warning:</strong> taking a heap dump pauses the JVM and writes a file the size of your heap — do it on one instance taken out of the load balancer, not across the fleet at peak.</p>`
},
{
  q: "What are the JVM's just-in-time deoptimisation and OSR?",
  level: "advanced", tags: ["jit", "internals"],
  a: `<p><strong>Deoptimisation</strong> is the JIT discarding compiled code and falling back to the interpreter, because an assumption it made turned out to be false.</p>
<p>The JIT optimises <em>speculatively</em> based on observed behaviour:</p>
<ul>
<li><strong>Class hierarchy analysis</strong> — "only <code>JdbcOrderRepository</code> implements this interface, so I will inline it directly." If a second implementation is later loaded, that assumption breaks and the method is deoptimised and recompiled.</li>
<li><strong>Branch profiling</strong> — "this null check has never been true", so the JIT compiles an uncommon trap instead of the branch. The first null triggers deoptimisation.</li>
<li><strong>Type profiling</strong> at a call site that has only ever seen one receiver type.</li>
</ul>
<p><strong>On-Stack Replacement (OSR)</strong> handles the opposite problem: a method containing a long-running loop may never be re-entered, so the normal "compile on next invocation" rule never fires. OSR compiles the method <em>while it is executing</em> and swaps the running frame over to the compiled version mid-loop.</p>
<pre><code># Observe it
-XX:+PrintCompilation        # 'made not entrant' / 'made zombie' = deoptimisation
                             # '%' in the output = OSR compilation</code></pre>
<p><strong>Why this matters practically:</strong></p>
<ul>
<li>It explains <strong>warm-up</strong>: a service is genuinely slower for its first thousands of requests, which is why load balancers should ramp traffic to a new instance and why benchmarks must warm up (use JMH).</li>
<li>Repeated deoptimisation causes performance that <em>degrades</em> after a new code path is exercised — for example, a rarely used implementation being loaded for the first time in production.</li>
<li>It is why megamorphic call sites (5+ implementations at one call site) are slower: the JIT cannot inline speculatively.</li>
</ul>`
},
{
  q: "What is the difference between -Xmx, -Xms and container memory limits?",
  level: "beginner", hot: true, tags: ["tuning", "production"],
  a: `<table>
<tr><th>Flag</th><th>Meaning</th></tr>
<tr><td><code>-Xms</code></td><td>Initial heap size — the heap starts here</td></tr>
<tr><td><code>-Xmx</code></td><td>Maximum heap — the ceiling for the Java heap only</td></tr>
<tr><td><code>-Xss</code></td><td>Stack size per thread</td></tr>
<tr><td><code>-XX:MaxMetaspaceSize</code></td><td>Class metadata ceiling (native memory)</td></tr>
<tr><td><code>-XX:MaxRAMPercentage</code></td><td>Heap as a percentage of <em>available</em> memory — container-aware</td></tr>
</table>
<p><strong>The critical point: <code>-Xmx</code> is not the process's memory footprint.</strong> Total RSS is roughly:</p>
<pre><code>heap (-Xmx)
 + metaspace + compressed class space
 + code cache (JIT output, up to ~240 MB)
 + thread stacks (threads × -Xss)
 + GC data structures (G1 remembered sets etc.)
 + direct/mapped ByteBuffers (Netty, NIO)
 + JVM and native library overhead</code></pre>
<p>That is why a container with <code>--memory=1g</code> and <code>-Xmx1g</code> gets OOM-killed by the kernel with <strong>no Java stack trace at all</strong> — the JVM never saw a Java heap exhaustion; the cgroup killed the process.</p>
<pre><code># Correct for containers — scales with whatever limit is applied
-XX:MaxRAMPercentage=75.0
-XX:MaxMetaspaceSize=256m
-XX:+ExitOnOutOfMemoryError
-XX:NativeMemoryTracking=summary        # then: jcmd &lt;pid&gt; VM.native_memory summary</code></pre>
<p><strong>Setting <code>-Xms</code> equal to <code>-Xmx</code></strong> is common in production: it avoids heap resizing pauses and makes memory usage predictable, at the cost of reserving it up front. And exit code <strong>137</strong> from a container means SIGKILL — check <code>OOMKilled: true</code> before assuming it was a Java-level problem.</p>`
},
{
  q: "How does String interning and the compact string optimisation work?",
  level: "advanced", tags: ["string", "memory"],
  a: `<p><strong>Compact Strings (Java 9)</strong> changed <code>String</code>'s internal storage from <code>char[]</code> (2 bytes per character) to <code>byte[]</code> plus a one-byte <em>coder</em> flag. Latin-1 text uses one byte per character; only strings containing non-Latin-1 characters use UTF-16.</p>
<pre><code>// Java 8:  private final char[] value;
// Java 9+: private final byte[] value;
//          private final byte coder;   // LATIN1 = 0, UTF16 = 1</code></pre>
<p>For a typical Java application — where most strings are ASCII log messages, keys and identifiers — this roughly <strong>halves</strong> the memory used by strings, which are commonly 25–40% of a live heap. It was one of the largest free wins in JVM history.</p>
<p><strong>Interning</strong> is the separate mechanism: the string pool holds one canonical instance per distinct value.</p>
<pre><code>String a = "config";                  // literal — interned automatically at class load
String b = new String("config");      // new heap object
a == b;                               // false
a == b.intern();                      // true

// Tuning the pool
-XX:StringTableSize=1000003           // prime number; default is 65536
-XX:+PrintStringTableStatistics</code></pre>
<p><strong>When manual interning helps and when it hurts:</strong> it helps when you parse millions of records with a small set of repeated values (country codes, statuses) — interning collapses duplicates. It hurts when values are mostly unique, because you fill the pool with strings that are never reused and the pool itself becomes a memory problem. Note the pool moved from PermGen to the heap in Java 7, so interned strings <em>can</em> be collected once unreachable.</p>
<p><strong>Better alternatives usually:</strong> an enum for a fixed set, or <code>-XX:+UseStringDeduplication</code> with G1, which lets the GC transparently share identical <code>byte[]</code> backing arrays without you calling <code>intern()</code> anywhere.</p>`
},
{
  q: "What is Java Flight Recorder and how do you use it?",
  level: "advanced", hot: true, tags: ["profiling", "production"],
  a: `<p>JFR is a low-overhead (~1%) event recorder built into the JVM. Unlike a sampling profiler you bolt on, it is designed to run <strong>continuously in production</strong>.</p>
<pre><code># Always-on recording, dumped if the JVM exits
-XX:StartFlightRecording=disk=true,maxsize=200M,maxage=6h,dumponexit=true,filename=/var/log/app.jfr

# Start on a running JVM when something looks wrong
jcmd &lt;pid&gt; JFR.start name=diag duration=120s filename=/tmp/diag.jfr settings=profile
jcmd &lt;pid&gt; JFR.dump  name=diag filename=/tmp/now.jfr
jcmd &lt;pid&gt; JFR.stop  name=diag

# Read it: JDK Mission Control (GUI), or the CLI
jfr summary /tmp/diag.jfr
jfr print --events CPULoad,GarbageCollection /tmp/diag.jfr</code></pre>
<p><strong>What it captures that logs and metrics cannot:</strong> method-level CPU sampling with full stacks, <strong>allocation profiling</strong> (which line allocates the most — usually more useful than CPU), every GC event with cause and pause time, lock contention and blocking events, exceptions thrown (including ones you catch and swallow), thread parks, socket and file I/O with duration, and JVM-internal events like safepoints and compilation.</p>
<p><strong>Why this is the right answer to "how do you profile production":</strong> it is already in the JVM, needs no restart or agent, has bounded overhead, and captures the window <em>before</em> an incident if you run it continuously with <code>maxage</code>. Being able to say "we had JFR running with a 6-hour ring buffer, so when latency spiked I dumped the recording and had the allocation stack in minutes" is a strong, concrete answer.</p>
<p>You can also emit your own events with the <code>jdk.jfr.Event</code> API, so business-level timings appear on the same timeline as GC and I/O.</p>`
},
{
  q: "What causes a StackOverflowError and how do you fix deep recursion?",
  level: "beginner", tags: ["errors", "debugging"],
  a: `<p>Each method call pushes a frame containing locals, parameters and the operand stack. Exceeding <code>-Xss</code> (default ~512 KB–1 MB) throws <code>StackOverflowError</code>.</p>
<p><strong>Common causes:</strong></p>
<ul>
<li>Unbounded or missing base case in recursion.</li>
<li><strong>Mutual recursion</strong> — <code>equals</code> calling <code>hashCode</code> calling <code>equals</code>.</li>
<li><strong>Cyclic <code>toString()</code></strong> across a bidirectional JPA relationship — <code>Order.toString()</code> prints items, each item prints its order. Lombok's <code>@ToString</code> and <code>@Data</code> cause this constantly.</li>
<li>A getter that accidentally calls itself: <code>public String getName() { return getName(); }</code>.</li>
<li>Very deep object graphs during recursive serialisation.</li>
</ul>
<pre><code>// Recursive — one frame per element; overflows around 10-20k depth
int sum(Node n) { return n == null ? 0 : n.value + sum(n.next); }

// Iterative with an explicit stack — heap-bounded, no frame limit
int sum(Node head) {
    int total = 0;
    for (Node n = head; n != null; n = n.next) total += n.value;
    return total;
}

// Tree traversal converted to an explicit stack
Deque&lt;TreeNode&gt; stack = new ArrayDeque&lt;&gt;();
stack.push(root);
while (!stack.isEmpty()) {
    var node = stack.pop();
    visit(node);
    if (node.right != null) stack.push(node.right);
    if (node.left  != null) stack.push(node.left);
}</code></pre>
<p><strong>Important point:</strong> <strong>Java has no tail-call optimisation.</strong> Writing a method in tail-recursive form does not help — every call still consumes a frame. Increasing <code>-Xss</code> is a stopgap that also multiplies memory across every thread; converting to iteration is the real fix. Read the stack trace for the repeating cycle — it names the loop immediately.</p>`
},
{
  q: "What is the difference between G1 and ZGC in practical terms?",
  level: "advanced", tags: ["gc", "tuning"],
  a: `<table>
<tr><th></th><th>G1</th><th>ZGC</th></tr>
<tr><td>Default since</td><td>Java 9</td><td>Opt-in (<code>-XX:+UseZGC</code>)</td></tr>
<tr><td>Pause target</td><td>Soft goal, typically 50–200 ms</td><td><strong>Sub-millisecond</strong>, independent of heap size</td></tr>
<tr><td>Heap size sweet spot</td><td>4–32 GB</td><td>8 GB to multiple TB</td></tr>
<tr><td>Generational</td><td>Yes</td><td>Yes, since Java 21</td></tr>
<tr><td>Throughput</td><td>Higher</td><td>~5–15% lower — concurrent work costs CPU</td></tr>
<tr><td>Memory overhead</td><td>Lower</td><td>Higher (coloured pointers, load barriers)</td></tr>
</table>
<p><strong>How they differ mechanically:</strong> G1 divides the heap into ~2048 regions and does most marking concurrently, but <em>evacuation</em> (copying survivors) is stop-the-world — so pause time scales with how much live data it moves. ZGC uses <strong>coloured pointers and load barriers</strong> to relocate objects <em>while the application runs</em>, so almost nothing is stop-the-world and pause time is independent of heap size.</p>
<pre><code># G1, the sensible default for most services
-XX:+UseG1GC -XX:MaxGCPauseMillis=200

# ZGC, when p99 latency matters more than raw throughput
-XX:+UseZGC -XX:+ZGenerational</code></pre>
<p><strong>How to choose, said honestly:</strong> "G1 is the default and correct for the large majority of services. I would move to ZGC only with evidence — GC logs showing pauses that breach our latency SLO, or a heap large enough that G1's evacuation pauses grow. And I would validate it under load, because ZGC trades throughput for latency, so a batch job might get slower."</p>
<p>Also mention <strong>Parallel GC</strong> as still the right choice for throughput-oriented batch work where pauses do not matter, and <strong>Serial GC</strong> for small containers where GC threads would only add overhead.</p>`
},
{
  q: "How do you reduce a Java application's startup time?",
  level: "advanced", tags: ["performance", "production"],
  a: `<p>Startup matters for autoscaling, rolling deploys, serverless and local development. Attack it in this order:</p>
<ol>
<li><strong>Measure first</strong> — <code>-Xlog:class+load</code> and Spring's <code>BufferingApplicationStartup</code> exposed at <code>/actuator/startup</code> tell you whether time goes to class loading, bean creation, or a slow external call.</li>
<li><strong>Reduce classes loaded</strong> — trim unused starters and dependencies. Each auto-configuration is evaluated at startup.</li>
<li><strong>Class Data Sharing (CDS)</strong> — pre-parse class metadata into a shared archive so the JVM maps it instead of parsing:
<pre><code>java -XX:ArchiveClassesAtExit=app.jsa -jar app.jar
java -XX:SharedArchiveFile=app.jsa -jar app.jar     # typically 20-40% faster startup</code></pre>
Spring Boot 3.3+ automates this with <code>-Dspring.aot.enabled</code> plus CDS.</li>
<li><strong>Tiered compilation limit for short-lived processes</strong> — <code>-XX:TieredStopAtLevel=1</code> skips expensive C2 compilation. Great for CLI tools and tests; wrong for long-running servers, which need C2's peak performance.</li>
<li><strong>Lazy initialisation</strong> — <code>spring.main.lazy-initialization=true</code>. Excellent for dev and tests; risky in production because it moves failures from startup to the first request.</li>
<li><strong>Spring AOT + GraalVM native image</strong> — startup drops from seconds to tens of milliseconds and RSS by 5–10×. The trade-offs are long build times, restricted reflection (needs configuration), and lower peak throughput than a warmed-up JVM.</li>
<li><strong>Defer non-essential work</strong> — do not warm caches or run migrations synchronously in <code>@PostConstruct</code>; let a readiness probe gate traffic instead.</li>
<li><strong><code>-Djava.security.egd=file:/dev/./urandom</code></strong> — avoids entropy stalls that can add seconds on some containers.</li>
</ol>
<p><strong>The framing to use:</strong> for a long-running service, startup time matters mainly for deployment speed and autoscaling responsiveness — so CDS and dependency trimming are usually enough. Native image is worth its complexity when you scale to zero or run many short-lived instances.</p>`
},
{
  q: "What is the Java Module System (JPMS) and did it matter?",
  level: "advanced", tags: ["modules", "java9"],
  a: `<pre><code>// module-info.java
module com.acme.orders {
    requires java.sql;                       // dependencies are explicit
    requires transitive com.acme.domain;     // consumers get this too
    exports com.acme.orders.api;             // ONLY this package is public
    // com.acme.orders.internal stays inaccessible even though its classes are public
    opens com.acme.orders.dto to com.fasterxml.jackson.databind;  // reflection access
    provides OrderExporter with PdfExporter; // ServiceLoader
}</code></pre>
<p><strong>What it gives you:</strong> genuine encapsulation beyond <code>public</code> — a public class in a non-exported package is unreachable from outside the module; explicit, compile-time-checked dependencies; reliable configuration (missing or duplicate modules fail at startup, not at runtime); and <code>jlink</code>, which builds a minimal runtime image containing only the modules you use — very useful for small container images.</p>
<p><strong>The honest assessment</strong>, which is what interviewers want:</p>
<ul>
<li><strong>Adoption in application code has been limited.</strong> Most Spring Boot services never write a <code>module-info.java</code>; they run everything on the classpath as the "unnamed module".</li>
<li><strong>Its real impact was on the JDK itself.</strong> Modularising the JDK enabled <code>jlink</code>, removed <code>rt.jar</code>, and — crucially — allowed <strong>strong encapsulation of internal APIs</strong>. That is why <code>sun.misc.Unsafe</code> and internal reflection now require <code>--add-opens</code>, which broke many libraries during the Java 8 → 11+ migration.</li>
<li><strong>Where you do meet it in practice:</strong> adding <code>--add-opens java.base/java.lang=ALL-UNNAMED</code> to make an older library work, and using <code>jlink</code>/<code>jdeps</code> to shrink a runtime image.</li>
</ul>
<p>Saying "it mattered enormously inside the JDK and much less in typical application code" is a more credible answer than either praising or dismissing it outright.</p>`
}
]);
