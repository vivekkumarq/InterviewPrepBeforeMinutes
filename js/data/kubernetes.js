registerTopic("kubernetes", [
{
  q: "What is Kubernetes and what problem does it solve?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<p>Kubernetes is a container orchestrator. Docker runs a container on one machine; Kubernetes runs thousands across a fleet and keeps them running.</p>
<p><strong>What it gives you:</strong></p>
<ul>
<li><strong>Declarative desired state</strong> — you describe what you want, controllers continuously reconcile reality toward it. This is the core idea; everything else follows from it.</li>
<li><strong>Self-healing</strong> — restarts failed containers, replaces unhealthy pods, reschedules off dead nodes.</li>
<li><strong>Scaling</strong> — manual, or automatic on CPU/memory/custom metrics.</li>
<li><strong>Service discovery and load balancing</strong> — stable DNS names for ephemeral pods.</li>
<li><strong>Rolling updates and rollbacks</strong> with zero downtime.</li>
<li><strong>Configuration and secret management</strong>, storage orchestration, bin-packing across nodes.</li>
</ul>
<blockquote><p><strong>Balanced framing:</strong> Kubernetes is powerful but genuinely complex. For a handful of services, a managed platform (ECS, Cloud Run, App Runner, Heroku) delivers most of the value with a fraction of the operational cost. Kubernetes earns its complexity at scale, or when you need its extensibility.</p></blockquote>`
},
{
  q: "Explain the Kubernetes architecture",
  level: "advanced", hot: true, tags: ["architecture"],
  a: `<figure class="fig">
<svg viewBox="0 0 640 200" role="img" aria-label="Kubernetes control plane and worker nodes">
  <rect class="dg-fill" x="10" y="14" width="250" height="172" rx="10"/>
  <text class="dg-t" x="135" y="34" text-anchor="middle">Control plane</text>
  <rect class="dg-fill2" x="24" y="44" width="222" height="26" rx="5"/><text class="dg-s" x="135" y="61" text-anchor="middle">API server — the only door in</text>
  <rect class="dg-box" x="24" y="76" width="222" height="26" rx="5"/><text class="dg-s" x="135" y="93" text-anchor="middle">etcd — cluster state store</text>
  <rect class="dg-box" x="24" y="108" width="222" height="26" rx="5"/><text class="dg-s" x="135" y="125" text-anchor="middle">Scheduler — assigns pods to nodes</text>
  <rect class="dg-box" x="24" y="140" width="222" height="26" rx="5"/><text class="dg-s" x="135" y="157" text-anchor="middle">Controller manager — reconciles</text>
  <path class="dg-line" d="M264 100 H310" marker-end="url(#kb)"/>
  <rect class="dg-box" x="316" y="14" width="150" height="172" rx="10"/>
  <text class="dg-t" x="391" y="34" text-anchor="middle">Worker node 1</text>
  <rect class="dg-fill2" x="328" y="44" width="126" height="24" rx="5"/><text class="dg-s" x="391" y="60" text-anchor="middle">kubelet</text>
  <rect class="dg-box" x="328" y="74" width="126" height="24" rx="5"/><text class="dg-s" x="391" y="90" text-anchor="middle">kube-proxy</text>
  <rect class="dg-fill" x="328" y="104" width="60" height="34" rx="5"/><text class="dg-s" x="358" y="125" text-anchor="middle">Pod</text>
  <rect class="dg-fill" x="394" y="104" width="60" height="34" rx="5"/><text class="dg-s" x="424" y="125" text-anchor="middle">Pod</text>
  <text class="dg-s" x="391" y="160" text-anchor="middle">container runtime</text>
  <rect class="dg-box" x="480" y="14" width="150" height="172" rx="10"/>
  <text class="dg-t" x="555" y="34" text-anchor="middle">Worker node 2</text>
  <rect class="dg-fill2" x="492" y="44" width="126" height="24" rx="5"/><text class="dg-s" x="555" y="60" text-anchor="middle">kubelet</text>
  <rect class="dg-box" x="492" y="74" width="126" height="24" rx="5"/><text class="dg-s" x="555" y="90" text-anchor="middle">kube-proxy</text>
  <rect class="dg-fill" x="492" y="104" width="60" height="34" rx="5"/><text class="dg-s" x="522" y="125" text-anchor="middle">Pod</text>
  <defs><marker id="kb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Control plane:</strong></p>
<ul>
<li><strong>kube-apiserver</strong> — the REST front end. Everything (kubectl, kubelet, controllers) talks only to it; it handles authentication, authorisation and admission.</li>
<li><strong>etcd</strong> — the distributed key-value store holding <em>all</em> cluster state. Back it up; losing it loses the cluster.</li>
<li><strong>kube-scheduler</strong> — picks a node for each unscheduled pod based on resource requests, affinity, taints and constraints.</li>
<li><strong>kube-controller-manager</strong> — runs the reconciliation loops (Deployment, ReplicaSet, Node, Job controllers).</li>
<li><strong>cloud-controller-manager</strong> — integrates with the cloud provider for load balancers and volumes.</li>
</ul>
<p><strong>Worker node:</strong> <strong>kubelet</strong> (ensures the containers in its assigned pods are running and healthy), <strong>kube-proxy</strong> (implements Service networking via iptables/IPVS), and the <strong>container runtime</strong> (containerd or CRI-O — Docker itself was removed as a runtime in 1.24).</p>
<p><strong>The unifying concept:</strong> every controller runs the same loop — observe actual state, compare with desired state in etcd, act to close the gap. Understanding that makes the whole system predictable.</p>`
},
{
  q: "What is a Pod, and why not just run containers?",
  level: "beginner", hot: true, tags: ["workloads"],
  a: `<p>A <strong>Pod</strong> is the smallest deployable unit — one or more containers that share a network namespace (same IP and port space, so they reach each other on <code>localhost</code>), storage volumes, and a lifecycle. They are always scheduled onto the same node.</p>
<pre><code>apiVersion: v1
kind: Pod
metadata: { name: api, labels: { app: api } }
spec:
  containers:
    - name: app
      image: ghcr.io/acme/api:1.4.2
      ports: [ { containerPort: 8080 } ]
      resources:
        requests: { cpu: 200m, memory: 512Mi }
        limits:   { memory: 1Gi }
  initContainers:                       # run to completion BEFORE app containers
    - name: migrate
      image: ghcr.io/acme/api:1.4.2
      command: ["java","-jar","app.jar","--migrate-only"]</code></pre>
<p><strong>Why the extra abstraction:</strong> some helper processes genuinely need to be co-located and share resources with the main one — the <strong>sidecar pattern</strong>: a log shipper, a service-mesh proxy (Envoy in Istio), a config reloader, or a metrics adapter. Modelling that as "a group of containers that live and die together" is cleaner than special-casing it.</p>
<p><strong>Key practical points:</strong> you almost never create a bare Pod — a Deployment manages them for you, because a Pod is mortal and is never resurrected once deleted. Pods are ephemeral, get a new IP each time, and should be treated as cattle, not pets. Init containers are the standard way to run migrations or wait for a dependency before the app starts.</p>`
},
{
  q: "Deployment vs StatefulSet vs DaemonSet vs Job",
  level: "advanced", hot: true, tags: ["workloads"],
  a: `<table>
<tr><th>Kind</th><th>Use for</th><th>Key property</th></tr>
<tr><td><strong>Deployment</strong></td><td>Stateless applications</td><td>Interchangeable pods, random names, rolling updates, easy rollback</td></tr>
<tr><td><strong>StatefulSet</strong></td><td>Databases, Kafka, ZooKeeper</td><td><strong>Stable identity</strong>: ordinal names (<code>db-0</code>, <code>db-1</code>), stable DNS, its own persistent volume per pod, ordered start/stop</td></tr>
<tr><td><strong>DaemonSet</strong></td><td>Log collectors, node agents, CNI</td><td>Exactly one pod per node, automatically on new nodes</td></tr>
<tr><td><strong>Job</strong></td><td>Batch work</td><td>Runs to completion, with retries and parallelism</td></tr>
<tr><td><strong>CronJob</strong></td><td>Scheduled tasks</td><td>Creates Jobs on a cron schedule</td></tr>
<tr><td><strong>ReplicaSet</strong></td><td>—</td><td>Managed by Deployments; you rarely create one directly</td></tr>
</table>
<p><strong>The distinction that matters:</strong> Deployment pods are anonymous and replaceable — pod <code>api-7d9f-x2k</code> is identical to any other, so it can be killed and rescheduled anywhere. StatefulSet pods have identity: <code>kafka-0</code> keeps its name, its DNS record and <em>its own volume</em> across restarts, which is exactly what a clustered database needs to find its own data again.</p>
<pre><code>kind: StatefulSet
spec:
  serviceName: kafka-headless          # headless Service gives per-pod DNS
  replicas: 3
  volumeClaimTemplates:                # one PVC created PER POD, not shared
    - metadata: { name: data }
      spec:
        accessModes: [ ReadWriteOnce ]
        resources: { requests: { storage: 100Gi } }</code></pre>
<p>Worth adding: a Deployment creates a new ReplicaSet per revision, which is what makes <code>kubectl rollout undo</code> possible.</p>`
},
{
  q: "What is a Service and what are the service types?",
  level: "beginner", hot: true, tags: ["networking"],
  a: `<p>Pods are ephemeral with changing IPs. A <strong>Service</strong> provides a stable virtual IP and DNS name, load-balancing across the pods matching its label selector.</p>
<table>
<tr><th>Type</th><th>Exposes</th></tr>
<tr><td><strong>ClusterIP</strong> (default)</td><td>Internal only — <code>api.default.svc.cluster.local</code></td></tr>
<tr><td><strong>NodePort</strong></td><td>A port on every node (30000–32767). Mostly for development</td></tr>
<tr><td><strong>LoadBalancer</strong></td><td>Provisions a cloud load balancer. One per service — expensive at scale</td></tr>
<tr><td><strong>ExternalName</strong></td><td>A CNAME to an external host — useful for migrating a dependency</td></tr>
<tr><td><strong>Headless</strong> (<code>clusterIP: None</code>)</td><td>No virtual IP; DNS returns pod IPs directly. Required for StatefulSets and client-side load balancing</td></tr>
</table>
<pre><code>apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }          # matches pod labels — this is the whole mechanism
  ports:
    - port: 80                    # the service port
      targetPort: 8080            # the container port
# From any pod: http://api  or  http://api.default.svc.cluster.local</code></pre>
<p><strong>How it actually works:</strong> kube-proxy programs iptables (or IPVS) rules on every node so that traffic to the ClusterIP is DNAT'd to a randomly chosen healthy pod IP. There is no proxy process in the data path — which is why it is fast, and also why the load balancing is connection-level rather than request-level (an important limitation for long-lived HTTP/2 or gRPC connections, which a service mesh solves).</p>
<p><strong>Ingress</strong> sits above Services: one load balancer routing many hostnames and paths to different Services, with TLS termination. Its successor is the Gateway API.</p>`
},
{
  q: "How do liveness, readiness and startup probes differ?",
  level: "advanced", hot: true, tags: ["probes", "production"],
  a: `<table>
<tr><th>Probe</th><th>Question</th><th>On failure</th></tr>
<tr><td><strong>Liveness</strong></td><td>Is the process alive, or wedged?</td><td><strong>Restarts the container</strong></td></tr>
<tr><td><strong>Readiness</strong></td><td>Can it serve traffic right now?</td><td><strong>Removes it from the Service endpoints</strong> — no restart</td></tr>
<tr><td><strong>Startup</strong></td><td>Has it finished booting?</td><td>Disables the other probes until it passes</td></tr>
</table>
<pre><code>startupProbe:                         # JVM apps boot slowly — this prevents restart loops
  httpGet: { path: /actuator/health/liveness, port: 8081 }
  failureThreshold: 30
  periodSeconds: 5                    # allows up to 150s to start

livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8081 }
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8081 }
  periodSeconds: 5
  failureThreshold: 2</code></pre>
