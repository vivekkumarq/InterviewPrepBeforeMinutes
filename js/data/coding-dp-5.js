registerPrimer("coding-dp", `<h3>The mental model: recursion that remembers its answers</h3>
<p>Dynamic programming is not a special algorithm. It is what you get when a recursive solution <strong>asks the same smaller question many times</strong>, and you store each answer the first time so every later ask is instant. If you can write the brute-force recursion, you are three small steps from the DP solution.</p>
<figure class="fig">
<svg viewBox="0 0 620 232" role="img" aria-label="Recursion tree for fib(5) with repeated subproblems highlighted; memoisation computes each once">
  <line class="dg-line" x1="300" y1="30" x2="180" y2="70"/><line class="dg-line" x1="300" y1="30" x2="420" y2="70"/>
  <line class="dg-line" x1="180" y1="86" x2="110" y2="126"/><line class="dg-line" x1="180" y1="86" x2="250" y2="126"/>
  <line class="dg-line" x1="420" y1="86" x2="380" y2="126"/><line class="dg-line" x1="420" y1="86" x2="470" y2="126"/>
  <line class="dg-line" x1="110" y1="142" x2="70" y2="182"/><line class="dg-line" x1="110" y1="142" x2="150" y2="182"/>
  <line class="dg-line" x1="250" y1="142" x2="220" y2="182"/><line class="dg-line" x1="250" y1="142" x2="280" y2="182"/>
  <line class="dg-line" x1="380" y1="142" x2="350" y2="182"/><line class="dg-line" x1="380" y1="142" x2="410" y2="182"/>
  <rect class="dg-fill" x="268" y="16" width="64" height="26" rx="6"/><text class="dg-m" x="300" y="34" text-anchor="middle">f(5)</text>
  <rect class="dg-fill" x="148" y="66" width="64" height="26" rx="6"/><text class="dg-m" x="180" y="84" text-anchor="middle">f(4)</text>
  <rect class="dg-fill2" x="388" y="66" width="64" height="26" rx="6"/><text class="dg-m" x="420" y="84" text-anchor="middle">f(3)</text>
  <rect class="dg-fill2" x="78" y="122" width="64" height="26" rx="6"/><text class="dg-m" x="110" y="140" text-anchor="middle">f(3)</text>
  <rect class="dg-box" x="218" y="122" width="64" height="26" rx="6"/><text class="dg-m" x="250" y="140" text-anchor="middle">f(2)</text>
  <rect class="dg-box" x="348" y="122" width="64" height="26" rx="6"/><text class="dg-m" x="380" y="140" text-anchor="middle">f(2)</text>
  <rect class="dg-box" x="444" y="122" width="52" height="26" rx="6"/><text class="dg-m" x="470" y="140" text-anchor="middle">f(1)</text>
  <rect class="dg-box" x="44" y="178" width="52" height="24" rx="6"/><text class="dg-s" x="70" y="195" text-anchor="middle">f(2)</text>
  <rect class="dg-box" x="124" y="178" width="52" height="24" rx="6"/><text class="dg-s" x="150" y="195" text-anchor="middle">f(1)</text>
  <rect class="dg-box" x="194" y="178" width="52" height="24" rx="6"/><text class="dg-s" x="220" y="195" text-anchor="middle">f(1)</text>
  <rect class="dg-box" x="254" y="178" width="52" height="24" rx="6"/><text class="dg-s" x="280" y="195" text-anchor="middle">f(0)</text>
  <rect class="dg-box" x="324" y="178" width="52" height="24" rx="6"/><text class="dg-s" x="350" y="195" text-anchor="middle">f(1)</text>
  <rect class="dg-box" x="384" y="178" width="52" height="24" rx="6"/><text class="dg-s" x="410" y="195" text-anchor="middle">f(0)</text>
  <text class="dg-s" x="10" y="224">f(3) is computed twice and f(2) three times. At n = 50 that is billions of calls. With a memo, each f(k) is computed once: n calls.</text>
</svg>
<figcaption>Overlapping subproblems (the repeats) plus optimal substructure (answers built from smaller answers) is the signal for DP.</figcaption>
</figure>
<h3>Worked example: from brute force to DP in four steps</h3>
<p><strong>Problem:</strong> houses in a row hold money <code>[2, 7, 9, 3, 1]</code>. You cannot rob two adjacent houses. What is the most you can take? (Answer: 2 + 9 + 1 = 12.)</p>
<pre><code>// STEP 1: recursion. "At house i, either skip it or take it and skip the next."
static int rob(int[] a, int i) {
    if (i &gt;= a.length) return 0;
    return Math.max(rob(a, i + 1),              // skip house i
                    a[i] + rob(a, i + 2));      // take house i
}
// Correct, but O(2^n): rob(a, 3) is recomputed from many different paths.

// STEP 2: memoisation (top-down). Same code, plus a cache.
static int rob(int[] a, int i, Integer[] memo) {
    if (i &gt;= a.length) return 0;
    if (memo[i] != null) return memo[i];
    return memo[i] = Math.max(rob(a, i + 1, memo), a[i] + rob(a, i + 2, memo));
}
// O(n) time, O(n) space.

// STEP 3: tabulation (bottom-up). Fill the answers from the end backwards,
// so every value a cell needs is already computed. No recursion.
static int robTable(int[] a) {
    int n = a.length;
    int[] dp = new int[n + 2];                  // dp[i] = best from house i onward
    for (int i = n - 1; i &gt;= 0; i--)
        dp[i] = Math.max(dp[i + 1], a[i] + dp[i + 2]);
    return dp[0];
}

// STEP 4: space optimisation. dp[i] only reads the next two cells.
static int robO1(int[] a) {
    int next1 = 0, next2 = 0;                   // dp[i+1], dp[i+2]
    for (int i = a.length - 1; i &gt;= 0; i--) {
        int cur = Math.max(next1, a[i] + next2);
        next2 = next1;
        next1 = cur;
    }
    return next1;
}
// O(n) time, O(1) space.</code></pre>
<h3>The questions that design any DP</h3>
<table>
<tr><th>Question</th><th>For house robber</th></tr>
<tr><td><strong>State:</strong> what does one subproblem need to know?</td><td>The index <code>i</code> I am deciding about</td></tr>
<tr><td><strong>Choice:</strong> what can I do at this state?</td><td>Take house i, or skip it</td></tr>
<tr><td><strong>Transition:</strong> how is the answer built from smaller ones?</td><td><code>dp[i] = max(dp[i+1], a[i] + dp[i+2])</code></td></tr>
<tr><td><strong>Base case:</strong> where does it stop?</td><td>Past the last house: 0</td></tr>
<tr><td><strong>Order:</strong> which way to fill the table?</td><td>From the end, because dp[i] needs larger indices</td></tr>
</table>`);

