/* =======================================================================
   Re-Late · Fisioterapia — service worker v4 (modo sin conexión)
   Estrategia:
     navegaciones ... network-first con respaldo en caché
     recursos ....... stale-while-revalidate (incluye el CDN)
     APIs / vídeo ... solo red: nunca se cachean datos clínicos
   Requiere servirse por HTTP o HTTPS: en file:// no se registra.
   ======================================================================= */
'use strict';

var CACHE = 'relate-shell-v4';
var SHELL = ['./', './index.html', './manifest.json', './mejoras.css', './mejoras.js', './icon.svg'];
var OPT = ['vendor/tailwind-3.4.16.js', 'vendor/chart-4.4.1.umd.min.js',
           'icon-192.png', 'icon-512.png', 'icon-180.png', 'icon-maskable-512.png'];

self.addEventListener('install', function (event) {
  event.waitUntil((async () => {
    var c = await caches.open(CACHE);
    for (const u of SHELL) {
      try { await c.add(new Request(u, { cache: 'reload' })); }
      catch (e) { console.warn('[Re-Late SW] no cacheado', u, e); }
    }
    for (const u of OPT) {
      try { await c.add(new Request(u, { cache: 'reload' })); } catch (e) { /* opcional */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async () => {
    var names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE && n.indexOf('relate') === 0)
                            .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url; try { url = new URL(req.url); } catch (e) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (/wger\.de|\/api\//i.test(url.hostname + url.pathname)) return;
  if (req.destination === 'video') return;

  // Navegaciones: siempre la última versión si hay red
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        var res = await fetch(req);
        var c = await caches.open(CACHE);
        c.put('./index.html', res.clone());
        return res;
      } catch (e) {
        var hit = (await caches.match('./index.html')) || (await caches.match('./'));
        return hit || new Response(
          '<meta charset="utf-8"><h1>Re-Late sin conexión</h1>' +
          '<p>Abre la app una vez con internet para que quede guardada en el dispositivo.</p>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // Recursos (incluido el CDN): se sirve lo cacheado y se actualiza en segundo plano
  event.respondWith((async () => {
    var c = await caches.open(CACHE);
    var cached = await c.match(req);
    var red = fetch(req).then(function (res) {
      if (res && (res.status === 200 || res.type === 'opaque') &&
          res.type !== 'error' && res.type !== 'response') {
        c.put(req, res.clone()).catch(function () {});
      }
      return res;
    }).catch(function () { return null; });
    return cached || red || Response.error();
  })());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil((async () => {
    var ws = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    var scope = self.registration.scope;
    for (const c of ws) if (c.url.indexOf(scope) === 0 && 'focus' in c) return c.focus();
    return self.clients.openWindow(new URL('index.html', scope).href);
  })());
});
