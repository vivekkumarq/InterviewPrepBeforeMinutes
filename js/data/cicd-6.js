appendTopic("cicd", [
{
  q: "What does a good CI pipeline look like, and how do you keep it fast?",
  level: "advanced", hot: true, tags: ["pipeline", "ci", "production", "best-practice"],
  companies: ["Amazon", "Optum", "Maersk", "SAP", "Flipkart", "Walmart", "EPAM", "Nagarro"],
  a: `<pre><code>name: ci
on: { pull_request: {}, push: { branches: [main] } }

concurrency:                       # cancel superseded runs on the same branch
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 21, cache: maven }
      - run: ./mvnw -B verify              # compile + unit + integration
      - uses: docker/build-push-action@v6
        with: { cache-from: type=gha, cache-to: type=gha,mode=max }</code></pre>
<table>
<tr><th>Stage</th><th>Budget</th><th>Fails on</th></tr>
<tr><td>Compile + unit tests</td><td>&lt; 2 min</td><td>Anything</td></tr>
<tr><td>Static analysis, lint, format</td><td>&lt; 1 min</td><td>New violations only</td></tr>
<tr><td>Integration tests (Testcontainers)</td><td>&lt; 5 min</td><td>Anything</td></tr>
<tr><td>Dependency + image scan</td><td>&lt; 2 min</td><td>High/critical CVEs</td></tr>
<tr><td>Build and push the image</td><td>&lt; 3 min</td><td>—</td></tr>
<tr><td>Deploy to staging + smoke test</td><td>&lt; 5 min</td><td>Smoke failure</td></tr>
</table>
<table>
<tr><th>Speed-up</th><th>Effect</th></tr>
<tr><td><strong>Cache dependencies</strong></td><td>Usually the single biggest win — a cold Maven resolve dominates everything</td></tr>
<tr><td>Docker layer cache (<code>type=gha</code>, or a registry)</td><td>A fresh runner has an empty layer cache unless you import one</td></tr>
<tr><td>Run independent jobs in parallel</td><td>Lint, unit and integration need not be sequential</td></tr>
<tr><td><code>cancel-in-progress</code></td><td>Stops three pushes queueing three full runs</td></tr>
<tr><td>Fail fast — cheapest checks first</td><td>A compile error should not wait behind a 5-minute test suite</td></tr>
<tr><td>Split slow tests by tag</td><td>Full suite on main, fast subset on every push</td></tr>
</table>
<pre><code># Build ONCE, promote the SAME artefact through environments.
# Rebuilding per environment means staging and production are different
# binaries, and you have tested something you are not shipping.
build -> image:$SHA -> deploy staging -> deploy prod    # one image, three deploys

# Tag by commit SHA, never by "latest" — latest is not a version, it is a
# race condition with a friendly name.</code></pre>
<p><strong>The hygiene rules that matter more than the tool:</strong> the pipeline must be <strong>green on main at all times</strong> — a persistently red build trains everyone to ignore it. A flaky test is a bug: quarantine it with a ticket, never retry it into passing. And CI should need no cluster credentials if you deploy with GitOps, because the agent pulls rather than CI pushing.</p>
<p><strong>Say this:</strong> "I treat build time as a product metric, because it sets the team's feedback loop. Past about ten minutes people stop waiting for it and start context-switching, and the value of CI collapses — so I budget each stage and cache aggressively."</p>`
},
{
  q: "How do you handle a bad deploy in production?",
  level: "advanced", hot: true, tags: ["incident", "rollback", "production", "process"],
  companies: ["Amazon", "Flipkart", "Optum", "Maersk", "Walmart", "Societe Generale", "Uber", "Swiggy"],
  a: `<p><strong>Restore service first, diagnose second.</strong> Those are two different jobs, and doing them in the wrong order extends every outage.</p>
<table>
<tr><th>Step</th><th>Action</th></tr>
<tr><td>1. Confirm</td><td>Is it the deploy? Compare error rate and latency against the deploy timestamp.</td></tr>
<tr><td>2. Communicate</td><td>Open the incident channel. Say what you know and what you are doing.</td></tr>
<tr><td>3. <strong>Mitigate</strong></td><td>Roll back, or flip the feature flag off. Do <em>not</em> debug first.</td></tr>
<tr><td>4. Verify</td><td>Watch the metrics recover. An unverified rollback is a guess.</td></tr>
<tr><td>5. Diagnose</td><td>Now read the logs and traces, with the pressure off.</td></tr>
<tr><td>6. Follow up</td><td>Blameless postmortem with actions that have owners and dates.</td></tr>
</table>
<pre><code># The rollback itself
kubectl rollout undo deployment/api               # previous ReplicaSet
kubectl rollout undo deployment/api --to-revision=3
kubectl rollout status deployment/api             # WATCH it finish
helm rollback api 3
git revert &lt;sha&gt; &amp;&amp; git push                     # the GitOps rollback

# Fastest of all, when the change is behind a flag:
# turn the flag off. No deploy, seconds not minutes, and it is reversible.</code></pre>
<table>
<tr><th>What makes rollback impossible</th><th>Prevention</th></tr>
<tr><td><strong>A destructive migration</strong> — a dropped column</td><td>Expand/contract; never drop in the same release that stops using it</td></tr>
<tr><td>New code wrote data the old code cannot read</td><td>Forward- and backward-compatible schemas</td></tr>
<tr><td>A published event with a new shape</td><td>Additive schema changes only</td></tr>
<tr><td>A one-way external call already made</td><td>Idempotency keys and compensating actions</td></tr>
<tr><td>Nobody knows the previous version</td><td>Immutable, SHA-tagged images</td></tr>
</table>
<pre><code>// The rule that keeps rollback available:
// a release may stop WRITING an old field, but must keep READING it until
// the next release. Then the one after that removes it.
//
// release N:   write both old and new
// release N+1: read new, still write both        <- safe to roll back to N
// release N+2: stop writing old
// release N+3: drop the column</code></pre>
<p><strong>The postmortem stance to state explicitly:</strong> blameless, and focused on the system rather than the person. "Someone pushed a bad config" is not a root cause — the question is why the config could reach production unvalidated, why the canary did not catch it, and why the alert fired after customers noticed rather than before. Actions that are just "be more careful" are not actions.</p>
<p><strong>And the number that matters:</strong> teams optimise for not failing, but MTTR — how quickly you recover — is the more useful target. Fast, boring, rehearsed rollbacks are what make frequent deploys safe, and that is the actual argument for deploying often rather than rarely.</p>`
}
]);
