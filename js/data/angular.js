registerTopic("angular", [
{
  q: "What is Angular and how does it differ from React?",
  level: "beginner", hot: true, tags: ["basics"],
  a: `<table>
<tr><th></th><th>Angular</th><th>React</th></tr>
<tr><td>Type</td><td>Full framework — batteries included</td><td>A library for the view layer</td></tr>
<tr><td>Language</td><td>TypeScript (mandatory)</td><td>JavaScript or TypeScript</td></tr>
<tr><td>Included</td><td>Router, HTTP client, forms, DI, testing, CLI, animations</td><td>Choose your own for each</td></tr>
<tr><td>Data binding</td><td>Two-way available (<code>[(ngModel)]</code>)</td><td>One-way, explicit</td></tr>
<tr><td>DOM strategy</td><td>Incremental DOM / signals</td><td>Virtual DOM</td></tr>
<tr><td>Learning curve</td><td>Steeper — RxJS, DI, modules, decorators</td><td>Gentler core, complexity in the ecosystem</td></tr>
<tr><td>Opinionated</td><td>Highly — consistent across teams</td><td>Minimally — flexible, more decisions</td></tr>
</table>
<p><strong>How to answer well:</strong> "Angular's opinionation is its main advantage on a large team — routing, HTTP, forms, DI and testing come from one vendor, versioned together, with a CLI that scaffolds and upgrades them. That consistency matters more on a long-lived enterprise application than the flexibility React gives you. React wins where you want a light view layer and full control over the stack."</p>
<p>Note that modern Angular (v16+) has moved substantially: standalone components, signals, and control-flow syntax have made it considerably less ceremonious than its reputation.</p>`
},
{
  q: "What are components, and what changed with standalone components?",
  level: "beginner", hot: true, tags: ["components"],
  a: `<pre><code>@Component({
  selector: 'app-order-card',
  standalone: true,                            // no NgModule needed (default from v19)
  imports: [CommonModule, RouterLink],         // dependencies declared right here
  template: \`
    @if (order()) {                            &lt;!-- built-in control flow, v17+ --&gt;
      &lt;h3&gt;{{ order()!.reference }}&lt;/h3&gt;
      @for (item of order()!.items; track item.sku) {
        &lt;li&gt;{{ item.sku }} &times; {{ item.qty }}&lt;/li&gt;
      } @empty {
        &lt;li&gt;No items&lt;/li&gt;
      }
    } @else {
      &lt;app-spinner /&gt;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderCardComponent {
  order = input.required&lt;Order&gt;();              // signal input, v17.1+
  cancelled = output&lt;string&gt;();                 // signal output
}</code></pre>
<p><strong>Standalone components</strong> (stable in v15, the default in v19) removed <code>NgModule</code> as a requirement. Each component declares its own <code>imports</code>, which means:</p>
<ul>
<li>Far less boilerplate — no <code>declarations</code>, <code>exports</code>, <code>imports</code> triple bookkeeping.</li>
<li>Dependencies are visible where they are used.</li>
<li>Better tree-shaking and simpler lazy loading — you can lazy-load a <em>component</em>, not just a module.</li>
</ul>
<p>The <code>@if</code> / <code>@for</code> / <code>@switch</code> block syntax replaced <code>*ngIf</code> and <code>*ngFor</code> in v17: it is faster (no directive instantiation), type-narrows properly, and <code>track</code> is now mandatory in <code>@for</code>, which prevents the most common list-performance mistake.</p>`
},
{
  q: "How does Angular's dependency injection work?",
  level: "advanced", hot: true, tags: ["di"],
  a: `<p>Angular has a hierarchical injector tree. When a component asks for a dependency, Angular walks up from the element injector to the module/root injector until it finds a provider.</p>
<pre><code>@Injectable({ providedIn: 'root' })            // singleton, tree-shakeable
export class OrderService {
  private http = inject(HttpClient);           // inject() function, v14+ — no constructor needed

  getOrders(): Observable&lt;Order[]&gt; {
    return this.http.get&lt;Order[]&gt;('/api/v1/orders');
  }
}

// Component-level provider: a NEW instance per component instance
@Component({ providers: [OrderStateService] })

// Injection tokens for non-class values
export const API_URL = new InjectionToken&lt;string&gt;('api.url');
providers: [{ provide: API_URL, useValue: environment.apiUrl }]

// Swapping implementations
providers: [{ provide: Logger, useClass: RemoteLogger }]
providers: [{ provide: Cache, useFactory: () =&gt; new Cache(inject(Config).ttl) }]</code></pre>
<p><strong>Provider scopes:</strong> <code>providedIn: 'root'</code> gives an application-wide singleton that is tree-shaken if unused; providing in a component's <code>providers</code> array creates an instance per component (useful for per-feature state that should reset); <code>providedIn: 'platform'</code> shares across multiple Angular apps on a page.</p>
<p><strong>Why <code>inject()</code> is preferred now:</strong> it works in field initialisers, avoids long constructor signatures, composes into reusable functions, and works in functional guards, interceptors and resolvers — which is where Angular's API has moved.</p>`
},
{
  q: "What are Angular signals and how do they change change detection?",
  level: "advanced", hot: true, tags: ["signals", "modern"],
  a: `<p><strong>Signals</strong> (v16+) are reactive primitives that hold a value and know exactly who depends on them. They are the biggest architectural change in Angular in years.</p>
<pre><code>@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: \`
  &lt;p&gt;{{ fullName() }}&lt;/p&gt;
  &lt;button (click)="increment()"&gt;{{ count() }}&lt;/button&gt;
\` })
export class ProfileComponent {
  first = signal('Vivek');                       // writable signal
  last  = signal('Kumar');
  count = signal(0);

  fullName = computed(() =&gt; \`\${this.first()} \${this.last()}\`);   // derived, memoised

  constructor() {
    effect(() =&gt; console.log('count changed to', this.count()));   // side effect
  }

  increment() {
    this.count.update(c =&gt; c + 1);               // or .set(value)
  }
}</code></pre>
<p><strong>Why it matters:</strong> classic Angular change detection had to check <em>every binding in every component</em> on every event, because it could not know what changed. Signals build a precise dependency graph, so Angular can update only the specific DOM nodes affected. That is the basis of <strong>zoneless</strong> Angular — dropping Zone.js entirely, which removes a large monkey-patching layer and improves both performance and debuggability.</p>
<pre><code>// Signals interoperate with RxJS
data = toSignal(this.http.get&lt;Order[]&gt;('/api/orders'), { initialValue: [] });
query$ = toObservable(this.searchTerm);

// resource() / httpResource() for async data, v19+
orders = resource({ request: () =&gt; this.filter(), loader: ({request}) =&gt; fetchOrders(request) });</code></pre>
<p><strong>Signals vs RxJS:</strong> signals are for synchronous derived state; RxJS remains the right tool for streams over time — debouncing, cancellation, retries, websockets. They complement rather than replace each other, and saying so shows you understand both.</p>`
},
{
  q: "Explain change detection and the OnPush strategy",
  level: "advanced", hot: true, tags: ["performance", "change-detection"],
  a: `<p>Angular (pre-signals) uses <strong>Zone.js</strong>, which monkey-patches every async API — <code>setTimeout</code>, event listeners, XHR, promises. When any of them fires, Zone tells Angular "something might have changed", and Angular runs change detection over the <em>entire component tree</em>, comparing every template binding.</p>
<table>
<tr><th></th><th>Default</th><th>OnPush</th></tr>
<tr><td>Checks the component when</td><td>Any async event anywhere</td><td>Only when: an <code>@Input</code> reference changes, an event fires <em>in this component</em>, an <code>async</code> pipe emits, or <code>markForCheck()</code> is called</td></tr>
<tr><td>Cost</td><td>O(all bindings) per event</td><td>Skips whole subtrees</td></tr>
</table>
<pre><code>@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class OrderListComponent {
  @Input() orders!: readonly Order[];
}</code></pre>
<p><strong>The critical consequence of OnPush:</strong> it compares inputs by <strong>reference</strong>. Mutating an array in place will not trigger an update:</p>
<pre><code>this.orders.push(newOrder);            // ✘ same reference — no re-render
this.orders = [...this.orders, newOrder];  // ✔ new reference</code></pre>
<p>This is why OnPush pairs naturally with <strong>immutable data</strong>, and why signals are such a good fit — a signal read is tracked precisely, so the reference-equality caveat disappears.</p>
<p><strong>Practical performance advice:</strong> use OnPush everywhere by default; always provide <code>track</code> in <code>@for</code>; avoid function calls in templates (they run on every check — use <code>computed()</code> or a pure pipe); use <code>trackBy</code>/virtual scrolling for long lists; and run heavy non-UI work outside the zone with <code>NgZone.runOutsideAngular()</code>.</p>`
},
{
  q: "What is RxJS and which operators do you use most?",
  level: "advanced", hot: true, tags: ["rxjs"],
  a: `<p>RxJS models asynchronous values as <strong>Observables</strong> — streams you can compose, transform, cancel and retry. Angular's HTTP client, router and forms all return them.</p>
<pre><code>// The canonical type-ahead search — this single example shows why RxJS exists
this.searchControl.valueChanges.pipe(
  debounceTime(300),                      // wait for a pause in typing
  distinctUntilChanged(),                 // ignore unchanged values
  filter(term =&gt; term.length &gt;= 2),
  switchMap(term =&gt; this.api.search(term)),   // CANCELS the previous in-flight request
  catchError(err =&gt; { this.toast.error(err); return of([]); }),
  takeUntilDestroyed(this.destroyRef)      // auto-unsubscribe, v16+
).subscribe(results =&gt; this.results.set(results));</code></pre>
<p><strong>The four flattening operators — the most-asked RxJS question:</strong></p>
<table>
<tr><th>Operator</th><th>Behaviour</th><th>Use for</th></tr>
<tr><td><code>switchMap</code></td><td>Cancels the previous inner observable</td><td><strong>Search, navigation</strong> — you only want the latest</td></tr>
<tr><td><code>mergeMap</code></td><td>Runs all concurrently, order not guaranteed</td><td>Independent parallel work</td></tr>
<tr><td><code>concatMap</code></td><td>Queues, one at a time, in order</td><td><strong>Writes/saves</strong> — order matters</td></tr>
<tr><td><code>exhaustMap</code></td><td>Ignores new values while one is in flight</td><td><strong>Login/submit buttons</strong> — prevents double submission</td></tr>
</table>
<p><strong>Other operators worth naming:</strong> <code>map</code>, <code>filter</code>, <code>tap</code> (side effects), <code>combineLatest</code>, <code>forkJoin</code> (like <code>Promise.all</code>), <code>startWith</code>, <code>shareReplay</code> (multicast + cache), <code>retry</code>/<code>retryWhen</code>, <code>finalize</code>.</p>
<p><strong>Subjects:</strong> <code>Subject</code> (no initial value), <code>BehaviorSubject</code> (holds the current value — the usual choice for state), <code>ReplaySubject</code> (buffers N), <code>AsyncSubject</code>.</p>`
},
{
  q: "How do you avoid memory leaks with subscriptions?",
  level: "advanced", hot: true, tags: ["rxjs", "gotcha"],
  a: `<p>An unclosed subscription keeps the component alive after it is destroyed — the classic Angular memory leak, and it also causes callbacks to fire against a dead component.</p>
<pre><code>// 1. BEST — the async pipe subscribes and unsubscribes for you
&lt;div *ngIf="orders$ | async as orders"&gt;...&lt;/div&gt;
// or with signals:
orders = toSignal(this.service.getOrders(), { initialValue: [] });

// 2. takeUntilDestroyed — v16+, the idiomatic manual approach
export class OrderComponent {
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    this.service.stream$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(...);
  }
}

// 3. Classic takeUntil pattern (pre-v16)
private destroy$ = new Subject&lt;void&gt;();
ngOnInit()      { this.s$.pipe(takeUntil(this.destroy$)).subscribe(...); }
ngOnDestroy()   { this.destroy$.next(); this.destroy$.complete(); }

// 4. Manual — fine for one, unwieldy for many
private sub = new Subscription();
ngOnInit()    { this.sub.add(this.s$.subscribe(...)); }
ngOnDestroy() { this.sub.unsubscribe(); }</code></pre>
<p><strong>Which subscriptions actually leak?</strong> An important nuance: an <code>HttpClient</code> observable completes after one emission, so it self-unsubscribes and does not leak. The dangerous ones are <em>infinite</em> streams — <code>valueChanges</code>, router events, <code>interval</code>, WebSocket streams, and any <code>Subject</code> in a shared service.</p>
<p><strong>Prefer the async pipe</strong> wherever possible: it eliminates the whole class of bug, works with OnPush automatically, and keeps the component free of subscription bookkeeping. Manual subscription should be the exception, justified by a genuine side effect.</p>`
},
{
  q: "Template-driven vs reactive forms",
  level: "beginner", hot: true, tags: ["forms"],
  a: `<table>
<tr><th></th><th>Template-driven</th><th>Reactive</th></tr>
<tr><td>Model defined in</td><td>The template</td><td>The component class</td></tr>
<tr><td>Data flow</td><td>Asynchronous</td><td>Synchronous — predictable</td></tr>
<tr><td>Validation</td><td>Directives in HTML</td><td>Functions in TypeScript</td></tr>
<tr><td>Type safety</td><td>Weak</td><td><strong>Strongly typed</strong> (v14+)</td></tr>
<tr><td>Testing</td><td>Needs the DOM</td><td>Test the model directly</td></tr>
<tr><td>Best for</td><td>Simple forms — a login box</td><td>Anything non-trivial, dynamic or heavily validated</td></tr>
</table>
<pre><code>form = this.fb.nonNullable.group({
  email:    ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]],
  address: this.fb.group({ city: [''], pincode: ['', Validators.pattern(/^\\d{6}$/)] }),
  items: this.fb.array([])                            // dynamic rows
}, { validators: passwordsMatchValidator });

get items() { return this.form.controls.items as FormArray; }
addItem()   { this.items.push(this.fb.group({ sku: [''], qty: [1] })); }

submit() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.api.save(this.form.getRawValue()).subscribe(...);   // fully typed
}</code></pre>
<pre><code>// Async validator — check uniqueness against the server
emailTaken(): AsyncValidatorFn {
  return (c) =&gt; this.api.emailExists(c.value).pipe(
    map(exists =&gt; exists ? { taken: true } : null),
    catchError(() =&gt; of(null))
  );
}</code></pre>
<p><strong>Recommend reactive forms</strong> for anything real: the model is testable without rendering, validation is composable and unit-testable, dynamic fields via <code>FormArray</code> are straightforward, and <code>valueChanges</code> gives you a stream to react to.</p>`
},
{
  q: "How does Angular routing work — guards, lazy loading and resolvers?",
  level: "advanced", hot: true, tags: ["routing"],
  a: `<pre><code>export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'orders',
    // lazy-load a standalone component — code split at this boundary
    loadComponent: () =&gt; import('./orders/order-list.component').then(m =&gt; m.OrderListComponent),
    canActivate: [authGuard],
    data: { roles: ['USER'] } },

  { path: 'admin',
    loadChildren: () =&gt; import('./admin/admin.routes').then(m =&gt; m.ADMIN_ROUTES),
    canMatch: [roleGuard(['ADMIN'])] },

  { path: 'orders/:id',
    component: OrderDetailComponent,
    resolve: { order: orderResolver },              // data loaded BEFORE activation
    canDeactivate: [unsavedChangesGuard] },

  { path: '**', component: NotFoundComponent }      // must be LAST
];

// Functional guard — v15+, no class needed
export const authGuard: CanActivateFn = (route, state) =&gt; {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};</code></pre>
<p><strong>Guard types:</strong> <code>canActivate</code> (may this route be entered?), <code>canActivateChild</code>, <code>canDeactivate</code> (unsaved-changes prompt), <code>canMatch</code> (whether the route matches at all — better than <code>canLoad</code> because it can fall through to another route), and <code>resolve</code> for prefetching data.</p>
<p><strong>Lazy loading is the main performance lever</strong> in a large Angular app: it splits the bundle so the initial download contains only what the first screen needs. Combine it with route-level preloading strategies to fetch other chunks during idle time.</p>
<p><strong>Caveat on resolvers:</strong> they delay navigation until data arrives, which can make the app feel unresponsive. Often better to navigate immediately and show a loading state — mention that trade-off.</p>`
},
{
  q: "How do HTTP interceptors work and what do you use them for?",
  level: "advanced", tags: ["http"],
  a: `<pre><code>// Functional interceptor — v15+
export const authInterceptor: HttpInterceptorFn = (req, next) =&gt; {
  const auth = inject(AuthService);
  const token = auth.token();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } })
    : req;

  return next(authReq).pipe(
    retry({ count: 2, delay: (err, n) =&gt; timer(n * 500) }),      // backoff
    catchError((err: HttpErrorResponse) =&gt; {
      if (err.status === 401) {
        return auth.refresh().pipe(
          switchMap(t =&gt; next(req.clone({ setHeaders: { Authorization: \`Bearer \${t}\` } })))
        );
      }
      if (err.status &gt;= 500) inject(ToastService).error('Server error');
      return throwError(() =&gt; err);
    })
  );
};

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor]))]
});</code></pre>
<p><strong>Typical uses:</strong> attaching auth tokens, refreshing expired tokens transparently, a global loading indicator, centralised error handling and toasts, request/response logging, adding correlation IDs for tracing, caching GET responses, and mocking during development.</p>
<p><strong>Key details:</strong> <code>HttpRequest</code> is <strong>immutable</strong> — you must <code>clone()</code> to modify it. Interceptors run in the order registered for the request and in reverse for the response. And the token-refresh case needs care: concurrent 401s should share one refresh call (use <code>shareReplay</code> or a <code>BehaviorSubject</code> gate), or you fire ten refreshes and invalidate each other.</p>`
},
{
  q: "What are the Angular lifecycle hooks?",
  level: "beginner", tags: ["components"],
  a: `<table>
<tr><th>Hook</th><th>When</th><th>Typical use</th></tr>
<tr><td><code>ngOnChanges</code></td><td>Before <code>ngOnInit</code> and on every input change</td><td>React to input changes; receives previous and current values</td></tr>
<tr><td><code>ngOnInit</code></td><td>Once, after the first <code>ngOnChanges</code></td><td>Initialisation, data fetching — <strong>not the constructor</strong></td></tr>
<tr><td><code>ngDoCheck</code></td><td>Every change detection cycle</td><td>Custom dirty checking. Runs constantly — use with care</td></tr>
<tr><td><code>ngAfterContentInit / Checked</code></td><td>After projected content (<code>&lt;ng-content&gt;</code>) initialises</td><td>Access <code>@ContentChild</code></td></tr>
<tr><td><code>ngAfterViewInit / Checked</code></td><td>After the component's own view initialises</td><td>Access <code>@ViewChild</code>, integrate a third-party DOM library</td></tr>
<tr><td><code>ngOnDestroy</code></td><td>Just before destruction</td><td>Unsubscribe, clear timers, detach listeners</td></tr>
</table>
<p><strong>Constructor vs <code>ngOnInit</code>:</strong> the constructor runs before inputs are bound, so <code>@Input</code> values are <code>undefined</code> there. Keep the constructor for dependency injection only and put initialisation logic in <code>ngOnInit</code>.</p>
<p><strong>A common runtime error to mention:</strong> modifying a bound value inside <code>ngAfterViewInit</code> throws <code>ExpressionChangedAfterItHasBeenCheckedError</code> in development mode, because Angular's verification pass sees a different value than it just rendered. The fixes are <code>Promise.resolve().then(...)</code>, <code>setTimeout</code>, or better, restructuring so the value is set earlier.</p>
<p>Modern Angular reduces the need for several of these — <code>DestroyRef</code> replaces much of <code>ngOnDestroy</code>, and signals plus <code>computed()</code> replace most <code>ngOnChanges</code> logic.</p>`
},
{
  q: "How do you manage state in an Angular application?",
  level: "advanced", tags: ["state", "architecture"],
  a: `<p>Scale the solution to the problem — that framing is the answer.</p>
<ol>
<li><strong>Component state</strong> — a signal or plain property. Most state is local and should stay that way.</li>
<li><strong>Service with signals</strong> — the modern default for shared state. Simple, typed, no library:
<pre><code>@Injectable({ providedIn: 'root' })
export class CartStore {
  private _items = signal&lt;CartItem[]&gt;([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() =&gt; this._items().reduce((s, i) =&gt; s + i.price * i.qty, 0));
  readonly count = computed(() =&gt; this._items().length);

  add(item: CartItem) { this._items.update(list =&gt; [...list, item]); }
  remove(sku: string) { this._items.update(list =&gt; list.filter(i =&gt; i.sku !== sku)); }
}</code></pre></li>
<li><strong>Service with <code>BehaviorSubject</code></strong> — the same pattern pre-signals; still common in existing codebases.</li>
<li><strong>NgRx / NgRx Signal Store</strong> — a Redux-style store with actions, reducers, effects and selectors. Adds real ceremony, so justify it: many components sharing complex state, a need for time-travel debugging and a strict audit of every change, or a large team needing enforced conventions.</li>
<li><strong>Server state</strong> — often not "state" at all. TanStack Query for Angular, or <code>resource()</code>/<code>httpResource()</code> (v19+), handle caching, refetching and staleness better than hand-rolled stores.</li>
</ol>
<blockquote><p><strong>The judgement to express:</strong> "I default to signals in a service. NgRx solves real problems on large applications, but adopting it for a five-screen app means writing four files to change one value. I would introduce it when shared-state bugs actually start appearing, not preemptively."</p></blockquote>`
},
{
  q: "How do you optimise Angular application performance?",
  level: "advanced", hot: true, tags: ["performance"],
  a: `<ol>
<li><strong>OnPush change detection everywhere</strong>, with immutable data — or signals, which make it precise.</li>
<li><strong>Lazy load routes</strong> so the initial bundle contains only the first screen; add a preloading strategy for the rest.</li>
<li><strong><code>track</code> in <code>@for</code></strong> — without it Angular destroys and recreates every DOM node when the list changes.</li>
<li><strong>No function calls in templates</strong> — <code>{{ calculateTotal() }}</code> runs on every change detection cycle. Use <code>computed()</code> or a pure pipe.</li>
<li><strong>Virtual scrolling</strong> (<code>cdk-virtual-scroll-viewport</code>) for long lists — render 20 rows instead of 10,000.</li>
<li><strong><code>NgOptimizedImage</code></strong> for lazy loading, responsive <code>srcset</code> and priority hints on the LCP image.</li>
<li><strong><code>NgZone.runOutsideAngular()</code></strong> for high-frequency work (animations, scroll handlers, charts) that should not trigger change detection.</li>
<li><strong>Analyse the bundle</strong> — <code>source-map-explorer</code> or <code>--stats-json</code> with esbuild's analyzer. Look for a whole date library imported for one function, or moment.js.</li>
<li><strong>SSR / hydration</strong> (<code>@angular/ssr</code> with incremental hydration in v19) for first-paint and SEO.</li>
<li><strong>Set performance budgets</strong> in <code>angular.json</code> so a bundle regression fails the build.</li>
</ol>
<pre><code>"budgets": [
  { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
  { "type": "anyComponentStyle", "maximumWarning": "4kb" }
]</code></pre>
<p><strong>Measure first:</strong> Angular DevTools' profiler shows which components are consuming change detection time, and Lighthouse gives you the user-facing Core Web Vitals. Optimising without those two is guesswork.</p>`
},
{
  q: "How do you test Angular components and services?",
  level: "advanced", tags: ["testing"],
  a: `<pre><code>// Service test — plain, no TestBed needed if you construct it yourself
describe('OrderService', () =&gt; {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() =&gt; {
    TestBed.configureTestingModule({
      providers: [OrderService, provideHttpClient(), provideHttpClientTesting()]
    });
    service  = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() =&gt; httpMock.verify());        // fails if there are outstanding requests

  it('fetches orders', () =&gt; {
    service.getOrders().subscribe(orders =&gt; expect(orders.length).toBe(2));
    const req = httpMock.expectOne('/api/v1/orders');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }, { id: 2 }]);
  });
});

// Component test
describe('OrderCardComponent', () =&gt; {
  it('emits cancel when the button is clicked', async () =&gt; {
    await TestBed.configureTestingModule({
      imports: [OrderCardComponent],                        // standalone: import it
      providers: [{ provide: OrderService, useValue: mockService }]
    }).compileComponents();

    const fixture = TestBed.createComponent(OrderCardComponent);
    fixture.componentRef.setInput('order', sampleOrder);
    fixture.detectChanges();

    const spy = jasmine.createSpy();
    fixture.componentInstance.cancelled.subscribe(spy);
    fixture.nativeElement.querySelector('[data-test="cancel"]').click();

    expect(spy).toHaveBeenCalledWith('o-1');
  });
});</code></pre>
<p><strong>Points worth making:</strong> test behaviour through the rendered DOM rather than calling component methods directly; select elements with <code>data-test</code> attributes, not CSS classes, so styling changes do not break tests; use <code>fakeAsync</code>/<code>tick()</code> for timers and <code>waitForAsync</code> for promises; and remember <code>fixture.detectChanges()</code> is required for the template to update.</p>
<p>For end-to-end tests, Angular deprecated Protractor — the current recommendations are <strong>Cypress</strong> or <strong>Playwright</strong>, and keeping E2E tests to a handful of critical journeys.</p>`
}
]);
