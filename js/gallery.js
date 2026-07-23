/* ============================================================
   KARIL HAIR & BEAUTY LOUNGE — gallery.js
   Filterable masonry-style gallery with FLIP transitions
   and a keyboard-accessible lightbox.
   ============================================================ */
(function () {
  'use strict';

  var grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll('.gallery-item'));
  var buttons = document.querySelectorAll('.filter-bar .filter-btn');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- FLIP filter ---------- */
  function applyFilter(cat) {
    // FIRST: record positions of currently visible items
    var first = new Map();
    items.forEach(function (el) {
      if (!el.classList.contains('is-hidden')) first.set(el, el.getBoundingClientRect());
    });

    // Apply visibility
    items.forEach(function (el) {
      var match = cat === 'all' || el.getAttribute('data-cat') === cat;
      el.classList.toggle('is-hidden', !match);
    });

    if (prefersReduced) return;

    // LAST + INVERT + PLAY
    items.forEach(function (el) {
      if (el.classList.contains('is-hidden')) return;
      var last = el.getBoundingClientRect();
      var prev = first.get(el);
      if (prev) {
        var dx = prev.left - last.left;
        var dy = prev.top - last.top;
        if (dx || dy) {
          el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          el.style.transition = 'none';
          requestAnimationFrame(function () {
            el.classList.add('flip-animating');
            el.style.transition = '';
            el.style.transform = '';
            window.setTimeout(function () { el.classList.remove('flip-animating'); }, 600);
          });
        }
      } else {
        // Newly revealed: scale in
        el.classList.add('flip-enter');
        requestAnimationFrame(function () {
          el.classList.add('flip-enter-active');
          el.classList.remove('flip-enter');
          window.setTimeout(function () { el.classList.remove('flip-enter-active'); }, 600);
        });
      }
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.innerHTML =
    '<button class="lightbox-btn lightbox-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg></button>' +
    '<button class="lightbox-btn lightbox-prev" aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<figure class="lightbox-figure">' +
      '<img alt="">' +
      '<figcaption class="lightbox-caption"><span class="cat"></span><span class="title"></span></figcaption>' +
    '</figure>' +
    '<button class="lightbox-btn lightbox-next" aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  document.body.appendChild(lb);

  var lbImg = lb.querySelector('img');
  var lbCat = lb.querySelector('.cat');
  var lbTitle = lb.querySelector('.title');
  var currentIdx = -1;

  function visibleItems() {
    return items.filter(function (el) { return !el.classList.contains('is-hidden'); });
  }

  function openAt(idx) {
    var vis = visibleItems();
    if (!vis.length) return;
    currentIdx = ((idx % vis.length) + vis.length) % vis.length;
    var el = vis[currentIdx];
    var img = el.querySelector('img');
    // Prefer a larger version if data-full provided
    lbImg.src = el.getAttribute('data-full') || img.src;
    lbImg.alt = img.alt || '';
    lbCat.textContent = el.getAttribute('data-cat-label') || el.getAttribute('data-cat') || '';
    lbTitle.textContent = el.getAttribute('data-title') || '';
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lightbox-close').focus();
  }

  function closeLb() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  items.forEach(function (el) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    var open = function () { openAt(visibleItems().indexOf(el)); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  lb.querySelector('.lightbox-close').addEventListener('click', closeLb);
  lb.querySelector('.lightbox-prev').addEventListener('click', function () { openAt(currentIdx - 1); });
  lb.querySelector('.lightbox-next').addEventListener('click', function () { openAt(currentIdx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openAt(currentIdx - 1);
    if (e.key === 'ArrowRight') openAt(currentIdx + 1);
  });

  /* ---------- Touch swipe in lightbox ---------- */
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) openAt(currentIdx + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
})();
