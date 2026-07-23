/* ============================================================
   KARIL HAIR & BEAUTY LOUNGE — animations.js
   GSAP-powered cinematic layer: hero text choreography,
   slideshow, parallax, 3D card tilt.
   Everything degrades gracefully if a CDN fails.
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero slideshow (Ken Burns crossfade) ---------- */
  var slides = document.querySelectorAll('.hero-slides .slide');
  if (slides.length > 1 && !prefersReduced) {
    var current = 0;
    window.setInterval(function () {
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, 7000);
  }

  /* ---------- Hero headline: split into characters & stagger ---------- */
  var heroTitle = document.querySelector('.hero-title[data-split]');
  if (heroTitle && !prefersReduced) {
    heroTitle.querySelectorAll('.line > span').forEach(function (lineSpan, lineIdx) {
      var text = lineSpan.textContent;
      lineSpan.textContent = '';
      lineSpan.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(text, function (ch, i) {
        var s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch === ' ' ? ' ' : ch;
        s.style.animationDelay = (0.65 + lineIdx * 0.34 + i * 0.032) + 's';
        lineSpan.appendChild(s);
      });
    });
    // Screen-reader friendly: put full text back in an sr-only node
    var sr = document.createElement('span');
    sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';
    sr.textContent = heroTitle.textContent;
    heroTitle.appendChild(sr);
  }

  /* ---------- GSAP ScrollTrigger enhancements ---------- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);

    // Parallax layers: any element with data-parallax="0.2" etc.
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      gsap.to(el, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      });
    });

    // Hero content gently drifts up & fades as user scrolls away
    var heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: -18,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom 30%',
          scrub: 0.5
        }
      });
    }

    // Section script accents rotate slightly into place
    document.querySelectorAll('.section-title .script').forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 26,
        rotate: -8,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Oversized marquee drifts slightly faster while in view (depth cue)
    document.querySelectorAll('.marquee').forEach(function (el) {
      gsap.fromTo(el, { xPercent: 0 }, {
        xPercent: -2,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });
  }

  /* ---------- 3D tilt on cards (VanillaTilt, guarded) ---------- */
  if (typeof VanillaTilt !== 'undefined' && !prefersReduced &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var tiltEls = document.querySelectorAll('[data-tilt]');
    if (tiltEls.length) {
      VanillaTilt.init(tiltEls, {
        max: 6,
        speed: 700,
        perspective: 900,
        glare: true,
        'max-glare': 0.12,
        scale: 1.015
      });
    }
  }

  /* ---------- Before / After sliders ---------- */
  document.querySelectorAll('.ba-slider').forEach(function (slider) {
    var range = slider.querySelector('.ba-range');
    var after = slider.querySelector('.ba-after');
    var handle = slider.querySelector('.ba-handle');
    if (!range || !after || !handle) return;
    var update = function () {
      var v = range.value;
      after.style.clipPath = 'inset(0 0 0 ' + v + '%)';
      handle.style.left = v + '%';
    };
    range.addEventListener('input', update);
    update();
  });
})();
