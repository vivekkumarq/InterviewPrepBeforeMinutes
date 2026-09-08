appendTopic("kubernetes", [
{
  q: "How do you manage configuration and secrets in Kubernetes?",
  level: "beginner", hot: true, tags: ["configuration", "security", "kubernetes"],
  companies: ["Amazon", "Optum", "Maersk", "TCS", "Infosys", "SAP", "Walmart", "Nagarro"],
  a: `<pre><code>apiVersion: v1
kind: ConfigMap
metadata: { name: api-config }
data:
  LOG_LEVEL: "INFO"
  application.yml: |            # a whole file, mounted as a volume
    spring:
      jpa:
        open-in-view: false
---
apiVersion: v1
kind: Secret
metadata: { name: api-secrets }
type: Opaque
stringData:                      # stringData is written as plain text; Kubernetes
  DB_PASSWORD: "s3cr3t"          # base64-encodes it for you
---
spec:
  containers:
    - name: api
      envFrom:
        - configMapRef: { name: api-config }
        - secretRef:    { name: api-secrets }
      volumeMounts:
        - name: config
          mountPath: /config     # file mounts UPDATE live; env vars do NOT
  volumes:
    - name: config
      configMap: { name: api-config }</code></pre>
<table>
<tr><th></th><th>Environment variable</th><th>Mounted file</th></tr>
<tr><td>Updates without a restart</td><td><strong>No</strong> — fixed at container start</td><td><strong>Yes</strong> — the kubelet refreshes it (with a delay of up to ~1 min)</td></tr>
<tr><td>Visible in <code>/proc</code> and crash dumps</td><td>Yes — a real leak risk for secrets</td><td>No</td></tr>
<tr><td>Best for</td><td>Simple scalars, 12-factor config</td><td>Whole config files, certificates, secrets</td></tr>
</table>
<p><strong>The point every interviewer probes:</strong> a Kubernetes <code>Secret</code> is <strong>base64-encoded, not encrypted</strong>. Anyone with <code>get secrets</code> RBAC, or read access to etcd, can decode it instantly. Base64 is there so binary data survives YAML, and for no other reason.</p>
<table>
<tr><th>Hardening step</th><th>What it fixes</th></tr>
<tr><td>Encryption at rest in etcd (<code>EncryptionConfiguration</code>)</td><td>An etcd backup no longer leaks every secret</td></tr>
<tr><td>RBAC — very few subjects with <code>get secrets</code></td><td>The most common real exposure</td></tr>
<tr><td><strong>External Secrets Operator</strong> or CSI driver</td><td>The real source is Vault / AWS Secrets Manager, with rotation and audit</td></tr>
<tr><td><strong>Sealed Secrets</strong> or SOPS</td><td>Lets you commit encrypted secrets to git for GitOps — only the cluster can decrypt</td></tr>
<tr><td>Workload identity (IRSA, Workload Identity)</td><td>No stored credential at all — the pod assumes a cloud role directly</td></tr>
</table>
<pre><code>apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: api-secrets }
spec:
  refreshInterval: 1h                        # rotation propagates automatically
  secretStoreRef: { name: aws-sm, kind: ClusterSecretStore }
  target: { name: api-secrets }
  data:
    - secretKey: DB_PASSWORD
      remoteRef: { key: prod/api/db, property: password }</code></pre>
<pre><code># The rollout problem nobody expects: changing a ConfigMap does NOT restart pods.
# Env vars keep the old values until something recreates the pod.

# Fix 1 — trigger a rollout explicitly
kubectl rollout restart deployment/api

# Fix 2 — a checksum annotation, so the pod template changes when the config does
spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}

# Fix 3 — immutable, versioned ConfigMaps (api-config-v2), referenced by name.
# Best for auditability: you can see exactly which config a rollout used.
immutable: true      # also reduces API server watch load at scale</code></pre>
<p><strong>The rule to state:</strong> "Configuration lives outside the image, so one artefact is promoted through every environment. Non-sensitive values go in a ConfigMap; secrets come from a real secret manager through the External Secrets Operator, because Kubernetes Secrets have no rotation, no versioning and no audit trail of their own. And I mount secrets as files rather than environment variables — env vars end up in crash dumps, child processes and <code>kubectl describe</code> output."</p>`
},
{
  q: "How does autoscaling work in Kubernetes — HPA, VPA and Cluster Autoscaler?",
  level: "advanced", hot: true, tags: ["scaling", "resources", "production", "cost"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Uber", "Swiggy", "SAP"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Three autoscalers operating at pod, resource and node level">
  <rect class="dg-fill" x="16" y="26" width="180" height="52" rx="8"/>
  <text class="dg-s" x="106" y="48" text-anchor="middle">HPA — more PODS</text>
  <text class="dg-s" x="106" y="66" text-anchor="middle">horizontal, on metrics</text>
  <rect class="dg-fill2" x="216" y="26" width="180" height="52" rx="8"/>
  <text class="dg-s" x="306" y="48" text-anchor="middle">VPA — bigger pods</text>
  <text class="dg-s" x="306" y="66" text-anchor="middle">adjusts requests/limits</text>
  <rect class="dg-box" x="416" y="26" width="188" height="52" rx="8"/>
  <text class="dg-s" x="510" y="48" text-anchor="middle">Cluster Autoscaler</text>
  <text class="dg-s" x="510" y="66" text-anchor="middle">more NODES</text>
  <path class="dg-line" d="M106 82 V112" marker-end="url(#as1)"/>
  <path class="dg-line" d="M510 112 V82" marker-end="url(#as1)"/>
  <rect class="dg-box" x="140" y="112" width="340" height="34" rx="6"/>
  <text class="dg-s" x="310" y="134" text-anchor="middle">pods Pending because no node fits → add a node</text>
  <text class="dg-s" x="16" y="160">HPA and VPA on the same metric FIGHT each other — never combine them on CPU</text>
  <defs><marker id="as1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }   # % of the REQUEST
    - type: Pods                                    # custom metric via Prometheus adapter
      pods:
        metric: { name: http_requests_per_second }
        target: { type: AverageValue, averageValue: "200" }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0                 # react fast to load
      policies: [{ type: Percent, value: 100, periodSeconds: 30 }]
    scaleDown:
      stabilizationWindowSeconds: 300               # scale down SLOWLY — avoids flapping
      policies: [{ type: Percent, value: 10, periodSeconds: 60 }]</code></pre>
<p><strong>The formula HPA uses:</strong> <code>desired = ceil(current × currentMetric / targetMetric)</code>. So with 4 pods at 90% CPU and a 70% target, it scales to <code>ceil(4 × 90/70) = 6</code>. Two consequences worth stating: utilisation is measured against the <strong>request</strong>, so a wrong request value makes the HPA scale on nonsense; and if no request is set, CPU-based HPA does not work at all.</p>
<table>
<tr><th>Autoscaler</th><th>Scales</th><th>Watch out for</th></tr>
<tr><td><strong>HPA</strong></td><td>Replica count</td><td>Needs resource requests; useless for a single-replica stateful workload</td></tr>
<tr><td><strong>VPA</strong></td><td>CPU/memory requests</td><td><strong>Recreates pods</strong> to apply changes (until in-place resize is stable); conflicts with HPA on the same metric</td></tr>
<tr><td><strong>Cluster Autoscaler</strong></td><td>Nodes</td><td>Only triggers on <em>Pending</em> pods; node provisioning takes minutes</td></tr>
<tr><td><strong>KEDA</strong></td><td>Replicas, including to zero</td><td>The right answer for queue-driven work — scale on Kafka lag or SQS depth</td></tr>
</table>
<pre><code># KEDA — scale on the metric that actually reflects the backlog
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
spec:
  scaleTargetRef: { name: order-consumer }
  minReplicaCount: 0                  # scale to ZERO when idle — real cost saving
  maxReplicaCount: 50
  triggers:
    - type: kafka
      metadata:
        topic: orders
        consumerGroup: order-processor
        lagThreshold: "1000"
# CPU is a poor proxy for a consumer that is mostly waiting on IO. Lag is not.</code></pre>
<table>
<tr><th>Problem</th><th>Cause</th><th>Fix</th></tr>
<tr><td>Replicas oscillate</td><td>Scale-down too aggressive</td><td>Longer <code>stabilizationWindowSeconds</code> on scaleDown</td></tr>
<tr><td>Scales too late</td><td>Metric lags real load</td><td>Scale on a leading signal — queue depth or request rate, not CPU</td></tr>
<tr><td>Pods stuck Pending</td><td>No node has room</td><td>Cluster Autoscaler; check quotas and node selectors</td></tr>
<tr><td>New pods slow to serve</td><td>JVM warm-up during a traffic spike</td><td>Longer <code>minReadySeconds</code>, a startup probe, and scale earlier</td></tr>
<tr><td>Scaling breaks a downstream</td><td>200 pods × 10 connections exhausts the database</td><td>Cap <code>maxReplicas</code> against downstream capacity — autoscaling has to respect the weakest link</td></tr>
</table>
<p><strong>The point that shows production experience:</strong> "Autoscaling is bounded by whatever you are scaling <em>into</em>. Scaling an API to 200 pods when the database pool tops out at 100 connections just moves the failure — so <code>maxReplicas</code> is a capacity decision about the whole system, not just this deployment. And I scale up fast but down slowly, because being briefly over-provisioned is much cheaper than flapping."</p>`
}
]);
