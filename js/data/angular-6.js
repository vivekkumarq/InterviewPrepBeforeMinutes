appendTopic("angular", [
{
  q: "How do you manage state in a modern Angular application?",
  level: "advanced", hot: true, tags: ["state", "signals", "rxjs", "architecture"],
  companies: ["Optum", "Cognizant", "EPAM", "Infosys", "Capgemini", "Accenture", "Deloitte", "SAP"],
  a: `<table>
<tr><th>Scope</th><th>Use</th></tr>
<tr><td>One component</td><td><code>signal()</code> in the component</td></tr>
<tr><td>A feature, shared by a few components</td><td>A service with signals — the default answer</td></tr>
<tr><td>Server data</td><td>A query library, or <code>httpResource</code>; it is a <em>cache</em>, not state</td></tr>
<tr><td>Global, complex, needs time-travel</td><td>NgRx — and only then</td></tr>
<tr><td>URL-worthy state (filters, tab, page)</td><td><strong>Query parameters</strong> — shareable and back-button correct</td></tr>
</table>
<pre><code>// A signal store — enough for most features, no library required
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal&lt;CartItem[]&gt;([]);

  readonly items = this._items.asReadonly();                 // expose read-only
  readonly count = computed(() =&gt; this.items().length);      // derived, memoised
  readonly total = computed(() =&gt;
    this.items().reduce((s, i) =&gt; s + i.price * i.qty, 0));

  add(item: CartItem) {
    this._items.update(list =&gt; [...list, item]);              // NEW array reference
  }
  remove(id: string) {
    this._items.update(list =&gt; list.filter(i =&gt; i.id !== id));
  }
}
// computed() only recomputes when a dependency it actually READ has changed,
// and it is glitch-free — no intermediate inconsistent value is ever observed.</code></pre>
<table>
<tr><th></th><th>Signals</th><th>RxJS</th></tr>
<tr><td>Model</td><td>A value that changes over time</td><td>A stream of events over time</td></tr>
<tr><td>Reading</td><td>Synchronous, always has a value</td><td>Asynchronous, may not have emitted</td></tr>
<tr><td>Best for</td><td><strong>State</strong> and derived state</td><td><strong>Events</strong>: HTTP, websockets, user input over time</td></tr>
<tr><td>Operators</td><td><code>computed</code>, <code>effect</code></td><td>debounce, switchMap, retry, combineLatest…</td></tr>
<tr><td>Change detection</td><td>Fine-grained — marks only readers</td><td>Needs the <code>async</code> pipe or manual subscription</td></tr>
</table>
<pre><code>// They interoperate, and the right answer is usually BOTH
readonly query = signal('');
readonly results = toSignal(                     // stream -> signal
  toObservable(this.query).pipe(                 // signal -> stream
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q =&gt; this.api.search(q))           // RxJS for the async plumbing
  ), { initialValue: [] }                        // signals for the state
);</code></pre>
<p><strong>When NgRx is genuinely worth it:</strong> many components mutating shared state, a need for an auditable action log, optimistic updates with rollback, or a large team that benefits from one enforced pattern. The cost is real — actions, reducers, effects and selectors for every slice, which is a lot of ceremony for a form and a list.</p>
<p><strong>The question to ask first:</strong> "Is this actually state, or is it a cache of server data?" Most 'state management' problems are really server-cache problems — loading flags, staleness, refetching, invalidation — and a query library solves those directly, whereas a store makes you hand-write all of it.</p>`
},
{
  q: "How do you test an Angular application?",
  level: "advanced", tags: ["testing", "angular", "best-practice"],
  companies: ["Optum", "Cognizant", "EPAM", "Infosys", "Capgemini", "Accenture", "Wipro"],
  a: `<pre><code>// A component test — assert what the USER sees, not internal fields
describe('OrderListComponent', () =&gt; {
  let fixture: ComponentFixture&lt;OrderListComponent&gt;;
  let api: jasmine.SpyObj&lt;OrderApi&gt;;

  beforeEach(async () =&gt; {
    api = jasmine.createSpyObj('OrderApi', ['list']);
    await TestBed.configureTestingModule({
      imports: [OrderListComponent],                 // standalone: IMPORT it
      providers: [{ provide: OrderApi, useValue: api }]
    }).compileComponents();
    fixture = TestBed.createComponent(OrderListComponent);
  });

  it('shows an empty state when there are no orders', () =&gt; {
    api.list.and.returnValue(of([]));
    fixture.detectChanges();                          // trigger change detection
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No orders yet');
  });
});</code></pre>
<pre><code>// HTTP — HttpTestingController, never a real request
const http = TestBed.inject(HttpTestingController);
service.load(42).subscribe(o =&gt; expect(o.id).toBe(42));

const req = http.expectOne('/api/orders/42');
expect(req.request.method).toBe('GET');
req.flush({ id: 42 });                    // or req.flush(null, {status: 500, ...})
http.verify();                             // fails if anything was NOT flushed</code></pre>
<table>
<tr><th>Level</th><th>Tool</th><th>Test</th></tr>
<tr><td>Pure logic — pipes, validators, utils</td><td>Plain Jasmine/Vitest</td><td>No TestBed needed; these are just functions</td></tr>
<tr><td>Service</td><td>TestBed + <code>HttpTestingController</code></td><td>Mapping, error handling, retries</td></tr>
<tr><td>Component</td><td>TestBed + a fixture</td><td>Rendered output and user interaction</td></tr>
<tr><td>Component (visual)</td><td>Storybook</td><td>States in isolation</td></tr>
<tr><td>End to end</td><td><strong>Playwright</strong> or Cypress</td><td>A few critical journeys only</td></tr>
</table>
<table>
<tr><th>Pitfall</th><th>Fix</th></tr>
<tr><td>Forgetting <code>detectChanges()</code></td><td>The template never rendered; your assertion tests nothing</td></tr>
<tr><td>Async work not settled</td><td><code>fakeAsync</code> + <code>tick()</code>, or <code>await fixture.whenStable()</code></td></tr>
<tr><td>Querying by CSS class</td><td>Use <code>data-testid</code> — a restyle should not break tests</td></tr>
<tr><td>Asserting on component fields</td><td>Assert on the DOM; fields are implementation</td></tr>
<tr><td>Deep <code>NO_ERRORS_SCHEMA</code></td><td>It hides genuine template errors — mock the child component instead</td></tr>
<tr><td>Slow suites from a huge TestBed</td><td>Import only what the component needs</td></tr>
</table>
<p><strong>The principle to state:</strong> "I test behaviour through the rendered output, because that is what can actually break for a user and it survives refactoring. A test that asserts <code>component.isLoading === true</code> passes while the spinner is invisible — it is testing that I assigned a variable, which nobody cares about."</p>`
}
]);
