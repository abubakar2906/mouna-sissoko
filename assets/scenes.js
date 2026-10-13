/* The rooms: kitchen recipes with oven timers, the sketchbook, the anime shelf, the lighting desk,
   the cartoon break, the double-feature telly and the strangers at golden hour. */
(function () {
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- oven timer (lives under the clock) ---------------- */
  var Oven = (function () {
    var btn, end = 0, label = '', tick = null, ctx = null;
    function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
    function ding() {
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        [0, .35, .7].forEach(function (t) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.frequency.value = 1320; o.type = 'sine'; o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + .02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + .3);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .32);
        });
      } catch (e) {}
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    function render() {
      var left = Math.max(0, Math.round((end - Date.now()) / 1000));
      if (left > 0) { btn.className = 'oven'; btn.innerHTML = 'OVEN ' + fmt(left) + ' <i>' + label + ' · tap to stop</i>'; }
      else { btn.className = 'oven done'; btn.innerHTML = 'DONE! <i>' + label + ' · tap to clear</i>'; clearInterval(tick); tick = null; ding(); }
    }
    function start(min, what) {
      btn = btn || $('oven');
      try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) {}  // unlock sound on this tap
      end = Date.now() + min * 60000; label = what; btn.hidden = false;
      clearInterval(tick); tick = setInterval(render, 1000); render();
    }
    function stop() { clearInterval(tick); tick = null; btn.hidden = true; }
    document.addEventListener('DOMContentLoaded', function () { btn = $('oven'); btn.addEventListener('click', stop); });
    return { start: start };
  })();

  /* ---------------- 10:00 kitchen ---------------- */
  var RECIPES = [
    { id: 'alfredo', name: 'Alfredo pasta', serves: '2 to 3', time: '25 min', heat: 'Hob',
      blurb: 'Butter, garlic, cream and a lot of parmesan, tossed through fettuccine. It waits for nobody, so get everyone to the table first.',
      groups: [{ h: null, items: ['250g fettuccine', '2 tbsp butter', '3 cloves garlic, finely chopped', '300ml double (heavy) cream', '80g parmesan, finely grated, plus extra to serve', 'Salt and black pepper', 'A pinch of nutmeg', 'A handful of parsley, chopped', 'Optional: 2 chicken breasts, seasoned, pan-fried and sliced'] }],
      steps: [
        ['Bring a big pot of well-salted water to the boil. Cook the fettuccine until just al dente. Save a cup of the pasta water before you drain it.', 10, 'Pasta'],
        ['While it cooks, melt the butter in a wide pan over a medium-low heat. Add the garlic and stir until it smells good, before it browns.', 1, 'Garlic'],
        ['Pour in the cream and let it simmer gently until it thickens slightly.', 4, 'Cream'],
        ['Turn the heat right down. Stir in the parmesan a handful at a time until the sauce is smooth. Season with pepper, a little salt and the nutmeg.'],
        ['Add the drained pasta (and the chicken, if you’re using it). Toss, loosening with splashes of pasta water until the sauce coats every strand.'],
        ['Finish with parsley and more parmesan. Eat straight away.']
      ] },
    { id: 'bbq', name: 'Sticky honey barbecue chicken', serves: '4', time: '1 hr 10 min', heat: 'Oven 200°C',
      blurb: 'Roasted chicken in a honey barbecue glaze that goes dark and sticky at the edges, with buttery mash and proper gravy.',
      groups: [
        { h: 'Chicken', items: ['1kg chicken drumsticks or wings', '1 tbsp oil', '1 tsp smoked paprika', '1 tsp garlic powder', '1 tsp onion powder', '1 tsp salt and ½ tsp black pepper'] },
        { h: 'Sticky glaze', items: ['120ml barbecue sauce', '4 tbsp honey', '2 tbsp soy sauce', '1 tbsp butter', '1 clove garlic, grated'] },
        { h: 'Mash', items: ['1kg Irish potatoes, peeled and cut into chunks', '60g butter', '120ml warm milk', 'Salt and pepper'] },
        { h: 'Gravy', items: ['2 tbsp butter', '2 tbsp plain flour', '400ml chicken stock (or 1 stock cube in hot water)', '1 tsp soy sauce', 'Any juices from the roasting tray'] }
      ],
      steps: [
        ['Heat the oven to 200°C. Toss the chicken with the oil, spices, salt and pepper. Roast on a lined tray.', 25, 'Chicken'],
        ['Meanwhile, simmer all the glaze ingredients in a small pan until syrupy.', 5, 'Glaze'],
        ['Boil the potatoes in salted water until a knife slides in easily.', 18, 'Potatoes'],
        ['Brush the chicken all over with glaze, turn it, glaze again and roast. Glaze once more halfway, until it is sticky and charred at the edges.', 15, 'Chicken'],
        ['Drain the potatoes and let them steam dry for a couple of minutes. Mash with the butter and warm milk, then season.'],
        ['For the gravy, melt the butter, whisk in the flour and cook until golden. Whisk in the stock a little at a time, add the soy sauce and the tray juices, and simmer until thick.', 5, 'Gravy'],
        ['Mash on the plate, chicken on top, gravy over the mash, and the last of the glaze over the chicken.']
      ] },
    { id: 'burrito', name: 'Chicken burritos', serves: '4', time: '40 min', heat: 'Hob',
      blurb: 'Lime rice, spiced chicken, peppers and beans, rolled tight and toasted so they hold together.',
      groups: [
        { h: 'Lime rice', items: ['200g long-grain rice', '1 lime, zest and juice', 'A handful of coriander, chopped', 'Salt'] },
        { h: 'Filling', items: ['500g boneless chicken thighs, sliced', '1 tbsp oil', '1 onion, sliced', '1 red bell pepper, sliced', '2 tsp chilli powder', '1 tsp cumin', '1 tsp smoked paprika', '1 tsp garlic powder', '1 tin (400g) black beans or kidney beans, drained', 'Salt'] },
        { h: 'To wrap', items: ['4 large flour tortillas', '100g grated cheddar', 'Sour cream', 'Salsa or chopped tomatoes', 'Shredded lettuce', 'Hot sauce'] }
      ],
      steps: [
        ['Cook the rice. Stir the lime zest and juice, coriander and a pinch of salt through it.', 15, 'Rice'],
        ['Toss the chicken with the spices and salt. Fry in the hot oil until browned and cooked through.', 7, 'Chicken'],
        ['Add the onion and pepper and cook until soft. Stir in the beans with a splash of water and warm through.', 4, 'Peppers'],
        ['Warm each tortilla in a dry pan for 20 to 30 seconds a side so it folds without cracking.'],
        ['Fill down the middle: rice, chicken, cheese, sour cream, salsa, lettuce. Fold in the sides, then roll tightly away from you.'],
        ['Toast seam-side down in the pan so it seals, then cut in half.', 2, 'Burrito']
      ] }
  ];
  function kitchen() {
    var menu = $('menu'), out = $('recipe-out');
    RECIPES.forEach(function (r, i) {
      var li = el('li'), b = el('button', null, r.name);
      b.setAttribute('role', 'tab'); b.id = 'tab-' + r.id; b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { show(i); });
      li.appendChild(b); menu.appendChild(li);
    });
    function show(i) {
      var r = RECIPES[i];
      [].forEach.call(menu.querySelectorAll('button'), function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      out.setAttribute('aria-labelledby', 'tab-' + r.id);
      out.innerHTML = '';
      var dish = el('div', 'dish');
      dish.appendChild(el('h3', null, r.name));
      dish.appendChild(el('p', 'blurb', r.blurb));
      var facts = el('ul', 'facts');
      [['Serves', r.serves], ['Time', r.time], ['Heat', r.heat]].forEach(function (f) { var li = el('li'); li.appendChild(document.createTextNode(f[0] + ' ')); li.appendChild(el('b', null, f[1])); facts.appendChild(li); });
      dish.appendChild(facts);
      var grid = el('div', 'recipe'), left = el('div'), right = el('div');
      left.appendChild(el('h4', null, 'You will need'));
      r.groups.forEach(function (g, gi) {
        if (g.h) left.appendChild(el('h5', null, g.h));
        var ul = el('ul', 'ingr');
        g.items.forEach(function (it, ii) {
          var li = el('li'), lab = el('label'), cb = el('input');
          cb.type = 'checkbox'; cb.id = 'i-' + r.id + '-' + gi + '-' + ii;
          lab.htmlFor = cb.id; lab.appendChild(cb); lab.appendChild(el('span', null, it));
          li.appendChild(lab); ul.appendChild(li);
        });
        left.appendChild(ul);
      });
      right.appendChild(el('h4', null, 'Method'));
      var ol = el('ol', 'steps');
      r.steps.forEach(function (s) {
        var li = el('li'), body = el('div');
        body.appendChild(el('p', null, s[0]));
        if (s[1]) {
          var b = el('button', 'btn btn-ink', '⏲ ' + s[1] + ' min timer');
          b.addEventListener('click', function () { Oven.start(s[1], s[2]); });
          body.appendChild(b);
        }
        li.appendChild(body); ol.appendChild(li);
      });
      right.appendChild(ol);
      grid.appendChild(left); grid.appendChild(right);
      dish.appendChild(grid);
      out.appendChild(dish);
    }
    show(0);
  }

  /* ---------------- 11:30 sketchbook ---------------- */
  var PROMPTS = ['Draw the view from your window.', 'Draw a stranger you saw today.', 'Draw Tanjiro from memory. No peeking.',
    'Draw the Abuja skyline with your eyes closed.', 'Draw your favourite meal, plated.', 'Draw Michael mid-lean.',
    'Draw the last person who made you laugh.', 'Draw a theatre seat, from the back row.', 'Draw your hand holding this pencil.'];
  function sketch() {
    var cv = $('pad'), ctx = cv.getContext('2d'), ink = '#14213d', drawing = false, last = null, pi = 0, dpr = 1, W = 0, H = 0;
    function size() {
      var r = cv.getBoundingClientRect(); if (!r.width) return;
      var keep = W ? ctx.getImageData(0, 0, cv.width, cv.height) : null, oldW = cv.width, oldH = cv.height;
      dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      if (keep) { var tmp = document.createElement('canvas'); tmp.width = oldW; tmp.height = oldH; tmp.getContext('2d').putImageData(keep, 0, 0); ctx.drawImage(tmp, 0, 0, cv.width, cv.height); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, p: e.pressure || .5 }; }
    cv.addEventListener('pointerdown', function (e) { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); dot(last); });
    cv.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); line(last, p); last = p; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { cv.addEventListener(t, function () { drawing = false; }); });
    function width(p) { return (ink === 'erase' ? 22 : ink === '#ffc928' ? 10 : 2.6) * dpr * (0.6 + p.p * 0.8); }
    function style() { ctx.strokeStyle = ctx.fillStyle = ink === 'erase' ? '#fff' : ink; ctx.globalAlpha = ink === '#ffc928' ? .55 : 1; }
    function dot(p) { style(); ctx.beginPath(); ctx.arc(p.x, p.y, width(p) / 2, 0, Math.PI * 2); ctx.fill(); }
    function line(a, b) { style(); ctx.lineWidth = width(b); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    [].forEach.call(document.querySelectorAll('[data-ink]'), function (b) {
      b.addEventListener('click', function () {
        ink = b.getAttribute('data-ink');
        [].forEach.call(document.querySelectorAll('[data-ink]'), function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      });
    });
    $('pad-new').addEventListener('click', function () { ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); });
    $('pad-save').addEventListener('click', function () {
      var a = document.createElement('a'); a.download = 'sketch-for-mouna.png'; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
    });
    $('prompt-next').addEventListener('click', function () { pi = (pi + 1) % PROMPTS.length; $('prompt-card').textContent = PROMPTS[pi]; });
    new ResizeObserver(size).observe(cv);
  }

  /* ---------------- 2:30 anime: the 1000 − 7 counter ---------------- */
  function anime() {
    var g = $('ghoul'), n = 1000, t = null, show = g.closest('.show');
    function run() { if (t) return; n = 1000; g.textContent = n; t = setInterval(function () { n -= 7; if (n < 0) { n = 1000; } g.textContent = n; }, 380); }
    function stop() { clearInterval(t); t = null; }
    show.addEventListener('mouseenter', run); show.addEventListener('mouseleave', stop);
    show.addEventListener('focus', run); show.addEventListener('blur', stop);
    // on phones, a tap shows the effect for a few seconds
    [].forEach.call(document.querySelectorAll('.show'), function (s) {
      s.addEventListener('click', function () {
        s.classList.add('poke'); if (s === show) run();
        clearTimeout(s.__p); s.__p = setTimeout(function () { s.classList.remove('poke'); if (s === show) stop(); }, 3000);
      });
    });
  }

  /* ---------------- 4:00 lighting desk ---------------- */
  var CUES = [
    { n: 'PRESET', call: 'Preset. House lights up, ghost light on. The audience is finding its seats.', v: { house: 100, wash: 15, spot: 0, gel: 30 } },
    { n: 'Q1 · HOUSE TO HALF', call: '"Standby cue one… cue one, GO." The chatter drops.', v: { house: 50, wash: 15, spot: 0, gel: 30 } },
    { n: 'Q2 · HOUSE OUT', call: 'House out. Total darkness for a breath. Someone coughs.', v: { house: 0, wash: 0, spot: 0, gel: 30 } },
    { n: 'Q3 · LIGHTS UP', call: 'Lights up on the stage. Warm amber, like late afternoon.', v: { house: 0, wash: 85, spot: 0, gel: 15 } },
    { n: 'Q4 · SPOT', call: 'The wash dims and the follow spot finds her. The monologue.', v: { house: 0, wash: 30, spot: 100, gel: 60 } },
    { n: 'Q5 · BLUE STATE', call: 'Cool blue. Night has fallen in the play.', v: { house: 0, wash: 70, spot: 30, gel: 100 } },
    { n: 'Q6 · BLACKOUT', call: 'Blackout. The end of the act.', v: { house: 0, wash: 0, spot: 0, gel: 100 } },
    { n: 'Q7 · CURTAIN CALL', call: 'Everything up for the bows. She is already on her feet.', v: { house: 35, wash: 100, spot: 60, gel: 0 } }
  ];
  function theatre() {
    var th = $('theatre'), ids = ['house', 'wash', 'spot', 'gel'], cur = 0, anim = null;
    function apply(v) { ids.forEach(function (k) { th.style.setProperty('--' + k, (v[k] / 100).toFixed(3)); $('f-' + k).value = v[k]; }); }
    function read() { var v = {}; ids.forEach(function (k) { v[k] = +$('f-' + k).value; }); return v; }
    function fade(to, ms) {
      cancelAnimationFrame(anim);
      var from = read(), t0 = performance.now();
      if (reduce) { apply(to); return; }
      (function step(now) {
        var p = Math.min(1, (now - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, v = {};
        ids.forEach(function (k) { v[k] = from[k] + (to[k] - from[k]) * e; }); apply(v);
        if (p < 1) anim = requestAnimationFrame(step);
      })(t0);
    }
    function cue(i) { cur = i; var c = CUES[i]; $('qname').textContent = c.n; $('callout').textContent = c.call; fade(c.v, i === 2 || i === 6 ? 500 : 1400); }
    ids.forEach(function (k) { $('f-' + k).addEventListener('input', function () { cancelAnimationFrame(anim); apply(read()); $('qname').textContent = 'MANUAL'; }); });
    $('cue-go').addEventListener('click', function () { cue((cur + 1) % CUES.length); });
    $('cue-bo').addEventListener('click', function () { cancelAnimationFrame(anim); apply({ house: 0, wash: 0, spot: 0, gel: read().gel }); $('qname').textContent = 'BLACKOUT'; $('callout').textContent = 'Blackout. Press GO to carry on.'; });
    apply(CUES[0].v);
  }

  /* ---------------- 5:00 weeks of ShxtsnGigs ---------------- */
  function weeks() { $('weeks').textContent = Math.floor((Date.now() - new Date(2023, 11, 1)) / (7 * 864e5)); }

  /* ---------------- 5:45 nonsense ---------------- */
  function nonsense() {
    var btn = $('nonsense'), on = false;
    btn.addEventListener('click', function () {
      if (on) return; on = true; document.body.classList.add('nonsense');
      var shout = el('div', 'shout', 'OOOOOOOH!'); document.body.appendChild(shout);
      var eyes = [];
      var targets = [].slice.call(document.querySelectorAll('main h2, main h3, .time, .ph')).filter(function (t) {
        var r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 30;
      }).slice(0, 14);
      targets.forEach(function (t) {
        var r = t.getBoundingClientRect(), g = el('div', 'googly'), s = 16 + Math.random() * 18;
        g.style.left = (r.left + scrollX + Math.random() * Math.max(10, r.width - 60)) + 'px';
        g.style.top = (r.top + scrollY + Math.random() * Math.max(4, r.height - 30)) + 'px';
        g.style.setProperty('--s', s + 'px');
        for (var k = 0; k < 2; k++) { var i = el('i'); i.style.setProperty('--px', (10 + Math.random() * 45) + '%'); i.style.setProperty('--py', (10 + Math.random() * 45) + '%'); g.appendChild(i); }
        document.body.appendChild(g); eyes.push(g);
      });
      setTimeout(function () { shout.remove(); }, 1400);
      setTimeout(function () { document.body.classList.remove('nonsense'); eyes.forEach(function (g) { g.remove(); }); on = false; btn.textContent = 'Seriously, do not press this'; }, 5200);
    });
  }

  /* ---------------- 6:15 double feature ---------------- */
  var FILMS = [
    [ { t: 'Living in Bondage', y: 1992, m: 'Kenneth Okonkwo · dir. Chris Obi Rapu', w: 'The money ritual that started modern Nollywood. Released straight to VHS, copied everywhere.' },
      { t: 'Sharon Stone', y: 2002, m: 'Genevieve Nnaji', w: 'Genevieve Nnaji at peak old-Nollywood glamour, breaking hearts on purpose.' },
      { t: 'Osuofia in London', y: 2003, m: 'Nkem Owoh', w: 'A village man inherits his brother’s estate and goes to London to claim it. Quoted in every Nigerian household since.' },
      { t: 'The Figurine', y: 2009, m: 'dir. Kunle Afolayan', w: 'A cursed statue found in a shrine, seven years of luck, and the bill that comes after.' },
      { t: 'October 1', y: 2014, m: 'dir. Kunle Afolayan', w: 'A detective hunts a killer in a northern town in the weeks before independence. New, but it feels like an old tape.' } ],
    [ { t: 'Sarafina!', y: 1992, m: 'Leleti Khumalo · Whoopi Goldberg', w: 'The Soweto uprising as a musical, adapted from Mbongeni Ngema’s stage show. Theatre and cinema at once.' },
      { t: 'Yesterday', y: 2004, m: 'Leleti Khumalo · dir. Darrell Roodt', w: 'A mother in rural KwaZulu-Natal, told in isiZulu. Nominated for the Oscar for Best Foreign Language Film.' },
      { t: 'Tsotsi', y: 2005, m: 'Presley Chweneyagae · dir. Gavin Hood', w: 'A Johannesburg gangster finds a baby in the back of a car he has stolen. Won the Oscar for Best Foreign Language Film.' },
      { t: 'Jerusalema', y: 2008, m: 'Rapulana Seiphemo · dir. Ralph Ziman', w: 'A small-time hustler becomes a Hillbrow slumlord, one hijacked building at a time.' },
      { t: 'Five Fingers for Marseilles', y: 2017, m: 'Vuyo Dabula · dir. Michael Matthews', w: 'A western, set in the Eastern Cape, about a man coming home to the town he swore to protect.' } ]
  ];
  function telly() {
    var ch = 0, i = 0, card = $('screen-card'), screen = $('screen'), snow = $('snow'), sctx = snow.getContext('2d'), list = $('tapes');
    FILMS.forEach(function (set, c) {
      list.appendChild(el('h4', null, c ? 'CH 2 · SOLLYWOOD' : 'CH 1 · NOLLYWOOD'));
      var ul = el('ul', 'tapes');
      set.forEach(function (f, j) {
        var li = el('li'); li.dataset.k = c + '-' + j;
        li.appendChild(el('span', 'y', f.y));
        var b = el('button', null, f.t); b.addEventListener('click', function () { tune(c, j); });
        li.appendChild(b); ul.appendChild(li);
      });
      list.appendChild(ul);
    });
    function draw() {
      var f = FILMS[ch][i];
      card.innerHTML = '';
      var top = el('div', 'ch'); top.appendChild(el('span', null, 'CH ' + (ch + 1) + ' · ' + (ch ? 'SOLLYWOOD' : 'NOLLYWOOD'))); top.appendChild(el('span', null, 'PART ' + (i + 1)));
      var mid = el('div'); mid.appendChild(el('p', 'ft', f.t)); mid.appendChild(el('p', 'meta', f.y + ' · ' + f.m)); mid.appendChild(el('p', 'why', f.w));
      card.appendChild(top); card.appendChild(mid); card.appendChild(el('div', 'tbc', 'TO BE CONTINUED…'));
      [].forEach.call(document.querySelectorAll('[data-ch]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-ch') === ch ? 'true' : 'false'); });
      [].forEach.call(list.querySelectorAll('li'), function (li) { li.classList.toggle('on', li.dataset.k === ch + '-' + i); });
    }
    function fuzz(ms, then) {
      if (reduce) { then(); return; }
      var r = snow.getBoundingClientRect(), w = snow.width = Math.max(80, Math.round(r.width / 3)), h = snow.height = Math.max(60, Math.round(r.height / 3));
      var t0 = performance.now(), img = sctx.createImageData(w, h); screen.classList.add('static');
      (function f(now) {
        for (var p = 0; p < img.data.length; p += 4) { var v = Math.random() * 255; img.data[p] = img.data[p + 1] = img.data[p + 2] = v; img.data[p + 3] = 255; }
        sctx.putImageData(img, 0, 0);
        if (now - t0 > ms / 2 && then) { then(); then = null; }
        if (now - t0 < ms) requestAnimationFrame(f); else screen.classList.remove('static');
      })(t0);
    }
    function tune(c, j) { fuzz(320, function () { ch = c; i = j; draw(); }); }
    [].forEach.call(document.querySelectorAll('[data-ch]'), function (b) { b.addEventListener('click', function () { tune(+b.getAttribute('data-ch'), 0); }); });
    $('tape-next').addEventListener('click', function () { tune(ch, (i + 1) % FILMS[ch].length); });
    draw();
  }

  /* ---------------- 6:45 strangers ---------------- */
  var STORIES = {
    taxi: ['The taxi driver', 'Green and white Corolla, nineteen years on the same roads. He has driven three ministers, one bride who changed her mind, and a man who cried all the way to the airport. He is thinking about none of them. He is thinking about whether his daughter has eaten.'],
    corn: ['The woman roasting corn', 'Every cob she sells tonight pays for a page of her son’s WAEC textbooks. She knows exactly how many pages are left. She smiles at every customer anyway, because some of them look like they need it more than she does.'],
    family: ['Third floor, the lit window', 'A family is arguing about whose turn it is to wash the plates. In ten years it will be the story they tell at every wedding.'],
    corper: ['The corper in khaki', 'Walking home from his place of primary assignment, rehearsing how to tell his mother he wants to stay in Abuja after service. He has rehearsed it eleven times. In every version, she says yes.'],
    suya: ['The suya spot under the bulb', 'Mallam has been slicing beef on this corner for longer than the streetlight has worked. Two of his regulars met at this table years ago. He gave them extra yaji the night they got engaged. They don’t know he remembers.'],
    guard: ['The gateman next door', 'A Hausa radio drama on a small red transistor, volume low. He knows every car that comes in and out of this compound. Nobody in the compound knows the name of his village.'],
    corolla: ['The woman in the silver Corolla', 'Stuck in go-slow, rewriting her resignation letter in her head. Draft nine is the one. She will send draft four.'],
    boy: ['The boy on the balcony', 'Counting planes coming in to land at Nnamdi Azikiwe. Forty-one this week. He has decided he will be a pilot, then a footballer, then a pilot again.']
  };
  function strangers() {
    var svg = $('street'), order = ['taxi', 'corn', 'family', 'corper', 'suya', 'guard', 'corolla', 'boy'], at = 0;
    function show(k) {
      at = order.indexOf(k);
      $('story-h').textContent = STORIES[k][0]; $('story-p').textContent = STORIES[k][1];
      $('story-n').textContent = 'STRANGER ' + (at + 1) + ' OF ' + order.length;
      svg.classList.add('has-active');
      [].forEach.call(svg.querySelectorAll('.who'), function (g) { g.classList.toggle('active', g.getAttribute('data-story') === k); });
    }
    [].forEach.call(svg.querySelectorAll('.who'), function (g) {
      g.addEventListener('click', function () { show(g.getAttribute('data-story')); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(g.getAttribute('data-story')); } });
    });
    $('story-next').addEventListener('click', function () { show(order[(at + 1) % order.length]); });
    show('taxi');
  }

  document.addEventListener('DOMContentLoaded', function () {
    [kitchen, sketch, anime, theatre, weeks, nonsense, telly, strangers].forEach(function (f) {
      try { f(); } catch (e) { if (window.console) console.error(f.name, e); }
    });
  });
})();
