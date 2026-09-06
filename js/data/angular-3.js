appendTopic("angular", [
{
  q: "How do you handle errors globally in an Angular application?",
  level: "advanced", tags: ["errors", "production"],
  a: `<pre><code>// 1. HTTP errors — an interceptor, so every request is covered
export const errorInterceptor: HttpInterceptorFn = (req, next) =&gt; {
  const toast = inject(ToastService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) =&gt; {
      switch (err.status) {
        case 0:   toast.error('Network unavailable'); break;      // offline / CORS
        case 401: router.navigate(['/login']); break;
        case 403: toast.error('You do not have permission'); break;
        case 422: break;                                          // let the form handle it
        default:
          if (err.status &gt;= 500) {
            logger.error('Server error', { url: req.url, traceId: err.headers.get('X-Trace-Id') });
            toast.error('Something went wrong. Reference: ' + err.headers.get('X-Trace-Id'));
          }
      }
      return throwError(() =&gt; err);         // rethrow so callers can still react
    })
  );
};

// 2. Uncaught application errors — a global ErrorHandler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);

  handleError(error: unknown): void {
    // Chunk load failures happen after a deploy: the old chunk no longer exists
    if (error instanceof Error &amp;&amp; /ChunkLoadError|Loading chunk/.test(error.message)) {
      window.location.reload();
      return;
    }
    this.logger.error('Uncaught', error);
    console.error(error);
  }
}

providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]</code></pre>
<p><strong>The ChunkLoadError case is worth calling out</strong> — after a deployment the hashed lazy chunks change, so a user with the page already open gets a 404 when they navigate to a lazily-loaded route. Handling it by reloading is the standard fix, and it is invisible in development where you never deploy mid-session.</p>
<p><strong>Design points:</strong> distinguish errors the user can act on (validation, permission) from ones they cannot (a 500) — show a friendly message plus a trace ID for the latter so support can correlate; never surface raw stack traces; and rethrow from the interceptor so a component can still handle a specific case. Wire the logger to Sentry or your APM so frontend errors are visible at all, which they usually are not.</p>`
},
{
  q: "What is the difference between BehaviorSubject, Subject, ReplaySubject and a signal for state?",
  level: "advanced", tags: ["rxjs", "state"],
  a: `<table>
<tr><th></th><th>Initial value</th><th>Late subscriber receives</th><th>Typical use</th></tr>
<tr><td><code>Subject</code></td><td>No</td><td>Only future emissions</td><td>Event bus, one-off notifications</td></tr>
<tr><td><code>BehaviorSubject</code></td><td><strong>Required</strong></td><td>The current value, then future ones</td><td><strong>State</strong> — the usual choice</td></tr>
<tr><td><code>ReplaySubject(n)</code></td><td>No</td><td>The last n values</td><td>Recent history, caching</td></tr>
<tr><td><code>AsyncSubject</code></td><td>No</td><td>Only the final value, on completion</td><td>Rare</td></tr>
</table>
<pre><code>// The classic state service — expose an Observable, keep the Subject private
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = new BehaviorSubject&lt;CartItem[]&gt;([]);
  readonly items$ = this._items.asObservable();                    // read-only outward
  readonly total$ = this.items$.pipe(
    map(items =&gt; items.reduce((s, i) =&gt; s + i.price * i.qty, 0)),
    shareReplay({ bufferSize: 1, refCount: true })                 // share the computation
  );

  add(item: CartItem) { this._items.next([...this._items.value, item]); }
}

// The same thing with signals — simpler, synchronous, no subscription management
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal&lt;CartItem[]&gt;([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() =&gt; this._items().reduce((s, i) =&gt; s + i.price * i.qty, 0));

  add(item: CartItem) { this._items.update(list =&gt; [...list, item]); }
}</code></pre>
<p><strong>Why <code>BehaviorSubject</code> was the standard for state:</strong> a component subscribing after the value was set still receives it. With a plain <code>Subject</code>, a late subscriber sees nothing until the next change — which is why a component created after a login event never learns the user is logged in.</p>
<p><strong>When to use which now:</strong> signals for synchronous derived state (simpler, no subscription to leak, and change detection becomes precise); RxJS for anything involving <em>time</em> — debouncing, cancellation with <code>switchMap</code>, retries, WebSocket streams, combining several async sources. They interoperate via <code>toSignal</code> and <code>toObservable</code>, so this is not an either/or decision.</p>
<p><strong>The <code>shareReplay</code> detail matters:</strong> without <code>refCount: true</code> the subscription is never torn down, which is a genuine memory leak in a long-lived service.</p>`
},
{
  q: "How do you handle internationalisation and accessibility in Angular?",
  level: "advanced", tags: ["i18n", "a11y"],
  a: `<pre><code>&lt;!-- Built-in i18n: extract at build time, one bundle per locale --&gt;
&lt;h1 i18n="@@orderTitle"&gt;Your orders&lt;/h1&gt;
&lt;p i18n="Count of pending orders|@@pendingCount"&gt;
  {count, plural, =0 {No pending orders} =1 {One pending order}
                  other {{{count}} pending orders}}
&lt;/p&gt;

ng extract-i18n --output-path src/locale        # produces messages.xlf for translation
ng build --localize                              # one optimised bundle PER locale</code></pre>
<pre><code>// Runtime alternative (Transloco / ngx-translate) when locale must switch without reload
{{ 'orders.title' | transloco }}
&lt;!-- Trade-off: translations load at runtime, so a slightly larger bundle and a
     flash of untranslated content, but one build serves every locale. --&gt;</code></pre>
<p><strong>Accessibility — the things that actually get flagged in an audit:</strong></p>
<pre><code>&lt;!-- Semantic HTML first: a button IS focusable, keyboard-activatable and announced --&gt;
&lt;button (click)="cancel()"&gt;Cancel&lt;/button&gt;          &lt;!-- ✔ --&gt;
&lt;div (click)="cancel()"&gt;Cancel&lt;/div&gt;                &lt;!-- ✘ invisible to keyboard and screen readers --&gt;

&lt;!-- Labels, not placeholders --&gt;
&lt;label for="email"&gt;Email&lt;/label&gt;
&lt;input id="email" [attr.aria-invalid]="form.controls.email.invalid"
       aria-describedby="email-error"&gt;
&lt;span id="email-error" role="alert" *ngIf="form.controls.email.invalid"&gt;
  Enter a valid email
&lt;/span&gt;

&lt;!-- Announce async changes: a screen reader never sees a silent DOM update --&gt;
&lt;div aria-live="polite"&gt;{{ statusMessage }}&lt;/div&gt;

&lt;!-- Route changes must move focus, or keyboard users stay at the old position --&gt;
&lt;h1 tabindex="-1" #pageHeading&gt;{{ title }}&lt;/h1&gt;</code></pre>
<p><strong>The point worth making about i18n:</strong> it is not just text. Date, number and currency formats, plural rules (Arabic has six plural forms), text direction for RTL languages, and text expansion — German is routinely 30% longer than English, which breaks fixed-width layouts. Use the built-in <code>date</code>, <code>number</code> and <code>currency</code> pipes with a locale rather than hand-formatting.</p>
<p><strong>On accessibility:</strong> Angular CDK's <code>a11y</code> module gives you <code>FocusTrap</code>, <code>LiveAnnouncer</code> and focus monitoring, which handle the hard parts of dialogs and dynamic content. Test with axe or Lighthouse in CI, but also try navigating your own app with only the keyboard — that surfaces more real problems than any automated tool.</p>`
},
{
  q: "What are Angular's build optimisations and how do you analyse the bundle?",
  level: "advanced", tags: ["performance", "build"],
  a: `<pre><code># Build and inspect
ng build --configuration production --stats-json
npx source-map-explorer dist/app/browser/*.js
npx esbuild-visualizer --metadata dist/stats.json</code></pre>
<pre><code>// angular.json — budgets fail the BUILD on a size regression
"budgets": [
  { "type": "initial",            "maximumWarning": "500kb", "maximumError": "1mb" },
  { "type": "anyComponentStyle",  "maximumWarning": "4kb",   "maximumError": "8kb" }
]</code></pre>
<p><strong>What the production build already does:</strong> AOT compilation (templates compiled at build time, so no compiler ships to the browser), tree-shaking of unused exports, minification, dead-code elimination, and build-time optimisation of Angular-specific constructs. The esbuild/Vite-based builder (default since v17) is substantially faster than the old webpack one.</p>
<p><strong>What you control, in order of impact:</strong></p>
<ol>
<li><strong>Lazy load every feature route</strong> — <code>loadComponent</code>/<code>loadChildren</code>. This is the largest single lever; the initial bundle should contain only the first screen.</li>
<li><strong>Check what large dependencies you are importing.</strong> The bundle analyser almost always reveals one library dominating — a full icon set, moment.js, a chart library imported at the top level, or lodash imported wholesale rather than per-function.</li>
<li><strong>Standalone components</strong> — better tree-shaking than NgModules, since dependencies are declared per component.</li>
<li><strong>Preloading strategy</strong> — fetch lazy chunks during idle time so navigation feels instant without inflating the initial load:
<pre><code>provideRouter(routes, withPreloading(PreloadAllModules))
// or a custom strategy preloading only routes marked { data: { preload: true } }</code></pre></li>
<li><strong><code>NgOptimizedImage</code></strong> for responsive <code>srcset</code>, lazy loading and a priority hint on the LCP image — often the biggest Core Web Vitals win.</li>
<li><strong>Differential CSS</strong> — component styles are scoped and only shipped with their component; watch <code>anyComponentStyle</code> budgets.</li>
</ol>
<p><strong>Measure the right thing:</strong> bundle size is a proxy; what matters is Core Web Vitals — LCP, CLS and INP — from real users. Lighthouse in CI catches regressions, but field data (web-vitals reporting to your analytics) is what reflects actual experience on mid-range phones and slow networks.</p>`
}
]);
