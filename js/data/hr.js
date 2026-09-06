registerTopic("hr", [
{
  q: "Tell me about yourself",
  level: "beginner", hot: true, tags: ["opening"],
  a: `<p>This is not a biography — it is a 60–90 second pitch that frames everything after it. Use <strong>Present → Past → Future</strong>:</p>
<ol>
<li><strong>Present (20s)</strong> — your current role, the scale you work at, and what you own.</li>
<li><strong>Past (30s)</strong> — two or three highlights that build toward <em>this</em> job. Not a chronological list.</li>
<li><strong>Future (20s)</strong> — why this role, at this company, now.</li>
</ol>
<blockquote><p><em>"I'm a software engineer with four years of backend experience, currently at Netcracker, where I build microservices in Java and Spring Boot for enterprise telecom platforms — the services I work on are used by carriers like Etisalat.</em></p>
<p><em>Most of my work is GraphQL and REST API development, event-driven communication with Kafka, and deploying on Kubernetes through CI/CD pipelines. Two things outside my day job matter to me: I contribute to open source — I've had two pull requests merged into OpenAPI Generator, which has around 27,000 stars — and I build and ship full products end to end, like an online examination platform for JEE with Spring Boot and Angular that's live and being used.</em></p>
<p><em>I'm looking for a role where I can go deeper on distributed systems and own more of the architecture, which is why this position caught my attention."</em></p></blockquote>
<p><strong>What makes this work:</strong> it is specific (named technologies, named scale), it demonstrates rather than claims ("two merged PRs" beats "I'm passionate about open source"), and it ends by handing the interviewer an obvious next question. Rehearse it aloud until it sounds natural, not memorised.</p>`
},
{
  q: "What is the STAR method and how do you use it?",
  level: "beginner", hot: true, tags: ["framework"],
  a: `<p>Every behavioural question ("tell me about a time when…") should be answered with <strong>STAR</strong>:</p>
<ul>
<li><strong>Situation (15%)</strong> — brief context. What was the project, what was at stake?</li>
<li><strong>Task (15%)</strong> — <em>your</em> specific responsibility. Not the team's.</li>
<li><strong>Action (55%)</strong> — what <strong>you</strong> did, step by step, including the decisions you made and why. This is the bulk of the answer.</li>
<li><strong>Result (15%)</strong> — the outcome, quantified where possible, plus what you learned.</li>
</ul>
<blockquote><p><strong>Example — "Tell me about a difficult production issue."</strong></p>
<p><em>Situation: We had intermittent failures in a customer-facing API during peak hours. It wasn't reproducible in lower environments.</em></p>
<p><em>Task: I picked it up because the affected module was one I owned.</em></p>
<p><em>Action: I started from the metrics rather than the code — latency spikes correlated with garbage collection pauses, not with request volume. I took thread dumps and a heap dump during an incident window and found a cache that had no eviction policy, growing until full GCs dominated. I added a bounded cache with a TTL, added a metric for cache size, and set an alert so it would surface early next time rather than as an outage.</em></p>
<p><em>Result: The spikes stopped and p99 latency dropped noticeably. The wider lesson was that we had no visibility into cache growth anywhere, so I raised it and we added the same metric across services.</em></p></blockquote>
<p><strong>Prepare 6–8 stories</strong> covering: a technical challenge, a conflict, a failure, leadership, tight deadline, learning something new, and a time you improved something nobody asked you to. Most behavioural questions map onto one of them.</p>`
},
{
  q: "What are your strengths and weaknesses?",
  level: "beginner", hot: true, tags: ["classic"],
  a: `<p><strong>Strengths</strong> — pick two that are relevant to the role, and <em>prove</em> each with a specific example rather than an adjective.</p>
<blockquote><p><em>"Two things. First, I'm systematic about debugging — I go to metrics, logs and thread dumps before I go to the code, which has saved a lot of guesswork on production issues. Second, I finish things end to end. I built and deployed an examination platform on my own — backend, frontend, auth, deployment and tests — so I'm comfortable owning something all the way to production rather than handing it off at the API boundary."</em></p></blockquote>
<p><strong>Weakness</strong> — the answer must be a <em>real</em> weakness, with what you are actively doing about it. Interviewers are testing self-awareness, and everyone can see through "I work too hard" or "I'm a perfectionist."</p>
<blockquote><p><em>"I used to spend too long trying to solve things alone before asking — I'd treat asking as a failure. On one task I lost most of a day to a configuration issue someone next to me had already solved. I now give myself a fixed timebox, usually about 45 minutes, and if I haven't made progress I ask with what I've already tried. It's made me faster and, honestly, the conversations often surface better approaches than the one I was heading for."</em></p></blockquote>
<p><strong>Rules:</strong> never name a weakness that is core to the job ("I'm not good at writing tests" in an engineering interview); never give a fake weakness; and always end on the correction, not the flaw.</p>`
},
{
  q: "Why do you want to leave your current company?",
  level: "beginner", hot: true, tags: ["classic", "sensitive"],
  a: `<p><strong>The one absolute rule: never criticise your current employer, manager or colleagues.</strong> Whatever the truth, negativity here reads as a risk — the interviewer assumes you will speak about them the same way next year.</p>
<p>Frame it as <strong>moving toward something</strong>, not running from something:</p>
<blockquote><p><em>"I've had a good four years at Netcracker — I've grown a lot, worked on services used by major carriers, and been recognised for it. What I'm looking for now is more depth in distributed systems and more ownership of architectural decisions rather than implementing within an existing design. From what I've read about this role and your platform, that's exactly the kind of problem space you're working in."</em></p></blockquote>
<p><strong>Legitimate framings:</strong> growth into a new area, greater ownership or scope, a domain or product you find genuinely interesting, technical challenges at a different scale, and a role that better matches where you want to be in three years.</p>
<p><strong>If the real reason is compensation</strong>, you can say it honestly but pair it with a substantive reason — never make it the only one. If the real reason is a bad manager or team, translate it into what you are seeking: "I'm looking for a team with strong code review and mentoring culture."</p>`
},
{
  q: "Where do you see yourself in five years?",
  level: "beginner", tags: ["classic"],
  a: `<p>They are checking three things: do you have direction, is that direction compatible with this role, and are you likely to stay long enough to be worth hiring.</p>
<blockquote><p><em>"In five years I want to be the person a team relies on for hard backend and distributed systems problems — someone who owns the design of a significant part of the platform, not just the implementation. I'd like to be mentoring engineers and being involved in architectural decisions rather than only executing them.</em></p>
<p><em>I'm deliberately choosing the technical track rather than management. What I'd want from the next few years is depth — scale, reliability, and the kind of problems where the answer isn't obvious."</em></p></blockquote>
<p><strong>Do:</strong> show ambition in a direction the role actually leads. Mention skills, scope and impact rather than job titles.</p>
<p><strong>Avoid:</strong> "in your job" (adversarial), "running my own startup" (says you are leaving), "I don't know" (says you drift), and naming a title with a timeline you cannot control ("Senior Architect in three years").</p>
<p>If you genuinely do not know, say so honestly but with a direction: <em>"I'm not fixed on a title — what I'm sure about is that I want to be deeper technically and trusted with bigger design decisions."</em></p>`
},
{
  q: "Tell me about a time you failed or made a mistake",
  level: "advanced", hot: true, tags: ["behavioural"],
  a: `<p>This is one of the highest-signal questions asked. They want to know whether you take ownership, whether you learn, and whether you are honest. A candidate who claims never to have failed is either inexperienced or not being straight.</p>
<p><strong>Pick a real mistake with real consequences — but one you fixed and learned from.</strong> Not something catastrophic and unrecoverable, and not something trivially small.</p>
<blockquote><p><em>Situation: I pushed a change that added a database index on a large table during a normal working-hours deployment.</em></p>
<p><em>Task: It was my change and my deployment.</em></p>
<p><em>Action: The migration took an exclusive lock and blocked writes on that table for several minutes, which caused API timeouts. I noticed the errors in monitoring, checked the running queries, and understood what was happening. I didn't try to hide it — I flagged it in the channel immediately so people weren't debugging blind, and once it completed I confirmed the service recovered.</em></p>
<p><em>Result: The impact was a few minutes of degraded writes, no data loss. Afterwards I wrote up what happened, and we changed two things: index creation now uses CONCURRENTLY, and migrations that touch large tables run outside peak hours with a lock timeout set. I also added it to our migration checklist so nobody repeats it.</em></p></blockquote>
<p><strong>What makes this a strong answer:</strong> clear ownership ("it was my change"), no blaming, immediate honest communication, a real fix, and a <em>systemic</em> improvement so it cannot happen again. That last part is what separates a senior answer from a junior one.</p>`
},
{
  q: "Tell me about a conflict with a colleague",
  level: "advanced", hot: true, tags: ["behavioural"],
  a: `<p>They are assessing whether you can disagree professionally and whether you make conflicts about ideas rather than people. Never describe a colleague as difficult, unreasonable or incompetent.</p>
<blockquote><p><em>Situation: A colleague and I disagreed on how to handle a cross-service data consistency problem. They wanted a synchronous call so the data was always consistent; I wanted an event-driven approach with eventual consistency.</em></p>
<p><em>Task: We were blocking each other and the sprint was moving.</em></p>
<p><em>Action: Rather than keep arguing in review comments, I asked for 30 minutes with a whiteboard. I made sure I could state their position back to them accurately first — their concern was that stale data would confuse users, which was legitimate. I laid out my concern: a synchronous chain meant our service would go down whenever theirs did. We agreed the actual question wasn't technical preference, it was how stale the data could acceptably be. We took that to the product owner, who said a few seconds was fine. That settled it — we went with events, and I added a PENDING state in the UI so the delay was visible rather than confusing.</em></p>
<p><em>Result: We shipped it, and the decoupling paid off within a month when their service had an outage and ours kept serving. More importantly, we've used the same approach since — pull the disagreement up to the requirement rather than debating implementations.</em></p></blockquote>
<p><strong>The pattern that works:</strong> understand their position genuinely, find the underlying question, use data or a decision-maker to resolve it, commit fully to the outcome even if it is not yours, and preserve the relationship. "Disagree and commit" is a phrase worth using.</p>`
},
{
  q: "What is your greatest achievement?",
  level: "beginner", tags: ["behavioural"],
  a: `<p>Choose something with <strong>measurable impact</strong> and a clear description of <em>your</em> contribution. Technical achievements work best in an engineering interview, but the impact should be expressed in terms someone non-technical would care about.</p>
<blockquote><p><em>"Two I'd pick, for different reasons.</em></p>
<p><em>Professionally — I got two pull requests merged into OpenAPI Generator, which is used by a huge number of teams and has around 27,000 stars. One fixed a startup crash affecting every client generated by the Rust server generator; the other brought the Kotlin JAX-RS generator to documentation parity with the Java one. What made it satisfying wasn't the code — it was working inside an unfamiliar 500,000-line codebase, matching their conventions, regenerating all the samples, and getting it through review from maintainers who had never met me.</em></p>
<p><em>The one I'm personally proudest of is MathStrokes, an online examination platform for JEE that I built and shipped end to end — teachers author LaTeX questions, students take timed papers with a server-authoritative clock and resumable attempts. It's live and being used. I wrote 63 unit tests and over 100 end-to-end assertions because a wrong mark on a student's exam is not a bug you can shrug at."</em></p></blockquote>
<p><strong>Why this structure works:</strong> the first shows you can operate in someone else's codebase to a high standard; the second shows ownership and care about correctness. Both are verifiable, which makes them believable.</p>`
},
{
  q: "How do you handle pressure and tight deadlines?",
  level: "beginner", tags: ["behavioural"],
  a: `<p>Answer with a <em>method</em>, then an example. "I work well under pressure" alone tells them nothing.</p>
<blockquote><p><em>"Three things, in order.</em></p>
<p><em>First, I get clarity on what actually has to ship. Usually a 'must-have everything' list has three genuine must-haves and several nice-to-haves, and nobody has said so out loud. I make that explicit early with the product owner.</em></p>
<p><em>Second, I raise risk early rather than late. If I can see on day two that the timeline won't hold, saying so on day two gives people options; saying so on the deadline gives them none. That conversation is uncomfortable but it's the job.</em></p>
<p><em>Third, I'm deliberate about what I compromise. Under pressure I'll cut scope, but I won't cut tests on the critical path or skip code review, because that trades a small delay now for a much bigger one later — and in production support work I've seen exactly that happen.</em></p>
<p><em>We had a release where an integration we depended on changed its contract a week before go-live. I flagged it the day I found it, we agreed to ship the two core flows and defer the third, and it went out on time without an incident."</em></p></blockquote>
<p><strong>What this demonstrates:</strong> prioritisation, proactive communication, and judgement about which corners are safe to cut. Those are the three things "handles pressure" actually means to a hiring manager.</p>`
},
{
  q: "How do you keep your skills up to date?",
  level: "beginner", tags: ["motivation"],
  a: `<p>Be <strong>specific and verifiable</strong>. "I read blogs and watch tutorials" is what everyone says and signals nothing.</p>
<blockquote><p><em>"Mostly by building things, because reading alone doesn't stick for me.</em></p>
<p><em>I've built several projects specifically to learn patterns I hadn't used in production — an event-driven order platform where I implemented the transactional outbox, idempotent consumers and a choreographed saga properly, and a multi-tenant billing service to understand Keycloak-based tenant isolation and proration. Those taught me far more than reading about sagas would have.</em></p>
<p><em>I also contribute to open source. Getting two PRs merged into OpenAPI Generator meant reading a large unfamiliar codebase and working to someone else's standards, which is a different skill from writing your own code.</em></p>
<p><em>Day to day I follow the Spring and Java release notes properly rather than by osmosis — virtual threads in 21 and the Spring Boot 3 changes both affected decisions I was making at work. And I write things up; explaining something is where I find out whether I actually understood it."</em></p></blockquote>
<p><strong>The point:</strong> every claim here has evidence behind it — repositories, merged PRs, specific features. Name what you have actually done, and be ready for follow-up questions on any of it.</p>`
},
{
  q: "How should you handle salary expectations?",
  level: "advanced", hot: true, tags: ["negotiation", "sensitive"],
  a: `<p><strong>Principle: whoever names a number first anchors the negotiation.</strong> Try to defer, but do not be evasive to the point of being awkward.</p>
<p><strong>If asked early — deflect once, politely:</strong></p>
<blockquote><p><em>"I'd rather understand the role and scope a bit more first. Could you share the range budgeted for this position? I'm confident we can align if the role is the right fit."</em></p></blockquote>
<p><strong>If pressed — give a researched range, not a point:</strong></p>
<blockquote><p><em>"Based on my four years of backend experience with Java, Spring Boot, microservices and Kafka, and what I'm seeing for similar roles in Bengaluru, I'm looking in the range of X to Y. That said, I care about the overall package and the work itself, so I'd want to look at the whole picture."</em></p></blockquote>
<p><strong>Preparation matters more than technique:</strong></p>
<ul>
<li>Research actual ranges for your level, stack and city — levels.fyi, AmbitionBox, Glassdoor, and people in your network. Data makes you calm.</li>
<li>Know your three numbers: your <em>walk-away</em> minimum, your realistic <em>target</em>, and an ambitious but defensible <em>ask</em>. Quote a range whose <em>bottom</em> you would genuinely accept — they will offer the bottom.</li>
<li>Consider the whole package: base, bonus, equity, notice period, remote flexibility, learning budget, on-call load.</li>
<li>Never inflate your current salary — background checks are routine and it ends offers.</li>
<li>When you receive an offer, it is entirely normal to say: <em>"Thank you — could I take a day to review it?"</em> Do not accept on the call.</li>
</ul>
<p><strong>Be gracious throughout.</strong> Negotiate on value delivered, never on personal need.</p>`
},
{
  q: "Why should we hire you? / Why this company?",
  level: "advanced", hot: true, tags: ["closing"],
  a: `<p>These are the same question from two directions: what is the <em>fit</em> between what they need and what you bring? A generic answer here is the most common way strong candidates lose offers.</p>
<p><strong>"Why this company" requires actual research.</strong> Read the job description carefully, look at their engineering blog, products, and recent news, and know what the team actually builds.</p>
<blockquote><p><em>"Three reasons. The role is squarely backend microservices at scale, which is what I've spent four years doing — Java, Spring Boot, Kafka, Kubernetes — so I'd be productive quickly rather than learning the stack. Second, from your engineering blog it looks like you're dealing with event-driven consistency problems at a scale I haven't worked at yet, and that's specifically where I want to go deeper. And third, [something concrete: the product, the open-source work they do, how their team is structured]."</em></p></blockquote>
<p><strong>"Why should we hire you"</strong> — map your evidence directly onto their requirements:</p>
<blockquote><p><em>"You need someone who can own backend services end to end, and that's what I do — I've built and shipped services used by major carriers, and I've also shipped a full product on my own, so I'm comfortable across the stack when needed. You mentioned event-driven architecture; I've implemented the outbox pattern, idempotent consumers and sagas in production and in my own projects, including the failure cases. And I don't need to be told to write tests or think about observability — that's already how I work."</em></p></blockquote>
<p><strong>Structure:</strong> match their top three requirements to three pieces of evidence. Confident and specific, never arrogant.</p>`
},
{
  q: "What questions should you ask the interviewer?",
  level: "advanced", hot: true, tags: ["closing"],
  a: `<p><strong>Never say "no, I'm good."</strong> It reads as disinterest and wastes your only chance to evaluate <em>them</em>. Prepare 5–6 and ask 2–3 relevant ones.</p>
<p><strong>About the work:</strong></p>
<ul>
<li>"What would I be working on in the first three months?"</li>
<li>"What's the biggest technical challenge the team is facing right now?"</li>
<li>"How much of the work is new development versus maintaining existing systems?"</li>
</ul>
<p><strong>About engineering practice</strong> — these tell you the most about daily life:</p>
<ul>
<li>"What does your deployment process look like — how often do you release, and who does it?"</li>
<li>"How do you handle code review and testing? What's expected before something merges?"</li>
<li>"How is on-call structured, and how often does the team get paged?"</li>
<li>"How do you decide what technical debt gets addressed?"</li>
</ul>
<p><strong>About the team and growth:</strong></p>
<ul>
<li>"How is the team structured, and who would I work with most closely?"</li>
<li>"What does growth look like here for someone on the technical track?"</li>
<li>"What's something you'd change about how the team works?" — an honest answer is very revealing.</li>
</ul>
<p><strong>Closing question, always worth asking:</strong></p>
<blockquote><p><em>"Is there anything about my background that gives you hesitation? I'd rather address it now than leave it unanswered."</em></p></blockquote>
<p>That question is uncomfortable and it works — it lets you correct a misunderstanding before a decision is made, and it signals confidence.</p>
<p><strong>Do not ask</strong> about salary, leave policy or working hours in a first technical round — save those for HR or the offer stage.</p>`
},
{
  q: "How do you explain a career gap or a short stint?",
  level: "advanced", tags: ["sensitive"],
  a: `<p><strong>Be brief, honest, unapologetic, and pivot forward.</strong> The worst approach is a long defensive explanation — it signals that you think it is a bigger problem than it is.</p>
<p><strong>For a gap:</strong></p>
<blockquote><p><em>"I took six months out for [family responsibility / health / relocation / focused upskilling]. During that time I [built X, completed Y, contributed to Z], so I stayed current. That's resolved now and I've been fully focused on getting back into a strong backend role since."</em></p></blockquote>
<p><strong>For a short stint:</strong></p>
<blockquote><p><em>"The role turned out to be quite different from what was described — it was mainly maintaining a legacy system rather than the greenfield backend work discussed in interviews. I gave it a fair run, raised it with my manager, and when it was clear it wasn't going to change, I decided it was better to move than to stay somewhere I couldn't do my best work. I've been much more careful since about asking specific questions on scope, which is partly why I'm asking you detailed questions today."</em></p></blockquote>
<p><strong>Rules:</strong></p>
<ul>
<li>Never lie or fudge dates — background checks find it, and dishonesty ends offers that a gap would not have.</li>
<li>Show what you did with the time; learning, contributing or building all count.</li>
<li>Do not badmouth the previous employer, even when justified.</li>
<li>Answer in 30 seconds and stop. Confidence in the delivery matters more than the content.</li>
</ul>`
},
{
  q: "How do you handle feedback and code review?",
  level: "beginner", tags: ["collaboration"],
  a: `<p>They are checking whether you are coachable and whether you make reviews productive rather than adversarial.</p>
<blockquote><p><em>"I treat review comments as being about the code, not about me — which sounds obvious but it took some deliberate effort early on. Practically, I do three things.</em></p>
<p><em>I make code easy to review: small pull requests, a description explaining the why not just the what, and self-review before I request one. A 900-line PR gets a rubber stamp; a 200-line one gets real scrutiny, which is the point.</em></p>
<p><em>When I get a comment I don't agree with, I ask rather than defend — usually the reviewer knows something about the system that I don't, and when they don't, the discussion still improves the code. If we still disagree after that, I'll raise it with a third person rather than let it stall.</em></p>
<p><em>When I review others' code I try to be specific and separate blocking issues from preferences. 'This will NPE if the list is empty' and 'I'd personally name this differently' are very different comments, and labelling which is which saves a lot of friction."</em></p></blockquote>
<p><strong>Have an example ready</strong> of feedback that genuinely changed how you work — that is the follow-up. Something like: a reviewer pointing out that you were catching and logging exceptions instead of letting them propagate, and how that changed your approach to error handling.</p>`
},
{
  q: "What are the red flags to avoid in any interview?",
  level: "beginner", hot: true, tags: ["checklist"],
  a: `<ul>
<li><strong>Criticising a previous employer, manager or colleague.</strong> The single most damaging thing you can do, regardless of how justified it is.</li>
<li><strong>Claiming credit for team work.</strong> Say "I" for what you did and "we" for what the team did — interviewers probe this and inconsistency is obvious.</li>
<li><strong>Exaggerating your skills.</strong> If your CV says Kafka, expect to explain consumer groups, offsets and delivery semantics. Being caught out on one item makes them doubt everything else.</li>
<li><strong>Saying "I don't know" and stopping.</strong> Say instead: "I haven't used that directly. My understanding is X — is that the right direction?" Reasoning aloud scores far better than silence.</li>
<li><strong>Not asking any questions.</strong> Reads as indifference.</li>
<li><strong>Vague answers with no numbers or specifics.</strong> "Improved performance" means nothing; "reduced p99 latency from 1.2s to 300ms by fixing an N+1 query" means everything.</li>
<li><strong>Not knowing anything about the company.</strong> Ten minutes of research is the minimum courtesy.</li>
<li><strong>Being defensive when challenged.</strong> Interviewers often push back deliberately to see whether you can update your view on evidence. Engaging with the challenge is the correct response.</li>
<li><strong>Rambling.</strong> Aim for 1–2 minutes per behavioural answer, then stop and let them ask a follow-up.</li>
<li><strong>Poor logistics</strong> — arriving late, bad audio, a distracting background, no working camera.</li>
</ul>
<blockquote><p><strong>The mindset that helps:</strong> an interview is two professionals working out whether there is a fit. You are evaluating them too. That framing removes most of the nervousness — and confident, curious candidates interview better than anxious ones.</p></blockquote>`
}
]);
