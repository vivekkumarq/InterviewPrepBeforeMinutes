appendTopic("java-8", [
{
  q: "What are Stream gatherers, and what problem do they solve?",
  level: "advanced", tags: ["streams", "modern-java", "java22"],
  companies: ["Amazon", "SAP", "Oracle", "Optum", "EPAM", "Goldman Sachs"],
  a: `<p>Until recently the Stream API had a fixed set of intermediate operations. You could write a custom <em>terminal</em> operation with a <code>Collector</code>, but not a custom <em>intermediate</em> one — so windowing, running totals and stateful de-duplication all meant dropping out of the pipeline.</p>
<pre><code>// Gatherers (final in Java 24) fill that gap.
// Built-ins cover the common cases:
Stream.of(1,2,3,4,5)
      .gather(Gatherers.windowFixed(2))       // [[1,2],[3,4],[5]]
      .toList();

Stream.of(1,2,3,4)
      .gather(Gatherers.windowSliding(2))     // [[1,2],[2,3],[3,4]]
      .toList();

Stream.of(1,2,3,4)
      .gather(Gatherers.scan(() -&gt; 0, Integer::sum))   // running total
      .toList();                                        // [1,3,6,10]

Stream.of("a","b","c")
      .gather(Gatherers.fold(() -&gt; "", String::concat))
      .findFirst();</code></pre>
<pre><code>// A custom gatherer: keep only the first element of each run of duplicates
static &lt;T&gt; Gatherer&lt;T, ?, T&gt; distinctConsecutive() {
    return Gatherer.ofSequential(
        () -&gt; new Object() { T last = null; boolean seen = false; },
        (state, element, downstream) -&gt; {
            if (!state.seen || !Objects.equals(state.last, element)) {
                state.seen = true;
                state.last = element;
                return downstream.push(element);   // false = downstream is done
            }
            return true;
        });
}
// Before gatherers this needed a for-loop, or an abuse of filter() with
// shared mutable state — which breaks the moment the stream goes parallel.</code></pre>
<table>
<tr><th></th><th><code>Collector</code></th><th><code>Gatherer</code></th></tr>
<tr><td>Position</td><td>Terminal — ends the pipeline</td><td><strong>Intermediate</strong> — the stream continues</td></tr>
<tr><td>Emits</td><td>One result</td><td>Zero, one or many elements per input</td></tr>
<tr><td>Can short-circuit</td><td>No</td><td><strong>Yes</strong> — <code>push</code> returning false stops upstream</td></tr>
<tr><td>Keeps state</td><td>Yes, in the accumulator</td><td>Yes, and it is explicit and sequential-safe</td></tr>
</table>
<p><strong>The honest framing:</strong> "Most application code will use the four built-ins — fixed and sliding windows especially, for batching a stream into database round trips. Writing a custom gatherer is a library-author job. The thing worth knowing for an interview is <em>why</em> it exists: it is the missing half of the extension story that <code>Collector</code> started."</p>`
},
{
  q: "How do you avoid the common Stream API performance mistakes?",
  level: "advanced", hot: true, tags: ["streams", "performance", "gotcha"],
  companies: ["Amazon", "Oracle", "SAP", "Flipkart", "Optum", "Goldman Sachs", "Walmart"],
  a: `<pre><code>// 1. BOXING in a numeric pipeline
list.stream().map(Order::total).reduce(0, Integer::sum);      // boxes constantly
list.stream().mapToInt(Order::total).sum();                    // ✔ IntStream

// 2. sorted() before filter() — you sorted rows you were about to discard
list.stream().sorted(cmp).filter(pred).toList();               // ✗
list.stream().filter(pred).sorted(cmp).toList();               // ✔ cheapest first

// 3. An O(n) lookup inside a stream = O(n²)
ids.stream().map(id -&gt; allUsers.stream()
        .filter(u -&gt; u.id() == id).findFirst().orElseThrow())  // ✗ quadratic
   .toList();
Map&lt;Long, User&gt; index = allUsers.stream().collect(toMap(User::id, u -&gt; u));
ids.stream().map(index::get).toList();                         // ✔ linear

// 4. Rebuilding a collection to check membership
if (list.contains(x))                          // O(n) each time in a loop
Set&lt;String&gt; set = Set.copyOf(list);            // ✔ build once, O(1) lookups</code></pre>
<table>
<tr><th>Mistake</th><th>Cost</th></tr>
<tr><td>Streaming a tiny collection in a hot loop</td><td>Pipeline setup dominates — a plain <code>for</code> is faster under ~10 elements</td></tr>
<tr><td><code>peek()</code> for side effects</td><td>May be <strong>skipped entirely</strong> — the JDK is free to elide it when the count is known</td></tr>
<tr><td><code>parallelStream()</code> on IO</td><td>Blocks the shared common ForkJoinPool for the whole JVM</td></tr>
<tr><td><code>collect(toList())</code> then a single <code>get(0)</code></td><td>Use <code>findFirst()</code> and short-circuit</td></tr>
<tr><td>Reusing a stream</td><td><code>IllegalStateException</code> — a stream is single-use</td></tr>
<tr><td><code>flatMap</code> creating a stream per element</td><td>Real allocation cost on large inputs; consider <code>mapMulti</code></td></tr>
</table>
<pre><code>// The short-circuiting that makes laziness pay
List&lt;String&gt; first3 = hugeList.stream()
    .filter(this::expensiveCheck)     // runs only until 3 pass
    .limit(3)
    .toList();

// findAny() lets a parallel stream return whichever it reaches first;
// findFirst() forces encounter order and costs coordination.

// anyMatch / allMatch / noneMatch all short-circuit — prefer them to
// filter(...).count() &gt; 0, which processes everything.</code></pre>
<p><strong>The judgement to show:</strong> "Streams are for readability first. I reach for them when the pipeline expresses intent better than a loop, and I drop back to a loop in genuinely hot code where the profiler says it matters — a stream allocates a pipeline per call, and a <code>for</code> over an <code>int[]</code> does not. What I never do is guess: the difference is only visible under measurement."</p>`
}
]);
