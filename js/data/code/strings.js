registerCode("strings", {
intro: `<p>A string is a sequence of characters, and in both Java and Python it is <strong>immutable</strong> — every "change" allocates a new one. That single property drives most string interview answers.</p>
<table>
<tr><th>Fact</th><th>Consequence</th></tr>
<tr><td>Immutable</td><td>Safe to share and cache; <code>+</code> in a loop is O(n²)</td></tr>
<tr><td>Use a builder</td><td><code>StringBuilder</code> / <code>"".join(list)</code> makes it O(n)</td></tr>
<tr><td><code>charAt</code> / <code>s[i]</code> is O(1)</td><td>Index freely</td></tr>
<tr><td><code>substring</code> is O(n)</td><td>It copies; avoid it inside loops</td></tr>
<tr><td>Fixed alphabet</td><td><code>int[26]</code> counting is O(1) space, not O(n)</td></tr>
</table>
<p><strong>Ask two questions before coding any string problem:</strong> is it case sensitive, and is the alphabet just a–z or full Unicode? Both change the data structure you reach for.</p>`,
questions: [
{
  slug: "valid-anagram", n: 32, title: "Valid Anagram", difficulty: "easy",
  statement: `<p>Decide whether two strings are anagrams — same characters, same counts, different order.</p>`,
  approaches: [
    { name: "Sort both", time: "O(n log n)", space: "O(n)",
      note: "Anagrams sort to the same string. One line, and perfectly acceptable if you say the cost.",
      java: `public static boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;
    char[] x = a.toCharArray(), y = b.toCharArray();
    Arrays.sort(x); Arrays.sort(y);
    return Arrays.equals(x, y);
}`,
      python: `def is_anagram(a: str, b: str) -> bool:
    return sorted(a) == sorted(b)` },
    { name: "Count characters", time: "O(n)", space: "O(1)", best: true,
      note: "One pass over both strings at once: increment for a, decrement for b. If every counter lands on zero they match. The int[26] is O(1) — bounded by the alphabet, not the input.",
      java: `public static boolean isAnagram(String a, String b) {
    if (a.length() != b.length()) return false;    // cheap early exit
    int[] count = new int[26];
    for (int i = 0; i < a.length(); i++) {
        count[a.charAt(i) - 'a']++;
        count[b.charAt(i) - 'a']--;
    }
    for (int c : count) if (c != 0) return false;
    return true;
}`,
      python: `from collections import Counter

def is_anagram(a: str, b: str) -> bool:
    return len(a) == len(b) and Counter(a) == Counter(b)` }
  ],
  note: `<p>For Unicode, swap the <code>int[26]</code> for a hash map — an emoji or an accented character would index far outside a 26-slot array and throw.</p>`
},
{
  slug: "first-non-repeating", n: 33, title: "First Non-Repeating Character", difficulty: "easy",
  statement: `<p>Return the first character that appears exactly once. <code>"swiss"</code> gives <code>w</code>.</p>`,
  approaches: [
    { name: "Count, then rescan", time: "O(n)", space: "O(1)", best: true,
      note: "First pass counts, second pass walks the ORIGINAL order and returns the first count of one. Two passes, but both linear.",
      java: `public static char firstUnique(String s) {
    int[] count = new int[26];
    for (char c : s.toCharArray()) count[c - 'a']++;
    for (char c : s.toCharArray()) if (count[c - 'a'] == 1) return c;
    return '_';
}`,
      python: `from collections import Counter

def first_unique(s: str) -> str:
    count = Counter(s)
    for ch in s:
        if count[ch] == 1:
            return ch
    return "_"` },
    { name: "Insertion-ordered map", time: "O(n)", space: "O(n)",
      note: "A LinkedHashMap keeps insertion order, so one scan of the map finds the answer. Handy when the alphabet is unbounded.",
      java: `public static char firstUnique(String s) {
    Map<Character, Integer> count = new LinkedHashMap<>();
    for (char c : s.toCharArray()) count.merge(c, 1, Integer::sum);
    for (Map.Entry<Character, Integer> e : count.entrySet())
        if (e.getValue() == 1) return e.getKey();
    return '_';
}`,
      python: `def first_unique(s: str) -> str:
    count: dict[str, int] = {}
    for ch in s:
        count[ch] = count.get(ch, 0) + 1
    for ch, c in count.items():      # dicts keep insertion order
        if c == 1:
            return ch
    return "_"` }
  ],
  note: `<p>The second pass must walk the <strong>string</strong>, not the counter array — the array is in alphabet order, which is not the order asked for.</p>`
},
{
  slug: "longest-common-prefix", n: 34, title: "Longest Common Prefix", difficulty: "easy",
  statement: `<p>Find the longest prefix shared by every string in an array. Return an empty string if there is none.</p>`,
  approaches: [
    { name: "Compare column by column", time: "O(n·m)", space: "O(1)", best: true,
      note: "Walk the first string one character at a time and check that position in every other string. Stop at the first mismatch or the first string that ends.",
      java: `public static String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    for (int i = 0; i < strs[0].length(); i++) {
        char c = strs[0].charAt(i);
        for (String s : strs)
            if (i == s.length() || s.charAt(i) != c)
                return strs[0].substring(0, i);
    }
    return strs[0];
}`,
      python: `def longest_common_prefix(strs: list[str]) -> str:
    if not strs:
        return ""
    for i, c in enumerate(strs[0]):
        for s in strs:
            if i == len(s) or s[i] != c:
                return strs[0][:i]
    return strs[0]` },
    { name: "Sort and compare the ends", time: "O(n·m log n)", space: "O(n)",
      note: "After sorting, only the first and last strings matter — everything between shares at least their common prefix. Neat, slower, and worth mentioning.",
      java: `public static String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    Arrays.sort(strs);
    String first = strs[0], last = strs[strs.length - 1];
    int i = 0;
    while (i < first.length() && i < last.length() && first.charAt(i) == last.charAt(i)) i++;
    return first.substring(0, i);
}`,
      python: `def longest_common_prefix(strs: list[str]) -> str:
    if not strs:
        return ""
    strs = sorted(strs)
    first, last = strs[0], strs[-1]
    i = 0
    while i < len(first) and i < len(last) and first[i] == last[i]:
        i += 1
    return first[:i]` }
  ],
  note: `<p>The <code>i == s.length()</code> check comes first for a reason: without it, a string shorter than the prefix throws an index error rather than ending the loop.</p>`
},
{
  slug: "reverse-words", n: 35, title: "Reverse the Words in a Sentence", difficulty: "medium",
  statement: `<p><code>"the sky  is blue"</code> becomes <code>"blue is sky the"</code>. Collapse extra spaces and trim the ends.</p>`,
  approaches: [
    { name: "Split, reverse, join", time: "O(n)", space: "O(n)", best: true,
      note: "Splitting on runs of whitespace handles the multiple-space case for free. This is the right answer unless in-place is demanded.",
      java: `public static String reverseWords(String s) {
    String[] parts = s.trim().split("\\\\s+");   // one or more whitespace
    Collections.reverse(Arrays.asList(parts));
    return String.join(" ", parts);
}`,
      python: `def reverse_words(s: str) -> str:
    return " ".join(reversed(s.split()))   # split() collapses runs` },
    { name: "Reverse all, then each word", time: "O(n)", space: "O(1)*", best: false,
      note: "Reverse the whole array of characters, then reverse each word back. *O(1) on a mutable char array, which is what the in-place follow-up gives you.",
      java: `public static void reverseWords(char[] a) {
    reverse(a, 0, a.length - 1);
    int start = 0;
    for (int i = 0; i <= a.length; i++) {
        if (i == a.length || a[i] == ' ') {
            reverse(a, start, i - 1);
            start = i + 1;
        }
    }
}

private static void reverse(char[] a, int i, int j) {
    while (i < j) { char t = a[i]; a[i++] = a[j]; a[j--] = t; }
}`,
      python: `def reverse_words_in_place(a: list[str]) -> None:
    def rev(i: int, j: int) -> None:
        while i < j:
            a[i], a[j] = a[j], a[i]
            i += 1
            j -= 1

    rev(0, len(a) - 1)
    start = 0
    for i in range(len(a) + 1):
        if i == len(a) or a[i] == " ":
            rev(start, i - 1)
            start = i + 1` }
  ],
  note: `<p>Ask whether multiple spaces must be preserved. Java's <code>split(" ")</code> keeps empty strings; <code>split("\\\\s+")</code> and Python's bare <code>split()</code> collapse them. That one detail is the whole test.</p>`
},
{
  slug: "roman-to-int", n: 36, title: "Roman Numeral to Number", difficulty: "easy",
  statement: `<p>Convert a Roman numeral to an integer. <code>"MCMXCIV"</code> is 1994.</p>`,
  approaches: [
    { name: "Compare each with its neighbour", time: "O(n)", space: "O(1)", best: true,
      note: "Add each value, but SUBTRACT it when it is smaller than the one after it — that is exactly what IV and IX mean. No special-case table needed.",
      java: `public static int romanToInt(String s) {
    Map<Character, Integer> v = Map.of('I',1,'V',5,'X',10,'L',50,
                                       'C',100,'D',500,'M',1000);
    int total = 0;
    for (int i = 0; i < s.length(); i++) {
        int cur = v.get(s.charAt(i));
        boolean smallerThanNext = i + 1 < s.length() && cur < v.get(s.charAt(i + 1));
        total += smallerThanNext ? -cur : cur;
    }
    return total;
}`,
      python: `def roman_to_int(s: str) -> int:
    v = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    for i, ch in enumerate(s):
        cur = v[ch]
        if i + 1 < len(s) and cur < v[s[i + 1]]:
            total -= cur
        else:
            total += cur
    return total` }
  ],
  note: `<p>The subtractive rule generalises: there are only six valid pairs (IV, IX, XL, XC, CD, CM) and all six are covered by "smaller before larger". Hard-coding the six is more code and no more correct.</p>`
},
{
  slug: "string-compression", n: 37, title: "String Compression", difficulty: "medium",
  statement: `<p>Compress runs of repeated characters: <code>"aabcccccaaa"</code> becomes <code>"a2b1c5a3"</code>. Return the original if the compressed form is not shorter.</p>`,
  approaches: [
    { name: "Build with a builder", time: "O(n)", space: "O(n)", best: true,
      note: "Count each run and append. Using a builder rather than += is what keeps it linear.",
      java: `public static String compress(String s) {
    if (s.isEmpty()) return s;
    StringBuilder sb = new StringBuilder();
    int run = 1;
    for (int i = 1; i <= s.length(); i++) {
        if (i < s.length() && s.charAt(i) == s.charAt(i - 1)) {
            run++;
        } else {
            sb.append(s.charAt(i - 1)).append(run);
            run = 1;
        }
    }
    return sb.length() < s.length() ? sb.toString() : s;
}`,
      python: `def compress(s: str) -> str:
    if not s:
        return s
    parts: list[str] = []
    run = 1
    for i in range(1, len(s) + 1):
        if i < len(s) and s[i] == s[i - 1]:
            run += 1
        else:
            parts.append(s[i - 1] + str(run))
            run = 1
    out = "".join(parts)
    return out if len(out) < len(s) else s` }
  ],
  note: `<p>Looping to <code>i &lt;= length</code> with the bounds check inside flushes the final run without duplicating the append after the loop. Forgetting that last flush is the usual bug.</p>`
},
{
  slug: "longest-substring-no-repeat", n: 38, title: "Longest Substring Without Repeating Characters", difficulty: "medium",
  statement: `<p>Find the length of the longest substring with no repeated characters. <code>"abcabcbb"</code> gives 3.</p>`,
  approaches: [
    { name: "Check every substring", time: "O(n³)", space: "O(n)",
      note: "Generate each substring and test it for duplicates. The baseline, and far too slow.",
      java: `// For every (i, j) build the substring and check it with a Set.
// O(n^2) substrings, each O(n) to verify. Mention it, then improve.`,
      python: `# For every (i, j) build the substring and check it with a set.
# O(n^2) substrings, each O(n) to verify. Mention it, then improve.` },
    { name: "Sliding window with a set", time: "O(n)", space: "O(min(n,m))",
      note: "Grow on the right; while the new character is already inside, shrink from the left. Each pointer moves at most n times.",
      java: `public static int longest(String s) {
    Set<Character> window = new HashSet<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        while (window.contains(s.charAt(right)))
            window.remove(s.charAt(left++));
        window.add(s.charAt(right));
        best = Math.max(best, right - left + 1);
    }
    return best;
}`,
      python: `def longest(s: str) -> int:
    window: set[str] = set()
    left = best = 0
    for right, ch in enumerate(s):
        while ch in window:
            window.remove(s[left])
            left += 1
        window.add(ch)
        best = max(best, right - left + 1)
    return best` },
    { name: "Sliding window, jump the left pointer", time: "O(n)", space: "O(min(n,m))", best: true,
      note: "Remember each character's last index and jump left straight past it, instead of shrinking one step at a time. The max() stops the pointer ever moving backwards.",
      java: `public static int longest(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (last.containsKey(c))
            left = Math.max(left, last.get(c) + 1);   // never move backwards
        last.put(c, right);
        best = Math.max(best, right - left + 1);
    }
    return best;
}`,
      python: `def longest(s: str) -> int:
    last: dict[str, int] = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last:
            left = max(left, last[ch] + 1)
        last[ch] = right
        best = max(best, right - left + 1)
    return best` }
  ],
  note: `<p>The <code>Math.max</code> on the left pointer is essential. For <code>"abba"</code>, the stale index of <code>a</code> would otherwise drag the window backwards and inflate the answer.</p>`
},
{
  slug: "group-anagrams", n: 39, title: "Group Anagrams", difficulty: "medium",
  statement: `<p>Group words that are anagrams of one another.</p>`,
  approaches: [
    { name: "Sorted word as the key", time: "O(n·k log k)", space: "O(n·k)", best: true,
      note: "All anagrams share the same sorted form, so it makes a perfect grouping key. k is the word length.",
      java: `public static List<List<String>> group(String[] words) {
    Map<String, List<String>> buckets = new HashMap<>();
    for (String w : words) {
        char[] c = w.toCharArray();
        Arrays.sort(c);
        buckets.computeIfAbsent(new String(c), k -> new ArrayList<>()).add(w);
    }
    return new ArrayList<>(buckets.values());
}`,
      python: `from collections import defaultdict

def group(words: list[str]) -> list[list[str]]:
    buckets = defaultdict(list)
    for w in words:
        buckets["".join(sorted(w))].append(w)
    return list(buckets.values())` },
    { name: "Character counts as the key", time: "O(n·k)", space: "O(n·k)",
      note: "Skips the per-word sort by using a 26-slot count signature instead. Faster when words are long; more code.",
      java: `public static List<List<String>> group(String[] words) {
    Map<String, List<String>> buckets = new HashMap<>();
    for (String w : words) {
        int[] count = new int[26];
        for (char c : w.toCharArray()) count[c - 'a']++;
        String key = Arrays.toString(count);
        buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
    }
    return new ArrayList<>(buckets.values());
}`,
      python: `from collections import defaultdict

def group(words: list[str]) -> list[list[str]]:
    buckets = defaultdict(list)
    for w in words:
        count = [0] * 26
        for ch in w:
            count[ord(ch) - ord("a")] += 1
        buckets[tuple(count)].append(w)
    return list(buckets.values())` }
  ],
  note: `<p>Python needs a <code>tuple</code> rather than a list for the key — lists are mutable and therefore unhashable. The same rule bites in Java if you try to key on an <code>int[]</code>, which hashes by identity, not contents.</p>`
},
{
  slug: "longest-palindromic-substring", n: 40, title: "Longest Palindromic Substring", difficulty: "medium",
  statement: `<p>Find the longest substring that reads the same both ways.</p>`,
  approaches: [
    { name: "Check every substring", time: "O(n³)", space: "O(1)",
      note: "Every start and end, each verified in O(n).",
      java: `// Two nested loops over (i, j), each substring verified with two pointers.
// O(n^3). The baseline to state and then beat.`,
      python: `# Two nested loops over (i, j), each substring verified with two pointers.
# O(n^3). The baseline to state and then beat.` },
    { name: "Expand around every centre", time: "O(n²)", space: "O(1)", best: true,
      note: "There are 2n−1 centres: each character, and each gap between two. Grow outwards while the ends match. Forgetting the even-length centres is the classic bug.",
      java: `public static String longestPalindrome(String s) {
    int start = 0, len = 0;
    for (int i = 0; i < s.length(); i++) {
        int odd  = expand(s, i, i);
        int even = expand(s, i, i + 1);       // the centre BETWEEN characters
        int best = Math.max(odd, even);
        if (best > len) { len = best; start = i - (best - 1) / 2; }
    }
    return s.substring(start, start + len);
}

private static int expand(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    return r - l - 1;                          // both overshot by one
}`,
      python: `def longest_palindrome(s: str) -> str:
    def expand(l: int, r: int) -> int:
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        return r - l - 1

    start = length = 0
    for i in range(len(s)):
        best = max(expand(i, i), expand(i, i + 1))
        if best > length:
            length = best
            start = i - (best - 1) // 2
    return s[start:start + length]` }
  ],
  note: `<p>Manacher's algorithm does this in <strong>O(n)</strong> by reusing mirror information. Nobody expects it under pressure — but naming it shows you know the O(n²) is not the theoretical limit.</p>`
},
{
  slug: "minimum-window-substring", n: 41, title: "Minimum Window Substring", difficulty: "hard",
  statement: `<p>Find the shortest substring of s containing every character of t, including duplicates.</p>`,
  approaches: [
    { name: "Sliding window with a need count", time: "O(n+m)", space: "O(m)", best: true,
      note: "Grow right until the window is valid, then shrink from the left while it STAYS valid, recording the best. The have/need counter avoids rechecking the whole map each step.",
      java: `public static String minWindow(String s, String t) {
    if (t.isEmpty() || s.length() < t.length()) return "";
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

    int required = need.size(), formed = 0, left = 0;
    int bestLen = Integer.MAX_VALUE, bestStart = 0;
    Map<Character, Integer> window = new HashMap<>();

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window.merge(c, 1, Integer::sum);
        if (need.containsKey(c) && window.get(c).intValue() == need.get(c).intValue())
            formed++;

        while (formed == required) {                 // shrink WHILE valid
            if (right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestStart = left;
            }
            char out = s.charAt(left++);
            window.merge(out, -1, Integer::sum);
            if (need.containsKey(out) && window.get(out) < need.get(out))
                formed--;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
}`,
      python: `from collections import Counter

def min_window(s: str, t: str) -> str:
    if not t or len(s) < len(t):
        return ""
    need = Counter(t)
    window: Counter = Counter()
    required, formed, left = len(need), 0, 0
    best_len, best_start = float("inf"), 0

    for right, ch in enumerate(s):
        window[ch] += 1
        if ch in need and window[ch] == need[ch]:
            formed += 1
        while formed == required:
            if right - left + 1 < best_len:
                best_len, best_start = right - left + 1, left
            out = s[left]
            left += 1
            window[out] -= 1
            if out in need and window[out] < need[out]:
                formed -= 1
    return "" if best_len == float("inf") else s[best_start:best_start + best_len]` }
  ],
  note: `<p>Note the direction: most window problems shrink <em>while invalid</em> to stay legal. This one shrinks <em>while valid</em>, because it is minimising. Getting that backwards is the usual failure.</p>
<p>In Java, compare the boxed counts with <code>.intValue()</code> or <code>.equals()</code> — <code>==</code> on two <code>Integer</code> objects compares references and breaks silently above 127.</p>`
},
{
  slug: "kmp-pattern-search", n: 42, title: "Find a Pattern in Text (KMP)", difficulty: "hard",
  statement: `<p>Find every position where a pattern occurs in a text, in linear time.</p>`,
  approaches: [
    { name: "Naive sliding comparison", time: "O(n·m)", space: "O(1)",
      note: "Try the pattern at every offset. Fine in practice for short patterns; degenerate on inputs like aaaa…aaab.",
      java: `public static List<Integer> search(String text, String pat) {
    List<Integer> hits = new ArrayList<>();
    for (int i = 0; i + pat.length() <= text.length(); i++) {
        int j = 0;
        while (j < pat.length() && text.charAt(i + j) == pat.charAt(j)) j++;
        if (j == pat.length()) hits.add(i);
    }
    return hits;
}`,
      python: `def search(text: str, pat: str) -> list[int]:
    hits = []
    for i in range(len(text) - len(pat) + 1):
        if text[i:i + len(pat)] == pat:
            hits.append(i)
    return hits` },
    { name: "KMP with a failure table", time: "O(n+m)", space: "O(m)", best: true,
      note: "Precompute, for each prefix, the longest proper prefix that is also a suffix. On a mismatch, jump the pattern forward by that amount instead of restarting — the text pointer never moves backwards.",
      java: `private static int[] failure(String p) {
    int[] f = new int[p.length()];
    int len = 0;
    for (int i = 1; i < p.length(); ) {
        if (p.charAt(i) == p.charAt(len)) f[i++] = ++len;
        else if (len > 0) len = f[len - 1];        // fall back, do NOT i++
        else f[i++] = 0;
    }
    return f;
}

public static List<Integer> search(String text, String pat) {
    List<Integer> hits = new ArrayList<>();
    if (pat.isEmpty()) return hits;
    int[] f = failure(pat);
    for (int i = 0, j = 0; i < text.length(); ) {
        if (text.charAt(i) == pat.charAt(j)) {
            i++; j++;
            if (j == pat.length()) { hits.add(i - j); j = f[j - 1]; }
        } else if (j > 0) {
            j = f[j - 1];                          // i stays put
        } else {
            i++;
        }
    }
    return hits;
}`,
      python: `def failure(p: str) -> list[int]:
    f = [0] * len(p)
    length = 0
    i = 1
    while i < len(p):
        if p[i] == p[length]:
            length += 1
            f[i] = length
            i += 1
        elif length:
            length = f[length - 1]
        else:
            f[i] = 0
            i += 1
    return f

def search(text: str, pat: str) -> list[int]:
    if not pat:
        return []
    f = failure(pat)
    hits, j = [], 0
    for i, ch in enumerate(text):
        while j and ch != pat[j]:
            j = f[j - 1]
        if ch == pat[j]:
            j += 1
            if j == len(pat):
                hits.append(i - j + 1)
                j = f[j - 1]
    return hits` }
  ],
  note: `<p>The Z-function solves the same problem and is easier to derive under pressure: run it on <code>pattern + "#" + text</code> and every position where z equals the pattern length is a match.</p>`
}
]});
