appendTopic("hr", [
{
  q: "Tell me about a project you are most proud of",
  level: "beginner", hot: true, tags: ["behavioural", "experience", "classic"],
  companies: ["Amazon", "TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Optum", "SAP"],
  a: `<p><strong>What is really being assessed:</strong> can you explain technical work clearly, did you actually own it, and do you understand <em>why</em> it mattered rather than just what you built?</p>
<table>
<tr><th>Part</th><th>Roughly how long</th><th>Content</th></tr>
<tr><td><strong>Context</strong></td><td>20 seconds</td><td>What the system was and what problem existed. No jargon yet.</td></tr>
<tr><td><strong>Your role</strong></td><td>15 seconds</td><td>"I" not "we" — be specific about what was yours</td></tr>
<tr><td><strong>The interesting decision</strong></td><td>60 seconds</td><td>The trade-off you weighed. <em>This is the part they care about.</em></td></tr>
<tr><td><strong>Outcome</strong></td><td>20 seconds</td><td>What changed, with a number if you have a real one</td></tr>
<tr><td><strong>What you would do differently</strong></td><td>20 seconds</td><td>Shows reflection — and invites a good follow-up</td></tr>
</table>
<blockquote><p>"We had an order service where the checkout endpoint had crept up to about three seconds at peak, and support was getting complaints about the page timing out.</p>
<p>I owned the investigation. The first thing I did was add timing around each stage rather than guess — and it turned out most of the time was not in the payment call, which everyone assumed, but in loading order history. It was a classic N+1: one query for the orders, then one per order for its items.</p>
<p>I had three options. A fetch join in one query, which is fastest but breaks pagination in Hibernate. Eager fetching, which would have fixed this endpoint and slowed down five others. Or batch fetching, which issues one query per batch of fifty. I went with batch fetching set globally, because it fixed the whole application rather than one endpoint, and it composes with pagination. Then I added a fetch join specifically on this endpoint since it was the hot path.</p>
<p>Checkout came down to about 400 milliseconds, and I added an integration test that fails if that endpoint issues more than two queries — so it cannot regress silently.</p>
<p>What I would do differently: I would have added the query-count assertion first. It would have caught the problem when it was introduced, months before a customer noticed."</p></blockquote>
<table>
<tr><th>Do</th><th>Avoid</th></tr>
<tr><td>Pick something you can defend in depth</td><td>The most impressive project you barely touched</td></tr>
<tr><td>Name the alternatives you rejected and why</td><td>Presenting the outcome as if there was only one path</td></tr>
<tr><td>Use "I" for your work, "we" for the team's</td><td>"We" throughout — it hides your contribution</td></tr>
<tr><td>Use real numbers you can source</td><td>Invented metrics — one follow-up question exposes them</td></tr>
<tr><td>Explain <em>why</em> it mattered to users or the business</td><td>A tour of the tech stack with no problem attached</td></tr>
<tr><td>Keep it to two or three minutes</td><td>A ten-minute monologue with no pause for questions</td></tr>
</table>
<p><strong>Prepare for the drill-down,</strong> because the story is only the opening. Expect: "why not the other option?", "how did you know that was the bottleneck?", "what broke afterwards?", "how would this behave at ten times the load?" If you cannot answer those, choose a different project — the follow-ups are where the interview actually happens.</p>
<p><strong>If your projects feel small:</strong> that is fine. A well-explained bug fix where you found the root cause, weighed two fixes and added a regression test beats a vaguely described microservices migration. Depth of understanding scores; scale does not.</p>`
},
{
  q: "What questions should you ask the interviewer at the end?",
  level: "beginner", hot: true, tags: ["closing", "behavioural", "evaluation"],
  companies: ["Amazon", "TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Optum", "Deloitte"],
  a: `<p><strong>"Do you have any questions for us?" is still part of the interview.</strong> Saying no reads as disinterest. It is also your only chance to find out whether you actually want the job — and after a few of these you learn that the answers vary far more than the job descriptions do.</p>
<table>
<tr><th>Ask</th><th>What the answer reveals</th></tr>
<tr><td>"What does a typical week look like for this role?"</td><td>Meeting load, how much time is actually spent coding</td></tr>
<tr><td>"How does work get from an idea to production?"</td><td>Process maturity, deployment frequency, autonomy</td></tr>
<tr><td>"What is the on-call rotation like, and how often does it fire?"</td><td>System stability, and whether the burden is shared</td></tr>
<tr><td>"How do you handle technical debt — is there time allocated?"</td><td>Whether quality is valued or only spoken about</td></tr>
<tr><td>"What is the test and code review culture?"</td><td>Engineering standards, in concrete terms</td></tr>
<tr><td>"What would success look like for me at three and six months?"</td><td>Whether expectations are clear — vagueness here is a warning</td></tr>
<tr><td>"What is the biggest challenge the team is facing right now?"</td><td>Honest problems; also what you would be walking into</td></tr>
<tr><td>"Why is this role open?"</td><td>Growth, or backfilling churn. Ask it — politely, but ask.</td></tr>
<tr><td>"What have people who joined at this level been doing two years later?"</td><td>Real progression, not the promotion policy</td></tr>
<tr><td>"What is one thing you would change about working here?"</td><td>Candour. A confident interviewer answers this well.</td></tr>
</table>
<p><strong>Tailor them to who is in the room:</strong></p>
<table>
<tr><th>Interviewer</th><th>Best question</th></tr>
<tr><td>Future teammate</td><td>"What surprised you about this team after you joined?"</td></tr>
<tr><td>Hiring manager</td><td>"How do you measure whether this team is doing well?"</td></tr>
<tr><td>Skip-level / director</td><td>"Where do you see this product in a year, and how does this team fit?"</td></tr>
<tr><td>HR / recruiter</td><td>Process, timeline, next steps, team structure</td></tr>
</table>
<table>
<tr><th>Do not ask</th><th>Why</th></tr>
<tr><td>Anything answered on the careers page</td><td>Signals you did not prepare</td></tr>
<tr><td>Salary, in a first technical round</td><td>Save it for the recruiter conversation</td></tr>
<tr><td>"How much leave do I get?" early on</td><td>Fine once there is an offer; premature before</td></tr>
<tr><td>"Did I pass?"</td><td>Puts the interviewer in an awkward position</td></tr>
<tr><td>Nothing at all</td><td>The most common mistake, and the most avoidable</td></tr>
</table>
<p><strong>Two things worth doing at the very end:</strong> ask about the process and timeline so you are not guessing for a week, and — if a specific answer genuinely appealed to you — say so. "The way you described handling the migration is the kind of work I want to be doing" is a natural, honest close that interviewers remember.</p>
<p><strong>And a reframe worth holding onto:</strong> this is a two-way evaluation. You will spend more waking hours with this team than with most people you know. Asking real questions is not a performance — it is how you avoid accepting a role that looked good on paper.</p>`
}
]);
