registerPrimer("java-basics", `<h3>The mental model: two steps, two memories</h3>
<p>Java code runs in two steps. <strong>javac</strong> compiles your <code>.java</code> file into <strong>bytecode</strong> (a <code>.class</code> file), which is the same on every OS. Then the <strong>JVM</strong> loads that bytecode and runs it: first by interpreting it, then by compiling the hot parts to native machine code (the JIT). That split is the whole of "write once, run anywhere". The bytecode is portable, and each platform gets its own JVM.</p>
<p>While the program runs, data lives in two places. Every method call gets a <strong>stack frame</strong> holding its local variables. Every object made with <code>new</code> lives on the <strong>heap</strong>. A local variable of an object type does not hold the object. It holds a <em>reference</em>, which is basically an arrow to where the object sits on the heap.</p>
<figure class="fig">
<svg viewBox="0 0 620 250" role="img" aria-label="Java source compiled to bytecode, run by the JVM, with stack frames pointing into the heap">
  <defs><marker id="pr-jb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="14" width="110" height="46" rx="8"/>
  <text class="dg-t" x="65" y="34" text-anchor="middle">Hello.java</text>
  <text class="dg-s" x="65" y="50" text-anchor="middle">you write this</text>
  <line class="dg-line" x1="120" y1="37" x2="150" y2="37" marker-end="url(#pr-jb)"/>
  <rect class="dg-fill" x="152" y="14" width="86" height="46" rx="8"/>
  <text class="dg-t" x="195" y="34" text-anchor="middle">javac</text>
  <text class="dg-s" x="195" y="50" text-anchor="middle">compile time</text>
  <line class="dg-line" x1="238" y1="37" x2="268" y2="37" marker-end="url(#pr-jb)"/>
  <rect class="dg-box" x="270" y="14" width="118" height="46" rx="8"/>
  <text class="dg-t" x="329" y="34" text-anchor="middle">Hello.class</text>
  <text class="dg-s" x="329" y="50" text-anchor="middle">bytecode, any OS</text>
  <line class="dg-line" x1="388" y1="37" x2="418" y2="37" marker-end="url(#pr-jb)"/>
  <rect class="dg-fill2" x="420" y="14" width="190" height="46" rx="8"/>
  <text class="dg-t" x="515" y="34" text-anchor="middle">JVM: load, verify, run</text>
  <text class="dg-s" x="515" y="50" text-anchor="middle">interpreter, then JIT for hot code</text>
  <rect class="dg-box" x="10" y="92" width="250" height="140" rx="10"/>
  <text class="dg-t" x="22" y="112">STACK (one per thread)</text>
  <rect class="dg-fill" x="22" y="122" width="226" height="44" rx="6"/>
  <text class="dg-m" x="32" y="140">rename(p)  frame</text>
  <text class="dg-s" x="32" y="157">p = ref (a COPY of main's ref)</text>
  <rect class="dg-fill" x="22" y="174" width="226" height="48" rx="6"/>
  <text class="dg-m" x="32" y="192">main()  frame</text>
  <text class="dg-s" x="32" y="210">age = 30 (the value itself)   p = ref</text>
  <rect class="dg-box" x="330" y="92" width="280" height="140" rx="10"/>
  <text class="dg-t" x="342" y="112">HEAP (shared by all threads)</text>
  <rect class="dg-fill2" x="392" y="138" width="170" height="54" rx="6"/>
  <text class="dg-m" x="404" y="160">Person object</text>
  <text class="dg-s" x="404" y="178">name = "Asha"</text>
  <line class="dg-line" x1="248" y1="144" x2="390" y2="156" marker-end="url(#pr-jb)"/>
  <line class="dg-line" x1="248" y1="206" x2="390" y2="178" marker-end="url(#pr-jb)"/>
  <text class="dg-s" x="342" y="220">two references, ONE object</text>
</svg>
<figcaption>Compile once to bytecode, run on any JVM. Primitives sit in the frame; objects sit on the heap behind references.</figcaption>
</figure>
<h3>Worked example: what the picture explains</h3>
<pre><code>class Person { String name; Person(String n) { name = n; } }

public class Hello {
    static void rename(Person p) { p.name = "Asha"; }      // follows the arrow
    static void replace(Person p) { p = new Person("Ravi"); } // moves ONLY the copy
    static void birthday(int age) { age++; }                 // changes a copy

    public static void main(String[] args) {
        int age = 30;
        Person p = new Person("Vivek");

        birthday(age);   // age is still 30. The method got a copy of the number.
        rename(p);       // p.name is now "Asha". The method got a copy of the
                         // ARROW, and both arrows point at the same object.
        replace(p);      // p.name is STILL "Asha". The method pointed its own
                         // copy of the arrow at a new object; main's arrow
                         // never moved.
        System.out.println(age + " " + p.name);   // 30 Asha
    }
}</code></pre>
<p>That one example answers three classic questions at once. <strong>Java is always pass-by-value.</strong> For objects the value that gets copied is the reference, which is why a method can change an object's fields but can never make the caller's variable point somewhere else.</p>
<h3>The basics interviewers check, in one table</h3>
<table>
<tr><th>Idea</th><th>One-line answer</th><th>The trap</th></tr>
<tr><td>Primitive vs reference</td><td>8 primitives hold values; everything else holds a reference</td><td><code>Integer</code> can be <code>null</code> and unboxing it throws an NPE</td></tr>
<tr><td><code>==</code> vs <code>equals</code></td><td><code>==</code> compares arrows; <code>equals</code> compares contents</td><td><code>Integer</code> 127 == 127 is true, 128 == 128 is false (the cache)</td></tr>
<tr><td>String</td><td>Immutable; literals are shared from the string pool</td><td>Concatenating in a loop builds a new String each time. Use <code>StringBuilder</code></td></tr>
<tr><td><code>static</code></td><td>Belongs to the class, one copy total</td><td>A static mutable field is shared state across every thread</td></tr>
<tr><td>Exceptions</td><td>Checked must be declared or caught; unchecked need not be</td><td>Catching <code>Exception</code> and doing nothing hides real bugs</td></tr>
</table>
<p><strong>How to use this page:</strong> read the primer once, then open the questions. Most of them are a closer look at one row of the table above.</p>`);

