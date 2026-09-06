appendTopic("spring-security", [
{
  q: "How do you implement API key authentication for machine clients?",
  level: "advanced", tags: ["authentication", "api"],
  a: `<pre><code>@Component
@RequiredArgsConstructor
public class ApiKeyFilter extends OncePerRequestFilter {

    private final ApiKeyRepository repository;

    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ... {
        String presented = req.getHeader("X-Api-Key");
        if (presented != null) {
            // Look up by a HASH — a database leak must not yield usable keys
            repository.findActiveByHash(sha256(presented))
                .filter(k -&gt; k.expiresAt() == null || k.expiresAt().isAfter(Instant.now()))
                .ifPresent(key -&gt; {
                    var auth = new ApiKeyAuthenticationToken(
                            key.clientId(), authoritiesFor(key.scopes()));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    repository.touchLastUsed(key.id());        // async — do not block
                });
        }
        chain.doFilter(req, res);
    }
}</code></pre>
<pre><code>// Issuing a key: show it ONCE, store only the hash
public IssuedKey create(String clientId, Set&lt;String&gt; scopes) {
    String raw = "ak_" + Base64.getUrlEncoder().withoutPadding()
                              .encodeToString(secureRandomBytes(32));
    repository.save(new ApiKey(sha256(raw), clientId, scopes,
                               Instant.now().plus(Duration.ofDays(365))));
    return new IssuedKey(raw);          // the ONLY time the plaintext exists
}</code></pre>
<p><strong>Design points that matter:</strong></p>
<ul>
<li><strong>Store a hash, never the key.</strong> Same reasoning as passwords — though a fast hash (SHA-256) is acceptable here because the key is high-entropy random, unlike a human-chosen password.</li>
<li><strong>Prefix keys</strong> (<code>ak_live_</code>, <code>ak_test_</code>) so they are identifiable in logs and by secret scanners — GitHub can detect and alert on a leaked key if the format is registered.</li>
<li><strong>Scopes, not all-or-nothing</strong> — a key for reading orders should not be able to issue refunds.</li>
<li><strong>Expiry and rotation</strong> — support two active keys per client so rotation needs no downtime.</li>
<li><strong>Rate limit per key</strong>, and record last-used so dormant keys can be revoked.</li>
</ul>
<p><strong>When to use API keys versus OAuth2:</strong> API keys are simple and appropriate for low-risk server-to-server integrations and partner APIs. For anything acting on a <em>user's</em> behalf, or where you need short-lived credentials and fine-grained consent, OAuth2 client credentials or mTLS is the better answer. Say that — reaching for API keys everywhere is a common weakness.</p>`
},
{
  q: "How do you handle security in a reactive (WebFlux) application?",
  level: "advanced", tags: ["webflux", "internals"],
  a: `<pre><code>@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity                  // note: REACTIVE variant
public class SecurityConfig {

    @Bean
    SecurityWebFilterChain chain(ServerHttpSecurity http) {     // ServerHttpSecurity, not HttpSecurity
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(ex -&gt; ex                          // authorizeExchange, not authorizeHttpRequests
                .pathMatchers("/api/public/**").permitAll()
                .pathMatchers("/api/admin/**").hasRole("ADMIN")
                .anyExchange().authenticated())
            .oauth2ResourceServer(o -&gt; o.jwt(Customizer.withDefaults()))
            .build();
    }
}

// Accessing the principal — NOT from a ThreadLocal
@GetMapping("/me")
public Mono&lt;UserDto&gt; me() {
    return ReactiveSecurityContextHolder.getContext()
            .map(SecurityContext::getAuthentication)
            .map(Authentication::getName)
            .flatMap(userService::findByUsername);
}

// Or injected directly
@GetMapping("/orders")
public Flux&lt;Order&gt; orders(@AuthenticationPrincipal Mono&lt;Jwt&gt; principal) { ... }</code></pre>
<p><strong>The fundamental difference:</strong> the servlet stack stores the <code>SecurityContext</code> in a <strong>ThreadLocal</strong>, which works because one thread handles one request start to finish. In WebFlux there is no thread affinity — a request hops between event-loop threads — so the context lives in the <strong>Reactor Context</strong>, propagated along the reactive chain rather than attached to a thread.</p>
<p><strong>The practical consequences:</strong></p>
<ul>
<li><code>SecurityContextHolder.getContext()</code> returns <strong>nothing</strong> in WebFlux. Every access must go through <code>ReactiveSecurityContextHolder</code> or an injected parameter.</li>
<li>Any code you call must stay in the reactive chain — dropping to a blocking call loses the context <em>and</em> blocks an event-loop thread.</li>
<li>MDC-based logging of the user does not work the same way; you need a context-propagation hook (<code>Hooks.enableAutomaticContextPropagation()</code> in Reactor 3.5+).</li>
<li>Method security uses <code>@EnableReactiveMethodSecurity</code>, and annotated methods must return <code>Mono</code> or <code>Flux</code>.</li>
</ul>
<p>Worth adding: with <strong>virtual threads</strong> in Java 21, much of this complexity disappears because ThreadLocals work again on the servlet stack — which is a genuine argument for reconsidering WebFlux for services that adopted it purely for scalability.</p>`
},
{
  q: "What is the OAuth2 authorization code flow with PKCE, step by step?",
  level: "advanced", hot: true, tags: ["oauth2"],
  a: `<pre><code>1. Client generates a random code_verifier and its challenge
   code_verifier  = random 43-128 chars
   code_challenge = BASE64URL(SHA256(code_verifier))

2. Browser redirect to the authorization server
   GET https://auth.acme.com/authorize
       ?response_type=code
       &amp;client_id=web-app
       &amp;redirect_uri=https://app.acme.com/callback
       &amp;scope=openid profile orders:read
       &amp;state=xyz123                        // CSRF protection — verify on return
       &amp;code_challenge=E9Melhoa...
       &amp;code_challenge_method=S256

3. User authenticates and consents (the client NEVER sees the password)

4. Redirect back with a short-lived, single-use code
   https://app.acme.com/callback?code=SplxlOB&amp;state=xyz123
   -&gt; client MUST verify state matches what it sent

5. Back-channel token exchange (server to server, not via the browser)
   POST https://auth.acme.com/token
       grant_type=authorization_code
       &amp;code=SplxlOB
       &amp;redirect_uri=https://app.acme.com/callback
       &amp;client_id=web-app
       &amp;code_verifier=dBjftJeZ...            // the ORIGINAL, unhashed value

6. Auth server verifies SHA256(code_verifier) == the stored code_challenge
   -&gt; { access_token, refresh_token, id_token, expires_in }</code></pre>
<p><strong>What each protection actually prevents:</strong></p>
<ul>
<li><strong>The authorization code round trip</strong> keeps the token off the browser's address bar and out of browser history and referrer headers — which is why the implicit flow was deprecated.</li>
<li><strong><code>state</code></strong> prevents CSRF: an attacker cannot inject their own authorization code into your session, because the state will not match.</li>
<li><strong>PKCE</strong> prevents <em>code interception</em>. If an attacker steals the code from the redirect (a malicious app registered for the same URI scheme, or a compromised network), they still cannot exchange it — they do not have the <code>code_verifier</code>, and only its hash was ever transmitted.</li>
</ul>
<p><strong>The current guidance to state:</strong> PKCE was originally for mobile apps but is now recommended for <strong>all</strong> clients including confidential server-side ones, and OAuth 2.1 makes it mandatory. The implicit and password grants are deprecated. Mentioning that shows you are current rather than describing a 2016 diagram.</p>`
},
{
  q: "How do you secure secrets and configuration in a Spring Boot application?",
  level: "advanced", tags: ["configuration", "production"],
  a: `<pre><code># ✘ Never in the repository
spring.datasource.password: MyPassword123

# ✔ Reference an environment variable, injected from a secret store
spring.datasource.password: \${DB_PASSWORD}
# fail fast if it is missing, rather than starting with an empty password
spring.datasource.password: \${DB_PASSWORD:?DB_PASSWORD must be set}</code></pre>
<pre><code>// Vault integration — dynamic, short-lived database credentials
spring:
  cloud.vault:
    uri: https://vault.acme.com
    authentication: KUBERNETES              // the pod's service account, no stored token
    database:
      enabled: true
      role: orders-service                  // Vault MINTS a credential valid for 1 hour
// Spring Cloud Vault rotates it automatically before expiry.</code></pre>
<p><strong>The layers, from weakest to strongest:</strong></p>
<ol>
<li><strong>Environment variables</strong> — the twelve-factor baseline. Better than a file in the repo, but visible in <code>/proc</code>, crash dumps and child processes.</li>
<li><strong>Kubernetes Secrets mounted as files</strong> — better than env vars, and only base64-encoded, so it needs etcd encryption at rest plus tight RBAC to mean anything.</li>
<li><strong>External secret manager</strong> (Vault, AWS Secrets Manager) synced in — centralised audit, rotation and access control.</li>
<li><strong>Dynamic short-lived credentials</strong> — the strongest: nothing long-lived exists to leak, and rotation is automatic rather than a quarterly ticket nobody does.</li>
</ol>
<p><strong>Application-level practices that matter regardless:</strong></p>
<ul>
<li><strong>Secure the Actuator.</strong> <code>/actuator/env</code> and <code>/configprops</code> will happily print your credentials; put management on a separate port and require authentication. Spring masks known-sensitive keys, but only ones matching its patterns.</li>
<li><strong>Fail fast on missing configuration</strong> — <code>@ConfigurationProperties</code> with <code>@Validated</code>, so a misconfiguration stops the deployment rather than surfacing at 3am.</li>
<li><strong>Never log configuration objects</strong>, and be careful with Lombok's <code>@ToString</code> on a properties class.</li>
<li><strong>Scan for committed secrets</strong> (gitleaks) in a pre-commit hook <em>and</em> in CI — and remember that a secret committed once must be <strong>rotated</strong>, not just deleted, because it is in the git history forever.</li>
</ul>`
}
]);
