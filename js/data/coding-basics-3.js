appendTopic("coding-basics", [
{
  q: "The string questions every first round asks — and the Java details behind them",
  level: "beginner", hot: true, tags: ["strings", "basics", "must-know"],
  companies: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Capgemini", "HCL", "Amazon"],
  a: `<pre><code>// REVERSE — without StringBuilder.reverse(), which is what they mean
public static String reverse(String s) {
    char[] c = s.toCharArray();
    for (int i = 0, j = c.length - 1; i &lt; j; i++, j--) {
        char t = c[i]; c[i] = c[j]; c[j] = t;
    }
    return new String(c);
}
// Loop while i < j, not i < length — otherwise you swap everything twice and
// get the original string back. That is the single most common slip here.

// PALINDROME — two pointers, no extra allocation
public static boolean isPalindrome(String s) {
    for (int i = 0, j = s.length() - 1; i &lt; j; i++, j--)
        if (s.charAt(i) != s.charAt(j)) return false;
    return true;
}
// Ask first: ignore case? ignore punctuation? Unicode? For "A man, a plan,
// a canal: Panama" you need Character.isLetterOrDigit and toLowerCase.</code></pre>
<pre><code>// ANAGRAM — counting beats sorting
public static boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;      // cheap early exit
    int[] count = new int[26];
    for (int i = 0; i &lt; a.length(); i++) {
        count[a.charAt(i) - 'a']++;
        count[b.charAt(i) - 'a']--;                  // one pass, both strings
    }
    for (int c : count) if (c != 0) return false;
    return true;
}
// O(n) versus O(n log n) for sorting both. The int[26] is O(1) space —
// bounded by the alphabet, not the input. Say that; people call it O(n).
// For Unicode, swap to a HashMap&lt;Character,Integer&gt;.

// FIRST NON-REPEATING CHARACTER — two passes, or LinkedHashMap in one
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;
for (char c : s.toCharArray()) if (freq[c - 'a'] == 1) return c;
return '_';</code></pre>
<table>
<tr><th>Java string fact</th><th>Why it gets asked</th></tr>
<tr><td><code>String</code> is <strong>immutable</strong></td><td>Safe to share, cacheable hash, usable as a map key — and every "modification" allocates</td></tr>
<tr><td><code>+</code> inside a loop is O(n²)</td><td>Each concatenation copies the whole string. Use <code>StringBuilder</code></td></tr>
<tr><td><code>==</code> vs <code>.equals()</code></td><td><code>==</code> compares references. Literals are interned so <code>==</code> may <em>appear</em> to work, then fails on a runtime-built string</td></tr>
<tr><td><code>StringBuilder</code> vs <code>StringBuffer</code></td><td>Buffer is synchronised and slower; builder is the default choice</td></tr>
<tr><td><code>substring</code> is O(n)</td><td>Since Java 7 it copies rather than sharing the backing array — no more memory-leak surprise</td></tr>
<tr><td>Compact strings (Java 9+)</td><td>Latin-1 text uses <code>byte[]</code>, halving memory versus the old <code>char[]</code></td></tr>
</table>
<pre><code>// The == trap, exactly as it is set in interviews
String a = "hello";
String b = "hello";
String c = new String("hello");
String d = "hel" + "lo";                  // folded at COMPILE time
String e = getPrefix() + "lo";            // built at RUNTIME

a == b            // true  — both point at the same interned literal
a == c            // false — new String() forces a fresh object
a == d            // true  — constant folding makes it the same literal
a == e            // FALSE — and this is the bug that reaches production
a.equals(e)       // true  — always compare content with equals()</code></pre>
<p><strong>Ask about the input before you code:</strong> can it be null? empty? mixed case? Unicode rather than a–z? Handling <code>null</code> with one guard line and <em>saying</em> "empty string returns true for palindrome, by convention" takes five seconds and is exactly the defensive habit the round is screening for.</p>`
},
{
  q: "Number problems: primes, factorials, Fibonacci, GCD and integer overflow",
  level: "beginner", hot: true, tags: ["math", "basics", "overflow", "must-know"],
  companies: ["TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "Cognizant", "Zoho", "Amazon"],
  a: `<pre><code>// PRIME CHECK — stop at the square root, and step by 2
public static boolean isPrime(int n) {
    if (n &lt; 2) return false;
    if (n % 2 == 0) return n == 2;
    for (int i = 3; (long) i * i &lt;= n; i += 2)     // (long) avoids i*i overflowing
        if (n % i == 0) return false;
    return true;
}
// Why sqrt(n)? Any factor above it pairs with one below it, so if none exists
// below, none exists at all. O(sqrt n) instead of O(n) — be ready to say it.

// SIEVE OF ERATOSTHENES — all primes up to n in O(n log log n)
boolean[] composite = new boolean[n + 1];
for (int i = 2; (long) i * i &lt;= n; i++)
    if (!composite[i])
        for (int j = i * i; j &lt;= n; j += i) composite[j] = true;   // start at i*i
// Starting at i*i, not 2*i: everything smaller was already struck out by a
// smaller prime. Use the sieve whenever you need MANY prime checks; use the
// sqrt loop for one.</code></pre>
<pre><code>// FIBONACCI — the three versions, and why the first one is the wrong answer
long fibBad(int n) { return n &lt; 2 ? n : fibBad(n-1) + fibBad(n-2); }  // O(2^n)
// fib(50) recursive: minutes. Iterative: instant. Show you know the difference.

long fib(int n) {                                    // O(n) time, O(1) space
    long a = 0, b = 1;
    for (int i = 0; i &lt; n; i++) { long t = a + b; a = b; b = t; }
    return a;
}
// Memoised recursion is also O(n) and is the natural bridge to explaining DP.
// There is an O(log n) matrix-exponentiation form — worth naming, rarely needed.

// FACTORIAL — overflows almost immediately
// int  overflows at 13!   long overflows at 21!
// Beyond that: BigInteger. Mentioning the ceiling unprompted scores well.
BigInteger f = BigInteger.ONE;
for (int i = 2; i &lt;= n; i++) f = f.multiply(BigInteger.valueOf(i));</code></pre>
<pre><code>// GCD — Euclid, three lines, and LCM follows from it
static long gcd(long a, long b) { return b == 0 ? a : gcd(b, a % b); }
static long lcm(long a, long b) { return a / gcd(a, b) * b; }
//                                        ^ divide FIRST — a*b can overflow
//                                          even when the result fits</code></pre>
<table>
<tr><th>Overflow trap</th><th>Fix</th></tr>
<tr><td><code>(lo + hi) / 2</code> in binary search</td><td><code>lo + (hi - lo) / 2</code></td></tr>
<tr><td><code>i * i &lt;= n</code></td><td><code>(long) i * i &lt;= n</code> — the cast goes <em>before</em> the multiply</td></tr>
<tr><td><code>a * b / c</code></td><td>Divide first where it is exact</td></tr>
<tr><td><code>Math.abs(Integer.MIN_VALUE)</code></td><td>Returns <strong>itself</strong>, still negative — no positive counterpart exists</td></tr>
<tr><td>Reversing an integer</td><td>Check <code>result &gt; (Integer.MAX_VALUE - digit) / 10</code> before multiplying</td></tr>
<tr><td>Silent wraparound</td><td><code>Math.addExact</code> / <code>multiplyExact</code> throw instead</td></tr>
</table>
<pre><code>// ARMSTRONG, PERFECT, PALINDROME NUMBER — all the same digit loop
int temp = n, sum = 0;
while (temp &gt; 0) { int d = temp % 10; sum += d * d * d; temp /= 10; }
return sum == n;
// %10 peels the last digit, /10 drops it. Every digit problem is this loop.
// Negative input: -121 is not a palindrome. Say so before they ask.</code></pre>
<p><strong>The habit that separates candidates:</strong> state the complexity and the overflow boundary without being asked. "This is O(sqrt n), and I cast to long in the comparison because <code>i*i</code> overflows an int near 46341" is a complete answer to a question that was only about primes.</p>`
}
]);
