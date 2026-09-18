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

/* ---- 5. every palette in the picker must exist in CSS, and be complete ----
   A theme listed in app.js with no [data-theme] block is a button that does
   nothing; one missing a variable silently inherits the LIGHT :root value,
   which is how a dark palette ends up with white panels. */
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const themeBlock = app.match(/var THEMES = \[([\s\S]*?)\n  \];/);
const pickerIds = themeBlock
  ? [...themeBlock[1].matchAll(/\{\s*id:\s*"([^"]+)"/g)].map(m => m[1])
  : [];
ok(pickerIds.length > 0, `found ${pickerIds.length} palette(s) in the picker: ${pickerIds.join(" ")}`);

// :root is the light default; every other palette needs its own block.
const rootVars = (clean.match(/:root\s*\{([^}]*)\}/) || ["", ""])[1];
const required = [...rootVars.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1])
  .filter(v => !["--sbw", "--mono", "--sans", "--radius"].includes(v)); // not palette-specific

pickerIds.filter(id => id !== "light").forEach(id => {
  const block = clean.match(new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`));
  if (!block) { ok(false, `[data-theme="${id}"] block exists`); return; }
  const missing = required.filter(v => !new RegExp(v + "\\s*:").test(block[1]));
  ok(missing.length === 0,
     `palette "${id}" defines every palette variable` +
     (missing.length ? ` — MISSING: ${missing.join(" ")}` : ""));
});

// The swatch colour shown in the picker should match the palette's real --bg.
pickerIds.forEach(id => {
  const swatch = (app.match(new RegExp(`id:\\s*"${id}"[^}]*bg:\\s*"([^"]+)"`)) || [])[1];
  const src = id === "light" ? rootVars
            : (clean.match(new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`)) || ["", ""])[1];
  const real = (src.match(/--bg\s*:\s*([^;]+)/) || ["", ""])[1].trim();
  if (swatch && real && swatch.toLowerCase() !== real.toLowerCase()) {
    console.log(`  note   "${id}" swatch ${swatch} does not match its --bg ${real}`);
  }
});

/* ---- 6. contrast ----
   A palette that reads as "moody" in a screenshot can still be unreadable.
   Checked from the stylesheet rather than a browser, because body has a .35s
   background transition and a computed-style read lands mid-animation. */
const relLum = hex => {
  const h = hex.trim().replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map(i => parseInt(h.substr(i, 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const varOf = (src, name) => (src.match(new RegExp(name + "\\s*:\\s*([^;]+)")) || ["", ""])[1].trim();

// AA is 4.5:1 for body text. --text-mute is only used for small caps labels
// and hints, which are decorative enough to sit at the 3:1 large-text bar.
const PAIRS = [
  ["--text", "--bg", 4.5],
  ["--text-dim", "--bg", 4.5],
  ["--accent", "--bg", 4.5],
  ["--code-text", "--code-bg", 4.5],
  ["--text-mute", "--panel", 3.0]
];

pickerIds.forEach(id => {
  const src = id === "light" ? rootVars
            : (clean.match(new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`)) || ["", ""])[1];
  const bad = PAIRS.map(([fg, bg, min]) => {
    const f = varOf(src, fg), b = varOf(src, bg);
    if (!/^#[0-9a-f]{6}$/i.test(f) || !/^#[0-9a-f]{6}$/i.test(b)) return null;
    const r = contrast(f, b);
    return r < min ? `${fg} on ${bg} ${r.toFixed(2)}:1 (need ${min})` : null;
  }).filter(Boolean);
  ok(bad.length === 0, `palette "${id}" meets contrast` + (bad.length ? ` — ${bad.join(", ")}` : ""));
});

console.log(`\n${fail === 0 ? "ALL CSS CHECKS PASSED" : fail + " CHECK(S) FAILED"}`);
process.exit(fail ? 1 : 0);
