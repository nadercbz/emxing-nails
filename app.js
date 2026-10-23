(function () {
  'use strict';

  /* Einblenden beim Scrollen */
  var reveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (list) {
      list.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add('in'); });
  }

  /* Aktiver Menüpunkt */
  var links = Array.prototype.slice.call(document.querySelectorAll('.bar nav a'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function markActive() {
    var y = window.scrollY + 120, idx = -1;
    targets.forEach(function (t, i) { if (t && t.offsetTop <= y) idx = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === idx); });
    if (idx >= 0) {
      var a = links[idx], nav = a.parentNode;
      if (a.offsetLeft < nav.scrollLeft || a.offsetLeft + a.offsetWidth > nav.scrollLeft + nav.clientWidth) {
        nav.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
      }
    }
  }
  var bar = document.querySelector('.bar'), ticking = false;
  function onScroll() {
    markActive();
    bar.classList.toggle('klein', window.scrollY > 48);
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* Konstruktionslinien am Logo ein oder aus */
  var cxBtn = document.querySelector('.cx-toggle'), cx = document.querySelector('.hero-logo .cx');
  if (cxBtn && cx) {
    cxBtn.addEventListener('click', function () {
      var an = cxBtn.getAttribute('aria-pressed') !== 'true';
      cxBtn.setAttribute('aria-pressed', an ? 'true' : 'false');
      cx.classList.toggle('aus', !an);
    });
  }

  /* Vorher Nachher Regler: beim ersten Sichtkontakt einmal sanft hin und her, dann übernimmt der Finger */
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.cmp').forEach(function (c) {
    var r = c.querySelector('input'), frei = false;
    function setze(v) { c.style.setProperty('--p', v + '%'); }
    function ruhig() { frei = true; }
    r.addEventListener('input', function () { ruhig(); setze(r.value); });
    r.addEventListener('pointerdown', ruhig);
    r.addEventListener('keydown', ruhig);
    setze(50);
    if (still || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (l) {
      if (!l[0].isIntersecting) return;
      obs.disconnect();
      var t0 = null;
      (function schritt(ts) {
        if (frei) return;
        if (t0 === null) t0 = ts;
        var s = (ts - t0) / 2600;
        if (s >= 1) { setze(50); r.value = 50; return; }
        var v = 50 + Math.sin(s * Math.PI * 2) * 34;
        setze(v); r.value = v;
        requestAnimationFrame(schritt);
      })(performance.now());
    }, { threshold: 0.6 });
    obs.observe(c);
  });

  /* Video: Fassung mit Grundriss oder ohne Karte, Position bleibt erhalten */
  document.querySelectorAll('.player').forEach(function (p) {
    var v = p.querySelector('video'), btns = p.querySelectorAll('.seg button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        var t = v.currentTime, war = !v.paused;
        btns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        v.poster = b.dataset.poster;
        v.src = b.dataset.src;
        v.addEventListener('loadedmetadata', function once() {
          v.removeEventListener('loadedmetadata', once);
          try { v.currentTime = Math.min(t, v.duration - 0.1); } catch (e) {}
          if (war) v.play().catch(function () {});
        });
        v.load();
      });
    });
  });

  /* Lightbox */
  /* Die Reihe folgt der Galerie. Kacheln im Logo Kapitel (.shots) zeigen auf dasselbe Bild und öffnen es an seinem Platz. */
  var alle = Array.prototype.slice.call(document.querySelectorAll('a.tile')), tiles = [], index = {};
  alle.forEach(function (a) {
    var h = a.getAttribute('href');
    if (!a.closest('.shots') && !(h in index)) { index[h] = tiles.length; tiles.push(a); }
  });
  var lb = document.getElementById('lb'), img = lb.querySelector('img'), cap = lb.querySelector('.lb-cap'),
      count = lb.querySelector('.count'), stage = lb.querySelector('.lb-stage'), closeBtn = lb.querySelector('.x');
  var cur = 0, last = null;

  function show(i) {
    cur = (i + tiles.length) % tiles.length;
    var t = tiles[cur];
    img.src = t.getAttribute('href');
    img.alt = t.dataset.cap || '';
    cap.textContent = t.dataset.cap || '';
    count.textContent = (cur + 1) + ' / ' + tiles.length;
    [cur + 1, cur - 1].forEach(function (n) {
      var pre = new Image();
      pre.src = tiles[(n + tiles.length) % tiles.length].getAttribute('href');
    });
  }
  function open(i) {
    last = document.activeElement;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    show(i);
    closeBtn.focus();
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (last && last.focus) last.focus();
  }
  alle.forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(index[a.getAttribute('href')]); });
  });
  closeBtn.addEventListener('click', close);
  lb.querySelector('.pv').addEventListener('click', function () { show(cur - 1); });
  lb.querySelector('.nx').addEventListener('click', function () { show(cur + 1); });
  stage.addEventListener('click', function (e) { if (e.target === stage) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'Tab') {
      var f = lb.querySelectorAll('button'), first = f[0], end = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
      else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
    }
  });
  var x0 = null;
  stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });
})();
