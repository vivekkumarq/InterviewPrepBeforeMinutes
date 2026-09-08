appendTopic("jvm", [
{
  q: "Your service throws OutOfMemoryError in production — walk me through the diagnosis",
  level: "advanced", hot: true, tags: ["memory", "debugging", "production", "gc"],
  companies: ["Amazon", "Optum", "Goldman Sachs", "SAP", "Flipkart", "Barclays", "Maersk", "Oracle"],
  a: `<table>
<tr><th>OOM message</th><th>Meaning</th><th>First thing to check</th></tr>
<tr><td><code>Java heap space</code></td><td>Heap genuinely full</td><td>Leak, or a legitimately undersized heap</td></tr>
<tr><td><code>GC overhead limit exceeded</code></td><td>98% of time in GC recovering &lt;2%</td><td>Same causes — the JVM gave up before the heap filled</td></tr>
<tr><td><code>Metaspace</code></td><td>Class metadata exhausted</td><td>Classloader leak — repeated redeploys, dynamic proxies, scripting engines</td></tr>
<tr><td><code>unable to create native thread</code></td><td>OS thread limit or native memory</td><td>Thread leak — count with <code>jstack | grep -c tid</code></td></tr>
<tr><td><code>Direct buffer memory</code></td><td>Off-heap NIO buffers</td><td>Netty or NIO buffers not released; check <code>MaxDirectMemorySize</code></td></tr>
<tr><td><code>Requested array size exceeds VM limit</code></td><td>Array larger than ~2³¹</td><td>A bug — usually an unbounded read of a response body</td></tr>
</table>
<pre><code># 1. ALWAYS have this on before the incident, not after
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/
-Xlog:gc*:file=/var/log/app/gc.log:time,uptime:filecount=5,filesize=20M

# 2. Live triage
jcmd &lt;pid&gt; GC.heap_info                 # used vs committed vs max
jcmd &lt;pid&gt; GC.class_histogram | head -30  # what is filling the heap, by class
jstat -gcutil &lt;pid&gt; 1000                # is old gen climbing and never dropping?
jcmd &lt;pid&gt; Thread.print | grep -c '"'   # thread count

# 3. Capture a dump on demand (pauses the JVM — do it on one instance)
jcmd &lt;pid&gt; GC.heap_dump /tmp/heap.hprof

# 4. Analyse with Eclipse MAT: the Leak Suspects report finds the
#    dominator tree root — the object retaining everything else.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Old generation growing steadily across GC cycles indicating a leak">
  <path class="dg-line" d="M40 130 H580 M40 130 V20"/>
  <path class="dg-line" d="M40 118 L90 60 L92 96 L142 46 L144 82 L194 34 L196 70 L246 24 L248 58 L298 16"/>
  <text class="dg-s" x="330" y="46">each GC recovers less than the</text>
  <text class="dg-s" x="330" y="66">previous one — the floor rises</text>
  <text class="dg-s" x="330" y="94">a healthy service has a FLAT</text>
  <text class="dg-s" x="330" y="114">post-GC baseline, whatever the peaks</text>
  <text class="dg-s" x="16" y="20">heap</text>
  <text class="dg-s" x="300" y="148">time</text>
</svg>
</figure>
<table>
<tr><th>Common leak</th><th>Why it retains</th></tr>
<tr><td><code>static</code> Map used as a cache</td><td>Nothing ever evicts — use Caffeine with a size or TTL bound</td></tr>
<tr><td>Listener never unregistered</td><td>The publisher holds a strong reference to a dead object</td></tr>
<tr><td><code>ThreadLocal</code> not cleared</td><td>Pooled threads live forever, so the value never becomes unreachable</td></tr>
<tr><td>Unclosed streams / connections</td><td>Each retains buffers and native memory</td></tr>
<tr><td>Mutable key in a <code>HashMap</code></td><td>Entry stranded in the wrong bucket — unreachable but referenced</td></tr>
<tr><td>Unbounded queue in an executor</td><td>Tasks pile up faster than they drain</td></tr>
<tr><td>Big <code>substring</code> in Java 6</td><td>Shared the parent char array — fixed in Java 7, still asked</td></tr>
</table>
<pre><code># In a container, the flag that actually matters
-XX:MaxRAMPercentage=75
# NOT a fixed -Xmx. Metaspace, thread stacks, code cache and direct buffers
# all live OUTSIDE the heap but INSIDE the container limit, so leaving 25%
# headroom is what prevents the kernel OOM-killing the process (exit 137).</code></pre>
<p><strong>The distinction to draw:</strong> "An OOM is not automatically a leak. First I check whether the heap is simply too small for the actual working set — a cache sized for peak traffic, or a batch job loading a whole file. The GC log tells me instantly: if the post-collection baseline is flat, it is a sizing problem; if it climbs monotonically across cycles, it is a leak and I need a heap dump."</p>`
},
{
  q: "Compare the garbage collectors — Serial, Parallel, G1, ZGC and Shenandoah",
  level: "advanced", hot: true, tags: ["gc", "tuning", "performance"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "SAP", "Flipkart", "Morgan Stanley", "Optum"],
  a: `<table>
<tr><th>Collector</th><th>Pause</th><th>Throughput</th><th>Heap size</th><th>Use for</th></tr>
<tr><td><strong>Serial</strong></td><td>High</td><td>Good for tiny heaps</td><td>&lt; 100 MB</td><td>Single-core containers, CLI tools</td></tr>
<tr><td><strong>Parallel</strong></td><td>High (seconds on big heaps)</td><td><strong>Best</strong></td><td>Any</td><td>Batch jobs where throughput beats latency</td></tr>
<tr><td><strong>G1</strong> (default since 9)</td><td>~50–200 ms, targetable</td><td>Very good</td><td>4 GB – 64 GB</td><td><strong>Almost every service</strong></td></tr>
<tr><td><strong>ZGC</strong></td><td><strong>&lt; 1 ms</strong>, heap-size independent</td><td>Slightly lower</td><td>8 GB – 16 TB</td><td>Latency-critical, very large heaps</td></tr>
<tr><td><strong>Shenandoah</strong></td><td>&lt; 10 ms</td><td>Slightly lower</td><td>Any</td><td>Same niche as ZGC, OpenJDK/Red Hat</td></tr>
<tr><td>Epsilon</td><td>None — never collects</td><td>—</td><td>—</td><td>Benchmarking and short-lived jobs only</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="G1 region based heap versus classic generational layout">
  <text class="dg-s" x="16" y="20">G1 — the heap is a grid of equal-sized regions, each tagged by role</text>
  <g>
    <rect class="dg-fill" x="16" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="36" y="50" text-anchor="middle">E</text>
    <rect class="dg-fill" x="60" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="80" y="50" text-anchor="middle">E</text>
    <rect class="dg-fill2" x="104" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="124" y="50" text-anchor="middle">S</text>
    <rect class="dg-box" x="148" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="168" y="50" text-anchor="middle">O</text>
    <rect class="dg-box" x="192" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="212" y="50" text-anchor="middle">O</text>
    <rect class="dg-fill" x="236" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="256" y="50" text-anchor="middle">E</text>
    <rect class="dg-box" x="280" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="300" y="50" text-anchor="middle">O</text>
    <rect class="dg-fill2" x="324" y="30" width="40" height="30" rx="3"/><text class="dg-s" x="344" y="50" text-anchor="middle">H</text>
  </g>
  <text class="dg-s" x="390" y="40">E eden · S survivor</text>
  <text class="dg-s" x="390" y="58">O old · H humongous</text>
  <text class="dg-s" x="16" y="92">a region's role can CHANGE after a collection — that is what lets G1 hit</text>
  <text class="dg-s" x="16" y="112">a pause target: it collects only as many regions as fit in the time budget</text>
  <text class="dg-s" x="16" y="140">humongous objects (&gt; half a region) are allocated straight into old gen — a common tuning issue</text>
</svg>
</figure>
<pre><code># G1 — the flags that actually matter
-XX:+UseG1GC                       # default since Java 9
-XX:MaxGCPauseMillis=200           # a TARGET, not a guarantee
-XX:InitiatingHeapOccupancyPercent=45   # when the concurrent cycle starts
-XX:G1HeapRegionSize=16m           # raise it if you allocate large arrays

# ZGC — almost nothing to tune, which is the point
-XX:+UseZGC -XX:+ZGenerational     # generational ZGC, default from Java 23

# Always on
-Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=20M

# Sizing
-Xms4g -Xmx4g                      # equal: avoids resize pauses on a server
-XX:MaxRAMPercentage=75            # in a container, prefer this to fixed sizes</code></pre>
<p><strong>The generational hypothesis behind all of them:</strong> most objects die young. So the heap is split — new objects go into eden, survivors are copied a few times, and only long-lived ones are promoted to old gen. Minor collections touch only the young generation and are cheap; the expensive work is the old generation, which is exactly what G1 and ZGC do concurrently.</p>
<table>
<tr><th>Symptom</th><th>Likely cause</th></tr>
<tr><td>Frequent minor GCs</td><td>Young gen too small, or a very high allocation rate</td></tr>
<tr><td>Long full GCs</td><td>Old gen filling — leak, or promotion too aggressive</td></tr>
<tr><td>"To-space exhausted" in G1</td><td>Survivor space too small; G1 had to fall back to a full GC</td></tr>
<tr><td>Humongous allocations in the log</td><td>Objects over half a region — increase <code>G1HeapRegionSize</code> or fix the allocation</td></tr>
<tr><td>p99 latency spikes matching GC pauses</td><td>Move to ZGC, or reduce allocation</td></tr>
</table>
<p><strong>The advice to give:</strong> "Start with G1 and default settings, turn on GC logging, and only tune what the log proves is a problem. The most effective GC tuning is almost always <em>allocating less</em> — object pooling for large buffers, avoiding boxing in hot loops, streaming instead of materialising large lists. Changing collector flags without a measurement is how people make things slower while believing they optimised."</p>`
},
{
  q: "What happens when a Java class is loaded, and what is the delegation model?",
  level: "advanced", tags: ["classloading", "jvm", "internals"],
  companies: ["Amazon", "Oracle", "SAP", "TCS", "Infosys", "Optum", "EPAM"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Class loader delegation hierarchy from application up to bootstrap">
  <rect class="dg-fill" x="200" y="16" width="200" height="32" rx="6"/><text class="dg-s" x="300" y="37" text-anchor="middle">Bootstrap — java.base, native</text>
  <rect class="dg-fill" x="200" y="66" width="200" height="32" rx="6"/><text class="dg-s" x="300" y="87" text-anchor="middle">Platform — JDK modules</text>
  <rect class="dg-fill2" x="200" y="116" width="200" height="32" rx="6"/><text class="dg-s" x="300" y="137" text-anchor="middle">Application — your classpath</text>
  <path class="dg-line" d="M190 130 L160 130 L160 84 L196 84" marker-end="url(#cl1)"/>
  <path class="dg-line" d="M190 80 L150 80 L150 34 L196 34" marker-end="url(#cl1)"/>
  <text class="dg-s" x="420" y="80">delegate UP first…</text>
  <path class="dg-line" d="M410 100 L410 132" marker-end="url(#cl1)"/>
  <text class="dg-s" x="420" y="140">…load only if the parent could not</text>
  <defs><marker id="cl1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Parent delegation exists for security.</strong> A class named <code>java.lang.String</code> on your classpath is never loaded, because the request goes to the bootstrap loader first and it always finds the real one. Without delegation, any jar could replace core classes.</p>
<table>
<tr><th>Phase</th><th>What happens</th></tr>
<tr><td><strong>Loading</strong></td><td>Find the bytes, create the <code>Class</code> object in metaspace</td></tr>
<tr><td><strong>Verification</strong></td><td>Check the bytecode is well-formed and type-safe — this is what makes the JVM memory-safe</td></tr>
<tr><td><strong>Preparation</strong></td><td>Allocate static fields and set them to <em>default</em> values (0, null, false)</td></tr>
<tr><td><strong>Resolution</strong></td><td>Replace symbolic references with direct ones — may be lazy</td></tr>
<tr><td><strong>Initialisation</strong></td><td>Run static initialisers and static field assignments, in source order</td></tr>
</table>
<pre><code>// Initialisation is LAZY and triggered by first active use
class Config {
    static { System.out.println("initialised"); }     // runs once, thread-safely
    static final int CONSTANT = 42;                    // compile-time constant
    static final int COMPUTED = compute();             // NOT a constant
}
Config.CONSTANT;   // does NOT trigger initialisation — inlined by the compiler
Config.COMPUTED;   // DOES trigger it
new Config();      // triggers it

// The JVM guarantees static initialisers run once and are thread-safe.
// That is the basis of the initialization-on-demand holder idiom:
class Singleton {
    private Singleton() {}
    private static class Holder { static final Singleton INSTANCE = new Singleton(); }
    public static Singleton getInstance() { return Holder.INSTANCE; }
}
// Lazy, thread-safe, no synchronization, no volatile. The classloader does it all.</code></pre>
<table>
<tr><th>Error</th><th>Cause</th></tr>
<tr><td><code>ClassNotFoundException</code></td><td>Checked — a reflective <code>Class.forName</code> could not find it</td></tr>
<tr><td><code>NoClassDefFoundError</code></td><td>Present at compile time, missing at runtime — <em>or</em> a class whose static initialiser threw earlier</td></tr>
<tr><td><code>ExceptionInInitializerError</code></td><td>A static initialiser threw. The <em>next</em> access gives <code>NoClassDefFoundError</code>, which hides the real cause — always look for this first in the log.</td></tr>
<tr><td><code>LinkageError</code> / <code>NoSuchMethodError</code></td><td>Compiled against one version, running against another</td></tr>
<tr><td><code>ClassCastException</code> on the same class name</td><td>Loaded by two different classloaders — class identity is (name + loader)</td></tr>
</table>
<p><strong>Where custom classloaders appear:</strong> application servers isolate each deployed app so two wars can use different library versions; OSGi and the module system do the same at finer granularity; and hot reload works by discarding a classloader and creating a new one. The classloader leak that causes <code>Metaspace</code> OOM after repeated redeploys is exactly this — one strong reference from outside keeps the old loader, and therefore every class it loaded, alive forever.</p>`
}
]);
