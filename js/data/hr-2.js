appendTopic("hr", [
{
  q: "Describe a technically complex project you worked on",
  level: "advanced", hot: true, tags: ["behavioural", "technical"],
  a: `<p>This question separates candidates who <em>did</em> the work from those who were nearby when it happened. The interviewer will drill into your decisions, so choose a project you can defend in depth.</p>
<p><strong>Structure:</strong> context → the hard part → your specific contribution → the trade-offs you weighed → outcome → what you would do differently.</p>
<blockquote><p><em>"The one I'd pick is an event-driven order platform I built with two independent services communicating only through Kafka.</em></p>
<p><em>The genuinely hard part was consistency. When an order is placed I have to save it to the database and publish an event — two systems, no shared transaction. A crash between them either loses the event or publishes one for an order that rolled back. I implemented the transactional outbox pattern: the event is written to an outbox table in the same transaction as the order, and a separate relay publishes from there.</em></p>
<p><em>That gives at-least-once delivery, so the consumer has to be idempotent. I used a processed-events table with a unique constraint on the event ID, written in the same transaction as the effect — so a duplicate delivery fails the insert and skips cleanly. I also added optimistic locking for concurrent stock updates and dead-letter topics with bounded retry, distinguishing transient failures from permanent ones so a malformed message doesn't block the partition forever.</em></p>
<p><em>The trade-off I accepted is eventual consistency — the order is PENDING for a moment before inventory confirms. That's visible to the user, so I made it explicit in the status rather than pretending it was instant.</em></p>
<p><em>If I did it again, I'd use Debezium CDC instead of a polling relay — lower latency and it can't miss a row."</em></p></blockquote>
<p><strong>What makes this answer work:</strong> it names a real problem (dual writes), explains <em>why</em> the naive approach fails, describes the specific mechanism, acknowledges the cost, and ends with a genuine improvement. Be ready for follow-ups on every sentence — that is the point of the question.</p>`
},
{
  q: "How do you approach learning a new codebase?",
  level: "beginner", hot: true, tags: ["behavioural", "onboarding"],
  a: `<p>A very practical question — they are estimating how long before you are productive.</p>
<blockquote><p><em>"I work outside-in rather than trying to read everything.</em></p>
<p><em>First I get it running locally and exercise the main user flows, because seeing the system behave tells me more than any diagram. Then I pick one real request and trace it end to end — controller, service, repository, database — which teaches me the layering, the conventions and where the seams are.</em></p>
<p><em>Then I read the tests. They're usually the best documentation available: they show intended behaviour, edge cases the team has already hit, and what's considered important enough to protect.</em></p>
<p><em>I look at the data model early, because the schema constrains everything above it, and at git history for the files I'll be working in — <code>git log</code> and <code>blame</code> tell me which areas change constantly and which are stable.</em></p>
<p><em>Then I take a small, real ticket. A bug fix is ideal because it forces me to debug, which is where you actually learn a system. And I write down everything that confused me — that becomes an onboarding note for the next person, which is the one contribution a new joiner can make immediately."</em></p></blockquote>
<p><strong>What this demonstrates:</strong> a repeatable method rather than "I read the code"; using tests and git history as information sources, which most people overlook; and improving onboarding for others. If you have genuinely done the last part, say so — it is a strong differentiator.</p>
<p>A good follow-up to volunteer: how you handle a codebase with <em>no</em> tests and no documentation — usually by adding characterisation tests around the area you must change, so you have a safety net before touching anything.</p>`
},
{
  q: "Tell me about a time you disagreed with a technical decision",
  level: "advanced", hot: true, tags: ["behavioural", "conflict"],
  a: `<p>They are assessing whether you can push back constructively <em>and</em> commit to a decision that goes against you. Both halves matter — a candidate who only describes winning looks difficult to work with.</p>
<blockquote><p><em>Situation: The team was planning to add a second database — a document store — for a feature that needed flexible, user-defined fields.</em></p>
<p><em>Task: I had concerns, but it wasn't my decision to make alone.</em></p>
<p><em>Action: Rather than object in the meeting, I asked what specifically we needed that our existing PostgreSQL couldn't do. The answer was schema flexibility. So I built a small prototype using JSONB with a GIN index and benchmarked it against our expected query patterns. It handled them comfortably.</em></p>
<p><em>I presented it as a comparison rather than a rebuttal: here's what each option costs us — a second datastore means another thing to back up, monitor, secure, and another consistency boundary, versus JSONB which stays in one transaction and one operational surface. I was explicit about where I'd be wrong: if the volume or query shapes grew beyond what JSONB handles well, the document store would win.</em></p>
<p><em>Result: We went with JSONB and it's still serving that feature. But the part I'd emphasise is that the conversation changed from a preference argument into a decision with evidence, and we wrote down the conditions under which we'd revisit it.</em></p></blockquote>
<p><strong>Have a second story ready where you lost</strong> — that is often the follow-up. The strong version is: you raised the concern clearly, the decision went the other way, you committed fully and helped make it succeed, and either it worked out (you were wrong, and you say so) or the risk materialised and you had already documented the mitigation.</p>
<p><strong>The phrase worth using:</strong> "disagree and commit". Interviewers listen for it because it signals you can hold a strong opinion without being an obstacle.</p>`
},
{
  q: "How do you handle production incidents?",
  level: "advanced", hot: true, tags: ["behavioural", "production"],
  a: `<p>Answer with a <em>procedure</em>, because the interviewer wants to know you will be calm and systematic at 3am.</p>
<ol>
<li><strong>Assess impact first, not cause.</strong> How many users, which flows, is money affected? That determines urgency and who needs to be involved.</li>
<li><strong>Communicate early.</strong> Post in the incident channel: what is broken, what is the impact, who is investigating. Silence during an incident is worse than uncertainty — people start duplicating work.</li>
<li><strong>Mitigate before diagnosing.</strong> Roll back, disable the feature flag, scale up, fail over. Restoring service and understanding the cause are separate activities, and users only care about the first.</li>
<li><strong>Ask "what changed?"</strong> Most incidents follow a deploy, a config change, a traffic shift or a dependency's incident. Deploy markers on dashboards make this a ten-second question.</li>
<li><strong>Diagnose with evidence</strong> — traces, metrics, logs by correlation ID, thread and heap dumps if it is a JVM problem. Form a hypothesis, test it, discard it quickly if wrong rather than getting attached.</li>
<li><strong>Fix, verify, and confirm recovery</strong> on the same metric that alerted.</li>
<li><strong>Blameless post-mortem</strong> — timeline, contributing factors, and action items with owners. The question is "what about our system allowed this?", never "who did it".</li>
</ol>
<blockquote><p><em>"We had intermittent API failures at peak. I checked recent changes first — nothing had deployed — then the metrics showed latency spikes correlating with GC pauses rather than request volume. I took a heap dump during an incident window and found a cache with no eviction policy. The immediate mitigation was a restart to buy time; the fix was a bounded cache with a TTL. The more useful outcome was that we had no visibility into cache size anywhere, so I added that metric across services and an alert on it."</em></p></blockquote>
<p><strong>The detail that impresses:</strong> separating mitigation from diagnosis, and ending with a <em>systemic</em> improvement rather than just the fix. That is the difference between firefighting and engineering.</p>`
},
{
  q: "How do you prioritise when everything is urgent?",
  level: "advanced", tags: ["behavioural", "process"],
  a: `<blockquote><p><em>"I try to make the trade-off visible rather than absorbing it silently, because quietly working longer hours hides a real capacity problem from the people who can fix it.</em></p>
<p><em>Practically: I sort by impact and reversibility. Anything affecting production or blocking other people comes first — a colleague blocked on my review costs two people's time, not one. Then work with a hard external deadline. Then everything else.</em></p>
<p><em>Then I go back to whoever owns the priorities and say: 'These three things are all marked urgent. I can deliver two this sprint. Which two?' Almost every time, one turns out to be less urgent than it looked, or someone else can take it. Asking that question is usually faster than trying to do all three badly.</em></p>
<p><em>I also flag risk early rather than at the deadline. Saying on day two that something won't fit gives people options; saying it on the last day gives them none."</em></p></blockquote>
<p><strong>Frameworks worth naming if they ask:</strong> impact versus effort, the Eisenhower matrix (urgent/important), and cost of delay — but the honest point is that in most teams the real skill is not the framework, it is having the conversation with the person who owns the priorities instead of trying to be a hero.</p>
<p><strong>A strong addition:</strong> mention that you distinguish <em>urgent</em> from <em>important</em> deliberately, because production incidents and interruptions are always urgent and will consume everything if you let them — so protecting time for the important-but-not-urgent work (tests, refactoring, documentation) is a conscious decision, not something that happens naturally.</p>`
},
{
  q: "What questions reveal whether a company is a good place to work?",
  level: "advanced", tags: ["closing", "evaluation"],
  a: `<p>You are evaluating them too. These questions get honest, revealing answers because they are specific enough to be hard to spin:</p>
<p><strong>On engineering health:</strong></p>
<ul>
<li>"How long does it take from a commit being merged to running in production?" — measures CI/CD maturity and how much friction you will face daily.</li>
<li>"How often do you deploy?" — daily suggests good automation and small changes; monthly suggests a heavy release process.</li>
<li>"What happens when the build breaks on main?" — reveals whether quality is genuinely owned.</li>
<li>"How much time does the team spend on unplanned work?" — a proxy for technical debt and operational load.</li>
</ul>
<p><strong>On how decisions are made:</strong></p>
<ul>
<li>"How was the last significant architectural decision made, and who was involved?"</li>
<li>"How do engineers influence what gets built, rather than only how?"</li>
<li>"When was the last time the team pushed back on a deadline, and what happened?"</li>
</ul>
<p><strong>On the team's reality:</strong></p>
<ul>
<li>"What does on-call look like — how often does someone get paged outside hours?"</li>
<li>"What's the most frustrating part of working here?" — the most valuable question you can ask. A thoughtful, specific answer signals honesty and self-awareness; "nothing really" signals either a rehearsed script or a lack of reflection.</li>
<li>"Why did the last person in this role leave?"</li>
<li>"What would make you say, six months from now, that hiring me was a success?"</li>
</ul>
<p><strong>Red flags to listen for:</strong> nobody can describe the deployment process; "we're like a family" used to justify long hours; no time allocated to testing or technical debt; heavy on-call load treated as normal; high turnover on the team; and vague or evasive answers about why the role is open.</p>
<p><strong>Green flags:</strong> specific, concrete answers with examples; willingness to name real problems; engineers involved in product decisions; and evidence of continuous improvement — "we changed X after a retro" is worth more than any stated value.</p>`
}
]);
