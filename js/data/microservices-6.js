appendTopic("microservices", [
{
  q: "How do services find and talk to each other, and where does a service mesh fit?",
  level: "advanced", tags: ["discovery", "mesh", "architecture", "networking"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Uber", "SAP", "Nagarro"],
  a: `<table>
<tr><th>Approach</th><th>How</th><th>Trade-off</th></tr>
<tr><td><strong>Kubernetes DNS</strong></td><td><code>http://orders.prod.svc.cluster.local</code></td><td>Free, no library, no registry. Usually enough.</td></tr>
<tr><td>Client-side (Eureka, Consul)</td><td>Client fetches the registry, picks an instance</td><td>Smart clients; a library in every language you use</td></tr>
<tr><td>Server-side (load balancer)</td><td>Client calls one address; the LB routes</td><td>Simple clients; the LB is a hop and a dependency</td></tr>
<tr><td><strong>Service mesh</strong> (Istio, Linkerd)</td><td>A sidecar proxy intercepts all traffic</td><td>Retries, mTLS, tracing with <em>no application code</em> — at real operational cost</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Sidecar proxies handling traffic between two services">
  <rect class="dg-box" x="16" y="36" width="200" height="78" rx="10"/>
  <text class="dg-s" x="116" y="28" text-anchor="middle">pod A</text>
  <rect class="dg-fill" x="30" y="52" width="86" height="46" rx="7"/><text class="dg-s" x="73" y="79" text-anchor="middle">app</text>
  <rect class="dg-fill2" x="122" y="52" width="80" height="46" rx="7"/><text class="dg-s" x="162" y="72" text-anchor="middle">sidecar</text><text class="dg-s" x="162" y="88" text-anchor="middle">proxy</text>
  <path class="dg-line" d="M206 75 H274" marker-end="url(#ms1)"/>
  <text class="dg-s" x="240" y="66" text-anchor="middle">mTLS</text>
  <rect class="dg-box" x="278" y="36" width="200" height="78" rx="10"/>
  <text class="dg-s" x="378" y="28" text-anchor="middle">pod B</text>
  <rect class="dg-fill2" x="292" y="52" width="80" height="46" rx="7"/><text class="dg-s" x="332" y="72" text-anchor="middle">sidecar</text><text class="dg-s" x="332" y="88" text-anchor="middle">proxy</text>
  <rect class="dg-fill" x="378" y="52" width="86" height="46" rx="7"/><text class="dg-s" x="421" y="79" text-anchor="middle">app</text>
  <text class="dg-s" x="492" y="70">retries, timeouts,</text>
  <text class="dg-s" x="492" y="88">tracing, policy</text>
  <text class="dg-s" x="16" y="140">the application makes a plain HTTP call and knows nothing about any of it</text>
  <defs><marker id="ms1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>A mesh gives you</th><th>A mesh costs you</th></tr>
<tr><td>mTLS between every service, with rotation</td><td>A proxy per pod — CPU, memory, and a latency hop</td></tr>
<tr><td>Retries, timeouts, circuit breaking by policy</td><td>A whole control plane to run and upgrade</td></tr>
<tr><td>Traffic splitting for canaries</td><td>Debugging now spans app <em>and</em> proxy</td></tr>
<tr><td>Golden metrics for free</td><td>A steep learning curve for the whole team</td></tr>
</table>
<p><strong>The honest recommendation:</strong> "Start with Kubernetes DNS and library-level resilience — Resilience4j gives you timeouts, retries and circuit breakers in the one language you actually use. A mesh earns its cost when you need mTLS everywhere for compliance, or you are polyglot enough that reimplementing resilience per language is worse than running a control plane. Adopting one because it is modern is how teams acquire an operational burden they cannot staff."</p>
<p><strong>Ambient mode is worth naming:</strong> newer Istio deployments can run without a per-pod sidecar, using a per-node proxy instead — which removes most of the resource overhead and is the main thing that has changed about this trade-off recently.</p>`
},
{
  q: "How do you handle distributed tracing and debug a request across ten services?",
  level: "advanced", hot: true, tags: ["tracing", "observability", "debugging", "production"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Uber", "Societe Generale"],
  a: `<pre><code># W3C Trace Context — the standard header every language now understands
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
#             ^  ^--------- trace id ---------^ ^--- span id --^ ^flags
#             version                                             sampled?

# One trace id for the whole request. Each service adds a SPAN, with the
# caller's span as its parent — so the trace reconstructs the call tree.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="A trace waterfall showing which span dominates the latency">
  <rect class="dg-fill" x="16" y="26" width="560" height="22" rx="4"/><text class="dg-s" x="22" y="42">gateway  420 ms</text>
  <rect class="dg-fill" x="50" y="54" width="500" height="22" rx="4"/><text class="dg-s" x="56" y="70">order-service  380 ms</text>
  <rect class="dg-fill2" x="80" y="82" width="60" height="22" rx="4"/><text class="dg-s" x="148" y="98">auth 40ms</text>
  <rect class="dg-box" x="150" y="110" width="380" height="22" rx="4"/><text class="dg-s" x="158" y="126">inventory  300 ms  ← the actual problem</text>
  <text class="dg-s" x="16" y="150">without the trace, every team says "it is not us" and you bisect by guesswork</text>
</svg>
</figure>
<table>
<tr><th>Concept</th><th>Is</th></tr>
<tr><td><strong>Trace</strong></td><td>The whole request across every service</td></tr>
<tr><td><strong>Span</strong></td><td>One unit of work, with a start, a duration and a parent</td></tr>
<tr><td>Baggage</td><td>Key/values that travel with the trace — tenant id, feature flags</td></tr>
<tr><td>Sampling</td><td>Which traces to keep. Head-based decides up front; <strong>tail-based</strong> decides after, so you can keep all the slow and failed ones.</td></tr>
</table>
<pre><code># Spring Boot: the trace id lands in the MDC automatically
management.tracing.sampling.probability: 0.1
logging.pattern.level: "%5p [%X{traceId:-},%X{spanId:-}]"

# So a log search for the trace id returns every line from every service
# for that one request. That is the payoff — go from an alert to the
# failing hop in one query.</code></pre>
<table>
<tr><th>What breaks tracing</th><th>Fix</th></tr>
<tr><td>Context lost across a thread pool</td><td>Micrometer's context propagation, or pass it explicitly</td></tr>
<tr><td>Context lost through a message queue</td><td>Put <code>traceparent</code> in the message <strong>headers</strong>, not the body</td></tr>
<tr><td>A service that does not forward the header</td><td>One unpropagated hop breaks the whole tree below it</td></tr>
<tr><td>Sampling too low to find the rare failure</td><td>Tail-based sampling: keep every error and slow trace</td></tr>
<tr><td>Cardinality explosion in span attributes</td><td>High cardinality is fine on <em>traces</em>, not on metrics</td></tr>
</table>
<p><strong>The debugging method to describe:</strong> "Start from the alert, find an exemplar trace from the metric, open the waterfall, and look for the widest span that is not waiting on a child. That tells you which service and which operation — then the logs filtered by that trace id tell you why. Without tracing, a ten-service request is debugged by asking ten teams, and everyone's dashboard looks fine."</p>`
}
]);
