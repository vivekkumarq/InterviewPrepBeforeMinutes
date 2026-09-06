registerTopic("cicd", [
{
  q: "What is CI/CD? Distinguish continuous delivery from continuous deployment",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<ul>
<li><strong>Continuous Integration</strong> — every commit is merged to the mainline frequently and automatically built and tested. The goal is to find integration problems in minutes rather than at the end of a sprint.</li>
<li><strong>Continuous Delivery</strong> — every change that passes the pipeline is <em>releasable</em>; deploying to production is a business decision, triggered by a human clicking a button.</li>
<li><strong>Continuous Deployment</strong> — the same, but the button is removed: every green build goes to production automatically.</li>
</ul>
<p><strong>What CI actually requires</strong> — and this is what interviewers want to hear, because most teams claiming CI do not do it:</p>
<ul>
<li>Commit to the mainline at least daily; short-lived branches.</li>
<li>A fast build (under ~10 minutes) — a slow pipeline gets bypassed.</li>
<li>A comprehensive automated test suite you trust.</li>
<li>A <strong>broken build is the highest priority</strong> — you fix or revert, you do not carry on.</li>
</ul>
<p>The measurable outcome is the four <strong>DORA metrics</strong>: deployment frequency, lead time for change, change failure rate, and mean time to restore. Framing your answer around those shows you think about CI/CD as a business capability, not a YAML file.</p>`
},
{
  q: "What stages should a production CI/CD pipeline have?",
  level: "advanced", hot: true, tags: ["pipeline", "design"],
  a: `<ol>
<li><strong>Trigger</strong> — push, pull request, tag, or schedule.</li>
<li><strong>Build</strong> — compile, with a dependency cache. Fail fast on compilation errors.</li>
<li><strong>Static analysis</strong> — linting, SpotBugs, SonarQube quality gate, formatting check.</li>
<li><strong>Unit tests</strong> — parallelised, with coverage thresholds.</li>
<li><strong>Security scanning</strong> — dependency CVEs (OWASP Dependency-Check, Snyk), secret scanning (gitleaks), SAST.</li>
<li><strong>Package</strong> — build the container image, tag with the git SHA, generate an SBOM, sign it.</li>
<li><strong>Integration tests</strong> — against real dependencies via Testcontainers.</li>
<li><strong>Image scan</strong> — Trivy against the built image; fail on HIGH/CRITICAL.</li>
<li><strong>Publish</strong> — push to the registry.</li>
<li><strong>Deploy to staging</strong> — automatic, then run smoke and contract tests.</li>
<li><strong>Deploy to production</strong> — canary or blue-green, with automated rollback on metric regression.</li>
<li><strong>Post-deploy verification</strong> — synthetic checks, error-rate monitoring, and a notification with what shipped.</li>
</ol>
<p><strong>Principles to state alongside the list:</strong> <em>build once, deploy many</em> — the same artefact is promoted through environments, never rebuilt per environment, or you are not testing what you ship. Fail fast: cheap checks first. Keep the whole pipeline under ten minutes to the first feedback. Everything as code, in the repository, reviewed like application code.</p>`
},
{
  q: "Write a GitHub Actions workflow for a Spring Boot service",
  level: "advanced", hot: true, tags: ["github-actions"],
  a: `<pre><code>name: CI/CD
on:
  push: { branches: [main] }
  pull_request:

env:
  REGISTRY: ghcr.io
  IMAGE: \${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven                       # caches ~/.m2 automatically

      - name: Build and test
        run: mvn -B verify                   # runs unit + integration tests

      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: test-reports, path: '**/target/surefire-reports/**' }

      - name: Dependency vulnerability scan
        run: mvn -B org.owasp:dependency-check-maven:check

  publish:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write, id-token: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}    # no long-lived PAT needed

      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            \${{ env.REGISTRY }}/\${{ env.IMAGE }}:\${{ github.sha }}
            \${{ env.REGISTRY }}/\${{ env.IMAGE }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: \${{ env.REGISTRY }}/\${{ env.IMAGE }}:\${{ github.sha }}
          severity: HIGH,CRITICAL
          exit-code: '1'

  deploy:
    needs: publish
    environment: production                  # enables required reviewers / approval gate
    runs-on: ubuntu-latest
    steps:
      - name: Update GitOps repo
        run: |
          # bump the image tag in the config repo; Argo CD does the actual deploy
          yq -i '.image.tag = "\${{ github.sha }}"' apps/api/values.yaml
          git commit -am "deploy api \${{ github.sha }}" &amp;&amp; git push</code></pre>
<p>Points worth highlighting: caching Maven and Docker layers is what keeps the pipeline fast; <code>GITHUB_TOKEN</code> avoids storing credentials; the <code>environment</code> key gives you a manual approval gate; and the deploy step writes to a GitOps repo rather than holding cluster credentials.</p>`
},
{
  q: "What is a GitLab CI pipeline and how is it structured?",
  level: "advanced", tags: ["gitlab"],
  a: `<pre><code>stages: [build, test, package, deploy]

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository"
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA

cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths: [ .m2/repository ]

build:
  stage: build
  image: maven:3.9-eclipse-temurin-21
  script: [ "mvn -B clean compile" ]

unit-test:
  stage: test
  image: maven:3.9-eclipse-temurin-21
  script: [ "mvn -B test" ]
  artifacts:
    when: always
    reports:
      junit: target/surefire-reports/TEST-*.xml       # test results in the MR UI
      coverage_report: { coverage_format: jacoco, path: target/site/jacoco/jacoco.xml }

integration-test:
  stage: test
  services: [ postgres:16 ]                            # sidecar services for the job
  variables: { POSTGRES_PASSWORD: test }
  script: [ "mvn -B verify -Pintegration" ]

package:
  stage: package
  image: docker:24
  services: [ docker:24-dind ]
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy-prod:
  stage: deploy
  environment: { name: production, url: https://api.acme.com }
  when: manual                                          # approval gate
  script: [ "kubectl set image deployment/api app=$DOCKER_IMAGE" ]
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH</code></pre>
<p><strong>GitLab-specific concepts worth naming:</strong> <em>runners</em> (shared or self-hosted executors), <em>stages</em> run sequentially while jobs within a stage run in parallel, <code>rules</code>/<code>only</code> for conditional execution, <code>needs:</code> to build a DAG that skips the strict stage ordering, <em>environments</em> with deployment tracking and one-click rollback, and protected variables that are only exposed on protected branches.</p>`
},
{
  q: "What branching strategy would you use and why?",
  level: "advanced", hot: true, tags: ["git", "process"],
  a: `<table>
<tr><th>Strategy</th><th>How</th><th>Fits</th></tr>
<tr><td><strong>Trunk-based</strong></td><td>Short-lived branches merged to main daily; feature flags hide incomplete work</td><td>Continuous deployment, mature test suites — <strong>what high-performing teams do</strong></td></tr>
<tr><td><strong>GitHub Flow</strong></td><td>main + feature branches + pull requests; deploy from main</td><td>Web services with one production version. A pragmatic default</td></tr>
<tr><td><strong>GitLab Flow</strong></td><td>GitHub Flow + environment branches (staging, production)</td><td>When deploys are gated per environment</td></tr>
<tr><td><strong>Git Flow</strong></td><td>develop, feature, release, hotfix, main</td><td>Versioned software with parallel supported releases. <strong>Overkill for a web service</strong></td></tr>
</table>
<p><strong>My answer:</strong> trunk-based development with short-lived branches and pull requests. The reasoning:</p>
<ul>
<li><strong>Long-lived branches are the problem</strong>. A branch alive for two weeks means a painful merge, and integration problems discovered late — the exact thing CI exists to prevent.</li>
<li><strong>Feature flags decouple deploy from release</strong>, so incomplete work can be merged safely and turned on later, per user segment.</li>
<li>Git Flow's release branches make sense when you must support version 2.3 and 3.1 simultaneously — for a service where only one version is ever live, the ceremony buys nothing and slows everything.</li>
</ul>
<p><strong>Supporting practices:</strong> protected main with required reviews and green CI, squash merges for a clean history, conventional commits to drive automated changelogs and semantic versioning, and small PRs (under ~400 lines) because review quality collapses beyond that.</p>`
},
{
  q: "How do you manage secrets in a CI/CD pipeline?",
  level: "advanced", hot: true, tags: ["security"],
  a: `<ol>
<li><strong>Never commit secrets.</strong> Run <code>gitleaks</code> or GitHub secret scanning as a pre-commit hook <em>and</em> in CI — because once a secret is in git history it must be rotated, not just deleted.</li>
<li><strong>Use the platform's secret store</strong> — GitHub Actions secrets, GitLab protected variables, Jenkins credentials. They are encrypted at rest and masked in logs.</li>
<li><strong>Prefer short-lived credentials over stored ones.</strong> This is the modern best practice: <strong>OIDC federation</strong> lets the pipeline exchange its identity token for a short-lived cloud role, so there is no long-lived cloud key to leak at all.
<pre><code>permissions: { id-token: write }
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123:role/github-deploy
    aws-region: ap-south-1        # no access keys stored anywhere</code></pre></li>
<li><strong>Scope tightly</strong> — per environment, per repository. Production credentials should be available only to jobs running on the protected branch with approval.</li>
<li><strong>Never pass secrets as build arguments</strong> — <code>ARG</code>/<code>ENV</code> persist in image history. Use BuildKit <code>--mount=type=secret</code> or inject at runtime.</li>
<li><strong>Rotate regularly and automatically</strong>; use a secret manager (Vault, AWS Secrets Manager) as the source of truth and sync into the cluster with the External Secrets Operator.</li>
<li><strong>Beware pull requests from forks</strong> — never expose secrets to workflows triggered by untrusted code, and be careful with <code>pull_request_target</code>, a well-known privilege-escalation vector.</li>
<li><strong>Audit</strong> — log who accessed which secret, and alert on unusual access.</li>
</ol>`
},
{
  q: "How do you achieve zero-downtime deployments?",
  level: "advanced", hot: true, tags: ["deployment", "production"],
  a: `<p>Six things must all be true — and interviewers are listening for the ones people forget:</p>
<ol>
<li><strong>Multiple replicas behind a load balancer</strong>, with a rolling or blue-green strategy and <code>maxUnavailable: 0</code>.</li>
<li><strong>Accurate readiness probes</strong> so traffic only reaches instances that can actually serve it.</li>
<li><strong>Graceful shutdown</strong> — handle SIGTERM, stop accepting new requests, finish in-flight ones, close resources. Add a <code>preStop</code> sleep so the load balancer deregisters the pod <em>before</em> the process starts shutting down; endpoint propagation is asynchronous and this race causes most residual 502s.</li>
<li><strong>Backwards-compatible database migrations</strong> — expand/contract. Both application versions run simultaneously, so a renamed or dropped column breaks the old one instantly.</li>
<li><strong>Backwards-compatible API and message contracts</strong> — additive changes only; consumers may still be on the old version.</li>
<li><strong>Automated rollback</strong> — monitor error rate and latency after the deploy, and revert automatically on regression. A rollback plan you have never executed is not a plan.</li>
</ol>
<pre><code>server.shutdown: graceful
spring.lifecycle.timeout-per-shutdown-phase: 30s
---
lifecycle:
  preStop: { exec: { command: ["sh","-c","sleep 5"] } }
terminationGracePeriodSeconds: 45      # must exceed the app's shutdown timeout</code></pre>
<p><strong>The point that separates a good answer:</strong> zero downtime is mostly an <em>application design</em> problem, not a deployment-tool problem. If your schema change is not backwards compatible, no deployment strategy saves you — blue-green just means both versions break at once.</p>`
},
{
  q: "What is Infrastructure as Code and why does it matter?",
  level: "advanced", tags: ["iac"],
  a: `<p>Infrastructure is defined in version-controlled files and provisioned by tooling, never by clicking in a console.</p>
<ul>
<li><strong>Declarative</strong> — Terraform, Pulumi, CloudFormation: you describe the desired state and the tool computes the diff.</li>
<li><strong>Imperative/configuration management</strong> — Ansible, Chef: you describe the steps.</li>
</ul>
<pre><code>resource "aws_db_instance" "orders" {
  identifier              = "orders-\${var.environment}"
  engine                  = "postgres"
  engine_version          = "16.3"
  instance_class          = var.db_instance_class
  allocated_storage       = 100
  multi_az                = var.environment == "prod"
  backup_retention_period = var.environment == "prod" ? 30 : 7
  deletion_protection     = var.environment == "prod"
  tags = { Service = "orders", ManagedBy = "terraform" }
}</code></pre>
<p><strong>Why it matters:</strong> environments become reproducible and identical; every change is reviewed in a pull request and audited in git history; disaster recovery becomes <code>terraform apply</code>; and configuration drift is detectable. Clicking in a console produces infrastructure nobody can recreate and nobody can explain six months later.</p>
<p><strong>Practices worth mentioning:</strong> remote state with locking (S3 + DynamoDB) so two engineers cannot corrupt it; separate state per environment; <code>terraform plan</code> posted to the pull request for review; modules for reuse; policy-as-code (OPA, Sentinel, tfsec) to enforce rules like "no public S3 buckets" automatically; and never editing resources manually, because the next apply will fight you.</p>`
},
{
  q: "How do you handle database migrations in a CI/CD pipeline?",
  level: "advanced", hot: true, tags: ["database", "deployment"],
  a: `<p><strong>Rules:</strong></p>
<ol>
<li><strong>Migrations are versioned code</strong> in the same repository, reviewed like everything else. Flyway or Liquibase, never <code>ddl-auto=update</code>.</li>
<li><strong>Immutable once merged</strong> — checksums mean editing an applied script breaks every environment that already ran it. Fix forward with a new migration.</li>
<li><strong>Always backwards compatible</strong>, because during a rolling deploy the old code runs against the new schema. Expand/contract: add nullable → dual write → backfill → switch reads → drop, across separate releases.</li>
<li><strong>Run migrations as a separate step</strong> — a Kubernetes Job or init container that completes before the new pods roll out — rather than on application startup in every replica, which races.</li>
<li><strong>Test them</strong> — CI restores a production-shaped dump and runs the migration, so you find the twenty-minute table lock before production does.</li>
<li><strong>Guard against locks</strong> — set <code>lock_timeout</code> and use <code>CREATE INDEX CONCURRENTLY</code> / <code>NOT VALID</code> constraints so a migration cannot freeze the table.</li>
<li><strong>Have a rollback plan.</strong> Note that most migrations cannot be undone without data loss — the real safety net is that the <em>application</em> can roll back because the schema still supports the previous version.</li>
</ol>
<pre><code># Kubernetes migration job, run before the rollout
apiVersion: batch/v1
kind: Job
metadata: { name: migrate-{{ .Values.image.tag }} }
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: flyway
          image: ghcr.io/acme/api:{{ .Values.image.tag }}
          args: ["--spring.flyway.enabled=true","--spring.main.web-application-type=none"]</code></pre>
<p>In Helm this is an <code>pre-upgrade</code> hook; in Argo CD, a <code>PreSync</code> hook. Mentioning that shows you have actually wired it up.</p>`
},
{
  q: "What is the difference between Jenkins, GitHub Actions and GitLab CI?",
  level: "beginner", tags: ["tooling"],
  a: `<table>
<tr><th></th><th>Jenkins</th><th>GitHub Actions</th><th>GitLab CI</th></tr>
<tr><td>Hosting</td><td>Self-hosted (you operate it)</td><td>SaaS + self-hosted runners</td><td>SaaS or self-hosted</td></tr>
<tr><td>Configuration</td><td><code>Jenkinsfile</code> (Groovy DSL)</td><td>YAML in <code>.github/workflows</code></td><td><code>.gitlab-ci.yml</code></td></tr>
<tr><td>Ecosystem</td><td>~1,900 plugins — powerful and a maintenance burden</td><td>Marketplace actions</td><td>Built-in features, fewer plugins needed</td></tr>
<tr><td>Setup cost</td><td>High</td><td>Very low</td><td>Low</td></tr>
<tr><td>Strength</td><td>Extreme flexibility, on-prem, legacy integrations</td><td>Tight GitHub integration, huge ecosystem</td><td>One integrated platform: repo, CI, registry, security, deploy</td></tr>
<tr><td>Weakness</td><td>Operational overhead, plugin CVEs, snowflake configuration</td><td>Vendor lock-in, cost at scale</td><td>Smaller third-party ecosystem</td></tr>
</table>
<p><strong>How to answer well:</strong> say what you have used and what the trade-off was. For example: "We used GitLab CI because the whole platform was integrated — repository, registry, pipelines and environments in one place, which kept the setup simple. I would pick GitHub Actions for a GitHub-hosted project because of the marketplace and OIDC support, and Jenkins only where on-premise constraints or deep legacy integration required it."</p>
<p>The underlying concepts — stages, artefacts, caching, runners, secrets, approvals — transfer between all three, which is the more important point.</p>`
},
{
  q: "How do you make a CI pipeline fast?",
  level: "advanced", tags: ["performance", "process"],
  a: `<p>Pipeline speed is a productivity multiplier — a 40-minute pipeline changes how people work, and not for the better.</p>
<ol>
<li><strong>Cache dependencies</strong> — <code>~/.m2</code>, <code>node_modules</code>, Gradle caches, Docker layers with BuildKit. Usually the single biggest win.</li>
<li><strong>Parallelise</strong> — run unit tests, linting and security scans as concurrent jobs rather than sequential stages. Shard slow test suites across runners.</li>
<li><strong>Fail fast</strong> — cheapest checks first (compile, lint, unit) so a typo does not wait behind a ten-minute integration suite.</li>
<li><strong>Run only what changed</strong> — path filters and, in a monorepo, affected-project detection (Nx, Bazel, Gradle build cache).</li>
<li><strong>Optimise the tests themselves</strong> — this is usually where the time really goes. Reuse the Spring context (do not vary <code>@MockitoBean</code> per class without reason), prefer slice tests to <code>@SpringBootTest</code>, and reuse Testcontainers instances.</li>
<li><strong>Split the pipeline</strong> — fast feedback on every push, the heavier suite on merge to main or nightly.</li>
<li><strong>Right-size runners</strong> — more CPU and RAM is cheaper than engineers waiting.</li>
<li><strong>Measure it</strong> — track pipeline duration as a metric and treat a regression as a bug.</li>
</ol>
<p><strong>The target to state:</strong> under 10 minutes to first meaningful feedback, and under 15 end to end. Beyond that, people start batching commits and context-switching, which defeats the purpose of continuous integration entirely.</p>`
},
{
  q: "What are the essential Git commands and workflows you use?",
  level: "beginner", hot: true, tags: ["git"],
  a: `<pre><code># Inspect
git log --oneline --graph --decorate --all
git log -S "functionName"            # find commits that changed this string
git blame -L 40,60 file.java
git diff main...feature              # changes on feature since it diverged

# Fixing mistakes — know these cold
git commit --amend --no-edit         # fix the last commit (before pushing)
git reset --soft HEAD~1              # undo commit, KEEP changes staged
git reset --mixed HEAD~1             # undo commit, keep changes unstaged (default)
git reset --hard HEAD~1              # undo commit, DISCARD changes — destructive
git revert &lt;sha&gt;                     # new commit undoing an old one — safe on shared branches
git restore --staged file            # unstage
git stash push -m "wip" &amp;&amp; git stash pop
git reflog                           # the safety net — recover almost anything

# Integrating
git rebase main                      # replay your commits on top of main — linear history
git rebase -i HEAD~3                 # squash/reword before opening a PR
git merge --no-ff feature            # preserve the branch topology
git cherry-pick &lt;sha&gt;                # take one commit (hotfix backport)
git bisect start / bad / good        # binary search for the commit that broke it</code></pre>
<p><strong>Merge vs rebase — the answer they want:</strong> rebase your <em>own unpushed</em> branch to keep history linear and reviewable; never rebase a branch others have pulled, because rewriting shared history forces everyone into recovery. On shared branches use <code>revert</code>, not <code>reset</code>.</p>
<p><code>git bisect</code> is worth calling out — automated binary search through history to find the commit that introduced a bug is a genuinely powerful tool most candidates never mention.</p>`
},
{
  q: "How do you implement canary and blue-green deployments in practice?",
  level: "advanced", tags: ["deployment"],
  a: `<p><strong>Blue-green:</strong> two complete environments. Blue serves production; green gets the new version and is verified; then traffic switches at once (DNS, load balancer target group, or Service selector). Rollback is switching back — seconds.</p>
<pre><code># Kubernetes blue-green: flip the Service selector
kind: Service
spec:
  selector:
    app: api
    version: blue          # change to 'green' to cut over instantly</code></pre>
<p><strong>Canary:</strong> route a small percentage of real traffic to the new version, watch metrics, and increase gradually.</p>
<pre><code># Argo Rollouts — automated analysis with rollback
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - analysis:                        # query Prometheus
            templates: [ { templateName: success-rate } ]
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
      successCondition: result[0] &gt;= 0.99
      failureLimit: 2                      # two failures -&gt; automatic rollback
      provider:
        prometheus:
          query: |
            sum(rate(http_requests_total{status!~"5..",app="api"}[5m]))
            / sum(rate(http_requests_total{app="api"}[5m]))</code></pre>
<table>
<tr><th></th><th>Blue-green</th><th>Canary</th></tr>
<tr><td>Risk exposure</td><td>All users at once after the switch</td><td>A small percentage first</td></tr>
<tr><td>Cost</td><td>Double infrastructure</td><td>Marginal</td></tr>
<tr><td>Rollback</td><td>Instant</td><td>Fast, and often automatic</td></tr>
<tr><td>Needs</td><td>Capacity headroom</td><td>Traffic splitting and good metrics</td></tr>
</table>
<p><strong>Both share the same prerequisite:</strong> the two versions must coexist safely — compatible schema and contracts. And canary requires metrics you actually trust, because you are automating a production decision on them.</p>`
},
{
  q: "What is observability in a CI/CD and production context — what would you monitor?",
  level: "advanced", tags: ["monitoring", "production"],
  a: `<p><strong>Pipeline metrics (the DORA four, plus health):</strong></p>
<ul>
<li><strong>Deployment frequency</strong> — how often you ship.</li>
<li><strong>Lead time for change</strong> — commit to production.</li>
<li><strong>Change failure rate</strong> — percentage of deploys causing an incident.</li>
<li><strong>Mean time to restore</strong> — how fast you recover.</li>
<li>Plus: pipeline duration, flaky test rate, and how long main stays red.</li>
</ul>
<p><strong>Production metrics — RED for services, USE for resources:</strong></p>
<ul>
<li><strong>Rate</strong> — requests per second, per endpoint.</li>
<li><strong>Errors</strong> — error rate, split 4xx vs 5xx.</li>
<li><strong>Duration</strong> — latency percentiles. <strong>Alert on p95/p99, never averages</strong> — an average hides the users having a bad time.</li>
<li><strong>Utilisation, Saturation, Errors</strong> for CPU, memory, connection pools, queue depth, consumer lag.</li>
</ul>
<pre><code>management:
  endpoints.web.exposure.include: health,prometheus,info
  metrics.tags: { application: \${spring.application.name} }
  tracing.sampling.probability: 0.1</code></pre>
<p><strong>What to alert on:</strong> symptoms users feel — SLO burn rate, error rate, latency — not causes like CPU. Every alert should be actionable and have a runbook; an alert nobody acts on trains people to ignore alerts, which is worse than having none.</p>
<p><strong>Tie it back to deployments:</strong> annotate dashboards with deploy events so a metric change lines up visibly with a release. That single practice cuts incident diagnosis time more than almost anything else, because "what changed?" is the first question in every incident.</p>`
}
]);
