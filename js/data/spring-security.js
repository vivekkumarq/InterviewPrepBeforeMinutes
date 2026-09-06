registerTopic("spring-security", [
{
  q: "What is the difference between authentication and authorization?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<ul>
<li><strong>Authentication (AuthN)</strong> — <em>who are you?</em> Verifying identity with credentials: password, token, certificate, biometric. Failure → <strong>401 Unauthorized</strong> (a misnomer; it really means unauthenticated).</li>
<li><strong>Authorization (AuthZ)</strong> — <em>what are you allowed to do?</em> Checking permissions for an authenticated principal. Failure → <strong>403 Forbidden</strong>.</li>
</ul>
<p>In Spring Security, authentication produces an <code>Authentication</code> object stored in the <code>SecurityContext</code>; authorization is then enforced by <code>AuthorizationManager</code>s at the filter level (URL rules) and by method security annotations.</p>`
},
{
  q: "How does the Spring Security filter chain work?",
  level: "advanced", hot: true, tags: ["filters", "internals"],
  a: `<p>Spring Security is fundamentally <strong>a chain of servlet filters</strong>. A single <code>DelegatingFilterProxy</code> is registered with the servlet container and delegates to <code>FilterChainProxy</code>, which selects the matching <code>SecurityFilterChain</code> and runs its filters in order.</p>
<figure class="fig">
<svg viewBox="0 0 640 170" role="img" aria-label="Spring Security filter chain">
  <rect class="dg-box" x="6" y="60" width="76" height="40" rx="7"/><text class="dg-s" x="44" y="84" text-anchor="middle">Request</text>
  <path class="dg-line" d="M86 80 H112" marker-end="url(#s1)"/>
  <rect class="dg-fill2" x="116" y="52" width="96" height="56" rx="7"/>
  <text class="dg-s" x="164" y="74" text-anchor="middle">CORS +</text><text class="dg-s" x="164" y="90" text-anchor="middle">CSRF filter</text>
  <path class="dg-line" d="M216 80 H242" marker-end="url(#s1)"/>
  <rect class="dg-fill" x="246" y="52" width="112" height="56" rx="7"/>
  <text class="dg-s" x="302" y="74" text-anchor="middle">Authentication</text><text class="dg-s" x="302" y="90" text-anchor="middle">filter (JWT/form)</text>
  <path class="dg-line" d="M362 80 H388" marker-end="url(#s1)"/>
  <rect class="dg-fill" x="392" y="52" width="112" height="56" rx="7"/>
  <text class="dg-s" x="448" y="74" text-anchor="middle">Authorization</text><text class="dg-s" x="448" y="90" text-anchor="middle">filter</text>
  <path class="dg-line" d="M508 80 H534" marker-end="url(#s1)"/>
  <rect class="dg-box" x="538" y="60" width="96" height="40" rx="7"/><text class="dg-s" x="586" y="84" text-anchor="middle">Controller</text>
  <text class="dg-s" x="302" y="132" text-anchor="middle">on success: SecurityContextHolder.setAuthentication(auth)</text>
  <text class="dg-s" x="302" y="150" text-anchor="middle">on failure: ExceptionTranslationFilter → 401 / 403</text>
  <defs><marker id="s1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Every request passes the chain before reaching your controller.</figcaption>
</figure>
<p><strong>Filters in order (the important ones):</strong></p>
<ol>
<li><code>DisableEncodeUrlFilter</code>, <code>WebAsyncManagerIntegrationFilter</code></li>
<li><code>SecurityContextHolderFilter</code> — loads any existing context</li>
<li><code>HeaderWriterFilter</code> — security headers</li>
<li><code>CorsFilter</code>, <code>CsrfFilter</code></li>
<li><code>LogoutFilter</code></li>
<li><strong>Authentication filters</strong> — <code>UsernamePasswordAuthenticationFilter</code>, <code>BearerTokenAuthenticationFilter</code>, or your custom JWT filter</li>
<li><code>AnonymousAuthenticationFilter</code></li>
<li><code>ExceptionTranslationFilter</code> — converts security exceptions into 401/403</li>
<li><code>AuthorizationFilter</code> — the last one; enforces the URL rules</li>
</ol>
<p><strong>Why the order matters:</strong> <code>ExceptionTranslationFilter</code> sits <em>before</em> the authorization filter precisely so it can catch <code>AccessDeniedException</code>. Add a custom filter with <code>addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)</code> — put it in the wrong place and it either never runs or runs before CORS, breaking browsers.</p>`
},
{
  q: "How do you configure Spring Security in a modern Spring Boot 3 application?",
  level: "beginner", hot: true, tags: ["configuration"],
  a: `<pre><code>@Configuration
@EnableWebSecurity
@EnableMethodSecurity            // enables @PreAuthorize etc.
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        return http
            .csrf(csrf -&gt; csrf.disable())                          // stateless API only
            .cors(Customizer.withDefaults())
            .sessionManagement(s -&gt; s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -&gt; auth
                .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/orders/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated())                     // deny-by-default: put LAST
            .exceptionHandling(e -&gt; e
                .authenticationEntryPoint(restAuthEntryPoint)      // 401 JSON, not a login page
                .accessDeniedHandler(restAccessDeniedHandler))     // 403 JSON
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean AuthenticationManager authManager(AuthenticationConfiguration c) throws Exception {
        return c.getAuthenticationManager();
    }
}</code></pre>
<p><strong>Modern-API points to make:</strong> <code>WebSecurityConfigurerAdapter</code> is removed — you now declare a <code>SecurityFilterChain</code> bean. Rules are evaluated <strong>top to bottom, first match wins</strong>, so <code>anyRequest()</code> must be last. And <code>hasRole("ADMIN")</code> automatically expects the authority <code>ROLE_ADMIN</code> — the prefix mismatch is the single most common configuration bug.</p>`
},
{
  q: "How does JWT authentication work? Walk through the flow.",
  level: "advanced", hot: true, tags: ["jwt", "tokens"],
  a: `<figure class="fig">
<svg viewBox="0 0 640 190" role="img" aria-label="JWT authentication flow">
  <rect class="dg-box" x="10" y="14" width="110" height="34" rx="7"/><text class="dg-t" x="65" y="36" text-anchor="middle">Client</text>
  <rect class="dg-box" x="510" y="14" width="118" height="34" rx="7"/><text class="dg-t" x="569" y="36" text-anchor="middle">API server</text>
  <path class="dg-line" d="M65 48 V178 M569 48 V178" stroke-dasharray="3 4"/>
  <path class="dg-line" d="M68 70 H564" marker-end="url(#j1)"/><text class="dg-s" x="316" y="64" text-anchor="middle">1. POST /login  {user, password}</text>
  <path class="dg-line" d="M566 100 H70" marker-end="url(#j1)"/><text class="dg-s" x="316" y="94" text-anchor="middle">2. verify + sign → access token (15m) + refresh (7d)</text>
  <path class="dg-line" d="M68 134 H564" marker-end="url(#j1)"/><text class="dg-s" x="316" y="128" text-anchor="middle">3. GET /orders   Authorization: Bearer &lt;jwt&gt;</text>
  <path class="dg-line" d="M566 166 H70" marker-end="url(#j1)"/><text class="dg-s" x="316" y="160" text-anchor="middle">4. verify signature + exp — no DB lookup — 200 OK</text>
  <defs><marker id="j1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Stateless: the server verifies the signature instead of looking up a session.</figcaption>
</figure>
<p>A JWT is three base64url parts joined by dots: <strong>header</strong> (<code>alg</code>, <code>typ</code>) . <strong>payload</strong> (claims: <code>sub</code>, <code>iat</code>, <code>exp</code>, <code>roles</code>) . <strong>signature</strong>.</p>
<pre><code>@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ... {
        String header = req.getHeader("Authorization");
        if (header != null &amp;&amp; header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parseAndValidate(header.substring(7));
                var auth = new UsernamePasswordAuthenticationToken(
                        claims.getSubject(), null, authoritiesFrom(claims));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (JwtException e) {
                SecurityContextHolder.clearContext();   // let the entry point return 401
            }
        }
        chain.doFilter(req, res);
    }
}</code></pre>
<p><strong>Critical:</strong> the payload is only <em>encoded</em>, not encrypted — anyone can read it, so never put secrets in claims. Extend <code>OncePerRequestFilter</code> so the filter does not run twice on forwards.</p>`
},
{
  q: "What are the security considerations and pitfalls with JWT?",
  level: "advanced", hot: true, tags: ["jwt", "security"],
  a: `<ul>
