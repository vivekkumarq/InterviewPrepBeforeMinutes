registerPrimer("spring-security", `<h3>The mental model: a line of guards before your controller</h3>
<p>Spring Security is a chain of <strong>servlet filters</strong> that every request passes through before it reaches your controller. Each filter does one job. One filter reads a token or a session and works out <strong>who you are</strong> (authentication). A later one decides whether that person <strong>may do this</strong> (authorization). If any guard says no, the request is turned away and your controller never runs.</p>
<p>The result of authentication is stored in the <code>SecurityContext</code> for the rest of the request, so your code can ask "who is calling?" at any point.</p>
<figure class="fig">
<svg viewBox="0 0 620 232" role="img" aria-label="Spring Security filter chain: CORS, CSRF, authentication filter, exception translation and authorization filter before the controller">
  <defs><marker id="pr-ss" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="36" width="70" height="50" rx="8"/>
  <text class="dg-t" x="45" y="58" text-anchor="middle">Request</text>
  <text class="dg-s" x="45" y="74" text-anchor="middle">+ Bearer</text>
  <line class="dg-line" x1="80" y1="61" x2="96" y2="61" marker-end="url(#pr-ss)"/>
  <rect class="dg-box" x="98" y="36" width="72" height="50" rx="8"/>
  <text class="dg-t" x="134" y="58" text-anchor="middle">CORS</text>
  <text class="dg-s" x="134" y="74" text-anchor="middle">origin ok?</text>
  <line class="dg-line" x1="170" y1="61" x2="186" y2="61" marker-end="url(#pr-ss)"/>
  <rect class="dg-box" x="188" y="36" width="72" height="50" rx="8"/>
  <text class="dg-t" x="224" y="58" text-anchor="middle">CSRF</text>
  <text class="dg-s" x="224" y="74" text-anchor="middle">off for APIs</text>
  <line class="dg-line" x1="260" y1="61" x2="276" y2="61" marker-end="url(#pr-ss)"/>
  <rect class="dg-fill" x="278" y="36" width="104" height="50" rx="8"/>
  <text class="dg-t" x="330" y="58" text-anchor="middle">Authentication</text>
  <text class="dg-s" x="330" y="74" text-anchor="middle">who are you?</text>
  <line class="dg-line" x1="382" y1="61" x2="398" y2="61" marker-end="url(#pr-ss)"/>
  <rect class="dg-fill2" x="400" y="36" width="104" height="50" rx="8"/>
  <text class="dg-t" x="452" y="58" text-anchor="middle">Authorization</text>
  <text class="dg-s" x="452" y="74" text-anchor="middle">may you do this?</text>
  <line class="dg-line" x1="504" y1="61" x2="520" y2="61" marker-end="url(#pr-ss)"/>
  <rect class="dg-fill" x="522" y="36" width="88" height="50" rx="8"/>
  <text class="dg-t" x="566" y="58" text-anchor="middle">Controller</text>
  <text class="dg-s" x="566" y="74" text-anchor="middle">your code</text>
  <line class="dg-line" x1="330" y1="86" x2="330" y2="120" marker-end="url(#pr-ss)"/>
  <rect class="dg-box" x="262" y="122" width="136" height="44" rx="8"/>
  <text class="dg-t" x="330" y="141" text-anchor="middle">SecurityContext</text>
  <text class="dg-s" x="330" y="157" text-anchor="middle">user + authorities</text>
  <line class="dg-line" x1="330" y1="36" x2="330" y2="14"/>
  <text class="dg-s" x="342" y="20">bad or missing token -&gt; 401 Unauthorized</text>
  <line class="dg-line" x1="452" y1="86" x2="452" y2="186"/>
  <text class="dg-s" x="462" y="190">wrong role -&gt; 403 Forbidden</text>
  <text class="dg-s" x="10" y="220">401 means "I do not know who you are". 403 means "I know who you are, and the answer is no".</text>
</svg>
<figcaption>A simplified chain. The real one has around fifteen filters, but these are the ones that decide most outcomes.</figcaption>
</figure>
<h3>Worked example: a stateless JWT API in one configuration class</h3>
<pre><code>@Configuration
@EnableMethodSecurity                                   // enables @PreAuthorize
class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -&gt; csrf.disable())               // no cookies = no CSRF risk
            .sessionManagement(s -&gt; s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -&gt; auth
                .requestMatchers("/actuator/health", "/public/**").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/orders/**").hasRole("ADMIN")
                .anyRequest().authenticated())          // the safe default: deny
            .oauth2ResourceServer(o -&gt; o.jwt(Customizer.withDefaults()))
            .build();                                   // validates the JWT signature,
    }                                                   // expiry and issuer for you
}

# application.yml: where to fetch the signing keys
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/shop</code></pre>
<pre><code>// Using the result in your code
@GetMapping("/me")
Profile me(@AuthenticationPrincipal Jwt jwt) {
    return profiles.find(jwt.getSubject());             // the user id from the token
}

@PreAuthorize("hasAuthority('SCOPE_orders:write')")   // method-level check
public void cancel(long orderId) { ... }</code></pre>
<h3>Words that interviewers expect you to keep apart</h3>
<table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td>Authentication</td><td>Proving identity: password, token, certificate</td></tr>
<tr><td>Authorization</td><td>Deciding access for an identity already known</td></tr>
<tr><td>Principal</td><td>The authenticated user (or service)</td></tr>
<tr><td>Authority vs role</td><td>A role is an authority whose name starts with <code>ROLE_</code>. <code>hasRole("ADMIN")</code> checks for <code>ROLE_ADMIN</code></td></tr>
<tr><td>Hashing vs encryption</td><td>Passwords are hashed (one way, BCrypt/Argon2). Encryption is reversible and is wrong for passwords</td></tr>
</table>`);

