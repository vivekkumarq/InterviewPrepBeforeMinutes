appendTopic("spring-security", [
{
  q: "Explain OAuth2 and OIDC — the flows, and which one to use where",
  level: "advanced", hot: true, tags: ["oauth2", "oidc", "security", "must-know"],
  companies: ["Amazon", "Optum", "SAP", "Barclays", "Societe Generale", "Salesforce", "Goldman Sachs", "Maersk"],
  a: `<table>
<tr><th></th><th>OAuth 2.0</th><th>OpenID Connect</th></tr>
<tr><td>Answers</td><td><strong>Authorisation</strong> — may this app act for the user?</td><td><strong>Authentication</strong> — who is the user?</td></tr>
<tr><td>Returns</td><td>An access token (opaque or JWT)</td><td>An <strong>ID token</strong> (always a JWT) as well</td></tr>
<tr><td>Use for</td><td>Calling an API on someone's behalf</td><td>"Sign in with…"</td></tr>
</table>
<table>
<tr><th>Flow</th><th>Use for</th><th>Notes</th></tr>
<tr><td><strong>Authorization Code + PKCE</strong></td><td><strong>Almost everything</strong> — web apps, SPAs, mobile</td><td>The default. PKCE is now recommended even for confidential clients.</td></tr>
<tr><td><strong>Client Credentials</strong></td><td>Service-to-service, no user</td><td>The one you use most inside a microservice estate</td></tr>
<tr><td>Device Code</td><td>TVs, CLIs, input-constrained devices</td><td>User authorises on a second device</td></tr>
<tr><td>Refresh Token</td><td>Renewing without re-login</td><td><strong>Rotate</strong> it, with reuse detection</td></tr>
<tr><td>❌ Implicit</td><td>—</td><td><strong>Deprecated</strong> — token in the URL fragment, leaks via history and referrers</td></tr>
<tr><td>❌ Password (ROPC)</td><td>—</td><td><strong>Deprecated</strong> — the app handles the password, defeating the point</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Authorization code flow with PKCE">
  <rect class="dg-box" x="16" y="20" width="96" height="30" rx="6"/><text class="dg-s" x="64" y="40" text-anchor="middle">browser</text>
  <rect class="dg-fill" x="250" y="20" width="110" height="30" rx="6"/><text class="dg-s" x="305" y="40" text-anchor="middle">your app</text>
  <rect class="dg-fill2" x="470" y="20" width="130" height="30" rx="6"/><text class="dg-s" x="535" y="40" text-anchor="middle">auth server</text>
  <path class="dg-line" d="M64 54 V70 H535 V58" marker-end="url(#oa1)"/>
  <text class="dg-s" x="290" y="66" text-anchor="middle">1. redirect with code_challenge</text>
  <path class="dg-line" d="M535 78 V94 H64 V82" marker-end="url(#oa1)"/>
  <text class="dg-s" x="290" y="90" text-anchor="middle">2. login, then redirect back with a CODE</text>
  <path class="dg-line" d="M305 102 V118 H535 V106" marker-end="url(#oa1)"/>
  <text class="dg-s" x="420" y="114" text-anchor="middle">3. code + code_verifier</text>
  <path class="dg-line" d="M535 126 V142 H305 V130" marker-end="url(#oa1)"/>
  <text class="dg-s" x="420" y="138" text-anchor="middle">4. tokens</text>
  <text class="dg-s" x="16" y="160">PKCE binds the code to whoever started the flow, so a stolen code is useless</text>
  <defs><marker id="oa1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code># Resource server — validate tokens, that is all
spring.security.oauth2.resourceserver.jwt.issuer-uri: https://auth.example.com
# Fetches the JWKS, caches it, rotates keys on kid change. Nothing to write.

# Client — for "sign in with", or for calling another service
spring.security.oauth2.client.registration.keycloak:
  client-id: orders
  client-secret: \${OIDC_SECRET}
  authorization-grant-type: authorization_code
  scope: openid,profile,email</code></pre>
<pre><code>// Map the token's claims to Spring authorities
@Bean JwtAuthenticationConverter converter() {
    var roles = new JwtGrantedAuthoritiesConverter();
    roles.setAuthorityPrefix("ROLE_");
    roles.setAuthoritiesClaimName("realm_access.roles");   // Keycloak's shape
    var conv = new JwtAuthenticationConverter();
    conv.setJwtGrantedAuthoritiesConverter(roles);
    return conv;
}
// Default prefixes: SCOPE_ from the "scope" claim, ROLE_ for hasRole().</code></pre>
<p><strong>The two validations people skip:</strong> <code>aud</code> — a token minted for another service must not be accepted by yours; and the <code>alg</code> header — it must be <em>checked against what you expect</em>, never trusted from the token. Accepting <code>alg: none</code>, or accepting HS256 where you expected RS256, is the classic JWT vulnerability.</p>`
},
{
  q: "How do you secure secrets and dependencies in a Java service?",
  level: "advanced", tags: ["security", "supply-chain", "production", "best-practice"],
  companies: ["Amazon", "Barclays", "Goldman Sachs", "SAP", "Optum", "Maersk", "Deloitte", "Societe Generale"],
  a: `<table>
<tr><th>Secret lives</th><th>Verdict</th></tr>
<tr><td>In <code>application.yml</code>, committed</td><td><strong>Never.</strong> Git history is forever — rotating is the only fix.</td></tr>
<tr><td>Env var from a Kubernetes Secret</td><td>Better, but Secrets are only base64 and land in <code>describe</code> output</td></tr>
<tr><td>Mounted file from a Secret</td><td>Better again — not in <code>/proc</code> or crash dumps</td></tr>
<tr><td><strong>Vault / Secrets Manager via CSI or the operator</strong></td><td><strong>Best</strong> — rotation, audit, short-lived credentials</td></tr>
<tr><td><strong>Workload identity</strong> (IRSA, Workload Identity)</td><td><strong>Best of all</strong> — no stored credential exists to steal</td></tr>
</table>
<pre><code># Find what has already leaked, before an attacker does
gitleaks detect --source . --redact
trufflehog git file://. --only-verified

# Once a secret is in history, ROTATE it. Rewriting history does not help —
# forks, clones, CI caches and mirrors all still have it.</code></pre>
<pre><code># Supply chain — the attack surface most teams under-weight
mvn org.owasp:dependency-check-maven:check      # known CVEs
mvn versions:display-dependency-updates
syft packages . -o spdx-json &gt; sbom.json         # an SBOM you can query later
grype sbom:sbom.json                             # scan that SBOM
trivy image myapp:1.0                            # image + OS packages

# In CI, fail the build on high severity — a report nobody reads is theatre.</code></pre>
<table>
<tr><th>Control</th><th>Stops</th></tr>
<tr><td>Pin dependency versions; commit the lockfile</td><td>A malicious release landing silently</td></tr>
<tr><td>Pin base images <strong>by digest</strong></td><td>A mutable tag changing under you</td></tr>
<tr><td>Renovate/Dependabot + weekly rebuilds</td><td>Sitting on a known CVE for months</td></tr>
<tr><td>Run as a non-root user; read-only root filesystem</td><td>Escalation after a compromise</td></tr>
<tr><td>Sign artefacts (Sigstore/cosign), verify on deploy</td><td>A tampered image reaching production</td></tr>
<tr><td>Least-privilege DB user</td><td>An injection becoming a full database dump</td></tr>
</table>
<pre><code>// Spring Boot: keep secrets out of the places that echo config
management.endpoint.env.show-values: never       # /actuator/env redacts by default
                                                  // for keys matching password,
                                                  // secret, key, token — do not
                                                  // name a secret "cfg1"

// And never log them. A logging filter that dumps request bodies will happily
// log an Authorization header on the day you most regret it.</code></pre>
<p><strong>The framing that lands:</strong> "Most breaches I have read about were not clever cryptography attacks — they were a leaked credential, an unpatched dependency, or an over-permissioned role. So I spend the effort on rotation, scanning and least privilege, and I treat 'we will remember not to commit it' as a control that does not exist."</p>`
}
]);
