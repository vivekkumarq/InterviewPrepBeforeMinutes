# InterviewPrepBeforeMinutes

A last-minute interview preparation hub for backend and full-stack engineers — every topic with a real answer, code you can quote, and diagrams for the concepts that are easier to draw than to say.

**Live:** https://vivekkumarq.github.io/InterviewPrepBeforeMinutes

---

## What's inside

Every topic ships a **Beginner** and an **Advanced** track, so you can start from fundamentals or jump straight to the questions senior interviews actually open with.

| Group | Topics |
|---|---|
| **Java Core** | Java Fundamentals · OOP & Design · Collections · Multithreading & Concurrency · Java 8+ & Streams · Java Versions & Features · JVM & Garbage Collection |
| **Spring Ecosystem** | Spring Framework · Spring Boot · Spring Security & Auth · JPA & Hibernate |
| **APIs & Messaging** | REST API Design · GraphQL · Apache Kafka |
| **Architecture & Design** | Microservices · System Design (HLD) · Design Patterns & LLD |
| **Databases** | SQL & Query Tuning · PostgreSQL |
| **DevOps & Cloud** | Docker · Kubernetes · CI/CD & Git |
| **Testing & Quality** | JUnit 5, Mockito & Testing |
| **Frontend** | Angular · React · TypeScript & JS |
| **Coding & Algorithms** | Coding Round Basics · Arrays & Strings · Linked Lists · Stacks & Queues · Trees & BST · Graphs & Grids · Dynamic Programming · Greedy, Intervals & Heaps · Must-Know Algorithms |
| **CS Fundamentals** | DSA & Problem Solving · HR & Behavioural |

## Features

- **Beginner / Advanced toggle** on every topic
- **Coding & Algorithms corner** — the problems that actually come up, from warm-up rounds to hard graph and DP questions, each with the pattern, the complexity and the edge cases named
- **Prepare by company** — pick the company you are interviewing at and get every question recorded as asked there, pulled together from all topics, grouped in reading order with a *most asked only* filter. Also reachable by typing a company name into search, or by clicking any **Asked at** chip on an answer.
- **Most asked** badges on the questions that come up in nearly every interview
- **Instant global search** across every question and answer (press <kbd>/</kbd>, arrow keys to move, Enter to open)
- **Typography switcher** — sans, serif, monospace, display and handwriting typefaces, plus four text sizes
- **Dark and light mode**, following your system preference by default
- **Inline SVG diagrams** — JVM memory layout, HashMap internals, Kafka partitions, the Spring Security filter chain, saga compensation, the event loop and more
- **Runnable code examples** in Java, SQL, YAML, TypeScript and Bash
- **Progress tracking** — mark questions as revised; progress is saved in your browser
- **Version-by-version Java coverage** — what Java 8, 11, 17, 21 and 25 each added, and what an upgrade from 8 actually breaks
- **Fully responsive** — a bottom-sheet type picker and horizontally scrollable diagrams on phones, a drawer sidebar on tablets, the full layout on desktop
- **100% client-side** — no build step, no backend, no dependencies

## Tech

Plain HTML, CSS and vanilla JavaScript. No framework, no bundler, no `npm install`. Content is lazy-loaded per topic so the initial page load stays small, and the whole site is a set of static files served by GitHub Pages.

```
index.html          # app shell
css/styles.css      # theming, layout, animations
js/topics.js        # topic registry, groups and part counts
js/app.js           # router, search, company index, typography, progress, theme
js/data/*.js        # content, split into parts per topic
```

Routes are hash-based: `#/` home, `#/topic/<id>`, `#/companies`, `#/company/<slug>`.
The company pages are derived at runtime from the `companies` array on each
question — there is no second copy of that data to keep in sync.

## Running locally

No build required — open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Adding questions

Content for each topic is split across **part files** (`kafka.js`, `kafka-2.js`, `kafka-3.js`, …) so new questions go into a **new file** rather than an edit to an existing one.

To extend an existing topic:

1. Create the next part, e.g. `js/data/kafka-4.js`:

```js
appendTopic("kafka", [
  {
    q: "Your question",
    level: "beginner",          // or "advanced"
    hot: true,                  // shows the "Most asked" badge
    tags: ["consumers"],        // drives the per-question icon
    companies: ["Amazon"],      // renders the "Asked at" chips and the company filter
    a: `<p>The answer as HTML — <code>code</code>, tables, lists and inline SVG all work.</p>`
  }
]);
```

2. Bump `parts` for that topic in `js/topics.js`:

```js
{ id: "kafka", parts: 4, name: "Apache Kafka", ... }
```

Parts load in order, so question numbering stays stable. To add a whole new topic, add an entry to a group in `js/topics.js` and create `js/data/<id>.js` calling `registerTopic(...)`.

---

Built by [Vivek Kumar](https://github.com/vivekkumarq) — Java · Spring Boot · Microservices
