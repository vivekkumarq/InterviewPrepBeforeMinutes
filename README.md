# InterviewPrepBeforeMinutes

A last-minute interview preparation hub for backend and full-stack engineers — **478 questions across 27 tech stacks**, each with a real answer, code you can quote, and diagrams for the concepts that are easier to draw than to say.

**Live:** https://vivekkumarq.github.io/InterviewPrepBeforeMinutes

---

## What's inside

Every topic ships a **Beginner** and an **Advanced** track, so you can start from fundamentals or jump straight to the questions senior interviews actually open with.

| Group | Topics |
|---|---|
| **Java Core** | Java Fundamentals · OOP & Design · Collections · Multithreading & Concurrency · Java 8+ & Streams · JVM & Garbage Collection |
| **Spring Ecosystem** | Spring Framework · Spring Boot · Spring Security & Auth · JPA & Hibernate |
| **APIs & Messaging** | REST API Design · GraphQL · Apache Kafka |
| **Architecture & Design** | Microservices · System Design (HLD) · Design Patterns & LLD |
| **Databases** | SQL & Query Tuning · PostgreSQL |
| **DevOps & Cloud** | Docker · Kubernetes · CI/CD & Git |
| **Testing & Quality** | JUnit 5, Mockito & Testing |
| **Frontend** | Angular · React · TypeScript & JS |
| **CS Fundamentals** | DSA & Problem Solving · HR & Behavioural |

## Features

- **478 questions**, tagged **Most asked** where they come up in nearly every interview
- **Beginner / Advanced toggle** on every topic
- **Instant global search** across every question and answer (press <kbd>/</kbd>)
- **Inline SVG diagrams** — JVM memory layout, HashMap internals, Kafka partitions, the Spring Security filter chain, saga compensation, the event loop, and more
- **Runnable code examples** in Java, SQL, YAML, TypeScript and Bash
- **Progress tracking** — mark questions as revised; progress is saved in your browser
- **Dark and light mode** with smooth transitions
- **Fully responsive** and **100% client-side** — no build step, no backend, no dependencies

## Tech

Plain HTML, CSS and vanilla JavaScript. No framework, no bundler, no npm install. Topic content is lazy-loaded per topic, so the initial page load stays small, and the whole site is a set of static files served by GitHub Pages.

```
index.html          # app shell
css/styles.css      # theming, layout, animations
js/topics.js        # topic registry and groups
js/app.js           # router, search, progress, theme
js/data/*.js        # 27 content files, one per topic
```

## Running locally

No build required — open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Adding a question

Open the relevant file in `js/data/` and add an entry:

```js
{
  q: "Your question",
  level: "beginner",          // or "advanced"
  hot: true,                  // shows the "Most asked" badge
  tags: ["collections"],
  a: `<p>The answer as HTML — <code>code</code>, tables, lists and inline SVG all work.</p>`
}
```

---

Built by [Vivek Kumar](https://github.com/vivekkumarq) — Java · Spring Boot · Microservices
