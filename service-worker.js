"use strict";

const CACHE_PREFIX = "solarbatterie-";
const CACHE_NAME = "solarbatterie-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./site.webmanifest",
  "./apple-touch-icon.png",
  "./favicon-16x16.png",
  "./favicon-32x32.png",
  "./icon-192.png",
  "./icon-512.png",
  "./datenschutz.html"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys
          .filter(function (key) { return key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function cacheKeyFor(request) {
  if (request.mode !== "navigate") return request;
  var pathname = new URL(request.url).pathname;
  return pathname.endsWith("/datenschutz.html") ? "./datenschutz.html" : "./index.html";
}

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  var requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.indexOf(self.registration.scope.replace(self.location.origin, "")) !== 0) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      var cacheKey = cacheKeyFor(event.request);
      return fetch(event.request)
        .then(function (response) {
          if (!response.ok) return response;
          return cache.put(cacheKey, response.clone())
            .then(function () { return response; })
            .catch(function () { return response; });
        })
        .catch(function () {
          return cache.match(cacheKey, { ignoreSearch: true }).then(function (cached) {
            return cached || Response.error();
          });
        });
    })
  );
});
