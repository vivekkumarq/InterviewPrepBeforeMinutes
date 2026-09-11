appendTopic("coding-basics", [
{
  q: "Count vowels, words and characters in a string",
  level: "beginner", hot: true, tags: ["strings", "basics", "interview-favourite"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Capgemini", "Accenture", "Zoho", "HCL"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(1) space</b><span>fixed-size counters</span></div>
<pre><code>// VOWELS — a set beats a chain of ||
public static int vowels(String s) {
    int count = 0;
    for (char c : s.toLowerCase().toCharArray()) {
        if ("aeiou".indexOf(c) &gt;= 0) count++;
    }
    return count;
}

// WORDS — the naive split has two bugs
s.split(" ").length;              // ✗ "  a  b  " counts empty strings
s.trim().split("\\\\s+").length;     // ✔ handles tabs, newlines, runs of spaces
// ...and one more: "".trim().split("\\\\s+") gives [""], length 1. Guard it:
public static int words(String s) {
    if (s == null || s.isBlank()) return 0;
    return s.trim().split("\\\\s+").length;
}

// CHARACTER FREQUENCY
Map&lt;Character, Integer&gt; freq = new LinkedHashMap&lt;&gt;();   // keeps first-seen order
for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);

// For ASCII only, an array is far faster and allocation-free
int[] counts = new int[128];
for (char c : s.toCharArray()) counts[c]++;</code></pre>
<table>
<tr><th>Edge case</th><th>Expected</th></tr>
<tr><td><code>null</code></td><td>Ask. Usually 0 or an exception — decide and say so.</td></tr>
<tr><td><code>""</code> and <code>"   "</code></td><td>0 words</td></tr>
<tr><td>Leading/trailing/multiple spaces</td><td>Must not create empty words</td></tr>
<tr><td>Tabs and newlines</td><td><code>\\s+</code>, not a literal space</td></tr>
<tr><td>Mixed case</td><td>Normalise before counting</td></tr>
<tr><td>Emoji or accents</td><td><code>charAt</code> is a UTF-16 <em>code unit</em>, not a character</td></tr>
</table>
<pre><code>// The Unicode point worth raising — it separates a careful answer from a rote one
String s = "😀";
s.length();                     // 2  — one emoji, two char values (a surrogate pair)
s.codePointCount(0, s.length()); // 1  — the real character count
s.codePoints().count();          // 1

// So "reverse a string" with charAt breaks emoji, and a per-char loop
// double-counts them. Mention it; you rarely have to handle it.</code></pre>
<p><strong>What the interviewer is checking:</strong> not whether you can count vowels, but whether you handle empty input, normalise case, and use <code>\\s+</code> rather than a single space. Saying "let me check the empty and whitespace-only cases" before you are asked is the whole signal.</p>`
},
{
  q: "Print the common star and number patterns",
  level: "beginner", tags: ["patterns", "loops", "basics"],
  companies: ["TCS", "Infosys", "Wipro", "Cognizant", "Capgemini", "Accenture", "HCL", "Tech Mahindra"],
  a: `<pre><code>// RIGHT TRIANGLE            // PYRAMID
// *                         //     *
// **                        //    ***
// ***                       //   *****
for (int i = 1; i &lt;= n; i++) {
    System.out.println("*".repeat(i));          // triangle
}
for (int i = 1; i &lt;= n; i++) {                  // pyramid
    System.out.println(" ".repeat(n - i) + "*".repeat(2 * i - 1));
}
// The whole trick: spaces = n - i, stars = 2i - 1. Work those two formulas
// out on paper for i = 1, 2, 3 and every pattern falls out.</code></pre>
<pre><code>// PASCAL'S TRIANGLE — each value is the one above plus the one above-left
//     1
//    1 1
//   1 2 1
//  1 3 3 1
for (int i = 0; i &lt; n; i++) {
    long val = 1;
    System.out.print(" ".repeat(n - i));
    for (int j = 0; j &lt;= i; j++) {
        System.out.print(val + " ");
        val = val * (i - j) / (j + 1);     // next binomial coefficient, no array
    }
    System.out.println();
}

// FLOYD'S TRIANGLE          // NUMBER PYRAMID
// 1                         //     1
// 2 3                       //    1 2 1
// 4 5 6                     //   1 2 3 2 1
int k = 1;
for (int i = 1; i &lt;= n; i++) {
    for (int j = 1; j &lt;= i; j++) System.out.print(k++ + " ");
    System.out.println();
}</code></pre>
<table>
<tr><th>Pattern</th><th>Spaces</th><th>Symbols</th></tr>
<tr><td>Right triangle</td><td>0</td><td><code>i</code></td></tr>
<tr><td>Inverted triangle</td><td>0</td><td><code>n - i + 1</code></td></tr>
<tr><td>Pyramid</td><td><code>n - i</code></td><td><code>2i - 1</code></td></tr>
<tr><td>Inverted pyramid</td><td><code>i - 1</code></td><td><code>2(n - i) + 1</code></td></tr>
<tr><td>Diamond</td><td colspan="2">A pyramid, then an inverted pyramid of <code>n - 1</code> rows</td></tr>
<tr><td>Hollow square</td><td colspan="2">Print only when <code>i == 1 || i == n || j == 1 || j == n</code></td></tr>
</table>
<pre><code>// Use a StringBuilder when n is large — one print per row beats
// thousands of System.out.print calls, each of which is synchronised.
StringBuilder sb = new StringBuilder();
for (int i = 1; i &lt;= n; i++) sb.append("*".repeat(i)).append('\\n');
System.out.print(sb);</code></pre>
<p><strong>Why these are still asked:</strong> they are not testing algorithms — they are testing whether you can translate a shape into two nested loops and derive the index arithmetic without trial and error. Say the formula out loud before writing the loop, and the whole question takes thirty seconds.</p>`
}
]);
