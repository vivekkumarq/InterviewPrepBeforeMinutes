appendTopic("kubernetes", [
{
  q: "A pod is in CrashLoopBackOff. Walk me through debugging it.",
  level: "advanced", hot: true, tags: ["debugging", "troubleshooting", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "SAP", "Flipkart", "Walmart", "Uber", "Infosys"],
  a: `<pre><code># The four commands, in order. Ninety percent of failures are named here.
kubectl describe pod &lt;name&gt;        # EVENTS at the bottom — read these FIRST
kubectl logs &lt;name&gt;                # current container
kubectl logs &lt;name&gt; --previous     # the CRASHED one — the actual error
kubectl get events --sort-by=.lastTimestamp | tail -20

# --previous is the one people forget. The current container has just started
# and its logs are empty; the reason it died is in the previous instance.</code></pre>
<table>
<tr><th>Status</th><th>Meaning</th><th>Usual cause</th></tr>
<tr><td><code>CrashLoopBackOff</code></td><td>Starts, exits, restarts, with growing backoff</td><td>Application error on startup, bad config, missing dependency</td></tr>
<tr><td><code>ImagePullBackOff</code></td><td>Cannot fetch the image</td><td>Wrong tag, private registry without <code>imagePullSecrets</code></td></tr>
<tr><td><code>Pending</code></td><td>Not scheduled onto any node</td><td>Insufficient CPU/memory, a taint, an unbound PVC</td></tr>
<tr><td><code>OOMKilled</code> (exit 137)</td><td>Exceeded the memory <strong>limit</strong></td><td>Limit too low, or the JVM heap larger than the limit</td></tr>
<tr><td><code>Error</code> exit 1</td><td>The application itself failed</td><td>Read the logs</td></tr>
<tr><td><code>CreateContainerConfigError</code></td><td>Cannot build the container config</td><td>A referenced Secret or ConfigMap does not exist</td></tr>
<tr><td><code>Running</code> but <code>0/1 READY</code></td><td>Readiness probe failing</td><td>Wrong path or port, or too short an <code>initialDelay</code></td></tr>
</table>
<pre><code># THE JVM-IN-A-CONTAINER TRAP — the most common OOMKilled cause
resources:
  limits:
    memory: "1Gi"
# The JVM defaults to ~25% of available memory for the heap, but the heap is
# NOT the whole footprint: metaspace, thread stacks, code cache, direct
# buffers and GC structures live outside it. A 768 MB heap in a 1 GB limit
# gets OOMKilled by the kernel — and it is the KERNEL, so there is no
# OutOfMemoryError and no heap dump. The pod just dies, exit 137.
#
# Leave headroom:
env:
  - name: JAVA_OPTS
    value: "-XX:MaxRAMPercentage=75 -XX:MaxMetaspaceSize=256m"
# And note: exit 137 = 128 + 9 (SIGKILL). 143 = 128 + 15 (SIGTERM), which is
# a normal shutdown.</code></pre>
<pre><code># PROBES — and the misconfiguration that causes a restart loop
livenessProbe:            # failure -> RESTART the container
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  initialDelaySeconds: 30 # must exceed the real startup time
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:           # failure -> REMOVE from the Service endpoints
  httpGet: { path: /actuator/health/readiness, port: 8080 }
startupProbe:             # protects a slow starter from liveness
  httpGet: { path: /actuator/health, port: 8080 }
  failureThreshold: 30
  periodSeconds: 10       # allows 300s to start, THEN liveness takes over

# The classic self-inflicted outage: liveness checks the DATABASE. The
# database has a brief blip, every pod fails liveness, every pod restarts at
# once, and a 10-second blip becomes a 5-minute outage.
# Liveness = "is this process wedged?" — nothing external.</code></pre>
<pre><code># DIGGING DEEPER when the logs are not enough
kubectl exec -it &lt;pod&gt; -- sh                     # shell in, if it stays up
kubectl debug &lt;pod&gt; -it --image=busybox --target=app   # ephemeral container,
                                                 # works with distroless images
kubectl get pod &lt;name&gt; -o yaml                   # the FULL resolved spec
kubectl top pod &lt;name&gt;                           # live CPU and memory
kubectl rollout undo deployment/&lt;name&gt;           # fastest mitigation
kubectl describe node &lt;node&gt;                     # pressure, taints, capacity</code></pre>
<table>
<tr><th>Requests vs limits — the mental model</th></tr>
<tr><td><strong>Request</strong> is what the scheduler reserves. Too low and the pod lands on a node that cannot really support it</td></tr>
<tr><td><strong>Limit</strong> is the ceiling. Exceed memory and you are killed; exceed CPU and you are <em>throttled</em>, not killed</td></tr>
<tr><td>CPU throttling shows up as unexplained latency with no errors — check <code>container_cpu_cfs_throttled_seconds</code></td></tr>
<tr><td>Setting requests equal to limits gives a pod the Guaranteed QoS class, so it is evicted last under node pressure</td></tr>
</table>
<p><strong>The habit worth stating:</strong> "I read the events before the logs. <code>describe</code> tells me whether the platform failed to place or pull the pod, or whether the application started and then died — and those are completely different investigations. Starting with the application logs when the real problem is an unbound volume claim wastes the first twenty minutes."</p>`
}
]);
