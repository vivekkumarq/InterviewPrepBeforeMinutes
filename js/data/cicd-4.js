appendTopic("cicd", [
{
  q: "Design a CI/CD pipeline for a Spring Boot microservice — what are the stages and why?",
  level: "advanced", hot: true, tags: ["pipeline", "design"],
  companies: ["Amazon", "Optum", "Maersk", "TCS", "Infosys", "Societe Generale", "EPAM"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="CI CD pipeline stages">
  <rect class="dg-box" x="8" y="40" width="78" height="44" rx="6"/><text class="dg-s" x="47" y="60" text-anchor="middle">Commit</text><text class="dg-s" x="47" y="76" text-anchor="middle">+ PR</text>
  <rect class="dg-fill" x="98" y="40" width="78" height="44" rx="6"/><text class="dg-s" x="137" y="60" text-anchor="middle">Build</text><text class="dg-s" x="137" y="76" text-anchor="middle">unit tests</text>
  <rect class="dg-fill" x="188" y="40" width="78" height="44" rx="6"/><text class="dg-s" x="227" y="60" text-anchor="middle">Quality</text><text class="dg-s" x="227" y="76" text-anchor="middle">scan + SAST</text>
  <rect class="dg-fill" x="278" y="40" width="86" height="44" rx="6"/><text class="dg-s" x="321" y="60" text-anchor="middle">Integration</text><text class="dg-s" x="321" y="76" text-anchor="middle">Testcontainers</text>
  <rect class="dg-fill2" x="376" y="40" width="86" height="44" rx="6"/><text class="dg-s" x="419" y="60" text-anchor="middle">Image</text><text class="dg-s" x="419" y="76" text-anchor="middle">push + sign</text>
  <rect class="dg-fill2" x="474" y="40" width="66" height="44" rx="6"/><text class="dg-s" x="507" y="60" text-anchor="middle">Deploy</text><text class="dg-s" x="507" y="76" text-anchor="middle">staging</text>
  <rect class="dg-box" x="552" y="40" width="60" height="44" rx="6"/><text class="dg-s" x="582" y="60" text-anchor="middle">Prod</text><text class="dg-s" x="582" y="76" text-anchor="middle">gated</text>
  <path class="dg-line" d="M86 62 H96 M176 62 H186 M266 62 H276 M364 62 H374 M462 62 H472 M540 62 H550" marker-end="url(#ci1)"/>
  <text class="dg-s" x="300" y="112" text-anchor="middle">fast feedback first — anything that fails in 30s runs before anything that takes 10 minutes</text>
  <defs><marker id="ci1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>name: ci
on:
  pull_request:
  push: { branches: [main] }

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: temurin, cache: maven }
      - run: ./mvnw -B verify                    # compile + unit + integration
      - uses: actions/upload-artifact@v4
        with: { name: jar, path: target/*.jar }

  scan:
    needs: build
    steps:
      - run: ./mvnw sonar:sonar                  # coverage + quality gate
      - run: ./mvnw dependency-check:check       # known CVEs in dependencies
      - uses: aquasecurity/trivy-action@master   # image CVEs
        with: { severity: 'HIGH,CRITICAL', exit-code: '1' }

  image:
    needs: [build, scan]
    if: github.ref == 'refs/heads/main'
    permissions: { id-token: write, packages: write }   # OIDC, no long-lived keys
    steps:
      - run: docker build -t ghcr.io/org/api:\${{ github.sha }} .
      - run: docker push  ghcr.io/org/api:\${{ github.sha }}
      - run: cosign sign  ghcr.io/org/api:\${{ github.sha }}

  deploy-staging:
    needs: image
    environment: staging                          # auto
  deploy-prod:
    needs: deploy-staging
    environment: production                       # requires manual approval</code></pre>
<p><strong>The principles behind the ordering</strong>, which is what the interviewer wants rather than the YAML:</p>
<ul>
<li><strong>Fail fast, cheapest first.</strong> Compilation and unit tests in under two minutes; the 15-minute end-to-end suite only after everything cheap has passed.</li>
<li><strong>Build the artifact once.</strong> The same image is promoted through staging to production — never rebuilt per environment, or you are not testing what you ship.</li>
<li><strong>Tag by commit SHA, not <code>latest</code>.</strong> Every deployment is traceable to one commit, and rollback is redeploying the previous SHA.</li>
<li><strong>Configuration comes from the environment</strong>, not from the image. One image, many environments.</li>
<li><strong>Quality gates block the merge</strong>, not the deploy — a broken <code>main</code> blocks everyone.</li>
</ul>
<p><strong>Say what you would automate last:</strong> production deployment approval. Everything up to staging should be fully automatic; the production gate stays manual until the team trusts the test suite and has real canary metrics. Claiming full continuous deployment on day one is the answer that gets follow-up questions you cannot survive.</p>`
},
{
  q: "How do you run database migrations safely as part of a deployment?",
  level: "advanced", hot: true, tags: ["database", "deployment"],
  companies: ["Amazon", "Optum", "Maersk", "Goldman Sachs", "SAP", "Walmart", "EPAM"],
  a: `<p><strong>The constraint that shapes everything:</strong> during a rolling deployment the old and new versions of the application run <em>at the same time</em>, against <em>one</em> database. So every migration must be compatible with both.</p>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Expand and contract migration across three releases">
  <rect class="dg-fill" x="14" y="34" width="180" height="56" rx="8"/>
  <text class="dg-t" x="104" y="56" text-anchor="middle">1. Expand</text>
  <text class="dg-s" x="104" y="76" text-anchor="middle">add new column, nullable</text>
  <rect class="dg-fill2" x="212" y="34" width="196" height="56" rx="8"/>
  <text class="dg-t" x="310" y="56" text-anchor="middle">2. Migrate + dual write</text>
  <text class="dg-s" x="310" y="76" text-anchor="middle">code writes both, reads new</text>
  <rect class="dg-box" x="426" y="34" width="180" height="56" rx="8"/>
  <text class="dg-t" x="516" y="56" text-anchor="middle">3. Contract</text>
  <text class="dg-s" x="516" y="76" text-anchor="middle">drop the old column</text>
  <path class="dg-line" d="M198 62 H208 M412 62 H422" marker-end="url(#mg1)"/>
  <text class="dg-s" x="310" y="126" text-anchor="middle">each step is independently deployable and independently reversible</text>
  <defs><marker id="mg1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th>Safe in one release</th><th>Needs expand/contract</th></tr>
<tr><td>Add a nullable column</td><td>Rename a column</td></tr>
<tr><td>Add a table</td><td>Change a column type</td></tr>
<tr><td>Add an index <code>CONCURRENTLY</code></td><td>Drop a column still read by the old version</td></tr>
<tr><td>Add a nullable foreign key</td><td>Add <code>NOT NULL</code> to an existing column</td></tr>
<tr><td>Widen a constraint</td><td>Split one table into two</td></tr>
</table>
<pre><code>-- V12__add_email_verified.sql   (Flyway: versioned, immutable, checksummed)
ALTER TABLE users ADD COLUMN email_verified boolean;      -- nullable: old code unaffected
UPDATE users SET email_verified = false WHERE email_verified IS NULL;

-- A LATER release, once every instance writes the column:
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;</code></pre>
<pre><code># Run migrations as a SEPARATE step, before the application rollout
# — not on application startup, where N replicas race each other.
kubectl apply -f migration-job.yaml
kubectl wait --for=condition=complete job/migrate-v12 --timeout=300s
kubectl set image deploy/api api=ghcr.io/org/api:$SHA

# In Kubernetes, an initContainer or a Helm pre-upgrade hook does the same job.</code></pre>
<p><strong>The operational traps to name:</strong></p>
<ul>
<li><code>ALTER TABLE ... ADD COLUMN NOT NULL DEFAULT</code> rewrote the whole table and took an exclusive lock on older PostgreSQL — on a large table that is an outage. Modern versions handle constant defaults cheaply, but <em>knowing which operations lock</em> is the point.</li>
<li>Always <code>CREATE INDEX CONCURRENTLY</code> in production; the plain form blocks writes for the duration.</li>
<li>Set a short <code>lock_timeout</code> on migrations so a blocked <code>ALTER</code> fails fast instead of queueing every query behind it.</li>
<li>Never edit an applied migration — Flyway and Liquibase checksum them, and the deploy will fail. Write a new one.</li>
</ul>
<p><strong>On rollback, be honest:</strong> "Down-migrations sound good but are rarely trustworthy — you cannot un-drop data. My real rollback strategy is that every migration is backward compatible, so I can roll back the <em>application</em> without touching the schema. That is the whole reason for expand/contract, and it is worth more than a folder of <code>down.sql</code> files nobody has tested."</p>`
},
{
  q: "What is GitOps and how does Argo CD differ from a push-based pipeline?",
  level: "advanced", tags: ["gitops", "deployment"],
  companies: ["Amazon", "Optum", "Maersk", "SAP", "Nagarro", "Publicis Sapient"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 180" role="img" aria-label="Push based versus pull based GitOps deployment">
  <text class="dg-t" x="16" y="24">Push (classic CI/CD)</text>
  <rect class="dg-box" x="16" y="34" width="84" height="34" rx="6"/><text class="dg-s" x="58" y="55" text-anchor="middle">CI runner</text>
  <path class="dg-line" d="M104 51 H188" marker-end="url(#g1)"/>
  <text class="dg-s" x="146" y="44" text-anchor="middle">kubectl apply</text>
  <rect class="dg-fill2" x="192" y="34" width="96" height="34" rx="6"/><text class="dg-s" x="240" y="55" text-anchor="middle">Cluster</text>
  <text class="dg-s" x="330" y="46" >CI needs cluster credentials</text>
  <text class="dg-s" x="330" y="64" >drift is invisible</text>
  <text class="dg-t" x="16" y="108">Pull (GitOps)</text>
  <rect class="dg-box" x="16" y="118" width="84" height="34" rx="6"/><text class="dg-s" x="58" y="139" text-anchor="middle">Git repo</text>
  <rect class="dg-fill" x="192" y="118" width="96" height="34" rx="6"/><text class="dg-s" x="240" y="139" text-anchor="middle">Argo CD</text>
  <path class="dg-line" d="M188 135 H106" marker-end="url(#g1)"/>
  <text class="dg-s" x="146" y="112" text-anchor="middle">polls / webhook</text>
  <path class="dg-line" d="M292 135 H370" marker-end="url(#g1)"/>
  <rect class="dg-fill2" x="374" y="118" width="96" height="34" rx="6"/><text class="dg-s" x="422" y="139" text-anchor="middle">Cluster</text>
  <text class="dg-s" x="500" y="130" >credentials stay</text><text class="dg-s" x="500" y="148" >inside the cluster</text>
  <defs><marker id="g1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<p><strong>GitOps in one sentence:</strong> git is the single source of truth for desired state, and an in-cluster agent continuously reconciles the cluster towards it.</p>
<table>
<tr><th></th><th>Push pipeline</th><th>GitOps (pull)</th></tr>
<tr><td>Credentials</td><td>CI holds cluster admin — a large blast radius</td><td>Never leave the cluster</td></tr>
<tr><td>Drift</td><td>A manual <code>kubectl edit</code> goes unnoticed</td><td>Detected and (optionally) auto-reverted</td></tr>
<tr><td>Audit</td><td>Pipeline logs</td><td>Git history — who changed what, reviewed in a PR</td></tr>
<tr><td>Rollback</td><td>Re-run an old pipeline</td><td><code>git revert</code></td></tr>
<tr><td>Disaster recovery</td><td>Rebuild by hand</td><td>Point Argo at a fresh cluster; it rebuilds everything</td></tr>
<tr><td>Multi-cluster</td><td>N pipelines</td><td>One repo, ApplicationSets fan out</td></tr>
</table>
<pre><code>apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: api-prod }
spec:
  source:
    repoURL: https://github.com/org/deploy-manifests
    path: overlays/prod           # Kustomize overlay
    targetRevision: main
  destination: { server: https://kubernetes.default.svc, namespace: prod }
  syncPolicy:
    automated: { prune: true, selfHeal: true }   # selfHeal reverts manual drift
    syncOptions: [CreateNamespace=true]</code></pre>
<p><strong>The repository split that matters:</strong> keep application source and deployment manifests in <em>separate</em> repos. CI builds the image and opens a PR that bumps the image tag in the manifest repo; Argo picks up the merge. Otherwise the tag-bump commit re-triggers CI in a loop, and your deployment history is buried in application commits.</p>
<p><strong>Honest limitations to raise:</strong> secrets need a separate answer (Sealed Secrets, SOPS or External Secrets — you cannot commit plaintext); a genuine emergency fix is slower because it must go through git; and <code>selfHeal</code> will fight anyone doing a legitimate manual intervention during an incident, so teams need a documented break-glass procedure.</p>`
},
{
  q: "Your build is flaky and takes 40 minutes — how do you fix it?",
  level: "advanced", hot: true, tags: ["performance", "testing"],
  companies: ["Amazon", "Google", "Flipkart", "Walmart", "Optum", "ThoughtWorks"],
  a: `<p><strong>Speed — attack it in this order:</strong></p>
<table>
<tr><th>Technique</th><th>Typical effect</th></tr>
<tr><td>Cache dependencies (<code>~/.m2</code>, <code>node_modules</code>)</td><td>Removes 5–10 min of downloading on every run</td></tr>
<tr><td>Parallelise independent jobs</td><td>Lint, unit tests and build run at once, not in sequence</td></tr>
<tr><td>Shard the test suite across runners</td><td>Near-linear: 4 shards ≈ a quarter of the time</td></tr>
<tr><td>Run only what changed (affected-module builds, Nx/Gradle/Bazel)</td><td>Huge in a monorepo</td></tr>
<tr><td>Docker layer caching / BuildKit</td><td>Image build drops from minutes to seconds</td></tr>
<tr><td>Move slow suites off the PR path</td><td>PR = unit + fast integration; nightly = full e2e and load</td></tr>
<tr><td>Bigger runners</td><td>Real, and often cheaper than an engineer waiting 40 minutes</td></tr>
</table>
<p><strong>Flakiness — the part people answer badly.</strong> The wrong response is a blanket retry, which hides real bugs and doubles the runtime. The right one is to treat a flaky test as a defect:</p>
<ol>
<li><strong>Quarantine, do not delete.</strong> Move it out of the blocking suite so it stops eroding trust in CI, and file a ticket. A red build nobody believes is worse than no build.</li>
<li><strong>Find the category.</strong> Almost every flake is one of a handful:</li>
</ol>
<table>
<tr><th>Cause</th><th>Fix</th></tr>
<tr><td><code>Thread.sleep</code> / timing assumptions</td><td>Await a condition (<code>Awaitility</code>), never a fixed delay</td></tr>
<tr><td>Shared mutable state between tests</td><td><code>@DirtiesContext</code>, fresh fixtures, no static caches</td></tr>
<tr><td>Test-order dependence</td><td>Randomise the order to expose it, then isolate</td></tr>
<tr><td>Real network or a shared environment</td><td>Testcontainers or WireMock — hermetic by construction</td></tr>
<tr><td>Time and time zones</td><td>Inject a <code>Clock</code>; pin the JVM time zone</td></tr>
<tr><td>Unseeded randomness</td><td>Fixed seed, logged so a failure is reproducible</td></tr>
<tr><td>Parallel tests sharing a database</td><td>A schema or container per worker</td></tr>
</table>
<pre><code># Measure before optimising — find the actual slow tests
./mvnw test -Dsurefire.reportFormat=plain
# and track flake rate per test over time; you cannot fix what you cannot rank</code></pre>
<p><strong>The framing to close with:</strong> "Build time is a team-productivity metric, so I treat it as a tracked number with a budget — under 10 minutes for the PR path. And I track a flake rate per test, because 'retry three times' is not a fix; a test that fails intermittently is telling you something about the system, and often the flakiness is in the production code, not the test."</p>`
}
]);
