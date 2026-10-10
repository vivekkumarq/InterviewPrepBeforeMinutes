registerSimple("typescript", {
"What are conditional types, infer and template literal types?":
`They let you calculate new types from existing ones. A <b>conditional type</b> works like an if statement for types: <code>T extends string ? "text" : "other"</code>. <b>infer</b> pulls a type out of another, such as the value inside a Promise. <b>Template literal types</b> build string types, such as <code>"on" + Capitalize&lt;Event&gt;</code> giving <code>"onClick"</code>.`,

"How do you type an API client and handle unknown data safely?":
`TypeScript cannot check data that arrives while the app runs, so writing <code>as Order</code> just trusts it blindly. Treat responses as <code>unknown</code> and validate them with a schema library such as Zod, which checks the real data and gives you a correct type. Then a wrong API response fails clearly at the boundary instead of deep in your code.`,

"What is the difference between unknown, any, never and void?":
`<b>any</b> turns off type checking completely. <b>unknown</b> means "some value we have not checked yet" and must be narrowed before use, so it is the safe choice. <b>never</b> means a value that can never exist, such as the return type of a function that always throws. <b>void</b> means a function returns nothing useful.`,

"How do modules, imports and tree-shaking work in modern JavaScript?":
`ES modules use <code>import</code> and <code>export</code> to share code between files. Because imports are fixed at build time, bundlers can see exactly what is used and drop everything else from the final file; that is <b>tree-shaking</b>. Dynamic <code>import()</code> loads a module only when needed, which is used for lazy loading.`,

"What is the prototype chain and how does class inheritance work in JavaScript?":
`Every JavaScript object has a hidden link to another object, its prototype. When you read a property that is not on the object itself, JavaScript looks up this chain of prototypes. <code>class</code> and <code>extends</code> are a friendlier way to write this; underneath, methods live on prototype objects that instances share.`,

"What are the JavaScript memory management and garbage collection concepts?":
`JavaScript frees memory automatically. The garbage collector starts from "roots" (global variables and the current function calls), marks everything reachable from them, and frees the rest. Memory leaks happen when you accidentally keep things reachable: forgotten timers, event listeners never removed, growing caches, or closures holding large objects.`,

"What are the browser storage options and when do you use each?":
`<b>localStorage</b> keeps small data until it is cleared, such as preferences. <b>sessionStorage</b> keeps it only for one tab's session. <b>Cookies</b> are small and sent to the server with every request, which suits login sessions (with the HttpOnly flag). <b>IndexedDB</b> stores large amounts of structured data for offline apps.`,

"What is the difference between debouncing and throttling, and how do you implement both?":
`<b>Debounce</b> waits until events stop for a moment, then runs once, for example searching only after the user stops typing. <b>Throttle</b> runs at most once per time interval no matter how many events fire, for example handling scroll events every 100 ms. Both are built with timers that remember when the function last ran or was scheduled.`,

"How does async iteration, generators and backpressure work in JavaScript?":
`A generator function (<code>function*</code>) produces values one at a time, pausing between them. An async generator can wait for data, such as fetching page after page of results, and <code>for await</code> loops over it. Because the next item is only produced when the loop asks for it, a slow consumer naturally slows the producer down; that is backpressure.`,

"What are the TypeScript compiler options that matter and how do you configure a project?":
`The most important is <code>"strict": true</code>, which turns on null checks and other safety rules. <code>noUncheckedIndexedAccess</code> makes <code>arr[i]</code> possibly undefined, which matches reality. Also set the JavaScript version to output (<code>target</code>), the module system (<code>module</code>, <code>moduleResolution</code>) and which files to include, all in <code>tsconfig.json</code>.`,

"How does type narrowing work, and how do you model state with discriminated unions?":
`Narrowing is TypeScript following your checks, such as <code>typeof</code>, <code>in</code> or comparisons, to know the exact type inside each branch. A <b>discriminated union</b> gives each state a shared label field, such as <code>status: "loading" | "success" | "error"</code>, so checking the label tells TypeScript exactly which fields exist, and impossible combinations cannot be created.`,

"Explain generics with constraints, conditional types and mapped types":
`<b>Generics</b> let code work with any type while remembering which one. A <b>constraint</b> limits that, such as <code>T extends { id: string }</code>. <b>Conditional types</b> choose a type based on a condition. <b>Mapped types</b> build a new type by transforming every property of another, which is how <code>Partial</code> and <code>Readonly</code> are made.`,

"What is the difference between an interface and a type alias, and when do you use each?":
`Both can describe object shapes. A <code>type</code> can also name unions, tuples and simple types, such as <code>type Status = "on" | "off"</code>. An <code>interface</code> can be extended and reopened to add fields, which libraries use. A common rule: use <code>interface</code> for object shapes and <code>type</code> for everything else; consistency matters more than the choice.`,

"How do you type an API response safely — and why is a type assertion not enough?":
`A type assertion (writing <code>as User</code>) only tells the compiler to trust you; it does not check the real data. If the API changes, the wrong data spreads through your app silently. Validate at the boundary with Zod or a similar library: it checks the actual response at runtime and gives you a matching type.`,

"Explain the JavaScript event loop, microtasks and macrotasks":
`JavaScript runs one piece of code at a time. When the current code finishes, the event loop first runs all <b>microtasks</b> (promise callbacks and code after <code>await</code>), then takes one <b>macrotask</b> (a timer, a click or a network event), and repeats. That is why a resolved promise's callback always runs before a <code>setTimeout(..., 0)</code> callback.`,

"Explain closures, this binding, and prototypal inheritance":
`A <b>closure</b> is a function that remembers the variables from where it was created, even after that outer function has finished. <b>this</b> depends on how a function is called, not where it is written (arrow functions keep the surrounding <code>this</code>). <b>Prototypal inheritance</b> means objects look up missing properties on a chain of linked prototype objects.`,

"How do you validate external data at the TypeScript boundary?":
`Types disappear when the code runs, so data from APIs, forms, URLs, local storage or environment variables is not checked automatically. Validate it once, where it enters your app, with a schema library such as Zod or Valibot. After that check passes, the rest of your code can fully trust the types.`,

"Explain async/await, promise combinators and error handling in JavaScript":
`<code>async</code>/<code>await</code> lets you write asynchronous code that reads top to bottom, with <code>try</code>/<code>catch</code> for errors. Combinators run several promises together: <code>Promise.all</code> waits for all and fails if any fails; <code>allSettled</code> waits for all and reports each result; <code>race</code> takes the first to finish; <code>any</code> takes the first to succeed.`,

"Work through what 'this' refers to in each of these five cases":
`<code>this</code> is decided by how a function is called, checked in this order: with <code>new</code>, it is the new object; with <code>call</code>, <code>apply</code> or <code>bind</code>, it is whatever you passed; called as <code>obj.method()</code>, it is <code>obj</code>; called as a plain function, it is undefined (in strict mode). Arrow functions have no <code>this</code> of their own and use the surrounding one.`,

"Predict the output of this event loop puzzle, and explain the ordering":
`Normal (synchronous) code runs first, top to bottom. Next, all microtasks run: promise callbacks and code after <code>await</code>, in the order they were queued. Only then do macrotasks such as <code>setTimeout</code> callbacks run, one at a time, each followed by any new microtasks. Apply those three rules in order and any such puzzle can be solved.`,

"Take this loosely typed function and tighten it step by step":
`Replace <code>any</code> with real types for the inputs and the return value, use union types for limited options such as <code>"asc" | "desc"</code>, add generics so the function keeps track of what type goes in and comes out, and handle null cases explicitly. Each step lets the compiler catch more mistakes for you.`,

"What is TypeScript and what does it give you over JavaScript?":
`TypeScript is JavaScript plus types, compiled into plain JavaScript. It catches mistakes such as typos, wrong arguments and possible nulls while you write code, gives much better autocomplete, and makes large codebases safer to change. The types are removed when compiling, so there is no runtime cost and no runtime checking.`,

"What is the difference between interface and type?":
`Both describe object shapes. <code>interface</code> can be extended and can be declared again to add more fields (declaration merging). <code>type</code> can also describe unions, tuples and simple types, and combines types with <code>&amp;</code>. For plain objects either works; pick one style and use it consistently.`,

"Explain generics with a real example":
`A generic is a type placeholder that is filled in when used. <code>function first&lt;T&gt;(items: T[]): T</code> works for any array and returns the same type that went in: give it numbers and you get a number back, give it users and you get a user back. Without generics you would lose that information or write a copy for each type.`,

"What are utility types and which do you use?":
`Utility types create new types from existing ones. <code>Partial&lt;T&gt;</code> makes every field optional (useful for updates), <code>Pick</code> and <code>Omit</code> select or remove fields, <code>Record&lt;K, V&gt;</code> describes a dictionary, <code>Readonly</code> prevents changes, and <code>ReturnType</code> gets a function's return type. Deriving types keeps them in sync automatically.`,

"What are union types, discriminated unions and type narrowing?":
`A <b>union type</b> means "one of these", such as <code>string | number</code>. A <b>discriminated union</b> is a union of objects that share a label field, such as <code>kind: "circle" | "square"</code>. <b>Narrowing</b> is TypeScript using your checks on that label (or <code>typeof</code>) to know exactly which type you have inside each branch.`,

"What is strict mode and what does strictNullChecks do?":
`<code>"strict": true</code> switches on TypeScript's safety checks. The most important, <code>strictNullChecks</code>, means <code>null</code> and <code>undefined</code> are no longer allowed everywhere: a value that might be missing must be handled before use. This catches the very common "cannot read property of undefined" error at compile time.`,

"Explain the JavaScript event loop":
`JavaScript runs one task at a time on a single thread. Slow work such as network requests and timers happens elsewhere, and when it finishes, its callback waits in a queue. The event loop picks queued callbacks to run whenever the current code finishes, always running promise callbacks (microtasks) before timers and events (macrotasks).`,

"Explain closures with a practical example":
`A closure is a function that remembers variables from where it was created. <code>function counter() { let n = 0; return () =&gt; ++n; }</code> returns a function that keeps its own private <code>n</code>, which increases each time you call it, and no other code can reach <code>n</code>. Closures are used for private state, callbacks and event handlers.`,

"What is the difference between var, let and const?":
`<code>var</code> is limited to the whole function and can be used before its line (as undefined), which causes bugs. <code>let</code> and <code>const</code> are limited to the block <code>{ }</code> they are in, and using them before their line is an error. <code>const</code> cannot be reassigned, though an object it holds can still be changed. Use <code>const</code> by default and <code>let</code> when you must reassign.`,

"How does 'this' work in JavaScript?":
`<code>this</code> is set by how a function is called. Called as <code>obj.method()</code>, it is <code>obj</code>. Called with <code>new</code>, it is the new object. With <code>call</code>, <code>apply</code> or <code>bind</code>, it is what you pass. As a plain function, it is undefined in strict mode. Arrow functions use the <code>this</code> from the surrounding code, which is why they suit callbacks.`,

"What are promises, async/await, and how do you handle errors?":
`A promise represents a result that will arrive later: it either succeeds (resolves) or fails (rejects). <code>await</code> pauses an <code>async</code> function until the promise settles, and errors are caught with <code>try</code>/<code>catch</code>. Note that <code>fetch</code> only rejects on network failure, so you must check <code>response.ok</code> for errors such as 500.`,

"What are the key ES6+ features you use daily?":
`Common ones: <code>let</code> and <code>const</code>, arrow functions, template strings, destructuring (<code>const { name } = user</code>), the spread operator (<code>...</code>), default parameters, modules, classes, promises and async/await, optional chaining (<code>user?.address?.city</code>) and nullish coalescing (<code>??</code>), which only falls back on null or undefined, unlike <code>||</code>.`,

"What is the difference between == and ===, and how does type coercion work?":
`<code>===</code> checks that values are equal without converting types, so <code>1 === "1"</code> is false. <code>==</code> converts types first, following confusing rules, so <code>0 == ""</code> and <code>null == undefined</code> are both true. Always use <code>===</code>; the one common exception is <code>x == null</code> to check for both null and undefined.`,

"What are decorators and how are they used in Angular/NestJS?":
`A decorator is a function written with <code>@</code> above a class, method or property that adds information or behaviour to it. Angular uses <code>@Component</code> and <code>@Injectable</code> to tell the framework what a class is; NestJS uses <code>@Controller</code> and <code>@Get</code> to define routes, much like Spring's annotations in Java.`
});
