registerPrimer("spring-boot", `<h3>The mental model: Spring, plus sensible defaults, plus a server in the jar</h3>
<p>Plain Spring gives you the container, but you still have to configure everything: the web server, JSON, the database pool, logging. Spring Boot does three things on top.</p>
<ul>
<li><strong>Starters</strong> are dependency bundles. Add <code>spring-boot-starter-web</code> and you get Spring MVC, Jackson, validation and an embedded Tomcat, all at versions tested together.</li>
<li><strong>Auto-configuration</strong> looks at what is on the classpath and in your properties, and creates the beans you would otherwise write by hand. Each one is <em>conditional</em>: it only applies if you have not defined your own.</li>
<li><strong>An embedded server</strong> means the app is a single runnable jar. <code>java -jar app.jar</code> starts the server; there is no separate Tomcat to install.</li>
</ul>
<figure class="fig">
<svg viewBox="0 0 620 226" role="img" aria-label="Spring Boot startup: main, load configuration, evaluate auto-configuration conditions, create beans, start embedded server, ready">
  <defs><marker id="pr-sb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="10" y="20" width="100" height="52" rx="8"/>
  <text class="dg-m" x="60" y="42" text-anchor="middle">main()</text>
  <text class="dg-s" x="60" y="60" text-anchor="middle">run(App.class)</text>
  <line class="dg-line" x1="110" y1="46" x2="130" y2="46" marker-end="url(#pr-sb)"/>
  <rect class="dg-box" x="132" y="20" width="110" height="52" rx="8"/>
  <text class="dg-t" x="187" y="42" text-anchor="middle">Environment</text>
  <text class="dg-s" x="187" y="60" text-anchor="middle">yml, env vars, args</text>
  <line class="dg-line" x1="242" y1="46" x2="262" y2="46" marker-end="url(#pr-sb)"/>
  <rect class="dg-box" x="264" y="20" width="110" height="52" rx="8"/>
  <text class="dg-t" x="319" y="42" text-anchor="middle">Your beans</text>
  <text class="dg-s" x="319" y="60" text-anchor="middle">component scan</text>
  <line class="dg-line" x1="374" y1="46" x2="394" y2="46" marker-end="url(#pr-sb)"/>
  <rect class="dg-fill2" x="396" y="20" width="110" height="52" rx="8"/>
  <text class="dg-t" x="451" y="42" text-anchor="middle">Auto-config</text>
  <text class="dg-s" x="451" y="60" text-anchor="middle">fills the gaps</text>
  <line class="dg-line" x1="506" y1="46" x2="526" y2="46" marker-end="url(#pr-sb)"/>
  <rect class="dg-fill" x="528" y="20" width="82" height="52" rx="8"/>
  <text class="dg-t" x="569" y="42" text-anchor="middle">Tomcat</text>
  <text class="dg-s" x="569" y="60" text-anchor="middle">port 8080</text>
  <rect class="dg-box" x="130" y="100" width="480" height="112" rx="10"/>
  <text class="dg-t" x="146" y="122">Inside auto-config: each candidate asks questions first</text>
  <text class="dg-m" x="146" y="148">DataSourceAutoConfiguration</text>
  <text class="dg-s" x="370" y="148">is a JDBC driver on the classpath?  yes</text>
  <text class="dg-s" x="370" y="166">did you define your own DataSource?  no</text>
  <text class="dg-s" x="370" y="184">so: build a HikariCP pool from spring.datasource.*</text>
  <text class="dg-s" x="146" y="204">about 150 candidates are checked; most are skipped because their conditions fail</text>
  <line class="dg-line" x1="451" y1="72" x2="451" y2="98" stroke-dasharray="3 3"/>
</svg>
<figcaption>Your beans are registered first. Auto-configuration then backs off wherever you already provided one.</figcaption>
</figure>
<h3>Worked example: what you write, and what Boot adds</h3>
<pre><code>// pom.xml: two starters and a driver
//   spring-boot-starter-web, spring-boot-starter-data-jpa, postgresql

# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/shop
    username: shop
    password: secret
server:
  port: 8081

@SpringBootApplication                     // = @Configuration
public class ShopApp {                     //   + @EnableAutoConfiguration
    public static void main(String[] args) {   //   + @ComponentScan (this package down)
        SpringApplication.run(ShopApp.class, args);
    }
}

// From those few lines, auto-configuration created:
//   a HikariCP DataSource            (from spring.datasource.*)
//   an EntityManagerFactory + JPA transaction manager
//   Spring Data repositories for every interface extending JpaRepository
//   a Jackson ObjectMapper and the JSON message converters
//   DispatcherServlet, error handling at /error, Tomcat on port 8081</code></pre>
<pre><code># See every decision it made, and why:
java -jar app.jar --debug
#   Positive matches:
#     DataSourceAutoConfiguration matched:
#       - @ConditionalOnClass found required classes 'javax.sql.DataSource' ...
#   Negative matches:
#     MongoAutoConfiguration:
#       Did not match: @ConditionalOnClass did not find required class 'com.mongodb.client.MongoClient'</code></pre>
<h3>How to override anything</h3>
<table>
<tr><th>You want</th><th>Do this</th></tr>
<tr><td>Change a setting</td><td>Set a property: <code>server.port</code>, <code>spring.jackson.*</code>, <code>spring.datasource.hikari.maximum-pool-size</code></td></tr>
<tr><td>Replace a bean</td><td>Define your own <code>@Bean</code> of that type. The auto-configured one backs off</td></tr>
<tr><td>Turn one off completely</td><td><code>@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)</code></td></tr>
<tr><td>Different values per environment</td><td>Profiles: <code>application-prod.yml</code>, activated with <code>SPRING_PROFILES_ACTIVE=prod</code></td></tr>
<tr><td>Secrets</td><td>Environment variables or a secret store, never committed yml. <code>SPRING_DATASOURCE_PASSWORD</code> maps to <code>spring.datasource.password</code></td></tr>
</table>`);

