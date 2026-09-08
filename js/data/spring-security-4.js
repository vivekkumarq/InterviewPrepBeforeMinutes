appendTopic("spring-security", [
{
  q: "Walk me through a complete JWT login and request-validation flow in Spring Boot",
  level: "advanced", hot: true, tags: ["jwt", "authentication"],
  companies: ["Amazon", "TCS", "Infosys", "Paytm", "Flipkart", "Cognizant", "Accenture"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 200" role="img" aria-label="JWT login and validation flow through the filter chain">
  <rect class="dg-box" x="8" y="80" width="80" height="34" rx="7"/><text class="dg-s" x="48" y="102" text-anchor="middle">Client</text>
  <path class="dg-line" d="M92 88 H150" marker-end="url(#jw1)"/><text class="dg-m" x="121" y="80" text-anchor="middle">POST /login</text>
  <rect class="dg-fill" x="154" y="20" width="124" height="52" rx="8"/>
  <text class="dg-s" x="216" y="40" text-anchor="middle">AuthController</text><text class="dg-s" x="216" y="58" text-anchor="middle">AuthenticationManager</text>
  <path class="dg-line" d="M282 46 H340" marker-end="url(#jw1)"/>
  <rect class="dg-fill2" x="344" y="20" width="124" height="52" rx="8"/>
  <text class="dg-s" x="406" y="40" text-anchor="middle">UserDetailsService</text><text class="dg-s" x="406" y="58" text-anchor="middle">PasswordEncoder</text>
  <path class="dg-line" d="M472 46 H530" marker-end="url(#jw1)"/>
  <rect class="dg-fill" x="534" y="28" width="76" height="36" rx="7"/><text class="dg-s" x="572" y="50" text-anchor="middle">sign JWT</text>
  <path class="dg-line" d="M92 106 H150" marker-end="url(#jw1)"/><text class="dg-m" x="121" y="126" text-anchor="middle">Bearer …</text>
  <rect class="dg-fill" x="154" y="112" width="124" height="46" rx="8"/>
  <text class="dg-s" x="216" y="130" text-anchor="middle">JwtAuthFilter</text><text class="dg-s" x="216" y="147" text-anchor="middle">verify + parse</text>
  <path class="dg-line" d="M282 135 H340" marker-end="url(#jw1)"/>
  <rect class="dg-fill2" x="344" y="112" width="124" height="46" rx="8"/>
  <text class="dg-s" x="406" y="130" text-anchor="middle">SecurityContext</text><text class="dg-s" x="406" y="147" text-anchor="middle">Holder</text>
  <path class="dg-line" d="M472 135 H530" marker-end="url(#jw1)"/>
  <rect class="dg-box" x="534" y="117" width="76" height="36" rx="7"/><text class="dg-s" x="572" y="139" text-anchor="middle">Controller</text>
  <text class="dg-s" x="300" y="186" text-anchor="middle">no session, no server state — the signature IS the proof</text>
  <defs><marker id="jw1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// 1. LOGIN
@PostMapping("/api/auth/login")
public TokenPair login(@Valid @RequestBody LoginRequest req) {
    Authentication auth = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(req.username(), req.password()));
    return tokenService.issue((UserDetails) auth.getPrincipal());
}

// 2. VALIDATION on every subsequent request
@Component
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
}

// 3. WIRING
http.sessionManagement(s -&gt; s.sessionCreationPolicy(STATELESS))
    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);</code></pre>
<p><strong>The details interviewers probe:</strong> extend <code>OncePerRequestFilter</code> so it does not run twice on a forward; <code>STATELESS</code> so no <code>JSESSIONID</code> is created; place the filter <em>before</em> <code>UsernamePasswordAuthenticationFilter</code>; and on a bad token <strong>clear the context and continue</strong> rather than throwing, so the <code>AuthenticationEntryPoint</code> produces a clean JSON 401 instead of an HTML error page.</p>
<p><strong>What to validate in the token:</strong> signature, <code>exp</code>, <code>iss</code>, <code>aud</code> — and pin the expected algorithm so an attacker cannot supply <code>alg: none</code> or downgrade RS256 to HS256.</p>`
},
{
  q: "How do you implement role-based and permission-based access control together?",
  level: "advanced", hot: true, tags: ["rbac", "authorization"],
  companies: ["Amazon", "Infosys", "Deloitte", "Optum", "UnitedHealth", "Barclays"],
  a: `<pre><code>-- Model roles and permissions SEPARATELY
User ──&lt; UserRole &gt;── Role ──&lt; RolePermission &gt;── Permission
                                                   (orders:read, orders:refund, users:delete)</code></pre>
<pre><code>@Service
public class JpaUserDetailsService implements UserDetailsService {

    public UserDetails loadUserByUsername(String username) {
        User u = repo.findByUsernameWithRolesAndPermissions(username)   // ONE fetch-join query
                     .orElseThrow(() -&gt; new UsernameNotFoundException(username));

        var authorities = Stream.concat(
                // ROLE_ prefix is what hasRole() expects
                u.getRoles().stream().map(r -&gt; new SimpleGrantedAuthority("ROLE_" + r.getName())),
                // fine-grained permissions as plain authorities
                u.getRoles().stream().flatMap(r -&gt; r.getPermissions().stream())
                            .map(p -&gt; new SimpleGrantedAuthority(p.getName())))
            .distinct().toList();

        return org.springframework.security.core.userdetails.User
                .withUsername(u.getUsername()).password(u.getPasswordHash())
                .authorities(authorities)
                .accountLocked(u.isLocked()).disabled(!u.isEnabled()).build();
    }
}</code></pre>
<pre><code>// Check PERMISSIONS in code, not roles
@PreAuthorize("hasAuthority('orders:refund')")
public Refund refund(Long orderId, Money amount) { }

// Ownership as well as permission — the check people forget
@PreAuthorize("hasAuthority('orders:read') and @orderSecurity.isOwner(#orderId, authentication)")
public Order get(Long orderId) { }

// URL level for coarse gating
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.anyRequest().authenticated()</code></pre>
<p><strong>Why the indirection is worth it:</strong> when the business says "support staff can now issue refunds", you change one row in <code>role_permission</code>. With <code>hasRole('ADMIN') or hasRole('SUPPORT')</code> scattered across forty methods, that is a code change, a review, a release and a regression risk.</p>
<p><strong>The <code>ROLE_</code> prefix trap:</strong> <code>hasRole('ADMIN')</code> automatically looks for the authority <code>ROLE_ADMIN</code>, while <code>hasAuthority('ADMIN')</code> looks for exactly <code>ADMIN</code>. Mixing them up is the single most common Spring Security configuration bug.</p>
<p><strong>The vulnerability to name:</strong> checking only the role and not <em>ownership</em> is broken object-level authorization — number one in the OWASP API Security Top 10. Return <strong>404 rather than 403</strong> for another user's resource so the API does not confirm the ID exists.</p>`
},
{
  q: "What is the difference between authentication and authorization failures, and which status codes?",
  level: "beginner", hot: true, tags: ["errors", "security"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "HCL", "Cognizant"],
  a: `<table>
<tr><th></th><th>401 Unauthorized</th><th>403 Forbidden</th></tr>
<tr><td>Actually means</td><td><strong>Unauthenticated</strong> — a naming mistake in the RFC</td><td>Authenticated, but not permitted</td></tr>
<tr><td>Cause</td><td>No token, expired token, invalid signature</td><td>Valid identity, insufficient role or permission</td></tr>
<tr><td>Client should</td><td>Log in or refresh the token</td><td>Not retry — it will never succeed</td></tr>
<tr><td>Spring component</td><td><code>AuthenticationEntryPoint</code></td><td><code>AccessDeniedHandler</code></td></tr>
</table>
<pre><code>@Bean
SecurityFilterChain chain(HttpSecurity http) throws Exception {
    return http.exceptionHandling(e -&gt; e
        .authenticationEntryPoint((req, res, ex) -&gt; {          // 401
            res.setStatus(401);
            res.setContentType("application/problem+json");
            res.getWriter().write("""
                {"type":"https://api.acme.com/errors/unauthenticated",
                 "title":"Authentication required","status":401}""");
        })
        .accessDeniedHandler((req, res, ex) -&gt; {                // 403
            log.warn("access denied user={} uri={}",
                     SecurityContextHolder.getContext().getAuthentication().getName(),
                     req.getRequestURI());                       // AUDIT this
            res.setStatus(403);
            res.getWriter().write("""
                {"title":"Insufficient permissions","status":403}""");
        })).build();
}</code></pre>
<p><strong>Why the defaults are wrong for an API:</strong> without these handlers, Spring Security redirects to a login page or returns an HTML error body — so a JSON client receives a content-type it cannot parse and reports a confusing error. Every REST API needs both handlers.</p>
<p><strong>The security nuance worth raising:</strong> for a resource that exists but belongs to another user, returning <strong>404</strong> is often better than 403. A 403 confirms the resource exists, which lets an attacker enumerate valid IDs. Use 403 for "you cannot perform this action" and 404 for "this is not yours to know about".</p>
<p><strong>Always log 403s</strong> with the user, URI and timestamp — a spike in access-denied events is one of the clearest signals of either a broken deployment or an attack in progress.</p>`
},
{
  q: "How would you secure a REST API end to end — give the full checklist",
  level: "advanced", hot: true, tags: ["security", "checklist"],
  companies: ["Amazon", "Goldman Sachs", "JPMorgan", "Barclays", "Deloitte", "Optum"],
  a: `<ol>
<li><strong>Transport</strong> — HTTPS only, HSTS with <code>includeSubDomains</code>, redirect HTTP, TLS 1.2+.</li>
<li><strong>Authentication</strong> — OAuth2/OIDC with short-lived JWTs; <code>client_credentials</code> or mTLS for service-to-service. Verify signature, <code>exp</code>, <code>iss</code>, <code>aud</code>, and pin the algorithm.</li>
<li><strong>Authorization on every endpoint</strong> — deny by default (<code>anyRequest().authenticated()</code> last), and check <em>ownership</em> not just role.</li>
<li><strong>Input validation</strong> — bean validation on every DTO, size limits on bodies and arrays, allowlists for enums and sort fields.</li>
<li><strong>Mass-assignment protection</strong> — bind to an explicit request DTO, never to the entity:
<pre><code>public record UpdateUserRequest(String name, String email) { }  // no 'role', no 'id'
// NOT: public User update(@RequestBody User user)</code></pre></li>
<li><strong>Rate limiting</strong> — per user and per IP, returning 429 with <code>Retry-After</code>.</li>
<li><strong>Idempotency</strong> on mutating endpoints so retries cannot double-charge.</li>
<li><strong>Security headers</strong> — CSP, <code>X-Frame-Options: DENY</code>, <code>X-Content-Type-Options: nosniff</code>, referrer policy.</li>
<li><strong>CORS</strong> — explicit origin allowlist; never <code>*</code> with credentials.</li>
<li><strong>Error handling</strong> — no stack traces, no SQL, no class names. Return a correlation ID; log the detail server-side.</li>
<li><strong>Secrets</strong> — from a secret manager, never in code, config files or environment variables committed to git.</li>
<li><strong>Dependencies</strong> — OWASP Dependency-Check or Snyk in CI, failing the build on new HIGH/CRITICAL findings.</li>
<li><strong>Audit logging</strong> — authentication events, access-denied, privilege changes. Never log tokens, passwords or PII.</li>
</ol>
<pre><code>http.headers(h -&gt; h
    .contentSecurityPolicy(c -&gt; c.policyDirectives(
        "default-src 'self'; frame-ancestors 'none'; object-src 'none'"))
    .frameOptions(f -&gt; f.deny())
    .httpStrictTransportSecurity(s -&gt; s.includeSubDomains(true).maxAgeInSeconds(31536000))
    .referrerPolicy(r -&gt; r.policy(SAME_ORIGIN)));</code></pre>
<p><strong>The one people forget:</strong> item 5. Binding a request directly to a JPA entity means a client can send <code>{"role":"ADMIN"}</code> and Jackson will happily set it. An explicit DTO makes privilege escalation structurally impossible rather than relying on a validation rule someone might remove.</p>`
},
{
  q: "How do you test Spring Security configuration?",
  level: "advanced", tags: ["testing", "security"],
  companies: ["Amazon", "ThoughtWorks", "EPAM", "SAP", "Publicis Sapient"],
  a: `<pre><code>@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)          // slices EXCLUDE your security config by default
class OrderControllerSecurityTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test
    void anonymousIsRejected() throws Exception {
        mvc.perform(get("/api/v1/orders/1"))
           .andExpect(status().isUnauthorized());
    }

    @Test @WithMockUser(roles = "USER")
    void userCannotDelete() throws Exception {
        mvc.perform(delete("/api/v1/admin/orders/1").with(csrf()))
           .andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "ADMIN")
    void adminCanDelete() throws Exception {
        mvc.perform(delete("/api/v1/admin/orders/1").with(csrf()))
           .andExpect(status().isNoContent());
    }

    @Test
    void cannotReadAnotherUsersOrder() throws Exception {          // the IDOR test
        given(service.findForUser("99", "user-b")).willThrow(new EntityNotFoundException());
        mvc.perform(get("/api/v1/orders/99")
                .with(jwt().jwt(j -&gt; j.claim("sub", "user-b"))))
           .andExpect(status().isNotFound());     // 404, not 403 — do not leak existence
    }

    @Test @WithMockUser
    void rejectsWriteWithoutCsrfToken() throws Exception {
        mvc.perform(post("/api/v1/orders"))       // no .with(csrf())
           .andExpect(status().isForbidden());
    }
}</code></pre>
<pre><code>// Testing method security on a service bean
@SpringBootTest
class OrderServiceSecurityTest {
    @Test @WithMockUser(authorities = "orders:read")
    void deniedWithoutRefundPermission() {
        assertThatThrownBy(() -&gt; service.refund(1L, money))
                .isInstanceOf(AccessDeniedException.class);
    }
}

// Custom principal for ownership tests
@WithSecurityContext(factory = WithCustomUserFactory.class)
public @interface WithCustomUser { String id(); String[] authorities() default {}; }</code></pre>
<p><strong>The three things people forget to test:</strong></p>
<ol>
<li><strong><code>@Import(SecurityConfig.class)</code></strong> — <code>@WebMvcTest</code> does <em>not</em> load your security configuration by default, so without it every endpoint appears open and your tests prove nothing.</li>
<li><strong>The negative case.</strong> Testing that an admin <em>can</em> delete is easy; testing that a normal user <em>cannot</em> is the test that catches the regression.</li>
<li><strong>Ownership (IDOR).</strong> Authenticated user B requesting user A's resource must fail — this is the most commonly exploited API vulnerability and the least commonly tested.</li>
</ol>
<p><code>spring-security-test</code> provides <code>@WithMockUser</code>, <code>@WithAnonymousUser</code>, and the request post-processors <code>csrf()</code>, <code>jwt()</code>, <code>oauth2Login()</code> and <code>user()</code> — worth naming the dependency, since the annotations do nothing without it.</p>`
},
{
  q: "What is the difference between stateless and stateful authentication at scale?",
  level: "advanced", tags: ["architecture", "sessions"],
  companies: ["Amazon", "Flipkart", "Walmart", "PayPal", "Zoho", "Maersk"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Stateful session store versus stateless token validation">
  <text class="dg-t" x="150" y="16" text-anchor="middle">Stateful (session)</text>
  <rect class="dg-box" x="16" y="28" width="60" height="26" rx="5"/><text class="dg-s" x="46" y="45" text-anchor="middle">Client</text>
  <path class="dg-line" d="M80 41 H120" marker-end="url(#st1)"/>
  <rect class="dg-fill" x="124" y="26" width="56" height="30" rx="6"/><text class="dg-s" x="152" y="46" text-anchor="middle">Pod A</text>
  <rect class="dg-fill" x="124" y="62" width="56" height="30" rx="6"/><text class="dg-s" x="152" y="82" text-anchor="middle">Pod B</text>
  <path class="dg-line" d="M184 41 H224 M184 77 H224" marker-end="url(#st1)"/>
  <rect class="dg-fill2" x="228" y="42" width="62" height="34" rx="7"/><text class="dg-s" x="259" y="63" text-anchor="middle">Redis</text>
  <text class="dg-s" x="150" y="118" text-anchor="middle">every request = a network lookup</text>
  <text class="dg-s" x="150" y="136" text-anchor="middle">revocation is instant</text>
  <text class="dg-t" x="460" y="16" text-anchor="middle">Stateless (JWT)</text>
  <rect class="dg-box" x="330" y="28" width="60" height="26" rx="5"/><text class="dg-s" x="360" y="45" text-anchor="middle">Client</text>
  <path class="dg-line" d="M394 41 H434" marker-end="url(#st1)"/>
  <rect class="dg-fill" x="438" y="26" width="56" height="30" rx="6"/><text class="dg-s" x="466" y="46" text-anchor="middle">Pod A</text>
  <rect class="dg-fill" x="438" y="62" width="56" height="30" rx="6"/><text class="dg-s" x="466" y="82" text-anchor="middle">Pod B</text>
  <text class="dg-s" x="546" y="46" text-anchor="middle">verify</text><text class="dg-s" x="546" y="62" text-anchor="middle">signature</text><text class="dg-s" x="546" y="78" text-anchor="middle">locally</text>
  <text class="dg-s" x="460" y="118" text-anchor="middle">no lookup, scales horizontally</text>
  <text class="dg-s" x="460" y="136" text-anchor="middle">revocation is HARD</text>
  <defs><marker id="st1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th></th><th>Stateful (server session)</th><th>Stateless (JWT)</th></tr>
<tr><td>Server memory</td><td>Grows with active users</td><td>Zero</td></tr>
<tr><td>Horizontal scaling</td><td>Needs a shared store or sticky sessions</td><td>Any pod can serve any request</td></tr>
<tr><td>Per-request cost</td><td>A network round trip to Redis</td><td>Local signature verification</td></tr>
<tr><td><strong>Revocation</strong></td><td><strong>Instant</strong> — delete the session</td><td><strong>Hard</strong> — valid until expiry</td></tr>
<tr><td>Permission changes</td><td>Take effect immediately</td><td>Stale until the token is refreshed</td></tr>
<tr><td>Token size</td><td>~32-byte cookie</td><td>Several hundred bytes on every request</td></tr>
</table>
<p><strong>The trade-off that decides it:</strong> statelessness buys you scaling and costs you control. You cannot log a user out, cannot revoke a compromised token, and cannot apply a permission change until the token expires.</p>
<p><strong>The hybrid that most production systems land on:</strong> a short-lived access token (5–15 minutes) that is verified statelessly, plus a long-lived <em>refresh</em> token that <em>is</em> stored server-side and therefore revocable. You get stateless request handling with a bounded window of exposure, and a real logout — because revoking the refresh token means the access token cannot be renewed.</p>
<p><strong>For emergency revocation</strong>, add a denylist of <code>jti</code> values in Redis checked on each request. That reintroduces a lookup, but only for the small set of explicitly revoked tokens, and it is the honest answer to "what if a token is stolen?"</p>`
}
]);
