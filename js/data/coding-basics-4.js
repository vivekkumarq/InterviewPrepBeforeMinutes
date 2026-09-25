registerPrimer("coding-basics", `<h3>The mental model: a fixed routine beats inspiration</h3>
<p>First-round coding questions are rarely hard. What interviewers score is <strong>how you get there</strong>: do you clarify the problem, try examples, start with something that works, improve it, and test it? Following the same six steps every time keeps you calm and shows exactly the habits they are looking for.</p>
<figure class="fig">
<svg viewBox="0 0 620 176" role="img" aria-label="Six-step routine for a coding question: understand, examples, brute force, optimise, code, test">
  <defs><marker id="pr-cb" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-fill" x="6" y="30" width="88" height="62" rx="8"/><text class="dg-t" x="50" y="54" text-anchor="middle">1 Understand</text><text class="dg-s" x="50" y="70" text-anchor="middle">input, output,</text><text class="dg-s" x="50" y="83" text-anchor="middle">limits</text>
  <line class="dg-line" x1="94" y1="61" x2="104" y2="61" marker-end="url(#pr-cb)"/>
  <rect class="dg-fill" x="106" y="30" width="88" height="62" rx="8"/><text class="dg-t" x="150" y="54" text-anchor="middle">2 Examples</text><text class="dg-s" x="150" y="70" text-anchor="middle">normal + edge</text><text class="dg-s" x="150" y="83" text-anchor="middle">cases, by hand</text>
  <line class="dg-line" x1="194" y1="61" x2="204" y2="61" marker-end="url(#pr-cb)"/>
  <rect class="dg-fill2" x="206" y="30" width="88" height="62" rx="8"/><text class="dg-t" x="250" y="54" text-anchor="middle">3 Brute force</text><text class="dg-s" x="250" y="70" text-anchor="middle">say it + its</text><text class="dg-s" x="250" y="83" text-anchor="middle">complexity</text>
  <line class="dg-line" x1="294" y1="61" x2="304" y2="61" marker-end="url(#pr-cb)"/>
  <rect class="dg-fill2" x="306" y="30" width="88" height="62" rx="8"/><text class="dg-t" x="350" y="54" text-anchor="middle">4 Optimise</text><text class="dg-s" x="350" y="70" text-anchor="middle">what work is</text><text class="dg-s" x="350" y="83" text-anchor="middle">repeated?</text>
  <line class="dg-line" x1="394" y1="61" x2="404" y2="61" marker-end="url(#pr-cb)"/>
  <rect class="dg-fill" x="406" y="30" width="88" height="62" rx="8"/><text class="dg-t" x="450" y="54" text-anchor="middle">5 Code</text><text class="dg-s" x="450" y="70" text-anchor="middle">clear names,</text><text class="dg-s" x="450" y="83" text-anchor="middle">talk as you go</text>
  <line class="dg-line" x1="494" y1="61" x2="504" y2="61" marker-end="url(#pr-cb)"/>
  <rect class="dg-fill" x="506" y="30" width="108" height="62" rx="8"/><text class="dg-t" x="560" y="54" text-anchor="middle">6 Test</text><text class="dg-s" x="560" y="70" text-anchor="middle">trace an example,</text><text class="dg-s" x="560" y="83" text-anchor="middle">then the edges</text>
  <text class="dg-s" x="10" y="124">Steps 1 and 2 take two minutes and prevent the most common failure: solving a different problem.</text>
  <text class="dg-s" x="10" y="144">Step 3 guarantees you have SOMETHING working. Step 4 is where the interview is actually won.</text>
  <text class="dg-s" x="10" y="164">Edge cases to always try: empty, one element, all equal, negatives, very large, null.</text>
</svg>
<figcaption>The same routine for every problem, from "reverse a string" to graph questions.</figcaption>
</figure>
<h3>Worked example: "Are these two strings anagrams?"</h3>
<pre><code>1 UNDERSTAND   "listen" and "silent" -&gt; true. Case-sensitive? Spaces count?
               Unicode? (Ask. Assume lowercase a-z unless told otherwise.)

2 EXAMPLES     ("listen","silent") true   ("rat","car") false
               ("","") true               ("a","aa") false  &lt;- different lengths

3 BRUTE FORCE  Sort both strings and compare.  O(n log n) time.
               Works, and it is fine to say "I'd start with this".

4 OPTIMISE     Sorting does more than we need: we only need COUNTS.
               Count each letter in one string, subtract for the other.
               O(n) time, O(1) space (26 counters).</code></pre>
<pre><code>// 5 CODE
static boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;      // cheap early exit
    int[] count = new int[26];
    for (int i = 0; i &lt; a.length(); i++) {
        count[a.charAt(i) - 'a']++;
        count[b.charAt(i) - 'a']--;
    }
    for (int c : count) if (c != 0) return false;
    return true;
}

// 6 TEST, out loud: "listen"/"silent"
//   after the loop every counter is 0 -&gt; true
//   "rat"/"car": t +1, c -1 remain -&gt; false
//   "a"/"aa": lengths differ -&gt; false before the loop
//   Any character outside a-z would index out of bounds: mention it, and
//   switch to a HashMap&lt;Character, Integer&gt; if the input can contain them.</code></pre>
<h3>The small Java details interviewers notice</h3>
<table>
<tr><th>Detail</th><th>Why it matters</th></tr>
<tr><td><code>c - 'a'</code> turns a letter into 0..25</td><td>The standard trick for counting letters in an array</td></tr>
<tr><td><code>StringBuilder</code> in loops, not <code>+=</code></td><td>String concatenation in a loop is O(n²)</td></tr>
<tr><td><code>equals()</code> for strings, never <code>==</code></td><td><code>==</code> compares references</td></tr>
<tr><td>Check for overflow when multiplying or reversing numbers</td><td><code>int</code> silently wraps around</td></tr>
<tr><td>State the complexity before you are asked</td><td>It shows you know why the optimised version is better</td></tr>
</table>`);

