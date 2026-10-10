registerSimple("kubernetes", {
"What is an Ingress and how does it differ from a Service and the Gateway API?":
`A <b>Service</b> gives a set of pods one stable address inside the cluster. An <b>Ingress</b> is the front door for web traffic from outside: one entry point that routes requests to different Services by domain or URL path, such as <code>/api</code> to one and <code>/shop</code> to another. The <b>Gateway API</b> is the newer, more flexible replacement for Ingress.`,

"How do you troubleshoot a Service that is not routing traffic?":
`Follow the chain step by step. Does the Service have endpoints (<code>kubectl get endpoints</code>)? If not, its selector does not match the pod labels, or the pods are not ready. If it does, check that the Service's target port matches the port the container actually listens on, and that the app listens on all addresses, not only localhost.`,

"What are init containers, sidecars and ephemeral containers?":
`<b>Init containers</b> run to completion before the main app starts, for example waiting for a database or running migrations. <b>Sidecars</b> run alongside the app for its whole life, for example a log shipper or a proxy. <b>Ephemeral containers</b> are added temporarily to a running pod for debugging, especially when the main image has no shell.`,

"How do you manage secrets securely in Kubernetes?":
`Kubernetes Secrets are only base64-encoded, not encrypted, so anyone allowed to read them can see the values. Turn on encryption at rest, limit who can read Secrets with RBAC, and preferably keep secrets in an external manager (such as Vault or a cloud secret manager) that syncs them into the cluster. Never commit secrets to git.`,

"What are Kubernetes operators and Custom Resource Definitions?":
`A <b>CRD</b> adds your own type of object to Kubernetes, such as "PostgresCluster". An <b>operator</b> is a program that watches those objects and does the expert work to make them real: creating databases, taking backups, handling failover. It packages operational knowledge into software.`,

"How do you handle stateful applications and persistent storage?":
`Use a <b>StatefulSet</b>, which gives each pod a stable name (db-0, db-1) and its own persistent disk that follows it when the pod is rescheduled. Storage is requested through a PersistentVolumeClaim. Even so, running databases in Kubernetes takes real effort, so many teams use a managed cloud database instead.`,

"How do you optimise Kubernetes costs and right-size workloads?":
`Set CPU and memory requests based on what pods actually use, because requested resources are reserved and paid for even when idle. Use autoscaling so you run fewer pods at quiet times, let the cluster autoscaler remove empty nodes, use cheaper spot nodes for work that can be interrupted, and clean up unused resources.`,

"What are Jobs, CronJobs and how do you run batch work reliably?":
`A <b>Job</b> runs a task until it completes successfully, retrying on failure. A <b>CronJob</b> creates Jobs on a schedule, like a cron timer. To make them reliable: prevent overlapping runs with <code>concurrencyPolicy: Forbid</code>, limit retries, set a deadline, and make the task safe to run twice.`,

"How does Kubernetes DNS and service discovery work internally?":
`Kubernetes runs a DNS server (CoreDNS) inside the cluster. Every Service automatically gets a name, such as <code>orders.shop.svc.cluster.local</code>, and pods can use just <code>orders</code> within the same namespace. The name resolves to the Service's stable IP, which forwards traffic to one of the healthy pods.`,

"What is the difference between a rolling update, recreate and how do you pause a rollout?":
`A <b>rolling update</b> replaces pods gradually, so the app stays up throughout. <b>Recreate</b> stops all old pods first, then starts the new ones, causing a short outage, but it never runs two versions at once. <code>kubectl rollout pause</code> stops a rollout part way so you can check it, and <code>kubectl rollout resume</code> continues it.`,

"How do you implement multi-tenancy in Kubernetes?":
`For trusted internal teams, give each one its own namespace with resource quotas, access rules (RBAC) and network policies. For stronger isolation, give tenants their own groups of nodes. For untrusted tenants or strict security, give each its own cluster. More isolation means more cost.`,

"What are admission controllers and policy enforcement?":
`Admission controllers check, and can change, every request to create or update something in the cluster, before it is saved. With policy tools such as Kyverno or OPA Gatekeeper you can enforce rules like "every container must have memory limits" or "images may only come from our registry".`,

"How do you plan and execute a Kubernetes version upgrade?":
`Kubernetes releases new versions often and old ones lose support, so upgrades are routine work. Read the release notes for removed features, check your manifests for outdated API versions, upgrade a test cluster first, upgrade the control plane, then the nodes gradually, with PodDisruptionBudgets keeping your apps running.`,

"A pod is stuck in CrashLoopBackOff — how do you diagnose it?":
`CrashLoopBackOff means the container keeps starting and then crashing, and Kubernetes waits longer between each retry. Run <code>kubectl logs --previous</code> to see why the last run died, and <code>kubectl describe pod</code> for the exit reason. Common causes: bad configuration, a missing environment variable, an unreachable database, or running out of memory (OOMKilled).`,

"Explain requests, limits and QoS classes — how does Kubernetes decide what to evict?":
`<b>Requests</b> are what a pod is guaranteed and are used to choose a node. <b>Limits</b> are the maximum it may use: going over the CPU limit just slows it down, but going over the memory limit kills it. When a node runs short of memory, Kubernetes evicts pods with no requests first, then pods using more than they requested.`,

"How does a Service route traffic, and what is the difference between ClusterIP, NodePort, LoadBalancer and Ingress?":
`<b>ClusterIP</b> (the default) is reachable only inside the cluster. <b>NodePort</b> opens the same port on every node. <b>LoadBalancer</b> creates a cloud load balancer with a public address for one Service. <b>Ingress</b> uses one shared entry point to route web traffic to many Services, which is cheaper and more flexible.`,

"How do you perform a zero-downtime deployment in Kubernetes?":
`Use a rolling update that never removes old pods before new ones are ready, readiness probes so traffic only reaches ready pods, graceful shutdown so in-flight requests finish, and a short pause before shutting down, so the load balancer stops sending requests to a pod that is about to stop.`,

"What is the difference between a Deployment, StatefulSet, DaemonSet and Job?":
`<b>Deployment</b>: identical, interchangeable pods for stateless apps such as APIs. <b>StatefulSet</b>: pods with stable names and their own disks, for databases. <b>DaemonSet</b>: exactly one pod on every node, for log collectors and monitoring agents. <b>Job</b>: runs a task to completion and then stops.`,

"How do you manage configuration and secrets in Kubernetes?":
`Put ordinary settings in a <b>ConfigMap</b> and passwords and keys in a <b>Secret</b>, and give them to pods as environment variables or as files. Environment variables are fixed when the container starts; mounted files update automatically after a while. Keep the same image for every environment and change only the configuration.`,

"How does autoscaling work in Kubernetes — HPA, VPA and Cluster Autoscaler?":
`The <b>HPA</b> adds or removes pods based on measurements such as CPU use. The <b>VPA</b> adjusts how much CPU and memory each pod requests. The <b>Cluster Autoscaler</b> adds nodes when pods cannot fit and removes nodes that are empty. HPA and the Cluster Autoscaler together let the whole system grow and shrink with demand.`,

"A pod is not starting — how do you debug it?":
`Run <code>kubectl describe pod</code> and read the events at the bottom. <b>Pending</b> means it could not be placed on a node (not enough resources, or rules that no node matches). <b>ImagePullBackOff</b> means the image name or registry access is wrong. <b>CrashLoopBackOff</b> means the app starts and crashes, so check <code>kubectl logs --previous</code>.`,

"How do you manage Kubernetes manifests across environments — Helm, Kustomize or GitOps?":
`<b>Helm</b> uses templates and value files and packages apps as charts. <b>Kustomize</b> keeps a plain base set of files and applies small per-environment changes on top. <b>GitOps</b> (Argo CD, Flux) keeps everything in git, and a tool in the cluster continuously applies whatever git says, so git is the single source of truth.`,

"A pod is in CrashLoopBackOff. Walk me through debugging it.":
`Look at the logs of the crashed run with <code>kubectl logs --previous</code>, then <code>kubectl describe pod</code> for the exit code and events. Exit code 137 or "OOMKilled" means not enough memory. Otherwise, check configuration, environment variables, secrets and whether its dependencies are reachable, and make sure a liveness probe is not killing it during a slow start.`,

"Write the manifests for a production-ready Spring Boot service and explain every field":
`A production setup has a Deployment with several replicas, resource requests and limits, startup, readiness and liveness probes, graceful shutdown and a non-root security context; a Service in front; configuration from ConfigMaps and Secrets; a PodDisruptionBudget; and usually an autoscaler. Each field prevents a specific real failure.`,

"How do you keep a service up while nodes are drained for maintenance? PodDisruptionBudgets explained":
`When a node is drained for maintenance, its pods are moved elsewhere. A <b>PodDisruptionBudget</b> sets a rule such as "always keep at least 2 pods of this app running", so the drain waits rather than taking down too many at once. Combine it with several replicas spread across different nodes.`,

"What is Kubernetes and what problem does it solve?":
`Kubernetes runs containers across many machines and keeps them healthy. It decides where each container runs, restarts crashed ones, replaces failed machines, spreads traffic between copies, scales up and down with demand, and rolls out new versions without downtime, all based on the state you declare in configuration files.`,

"Explain the Kubernetes architecture":
`The <b>control plane</b> is the brain: the API server (which everything talks to), etcd (the database storing the cluster's state), the scheduler (which picks nodes for pods) and controllers (which keep the actual state matching what you asked for). <b>Worker nodes</b> run the kubelet, which starts containers, and kube-proxy, which handles Service networking.`,

"What is a Pod, and why not just run containers?":
`A Pod is the smallest thing Kubernetes runs: one or more containers that share one IP address and can share storage. Usually a pod has one container. Grouping lets closely linked helpers, such as a proxy or log shipper, run right next to the app, and gives Kubernetes a single unit to schedule, monitor and restart.`,

"Deployment vs StatefulSet vs DaemonSet vs Job":
`Use a <b>Deployment</b> for stateless apps where pods are interchangeable. Use a <b>StatefulSet</b> when each pod needs a stable identity and its own disk, as databases do. Use a <b>DaemonSet</b> to run one pod on every node, for agents. Use a <b>Job</b> for tasks that run once and finish.`,

"What is a Service and what are the service types?":
`Pods come and go and their IP addresses change, so a Service gives a group of pods one stable name and address and spreads traffic between them. Types: <b>ClusterIP</b> (inside the cluster only), <b>NodePort</b> (a port open on every node), <b>LoadBalancer</b> (a cloud load balancer) and <b>ExternalName</b> (an alias for an outside address).`,

"How do liveness, readiness and startup probes differ?":
`<b>Liveness</b>: "is the app stuck?" If it fails, the container is restarted. <b>Readiness</b>: "can it take traffic right now?" If it fails, traffic stops going to it, but it is not restarted. <b>Startup</b>: "has it finished starting?" It holds off the other probes until the app is up, which protects slow-starting apps.`,

"What are resource requests and limits, and what happens when you exceed them?":
`A <b>request</b> is the amount of CPU and memory a pod is guaranteed, used by the scheduler to find a node with room. A <b>limit</b> is the most it may use. Going over the CPU limit only slows the pod down. Going over the memory limit gets the container killed (OOMKilled) and restarted.`,

"How do ConfigMaps and Secrets work?":
`Both hold configuration outside the container image. A <b>ConfigMap</b> holds ordinary settings; a <b>Secret</b> holds sensitive values such as passwords. Pods receive them as environment variables or as mounted files. Note that Secrets are only base64-encoded, so restrict access to them and enable encryption.`,

"How do rolling updates and rollbacks work?":
`When you change a Deployment, for example the image version, Kubernetes starts new pods and stops old ones a few at a time, waiting for new pods to be ready. If something goes wrong, <code>kubectl rollout undo</code> switches back to the previous version in the same gradual way.`,

"How does autoscaling work — HPA, VPA and Cluster Autoscaler?":
`The <b>Horizontal Pod Autoscaler</b> changes the number of pods based on load such as CPU. The <b>Vertical Pod Autoscaler</b> changes how much CPU and memory each pod gets. The <b>Cluster Autoscaler</b> adds machines when pods do not fit and removes idle ones. Avoid letting HPA and VPA both react to CPU on the same app.`,

"How do you debug a failing pod?":
`Start with <code>kubectl get pods</code> to see the status, then <code>kubectl describe pod</code> for events and reasons, <code>kubectl logs</code> (with <code>--previous</code> for the crashed run), and <code>kubectl exec</code> to look inside a running container. The status tells you where to look: Pending, ImagePullBackOff, CrashLoopBackOff or OOMKilled.`,

"What is a Namespace, and how do RBAC and network policies work?":
`A <b>namespace</b> divides one cluster into separate areas, for example per team or environment. <b>RBAC</b> controls who can do what in each namespace, such as letting developers view pods but not delete them. <b>Network policies</b> control which pods may talk to which, like a firewall inside the cluster.`,

"How do you manage Kubernetes manifests — Helm, Kustomize, GitOps?":
`<b>Helm</b> packages manifests as reusable templates with settings. <b>Kustomize</b> keeps plain YAML and applies small per-environment changes. <b>GitOps</b> tools such as Argo CD keep the cluster automatically in sync with what is in git, so every change is reviewed in a pull request and can be rolled back.`,

"What are taints, tolerations, affinity and node selectors?":
`They control which nodes pods run on. A <b>node selector</b> says "only run on nodes with this label". <b>Affinity</b> expresses preferences, such as "spread my pods across zones". A <b>taint</b> on a node keeps pods away unless they have a matching <b>toleration</b>, which is useful for reserving special nodes, such as GPU machines.`
});
