appendTopic("cicd", [
{
  q: "Which Git branching strategy would you use, and how do you handle a hotfix?",
  level: "beginner", hot: true, tags: ["git", "process", "release"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Amazon", "Optum", "Maersk"],
  a: `<table>
<tr><th>Strategy</th><th>Branches</th><th>Fits</th></tr>
<tr><td><strong>Trunk-based</strong></td><td><code>main</code> + very short-lived branches</td><td>Continuous delivery, strong test coverage, feature flags</td></tr>
<tr><td><strong>GitHub Flow</strong></td><td><code>main</code> + feature branches, deploy from main</td><td>Web apps, one production version — <strong>the common default</strong></td></tr>
<tr><td><strong>GitFlow</strong></td><td><code>main</code>, <code>develop</code>, feature, release, hotfix</td><td>Scheduled releases, versioned or on-premise products</td></tr>
<tr><td><strong>Release branches</strong></td><td><code>main</code> + <code>release/1.x</code> maintained</td><td>Supporting multiple live versions at once</td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Hotfix branched from the production tag and merged back to main">
  <path class="dg-line" d="M30 60 H570"/>
  <text class="dg-s" x="16" y="46">main</text>
  <circle class="dg-fill" cx="90" cy="60" r="8"/><circle class="dg-fill" cx="180" cy="60" r="8"/>
  <circle class="dg-fill2" cx="270" cy="60" r="9"/><circle class="dg-fill" cx="400" cy="60" r="8"/>
  <circle class="dg-fill" cx="500" cy="60" r="8"/>
  <text class="dg-s" x="270" y="42" text-anchor="middle">v1.4.0 (in prod)</text>
  <path class="dg-line" d="M270 68 L330 110 H430" />
  <circle class="dg-box" cx="380" cy="110" r="8"/>
  <text class="dg-s" x="380" y="132" text-anchor="middle">hotfix/1.4.1 — branched from the TAG, not from main</text>
  <path class="dg-line" d="M430 110 L500 70" marker-end="url(#gf1)"/>
  <text class="dg-s" x="500" y="42" text-anchor="middle">merged back</text>
  <text class="dg-s" x="16" y="158">branching from main would ship every unreleased change along with the fix</text>
  <defs><marker id="gf1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code># THE HOTFIX PROCEDURE — the part that is actually being tested
git checkout -b hotfix/1.4.1 v1.4.0     # from the PRODUCTION TAG, not from main
# ... minimal fix, plus a test that reproduces the bug ...
git tag v1.4.1
# deploy v1.4.1
git checkout main &amp;&amp; git merge hotfix/1.4.1    # MERGE BACK, or the fix regresses
                                               # on the next release

# The mistake to name: cherry-picking into production without merging back.
# The next release silently reintroduces the bug, and nobody understands why.</code></pre>
<table>
<tr><th>Practice</th><th>Why</th></tr>
<tr><td>Short-lived branches (&lt; 2 days)</td><td>Long branches mean painful merges and hidden integration risk</td></tr>
<tr><td>Small PRs (&lt; 400 lines)</td><td>Review quality falls off a cliff beyond that</td></tr>
<tr><td>Protected <code>main</code> — required checks, required review</td><td>A broken main blocks the entire team</td></tr>
<tr><td>Feature flags for incomplete work</td><td>Lets you merge to main before the feature is finished, so branches stay short</td></tr>
<tr><td>Squash merge</td><td>One logical commit per change; a readable history</td></tr>
<tr><td>Conventional commits</td><td>Enables automated changelogs and semantic versioning</td></tr>
</table>
<pre><code># The Git commands worth knowing precisely
git rebase main                # replay MY commits on top — linear history
git merge main                 # a merge commit — preserves exactly what happened
# Rule: rebase your own unpushed branch; NEVER rebase a shared branch.

git revert &lt;sha&gt;               # safe on shared history — a new commit that undoes
git reset --hard &lt;sha&gt;         # rewrites history — local only, and it DISCARDS work
git reset --keep &lt;sha&gt;         # like --hard but refuses if it would lose local changes

git cherry-pick &lt;sha&gt;          # take one commit elsewhere
git bisect start / good / bad  # binary search for the commit that broke it
git reflog                     # the safety net — recovers almost anything for ~90 days</code></pre>
<p><strong>The recommendation to give:</strong> "For a service deployed continuously I use trunk-based development with short branches and feature flags — GitFlow's <code>develop</code> branch adds ceremony that only pays off when you ship on a schedule or support several versions. What matters more than the model is that branches are short, <code>main</code> is always releasable, and there is a rehearsed path to production for an emergency fix."</p>`
},
{
  q: "How do you do blue-green and canary deployments, and how do you decide to roll back?",
  level: "advanced", hot: true, tags: ["deployment", "release", "production", "monitoring"],
  companies: ["Amazon", "Flipkart", "Walmart", "Optum", "Maersk", "Uber", "Societe Generale"],
  a: `<table>
<tr><th>Strategy</th><th>How</th><th>Cost</th><th>Rollback</th></tr>
<tr><td><strong>Rolling</strong></td><td>Replace pods gradually</td><td>None</td><td>Roll forward or undo — takes minutes</td></tr>
<tr><td><strong>Blue-green</strong></td><td>Two full environments, flip the router</td><td><strong>2× capacity</strong></td><td><strong>Instant</strong> — flip back</td></tr>
<tr><td><strong>Canary</strong></td><td>Send 1% → 10% → 50% → 100%</td><td>Small extra</td><td>Fast, and only a fraction of users were exposed</td></tr>
<tr><td><strong>Shadow / mirror</strong></td><td>Duplicate real traffic to the new version, discard responses</td><td>2× compute</td><td>Zero risk — nothing is served from it</td></tr>
<tr><td><strong>Feature flag</strong></td><td>Deploy dark, enable per cohort</td><td>None</td><td><strong>Instant, no deploy</strong></td></tr>
</table>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Canary rollout shifting traffic in stages with automated checks">
  <rect class="dg-box" x="16" y="60" width="80" height="34" rx="6"/><text class="dg-s" x="56" y="82" text-anchor="middle">traffic</text>
  <path class="dg-line" d="M100 70 H160 M100 86 H160" marker-end="url(#cn1)"/>
  <rect class="dg-fill" x="164" y="26" width="130" height="34" rx="6"/><text class="dg-s" x="229" y="48" text-anchor="middle">v1 — 95%</text>
  <rect class="dg-fill2" x="164" y="96" width="130" height="34" rx="6"/><text class="dg-s" x="229" y="118" text-anchor="middle">v2 canary — 5%</text>
  <path class="dg-line" d="M298 113 H350" marker-end="url(#cn1)"/>
  <rect class="dg-box" x="354" y="96" width="150" height="34" rx="6"/><text class="dg-s" x="429" y="118" text-anchor="middle">compare metrics</text>
  <path class="dg-line" d="M429 92 V70" marker-end="url(#cn1)"/>
  <text class="dg-s" x="446" y="62">healthy → promote</text>
  <text class="dg-s" x="446" y="80">degraded → abort</text>
  <text class="dg-s" x="16" y="158">the comparison must be v2 against v1 RIGHT NOW — not against yesterday's baseline</text>
  <defs><marker id="cn1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code># Argo Rollouts — an automated canary with analysis gates
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 5m }
        - analysis:                        # automated, not a human squinting at a graph
            templates: [{ templateName: success-rate }]
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: { name: success-rate }
spec:
  metrics:
    - name: success-rate
      interval: 1m
      successCondition: result[0] &gt;= 0.99
      failureLimit: 2                      # two consecutive failures aborts the rollout
      provider:
        prometheus:
          query: |
            sum(rate(http_requests_total{job="api",status!~"5.."}[2m]))
            / sum(rate(http_requests_total{job="api"}[2m]))</code></pre>
<table>
<tr><th>Signal to gate on</th><th>Threshold example</th></tr>
<tr><td>Error rate (5xx)</td><td>&lt; 1%, and no worse than the stable version</td></tr>
<tr><td>p99 latency</td><td>Within 20% of stable</td></tr>
<tr><td>Saturation — CPU, memory, pool usage</td><td>No new saturation</td></tr>
<tr><td>Business metric</td><td>Checkout completion rate unchanged — catches the bugs that return 200</td></tr>
</table>
<p><strong>The business-metric point is the one that separates answers.</strong> A change that breaks the "Pay" button still returns HTTP 200 and normal latency; only conversion rate reveals it. Technical signals catch crashes; business signals catch correctness.</p>
<pre><code># The prerequisite nobody mentions until it hurts: BACKWARD COMPATIBILITY.
# During any canary or rolling deploy, v1 and v2 run at the same time against
# ONE database and ONE message topic. So:
#   - migrations must be additive (expand/contract)
#   - message schemas must be forward and backward compatible
#   - session data written by v2 must be readable by v1
# Without that, no deployment strategy helps — you have coupled the versions.</code></pre>
<p><strong>How to answer "when do you roll back?"</strong> — decide the criteria <em>before</em> the deploy, not during the incident: "abort if the error rate exceeds 1% or p99 latency rises more than 20% over two consecutive minutes." Automate that check so it does not depend on someone watching a dashboard at 11pm. And roll back first, diagnose second — restoring service is not the same task as finding the cause, and doing them in the wrong order extends every outage.</p>`
}
]);
