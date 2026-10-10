registerSimple("angular", {
"What is content projection and how do ng-content, ng-template and ng-container differ?":
`Content projection lets a parent put its own content inside a child component, like filling a card's body. <code>&lt;ng-content&gt;</code> marks where that content goes. <code>&lt;ng-template&gt;</code> defines a piece of template that is not shown until something renders it. <code>&lt;ng-container&gt;</code> groups elements without adding an extra HTML element to the page.`,

"How do custom directives and pipes work?":
`A <b>directive</b> adds behaviour to an existing element, for example highlighting it on hover or showing it only to admins. A <b>pipe</b> transforms a value for display in a template, such as <code>{{ price | currency }}</code>. Pure pipes only recalculate when their input changes, which makes them cheaper than calling a method in the template.`,

"How does Angular handle server-side rendering and hydration?":
`With server-side rendering, the server builds the page's HTML first, so users see real content immediately and search engines can read it. <b>Hydration</b> then lets Angular in the browser take over that existing HTML and make it interactive, instead of throwing it away and drawing everything again.`,

"What are the Angular security features you should know?":
`Angular automatically escapes values shown in templates, so user input cannot inject HTML or scripts, which prevents most cross-site scripting attacks. Avoid bypassing this with <code>bypassSecurityTrust...</code> functions unless you are sure the content is safe. Angular's HttpClient also supports CSRF tokens, but real security checks must always happen on the server.`,

"How do you structure a large Angular application?":
`Organise by feature (orders, profile, admin) rather than by type, with each feature in its own lazy-loaded folder. Keep shared UI components in a shared area and app-wide services in a core area. Keep components focused on display, and put business logic and data access into services.`,

"How do you handle errors globally in an Angular application?":
`Use a custom <code>ErrorHandler</code> to catch unexpected errors anywhere in the app, log them and show a friendly message. Use an HTTP interceptor to handle API errors in one place, such as redirecting to login on 401. Also handle the error that occurs when a lazy-loaded file is missing after a new deployment, by reloading the page.`,

"What is the difference between BehaviorSubject, Subject, ReplaySubject and a signal for state?":
`A <b>Subject</b> sends values only to current listeners. A <b>BehaviorSubject</b> holds a current value and gives it immediately to new listeners. A <b>ReplaySubject</b> replays several recent values to new listeners. A <b>signal</b> also holds a current value but is simpler: you read it like a function, and Angular updates the screen automatically with nothing to unsubscribe.`,

"How do you handle internationalisation and accessibility in Angular?":
`For <b>internationalisation</b>, mark text for translation with Angular i18n or a library such as Transloco, and use locale-aware pipes so dates, numbers and currencies display correctly for each language. For <b>accessibility</b>, use proper HTML elements, labels on form fields, keyboard navigation and visible focus, and ARIA attributes where needed.`,

"What are Angular's build optimisations and how do you analyse the bundle?":
`The production build compiles templates in advance, removes unused code, minifies everything and splits lazy-loaded routes into separate files. To find what makes the bundle large, build with source maps and use a tool such as source-map-explorer, then lazy-load or replace the heaviest parts.`,

"Explain Angular change detection and how OnPush actually works":
`Change detection is how Angular checks what changed and updates the page. By default, after any event or async operation, it checks every component. With <b>OnPush</b>, a component is checked only when its inputs change to a new object, an event happens inside it, an async pipe or signal it uses updates, or you ask explicitly. That skips a lot of unnecessary work.`,

"How do you handle HTTP errors, retries and loading state properly in Angular?":
`Use RxJS operators on the HTTP call: <code>retry</code> for temporary failures, <code>catchError</code> to turn an error into a friendly message or fallback value, and <code>finalize</code> to turn off the loading indicator. Place <code>catchError</code> inside <code>switchMap</code>, so one failed request does not stop the whole stream from working.`,

"What are standalone components, and how do you structure a modern Angular application?":
`Standalone components declare their own imports directly, so you no longer need NgModules to group things. Each component lists exactly what it uses, which makes dependencies clear and helps remove unused code. A modern app bootstraps a standalone root component and defines routes and providers in plain configuration files.`,

"How does Angular's dependency injection hierarchy work?":
`Angular has layers of injectors. A service provided in <code>root</code> has one instance shared by the whole app. A service provided on a lazy-loaded route has one instance for that feature. A service provided on a component gets a fresh instance for each copy of that component. When something is requested, Angular looks from the nearest layer upwards.`,

"Reactive forms vs template-driven — and how do you build a dynamic form with custom validation?":
`<b>Reactive forms</b> define the form's structure and validation in the component class, which is predictable and easy to test. <b>Template-driven forms</b> define them in the HTML, which is simpler for small forms. For dynamic forms, use reactive forms with <code>FormArray</code> to add fields at runtime, and write validators as small reusable functions.`,

"How do you optimise Angular bundle size and initial load performance?":
`Lazy-load routes so the first download contains only what the first screen needs, use standalone components so unused code is removed, defer heavy parts of a page with <code>@defer</code>, avoid large libraries when you only need a small part, and compress and cache files on the server or CDN.`,

"How do you manage state in a modern Angular application?":
`Keep state as close to where it is used as possible. Local state: a signal in the component. State shared by a feature: a service with signals, which is usually the right answer. Data from the server: a service or query library with caching. Use a full store such as NgRx only for large apps with complex shared state.`,

"How do you test an Angular application?":
`Test pipes, validators and other pure functions as plain functions. Test services with TestBed, faking HTTP with <code>HttpTestingController</code>. Test components through what is shown on screen, clicking and checking the result, ideally with Angular Testing Library. Add a few end-to-end tests with Playwright or Cypress for key user journeys.`,

"Trace one click through Angular's change detection, with and without OnPush":
`Without OnPush, after a click Angular checks every component in the whole tree for changes. With OnPush, it checks only the clicked component, its ancestors (which are marked as needing a check) and components whose inputs changed, skipping everything else. With signals, Angular can go further and update only the views that read the changed signal.`,

"Build a typed reactive form with cross-field validation and an async check":
`Create a typed <code>FormGroup</code> in the class. Add a validator on the whole group for rules involving several fields, such as "password and confirmation must match". Add an async validator for server checks, such as "is this username taken?", and run it only on blur or after a short pause so you do not call the server on every keystroke.`,

"Which RxJS operator, and why — with the bug each wrong choice causes":
`<b>switchMap</b> cancels the previous request when a new value arrives, which is right for searches; misused, it can cancel saves. <b>mergeMap</b> runs everything in parallel, so results can arrive out of order. <b>concatMap</b> runs one at a time in order, which is right for saves but can queue up. <b>exhaustMap</b> ignores new values while busy, which is right for stopping double-clicked submit buttons.`,

"What is Angular and how does it differ from React?":
`Angular is a complete framework using TypeScript, with routing, forms, HTTP, dependency injection and testing built in, and a standard way of doing things. React is a library focused only on the view, so you choose your own router, state management and data fetching. Angular suits large teams wanting consistency; React offers more flexibility.`,

"What are components, and what changed with standalone components?":
`A component is a class plus a template that controls one part of the screen. Previously every component had to be declared in an NgModule. Standalone components (now the default) list their own imports directly, removing that extra layer, so apps are simpler to understand and unused code is easier to strip out.`,

"How does Angular's dependency injection work?":
`You mark a class as injectable, and any component or service that needs it asks for it with <code>inject()</code> or a constructor parameter. Angular creates the instance (once, if provided in root) and hands it over. This keeps classes loosely connected and makes testing easy, because you can provide a fake service instead.`,

"What are Angular signals and how do they change change detection?":
`A signal is a value that Angular tracks: you read it with <code>count()</code> and change it with <code>set</code> or <code>update</code>. <code>computed</code> signals derive values automatically. Because Angular knows exactly which parts of the screen read which signals, it can update only those parts instead of checking the whole app, and there is nothing to unsubscribe from.`,

"Explain change detection and the OnPush strategy":
`Traditionally, a library called Zone.js notices every event, timer and HTTP response, and Angular then checks the whole component tree for changes. With OnPush, a component is only checked when its inputs get new values, an event fires inside it, or an async pipe or signal it uses changes. Combined with immutable data, this makes apps much faster.`,

"What is RxJS and which operators do you use most?":
`RxJS models values arriving over time as streams (Observables) that you can transform, combine and cancel. Angular's HTTP client, router and forms use it. Common operators: <code>map</code> (transform), <code>filter</code>, <code>switchMap</code> (switch to a new request and cancel the old), <code>debounceTime</code> (wait for typing to pause), <code>catchError</code> and <code>combineLatest</code>.`,

"How do you avoid memory leaks with subscriptions?":
`A subscription that is never closed keeps running after its component is destroyed, wasting memory and running old code. Prefer the <code>async</code> pipe or signals, which clean up automatically. If you must subscribe in code, use <code>takeUntilDestroyed()</code> so it ends when the component is destroyed. HTTP requests complete on their own.`,

"Template-driven vs reactive forms":
`<b>Template-driven</b> forms are defined in the HTML with <code>ngModel</code>; they are quick for simple forms but harder to test. <b>Reactive</b> forms are defined in the component class with <code>FormGroup</code> and <code>FormControl</code>; they are more predictable, strongly typed and easy to test, so they suit larger or dynamic forms.`,

"How does Angular routing work — guards, lazy loading and resolvers?":
`The router maps URLs to components. <b>Guards</b> decide whether you may enter or leave a route, for example only logged-in users, or warning about unsaved changes. <b>Lazy loading</b> downloads a feature's code only when it is first visited. <b>Resolvers</b> load data before a route is shown.`,

"How do HTTP interceptors work and what do you use them for?":
`An interceptor sits between your app and every HTTP request and response, like a checkpoint. It is used to add the login token to every request, refresh expired tokens, show a global loading indicator, handle errors in one place, and log requests, all without repeating code in each service.`,

"What are the Angular lifecycle hooks?":
`Lifecycle hooks are methods Angular calls at key moments. <code>ngOnChanges</code>: when inputs change. <code>ngOnInit</code>: once, after the first inputs are set, for setup. <code>ngAfterViewInit</code>: after the component's view is ready, for working with child elements. <code>ngOnDestroy</code>: just before removal, for clean-up.`,

"How do you manage state in an Angular application?":
`Match the tool to the size of the problem. Most state is local, so use a signal in the component. State shared within a feature belongs in a service with signals. Server data needs caching and loading states. Only very large apps with complex shared state need a store library such as NgRx.`,

"How do you optimise Angular application performance?":
`Use OnPush change detection or signals, lazy-load routes, defer heavy page sections with <code>@defer</code>, use <code>track</code> in <code>@for</code> loops so list items are reused, avoid calling functions in templates (use pipes or computed signals), and virtualise very long lists.`,

"How do you test Angular components and services?":
`Test components through what the user sees: render them, click buttons, type into fields, and check what appears, rather than calling internal methods. Fake services and HTTP calls. Test services on their own with TestBed and <code>HttpTestingController</code>. Keep most tests fast, with only a few full end-to-end tests.`
});
