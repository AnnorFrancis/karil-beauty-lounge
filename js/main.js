/* ============================================================
   KARIL HAIR & BEAUTY LOUNGE — main.js
   Shared behaviour: preloader, nav, reveals, counters,
   shimmer canvas, floats, page transitions.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Broken-image safety net ----------
     Placeholder images come from a CDN; if any fails to load,
     swap in an on-brand gradient so the demo never looks broken. */
  var FALLBACK_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#1B4332"/><stop offset="1" stop-color="#0F2A1D"/></linearGradient></defs>' +
    '<rect width="800" height="600" fill="url(#g)"/>' +
    '<g transform="translate(400 300)" fill="none" stroke="#C89B6A" stroke-width="3" opacity="0.75">' +
    '<path d="M0 -70 C 42 -46, 42 46, 0 70 C -42 46, -42 -46, 0 -70 Z"/>' +
    '<path d="M0 -70 C 42 -46, 42 46, 0 70 C -42 46, -42 -46, 0 -70 Z" transform="rotate(60)"/>' +
    '<path d="M0 -70 C 42 -46, 42 46, 0 70 C -42 46, -42 -46, 0 -70 Z" transform="rotate(-60)"/>' +
    '</g>' +
    '<text x="400" y="470" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="26" fill="#F5E7D8" opacity="0.85">Karil Construction</text>' +
    '</svg>'
  );
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'IMG' && el.src !== FALLBACK_SVG) {
      el.src = FALLBACK_SVG;
      el.style.objectFit = 'cover';
    }
  }, true);

  /* ---------- Preloader ---------- */
  var preloader = document.querySelector('.preloader');
  if (preloader) {
    var hide = function () { preloader.classList.add('is-done'); };
    if (sessionStorage.getItem('khb-loaded')) {
      // Returning visitor within session: quick fade only.
      window.setTimeout(hide, 350);
    } else {
      sessionStorage.setItem('khb-loaded', '1');
      window.addEventListener('load', function () { window.setTimeout(hide, 1450); });
      window.setTimeout(hide, 3800); // hard cap so it never traps the user
    }
  }

  /* ---------- Navigation ---------- */
  var nav = document.querySelector('.site-nav');
  var lastScroll = 0;
  function onScroll() {
    var y = window.scrollY;
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 40);
    // Hide on scroll down, reveal on scroll up (mobile-friendly)
    if (y > 320 && y > lastScroll + 6) nav.classList.add('is-hidden');
    else if (y < lastScroll - 6) nav.classList.remove('is-hidden');
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector('.nav-toggle');
  var overlay = document.querySelector('.nav-overlay');
  if (toggle && overlay) {
    toggle.addEventListener('click', function () {
      var open = overlay.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        overlay.classList.remove('is-open');
        toggle.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Scroll reveals (IntersectionObserver) ---------- */
  var revealables = document.querySelectorAll('[data-reveal], [data-reveal-stagger], .img-reveal');
  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-inview'); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        countIO.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count'));
        var duration = 1800;
        var start = null;
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(target * eased).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
          else el.classList.add('is-counted');
        }
        if (prefersReduced) { el.textContent = target.toLocaleString(); }
        else {
          requestAnimationFrame(tick);
          window.setTimeout(function () { el.textContent = target.toLocaleString(); }, duration + 200);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- Marquee: duplicate track for a seamless loop ---------- */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ---------- Rising shimmer canvas (desktop / tablet only — skipped on phones for smooth scroll) ---------- */
  var canvas = document.getElementById('shimmer-canvas');
  var isNarrow = window.matchMedia('(max-width: 640px)').matches;
  if (canvas && !prefersReduced && !isNarrow) {
    var ctx = canvas.getContext('2d');
    var petals = [];
    var W, H;
    var COLORS = ['rgba(200, 155, 106,', 'rgba(245, 231, 216,', 'rgba(185,202,219,', 'rgba(233,206,143,'];

    function sizeCanvas() {
      var rect = canvas.parentElement.getBoundingClientRect();
      W = canvas.width = rect.width;
      H = canvas.height = rect.height;
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    function spawnPetal(randomY) {
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : H + 20,
        size: 4 + Math.random() * 7,
        speedY: -(0.18 + Math.random() * 0.42),
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.035,
        drift: (Math.random() - 0.5) * 0.6,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.015,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.35 + Math.random() * 0.4
      };
    }
    var COUNT = Math.min(34, Math.floor(window.innerWidth / 40));
    for (var i = 0; i < COUNT; i++) petals.push(spawnPetal(true));

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + Math.sin(p.sway) * 0.4);
      // four-point sparkle with a soft halo — reads as light, not dust
      var r = p.size * 0.5;
      var a = p.alpha * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(p.twinkle)));
      var halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
      halo.addColorStop(0, p.color + (a * 0.5) + ')');
      halo.addColorStop(1, p.color + '0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r * 0.32, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r * 0.32, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.closePath();
      ctx.fillStyle = p.color + a + ')';
      ctx.fill();
      ctx.restore();
    }

    var rafId, running = true;
    function loop() {
      ctx.clearRect(0, 0, W, H);
      petals.forEach(function (p, idx) {
        p.y += p.speedY;
        p.x += p.drift + Math.sin(p.sway) * 0.5;
        p.sway += p.swaySpeed;
        p.rot += p.rotSpeed;
        p.twinkle += p.twinkleSpeed;
        if (p.y < -30 || p.x < -30 || p.x > W + 30) petals[idx] = spawnPetal(false);
        drawPetal(p);
      });
      rafId = requestAnimationFrame(loop);
    }
    loop();

    // Pause when hero is out of view (performance)
    var heroIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !running) { running = true; loop(); }
        else if (!entry.isIntersecting && running) { running = false; cancelAnimationFrame(rafId); }
      });
    });
    heroIO.observe(canvas.parentElement);
  }

  /* ---------- WhatsApp float (injected on every page) ---------- */
  if (!document.querySelector('.wa-float')) {
    var wa = document.createElement('a');
    wa.className = 'wa-float';
    wa.href = 'https://wa.me/233541834750?text=' + encodeURIComponent('Hello Karil Hair & Beauty Lounge! I would like to ask about booking an appointment.');
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'Chat with us on WhatsApp');
    wa.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
      '<span class="wa-tooltip">Chat with us</span>';
    document.body.appendChild(wa);
  }

  /* ---------- Newsletter (demo submit) ---------- */
  document.querySelectorAll('.newsletter-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var note = form.parentElement.querySelector('.newsletter-note');
      if (input && input.value.indexOf('@') > 0) {
        if (note) note.textContent = 'Thank you — you are on the list. Fresh inspiration coming your way.';
        input.value = '';
      } else if (note) {
        note.textContent = 'Please enter a valid email address.';
      }
    });
  });

  /* ---------- Floating labels helper ---------- */
  document.querySelectorAll('.field input, .field select, .field textarea').forEach(function (el) {
    var sync = function () {
      el.closest('.field').classList.toggle('is-filled', !!el.value);
    };
    el.addEventListener('input', sync);
    el.addEventListener('change', sync);
    sync();
  });

  /* ---------- Page transition veil ---------- */
  if (!prefersReduced) {
    var veil = document.createElement('div');
    veil.className = 'page-veil';
    document.body.appendChild(veil);
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' ||
          /^(https?:|mailto:|tel:|whatsapp:)/i.test(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      veil.classList.add('is-leaving');
      window.setTimeout(function () { window.location.href = href; }, 480);
    });
    // Restore if page came back from bfcache with veil up
    window.addEventListener('pageshow', function () { veil.classList.remove('is-leaving'); });
  }

  /* ---------- Testimonials swiper (if present) ---------- */
  if (typeof Swiper !== 'undefined' && document.querySelector('.testimonial-swiper')) {
    new Swiper('.testimonial-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      rewind: true,
      autoplay: { delay: 5200, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      breakpoints: {
        720: { slidesPerView: 2 },
        1080: { slidesPerView: 3 }
      }
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
