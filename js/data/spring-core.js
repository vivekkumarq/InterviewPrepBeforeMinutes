registerTopic("spring-core", [
{
  q: "What is Inversion of Control and Dependency Injection?",
  level: "beginner", hot: true, tags: ["ioc", "di"],
  a: `<p><strong>IoC</strong> is the principle: instead of your code creating and wiring its own collaborators, a container does it and hands them to you. Control of object creation is <em>inverted</em> from your class to the framework.</p>
<p><strong>DI</strong> is the concrete technique that implements IoC — dependencies are supplied from outside.</p>
<pre><code>// Without DI — tightly coupled, untestable, impossible to swap
class OrderService {
    private final OrderRepository repo = new JdbcOrderRepository();  // hard-wired
}

// With DI — depends on an abstraction, injected by Spring
@Service
class OrderService {
    private final OrderRepository repo;
    OrderService(OrderRepository repo) { this.repo = repo; }   // constructor injection
}</code></pre>
<p><strong>What you gain:</strong> loose coupling, trivial unit testing (pass a mock), swappable implementations by configuration, and centralised lifecycle management. It is the Dependency Inversion Principle made into infrastructure.</p>`
},
{
  q: "Constructor vs setter vs field injection — which and why?",
  level: "beginner", hot: true, tags: ["di"],
  a: `<table>
<tr><th></th><th>Constructor</th><th>Setter</th><th>Field (<code>@Autowired</code> on a field)</th></tr>
<tr><td>Immutability</td><td><code>final</code> fields ✔</td><td>No</td><td>No</td></tr>
<tr><td>Mandatory dependency</td><td>Enforced by the compiler</td><td>Optional</td><td>Hidden</td></tr>
<tr><td>Testable without Spring</td><td>Yes — just call <code>new</code></td><td>Yes</td><td><strong>No</strong> — needs reflection</td></tr>
<tr><td>Circular dependency</td><td>Fails fast at startup</td><td>Silently allowed</td><td>Silently allowed</td></tr>
<tr><td>Too many dependencies</td><td>Visibly ugly — a useful smell</td><td>Hidden</td><td>Hidden</td></tr>
</table>
<pre><code>// Recommended — and since Spring 4.3 @Autowired is not even needed
// on a single constructor
@Service
public class OrderService {
    private final OrderRepository repo;
    private final PaymentClient payment;

    public OrderService(OrderRepository repo, PaymentClient payment) {
        this.repo = repo;
        this.payment = payment;
    }
}
// With Lombok: @RequiredArgsConstructor on the class + final fields</code></pre>
<p><strong>Use constructor injection.</strong> The Spring team's own documentation recommends it. Use setter injection only for genuinely optional dependencies with a sensible default. Field injection is discouraged — it hides dependencies, makes the class untestable without a container, and lets a class accumulate fifteen dependencies unnoticed.</p>`
},
{
  q: "What are the Spring bean scopes?",
  level: "beginner", hot: true, tags: ["beans", "scope"],
  a: `<table>
<tr><th>Scope</th><th>One instance per</th><th>Notes</th></tr>
<tr><td><code>singleton</code> (default)</td><td>Spring container</td><td>Created eagerly at startup; must be stateless</td></tr>
<tr><td><code>prototype</code></td><td>Each injection/lookup</td><td>Spring does <strong>not</strong> manage its destruction — no <code>@PreDestroy</code></td></tr>
<tr><td><code>request</code></td><td>HTTP request</td><td>Web only</td></tr>
<tr><td><code>session</code></td><td>HTTP session</td><td>Web only</td></tr>
<tr><td><code>application</code></td><td>ServletContext</td><td>Web only</td></tr>
<tr><td><code>websocket</code></td><td>WebSocket session</td><td>Web only</td></tr>
</table>
<p><strong>The classic trap:</strong> injecting a prototype bean into a singleton gives you <em>one</em> instance, created once — the singleton is only wired at creation time. Fixes:</p>
<pre><code>// 1. Method injection via a provider (cleanest)
@Service
class ReportService {
    private final ObjectProvider&lt;ReportContext&gt; contexts;
    void run() { ReportContext ctx = contexts.getObject(); }   // new one each call
}

// 2. Scoped proxy
@Bean @Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)
ReportContext reportContext() { return new ReportContext(); }</code></pre>
<p><strong>Critical rule:</strong> singleton beans are shared by all threads, so instance fields holding request state are a data race. Keep them stateless.</p>`
},
{
  q: "Explain the Spring bean lifecycle",
  level: "advanced", hot: true, tags: ["beans", "lifecycle"],
  a: `<ol>
<li><strong>Instantiate</strong> — constructor called (constructor injection happens here).</li>
<li><strong>Populate properties</strong> — setter/field injection.</li>
<li><strong>Aware callbacks</strong> — <code>BeanNameAware</code>, <code>BeanFactoryAware</code>, <code>ApplicationContextAware</code>.</li>
<li><strong><code>BeanPostProcessor.postProcessBeforeInitialization</code></strong> — this is where <code>@Autowired</code>, <code>@Value</code> and <code>@PostConstruct</code> are actually processed.</li>
<li><strong>Initialisation</strong> — <code>@PostConstruct</code> → <code>InitializingBean.afterPropertiesSet()</code> → custom <code>initMethod</code>.</li>
<li><strong><code>BeanPostProcessor.postProcessAfterInitialization</code></strong> — <strong>where AOP proxies are created</strong> and swapped in for the raw bean.</li>
<li><strong>Bean is ready</strong> and in the container.</li>
<li><strong>Destruction</strong> (singletons only, on context close) — <code>@PreDestroy</code> → <code>DisposableBean.destroy()</code> → custom <code>destroyMethod</code>.</li>
</ol>
<pre><code>@Component
public class CacheWarmer {
    @PostConstruct void warm()  { log.info("preloading cache"); }
    @PreDestroy   void flush()  { log.info("flushing to disk"); }
}</code></pre>
<p><strong>Why step 6 matters:</strong> because the proxy is created <em>after</em> initialisation, a <code>@Transactional</code> or <code>@Cacheable</code> annotation has no effect inside <code>@PostConstruct</code> — the proxy does not exist yet. That is a genuine production bug and a favourite advanced question.</p>`
},
{
  q: "What is a circular dependency and how do you fix it?",
  level: "advanced", hot: true, tags: ["di", "beans"],
  a: `<p>Bean A needs B in its constructor, and B needs A. Spring cannot construct either first, so startup fails with <code>BeanCurrentlyInCreationException</code>. Since Spring Boot 2.6 this fails by default even for field injection.</p>
<p><strong>Why field/setter injection "worked" before:</strong> Spring uses a three-level cache (singletonObjects, earlySingletonObjects, singletonFactories) and can expose a half-built A to B. That only works when the injection point is not the constructor — and it silently produces objects wired to incomplete instances.</p>
<p><strong>The fixes, best first:</strong></p>
<ol>
<li><strong>Redesign.</strong> A cycle is a design smell — the two classes usually share a responsibility that belongs in a third class. Extract it.</li>
<li><strong>Use events</strong> — <code>ApplicationEventPublisher</code> decouples the direction entirely.</li>
<li><strong>Inject <code>ObjectProvider&lt;B&gt;</code></strong> and resolve lazily at call time.</li>
<li><strong><code>@Lazy</code></strong> on one injection point — Spring injects a proxy and resolves the real bean on first use. A workaround, not a fix.</li>
<li><code>spring.main.allow-circular-references=true</code> — the escape hatch for legacy code. Mention it, then say you would not ship it.</li>
</ol>`
},
{
  q: "What is @Component vs @Service vs @Repository vs @Controller?",
  level: "beginner", hot: true, tags: ["annotations"],
  a: `<p>All four are stereotype annotations picked up by component scanning; <code>@Service</code>, <code>@Repository</code> and <code>@Controller</code> are meta-annotated with <code>@Component</code>. Technically they are almost interchangeable — but two carry real extra behaviour:</p>
<ul>
<li><code>@Component</code> — the generic stereotype.</li>
<li><code>@Service</code> — business logic. Purely semantic; no added behaviour.</li>
<li><code>@Repository</code> — <strong>adds behaviour:</strong> enables <code>PersistenceExceptionTranslationPostProcessor</code>, which converts vendor-specific <code>SQLException</code>s and Hibernate exceptions into Spring's unchecked <code>DataAccessException</code> hierarchy.</li>
<li><code>@Controller</code> — <strong>adds behaviour:</strong> the bean is scanned by Spring MVC for <code>@RequestMapping</code> handler methods. <code>@RestController</code> = <code>@Controller</code> + <code>@ResponseBody</code>.</li>
</ul>
<p>Using the right one documents the architectural layer, which is the real value — and tools like ArchUnit can then enforce that controllers never call repositories directly.</p>`
},
{
  q: "What is @Configuration and how does it differ from @Component for @Bean methods?",
  level: "advanced", hot: true, tags: ["configuration"],
  a: `<p>Both can host <code>@Bean</code> methods, but <code>@Configuration</code> classes are CGLIB-proxied ("full" mode) so that inter-bean method calls are intercepted and return the <strong>singleton</strong>. In a <code>@Component</code> ("lite" mode) the call is a plain Java method call, creating a new object each time.</p>
<pre><code>@Configuration
public class AppConfig {
    @Bean DataSource dataSource() { return new HikariDataSource(...); }

    @Bean OrderRepository repo() {
        return new JdbcOrderRepository(dataSource());   // returns THE singleton
    }
    @Bean AuditRepository audit() {
        return new JdbcAuditRepository(dataSource());   // same singleton instance
    }
}
// If AppConfig were @Component, you would get TWO DataSources — two connection pools.</code></pre>
<p><code>@Configuration(proxyBeanMethods = false)</code> disables the proxying for a startup-time saving; it is safe when your <code>@Bean</code> methods never call each other, and Spring Boot's own auto-configurations use it. Prefer passing the dependency as a method parameter instead — it works in both modes:</p>
<pre><code>@Bean OrderRepository repo(DataSource ds) { return new JdbcOrderRepository(ds); }</code></pre>`
},
{
  q: "How does Spring resolve multiple candidate beans of the same type?",
  level: "beginner", hot: true, tags: ["di", "beans"],
  a: `<p>Injection is <em>by type</em> first. Two beans of the same type give <code>NoUniqueBeanDefinitionException</code>. Resolution order:</p>
<ol>
<li><strong><code>@Primary</code></strong> on one bean — the default winner.</li>
<li><strong><code>@Qualifier("name")</code></strong> at the injection point — explicit selection, beats <code>@Primary</code>.</li>
<li><strong>Parameter name matching</strong> — if the parameter is named <code>emailNotifier</code> and a bean has that name, it matches.</li>
<li><strong>Custom qualifier annotations</strong> — type-safe and refactor-friendly.</li>
</ol>
<pre><code>@Bean @Primary  Notifier email() { ... }
@Bean("smsNotifier") Notifier sms() { ... }

@Service
class AlertService {
    AlertService(@Qualifier("smsNotifier") Notifier notifier) { ... }
}

// Custom qualifier — better than string names
@Qualifier @Retention(RUNTIME) public @interface Sms { }

// Or inject them all and pick at runtime
@Service
class Router {
    private final Map&lt;String, Notifier&gt; byName;    // Spring fills bean name -> bean
    Router(List&lt;Notifier&gt; all, Map&lt;String, Notifier&gt; byName) { ... }
}</code></pre>
<p>Injecting a <code>List&lt;T&gt;</code> or <code>Map&lt;String,T&gt;</code> of every implementation is the idiomatic way to build a strategy registry — and <code>@Order</code> or <code>Ordered</code> controls the list sequence.</p>`
},
{
  q: "What is AOP? Explain aspect, join point, pointcut and advice.",
  level: "advanced", hot: true, tags: ["aop"],
  a: `<p>AOP modularises <strong>cross-cutting concerns</strong> — logging, transactions, security, caching, metrics — that would otherwise be duplicated in every method.</p>
<ul>
<li><strong>Aspect</strong> — the module holding the cross-cutting code (<code>@Aspect</code> class).</li>
<li><strong>Join point</strong> — a point where advice can apply. In Spring AOP this is always a <em>method execution</em>.</li>
<li><strong>Pointcut</strong> — an expression selecting join points.</li>
<li><strong>Advice</strong> — the action: <code>@Before</code>, <code>@After</code>, <code>@AfterReturning</code>, <code>@AfterThrowing</code>, <code>@Around</code>.</li>
<li><strong>Weaving</strong> — linking aspects to targets. Spring does it at <em>runtime</em> with proxies; AspectJ can do it at compile or load time.</li>
</ul>
<pre><code>@Aspect @Component
public class TimingAspect {

    @Around("@annotation(com.acme.Timed)")           // pointcut
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();                    // invoke the real method
        } finally {
            metrics.record(pjp.getSignature().toShortString(), System.nanoTime() - start);
        }
    }

    @Pointcut("execution(* com.acme.service..*(..))")
    void serviceLayer() {}

    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    void onError(JoinPoint jp, Exception ex) { log.error("{} failed", jp.getSignature(), ex); }
}</code></pre>`
},
{
  q: "How does Spring AOP work internally? JDK dynamic proxy vs CGLIB",
  level: "advanced", hot: true, tags: ["aop", "proxy"],
  a: `<p>Spring AOP is <strong>proxy-based</strong>. During <code>postProcessAfterInitialization</code>, if a bean matches any pointcut, Spring replaces it in the container with a proxy that wraps the original.</p>
<table>
<tr><th></th><th>JDK dynamic proxy</th><th>CGLIB</th></tr>
<tr><td>Requires</td><td>The target implements an interface</td><td>Nothing — subclasses the class</td></tr>
<tr><td>Mechanism</td><td><code>java.lang.reflect.Proxy</code></td><td>Runtime bytecode subclass</td></tr>
<tr><td>Cannot proxy</td><td>Non-interface methods</td><td><code>final</code> classes or <code>final</code>/<code>private</code> methods</td></tr>
<tr><td>Default in Boot</td><td>—</td><td><strong>Yes</strong> (<code>proxyTargetClass=true</code> since 2.0)</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Spring AOP proxy call flow">
  <rect class="dg-box" x="10" y="42" width="106" height="42" rx="8"/><text class="dg-t" x="63" y="68" text-anchor="middle">Caller</text>
  <path class="dg-line" d="M120 63 H176" marker-end="url(#p1)"/>
  <rect class="dg-fill" x="180" y="30" width="150" height="66" rx="8"/>
  <text class="dg-t" x="255" y="54" text-anchor="middle">Proxy</text>
  <text class="dg-s" x="255" y="72" text-anchor="middle">advice chain</text>
  <text class="dg-s" x="255" y="88" text-anchor="middle">tx / security / cache</text>
  <path class="dg-line" d="M334 63 H392" marker-end="url(#p1)"/>
  <rect class="dg-fill2" x="396" y="42" width="150" height="42" rx="8"/>
  <text class="dg-t" x="471" y="68" text-anchor="middle">Target bean</text>
  <path class="dg-line" d="M471 84 V112 H255 V96" stroke-dasharray="4 3"/>
  <text class="dg-s" x="360" y="126" text-anchor="middle">internal this.method() call — BYPASSES the proxy</text>
  <defs><marker id="p1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Advice only runs on calls that go through the proxy.</figcaption>
</figure>
<p><strong>The self-invocation problem — the single most-asked Spring gotcha:</strong></p>
<pre><code>@Service
public class OrderService {
    public void placeOrder(Order o) {
        this.saveAudit(o);        // 'this' is the RAW object — @Transactional IGNORED
    }
    @Transactional
    public void saveAudit(Order o) { ... }
}</code></pre>
<p><strong>Fixes:</strong> move the annotated method to another bean (best); inject a self-reference; use <code>AopContext.currentProxy()</code>; or switch to AspectJ load-time weaving, which does not use proxies at all. Related limitations: <code>private</code>, <code>final</code> and <code>static</code> methods can never be advised.</p>`
},
{
  q: "Explain @Transactional — propagation, isolation and rollback rules",
  level: "advanced", hot: true, tags: ["transactions"],
  a: `<p>Spring's declarative transaction management wraps the method in a proxy that begins a transaction, then commits or rolls back.</p>
<p><strong>Propagation — what happens if a transaction already exists:</strong></p>
<table>
<tr><th>Value</th><th>Behaviour</th></tr>
<tr><td><code>REQUIRED</code> (default)</td><td>Join the existing one, or start a new one</td></tr>
<tr><td><code>REQUIRES_NEW</code></td><td>Always start a new one; suspend the outer. Use for audit logs that must survive the caller's rollback</td></tr>
<tr><td><code>SUPPORTS</code></td><td>Join if present, otherwise run non-transactionally</td></tr>
<tr><td><code>NOT_SUPPORTED</code></td><td>Suspend any transaction and run without one</td></tr>
<tr><td><code>MANDATORY</code></td><td>Must already be in one, else exception</td></tr>
<tr><td><code>NEVER</code></td><td>Must not be in one</td></tr>
<tr><td><code>NESTED</code></td><td>Savepoint within the current transaction — partial rollback</td></tr>
</table>
<p><strong>Rollback rules — the classic trap:</strong> by default Spring rolls back only on <strong>unchecked</strong> exceptions (<code>RuntimeException</code>, <code>Error</code>). A checked exception commits the transaction.</p>
<pre><code>@Transactional(rollbackFor = Exception.class,     // roll back on checked too
               propagation = Propagation.REQUIRED,
               isolation   = Isolation.READ_COMMITTED,
               timeout     = 10,
               readOnly    = false)
public void transfer(Long from, Long to, BigDecimal amt) throws BankException { ... }</code></pre>
<p><strong>Other real-world points:</strong> <code>readOnly = true</code> lets Hibernate skip dirty checking and hints the DB — meaningful for reporting queries. And once a transaction is marked rollback-only, catching the exception does not save it; you get <code>UnexpectedRollbackException</code> at commit.</p>`
},
{
  q: "Why does @Transactional not work sometimes?",
  level: "advanced", hot: true, tags: ["transactions", "gotcha"],
  a: `<p>Six causes, in the order I would check them:</p>
<ol>
<li><strong>Self-invocation</strong> — calling the annotated method from another method of the same class bypasses the proxy entirely.</li>
<li><strong>Non-public method</strong> — Spring's proxy-based transactions only apply to <code>public</code> methods; <code>private</code>/<code>protected</code>/package-private are silently ignored.</li>
<li><strong>Checked exception thrown</strong> — commits by default; needs <code>rollbackFor</code>.</li>
<li><strong>Exception caught inside the method</strong> — no exception propagates, so Spring sees success and commits.</li>
<li><strong>The class is not a Spring bean</strong> — created with <code>new</code>, so there is no proxy at all.</li>
<li><strong>Wrong transaction manager or a non-transactional engine</strong> — multiple datasources without qualifying the manager, or MyISAM tables in MySQL.</li>
</ol>
<pre><code>// Silently broken: exception swallowed, transaction commits
@Transactional
public void process(Order o) {
    try { repo.save(o); riskyCall(); }
    catch (Exception e) { log.error("failed", e); }    // &lt;-- commits anyway
}

// If you must catch, mark it explicitly
TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();</code></pre>
<p>A useful debugging tip to mention: set <code>logging.level.org.springframework.transaction.interceptor=TRACE</code> and Spring logs every transaction it creates, joins or rolls back.</p>`
},
{
  q: "What is ApplicationContext vs BeanFactory?",
  level: "beginner", tags: ["container"],
  a: `<table>
<tr><th></th><th>BeanFactory</th><th>ApplicationContext</th></tr>
<tr><td>Role</td><td>Basic DI container</td><td>Superset — the one you actually use</td></tr>
<tr><td>Bean creation</td><td>Lazy</td><td>Eager for singletons (fails fast at startup)</td></tr>
<tr><td>Extras</td><td>None</td><td>i18n messages, event publishing, resource loading, <code>BeanPostProcessor</code>/<code>BeanFactoryPostProcessor</code> auto-registration, AOP integration, environment/profiles</td></tr>
</table>
<p>Common implementations: <code>AnnotationConfigApplicationContext</code>, <code>ClassPathXmlApplicationContext</code>, <code>AnnotationConfigServletWebServerApplicationContext</code> (what Spring Boot web apps use).</p>
<p><strong>Why eager singleton creation matters:</strong> a missing bean or bad configuration blows up at application start rather than at 2 a.m. on the first request that touches it. That fail-fast property is a genuine production benefit.</p>`
},
{
  q: "What are BeanPostProcessor and BeanFactoryPostProcessor?",
  level: "advanced", tags: ["extension"],
  a: `<ul>
<li><strong><code>BeanFactoryPostProcessor</code></strong> — runs <em>before</em> any bean is instantiated and can modify <strong>bean definitions</strong> (metadata). The canonical example is <code>PropertySourcesPlaceholderConfigurer</code>, which resolves <code>\${...}</code> placeholders.</li>
<li><strong><code>BeanPostProcessor</code></strong> — runs around the initialisation of <em>every bean instance</em>, and can wrap or replace it. This is how <code>@Autowired</code>, <code>@Value</code>, <code>@PostConstruct</code> and all AOP proxying are implemented.</li>
</ul>
<pre><code>@Component
public class AuditingBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String name) {
        if (bean.getClass().isAnnotationPresent(Audited.class)) {
            return Proxy.newProxyInstance(...);   // wrap it
        }
        return bean;
    }
}</code></pre>
<p><strong>Caution worth mentioning:</strong> a <code>BeanPostProcessor</code> is itself a bean, and it must be created before the beans it processes — so any bean it depends on is instantiated very early and will <em>not</em> get post-processed itself (Spring logs a warning about this). Keep them dependency-free.</p>`
},
{
  q: "How do Spring profiles work?",
  level: "beginner", tags: ["configuration"],
  a: `<p>Profiles conditionally register beans and property sources per environment.</p>
<pre><code>@Configuration
@Profile("dev")
class DevDataSourceConfig { @Bean DataSource ds() { return embeddedH2(); } }

@Configuration
@Profile({"prod", "staging"})
class ProdDataSourceConfig { @Bean DataSource ds() { return hikariFromVault(); } }

@Profile("!prod")     // everything except prod
class TestDataSeeder { }</code></pre>
<p><strong>Activation</strong>, in increasing precedence: <code>application.yml</code> (<code>spring.profiles.active</code>) → environment variable <code>SPRING_PROFILES_ACTIVE=prod</code> → JVM arg <code>-Dspring.profiles.active=prod</code> → programmatically. Property files layer too: <code>application.yml</code> is always loaded, then <code>application-prod.yml</code> overrides it.</p>
<p><strong>Practical advice:</strong> keep profiles few and environment-shaped (<code>dev</code>, <code>test</code>, <code>prod</code>). Using them for feature toggles leads to combinatorial configurations nobody can reason about — use real feature flags for that.</p>`
},
{
  q: "What is the Spring event mechanism and when would you use it?",
  level: "advanced", tags: ["events"],
  a: `<pre><code>// 1. Define the event — a record is ideal
public record OrderPlacedEvent(String orderId, BigDecimal total) { }

// 2. Publish
@Service
@RequiredArgsConstructor
class OrderService {
    private final ApplicationEventPublisher publisher;

    @Transactional
    public void place(Order o) {
        repo.save(o);
        publisher.publishEvent(new OrderPlacedEvent(o.id(), o.total()));
    }
}

// 3. Listen
@Component
class EmailListener {
    @EventListener
    void on(OrderPlacedEvent e) { mail.sendConfirmation(e.orderId()); }

    @Async                                              // separate thread
    @TransactionalEventListener(phase = AFTER_COMMIT)   // only if the tx committed
    void onCommitted(OrderPlacedEvent e) { analytics.track(e); }
}</code></pre>
<p><strong>Default behaviour is synchronous and in the same transaction</strong> — an exception in a listener rolls back the publisher. That surprises people, so state it.</p>
<p><code>@TransactionalEventListener(phase = AFTER_COMMIT)</code> is the important one: it guarantees you only send the email if the order actually committed. Combined with <code>@Async</code>, it is the standard in-process decoupling pattern — and a natural stepping stone to explaining why you would move to Kafka for cross-service events.</p>`
},
{
  q: "What is the difference between @Bean and @Component?",
  level: "beginner", tags: ["annotations"],
  a: `<table>
<tr><th></th><th><code>@Component</code></th><th><code>@Bean</code></th></tr>
<tr><td>Applied to</td><td>A class</td><td>A method inside <code>@Configuration</code></td></tr>
<tr><td>Discovered by</td><td>Component scanning</td><td>Explicit declaration</td></tr>
<tr><td>Control over creation</td><td>Spring calls the constructor</td><td>You write the creation code</td></tr>
<tr><td>Third-party classes</td><td>Cannot — you cannot annotate their source</td><td><strong>Yes</strong> — the main reason it exists</td></tr>
<tr><td>Conditional/multiple instances</td><td>Awkward</td><td>Easy — several <code>@Bean</code> methods of the same type</td></tr>
</table>
<pre><code>@Configuration
class ClientConfig {
    // Third-party class you cannot annotate + custom construction
    @Bean
    WebClient paymentClient(WebClient.Builder builder,
                            @Value("\${payment.url}") String url) {
        return builder.baseUrl(url)
                      .defaultHeader("X-Api-Version", "2")
                      .build();
    }
}</code></pre>
<p><strong>Rule of thumb:</strong> <code>@Component</code> for your own classes, <code>@Bean</code> for library types and anything needing construction logic.</p>`
},
{
  q: "How would you write a custom annotation with AOP?",
  level: "advanced", tags: ["aop", "annotations"],
  a: `<pre><code>// 1. The annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)   // MUST be RUNTIME for reflection to see it
public @interface RateLimited {
    int permitsPerSecond() default 10;
    String key() default "";
}

// 2. The aspect
@Aspect @Component @RequiredArgsConstructor
public class RateLimitAspect {
    private final Map&lt;String, RateLimiter&gt; limiters = new ConcurrentHashMap&lt;&gt;();

    @Around("@annotation(rateLimited)")
    public Object apply(ProceedingJoinPoint pjp, RateLimited rateLimited) throws Throwable {
        String key = rateLimited.key().isEmpty()
                ? pjp.getSignature().toLongString() : rateLimited.key();

        RateLimiter limiter = limiters.computeIfAbsent(key,
                k -&gt; RateLimiter.create(rateLimited.permitsPerSecond()));

        if (!limiter.tryAcquire(Duration.ofMillis(200))) {
            throw new TooManyRequestsException(key);
        }
        return pjp.proceed();
    }
}

// 3. Use it
@RateLimited(permitsPerSecond = 5)
public Quote getQuote(String symbol) { ... }</code></pre>
<p>Points that earn credit: <code>RUNTIME</code> retention is mandatory, binding the annotation as an advice parameter is cleaner than reflection, and the same limitations apply — it only works on public methods called through the proxy.</p>`
},
{
  q: "What design patterns does Spring itself use?",
  level: "advanced", tags: ["patterns"],
  a: `<ul>
<li><strong>Factory</strong> — <code>BeanFactory</code>/<code>ApplicationContext</code> create beans; <code>FactoryBean</code> for complex construction.</li>
<li><strong>Singleton</strong> — the default bean scope (container-managed, not the static anti-pattern).</li>
<li><strong>Proxy</strong> — AOP, <code>@Transactional</code>, <code>@Cacheable</code>, lazy loading.</li>
<li><strong>Template Method</strong> — <code>JdbcTemplate</code>, <code>RestTemplate</code>, <code>TransactionTemplate</code>.</li>
<li><strong>Front Controller</strong> — <code>DispatcherServlet</code>.</li>
<li><strong>Observer</strong> — <code>ApplicationEvent</code>/<code>@EventListener</code>.</li>
<li><strong>Strategy</strong> — <code>PlatformTransactionManager</code>, <code>ViewResolver</code>, <code>CacheManager</code> implementations.</li>
<li><strong>Adapter</strong> — <code>HandlerAdapter</code>, <code>HandlerMethodArgumentResolver</code>.</li>
<li><strong>Decorator</strong> — <code>BeanPostProcessor</code> wrapping beans, servlet filters.</li>
<li><strong>Chain of Responsibility</strong> — the Spring Security filter chain, MVC interceptors.</li>
<li><strong>Builder</strong> — <code>WebClient.builder()</code>, <code>MockMvcRequestBuilders</code>, <code>UriComponentsBuilder</code>.</li>
<li><strong>Dependency Injection</strong> itself — arguably the whole point.</li>
</ul>
<p>Being able to attach a real Spring class to each pattern name is what distinguishes a memorised list from understanding.</p>`
},
{
  q: "How does @Value and property resolution work?",
  level: "beginner", tags: ["configuration"],
  a: `<pre><code>@Value("\${app.retry.max:3}")               // with default
private int maxRetries;

@Value("\${app.allowed-origins}")           // comma-separated -> List
private List&lt;String&gt; origins;

@Value("#{systemProperties['user.timezone']}")   // SpEL
private String timezone;

@Value("#{@featureService.isEnabled('newFlow')}") // SpEL calling a bean
private boolean newFlow;</code></pre>
<p><code>\${...}</code> is <strong>property placeholder</strong> resolution; <code>#{...}</code> is <strong>SpEL</strong> expression evaluation. Mixing them up is a common source of "it injected the literal string".</p>
<p><strong>Prefer <code>@ConfigurationProperties</code> for anything beyond one or two values</strong> — it gives type safety, validation, IDE autocompletion via the metadata processor, relaxed binding, and grouping:</p>
<pre><code>@ConfigurationProperties(prefix = "app.retry")
@Validated
public record RetryProperties(@Min(1) int max, @NotNull Duration backoff) { }</code></pre>
<p>Property source precedence (highest first): command-line args → <code>SPRING_APPLICATION_JSON</code> → OS environment variables → profile-specific YAML → <code>application.yml</code> → <code>@PropertySource</code> → defaults. Environment variables beating files is what makes twelve-factor container configuration work.</p>
<p><strong>Note:</strong> <code>@Value</code> on a field is field injection, so it is not available in the constructor. Put it on constructor parameters instead when you need it during construction.</p>`
}
]);
