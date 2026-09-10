registerSheet("sql", [
  { h: "Join types", t: "table", rows: [
    ["Join", "Returns"],
    ["INNER", "Rows matching in both"],
    ["LEFT", "All left rows; NULLs where no match"],
    ["RIGHT", "All right rows"],
    ["FULL OUTER", "Everything from both sides"],
    ["CROSS", "Cartesian product"],
    ["SELF", "A table joined to itself (manager/employee)"],
    ["LATERAL", "A subquery that can reference the row to its left"]
  ]},
  { h: "Execution order (not written order)", t: "list", items: [
    "FROM / JOIN → <b>WHERE</b> → GROUP BY → <b>HAVING</b> → SELECT → DISTINCT → ORDER BY → LIMIT",
    "So <code>WHERE</code> filters <b>rows</b> and <code>HAVING</code> filters <b>groups</b>.",
    "A SELECT alias is not visible in WHERE — it is computed later.",
    "Window functions run after HAVING but before ORDER BY."
  ]},
  { h: "Ranking functions", t: "code", lang: "sql", code:
"ROW_NUMBER() OVER (ORDER BY salary DESC)   -- 1,2,3,4  no ties\nRANK()       OVER (ORDER BY salary DESC)   -- 1,2,2,4  gaps\nDENSE_RANK() OVER (ORDER BY salary DESC)   -- 1,2,2,3  no gaps\n\n-- \"3rd highest salary\" almost always means DENSE_RANK = 3\n-- Top-N per group: PARTITION BY dept ORDER BY salary DESC" },
  { h: "The NOT IN trap", t: "code", lang: "sql", code:
"-- If ANY dept_id is NULL this returns ZERO ROWS:\nSELECT * FROM department WHERE id NOT IN (SELECT dept_id FROM employee);\n\n-- Use instead:\nWHERE NOT EXISTS (SELECT 1 FROM employee e WHERE e.dept_id = d.id)\n-- or a LEFT JOIN ... WHERE e.id IS NULL  (anti-join, usually fastest)" },
  { h: "Reading EXPLAIN ANALYZE", t: "table", rows: [
    ["Look at", "Tells you"],
    ["<b>estimated vs actual rows</b>", "A big gap means bad statistics → run <code>ANALYZE</code>"],
    ["Rows Removed by Filter", "Reading and discarding — a missing index"],
    ["Seq Scan on a big table", "Fine if returning most rows, bad for a selective filter"],
    ["<code>loops=N</code>", "Multiply per-loop cost by N — where time hides"],
    ["Buffers read vs hit", "<code>read</code> means disk"],
    ["Sort with external merge", "Spilled to disk — raise <code>work_mem</code> or index the order"]
  ]},
  { h: "Sargable predicates", t: "code", lang: "sql", code:
"WHERE YEAR(created_at) = 2026        -- ✗ function on the column, no index\nWHERE created_at >= '2026-01-01'     -- ✔\n  AND created_at <  '2027-01-01'\nWHERE status::text = 'PENDING'       -- ✗ a cast defeats the index too\nWHERE name LIKE 'abc%'               -- ✔ uses a B-tree\nWHERE name LIKE '%abc%'              -- ✗ needs a trigram index" }
]);

