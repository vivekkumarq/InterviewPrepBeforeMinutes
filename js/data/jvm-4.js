appendTopic("jvm", [
{
  q: "Your production service throws OutOfMemoryError at 3am — walk me through your response",
  level: "advanced", hot: true, tags: ["production", "debugging"],
  companies: ["Amazon", "Flipkart", "Walmart", "PayPal", "Goldman Sachs", "Maersk"],
  a: `<p>Answer as a procedure with two phases — <strong>restore service first, diagnose second</strong>. Interviewers score the ordering.</p>
<p><strong>Phase 1 — mitigate (minutes):</strong></p>
<ol>
<li>Check the blast radius: one pod or all of them? If one, take it out of the load balancer but <strong>do not kill it</strong> — it is your evidence.</li>
<li>Restart or scale out the rest to restore capacity.</li>
<li>Check for a recent deploy or config change — most OOMs correlate with a release.</li>
</ol>
<p><strong>Phase 2 — diagnose (with the preserved instance):</strong></p>
<pre><code># Read the exact message — it names the memory area
"java.lang.OutOfMemoryError: Java heap space"          -&gt; leak or undersized heap
"... GC overhead limit exceeded"                        -&gt; almost always a leak
"... Metaspace"                                          -&gt; classloader leak
"... unable to create new native thread"                -&gt; thread leak or OS limit
"... Direct buffer memory"                               -&gt; off-heap / Netty buffers
exit code 137 with NO Java error                         -&gt; the KERNEL OOM-killed it

# Is it growing, or just too small?
jstat -gcutil &lt;pid&gt; 1000
# Watch the O (old gen) column across several FULL GCs:
#   returns to a stable baseline  -&gt; heap is undersized, not leaking
#   climbs and never comes back    -&gt; LEAK

# Cheap first look, no dump needed
jmap -histo:live &lt;pid&gt; | head -30

# The real evidence
jcmd &lt;pid&gt; GC.heap_dump /tmp/heap.hprof</code></pre>
<p><strong>Then in Eclipse MAT:</strong> run Leak Suspects, open the <strong>dominator tree</strong> (sorted by <em>retained</em> heap, not shallow), and on the biggest retainer use "path to GC roots, excluding weak/soft references". That chain <em>is</em> the bug.</p>
<p><strong>The usual culprits, in order of how often I have seen them:</strong> an unbounded cache or <code>static</code> collection; a <code>ThreadLocal</code> never removed in a pooled thread; listeners registered and never deregistered; an unbounded queue feeding a slow consumer; and a query loading a whole table because someone forgot pagination.</p>
<p><strong>Close with prevention:</strong> <code>-XX:+HeapDumpOnOutOfMemoryError</code> and <code>-XX:+ExitOnOutOfMemoryError</code> should already be set so the dump exists and the orchestrator restarts the pod — if they were not, that is the first fix.</p>`
},
{
  q: "What is the difference between a memory leak and high memory usage?",
  level: "advanced", hot: true, tags: ["memory", "debugging"],
  companies: ["Amazon", "Oracle", "Microsoft", "Morgan Stanley", "Optum"],
  a: `<table>
<tr><th></th><th>Memory leak</th><th>High usage (undersized heap)</th></tr>
<tr><td>Old gen after a full GC</td><td><strong>Climbs steadily</strong>, never returns to baseline</td><td>Drops back to a stable baseline</td></tr>
<tr><td>Time to failure</td><td>Hours or days — correlates with uptime</td><td>Immediate under load</td></tr>
<tr><td>Restart behaviour</td><td>Fixes it temporarily; recurs on a schedule</td><td>Fails again at the same load</td></tr>
<tr><td>Fix</td><td>Find and release the retained references</td><td>Raise <code>-Xmx</code>, or reduce the working set</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Heap usage sawtooth for healthy versus leaking application">
  <text class="dg-t" x="150" y="16" text-anchor="middle">Healthy — returns to baseline</text>
  <path class="dg-line" d="M20 130 H280 M20 130 V30"/>
  <path class="dg-fill" fill="none" d="M20 118 L55 55 L58 116 L93 52 L96 118 L131 54 L134 116 L169 52 L172 118 L207 55 L210 117 L245 54 L248 118 L275 80"/>
  <path class="dg-line" d="M20 118 H278" stroke-dasharray="4 4"/>
  <text class="dg-s" x="150" y="148" text-anchor="middle">baseline flat over time</text>
  <text class="dg-t" x="460" y="16" text-anchor="middle">Leaking — baseline rises</text>
  <path class="dg-line" d="M330 130 H600 M330 130 V30"/>
  <path class="dg-fill2" fill="none" d="M330 118 L365 58 L368 110 L403 50 L406 100 L441 44 L444 88 L479 40 L482 74 L517 36 L520 60 L555 34 L558 46 L590 34"/>
  <path class="dg-line" d="M330 118 L590 42" stroke-dasharray="4 4"/>
  <text class="dg-s" x="460" y="148" text-anchor="middle">baseline climbs → OOM</text>
</svg>
<figcaption>The diagnostic is the trough after each full GC, not the peak.</figcaption>
</figure>
<p><strong>The single most useful observation:</strong> look at the <em>trough</em>, not the peak. A healthy application sawtooths between the same two levels forever. A leaking one has a rising floor — each full GC recovers less than the last, until GC runs constantly and the application stops making progress ("GC overhead limit exceeded").</p>
<pre><code># The one command that distinguishes them
jstat -gcutil &lt;pid&gt; 5000 100
# O column: 45 → 78 → 46 → 80 → 47   (healthy, returns to ~46)
# O column: 45 → 78 → 62 → 85 → 71   (leaking, floor rising)</code></pre>
<p><strong>Why the distinction matters practically:</strong> raising <code>-Xmx</code> "fixes" a leak for exactly as long as it takes to fill the extra space — so you get paged again next week, having wasted the memory. Conversely, hunting for a leak that does not exist wastes days when the real answer was that the working set genuinely needs more heap.</p>`
},
{
  q: "What JVM flags would you set for a Spring Boot service in Kubernetes?",
  level: "advanced", hot: true, tags: ["tuning", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "SAP", "Ericsson", "Netcracker"],
  a: `<pre><code># --- Memory: percentage-based so ONE image works at any container limit ---
-XX:MaxRAMPercentage=75.0
-XX:InitialRAMPercentage=50.0
-XX:MaxMetaspaceSize=256m

# --- Collector: G1 is the default and right for most services ---
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200

# --- Fail fast and leave evidence ---
-XX:+ExitOnOutOfMemoryError                 # let the orchestrator restart it
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/
-XX:-OmitStackTraceInFastThrow              # keep FULL stack traces in production

# --- Observability ---
-Xlog:gc*:file=/var/log/app/gc.log:time,uptime:filecount=5,filesize=20M
-XX:NativeMemoryTracking=summary
-XX:StartFlightRecording=disk=true,maxsize=200M,maxage=6h,dumponexit=true

# --- Environment ---
-Duser.timezone=UTC
-Dfile.encoding=UTF-8
-Djava.security.egd=file:/dev/./urandom     # avoids entropy stalls on some hosts</code></pre>
<p><strong>Why <code>MaxRAMPercentage</code> rather than <code>-Xmx</code>:</strong> the same image runs in dev with 512 MB and in production with 4 GB. A fixed <code>-Xmx</code> either wastes the larger limit or exceeds the smaller one. Percentage scales automatically.</p>
<p><strong>Why 75% and not 100%:</strong> the heap is not the whole footprint. Metaspace, thread stacks (~1 MB each), the JIT code cache, GC structures and direct byte buffers all live outside it. Setting <code>-Xmx</code> equal to the container limit guarantees an eventual kernel OOM kill — <strong>exit code 137, no Java stack trace</strong>, which is confusing precisely because the heap looked healthy.</p>
<p><strong>The flag most people have never heard of:</strong> <code>-XX:-OmitStackTraceInFastThrow</code>. After the same exception is thrown thousands of times at one site, the JIT replaces it with a preallocated instance carrying <em>no stack trace</em>. Your logs then show a bare <code>NullPointerException: null</code> with nothing to debug. Disabling that optimisation in production is worth the tiny cost.</p>
<p><strong>Say this to close:</strong> "I start with these defaults plus observability, then tune from GC logs and JFR rather than copying a blog's flag list — most flag tuning I have seen made things slower and nobody measured."</p>`
},
{
  q: "How does the JVM decide when to promote an object to the old generation?",
  level: "advanced", tags: ["gc", "internals"],
  companies: ["Oracle", "Amazon", "Goldman Sachs", "Morgan Stanley", "SAP"],
  a: `<p>Four separate mechanisms, and knowing all four is what makes this a strong answer:</p>
<ol>
<li><strong>Age threshold</strong> — an object surviving <code>-XX:MaxTenuringThreshold</code> minor GCs (default 15) is promoted. Its age is stored in the object header's mark word, which is why the maximum is 15 — only 4 bits are available.</li>
<li><strong>Dynamic age adjustment</strong> — if survivors of a given age fill more than <code>-XX:TargetSurvivorRatio</code> (default 50%) of the survivor space, the JVM <em>lowers</em> the effective threshold and promotes earlier.</li>
<li><strong>Survivor space overflow</strong> — if survivors do not fit in the target survivor space, they are promoted immediately regardless of age. This is <strong>premature promotion</strong>, and it is the common cause of a rising old gen in a service that is not leaking.</li>
<li><strong>Large object allocation</strong> — an object bigger than <code>-XX:PretenureSizeThreshold</code> (or a G1 "humongous" object exceeding half a region) is allocated <em>directly</em> in the old generation, skipping Eden entirely.</li>
</ol>
<pre><code># Observe tenuring behaviour
-Xlog:gc+age=trace

# Sample output — the distribution tells you whether sizing is right
Desired survivor size 8388608 bytes, new threshold 3 (max 15)
- age   1:    4194304 bytes,    4194304 total
- age   2:    3145728 bytes,    7340032 total
- age   3:    2097152 bytes,    9437184 total   &lt;- exceeds desired, threshold DROPS to 3</code></pre>
<p><strong>Why premature promotion matters:</strong> objects that would have died young end up in the old generation, where only an expensive major GC can reclaim them. The symptom is frequent full GCs in an application with no actual leak. The fix is usually a larger young generation (<code>-XX:NewRatio</code> or, with G1, simply more heap) so short-lived objects have time to die in Eden.</p>
<p><strong>The G1 nuance worth adding:</strong> G1 has no fixed young/old boundary — regions are dynamically labelled, and it sizes the young generation adaptively to meet <code>MaxGCPauseMillis</code>. So manually tuning <code>NewRatio</code> with G1 usually fights the collector rather than helping it, which is why the modern advice is to set a pause goal and leave generation sizing alone.</p>`
},
{
  q: "What is the difference between -Xmx, -Xms and why set them equal?",
  level: "beginner", hot: true, tags: ["tuning"],
  companies: ["TCS", "Infosys", "Wipro", "IBM", "Capgemini", "HCL"],
  a: `<table>
<tr><th>Flag</th><th>Meaning</th></tr>
<tr><td><code>-Xms</code></td><td>Initial heap size — what the JVM allocates at startup</td></tr>
<tr><td><code>-Xmx</code></td><td>Maximum heap — the ceiling it may grow to</td></tr>
<tr><td><code>-Xss</code></td><td>Stack size per thread (~512 KB–1 MB default)</td></tr>
<tr><td><code>-Xmn</code></td><td>Young generation size (avoid with G1)</td></tr>
</table>
<pre><code>java -Xms2g -Xmx2g -jar app.jar        # equal — no resizing
java -Xms512m -Xmx4g -jar app.jar      # grows on demand</code></pre>
<p><strong>Why production commonly sets them equal:</strong></p>
<ol>
<li><strong>No resize pauses.</strong> Growing the heap requires a full GC in some collectors and always costs a stop-the-world moment. Setting them equal means it never happens.</li>
<li><strong>Predictable footprint.</strong> The container's memory usage is stable from startup, so you can size limits and alerts accurately instead of watching RSS creep.</li>
<li><strong>Fail fast.</strong> If the machine cannot supply the memory, the JVM fails to start rather than dying under load three hours later.</li>
<li><strong>Avoids OS reclaim churn</strong> — the JVM does not repeatedly commit and uncommit pages.</li>
</ol>
<p><strong>The counterargument:</strong> a small <code>-Xms</code> lets many low-traffic services share a host efficiently. That matters on shared VMs; in a container with a dedicated memory limit it does not, because the limit is reserved for you anyway.</p>
<pre><code># In containers, prefer percentages so one image works everywhere
-XX:InitialRAMPercentage=50.0
-XX:MaxRAMPercentage=75.0

# Verify what the JVM actually chose
java -XX:+PrintFlagsFinal -version | grep -Ei 'InitialHeapSize|MaxHeapSize'</code></pre>
<p><strong>The point to close on:</strong> <code>-Xmx</code> is <em>not</em> the process footprint. Metaspace, thread stacks, code cache and direct buffers sit outside it — so a 1 GB container with <code>-Xmx1g</code> will be OOM-killed by the kernel. Leave roughly 25% headroom.</p>`
},
{
  q: "What happens during a full GC and why is it expensive?",
  level: "advanced", tags: ["gc", "performance"],
  companies: ["Amazon", "Oracle", "Barclays", "JPMorgan", "Adobe"],
  a: `<p>A <strong>full GC</strong> collects the entire heap — young, old and (usually) metaspace — rather than just the young generation.</p>
<pre><code>Phases (broadly, collector-dependent):
1. Mark    — traverse from GC roots, marking every reachable object.
             Cost is proportional to the LIVE set, and the old gen holds the most.
2. Sweep   — identify unreachable objects.
3. Compact — move survivors together to eliminate fragmentation.
             Every reference to a moved object must be updated -> stop-the-world.</code></pre>
<p><strong>Why it is expensive:</strong> a minor GC only scans the young generation and copies the few survivors, so its cost scales with <em>survivors</em>, not garbage. A full GC must traverse the entire live object graph — which in a large heap is millions of objects — and then physically move them. That is why a full GC on a 16 GB heap can pause for seconds while a minor GC takes milliseconds.</p>
<p><strong>What triggers one:</strong></p>
<ul>
<li>Old generation is full (promotion fails).</li>
<li>Metaspace exhausted.</li>
<li>An explicit <code>System.gc()</code> call — which is why production sets <code>-XX:+DisableExplicitGC</code>.</li>
<li><strong>Concurrent mode failure</strong> in G1/CMS — the concurrent cycle did not finish before the old gen filled, so the JVM falls back to a fully stop-the-world collection. This is the one that causes the worst pauses.</li>
<li>Humongous allocation that cannot be satisfied.</li>
</ul>
<pre><code># Find them in the log
grep "Pause Full" gc.log
[45.231s][info][gc] GC(87) Pause Full (G1 Evacuation Pause) 3891M-&gt;2104M(4096M) 2841.394ms</code></pre>
<p><strong>How to reduce them, in order of effectiveness:</strong> allocate less (most GC problems are allocation problems); size the heap so the old generation is not chronically near full; make sure the young generation is big enough that short-lived objects die there instead of being prematurely promoted; start the G1 concurrent cycle earlier with <code>-XX:InitiatingHeapOccupancyPercent</code>; and only then consider a lower-pause collector like ZGC.</p>
<p><strong>The rule of thumb to quote:</strong> under 5% of wall-clock time in GC is healthy; above 10% is worth fixing. And alert on the <em>p99 pause</em>, not the average — one 3-second full GC breaks your latency SLO regardless of how good the mean looks.</p>`
},
{
  q: "How would you diagnose a slow application without a profiler installed?",
  level: "advanced", hot: true, tags: ["debugging", "production"],
  companies: ["Amazon", "Google", "Microsoft", "Goldman Sachs", "Maersk", "Nokia"],
  a: `<p>Everything below ships with the JDK — no agent, no restart, no installation.</p>
<pre><code># 1. Is it CPU, memory, I/O or locking?
top -H -p &lt;pid&gt;                       # per-THREAD CPU; note the hot TID
printf '%x\\n' &lt;tid&gt;                    # convert to hex for the thread dump

# 2. Thread dump — take THREE, ten seconds apart
jcmd &lt;pid&gt; Thread.print &gt; d1.txt
# What is in the SAME place across all three is stuck; what moves is just busy.
grep -c "java.lang.Thread.State: BLOCKED" d1.txt     # lock contention
grep -A 20 "nid=0x&lt;hex-tid&gt;" d1.txt                  # the hot thread's stack
grep -i "deadlock" d1.txt                             # jcmd names deadlocks explicitly

# 3. GC — is the application even running, or collecting?
jstat -gcutil &lt;pid&gt; 1000
# High GCT and rising FGC means the problem is memory, not CPU.

# 4. What is on the heap?
jmap -histo:live &lt;pid&gt; | head -30

# 5. Flight Recorder — a real profile, ~1% overhead, no restart
jcmd &lt;pid&gt; JFR.start duration=120s filename=/tmp/r.jfr settings=profile
jfr summary /tmp/r.jfr
jfr print --events CPULoad,GarbageCollection,JavaMonitorEnter /tmp/r.jfr</code></pre>
<table>
<tr><th>Thread dump pattern</th><th>Diagnosis</th></tr>
<tr><td>Many threads <code>BLOCKED</code> on one monitor</td><td>Lock contention — find the holder</td></tr>
<tr><td>Many threads in <code>socketRead0</code></td><td>Slow downstream service, not your code</td></tr>
<tr><td>Threads waiting on a connection pool</td><td>Pool too small, or connections leaked</td></tr>
<tr><td>One thread <code>RUNNABLE</code> in a tight loop</td><td>Infinite loop or an O(n²) algorithm</td></tr>
<tr><td>GC threads dominating</td><td>Memory problem masquerading as CPU</td></tr>
<tr><td>Regex frames in the stack</td><td>Catastrophic backtracking (ReDoS)</td></tr>
</table>
<p><strong>The framing that scores:</strong> "I would not guess. Three thread dumps and one <code>jstat</code> run tell me within two minutes whether this is CPU, memory, locking or a downstream dependency — and each of those has a completely different fix. Guessing wrong costs an hour."</p>
<p><strong>And the prevention point:</strong> JFR with <code>maxage=6h</code> running continuously in production costs about 1% and means the recording of the incident already exists when you are paged. That is worth setting up before you need it.</p>`
},
{
  q: "What is the difference between the JIT compiler and an AOT compiler?",
  level: "beginner", tags: ["jit", "graalvm"],
  companies: ["Oracle", "Amazon", "SAP", "Red Hat", "EPAM"],
  a: `<table>
<tr><th></th><th>JIT (just-in-time)</th><th>AOT (ahead-of-time)</th></tr>
<tr><td>When compiled</td><td>At runtime, after profiling</td><td>At build time</td></tr>
<tr><td>Startup</td><td>Slow — interprets first</td><td><strong>Very fast</strong></td></tr>
<tr><td>Peak throughput</td><td><strong>Higher</strong> — optimises on real profiles</td><td>Lower — no runtime data</td></tr>
<tr><td>Memory</td><td>Higher (JVM + code cache)</td><td>Much lower</td></tr>
<tr><td>Dynamic features</td><td>Full reflection, class loading</td><td>Restricted — needs configuration</td></tr>
</table>
<p><strong>Why the JIT can beat AOT at peak:</strong> it sees what actually happens. It knows this call site only ever receives one type, so it inlines the method and removes the virtual dispatch. It knows this branch is never taken, so it compiles an uncommon trap instead. It performs escape analysis and eliminates allocations entirely. A static compiler has none of that information — it must be conservative.</p>
<pre><code># The cost is WARM-UP: the first thousands of requests run interpreted or C1-compiled
-XX:+PrintCompilation          # watch methods being compiled
-XX:TieredStopAtLevel=1        # C1 only — faster startup, lower peak (good for CLI/tests)

# GraalVM native image — AOT for the whole application
native-image -jar app.jar
# Startup ~50ms instead of 3s; RSS ~80MB instead of 400MB;
# but reflection, proxies and resources must be declared at build time.</code></pre>
<p><strong>The practical consequences to state:</strong></p>
<ul>
<li><strong>Benchmarks must warm up</strong> — timing a loop's first thousand iterations measures the interpreter, not your code. This is why JMH exists.</li>
<li><strong>Load balancers should ramp traffic</strong> to a freshly started instance rather than sending full load immediately.</li>
<li><strong>AOT suits serverless and scale-to-zero</strong>, where cold start is user-visible; the JVM suits long-running services, where warm-up is amortised over hours.</li>
</ul>
<p><strong>The middle ground worth naming:</strong> Class Data Sharing plus Spring AOT gives a meaningful startup improvement on a normal JVM with none of native image's reflection restrictions — often the better trade for a typical microservice.</p>`
},
{
  q: "Explain the Java memory model in terms of what a developer must actually know",
  level: "advanced", tags: ["jmm", "concurrency"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "Microsoft", "Morgan Stanley"],
  a: `<p>Strip away the formalism — a working developer needs three facts.</p>
<p><strong>1. Without synchronisation, one thread's write may never be seen by another.</strong> Not "eventually" — possibly never. The compiler may hoist the read out of a loop into a register, and the CPU may keep the write in a store buffer.</p>
<pre><code>private boolean running = true;                 // NOT volatile
public void stop() { running = false; }
public void run()  { while (running) work(); }  // may loop FOREVER — the JIT hoists
                                                 // the read out of the loop</code></pre>
<p><strong>2. Instructions can be reordered</strong> — by the compiler, the JIT and the CPU — as long as single-threaded behaviour is preserved. Across threads, the order you wrote is not the order observed.</p>
<pre><code>// Thread A                    // Thread B
data = compute();              if (ready) {
ready = true;                      use(data);   // may see ready==true but STALE data
                               }</code></pre>
<p><strong>3. The fix is to establish <em>happens-before</em>.</strong> These do it:</p>
<ul>
<li><code>volatile</code> write → subsequent <code>volatile</code> read of the same field</li>
<li>Unlocking a monitor → subsequent locking of the same monitor</li>
<li><code>Thread.start()</code> → everything in that thread</li>
<li>Everything in a thread → another thread's <code>join()</code> returning</li>
<li>Putting into a concurrent collection → taking it out</li>
<li><code>final</code> field writes in a constructor → any thread that sees the constructed object</li>
</ul>
<pre><code>// The fix for case 1
private volatile boolean running = true;

// The fix for case 2 — the volatile write publishes everything before it
private volatile boolean ready;
data = compute();          // ordinary write
ready = true;              // volatile write = release barrier
// Thread B reading 'ready' as true is GUARANTEED to see the computed 'data'.</code></pre>
<p><strong>The practical rule to give:</strong> "If two threads touch the same variable and at least one writes, you need <code>volatile</code>, a lock, an atomic, or a concurrent collection. Without one of those the JMM makes no promise at all — and the failure is intermittent, load-dependent and nearly impossible to reproduce in a debugger, which is what makes it dangerous."</p>
<p><strong>The design ladder:</strong> immutability and thread confinement remove the problem; atomics handle single variables; locks handle invariants across several. Reach for the simplest one that expresses your requirement.</p>`
}
]);
