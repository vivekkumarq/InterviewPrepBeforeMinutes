/* ============================================================
   Important Coding Questions — registry

   Separate from js/topics.js on purpose. The interview topics are a Q&A
   bank; this section is a SOLUTIONS reference: every question carries
   several approaches, each with its own complexity and its own code in
   two languages.

   Code is stored as PLAIN strings and HTML-escaped at render time. The
   topic data files escape by hand inside template literals, which is the
   single biggest source of bugs in this repo (a stray backtick or an
   unescaped ${ silently breaks a whole file). Raw strings sidestep it.
   ============================================================ */

window.CODE_SECTIONS = [
  { id: "dsa",         name: "DSA",         blurb: "Arrays, strings, hashing, sorting, recursion and the classic structures." },
  { id: "tree",        name: "Trees",       blurb: "Traversals, tree problems, binary search trees and the advanced structures." },
  { id: "concurrency", name: "Concurrency", blurb: "Threads, locks, futures, parallel data and the classic synchronisation puzzles." }
];

/* `soon: true` means js/data/code/<id>.js is not written yet. The topic still
   shows in the sidebar so the full scope is visible, but it is not linkable,
   so nothing 404s. Drop the flag in the commit that adds its data file.

   `count` is the number of questions the topic file ships. It is used for the
   sidebar badge before the file is loaded, so it must be kept in step. */
window.CODE_TOPICS = [
  /* ---- DSA ---- */
  { id: "basics-bigo",   section: "dsa", name: "Basics & Big-O",           count: 10 },
  { id: "arrays",        section: "dsa", name: "Arrays",                   count: 21 },
  { id: "strings",       section: "dsa", name: "Strings",                  count: 11 },
  { id: "hashing",       section: "dsa", name: "Hashing",                  count: 4 },
  { id: "searching",     section: "dsa", name: "Searching & Sorting",      count: 13 },
  { id: "linked-lists",  section: "dsa", name: "Linked Lists",             count: 12 },
  { id: "stacks-queues", section: "dsa", name: "Stacks & Queues",          count: 9 },
  { id: "recursion",     section: "dsa", name: "Recursion & Backtracking", count: 8 },
  { id: "bits",          section: "dsa", name: "Bit Manipulation",         count: 3 },
  { id: "heaps",         section: "dsa", name: "Heaps & Priority Queues",  count: 5 },
  { id: "greedy",        section: "dsa", name: "Greedy Algorithms",        count: 4 },
  { id: "dp",            section: "dsa", name: "Dynamic Programming",      count: 11 },
  { id: "graphs",        section: "dsa", name: "Graphs",                   count: 13 },
  /* ---- Trees ---- */
  { id: "tree-basics",   section: "tree", name: "Binary Tree Basics",      count: 9, soon: true },
  { id: "tree-problems", section: "tree", name: "Binary Tree Problems",    count: 13, soon: true },
  { id: "bst",           section: "tree", name: "Binary Search Tree",      count: 7, soon: true },
  { id: "tree-advanced", section: "tree", name: "Advanced Trees",          count: 3, soon: true },
  /* ---- Concurrency ---- */
  { id: "thread-basics", section: "concurrency", name: "Thread Basics",              count: 3, soon: true },
  { id: "sync",          section: "concurrency", name: "Synchronization",            count: 8, soon: true },
  { id: "futures",       section: "concurrency", name: "Futures & Async",            count: 10, soon: true },
  { id: "parallel-data", section: "concurrency", name: "Data Parallelism",           count: 7, soon: true },
  { id: "concurrent-collections", section: "concurrency", name: "Concurrent Collections", count: 5, soon: true },
  { id: "classic-concurrency",    section: "concurrency", name: "Classic Concurrency Problems", count: 9, soon: true }
];

window.CODE_DATA = {};   /* topicId -> { intro, questions[] } */

/* Called by each js/data/code/<topic>.js file. */
window.registerCode = function (topicId, payload) {
  window.CODE_DATA[topicId] = payload;
  document.dispatchEvent(new CustomEvent("code:loaded", { detail: { id: topicId } }));
};

window.codeTopic = function (id) {
  for (var i = 0; i < window.CODE_TOPICS.length; i++) {
    if (window.CODE_TOPICS[i].id === id) return window.CODE_TOPICS[i];
  }
  return null;
};

/* Every question, flattened, for search and for prev/next. Only covers
   topics whose file has actually loaded. */
window.codeAllLoaded = function () {
  var out = [];
  window.CODE_TOPICS.forEach(function (t) {
    var d = window.CODE_DATA[t.id];
    if (!d || !d.questions) return;
    d.questions.forEach(function (q) { out.push({ topic: t, q: q }); });
  });
  return out;
};
