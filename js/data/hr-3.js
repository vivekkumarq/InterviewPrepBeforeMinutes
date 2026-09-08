appendTopic("hr", [
{
  q: "Tell me about a time you disagreed with your manager or tech lead",
  level: "beginner", hot: true, tags: ["behavioural", "conflict"],
  companies: ["Amazon", "TCS", "Infosys", "Wipro", "Accenture", "Optum", "Deloitte"],
  a: `<p><strong>What is actually being assessed:</strong> can you disagree without becoming difficult, and can you commit to a decision that went against you? Interviewers are screening for two failure modes — the person who never pushes back, and the person who cannot let go.</p>
<table>
<tr><th>STAR</th><th>What to put there</th></tr>
<tr><td><strong>Situation</strong></td><td>The technical decision and why it mattered — one or two sentences</td></tr>
<tr><td><strong>Task</strong></td><td>Your specific concern, framed around risk to the project, not preference</td></tr>
<tr><td><strong>Action</strong></td><td>How you raised it: privately, with evidence, and with a proposal</td></tr>
<tr><td><strong>Result</strong></td><td>The outcome — <em>including if you were overruled</em>, and how you then supported the decision</td></tr>
</table>
<p><strong>A model answer:</strong></p>
<blockquote><p>"On a payments integration, my lead wanted to store the third-party transaction status in our own table and keep it in sync. I was concerned we would end up with two sources of truth that would drift during failures.</p>
<p>Rather than argue in the design meeting, I spent an afternoon writing up the specific failure scenarios — what happens if our write succeeds and theirs times out — and I built a small proof of concept using their webhook plus a reconciliation job instead.</p>
<p>I took it to him one-on-one, framed as 'here is a case I think we should handle either way', not as 'your design is wrong'. He agreed on the reconciliation part but kept the local table for query performance, which was a fair point I had not weighted properly.</p>
<p>We shipped the hybrid. The reconciliation job caught about a dozen mismatches in the first month, so the concern was real — but so was his performance argument, and the combination was better than either of our original proposals."</p></blockquote>
<p><strong>Why this works:</strong> the disagreement is technical rather than personal; the action is evidence and a prototype rather than an opinion; it was raised privately; and the conclusion admits the other person was partly right. That last part is what makes it credible.</p>
<p><strong>What to avoid:</strong></p>
<ul>
<li>"I've never disagreed with a manager" — reads as either passive or dishonest.</li>
<li>A story where you were completely right and they were completely wrong.</li>
<li>Anything that criticises a named former colleague or employer.</li>
<li>An unresolved conflict with no learning at the end.</li>
</ul>
<p><strong>If you were overruled and it went badly</strong>, that is still a strong story — provided you end on "I raised it, I documented it, and once the decision was made I executed it properly rather than half-heartedly." Disagree and commit is a named value at several of the companies that ask this question.</p>`
},
{
  q: "Why are you leaving your current company?",
  level: "beginner", hot: true, tags: ["behavioural", "common"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "HCL", "Amazon"],
  a: `<p><strong>The rule:</strong> move <em>towards</em> something, never away from something. Every negative framing invites the interviewer to wonder whether you will say the same about them in eighteen months.</p>
<table>
<tr><th>Do not say</th><th>Say instead</th></tr>
<tr><td>"My manager is difficult"</td><td>"I'm looking for a team where I can take more ownership of design decisions"</td></tr>
<tr><td>"The pay is bad"</td><td>"Compensation is a factor, but the main reason is scope — I want to work on systems at higher scale"</td></tr>
<tr><td>"It's boring / maintenance only"</td><td>"I've learned a lot maintaining a mature system; I'm now looking to build something from the design stage"</td></tr>
<tr><td>"No growth"</td><td>"I've grown into the senior scope available here and want the next step, which isn't opening up soon"</td></tr>
<tr><td>"Too much pressure"</td><td>"I'm looking for a place with stronger engineering practices — testing and code review as defaults"</td></tr>
<tr><td>"The company is struggling"</td><td>"I want to be somewhere investing in the platform long term"</td></tr>
</table>
<p><strong>A strong template:</strong></p>
<blockquote><p>"I've had a good run here — I've owned [specific thing] end to end and learned a lot about [specific skill]. What I'm looking for next is [specific thing this role offers: scale, domain, technology, ownership], and that isn't something my current role is going to grow into in the near term. When I saw this role involved [specific detail from the job description], it lined up closely with the direction I want to take."</p></blockquote>
<p><strong>Handling the genuinely bad situations honestly:</strong></p>
<ul>
<li><strong>Layoff or restructuring</strong> — say it plainly and without embarrassment. "My team was affected by a restructuring in March." It is common and carries no stigma; being evasive about it does.</li>
<li><strong>You were let go</strong> — brief, factual, one sentence on what you would do differently, then move forward. Do not over-explain.</li>
<li><strong>A genuinely toxic environment</strong> — abstract it: "The team went through a lot of turnover and I want more stability." Do not detail it; the interviewer cannot verify your side and detail sounds like grievance.</li>
<li><strong>Short tenure</strong> — address it before they ask: "It was shorter than I planned, because the role turned out to be quite different from what was described. I'm being more careful about that in this search, which is why I'm asking detailed questions today."</li>
</ul>
<p><strong>The tone that matters more than the words:</strong> speak about your current employer the way you would want them to speak about you. Interviewers consistently report that badmouthing a previous employer is one of the fastest ways to lose an otherwise strong candidate.</p>`
},
{
  q: "How do you handle a production incident, and can you walk me through one?",
  level: "advanced", hot: true, tags: ["behavioural", "production"],
  companies: ["Amazon", "Optum", "Maersk", "Flipkart", "Walmart", "Societe Generale", "Deloitte"],
  a: `<p>This is a behavioural question with a technical spine — they want to see judgement under pressure, not heroics.</p>
<table>
<tr><th>Phase</th><th>What good looks like</th></tr>
<tr><td><strong>Detect</strong></td><td>An alert found it, not a customer. Name the signal — error rate, latency, a saturated queue.</td></tr>
<tr><td><strong>Communicate</strong></td><td>Open a channel, post an initial status early, name an incident lead. Silence is worse than "still investigating".</td></tr>
<tr><td><strong>Mitigate first</strong></td><td><strong>Restore service before diagnosing.</strong> Roll back, disable the feature flag, scale up, fail over.</td></tr>
<tr><td><strong>Diagnose</strong></td><td>What changed? Deploy, config, traffic, a dependency. Use logs, traces, metrics — in that order of specificity.</td></tr>
<tr><td><strong>Fix and verify</strong></td><td>Confirm recovery with the same metric that alerted, not by feel.</td></tr>
<tr><td><strong>Post-mortem</strong></td><td>Blameless, with action items that have owners and dates.</td></tr>
</table>
<p><strong>The single most important thing to say:</strong> <em>mitigate before you diagnose.</em> Many candidates describe debugging for an hour while the system is down. The right instinct is to roll back first — you can find the root cause with the service healthy.</p>
<p><strong>A model answer:</strong></p>
<blockquote><p>"We got paged at about 9pm for a spike in 5xx on the orders API — error rate went from near zero to about 15%.</p>
<p>First thing I checked was whether anything had shipped. There had been a deploy 40 minutes earlier, so I rolled it back rather than trying to understand the failure first. Error rate came back to normal within about four minutes, and I posted that in the incident channel so support knew customers were fine.</p>
<p>With the pressure off, we looked properly. The release added a new column to a query, and on the read replica the migration hadn't finished applying — so a fraction of requests hit a replica without the column and failed. It was intermittent because it depended on which replica served the request, which is exactly why it passed in staging with a single database.</p>
<p>Two things came out of the post-mortem: we made schema migrations a separate step that must complete and be verified before the application deploy, and we added a replica-lag check to the deployment gate. We haven't had that class of failure since."</p></blockquote>
<p><strong>Details that make it credible:</strong> a real metric, a rough timeline, rollback before diagnosis, an explanation of <em>why staging did not catch it</em>, and concrete process changes. Notice there is no blame on any individual — that is deliberate and interviewers notice it.</p>
<p><strong>If you have never been on-call,</strong> say so honestly and describe the closest thing — a severe bug in a shared environment, a failed release — using the same structure. Fabricating an incident falls apart under two follow-up questions.</p>`
},
{
  q: "Where do you see yourself in five years, and what are your career goals?",
  level: "beginner", tags: ["behavioural", "common"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "Amazon", "Optum"],
  a: `<p><strong>What they are really asking:</strong> three things at once — are your ambitions compatible with this role, will you stay long enough to be worth hiring, and have you thought about your career at all?</p>
<p><strong>The structure that works:</strong> a clear direction, not a job title with a date on it.</p>
<blockquote><p>"In the near term I want to go deeper technically — I've been building backend services, and I want to get to the point where I'm designing systems end to end rather than implementing a design someone else made. Concretely that means owning a service, its data model, and its operational side.</p>
<p>Over about five years I'd like to be the person a team goes to on architecture for a domain — someone who can weigh trade-offs and mentor engineers earlier in their career. I've enjoyed the mentoring I've done so far, so I'd want more of it.</p>
<p>I'm honestly not sure yet whether that becomes a staff engineer path or eventually management. I'd rather figure that out by doing the work than commit to a title now. What I'm sure about is that I want to keep the technical depth either way — which is part of why this role appealed to me, since it involves [specific thing from the JD]."</p></blockquote>
<table>
<tr><th>Avoid</th><th>Why</th></tr>
<tr><td>"I want your interviewer's job"</td><td>Reads as either a joke or a threat</td></tr>
<tr><td>"Running my own startup"</td><td>Tells them you will leave; only say it if you genuinely want that filter applied</td></tr>
<tr><td>"I don't know / I haven't thought about it"</td><td>Reads as passive</td></tr>
<tr><td>An over-precise plan ("senior in 2, lead in 4")</td><td>Sounds rehearsed and inflexible</td></tr>
<tr><td>Anything unrelated to engineering</td><td>Suggests this role is a placeholder</td></tr>
</table>
<p><strong>Two things that strengthen it:</strong></p>
<ul>
<li><strong>Tie it to the company.</strong> One sentence connecting your direction to something specific about their product, scale or technology shows you did the research and are not reading a generic answer.</li>
<li><strong>Ask it back.</strong> "What does growth look like here for someone in this role — what have people who joined at this level been doing two years later?" It turns the question into a conversation and gives you genuinely useful information.</li>
</ul>
<p><strong>Being uncertain is fine and honest</strong> — "I'm not sure yet whether I want the management track" is a much better answer than a confident plan you do not believe. What is not fine is having no direction at all.</p>`
}
]);
