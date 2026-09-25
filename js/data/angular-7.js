appendTopic("angular", [
{
  q: "Trace one click through Angular's change detection, with and without OnPush",
  level: "advanced", hot: true, tags: ["change-detection", "onpush", "signals", "must-know"],
  companies: ["Amazon", "SAP", "Infosys", "TCS", "Accenture", "Capgemini", "Cognizant"],
  a: `<p>Change detection is the one Angular topic where people recite the words without being able to trace an actual click. Do the trace.</p>
<pre><code>AppComponent  (Default)
 └─ HeaderComponent      (OnPush)
 └─ ListComponent        (Default)
     └─ RowComponent     (OnPush)   × 500
         └─ BadgeComponent (Default)

// You click a button inside ONE RowComponent.</code></pre>
<table>
<tr><th>Strategy</th><th>What gets checked</th></tr>
<tr><td><strong>All Default</strong></td><td><strong>Every component in the app</strong>, top to bottom — all 500 rows, all 500 badges, every binding</td></tr>
<tr><td><strong>As drawn above</strong></td><td>Angular marks the clicked Row and every <em>ancestor</em> dirty, then sweeps from the root. Header is OnPush and not dirty → <strong>skipped with its whole subtree</strong>. The other 499 OnPush rows → skipped. Only the clicked row and its Badge are checked</td></tr>
</table>
<p><strong>The rule in one sentence:</strong> an event inside a component marks it and all its ancestors dirty; the sweep then starts at the root and prunes any OnPush component that is not dirty, <em>along with everything beneath it</em>. That pruning of the subtree is where the performance comes from.</p>
<pre><code>// WHEN does an OnPush component get re-checked? Only these:
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class RowComponent {
  @Input() row!: Row;          // 1. an @Input CHANGES BY REFERENCE
                               // 2. an event fires from THIS component's template
                               // 3. an | async pipe in its template emits
                               // 4. you call markForCheck() yourself
}

// THE BUG THIS CAUSES, and it is the most common Angular bug there is:
this.row.name = "changed";         // SAME object reference -> OnPush sees nothing
this.row = { ...this.row, name: "changed" };   // new reference -> it updates

// Same trap with arrays:
this.items.push(newItem);          // invisible to an OnPush child
this.items = [...this.items, newItem];         // visible</code></pre>
<p>That is why OnPush and <strong>immutable updates</strong> are a package deal. Adopting OnPush while still mutating objects in place produces a component that updates <em>sometimes</em> — whenever something unrelated happens to trigger a check — which is far harder to debug than one that never updates.</p>
<pre><code>// Signals (16+) change the model entirely: fine-grained, no tree sweep.
export class RowComponent {
  row = input.required&lt;Row&gt;();                    // a signal input
  label = computed(() =&gt; this.row().name.toUpperCase());  // recomputes only
                                                           // when row() changes
  count = signal(0);
  bump() { this.count.update(c =&gt; c + 1); }       // marks ONLY the views that
}                                                  // actually read count()

// Zoneless (Angular 18+) drops zone.js entirely:
bootstrapApplication(App, { providers: [provideExperimentalZonelessChangeDetection()] });
// Nothing is patched, nothing sweeps. Updates come from signals, the async
// pipe and markForCheck. Smaller bundle, and no more "why did this run 40
// times" from a setInterval being monkey-patched.</code></pre>
<p><strong>What zone.js was doing all along:</strong> monkey-patching every async API — <code>setTimeout</code>, <code>addEventListener</code>, <code>fetch</code>, promises — so Angular could know something <em>might</em> have changed and run a check. It never knew <em>what</em> changed, only that something might have. Signals replace "something happened, re-check the world" with "this value changed, update exactly the views that read it".</p>`
},
{
  q: "Build a typed reactive form with cross-field validation and an async check",
  level: "advanced", hot: true, tags: ["forms", "validation", "rxjs", "must-know"],
  companies: ["Amazon", "SAP", "Infosys", "TCS", "Wipro", "Accenture", "Capgemini"],
  a: `<p>"Have you used reactive forms" is a yes/no. The real question is whether you can validate <em>across</em> fields and hit a server without hammering it.</p>
<pre><code>// TYPED (Angular 14+): the generic is inferred, so form.value is typed
// and a typo in a control name is a COMPILE error, not a runtime undefined.
signupForm = this.fb.nonNullable.group({
    email:   ["", [Validators.required, Validators.email],
                  [this.emailTakenValidator()]],        // 3rd slot = ASYNC
    password: ["", [Validators.required, Validators.minLength(8)]],
    confirm:  ["", Validators.required],
    age:      [0,  [Validators.min(18)]]
}, {
    validators: passwordsMatch                          // GROUP-level: sees siblings
});

// CROSS-FIELD: must live on the GROUP. A validator on "confirm" alone
// cannot see "password" - that is the whole reason group validators exist.
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get("password")?.value;
    const confirm = group.get("confirm")?.value;
    if (!confirm) return null;                 // let "required" report emptiness
    return pass === confirm ? null : { mismatch: true };
}</code></pre>
<pre><code>// ASYNC VALIDATOR, debounced - without the debounce you fire a request
// per keystroke and the server rate-limits you.
emailTakenValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable&lt;ValidationErrors | null&gt; =&gt; {
        if (!control.value) return of(null);
        return timer(400).pipe(                 // wait for a pause in typing
            switchMap(() =&gt; this.api.checkEmail(control.value)),  // cancels
            map(taken =&gt; (taken ? { emailTaken: true } : null)),  // the previous
            catchError(() =&gt; of(null))          // a dead API must not block
        );                                       // the user from submitting
    };
}</code></pre>
<p><strong><code>switchMap</code> is doing real work here.</strong> Type "a", "ab", "abc" quickly and three requests start; <code>switchMap</code> cancels the first two, so a slow response for "a" can never arrive last and overwrite the answer for "abc". <code>mergeMap</code> there is a genuine race condition — and it is the difference the interviewer is listening for.</p>
<table>
<tr><th>Control state</th><th>Means</th><th>Use it for</th></tr>
<tr><td><code>touched</code></td><td>Has been focused and blurred</td><td><strong>Only show errors once touched</strong> — never shout at an untouched form</td></tr>
<tr><td><code>dirty</code></td><td>The value has been changed</td><td>"Discard unsaved changes?" guards</td></tr>
<tr><td><code>pending</code></td><td>An async validator is in flight</td><td>Show a spinner; disable submit</td></tr>
<tr><td><code>invalid</code></td><td>Some validator failed</td><td>Block submission</td></tr>
</table>
<pre><code>&lt;!-- The template half. Note touched: errors appear when the user has
     had a chance to type, not the moment the page loads. --&gt;
&lt;input formControlName="email" [class.err]="showError('email')" /&gt;
&#64;if (showError('email')) {
  &lt;p class="hint"&gt;
    &#64;if (f.email.errors?.['required']) { Email is required }
    &#64;if (f.email.errors?.['email']) { That does not look like an email }
    &#64;if (f.email.errors?.['emailTaken']) { That email is already registered }
  &lt;/p&gt;
}
&#64;if (f.email.pending) { &lt;span class="spinner"&gt;&lt;/span&gt; }

// showError(name) { const c = this.f[name]; return c.invalid && c.touched; }</code></pre>
<p><strong>Reactive or template-driven?</strong> Template-driven is fine for a login box. Reactive wins the moment you need cross-field rules, async validation, dynamic controls, or to unit test the form without rendering it — and being testable in isolation is the argument that usually settles it.</p>`
},
{
  q: "Which RxJS operator, and why — with the bug each wrong choice causes",
  level: "advanced", hot: true, tags: ["rxjs", "operators", "must-know"],
  companies: ["Amazon", "SAP", "Infosys", "TCS", "Wipro", "Accenture", "Adobe"],
  a: `<p>Everyone lists the four flattening operators. The question is which one you pick for a given job, and what breaks if you pick wrong.</p>
<table>
<tr><th>Operator</th><th>On a new value</th><th>Correct for</th><th>Bug if misused</th></tr>
<tr><td><strong>switchMap</strong></td><td><strong>Cancels</strong> the in-flight one</td><td>Search-as-you-type, route params, autocomplete</td><td>Used for saves → a slow save is silently cancelled and the write is lost</td></tr>
<tr><td><strong>mergeMap</strong></td><td>Runs both concurrently</td><td>Independent work: upload 5 files at once</td><td>Used for search → responses arrive out of order and the stale one wins</td></tr>
<tr><td><strong>concatMap</strong></td><td><strong>Queues</strong>, strict order</td><td>Ordered writes, sequential saves</td><td>Used for search → every keystroke's request still runs, queued behind the rest</td></tr>
<tr><td><strong>exhaustMap</strong></td><td><strong>Ignores</strong> new ones while busy</td><td>Submit buttons, login</td><td>Used for search → ignores everything typed after the first character</td></tr>
</table>
<pre><code>// THE RACE, made concrete. User types "ab" then "abc".
//   request("ab")  takes 800ms
//   request("abc") takes 100ms

// mergeMap:   abc arrives at 100ms, ab arrives at 800ms -> the box shows
//             results for "ab" while the input reads "abc". WRONG.
// switchMap:  the "ab" request is cancelled the moment "abc" is typed.
//             Only the latest can ever win. CORRECT.

search = this.queryControl.valueChanges.pipe(
    debounceTime(300),              // wait for a pause
    distinctUntilChanged(),         // ignore "same text again"
    filter(q =&gt; q.length &gt;= 2),     // do not search on one letter
    switchMap(q =&gt; this.api.search(q).pipe(
        catchError(() =&gt; of([]))    // INSIDE the switchMap: one failed search
    )),                             // must not kill the outer stream
    shareReplay({ bufferSize: 1, refCount: true })
);</code></pre>
<p><strong>Where <code>catchError</code> sits is not cosmetic.</strong> Placed on the outer pipe, the first failed request completes the whole stream and the search box is dead until the page reloads. Placed inside the <code>switchMap</code>, only that one inner observable fails and the next keystroke works normally. This is the most common RxJS mistake in production Angular.</p>
<pre><code>// MEMORY LEAKS: a subscription outlives the component unless you end it.
export class Cmp implements OnInit {
    private destroyRef = inject(DestroyRef);        // Angular 16+

    ngOnInit() {
        this.service.poll().pipe(
            takeUntilDestroyed(this.destroyRef)     // cleanest available
        ).subscribe(v =&gt; this.value = v);
    }
}

// Best of all: do not subscribe manually. The async pipe subscribes,
// unsubscribes and marks OnPush components for check, all for free.
// &lt;div&gt;{{ data$ | async }}&lt;/div&gt;</code></pre>
<p><strong>Hot vs cold, in one line:</strong> an HTTP observable is <em>cold</em> — it does nothing until subscribed, and each subscriber fires its own request. Two <code>| async</code> pipes on the same <code>data$</code> means two HTTP calls. <code>shareReplay</code> fixes that, but use <code>refCount: true</code> or the subscription never releases and you have built a cache that never expires.</p>`
}
]);
