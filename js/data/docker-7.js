registerPrimer("docker", `<p class="pr-lead"><b>Docker</b> packages your application together with everything it needs to run (the right Java version, libraries, settings) into one bundle called an <b>image</b>. That image runs the same way on your laptop, a colleague's laptop and the production server. It ends the classic "but it works on my machine" problem.</p>
<div class="pr-analogy"><b>Think of it like this</b>Before shipping containers, every port loaded cargo differently: sacks, barrels, crates. The standard steel container changed everything: whatever is inside, every ship, crane and truck handles it the same way. A Docker container does the same for software. Whatever language or libraries are inside, every server runs it the same way. The <b>image</b> is the packed container design; a running <b>container</b> is one actual box on a ship.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Image</dt><dd>A read-only package containing your app and everything it needs. Like a class, or a recipe.</dd>
<dt>Container</dt><dd>A running copy of an image. Like an object created from a class. You can run many containers from one image.</dd>
<dt>Dockerfile</dt><dd>A text file of step-by-step instructions for building an image.</dd>
<dt>Layer</dt><dd>Each Dockerfile step creates a layer. Unchanged layers are reused from cache, which makes rebuilds fast.</dd>
<dt>Registry</dt><dd>A place to store and share images, such as Docker Hub or GitHub Container Registry.</dd>
<dt>Volume</dt><dd>Storage that lives outside the container, so data survives when the container is removed.</dd>
<dt>Docker Compose</dt><dd>A file describing several containers (app, database, cache) that start together with one command.</dd>
</dl>

<h3>Container vs virtual machine</h3>
<p>A <b>virtual machine</b> runs a whole extra operating system, so it is heavy and slow to start. A <b>container</b> is just a normal process on the host machine, fenced off so it sees only its own files, network and processes, and limited in how much CPU and memory it can use. That is why containers start in about a second and use very little extra memory.</p>
<figure class="fig">
<svg viewBox="0 0 620 236" role="img" aria-label="Image layers stacked from base OS to app jar, with a writable container layer on top; containers share the host kernel unlike VMs">
  <text class="dg-t" x="10" y="20">An image is a stack of read-only layers</text>
  <rect class="dg-fill" x="10" y="30" width="290" height="30" rx="5"/><text class="dg-m" x="22" y="50">container layer (writable, thrown away)</text>
  <rect class="dg-fill2" x="10" y="66" width="290" height="28" rx="5"/><text class="dg-m" x="22" y="85">COPY app.jar          ~20 MB  changes often</text>
  <rect class="dg-box" x="10" y="98" width="290" height="28" rx="5"/><text class="dg-m" x="22" y="117">COPY dependencies     ~60 MB  changes rarely</text>
  <rect class="dg-box" x="10" y="130" width="290" height="28" rx="5"/><text class="dg-m" x="22" y="149">JRE                  ~120 MB  almost never</text>
  <rect class="dg-box" x="10" y="162" width="290" height="28" rx="5"/><text class="dg-m" x="22" y="181">base OS (debian-slim) ~30 MB  almost never</text>
  <text class="dg-s" x="10" y="208">rebuild after a code change: only the top image layer is rebuilt</text>
  <text class="dg-s" x="10" y="224">and pushed; every other layer comes from cache</text>
  <rect class="dg-box" x="330" y="30" width="280" height="160" rx="10"/>
  <text class="dg-t" x="342" y="50">One host</text>
  <rect class="dg-fill" x="346" y="62" width="76" height="46" rx="6"/><text class="dg-s" x="384" y="82" text-anchor="middle">container</text><text class="dg-s" x="384" y="97" text-anchor="middle">app A</text>
  <rect class="dg-fill" x="432" y="62" width="76" height="46" rx="6"/><text class="dg-s" x="470" y="82" text-anchor="middle">container</text><text class="dg-s" x="470" y="97" text-anchor="middle">app B</text>
  <rect class="dg-fill" x="518" y="62" width="76" height="46" rx="6"/><text class="dg-s" x="556" y="82" text-anchor="middle">container</text><text class="dg-s" x="556" y="97" text-anchor="middle">postgres</text>
  <rect class="dg-fill2" x="346" y="118" width="248" height="28" rx="6"/><text class="dg-t" x="470" y="137" text-anchor="middle">ONE shared Linux kernel</text>
  <rect class="dg-box" x="346" y="152" width="248" height="28" rx="6"/><text class="dg-s" x="470" y="171" text-anchor="middle">hardware</text>
  <text class="dg-s" x="342" y="208">a VM would put a whole guest OS</text>
  <text class="dg-s" x="342" y="224">inside each of those three boxes</text>
</svg>
<figcaption>Layers are shared between images and cached between builds. Order them from least to most frequently changed.</figcaption>
</figure>

<h3>Step by step: from code to a running container</h3>
<pre><code># Dockerfile for a Spring Boot app
FROM eclipse-temurin:21-jre           # 1. start from an image that has Java
WORKDIR /app                          # 2. work inside the /app folder
COPY target/app.jar app.jar           # 3. copy your built app into the image
USER 10001                            # 4. do not run as the all-powerful root user
EXPOSE 8080                           # 5. note which port the app listens on
ENTRYPOINT ["java", "-jar", "app.jar"]  # 6. the command that starts the app</code></pre>
<pre><code>docker build -t shop-api:1.0 .              # build an image from the Dockerfile
docker run -d -p 8080:8080 shop-api:1.0     # start a container in the background
docker logs -f &lt;container&gt;                  # watch its output
docker stop &lt;container&gt;                     # stop it politely</code></pre>
<ol class="pr-steps">
<li><code>docker build</code> reads the Dockerfile from top to bottom. Each line adds a layer to the image.</li>
<li>The image is saved with the name <code>shop-api</code> and the tag <code>1.0</code>.</li>
<li><code>docker run</code> creates a container from that image and starts the <code>ENTRYPOINT</code> command.</li>
<li><code>-p 8080:8080</code> connects port 8080 on your machine to port 8080 inside the container, so your browser can reach the app.</li>
<li>Anything the app writes inside the container is lost when the container is deleted, unless it is stored on a volume.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Huge images</p>
<p>Shipping the full JDK, Maven, source code and build caches can make a 1 GB image that is slow to upload, download and start.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use a <b>multi-stage build</b>: build in one stage with all the tools, then copy only the finished app into a small runtime image.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Slow rebuilds after every code change</p>
<p>If you copy your source code before downloading dependencies, any code change invalidates the cache and all dependencies download again.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> copy the dependency file (pom.xml) and download dependencies first, then copy the source code.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Storing data inside the container</p>
<p>A database running in a container without a volume loses all its data when the container is removed.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> mount a volume for any data that must survive, such as <code>-v pgdata:/var/lib/postgresql/data</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Running as root and using the <code>latest</code> tag</p>
<p>Root inside a container is risky if anything breaks out, and <code>latest</code> can silently change, so builds stop being repeatable.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> add a <code>USER</code> line, and use a specific version tag such as <code>eclipse-temurin:21-jre</code>.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>An image is the package; a container is a running copy of it.</li>
<li>Containers are lightweight processes, not full virtual machines.</li>
<li>Order Dockerfile steps from least to most frequently changed, so the cache works.</li>
<li>Use multi-stage builds, a non-root user and specific version tags.</li>
<li>Keep data in volumes and logs on standard output.</li>
</ul>
<p><b>Next:</b> the questions below cover Dockerfiles, layers, networking, volumes, Compose, security and debugging.</p>`);

