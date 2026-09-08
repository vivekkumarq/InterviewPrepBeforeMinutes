registerTopic("coding-basics", [
{
  q: "Reverse a string without using any built-in reverse function",
  level: "beginner", hot: true, tags: ["warmup", "strings", "two-pointers"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "HCL", "Tech Mahindra"],
  a: `<div class="cx"><b>O(n) time</b><span>each character is swapped once</span><b>O(1) extra</b><span>if you work on a char array in place</span></div>
<pre><code>// The answer they want: two pointers, in place
public static String reverse(String s) {
    char[] c = s.toCharArray();
    int i = 0, j = c.length - 1;
    while (i &lt; j) {
        char t = c[i]; c[i] = c[j]; c[j] = t;
        i++; j--;
    }
    return new String(c);
}

// Recursive variant, if they ask for it
public static String reverseRec(String s) {
    if (s == null || s.length() &lt;= 1) return s;
    return reverseRec(s.substring(1)) + s.charAt(0);   // O(n^2) — say so
}

// What you would ACTUALLY write in production
new StringBuilder(s).reverse().toString();</code></pre>
<p><strong>The follow-ups that separate candidates:</strong></p>
<table>
<tr><th>Follow-up</th><th>Answer</th></tr>
<tr><td>Why not <code>s += s.charAt(i)</code> in a loop?</td><td>Strings are immutable — each concatenation allocates a new string, making it O(n²)</td></tr>
<tr><td>Reverse the <em>words</em>, not the characters</td><td><code>s.trim().split("\\\\s+")</code>, reverse the array, <code>String.join(" ", ...)</code></td></tr>
<tr><td>What about emoji or accented characters?</td><td>This reverses UTF-16 <em>code units</em>. A surrogate pair or combining mark breaks. Correct version iterates code points.</td></tr>
<tr><td>Reverse only the letters, keep punctuation in place</td><td>Same two pointers, but skip non-letters on each side</td></tr>
</table>
<pre><code>// Unicode-safe — the answer that impresses
public static String reverseUnicode(String s) {
    return new StringBuilder(s).reverse().toString();   // handles surrogate pairs
}
// Manual code-point version
s.codePoints().collect(StringBuilder::new,
        (sb, cp) -&gt; sb.insert(0, Character.toChars(cp)), StringBuilder::append)
 .toString();</code></pre>
<p><strong>Say this out loud:</strong> "In real code I would use <code>StringBuilder.reverse()</code> — it is correct for surrogate pairs, which my manual loop is not. I am writing the manual version because the question asks for it."</p>`
},
{
  q: "Check whether a string or number is a palindrome",
  level: "beginner", hot: true, tags: ["warmup", "strings", "two-pointers"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Zoho", "Amazon"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass from both ends</span><b>O(1) space</b><span>no reversed copy needed</span></div>
<pre><code>// String — two pointers, no extra allocation
public static boolean isPalindrome(String s) {
    int i = 0, j = s.length() - 1;
    while (i &lt; j) {
        if (s.charAt(i++) != s.charAt(j--)) return false;
    }
    return true;
}

// "A man, a plan, a canal: Panama" — ignore case and non-alphanumerics
public static boolean isPalindromeClean(String s) {
    int i = 0, j = s.length() - 1;
    while (i &lt; j) {
        while (i &lt; j && !Character.isLetterOrDigit(s.charAt(i))) i++;
        while (i &lt; j && !Character.isLetterOrDigit(s.charAt(j))) j--;
        if (Character.toLowerCase(s.charAt(i++)) != Character.toLowerCase(s.charAt(j--)))
            return false;
    }
    return true;
}</code></pre>
<pre><code>// Number, WITHOUT converting to a string — the version they are really after
public static boolean isPalindrome(int x) {
    if (x &lt; 0 || (x % 10 == 0 && x != 0)) return false;   // negatives, and 10, 100...

    int reversedHalf = 0;
    while (x &gt; reversedHalf) {          // stop at the MIDDLE, so no overflow
        reversedHalf = reversedHalf * 10 + x % 10;
        x /= 10;
    }
    // even length: 1221 -> x=12, reversedHalf=12
    // odd length:  12321 -> x=12, reversedHalf=123, drop the middle digit
    return x == reversedHalf || x == reversedHalf / 10;
}</code></pre>
<p><strong>Why the half-reversal matters:</strong> reversing the whole number can overflow <code>int</code> — <code>2147483647</code> reversed does not fit. Stopping at the midpoint avoids it entirely, and mentioning overflow unprompted is exactly the kind of care interviewers are grading.</p>
<table>
<tr><th>Edge case</th><th>Expected</th></tr>
<tr><td><code>""</code> and <code>null</code></td><td>Decide and state it — usually <code>true</code> and a guard</td></tr>
<tr><td>Single character</td><td><code>true</code></td></tr>
<tr><td>Negative number</td><td><code>false</code> — the minus sign is not mirrored</td></tr>
<tr><td>Trailing zero (<code>10</code>)</td><td><code>false</code> — <code>01</code> is not the same number</td></tr>
</table>`
},
{
  q: "Find the factorial and the nth Fibonacci number — iteratively and recursively",
  level: "beginner", hot: true, tags: ["warmup", "recursion", "math", "dp"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Capgemini", "HCL", "LTIMindtree"],
  a: `<pre><code>// FACTORIAL
public static long factorial(int n) {          // iterative — preferred
    if (n &lt; 0) throw new IllegalArgumentException("n must be &gt;= 0");
    long r = 1;
    for (int i = 2; i &lt;= n; i++) r *= i;
    return r;
}
// long overflows past 20!  -> use BigInteger when n can be large
public static BigInteger factorialBig(int n) {
    BigInteger r = BigInteger.ONE;
    for (int i = 2; i &lt;= n; i++) r = r.multiply(BigInteger.valueOf(i));
    return r;
}</code></pre>
<pre><code>// FIBONACCI — three versions, and knowing WHY to pick each is the point
// 1. Naive recursion: O(2^n). fib(50) will not finish.
static long fibSlow(int n) { return n &lt; 2 ? n : fibSlow(n-1) + fibSlow(n-2); }

// 2. Memoised: O(n) time, O(n) space
static long fibMemo(int n, long[] memo) {
    if (n &lt; 2) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo);
}

// 3. Iterative: O(n) time, O(1) space — the one to write
public static long fib(int n) {
    if (n &lt; 2) return n;
    long prev = 0, curr = 1;
    for (int i = 2; i &lt;= n; i++) {
        long next = prev + curr;
        prev = curr;
        curr = next;
    }
    return curr;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 160" role="img" aria-label="Recursion tree for naive Fibonacci showing repeated subproblems">
  <text class="dg-s" x="310" y="16" text-anchor="middle">fib(5) recursion tree — the shaded nodes are recomputed</text>
  <rect class="dg-fill" x="272" y="26" width="70" height="24" rx="5"/><text class="dg-s" x="307" y="43" text-anchor="middle">fib(5)</text>
  <path class="dg-line" d="M292 50 L200 68 M322 50 L420 68"/>
  <rect class="dg-fill" x="160" y="68" width="70" height="24" rx="5"/><text class="dg-s" x="195" y="85" text-anchor="middle">fib(4)</text>
  <rect class="dg-fill2" x="386" y="68" width="70" height="24" rx="5"/><text class="dg-s" x="421" y="85" text-anchor="middle">fib(3)</text>
  <path class="dg-line" d="M180 92 L110 112 M212 92 L282 112 M404 92 L344 112 M438 92 L500 112"/>
  <rect class="dg-fill2" x="76" y="112" width="70" height="24" rx="5"/><text class="dg-s" x="111" y="129" text-anchor="middle">fib(3)</text>
  <rect class="dg-box" x="248" y="112" width="70" height="24" rx="5"/><text class="dg-s" x="283" y="129" text-anchor="middle">fib(2)</text>
  <rect class="dg-box" x="310" y="112" width="70" height="24" rx="5"/><text class="dg-s" x="345" y="129" text-anchor="middle">fib(2)</text>
  <rect class="dg-box" x="466" y="112" width="70" height="24" rx="5"/><text class="dg-s" x="501" y="129" text-anchor="middle">fib(1)</text>
  <text class="dg-s" x="310" y="152" text-anchor="middle">fib(3) computed twice, fib(2) three times — memoising collapses this to O(n)</text>
</svg>
</figure>
<table>
<tr><th>Version</th><th>Time</th><th>Space</th><th>Note</th></tr>
<tr><td>Naive recursion</td><td>O(2ⁿ)</td><td>O(n) stack</td><td>Never ship it; useful to state the recurrence</td></tr>
<tr><td>Memoised (top-down DP)</td><td>O(n)</td><td>O(n)</td><td>Smallest change from the naive version</td></tr>
<tr><td>Iterative (bottom-up)</td><td>O(n)</td><td><strong>O(1)</strong></td><td>What to write</td></tr>
<tr><td>Matrix power / fast doubling</td><td>O(log n)</td><td>O(1)</td><td>Mention it; only write it if pushed</td></tr>
</table>
<p><strong>Overflow warning to volunteer:</strong> <code>fib(93)</code> overflows a <code>long</code>. If <code>n</code> can be large the return type must be <code>BigInteger</code>. Interviewers notice when you raise limits before they do.</p>`
},
{
  q: "Check if a number is prime and print all primes up to N",
  level: "beginner", hot: true, tags: ["warmup", "math", "algorithms"],
  companies: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Zoho", "Capgemini"],
  a: `<div class="cx"><b>isPrime: O(√n)</b><span>test divisors only to the square root</span><b>Sieve: O(n log log n)</b><span>for all primes below n</span></div>
<pre><code>// Single number — O(sqrt(n)), not O(n)
public static boolean isPrime(int n) {
    if (n &lt; 2) return false;
    if (n % 2 == 0) return n == 2;              // handle 2, kill all evens
    for (int i = 3; (long) i * i &lt;= n; i += 2) {  // odd divisors only
        if (n % i == 0) return false;
    }
    return true;
}</code></pre>
<p><strong>Why <code>i * i &lt;= n</code> and not <code>i &lt;= n/2</code>:</strong> if <code>n = a × b</code> then one factor is at most √n. Checking beyond √n finds nothing new. For n = 1,000,003 that is 1000 iterations instead of 500,000 — and <code>(long) i * i</code> avoids the overflow that a naive <code>i * i</code> hits near <code>Integer.MAX_VALUE</code>.</p>
<pre><code>// All primes below n — Sieve of Eratosthenes
public static List&lt;Integer&gt; sieve(int n) {
    boolean[] composite = new boolean[n + 1];
    List&lt;Integer&gt; primes = new ArrayList&lt;&gt;();
    for (int p = 2; p &lt;= n; p++) {
        if (composite[p]) continue;
        primes.add(p);
        // start at p*p: every smaller multiple already has a smaller prime factor
        for (long m = (long) p * p; m &lt;= n; m += p) composite[(int) m] = true;
    }
    return primes;
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 120" role="img" aria-label="Sieve of Eratosthenes crossing out multiples">
  <text class="dg-s" x="16" y="26">2</text><text class="dg-s" x="56" y="26">3</text>
  <text class="dg-s" x="96" y="26">4</text><text class="dg-s" x="136" y="26">5</text>
  <text class="dg-s" x="176" y="26">6</text><text class="dg-s" x="216" y="26">7</text>
  <text class="dg-s" x="256" y="26">8</text><text class="dg-s" x="296" y="26">9</text>
  <text class="dg-s" x="336" y="26">10</text><text class="dg-s" x="380" y="26">11</text>
  <text class="dg-s" x="424" y="26">12</text><text class="dg-s" x="468" y="26">13</text>
  <path class="dg-line" d="M92 20 H112 M172 20 H192 M252 20 H272 M332 20 H356 M420 20 H444"/>
  <text class="dg-s" x="16" y="56">cross out multiples of 2</text>
  <path class="dg-line" d="M292 20 H312"/>
  <text class="dg-s" x="16" y="76">then multiples of 3, starting at 9 (3x3) — 6 was already gone</text>
  <text class="dg-s" x="16" y="100">what survives: 2 3 5 7 11 13 — every composite is struck exactly by its prime factors</text>
</svg>
</figure>
<table>
<tr><th>Situation</th><th>Use</th></tr>
<tr><td>One number, possibly large</td><td>Trial division to √n</td></tr>
<tr><td>All primes below n</td><td>Sieve — far faster than n separate tests</td></tr>
<tr><td>Many queries on a fixed range</td><td>Sieve once, then O(1) lookups</td></tr>
<tr><td>Cryptographic sizes</td><td>Miller-Rabin probabilistic test — say the name, do not implement it</td></tr>
</table>
<p><strong>Edge cases they will check:</strong> 0 and 1 are <em>not</em> prime, 2 is the only even prime, and negative numbers are not prime. Getting <code>n &lt; 2</code> wrong is the most common failure on this question.</p>`
},
{
  q: "Find duplicate characters in a string and count each character's frequency",
  level: "beginner", hot: true, tags: ["warmup", "strings", "hashing"],
  companies: ["TCS", "Infosys", "Cognizant", "Accenture", "Wipro", "Capgemini", "Amazon"],
  a: `<div class="cx"><b>O(n) time</b><span>single pass</span><b>O(k) space</b><span>k = distinct characters</span></div>
<pre><code>// Frequency count — the modern Java answer
Map&lt;Character, Integer&gt; freq = new LinkedHashMap&lt;&gt;();   // preserves first-seen order
for (char c : s.toCharArray()) {
    freq.merge(c, 1, Integer::sum);
}

// Duplicates only
freq.entrySet().stream()
    .filter(e -&gt; e.getValue() &gt; 1)
    .forEach(e -&gt; System.out.println(e.getKey() + " : " + e.getValue()));

// Streams one-liner, if they ask for it
Map&lt;Character, Long&gt; f = s.chars()
    .mapToObj(c -&gt; (char) c)
    .collect(Collectors.groupingBy(c -&gt; c, LinkedHashMap::new, Collectors.counting()));</code></pre>
<pre><code>// The O(1)-space version for a known alphabet — asked as "without a HashMap"
public static void duplicates(String s) {
    int[] count = new int[256];                  // ASCII
    for (char c : s.toCharArray()) count[c]++;
    for (int i = 0; i &lt; 256; i++) {
        if (count[i] &gt; 1) System.out.println((char) i + " : " + count[i]);
    }
}
// For lowercase a-z only, new int[26] and index with (c - 'a').</code></pre>
<p><strong>The related problems that use the same counting array</strong> — recognising the family is worth more than any single solution:</p>
<pre><code>// First NON-REPEATING character
public static char firstUnique(String s) {
    int[] count = new int[256];
    for (char c : s.toCharArray()) count[c]++;
    for (char c : s.toCharArray()) if (count[c] == 1) return c;   // 2nd pass keeps ORDER
    return '_';
}

// Are two strings ANAGRAMS?
public static boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;                   // cheap early exit
    int[] count = new int[26];
    for (int i = 0; i &lt; a.length(); i++) {
        count[a.charAt(i) - 'a']++;
        count[b.charAt(i) - 'a']--;                               // one pass, not two
    }
    for (int c : count) if (c != 0) return false;
    return true;
}</code></pre>
<table>
<tr><th>Question</th><th>Trap</th></tr>
<tr><td>First non-repeating character</td><td>Must return the <em>first by position</em> — a plain <code>HashMap</code> loses order, so either use <code>LinkedHashMap</code> or re-scan the string</td></tr>
<tr><td>Anagram check</td><td>Sorting both is O(n log n); counting is O(n). Also ask about case and spaces.</td></tr>
<tr><td>"Without extra space"</td><td>A fixed 26- or 256-element array is O(1) space — say that explicitly, it is the answer they want</td></tr>
</table>`
},
{
  q: "Swap two numbers without a third variable, and swap two objects in Java",
  level: "advanced", tags: ["warmup", "math", "gotcha"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "HCL", "Tech Mahindra"],
  a: `<pre><code>// Arithmetic — the classic answer
a = a + b;
b = a - b;   // = original a
a = a - b;   // = original b
// RISK: a + b can overflow int, and the result is then wrong.

// XOR — no overflow
a = a ^ b;
b = a ^ b;
a = a ^ b;
// RISK: if a and b are the SAME VARIABLE (or same array slot), this zeroes it.

// Single expression
a = a + b - (b = a);

// What you should actually write
int t = a; a = b; b = t;</code></pre>
<p><strong>The XOR trap, concretely:</strong></p>
<pre><code>void swap(int[] arr, int i, int j) {
    arr[i] ^= arr[j];
    arr[j] ^= arr[i];
    arr[i] ^= arr[j];
}
swap(arr, 2, 2);   // arr[2] becomes 0 — silently corrupts the array
// This is a real bug that has shipped. Always guard: if (i == j) return;</code></pre>
<p><strong>Swapping objects</strong> — this is where the question gets interesting, because <strong>Java is strictly pass-by-value</strong>:</p>
<pre><code>// This does NOTHING to the caller's variables
static void swap(String a, String b) { String t = a; a = b; b = t; }
// The references are COPIED into the method. Reassigning the copies
// changes nothing outside. Java has no pass-by-reference, at all.

// It works only if you swap through a shared container
static &lt;T&gt; void swap(T[] arr, int i, int j) {
    T t = arr[i]; arr[i] = arr[j]; arr[j] = t;
}
static &lt;T&gt; void swap(List&lt;T&gt; list, int i, int j) {
    Collections.swap(list, i, j);
}</code></pre>
<p><strong>The point to make:</strong> "Java passes references <em>by value</em>. I can mutate the object a reference points to, but I cannot make the caller's variable point somewhere else. That is why a two-argument <code>swap</code> is impossible in Java, and why the answer has to work through an array, a list, or a holder object."</p>
<p>And the honest closing line: "The no-temp tricks are interview folklore. A temporary variable is clearer, cannot overflow, has no aliasing bug, and modern compilers produce identical machine code — so I would never use them in real work."</p>`
},
{
  q: "Print the common star patterns — pyramid, Pascal's triangle and a diamond",
  level: "beginner", tags: ["warmup", "pattern-printing", "practice"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "HCL", "Tech Mahindra", "LTIMindtree"],
  a: `<p>Pattern questions look trivial but they are testing one thing: can you reason about loop bounds precisely? The trick is always to write down, for row <code>i</code>, <em>how many spaces</em> and <em>how many stars</em>.</p>
<pre><code>// RIGHT TRIANGLE          // n = 5
// *                       row i -> i stars
// **
// ***
// ****
// *****
for (int i = 1; i &lt;= n; i++) {
    System.out.println("*".repeat(i));
}</code></pre>
<pre><code>// PYRAMID                 // row i -> (n-i) spaces, (2i-1) stars
//     *
//    ***
//   *****
//  *******
// *********
for (int i = 1; i &lt;= n; i++) {
    System.out.println(" ".repeat(n - i) + "*".repeat(2 * i - 1));
}

// DIAMOND = pyramid + inverted pyramid (skip the repeated middle row)
for (int i = 1; i &lt;= n; i++)  System.out.println(" ".repeat(n - i) + "*".repeat(2 * i - 1));
for (int i = n - 1; i &gt;= 1; i--) System.out.println(" ".repeat(n - i) + "*".repeat(2 * i - 1));</code></pre>
<pre><code>// PASCAL'S TRIANGLE — the one that is actually about maths
//      1
//     1 1
//    1 2 1
//   1 3 3 1
//  1 4 6 4 1
public static void pascal(int n) {
    for (int i = 0; i &lt; n; i++) {
        System.out.print(" ".repeat(n - i));
        long val = 1;                            // C(i,0)
        for (int j = 0; j &lt;= i; j++) {
            System.out.print(val + " ");
            val = val * (i - j) / (j + 1);       // C(i,j+1) from C(i,j) — no factorials
        }
        System.out.println();
    }
}</code></pre>
<table>
<tr><th>Pattern</th><th>Row <code>i</code> (1-based, n rows)</th></tr>
<tr><td>Right triangle</td><td><code>i</code> stars</td></tr>
<tr><td>Inverted triangle</td><td><code>n - i + 1</code> stars</td></tr>
<tr><td>Pyramid</td><td><code>n - i</code> spaces, <code>2i - 1</code> stars</td></tr>
<tr><td>Hollow pyramid</td><td>Star only when <code>j == 0</code>, <code>j == 2i-2</code>, or <code>i == n</code></td></tr>
<tr><td>Diamond</td><td>Pyramid then inverted, middle row printed once</td></tr>
<tr><td>Pascal</td><td><code>C(i,j+1) = C(i,j) × (i-j) / (j+1)</code></td></tr>
</table>
<p><strong>Two things that score points:</strong> use <code>String.repeat(n)</code> (Java 11+) instead of nested inner loops — it reads far better; and build one line in a <code>StringBuilder</code> and print once rather than calling <code>System.out.print</code> per character, which is genuinely slow because each call can flush.</p>`
},
{
  q: "Find the second largest element in an array, and the missing number from 1..n",
  level: "advanced", hot: true, tags: ["warmup", "arrays", "math"],
  companies: ["TCS", "Infosys", "Cognizant", "Wipro", "Accenture", "Amazon", "Zoho"],
  a: `<div class="cx"><b>O(n) time</b><span>single pass, no sorting</span><b>O(1) space</b><span>two tracked values</span></div>
<pre><code>// SECOND LARGEST — one pass, handles duplicates
public static int secondLargest(int[] a) {
    if (a.length &lt; 2) throw new IllegalArgumentException("need 2+ elements");
    long first = Long.MIN_VALUE, second = Long.MIN_VALUE;
    for (int x : a) {
        if (x &gt; first)        { second = first; first = x; }
        else if (x &gt; second && x != first) { second = x; }   // != first skips duplicates
    }
    if (second == Long.MIN_VALUE) throw new IllegalStateException("all elements equal");
    return (int) second;
}
// Sorting is O(n log n) AND mutates the input — say why you did not.</code></pre>
<p><strong>The clarifying question to ask first:</strong> for <code>[5, 5, 3]</code>, is the second largest <code>5</code> (second by position) or <code>3</code> (second <em>distinct</em> value)? Asking this before coding is the single highest-signal move on this problem.</p>
<pre><code>// MISSING NUMBER from 1..n, exactly one missing
// Approach 1 — sum formula. Simple, but n*(n+1)/2 can overflow for large n.
public static int missing(int[] a, int n) {
    long expected = (long) n * (n + 1) / 2;
    long actual = 0;
    for (int x : a) actual += x;
    return (int) (expected - actual);
}

// Approach 2 — XOR. No overflow at all, same O(n)/O(1).
public static int missingXor(int[] a, int n) {
    int x = 0;
    for (int i = 1; i &lt;= n; i++) x ^= i;
    for (int v : a) x ^= v;
    return x;               // every present number cancels itself out
}</code></pre>
<table>
<tr><th>Variant</th><th>Approach</th></tr>
<tr><td>One number missing</td><td>Sum formula or XOR</td></tr>
<tr><td><strong>Two</strong> numbers missing</td><td>Sum gives a+b, sum of squares gives a²+b² — solve the pair</td></tr>
<tr><td>One missing, one duplicated</td><td>Cyclic sort, or XOR partitioned by a differing bit</td></tr>
<tr><td>Range is 0..n</td><td>Same, but the expected sum is <code>n(n+1)/2</code> over 0..n</td></tr>
<tr><td>Array is unsorted, no range given</td><td>"First missing positive" — cyclic sort in O(n)/O(1)</td></tr>
</table>
<pre><code>// Bonus: first missing POSITIVE integer, O(n) time and O(1) space
public static int firstMissingPositive(int[] a) {
    int n = a.length;
    for (int i = 0; i &lt; n; i++) {
        while (a[i] &gt; 0 && a[i] &lt;= n && a[a[i] - 1] != a[i]) {
            int t = a[a[i] - 1]; a[a[i] - 1] = a[i]; a[i] = t;   // put a[i] at index a[i]-1
        }
    }
    for (int i = 0; i &lt; n; i++) if (a[i] != i + 1) return i + 1;
    return n + 1;
}</code></pre>`
},
{
  q: "Remove duplicates from an array and from a list, preserving order",
  level: "advanced", hot: true, tags: ["warmup", "arrays", "collections"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "Zoho"],
  a: `<pre><code>// Unsorted, order matters — LinkedHashSet in one line
List&lt;Integer&gt; unique = new ArrayList&lt;&gt;(new LinkedHashSet&lt;&gt;(list));

// Streams
List&lt;Integer&gt; unique = list.stream().distinct().toList();

// Without any collection API, on a SORTED array — the version they usually want.
// Two pointers, in place, O(n) time and O(1) space.
public static int removeDuplicates(int[] a) {
    if (a.length == 0) return 0;
    int write = 1;
    for (int read = 1; read &lt; a.length; read++) {
        if (a[read] != a[write - 1]) a[write++] = a[read];
    }
    return write;                  // a[0..write-1] holds the unique values
}</code></pre>
<figure class="fig">
<svg viewBox="0 0 620 130" role="img" aria-label="Two pointer in place duplicate removal">
  <text class="dg-s" x="16" y="20">input (sorted):</text>
  <g>
    <rect class="dg-fill" x="16" y="30" width="42" height="30" rx="4"/><text class="dg-t" x="37" y="50" text-anchor="middle">1</text>
    <rect class="dg-fill" x="62" y="30" width="42" height="30" rx="4"/><text class="dg-t" x="83" y="50" text-anchor="middle">1</text>
    <rect class="dg-fill" x="108" y="30" width="42" height="30" rx="4"/><text class="dg-t" x="129" y="50" text-anchor="middle">2</text>
    <rect class="dg-fill" x="154" y="30" width="42" height="30" rx="4"/><text class="dg-t" x="175" y="50" text-anchor="middle">2</text>
    <rect class="dg-fill" x="200" y="30" width="42" height="30" rx="4"/><text class="dg-t" x="221" y="50" text-anchor="middle">2</text>
    <rect class="dg-fill" x="246" y="30" width="42" height="30" rx="4"/><text class="dg-t" x="267" y="50" text-anchor="middle">3</text>
  </g>
  <text class="dg-s" x="37" y="76" text-anchor="middle">write</text>
  <text class="dg-s" x="221" y="76" text-anchor="middle">read</text>
  <text class="dg-s" x="330" y="50">write only when a[read] differs from the</text>
  <text class="dg-s" x="330" y="68">last kept value — read always advances</text>
  <text class="dg-s" x="16" y="106">result: 1 2 3 | ... (length returned; the tail is left as-is, never resized)</text>
</svg>
</figure>
<table>
<tr><th>Input</th><th>Best approach</th><th>Complexity</th></tr>
<tr><td>Sorted array, in place</td><td>Two pointers</td><td>O(n) / O(1)</td></tr>
<tr><td>Unsorted, order matters</td><td><code>LinkedHashSet</code></td><td>O(n) / O(n)</td></tr>
<tr><td>Unsorted, order irrelevant</td><td><code>HashSet</code></td><td>O(n) / O(n)</td></tr>
<tr><td>Unsorted, no extra space allowed</td><td>Sort first, then two pointers</td><td>O(n log n) / O(1)</td></tr>
<tr><td>Objects, custom identity</td><td><code>TreeSet</code> with a comparator, or <code>Collectors.toMap</code> keyed by the id</td><td>O(n log n) / O(n)</td></tr>
</table>
<pre><code>// De-duplicating OBJECTS by one field, keeping the first occurrence
List&lt;User&gt; unique = users.stream()
    .collect(Collectors.toMap(User::getEmail, u -&gt; u, (first, dup) -&gt; first, LinkedHashMap::new))
    .values().stream().toList();</code></pre>
<p><strong>The gotcha for object de-duplication:</strong> <code>HashSet</code> and <code>distinct()</code> rely on <code>equals</code> and <code>hashCode</code>. If your class does not override both consistently, duplicates survive — and this is exactly the bug interviewers plant. Records give you both for free, which is why they are worth mentioning here.</p>`
},
{
  q: "Sort an array without a built-in sort — write bubble, selection and insertion sort",
  level: "advanced", tags: ["warmup", "sorting", "complexity"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "HCL", "Cognizant", "Accenture"],
  a: `<pre><code>// BUBBLE SORT — with the early-exit that most candidates forget
public static void bubbleSort(int[] a) {
    for (int i = 0; i &lt; a.length - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j &lt; a.length - 1 - i; j++) {   // -i: the tail is already sorted
            if (a[j] &gt; a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) return;        // already sorted -> O(n) best case
    }
}

// SELECTION SORT — fewest SWAPS (n-1), useful when writes are expensive
public static void selectionSort(int[] a) {
    for (int i = 0; i &lt; a.length - 1; i++) {
        int min = i;
        for (int j = i + 1; j &lt; a.length; j++) if (a[j] &lt; a[min]) min = j;
        int t = a[i]; a[i] = a[min]; a[min] = t;
    }
}

// INSERTION SORT — the one that is genuinely useful
public static void insertionSort(int[] a) {
    for (int i = 1; i &lt; a.length; i++) {
        int key = a[i], j = i - 1;
        while (j &gt;= 0 && a[j] &gt; key) a[j + 1] = a[j--];   // shift, do not swap
        a[j + 1] = key;
    }
}</code></pre>
<table>
<tr><th></th><th>Best</th><th>Average</th><th>Worst</th><th>Space</th><th>Stable</th></tr>
<tr><td>Bubble</td><td>O(n)*</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>Yes</td></tr>
<tr><td>Selection</td><td>O(n²)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td><strong>No</strong></td></tr>
<tr><td>Insertion</td><td><strong>O(n)</strong></td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>Yes</td></tr>
<tr><td>Merge</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td>Yes</td></tr>
<tr><td>Quick</td><td>O(n log n)</td><td>O(n log n)</td><td><strong>O(n²)</strong></td><td>O(log n)</td><td>No</td></tr>
<tr><td>Heap</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>No</td></tr>
</table>
<p>* only with the <code>swapped</code> early exit.</p>
<p><strong>Why insertion sort actually matters in production:</strong> it is O(n) on nearly-sorted data and has tiny constant factors, so real library sorts switch to it for small subarrays. Java's <code>Arrays.sort(int[])</code> is a dual-pivot quicksort that falls back to insertion sort below about 47 elements; <code>Arrays.sort(Object[])</code> is TimSort, which is merge sort built on runs of already-sorted data plus insertion sort.</p>
<p><strong>The follow-up to be ready for — "why two different algorithms?"</strong> Primitives have no identity, so an unstable sort is unobservable and quicksort's speed and O(1) space win. Objects can be equal but distinguishable, so stability is a guarantee the library must keep, and that requires a merge-based sort.</p>`
},
{
  q: "Count vowels, consonants, words and characters in a sentence",
  level: "beginner", tags: ["warmup", "strings", "practice"],
  companies: ["TCS", "Infosys", "Wipro", "Capgemini", "HCL", "Tech Mahindra"],
  a: `<pre><code>public static void analyse(String s) {
    int vowels = 0, consonants = 0, digits = 0, spaces = 0, others = 0;

    for (char c : s.toLowerCase().toCharArray()) {
        if (c &gt;= 'a' && c &lt;= 'z') {
            if ("aeiou".indexOf(c) &gt;= 0) vowels++; else consonants++;
        }
        else if (Character.isDigit(c)) digits++;
        else if (Character.isWhitespace(c)) spaces++;
        else others++;
    }

    // Word count: split on RUNS of whitespace, and trim first.
    // "a  b ".split(" ") gives ["a", "", "b"] — a classic off-by-one bug.
    String t = s.trim();
    int words = t.isEmpty() ? 0 : t.split("\\\\s+").length;

    System.out.printf("vowels=%d consonants=%d digits=%d spaces=%d other=%d words=%d chars=%d%n",
            vowels, consonants, digits, spaces, others, words, s.length());
}</code></pre>
<pre><code>// Stream version, if they want to see Java 8
long vowels = s.toLowerCase().chars().filter(c -&gt; "aeiou".indexOf(c) &gt;= 0).count();
long words  = Arrays.stream(s.trim().split("\\\\s+")).filter(w -&gt; !w.isEmpty()).count();

// Word FREQUENCY, the natural follow-up
Map&lt;String, Long&gt; freq = Arrays.stream(s.toLowerCase().split("\\\\W+"))
    .filter(w -&gt; !w.isEmpty())
    .collect(Collectors.groupingBy(w -&gt; w, TreeMap::new, Collectors.counting()));</code></pre>
<table>
<tr><th>Trap</th><th>Why it bites</th></tr>
<tr><td><code>split(" ")</code></td><td>Double spaces produce empty tokens — use <code>\\s+</code> and <code>trim()</code></td></tr>
<tr><td>Empty or blank input</td><td><code>"".split("\\s+")</code> returns an array of length 1, so the count is 1 not 0</td></tr>
<tr><td>Not lowercasing</td><td><code>'A'</code> is missed as a vowel</td></tr>
<tr><td><code>s.length()</code> as "characters"</td><td>Returns UTF-16 units — an emoji counts as 2. Use <code>s.codePointCount(0, s.length())</code></td></tr>
<tr><td>'y'</td><td>Ask whether it counts as a vowel — the interviewer usually has an opinion</td></tr>
</table>
<p><strong>The move that scores:</strong> ask about the definition before you code. "Is a hyphenated word one word or two? Do numbers count as words? Should I count Unicode characters or UTF-16 units?" Those are the questions a careful engineer asks, and they are cheap to ask.</p>`
},
{
  q: "Find the largest and smallest number, and the sum of digits, in an integer",
  level: "beginner", tags: ["warmup", "math", "arrays"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "HCL", "Capgemini", "LTIMindtree"],
  a: `<pre><code>// MIN and MAX in ONE pass — and note the initialisation
public static int[] minMax(int[] a) {
    if (a.length == 0) throw new IllegalArgumentException("empty array");
    int min = a[0], max = a[0];          // seed from the DATA, not from 0
    for (int x : a) {
        if (x &lt; min) min = x;
        else if (x &gt; max) max = x;       // else-if: at most one comparison usually
    }
    return new int[]{min, max};
}
// Seeding min = 0 is the classic bug: an all-positive array then reports 0.</code></pre>
<pre><code>// SUM OF DIGITS
public static int digitSum(int n) {
    n = Math.abs(n);
    int sum = 0;
    while (n &gt; 0) { sum += n % 10; n /= 10; }
    return sum;
}

// DIGITAL ROOT — repeat until one digit is left
public static int digitalRoot(int n) {
    return n == 0 ? 0 : 1 + (n - 1) % 9;    // closed form, no loop at all
}

// REVERSE a number, overflow-safe
public static int reverseNumber(int n) {
    long r = 0;
    while (n != 0) { r = r * 10 + n % 10; n /= 10; }
    return (r &gt; Integer.MAX_VALUE || r &lt; Integer.MIN_VALUE) ? 0 : (int) r;
}

// ARMSTRONG number: 153 = 1^3 + 5^3 + 3^3
public static boolean isArmstrong(int n) {
    int digits = String.valueOf(n).length(), sum = 0, t = n;
    while (t &gt; 0) { sum += Math.pow(t % 10, digits); t /= 10; }
    return sum == n;
}</code></pre>
<div class="cx"><b>All O(d)</b><span>d = number of digits ≈ log₁₀(n), so effectively constant for an int</span></div>
<table>
<tr><th>Trap</th><th>Fix</th></tr>
<tr><td>Seeding <code>min = 0</code> or <code>max = 0</code></td><td>Seed from <code>a[0]</code>, or use <code>Integer.MAX_VALUE</code>/<code>MIN_VALUE</code></td></tr>
<tr><td>Empty array</td><td>Throw, or return an <code>Optional</code> — decide and say so</td></tr>
<tr><td>Negative input to <code>digitSum</code></td><td><code>n % 10</code> is negative in Java — take <code>Math.abs</code> first</td></tr>
<tr><td><code>Math.abs(Integer.MIN_VALUE)</code></td><td>Returns <code>Integer.MIN_VALUE</code> — still negative. Promote to <code>long</code>.</td></tr>
<tr><td>Reversing overflows</td><td>Accumulate in a <code>long</code> and range-check before narrowing</td></tr>
</table>
<p><strong>The one that catches almost everyone:</strong> <code>Math.abs(Integer.MIN_VALUE)</code> is <em>negative</em>, because <code>-Integer.MIN_VALUE</code> overflows back to itself. Two's complement has one more negative value than positive. Raising this shows genuine awareness of the numeric type, not just the algorithm.</p>`
}
]);
