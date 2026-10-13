/* The day itself: scroll position becomes a time between 9am and 8pm, which moves the sun and paints the sky.
   Also: the radio drawer, the building's rooms, the Billie Jean floor, the prompter and the freeze frame. */
(function () {
  // Her Substack. Paste the full address between the quotes and the button appears at the end of the day.
  var SUBSTACK_URL = '';

  var root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }

  /* ---------- the day: scroll -> hour -> sky, sun, clock ---------- */
  var SKY = [ // hour, top, middle, bottom of the sky
    [9, '#a9d6f0', '#d6ecf5', '#f7e6bf'], [11, '#6db7e8', '#bfe0f2', '#e9f1ec'], [13, '#3f9fe0', '#9fd0f0', '#dcecf2'],
    [15, '#5ea8d9', '#b5d3e2', '#efdcb4'], [17, '#6b9fcf', '#d7c9a8', '#f4c07f'], [18.4, '#4c6aa3', '#e39a6d', '#f6b06a'],
    [19.1, '#26335f', '#8a4c6a', '#e2845d'], [19.6, '#121c3c', '#1e2a52', '#3b3f6b'], [20, '#0b1330', '#111b3a', '#18234a']];
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  SKY = SKY.map(function (k) { return [k[0], hex(k[1]), hex(k[2]), hex(k[3])]; });
  function mix(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
  function rgb(c) { return 'rgb(' + c.join(',') + ')'; }
  function skyAt(h) {
    if (h <= SKY[0][0]) return SKY[0];
    for (var i = 0; i < SKY.length - 1; i++) {
      var a = SKY[i], b = SKY[i + 1];
      if (h <= b[0]) { var t = (h - a[0]) / (b[0] - a[0]); return [h, mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)]; }
    }
    return SKY[SKY.length - 1];
  }
  var marks = [], anchors = [], current = null, lastHour = -1, sun, stars, clock, ampm;
  var INK = hex('#14213d'), CREAM = hex('#f6efe0'), SUN = hex('#ffc928'), DUSK = hex('#ff8a3d');
  function measure() { anchors = marks.map(function (el) { return { el: el, top: el.getBoundingClientRect().top + scrollY, h: +el.dataset.hour }; }); }
  function hourNow() {
    var max = Math.max(1, root.scrollHeight - innerHeight), p = Math.min(1, Math.max(0, scrollY / max));
    var ramp = Math.min(1, Math.max(0, (p - 0.86) / 0.14)), mark = scrollY + innerHeight * (0.3 + 0.7 * ramp), i = 0;  // reading line near the top; it slides to the bottom over the last stretch so the day ends at 8pm
    for (var k = 0; k < anchors.length; k++) { if (anchors[k].top <= mark) i = k; }
    var a = anchors[i], b = anchors[i + 1];
    current = a;
    if (!b || a.top > mark) return a.h;
    return a.h + (b.h - a.h) * Math.min(1, (mark - a.top) / Math.max(1, b.top - a.top));
  }
  function paint(force) {
    if (!anchors.length) return;
    var h = hourNow(); if (!force && Math.abs(h - lastHour) < 0.001) return; lastHour = h;
    var s = skyAt(h);
    root.style.setProperty('--sky-top', rgb(s[1])); root.style.setProperty('--sky-mid', rgb(s[2])); root.style.setProperty('--sky-bot', rgb(s[3]));
    root.style.setProperty('--haze', rgb(mix(s[2], s[1], .35)));
    var dark = Math.min(1, Math.max(0, (h - 18.95) / 0.5));
    root.style.setProperty('--ink', rgb(mix(INK, CREAM, dark)));
    stars.style.opacity = Math.min(1, Math.max(0, (h - 19.2) / 0.6));
    var t = (h - 6.5) / (19.05 - 6.5), W = innerWidth, H = innerHeight, size = sun.offsetWidth;  // sunrise 6:30, sunset 7:03
    var x = W * (0.04 + 0.9 * Math.min(1.05, t)) - size / 2, y = H * 0.9 - Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * H * 0.74 - size / 2;
    if (t > 1) y += (t - 1) * H * 6;
    sun.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    sun.style.background = rgb(mix(SUN, DUSK, Math.min(1, Math.max(0, (h - 17) / 1.8))));
    var hh = Math.floor(h), mm = Math.floor((h - hh) * 60), h12 = ((hh + 11) % 12) + 1;
    clock.textContent = h12 + ':' + (mm < 10 ? '0' : '') + mm; ampm.textContent = hh < 12 ? 'AM' : 'PM';
    updateProgramme();
  }

  /* ---------- the radio drawer ---------- */
  var dial, onair, prog;
  function fmt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); return (((hh + 11) % 12) + 1) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? 'am' : 'pm'); }
  function updateProgramme() {
    if (!dial || dial.hidden || !current) return;
    [].forEach.call(prog.children, function (li) { li.classList.toggle('now', li.dataset.id === current.el.id); });
  }
  function openDial() { dial.hidden = false; onair.setAttribute('aria-expanded', 'true'); updateProgramme(); }
  function closeDial() { dial.hidden = true; onair.setAttribute('aria-expanded', 'false'); }

  /* ---------- the building ---------- */
  var ROOMS = {
    bedroom: { h: 'Her room', p: 'A Michael Jackson poster, a sequined glove on the shelf, and the yellow duvet.', t: '1:00pm · The Michael hour', href: '#mj' },
    tv: { h: 'The TV room', p: 'Demon Slayer on the screen. Black Clover, Jujutsu Kaisen and JoJo on the wall.', t: '2:30pm · Anime marathon', href: '#anime' },
    kitchen: { h: 'The kitchen', p: 'Alfredo on the stove, the radio on, and ShxtsnGigs playing from her phone.', t: '10:00am · The kitchen', href: '#kitchen' },
    desk: { h: 'The desk', p: 'Sketches pinned up, her laptop open, and books on the floor.', t: '11:30am · The desk', href: '#desk' },
    sitting: { h: 'The sitting room', p: 'Old Nollywood on the telly and a Sollywood poster on the wall. Part 2 is on the next tape.', t: '6:15pm · Double feature', href: '#double' },
    stair: { h: 'The stairwell', p: 'Playbills from the shows she has seen, and a cartoon or two.', t: '4:00pm · The matinée', href: '#matinee' }
  };
  function building() {
    var set = $('set'), wrap = $('setwrap'), tag = $('tag'), active = null;
    function show(g) {
      if (active) active.classList.remove('active');
      active = g; g.classList.add('active'); set.classList.add('has-active');
      var r = ROOMS[g.dataset.room], bb = g.querySelector('.hit').getBBox(), vb = set.viewBox.baseVal;
      $('tag-h').textContent = r.h; $('tag-p').textContent = r.p; $('tag-a').textContent = r.t + ' →'; $('tag-a').href = r.href; tag.hidden = false;
      var cx = (bb.x + bb.width / 2 - vb.x) / vb.width * 100, top = (bb.y - vb.y) / vb.height * 100 + 3;
      var w = wrap.clientWidth, tw = tag.offsetWidth, px = cx / 100 * w, clamped = Math.min(w - tw / 2 - 4, Math.max(tw / 2 + 4, px));
      tag.style.left = clamped + 'px'; tag.style.top = top + '%';
      tag.style.setProperty('--nub', (50 + (px - clamped) / tw * 100) + '%');
    }
    function hide() { if (active) active.classList.remove('active'); active = null; set.classList.remove('has-active'); tag.hidden = true; }
    function fit() { set.setAttribute('viewBox', wrap.clientWidth < 640 ? '270 96 660 640' : '0 0 1200 760'); hide(); }
    [].forEach.call(set.querySelectorAll('.room'), function (g) {
      g.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(g); });
      g.addEventListener('click', function (e) { e.stopPropagation(); if (active === g && e.pointerType !== 'mouse') location.hash = ROOMS[g.dataset.room].href; else show(g); });
      g.addEventListener('focus', function () { show(g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.hash = ROOMS[g.dataset.room].href; } });
    });
    wrap.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) hide(); });
    addEventListener('resize', fit); fit();
  }

  /* ---------- the Billie Jean floor ---------- */
  function floor() {
    var cv = $('floor'), ctx = cv.getContext('2d'), COLS = 11, ROWS = 6, P = 1.45, lit = new Float32Array(COLS * ROWS),
      W = 0, H = 0, lastPointer = 0, walker = { c: 0, r: 3, d: 1, t: 0 }, running = false, prev = 0, visible = false;
    function size() { var d = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); draw(); }
    function geo() { var narrow = W < 600; return { yT: H * .03, yB: H * .98, wT: W * (narrow ? .62 : .5), wB: W * (narrow ? 1.15 : 1) }; }
    function wAt(g, y) { return g.wT + (g.wB - g.wT) * (y - g.yT) / (g.yB - g.yT); }
    function rowY(g, u) { return g.yT + (g.yB - g.yT) * Math.pow(u, P); }
    function pt(g, u, v) { var y = rowY(g, v), w = wAt(g, y); return [W / 2 - w / 2 + w * u, y]; }
    function draw() {
      if (!W) return; ctx.clearRect(0, 0, W, H); var g = geo();
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
        var a = pt(g, c / COLS, r / ROWS), b = pt(g, (c + 1) / COLS, r / ROWS), e = pt(g, (c + 1) / COLS, (r + 1) / ROWS), d = pt(g, c / COLS, (r + 1) / ROWS);
        var mx = (a[0] + b[0] + e[0] + d[0]) / 4, my = (a[1] + b[1] + e[1] + d[1]) / 4, k = .88;
        var q = function (p) { return [mx + (p[0] - mx) * k, my + (p[1] - my) * k]; };
        var A = q(a), B = q(b), E = q(e), D = q(d), v = lit[r * COLS + c];
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(E[0], E[1]); ctx.lineTo(D[0], D[1]); ctx.closePath();
        ctx.globalAlpha = .55 + .45 * (r / ROWS); ctx.fillStyle = rgb(mix([27, 37, 71], [255, 244, 194], v));
        if (v > .25) { ctx.shadowColor = 'rgba(255,215,90,' + (v * .9).toFixed(2) + ')'; ctx.shadowBlur = 24 * v; } else ctx.shadowBlur = 0;
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    function pick(x, y) { var g = geo(); if (y < g.yT || y > g.yB) return -1; var u = Math.pow((y - g.yT) / (g.yB - g.yT), 1 / P), r = Math.min(ROWS - 1, Math.floor(u * ROWS)), w = wAt(g, y), c = Math.floor((x - (W / 2 - w / 2)) / w * COLS); return (c < 0 || c >= COLS) ? -1 : r * COLS + c; }
    function step(e) { var b = cv.getBoundingClientRect(), i = pick(e.clientX - b.left, e.clientY - b.top); lastPointer = performance.now(); if (i >= 0) { lit[i] = 1; if (reduce) draw(); else kick(); } }
    cv.addEventListener('pointermove', step); cv.addEventListener('pointerdown', step);
    function frame(now) {
      var dt = Math.min(.1, (now - prev) / 1000 || 0); prev = now;
      for (var i = 0; i < lit.length; i++) lit[i] *= Math.pow(.2, dt);
      if (now - lastPointer > 2200) {
        walker.t += dt;
        if (walker.t > .36) {
          walker.t = 0; lit[walker.r * COLS + walker.c] = 1;
          var below = (walker.r + 1) * COLS + walker.c; lit[below] = Math.max(lit[below], .55);
          walker.c += walker.d; if (walker.c >= COLS || walker.c < 0) { walker.d *= -1; walker.c += walker.d * 2; walker.r = walker.r === 3 ? 1 : 3; }
        }
      }
      draw(); if (running) requestAnimationFrame(frame);
    }
    function kick() { if (!running && visible) { running = true; prev = performance.now(); requestAnimationFrame(frame); } }
    if (reduce) { for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) if ((r + c) % 4 === 0) lit[r * COLS + c] = .8; }
    new ResizeObserver(size).observe(cv);
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !reduce) kick(); else running = false; }).observe(cv);
  }

  document.addEventListener('DOMContentLoaded', function () {
    sun = document.querySelector('.sun'); stars = document.querySelector('.stars'); clock = $('clock'); ampm = $('ampm');
    marks = [].slice.call(document.querySelectorAll('[data-hour]'));
    dial = $('dial'); onair = $('onair'); prog = $('prog');

    marks.filter(function (el) { return el.id !== 'end'; }).forEach(function (el) {
      var li = document.createElement('li'), a = document.createElement('a');
      li.dataset.id = el.id; a.href = '#' + el.id;
      a.innerHTML = '<span class="t">' + fmt(+el.dataset.hour) + '</span><span class="n"></span>';
      a.querySelector('.n').textContent = el.dataset.name;
      a.addEventListener('click', closeDial);
      li.appendChild(a); prog.appendChild(li);
    });
    $('dialx').addEventListener('click', closeDial);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDial(); });
    // Benson: press ON AIR six times fast and you're fired.
    var presses = [], fired = $('fired');
    onair.addEventListener('click', function () {
      dial.hidden ? openDial() : closeDial();
      var now = Date.now(); presses = presses.filter(function (t) { return now - t < 2600; }); presses.push(now);
      if (presses.length >= 6) { presses = []; closeDial(); fired.classList.add('show'); setTimeout(function () { fired.classList.remove('show'); }, 1600); }
    });

    if (SUBSTACK_URL) { var s = $('substack'); s.href = SUBSTACK_URL; s.hidden = false; }

    [building, floor, function () { Radio.init(); }, function () { Media.start(); }].forEach(function (f) {
      try { f(); } catch (e) { if (window.console) console.error(e); }
    });

    var ticking = false;
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; paint(); }); } }, { passive: true });
    function remeasure() { measure(); paint(true); }
    addEventListener('resize', remeasure); addEventListener('load', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.querySelector('main'));
    remeasure();

    /* the prompter, and the freeze frame at the very end */
    var prompter = $('prompter'), idle;
    function wake() {
      prompter.classList.remove('show'); clearTimeout(idle);
      idle = setTimeout(function () {
        var next = anchors.filter(function (a) { return a.top > scrollY + innerHeight * .6 && a.el.id !== 'end'; })[0];
        prompter.textContent = next ? '…line? (Next: ' + next.el.dataset.name + ')' : '…line? (Scroll up. Tomorrow starts at 9.)';
        prompter.classList.add('show');
      }, 14000);
    }
    ['scroll', 'pointermove', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); }); wake();
    new IntersectionObserver(function (en) { document.body.classList.toggle('frozen', en[0].isIntersecting); }, { threshold: .9 }).observe($('tbc'));
  });
})();
