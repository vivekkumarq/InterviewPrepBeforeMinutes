registerCode("basics-bigo", {
intro: `<p>Start here. These are the warm-up problems almost every first round opens with — and the point is not that they are hard, it is that each one has a <strong>slow obvious way</strong> and a <strong>fast deliberate way</strong>. Knowing why the second is better is the whole interview.</p>
<p>Before the problems, the one table worth memorising:</p>
<table>
<tr><th>Class</th><th>Doubling n does what?</th><th>Typical source</th></tr>
<tr><td>O(1)</td><td>Nothing</td><td>Array index, hash lookup</td></tr>
<tr><td>O(log n)</td><td>Adds one step</td><td>Binary search, halving</td></tr>
<tr><td>O(n)</td><td>Doubles</td><td>One pass</td></tr>
<tr><td>O(n log n)</td><td>Slightly more than doubles</td><td>Sorting</td></tr>
<tr><td>O(n²)</td><td><strong>Quadruples</strong></td><td>Every pair</td></tr>
<tr><td>O(2ⁿ)</td><td><strong>Squares</strong></td><td>Naive recursion over subsets</td></tr>
</table>
<p><strong>Say the complexity out loud before you write code.</strong> Interviewers grade the reasoning, not the typing — and stating "this is O(n²), I think we can do O(n)" earns more than silently writing the fast version.</p>`,
questions: [
{
  slug: "reverse-a-string", n: 1, title: "Reverse a String", difficulty: "easy",
  statement: `<p>Given a string, return it reversed. <code>"interview"</code> becomes <code>"weivretni"</code>.</p>
<p>The interviewer almost always means <em>without</em> the built-in one-liner — they want to see the two-pointer swap.</p>`,
  approaches: [
    { name: "Built-in reverse", time: "O(n)", space: "O(n)",
      note: "Fine in production, and worth saying you know it exists. But if the question is asked at all, this is usually not the answer being looked for.",
      java: `public static String reverse(String s) {
    return new StringBuilder(s).reverse().toString();
}`,
      python: `def reverse(s: str) -> str:
    return s[::-1]` },
    { name: "Build a new string by appending", time: "O(n²)", space: "O(n)",
      note: "The trap. Strings are immutable in both languages, so every += copies the whole accumulated string. Ten characters looks instant; a million characters hangs.",
      java: `public static String reverseSlow(String s) {
    String out = "";
    for (int i = s.length() - 1; i >= 0; i--)
        out += s.charAt(i);          // copies the WHOLE string each time
    return out;
}`,
      python: `def reverse_slow(s: str) -> str:
    out = ""
    for ch in reversed(s):
        out += ch                    # same trap: a new string every loop
    return out` },
    { name: "Two pointers, in place", time: "O(n)", space: "O(1)*", best: true,
      note: "The expected answer. Walk one pointer from each end and swap, stopping when they meet. *O(1) extra beyond the character array itself, which you need because strings are immutable.",
      java: `public static String reverse(String s) {
    char[] c = s.toCharArray();
    int i = 0, j = c.length - 1;
    while (i < j) {                  // i < j, NOT i < length:
        char t = c[i];               // otherwise you swap everything twice
        c[i++] = c[j];               // and get the original back
        c[j--] = t;
    }
    return new String(c);
}`,
      python: `def reverse(s: str) -> str:
    c = list(s)
    i, j = 0, len(c) - 1
    while i < j:
        c[i], c[j] = c[j], c[i]
        i += 1
        j -= 1
    return "".join(c)` }
  ],
  note: `<p><strong>Follow-up they like:</strong> reverse the <em>words</em> instead of the characters. Split, reverse the list, join — but ask first whether multiple spaces must be preserved, because that single question changes the whole implementation.</p>`
},
{
  slug: "palindrome-check", n: 2, title: "Palindrome Check", difficulty: "easy",
  statement: `<p>Decide whether a string reads the same forwards and backwards. <code>"level"</code> yes, <code>"interview"</code> no.</p>
<p><strong>Ask before coding:</strong> ignore case? ignore punctuation and spaces? Those three words change the answer, and asking is a point in your favour.</p>`,
  approaches: [
    { name: "Reverse and compare", time: "O(n)", space: "O(n)",
      note: "Correct and instantly readable. Its only cost is building a whole second string just to throw it away.",
      java: `public static boolean isPalindrome(String s) {
    String lower = s.toLowerCase();
    String reversed = new StringBuilder(lower).reverse().toString();
    return lower.equals(reversed);
}`,
      python: `def is_palindrome(s: str) -> bool:
    low = s.lower()
    return low == low[::-1]` },
    { name: "Two pointers", time: "O(n)", space: "O(1)", best: true,
      note: "Compare the ends and walk inwards. Allocates nothing, and returns false on the FIRST mismatch instead of doing all the work first.",
      java: `public static boolean isPalindrome(String s) {
    for (int i = 0, j = s.length() - 1; i < j; i++, j--)
        if (s.charAt(i) != s.charAt(j)) return false;
    return true;                     // empty and single-char are true
}`,
      python: `def is_palindrome(s: str) -> bool:
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]:
            return False
        i += 1
        j -= 1
    return True` },
    { name: "Two pointers, skipping non-letters", time: "O(n)", space: "O(1)",
      note: "The real-world version, and the usual follow-up. Handles \"A man, a plan, a canal: Panama\" without building a cleaned copy first.",
      java: `public static boolean isPalindrome(String s) {
    int i = 0, j = s.length() - 1;
    while (i < j) {
        while (i < j && !Character.isLetterOrDigit(s.charAt(i))) i++;
        while (i < j && !Character.isLetterOrDigit(s.charAt(j))) j--;
        if (Character.toLowerCase(s.charAt(i)) !=
            Character.toLowerCase(s.charAt(j))) return false;
        i++; j--;
    }
    return true;
}`,
      python: `def is_palindrome(s: str) -> bool:
    i, j = 0, len(s) - 1
    while i < j:
        while i < j and not s[i].isalnum():
            i += 1
        while i < j and not s[j].isalnum():
            j -= 1
        if s[i].lower() != s[j].lower():
            return False
        i += 1
        j -= 1
    return True` }
  ],
  note: `<p>The inner <code>while</code> loops keep the <code>i &lt; j</code> guard. Drop it and a string of pure punctuation walks a pointer straight off the end.</p>`
},
{
  slug: "fizzbuzz", n: 3, title: "FizzBuzz", difficulty: "easy",
  statement: `<p>Print 1 to n. Multiples of 3 become <code>Fizz</code>, multiples of 5 become <code>Buzz</code>, multiples of both become <code>FizzBuzz</code>.</p>
<p>It is a filter question. The only way to fail is to check 3 and 5 before checking 15.</p>`,
  approaches: [
    { name: "Check 15 first", time: "O(n)", space: "O(1)",
      note: "The order is the entire problem. Test the most specific condition first, or 15 prints Fizz and never reaches the FizzBuzz branch.",
      java: `public static void fizzBuzz(int n) {
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0)      System.out.println("FizzBuzz");
        else if (i % 3 == 0)  System.out.println("Fizz");
        else if (i % 5 == 0)  System.out.println("Buzz");
        else                  System.out.println(i);
    }
}`,
      python: `def fizz_buzz(n: int) -> None:
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)` },
    { name: "Build the word, no 15 case", time: "O(n)", space: "O(1)", best: true,
      note: "Append instead of branching. There is no 15 case because 15 simply matches both tests. This is the version that extends cleanly when they add a seventh rule.",
      java: `public static void fizzBuzz(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder sb = new StringBuilder();
        if (i % 3 == 0) sb.append("Fizz");
        if (i % 5 == 0) sb.append("Buzz");
        System.out.println(sb.length() > 0 ? sb.toString() : String.valueOf(i));
    }
}`,
      python: `def fizz_buzz(n: int) -> None:
    for i in range(1, n + 1):
        out = ""
        if i % 3 == 0:
            out += "Fizz"
        if i % 5 == 0:
            out += "Buzz"
        print(out or i)` }
  ],
  note: `<p><strong>The follow-up is the real test:</strong> "now add 7 becomes Bazz". With the first approach you need every combination — 21, 35, 105. With the second you add two lines. Mention that trade-off unprompted.</p>`
},
{
  slug: "factorial", n: 4, title: "Factorial", difficulty: "easy",
  statement: `<p>Compute n! = n × (n−1) × … × 1, with 0! = 1.</p>
<p>The interesting part is not the loop — it is knowing how fast this overflows.</p>`,
  approaches: [
    { name: "Iterative", time: "O(n)", space: "O(1)", best: true,
      note: "No stack growth, no overhead. The default choice.",
      java: `public static long factorial(int n) {
    if (n < 0) throw new IllegalArgumentException("n must be >= 0");
    long result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}`,
      python: `def factorial(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result` },
    { name: "Recursive", time: "O(n)", space: "O(n)",
      note: "Reads like the definition, but each call holds a stack frame. Python also caps recursion at about 1000 frames by default.",
      java: `public static long factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}`,
      python: `def factorial(n: int) -> int:
    return 1 if n <= 1 else n * factorial(n - 1)` },
    { name: "Arbitrary precision", time: "O(n)", space: "O(n)",
      note: "Java overflows a long at 21! and an int at 13!, silently wrapping to a wrong number. BigInteger is the honest answer past that. Python integers grow automatically, so it is already correct.",
      java: `public static BigInteger factorial(int n) {
    BigInteger result = BigInteger.ONE;
    for (int i = 2; i <= n; i++)
        result = result.multiply(BigInteger.valueOf(i));
    return result;
}`,
      python: `import math

def factorial(n: int) -> int:
    return math.factorial(n)   # exact at any size` }
  ],
  note: `<p><strong>Say the ceiling unprompted:</strong> "an int overflows at 13!, a long at 21!, so beyond that I would return BigInteger." That one sentence is the difference between answering the question and understanding it.</p>`
},
{
  slug: "fibonacci-number", n: 5, title: "Fibonacci Number", difficulty: "easy",
  statement: `<p>Return the n-th Fibonacci number, where F(0)=0, F(1)=1 and each later term is the sum of the previous two.</p>
<p>This is the standard bridge into dynamic programming — the naive version is exponential for a reason worth explaining.</p>`,
  approaches: [
    { name: "Naive recursion", time: "O(2ⁿ)", space: "O(n)",
      note: "Recomputes the same subproblems over and over: fib(30) evaluates fib(10) hundreds of times. fib(50) takes minutes. Show it, then explain why it is wrong.",
      java: `public static long fib(int n) {
    return n < 2 ? n : fib(n - 1) + fib(n - 2);
}`,
      python: `def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)` },
    { name: "Memoised recursion", time: "O(n)", space: "O(n)",
      note: "Same shape, but each value is computed once and cached. This is top-down dynamic programming, and naming it that way scores well.",
      java: `public static long fib(int n, Map<Integer, Long> memo) {
    if (n < 2) return n;
    Long hit = memo.get(n);
    if (hit != null) return hit;
    long value = fib(n - 1, memo) + fib(n - 2, memo);
    memo.put(n, value);
    return value;
}`,
      python: `from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)` },
    { name: "Iterative, two variables", time: "O(n)", space: "O(1)", best: true,
      note: "Only the last two values are ever needed, so the whole table collapses to two variables. This is the answer to give.",
      java: `public static long fib(int n) {
    long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        long next = a + b;
        a = b;
        b = next;
    }
    return a;
}`,
      python: `def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a` }
  ],
  note: `<p>There is also an O(log n) form using matrix exponentiation. Worth naming — "there's a log-n matrix-power version if n is huge" — but nobody expects you to write it under time pressure.</p>`
},
{
  slug: "is-prime", n: 6, title: "Is It a Prime Number?", difficulty: "easy",
  statement: `<p>Decide whether n is prime: greater than 1 and divisible only by 1 and itself.</p>`,
  approaches: [
    { name: "Trial division to n", time: "O(n)", space: "O(1)",
      note: "Works, and does far more effort than necessary.",
      java: `public static boolean isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i < n; i++)
        if (n % i == 0) return false;
    return true;
}`,
      python: `def is_prime(n: int) -> bool:
    if n < 2:
        return False
    return all(n % i for i in range(2, n))` },
    { name: "Stop at the square root", time: "O(√n)", space: "O(1)", best: true,
      note: "Any factor above the square root pairs with one below it, so if none exists below, none exists at all. Skipping even numbers halves the work again.",
      java: `public static boolean isPrime(int n) {
    if (n < 2) return false;
    if (n % 2 == 0) return n == 2;
    for (int i = 3; (long) i * i <= n; i += 2)   // cast BEFORE multiplying:
        if (n % i == 0) return false;            // i*i overflows near 46341
    return true;
}`,
      python: `def is_prime(n: int) -> bool:
    if n < 2:
        return False
    if n % 2 == 0:
        return n == 2
    i = 3
    while i * i <= n:
        if n % i == 0:
            return False
        i += 2
    return True` }
  ],
  note: `<p>The <code>(long)</code> cast in the Java loop is a real bug fix, not decoration: <code>i * i</code> overflows a signed int just past 46,340, and the loop then runs forever or exits early. Python has no such limit.</p>`
},
{
  slug: "primes-up-to-n", n: 7, title: "All Primes up to N", difficulty: "medium",
  statement: `<p>List every prime from 2 to n.</p>
<p>The deciding question: are you testing <em>one</em> number or <em>many</em>? That alone picks the algorithm.</p>`,
  approaches: [
    { name: "Test each number", time: "O(n√n)", space: "O(1)",
      note: "Reuses the single-number check n times. Fine for small n, wasteful at scale because it rediscovers the same factors repeatedly.",
      java: `public static List<Integer> primes(int n) {
    List<Integer> out = new ArrayList<>();
    for (int i = 2; i <= n; i++)
        if (isPrime(i)) out.add(i);
    return out;
}`,
      python: `def primes(n: int) -> list[int]:
    return [i for i in range(2, n + 1) if is_prime(i)]` },
    { name: "Sieve of Eratosthenes", time: "O(n log log n)", space: "O(n)", best: true,
      note: "Instead of testing numbers, cross out multiples. Start striking at i*i, because every smaller multiple was already struck by a smaller prime.",
      java: `public static List<Integer> primes(int n) {
    boolean[] composite = new boolean[n + 1];
    List<Integer> out = new ArrayList<>();
    for (int i = 2; i <= n; i++) {
        if (composite[i]) continue;
        out.add(i);
        for (long j = (long) i * i; j <= n; j += i)
            composite[(int) j] = true;
    }
    return out;
}`,
      python: `def primes(n: int) -> list[int]:
    composite = [False] * (n + 1)
    out = []
    for i in range(2, n + 1):
        if composite[i]:
            continue
        out.append(i)
        for j in range(i * i, n + 1, i):
            composite[j] = True
    return out` }
  ],
  note: `<p><strong>The trade-off to state:</strong> the sieve buys speed with O(n) memory. For n = 10⁹ that array does not fit, and you would need a segmented sieve — worth naming even if you do not write it.</p>`
},
{
  slug: "gcd", n: 8, title: "Greatest Common Divisor (GCD)", difficulty: "easy",
  statement: `<p>Find the largest number that divides both a and b. LCM follows from it directly.</p>`,
  approaches: [
    { name: "Count down from the smaller", time: "O(min(a,b))", space: "O(1)",
      note: "The brute force. Correct, and unnecessary once you know Euclid.",
      java: `public static int gcd(int a, int b) {
    for (int i = Math.min(a, b); i >= 1; i--)
        if (a % i == 0 && b % i == 0) return i;
    return 1;
}`,
      python: `def gcd(a: int, b: int) -> int:
    for i in range(min(a, b), 0, -1):
        if a % i == 0 and b % i == 0:
            return i
    return 1` },
    { name: "Euclid's algorithm", time: "O(log min(a,b))", space: "O(1)", best: true,
      note: "gcd(a,b) = gcd(b, a mod b). Each step shrinks the numbers fast, so even huge inputs finish in a handful of iterations.",
      java: `public static int gcd(int a, int b) {
    while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}

public static long lcm(int a, int b) {
    return (long) a / gcd(a, b) * b;   // divide FIRST, or a*b overflows
}`,
      python: `def gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a

def lcm(a: int, b: int) -> int:
    return a // gcd(a, b) * b` }
  ],
  note: `<p>In the LCM, dividing before multiplying is not stylistic — <code>a * b</code> can overflow even when the correct answer fits comfortably.</p>`
},
{
  slug: "power", n: 9, title: "Power (x to the n)", difficulty: "medium",
  statement: `<p>Compute x raised to n, where n may be negative.</p>`,
  approaches: [
    { name: "Multiply n times", time: "O(n)", space: "O(1)",
      note: "Obvious and linear. For n in the billions it is hopeless.",
      java: `public static double power(double x, int n) {
    double result = 1;
    for (int i = 0; i < Math.abs((long) n); i++) result *= x;
    return n < 0 ? 1 / result : result;
}`,
      python: `def power(x: float, n: int) -> float:
    result = 1.0
    for _ in range(abs(n)):
        result *= x
    return 1 / result if n < 0 else result` },
    { name: "Fast exponentiation by squaring", time: "O(log n)", space: "O(1)", best: true,
      note: "x^10 = (x^5)², so halving the exponent each step needs only about 30 multiplications for n near two billion instead of two billion.",
      java: `public static double power(double x, int n) {
    long e = n;                       // widen BEFORE negating:
    if (e < 0) { x = 1 / x; e = -e; } // -Integer.MIN_VALUE overflows an int
    double result = 1;
    while (e > 0) {
        if ((e & 1) == 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}`,
      python: `def power(x: float, n: int) -> float:
    e = n
    if e < 0:
        x, e = 1 / x, -e
    result = 1.0
    while e:
        if e & 1:
            result *= x
        x *= x
        e >>= 1
    return result` }
  ],
  note: `<p><strong>The edge case interviewers plant:</strong> n = <code>Integer.MIN_VALUE</code>. Negating it inside an int overflows back to itself, and the loop never terminates. Widening to <code>long</code> first is the fix.</p>`
},
{
  slug: "reverse-digits", n: 10, title: "Reverse the Digits of a Number", difficulty: "medium",
  statement: `<p>Turn 12345 into 54321. Return 0 if the reversed value would overflow a 32-bit signed integer.</p>`,
  approaches: [
    { name: "Via a string", time: "O(d)", space: "O(d)",
      note: "Readable, and usually accepted — but converting to text and back is doing extra work to avoid arithmetic you already know.",
      java: `public static int reverse(int n) {
    String digits = new StringBuilder(String.valueOf(Math.abs((long) n)))
                        .reverse().toString();
    long value = Long.parseLong(digits);
    if (value > Integer.MAX_VALUE) return 0;
    return (int) (n < 0 ? -value : value);
}`,
      python: `def reverse(n: int) -> int:
    sign = -1 if n < 0 else 1
    value = sign * int(str(abs(n))[::-1])
    return 0 if value < -2**31 or value > 2**31 - 1 else value` },
    { name: "Arithmetic, with an overflow guard", time: "O(d)", space: "O(1)", best: true,
      note: "Peel the last digit with %10, drop it with /10. The guard checks BEFORE multiplying — once it has overflowed, the value is already wrong and cannot be tested.",
      java: `public static int reverse(int n) {
    int result = 0;
    while (n != 0) {
        int digit = n % 10;
        if (result > (Integer.MAX_VALUE - digit) / 10) return 0;   // too big
        if (result < (Integer.MIN_VALUE - digit) / 10) return 0;   // too small
        result = result * 10 + digit;
        n /= 10;
    }
    return result;
}`,
      python: `def reverse(n: int) -> int:
    sign = -1 if n < 0 else 1
    n, result = abs(n), 0
    while n:
        result = result * 10 + n % 10
        n //= 10
    result *= sign
    return 0 if result < -2**31 or result > 2**31 - 1 else result` }
  ],
  note: `<p>Java's <code>%</code> keeps the sign of the left operand, so this handles negatives without a special case. Python's <code>%</code> does not — which is exactly why the Python version strips the sign first and reapplies it. That difference catches people who translate the code literally between the two languages.</p>`
}
]});
