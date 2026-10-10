registerSimple("docker", {
"What is the difference between COPY and ADD, and ARG and ENV?":
`<b>COPY</b> copies files from your project into the image. <b>ADD</b> does the same but can also unpack archives and download URLs, which can surprise you, so prefer COPY. <b>ARG</b> is a value available only while building the image. <b>ENV</b> is an environment variable that stays in the image and is available to the running app.`,

"How do you reduce Docker image size in practice?":
`Use a multi-stage build so build tools never reach the final image, start from a small base image (a JRE rather than a full JDK, or a slim or distroless image), add a <code>.dockerignore</code> file so unneeded files are not copied, and clean up package caches in the same step that installs them.`,

"How do you debug a running container's networking and DNS?":
`Get a shell inside with <code>docker exec -it &lt;name&gt; sh</code> and test from there: can it resolve the other service's name, and can it connect to its port? Most problems are containers on different networks, the app listening on 127.0.0.1 instead of 0.0.0.0, or confusion between the container's port and the published host port.`,

"What are container resource limits and how do they interact with the JVM?":
`You can limit a container's memory and CPU, for example <code>--memory 1g</code>. Modern Java versions read that limit and size themselves to fit. Set heap size as a percentage (<code>-XX:MaxRAMPercentage=75</code>) rather than a fixed number, leaving room for non-heap memory, otherwise the container is killed for using too much.`,

"How do you handle logging and signals in containers?":
`Write logs to standard output, not to files; Docker collects them and they can be shipped to a central system. When stopping a container, Docker sends a polite "stop" signal (SIGTERM) and later forces it. Use the JSON form of ENTRYPOINT so your app receives that signal directly and can shut down gracefully.`,

"What are Docker build caching strategies for CI?":
`CI machines often start empty, so nothing is cached and every build downloads everything again. Fix it by ordering Dockerfile steps so dependencies are fetched before source code is copied, and by using BuildKit to save and reuse the layer cache between builds, for example in your registry or the CI cache.`,

"What is the difference between a container image manifest, layer and digest?":
`A <b>layer</b> is one compressed set of file changes. The <b>manifest</b> is the list describing which layers and settings make up an image. The <b>digest</b> is a fingerprint (a SHA-256 hash) of that manifest, which identifies an exact image forever, unlike a tag such as <code>:1.0</code> that can be moved to a different image.`,

"How do you run databases and stateful services in Docker for development?":
`Use Docker Compose to start the database next to your app, store its data in a named volume so it survives restarts, and add a health check so your app waits until the database is actually ready to accept connections, not just until its container has started.`,

"What are Docker health checks and restart policies?":
`A <b>health check</b> is a command Docker runs regularly to see whether your app is really working, such as calling its health URL. A <b>restart policy</b> tells Docker what to do when a container stops, for example <code>--restart unless-stopped</code> to restart it automatically after a crash.`,

"How do you handle time zones, locales and the JVM inside containers?":
`Small base images may lack time zone data, so time zone lookups fail or default to UTC. Install the time zone package if needed, set the time zone explicitly, and ideally store and process times in UTC, converting to local time only when displaying them.`,

"What is Docker Swarm and how does it compare to Kubernetes?":
`Both run containers across many machines. <b>Docker Swarm</b> is simple and quick to set up, using familiar Compose-style files. <b>Kubernetes</b> is much more powerful and is the industry standard, with a huge ecosystem, but it is also more complex. Most companies use Kubernetes, often as a managed cloud service.`,

"How do you optimise container startup time?":
`Use a smaller image so it downloads faster, avoid unnecessary work when the app starts, and for Java consider class data sharing (CDS), lazy initialisation, or a GraalVM native image for very fast startup. Faster startup means quicker scaling and faster deployments.`,

"Your Docker image is 1.2 GB — how do you shrink it?":
`Most of that is usually build tools and caches. Use a multi-stage build so Maven, the JDK and source code stay in the build stage, use a JRE base instead of a JDK, add a <code>.dockerignore</code> file, and remove package manager caches. Together these often bring a Java image down to around 200 MB.`,

"Explain Docker networking — how do containers talk to each other and to the host?":
`Containers on the same user-defined network can reach each other by container name, for example <code>http://db:5432</code>. To reach a container from your own machine, publish its port with <code>-p 8080:8080</code>. Inside a container, "localhost" means the container itself, not your machine.`,

"What is the difference between a volume, a bind mount and tmpfs — and how do you not lose data?":
`A <b>named volume</b> is storage managed by Docker that survives container removal; use it for databases. A <b>bind mount</b> links a folder on your machine into the container, handy for live code changes during development. <b>tmpfs</b> is in memory only and disappears when the container stops. Any data you need to keep belongs in a volume.`,

"How do you debug a container that keeps crashing or exits immediately?":
`Read its logs with <code>docker logs</code>, check the exit code with <code>docker inspect</code> (137 often means it ran out of memory), and run the image with a shell instead of its normal command to look around. A container that exits immediately often has no long-running main process.`,

"How do you secure a Docker image and container in production?":
`Run as a non-root user, use a minimal base image, scan images for known vulnerabilities (for example with Trivy), never put secrets in the image, make the filesystem read-only where possible, drop unneeded Linux permissions, and pin base images to specific versions.`,

"What is the difference between an image, a container, and a layer?":
`An <b>image</b> is a read-only package of your app and its dependencies. A <b>container</b> is a running copy of an image, with its own small writable area. A <b>layer</b> is one piece of an image, created by one Dockerfile step; layers are shared between images and cached to make builds fast.`,

"How do you keep image builds fast in CI, and what is BuildKit?":
`BuildKit is Docker's modern build engine. It can run independent steps in parallel, keep a cache of downloaded packages between builds, handle secrets safely during builds, and store the layer cache remotely so fresh CI machines can reuse it. Combined with well-ordered Dockerfile steps, builds become much faster.`,

"How does Docker networking work, and how do containers talk to each other?":
`By default containers join a private bridge network. On a network you create yourself (which Compose does automatically), containers can call each other by name. To make a container reachable from outside, publish a port with <code>-p hostPort:containerPort</code>.`,

"How do you harden a container image for production?":
`Use a minimal base image (distroless or JRE-only), run as a non-root user, remove shells and tools you do not need, scan for vulnerabilities, keep secrets out of the image, use a read-only filesystem, and rebuild regularly so security fixes in the base image are picked up.`,

"Write a Docker Compose file for a local stack: app, Postgres and Redis, started in the right order":
`Define three services in <code>compose.yaml</code>: postgres and redis with health checks and a volume for the database data, and the app with <code>depends_on</code> set to wait until both are healthy. Then a new developer can start everything with a single <code>docker compose up</code>.`,

"The image works on your laptop but fails on the server with 'exec format error'. Explain multi-architecture images":
`Your laptop (for example an Apple Silicon Mac) may use an ARM processor while the server uses Intel/AMD (x86). An image built on one will not run on the other and fails with "exec format error". Build multi-architecture images with <code>docker buildx --platform linux/amd64,linux/arm64</code>, so each machine pulls the right version.`,

"What is Docker and how does a container differ from a VM?":
`Docker packages an app with everything it needs into a container that runs the same anywhere. A virtual machine includes a whole operating system and is heavy. A container shares the host's operating system and is just an isolated process, so it starts in seconds and uses far less memory.`,

"What is the difference between an image and a container?":
`An <b>image</b> is the read-only template, like a class or a recipe. A <b>container</b> is a running instance created from that image, like an object or a cooked dish. You can start many containers from one image, and each has its own temporary writable space.`,

"How do Docker image layers and caching work?":
`Each Dockerfile instruction creates a layer. When you rebuild, Docker reuses any layer whose instruction and inputs have not changed, but once one step changes, every step after it is rebuilt. So put rarely changing steps (installing dependencies) first and frequently changing ones (copying your code) last.`,

"What is a multi-stage build and why does it matter?":
`A multi-stage build uses one stage with all the build tools to compile your app, then a second, small stage that copies in only the finished result. The final image contains no compilers, source code or caches, so it is smaller, faster to deploy and has fewer security weaknesses.`,

"CMD vs ENTRYPOINT vs RUN":
`<b>RUN</b> executes a command while building the image, such as installing a package. <b>ENTRYPOINT</b> is the main command the container runs when it starts. <b>CMD</b> provides default arguments (or a default command) that can easily be overridden when you run the container.`,

"How does Docker networking work?":
`Docker gives containers their own private networks. On a user-defined bridge network, containers find each other by name. The host network mode shares the machine's network directly. Overlay networks connect containers across several machines. Publish ports to let outside traffic reach a container.`,

"What are volumes and how do you persist data?":
`Anything written inside a container is lost when it is removed. To keep data, store it outside the container: a <b>named volume</b> (managed by Docker, best for databases) or a <b>bind mount</b> (a folder from your machine, handy in development). Mount it with <code>-v name:/path</code>.`,

"How do you write a production-ready Dockerfile? What are the best practices?":
`Pin the base image to a specific version, use a multi-stage build, order steps so caching works, add a <code>.dockerignore</code>, run as a non-root user, use the JSON form of ENTRYPOINT, keep secrets out of the image, and add a health check.`,

"What is Docker Compose and when do you use it?":
`Docker Compose describes several containers (your app, a database, a cache) in one YAML file and starts them all together with <code>docker compose up</code>. It sets up a shared network and the start order. It is ideal for local development and testing; production usually uses Kubernetes.`,

"How do you debug a container that keeps crashing?":
`Check the logs first, including the previous run's logs. Look at the exit code: 137 usually means out of memory, 1 means the app itself failed. Start the image with a shell to explore it, and check that configuration such as environment variables, files and network addresses is correct.`,

"How do you make Docker images secure?":
`Start from a minimal base image, run as a non-root user, scan images for vulnerabilities in your CI pipeline, never bake passwords or keys into the image, pin versions, and rebuild regularly to pick up security fixes.`,

"How do you run a Spring Boot application in Docker efficiently?":
`Use a multi-stage build and Spring Boot's layered jar, so dependencies sit in their own cached layer and only your small application layer changes with each build. Use a JRE base image, a non-root user, <code>MaxRAMPercentage</code> instead of a fixed heap size, and graceful shutdown.`,

"What is a container registry and how do you manage image tags?":
`A registry stores and shares images, such as Docker Hub, GitHub Container Registry or AWS ECR. Tag each image with something meaningful, such as the version number or the git commit, instead of only <code>latest</code>, so you always know exactly what is running and can roll back to a previous version.`
});
