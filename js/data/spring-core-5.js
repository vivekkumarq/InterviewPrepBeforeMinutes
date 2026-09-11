appendTopic("spring-core", [
{
  q: "How does Spring AOP actually work, and what can it not intercept?",
  level: "advanced", hot: true, tags: ["aop", "proxy", "internals"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "TCS", "EPAM", "Cognizant", "Societe Generale"],
  a: `<pre><code>@Aspect @Component
public class TimingAspect {

    @Around("@annotation(com.app.Timed)")            // pointcut
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();                     // call the real method
        } finally {
            metrics.record(pjp.getSignature().getName(), System.nanoTime() - start);
        }
    }
}</code></pre>
<table>
<tr><th>Advice</th><th>Runs</th></tr>
<tr><td><code>@Before</code></td><td>Before the method</td></tr>
<tr><td><code>@AfterReturning</code></td><td>Only on normal return</td></tr>
<tr><td><code>@AfterThrowing</code></td><td>Only on an exception</td></tr>
<tr><td><code>@After</code></td><td>Always — a <code>finally</code></td></tr>
<tr><td><strong><code>@Around</code></strong></td><td>Wraps it — the only one that can skip, retry or change the result</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 140" role="img" aria-label="Caller passing through a proxy into the target bean">
  <rect class="dg-box" x="16" y="52" width="96" height="36" rx="6"/><text class="dg-s" x="64" y="75" text-anchor="middle">caller</text>
  <path class="dg-line" d="M116 70 H166" marker-end="url(#ap1)"/>
  <rect class="dg-fill" x="170" y="40" width="170" height="60" rx="9"/>
  <text class="dg-s" x="255" y="62" text-anchor="middle">PROXY</text>
  <text class="dg-s" x="255" y="80" text-anchor="middle">advice runs here</text>
  <path class="dg-line" d="M344 70 H394" marker-end="url(#ap1)"/>
  <rect class="dg-fill2" x="398" y="40" width="150" height="60" rx="9"/>
  <text class="dg-s" x="473" y="62" text-anchor="middle">your bean</text>
  <text class="dg-s" x="473" y="80" text-anchor="middle">this.method()</text>
  <path class="dg-line" d="M470 104 Q430 128 410 104" marker-end="url(#ap1)"/>
  <text class="dg-s" x="16" y="128">an internal this.call() re-enters the bean directly — the proxy never sees it</text>
  <defs><marker id="ap1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Cannot be advised</th><th>Why</th></tr>
<tr><td><strong>Self-invocation</strong> (<code>this.method()</code>)</td><td>Never leaves the object, so it never crosses the proxy</td></tr>
<tr><td><code>private</code> methods</td><td>Not visible to subclass or interface proxying</td></tr>
<tr><td><code>final</code> methods or classes</td><td>CGLIB cannot override them</td></tr>
<tr><td><code>static</code> methods</td><td>No instance to proxy</td></tr>
<tr><td>Constructors and field access</td><td>Spring AOP is method-level only</td></tr>
<tr><td>Objects you created with <code>new</code></td><td>Not managed by the container at all</td></tr>
</table>
<pre><code>// JDK dynamic proxy   -> the bean implements an interface; advises interface methods
// CGLIB subclass proxy -> Spring Boot's default; needs a non-private constructor
//                         and non-final methods

// The full-strength option, which removes every limitation above:
// AspectJ load-time or compile-time weaving — it rewrites the BYTECODE, so
// self-invocation, private and final methods are all advised. Heavier setup.</code></pre>
<p><strong>Why this matters beyond AOP trivia:</strong> <code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code>, <code>@Retryable</code> and <code>@PreAuthorize</code> are <em>all</em> implemented this way. So the self-invocation rule is not an AOP curiosity — it is the reason a transaction silently does nothing, with no error and no log line, which is one of the most common Spring bugs there is.</p>`
},
{
  q: "How does Spring Boot auto-configuration work under the hood?",
  level: "advanced", hot: true, tags: ["autoconfiguration", "internals", "spring-boot"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "TCS", "Wipro", "Cognizant", "EPAM"],
  a: `<pre><code>@SpringBootApplication
// = @Configuration + @ComponentScan + @EnableAutoConfiguration

// @EnableAutoConfiguration imports AutoConfigurationImportSelector, which reads
//   META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
// from every jar on the classpath (it was spring.factories before Boot 2.7).</code></pre>
<pre><code>// A typical auto-configuration, and every conditional doing its job
@AutoConfiguration
@ConditionalOnClass(DataSource.class)               // is the driver present?
@ConditionalOnMissingBean(DataSource.class)         // did the USER define one?
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "spring.datasource", name = "url")
    public DataSource dataSource(DataSourceProperties props) { ... }
}</code></pre>
<table>
<tr><th>Condition</th><th>Applies when</th></tr>
<tr><td><code>@ConditionalOnClass</code> / <code>OnMissingClass</code></td><td>A class is (not) on the classpath</td></tr>
<tr><td><strong><code>@ConditionalOnMissingBean</code></strong></td><td>You have <em>not</em> defined one — this is what makes your bean win</td></tr>
<tr><td><code>@ConditionalOnProperty</code></td><td>A property has a given value</td></tr>
<tr><td><code>@ConditionalOnWebApplication</code></td><td>Servlet or reactive context</td></tr>
<tr><td><code>@ConditionalOnResource</code></td><td>A file exists on the classpath</td></tr>
<tr><td><code>@AutoConfigureAfter/Before</code></td><td>Ordering between auto-configurations</td></tr>
</table>
<p><strong>The key ordering rule:</strong> user configuration is processed <em>first</em>, auto-configuration last. That is why <code>@ConditionalOnMissingBean</code> works — by the time it is evaluated, your own <code>@Bean</code> is already registered, so Boot backs off. "Convention over configuration" is really "back off the moment the developer says otherwise".</p>
<pre><code># See exactly what was applied and why
java -jar app.jar --debug
# Positive matches:  DataSourceAutoConfiguration matched:
#   - @ConditionalOnClass found 'javax.sql.DataSource'
# Negative matches:  MongoAutoConfiguration:
#   - @ConditionalOnClass did not find 'com.mongodb.client.MongoClient'

# Or at runtime: GET /actuator/conditions

# Turn one off
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
spring.autoconfigure.exclude=org.springframework...DataSourceAutoConfiguration</code></pre>
<p><strong>Writing your own starter, briefly:</strong> an <code>@AutoConfiguration</code> class with the right conditions, a <code>@ConfigurationProperties</code> type for its settings, and an entry in <code>AutoConfiguration.imports</code>. The convention is two artefacts — <code>x-spring-boot-starter</code> (dependencies only) and <code>x-spring-boot-autoconfigure</code> (the code).</p>
<p><strong>The modern wrinkle:</strong> Boot 3's AOT processing evaluates these conditions at <em>build</em> time for native images, which is why a native binary starts in milliseconds — the whole condition-evaluation phase has already happened.</p>`
}
]);
