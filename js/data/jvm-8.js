registerPrimer("jvm", `<h3>The mental model: a loader, a few memory areas, and an engine</h3>
<p>The JVM is a program that runs your bytecode. It does three jobs. The <strong>class loader</strong> finds <code>.class</code> files and loads them when first used. The <strong>runtime memory areas</strong> hold class metadata, objects and per-thread stacks. The <strong>execution engine</strong> runs the bytecode: it interprets at first, compiles hot methods to machine code with the JIT, and runs the garbage collector to free objects that nothing points to anymore.</p>
<figure class="fig">
<svg viewBox="0 0 620 250" role="img" aria-label="JVM architecture: class loader, metaspace, heap with young and old generations, thread stacks, and the execution engine with interpreter, JIT and GC">
  <defs><marker id="pr-jvm" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="16" width="150" height="46" rx="8"/>
  <text class="dg-t" x="85" y="36" text-anchor="middle">Class loader</text>
  <text class="dg-s" x="85" y="52" text-anchor="middle">load, verify, link, init</text>
  <line class="dg-line" x1="85" y1="62" x2="85" y2="92" marker-end="url(#pr-jvm)"/>
  <rect class="dg-fill" x="10" y="94" width="150" height="56" rx="8"/>
  <text class="dg-t" x="85" y="116" text-anchor="middle">Metaspace</text>
  <text class="dg-s" x="85" y="132" text-anchor="middle">class metadata, methods</text>
  <text class="dg-s" x="85" y="144" text-anchor="middle">native memory, not heap</text>
  <rect class="dg-box" x="176" y="16" width="270" height="134" rx="10"/>
  <text class="dg-t" x="188" y="36">Heap (all threads share it)</text>
  <rect class="dg-fill2" x="188" y="48" width="118" height="92" rx="7"/>
  <text class="dg-t" x="247" y="68" text-anchor="middle">Young gen</text>
  <text class="dg-s" x="247" y="86" text-anchor="middle">Eden: new objects</text>
  <text class="dg-s" x="247" y="102" text-anchor="middle">Survivor S0 / S1</text>
  <text class="dg-s" x="247" y="126" text-anchor="middle">minor GC: fast, often</text>
  <line class="dg-line" x1="306" y1="94" x2="326" y2="94" marker-end="url(#pr-jvm)"/>
  <rect class="dg-fill" x="328" y="48" width="106" height="92" rx="7"/>
  <text class="dg-t" x="381" y="68" text-anchor="middle">Old gen</text>
  <text class="dg-s" x="381" y="86" text-anchor="middle">long-lived</text>
  <text class="dg-s" x="381" y="102" text-anchor="middle">objects</text>
  <text class="dg-s" x="381" y="126" text-anchor="middle">major GC: rarer</text>
  <text class="dg-s" x="316" y="86" text-anchor="middle">promote</text>
  <rect class="dg-box" x="462" y="16" width="148" height="134" rx="10"/>
  <text class="dg-t" x="474" y="36">Per thread</text>
  <rect class="dg-box" x="474" y="48" width="124" height="28" rx="5"/><text class="dg-s" x="536" y="66" text-anchor="middle">stack: frames, locals</text>
  <rect class="dg-box" x="474" y="82" width="124" height="28" rx="5"/><text class="dg-s" x="536" y="100" text-anchor="middle">PC register</text>
  <rect class="dg-box" x="474" y="116" width="124" height="28" rx="5"/><text class="dg-s" x="536" y="134" text-anchor="middle">native stack</text>
  <rect class="dg-box" x="10" y="176" width="600" height="60" rx="10"/>
  <text class="dg-t" x="22" y="196">Execution engine</text>
  <rect class="dg-fill" x="140" y="186" width="130" height="40" rx="7"/><text class="dg-t" x="205" y="210" text-anchor="middle">Interpreter</text>
  <line class="dg-line" x1="270" y1="206" x2="296" y2="206" marker-end="url(#pr-jvm)"/>
  <rect class="dg-fill2" x="298" y="186" width="150" height="40" rx="7"/><text class="dg-t" x="373" y="204" text-anchor="middle">JIT (C1, then C2)</text><text class="dg-s" x="373" y="219" text-anchor="middle">hot methods only</text>
  <rect class="dg-fill" x="464" y="186" width="134" height="40" rx="7"/><text class="dg-t" x="531" y="204" text-anchor="middle">Garbage collector</text><text class="dg-s" x="531" y="219" text-anchor="middle">G1 by default</text>
  <line class="dg-line" x1="310" y1="150" x2="310" y2="174" stroke-dasharray="3 3"/>
</svg>
<figcaption>Only the heap is garbage collected. Metaspace, thread stacks and JIT code live in native memory, outside -Xmx.</figcaption>
</figure>
<h3>Worked example: the life of one request's objects</h3>
<pre><code>@GetMapping("/orders/{id}")
OrderDto get(@PathVariable long id) {
    Order o = repo.findById(id).orElseThrow();   // Order + its fields: allocated
    return OrderDto.from(o);                      // in EDEN, very cheaply
}                                                 // (a pointer bump in the
                                                  // thread's own TLAB)

// 1. The response is sent. Nothing points at the Order or the DTO anymore.
// 2. Eden fills up after a few thousand requests -> MINOR GC.
//    The GC only copies LIVE objects out of Eden. Dead ones cost nothing:
//    their memory is simply reused. That is why short-lived garbage is cheap.
// 3. Objects that are still alive (a cache entry, a session) are copied to a
//    survivor space, and their age goes up by one each GC they survive.
// 4. After about 15 survivals (the tenuring threshold) they are PROMOTED to
//    the old generation, which is collected far less often.

// This is the "generational hypothesis": most objects die young. GC is
// designed around it, so code that makes lots of short-lived objects is
// fine, and code that keeps objects alive slightly too long is what hurts.</code></pre>
<h3>Which error comes from which area</h3>
<table>
<tr><th>Error</th><th>Area</th><th>Usual cause</th></tr>
<tr><td><code>OutOfMemoryError: Java heap space</code></td><td>Heap</td><td>A leak (a growing map or cache), or a heap too small for the load</td></tr>
<tr><td><code>OutOfMemoryError: Metaspace</code></td><td>Metaspace</td><td>Classes generated at runtime and never unloaded; redeploying in the same app server</td></tr>
<tr><td><code>StackOverflowError</code></td><td>Thread stack</td><td>Recursion with no base case, or very deep recursion</td></tr>
<tr><td><code>OutOfMemoryError: unable to create native thread</code></td><td>Native memory / OS</td><td>Too many platform threads, or an OS limit on processes</td></tr>
<tr><td>Container killed with exit code 137</td><td>All of it together</td><td>Heap + everything outside the heap exceeded the container limit</td></tr>
</table>`);

