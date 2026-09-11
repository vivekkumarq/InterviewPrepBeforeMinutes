appendTopic("jvm", [
{
  q: "How does the JIT compiler work, and what is tiered compilation?",
  level: "advanced", hot: true, tags: ["jit", "performance", "internals"],
  companies: ["Amazon", "Oracle", "Goldman Sachs", "SAP", "Morgan Stanley", "Flipkart"],
  a: `<p>Java starts <strong>interpreted</strong> and gets faster as it runs. The JIT watches which methods are hot and compiles those to native code, using the profile it has gathered — which is why a JVM can beat ahead-of-time compilation at steady state.</p>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Tiered compilation from interpreter through C1 to C2">
  <rect class="dg-box" x="16" y="52" width="120" height="40" rx="8"/>
  <text class="dg-s" x="76" y="70" text-anchor="middle">interpreter</text><text class="dg-s" x="76" y="86" text-anchor="middle">tier 0 · slow</text>
  <path class="dg-line" d="M140 72 H186" marker-end="url(#jt1)"/>
  <rect class="dg-fill" x="190" y="52" width="130" height="40" rx="8"/>
  <text class="dg-s" x="255" y="70" text-anchor="middle">C1</text><text class="dg-s" x="255" y="86" text-anchor="middle">tiers 1-3 · fast build</text>
  <path class="dg-line" d="M324 72 H370" marker-end="url(#jt1)"/>
  <rect class="dg-fill2" x="374" y="52" width="130" height="40" rx="8"/>
  <text class="dg-s" x="439" y="70" text-anchor="middle">C2</text><text class="dg-s" x="439" y="86" text-anchor="middle">tier 4 · fast code</text>
  <path class="dg-line" d="M439 96 Q300 138 76 96" marker-end="url(#jt1)" stroke-dasharray="4 3"/>
  <text class="dg-s" x="260" y="130" text-anchor="middle">DEOPTIMISATION — an assumption was invalidated</text>
  <text class="dg-s" x="16" y="30">C1 compiles quickly with light optimisation; C2 compiles slowly with aggressive optimisation</text>
  <defs><marker id="jt1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Optimisation</th><th>What it does</th></tr>
<tr><td><strong>Inlining</strong></td><td>Pastes a small method's body into the caller — the enabling optimisation for all the others</td></tr>
<tr><td>Escape analysis</td><td>An object that never leaves the method may be scalar-replaced and never allocated at all</td></tr>
<tr><td>Loop unrolling, vectorisation</td><td>Fewer branches; SIMD where possible</td></tr>
<tr><td>Dead code elimination</td><td>Removes work whose result is unused — which is why naive benchmarks measure nothing</td></tr>
<tr><td>Lock elision / coarsening</td><td>Drops locks on provably thread-local objects</td></tr>
<tr><td><strong>Speculative</strong> optimisation</td><td>Assumes the branch or type seen so far, with a guard that deoptimises if it is wrong</td></tr>
</table>
<pre><code># Watch it happen
-XX:+PrintCompilation
-XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining

# Common misreadings this explains:
# - "The first 1000 requests are slow"  -> warm-up, not a leak
# - "It got slower after an hour"       -> deoptimisation; a new type appeared
#                                          at a call site the JIT had assumed
#                                          was monomorphic
# - "My microbenchmark says 0 ns"       -> dead code elimination. Use JMH.</code></pre>
<p><strong>The practical consequences to name:</strong> benchmark <em>after</em> warm-up or the numbers are meaningless; keep hot methods small so they stay inlinable (the default limit is a few hundred bytecodes); and megamorphic call sites — the same interface call reaching many implementations — block inlining and cost real throughput.</p>
<p><strong>Modern additions:</strong> Class Data Sharing (<code>-XX:SharedArchiveFile</code>) memory-maps preparsed class metadata to cut startup, and on Java 24+ AOT class loading and linking pushes more of that work to build time. Both attack warm-up without giving up the JIT.</p>`
},
{
  q: "How do you profile a JVM application and find the actual bottleneck?",
  level: "advanced", tags: ["profiling", "performance", "production", "debugging"],
  companies: ["Amazon", "Goldman Sachs", "Flipkart", "Optum", "SAP", "Walmart", "Barclays"],
  a: `<pre><code># 1. JFR — always available, low overhead, safe in production
java -XX:StartFlightRecording=duration=60s,filename=rec.jfr,settings=profile -jar app.jar
jcmd &lt;pid&gt; JFR.start name=rec settings=profile duration=120s filename=/tmp/rec.jfr
jcmd &lt;pid&gt; JFR.dump name=rec filename=/tmp/rec.jfr
# Open in JDK Mission Control: hot methods, allocation sites, lock contention,
# GC pauses, IO — all correlated on one timeline.

# 2. async-profiler — the best flame graphs, and it avoids the safepoint bias
#    that makes older sampling profilers blame the wrong method
./profiler.sh -d 60 -f flame.html &lt;pid&gt;
./profiler.sh -e alloc -d 60 -f alloc.html &lt;pid&gt;    # allocation profiling
./profiler.sh -e lock  -d 60 -f lock.html  &lt;pid&gt;    # contention</code></pre>
<table>
<tr><th>Symptom</th><th>Look at</th></tr>
<tr><td>High CPU</td><td>CPU flame graph — one method usually dominates</td></tr>
<tr><td>High latency, low CPU</td><td><strong>Blocking</strong>: locks, IO, pool waits. CPU profiling shows nothing.</td></tr>
<tr><td>Latency spikes</td><td>GC log first, then JFR pause events</td></tr>
<tr><td>Memory climbing</td><td>Heap dump + dominator tree in Eclipse MAT</td></tr>
<tr><td>Throughput fell after a deploy</td><td>Allocation profile — a new allocation in a hot path</td></tr>
<tr><td>Everything is slow at startup</td><td>JIT warm-up, or class loading — check <code>-Xlog:class+load</code></td></tr>
</table>
<pre><code># The measurement discipline that matters more than the tool
# 1. Measure BEFORE changing anything, and write the number down.
# 2. Profile in an environment shaped like production — data volume,
#    concurrency and heap size all change which method is hot.
# 3. Change ONE thing.
# 4. Measure again with the same method.
#
# For microbenchmarks use JMH, never a loop with System.nanoTime():
@Benchmark public void measure(Blackhole bh) { bh.consume(work()); }
# JMH handles warm-up, forking, and consuming results so the JIT cannot
# delete the code you are trying to measure.</code></pre>
<p><strong>The counter-intuitive one to name:</strong> a CPU profiler is silent on the most common production problem. If threads are <em>blocked</em> on a database, a lock or an exhausted connection pool, CPU is near zero and the flame graph shows nothing interesting. That is why I start from JFR or a thread dump, which show blocked states, rather than from a CPU flame graph.</p>
<p><strong>And the cheapest tool of all:</strong> three thread dumps ten seconds apart (<code>jcmd &lt;pid&gt; Thread.print</code>). If the same stack appears in all three, that is your bottleneck — no profiler required.</p>`
}
]);
