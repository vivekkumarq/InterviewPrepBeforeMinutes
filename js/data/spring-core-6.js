registerPrimer("spring-core", `<h3>The mental model: you describe the parts, Spring builds the machine</h3>
<p>Without Spring, every class creates what it needs with <code>new</code>. A controller builds its service, the service builds its repository, the repository builds its connection pool. Each class is glued to the exact classes it creates, and nothing can be swapped out for a test.</p>
<p>With Spring you turn that around. Each class only <strong>declares</strong> what it needs, usually as constructor parameters. The <strong>IoC container</strong> (the <code>ApplicationContext</code>) reads those declarations, creates every object (a <em>bean</em>) once, and passes each one the beans it asked for. This is <strong>Inversion of Control</strong>: the container, not your code, controls creation. <strong>Dependency Injection</strong> is how it hands the parts over.</p>
<figure class="fig">
<svg viewBox="0 0 620 232" role="img" aria-label="Spring container: scan and config produce bean definitions, the container creates beans, injects dependencies and wraps some in proxies">
  <defs><marker id="pr-sc" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="20" width="130" height="62" rx="8"/>
  <text class="dg-t" x="75" y="42" text-anchor="middle">@Component scan</text>
  <text class="dg-t" x="75" y="60" text-anchor="middle">@Bean methods</text>
  <text class="dg-s" x="75" y="75" text-anchor="middle">what you declare</text>
  <line class="dg-line" x1="140" y1="51" x2="166" y2="51" marker-end="url(#pr-sc)"/>
  <rect class="dg-fill" x="168" y="20" width="130" height="62" rx="8"/>
  <text class="dg-t" x="233" y="44" text-anchor="middle">Bean definitions</text>
  <text class="dg-s" x="233" y="62" text-anchor="middle">recipes: class, scope,</text>
  <text class="dg-s" x="233" y="75" text-anchor="middle">dependencies</text>
  <line class="dg-line" x1="298" y1="51" x2="324" y2="51" marker-end="url(#pr-sc)"/>
  <rect class="dg-fill2" x="326" y="20" width="130" height="62" rx="8"/>
  <text class="dg-t" x="391" y="44" text-anchor="middle">Create + inject</text>
  <text class="dg-s" x="391" y="62" text-anchor="middle">dependencies first,</text>
  <text class="dg-s" x="391" y="75" text-anchor="middle">then the bean</text>
  <line class="dg-line" x1="456" y1="51" x2="482" y2="51" marker-end="url(#pr-sc)"/>
  <rect class="dg-fill" x="484" y="20" width="126" height="62" rx="8"/>
  <text class="dg-t" x="547" y="44" text-anchor="middle">Post-process</text>
  <text class="dg-s" x="547" y="62" text-anchor="middle">wrap in a PROXY if</text>
  <text class="dg-s" x="547" y="75" text-anchor="middle">@Transactional etc.</text>
  <rect class="dg-box" x="10" y="116" width="600" height="104" rx="10"/>
  <text class="dg-t" x="22" y="136">The running application context</text>
  <rect class="dg-box" x="30" y="152" width="150" height="50" rx="7"/>
  <text class="dg-t" x="105" y="174" text-anchor="middle">OrderController</text>
  <text class="dg-s" x="105" y="190" text-anchor="middle">needs OrderService</text>
  <line class="dg-line" x1="180" y1="177" x2="228" y2="177" marker-end="url(#pr-sc)"/>
  <rect class="dg-fill2" x="230" y="146" width="170" height="62" rx="7" stroke-dasharray="4 3"/>
  <text class="dg-s" x="315" y="162" text-anchor="middle">proxy: begin / commit</text>
  <rect class="dg-fill" x="248" y="168" width="134" height="32" rx="6"/>
  <text class="dg-t" x="315" y="189" text-anchor="middle">OrderService</text>
  <line class="dg-line" x1="400" y1="177" x2="448" y2="177" marker-end="url(#pr-sc)"/>
  <rect class="dg-box" x="450" y="152" width="140" height="50" rx="7"/>
  <text class="dg-t" x="520" y="174" text-anchor="middle">OrderRepository</text>
  <text class="dg-s" x="520" y="190" text-anchor="middle">a singleton, shared</text>
</svg>
<figcaption>The controller receives the proxy, not the raw service. The proxy is what makes @Transactional, @Cacheable and @Async work.</figcaption>
</figure>
<h3>Worked example: one feature, wired by the container</h3>
<pre><code>@Repository
class OrderRepository {
    Order save(Order o) { /* JDBC or JPA */ return o; }
}

@Service
class OrderService {
    private final OrderRepository repo;
    private final Clock clock;

    OrderService(OrderRepository repo, Clock clock) {   // "I need these two"
        this.repo = repo;
        this.clock = clock;
    }

    @Transactional
    public Order place(Order o) {
        o.setPlacedAt(clock.instant());
        return repo.save(o);
    }
}

@Configuration
class TimeConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }   // a class you do not own
}                                                       // becomes a bean via @Bean

@RestController
class OrderController {
    private final OrderService service;
    OrderController(OrderService service) { this.service = service; }

    @PostMapping("/orders")
    Order place(@RequestBody Order o) { return service.place(o); }
}

// At startup Spring works out the order for you:
//   Clock and OrderRepository (no dependencies)  -&gt;  OrderService
//   -&gt; wraps OrderService in a transaction proxy  -&gt;  OrderController
// None of these classes calls 'new' on another. In a test you can pass a
// fixed Clock and a fake repository straight into the constructor.</code></pre>
<h3>Five facts that answer most Spring core questions</h3>
<table>
<tr><th>Fact</th><th>Consequence</th></tr>
<tr><td>Beans are <strong>singletons</strong> by default</td><td>One instance shared by every request, so beans must not keep per-request state in fields</td></tr>
<tr><td>Prefer <strong>constructor injection</strong></td><td>Dependencies are final, required, and visible; tests need no Spring at all</td></tr>
<tr><td>Features like <code>@Transactional</code> work through a <strong>proxy</strong></td><td>Calling the method from inside the same class skips the proxy, so the annotation does nothing</td></tr>
<tr><td>Two beans of one type = <strong>ambiguity</strong></td><td>Resolve with <code>@Primary</code>, <code>@Qualifier</code>, or inject all of them as a <code>List</code></td></tr>
<tr><td>Circular constructor dependencies <strong>fail at startup</strong></td><td>That is a design smell: extract the shared part into a third bean</td></tr>
</table>`);

