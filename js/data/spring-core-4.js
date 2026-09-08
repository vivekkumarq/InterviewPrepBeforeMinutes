appendTopic("spring-core", [
{
  q: "Why does @Transactional not work when you call the method from inside the same class?",
  level: "advanced", hot: true, tags: ["proxy", "transactions", "gotcha", "aop"],
  companies: ["Amazon", "Optum", "SAP", "Infosys", "TCS", "Cognizant", "EPAM", "Societe Generale"],
  a: `<pre><code>@Service
public class OrderService {

    public void processAll(List&lt;Order&gt; orders) {
        for (Order o : orders) {
            processOne(o);          // ✗ SELF-INVOCATION — no transaction at all
        }
    }

    @Transactional
    public void processOne(Order o) { repo.save(o); }
}</code></pre>
<p><strong>The cause:</strong> Spring's <code>@Transactional</code> is implemented with a <strong>proxy</strong>. Callers get the proxy, and the proxy opens the transaction before delegating to your object. A call from <em>inside</em> the object goes straight to <code>this</code> — the proxy is never involved, so no transaction, no rollback, no propagation.</p>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="External call passing through the proxy versus internal self invocation bypassing it">
  <rect class="dg-box" x="16" y="30" width="90" height="34" rx="6"/><text class="dg-s" x="61" y="52" text-anchor="middle">caller</text>
  <path class="dg-line" d="M110 47 H166" marker-end="url(#pr1)"/>
  <rect class="dg-fill" x="170" y="22" width="140" height="50" rx="8"/>
  <text class="dg-s" x="240" y="42" text-anchor="middle">Proxy</text>
  <text class="dg-s" x="240" y="60" text-anchor="middle">begin / commit</text>
  <path class="dg-line" d="M314 47 H370" marker-end="url(#pr1)"/>
  <rect class="dg-fill2" x="374" y="22" width="150" height="120" rx="8"/>
  <text class="dg-s" x="449" y="44" text-anchor="middle">OrderService</text>
  <text class="dg-s" x="449" y="74" text-anchor="middle">processAll()</text>
  <text class="dg-s" x="449" y="120" text-anchor="middle">processOne()</text>
  <path class="dg-line" d="M420 84 V110" marker-end="url(#pr1)"/>
  <text class="dg-s" x="500" y="100">this.processOne()</text>
  <text class="dg-s" x="16" y="106">the proxy is bypassed entirely —</text>
  <text class="dg-s" x="16" y="126">no transaction is started</text>
  <text class="dg-s" x="16" y="158">the same applies to @Cacheable, @Async, @Retryable and @PreAuthorize</text>
  <defs><marker id="pr1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Fix</th><th>Verdict</th></tr>
<tr><td><strong>Move the method to another bean</strong></td><td><strong>Best</strong> — the call crosses a proxy boundary, and it usually improves the design</td></tr>
<tr><td>Inject <code>self</code> (<code>@Lazy OrderService self</code>) and call <code>self.processOne()</code></td><td>Works; slightly awkward but explicit</td></tr>
<tr><td><code>TransactionTemplate</code> programmatically</td><td>Works, and gives precise control over the boundary</td></tr>
<tr><td><code>AopContext.currentProxy()</code></td><td>Works but needs <code>exposeProxy=true</code> and couples you to Spring internals</td></tr>
<tr><td>AspectJ load-time weaving</td><td>Removes the limitation entirely — heavy for one method</td></tr>
</table>
<pre><code>// The other silent failures from the same proxy mechanism
@Transactional private void x() { }     // ✗ private — never proxied
@Transactional final void y() { }        // ✗ final — CGLIB cannot override it
@Transactional void z() { }              // ✗ package-private with CGLIB: silently ignored

// And the rollback rule that surprises people
@Transactional
public void save() throws IOException {
    repo.save(entity);
    throw new IOException("failed");     // CHECKED exception -> NO ROLLBACK by default
}
// Spring rolls back on RuntimeException and Error only. For checked exceptions:
@Transactional(rollbackFor = Exception.class)</code></pre>
<table>
<tr><th>Proxy type</th><th>Used when</th><th>Limitation</th></tr>
<tr><td>JDK dynamic proxy</td><td>The bean implements an interface</td><td>Only interface methods are advised</td></tr>
<tr><td><strong>CGLIB</strong> (Spring Boot default)</td><td>No interface, or <code>proxyTargetClass=true</code></td><td>Class and methods must not be <code>final</code>; needs a non-private constructor</td></tr>
</table>
<p><strong>How to spot it in an interview answer:</strong> the giveaway symptom is "the transaction silently does nothing" — no error, no log, just data that was not rolled back. Being able to say "self-invocation bypasses the proxy" immediately, and to name the same trap for <code>@Async</code> and <code>@Cacheable</code>, is what makes this a strong answer rather than a memorised one.</p>`
},
{
  q: "Explain bean scopes and what goes wrong when you inject a prototype into a singleton",
  level: "advanced", hot: true, tags: ["beans", "lifecycle", "gotcha"],
  companies: ["Amazon", "SAP", "Optum", "Infosys", "TCS", "Wipro", "EPAM", "Cognizant"],
  a: `<table>
<tr><th>Scope</th><th>One instance per</th><th>Destroyed by Spring?</th></tr>
<tr><td><strong>singleton</strong> (default)</td><td>Container</td><td>Yes</td></tr>
<tr><td><strong>prototype</strong></td><td>Every injection or <code>getBean</code></td><td><strong>No</strong> — Spring hands it over and forgets it</td></tr>
<tr><td>request</td><td>HTTP request</td><td>Yes</td></tr>
<tr><td>session</td><td>HTTP session</td><td>Yes</td></tr>
<tr><td>application</td><td>ServletContext</td><td>Yes</td></tr>
<tr><td>websocket</td><td>WebSocket session</td><td>Yes</td></tr>
</table>
<pre><code>// ✗ The classic bug: a singleton injects a prototype ONCE, at startup
@Service
public class ReportService {                 // singleton
    @Autowired private ReportBuilder builder; // prototype — but injected ONE TIME
    // Every request reuses the SAME builder instance. The prototype scope
    // is silently ignored, and if the builder holds state it is now shared.
}</code></pre>
<pre><code>// ✔ Fix 1 — ObjectProvider: ask for a fresh one each time
@Service
public class ReportService {
    private final ObjectProvider&lt;ReportBuilder&gt; builders;
    ReportService(ObjectProvider&lt;ReportBuilder&gt; builders) { this.builders = builders; }

    public Report build() { return builders.getObject().build(); }   // new every call
}

// ✔ Fix 2 — a scoped proxy on the prototype bean itself
@Component
@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ReportBuilder { }
// Now the injected reference is a proxy that resolves a new target per call.

// ✔ Fix 3 — @Lookup, if you prefer it declaratively
@Component
public abstract class ReportService {
    @Lookup protected abstract ReportBuilder newBuilder();   // Spring implements it
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Singleton holding one prototype instance versus a provider creating fresh ones">
  <rect class="dg-fill" x="16" y="24" width="150" height="34" rx="6"/><text class="dg-s" x="91" y="46" text-anchor="middle">singleton service</text>
  <path class="dg-line" d="M170 41 H222" marker-end="url(#sc1)"/>
  <rect class="dg-box" x="226" y="24" width="150" height="34" rx="6"/><text class="dg-s" x="301" y="46" text-anchor="middle">ONE prototype, forever</text>
  <text class="dg-s" x="400" y="46">injected once at startup ✗</text>
  <rect class="dg-fill" x="16" y="92" width="150" height="34" rx="6"/><text class="dg-s" x="91" y="114" text-anchor="middle">singleton + provider</text>
  <path class="dg-line" d="M170 100 H222 M170 109 H222 M170 118 H222" marker-end="url(#sc1)"/>
  <rect class="dg-fill2" x="226" y="86" width="150" height="20" rx="4"/>
  <rect class="dg-fill2" x="226" y="110" width="150" height="20" rx="4"/>
  <text class="dg-s" x="400" y="114">a fresh instance per call ✔</text>
  <defs><marker id="sc1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// The other prototype trap: Spring does NOT call @PreDestroy on prototypes.
@Component @Scope("prototype")
public class Connection {
    @PreDestroy public void close() { }   // NEVER CALLED — you must close it yourself
}
// Prototype beans are the caller's responsibility from the moment they are handed over.</code></pre>
<table>
<tr><th>Lifecycle hook</th><th>Runs</th></tr>
<tr><td>Constructor</td><td>First — dependencies are already available with constructor injection</td></tr>
<tr><td><code>@Autowired</code> setters/fields</td><td>After construction</td></tr>
<tr><td><code>@PostConstruct</code></td><td>After all injection — the right place for validation and warm-up</td></tr>
<tr><td><code>InitializingBean.afterPropertiesSet</code></td><td>After <code>@PostConstruct</code></td></tr>
<tr><td><code>@Bean(initMethod=…)</code></td><td>Last of the init hooks</td></tr>
<tr><td><code>@PreDestroy</code></td><td>On graceful shutdown — <strong>singletons only</strong></td></tr>
</table>
<p><strong>The design point to make:</strong> "Singleton beans should be <em>stateless</em>. Almost every scope-related bug in Spring comes from putting mutable request state into a singleton — it works in testing with one user and corrupts under concurrency. If I need per-request state I pass it as a method parameter, which is simpler and faster than any scoped proxy."</p>`
},
{
  q: "How does Spring resolve ambiguity when multiple beans of the same type exist?",
  level: "beginner", hot: true, tags: ["di", "beans", "configuration"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Amazon", "SAP", "Optum"],
  a: `<pre><code>// The failure
// NoUniqueBeanDefinitionException: expected single matching bean but found 2:
//   emailNotifier, smsNotifier

public interface Notifier { void send(String msg); }
@Component class EmailNotifier implements Notifier { }
@Component class SmsNotifier   implements Notifier { }

@Service
class AlertService {
    AlertService(Notifier notifier) { }   // which one?
}</code></pre>
<table>
<tr><th>Mechanism</th><th>How it resolves</th><th>Use when</th></tr>
<tr><td><code>@Primary</code></td><td>Marks one bean as the default</td><td>There is an obvious default and one exception</td></tr>
<tr><td><code>@Qualifier("name")</code></td><td>Names the bean explicitly at the injection point</td><td>Each consumer genuinely wants a specific one</td></tr>
<tr><td>Parameter name matching</td><td>The parameter name matches the bean name</td><td>Works, but silent and fragile — it breaks if the parameter is renamed</td></tr>
<tr><td>Custom qualifier annotation</td><td>Type-safe qualifier</td><td>Best for a fixed set of variants</td></tr>
<tr><td><code>@Order</code> / <code>Ordered</code></td><td>Orders an injected <code>List&lt;T&gt;</code></td><td>Chains of handlers or filters</td></tr>
<tr><td>Inject <code>Map&lt;String, T&gt;</code></td><td>All beans keyed by name</td><td><strong>Strategy lookup by key</strong></td></tr>
</table>
<pre><code>// ✔ Custom qualifier — type-safe, refactorable, no magic strings
@Qualifier @Retention(RUNTIME) public @interface Sms { }

@Component @Sms class SmsNotifier implements Notifier { }

@Service class AlertService {
    AlertService(@Sms Notifier notifier) { }
}

// ✔ The strategy-map pattern — my favourite answer to this question
@Service
public class PaymentRouter {
    private final Map&lt;String, PaymentHandler&gt; handlers;   // key = bean name

    PaymentRouter(Map&lt;String, PaymentHandler&gt; handlers) { this.handlers = handlers; }

    public void pay(String method, Order order) {
        PaymentHandler h = handlers.get(method);
        if (h == null) throw new UnsupportedPaymentException(method);
        h.handle(order);
    }
}
// Adding a new payment method is a new @Component and NO change here —
// an open/closed design that Spring gives you for free.</code></pre>
<pre><code>// Conditional beans — resolve by environment rather than by name
@Bean @Profile("prod")   PaymentGateway realGateway()  { return new StripeGateway(); }
@Bean @Profile("!prod")  PaymentGateway stubGateway()  { return new StubGateway(); }

@Bean @ConditionalOnMissingBean          // Boot: back off if the user defined their own
@Bean @ConditionalOnProperty(name = "feature.sms.enabled", havingValue = "true")</code></pre>
<p><strong>The recommendation to state:</strong> "I prefer constructor injection with an explicit <code>@Qualifier</code> or a custom qualifier annotation over <code>@Primary</code>, because <code>@Primary</code> hides <em>which</em> implementation a class actually got — and that is exactly the thing you want to see when debugging. Where the choice is data-driven rather than compile-time, I inject the whole <code>Map</code> and route by key instead of writing a switch."</p>`
}
]);
