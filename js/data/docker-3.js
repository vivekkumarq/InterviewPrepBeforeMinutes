appendTopic("docker", [
{
  q: "What is the difference between a container image manifest, layer and digest?",
  level: "advanced", tags: ["images", "registry"],
  a: `<pre><code>docker manifest inspect ghcr.io/acme/api:1.4.2
{
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": { "digest": "sha256:a1b2..." },        // image config: env, entrypoint, labels
  "layers": [
    { "digest": "sha256:c3d4...", "size": 3400000 },   // each layer is a content-addressed tar
    { "digest": "sha256:e5f6...", "size":  180000 }
  ]
}</code></pre>
<ul>
<li><strong>Layer</strong> — a compressed tar of filesystem changes, identified by the SHA-256 of its content. Layers are shared: ten images on the same base store that base once.</li>
<li><strong>Manifest</strong> — a JSON document listing the config and the ordered layers. This <em>is</em> the image.</li>
<li><strong>Digest</strong> — the SHA-256 of the manifest. Immutable and globally unique.</li>
<li><strong>Tag</strong> — a mutable pointer to a digest. <code>latest</code> can point somewhere different tomorrow.</li>
<li><strong>Manifest list / index</strong> — a manifest of manifests, one per platform, which is how <code>linux/amd64</code> and <code>linux/arm64</code> live under one tag.</li>
</ul>
<pre><code># Deploy by digest in production — a tag can be repointed, a digest cannot
image: ghcr.io/acme/api@sha256:9f2c1e4d...
docker pull ghcr.io/acme/api@sha256:9f2c...</code></pre>
<p><strong>Why this matters practically:</strong> content addressing is what makes layer caching and deduplication work — a registry stores each layer once regardless of how many images reference it, and a pull only fetches layers the node does not already have. It is also why reordering Dockerfile instructions changes cache behaviour: a layer's digest depends on its content <em>and</em> its parent.</p>
<p>Multi-platform builds are worth mentioning too, since Apple Silicon made them routine: <code>docker buildx build --platform linux/amd64,linux/arm64 --push</code> produces one tag containing both, and each node pulls the manifest matching its architecture automatically.</p>`
},
{
  q: "How do you run databases and stateful services in Docker for development?",
  level: "beginner", tags: ["compose", "development"],
  a: `<pre><code>services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devonly
    ports: [ "5432:5432" ]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d      # scripts run ONCE on an empty volume
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d orders"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    command: redis-server --save "" --appendonly no     # no persistence for dev

  api:
    build: .
    depends_on:
      postgres: { condition: service_healthy }          # wait for READY, not just started
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/orders

volumes:
  pgdata:</code></pre>
<p><strong>The detail that fixes most flaky local setups:</strong> <code>depends_on</code> alone only waits for the container to <em>start</em>, not for PostgreSQL to accept connections. Pairing it with a healthcheck and <code>condition: service_healthy</code> is what makes the application start reliably — otherwise it races the database and fails on the first run after every <code>docker compose down</code>.</p>
<p><strong>Other practical points:</strong> the <code>docker-entrypoint-initdb.d</code> scripts run only when the data volume is <em>empty</em>, so changing them requires <code>docker compose down -v</code>; expose the port so you can connect with a local SQL client; and disable persistence for Redis in development so a stale cache never causes a confusing bug.</p>
<p><strong>For production, say plainly:</strong> a managed database service is almost always the right choice. Running PostgreSQL in a container means owning backups, point-in-time recovery, failover, storage performance and version upgrades yourself — and for local development and CI (via Testcontainers) is exactly where containerised databases shine instead.</p>`
},
{
  q: "What are Docker health checks and restart policies?",
  level: "beginner", tags: ["production", "operations"],
  a: `<pre><code>HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \\
  CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1</code></pre>
<table>
<tr><th>Option</th><th>Meaning</th></tr>
<tr><td><code>--interval</code></td><td>Time between checks</td></tr>
<tr><td><code>--timeout</code></td><td>A check taking longer than this counts as a failure</td></tr>
<tr><td><code>--start-period</code></td><td>Grace window during startup — failures here do not count</td></tr>
<tr><td><code>--retries</code></td><td>Consecutive failures before the container is marked <code>unhealthy</code></td></tr>
</table>
<p><code>--start-period</code> matters for JVM applications: without it a slow-starting service is marked unhealthy before it has finished booting, and an orchestrator restarts it in a loop it can never escape.</p>
<pre><code># Restart policies
docker run --restart=no              myapp   # default
docker run --restart=on-failure:5    myapp   # only on non-zero exit, max 5 attempts
docker run --restart=unless-stopped  myapp   # restart always, except after a manual stop
docker run --restart=always          myapp   # restart even after a manual stop, and on daemon start</code></pre>
<p><strong>An important distinction:</strong> a Docker health check marking a container <code>unhealthy</code> does <strong>not</strong> restart it — plain Docker only reports the status. Swarm and orchestrators act on it. In Kubernetes you would use liveness and readiness probes instead, and the Dockerfile <code>HEALTHCHECK</code> is largely ignored.</p>
<p><strong>The design rule that carries across both:</strong> a health check must be cheap, local and dependency-free. Checking the database inside a liveness check means a brief database blip marks every container unhealthy at once, and restarting them does not fix someone else's database — a recoverable incident becomes an outage.</p>`
},
{
  q: "How do you handle time zones, locales and the JVM inside containers?",
  level: "advanced", tags: ["production", "jvm"],
  a: `<pre><code># Minimal images often have NO timezone database at all
FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache tzdata          # Alpine: required for ZoneId to resolve
ENV TZ=UTC
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8</code></pre>
<p><strong>Three problems that appear only in containers:</strong></p>
<ol>
<li><strong>Missing tzdata.</strong> On Alpine, <code>ZoneId.of("Asia/Kolkata")</code> throws <code>ZoneRulesException</code> because the timezone database is not installed. The code works on a developer's machine and fails in production.</li>
<li><strong>Default locale differences.</strong> A container typically has <code>POSIX</code>/<code>C</code> as its locale, so <code>String.format("%,.2f", value)</code>, <code>toUpperCase()</code> and date parsing behave differently from a developer machine set to <code>en-IN</code>. The infamous case is Turkish: <code>"I".toLowerCase()</code> produces a dotless <code>ı</code> under <code>tr</code>, breaking case-insensitive comparisons.</li>
<li><strong>Character encoding.</strong> Without <code>LANG</code> set, <code>file.encoding</code> may not be UTF-8 on older JDKs, corrupting non-ASCII output. Java 18 made UTF-8 the default charset, which removed most of this.</li>
</ol>
<pre><code>// Defensive coding — never rely on the ambient default
String.format(Locale.ROOT, "%.2f", amount);        // explicit locale for machine output
text.toLowerCase(Locale.ROOT);                      // locale-independent case folding
DateTimeFormatter.ISO_INSTANT.format(instant);      // explicit formatter

// And set them explicitly at the JVM level
-Duser.timezone=UTC -Duser.language=en -Duser.country=IN -Dfile.encoding=UTF-8</code></pre>
<p><strong>The rule for services:</strong> run every container in <strong>UTC</strong> and store every timestamp as an <code>Instant</code>. Convert to a user's zone only at the presentation edge. That eliminates an entire category of bug where a report shows different numbers depending on which host generated it.</p>`
},
{
  q: "What is Docker Swarm and how does it compare to Kubernetes?",
  level: "beginner", tags: ["orchestration"],
  a: `<table>
<tr><th></th><th>Docker Swarm</th><th>Kubernetes</th></tr>
<tr><td>Setup</td><td><code>docker swarm init</code> — minutes</td><td>Managed service, or significant effort</td></tr>
<tr><td>Learning curve</td><td>Gentle — it is Compose syntax</td><td>Steep</td></tr>
<tr><td>Autoscaling</td><td>Manual only</td><td>HPA, VPA, Cluster Autoscaler</td></tr>
<tr><td>Ecosystem</td><td>Minimal</td><td>Enormous — operators, Helm, meshes, CRDs</td></tr>
<tr><td>Self-healing</td><td>Basic restart</td><td>Rich: probes, disruption budgets, rescheduling</td></tr>
<tr><td>Industry adoption</td><td>Declining</td><td>The standard</td></tr>
</table>
<pre><code>docker swarm init
docker stack deploy -c docker-compose.yml myapp     # the same file you use locally
docker service scale myapp_api=5
docker service update --image myapp:1.4.3 myapp_api  # rolling update</code></pre>
<p><strong>The honest assessment:</strong> Swarm's genuine advantage is that it is dramatically simpler — the same Compose file that runs locally deploys to a cluster, and you can learn it in an afternoon. For a small team running a handful of services on a few VMs, it delivers most of what they actually need.</p>
<p><strong>But the ecosystem decided.</strong> Kubernetes won, which means the tooling, hiring pool, documentation, operators and cloud integration all point one way. Choosing Swarm today means solving problems alone that Kubernetes has a well-trodden answer for.</p>
<p><strong>What I would actually recommend</strong> if Kubernetes feels like overkill: a managed container platform — AWS ECS or Fargate, Google Cloud Run, Azure Container Apps, Fly.io — which gives you deployment, scaling and networking without operating a control plane. That is usually the right middle ground, and saying so shows you evaluate operational cost rather than reaching for the most powerful tool by default.</p>`
},
{
  q: "How do you optimise container startup time?",
  level: "advanced", tags: ["performance"],
  a: `<p>Startup time directly affects autoscaling responsiveness, rolling deploy duration and — for scale-to-zero platforms — the user-visible cold start.</p>
<ol>
<li><strong>Reduce image size</strong> — the pull is often the largest component on a fresh node. A 200 MB image pulls far faster than an 800 MB one, and layers already on the node are free.</li>
<li><strong>Pre-pull images</strong> — a DaemonSet or node warming so a scale-up event does not begin with a registry round trip.</li>
<li><strong>Class Data Sharing</strong> for the JVM — pre-parsed class metadata mapped rather than parsed:
<pre><code>java -XX:ArchiveClassesAtExit=app.jsa -jar app.jar     # once, at build time
java -XX:SharedArchiveFile=app.jsa -jar app.jar        # typically 20-40% faster</code></pre></li>
<li><strong><code>-XX:TieredStopAtLevel=1</code></strong> for short-lived containers (jobs, CLI tools) — skips expensive C2 compilation. Wrong for long-running servers, which need C2's peak performance.</li>
<li><strong>Trim the Spring classpath</strong> — every starter adds auto-configurations to evaluate. Measure with <code>/actuator/startup</code>.</li>
<li><strong>Defer non-essential work</strong> — cache warming and migrations should not block readiness; let the probe gate traffic instead.</li>
<li><strong>GraalVM native image</strong> — startup in tens of milliseconds and 5–10× less memory, at the cost of build time, reflection configuration and lower peak throughput.</li>
<li><strong><code>-Djava.security.egd=file:/dev/./urandom</code></strong> — avoids entropy stalls that can add seconds on some hosts.</li>
</ol>
<pre><code># Measure where the time actually goes before optimising
time docker run --rm myapp:1.4.2 --version
kubectl get events --field-selector involvedObject.name=api-pod   # pull vs start time</code></pre>
<p><strong>The framing:</strong> separate <em>image pull</em> time from <em>process start</em> time — they have completely different fixes, and teams often optimise the wrong one. A 40-second start is usually 30 seconds of pulling a bloated image and 10 seconds of JVM startup.</p>`
}
]);
