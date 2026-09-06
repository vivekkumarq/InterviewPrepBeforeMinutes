appendTopic("design-patterns", [
{
  q: "Design a URL shortener class structure (LLD)",
  level: "advanced", tags: ["lld", "design-question"],
  a: `<pre><code>// Strategy — the encoding scheme is the part most likely to change
public interface ShortCodeGenerator {
    String generate(String longUrl);
}

@Component
class Base62CounterGenerator implements ShortCodeGenerator {
    private final IdRangeAllocator allocator;          // claims blocks of 10,000 ids

    public String generate(String longUrl) {
        return Base62.encode(allocator.next());        // no collisions, no coordination per call
    }
}

@Component
class HashGenerator implements ShortCodeGenerator {
    public String generate(String longUrl) {
        String hash = Base62.encode(murmur3(longUrl));
        return hash.substring(0, 7);                   // collisions possible -> caller retries
    }
}

// The service: composition of small, replaceable pieces
@Service
@RequiredArgsConstructor
public class UrlShortenerService {
    private final ShortCodeGenerator generator;
    private final UrlRepository repository;
    private final UrlCache cache;                       // decorator over the repository
    private final UrlValidator validator;               // SSRF and malware checks

    public ShortUrl shorten(CreateShortUrlCommand cmd) {
        validator.validate(cmd.longUrl());              // reject internal IPs, bad schemes

        if (cmd.alias() != null) {
            return repository.saveIfAbsent(cmd.alias(), cmd.longUrl())
                    .orElseThrow(() -&gt; new AliasTakenException(cmd.alias()));
        }
        for (int attempt = 0; attempt &lt; 3; attempt++) { // retry on collision
            var code = generator.generate(cmd.longUrl());
            var saved = repository.saveIfAbsent(code, cmd.longUrl());
            if (saved.isPresent()) return saved.get();
        }
        throw new CodeGenerationException();
    }

    public Optional&lt;String&gt; resolve(String code) {
        return cache.get(code, () -&gt; repository.findLongUrl(code));   // read-through
    }
}</code></pre>
<p><strong>Design points to talk through:</strong> the generator is a <strong>Strategy</strong> because the encoding scheme is exactly what changes (counter-based, hash-based, custom alias); <code>saveIfAbsent</code> maps to an atomic <code>INSERT ... ON CONFLICT DO NOTHING</code> so two concurrent requests cannot claim the same code; the cache is a <strong>Decorator</strong> so caching can be added or removed without touching the service; and the validator exists because a URL shortener is an open redirect and an SSRF vector if you skip it.</p>
<p><strong>The follow-up to anticipate:</strong> "what about analytics?" — record clicks asynchronously via an event, never on the redirect's critical path, because the redirect must stay fast and must not fail if the analytics store is down.</p>`
},
{
  q: "What is the Circuit Breaker pattern implemented from scratch?",
  level: "advanced", tags: ["lld", "resilience"],
  a: `<pre><code>public class CircuitBreaker {
    private enum State { CLOSED, OPEN, HALF_OPEN }

    private final int failureThreshold;
    private final Duration openDuration;
    private final int halfOpenTrialCalls;
    private final Clock clock;                       // injected — testable

    private final AtomicReference&lt;State&gt; state = new AtomicReference&lt;&gt;(State.CLOSED);
    private final AtomicInteger failures = new AtomicInteger();
    private final AtomicInteger trialSuccesses = new AtomicInteger();
    private volatile Instant openedAt;

    public &lt;T&gt; T execute(Supplier&lt;T&gt; call, Supplier&lt;T&gt; fallback) {
        if (!allowRequest()) return fallback.get();   // fail fast, do not touch the dependency
        try {
            T result = call.get();
            onSuccess();
            return result;
        } catch (RuntimeException e) {
            onFailure();
            throw e;
        }
    }

    private boolean allowRequest() {
        if (state.get() == State.CLOSED) return true;
        if (state.get() == State.OPEN) {
            if (Instant.now(clock).isAfter(openedAt.plus(openDuration))) {
                state.compareAndSet(State.OPEN, State.HALF_OPEN);   // time to probe
                trialSuccesses.set(0);
                return true;
            }
            return false;
        }
        return true;                                  // HALF_OPEN: let trial calls through
    }

    private void onSuccess() {
        if (state.get() == State.HALF_OPEN) {
            if (trialSuccesses.incrementAndGet() &gt;= halfOpenTrialCalls) {
                state.set(State.CLOSED);              // recovered
                failures.set(0);
            }
        } else {
            failures.set(0);
        }
    }

    private void onFailure() {
        if (state.get() == State.HALF_OPEN || failures.incrementAndGet() &gt;= failureThreshold) {
            state.set(State.OPEN);                    // one failure in HALF_OPEN reopens it
            openedAt = Instant.now(clock);
        }
    }
}</code></pre>
<p><strong>The design decisions worth explaining:</strong> the <code>HALF_OPEN</code> state exists so recovery is probed with a <em>few</em> calls rather than the full load — reopening immediately on a single failure prevents a struggling service from being hammered again. The clock is injected so the time-based transition is testable without sleeping. And atomics rather than a lock keep the happy path (CLOSED) essentially free, which matters because this wraps every call.</p>
<p><strong>What a production implementation adds:</strong> a sliding window of the last N calls rather than a raw counter (so old failures age out), counting <em>slow</em> calls as failures, per-state metrics, and event listeners for observability. Which is exactly why you would use <strong>Resilience4j</strong> rather than this — but being able to write it demonstrates you understand what it is doing.</p>`
},
{
  q: "What is the Object Pool pattern and is it still relevant in Java?",
  level: "advanced", tags: ["patterns", "performance"],
  a: `<p>Object pooling reuses expensive-to-create objects instead of allocating new ones. It was once general performance advice; in modern Java it is justified only in specific cases.</p>
<pre><code>// Where pooling is genuinely correct: the object wraps a scarce EXTERNAL resource
HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(10);          // database connections are expensive and LIMITED
config.setMinimumIdle(10);
config.setConnectionTimeout(3000);
config.setMaxLifetime(1_800_000);       // recycle before the DB or a proxy closes them
config.setLeakDetectionThreshold(60_000);</code></pre>
<table>
<tr><th>Pool this</th><th>Do NOT pool this</th></tr>
<tr><td>Database connections</td><td>Ordinary domain objects (DTOs, entities)</td></tr>
<tr><td>HTTP client connections</td><td>Short-lived value objects</td></tr>
<tr><td>Threads</td><td>Strings, collections</td></tr>
<tr><td>Large direct ByteBuffers</td><td>Anything cheap to construct</td></tr>
</table>
<p><strong>Why pooling ordinary objects is now counter-productive:</strong> allocation in the JVM is a pointer bump in a thread-local buffer — a few nanoseconds, with no locking. The generational collector's cost is proportional to <em>surviving</em> objects, so short-lived garbage is nearly free to collect. A pool, by contrast, keeps objects alive long enough to be <strong>promoted to the old generation</strong>, where collecting them is far more expensive — so pooling can make GC <em>worse</em>. It also adds synchronisation, and reused objects carry stale state, which is a genuine bug source.</p>
<p><strong>The rule to state:</strong> pool things that are expensive because of something <em>outside</em> the JVM — a TCP connection, an OS thread, a file handle, native memory. Do not pool things that are merely allocations.</p>
<p><strong>The related trap:</strong> a pooled resource must be reset before reuse and always returned in a <code>finally</code> block. Connection pool exhaustion caused by a leaked connection on an exception path is one of the most common production incidents in Java services — which is why Hikari's <code>leakDetectionThreshold</code> is worth enabling.</p>`
},
{
  q: "Design an audit logging system (LLD)",
  level: "advanced", tags: ["lld", "design-question"],
  a: `<pre><code>// 1. The annotation — declarative, so business code stays clean
@Target(METHOD) @Retention(RUNTIME)
public @interface Audited {
    String action();
    Class&lt;?&gt; entity() default Void.class;
    boolean captureArgs() default true;
}

// 2. The aspect — cross-cutting, one implementation for the whole application
@Aspect @Component @RequiredArgsConstructor
public class AuditAspect {
    private final AuditPublisher publisher;
    private final Clock clock;

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        var event = AuditEvent.builder()
                .action(audited.action())
                .actor(currentPrincipal())                   // from SecurityContext
                .tenantId(TenantContext.current())
                .traceId(MDC.get("traceId"))                 // correlate with logs
                .occurredAt(Instant.now(clock))
                .arguments(audited.captureArgs() ? redact(pjp.getArgs()) : null);
        try {
            Object result = pjp.proceed();
            publisher.publish(event.outcome(SUCCESS).build());
            return result;
        } catch (Throwable t) {
            publisher.publish(event.outcome(FAILURE).error(t.getMessage()).build());
            throw t;                                          // NEVER swallow
        }
    }
}

// 3. Publishing — transactional outbox so the audit cannot be lost or orphaned
@Component
class OutboxAuditPublisher implements AuditPublisher {
    @Override public void publish(AuditEvent e) {
        outboxRepository.save(new OutboxRecord("audit", toJson(e)));   // same transaction
    }
}</code></pre>
<p><strong>The design decisions worth defending:</strong></p>
<ul>
<li><strong>An aspect, not calls scattered through services</strong> — auditing is the textbook cross-cutting concern, and a developer cannot forget to add it if the annotation is on the method.</li>
<li><strong>Audit failures must never break the business operation</strong> — but nor should they be silently dropped. Writing to an outbox in the same transaction gives you both: atomic with the change, delivered asynchronously.</li>
<li><strong>Redact before storing</strong> — arguments will contain passwords, tokens and PII. A central redaction step is far safer than trusting each call site.</li>
<li><strong>Capture failures too.</strong> A failed privilege escalation attempt is more interesting to a security team than a successful read.</li>
<li><strong>Append-only storage.</strong> An audit log that can be updated or deleted is not evidence — restrict permissions accordingly.</li>
</ul>
<p><strong>The limitation to state:</strong> because this is proxy-based AOP, self-invocation and private methods are not audited. For guaranteed data-level auditing, Hibernate Envers or database triggers catch every change regardless of the code path — worth combining for regulated domains.</p>`
}
]);