appendTopic("spring-core", [
{
  q: "Refactor this code from 'new' everywhere to dependency injection, and show why it becomes testable",
  level: "beginner", hot: true, tags: ["dependency-injection", "ioc", "testing", "must-know"],
  companies: ["Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Capgemini", "Amazon", "SAP"],
  a: `<p>"What is dependency injection?" is best answered by showing the problem it solves. Here is a report service written without it.</p>
<pre><code>// BEFORE: every dependency is created inside the class
public class InvoiceService {
    private final InvoiceRepository repo = new JdbcInvoiceRepository(
            new HikariDataSource(loadConfig()));          // needs a real database
    private final EmailSender email = new SmtpEmailSender("smtp.corp.com");  // sends real mail

    public void sendOverdueReminders() {
        LocalDate today = LocalDate.now();                // hidden dependency on the clock
        for (Invoice inv : repo.findUnpaid()) {
            if (inv.dueDate().isBefore(today)) {
                email.send(inv.customerEmail(), "Your invoice is overdue");
            }
        }
    }
}</code></pre>
<p><strong>Try to unit test <code>sendOverdueReminders</code>.</strong> You cannot. The test would need a live database, would send real emails, and its result would change depending on what day it runs. The class decides <em>what</em> to do and also <em>which concrete things</em> to do it with, and those two jobs are welded together.</p>
<pre><code>// AFTER: the class asks for what it needs. It no longer chooses the implementations.
@Service
public class InvoiceService {
    private final InvoiceRepository repo;      // interfaces, not concrete classes
    private final EmailSender email;
    private final Clock clock;

    public InvoiceService(InvoiceRepository repo, EmailSender email, Clock clock) {
        this.repo = repo;
        this.email = email;
        this.clock = clock;
    }

    public void sendOverdueReminders() {
        LocalDate today = LocalDate.now(clock);
        for (Invoice inv : repo.findUnpaid()) {
            if (inv.dueDate().isBefore(today)) {
                email.send(inv.customerEmail(), "Your invoice is overdue");
            }
        }
    }
}</code></pre>
<pre><code>// The test: plain Java, no Spring, no database, no mail server, runs in milliseconds
@Test
void remindsOnlyOverdueInvoices() {
    var repo  = mock(InvoiceRepository.class);
    var email = mock(EmailSender.class);
    var clock = Clock.fixed(Instant.parse("2026-03-10T00:00:00Z"), ZoneOffset.UTC);

    when(repo.findUnpaid()).thenReturn(List.of(
        new Invoice("a@x.com", LocalDate.parse("2026-03-01")),   // overdue
        new Invoice("b@x.com", LocalDate.parse("2026-03-20"))    // not yet due
    ));

    new InvoiceService(repo, email, clock).sendOverdueReminders();

    verify(email).send("a@x.com", "Your invoice is overdue");
    verify(email, never()).send(eq("b@x.com"), anyString());
}</code></pre>
<table>
<tr><th>Before</th><th>After</th></tr>
<tr><td>Class creates its dependencies</td><td>Class receives them through the constructor</td></tr>
<tr><td>Tied to JDBC, SMTP and the system clock</td><td>Depends on interfaces; any implementation fits</td></tr>
<tr><td>Test needs real infrastructure</td><td>Test uses mocks and a fixed clock</td></tr>
<tr><td>Switching SMTP to an email API means editing this class</td><td>Register a different <code>EmailSender</code> bean; this class does not change</td></tr>
</table>
<p><strong>Notice that the "after" class does not depend on Spring at all</strong> apart from the <code>@Service</code> label. Dependency injection is a design technique first. Spring is just the tool that does the wiring in production, so you do not have to write the <code>new</code> calls in a big main method yourself.</p>
<p><strong>The one-liner:</strong> "DI means a class declares what it needs instead of building it. That separates what the class does from which implementations it uses, so I can test it with fakes and swap implementations without editing it."</p>`
},
{
  q: "Build a pluggable notification sender by injecting every implementation as a List or Map",
  level: "advanced", hot: true, tags: ["dependency-injection", "strategy-pattern", "design", "must-know"],
  companies: ["Amazon", "Flipkart", "Swiggy", "Razorpay", "PhonePe", "Paytm", "SAP"],
  a: `<p>A common design task: "Users can be notified by email, SMS or push, and we will add WhatsApp next quarter. Design it." The weak answer is a <code>switch</code> on the channel inside one service. The strong answer uses a Spring feature many people do not know: <strong>ask for a collection and Spring injects every bean of that type</strong>.</p>
<pre><code>public enum Channel { EMAIL, SMS, PUSH }

public interface Notifier {
    Channel channel();                         // each implementation says what it handles
    void send(String userId, String message);
}

@Component
class EmailNotifier implements Notifier {
    public Channel channel() { return Channel.EMAIL; }
    public void send(String userId, String msg) { /* call the email API */ }
}

@Component
class SmsNotifier implements Notifier {
    public Channel channel() { return Channel.SMS; }
    public void send(String userId, String msg) { /* call the SMS gateway */ }
}

@Component
class PushNotifier implements Notifier {
    public Channel channel() { return Channel.PUSH; }
    public void send(String userId, String msg) { /* call FCM / APNs */ }
}</code></pre>
<pre><code>@Service
public class NotificationService {
    private final Map&lt;Channel, Notifier&gt; byChannel;

    // Spring passes EVERY Notifier bean in the context
    public NotificationService(List&lt;Notifier&gt; notifiers) {
        this.byChannel = notifiers.stream()
            .collect(Collectors.toMap(Notifier::channel, n -&gt; n,
                (a, b) -&gt; { throw new IllegalStateException(
                    "Two notifiers for " + a.channel()); },     // fail at STARTUP
                () -&gt; new EnumMap&lt;&gt;(Channel.class)));
    }

    public void sendTo(String userId, Channel channel, String message) {
        Notifier n = byChannel.get(channel);
        if (n == null) throw new IllegalArgumentException("No notifier for " + channel);
        n.send(userId, message);
    }

    public void broadcast(String userId, String message) {
        byChannel.values().forEach(n -&gt; n.send(userId, message));
    }
}

// Adding WhatsApp next quarter: add WHATSAPP to the enum and write one new
// @Component class. NotificationService is not edited at all.</code></pre>
<table>
<tr><th>Injection point</th><th>What Spring passes</th></tr>
<tr><td><code>List&lt;Notifier&gt;</code></td><td>All beans of that type, ordered by <code>@Order</code> or <code>Ordered</code> if present</td></tr>
<tr><td><code>Map&lt;String, Notifier&gt;</code></td><td>All beans keyed by <strong>bean name</strong> (e.g. <code>"emailNotifier"</code>)</td></tr>
<tr><td><code>ObjectProvider&lt;Notifier&gt;</code></td><td>Lazy access; <code>orderedStream()</code>, or <code>getIfAvailable()</code> when a bean may be missing</td></tr>
<tr><td>A single <code>Notifier</code></td><td>Startup fails with <code>NoUniqueBeanDefinitionException</code> unless one is <code>@Primary</code></td></tr>
</table>
<p><strong>Why key by an enum from the bean itself, not <code>Map&lt;String, Notifier&gt;</code>?</strong> Bean names are derived from class names, so renaming <code>SmsNotifier</code> to <code>TwilioNotifier</code> silently changes the key and breaks every lookup. A <code>channel()</code> method is explicit, type-checked, and the merge function above makes a duplicate a startup error instead of a silent overwrite.</p>
<pre><code>// Turning channels on and off per environment, with no code change:
@Component
@ConditionalOnProperty(name = "notify.sms.enabled", havingValue = "true")
class SmsNotifier implements Notifier { ... }
// In an environment with the property off, the bean does not exist, the list
// has two entries, and sendTo(..., SMS, ...) fails with a clear message.</code></pre>
<p><strong>What to call it in the interview:</strong> this is the <strong>Strategy pattern</strong> plus the Open/Closed principle, with Spring doing the registry for you. The same shape shows up everywhere: payment providers, file parsers by extension, pricing rules by country, and Spring's own <code>HandlerMethodArgumentResolver</code> list.</p>`
}
]);