appendTopic("coding-dp", [
{
  q: "Decode ways: how many ways can a digit string be read as letters?",
  level: "advanced", hot: true, tags: ["dp", "strings", "1d-dp", "must-know"],
  companies: ["Meta", "Google", "Amazon", "Microsoft", "Uber", "Goldman Sachs", "Cisco"],
  a: `<div class="cx"><b>O(n) time</b><span>one pass</span><b>O(1) space</b><span>two rolling values</span></div>
<p>Letters are encoded as <code>A=1 … Z=26</code>. Given a string of digits, count how many ways it can be decoded. <code>"226"</code> has 3: <code>2, 2, 6</code> (BBF), <code>22, 6</code> (VF) and <code>2, 26</code> (BZ).</p>
<p><strong>The recursion:</strong> standing at position i, you can read <strong>one digit</strong> (if it is not 0) or <strong>two digits</strong> (if they form 10 to 26). The number of ways from i is the sum of the ways after each valid choice. It is the staircase problem with conditions on each step.</p>
<pre><code>ways(i) = (s[i] != '0'            ? ways(i + 1) : 0)
        + (s[i..i+1] in 10..26     ? ways(i + 2) : 0)
ways(n) = 1                        // reached the end: one complete decoding</code></pre>
<pre><code>static int numDecodings(String s) {
    int n = s.length();
    int next1 = 1;          // ways(i + 1), starting with ways(n) = 1
    int next2 = 0;          // ways(i + 2)
    for (int i = n - 1; i &gt;= 0; i--) {
        int cur = 0;
        if (s.charAt(i) != '0') {
            cur = next1;                                          // one digit
            if (i + 1 &lt; n) {
                int two = (s.charAt(i) - '0') * 10 + (s.charAt(i + 1) - '0');
                if (two &lt;= 26) cur += next2;                      // two digits
            }                                                     // (10..26: the
        }                                                         // first digit is
        next2 = next1;                                            // not 0 here)
        next1 = cur;
    }
    return next1;
}</code></pre>
<pre><code>Trace "226" (filling from the right)

 i   digit   one-digit    two-digit      ways(i)
 3    end                                1
 2    6      ways(3)=1    -              1
 1    2      ways(2)=1    "26": ways(3)  1 + 1 = 2
 0    2      ways(1)=2    "22": ways(2)  2 + 1 = 3</code></pre>
<table>
<tr><th>Input</th><th>Answer</th><th>Why</th></tr>
<tr><td><code>"06"</code></td><td>0</td><td>A leading 0 cannot be read alone, and "06" is not 6</td></tr>
<tr><td><code>"10"</code></td><td>1</td><td>Only "10" (J); the 0 cannot stand alone</td></tr>
<tr><td><code>"100"</code></td><td>0</td><td>"10" then a lone "0": impossible</td></tr>
<tr><td><code>"27"</code></td><td>1</td><td>27 is above 26, so only 2 7</td></tr>
<tr><td><code>"11106"</code></td><td>2</td><td>1, 1, 10, 6 and 11, 10, 6</td></tr>
</table>
<p><strong>The zeros are the whole difficulty.</strong> Say it out loud before coding: "a 0 can never be read on its own, only as the second digit of 10 or 20." Then write the recursion, check it on <code>"10"</code> and <code>"100"</code>, and only then convert it to the two-variable loop.</p>
<p><strong>Follow-up:</strong> "What if <code>*</code> can stand for any digit 1 to 9?" The same recursion, but each choice contributes a multiplier (9 for a lone <code>*</code>, 15 for <code>*</code> followed by <code>*</code> as 11 to 19 and 21 to 26), and the answer is taken modulo 1,000,000,007 because it grows huge.</p>`
},
{
  q: "Wildcard matching with ? and * using a 2D DP table",
  level: "advanced", hot: true, tags: ["dp", "strings", "2d-dp", "hard"],
  companies: ["Google", "Microsoft", "Amazon", "Meta", "Adobe", "Uber", "Bloomberg"],
  a: `<div class="cx"><b>O(m · n) time</b><span>one cell per (text, pattern) prefix pair</span><b>O(n) space</b><span>with two rows</span></div>
<p>Does the whole text match the pattern? <code>?</code> matches exactly one character; <code>*</code> matches any sequence, including an empty one. <code>"adceb"</code> matches <code>"*a*b"</code>; <code>"acdcb"</code> does not match <code>"a*c?b"</code>.</p>
<p><strong>State:</strong> <code>dp[i][j]</code> = does the first <code>i</code> characters of the text match the first <code>j</code> characters of the pattern?</p>
<pre><code>Pattern char p[j-1] is:
  a letter or '?'   dp[i][j] = dp[i-1][j-1] and (p[j-1] == '?' or p[j-1] == s[i-1])
  '*'               dp[i][j] = dp[i][j-1]      '*' matches NOTHING
                            or dp[i-1][j]      '*' swallows s[i-1] and can keep going

Base cases:
  dp[0][0] = true                 empty matches empty
  dp[0][j] = dp[0][j-1] if p[j-1] == '*'    only stars can match an empty text
  dp[i][0] = false for i &gt; 0      an empty pattern matches only empty text</code></pre>
<pre><code>static boolean isMatch(String s, String p) {
    int m = s.length(), n = p.length();
    boolean[][] dp = new boolean[m + 1][n + 1];
    dp[0][0] = true;
    for (int j = 1; j &lt;= n; j++)
        dp[0][j] = p.charAt(j - 1) == '*' &amp;&amp; dp[0][j - 1];

    for (int i = 1; i &lt;= m; i++) {
        for (int j = 1; j &lt;= n; j++) {
            char pc = p.charAt(j - 1);
            if (pc == '*') {
                dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
            } else {
                dp[i][j] = dp[i - 1][j - 1] &amp;&amp; (pc == '?' || pc == s.charAt(i - 1));
            }
        }
    }
    return dp[m][n];
}</code></pre>
<pre><code>s = "ab", p = "*b"             ""     "*"    "*b"
                       ""      T      T      F
                       "a"     F      T      F       '*' swallowed "a"
                       "ab"    F      T      T  &lt;- 'b'=='b' and dp["a"]["*"] was T
Answer: dp[2][2] = true</code></pre>
<table>
<tr><th>Detail</th><th>Why</th></tr>
<tr><td>Table size (m+1) × (n+1)</td><td>Row and column 0 stand for empty prefixes, which makes the base cases natural</td></tr>
<tr><td><code>dp[i-1][j]</code> for <code>*</code></td><td>Consumes one character but keeps the same star available for more</td></tr>
<tr><td>Leading stars in the base row</td><td><code>"***"</code> must match an empty text</td></tr>
<tr><td>Space</td><td>Each row reads only the row above, so two rows (or one, carefully) are enough</td></tr>
</table>
<p><strong>Compare with regex matching</strong> (<code>.</code> and <code>*</code>), the harder cousin: there <code>*</code> means "zero or more of the <em>previous</em> character", so the star transition looks two pattern positions back: <code>dp[i][j-2]</code> (zero copies) or <code>dp[i-1][j]</code> when the previous character matches. Interviewers often ask one after the other to see if you adapt the recurrence rather than memorise it.</p>
<p><strong>A greedy O(m + n) solution exists</strong> for wildcard matching (remember the last star and backtrack to it on a mismatch). Mention it, but the DP is easier to prove correct under interview pressure.</p>`
}
]);
