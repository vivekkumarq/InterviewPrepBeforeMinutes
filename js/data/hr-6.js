appendTopic("hr", [
{
  q: "Tell me about a production incident you caused. What happened and what did you change?",
  level: "advanced", hot: true, tags: ["behavioural", "star", "ownership", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Uber", "Flipkart", "Goldman Sachs", "SAP", "Walmart"],
  a: `<p>This question is not about the incident. It is checking three things: do you <strong>own it without deflecting</strong>, did you <strong>diagnose rather than guess</strong>, and did you <strong>change the system</strong> so it cannot recur.</p>
<p>The trap is picking something so trivial it reads as evasion ("I once mistyped a config"). Pick something real. Interviewers have broken production too, and they trust the person who can say so plainly.</p>
<table>
<tr><th>Beat</th><th>What belongs here</th><th>Seconds</th></tr>
<tr><td><strong>Situation</strong></td><td>Enough context to make the stakes clear</td><td>~15</td></tr>
<tr><td><strong>Task</strong></td><td>What you specifically owned</td><td>~10</td></tr>
<tr><td><strong>Action</strong></td><td><strong>How you diagnosed it</strong>, in order, and what you ruled out</td><td>~60</td></tr>
<tr><td><strong>Result</strong></td><td>Recovery time, then the permanent fix</td><td>~25</td></tr>
</table>
<p><strong>Weight the Action beat.</strong> Most people spend the time describing the symptom; the signal is in <em>how you narrowed it down</em>. "I checked X first because it would have explained both symptoms; it did not, so I looked at Y" is the sentence that separates an engineer from someone who restarted things until it worked.</p>
<pre><code>A WORKED ANSWER — the shape, not a script to memorise

SITUATION  "We shipped a change to how orders were fetched. Within twenty
            minutes the checkout page p99 went from 300ms to nine seconds
            and the on-call alert fired."

TASK       "I'd written the change and I was on call, so it was mine."

ACTION     "First I confirmed it was us and not a dependency — our own
            database CPU was at 95% while every downstream service was
            healthy, so I stopped looking outward.

            I pulled the slow queries from pg_stat_statements sorted by
            TOTAL time, not mean. That mattered: the worst offender was a
            4ms query running eleven thousand times per request, not the
            slow report I'd have guessed at.

            That was the classic N+1 — I'd added a lazy association inside
            a loop. I confirmed it by turning on Hibernate's statistics and
            counting queries on one request.

            I rolled back first and diagnosed properly afterwards, rather
            than trying to fix forward under pressure."

RESULT     "Rolled back in about twelve minutes, so roughly thirty minutes
            of degradation. The permanent fix was a JOIN FETCH, but the
            change that mattered was a test that asserts the query COUNT
            for that endpoint. It would have failed in CI, and it has
            caught two more N+1s since."</code></pre>
<p><strong>The last sentence is the whole answer.</strong> Fixing the bug is expected. Adding the thing that makes the class of bug impossible to reship is what gets remembered — and "it has caught two more since" is evidence rather than a claim.</p>
<p><strong>Avoid:</strong> blaming a teammate or "the requirements changed"; claiming you found it instantly; and an incident with no permanent fix, which reads as "this will happen again".</p>`
},
{
  q: "Why are you leaving? And why this company?",
  level: "beginner", hot: true, tags: ["behavioural", "motivation", "must-know"],
  companies: ["Amazon", "Microsoft", "Infosys", "TCS", "Wipro", "Accenture", "Flipkart", "SAP"],
  a: `<p>Two questions that are really one: <em>are you running from something, or towards something?</em> The second reads far better, and it is usually also true if you frame it honestly.</p>
<table>
<tr><th>Instead of</th><th>Say</th></tr>
<tr><td>"My manager was difficult"</td><td>"I want to work somewhere decisions are made closer to the engineers"</td></tr>
<tr><td>"The work was boring"</td><td>"I've taken our service about as far as it goes at this scale and want a harder problem"</td></tr>
<tr><td>"The pay was low"</td><td>Fine to say, but not <em>first</em> — lead with the work, mention compensation as one factor among several</td></tr>
<tr><td>"There was no growth"</td><td>"I'm the most senior person on my stack, so I'm learning slower than I'd like — I want people to learn from"</td></tr>
</table>
<p><strong>Never criticise your current employer.</strong> Not because it is always unfair, but because the interviewer has no way to verify it and every way to imagine you saying the same about them in a year. Say the true thing in its forward-looking form.</p>
<pre><code>A WORKED ANSWER

"I've been at [company] three years and built the [X] service from nothing
 to handling [real number] a day. I'm proud of it, and I've learned the most
 I'm going to learn there — I'm now the person people ask, which is good for
 the team and slow for me.

 I'm looking for somewhere with harder distributed-systems problems and
 engineers ahead of me on that path. When I read your [specific thing —
 an engineering blog post, the scale they operate at, a product decision],
 that's the work I want to be doing."</code></pre>
<p><strong>"Why this company" is where most candidates lose it.</strong> A generic answer — "you're a great company with great culture" — is worse than saying nothing, because it proves you did not look. One specific, verifiable detail beats three paragraphs of enthusiasm:</p>
<table>
<tr><th>Look for</th><th>Where</th></tr>
<tr><td>An engineering blog post about a real problem</td><td>Their tech blog</td></tr>
<tr><td>Scale or constraints they operate under</td><td>Conference talks, job description</td></tr>
<tr><td>The specific stack overlapping with yours</td><td>The posting itself</td></tr>
<tr><td>Something they open-sourced</td><td>Their GitHub</td></tr>
</table>
<p><strong>If you were laid off, say so plainly</strong> — "my team was cut in a reorg in March" — and move straight on to what you are looking for. It is common, it is not a mark against you, and hedging around it invites more questions than the plain fact does.</p>`
},
{
  q: "Do you have any questions for us?",
  level: "beginner", hot: true, tags: ["behavioural", "closing", "must-know"],
  companies: ["Amazon", "Microsoft", "Google", "Infosys", "TCS", "Flipkart", "Uber", "SAP"],
  a: `<p>Saying "no, I think you covered everything" reads as indifference. This is also the only part of the interview where <strong>you</strong> are gathering evidence about whether to accept — treat it as such.</p>
<p><strong>Ask the person in front of you.</strong> An engineer, a manager and a director can each answer different things well, and asking the wrong one wastes the slot.</p>
<table>
<tr><th>Ask an engineer</th><th>What it tells you</th></tr>
<tr><td>"What does the path from a merged PR to production look like?"</td><td>Deploy maturity. "Twice a year, with a change board" is a different job from "twenty times a day"</td></tr>
<tr><td>"What broke most recently, and what changed afterwards?"</td><td>Whether they run blameless postmortems or find someone to blame</td></tr>
<tr><td>"How much of your week is feature work versus support?"</td><td>The real ratio, which no job description states</td></tr>
<tr><td>"What's the oldest part of the codebase, and who understands it?"</td><td>Bus factor, and their honesty about debt</td></tr>
</table>
<table>
<tr><th>Ask a manager</th><th>What it tells you</th></tr>
<tr><td>"What would a strong first six months look like?"</td><td>Whether expectations are concrete or vague</td></tr>
<tr><td>"How do people on this team get promoted? Who was promoted last?"</td><td>Whether a path exists or is theoretical</td></tr>
<tr><td>"What's the hardest thing about this team right now?"</td><td>A manager who answers honestly is the strongest signal available</td></tr>
<tr><td>"Why is this role open?"</td><td>Growth, or someone left and nobody has asked why</td></tr>
</table>
<p><strong>Listen for hesitation more than content.</strong> "What broke recently and what changed?" answered with a pause and "nothing really breaks" means either they are not being straight or they are not looking. Both are worth knowing before you sign.</p>
<p><strong>Do not ask:</strong> anything answered on the careers page; salary in a first technical round; or "what does a typical day look like", which is filler and sounds like it.</p>
<p><strong>Close with intent.</strong> "This sounds like the kind of problem I want to work on — what are the next steps and what's your timeline?" It confirms you are interested, and it gets you a date rather than a wait.</p>`
}
]);
