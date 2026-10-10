registerPrimer("kubernetes", `<p class="pr-lead"><b>Kubernetes</b> (often written <b>K8s</b>) runs your containers across a group of machines and keeps them running. Docker runs one container on one machine. Kubernetes decides which machine each container should run on, restarts containers that crash, replaces machines that die, spreads traffic between copies, and rolls out new versions without downtime.</p>
<div class="pr-analogy"><b>Think of it like this</b>Kubernetes works like a thermostat. You do not switch the heater on and off yourself; you set the temperature you want, and the thermostat keeps checking and adjusting until the room matches. In Kubernetes you write "I want 3 copies of my app running", and it keeps checking and fixing things until that is true, including when a machine fails at 3 a.m.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Cluster</dt><dd>The whole group of machines Kubernetes manages.</dd>
<dt>Node</dt><dd>One machine (physical or virtual) in the cluster that runs containers.</dd>
<dt>Pod</dt><dd>The smallest unit Kubernetes runs: one container (sometimes a few) sharing an IP address.</dd>
<dt>Deployment</dt><dd>Keeps a chosen number of identical pods running, and updates them gradually to new versions.</dd>
<dt>Service</dt><dd>A stable name and address in front of a changing set of pods, spreading traffic between them.</dd>
<dt>Ingress</dt><dd>Routes web traffic from outside the cluster to the right Service, for example by URL path.</dd>
<dt>ConfigMap / Secret</dt><dd>Settings and passwords given to pods as environment variables or files.</dd>
<dt>Probe</dt><dd>A regular health check Kubernetes runs on each pod to decide whether to send it traffic or restart it.</dd>
</dl>

<h3>Step by step: what happens after <code>kubectl apply</code></h3>
<p>You send a file saying "run 3 copies of shop-api version 1.4". Then:</p>
<ol class="pr-steps">
<li>The <b>API server</b> checks the file and saves it. Nothing is running yet; Kubernetes has only recorded what you want.</li>
<li>The <b>Deployment controller</b> notices the new Deployment and asks for 3 pods.</li>
<li>The <b>scheduler</b> picks a node for each pod, based on how much CPU and memory each pod asks for and which nodes have room.</li>
<li>The <b>kubelet</b> (an agent on each node) downloads the image and starts the container.</li>
<li>When the pod's <b>readiness probe</b> passes, the Service starts sending it traffic.</li>
<li>If a node dies later, Kubernetes sees "want 3, have 2" and starts a replacement pod on another node, with nobody needing to step in.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 252" role="img" aria-label="Kubernetes control plane with API server, etcd, scheduler and controllers; worker nodes with kubelet running pods; kubectl apply flows through the API server">
  <defs><marker id="pr-k8s" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="10" y="20" width="90" height="46" rx="8"/><text class="dg-m" x="55" y="40" text-anchor="middle">kubectl</text><text class="dg-s" x="55" y="56" text-anchor="middle">apply -f</text>
  <line class="dg-line" x1="100" y1="43" x2="136" y2="43" marker-end="url(#pr-k8s)"/>
  <rect class="dg-box" x="138" y="10" width="472" height="112" rx="10"/>
  <text class="dg-t" x="150" y="30">Control plane</text>
  <rect class="dg-fill2" x="150" y="40" width="120" height="70" rx="8"/><text class="dg-t" x="210" y="66" text-anchor="middle">API server</text><text class="dg-s" x="210" y="82" text-anchor="middle">the only door;</text><text class="dg-s" x="210" y="96" text-anchor="middle">validates, stores</text>
  <line class="dg-line" x1="270" y1="75" x2="296" y2="75" marker-end="url(#pr-k8s)"/>
  <rect class="dg-box" x="298" y="40" width="90" height="70" rx="8"/><text class="dg-t" x="343" y="66" text-anchor="middle">etcd</text><text class="dg-s" x="343" y="82" text-anchor="middle">desired +</text><text class="dg-s" x="343" y="96" text-anchor="middle">actual state</text>
  <rect class="dg-fill" x="400" y="40" width="96" height="70" rx="8"/><text class="dg-t" x="448" y="66" text-anchor="middle">Scheduler</text><text class="dg-s" x="448" y="82" text-anchor="middle">picks a node</text><text class="dg-s" x="448" y="96" text-anchor="middle">for each pod</text>
  <rect class="dg-fill" x="504" y="40" width="96" height="70" rx="8"/><text class="dg-t" x="552" y="66" text-anchor="middle">Controllers</text><text class="dg-s" x="552" y="82" text-anchor="middle">close the gap,</text><text class="dg-s" x="552" y="96" text-anchor="middle">forever</text>
  <line class="dg-line" x1="210" y1="110" x2="170" y2="150" marker-end="url(#pr-k8s)"/>
  <line class="dg-line" x1="210" y1="110" x2="420" y2="150" marker-end="url(#pr-k8s)"/>
  <rect class="dg-box" x="10" y="152" width="290" height="88" rx="10"/>
  <text class="dg-t" x="22" y="172">Node 1</text>
  <text class="dg-s" x="80" y="172">kubelet: runs what it is assigned</text>
  <rect class="dg-fill2" x="22" y="182" width="84" height="46" rx="6"/><text class="dg-s" x="64" y="202" text-anchor="middle">pod</text><text class="dg-s" x="64" y="217" text-anchor="middle">shop-api</text>
  <rect class="dg-fill2" x="114" y="182" width="84" height="46" rx="6"/><text class="dg-s" x="156" y="202" text-anchor="middle">pod</text><text class="dg-s" x="156" y="217" text-anchor="middle">shop-api</text>
  <rect class="dg-box" x="206" y="182" width="84" height="46" rx="6"/><text class="dg-s" x="248" y="202" text-anchor="middle">pod</text><text class="dg-s" x="248" y="217" text-anchor="middle">other app</text>
  <rect class="dg-box" x="320" y="152" width="290" height="88" rx="10"/>
  <text class="dg-t" x="332" y="172">Node 2</text>
  <text class="dg-s" x="390" y="172">kubelet</text>
  <rect class="dg-fill2" x="332" y="182" width="84" height="46" rx="6"/><text class="dg-s" x="374" y="202" text-anchor="middle">pod</text><text class="dg-s" x="374" y="217" text-anchor="middle">shop-api</text>
  <text class="dg-s" x="430" y="202">desired 3, actual 3</text>
  <text class="dg-s" x="430" y="217">nothing to do</text>
</svg>
<figcaption>Every component talks only to the API server. Nothing is started by a direct command; it is started because the stored state says it should exist.</figcaption>
</figure>

<h3>A worked example: a minimal Deployment and Service</h3>
<pre><code>apiVersion: apps/v1
kind: Deployment
metadata: { name: shop-api }
spec:
  replicas: 3                          # keep 3 copies running
  selector: { matchLabels: { app: shop-api } }
  template:
    metadata: { labels: { app: shop-api } }
    spec:
      containers:
        - name: api
          image: shop-api:1.4.2
          ports: [ { containerPort: 8080 } ]
          resources:
            requests: { cpu: 250m, memory: 512Mi }   # what it needs
            limits:   { memory: 768Mi }              # the most it may use
          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: 8080 }
---
apiVersion: v1
kind: Service
metadata: { name: shop-api }
spec:
  selector: { app: shop-api }          # send traffic to pods with this label
  ports: [ { port: 80, targetPort: 8080 } ]</code></pre>
<ol class="pr-steps">
<li><code>replicas: 3</code> means Kubernetes keeps exactly three pods running.</li>
<li>The pods get the label <code>app: shop-api</code>; the Service finds them through that same label.</li>
<li><code>requests</code> tells the scheduler how much CPU and memory to reserve; <code>limits</code> caps usage. A pod using more memory than its limit is killed and restarted.</li>
<li>The readiness probe stops traffic going to a pod until it is actually ready.</li>
<li>Other services can now call <code>http://shop-api</code>, and Kubernetes spreads the calls over the three pods.</li>
</ol>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ No resource requests or limits</p>
<p>Without requests, the scheduler cannot place pods sensibly, and one hungry pod can starve its neighbours on the same node.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> set requests based on real usage, and a memory limit on every container.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Mixing up liveness and readiness probes</p>
<p>A liveness probe that checks the database restarts all your pods whenever the database hiccups, turning a small problem into an outage.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> liveness asks only "is the process stuck?". Readiness asks "can I take traffic right now?".</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Thinking Secrets are encrypted</p>
<p>A Kubernetes Secret is only base64-encoded, which anyone with access can decode in a second.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> restrict who can read Secrets, turn on encryption at rest, or use an external secret manager.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ A Service with no endpoints</p>
<p>If the Service's selector labels do not exactly match the pod labels, the Service has nothing to send traffic to.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> check with <code>kubectl get endpoints &lt;service&gt;</code> and make the labels match.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>You declare what you want; Kubernetes keeps making it true.</li>
<li>Pods run your containers; Deployments keep the right number of them running.</li>
<li>Services give pods a stable name; Ingress brings outside traffic in.</li>
<li>Always set resource requests, limits and probes.</li>
<li>Debug with <code>kubectl describe</code>, <code>kubectl logs --previous</code> and <code>kubectl get events</code>.</li>
</ul>
<p><b>Next:</b> the questions below cover the architecture, workloads, networking, scaling, deployments and debugging pods.</p>`);

