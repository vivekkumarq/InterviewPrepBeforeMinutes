/* ============================================================
   InterviewPrepBeforeMinutes — client-side app
   Hash router, lazy topic loading, search, progress, theme.
   ============================================================ */
(function () {
  "use strict";

  var LS_THEME = "ipbm.theme";
  var LS_DONE = "ipbm.done";
  var LS_OPEN = "ipbm.groups";
  var LS_FONT = "ipbm.font";
  var LS_SIZE = "ipbm.size";

  /* ---------------- typefaces ----------------
     'google' fonts are fetched only when the reader actually selects them (or
     hovers the row), so the default load stays at a single family.
     `cat` only groups the picker; it has no effect on rendering.
     Families with a single weight must omit the wght axis — asking Google for
     a weight a family does not ship makes the whole request 400. */
  var FONT_CATS = [
    { id: "sans",  name: "Sans · clean & neutral" },
    { id: "serif", name: "Serif · long-form reading" },
    { id: "mono",  name: "Monospace · code-like" },
    { id: "display", name: "Display · fancy & expressive" },
    { id: "hand",  name: "Handwriting & script" }
  ];

  var FONTS = [
    /* --- sans --- */
    { id: "inter",      cat: "sans", name: "Inter",           note: "Default · clean UI sans",    stack: "'Inter', system-ui, sans-serif", google: "Inter:wght@400;500;600;700;800" },
    { id: "system",     cat: "sans", name: "System UI",       note: "Your OS font · fastest",     stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
    { id: "roboto",     cat: "sans", name: "Roboto",          note: "Android · neutral",          stack: "'Roboto', system-ui, sans-serif", google: "Roboto:wght@400;500;700" },
    { id: "opensans",   cat: "sans", name: "Open Sans",       note: "Highly readable",            stack: "'Open Sans', system-ui, sans-serif", google: "Open+Sans:wght@400;500;600;700" },
    { id: "lato",       cat: "sans", name: "Lato",            note: "Warm humanist",              stack: "'Lato', system-ui, sans-serif", google: "Lato:wght@400;700;900" },
    { id: "poppins",    cat: "sans", name: "Poppins",         note: "Geometric · modern",         stack: "'Poppins', system-ui, sans-serif", google: "Poppins:wght@400;500;600;700" },
    { id: "nunito",     cat: "sans", name: "Nunito",          note: "Rounded · friendly",         stack: "'Nunito', system-ui, sans-serif", google: "Nunito:wght@400;600;700;800" },
    { id: "sourcesans", cat: "sans", name: "Source Sans 3",   note: "Adobe · technical docs",     stack: "'Source Sans 3', system-ui, sans-serif", google: "Source+Sans+3:wght@400;600;700" },
    { id: "ibmplex",    cat: "sans", name: "IBM Plex Sans",   note: "Engineering feel",           stack: "'IBM Plex Sans', system-ui, sans-serif", google: "IBM+Plex+Sans:wght@400;500;600;700" },
    { id: "worksans",   cat: "sans", name: "Work Sans",       note: "Optimised for screens",      stack: "'Work Sans', system-ui, sans-serif", google: "Work+Sans:wght@400;500;600;700" },
    { id: "spacegrotesk", cat: "sans", name: "Space Grotesk", note: "Techy · distinctive",        stack: "'Space Grotesk', system-ui, sans-serif", google: "Space+Grotesk:wght@400;500;600;700" },
    { id: "figtree",    cat: "sans", name: "Figtree",         note: "Soft geometric sans",        stack: "'Figtree', system-ui, sans-serif", google: "Figtree:wght@400;500;600;800" },
    { id: "atkinson",   cat: "sans", name: "Atkinson Hyperlegible", note: "Max legibility · a11y", stack: "'Atkinson Hyperlegible', system-ui, sans-serif", google: "Atkinson+Hyperlegible:wght@400;700" },
    { id: "outfit",     cat: "sans", name: "Outfit",          note: "Crisp geometric · confident", stack: "'Outfit', system-ui, sans-serif", google: "Outfit:wght@400;500;600;700" },
    { id: "manrope",    cat: "sans", name: "Manrope",         note: "Modern · semi-rounded",       stack: "'Manrope', system-ui, sans-serif", google: "Manrope:wght@400;500;600;800" },
    { id: "plusjakarta", cat: "sans", name: "Plus Jakarta Sans", note: "Friendly · great numerals", stack: "'Plus Jakarta Sans', system-ui, sans-serif", google: "Plus+Jakarta+Sans:wght@400;500;600;700" },
    { id: "dmsans",     cat: "sans", name: "DM Sans",         note: "Low-contrast · easy on eyes", stack: "'DM Sans', system-ui, sans-serif", google: "DM+Sans:wght@400;500;700" },
    { id: "rubik",      cat: "sans", name: "Rubik",           note: "Rounded corners · warm",      stack: "'Rubik', system-ui, sans-serif", google: "Rubik:wght@400;500;600;700" },
    { id: "karla",      cat: "sans", name: "Karla",           note: "Grotesque · slightly quirky", stack: "'Karla', system-ui, sans-serif", google: "Karla:wght@400;500;700" },
    { id: "publicsans", cat: "sans", name: "Public Sans",     note: "US design system · neutral",  stack: "'Public Sans', system-ui, sans-serif", google: "Public+Sans:wght@400;500;600;700" },
    { id: "lexend",     cat: "sans", name: "Lexend",          note: "Tuned for reading speed",     stack: "'Lexend', system-ui, sans-serif", google: "Lexend:wght@400;500;600;700" },
    { id: "chakra",     cat: "sans", name: "Chakra Petch",    note: "Angular · sci-fi HUD",        stack: "'Chakra Petch', system-ui, sans-serif", google: "Chakra+Petch:wght@400;500;600;700" },

    /* --- serif --- */
    { id: "merriweather", cat: "serif", name: "Merriweather", note: "Serif · long reading",       stack: "'Merriweather', Georgia, serif", google: "Merriweather:wght@400;700" },
    { id: "lora",       cat: "serif", name: "Lora",           note: "Serif · elegant",            stack: "'Lora', Georgia, serif", google: "Lora:wght@400;500;600;700" },
    { id: "georgia",    cat: "serif", name: "Georgia",        note: "Classic serif · no download", stack: "Georgia, 'Times New Roman', serif" },
    { id: "bitter",     cat: "serif", name: "Bitter",         note: "Slab serif · screen-first",   stack: "'Bitter', Georgia, serif", google: "Bitter:wght@400;500;700" },
    { id: "sourceserif", cat: "serif", name: "Source Serif 4", note: "Serif · long-form reading",  stack: "'Source Serif 4', Georgia, serif", google: "Source+Serif+4:wght@400;600;700" },
    { id: "ebgaramond", cat: "serif", name: "EB Garamond",    note: "Old-style · bookish",         stack: "'EB Garamond', Georgia, serif", google: "EB+Garamond:wght@400;500;600;700" },
    { id: "baskerville", cat: "serif", name: "Libre Baskerville", note: "Sharp · high contrast",   stack: "'Libre Baskerville', Georgia, serif", google: "Libre+Baskerville:wght@400;700" },
    { id: "crimson",    cat: "serif", name: "Crimson Pro",    note: "Warm · essay feel",           stack: "'Crimson Pro', Georgia, serif", google: "Crimson+Pro:wght@400;500;600;700" },

    /* --- mono --- */
    { id: "jetbrains",  cat: "mono", name: "JetBrains Mono",  note: "Monospace · code everywhere", stack: "'JetBrains Mono', ui-monospace, monospace", google: "JetBrains+Mono:wght@400;500;700" },
    { id: "ibmplexmono", cat: "mono", name: "IBM Plex Mono",  note: "Monospace · terminal feel",   stack: "'IBM Plex Mono', ui-monospace, monospace", google: "IBM+Plex+Mono:wght@400;500;600" },
    { id: "spacemono",  cat: "mono", name: "Space Mono",      note: "Retro mono · distinctive",    stack: "'Space Mono', ui-monospace, monospace", google: "Space+Mono:wght@400;700" },
    { id: "firacode",   cat: "mono", name: "Fira Code",       note: "Mono · coding ligatures",     stack: "'Fira Code', ui-monospace, monospace", google: "Fira+Code:wght@400;500;600" },
    { id: "robotomono", cat: "mono", name: "Roboto Mono",     note: "Mono · tidy and compact",     stack: "'Roboto Mono', ui-monospace, monospace", google: "Roboto+Mono:wght@400;500;700" },

    /* --- display --- */
    { id: "playfair",   cat: "display", name: "Playfair Display", note: "Elegant · editorial",     stack: "'Playfair Display', Georgia, serif", google: "Playfair+Display:wght@400;500;600;700;800" },
    { id: "cormorant",  cat: "display", name: "Cormorant Garamond", note: "Delicate · luxurious",  stack: "'Cormorant Garamond', Georgia, serif", google: "Cormorant+Garamond:wght@400;500;600;700" },
    { id: "fraunces",   cat: "display", name: "Fraunces",     note: "Soft-serif · characterful",   stack: "'Fraunces', Georgia, serif", google: "Fraunces:wght@400;500;600;700" },
    { id: "comfortaa",  cat: "display", name: "Comfortaa",    note: "Fully rounded · playful",     stack: "'Comfortaa', system-ui, cursive", google: "Comfortaa:wght@400;500;600;700" },
    { id: "quicksand",  cat: "display", name: "Quicksand",    note: "Rounded geometric · soft",    stack: "'Quicksand', system-ui, sans-serif", google: "Quicksand:wght@400;500;600;700" },
    { id: "josefin",    cat: "display", name: "Josefin Sans", note: "Art-deco · vintage",          stack: "'Josefin Sans', system-ui, sans-serif", google: "Josefin+Sans:wght@400;500;600;700" },

    /* --- handwriting & script --- */
    { id: "caveat",     cat: "hand", name: "Caveat",          note: "Handwritten · legible notes", stack: "'Caveat', 'Segoe Script', cursive", google: "Caveat:wght@400;500;600;700" },
    { id: "kalam",      cat: "hand", name: "Kalam",           note: "Handwritten · pen strokes",   stack: "'Kalam', 'Segoe Script', cursive", google: "Kalam:wght@300;400;700" },
    { id: "patrickhand", cat: "hand", name: "Patrick Hand",   note: "Neat print handwriting",      stack: "'Patrick Hand', 'Comic Sans MS', cursive", google: "Patrick+Hand" },
    { id: "architects", cat: "hand", name: "Architects Daughter", note: "Sketchbook · casual",     stack: "'Architects Daughter', 'Comic Sans MS', cursive", google: "Architects+Daughter" },
    { id: "shadows",    cat: "hand", name: "Shadows Into Light", note: "Light marker pen",         stack: "'Shadows Into Light', 'Segoe Script', cursive", google: "Shadows+Into+Light" },
    { id: "indieflower", cat: "hand", name: "Indie Flower",   note: "Rounded · friendly script",   stack: "'Indie Flower', 'Comic Sans MS', cursive", google: "Indie+Flower" },
    { id: "dancing",    cat: "hand", name: "Dancing Script",  note: "Flowing calligraphy",         stack: "'Dancing Script', 'Segoe Script', cursive", google: "Dancing+Script:wght@400;500;600;700" },
    { id: "pacifico",   cat: "hand", name: "Pacifico",        note: "Bold brush script",           stack: "'Pacifico', 'Segoe Script', cursive", google: "Pacifico" }
  ];

  /* Tag -> icon. Gives every question a relevant glyph without hand-tagging
     each one; a question may still override it with its own `icon`. */
  var TAG_ICONS = {
    jvm: "⚙️", basics: "📘", string: "🔤", memory: "🧠", equals: "⚖️", oop: "🧩",
    exceptions: "⚠️", gotcha: "🪤", collections: "📦", generics: "🧬", serialization: "💾",
    design: "📐", solid: "🏛️", patterns: "🧱", polymorphism: "🎭", uml: "📊",
    concurrency: "🧵", locks: "🔒", atomics: "⚛️", jmm: "🧠", executors: "🏭",
    deadlock: "🚧", threadlocal: "🧶", loom: "🪶", synchronizers: "🚦", async: "⏳",
    streams: "🌊", lambda: "λ", optional: "❓", collectors: "🧺", datetime: "📅",
    gc: "🗑️", jit: "🚀", tuning: "🎛️", classloading: "📚", bytecode: "🔩",
    ioc: "🔄", di: "💉", beans: "🫘", lifecycle: "♻️", aop: "✂️", proxy: "🎭",
    transactions: "💳", configuration: "⚙️", annotations: "🏷️", spel: "🧮",
    autoconfiguration: "🪄", actuator: "🩺", validation: "✅", caching: "⚡",
    logging: "📝", json: "🔣", scheduling: "⏰", webflux: "🌀",
    security: "🛡️", jwt: "🎟️", oauth2: "🔑", passwords: "🔐", csrf: "🚫",
    cors: "🌐", rbac: "👮", authorization: "🚪", authentication: "🪪", tokens: "🎫",
    mapping: "🗺️", queries: "🔍", fetching: "🎣", "persistence-context": "🧊",
    "n+1": "➕", auditing: "🕵️", jpa: "🗄️", batch: "📚",
    http: "🌐", rest: "🔌", versioning: "🔢", idempotency: "♾️", openapi: "📄",
    pagination: "📑", errors: "❗", schema: "📋", resolvers: "🧩", dataloader: "🚚",
    subscriptions: "📡", federation: "🕸️", realtime: "⚡",
    producer: "📤", consumers: "📥", offsets: "🔖", reliability: "🛟",
    replication: "🔁", semantics: "📐", ordering: "🔢", storage: "💽", ecosystem: "🧰",
    architecture: "🏗️", microservices: "🧱", resilience: "🛡️", consistency: "⚖️",
    communication: "📞", saga: "🔗", migration: "🚚", ddd: "🎯", sre: "📈",
    "design-question": "🧭", estimation: "🔢", theory: "📚", scaling: "📈",
    distributed: "🌍", availability: "🟢", saas: "🏢", algorithms: "🧮",
    database: "🗃️", joins: "🔗", indexes: "🚄", "window-functions": "🪟",
    normalization: "📐", ddl: "🏗️", procedures: "📜", locking: "🔒", mvcc: "🔀",
    vacuum: "🧹", jsonb: "📦", partitioning: "🪓", integrity: "🔗",
    docker: "🐳", images: "🖼️", dockerfile: "📜", networking: "🌐",
    compose: "🎼", registry: "📦", orchestration: "🎻", volumes: "💾",
    kubernetes: "☸️", workloads: "🚢", probes: "🩺", resources: "📊",
    deployment: "🚀", governance: "📋", "multi-tenancy": "🏢", cost: "💰",
    cicd: "🔁", git: "🌿", pipeline: "⚙️", iac: "📜", release: "🏷️",
    monitoring: "📈", process: "🔄", maintenance: "🔧", quality: "✨",
    testing: "🧪", junit: "🧪", mockito: "🎭", integration: "🔗",
    testcontainers: "📦", metrics: "📊", assertions: "✅", terminology: "📖",
    techniques: "🛠️", strategy: "🎯", contracts: "🤝", observability: "👁️",
    components: "🧩", templates: "📄", directives: "🎯", pipes: "🚿",
    rxjs: "🌊", signals: "📶", forms: "📝", routing: "🧭", state: "🗂️",
    ssr: "🖥️", i18n: "🌍", a11y: "♿", build: "🔨", hooks: "🪝",
    context: "🔗", react19: "⚛️", internals: "🔬", nextjs: "▲",
    javascript: "🟨", types: "🏷️", config: "⚙️", bundling: "📦", browser: "🌐",
    "two-pointers": "👉", "sliding-window": "🪟", searching: "🔎", sorting: "🔤",
    "linked-list": "⛓️", trees: "🌳", graphs: "🕸️", dp: "🧮", complexity: "📈",
    "data-structures": "🏗️", practice: "✍️", recursion: "🔄", backtracking: "↩️",
    bits: "🔢", checklist: "☑️", strings: "🔤",
    behavioural: "💬", opening: "👋", closing: "🤝", classic: "⭐",
    negotiation: "🤝", sensitive: "⚠️", motivation: "🔥", onboarding: "🚪",
    conflict: "⚔️", technical: "🛠️", evaluation: "🔍", framework: "📐",
    production: "🏭", performance: "⚡", debugging: "🐞", review: "👀",
    "best-practice": "⭐", modern: "✨", "modern-java": "✨", java21: "☕",
    "anti-patterns": "🚫", "trade-offs": "⚖️", immutability: "🧊",
    "change-detection": "🔄", graalvm: "🚀", tooling: "🧰", extension: "🔌",
    java9: "☕", modules: "📦", java8: "☕", advanced: "🎓", spring: "🍃",
    container: "📦", experience: "💼", judgement: "🧭", refactoring: "🔧",
    mobile: "📱", operations: "🛠️", capacity: "📏", set: "🔵", list: "📋",
    map: "🗺️", queue: "🚶", hashmap: "🗺️", treemap: "🌲", iterator: "➡️",
    legacy: "🏚️", parallel: "🔀", volatile: "⚡", rendering: "🖼️", dml: "✏️",
    features: "🎁", ha: "🟢", "b-tree": "🌲", fundamentals: "📘", modelling: "📐",
    "code-review": "👀", enterprise: "🏢", mnc: "🏢", scenario: "🎬",
    /* coding & algorithms corner */
    warmup: "✍️", "pattern-printing": "🔺", math: "➗", "in-place": "🔃",
    "prefix-sum": "➕", kadane: "📈", matrix: "🔲", hashing: "#️⃣",
    "fast-slow": "🐢", "cycle-detection": "🔁", stack: "🥞", monotonic: "📉",
    heap: "⛰️", "priority-queue": "⛰️", bst: "🌲", traversal: "🚶", lca: "🌿",
    bfs: "🌊", dfs: "🕳️", "topological-sort": "🔢", "union-find": "🔗",
    "shortest-path": "🛣️", grid: "🗺️", knapsack: "🎒", lis: "📈", lcs: "🔤",
    "edit-distance": "✏️", greedy: "🎯", intervals: "📏", "top-k": "🏆",
    "binary-search": "🎯", "divide-conquer": "✂️", "bit-manipulation": "🔟",
    "string-matching": "🔎", "linked-list-design": "⛓️", "space-optimisation": "🗜️",
    "problem-solving": "🧠", "must-know": "⭐", "interview-favourite": "🔥",
    /* java release features */
    versions: "🏷️", lts: "🛡️", "release-cadence": "📅", java10: "☕", java11: "☕",
    java17: "☕", java25: "☕", preview: "🧪", upgrade: "⬆️", syntax: "✍️"
  };

  function iconFor(q) {
    if (q.icon) return q.icon;
    var tags = q.tags || [];
    for (var i = 0; i < tags.length; i++) {
      if (TAG_ICONS[tags[i]]) return TAG_ICONS[tags[i]];
    }
    return q.level === "advanced" ? "🎓" : "📘";
  }

  var SIZES = [
    { id: "s",  name: "Small",   scale: "93.75%" },
    { id: "m",  name: "Default", scale: "100%" },
    { id: "l",  name: "Large",   scale: "106.25%" },
    { id: "xl", name: "X-Large", scale: "112.5%" }
  ];

  var view = document.getElementById("view");
  var navTree = document.getElementById("navTree");
  var searchInput = document.getElementById("globalSearch");
  var searchBox = document.getElementById("searchResults");
  var sidebar = document.getElementById("sidebar");
  var scrim = document.getElementById("scrim");

  var state = {
    view: "home",          // home | topic | company | companies | notfound
    topic: null,
    company: null,         // company slug when view === "company"
    sheet: null,           // topic id when view === "cheatsheet"
    level: "all",
    filter: "",
    firm: "",
    hotOnly: false,
    done: load(LS_DONE, {})
  };
  var loading = {};

  /* ---------------- storage helpers ---------------- */
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }

  /* ---------------- theme ---------------- */
  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem(LS_THEME); } catch (e) {}
    if (!stored) {
      stored = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", stored);
  }
  initTheme();
  document.getElementById("themeToggle").addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(LS_THEME, next); } catch (e) {}
  });

  /* ---------------- typography ---------------- */
  var fontLinks = {};
  function loadFontFace(font) {
    if (!font.google || fontLinks[font.id]) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" + font.google + "&display=swap";
    document.head.appendChild(link);
    fontLinks[font.id] = true;
  }

  function fontById(id) {
    for (var i = 0; i < FONTS.length; i++) if (FONTS[i].id === id) return FONTS[i];
    return FONTS[0];
  }

  function applyFont(id, persist) {
    var font = fontById(id);
    loadFontFace(font);
    document.documentElement.style.setProperty("--sans", font.stack);
    document.documentElement.setAttribute("data-font", font.id);
    if (persist !== false) { try { localStorage.setItem(LS_FONT, font.id); } catch (e) {} }
    var label = document.getElementById("fontName");
    if (label) label.textContent = font.name;
    document.querySelectorAll(".font-item").forEach(function (b) {
      b.classList.toggle("on", b.dataset.font === font.id);
    });
  }

  function applySize(id, persist) {
    var size = SIZES.filter(function (s) { return s.id === id; })[0] || SIZES[1];
    document.documentElement.style.fontSize = size.scale;
    if (persist !== false) { try { localStorage.setItem(LS_SIZE, size.id); } catch (e) {} }
    document.querySelectorAll(".size-item").forEach(function (b) {
      b.classList.toggle("on", b.dataset.size === size.id);
    });
  }

  function buildTypePanel() {
    var panel = document.getElementById("fontPanel");
    panel.innerHTML =
      '<div class="fp-grab" id="fpGrab" aria-hidden="true"></div>' +
      '<div class="tp-head">Text size</div>' +
      '<div class="size-row">' +
        SIZES.map(function (s) {
          return '<button class="size-item" data-size="' + s.id + '">' + s.name + "</button>";
        }).join("") +
      "</div>" +
      '<div class="tp-head">Typeface <span class="tp-count">' + FONTS.length + "</span></div>" +
      '<div class="font-list">' +
        FONT_CATS.map(function (cat) {
          var rows = FONTS.filter(function (f) { return f.cat === cat.id; }).map(function (f) {
            return '<button class="font-item" data-font="' + f.id + '" style="font-family:' + f.stack + '">' +
              '<span class="fi-name">' + esc(f.name) + "</span>" +
              '<span class="fi-note">' + esc(f.note) + "</span>" +
              '<span class="fi-sample">Aa Bb 123</span>' +
            "</button>";
          }).join("");
          return rows ? '<div class="fp-cat">' + esc(cat.name) + "</div>" + rows : "";
        }).join("") +
      "</div>";

    panel.querySelectorAll(".font-item").forEach(function (b) {
      /* Fetch the webfont on hover so the preview and the click feel instant. */
      b.addEventListener("pointerenter", function () { loadFontFace(fontById(b.dataset.font)); }, { passive: true });
      b.addEventListener("click", function () { applyFont(b.dataset.font); });
    });
    panel.querySelectorAll(".size-item").forEach(function (b) {
      b.addEventListener("click", function () { applySize(b.dataset.size); });
    });
    var grab = document.getElementById("fpGrab");
    if (grab) grab.addEventListener("click", function () { setFontPanel(false); });
  }

  function initTypography() {
    var storedFont = null, storedSize = null;
    try {
      storedFont = localStorage.getItem(LS_FONT);
      storedSize = localStorage.getItem(LS_SIZE);
    } catch (e) {}
    buildTypePanel();
    applyFont(storedFont || "inter", false);
    applySize(storedSize || "m", false);
  }

  var fontBtn = document.getElementById("fontToggle");
  var fontPanel = document.getElementById("fontPanel");
  var fontScrim = document.getElementById("fontScrim");

  /* Below this width the panel is a bottom sheet rather than a dropdown, so it
     gets a backdrop and locks the page behind it. Matches the CSS breakpoint. */
  var sheetMode = window.matchMedia
    ? window.matchMedia("(max-width: 640px)")
    : { matches: false };

  function setFontPanel(open) {
    if (open) fontPanel.removeAttribute("hidden");
    else fontPanel.setAttribute("hidden", "");

    var asSheet = open && sheetMode.matches;
    if (fontScrim) {
      if (asSheet) fontScrim.removeAttribute("hidden");
      else fontScrim.setAttribute("hidden", "");
    }
    document.body.classList.toggle("no-scroll", asSheet);
    fontBtn.setAttribute("aria-expanded", String(open));
  }

  fontBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    setFontPanel(fontPanel.hasAttribute("hidden"));
  });
  if (fontScrim) fontScrim.addEventListener("click", function () { setFontPanel(false); });

  /* The panel is a child of <body> now (see index.html), so the outside-click
     test has to allow the panel itself as well as the button. */
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".type-wrap") && !e.target.closest(".font-panel")) {
      setFontPanel(false);
    }
  });

  /* ---------------- utils ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function stripTags(html) { return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " "); }

  /* Plain-text version of an answer, computed once and cached on the question
     object. Re-stripping every answer on each keystroke is otherwise wasteful. */
  function plainAnswer(q) {
    if (q._text === undefined) q._text = stripTags(q.a).toLowerCase();
    return q._text;
  }
  function highlight(text, term) {
    if (!term) return esc(text);
    var re = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return esc(text).replace(re, "<mark>$1</mark>");
  }
  function qKey(topicId, i) { return topicId + ":" + i; }

  /* ---------------- company index ----------------
     Every question already records the companies known to ask it. Walking
     GROUPS (rather than TOPIC_DATA) means each company's questions come out
     in the same order as the sidebar, so the page reads top-to-bottom in a
     sensible sequence with no extra sorting. */
  function slugify(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  var companyIndex = null;
  function buildCompanyIndex() {
    if (companyIndex) return companyIndex;
    var idx = {};
    window.GROUPS.forEach(function (g) {
      g.topics.forEach(function (t) {
        (window.TOPIC_DATA[t.id] || []).forEach(function (q, i) {
          (q.companies || []).forEach(function (c) {
            var s = slugify(c);
            if (!s) return;
            if (!idx[s]) idx[s] = { slug: s, name: c, rows: [], byTopic: {} };
            idx[s].rows.push({ tid: t.id, idx: i, q: q });
            idx[s].byTopic[t.id] = (idx[s].byTopic[t.id] || 0) + 1;
          });
        });
      });
    });
    companyIndex = idx;
    return idx;
  }
  function allCompanies() {
    var idx = buildCompanyIndex();
    return Object.keys(idx).map(function (k) { return idx[k]; })
      .sort(function (a, b) {
        return b.rows.length - a.rows.length || a.name.localeCompare(b.name);
      });
  }

  /* ---------------- lazy topic loading ---------------- */
  var loaded = {};

  function loadScript(src, done) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;          // preserve execution order across parts
    s.onload = function () { done(true); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }

  /* A topic's content is split across one or more part files, so new
     questions arrive in a new file instead of an edit to an existing one.
     Parts must execute in order, hence the sequential chain. */
  function ensureTopic(id, cb) {
    if (loaded[id]) return cb(window.TOPIC_DATA[id] || []);
    if (loading[id]) { loading[id].push(cb); return; }
    loading[id] = [cb];

    var meta = window.TOPIC_MAP[id] || {};
    var total = meta.parts || 1;

    function next(part) {
      if (part > total) {
        loaded[id] = true;
        var data = window.TOPIC_DATA[id] || [];
        var waiting = loading[id] || [];
        delete loading[id];
        waiting.forEach(function (fn) { fn(data); });
        return;
      }
      var suffix = part === 1 ? "" : "-" + part;
      loadScript("js/data/" + id + suffix + ".js", function () { next(part + 1); });
    }
    next(1);
  }
  function loadAll(cb) {
    var ids = Object.keys(window.TOPIC_MAP), pending = ids.length;
    if (!pending) return cb();
    ids.forEach(function (id) {
      ensureTopic(id, function () { if (--pending === 0) cb(); });
    });
  }

  /* ---------------- sidebar ---------------- */
  function buildNav() {
    var open = load(LS_OPEN, null);
    var html = window.GROUPS.map(function (g) {
      var isOpen = open ? open.indexOf(g.id) !== -1 : true;
      var links = g.topics.map(function (t) {
        return '<a class="nav-link" data-topic="' + t.id + '" href="#/topic/' + t.id + '">' +
          '<span class="ic">' + t.icon + "</span><span>" + esc(t.name) + "</span>" +
          '<span class="n" data-count="' + t.id + '"></span></a>';
      }).join("");
      return '<div class="nav-group' + (isOpen ? " open" : "") + '" data-group="' + g.id + '">' +
        '<button class="nav-group-btn"><span>' + g.icon + "</span><span>" + esc(g.name) + "</span>" +
        '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>' +
        '<div class="nav-group-body"><div>' + links + "</div></div></div>";
    }).join("");
    navTree.innerHTML =
      '<a class="nav-special" id="navSheets" href="#/cheatsheets">' +
        '<span class="ic">⚡</span><span>Cheatsheets</span>' +
      "</a>" +
      '<a class="nav-special" id="navCompanies" href="#/companies">' +
        '<span class="ic">🏢</span><span>Prepare by company</span>' +
      "</a>" + html;

    navTree.querySelectorAll(".nav-group-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.parentElement.classList.toggle("open");
        save(LS_OPEN, Array.prototype.map.call(
          navTree.querySelectorAll(".nav-group.open"), function (el) { return el.dataset.group; }
        ));
      });
    });
    navTree.addEventListener("click", function (e) {
      if (e.target.closest(".nav-link")) closeSidebar();
    });
  }

  function markActive() {
    navTree.querySelectorAll(".nav-link").forEach(function (a) {
      var on = a.dataset.topic === state.topic;
      a.classList.toggle("active", on);
      if (on) a.closest(".nav-group").classList.add("open");
    });
    var companies = document.getElementById("navCompanies");
    if (companies) {
      companies.classList.toggle("active", state.view === "company" || state.view === "companies");
    }
    var sheets = document.getElementById("navSheets");
    if (sheets) {
      sheets.classList.toggle("active", state.view === "cheatsheet" || state.view === "cheatsheets");
    }
  }

  function paintCounts() {
    var total = 0;
    Object.keys(window.TOPIC_MAP).forEach(function (id) {
      var n = (window.TOPIC_DATA[id] || []).length;
      total += n;
      document.querySelectorAll('[data-count="' + id + '"]').forEach(function (el) {
        el.textContent = n || "";
      });
    });
    document.getElementById("totalCount").textContent = total ? total + " Qs" : "…";
  }

  function openSidebar() { sidebar.classList.add("open"); scrim.classList.add("on"); document.body.classList.add("no-scroll"); }
  function closeSidebar() { sidebar.classList.remove("open"); scrim.classList.remove("on"); document.body.classList.remove("no-scroll"); }
  document.getElementById("menuToggle").addEventListener("click", function () {
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
  });
  scrim.addEventListener("click", closeSidebar);

  /* ---------------- home ---------------- */
  function renderHome() {
    var totalQ = 0, totalDone = 0;
    Object.keys(window.TOPIC_MAP).forEach(function (id) {
      var qs = window.TOPIC_DATA[id] || [];
      totalQ += qs.length;
      qs.forEach(function (_, i) { if (state.done[qKey(id, i)]) totalDone++; });
    });

    var groupsHtml = window.GROUPS.map(function (g) {
      var cards = g.topics.map(function (t, i) {
        var qs = window.TOPIC_DATA[t.id] || [];
        var beg = qs.filter(function (q) { return q.level === "beginner"; }).length;
        var adv = qs.length - beg;
        var done = qs.reduce(function (a, _, idx) { return a + (state.done[qKey(t.id, idx)] ? 1 : 0); }, 0);
        var pct = qs.length ? Math.round((done / qs.length) * 100) : 0;
        return '<a class="tcard" href="#/topic/' + t.id + '" style="animation-delay:' + (i * 40) + 'ms">' +
          '<span class="ic">' + t.icon + "</span>" +
          "<h3>" + esc(t.name) + "</h3>" +
          "<p>" + esc(t.blurb) + "</p>" +
          '<div class="foot"><span class="dot"></span>' + qs.length + " questions &nbsp;·&nbsp; " +
          beg + " beginner · " + adv + " advanced</div>" +
          '<div class="prog-track"><div class="prog-fill" style="width:' + pct + '%"></div></div>' +
          "</a>";
      }).join("");
      return '<h2 class="sec-title">' + g.icon + " " + esc(g.name) + "</h2>" +
        '<div class="card-grid">' + cards + "</div>";
    }).join("");

    view.innerHTML =
      '<section class="hero">' +
        "<h1>Walk in <span>confident</span>.<br/>Revise everything that actually gets asked.</h1>" +
        "<p>A focused, last-minute revision hub for the stack I work with every day — Java, Spring Boot, " +
        "Microservices, Kafka, SQL, Docker, Kubernetes and the frontend. Every topic ships a " +
        "<strong>Beginner</strong> and an <strong>Advanced</strong> track, real answers, code you can quote, " +
        "and diagrams for the concepts that are easier to draw than to say.</p>" +
        '<div class="hero-stats">' +
          '<div class="hstat"><b>' + totalQ + "</b><span>Questions</span></div>" +
          '<div class="hstat"><b>' + Object.keys(window.TOPIC_MAP).length + "</b><span>Tech stacks</span></div>" +
          '<div class="hstat"><b>2</b><span>Difficulty tracks</span></div>' +
          '<div class="hstat"><b>' + totalDone + "</b><span>Marked revised</span></div>" +
        "</div>" +
      "</section>" + sheetStrip() + companyStrip() + groupsHtml;
  }

  /* Shortcut into the cheatsheets, coloured per stack. */
  function sheetStrip() {
    var theme = window.TOPIC_THEME;
    var picks = ["java-basics", "spring-boot", "sql", "kubernetes", "coding-dp", "react", "dsa"];
    return '<h2 class="sec-title">⚡ Cheatsheets</h2>' +
      '<p class="sec-note">One condensed screen per stack — tables, syntax and rules for the last fifteen minutes.</p>' +
      '<div class="chip-row">' +
        picks.map(function (id) {
          var t = window.TOPIC_MAP[id];
          if (!t) return "";
          return '<a class="co-chip cs-chip" href="#/cheatsheet/' + id + '"' +
            ' style="--tint:' + (theme ? theme.accent(id) : "#4f46e5") + '">' +
            t.icon + " " + esc(t.name) + "</a>";
        }).join("") +
        '<a class="co-chip co-all" href="#/cheatsheets">All cheatsheets →</a>' +
      "</div>";
  }

  /* Shortcut into the company pages. Only rendered once every part file has
     landed, since the counts would otherwise be wrong; the idle warm-up
     re-renders home shortly after boot, which fills it in. */
  function companyStrip() {
    if (!searchReady) return "";
    var top = allCompanies().slice(0, 14);
    if (!top.length) return "";
    return '<h2 class="sec-title">🏢 Prepare by company</h2>' +
      '<p class="sec-note">Every question recorded as asked at a company, pulled together across all topics.</p>' +
      '<div class="chip-row">' +
        top.map(function (c) {
          return '<a class="co-chip" href="#/company/' + c.slug + '">' +
            esc(c.name) + '<span class="co-n">' + c.rows.length + "</span></a>";
        }).join("") +
        '<a class="co-chip co-all" href="#/companies">View all →</a>' +
      "</div>";
  }

  /* ---------------- topic page ---------------- */
  /* A solid, technology-themed band at the top of a topic. The motif is drawn
     large inside the band rather than behind the page text, so the page keeps
     its contrast while the stack is still recognisable at a glance. */
  function topicBanner(id, meta) {
    var theme = window.TOPIC_THEME;
    var motif = theme ? theme.motif(id, "banner-motif") : "";
    return '<header class="topic-banner" data-topic="' + id + '">' +
        '<div class="tb-art" aria-hidden="true">' + motif + "</div>" +
        '<div class="tb-copy">' +
          '<h1><span class="tb-icon">' + meta.icon + "</span>" + esc(meta.name) + "</h1>" +
          '<p class="blurb">' + esc(meta.blurb) + "</p>" +
          '<a class="tb-sheet" href="#/cheatsheet/' + id + '">⚡ Open cheatsheet</a>' +
        "</div>" +
      "</header>";
  }

  /* Sets --accent for the current view so cards, badges and rules pick up the
     technology's colour without every rule needing a per-topic override. */
  function applyTheme(id) {
    var theme = window.TOPIC_THEME;
    if (!theme) return;
    if (id && theme.has(id)) {
      view.style.setProperty("--accent", theme.accent(id));
      view.style.setProperty("--accent-soft", hexToSoft(theme.accent(id)));
      view.setAttribute("data-themed", id);
    } else {
      view.style.removeProperty("--accent");
      view.style.removeProperty("--accent-soft");
      view.removeAttribute("data-themed");
    }
  }
  function hexToSoft(hex) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + ",.14)";
  }

  function renderTopic(id) {
    var meta = window.TOPIC_MAP[id];
    if (!meta) return renderNotFound();

    view.innerHTML = '<div class="loading"><div class="spinner"></div>Loading ' + esc(meta.name) + " questions…</div>";
    ensureTopic(id, function (qs) {
      if (state.topic !== id) return;
      paintCounts();

      var head =
        '<div class="crumbs"><a href="#/">Home</a> &nbsp;›&nbsp; ' + esc(meta.group) + " &nbsp;›&nbsp; " + esc(meta.name) + "</div>" +
        topicBanner(id, meta) +
        '<div class="toolbar">' +
          '<div class="seg" id="levelSeg">' +
            '<button data-level="all">All</button>' +
            '<button data-level="beginner">Beginner</button>' +
            '<button data-level="advanced">Advanced</button>' +
          "</div>" +
          '<input class="filter-in" id="topicFilter" placeholder="🔍 Filter within ' + esc(meta.name) + '…" />' +
          firmSelect(qs) +
          '<button class="tool-btn" id="expandAll">⤢ Expand all</button>' +
          '<button class="tool-btn" id="collapseAll">⤡ Collapse all</button>' +
          '<span class="count-tag" id="countTag"></span>' +
        "</div>" +
        '<div class="qlist" id="qlist"></div>';
      view.innerHTML = head;

      var seg = document.getElementById("levelSeg");
      seg.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b.dataset.level === state.level);
        b.addEventListener("click", function () {
          state.level = b.dataset.level;
          seg.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
          paintList(id, qs);
        });
      });
      var filterIn = document.getElementById("topicFilter");
      filterIn.value = state.filter;
      filterIn.addEventListener("input", function () {
        state.filter = filterIn.value.trim();
        paintList(id, qs);
      });
      var firmIn = document.getElementById("firmFilter");
      if (firmIn) {
        firmIn.value = state.firm;
        /* The remembered company may not appear in this topic at all. The
           select would silently fall back to "All" while the filter kept
           hiding everything, so drop it instead. */
        if (firmIn.value !== state.firm) state.firm = "";
        firmIn.addEventListener("change", function () {
          state.firm = firmIn.value;
          paintList(id, qs);
        });
      }
      document.getElementById("expandAll").addEventListener("click", function () { setAllOpen(true); });
      document.getElementById("collapseAll").addEventListener("click", function () { setAllOpen(false); });

      paintList(id, qs);
    });
  }

  /* Every company mentioned in this topic, for the toolbar dropdown. */
  function firmSelect(qs) {
    var seen = {};
    qs.forEach(function (q) { (q.companies || []).forEach(function (c) { seen[c] = 1; }); });
    var names = Object.keys(seen).sort();
    if (!names.length) return "";
    return '<select class="firm-select" id="firmFilter" aria-label="Filter by company">' +
      '<option value="">🏢 All companies</option>' +
      names.map(function (c) {
        return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
      }).join("") + "</select>";
  }

  /* One card renderer shared by the topic and company views, so progress,
     numbering and the id scheme stay identical between them. `n` is the
     position within the rendered list; `tid`/`qi` identify the question. */
  function cardHtml(tid, qi, q, n, term) {
    var key = qKey(tid, qi);
    var done = !!state.done[key];
    var badges = "";
    if (q.hot) badges += '<span class="badge hot">Most asked</span>';
    badges += '<span class="badge ' + (q.level === "beginner" ? "beg\">Beginner" : "adv\">Advanced") + "</span>";
    var chips = (q.tags || []).map(function (t) { return '<span class="chip">#' + esc(t) + "</span>"; }).join("");
    /* Companies known to ask this question — each links to its prep page. */
    var firms = (q.companies || []).map(function (c) {
      return '<a class="firm" href="#/company/' + slugify(c) + '">' + esc(c) + "</a>";
    }).join("");
    var firmRow = firms
      ? '<div class="qfirms"><span class="qfirms-label">Asked at</span>' + firms + "</div>"
      : "";
    return '<article class="qcard" data-key="' + key + '" id="q-' + tid + "-" + qi + '" style="animation-delay:' + Math.min(n * 18, 400) + 'ms">' +
      '<button class="qhead" aria-expanded="false">' +
        '<span class="qnum">' + (n + 1) + "</span>" +
        '<span class="qicon" aria-hidden="true">' + iconFor(q) + "</span>" +
        '<span class="qtext">' + highlight(q.q, term) + "</span>" +
        '<span class="qbadges">' + badges + "</span>" +
        '<svg class="qchev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>' +
      "</button>" +
      '<div class="qbody"><div class="qbody-inner">' +
        '<div class="answer">' + q.a + firmRow + "</div>" +
        '<div class="qfoot">' + chips +
          '<button class="mark-btn' + (done ? " done" : "") + '" data-key="' + key + '">' +
          (done ? "✓ Revised" : "Mark as revised") + "</button>" +
        "</div>" +
      "</div></div></article>";
  }

  /* Adds a copy button to every code block under `root`. Uses the async
     clipboard API where available and falls back to a hidden textarea, since
     the modern API needs a secure context. */
  function wireCopyButtons(root) {
    root.querySelectorAll("pre").forEach(function (pre) {
      if (pre.querySelector(".copy-btn")) return;
      var code = pre.querySelector("code");
      if (!code) return;
      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        copyText(code.textContent, function (okFlag) {
          btn.textContent = okFlag ? "Copied" : "Failed";
          btn.classList.toggle("done", okFlag);
          setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1400);
        });
      });
      pre.appendChild(btn);
    });
  }

  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var okFlag = document.execCommand("copy");
      document.body.removeChild(ta);
      done(okFlag);
    } catch (e) { done(false); }
  }

  function wireCards(root) {
    root.querySelectorAll(".qhead").forEach(function (h) {
      h.addEventListener("click", function () {
        var open = h.parentElement.classList.toggle("open");
        h.setAttribute("aria-expanded", String(open));
      });
    });
    root.querySelectorAll(".mark-btn").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var key = b.dataset.key;
        if (state.done[key]) { delete state.done[key]; b.classList.remove("done"); b.textContent = "Mark as revised"; }
        else { state.done[key] = 1; b.classList.add("done"); b.textContent = "✓ Revised"; }
        save(LS_DONE, state.done);
      });
    });
  }

  var EMPTY_FILTER = '<div class="empty"><h3>Nothing matches that filter</h3><p>Try another keyword or switch the difficulty track.</p></div>';

  function paintList(id, qs) {
    var list = document.getElementById("qlist");
    if (!list) return;
    var term = state.filter.toLowerCase();
    var rows = [];
    qs.forEach(function (q, idx) {
      if (state.level !== "all" && q.level !== state.level) return;
      if (state.firm && (q.companies || []).indexOf(state.firm) === -1) return;
      if (term) {
        var hay = q.q.toLowerCase() + " " + plainAnswer(q) + " " +
                  (q.tags || []).join(" ") + " " + (q.companies || []).join(" ").toLowerCase();
        if (hay.indexOf(term) === -1) return;
      }
      rows.push({ q: q, idx: idx });
    });

    document.getElementById("countTag").textContent =
      rows.length + " of " + qs.length + " shown";

    if (!rows.length) { list.innerHTML = EMPTY_FILTER; return; }

    list.innerHTML = rows.map(function (r, n) {
      return cardHtml(id, r.idx, r.q, n, state.filter);
    }).join("");
    wireCards(list);
    wireCopyButtons(list);
  }

  /* ---------------- cheatsheets ----------------
     Condensed recall, one screen per topic. Bundles are fetched on demand so
     the questions and the sheets never load each other's weight. */
  var sheetBundles = {};
  function ensureSheet(id, cb) {
    var bundle = (window.SHEET_BUNDLES || []).filter(function (b) {
      return b.topics.indexOf(id) !== -1;
    })[0];
    if (!bundle) return cb(null);
    if (window.SHEETS[id]) return cb(window.SHEETS[id]);
    if (sheetBundles[bundle.file] === "loading") {
      document.addEventListener("sheet:loaded", function again() {
        if (window.SHEETS[id]) { document.removeEventListener("sheet:loaded", again); cb(window.SHEETS[id]); }
      });
      return;
    }
    sheetBundles[bundle.file] = "loading";
    loadScript("js/data/" + bundle.file, function () {
      sheetBundles[bundle.file] = "done";
      document.dispatchEvent(new CustomEvent("sheet:loaded"));
      cb(window.SHEETS[id] || null);
    });
  }

  function sheetSectionHtml(sec) {
    var body = "";
    if (sec.t === "table") {
      body = "<table><tr>" + (sec.rows[0] || []).map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr>" +
        sec.rows.slice(1).map(function (r) {
          return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
        }).join("") + "</table>";
    } else if (sec.t === "list") {
      body = "<ul>" + sec.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>";
    } else if (sec.t === "code") {
      body = '<pre data-lang="' + esc(sec.lang || "") + '"><code>' + esc(sec.code) + "</code></pre>";
    } else if (sec.t === "quote") {
      body = '<blockquote class="cs-quote">' + sec.text + "</blockquote>";
    }
    return '<section class="cs-card"><h2>' + esc(sec.h) + "</h2>" + body + "</section>";
  }

  function renderCheatsheet(id) {
    var meta = window.TOPIC_MAP[id];
    if (!meta) return renderNotFound();
    view.innerHTML = '<div class="loading"><div class="spinner"></div>Loading the ' + esc(meta.name) + " cheatsheet…</div>";

    ensureSheet(id, function (sections) {
      if (state.sheet !== id) return;
      if (!sections) return renderNotFound();
      paintCounts();
      var theme = window.TOPIC_THEME;

      view.innerHTML =
        '<div class="crumbs"><a href="#/">Home</a> &nbsp;›&nbsp; <a href="#/cheatsheets">Cheatsheets</a>' +
        " &nbsp;›&nbsp; " + esc(meta.name) + "</div>" +
        '<header class="topic-banner cs-banner">' +
          '<div class="tb-art" aria-hidden="true">' + (theme ? theme.motif(id, "banner-motif") : "") + "</div>" +
          '<div class="tb-copy">' +
            '<span class="cs-kicker">Cheatsheet</span>' +
            "<h1><span class=\"tb-icon\">" + meta.icon + "</span>" + esc(meta.name) + "</h1>" +
            '<p class="blurb">Everything worth glancing at in the last fifteen minutes.</p>' +
            '<a class="tb-sheet" href="#/topic/' + id + '">← Back to the questions</a>' +
          "</div>" +
        "</header>" +
        '<div class="cs-grid">' + sections.map(sheetSectionHtml).join("") + "</div>" +
        sheetNav(id);
      wireCopyButtons(view);
    });
  }

  /* Previous / next within the sidebar order, so a sheet reads like a book. */
  function sheetNav(id) {
    var ids = [];
    window.GROUPS.forEach(function (g) { g.topics.forEach(function (t) { ids.push(t); }); });
    var i = ids.map(function (t) { return t.id; }).indexOf(id);
    var prev = i > 0 ? ids[i - 1] : null, next = i < ids.length - 1 ? ids[i + 1] : null;
    return '<nav class="cs-nav">' +
      (prev ? '<a href="#/cheatsheet/' + prev.id + '">← ' + prev.icon + " " + esc(prev.name) + "</a>" : "<span></span>") +
      (next ? '<a href="#/cheatsheet/' + next.id + '">' + next.icon + " " + esc(next.name) + " →</a>" : "<span></span>") +
      "</nav>";
  }

  function renderCheatsheetIndex() {
    paintCounts();
    var theme = window.TOPIC_THEME;
    var groups = window.GROUPS.map(function (g) {
      return '<h2 class="sec-title">' + g.icon + " " + esc(g.name) + "</h2>" +
        '<div class="card-grid">' + g.topics.map(function (t, i) {
          return '<a class="tcard cs-tile" href="#/cheatsheet/' + t.id + '"' +
              ' style="--tint:' + (theme ? theme.accent(t.id) : "#4f46e5") + ";animation-delay:" + Math.min(i * 26, 320) + 'ms">' +
            '<span class="cs-tile-art" aria-hidden="true">' + (theme ? theme.motif(t.id, "tile-motif") : "") + "</span>" +
            "<h3>" + t.icon + " " + esc(t.name) + "</h3>" +
            '<p class="tc-blurb">' + esc(t.blurb) + "</p>" +
            '<span class="tc-go">Open cheatsheet →</span>' +
          "</a>";
        }).join("") + "</div>";
    }).join("");

    view.innerHTML =
      '<div class="crumbs"><a href="#/">Home</a> &nbsp;›&nbsp; Cheatsheets</div>' +
      '<section class="hero cs-hero"><h1>⚡ Cheatsheets</h1>' +
      "<p>One condensed screen per stack — the tables, syntax and rules worth glancing at " +
      "on the way in. Every topic has one.</p></section>" + groups;
  }

  /* ---------------- company directory ---------------- */
  function renderCompanies() {
    view.innerHTML = '<div class="loading"><div class="spinner"></div>Indexing every question by company…</div>';
    /* The index needs every topic, so make sure the parts have all landed. */
    loadAll(function () {
      if (state.view !== "companies") return;
      paintCounts();
      var companies = allCompanies();

      view.innerHTML =
        '<div class="crumbs"><a href="#/">Home</a> &nbsp;›&nbsp; Companies</div>' +
        '<div class="topic-head"><h1><span>🏢</span>Prepare by company</h1>' +
        '<p class="blurb">Every question recorded as asked at a company, pulled together from all ' +
        Object.keys(window.TOPIC_MAP).length + ' topics. Pick the one you are interviewing at.</p></div>' +
        '<div class="toolbar">' +
          '<input class="filter-in" id="companyFilter" placeholder="🔍 Find a company…" />' +
          '<span class="count-tag" id="countTag">' + companies.length + " companies</span>" +
        "</div>" +
        '<div class="company-grid" id="companyGrid"></div>';

      var grid = document.getElementById("companyGrid");
      function paintGrid(term) {
        var low = (term || "").trim().toLowerCase();
        var shown = companies.filter(function (c) {
          return !low || c.name.toLowerCase().indexOf(low) !== -1;
        });
        document.getElementById("countTag").textContent =
          shown.length + (low ? " of " + companies.length : "") + " companies";
        if (!shown.length) {
          grid.innerHTML = '<div class="empty"><h3>No company matches that</h3></div>';
          return;
        }
        grid.innerHTML = shown.map(function (c, i) {
          /* The three topics this company is most associated with. */
          var top = Object.keys(c.byTopic)
            .sort(function (a, b) { return c.byTopic[b] - c.byTopic[a]; })
            .slice(0, 3)
            .map(function (tid) {
              var t = window.TOPIC_MAP[tid];
              return t ? t.icon + " " + esc(t.name) : "";
            }).join(" · ");
          var hot = c.rows.filter(function (r) { return r.q.hot; }).length;
          return '<a class="ccard" href="#/company/' + c.slug + '" style="animation-delay:' + Math.min(i * 18, 400) + 'ms">' +
            '<span class="cc-name">' + esc(c.name) + "</span>" +
            '<span class="cc-count">' + c.rows.length + " questions &nbsp;·&nbsp; " + hot + " most asked</span>" +
            '<span class="cc-topics">' + top + "</span>" +
          "</a>";
        }).join("");
      }
      paintGrid("");

      var filterIn = document.getElementById("companyFilter");
      filterIn.addEventListener("input", function () {
        paintGrid(filterIn.value);
        measure();
      });
    });
  }

  /* ---------------- one company's prep page ---------------- */
  function renderCompany(slug) {
    view.innerHTML = '<div class="loading"><div class="spinner"></div>Gathering every question…</div>';
    loadAll(function () {
      if (state.company !== slug) return;
      var entry = buildCompanyIndex()[slug];
      if (!entry) return renderNotFound();
      paintCounts();

      var topicCount = Object.keys(entry.byTopic).length;
      var hotCount = entry.rows.filter(function (r) { return r.q.hot; }).length;

      view.innerHTML =
        '<div class="crumbs"><a href="#/">Home</a> &nbsp;›&nbsp; <a href="#/companies">Companies</a>' +
        " &nbsp;›&nbsp; " + esc(entry.name) + "</div>" +
        '<div class="topic-head"><h1><span>🏢</span>' + esc(entry.name) + "</h1>" +
        '<p class="blurb">' + entry.rows.length + " questions recorded as asked at " + esc(entry.name) +
        ", spanning " + topicCount + " topics. Grouped in reading order — start at the top.</p></div>" +
        '<div class="toolbar">' +
          '<div class="seg" id="levelSeg">' +
            '<button data-level="all">All</button>' +
            '<button data-level="beginner">Beginner</button>' +
            '<button data-level="advanced">Advanced</button>' +
          "</div>" +
          '<input class="filter-in" id="topicFilter" placeholder="🔍 Filter these questions…" />' +
          '<button class="tool-btn hot-toggle" id="hotOnly">🔥 Most asked (' + hotCount + ")</button>" +
          '<button class="tool-btn" id="expandAll">⤢ Expand all</button>' +
          '<button class="tool-btn" id="collapseAll">⤡ Collapse all</button>' +
          '<span class="count-tag" id="countTag"></span>' +
        "</div>" +
        '<div class="qlist" id="qlist"></div>';

      var seg = document.getElementById("levelSeg");
      seg.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b.dataset.level === state.level);
        b.addEventListener("click", function () {
          state.level = b.dataset.level;
          seg.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
          paintCompanyList(entry);
        });
      });
      var filterIn = document.getElementById("topicFilter");
      filterIn.value = state.filter;
      filterIn.addEventListener("input", function () {
        state.filter = filterIn.value.trim();
        paintCompanyList(entry);
      });
      var hotBtn = document.getElementById("hotOnly");
      hotBtn.classList.toggle("on", state.hotOnly);
      hotBtn.addEventListener("click", function () {
        state.hotOnly = !state.hotOnly;
        hotBtn.classList.toggle("on", state.hotOnly);
        paintCompanyList(entry);
      });
      document.getElementById("expandAll").addEventListener("click", function () { setAllOpen(true); });
      document.getElementById("collapseAll").addEventListener("click", function () { setAllOpen(false); });

      paintCompanyList(entry);
    });
  }

  function paintCompanyList(entry) {
    var list = document.getElementById("qlist");
    if (!list) return;
    var term = state.filter.toLowerCase();

    var rows = entry.rows.filter(function (r) {
      var q = r.q;
      if (state.level !== "all" && q.level !== state.level) return false;
      if (state.hotOnly && !q.hot) return false;
      if (term) {
        var hay = q.q.toLowerCase() + " " + plainAnswer(q) + " " + (q.tags || []).join(" ");
        if (hay.indexOf(term) === -1) return false;
      }
      return true;
    });

    document.getElementById("countTag").textContent =
      rows.length + " of " + entry.rows.length + " shown";

    if (!rows.length) { list.innerHTML = EMPTY_FILTER; return; }

    /* Count per topic first, so the headings can show a total without
       rescanning the list for every group. */
    var perTopic = {};
    rows.forEach(function (r) { perTopic[r.tid] = (perTopic[r.tid] || 0) + 1; });

    var html = "", lastTid = null, n = 0;
    rows.forEach(function (r) {
      if (r.tid !== lastTid) {
        var t = window.TOPIC_MAP[r.tid];
        html += '<div class="qgroup-head">' +
          '<span class="ic">' + (t ? t.icon : "•") + "</span>" +
          '<a href="#/topic/' + r.tid + '">' + esc(t ? t.name : r.tid) + "</a>" +
          '<span class="qgroup-n">' + perTopic[r.tid] + "</span></div>";
        lastTid = r.tid;
      }
      html += cardHtml(r.tid, r.idx, r.q, n++, state.filter);
    });
    list.innerHTML = html;
    wireCards(list);
    wireCopyButtons(list);
  }

  /* Shared by the topic and company toolbars. */
  function setAllOpen(open) {
    view.querySelectorAll(".qcard").forEach(function (c) {
      c.classList.toggle("open", open);
      var h = c.querySelector(".qhead");
      if (h) h.setAttribute("aria-expanded", String(open));
    });
  }

  function renderNotFound() {
    view.innerHTML = '<div class="empty"><h3>That page does not exist</h3><p><a href="#/">Back to all topics</a></p></div>';
  }

  /* ---------------- global search ---------------- */
  var searchTimer, searchReady = false;
  function runSearch() {
    var term = searchInput.value.trim();
    if (term.length < 2) { searchBox.hidden = true; return; }
    if (!searchReady) {
      searchBox.hidden = false;
      searchBox.innerHTML = '<div class="sr-empty"><div class="spinner"></div>Indexing all questions…</div>';
      loadAll(function () { searchReady = true; paintCounts(); runSearch(); });
      return;
    }
    var low = term.toLowerCase(), hits = [];
    Object.keys(window.TOPIC_MAP).forEach(function (id) {
      (window.TOPIC_DATA[id] || []).forEach(function (q, idx) {
        var inQ = q.q.toLowerCase().indexOf(low);
        var inA = inQ === -1 ? plainAnswer(q).indexOf(low) : -1;
        if (inQ === -1 && inA === -1) return;
        hits.push({ id: id, idx: idx, q: q, score: inQ !== -1 ? inQ : 1000 + inA });
      });
    });
    hits.sort(function (a, b) { return a.score - b.score; });

    /* Typing a company name should offer its prep page, not just the
       questions that happen to mention it. */
    var companyHits = allCompanies().filter(function (c) {
      return c.name.toLowerCase().indexOf(low) !== -1;
    }).slice(0, 3);
    var companyHtml = companyHits.map(function (c) {
      return '<button class="sr-item sr-company" data-company="' + c.slug + '">' +
        '<span class="sr-q">🏢 Prepare for ' + highlight(c.name, term) + "</span>" +
        '<span class="sr-meta">' + c.rows.length + " questions across " +
        Object.keys(c.byTopic).length + " topics</span></button>";
    }).join("");

    if (!hits.length && !companyHits.length) {
      searchBox.innerHTML = '<div class="sr-empty">No question matches “' + esc(term) + '”.</div>';
      searchBox.hidden = false;
      return;
    }
    searchBox.innerHTML = companyHtml + hits.slice(0, 40).map(function (h) {
      var t = window.TOPIC_MAP[h.id];
      return '<button class="sr-item" data-id="' + h.id + '" data-idx="' + h.idx + '">' +
        '<span class="sr-q">' + highlight(h.q.q, term) + "</span>" +
        '<span class="sr-meta">' + t.icon + " " + esc(t.name) + " · " + h.q.level + "</span></button>";
    }).join("") + (hits.length > 40 ? '<div class="sr-empty">+ ' + (hits.length - 40) + " more — refine your search</div>" : "");
    searchBox.hidden = false;

    cursor = -1;
    searchBox.querySelectorAll(".sr-item").forEach(function (b) {
      b.addEventListener("click", function () { openHit(b); });
    });
  }

  /* Jump to one result: clear every filter that could hide the card, make sure
     the topic is actually rendered, then open and centre it. */
  function openHit(b) {
    searchBox.hidden = true;
    searchInput.value = "";
    searchInput.blur();

    /* A company result navigates to its prep page rather than to a card. */
    if (b.dataset.company) {
      location.hash = "#/company/" + b.dataset.company;
      return;
    }

    var tid = b.dataset.id, idx = +b.dataset.idx;
    state.level = "all"; state.filter = ""; state.firm = ""; state.hotOnly = false;

    var target = "#/topic/" + tid;
    if (location.hash === target) route();          // same topic: no hashchange fires
    else location.hash = target;

    var tries = 0;
    (function reveal() {
      var card = document.getElementById("q-" + tid + "-" + idx);
      if (!card) {
        if (tries++ < 40) return setTimeout(reveal, 40);   // wait for the part files
        return;
      }
      card.classList.add("open");
      var head = card.querySelector(".qhead");
      if (head) head.setAttribute("aria-expanded", "true");
      /* Cards use content-visibility, so the first scroll can land short while
         heights are still being resolved. Settle it on the next frame. */
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    })();
  }

  /* Arrow-key navigation over the result list. */
  var cursor = -1;
  function moveCursor(delta) {
    var items = searchBox.querySelectorAll(".sr-item");
    if (!items.length) return;
    if (cursor >= 0 && items[cursor]) items[cursor].classList.remove("active");
    cursor = (cursor + delta + items.length) % items.length;
    items[cursor].classList.add("active");
    items[cursor].scrollIntoView({ block: "nearest" });
  }

  searchInput.addEventListener("keydown", function (e) {
    if (searchBox.hidden) return;
    if (e.key === "ArrowDown") { e.preventDefault(); moveCursor(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
    else if (e.key === "Enter") {
      var items = searchBox.querySelectorAll(".sr-item");
      var pick = items[cursor >= 0 ? cursor : 0];
      if (pick) { e.preventDefault(); openHit(pick); }
    }
  });
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 140);
  });
  searchInput.addEventListener("focus", function () { if (searchInput.value.trim().length >= 2) runSearch(); });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-wrap")) searchBox.hidden = true;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== searchInput && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault(); searchInput.focus();
    }
    if (e.key === "Escape") {
      searchBox.hidden = true;
      searchInput.blur();
      closeSidebar();
      setFontPanel(false);
    }
  });

  /* ---------------- progress reset ---------------- */
  document.getElementById("resetProgress").addEventListener("click", function () {
    if (!confirm("Clear every “revised” mark?")) return;
    state.done = {};
    save(LS_DONE, {});
    route();
  });

  /* ---------------- scroll extras ---------------- */
  var toTop = document.getElementById("toTop");
  var bar = document.getElementById("scrollProgress");
  var scrollQueued = false, docHeight = 0, lastToTop = null;

  function measure() { docHeight = document.documentElement.scrollHeight - window.innerHeight; }

  /* Read layout once per frame instead of once per scroll event, and only
     touch the DOM when a value actually changes. */
  function onScrollFrame() {
    scrollQueued = false;
    var pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    bar.style.transform = "scaleX(" + (pct / 100).toFixed(4) + ")";
    var show = window.scrollY > 400;
    if (show !== lastToTop) { toTop.hidden = !show; lastToTop = show; }
  }
  window.addEventListener("scroll", function () {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  window.addEventListener("resize", function () {
    measure(); onScrollFrame();
  }, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------------- router ---------------- */
  function route() {
    var hash = location.hash || "#/";
    var mCompany = hash.match(/^#\/company\/([\w-]+)/);
    var mTopic = hash.match(/^#\/topic\/([\w-]+)/);
    var mSheet = hash.match(/^#\/cheatsheet\/([\w-]+)/);

    if (hash.indexOf("#/cheatsheets") === 0) {
      state.view = "cheatsheets"; state.topic = null; state.company = null; state.sheet = null;
      renderCheatsheetIndex();
    } else if (mSheet) {
      state.view = "cheatsheet"; state.topic = null; state.company = null; state.sheet = mSheet[1];
      renderCheatsheet(mSheet[1]);
    } else if (hash.indexOf("#/companies") === 0) {
      state.view = "companies"; state.topic = null; state.company = null; state.sheet = null;
      renderCompanies();
    } else if (mCompany) {
      if (state.company !== mCompany[1]) { state.level = "all"; state.filter = ""; state.hotOnly = false; }
      state.view = "company"; state.topic = null; state.company = mCompany[1]; state.sheet = null;
      renderCompany(mCompany[1]);
    } else if (mTopic) {
      if (state.topic !== mTopic[1]) { state.level = "all"; state.filter = ""; state.firm = ""; }
      state.view = "topic"; state.topic = mTopic[1]; state.company = null; state.sheet = null;
      renderTopic(mTopic[1]);
    } else {
      state.view = "home"; state.topic = null; state.company = null; state.sheet = null;
      renderHome();
    }
    applyTheme(mTopic ? mTopic[1] : (mSheet ? mSheet[1] : null));
    markActive();
    /* html{scroll-behavior:smooth} would otherwise animate this, so switching
       topic from far down a long page crawls back to the top. */
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(measure);
  }
  window.addEventListener("hashchange", route);

  /* Counts change as parts land; coalesce the repaints into one per frame. */
  var countsQueued = false;
  document.addEventListener("topic:loaded", function () {
    companyIndex = null;            // a new part may add companies
    if (countsQueued) return;
    countsQueued = true;
    requestAnimationFrame(function () { countsQueued = false; paintCounts(); measure(); });
  });

  initTypography();
  buildNav();
  route();
  measure();

  /* Warm the search index once the browser is idle, so first paint is never
     competing with 50+ content files. */
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 800); };
  idle(function () {
    loadAll(function () {
      searchReady = true;
      paintCounts();
      measure();
      /* Re-render home now that the company index can be built. */
      if (state.view === "home") renderHome();
    });
  }, { timeout: 3000 });
})();
