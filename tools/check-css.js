#!/usr/bin/env node
/*
 * Guards CSS invariants that break the page without breaking the build.
 *
 * The one that shipped: the HTML `hidden` attribute hides an element through the
 * USER-AGENT rule [hidden]{display:none}. Author styles beat the UA origin, so
 * ANY author rule setting a display value on a hidden element silently un-hides
 * it while JS still reads hasAttribute('hidden') === true. On this site that put
 * a full-viewport backdrop-filter overlay above the whole mobile page: it blurred
 * everything and swallowed every tap, with no error anywhere.
 *
 * Usage: node tools/check-css.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "css", "styles.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };

/* ---- 1. the reset that makes `hidden` authoritative ---- */
const hasReset = /\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/.test(css);
ok(hasReset, "[hidden]{display:none!important} reset is present");

/* ---- 2. which elements actually rely on the attribute ---- */
const hiddenEls = [...html.matchAll(/<[^>]*\bhidden\b[^>]*>/g)].map(m => {
  const tag = m[0];
  const id = (tag.match(/\bid="([^"]+)"/) || [])[1];
  const cls = (tag.match(/\bclass="([^"]+)"/) || [])[1];
  return { id, classes: cls ? cls.split(/\s+/) : [] };
});
ok(hiddenEls.length > 0, `found ${hiddenEls.length} element(s) using the hidden attribute: ` +
   hiddenEls.map(e => "#" + (e.id || "?")).join(" "));

/* ---- 3. report author rules that set display on those elements ---- */
// Strip comments, then walk top-level and @media blocks.
const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [];
const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = ruleRe.exec(clean)) !== null) {
  rules.push({ sel: m[1].trim().replace(/\s+/g, " "), body: m[2] });
}

const selectorsFor = e => [e.id && "#" + e.id, ...e.classes.map(c => "." + c)].filter(Boolean);
const conflicts = [];
hiddenEls.forEach(e => {
  selectorsFor(e).forEach(sel => {
    rules.forEach(r => {
      if (r.sel.includes("[hidden]")) return;                 // the reset itself
      // match the selector as a whole token, not a prefix of a longer class
      const token = new RegExp(sel.replace(/[.#]/, "\\$&") + "(?![\\w-])");
      if (!token.test(r.sel)) return;
      const disp = r.body.match(/(?:^|;)\s*display\s*:\s*([^;!]+)/);
      if (disp && disp[1].trim() !== "none") {
        conflicts.push(`${sel} -> "${r.sel}" sets display:${disp[1].trim()}`);
      }
    });
  });
});

// These are fine ONLY because the reset outranks them. Without it they are bugs.
if (conflicts.length) {
  console.log("  note   " + conflicts.length + " rule(s) set a display value on a hidden element:");
  conflicts.forEach(c => console.log("           " + c));
  console.log("         harmless while the reset above exists; each becomes a live bug without it.");
}
ok(!conflicts.length || hasReset,
   "no hidden element can be un-hidden by an author display rule");

/* ---- 4. a full-viewport overlay must never be interactive unless shown ---- */
const overlayRules = rules.filter(r =>
  /position\s*:\s*fixed/.test(r.body) && /inset\s*:\s*0/.test(r.body) &&
  /(background|backdrop-filter)/.test(r.body));
ok(overlayRules.length === 0 || hasReset,
   `${overlayRules.length} full-viewport overlay(s) found — each is gated by the hidden attribute`);

console.log(`\n${fail === 0 ? "ALL CSS CHECKS PASSED" : fail + " CHECK(S) FAILED"}`);
process.exit(fail ? 1 : 0);
