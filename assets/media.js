/* Media lookups. Every picture on the site has a drawn version underneath; these lookups find the real
   artwork (album covers, anime posters, show art, book covers) and lay it on top once it loads.
   Results are remembered in localStorage for two weeks so repeat visits don't hit the APIs again. */
(function () {
  var TTL = 14 * 864e5, MISS_TTL = 36e5, PREFIX = 'mouna:media:v2:';
  function getCache(k) {
    try { var v = JSON.parse(localStorage.getItem(PREFIX + k)); if (v && Date.now() - v.t < (v.d == null ? MISS_TTL : TTL)) return v; } catch (e) {}  // a miss is retried after an hour
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
  function isbn10(i13) {
    if (!/^978\d{10}$/.test(i13)) return null;
    var core = i13.slice(3, 12), sum = 0;
    for (var i = 0; i < 9; i++) sum += +core[i] * (10 - i);
    var c = (11 - sum % 11) % 11;
    return core + (c === 10 ? 'X' : c);
  }
  // a cover only counts if it really loads and isn't a 1-pixel "no image" stand-in
  function probe(src) {
    return new Promise(function (ok, no) {
      var i = new Image(); i.onload = function () { i.naturalWidth > 20 ? ok(src) : no(); }; i.onerror = no; i.src = src;
    });
  }

  function anilist(query, s) {
    return fetch('https://graphql.anilist.co', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: query, variables: { s: s } })
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function jikanAnime(q) {
    return jikan('https://api.jikan.moe/v4/anime?q=' + enc(q) + '&order_by=members&sort=desc&limit=1').then(function (d) {
      var a = d.data && d.data[0]; if (!a) return null;
      return (a.images.webp && a.images.webp.large_image_url) || a.images.jpg.large_image_url;
    }).catch(function () { return null; });
  }
  function jikanChar(q) {
    return jikan('https://api.jikan.moe/v4/characters?q=' + enc(q) + '&order_by=favorites&sort=desc&limit=1').then(function (d) {
      var c = d.data && d.data[0]; if (!c) return null;
      return (c.images.webp && c.images.webp.image_url) || c.images.jpg.image_url;
    }).catch(function () { return null; });
  }

  var resolvers = {
    'itunes-album': function (q) {
      var parts = q.split('|'), artist = parts[0], album = parts[1], song = parts[2];
      function fromSong() {
        if (!song) return null;
        return itunes('term=' + enc(song + ' ' + artist) + '&entity=song&limit=25').then(function (d) {
          var hit = (d.results || []).filter(function (r) {
            return low(r.artistName).indexOf(low(artist)) > -1 && low(r.collectionName).indexOf(low(album)) > -1;
          })[0];
          return hit ? big(hit.artworkUrl100) : null;
        });
      }
      return itunes('term=' + enc(album) + '&entity=album&attribute=albumTerm&limit=50').then(function (d) {
        var hit = (d.results || []).filter(function (r) {
          return low(r.artistName).indexOf(low(artist)) > -1 && low(r.collectionName).indexOf(low(album)) === 0;
        })[0];
        return hit ? big(hit.artworkUrl100) : fromSong();
      }, fromSong);
    },
    'podcast': function (q) {
      return itunes('term=' + enc(q) + '&media=podcast&entity=podcast&limit=3').then(function (d) {
        var r = (d.results || [])[0]; return r ? (r.artworkUrl600 || big(r.artworkUrl100)) : null;
      });
    },
    'anime': function (q) {
      return anilist('query($s:String){Page(perPage:1){media(search:$s,type:ANIME,sort:POPULARITY_DESC){coverImage{extraLarge large}}}}', q)
        .then(function (d) { var m = d.data.Page.media[0]; return m ? (m.coverImage.extraLarge || m.coverImage.large) : null; })
        .catch(function () { return null; })
        .then(function (url) { return url || jikanAnime(q); });
    },
    'char': function (q) {
      return anilist('query($s:String){Page(perPage:1){characters(search:$s,sort:FAVOURITES_DESC){image{large}}}}', q)
        .then(function (d) { var c = d.data.Page.characters[0]; return c ? c.image.large : null; })
        .catch(function () { return null; })
        .then(function (url) { return url || jikanChar(q); });
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
    'film': function (q) {
      return getJSON('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&generator=search&gsrlimit=1&gsrsearch=' + enc(q) +
        '&prop=pageimages&piprop=thumbnail&pithumbsize=800&pilicense=any').then(function (d) {
        var pages = d.query && d.query.pages, k = pages && Object.keys(pages)[0];
        return k && pages[k].thumbnail ? pages[k].thumbnail.source : null;
      });
    },
    'book': function (q) {
      var parts = q.split('|'), title = parts[0], author = parts[1], isbns = (parts[2] || '').split(',').filter(Boolean);
      var tries = [
        function () {
          return getJSON('https://openlibrary.org/search.json?title=' + enc(title) + '&author=' + enc(author) + '&limit=5&fields=cover_i').then(function (d) {
            var doc = (d.docs || []).filter(function (x) { return x.cover_i; })[0];
            return doc ? probe('https://covers.openlibrary.org/b/id/' + doc.cover_i + '-L.jpg') : null;
          });
        }
      ];
      isbns.forEach(function (i) { tries.push(function () { return probe('https://covers.openlibrary.org/b/isbn/' + i + '-L.jpg?default=false'); }); });
      isbns.forEach(function (i) { var t = isbn10(i); if (t) tries.push(function () { return probe('https://images-na.ssl-images-amazon.com/images/P/' + t + '.01.LZZZZZZZ.jpg'); }); });
      tries.push(function () {
        return getJSON('https://www.googleapis.com/books/v1/volumes?q=' + enc('intitle:' + title + ' inauthor:' + author) + '&maxResults=5&printType=books').then(function (d) {
          var hit = (d.items || []).filter(function (it) { return it.volumeInfo && it.volumeInfo.imageLinks; })[0];
          if (!hit) return null;
          var l = hit.volumeInfo.imageLinks;
          return probe((l.thumbnail || l.smallThumbnail).replace(/^http:/, 'https:').replace('&edge=curl', ''));
        });
      });
      var k = 0;
      function next() {
        if (k >= tries.length) return Promise.resolve(null);
        return Promise.resolve().then(tries[k++]).then(function (u) { return u || next(); }, next);
      }
      return next();
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
