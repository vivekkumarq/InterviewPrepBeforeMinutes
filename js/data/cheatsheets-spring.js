registerSheet("spring-core", [
  { h: "Annotations by job", t: "table", rows: [
    ["Annotation", "Does"],
    ["<code>@Component</code>", "Generic bean, picked up by scanning"],
    ["<code>@Service</code> / <code>@Repository</code>", "Same, but intent-revealing; Repository also translates exceptions"],
    ["<code>@Configuration</code> + <code>@Bean</code>", "Explicit bean definitions (for third-party types)"],
    ["<code>@Primary</code>", "Default when several beans match"],
    ["<code>@Qualifier(\"name\")</code>", "Pick one explicitly"],
    ["<code>@Lazy</code>", "Create on first use"],
    ["<code>@Profile(\"prod\")</code>", "Only in that profile"],
    ["<code>@Scope(\"prototype\")</code>", "New instance per injection"]
  ]},
  { h: "The self-invocation trap", t: "code", lang: "java", code:
"@Service class OrderService {\n    public void all(List<Order> os) {\n        os.forEach(this::one);      // ✗ bypasses the PROXY — no transaction\n    }\n    @Transactional public void one(Order o) { repo.save(o); }\n}\n\n// Same for @Async, @Cacheable, @Retryable, @PreAuthorize.\n// Fix: move the method to another bean (best), inject self, or\n// use TransactionTemplate. private/final methods are never proxied." },
  { h: "Bean lifecycle order", t: "list", items: [
    "Constructor (dependencies already available with constructor injection)",
    "<code>@Autowired</code> setters and fields",
    "<code>@PostConstruct</code> — validation and warm-up belong here",
    "<code>InitializingBean.afterPropertiesSet</code>, then <code>@Bean(initMethod)</code>",
    "<code>@PreDestroy</code> on shutdown — <b>singletons only</b>, never prototypes"
  ]},
  { h: "Injecting a prototype into a singleton", t: "code", lang: "java", code:
"// ✗ injected ONCE at startup — the prototype scope is silently ignored\n@Autowired private ReportBuilder builder;\n\n// ✔ a fresh one per call\nprivate final ObjectProvider<ReportBuilder> builders;\nbuilders.getObject().build();\n\n// ✔ or a scoped proxy on the bean itself\n@Scope(value = \"prototype\", proxyMode = ScopedProxyMode.TARGET_CLASS)" },
  { h: "Strategy map — the pattern to quote", t: "code", lang: "java", code:
"@Service class PaymentRouter {\n    private final Map<String, PaymentHandler> handlers;   // key = bean name\n    PaymentRouter(Map<String, PaymentHandler> h) { this.handlers = h; }\n    void pay(String method, Order o) { handlers.get(method).handle(o); }\n}\n// A new payment type is a new @Component and NO change here." }
]);

registerSheet("spring-boot", [
  { h: "Property precedence (high → low)", t: "list", items: [
    "Command-line args <code>--server.port=9090</code>",
    "<code>SPRING_APPLICATION_JSON</code>",
    "<b>OS environment variables</b> — how containers inject config",
    "Java system properties <code>-D</code>",
    "<code>application-{profile}.yml</code> outside the jar, then inside",
    "<code>application.yml</code> outside, then inside",
    "Relaxed binding: <code>app.max-pool-size</code> ≡ <code>APP_MAXPOOLSIZE</code>"
  ]},
  { h: "@Value vs @ConfigurationProperties", t: "table", rows: [
    ["", "<code>@Value</code>", "<code>@ConfigurationProperties</code>"],
    ["Type safety", "String parsing", "Full binding, nested, collections"],
    ["Validation", "None", "<code>@Validated</code> — <b>fails at startup</b>"],
    ["Relaxed binding", "No", "Yes"],
    ["IDE completion", "No", "Yes"],
    ["Use for", "One-off values", "<b>Everything else</b>"]
  ]},
  { h: "Actuator endpoints", t: "table", rows: [
    ["Endpoint", "Use"],
    ["<code>/health/liveness</code>", "Is the process wedged? <b>Must not check dependencies</b>"],
    ["<code>/health/readiness</code>", "Can it serve traffic? May check the DB"],
    ["<code>/prometheus</code>", "Metrics scrape"],
    ["<code>/loggers</code>", "<b>Change log levels at runtime</b> — no redeploy"],
    ["<code>/threaddump</code>, <code>/heapdump</code>", "Diagnostics without shell access"],
    ["<code>/env</code>, <code>/configprops</code>", "Effective config — secure these"]
  ]},
  { h: "Error handling", t: "code", lang: "java", code:
"@RestControllerAdvice\nclass GlobalExceptionHandler {\n    @ExceptionHandler(OrderNotFoundException.class)\n    ProblemDetail notFound(OrderNotFoundException ex) {\n        var pd = ProblemDetail.forStatusAndDetail(NOT_FOUND, ex.getMessage());\n        pd.setProperty(\"orderId\", ex.getOrderId());\n        return pd;                      // RFC 7807, built in since Boot 3\n    }\n    @ExceptionHandler(Exception.class)\n    ProblemDetail unexpected(Exception ex) {\n        log.error(\"unhandled [{}]\", MDC.get(\"traceId\"), ex);   // detail in the LOG\n        return ProblemDetail.forStatusAndDetail(\n            INTERNAL_SERVER_ERROR, \"An unexpected error occurred\"); // generic to client\n    }\n}" },
  { h: "Production checklist", t: "list", items: [
    "<code>spring.jpa.open-in-view=false</code> — Boot warns about this and teams ignore it.",
    "<code>server.shutdown=graceful</code> plus a preStop delay.",
    "Actuator on a separate port, never internet-facing.",
    "Timeouts and bounded pools on <b>every</b> outbound client.",
    "<code>-XX:MaxRAMPercentage=75</code>, heap dump on OOM.",
    "Liveness must not check the DB — one hiccup restarts every pod at once."
  ]}
]);

