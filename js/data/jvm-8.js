registerPrimer("jvm", `<p class="pr-lead">The <b>JVM</b> (Java Virtual Machine) is the program that runs your compiled Java code. It loads your classes, gives your program memory, runs the code (and speeds it up as it goes), and cleans up memory you no longer use. Knowing how it does these jobs helps you understand slow programs, memory errors and crashes.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of the JVM as a restaurant. The <b>class loader</b> is the person who fetches recipes from the cupboard when they are first needed. The <b>memory areas</b> are the kitchen counters and shelves where ingredients are kept. The <b>execution engine</b> is the chef who cooks, getting faster at dishes they make often. The <b>garbage collector</b> is the cleaner who clears away plates nobody is using any more.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Heap</dt><dd>The big shared memory area where all objects live. This is the part the garbage collector cleans.</dd>
<dt>Stack</dt><dd>A small memory area for each thread, holding the local variables of the methods it is running.</dd>
<dt>Metaspace</dt><dd>Memory for information about your classes (their methods and fields), kept outside the heap.</dd>
<dt>Garbage collection (GC)</dt><dd>The JVM automatically finding objects that nothing uses any more and freeing their memory.</dd>
<dt>Young and old generation</dt><dd>The heap is split in two. New objects start in the young part; objects that stay in use for a long time move to the old part.</dd>
<dt>JIT compiler</dt><dd>"Just-in-time" compiler. It turns frequently used code into fast machine code while the program runs.</dd>
<dt>-Xmx</dt><dd>The setting for the maximum heap size, for example <code>-Xmx2g</code> for 2 GB.</dd>
</dl>

<h3>Step by step: what happens when your program runs</h3>
<ol class="pr-steps">
<li><b>Loading:</b> the first time your code uses a class, the class loader finds its <code>.class</code> file and loads it into memory.</li>
<li><b>Checking:</b> the JVM verifies the bytecode is safe before running it.</li>
<li><b>Running:</b> at first the JVM interprets the bytecode instruction by instruction, which starts quickly.</li>
<li><b>Speeding up:</b> code that runs often ("hot" code) is compiled by the JIT into native machine code, so the program gets faster the longer it runs.</li>
<li><b>Cleaning up:</b> while the program runs, the garbage collector regularly frees objects that are no longer reachable.</li>
</ol>
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

<h3>A worked example: the life of one web request's objects</h3>
<pre><code>@GetMapping("/orders/{id}")
OrderDto get(@PathVariable long id) {
    Order o = repo.findById(id).orElseThrow();   // new objects created
    return OrderDto.from(o);                      // response sent, done
}</code></pre>
<ol class="pr-steps">
<li>Each request creates a few new objects (the Order and the response object). They are placed in the young part of the heap, which is very fast.</li>
<li>Once the response is sent, nothing points to those objects any more. They are garbage, but nothing happens to them yet.</li>
<li>After a few thousand requests, the young area fills up and a quick <b>minor GC</b> runs. It copies only the few objects still in use somewhere safe. The garbage is not touched at all; its space is simply reused. That is why short-lived objects are almost free.</li>
<li>Objects that keep surviving (like entries in a cache) are eventually moved to the old area, which is cleaned much less often.</li>
</ol>
<p>This design is based on a simple observation called the <b>generational hypothesis</b>: most objects die young. So creating lots of short-lived objects is fine. What causes trouble is keeping objects alive longer than needed.</p>

<h3>Common problems and what they mean</h3>
<div class="pr-mistake">
<p class="pm-what">❌ OutOfMemoryError: Java heap space</p>
<p>The heap is full. Either the program keeps adding to something that never gets cleared (a memory leak, such as a map used as a cache with no limit), or the heap is simply too small for the work.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> take a heap dump and look at what is filling memory. Fix the leak, or give the JVM a bigger heap if the load really needs it.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ StackOverflowError</p>
<p>One thread's stack ran out of space, almost always because a method keeps calling itself (recursion) without ever stopping.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> check that the recursion has a stopping condition, or rewrite it as a loop.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ The container is killed even though the heap looks fine</p>
<p>The heap is only part of a Java program's memory. Thread stacks, Metaspace and other native memory also count. In Docker or Kubernetes, if all of it together goes over the container's limit, the system kills the program without any Java error message.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> leave room outside the heap, for example with <code>-XX:MaxRAMPercentage=70</code> instead of a fixed <code>-Xmx</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Calling System.gc() to "free memory"</p>
<p>Asking for a full garbage collection by hand usually makes things slower, because it pauses the program, and the JVM already knows when to clean up.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> let the garbage collector do its job, and fix the code that keeps objects alive.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>The JVM loads classes, runs code, speeds it up with the JIT, and cleans memory with GC.</li>
<li>Objects live on the heap; method variables live on each thread's stack.</li>
<li>Most objects die young, so short-lived objects are cheap.</li>
<li>A Java "memory leak" means objects stay reachable when they should not.</li>
<li>In containers, leave memory for things outside the heap.</li>
</ul>
<p><b>Next:</b> the questions below cover garbage collectors, memory errors, tuning and diagnosing slow programs.</p>`);

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