appendTopic("docker", [
{
  q: "Write a Docker Compose file for a local stack: app, Postgres and Redis, started in the right order",
  level: "beginner", hot: true, tags: ["docker-compose", "healthchecks", "local-development", "must-know"],
  companies: ["Infosys", "TCS", "Accenture", "Capgemini", "Amazon", "Swiggy", "Razorpay"],
  a: `<p>"How would a new developer run this service locally?" The best answer is one command: <code>docker compose up</code>. Here is a file that does it properly, including the part most examples get wrong: waiting until the database is actually <em>ready</em>, not just started.</p>
<pre><code># compose.yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: shop
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: shop                 # local only; never real secrets here
    ports:
      - "5432:5432"                           # so you can connect with a DB tool
    volumes:
      - pgdata:/var/lib/postgresql/data       # data survives "docker compose down"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shop -d shop"]
      interval: 5s
      timeout: 3s
      retries: 10

  cache:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 10

  app:
    build: .                                  # uses the Dockerfile in this folder
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/shop    # "db" = service name
      SPRING_DATASOURCE_USERNAME: shop
      SPRING_DATASOURCE_PASSWORD: shop
      SPRING_DATA_REDIS_HOST: cache
    depends_on:
      db:
        condition: service_healthy            # wait for pg_isready, not just "started"
      cache:
        condition: service_healthy

volumes:
  pgdata:</code></pre>
<table>
<tr><th>Line</th><th>Why it is there</th></tr>
<tr><td><code>jdbc:postgresql://db:5432</code></td><td>Compose puts all services on one network where each is reachable <strong>by its service name</strong>. <code>localhost</code> inside the app container means the app container itself</td></tr>
<tr><td><code>condition: service_healthy</code></td><td>Plain <code>depends_on</code> only waits for the container to <em>start</em>. Postgres takes a few seconds more to accept connections, and the app would crash on startup</td></tr>
<tr><td>Named volume <code>pgdata</code></td><td>Keeps data between restarts. <code>docker compose down -v</code> deletes it when you want a clean slate</td></tr>
<tr><td><code>ports</code> on db</td><td>Only for your convenience from the host. Containers talk over the internal network without it</td></tr>
</table>
<pre><code>docker compose up -d --build      # build the app image, start everything in background
docker compose ps                 # status, including health
docker compose logs -f app        # follow one service's logs
docker compose exec db psql -U shop shop     # a SQL shell in the database
docker compose down               # stop and remove containers (keeps the volume)
docker compose down -v            # ...and delete the data too</code></pre>
<p><strong>Common problems, and their causes:</strong></p>
<table>
<tr><th>Symptom</th><th>Cause</th></tr>
<tr><td>App says "Connection refused" to <code>localhost:5432</code></td><td>Use the service name <code>db</code>, not localhost</td></tr>
<tr><td>App crashes once on startup, then works on restart</td><td>No health-based <code>depends_on</code></td></tr>
<tr><td>"Port is already allocated"</td><td>A local Postgres is already using 5432 on the host. Map <code>"5433:5432"</code></td></tr>
<tr><td>Code changes do not appear</td><td>Forgot <code>--build</code>; Compose reused the old image</td></tr>
<tr><td>Database changes from init scripts did not run</td><td>Init scripts only run when the data volume is empty. <code>down -v</code> and start again</td></tr>
</table>
<p><strong>Worth mentioning:</strong> for integration tests, Testcontainers starts the same images from test code, and Spring Boot 3.1+ can read a <code>compose.yaml</code> and start it automatically when you run the app in development (<code>spring-boot-docker-compose</code>).</p>`
},
{
  q: "The image works on your laptop but fails on the server with 'exec format error'. Explain multi-architecture images",
  level: "advanced", tags: ["buildx", "multi-arch", "arm64", "ci"],
  companies: ["Amazon", "Microsoft", "Atlassian", "Swiggy", "Zomato", "Apple", "Uber"],
  a: `<p><code>exec format error</code> means the container tried to run a binary built for a different CPU architecture. It became common when developers moved to Apple Silicon laptops (ARM, <code>arm64</code>) while most servers are still Intel/AMD (<code>amd64</code>), and when companies moved servers to ARM (AWS Graviton) for price.</p>
<pre><code># On an M-series Mac:
docker build -t shop-api:1.0 .        # builds an arm64 image, because the laptop is arm64
docker push shop-api:1.0

# On an amd64 server:
docker run shop-api:1.0
# exec /opt/java/openjdk/bin/java: exec format error
# The JRE binaries inside the image are ARM machine code.</code></pre>
<p><strong>The fix: build a multi-architecture image.</strong> One tag points to a <em>manifest list</em> (an index) that contains a separate image for each architecture. Each machine pulls the one that matches its CPU automatically.</p>
<pre><code>docker buildx create --use --name multi            # one-time setup
docker buildx build \\
    --platform linux/amd64,linux/arm64 \\
    -t registry.example.com/shop-api:1.4.2 \\
    --push .

docker buildx imagetools inspect registry.example.com/shop-api:1.4.2
#   Manifests:
#     Platform: linux/amd64   Digest: sha256:4b1c...
#     Platform: linux/arm64   Digest: sha256:9e7a...</code></pre>
<table>
<tr><th>How the other architecture gets built</th><th>Speed</th><th>Notes</th></tr>
<tr><td><strong>QEMU emulation</strong> (buildx default)</td><td>Slow: often 5 to 20× for compile-heavy steps</td><td>Zero setup. Fine for Java, where most work is copying jars</td></tr>
<tr><td><strong>Native builders</strong> for each architecture</td><td>Fast</td><td>An ARM runner and an x86 runner, joined into one builder</td></tr>
<tr><td><strong>Cross-compilation</strong> in the Dockerfile</td><td>Fast</td><td>Go and Rust do this easily with <code>$BUILDPLATFORM</code> and <code>$TARGETARCH</code></td></tr>
</table>
<pre><code># GitHub Actions: the standard setup
- uses: docker/setup-qemu-action@v3
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ghcr.io/acme/shop-api:\${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max</code></pre>
<p><strong>Why Java images are the easy case:</strong> your jar is bytecode and runs on any architecture. Only the base image (the JRE and OS) must match, and official images such as <code>eclipse-temurin</code> already publish both. The risk is native pieces: a JNI library, a <code>RUN</code> step that downloads an <code>x86_64</code> binary, or a GraalVM native image, which is compiled machine code and must be built per architecture.</p>
<pre><code># Quick checks
docker image inspect shop-api:1.0 --format '{{.Architecture}}'   # arm64 or amd64?
uname -m                                                           # what is this machine?
docker run --platform linux/amd64 shop-api:1.0     # force one (emulated on a Mac)</code></pre>
<p><strong>Why bother with ARM at all:</strong> ARM servers such as AWS Graviton are typically noticeably cheaper for the same throughput, which is often a double-digit percentage saving on compute. Multi-arch images let you move workloads without rebuilding anything.</p>`
}
]);
