registerSimple("java-versions", {
"How do you pick a JDK distribution, and does it matter?":
`A "distribution" is a packaged build of Java from a particular vendor, such as Eclipse Temurin, Amazon Corretto, Azul Zulu or Oracle. They are all built from the same open-source code and run your program the same way. What differs is the licence, how long each version gets free updates, and a few extras. A free, well-supported build such as Temurin or Corretto is the usual choice.`,

"What is GraalVM native-image, and when is it worth the trade-offs?":
`Native-image compiles a Java program ahead of time into a standalone executable that starts in milliseconds and uses much less memory. The costs: building takes minutes, long-running speed can be lower, and anything using reflection needs extra setup. It is worth it for serverless functions and command-line tools, where fast startup matters most.`,

"You are on Java 8 and asked to move to 17 or 21. What actually breaks?":
`The new language features are easy; the breakage is elsewhere. Java EE libraries such as JAXB were removed and must be added as separate dependencies, old libraries may not support the new version, and code that reached into Java's internal classes is now blocked. Upgrade your libraries first, then fix these issues one by one.`,

"Records, sealed classes and pattern matching — what problem does each solve?":
`<b>Records</b> remove the boilerplate of data classes: constructor, getters, equals and hashCode are generated for you. <b>Sealed classes</b> let you fix exactly which subclasses exist. <b>Pattern matching</b> lets you check a type and use it in one step. Together, the compiler can warn you when your switch forgets a case.`,

"Virtual threads in Java 21 — what changes and what does not":
`Virtual threads are extremely lightweight threads, so you can run one per request even with a million requests. They help when tasks spend their time waiting on databases or web services. They do not make heavy calculations faster, and you still need to protect shared data just like before.`,

"Rewrite this Java 8 class in modern Java, step by step":
`The idea is to show modern features by refactoring real code. A plain data class becomes a record, a fixed family of types becomes a sealed interface, if/else chains with instanceof become a pattern-matching switch, and messy multi-line strings become text blocks. Each step removes code and lets the compiler catch more mistakes.`,

"What arrived in Java 22 to 25, and what is worth using today?":
`Java 25 is the latest long-term version. Useful final features from 22 to 25 include unnamed variables (<code>_</code> for values you do not need), stream gatherers for custom stream steps, scoped values (a safer replacement for ThreadLocal), validating arguments before calling <code>super()</code> in constructors, and virtual threads no longer getting stuck on <code>synchronized</code> blocks.`,

"What are the Java LTS releases, and which version should a new project target?":
`Java releases a new version every six months, and every two years one becomes LTS (Long-Term Support), which keeps getting fixes for years. The LTS versions are 8, 11, 17, 21 and 25. A new project should use the newest LTS that its frameworks support.`,

"What did Java 9, 10 and 11 add beyond the module system?":
`Java 9 added quick collection factories like <code>List.of</code>, JShell (a place to try code interactively) and new stream methods. Java 10 added <code>var</code>. Java 11 added a modern built-in HTTP client, handy String methods like <code>isBlank()</code> and <code>strip()</code>, and the ability to run a single source file directly.`,

"What is var, and what are the rules for using it well?":
`<code>var</code> lets the compiler work out a local variable's type from the value you assign, for example <code>var list = new ArrayList&lt;String&gt;()</code>. The variable is still strictly typed; you just do not repeat the type. Use it when the type is obvious from the right-hand side, and avoid it when it hides what kind of value you have.`,

"What is new in Java 17, and what would justify upgrading to it?":
`Java 17 is the LTS where many newer features became final together: records, sealed classes, text blocks, switch expressions and pattern matching for instanceof. It also brought better garbage collectors and long-term support, and it is the minimum version for Spring Boot 3. That makes it a common target for upgrades from Java 8 or 11.`,

"What is new in Java 21, and what does it change in practice?":
`Java 21's headline is virtual threads, which let ordinary step-by-step code handle huge numbers of requests at once. It also made pattern matching in switch and record patterns final, and added sequenced collections with methods like <code>getFirst()</code> and <code>getLast()</code>. For server code, it is the most important LTS since Java 8.`,

"Your team is on Java 8 — how would you plan and execute the upgrade?":
`Do it in stages. First, run the existing app on the new Java without changing code, and fix what breaks. Second, update libraries and frameworks to versions that support it. Third, switch the build to the new Java level. Only then start using new language features. Test thoroughly at each stage and roll out gradually.`,

"Text blocks, switch expressions and sequenced collections — the smaller features you use daily":
`<b>Text blocks</b> let you write multi-line text (JSON, SQL) between three double quotes, without escape characters. <b>Switch expressions</b> return a value and cannot accidentally fall through. <b>Sequenced collections</b> give ordered collections simple methods like <code>getFirst()</code> and <code>reversed()</code>. Small, but they tidy up everyday code.`,

"What is the module system (JPMS), and does anyone actually use it?":
`The module system, added in Java 9, lets a library declare exactly which of its packages others may use and which other modules it needs. Java itself was split into modules this way. Most applications do not write modules, because every library they depend on would also need to support it, but it is why some internal Java classes are now blocked.`,

"What are preview and incubator features, and how do you use them safely?":
`Preview features are new language features you can try with a special flag, but they can still change. Incubator features are new libraries (APIs) at a similar early stage. Use them for learning and experiments, not in production, because your code may stop compiling when the feature changes.`
});
