appendTopic("spring-security", [
{
  q: "How do you store and rotate JWTs safely — and where should the token actually live?",
  level: "advanced", hot: true, tags: ["jwt", "tokens", "security", "design"],
  companies: ["Amazon", "Optum", "Goldman Sachs", "SAP", "Barclays", "Flipkart", "Societe Generale"],
  a: `<table>
<tr><th>Storage</th><th>XSS risk</th><th>CSRF risk</th><th>Verdict</th></tr>
<tr><td><code>localStorage</code></td><td><strong>High</strong> — any injected script reads it</td><td>None</td><td>Common, and the usual reason tokens get stolen</td></tr>
<tr><td><code>sessionStorage</code></td><td>High</td><td>None</td><td>Same problem, shorter window</td></tr>
<tr><td>JavaScript variable in memory</td><td>Medium — lost on refresh</td><td>None</td><td>Good for the short-lived access token</td></tr>
<tr><td><strong>httpOnly + Secure + SameSite cookie</strong></td><td><strong>None</strong> — JS cannot read it</td><td>Mitigated by <code>SameSite=Strict/Lax</code></td><td><strong>Best for the refresh token</strong></td></tr>
</table>
<pre><code>// The pattern that holds up: short access token in memory, refresh token in a cookie
ResponseCookie refresh = ResponseCookie.from("refresh_token", token)
    .httpOnly(true)          // invisible to JavaScript — kills XSS theft
    .secure(true)            // HTTPS only
    .sameSite("Strict")      // not sent cross-site — kills CSRF
    .path("/auth/refresh")   // sent ONLY to the refresh endpoint
    .maxAge(Duration.ofDays(7))
    .build();</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Access token refresh cycle with rotation and reuse detection">
  <rect class="dg-fill" x="16" y="26" width="120" height="34" rx="6"/><text class="dg-s" x="76" y="48" text-anchor="middle">access token</text>
  <text class="dg-s" x="76" y="76" text-anchor="middle">15 min, in memory</text>
  <path class="dg-line" d="M140 43 H210" marker-end="url(#jw9)"/>
  <text class="dg-s" x="175" y="34" text-anchor="middle">expires</text>
  <rect class="dg-fill2" x="214" y="26" width="130" height="34" rx="6"/><text class="dg-s" x="279" y="48" text-anchor="middle">POST /auth/refresh</text>
  <path class="dg-line" d="M348 43 H418" marker-end="url(#jw9)"/>
  <rect class="dg-fill" x="422" y="26" width="182" height="34" rx="6"/><text class="dg-s" x="513" y="48" text-anchor="middle">new access + NEW refresh</text>
  <text class="dg-s" x="513" y="76" text-anchor="middle">old refresh is invalidated</text>
  <rect class="dg-box" x="150" y="106" width="330" height="34" rx="6"/>
  <text class="dg-s" x="315" y="128" text-anchor="middle">old refresh reused → revoke the whole family (theft detected)</text>
  <defs><marker id="jw9" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>Refresh token rotation with reuse detection</strong> is the part that turns a design into a secure one: every refresh issues a <em>new</em> refresh token and invalidates the old one. If an old token is ever presented again, either the client is buggy or the token was stolen — so you revoke the entire token family and force a re-login. Without rotation, a stolen refresh token is valid until it expires and you cannot tell it was stolen.</p>
<pre><code>// Validation that must not be skipped
Jwt jwt = decoder.decode(token);
// - signature verified against the CURRENT public key (JWKS, with kid rotation)
// - alg is CHECKED, not read from the header. Accepting alg:none, or accepting
//   HS256 when you expect RS256, is the classic JWT vulnerability.
// - exp, nbf, iss and aud all validated
// - the token is not used past its lifetime because it is SHORT

// Spring Boot resource server: all of this for free
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.example.com
// It fetches the JWKS, caches it, and rotates keys automatically.</code></pre>
<table>
<tr><th>Question</th><th>Answer</th></tr>
<tr><td>Can a JWT be revoked?</td><td>Not by itself — it is self-contained. Keep access tokens short (5–15 min) and keep revocation state for refresh tokens only.</td></tr>
<tr><td>What goes in the payload?</td><td>Subject, roles, issuer, audience, expiry. <strong>Never</strong> secrets — the payload is base64, not encrypted.</td></tr>
<tr><td>Symmetric or asymmetric?</td><td>RS256/ES256 for anything multi-service: services verify with the public key and cannot mint tokens.</td></tr>
<tr><td>Should I use JWTs at all?</td><td>For a single-domain web app, a plain server session with an httpOnly cookie is simpler and revocable. JWTs earn their place for stateless, multi-service and cross-domain APIs.</td></tr>
</table>
<p><strong>The honest closing line:</strong> "JWTs trade revocability for statelessness. If I need instant logout, I either keep the access token very short or I keep a small denylist in Redis — at which point I should ask whether a session store would have been simpler all along."</p>`
},
{
  q: "How do you prevent SQL injection, XSS and CSRF in a Spring application?",
  level: "advanced", hot: true, tags: ["security", "csrf", "cors", "best-practice"],
  companies: ["Amazon", "Barclays", "Goldman Sachs", "Optum", "SAP", "TCS", "Deloitte", "Societe Generale"],
  a: `<pre><code>// SQL INJECTION — the fix is parameterisation, not escaping
// ✗ String concatenation, in any form
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
@Query("SELECT u FROM User u WHERE u.name = '" + "#{#name}" + "'")   // still injectable

// ✔ Bound parameters — the driver sends value and query separately
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional&lt;User&gt; findByEmail(@Param("email") String email);

jdbcTemplate.query("SELECT * FROM users WHERE email = ?", rowMapper, email);

// ✔ Derived queries and Criteria API are parameterised by construction
// ✘ The one place parameters CANNOT help: dynamic table or column names.
//   Validate those against an ALLOWLIST — never interpolate user input.
private static final Set&lt;String&gt; SORTABLE = Set.of("name", "createdAt", "total");
if (!SORTABLE.contains(sortBy)) throw new IllegalArgumentException(sortBy);</code></pre>
<pre><code>// XSS — context-aware OUTPUT encoding, not input sanitisation
// Thymeleaf escapes by default:
&lt;p th:text="\${comment}"&gt;&lt;/p&gt;          // ✔ safe
&lt;p th:utext="\${comment}"&gt;&lt;/p&gt;         // ✗ unescaped — only for HTML you produced

// For a JSON API, the browser is the renderer, so the framework matters:
// React escapes by default; dangerouslySetInnerHTML does not.
// If you must accept HTML, sanitise with an allowlist (OWASP Java HTML Sanitizer),
// never with a regex blocklist — those are always incomplete.

// Defence in depth: a Content Security Policy stops injected scripts running
http.headers(h -&gt; h
    .contentSecurityPolicy(csp -&gt; csp.policyDirectives(
        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'"))
    .frameOptions(f -&gt; f.deny())                       // clickjacking
    .httpStrictTransportSecurity(hsts -&gt; hsts.maxAgeInSeconds(31536000))
);</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="CSRF attack flow where a third party site triggers an authenticated request">
  <rect class="dg-box" x="16" y="52" width="110" height="36" rx="6"/><text class="dg-s" x="71" y="75" text-anchor="middle">victim browser</text>
  <rect class="dg-fill2" x="200" y="16" width="130" height="36" rx="6"/><text class="dg-s" x="265" y="39" text-anchor="middle">evil.com</text>
  <rect class="dg-fill" x="200" y="92" width="130" height="36" rx="6"/><text class="dg-s" x="265" y="115" text-anchor="middle">bank.com</text>
  <path class="dg-line" d="M130 62 L196 40" marker-end="url(#cs1)"/>
  <path class="dg-line" d="M200 44 L130 74" marker-end="url(#cs1)"/>
  <text class="dg-s" x="150" y="30">loads a page that auto-submits a form</text>
  <path class="dg-line" d="M130 82 L196 106" marker-end="url(#cs1)"/>
  <text class="dg-s" x="352" y="112">cookie is sent automatically →</text>
  <text class="dg-s" x="352" y="130">the request looks authentic</text>
  <text class="dg-s" x="16" y="146">the CSRF token breaks it: evil.com cannot READ it, so it cannot include it</text>
  <defs><marker id="cs1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// CSRF — Spring Security enables it by DEFAULT for cookie-based sessions
http.csrf(csrf -&gt; csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())   // SPA reads it
    .ignoringRequestMatchers("/api/public/**")
);

// ✗ The most common bad answer
http.csrf(csrf -&gt; csrf.disable());
// This is only correct when authentication is a BEARER TOKEN in a header,
// because a browser will not attach that automatically to a cross-site request.
// If you authenticate with a cookie, disabling CSRF is a real vulnerability.

// CORS is NOT a security control — it is a browser relaxation. Configure it
// narrowly, and never with allowCredentials(true) plus a wildcard origin.
http.cors(c -&gt; c.configurationSource(request -&gt; {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("https://app.example.com"));   // explicit, never "*"
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    cfg.setAllowCredentials(true);
    return cfg;
}));</code></pre>
<table>
<tr><th>Attack</th><th>Primary defence</th><th>Defence in depth</th></tr>
<tr><td>SQL injection</td><td>Parameterised queries</td><td>Least-privilege DB user; allowlist for identifiers</td></tr>
<tr><td>XSS</td><td>Context-aware output encoding</td><td>CSP; httpOnly cookies; sanitiser for rich text</td></tr>
<tr><td>CSRF</td><td>Synchroniser token</td><td><code>SameSite</code> cookies; bearer tokens instead of cookies</td></tr>
<tr><td>Clickjacking</td><td><code>X-Frame-Options: DENY</code></td><td><code>frame-ancestors 'none'</code></td></tr>
<tr><td>Sensitive data exposure</td><td>TLS everywhere, HSTS</td><td>Never log tokens, PII or full card numbers</td></tr>
<tr><td>Vulnerable dependencies</td><td>OWASP dependency-check in CI</td><td>Renovate/Dependabot, weekly rebuilds</td></tr>
</table>
<p><strong>The framing that lands:</strong> "I would rather rely on the framework's defaults than on my own cleverness — Spring Security escapes, sets security headers and enables CSRF out of the box, so most vulnerabilities come from someone <em>turning that off</em> to make something work. When I disable a protection I document why, and I check that the reason still holds."</p>`
},
{
  q: "How does method-level security work, and how do you implement multi-tenant authorization?",
  level: "advanced", tags: ["authorization", "rbac", "design", "enterprise"],
  companies: ["Amazon", "Optum", "SAP", "Salesforce", "Barclays", "Societe Generale", "EPAM"],
  a: `<pre><code>@Configuration
@EnableMethodSecurity            // Boot 3; replaces @EnableGlobalMethodSecurity
class SecurityConfig { }

@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAll() { }

    // Checked BEFORE the method runs — cheapest, use it where possible
    @PreAuthorize("hasAuthority('SCOPE_orders:write') and #order.tenantId == authentication.principal.tenantId")
    public Order create(OrderRequest order) { }

    // Checked AFTER — necessary when the decision depends on the RESULT.
    // Note this means the work is already done, so it is only an information
    // barrier, not a way to avoid the cost.
    @PostAuthorize("returnObject.ownerId == authentication.name")
    public Order findById(Long id) { }

    // Filters a collection in place
    @PostFilter("filterObject.tenantId == authentication.principal.tenantId")
    public List&lt;Order&gt; findAll() { }
}</code></pre>
<table>
<tr><th>Annotation</th><th>Runs</th><th>Use for</th></tr>
<tr><td><code>@PreAuthorize</code></td><td>Before</td><td>Almost everything — role, scope and argument checks</td></tr>
<tr><td><code>@PostAuthorize</code></td><td>After</td><td>When the check needs the return value</td></tr>
<tr><td><code>@PreFilter</code> / <code>@PostFilter</code></td><td>Around</td><td>Trimming collections — <strong>avoid on large results</strong>, filter in the query instead</td></tr>
<tr><td><code>@Secured</code> / <code>@RolesAllowed</code></td><td>Before</td><td>Simple role checks, no SpEL</td></tr>
</table>
<pre><code>// A custom permission evaluator — the clean way to express domain rules
@Component("orderSecurity")
public class OrderSecurity {
    public boolean canEdit(Authentication auth, Long orderId) {
        Order o = repo.findById(orderId).orElse(null);
        if (o == null) return false;
        return o.getOwnerId().equals(auth.getName())
            || auth.getAuthorities().stream().anyMatch(a -&gt; a.getAuthority().equals("ROLE_ADMIN"));
    }
}

@PreAuthorize("@orderSecurity.canEdit(authentication, #id)")
public Order update(Long id, OrderRequest req) { }
// Keeps SpEL short and puts testable logic in a normal, unit-testable bean.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Layered authorization from filter chain to method to data">
  <rect class="dg-fill" x="16" y="30" width="170" height="40" rx="8"/>
  <text class="dg-s" x="101" y="48" text-anchor="middle">filter chain</text>
  <text class="dg-s" x="101" y="64" text-anchor="middle">URL-level: coarse</text>
  <path class="dg-line" d="M190 50 H228" marker-end="url(#az1)"/>
  <rect class="dg-fill2" x="232" y="30" width="170" height="40" rx="8"/>
  <text class="dg-s" x="317" y="48" text-anchor="middle">@PreAuthorize</text>
  <text class="dg-s" x="317" y="64" text-anchor="middle">method-level: business rules</text>
  <path class="dg-line" d="M406 50 H444" marker-end="url(#az1)"/>
  <rect class="dg-box" x="448" y="30" width="156" height="40" rx="8"/>
  <text class="dg-s" x="526" y="48" text-anchor="middle">data-level</text>
  <text class="dg-s" x="526" y="64" text-anchor="middle">tenant filter in the query</text>
  <text class="dg-s" x="16" y="112">defence in depth — a bug at one layer is caught by the next</text>
  <text class="dg-s" x="16" y="134">the DATA layer is the one that must never be skipped in a multi-tenant system</text>
  <defs><marker id="az1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// MULTI-TENANCY — the only reliable answer is to enforce it in the QUERY,
// not by filtering results after the fact.

// Hibernate filter applied to every query on the entity
@Entity
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Order { }

// Enabled once per request, from the authenticated principal
entityManager.unwrap(Session.class)
    .enableFilter("tenantFilter")
    .setParameter("tenantId", TenantContext.current());

// Strongest option where the database supports it: PostgreSQL row-level security,
// so even a hand-written query or a direct psql session cannot cross tenants.</code></pre>
<p><strong>The principle to state:</strong> "URL-based rules are too coarse for real business logic, and post-filtering a result set means the data was already loaded — one missed <code>@PostFilter</code> and you have a cross-tenant leak. So I put tenant isolation in the data layer where it cannot be forgotten, and use method security for the business rules on top of it. Then I write a test that asserts tenant A cannot read tenant B's data, because that is the test that actually protects you."</p>`
}
]);
