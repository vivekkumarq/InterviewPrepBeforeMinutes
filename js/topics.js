/* Topic registry — groups shown as dropdowns in the sidebar. */
window.GROUPS = [
  {
    id: "java", name: "Java Core", icon: "☕",
    topics: [
      { id: "java-basics", parts: 6,       name: "Java Fundamentals",  icon: "☕", blurb: "Language basics, memory model of objects, strings, exceptions — the questions every Java round opens with." },
      { id: "java-oop", parts: 6,          name: "OOP & Design",       icon: "🧩", blurb: "Encapsulation, inheritance, polymorphism, abstraction, SOLID and the classic trick questions around them." },
      { id: "java-collections", parts: 6,  name: "Collections Framework", icon: "📦", blurb: "List, Set, Map, internal working of HashMap, ConcurrentHashMap, comparators and complexity." },
      { id: "java-concurrency", parts: 7,  name: "Multithreading & Concurrency", icon: "🧵", blurb: "Threads, executors, locks, volatile, CompletableFuture, deadlocks and the Java Memory Model." },
      { id: "java-8", parts: 7,            name: "Java 8+ & Streams",  icon: "🌊", blurb: "Lambdas, functional interfaces, Streams, Optional, and what landed in Java 9–21." },
      { id: "java-versions", parts: 4,     name: "Java Versions & Features", icon: "🏷️", blurb: "What each release actually added — Java 8, 11, 17, 21 and 25 — records, sealed classes, text blocks, var, virtual threads, and what an upgrade from 8 really breaks." },
      { id: "jvm", parts: 8,               name: "JVM & Garbage Collection", icon: "⚙️", blurb: "Class loading, runtime memory areas, GC algorithms, tuning flags and OutOfMemoryError debugging." }
    ]
  },
  {
    id: "spring", name: "Spring Ecosystem", icon: "🍃",
    topics: [
      { id: "spring-core", parts: 6,   name: "Spring Framework",   icon: "🍃", blurb: "IoC container, dependency injection, bean scopes, lifecycle, AOP and proxies." },
      { id: "spring-boot", parts: 7,   name: "Spring Boot",        icon: "🚀", blurb: "Auto-configuration, starters, profiles, actuator, configuration properties and exception handling." },
      { id: "spring-security", parts: 7, name: "Spring Security & Auth", icon: "🔐", blurb: "Filter chain, authentication vs authorization, JWT, OAuth2, Keycloak, CORS and CSRF." },
      { id: "jpa-hibernate", parts: 7, name: "JPA & Hibernate",    icon: "🗄️", blurb: "Entity lifecycle, fetch strategies, N+1, caching, locking and transaction propagation." }
    ]
  },
  {
    id: "api", name: "APIs & Messaging", icon: "🔌",
    topics: [
      { id: "rest-api", parts: 6, name: "REST API Design", icon: "🔌", blurb: "HTTP verbs, status codes, idempotency, versioning, pagination, HATEOAS and OpenAPI." },
      { id: "graphql", parts: 7,  name: "GraphQL",         icon: "◈",  blurb: "Schema, queries, mutations, resolvers, N+1 with DataLoader and GraphQL-vs-REST trade-offs." },
      { id: "kafka", parts: 7,    name: "Apache Kafka",    icon: "📨", blurb: "Topics, partitions, consumer groups, offsets, delivery semantics, ISR and exactly-once." }
    ]
  },
  {
    id: "arch", name: "Architecture & Design", icon: "🏛️",
    topics: [
      { id: "microservices", parts: 8,   name: "Microservices",       icon: "🧱", blurb: "Decomposition, service discovery, resilience, saga, outbox, idempotency and observability." },
      { id: "system-design", parts: 9,   name: "System Design (HLD)", icon: "🏛️", blurb: "Scaling, caching, load balancing, CAP, sharding, rate limiting and end-to-end design walkthroughs." },
      { id: "design-patterns", parts: 7, name: "Design Patterns & LLD", icon: "📐", blurb: "Creational, structural and behavioural patterns with the Java code interviewers expect on the board." }
    ]
  },
  {
    id: "data", name: "Databases", icon: "🗃️",
    topics: [
      { id: "sql", parts: 7,        name: "SQL & Query Tuning", icon: "🗃️", blurb: "Joins, aggregates, window functions, indexes, execution plans and the classic query puzzles." },
      { id: "postgresql", parts: 7, name: "PostgreSQL",         icon: "🐘", blurb: "MVCC, isolation levels, index types, VACUUM, partitioning, JSONB and locking." }
    ]
  },
  {
    id: "devops", name: "DevOps & Cloud", icon: "🐳",
    topics: [
      { id: "docker", parts: 6,     name: "Docker",         icon: "🐳", blurb: "Images vs containers, layers, multi-stage builds, networking, volumes and Compose." },
      { id: "kubernetes", parts: 7, name: "Kubernetes",     icon: "☸️", blurb: "Pods, deployments, services, ingress, config, probes, HPA and rollout strategies." },
      { id: "cicd", parts: 6,       name: "CI/CD & Git",    icon: "🔁", blurb: "Pipelines, GitLab CI, Jenkins, GitHub Actions, branching strategies and deployment patterns." }
    ]
  },
  {
    id: "quality", name: "Testing & Quality", icon: "🧪",
    topics: [
      { id: "testing", parts: 6, name: "JUnit 5, Mockito & Testing", icon: "🧪", blurb: "Unit vs integration tests, mocking, Testcontainers, coverage and testing Spring slices." }
    ]
  },
  {
    id: "frontend", name: "Frontend", icon: "🎨",
    topics: [
      { id: "angular", parts: 7,    name: "Angular",    icon: "🅰️", blurb: "Components, DI, RxJS, change detection, signals, routing, forms and performance." },
      { id: "react", parts: 7,      name: "React",      icon: "⚛️", blurb: "JSX, hooks, reconciliation, state management, memoisation and common pitfalls." },
      { id: "typescript", parts: 7, name: "TypeScript & JS", icon: "🟦", blurb: "Types, generics, closures, event loop, promises, this binding, and the JS trivia that still gets asked." }
    ]
  },
  {
    id: "coding", name: "Coding & Algorithms", icon: "💻",
    topics: [
      { id: "coding-basics", parts: 3,      name: "Coding Round Basics",   icon: "✍️", blurb: "The warm-up problems every service-company round opens with — reverse, palindrome, prime, Fibonacci, duplicates, patterns — solved without shortcuts." },
      { id: "coding-arrays", parts: 3,      name: "Arrays & Strings",      icon: "🔢", blurb: "Two pointers, sliding window, prefix sums, Kadane, Dutch national flag and the array problems asked most often." },
      { id: "coding-linked-list", parts: 3, name: "Linked Lists",          icon: "⛓️", blurb: "Reversal, cycle detection, merge, middle node, LRU cache — the pointer manipulation interviewers love." },
      { id: "coding-stack-queue", parts: 3, name: "Stacks & Queues",       icon: "🥞", blurb: "Balanced brackets, min stack, next greater element, monotonic stacks, sliding-window maximum and expression evaluation." },
      { id: "coding-trees", parts: 4,       name: "Trees & BST",           icon: "🌳", blurb: "Traversals, height and diameter, lowest common ancestor, BST validation, serialisation and level-order patterns." },
      { id: "coding-graphs", parts: 4,      name: "Graphs & Grids",        icon: "🕸️", blurb: "BFS, DFS, topological sort, union-find, shortest paths, islands and the grid problems built on them." },
      { id: "coding-dp", parts: 4,          name: "Dynamic Programming",   icon: "🧮", blurb: "Knapsack, LIS, LCS, edit distance, coin change, stocks and matrix DP — with the state and recurrence spelled out." },
      { id: "coding-greedy", parts: 3,      name: "Greedy, Intervals & Heaps", icon: "🎯", blurb: "Activity selection, meeting rooms, merge intervals, job scheduling, top-K and when greedy is provably correct." },
      { id: "algorithms", parts: 4,         name: "Must-Know Algorithms",  icon: "🧭", blurb: "Sorting, binary search variants, Dijkstra, Kruskal, KMP, Floyd cycle, quickselect, bit tricks and their complexities." }
    ]
  },
  {
    id: "cs", name: "CS Fundamentals", icon: "🧠",
    topics: [
      { id: "dsa", parts: 7, name: "DSA & Problem Solving", icon: "🧠", blurb: "Complexity, arrays, strings, hashing, trees, graphs, DP patterns and the most-asked coding problems." },
      { id: "hr", parts: 6,  name: "HR & Behavioural",      icon: "💬", blurb: "Tell me about yourself, STAR stories, salary talk and the closing questions you should ask back." }
    ]
  }
];

