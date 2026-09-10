/* Cheatsheets — the condensed recall layer. One screen per topic, built for
   the fifteen minutes before you walk in, not for learning from scratch. */
registerSheet("java-basics", [
  { h: "Primitives & defaults", t: "table", rows: [
    ["Type", "Size", "Default", "Range"],
    ["byte", "8-bit", "0", "−128 … 127"],
    ["short", "16-bit", "0", "−32,768 … 32,767"],
    ["int", "32-bit", "0", "≈ ±2.1 billion"],
    ["long", "64-bit", "0L", "≈ ±9.2 quintillion"],
    ["float", "32-bit", "0.0f", "~7 decimal digits"],
    ["double", "64-bit", "0.0d", "~15 decimal digits"],
    ["char", "16-bit", "'\\u0000'", "0 … 65,535"],
    ["boolean", "JVM-dependent", "false", "true / false"]
  ]},
  { h: "The equality rules", t: "list", items: [
    "<code>==</code> compares <b>references</b> for objects, <b>values</b> for primitives.",
    "<code>equals()</code> compares content — but only if the class overrides it.",
    "Integer cache covers <b>−128 … 127</b>; outside it <code>==</code> on wrappers is false.",
    "Mixing a wrapper with a primitive <b>unboxes</b>, so it becomes a value comparison.",
    "Unboxing a <code>null</code> wrapper throws NPE with no visible dereference.",
    "Use <code>Objects.equals(a, b)</code> — it is null-safe on both sides."
  ]},
  { h: "String essentials", t: "code", lang: "java", code:
"String a = \"hi\", b = \"hi\";       // both from the pool -> a == b\nString c = new String(\"hi\");     // new object    -> a != c\nc.intern() == a;                 // true\n\n\"  x  \".strip();                 // Unicode-aware (11+); trim() is ASCII-only\n\"\".isBlank();                    // whitespace-only counts as blank\n\"ab\".repeat(3);                  // \"ababab\"\nString.join(\", \", list);\n\"a,b\".split(\",\", -1);            // -1 keeps trailing empty strings\n\ns += x  // inside a loop is O(n^2) -> use StringBuilder" },
  { h: "Exception hierarchy", t: "list", items: [
    "<code>Throwable</code> → <code>Error</code> (don't catch) and <code>Exception</code>.",
    "<b>Checked</b>: compiler forces catch-or-declare (IOException, SQLException).",
    "<b>Unchecked</b>: <code>RuntimeException</code> — programming errors.",
    "Rollback in Spring happens on unchecked only, unless <code>rollbackFor</code> is set.",
    "<code>finally</code> runs even on return; a <code>return</code> inside it swallows exceptions.",
    "try-with-resources closes in <b>reverse</b> order and attaches suppressed exceptions."
  ]},
  { h: "Pass-by-value, always", t: "code", lang: "java", code:
"void mutate(List<String> l) { l.add(\"x\"); }    // caller SEES this\nvoid reassign(List<String> l) { l = new ArrayList<>(); }  // caller does NOT\n\n// Java copies the reference. You can change what the object CONTAINS,\n// never what the caller's variable POINTS AT. swap() is impossible." },
  { h: "Say this", t: "quote", text: "Java passes references by value — there is no pass-by-reference. That single sentence explains why mutation is visible to the caller and reassignment is not." }
]);

registerSheet("java-oop", [
  { h: "The four pillars", t: "table", rows: [
    ["Pillar", "Means", "In code"],
    ["Encapsulation", "Hide state behind behaviour", "private fields + methods that enforce invariants"],
    ["Inheritance", "IS-A reuse", "<code>extends</code> — use sparingly"],
    ["Polymorphism", "One interface, many types", "Overriding + dynamic dispatch"],
    ["Abstraction", "Expose what, hide how", "interface / abstract class"]
  ]},
  { h: "Overloading vs overriding", t: "table", rows: [
    ["", "Overloading", "Overriding"],
    ["Resolved", "<b>Compile time</b> (declared type)", "<b>Runtime</b> (actual object)"],
    ["Signature", "Must differ", "Must match"],
    ["Return type", "Any", "Same or covariant"],
    ["Access", "Any", "Cannot narrow"],
    ["static / private / final", "Can overload", "<b>Cannot</b> override"]
  ]},
  { h: "equals / hashCode contract", t: "list", items: [
    "Equal objects <b>must</b> have equal hash codes. The reverse is not required.",
    "Override both, or neither — a HashSet will hold duplicates otherwise.",
    "Never use a <b>mutable</b> field in <code>hashCode</code>: the entry is stranded in its old bucket.",
    "<code>equals(MyType)</code> <b>overloads</b>, it does not override. Always write <code>@Override</code>.",
    "A <code>record</code> generates both correctly for free."
  ]},
  { h: "SOLID in one line each", t: "table", rows: [
    ["S", "Single responsibility", "One reason to change"],
    ["O", "Open/closed", "Extend without editing"],
    ["L", "Liskov substitution", "A subtype must be usable as its supertype"],
    ["I", "Interface segregation", "Many small interfaces beat one fat one"],
    ["D", "Dependency inversion", "Depend on abstractions, inject them"]
  ]},
  { h: "Say this", t: "quote", text: "I use inheritance when there is a genuine IS-A relationship and the base class was designed for extension. Otherwise I compose — design for inheritance or prohibit it." }
]);