<li><strong>The <code>alg: none</code> attack.</strong> An attacker sets the algorithm to none and strips the signature. Never trust the header's algorithm — pin the expected one server-side. Modern libraries block this; old ones did not.</li>
<li><strong>HS256 vs RS256 confusion.</strong> If the server accepts either, an attacker can sign a token with the <em>public</em> RSA key treated as an HMAC secret. Pin the algorithm.</li>
<li><strong>Revocation is the fundamental weakness.</strong> A stateless token stays valid until it expires — you cannot log someone out. Mitigations: short access-token lifetimes (5–15 min), a refresh token that <em>is</em> stored and revocable, and a denylist of <code>jti</code> values in Redis for emergency revocation.</li>
<li><strong>Storage in the browser.</strong> <code>localStorage</code> is readable by any XSS. Prefer an <code>HttpOnly; Secure; SameSite=Strict</code> cookie — but then you need CSRF protection again. There is no free option; state the trade-off.</li>
<li><strong>Weak secrets.</strong> HMAC keys must be at least 256 bits of real entropy, from a secret manager, and rotatable (use a <code>kid</code> header so old tokens still verify during rotation).</li>
<li><strong>Always validate <code>exp</code>, <code>iss</code>, and <code>aud</code></strong> — not just the signature.</li>
<li><strong>Refresh token rotation</strong> — issue a new refresh token on each use and invalidate the old one; if an already-used token reappears, that is theft, so revoke the whole family.</li>
<li><strong>Do not put large or sensitive claims in the token</strong> — it travels on every request, and it is readable.</li>
</ul>`
},
{
  q: "Session-based vs token-based authentication",
  level: "beginner", hot: true, tags: ["sessions", "jwt"],
  a: `<table>
