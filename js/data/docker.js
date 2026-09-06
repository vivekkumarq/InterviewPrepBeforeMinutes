registerTopic("docker", [
{
  q: "What is Docker and how does a container differ from a VM?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 180" role="img" aria-label="Containers versus virtual machines">
  <text class="dg-t" x="150" y="16" text-anchor="middle">Virtual machines</text>
  <rect class="dg-box" x="20" y="26" width="76" height="52" rx="6"/><text class="dg-s" x="58" y="46" text-anchor="middle">App</text><text class="dg-s" x="58" y="62" text-anchor="middle">Guest OS</text>
  <rect class="dg-box" x="102" y="26" width="76" height="52" rx="6"/><text class="dg-s" x="140" y="46" text-anchor="middle">App</text><text class="dg-s" x="140" y="62" text-anchor="middle">Guest OS</text>
  <rect class="dg-box" x="184" y="26" width="76" height="52" rx="6"/><text class="dg-s" x="222" y="46" text-anchor="middle">App</text><text class="dg-s" x="222" y="62" text-anchor="middle">Guest OS</text>
  <rect class="dg-fill2" x="20" y="84" width="240" height="26" rx="5"/><text class="dg-s" x="140" y="101" text-anchor="middle">Hypervisor</text>
  <rect class="dg-box" x="20" y="116" width="240" height="24" rx="5"/><text class="dg-s" x="140" y="132" text-anchor="middle">Host OS</text>
  <rect class="dg-box" x="20" y="146" width="240" height="24" rx="5"/><text class="dg-s" x="140" y="162" text-anchor="middle">Hardware</text>
  <text class="dg-t" x="460" y="16" text-anchor="middle">Containers</text>
  <rect class="dg-fill" x="330" y="40" width="76" height="38" rx="6"/><text class="dg-s" x="368" y="63" text-anchor="middle">App</text>
  <rect class="dg-fill" x="412" y="40" width="76" height="38" rx="6"/><text class="dg-s" x="450" y="63" text-anchor="middle">App</text>
  <rect class="dg-fill" x="494" y="40" width="76" height="38" rx="6"/><text class="dg-s" x="532" y="63" text-anchor="middle">App</text>
  <rect class="dg-fill2" x="330" y="84" width="240" height="26" rx="5"/><text class="dg-s" x="450" y="101" text-anchor="middle">Container runtime</text>
  <rect class="dg-box" x="330" y="116" width="240" height="24" rx="5"/><text class="dg-s" x="450" y="132" text-anchor="middle">Host OS (shared kernel)</text>
  <rect class="dg-box" x="330" y="146" width="240" height="24" rx="5"/><text class="dg-s" x="450" y="162" text-anchor="middle">Hardware</text>
</svg>
<figcaption>Containers share the host kernel — no guest OS per workload.</figcaption>
</figure>
<table>
<tr><th></th><th>Virtual machine</th><th>Container</th></tr>
<tr><td>Isolation</td><td>Hardware level — full OS</td><td>Process level — namespaces + cgroups</td></tr>
<tr><td>Size</td><td>Gigabytes</td><td>Megabytes</td></tr>
<tr><td>Startup</td><td>Minutes</td><td>Milliseconds to seconds</td></tr>
<tr><td>Overhead</td><td>Significant</td><td>Near zero</td></tr>
<tr><td>Security boundary</td><td>Stronger</td><td>Weaker — a shared kernel is a shared attack surface</td></tr>
</table>
<p><strong>The underlying Linux mechanisms</strong> — worth naming, it shows you understand there is no magic: <strong>namespaces</strong> (PID, network, mount, user, IPC, UTS) give a process its own view of the system; <strong>cgroups</strong> limit CPU, memory and I/O; <strong>union filesystems</strong> (overlayfs) give layered images.</p>
<p>Docker solves "it works on my machine" by packaging the application <em>with</em> its dependencies and runtime, so the artefact is identical everywhere.</p>`
},
{
  q: "What is the difference between an image and a container?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<ul>
<li><strong>Image</strong> — an immutable, layered template. A read-only filesystem plus metadata (entrypoint, env, exposed ports). Analogous to a class.</li>
<li><strong>Container</strong> — a running (or stopped) instance of an image, with a thin writable layer on top. Analogous to an object.</li>
</ul>
<p>One image can back hundreds of containers; they share the read-only layers on disk and in the page cache, which is why starting 50 containers from one image costs almost nothing extra.</p>
<pre><code>docker build -t myapp:1.2.0 .        # Dockerfile -&gt; image
docker run -d --name app myapp:1.2.0 # image     -&gt; container
docker ps -a                          # list containers
docker images                         # list images
docker exec -it app sh                # shell into a running container
docker logs -f app                    # follow logs
docker stop app &amp;&amp; docker rm app
docker system prune -a                # reclaim disk</code></pre>
<p><strong>The critical implication:</strong> the writable layer dies with the container. Anything you want to keep — a database's data, uploaded files — must go in a <strong>volume</strong>. Containers are designed to be disposable and replaceable, which is exactly what makes orchestration possible.</p>`
},
{
  q: "How do Docker image layers and caching work?",
  level: "advanced", hot: true, tags: ["images", "build"],
  a: `<p>Each instruction in a Dockerfile creates a layer — a filesystem diff. Layers are content-addressed and cached: if an instruction and all its inputs are unchanged, Docker reuses the cached layer. <strong>Once one layer is invalidated, every layer after it is rebuilt.</strong></p>
<pre><code># BAD — any source change re-downloads all dependencies (minutes every build)
COPY . /app
RUN mvn package

# GOOD — dependencies are cached because pom.xml rarely changes
COPY pom.xml .
RUN mvn dependency:go-offline -B      # cached layer
COPY src ./src                        # only this invalidates on a code change
RUN mvn package -o -DskipTests</code></pre>
<p><strong>The ordering rule:</strong> put the least frequently changing instructions first — base image, system packages, dependency manifests — and the most frequently changing (your source) last.</p>
<p><strong>Layers are additive, which surprises people:</strong> deleting a file in a later layer does not shrink the image; the file still exists in the earlier layer and can be extracted. Never <code>COPY</code> a secret and then <code>RUN rm</code> it — it is still in the image history.</p>
<pre><code># Combine related commands so the cleanup happens in the SAME layer
RUN apt-get update &amp;&amp; apt-get install -y --no-install-recommends curl \\
 &amp;&amp; rm -rf /var/lib/apt/lists/*

# .dockerignore is essential — keeps target/, .git and node_modules out of the build context
target/
.git/
*.md</code></pre>
<p>Mention BuildKit (<code>DOCKER_BUILDKIT=1</code>) with <code>--mount=type=cache</code> for persistent dependency caches across builds — the modern answer for fast CI builds.</p>`
},
{
  q: "What is a multi-stage build and why does it matter?",
  level: "advanced", hot: true, tags: ["images", "optimisation"],
  a: `<p>Multi-stage builds let you use a heavy toolchain to build and then copy only the artefact into a minimal runtime image. The build tools, source code and caches never reach production.</p>
<pre><code># ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# ---- runtime stage ----
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app &amp;&amp; adduser -S app -G app     # never run as root
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar     # only the jar crosses the boundary
USER app
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0"
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]</code></pre>
<p><strong>The impact is dramatic:</strong> a single-stage Maven image is roughly 800 MB; this is around 200 MB, and a distroless or JRE-slim variant less again. Smaller images mean faster pulls, faster autoscaling, lower registry cost and a much smaller attack surface.</p>
<p><strong>Going further:</strong> Spring Boot layered jars (<code>java -Djarmode=layertools -jar app.jar extract</code>) split dependencies from application classes so a code-only change re-pushes only a few megabytes; <code>gcr.io/distroless/java21</code> removes the shell and package manager entirely; and <code>jlink</code> or GraalVM native images shrink further still.</p>`
},
{
  q: "CMD vs ENTRYPOINT vs RUN",
  level: "beginner", hot: true, tags: ["dockerfile"],
  a: `<ul>
<li><strong><code>RUN</code></strong> — executes at <em>build</em> time, creating a layer. Used to install packages and compile.</li>
<li><strong><code>ENTRYPOINT</code></strong> — the executable the container runs. Not overridden by <code>docker run</code> arguments.</li>
<li><strong><code>CMD</code></strong> — default arguments, or the default command if there is no ENTRYPOINT. <strong>Overridden</strong> by <code>docker run</code> arguments.</li>
</ul>
<pre><code>ENTRYPOINT ["java", "-jar", "app.jar"]
CMD ["--spring.profiles.active=prod"]

docker run myapp                                  -&gt; java -jar app.jar --spring.profiles.active=prod
docker run myapp --spring.profiles.active=dev     -&gt; java -jar app.jar --spring.profiles.active=dev</code></pre>
<p><strong>Always use the exec form</strong> (JSON array), not the shell form:</p>
<pre><code>ENTRYPOINT ["java", "-jar", "app.jar"]    ✔ PID 1 is java — receives SIGTERM directly
ENTRYPOINT java -jar app.jar              ✘ PID 1 is /bin/sh — SIGTERM never reaches java</code></pre>
<p><strong>Why that matters:</strong> with the shell form the JVM never receives the shutdown signal, so graceful shutdown does not run and Docker/Kubernetes kills it after the grace period — in-flight requests are dropped on every deploy. This is a real, commonly missed production bug and a great detail to raise.</p>`
},
{
  q: "How does Docker networking work?",
  level: "advanced", tags: ["networking"],
  a: `<table>
<tr><th>Driver</th><th>Behaviour</th></tr>
<tr><td><strong>bridge</strong> (default)</td><td>Private network on the host; containers reach each other by IP, and by <em>name</em> on a user-defined bridge</td></tr>
<tr><td><strong>host</strong></td><td>No isolation — the container uses the host's network stack directly. Fastest, no port mapping</td></tr>
<tr><td><strong>none</strong></td><td>No networking at all</td></tr>
<tr><td><strong>overlay</strong></td><td>Multi-host networking for Swarm/Kubernetes</td></tr>
<tr><td><strong>macvlan</strong></td><td>Container gets its own MAC address on the physical network</td></tr>
</table>
<pre><code># Create a user-defined bridge — gives automatic DNS by container name
docker network create app-net
docker run -d --name postgres --network app-net postgres:16
docker run -d --name api --network app-net -p 8080:8080 myapp
# Inside 'api', the host "postgres" resolves automatically. No IPs, no links.

-p 8080:8080     # hostPort:containerPort  — publish to the outside world</code></pre>
<p><strong>Two things people get wrong:</strong></p>
<ul>
<li>The <em>default</em> bridge has no DNS resolution between containers — you must create a user-defined network to use container names. This is why <code>docker-compose</code> "just works": it creates one for you.</li>
<li><code>localhost</code> inside a container is the <em>container</em>, not the host. To reach a service on the host use <code>host.docker.internal</code> (Docker Desktop) or the gateway IP.</li>
</ul>`
},
{
  q: "What are volumes and how do you persist data?",
  level: "beginner", hot: true, tags: ["storage"],
  a: `<p>A container's writable layer is destroyed with the container, so persistent data must live outside it.</p>
<table>
<tr><th>Type</th><th>Syntax</th><th>Use for</th></tr>
<tr><td><strong>Named volume</strong></td><td><code>-v pgdata:/var/lib/postgresql/data</code></td><td>Production data — Docker-managed, portable, backupable</td></tr>
<tr><td><strong>Bind mount</strong></td><td><code>-v $(pwd)/src:/app/src</code></td><td>Development — live code reload from the host</td></tr>
<tr><td><strong>tmpfs</strong></td><td><code>--tmpfs /tmp</code></td><td>Sensitive scratch data — memory only, never written to disk</td></tr>
</table>
<pre><code>docker volume create pgdata
docker run -d -v pgdata:/var/lib/postgresql/data postgres:16
docker volume ls
docker volume inspect pgdata

# Backup a named volume
docker run --rm -v pgdata:/data -v $(pwd):/backup alpine \\
  tar czf /backup/pgdata.tar.gz -C /data .</code></pre>
<p><strong>Named volumes vs bind mounts:</strong> named volumes are managed by Docker, work identically on Linux/Mac/Windows, can use volume drivers (NFS, cloud storage), and are the right choice for data. Bind mounts depend on host paths and permissions — great for development, fragile in production.</p>
<p><strong>The broader principle:</strong> containers should be <em>stateless</em>. In Kubernetes, stateful workloads need a <code>StatefulSet</code> with <code>PersistentVolumeClaim</code>s, and most teams run their database as a managed service rather than in a container — worth saying, because "would you run PostgreSQL in Docker in production?" is a common follow-up.</p>`
},
{
  q: "How do you write a production-ready Dockerfile? What are the best practices?",
  level: "advanced", hot: true, tags: ["best-practices", "production"],
  a: `<ol>
<li><strong>Use a specific base image tag</strong>, never <code>latest</code> — builds must be reproducible. Prefer a digest for full immutability.</li>
<li><strong>Multi-stage builds</strong> — build tools never reach the runtime image.</li>
<li><strong>Minimal base</strong> — <code>-jre-alpine</code>, <code>-slim</code>, or distroless. Fewer packages, fewer CVEs.</li>
<li><strong>Run as a non-root user.</strong> A container escape as root is far worse than as an unprivileged user.</li>
<li><strong>Order instructions by change frequency</strong> for cache efficiency.</li>
<li><strong>Use <code>.dockerignore</code></strong> — keeps the build context small and secrets out.</li>
<li><strong>One process per container</strong> — let the orchestrator handle composition and restarts.</li>
<li><strong>Never bake secrets in</strong> — not in <code>ENV</code>, not in <code>ARG</code> (both are visible in <code>docker history</code>). Inject at runtime or use BuildKit secret mounts.</li>
<li><strong>Exec-form ENTRYPOINT</strong> so signals reach the process.</li>
<li><strong>Add a HEALTHCHECK</strong> and labels (version, commit SHA, source repo) for traceability.</li>
<li><strong>Scan images</strong> in CI — Trivy, Grype or Snyk — and fail the build on high-severity CVEs.</li>
<li><strong>Pin dependency versions</strong> inside the image too, not just the base.</li>
</ol>
<pre><code>FROM eclipse-temurin:21.0.4_7-jre-alpine
LABEL org.opencontainers.image.source="https://github.com/acme/api" \\
      org.opencontainers.image.revision="\${GIT_SHA}"
RUN addgroup -S app &amp;&amp; adduser -S app -G app
USER app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java","-jar","/app/app.jar"]</code></pre>`
},
{
  q: "What is Docker Compose and when do you use it?",
  level: "beginner", tags: ["compose"],
  a: `<p>Compose defines a multi-container application in one YAML file and runs it with a single command. It creates a network, handles dependency order, and gives every service DNS by name.</p>
<pre><code>services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_PASSWORD: \${DB_PASSWORD:?required}
    volumes: [ pgdata:/var/lib/postgresql/data ]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment: { KAFKA_PROCESS_ROLES: broker,controller }

  api:
    build: .
    ports: [ "8080:8080" ]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/orders
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on:
      postgres: { condition: service_healthy }   # wait for READY, not just started

volumes:
  pgdata:</code></pre>
<pre><code>docker compose up -d --build
docker compose logs -f api
docker compose down -v          # -v also removes volumes</code></pre>
<p><strong>Where it fits:</strong> local development, integration testing in CI, and demos. <strong>Where it does not:</strong> production at scale — it has no multi-host scheduling, no rolling updates, no self-healing, no autoscaling. That is what Kubernetes is for.</p>
<p><strong>The detail worth raising:</strong> <code>depends_on</code> alone only waits for the container to <em>start</em>, not to be ready. Combine it with a healthcheck and <code>condition: service_healthy</code>, or your application starts before the database accepts connections — a very common flaky-CI cause.</p>`
},
{
  q: "How do you debug a container that keeps crashing?",
  level: "advanced", hot: true, tags: ["debugging", "production"],
  a: `<ol>
<li><strong>Read the logs first</strong> — <code>docker logs --tail 200 &lt;container&gt;</code>, and <code>docker logs --previous</code> (or <code>kubectl logs --previous</code>) for the crashed instance, which is the one that holds the answer.</li>
<li><strong>Check the exit code</strong> — <code>docker inspect &lt;c&gt; --format '{{.State.ExitCode}} {{.State.OOMKilled}}'</code>.
  <ul>
  <li><code>0</code> — the process finished; your command is not long-running.</li>
  <li><code>1</code> / <code>2</code> — application error.</li>
  <li><code>125</code> — Docker itself failed; <code>126</code> — not executable; <code>127</code> — command not found (often a missing shell in a slim image).</li>
  <li><code>137</code> — SIGKILL, almost always <strong>OOM-killed</strong>. Check <code>OOMKilled: true</code>.</li>
  <li><code>143</code> — SIGTERM, a normal stop.</li>
  </ul>
</li>
<li><strong>Override the entrypoint to look around</strong> — <code>docker run -it --entrypoint sh myimage</code> lets you inspect the filesystem, check the jar is where you think, and run the command manually.</li>
<li><strong>Check configuration</strong> — <code>docker inspect</code> for env vars, mounts and command; a typo'd environment variable is a frequent cause.</li>
<li><strong>Check resources</strong> — <code>docker stats</code>. For a JVM, <code>137</code> usually means the heap plus native memory exceeded the container limit; set <code>-XX:MaxRAMPercentage</code> and leave headroom.</li>
<li><strong>Check the health check</strong> — a probe pointing at the wrong path or port causes an endless restart loop of a perfectly healthy application.</li>
<li><strong>Check permissions</strong> — running as non-root and writing to a directory owned by root is a classic.</li>
</ol>
<p>Framing the answer as a decision tree from exit code → cause is what makes it a strong response.</p>`
},
{
  q: "How do you make Docker images secure?",
  level: "advanced", tags: ["security"],
  a: `<ol>
<li><strong>Minimal base image</strong> — distroless or Alpine. Every package you do not ship is a CVE you do not have.</li>
<li><strong>Non-root user</strong>, and drop capabilities: <code>--cap-drop=ALL --security-opt=no-new-privileges</code>.</li>
<li><strong>Read-only root filesystem</strong> — <code>--read-only</code> with a <code>tmpfs</code> for <code>/tmp</code>. Stops an attacker writing tools into the container.</li>
<li><strong>Scan continuously</strong> — Trivy/Grype in CI <em>and</em> against the registry, because new CVEs appear in images you already shipped.</li>
<li><strong>Never bake secrets</strong> — <code>ENV</code> and <code>ARG</code> are visible in <code>docker history</code>. Use runtime injection, BuildKit <code>--mount=type=secret</code>, or a secret manager.</li>
<li><strong>Pin base images by digest</strong> — <code>FROM alpine@sha256:...</code> — so a mutated tag cannot change what you build.</li>
<li><strong>Sign and verify images</strong> — Cosign/Sigstore, with an admission policy that rejects unsigned images.</li>
<li><strong>Generate an SBOM</strong> so you can answer "are we affected by this CVE?" in minutes rather than days.</li>
<li><strong>Never mount the Docker socket</strong> into a container — it is equivalent to giving root on the host.</li>
<li><strong>Set resource limits</strong> — an unbounded container can starve everything else on the node.</li>
</ol>
<pre><code>docker run --read-only --tmpfs /tmp \\
  --cap-drop=ALL --security-opt=no-new-privileges \\
  --memory=512m --cpus=1 --user 10001:10001 myapp:1.2.0

trivy image --severity HIGH,CRITICAL --exit-code 1 myapp:1.2.0</code></pre>
<p><strong>The point to make:</strong> a container is a process isolation boundary, not a security boundary. For untrusted workloads you need gVisor, Kata Containers or a VM.</p>`
},
{
  q: "How do you run a Spring Boot application in Docker efficiently?",
  level: "advanced", hot: true, tags: ["spring", "jvm"],
  a: `<pre><code># Layered jar: dependencies change rarely, code changes often
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app &amp;&amp; adduser -S app -G app
WORKDIR /app
COPY --from=build /app/dependencies/          ./
COPY --from=build /app/spring-boot-loader/    ./
COPY --from=build /app/snapshot-dependencies/ ./
COPY --from=build /app/application/           ./     &lt;-- only this layer changes per commit
USER app
ENTRYPOINT ["java","org.springframework.boot.loader.launch.JarLauncher"]</code></pre>
<pre><code># JVM settings that matter in a container
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 \\
                   -XX:+ExitOnOutOfMemoryError \\
                   -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp \\
                   -Djava.security.egd=file:/dev/./urandom"</code></pre>
<pre><code>server.shutdown: graceful                              # finish in-flight requests
spring.lifecycle.timeout-per-shutdown-phase: 30s
management.endpoint.health.probes.enabled: true        # /health/liveness, /health/readiness</code></pre>
<p><strong>The points that matter:</strong></p>
<ul>
<li><strong>Never set a fixed <code>-Xmx</code></strong> — use <code>MaxRAMPercentage</code> so the same image works at any container limit. Modern JVMs are container-aware and read the cgroup limit.</li>
<li><strong>Leave ~25% headroom</strong> for metaspace, thread stacks, code cache and direct buffers — that is what causes mysterious exit code 137 when the heap looks fine.</li>
<li><strong>Graceful shutdown plus exec-form entrypoint</strong> so SIGTERM reaches the JVM and rolling deploys drop no requests.</li>
<li>Alternatives worth naming: Spring Boot's <code>bootBuildImage</code> (Cloud Native Buildpacks — no Dockerfile at all), and GraalVM native images for sub-100 ms startup in serverless contexts.</li>
</ul>`
},
{
  q: "What is a container registry and how do you manage image tags?",
  level: "beginner", tags: ["registry", "cicd"],
  a: `<p>A registry stores and distributes images: Docker Hub, GitHub Container Registry, AWS ECR, Google Artifact Registry, or a self-hosted Harbor/Nexus.</p>
<pre><code>docker login ghcr.io
docker build -t ghcr.io/acme/api:1.4.2 .
docker push ghcr.io/acme/api:1.4.2
docker pull ghcr.io/acme/api@sha256:9f2c...    # immutable, by digest</code></pre>
<p><strong>Tagging strategy:</strong></p>
<ul>
<li><strong>Never deploy <code>latest</code>.</strong> It is mutable, so you cannot tell what is running, and a rollback is undefined.</li>
<li><strong>Tag with the git SHA</strong> — <code>api:9f2c1e4</code> — for exact traceability from a running pod back to a commit.</li>
<li><strong>Add a semantic version</strong> for releases — <code>api:1.4.2</code> — plus moving <code>1.4</code> and <code>1</code> tags if consumers want them.</li>
<li><strong>Deploy by digest</strong> in production for full immutability; a tag can be repointed, a digest cannot.</li>
<li><strong>Set retention policies</strong> — untagged and old images consume real money in ECR/GCR.</li>
</ul>
<p><strong>Also worth mentioning:</strong> registry authentication in Kubernetes via <code>imagePullSecrets</code>, image signing and admission policies so only signed images run, and a pull-through cache or regional replica to speed up node pulls and reduce egress cost during a large rollout.</p>`
}
]);
