registerCode("recursion", {
intro: `<p>Recursion solves a problem by solving a smaller version of itself. Every correct recursive function has exactly two parts:</p>
<table>
<tr><td><strong>Base case</strong></td><td>The smallest input, answered directly. Without it you recurse forever.</td></tr>
<tr><td><strong>Recursive case</strong></td><td>Reduce the problem and call yourself. It must move <em>towards</em> the base case.</td></tr>
</table>
<p><strong>Backtracking</strong> is recursion that undoes its choices. The template never changes — only the choices, the constraint and the goal:</p>
<pre><code>choose  ->  explore  ->  UN-choose</code></pre>
<p>Two bugs account for nearly every failure:</p>
<table>
<tr><td>Adding the path itself to the results instead of a <strong>copy</strong>. Every result then points at the same list, which is empty at the end.</td></tr>
<tr><td>Forgetting to undo. State leaks into sibling branches, and the answer is silently wrong with no exception anywhere.</td></tr>
</table>
<p><strong>Space is the recursion depth</strong>, not the number of calls. Naive Fibonacci makes 2ⁿ calls but only ever holds n frames, because only one path is live at a time.</p>`,
questions: [
{
  slug: "tower-of-hanoi", n: 81, title: "Tower of Hanoi", difficulty: "medium",
  statement: `<p>Move n discs from one peg to another using a spare, never placing a larger disc on a smaller one.</p>`,
  approaches: [
    { name: "Recursive, three lines", time: "O(2ⁿ)", space: "O(n)", best: true,
      note: "Move n−1 discs out of the way, move the big one, move the n−1 back. The problem is defined recursively, so the solution is too — and it is provably optimal.",
      java: `public static void hanoi(int n, char from, char to, char spare) {
    if (n == 0) return;
    hanoi(n - 1, from, spare, to);                       // clear the way
    System.out.println("Move disc " + n + " " + from + " -> " + to);
    hanoi(n - 1, spare, to, from);                       // bring them back
}`,
      python: `def hanoi(n: int, frm: str, to: str, spare: str) -> None:
    if n == 0:
        return
    hanoi(n - 1, frm, spare, to)
    print(f"Move disc {n} {frm} -> {to}")
    hanoi(n - 1, spare, to, frm)` }
  ],
  note: `<p>The move count is exactly 2ⁿ − 1, from T(n) = 2T(n−1) + 1. That is not inefficiency to optimise away — it is the proven minimum. With 64 discs at one move a second it would take longer than the age of the universe.</p>`
},
{
  slug: "all-subsets", n: 82, title: "All Subsets", difficulty: "medium",
  statement: `<p>Generate every subset of a set of distinct numbers — the power set.</p>`,
  approaches: [
    { name: "Include or exclude, recursively", time: "O(2ⁿ·n)", space: "O(n)", best: true,
      note: "Each element is either in or out, giving 2ⁿ subsets. The copy when recording is essential — without it every result aliases the same list.",
      java: `public static List<List<Integer>> subsets(int[] a) {
    List<List<Integer>> out = new ArrayList<>();
    backtrack(a, 0, new ArrayList<>(), out);
    return out;
}

private static void backtrack(int[] a, int start,
                              List<Integer> path, List<List<Integer>> out) {
    out.add(new ArrayList<>(path));            // COPY, every node is a subset
    for (int i = start; i < a.length; i++) {
        path.add(a[i]);                        // choose
        backtrack(a, i + 1, path, out);        // explore
        path.remove(path.size() - 1);          // UN-choose
    }
}`,
      python: `def subsets(a: list[int]) -> list[list[int]]:
    out: list[list[int]] = []

    def backtrack(start: int, path: list[int]) -> None:
        out.append(path[:])                    # COPY
        for i in range(start, len(a)):
            path.append(a[i])
            backtrack(i + 1, path)
            path.pop()

    backtrack(0, [])
    return out` },
    { name: "Bitmask enumeration", time: "O(2ⁿ·n)", space: "O(1)*",
      note: "Every integer from 0 to 2ⁿ−1 IS a subset: bit i set means element i is included. No recursion at all. *Excluding the output.",
      java: `public static List<List<Integer>> subsets(int[] a) {
    List<List<Integer>> out = new ArrayList<>();
    for (int mask = 0; mask < (1 << a.length); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < a.length; i++)
            if ((mask >> i & 1) == 1) subset.add(a[i]);
        out.add(subset);
    }
    return out;
}`,
      python: `def subsets(a: list[int]) -> list[list[int]]:
    out = []
    for mask in range(1 << len(a)):
        out.append([a[i] for i in range(len(a)) if mask >> i & 1])
    return out` }
  ],
  note: `<p>With <strong>duplicates</strong> in the input, sort first and skip repeats at the same level with <code>if (i &gt; start &amp;&amp; a[i] == a[i-1]) continue;</code>. Note <code>i &gt; start</code>, not <code>i &gt; 0</code> — the distinction is "same level" versus "same branch".</p>`
},
{
  slug: "all-permutations", n: 83, title: "All Permutations", difficulty: "medium",
  statement: `<p>Generate every ordering of a list of distinct numbers.</p>`,
  approaches: [
    { name: "Used array", time: "O(n!·n)", space: "O(n)", best: true,
      note: "At each depth try every element not yet used. Clear, and extends naturally to the duplicate-handling variant.",
      java: `public static List<List<Integer>> permute(int[] a) {
    List<List<Integer>> out = new ArrayList<>();
    backtrack(a, new boolean[a.length], new ArrayList<>(), out);
    return out;
}

private static void backtrack(int[] a, boolean[] used,
                              List<Integer> path, List<List<Integer>> out) {
    if (path.size() == a.length) { out.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < a.length; i++) {
        if (used[i]) continue;
        used[i] = true;  path.add(a[i]);
        backtrack(a, used, path, out);
        used[i] = false; path.remove(path.size() - 1);
    }
}`,
      python: `def permute(a: list[int]) -> list[list[int]]:
    out: list[list[int]] = []
    used = [False] * len(a)

    def backtrack(path: list[int]) -> None:
        if len(path) == len(a):
            out.append(path[:])
            return
        for i, x in enumerate(a):
            if used[i]:
                continue
            used[i] = True
            path.append(x)
            backtrack(path)
            path.pop()
            used[i] = False

    backtrack([])
    return out` },
    { name: "Swap in place", time: "O(n!·n)", space: "O(n)",
      note: "Swap each candidate into the current position and recurse. No used array, but the output order differs and it does not handle duplicates as cleanly.",
      java: `public static List<List<Integer>> permute(int[] a) {
    List<List<Integer>> out = new ArrayList<>();
    swapPermute(a, 0, out);
    return out;
}

private static void swapPermute(int[] a, int k, List<List<Integer>> out) {
    if (k == a.length) {
        List<Integer> copy = new ArrayList<>();
        for (int x : a) copy.add(x);
        out.add(copy);
        return;
    }
    for (int i = k; i < a.length; i++) {
        swap(a, k, i);
        swapPermute(a, k + 1, out);
        swap(a, k, i);                 // undo
    }
}

private static void swap(int[] a, int i, int j) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}`,
      python: `def permute(a: list[int]) -> list[list[int]]:
    out: list[list[int]] = []

    def helper(k: int) -> None:
        if k == len(a):
            out.append(a[:])
            return
        for i in range(k, len(a)):
            a[k], a[i] = a[i], a[k]
            helper(k + 1)
            a[k], a[i] = a[i], a[k]     # undo

    helper(0)
    return out` }
  ],
  note: `<p>n! grows brutally: 10! is 3.6 million, 13! passes a billion, 20! exceeds a long. If n is above roughly 10, generating all permutations is not the intended solution — look for a bitmask DP instead.</p>`
},
{
  slug: "combination-sum", n: 84, title: "Combination Sum", difficulty: "medium",
  statement: `<p>Find every combination of candidates summing to a target. Each candidate may be reused any number of times.</p>`,
  approaches: [
    { name: "Backtracking with reuse", time: "O(n^(t/min))", space: "O(t/min)", best: true,
      note: "Recursing with i rather than i+1 is what permits reuse. Sorting lets you break instead of continue once the remainder goes negative.",
      java: `public static List<List<Integer>> combinationSum(int[] candidates, int target) {
    Arrays.sort(candidates);                       // enables the early break
    List<List<Integer>> out = new ArrayList<>();
    backtrack(candidates, 0, target, new ArrayList<>(), out);
    return out;
}

private static void backtrack(int[] c, int start, int remain,
                              List<Integer> path, List<List<Integer>> out) {
    if (remain == 0) { out.add(new ArrayList<>(path)); return; }
    for (int i = start; i < c.length; i++) {
        if (c[i] > remain) break;                  // sorted: the rest are bigger
        path.add(c[i]);
        backtrack(c, i, remain - c[i], path, out); // i, NOT i+1 -> reuse
        path.remove(path.size() - 1);
    }
}`,
      python: `def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    candidates = sorted(candidates)
    out: list[list[int]] = []

    def backtrack(start: int, remain: int, path: list[int]) -> None:
        if remain == 0:
            out.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remain:
                break
            path.append(candidates[i])
            backtrack(i, remain - candidates[i], path)   # i, not i+1
            path.pop()

    backtrack(0, target, [])
    return out` }
  ],
  note: `<p>Two variants, one character apart. <strong>Combination Sum II</strong> — each candidate used once — passes <code>i + 1</code> and skips duplicates at the same level. The reuse rule lives entirely in that argument.</p>`
},
{
  slug: "generate-parentheses", n: 85, title: "Generate Valid Parentheses", difficulty: "medium",
  statement: `<p>Generate all well-formed strings of n pairs of parentheses.</p>`,
  approaches: [
    { name: "Generate all, then filter", time: "O(2^(2n)·n)", space: "O(n)",
      note: "Build every string of 2n brackets and keep the valid ones. Enormously wasteful — most are invalid.",
      java: `// Build all 2^(2n) strings, validate each with a counter. Correct, far too slow.`,
      python: `# Build all 2^(2n) strings, validate each with a counter. Correct, far too slow.` },
    { name: "Backtrack with two counters", time: "O(4ⁿ/√n)", space: "O(n)", best: true,
      note: "Only ever generate valid prefixes: add an opener while any remain, add a closer only while it would not outnumber the openers. Nothing invalid is ever built.",
      java: `public static List<String> generate(int n) {
    List<String> out = new ArrayList<>();
    build(new StringBuilder(), 0, 0, n, out);
    return out;
}

private static void build(StringBuilder sb, int open, int close,
                          int n, List<String> out) {
    if (sb.length() == 2 * n) { out.add(sb.toString()); return; }
    if (open < n) {                       // room for another opener
        sb.append('(');
        build(sb, open + 1, close, n, out);
        sb.deleteCharAt(sb.length() - 1);
    }
    if (close < open) {                   // never close more than is open
        sb.append(')');
        build(sb, open, close + 1, n, out);
        sb.deleteCharAt(sb.length() - 1);
    }
}`,
      python: `def generate(n: int) -> list[str]:
    out: list[str] = []

    def build(path: list[str], open_count: int, close_count: int) -> None:
        if len(path) == 2 * n:
            out.append("".join(path))
            return
        if open_count < n:
            path.append("(")
            build(path, open_count + 1, close_count)
            path.pop()
        if close_count < open_count:
            path.append(")")
            build(path, open_count, close_count + 1)
            path.pop()

    build([], 0, 0)
    return out` }
  ],
  note: `<p>The count is the n-th Catalan number. The lesson generalises: <strong>prune while generating</strong> rather than filtering afterwards — it is the difference between exploring 4ⁿ states and 2^(2n).</p>`
},
{
  slug: "word-search-grid", n: 86, title: "Word Search in a Grid", difficulty: "medium",
  statement: `<p>Decide whether a word can be spelled by walking adjacent cells, using each cell at most once per path.</p>`,
  approaches: [
    { name: "DFS with backtracking", time: "O(m·n·4^L)", space: "O(L)", best: true,
      note: "Mark the cell, recurse into the four neighbours, then UNMARK. That unmark is the difference between this and flood fill — and forgetting it is silently wrong, not a crash.",
      java: `public static boolean exist(char[][] board, String word) {
    for (int r = 0; r < board.length; r++)
        for (int c = 0; c < board[0].length; c++)
            if (dfs(board, r, c, word, 0)) return true;
    return false;
}

private static boolean dfs(char[][] b, int r, int c, String w, int i) {
    if (i == w.length()) return true;
    if (r < 0 || r >= b.length || c < 0 || c >= b[0].length) return false;
    if (b[r][c] != w.charAt(i)) return false;

    char saved = b[r][c];
    b[r][c] = '#';                                  // mark as in use
    boolean found = dfs(b, r + 1, c, w, i + 1) || dfs(b, r - 1, c, w, i + 1)
                 || dfs(b, r, c + 1, w, i + 1) || dfs(b, r, c - 1, w, i + 1);
    b[r][c] = saved;                                // UNMARK on the way out
    return found;
}`,
      python: `def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])

    def dfs(r: int, c: int, i: int) -> bool:
        if i == len(word):
            return True
        if not (0 <= r < rows and 0 <= c < cols):
            return False
        if board[r][c] != word[i]:
            return False

        saved, board[r][c] = board[r][c], "#"
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1)
                 or dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        board[r][c] = saved              # UNMARK
        return found

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))` }
  ],
  note: `<p>Flood fill marks and never unmarks — "which cells are reachable". Backtracking marks, recurses, unmarks — "does <em>some</em> path spell this". One line apart, completely different meanings.</p>
<p>For <strong>Word Search II</strong> with many words, put them in a trie and prune the moment no child matches. That turns an impossible problem into a fast one.</p>`
},
{
  slug: "n-queens", n: 87, title: "N-Queens", difficulty: "hard",
  statement: `<p>Place n queens on an n×n board so that none attack another.</p>`,
  approaches: [
    { name: "Scan the board to validate", time: "O(n!·n)", space: "O(n²)",
      note: "Place a queen, then scan the column and both diagonals to check. Correct, but the validity check is O(n) every time.",
      java: `// For each candidate square, walk up the column and both diagonals
// looking for a queen. O(n) per check.`,
      python: `# For each candidate square, walk up the column and both diagonals
# looking for a queen. O(n) per check.` },
    { name: "Three sets for O(1) validity", time: "O(n!)", space: "O(n)", best: true,
      note: "Along a diagonal row − col is constant; along an anti-diagonal row + col is constant. That identity turns the O(n) scan into three hash lookups.",
      java: `public static int solve(int n) {
    return place(0, n, new HashSet<>(), new HashSet<>(), new HashSet<>());
}

private static int place(int row, int n, Set<Integer> cols,
                         Set<Integer> diag, Set<Integer> anti) {
    if (row == n) return 1;                       // a full valid board
    int count = 0;
    for (int col = 0; col < n; col++) {
        if (cols.contains(col) || diag.contains(row - col)
                               || anti.contains(row + col)) continue;
        cols.add(col); diag.add(row - col); anti.add(row + col);
        count += place(row + 1, n, cols, diag, anti);
        cols.remove(col); diag.remove(row - col); anti.remove(row + col);
    }
    return count;
}`,
      python: `def solve(n: int) -> int:
    cols: set[int] = set()
    diag: set[int] = set()
    anti: set[int] = set()

    def place(row: int) -> int:
        if row == n:
            return 1
        count = 0
        for col in range(n):
            if col in cols or row - col in diag or row + col in anti:
                continue
            cols.add(col); diag.add(row - col); anti.add(row + col)
            count += place(row + 1)
            cols.remove(col); diag.remove(row - col); anti.remove(row + col)
        return count

    return place(0)` }
  ],
  note: `<p>Placing one queen per row is itself a pruning decision — it removes the entire possibility of two queens sharing a row, so that check never needs writing.</p>`
},
{
  slug: "sudoku-solver", n: 88, title: "Sudoku Solver", difficulty: "hard",
  statement: `<p>Fill a partially completed 9×9 Sudoku so every row, column and 3×3 box holds 1–9 exactly once.</p>`,
  approaches: [
    { name: "Backtracking with constraint sets", time: "exponential", space: "O(1)", best: true,
      note: "Try each digit in the first empty cell and recurse. Maintaining row, column and box sets makes each validity test O(1) instead of a 27-cell scan.",
      java: `public static boolean solve(char[][] board) {
    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++) {
            if (board[r][c] != '.') continue;
            for (char d = '1'; d <= '9'; d++) {
                if (!isValid(board, r, c, d)) continue;
                board[r][c] = d;                     // choose
                if (solve(board)) return true;       // explore
                board[r][c] = '.';                   // UN-choose
            }
            return false;                 // no digit fits: this branch is dead
        }
    return true;                          // no empty cell left: solved
}

private static boolean isValid(char[][] b, int row, int col, char d) {
    int boxRow = row / 3 * 3, boxCol = col / 3 * 3;
    for (int i = 0; i < 9; i++) {
        if (b[row][i] == d || b[i][col] == d) return false;
        if (b[boxRow + i / 3][boxCol + i % 3] == d) return false;
    }
    return true;
}`,
      python: `def solve(board: list[list[str]]) -> bool:
    def is_valid(row: int, col: int, d: str) -> bool:
        box_r, box_c = row // 3 * 3, col // 3 * 3
        for i in range(9):
            if board[row][i] == d or board[i][col] == d:
                return False
            if board[box_r + i // 3][box_c + i % 3] == d:
                return False
        return True

    for r in range(9):
        for c in range(9):
            if board[r][c] != ".":
                continue
            for d in "123456789":
                if not is_valid(r, c, d):
                    continue
                board[r][c] = d
                if solve(board):
                    return True
                board[r][c] = "."
            return False           # nothing fits here
    return True                    # no blanks left` }
  ],
  note: `<p>The single biggest speed-up is ordering: always fill the <strong>most constrained</strong> cell — the empty one with the fewest legal digits — rather than the first blank. Same algorithm, often orders of magnitude faster, and it is the follow-up worth raising yourself.</p>`
}
]});
