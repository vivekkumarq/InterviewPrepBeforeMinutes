appendTopic("java-versions", [
{
  q: "How do you pick a JDK distribution, and does it matter?",
  level: "beginner", tags: ["versions", "lts", "production"],
  companies: ["Amazon", "Optum", "SAP", "TCS", "Infosys", "Maersk", "Oracle"],
  a: `<p>All mainstream distributions build from the same OpenJDK source and pass the same TCK, so the <em>bytecode behaviour</em> is identical. What differs is licensing, the support window, and a few extras.</p>
<table>
<tr><th>Distribution</th><th>By</th><th>Worth knowing</th></tr>
<tr><td><strong>Eclipse Temurin</strong></td><td>Adoptium</td><td>The common default — free, no strings, long LTS support</td></tr>
<tr><td><strong>Amazon Corretto</strong></td><td>AWS</td><td>Free, long support, tuned for and supported on AWS</td></tr>
<tr><td>Azul Zulu</td><td>Azul</td><td>Free builds plus a commercial tier; widest platform coverage</td></tr>
<tr><td>Microsoft Build of OpenJDK</td><td>Microsoft</td><td>Free; the default on Azure</td></tr>
<tr><td>Red Hat / IBM Semeru</td><td>Red Hat / IBM</td><td>Tied to RHEL subscriptions; Semeru uses the OpenJ9 VM</td></tr>
<tr><td>Oracle JDK</td><td>Oracle</td><td><strong>Check the licence.</strong> Terms have changed repeatedly — this is the one that has caused audit surprises.</td></tr>
<tr><td>GraalVM</td><td>Oracle</td><td>Adds <strong>native-image</strong> AOT compilation</td></tr>
</table>
<pre><code># The distribution shows up in the version banner
java -version
# openjdk version "21.0.4" 2024-07-16 LTS
# OpenJDK Runtime Environment Temurin-21.0.4+7 (build 21.0.4+7-LTS)

# In a Dockerfile, pin the distribution AND the version:
FROM eclipse-temurin:21.0.4_7-jre-jammy
# not  FROM openjdk:21   (that image is deprecated and unpinned)</code></pre>
<p><strong>The one genuine behavioural difference:</strong> IBM Semeru uses the <strong>OpenJ9</strong> VM rather than HotSpot. It typically starts faster and uses less memory, but has different GC implementations and different tuning flags — so your <code>-XX:</code> flags may not apply. Everything else in the table is HotSpot.</p>
<p><strong>GraalVM native-image, briefly:</strong> compiles ahead of time to a native binary. Startup drops from seconds to milliseconds and memory falls sharply, which suits serverless and CLI tools. The cost is a long build, and that reflection, dynamic proxies and resource loading must be declared at build time — which is exactly what Spring Boot's AOT processing generates for you.</p>
<p><strong>What to say:</strong> "For most teams it does not matter — I default to Temurin, or Corretto if we are on AWS, and pin the exact version in the image. The one thing I do check is the licence on Oracle JDK, because that is where organisations have been caught out."</p>`
},
{
  q: "What is GraalVM native-image, and when is it worth the trade-offs?",
  level: "advanced", tags: ["versions", "performance", "cloud"],
  companies: ["Amazon", "SAP", "Optum", "Oracle", "EPAM", "Flipkart", "Maersk"],
  a: `<table>
<tr><th></th><th>JVM</th><th>Native image</th></tr>
<tr><td>Startup</td><td>Seconds</td><td><strong>Milliseconds</strong></td></tr>
<tr><td>Memory</td><td>Higher — heap + metaspace + JIT</td><td>Often a fraction of it</td></tr>
<tr><td>Peak throughput</td><td><strong>Higher</strong> — the JIT optimises from real profiles</td><td>Lower — no runtime profiling</td></tr>
<tr><td>Build time</td><td>Seconds</td><td><strong>Minutes</strong></td></tr>
<tr><td>Reflection / proxies</td><td>Free</td><td>Must be declared at build time</td></tr>
<tr><td>Observability</td><td>Full: JFR, agents, heap dumps</td><td>Limited</td></tr>
</table>
<pre><code># Spring Boot generates the reachability metadata for you
./mvnw -Pnative native:compile
./target/my-app                     # a single binary, no JVM needed

# Or a container without installing GraalVM locally
./mvnw -Pnative spring-boot:build-image</code></pre>
<p><strong>Why the constraints exist:</strong> native-image performs <strong>closed-world analysis</strong> — it must see every reachable class at build time so it can discard the rest. Anything resolved by a string at runtime is invisible to it:</p>
<pre><code>Class.forName(config.get("handler"));    // ✗ invisible to the analyser
// Fix: reachability metadata
// META-INF/native-image/reflect-config.json
[ { "name": "com.app.OrderHandler", "allDeclaredConstructors": true } ]
// Spring, Quarkus and Micronaut generate this during their AOT step —
// which is why the frameworks moved so much work from runtime to build time.</code></pre>
<table>
<tr><th>Worth it for</th><th>Not worth it for</th></tr>
<tr><td>Serverless — cold start <em>is</em> the latency</td><td>A long-running service where peak throughput matters</td></tr>
<tr><td>CLI tools</td><td>Anything leaning on heavy reflection or agents</td></tr>
<tr><td>Scale-to-zero workloads (KEDA)</td><td>Teams that need JFR, profilers and heap dumps in production</td></tr>
<tr><td>Very high pod density</td><td>Fast CI feedback — build times hurt</td></tr>
</table>
<p><strong>The alternative worth naming:</strong> on Java 24+, <strong>AOT class loading and linking</strong> (Project Leyden) cuts JVM startup substantially without giving up the JIT, dynamic reflection or observability. For many services that is a better trade than a full native image — you get much of the startup win and keep everything else.</p>
<p><strong>Say this:</strong> "I would reach for native-image where cold start is the actual product constraint — a Lambda, or a scale-to-zero worker. For a service that runs for days, the JIT eventually beats it on throughput, and I would rather keep the diagnostics."</p>`
}
]);
