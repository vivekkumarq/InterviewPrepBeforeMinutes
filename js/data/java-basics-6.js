registerPrimer("java-basics", `<p class="pr-lead">Java Fundamentals is about two things: <b>how your code becomes a running program</b>, and <b>where your data is kept while it runs</b>. Once those two ideas are clear, most of the "tricky" basic questions in interviews stop being tricky.</p>
<div class="pr-analogy"><b>Think of it like this</b>Writing Java is like writing a recipe in one universal language. A translator (the compiler) turns your recipe into a standard format that every kitchen can read. Every computer has its own chef (the JVM) who reads that standard format and cooks it on that machine. You write the recipe once, and any kitchen that has a chef can cook it.</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Source code</dt><dd>The <code>.java</code> file you write.</dd>
<dt>Compiler (javac)</dt><dd>The tool that checks your code for mistakes and turns it into bytecode.</dd>
<dt>Bytecode</dt><dd>What is inside a <code>.class</code> file. It is not tied to Windows, Mac or Linux. It is a standard set of instructions that every JVM understands.</dd>
<dt>JVM</dt><dd>Java Virtual Machine. The program that actually runs your bytecode on a real computer.</dd>
<dt>Primitive</dt><dd>A simple value like a number or true/false. Java has eight: <code>byte</code>, <code>short</code>, <code>int</code>, <code>long</code>, <code>float</code>, <code>double</code>, <code>char</code>, <code>boolean</code>.</dd>
<dt>Object</dt><dd>Anything created with <code>new</code>: a String, a list, or an instance of your own class.</dd>
<dt>Reference</dt><dd>The address of an object. A variable of an object type stores this address, not the object itself.</dd>
<dt>Stack and heap</dt><dd>Two areas of memory. The <b>stack</b> holds each running method's local variables. The <b>heap</b> holds all the objects.</dd>
</dl>

<h3>Step 1: from your code to a running program</h3>
<ol class="pr-steps">
<li>You write a file called <code>Hello.java</code>.</li>
<li>You run <code>javac Hello.java</code>. The compiler checks your code (missing semicolons, wrong types, and so on). If it is fine, it produces <code>Hello.class</code>, which contains bytecode.</li>
<li>You run <code>java Hello</code>. The JVM loads the bytecode, checks that it is safe to run, and starts running it.</li>
<li>At first the JVM reads the bytecode one instruction at a time. Code that runs very often ("hot" code) gets translated into real machine code by the <b>JIT compiler</b>, so it runs much faster the longer the program runs.</li>
</ol>
<p>This is why Java is called <b>"write once, run anywhere"</b>. The same <code>.class</code> file runs on Windows, Mac and Linux, because each of them has its own JVM that knows how to run it.</p>
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

<h3>Step 2: where your data lives</h3>
<p>Every time a method starts, Java gives it a small private workspace on the <b>stack</b>, called a <em>frame</em>. The method's local variables live in that frame. When the method finishes, its frame is thrown away.</p>
<p>Objects are different. Every object created with <code>new</code> goes on the <b>heap</b>, a big shared area of memory. The variable in the frame only holds a reference to it. Picture the reference as a note with the object's address written on it. Two variables can hold notes with the same address, and then both of them lead to the same object.</p>

<h3>A worked example, line by line</h3>
<pre><code>class Person { String name; Person(String n) { name = n; } }

public class Hello {
    static void birthday(int age)   { age++; }
    static void rename(Person p)    { p.name = "Asha"; }
    static void replace(Person p)   { p = new Person("Ravi"); }

    public static void main(String[] args) {
        int age = 30;
        Person p = new Person("Vivek");

        birthday(age);
        rename(p);
        replace(p);

        System.out.println(age + " " + p.name);   // prints: 30 Asha
    }
}</code></pre>
<ol class="pr-steps">
<li><code>int age = 30;</code> puts the number 30 directly into main's frame. It is a primitive, so the variable holds the value itself.</li>
<li><code>Person p = new Person("Vivek");</code> creates a Person object on the heap. The variable <code>p</code> holds only its address.</li>
<li><code>birthday(age)</code> gives the method a <b>copy</b> of the number 30. The method adds 1 to its own copy. Main's <code>age</code> is still 30.</li>
<li><code>rename(p)</code> gives the method a copy of the <b>address</b>. Both copies lead to the same object, so when the method changes the name, main sees it too. The name is now "Asha".</li>
<li><code>replace(p)</code> also gets a copy of the address, but then points its own copy at a brand-new object. Main's variable is untouched and still points to the original object, so the name stays "Asha".</li>
<li>The program prints <code>30 Asha</code>.</li>
</ol>
<p>This one example answers a famous interview question: <b>Java is always "pass by value"</b>. Whenever you pass something to a method, Java passes a copy. For a primitive it copies the value. For an object it copies the address. That is why a method can change what is <em>inside</em> an object, but can never make the caller's variable point to a different object.</p>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Comparing objects with ==</p>
<p><code>==</code> checks whether two variables hold the <b>same address</b>. It does not check whether two objects contain the same thing. Two separate String objects that both contain "hello" are not <code>==</code> to each other.</p>
<p>There is one confusing case. Java keeps a small set of ready-made Integer objects for the numbers -128 to 127 (this is called the <b>Integer cache</b>). So for <code>Integer a = 127, b = 127;</code> both variables point to the same cached object and <code>a == b</code> is true. With 128, Java creates two separate objects and <code>a == b</code> is false, even though both hold 128.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> compare the contents of objects with <code>a.equals(b)</code>, or <code>Objects.equals(a, b)</code>, which also copes with null.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Forgetting that an Integer can be null</p>
<p>A primitive <code>int</code> always has a value. Its object version, <code>Integer</code>, can be <code>null</code> (meaning "no value"). Java converts an Integer back into an int automatically when you do maths with it (this is called <b>unboxing</b>). If the Integer is null at that moment, the program crashes with a <code>NullPointerException</code>.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> check for null before using the value, or use the primitive <code>int</code> when "no value" should never happen.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Building a long String with + inside a loop</p>
<p>A String can never be changed after it is created (it is <b>immutable</b>). So every <code>s = s + "x"</code> creates a brand-new String and copies all the old characters into it. In a loop that runs thousands of times, this gets very slow.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use a <code>StringBuilder</code>, which grows in place, and call <code>toString()</code> once at the end.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Keeping changing data in static fields</p>
<p>A <code>static</code> field belongs to the class itself, so there is exactly one copy for the whole program, shared by every thread. If two users' requests change it at the same time, they overwrite each other's data.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> keep changing data in normal fields or local variables. Use <code>static</code> for constants and shared helpers.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Catching an exception and doing nothing</p>
<p>Writing <code>catch (Exception e) { }</code> hides the error completely. The program carries on in a broken state and nobody knows why.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> handle the error properly, log it, or let it travel up to code that can deal with it.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>Java is compiled once into bytecode, and the JVM on each computer runs it.</li>
<li>Primitives hold values. Object variables hold an address (a reference) to an object on the heap.</li>
<li>Java always passes a copy: a copy of the value, or a copy of the address.</li>
<li>Compare objects with <code>equals()</code>. Use <code>==</code> for primitives.</li>
<li>Strings never change. Use <code>StringBuilder</code> to build text in a loop.</li>
</ul>
<p><b>Next:</b> open the questions below. Each one zooms in on one of these ideas.</p>`);

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
