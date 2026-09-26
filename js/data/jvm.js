registerTopic("jvm", [
{
  q: "What are the JVM runtime memory areas?",
  level: "beginner", hot: true, tags: ["memory"],
  a: `<figure class="fig">
<svg viewBox="0 0 640 250" role="img" aria-label="JVM runtime memory areas">
  <rect class="dg-box" x="8" y="8" width="300" height="234" rx="10"/>
  <text class="dg-t" x="158" y="30" text-anchor="middle">Shared across all threads</text>
  <rect class="dg-fill" x="24" y="42" width="268" height="106" rx="8"/>
  <text class="dg-t" x="158" y="64" text-anchor="middle">Heap</text>
  <rect class="dg-fill2" x="38" y="74" width="118" height="30" rx="6"/><text class="dg-s" x="97" y="93" text-anchor="middle">Young (Eden+S0+S1)</text>
  <rect class="dg-fill2" x="164" y="74" width="118" height="30" rx="6"/><text class="dg-s" x="223" y="93" text-anchor="middle">Old / Tenured</text>
  <text class="dg-s" x="158" y="124" text-anchor="middle">all objects and arrays live here</text>
  <text class="dg-s" x="158" y="140" text-anchor="middle">-Xms / -Xmx</text>
  <rect class="dg-fill" x="24" y="158" width="268" height="34" rx="8"/>
  <text class="dg-t" x="158" y="179" text-anchor="middle">Metaspace (native memory)</text>
  <rect class="dg-fill" x="24" y="198" width="268" height="34" rx="8"/>
  <text class="dg-t" x="158" y="219" text-anchor="middle">Code Cache (JIT output)</text>
  <rect class="dg-box" x="326" y="8" width="306" height="234" rx="10"/>
  <text class="dg-t" x="479" y="30" text-anchor="middle">Per thread</text>
  <rect class="dg-fill2" x="342" y="42" width="274" height="52" rx="8"/>
  <text class="dg-t" x="479" y="64" text-anchor="middle">JVM Stack — frames</text>
  <text class="dg-s" x="479" y="82" text-anchor="middle">locals, operand stack, -Xss</text>
  <rect class="dg-fill2" x="342" y="104" width="274" height="42" rx="8"/>
  <text class="dg-t" x="479" y="130" text-anchor="middle">Program Counter register</text>
  <rect class="dg-fill2" x="342" y="156" width="274" height="42" rx="8"/>
  <text class="dg-t" x="479" y="182" text-anchor="middle">Native Method Stack (JNI)</text>
  <text class="dg-s" x="479" y="224" text-anchor="middle">StackOverflowError comes from here</text>
</svg>
<figcaption>Heap and Metaspace are shared; stacks and PC are per thread.</figcaption>
</figure>
<ul>
<li><strong>Heap</strong> — all objects and arrays. Split into Young (Eden + two Survivor spaces) and Old. Garbage collected. <code>OutOfMemoryError: Java heap space</code>.</li>
<li><strong>Metaspace</strong> (replaced PermGen in Java 8) — class metadata, in <em>native</em> memory, so it grows until the OS runs out unless you set <code>-XX:MaxMetaspaceSize</code>.</li>
<li><strong>JVM Stack</strong> — one per thread; a frame per method call holding local variables and the operand stack. Deep recursion → <code>StackOverflowError</code>.</li>
<li><strong>PC register</strong> — address of the current instruction, per thread.</li>
<li><strong>Native method stack</strong> — for JNI calls.</li>
<li><strong>Code cache</strong> — JIT-compiled native code. If it fills, the JVM falls back to the interpreter and gets dramatically slower.</li>
</ul>`
},
{
  q: "Explain the class loading process",
  level: "beginner", hot: true, tags: ["classloading"],
  a: `<p>Three phases, the middle one with three sub-steps:</p>
<ol>
<li><strong>Loading</strong> — a ClassLoader reads the <code>.class</code> bytes and creates a <code>Class</code> object in the heap.</li>
<li><strong>Linking</strong>
  <ul>
  <li><em>Verification</em> — bytecode is checked for safety (valid stack usage, type correctness). This is why you cannot forge bytecode to bypass the type system.</li>
  <li><em>Preparation</em> — static fields get <strong>default</strong> values (0/null), memory allocated.</li>
  <li><em>Resolution</em> — symbolic references to other classes are resolved (may be lazy).</li>
  </ul>
</li>
<li><strong>Initialization</strong> — static initialisers and static field assignments run, in source order, exactly once, thread-safely (the JVM holds an init lock).</li>
</ol>
<p><strong>Triggers for initialisation:</strong> <code>new</code>, accessing a static field (except a compile-time constant, which is inlined), calling a static method, reflection, or initialising a subclass.</p>
<pre><code>class Config {
    static final String NAME = "svc";      // constant — inlined, does NOT trigger init
    static final Logger LOG = ...;         // not a constant — DOES trigger init
    static { System.out.println("init"); }
}</code></pre>`
},
{
  q: "What is the parent delegation model of class loaders?",
  level: "advanced", hot: true, tags: ["classloading"],
  a: `<p>Before loading a class itself, a class loader <strong>asks its parent first</strong>, recursively to the top. Only if every ancestor fails does it try to load the class itself.</p>
<ol>
<li><strong>Bootstrap</strong> (native, no Java object) — core JDK classes from <code>java.base</code>.</li>
<li><strong>Platform</strong> (formerly Extension) — JDK modules beyond the core.</li>
<li><strong>Application/System</strong> — your classpath.</li>
<li><strong>Custom loaders</strong> — web containers, plugin systems, hot reload.</li>
</ol>
<p><strong>Why it exists:</strong> security and consistency. If you write your own <code>java.lang.String</code>, delegation means the bootstrap loader's real String always wins, so you cannot substitute core classes. It also guarantees one class identity per name per loader chain.</p>
<p><strong>Key consequence:</strong> a class's identity is <em>(fully qualified name + classloader)</em>. The same class loaded by two loaders is two different types — which is exactly the source of the maddening <code>ClassCastException: com.x.Foo cannot be cast to com.x.Foo</code> in application servers and hot-reload setups.</p>
<p>Frameworks that deliberately break delegation (Tomcat loads webapp classes first, OSGi uses a graph rather than a tree) do it for isolation between deployed applications.</p>`
},
{
  q: "How does garbage collection work? Explain the generational hypothesis",
  level: "beginner", hot: true, tags: ["gc"],
  a: `<p>The <strong>weak generational hypothesis</strong>: most objects die young, and few references point from old objects to young ones. So the heap is split, and the young generation is collected far more often and far more cheaply.</p>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Generational heap layout and object promotion">
  <rect class="dg-box" x="10" y="30" width="380" height="70" rx="8"/>
  <text class="dg-s" x="200" y="22" text-anchor="middle">Young Generation — minor GC, frequent and fast</text>
  <rect class="dg-fill" x="22" y="42" width="200" height="46" rx="6"/><text class="dg-t" x="122" y="70" text-anchor="middle">Eden</text>
  <rect class="dg-fill2" x="230" y="42" width="72" height="46" rx="6"/><text class="dg-s" x="266" y="70" text-anchor="middle">S0</text>
  <rect class="dg-fill2" x="308" y="42" width="72" height="46" rx="6"/><text class="dg-s" x="344" y="70" text-anchor="middle">S1</text>
  <path class="dg-line" d="M394 65 H424" marker-end="url(#g1)"/>
  <text class="dg-m" x="409" y="20" text-anchor="middle">age &gt; 15</text>
  <rect class="dg-fill" x="428" y="30" width="182" height="70" rx="8"/>
  <text class="dg-t" x="519" y="62" text-anchor="middle">Old Generation</text>
  <text class="dg-s" x="519" y="82" text-anchor="middle">major GC — slow</text>
  <text class="dg-s" x="200" y="124" text-anchor="middle">new objects allocated in Eden (TLAB, bump pointer)</text>
  <text class="dg-s" x="200" y="142" text-anchor="middle">survivors copied S0 ↔ S1 each minor GC, age++</text>
  <defs><marker id="g1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Allocation in Eden, copying between survivors, promotion to Old.</figcaption>
</figure>
<p><strong>The cycle:</strong> objects are allocated in Eden. When Eden fills, a <strong>minor GC</strong> runs: live objects are copied to a survivor space and their age incremented; everything else is discarded wholesale (copying collectors cost time proportional to the <em>live</em> set, not the garbage). After surviving <code>-XX:MaxTenuringThreshold</code> (default 15) cycles, or if survivor space overflows, objects are <strong>promoted</strong> to Old. When Old fills, a <strong>major/full GC</strong> runs — much more expensive.</p>
<p><strong>Reachability:</strong> collection starts from <em>GC roots</em> — stack local variables, static fields, JNI references, active threads — and marks everything reachable. Unreachable objects are garbage, which is how Java handles cyclic references correctly (unlike naive reference counting).</p>`
},
{
  q: "Compare the garbage collectors: Serial, Parallel, CMS, G1, ZGC, Shenandoah",
  level: "advanced", hot: true, tags: ["gc", "tuning"],
  a: `<table>
<tr><th>Collector</th><th>Flag</th><th>Best for</th><th>Pause characteristic</th></tr>
<tr><td>Serial</td><td><code>-XX:+UseSerialGC</code></td><td>Small heaps, single core, containers &lt; 100 MB</td><td>Stop-the-world, single-threaded</td></tr>
<tr><td>Parallel (Throughput)</td><td><code>-XX:+UseParallelGC</code></td><td>Batch jobs where throughput beats latency</td><td>Stop-the-world, multithreaded</td></tr>
<tr><td>CMS</td><td>removed in 14</td><td>—</td><td>Concurrent marking, fragmentation issues</td></tr>
<tr><td><strong>G1</strong></td><td><code>-XX:+UseG1GC</code> (default since 9)</td><td>Most server apps, heaps 4–32 GB</td><td>Region-based, pause target ~200 ms</td></tr>
<tr><td><strong>ZGC</strong></td><td><code>-XX:+UseZGC</code></td><td>Very large heaps, latency-critical</td><td>Sub-millisecond, scales to TBs</td></tr>
<tr><td>Shenandoah</td><td><code>-XX:+UseShenandoahGC</code></td><td>Low latency, Red Hat builds</td><td>Concurrent compaction</td></tr>
</table>
<p><strong>G1 in one paragraph:</strong> it divides the heap into ~2048 equal regions, each dynamically labelled Eden, Survivor, Old or Humongous. It concurrently marks liveness, then collects the regions with the most garbage first ("garbage first"), copying survivors and compacting as it goes. You set a goal — <code>-XX:MaxGCPauseMillis=200</code> — and it sizes the collection set to try to meet it.</p>
<p><strong>Practical advice for the interview:</strong> "G1 is the default and right for almost everything; I would only move to ZGC if p99 latency requirements were tight and the heap large, and I would decide from GC logs rather than by reputation."</p>`
},
{
  q: "What is a stop-the-world pause and how do you reduce it?",
  level: "advanced", tags: ["gc", "tuning"],
  a: `<p>A STW pause is when the JVM halts <em>all</em> application threads at a <strong>safepoint</strong> so the collector can move objects or scan roots safely. Every collector has some STW; modern ones minimise it by doing marking concurrently.</p>
<p><strong>Reducing it:</strong></p>
<ul>
<li><strong>Allocate less.</strong> The cheapest object is the one never created — object pooling for large buffers, primitives over boxed types, avoiding needless intermediate collections. Most GC problems are allocation problems.</li>
<li><strong>Right-size the young generation.</strong> Too small → premature promotion → expensive full GCs. Too large → longer minor pauses.</li>
<li><strong>Use a low-pause collector</strong> (G1 with a pause target, or ZGC).</li>
<li><strong>Avoid humongous allocations</strong> — an object larger than half a G1 region gets special, expensive handling.</li>
<li><strong>Watch for long safepoint times</strong> unrelated to GC: biased-lock revocation, huge counted loops without safepoint polls, or <code>Thread.dump</code>. Enable <code>-Xlog:safepoint</code>.</li>
</ul>
<p>Also: never call <code>System.gc()</code>. It requests a full GC and is disabled in production with <code>-XX:+DisableExplicitGC</code> for exactly that reason.</p>`
},
{
  q: "What causes OutOfMemoryError, and how do you diagnose it?",
  level: "advanced", hot: true, tags: ["production", "memory"],
  a: `<table>
<tr><th>Message</th><th>Cause</th></tr>
<tr><td><code>Java heap space</code></td><td>Genuine leak, undersized heap, or loading too much at once</td></tr>
<tr><td><code>GC overhead limit exceeded</code></td><td>&gt;98% of time in GC recovering &lt;2% heap — a leak, almost always</td></tr>
<tr><td><code>Metaspace</code></td><td>Class loader leak — repeated redeploys, dynamic proxy/CGLIB generation in a loop</td></tr>
<tr><td><code>unable to create new native thread</code></td><td>Thread leak or OS limit; each thread costs ~1 MB of native stack</td></tr>
<tr><td><code>Requested array size exceeds VM limit</code></td><td>Array larger than <code>Integer.MAX_VALUE - 2</code></td></tr>
<tr><td><code>Direct buffer memory</code></td><td>Off-heap <code>ByteBuffer</code>s not released — common with NIO and Netty</td></tr>
</table>
<p><strong>Diagnosis procedure:</strong></p>
<pre><code># 1. Always have this on in production
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app/

# 2. Watch generation usage live
jstat -gcutil &lt;pid&gt; 1000        # OU column climbing after full GCs = leak

# 3. Cheap histogram — top consumers by class, no dump needed
jmap -histo:live &lt;pid&gt; | head -30

# 4. Full dump for real analysis
jcmd &lt;pid&gt; GC.heap_dump /tmp/heap.hprof</code></pre>
<p>Then open the dump in <strong>Eclipse MAT</strong> and run the Leak Suspects report; look at <em>dominator tree</em> and <em>GC roots path</em> to see what is holding the memory. The usual culprits: an unbounded cache or <code>static Map</code>, a <code>ThreadLocal</code> never removed in a pooled thread, listeners registered and never deregistered, and unclosed streams or connections.</p>`
},
{
  q: "What is JIT compilation, C1/C2 and tiered compilation?",
  level: "advanced", hot: true, tags: ["jit", "performance"],
  a: `<p>The JVM starts by <strong>interpreting</strong> bytecode, which is slow but starts instantly. It counts method invocations and loop back-edges; once a method is "hot", the <strong>JIT</strong> compiles it to native code.</p>
<ul>
<li><strong>C1 (client)</strong> — compiles fast, optimises lightly. Good for startup.</li>
<li><strong>C2 (server)</strong> — compiles slowly, optimises aggressively. Good for long-running peak performance.</li>
<li><strong>Tiered compilation</strong> (default) — uses C1 first for quick gains and collects profiling data, then recompiles the hottest methods with C2 using that profile. Best of both.</li>
</ul>
<p><strong>Key optimisations to name:</strong></p>
<ul>
<li><strong>Inlining</strong> — the most valuable one; it removes call overhead and enables everything else.</li>
<li><strong>Escape analysis</strong> — if an object cannot escape the method, it may be scalar-replaced and never allocated (stack allocation in effect), and its locks elided.</li>
<li><strong>Loop unrolling, dead code elimination, constant folding.</strong></li>
<li><strong>Speculative optimisation with deoptimisation</strong> — the JIT assumes a call site is monomorphic and inlines; if a second implementation loads later, it deoptimises and recompiles.</li>
</ul>
<p><strong>Interview-relevant consequence:</strong> this is why naive microbenchmarks lie. The first thousand iterations run interpreted, and dead code gets removed entirely. Use <strong>JMH</strong>, which handles warmup, dead-code elimination and forking.</p>
<p>Ahead-of-time alternatives worth naming: <strong>GraalVM native-image</strong>, which trades peak throughput and dynamic features for millisecond startup and low memory — the reason Quarkus exists.</p>`
},
{
  q: "How do you tune JVM memory for a container (Docker/Kubernetes)?",
  level: "advanced", hot: true, tags: ["tuning", "docker"],
  a: `<p><strong>The historic problem:</strong> a JVM before Java 8u191 read the <em>host's</em> memory and cores, not the cgroup limit — so a 512 MB container would set a 4 GB heap and get OOM-killed by the kernel with no Java stack trace at all.</p>
<pre><code># Modern JVMs are container-aware (UseContainerSupport is on by default).
# Size by percentage, not fixed values, so the same image works at any limit:
-XX:MaxRAMPercentage=75.0
-XX:InitialRAMPercentage=50.0

# Verify what the JVM actually thinks it has:
java -XX:+PrintFlagsFinal -version | grep -i maxheap</code></pre>
<p><strong>Why not 100%?</strong> Heap is not the whole footprint. Native memory also holds Metaspace, thread stacks (~1 MB each), the code cache, GC structures and direct byte buffers. Budget roughly 25% headroom; use <strong>Native Memory Tracking</strong> (<code>-XX:NativeMemoryTracking=summary</code>, then <code>jcmd &lt;pid&gt; VM.native_memory summary</code>) when the container is killed but the heap looks fine.</p>
<p><strong>Kubernetes specifics:</strong> set the container memory <em>limit</em> equal to the <em>request</em> for predictable behaviour, keep CPU limits generous enough that GC threads are not throttled (CPU throttling causes mysterious latency spikes), and remember <code>-XX:ActiveProcessorCount</code> if the CPU limit is fractional, since GC and ForkJoin pool sizes derive from it.</p>`
},
{
  q: "What are strong, soft, weak and phantom references?",
  level: "advanced", tags: ["memory", "gc"],
  a: `<table>
<tr><th>Type</th><th>Collected when</th><th>Use case</th></tr>
<tr><td><strong>Strong</strong> — <code>Object o = new Object()</code></td><td>Never while reachable</td><td>Everything normal</td></tr>
<tr><td><strong>Soft</strong> — <code>SoftReference</code></td><td>Only when memory is tight, before OOM</td><td>Memory-sensitive caches</td></tr>
<tr><td><strong>Weak</strong> — <code>WeakReference</code></td><td>At the next GC once no strong refs exist</td><td>Canonicalising maps, metadata (<code>WeakHashMap</code>)</td></tr>
<tr><td><strong>Phantom</strong> — <code>PhantomReference</code></td><td>After finalisation; <code>get()</code> always returns null</td><td>Post-mortem cleanup of native resources (<code>Cleaner</code>)</td></tr>
</table>
<pre><code>ReferenceQueue&lt;LargeObject&gt; queue = new ReferenceQueue&lt;&gt;();
WeakReference&lt;LargeObject&gt; ref = new WeakReference&lt;&gt;(obj, queue);
LargeObject o = ref.get();     // may be null at any time — always check</code></pre>
<p><strong>Practical caveat:</strong> soft references sound ideal for caches, but in practice the JVM's clearing policy is coarse and unpredictable, and they add GC pressure. A bounded cache with an explicit eviction policy (Caffeine) is almost always the better engineering choice — say that rather than recommending soft references.</p>`
},
{
  q: "How do you read a GC log and decide whether GC is your problem?",
  level: "advanced", tags: ["gc", "production"],
  a: `<pre><code># Unified logging, Java 9+
-Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20M</code></pre>
<p><strong>What to look at, in order:</strong></p>
<ol>
<li><strong>GC throughput</strong> — the percentage of wall-clock time spent in GC. Under 5% is healthy; above 10% is a problem worth fixing.</li>
<li><strong>Pause distribution</strong> — not the average, the p99 and max. One 8-second full GC will show up in your service's latency SLO even if the average is fine.</li>
<li><strong>Old-gen occupancy <em>after</em> each full GC.</strong> This is the single most diagnostic number: if it climbs steadily over hours and never returns to a baseline, you have a memory leak. If it plateaus, your heap is simply too small for the working set.</li>
<li><strong>Promotion rate</strong> — lots of objects surviving to Old means the young generation is too small or objects are being held too long.</li>
<li><strong>Allocation rate</strong> (MB/s) — high rates mean frequent minor GCs; often fixable in code rather than by tuning.</li>
</ol>
<p>Tools: <strong>GCeasy.io</strong> for a quick uploaded analysis, JDK Mission Control with JFR for the full picture. And the honest framing: <em>"Most 'GC problems' are really allocation or leak problems. I tune flags only after I have looked at what the application is allocating."</em></p>`
},
{
  q: "What is the difference between StackOverflowError and OutOfMemoryError?",
  level: "beginner", tags: ["errors"],
  a: `<ul>
<li><strong><code>StackOverflowError</code></strong> — a single thread's stack exceeded <code>-Xss</code> (default ~512 KB–1 MB). Cause: unbounded recursion, mutual recursion, or a cyclic <code>toString()</code>/JPA entity relationship. The stack trace visibly repeats.</li>
<li><strong><code>OutOfMemoryError</code></strong> — the JVM cannot allocate in the heap (or metaspace/native). Cause: a leak or an undersized heap.</li>
</ul>
<p>Both are <code>Error</code>s, not exceptions, so you should not catch them — although <code>StackOverflowError</code> is occasionally caught in parsers with recursive descent as a defensive measure.</p>
<p><strong>Deep recursion fix:</strong> convert to iteration with an explicit stack. Java has no tail-call optimisation, so a "tail recursive" method still consumes a frame per call — worth stating, because candidates often assume otherwise.</p>`
},
{
  q: "What are the JVM's memory-related startup flags you would set in production?",
  level: "advanced", tags: ["tuning"],
  a: `<pre><code># Heap — in containers use percentages
-XX:MaxRAMPercentage=75.0

# Collector (G1 is default; be explicit for clarity)
-XX:+UseG1GC -XX:MaxGCPauseMillis=200

# Diagnostics you will be grateful for at 3am
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/heapdump.hprof
-Xlog:gc*:file=/var/log/app/gc.log:time,uptime:filecount=5,filesize=20M
-XX:NativeMemoryTracking=summary

# Fail fast rather than limp along
-XX:+ExitOnOutOfMemoryError        # let the orchestrator restart the pod

# Flight Recorder, always-on low overhead profiling (~1%)
-XX:StartFlightRecording=disk=true,maxsize=200M,dumponexit=true

# Misc
-Djava.security.egd=file:/dev/./urandom   # avoids startup entropy stalls
-Duser.timezone=UTC</code></pre>
<p><strong>Philosophy to voice:</strong> start with defaults plus observability flags, measure, then change one thing at a time. Copying a tuning blog's flag list into your service is how people make things slower and never find out.</p>`
},
{
  q: "What is a memory leak in Java if there is a garbage collector?",
  level: "advanced", hot: true, tags: ["memory", "production"],
  a: `<p>A Java memory leak is an <strong>unintentional retention</strong>: objects are no longer needed but are still reachable from a GC root, so the collector correctly refuses to free them.</p>
<p><strong>The classic sources:</strong></p>
<ul>
<li><strong>Static collections</strong> — a <code>static Map</code> cache with no eviction grows forever.</li>
<li><strong>ThreadLocal in a thread pool</strong> — pooled threads never die, so the value is never released. Always <code>remove()</code> in a finally block.</li>
<li><strong>Unregistered listeners/callbacks</strong> — the publisher holds a strong reference to the subscriber forever.</li>
<li><strong>Non-static inner classes</strong> holding the outer instance alive.</li>
<li><strong>Mutated hash-map keys</strong> — the entry becomes unreachable but is never removed.</li>
<li><strong>Unclosed resources</strong> — streams, connections, and their buffers.</li>
<li><strong>ClassLoader leaks</strong> on redeploy — one lingering reference pins the entire loaded application.</li>
<li><strong><code>substring</code> before Java 7</strong> — retained the whole parent char array. Fixed in 7u6, but a good historical example.</li>
</ul>
<pre><code>// The textbook leak
public class Stack {
    private Object[] items = new Object[16];
    private int size;
    public Object pop() {
        return items[--size];       // the slot still references the object!
    }
    public Object popFixed() {
        Object o = items[--size];
        items[size] = null;         // eliminate the obsolete reference
        return o;
    }
}</code></pre>`
},
{
  q: "How does the JVM handle method invocation — what are the invoke bytecodes?",
  level: "advanced", tags: ["bytecode"],
  a: `<table>
<tr><th>Instruction</th><th>Used for</th><th>Dispatch</th></tr>
<tr><td><code>invokestatic</code></td><td>Static methods</td><td>Compile-time, no receiver</td></tr>
<tr><td><code>invokespecial</code></td><td>Constructors, <code>private</code> methods, <code>super.x()</code></td><td>Compile-time, exact method</td></tr>
<tr><td><code>invokevirtual</code></td><td>Normal instance methods</td><td>Runtime, via the class vtable</td></tr>
<tr><td><code>invokeinterface</code></td><td>Interface methods</td><td>Runtime, via itable — slightly slower lookup</td></tr>
<tr><td><code>invokedynamic</code></td><td>Lambdas, string concat, records' equals/hashCode</td><td>Bootstrapped once, then a linked call site</td></tr>
</table>
<p><code>invokedynamic</code> (Java 7, originally for dynamic languages) is the interesting one: the first execution calls a bootstrap method (<code>LambdaMetafactory</code>) that builds and links a <code>CallSite</code>; subsequent executions go straight there. This is why lambdas do not generate a class file each and why the implementation strategy can change between JDK versions without recompiling your code.</p>
<p>Use <code>javap -c YourClass</code> to see all this — being able to say "I read the bytecode with javap" is a strong signal.</p>`
},
{
  q: "What is escape analysis and scalar replacement?",
  level: "advanced", tags: ["jit", "performance"],
  a: `<p><strong>Escape analysis</strong> is a JIT analysis that determines whether an object's reference can leave the method that created it. Three outcomes:</p>
<ul>
<li><strong>No escape</strong> — the object is used only locally. The JIT can perform <strong>scalar replacement</strong>: dismantle the object into its individual fields and keep them in registers. No heap allocation happens at all, so there is nothing for GC to collect.</li>
<li><strong>Argument escape</strong> — passed to a method but not stored. Limited optimisation, may still allow lock elision.</li>
<li><strong>Global escape</strong> — stored in a field or returned. No optimisation.</li>
</ul>
<pre><code>public double distance(double x1, double y1, double x2, double y2) {
    Point a = new Point(x1, y1);      // does not escape
    Point b = new Point(x2, y2);      // does not escape
    return a.distanceTo(b);           // after inlining, both objects vanish
}</code></pre>
<p>It also enables <strong>lock elision</strong> — synchronising on an object no other thread can see is a no-op, which is why <code>StringBuffer</code> used locally costs almost nothing today.</p>
<p><strong>The practical takeaway for interviews:</strong> this is why "avoid allocation by hand-writing object pools" is usually the wrong instinct in modern Java. Short-lived local objects are frequently free.</p>`
},
{
  q: "Explain how you would profile a slow Java application end to end",
  level: "advanced", hot: true, tags: ["production", "performance"],
  a: `<ol>
<li><strong>Measure before guessing.</strong> Establish what "slow" means — p50/p95/p99 latency, throughput, error rate — from Micrometer/Prometheus, not from anecdotes.</li>
<li><strong>Narrow the layer.</strong> Distributed tracing (Sleuth/OpenTelemetry, Zipkin/Jaeger) tells you whether the time is in your service, a downstream call, or the database. Most "Java is slow" tickets turn out to be a database query.</li>
<li><strong>Check the easy structural causes first</strong> — N+1 queries, a missing index, no connection pooling, a synchronous call that should be async, no caching, a chatty API called in a loop.</li>
<li><strong>Profile CPU</strong> with async-profiler or JFR and read the flame graph — the widest frame is your bottleneck. <code>jcmd &lt;pid&gt; JFR.start duration=120s filename=r.jfr</code>.</li>
<li><strong>Profile allocation</strong> — the same tools show allocation flame graphs; high allocation rates cause GC pressure that looks like random latency.</li>
<li><strong>Check contention</strong> — thread dumps showing many <code>BLOCKED</code> threads on one monitor, or JFR's lock events.</li>
<li><strong>Verify with a benchmark.</strong> JMH for the micro level, a load test (k6, Gatling) for the service level — and confirm the fix on the same measurement you started with.</li>
</ol>
<blockquote><p><strong>Frame the answer around evidence.</strong> Interviewers are listening for "I measured, I found, I fixed, I verified" — not a list of tools.</p></blockquote>`
},
{
  q: "What is the difference between Metaspace and PermGen?",
  level: "advanced", tags: ["memory"],
  a: `<table>
<tr><th></th><th>PermGen (≤ Java 7)</th><th>Metaspace (Java 8+)</th></tr>
<tr><td>Location</td><td>Part of the heap</td><td><strong>Native memory</strong></td></tr>
<tr><td>Default size</td><td>Fixed, small (64–82 MB)</td><td>Unlimited — grows until the OS says no</td></tr>
<tr><td>Flag</td><td><code>-XX:MaxPermSize</code></td><td><code>-XX:MaxMetaspaceSize</code></td></tr>
<tr><td>Contained</td><td>Class metadata, interned strings, static fields</td><td>Class metadata only (strings moved to heap in Java 7, statics to the class object)</td></tr>
<tr><td>Collection</td><td>Only on full GC, often ineffective</td><td>Per class loader — when a loader dies, all its metadata is freed together</td></tr>
</table>
<p><strong>Why the change:</strong> PermGen was impossible to size correctly — application servers with many redeploys hit <code>OutOfMemoryError: PermGen space</code> constantly. Metaspace grows dynamically and frees metadata by classloader, which matches how class unloading actually works.</p>
<p><strong>The new trap:</strong> because it is unbounded by default, a classloader leak now exhausts <em>machine</em> memory instead of throwing a clear error. Always set <code>-XX:MaxMetaspaceSize</code> in production.</p>`
}
]);
