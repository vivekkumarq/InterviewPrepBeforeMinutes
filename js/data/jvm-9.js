registerSimple("jvm", {
"What is the difference between the stack and the heap?":
`Each thread has its own <b>stack</b>, a small area that holds the local variables of the methods it is running; it is cleared automatically when a method ends. The <b>heap</b> is one big shared area where all objects live, and it is cleaned by the garbage collector. Local variables of object type sit on the stack but only hold an address pointing into the heap.`,

"What is a TLAB and how does object allocation actually work?":
`A TLAB (thread-local allocation buffer) is a small private piece of the heap given to each thread. Creating an object inside it is just "move a pointer forward", with no locking at all, which is why creating objects in Java is extremely fast. When the piece is used up, the thread grabs another one.`,

"How do you analyse a heap dump?":
`A heap dump is a snapshot of every object in memory. Open it in a tool such as Eclipse MAT, start with its "leak suspects" report, then look for the objects holding on to the most memory and follow the chain of references back to see what is keeping them alive. That chain usually points straight to the bug, such as a cache that never shrinks.`,

"What are the JVM's just-in-time deoptimisation and OSR?":
`The JIT makes code fast by guessing, for example "this method always receives the same class". If a guess turns out wrong, the JVM throws away the fast version and goes back to slower code: that is <b>deoptimisation</b>. <b>OSR</b> (on-stack replacement) lets a long-running loop switch to the fast compiled version while it is still running.`,

"What is the difference between -Xmx, -Xms and container memory limits?":
`<code>-Xms</code> is the heap size the JVM starts with, and <code>-Xmx</code> is the most the heap may grow to. A container memory limit covers the whole process: the heap plus thread stacks, Metaspace and other native memory. So <code>-Xmx</code> must be well below the container limit, or the container gets killed.`,

"How does String interning and the compact string optimisation work?":
`<b>Compact strings</b>: since Java 9, text that only uses basic Latin characters is stored with one byte per character instead of two, roughly halving the memory most Strings use. <b>Interning</b> keeps a single shared copy of identical Strings, which literals in your code use automatically.`,

"What is Java Flight Recorder and how do you use it?":
`Java Flight Recorder is a recorder built into the JVM that collects detailed data (CPU use, memory, garbage collection, locks, slow I/O) with very little overhead, so it can run in production. You start a recording, then open the file in JDK Mission Control to see where the time and memory actually went.`,

"What causes a StackOverflowError and how do you fix deep recursion?":
`Every method call uses a little space on the thread's stack. If a method keeps calling itself without stopping, or the recursion goes extremely deep, the stack runs out of space. Fix it by making sure the recursion has a stopping condition, or by rewriting it as a loop with your own stack. Increasing <code>-Xss</code> only delays the problem.`,

"What is the difference between G1 and ZGC in practical terms?":
`Both are garbage collectors. <b>G1</b> is the default and a good all-rounder, with pauses usually in the tens of milliseconds. <b>ZGC</b> does almost all its work while your program keeps running, so pauses stay under a millisecond even with huge heaps, at the cost of some extra CPU and memory. Choose ZGC when long pauses hurt users.`,

"How do you reduce a Java application's startup time?":
`First measure what is slow. Then common wins: load fewer classes and beans, use lazy initialisation, use Class Data Sharing (CDS) to reuse pre-processed class data between runs, use newer JDK features that cache startup work, or compile to a native image with GraalVM for near-instant startup.`,

"What is the Java Module System (JPMS) and did it matter?":
`The module system lets code declare which packages it exposes to others and which modules it depends on, so hidden internals really are hidden. Java itself was split into modules, which is why some internal classes are now blocked. Most applications never write their own modules, but it changed how libraries interact with the JDK.`,

"What are the essential JDK command-line tools for diagnosis?":
`The JDK includes tools for looking inside a running program. <code>jcmd</code> does most jobs (thread dumps, heap dumps, recordings). <code>jstack</code> prints what every thread is doing, <code>jmap</code> captures memory, <code>jstat</code> shows garbage collection activity, and <code>jfr</code> works with flight recordings.`,

"How does the JVM handle exceptions and what do they cost?":
`A try block costs nothing when no exception is thrown. Throwing one is expensive mainly because Java records the stack trace, the list of method calls that led to it. So exceptions should be used for unusual situations, not for normal control flow such as ending a loop.`,

"What is the difference between heap and off-heap memory, and when do you use direct buffers?":
`Heap memory is managed by the garbage collector. Off-heap (native) memory is outside the heap, so the collector does not move or scan it. Direct buffers live off-heap and make file and network I/O faster, because the operating system can read and write them without an extra copy. They are slower to create and easy to forget about when sizing memory.`,

"What is GraalVM native image and what are the trade-offs?":
`It compiles your Java program ahead of time into a standalone executable that starts almost instantly and uses much less memory. The trade-offs: builds are slow, long-running speed can be lower than the normal JVM, and libraries that use reflection need extra configuration. It suits serverless functions and command-line tools.`,

"Your production service throws OutOfMemoryError at 3am — walk me through your response":
`First restore service: restart the affected instance (or take it out of rotation) and make sure a heap dump was saved. Then diagnose calmly: check if memory grew slowly over hours (a leak) or jumped suddenly (one huge request), open the heap dump to find what filled memory, fix it, and add monitoring so you get warned earlier next time.`,

"What is the difference between a memory leak and high memory usage?":
`With <b>high usage</b>, memory rises under load but drops back to a steady level after garbage collection. With a <b>leak</b>, the level after each collection keeps creeping up over hours or days, because something keeps holding on to objects. Watching the memory left after full GCs over time tells you which one you have.`,

"What JVM flags would you set for a Spring Boot service in Kubernetes?":
`Size the heap as a percentage of the container's memory (<code>-XX:MaxRAMPercentage=70</code>) so it adapts to the limit, save a heap dump on out-of-memory errors, exit cleanly on out-of-memory so Kubernetes restarts the pod, and turn on GC logging. Start with defaults like these and only tune further based on measurements.`,

"How does the JVM decide when to promote an object to the old generation?":
`New objects start in the young generation. Each time an object survives a minor garbage collection, its age goes up by one; after about 15 survivals it moves to the old generation. Objects can also move early if the space for survivors is full, or if the object is very large.`,

"What is the difference between -Xmx, -Xms and why set them equal?":
`<code>-Xms</code> is the heap's starting size and <code>-Xmx</code> its maximum. Setting them equal means the JVM reserves the full heap at startup and never has to grow or shrink it, which avoids pauses from resizing and makes memory use predictable. It is common for servers.`,

"What happens during a full GC and why is it expensive?":
`A full garbage collection cleans the entire heap, not just the young part. With many collectors your whole program is paused while it runs, and the larger the heap, the longer the pause can be, sometimes seconds. Frequent full GCs usually mean the heap is too small or there is a memory leak.`,

"How would you diagnose a slow application without a profiler installed?":
`Use the tools that come with the JDK. Take a few thread dumps a few seconds apart to see where threads are stuck, check garbage collection activity with <code>jstat</code>, and start a Java Flight Recorder recording with <code>jcmd</code>. Most slowness shows up as threads waiting on a lock, a database, or a slow external call.`,

"What is the difference between the JIT compiler and an AOT compiler?":
`A <b>JIT</b> (just-in-time) compiler turns code into machine code while the program runs, using what it learns about how the code is actually used; it starts slower but can reach very high speed. An <b>AOT</b> (ahead-of-time) compiler does all the compiling before the program runs, so it starts very fast but cannot use that live information.`,

"Explain the Java memory model in terms of what a developer must actually know":
`Three facts cover most of it. Without synchronisation, one thread's change may never be seen by another. Locks, <code>volatile</code> fields and thread start or join are what make changes visible. And objects that never change (immutable) are always safe to share once created.`,

"Your service throws OutOfMemoryError in production — walk me through the diagnosis":
`Read the exact error message first: "Java heap space", "Metaspace" and "unable to create native thread" point to different causes. Then get a heap dump (ideally saved automatically on the error), find which objects take up the memory and what is holding on to them, and compare memory over time to tell a leak from a heap that is simply too small.`,

"Compare the garbage collectors — Serial, Parallel, G1, ZGC and Shenandoah":
`<b>Serial</b>: one thread, for tiny programs. <b>Parallel</b>: fastest total throughput, but long pauses; good for batch jobs. <b>G1</b>: the default, balancing speed and pause time. <b>ZGC</b> and <b>Shenandoah</b>: very short pauses even with huge heaps, by doing most work while the program runs.`,

"What happens when a Java class is loaded, and what is the delegation model?":
`Loading a class means finding its bytes, checking they are safe, preparing its static fields and running its static setup code. Under the delegation model, a class loader first asks its parent loader to find a class before trying itself, so core Java classes always come from Java itself and cannot be replaced by a fake copy.`,

"How does the JIT compiler work, and what is tiered compilation?":
`Java starts by interpreting code. It counts how often each method runs, and when a method becomes "hot" it compiles it to machine code. Tiered compilation does this in two levels: a quick, simple compile first (C1) so things speed up soon, then a slower, highly optimised compile (C2) for the very hottest code.`,

"How do you profile a JVM application and find the actual bottleneck?":
`Measure instead of guessing. Use a profiler such as Java Flight Recorder or async-profiler to see which methods use the most CPU, and look at where threads wait, because slow programs are often waiting on locks, databases or networks rather than calculating. Fix the biggest cost first, then measure again.`,

"Production alert: the service is using 100% CPU. How do you diagnose it?":
`Find which threads are using the CPU (for example with <code>top -H</code>), then take thread dumps to see exactly what those threads are running. If the busy threads are garbage collection threads, memory is the real problem. If it is one application thread stuck in the same code every time, look for a loop that never ends.`,

"Which garbage collector would you choose, and how do you tune it?":
`Start with the default (G1) and good logging. Switch to ZGC if pauses are hurting response times, or to Parallel for batch jobs where only total speed matters. Tune by changing one setting at a time (heap size first, then the pause goal) and measuring the effect each time.`,

"The container was OOMKilled but the heap was only half full. Where did the memory go?":
`The container's limit covers all of Java's memory, not just the heap. Thread stacks, Metaspace (class information), the JIT's code cache, the garbage collector's own data and direct buffers all use memory outside the heap. Together they pushed the process over the limit, so the system killed it without a Java error. Leave room for them, for example by setting the heap to about 70% of the container.`,

"Why did adding one more implementation slow down a hot method? Explain inlining and megamorphic calls":
`The JIT speeds up method calls by copying ("inlining") the target method's code into the caller, but only when it knows which version will run. With one or two implementations it can do this. With three or more (a "megamorphic" call), it gives up and does a slower lookup every time, which also blocks other optimisations. It only matters in very hot code.`,

"What are the JVM runtime memory areas?":
`The <b>heap</b> holds all objects and is shared by every thread. <b>Metaspace</b> holds information about classes. Each thread has its own <b>stack</b> for method calls and a program counter. There is also a <b>code cache</b> for compiled machine code. Only the heap is cleaned by the garbage collector.`,

"Explain the class loading process":
`It happens in three phases. <b>Loading</b>: read the class file's bytes. <b>Linking</b>: check the bytecode is safe, set up static fields with default values, and connect references to other classes. <b>Initialisation</b>: run the static setup code and give static fields their real values. It happens the first time a class is actually used.`,

"What is the parent delegation model of class loaders?":
`When a class loader is asked for a class, it first passes the request up to its parent, which passes it to its own parent, all the way to the top. Only if none of them can find it does the original loader load it itself. This guarantees core classes such as <code>java.lang.String</code> always come from Java and cannot be replaced.`,

"How does garbage collection work? Explain the generational hypothesis":
`The garbage collector finds objects that nothing in the program can reach any more and frees their memory. The generational hypothesis is the observation that most objects die young. So the heap is split into a young area, cleaned often and quickly, and an old area for long-lived objects, cleaned rarely.`,

"Compare the garbage collectors: Serial, Parallel, CMS, G1, ZGC, Shenandoah":
`<b>Serial</b> uses one thread for small programs. <b>Parallel</b> maximises total speed but pauses longer. <b>CMS</b> was an older low-pause collector, now removed. <b>G1</b> is the balanced default. <b>ZGC</b> and <b>Shenandoah</b> keep pauses tiny by working while the program runs. The choice depends on whether you care more about speed or about short pauses.`,

"What is a stop-the-world pause and how do you reduce it?":
`A stop-the-world pause is a moment when the JVM freezes all your program's threads so the garbage collector can safely work. Long pauses make requests slow. Reduce them by choosing a low-pause collector such as ZGC, sizing the heap properly, and creating fewer long-lived objects.`,

"What causes OutOfMemoryError, and how do you diagnose it?":
`It means a memory area is full. "Java heap space" usually means a leak or too small a heap. "Metaspace" usually means classes keep being loaded and never unloaded. "Unable to create native thread" means too many threads. Read the message, take a heap dump, and find what is holding on to the memory.`,

"What is JIT compilation, C1/C2 and tiered compilation?":
`JIT compilation turns frequently used bytecode into fast machine code while the program runs. <b>C1</b> compiles quickly with simple optimisations; <b>C2</b> compiles slowly but produces very fast code. Tiered compilation uses C1 first, then C2 for the hottest methods, so you get both a quick start and high long-term speed.`,

"How do you tune JVM memory for a container (Docker/Kubernetes)?":
`Modern Java reads the container's memory limit, so set the heap as a percentage of it, for example <code>-XX:MaxRAMPercentage=70</code>, leaving the rest for stacks, Metaspace and native memory. Limit threads, cap direct memory if your libraries use a lot, and set the container's memory request equal to its limit so it is not squeezed.`,

"What are strong, soft, weak and phantom references?":
`They control how strongly a reference keeps an object alive. A <b>strong</b> reference (a normal variable) keeps it alive. A <b>soft</b> reference lets the GC free it when memory runs low, which is useful for caches. A <b>weak</b> reference lets the GC free it at the next collection. A <b>phantom</b> reference only tells you after the object has been collected, for clean-up work.`,

"How do you read a GC log and decide whether GC is your problem?":
`A GC log records every collection, how long it paused your program and how much memory was freed. Check what share of total time is spent in GC (under about 5% is healthy), how long the longest pauses are, and whether memory after each full GC keeps rising. High values point to a too-small heap or a leak.`,

"What is the difference between StackOverflowError and OutOfMemoryError?":
`<b>StackOverflowError</b> means one thread's call stack ran out of space, almost always from recursion that never stops. <b>OutOfMemoryError</b> means a shared memory area, usually the heap, is full, often from a leak or too much data at once. The first is a single-thread problem; the second affects the whole program.`,

"What are the JVM's memory-related startup flags you would set in production?":
`Typical ones: a heap size (<code>-Xmx</code>, or <code>MaxRAMPercentage</code> in containers), saving a heap dump on out-of-memory errors, exiting on out-of-memory so the process restarts cleanly, and GC logging. Start with these and the defaults, then change one setting at a time based on measurements.`,

"What is a memory leak in Java if there is a garbage collector?":
`The garbage collector only frees objects that nothing can reach. A leak happens when your code keeps a reference to objects it no longer needs, so the collector is not allowed to free them. Common causes: static maps or caches that only grow, listeners that are never removed, and ThreadLocal values that are never cleared.`,

"How does the JVM handle method invocation — what are the invoke bytecodes?":
`Bytecode has different instructions for different kinds of method calls: one for static methods, one for constructors and private methods, one for normal instance methods (which chooses the right override at run time), one for interface methods, and <code>invokedynamic</code>, which is how lambdas are linked. They tell the JVM how to find the method to run.`,

"What is escape analysis and scalar replacement?":
`Escape analysis is the JIT checking whether an object ever leaves the method that created it. If it does not, the JIT can avoid creating the object on the heap at all and just keep its fields in fast local variables. That is scalar replacement, and it means small temporary objects in hot code often cost nothing.`,

"Explain how you would profile a slow Java application end to end":
`Start by defining "slow" with real numbers, such as response times. Find which layer is slow (the database, an external call or the Java code) with tracing. Inside the Java process, use a profiler to see where CPU time and waiting time go. Fix the biggest cost, then measure again to confirm the improvement.`,

"What is the difference between Metaspace and PermGen?":
`Both store information about classes. <b>PermGen</b> (up to Java 7) was a small fixed-size part of the heap that often ran out of space. <b>Metaspace</b> (Java 8 onwards) lives in native memory and grows as needed, so those errors became rare, though you should still cap it so a class leak cannot use unlimited memory.`
});
