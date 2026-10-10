registerSimple("cicd", {
"How do you resolve a merge conflict and what causes them?":
`A merge conflict happens when two branches change the same lines, and git cannot decide which version to keep. Git marks the conflicting part in the file; you edit it to the correct combined version, remove the markers, run the tests, and commit. Merging small changes often keeps conflicts rare and small.`,

"What is trunk-based development and how do feature flags support it?":
`In trunk-based development, everyone merges small changes into the main branch at least daily, instead of keeping long-lived branches. Unfinished features are merged but hidden behind <b>feature flags</b>, switches that keep them turned off until they are ready. This avoids painful big merges and keeps main always releasable.`,

"How do you structure a monorepo pipeline?":
`A monorepo holds many projects in one repository. Building and testing everything on every commit becomes very slow, so the pipeline should detect which projects a change affects and build and test only those (plus anything depending on them), using caching. Tools such as Nx, Bazel or path filters help with this.`,

"How do you implement automated rollback and progressive delivery?":
`Progressive delivery releases a new version to a small share of users first (a canary), then gradually more. Tools such as Argo Rollouts or Flagger compare the canary's error rate and response times with the current version, and automatically roll back if it is worse, before most users are affected.`,

"How do you manage environments and configuration promotion?":
`Build the application once and move that exact same artifact through dev, staging and production. Only the configuration changes between environments, supplied through environment variables, config files or a config service. Then what you tested in staging is exactly what runs in production.`,

"What is DevSecOps and how do you shift security left?":
`DevSecOps means building security checks into the everyday pipeline instead of leaving them to the end. "Shift left" means catching problems early, when they are cheap to fix: scan for leaked secrets, check dependencies for known vulnerabilities, analyse code for security bugs and scan Docker images, all automatically on every change.`,

"How do you handle flaky tests in CI?":
`A flaky test passes and fails randomly without any code change. It teaches the team to ignore failures, which is dangerous. Track which tests are flaky, take them out of the required checks quickly, fix the cause (usually timing, shared state or test order), and only then put them back. Do not just keep re-running.`,

"How do you write good commit messages and why does it matter?":
`Write a short summary line in the imperative ("Fix login timeout"), a blank line, then explain <i>why</i> the change was made; the code already shows what changed. Good messages help reviewers, make it possible to understand old changes months later, and can be used to generate changelogs automatically.`,

"What is semantic versioning and how do you version libraries and services?":
`Semantic versioning uses MAJOR.MINOR.PATCH, such as 2.4.1. Increase PATCH for bug fixes, MINOR for new features that do not break anything, and MAJOR for changes that break existing users. It matters most for libraries, where users rely on it to know if upgrading is safe; services often just use the git commit or a date.`,

"How do you manage dependencies and keep them up to date?":
`Use a tool such as Dependabot or Renovate that opens small pull requests whenever a dependency has a new version, and let your tests check each update. Staying current in small steps is easier and safer than one huge upgrade years later, and it means security fixes reach you quickly.`,

"What is the difference between build, release and deploy artifacts?":
`<b>Build</b> turns code into a runnable package, such as a Docker image, which never changes afterwards. <b>Release</b> combines that package with the configuration for one environment. <b>Deploy</b> runs that release on servers. Keeping these separate means the same tested build can be released anywhere and rolled back easily.`,

"How do you set up a preview/ephemeral environment per pull request?":
`For each pull request, the pipeline automatically deploys the change to its own short-lived environment with a unique URL, and deletes it when the PR closes. Reviewers, designers and testers can then try the feature for real instead of only reading code. Keep it cheap with small databases and automatic clean-up.`,

"How do you handle CI for a team — code review, branch protection and quality gates?":
`Protect the main branch so nobody can push directly: changes must arrive through pull requests that pass all checks and get at least one approval. Add automatic quality gates such as tests, test coverage on new code, linting and security scans, so the rules are applied the same way every time, even under deadline pressure.`,

"Design a CI/CD pipeline for a Spring Boot microservice — what are the stages and why?":
`Order stages from fastest to slowest: compile and unit tests, static checks, integration tests with Testcontainers, security scans, build and push one Docker image, deploy to staging, smoke tests, then a gradual production release with automatic rollback. Fast stages first means quick feedback on the most common mistakes.`,

"How do you run database migrations safely as part of a deployment?":
`During a rolling deploy, old and new versions of the app run at the same time against the same database, so every migration must work with both. Use versioned migration tools (Flyway or Liquibase) and "expand and contract": add new columns or tables first, switch the code over, and remove old ones in a later release.`,

"What is GitOps and how does Argo CD differ from a push-based pipeline?":
`In GitOps, git holds the desired state of your environments, and a tool such as Argo CD running inside the cluster keeps pulling from git and applying changes automatically. In a push-based pipeline, the CI system pushes changes into the cluster. GitOps needs no cluster passwords in CI, fixes manual drift automatically, and makes every change a git commit.`,

"Your build is flaky and takes 40 minutes — how do you fix it?":
`For speed: cache dependencies, run tests in parallel, run only what the change affects, and move slow tests out of the critical path. For flakiness: find which tests fail randomly, take them out of the required checks, and fix their causes, such as timing assumptions, shared data or reliance on test order.`,

"Which Git branching strategy would you use, and how do you handle a hotfix?":
`For most teams, trunk-based development or GitHub Flow: short-lived branches merged into main quickly. For a hotfix, branch from what is in production, fix it, test it, release it, and make sure the fix also gets into main, so the next release does not bring the bug back.`,

"How do you do blue-green and canary deployments, and how do you decide to roll back?":
`<b>Blue-green</b>: run the new version as a complete second environment, then switch all traffic over at once, with instant switch-back. <b>Canary</b>: send a small share of traffic to the new version and increase it gradually. Decide in advance which numbers trigger a rollback, such as error rate or response time getting worse than the current version.`,

"What does a good CI pipeline look like, and how do you keep it fast?":
`A good pipeline gives feedback within about 10 minutes, runs the cheapest checks first, is reliable (no flaky tests), and builds one artifact used everywhere afterwards. Keep it fast with caching, parallel jobs, running only affected tests, and regularly removing slow or pointless steps.`,

"How do you handle a bad deploy in production?":
`First restore service, then investigate. Roll back to the last good version, or turn off the feature flag, instead of trying to fix forward under pressure. Tell the affected people what is happening. Once things are stable, find the root cause, then hold a blameless review to improve tests, monitoring or the release process.`,

"Rebase or merge? And how do you recover when a rebase goes wrong?":
`Both combine work from two branches. <b>Merge</b> keeps the true history with a merge commit. <b>Rebase</b> replays your commits on top of the latest main, giving a clean straight history. Only rebase your own branches that others are not using. If a rebase goes wrong, <code>git rebase --abort</code> cancels it, and <code>git reflog</code> helps you find your previous state.`,

"A secret was committed to the repository and pushed. What do you do in the next hour?":
`Treat the secret as stolen: revoke or change it immediately at its source, such as the cloud console, because deleting the commit does not help (copies may already exist). Then check logs for any misuse, remove it from git history if needed, and add automatic secret scanning so it cannot happen again.`,

"What is CI/CD? Distinguish continuous delivery from continuous deployment":
`<b>CI</b> means every change is merged often and automatically built and tested. <b>Continuous delivery</b> means every change that passes is ready to release, but a person decides when. <b>Continuous deployment</b> means every change that passes all checks goes to production automatically, with no manual step.`,

"What stages should a production CI/CD pipeline have?":
`Typically: build with cached dependencies, unit tests, static analysis, integration tests, security scans, package and publish one versioned artifact, deploy to staging, smoke tests, then a careful production rollout (canary or blue-green) with monitoring and automatic rollback.`,

"Write a GitHub Actions workflow for a Spring Boot service":
`Create a YAML file in <code>.github/workflows</code> that runs on every push and pull request: check out the code, set up Java with Maven caching, run <code>mvn verify</code>, then on the main branch build a Docker image and push it to a registry. Store passwords as GitHub secrets and use protected environments for production.`,

"What is a GitLab CI pipeline and how is it structured?":
`It is defined in a <code>.gitlab-ci.yml</code> file. The pipeline is split into <b>stages</b> (such as build, test, deploy) that run in order, and each stage contains <b>jobs</b> that run in parallel. Jobs run on machines called runners, can pass files to later jobs, and can be limited to certain branches.`,

"What branching strategy would you use and why?":
`For a team practising continuous delivery, trunk-based development: small branches merged into main daily, with feature flags for unfinished work. GitFlow, with long-lived develop and release branches, suits software with scheduled versioned releases but slows teams that deploy often.`,

"How do you manage secrets in a CI/CD pipeline?":
`Never put secrets in code or pipeline files. Store them in the CI tool's encrypted secret store or a secret manager such as Vault, give each job only the secrets it needs, prefer short-lived credentials (for example OIDC to the cloud), hide them in logs, and scan every commit for leaked secrets.`,

"How do you achieve zero-downtime deployments?":
`Run several copies behind a load balancer and replace them gradually. Use readiness checks so traffic only goes to ready copies, shut down gracefully so in-flight requests finish, make database changes compatible with both old and new versions, and keep APIs backward compatible.`,

"What is Infrastructure as Code and why does it matter?":
`Infrastructure as Code means describing servers, networks and databases in files, with tools such as Terraform, instead of clicking in a cloud console. The files live in git, so changes are reviewed, repeatable and easy to roll back, and you can create identical environments whenever you need them.`,

"How do you handle database migrations in a CI/CD pipeline?":
`Keep migrations as versioned scripts in the same repository, managed by Flyway or Liquibase, and never edit one that has already run. Test them in CI against a real database, run them automatically during deployment, and keep each one compatible with the previous app version so you can still roll back.`,

"What is the difference between Jenkins, GitHub Actions and GitLab CI?":
`<b>Jenkins</b> is self-hosted and extremely flexible through plugins, but you must run and maintain it yourself. <b>GitHub Actions</b> is built into GitHub, configured with YAML, with a large marketplace of ready-made steps. <b>GitLab CI</b> is built into GitLab and covers the whole flow from code to deployment in one product.`,

"How do you make a CI pipeline fast?":
`Cache dependencies and Docker layers, run independent jobs and test groups in parallel, run only what the change affects, use faster machines for heavy steps, put quick checks first so failures surface early, and regularly look for the slowest steps to improve.`,

"What are the essential Git commands and workflows you use?":
`Everyday commands: <code>clone</code>, <code>status</code>, <code>add</code>, <code>commit</code>, <code>push</code>, <code>pull</code>, <code>switch</code> to change branches, <code>merge</code> or <code>rebase</code> to combine work, <code>log</code> to see history, <code>stash</code> to set work aside, and <code>reflog</code> to recover from mistakes. The usual workflow: branch, commit, push, open a pull request, merge after review.`,

"How do you implement canary and blue-green deployments in practice?":
`<b>Blue-green</b>: keep two complete environments, deploy to the idle one, test it, then switch the load balancer over, keeping the old one ready for instant switch-back. <b>Canary</b>: route a small percentage of traffic to the new version, using a service mesh, Ingress weights or Argo Rollouts, and increase it step by step while comparing metrics.`,

"What is observability in a CI/CD and production context — what would you monitor?":
`For delivery, track the four DORA measures: how often you deploy, how long a change takes to reach production, how often releases fail, and how quickly you recover. In production, watch error rates, response times, traffic and resource use, linked to each deployment so you can see immediately whether a release caused a problem.`
});
