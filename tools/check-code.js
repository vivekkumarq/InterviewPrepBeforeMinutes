#!/usr/bin/env node
/*
 * Guards the Important Coding Questions data.
 *
 * These files are loaded by <script> at runtime, so a malformed entry is not a
 * crash — it is a half-rendered page nobody notices. This checks the shape of
 * every question and keeps js/coding.js in step with what is actually on disk:
 * a topic still flagged `soon` after its file lands is invisible in the UI, and
 * a wrong `count` shows the wrong badge in the sidebar.
 *
 * Usage: node tools/check-code.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const DIFFS = ["easy", "medium", "hard"];

let fail = 0;
const bad = m => { console.log("  FAIL  " + m); fail++; };

/* ---- load the registry ---- */
const ctx = { window: {}, document: { dispatchEvent() {} }, CustomEvent: function () {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "js", "coding.js"), "utf8"), ctx);
const topics = ctx.window.CODE_TOPICS;
const sections = ctx.window.CODE_SECTIONS.map(s => s.id);

/* ---- load every topic data file ---- */
const dir = path.join(root, "js", "data", "code");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".js")) : [];
const data = {};
const sandbox = {
  registerCode(id, payload) { data[id] = payload; },
  document: { dispatchEvent() {} }, CustomEvent: function () {}
};
vm.createContext(sandbox);
files.forEach(f => {
  try { vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), sandbox); }
  catch (e) { bad(`${f} threw while loading: ${e.message}`); }
});

/* ---- registry vs disk ---- */
topics.forEach(t => {
  const onDisk = files.includes(t.id + ".js");
  if (t.soon && onDisk) bad(`"${t.id}" has a data file but is still flagged soon — it will not be linkable`);
  if (!t.soon && !onDisk) bad(`"${t.id}" is linkable but js/data/code/${t.id}.js does not exist — it will 404`);
  if (!sections.includes(t.section)) bad(`"${t.id}" has unknown section "${t.section}"`);
});
const known = topics.map(t => t.id);
files.forEach(f => {
  const id = f.replace(/\.js$/, "");
  if (!known.includes(id)) bad(`js/data/code/${f} has no entry in CODE_TOPICS`);
});

/* ---- shape of every question ---- */
let qTotal = 0, aTotal = 0;
Object.keys(data).forEach(id => {
  const payload = data[id];
  const topic = topics.find(t => t.id === id);
  if (!payload.intro) bad(`${id}: missing intro`);
  if (!Array.isArray(payload.questions) || !payload.questions.length) {
    bad(`${id}: no questions`); return;
  }
  if (topic && topic.count !== payload.questions.length) {
    bad(`${id}: CODE_TOPICS says count ${topic.count}, file has ${payload.questions.length}`);
  }

  const slugs = new Set();
  payload.questions.forEach((q, i) => {
    const where = `${id}[${i}]`;
    ["slug", "title", "difficulty", "statement"].forEach(k => {
      if (!q[k]) bad(`${where}: missing ${k}`);
    });
    if (typeof q.n !== "number") bad(`${where}: missing numeric n`);
    if (q.slug) {
      if (slugs.has(q.slug)) bad(`${where}: duplicate slug "${q.slug}"`);
      slugs.add(q.slug);
      if (!/^[a-z0-9-]+$/.test(q.slug)) bad(`${where}: slug "${q.slug}" must be lowercase kebab-case (it is a URL)`);
    }
    if (q.difficulty && !DIFFS.includes(q.difficulty)) {
      bad(`${where}: difficulty "${q.difficulty}" is not one of ${DIFFS.join("/")}`);
    }
    if (!Array.isArray(q.approaches) || !q.approaches.length) {
      bad(`${where}: no approaches`); return;
    }
    qTotal++;
    q.approaches.forEach((a, j) => {
      aTotal++;
      const aw = `${where}.approaches[${j}]`;
      ["name", "time", "space", "note", "java", "python"].forEach(k => {
        if (!a[k]) bad(`${aw}: missing ${k}`);
      });
      /* Code is escaped at render, so raw < and & are fine — but a stray
         HTML tag in a NOTE is rendered, and an unclosed one eats the page. */
      const open = (String(a.note).match(/<(\w+)[^>]*>/g) || []).length;
      const close = (String(a.note).match(/<\/\w+>/g) || []).length;
      if (open !== close) bad(`${aw}: note has ${open} opening and ${close} closing tags`);
    });
    const best = q.approaches.filter(a => a.best).length;
    if (best > 1) bad(`${where}: ${best} approaches flagged best — only one may be`);
  });
});

const ready = topics.filter(t => !t.soon);
console.log(`  topics on disk : ${files.length} of ${topics.length}`);
console.log(`  questions      : ${qTotal}`);
console.log(`  approaches     : ${aTotal}`);
console.log(`  planned total  : ${topics.reduce((a, t) => a + t.count, 0)}`);
console.log(`  live total     : ${ready.reduce((a, t) => a + t.count, 0)}`);
console.log(`\n${fail === 0 ? "ALL CODE CHECKS PASSED" : fail + " CHECK(S) FAILED"}`);
process.exit(fail ? 1 : 0);
