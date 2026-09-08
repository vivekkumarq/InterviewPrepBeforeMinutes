appendTopic("angular", [
{
  q: "Reactive forms vs template-driven — and how do you build a dynamic form with custom validation?",
  level: "advanced", hot: true, tags: ["forms", "validation", "rxjs"],
  companies: ["Optum", "Cognizant", "Infosys", "Capgemini", "EPAM", "Accenture", "Wipro", "Deloitte"],
  a: `<table>
<tr><th></th><th>Reactive</th><th>Template-driven</th></tr>
<tr><td>Model defined in</td><td>The component class</td><td>The template</td></tr>
<tr><td>Validation</td><td>Functions, composable and unit-testable</td><td>Directives in the markup</td></tr>
<tr><td>Dynamic fields</td><td><strong>Natural</strong> — <code>FormArray</code></td><td>Awkward</td></tr>
<tr><td>Testable without the DOM</td><td><strong>Yes</strong></td><td>No</td></tr>
<tr><td>Synchronous access to values</td><td>Yes</td><td>No — updates are async</td></tr>
<tr><td>Use for</td><td>Anything beyond trivial</td><td>A two-field login box</td></tr>
</table>
<pre><code>// Typed reactive forms (Angular 14+) — the type flows all the way through
form = this.fb.group({
  email:    this.fb.control('', { validators: [Validators.required, Validators.email],
                                  asyncValidators: [this.emailTaken()],
                                  updateOn: 'blur' }),      // do not hit the server per keystroke
  password: ['', [Validators.required, Validators.minLength(8), strongPassword()]],
  confirm:  ['', Validators.required],
  addresses: this.fb.array([this.addressGroup()])           // DYNAMIC list
}, { validators: passwordsMatch });                          // CROSS-FIELD, on the group

get addresses() { return this.form.controls.addresses; }
addAddress()    { this.addresses.push(this.addressGroup()); }
removeAddress(i: number) { this.addresses.removeAt(i); }</code></pre>
<pre><code>// A custom SYNCHRONOUS validator — a pure function, trivially unit-testable
export function strongPassword(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v = c.value as string;
    if (!v) return null;                                  // let 'required' own emptiness
    const ok = /[A-Z]/.test(v) && /[a-z]/.test(v) && /\\d/.test(v) && /[^\\w]/.test(v);
    return ok ? null : { weakPassword: { needs: 'upper, lower, digit, symbol' } };
  };
}

// CROSS-FIELD — applied to the GROUP, not to either control
const passwordsMatch: ValidatorFn = (g) =&gt;
  g.get('password')!.value === g.get('confirm')!.value ? null : { mismatch: true };

// ASYNC — debounced, and switchMap so a stale response cannot win
emailTaken(): AsyncValidatorFn {
  return (c) =&gt; timer(300).pipe(
    switchMap(() =&gt; this.api.emailExists(c.value)),
    map(exists =&gt; (exists ? { emailTaken: true } : null)),
    catchError(() =&gt; of(null)),        // a network failure must not block the form
    first()                             // async validators MUST complete
  );
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Form control state flags and when each becomes true">
  <rect class="dg-fill" x="16" y="26" width="140" height="34" rx="6"/><text class="dg-s" x="86" y="48" text-anchor="middle">pristine → dirty</text>
  <text class="dg-s" x="86" y="76" text-anchor="middle">value changed</text>
  <rect class="dg-fill" x="176" y="26" width="140" height="34" rx="6"/><text class="dg-s" x="246" y="48" text-anchor="middle">untouched → touched</text>
  <text class="dg-s" x="246" y="76" text-anchor="middle">blurred</text>
  <rect class="dg-fill2" x="336" y="26" width="140" height="34" rx="6"/><text class="dg-s" x="406" y="48" text-anchor="middle">valid / invalid</text>
  <text class="dg-s" x="406" y="76" text-anchor="middle">validators ran</text>
  <rect class="dg-box" x="496" y="26" width="108" height="34" rx="6"/><text class="dg-s" x="550" y="48" text-anchor="middle">pending</text>
  <text class="dg-s" x="550" y="76" text-anchor="middle">async running</text>
  <text class="dg-s" x="16" y="118">show an error only when (invalid &amp;&amp; (dirty || touched)) — otherwise a fresh</text>
  <text class="dg-s" x="16" y="138">form is red before the user has typed anything</text>
</svg>
</figure>
<pre><code>&lt;!-- Error display that does not shout at the user immediately --&gt;
&#64;if (form.controls.email.invalid &amp;&amp; (form.controls.email.dirty || form.controls.email.touched)) {
  &#64;if (form.controls.email.hasError('required')) { &lt;span&gt;Email is required&lt;/span&gt; }
  &#64;if (form.controls.email.hasError('email'))    { &lt;span&gt;Enter a valid email&lt;/span&gt; }
  &#64;if (form.controls.email.hasError('emailTaken')) { &lt;span&gt;Already registered&lt;/span&gt; }
}
&#64;if (form.controls.email.pending) { &lt;app-spinner /&gt; }

&lt;button [disabled]="form.invalid || form.pending || submitting()"&gt;Save&lt;/button&gt;</code></pre>
<table>
<tr><th>Trap</th><th>Fix</th></tr>
<tr><td>Async validator on every keystroke</td><td><code>updateOn: 'blur'</code> plus a <code>timer</code> debounce</td></tr>
<tr><td>Async validator never completes</td><td>Add <code>first()</code> — the form stays <code>pending</code> forever otherwise</td></tr>
<tr><td><code>disable()</code> removes the value from <code>form.value</code></td><td>Use <code>form.getRawValue()</code> when you need disabled fields too</td></tr>
<tr><td><code>setValue</code> requires every control</td><td><code>patchValue</code> for partial updates</td></tr>
<tr><td>Double submission</td><td>Disable on submit, or <code>exhaustMap</code> on the click stream</td></tr>
<tr><td>Client validation treated as security</td><td>It is UX only — <strong>always re-validate on the server</strong></td></tr>
</table>
<p><strong>The point to close on:</strong> "Reactive forms make validation a set of pure functions I can unit test without rendering anything, and <code>FormArray</code> makes dynamic sections straightforward. Template-driven forms push all of that into markup, where it cannot be tested or reused — so I only use them for something genuinely trivial."</p>`
},
{
  q: "How do you optimise Angular bundle size and initial load performance?",
  level: "advanced", tags: ["performance", "build", "ssr"],
  companies: ["Optum", "Cognizant", "EPAM", "Infosys", "Adobe", "SAP", "Publicis Sapient"],
  a: `<pre><code>// 1. LAZY LOAD every route that is not the landing page
export const routes: Routes = [
  { path: '', component: HomeComponent },                       // eager
  { path: 'admin',
    loadChildren: () =&gt; import('./admin/routes').then(m =&gt; m.ADMIN_ROUTES),
    canMatch: [adminGuard] },                                   // canMatch — the chunk is
  { path: 'reports',                                             // never even fetched if
    loadComponent: () =&gt; import('./reports/reports.component')   // the guard fails
      .then(m =&gt; m.ReportsComponent) }
];
// canMatch rather than canActivate matters: canActivate downloads the chunk
// and THEN rejects, so an unauthorised user still pays the download.</code></pre>
<table>
<tr><th>Technique</th><th>Typical impact</th></tr>
<tr><td><strong>Route-level lazy loading</strong></td><td>The biggest single win — initial bundle drops to what the first screen needs</td></tr>
<tr><td>Standalone components</td><td>Real tree-shaking; no NgModule dragging in unused declarations</td></tr>
<tr><td><code>&#64;defer</code> blocks (v17+)</td><td>Defer heavy below-the-fold widgets — charts, maps, editors</td></tr>
<tr><td>Drop heavy dependencies</td><td>Moment.js → date-fns or <code>Intl</code>; lodash → per-function imports</td></tr>
<tr><td>OnPush + signals</td><td>Runtime, not size — far fewer change-detection cycles</td></tr>
<tr><td>SSR / prerender</td><td>Much better LCP and FCP; the user sees content before hydration</td></tr>
<tr><td>Image directive <code>NgOptimizedImage</code></td><td>Lazy loading, correct sizing, priority hints for the LCP image</td></tr>
<tr><td>Budgets in <code>angular.json</code></td><td>The build FAILS when a bundle grows — prevention, not archaeology</td></tr>
</table>
<pre><code>&lt;!-- @defer — declarative code splitting at the template level --&gt;
&#64;defer (on viewport; prefetch on idle) {
  &lt;app-analytics-chart [data]="data()" /&gt;      &lt;!-- heavy charting library --&gt;
} &#64;placeholder (minimum 500ms) {
  &lt;div class="skeleton"&gt;&lt;/div&gt;
} &#64;loading (after 100ms; minimum 300ms) {
  &lt;app-spinner /&gt;
} &#64;error {
  &lt;p&gt;Could not load the chart&lt;/p&gt;
}
&lt;!-- triggers: on idle | on viewport | on interaction | on hover | on timer | when expr --&gt;</code></pre>
<pre><code>// Build budgets — fail the build rather than discover it in production
"budgets": [
  { "type": "initial",         "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle","maximumWarning": "4kB",  "maximumError": "8kB" }
]

# Find what is actually large before optimising anything
ng build --stats-json
npx webpack-bundle-analyzer dist/app/stats.json
# The usual surprises: a whole icon set, moment locales, a charting library
# imported for one sparkline, or a dev-only dependency in the production build.</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Initial bundle shrinking as routes are split into lazy chunks">
  <text class="dg-s" x="16" y="20">before</text>
  <rect class="dg-fill" x="16" y="28" width="420" height="28" rx="4"/><text class="dg-s" x="226" y="47" text-anchor="middle">one bundle — 2.1 MB</text>
  <text class="dg-s" x="16" y="82">after</text>
  <rect class="dg-fill2" x="16" y="90" width="120" height="28" rx="4"/><text class="dg-s" x="76" y="109" text-anchor="middle">initial 380 kB</text>
  <rect class="dg-box" x="142" y="90" width="90" height="28" rx="4"/><text class="dg-s" x="187" y="109" text-anchor="middle">admin</text>
  <rect class="dg-box" x="238" y="90" width="90" height="28" rx="4"/><text class="dg-s" x="283" y="109" text-anchor="middle">reports</text>
  <rect class="dg-box" x="334" y="90" width="102" height="28" rx="4"/><text class="dg-s" x="385" y="109" text-anchor="middle">charts (defer)</text>
  <text class="dg-s" x="460" y="109">fetched on demand</text>
  <text class="dg-s" x="16" y="142">measure with Lighthouse and real-user metrics, not with a local build on a fast laptop</text>
</svg>
</figure>
<p><strong>What to measure, and in which order:</strong> LCP (does content appear?), then INP (does interaction respond?), then CLS (does the layout jump?). Bundle size matters because it drives LCP on a slow connection — it is a proxy, not the goal. A 300 kB bundle that blocks rendering on a synchronous API call is worse than a 600 kB one that paints immediately.</p>
<p><strong>The framing:</strong> "I start from a Lighthouse trace on a throttled connection rather than from a bundle size target, because the fix depends on the bottleneck. If it is download size, I split routes and defer heavy widgets; if it is time-to-first-byte, SSR helps; if it is a slow API, no amount of bundling work will fix it."</p>`
}
]);
