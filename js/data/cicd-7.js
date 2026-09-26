registerPrimer("cicd", `<h3>The mental model: every commit takes the same road to production</h3>
<p><strong>Continuous integration (CI)</strong> means every change is merged into the main branch often, and each merge is automatically built and tested, so problems show up within minutes of being written. <strong>Continuous delivery (CD)</strong> means every change that passes is packaged and ready to release with one click. <strong>Continuous deployment</strong> goes one step further and releases it automatically.</p>
<p>The pipeline is ordered by one principle: <strong>cheapest and fastest checks first</strong>. A formatting error should fail in 30 seconds, not after a 20-minute integration suite.</p>
<figure class="fig">
<svg viewBox="0 0 620 214" role="img" aria-label="A CI/CD pipeline: commit, build and unit tests, integration tests and scans, artifact, deploy to staging, canary in production, full rollout, with monitoring feeding back">
  <defs><marker id="pr-ci" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="6" y="30" width="72" height="56" rx="8"/><text class="dg-t" x="42" y="54" text-anchor="middle">Commit</text><text class="dg-s" x="42" y="70" text-anchor="middle">PR opened</text>
  <line class="dg-line" x1="78" y1="58" x2="88" y2="58" marker-end="url(#pr-ci)"/>
  <rect class="dg-fill" x="90" y="30" width="80" height="56" rx="8"/><text class="dg-t" x="130" y="50" text-anchor="middle">Build</text><text class="dg-s" x="130" y="66" text-anchor="middle">lint, unit</text><text class="dg-s" x="130" y="79" text-anchor="middle">~2 min</text>
  <line class="dg-line" x1="170" y1="58" x2="180" y2="58" marker-end="url(#pr-ci)"/>
  <rect class="dg-fill" x="182" y="30" width="86" height="56" rx="8"/><text class="dg-t" x="225" y="50" text-anchor="middle">Verify</text><text class="dg-s" x="225" y="66" text-anchor="middle">integration,</text><text class="dg-s" x="225" y="79" text-anchor="middle">security scans</text>
  <line class="dg-line" x1="268" y1="58" x2="278" y2="58" marker-end="url(#pr-ci)"/>
  <rect class="dg-fill2" x="280" y="30" width="80" height="56" rx="8"/><text class="dg-t" x="320" y="50" text-anchor="middle">Artifact</text><text class="dg-s" x="320" y="66" text-anchor="middle">image built</text><text class="dg-s" x="320" y="79" text-anchor="middle">ONCE</text>
  <line class="dg-line" x1="360" y1="58" x2="370" y2="58" marker-end="url(#pr-ci)"/>
  <rect class="dg-box" x="372" y="30" width="76" height="56" rx="8"/><text class="dg-t" x="410" y="50" text-anchor="middle">Staging</text><text class="dg-s" x="410" y="66" text-anchor="middle">smoke tests</text>
  <line class="dg-line" x1="448" y1="58" x2="458" y2="58" marker-end="url(#pr-ci)"/>
  <rect class="dg-fill2" x="460" y="30" width="72" height="56" rx="8"/><text class="dg-t" x="496" y="50" text-anchor="middle">Canary</text><text class="dg-s" x="496" y="66" text-anchor="middle">5% traffic</text>
  <line class="dg-line" x1="532" y1="58" x2="542" y2="58" marker-end="url(#pr-ci)"/>
  <rect class="dg-fill" x="544" y="30" width="70" height="56" rx="8"/><text class="dg-t" x="579" y="50" text-anchor="middle">100%</text><text class="dg-s" x="579" y="66" text-anchor="middle">rollout</text>
  <path class="dg-line" d="M579 86 V130 H496 V92" marker-end="url(#pr-ci)" stroke-dasharray="4 3"/>
  <text class="dg-s" x="360" y="146">error rate or latency up? automatic rollback</text>
  <text class="dg-s" x="6" y="120">fails here: the author knows in minutes,</text>
  <text class="dg-s" x="6" y="136">while the change is still fresh in their head</text>
  <text class="dg-s" x="6" y="180">The SAME image, identified by its digest, moves through staging and production.</text>
  <text class="dg-s" x="6" y="198">Only configuration differs between environments, never the build.</text>
</svg>
<figcaption>Fast feedback on the left, safety nets on the right. A failure anywhere stops the change from going further.</figcaption>
</figure>
<h3>Worked example: one commit's journey</h3>
<pre><code>10:02  Asha pushes a branch and opens a PR
10:02  CI: compile, formatter check, unit tests                 1m 40s   PASS
10:04  CI: integration tests (Testcontainers Postgres + Kafka)   4m 10s   PASS
10:04  CI: dependency vulnerability scan, secret scan            0m 50s   PASS
10:08  Ravi reviews and approves. Branch protection requires
       green CI + 1 approval, so the merge button unlocks
10:15  Merged to main -&gt; build image shop-api:sha-7f3c2a1, push to registry
10:18  Deploy to staging, run smoke tests (health, one checkout)  PASS
10:25  Deploy canary: 5% of production traffic gets the new version
10:25-10:40  Compare canary vs stable: error rate, p99 latency
10:40  Healthy -&gt; roll out to 100%
Total: about 40 minutes from push to production, with two humans
involved for about five of them.</code></pre>
<h3>Principles worth stating in an interview</h3>
<table>
<tr><th>Principle</th><th>Why</th></tr>
<tr><td>Build once, deploy the same artifact everywhere</td><td>Rebuilding per environment means testing one thing and shipping another</td></tr>
<tr><td>Keep the main branch always releasable</td><td>Anyone can ship at any time; unfinished work hides behind feature flags</td></tr>
<tr><td>Fast pipeline (under about 10 minutes to feedback)</td><td>Slow pipelines get batched changes, and batches are riskier</td></tr>
<tr><td>Everything as code</td><td>Pipeline, infrastructure and config reviewed and versioned like the app</td></tr>
<tr><td>Rollback is a button, not a project</td><td>Keep the previous version deployable; keep database migrations backward compatible</td></tr>
</table>`);