registerSheet("java-collections", [
  { h: "Pick the right one", t: "table", rows: [
    ["Need", "Use", "Get / Add"],
    ["Indexed access", "<code>ArrayList</code>", "O(1) / amortised O(1)"],
    ["Queue or deque", "<code>ArrayDeque</code>", "O(1) both ends"],
    ["Key lookup", "<code>HashMap</code>", "O(1) average"],
    ["Sorted keys, ranges", "<code>TreeMap</code>", "O(log n)"],
    ["Insertion order kept", "<code>LinkedHashMap</code>", "O(1)"],
    ["Thread-safe map", "<code>ConcurrentHashMap</code>", "O(1)"],
    ["Always the min/max", "<code>PriorityQueue</code>", "O(1) peek, O(log n) poll"],
    ["Many reads, rare writes", "<code>CopyOnWriteArrayList</code>", "O(1) read"]
  ]},
  { h: "HashMap internals", t: "list", items: [
    "<code>index = (n − 1) &amp; (h ^ (h >>> 16))</code> — the spread mixes high bits down.",
    "Table length is a <b>power of two</b>, which is what makes the mask work.",
    "Default capacity 16, load factor 0.75 → resizes at 12 entries, doubling each time.",
    "Java 8+: a bucket becomes a <b>red-black tree</b> at 8 entries (table ≥ 64), back to a list at 6.",
    "Treeifying caps hash-collision DoS at O(log n) instead of O(n).",
    "Java 7's head-insert resize could form a cycle and spin a CPU at 100%; fixed in 8 — still not thread-safe."
  ]},
  { h: "Null tolerance", t: "table", rows: [
    ["Collection", "Null key", "Null value"],
    ["HashMap", "One", "Yes"],
    ["LinkedHashMap", "One", "Yes"],
    ["TreeMap", "<b>No</b>", "Yes"],
    ["ConcurrentHashMap", "<b>No</b>", "<b>No</b>"],
    ["Hashtable", "No", "No"],
    ["<code>Map.of(...)</code>", "No", "No"]
  ]},
  { h: "Removing while iterating", t: "code", lang: "java", code:
"list.removeIf(s -> s.isBlank());        // best: one pass, no CME\n\nIterator<String> it = list.iterator();  // classic\nwhile (it.hasNext()) if (bad(it.next())) it.remove();\n\n// for (String s : list) list.remove(s);  -> ConcurrentModificationException\n// ...except when removing the SECOND-TO-LAST element, where it silently\n// exits early instead. A missing exception is worse than a thrown one." },
  { h: "Comparator", t: "code", lang: "java", code:
"list.sort(Comparator.comparing(Employee::dept)\n        .thenComparing(Employee::salary, Comparator.reverseOrder())\n        .thenComparing(Employee::name));\n\nComparator.comparingInt(E::salary)     // no boxing\nComparator.nullsLast(naturalOrder())\n\n// NEVER (a, b) -> a.salary() - b.salary()  — int overflow breaks TimSort\n// with \"Comparison method violates its general contract!\"" }
]);