registerSheet("postgresql", [
  { h: "Index types", t: "table", rows: [
    ["Need", "Index"],
    ["Equality, ranges, sorting, <code>LIKE 'a%'</code>", "<b>B-tree</b> (default)"],
    ["<code>jsonb</code> containment, arrays, full text", "GIN"],
    ["Ranges, geometry, exclusion constraints", "GiST"],
    ["Huge append-only, naturally ordered", "BRIN — tiny index, big win"],
    ["<code>LIKE '%x%'</code>, fuzzy match", "GIN + <code>pg_trgm</code>"]
  ]},
  { h: "Isolation levels", t: "table", rows: [
    ["Level", "Prevents"],
    ["READ COMMITTED (default)", "Dirty reads only"],
    ["REPEATABLE READ", "+ non-repeatable reads and <b>phantoms</b> (stricter than the standard)"],
    ["SERIALIZABLE", "+ <b>write skew</b>, via SSI"],
    ["Note", "Postgres <b>aborts</b> with SQLSTATE 40001 rather than blocking — you must retry"]
  ]},
  { h: "MVCC consequences", t: "list", items: [
    "An <code>UPDATE</code> is physically an insert + a delete — a whole new row version.",
    "Every index must be updated, not just indexes on changed columns.",
    "<b>HOT updates</b> avoid that when no indexed column changed and the row fits on the page. Tune with <code>fillfactor</code>.",
    "<code>DELETE</code> does not return space to the OS — only <code>VACUUM FULL</code> or <code>pg_repack</code> does.",
    "Never index a column that changes on every update (a <code>last_seen</code> on a session table)."
  ]},
  { h: "Triage queries", t: "code", lang: "sql", code:
"SELECT count(*), state FROM pg_stat_activity GROUP BY state;\n-- many 'idle in transaction' = APPLICATION BUG holding locks\n\nSELECT blocked.pid, blocking.pid AS blocked_by\nFROM pg_stat_activity blocked\nJOIN pg_stat_activity blocking\n  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));\n\nSELECT calls, total_exec_time, mean_exec_time, left(query,80)\nFROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;\n\nSELECT relname, n_dead_tup, last_autovacuum FROM pg_stat_user_tables\nORDER BY n_dead_tup DESC LIMIT 10;\n\n-- The one that takes the DB down:\nSELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;" },
  { h: "Pool sizing", t: "quote", text: "The right pool is small — roughly cores × 2, often 10–20, not 100. Postgres uses a process per connection, so beyond saturation more connections make everything slower. PgBouncer in transaction mode is the only place you can cap it cluster-wide." },
  { h: "Partitioning", t: "list", items: [
    "RANGE for time series (the common case), LIST for tenant/region, HASH for even spread.",
    "The partition key <b>must</b> be in the primary key — so no global unique on another column.",
    "Pruning only happens when the query filters on the partition key.",
    "The real win is <code>DROP TABLE</code> instead of a bulk <code>DELETE</code>: milliseconds, no bloat, no WAL flood.",
    "Automate future partitions (pg_partman) or an insert eventually has nowhere to go."
  ]}
]);

registerSheet("docker", [
  { h: "Image vs container", t: "table", rows: [
    ["", "Image", "Container"],
    ["Is", "Immutable stack of read-only layers", "A running instance"],
    ["Analogy", "Class", "Object"],
    ["Writable", "No", "Thin top layer only"],
    ["Deleted with", "<code>docker rmi</code>", "<code>docker rm</code> (takes its layer)"]
  ]},
  { h: "Dockerfile that caches well", t: "code", lang: "dockerfile", code:
"# syntax=docker/dockerfile:1.7\nFROM maven:3.9-eclipse-temurin-21 AS build\nWORKDIR /src\nCOPY pom.xml .                                   # 1. deps FIRST\nRUN --mount=type=cache,target=/root/.m2 mvn -B dependency:go-offline\nCOPY src ./src                                   # 2. source LAST\nRUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package\n\nFROM eclipse-temurin:21-jre-jammy\nRUN useradd -r -u 1001 app\nUSER app                                         # never run as root\nCOPY --from=build /src/target/app.jar /app/app.jar\nENTRYPOINT [\"java\",\"-jar\",\"/app/app.jar\"]\n\n# Changing an instruction invalidates it AND everything after it." },
  { h: "CMD vs ENTRYPOINT", t: "table", rows: [
    ["", "Behaviour"],
    ["<code>ENTRYPOINT</code>", "The executable; <code>docker run</code> args are appended"],
    ["<code>CMD</code>", "Default args, fully replaced by <code>docker run</code> args"],
    ["Both", "ENTRYPOINT = binary, CMD = default flags — the usual pairing"],
    ["Exec form <code>[\"a\",\"b\"]</code>", "<b>Use this</b> — PID 1, receives signals"],
    ["Shell form <code>a b</code>", "Wrapped in <code>/bin/sh -c</code>, swallows SIGTERM"]
  ]},
  { h: "Slimming an image", t: "list", items: [
    "Multi-stage build — the toolchain never reaches the runtime image.",
    "A JRE, not a JDK. Alpine or distroless where the ecosystem allows.",
    "<code>.dockerignore</code>: target/, .git, node_modules.",
    "Spring Boot layered jar: dependencies and app code as separate layers.",
    "Pin base images by digest for reproducible builds."
  ]},
  { h: "Commands", t: "code", lang: "bash", code:
"docker build -t app:1.0 .\ndocker run -d -p 8080:8080 --name api -e SPRING_PROFILES_ACTIVE=prod app:1.0\ndocker logs -f api\ndocker exec -it api sh\ndocker history app:1.0              # what each layer costs\ndocker system prune -a              # careful: --volumes deletes data" }
]);