<p><strong>The mistake that causes real outages:</strong> pointing the <em>liveness</em> probe at a health check that includes downstream dependencies. If the database has a hiccup, every pod fails liveness, Kubernetes restarts all of them simultaneously, and a recoverable blip becomes a full outage — restarting does not fix someone else's database.</p>
<p><strong>The rule:</strong> liveness should test only "is this process itself healthy?" — cheap, local, no dependencies. Readiness may check dependencies, because removing a pod from load balancing is safe and reversible. Spring Boot's <code>/health/liveness</code> and <code>/health/readiness</code> groups are designed for exactly this split.</p>`
},
{
  q: "What are resource requests and limits, and what happens when you exceed them?",
  level: "advanced", hot: true, tags: ["resources", "production"],
  a: `<ul>
<li><strong>Requests</strong> — the guaranteed reservation. The <em>scheduler</em> uses this to decide which node a pod fits on.</li>
<li><strong>Limits</strong> — the hard ceiling enforced at runtime by cgroups.</li>
</ul>
<pre><code>resources:
  requests: { cpu: 200m, memory: 512Mi }   # 200m = 0.2 of a core
  limits:   {            memory: 1Gi }</code></pre>
<p><strong>What happens when you exceed them — and they differ crucially:</strong></p>
<ul>
<li><strong>CPU is compressible</strong> — exceeding the CPU limit causes <strong>throttling</strong>, not termination. The process just runs slower, which shows up as mysterious latency spikes.</li>
<li><strong>Memory is not compressible</strong> — exceeding the memory limit means the container is <strong>OOM-killed</strong> (exit code 137). No warning, no graceful shutdown.</li>
</ul>
<p><strong>Quality of Service classes</strong>, which determine eviction order under node pressure:</p>
<ul>
<li><strong>Guaranteed</strong> — requests equal limits for every resource. Evicted last.</li>
<li><strong>Burstable</strong> — requests set, limits higher or absent.</li>
<li><strong>BestEffort</strong> — nothing set. <strong>Evicted first</strong>, so never do this in production.</li>
</ul>
<blockquote><p><strong>The opinion worth voicing:</strong> always set memory requests <em>and</em> limits equal, and set a CPU request but often <strong>no CPU limit</strong>. CPU limits cause throttling even when the node has idle capacity — a well-documented cause of p99 latency problems in JVM services, because GC threads get throttled. Set requests correctly so the scheduler packs properly, and let bursts use spare CPU.</p></blockquote>
<p>Also mention that the JVM must be told about the limit — <code>-XX:MaxRAMPercentage=75</code> — and that <code>ActiveProcessorCount</code> matters when the CPU limit is fractional.</p>`
},
{
  q: "How do ConfigMaps and Secrets work?",
  level: "beginner", tags: ["configuration"],
  a: `<pre><code>apiVersion: v1
kind: ConfigMap
metadata: { name: api-config }
data:
  SPRING_PROFILES_ACTIVE: prod
  application.yml: |
    server:
      port: 8080
---
apiVersion: v1
kind: Secret
metadata: { name: api-secrets }
type: Opaque
stringData:                       # stringData accepts plain text; 'data' needs base64
  DB_PASSWORD: s3cr3t
---
spec:
  containers:
    - envFrom:
        - configMapRef: { name: api-config }
        - secretRef:    { name: api-secrets }
      volumeMounts:
        - { name: config, mountPath: /config }    # mounted files DO update on change
  volumes:
    - name: config
      configMap: { name: api-config }</code></pre>
<p><strong>The critical caveat about Secrets:</strong> they are only <strong>base64-encoded, not encrypted</strong>. Anyone with read access to the namespace can decode them. To make them meaningful you need encryption at rest in etcd, tight RBAC, and ideally an external secret store — Vault, AWS Secrets Manager, or the External Secrets Operator syncing them in. Sealed Secrets lets you commit encrypted secrets to Git safely.</p>
<p><strong>Two practical points:</strong> values injected as <em>environment variables</em> are fixed at pod start, so changing the ConfigMap requires a restart — mounted <em>volumes</em> update automatically (with a delay), though your application must watch the file. And add a checksum annotation on the Deployment so a config change triggers a rolling restart automatically:</p>
<pre><code>annotations:
  checksum/config: "{{ include (print $.Template.BasePath \"/configmap.yaml\") . | sha256sum }}"</code></pre>`
},
{
  q: "How do rolling updates and rollbacks work?",
  level: "advanced", hot: true, tags: ["deployment"],
  a: `<pre><code>spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1            # how many EXTRA pods above replicas
      maxUnavailable: 0      # zero downtime — never go below 4 healthy
  minReadySeconds: 10        # a pod must stay ready this long before counting</code></pre>
<pre><code>kubectl set image deployment/api app=ghcr.io/acme/api:1.4.3
kubectl rollout status deployment/api        # blocks until complete or failed
kubectl rollout history deployment/api
kubectl rollout undo deployment/api                       # previous revision
kubectl rollout undo deployment/api --to-revision=3
kubectl rollout pause deployment/api                      # for a manual canary</code></pre>
<p><strong>How it works:</strong> a Deployment creates a new ReplicaSet for the new pod template and scales it up while scaling the old one down, respecting <code>maxSurge</code> and <code>maxUnavailable</code>. The old ReplicaSet is kept (scaled to zero), which is exactly what makes <code>rollout undo</code> instant.</p>
<p><strong>What zero downtime actually requires</strong> — this is the substance of the answer:</p>
<ul>
<li><code>maxUnavailable: 0</code> and a correct <strong>readiness probe</strong>, so traffic only goes to pods that can serve it.</li>
<li><strong>Graceful shutdown</strong> — SIGTERM handled, in-flight requests finished, plus a <code>preStop</code> sleep so the endpoint is removed from the load balancer before the process stops (endpoint propagation is asynchronous — this race causes most "we still see 502s during deploys").</li>
<li><strong>Backwards-compatible database migrations and API contracts</strong>, because both versions run simultaneously.</li>
<li>A <strong>PodDisruptionBudget</strong> so node drains do not take down too many replicas at once.</li>
</ul>
<p>For higher-risk changes, mention progressive delivery with Argo Rollouts or Flagger — automated canary analysis with rollback on metric regression.</p>`
},
{
  q: "How does autoscaling work — HPA, VPA and Cluster Autoscaler?",
  level: "advanced", tags: ["scaling"],
  a: `<ul>
<li><strong>HPA (Horizontal Pod Autoscaler)</strong> — adds or removes <em>pods</em> based on metrics.</li>
<li><strong>VPA (Vertical Pod Autoscaler)</strong> — adjusts requests/limits of existing pods. Note it must restart pods to apply changes, and it conflicts with HPA on the same metric.</li>
<li><strong>Cluster Autoscaler</strong> — adds or removes <em>nodes</em> when pods cannot be scheduled or nodes are underused. Karpenter is the modern alternative on AWS.</li>
</ul>
<pre><code>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef: { kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
    - type: Pods                                   # custom metric via Prometheus adapter
      pods:
        metric: { name: http_requests_per_second }
        target: { type: AverageValue, averageValue: "500" }
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300              # avoid flapping
      policies: [ { type: Percent, value: 50, periodSeconds: 60 } ]
    scaleUp:
      policies: [ { type: Percent, value: 100, periodSeconds: 30 } ]   # scale up fast</code></pre>
<p><strong>Points that show operational experience:</strong> HPA scales on <em>utilisation relative to requests</em>, so wrong requests make autoscaling meaningless — this is the most common misconfiguration. CPU is often a poor proxy for load in I/O-bound Java services; queue depth, request rate or Kafka consumer lag (via KEDA) are much better signals. Scale up aggressively and down conservatively, because the cost of being under-provisioned is an outage while over-provisioning is just money. And autoscaling only works if the application starts quickly and is genuinely stateless.</p>`
},
{
  q: "How do you debug a failing pod?",
  level: "advanced", hot: true, tags: ["debugging", "production"],
  a: `<pre><code>kubectl get pods                          # STATUS and RESTARTS tell you a lot immediately
kubectl describe pod api-7d9f-x2k         # EVENTS at the bottom — read these FIRST
kubectl logs api-7d9f-x2k                 # current container
kubectl logs api-7d9f-x2k --previous      # the CRASHED one — usually where the answer is
kubectl logs -f -l app=api --max-log-requests=10   # tail all pods of a deployment
kubectl exec -it api-7d9f-x2k -- sh
kubectl debug -it api-7d9f-x2k --image=busybox --target=app   # ephemeral container for distroless
kubectl get events --sort-by=.lastTimestamp -A
kubectl top pod / kubectl top node        # resource usage
kubectl port-forward pod/api-7d9f-x2k 8080:8080   # reach it locally</code></pre>
<table>
<tr><th>Status</th><th>Usual cause</th></tr>
<tr><td><code>Pending</code></td><td>Cannot be scheduled — insufficient resources, unsatisfiable node selector/taint, or an unbound PVC. <code>describe</code> says exactly which</td></tr>
<tr><td><code>ImagePullBackOff</code></td><td>Wrong image name/tag, or missing <code>imagePullSecrets</code></td></tr>
<tr><td><code>CrashLoopBackOff</code></td><td>Container starts and exits repeatedly — check <code>logs --previous</code></td></tr>
<tr><td><code>OOMKilled</code> (exit 137)</td><td>Exceeded the memory limit; for a JVM usually native memory outside the heap</td></tr>
<tr><td><code>Error</code> / <code>CreateContainerConfigError</code></td><td>Missing ConfigMap/Secret key referenced in the spec</td></tr>
<tr><td><code>Running</code> but not <code>Ready</code></td><td>Readiness probe failing — check the path, port and any dependency it tests</td></tr>
<tr><td><code>Terminating</code> forever</td><td>A finalizer, or the process ignoring SIGTERM</td></tr>
</table>
<p><strong>The procedure to state:</strong> <code>describe</code> for events (scheduling and probe failures live there), then <code>logs --previous</code> for application errors, then <code>exec</code> or <code>debug</code> to inspect from inside. Most incidents are answered by the first two commands, which is worth saying — it shows you debug systematically rather than randomly.</p>`
},
{
  q: "What is a Namespace, and how do RBAC and network policies work?",
  level: "advanced", tags: ["security", "multi-tenancy"],
  a: `<p><strong>Namespaces</strong> are virtual clusters within a cluster — a scope for names, resource quotas, RBAC and network policies. They are an organisational and policy boundary, <em>not</em> a hard security boundary.</p>
<pre><code># RBAC: least privilege for a service account
kind: Role                                   # namespaced (ClusterRole is cluster-wide)
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]          # read only — no create/delete
---
kind: RoleBinding
subjects: [ { kind: ServiceAccount, name: api } ]
roleRef: { kind: Role, name: config-reader }</code></pre>
<pre><code># NetworkPolicy: default-deny, then allow explicitly — zero trust inside the cluster
kind: NetworkPolicy
metadata: { name: default-deny-ingress }
spec:
  podSelector: {}                            # every pod in the namespace
  policyTypes: [ Ingress ]
---
kind: NetworkPolicy
metadata: { name: allow-gateway-to-api }
spec:
  podSelector: { matchLabels: { app: api } }
  ingress:
    - from:
        - podSelector: { matchLabels: { app: gateway } }
      ports: [ { port: 8080 } ]</code></pre>
<p><strong>The default that surprises people:</strong> without a NetworkPolicy, <em>every pod can talk to every other pod in the cluster</em>. A compromised sidecar in one namespace can reach your database pod directly. Default-deny plus explicit allows is the baseline for any regulated environment — and it requires a CNI that supports it (Calico, Cilium; the basic kubenet does not).</p>
<p><strong>Round it out with:</strong> ResourceQuota and LimitRange per namespace to stop one team starving others, Pod Security Standards (replacing PodSecurityPolicy) to forbid privileged containers, and dedicated ServiceAccounts per workload rather than the default one.</p>`
},
{
  q: "How do you manage Kubernetes manifests — Helm, Kustomize, GitOps?",
  level: "advanced", tags: ["tooling", "cicd"],
  a: `<table>
<tr><th>Tool</th><th>Approach</th><th>Best for</th></tr>
<tr><td><strong>Helm</strong></td><td>Go templating + package management (charts, releases, versioned rollback)</td><td>Distributing applications; complex parameterisation; installing third-party software</td></tr>
<tr><td><strong>Kustomize</strong></td><td>Template-free overlays patching a base</td><td>Your own applications across environments; built into kubectl (<code>-k</code>)</td></tr>
<tr><td><strong>Argo CD / Flux</strong></td><td>GitOps — a controller continuously syncs the cluster to Git</td><td>Deployment itself</td></tr>
</table>
<pre><code>base/                          overlays/prod/
  deployment.yaml                kustomization.yaml
  service.yaml                   replica-count.yaml   # patch: replicas 10
  kustomization.yaml             resources.yaml       # patch: bigger limits

kubectl apply -k overlays/prod</code></pre>
<p><strong>GitOps is the important concept:</strong> Git is the single source of truth for the desired state, and a controller in the cluster continuously reconciles toward it. Benefits: every change is a reviewed, audited commit; rollback is <code>git revert</code>; drift is detected and corrected automatically; and CI never needs cluster credentials — which removes a serious attack path.</p>
<pre><code># The GitOps flow
CI: build image -&gt; push -&gt; commit new tag to the config repo
CD: Argo CD sees the commit -&gt; syncs the cluster -&gt; reports health</code></pre>
<p><strong>My preference, and the reasoning:</strong> Helm for third-party charts (where you want the packaging and the community's parameters), Kustomize for our own manifests (templated YAML becomes unreadable quickly, and overlays stay honest), and Argo CD to apply both. That combination is common and defensible.</p>`
},
{
  q: "What are taints, tolerations, affinity and node selectors?",
  level: "advanced", tags: ["scheduling"],
  a: `<p>These control <em>where</em> pods land.</p>
<ul>
<li><strong>nodeSelector</strong> — the simplest: schedule only on nodes with a matching label.</li>
<li><strong>Node affinity</strong> — a richer version with <code>required</code> (hard) and <code>preferred</code> (soft, weighted) rules.</li>
<li><strong>Taints and tolerations</strong> — the inverse: a taint on a node <em>repels</em> pods unless they carry a matching toleration. Used to reserve nodes (GPU, spot instances) or to cordon them.</li>
<li><strong>Pod affinity/anti-affinity</strong> — schedule relative to other <em>pods</em>.</li>
<li><strong>Topology spread constraints</strong> — the modern, preferred way to spread replicas evenly across zones and nodes.</li>
</ul>
<pre><code># Spread replicas across zones so one AZ failure does not take the service down
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector: { matchLabels: { app: api } }

# Do not put two replicas of the same app on one node
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector: { matchLabels: { app: api } }
        topologyKey: kubernetes.io/hostname

# Reserve GPU nodes
# node:  kubectl taint nodes gpu-1 hardware=gpu:NoSchedule
tolerations:
  - { key: hardware, operator: Equal, value: gpu, effect: NoSchedule }</code></pre>
<p><strong>The practical use case to lead with:</strong> anti-affinity or topology spread for high availability. Without it, the scheduler may cheerfully place all three replicas of your service on one node, and that node's failure is a full outage — a redundancy that only exists on paper.</p>
<p>Taint effects: <code>NoSchedule</code> (no new pods), <code>PreferNoSchedule</code> (soft), <code>NoExecute</code> (also evicts existing pods — this is how node problem detectors drain a failing node).</p>`
}
]);