/* topic id -> topic meta, flattened */
window.TOPIC_MAP = {};
window.GROUPS.forEach(g => g.topics.forEach(t => { t.group = g.name; t.groupId = g.id; window.TOPIC_MAP[t.id] = t; }));

/* Data files call this when they load. */
window.TOPIC_DATA = {};
/* Cheatsheets live in their own bundles (js/data/cheatsheets-*.js) and are
   fetched only when a cheatsheet route is opened. */
window.SHEETS = {};
window.registerSheet = function (id, sections) {
  window.SHEETS[id] = sections;
};

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

/* A topic's "Start here" primer: how it works, a diagram and a worked
   example, shown above the question list. Any part file may register it. */
window.PRIMERS = {};
window.registerPrimer = function (id, html) {
  window.PRIMERS[id] = html;
};

/* Cheatsheet bundles -> the topics each one registers. */
window.SHEET_BUNDLES = [
  { file: "cheatsheets-java.js",
    topics: ["java-basics","java-oop","java-collections","java-concurrency","java-8","java-versions","jvm"] },
  { file: "cheatsheets-spring.js",
    topics: ["spring-core","spring-boot","spring-security","jpa-hibernate"] },
  { file: "cheatsheets-platform.js",
    topics: ["rest-api","graphql","kafka","microservices","system-design","design-patterns"] },
  { file: "cheatsheets-data-devops.js",
    topics: ["sql","postgresql","docker","kubernetes","cicd","testing"] },
  { file: "cheatsheets-frontend-coding.js",
    topics: ["angular","react","typescript","dsa","hr"] },
  { file: "cheatsheets-coding.js",
    topics: ["coding-basics","coding-arrays","coding-linked-list","coding-stack-queue",
             "coding-trees","coding-graphs","coding-dp","coding-greedy","algorithms"] }
];