registerSheet("kubernetes", [
  { h: "Objects", t: "table", rows: [
    ["Object", "Is"],
    ["Pod", "One or more containers sharing network and storage"],
    ["ReplicaSet", "Keeps N pods running"],
    ["<b>Deployment</b>", "Manages ReplicaSets — rolling updates and rollback"],
    ["StatefulSet", "Stable identity and storage per pod (databases)"],
    ["DaemonSet", "One pod per node (agents)"],
    ["Job / CronJob", "Run to completion / on a schedule"],
    ["Service", "Stable virtual IP + load balancing"],
    ["Ingress", "HTTP routing into the cluster"]
  ]},
  { h: "Probes — get these right", t: "table", rows: [
    ["Probe", "On failure", "Rule"],
    ["<b>liveness</b>", "<b>Restarts the container</b>", "<b>Never check dependencies</b> — a DB hiccup restarts every pod"],
    ["<b>readiness</b>", "Removes it from the Service", "Dependency checks belong here"],
    ["<b>startup</b>", "Restarts if it never starts", "Protects slow JVM boots from liveness"]
  ]},
  { h: "Requests vs limits", t: "list", items: [
    "<b>request</b> = what the scheduler reserves. <b>limit</b> = the hard ceiling.",
    "CPU over the limit is <b>throttled</b>; memory over the limit is <b>OOMKilled</b> (exit 137).",
    "HPA measures utilisation against the <b>request</b> — a wrong request makes it scale on nonsense.",
    "No request set at all → CPU-based HPA does not work.",
    "Setting request = limit gives Guaranteed QoS: last to be evicted."
  ]},
  { h: "Autoscaling", t: "table", rows: [
    ["Scaler", "Scales", "Watch for"],
    ["HPA", "Replica count", "Needs requests set"],
    ["VPA", "CPU/memory requests", "Recreates pods; conflicts with HPA on the same metric"],
    ["Cluster Autoscaler", "Nodes", "Only triggers on <i>Pending</i> pods"],
    ["<b>KEDA</b>", "Replicas, <b>including to zero</b>", "The right answer for queue-driven work"]
  ]},
  { h: "Debugging", t: "code", lang: "bash", code:
"kubectl get pods -o wide\nkubectl describe pod <p>            # Events at the bottom explain most failures\nkubectl logs <p> -c <container> --previous   # --previous = the crashed instance\nkubectl exec -it <p> -- sh\nkubectl get events --sort-by=.lastTimestamp\nkubectl rollout status/undo deployment/api\nkubectl top pod\n\n# CrashLoopBackOff -> logs --previous.  ImagePullBackOff -> name/secret.\n# Pending -> describe: no node fits (resources, taints, selectors)." }
]);

