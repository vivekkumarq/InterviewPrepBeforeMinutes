appendTopic("docker", [
{
  q: "How does Docker networking work, and how do containers talk to each other?",
  level: "beginner", hot: true, tags: ["networking", "docker", "compose"],
  companies: ["Amazon", "TCS", "Infosys", "Optum", "Cognizant", "Maersk", "Wipro", "Accenture"],
  a: `<table>
<tr><th>Driver</th><th>Behaviour</th><th>Use for</th></tr>
<tr><td><strong>bridge</strong> (default)</td><td>Private network; containers reach each other <strong>by name</strong></td><td>Almost everything on one host</td></tr>
<tr><td>host</td><td>Shares the host's stack — no isolation, no port mapping</td><td>Maximum network performance; Linux only</td></tr>
<tr><td>none</td><td>No networking at all</td><td>Batch jobs that only touch the filesystem</td></tr>
<tr><td>overlay</td><td>Spans multiple hosts</td><td>Swarm; Kubernetes uses its own CNI</td></tr>
<tr><td>macvlan</td><td>The container gets its own MAC and IP on the LAN</td><td>Legacy systems that need a real address</td></tr>
</table>
<pre><code># The default bridge does NOT give you name resolution. A USER-DEFINED
# bridge does — which is why Compose creates one for you.
docker network create appnet
docker run -d --name db  --network appnet postgres:16
docker run -d --name api --network appnet myapp
# Inside api:  jdbc:postgresql://db:5432/orders     <- "db" resolves

# Ports: -p HOST:CONTAINER
docker run -p 8080:8080 myapp      # reachable from outside
docker run -p 127.0.0.1:8080:8080 myapp   # localhost only — safer default</code></pre>
<pre><code># docker-compose.yml — everything on one implicit network
services:
  api:
    build: .
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders   # by SERVICE NAME
    depends_on:
      db: { condition: service_healthy }     # wait for READY, not just started
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: dev }
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10
volumes: { pgdata: }</code></pre>
<table>
<tr><th>Confusion</th><th>Answer</th></tr>
<tr><td><code>localhost</code> inside a container</td><td>Means <em>that container</em>, not the host and not another service</td></tr>
<tr><td>Reaching the host from a container</td><td><code>host.docker.internal</code> (Docker Desktop); on Linux add <code>--add-host=host.docker.internal:host-gateway</code></td></tr>
<tr><td><code>depends_on</code> without a healthcheck</td><td>Waits for <em>started</em>, not <em>ready</em> — your app still races the database</td></tr>
<tr><td>Which port to use</td><td>Between containers use the <strong>container</strong> port; the host mapping is irrelevant inside the network</td></tr>
<tr><td>Container cannot reach the internet</td><td>Usually DNS or a corporate proxy — check <code>/etc/resolv.conf</code></td></tr>
</table>
<p><strong>Volumes, briefly, since they pair with this:</strong> a <strong>named volume</strong> is managed by Docker and is what you want for databases — it bypasses the union filesystem, so writes are fast. A <strong>bind mount</strong> maps a host directory, which is right for source code in development. Anything written to the container's own filesystem dies with the container.</p>`
},
{
  q: "How do you harden a container image for production?",
  level: "advanced", tags: ["security", "production", "docker", "best-practice"],
  companies: ["Amazon", "Barclays", "Optum", "SAP", "Maersk", "Goldman Sachs", "Deloitte", "Societe Generale"],
  a: `<pre><code># syntax=docker/dockerfile:1.7
FROM eclipse-temurin:21.0.4_7-jre-jammy@sha256:abc123...   # PIN by digest

# 1. A non-root user, created explicitly
RUN groupadd -r app && useradd -r -g app -u 10001 app

WORKDIR /app
COPY --chown=app:app --from=build /src/target/app.jar app.jar

USER 10001                       # numeric, so Kubernetes runAsNonRoot can verify it

# 2. Container-aware JVM settings
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

# 3. Exec form, so the JVM is PID 1 and receives SIGTERM for graceful shutdown
ENTRYPOINT ["java","-jar","/app/app.jar"]</code></pre>
<table>
<tr><th>Control</th><th>Stops</th></tr>
<tr><td><strong>Non-root user</strong></td><td>The single highest-value change. Root in a container is root on the host if anything escapes.</td></tr>
<tr><td>Distroless or JRE-only base</td><td>No shell, no package manager — far less to exploit, far fewer CVEs</td></tr>
<tr><td>Pin base images <strong>by digest</strong></td><td>A mutable tag changing under you</td></tr>
<tr><td>Multi-stage build</td><td>Build tools, source and credentials never reach the runtime image</td></tr>
<tr><td><code>--mount=type=secret</code></td><td>A token ending up permanently in <code>docker history</code></td></tr>
<tr><td>Read-only root filesystem</td><td>Writing a payload into the container</td></tr>
<tr><td>Drop all capabilities</td><td>Privilege escalation</td></tr>
<tr><td>Scan in CI, fail on high</td><td>Shipping a known CVE</td></tr>
</table>
<pre><code># Runtime hardening — most of this is set where the container RUNS
docker run --read-only --tmpfs /tmp \\
           --cap-drop=ALL --security-opt=no-new-privileges \\
           --memory=1g --cpus=1 --pids-limit=200 myapp

# Kubernetes equivalent
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities: { drop: ["ALL"] }
  seccompProfile: { type: RuntimeDefault }</code></pre>
<pre><code># Scan and sign
trivy image --severity HIGH,CRITICAL --exit-code 1 myapp:1.0
syft myapp:1.0 -o spdx-json > sbom.json      # an SBOM you can query after a CVE lands
cosign sign --key cosign.key myapp:1.0       # and verify it at admission

# The SBOM is what lets you answer "are we affected?" in minutes rather than
# days the next time something like Log4Shell happens.</code></pre>
<p><strong>The distinction worth making:</strong> "A container is an isolation boundary, not a security boundary — it shares the host kernel, so a kernel vulnerability is shared by everything on the node. That is why I layer: non-root, minimal base, dropped capabilities, read-only filesystem. If stronger isolation is genuinely required, that is a VM, gVisor or Kata Containers, not a better Dockerfile."</p>`
}
]);
