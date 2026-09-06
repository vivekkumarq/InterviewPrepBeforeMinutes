appendTopic("cicd", [
{
  q: "How do you resolve a merge conflict and what causes them?",
  level: "beginner", hot: true, tags: ["git"],
  a: `<pre><code>git merge main
# CONFLICT (content): Merge conflict in src/main/java/OrderService.java

git status                       # list conflicted files
git diff                         # see the conflict markers

# In the file:
&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
    int timeout = 30;            # your branch
=======
    int timeout = 60;            # incoming (main)
&gt;&gt;&gt;&gt;&gt;&gt;&gt; main

# Edit to the correct result, remove ALL markers, then:
git add src/main/java/OrderService.java
git merge --continue             # or: git rebase --continue

# Escape hatches
git merge --abort                # back to before the merge
git checkout --ours   file       # keep your version entirely
git checkout --theirs file       # keep theirs entirely
git rerere                       # REuse REcorded REsolution — replays past resolutions</code></pre>
<p><strong>What actually causes them:</strong> two branches changing the same lines, or one deleting a file the other modified. The root cause is almost always <strong>long-lived branches</strong> — a branch alive for three weeks diverges far enough that the merge becomes an archaeology exercise.</p>
<p><strong>Prevention is the real answer:</strong> short-lived branches merged daily, small pull requests, rebasing on main frequently (<code>git pull --rebase</code>), and agreeing on formatting so a reformatting commit does not conflict with everything. <code>git rerere</code> is genuinely useful during a long rebase, since it remembers how you resolved a conflict and replays it.</p>
<p><strong>Two things worth stating in an interview:</strong> during a conflicting <em>rebase</em>, "ours" and "theirs" are reversed relative to a merge — because the rebase replays your commits onto the other branch, so "ours" is the upstream. And after resolving, <strong>run the tests</strong>: a syntactically clean merge can still be semantically wrong when both sides changed related logic in different files, which no merge tool can detect.</p>`
},
{
  q: "What is trunk-based development and how do feature flags support it?",
  level: "advanced", hot: true, tags: ["process"],
  a: `<p><strong>Trunk-based development:</strong> everyone commits to main at least daily, branches live hours rather than weeks, and main is always releasable. It is the branching model most strongly correlated with high DORA performance.</p>
<p><strong>The obvious objection — "how do you merge unfinished work?" — is answered by feature flags:</strong></p>
<pre><code>@Service
@RequiredArgsConstructor
public class CheckoutService {
    private final FeatureFlags flags;

    public Receipt checkout(Order order) {
        if (flags.isEnabled("new-pricing-engine", order.customerId())) {
            return newPricingEngine.price(order);      // merged, deployed, off for most users
        }
        return legacyPricing.price(order);
    }
}</code></pre>
<p><strong>What this decouples:</strong> <em>deployment</em> (code reaches production) from <em>release</em> (users see the behaviour). You can merge incomplete work safely, enable it for internal staff first, then 1% of users, then everyone — and turn it off in seconds without a rollback if metrics degrade. That kill switch is often more valuable than the gradual rollout.</p>
<p><strong>Techniques that make trunk-based work for larger changes:</strong></p>
<ul>
<li><strong>Branch by abstraction</strong> — introduce an interface over the old implementation, add the new one behind it, migrate callers incrementally, then delete the old one. Every step is mergeable.</li>
<li><strong>Expand and contract</strong> for database and API changes.</li>
<li><strong>Dark launching</strong> — run the new code path in production without using its result, and compare against the old one to validate correctness at real scale.</li>
</ul>
<p><strong>The cost to acknowledge:</strong> flags are technical debt with a shelf life. Every flag doubles the code paths to test, and a codebase with 200 stale flags is unmaintainable. Give each one an owner and a removal date, track flag age, and make deleting the flag part of the definition of done. Tools: Unleash, Flagsmith, LaunchDarkly, or a simple database-backed table for a small team.</p>`
},
{
  q: "How do you structure a monorepo pipeline?",
  level: "advanced", tags: ["pipeline", "monorepo"],
  a: `<p>The defining problem: a naive monorepo pipeline builds and tests <em>everything</em> on every commit, so a README change takes forty minutes. The solution is <strong>affected-project detection</strong>.</p>
<pre><code># GitHub Actions — path filters decide which jobs run
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      order-service: \${{ steps.filter.outputs.order-service }}
      shared-lib:    \${{ steps.filter.outputs.shared-lib }}
    steps:
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            order-service:
              - 'services/order-service/**'
              - 'libs/shared/**'          # a shared lib change affects its consumers
            shared-lib:
              - 'libs/shared/**'

  build-order-service:
    needs: changes
    if: needs.changes.outputs.order-service == 'true'
    runs-on: ubuntu-latest
    steps: [ ... ]</code></pre>
<p><strong>Beyond path filters</strong>, build tools that understand the dependency graph do this properly — Nx, Bazel, Gradle with build caching, or Turborepo. They compute exactly which projects are affected by a change set, and cache task outputs so unchanged projects are not rebuilt at all.</p>
<pre><code>nx affected --target=test --base=origin/main      # only what actually changed
./gradlew build --build-cache                      # reuse outputs across machines</code></pre>
<table>
<tr><th>Monorepo</th><th>Polyrepo</th></tr>
<tr><td>Atomic cross-service changes in one PR</td><td>Coordinated PRs across repos</td></tr>
<tr><td>One version of shared libraries — no dependency hell</td><td>Independent versioning and release cadence</td></tr>
<tr><td>Easy large-scale refactoring</td><td>Refactors span repos</td></tr>
<tr><td>Needs tooling to stay fast</td><td>Simple, fast CI by default</td></tr>
<tr><td>Access control is coarse</td><td>Per-repo permissions</td></tr>
</table>
<p><strong>The honest framing:</strong> a monorepo is excellent when services share code and change together, and it makes "update the shared DTO and every consumer in one commit" trivial. But it <em>requires</em> investment in build tooling and CODEOWNERS; without affected-detection and caching, developer experience degrades as the repo grows. Choose based on whether your team is prepared to own that tooling.</p>`
},
{
  q: "How do you implement automated rollback and progressive delivery?",
  level: "advanced", hot: true, tags: ["deployment", "production"],
  a: `<pre><code># Argo Rollouts — canary with automated analysis and rollback
kind: Rollout
spec:
  strategy:
    canary:
      canaryService: api-canary
      stableService: api-stable
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - analysis:
            templates: [{ templateName: success-rate }, { templateName: latency }]
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
---
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  metrics:
    - name: success-rate
      interval: 1m
      count: 5
      successCondition: result[0] &gt;= 0.99
      failureLimit: 2                       # 2 failures -&gt; automatic rollback
      provider:
        prometheus:
          address: http://prometheus:9090
          query: |
            sum(rate(http_server_requests_seconds_count{app="api",status!~"5..",version="canary"}[2m]))
            /
            sum(rate(http_server_requests_seconds_count{app="api",version="canary"}[2m]))</code></pre>
<p><strong>What makes automated rollback actually work — and where teams get it wrong:</strong></p>
<ul>
<li><strong>Compare canary against stable, not against an absolute threshold.</strong> A 0.5% error rate might be normal for your service; what matters is whether the canary is <em>worse than the current version right now</em>. Absolute thresholds cause false rollbacks during unrelated incidents.</li>
<li><strong>Give it enough traffic and time.</strong> At 5% weight with low traffic, five minutes may produce too few requests for the statistics to mean anything. Match the pause duration to your request rate.</li>
<li><strong>Measure what users feel</strong> — error rate and p99 latency — not CPU.</li>
<li><strong>Rollback must be safe.</strong> This is the constraint people forget: an automated rollback only works if version N−1 still functions against the current database schema. That is why backwards-compatible migrations are a prerequisite for progressive delivery, not an optional extra.</li>
</ul>
<p><strong>Layered safety net:</strong> feature flags for instant behaviour disablement (seconds, no deploy), automated canary rollback for bad releases (minutes), and <code>kubectl rollout undo</code> as the manual escape hatch. Each covers a different failure speed.</p>`
},
{
  q: "How do you manage environments and configuration promotion?",
  level: "advanced", tags: ["process", "configuration"],
  a: `<p><strong>The core principle: build once, promote the same artefact.</strong> Rebuilding per environment means production runs a binary that was never tested.</p>
<pre><code>Build (once)          -&gt;  image: ghcr.io/acme/api:9f2c1e4
   |
   +-- deploy to dev      (config: dev values)      -&gt; smoke tests
   +-- deploy to staging  (config: staging values)  -&gt; integration + contract tests
   +-- deploy to prod     (config: prod values)     -&gt; canary + monitoring
        ^ same immutable image digest throughout</code></pre>
<pre><code># Kustomize overlays — configuration differs, the image does not
base/
  deployment.yaml                 # image tag is a placeholder
overlays/
  dev/     { replicas: 1, resources: small,  LOG_LEVEL: DEBUG }
  staging/ { replicas: 2, resources: medium, LOG_LEVEL: INFO  }
  prod/    { replicas: 8, resources: large,  LOG_LEVEL: WARN, HPA enabled }</code></pre>
<p><strong>Promotion in a GitOps model</strong> is a commit to the config repository — which gives you an audit trail, review, and rollback by <code>git revert</code>:</p>
<pre><code># CI, after tests pass on staging
yq -i '.image.tag = "9f2c1e4"' overlays/prod/kustomization.yaml
git commit -m "promote api 9f2c1e4 to prod" &amp;&amp; git push
# Argo CD sees the commit and syncs the cluster</code></pre>
<p><strong>Practices worth stating:</strong></p>
<ul>
<li><strong>Environments should differ only in configuration and scale</strong>, never in code or in which features exist. "It works in staging" is only meaningful if staging is genuinely representative.</li>
<li><strong>Secrets never live in the config repo</strong> — reference an external store; only the reference is committed.</li>
<li><strong>Deploy by image digest in production</strong>, not by tag — a tag can be repointed, a digest cannot.</li>
<li><strong>Ephemeral preview environments per pull request</strong> are the highest-value addition for many teams: reviewers get a running instance rather than reading a diff.</li>
<li><strong>Gate production on approval</strong> (GitHub environments, GitLab manual jobs), and record who approved what.</li>
</ul>`
},
{
  q: "What is DevSecOps and how do you shift security left?",
  level: "advanced", tags: ["security", "pipeline"],
  a: `<p>Shifting left means finding security problems where they are cheap to fix — at commit time rather than in a penetration test three months later.</p>
<pre><code># Pre-commit — before the code even leaves the developer's machine
- gitleaks detect --staged           # secret scanning
- spotless / formatting

# CI, in order of speed
1. Secret scanning              gitleaks, GitHub secret scanning
2. SAST (static analysis)       SonarQube, Semgrep, SpotBugs + FindSecBugs
3. Dependency scanning (SCA)    OWASP Dependency-Check, Snyk, Dependabot
4. IaC scanning                 tfsec, Checkov, kube-score
5. Container image scanning     Trivy, Grype  -- fail on HIGH/CRITICAL
6. SBOM generation              Syft -> attach to the release
7. Image signing                Cosign -> admission policy rejects unsigned images
8. DAST (running app)           OWASP ZAP against the staging deployment</code></pre>
<pre><code>- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/acme/api:\${{ github.sha }}
    severity: HIGH,CRITICAL
    exit-code: '1'                     # FAIL the build, do not just report</code></pre>
<p><strong>What makes this work rather than become noise:</strong></p>
<ul>
<li><strong>Fail the build on new issues, not on the existing backlog.</strong> A pipeline that reports 4,000 pre-existing findings is ignored within a week. Baseline the current state and block only regressions.</li>
<li><strong>Fast checks first</strong> — secret scanning takes seconds; DAST takes minutes and belongs after deployment to staging.</li>
<li><strong>An SBOM is the practical payoff.</strong> When the next Log4Shell arrives, "which of our 60 services ship this library and at what version?" is answerable in minutes instead of days.</li>
<li><strong>Automate dependency updates</strong> (Dependabot/Renovate) with auto-merge for patch versions that pass CI — most vulnerabilities are fixed by simply staying current.</li>
<li><strong>Runtime matters too</strong> — image signing with an admission controller, non-root containers, read-only root filesystems, and network policies. Shifting left does not mean abandoning runtime controls.</li>
</ul>
<p><strong>The cultural point:</strong> the goal is to make the secure path the easy path — hardened base images, a paved-road pipeline template, and secure defaults in the service scaffold — rather than relying on every developer to remember.</p>`
},
{
  q: "How do you handle flaky tests in CI?",
  level: "advanced", hot: true, tags: ["testing", "process"],
  a: `<p>A flaky test passes and fails without any code change. It is more damaging than a failing test, because it teaches the team to ignore red builds — at which point CI has stopped being a safety net.</p>
<p><strong>Common causes, in rough order of frequency:</strong></p>
<ul>
<li><strong>Timing</strong> — <code>Thread.sleep</code> to "wait for" something async. Replace with Awaitility polling a condition.</li>
<li><strong>Shared state between tests</strong> — a static field, a database row, a file, a mocked singleton not reset. Symptom: passes alone, fails in the suite, or fails only in a particular order.</li>
<li><strong>Test order dependence</strong> — one test relies on another having run.</li>
<li><strong>Real time and time zones</strong> — a test that fails at midnight, on 29 February, or in a different CI region. Inject a <code>Clock</code>.</li>
<li><strong>Randomness</strong> — unseeded random data, or <code>Set</code>/<code>Map</code> iteration order (remember <code>Set.of()</code> deliberately randomises its order per JVM run).</li>
<li><strong>Parallel execution</strong> — tests sharing a port, a container, or a database schema.</li>
<li><strong>External dependencies</strong> — calling a real network service. Stub with WireMock.</li>
</ul>
<pre><code>// ✘ flaky
service.processAsync(order);
Thread.sleep(500);
assertThat(repo.findById(id)).isPresent();

// ✔ deterministic
service.processAsync(order);
await().atMost(10, SECONDS).untilAsserted(() -&gt;
    assertThat(repo.findById(id)).isPresent());</code></pre>
<p><strong>The process, which matters as much as the fixes:</strong></p>
<ol>
<li><strong>Detect and track</strong> — record test results over time; a test that fails intermittently should be flagged automatically rather than noticed anecdotally.</li>
<li><strong>Quarantine, do not ignore</strong> — move it out of the blocking suite with a ticket and an owner, so the build stays trustworthy while the flake is fixed.</li>
<li><strong>Fix the root cause.</strong> Automatic retries hide flakiness and occasionally hide a real race condition in production code — which is the worst outcome, because the test was right.</li>
<li><strong>Set a policy</strong> — a flaky test not fixed within a sprint is deleted. A test nobody trusts has negative value.</li>
</ol>
<p><strong>The line worth using:</strong> "A flaky test is a bug — sometimes in the test, sometimes in the code. Retrying it is choosing not to find out which."</p>`
}
]);
