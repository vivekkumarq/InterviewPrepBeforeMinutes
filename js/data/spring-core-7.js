registerSimple("spring-core", {
"What is the difference between @Autowired, @Resource, @Inject and @Qualifier?":
`They all ask Spring to supply a dependency. <code>@Autowired</code> (Spring's own) and <code>@Inject</code> (the Java standard) find a bean by its <b>type</b>. <code>@Resource</code> finds it by its <b>name</b> first. <code>@Qualifier</code> is added to say exactly which bean you want when there are several of the same type.`,

"How does Spring handle bean initialisation order and @DependsOn?":
`Spring normally works out the order by itself: a bean is created after everything it needs. <code>@DependsOn</code> is only for unusual cases where one bean must be ready before another even though the second does not directly use it, for example a database migration that must finish before a cache loads data.`,

"What is @Lazy and when should you use it?":
`Normally Spring creates all beans when the application starts. <code>@Lazy</code> tells Spring to wait and create a bean only the first time something actually uses it. Use it for expensive beans that are rarely needed. The downside is that configuration mistakes show up later instead of at startup.`,

"How do you create conditional beans with @Conditional?":
`Conditional annotations create a bean only when a rule is true: a property is set, a library is present, or no other bean of that type exists yet. For example <code>@ConditionalOnProperty("feature.sms.enabled")</code> creates the SMS sender only when the feature is switched on. Spring Boot's auto-configuration is built on these.`,

"What is the ApplicationContext hierarchy and how do refresh and close work?":
`The ApplicationContext is Spring's container. "Refresh" is the startup process: read configuration, create and connect all beans, then announce that the app is ready. "Close" is the shutdown: run clean-up methods and destroy beans in the right order. A context can also have a parent context whose beans it can use.`,

"How does SpEL work and where is it used?":
`SpEL (Spring Expression Language) lets you write small expressions in annotations, such as <code>#{2 * 60}</code> or checks in <code>@PreAuthorize</code>. Do not confuse it with <code>\${...}</code>, which simply reads a value from your configuration files. <code>#{...}</code> calculates something; <code>\${...}</code> looks something up.`,

"What is the difference between @Component scanning and explicit bean registration?":
`With scanning, you put <code>@Component</code> (or @Service etc.) on your classes and Spring finds them automatically. With explicit registration, you write <code>@Bean</code> methods in a configuration class that build the objects yourself. Scanning is convenient for your own classes; <code>@Bean</code> is needed for classes from other libraries or when creating the object needs special logic.`,

"How do you register beans programmatically at runtime?":
`Sometimes you only know at startup how many beans you need, for example one database connection per customer listed in a config file. Spring lets you add bean definitions in code during startup instead of with annotations. It is rarely needed in normal applications but common when building reusable libraries.`,

"What is the difference between BeanFactoryPostProcessor and BeanPostProcessor — and why does ordering matter?":
`A <b>BeanFactoryPostProcessor</b> runs before any bean is created and can change the bean "recipes" (for example, filling in placeholder values). A <b>BeanPostProcessor</b> runs after each bean is created and can modify or wrap that object (this is how proxies get added). Because they run at different stages, the order matters for what each one can see.`,

"How do you handle multiple datasources in a Spring application?":
`Define one DataSource bean per database, mark the main one with <code>@Primary</code>, and give each its own transaction manager and, with JPA, its own entity manager. Then use <code>@Qualifier</code> or separate repository packages so each part of the code talks to the right database.`,

"What is @Scheduled and how do you run scheduled jobs safely in a clustered deployment?":
`<code>@Scheduled</code> runs a method on a timer, like "every night at 2 am". By default all scheduled jobs share one thread, so a slow job delays the others. In a cluster, every server would run the same job at the same time, so you add a shared lock (for example with ShedLock) so only one server runs each job.`,

"Why is constructor injection preferred over field injection? Give four concrete reasons":
`With constructor injection: dependencies can be <code>final</code> (they never change), the class cannot be created without them, it is easy to create in a plain unit test with <code>new</code>, and a constructor with too many parameters is a visible warning that the class is doing too much.`,

"What are the different ways to define a bean in Spring?":
`Three main ways. Put <code>@Component</code> (or @Service, @Repository, @Controller) on your own class. Write a <code>@Bean</code> method inside a <code>@Configuration</code> class, which suits classes from other libraries. Or register beans in code at startup when the set of beans is dynamic.`,

"How does Spring resolve a bean when there are multiple implementations of an interface?":
`Spring first looks for an exact instruction: a <code>@Qualifier</code> at the injection point wins. If there is none, it uses the bean marked <code>@Primary</code>. If neither exists, it tries to match the parameter name to a bean name, and if that fails it refuses to start. You can also inject all implementations as a List.`,

"What is the Spring IoC container's role and how does it differ from a factory?":
`A factory just creates an object when you call it. The IoC container goes further: it creates all your objects, connects them to each other, runs their setup and clean-up code, and adds extra behaviour like transactions. Your classes never ask for anything; the container hands it to them.`,

"Explain @Transactional propagation with a real nested-service example":
`Propagation decides what happens when a transactional method calls another one. With the default, <b>REQUIRED</b>, the inner method joins the existing transaction, so if anything fails, everything rolls back together. With <b>REQUIRES_NEW</b>, the inner method gets its own separate transaction, useful for an audit log that must be saved even if the main work fails.`,

"What is the difference between @Component and @Configuration, and what is proxyBeanMethods?":
`Both can contain <code>@Bean</code> methods. In a <code>@Configuration</code> class, Spring wraps the class so that if one @Bean method calls another, you get the same shared bean rather than a new object. In a plain <code>@Component</code>, that call creates a new object every time. <code>proxyBeanMethods = false</code> turns off the wrapping to start faster when you do not need it.`,

"How would you implement a custom BeanPostProcessor and what would you use it for?":
`A BeanPostProcessor is a hook that sees every bean right after it is created and can modify it or wrap it. Spring itself uses this hook to process <code>@Autowired</code>, to call <code>@PostConstruct</code> methods, and to add proxies for <code>@Transactional</code>. You would write one rarely, for example to wrap certain beans with timing or logging.`,

"How do Spring profiles work with configuration properties in a multi-environment setup?":
`Profiles let you keep different settings per environment. <code>application.yml</code> holds shared settings, and files like <code>application-prod.yml</code> override them when the "prod" profile is active. You switch profiles with <code>SPRING_PROFILES_ACTIVE</code>. Environment variables and command-line arguments override both, which is how secrets are supplied safely.`,

"Why does @Transactional not work when you call the method from inside the same class?":
`Spring adds transactions with a proxy, a wrapper object that sits in front of your bean. Calls from other beans go through the wrapper, so the transaction starts. But when one method calls another inside the same class, it calls the real object directly, skipping the wrapper, so no transaction starts. Move the method to another bean to fix it.`,

"Explain bean scopes and what goes wrong when you inject a prototype into a singleton":
`A scope decides how many instances of a bean exist: <b>singleton</b> (one shared, the default), <b>prototype</b> (a new one each time it is requested), and request or session scopes in web apps. The trap: a singleton is created once, so a prototype injected into it is also created only once and then reused forever, which is not what you wanted.`,

"How does Spring resolve ambiguity when multiple beans of the same type exist?":
`When two beans could fill the same slot, Spring needs a hint. <code>@Primary</code> marks the default choice. <code>@Qualifier("name")</code> picks a specific one. Asking for <code>List&lt;Type&gt;</code> or <code>Map&lt;String, Type&gt;</code> gives you all of them at once. Without a hint, Spring stops at startup with an error.`,

"How does Spring AOP actually work, and what can it not intercept?":
`AOP adds extra behaviour (logging, timing, transactions) around your methods without changing them. Spring does it with proxies: wrappers in front of your beans that run the extra code before and after the call. Because only calls that go through the wrapper are affected, it cannot intercept calls within the same class, private methods, or objects Spring did not create.`,

"How does Spring Boot auto-configuration work under the hood?":
`Spring Boot ships many ready-made configuration classes. At startup it checks conditions for each: is a certain library on the classpath, is a certain property set, have you already defined your own bean? It applies only those whose conditions are true. That is how adding a database library automatically gives you a working connection pool.`,

"Refactor this code from 'new' everywhere to dependency injection, and show why it becomes testable":
`When a class creates its own database, email sender and clock with <code>new</code>, you cannot test it without a real database and real email. Change it to receive those things through its constructor, and in tests you can pass in fakes and a fixed clock. The class now only decides what to do, not which concrete tools to use.`,

"Build a pluggable notification sender by injecting every implementation as a List or Map":
`Make a <code>Notifier</code> interface with email, SMS and push implementations, each as a Spring bean. If a service asks for <code>List&lt;Notifier&gt;</code>, Spring passes in all of them. The service can then pick the right one per channel or send through all. Adding WhatsApp later is just one new class, with no changes to the service.`,

"What is Inversion of Control and Dependency Injection?":
`<b>Inversion of Control</b> means your classes no longer create and manage their own helpers; a framework (Spring) does it for them. <b>Dependency Injection</b> is the way it delivers those helpers: by passing them in, usually through the constructor. The result is loosely connected, easily testable code.`,

"Constructor vs setter vs field injection — which and why?":
`<b>Constructor injection</b> is best: required dependencies are guaranteed, fields can be final, and tests are easy. <b>Setter injection</b> suits optional dependencies that can be changed later. <b>Field injection</b> (@Autowired on a field) looks short but hides dependencies and makes testing harder, so avoid it.`,

"What are the Spring bean scopes?":
`<b>singleton</b>: one shared instance for the whole app (the default). <b>prototype</b>: a new instance every time one is requested. In web apps, <b>request</b> gives one per HTTP request and <b>session</b> one per user session. Most beans should be stateless singletons.`,

"Explain the Spring bean lifecycle":
`A bean's life: Spring creates it, injects its dependencies, lets post-processors adjust it, calls its setup method (<code>@PostConstruct</code>), wraps it in a proxy if needed, then it is used. When the application shuts down, Spring calls its clean-up method (<code>@PreDestroy</code>).`,

"What is a circular dependency and how do you fix it?":
`A circular dependency is when bean A needs B and B needs A, so Spring cannot create either one first and fails at startup. The real fix is a design change: move the shared logic into a third bean that both use, or have one side publish an event instead of calling the other directly.`,

"What is @Component vs @Service vs @Repository vs @Controller?":
`All four tell Spring to create a bean, and the last three are specialised versions of <code>@Component</code>. <code>@Service</code> marks business logic, <code>@Repository</code> marks database access and also translates database errors into Spring's exceptions, and <code>@Controller</code> marks web request handlers. Using the right one makes code easier to read.`,

"What is @Configuration and how does it differ from @Component for @Bean methods?":
`A <code>@Configuration</code> class holds <code>@Bean</code> methods, and Spring wraps it so that calling one @Bean method from another returns the existing shared bean. If you put @Bean methods in a plain <code>@Component</code>, that same call creates a brand-new object, which can quietly give you two copies of something meant to be single.`,

"How does Spring resolve multiple candidate beans of the same type?":
`It looks for a <code>@Qualifier</code> naming the bean you want, then for a bean marked <code>@Primary</code>, then tries matching the variable name to a bean name. If none of these settles it, startup fails with an error saying more than one bean was found.`,

"What is AOP? Explain aspect, join point, pointcut and advice.":
`AOP (aspect-oriented programming) keeps cross-cutting tasks like logging or security in one place instead of repeating them everywhere. An <b>aspect</b> is the module holding that code. A <b>join point</b> is a moment it can run, such as a method call. A <b>pointcut</b> chooses which methods. <b>Advice</b> is the code itself and when it runs (before, after or around).`,

"How does Spring AOP work internally? JDK dynamic proxy vs CGLIB":
`Spring replaces your bean with a proxy that runs the extra AOP code and then calls the real method. If the bean implements an interface, Spring can create a JDK proxy that implements the same interface. Otherwise it uses CGLIB, which creates a subclass of your class at run time. Spring Boot uses CGLIB by default.`,

"Explain @Transactional — propagation, isolation and rollback rules":
`<code>@Transactional</code> makes a method run in a database transaction: all its changes are saved together, or none are. <b>Propagation</b> says what to do if a transaction already exists. <b>Isolation</b> controls how much it sees of other transactions running at the same time. By default it rolls back on unchecked exceptions but not on checked ones.`,

"Why does @Transactional not work sometimes?":
`The common causes: calling the method from inside the same class (bypassing the proxy), the method not being public, the class not being a Spring bean, catching the exception yourself so the rollback is never triggered, throwing a checked exception (which does not roll back by default), or using the wrong transaction manager.`,

"What is ApplicationContext vs BeanFactory?":
`<b>BeanFactory</b> is Spring's basic container that creates beans when asked. <b>ApplicationContext</b> is the full-featured version you actually use: it creates singletons at startup so errors appear early, and adds events, profiles, configuration properties and messages for different languages.`,

"What are BeanPostProcessor and BeanFactoryPostProcessor?":
`Both are hooks into Spring's startup. A <b>BeanFactoryPostProcessor</b> runs before beans are created and can change their definitions, for example replacing <code>\${...}</code> placeholders with real values. A <b>BeanPostProcessor</b> runs on each bean after it is created and can change or wrap it, which is how @Autowired and proxies work.`,

"How do Spring profiles work?":
`A profile is a named set of beans and settings, such as "dev" or "prod". Mark beans with <code>@Profile("prod")</code> or put settings in <code>application-prod.yml</code>, then choose the active profile with <code>SPRING_PROFILES_ACTIVE=prod</code>. The same code then behaves differently per environment.`,

"What is the Spring event mechanism and when would you use it?":
`One bean can publish an event ("order placed") and other beans can listen for it, without the publisher knowing who listens. It keeps parts of your code loosely connected. By default listeners run immediately in the same transaction; <code>@TransactionalEventListener</code> can wait until the transaction has committed.`,

"What is the difference between @Bean and @Component?":
`<code>@Component</code> goes on a class you wrote, and Spring creates it automatically by calling its constructor. <code>@Bean</code> goes on a method inside a configuration class, and you write the code that creates the object. Use @Bean for classes from other libraries or when creating the object needs special setup.`,

"How would you write a custom annotation with AOP?":
`Create an annotation such as <code>@Timed</code>, then write an aspect with "around" advice that runs for any method carrying it: note the time, call the real method, log how long it took. Remember that, like all Spring AOP, it only works on calls that go through the Spring proxy.`,

"What design patterns does Spring itself use?":
`Spring is full of classic patterns: <b>Factory</b> (the container creating beans), <b>Singleton</b> (one shared bean), <b>Proxy</b> (AOP and transactions), <b>Template Method</b> (JdbcTemplate, RestTemplate), <b>Observer</b> (application events) and <b>Strategy</b> (pluggable implementations behind interfaces).`,

"How does @Value and property resolution work?":
`<code>@Value("\${app.timeout}")</code> injects a value from your configuration (properties files, YAML, environment variables), and you can give a default such as <code>\${app.timeout:30}</code>. Spring checks several sources in order of priority. For groups of related settings, <code>@ConfigurationProperties</code> is cleaner than many separate @Value fields.`
});
