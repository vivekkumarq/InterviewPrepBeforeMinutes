/* ============================================================
   Per-topic visual identity.

   Each topic gets an accent colour and a motif — a simple inline SVG drawn
   from the technology it represents. Inline rather than image files so there
   are no extra requests, nothing to 404, and the artwork inherits the theme's
   colours and scales crisply at any size.
   ============================================================ */
(function () {
  "use strict";

  /* Motif paths are drawn on a 24x24 grid and stroked with currentColor. */
  var M = {
    coffee:   '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h1.8a2.7 2.7 0 0 1 0 5.4H17"/><path d="M8 2.5v2M11.5 2v2.5M15 2.5v2"/>',
    threads:  '<path d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6"/><path d="M18 3v6a3 3 0 0 1-3 3H9a3 3 0 0 0-3 3v6"/><circle cx="6" cy="3" r="1.6"/><circle cx="18" cy="3" r="1.6"/><circle cx="6" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/>',
    gears:    '<circle cx="10" cy="10" r="3.4"/><path d="M10 2.6v2M10 15.4v2M2.6 10h2M15.4 10h2M4.8 4.8l1.4 1.4M13.8 13.8l1.4 1.4M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4"/><circle cx="18" cy="18" r="2.2"/>',
    leaf:     '<path d="M4 20c0-9 6-15 16-16 0 11-6 16-13 16Z"/><path d="M11 13c-2.6 1.8-4.4 4.2-5.4 7"/>',
    lock:     '<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"/><circle cx="12" cy="15" r="1.4"/>',
    database: '<ellipse cx="12" cy="5.6" rx="7.5" ry="3.1"/><path d="M4.5 5.6v12.8c0 1.7 3.4 3.1 7.5 3.1s7.5-1.4 7.5-3.1V5.6"/><path d="M4.5 12c0 1.7 3.4 3.1 7.5 3.1s7.5-1.4 7.5-3.1"/>',
    plug:     '<path d="M8 2.5v6M16 2.5v6"/><path d="M5 8.5h14v3a7 7 0 0 1-7 7 7 7 0 0 1-7-7v-3Z"/><path d="M12 18.5v3"/>',
    graph:    '<circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="3.4" r="1.8"/><circle cx="4.4" cy="17" r="1.8"/><circle cx="19.6" cy="17" r="1.8"/><path d="M12 5.2v4.4M10 13.6l-4 2.2M14 13.6l4 2.2"/>',
    stream:   '<path d="M3 7h11M3 12h16M3 17h9"/><circle cx="18.5" cy="7" r="1.8"/><circle cx="14.5" cy="17" r="1.8"/>',
    blocks:   '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    building: '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9.5 21v-5h5v5"/><path d="M9.5 11h1.5M13 11h1.5"/>',
    blueprint:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/><path d="M12.5 13h5M12.5 16.5h5"/>',
    table:    '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 9.5h18M3 14.5h18M9.5 9.5v10"/>',
    elephant: '<path d="M4 18v-5a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v5"/><path d="M7 18v2.5M17 18v2.5"/><path d="M10 12.5c0 3 0 5.5-2 6.5"/><circle cx="15.5" cy="11" r="1"/>',
    whale:    '<path d="M2.5 14.5c2.6 0 2.6 2 5.2 2s2.6-2 5.2-2 2.6 2 5.2 2 2.6-2 3.4-2"/><path d="M4 14.5V11h11v3.5"/><rect x="6.5" y="7" width="6" height="3.4" rx=".6"/>',
    helm:     '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3"/><path d="M12 3.8v5.2M12 15v5.2M3.8 12h5.2M15 12h5.2"/>',
    pipeline: '<circle cx="5" cy="6" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="12" r="2.2"/><path d="M5 8.2v7.6M7.2 6h6a3 3 0 0 1 3 3v1M7.2 18h6a3 3 0 0 0 3-3v-1"/>',
    flask:    '<path d="M9.5 3v6.4L4.6 18a2.2 2.2 0 0 0 1.9 3.3h11a2.2 2.2 0 0 0 1.9-3.3l-4.9-8.6V3"/><path d="M8 3h8M7.4 14.5h9.2"/>',
    shield:   '<path d="M12 2.6 4.5 5.8v6c0 4.6 3.1 8.4 7.5 9.6 4.4-1.2 7.5-5 7.5-9.6v-6L12 2.6Z"/><path d="M9 12.5l2.2 2.2 4-4.4"/>',
    atom:     '<circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/>',
    ts:       '<rect x="3" y="3" width="18" height="18" rx="2.6"/><path d="M7 10.5h6M10 10.5V18"/><path d="M20 11.4c-.7-.7-1.6-1-2.5-1-1.3 0-2.2.7-2.2 1.8 0 2.4 4.9 1.4 4.9 4.2 0 1.3-1.1 2.1-2.6 2.1-1.1 0-2.1-.4-2.8-1.2"/>',
    brackets: '<path d="M8.5 4C6 4 6 7.5 6 9.6 6 11 4.6 12 3.4 12c1.2 0 2.6 1 2.6 2.4 0 2.1 0 5.6 2.5 5.6"/><path d="M15.5 4c2.5 0 2.5 3.5 2.5 5.6 0 1.4 1.4 2.4 2.6 2.4-1.2 0-2.6 1-2.6 2.4 0 2.1 0 5.6-2.5 5.6"/>',
    grid:     '<rect x="3" y="6" width="18" height="12" rx="1.8"/><path d="M9 6v12M15 6v12M3 12h18"/>',
    chain:    '<rect x="2.5" y="9.5" width="8" height="5" rx="2.5"/><rect x="13.5" y="9.5" width="8" height="5" rx="2.5"/><path d="M10.5 12h3"/>',
    stack:    '<rect x="5" y="15.5" width="14" height="4" rx="1.2"/><rect x="5" y="10" width="14" height="4" rx="1.2"/><rect x="5" y="4.5" width="14" height="4" rx="1.2"/>',
    tree:     '<circle cx="12" cy="4.6" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="12" r="2.2"/><circle cx="6" cy="19.4" r="2.2"/><path d="M10.4 6.2 7.6 10.2M13.6 6.2l2.8 4M6 14.2v3"/>',
    network:  '<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="13" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M6.8 7.3 10.3 11.6M17.2 7.3 13.7 11.6M10.3 14.4 6.8 17.7M13.7 14.4l3.5 3.3"/>',
    matrix:   '<rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1"/><rect x="10" y="3.5" width="5.5" height="5.5" rx="1"/><rect x="3.5" y="10" width="5.5" height="5.5" rx="1"/><rect x="10" y="10" width="5.5" height="5.5" rx="1"/><path d="M17.5 6.2h3M17.5 12.7h3M6.2 17.5v3M12.7 17.5v3"/>',
    target:   '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.4"/>',
    compass:  '<circle cx="12" cy="12" r="8.6"/><path d="m15.4 8.6-2 5.4-5.4 2 2-5.4 5.4-2Z"/>',
    brain:    '<path d="M9.4 3.6a3 3 0 0 0-3 3 3 3 0 0 0-1.6 5.3A3 3 0 0 0 6 17.2a3 3 0 0 0 5.4 1.8V4.8a3 3 0 0 0-2-1.2Z"/><path d="M14.6 3.6a3 3 0 0 1 3 3 3 3 0 0 1 1.6 5.3 3 3 0 0 1-1.2 5.3 3 3 0 0 1-5.4 1.8"/>',
    chat:     '<path d="M20.5 12.4c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.9-.4L4 21l1.4-3.8a6.8 6.8 0 0 1-1.9-4.8C3.5 8.4 7.3 5.2 12 5.2s8.5 3.2 8.5 7.2Z"/><path d="M8.6 12h.01M12 12h.01M15.4 12h.01"/>',
    tag:      '<path d="M20.4 12.6 12.6 20.4a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1-.6-1.4V4.6a2 2 0 0 1 2-2h8.2c.5 0 1 .2 1.4.6l5.8 5.8a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="8" r="1.5"/>'
  };

  /* topic id -> { accent, motif }.  Accents lean on each technology's own
     brand colour where it has one, so a stack is recognisable at a glance. */
  var T = {
    "java-basics":      ["#e76f00", "coffee"],
    "java-oop":         ["#e76f00", "blocks"],
    "java-collections": ["#d9741a", "stack"],
    "java-concurrency": ["#c2410c", "threads"],
    "java-8":           ["#0ea5e9", "stream"],
    "java-versions":    ["#f59e0b", "tag"],
    "jvm":              ["#8b5a2b", "gears"],

    "spring-core":      ["#6db33f", "leaf"],
    "spring-boot":      ["#6db33f", "leaf"],
    "spring-security":  ["#3f8f2f", "lock"],
    "jpa-hibernate":    ["#59857a", "database"],

    "rest-api":         ["#0ea5e9", "plug"],
    "graphql":          ["#e10098", "graph"],
    "kafka":            ["#6c5ce7", "stream"],

    "microservices":    ["#8b5cf6", "blocks"],
    "system-design":    ["#0891b2", "building"],
    "design-patterns":  ["#f59e0b", "blueprint"],

    "sql":              ["#00758f", "table"],
    "postgresql":       ["#336791", "elephant"],

    "docker":           ["#2496ed", "whale"],
    "kubernetes":       ["#326ce5", "helm"],
    "cicd":             ["#fc6d26", "pipeline"],

    "testing":          ["#25a162", "flask"],

    "angular":          ["#dd0031", "shield"],
    "react":            ["#22a7c4", "atom"],
    "typescript":       ["#3178c6", "ts"],

    "coding-basics":      ["#6366f1", "brackets"],
    "coding-arrays":      ["#4f7df3", "grid"],
    "coding-linked-list": ["#7c6cf0", "chain"],
    "coding-stack-queue": ["#8b5cf6", "stack"],
    "coding-trees":       ["#22a06b", "tree"],
    "coding-graphs":      ["#0d9488", "network"],
    "coding-dp":          ["#d946ef", "matrix"],
    "coding-greedy":      ["#f97316", "target"],
    "algorithms":         ["#0284c7", "compass"],

    "dsa":              ["#a855f7", "brain"],
    "hr":               ["#14b8a6", "chat"]
  };

  window.TOPIC_THEME = {
    /* Accent colour for a topic, falling back to the app accent. */
    accent: function (id) { return (T[id] && T[id][0]) || "#4f46e5"; },

    /* An <svg> for the topic's motif, sized by CSS. */
    motif: function (id, cls) {
      var key = T[id] && T[id][1];
      var body = M[key] || M.brackets;
      return '<svg class="' + (cls || "motif") + '" viewBox="0 0 24 24" aria-hidden="true" ' +
             'fill="none" stroke="currentColor" stroke-width="1.4" ' +
             'stroke-linecap="round" stroke-linejoin="round">' + body + "</svg>";
    },

    has: function (id) { return !!T[id]; }
  };
})();
