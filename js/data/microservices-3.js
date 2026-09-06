appendTopic("microservices", [
{
  q: "How do you handle schema and data migration across services during a release?",
  level: "advanced", tags: ["migration", "deployment"],
  a: `<p>The constraint that drives everything: during a rolling deploy, version N and N+1 run <strong>simultaneously</strong> against the <em>same</em> schema. Every migration must be compatible with both.</p>
<pre><code>-- ✘ One-step rename — breaks version N the instant it runs
ALTER TABLE orders RENAME COLUMN amount TO total_amount;

-- ✔ Expand and contract, across SEPARATE releases
-- Release 1: EXPAND — add the new column, nullable
ALTER TABLE orders ADD COLUMN total_amount numeric(19,2);

-- Release 2: dual write — application writes BOTH, reads the old one
order.setAmount(v); order.setTotalAmount(v);

-- Release 3: backfill in batches, then switch reads to the new column
UPDATE orders SET total_amount = amount WHERE total_amount IS NULL LIMIT 10000;  -- batched

-- Release 4: stop writing the old column
-- Release 5: CONTRACT — finally drop it
ALTER TABLE orders DROP COLUMN amount;</code></pre>
<p><strong>The same principle applies to events</strong>, and this is where multi-service releases actually break: a consumer deployed before the producer must tolerate the old event shape, and a consumer deployed after must tolerate the new one. Schema registry compatibility (BACKWARD) enforces it, and new fields always need defaults.</p>
<p><strong>Ordering rules for a multi-service release:</strong></p>
<ol>
<li><strong>Deploy consumers before producers</strong> for an additive event change — consumers must be able to handle the new field before it appears.</li>
<li><strong>Deploy producers before consumers</strong> when consumers depend on a new field existing.</li>
<li><strong>Never require a specific order</strong> if you can avoid it — design the change so either order works, because in practice deployments fail halfway and get rolled back.</li>
</ol>
<p><strong>Operational details:</strong> run migrations as a separate step (an init container or a Job) rather than on application startup in every replica, so N pods do not race; set a <code>lock_timeout</code> so a migration waiting on a lock cannot block the entire table; and use <code>CREATE INDEX CONCURRENTLY</code> and <code>NOT VALID</code> constraints so DDL does not take an exclusive lock.</p>
<p><strong>The honest point:</strong> a five-release rename feels laborious, and teams routinely shortcut it. The shortcut is fine until the deploy needs rolling back — at which point the old version cannot read the new schema and you have an outage with no way out.</p>`
},
{
  q: "What is a distributed lock and when do you need one?",
  level: "advanced", hot: true, tags: ["concurrency", "patterns"],
  a: `<pre><code>// Redis with Redisson — the common implementation
RLock lock = redisson.getLock("order:" + orderId);
if (lock.tryLock(2, 30, TimeUnit.SECONDS)) {      // wait 2s, hold at most 30s
    try {
        processOrder(orderId);
    } finally {
        if (lock.isHeldByCurrentThread()) lock.unlock();   // ALWAYS in finally
    }
}

// Database advisory lock — no extra infrastructure
SELECT pg_try_advisory_xact_lock(hashtext('nightly-report'));  -- released at commit

// ShedLock — for the single-runner scheduled job case specifically
@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "nightlyReport", lockAtMostFor = "30m", lockAtLeastFor = "5m")
void nightlyReport() { }</code></pre>
<p><strong>Where a distributed lock is genuinely needed:</strong> ensuring one instance runs a scheduled job; serialising access to a non-transactional external resource; and leader election.</p>
<p><strong>Where it is the wrong tool — and this is the more important half of the answer:</strong> most "we need a lock" situations are better solved by the database. If the resource is a database row, an atomic conditional update or optimistic locking gives correctness with no extra system, no timeout tuning and no failure mode:</p>
<pre><code>-- No distributed lock needed at all
UPDATE inventory SET stock = stock - :qty
WHERE sku = :sku AND stock &gt;= :qty;      -- 0 rows updated = insufficient stock

UPDATE order SET status = 'PROCESSING'
WHERE id = :id AND status = 'PENDING';    -- only one caller can win</code></pre>
<p><strong>The correctness caveat you should raise:</strong> a Redis lock is <em>not</em> a safety guarantee. If a process holding the lock is paused by a long GC or a network partition beyond the lease TTL, the lock expires and a second process acquires it — now two processes believe they hold it. Martin Kleppmann's critique of Redlock covers this. The mitigations are fencing tokens (a monotonically increasing number the resource checks), keeping critical sections short, and — most reliably — making the protected operation idempotent so a double execution is harmless.</p>
<p><strong>The summary:</strong> "Use a distributed lock for coordination and efficiency, never as the sole guarantee of correctness. If correctness depends on it, put the check where the data is."</p>`
},
{
  q: "How do you design service-level objectives and error budgets?",
  level: "advanced", tags: ["production", "sre"],
  a: `<table>
<tr><th>Term</th><th>Meaning</th></tr>
<tr><td><strong>SLI</strong></td><td>Service Level <em>Indicator</em> — the measurement. "% of requests returning under 300 ms"</td></tr>
<tr><td><strong>SLO</strong></td><td>Service Level <em>Objective</em> — the internal target. "99.9% over 30 days"</td></tr>
<tr><td><strong>SLA</strong></td><td>Service Level <em>Agreement</em> — the contractual promise, with penalties. Always looser than the SLO</td></tr>
<tr><td><strong>Error budget</strong></td><td>1 − SLO. At 99.9%, you may be unavailable ~43 minutes per 30 days</td></tr>
</table>
<pre><code># Availability SLI as a Prometheus ratio
sum(rate(http_server_requests_seconds_count{status!~"5.."}[30d]))
/ sum(rate(http_server_requests_seconds_count[30d]))

# Latency SLI — proportion of requests within the target
sum(rate(http_server_requests_seconds_bucket{le="0.3"}[30d]))
/ sum(rate(http_server_requests_seconds_count[30d]))

# Burn-rate alert: fires when the budget is being consumed too fast,
# rather than on a fixed error-rate threshold
(1 - slo_ratio_5m) &gt; 14.4 * (1 - 0.999)     # 2% of a 30-day budget in 1 hour -> page</code></pre>
<p><strong>Why the error budget is the useful idea:</strong> it converts reliability from an argument into a number. If the budget is intact, the team ships features freely. If it is exhausted, the policy is agreed in advance — feature work pauses and reliability work takes priority. That removes the recurring "should we do this refactor or that feature" debate, because the data decides.</p>
<p><strong>Practical guidance:</strong></p>
<ul>
<li><strong>Measure what users experience</strong> — request success and latency at the edge, not CPU or pod restarts.</li>
<li><strong>Do not aim for 100%.</strong> Each additional nine costs disproportionately more, and a service with zero errors is one where you are over-investing in reliability relative to features.</li>
<li><strong>Alert on burn rate, not raw thresholds.</strong> A multi-window, multi-burn-rate alert pages for a fast burn and opens a ticket for a slow one — which is what stops alert fatigue.</li>
<li><strong>Set the SLO from what users actually need</strong>, and remember your SLO cannot be better than the dependencies you rely on.</li>
</ul>`
},
{
  q: "How do you decide when a microservice is too big or too small?",
  level: "advanced", hot: true, tags: ["design", "judgement"],
  a: `<p>There is no line count that answers this. The useful signals are about <em>coupling</em> and <em>change</em>.</p>
<p><strong>Signs a service is too big:</strong></p>
<ul>
<li>Several teams change it, and their releases block each other.</li>
<li>It has multiple unrelated reasons to change — billing rules and shipping labels in the same deployable.</li>
<li>Parts of it have very different scaling profiles: one endpoint needs 20 replicas, the rest needs 2.</li>
<li>Its database has clearly separable table clusters with no joins between them.</li>
<li>The test suite takes so long that people stop running it.</li>
</ul>
<p><strong>Signs a service is too small:</strong></p>
<ul>
<li><strong>It cannot be deployed without another one</strong> — the clearest signal of all. That is a distributed module, not a service.</li>
<li>Most features require changing it <em>and</em> its neighbour in the same sprint.</li>
<li>It is chattier than it is useful — every operation makes three network calls to complete one logical action.</li>
<li>It owns no data of its own, only orchestrating others.</li>
<li>The operational overhead (pipeline, dashboards, on-call, dependency updates) exceeds the code it contains.</li>
</ul>
<p><strong>The tests I would actually apply:</strong></p>
<ol>
<li><strong>Deployment independence</strong> — can it be released without coordinating with anyone? If not, the boundary is wrong.</li>
<li><strong>Data ownership</strong> — does it own its tables, with no other service reading them?</li>
<li><strong>Team ownership</strong> — can one team own it end to end? (Conway's Law is descriptive, not aspirational — the architecture will match the communication structure whether you plan it or not.)</li>
<li><strong>Change locality</strong> — does a typical feature touch one service, or five?</li>
</ol>
<blockquote><p><strong>The judgement to express:</strong> "I would rather start with fewer, larger services and split when a boundary proves itself — a specific scaling need, a genuine team-ownership split, or a part that changes on a different cadence. Merging two services that were split too early is much harder than splitting one that grew too large, because you have already distributed the data."</p></blockquote>`
}
]);