appendTopic("spring-security", [
{
  q: "A user can see another user's order by changing the id in the URL. How do you fix it?",
  level: "advanced", hot: true, tags: ["authorization", "idor", "owasp", "must-know"],
  companies: ["Amazon", "Razorpay", "PhonePe", "Paytm", "Flipkart", "Swiggy", "Goldman Sachs"],
  a: `<p>This bug is called <strong>IDOR</strong> (Insecure Direct Object Reference), and it sits under <strong>Broken Access Control</strong>, which is number one in the OWASP Top 10. It is extremely common because the code looks secure: the endpoint requires login, so it feels protected. But being logged in only proves <em>who</em> you are. Nobody checked that the order is <em>yours</em>.</p>
<pre><code>// VULNERABLE: any logged-in user can read any order
@GetMapping("/orders/{id}")
OrderDto get(@PathVariable long id) {
    return OrderDto.from(orders.findById(id).orElseThrow());
}

// Attack: log in as yourself, open /orders/1041 (yours), then try /orders/1040,
// /orders/1039 ... Sequential ids make it trivial to download every order.</code></pre>
<p><strong>Fix 1 (best): put the owner in the query.</strong> The database only ever returns rows the caller owns, so there is nothing to forget.</p>
<pre><code>interface OrderRepository extends JpaRepository&lt;Order, Long&gt; {
    Optional&lt;Order&gt; findByIdAndCustomerId(long id, String customerId);
}

@GetMapping("/orders/{id}")
OrderDto get(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
    return orders.findByIdAndCustomerId(id, jwt.getSubject())
                 .map(OrderDto::from)
                 .orElseThrow(() -&gt; new ResponseStatusException(HttpStatus.NOT_FOUND));
}
// 404, not 403: a 403 confirms "this order exists, it just is not yours",
// which tells an attacker which ids are real.</code></pre>
<p><strong>Fix 2: a method-level rule</strong>, when the check is more complex than ownership (a support agent may read orders in their region, a manager may read their team's).</p>
<pre><code>@Component("orderAccess")
class OrderAccess {
    private final OrderRepository orders;
    OrderAccess(OrderRepository orders) { this.orders = orders; }

    boolean canRead(long orderId, Authentication auth) {
        if (auth.getAuthorities().stream().anyMatch(a -&gt; a.getAuthority().equals("ROLE_SUPPORT")))
            return true;
        return orders.existsByIdAndCustomerId(orderId, auth.getName());
    }
}

@PreAuthorize("@orderAccess.canRead(#id, authentication)")
@GetMapping("/orders/{id}")
OrderDto get(@PathVariable long id) { ... }</code></pre>
<table>
<tr><th>Defence</th><th>What it does</th><th>Enough on its own?</th></tr>
<tr><td><strong>Owner in the query</strong></td><td>Makes other users' data unreachable</td><td>Yes, for simple ownership</td></tr>
<tr><td><code>@PreAuthorize</code> with a bean</td><td>Central, testable rule for complex access</td><td>Yes, if applied to every entry point</td></tr>
<tr><td>Random UUIDs instead of 1, 2, 3</td><td>Makes ids hard to guess</td><td><strong>No</strong>. Ids leak through logs, emails and shared links. It only slows an attacker down</td></tr>
<tr><td>Hiding the link in the UI</td><td>Nothing, security-wise</td><td><strong>No</strong>. Attackers call the API directly</td></tr>
</table>
<pre><code>// The test that catches this, and belongs next to every such endpoint
@Test
@WithMockUser(username = "bob")
void cannotReadSomeoneElsesOrder() throws Exception {
    long alicesOrder = givenOrderOwnedBy("alice");
    mvc.perform(get("/orders/" + alicesOrder)).andExpect(status().isNotFound());
}</code></pre>
<p><strong>Where else the same bug hides:</strong> updates and deletes (<code>PUT /orders/{id}</code>), file downloads (<code>/invoices/{id}.pdf</code>), nested resources (<code>/users/{userId}/addresses</code> where the userId in the path is trusted), and bulk endpoints that accept a list of ids. The rule is always the same: <strong>never trust an id from the client to decide ownership. Derive the owner from the authenticated principal.</strong></p>`
},
{
  q: "Every request returns 403 after you add Spring Security. How do you debug it?",
  level: "beginner", hot: true, tags: ["debugging", "csrf", "roles", "configuration", "must-know"],
  companies: ["Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Capgemini", "Amazon"],
  a: `<p>A 403 with no explanation is the most common Spring Security complaint. The good news: there are only a handful of causes, and Spring will tell you which one if you ask it to.</p>
<pre><code># Step 1, always: make Spring Security explain itself
logging:
  level:
    org.springframework.security: TRACE

# The log now shows every filter the request passed and why it was stopped:
#   Invoking CsrfFilter (5/15)
#   Invalid CSRF token found for http://localhost:8080/orders
#   Responding with 403 status code</code></pre>
<p><strong>Cause 1: CSRF on POST, PUT and DELETE.</strong> CSRF protection is on by default. GET requests work, but every POST from Postman or another service returns 403 because it carries no CSRF token. This is the answer most of the time.</p>
<pre><code>// For a stateless API that uses bearer tokens (no cookies), CSRF is not a
// risk, so turn it off:
http.csrf(csrf -&gt; csrf.disable());
// Keep it ON for browser apps that log in with a session cookie. That is
// exactly the attack CSRF protection exists to stop.</code></pre>
<p><strong>Cause 2: role name mismatch.</strong></p>
<pre><code>.requestMatchers("/admin/**").hasRole("ADMIN")   // checks for authority "ROLE_ADMIN"

// ...but the JWT has "roles": ["ADMIN"], mapped as authority "ADMIN" (no prefix),
// or scopes, mapped as "SCOPE_admin". None of them equal "ROLE_ADMIN".

.requestMatchers("/admin/**").hasAuthority("SCOPE_admin")    // match what is really there
// Find out what IS there: log authentication.getAuthorities() in a test endpoint.</code></pre>
<p><strong>Cause 3: matcher order.</strong> Rules are checked top to bottom and the first match wins.</p>
<pre><code>.authorizeHttpRequests(auth -&gt; auth
    .anyRequest().authenticated()                 // matches EVERYTHING
    .requestMatchers("/public/**").permitAll())   // never reached
// Spring actually refuses to start with anyRequest() before other matchers,
// but the same trap applies to broad patterns: put "/api/admin/**" BEFORE "/api/**".</code></pre>
<p><strong>Cause 4: the error page itself is secured.</strong> Your controller throws, Spring forwards to <code>/error</code>, that path is not permitted, and the real 500 becomes a confusing 403 (or 401). Permit it:</p>
<pre><code>.requestMatchers("/error").permitAll()</code></pre>
<p><strong>Cause 5: CORS preflight.</strong> The browser sends an <code>OPTIONS</code> request first, it is rejected, and the real call never happens. The console says "CORS error", the network tab shows 403 on the OPTIONS. Configure <code>http.cors(...)</code> with a <code>CorsConfigurationSource</code> bean so the CORS filter answers preflights before authorization runs.</p>
<table>
<tr><th>Symptom</th><th>Likely cause</th></tr>
<tr><td>GET works, POST/PUT/DELETE get 403</td><td>CSRF</td></tr>
<tr><td>Logged in, but admin routes are 403</td><td><code>hasRole</code> vs the real authority names</td></tr>
<tr><td>A route you permitted is still blocked</td><td>A broader matcher above it</td></tr>
<tr><td>Errors show up as 403 instead of 500</td><td><code>/error</code> not permitted</td></tr>
<tr><td>Works in Postman, fails in the browser</td><td>CORS preflight</td></tr>
<tr><td>401 rather than 403</td><td>Not authenticated at all: missing or invalid token, wrong issuer, expired</td></tr>
</table>
<p><strong>The answer to give:</strong> "Turn on TRACE logging for Spring Security, which names the filter that rejected the request. Nine times out of ten it is CSRF on a POST, or a role-prefix mismatch between <code>hasRole</code> and the authorities in the token."</p>`
}
]);
