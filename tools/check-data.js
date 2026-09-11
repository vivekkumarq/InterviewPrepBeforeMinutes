#!/usr/bin/env node
/*
 * Guards the content files against two mistakes that `node --check` cannot see.
 *
 *  1. An unescaped `${...}` inside an answer's template literal. It parses
 *     fine, then throws ReferenceError at runtime — so a YAML snippet like
 *     `${DB_URL}` silently breaks the whole topic when the file loads.
 *  2. Markdown syntax in a plain-text field (question titles, topic blurbs,
 *     cheatsheet headings), which renders as literal backticks on the page.
 *
 * Usage:  node tools/check-data.js          # report
 *         node tools/check-data.js --fix    # escape the ${ and report the rest
 */
const fs = require("fs");
const path = require("path");

const FIX = process.argv.includes("--fix");
const dataDir = path.join(__dirname, "..", "js", "data");
const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".js"));

let dollars = 0, fixed = 0, markdown = 0, stray = 0, backticks = 0;

for (const name of files) {
  const file = path.join(dataDir, name);
  const src = fs.readFileSync(file, "utf8");

  // A `${` counts as escaped only when preceded by an ODD number of backslashes.
  const hits = [...src.matchAll(/(\\*)\$\{/g)].filter(m => m[1].length % 2 === 0);
  if (hits.length) {
    dollars += hits.length;
    if (FIX) {
      const out = src.replace(/(\\*)\$\{/g, (m, s) => (s.length % 2 === 1 ? m : s + "\\${"));
      fs.writeFileSync(file, out);
      fixed += hits.length;
      console.log(`  fixed  ${name}: escaped ${hits.length} interpolation(s)`);
    } else {
      hits.forEach(m => {
        const line = src.slice(0, m.index).split("\n").length;
        console.log(`  ERROR  ${name}:${line} unescaped \${ — throws at runtime`);
      });
    }
  }

  // A bare backtick inside an answer closes its template literal early. Node
  // reports the resulting error far from the real cause, so flag it here.
  src.split(String.fromCharCode(10)).forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
      // Strip the legitimate closing backtick that ends an answer literal.
      const body = line.replace(/<\/code><\/pre>`\s*[,;]?\s*$/, "");
      const ticks = (body.match(/`/g) || []).length;
      if (ticks === 1) {
        backticks++;
        console.log(`  ERROR  ${name}:${i + 1} lone backtick in a code comment closes the template literal: ${trimmed.slice(0, 70)}`);
      }
    }
  });

  // Stray non-Latin script — usually a slip while typing, and invisible in review.
  // Emoji, arrows, box-drawing and accented Latin are all expected here.
  const STRAY = /[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;
  src.split(String.fromCharCode(10)).forEach((line, i) => {
    const m = line.match(STRAY);
    if (m) {
      stray++;
      console.log(`  ERROR  ${name}:${i + 1} stray non-Latin character ${JSON.stringify(m[0])} — ${line.trim().slice(0, 70)}`);
    }
  });

  // Plain-text fields are escaped and injected as text, so markdown shows literally.
  for (const m of src.matchAll(/\bq:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
    // Only backticks matter: underscores are legitimate in identifiers
    // like REQUIRES_NEW, and asterisks appear in globs.
    if (/`/.test(m[1])) {
      markdown++;
      const line = src.slice(0, m.index).split("\n").length;
      console.log(`  ERROR  ${name}:${line} markdown in a plain-text question title: ${m[1].slice(0, 60)}`);
    }
  }
  for (const m of src.matchAll(/\bh:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
    if (/`/.test(m[1])) {
      markdown++;
      const line = src.slice(0, m.index).split("\n").length;
      console.log(`  ERROR  ${name}:${line} backtick in a cheatsheet heading: ${m[1].slice(0, 60)}`);
    }
  }
}

const remaining = (FIX ? 0 : dollars) + markdown + stray + backticks;
console.log(
  `\nScanned ${files.length} files — ` +
  (FIX ? `escaped ${fixed} interpolation(s), ` : `${dollars} unescaped interpolation(s), `) +
  `${markdown} markdown issue(s), ${stray} stray character(s)`
);
process.exit(remaining ? 1 : 0);