appendTopic("cicd", [
{
  q: "Rebase or merge? And how do you recover when a rebase goes wrong?",
  level: "beginner", hot: true, tags: ["git", "rebase", "reflog", "must-know"],
  companies: ["Atlassian", "Microsoft", "Amazon", "Infosys", "TCS", "Accenture", "GitHub"],
  a: `<p>Both combine work from two branches. They differ in the history they leave behind.</p>
<pre><code>Start:  main:     A---B---C
                       \\
        feature:        D---E

git merge main   (on feature)            git rebase main   (on feature)

        A---B---C                                A---B---C
             \\   \\                                        \\
              D---E---M                                   D'---E'
  keeps real history, adds a merge commit    replays D and E on top of C as
                                             NEW commits D' and E' (new hashes).
                                             A straight line, no merge commit.</code></pre>
<table>
<tr><th></th><th>Merge</th><th>Rebase</th></tr>
<tr><td>History</td><td>True record of what happened, with merge commits</td><td>Linear and easy to read</td></tr>
<tr><td>Rewrites commits</td><td>No</td><td>Yes: new hashes for every replayed commit</td></tr>
<tr><td>Safe on shared branches</td><td>Yes</td><td><strong>No</strong>: others still have the old commits</td></tr>
<tr><td>Conflicts</td><td>Resolved once</td><td>Possibly once per replayed commit</td></tr>
</table>
<p><strong>The rule most teams use:</strong> rebase your <em>own</em> branch onto main to stay current before opening or updating a PR; never rebase a branch someone else has pulled; merge PRs into main (often as a squash merge, which turns the PR into one commit).</p>
<pre><code># Keep your branch current with main, cleanly
git fetch origin
git rebase origin/main
# resolve a conflict:   edit files -&gt; git add &lt;file&gt; -&gt; git rebase --continue
# give up entirely:     git rebase --abort      (back to exactly where you started)
git push --force-with-lease    # needed after a rebase; refuses if someone else
                               # pushed to the branch meanwhile (plain --force
                               # would silently delete their work)</code></pre>
<p><strong>When it goes wrong: the reflog.</strong> Git records every position <code>HEAD</code> has been at, including commits that no branch points to anymore. A "lost" commit after a bad rebase or reset is almost always still there for about 90 days.</p>
<pre><code>git reflog
# 4e1a9c2 HEAD@{0}: rebase (finish): returning to refs/heads/feature
# 9b7d310 HEAD@{1}: rebase (pick): Add discount rules
# ...
# c81f0aa HEAD@{5}: commit: Add discount rules      &lt;- the branch BEFORE the rebase

git branch rescue c81f0aa        # safest: put a new branch on the old state, inspect it
git reset --hard c81f0aa         # or move the current branch back (only once you are sure;
                                 # --hard discards uncommitted work in progress)</code></pre>
<table>
<tr><th>Situation</th><th>Recovery</th></tr>
<tr><td>Mid-rebase, it is a mess</td><td><code>git rebase --abort</code></td></tr>
<tr><td>Rebase finished, result is wrong</td><td><code>git reflog</code>, find the pre-rebase entry, branch or reset to it</td></tr>
<tr><td>Deleted a branch with unmerged work</td><td><code>git reflog</code> (or the hash printed on deletion) and <code>git branch name &lt;hash&gt;</code></td></tr>
<tr><td>Committed to main by mistake, not pushed</td><td><code>git branch feature</code>, then <code>git reset --keep HEAD~1</code> on main</td></tr>
<tr><td>Bad commit already pushed to a shared branch</td><td><code>git revert &lt;hash&gt;</code>: a new commit that undoes it. Never rewrite shared history</td></tr>
</table>
<p><strong>The one-liner:</strong> "Rebase private branches for a clean history, merge into shared ones, push rebased branches with <code>--force-with-lease</code>, and if anything goes wrong, the reflog still has the old commits."</p>`
},
{
  q: "A secret was committed to the repository and pushed. What do you do in the next hour?",
  level: "advanced", hot: true, tags: ["secrets", "security", "incident-response", "git", "must-know"],
  companies: ["Amazon", "Microsoft", "Razorpay", "PhonePe", "Atlassian", "GitHub", "Goldman Sachs"],
  a: `<p>This happens at every company eventually: an API key, database password or cloud access key ends up in a commit. The most common wrong answer is "delete the file and commit again". The secret is still in the history, and on a public repo automated scanners find new keys within minutes.</p>
<p><strong>The order matters. Revoke first, clean up second.</strong></p>
<table>
<tr><th>#</th><th>Step</th><th>Why in this order</th></tr>
<tr><td>1</td><td><strong>Revoke or rotate the secret now</strong>, at the provider (cloud console, payment gateway, database)</td><td>Once rotated, the leaked value is useless, whatever happens to the history. Everything else is secondary</td></tr>
<tr><td>2</td><td>Deploy the new secret to the systems that need it (secret manager, CI variables)</td><td>So rotation does not become an outage</td></tr>
<tr><td>3</td><td><strong>Check for misuse</strong>: provider audit logs from the time of the push onwards</td><td>Unknown API calls, new cloud instances (crypto mining is the classic), unusual database connections</td></tr>
<tr><td>4</td><td>Tell the security team, even if nothing looks wrong</td><td>They may be required to report it, and they see patterns you do not</td></tr>
<tr><td>5</td><td>Remove it from history, if the repo policy calls for it</td><td>Useful hygiene, but <strong>not</strong> a fix: forks, clones and caches may already have it</td></tr>
<tr><td>6</td><td>Prevent the next one</td><td>See below</td></tr>
</table>
<pre><code># Step 5: rewriting history (coordinate with the team: everyone must re-clone)
pip install git-filter-repo
git filter-repo --replace-text &lt;(echo 'the-leaked-value==&gt;REMOVED')
git push --force --all
git push --force --tags
# GitHub also keeps cached views of old commits and pull requests. Ask
# GitHub support to purge them for a sensitive leak.</code></pre>
<p><strong>Step 6: make it hard to happen again.</strong></p>
<pre><code># A pre-commit hook that scans staged changes (gitleaks shown)
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

# The same scan in CI, so a skipped local hook is still caught
- uses: gitleaks/gitleaks-action@v2

# GitHub: enable secret scanning + PUSH PROTECTION. Pushes containing
# known key formats are rejected before they reach the server.</code></pre>
<table>
<tr><th>Habit</th><th>What it prevents</th></tr>
<tr><td>Secrets only in a secret manager or CI secret variables</td><td>No secret ever needs to be in a file</td></tr>
<tr><td><code>.env</code> files in <code>.gitignore</code>; commit a <code>.env.example</code> with dummy values</td><td>The most common source of leaks</td></tr>
<tr><td>Short-lived credentials (OIDC from CI to the cloud, instead of stored access keys)</td><td>Nothing long-lived exists to leak</td></tr>
<tr><td>Masked variables in CI logs; never <code>echo</code> a secret</td><td>Leaks through build logs, which are often widely readable</td></tr>
</table>
<p><strong>What interviewers listen for:</strong> rotating <em>before</em> cleaning history, checking the audit logs for use, and changing the process rather than blaming the person. "Deleting the file fixes it" is the answer that fails the question.</p>`
}
]);
