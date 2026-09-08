appendTopic("angular", [
{
  q: "Explain Angular change detection and how OnPush actually works",
  level: "advanced", hot: true, tags: ["performance", "change-detection"],
  companies: ["Amazon", "Optum", "Cognizant", "Infosys", "EPAM", "Deloitte", "Nagarro"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 190" role="img" aria-label="Change detection tree traversal with OnPush branches skipped">
  <rect class="dg-fill" x="264" y="16" width="92" height="30" rx="6"/><text class="dg-s" x="310" y="36" text-anchor="middle">AppComponent</text>
  <path class="dg-line" d="M296 46 L190 76 M324 46 L440 76"/>
  <rect class="dg-fill" x="132" y="76" width="116" height="30" rx="6"/><text class="dg-s" x="190" y="96" text-anchor="middle">Default</text>
  <rect class="dg-box" x="382" y="76" width="116" height="30" rx="6"/><text class="dg-s" x="440" y="96" text-anchor="middle">OnPush (skipped)</text>
  <path class="dg-line" d="M170 106 L120 138 M212 106 L262 138"/>
  <path class="dg-line" d="M420 106 L370 138 M460 106 L512 138" stroke-dasharray="4 4"/>
  <rect class="dg-fill" x="66" y="138" width="106" height="30" rx="6"/><text class="dg-s" x="119" y="158" text-anchor="middle">checked</text>
  <rect class="dg-fill" x="210" y="138" width="106" height="30" rx="6"/><text class="dg-s" x="263" y="158" text-anchor="middle">checked</text>
  <rect class="dg-box" x="318" y="138" width="106" height="30" rx="6"/><text class="dg-s" x="371" y="158" text-anchor="middle">not checked</text>
  <rect class="dg-box" x="458" y="138" width="106" height="30" rx="6"/><text class="dg-s" x="511" y="158" text-anchor="middle">not checked</text>
</svg>
</figure>
<p>Zone.js monkey-patches every async API — <code>setTimeout</code>, <code>addEventListener</code>, XHR, promises. When one completes, Angular runs change detection over the <strong>whole component tree, top to bottom</strong>, re-evaluating every template binding. On a large app that is thousands of expression evaluations per click.</p>
<p><strong><code>OnPush</code> narrows it.</strong> A component is only re-checked when one of these happens:</p>
<ol>
<li>An <code>@Input()</code> <strong>reference</strong> changes (<code>===</code> comparison — mutating an object in place does nothing)</li>
<li>An event fires from within the component's own template</li>
<li>An <code>async</code> pipe in its template emits</li>
<li>Something calls <code>markForCheck()</code> on its <code>ChangeDetectorRef</code></li>
</ol>
<pre><code>@Component({
  selector: 'app-order-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: &#96;
    @for (o of orders(); track o.id) {          <!-- track is REQUIRED for perf -->
      &lt;app-order-row [order]="o" /&gt;
    }
  &#96;
})
export class OrderListComponent {
  orders = signal&lt;Order[]&gt;([]);

  // ✗ mutation — same reference, OnPush children never update
  addBad(o: Order)  { this.orders().push(o); }

  // ✔ new reference
  addGood(o: Order) { this.orders.update(list =&gt; [...list, o]); }
}</code></pre>
<p><strong>The modern answer — signals.</strong> Since Angular 16, signals give <em>fine-grained</em> reactivity: a signal read in a template registers a dependency, and when it changes Angular marks only the components that actually read it. With <code>provideZonelessChangeDetection()</code> (stable in v20) Zone.js is dropped entirely — no global tree traversal at all, and a smaller bundle.</p>
<pre><code>// Signals: computed values are memoised and only recompute when a dependency changes
count    = signal(0);
doubled  = computed(() =&gt; this.count() * 2);
effect(() =&gt; console.log('count is', this.count()));

// Interop with RxJS
orders = toSignal(this.http.get&lt;Order[]&gt;('/api/orders'), { initialValue: [] });</code></pre>
<p><strong>The debugging tip that impresses:</strong> "If something is slow I profile before changing anything — Angular DevTools' change detection profiler shows exactly which components are being checked and how long each takes. The usual culprits are a function call in a template (re-evaluated on every cycle) and a missing <code>track</code> in a list, which destroys and recreates every DOM node."</p>`
},
{
  q: "How do you handle HTTP errors, retries and loading state properly in Angular?",
  level: "advanced", hot: true, tags: ["rxjs", "http"],
  companies: ["Optum", "Cognizant", "Infosys", "Capgemini", "EPAM", "Wipro", "Accenture"],
  a: `<pre><code>// Functional interceptor — the modern form, no class needed
export const errorInterceptor: HttpInterceptorFn = (req, next) =&gt; {
  const auth   = inject(AuthService);
  const toast  = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    retry({
      count: 2,
      delay: (err, retryCount) =&gt; {
        // Only retry what is worth retrying: never a 400 or a 422
        if (err.status &gt;= 400 && err.status &lt; 500 && err.status !== 429) throw err;
        return timer(Math.min(1000 * 2 ** retryCount, 8000));   // exponential backoff
      }
    }),
    catchError((err: HttpErrorResponse) =&gt; {
      switch (err.status) {
        case 0:   toast.error('Network unreachable'); break;   // CORS or offline
        case 401: auth.logout(); router.navigate(['/login']); break;
        case 403: toast.error('You do not have access'); break;
        case 422: break;                                       // let the form handle it
        default:  toast.error(err.error?.message ?? 'Something went wrong');
      }
      return throwError(() =&gt; err);
    })
  );
};

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))]
});</code></pre>
<pre><code>// Loading state without a pile of booleans
type State&lt;T&gt; = { status: 'loading' } | { status: 'ok'; data: T } | { status: 'error'; error: string };