appendTopic("jvm", [
{
  q: "The container was OOMKilled but the heap was only half full. Where did the memory go?",
  level: "advanced", hot: true, tags: ["memory", "containers", "kubernetes", "production", "must-know"],
  companies: ["Amazon", "Walmart", "Uber", "Flipkart", "Microsoft", "Swiggy", "Atlassian"],
  a: `<p>This is one of the most common production surprises with Java on Kubernetes. The pod restarts with <strong>exit code 137</strong> (killed by the kernel for using too much memory), yet the heap graphs show plenty of room and there is no <code>OutOfMemoryError</code> in the logs. The reason: <strong>the heap is only part of a Java process's memory</strong>, and the container limit applies to all of it.</p>
<pre><code>Container limit: 2 GiB.   JVM flag: -Xmx1536m   ("leave 512 MB spare, that's plenty")

Where the memory really goes, for a typical Spring Boot service:

  Heap (-Xmx)                                1536 MB
  Metaspace (class metadata, Spring + libs)    150 MB
  Thread stacks: 200 threads x 1 MB            200 MB   (-Xss, reserved per thread)
  Code cache (JIT-compiled machine code)        50 MB
  GC's own data structures (G1)                 60 MB
  Direct buffers (Netty, NIO, Kafka client)    100 MB
  Other native (malloc arenas, JNI, zip)        60 MB
                                             --------
                                             ~2156 MB   &gt; 2048 MB -&gt; OOMKilled

The heap never filled up. Everything AROUND it pushed the process over.</code></pre>
<p><strong>How to find out instead of guessing:</strong> turn on Native Memory Tracking, which makes the JVM account for every area.</p>
<pre><code>java -XX:NativeMemoryTracking=summary -jar app.jar
jcmd &lt;pid&gt; VM.native_memory summary

Total: reserved=2412MB, committed=2089MB
-                 Java Heap (reserved=1536MB, committed=1536MB)
-                     Class (reserved=1090MB, committed=152MB)
-                    Thread (reserved=203MB, committed=203MB)    &lt;- 201 threads
-                      Code (reserved=240MB, committed=48MB)
-                        GC (reserved=97MB, committed=61MB)
-                     Other (reserved=102MB, committed=102MB)    &lt;- direct buffers
...
# Compare COMMITTED (actually in use) to the container limit, and take a
# second reading an hour later: the area that keeps growing is the leak.</code></pre>
<table>
<tr><th>Fix</th><th>Why</th></tr>
<tr><td><strong>Size the heap as a percentage:</strong> <code>-XX:MaxRAMPercentage=70</code> instead of a fixed <code>-Xmx</code></td><td>Keeps about 30% for non-heap and scales if someone changes the pod limit</td></tr>
<tr><td>Cap direct memory: <code>-XX:MaxDirectMemorySize=256m</code></td><td>Otherwise it can grow as large as the heap</td></tr>
<tr><td>Fewer platform threads, or virtual threads</td><td>Each platform thread reserves its whole stack; 500 threads is 500 MB before any work happens</td></tr>
<tr><td>Cap metaspace: <code>-XX:MaxMetaspaceSize=256m</code></td><td>Turns a slow native leak into a clear <code>OutOfMemoryError: Metaspace</code></td></tr>
<tr><td>Set the memory <strong>request equal to the limit</strong></td><td>The pod gets guaranteed memory and is not first in line when the node runs short</td></tr>
</table>
<pre><code># A sensible starting point for a 2 GiB pod
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:MaxMetaspaceSize=256m \\
                   -XX:MaxDirectMemorySize=256m -XX:+ExitOnOutOfMemoryError \\
                   -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps"
# ExitOnOutOfMemoryError: a JVM that has hit OOM is in an unknown state.
# Exit, let Kubernetes restart it cleanly, and keep the heap dump.</code></pre>
<p><strong>The distinction to state clearly:</strong> <code>OutOfMemoryError</code> is the <em>JVM</em> saying the heap (or metaspace) is full, and you get a stack trace. Exit code 137 is the <em>kernel</em> killing the process from outside, and you get nothing in the logs. Different problems, different fixes.</p>`
},
{
  q: "Why did adding one more implementation slow down a hot method? Explain inlining and megamorphic calls",
  level: "advanced", tags: ["jit", "inlining", "performance", "polymorphism"],
  companies: ["Goldman Sachs", "Morgan Stanley", "Google", "Amazon", "Oracle", "LinkedIn"],
  a: `<p>This is a real performance mystery that experienced Java developers hit: code gets measurably slower after a change that looks harmless, like adding a third implementation of an interface. The explanation is how the JIT makes interface calls fast.</p>
<p><strong>Inlining is the JIT's most important trick.</strong> Instead of calling a small method, it copies the method's body into the caller. That removes the call overhead, but more importantly it lets the JIT optimise the caller and callee <em>together</em>: removing checks, keeping values in registers, even avoiding allocations. But it can only inline if it knows <strong>which</strong> method will run.</p>
<pre><code>interface Shape { double area(); }

double total(List&lt;Shape&gt; shapes) {
    double sum = 0;
    for (Shape s : shapes) sum += s.area();    // a virtual call: which area()?
    return sum;
}</code></pre>
<p>The JIT watches this call site while the code is still being interpreted and records which classes actually show up:</p>
<table>
<tr><th>Classes seen at the call site</th><th>Name</th><th>What the JIT does</th></tr>
<tr><td>1</td><td><strong>Monomorphic</strong></td><td>Inlines <code>Circle.area()</code> directly, guarded by one cheap type check</td></tr>
<tr><td>2</td><td><strong>Bimorphic</strong></td><td>Inlines both, with an if/else on the type</td></tr>
<tr><td>3 or more</td><td><strong>Megamorphic</strong></td><td>Gives up on inlining. Falls back to a real virtual call through the method table, every time</td></tr>
</table>
<pre><code>// Benchmark shape (JMH), same total work in each case:
//   list of only Circles                     ~1.0 ns per element
//   Circles and Squares                      ~1.2 ns per element
//   Circles, Squares and Triangles           ~3.0 ns per element  &lt;- the cliff
// Illustrative numbers: the size of the jump varies by CPU and JDK, but the
// cliff between two and three types is the consistent part.</code></pre>
<p>The cost is not the virtual call itself, which is only a few nanoseconds. It is everything that inlining would have unlocked and now cannot: the loop can no longer be unrolled or vectorised, and objects that escape into the call can no longer be eliminated by escape analysis.</p>
<p><strong>What to do about it, if a profiler shows it matters:</strong></p>
<pre><code>// Option 1: keep hot call sites monomorphic by splitting the data by type
double total = circles.stream().mapToDouble(Circle::area).sum()
             + squares.stream().mapToDouble(Square::area).sum();

// Option 2: a switch over a sealed type. Each branch is a direct,
// inlinable call instead of one megamorphic virtual call.
sealed interface Shape permits Circle, Square, Triangle {}
double area(Shape s) {
    return switch (s) {
        case Circle c   -&gt; Math.PI * c.r() * c.r();
        case Square q   -&gt; q.side() * q.side();
        case Triangle t -&gt; 0.5 * t.base() * t.height();
    };
}</code></pre>
<pre><code># Seeing it happen: print what the JIT decided to inline
java -XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining -jar app.jar
#   @ 12  Circle::area (10 bytes)   inline (hot)
#   @ 12  Shape::area               not inlineable: megamorphic call site</code></pre>
<p><strong>The honest caveat to add:</strong> this matters in tight loops that run millions of times: parsers, pricing engines, serialisers. In a normal web service the database call is thousands of times slower than any of this. "Measure first with a profiler, and only then restructure for inlining" is the answer interviewers want to hear.</p>`
}
]);
