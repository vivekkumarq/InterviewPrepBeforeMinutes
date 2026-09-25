registerPrimer("kubernetes", `<h3>The mental model: you declare the state you want, controllers keep making it true</h3>
<p>You do not tell Kubernetes "start three containers". You tell it "there should be three copies of this app running", by writing that <strong>desired state</strong> in a YAML manifest and sending it to the API server. From then on, a set of <strong>controllers</strong> run in loops, each comparing desired state with actual state and acting to close the gap. If a node dies and one copy disappears, the gap reopens, and a controller starts a replacement without anyone being paged. This loop is called <strong>reconciliation</strong>, and it is the whole idea.</p>
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
<h3>Worked example: what happens after <code>kubectl apply</code></h3>
<pre><code>kubectl apply -f deployment.yaml      # replicas: 3, image: shop-api:1.4.2

1. API server   validates the YAML, checks your RBAC permissions, stores the
                Deployment in etcd. kubectl returns. NOTHING is running yet.
2. Deployment   controller sees a Deployment with no ReplicaSet -&gt; creates one.
3. ReplicaSet   controller sees "want 3 pods, have 0" -&gt; creates 3 Pod objects.
                They exist only as records, with no node assigned (Pending).
4. Scheduler    sees unscheduled pods, checks each node's free CPU/memory
                against the pods' REQUESTS, affinity and taints, and assigns a node.
5. kubelet      on each chosen node sees a pod assigned to it: pulls the image,
                starts the container, runs the probes.
6. Readiness    once the readiness probe passes, the pod's IP is added to the
                Service's endpoints and it starts receiving traffic.

Later: a node dies. Its pods vanish. The ReplicaSet controller sees
"want 3, have 2" and creates one more. Step 4 onwards repeats.</code></pre>
<h3>The objects you will be asked about</h3>
<table>
<tr><th>Object</th><th>Job</th></tr>
<tr><td>Pod</td><td>One or more containers sharing an IP and volumes; the unit that gets scheduled</td></tr>
<tr><td>Deployment</td><td>Keeps N identical stateless pods running; does rolling updates</td></tr>
<tr><td>StatefulSet</td><td>Pods with stable names and their own disks (databases, Kafka)</td></tr>
<tr><td>Service</td><td>A stable name and IP in front of a changing set of pods</td></tr>
<tr><td>Ingress / Gateway</td><td>HTTP routing from outside the cluster to Services</td></tr>
<tr><td>ConfigMap / Secret</td><td>Configuration and credentials, injected as env vars or files</td></tr>
<tr><td>HPA</td><td>Changes the replica count based on CPU or custom metrics</td></tr>
</table>`);

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
