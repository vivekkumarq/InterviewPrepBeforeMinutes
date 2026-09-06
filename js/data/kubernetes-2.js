appendTopic("kubernetes", [
{
  q: "What is an Ingress and how does it differ from a Service and the Gateway API?",
  level: "beginner", hot: true, tags: ["networking"],
  a: `<p>A <code>Service</code> of type <code>LoadBalancer</code> provisions one cloud load balancer <em>per service</em> — expensive and wasteful at scale. An <strong>Ingress</strong> gives you one load balancer routing many hostnames and paths to many services, plus TLS termination.</p>
<pre><code>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: acme
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.acme.com]
      secretName: acme-tls              # cert-manager creates and renews this
  rules:
    - host: api.acme.com
      http:
        paths:
          - path: /orders
            pathType: Prefix
            backend: { service: { name: order-service, port: { number: 80 } } }
          - path: /customers
            pathType: Prefix
            backend: { service: { name: customer-service, port: { number: 80 } } }</code></pre>
<p><strong>An Ingress resource does nothing on its own</strong> — it is configuration consumed by an <strong>Ingress controller</strong> (nginx, Traefik, HAProxy, or a cloud one). No controller installed means no routing, which is a common first-time confusion.</p>
<p><strong>The Gateway API is the successor</strong>, and worth mentioning as a currency signal. Ingress's weakness is that anything beyond basic host/path routing requires vendor-specific annotations, so manifests are not portable. Gateway API makes those first-class and typed, and separates concerns by role:</p>
<ul>
<li><code>GatewayClass</code> and <code>Gateway</code> — owned by the platform team (infrastructure, TLS, listeners).</li>
<li><code>HTTPRoute</code> — owned by application teams (routing rules, header matching, traffic splitting for canaries, retries).</li>
</ul>
<p>That role split is the real improvement: application teams change routing without touching shared infrastructure, and traffic splitting for canary releases is native rather than an annotation.</p>`
},
{
  q: "How do you troubleshoot a Service that is not routing traffic?",
  level: "advanced", hot: true, tags: ["debugging", "networking"],
  a: `<p>Work down the chain — Service → Endpoints → Pods → container port.</p>
<pre><code># 1. Does the Service have ENDPOINTS? Empty means it matches no ready pods.
kubectl get endpoints api
kubectl get endpointslices -l kubernetes.io/service-name=api

# 2. Do the selector and pod labels actually match?
kubectl get svc api -o jsonpath='{.spec.selector}'
kubectl get pods --show-labels

# 3. Are the pods READY? A failing readiness probe removes them from endpoints.
kubectl get pods -o wide
kubectl describe pod api-xxx | tail -30       # probe failures appear in Events

# 4. Is targetPort correct — and is the app listening on 0.0.0.0, not 127.0.0.1?
kubectl exec api-xxx -- ss -tulpn

# 5. Test from inside the cluster, bypassing DNS then using it
kubectl run tmp --rm -it --image=nicolaka/netshoot -- sh
  curl http://10.1.2.3:8080/actuator/health    # pod IP directly
  curl http://api/actuator/health              # via the Service
  nslookup api.default.svc.cluster.local       # DNS

# 6. Bypass the Service entirely to isolate the layer
kubectl port-forward pod/api-xxx 8080:8080</code></pre>
<table>
<tr><th>Symptom</th><th>Usual cause</th></tr>
<tr><td>No endpoints</td><td>Selector does not match pod labels, or no pod is Ready</td></tr>
<tr><td>Endpoints exist, connection refused</td><td>Wrong <code>targetPort</code>, or the app binds to <code>127.0.0.1</code></td></tr>
<tr><td>Intermittent failures</td><td>Some replicas unhealthy; or no <code>preStop</code> delay so terminating pods still receive traffic</td></tr>
<tr><td>DNS does not resolve</td><td>Wrong namespace in the name, or CoreDNS unhealthy</td></tr>
<tr><td>Works by pod IP, not by Service</td><td>kube-proxy problem, or a NetworkPolicy blocking it</td></tr>
</table>
<p><strong>The first command is the diagnostic:</strong> <code>kubectl get endpoints</code>. An empty endpoint list immediately tells you the problem is label matching or pod readiness, not networking — which eliminates most of the search space in one step.</p>`
},
{
  q: "What are init containers, sidecars and ephemeral containers?",
  level: "advanced", tags: ["workloads", "patterns"],
  a: `<pre><code>spec:
  initContainers:                      # run to COMPLETION, in order, before app containers
    - name: migrate
      image: ghcr.io/acme/api:1.4.2
      args: ["--spring.flyway.enabled=true", "--spring.main.web-application-type=none"]
    - name: wait-for-kafka
      image: busybox
      command: ['sh','-c','until nc -z kafka 9092; do sleep 2; done']

  containers:
    - name: app                        # the main container
      image: ghcr.io/acme/api:1.4.2

    - name: log-shipper                # SIDECAR — runs alongside for the pod's lifetime
      image: fluent-bit
      volumeMounts: [{ name: logs, mountPath: /var/log/app }]</code></pre>
<table>
<tr><th></th><th>Init container</th><th>Sidecar</th><th>Ephemeral container</th></tr>
<tr><td>Lifecycle</td><td>Runs and exits before the app starts</td><td>Runs for the pod's lifetime</td><td>Injected into a running pod on demand</td></tr>
<tr><td>Restart on failure</td><td>Blocks pod start until it succeeds</td><td>Restarts with the pod</td><td>Not restarted</td></tr>
<tr><td>Use for</td><td>Migrations, waiting for dependencies, fetching config or secrets</td><td>Log shipping, service-mesh proxy, metrics adapter, config reloader</td><td><strong>Debugging</strong> a running pod</td></tr>
</table>
<p><strong>Init containers are the right place for database migrations</strong> — they run once before any replica starts serving, so you avoid every replica racing to migrate. Combine with a Job or a Helm <code>pre-upgrade</code> hook if the migration must run exactly once cluster-wide.</p>
<p><strong>Ephemeral containers solve the distroless debugging problem:</strong> a production image with no shell cannot be <code>exec</code>-ed into. <code>kubectl debug</code> attaches a fully-equipped container sharing the target's namespaces:</p>
<pre><code>kubectl debug -it api-pod --image=nicolaka/netshoot --target=app
# shares the process and network namespace of 'app' — tcpdump, ss, curl, jstack all available</code></pre>
<p>Kubernetes 1.29+ also added <strong>native sidecar support</strong> (an init container with <code>restartPolicy: Always</code>), which fixes the long-standing problem of sidecars not shutting down after the main container finishes — previously a Job with an Istio sidecar would never complete.</p>`
},
{
  q: "How do you manage secrets securely in Kubernetes?",
  level: "advanced", hot: true, tags: ["security"],
  a: `<p><strong>The starting point everyone must know:</strong> a Kubernetes <code>Secret</code> is <strong>base64-encoded, not encrypted</strong>. Anyone with read access to the namespace, or to etcd, can decode it.</p>
<pre><code>kubectl get secret db -o jsonpath='{.data.password}' | base64 -d   # trivially readable</code></pre>
<p><strong>Making them actually secure, in layers:</strong></p>
<ol>
<li><strong>Encryption at rest in etcd</strong> — an <code>EncryptionConfiguration</code> on the API server, ideally backed by a cloud KMS. Without this, an etcd backup is a plaintext credential dump.</li>
<li><strong>Tight RBAC</strong> — restrict <code>get</code>/<code>list</code> on secrets to the specific service accounts that need them. Note that <code>list</code> on secrets in a namespace is effectively full access.</li>
<li><strong>External secret store</strong> — the strongest option. Keep secrets in Vault, AWS Secrets Manager or GCP Secret Manager, and sync them in:
<pre><code>apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
spec:
  secretStoreRef: { name: vault, kind: ClusterSecretStore }
  refreshInterval: 1h
  target: { name: db-credentials }
  data:
    - secretKey: password
      remoteRef: { key: prod/orders/db, property: password }</code></pre></li>
<li><strong>Sealed Secrets</strong> when you want GitOps — encrypt with the cluster's public key so the encrypted form can safely live in Git; only the controller in the cluster can decrypt it.</li>
<li><strong>Short-lived dynamic credentials</strong> — Vault can issue a database credential valid for one hour, so a leak has a bounded blast radius and rotation is automatic. This is the mature answer.</li>
<li><strong>Workload identity</strong> — bind a Kubernetes service account to a cloud IAM role so the pod gets temporary cloud credentials with no stored secret at all.</li>
</ol>
<p><strong>Operational practices:</strong> mount secrets as files rather than environment variables (env vars leak into crash dumps, child processes and <code>/proc</code>, and appear in <code>kubectl describe</code> of some resources); never log them; rotate on a schedule and after any personnel change; and audit access. Also disable <code>automountServiceAccountToken</code> where a pod does not need to call the API server.</p>`
},
{
  q: "What are Kubernetes operators and Custom Resource Definitions?",
  level: "advanced", tags: ["extension", "architecture"],
  a: `<p>A <strong>CRD</strong> extends the Kubernetes API with your own resource type. An <strong>operator</strong> is a controller that watches those resources and drives reality toward the declared state — encoding the operational knowledge a human would otherwise apply.</p>
<pre><code># Your own resource type
apiVersion: acme.com/v1
kind: TenantDatabase
metadata: { name: acme-corp }
spec:
  plan: premium
  storageGb: 100
  backupSchedule: "0 2 * * *"
  region: ap-south-1</code></pre>
<pre><code>// The controller's reconcile loop — the heart of every operator
public Result reconcile(TenantDatabase desired) {
    var actual = cloud.findDatabase(desired.getMetadata().getName());

    if (actual == null) {
        cloud.provision(desired.getSpec());                   // create
        return Result.requeue(Duration.ofSeconds(30));
    }
    if (actual.storageGb() &lt; desired.getSpec().storageGb()) {
        cloud.resize(actual, desired.getSpec().storageGb());  // converge
    }
    updateStatus(desired, actual);                            // report observed state
    return Result.noRequeue();
}</code></pre>
<p><strong>The core idea to articulate:</strong> Kubernetes is <em>entirely</em> built on this pattern. The Deployment controller reconciles ReplicaSets, the ReplicaSet controller reconciles Pods. An operator is you writing the same kind of loop for your own domain. That is why the answer "Kubernetes is a set of reconciliation loops over declarative state" is the right mental model.</p>
<p><strong>Where operators genuinely pay off:</strong> stateful systems that need real operational knowledge — the PostgreSQL, Kafka, Elasticsearch and Prometheus operators handle failover, backup, scaling and version upgrades that would otherwise be runbooks executed by a human at 3am.</p>
<p><strong>When not to write one:</strong> if a Helm chart plus a CronJob does the job, that is far less code to maintain. Writing an operator means owning a controller with idempotent reconciliation, status reporting, finalisers for cleanup, and correct behaviour under partial failure — genuinely hard to get right. Frameworks like Kubebuilder, Operator SDK and the Java Operator SDK remove much of the boilerplate.</p>`
},
{
  q: "How do you handle stateful applications and persistent storage?",
  level: "advanced", tags: ["storage", "workloads"],
  a: `<pre><code>apiVersion: apps/v1
kind: StatefulSet
metadata: { name: postgres }
spec:
  serviceName: postgres-headless          # headless Service = stable per-pod DNS
  replicas: 3
  volumeClaimTemplates:                   # one PVC PER POD, not shared
    - metadata: { name: data }
      spec:
        accessModes: [ ReadWriteOnce ]
        storageClassName: fast-ssd
        resources: { requests: { storage: 100Gi } }</code></pre>
<p><strong>What a StatefulSet gives you that a Deployment does not:</strong> stable ordinal names (<code>postgres-0</code>, <code>postgres-1</code>), stable DNS (<code>postgres-0.postgres-headless</code>), a persistent volume that follows each pod across restarts and reschedules, and ordered, graceful start-up and shutdown. Clustered databases need all four to find their own data and each other.</p>
<table>
<tr><th>Access mode</th><th>Meaning</th></tr>
<tr><td><code>ReadWriteOnce</code></td><td>Mounted read-write by one <strong>node</strong> — the usual case for block storage (EBS, PD)</td></tr>
<tr><td><code>ReadWriteOncePod</code></td><td>One pod only — stricter, prevents split-brain</td></tr>
<tr><td><code>ReadOnlyMany</code></td><td>Many nodes, read-only</td></tr>
<tr><td><code>ReadWriteMany</code></td><td>Many nodes read-write — needs a shared filesystem (NFS, EFS, CephFS)</td></tr>
</table>
<p><strong>Details that catch people out:</strong> <code>reclaimPolicy: Delete</code> on a StorageClass means deleting the PVC destroys the data — use <code>Retain</code> for anything important. Deleting a StatefulSet does <em>not</em> delete its PVCs (deliberately, to protect data), so they must be cleaned up separately. And <code>ReadWriteOnce</code> volumes pin a pod to a node's availability zone, which affects scheduling and failover.</p>
<p><strong>The honest recommendation:</strong> for production databases, a managed service (RDS, Cloud SQL) is almost always the better engineering choice. Running PostgreSQL in Kubernetes means owning backup, point-in-time recovery, failover, version upgrades and storage performance yourself. If you must, use a mature operator (CloudNativePG, Zalando) rather than a hand-written StatefulSet — and be honest in the interview that this is a "do you know what you are taking on" decision.</p>`
},
{
  q: "How do you optimise Kubernetes costs and right-size workloads?",
  level: "advanced", tags: ["production", "cost"],
  a: `<ol>
<li><strong>Right-size requests from actual usage.</strong> Requests reserve capacity whether used or not — over-requesting is the single largest source of waste. Use the Vertical Pod Autoscaler in <em>recommendation</em> mode, or Prometheus percentiles:
<pre><code># P95 CPU actually used, per pod, over a week
quantile_over_time(0.95, rate(container_cpu_usage_seconds_total[5m])[7d:])
# Compare against kube_pod_container_resource_requests</code></pre></li>
<li><strong>Set requests near the P95 and limits with headroom</strong> — for memory, request equals limit for predictability; for CPU, a request with no limit avoids throttling while still allowing the scheduler to pack correctly.</li>
<li><strong>Horizontal autoscaling on the right metric</strong> — CPU is a poor proxy for I/O-bound Java services. Scale on request rate, queue depth or Kafka consumer lag with KEDA.</li>
<li><strong>Scale to zero</strong> for non-production environments overnight and at weekends — often a third of the total bill for a team with many namespaces.</li>
<li><strong>Cluster Autoscaler or Karpenter</strong> to remove idle nodes, and bin-pack better by choosing instance types that match the workload shape.</li>
<li><strong>Spot / preemptible instances</strong> for fault-tolerant workloads — batch jobs, CI runners, stateless replicas with a PodDisruptionBudget. Typically 60–80% cheaper.</li>
<li><strong>Namespace ResourceQuotas and LimitRanges</strong> so one team cannot silently consume the cluster, and every pod gets a sane default rather than landing in the BestEffort class.</li>
<li><strong>Attribute cost</strong> — Kubecost or OpenCost break spend down per namespace and team, which is what actually changes behaviour.</li>
</ol>
<p><strong>The point worth making:</strong> most Kubernetes overspend is not the cluster — it is thousands of pods each requesting 1 CPU and using 0.05. Right-sizing requests typically reclaims 40–60% of a cluster with no change to reliability, and it is the first thing I would measure before adding autoscaling or changing instance types.</p>
<p>Balance it honestly though: under-requesting causes eviction and throttling. The goal is accuracy, not minimisation.</p>`
}
]);
