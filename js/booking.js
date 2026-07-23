/* ============================================================
   KARIL HAIR & BEAUTY LOUNGE — booking.js
   Multi-step appointment form with validation, instant price
   estimator, and the interactive service builder (packages page).
   Frontend demo — no data leaves the page.
   ============================================================ */
(function () {
  'use strict';

  function fmtGHS(n) {
    return 'GHS ' + Math.round(n).toLocaleString();
  }

  /* ============================================================
     MULTI-STEP BOOKING FORM (contact.html)
     ============================================================ */
  var form = document.getElementById('booking-form');
  if (form) {
    var steps = form.querySelectorAll('.form-step');
    var dots = document.querySelectorAll('.progress-step');
    var current = 0;

    function showStep(i) {
      current = i;
      steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
      dots.forEach(function (d, idx) {
        d.classList.toggle('is-current', idx === i);
        d.classList.toggle('is-done', idx < i);
      });
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateStep(i) {
      var ok = true;
      steps[i].querySelectorAll('[required]').forEach(function (el) {
        var field = el.closest('.field');
        var valid = !!el.value.trim();
        if (valid && el.type === 'tel') valid = /^[\d\s+()-]{9,}$/.test(el.value.trim());
        if (valid && el.type === 'date') valid = el.value >= new Date().toISOString().slice(0, 10);
        if (field) field.classList.toggle('has-error', !valid);
        if (!valid) ok = false;
      });
      return ok;
    }

    form.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateStep(current)) return;
        if (current === steps.length - 2) buildQuote(); // entering review step
        showStep(current + 1);
      });
    });
    form.querySelectorAll('[data-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () { showStep(current - 1); });
    });

    // Checkbox pills toggle state
    form.querySelectorAll('.check-pill input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        cb.closest('.check-pill').classList.toggle('is-checked', cb.checked);
      });
    });

    /* ---------- Instant Price Estimator ----------
       Salon pricing is per service, not per hour. The rates below are the
       demo price list and the single place to tune the estimator — they
       match the builder on the packages page. */
    var SERVICE_PRICES = {
      braids:   { label: 'Braids', price: 300 },
      frontal:  { label: 'Wig / frontal install', price: 250 },
      colour:   { label: 'Hair colouring', price: 220 },
      nails:    { label: 'Nail extensions', price: 180 },
      manipedi: { label: 'Manicure & pedicure', price: 120 },
      lashes:   { label: 'Lashes', price: 150 },
      brows:    { label: 'Ombre brows', price: 400 },
      makeup:   { label: 'Make-up', price: 200 },
      facial:   { label: 'Facial', price: 160 },
      piercing: { label: 'Piercing', price: 80 }
    };
    var OCCASION_MULTIPLIER = {
      'Regular Appointment': 1, 'Bridal / Wedding Party': 1.35,
      'Birthday or Event Glam': 1.1, 'Photoshoot / Content': 1.15,
      'First Visit \u2014 Consultation': 1, 'Other': 1
    };
    var PROJECT_MULTIPLIER = {
      'New Residential Build': 1, 'Architectural Design Only': 1,
      'Commercial Building': 1.25, 'Renovation / Extension': 0.85,
      'Interior Fit-Out': 0.7, 'Fence Wall / Compound Works': 0.5,
      'Project Supervision Only': 1, 'Other': 1
    };

    function buildQuote() {
      var panel = document.getElementById('quote-panel');
      if (!panel) return;
      var lines = panel.querySelector('.quote-lines');
      var totalEl = panel.querySelector('.quote-total .value');

      var evType = (form.querySelector('[name="event-type"]') || {}).value || 'Other';
      var people = parseInt((form.querySelector('[name="guests"]') || {}).value, 10) || 1;
      people = Math.max(1, Math.min(people, 20));
      var mult = OCCASION_MULTIPLIER[evType] || 1;

      var checked = Array.prototype.slice.call(form.querySelectorAll('.check-pill input:checked'));
      if (!checked.length) checked = [{ value: 'braids' }];

      lines.innerHTML = '';
      var total = 0;
      checked.forEach(function (cb) {
        var svc = SERVICE_PRICES[cb.value];
        if (!svc) return;
        var price = svc.price * mult * people;
        total += price;
        var li = document.createElement('li');
        li.innerHTML = '<span>' + svc.label + (people > 1 ? ' \u00D7 ' + people : '') +
                       '</span><span>' + fmtGHS(price) + '</span>';
        lines.appendChild(li);
      });
      // Booking two or more services in one visit earns a bundle discount.
      if (checked.length >= 2) {
        var bundle = total * (checked.length >= 4 ? 0.12 : 0.07);
        total -= bundle;
        var liB = document.createElement('li');
        liB.innerHTML = '<span>Bundle saving (' + checked.length + ' services)</span><span>\u2212 ' + fmtGHS(bundle) + '</span>';
        lines.appendChild(liB);
      }

      // Animate the total counting up (with a hard fallback so the
      // exact figure always lands even if rAF is throttled)
      var start = null, from = 0, dur = 1100;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        totalEl.textContent = fmtGHS(from + (total - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      window.setTimeout(function () { totalEl.textContent = fmtGHS(total); }, dur + 150);

      // Review summary
      var review = document.getElementById('review-summary');
      if (review) {
        var name = (form.querySelector('[name="name"]') || {}).value || '\u2014';
        var date = (form.querySelector('[name="event-date"]') || {}).value || '\u2014';
        var slot = (form.querySelector('[name="venue"]') || {}).value || 'Any time';
        review.innerHTML =
          '<li><span>Name</span><span>' + name.replace(/</g, '&lt;') + '</span></li>' +
          '<li><span>Occasion</span><span>' + evType + '</span></li>' +
          '<li><span>Date</span><span>' + date + '</span></li>' +
          '<li><span>Preferred time</span><span>' + slot.replace(/</g, '&lt;') + '</span></li>' +
          '<li><span>People</span><span>' + people + '</span></li>';
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;
      // Demo: show success state
      form.querySelector('.form-steps-wrap').style.display = 'none';
      var progress = form.querySelector('.progress-steps');
      if (progress) progress.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
      var name = (form.querySelector('[name="name"]') || {}).value || '';
      var evType = (form.querySelector('[name="event-type"]') || {}).value || '';
      var date = (form.querySelector('[name="event-date"]') || {}).value || '';
      var phone = (form.querySelector('[name="phone"]') || {}).value || '';
      var notes = (form.querySelector('[name="notes"]') || {}).value || '';

      // Save the request so it shows up automatically in the salon admin.
      // Frontend-only bridge via localStorage (same origin as the admin).
      try {
        var KEY = 'khb-web-bookings';
        var list = JSON.parse(localStorage.getItem(KEY) || '[]');
        list.push({
          id: 'WEB-' + Date.now().toString().slice(-6),
          name: name, phone: phone, service: evType || 'Appointment',
          date: date, notes: notes, status: 'Pending', ts: Date.now()
        });
        localStorage.setItem(KEY, JSON.stringify(list));
      } catch (err) {}

      var wa = document.getElementById('success-wa');
      if (wa) {
        wa.href = 'https://wa.me/233541834750?text=' + encodeURIComponent(
          'Hello Karil! I just requested an appointment. Name: ' + name +
          ', Service: ' + evType + ', Date: ' + date + '. Looking forward to hearing from you!');
      }
    });

    showStep(0);
  }

  /* ============================================================
     PACKAGE BUILDER (packages.html)
     ============================================================ */
  var builder = document.getElementById('package-builder');
  if (builder) {
    var opts = builder.querySelectorAll('.builder-opt');
    var linesEl = document.getElementById('builder-lines');
    var totalEl = document.getElementById('builder-total');
    var waBtn = document.getElementById('builder-wa');
    var displayed = 0;

    function refresh() {
      var total = 0;
      var chosen = [];
      opts.forEach(function (opt) {
        var input = opt.querySelector('input');
        opt.classList.toggle('is-checked', input.checked);
        if (input.checked) {
          var price = parseInt(opt.getAttribute('data-price'), 10);
          total += price;
          chosen.push({ name: opt.getAttribute('data-name'), price: price });
        }
      });

      if (!chosen.length) {
        linesEl.innerHTML = '<li class="empty">Select services to build your appointment…</li>';
      } else {
        linesEl.innerHTML = chosen.map(function (c) {
          return '<li><span>' + c.name + '</span><span>' + fmtGHS(c.price) + '</span></li>';
        }).join('');
      }

      // Smooth count to new total (hard fallback lands the exact figure)
      var from = displayed, to = total, start = null, dur = 600;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        displayed = from + (to - from) * eased;
        totalEl.textContent = fmtGHS(displayed);
        if (p < 1) requestAnimationFrame(tick);
        else displayed = to;
      }
      requestAnimationFrame(tick);
      window.setTimeout(function () { displayed = to; totalEl.textContent = fmtGHS(to); }, dur + 150);

      if (waBtn) {
        var msg = chosen.length
          ? 'Hello Karil! I built an appointment on your website: ' +
            chosen.map(function (c) { return c.name; }).join(', ') +
            '. Estimated total: ' + fmtGHS(to) + '. Can we discuss?'
          : 'Hello Karil! I would like to book an appointment.';
        waBtn.href = 'https://wa.me/233541834750?text=' + encodeURIComponent(msg);
      }
    }

    // The options are <label> elements, so the browser toggles the
    // checkbox natively — we only need to react to the change.
    opts.forEach(function (opt) {
      opt.querySelector('input').addEventListener('change', refresh);
    });
    refresh();
  }

})();
