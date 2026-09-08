appendTopic("java-basics", [
{
  q: "What is the difference between == and equals, and what happens with Integer caching?",
  level: "beginner", hot: true, tags: ["equals", "gotcha", "basics"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Amazon", "Oracle", "Zoho"],
  a: `<pre><code>String a = "hello";
String b = "hello";
String c = new String("hello");

a == b        // true  — both point at the same interned literal
a == c        // false — 'new' forces a separate heap object
a.equals(c)   // true  — same characters

Integer x = 127, y = 127;
Integer p = 128, q = 128;
x == y        // TRUE  — the Integer cache covers -128..127
p == q        // FALSE — outside the cache, two distinct objects
p.equals(q)   // true</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 155" role="img" aria-label="Integer cache reusing boxed objects in the range minus 128 to 127">
  <rect class="dg-fill" x="16" y="26" width="240" height="96" rx="10"/>
  <text class="dg-s" x="136" y="48" text-anchor="middle">IntegerCache  (−128 … 127)</text>
  <rect class="dg-fill2" x="36" y="60" width="90" height="30" rx="6"/><text class="dg-t" x="81" y="80" text-anchor="middle">127</text>
  <text class="dg-s" x="136" y="110" text-anchor="middle">x and y BOTH point here</text>
  <path class="dg-line" d="M266 74 H316" marker-end="url(#ic1)"/>
  <rect class="dg-box" x="330" y="34" width="120" height="34" rx="6"/><text class="dg-t" x="390" y="56" text-anchor="middle">new Integer(128)</text>
  <rect class="dg-box" x="330" y="82" width="120" height="34" rx="6"/><text class="dg-t" x="390" y="104" text-anchor="middle">new Integer(128)</text>
  <text class="dg-s" x="470" y="60">two separate objects,</text>
  <text class="dg-s" x="470" y="82">so == is false even</text>
  <text class="dg-s" x="470" y="104">though the values match</text>
  <text class="dg-s" x="16" y="146">the cache exists to avoid allocating for small, extremely common values</text>
  <defs><marker id="ic1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<table>
<tr><th></th><th><code>==</code></th><th><code>equals()</code></th></tr>
<tr><td>Primitives</td><td>Compares values — the only option</td><td>Not applicable</td></tr>
<tr><td>Objects</td><td>Compares <strong>references</strong></td><td>Compares whatever the class defines</td></tr>
<tr><td>Not overridden</td><td>—</td><td>Falls back to <code>Object.equals</code>, which <em>is</em> <code>==</code></td></tr>
<tr><td>Null-safe</td><td>Yes</td><td>No — <code>a.equals(b)</code> throws if <code>a</code> is null. Use <code>Objects.equals(a, b)</code>.</td></tr>
</table>
<pre><code>// The bug this causes in real code
Map&lt;Integer, String&gt; map = new HashMap&lt;&gt;();
map.put(1000, "x");
Integer key = 1000;
if (key == 1000) { }          // FALSE — comparing an Integer with an int UNBOXES,
                              // so this one is actually fine. But:
Integer k1 = 1000, k2 = 1000;
if (k1 == k2) { }             // FALSE — both are objects, no unboxing happens

// The rule that avoids all of it:
// compare objects with equals(), primitives with ==, and never mix.</code></pre>
<p><strong>The subtlety worth stating:</strong> when one side is a primitive <code>int</code>, the boxed side is <em>unboxed</em> and it becomes a value comparison. When both sides are wrappers, it is a reference comparison. That asymmetry is why the bug is so hard to spot in review.</p>
<p><strong>And the null trap:</strong> <code>Integer i = map.get("missing"); if (i == 1)</code> throws <code>NullPointerException</code>, because unboxing <code>null</code> calls <code>intValue()</code> on it. That is one of the most common NPEs in production Java, and it has no visible dereference at the call site.</p>`
},
{
  q: "Explain the String pool, immutability, and why String is immutable",
  level: "beginner", hot: true, tags: ["string", "memory", "immutability"],
  companies: ["TCS", "Infosys", "Wipro", "Amazon", "Oracle", "Accenture", "Capgemini", "Zoho"],
  a: `<p><strong>Four reasons String is immutable</strong> — give them in this order, because the security one is the strongest:</p>
<table>
<tr><th>Reason</th><th>Consequence if it were mutable</th></tr>
<tr><td><strong>Security</strong></td><td>A file path or JDBC URL validated then passed to the OS could be changed in between by another thread — a classic time-of-check-to-time-of-use attack</td></tr>
<tr><td><strong>Caching the hash</strong></td><td><code>hashCode()</code> is computed once and stored. A mutable String would break every <code>HashMap</code> that already contains it.</td></tr>
<tr><td><strong>String pool</strong></td><td>Sharing one instance between references is only safe if nobody can change it</td></tr>
<tr><td><strong>Thread safety</strong></td><td>Immutable objects need no synchronisation at all</td></tr>
</table>
<pre><code>String s = "hello";
s.toUpperCase();              // returns a NEW string; s is unchanged
System.out.println(s);        // still "hello" — the classic trick question
s = s.toUpperCase();          // reassignment is what people actually mean

// The pool
String a = "java";            // goes into the pool
String b = "java";            // reuses the pooled instance -> a == b
String c = new String("java").intern();   // forces pool lookup -> a == c
String d = "ja" + "va";       // compile-time constant folding -> pooled, a == d
String e = getPrefix() + "va";// runtime concatenation -> NEW object, a != e</code></pre>
<pre><code>// The performance consequence you must know
String result = "";
for (int i = 0; i &lt; 10000; i++) result += i;    // O(n^2): 10,000 new Strings

StringBuilder sb = new StringBuilder();          // O(n)
for (int i = 0; i &lt; 10000; i++) sb.append(i);
String result = sb.toString();

// Note: the compiler rewrites simple concatenation in a single expression
// ("a" + b + "c") into a StringBuilder or an invokedynamic call. It CANNOT
// do that across loop iterations — which is exactly where it matters.</code></pre>
<table>
<tr><th></th><th>String</th><th>StringBuilder</th><th>StringBuffer</th></tr>
<tr><td>Mutable</td><td>No</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Thread-safe</td><td>Yes (immutable)</td><td>No</td><td>Yes (synchronised)</td></tr>
<tr><td>Speed</td><td>Slow for repeated edits</td><td><strong>Fastest</strong></td><td>Slower — lock overhead</td></tr>
<tr><td>Use for</td><td>Keys, constants, anything shared</td><td>Building strings in a method</td><td>Almost never — a builder in a local variable is not shared</td></tr>
</table>
<p><strong>Two modern details worth adding:</strong> since Java 9, <code>String</code> stores a <code>byte[]</code> with an encoding flag (compact strings) rather than a <code>char[]</code>, which roughly halves memory for Latin-1 text. And since Java 15, text blocks (<code>"""</code>) give multi-line literals — still immutable, still pooled if constant.</p>
<p><strong>The security follow-up:</strong> "then why is a password a <code>char[]</code> and not a <code>String</code>?" Because a String cannot be cleared — it lives in the pool until garbage collected and could appear in a heap dump. A <code>char[]</code> can be overwritten with zeros immediately after use. That is why <code>JPasswordField.getPassword()</code> returns <code>char[]</code>.</p>`
},
{
  q: "What are checked and unchecked exceptions, and how do you design exception handling?",
  level: "advanced", hot: true, tags: ["exceptions", "design", "best-practice"],
  companies: ["Amazon", "Oracle", "TCS", "Infosys", "SAP", "Optum", "Barclays", "Cognizant"],
  a: `<figure class="fig">
<svg viewBox="0 0 620 165" role="img" aria-label="Throwable hierarchy split into checked and unchecked">
  <rect class="dg-fill" x="240" y="14" width="120" height="30" rx="6"/><text class="dg-s" x="300" y="34" text-anchor="middle">Throwable</text>
  <path class="dg-line" d="M276 44 L150 76 M324 44 L450 76"/>
  <rect class="dg-box" x="86" y="76" width="128" height="30" rx="6"/><text class="dg-s" x="150" y="96" text-anchor="middle">Error (unchecked)</text>
  <rect class="dg-fill2" x="386" y="76" width="128" height="30" rx="6"/><text class="dg-s" x="450" y="96" text-anchor="middle">Exception</text>
  <path class="dg-line" d="M420 106 L340 134 M480 106 L544 134"/>
  <rect class="dg-fill2" x="252" y="134" width="176" height="30" rx="6"/><text class="dg-s" x="340" y="154" text-anchor="middle">checked: IOException, SQLException</text>
  <rect class="dg-box" x="440" y="134" width="176" height="30" rx="6"/><text class="dg-s" x="528" y="154" text-anchor="middle">RuntimeException (unchecked)</text>
  <text class="dg-s" x="16" y="128">OutOfMemoryError,</text>
  <text class="dg-s" x="16" y="148">StackOverflowError</text>
</svg>
</figure>
<table>
<tr><th></th><th>Checked</th><th>Unchecked (RuntimeException)</th></tr>
<tr><td>Compiler enforces handling</td><td>Yes — catch or declare</td><td>No</td></tr>
<tr><td>Represents</td><td>Recoverable, expected conditions</td><td>Programming errors</td></tr>
<tr><td>Examples</td><td><code>IOException</code>, <code>SQLException</code></td><td><code>NullPointerException</code>, <code>IllegalArgumentException</code>, <code>IllegalStateException</code></td></tr>
<tr><td>Lambdas / streams</td><td><strong>Awkward</strong> — functional interfaces do not declare them</td><td>Works naturally</td></tr>
</table>
<pre><code>// ✗ Anti-patterns interviewers look for
try { risky(); } catch (Exception e) { }                   // swallowed — silent failure
try { risky(); } catch (Exception e) { e.printStackTrace(); }  // not logging, no context
catch (Exception e) { throw new RuntimeException(); }      // CAUSE LOST — unusable trace
catch (Exception e) { }                                     // catching Exception hides
                                                            // NPEs and typos too

// ✔ What good looks like
try {
    return client.fetch(orderId);
} catch (HttpTimeoutException e) {
    // Catch the SPECIFIC type, keep the cause, add the context the log needs
    throw new OrderLookupException("timeout fetching order " + orderId, e);
} finally {
    // Better still: try-with-resources, which closes even if finally throws
}

// try-with-resources: closes in REVERSE order, and suppressed exceptions are
// attached to the primary one instead of replacing it
try (var conn = pool.get(); var stmt = conn.prepare(sql)) {
    return stmt.execute();
}</code></pre>
<p><strong>The design rules to state:</strong></p>
<ul>
<li><strong>Throw early, catch late.</strong> Validate arguments at the boundary; handle the failure where you can actually do something about it.</li>
<li><strong>Catch only what you can handle.</strong> If the only response is to log and rethrow, do not catch it at all — let it propagate to one place that handles it.</li>
<li><strong>Never lose the cause.</strong> Always pass the original exception to the new one's constructor.</li>
<li><strong>Do not use exceptions for control flow.</strong> Filling in a stack trace is expensive, and it turns an ordinary path into something a reader has to reason about.</li>
<li><strong>Prefer unchecked for anything the caller cannot fix</strong> — the industry has largely moved that way, and Spring wraps every <code>SQLException</code> into an unchecked <code>DataAccessException</code> for exactly this reason.</li>
</ul>
<pre><code>// The finally trap worth knowing
int f() {
    try { return 1; }
    finally { return 2; }     // returns 2 — and SWALLOWS any exception. Never do this.
}</code></pre>`
},
{
  q: "How does pass-by-value work in Java, and what happens with objects and arrays?",
  level: "beginner", hot: true, tags: ["basics", "memory", "gotcha"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "Amazon"],
  a: `<p><strong>Java is always pass-by-value.</strong> There is no exception, no "objects are passed by reference". What is passed by value for an object is the <em>reference</em> — a copy of the pointer.</p>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Caller and callee references pointing at the same object">
  <rect class="dg-fill" x="16" y="24" width="130" height="34" rx="6"/><text class="dg-s" x="81" y="46" text-anchor="middle">caller: list</text>
  <rect class="dg-fill" x="16" y="86" width="130" height="34" rx="6"/><text class="dg-s" x="81" y="108" text-anchor="middle">method param: l</text>
  <path class="dg-line" d="M150 40 L280 62 M150 102 L280 78" marker-end="url(#pv1)"/>
  <rect class="dg-fill2" x="286" y="50" width="150" height="42" rx="8"/>
  <text class="dg-s" x="361" y="76" text-anchor="middle">the SAME ArrayList</text>
  <text class="dg-s" x="466" y="46">l.add(x)     → caller sees it</text>
  <text class="dg-s" x="466" y="74">l = new …    → caller does NOT</text>
  <text class="dg-s" x="16" y="148">the arrow can be redirected inside the method, but only the method's own copy of it</text>
  <defs><marker id="pv1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="currentColor" stroke="none" class="dg-line"/></marker></defs>
</svg>
</figure>
<pre><code>void mutate(List&lt;String&gt; list) { list.add("added"); }      // ✔ caller SEES this
void reassign(List&lt;String&gt; list) { list = new ArrayList&lt;&gt;(); }  // ✗ caller sees nothing

List&lt;String&gt; names = new ArrayList&lt;&gt;();
mutate(names);     names.size();   // 1
reassign(names);   names.size();   // still 1 — the local copy was repointed

// Primitives — obviously a copy
void inc(int n) { n++; }
int x = 5; inc(x);   // x is still 5

// Strings LOOK like they break the rule, but they do not
void change(String s) { s = "changed"; }   // s is immutable AND the reference is a copy
String t = "original"; change(t);          // t is still "original"</code></pre>
<table>
<tr><th>Inside the method you can…</th><th>Caller sees it?</th></tr>
<tr><td>Mutate the object's state (<code>list.add</code>, <code>obj.setX</code>, <code>arr[0] = 5</code>)</td><td><strong>Yes</strong></td></tr>
<tr><td>Reassign the parameter (<code>list = ...</code>)</td><td><strong>No</strong></td></tr>
<tr><td>Modify a primitive parameter</td><td>No</td></tr>
<tr><td>Modify an immutable object (String, Integer, LocalDate)</td><td>Impossible by definition</td></tr>
</table>
<pre><code>// Why swap() cannot work in Java
void swap(String a, String b) { String t = a; a = b; b = t; }   // does nothing

// It must go through a shared container instead
void swap(String[] arr, int i, int j) { String t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
Collections.swap(list, i, j);</code></pre>
<p><strong>The precise phrasing to use:</strong> "Java passes references by value. I can change what the object <em>contains</em>, but I cannot change what the caller's variable <em>points to</em>. C++ has genuine pass-by-reference with <code>&amp;</code>; Java has nothing equivalent."</p>
<p><strong>The practical consequence to raise:</strong> a method that takes a collection and mutates it is a hidden side effect on the caller. Either document it clearly, or take a copy — <code>List.copyOf(input)</code> — and return a new collection. Defensive copying at API boundaries prevents a whole class of "who modified my list?" bugs, and mentioning it turns a trivia answer into a design answer.</p>`
}
]);
