appendTopic("spring-security", [
{
  q: "How do you implement refresh tokens with rotation?",
  level: "advanced", hot: true, tags: ["jwt", "tokens"],
  a: `<p>A short-lived access token limits the damage of a leak; a long-lived refresh token keeps users logged in. <strong>Rotation</strong> makes theft detectable.</p>
<pre><code>@Service
public class TokenService {

    public TokenPair login(String username, String password) {
        var user = authenticate(username, password);
        return issue(user, UUID.randomUUID());          // new token family
    }

    @Transactional
    public TokenPair refresh(String presentedToken) {
        var stored = refreshRepo.findByHash(sha256(presentedToken))   // store the HASH only
                .orElseThrow(() -&gt; new InvalidTokenException());

        if (stored.revoked()) {
            // A revoked token was replayed -> it was stolen. Kill the whole family.
            refreshRepo.revokeFamily(stored.familyId());
            log.warn("refresh token reuse detected for user {}", stored.userId());
            throw new TokenTheftException();
        }
        if (stored.expiresAt().isBefore(Instant.now())) throw new InvalidTokenException();

        stored.revoke();                                 // one-time use
        return issue(stored.user(), stored.familyId());  // new pair, same family
    }

    private TokenPair issue(User u, UUID family) {
        String access  = jwt.sign(u, Duration.ofMinutes(15));
        String refresh = secureRandom();                  // opaque, NOT a JWT
        refreshRepo.save(new RefreshToken(sha256(refresh), u.id(), family,
                                          Instant.now().plus(Duration.ofDays(7))));
        return new TokenPair(access, refresh);
    }
}</code></pre>
<p><strong>The reuse-detection idea is the core of the answer:</strong> because each refresh token is single-use, seeing an already-used one means either the legitimate client replayed it or an attacker stole it. You cannot tell which, so you revoke the entire family and force re-authentication — the safe choice.</p>
<p><strong>Other details worth stating:</strong> store only a hash of the refresh token, so a database leak is not immediately usable; make refresh tokens opaque random strings rather than JWTs (there is no benefit to self-contained here, and you need server state anyway); send them in an <code>HttpOnly; Secure; SameSite=Strict</code> cookie scoped to the refresh endpoint; and handle concurrent refreshes from a client (a short grace window, or a single-flight lock) so parallel tabs do not trigger false theft alarms.</p>`
},
{
  q: "What is the difference between authentication providers, UserDetailsService and AuthenticationManager?",
  level: "advanced", tags: ["internals"],
  a: `<p>The chain of responsibility from credentials to an authenticated principal:</p>
<pre><code>Filter (e.g. UsernamePasswordAuthenticationFilter)
   -&gt; builds an unauthenticated Authentication token
   -&gt; AuthenticationManager (usually ProviderManager)
        -&gt; loops over AuthenticationProviders, asking supports(tokenClass)
             -&gt; DaoAuthenticationProvider
                  -&gt; UserDetailsService.loadUserByUsername()
                  -&gt; PasswordEncoder.matches()
   -&gt; returns an authenticated Authentication
   -&gt; SecurityContextHolder.getContext().setAuthentication(...)</code></pre>
<pre><code>@Service
public class JpaUserDetailsService implements UserDetailsService {
    public UserDetails loadUserByUsername(String username) {
        User u = repo.findByUsernameWithRoles(username)     // fetch join — avoid N+1
                .orElseThrow(() -&gt; new UsernameNotFoundException(username));
        return org.springframework.security.core.userdetails.User
                .withUsername(u.getUsername())
                .password(u.getPasswordHash())
                .authorities(authoritiesOf(u))
                .accountLocked(u.isLocked())
                .disabled(!u.isEnabled())
                .build();
    }
}

// A custom provider for a non-password mechanism (API key, LDAP, OTP)
@Component
public class ApiKeyAuthenticationProvider implements AuthenticationProvider {
    public Authentication authenticate(Authentication a) {
        var key = (String) a.getCredentials();
        return apiKeyRepo.findActive(sha256(key))
                .map(k -&gt; new ApiKeyAuthenticationToken(k.clientId(), k.authorities()))
                .orElseThrow(() -&gt; new BadCredentialsException("invalid API key"));
    }
    public boolean supports(Class&lt;?&gt; type) { return ApiKeyAuthenticationToken.class.isAssignableFrom(type); }
}</code></pre>
<p><strong>The security detail interviewers look for:</strong> <code>UsernameNotFoundException</code> is deliberately converted to <code>BadCredentialsException</code> so the response cannot distinguish "no such user" from "wrong password" — otherwise the login endpoint becomes a user enumeration oracle. For the same reason, still run the password encoder when the user does not exist, or the timing difference leaks the same information.</p>`
},
{
  q: "How do you prevent common attacks — brute force, session fixation, clickjacking?",
  level: "advanced", hot: true, tags: ["security", "production"],
  a: `<pre><code>@Bean
SecurityFilterChain chain(HttpSecurity http) throws Exception {
    return http
        .headers(h -&gt; h
            .frameOptions(f -&gt; f.deny())                       // clickjacking
            .contentSecurityPolicy(c -&gt; c.policyDirectives(
                "default-src 'self'; frame-ancestors 'none'; object-src 'none'"))
            .httpStrictTransportSecurity(s -&gt; s
                .includeSubDomains(true).maxAgeInSeconds(31536000))
            .referrerPolicy(r -&gt; r.policy(SAME_ORIGIN)))
        .sessionManagement(s -&gt; s
            .sessionFixation(SessionFixationConfigurer::newSession)   // rotate ID on login
            .maximumSessions(1).maxSessionsPreventsLogin(false))
        .build();
}</code></pre>
<table>
<tr><th>Attack</th><th>Defence</th></tr>
<tr><td><strong>Brute force / credential stuffing</strong></td><td>Rate limit per IP <em>and</em> per account, exponential lockout after N failures, CAPTCHA after a threshold, MFA, and check passwords against the Have I Been Pwned list</td></tr>
<tr><td><strong>Session fixation</strong></td><td>Rotate the session ID on authentication — Spring Security does this by default; do not disable it</td></tr>
<tr><td><strong>Clickjacking</strong></td><td><code>X-Frame-Options: DENY</code> plus CSP <code>frame-ancestors 'none'</code></td></tr>
<tr><td><strong>User enumeration</strong></td><td>Identical response and timing for unknown user vs wrong password; same for password reset ("if that address exists we sent a link")</td></tr>
<tr><td><strong>Timing attacks</strong></td><td>Constant-time comparison (<code>MessageDigest.isEqual</code>) for tokens and signatures — never <code>String.equals</code></td></tr>
<tr><td><strong>Open redirect</strong></td><td>Validate <code>returnUrl</code> against an allowlist; never redirect to arbitrary user input</td></tr>
<tr><td><strong>Insecure cookies</strong></td><td><code>HttpOnly; Secure; SameSite=Strict</code></td></tr>
</table>
<p><strong>Account lockout has a trade-off worth voicing:</strong> a naive "lock after 5 failures" turns into a denial-of-service against your own users, since an attacker can lock any account by guessing wrong. Prefer progressive delays, per-IP throttling and risk-based challenges over hard locks, and always log authentication failures with enough context to detect a distributed attempt.</p>`
},
{
  q: "How does Spring Security handle password encoding and migration between algorithms?",
  level: "advanced", tags: ["passwords"],
  a: `<pre><code>@Bean
PasswordEncoder passwordEncoder() {
    // DelegatingPasswordEncoder — stores the algorithm as a prefix in the hash
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}
// Stored value looks like:  {bcrypt}$2a$10$N9qo8uLOickgx2ZMRZoMy...
//                           {argon2}$argon2id$v=19$m=16384,t=2,p=1$...</code></pre>
<p><strong>Why the prefix matters:</strong> it lets one application verify hashes created by <em>different</em> algorithms simultaneously. That is what makes a migration possible without forcing every user to reset their password.</p>
<pre><code>@Bean
PasswordEncoder passwordEncoder() {
    String idForEncode = "argon2";                    // new passwords use Argon2
    Map&lt;String, PasswordEncoder&gt; encoders = Map.of(
        "argon2", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8(),
        "bcrypt", new BCryptPasswordEncoder(12),      // legacy hashes still verify
        "noop",   NoOpPasswordEncoder.getInstance()); // NEVER in production
    return new DelegatingPasswordEncoder(idForEncode, encoders);
}

// Upgrade on successful login — the standard migration technique
@EventListener
public void onLogin(AuthenticationSuccessEvent e) {
    var user = repo.findByUsername(e.getAuthentication().getName()).orElseThrow();
    if (user.getPasswordHash().startsWith("{bcrypt}")) {
        String raw = extractRawPassword(e);            // available only at this moment
        user.setPasswordHash(encoder.encode(raw));     // re-hash with the new algorithm
        repo.save(user);
    }
}</code></pre>
<p><strong>Spring Security also supports this natively</strong> via <code>UserDetailsPasswordService</code>, which is called automatically after a successful authentication when <code>encoder.upgradeEncoding(hash)</code> returns true — a cleaner hook than an event listener.</p>
<p><strong>Points to close with:</strong> Argon2id is the current OWASP recommendation; bcrypt remains perfectly acceptable with a cost factor around 10–12, tuned so hashing takes roughly 250 ms on your hardware. Never store the raw password anywhere, including logs, and never use <code>NoOpPasswordEncoder</code> outside a test.</p>`
},
{
  q: "What is the difference between authorization at the URL level and method level?",
  level: "advanced", tags: ["authorization", "design"],
  a: `<table>
<tr><th></th><th>URL-based (<code>authorizeHttpRequests</code>)</th><th>Method-based (<code>@PreAuthorize</code>)</th></tr>
<tr><td>Where</td><td>Filter chain, before the controller</td><td>AOP proxy around the bean</td></tr>
<tr><td>Granularity</td><td>Path + HTTP method</td><td>Any method, with arguments and return value</td></tr>
<tr><td>Sees business objects</td><td>No</td><td>Yes — <code>#order.customerId</code></td></tr>
<tr><td>Protects non-web entry points</td><td>No</td><td><strong>Yes</strong> — schedulers, Kafka consumers, other services</td></tr>
<tr><td>Cost</td><td>Cheap — rejects before controller work</td><td>Proxy indirection</td></tr>
</table>
<pre><code>// URL level — coarse gate, cheap, applies to everything on that path
.authorizeHttpRequests(a -&gt; a
    .requestMatchers("/actuator/**").hasRole("OPS")
    .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
    .anyRequest().authenticated())                 // deny by default — LAST

// Method level — fine-grained, ownership-aware
@PreAuthorize("hasAuthority('orders:read') and " +
              "@orderSecurity.isOwner(#orderId, authentication)")
public Order get(Long orderId) { ... }</code></pre>
<p><strong>Use both — defence in depth.</strong> URL rules reject obviously unauthorised traffic before any application code runs; method rules enforce the rules that depend on data, which the filter chain cannot see.</p>
<p><strong>The vulnerability that method security exists to prevent</strong> is broken object-level authorization: <code>GET /api/orders/42</code> passes the URL check because the caller is authenticated, but nothing verifies order 42 <em>belongs</em> to them. This is number one in the OWASP API Security Top 10, and the check must live where the data is — the service layer. Return <strong>404 rather than 403</strong> for another user's resource, so the API does not confirm that the ID exists.</p>`
},
{
  q: "How do you secure service-to-service communication?",
  level: "advanced", hot: true, tags: ["microservices"],
  a: `<p>Four mechanisms, usually layered:</p>
<ol>
<li><strong>OAuth2 client credentials</strong> — each service has its own identity and requests a token from the IdP. Standard, auditable, and works across networks.
<pre><code>spring.security.oauth2.client:
  registration.billing:
    client-id: billing-service
    client-secret: \${BILLING_SECRET}
    authorization-grant-type: client_credentials
    scope: orders:read
  provider.keycloak.token-uri: https://keycloak/realms/acme/protocol/openid-connect/token

@Bean WebClient billingClient(OAuth2AuthorizedClientManager manager) {
    var oauth = new ServletOAuth2AuthorizedClientExchangeFilterFunction(manager);
    oauth.setDefaultClientRegistrationId("billing");
    return WebClient.builder().apply(oauth.oauth2Configuration()).build();
}</code></pre></li>
<li><strong>Mutual TLS (mTLS)</strong> — both sides present certificates, so identity is established at the transport layer. A service mesh (Istio, Linkerd) can do this transparently with automatic certificate rotation, which is why it is the common choice inside a cluster.</li>
<li><strong>Token propagation</strong> — when acting <em>on behalf of a user</em>, forward the user's token (or exchange it) so downstream services can apply user-level authorization and the audit trail stays intact.</li>
<li><strong>Network policy</strong> — Kubernetes <code>NetworkPolicy</code> so only the services that should talk to each other can even open a connection.</li>
</ol>
<p><strong>The principle to state:</strong> <strong>zero trust</strong> — the network is not a security boundary. Every service verifies the caller's identity independently rather than assuming "it came from inside the cluster, so it is fine". Otherwise one compromised pod can reach everything.</p>
<p><strong>Practical details:</strong> cache tokens until shortly before expiry rather than fetching per request; propagate the trace and tenant context alongside; and never put a long-lived static shared secret in an environment variable across many services — that is the pattern that turns one leak into total compromise.</p>`
},
{
  q: "What are the security considerations for a REST API's error responses and logging?",
  level: "advanced", tags: ["security", "production"],
  a: `<p><strong>Error responses leak more than people realise:</strong></p>
<pre><code>// ✘ Leaks the stack trace, framework versions, SQL, file paths, internal hostnames
{ "error": "org.postgresql.util.PSQLException: ERROR: relation \\"users\\" does not exist
            at /opt/app/OrderRepository.java:142" }

// ✔ Opaque to the client, traceable for you
{ "type": "https://api.acme.com/errors/internal",
  "title": "Internal error",
  "status": 500,
  "detail": "An unexpected error occurred.",
  "traceId": "b7d3f1a9c2e" }</code></pre>
<pre><code>@ExceptionHandler(Exception.class)
ProblemDetail unexpected(Exception ex) {
    String traceId = MDC.get("traceId");
    log.error("Unhandled error traceId={}", traceId, ex);      // FULL detail server-side
    var pd = ProblemDetail.forStatusAndDetail(INTERNAL_SERVER_ERROR,
             "An unexpected error occurred.");
    pd.setProperty("traceId", traceId);                         // correlation for support
    return pd;
}</code></pre>
<p><strong>Also disable in production:</strong> <code>server.error.include-stacktrace=never</code>, <code>include-message=never</code>, and secure or disable <code>/actuator/env</code>, <code>/configprops</code>, <code>/heapdump</code> and <code>/threaddump</code> — <code>/env</code> alone will happily print your database password.</p>
<p><strong>Logging rules:</strong></p>
<ul>
<li><strong>Never log</strong> passwords, tokens, API keys, full card numbers, OTPs, session IDs, or full request bodies on auth endpoints.</li>
<li>Beware <code>toString()</code> on entities and DTOs — Lombok's <code>@Data</code> will print every field, including the password hash.</li>
<li><strong>Do log</strong> security events: authentication success and failure, access denied, privilege changes, token issuance and revocation — with user, IP and correlation ID.</li>
<li><strong>Mask consistently</strong> at the logging layer (a Logback converter or masking pattern) rather than relying on every developer remembering.</li>
<li>Consider log <strong>injection</strong> — user input containing newlines can forge log entries. Encode or strip control characters.</li>
</ul>
<p>And remember GDPR: logs containing personal data are subject to retention limits and deletion requests, which is another reason to log identifiers rather than payloads.</p>`
}
]);
