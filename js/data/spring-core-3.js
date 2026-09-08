appendTopic("spring-core", [
{
  q: "Why is constructor injection preferred over field injection? Give four concrete reasons",
  level: "beginner", hot: true, tags: ["di", "best-practice"],
  companies: ["TCS", "Infosys", "Accenture", "Cognizant", "Capgemini", "LTIMindtree"],
  a: `<pre><code>// ✘ Field injection
@Service
public class OrderService {
    @Autowired private OrderRepository repo;
    @Autowired private PaymentClient payment;
    @Autowired private NotificationService notifier;
    // ... and eight more, none of them visible from outside
}

// ✔ Constructor injection (@Autowired unnecessary since Spring 4.3)
@Service
public class OrderService {
    private final OrderRepository repo;
    private final PaymentClient payment;

    public OrderService(OrderRepository repo, PaymentClient payment) {
        this.repo = repo;
        this.payment = payment;
    }
}
// With Lombok: @RequiredArgsConstructor + final fields</code></pre>
<ol>
<li><strong>Immutability.</strong> Fields can be <code>final</code>, so a dependency cannot be swapped at runtime and the object is safely published across threads.</li>
<li><strong>Testable without Spring.</strong> <code>new OrderService(mockRepo, mockClient)</code> works in a plain unit test. Field injection requires reflection or a container, which is why those tests end up as slow <code>@SpringBootTest</code> runs.</li>
<li><strong>Mandatory dependencies are enforced by the compiler.</strong> You cannot construct a half-wired object. With field injection, a missing bean surfaces as a <code>NullPointerException</code> at first use.</li>
<li><strong>It exposes design smells.</strong> A constructor with twelve parameters is visibly wrong and prompts a refactor. Twelve <code>@Autowired</code> fields look tidy and hide the problem.</li>
</ol>
<p><strong>The fifth reason worth adding:</strong> circular dependencies fail <strong>fast at startup</strong> with constructor injection, whereas field injection lets Spring resolve the cycle by handing out a half-initialised bean — which works until it does not. Spring Boot 2.6+ rejects circular references by default precisely because of this.</p>
<p><strong>When setter injection is legitimate:</strong> a genuinely optional dependency with a sensible default. Even then, <code>Optional&lt;T&gt;</code> or <code>ObjectProvider&lt;T&gt;</code> in the constructor is usually clearer.</p>`
},
{
  q: "What are the different ways to define a bean in Spring?",
  level: "beginner", hot: true, tags: ["beans", "configuration"],
  companies: ["TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra", "IBM"],
  a: `<pre><code>// 1. Stereotype annotation + component scanning — for YOUR classes
@Service          // or @Component, @Repository, @Controller, @RestController
public class OrderService { }

// 2. @Bean method in a @Configuration class — for THIRD-PARTY classes
@Configuration
public class ClientConfig {
    @Bean
    public WebClient paymentClient(WebClient.Builder builder) {
        return builder.baseUrl("https://pay.acme.com").build();
    }
}

// 3. @Import — pull in configuration explicitly
@Import({SecurityConfig.class, KafkaConfig.class})

// 4. Auto-configuration — a starter registers beans conditionally
// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

// 5. Programmatic registration — for dynamic sets of beans
@Component
class TenantRegistrar implements BeanDefinitionRegistryPostProcessor {
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        for (String tenant : discoverTenants()) {
            registry.registerBeanDefinition("ds-" + tenant,
                BeanDefinitionBuilder.genericBeanDefinition(TenantDataSource.class)
                    .addConstructorArgValue(tenant).getBeanDefinition());
        }
    }
}

// 6. Functional registration — AOT-friendly, no reflection
new SpringApplicationBuilder(App.class)
    .initializers((GenericApplicationContext ctx) -&gt;
        ctx.registerBean(AuditService.class, () -&gt; new AuditService(ctx.getBean(Clock.class))))
    .run(args);

// 7. XML — legacy, still found in older enterprise codebases
// &lt;bean id="orderService" class="com.acme.OrderService"/&gt;</code></pre>
<p><strong>The rule of thumb:</strong> stereotypes for classes you own, <code>@Bean</code> for classes you do not (or that need construction logic), and programmatic registration only when the <em>set</em> of beans is genuinely dynamic — multi-tenant datasources, plugins.</p>
<p><strong>The follow-up to expect:</strong> "what is the difference between <code>@Component</code> and <code>@Bean</code>?" — <code>@Component</code> is on the class and found by scanning, so you cannot use it for a third-party type you cannot annotate. <code>@Bean</code> is a factory method you control, which also lets you register several beans of the same type with different configuration.</p>`
},
{
  q: "How does Spring resolve a bean when there are multiple implementations of an interface?",
  level: "beginner", hot: true, tags: ["di", "beans"],
  companies: ["Infosys", "TCS", "Accenture", "Cognizant", "Mindtree", "Zoho"],
  a: `<pre><code>public interface PaymentGateway { }

@Component                 class StripeGateway   implements PaymentGateway { }
@Component @Primary        class RazorpayGateway implements PaymentGateway { }
@Component("payuGateway")  class PayuGateway     implements PaymentGateway { }</code></pre>
<p><strong>Resolution order, highest priority first:</strong></p>
<ol>
<li><strong><code>@Qualifier</code> at the injection point</strong> — explicit, beats everything.</li>
<li><strong><code>@Primary</code> on a bean</strong> — the default winner when nothing else specifies.</li>
<li><strong>Parameter name matching</strong> — a parameter named <code>payuGateway</code> matches the bean of that name.</li>
<li>Otherwise → <code>NoUniqueBeanDefinitionException</code> at startup.</li>
</ol>
<pre><code>// Explicit selection
public OrderService(@Qualifier("payuGateway") PaymentGateway gateway) { }

// Custom qualifier — type-safe, survives refactoring, unlike a string
@Qualifier @Retention(RUNTIME) public @interface Razorpay { }
@Component @Razorpay class RazorpayGateway implements PaymentGateway { }
public OrderService(@Razorpay PaymentGateway gateway) { }

// Inject them ALL — the strategy-registry pattern
@Service
public class PaymentRouter {
    private final Map&lt;String, PaymentGateway&gt; byName;   // bean name -> bean
    private final List&lt;PaymentGateway&gt; all;             // in @Order sequence

    public PaymentRouter(Map&lt;String, PaymentGateway&gt; byName, List&lt;PaymentGateway&gt; all) { }
}</code></pre>
<p><strong>The pattern worth showing off:</strong> injecting <code>List&lt;T&gt;</code> or <code>Map&lt;String,T&gt;</code> of every implementation is how you build an extensible strategy registry — adding a gateway means adding a class, with no existing file edited. That is the Open/Closed Principle expressed through the container.</p>
<p><strong>Why prefer a custom qualifier annotation to <code>@Qualifier("string")</code>:</strong> a typo in a string is a runtime startup failure, and renaming the bean silently breaks the injection point. A custom annotation is checked by the compiler and follows a rename.</p>`
},
{
  q: "What is the Spring IoC container's role and how does it differ from a factory?",
  level: "beginner", tags: ["ioc", "container"],
  companies: ["TCS", "Infosys", "Capgemini", "Wipro", "Deloitte"],
  a: `<p>A factory <em>creates</em> objects on demand. An IoC container additionally <strong>owns their entire lifecycle and wiring</strong>.</p>
<table>
<tr><th></th><th>Factory</th><th>IoC container</th></tr>
<tr><td>Creation</td><td>You call it</td><td>It calls you — dependencies are pushed in</td></tr>
<tr><td>Wiring</td><td>You pass collaborators</td><td>Resolved automatically from the graph</td></tr>
<tr><td>Lifecycle</td><td>None</td><td><code>@PostConstruct</code>, <code>@PreDestroy</code>, scopes</td></tr>
<tr><td>Cross-cutting concerns</td><td>None</td><td>AOP proxies for transactions, security, caching</td></tr>
<tr><td>Configuration</td><td>Hard-coded</td><td>Externalised, profile-aware, conditional</td></tr>
</table>
<pre><code>// What the container actually does for one bean
1. Read the bean DEFINITION (from scanning, @Bean, or XML)
2. Resolve constructor arguments from the dependency graph
3. Instantiate
4. Inject fields and setters
5. Call *Aware callbacks
6. BeanPostProcessor.postProcessBeforeInitialization  -&gt; @PostConstruct runs here
7. Initialise (afterPropertiesSet, initMethod)
8. BeanPostProcessor.postProcessAfterInitialization   -&gt; AOP PROXY created here
9. Bean is ready and cached in the singleton registry
10. On shutdown: @PreDestroy, destroy(), destroyMethod</code></pre>
<p><strong>The key insight to state:</strong> step 8 is why Spring is more than a factory. The object your code receives is often <em>not</em> the object the constructor produced — it is a proxy wrapping it, which is how <code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code> and <code>@PreAuthorize</code> work without any of that logic appearing in your class.</p>
<p><strong>The practical consequence</strong> that follows directly: because the behaviour lives in the proxy, calling an annotated method from <em>within the same class</em> (<code>this.method()</code>) bypasses it entirely — the single most common Spring gotcha, and it falls straight out of understanding the container.</p>
<p><strong>Interviewers also ask "BeanFactory vs ApplicationContext":</strong> <code>BeanFactory</code> is the bare DI container with lazy instantiation; <code>ApplicationContext</code> adds eager singleton creation (so misconfiguration fails at startup, not at 2am), events, i18n, resource loading and automatic post-processor registration.</p>`
},
{
  q: "Explain @Transactional propagation with a real nested-service example",
  level: "advanced", hot: true, tags: ["transactions", "scenario"],
  companies: ["Amazon", "Oracle", "JPMorgan", "Barclays", "Optum", "Societe Generale"],
  a: `<pre><code>@Service
public class OrderService {

    @Transactional                                   // REQUIRED (default)
    public void placeOrder(Order order) {
        orderRepo.save(order);                       // transaction T1
        auditService.record("ORDER_PLACED", order);  // joins T1 or starts T2?
        paymentService.charge(order);                // if this throws, what rolls back?
    }
}

@Service
public class AuditService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String event, Order order) {
        auditRepo.save(new AuditEntry(event, order.id()));
        // Runs in its OWN transaction T2. T1 is SUSPENDED.
        // T2 commits independently -> the audit survives even if the order rolls back.
    }
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="REQUIRED versus REQUIRES_NEW transaction propagation">
  <text class="dg-t" x="150" y="18" text-anchor="middle">REQUIRED — one transaction</text>
  <rect class="dg-fill" x="20" y="30" width="260" height="34" rx="7"/><text class="dg-s" x="150" y="52" text-anchor="middle">T1: order + audit + payment</text>
  <text class="dg-s" x="150" y="82" text-anchor="middle">payment fails → EVERYTHING rolls back</text>
  <text class="dg-s" x="150" y="100" text-anchor="middle">including the audit record</text>
  <text class="dg-t" x="460" y="18" text-anchor="middle">REQUIRES_NEW — independent</text>
  <rect class="dg-fill" x="330" y="30" width="90" height="34" rx="7"/><text class="dg-s" x="375" y="52" text-anchor="middle">T1 order</text>
  <rect class="dg-fill2" x="426" y="30" width="86" height="34" rx="7"/><text class="dg-s" x="469" y="52" text-anchor="middle">T2 audit</text>
  <rect class="dg-fill" x="518" y="30" width="86" height="34" rx="7"/><text class="dg-s" x="561" y="52" text-anchor="middle">T1 payment</text>
  <text class="dg-s" x="460" y="82" text-anchor="middle">payment fails → T1 rolls back</text>
  <text class="dg-s" x="460" y="100" text-anchor="middle">T2 audit SURVIVES (already committed)</text>
</svg>
</figure>
<table>
<tr><th>Propagation</th><th>Existing transaction</th><th>No transaction</th></tr>
<tr><td><code>REQUIRED</code> (default)</td><td>Join it</td><td>Start one</td></tr>
<tr><td><code>REQUIRES_NEW</code></td><td>Suspend it, start a new one</td><td>Start one</td></tr>
<tr><td><code>SUPPORTS</code></td><td>Join it</td><td>Run without one</td></tr>
<tr><td><code>NOT_SUPPORTED</code></td><td>Suspend it</td><td>Run without one</td></tr>
<tr><td><code>MANDATORY</code></td><td>Join it</td><td><strong>Throw</strong></td></tr>
<tr><td><code>NEVER</code></td><td><strong>Throw</strong></td><td>Run without one</td></tr>
<tr><td><code>NESTED</code></td><td>Savepoint — partial rollback</td><td>Start one</td></tr>
</table>
<p><strong>The trap to raise unprompted:</strong> <code>REQUIRES_NEW</code> uses a <em>second database connection</em> while the first is suspended. With a pool of 10 and 10 concurrent outer transactions each calling a <code>REQUIRES_NEW</code> method, all 10 connections are held by outer transactions and all 10 inner ones wait for a connection that will never be released — a self-inflicted deadlock. Size the pool with this in mind, or avoid nesting.</p>
<p><strong>And the classic:</strong> because this is proxy-based, calling <code>this.record(...)</code> from within <code>OrderService</code> would bypass the proxy entirely and run in T1 regardless of the annotation.</p>`
},
{
  q: "What is the difference between @Component and @Configuration, and what is proxyBeanMethods?",
  level: "advanced", hot: true, tags: ["configuration", "internals"],
  companies: ["Amazon", "Oracle", "SAP", "EPAM", "Publicis Sapient"],
  a: `<pre><code>@Configuration                       // "FULL" mode — CGLIB-proxied
public class AppConfig {
    @Bean DataSource dataSource() { return new HikariDataSource(); }

    @Bean OrderRepository orderRepo() {
        return new JdbcOrderRepository(dataSource());   // returns THE singleton
    }
    @Bean AuditRepository auditRepo() {
        return new JdbcAuditRepository(dataSource());   // the SAME singleton
    }
}

@Component                           // "LITE" mode — NOT proxied
public class BadConfig {
    @Bean DataSource dataSource() { return new HikariDataSource(); }
    @Bean OrderRepository orderRepo() {
        return new JdbcOrderRepository(dataSource());   // ✘ a PLAIN Java call
    }                                                    //   -> a SECOND HikariDataSource
}                                                        //   -> two connection pools</code></pre>
<p><strong>How the proxy works:</strong> Spring subclasses a <code>@Configuration</code> class with CGLIB and intercepts every <code>@Bean</code> method. On an inter-bean call it checks the singleton registry first and returns the existing instance instead of executing the method again. In lite mode there is no proxy, so <code>dataSource()</code> is an ordinary method call that constructs a new object every time.</p>
<pre><code>@Configuration(proxyBeanMethods = false)     // opt out of the proxy deliberately
public class FastConfig {
    @Bean DataSource dataSource() { return new HikariDataSource(); }

    @Bean OrderRepository orderRepo(DataSource ds) {    // ✔ take it as a PARAMETER
        return new JdbcOrderRepository(ds);              //   works in BOTH modes
    }
}</code></pre>
<p><strong>Why <code>proxyBeanMethods = false</code> matters:</strong> it skips CGLIB subclass generation at startup, which measurably reduces boot time and is friendlier to GraalVM native image. Every Spring Boot auto-configuration class uses it. It is safe whenever your <code>@Bean</code> methods never call each other.</p>
<p><strong>The rule to state:</strong> pass dependencies as <strong>method parameters</strong> rather than calling sibling <code>@Bean</code> methods. That works identically in full and lite mode, makes the dependency explicit, and removes any reliance on proxying — so the configuration is correct regardless of the mode.</p>`
},
{
  q: "How would you implement a custom BeanPostProcessor and what would you use it for?",
  level: "advanced", tags: ["extension", "aop"],
  companies: ["Oracle", "SAP", "Amazon", "ThoughtWorks", "Nagarro"],
  a: `<pre><code>@Component
public class TimingBeanPostProcessor implements BeanPostProcessor, Ordered {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        Class&lt;?&gt; type = bean.getClass();
        if (!type.isAnnotationPresent(Timed.class)) return bean;

        // Wrap the bean in a proxy that times every method call
        return Proxy.newProxyInstance(
                type.getClassLoader(),
                type.getInterfaces(),
                (proxy, method, args) -&gt; {
                    long start = System.nanoTime();
                    try {
                        return method.invoke(bean, args);
                    } finally {
                        registry.timer("bean.method",
                                "class", type.getSimpleName(),
                                "method", method.getName())
                                .record(System.nanoTime() - start, NANOSECONDS);
                    }
                });
    }

    @Override public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }
}</code></pre>
<p><strong>What Spring itself uses this mechanism for</strong> — which is the real answer to "what would you use it for":</p>
<ul>
<li><code>AutowiredAnnotationBeanPostProcessor</code> — processes <code>@Autowired</code> and <code>@Value</code>.</li>
<li><code>CommonAnnotationBeanPostProcessor</code> — <code>@PostConstruct</code>, <code>@PreDestroy</code>, <code>@Resource</code>.</li>
<li><code>AnnotationAwareAspectJAutoProxyCreator</code> — creates every AOP proxy, so <code>@Transactional</code>, <code>@Cacheable</code> and <code>@Async</code> all flow through here.</li>
<li><code>ConfigurationPropertiesBindingPostProcessor</code> — binds <code>@ConfigurationProperties</code>.</li>
</ul>
<p><strong>The gotcha you must mention:</strong> a <code>BeanPostProcessor</code> is itself a bean, and it must exist <em>before</em> the beans it processes. So anything it depends on is instantiated very early — before other post-processors are registered — and therefore does <strong>not</strong> get post-processed itself. Spring logs a warning: <em>"is not eligible for getting processed by all BeanPostProcessors"</em>. In practice that means such a bean will not be proxied, so <code>@Transactional</code> on it silently does nothing.</p>
<p><strong>The rule:</strong> keep <code>BeanPostProcessor</code>s dependency-free, or inject lazily via <code>ObjectProvider</code>. And prefer plain AOP (<code>@Aspect</code>) when it can express what you need — a post-processor is a much lower-level tool.</p>`
},
{
  q: "How do Spring profiles work with configuration properties in a multi-environment setup?",
  level: "beginner", hot: true, tags: ["configuration", "production"],
  companies: ["TCS", "Infosys", "Capgemini", "Accenture", "Deloitte", "Cognizant"],
  a: `<pre><code># application.yml — shared defaults, always loaded
spring:
  application.name: order-service
  jpa.open-in-view: false
app:
  retry.max: 3

---
spring:
  config.activate.on-profile: dev
  datasource.url: jdbc:h2:mem:orders
logging.level.com.acme: DEBUG

---
spring:
  config.activate.on-profile: prod
  datasource:
    url: \${DB_URL}
    password: \${DB_PASSWORD}          # from a secret manager, never committed
  jpa.hibernate.ddl-auto: validate
logging.level.root: WARN</code></pre>
<pre><code>// Profile-scoped beans
@Configuration @Profile("prod")
class ProdConfig { @Bean MeterRegistry registry() { return prometheusRegistry(); } }

@Configuration @Profile("!prod")     // everything EXCEPT prod
class DevSeedData { }

@Configuration @Profile({"dev", "test"})
class MockPaymentGateway implements PaymentGateway { }</code></pre>
<pre><code># Activation, in increasing precedence
spring.profiles.active: dev           # in application.yml
SPRING_PROFILES_ACTIVE=prod           # environment variable  (what containers use)
java -Dspring.profiles.active=prod -jar app.jar
java -jar app.jar --spring.profiles.active=prod   # command line wins</code></pre>
<p><strong>Property precedence (highest first)</strong> — this is the part interviewers probe: command-line args → <code>SPRING_APPLICATION_JSON</code> → OS environment variables → profile-specific YAML → <code>application.yml</code> → defaults. Environment variables beating files is exactly what makes twelve-factor container configuration work.</p>
<p><strong>Relaxed binding</strong> means <code>app.retry-max</code>, <code>app.retryMax</code> and <code>APP_RETRYMAX</code> all bind to the same property — which is why a Kubernetes env var can override a YAML key without any translation.</p>
<p><strong>Advice worth giving:</strong> keep profiles few and environment-shaped (<code>dev</code>, <code>test</code>, <code>prod</code>). Using them as feature toggles produces combinatorial configurations nobody can reason about — use real feature flags for that. And never put secrets in any profile file; inject them from the environment.</p>`
}
]);
