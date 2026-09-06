appendTopic("angular", [
{
  q: "What is content projection and how do ng-content, ng-template and ng-container differ?",
  level: "advanced", tags: ["components", "templates"],
  a: `<pre><code>&lt;!-- Card component template: slots for projected content --&gt;
&lt;div class="card"&gt;
  &lt;header&gt;&lt;ng-content select="[card-title]"&gt;&lt;/ng-content&gt;&lt;/header&gt;
  &lt;div class="body"&gt;&lt;ng-content&gt;&lt;/ng-content&gt;&lt;/div&gt;          &lt;!-- default slot --&gt;
  &lt;footer&gt;&lt;ng-content select="app-actions"&gt;&lt;/ng-content&gt;&lt;/footer&gt;
&lt;/div&gt;

&lt;!-- Usage --&gt;
&lt;app-card&gt;
  &lt;h2 card-title&gt;Order ORD-42&lt;/h2&gt;
  &lt;p&gt;Everything else lands in the default slot.&lt;/p&gt;
  &lt;app-actions&gt;&lt;button&gt;Cancel&lt;/button&gt;&lt;/app-actions&gt;
&lt;/app-card&gt;</code></pre>
<table>
<tr><th>Element</th><th>Purpose</th><th>Renders a DOM element?</th></tr>
<tr><td><code>&lt;ng-content&gt;</code></td><td>A projection slot — where the parent's content is placed</td><td>No</td></tr>
<tr><td><code>&lt;ng-template&gt;</code></td><td>A template that is <em>not</em> rendered until instantiated</td><td>No — inert by default</td></tr>
<tr><td><code>&lt;ng-container&gt;</code></td><td>A logical grouping element for directives</td><td>No — avoids a wrapper <code>div</code></td></tr>
</table>
<pre><code>&lt;!-- ng-container: apply structural logic without polluting the DOM --&gt;
&lt;ng-container *ngIf="order"&gt;
  &lt;td&gt;{{ order.reference }}&lt;/td&gt;      &lt;!-- a div here would break the table --&gt;
  &lt;td&gt;{{ order.total }}&lt;/td&gt;
&lt;/ng-container&gt;

&lt;!-- ng-template: reusable, parameterised, rendered on demand --&gt;
&lt;ng-template #empty&gt;&lt;p&gt;No orders yet&lt;/p&gt;&lt;/ng-template&gt;
&lt;div *ngIf="orders.length; else empty"&gt;...&lt;/div&gt;

&lt;!-- Passing a template INTO a component — the customisation escape hatch --&gt;
&lt;app-table [rowTemplate]="customRow"&gt;&lt;/app-table&gt;
&lt;ng-template #customRow let-order&gt;&lt;strong&gt;{{ order.reference }}&lt;/strong&gt;&lt;/ng-template&gt;</code></pre>
<p><strong>Why content projection matters:</strong> it lets you build genuinely reusable components. Without it, a card component would need an input for every possible piece of content and would grow a new <code>@Input</code> for every use case. With projection, the consumer supplies the markup and the component supplies the structure and behaviour.</p>
<p><strong>The <code>ng-template</code> point worth making:</strong> <code>*ngIf</code> and <code>*ngFor</code> are syntactic sugar that Angular desugars into <code>&lt;ng-template&gt;</code> — the asterisk is the giveaway. Understanding that explains why a structural directive can only appear once per element.</p>`
},
{
  q: "How do custom directives and pipes work?",
  level: "advanced", tags: ["directives", "pipes"],
  a: `<pre><code>// Attribute directive — changes appearance or behaviour of an element
@Directive({ selector: '[appAutofocus]', standalone: true })
export class AutofocusDirective implements AfterViewInit {
  private el = inject(ElementRef&lt;HTMLElement&gt;);
  delay = input(0, { alias: 'appAutofocus' });

  ngAfterViewInit() {
    setTimeout(() =&gt; this.el.nativeElement.focus(), this.delay());
  }
}
// &lt;input appAutofocus&gt;

// Structural directive — adds or removes elements
@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective {
  private tpl = inject(TemplateRef&lt;unknown&gt;);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);

  @Input() set appHasRole(role: string) {
    this.vcr.clear();
    if (this.auth.hasRole(role)) this.vcr.createEmbeddedView(this.tpl);
  }
}
// &lt;button *appHasRole="'ADMIN'"&gt;Delete&lt;/button&gt;</code></pre>
<pre><code>// PURE pipe (default) — recalculates only when the INPUT REFERENCE changes
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null, currency = 'INR'): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);
  }
}
// {{ order.total | money:'USD' }}</code></pre>
<p><strong>The performance point about pipes:</strong> a <strong>pure</strong> pipe is memoised — Angular calls <code>transform</code> only when the input reference changes, so it is far cheaper than calling a method in the template (which runs on every change detection cycle). An <strong>impure</strong> pipe (<code>pure: false</code>) runs on <em>every</em> cycle and should be avoided; the built-in <code>async</code> pipe is the notable justified exception.</p>
<pre><code>&lt;!-- ✘ runs on every change detection cycle --&gt;
{{ formatMoney(order.total) }}
&lt;!-- ✔ memoised --&gt;
{{ order.total | money }}</code></pre>
<p><strong>Security note worth raising:</strong> a directive writing to <code>innerHTML</code> bypasses Angular's built-in sanitisation. Use the <code>Renderer2</code> API rather than touching <code>nativeElement</code> directly where possible — it also keeps the directive working with server-side rendering, where the DOM does not exist.</p>`
},
{
  q: "How does Angular handle server-side rendering and hydration?",
  level: "advanced", tags: ["ssr", "performance"],
  a: `<pre><code>ng add @angular/ssr

// main.server.ts / app.config.server.ts
bootstrapApplication(AppComponent, {
  providers: [provideServerRendering(), provideClientHydration(
    withIncrementalHydration(),       // v19: hydrate components on interaction/viewport
    withEventReplay()                 // replay clicks that happened before hydration
  )]
});</code></pre>
<p><strong>What SSR gives you:</strong> the server renders the initial HTML, so the browser paints real content immediately instead of an empty <code>&lt;app-root&gt;</code>. That improves First Contentful Paint and Largest Contentful Paint, and makes the page indexable by crawlers that do not execute JavaScript.</p>
<p><strong>Hydration</strong> is the follow-up step: Angular reuses the server-rendered DOM rather than destroying and re-creating it. Before hydration existed, SSR caused a visible flicker as Angular threw away the server HTML — which largely negated the benefit.</p>
<p><strong>The constraints SSR imposes on your code — this is the practical content:</strong></p>
<ul>
<li><strong>No direct DOM or browser API access</strong> during rendering — <code>window</code>, <code>document</code>, <code>localStorage</code> do not exist on the server:
<pre><code>private platformId = inject(PLATFORM_ID);
ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    localStorage.getItem('token');           // browser only
  }
}</code></pre></li>
<li><strong><code>setTimeout</code> and <code>setInterval</code> keep the server waiting</strong> — clean them up, or the response hangs.</li>
<li><strong>State transfer</strong> — without it the client re-fetches everything the server already loaded, doubling the API calls. <code>provideClientHydration()</code> includes HTTP transfer cache by default in recent versions.</li>
<li><strong>Memory and CPU cost on the server</strong> — rendering is per request, so SSR needs capacity planning and caching that a static SPA does not.</li>
</ul>
<p><strong>Also worth naming:</strong> <strong>SSG</strong> (prerendering at build time) is better than SSR for content that does not change per user — it is a static file with zero server cost. Angular supports both, and choosing prerendering where possible is usually the right answer for marketing pages, docs and blogs.</p>`
},
{
  q: "What are the Angular security features you should know?",
  level: "advanced", hot: true, tags: ["security"],
  a: `<p><strong>Angular sanitises by default</strong> — interpolation escapes HTML, so <code>{{ userInput }}</code> can never inject markup. That covers the majority of XSS risk automatically.</p>
<pre><code>&lt;!-- Safe: escaped --&gt;
&lt;div&gt;{{ userComment }}&lt;/div&gt;

&lt;!-- Sanitised: Angular strips script tags and dangerous attributes --&gt;
&lt;div [innerHTML]="userComment"&gt;&lt;/div&gt;

&lt;!-- DANGEROUS: bypasses sanitisation entirely --&gt;
&lt;div [innerHTML]="trusted"&gt;&lt;/div&gt;
this.trusted = this.sanitizer.bypassSecurityTrustHtml(userInput);   // review every use</code></pre>
<p><strong>Security contexts Angular understands:</strong> HTML, style, URL, resource URL and script. <code>bypassSecurityTrust*</code> should be treated as a code-review flag — it is occasionally necessary (rendering a trusted rich-text field), and it is exactly how XSS gets reintroduced.</p>
<pre><code>// XSRF protection — built in for cookie-based auth
provideHttpClient(withXsrfConfiguration({
  cookieName: 'XSRF-TOKEN',
  headerName: 'X-XSRF-TOKEN'
}))
// Angular reads the cookie and sets the header on mutating requests automatically;
// the server compares them. Requires the cookie to be readable by JS (not HttpOnly).</code></pre>
<p><strong>Other practices worth listing:</strong></p>
<ul>
<li><strong>Never build templates by string concatenation</strong> — offline template compilation (AOT, the default) prevents template injection entirely.</li>
<li><strong>Content Security Policy</strong> as defence in depth; Angular supports strict CSP with nonces.</li>
<li><strong>Do not store JWTs in <code>localStorage</code></strong> if you can avoid it — any XSS reads them. An <code>HttpOnly</code> cookie plus XSRF protection is the safer combination.</li>
<li><strong>Route guards are UX, not security</strong> — they hide a route, they do not protect data. Every check must be enforced server-side; a user can always call the API directly.</li>
<li><strong>Never put secrets in the frontend bundle</strong> — <code>environment.ts</code> is shipped to the browser and trivially readable.</li>
<li><strong>Keep dependencies patched</strong> — <code>npm audit</code> in CI; most frontend vulnerabilities arrive through transitive packages.</li>
</ul>`
},
{
  q: "How do you structure a large Angular application?",
  level: "advanced", tags: ["architecture"],
  a: `<pre><code>src/app/
├── core/                      # singletons, loaded once: interceptors, guards, auth
│   ├── auth/
│   ├── interceptors/
│   └── error/
├── shared/                    # dumb, reusable: UI components, pipes, directives
│   ├── ui/
│   └── pipes/
├── features/                  # one folder per business capability, LAZY LOADED
│   ├── orders/
│   │   ├── data-access/       # services, state, HTTP — the only place API calls live
│   │   ├── feature/           # smart/routed components
│   │   ├── ui/                # presentational components for this feature
│   │   └── orders.routes.ts
│   └── customers/
└── app.routes.ts</code></pre>
<p><strong>The organising principles:</strong></p>
<ol>
<li><strong>Group by feature, not by type.</strong> A folder of 200 components is unnavigable; a change to "orders" should touch one folder, not five.</li>
<li><strong>Lazy load every feature route</strong> — <code>loadChildren</code>/<code>loadComponent</code> — so the initial bundle contains only what the first screen needs. This is the single biggest performance lever in a large Angular app.</li>
<li><strong>Separate smart from presentational components.</strong> Smart components inject services and hold state; presentational ones take inputs and emit outputs, have no dependencies, and are trivially testable and reusable.</li>
<li><strong>All HTTP lives in <code>data-access</code>.</strong> Components never call <code>HttpClient</code> directly — that keeps caching, error handling and retries in one place.</li>
<li><strong>Enforce boundaries.</strong> Features must not import from each other; shared code goes to <code>shared</code>, cross-feature communication goes through <code>core</code> or a router navigation. ESLint boundary rules or Nx tags make this a build failure rather than a code-review comment.</li>
</ol>
<p><strong>For genuinely large applications</strong>, mention an <strong>Nx monorepo</strong> with libraries per feature and enforced dependency constraints — it gives you affected-project builds, so CI only tests what changed, and the module boundaries are checked automatically.</p>
<p><strong>The modern additions:</strong> standalone components remove <code>NgModule</code> boilerplate entirely, and signals in a feature-level service are now the simplest state management for most cases — reach for NgRx only when shared state complexity genuinely justifies the ceremony.</p>`
}
]);