appendTopic("java-basics", [
{
  q: "Integer overflow: predict the output, then make the code safe",
  level: "beginner", hot: true, tags: ["primitives", "overflow", "must-know"],
  companies: ["Amazon", "Google", "Microsoft", "Goldman Sachs", "Infosys", "TCS", "Flipkart"],
  a: `<p>Java integer arithmetic <strong>wraps around silently</strong>. There is no exception and no warning. An <code>int</code> is 32 bits, so after <code>2,147,483,647</code> the next value is <code>-2,147,483,648</code>, like a car odometer rolling over.</p>
<pre><code>int max = Integer.MAX_VALUE;              // 2147483647
System.out.println(max + 1);              // -2147483648   wrapped, no error

System.out.println(Math.abs(Integer.MIN_VALUE));   // -2147483648  STILL negative:
                                                   // +2147483648 does not fit in an int

long wrong = 1_000_000 * 1_000_000;       // -727379968
long right = 1_000_000L * 1_000_000;      // 1000000000000
// 'wrong' multiplies two INTs, overflows, and only THEN widens the broken
// result to long. The L on one operand makes the whole multiply happen in long.</code></pre>
<p><strong>The bug that shipped in the JDK itself:</strong> binary search computed the midpoint as <code>(low + high) / 2</code>. With arrays of over a billion elements, <code>low + high</code> overflows to a negative number and the search throws. It sat in <code>Arrays.binarySearch</code> for about nine years before it was fixed in 2006.</p>
<pre><code>int mid = (low + high) / 2;           // overflows for large low + high
int mid = low + (high - low) / 2;     // safe: the difference always fits
int mid = (low + high) &gt;&gt;&gt; 1;         // safe: unsigned shift treats the
                                      // overflowed bits as a positive number</code></pre>
<pre><code>// Another real one: turning a hash into a bucket index
int bucket = Math.abs(key.hashCode()) % n;   // can be NEGATIVE: when hashCode()
                                             // is MIN_VALUE, abs() returns it
                                             // unchanged ("polygenelubricants"
                                             // is a String with exactly that hash)
int bucket = Math.floorMod(key.hashCode(), n);   // always 0 .. n-1</code></pre>
<table>
<tr><th>Need</th><th>Use</th><th>Behaviour</th></tr>
<tr><td>Fail loudly on overflow</td><td><code>Math.addExact</code>, <code>multiplyExact</code>, <code>subtractExact</code></td><td>Throws <code>ArithmeticException</code> instead of wrapping</td></tr>
<tr><td>Narrow a long to an int safely</td><td><code>Math.toIntExact(long)</code></td><td>Throws if the value does not fit</td></tr>
<tr><td>Bigger range</td><td><code>long</code> (64-bit)</td><td>Still wraps, just much later</td></tr>
<tr><td>No limit at all</td><td><code>BigInteger</code></td><td>Arbitrary size, slower, immutable</td></tr>
<tr><td>A non-negative remainder</td><td><code>Math.floorMod</code></td><td><code>%</code> keeps the sign of the left side; floorMod does not</td></tr>
</table>
<pre><code>// Where this matters in real code: money in paise, counters, timestamps
long totalPaise = Math.addExact(balancePaise, depositPaise);   // throws rather
                                                               // than turning a
                                                               // rich customer
                                                               // into a debtor</code></pre>
<p><strong>The answer in one line:</strong> "Integer overflow in Java wraps silently, so I use the <code>Math.*Exact</code> methods where a wrong number is worse than an exception, write midpoints as <code>low + (high - low) / 2</code>, and put the <code>L</code> on the first operand when the result is a long."</p>`
},
{
  q: "Why is 0.1 + 0.2 not equal to 0.3, and how do you compare doubles correctly?",
  level: "beginner", hot: true, tags: ["primitives", "floating-point", "bigdecimal", "must-know"],
  companies: ["Goldman Sachs", "JP Morgan", "Morgan Stanley", "Amazon", "Infosys", "TCS", "Wipro"],
  a: `<p>A <code>double</code> stores numbers in <strong>binary</strong>. Just as 1/3 cannot be written exactly in decimal (0.3333…), 0.1 cannot be written exactly in binary. Every such value is stored as the nearest binary fraction, and the tiny errors show up when you add them.</p>
<pre><code>System.out.println(0.1 + 0.2);             // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);      // false

double total = 0;
for (int i = 0; i &lt; 10; i++) total += 0.1;
System.out.println(total);                 // 0.9999999999999999, not 1.0</code></pre>
<p><strong>The fix depends on what the number means.</strong></p>
<table>
<tr><th>Your numbers are</th><th>Use</th><th>Why</th></tr>
<tr><td><strong>Money</strong></td><td><code>BigDecimal</code>, or a <code>long</code> of paise/cents</td><td>Money is decimal by definition and must be exact</td></tr>
<tr><td>Measurements, science, graphics</td><td><code>double</code> with a tolerance</td><td>They were approximate before they reached your code</td></tr>
<tr><td>Counts</td><td><code>int</code> / <code>long</code></td><td>Never use a floating type for something you count</td></tr>
</table>
<pre><code>// Comparing doubles: never ==. Compare with a tolerance.
static boolean close(double a, double b) {
    double eps = 1e-9;
    return Math.abs(a - b) &lt;= eps * Math.max(1.0, Math.max(Math.abs(a), Math.abs(b)));
}
// The tolerance is RELATIVE for large values: at 1e12 an absolute 1e-9 is far
// smaller than the gap between neighbouring doubles, and nothing would match.</code></pre>
<pre><code>// BigDecimal has traps of its own
new BigDecimal(0.1);            // 0.1000000000000000055511151231257827...
                                // the double's error is copied in exactly
new BigDecimal("0.1");          // 0.1 - always build from a String
BigDecimal.valueOf(0.1);        // 0.1 - also fine, it goes via Double.toString

new BigDecimal("2.0").equals(new BigDecimal("2.00"));      // false! scale differs
new BigDecimal("2.0").compareTo(new BigDecimal("2.00"));   // 0 - use this

BigDecimal.ONE.divide(new BigDecimal("3"));   // ArithmeticException: 0.333... never ends
BigDecimal.ONE.divide(new BigDecimal("3"), 2, RoundingMode.HALF_EVEN);   // 0.33</code></pre>
<p><strong>The special values an interviewer may throw at you:</strong></p>
<pre><code>1.0 / 0            // Infinity  (floating-point division by zero does not throw)
1 / 0              // ArithmeticException  (integer division does)
0.0 / 0            // NaN
Double.NaN == Double.NaN              // false: NaN equals nothing, even itself
Double.isNaN(x)                       // the only reliable test
0.0 == -0.0                           // true
Double.valueOf(0.0).equals(-0.0)      // false: equals() compares the bits
(int) Double.NaN                      // 0
(int) 1e20                            // 2147483647: casts clamp, they do not wrap</code></pre>
<p><strong>The one sentence:</strong> "Doubles are binary approximations, so I compare them with a relative tolerance and never use them for money. Money goes in <code>BigDecimal</code> built from a String and compared with <code>compareTo</code>, or in a <code>long</code> of the smallest unit."</p>`
}
]);
