/* ============================================================
   InterviewPrepBeforeMinutes — client-side app
   Hash router, lazy topic loading, search, progress, theme.
   ============================================================ */
(function () {
  "use strict";

  var LS_THEME = "ipbm.theme";
  var LS_DONE = "ipbm.done";
  var LS_OPEN = "ipbm.groups";

  var view = document.getElementById("view");
  var navTree = document.getElementById("navTree");
  var searchInput = document.getElementById("globalSearch");
  var searchBox = document.getElementById("searchResults");
  var sidebar = document.getElementById("sidebar");
  var scrim = document.getElementById("scrim");

  var state = { topic: null, level: "all", filter: "", done: load(LS_DONE, {}) };
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

  /* ---------------- utils ---------------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function stripTags(html) { return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " "); }

  /* Plain-text version of an answer, computed once and cached on the question
     object. Searching 478 answers on every keystroke is otherwise wasteful. */
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

  /* ---------------- lazy topic loading ---------------- */
  function ensureTopic(id, cb) {
    if (window.TOPIC_DATA[id]) return cb(window.TOPIC_DATA[id]);
    if (loading[id]) { loading[id].push(cb); return; }
    loading[id] = [cb];
    var s = document.createElement("script");
    s.src = "js/data/" + id + ".js";
    s.onload = function () {
      var data = window.TOPIC_DATA[id] || [];
      (loading[id] || []).forEach(function (fn) { fn(data); });
      delete loading[id];
    };
    s.onerror = function () {
      window.TOPIC_DATA[id] = [];
      (loading[id] || []).forEach(function (fn) { fn([]); });
      delete loading[id];
    };
    document.head.appendChild(s);
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
    navTree.innerHTML = html;

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
      "</section>" + groupsHtml;
  }

  /* ---------------- topic page ---------------- */
  function renderTopic(id) {
    var meta = window.TOPIC_MAP[id];
    if (!meta) return renderNotFound();

    view.innerHTML = '<div class="loading"><div class="spinner"></div>Loading ' + esc(meta.name) + " questions…</div>";
    ensureTopic(id, function (qs) {
      if (state.topic !== id) return;
      paintCounts();

      var head =
        '<div class="crumbs"><a href="#/">Home</a> &nbsp;›&nbsp; ' + esc(meta.group) + " &nbsp;›&nbsp; " + esc(meta.name) + "</div>" +
        '<div class="topic-head"><h1><span>' + meta.icon + "</span>" + esc(meta.name) + "</h1>" +
        '<p class="blurb">' + esc(meta.blurb) + "</p></div>" +
        '<div class="toolbar">' +
          '<div class="seg" id="levelSeg">' +
            '<button data-level="all">All</button>' +
            '<button data-level="beginner">Beginner</button>' +
            '<button data-level="advanced">Advanced</button>' +
          "</div>" +
          '<input class="filter-in" id="topicFilter" placeholder="Filter within ' + esc(meta.name) + '…" />' +
          '<button class="tool-btn" id="expandAll">Expand all</button>' +
          '<button class="tool-btn" id="collapseAll">Collapse all</button>' +
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
      document.getElementById("expandAll").addEventListener("click", function () {
        view.querySelectorAll(".qcard").forEach(function (c) { c.classList.add("open"); });
      });
      document.getElementById("collapseAll").addEventListener("click", function () {
        view.querySelectorAll(".qcard").forEach(function (c) { c.classList.remove("open"); });
      });

      paintList(id, qs);
    });
  }

  function paintList(id, qs) {
    var list = document.getElementById("qlist");
    if (!list) return;
    var term = state.filter.toLowerCase();
    var rows = [];
    qs.forEach(function (q, idx) {
      if (state.level !== "all" && q.level !== state.level) return;
      if (term) {
        var hay = q.q.toLowerCase() + " " + plainAnswer(q) + " " + (q.tags || []).join(" ");
        if (hay.indexOf(term) === -1) return;
      }
      rows.push({ q: q, idx: idx });
    });

    document.getElementById("countTag").textContent =
      rows.length + " of " + qs.length + " shown";

    if (!rows.length) {
      list.innerHTML = '<div class="empty"><h3>Nothing matches that filter</h3><p>Try another keyword or switch the difficulty track.</p></div>';
      return;
    }

    list.innerHTML = rows.map(function (r, n) {
      var q = r.q, key = qKey(id, r.idx);
      var done = !!state.done[key];
      var badges = "";
      if (q.hot) badges += '<span class="badge hot">Most asked</span>';
      badges += '<span class="badge ' + (q.level === "beginner" ? "beg\">Beginner" : "adv\">Advanced") + "</span>";
      var chips = (q.tags || []).map(function (t) { return '<span class="chip">#' + esc(t) + "</span>"; }).join("");
      return '<article class="qcard" data-key="' + key + '" id="q-' + key.replace(":", "-") + '" style="animation-delay:' + Math.min(n * 18, 400) + 'ms">' +
        '<button class="qhead">' +
          '<span class="qnum">' + (n + 1) + "</span>" +
          '<span class="qtext">' + highlight(q.q, state.filter) + "</span>" +
          '<span class="qbadges">' + badges + "</span>" +
          '<svg class="qchev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>' +
        "</button>" +
        '<div class="qbody"><div class="qbody-inner">' +
          '<div class="answer">' + q.a + "</div>" +
          '<div class="qfoot">' + chips +
            '<button class="mark-btn' + (done ? " done" : "") + '" data-key="' + key + '">' +
            (done ? "✓ Revised" : "Mark as revised") + "</button>" +
          "</div>" +
        "</div></div></article>";
    }).join("");

    list.querySelectorAll(".qhead").forEach(function (h) {
      h.addEventListener("click", function () { h.parentElement.classList.toggle("open"); });
    });
    list.querySelectorAll(".mark-btn").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var key = b.dataset.key;
        if (state.done[key]) { delete state.done[key]; b.classList.remove("done"); b.textContent = "Mark as revised"; }
        else { state.done[key] = 1; b.classList.add("done"); b.textContent = "✓ Revised"; }
        save(LS_DONE, state.done);
      });
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

    if (!hits.length) {
      searchBox.innerHTML = '<div class="sr-empty">No question matches “' + esc(term) + '”.</div>';
      searchBox.hidden = false;
      return;
    }
    searchBox.innerHTML = hits.slice(0, 40).map(function (h) {
      var t = window.TOPIC_MAP[h.id];
      return '<button class="sr-item" data-id="' + h.id + '" data-idx="' + h.idx + '">' +
        '<span class="sr-q">' + highlight(h.q.q, term) + "</span>" +
        '<span class="sr-meta">' + t.icon + " " + esc(t.name) + " · " + h.q.level + "</span></button>";
    }).join("") + (hits.length > 40 ? '<div class="sr-empty">+ ' + (hits.length - 40) + " more — refine your search</div>" : "");
    searchBox.hidden = false;

    searchBox.querySelectorAll(".sr-item").forEach(function (b) {
      b.addEventListener("click", function () {
        var tid = b.dataset.id, idx = +b.dataset.idx;
        searchBox.hidden = true;
        searchInput.value = "";
        state.level = "all"; state.filter = "";
        location.hash = "#/topic/" + tid;
        setTimeout(function () {
          var card = document.getElementById("q-" + tid + "-" + idx);
          if (card) {
            card.classList.add("open");
            card.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 260);
      });
    });
  }
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
    if (e.key === "Escape") { searchBox.hidden = true; searchInput.blur(); closeSidebar(); }
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
  window.addEventListener("scroll", function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    toTop.hidden = window.scrollY < 400;
  }, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------------- router ---------------- */
  function route() {
    var hash = location.hash || "#/";
    var m = hash.match(/^#\/topic\/([\w-]+)/);
    if (m) {
      if (state.topic !== m[1]) { state.level = "all"; state.filter = ""; }
      state.topic = m[1];
      renderTopic(m[1]);
    } else {
      state.topic = null;
      renderHome();
    }
    markActive();
    window.scrollTo({ top: 0 });
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("topic:loaded", paintCounts);

  buildNav();
  route();
  /* Warm the index in the background so search and counts are ready. */
  setTimeout(function () { loadAll(function () { searchReady = true; paintCounts(); if (!state.topic) renderHome(); }); }, 600);
})();
