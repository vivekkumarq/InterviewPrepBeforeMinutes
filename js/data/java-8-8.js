registerSimple("java-8", {
"What is the difference between Stream.of, Arrays.stream and Collection.stream?":
`They are three ways to start a stream. <code>list.stream()</code> streams an existing collection. <code>Arrays.stream(array)</code> streams an array, including arrays of plain numbers. <code>Stream.of(a, b, c)</code> streams the values you list. The trap: <code>Stream.of(intArray)</code> gives a stream with one item (the whole array), so use <code>Arrays.stream</code> for number arrays.`,

"How do you handle checked exceptions inside a lambda?":
`The standard lambda types (like Function) are not allowed to throw checked exceptions such as IOException, so code that throws one will not compile inside <code>map</code>. You can catch it inside the lambda and wrap it in an unchecked exception, write a small helper that does this wrapping, or use a plain loop when proper error handling matters.`,

"What is Collectors.groupingBy with downstream collectors — show three levels":
`<code>groupingBy</code> splits items into groups by a key, like employees by department. A "downstream" collector then decides what to do with each group: count it, sum it, find the highest, or group it again (for example by department, then by city). The result is a map from each key to that summary.`,

"What is the difference between Optional.map and Optional.flatMap?":
`Both transform the value inside an Optional. Use <code>map</code> when your function returns a plain value. Use <code>flatMap</code> when your function itself returns an Optional; otherwise you end up with an Optional inside an Optional. The same map-versus-flatMap idea applies to streams.`,

"What are the primitive streams and when do they matter?":
`<code>IntStream</code>, <code>LongStream</code> and <code>DoubleStream</code> work directly with plain numbers instead of Integer objects. That avoids creating millions of small objects and is much faster for number-heavy work. They also give you handy methods such as <code>sum()</code>, <code>average()</code> and <code>range()</code>.`,

"How does Stream.sorted() behave and what is a stable sort here?":
`<code>sorted()</code> sorts items, either in natural order or with a Comparator you give it. It is "stable", meaning items that compare as equal keep their original order. It also has to see every item before it can output the first one, so on a huge or endless stream it can be slow or never finish.`,

"What is a functional interface with generics and how do you design a good one?":
`A functional interface has one method to fill in, so it can be written as a lambda. Adding generics (like <code>&lt;T&gt;</code>) lets it work with any type. Good design: first check whether a built-in one (Function, Predicate, Supplier, Consumer) already fits, and only create your own when a clear name makes the code easier to understand.`,

"What is the CompletableFuture equivalent of Promise.all and how do you handle timeouts?":
`<code>CompletableFuture.allOf(...)</code> waits until all the async tasks you give it have finished, like Promise.all in JavaScript. Then you collect each result. Add <code>orTimeout</code> or <code>completeOnTimeout</code> so one slow task cannot make you wait forever.`,

"What are the Java 8 date/time formatting and parsing APIs?":
`<code>DateTimeFormatter</code> turns dates into text and text back into dates, using patterns like <code>"dd-MM-yyyy"</code>. Unlike the old SimpleDateFormat, it is safe to share between threads. Watch the letter case: <code>MM</code> is month but <code>mm</code> is minutes, and <code>yyyy</code> is the normal year while <code>YYYY</code> is a different "week year".`,

"How do you convert between collections, arrays and streams?":
`List to stream: <code>list.stream()</code>. Array to stream: <code>Arrays.stream(arr)</code>. Stream back to a list: <code>.toList()</code> or <code>.collect(Collectors.toList())</code>. Stream to array: <code>.toArray(String[]::new)</code>. One trap: <code>.toList()</code> gives a list you cannot change.`,

"What is the Stream.peek() operation and why should you avoid it?":
`<code>peek()</code> lets you look at each item as it passes through a stream, usually for debugging. The problem is that Java may skip it entirely, for example when <code>count()</code> can work out the answer without visiting items, or when the stream never runs. So never put important work inside <code>peek()</code>.`,

"What are the Java 21 pattern matching and record patterns?":
`Pattern matching lets you check a type and pull out its data in one step, instead of checking with instanceof and then casting. Record patterns go further and unpack a record's fields directly inside a <code>switch</code>, like <code>case Circle(double r) -&gt; ...</code>. Combined with sealed types, the compiler warns you if you forget a case.`,

"How do you use Optional correctly with Streams and collections?":
`Use Optional as a method's return type when there may be no result. Do not use it for fields, method parameters, or inside collections, and never wrap a list in an Optional; just return an empty list. When you have a stream of Optionals, <code>flatMap(Optional::stream)</code> keeps only the ones that hold values.`,

"What are the Java 9+ collection and stream API additions worth knowing?":
`Later Java versions added handy shortcuts: <code>List.of</code>, <code>Set.of</code> and <code>Map.of</code> for quick unchangeable collections, <code>takeWhile</code> and <code>dropWhile</code> on streams, <code>Stream.toList()</code>, and extra Optional methods such as <code>ifPresentOrElse</code>. Watch out that the new lists and <code>toList()</code> results cannot be changed.`,

"How do you write a parallel stream correctly and measure whether it helps?":
`<code>.parallel()</code> splits the work across CPU cores, but splitting and merging have a cost. It only pays off for large amounts of data with real work per item, with no shared changing state and no waiting on files or networks. Always measure with a proper benchmark before and after, because it is often slower for small lists.`,

"Given a list of employees, group by department and find the highest paid in each":
`Group the employees by department with <code>groupingBy</code>, and for each group pick the one with the maximum salary using <code>maxBy</code> with a salary Comparator. That gives a map from each department to its top earner. <code>collectingAndThen</code> can unwrap the Optional that maxBy returns.`,

"What is the difference between Collection.stream().forEach() and Collection.forEach()?":
`<code>list.forEach(...)</code> is a simple loop over the collection, with no extra setup and a guaranteed order. <code>list.stream().forEach(...)</code> builds a stream pipeline first, and its order is not guaranteed in parallel. If you just want to loop, use the collection's own forEach.`,

"How do you flatten a list of lists and a Map of lists using Streams?":
`If you have a list of lists and want one flat list, use <code>flatMap(List::stream)</code>: it turns each inner list into a stream and joins them all into one. <code>map</code> would give you a stream of lists instead. For a map of lists, stream its values and flatMap them the same way.`,

"What is the difference between Stream.map and Stream.peek in terms of guarantees?":
`<code>map</code> transforms every item that flows through, and its result is used, so it reliably runs. <code>peek</code> only looks at items and its result is thrown away, so Java is allowed to skip it in some cases. Use map for real work and keep peek for debugging only.`,

"How do you convert a List to a Map and handle duplicate keys?":
`Use <code>Collectors.toMap(keyFn, valueFn)</code>. If two items produce the same key, it throws an error unless you add a third argument that says which value to keep, such as <code>(first, second) -&gt; first</code>. It also crashes on null values, which a normal HashMap would accept.`,

"Explain lazy evaluation and short-circuiting in Streams with a measurable example":
`"Lazy" means stream steps do nothing until a final operation asks for results, and then items go through all steps one at a time. "Short-circuiting" means operations like <code>findFirst</code>, <code>anyMatch</code> or <code>limit</code> stop as soon as they have the answer. Together they mean a stream can skip most of a huge list.`,

"What are the Collectors you would actually use in production code?":
`The everyday ones: <code>toList</code>, <code>toSet</code> and <code>toMap</code> to build collections, <code>groupingBy</code> to group, <code>partitioningBy</code> to split into true and false, <code>joining</code> to build one string, <code>counting</code> and <code>summingInt</code> for totals, and <code>collectingAndThen</code> to tidy up the final result.`,

"How does Optional help avoid NullPointerException, and where does it not?":
`Optional makes "there might be no value" visible in a method's return type, so callers are reminded to handle the empty case. But it does not magically remove nulls: calling <code>get()</code> on an empty Optional still crashes, and an Optional variable can itself be null. Use <code>orElse</code>, <code>map</code> and <code>ifPresent</code>, not <code>get()</code>.`,

"Write a custom functional interface and use it with a lambda and method reference":
`Declare an interface with exactly one abstract method and mark it <code>@FunctionalInterface</code>, for example <code>Validator</code> with <code>boolean validate(String s)</code>. You can then pass either a lambda (<code>s -&gt; !s.isBlank()</code>) or a method reference to an existing method with the same shape (<code>MyRules::isEmail</code>).`,

"What are the most useful Collectors, and how do you write a custom one?":
`Collectors decide how a stream's items become a final result: a list, a map, a count, a joined string. When none fits, you can write your own by saying how to create an empty container, how to add one item, how to merge two containers (for parallel streams), and how to produce the final result.`,

"How does Optional work, and what are the rules for using it well?":
`Optional is a box that either contains a value or is empty. Read it safely with <code>orElse</code>, <code>orElseGet</code>, <code>orElseThrow</code>, <code>map</code> or <code>ifPresent</code>. Rules: use it mainly as a return type, never return null instead of an Optional, and avoid <code>get()</code>. Note that <code>orElse</code> always evaluates its argument, while <code>orElseGet</code> only runs when needed.`,

"When should you use a parallel stream, and when does it make things worse?":
`Parallel streams help with large amounts of data where each item needs real calculation and items are independent. They make things worse for small lists, for work that waits on files or networks, for sources that split badly like LinkedList, and for code that changes shared data. Measure before switching.`,

"What are records, sealed classes and pattern matching — and when do you use them?":
`<b>Records</b> are short classes that just hold data. <b>Sealed classes</b> fix the exact list of allowed subclasses. <b>Pattern matching</b> lets <code>switch</code> and <code>instanceof</code> check a type and unpack it in one go. Together they are ideal for modelling a fixed set of cases, such as different shapes or payment results.`,

"What are Stream gatherers, and what problem do they solve?":
`Before Java 24 you could not easily write your own middle step for a stream, so things like "group items in windows of 3" or "running totals" were awkward. Gatherers let you add custom intermediate steps, and Java ships ready-made ones such as <code>windowFixed</code> and <code>windowSliding</code>.`,

"How do you avoid the common Stream API performance mistakes?":
`Common slowdowns: using streams on tiny lists inside hot loops, boxing numbers instead of using IntStream, sorting before filtering, collecting to a list just to count it, and going parallel without measuring. Filter early, use primitive streams for numbers, and keep simple loops where they are clearer.`,

"Solve five everyday data tasks with streams: distinct by field, top N per group, index, chunk, running total":
`These are tasks streams do not do directly. Distinct by a field: build a map keyed by that field. Top N per group: group, then sort and limit each group. Working with an index: stream the numbers 0 to n-1 instead. Chunks: slice the list with <code>subList</code>. Running totals: a simple loop is clearer than any stream trick.`,

"Build a validation pipeline by composing Predicate and Function":
`Predicates (yes/no checks) can be combined with <code>and</code>, <code>or</code> and <code>negate</code>, and Functions can be chained with <code>andThen</code>. So you can build small, named checks such as "has email" and "is adult", then combine them into one validator, and add new rules without making one huge method.`,

"What are the major features introduced in Java 8?":
`Java 8 brought lambdas (passing behaviour as a value), the Stream API (processing collections as pipelines), Optional (a safer alternative to null), default methods in interfaces, method references, and the new <code>java.time</code> date and time library. It changed how most modern Java code is written.`,

"What is a lambda expression and what is a functional interface?":
`A lambda is a short, unnamed function: <code>(a, b) -&gt; a + b</code>. A functional interface is an interface with exactly one method to implement, such as <code>Comparator</code> or <code>Runnable</code>. Wherever Java expects a functional interface, you can pass a lambda instead of writing a whole class.`,

"Name the built-in functional interfaces in java.util.function":
`The main ones: <b>Function</b> (takes a value, returns a value), <b>Predicate</b> (takes a value, returns true or false), <b>Consumer</b> (takes a value, returns nothing), <b>Supplier</b> (takes nothing, returns a value), plus two-argument versions like BiFunction and number-specific ones like IntPredicate.`,

"What is a Stream? How is it different from a Collection?":
`A collection stores data, like a box of items. A stream processes data, like a conveyor belt the items travel along. A stream does not keep the items, does nothing until a final step asks for a result, and can only be used once.`,

"Intermediate vs terminal operations — list the common ones":
`Intermediate operations are the middle steps and do not run on their own: <code>filter</code>, <code>map</code>, <code>flatMap</code>, <code>sorted</code>, <code>distinct</code>, <code>limit</code>. Terminal operations finish the stream and produce a result: <code>collect</code>, <code>toList</code>, <code>forEach</code>, <code>count</code>, <code>reduce</code>, <code>findFirst</code>, <code>anyMatch</code>.`,

"map() vs flatMap()":
`<code>map</code> turns each item into exactly one new item: a list of names into a list of name lengths. <code>flatMap</code> turns each item into several items and joins them all into one stream: a list of orders into one stream of all their products.`,

"Explain Collectors — groupingBy, partitioningBy, joining, toMap":
`<code>groupingBy</code> sorts items into groups by a key. <code>partitioningBy</code> splits them into exactly two groups, true and false. <code>joining</code> glues strings together with a separator. <code>toMap</code> builds a map, and needs a rule for what to do if two items produce the same key.`,

"What is Optional and how should it be used properly?":
`Optional is a container that holds either one value or nothing, used as a return type to say "this might not find anything". Use it by giving a default (<code>orElse</code>), transforming it (<code>map</code>) or acting only if present (<code>ifPresent</code>). Avoid it for fields and parameters, and avoid calling <code>get()</code>.`,

"How do method references work? What are the four kinds?":
`A method reference is a shortcut for a lambda that just calls one existing method. The four kinds: a static method (<code>Integer::parseInt</code>), a method on a specific object (<code>System.out::println</code>), a method on whichever object is passed in (<code>String::length</code>), and a constructor (<code>ArrayList::new</code>).`,

"When should you use a parallel stream — and when should you not?":
`Use it for large data sets where each item needs real calculation and items do not depend on each other. Avoid it for small lists, for any work that waits on databases or networks, when order matters, or when your code changes shared variables. Parallel streams share one common thread pool, so a slow one can slow down others.`,

"Explain reduce() and its three overloads":
`<code>reduce</code> combines all items of a stream into one value, such as a total. One version takes a starting value and a combining rule (<code>reduce(0, Integer::sum)</code>). One has no starting value and returns an Optional, because the stream may be empty. The third adds a way to merge partial results when running in parallel.`,

"What is the difference between reduce() and collect()?":
`<code>reduce</code> builds a new value at each step and suits simple combinations like sums or the maximum. <code>collect</code> adds items into a container such as a list or map, which is far more efficient for building collections. Use reduce for numbers, collect for collections.`,

"What is the new java.time API and why replace Date and Calendar?":
`The old <code>Date</code> and <code>Calendar</code> classes could be changed after creation, were not safe across threads, and had odd rules (January was month 0). <code>java.time</code> fixed all of that with clear, immutable classes: <code>LocalDate</code> for dates, <code>LocalDateTime</code>, <code>ZonedDateTime</code> for time zones, and <code>Instant</code> for exact moments.`,

"What is the difference between findFirst() and findAny(), anyMatch and allMatch?":
`<code>findFirst</code> returns the first matching item in order; <code>findAny</code> returns any match, which can be faster in parallel. <code>anyMatch</code> answers "does at least one item match?", <code>allMatch</code> answers "do all items match?". All of them stop as soon as they know the answer.`,

"How do you create streams? What is an infinite stream?":
`Streams come from collections (<code>list.stream()</code>), arrays (<code>Arrays.stream</code>), values (<code>Stream.of</code>), number ranges (<code>IntStream.range</code>) or generators. An infinite stream, made with <code>Stream.iterate</code> or <code>Stream.generate</code>, has no end, so you must limit it with something like <code>limit(10)</code>.`,

"What are default and static methods on interfaces, and why were they added?":
`A default method is a method with a body inside an interface; classes get it automatically but can override it. They were added so Java could give existing interfaces like Collection new methods (such as <code>stream()</code>) without breaking every class already implementing them. Static methods on interfaces are just helper methods that belong to the interface.`,

"What arrived in Java 9 through 21 that you actually use?":
`The most useful later additions: <code>List.of</code> and <code>Map.of</code> (Java 9), <code>var</code> (10), the built-in HTTP client (11), text blocks and switch expressions (around 14 and 15), records (16), sealed classes (17), and virtual threads plus pattern matching in switch (21).`,

"How do you write a custom Collector?":
`A Collector needs five parts: how to create an empty container, how to add one item to it, how to merge two containers (for parallel streams), how to turn the container into the final result, and a few flags describing its behaviour. <code>Collector.of(...)</code> lets you supply these as lambdas.`,

"What are records and where do they fit in a Spring service?":
`A record is a short way to write a class that only holds data; Java generates the constructor, getters, <code>equals</code>, <code>hashCode</code> and <code>toString</code>. In a Spring service they are ideal for request and response objects (DTOs) and configuration values. They are usually not suitable as JPA entities, which need to be changeable.`,

"Explain lazy evaluation in streams with an example that proves it":
`If you put print statements inside <code>filter</code> and <code>map</code> and add no final step, nothing prints at all. With <code>findFirst()</code>, you see each item go through filter and map one at a time, and printing stops as soon as the first match is found. That proves the stream is lazy and processes items one by one.`,

"Convert this imperative code to streams — and say when you would not":
`Many loops become shorter as a stream: filter what you want, transform it, collect the result. But keep the loop when you need to break out early on complicated conditions, work with indexes across two lists, handle checked exceptions, or when the loop is simply clearer to read.`
});
