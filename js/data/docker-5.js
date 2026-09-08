appendTopic("docker", [
{
  q: "What is the difference between an image, a container, and a layer?",
  level: "beginner", hot: true, tags: ["images", "basics", "docker"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "Amazon", "HCL"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 175" role="img" aria-label="Read only image layers with a writable container layer on top">
  <text class="dg-s" x="16" y="20">one image, three running containers</text>
  <rect class="dg-fill2" x="16" y="118" width="230" height="26" rx="4"/><text class="dg-s" x="131" y="136" text-anchor="middle">base: eclipse-temurin:17-jre</text>
  <rect class="dg-fill2" x="16" y="88" width="230" height="26" rx="4"/><text class="dg-s" x="131" y="106" text-anchor="middle">layer: dependencies</text>
  <rect class="dg-fill2" x="16" y="58" width="230" height="26" rx="4"/><text class="dg-s" x="131" y="76" text-anchor="middle">layer: app.jar</text>
  <text class="dg-s" x="131" y="164" text-anchor="middle">READ-ONLY, shared</text>
  <path class="dg-line" d="M250 92 H300 M250 88 L300 44 M250 96 L300 140" marker-end="url(#dl1)"/>
  <rect class="dg-fill" x="306" y="30" width="150" height="26" rx="4"/><text class="dg-s" x="381" y="48" text-anchor="middle">container 1 — writable</text>
  <rect class="dg-fill" x="306" y="80" width="150" height="26" rx="4"/><text class="dg-s" x="381" y="98" text-anchor="middle">container 2 — writable</text>
  <rect class="dg-fill" x="306" y="130" width="150" height="26" rx="4"/><text class="dg-s" x="381" y="148" text-anchor="middle">container 3 — writable</text>
  <text class="dg-s" x="470" y="88">only the thin top layer</text>
  <text class="dg-s" x="470" y="106">is per-container — which</text>
  <text class="dg-s" x="470" y="124">is why starting one is instant</text>
  <defs><marker id="dl1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th></th><th>Image</th><th>Container</th></tr>
<tr><td>What it is</td><td>An immutable template — a stack of read-only layers plus metadata</td><td>A running (or stopped) instance of an image</td></tr>
<tr><td>Analogy</td><td>A class</td><td>An object</td></tr>
<tr><td>Mutable</td><td>No</td><td>Yes — a thin writable layer on top</td></tr>
<tr><td>Count</td><td>One image</td><td>Many containers from it</td></tr>
<tr><td>Storage</td><td>Layers are shared and deduplicated across images</td><td>Only the diff, deleted with the container</td></tr>
</table>
<pre><code># Each Dockerfile instruction that changes the filesystem creates a LAYER
FROM eclipse-temurin:17-jre    # layer 1  (shared with every other image using it)
WORKDIR /app                   # metadata only, no layer content
COPY target/app.jar app.jar    # layer 2
RUN chmod +x /app/entry.sh     # layer 3

# Layers are content-addressed, so an identical layer is stored ONCE on disk
# and pulled ONCE over the network no matter how many images reference it.

docker image inspect myapp:1.0 --format '{{json .RootFS.Layers}}'
docker history myapp:1.0        # size contributed by each instruction</code></pre>
<pre><code># COPY-ON-WRITE: the container only stores what it CHANGES
# Reading /app/app.jar   -> served from the shared read-only layer
# Writing /app/app.jar   -> the whole file is copied UP into the writable layer first

# That is why writing large files inside a container is slow, and why
# databases must use a VOLUME rather than the container filesystem.

docker run --rm -v pgdata:/var/lib/postgresql/data postgres:16
#           ^ bypasses the union filesystem entirely — direct host I/O</code></pre>
<table>
<tr><th>Command</th><th>Does</th></tr>
<tr><td><code>docker build</code></td><td>Dockerfile → image</td></tr>
<tr><td><code>docker run</code></td><td>Image → new container, started</td></tr>
<tr><td><code>docker start / stop</code></td><td>Restarts or stops an existing container — data in its writable layer survives</td></tr>
<tr><td><code>docker rm</code></td><td>Deletes the container <strong>and its writable layer</strong></td></tr>
<tr><td><code>docker rmi</code></td><td>Deletes the image (only if no container references it)</td></tr>
<tr><td><code>docker commit</code></td><td>Container → image. Works, but it is a snapshot nobody can reproduce — use a Dockerfile.</td></tr>
<tr><td><code>docker system prune -a</code></td><td>Reclaims everything unused — careful, it removes volumes with <code>--volumes</code></td></tr>
</table>
<p><strong>The layer-caching consequence that matters most:</strong> changing any instruction invalidates that layer <em>and every layer after it</em>. So copy your dependency manifest and resolve dependencies before copying source — a one-line code change then rebuilds only the last layer instead of re-downloading every dependency.</p>
<p><strong>The container-vs-VM distinction, if asked:</strong> containers share the host kernel and isolate with namespaces (what a process can see) and cgroups (how much it can use). A VM runs its own kernel on a hypervisor. That is why a container starts in milliseconds and a VM in tens of seconds — and also why a container is a weaker security boundary, since a kernel vulnerability is shared by everything on the host.</p>`
},
{
  q: "How do you keep image builds fast in CI, and what is BuildKit?",
  level: "advanced", tags: ["performance", "cicd", "dockerfile"],
  companies: ["Amazon", "Optum", "Maersk", "Flipkart", "SAP", "EPAM", "Nagarro", "Walmart"],
  a: `<pre><code># syntax=docker/dockerfile:1.7
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src

# 1. Cache the dependency download SEPARATELY from the source
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \\
    mvn -B dependency:go-offline

# 2. Now the source. A code change invalidates only from here down.
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \\
    mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy
COPY --from=build /src/target/app.jar /app/app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]</code></pre>
<table>
<tr><th>BuildKit feature</th><th>What it buys</th></tr>
<tr><td><code>--mount=type=cache</code></td><td>A persistent package cache across builds that is <strong>not</strong> baked into a layer</td></tr>
<tr><td><code>--mount=type=secret</code></td><td>A token available during <code>RUN</code> that never lands in the image history</td></tr>
<tr><td><code>--mount=type=bind</code></td><td>Read files without copying them into a layer</td></tr>
<tr><td>Parallel stage execution</td><td>Independent multi-stage branches build concurrently</td></tr>
<tr><td>Skips unused stages</td><td>Only builds what the target actually needs</td></tr>
<tr><td><code>--platform</code> + buildx</td><td>Multi-architecture images (amd64 + arm64) from one command</td></tr>
</table>
<pre><code># Secrets during build, without leaking them
RUN --mount=type=secret,id=npmtoken \\
    NPM_TOKEN=$(cat /run/secrets/npmtoken) npm ci
# docker build --secret id=npmtoken,src=./token.txt .
# Compare with ARG NPM_TOKEN, which is visible forever in 'docker history'.</code></pre>
<pre><code># CI cache — the layer cache is empty on a fresh runner unless you import it
docker buildx build \\
  --cache-from type=registry,ref=ghcr.io/org/api:buildcache \\
  --cache-to   type=registry,ref=ghcr.io/org/api:buildcache,mode=max \\
  --push -t ghcr.io/org/api:$SHA .

# GitHub Actions equivalent
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Layer cache invalidation cascading from the changed instruction downward">
  <rect class="dg-fill2" x="16" y="30" width="250" height="24" rx="4"/><text class="dg-s" x="141" y="47" text-anchor="middle">FROM base — cached</text>
  <rect class="dg-fill2" x="16" y="58" width="250" height="24" rx="4"/><text class="dg-s" x="141" y="75" text-anchor="middle">COPY pom.xml — cached</text>
  <rect class="dg-fill2" x="16" y="86" width="250" height="24" rx="4"/><text class="dg-s" x="141" y="103" text-anchor="middle">RUN dependency:go-offline — cached</text>
  <rect class="dg-fill" x="16" y="114" width="250" height="24" rx="4"/><text class="dg-s" x="141" y="131" text-anchor="middle">COPY src — CHANGED</text>
  <text class="dg-s" x="300" y="60">everything above the change</text>
  <text class="dg-s" x="300" y="80">is reused; everything below</text>
  <text class="dg-s" x="300" y="100">it is rebuilt</text>
  <text class="dg-s" x="300" y="130">→ put the volatile parts LAST</text>
</svg>
</figure>
<table>
<tr><th>Speed-up</th><th>Typical effect</th></tr>
<tr><td>Order instructions least- to most-volatile</td><td>The largest single win — dependencies stop re-downloading</td></tr>
<tr><td><code>.dockerignore</code> (target/, .git, node_modules)</td><td>Smaller build context, so the upload to the daemon is faster</td></tr>
<tr><td>Registry or GHA cache import</td><td>Makes the layer cache work at all on ephemeral CI runners</td></tr>
<tr><td>Multi-stage with a slim runtime</td><td>Smaller image → faster push and faster pull on every node</td></tr>
<tr><td>Spring Boot layered jar</td><td>Dependencies and application code become separate layers</td></tr>
<tr><td>Pin base images by digest</td><td>Reproducible builds and a stable cache key</td></tr>
</table>
<pre><code># Spring Boot layered jars — dependencies rarely change, your code always does
FROM eclipse-temurin:17-jre AS extract
COPY target/app.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:17-jre
COPY --from=extract dependencies/          ./
COPY --from=extract spring-boot-loader/    ./
COPY --from=extract snapshot-dependencies/ ./
COPY --from=extract application/           ./     # only THIS changes per build
ENTRYPOINT ["java","org.springframework.boot.loader.launch.JarLauncher"]</code></pre>
<p><strong>The measurement point:</strong> "I would time the build first and find which step dominates. Usually it is dependency resolution, and the fix is instruction ordering plus a cache mount — not a bigger runner. Build time is a team-productivity number, so I treat it as something with a budget rather than something that just grows."</p>`
}
]);
