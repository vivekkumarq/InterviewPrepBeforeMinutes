registerSimple("spring-security", {
"How do you implement refresh tokens with rotation?":
`An access token is short-lived (minutes), so if it is stolen the damage is limited. A refresh token lives longer and is used only to get new access tokens, so users stay logged in. With rotation, every refresh returns a brand-new refresh token and the old one stops working. If an old one is ever used again, someone stole it, so you log that user out everywhere.`,

"What is the difference between authentication providers, UserDetailsService and AuthenticationManager?":
`The <b>AuthenticationManager</b> is the front desk that receives login attempts. It hands each attempt to an <b>AuthenticationProvider</b> that knows how to check one kind of login, such as username and password. That provider uses a <b>UserDetailsService</b> to load the user's stored details (password hash and roles) from your database.`,

"How do you prevent common attacks — brute force, session fixation, clickjacking?":
`<b>Brute force</b> (guessing passwords over and over): limit attempts, slow down repeated failures and add multi-factor login. <b>Session fixation</b> (an attacker planting a session id before you log in): give the user a new session id after login. <b>Clickjacking</b> (your site hidden inside another site to trick clicks): send headers that forbid other sites from framing yours.`,

"How does Spring Security handle password encoding and migration between algorithms?":
`Spring stores each password hash with a prefix naming the algorithm, such as <code>{bcrypt}</code>. That lets it check old hashes made with an older algorithm and new ones side by side. When a user logs in successfully, you can quietly re-hash their password with the newer algorithm, so everyone is migrated without a forced password reset.`,

"What is the difference between authorization at the URL level and method level?":
`URL-level rules live in the security configuration and check paths, such as "only admins may call /admin/**". Method-level rules use annotations like <code>@PreAuthorize</code> directly on service methods and can check details such as "is this user the owner of this order?". Use URL rules for broad access and method rules for fine-grained decisions.`,

"How do you secure service-to-service communication?":
`Services should prove who they are to each other, not just trust anything on the internal network. Common ways: each service gets its own OAuth2 token (the client credentials flow), mutual TLS where both sides present certificates, and network policies that limit who can reach whom. Often several are combined.`,

"What are the security considerations for a REST API's error responses and logging?":
`Error messages can leak useful information to attackers: stack traces reveal your code, and "user not found" versus "wrong password" tells them which accounts exist. Return generic messages with a reference id, keep the details in your logs, and never log passwords, tokens or other secrets.`,

"How do you implement API key authentication for machine clients?":
`An API key is a long random secret that a program sends with each request. Store only a hash of each key (like a password), show the key once when it is created, let clients rotate keys, and check each key in a security filter. Keys suit machine-to-machine calls; people should log in with proper user accounts.`,

"How do you handle security in a reactive (WebFlux) application?":
`In normal Spring, the current user is stored per thread. In WebFlux one request can hop between threads, so the user is stored in the reactive context instead, and you use reactive versions of the security setup and methods. The rules are the same; only the plumbing differs.`,

"What is the OAuth2 authorization code flow with PKCE, step by step?":
`The app sends the user to the login server. After the user logs in, the login server sends the app a short-lived code, and the app exchanges that code for tokens behind the scenes. PKCE adds a one-time secret the app creates at the start and proves it holds at the end, so a stolen code is useless to anyone else. It is the recommended flow for web and mobile apps.`,

"How do you secure secrets and configuration in a Spring Boot application?":
`Never put passwords or API keys in code or in Git. Pass them as environment variables at minimum, and better, keep them in a secret manager such as Vault or a cloud secrets service that controls access, logs who read them and makes rotation easy. Treat any secret that was ever committed as leaked, and replace it.`,

"Walk me through a complete JWT login and request-validation flow in Spring Boot":
`The user logs in with a username and password, and the server checks them and returns a signed JWT. On every later request, the client sends that token in a header. A security filter checks the signature and expiry, reads the user's id and roles from the token, and lets the request through. The server does not need to store any session.`,

"How do you implement role-based and permission-based access control together?":
`Give users roles (such as SUPPORT), give roles permissions (such as "issue refunds"), and check permissions in your code rather than role names. Then, when the business says support staff may now issue refunds, you just add that permission to the role, without editing any code.`,

"What is the difference between authentication and authorization failures, and which status codes?":
`<b>401 Unauthorized</b> means authentication failed: there is no token, or it is invalid or expired, so the server does not know who you are. <b>403 Forbidden</b> means authorization failed: the server knows who you are, but you are not allowed to do this. The name 401 is misleading; it really means "unauthenticated".`,

"How would you secure a REST API end to end — give the full checklist":
`Use HTTPS everywhere, authenticate every request (usually with short-lived tokens), check permissions and ownership on every action, validate all input, rate-limit to stop abuse, return safe error messages, keep secrets out of code, keep libraries updated, and log security events so you can spot attacks.`,

"How do you test Spring Security configuration?":
`Write tests that call your endpoints as different users. Spring provides helpers like <code>@WithMockUser</code> to pretend to be a user with certain roles, and MockMvc to send requests. Test that anonymous users get 401, users without permission get 403, and that a user cannot access someone else's data.`,

"What is the difference between stateless and stateful authentication at scale?":
`<b>Stateful</b>: the server remembers who is logged in (a session), so with many servers they must share that memory, often in Redis. <b>Stateless</b>: each request carries a signed token proving who you are, so any server can handle it without shared storage. Stateless scales more easily, but logging someone out instantly is harder.`,

"How do you store and rotate JWTs safely — and where should the token actually live?":
`In the browser, storing tokens in localStorage is risky, because any malicious script injected into the page can read them. A safer approach is an HttpOnly cookie, which scripts cannot read, combined with CSRF protection. Keep access tokens short-lived and rotate refresh tokens so a stolen one stops working quickly.`,

"How do you prevent SQL injection, XSS and CSRF in a Spring application?":
`<b>SQL injection</b>: never build SQL by joining strings; use parameters, which JPA and JdbcTemplate do for you. <b>XSS</b> (malicious scripts in pages): escape user content when displaying it and add a content security policy. <b>CSRF</b> (tricking a logged-in browser into sending a request): keep Spring's CSRF protection on for cookie-based logins.`,

"How does method-level security work, and how do you implement multi-tenant authorization?":
`Annotations like <code>@PreAuthorize("hasRole('ADMIN')")</code> on a method make Spring check permissions before the method runs. For multi-tenant apps, where several companies share one system, you also check that the data being accessed belongs to the user's company, either in those annotations or by always filtering queries by company id.`,

"Explain OAuth2 and OIDC — the flows, and which one to use where":
`<b>OAuth2</b> is about permission: it lets an app act on a user's behalf without seeing their password, using access tokens. <b>OIDC</b> adds identity on top, giving an ID token that says who the user is. Use the authorization code flow with PKCE for web and mobile apps, and the client credentials flow for service-to-service calls.`,

"How do you secure secrets and dependencies in a Java service?":
`Keep secrets in a secret manager rather than code or plain config files, give each service only the secrets it needs, and rotate them. For dependencies, scan libraries for known vulnerabilities in your build (for example with OWASP Dependency-Check or Dependabot) and update them regularly.`,

"A user can see another user's order by changing the id in the URL. How do you fix it?":
`The API checked that someone was logged in, but not that the order belongs to them. That bug is called IDOR. The fix is to always check ownership: look up the order by both its id and the current user's id, or use a permission check that compares the owner. Return 404 rather than 403 so you do not even reveal that the order exists.`,

"Every request returns 403 after you add Spring Security. How do you debug it?":
`Turn on detailed security logging (<code>logging.level.org.springframework.security=TRACE</code>), which tells you which filter rejected the request. The usual causes: CSRF protection blocking POST requests, a role-name mismatch (<code>hasRole("ADMIN")</code> expects "ROLE_ADMIN"), rules in the wrong order, the <code>/error</code> page itself being protected, or the browser's CORS pre-check being blocked.`,

"What is the difference between authentication and authorization?":
`<b>Authentication</b> checks who you are, for example with a password or a token. <b>Authorization</b> checks what you are allowed to do once your identity is known, for example only admins may delete users. Authentication always comes first.`,

"How does the Spring Security filter chain work?":
`Spring Security puts a chain of filters in front of your application. Every request passes through them in order: some handle CORS and CSRF, one authenticates the user, another checks permissions. If a filter rejects the request, it stops there and never reaches your controller.`,

"How do you configure Spring Security in a modern Spring Boot 3 application?":
`You define a <code>SecurityFilterChain</code> bean (the old WebSecurityConfigurerAdapter class is gone). Inside it you list your rules with <code>authorizeHttpRequests</code>, from most specific to most general, ending with <code>anyRequest().authenticated()</code>, and choose how users log in, for example with JWT tokens or a login form.`,

"How does JWT authentication work? Walk through the flow.":
`After login, the server gives the client a JWT: a small piece of text containing the user's id and roles, plus a signature only the server (or the login server) can create. The client sends it with each request, and the server checks the signature and expiry to trust it, without looking anything up in a database.`,

"What are the security considerations and pitfalls with JWT?":
`Tokens cannot easily be cancelled before they expire, so keep them short-lived. Always check the signature with the algorithm you expect, and never accept "none". Never put secrets in the payload, because anyone can read it; it is only signed, not encrypted. And store tokens carefully in the browser.`,

"Session-based vs token-based authentication":
`With <b>sessions</b>, the server remembers who is logged in and the browser holds a cookie with the session id; it is easy to log someone out, but servers must share session storage. With <b>tokens</b> (JWT), the client holds a signed token and any server can check it, which scales easily, but cancelling a token early is harder.`,

"How does OAuth2 work and what are the grant types?":
`OAuth2 lets an app get permission to act for a user without ever seeing their password. The user logs in at a trusted login server, which gives the app an access token. The main grant types are the authorization code flow (with PKCE) for web and mobile apps, client credentials for service-to-service calls, and refresh tokens for getting new access tokens.`,

"How do you integrate Keycloak with Spring Boot?":
`Keycloak is a ready-made login server that handles users, passwords, single sign-on and roles. Your Spring Boot app becomes a "resource server": you point it at Keycloak's address in the configuration, and Spring automatically checks the tokens Keycloak issues and reads the user's roles from them.`,

"What is CSRF and when do you need protection?":
`CSRF (cross-site request forgery) tricks your logged-in browser into sending a request to a site, for example from a hidden form on a malicious page. It works because browsers send cookies automatically. You need CSRF protection when users log in with cookies. APIs that use tokens in headers, which browsers do not send automatically, do not need it.`,

"How do you secure passwords? Explain hashing vs encryption.":
`<b>Encryption</b> can be reversed with a key; <b>hashing</b> is one-way and cannot. Passwords must be hashed, so even if the database leaks nobody can recover them. Use a slow algorithm designed for passwords, such as BCrypt or Argon2, which adds a random "salt" and makes guessing billions of passwords impractical.`,

"What is method-level security — @PreAuthorize vs @Secured?":
`Both protect individual methods. <code>@Secured("ROLE_ADMIN")</code> only checks role names. <code>@PreAuthorize</code> accepts expressions, so it can also check the method's arguments, such as "is this user the owner of this order?". <code>@PreAuthorize</code> is more powerful and is the usual choice.`,

"How do you implement role-based access control (RBAC)?":
`Give each user one or more roles (like ADMIN or SUPPORT), give each role a set of permissions (like "view orders" or "issue refunds"), and check permissions in your code. Keep role and permission assignments in the database so they can change without code changes.`,

"What is CORS and how do you configure it correctly?":
`Browsers block a web page from reading responses from a different website unless that website allows it. CORS is how your API says which websites may call it. List the exact origins you trust instead of allowing everyone, and remember that the browser first sends a "preflight" OPTIONS request, which must be allowed too.`,

"What are the OWASP Top 10 risks and how do you defend against them in Spring?":
`OWASP Top 10 is a list of the most common web security problems. The biggest: broken access control (users reaching data they should not), weak cryptography, injection attacks, insecure design, bad configuration, outdated libraries and weak authentication. In Spring the main defences are deny-by-default rules, ownership checks, parameterised queries, strong password hashing and keeping libraries up to date.`,

"How do you handle authentication in a microservices architecture?":
`A central login server (such as Keycloak or Auth0) authenticates users and issues signed tokens. The API gateway checks tokens on the way in, and every service checks them again before trusting them. The token is passed along between services, and services also prove their own identity when calling each other.`,

"What is the SecurityContextHolder and how does it work with threads?":
`<code>SecurityContextHolder</code> holds the currently logged-in user for the request being handled. By default it is stored per thread, so if you start work on another thread (for example with @Async), that thread does not automatically know the user, and you have to pass the security context along.`,

"How do you prevent SQL injection and XSS in a Spring application?":
`For SQL injection, never put user input directly into SQL text; use parameters, which keep data and commands separate (JPA and JdbcTemplate do this). For XSS, never insert user input into a web page as raw HTML; escape it, which template engines like Thymeleaf do by default, and add a content security policy header.`
});
