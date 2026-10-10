registerSimple("java-oop", {
"What is the Open/Closed Principle in practice — show a refactor":
`Working code should not need editing every time you add a feature. If adding "XML export" forces you to change a big if/else that already handles PDF and CSV, you might break PDF. Instead, give each format its own class behind a shared interface, so a new format is just one new class and the old ones are never touched.`,

"What is the difference between association and dependency? Explain coupling types":
`Association means one class keeps a lasting link to another, usually as a field (an Order holds its Customer). Dependency is a weaker, short-lived use, such as receiving an object as a method parameter. "Coupling" is how much one class relies on another's details; the less it relies on them, the easier both are to change.`,

"What is the Interface Segregation Principle and how does it show up in real code?":
`Do not force a class to promise methods it cannot really do. If a "Printer" interface also demands <code>fax()</code> and <code>scan()</code>, a simple printer ends up with empty or error-throwing methods. Split big interfaces into small, focused ones so each class only promises what it actually supports.`,

"What is a value object versus an entity in domain modelling?":
`An <b>entity</b> has an identity that stays the same even as its details change: a customer is still the same customer after changing address. A <b>value object</b> is defined only by its values: two ₹100 amounts are interchangeable. Entities are compared by id; value objects are compared by all their fields and are usually immutable.`,

"How do you refactor a god class?":
`A "god class" is one huge class that does everything, so every change touches it and risks breaking something. You fix it step by step, not all at once: first add tests that lock in its current behaviour, then move one responsibility at a time into a new, focused class, checking the tests after each move.`,

"What is the difference between inheritance of implementation and inheritance of interface?":
`Inheriting an interface means promising to behave like something (a CardPayment promises to be a Payment); that is safe and is what polymorphism needs. Inheriting implementation means reusing a parent's actual code; that ties you to the parent's internal details, so a change in the parent can quietly break the child.`,

"What is method chaining and the fluent interface pattern?":
`Method chaining means each method returns an object so you can call the next method straight away: <code>builder.name("A").age(30).build()</code>. A "fluent" API is designed this way so the code reads almost like a sentence. Java's Streams and builders work like this.`,

"How would you design a class to be extensible without inheritance?":
`Instead of making people subclass your class to change its behaviour, let them pass the varying part in. For example, a report class can accept a "formatter" object or function in its constructor. This keeps your class closed and stable, while still letting users plug in their own behaviour.`,

"What are the common OOP mistakes you see in code review?":
`The usual ones: classes that only hold data while all the logic sits elsewhere, handing out internal lists that callers can secretly change, setters for everything so rules cannot be enforced, deep inheritance trees used just to share code, and huge classes that do too many jobs.`,

"Explain the Builder vs Factory vs Prototype decision":
`They answer different questions about creating objects. A <b>Factory</b> decides <em>which</em> class to create based on input. A <b>Builder</b> helps you create one complicated object step by step when it has many optional settings. A <b>Prototype</b> creates a new object by copying an existing one.`,

"What is composition over inheritance in a Spring application specifically?":
`In Spring, instead of building a shared "BaseService" parent class that all services extend, give each service the helpers it needs as injected fields (a notifier, an auditor). This keeps services independent and easy to test. For things like logging and transactions, Spring already provides annotations and aspects, so you do not need a base class.`,

"Design a class hierarchy for a payment system — walk through your reasoning":
`Start with a small <code>Payment</code> interface that every payment method implements (card, UPI, wallet), instead of a deep chain of parent classes. Shared behaviour like retries or logging goes into separate helper objects. Then adding a new payment provider means adding one class, without editing the others.`,

"What is the difference between tight coupling and loose coupling — show a refactor":
`Tightly coupled code creates its own helpers directly (<code>new MySqlDatabase()</code>), so it is stuck with them and hard to test. Loosely coupled code receives what it needs through an interface, so you can swap a real database for a fake one in tests, or change providers, without editing the class.`,

"Explain the Liskov Substitution Principle with the Rectangle-Square problem":
`A child class must work everywhere its parent works, without surprises. A Square seems like a kind of Rectangle, but if code sets a rectangle's width to 5 and height to 10 and expects an area of 50, a Square (which keeps both sides equal) gives the wrong answer. So Square should not extend a changeable Rectangle.`,

"How do you make a class immutable, and why does the interviewer ask this?":
`An immutable object can never change once created. The recipe: make the class final, make every field private and final, provide no setters, and copy any mutable inputs (such as lists) both when they come in and when you hand them out. Interviewers ask because it tests whether you know how objects can leak changes.`,

"What is the difference between aggregation and composition in code?":
`Both mean "has a", but differ in ownership. In <b>composition</b> the part cannot live without the whole: delete an order and its order lines go too. In <b>aggregation</b> the part lives independently: a team has players, but players still exist if the team is disbanded.`,

"Can a constructor be private? Give three real use cases":
`Yes. A private constructor stops other code from creating objects with <code>new</code>. It is used for utility classes that should never be created, for singletons that allow only one instance, and to force people to use named factory methods like <code>Money.of(100)</code> that can validate input.`,

"What is method chaining vs method cascading, and how do you design a fluent API?":
`Chaining calls a method on whatever the previous call returned. Cascading calls several methods on the same object one after another. A good fluent API makes required steps impossible to skip (often by returning different types at each step), keeps the order natural, and finishes with a clear final call such as <code>build()</code>.`,

"How would you prevent a class from being subclassed, and what are the alternatives?":
`Mark it <code>final</code>, and nobody can extend it. Alternatively, make all constructors private and offer factory methods. Since Java 17 you can also use <code>sealed</code>, which allows only a specific list of child classes. Closing classes by default protects them from changes they were not designed for.`,

"Explain the Open/Closed principle failing in real code — how do you detect it?":
`The warning sign is code you keep editing for every new feature: a switch or if/else on a type that grows a new branch each time, or <code>instanceof</code> checks deciding behaviour. Each edit risks breaking existing cases. The fix is to move each branch into its own class behind a common interface.`,

"What is an interface with a single abstract method used for, and how has it changed?":
`An interface with exactly one abstract method is called a <b>functional interface</b>. Since Java 8 you can supply its implementation with a short lambda, like <code>x -&gt; x * 2</code>, instead of writing a whole class. Common examples are <code>Runnable</code>, <code>Comparator</code> and <code>Function</code>.`,

"Why must you override hashCode whenever you override equals?":
`HashMap and HashSet use <code>hashCode()</code> to decide where to store and look for an object, and only then use <code>equals()</code>. If two objects are equal but have different hash codes, the collection looks in the wrong place and treats them as different. So equal objects must always produce the same hash code.`,

"Abstract class or interface — how do you choose, and what changed in Java 8+?":
`Use an interface to describe what a class can do; a class can implement many interfaces. Use an abstract class when related classes share fields and common code; a class can extend only one. Since Java 8, interfaces can also contain default methods with code, which makes interfaces the usual first choice.`,

"What is composition over inheritance, and when does inheritance genuinely break?":
`Composition means a class uses other objects to do work ("has a"), rather than extending a parent ("is a"). Inheritance breaks when the child depends on hidden details of the parent: a famous example is a counting HashSet that double-counts because the parent's <code>addAll()</code> calls <code>add()</code> internally. Composition avoids this because you only use the public behaviour.`,

"Explain method overloading versus overriding, and the rules Java uses to resolve them":
`<b>Overloading</b> is several methods with the same name but different parameters in one class; Java picks one when compiling, based on the argument types. <b>Overriding</b> is a child class replacing a parent's method with the same signature; Java picks the version when the program runs, based on the real object.`,

"Why should you favour immutability, and how do you make a class properly immutable?":
`Objects that never change are simpler: they are safe to share between threads, safe to use as map keys, and cannot be changed by surprise somewhere else. To build one: final class, private final fields, no setters, and defensive copies of any mutable objects passed in or handed out.`,

"What is the Law of Demeter, and how do you spot a violation?":
`"Only talk to your direct friends." A method should use its own fields, its parameters and objects it creates, not reach through a chain like <code>order.getCustomer().getAddress().getCity()</code>. Long chains of dots mean your code depends on many classes' internals, so a change anywhere in the chain breaks it.`,

"Model a bank account so that invalid states are impossible":
`Do not give the account a public <code>setBalance()</code>. Instead give it actions with rules built in: <code>deposit()</code> rejects zero or negative amounts, <code>withdraw()</code> refuses to go below zero. If every way to change the account checks the rules, the account can never end up in a broken state.`,

"Why do equals() and inheritance fight? Walk through the Point and ColorPoint problem":
`If a ColorPoint (a point with a colour) extends Point and changes <code>equals()</code> to compare colours too, you get strange results: a Point may say it equals a ColorPoint while the ColorPoint says it does not. You cannot add a field in a subclass and keep equals fair in both directions. The usual fix is to use composition (a ColorPoint has a Point) or records.`,

"What are the four pillars of OOP? Give a one-line real example of each.":
`<b>Encapsulation</b>: a bank account protects its balance. <b>Abstraction</b>: you call <code>pay()</code> without knowing how payment works. <b>Inheritance</b>: a SavingsAccount builds on Account. <b>Polymorphism</b>: the same <code>pay()</code> call runs card or UPI logic depending on the object.`,

"Encapsulation vs abstraction — they sound the same, what is the difference?":
`Abstraction is about <b>what you show</b>: a simple interface with only the useful actions. Encapsulation is about <b>what you protect</b>: hiding the data inside so it can only be changed safely. A car's pedals are the abstraction; the locked engine compartment is the encapsulation.`,

"Method overloading vs overriding":
`Overloading means the same method name with different parameters in the same class, chosen when the code is compiled. Overriding means a child class giving its own version of a parent's method with the same signature, chosen when the program runs based on the real object.`,

"What is dynamic method dispatch and how does the JVM implement it?":
`When you call a method on a variable of the parent type, Java runs the version belonging to the object's real class. That decision happens at run time and is called dynamic dispatch. The JVM makes it fast by keeping a lookup table of method addresses for each class, so it just reads the right slot.`,

"Explain each SOLID principle with a concrete violation and fix":
`SOLID is five design rules. <b>S</b>: one class, one job. <b>O</b>: add features without editing working code. <b>L</b>: a child must work wherever its parent works. <b>I</b>: keep interfaces small. <b>D</b>: depend on interfaces, not concrete classes. Together they make code easier to change and test.`,

"Composition vs inheritance — which should you prefer and why?":
`Prefer composition. With composition a class uses other objects through their public methods, so you can swap them and changes stay contained. Inheritance couples a child to its parent's internal details, and Java allows only one parent anyway. Use inheritance only for a genuine "is a kind of" relationship.`,

"What is an association, aggregation and composition relationship?":
`They describe how strongly objects are connected. <b>Association</b>: two objects simply know about each other (a teacher and a student). <b>Aggregation</b>: one object holds others that can live on their own (a department and its professors). <b>Composition</b>: the parts belong only to the whole and die with it (a house and its rooms).`,

"What is polymorphism in practice — where have you actually used it?":
`Polymorphism means one interface with many implementations, chosen at run time. Real examples: different discount rules each implementing a <code>DiscountRule</code> interface, or email, SMS and push notifiers implementing a <code>Notifier</code> interface. The calling code just loops over them and calls the same method.`,

"What is the Liskov Substitution Principle really testing?":
`It tests whether a child class keeps the parent's promises, not just whether the code compiles. A child must not demand more (rejecting inputs the parent accepted), deliver less (breaking a guarantee such as "the result is sorted"), or throw surprising new errors. If it does, code written for the parent breaks.`,

"How do you design a class as thread-safe and immutable at the same time?":
`Make it immutable: all fields final and set only in the constructor, no setters, the class final, and copies of any mutable inputs. An object that never changes cannot be corrupted by two threads at once, so it needs no locks at all. That is the simplest form of thread safety.`,

"What is loose coupling and high cohesion?":
`<b>High cohesion</b>: each class has one clear purpose and everything in it relates to that purpose. <b>Loose coupling</b>: classes depend on each other as little as possible, usually through interfaces. Together they mean you can change one part of the system without breaking others.`,

"What is the difference between IS-A and HAS-A, and when does 'is-a' mislead you?":
`IS-A is inheritance (a Car is a Vehicle); HAS-A is composition (a Car has an Engine). "Is a" can mislead when something is true in everyday language but not in behaviour: a Square is a Rectangle in maths, but it cannot be used everywhere a changeable Rectangle is expected, so inheritance there causes bugs.`,

"What are constructors, constructor chaining and constructor overloading?":
`A constructor sets up a new object. <b>Overloading</b> means having several constructors with different parameters. <b>Chaining</b> means one constructor calls another, with <code>this(...)</code> for the same class or <code>super(...)</code> for the parent, so setup code is not repeated.`,

"When would you use an abstract class over an interface in real design?":
`Choose an abstract class when related classes need to share fields (state) or a fixed sequence of steps where only some steps differ, known as the Template Method pattern. If you only need to describe a capability, an interface is better, because a class can implement many interfaces but extend only one class.`,

"What are covariance, contravariance and invariance in Java?":
`These describe whether a container of a child type counts as a container of the parent type. Arrays are covariant (a String[] can be used as an Object[], which can fail at run time). Generic lists are invariant (a <code>List&lt;String&gt;</code> is not a <code>List&lt;Object&gt;</code>). Wildcards (<code>? extends</code>, <code>? super</code>) give you flexibility safely.`,

"Explain the Law of Demeter (principle of least knowledge)":
`A method should only talk to its close collaborators: its own fields, its parameters and objects it creates, not the friends of those objects. Writing <code>a.getB().getC().doThing()</code> means your code knows the inside structure of B and C. Ask A to do the work instead, so internal changes do not ripple out.`,

"What is method hiding vs method overriding — predict the output":
`A static method in a child class with the same signature as the parent's does not override it; it hides it. Java then picks the method based on the variable's declared type, not the real object. Normal instance methods are overridden, so the real object's version runs. Fields also follow the declared type.`,

"How do you achieve multiple inheritance of behaviour in Java?":
`Java does not let a class extend two classes, but a class can implement many interfaces, and since Java 8 those interfaces can contain default methods with real code. You can also combine behaviour through composition: hold several helper objects and use each one.`,

"What is the Template Method pattern and where does Spring use it?":
`A parent class defines the fixed steps of a process, and child classes fill in only the steps that differ. The parent controls the order so it cannot be broken. Spring's <code>JdbcTemplate</code> works this way: it handles opening connections, error handling and closing, and you only supply the SQL and how to read each row.`,

"What is 'programming to an interface' and what problem does it solve?":
`Write <code>List&lt;String&gt; names = new ArrayList&lt;&gt;()</code> instead of using ArrayList as the type everywhere. Code that depends only on the interface can switch to a different implementation, accept test fakes, and does not expose internal choices to its callers.`,

"How do you design an extensible class hierarchy that will not rot in two years?":
`Keep hierarchies shallow, make classes final unless they are designed to be extended, prefer interfaces and composition, and use <code>sealed</code> types when the set of subclasses is fixed. Deep inheritance chains become fragile, because a change near the top affects everything below it.`,

"What is object cloning and why do experienced developers avoid Cloneable?":
`<code>clone()</code> is Java's built-in way to copy an object, but it is awkward and error-prone: it skips constructors, makes shallow copies by default, and the <code>Cloneable</code> interface does not even declare the method. Most developers use a copy constructor or a static factory such as <code>Order.copyOf(other)</code> instead.`,

"Explain the Strategy vs State vs Command patterns — they look identical":
`All three use an interface with interchangeable implementations, but for different purposes. <b>Strategy</b>: choose an algorithm, such as a discount rule. <b>State</b>: an object changes its behaviour as its status changes, such as an order moving from placed to shipped. <b>Command</b>: wrap an action as an object so it can be queued, logged or undone.`,

"What is the difference between an object's identity, state and behaviour?":
`<b>Identity</b> is what makes an object this particular one (two identical-looking orders are still different orders). <b>State</b> is its current data, the values in its fields. <b>Behaviour</b> is what it can do, its methods.`,

"What is an anti-pattern? Name the ones you have removed from real code.":
`An anti-pattern is a common way of writing code that seems reasonable but causes problems later. Typical ones: the god class that does everything, entities with no logic, using plain strings and numbers where a small type would be clearer, and copy-pasted code. Naming them helps a team recognise and fix them.`
});
