appendTopic("spring-core", [
{
  q: "What is the difference between @Autowired, @Resource, @Inject and @Qualifier?",
  level: "beginner", hot: true, tags: ["di", "annotations"],
  a: `<table>
<tr><th></th><th>Origin</th><th>Matches by</th><th>Notes</th></tr>
<tr><td><code>@Autowired</code></td><td>Spring</td><td><strong>Type</strong>, then name as a tie-break</td><td><code>required = false</code> supported</td></tr>
<tr><td><code>@Resource</code></td><td>JSR-250 (Jakarta)</td><td><strong>Name</strong>, then type</td><td><code>@Resource(name = "smsNotifier")</code></td></tr>
<tr><td><code>@Inject</code></td><td>JSR-330</td><td>Type</td><td>Standard; needs <code>jakarta.inject</code> on the classpath</td></tr>
<tr><td><code>@Qualifier</code></td><td>Spring / JSR-330</td><td>Narrows an existing match</td><td>Used <em>with</em> the others</td></tr>
</table>
<pre><code>@Service
public class AlertService {
    // Preferred: constructor injection, no annotation needed for a single constructor
    private final Notifier notifier;

    public AlertService(@Qualifier("smsNotifier") Notifier notifier) {
        this.notifier = notifier;
    }
}

// Optional dependency
@Autowired(required = false) private MetricsExporter exporter;      // may stay null
private final Optional&lt;MetricsExporter&gt; exporter;                   // cleaner
private final ObjectProvider&lt;MetricsExporter&gt; exporter;             // lazy + optional</code></pre>
<p><strong>Practical guidance:</strong> use constructor injection and skip the annotation entirely — since Spring 4.3 a class with one constructor is autowired implicitly. Reach for <code>@Qualifier</code> when several beans share a type, and prefer a <strong>custom qualifier annotation</strong> over a string name, because a typo in a string is a runtime failure while a missing annotation is a compile error.</p>
<pre><code>@Qualifier @Retention(RUNTIME) public @interface Sms { }
@Component @Sms class SmsNotifier implements Notifier { }
AlertService(@Sms Notifier notifier) { ... }        // refactor-safe</code></pre>`
},
{
  q: "How does Spring handle bean initialisation order and @DependsOn?",
  level: "advanced", tags: ["beans", "lifecycle"],
  a: `<p>Spring determines order from the <strong>dependency graph</strong> — a bean is created after everything it is injected with. That handles the vast majority of cases automatically.</p>
<pre><code>// Explicit ordering when there is no injected dependency but a real one exists
@Component
@DependsOn("flywayMigrator")            // ensure migrations ran before this bean starts
public class CacheWarmer { }

// Ordering a LIST of injected beans (strategy chains, filters, interceptors)
@Component @Order(1) class ValidationHandler implements Handler { }
@Component @Order(2) class EnrichmentHandler implements Handler { }

@Service
class Pipeline {
    Pipeline(List&lt;Handler&gt; handlers) { }   // injected in @Order sequence
}</code></pre>
<p><strong>Two different concerns that get confused:</strong></p>
<ul>
<li><code>@DependsOn</code> controls <strong>creation order</strong> of beans.</li>
<li><code>@Order</code> / <code>Ordered</code> controls the <strong>sequence within an injected collection</strong>, and the order of filters, aspects and <code>ApplicationListener</code>s. It does <em>not</em> affect instantiation order.</li>
</ul>
<p><strong>For startup logic that must run after the context is fully ready</strong>, prefer these over <code>@PostConstruct</code>:</p>
<pre><code>@Component
class Startup implements ApplicationRunner {           // runs after the context is refreshed
    public void run(ApplicationArguments args) { warmCaches(); }
}

@EventListener(ApplicationReadyEvent.class)            // after the server is accepting traffic
void onReady() { registerWithServiceDiscovery(); }</code></pre>
<p><strong>Why that matters:</strong> inside <code>@PostConstruct</code> the bean's own AOP proxy does not exist yet, so <code>@Transactional</code> and <code>@Cacheable</code> are silently ignored, and other beans may not be initialised. Relying on <code>@DependsOn</code> extensively is usually a sign the design has hidden coupling worth removing.</p>`
},
{
  q: "What is @Lazy and when should you use it?",
  level: "advanced", tags: ["beans", "performance"],
  a: `<p>By default Spring instantiates all singletons eagerly at startup. <code>@Lazy</code> defers creation until the bean is first used.</p>
<pre><code>@Component @Lazy                       // created on first use
public class ExpensiveReportEngine { }

// On an injection point: Spring injects a PROXY that resolves the real bean on first call
@Service
class ReportService {
    ReportService(@Lazy ExpensiveReportEngine engine) { }
}

// Application-wide (dev/test only)
spring.main.lazy-initialization=true</code></pre>
<p><strong>Legitimate uses:</strong></p>
<ul>
<li>A genuinely expensive bean that most requests never touch (a report engine, a heavy client).</li>
<li>Faster startup during local development and tests.</li>
<li>Breaking a circular dependency — a workaround, not a fix.</li>
</ul>
<p><strong>Why it is not a good global default in production:</strong> eager initialisation is a <em>feature</em>. It fails fast — a missing property, an unreachable database or a misconfigured bean blows up at deployment, where your rollout automation catches it, rather than at 2am on the first request that touches that code path. With lazy initialisation everywhere, a broken bean can lie dormant for hours.</p>
<p><strong>Also note:</strong> <code>@Lazy</code> on an injection point creates a proxy, which means the target class must be proxyable (not <code>final</code>, and with a default constructor for CGLIB), and every call pays a small indirection cost.</p>`
},
{
  q: "How do you create conditional beans with @Conditional?",
  level: "advanced", hot: true, tags: ["configuration"],
  a: `<pre><code>@Configuration
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "s3")
    StorageClient s3(S3Properties props) { return new S3StorageClient(props); }

    @Bean
    @ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
    StorageClient local() { return new LocalStorageClient(); }

    @Bean
    @ConditionalOnMissingBean(StorageClient.class)     // only if the user did not define one
    StorageClient fallback() { return new NoopStorageClient(); }

    @Bean
    @ConditionalOnClass(name = "io.minio.MinioClient") // only if the library is present
    StorageClient minio() { return new MinioStorageClient(); }
}</code></pre>
<p><strong>The full family:</strong> <code>@ConditionalOnClass</code> / <code>OnMissingClass</code>, <code>@ConditionalOnBean</code> / <code>OnMissingBean</code>, <code>@ConditionalOnProperty</code>, <code>@ConditionalOnWebApplication</code>, <code>@ConditionalOnResource</code>, <code>@ConditionalOnExpression</code> (SpEL), <code>@ConditionalOnJava</code>, <code>@ConditionalOnCloudPlatform</code>.</p>
<pre><code>// A custom condition when the built-ins are not enough
public class OnKubernetesCondition implements Condition {
    public boolean matches(ConditionContext ctx, AnnotatedTypeMetadata meta) {
        return System.getenv("KUBERNETES_SERVICE_HOST") != null;
    }
}
@Bean @Conditional(OnKubernetesCondition.class)
ServiceRegistry k8sRegistry() { ... }</code></pre>
<p><strong>The ordering caveat worth knowing:</strong> <code>@ConditionalOnBean</code> and <code>@ConditionalOnMissingBean</code> depend on <em>when</em> the condition is evaluated, so they are reliable in auto-configuration (which Spring applies last, in a defined order) but fragile between your own <code>@Configuration</code> classes. Use <code>@AutoConfigureAfter</code>/<code>@AutoConfigureBefore</code> in a starter, and prefer <code>@ConditionalOnProperty</code> for your own application configuration — it is deterministic.</p>
<p>Debug with <code>--debug</code>, which prints the conditions evaluation report showing exactly which condition matched or failed.</p>`
},
{
  q: "What is the ApplicationContext hierarchy and how do refresh and close work?",
  level: "advanced", tags: ["container", "lifecycle"],
  a: `<p><code>AbstractApplicationContext.refresh()</code> is a template method — a fixed twelve-step algorithm that every context implementation follows. Knowing the sequence explains most "why did this happen" questions.</p>
<pre><code>refresh() {
  1  prepareRefresh();                       // set start time, validate required properties
  2  obtainFreshBeanFactory();               // parse bean DEFINITIONS (not instances yet)
  3  prepareBeanFactory();                   // register environment, resource loaders
  4  postProcessBeanFactory();
  5  invokeBeanFactoryPostProcessors();      // \${...} placeholders resolved HERE
  6  registerBeanPostProcessors();           // register (not run) BPPs
  7  initMessageSource();                    // i18n
  8  initApplicationEventMulticaster();
  9  onRefresh();                            // ← embedded web server created here
 10  registerListeners();
 11  finishBeanFactoryInitialization();      // ← ALL non-lazy singletons instantiated
 12  finishRefresh();                        // publish ContextRefreshedEvent
}</code></pre>
<p><strong>Why step 5 before step 11 matters:</strong> <code>BeanFactoryPostProcessor</code>s modify bean <em>definitions</em> before any bean exists, which is how property placeholders and <code>@ConfigurationProperties</code> binding work. <code>BeanPostProcessor</code>s then wrap bean <em>instances</em> during step 11 — which is where AOP proxies are created.</p>
<p><strong>Context hierarchy:</strong> a child context can see its parent's beans, but not the reverse. Spring MVC historically used this (a root context for services, a servlet context for controllers). Spring Boot uses a single flat context by default, which is simpler — hierarchies mainly appear now in Spring Cloud's bootstrap context.</p>
<pre><code>// Shutdown
context.close();        // publishes ContextClosedEvent -&gt; @PreDestroy -&gt; DisposableBean
SpringApplication.run(App.class, args);   // registers a JVM shutdown hook automatically</code></pre>
<p>Graceful shutdown matters in Kubernetes: <code>server.shutdown=graceful</code> lets in-flight requests finish before destruction begins, so a rolling deploy drops no requests.</p>`
},
{
  q: "How does SpEL work and where is it used?",
  level: "advanced", tags: ["spel"],
  a: `<pre><code>@Value("#{systemProperties['user.region'] ?: 'IN'}")   private String region;
@Value("#{@featureService.isEnabled('newFlow')}")       private boolean newFlow;
@Value("#{T(java.time.Duration).ofSeconds(30)}")        private Duration timeout;
@Value("#{'\${app.tags}'.split(',')}")                   private List&lt;String&gt; tags;

// In security expressions
@PreAuthorize("hasRole('ADMIN') or #order.customerId == authentication.principal.id")
public Order update(Order order) { }

// In cache keys
@Cacheable(value = "orders", key = "#customerId + ':' + #status", condition = "#status != null")
List&lt;Order&gt; find(Long customerId, String status);

// In @Scheduled
@Scheduled(cron = "#{@scheduleProperties.cleanupCron}")
void cleanup() { }</code></pre>
<p><strong>Syntax essentials:</strong> <code>#{...}</code> is SpEL, <code>\${...}</code> is a property placeholder — mixing them up is the most common mistake. Inside SpEL: <code>@beanName</code> references a bean, <code>T(...)</code> a type, <code>#param</code> a method argument, <code>?.</code> safe navigation, <code>?:</code> Elvis, <code>?[...]</code> collection selection, <code>![...]</code> projection.</p>
<p><strong>Where you meet it:</strong> <code>@Value</code>, Spring Security expressions, cache annotations, <code>@Scheduled</code>, Spring Data <code>@Query</code>, Spring Integration routing, and bean definition properties.</p>
<blockquote><p><strong>Security warning worth raising:</strong> never evaluate SpEL built from user input. SpEL can call arbitrary methods via <code>T(java.lang.Runtime)</code>, and expression injection has been the root of real CVEs (including Spring4Shell-adjacent issues). Keep expressions static in code, and if you must evaluate dynamic expressions, use <code>SimpleEvaluationContext</code> rather than <code>StandardEvaluationContext</code>.</p></blockquote>
<p>Prefer plain Java over clever SpEL where you can — it is not type-checked, not refactor-safe, and fails at runtime.</p>`
},
{
  q: "What is the difference between @Component scanning and explicit bean registration?",
  level: "advanced", tags: ["configuration", "design"],
  a: `<table>
<tr><th></th><th>Component scanning</th><th>Explicit <code>@Bean</code></th></tr>
<tr><td>Discovery</td><td>Classpath scan for stereotypes</td><td>Declared in a <code>@Configuration</code> class</td></tr>
<tr><td>Startup cost</td><td>Scanning takes time; grows with the classpath</td><td>None</td></tr>
<tr><td>Visibility</td><td>Wiring is implicit — spread across many files</td><td>Everything in one readable place</td></tr>
<tr><td>Third-party classes</td><td>Impossible</td><td>The only option</td></tr>
<tr><td>Conditional / multiple instances</td><td>Awkward</td><td>Straightforward</td></tr>
<tr><td>Native image / AOT</td><td>Needs reflection hints</td><td>More AOT-friendly</td></tr>
</table>
<pre><code>// Narrow the scan — a broad basePackages costs startup time
@SpringBootApplication(scanBasePackages = "com.acme.orders")

// Filter what is scanned
@ComponentScan(basePackages = "com.acme",
    excludeFilters = @Filter(type = ASSIGNABLE_TYPE, classes = LegacyService.class))

// Explicit registration for third-party or configured objects
@Bean
WebClient paymentClient(WebClient.Builder builder, PaymentProperties props) {
    return builder.baseUrl(props.url())
                  .defaultHeader("X-Api-Version", "2")
                  .build();
}</code></pre>
<p><strong>The practical answer:</strong> scan your own components (it keeps boilerplate low and is what Spring Boot expects), and use <code>@Bean</code> for anything you do not own or that needs construction logic. Keep the main class in the root package so the default scan covers exactly your code and nothing else.</p>
<p><strong>Worth adding:</strong> a very broad component scan across a large classpath is a genuine startup cost, and it can accidentally pick up beans from a dependency. Being explicit about <code>scanBasePackages</code> in a large application is a small change with a measurable effect.</p>`
},
{
  q: "How do you register beans programmatically at runtime?",
  level: "advanced", tags: ["advanced", "extension"],
  a: `<pre><code>// 1. BeanDefinitionRegistryPostProcessor — add definitions before instantiation
@Component
public class TenantBeanRegistrar implements BeanDefinitionRegistryPostProcessor {

    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
        for (String tenant : discoverTenants()) {
            var def = BeanDefinitionBuilder
                    .genericBeanDefinition(TenantDataSource.class)
                    .addConstructorArgValue(tenant)
                    .setScope(BeanDefinition.SCOPE_SINGLETON)
                    .getBeanDefinition();
            registry.registerBeanDefinition("dataSource-" + tenant, def);
        }
    }
}

// 2. ImportBeanDefinitionRegistrar — driven by an annotation (how @EnableXxx works)
public class FeatureRegistrar implements ImportBeanDefinitionRegistrar {
    public void registerBeanDefinitions(AnnotationMetadata meta, BeanDefinitionRegistry reg) { }
}
@Import(FeatureRegistrar.class)
public @interface EnableFeatureToggles { }

// 3. Functional registration at startup — the modern, AOT-friendly way
new SpringApplicationBuilder(App.class)
    .initializers((GenericApplicationContext ctx) -&gt;
        ctx.registerBean(AuditService.class, () -&gt; new AuditService(ctx.getBean(Clock.class))))
    .run(args);</code></pre>
<p><strong>Where this is genuinely needed:</strong> multi-tenant applications creating one datasource per tenant discovered at startup, plugin architectures, and building your own <code>@EnableXxx</code> starter. It is also exactly how Spring Data creates repository implementations for your interfaces, and how Feign creates HTTP clients — worth pointing out, because it demystifies "magic" people attribute to the framework.</p>
<p><strong>Caution:</strong> beans registered this way exist outside the compile-time model, so IDE navigation, AOT processing and native images all need extra care. Use it when the set of beans is genuinely dynamic, not to be clever.</p>`
},
{
  q: "What is the difference between BeanFactoryPostProcessor and BeanPostProcessor — and why does ordering matter?",
  level: "advanced", tags: ["extension", "internals"],
  a: `<table>
<tr><th></th><th><code>BeanFactoryPostProcessor</code></th><th><code>BeanPostProcessor</code></th></tr>
<tr><td>Operates on</td><td>Bean <strong>definitions</strong> (metadata)</td><td>Bean <strong>instances</strong></td></tr>
<tr><td>Runs</td><td>Before any bean is instantiated</td><td>Around each bean's initialisation</td></tr>
<tr><td>Can</td><td>Add, remove or modify definitions</td><td>Wrap, replace or configure the instance</td></tr>
<tr><td>Examples</td><td><code>PropertySourcesPlaceholderConfigurer</code>, <code>ConfigurationClassPostProcessor</code></td><td><code>AutowiredAnnotationBeanPostProcessor</code>, <code>AnnotationAwareAspectJAutoProxyCreator</code></td></tr>
</table>
<pre><code>@Component
public class SecretMaskingBeanPostProcessor implements BeanPostProcessor, Ordered {

    @Override
    public Object postProcessAfterInitialization(Object bean, String name) {
        if (bean instanceof DataSource ds) return new LoggingDataSourceProxy(ds);
        return bean;
    }
    @Override public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }
}</code></pre>
<p><strong>Why ordering matters — the subtle trap:</strong> a <code>BeanPostProcessor</code> is itself a bean, and it must exist before the beans it processes. That means <strong>anything it depends on is instantiated very early</strong>, before other post-processors are registered — so those dependencies do <em>not</em> get post-processed. They will not be proxied, so <code>@Transactional</code> on them silently does nothing, and Spring logs a warning like <em>"is not eligible for getting processed by all BeanPostProcessors"</em>.</p>
<p><strong>The rules that follow:</strong> keep <code>BeanPostProcessor</code>s dependency-free (or inject lazily via <code>ObjectProvider</code>); implement <code>PriorityOrdered</code> or <code>Ordered</code> when relative order matters; and remember that <code>@Transactional</code>, <code>@Async</code>, <code>@Cacheable</code> and <code>@Validated</code> are all implemented as <code>BeanPostProcessor</code>-created proxies — which is exactly why they never work on beans created with <code>new</code>, on private methods, or via self-invocation.</p>`
},
{
  q: "How do you handle multiple datasources in a Spring application?",
  level: "advanced", hot: true, tags: ["configuration", "jpa"],
  a: `<pre><code>@Configuration
public class DataSourceConfig {

    @Bean @Primary                                   // one MUST be primary
    @ConfigurationProperties("app.datasource.orders")
    DataSourceProperties ordersProps() { return new DataSourceProperties(); }

    @Bean @Primary
    DataSource ordersDataSource(DataSourceProperties p) {
        return p.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean @Primary
    LocalContainerEntityManagerFactoryBean ordersEmf(
            EntityManagerFactoryBuilder builder, @Qualifier("ordersDataSource") DataSource ds) {
        return builder.dataSource(ds)
                      .packages("com.acme.orders.domain")     // package per datasource
                      .persistenceUnit("orders").build();
    }

    @Bean @Primary
    PlatformTransactionManager ordersTx(@Qualifier("ordersEmf") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
    // ... repeat without @Primary for the reporting datasource
}

@EnableJpaRepositories(
    basePackages = "com.acme.orders.repository",
    entityManagerFactoryRef = "ordersEmf",
    transactionManagerRef = "ordersTx")
class OrdersRepositoryConfig { }</code></pre>
<p><strong>The three things that go wrong:</strong></p>
<ul>
<li><strong>Forgetting <code>@Primary</code></strong> — Spring Boot's auto-configuration cannot decide which <code>DataSource</code> to use and fails at startup.</li>
<li><strong>Forgetting to qualify the transaction manager</strong> — <code>@Transactional</code> silently uses the primary one, so writes to the second datasource are never in a transaction. Always write <code>@Transactional("reportingTx")</code> for the non-primary side.</li>
<li><strong>Expecting atomicity across both</strong> — there is none without XA/JTA, and distributed two-phase commit is best avoided. Design so a business transaction touches one datasource, and use the outbox pattern or a saga if it genuinely spans both.</li>
</ul>
<p><strong>A simpler alternative to mention:</strong> for read replicas or multi-tenancy, <code>AbstractRoutingDataSource</code> switches datasource per request based on a ThreadLocal key — one EMF, one transaction manager, far less configuration.</p>`
},
{
  q: "What is @Scheduled and how do you run scheduled jobs safely in a clustered deployment?",
  level: "advanced", hot: true, tags: ["scheduling", "production"],
  a: `<pre><code>@Configuration @EnableScheduling
public class SchedulingConfig {
    @Bean TaskScheduler taskScheduler() {
        var s = new ThreadPoolTaskScheduler();
        s.setPoolSize(5);                       // DEFAULT IS 1 — jobs block each other
        s.setThreadNamePrefix("sched-");
        s.setWaitForTasksToCompleteOnShutdown(true);
        return s;
    }
}

@Component
public class CleanupJob {
    @Scheduled(fixedDelay = 60_000, initialDelay = 10_000)   // gap AFTER completion
    void pollQueue() { }

    @Scheduled(fixedRate = 60_000)                            // every 60s from each START
    void heartbeat() { }

    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")   // 02:00 daily
    void nightlyReport() {
        try { generate(); }
        catch (Exception e) { log.error("report failed", e); }   // MUST catch
    }
}</code></pre>
<p><strong>Three problems that bite in production:</strong></p>
<ol>
<li><strong>The default pool size is 1.</strong> All scheduled jobs share one thread, so a slow job delays every other job. Always configure a <code>TaskScheduler</code>.</li>
<li><strong>An uncaught exception cancels all future executions</strong> of that job — silently. Wrap the body in try/catch.</li>
<li><strong>Every replica runs the job.</strong> With three pods, your nightly report runs three times and your cleanup deletes rows concurrently.</li>
</ol>
<pre><code>// Cluster-safe: ShedLock — a database/Redis lock so exactly one instance runs it
@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "nightlyReport", lockAtMostFor = "30m", lockAtLeastFor = "5m")
void nightlyReport() { }</code></pre>
<p><strong>Alternatives worth naming:</strong> ShedLock (simplest, distributed lock only), Quartz with a JDBC job store (full clustering, misfire handling, persistent triggers), a Kubernetes <code>CronJob</code> running a separate short-lived pod (clean separation, no in-app scheduling), or an external scheduler triggering an endpoint. For anything business-critical, a dedicated CronJob or Quartz beats in-process <code>@Scheduled</code>, because you also get retry history and visibility.</p>`
}
]);
