registerCode("bits", {
intro: `<p>Integers are binary underneath, and the bitwise operators let you work on that representation directly. The operations are single CPU instructions, so bit tricks are genuinely fast — but their real value in interviews is showing you understand what a number <em>is</em>.</p>
<table>
<tr><th>Operator</th><th>Meaning</th><th>Example</th></tr>
<tr><td><code>&amp;</code></td><td>AND — 1 only if both are 1</td><td><code>6 &amp; 3 = 2</code></td></tr>
<tr><td><code>|</code></td><td>OR — 1 if either is 1</td><td><code>6 | 3 = 7</code></td></tr>
<tr><td><code>^</code></td><td>XOR — 1 if they differ</td><td><code>6 ^ 3 = 5</code></td></tr>
<tr><td><code>~</code></td><td>NOT — flip every bit</td><td><code>~5 = -6</code></td></tr>
<tr><td><code>&lt;&lt;</code></td><td>Shift left — multiply by 2</td><td><code>3 &lt;&lt; 2 = 12</code></td></tr>
<tr><td><code>&gt;&gt;</code></td><td>Arithmetic right shift — keeps the sign</td><td><code>-8 &gt;&gt; 1 = -4</code></td></tr>
<tr><td><code>&gt;&gt;&gt;</code></td><td>Logical right shift, Java only — fills with 0</td><td><code>-8 &gt;&gt;&gt; 28 = 15</code></td></tr>
</table>
<p><strong>The XOR properties that solve most puzzles:</strong> <code>x ^ x = 0</code>, <code>x ^ 0 = x</code>, and it is commutative. So XOR-ing a list where everything is paired except one leaves exactly the unpaired value.</p>
<p><strong>The idioms worth memorising:</strong></p>
<pre><code>x &amp; 1            is x odd?
x &gt;&gt; 1           divide by 2
x &amp; (x - 1)      clear the lowest set bit
x &amp; -x           isolate the lowest set bit
x | (1 &lt;&lt; i)     set bit i
x &amp; ~(1 &lt;&lt; i)    clear bit i
x ^ (1 &lt;&lt; i)     flip bit i
(x &gt;&gt; i) &amp; 1     read bit i</code></pre>
<p><strong>Python has no fixed width</strong> — integers grow arbitrarily and negative numbers behave as if infinitely sign-extended. Where Java's 32-bit wraparound matters, mask with <code>&amp; 0xFFFFFFFF</code>.</p>`,
questions: [
{
  slug: "count-set-bits", n: 89, title: "Count the 1 Bits", difficulty: "easy",
  statement: `<p>Count how many bits are set in an integer — its Hamming weight.</p>`,
  approaches: [
    { name: "Check every bit", time: "O(32)", space: "O(1)",
      note: "Shift through all 32 positions. Constant time, but it always does 32 iterations even for the value 1.",
      java: `public static int count(int n) {
    int total = 0;
    for (int i = 0; i < 32; i++)
        if ((n >> i & 1) == 1) total++;
    return total;
}`,
      python: `def count(n: int) -> int:
    total = 0
    for i in range(32):
        if n >> i & 1:
            total += 1
    return total` },
    { name: "Brian Kernighan's trick", time: "O(set bits)", space: "O(1)", best: true,
      note: "n & (n-1) clears the lowest set bit, so the loop runs once per 1 bit rather than once per position. For a number with two bits set it does two iterations, not 32.",
      java: `public static int count(int n) {
    int total = 0;
    while (n != 0) {
        n &= (n - 1);        // clears the lowest set bit
        total++;
    }
    return total;
}`,
      python: `def count(n: int) -> int:
    total = 0
    while n:
        n &= n - 1
        total += 1
    return total` },
    { name: "Built in", time: "O(1)", space: "O(1)",
      note: "Both languages expose it, and on modern CPUs it compiles to a single POPCNT instruction. Say you know it, then write one of the above.",
      java: `public static int count(int n) {
    return Integer.bitCount(n);
}`,
      python: `def count(n: int) -> int:
    return n.bit_count()      # Python 3.10+, or bin(n).count("1")` }
  ],
  note: `<p>Why does <code>n &amp; (n-1)</code> clear the lowest set bit? Subtracting 1 flips that bit to 0 and turns every zero below it into 1. AND-ing keeps only the bits above, which is everything except the one you removed.</p>
<p>In Java use <code>&gt;&gt;&gt;</code> if you loop on a negative number — <code>&gt;&gt;</code> keeps the sign bit and the loop never ends.</p>`
},
{
  slug: "power-of-two", n: 90, title: "Is It a Power of Two?", difficulty: "easy",
  statement: `<p>Decide whether a positive integer is a power of two.</p>`,
  approaches: [
    { name: "Divide repeatedly", time: "O(log n)", space: "O(1)",
      note: "Keep halving while the number is even; a power of two ends at 1.",
      java: `public static boolean isPowerOfTwo(int n) {
    if (n <= 0) return false;
    while (n % 2 == 0) n /= 2;
    return n == 1;
}`,
      python: `def is_power_of_two(n: int) -> bool:
    if n <= 0:
        return False
    while n % 2 == 0:
        n //= 2
    return n == 1` },
    { name: "One bit set", time: "O(1)", space: "O(1)", best: true,
      note: "A power of two has exactly one bit set, so clearing the lowest set bit must leave zero. The n > 0 guard is required: 0 and negatives would otherwise slip through.",
      java: `public static boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}`,
      python: `def is_power_of_two(n: int) -> bool:
    return n > 0 and n & (n - 1) == 0` }
  ],
  note: `<p>Without <code>n &gt; 0</code>: zero passes because <code>0 &amp; -1 == 0</code>, and <code>Integer.MIN_VALUE</code> passes too, since it has a single (sign) bit set. Both are wrong and both are what interviewers test.</p>
<p>Same trick for a power of four: one bit set <em>and</em> it sits in an even position — <code>(n &amp; 0x55555555) != 0</code>.</p>`
},
{
  slug: "single-number", n: 91, title: "Find the Number That Appears Once", difficulty: "easy",
  statement: `<p>Every value appears twice except one. Find it, in O(n) time and O(1) space.</p>`,
  approaches: [
    { name: "Hash set", time: "O(n)", space: "O(n)",
      note: "Add and remove; whatever survives is the answer. Correct, but the problem asks for constant space.",
      java: `public static int single(int[] a) {
    Set<Integer> seen = new HashSet<>();
    for (int x : a)
        if (!seen.add(x)) seen.remove(x);
    return seen.iterator().next();
}`,
      python: `def single(a: list[int]) -> int:
    seen: set[int] = set()
    for x in a:
        if x in seen:
            seen.remove(x)
        else:
            seen.add(x)
    return seen.pop()` },
    { name: "XOR everything", time: "O(n)", space: "O(1)", best: true,
      note: "Pairs cancel because x ^ x = 0, and order does not matter because XOR is commutative. What is left is the unpaired value. One line.",
      java: `public static int single(int[] a) {
    int result = 0;
    for (int x : a) result ^= x;
    return result;
}`,
      python: `from functools import reduce
from operator import xor

def single(a: list[int]) -> int:
    return reduce(xor, a, 0)` }
  ],
  note: `<p><strong>The follow-up:</strong> two numbers appear once. XOR everything to get <code>a ^ b</code>, isolate any differing bit with <code>diff &amp; -diff</code>, then split the array by that bit and XOR each half separately. Each half now contains exactly one unpaired value.</p>
<p>If every value appears <em>three</em> times except one, XOR no longer cancels — count bits at each of the 32 positions modulo 3 instead.</p>`
}
]});
