appendTopic("kubernetes", [
{
  q: "What are Jobs, CronJobs and how do you run batch work reliably?",
  level: "beginner", tags: ["workloads", "batch"],
  a: `<pre><code>apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-report }
spec:
  schedule: "0 2 * * *"
  timeZone: "Asia/Kolkata"                 # 1.27+ — before this, schedules were UTC only
  concurrencyPolicy: Forbid                # do NOT start if the previous run is still going
  startingDeadlineSeconds: 300             # skip if the controller was down past this
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      backoffLimit: 2                      # retries before the Job is marked failed
      activeDeadlineSeconds: 3600          # hard timeout — kill a hung job
      ttlSecondsAfterFinished: 86400       # auto-clean completed pods
      template:
        spec:
          restartPolicy: Never             # or OnFailure
          containers:
            - name: report
              image: ghcr.io/acme/api:1.4.2
              args: ["--job=nightly-report"]</code></pre>
<p><strong>The settings that matter and are usually missing:</strong></p>
<ul>
<li><strong><code>concurrencyPolicy: Forbid</code></strong> — the default is <code>Allow</code>, so a job that runs longer than its interval starts overlapping with itself. That is how a nightly report ends up with ten copies running and a saturated database.</li>
<li><strong><code>activeDeadlineSeconds</code></strong> — without it a hung job runs forever, holding resources and blocking the next scheduled run.</li>
<li><strong><code>ttlSecondsAfterFinished</code></strong> — otherwise completed pods accumulate indefinitely and clutter the namespace.</li>
<li><strong><code>backoffLimit</code></strong> — a job that fails instantly will otherwise retry with exponential backoff up to six times by default.</li>
</ul>
<p><strong>Why a CronJob beats in-application <code>@Scheduled</code>:</strong> with three replicas of a Deployment, all three run the scheduled method — you need a distributed lock (ShedLock) to prevent that. A CronJob runs exactly one pod, gets its own resource limits, its own logs and its own retry semantics, and a failure is visible as a failed Job object rather than a log line nobody reads.</p>
<p><strong>Two caveats to raise:</strong> CronJob guarantees <em>at-least-once</em> execution, not exactly-once — a controller restart at the wrong moment can produce a duplicate run, so the job should be idempotent. And <code>parallelism</code> with <code>completions</code> lets a Job fan out across many pods for work-queue style processing, which is worth knowing for large batch imports.</p>`
},
{
  q: "How does Kubernetes DNS and service discovery work internally?",
  level: "advanced", tags: ["networking", "internals"],
  a: `<pre><code># Every Service gets a DNS A record in this form
&lt;service&gt;.&lt;namespace&gt;.svc.cluster.local

http://api                              # same namespace (search domain completes it)
http://api.orders                       # cross-namespace
http://api.orders.svc.cluster.local     # fully qualified

# Headless Service: DNS returns POD IPs, not a virtual IP
kafka-0.kafka-headless.default.svc.cluster.local
kafka-1.kafka-headless.default.svc.cluster.local

# SRV records expose ports
_http._tcp.api.orders.svc.cluster.local</code></pre>
<p><strong>How resolution actually happens:</strong> <strong>CoreDNS</strong> runs as a Deployment and is registered as the cluster DNS. Every pod's <code>/etc/resolv.conf</code> points at the CoreDNS Service IP and includes a <code>search</code> list, which is why the short name <code>api</code> works.</p>
<pre><code>cat /etc/resolv.conf
nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5                         # &lt;-- the performance trap</code></pre>
<p><strong>The <code>ndots:5</code> problem is worth knowing:</strong> any name with fewer than 5 dots is tried against every search domain <em>first</em>. Looking up <code>api.stripe.com</code> (2 dots) generates four failed queries before the correct one — multiplied by every outbound request. The fix is a trailing dot (<code>api.stripe.com.</code>) to force an absolute lookup, or a custom <code>dnsConfig</code> with a lower <code>ndots</code>.</p>
<p><strong>Beyond DNS, the actual routing</strong> is done by <strong>kube-proxy</strong>, which programs iptables (or IPVS) rules on every node so traffic to a Service's ClusterIP is DNAT'd to a random healthy pod IP. There is no proxy process in the data path — which is fast, but means load balancing is per <em>connection</em>, not per request. A long-lived HTTP/2 or gRPC connection pins to one pod and never rebalances, which is a genuine problem a service mesh solves.</p>
<p>Also worth naming: an <code>EndpointSlice</code> holds the ready pod IPs (replacing the older <code>Endpoints</code> object, which did not scale past a few thousand endpoints), and NodeLocal DNSCache is the standard mitigation for DNS latency and conntrack issues at scale.</p>`
},
{
  q: "What is the difference between a rolling update, recreate and how do you pause a rollout?",
  level: "beginner", tags: ["deployment"],
  a: `<pre><code>spec:
  strategy:
    type: RollingUpdate            # or Recreate
    rollingUpdate:
      maxSurge: 25%                # extra pods allowed above 'replicas'
      maxUnavailable: 0            # never drop below 'replicas' healthy  -&gt; zero downtime
  minReadySeconds: 15              # a pod must stay ready this long before counting
  progressDeadlineSeconds: 600     # mark the rollout failed if it stalls</code></pre>
<table>
<tr><th></th><th>RollingUpdate</th><th>Recreate</th></tr>
<tr><td>Behaviour</td><td>Gradually replaces pods</td><td>Terminates all, then starts the new version</td></tr>
<tr><td>Downtime</td><td>None (with <code>maxUnavailable: 0</code>)</td><td><strong>Yes</strong></td></tr>
<tr><td>Versions running together</td><td>Both, briefly</td><td>Only one</td></tr>
<tr><td>Use when</td><td>Almost always</td><td>Versions genuinely cannot coexist — an incompatible schema, or a singleton holding an exclusive lock</td></tr>
</table>
<pre><code>kubectl rollout status deployment/api          # blocks until complete or the deadline
kubectl rollout pause  deployment/api          # freeze mid-rollout — a manual canary
kubectl rollout resume deployment/api
kubectl rollout undo   deployment/api          # previous revision
kubectl rollout undo   deployment/api --to-revision=3
kubectl rollout history deployment/api</code></pre>
<p><strong>The pause/resume pair is a genuinely useful manual canary:</strong> update the image, let one or two new pods come up, pause, watch metrics for ten minutes, then resume or undo. It gives you progressive delivery without installing Argo Rollouts.</p>
<p><strong>The prerequisite people forget:</strong> a rolling update means both versions serve traffic simultaneously, so the new version must work with the old database schema and the old version must tolerate anything the new one writes. If that is not true, a rolling update is not safe and no strategy setting fixes it — the fix is backwards-compatible migrations.</p>
<p>Note that <code>kubectl rollout undo</code> works because the previous <code>ReplicaSet</code> is retained (scaled to zero); <code>revisionHistoryLimit</code> controls how many are kept.</p>`
},
{
  q: "How do you implement multi-tenancy in Kubernetes?",
  level: "advanced", tags: ["architecture", "security"],
  a: `<table>
<tr><th>Model</th><th>Isolation</th><th>Cost</th><th>Fit</th></tr>
<tr><td><strong>Namespace per tenant</strong></td><td>Soft — shared control plane and nodes</td><td>Lowest</td><td>Internal teams, trusted tenants</td></tr>
<tr><td><strong>Node pool per tenant</strong></td><td>Medium — dedicated compute</td><td>Medium</td><td>Noisy-neighbour or compliance concerns</td></tr>
<tr><td><strong>Cluster per tenant</strong></td><td>Strongest</td><td>Highest</td><td>Regulated, or untrusted workloads</td></tr>
<tr><td><strong>Virtual clusters</strong> (vcluster)</td><td>Strong control-plane isolation</td><td>Medium</td><td>A good middle ground</td></tr>
</table>
<pre><code># Namespace-per-tenant needs ALL of these, not just the namespace
apiVersion: v1
kind: ResourceQuota                      # 1. cap total consumption
spec:
  hard: { requests.cpu: "20", requests.memory: 40Gi, pods: "50", services.loadbalancers: "2" }
---
kind: LimitRange                          # 2. sane defaults so no pod is BestEffort
spec:
  limits:
    - type: Container
      default:        { cpu: 500m, memory: 512Mi }
      defaultRequest: { cpu: 100m, memory: 128Mi }
---
kind: NetworkPolicy                       # 3. default deny — pods can otherwise reach ANY pod
metadata: { name: default-deny }
spec:
  podSelector: {}
  policyTypes: [ Ingress, Egress ]
---
kind: RoleBinding                         # 4. RBAC scoped to this namespace only
---
# 5. Pod Security Standards — forbid privileged containers, host mounts, root
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted</code></pre>
<p><strong>The critical point about namespaces:</strong> a namespace is an <em>organisational</em> boundary, not a security boundary. Without a NetworkPolicy, a pod in tenant A's namespace can open a TCP connection to any pod in tenant B's. Without a ResourceQuota, one tenant can consume the whole cluster. And all tenants still share the same kernel — a container escape crosses every namespace.</p>
<p><strong>The judgement to express:</strong> "For internal teams, namespaces with quotas, RBAC and network policies are proportionate. For untrusted or regulated workloads I would use separate clusters or at minimum sandboxed runtimes like gVisor or Kata, because a shared kernel is a shared blast radius — and that is a decision to make deliberately rather than discover during an audit."</p>`
},
{
  q: "What are admission controllers and policy enforcement?",
  level: "advanced", tags: ["security", "governance"],
  a: `<p>Every request to the API server passes through <strong>admission controllers</strong> after authentication and authorization but <em>before</em> the object is persisted. They are the enforcement point for organisational policy.</p>
<pre><code>Request -&gt; Authentication -&gt; Authorization -&gt; MUTATING admission
        -&gt; Schema validation -&gt; VALIDATING admission -&gt; etcd</code></pre>
<ul>
<li><strong>Mutating</strong> webhooks modify the object — injecting a sidecar (this is how Istio works), adding default labels, setting resource requests.</li>
<li><strong>Validating</strong> webhooks accept or reject it — no mutation.</li>
</ul>
<pre><code># Kyverno — policy as a Kubernetes resource, no code required
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-resources }
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-limits
      match:
        any: [{ resources: { kinds: [Pod] } }]
      validate:
        message: "CPU and memory requests are required"
        pattern:
          spec:
            containers:
              - resources:
                  requests: { memory: "?*", cpu: "?*" }</code></pre>
<p><strong>Policies worth enforcing in any real cluster:</strong> resource requests must be set (otherwise pods land in the BestEffort class and are evicted first); no <code>:latest</code> image tags; images only from approved registries; containers must not run as root or privileged; no <code>hostPath</code> mounts or host networking; required labels for cost attribution and ownership; and — the strong one — <strong>only signed images may run</strong>, verified with Cosign.</p>
<p><strong>Why this beats documentation and code review:</strong> a policy in a wiki is advisory; an admission controller is a guarantee. It applies uniformly to every team, every deployment method and every emergency hotfix at 2am — which is exactly when the shortcuts get taken.</p>
<p><strong>Tools:</strong> Kyverno (Kubernetes-native YAML policies, gentler learning curve), OPA/Gatekeeper (Rego, more expressive), and built-in <strong>Validating Admission Policy</strong> using CEL (1.30+), which avoids running a webhook at all. Mention the operational risk too: a failing webhook with <code>failurePolicy: Fail</code> can block <em>all</em> deployments, so exempt system namespaces and monitor webhook latency.</p>`
},
{
  q: "How do you plan and execute a Kubernetes version upgrade?",
  level: "advanced", tags: ["operations", "production"],
  a: `<p>Kubernetes releases roughly three minor versions a year and supports each for about 14 months, so upgrades are continuous work rather than a one-off project.</p>
<ol>
<li><strong>Read the release notes for <em>every</em> version you skip</strong> — you must upgrade one minor version at a time, and each has its own deprecations.</li>
<li><strong>Find deprecated API usage before it breaks:</strong>
<pre><code>kubectl deprecations                      # krew plugin
pluto detect-files -d ./manifests         # scan your YAML and Helm charts
kubent                                    # scans the live cluster</code></pre>
This is where most upgrades fail — a Helm chart still using a removed API version, discovered at the worst moment.</li>
<li><strong>Check component compatibility</strong> — CNI, CSI drivers, ingress controller, service mesh, cert-manager, metrics-server and operators all have their own supported version matrices.</li>
<li><strong>Upgrade order matters:</strong> control plane first, then node pools, then add-ons. The control plane may be at most two minor versions ahead of kubelets, never behind.</li>
<li><strong>Upgrade nodes by surge, not in place</strong> — create new nodes on the new version, cordon and drain the old ones, then remove them. That gives you an instant rollback path.</li>
<li><strong>PodDisruptionBudgets are what make draining safe:</strong>
<pre><code>kind: PodDisruptionBudget
spec:
  minAvailable: 2                # or maxUnavailable: 1
  selector: { matchLabels: { app: api } }</code></pre>
Without one, a drain can evict every replica of a service at once.</li>
<li><strong>Rehearse on a non-production cluster</strong> with the same add-ons and manifests.</li>
</ol>
<p><strong>The two things that actually go wrong:</strong> a removed API version breaking a deployment mid-upgrade, and a PodDisruptionBudget that is impossible to satisfy (<code>minAvailable</code> equal to <code>replicas</code>) causing the drain to hang forever. Both are found by rehearsing.</p>
<p><strong>Worth stating:</strong> on a managed service (EKS, GKE, AKS) the control plane upgrade is one API call, so the real work is compatibility checking and node rotation. Staying current is also a security requirement — an unsupported version stops receiving patches.</p>`
}
]);
