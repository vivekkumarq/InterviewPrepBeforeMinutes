appendTopic("docker", [
{
  q: "What is the difference between COPY and ADD, and ARG and ENV?",
  level: "beginner", tags: ["dockerfile"],
  a: `<table>
<tr><th></th><th><code>COPY</code></th><th><code>ADD</code></th></tr>
<tr><td>Copies local files</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Auto-extracts local tar archives</td><td>No</td><td><strong>Yes</strong></td></tr>
<tr><td>Fetches remote URLs</td><td>No</td><td>Yes (but does not cache well)</td></tr>
<tr><td>Recommended</td><td><strong>Always prefer this</strong></td><td>Only for extracting a local tarball</td></tr>
</table>
<p><code>ADD</code>'s implicit behaviour is the problem — a file that happens to be a tarball is silently extracted, which is surprising and occasionally a security issue. Use <code>COPY</code>, and <code>curl</code> in a <code>RUN</code> when you need a remote file (so you can verify a checksum in the same layer).</p>
<pre><code>ARG JAVA_VERSION=21              # BUILD time only — not present in the running container
ENV APP_HOME=/app                # BUILD and RUNTIME — persists in the image

FROM eclipse-temurin:\${JAVA_VERSION}-jre-alpine
ARG GIT_SHA                       # passed with --build-arg GIT_SHA=abc123
LABEL org.opencontainers.image.revision=\${GIT_SHA}
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0"</code></pre>
<p><strong>The security point that matters:</strong> <strong>neither <code>ARG</code> nor <code>ENV</code> is safe for secrets.</strong> Both are recorded in the image history and visible via <code>docker history</code> — even if you delete the value in a later layer. Use BuildKit secret mounts instead:</p>
<pre><code># syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc \\
    npm ci --userconfig /run/secrets/npmrc
# docker build --secret id=npmrc,src=$HOME/.npmrc .
# The secret is available during that RUN only and never enters a layer.</code></pre>
<p>Another useful distinction: <code>ARG</code> declared before the first <code>FROM</code> is global and usable in <code>FROM</code> lines; declared after, it is scoped to that build stage and must be redeclared in each stage that needs it.</p>`
},
{
  q: "How do you reduce Docker image size in practice?",
  level: "advanced", hot: true, tags: ["optimisation"],
  a: `<ol>
<li><strong>Multi-stage builds</strong> — the single biggest win. Build tools, source and caches never reach the runtime image.</li>
<li><strong>Choose a smaller base:</strong>
<pre><code>eclipse-temurin:21          ~450 MB   (full JDK on Ubuntu)
eclipse-temurin:21-jre      ~270 MB   (JRE only)
eclipse-temurin:21-jre-alpine ~180 MB (musl libc)
gcr.io/distroless/java21    ~230 MB   (no shell, no package manager — smallest attack surface)
custom jlink runtime        ~90 MB    (only the JDK modules you actually use)</code></pre></li>
<li><strong>Combine <code>RUN</code> commands</strong> so cleanup happens in the <em>same</em> layer — deleting a file in a later layer does not shrink the image:
<pre><code>RUN apt-get update &amp;&amp; apt-get install -y --no-install-recommends curl \\
 &amp;&amp; rm -rf /var/lib/apt/lists/*</code></pre></li>
<li><strong>A thorough <code>.dockerignore</code></strong> — keeps <code>target/</code>, <code>.git/</code>, <code>node_modules/</code> and test fixtures out of the build context entirely.</li>
<li><strong><code>jlink</code> a custom runtime</strong> containing only the modules your application needs:
<pre><code>RUN jlink --add-modules $(jdeps --print-module-deps app.jar) \\
          --strip-debug --no-man-pages --no-header-files --compress=2 \\
          --output /javaruntime</code></pre></li>
<li><strong>Spring Boot layered jars</strong> — dependencies, loader and application classes in separate layers, so a code change re-pushes only a few megabytes rather than the whole fat jar.</li>
<li><strong>GraalVM native image</strong> — a ~60–100 MB image with no JVM at all, if the trade-offs suit you.</li>
</ol>
<p><strong>Why size matters beyond aesthetics:</strong> pull time directly affects autoscaling responsiveness and rolling-deploy speed across every node; registry storage and cross-region egress cost real money; and — most importantly — <strong>fewer packages means fewer CVEs</strong>. A distroless image has no shell, no package manager and no curl, so a great many exploit techniques simply have nothing to work with.</p>
<p>Measure with <code>docker history</code> to see which layer is large, or <strong>dive</strong> for a per-layer breakdown of what actually landed in the image.</p>`
},
{
  q: "How do you debug a running container's networking and DNS?",
  level: "advanced", tags: ["networking", "debugging"],
  a: `<pre><code># What networks exist and who is on them
docker network ls
docker network inspect app-net          # shows connected containers and their IPs
docker inspect -f '{{json .NetworkSettings.Networks}}' api | jq

# Get a shell — but distroless/slim images have no shell or tools
docker exec -it api sh
# Attach a debug container that SHARES the target's network namespace instead
docker run -it --rm --network container:api nicolaka/netshoot
# Kubernetes equivalent:
kubectl debug -it api-pod --image=nicolaka/netshoot --target=app

# Then diagnose from inside that namespace
nslookup postgres                       # does the service name resolve?
nc -zv postgres 5432                    # can we reach the port?
curl -v http://payment-service:8080/actuator/health
ss -tulpn                               # what is listening, on which interface?
tcpdump -i any port 5432 -A</code></pre>
<p><strong>The three causes behind most container networking problems:</strong></p>
<ol>
<li><strong>Wrong network.</strong> Containers on the <em>default</em> bridge get no DNS resolution by name — only a user-defined network provides it. This is why <code>docker-compose</code> "just works": it creates one for you.</li>
<li><strong><code>localhost</code> means the container itself.</strong> An application configured with <code>jdbc:postgresql://localhost:5432</code> inside a container is looking for a database in its own network namespace. Use the service name (<code>postgres</code>), or <code>host.docker.internal</code> to reach the host.</li>
<li><strong>Binding to <code>127.0.0.1</code> instead of <code>0.0.0.0</code>.</strong> A process listening only on loopback is unreachable from outside the container, even with the port published. <code>ss -tulpn</code> shows this immediately.</li>
</ol>
<p><strong>The <code>--network container:&lt;name&gt;</code> trick is worth knowing</strong> — it puts a fully-equipped debug container inside the target's network namespace, so you can run <code>tcpdump</code>, <code>dig</code> and <code>curl</code> against a distroless production image that has none of those tools.</p>`
},
{
  q: "What are container resource limits and how do they interact with the JVM?",
  level: "advanced", hot: true, tags: ["resources", "jvm"],
  a: `<pre><code>docker run --memory=1g --memory-swap=1g --cpus=2 --pids-limit=200 myapp

# What the container actually sees (cgroups v2)
cat /sys/fs/cgroup/memory.max
cat /sys/fs/cgroup/cpu.max
docker stats                       # live usage</code></pre>
<p><strong>How the JVM behaves:</strong> since 8u191 the JVM is container-aware — <code>UseContainerSupport</code> is on by default, so it reads the cgroup limit rather than the host's total memory. Before that, a 512 MB container would set a multi-gigabyte heap and get OOM-killed with no Java error at all.</p>
<pre><code># Correct configuration — percentage-based so one image works at any limit
-XX:MaxRAMPercentage=75.0
-XX:MaxMetaspaceSize=256m
-XX:+ExitOnOutOfMemoryError

# Verify what the JVM believes
java -XX:+PrintFlagsFinal -version | grep -Ei 'maxheapsize|activeprocessorcount'</code></pre>
<p><strong>Two interactions that cause real incidents:</strong></p>
<ol>
<li><strong>Memory:</strong> the heap is not the whole footprint. Metaspace, thread stacks (~1 MB each), the code cache, GC structures and direct byte buffers all live outside it. Setting <code>-Xmx</code> equal to the container limit guarantees an eventual OOM kill — <strong>exit code 137</strong>, no stack trace, and confusing because the heap looked healthy. Leave ~25% headroom and use Native Memory Tracking when it still happens.</li>
<li><strong>CPU:</strong> <code>--cpus=1.5</code> sets a cgroup quota. The JVM derives <code>availableProcessors()</code> from it, which sizes the GC threads, the common ForkJoinPool and connection pools. A fractional CPU limit can leave the JVM believing it has one core, serialising GC. Worse, hitting the quota causes <strong>throttling</strong> — the process is paused until the next period, which appears as unexplained p99 latency spikes even though average CPU looks low.</li>
</ol>
<p><strong>The recommendation:</strong> set memory request equal to limit for predictability, and be cautious with CPU limits — in Kubernetes many teams set a CPU <em>request</em> but no limit, so bursts can use spare capacity instead of being throttled. Monitor <code>container_cpu_cfs_throttled_seconds_total</code>; if it is non-zero, throttling is hurting you.</p>`
},
{
  q: "How do you handle logging and signals in containers?",
  level: "advanced", tags: ["production", "operations"],
  a: `<p><strong>Logging: write to stdout/stderr, never to files.</strong> The container runtime captures those streams and forwards them to a driver, which is what makes centralised logging work.</p>
<pre><code># Do not write app.log inside the container — nobody can read it and it fills the disk
docker run --log-driver=json-file --log-opt max-size=50m --log-opt max-file=3 myapp
docker logs -f --tail 100 api</code></pre>
<pre><code>&lt;!-- logback-spring.xml: console only, structured JSON in production --&gt;
&lt;springProfile name="prod"&gt;
  &lt;appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender"&gt;
    &lt;encoder class="net.logstash.logback.encoder.LogstashEncoder"/&gt;
  &lt;/appender&gt;
&lt;/springProfile&gt;</code></pre>
<p><strong>Signals: PID 1 must handle SIGTERM.</strong> This is where graceful shutdown breaks silently.</p>
<pre><code>ENTRYPOINT ["java", "-jar", "app.jar"]     ✔ exec form — java IS PID 1, receives SIGTERM
ENTRYPOINT java -jar app.jar               ✘ shell form — /bin/sh is PID 1 and does NOT
                                             forward signals; the JVM never shuts down
                                             gracefully and is SIGKILLed after the grace period</code></pre>
<p><strong>The shutdown sequence:</strong> Docker or Kubernetes sends <code>SIGTERM</code>, waits <code>terminationGracePeriodSeconds</code> (default 30), then sends <code>SIGKILL</code>. Your application must use that window to stop accepting new work and finish in-flight requests.</p>
<pre><code>server.shutdown: graceful
spring.lifecycle.timeout-per-shutdown-phase: 25s     # shorter than the grace period</code></pre>
<p><strong>Two more points worth raising:</strong> if your entrypoint is a shell script, use <code>exec java -jar app.jar</code> as the last line so the JVM <em>replaces</em> the shell and inherits PID 1. And a process running as PID 1 does not reap zombie children — use <code>--init</code> (or <code>tini</code>) if your container spawns subprocesses, otherwise the process table slowly fills.</p>`
},
{
  q: "What are Docker build caching strategies for CI?",
  level: "advanced", tags: ["cicd", "performance"],
  a: `<p>In CI every build starts on a fresh runner with no local layer cache, so a naive setup re-downloads every dependency every time. BuildKit solves this in two ways.</p>
<pre><code># 1. Registry-backed layer cache — share layers between CI runs
docker buildx build \\
  --cache-from type=registry,ref=ghcr.io/acme/api:buildcache \\
  --cache-to   type=registry,ref=ghcr.io/acme/api:buildcache,mode=max \\
  -t ghcr.io/acme/api:$GIT_SHA --push .

# GitHub Actions has a native backend
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max</code></pre>
<pre><code># 2. Cache MOUNTS — persist a dependency cache across builds without baking it into a layer
# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests -B</code></pre>
<p><strong>Why cache mounts are better than the old trick:</strong> the classic approach copies <code>pom.xml</code> first so the dependency layer caches — that still works, but any change to <code>pom.xml</code> invalidates the entire download. A cache mount keeps the <code>~/.m2</code> directory across builds, so adding one dependency downloads one dependency. The cache is also not part of the final image, so it does not bloat it.</p>
<p><strong>Other CI-specific practices:</strong></p>
<ul>
<li><code>mode=max</code> caches intermediate stages too, not just the final one — important with multi-stage builds.</li>
<li>Pin base images by digest so a mutated tag cannot silently invalidate the cache or change what you ship.</li>
<li>Order instructions strictly by change frequency; a single misplaced <code>COPY . .</code> defeats every optimisation below it.</li>
<li>Use <code>docker buildx build --platform linux/amd64,linux/arm64</code> when developers are on Apple Silicon and production is x86, and cache each platform separately.</li>
</ul>
<p>The measurable outcome is what matters: a cold build of a Spring Boot service is often 4–6 minutes, and a warm one with these techniques is under a minute.</p>`
}
]);
