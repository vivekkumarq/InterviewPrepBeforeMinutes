registerSimple("java-concurrency", {
"What is thread starvation, livelock and priority inversion?":
`These are three ways threads fail to make progress without technically crashing. <b>Starvation</b>: one thread never gets its turn because others keep winning. <b>Livelock</b>: threads keep politely reacting to each other and stepping aside, so none moves forward, like two people in a corridor dodging the same way. <b>Priority inversion</b>: an important thread waits on a lock held by an unimportant one that rarely gets to run.`,

"What is false sharing and how does it hurt performance?":
`A CPU loads memory in small blocks of 64 bytes, not one variable at a time. If two threads on different cores keep writing to two different variables that happen to sit in the same block, each write forces the other core to reload the block. The program stays correct but becomes much slower. Spacing the variables apart fixes it.`,

"How do you implement a custom thread pool sizing strategy?":
`For work that keeps the CPU busy (calculations), use about as many threads as CPU cores. For work that mostly waits (database or network calls), use more threads, because they spend most of their time idle. The usual rule: threads = cores × (1 + time waiting ÷ time working). Always use a bounded queue and decide what happens when it is full.`,

"What is the difference between synchronized and ReentrantReadWriteLock and StampedLock?":
`<code>synchronized</code> lets only one thread in at a time, whether it reads or writes. A <b>ReadWriteLock</b> lets many readers in together but only one writer, which helps when reads are frequent. A <b>StampedLock</b> goes further and lets readers read optimistically without locking, then check whether a write happened. More power means more ways to make mistakes, so start with synchronized.`,

"How do you write a correct producer-consumer with graceful shutdown?":
`Producers put work into a bounded <code>BlockingQueue</code> and consumer threads take it out. The queue being bounded stops a fast producer from using all the memory. To shut down cleanly, send a special "stop" item (a poison pill) that tells each consumer to finish what is left and exit, rather than killing them mid-task.`,

"What are the common concurrency bugs and how do you find them?":
`The usual ones: race conditions (wrong results that depend on timing), visibility bugs (a thread keeps seeing an old value), deadlocks (threads waiting for each other forever), and thread-pool starvation. They are hard to reproduce, so you find them with thread dumps, stress tests that run many threads at once, and careful review of any shared data that changes.`,

"How do you test concurrent code?":
`Start all threads at the same moment (for example with a <code>CountDownLatch</code> as a starting gun) so they really collide, run the test many times, and check the final result is exactly what it should be. Also make sure errors thrown inside worker threads are collected and reported, otherwise a failure there silently passes the test.`,

"What is a memory barrier and what do acquire/release semantics mean?":
`Compilers and CPUs reorder instructions to run faster. A memory barrier is a point the reordering cannot cross. "Release" means everything I wrote before this point becomes visible to others; "acquire" means I will see everything another thread released. Locks and <code>volatile</code> give you these barriers, so you rarely use them directly.`,

"What is the difference between Executor, ExecutorService and ScheduledExecutorService?":
`<b>Executor</b> is the simplest idea: "run this task somehow". <b>ExecutorService</b> adds the ability to get results back (Futures) and to shut the pool down properly. <b>ScheduledExecutorService</b> adds running tasks after a delay or repeatedly, such as every five minutes.`,

"Explain the double-checked locking pattern and why it needs volatile":
`It is a way to create a single shared object lazily: check if it exists, and only if not, take a lock and check again before creating it. The field must be <code>volatile</code>, because without it another thread can see the reference to the new object before the object has finished being built, and use a half-made object.`,

"How do virtual threads change how you write concurrent code?":
`Normal threads are expensive, so we used to share a small pool of them. Virtual threads (Java 21) are extremely cheap, so you can simply create one per task or per request, even a million of them. When a virtual thread waits for the network or database, it steps aside and frees the real thread underneath. So simple, step-by-step code can now handle huge numbers of users.`,

"Print odd and even numbers using two threads alternately":
`Two threads must take turns: one prints odd numbers, the other even. They share a lock and a "whose turn" flag. Each thread waits while it is not its turn, prints its number, flips the flag and wakes the other. The key details are to wait inside a loop and to always change the flag while holding the lock.`,

"What is the difference between CountDownLatch and CyclicBarrier with a real use case?":
`A <b>CountDownLatch</b> is a one-time countdown: one thread waits until N events have happened, for example until three services have started. A <b>CyclicBarrier</b> is a meeting point that resets: N threads wait for each other, then all continue together, and the same barrier can be used again for the next round.`,

"How do you implement a thread-safe counter — compare four approaches":
`Four options: a <code>synchronized</code> method (simple, but threads queue up), an <code>AtomicLong</code> (lock-free and fast when few threads compete), a <code>LongAdder</code> (fastest when many threads increment constantly), or giving each thread its own counter and adding them up at the end. Choose based on how many threads write at once.`,

"What is the difference between submit() and execute() in an ExecutorService?":
`Both run a task on the pool. <code>execute()</code> runs it and forgets it; if it throws an error, the error is printed. <code>submit()</code> gives you back a Future, and any error is stored inside that Future. If you never call <code>get()</code> on it, the error is silently lost, which is a common reason scheduled jobs fail without anyone noticing.`,

"Explain the producer-consumer problem and solve it with BlockingQueue":
`Some threads produce work and others consume it, at different speeds. A <code>BlockingQueue</code> sits between them: a consumer waits automatically when the queue is empty, and a producer waits when it is full. It handles all the waiting and waking for you, so you do not write any tricky lock code.`,

"What is a ThreadPoolExecutor's rejection policy and when does it trigger?":
`A pool rejects a new task only when all its threads are busy, it already has the maximum number of threads, and its waiting queue is full. The rejection policy decides what then happens: throw an error, run the task on the caller's own thread, or quietly drop it. With an unlimited queue it never rejects, but the queue can grow until memory runs out.`,

"How do you cancel a running task and handle InterruptedException correctly?":
`You cannot force a thread to stop. You ask it politely by interrupting it, and the task must check for that request or react when it is woken from waiting. When you catch <code>InterruptedException</code>, either pass it on or call <code>Thread.currentThread().interrupt()</code> to keep the request alive. Never just ignore it.`,

"What is the difference between a synchronized method and a synchronized block on different objects?":
`A synchronized method locks the whole object (<code>this</code>), or the class for a static method. A synchronized block lets you choose exactly which object to lock and how much code to protect. Two blocks that lock different objects do not block each other, so threads can work on different things at the same time.`,

"Explain how CompletableFuture handles exceptions and timeouts in a service call chain":
`In a chain of async steps, an error skips the remaining steps until something handles it. <code>exceptionally</code> lets you supply a fallback value, <code>handle</code> sees either the result or the error, and <code>orTimeout</code> or <code>completeOnTimeout</code> stop you waiting forever on a slow service.`,

"What is thread confinement and why is it the simplest concurrency strategy?":
`Thread confinement means only one thread ever touches a piece of data. If no other thread can see it, there is nothing to protect and no locks are needed. Local variables inside a method are naturally confined. It is the simplest and fastest way to be thread-safe.`,

"How do you size a thread pool, and what goes wrong with Executors.newFixedThreadPool?":
`Use about one thread per CPU core for calculation-heavy work, and more for work that mostly waits on databases or networks. The trap with <code>Executors.newFixedThreadPool</code> is its unlimited waiting queue: when work arrives faster than it is processed, the queue grows until the program runs out of memory. Build a <code>ThreadPoolExecutor</code> with a bounded queue instead.`,

"What is the difference between synchronized, ReentrantLock, and the Atomic classes?":
`<code>synchronized</code> is the built-in lock and releases itself automatically. <code>ReentrantLock</code> is a lock object with extra powers, such as trying for a limited time or being interrupted while waiting, but you must unlock it yourself in a <code>finally</code>. Atomic classes like <code>AtomicInteger</code> use no lock at all and are best for single values such as counters.`,

"Explain CompletableFuture — composing, combining and handling failures":
`A CompletableFuture is a promise of a result that will arrive later. You chain steps: <code>thenApply</code> transforms the result, <code>thenCompose</code> starts another async call that depends on it, <code>thenCombine</code> joins two independent results, and <code>exceptionally</code> handles errors. Nothing waits until you finally ask for the result.`,

"What causes a deadlock, and how do you detect and prevent one?":
`A deadlock happens when threads each hold a lock and wait for a lock another one holds, so all of them wait forever. The most common cause is taking two locks in different orders in different places. Prevent it by always locking in the same order or by using timeouts; detect it with a thread dump, which names the deadlocked threads.`,

"What is the Java Memory Model, and what does happens-before actually guarantee?":
`The Java Memory Model is the set of rules that says when a change made by one thread is guaranteed to be visible to another. Without those rules, a thread might keep seeing old values forever. "Happens-before" is the guarantee: if action A happens-before action B (for example, through the same lock or a volatile field), then B sees everything A did.`,

"What is structured concurrency, and how does it improve on CompletableFuture?":
`Structured concurrency treats a group of tasks started together as one unit. If one fails, the others are cancelled, and the method does not return until all of them have finished. With plain CompletableFutures, tasks can keep running in the background after the code that started them has given up, which makes errors and cancellation messy.`,

"Explain the Java Memory Model — happens-before, visibility and reordering":
`Each thread may keep its own cached copy of values, and the compiler and CPU may reorder instructions. So without rules, one thread's change might never be seen by another, or be seen in the wrong order. The Java Memory Model says when visibility is guaranteed: through locks, <code>volatile</code> fields, starting and joining threads, and other "happens-before" links.`,

"CompletableFuture: composing async work without blocking":
`Instead of waiting for a slow call to finish, you describe what to do when it finishes. <code>thenApply</code> changes the result, <code>thenCompose</code> starts the next async call, <code>thenCombine</code> merges two results, and <code>allOf</code> waits for many. Your thread stays free to do other work in the meantime.`,

"Deadlock, livelock and starvation — causes, detection and prevention":
`<b>Deadlock</b>: threads wait for each other forever. <b>Livelock</b>: threads keep reacting to each other but never make progress. <b>Starvation</b>: one thread never gets a turn. Prevention: take locks in a fixed order, use timeouts with retries and a little randomness, and use fair locks or well-sized pools.`,

"Implement a thread-safe token bucket rate limiter":
`A token bucket controls how often something may happen. It holds a number of tokens and refills at a steady speed; each request uses one token, and requests with no token left are refused. A full bucket allows short bursts while the refill speed sets the long-term limit. Making the "refill, then take" step <code>synchronized</code> keeps it correct across threads.`,

"Read this thread dump: why is the service stuck?":
`A thread dump is a snapshot of what every thread is doing at one moment. When a service is running but not responding, take a few dumps a few seconds apart and look for threads stuck in the same place: a deadlock (Java names it for you), many threads waiting for a database connection, or many threads waiting on one slow external call.`,

"What is the difference between a process and a thread?":
`A process is a running program with its own separate memory, like a whole restaurant. A thread is one worker inside that process, sharing its memory with the other threads, like cooks sharing a kitchen. Threads are cheaper to create and can share data easily, which is also why they need care when sharing.`,

"What are the states in a thread's lifecycle?":
`A thread is <b>NEW</b> before it starts, <b>RUNNABLE</b> while it is running or ready to run, <b>BLOCKED</b> while waiting to get a lock, <b>WAITING</b> or <b>TIMED_WAITING</b> while waiting for a signal or a timer, and <b>TERMINATED</b> when it has finished.`,

"start() vs run() — what happens if you call run() directly?":
`<code>start()</code> creates a new thread and runs your code on it. Calling <code>run()</code> directly is just a normal method call: the code runs on the current thread and nothing happens in parallel. Always call <code>start()</code>, or better, submit the task to an ExecutorService.`,

"Runnable vs Callable vs Future":
`A <b>Runnable</b> is a task that runs and returns nothing. A <b>Callable</b> is a task that returns a result and may throw an error. A <b>Future</b> is the receipt you get when you submit a task: you use it later to get the result, wait for it, or cancel the task.`,

"What is synchronized? Method-level vs block-level, instance vs class lock":
`<code>synchronized</code> means only one thread at a time can run the protected code, and it also makes changes visible to the next thread. On an instance method it locks that object; on a static method it locks the whole class; a synchronized block locks whatever object you name, and only around the lines you choose.`,

"What does volatile do, and what does it NOT do?":
`<code>volatile</code> makes sure every thread always sees the latest value of a field, and stops reads and writes around it being reordered. It does <b>not</b> make combined actions like <code>count++</code> safe, because reading, adding and writing can still interleave between threads. Use it for simple flags such as "stop now".`,

"What is a race condition, and what is the difference from a data race?":
`A <b>race condition</b> is any bug where the result depends on the timing of threads, for example two threads both checking "is the seat free?" and both booking it. A <b>data race</b> is a narrower technical term: two threads touch the same variable, at least one writes, and nothing orders them. Fixing data races does not automatically fix race conditions.`,

"wait(), notify(), notifyAll() — how do they work and why must they be in a loop?":
`<code>wait()</code> makes a thread release a lock and sleep until another thread calls <code>notify()</code> (wakes one) or <code>notifyAll()</code> (wakes all). A thread can sometimes wake up without a real reason, or wake up after another thread has already used up the condition, so always re-check the condition in a <code>while</code> loop after waking.`,

"What is a deadlock? How do you detect and prevent it?":
`A deadlock is when two or more threads each hold something the other needs and all wait forever. You can spot it in a thread dump, where Java reports "Found one Java-level deadlock". Prevent it by always taking locks in the same order, using <code>tryLock</code> with a timeout, or holding fewer locks at a time.`,

"Explain the ExecutorService and thread pool parameters":
`A pool has a <b>core size</b> (threads it keeps), a <b>maximum size</b>, a <b>queue</b> for waiting tasks, a <b>keep-alive time</b> for extra idle threads, and a <b>rejection policy</b> for when everything is full. The surprising rule: extra threads beyond the core are only created once the queue is full.`,

"What is the Java Memory Model and happens-before?":
`It is the set of rules for when one thread is guaranteed to see what another thread did. Without them, values can be cached or reordered and a change might never show up elsewhere. "Happens-before" links, such as unlocking then locking the same lock or writing then reading a volatile field, are what give you that guarantee.`,

"Atomic classes and CAS — how does AtomicInteger work without locks?":
`AtomicInteger uses a CPU instruction called compare-and-swap: "if the value is still 5, change it to 6; otherwise tell me it failed". To increment, it reads the value, tries to swap in value plus one, and simply tries again if another thread got there first. No thread ever has to wait on a lock.`,

"ReentrantLock vs synchronized — when do you need the explicit lock?":
`Use plain <code>synchronized</code> by default; it is simple and releases itself even if an error happens. Choose <code>ReentrantLock</code> when you need something extra: try to get the lock and give up after a timeout, stop waiting when interrupted, fair first-come-first-served order, or several separate wait conditions.`,

"CompletableFuture — how do you compose asynchronous calls?":
`You link async steps together like a pipeline: <code>thenApply</code> to transform a result, <code>thenCompose</code> when the next step is itself an async call, <code>thenCombine</code> to merge two independent calls, and <code>allOf</code> to wait for many at once. Add timeouts and error handling so one slow call does not hang everything.`,

"What are CountDownLatch, CyclicBarrier, Semaphore and Phaser?":
`They are ready-made coordination tools. <b>CountDownLatch</b>: wait until N things have happened, once. <b>CyclicBarrier</b>: N threads wait for each other, and it can be reused. <b>Semaphore</b>: allow at most N threads into a section at a time. <b>Phaser</b>: a flexible barrier where the number of threads can change between phases.`,

"What are virtual threads (Project Loom) and when do they help?":
`Virtual threads are very lightweight threads managed by Java itself rather than the operating system, so you can have millions. They help most when tasks spend their time waiting for databases or web services: while one waits, the real thread underneath runs another. They do not make heavy calculations any faster.`,

"How would you implement a thread-safe singleton?":
`A singleton is a class with only one instance. The simplest thread-safe ways are an <code>enum</code> with one value, or a static field created when the class loads. If it must be created lazily, use the "holder class" trick, or double-checked locking with a <code>volatile</code> field.`,

"What is ThreadLocal and what is its danger?":
`<code>ThreadLocal</code> gives each thread its own private copy of a variable, which is handy for things like the current user or request id. The danger is in thread pools: threads are reused, so if you forget to clear the value with <code>remove()</code>, the next request can see the previous user's data and memory can leak.`,

"What is the ForkJoinPool and work stealing?":
`A ForkJoinPool is built for "divide and conquer" work: split a big task into smaller ones, solve them in parallel, then combine the results. Each thread keeps its own list of tasks; when a thread runs out, it "steals" work from a busy thread's list, so all CPU cores stay busy. Parallel streams use it behind the scenes.`,

"How do you handle exceptions in threads and executors?":
`An error inside a thread does not reach the code that started it. With <code>execute()</code>, the error is printed by the thread's default handler. With <code>submit()</code>, it is stored in the Future and only appears when you call <code>get()</code>, so if you never call it, the error is silently lost. Catch and log errors inside your tasks.`,

"What is the difference between concurrency and parallelism?":
`<b>Concurrency</b> is dealing with many tasks at once by switching between them, like one cook managing several dishes. <b>Parallelism</b> is actually doing many tasks at the same instant, like several cooks each making a dish. Concurrency is about structure; parallelism needs several CPU cores.`,

"How do you stop a thread gracefully? Why is stop() deprecated?":
`Ask it to stop instead of forcing it: interrupt the thread or set a <code>volatile</code> "stop" flag, and have the thread check it and finish cleanly. <code>Thread.stop()</code> was removed because it killed a thread at any random point, releasing its locks halfway through updating data and leaving that data broken.`,

"Explain the producer-consumer problem and implement it three ways":
`Producers create work and consumers process it at different speeds, so they need a shared buffer and a way to wait. The three classic solutions: <code>wait()</code>/<code>notifyAll()</code> with a shared list, a <code>ReentrantLock</code> with separate "not full" and "not empty" conditions, or simply a <code>BlockingQueue</code>, which is the one to use in real code.`,

"You see high CPU in production on a Java service. How do you find the cause?":
`First find which threads are using the CPU, with a tool such as <code>top -H</code>. Then take a few thread dumps and look up those threads to see exactly which code they are running. The usual culprits are an infinite loop, heavy garbage collection, a slow regular expression, or a busy-wait loop.`
});
