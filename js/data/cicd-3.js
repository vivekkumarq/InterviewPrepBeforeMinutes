appendTopic("cicd", [
{
  q: "How do you write good commit messages and why does it matter?",
  level: "beginner", hot: true, tags: ["git", "process"],
  a: `<pre><code>feat(orders): add idempotency key support to the create endpoint

Retries from mobile clients were creating duplicate orders when the
network dropped after the request reached the server. Callers now send
an Idempotency-Key header; the first response is stored and replayed
for repeat requests with the same key and body hash.

Keys expire after 24 hours. A repeat key with a different body returns
422 rather than silently replaying the old response.

Closes #421</code></pre>
<p><strong>The structure:</strong> a short imperative subject (under ~50 characters, no full stop), a blank line, then a body explaining <strong>why</strong> — the code already shows <em>what</em> changed.</p>
<p><strong>Conventional Commits</strong> add a machine-readable prefix, which unlocks automation:</p>
<pre><code>feat:     a new feature              -&gt; minor version bump
fix:      a bug fix                  -&gt; patch version bump
feat!:    or a BREAKING CHANGE footer -&gt; MAJOR version bump
docs: / test: / refactor: / chore: / perf: / ci:</code></pre>
<p>With that convention, <code>semantic-release</code> or <code>release-please</code> can determine the next version number, generate the changelog and tag the release automatically — no human deciding whether something is a minor or a patch.</p>
<p><strong>Why it genuinely matters:</strong> the audience is you in eighteen months, during an incident, running <code>git log -S someFunction</code> or <code>git blame</code> on a line nobody understands. "fix stuff" tells you nothing; a message explaining the reasoning tells you whether the constraint still applies. Commit messages are the only documentation that is guaranteed to stay attached to the code.</p>
<p><strong>Practical points:</strong> reference the ticket so the discussion is one click away; keep commits atomic so <code>git revert</code> and <code>git bisect</code> work; and if you squash-merge pull requests, the PR title becomes the commit message — so enforce the convention on PR titles, not just commits.</p>`
},
{
  q: "What is semantic versioning and how do you version libraries and services?",
  level: "beginner", tags: ["versioning", "release"],
  a: `<pre><code>MAJOR.MINOR.PATCH        e.g. 2.4.1

MAJOR — incompatible API changes (consumers must act)
MINOR — new functionality, backwards compatible
PATCH — backwards-compatible bug fixes

2.4.1-rc.1        pre-release
2.4.1+build.9f2c  build metadata (ignored for precedence)</code></pre>
<p><strong>For libraries semver is a contract</strong> — consumers rely on it to decide whether an upgrade is safe, and dependency ranges (<code>^2.4.0</code>) depend on it being honoured. Breaking that contract in a minor release breaks builds silently across every consumer.</p>
<pre><code>&lt;!-- Consumers express tolerance through ranges --&gt;
"^2.4.0"   // &gt;=2.4.0 &lt;3.0.0  — accept minor and patch
"~2.4.0"   // &gt;=2.4.0 &lt;2.5.0  — accept patch only
"2.4.1"    // exact pin</code></pre>
<p><strong>For deployable services, semver matters much less</strong> — nobody depends on your service's version number the way they depend on a library's. What matters there is <strong>traceability</strong>:</p>
<pre><code>ghcr.io/acme/api:9f2c1e4                    # git SHA — exact, immutable, traceable
ghcr.io/acme/api:2026.09.06-9f2c1e4         # date + SHA — sortable and readable
ghcr.io/acme/api@sha256:...                 # digest — what production should reference</code></pre>
<p><strong>The distinction worth drawing in an interview:</strong> a library is versioned for its <em>consumers</em>, so semver's compatibility promise is the whole point. A service is versioned for its <em>operators</em>, so the question is "which commit is running in production right now, and can I get back to the previous one?" — which a git SHA answers and a semver number does not.</p>
<p>Expose the version at runtime (Spring Boot's <code>/actuator/info</code> with build-info) so you can answer that question from the running system rather than from a deployment log.</p>`
},
{
  q: "How do you manage dependencies and keep them up to date?",
  level: "advanced", tags: ["security", "maintenance"],
  a: `<pre><code># Automated update PRs — Renovate or Dependabot
{
  "extends": ["config:base"],
  "packageRules": [
    { "matchUpdateTypes": ["patch", "pin", "digest"],
      "automerge": true },                              // auto-merge patches that pass CI
    { "matchPackagePatterns": ["^org.springframework"],
      "groupName": "spring",                            // group related updates
      "schedule": ["before 6am on monday"] }
  ],
  "vulnerabilityAlerts": { "labels": ["security"], "automerge": true }
}</code></pre>
<pre><code># Know what you actually ship
mvn dependency:tree -Dincludes=com.fasterxml.jackson    # who pulls this in?
mvn versions:display-dependency-updates
mvn org.owasp:dependency-check-maven:check              # known CVEs
syft packages dir:. -o cyclonedx-json &gt; sbom.json       # SBOM</code></pre>
<p><strong>Why staying current is a security strategy, not housekeeping:</strong> most exploited vulnerabilities have had a fix available for months. The team that upgrades weekly applies the Log4Shell patch in an afternoon; the team two years behind discovers that upgrading Log4j requires upgrading Spring Boot, which requires Java 17, which breaks three libraries — and spends a fortnight on it under incident pressure.</p>
<p><strong>Practices that make it sustainable:</strong></p>
<ul>
<li><strong>Small, frequent updates</strong> — auto-merge patch versions that pass CI, which removes most of the volume without human attention.</li>
<li><strong>Use a BOM</strong> (<code>spring-boot-dependencies</code>) so transitive versions are managed coherently rather than resolved by chance.</li>
<li><strong>Lock files</strong> (<code>package-lock.json</code>, Gradle lockfiles, Maven enforcer) so builds are reproducible and a transitive version cannot change silently.</li>
<li><strong>Generate an SBOM per release</strong> — when the next critical CVE lands, "which of our services ship this library?" is a query rather than a week of investigation.</li>
<li><strong>Fail the build on new high-severity CVEs</strong>, with a documented suppression file for accepted risks — including the reason and a review date.</li>
</ul>
<p><strong>The trade-off to acknowledge:</strong> automated updates create noise and occasionally break things, so a strong test suite is the prerequisite. Without it, auto-merge is reckless — which is itself an argument for the test suite.</p>`
},
{
  q: "What is the difference between build, release and deploy artifacts?",
  level: "advanced", tags: ["process", "pipeline"],
  a: `<p>Twelve-factor separates three distinct stages, and conflating them is the root of a lot of deployment pain:</p>
<table>
<tr><th>Stage</th><th>Produces</th><th>Contains</th></tr>
<tr><td><strong>Build</strong></td><td>An immutable artifact</td><td>Code compiled with its dependencies — <em>no configuration</em></td></tr>
<tr><td><strong>Release</strong></td><td>Artifact + config for one environment</td><td>Uniquely identified, immutable, revertible</td></tr>
<tr><td><strong>Run</strong></td><td>Running processes</td><td>The release executing in the environment</td></tr>
</table>
<pre><code>BUILD   ghcr.io/acme/api:9f2c1e4            # built once, from one commit
   |
RELEASE 9f2c1e4 + prod-values.yaml = release v247    # a git commit in the config repo
   |
RUN     8 pods running release v247</code></pre>
<p><strong>The rule that follows: build once, deploy many.</strong> The exact bytes tested in staging are the bytes running in production. Rebuilding per environment means production runs an artifact that was never tested — and "it worked in staging" becomes meaningless, because staging ran a different binary.</p>
<p><strong>What this forbids in practice:</strong></p>
<ul>
<li><strong>No environment-specific builds</strong> — no <code>mvn package -Pprod</code> producing a different jar. Configuration is injected at runtime.</li>
<li><strong>No mutable tags in production</strong> — deploy by digest, or at least by immutable SHA tag. <code>latest</code> means you cannot say what is running.</li>
<li><strong>No editing config on the server</strong> — that creates a running state no release describes, which is unreproducible and invisible.</li>
<li><strong>Releases are immutable and numbered</strong> — so rollback is "deploy release 246", not "rebuild the old code and hope".</li>
</ul>
<p><strong>Why the release stage deserves its own identity:</strong> a bad deploy is sometimes the artifact and sometimes the configuration. If both are versioned together as a release, you can revert one commit and know exactly what you get. That is precisely what GitOps gives you — the config repository's history <em>is</em> the release history.</p>`
},
{
  q: "How do you set up a preview/ephemeral environment per pull request?",
  level: "advanced", tags: ["process", "kubernetes"],
  a: `<pre><code>name: PR Preview
on:
  pull_request: { types: [opened, synchronize, reopened, closed] }

jobs:
  deploy:
    if: github.event.action != 'closed'
    steps:
      - name: Build and push
        run: docker build -t ghcr.io/acme/api:pr-\${{ github.event.number }} . &amp;&amp; docker push ...

      - name: Deploy to an isolated namespace
        run: |
          NS=pr-\${{ github.event.number }}
          kubectl create namespace $NS --dry-run=client -o yaml | kubectl apply -f -
          helm upgrade --install api ./chart -n $NS \\
            --set image.tag=pr-\${{ github.event.number }} \\
            --set ingress.host=pr-\${{ github.event.number }}.preview.acme.dev \\
            --set resources.requests.cpu=100m

      - name: Comment the URL on the PR
        run: gh pr comment \${{ github.event.number }} \\
             --body "Preview: https://pr-\${{ github.event.number }}.preview.acme.dev"

  cleanup:
    if: github.event.action == 'closed'
    steps:
      - run: kubectl delete namespace pr-\${{ github.event.number }} --ignore-not-found</code></pre>
<p><strong>Why this is one of the highest-value CI investments:</strong> reviewers stop reading a diff and start using the feature. Designers, product owners and QA can look at real behaviour without checking out a branch or booking a shared staging environment. It also removes the queue for staging entirely — every PR gets its own.</p>
<p><strong>The details that make it work:</strong></p>
<ul>
<li><strong>Automatic cleanup on PR close</strong> — without it, orphaned namespaces accumulate and the cost is real. Add a TTL sweeper for PRs left open for weeks.</li>
<li><strong>Small resource requests</strong> — a preview does not need production sizing.</li>
<li><strong>Data strategy</strong> — an ephemeral database seeded with anonymised fixtures per namespace. Never point previews at production data.</li>
<li><strong>Isolation</strong> — a namespace per PR with its own dependencies; sharing a database between previews reintroduces the shared-staging problem.</li>
<li><strong>Wildcard DNS and TLS</strong> (<code>*.preview.acme.dev</code>) so no per-PR DNS setup is needed.</li>
</ul>
<p><strong>The trade-off:</strong> it requires a Kubernetes cluster with spare capacity and a well-parameterised Helm chart. For a small team, Vercel/Netlify-style preview deployments give the same benefit for frontends with none of the setup — worth mentioning as the pragmatic version.</p>`
},
{
  q: "How do you handle CI for a team — code review, branch protection and quality gates?",
  level: "advanced", tags: ["process", "quality"],
  a: `<pre><code># Branch protection on main — the mechanism, not a policy document
- Require a pull request before merging
- Require 1-2 approving reviews (and re-request review on new commits)
- Require status checks to pass: build, test, coverage, security scan
- Require branches to be up to date before merging
- Require conversation resolution
- Require signed commits
- No force pushes, no deletions
- Include administrators           # otherwise the rule is advisory</code></pre>
<pre><code># CODEOWNERS — automatic reviewer assignment by area
/src/main/java/com/acme/payments/   @acme/payments-team
/infra/                             @acme/platform-team
/.github/workflows/                 @acme/platform-team</code></pre>
<p><strong>Quality gates worth enforcing automatically</strong> — the point is that a machine enforces them uniformly, so they are never skipped under deadline pressure:</p>
<ul>
<li>Build and all tests pass.</li>
<li><strong>Coverage must not decrease</strong> — a floor rather than a target, so nobody games it with meaningless tests.</li>
<li>No new high-severity static analysis or CVE findings (baseline the existing ones).</li>
<li>No secrets detected.</li>
<li>Formatting applied automatically (Spotless, Prettier) so review never discusses style.</li>
<li>PR size limit or warning — review quality collapses beyond roughly 400 lines.</li>
</ul>
<p><strong>What makes review effective rather than ceremonial:</strong></p>
<ul>
<li><strong>Small PRs.</strong> A 900-line PR gets "LGTM"; a 200-line one gets real scrutiny. This single factor matters more than any process rule.</li>
<li><strong>Automate everything mechanical</strong> — formatting, imports, obvious bugs — so humans review design and correctness.</li>
<li><strong>Distinguish blocking comments from suggestions.</strong> "This will NPE on an empty list" and "I'd name this differently" deserve different weight; labelling them prevents a lot of friction.</li>
<li><strong>Set a response-time expectation</strong> (say, within a working day) — a blocked colleague costs two people's time.</li>
<li><strong>Review for what tests cannot check</strong> — naming, abstraction boundaries, missing edge cases, security implications.</li>
</ul>
<p>The underlying principle: make the correct path the easy path. If the pipeline formats, scans, tests and deploys automatically, doing the right thing requires no discipline.</p>`
}
]);