appendTopic("coding-basics", [
{
  q: "Check if two strings are anagrams, then group a list of words into anagram groups",
  level: "beginner", hot: true, tags: ["strings", "hashing", "counting", "must-know"],
  companies: ["Amazon", "Microsoft", "Infosys", "TCS", "Wipro", "Accenture", "Goldman Sachs", "Adobe"],
  a: `<div class="cx"><b>O(n · k) time</b><span>n words of length k</span><b>O(n · k) space</b><span>the groups</span></div>
<p>The single-pair check is in the primer above: count letters, compare counts. The follow-up is almost always "now group these words": <code>["eat","tea","tan","ate","nat","bat"]</code> becomes <code>[["eat","tea","ate"], ["tan","nat"], ["bat"]]</code>.</p>
<p><strong>The key idea:</strong> give every word a <em>signature</em> that is identical for all its anagrams, then group by signature in a map.</p>
<pre><code>// Signature 1: the sorted letters. "eat", "tea", "ate" all become "aet".
static List&lt;List&lt;String&gt;&gt; groupAnagramsSorted(String[] words) {
    Map&lt;String, List&lt;String&gt;&gt; groups = new HashMap&lt;&gt;();
    for (String w : words) {
        char[] c = w.toCharArray();
        Arrays.sort(c);                                  // O(k log k)
        groups.computeIfAbsent(new String(c), key -&gt; new ArrayList&lt;&gt;()).add(w);
    }
    return new ArrayList&lt;&gt;(groups.values());
}
// O(n · k log k)

// Signature 2: the letter counts, e.g. "1#0#0#...#1#...". No sorting.
static List&lt;List&lt;String&gt;&gt; groupAnagrams(String[] words) {
    Map&lt;String, List&lt;String&gt;&gt; groups = new HashMap&lt;&gt;();
    for (String w : words) {
        int[] count = new int[26];
        for (char ch : w.toCharArray()) count[ch - 'a']++;
        StringBuilder key = new StringBuilder();
        for (int n : count) key.append(n).append('#');   // '#' separates counts:
        groups.computeIfAbsent(key.toString(), k -&gt; new ArrayList&lt;&gt;()).add(w);
    }                                                    // without it, counts 1,11
    return new ArrayList&lt;&gt;(groups.values());             // and 11,1 would collide
}
// O(n · k)</code></pre>
<table>
<tr><th>Approach</th><th>Time</th><th>When to use</th></tr>
<tr><td>Compare every pair</td><td>O(n² · k)</td><td>Never; mention it only as the naive start</td></tr>
<tr><td>Sorted-letters key</td><td>O(n · k log k)</td><td>Short words; simplest to write and explain</td></tr>
<tr><td>Letter-count key</td><td>O(n · k)</td><td>Long words, or when asked to beat the sort</td></tr>
</table>
<pre><code>// The Java 8 one-liner, worth knowing but explain the loop version first
Map&lt;String, List&lt;String&gt;&gt; groups = Arrays.stream(words)
    .collect(Collectors.groupingBy(w -&gt; {
        char[] c = w.toCharArray(); Arrays.sort(c); return new String(c);
    }));</code></pre>
<p><strong>Related questions with the same trick:</strong> "find all anagrams of a pattern in a text" (a sliding window with the count array), "is this string a permutation of a palindrome" (at most one letter with an odd count), and "minimum characters to change to make two strings anagrams" (half the sum of absolute count differences).</p>`
},
{
  q: "Reverse an integer safely, and check for Armstrong and perfect numbers",
  level: "beginner", hot: true, tags: ["numbers", "overflow", "digits", "must-know"],
  companies: ["Infosys", "TCS", "Wipro", "Cognizant", "Capgemini", "HCL", "Accenture", "Tech Mahindra"],
  a: `<div class="cx"><b>O(d) time</b><span>d = number of digits</span><b>O(1) space</b></div>
<p>All three questions use one loop: <strong>take the last digit with <code>% 10</code>, drop it with <code>/ 10</code></strong>. The part that separates candidates is handling overflow and negative numbers.</p>
<pre><code>// Reverse 1234 -&gt; 4321, -120 -&gt; -21. Return 0 if the result overflows an int.
static int reverse(int x) {
    int result = 0;
    while (x != 0) {
        int digit = x % 10;                 // Java: -123 % 10 == -3, so negatives
        x /= 10;                            // work without special handling
        if (result &gt; Integer.MAX_VALUE / 10 || result &lt; Integer.MIN_VALUE / 10)
            return 0;                       // result * 10 would overflow
        result = result * 10 + digit;
    }
    return result;
}
// reverse(1534236469) would be 9646324351, which does not fit in an int.
// Without the check it silently returns a garbage number (1056389759).</code></pre>
<p><strong>Why check <em>before</em> multiplying?</strong> After an int overflows, the value has already wrapped around, so you cannot detect it afterwards by looking at the result. Checking against <code>MAX_VALUE / 10</code> first is the standard trick. (The last digit can never push it over the edge here, because a reversed 10-digit int always starts with 1 or 2.)</p>
<pre><code>// Armstrong number: equals the sum of its digits, each raised to the power
// of the number of digits.  153 = 1³ + 5³ + 3³ = 1 + 125 + 27
static boolean isArmstrong(int n) {
    if (n &lt; 0) return false;
    int digits = String.valueOf(n).length();
    int sum = 0, rest = n;
    while (rest &gt; 0) {
        int d = rest % 10;
        sum += (int) Math.pow(d, digits);
        rest /= 10;
    }
    return sum == n;
}
// Armstrong numbers up to 10,000: 1-9, 153, 370, 371, 407, 1634, 8208, 9474

// Perfect number: equals the sum of its proper divisors.  28 = 1 + 2 + 4 + 7 + 14
static boolean isPerfect(int n) {
    if (n &lt; 2) return false;
    int sum = 1;                                  // 1 always divides n
    for (int i = 2; (long) i * i &lt;= n; i++) {     // only up to sqrt(n)
        if (n % i == 0) {
            sum += i;
            int pair = n / i;
            if (pair != i) sum += pair;           // add the matching divisor
        }                                         // (once, if n is a square)
    }
    return sum == n;
}
// 6, 28, 496, 8128 are the only perfect numbers below 30 million.</code></pre>
<table>
<tr><th>Question</th><th>Digit loop does</th><th>Watch out for</th></tr>
<tr><td>Reverse integer</td><td><code>result = result * 10 + digit</code></td><td>Overflow; negative input</td></tr>
<tr><td>Palindrome number</td><td>Reverse and compare</td><td>Negatives are not palindromes; reverse only half to avoid overflow</td></tr>
<tr><td>Sum of digits</td><td><code>sum += digit</code></td><td>Negative input</td></tr>
<tr><td>Armstrong</td><td><code>sum += digit^k</code></td><td>k is the digit count, not always 3</td></tr>
<tr><td>Perfect number</td><td>(divisor loop instead)</td><td>Loop to √n, add divisor pairs, do not count n itself</td></tr>
</table>
<p><strong>The one thing to say:</strong> "I check for overflow before the multiply, because once an int has wrapped I can no longer detect it."</p>`
}
]);