registerSheet("java-concurrency", [
  { h: "Thread pool sizing", t: "table", rows: [
    ["Workload", "Size", "Why"],
    ["CPU-bound", "cores + 1", "One spare covers a page fault"],
    ["IO-bound", "cores × (1 + wait/service)", "Threads are mostly blocked"],
    ["Mixed", "Measure", "Separate pools per dependency"]
  ]},
  { h: "Never use these in production", t: "code", lang: "java", code:
"Executors.newFixedThreadPool(n);   // UNBOUNDED queue -> OOM under load\nExecutors.newCachedThreadPool();   // UNBOUNDED threads\n\n// Always construct explicitly:\nnew ThreadPoolExecutor(8, 16, 60L, SECONDS,\n    new ArrayBlockingQueue<>(500),          // bounded = backpressure\n    namedThreadFactory(\"order-%d\"),         // named = debuggable\n    new ThreadPoolExecutor.CallerRunsPolicy());\n\n// Order: core threads -> QUEUE fills -> then grow to max -> then reject.\n// An unbounded queue means maxPoolSize is never reached." },
  { h: "Choosing a primitive", t: "table", rows: [
    ["Need", "Use"],
    ["One counter or flag", "<code>AtomicInteger</code> / <code>AtomicReference</code>"],
    ["High-contention counter", "<code>LongAdder</code>"],
    ["Compound update on shared state", "<code>synchronized</code>"],
    ["Timeout, fairness, many conditions", "<code>ReentrantLock</code>"],
    ["Many readers, rare writer", "<code>ReadWriteLock</code> / <code>StampedLock</code>"],
    ["Wait for N tasks", "<code>CountDownLatch</code>"],
    ["Reusable barrier", "<code>CyclicBarrier</code>"],
    ["Bound concurrency", "<code>Semaphore</code>"]
  ]},
  { h: "volatile vs synchronized", t: "list", items: [
    "<code>volatile</code> gives <b>visibility</b> and ordering — not atomicity. <code>count++</code> is still a race.",
    "<code>synchronized</code> gives visibility <b>and</b> mutual exclusion.",
    "happens-before: unlock → lock, volatile write → volatile read, thread start → run, run → join.",
    "Double-checked locking <b>requires</b> <code>volatile</code>, or you can see a partly-built object."
  ]},
  { h: "Deadlock: break one condition", t: "list", items: [
    "Mutual exclusion → immutable or lock-free data.",
    "Hold and wait → take all locks at once, or none.",
    "No pre-emption → <code>tryLock</code> with a timeout, then back off.",
    "<b>Circular wait → global lock ordering.</b> This is the practical fix.",
    "Detect with <code>jcmd &lt;pid&gt; Thread.print</code> — symptom is zero throughput at <b>idle</b> CPU."
  ]},
  { h: "Virtual threads (21+)", t: "code", lang: "java", code:
"try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {\n    ids.forEach(id -> ex.submit(() -> client.fetch(id)));   // blocking is fine\n}\nspring.threads.virtual.enabled=true\n\n// Caveats: synchronized PINS the carrier (prefer ReentrantLock);\n// no help for CPU-bound work; never pool them; downstream pools still cap you." }
]);

registerSheet("java-8", [
  { h: "Stream pipeline", t: "code", lang: "java", code:
"list.stream()                       // source\n    .filter(x -> x.active())        // intermediate — LAZY\n    .map(X::name)\n    .sorted()\n    .distinct()\n    .limit(10)\n    .collect(toList());             // terminal — runs the pipeline\n\n// Nothing executes until the terminal op. A stream is single-use." },
  { h: "Collectors worth knowing", t: "code", lang: "java", code:
"groupingBy(E::dept)                                  // Map<K, List<E>>\ngroupingBy(E::dept, counting())                       // Map<K, Long>\ngroupingBy(E::dept, averagingInt(E::salary))\ngroupingBy(E::dept, mapping(E::name, toList()))\ngroupingBy(E::dept, TreeMap::new, counting())         // sorted result\npartitioningBy(e -> e.salary() > 100_000)             // always BOTH keys\njoining(\", \", \"[\", \"]\")\nsummarizingInt(E::salary)                             // count/sum/min/max/avg\ntoMap(E::id, e -> e, (a, b) -> a, LinkedHashMap::new) // merge fn avoids throw" },
  { h: "Functional interfaces", t: "table", rows: [
    ["Interface", "Shape", "Method"],
    ["<code>Function&lt;T,R&gt;</code>", "T → R", "apply"],
    ["<code>BiFunction&lt;T,U,R&gt;</code>", "T,U → R", "apply"],
    ["<code>Predicate&lt;T&gt;</code>", "T → boolean", "test"],
    ["<code>Consumer&lt;T&gt;</code>", "T → void", "accept"],
    ["<code>Supplier&lt;T&gt;</code>", "() → T", "get"],
    ["<code>UnaryOperator&lt;T&gt;</code>", "T → T", "apply"],
    ["<code>BinaryOperator&lt;T&gt;</code>", "T,T → T", "apply"]
  ]},
  { h: "Optional rules", t: "list", items: [
    "Return type only — never a field, never a parameter.",
    "<code>orElse</code> always evaluates its argument; <code>orElseGet</code> is lazy.",
    "<code>map</code> / <code>flatMap</code> / <code>filter</code> chain and short-circuit on empty.",
    "<code>orElseThrow(() -> new NotFound(id))</code> is the service-layer idiom.",
    "Return an <b>empty list</b>, not <code>Optional&lt;List&gt;</code>."
  ]},
  { h: "Parallel streams — the checklist", t: "list", items: [
    "Large data, CPU-bound, splittable source (ArrayList / array / IntStream.range).",
    "Stateless, side-effect-free lambda; associative reduction.",
    "Uses the <b>shared</b> common ForkJoinPool — blocking IO there starves the whole JVM.",
    "Below ~10,000 elements the coordination usually costs more than it saves.",
    "Measure. Otherwise use an executor with its own pool."
  ]}
]);

