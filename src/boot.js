// Boot loader (classic script). Downloads every game file listed in
// asset-manifest.json with real byte-level progress, then starts the game.
// Nothing is fetched from the network after this finishes.
(function () {
  'use strict';

  var SKIP = { 'index.html': 1, 'src/boot.js': 1 };
  var CONCURRENCY = 4;
  var STALL_MS = 20000;

  var $ = function (id) { return document.getElementById(id); };
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  var forceSW = new URLSearchParams(location.search).has('sw');
  var useSW = 'serviceWorker' in navigator && window.isSecureContext && (!isLocal || forceSW);

  var manifest = null;
  var done = {};
  var bytes = {};
  var total = 0;

  function setProgress(frac, label) {
    var pct = Math.max(0, Math.min(100, Math.floor(frac * 100)));
    $('load-fill').style.width = pct + '%';
    $('load-text').textContent = (label ? label + ' ' : '') + pct + '%';
  }

  function renderBytes() {
    var got = 0;
    for (var k in bytes) got += bytes[k];
    setProgress(total ? (got / total) * 0.9 : 0, 'טוען את המשחק...');
    $('load-size').textContent = Math.round(got / 1024) + ' / ' + Math.round(total / 1024) + ' KB';
  }

  function showError(err) {
    console.error('[boot]', err);
    $('load-error').classList.remove('hidden');
    $('load-error-msg').textContent = location.protocol === 'file:'
      ? 'כדי לשחק במחשב, הפעילו את הקובץ start.bat שבתיקיית המשחק.'
      : navigator.onLine === false
        ? 'אין חיבור לאינטרנט. התחברו ונסו שוב.'
        : 'לא הצלחנו לטעון חלק מהמשחק. בדקו את החיבור ונסו שוב.';
  }

  function fetchFile(f, cache) {
    var ctrl = new AbortController();
    var timer = 0;
    function arm() { clearTimeout(timer); timer = setTimeout(function () { ctrl.abort(); }, STALL_MS); }
    arm();
    bytes[f.url] = 0;
    return fetch(f.url, { signal: ctrl.signal }).then(function (res) {
      if (!res.ok) throw new Error(f.url + ' (' + res.status + ')');
      var type = res.headers.get('Content-Type') || '';
      var chunks = [];
      var reader = res.body && res.body.getReader();
      var finish = function () {
        clearTimeout(timer);
        bytes[f.url] = f.size;
        done[f.url] = true;
        renderBytes();
        if (!cache) return;
        var headers = { 'Content-Type': type, 'X-Hash': f.hash };
        return cache.put(f.url, new Response(new Blob(chunks, { type: type }), { headers: headers }))
          .catch(function () {});
      };
      if (!reader) return res.arrayBuffer().then(function (b) { chunks.push(b); return finish(); });
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return finish();
          chunks.push(r.value);
          bytes[f.url] += r.value.length;
          arm();
          renderBytes();
          return pump();
        });
      }
      return pump();
    }).catch(function (e) {
      clearTimeout(timer);
      bytes[f.url] = 0;
      throw e;
    });
  }

  function loadAll(cache) {
    var todo = manifest.files.filter(function (f) { return !SKIP[f.url] && !done[f.url]; });
    var next = 0;
    var active = 0;
    return new Promise(function (resolve, reject) {
      var failed = false;
      function pump() {
        if (failed) return;
        if (next >= todo.length && active === 0) return resolve();
        while (active < CONCURRENCY && next < todo.length) {
          active++;
          fetchFile(todo[next++], cache).then(function () { active--; pump(); }, function (e) {
            failed = true;
            reject(e);
          });
        }
      }
      pump();
    });
  }

  function openCache() {
    var controlled = useSW && navigator.serviceWorker.controller;
    if (!useSW || controlled || !window.caches) return Promise.resolve(null);
    return caches.open('bq-' + manifest.version).catch(function () { return null; });
  }

  function registerSW() {
    if (useSW) {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('[sw]', e); });
    } else if ('serviceWorker' in navigator && isLocal) {
      // Development: make sure an old worker never serves stale files.
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.unregister(); });
      });
    }
  }

  // A new version was published but this device still runs the old one:
  // the old Service Worker would keep serving old files. Let the new worker
  // download the new version (showing real progress), then reload once.
  function needsUpdate(m) {
    if (!useSW || !navigator.serviceWorker.controller || !window.caches) return Promise.resolve(false);
    return caches.has('bq-' + m.version).then(function (has) { return !has; });
  }

  function waitForUpdate(m) {
    setProgress(0, 'מעדכן לגרסה חדשה...');
    return new Promise(function (resolve, reject) {
      var last = -1;
      var lastChange = Date.now();
      navigator.serviceWorker.addEventListener('controllerchange', function () { location.reload(); });
      navigator.serviceWorker.getRegistration().then(function (reg) {
        if (reg) reg.update().catch(function () {});
        else navigator.serviceWorker.register('sw.js').catch(reject);
      });
      var poll = setInterval(function () {
        caches.open('bq-' + m.version).then(function (c) { return c.keys(); }).then(function (keys) {
          if (keys.length !== last) {
            last = keys.length;
            lastChange = Date.now();
          }
          setProgress(Math.min(1, keys.length / m.files.length) * 0.9, 'מעדכן לגרסה חדשה...');
          if (Date.now() - lastChange > STALL_MS) {
            clearInterval(poll);
            reject(new Error('update stalled'));
          }
        });
      }, 250);
    });
  }

  function start() {
    $('load-error').classList.add('hidden');
    setProgress(0, 'מתחבר...');
    fetch('asset-manifest.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('manifest ' + r.status);
        return r.json();
      })
      .then(function (m) {
        manifest = m;
        return needsUpdate(m);
      })
      .then(function (update) {
        if (update) return waitForUpdate(manifest);
        total = 0;
        manifest.files.forEach(function (f) { if (!SKIP[f.url]) total += f.size; });
        renderBytes();
        return openCache().then(loadAll);
      })
      .then(function () {
        setProgress(0.92, 'בונה את העולם...');
        return import(new URL('src/main.js', document.baseURI).href);
      })
      .then(function (mod) {
        return mod.start({
          progress: function (frac, label) { setProgress(0.92 + frac * 0.08, label); },
        });
      })
      .then(function () {
        setProgress(1, '');
        var el = $('loading');
        el.classList.add('fade-out');
        setTimeout(function () { el.remove(); }, 600);
        registerSW();
      })
      .catch(showError);
  }

  $('load-retry').addEventListener('click', start);
  start();
})();
