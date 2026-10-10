registerSimple("design-patterns", {
"Design a rate limiter class (LLD)":
`Define a simple <code>RateLimiter</code> interface with a method like <code>tryAcquire(clientId)</code>, so the algorithm (token bucket, sliding window) can be swapped. Keep one limiter per client in a thread-safe map, make the check-and-update step atomic, and use a clock you can control in tests.`,

"Design a notification service with multiple channels (LLD)":
`Create a <code>Notifier</code> interface with one implementation per channel (email, SMS, push), so adding WhatsApp later is just a new class (Strategy pattern). A service picks the right notifier for each message, and wrappers add retries and logging (Decorator). User preferences decide which channels to use.`,

"What is the Adapter pattern and how do you use it for third-party integrations?":
`An adapter converts someone else's interface into the one your code expects, like a travel plug adapter. For a payment provider, you define your own <code>PaymentGateway</code> interface and write an adapter that translates it into the provider's library calls. Your code never depends on the provider directly, so switching providers only changes the adapter.`,

"Design an LRU cache from scratch (LLD)":
`An LRU cache removes the least recently used item when full. To make both lookup and "move to most recent" fast, combine a hash map (to find an item instantly) with a doubly linked list (to keep the usage order and move items cheaply). On every get or put, move the item to the front; when full, remove the item at the back.`,

"What is the Specification pattern and when is it useful?":
`A specification is a business rule written as a small object, such as "customer is premium" or "order is over ₹1000", that can be checked and combined with AND, OR and NOT. It keeps rules in one place instead of copying the same condition across code, and some frameworks can turn them into database queries.`,

"Design a parking lot's pricing and reservation module (LLD follow-up)":
`Put pricing behind a <code>PricingStrategy</code> interface so hourly, flat-rate or weekend pricing can be swapped. Store money as whole paise, decide rounding rules explicitly, and handle reservations so two cars cannot book the same spot at once, using a lock or an atomic database update.`,

"What is the Null Object pattern and other ways to avoid null checks?":
`Instead of returning null and making every caller check for it, return a harmless "do nothing" object, for example a NoDiscount that always gives 0% off. Other ways to avoid null checks: return an empty list instead of null, use <code>Optional</code> for "might not exist", and validate inputs early.`,

"Design a URL shortener class structure (LLD)":
`Main pieces: a <code>ShortCodeGenerator</code> interface (counter-based or hash-based, swappable), a repository that stores code-to-URL mappings and refuses duplicates, and a service that ties them together and handles custom aliases and expiry. Keep each class focused on one job.`,

"What is the Circuit Breaker pattern implemented from scratch?":
`A circuit breaker has three states. <b>Closed</b>: calls pass through and failures are counted. <b>Open</b>: after too many failures, calls fail immediately for a while. <b>Half-open</b>: after the wait, a few test calls are allowed; if they succeed it closes again, otherwise it reopens. This stops your app hammering a broken service.`,

"What is the Object Pool pattern and is it still relevant in Java?":
`An object pool keeps a set of expensive objects ready for reuse instead of creating new ones every time. In modern Java, creating ordinary objects is very cheap, so pooling them usually does not help. It still makes sense for genuinely expensive resources, such as database connections and threads.`,

"Design an audit logging system (LLD)":
`Record who did what and when for important actions, without scattering logging calls everywhere: use an annotation plus an aspect that captures the user, action, time and changes automatically. Write audit records reliably (in the same transaction as the change), never allow them to be edited, and keep sensitive data out of them.`,

"Design a chess or tic-tac-toe game (LLD round)":
`Model the board, pieces, players and game state as classes. Give each piece type its own movement rules (Strategy or polymorphism), record moves as objects so you can undo and replay them (Command pattern), and keep the game's status (playing, check, finished) explicit. Keep rules out of the user interface code.`,

"Design a library management system (LLD round)":
`Key classes: Book (the title), BookCopy (each physical copy), Member, Loan and Reservation. Separating Book from BookCopy is the important modelling idea, because loans are of copies, not titles. Add rules for borrowing limits, due dates, fines and reservations.`,

"Design a vending machine (LLD round)":
`A vending machine behaves differently depending on its state: idle, has money, dispensing, out of stock. The State pattern gives each state its own class that handles actions (insert coin, choose item, cancel) in its own way. This avoids a tangle of true/false flags and makes illegal actions impossible.`,

"What is the difference between a Facade and a Mediator?":
`A <b>Facade</b> gives one simple entry point to a complicated subsystem, such as a single "place order" method that calls stock, payment and shipping. A <b>Mediator</b> sits between several objects so they talk through it instead of directly to each other, like an air traffic controller between planes.`,

"How do you implement the Observer pattern without memory leaks?":
`With the Observer pattern, a subject keeps a list of listeners to notify. If listeners are never removed, the subject keeps them, and everything they reference, in memory forever. Always unsubscribe when a listener is finished, tie subscriptions to a lifecycle, or use weak references.`,

"Design a logging framework (LLD round)":
`Main parts: a Logger that checks the log level first (so disabled messages cost nothing), appenders that send output to the console, a file or the network (Strategy), formatters for the layout, and asynchronous writing so logging does not slow the application down.`,

"Design a parking lot — the classic low-level design round":
`Start by clarifying requirements: floors, vehicle types, pricing, entry and exit gates. Then model ParkingLot, Floor, Spot (with sizes), Vehicle, Ticket and Payment. Use strategies for spot allocation and pricing, and make spot assignment safe when two cars arrive at the same time.`,

"Explain the Builder pattern and when it beats a constructor":
`A Builder creates an object step by step: <code>new Pizza.Builder().size(12).cheese(true).build()</code>. It beats a constructor when there are many parameters, especially optional ones or several of the same type, because each value is named and the object can be checked once at the end. For two or three required parameters, a constructor is clearer.`,

"Design a rate-limited notification service — combining patterns":
`Combine several patterns: Strategy for each channel (email, SMS, push), a Decorator to add rate limiting and retries around any channel, a Factory or registry to pick channels, and a queue so sending happens in the background. The point is choosing the right pattern for each separate concern.`,

"Design an elevator system":
`Model Elevator, Floor and Request, plus a controller that assigns requests to elevators. The interesting part is the scheduling strategy: an elevator keeps moving in its current direction, serving requests along the way, before reversing, like a lift actually behaves. Put that strategy behind an interface so it can be changed.`,

"What are the anti-patterns — and when does a pattern make things worse?":
`Anti-patterns are common bad designs: a "god class" that does everything, entities with no logic, copy-pasted code, and deep inheritance trees. A pattern makes things worse when it adds layers and classes for flexibility nobody needs. Simple, direct code is better than an unnecessary pattern.`,

"Design an expense-sharing app like Splitwise (LLD round)":
`Model users, groups, expenses and splits. Each way of splitting a bill (equally, by exact amounts, by percentage) is a Strategy. Keep a running balance per person, store money in whole paise, and to settle up, repeatedly match the person who owes the most with the person owed the most.`,

"Design a movie ticket booking system like BookMyShow (LLD round)":
`The real challenge is that two people must never book the same seat. Model shows and a seat-per-show record with a status (available, held, booked). Hold seats for a few minutes during payment, change their status with atomic updates (all-or-nothing), and release the hold if payment fails or times out.`,

"What are the categories of design patterns?":
`The classic book "Design Patterns" (the "Gang of Four") groups 23 patterns into three families. <b>Creational</b>: how objects are made (Builder, Factory, Singleton). <b>Structural</b>: how objects are combined (Adapter, Decorator, Facade, Proxy). <b>Behavioural</b>: how objects interact (Strategy, Observer, State, Command).`,

"Explain the Singleton pattern and its problems":
`A Singleton makes sure a class has only one instance, reachable from anywhere. The problems: it is effectively a global variable, so it hides dependencies, makes testing hard (every test shares it), and needs care with multiple threads. In Spring apps, let the framework create one shared bean instead.`,

"Factory Method vs Abstract Factory vs Builder":
`<b>Factory Method</b>: one method decides which single class to create. <b>Abstract Factory</b>: creates a whole family of related objects that must match, such as all the buttons and menus for one theme. <b>Builder</b>: assembles one complex object step by step. Choose by whether the problem is "which type", "which family" or "how to assemble".`,

"Explain the Strategy pattern with a real example":
`The Strategy pattern puts each version of an algorithm in its own class behind one interface, so you can switch between them. Example: discount rules for festival, member and coupon discounts, each a class implementing <code>DiscountRule</code>. The checkout applies whichever rules apply, and a new rule is just a new class.`,

"What is the Observer pattern and where is it used in Java/Spring?":
`One object (the subject) keeps a list of others (observers) and notifies them all when something happens, without knowing who they are. Spring's application events work this way: publish "order placed" and every <code>@EventListener</code> for it runs. UI button click listeners are another example.`,

"Explain Decorator vs Proxy vs Adapter — they all wrap an object":
`All three wrap another object; the purpose differs. A <b>Decorator</b> adds behaviour while keeping the same interface (logging, retries). A <b>Proxy</b> controls access with the same interface (lazy loading, security, remote calls). An <b>Adapter</b> changes one interface into a different one, so mismatched pieces fit together.`,

"What is the Builder pattern and when do you need it?":
`A Builder lets you create an object by setting values one at a time with named methods, then calling <code>build()</code>. You need it when a constructor would have many parameters, especially optional ones, which leads to confusing calls with lots of nulls. Lombok's <code>@Builder</code> can generate one for you.`,

"What is the Repository pattern and how does it relate to DAO?":
`Both hide database code behind an interface. A <b>DAO</b> is close to the database, usually one per table. A <b>Repository</b> is closer to the business, behaving like a collection of business objects (such as Orders) that you add to and search. Spring Data's repositories follow the repository style.`,

"Explain the Chain of Responsibility pattern":
`A request is passed along a line of handlers, and each handler either deals with it or passes it on. Examples: Spring Security's filter chain, where each filter checks one thing, or approval steps where a manager, then a director, then the CFO approve depending on the amount. Handlers can be added or reordered easily.`,

"What is Dependency Injection and how is it a pattern?":
`Dependency injection means a class receives the things it needs from outside, usually through its constructor, instead of creating them itself. It is a pattern because it is a reusable way to keep classes loosely connected and easy to test: you can pass in a fake in tests and the real thing in production.`,

"What is the Command pattern and where is it useful?":
`The Command pattern wraps a request as an object, such as a "PlaceOrderCommand". Because it is an object, it can be queued, logged, retried, scheduled or undone. Examples: an undo feature in an editor, jobs in a queue, and messages processed from Kafka.`,

"How would you design a parking lot system? (LLD)":
`Clarify requirements first (floors, vehicle sizes, pricing, gates), then model ParkingLot, Floor, Spot, Vehicle, Ticket and Payment. Use strategies for choosing a spot and for pricing, and handle the tricky part: two cars must never get the same spot, so assigning a spot must be thread-safe.`,

"Design an elevator system (LLD)":
`Model elevators, floors and requests, and a scheduler that assigns each request to an elevator. Avoid serving requests strictly in arrival order; instead an elevator keeps going in one direction, stopping for requests along the way, then reverses (like the SCAN disk algorithm). Keep the scheduler swappable behind an interface.`,

"What is the State pattern? Design an order state machine":
`The State pattern gives an object one class per status, each handling actions in its own way. An order can be Placed, Paid, Shipped, Delivered or Cancelled; "cancel" is allowed when Placed but refused once Shipped. Each state class decides what is allowed and what the next state is, instead of one huge if/else.`,

"What is the Facade pattern and when do you use it?":
`A Facade provides one simple interface to a complicated set of classes. A <code>CheckoutFacade.placeOrder()</code> might hide calls to stock, pricing, payment and shipping. Use it to make a complex subsystem easy to use; the underlying classes still exist for anyone who needs more control.`,

"Which patterns do you actually use day to day, and which do you avoid?":
`Used constantly: dependency injection, Strategy (swappable rules and providers), Builder (complex objects), Decorator and Proxy (through Spring features like transactions), Observer (events) and Template Method (JdbcTemplate). Usually avoided: hand-written Singletons, deep inheritance, and patterns added "just in case".`
});
