/* Offline support, network first.
 *
 * Every request goes to the network as normal, so an online visitor always
 * gets the latest content. Each successful response is also copied into a
 * cache, and the cache is used only when the network fails. Visiting the
 * site once (the home page loads every topic in the background) is enough
 * to make every topic readable offline.
 */
var CACHE = "ipbm-v1";
var SHELL = [
  "./", "index.html", "css/styles.css",
  "js/topics.js", "js/coding.js", "js/motifs.js", "js/app.js",
  "icon.svg", "manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

var FONT_HOSTS = /(^|\.)fonts\.(googleapis|gstatic)\.com$/;

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin && !FONT_HOSTS.test(url.hostname)) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && (res.ok || res.type === "opaque")) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        if (req.mode === "navigate") return caches.match("index.html");
        return Response.error();
      });
    })
  );
});
