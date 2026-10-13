/* 104.1 FM: her four songs, and a one-minute snippet of ShxtsnGigs.
   Apple's search API gives a 30-second preview clip and the cover for each song. The full songs
   can't be hosted on a personal site, so every song also links out to Apple Music, Spotify and YouTube. */
(function () {
  var TRACKS = [
    { title: 'Remember the Time', artist: 'Michael Jackson', term: 'remember the time michael jackson', must: ['remember the time'], by: 'jackson' },
    { title: 'You Rock My World', artist: 'Michael Jackson', term: 'you rock my world michael jackson', must: ['rock my world'], by: 'jackson' },
    { title: 'Twisted', artist: 'Keith Sweat', term: 'twisted keith sweat', must: ['twisted'], by: 'sweat' },
    { title: 'Ignition (Remix)', artist: 'R. Kelly', term: 'ignition remix r kelly', must: ['ignition', 'remix'], by: 'kelly' }
  ];
  var audio = new Audio(), pod = new Audio(), idx = 0, want = false, podTimer = null;
  audio.preload = 'none'; pod.preload = 'none';
  function $(id) { return document.getElementById(id); }
  function q(s) { return encodeURIComponent(s); }

  function resolve(t) {
    var key = 'song:' + t.term, hit = Media.cache.get(key);
    if (hit) return Promise.resolve(hit.d);
    return Media.itunes('term=' + q(t.term) + '&entity=song&limit=25').then(function (d) {
      var res = (d.results || []).filter(function (r) {
        var name = (r.trackName || '').toLowerCase(), who = (r.artistName || '').toLowerCase();
        return r.previewUrl && who.indexOf(t.by) > -1 && t.must.every(function (m) { return name.indexOf(m) > -1; });
      });
      // prefer the original album version over live or instrumental cuts
      res.sort(function (a, b) { return score(a) - score(b); });
      var r = res[0], out = r ? { preview: r.previewUrl, art: Media.big(r.artworkUrl100), apple: r.trackViewUrl, album: r.collectionName } : null;
      Media.cache.set(key, out);
      return out;
    }).catch(function () { return null; });
  }
  function score(r) {
    var n = (r.trackName + ' ' + r.collectionName).toLowerCase(), s = 0;
    if (/live|instrumental|karaoke|a cappella|edit\b|mix\)|version/.test(n.replace('remix', ''))) s += 5;
    if (/hits|greatest|essential|best of|number ones/.test(r.collectionName.toLowerCase())) s += 1;
    return s;
  }

  function links(t, info) {
    var term = t.title + ' ' + t.artist;
    return '<span>Full song:</span> ' +
      '<a href="' + (info && info.apple ? info.apple : 'https://music.apple.com/us/search?term=' + q(term)) + '" target="_blank" rel="noopener">Apple Music</a>' +
      '<a href="https://open.spotify.com/search/' + q(term) + '" target="_blank" rel="noopener">Spotify</a>' +
      '<a href="https://www.youtube.com/results?search_query=' + q(term + ' official video') + '" target="_blank" rel="noopener">YouTube</a>';
  }

  function paint(info) {
    var t = TRACKS[idx];
    $('deck-title').textContent = t.title; $('deck-artist').textContent = t.artist;
    $('np-song').textContent = t.title + ' · ' + t.artist;
    $('deck-full').innerHTML = links(t, info);
    var art = $('deck-art');
    art.innerHTML = info && info.art ? '<img alt="" src="' + info.art + '">' : '<span>104</span>';
    [].forEach.call($('tracks').children, function (li, i) { li.classList.toggle('on', i === idx); });
    var playing = want && !audio.paused;
    document.body.classList.toggle('playing', playing || (!pod.paused));
    $('np-icon').setAttribute('d', playing ? 'M3 1.5h3v11H3zM8 1.5h3v11H8z' : 'M3 1.5v11l9-5.5z');
    $('np-play').setAttribute('aria-label', playing ? 'Pause the radio' : 'Play the radio');
    $('deck-play').textContent = playing ? '❚❚ Pause' : '▶ Play';
    [].forEach.call(document.querySelectorAll('.album[data-track]'), function (a) {
      a.classList.toggle('spin', playing && +a.getAttribute('data-track') === idx);
    });
    if ('mediaSession' in navigator && window.MediaMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: '104.1 FM · Mounâ FM',
        artwork: info && info.art ? [{ src: info.art, sizes: '600x600', type: 'image/jpeg' }] : [] });
    }
  }

  function load(i, autoplay) {
    idx = (i + TRACKS.length) % TRACKS.length;
    var mine = idx;
    paint(null);
    return resolve(TRACKS[idx]).then(function (info) {
      if (mine !== idx) return;
      paint(info);
      if (!info) { if (autoplay && want) { skips++; if (skips < TRACKS.length) return load(idx + 1, true); } want = false; paint(null); note('Couldn’t reach the radio right now.'); return; }
      skips = 0;
      if (audio.src !== info.preview) audio.src = info.preview;
      if (autoplay) { stopPod(); return audio.play().then(function () { paint(info); }).catch(function () { want = false; paint(info); }); }
    });
  }
  var skips = 0;
  function note(msg) { var p = $('deck-full'); if (p && msg) p.innerHTML = msg + ' ' + p.innerHTML; }

  function play(i) { want = true; return load(i == null ? idx : i, true); }
  function pause() { want = false; audio.pause(); paint(Media.cache.get('song:' + TRACKS[idx].term) ? Media.cache.get('song:' + TRACKS[idx].term).d : null); }
  function toggle() { if (want && !audio.paused) pause(); else play(); }

  audio.addEventListener('timeupdate', function () {
    var d = audio.duration || 30; $('deck-bar').style.width = Math.min(100, audio.currentTime / d * 100) + '%';
  });
  audio.addEventListener('ended', function () { if (want) play(idx + 1); });
  audio.addEventListener('pause', function () { if (!audio.ended) { var c = Media.cache.get('song:' + TRACKS[idx].term); paint(c ? c.d : null); } });
  audio.addEventListener('play', function () { var c = Media.cache.get('song:' + TRACKS[idx].term); paint(c ? c.d : null); });

  /* ---------- ShxtsnGigs snippet ---------- */
  var episode = null;
  function findEpisode() {
    var hit = Media.cache.get('pod:latest');
    if (hit && Date.now() - hit.t < 864e5) return Promise.resolve(hit.d);
    return Media.itunes('term=shxtsngigs&media=podcast&entity=podcastEpisode&limit=25').then(function (d) {
      var eps = (d.results || []).filter(function (r) {
        return r.episodeUrl && /shxts/i.test(r.collectionName || '');
      }).sort(function (a, b) { return new Date(b.releaseDate) - new Date(a.releaseDate); });
      var e = eps[0], out = e ? { url: e.episodeUrl, title: e.trackName, date: e.releaseDate, ms: e.trackTimeMillis, page: e.collectionViewUrl || e.trackViewUrl } : null;
      Media.cache.set('pod:latest', out);
      return out;
    }).catch(function () { return null; });
  }
  function stopPod() { clearInterval(podTimer); podTimer = null; pod.pause(); $('ep-play').textContent = '▶ Play a one-minute snippet'; $('ep-bar').style.width = '0'; }
  function playPod() {
    if (!episode) return;
    if (!pod.paused) { stopPod(); return; }
    want = false; audio.pause();
    var started = false;
    pod.src = episode.url;
    $('ep-play').textContent = 'Loading…';
    pod.addEventListener('loadedmetadata', function seek() {
      pod.removeEventListener('loadedmetadata', seek);
      var d = pod.duration && isFinite(pod.duration) ? pod.duration : (episode.ms ? episode.ms / 1000 : 3600);
      var at = Math.max(60, Math.min(d - 90, d * 0.28 + Math.random() * d * 0.3));   // somewhere in the middle, past the intro and ads
      try { pod.currentTime = at; } catch (e) {}
    });
    pod.play().then(function () {
      var t0 = null; started = true;
      $('ep-play').textContent = '❚❚ Stop';
      podTimer = setInterval(function () {
        if (pod.paused) return;
        if (t0 === null) t0 = Date.now();
        var p = (Date.now() - t0) / 60000;
        $('ep-bar').style.width = Math.min(100, p * 100) + '%';
        if (p >= 1) stopPod();
      }, 250);
      document.body.classList.add('playing');
    }).catch(function () { if (!started) { $('ep-play').textContent = 'Snippet unavailable · listen on Spotify'; } });
  }
  pod.addEventListener('pause', function () { document.body.classList.toggle('playing', want && !audio.paused); });

  function init() {
    var list = $('tracks');
    TRACKS.forEach(function (t, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="t"></span><span class="a"></span>';
      b.querySelector('.t').textContent = t.title; b.querySelector('.a').textContent = t.artist;
      b.addEventListener('click', function () { play(i); });
      li.appendChild(b); list.appendChild(li);
    });
    $('np-play').addEventListener('click', toggle);
    $('deck-play').addEventListener('click', toggle);
    $('deck-next').addEventListener('click', function () { if (want) play(idx + 1); else load(idx + 1, false); });
    [].forEach.call(document.querySelectorAll('[data-play]'), function (b) {
      b.addEventListener('click', function () { var i = +b.getAttribute('data-play'); if (want && idx === i && !audio.paused) pause(); else play(i); });
    });
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', function () { play(); });
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('nexttrack', function () { play(idx + 1); });
        navigator.mediaSession.setActionHandler('previoustrack', function () { play(idx - 1); });
      } catch (e) {}
    }
    load(0, false);

    var epBtn = $('ep-play');
    epBtn.disabled = true;
    findEpisode().then(function (e) {
      episode = e;
      if (!e) { epBtn.textContent = 'Snippet unavailable right now'; $('ep-title').textContent = 'New episodes every week on YouTube and Spotify.'; return; }
      epBtn.disabled = false;
      $('ep-title').textContent = e.title;
      var d = new Date(e.date);
      if (!isNaN(d)) $('ep-lbl').textContent = 'THE LATEST EPISODE · ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
      if (e.page) $('pod-ap').href = e.page;
    });
    epBtn.addEventListener('click', playPod);
  }

  window.Radio = { init: init, play: play, pause: pause };
})();
