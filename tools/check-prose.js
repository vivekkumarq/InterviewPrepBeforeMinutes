#!/usr/bin/env node
/*
 * Prose and markup audit across BOTH content sets: the interview Q&A bank
 * (js/data/*.js) and the coding solutions (js/data/code/*.js).
 *
 * These files are rendered as raw HTML, so an unclosed tag silently eats the
 * rest of a page and a doubled word just looks sloppy. Neither is caught by
 * `node --check`, which is why this exists.
 *
 * Code strings are checked for markup only — prose rules would fire on
 * legitimate source (`a a` in a type signature, `<` in a generic).
 *
 * Usage: node tools/check-prose.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
let problems = 0;
const flag = (where, msg) => { console.log(`  ${where}\n      ${msg}`); problems++; };

/* ---------- load the coding data ---------- */
const codeDir = path.join(root, "js", "data", "code");
const codeData = {};
const codeBox = { registerCode(id, p) { codeData[id] = p; },
                  document: { dispatchEvent() {} }, CustomEvent: function () {} };
vm.createContext(codeBox);
fs.readdirSync(codeDir).filter(f => f.endsWith(".js")).forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(codeDir, f), "utf8"), codeBox));

/* ---------- load the topic data ---------- */
const topicDir = path.join(root, "js", "data");
const topicData = {};
const primers = {};
const topicBox = {
  registerPrimer(id, html) { primers[id] = html; },
  registerTopic(id, qs) { topicData[id] = (topicData[id] || []).concat(qs); },
  appendTopic(id, qs) { topicData[id] = (topicData[id] || []).concat(qs); },
  registerSheet() {}, window: {},
  document: { dispatchEvent() {} }, CustomEvent: function () {}
};
vm.createContext(topicBox);
fs.readdirSync(topicDir).filter(f => f.endsWith(".js")).forEach(f => {
  try { vm.runInContext(fs.readFileSync(path.join(topicDir, f), "utf8"), topicBox); }
  catch (e) { flag(f, "threw while loading: " + e.message); }
});

/* ---------- checks ---------- */
const VOID = new Set(["br", "hr", "img", "input", "meta", "link", "path", "circle",
                      "rect", "line", "polyline", "polygon", "ellipse", "use", "stop"]);

function checkMarkup(where, html) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, closing, tag, attrs, selfClose] = m;
    const name = tag.toLowerCase();
    if (VOID.has(name) || selfClose) continue;
    if (closing) {
      if (!stack.length) return flag(where, `stray closing </${name}>`);
      const open = stack.pop();
      if (open !== name) return flag(where, `</${name}> closes <${open}>`);
    } else {
      stack.push(name);
    }
  }
  if (stack.length) flag(where, `unclosed <${stack.join(">, <")}>`);
}

const MISSPELLINGS = [
  [/\bteh\b/i, "teh"], [/\brecieve/i, "recieve"], [/\bseperate/i, "seperate"],
  [/\boccured\b/i, "occured"], [/\bwich\b/i, "wich"], [/\badn\b/i, "adn"],
  [/\bthier\b/i, "thier"], [/\bdefinately/i, "definately"], [/\bconsistant/i, "consistant"],
  [/\bexistance/i, "existance"], [/\bpersistant/i, "persistant"],
  [/\bdependancy/i, "dependancy"], [/\bcompatability/i, "compatability"],
  [/\bacheive/i, "acheive"], [/\bretreive/i, "retreive"], [/\blenght\b/i, "lenght"],
  [/\bsuccessfull\b/i, "successfull"], [/\bneccessary/i, "neccessary"],
  [/\baccomodate/i, "accomodate"], [/\boccurence/i, "occurence"],
  [/\bpreceeding/i, "preceeding"], [/\bindependant/i, "independant"]
];

/* Stripping every tag to a space produces two whole classes of false
   positive: "<code>x</code>," reads as "x ," (space before punctuation) and
   "<td>Yes</td><td>Yes</td>" reads as "Yes Yes" (doubled word). Inline tags
   must vanish entirely; only block and cell boundaries become separators. */
const INLINE = /<\/?(code|strong|em|b|i|span|a|kbd|sub|sup|small|abbr)\b[^>]*>/gi;