registerSheet("spring-security", [
  { h: "Filter chain order", t: "list", items: [
    "<code>SecurityContextPersistenceFilter</code> — load the context",
    "<code>HeaderWriterFilter</code> — security headers",
    "<code>CsrfFilter</code>",
    "<code>LogoutFilter</code>",
    "Authentication filters (<code>UsernamePasswordAuthenticationFilter</code>, <code>BearerTokenAuthenticationFilter</code>)",
    "<code>ExceptionTranslationFilter</code> — turns exceptions into 401/403",
    "<code>FilterSecurityInterceptor</code> / <code>AuthorizationFilter</code> — the decision"
  ]},
  { h: "Authentication vs authorization", t: "table", rows: [
    ["", "Authentication", "Authorization"],
    ["Question", "Who are you?", "May you do this?"],
    ["Failure", "<b>401</b> Unauthorized", "<b>403</b> Forbidden"],
    ["Where", "Filter chain", "Filter chain + method security"]
  ]},
  { h: "Method security", t: "code", lang: "java", code:
"@EnableMethodSecurity            // Boot 3\n\n@PreAuthorize(\"hasRole('ADMIN')\")\n@PreAuthorize(\"hasAuthority('SCOPE_orders:write')\")\n@PreAuthorize(\"@orderSecurity.canEdit(authentication, #id)\")   // testable bean\n@PostAuthorize(\"returnObject.ownerId == authentication.name\")\n@PostFilter(\"filterObject.tenantId == authentication.principal.tenantId\")\n\n// PostFilter loads everything first — filter in the QUERY for large results." },
  { h: "Token storage", t: "table", rows: [
    ["Where", "XSS", "CSRF", "Verdict"],
    ["<code>localStorage</code>", "<b>High</b>", "None", "How tokens get stolen"],
    ["JS memory", "Medium", "None", "Good for the short access token"],
    ["httpOnly+Secure+SameSite cookie", "<b>None</b>", "Mitigated", "<b>Best for the refresh token</b>"]
  ]},
  { h: "Defences", t: "table", rows: [
    ["Attack", "Fix"],
    ["SQL injection", "Bound parameters; allowlist for dynamic identifiers"],
    ["XSS", "Context-aware output encoding + CSP"],
    ["CSRF", "Synchroniser token; <code>SameSite</code>. Disabling CSRF is only safe with bearer tokens."],
    ["Clickjacking", "<code>X-Frame-Options: DENY</code>, <code>frame-ancestors 'none'</code>"],
    ["JWT forgery", "Verify signature, <b>check <code>alg</code></b>, validate exp/iss/aud"]
  ]},
  { h: "Say this", t: "quote", text: "JWTs trade revocability for statelessness. Keep access tokens to 5–15 minutes, rotate refresh tokens with reuse detection, and if you need instant logout ask whether a session would have been simpler." }
]);

registerSheet("jpa-hibernate", [
  { h: "Entity states", t: "table", rows: [
    ["State", "In persistence context?", "In DB?"],
    ["Transient", "No", "No"],
    ["<b>Managed</b>", "Yes — changes auto-flush", "Yes"],
    ["Detached", "No", "Yes"],
    ["Removed", "Yes, marked for delete", "Until flush"]
  ]},
  { h: "Fixing N+1", t: "table", rows: [
    ["Fix", "Queries", "Trade-off"],
    ["<code>JOIN FETCH</code>", "1", "Breaks pagination (<code>HHH000104</code>)"],
    ["<code>@EntityGraph</code>", "1", "Same, but declarative"],
    ["<b><code>@BatchSize(50)</code></b>", "1 + N/50", "<b>Works with pagination</b>"],
    ["<code>@Fetch(SUBSELECT)</code>", "2", "Re-runs the parent query"],
    ["DTO projection", "1", "Fastest — no entities at all"]
  ]},
  { h: "The one setting to change", t: "code", lang: "properties", code:
"spring.jpa.open-in-view=false\nspring.jpa.properties.hibernate.default_batch_fetch_size=50\nspring.jpa.properties.hibernate.generate_statistics=true   # dev\nlogging.level.org.hibernate.SQL=DEBUG                      # dev\n\n# default_batch_fetch_size alone fixes most N+1 in an existing codebase\n# with no code change at all." },
  { h: "Locking", t: "table", rows: [
    ["", "Optimistic (<code>@Version</code>)", "Pessimistic (<code>FOR UPDATE</code>)"],
    ["Locks", "None", "Database row lock"],
    ["Conflict", "Detected at commit → retry", "Prevented — others block"],
    ["Deadlock risk", "None", "Yes"],
    ["Long user session", "<b>Works</b>", "No"],
    ["Best for", "Most web apps", "Real contention: stock, seats"]
  ]},
  { h: "Cascade & fetch defaults", t: "table", rows: [
    ["Relation", "Default fetch"],
    ["<code>@OneToOne</code>", "EAGER"],
    ["<code>@ManyToOne</code>", "<b>EAGER</b> — usually wrong, set LAZY"],
    ["<code>@OneToMany</code>", "LAZY"],
    ["<code>@ManyToMany</code>", "LAZY"]
  ]},
  { h: "Say this", t: "quote", text: "Everything is LAZY and each query declares what it needs. Eager fetching moves the decision from the use case to the mapping, which is exactly the wrong place." }
]);
