registerPrimer("spring-boot", `<p class="pr-lead"><b>Spring Boot</b> is the fastest way to build a Spring application. Plain Spring makes you set up a lot by hand: the web server, the database connection, JSON handling, logging. Spring Boot looks at what you have added to your project and sets all of that up for you with sensible defaults, so you can start writing features straight away.</p>
<div class="pr-analogy"><b>Think of it like this</b>Plain Spring is like buying furniture as flat-pack pieces: everything you need is there, but you assemble it yourself. Spring Boot is like buying a furnished flat. Everything is already set up in a sensible way, and you only change the pieces you do not like.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Starter</dt><dd>A single dependency that brings a whole set of libraries that work together. <code>spring-boot-starter-web</code> gives you everything to build a web API.</dd>
<dt>Auto-configuration</dt><dd>Boot automatically creating the beans you need based on what is in your project, for example a database connection pool when it sees a database driver.</dd>
<dt>Embedded server</dt><dd>The web server (Tomcat by default) is built into your application, so you run it with just <code>java -jar app.jar</code>.</dd>
<dt>application.yml</dt><dd>The file where you put settings such as the server port or database address.</dd>
<dt>Profile</dt><dd>A named group of settings for one environment, such as "dev" or "prod".</dd>
<dt>Actuator</dt><dd>Ready-made endpoints that report your app's health and metrics.</dd>
</dl>

<h3>Step by step: what happens when a Spring Boot app starts</h3>
<ol class="pr-steps">
<li><b>main() runs.</b> It calls <code>SpringApplication.run(...)</code>.</li>
<li><b>Settings are loaded</b> from <code>application.yml</code>, environment variables and command-line arguments.</li>
<li><b>Your own beans are found</b> by scanning your packages for @Service, @RestController and so on.</li>
<li><b>Auto-configuration fills the gaps.</b> For each feature, Boot checks: is the library present, and have you already created this bean yourself? If the library is there and you have not, Boot creates it.</li>
<li><b>The web server starts</b> and your app is ready to answer requests.</li>
</ol>
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

<h3>A worked example: a working API from very little code</h3>
<pre><code># application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/shop
    username: shop
    password: secret
server:
  port: 8081

@SpringBootApplication
public class ShopApp {
    public static void main(String[] args) {
        SpringApplication.run(ShopApp.class, args);
    }
}</code></pre>
<ol class="pr-steps">
<li>The project includes the web starter, the JPA (database) starter and a PostgreSQL driver.</li>
<li><code>@SpringBootApplication</code> turns on component scanning, auto-configuration and configuration support in one annotation.</li>
<li>Because a database driver is present and the URL is set, Boot creates a connection pool, sets up JPA and transactions, and builds your repositories.</li>
<li>Because the web starter is present, it configures JSON conversion, error handling and an embedded Tomcat on port 8081.</li>
<li>You wrote almost no setup code. To see every decision Boot made, run the app with <code>--debug</code>.</li>
</ol>

<h3>How to change what Boot set up for you</h3>
<ul>
<li><b>Change a setting:</b> add it to <code>application.yml</code>, for example <code>server.port</code>.</li>
<li><b>Replace a bean:</b> define your own <code>@Bean</code> of that type. Boot sees yours and backs off.</li>
<li><b>Different settings per environment:</b> put them in <code>application-prod.yml</code> and turn the profile on with <code>SPRING_PROFILES_ACTIVE=prod</code>.</li>
<li><b>Secrets:</b> pass them as environment variables (like <code>SPRING_DATASOURCE_PASSWORD</code>), never commit them to Git.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Putting the main class in the wrong package</p>
<p>Spring Boot only scans the package of your main class and the packages below it. A service in a sibling package is never found, and the app fails with "required a bean that could not be found".</p>
<p class="pm-fix"><strong>✅ Fix:</strong> put the main class in the top-level package, such as <code>com.shop</code>, with everything else below it.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Adding a database starter with no database settings</p>
<p>The data starter tells Boot to build a database connection. Without a URL it cannot, and startup fails with "Failed to configure a DataSource".</p>
<p class="pm-fix"><strong>✅ Fix:</strong> set <code>spring.datasource.url</code>, or remove the starter if you do not need a database yet.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Exposing every Actuator endpoint publicly</p>
<p>Some Actuator endpoints show configuration values or let people download memory contents, which can leak passwords.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> expose only <code>health</code> and <code>info</code> publicly, and protect the rest.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Letting Hibernate change the production database schema</p>
<p><code>ddl-auto=update</code> lets Hibernate alter tables automatically. It cannot rename or remove safely and nobody reviews what it does.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use a migration tool such as Flyway or Liquibase, with versioned SQL scripts.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Starters bring a working set of libraries in one dependency.</li>
<li>Auto-configuration sets up beans for you, and backs off when you define your own.</li>
<li>Settings live in <code>application.yml</code>, with profiles for each environment.</li>
<li>The app runs as one jar with its own built-in web server.</li>
<li>Keep the main class at the top of your package structure.</li>
</ul>
<p><b>Next:</b> the questions below cover configuration, error handling, validation, testing, Actuator and production readiness.</p>`);

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
