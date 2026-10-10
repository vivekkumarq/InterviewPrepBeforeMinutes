registerPrimer("cicd", `<p class="pr-lead"><b>CI/CD</b> is the automated path that takes a code change from a developer's laptop to production. <b>Continuous Integration (CI)</b> automatically builds and tests every change as soon as it is pushed. <b>Continuous Delivery (CD)</b> keeps every passing change packaged and ready to release at the press of a button. <b>Continuous Deployment</b> goes one step further and releases it automatically.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of a car factory assembly line. Every car passes the same quality checks in the same order: frame, engine, brakes, final inspection. A car that fails a check is pulled off the line immediately, before more work is wasted on it. A CI/CD pipeline is that assembly line for code: every change passes the same automatic checks, and a failure stops it before it reaches customers.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Pipeline</dt><dd>The ordered list of automatic steps every change goes through: build, test, scan, deploy.</dd>
<dt>Build artifact</dt><dd>The packaged result of a build, such as a JAR file or a Docker image.</dd>
<dt>Branch / pull request (PR)</dt><dd>A separate line of work in git, and a request to merge it into the main branch after review.</dd>
<dt>Staging</dt><dd>A copy of production used to test changes before real users see them.</dd>
<dt>Rolling / blue-green / canary</dt><dd>Ways to release safely: gradually, by switching between two environments, or by sending a small share of users to the new version first.</dd>
<dt>Rollback</dt><dd>Going back to the previous working version when a release causes problems.</dd>
<dt>Feature flag</dt><dd>A switch that turns a feature on or off without deploying new code.</dd>
</dl>

<h3>Step by step: one change's journey to production</h3>
<ol class="pr-steps">
<li>A developer pushes a branch and opens a pull request.</li>
<li><b>CI runs the fast checks first:</b> compile, formatting and unit tests, in a couple of minutes.</li>
<li><b>Then the slower checks:</b> integration tests with a real database, plus security scans of dependencies and code.</li>
<li>A teammate reviews the code. The merge button only unlocks when all checks pass and the review is approved.</li>
<li>After merging, the pipeline builds <b>one</b> Docker image, tags it with the commit id, and stores it in a registry.</li>
<li>That same image is deployed to staging and checked with quick "smoke tests".</li>
<li>It is released to production gradually, for example to 5% of users first, while error rates are watched.</li>
<li>If everything looks healthy, it goes to 100%. If not, it is rolled back to the previous version.</li>
</ol>
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

<h3>The principles that matter</h3>
<ul>
<li><b>Fastest checks first:</b> a formatting error should fail in 30 seconds, not after a 20-minute test suite.</li>
<li><b>Build once, deploy the same thing everywhere:</b> rebuilding for each environment means production runs something that was never tested.</li>
<li><b>Keep the main branch always releasable:</b> unfinished features hide behind feature flags.</li>
<li><b>Everything as code:</b> the pipeline, infrastructure and configuration live in git and are reviewed like the app.</li>
<li><b>Rollback should be one button:</b> keep the previous version ready, and keep database changes compatible with it.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ A slow pipeline</p>
<p>When feedback takes 40 minutes, people batch many changes together, and bigger batches are riskier and harder to debug.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> cache dependencies, run test groups in parallel, and only rebuild what changed.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Ignoring flaky tests</p>
<p>A test that randomly fails teaches everyone to click "re-run" and ignore red builds, until a real failure is ignored too.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> move flaky tests out of the required checks, fix their cause, then bring them back.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Secrets in the code or pipeline files</p>
<p>A password committed to git stays in its history for ever, even after you delete it in a later commit.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> keep secrets in the CI tool's secret store, scan for leaks automatically, and change any secret that leaks immediately.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Database changes that break rollback</p>
<p>Renaming or dropping a column in the same release as the code change means the old version cannot run any more if you need to roll back.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> make database changes in small backward-compatible steps: add first, remove only in a later release.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>CI builds and tests every change automatically; CD keeps it ready to release.</li>
<li>Order pipeline checks from fastest to slowest.</li>
<li>Build one artifact and promote it through every environment.</li>
<li>Release gradually and watch metrics; roll back quickly if needed.</li>
<li>Keep secrets out of git and database changes backward compatible.</li>
</ul>
<p><b>Next:</b> the questions below cover pipeline design, Git workflows, deployment strategies, migrations, secrets and GitOps.</p>`);

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
