appendTopic("spring-boot", [
{
  q: "How do you add observability — traces, metrics and correlated logs — to a Spring Boot service?",
  level: "advanced", hot: true, tags: ["observability", "production", "micrometer"],
  companies: ["Amazon", "Optum", "Maersk", "SAP", "Walmart", "Societe Generale", "Flipkart", "Nagarro"],
  a: `<p>The three pillars only pay off when they share a <strong>trace id</strong>, so you can go from an alert to the exact failing request in one hop.</p>
<pre><code>&lt;!-- Micrometer Tracing bridges to OpenTelemetry --&gt;
&lt;dependency&gt;&lt;groupId&gt;io.micrometer&lt;/groupId&gt;
  &lt;artifactId&gt;micrometer-tracing-bridge-otel&lt;/artifactId&gt;&lt;/dependency&gt;
&lt;dependency&gt;&lt;groupId&gt;io.opentelemetry&lt;/groupId&gt;
  &lt;artifactId&gt;opentelemetry-exporter-otlp&lt;/artifactId&gt;&lt;/dependency&gt;
&lt;dependency&gt;&lt;groupId&gt;io.micrometer&lt;/groupId&gt;
  &lt;artifactId&gt;micrometer-registry-prometheus&lt;/artifactId&gt;&lt;/dependency&gt;</code></pre>
<pre><code>management:
  endpoints.web.exposure.include: health,info,metrics,prometheus
  tracing.sampling.probability: 0.1      # 100% in dev, a slice in prod
  otlp.tracing.endpoint: http://collector:4318/v1/traces
  metrics.tags.application: \${spring.application.name}

logging.pattern.level: "%5p [\${spring.application.name},%X{traceId:-},%X{spanId:-}]"
# Micrometer puts traceId/spanId in the MDC, so every log line carries them.</code></pre>
<table>
<tr><th>Signal</th><th>Answers</th><th>Tool</th></tr>
<tr><td><strong>Metrics</strong></td><td>Is it happening, and how often?</td><td>Prometheus + Grafana</td></tr>
<tr><td><strong>Traces</strong></td><td>Where did this one request spend its time?</td><td>Tempo, Jaeger, Zipkin</td></tr>
<tr><td><strong>Logs</strong></td><td>What exactly happened?</td><td>Loki, ELK</td></tr>
<tr><td>Profiles</td><td>Which code burned the CPU?</td><td>Pyroscope, async-profiler</td></tr>
</table>
<pre><code>// Custom instrumentation
@Observed(name = "order.process", contextualName = "process-order")
public Order process(OrderRequest r) { }           // one annotation -> span + metric

meterRegistry.counter("orders.created", "channel", channel).increment();
Timer.builder("payment.gateway").publishPercentileHistogram()
     .register(meterRegistry).record(() -&gt; gateway.charge(req));

// ⚠ Cardinality is the trap. A tag with unbounded values — userId, orderId,
// a URL with path params — creates one time series per value and will take
// down Prometheus. Tags are for LOW-cardinality dimensions: status, region,
// endpoint template.</code></pre>
<p><strong>Alert on the four golden signals</strong> — latency, traffic, errors, saturation — not on CPU. CPU going to 80% is not a customer problem; p99 latency doubling is. And alert on <em>symptoms</em> the user feels, with the cause found afterwards from the trace.</p>
<p><strong>The distinction worth drawing:</strong> "Monitoring tells me a known thing broke. Observability lets me ask a question I had not thought of before the incident — which is why I want high-cardinality <em>trace</em> data even though I keep metric cardinality low."</p>`
},
{
  q: "How would you add an LLM feature to a Spring Boot service, and what breaks?",
  level: "advanced", hot: true, tags: ["ai", "spring-ai", "modern", "production"],
  companies: ["Amazon", "SAP", "Optum", "Adobe", "Flipkart", "EPAM", "Publicis Sapient", "Salesforce"],
  a: `<pre><code>// Spring AI gives the same shape as RestTemplate/JdbcTemplate did
&lt;dependency&gt;&lt;groupId&gt;org.springframework.ai&lt;/groupId&gt;
  &lt;artifactId&gt;spring-ai-anthropic-spring-boot-starter&lt;/artifactId&gt;&lt;/dependency&gt;

@Service
public class SupportService {
    private final ChatClient chat;

    SupportService(ChatClient.Builder builder) {
        this.chat = builder
            .defaultSystem("You answer only from the supplied context. "
                         + "If the context does not contain the answer, say so.")
            .build();
    }

    public String answer(String question, List&lt;Doc&gt; context) {
        return chat.prompt()
            .system(s -&gt; s.param("context", render(context)))
            .user(question)
            .call()
            .content();
    }
}

# application.yml
spring.ai.anthropic.api-key: \${ANTHROPIC_API_KEY}
spring.ai.anthropic.chat.options.model: claude-sonnet-5
spring.ai.anthropic.chat.options.temperature: 0.2</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Retrieval augmented generation pipeline">
  <rect class="dg-box" x="16" y="58" width="82" height="34" rx="6"/><text class="dg-s" x="57" y="80" text-anchor="middle">question</text>
  <path class="dg-line" d="M102 75 H146" marker-end="url(#ai1)"/>
  <rect class="dg-fill" x="150" y="58" width="104" height="34" rx="6"/><text class="dg-s" x="202" y="80" text-anchor="middle">embed</text>
  <path class="dg-line" d="M258 75 H302" marker-end="url(#ai1)"/>
  <rect class="dg-fill" x="306" y="58" width="118" height="34" rx="6"/><text class="dg-s" x="365" y="80" text-anchor="middle">vector search</text>
  <path class="dg-line" d="M428 75 H472" marker-end="url(#ai1)"/>
  <rect class="dg-fill2" x="476" y="58" width="128" height="34" rx="6"/><text class="dg-s" x="540" y="80" text-anchor="middle">LLM + context</text>
  <text class="dg-s" x="16" y="30">RAG: retrieve the facts first, then let the model phrase the answer</text>
  <text class="dg-s" x="16" y="130">this is what stops it inventing answers — and it means you can cite sources</text>
  <defs><marker id="ai1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>What breaks</th><th>Mitigation</th></tr>
<tr><td><strong>Latency</strong> — seconds, not milliseconds</td><td>Stream the response; never hold a transaction open across the call</td></tr>
<tr><td><strong>Non-determinism</strong></td><td>Low temperature; structured output; assert on <em>shape</em>, not exact text</td></tr>
<tr><td><strong>Cost per call</strong></td><td>Cache; cap tokens; pick the smallest model that passes your evals</td></tr>
<tr><td><strong>Prompt injection</strong></td><td>Treat retrieved and user text as <em>data</em>; never let it authorise an action</td></tr>
<tr><td><strong>Hallucination</strong></td><td>RAG with citations; make "I don't know" an acceptable answer</td></tr>
<tr><td>PII leaving your network</td><td>Redact before sending; check the provider's retention terms</td></tr>
<tr><td>Rate limits and outages</td><td>The same resilience you would give any dependency: timeout, retry with jitter, circuit breaker, fallback</td></tr>
</table>
<pre><code>// Treat the model as an unreliable remote dependency, because it is one
@CircuitBreaker(name = "llm", fallbackMethod = "cannedAnswer")
@Retry(name = "llm")
@TimeLimiter(name = "llm")
public CompletableFuture&lt;String&gt; answer(String q) { ... }

// And validate what comes back before it reaches a user or a database:
var parsed = chat.prompt().user(q)
    .call().entity(OrderSummary.class);     // structured output, schema-checked</code></pre>
<p><strong>The engineering point interviewers want:</strong> "The model is a probabilistic network call. Everything I already know about calling an unreliable third party applies — timeouts, budgets, circuit breakers, caching, and never trusting the response. What is genuinely new is that the <em>input</em> can be adversarial in a way that changes behaviour, so retrieved content must never be treated as instructions."</p>`
}
]);