registerSheet("java-versions", [
  { h: "LTS timeline", t: "table", rows: [
    ["Version", "Year", "Headline"],
    ["8", "2014", "Lambdas, streams, Optional, java.time"],
    ["11", "2018", "<code>var</code>, HttpClient, String utils; EE modules removed"],
    ["17", "2021", "Records, sealed, text blocks, switch expressions final"],
    ["21", "2023", "<b>Virtual threads</b>, pattern matching for switch, sequenced collections"],
    ["25", "2025", "Scoped values, module imports, compact source files"]
  ]},
  { h: "Feature → version", t: "table", rows: [
    ["Feature", "Final in"],
    ["Switch expressions, helpful NPEs", "14"],
    ["Text blocks", "15"],
    ["Records, <code>instanceof</code> patterns", "16"],
    ["Sealed classes", "17"],
    ["Virtual threads, record patterns, switch patterns", "21"],
    ["Sequenced collections", "21"],
    ["Scoped values, module import declarations", "25"]
  ]},
  { h: "Upgrading off Java 8", t: "list", items: [
    "<b>1.</b> Run on the new JDK, still compiling <code>--release 8</code>. Most surprises land here.",
    "<b>2.</b> Upgrade libraries and build plugins (Lombok, ASM, cglib, Mockito, Hibernate).",
    "<b>3.</b> Bump <code>--release</code> to 17 or 21.",
    "<b>4.</b> Adopt the new language features.",
    "Breaks: removed <code>javax.xml.bind</code>/CORBA, strong encapsulation (no <code>--illegal-access</code>), CMS removed, CLDR locale data.",
    "Tools: <code>jdeps --jdk-internals</code>, <code>jdeprscan</code>, OpenRewrite migration recipes."
  ]},
  { h: "Preview features", t: "quote", text: "A class file compiled with --enable-preview refuses to load on any other JDK release. String templates previewed in 21 and 22 then were withdrawn — that is why previews never ship to production." }
]);

registerSheet("jvm", [
  { h: "Runtime memory areas", t: "table", rows: [
    ["Area", "Shared?", "Holds"],
    ["Heap", "Shared", "Objects, arrays — where GC works"],
    ["Metaspace", "Shared", "Class metadata (native memory, not heap)"],
    ["JVM stack", "Per thread", "Frames, locals, partial results"],
    ["PC register", "Per thread", "Current instruction"],
    ["Native stack", "Per thread", "JNI frames"],
    ["Code cache", "Shared", "JIT-compiled machine code"]
  ]},
  { h: "Garbage collectors", t: "table", rows: [
    ["GC", "Pause", "Use for"],
    ["Serial", "High", "Tiny heaps, single core"],
    ["Parallel", "High", "Batch jobs — best throughput"],
    ["<b>G1</b> (default)", "~50–200 ms", "Almost every service"],
    ["ZGC", "&lt; 1 ms", "Latency-critical, huge heaps"],
    ["Shenandoah", "&lt; 10 ms", "Same niche, OpenJDK"]
  ]},
  { h: "Flags that matter", t: "code", lang: "bash", code:
"-XX:MaxRAMPercentage=75          # in a container, not a fixed -Xmx\n-XX:+UseG1GC -XX:MaxGCPauseMillis=200\n-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app/\n-Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=20M\n-Xms4g -Xmx4g                    # equal on a server: no resize pauses" },
  { h: "OOM triage", t: "table", rows: [
    ["Message", "Means"],
    ["Java heap space", "Leak, or genuinely undersized"],
    ["GC overhead limit exceeded", "98% of time in GC recovering &lt;2%"],
    ["Metaspace", "Classloader leak — redeploys, proxies"],
    ["unable to create native thread", "Thread leak or OS limit"],
    ["Direct buffer memory", "Off-heap NIO buffers not released"]
  ]},
  { h: "Live commands", t: "code", lang: "bash", code:
"jcmd <pid> GC.heap_info\njcmd <pid> GC.class_histogram | head -30\njcmd <pid> Thread.print | grep -A30 'Found one Java-level deadlock'\njstat -gcutil <pid> 1000          # is old gen climbing and never dropping?\njcmd <pid> GC.heap_dump /tmp/heap.hprof\n\n# Flat post-GC baseline = sizing problem. Rising baseline = leak." }
]);