orders$ = this.search$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term =&gt;                       // switchMap CANCELS the previous request
    this.http.get&lt;Order[]&gt;('/api/orders', { params: { q: term } }).pipe(
      map(data =&gt; ({ status: 'ok', data }) as State&lt;Order[]&gt;),
      startWith({ status: 'loading' } as State&lt;Order[]&gt;),
      catchError(e =&gt; of({ status: 'error', error: e.message } as State&lt;Order[]&gt;))
    )
  )
);</code></pre>
<p><strong>Note where <code>catchError</code> sits</strong> — inside the <code>switchMap</code>, not outside. If it were on the outer stream, one error would complete the whole observable and the search box would stop working permanently. This is the single most common RxJS bug in Angular code.</p>
<table>
<tr><th>Operator</th><th>On a new emission</th><th>Use for</th></tr>
<tr><td><code>switchMap</code></td><td>Cancels the in-flight one</td><td>Search, autocomplete, navigation</td></tr>
<tr><td><code>concatMap</code></td><td>Queues, preserves order</td><td>Sequential writes that must not reorder</td></tr>
<tr><td><code>mergeMap</code></td><td>Runs in parallel</td><td>Independent parallel requests</td></tr>
<tr><td><code>exhaustMap</code></td><td>Ignores new until done</td><td><strong>Submit buttons</strong> — prevents double submission</td></tr>
</table>
<p><strong>And unsubscription:</strong> <code>HttpClient</code> observables complete on their own, but long-lived streams leak. Use the <code>async</code> pipe, or <code>takeUntilDestroyed()</code>, rather than manually tracking subscriptions.</p>`
},
{
  q: "What are standalone components, and how do you structure a modern Angular application?",
  level: "advanced", tags: ["architecture", "modern"],
  companies: ["Optum", "EPAM", "Cognizant", "Infosys", "SAP", "Publicis Sapient"],
  a: `<pre><code>// No NgModule anywhere — this is the default from Angular 19 onwards
@Component({
  selector: 'app-order-card',
  imports: [CommonModule, RouterLink, CurrencyPipe],   // dependencies declared here
  template: &#96;
    &#64;if (order(); as o) {
      &lt;a [routerLink]="['/orders', o.id]"&gt;{{ o.total | currency:'INR' }}&lt;/a&gt;
    } &#64;else {
      &lt;app-skeleton /&gt;
    }
  &#96;
})
export class OrderCardComponent {
  order = input.required&lt;Order&gt;();      // signal input, replaces &#64;Input()
  select = output&lt;number&gt;();            // replaces &#64;Output() EventEmitter
}

// Bootstrap
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZonelessChangeDetection()
  ]
});