appendTopic("kubernetes", [
{
  q: "Write the manifests for a production-ready Spring Boot service and explain every field",
  level: "advanced", hot: true, tags: ["deployment", "probes", "resources", "manifests", "must-know"],
  companies: ["Amazon", "Microsoft", "Walmart", "Swiggy", "Flipkart", "Atlassian", "Red Hat"],
  a: `<p>Anyone can copy a minimal Deployment. The interview checks whether you know <em>why</em> each production field is there. Here is a complete set, with the reason next to every line that matters.</p>
<pre><code>apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-api
  labels: { app: shop-api }
spec:
  replicas: 3                                   # survive one pod or node failing
  revisionHistoryLimit: 5                       # enough history for a rollback
  strategy:
    rollingUpdate:
      maxUnavailable: 0                         # never drop below 3 during a deploy
      maxSurge: 1                               # add one new pod at a time
  selector:
    matchLabels: { app: shop-api }
  template:
    metadata:
      labels: { app: shop-api }
    spec:
      terminationGracePeriodSeconds: 45         # time to finish in-flight requests
      securityContext:
        runAsNonRoot: true
      topologySpreadConstraints:                # do not put all 3 on one node
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector: { matchLabels: { app: shop-api } }
      containers:
        - name: app
          image: ghcr.io/acme/shop-api:1.4.2    # an exact version, never :latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod
            - name: JAVA_TOOL_OPTIONS
              value: "-XX:MaxRAMPercentage=70"   # heap sized from the memory limit
            - name: SPRING_DATASOURCE_PASSWORD
              valueFrom:
                secretKeyRef: { name: shop-db, key: password }
          resources:
            requests: { cpu: "500m", memory: "1Gi" }   # what the scheduler reserves
            limits:   { memory: "1Gi" }                # memory limit = request
          startupProbe:                         # JVM warm-up: allow up to 2 minutes
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            periodSeconds: 5
            failureThreshold: 24
          livenessProbe:                        # restart only if truly stuck
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:                       # send traffic only when ready
            httpGet: { path: /actuator/health/readiness, port: 8080 }
            periodSeconds: 5
            failureThreshold: 2
          lifecycle:
            preStop:
              exec: { command: ["sh", "-c", "sleep 10"] }   # see below</code></pre>
<pre><code>---
apiVersion: v1
kind: Service
metadata: { name: shop-api }
spec:
  selector: { app: shop-api }
  ports: [{ port: 80, targetPort: 8080 }]
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: shop-api }
spec:
  minAvailable: 2                               # node drains keep at least 2 running
  selector: { matchLabels: { app: shop-api } }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: shop-api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: shop-api }
  minReplicas: 3
  maxReplicas: 12
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }</code></pre>
<table>
<tr><th>Field</th><th>What goes wrong without it</th></tr>
<tr><td><code>maxUnavailable: 0</code></td><td>Deploys briefly run with fewer pods than you planned for</td></tr>
<tr><td>Memory limit = request, no CPU limit</td><td>A lower request lets nodes overcommit and pods get OOM-killed under pressure; a CPU limit throttles the JVM (GC and JIT threads) even when the node is idle</td></tr>
<tr><td><code>MaxRAMPercentage</code></td><td>Heap sized too big for the limit: the kernel kills the pod with exit code 137</td></tr>
<tr><td><code>startupProbe</code></td><td>The liveness probe kills a slow-starting JVM before it ever becomes healthy, forever (CrashLoopBackOff)</td></tr>
<tr><td>Liveness separate from readiness</td><td>A slow database makes liveness fail and Kubernetes restarts every pod at once, turning a slowdown into an outage. Liveness should check only the process itself</td></tr>
<tr><td><code>preStop</code> sleep</td><td>Pod removal from load balancers is asynchronous; without a short pause, requests still arrive after the app starts shutting down, and users see 502s</td></tr>
<tr><td><code>server.shutdown=graceful</code> in Spring</td><td>In-flight requests are cut off at SIGTERM</td></tr>
<tr><td>PodDisruptionBudget</td><td>A node upgrade can drain all replicas at the same moment</td></tr>
<tr><td>Topology spread</td><td>All replicas on one node: one node failure is a full outage</td></tr>
</table>
<p><strong>The Spring side of it:</strong> <code>management.endpoint.health.probes.enabled=true</code> exposes the <code>/liveness</code> and <code>/readiness</code> groups (on by default when Boot detects Kubernetes), and <code>server.shutdown=graceful</code> with <code>spring.lifecycle.timeout-per-shutdown-phase=30s</code> lets in-flight requests finish within the 45-second grace period.</p>`
},
{
  q: "How do you keep a service up while nodes are drained for maintenance? PodDisruptionBudgets explained",
  level: "advanced", tags: ["pdb", "node-drain", "availability", "upgrades"],
  companies: ["Amazon", "Google", "Microsoft", "Red Hat", "Walmart", "Uber", "Atlassian"],
  a: `<p>Clusters are maintained constantly: node OS patches, Kubernetes upgrades, the cluster autoscaler removing idle nodes, spot instances being reclaimed. Each of those <strong>drains</strong> a node: its pods are evicted and recreated elsewhere. Without guidance, Kubernetes may evict every replica of your service at the same moment.</p>
<pre><code>Service with 3 replicas, spread over nodes A, B and C.
The platform team upgrades the node pool: drain A, B and C in parallel.

Without a PDB:  all 3 pods evicted within seconds -&gt; 0 ready pods
                -&gt; outage until new pods start and pass readiness (30-90s for a JVM)

With a PDB:     minAvailable: 2
                -&gt; drain of A evicts one pod.               2 left: OK
                -&gt; drain of B tries to evict: would leave 1 -&gt; REFUSED, retried
                -&gt; the replacement for A's pod becomes Ready: 3 again
                -&gt; drain of B may now proceed. And so on.</code></pre>
<pre><code>apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: shop-api
spec:
  minAvailable: 2                 # or: maxUnavailable: 1
  selector:
    matchLabels:
      app: shop-api</code></pre>
<table>
<tr><th>Disruption</th><th>Respects the PDB?</th></tr>
<tr><td><code>kubectl drain</code>, node upgrades, cluster autoscaler scale-down</td><td><strong>Yes</strong>: these use the Eviction API, which checks the budget</td></tr>
<tr><td>A node crashing or losing power</td><td><strong>No</strong>: that is an involuntary disruption. Replicas and spreading protect you here, not the PDB</td></tr>
<tr><td><code>kubectl delete pod</code></td><td><strong>No</strong>: deleting directly bypasses the eviction check</td></tr>
<tr><td>Your own rolling update</td><td>No: the Deployment's <code>maxUnavailable</code> governs that</td></tr>
</table>
<p><strong>The mistakes that cause real incidents:</strong></p>
<pre><code># 1. A budget that can never be satisfied: blocks node drains forever
replicas: 2
minAvailable: 2          # evicting ANY pod breaks the budget -&gt; the drain hangs
                         # and the platform team's upgrade stalls at 2am

# Safer: express it as a disruption allowance
maxUnavailable: 1        # always allows one at a time, whatever the replica count

# 2. A PDB on a single-replica service
replicas: 1
minAvailable: 1          # same deadlock. One replica cannot be highly available;
                         # fix the replica count rather than the PDB

# 3. Pods that are never Ready count as unavailable. A crash-looping
#    deployment with a PDB can block drains; unhealthyPodEvictionPolicy:
#    AlwaysAllow (Kubernetes 1.27+) lets unhealthy pods be evicted anyway.</code></pre>
<p><strong>A PDB only works together with other settings:</strong></p>
<table>
<tr><th>Setting</th><th>Why the PDB needs it</th></tr>
<tr><td>At least 2 or 3 replicas</td><td>There must be something left to keep available</td></tr>
<tr><td>Topology spread across nodes and zones</td><td>If all replicas share one node, draining that node takes them all regardless</td></tr>
<tr><td>A correct readiness probe</td><td>The budget counts <em>ready</em> pods; a pod that reports ready too early lets drains go too fast</td></tr>
<tr><td>Graceful shutdown</td><td>Evicted pods get SIGTERM; in-flight requests need time to finish</td></tr>
</table>
<p><strong>The answer in one breath:</strong> "A PodDisruptionBudget limits how many of my pods voluntary disruptions like drains and upgrades may take down at once. I use <code>maxUnavailable: 1</code> so it never deadlocks, with enough replicas spread across nodes, because it does nothing for a node that simply dies."</p>`
}
]);