function toProse(html) {
  return String(html)
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ")   // code blocks are not prose
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(INLINE, "")                     // inline: remove, no space
    .replace(/<[^>]+>/g, "\n");              // block/cell: hard separator
}

function checkProse(where, html) {
  const text = toProse(html);

  /* Same line only: a newline here means a cell or block boundary, and
     "…Yes</td><td>Yes…" is two cells, not a stutter. */
  const dup = text.match(/\b(\w+)[ \t]+\1\b/gi);
  if (dup) {
    const real = dup.filter(d => {
      const [a, b] = d.split(/[ \t]+/);
      if (/^(that|had|is|log)$/i.test(a)) return false;   // "that that", O(n log log n)
      if (a !== b) return false;      // "or OR": conjunction + SQL operator
      // "the next next()" - second word is a method name, not a stutter
      const at = text.indexOf(d);
      return text.charAt(at + d.length) !== "(";
    });
    if (real.length) flag(where, "doubled word: " + [...new Set(real)].join(", "));
  }
  MISSPELLINGS.forEach(([re, word]) => {
    if (re.test(text)) flag(where, `misspelling: ${word}`);
  });
  /* There is deliberately NO space-before-punctuation rule. Technical prose
     is full of literal dots as subject matter — "COPY . .", "support . as a
     wildcard", the dot-separated parts of a JWT, ".class" files — and the
     check could not separate those from a genuine stray space. It produced
     37 false positives and zero true ones, so it is removed rather than
     left to cry wolf. */
}

/* ---------- coding questions ---------- */
let codeQ = 0, codeA = 0;
const seenSlugs = new Map();
const numbers = [];
Object.keys(codeData).forEach(id => {
  const p = codeData[id];
  checkMarkup(`${id} (intro)`, p.intro);
  checkProse(`${id} (intro)`, p.intro);
  p.questions.forEach(q => {
    codeQ++;
    numbers.push(q.n);
    const w = `${id}/${q.slug}`;
    if (seenSlugs.has(q.slug)) flag(w, `slug also used in ${seenSlugs.get(q.slug)}`);
    seenSlugs.set(q.slug, id);
    checkMarkup(w + " (statement)", q.statement);
    checkProse(w + " (statement)", q.statement);
    if (q.note) { checkMarkup(w + " (note)", q.note); checkProse(w + " (note)", q.note); }
    if (!/^[A-Z0-9]/.test(q.title)) flag(w, `title does not start capitalised: "${q.title}"`);
    q.approaches.forEach((a, i) => {
      codeA++;
      const aw = `${w} approach ${i + 1}`;
      checkMarkup(aw, a.note);
      checkProse(aw, a.note);
      if (!/^O\(|^—$|^~|^varies$|^exponential$/i.test(a.time))
        flag(aw, `odd time format: "${a.time}"`);
      if (!/^O\(|^—$|^~|^varies$/i.test(a.space))
        flag(aw, `odd space format: "${a.space}"`);
      ["java", "python"].forEach(lang => {
        if (/<\/?(p|div|span|strong|em|code)>/i.test(a[lang]))
          flag(aw, `${lang} code contains HTML tags`);
      });
    });
  });
});
const sorted = [...numbers].sort((a, b) => a - b);
sorted.forEach((n, i) => {
  if (n !== i + 1) { flag("numbering", `expected ${i + 1}, found ${n}`); }
});

/* ---------- interview questions ---------- */
let topicQ = 0;
Object.keys(topicData).forEach(id => {
  topicData[id].forEach((q, i) => {
    topicQ++;
    const w = `${id}[${i}] ${String(q.q).slice(0, 44)}`;
    checkMarkup(w, q.a);
    checkProse(w, q.a);
    if (/`/.test(q.q)) flag(w, "backtick in a plain-text title (renders literally)");
  });
});

console.log(`\n  coding: ${codeQ} questions, ${codeA} approaches`);
console.log(`  topics: ${topicQ} questions, ${Object.keys(primers).length} primers`);
console.log(`\n${problems === 0 ? "NO PROSE OR MARKUP PROBLEMS" : problems + " PROBLEM(S) FOUND"}`);
process.exit(problems ? 1 : 0);
