appendTopic("kubernetes", [
{
  q: "A pod is not starting — how do you debug it?",
  level: "beginner", hot: true, tags: ["debugging", "production", "kubernetes", "must-know"],
  companies: ["Amazon", "Optum", "Maersk", "TCS", "Infosys", "Walmart", "Nagarro", "SAP"],
  a: `<pre><code>kubectl get pods                      # what STATE is it in?
kubectl describe pod &lt;p&gt;              # the EVENTS at the bottom explain most of it
kubectl logs &lt;p&gt; --previous           # --previous = the instance that crashed
kubectl get events --sort-by=.lastTimestamp</code></pre>
<table>
<tr><th>Status</th><th>Means</th><th>Check</th></tr>
<tr><td><strong>Pending</strong></td><td>Not scheduled onto any node</td><td><code>describe</code> → insufficient CPU/memory, taints, node selector, unbound PVC</td></tr>
<tr><td><strong>ImagePullBackOff</strong></td><td>Cannot fetch the image</td><td>Wrong name or tag, private registry without <code>imagePullSecrets</code></td></tr>
<tr><td><strong>CrashLoopBackOff</strong></td><td>Starts, then exits repeatedly</td><td><code>logs --previous</code> — it is almost always config or a missing dependency</td></tr>
<tr><td><strong>OOMKilled</strong> (exit 137)</td><td>Exceeded its memory limit</td><td>Raise the limit, or fix the leak. Check <code>MaxRAMPercentage</code>.</td></tr>
<tr><td><strong>Error</strong> / exit 1</td><td>The process failed</td><td>Application logs</td></tr>
<tr><td><strong>Running but not Ready</strong></td><td>Readiness probe failing</td><td>Probe path, port, and whether a dependency is down</td></tr>
<tr><td><strong>Terminating</strong> forever</td><td>Not honouring SIGTERM, or a finalizer</td><td>Graceful shutdown; check <code>metadata.finalizers</code></td></tr>
</table>
<pre><code># When the container will not stay up long enough to exec into it
kubectl debug -it &lt;pod&gt; --image=busybox --target=&lt;container&gt;   # ephemeral container
kubectl run tmp --rm -it --image=busybox --restart=Never -- sh # a throwaway pod

# Is it DNS? It is very often DNS.
kubectl run tmp --rm -it --image=busybox --restart=Never -- \\
  nslookup orders.prod.svc.cluster.local

# Does the Service actually have endpoints? No endpoints = selector mismatch.
kubectl get endpoints orders
kubectl describe svc orders</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="Debug order from events to logs to exec">
  <rect class="dg-fill" x="12" y="48" width="136" height="44" rx="8"/>
  <text class="dg-s" x="80" y="66" text-anchor="middle">1. describe</text><text class="dg-s" x="80" y="83" text-anchor="middle">read the Events</text>
  <path class="dg-line" d="M152 70 H178" marker-end="url(#kd1)"/>
  <rect class="dg-fill" x="182" y="48" width="136" height="44" rx="8"/>
  <text class="dg-s" x="250" y="66" text-anchor="middle">2. logs --previous</text><text class="dg-s" x="250" y="83" text-anchor="middle">why it exited</text>
  <path class="dg-line" d="M322 70 H348" marker-end="url(#kd1)"/>
  <rect class="dg-fill" x="352" y="48" width="136" height="44" rx="8"/>
  <text class="dg-s" x="420" y="66" text-anchor="middle">3. exec / debug</text><text class="dg-s" x="420" y="83" text-anchor="middle">look inside</text>
  <path class="dg-line" d="M492 70 H518" marker-end="url(#kd1)"/>
  <rect class="dg-box" x="522" y="48" width="86" height="44" rx="8"/>
  <text class="dg-s" x="565" y="74" text-anchor="middle">4. network</text>
  <text class="dg-s" x="12" y="128">most failures are answered by step 1 — the Events section is under-read</text>
  <defs><marker id="kd1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>The OOMKilled nuance worth knowing:</strong> exit 137 means the <em>kernel</em> killed it, not the JVM. If you set <code>-Xmx</code> equal to the pod's memory limit you will be OOMKilled long before you ever see a Java <code>OutOfMemoryError</code> — because metaspace, thread stacks, code cache and direct buffers all live outside the heap but inside the limit. That is exactly what <code>MaxRAMPercentage=75</code> leaves room for.</p>`
},
{
  q: "How do you manage Kubernetes manifests across environments — Helm, Kustomize or GitOps?",
  level: "advanced", tags: ["helm", "gitops", "deployment", "kubernetes"],
  companies: ["Amazon", "Optum", "Maersk", "SAP", "Walmart", "Nagarro", "Societe Generale", "EPAM"],
  a: `<table>
<tr><th></th><th>Helm</th><th>Kustomize</th></tr>
<tr><td>Model</td><td>Go templates + values</td><td><strong>Overlays that patch a base</strong> — no templating</td></tr>
<tr><td>Manifests stay valid YAML</td><td>No — they are templates</td><td><strong>Yes</strong></td></tr>
<tr><td>Packaging and versioning</td><td><strong>Yes</strong> — charts, repos, dependencies</td><td>No</td></tr>
<tr><td>Rollback</td><td><code>helm rollback</code>, built in</td><td>Via git</td></tr>
<tr><td>Best for</td><td><strong>Distributing</strong> software to others</td><td><strong>Your own</strong> app across environments</td></tr>
</table>
<pre><code># Kustomize — the base is plain, readable YAML
base/
  deployment.yaml  service.yaml  kustomization.yaml
overlays/
  prod/kustomization.yaml

# overlays/prod/kustomization.yaml
resources: [../../base]
replicas: [{ name: api, count: 6 }]
images:  [{ name: api, newTag: 1.4.2 }]
patches:
  - path: resources-patch.yaml       # bigger limits in prod only
configMapGenerator:
  - name: api-config
    literals: [LOG_LEVEL=INFO]
# generators append a content HASH to the name, so changing config
# automatically rolls the pods — a real advantage over hand-written ConfigMaps</code></pre>
<pre><code># Helm — when the same app is deployed by many teams, or you ship it
helm install api ./chart -f values-prod.yaml --atomic --wait
helm diff upgrade api ./chart -f values-prod.yaml    # ALWAYS diff first
helm rollback api 3

# --atomic rolls back automatically if the release fails, which stops a
# half-applied upgrade sitting there.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 145" role="img" aria-label="GitOps reconciliation loop">
  <rect class="dg-fill" x="16" y="52" width="120" height="40" rx="8"/><text class="dg-s" x="76" y="77" text-anchor="middle">git repo</text>
  <path class="dg-line" d="M140 72 H196" marker-end="url(#gk1)"/>
  <text class="dg-s" x="168" y="62" text-anchor="middle">watch</text>
  <rect class="dg-fill2" x="200" y="52" width="150" height="40" rx="8"/><text class="dg-s" x="275" y="77" text-anchor="middle">Argo CD / Flux</text>
  <path class="dg-line" d="M354 72 H410" marker-end="url(#gk1)"/>
  <text class="dg-s" x="382" y="62" text-anchor="middle">apply</text>
  <rect class="dg-box" x="414" y="52" width="150" height="40" rx="8"/><text class="dg-s" x="489" y="77" text-anchor="middle">cluster</text>
  <path class="dg-line" d="M489 96 Q280 134 76 96" marker-end="url(#gk1)" stroke-dasharray="4 3"/>
  <text class="dg-s" x="290" y="126" text-anchor="middle">continuously reconciles — drift is corrected automatically</text>
  <text class="dg-s" x="16" y="32">git is the source of truth; nobody runs kubectl apply by hand</text>
  <defs><marker id="gk1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>GitOps gives you</th></tr>
<tr><td>The cluster state is auditable — it is a git history, with reviews</td></tr>
<tr><td>Rollback is <code>git revert</code></td></tr>
<tr><td>Drift is detected and corrected, so nobody's manual <code>kubectl edit</code> survives</td></tr>
<tr><td>CI needs no cluster credentials — the agent pulls, CI does not push</td></tr>
<tr><td>A new environment is a new directory</td></tr>
</table>
<p><strong>The secrets question it raises:</strong> you cannot commit plaintext secrets to the repo GitOps reads. The answers are Sealed Secrets or SOPS (encrypted in git, decrypted in-cluster), or the External Secrets Operator pulling from Vault — which is better still, because the secret never enters git at all.</p>
<p><strong>What to recommend:</strong> "Kustomize for our own application, because the manifests stay valid YAML anyone can read; Helm for third-party components we install. Then Argo CD on top, so deploying is merging a pull request and the cluster converges on its own."</p>`
}
]);
