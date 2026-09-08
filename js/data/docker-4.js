appendTopic("docker", [
{
  q: "Your Docker image is 1.2 GB — how do you shrink it?",
  level: "advanced", hot: true, tags: ["dockerfile", "performance"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "EPAM", "Nagarro"],
  a: `<pre><code># BEFORE — 1.2 GB, rebuilds everything on every code change
FROM openjdk:17
COPY . /app
WORKDIR /app
RUN ./mvnw package
CMD ["java","-jar","target/app.jar"]

# AFTER — ~230 MB, and code changes rebuild only the last layer
# ---- build stage: the JDK and Maven cache never reach the final image
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -B dependency:go-offline        # cached until pom.xml changes
COPY src src
RUN ./mvnw -B -DskipTests package

# ---- runtime stage: JRE only, no compiler, no build tools, no source
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
USER app                                    # never run as root
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]</code></pre>
<table>
<tr><th>Change</th><th>Saving</th></tr>
<tr><td>Multi-stage — drop JDK, Maven, ~/.m2, source</td><td>~700 MB</td></tr>
<tr><td><code>jre</code> instead of <code>jdk</code></td><td>~180 MB</td></tr>
<tr><td>Alpine (or <code>-jammy</code> slim) base</td><td>~100 MB</td></tr>
<tr><td><code>.dockerignore</code> — target/, .git, node_modules</td><td>Build context, so faster uploads too</td></tr>
<tr><td>Spring Boot layered jar (<code>layertools extract</code>)</td><td>Dependencies cached separately from your code</td></tr>
</table>
<p><strong>The layer-ordering principle</strong> is worth more than the size saving: each instruction is a cache layer, and changing one invalidates every layer after it. Copy the dependency manifest and resolve dependencies <em>before</em> copying source, so a one-line code change does not re-download the world.</p>
<pre><code># Squashing layers does NOT work — the deleted file lives in the earlier layer
RUN wget huge.tar.gz &amp;&amp; tar xf huge.tar.gz &amp;&amp; rm huge.tar.gz   # ONE RUN = one layer ✔
RUN wget huge.tar.gz
RUN rm huge.tar.gz                                              # still 500 MB ✘</code></pre>
<p><strong>Say this about Alpine:</strong> it uses musl rather than glibc, which occasionally breaks native libraries and has historically caused DNS quirks. For Java, <code>eclipse-temurin:17-jre-jammy</code> or a distroless image is the safer default; Alpine is fine when you have tested it.</p>`
},
{
  q: "Explain Docker networking — how do containers talk to each other and to the host?",
  level: "advanced", hot: true, tags: ["networking", "docker-compose"],
  companies: ["Amazon", "TCS", "Infosys", "Wipro", "Capgemini", "Maersk"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="Docker bridge network with containers, DNS and published port">
  <rect class="dg-box" x="14" y="14" width="592" height="172" rx="10"/>
  <text class="dg-t" x="26" y="34">Docker host</text>
  <rect class="dg-fill" x="34" y="48" width="440" height="120" rx="8"/>
  <text class="dg-s" x="46" y="66">user-defined bridge "app-net"  —  embedded DNS resolves service names</text>
  <rect class="dg-fill2" x="54" y="82" width="110" height="46" rx="6"/>
  <text class="dg-s" x="109" y="101" text-anchor="middle">api</text><text class="dg-s" x="109" y="118" text-anchor="middle">172.18.0.2</text>
  <rect class="dg-fill2" x="188" y="82" width="110" height="46" rx="6"/>
  <text class="dg-s" x="243" y="101" text-anchor="middle">db</text><text class="dg-s" x="243" y="118" text-anchor="middle">172.18.0.3</text>
  <rect class="dg-fill2" x="322" y="82" width="130" height="46" rx="6"/>
  <text class="dg-s" x="387" y="101" text-anchor="middle">redis</text><text class="dg-s" x="387" y="118" text-anchor="middle">172.18.0.4</text>
  <path class="dg-line" d="M164 105 H188" marker-end="url(#dn1)"/>
  <text class="dg-s" x="176" y="150" text-anchor="middle">db:5432</text>
  <path class="dg-line" d="M109 82 V60 H520 V96" marker-end="url(#dn1)"/>
  <rect class="dg-box" x="486" y="96" width="106" height="46" rx="6"/>
  <text class="dg-s" x="539" y="115" text-anchor="middle">-p 8080:8080</text><text class="dg-s" x="539" y="132" text-anchor="middle">host port</text>
  <defs><marker id="dn1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Driver</th><th>Behaviour</th><th>Use for</th></tr>
<tr><td><strong>bridge</strong> (default)</td><td>Private subnet + NAT; ports must be published</td><td>Single-host apps</td></tr>
<tr><td><strong>user-defined bridge</strong></td><td>Same, <em>plus automatic DNS by container name</em></td><td>What Compose creates — always prefer this</td></tr>
<tr><td><strong>host</strong></td><td>No isolation, container shares the host stack</td><td>Latency-sensitive, Linux only</td></tr>
<tr><td><strong>none</strong></td><td>Loopback only</td><td>Batch jobs with no network need</td></tr>
<tr><td><strong>overlay</strong></td><td>Spans multiple hosts via VXLAN</td><td>Swarm / multi-host</td></tr>
</table>
<pre><code>services:
  api:
    build: .
    ports: ["8080:8080"]              # host:container — ONLY for outside access
    environment:
      DB_URL: jdbc:postgresql://db:5432/app    # "db" = the service name, not localhost
    depends_on:
      db: { condition: service_healthy }
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes: { pgdata: }</code></pre>
<p><strong>The mistakes this question is really testing:</strong></p>
<ul>
<li><code>localhost</code> inside a container means <em>that container</em>. To reach another service use its service name; to reach the host machine use <code>host.docker.internal</code> (Docker Desktop) or the gateway IP on Linux.</li>
<li>Containers on the same user-defined network talk on the <strong>container port</strong> — <code>-p</code> is irrelevant between them. Publishing a database port is usually an unnecessary exposure.</li>
<li>The default <code>bridge</code> network has <strong>no DNS</strong>; name resolution only works on user-defined networks. That is the difference people trip over.</li>
<li><code>depends_on</code> alone waits for <em>start</em>, not readiness — you need a healthcheck condition, or retry logic in the app.</li>
</ul>`
},
{
  q: "What is the difference between a volume, a bind mount and tmpfs — and how do you not lose data?",
  level: "beginner", hot: true, tags: ["storage", "basics"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "HCL"],
  a: `<table>
<tr><th></th><th>Named volume</th><th>Bind mount</th><th>tmpfs</th></tr>
<tr><td>Stored</td><td>Docker-managed area</td><td>Any host path you choose</td><td>Host RAM</td></tr>
<tr><td>Survives container removal</td><td>Yes</td><td>Yes</td><td>No</td></tr>
<tr><td>Portable across hosts/OS</td><td>Yes</td><td>No — path must exist</td><td>n/a</td></tr>
<tr><td>Performance on Mac/Windows</td><td>Fast</td><td>Slow (filesystem translation)</td><td>Fastest</td></tr>
<tr><td>Use for</td><td>Databases, uploads — <strong>production</strong></td><td>Source code in dev, config files</td><td>Secrets, scratch files</td></tr>
</table>
<pre><code>docker volume create pgdata
docker run -v pgdata:/var/lib/postgresql/data postgres:16   # named volume
docker run -v "$PWD/src:/app/src:ro"           node:20      # bind mount, read-only
docker run --tmpfs /tmp:size=64m               alpine       # RAM only

docker volume ls
docker volume inspect pgdata
docker volume prune          # deletes every volume no container references — careful</code></pre>
<p><strong>The core fact:</strong> a container's writable layer is deleted with the container. Anything written outside a volume is gone the moment you <code>docker rm</code> — and, more subtly, gone on every redeploy, since deploying a new image means a new container.</p>
<pre><code># Backing up a volume without stopping to think about where it lives
docker run --rm -v pgdata:/data -v "$PWD:/backup" alpine \\
  tar czf /backup/pgdata-$(date +%F).tar.gz -C /data .

# Restore
docker run --rm -v pgdata:/data -v "$PWD:/backup" alpine \\
  tar xzf /backup/pgdata-2026-09-08.tar.gz -C /data</code></pre>
<p><strong>Worth adding:</strong> in Kubernetes the same distinction appears as <code>emptyDir</code> (tmpfs/node disk, dies with the pod) versus a <code>PersistentVolumeClaim</code> (survives rescheduling). And the honest production answer is that databases usually live outside the container platform entirely — a managed RDS or Cloud SQL — because container storage orchestration is a problem you rarely want to own.</p>`
},
{
  q: "How do you debug a container that keeps crashing or exits immediately?",
  level: "advanced", tags: ["debugging", "production"],
  companies: ["Amazon", "Optum", "Maersk", "Nagarro", "Persistent", "Mindtree"],
  a: `<pre><code># 1. What did it say before dying?
docker logs --tail 100 --timestamps &lt;container&gt;
docker logs --since 10m &lt;container&gt;

# 2. WHY did it exit? The code tells you a lot.
docker inspect --format '{{.State.ExitCode}} {{.State.OOMKilled}} {{.State.Error}}' &lt;c&gt;

# 3. The container is gone — inspect the stopped one, do not just re-run
docker ps -a
docker start -a &lt;container&gt;            # re-run attached to see output

# 4. Override the entrypoint to get a shell in the SAME image
docker run -it --entrypoint sh myimage:tag
# then run the real command by hand and watch it fail

# 5. Distroless / no shell? Attach a debug container to its namespaces
docker run -it --rm --pid=container:&lt;c&gt; --network=container:&lt;c&gt; \\
  nicolaka/netshoot

# 6. Live process
docker exec -it &lt;c&gt; sh
docker stats &lt;c&gt;                       # CPU, memory vs limit
docker top &lt;c&gt;</code></pre>
<table>
<tr><th>Exit code</th><th>Meaning</th><th>Usual cause</th></tr>
<tr><td>0</td><td>Clean exit</td><td>Main process finished — the container has no long-running foreground process</td></tr>
<tr><td>1</td><td>Application error</td><td>Read the logs; usually config or a failed connection</td></tr>
<tr><td>125</td><td>Docker itself failed</td><td>Bad <code>run</code> flags</td></tr>
<tr><td>126</td><td>Command not executable</td><td>Missing <code>chmod +x</code>, or CRLF line endings in an entrypoint script</td></tr>
<tr><td>127</td><td>Command not found</td><td>Wrong path, or the binary needs glibc on an Alpine image</td></tr>
<tr><td><strong>137</strong></td><td>SIGKILL (128+9)</td><td><strong>OOM-killed</strong> — check <code>.State.OOMKilled</code> and raise the memory limit</td></tr>
<tr><td>143</td><td>SIGTERM (128+15)</td><td>Normal stop, or a healthcheck/orchestrator killed it</td></tr>
</table>
<p><strong>The two Java-specific ones worth naming:</strong> exit 137 on a JVM almost always means the heap was sized against the <em>host's</em> memory rather than the container limit — fix with <code>-XX:MaxRAMPercentage=75</code> rather than a fixed <code>-Xmx</code>. And a container that exits 0 immediately usually runs the process in the background; Docker lives and dies with PID 1, so the process must stay in the foreground.</p>
<p><strong>Signal handling:</strong> use the exec form <code>ENTRYPOINT ["java","-jar","app.jar"]</code>. The shell form makes <code>/bin/sh</code> PID 1, it does not forward SIGTERM, and your application never gets the chance to shut down gracefully — it is killed after the 10 second grace period instead.</p>`
},
{
  q: "How do you secure a Docker image and container in production?",
  level: "advanced", hot: true, tags: ["security", "production"],
  companies: ["Amazon", "Goldman Sachs", "Barclays", "Optum", "SAP", "Societe Generale"],
  a: `<pre><code># --- Image ---
FROM eclipse-temurin:17-jre-jammy@sha256:abc123...   # PIN by digest, not :latest
RUN groupadd -r app &amp;&amp; useradd -r -g app app
COPY --chown=app:app --from=build /src/target/app.jar /app/app.jar
USER 10001                                            # numeric UID, works with runAsNonRoot
ENTRYPOINT ["java","-jar","/app/app.jar"]

# --- Runtime ---
docker run \\
  --read-only --tmpfs /tmp \\      # immutable filesystem
  --cap-drop=ALL \\                 # drop every Linux capability
  --security-opt=no-new-privileges \\
  --memory=512m --cpus=1 --pids-limit=200 \\
  --user 10001:10001 \\
  myimage:1.4.2</code></pre>
<table>
<tr><th>Risk</th><th>Control</th></tr>
<tr><td>Running as root</td><td><code>USER</code> in the Dockerfile — a container escape then lands as an unprivileged user</td></tr>
<tr><td>Vulnerable base image</td><td><code>trivy image myapp:tag</code> in CI; fail the build on HIGH/CRITICAL; rebuild weekly</td></tr>
<tr><td>Secrets baked into layers</td><td>Never <code>ENV PASSWORD=</code> or <code>COPY .env</code> — layers are readable by anyone with the image. Inject at runtime.</td></tr>
<tr><td>Build-time secrets</td><td><code>RUN --mount=type=secret,id=npmrc ...</code> — not persisted in a layer</td></tr>
<tr><td>Mutable tags</td><td>Deploy by digest; <code>:latest</code> means you cannot say what is running</td></tr>
<tr><td>Oversized attack surface</td><td>Distroless or scratch — no shell, no package manager, nothing for an attacker to use</td></tr>
<tr><td>Docker socket mounted</td><td><strong>Never</strong> mount <code>/var/run/docker.sock</code> into a container — it is root on the host, full stop</td></tr>
<tr><td>Unverified provenance</td><td>Sign with <code>cosign</code>; enforce the signature at admission</td></tr>
</table>
<pre><code># A leaked secret stays in history even if a later layer deletes it
docker history --no-trunc myimage:tag
docker save myimage:tag | tar -x   # anyone can unpack every layer</code></pre>
<p><strong>The point to close on:</strong> "Containers are a process isolation boundary, not a security boundary — they share the host kernel. So I defend in depth: a minimal non-root image, dropped capabilities, a read-only filesystem, scanning in CI, and secrets injected at runtime from a vault rather than built in. For genuinely untrusted workloads you need gVisor, Kata or a separate node pool, because namespaces alone are not enough."</p>`
}
]);