appendTopic("spring-boot", [
{
  q: "Call another service from Spring Boot with RestClient: timeouts, retries and error mapping",
  level: "advanced", hot: true, tags: ["restclient", "resilience", "timeouts", "microservices", "must-know"],
  companies: ["Amazon", "Flipkart", "Swiggy", "Zomato", "Walmart", "PhonePe", "Razorpay"],
  a: `<p>Calling another service looks like one line of code. In production it is where most outages spread from: a slow dependency with no timeout ties up every request thread, and the whole service stops answering. A good answer covers four things: <strong>timeouts, error mapping, retries, and a circuit breaker</strong>.</p>
<pre><code>// RestClient (Spring Boot 3.2+) is the synchronous successor to RestTemplate
@Configuration
class InventoryClientConfig {

    @Bean
    RestClient inventoryRestClient(RestClient.Builder builder,
                                   @Value("\${clients.inventory.url}") String baseUrl) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(1));   // time to open the connection
        factory.setReadTimeout(Duration.ofSeconds(2));      // time waiting for the response

        return builder
            .baseUrl(baseUrl)
            .requestFactory(factory)
            .defaultStatusHandler(HttpStatusCode::is4xxClientError, (req, res) -&gt; {
                throw new InventoryRejectedException(res.getStatusCode());   // OUR bug or
            })                                                                // bad input:
            .defaultStatusHandler(HttpStatusCode::is5xxServerError, (req, res) -&gt; {
                throw new InventoryUnavailableException(res.getStatusCode()); // THEIR problem:
            })                                                                // worth a retry
            .build();
    }
}
// Use the Builder Spring gives you: it already carries Boot's JSON converters
// and the observation (tracing) setup, so calls show up in your traces.</code></pre>
<pre><code>@Service
class InventoryClient {
    private final RestClient http;
    InventoryClient(RestClient inventoryRestClient) { this.http = inventoryRestClient; }

    @Retry(name = "inventory")                                    // Resilience4j
    @CircuitBreaker(name = "inventory", fallbackMethod = "unknownStock")
    public Stock stock(String sku) {
        return http.get()
                   .uri("/stock/{sku}", sku)                       // encoded for you
                   .retrieve()
                   .body(Stock.class);
    }

    private Stock unknownStock(String sku, Throwable cause) {
        return Stock.unknown(sku);          // the page shows "check availability"
    }                                       // instead of an error
}</code></pre>
<pre><code># application.yml
resilience4j:
  retry:
    instances:
      inventory:
        max-attempts: 3
        wait-duration: 200ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        retry-exceptions:                      # retry ONLY what a retry can fix
          - com.shop.InventoryUnavailableException
          - org.springframework.web.client.ResourceAccessException   # timeouts
  circuitbreaker:
    instances:
      inventory:
        sliding-window-size: 20
        failure-rate-threshold: 50             # open after 50% of 20 calls fail
        wait-duration-in-open-state: 30s       # then fail fast for 30s</code></pre>
<table>
<tr><th>Decision</th><th>Rule</th></tr>
<tr><td>Which errors to retry</td><td>Timeouts, connection errors, 502/503/504. <strong>Never 4xx</strong>: the same bad request fails the same way</td></tr>
<tr><td>Which calls to retry</td><td>Only idempotent ones (GET, or a POST with an idempotency key). Retrying a plain POST can charge a card twice</td></tr>
<tr><td>Backoff</td><td>Exponential, ideally with jitter, so a thousand clients do not retry in the same millisecond</td></tr>
<tr><td>Time budget</td><td>3 attempts × 2s timeout + waits is over 6 seconds. That must be less than <em>your</em> caller's timeout, or your retries are wasted work</td></tr>
<tr><td>Circuit breaker</td><td>When the dependency is clearly down, stop calling it for a while. Fail fast and give it room to recover</td></tr>
</table>
<p><strong>Worth mentioning:</strong> Spring Framework 7 (Spring Boot 4) adds <code>@Retryable</code> and <code>@ConcurrencyLimit</code> to the core framework, so simple retries no longer need an extra library. Resilience4j is still the usual choice when you also want a circuit breaker and bulkheads. And if the rest of the service is reactive, <code>WebClient</code> is the non-blocking equivalent of all of the above.</p>
<p><strong>The summary sentence:</strong> "Every outbound call gets a connect and a read timeout, errors mapped by cause, retries only for idempotent calls on transient failures with backoff, and a circuit breaker with a fallback, so one slow dependency cannot take my service down with it."</p>`
},
{
  q: "Your Spring Boot app will not start. Read these errors and fix each one",
  level: "beginner", hot: true, tags: ["startup", "debugging", "configuration", "must-know"],
  companies: ["Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Capgemini", "HCL", "Tech Mahindra"],
  a: `<p>Spring Boot prints a <strong>failure analysis</strong> block when startup fails. It is the most useful thing in the log, and it is often a screen above where people start reading. Always scroll to <code>APPLICATION FAILED TO START</code> first. Here are the six failures you will see most, with the fix for each.</p>
<pre><code>***************************
APPLICATION FAILED TO START
***************************
Description:
Parameter 0 of constructor in com.shop.order.OrderService required a bean of
type 'com.shop.payment.PaymentClient' that could not be found.</code></pre>
<p><strong>1. Missing bean.</strong> Either the class has no <code>@Component</code> / <code>@Service</code>, or it lives <strong>outside the scanned packages</strong>. Component scan starts at the package of your <code>@SpringBootApplication</code> class and goes down. If the app class is in <code>com.shop.app</code>, then <code>com.shop.payment</code> is never scanned. Fix: move the application class up to <code>com.shop</code>.</p>
<pre><code>Failed to configure a DataSource: 'url' attribute is not specified and no
embedded datasource could be configured.
Reason: Failed to determine a suitable driver class</code></pre>
<p><strong>2. Database starter with no database.</strong> Adding <code>spring-boot-starter-data-jpa</code> tells auto-configuration to build a DataSource, and it has no URL. Fix: set <code>spring.datasource.url</code> (check the active profile actually loads it), or add H2 for local work, or remove the starter if you did not mean to add it.</p>
<pre><code>Web server failed to start. Port 8080 was already in use.</code></pre>
<p><strong>3. Port taken.</strong> Usually a previous run is still alive. Find it (<code>netstat -ano | findstr :8080</code> on Windows, <code>lsof -i :8080</code> on Mac or Linux) and stop it, or set <code>server.port</code>. <code>server.port=0</code> picks a random free port, which is handy in tests.</p>
<pre><code>Could not resolve placeholder 'payment.api-key' in value "\${payment.api-key}"</code></pre>
<p><strong>4. Missing property.</strong> A <code>@Value</code> refers to a property that no source defines. Check the spelling, the active profile, and whether the environment variable exists in this environment (<code>PAYMENT_API_KEY</code> maps to <code>payment.api-key</code>). Better long-term fix: use <code>@ConfigurationProperties</code> with <code>@Validated</code>, which reports <em>every</em> missing field at once with a clear message.</p>
<pre><code>The dependencies of some of the beans in the application context form a cycle:
   orderService defined in file [OrderService.class]
┌─────┐
|  paymentService defined in file [PaymentService.class]
↑     ↓
|  orderService
└─────┘</code></pre>
<p><strong>5. Circular dependency.</strong> Spring Boot refuses cycles by default since 2.6. Do not "fix" it with <code>spring.main.allow-circular-references=true</code>. Two services that each need the other usually share some logic that belongs in a third bean, or one direction should be an event instead of a call.</p>
<pre><code>Parameter 0 of constructor in com.shop.ReportService required a single bean,
but 2 were found:
    - pgDataSource: defined by method 'pgDataSource' in DbConfig
    - reportingDataSource: defined by method 'reportingDataSource' in DbConfig</code></pre>
<p><strong>6. Two candidates.</strong> Mark the main one <code>@Primary</code>, and use <code>@Qualifier("reportingDataSource")</code> where you want the other.</p>
<table>
<tr><th>Error mentions</th><th>Look at</th></tr>
<tr><td>"could not be found"</td><td>Annotation missing, or package outside the scan</td></tr>
<tr><td>"DataSource" / "url"</td><td>Datasource properties and the active profile</td></tr>
<tr><td>"already in use"</td><td>A leftover process on that port</td></tr>
<tr><td>"placeholder"</td><td>Property name, profile, environment variables</td></tr>
<tr><td>"form a cycle"</td><td>The design: split out a third bean</td></tr>
<tr><td>"single bean, but 2"</td><td><code>@Primary</code> or <code>@Qualifier</code></td></tr>
<tr><td><code>NoSuchMethodError</code> / <code>ClassNotFoundException</code></td><td>Mixed library versions: run <code>mvn dependency:tree</code> and let the Boot BOM manage versions</td></tr>
</table>
<p><strong>The habit to describe:</strong> "I read the failure analysis block first, not the top of the stack trace. For anything about which beans exist, I run with <code>--debug</code> and read the conditions report."</p>`
}
]);
