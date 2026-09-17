appendTopic("jvm", [
{
  q: "Production alert: the service is using 100% CPU. How do you diagnose it?",
  level: "advanced", hot: true, tags: ["troubleshooting", "cpu", "profiling", "must-know"],
  companies: ["Amazon", "Microsoft", "Oracle", "Goldman Sachs", "SAP", "Flipkart", "Uber", "Walmart"],
  a: `<pre><code># STEP 1 — is it the JVM, and is it GC or application code?
top -H -p &lt;pid&gt;                       # per-THREAD CPU inside the process
printf '%x\\n' &lt;tid&gt;                   # convert the thread id to hex
jstack &lt;pid&gt; | grep -A 30 0x&lt;hex&gt;     # that exact thread's stack

# If the hot threads are named "GC task thread" -> it is garbage collection.
# If they are your own threads -> it is application code. This single step
# splits the problem in half and most people skip it.

# STEP 2 — confirm with GC data
jstat -gcutil &lt;pid&gt; 1000 10           # survivor/eden/old %, YGC/FGC counts
# FGC climbing every second with OU (old used) staying near 100% is the
# classic signature of a heap that cannot be reclaimed — the JVM is in a
# GC death spiral, and the real bug is a memory leak, not CPU.</code></pre>
<table>
<tr><th>Signature</th><th>Likely cause</th><th>Next step</th></tr>
<tr><td>GC threads hot, Full GCs frequent</td><td>Heap too small, or a leak</td><td>Heap dump and dominator analysis</td></tr>
<tr><td>One application thread hot, same stack every dump</td><td>Infinite or very hot loop</td><td>Read that stack — it usually names the bug</td></tr>
<tr><td>Many threads in the same method</td><td>Lock contention or a hot path</td><td>Async profiler, or check for a shared lock</td></tr>
<tr><td>High <em>system</em> CPU, not user</td><td>Syscalls, context switching, too many threads</td><td>Thread count, and I/O patterns</td></tr>
<tr><td>Regex in the stack</td><td>Catastrophic backtracking</td><td>That input is a denial-of-service vector</td></tr>
<tr><td><code>HashMap</code> operations hot</td><td>Concurrent access corruption, or bad hashing</td><td>Check for unsynchronised sharing</td></tr>
</table>
<pre><code># STEP 3 — the modern tools, worth naming by name
# Async-profiler: low overhead, produces a FLAME GRAPH, no safepoint bias
./profiler.sh -d 30 -f cpu.html &lt;pid&gt;
./profiler.sh -e alloc -d 30 -f alloc.html &lt;pid&gt;    # allocation profiling

# JFR: built into the JDK, ~1% overhead, safe to run in production
jcmd &lt;pid&gt; JFR.start duration=60s filename=rec.jfr settings=profile
jcmd &lt;pid&gt; JFR.dump filename=rec.jfr
# Open in JDK Mission Control. It shows hot methods, allocation sites,
# lock contention and GC pauses in one recording.

# Why not jstack sampling alone? It only samples at SAFEPOINTS, so tight
# loops that never reach one are invisible. Saying that shows real depth.</code></pre>
<pre><code># OOM — the other half of the alert
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps
# Set these BEFORE you need them. A dump taken after a restart is worthless.

jmap -histo:live &lt;pid&gt; | head -30      # top classes by retained count
# Then Eclipse MAT: "Leak Suspects" and the DOMINATOR TREE, which shows what
# is actually keeping objects alive rather than what is merely large.

# The usual culprits:
#   a static Map or List that only ever grows
#   an unbounded cache with no eviction
#   ThreadLocal not removed on a pooled thread
#   listeners registered and never unregistered
#   a ClassLoader leak after repeated redeploys</code></pre>
<table>
<tr><th>OutOfMemoryError message</th><th>Meaning</th></tr>
<tr><td><code>Java heap space</code></td><td>The usual leak, or a heap that is genuinely too small</td></tr>
<tr><td><code>GC overhead limit exceeded</code></td><td>Over 98% of time in GC recovering under 2% — a leak, almost always</td></tr>
<tr><td><code>Metaspace</code></td><td>Class-loader leak, or a framework generating classes endlessly</td></tr>
<tr><td><code>unable to create new native thread</code></td><td>Thread leak, or an OS limit — heap is irrelevant here</td></tr>
<tr><td><code>Direct buffer memory</code></td><td>NIO or Netty off-heap buffers not released</td></tr>
<tr><td><code>Requested array size exceeds VM limit</code></td><td>An array over about 2^31 elements — usually a bad size calculation</td></tr>
</table>
<p><strong>The discipline to describe:</strong> "I capture evidence before restarting — a thread dump, a heap dump and a JFR recording — because a restart destroys the only thing that can tell me what happened. Then I work top-down: is it GC or application, which thread, which stack. Guessing at the code first is how people spend a day optimising something that was never the bottleneck."</p>`
},
{
  q: "Which garbage collector would you choose, and how do you tune it?",
  level: "advanced", hot: true, tags: ["gc", "g1", "zgc", "tuning", "must-know"],
  companies: ["Amazon", "Oracle", "Microsoft", "Goldman Sachs", "SAP", "Uber", "Flipkart"],
  a: `<table>
<tr><th>Collector</th><th>Pause profile</th><th>Choose it when</th></tr>
<tr><td><strong>Serial</strong></td><td>Long</td><td>Tiny heaps, single core, CLI tools and small containers</td></tr>
<tr><td><strong>Parallel</strong></td><td>Long but efficient</td><td>Batch work where <strong>throughput</strong> matters and pauses do not</td></tr>
<tr><td><strong>G1</strong> (default since 9)</td><td>~10–200 ms, targetable</td><td>The default answer. Balanced, heaps from ~4 GB up</td></tr>
<tr><td><strong>ZGC</strong></td><td><strong>Sub-millisecond</strong></td><td>Latency-critical services; scales to terabyte heaps</td></tr>
<tr><td><strong>Shenandoah</strong></td><td>Sub-millisecond</td><td>Same goal as ZGC, OpenJDK/Red Hat lineage</td></tr>
<tr><td><strong>Epsilon</strong></td><td>None — it never collects</td><td>Benchmarking and short-lived jobs only</td></tr>
</table>
<pre><code># The flags that matter, in the order you would actually set them
-XX:MaxRAMPercentage=75          # in a container: NOT a hard-coded -Xmx
-XX:+UseG1GC                     # default on 9+, but be explicit
-XX:MaxGCPauseMillis=200         # a TARGET, not a guarantee
-Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=10M
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps

# ZGC, when p99 latency is the requirement
-XX:+UseZGC -XX:+ZGenerational    # generational ZGC, JDK 21+

# Set -Xms EQUAL TO -Xmx on a server. Growing the heap causes full GCs
# during the ramp-up, exactly when traffic is arriving.</code></pre>
<pre><code>// WHY GENERATIONAL COLLECTION WORKS — the weak generational hypothesis
// Most objects die young. A request creates DTOs, strings and buffers that
// are garbage microseconds later.
//
// So: allocate in Eden (a pointer bump, essentially free), and collect by
// COPYING the few survivors out rather than tracing the many dead. The cost
// of a young collection is proportional to what SURVIVES, not to the garbage.
// That is why allocating short-lived objects in Java is cheap — and why
// "object pooling to reduce GC" is usually counterproductive advice today.

Eden -> Survivor 0 / Survivor 1 -> (after MaxTenuringThreshold) -> Old
// Objects that survive enough young collections are promoted to Old.
// A too-small survivor space causes PREMATURE PROMOTION: short-lived objects
// reach Old, which then fills and triggers expensive full collections.</code></pre>
<table>
<tr><th>Symptom in the GC log</th><th>Diagnosis</th><th>Action</th></tr>
<tr><td>Frequent young GCs, short pauses</td><td>High allocation rate</td><td>Often fine — check the allocation profile if it hurts</td></tr>
<tr><td>Old generation grows every cycle and never drops</td><td><strong>Memory leak</strong></td><td>Heap dump — no amount of tuning fixes a leak</td></tr>
<tr><td>Full GCs, heap still near-full afterwards</td><td>Heap too small, or a leak</td><td>Increase the heap, then investigate</td></tr>
<tr><td><code>to-space exhausted</code> in G1</td><td>Promotion failed mid-collection</td><td>More heap, or start the concurrent cycle earlier</td></tr>
<tr><td>Long pauses with a small live set</td><td>Humongous allocations, or swapping</td><td>Check region size; ensure the heap is not swapped out</td></tr>
<tr><td>High GC time but low pause time</td><td>Concurrent work stealing CPU</td><td>Expected with G1 and ZGC — measure throughput, not pauses alone</td></tr>
</table>
<pre><code># THE TUNING ORDER — and the point is that step 1 fixes most cases
1. Fix the ALLOCATION RATE in the application. Producing less garbage beats
   every flag. A profiler pointing at one hot allocation site is worth more
   than a week of tuning.
2. Size the heap correctly — big enough that the live set is a small fraction.
3. Pick the right collector for the requirement (throughput vs latency).
4. Only then touch individual flags, one at a time, measuring each.

# Never copy a set of GC flags from a blog post. They encode someone else's
# heap size, allocation rate, core count and JDK version.</code></pre>
<p><strong>The judgement to show:</strong> "I start by asking what the requirement actually is. If it is throughput on a batch job, Parallel GC may genuinely be the best choice and G1 is a downgrade. If it is a p99 latency target on an API, ZGC removes GC from the latency budget entirely. Choosing before measuring which one you need is how people end up tuning the wrong thing."</p>`
}
]);