registerSheet("cicd", [
  { h: "Branching", t: "table", rows: [
    ["Strategy", "Fits"],
    ["<b>Trunk-based</b>", "Continuous delivery + feature flags"],
    ["GitHub Flow", "Web apps, one production version — common default"],
    ["GitFlow", "Scheduled releases, versioned products"],
    ["Release branches", "Supporting several live versions"]
  ]},
  { h: "The hotfix procedure", t: "code", lang: "bash", code:
"git checkout -b hotfix/1.4.1 v1.4.0   # from the PRODUCTION TAG, not main\n# minimal fix + a test that reproduces the bug\ngit tag v1.4.1                        # deploy this\ngit checkout main && git merge hotfix/1.4.1\n\n# Cherry-picking without merging back means the next release\n# silently reintroduces the bug." },
  { h: "Git commands", t: "code", lang: "bash", code:
"git rebase main        # replay MY commits — linear history, own branch only\ngit merge main         # a merge commit — preserves what happened\ngit revert <sha>       # SAFE on shared history\ngit reset --hard <sha> # rewrites history, DISCARDS work — local only\ngit reset --keep <sha> # refuses if it would lose local changes\ngit bisect start/good/bad\ngit reflog             # the safety net — recovers almost anything" },
  { h: "Deployment strategies", t: "table", rows: [
    ["Strategy", "Cost", "Rollback"],
    ["Rolling", "None", "Minutes"],
    ["Blue-green", "<b>2× capacity</b>", "<b>Instant</b>"],
    ["Canary", "Small", "Fast, few users exposed"],
    ["Shadow", "2× compute", "Zero risk — nothing served"],
    ["Feature flag", "None", "<b>Instant, no deploy</b>"]
  ]},
  { h: "The prerequisite nobody mentions", t: "quote", text: "During any rolling or canary deploy, two versions run against one database and one topic. Migrations must be additive (expand/contract) and message schemas compatible both ways — otherwise no deployment strategy saves you." },
  { h: "Gate on these", t: "list", items: [
    "Error rate &lt; 1% and no worse than the stable version",
    "p99 latency within ~20% of stable",
    "No new saturation (CPU, memory, pool usage)",
    "<b>A business metric</b> — a broken Pay button still returns HTTP 200",
    "Decide the abort criteria <i>before</i> the deploy, and automate the check"
  ]}
]);

registerSheet("testing", [
  { h: "The pyramid", t: "table", rows: [
    ["Level", "Share", "Speed"],
    ["Unit", "Most", "Milliseconds"],
    ["Integration / slice", "Some", "Seconds"],
    ["End-to-end", "Few", "Minutes — slow and flaky"]
  ]},
  { h: "FIRST", t: "list", items: [
    "<b>F</b>ast — a slow suite stops being run.",
    "<b>I</b>solated — any order, any subset, same result.",
    "<b>R</b>epeatable — no clock, no randomness, no network.",
    "<b>S</b>elf-validating — passes or fails; nobody reads output.",
    "<b>T</b>imely — written with the code."
  ]},
  { h: "Spring test slices", t: "table", rows: [
    ["Annotation", "Loads"],
    ["<code>@SpringBootTest</code>", "The whole context — slowest"],
    ["<code>@WebMvcTest</code>", "Controllers, filters, advice only"],
    ["<code>@DataJpaTest</code>", "JPA + an in-memory DB, rolls back"],
    ["<code>@JsonTest</code>", "Serialisation only"],
    ["<code>@MockitoBean</code>", "Replace a bean in the context (Boot 3.4+)"],
    ["<code>@Testcontainers</code>", "A <b>real</b> database in Docker"]
  ]},
  { h: "Mockito", t: "code", lang: "java", code:
"when(repo.findById(1L)).thenReturn(Optional.of(order));\nverify(repo).save(any(Order.class));\nverify(repo, never()).delete(any());\nvar cap = ArgumentCaptor.forClass(Order.class);\nverify(repo).save(cap.capture());\n\ndoThrow(new DataAccessException(\"x\")).when(repo).save(any());\n// Stub only what the test needs; over-mocking makes refactors break tests\n// that catch no bugs." },
  { h: "Async and time", t: "code", lang: "java", code:
"// ✗ Thread.sleep(1000)  — flaky on CI, slow when it passes\nawait().atMost(5, SECONDS).untilAsserted(() -> assertThat(repo.find(id)).isPresent());\n\n// Time: INJECT a Clock, never call Instant.now() directly\nvar clock = Clock.fixed(Instant.parse(\"2026-09-11T10:00:00Z\"), UTC);\n// Otherwise \"does this expire after 30 days\" is untestable." }
]);