<tr><th></th><th>Session (cookie)</th><th>Token (JWT)</th></tr>
<tr><td>State</td><td>Server stores the session</td><td>Stateless — self-contained</td></tr>
<tr><td>Scaling</td><td>Needs sticky sessions or a shared store (Redis)</td><td>Any instance can verify</td></tr>
<tr><td>Revocation</td><td>Immediate — delete the session</td><td>Hard — needs a denylist</td></tr>
<tr><td>Transport</td><td>Cookie, sent automatically</td><td>Authorization header, sent explicitly</td></tr>
<tr><td>CSRF</td><td>Vulnerable — needs CSRF tokens</td><td>Not vulnerable if using headers</td></tr>
<tr><td>XSS</td><td>Mitigated by <code>HttpOnly</code></td><td>Exposed if in <code>localStorage</code></td></tr>
<tr><td>Mobile/third-party clients</td><td>Awkward</td><td>Natural</td></tr>
</table>
<p><strong>Pragmatic guidance:</strong> a server-rendered app for one domain → sessions with Spring Session backed by Redis; they are simpler and revocable. A public API with mobile clients and multiple services → tokens. Many real systems do both: a short JWT for API calls, and a revocable refresh token stored server-side, which recovers most of the session model's control.</p>`
},
{
  q: "How does OAuth2 work and what are the grant types?",
  level: "advanced", hot: true, tags: ["oauth2"],
  a: `<p>OAuth 2.0 is an <strong>authorization delegation</strong> protocol: it lets an application act on a user's behalf without ever seeing their password. (OpenID Connect adds an identity layer — the <code>id_token</code> — on top; OAuth2 alone is not authentication.)</p>
<p><strong>Roles:</strong> Resource Owner (the user), Client (your app), Authorization Server (Keycloak, Auth0, Google), Resource Server (the API).</p>
<table>
<tr><th>Grant</th><th>Use for</th><th>Status</th></tr>
<tr><td><strong>Authorization Code + PKCE</strong></td><td>Web and mobile apps with a user</td><td><strong>The recommended default</strong></td></tr>
<tr><td>Client Credentials</td><td>Machine-to-machine, no user</td><td>Recommended</td></tr>
<tr><td>Refresh Token</td><td>Getting a new access token</td><td>Recommended, with rotation</td></tr>
<tr><td>Implicit</td><td>—</td><td><strong>Deprecated</strong> — token in the URL fragment</td></tr>
<tr><td>Resource Owner Password</td><td>—</td><td><strong>Deprecated</strong> — the client sees the password</td></tr>
</table>
<p><strong>Authorization Code + PKCE flow:</strong> the client redirects the user to the auth server with a hashed <code>code_challenge</code> → the user authenticates → the auth server redirects back with a short-lived <code>code</code> → the client exchanges the code plus the original <code>code_verifier</code> for tokens on the back channel. PKCE prevents an attacker who intercepts the redirect from redeeming the code.</p>
<pre><code>// Resource server — Spring validates the JWT against the issuer's JWK set
spring.security.oauth2.resourceserver.jwt.issuer-uri: https://keycloak/realms/acme

@Bean SecurityFilterChain chain(HttpSecurity http) throws Exception {
    return http.oauth2ResourceServer(o -&gt; o.jwt(j -&gt; j.jwtAuthenticationConverter(converter)))
               .authorizeHttpRequests(a -&gt; a.anyRequest().authenticated())
               .build();
}</code></pre>`
},
{
  q: "How do you integrate Keycloak with Spring Boot?",
  level: "advanced", tags: ["keycloak", "oauth2"],
  a: `<p>Keycloak is an open-source identity and access management server providing OAuth2/OIDC, SSO, user federation (LDAP/AD), social login, and fine-grained roles.</p>
<p>The modern approach uses <strong>Spring Security's standard OAuth2 resource server</strong> — the old Keycloak Spring adapter is deprecated.</p>
<pre><code>spring:
  security.oauth2.resourceserver.jwt:
    issuer-uri: https://keycloak.acme.com/realms/production
    # JWK set URI is discovered automatically from the issuer's /.well-known endpoint</code></pre>
<pre><code>// Keycloak nests roles under realm_access.roles — you must map them yourself
@Bean
JwtAuthenticationConverter jwtAuthConverter() {
    var converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -&gt; {
        Map&lt;String, Object&gt; realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return List.of();
        List&lt;String&gt; roles = (List&lt;String&gt;) realmAccess.get("roles");
        return roles.stream()
                    .map(r -&gt; new SimpleGrantedAuthority("ROLE_" + r))
                    .collect(toList());
    });
    return converter;
}</code></pre>
<p><strong>Key concepts to name:</strong> <em>realm</em> (an isolated tenant of users and clients), <em>client</em> (an application), <em>realm roles vs client roles</em>, <em>composite roles</em>, <em>groups</em>, and <em>protocol mappers</em> (which add custom claims such as tenant ID to the token). For multi-tenant SaaS, a realm per tenant or a tenant claim plus row-level filtering are the two standard designs.</p>`
},
{
  q: "What is CSRF and when do you need protection?",
  level: "advanced", hot: true, tags: ["csrf", "security"],
  a: `<p><strong>Cross-Site Request Forgery:</strong> a malicious site causes the victim's browser to send a state-changing request to your site. Because browsers attach cookies <em>automatically</em>, the request arrives fully authenticated.</p>
<pre><code>&lt;!-- On evil.com, while the user is logged into bank.com --&gt;
&lt;form action="https://bank.com/transfer" method="POST"&gt;
  &lt;input type="hidden" name="to" value="attacker"/&gt;
  &lt;input type="hidden" name="amount" value="10000"/&gt;
&lt;/form&gt;
&lt;script&gt;document.forms[0].submit();&lt;/script&gt;</code></pre>
<p><strong>The defence:</strong> a synchroniser token — a random value the server issues and requires in a header or form field. An attacker's site cannot read it (the same-origin policy blocks that), so it cannot forge the request.</p>
<p><strong>When you need it:</strong></p>
<ul>
<li><strong>Yes</strong> — if you authenticate with <strong>cookies</strong> and serve browsers. Any session-based web app.</li>
<li><strong>No</strong> — if authentication is a <code>Authorization: Bearer</code> header, because browsers never attach it automatically. This is why <code>csrf().disable()</code> is legitimate for a stateless JWT API — but only for that reason, and it should be stated in the interview rather than presented as a default.</li>
</ul>
<pre><code>// SPA + cookie session: expose the token to JavaScript via a readable cookie
http.csrf(c -&gt; c.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));</code></pre>
<p>Also mention <code>SameSite=Lax</code> cookies (now the browser default) as strong defence in depth — but not a complete replacement, since it does not cover all cases or older clients.</p>`
},
{
  q: "How do you secure passwords? Explain hashing vs encryption.",
  level: "beginner", hot: true, tags: ["passwords", "security"],
  a: `<p><strong>Never encrypt passwords — hash them.</strong> Encryption is reversible by design; if the key leaks, every password leaks. Hashing is one-way: you verify by hashing the input and comparing.</p>
<p>And never use a fast general-purpose hash (MD5, SHA-256) — modern GPUs compute billions per second. Use a <strong>deliberately slow, salted, adaptive</strong> algorithm:</p>
<table>
<tr><th>Algorithm</th><th>Resistance</th><th>Notes</th></tr>
<tr><td><strong>Argon2id</strong></td><td>Memory-hard + GPU</td><td>Current OWASP first choice</td></tr>
<tr><td><strong>bcrypt</strong></td><td>CPU</td><td>Excellent, ubiquitous, 72-byte input limit</td></tr>
<tr><td>scrypt</td><td>Memory-hard</td><td>Good</td></tr>
<tr><td>PBKDF2</td><td>CPU only</td><td>Acceptable where FIPS compliance is required</td></tr>
</table>
<pre><code>@Bean
PasswordEncoder passwordEncoder() {
    // DelegatingPasswordEncoder: stores {bcrypt}$2a$12$... so you can migrate
    // algorithms later without invalidating existing passwords
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}

// verification is constant-time inside matches()
if (encoder.matches(rawPassword, user.getPasswordHash())) { ... }</code></pre>
<p><strong>The salt</strong> — a unique random value per password — is what defeats rainbow tables and makes two identical passwords hash differently. bcrypt and Argon2 generate and embed it automatically; you never manage it yourself.</p>
<p>Round out the answer: enforce length over complexity rules, check against the Have I Been Pwned breach list, rate-limit and lock after failed attempts, and never log or echo a password.</p>`
},
{
  q: "What is method-level security — @PreAuthorize vs @Secured?",
  level: "advanced", tags: ["authorization"],
  a: `<pre><code>@EnableMethodSecurity                   // Spring Security 6; was @EnableGlobalMethodSecurity

@PreAuthorize("hasRole('ADMIN')")                          // before invocation
public void deleteUser(Long id) { }

@PreAuthorize("hasAuthority('SCOPE_orders:write')")         // OAuth2 scopes
public Order create(CreateOrderRequest r) { }

@PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
public User getProfile(Long userId) { }                    // ownership check

@PreAuthorize("@orderSecurity.canAccess(#orderId, authentication)")
public Order get(Long orderId) { }                          // delegate to a bean

@PostAuthorize("returnObject.ownerId == authentication.principal.id")
public Document load(Long id) { }                           // AFTER — sees the result

@PreFilter("filterObject.amount &lt; 10000")                   // filters the input collection
@PostFilter("filterObject.tenantId == authentication.principal.tenantId")
public List&lt;Order&gt; findAll() { }                            // filters the output</code></pre>
<table>
<tr><th></th><th><code>@PreAuthorize</code></th><th><code>@Secured</code></th><th><code>@RolesAllowed</code></th></tr>
<tr><td>Expressions (SpEL)</td><td>Yes — full power</td><td>No — role names only</td><td>No</td></tr>
<tr><td>Access to arguments</td><td>Yes (<code>#param</code>)</td><td>No</td><td>No</td></tr>
<tr><td>Origin</td><td>Spring</td><td>Spring (legacy)</td><td>JSR-250 standard</td></tr>
</table>
<p><strong>Use <code>@PreAuthorize</code></strong> — it is strictly more capable. Two cautions: <code>@PostAuthorize</code> runs <em>after</em> the method, so any side effects have already happened; and because this is proxy-based AOP, self-invocation bypasses it exactly as with <code>@Transactional</code>. For data-level rules at scale, prefer filtering in the query (or PostgreSQL row-level security) over <code>@PostFilter</code>, which loads everything then discards it.</p>`
},
{
  q: "How do you implement role-based access control (RBAC)?",
  level: "advanced", tags: ["rbac", "design"],
  a: `<p><strong>Model roles and permissions separately.</strong> Roles are coarse job titles; permissions are fine-grained capabilities. Assign permissions to roles, roles to users, and check <em>permissions</em> in code.</p>
<pre><code>User  ──&lt; UserRole &gt;──  Role  ──&lt; RolePermission &gt;──  Permission
                                                       (orders:read, orders:write, users:delete)</code></pre>
<p><strong>Why this indirection matters:</strong> when the business says "support staff can now issue refunds", you change one row in <code>role_permission</code> instead of redeploying code that says <code>hasRole('ADMIN') or hasRole('SUPPORT')</code> in forty places.</p>
<pre><code>@Service
class JpaUserDetailsService implements UserDetailsService {
    public UserDetails loadUserByUsername(String username) {
        User u = repo.findByUsernameWithRoles(username)     // fetch join, avoid N+1
                     .orElseThrow(() -&gt; new UsernameNotFoundException(username));
        var authorities = Stream.concat(
                u.getRoles().stream().map(r -&gt; new SimpleGrantedAuthority("ROLE_" + r.getName())),
                u.getRoles().stream().flatMap(r -&gt; r.getPermissions().stream())
                            .map(p -&gt; new SimpleGrantedAuthority(p.getName())))
            .distinct().toList();
        return new org.springframework.security.core.userdetails.User(
                u.getUsername(), u.getPasswordHash(), u.isEnabled(), true, true,
                !u.isLocked(), authorities);
    }
}

@PreAuthorize("hasAuthority('orders:refund')")   // permission, not role
public void refund(Long orderId) { }</code></pre>
<p>Mention the alternatives when scale demands them: <strong>ABAC</strong> (attribute-based — decisions from user, resource and context attributes), <strong>ReBAC</strong> (relationship-based, as in Google Zanzibar / OpenFGA), and externalised policy engines like OPA when authorization logic must be shared across many services.</p>`
},
{
  q: "What is CORS and how do you configure it correctly?",
  level: "beginner", hot: true, tags: ["cors"],
  a: `<p><strong>Cross-Origin Resource Sharing</strong> relaxes the browser's same-origin policy. A page on <code>app.acme.com</code> calling <code>api.acme.com</code> is cross-origin; the browser blocks reading the response unless the server sends the right <code>Access-Control-Allow-*</code> headers.</p>
<p>For non-simple requests the browser first sends a <strong>preflight</strong> <code>OPTIONS</code> request asking whether the real one is permitted.</p>
<pre><code>@Bean
CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.acme.com"));   // NOT "*" with credentials
    config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization","Content-Type","X-Tenant-Id"));
    config.setExposedHeaders(List.of("X-Total-Count"));          // readable by JS
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);                                     // cache the preflight
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
// then: http.cors(Customizer.withDefaults())</code></pre>
<p><strong>Points that matter:</strong> CORS is enforced <em>by the browser</em>, not the server — it is not a security control against scripts, curl or servers. <code>allowedOrigins("*")</code> with <code>allowCredentials(true)</code> is rejected by the spec (use <code>allowedOriginPatterns</code> if you truly need wildcards). And in Spring Security, CORS must be enabled on the filter chain, otherwise the preflight <code>OPTIONS</code> is rejected as unauthenticated before <code>@CrossOrigin</code> ever runs — the classic "it works in Postman but not in the browser".</p>`
},
{
  q: "What are the OWASP Top 10 risks and how do you defend against them in Spring?",
  level: "advanced", hot: true, tags: ["owasp", "security"],
  a: `<ol>
<li><strong>Broken Access Control</strong> — deny by default (<code>anyRequest().authenticated()</code>), check ownership not just roles, never trust an ID from the client without verifying the caller owns it (IDOR).</li>
<li><strong>Cryptographic Failures</strong> — TLS everywhere, BCrypt/Argon2 for passwords, encrypt sensitive columns at rest, no secrets in code or logs.</li>
<li><strong>Injection</strong> — parameterised queries only. JPA/JDBC binding by default; never string-concatenate SQL, JPQL, LDAP or OS commands. Validate and encode output against XSS.</li>
<li><strong>Insecure Design</strong> — threat model, rate limit, enforce business rules server-side (never trust a price sent by the client).</li>
<li><strong>Security Misconfiguration</strong> — disable stack traces in responses, secure Actuator endpoints, remove default credentials, set security headers.</li>
<li><strong>Vulnerable Components</strong> — OWASP Dependency-Check or Snyk in CI, keep Spring Boot current (remember Log4Shell and Spring4Shell).</li>
<li><strong>Identification and Authentication Failures</strong> — MFA, account lockout, no session fixation (Spring rotates the session ID on login by default), short token lifetimes.</li>
<li><strong>Software and Data Integrity Failures</strong> — verify artefact signatures, never deserialize untrusted Java objects, pin dependencies.</li>
<li><strong>Logging and Monitoring Failures</strong> — log authentication events and access-denied decisions, alert on anomalies, and never log tokens, passwords or PII.</li>
<li><strong>SSRF</strong> — validate and allowlist outbound URLs, block internal ranges and cloud metadata endpoints (<code>169.254.169.254</code>), disable redirects on server-side fetches.</li>
</ol>
<blockquote><p>If you have built anything with an SSRF-safe outbound policy, a rate limiter, or tenant isolation, describe it here — a concrete example beats reciting the list.</p></blockquote>`
},
{
  q: "How do you handle authentication in a microservices architecture?",
  level: "advanced", hot: true, tags: ["microservices", "architecture"],
  a: `<p><strong>The standard pattern — token at the edge, verification everywhere:</strong></p>
<ol>
<li>A dedicated <strong>identity provider</strong> (Keycloak, Auth0, Cognito) authenticates the user and issues a signed JWT. No individual service handles passwords.</li>
<li>The <strong>API gateway</strong> validates the token once, rejects bad requests early, and can enforce coarse rate limits and routing.</li>
<li>Each <strong>downstream service independently verifies</strong> the signature using the IdP's public JWK set (cached). Never trust "the gateway already checked" — that is a single point of compromise and does not protect against lateral movement inside the cluster.</li>
<li><strong>Service-to-service</strong> calls use the <code>client_credentials</code> grant for their own identity, or propagate the user token when acting on the user's behalf. Mutual TLS (via a service mesh like Istio) adds transport-level identity.</li>
<li><strong>Propagate context</strong> — user ID, tenant ID and trace ID — through headers so authorization and auditing work end to end.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Microservices authentication topology">
  <rect class="dg-box" x="8" y="60" width="86" height="40" rx="7"/><text class="dg-s" x="51" y="84" text-anchor="middle">Client</text>
  <path class="dg-line" d="M98 80 H140" marker-end="url(#m1)"/>
  <rect class="dg-fill" x="144" y="52" width="104" height="56" rx="7"/>
  <text class="dg-s" x="196" y="76" text-anchor="middle">API Gateway</text><text class="dg-s" x="196" y="92" text-anchor="middle">validate JWT</text>
  <rect class="dg-fill2" x="144" y="8" width="104" height="32" rx="7"/><text class="dg-s" x="196" y="28" text-anchor="middle">Keycloak / IdP</text>
  <path class="dg-line" d="M196 52 V40" stroke-dasharray="3 3"/>
  <path class="dg-line" d="M252 68 H320 M252 80 H320 M252 96 H320" marker-end="url(#m1)"/>
  <rect class="dg-box" x="324" y="14" width="130" height="34" rx="7"/><text class="dg-s" x="389" y="35" text-anchor="middle">Order service</text>
  <rect class="dg-box" x="324" y="62" width="130" height="34" rx="7"/><text class="dg-s" x="389" y="83" text-anchor="middle">Billing service</text>
  <rect class="dg-box" x="324" y="110" width="130" height="34" rx="7"/><text class="dg-s" x="389" y="131" text-anchor="middle">Customer service</text>
  <text class="dg-s" x="540" y="70" text-anchor="middle">each verifies</text>
  <text class="dg-s" x="540" y="86" text-anchor="middle">signature via JWKS</text>
  <defs><marker id="m1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
<figcaption>Centralised issuance, decentralised verification — zero trust inside the mesh.</figcaption>
</figure>
<p><strong>Trade-off to acknowledge:</strong> stateless verification scales beautifully but makes instant revocation hard. Short token lifetimes plus a shared denylist in Redis is the usual compromise.</p>`
},
{
  q: "What is the SecurityContextHolder and how does it work with threads?",
  level: "advanced", tags: ["internals", "threading"],
  a: `<p><code>SecurityContextHolder</code> stores the current <code>SecurityContext</code> (holding the <code>Authentication</code>) in a <strong><code>ThreadLocal</code></strong> by default.</p>
<pre><code>Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String username = auth.getName();
boolean admin = auth.getAuthorities().stream()
        .anyMatch(a -&gt; a.getAuthority().equals("ROLE_ADMIN"));

// Cleaner in a controller — let Spring inject it
@GetMapping("/me")
UserDto me(@AuthenticationPrincipal UserDetails principal) { ... }</code></pre>
<p><strong>The threading consequences, which is what the question is really about:</strong></p>
<ul>
<li>The context is <strong>not visible in another thread</strong> — <code>@Async</code> methods, executor tasks and reactive chains see an empty context, and your <code>@PreAuthorize</code> silently fails or worse, sees an anonymous user.</li>
<li>Fixes: <code>DelegatingSecurityContextAsyncTaskExecutor</code>, <code>DelegatingSecurityContextRunnable</code>, or the strategy <code>MODE_INHERITABLETHREADLOCAL</code> (which propagates to child threads but is dangerous with pooled threads).</li>
<li>In WebFlux the whole mechanism is different — the context lives in the Reactor <code>Context</code>, accessed via <code>ReactiveSecurityContextHolder</code>, because there is no thread affinity at all.</li>
<li>Because pooled threads are reused, the filter chain <strong>clears the context in a finally block</strong> at the end of every request. If you set it manually somewhere, you must clear it too, or the next request on that thread inherits someone else's identity — a genuine and serious security bug.</li>
</ul>`
},
{
  q: "How do you prevent SQL injection and XSS in a Spring application?",
  level: "beginner", hot: true, tags: ["injection", "security"],
  a: `<p><strong>SQL injection</strong> — never build queries by concatenation. Use bound parameters, which the driver sends separately from the SQL text so input can never be parsed as code.</p>
<pre><code>// VULNERABLE
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
// input: ' OR '1'='1  -&gt; returns every user

// SAFE — JPA / Spring Data
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional&lt;User&gt; findByEmail(@Param("email") String email);

// SAFE — JdbcTemplate
jdbc.query("SELECT * FROM users WHERE email = ?", mapper, email);

// SAFE — jOOQ / Criteria API build parameterised SQL by construction</code></pre>
<p><strong>The parts binding does not cover:</strong> table and column names and <code>ORDER BY</code> direction cannot be bound. If they come from user input, validate against an explicit allowlist — never interpolate.</p>
<p><strong>XSS</strong> — the defence is contextual output encoding, not input filtering:</p>
<ul>
<li>Thymeleaf escapes by default with <code>th:text</code>; <code>th:utext</code> disables it — treat every use as a review item.</li>
<li>For a REST API returning JSON, Jackson escapes correctly; the risk moves to the frontend. React escapes by default; <code>dangerouslySetInnerHTML</code> and Angular's <code>bypassSecurityTrustHtml</code> are the danger points.</li>
<li>If you must accept HTML (a rich-text editor), sanitise with a library such as OWASP Java HTML Sanitizer — allowlist tags, never denylist.</li>
<li>Add a <strong>Content-Security-Policy</strong> header as defence in depth, and <code>HttpOnly</code> cookies so a successful XSS cannot steal the session.</li>
</ul>
<pre><code>http.headers(h -&gt; h
    .contentSecurityPolicy(c -&gt; c.policyDirectives("default-src 'self'; frame-ancestors 'none'"))
    .frameOptions(f -&gt; f.deny())
    .httpStrictTransportSecurity(s -&gt; s.includeSubDomains(true).maxAgeInSeconds(31536000)));</code></pre>`
}
]);
