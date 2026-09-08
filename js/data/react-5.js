appendTopic("react", [
{
  q: "Controlled vs uncontrolled inputs — how do you handle forms in React?",
  level: "beginner", hot: true, tags: ["forms", "hooks", "performance"],
  companies: ["Amazon", "Meta", "Adobe", "Flipkart", "Walmart", "Optum", "EPAM", "Cognizant"],
  a: `<table>
<tr><th></th><th>Controlled</th><th>Uncontrolled</th></tr>
<tr><td>Value lives in</td><td>React state</td><td>The DOM node itself</td></tr>
<tr><td>Read the value</td><td>Any time, from state</td><td>Via a ref, usually on submit</td></tr>
<tr><td>Re-renders</td><td><strong>Every keystroke</strong></td><td>None</td></tr>
<tr><td>Instant validation, formatting, conditional UI</td><td><strong>Easy</strong></td><td>Awkward</td></tr>
<tr><td>Best for</td><td>Small forms, live feedback</td><td>Large forms, file inputs, integrating non-React widgets</td></tr>
</table>
<pre><code>// CONTROLLED — React owns the value
function Search() {
  const [q, setQ] = useState('');
  return &lt;input value={q} onChange={e =&gt; setQ(e.target.value)} /&gt;;
}
// Every keystroke sets state and re-renders. Fine for one input; on a
// 30-field form it means 30 components re-rendering per character typed.

// UNCONTROLLED — the DOM owns the value, React reads it when needed
function Signup() {
  const email = useRef&lt;HTMLInputElement&gt;(null);
  const onSubmit = (e: FormEvent) =&gt; {
    e.preventDefault();
    api.signup(email.current!.value);          // read once, on submit
  };
  return (
    &lt;form onSubmit={onSubmit}&gt;
      &lt;input ref={email} defaultValue="" /&gt;    {/* defaultValue, NOT value */}
    &lt;/form&gt;
  );
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 150" role="img" aria-label="Controlled input round trip through state versus uncontrolled DOM value">
  <text class="dg-t" x="16" y="20">controlled</text>
  <rect class="dg-fill" x="16" y="30" width="90" height="30" rx="6"/><text class="dg-s" x="61" y="50" text-anchor="middle">keystroke</text>
  <path class="dg-line" d="M110 45 H154" marker-end="url(#rf1)"/>
  <rect class="dg-fill" x="158" y="30" width="90" height="30" rx="6"/><text class="dg-s" x="203" y="50" text-anchor="middle">setState</text>
  <path class="dg-line" d="M252 45 H296" marker-end="url(#rf1)"/>
  <rect class="dg-fill" x="300" y="30" width="90" height="30" rx="6"/><text class="dg-s" x="345" y="50" text-anchor="middle">re-render</text>
  <path class="dg-line" d="M394 45 H438" marker-end="url(#rf1)"/>
  <rect class="dg-fill" x="442" y="30" width="90" height="30" rx="6"/><text class="dg-s" x="487" y="50" text-anchor="middle">DOM value</text>
  <text class="dg-t" x="16" y="98">uncontrolled</text>
  <rect class="dg-fill2" x="16" y="108" width="90" height="30" rx="6"/><text class="dg-s" x="61" y="128" text-anchor="middle">keystroke</text>
  <path class="dg-line" d="M110 123 H438" marker-end="url(#rf1)"/>
  <text class="dg-s" x="274" y="115" text-anchor="middle">straight to the DOM — React is not involved</text>
  <rect class="dg-fill2" x="442" y="108" width="90" height="30" rx="6"/><text class="dg-s" x="487" y="128" text-anchor="middle">DOM value</text>
  <defs><marker id="rf1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>// The warning everyone hits once
&lt;input value={user.name} /&gt;
// "You provided a value prop to a form field without an onChange handler."
// The field is now read-only, because React re-renders it back to the same
// value on every keystroke. Either add onChange, or use readOnly, or
// use defaultValue for an uncontrolled field.

// And the switch that logs a different warning
const [v, setV] = useState();          // undefined -> UNCONTROLLED
&lt;input value={v} onChange={...} /&gt;      // becomes CONTROLLED when v is set
// "A component is changing an uncontrolled input to be controlled."
// Fix: initialise with '' rather than undefined.</code></pre>
<table>
<tr><th>Situation</th><th>Approach</th></tr>
<tr><td>Search box with live filtering</td><td>Controlled + <code>useDeferredValue</code> or a debounce</td></tr>
<tr><td>Large form, validate on submit</td><td>Uncontrolled, or React Hook Form</td></tr>
<tr><td><code>&lt;input type="file"&gt;</code></td><td><strong>Always uncontrolled</strong> — its value cannot be set programmatically</td></tr>
<tr><td>Third-party widget (a date picker, a rich text editor)</td><td>Uncontrolled with a ref</td></tr>
<tr><td>Multi-step wizard</td><td>Controlled, state lifted to the wizard</td></tr>
</table>
<pre><code>// The production answer: React Hook Form is uncontrolled UNDER THE HOOD,
// which is why it does not re-render on every keystroke.
const { register, handleSubmit, formState: { errors } } = useForm&lt;Signup&gt;({
  resolver: zodResolver(SignupSchema)      // one schema for types AND validation
});

&lt;form onSubmit={handleSubmit(onValid)}&gt;
  &lt;input {...register('email')} /&gt;
  {errors.email &amp;&amp; &lt;span&gt;{errors.email.message}&lt;/span&gt;}
&lt;/form&gt;</code></pre>
<p><strong>The rule to state:</strong> "Controlled by default, because it is simpler to reason about and makes derived UI trivial. I switch to uncontrolled — usually via React Hook Form — when a form is large enough that per-keystroke re-renders show up in the profiler. And client validation is always UX only; the server validates independently."</p>`
},
{
  q: "What are Server Components, and how do they change how you build a React app?",
  level: "advanced", tags: ["react19", "nextjs", "modern", "architecture"],
  companies: ["Meta", "Amazon", "Adobe", "Flipkart", "Swiggy", "Walmart", "Salesforce"],
  a: `<table>
<tr><th></th><th>Server Component</th><th>Client Component (<code>'use client'</code>)</th></tr>
<tr><td>Runs</td><td>On the server, at request or build time</td><td>Server (for HTML) then hydrates in the browser</td></tr>
<tr><td>Ships JavaScript to the client</td><td><strong>None</strong></td><td>Yes</td></tr>
<tr><td>Can use hooks / state / effects</td><td>No</td><td>Yes</td></tr>
<tr><td>Can access the database or secrets directly</td><td><strong>Yes</strong></td><td>No</td></tr>
<tr><td>Can be <code>async</code> and await data</td><td>Yes</td><td>No</td></tr>
<tr><td>Handles interaction (onClick)</td><td>No</td><td>Yes</td></tr>
</table>
<pre><code>// SERVER component — no useEffect, no loading state, no API route
async function OrderList({ customerId }: { customerId: string }) {
  const orders = await db.order.findMany({ where: { customerId } });   // direct DB access
  return (
    &lt;ul&gt;
      {orders.map(o =&gt; &lt;OrderRow key={o.id} order={o} /&gt;)}
    &lt;/ul&gt;
  );
}
// The database driver, the ORM and the query never reach the browser bundle.
// There is also no client waterfall: no render → effect → fetch → re-render.

// CLIENT component — only where interactivity is genuinely needed
'use client';
function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  return &lt;li onClick={() =&gt; setExpanded(!expanded)}&gt;{order.total}&lt;/li&gt;;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Server component tree with client islands">
  <rect class="dg-fill" x="200" y="16" width="200" height="30" rx="6"/><text class="dg-s" x="300" y="36" text-anchor="middle">Layout (server)</text>
  <path class="dg-line" d="M260 46 L160 78 M340 46 L440 78"/>
  <rect class="dg-fill" x="80" y="78" width="160" height="30" rx="6"/><text class="dg-s" x="160" y="98" text-anchor="middle">OrderList (server)</text>
  <rect class="dg-fill" x="360" y="78" width="160" height="30" rx="6"/><text class="dg-s" x="440" y="98" text-anchor="middle">Sidebar (server)</text>
  <path class="dg-line" d="M160 108 V128"/>
  <rect class="dg-fill2" x="80" y="128" width="160" height="30" rx="6"/><text class="dg-s" x="160" y="148" text-anchor="middle">OrderRow ('use client')</text>
  <text class="dg-s" x="270" y="132">only the shaded island ships</text>
  <text class="dg-s" x="270" y="152">JavaScript to the browser</text>
</svg>
</figure>
<pre><code>// Streaming with Suspense — send the shell immediately, fill in slow parts later
export default function Page() {
  return (
    &lt;&gt;
      &lt;Header /&gt;                              {/* instant */}
      &lt;Suspense fallback={&lt;OrdersSkeleton /&gt;}&gt;
        &lt;OrderList customerId={id} /&gt;         {/* streams in when the query finishes */}
      &lt;/Suspense&gt;
      &lt;Suspense fallback={&lt;ChartSkeleton /&gt;}&gt;
        &lt;Analytics /&gt;                          {/* independent — does not block the above */}
      &lt;/Suspense&gt;
    &lt;/&gt;
  );
}
// One slow query no longer holds the whole page hostage.</code></pre>
<pre><code>// SERVER ACTIONS — mutations without writing an API route
'use server';
export async function updateOrder(formData: FormData) {
  const parsed = OrderSchema.parse(Object.fromEntries(formData));   // ALWAYS validate:
  await db.order.update({ where: { id: parsed.id }, data: parsed });// this is a public
  revalidatePath('/orders');                                        // HTTP endpoint
}

// Client side
'use client';
function Form() {
  const [state, action, pending] = useActionState(updateOrder, null);
  return &lt;form action={action}&gt;&lt;button disabled={pending}&gt;Save&lt;/button&gt;&lt;/form&gt;;
}</code></pre>
<table>
<tr><th>Rule</th><th>Why</th></tr>
<tr><td>Server by default; add <code>'use client'</code> at the leaves</td><td>The boundary is viral downward — everything imported by a client component becomes client code</td></tr>
<tr><td>Push <code>'use client'</code> as deep as possible</td><td>A <code>'use client'</code> on the layout makes the entire tree client-side</td></tr>
<tr><td>Pass server data down as props</td><td>Server components can render client ones, not the reverse — but they can pass them as <code>children</code></td></tr>
<tr><td>Validate every server action input</td><td>It is a public endpoint, whatever the call site looks like</td></tr>
<tr><td>Never put a secret in a client component</td><td>It ships to the browser, even if it looks like server code</td></tr>
</table>
<p><strong>The honest assessment:</strong> "Server Components genuinely remove the client fetch waterfall and a lot of bundle weight, and for content-heavy pages they are a large win. The cost is a mental model with a real learning curve — the server/client boundary is subtle, and the ecosystem is still catching up. I would use them for a new Next.js app, and I would not rewrite a working SPA to get them."</p>`
}
]);
