appendTopic("spring-boot", [
{
  q: "Walk me through what happens between main() and the first request being served",
  level: "advanced", hot: true, tags: ["startup", "auto-configuration", "internals", "must-know"],
  companies: ["Amazon", "Infosys", "TCS", "Wipro", "Accenture", "SAP", "Capgemini", "Cognizant"],
  a: `<pre><code>@SpringBootApplication          // = @Configuration + @EnableAutoConfiguration
public class App {              //   + @ComponentScan(from THIS package down)
    public static void main(String[] args) { SpringApplication.run(App.class, args); }
}</code></pre>
<table>
<tr><th>#</th><th>Step</th><th>What it does</th></tr>
<tr><td>1</td><td>Deduce the application type</td><td>Servlet, reactive or none — decided by what is on the classpath</td></tr>
<tr><td>2</td><td>Load <code>ApplicationContextInitializer</code> and listeners</td><td>From <code>META-INF/spring.factories</code></td></tr>
<tr><td>3</td><td>Prepare the <code>Environment</code></td><td>Merge every property source in precedence order</td></tr>
<tr><td>4</td><td>Create the <code>ApplicationContext</code></td><td><code>AnnotationConfigServletWebServerApplicationContext</code> for a web app</td></tr>
<tr><td>5</td><td>Scan and register bean <em>definitions</em></td><td>Definitions only — nothing is instantiated yet</td></tr>
<tr><td>6</td><td><strong>Auto-configuration</strong></td><td><code>AutoConfiguration.imports</code> is read, conditions evaluated, matches registered <em>last</em></td></tr>
<tr><td>7</td><td>Run <code>BeanFactoryPostProcessor</code>s</td><td><code>@ConfigurationProperties</code> binding, placeholder resolution</td></tr>
<tr><td>8</td><td>Instantiate singletons</td><td>Constructor injection, then <code>BeanPostProcessor</code>s wrap beans in proxies (AOP, <code>@Transactional</code>)</td></tr>
<tr><td>9</td><td>Start the embedded server</td><td>Tomcat binds the port and the context is refreshed</td></tr>
<tr><td>10</td><td><code>ApplicationRunner</code> / <code>CommandLineRunner</code></td><td>Your startup hooks, after everything is wired</td></tr>
</table>
<pre><code>// AUTO-CONFIGURATION is just conditional @Configuration classes.
@AutoConfiguration
@ConditionalOnClass(DataSource.class)                 // is the driver present?
@ConditionalOnMissingBean(DataSource.class)           // did the USER define one?
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration { ... }

// @ConditionalOnMissingBean is the mechanism behind "convention over
// configuration": auto-config runs LAST, so anything you declare yourself
// silently wins. There is no magic override — just ordering.

// The conditions you will be asked to name:
@ConditionalOnClass / @ConditionalOnMissingClass      // classpath
@ConditionalOnBean  / @ConditionalOnMissingBean       // context
@ConditionalOnProperty(name="feature.x", havingValue="true")
@ConditionalOnWebApplication / @ConditionalOnNotWebApplication
@ConditionalOnResource / @ConditionalOnExpression     // SpEL</code></pre>
<pre><code># SEEING what was auto-configured — the answer to "how would you debug it?"
java -jar app.jar --debug          # prints the CONDITIONS EVALUATION REPORT:
                                   # Positive matches, Negative matches, and
                                   # the exact reason each condition failed.
# Or the actuator endpoint:
GET /actuator/conditions
GET /actuator/beans                # every bean and its dependencies
GET /actuator/configprops          # bound @ConfigurationProperties values

# Turning one off:
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
spring.autoconfigure.exclude=org.springframework...DataSourceAutoConfiguration</code></pre>
<table>
<tr><th>Property source, highest precedence first</th></tr>
<tr><td>Command-line arguments <code>--server.port=9090</code></td></tr>
<tr><td><code>SPRING_APPLICATION_JSON</code></td></tr>
<tr><td>OS environment variables (<code>SERVER_PORT</code> — relaxed binding)</td></tr>
<tr><td>Java system properties <code>-Dserver.port</code></td></tr>
<tr><td><code>application-{profile}.yml</code> <em>outside</em> the jar</td></tr>
<tr><td><code>application-{profile}.yml</code> inside the jar</td></tr>
<tr><td><code>application.yml</code></td></tr>
<tr><td><code>@PropertySource</code>, then defaults in code</td></tr>
</table>
<p><strong>The point to land:</strong> "Spring Boot is not magic — it is conditional configuration plus a fixed evaluation order. Everything it decided is visible in the conditions report, which is where I look first when a bean is not what I expected." That reframes it from memorised annotations to a mechanism you can debug.</p>`
},
{
  q: "How do you make a Spring Boot service production-ready?",
  level: "advanced", hot: true, tags: ["actuator", "observability", "production", "must-know"],
  companies: ["Amazon", "Microsoft", "SAP", "Infosys", "TCS", "Walmart", "Flipkart", "Goldman Sachs"],
  a: `<pre><code># HEALTH AND READINESS — get these wrong and Kubernetes restarts you in a loop
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.probes.enabled=true
management.endpoint.health.show-details=when-authorized

# LIVENESS  -> /actuator/health/liveness   "is the process broken?"
#              A failure means RESTART. It must NOT check the database —
#              a database blip would restart every pod at once.
# READINESS -> /actuator/health/readiness  "can I serve traffic right now?"
#              A failure means REMOVE FROM LOAD BALANCER. It SHOULD check
#              downstream dependencies.
# Conflating the two is the most common Kubernetes-plus-Boot mistake.</code></pre>
<pre><code>// GRACEFUL SHUTDOWN — otherwise a deploy drops in-flight requests
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
// On SIGTERM: stop accepting new connections, finish in-flight work, then exit.
// Pair it with a preStop sleep in Kubernetes so the endpoint is removed from
// the load balancer BEFORE the JVM stops accepting — otherwise there is a
// window where traffic is still routed to a shutting-down pod.</code></pre>
<table>
<tr><th>Concern</th><th>What to configure</th></tr>
<tr><td><strong>Metrics</strong></td><td>Micrometer → Prometheus. JVM, HTTP, datasource and custom business counters</td></tr>
<tr><td><strong>Tracing</strong></td><td>Micrometer Tracing + OpenTelemetry; propagate the trace id across services</td></tr>
<tr><td><strong>Logging</strong></td><td>JSON to stdout, trace id in the MDC, never log PII or tokens</td></tr>
<tr><td><strong>Errors</strong></td><td><code>@RestControllerAdvice</code> returning RFC 7807 <code>ProblemDetail</code></td></tr>
<tr><td><strong>Connection pool</strong></td><td>HikariCP sized deliberately, with a <code>leakDetectionThreshold</code></td></tr>
<tr><td><strong>Timeouts</strong></td><td>On every outbound client — <code>RestClient</code>, <code>WebClient</code>, JDBC</td></tr>
<tr><td><strong>Secrets</strong></td><td>Environment or a vault — never <code>application.yml</code> in git</td></tr>
<tr><td><strong>Container</strong></td><td><code>-XX:MaxRAMPercentage=75</code>, not a hard-coded <code>-Xmx</code></td></tr>
</table>
<pre><code>// A CUSTOM HEALTH INDICATOR — one bean, and it appears in /actuator/health
@Component
public class KafkaHealthIndicator implements HealthIndicator {
    @Override public Health health() {
        try {
            admin.describeCluster().nodes().get(2, TimeUnit.SECONDS);
            return Health.up().withDetail("brokers", count).build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
// CAREFUL: every indicator contributes to the OVERALL health status, which
// readiness reads. Making a non-critical dependency part of health means an
// outage in something optional takes your service out of the load balancer.
// Mark those as non-critical or expose them in a separate group.</code></pre>
<pre><code>// CUSTOM METRICS — what actually gets alerted on
@Timed(value = "order.process", percentiles = {0.5, 0.95, 0.99})
public Order process(OrderRequest req) { ... }

meterRegistry.counter("orders.placed", "channel", req.channel()).increment();
// Tag cardinality is the trap: tagging by userId or orderId creates a new
// time series per value and will take down your metrics backend. Tag by
// bounded dimensions only — status, channel, region.</code></pre>
<table>
<tr><th>Hikari setting</th><th>Guidance</th></tr>
<tr><td><code>maximum-pool-size</code></td><td>Start near <code>cores × 2</code>. Bigger is usually <em>slower</em> — the database is the constrained resource</td></tr>
<tr><td><code>connection-timeout</code></td><td>Fail fast (2–5 s) rather than queueing requests invisibly</td></tr>
<tr><td><code>max-lifetime</code></td><td>Shorter than any database or proxy idle timeout, or you get stale connections</td></tr>
<tr><td><code>leak-detection-threshold</code></td><td>Set it — it names the exact stack that failed to close a connection</td></tr>
</table>
<p><strong>The one-liner:</strong> "Production-ready means the service can be restarted, scaled and debugged without me. That is graceful shutdown, correct liveness versus readiness, structured logs with a trace id, metrics with bounded tag cardinality, and a timeout on every outbound call."</p>`
}
]);
