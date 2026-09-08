appendTopic("kubernetes", [
{
  q: "A pod is stuck in CrashLoopBackOff — how do you diagnose it?",
  level: "advanced", hot: true, tags: ["debugging", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Nagarro"],
  a: `<pre><code># 1. What does Kubernetes itself say? Events are at the BOTTOM.
kubectl describe pod &lt;pod&gt;

# 2. The crash output is in the PREVIOUS container, not the current one
kubectl logs &lt;pod&gt; --previous
kubectl logs &lt;pod&gt; -c &lt;container&gt; --previous     # multi-container pod

# 3. Why did it terminate?
kubectl get pod &lt;pod&gt; -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'
# {"exitCode":137,"reason":"OOMKilled", ...}

# 4. Cluster-wide events, newest last
kubectl get events --sort-by=.lastTimestamp -A | tail -30

# 5. Get a shell WITHOUT the app running (override the command)
kubectl debug -it &lt;pod&gt; --image=nicolaka/netshoot --target=&lt;container&gt;
kubectl run tmp --rm -it --image=myapp:tag --command -- sh</code></pre>
<table>
<tr><th>Status</th><th>Meaning</th><th>Where to look</th></tr>
<tr><td><strong>CrashLoopBackOff</strong></td><td>Container starts then exits, repeatedly</td><td><code>logs --previous</code> — an app failure until proven otherwise</td></tr>
<tr><td><strong>ImagePullBackOff</strong></td><td>Cannot fetch the image</td><td>Wrong tag, private registry without <code>imagePullSecrets</code>, wrong architecture</td></tr>
<tr><td><strong>Pending</strong></td><td>Never scheduled</td><td><code>describe</code> events: insufficient CPU/memory, taints, unbound PVC</td></tr>
<tr><td><strong>OOMKilled (137)</strong></td><td>Exceeded its memory limit</td><td>Raise the limit or fix the leak — for the JVM, <code>MaxRAMPercentage</code></td></tr>
<tr><td><strong>Init:Error</strong></td><td>An init container failed</td><td><code>logs &lt;pod&gt; -c &lt;init-container&gt;</code></td></tr>
<tr><td><strong>Terminating</strong> forever</td><td>A finalizer, or SIGTERM ignored</td><td>Check finalizers; check the app handles SIGTERM</td></tr>
<tr><td><strong>Running but 0/1 Ready</strong></td><td>Readiness probe failing</td><td>Probe path, port, or the app is genuinely not ready</td></tr>
</table>
<p><strong>The two causes that account for most real cases:</strong></p>
<ol>
<li><strong>A misconfigured liveness probe</strong> — the app is fine but slow to start, the probe fails, Kubernetes kills it, it restarts, repeat forever. The fix is a <code>startupProbe</code>, which suspends liveness until the app is up, instead of inflating <code>initialDelaySeconds</code>.</li>
<li><strong>Missing configuration</strong> — a ConfigMap key or Secret that does not exist. The pod will not even start; <code>describe</code> shows it plainly in the events.</li>
</ol>
<pre><code>startupProbe:                       # allows up to 5 minutes to boot
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  failureThreshold: 30
  periodSeconds: 10
livenessProbe:                      # only "is it deadlocked" — never call dependencies
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
readinessProbe:                     # "can it serve traffic" — may check dependencies
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5</code></pre>`
},
{
  q: "Explain requests, limits and QoS classes — how does Kubernetes decide what to evict?",
  level: "advanced", hot: true, tags: ["resources", "scheduling"],
  companies: ["Amazon", "Google", "Flipkart", "Walmart", "SAP", "Optum"],
  a: `<pre><code>resources:
  requests:            # used for SCHEDULING — how much the node reserves
    cpu: "250m"
    memory: "512Mi"
  limits:              # used for ENFORCEMENT — the hard ceiling
    cpu: "1000m"
    memory: "512Mi"</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 170" role="img" aria-label="QoS classes and eviction order">
  <rect class="dg-fill" x="16" y="20" width="180" height="120" rx="8"/>
  <text class="dg-t" x="106" y="44" text-anchor="middle">Guaranteed</text>
  <text class="dg-s" x="106" y="66" text-anchor="middle">requests == limits</text>
  <text class="dg-s" x="106" y="84" text-anchor="middle">for every container</text>
  <text class="dg-s" x="106" y="112" text-anchor="middle">evicted LAST</text>
  <rect class="dg-fill2" x="216" y="20" width="180" height="120" rx="8"/>
  <text class="dg-t" x="306" y="44" text-anchor="middle">Burstable</text>
  <text class="dg-s" x="306" y="66" text-anchor="middle">requests &lt; limits</text>
  <text class="dg-s" x="306" y="84" text-anchor="middle">(or only requests)</text>
  <text class="dg-s" x="306" y="112" text-anchor="middle">evicted second</text>
  <rect class="dg-box" x="416" y="20" width="188" height="120" rx="8"/>
  <text class="dg-t" x="510" y="44" text-anchor="middle">BestEffort</text>
  <text class="dg-s" x="510" y="66" text-anchor="middle">nothing specified</text>
  <text class="dg-s" x="510" y="112" text-anchor="middle">evicted FIRST</text>
</svg>
</figure>
<table>
<tr><th></th><th>CPU (compressible)</th><th>Memory (incompressible)</th></tr>
<tr><td>Over the limit</td><td><strong>Throttled</strong> — slow, but alive</td><td><strong>OOMKilled</strong> — killed immediately</td></tr>
<tr><td>Node under pressure</td><td>Shared proportionally to requests</td><td>kubelet <strong>evicts pods</strong> by QoS class</td></tr>
</table>
<p><strong>The asymmetry is the whole answer:</strong> CPU is compressible so exceeding a limit only slows you down; memory is not, so exceeding it is fatal. That leads to a specific recommendation many teams get wrong:</p>
<ul>
<li><strong>Always set a memory limit, and set requests == limits for memory.</strong> This makes eviction predictable.</li>
<li><strong>Consider omitting the CPU limit</strong> for latency-sensitive services. CFS throttling is enforced in 100 ms slices, so a service well under its average limit can still be throttled hard during bursts — which shows up as inexplicable p99 latency. Set a request (which guarantees a share) and let it burst.</li>
</ul>
<pre><code># Is anything being throttled? This metric explains a lot of "random" latency.
container_cpu_cfs_throttled_seconds_total

# Are requests set anywhere near reality?
kubectl top pods --sort-by=memory
kubectl describe node &lt;node&gt; | grep -A8 "Allocated resources"</code></pre>
<p><strong>The JVM footnote that interviewers like:</strong> before Java 10 the JVM read the host's memory, not the cgroup limit, and sized a huge heap that instantly got OOMKilled. Modern JVMs are container-aware — but you still want <code>-XX:MaxRAMPercentage=75</code> rather than a fixed <code>-Xmx</code>, leaving headroom for metaspace, thread stacks and native buffers, which live outside the heap and still count against the limit.</p>`
},
{
  q: "How does a Service route traffic, and what is the difference between ClusterIP, NodePort, LoadBalancer and Ingress?",
  level: "beginner", hot: true, tags: ["networking", "basics"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 210" role="img" aria-label="Ingress to Service to Pods routing">
  <rect class="dg-box" x="14" y="80" width="86" height="40" rx="6"/><text class="dg-s" x="57" y="105" text-anchor="middle">Client</text>
  <path class="dg-line" d="M104 100 H144" marker-end="url(#k2)"/>
  <rect class="dg-fill" x="148" y="72" width="106" height="56" rx="8"/>
  <text class="dg-s" x="201" y="94" text-anchor="middle">Ingress</text><text class="dg-s" x="201" y="112" text-anchor="middle">host + path</text>
  <path class="dg-line" d="M258 88 H300" marker-end="url(#k2)"/>
  <path class="dg-line" d="M258 112 H300" marker-end="url(#k2)"/>
  <rect class="dg-fill2" x="304" y="52" width="112" height="46" rx="6"/>
  <text class="dg-s" x="360" y="70" text-anchor="middle">Service: api</text><text class="dg-s" x="360" y="88" text-anchor="middle">ClusterIP</text>
  <rect class="dg-fill2" x="304" y="112" width="112" height="46" rx="6"/>
  <text class="dg-s" x="360" y="130" text-anchor="middle">Service: web</text><text class="dg-s" x="360" y="148" text-anchor="middle">ClusterIP</text>
  <path class="dg-line" d="M420 66 H466" marker-end="url(#k2)"/>
  <path class="dg-line" d="M420 84 H466" marker-end="url(#k2)"/>
  <path class="dg-line" d="M420 134 H466" marker-end="url(#k2)"/>
  <rect class="dg-box" x="470" y="46" width="76" height="26" rx="5"/><text class="dg-s" x="508" y="63" text-anchor="middle">pod</text>
  <rect class="dg-box" x="470" y="76" width="76" height="26" rx="5"/><text class="dg-s" x="508" y="93" text-anchor="middle">pod</text>
  <rect class="dg-box" x="470" y="122" width="76" height="26" rx="5"/><text class="dg-s" x="508" y="139" text-anchor="middle">pod</text>
  <text class="dg-s" x="310" y="185" text-anchor="middle">Service selects pods by LABEL; kube-proxy balances to the EndpointSlice</text>
  <defs><marker id="k2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Type</th><th>Reachable from</th><th>Cost / notes</th></tr>
<tr><td><strong>ClusterIP</strong> (default)</td><td>Inside the cluster only</td><td>The normal choice for service-to-service</td></tr>
<tr><td><strong>NodePort</strong></td><td>anyNodeIP:30000-32767</td><td>Ugly ports, no TLS — dev, or behind an external LB</td></tr>
<tr><td><strong>LoadBalancer</strong></td><td>Public IP from the cloud</td><td><strong>One cloud load balancer per Service</strong> — expensive at scale</td></tr>
<tr><td><strong>Ingress</strong></td><td>Public, HTTP(S)</td><td><em>One</em> LB fronting many services, with host/path routing and TLS</td></tr>
<tr><td><strong>Headless</strong> (<code>clusterIP: None</code>)</td><td>DNS returns pod IPs directly</td><td>StatefulSets, client-side balancing, gRPC</td></tr>
</table>
<pre><code>apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }        # matches POD LABELS — the most common bug is a typo here
  ports:
    - port: 80                  # the Service port
      targetPort: 8080          # the container port
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  annotations: { cert-manager.io/cluster-issuer: letsencrypt }
spec:
  tls: [{ hosts: [app.example.com], secretName: app-tls }]
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend: { service: { name: api, port: { number: 80 } } }</code></pre>
<p><strong>Debugging a Service that returns nothing</strong> — the sequence to give:</p>
<pre><code>kubectl get endpointslices -l kubernetes.io/service-name=api
# EMPTY endpoints = the selector matches no ready pod. Either the labels
# do not match, or the readiness probe is failing. That is almost always it.
kubectl run tmp --rm -it --image=nicolaka/netshoot -- curl -v http://api.default.svc:80</code></pre>
<p><strong>The gRPC caveat worth mentioning:</strong> kube-proxy balances <em>connections</em>, not requests. gRPC multiplexes over one long-lived HTTP/2 connection, so all traffic pins to a single pod. You need a headless Service with client-side balancing, or a service mesh.</p>`
},
{
  q: "How do you perform a zero-downtime deployment in Kubernetes?",
  level: "advanced", hot: true, tags: ["deployment", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Societe Generale"],
  a: `<pre><code>spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1              # one extra pod during the roll
      maxUnavailable: 0        # NEVER go below the desired count
  minReadySeconds: 10          # a pod must stay ready this long before it counts
  template:
    spec:
      terminationGracePeriodSeconds: 45
      containers:
        - name: api
          readinessProbe:      # gates traffic — this is what makes it zero-downtime
            httpGet: { path: /actuator/health/readiness, port: 8080 }
            periodSeconds: 3
          lifecycle:
            preStop:
              exec: { command: ["sh","-c","sleep 8"] }   # see below
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: api }
spec:
  minAvailable: 3             # protects against node drains too, not just rollouts
  selector: { matchLabels: { app: api } }</code></pre>
<p><strong>The subtle race that causes the 502s people cannot explain:</strong> when a pod is deleted, two things happen <em>in parallel</em> — the endpoint is removed from the Service, and SIGTERM is sent to the container. Endpoint removal has to propagate to every kube-proxy and ingress controller, which takes a second or two. If the app shuts down instantly it stops accepting connections that are still being routed to it.</p>
<p>The <code>preStop</code> sleep fixes it: the pod keeps serving for a few seconds while it is being removed from the routing tables, <em>then</em> shuts down. That is why the sleep looks pointless but is not.</p>
<pre><code># Spring Boot side of the same problem
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
management.endpoint.health.probes.enabled=true

# Watch and control a rollout
kubectl rollout status deployment/api --timeout=5m
kubectl rollout undo   deployment/api            # instant rollback
kubectl rollout history deployment/api</code></pre>
<table>
<tr><th>Strategy</th><th>Trade-off</th></tr>
<tr><td><strong>RollingUpdate</strong></td><td>Default, no extra cost — but two versions run at once, so the API and schema must be backward compatible</td></tr>
<tr><td><strong>Blue-green</strong></td><td>Instant switch and instant rollback — needs double the capacity</td></tr>
<tr><td><strong>Canary</strong></td><td>5% of traffic first, watch the error rate, then ramp — needs a mesh or ingress weighting (Argo Rollouts, Flagger)</td></tr>
<tr><td><strong>Recreate</strong></td><td>Downtime by design — only when two versions genuinely cannot coexist</td></tr>
</table>
<p><strong>The point most candidates miss:</strong> zero downtime is not only a Kubernetes setting. It requires the <em>application</em> to be rolling-safe — additive-only database migrations (expand/contract), no breaking API changes in a single release, and idempotent consumers. If v1 and v2 cannot run side by side for five minutes, no deployment strategy will save you.</p>`
},
{
  q: "What is the difference between a Deployment, StatefulSet, DaemonSet and Job?",
  level: "beginner", tags: ["workloads", "basics"],
  companies: ["TCS", "Infosys", "Cognizant", "Accenture", "Wipro", "Tech Mahindra"],
  a: `<table>
<tr><th>Controller</th><th>Pod identity</th><th>Storage</th><th>Use for</th></tr>
<tr><td><strong>Deployment</strong></td><td>Random names, interchangeable</td><td>Shared or none</td><td>Stateless APIs, web apps — the default</td></tr>
<tr><td><strong>StatefulSet</strong></td><td><code>db-0, db-1</code> — stable and ordered</td><td>Its own PVC per pod</td><td>Databases, Kafka, ZooKeeper, anything with peer identity</td></tr>
<tr><td><strong>DaemonSet</strong></td><td>Exactly one per node</td><td>Usually host paths</td><td>Log shippers, node exporters, CNI agents</td></tr>
<tr><td><strong>Job</strong></td><td>Runs to completion</td><td>Any</td><td>Migrations, batch imports</td></tr>
<tr><td><strong>CronJob</strong></td><td>Job on a schedule</td><td>Any</td><td>Nightly reports, cleanup</td></tr>
<tr><td><strong>ReplicaSet</strong></td><td>Maintains N pods</td><td>—</td><td>Managed <em>by</em> a Deployment; you rarely write one</td></tr>
</table>
<pre><code># StatefulSet guarantees what a Deployment does not
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: pg }
spec:
  serviceName: pg-headless        # required — gives pg-0.pg-headless.ns.svc DNS
  replicas: 3
  volumeClaimTemplates:           # each pod gets its OWN PersistentVolume
    - metadata: { name: data }
      spec:
        accessModes: [ReadWriteOnce]
        resources: { requests: { storage: 20Gi } }</code></pre>
<p><strong>The three StatefulSet guarantees</strong>, which is the real content of this question:</p>
<ol>
<li><strong>Stable network identity</strong> — <code>pg-0</code> is always <code>pg-0</code>, with a resolvable DNS name, across restarts and rescheduling.</li>
<li><strong>Stable storage</strong> — <code>pg-0</code> reattaches to <em>its own</em> volume, not any volume.</li>
<li><strong>Ordered operations</strong> — pods start 0,1,2 and terminate 2,1,0, each waiting for the previous to be Ready. This is what lets a cluster elect a leader deterministically.</li>
</ol>
<p><strong>The trade-off to state:</strong> those guarantees make rollouts slow and rescheduling fragile — a StatefulSet pod cannot simply move to another node if its volume is zone-locked. Use a Deployment unless you genuinely need identity. And the honest production position: most teams run databases as managed services and use StatefulSets only for things like Kafka that have no good managed equivalent in their environment.</p>
<pre><code># The Job detail that catches people out
apiVersion: batch/v1
kind: Job
spec:
  backoffLimit: 3                 # retries before it is marked Failed
  ttlSecondsAfterFinished: 3600   # WITHOUT this, finished Jobs pile up forever
  template:
    spec:
      restartPolicy: OnFailure    # 'Always' is invalid for a Job</code></pre>`
}
]);
