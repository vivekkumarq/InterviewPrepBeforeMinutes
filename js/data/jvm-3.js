appendTopic("jvm", [
{
  q: "What are the essential JDK command-line tools for diagnosis?",
  level: "advanced", hot: true, tags: ["tooling", "production"],
  a: `<pre><code># jcmd — the modern swiss army knife, prefer it over the older tools
jcmd                                   # list running JVMs
jcmd &lt;pid&gt; help                        # what this JVM supports
jcmd &lt;pid&gt; Thread.print                # thread dump (replaces jstack)
jcmd &lt;pid&gt; GC.heap_info                # heap usage by generation
jcmd &lt;pid&gt; GC.heap_dump /tmp/heap.hprof
jcmd &lt;pid&gt; GC.class_histogram          # object counts by class
jcmd &lt;pid&gt; VM.system_properties
jcmd &lt;pid&gt; VM.flags                    # what flags are ACTUALLY in effect
jcmd &lt;pid&gt; VM.native_memory summary    # needs -XX:NativeMemoryTracking=summary
jcmd &lt;pid&gt; JFR.start duration=60s filename=/tmp/r.jfr

# jstat — sampling, ideal for watching a trend
jstat -gcutil &lt;pid&gt; 1000               # S0 S1 E O M CCS YGC YGCT FGC FGCT GCT
# O climbing and never dropping after full GCs = a memory leak

# jmap / jstack / jinfo — older equivalents, still widely used
jmap -histo:live &lt;pid&gt; | head -30      # quick "what is filling the heap"
jstack &lt;pid&gt; | grep -A 20 "BLOCKED"

# jlink / jdeps — build a minimal runtime
jdeps --print-module-deps app.jar
jlink --add-modules java.base,java.sql --strip-debug --output /runtime</code></pre>
<p><strong>The triage order I would describe:</strong></p>
<ol>
<li><strong>High CPU</strong> → <code>top -H -p &lt;pid&gt;</code> to find the hot thread, convert the TID to hex, then find <code>nid=0x...</code> in <code>jcmd Thread.print</code>.</li>
<li><strong>Requests hanging</strong> → three thread dumps ten seconds apart. What is <em>stuck</em> in the same place across all three is your problem; a deadlock is reported explicitly.</li>
<li><strong>Memory growth</strong> → <code>jstat -gcutil</code> first (is old-gen occupancy rising after full GCs?), then <code>jmap -histo:live</code>, then a full heap dump only if needed.</li>
<li><strong>Container killed with no Java error</strong> → <code>VM.native_memory</code>, because the problem is outside the heap.</li>
</ol>
<p><strong>The practical caveat:</strong> these tools must run as the same user, in the same container namespace. In Kubernetes that means <code>kubectl exec</code> into the pod — and on a distroless image there is no shell, so use <code>kubectl debug --target=app</code> to attach a container that shares the process namespace. Also note <code>jcmd GC.heap_dump</code> pauses the JVM and writes a file the size of your heap, so take the pod out of the load balancer first.</p>`
},
{
  q: "How does the JVM handle exceptions and what do they cost?",
  level: "advanced", tags: ["performance", "internals"],
  a: `<p>Each method has an <strong>exception table</strong> in its bytecode mapping instruction ranges to handlers. Throwing walks the stack looking for a matching handler — so the <code>try</code> block itself is free when nothing is thrown, and only the <em>throw</em> costs.</p>
<pre><code>// The expensive part is fillInStackTrace(), called by the Throwable constructor.
// It walks the entire stack and captures every frame.

// Measured roughly: a normal return is ~1ns; throwing with a stack trace can be
// hundreds of ns to microseconds, and grows with stack depth.

// Sometimes justified for control-flow-heavy hot paths (parsers, state machines):
public class FastLookupException extends RuntimeException {
    public FastLookupException(String msg) {
        super(msg, null, false, false);       // no suppression, NO writable stack trace
    }
    // Or override: public Throwable fillInStackTrace() { return this; }
}</code></pre>
<p><strong>The rules that follow:</strong></p>
<ul>
<li><strong>Never use exceptions for normal control flow.</strong> Returning <code>Optional.empty()</code> or a result object is both faster and clearer than throwing on a cache miss.</li>
<li><strong>Do not catch and rethrow without adding value</strong> — each rethrow of a new exception captures another stack trace.</li>
<li><strong>Always preserve the cause</strong> — <code>throw new OrderFailedException(msg, e)</code>. Losing the original is the most common code-review comment and makes production debugging far harder.</li>
<li><strong>Beware stackless exceptions in production</strong> — the JIT can optimise a repeatedly-thrown exception into a preallocated instance with <em>no</em> stack trace at all, producing the confusing "exception with no message and no trace" in logs. The flag is <code>-XX:-OmitStackTraceInFastThrow</code>, which is worth disabling in production so traces are always complete.</li>
</ul>
<pre><code>// The bug this flag causes: after thousands of NPEs at the same site,
// the JIT replaces them with a preallocated exception. Your logs then show:
// java.lang.NullPointerException: null      (no stack trace whatsoever)
-XX:-OmitStackTraceInFastThrow</code></pre>
<p>That last point is a strong signal — it is a real production experience rather than textbook knowledge.</p>`
},
{
  q: "What is the difference between heap and off-heap memory, and when do you use direct buffers?",
  level: "advanced", tags: ["memory", "performance"],
  a: `<pre><code>ByteBuffer heap   = ByteBuffer.allocate(1024);        // inside the Java heap, GC-managed
ByteBuffer direct = ByteBuffer.allocateDirect(1024);  // NATIVE memory, outside the heap</code></pre>
<table>
<tr><th></th><th>Heap buffer</th><th>Direct buffer</th></tr>
<tr><td>Location</td><td>Java heap</td><td>Native memory</td></tr>
<tr><td>Allocation cost</td><td>Cheap</td><td>Expensive</td></tr>
<tr><td>GC pressure</td><td>Counts toward the heap</td><td>None — but freed only when the wrapper is collected</td></tr>
<tr><td>I/O</td><td>Copied to a native buffer first</td><td><strong>No copy</strong> — the OS reads/writes it directly</td></tr>
<tr><td>Bounded by</td><td><code>-Xmx</code></td><td><code>-XX:MaxDirectMemorySize</code></td></tr>
</table>
<p><strong>Why direct buffers exist:</strong> the OS cannot perform I/O into a heap buffer, because the garbage collector may move it. So a heap buffer is copied into a temporary native buffer for every read or write. A direct buffer eliminates that copy — which is why Netty, NIO channels and high-throughput I/O libraries use them.</p>
<p><strong>The failure mode to know:</strong> direct memory is <em>not</em> managed by the ordinary GC. A <code>DirectByteBuffer</code> is freed only when its Java wrapper object is collected and its <code>Cleaner</code> runs — so if the heap is comfortable, the GC has no pressure to run, and native memory grows until you hit <code>OutOfMemoryError: Direct buffer memory</code> or the container is OOM-killed. The heap looks perfectly healthy while the process dies.</p>
<pre><code>-XX:MaxDirectMemorySize=256m           # bound it explicitly; the default is roughly -Xmx
-XX:NativeMemoryTracking=summary       # then: jcmd &lt;pid&gt; VM.native_memory summary</code></pre>
<p><strong>Guidance:</strong> use direct buffers for long-lived, reused I/O buffers (which is why they are pooled in Netty), never for short-lived ones — the allocation cost dominates. And when diagnosing a container killed at 137 with a healthy heap, direct buffers and thread stacks are the first two things to check.</p>`
},
{
  q: "What is GraalVM native image and what are the trade-offs?",
  level: "advanced", hot: true, tags: ["graalvm", "modern"],
  a: `<pre><code># Spring Boot 3 has first-class support
mvn -Pnative native:compile
./target/order-service                 # a standalone executable, no JVM required

# Or a container image
mvn -Pnative spring-boot:build-image</code></pre>
<table>
<tr><th></th><th>JVM</th><th>Native image</th></tr>
<tr><td>Startup</td><td>2–10 seconds</td><td><strong>~50 ms</strong></td></tr>
<tr><td>Memory (RSS)</td><td>300–500 MB</td><td><strong>50–100 MB</strong></td></tr>
<tr><td>Peak throughput</td><td><strong>Higher</strong> — the JIT optimises with runtime profiles</td><td>Lower — AOT compiled, no profile-guided JIT</td></tr>
<tr><td>Build time</td><td>Seconds</td><td><strong>3–10 minutes</strong></td></tr>
<tr><td>Image size</td><td>~250 MB</td><td>~80 MB</td></tr>
</table>
<p><strong>How it works and why that constrains you:</strong> native image performs <strong>closed-world analysis</strong> at build time — it must determine every reachable class and method statically, then compiles them ahead of time. Anything resolved dynamically at runtime is invisible to that analysis:</p>
<ul>
<li><strong>Reflection, dynamic proxies, JNI and resource loading</strong> must be declared in configuration. Spring's AOT processing generates most of it for you, which is why Spring Boot 3 made this practical.</li>
<li><strong>No class loading at runtime</strong> — anything not present at build time does not exist.</li>
<li><strong>Static initialisers</strong> may run at build time, so a class caching the current time or a hostname captures the <em>build machine's</em> value. A genuinely confusing bug class.</li>
<li><strong>Debugging and profiling</strong> are harder; JFR support exists but is more limited.</li>
</ul>
<p><strong>When it is worth it:</strong> serverless and scale-to-zero (where cold start is user-visible), CLI tools, and very high replica counts where 400 MB × 200 pods is real money. <strong>When it is not:</strong> a long-running service where peak throughput matters more than startup — a warmed-up JIT beats AOT code, so a native image can be measurably slower under sustained load.</p>
<p><strong>The middle ground worth naming:</strong> Class Data Sharing plus Spring AOT on a normal JVM gives a meaningful startup improvement with none of the reflection constraints — often the better trade for a typical microservice.</p>`
}
]);
