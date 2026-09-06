/* Topic registry — groups shown as dropdowns in the sidebar. */
window.GROUPS = [
  {
    id: "java", name: "Java Core", icon: "☕",
    topics: [
      { id: "java-basics", parts: 2,       name: "Java Fundamentals",  icon: "☕", blurb: "Language basics, memory model of objects, strings, exceptions — the questions every Java round opens with." },
      { id: "java-oop", parts: 2,          name: "OOP & Design",       icon: "🧩", blurb: "Encapsulation, inheritance, polymorphism, abstraction, SOLID and the classic trick questions around them." },
      { id: "java-collections", parts: 2,  name: "Collections Framework", icon: "📦", blurb: "List, Set, Map, internal working of HashMap, ConcurrentHashMap, comparators and complexity." },
      { id: "java-concurrency", parts: 2,  name: "Multithreading & Concurrency", icon: "🧵", blurb: "Threads, executors, locks, volatile, CompletableFuture, deadlocks and the Java Memory Model." },
      { id: "java-8", parts: 3,            name: "Java 8+ & Streams",  icon: "🌊", blurb: "Lambdas, functional interfaces, Streams, Optional, and what landed in Java 9–21." },
      { id: "jvm", parts: 3,               name: "JVM & Garbage Collection", icon: "⚙️", blurb: "Class loading, runtime memory areas, GC algorithms, tuning flags and OutOfMemoryError debugging." }
    ]
  },
  {
    id: "spring", name: "Spring Ecosystem", icon: "🍃",
    topics: [
      { id: "spring-core", parts: 2,   name: "Spring Framework",   icon: "🍃", blurb: "IoC container, dependency injection, bean scopes, lifecycle, AOP and proxies." },
      { id: "spring-boot", parts: 2,   name: "Spring Boot",        icon: "🚀", blurb: "Auto-configuration, starters, profiles, actuator, configuration properties and exception handling." },
      { id: "spring-security", parts: 3, name: "Spring Security & Auth", icon: "🔐", blurb: "Filter chain, authentication vs authorization, JWT, OAuth2, Keycloak, CORS and CSRF." },
      { id: "jpa-hibernate", parts: 2, name: "JPA & Hibernate",    icon: "🗄️", blurb: "Entity lifecycle, fetch strategies, N+1, caching, locking and transaction propagation." }
    ]
  },
  {
    id: "api", name: "APIs & Messaging", icon: "🔌",
    topics: [
      { id: "rest-api", parts: 2, name: "REST API Design", icon: "🔌", blurb: "HTTP verbs, status codes, idempotency, versioning, pagination, HATEOAS and OpenAPI." },
      { id: "graphql", parts: 3,  name: "GraphQL",         icon: "◈",  blurb: "Schema, queries, mutations, resolvers, N+1 with DataLoader and GraphQL-vs-REST trade-offs." },
      { id: "kafka", parts: 3,    name: "Apache Kafka",    icon: "📨", blurb: "Topics, partitions, consumer groups, offsets, delivery semantics, ISR and exactly-once." }
    ]
  },
  {
    id: "arch", name: "Architecture & Design", icon: "🏛️",
    topics: [
      { id: "microservices", parts: 3,   name: "Microservices",       icon: "🧱", blurb: "Decomposition, service discovery, resilience, saga, outbox, idempotency and observability." },
      { id: "system-design", parts: 2,   name: "System Design (HLD)", icon: "🏛️", blurb: "Scaling, caching, load balancing, CAP, sharding, rate limiting and end-to-end design walkthroughs." },
      { id: "design-patterns", parts: 3, name: "Design Patterns & LLD", icon: "📐", blurb: "Creational, structural and behavioural patterns with the Java code interviewers expect on the board." }
    ]
  },
  {
    id: "data", name: "Databases", icon: "🗃️",
    topics: [
      { id: "sql", parts: 2,        name: "SQL & Query Tuning", icon: "🗃️", blurb: "Joins, aggregates, window functions, indexes, execution plans and the classic query puzzles." },
      { id: "postgresql", parts: 3, name: "PostgreSQL",         icon: "🐘", blurb: "MVCC, isolation levels, index types, VACUUM, partitioning, JSONB and locking." }
    ]
  },
  {
    id: "devops", name: "DevOps & Cloud", icon: "🐳",
    topics: [
      { id: "docker", parts: 3,     name: "Docker",         icon: "🐳", blurb: "Images vs containers, layers, multi-stage builds, networking, volumes and Compose." },
      { id: "kubernetes", parts: 3, name: "Kubernetes",     icon: "☸️", blurb: "Pods, deployments, services, ingress, config, probes, HPA and rollout strategies." },
      { id: "cicd", parts: 3,       name: "CI/CD & Git",    icon: "🔁", blurb: "Pipelines, GitLab CI, Jenkins, GitHub Actions, branching strategies and deployment patterns." }
    ]
  },
  {
    id: "quality", name: "Testing & Quality", icon: "🧪",
    topics: [
      { id: "testing", parts: 3, name: "JUnit 5, Mockito & Testing", icon: "🧪", blurb: "Unit vs integration tests, mocking, Testcontainers, coverage and testing Spring slices." }
    ]
  },
  {
    id: "frontend", name: "Frontend", icon: "🎨",
    topics: [
      { id: "angular", parts: 3,    name: "Angular",    icon: "🅰️", blurb: "Components, DI, RxJS, change detection, signals, routing, forms and performance." },
      { id: "react", parts: 3,      name: "React",      icon: "⚛️", blurb: "JSX, hooks, reconciliation, state management, memoisation and common pitfalls." },
      { id: "typescript", parts: 3, name: "TypeScript & JS", icon: "🟦", blurb: "Types, generics, closures, event loop, promises, `this`, and the JS trivia that still gets asked." }
    ]
  },
  {
    id: "cs", name: "CS Fundamentals", icon: "🧠",
    topics: [
      { id: "dsa", parts: 3, name: "DSA & Problem Solving", icon: "🧠", blurb: "Complexity, arrays, strings, hashing, trees, graphs, DP patterns and the most-asked coding problems." },
      { id: "hr", parts: 2,  name: "HR & Behavioural",      icon: "💬", blurb: "Tell me about yourself, STAR stories, salary talk and the closing questions you should ask back." }
    ]
  }
];

/* topic id -> topic meta, flattened */
window.TOPIC_MAP = {};
window.GROUPS.forEach(g => g.topics.forEach(t => { t.group = g.name; t.groupId = g.id; window.TOPIC_MAP[t.id] = t; }));

/* Data files call this when they load. */
window.TOPIC_DATA = {};
window.registerTopic = function (id, questions) {
  window.TOPIC_DATA[id] = questions;
  document.dispatchEvent(new CustomEvent("topic:loaded", { detail: { id } }));
};

/* Later part files append to a topic that is already registered. Keeping
   content split across parts means new questions are added in a new file
   rather than by editing an existing one. */
window.appendTopic = function (id, questions) {
  window.TOPIC_DATA[id] = (window.TOPIC_DATA[id] || []).concat(questions);
  document.dispatchEvent(new CustomEvent("topic:loaded", { detail: { id } }));
};
