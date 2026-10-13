/* Media lookups. Every picture on the site has a drawn version underneath; these lookups find the real
   artwork (album covers, anime posters, show art, book covers) and lay it on top once it loads.
   Results are remembered in localStorage for two weeks so repeat visits don't hit the APIs again. */
(function () {
  var TTL = 14 * 864e5, PREFIX = 'mouna:media:v1:';
  function getCache(k) {
    try { var v = JSON.parse(localStorage.getItem(PREFIX + k)); if (v && Date.now() - v.t < TTL) return v; } catch (e) {}
    return null;
  }
  function setCache(k, d) { try { localStorage.setItem(PREFIX + k, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
  function enc(s) { return encodeURIComponent(s); }

  // Apple's search API is read through JSONP (a <script> tag), which works from any site.
  var jp = 0;
  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var name = '__mouna_jp' + (++jp), s = document.createElement('script'), done = false;
      var timer = setTimeout(function () { finish(); reject(new Error('timeout')); }, 9000);
      function finish() { done = true; clearTimeout(timer); try { delete window[name]; } catch (e) { window[name] = undefined; } s.remove(); }
      window[name] = function (data) { if (!done) { finish(); resolve(data); } };
      s.onerror = function () { if (!done) { finish(); reject(new Error('network')); } };
      s.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'callback=' + name;
      document.head.appendChild(s);
    });
  }
  function getJSON(url) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) {
      clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json();
    });
  }
  // Jikan (MyAnimeList) allows about three requests a second, so its calls wait in line.
  var jikanLine = Promise.resolve();
  function jikan(url) {
    var p = jikanLine.then(function () {
      return getJSON(url).catch(function (e) {
        return new Promise(function (r) { setTimeout(r, 1300); }).then(function () { return getJSON(url); });
      });
    });
    jikanLine = p.catch(function () {}).then(function () { return new Promise(function (r) { setTimeout(r, 420); }); });
    return p;
  }
  function itunes(params) { return jsonp('https://itunes.apple.com/search?' + params + '&country=us'); }
  function big(art) { return art ? art.replace(/\/\d+x\d+bb\./, '/600x600bb.') : null; }
  function low(s) { return (s || '').toLowerCase(); }
  function probe(src) {
    return new Promise(function (ok, no) {
      var i = new Image(); i.onload = function () { i.naturalWidth > 2 ? ok(src) : no(); }; i.onerror = no; i.src = src;
    });
  }

  var resolvers = {
    'itunes-album': function (q) {
      var parts = q.split('|'), artist = parts[0], album = parts[1];
      return itunes('term=' + enc(artist + ' ' + album) + '&entity=album&limit=15').then(function (d) {
        var hit = (d.results || []).filter(function (r) {
          return low(r.artistName).indexOf(low(artist)) > -1 && low(r.collectionName).indexOf(low(album)) === 0;
        })[0];
        return hit ? big(hit.artworkUrl100) : null;
      });
    },
    'podcast': function (q) {
      return itunes('term=' + enc(q) + '&media=podcast&entity=podcast&limit=3').then(function (d) {
        var r = (d.results || [])[0]; return r ? (r.artworkUrl600 || big(r.artworkUrl100)) : null;
      });
    },
    'jikan-anime': function (q) {
      return jikan('https://api.jikan.moe/v4/anime?q=' + enc(q) + '&order_by=members&sort=desc&limit=1&sfw=true').then(function (d) {
        var a = d.data && d.data[0]; if (!a) return null;
        return (a.images.webp && a.images.webp.large_image_url) || a.images.jpg.large_image_url;
      });
    },
    'jikan-char': function (q) {
      return jikan('https://api.jikan.moe/v4/characters?q=' + enc(q) + '&order_by=favorites&sort=desc&limit=1').then(function (d) {
        var c = d.data && d.data[0]; if (!c) return null;
        return (c.images.webp && c.images.webp.image_url) || c.images.jpg.image_url;
      });
    },
    'tvmaze': function (q) {
      return getJSON('https://api.tvmaze.com/singlesearch/shows?q=' + enc(q)).then(function (d) {
        return d && d.image ? (d.image.original || d.image.medium).replace(/^http:/, 'https:') : null;
      });
    },
    'wiki': function (title) {
      return getJSON('https://en.wikipedia.org/api/rest_v1/page/summary/' + enc(title)).then(function (d) {
        return d && d.thumbnail ? d.thumbnail.source : null;
      });
    },
    'isbn': function (list) {
      var isbns = list.split(','), i = 0;
      function next() {
        if (i >= isbns.length) return Promise.resolve(null);
        var src = 'https://covers.openlibrary.org/b/isbn/' + isbns[i++].trim() + '-L.jpg?default=false';
        return probe(src).catch(next);
      }
      return next();
    },
    'gbooks': function (q) {
      return getJSON('https://www.googleapis.com/books/v1/volumes?q=' + enc(q) + '&maxResults=5&printType=books').then(function (d) {
        var hit = (d.items || []).filter(function (it) { return it.volumeInfo && it.volumeInfo.imageLinks; })[0];
        if (!hit) return null;
        var l = hit.volumeInfo.imageLinks;
        return (l.thumbnail || l.smallThumbnail).replace(/^http:/, 'https:').replace('&edge=curl', '').replace('zoom=1', 'zoom=2');
      });
    }
  };

  var pending = {};
  function lookup(key) {
    var hit = getCache(key);
    if (hit) return Promise.resolve(hit.d);
    if (pending[key]) return pending[key];
    var i = key.indexOf(':'), kind = key.slice(0, i), q = key.slice(i + 1);
    if (!resolvers[kind]) return Promise.resolve(null);
    pending[key] = resolvers[kind](q).then(function (url) { setCache(key, url || null); return url; }, function () { return null; });
    return pending[key];
  }

  function hydrate(el) {
    var key = el.getAttribute('data-media');
    if (!key || el.__hydrated) return; el.__hydrated = true;
    lookup(key).then(function (src) {
      if (!src) return;
      var img = new Image();
      img.className = 'real'; img.alt = el.getAttribute('data-alt') || ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      img.onload = function () { el.classList.add('has-img'); };
      img.src = src;
      el.appendChild(img);
    });
  }

  function start() {
    var els = [].slice.call(document.querySelectorAll('[data-media]'));
    if (!('IntersectionObserver' in window)) { els.forEach(hydrate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { hydrate(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '900px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  window.Media = { lookup: lookup, itunes: itunes, big: big, start: start, cache: { get: getCache, set: setCache } };
})();