// Lazy loading is now per-route, not per-module
export const routes: Routes = [
  { path: 'orders',
    loadChildren: () =&gt; import('./orders/routes').then(m =&gt; m.ORDER_ROUTES),
    canMatch: [authGuard] },
  { path: 'admin',
    loadComponent: () =&gt; import('./admin/admin.component').then(m =&gt; m.AdminComponent) }
];</code></pre>
<p><strong>Why standalone is better:</strong> the dependency graph is explicit at the component instead of hidden in a shared module that imports forty things; tree-shaking works properly, so bundles shrink; lazy loading is per-component rather than per-module; and testing needs no <code>TestBed.configureTestingModule</code> ceremony.</p>
<p><strong>Folder structure that scales</strong> — feature-first, not type-first:</p>
<pre><code>src/app/
  core/            # singletons: auth, interceptors, error handling — provided once
  shared/          # dumb reusable components, pipes, directives
  features/
    orders/
      routes.ts
      order-list/        # smart: injects services, holds state
      order-card/        # dumb: inputs and outputs only
      data/
        order.service.ts
        order.model.ts
  layout/</code></pre>
<table>
<tr><th>Old</th><th>New equivalent</th></tr>
<tr><td><code>NgModule</code> declarations</td><td><code>imports</code> on the component</td></tr>
<tr><td><code>@Input() x</code></td><td><code>x = input&lt;T&gt;()</code> — a signal, works with <code>computed</code></td></tr>
<tr><td><code>@Output() e = new EventEmitter()</code></td><td><code>e = output&lt;T&gt;()</code></td></tr>
<tr><td><code>*ngIf / *ngFor / *ngSwitch</code></td><td><code>&#64;if / &#64;for / &#64;switch</code> — built in, no import, faster</td></tr>
<tr><td><code>@ViewChild</code></td><td><code>viewChild()</code> signal query</td></tr>
<tr><td>Constructor injection</td><td><code>inject()</code> — works in functions, guards and interceptors</td></tr>
</table>
<p><strong>The migration answer:</strong> "Standalone and NgModules interoperate, so I migrate incrementally — <code>ng generate @angular/core:standalone</code> automates most of it. New features go standalone from day one; old modules get converted when they are touched, not in a big-bang rewrite."</p>`
},
{
  q: "How does Angular's dependency injection hierarchy work?",
  level: "advanced", tags: ["di", "core"],
  companies: ["Optum", "Cognizant", "EPAM", "Infosys", "Accenture", "Mindtree"],
  a: `<table>
<tr><th>Provided at</th><th>Instances</th><th>Use for</th></tr>
<tr><td><code>providedIn: 'root'</code></td><td>One, application-wide</td><td>Almost everything — and it is tree-shakable</td></tr>
<tr><td>Route <code>providers</code></td><td>One per lazy-loaded route</td><td>Feature-scoped state that dies with the feature</td></tr>
<tr><td>Component <code>providers</code></td><td>One per component <em>instance</em></td><td>Per-widget state, e.g. a form store</td></tr>
<tr><td><code>viewProviders</code></td><td>View children only, not projected content</td><td>Rare, but the distinction gets asked</td></tr>
</table>
<pre><code>@Injectable({ providedIn: 'root' })
export class AuthService { }              // singleton, removed from the bundle if unused

@Component({
  providers: [OrderFormStore]             // NEW instance per &lt;app-order-form&gt;
})
export class OrderFormComponent {
  private store = inject(OrderFormStore); // each form gets its own state
}</code></pre>
<p><strong>Resolution walks up the injector tree:</strong> element injector → parent elements → the component's own module/route injector → the root environment injector → <code>NullInjector</code>, which throws <code>NG0201: No provider for X</code>. That error simply means the chain ran out.</p>
<pre><code>// Modifiers control the walk
constructor() {
  const a = inject(Foo, { optional: true });   // null instead of throwing
  const b = inject(Bar, { skipSelf: true });   // start at the PARENT — breaks a self-cycle
  const c = inject(Baz, { self: true });       // this injector only, do not walk up
  const d = inject(Qux, { host: true });       // stop at the host component
}

// InjectionToken for anything that is not a class
export const API_URL = new InjectionToken&lt;string&gt;('API_URL', {
  providedIn: 'root', factory: () =&gt; environment.apiUrl
});</code></pre>
<p><strong>The classic gotcha to raise unprompted:</strong> a service <code>providedIn: 'root'</code> is a true singleton even when first injected inside a lazy-loaded route. But a service listed in a <em>lazy route's</em> <code>providers</code> array gets its own instance — so two lazy features each declaring the same service get two copies and two separate caches, which produces "my state resets when I navigate" bugs. Root for shared state, route providers for genuinely feature-local state.</p>
<p><strong>Why DI matters in practice:</strong> it makes testing trivial — override any provider in a test with a fake, no mocking framework required — and lets you swap implementations (a mock payment gateway in dev, the real one in prod) with a single provider change rather than an edit in every consumer.</p>`
}
]);
