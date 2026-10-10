registerSimple("java-basics", {
"What is the difference between primitive and reference types?":
`A primitive variable (like <code>int age = 30</code>) holds the value itself. A reference variable (like <code>String name</code>) holds only the <b>address</b> of an object that lives somewhere else in memory. It is the difference between writing a number on a sticky note and writing a house address on it. Because of this, references can be <code>null</code> (no address) and <code>==</code> on them compares addresses, not contents.`,

"Explain widening, narrowing and implicit type conversion":
`Widening means moving a value into a <b>bigger</b> type, like pouring a cup of water into a bucket: <code>int</code> to <code>long</code> always fits, so Java does it for you. Narrowing means squeezing a value into a <b>smaller</b> type, like pouring a bucket into a cup: some of it can spill. Java makes you write a cast such as <code>(int) 3.9</code> to show you accept that, and the result can lose data (here it becomes 3).`,

"Why should you use BigDecimal for money instead of double?":
`A <code>double</code> stores numbers in binary, and many everyday decimals like 0.1 cannot be stored exactly in binary, so tiny errors creep in (0.1 + 0.2 gives 0.30000000000000004). For money, even a tiny error is wrong. <code>BigDecimal</code> stores decimal numbers exactly and makes you choose how to round, so ₹10.10 stays ₹10.10.`,

"What is the difference between an interface constant, enum and static final field?":
`All three give you fixed values, but an <b>enum</b> is the safest choice for a fixed set of options like order statuses. With plain number constants, nothing stops someone passing 7 where a status is expected. An enum only allows the values you listed, can carry extra data and behaviour, and works well with <code>switch</code>. Constants on an interface are considered bad style today.`,

"How does the switch statement work, and what changed with switch expressions?":
`A <code>switch</code> picks one block of code based on a value, like a menu. The old form "falls through" to the next case if you forget <code>break</code>, which causes bugs. The newer switch expression (with <code>-&gt;</code>) never falls through, can return a value directly, and the compiler warns you if you forgot a case for an enum.`,

"What are varargs and what are the pitfalls?":
`Varargs (<code>int... nums</code>) lets a method accept any number of arguments, so you can call <code>sum(1, 2)</code> or <code>sum(1, 2, 3, 4)</code>. Behind the scenes Java packs them into an array. The pitfalls: it must be the last parameter, it can make overloaded methods ambiguous, and passing <code>null</code> passes a null array rather than one null item.`,

"What is the difference between an Error, Exception and RuntimeException in practice?":
`All three are problems that can be "thrown" while a program runs. An <b>Error</b> means the JVM itself is in trouble (for example it ran out of memory), and you usually cannot recover. A <b>checked Exception</b> is an expected problem, like a missing file, that the compiler forces you to handle. A <b>RuntimeException</b> is usually a bug in the code, like using a null value.`,

"What is an immutable object and why are String, Integer and LocalDate immutable?":
`An immutable object can never change after it is created; any "change" gives you a new object instead. That makes it safe to share between threads, safe to use as a key in a map, and safe to cache and reuse. Java made common types like String immutable for exactly these reasons.`,

"What is the difference between shallow and deep comparison, and how do you compare arrays?":
`A shallow comparison checks whether two variables point to the very same object. A deep comparison checks whether two things contain equal values, including everything nested inside them. Arrays do not compare their contents with <code>equals()</code>, so <code>a.equals(b)</code> is only true for the same array. Use <code>Arrays.equals(a, b)</code>, or <code>Arrays.deepEquals</code> for arrays inside arrays.`,

"What are annotations and how do you write a custom one?":
`An annotation is a label you attach to code, such as <code>@Override</code> or <code>@Test</code>. On its own it does nothing; tools and frameworks read the label and act on it. You can write your own with <code>@interface</code>, and you choose whether the label is kept only for the compiler or is still readable while the program runs.`,

"What is reflection, when is it useful, and what does it cost?":
`Reflection lets a program look at classes, methods and fields at run time and call them by name, without knowing about them when the code was written. Frameworks like Spring and Hibernate depend on it to find your classes and fill in their fields. The costs: it is slower, the compiler cannot check it, and it can break the normal rules of encapsulation.`,

"Explain the Object class methods every Java developer should know":
`Every Java class quietly inherits from <code>Object</code>, which gives it a few basic methods. The important ones: <code>equals()</code> (are two objects equal in meaning?), <code>hashCode()</code> (a number used by hash-based collections), and <code>toString()</code> (a readable description for printing and logs). You usually override these three in your own classes.`,

"What is the output? Explain string pool behaviour with concatenation":
`Java keeps a "pool" of String literals so identical text written in your code is stored only once. Text that the compiler can work out ahead of time also goes into the pool. Text built while the program runs creates a new String object. So two Strings can hold the same words but be different objects, and <code>==</code> gives false while <code>equals()</code> gives true.`,

"What happens if you don't override hashCode but override equals? Show the impact":
`A HashMap first uses <code>hashCode()</code> to choose which "bucket" to look in, and only then uses <code>equals()</code> inside that bucket. If two equal objects have different hash codes, the map looks in the wrong bucket and never finds the entry. So if you override <code>equals()</code>, you must override <code>hashCode()</code> too, so equal objects give equal hash codes.`,

"Why is Java not 100% object oriented?":
`Because of the eight primitive types like <code>int</code> and <code>boolean</code>. They are plain values, not objects: they have no methods and cannot be null. Java kept them on purpose because they are much faster and use far less memory than objects. Wrapper classes such as <code>Integer</code> exist for when you do need an object.`,

"Explain the output of this integer caching and ternary puzzle":
`This puzzle combines a few surprises. Java keeps ready-made Integer objects for -128 to 127, so <code>==</code> seems to work for small numbers and then fails for bigger ones. <code>equals()</code> also cares about the type, so an Integer 127 is not equal to a Long 127. And the <code>? :</code> operator can quietly convert values between number types. The safe habit is to compare objects with <code>equals()</code> and keep types consistent.`,

"What is the difference between transient, volatile and static?":
`They do very different jobs. <code>transient</code> means "do not save this field when the object is serialised". <code>volatile</code> means "every thread must always see the latest value of this field". <code>static</code> means "this belongs to the class, so there is only one shared copy". They only look similar because they are all keywords you put on fields.`,

"Can you override a method to throw a different exception?":
`Partly. When a child class overrides a method, it may throw the same checked exceptions, narrower ones, or none at all, but never new or broader checked ones. The reason: code written for the parent class only prepared for the parent's exceptions, and a child must not surprise it. Unchecked (runtime) exceptions are not restricted.`,

"What is the difference between fail-fast and fail-safe, with a code example?":
`If you change a normal collection like an ArrayList while looping over it, the loop notices and stops immediately with a <code>ConcurrentModificationException</code>. That is "fail-fast": it fails loudly instead of giving wrong results. "Fail-safe" collections such as <code>CopyOnWriteArrayList</code> let you change them during a loop, usually by looping over a copy, so the loop may not see the newest changes.`,

"Explain the difference between an abstract class with all abstract methods and an interface":
`Even when every method is abstract, they are not the same. A class can extend only one abstract class but implement many interfaces. An abstract class can have a constructor and normal fields (state), while an interface cannot hold changing state. Use an interface to describe a capability, and an abstract class to share code and state between closely related classes.`,

"What is the output of this inheritance and initialisation order puzzle?":
`When you create an object of a child class, Java builds the parent part first, then the child part. Static blocks run once when a class is first loaded (parent first), and then for every new object the parent's constructor runs before the child's. The trap: if the parent's constructor calls a method the child overrides, the child's version runs before the child's fields are set, so it sees default values like null or 0.`,

"How does try-with-resources handle multiple resources and suppressed exceptions?":
`try-with-resources automatically closes files, connections and streams when the block ends, even if something fails. With several resources, it closes them in reverse order. If the main code fails and closing also fails, Java keeps the main error and attaches the closing error to it as "suppressed", so you see the real cause instead of losing it.`,

"What is the difference between Comparable and Comparator with a real sorting requirement?":
`<code>Comparable</code> is the one "natural" order a class defines for itself, like sorting employees by id. <code>Comparator</code> is a separate sorting rule you can create as many times as you like: by name, by salary, by department then salary. Use Comparable for the obvious default order, and Comparators for every other way of sorting.`,

"What is the difference between == and equals, and what happens with Integer caching?":
`<code>==</code> on objects asks "are these the same object?" while <code>equals()</code> asks "do they mean the same thing?". For numbers stored as Integer objects, Java reuses cached objects for -128 to 127, so <code>==</code> happens to work there and then fails for 128 and above. Always use <code>equals()</code> to compare objects.`,

"Explain the String pool, immutability, and why String is immutable":
`The String pool is a shared store where Java keeps one copy of each String literal, so identical text is not stored twice. Sharing is only safe because a String can never change. Immutability also keeps Strings safe for passwords, file paths and map keys, and lets the hash code be calculated once and reused.`,

"What are checked and unchecked exceptions, and how do you design exception handling?":
`Checked exceptions are problems the compiler makes you deal with, such as a file not being found; they are for things the caller can realistically recover from. Unchecked exceptions are usually programming mistakes, such as passing a bad argument. Good design: throw specific exceptions, catch them only where you can actually do something useful, and never hide them silently.`,

"How does pass-by-value work in Java, and what happens with objects and arrays?":
`Java always passes a copy into a method. For an object or array, the copy is of the <b>address</b>, so the method can change what is inside the object (and the caller sees it), but if the method points its copy at a new object, the caller's variable does not change.`,

"How do you handle money and decimals correctly in Java?":
`Never use <code>double</code> for money, because it cannot store values like 0.10 exactly. Either store money as a whole number of the smallest unit (paise or cents) in a <code>long</code>, or use <code>BigDecimal</code> with an explicit rounding rule. Most payment systems store whole paise or cents.`,

"How do you work with dates, times and time zones correctly?":
`Use the modern <code>java.time</code> classes. <code>Instant</code> is an exact moment (good for timestamps), <code>LocalDate</code> is just a date like a birthday, and <code>ZonedDateTime</code> is a date and time in a specific time zone. Store moments in UTC and only convert to a user's local time zone when you display them.`,

"What is the difference between an Error, a RuntimeException and a checked Exception in production?":
`In a live system: an <b>Error</b> (like running out of memory) means the JVM itself is failing, so log it and let the process restart. A <b>RuntimeException</b> usually means a bug, so catch it at the edge of the request, log it and return a clean error. A <b>checked Exception</b> is an expected failure, like a timeout, so handle it where you can retry or give a useful message.`,

"Integer overflow: predict the output, then make the code safe":
`An <code>int</code> has a maximum value (about 2.1 billion). If you go past it, Java does not raise an error; the number silently wraps around to a huge negative number, like a car's odometer rolling back to zero. To be safe, use <code>long</code> for big numbers, or methods like <code>Math.addExact</code> that throw an error instead of wrapping.`,

"Why is 0.1 + 0.2 not equal to 0.3, and how do you compare doubles correctly?":
`Computers store <code>double</code> values in binary, and 0.1 cannot be written exactly in binary, in the same way that 1/3 cannot be written exactly as a decimal (0.3333…). The tiny leftovers add up, so 0.1 + 0.2 becomes 0.30000000000000004. Compare doubles by checking whether they are "close enough" (within a small tolerance), and use <code>BigDecimal</code> for money.`,

"What makes Java platform independent?":
`The Java compiler does not produce code for a specific computer. It produces <b>bytecode</b>, a universal format. Every operating system has its own JVM that understands bytecode and runs it there. So the same compiled program runs on Windows, Mac and Linux without changes.`,

"Difference between JDK, JRE and JVM":
`The <b>JVM</b> is the engine that runs Java programs. The <b>JRE</b> is the JVM plus the standard libraries a program needs, so it is everything required to <em>run</em> Java. The <b>JDK</b> is the JRE plus the developer tools such as the compiler, so it is everything required to <em>write and build</em> Java. Developers install the JDK.`,

"Explain the main() method signature — why is every keyword there?":
`<code>public static void main(String[] args)</code> is the door the JVM uses to start your program. It is <b>public</b> so the JVM can reach it, <b>static</b> so it can be called before any object exists, <b>void</b> because it returns nothing to the JVM, and <b>String[] args</b> receives any words typed after the program name on the command line.`,

"Why are Java Strings immutable?":
`A String's characters can never be changed after it is created. This lets Java safely share one copy of the same text everywhere (the String pool), keeps values like passwords and file paths from being changed behind your back, makes Strings safe to use across threads, and lets Java calculate the hash code once and reuse it.`,

"String vs StringBuilder vs StringBuffer":
`A <code>String</code> cannot change, so joining Strings creates new objects each time. <code>StringBuilder</code> is a changeable text buffer, ideal for building text step by step, for example in a loop. <code>StringBuffer</code> is the older version of StringBuilder that is safe for multiple threads but slower. In everyday code, use StringBuilder.`,

"== vs equals() — and the contract with hashCode()":
`<code>==</code> checks whether two variables point to the very same object; <code>equals()</code> checks whether two objects mean the same thing. The rule that ties them to <code>hashCode()</code>: if two objects are equal, they must have the same hash code. Otherwise HashMap and HashSet cannot find them correctly.`,

"What is autoboxing, and what is the Integer cache gotcha?":
`Autoboxing is Java automatically wrapping a primitive <code>int</code> into an <code>Integer</code> object, and unboxing is the reverse. The gotcha: Java reuses Integer objects for -128 to 127, so <code>==</code> between two Integers looks correct for small numbers and then becomes false for larger ones. Compare Integers with <code>equals()</code>.`,

"Checked vs unchecked exceptions — when do you use each?":
`Use a <b>checked</b> exception when the caller can reasonably recover, for example "file not found, ask the user for another file"; the compiler then makes callers handle it. Use an <b>unchecked</b> exception for programming mistakes, such as an invalid argument, where the fix is to correct the code rather than to catch the error.`,

"try-catch-finally: does finally always run? What does try-with-resources add?":
`The <code>finally</code> block runs whether the code succeeds, fails, or even returns early, which makes it the place for clean-up. It only fails to run in extreme cases, such as the program being shut down. try-with-resources is a shorter, safer way to clean up: anything declared in its brackets is closed automatically.`,

"What is the difference between final, finally and finalize()?":
`They just sound alike. <code>final</code> means "cannot change": a final variable cannot be reassigned, a final method cannot be overridden, a final class cannot be extended. <code>finally</code> is the block after try/catch that always runs. <code>finalize()</code> was an old clean-up hook called before garbage collection; it is deprecated and should not be used.`,

"Pass by value or pass by reference — which is Java?":
`Java is always <b>pass by value</b>: a method receives a copy. For objects, that copy is a copy of the address. So the method can change the object's contents, but it cannot make the caller's variable point to a different object.`,

"Explain static keyword — variables, methods, blocks and nested classes":
`<code>static</code> means "belongs to the class, not to any one object". A static variable has one shared copy for the whole program. A static method can be called without creating an object. A static block runs once when the class is first loaded. A static nested class is a class inside another class that does not need an outer object.`,

"What are access modifiers and their visibility?":
`Access modifiers decide who can see a class member. <code>private</code>: only that class. No modifier (package-private): classes in the same package. <code>protected</code>: the same package plus child classes. <code>public</code>: everyone. A good habit is to start with private and open up only what others really need.`,

"Can you override a static or private method? What about main()?":
`No. A static method belongs to the class, so a child class can only <em>hide</em> it with its own version, not override it. A private method is invisible to child classes, so a method with the same name in the child is a completely separate method. <code>main</code> is static, so the same rule applies.`,

"What is the difference between an array and an ArrayList?":
`An array has a fixed size that you choose when you create it, and it can hold primitives like <code>int</code> directly. An ArrayList grows automatically as you add items, but only holds objects, so numbers get wrapped as Integer. Use an array when the size is fixed, and an ArrayList when it changes.`,

"Explain the this and super keywords":
`<code>this</code> means "the current object", and is often used to tell a field apart from a parameter with the same name (<code>this.name = name</code>). <code>super</code> means "the parent class part of this object", used to call the parent's constructor or the parent's version of a method you have overridden.`,

"What is a marker interface? Are they still used?":
`A marker interface is an empty interface with no methods, used only as a tag. For example, implementing <code>Serializable</code> tells Java "objects of this class may be saved to bytes". Today annotations usually do this job, but a few marker interfaces such as Serializable are still in use.`,

"What is the difference between deep copy and shallow copy?":
`A shallow copy creates a new outer object but shares the inner objects with the original, so changing an inner object affects both copies. A deep copy duplicates everything, inner objects included, so the two copies are completely independent.`,

"What are var, records, sealed classes and text blocks?":
`They are newer Java features that cut down on typing. <code>var</code> lets the compiler work out a local variable's type. A <b>record</b> is a short way to write a class that just holds data. A <b>sealed class</b> lists exactly which classes may extend it. A <b>text block</b> (three double quotes) lets you write multi-line text neatly.`,

"What is the difference between an abstract class and an interface (Java 8+)?":
`An interface describes what a class can do, and since Java 8 it can include default methods with code. An abstract class is a partly built class that can also hold fields and a constructor. A class can implement many interfaces but extend only one abstract class. Prefer interfaces; use an abstract class to share state and common code between close relatives.`,

"Explain the diamond problem and how Java handles it":
`The diamond problem happens when a class gets the same method from two parents and it is unclear which one to use. Java avoids it for classes by allowing only one parent class. With interfaces that have default methods, a method from a class wins over one from an interface, a more specific interface wins over a general one, and if it is still unclear, the compiler makes you choose.`,

"How does the String pool work, and what does intern() do?":
`The String pool is a shared store of unique Strings. Every literal written in your code goes into it automatically, so identical text is stored once. Strings built while the program runs are not added unless you call <code>intern()</code>, which returns the pooled copy (adding it first if needed). intern() is rarely needed in normal code.`,

"What is the object creation flow — what happens on 'new'?":
`When you write <code>new Person()</code>, Java first makes sure the Person class is loaded. Then it reserves memory for the object, fills every field with a default value (0, false, null), runs your field initialisers and constructor (parent first, then child), and finally gives you back a reference to the finished object.`,

"What is serialization? What role does serialVersionUID play?":
`Serialization turns an object into bytes so it can be saved to a file or sent over a network, and deserialization rebuilds it. <code>serialVersionUID</code> is a version number for the class. If the class that saved the bytes and the class that reads them have different version numbers, Java refuses to read them, so it should be set deliberately.`,

"Explain shallow immutability vs true immutability — how do you write a truly immutable class?":
`A class can look immutable (all fields final, no setters) but still be changeable if one of its fields is a mutable object, such as a list someone else can modify. To be truly immutable: make the class final, make all fields private and final, have no setters, and copy any mutable objects both when they come in and when they go out.`,

"What is the difference between throw and throws, and how do you design exceptions well?":
`<code>throw</code> is the statement that actually raises an error: <code>throw new IllegalArgumentException("bad id")</code>. <code>throws</code> goes in a method's signature to warn callers which checked exceptions might come out of it. Good design: throw specific exceptions with clear messages, and catch them only where you can handle them properly.`,

"What are generics, type erasure, and PECS?":
`Generics let you write <code>List&lt;String&gt;</code> so the compiler checks you only put Strings in. Type erasure means that after compiling, this type information is removed, so at run time it is just a List. PECS is a rule for wildcards: use <code>? extends</code> when you only read from a collection (it Produces), and <code>? super</code> when you only write to it (it Consumes).`,

"How does the ternary operator's unboxing cause a surprise NullPointerException?":
`In <code>cond ? a : b</code>, if one side is a primitive <code>int</code> and the other is an <code>Integer</code>, Java converts both to <code>int</code>. If the Integer side is null, that conversion crashes with a NullPointerException, on a line that looks like it only assigns a value. Keep both sides the same type to avoid it.`,

"What is the difference between an inner class, static nested class, local class and anonymous class?":
`They are all classes defined inside another class. A <b>static nested class</b> works on its own. An <b>inner class</b> is tied to an object of the outer class and can use its fields. A <b>local class</b> is defined inside a method. An <b>anonymous class</b> has no name and is created in one go, often for a quick one-off implementation.`,

"What does 'effectively final' mean and why do lambdas require it?":
`A variable is "effectively final" if it is never changed after it is first given a value, even without the word <code>final</code>. Lambdas can only use such variables, because the lambda takes a copy of the value and may run later, even after the method has finished. If the variable could still change, the copy and the original could disagree.`,

"How would you debug a production NullPointerException with no obvious cause?":
`Start with the error message: modern Java tells you exactly which value was null (for example "because the return value of getUser() is null"). Then read the full stack trace to find the line, work out where that value should have been set, and check recent changes and the input data. Fix the cause, and add a check so it fails with a clear message next time.`
});
