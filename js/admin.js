/* ============================================================
   KARIL HAIR & BEAUTY LOUNGE — admin.js
   Admin dashboard engine: mock data, tables, filters, drawers,
   Chart.js visualisations, dark mode. Frontend demo only.
   ============================================================ */
(function () {
  'use strict';

  /* ================= THEME ================= */
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('khb-admin-theme'); } catch (e) {}
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('khb-admin-theme', next); } catch (e) {}
      rebuildCharts();
    });
  }

  /* ================= SIDEBAR (mobile) ================= */
  var sidebar = document.querySelector('.admin-sidebar');
  var sidebarToggle = document.querySelector('.sidebar-toggle');
  var sidebarBackdrop = document.querySelector('.sidebar-backdrop');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('is-open');
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle('is-open', sidebar.classList.contains('is-open'));
    });
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', function () {
      sidebar.classList.remove('is-open');
      sidebarBackdrop.classList.remove('is-open');
    });
  }

  /* ================= HELPERS ================= */
  function fmtGHS(n) { return 'GHS ' + Math.round(n).toLocaleString(); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function d(offsetDays) {
    var dt = new Date();
    dt.setDate(dt.getDate() + offsetDays);
    return dt;
  }
  function iso(dt) { return dt.toISOString().slice(0, 10); }
  function pretty(dt) { return dt.getDate() + ' ' + MONTHS[dt.getMonth()] + ' ' + dt.getFullYear(); }

  var STATUS_CLASS = {
    'Confirmed': 'badge--confirmed', 'Pending': 'badge--pending',
    'In Progress': 'badge--progress', 'Completed': 'badge--completed', 'Cancelled': 'badge--cancelled'
  };
  function badge(status) {
    return '<span class="badge ' + (STATUS_CLASS[status] || 'badge--pending') + '">' + esc(status) + '</span>';
  }

  var AVATAR_COLORS = ['#A97142', '#3B2A21', '#6B5B50', '#5B8FB0', '#C0AFA1', '#B08968'];
  function avatar(name, i) {
    var initials = name.split(' ').map(function (p) { return p.charAt(0); }).slice(0, 2).join('').toUpperCase();
    var color = AVATAR_COLORS[i % AVATAR_COLORS.length];
    return '<span class="client-avatar" style="background:' + color + '">' + initials + '</span>';
  }

  function toast(msg) {
    var t = document.querySelector('.a-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'a-toast';
      t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12.5l5 5L20 6.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
      document.body.appendChild(t);
    }
    t.querySelector('span').textContent = msg;
    t.classList.add('is-shown');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('is-shown'); }, 2600);
  }

  function animateCount(el, target, prefix, suffix) {
    var start = null, dur = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (prefix || '') + Math.round(target * eased).toLocaleString() + (suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    window.setTimeout(function () { el.textContent = (prefix || '') + target.toLocaleString() + (suffix || ''); }, dur + 200);
  }

  /* ================= MOCK DATA ================= */
  var BOOKINGS = [
    { id: 'APT-2041', client: 'Akosua Danso', phone: '024 555 1201', type: 'Braids', date: d(0), venue: 'Karil', pkg: 'Radiance', amount: 680, deposit: 200, status: 'Confirmed', notes: 'Knotless, waist length. Bringing her own hair. Allow 5 hours.' },
    { id: 'APT-2040', client: 'Naa Adjeley Tetteh', phone: '020 441 8890', type: 'Lashes', date: d(0), venue: 'Selina', pkg: 'Single Service', amount: 150, deposit: 0, status: 'Confirmed', notes: 'Hybrid refill. Lunch break slot \u2014 must finish by 2pm.' },
    { id: 'APT-2039', client: 'Priscilla Amoah', phone: '027 660 3321', type: 'Make-Up', date: d(1), venue: 'Maame', pkg: 'Icon', amount: 1800, deposit: 900, status: 'Confirmed', notes: 'Bridal. Trial already done. Opening early at 6am for the party.' },
    { id: 'APT-2038', client: 'Efua Boakye', phone: '030 277 4410', type: 'Brows', date: d(2), venue: 'Selina', pkg: 'Single Service', amount: 400, deposit: 100, status: 'Confirmed', notes: 'Ombr\u00e9 brows, first session. Patch test done last week.' },
    { id: 'APT-2037', client: 'Adjoa Serwaa', phone: '024 118 7745', type: 'Nails', date: d(2), venue: 'Abena', pkg: 'Glow', amount: 300, deposit: 0, status: 'Pending', notes: 'Full set plus pedicure. Waiting for her to confirm the time.' },
    { id: 'APT-2036', client: 'Ama Owusu', phone: '026 909 2288', type: 'Wigs', date: d(3), venue: 'Karil', pkg: 'Single Service', amount: 250, deposit: 100, status: 'Confirmed', notes: 'Frontal install + styling. Wig already dropped off.' },
    { id: 'APT-2035', client: 'Linda Mensah', phone: '055 302 6614', type: 'Braids', date: d(-1), venue: 'Karil', pkg: 'Radiance', amount: 720, deposit: 720, status: 'Completed', notes: 'Loved the result \u2014 ask for a photo and a review.' },
    { id: 'APT-2034', client: 'Gifty Asare', phone: '024 700 5512', type: 'Facial', date: d(4), venue: 'Maame', pkg: 'Single Service', amount: 160, deposit: 0, status: 'Confirmed', notes: 'Deep cleanse. Sensitive skin \u2014 no strong exfoliant.' },
    { id: 'APT-2033', client: 'Sandra Nyarko', phone: '020 655 0091', type: 'Nails', date: d(-3), venue: 'Abena', pkg: 'Single Service', amount: 180, deposit: 180, status: 'Completed', notes: 'Almond set, nude. Refill due in about 3 weeks.' },
    { id: 'APT-2032', client: 'Yaa Pokuaa', phone: '027 233 8181', type: 'Make-Up', date: d(6), venue: 'Maame', pkg: 'Single Service', amount: 200, deposit: 0, status: 'Pending', notes: 'Birthday glam. Awaiting deposit to hold the slot.' },
    { id: 'APT-2031', client: 'Rita Agyeman', phone: '024 866 2299', type: 'Wigs', date: d(-6), venue: 'Karil', pkg: 'Single Service', amount: 470, deposit: 470, status: 'Completed', notes: 'Colour + install. Honey blonde came out beautifully.' },
    { id: 'APT-2030', client: 'Josephine Larbi', phone: '055 121 7648', type: 'Lashes', date: d(-9), venue: 'Selina', pkg: 'Glow', amount: 270, deposit: 270, status: 'Completed', notes: 'Volume set plus brow tint. Very happy.' },
    { id: 'APT-2029', client: 'Comfort Adjei', phone: '030 290 1177', type: 'Braids', date: d(-14), venue: 'Karil', pkg: 'Single Service', amount: 380, deposit: 380, status: 'Completed', notes: 'Cornrows. Third visit this year \u2014 regular client.' },
    { id: 'APT-2028', client: 'Vida Ansah', phone: '026 480 3350', type: 'Nails', date: d(8), venue: 'Abena', pkg: 'Single Service', amount: 180, deposit: 50, status: 'Cancelled', notes: 'Travelling \u2014 will rebook when back. Deposit carried forward.' }
  ];

  var INVENTORY = [
    { name: 'Braiding Hair (packs)', cat: 'Hair', total: 400, out: 310, condition: 'Good', event: 'Danso braids \u2014 ' + pretty(d(0)) },
    { name: 'Human Hair Bundles', cat: 'Hair', total: 60, out: 38, condition: 'Excellent', event: 'Owusu install \u2014 ' + pretty(d(3)) },
    { name: 'Lace Frontals', cat: 'Hair', total: 45, out: 30, condition: 'Excellent', event: 'Owusu install \u2014 ' + pretty(d(3)) },
    { name: 'Wig Caps', cat: 'Hair', total: 150, out: 74, condition: 'Good', event: null },
    { name: 'Hair Colour Tubes', cat: 'Hair', total: 80, out: 52, condition: 'Good', event: null },
    { name: 'Shampoo & Conditioner (L)', cat: 'Hair', total: 40, out: 24, condition: 'Good', event: 'Multiple clients' },
    { name: 'Acrylic Powder (jars)', cat: 'Nails', total: 60, out: 44, condition: 'Good', event: 'Serwaa nails \u2014 ' + pretty(d(2)) },
    { name: 'Gel Polish (bottles)', cat: 'Nails', total: 180, out: 96, condition: 'Excellent', event: null },
    { name: 'Nail Tips (boxes)', cat: 'Nails', total: 90, out: 71, condition: 'Good', event: 'Serwaa nails \u2014 ' + pretty(d(2)) },
    { name: 'Mink Lash Trays', cat: 'Lashes & Brows', total: 120, out: 88, condition: 'Excellent', event: 'Tetteh lashes \u2014 ' + pretty(d(0)) },
    { name: 'Lash Glue (bottles)', cat: 'Lashes & Brows', total: 30, out: 26, condition: 'Good', event: 'Tetteh lashes \u2014 ' + pretty(d(0)) },
    { name: 'Brow Pigment (bottles)', cat: 'Lashes & Brows', total: 24, out: 15, condition: 'Excellent', event: 'Boakye brows \u2014 ' + pretty(d(2)) },
    { name: 'Facial Masks & Serums', cat: 'Skin', total: 70, out: 33, condition: 'Good', event: null },
    { name: 'Piercing Studs (sterile)', cat: 'Skin', total: 100, out: 41, condition: 'Excellent', event: null },
    { name: 'Gloves & Sanitiser', cat: 'Skin', total: 200, out: 152, condition: 'Good', event: 'Daily use' }
  ];

  var CLIENTS = [
    { name: 'Akosua Danso', phone: '024 555 1201', email: 'akosua.d@gmail.com', events: 6, spent: 3400, last: d(0), src: 'Instagram', notes: 'Braids every 6\u20137 weeks. Prefers knotless, waist length. Always on time.' },
    { name: 'Priscilla Amoah', phone: '027 660 3321', email: 'priscilla.a@gmail.com', events: 3, spent: 2900, last: d(1), src: 'Referral', notes: 'Bride. Trial done. Bringing 4 bridesmaids on the day.' },
    { name: 'Linda Mensah', phone: '055 302 6614', email: 'lindam@yahoo.com', events: 8, spent: 4100, last: d(-1), src: 'Walk-in', notes: 'One of our longest clients. Happy to give a testimonial.' },
    { name: 'Naa Adjeley Tetteh', phone: '020 441 8890', email: 'naa.tetteh@gmail.com', events: 11, spent: 1850, last: d(0), src: 'TikTok', notes: 'Lash refills every 3 weeks, always on her lunch break. Keep slots short.' },
    { name: 'Efua Boakye', phone: '030 277 4410', email: 'efua.b@gmail.com', events: 2, spent: 560, last: d(2), src: 'Instagram', notes: 'Ombr\u00e9 brows in progress. Touch-up due in 6 weeks \u2014 remind her.' },
    { name: 'Rita Agyeman', phone: '024 866 2299', email: 'rita.agyeman@gmail.com', events: 5, spent: 2300, last: d(-6), src: 'Referral', notes: 'Loves colour. Books a change every season.' },
    { name: 'Adjoa Serwaa', phone: '024 118 7745', email: 'adjoaserwaa@icloud.com', events: 4, spent: 980, last: d(2), src: 'Facebook', notes: 'Nails regular. Sometimes reschedules \u2014 confirm the day before.' },
    { name: 'Ama Owusu', phone: '026 909 2288', email: 'ama.owusu@gmail.com', events: 3, spent: 890, last: d(3), src: 'Instagram', notes: 'Drops her wig off ahead of time. Very easy client.' },
    { name: 'Yaa Pokuaa', phone: '027 233 8181', email: 'yaa.p@gmail.com', events: 1, spent: 200, last: d(6), src: 'TikTok', notes: 'First time. Birthday glam \u2014 deposit still pending.' },
    { name: 'Josephine Larbi', phone: '055 121 7648', email: 'jlarbi@outlook.com', events: 7, spent: 1620, last: d(-9), src: 'Walk-in', notes: 'Lashes and brows together. Great photos \u2014 ask before posting.' }
  ];

  /* ================= CHARTS ================= */
  var COLORS = { gold: '#A97142', goldLight: '#C89B6A', espresso: '#3B2A21', espressoSoft: '#5A4335', stone: '#C0AFA1', taupe: '#6B5B50', powder: '#C3D6E4', amber: '#D97706' };
  var charts = [];

  function chartTheme() {
    return {
      ink: isDark() ? '#A89A8E' : '#6B7280',
      grid: isDark() ? 'rgba(154,161,178,0.12)' : 'rgba(107,114,128,0.14)'
    };
  }

  function makeChart(id, config) {
    var el = document.getElementById(id);
    if (!el || typeof Chart === 'undefined') return;
    var th = chartTheme();
    Chart.defaults.font.family = "'Lato', sans-serif";
    Chart.defaults.color = th.ink;
    var c = new Chart(el.getContext('2d'), config);
    charts.push({ id: id, chart: c });
    return c;
  }

  var chartBuilders = [];
  function registerChart(builder) {
    chartBuilders.push(builder);
    builder();
  }
  function rebuildCharts() {
    charts.forEach(function (c) { c.chart.destroy(); });
    charts = [];
    chartBuilders.forEach(function (b) { b(); });
  }

  function last6MonthsLabels() {
    var out = [], now = new Date();
    for (var i = 5; i >= 0; i--) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(MONTHS[m.getMonth()]);
    }
    return out;
  }
  function monthLabels12() {
    var out = [], now = new Date();
    for (var i = 11; i >= 0; i--) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(MONTHS[m.getMonth()]);
    }
    return out;
  }

  var gridOpts = function () {
    var th = chartTheme();
    return {
      x: { grid: { display: false }, ticks: { color: th.ink } },
      y: { grid: { color: th.grid }, border: { display: false }, ticks: { color: th.ink, callback: function (v) { return 'GHS ' + (v >= 1000 ? (v / 1000) + 'k' : v); } } }
    };
  };

  /* ================= PAGE ROUTER ================= */
  var page = document.body.getAttribute('data-page');

  /* ---------------- DASHBOARD ---------------- */
  if (page === 'dashboard') {
    // Date in header
    var dateEl = document.getElementById('today-date');
    if (dateEl) {
      var now = new Date();
      var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dateEl.textContent = DAYS[now.getDay()] + ', ' + pretty(now);
    }

    // Stats
    var monthBookings = BOOKINGS.filter(function (b) {
      var n = new Date(); return b.date.getMonth() === n.getMonth() && b.date.getFullYear() === n.getFullYear() && b.status !== 'Cancelled';
    });
    var revenue = BOOKINGS.filter(function (b) { return b.status !== 'Cancelled'; })
      .reduce(function (s, b) { return s + b.deposit; }, 0);
    var pendingQuotes = BOOKINGS.filter(function (b) { return b.status === 'Pending'; }).length;
    var weekEvents = BOOKINGS.filter(function (b) {
      var diff = (b.date - new Date()) / 86400000;
      return diff >= 0 && diff <= 7 && b.status !== 'Cancelled';
    }).length;

    var els = {
      'stat-bookings': monthBookings.length,
      'stat-quotes': pendingQuotes,
      'stat-week': weekEvents
    };
    Object.keys(els).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) animateCount(el, els[id]);
    });
    var revEl = document.getElementById('stat-revenue');
    if (revEl) animateCount(revEl, revenue, 'GHS ');

    // Recent bookings table (last 10)
    var tbody = document.getElementById('recent-bookings');
    if (tbody) {
      tbody.innerHTML = BOOKINGS.slice(0, 10).map(function (b) {
        return '<tr>' +
          '<td><span class="cell-strong">' + esc(b.client) + '</span><span class="cell-sub">' + b.id + '</span></td>' +
          '<td>' + esc(b.type) + '</td>' +
          '<td>' + pretty(b.date) + '</td>' +
          '<td class="num">' + fmtGHS(b.amount) + '</td>' +
          '<td>' + badge(b.status) + '</td>' +
          '</tr>';
      }).join('');
    }

    // Upcoming appointments (next 7 days)
    var up = document.getElementById('upcoming-list');
    if (up) {
      var upcoming = BOOKINGS.filter(function (b) {
        var diff = (b.date - new Date()) / 86400000;
        return diff >= 0 && diff <= 7 && b.status !== 'Cancelled';
      }).sort(function (a, b) { return a.date - b.date; });
      up.innerHTML = upcoming.length ? upcoming.map(function (b) {
        return '<li>' +
          '<div class="mini-date"><span class="d">' + b.date.getDate() + '</span><span class="m">' + MONTHS[b.date.getMonth()] + '</span></div>' +
          '<div class="mini-info"><div class="t">' + esc(b.client) + '</div><div class="s">' + esc(b.type) + ' · ' + esc(b.venue) + '</div></div>' +
          '</li>';
      }).join('') : '<li style="color:var(--a-ink-soft);font-style:italic;">Nothing booked in the next 7 days.</li>';
    }

    // Revenue chart (bar, last 6 months)
    registerChart(function () {
      makeChart('chart-revenue', {
        type: 'bar',
        data: {
          labels: last6MonthsLabels(),
          datasets: [{
            label: 'Revenue (GHS)',
            data: [21500, 18200, 26400, 31800, 24600, 38200],
            backgroundColor: function (ctx) {
              var g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
              g.addColorStop(0, COLORS.goldLight); g.addColorStop(1, COLORS.gold);
              return g;
            },
            borderRadius: 8, maxBarThickness: 44
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return 'GHS ' + c.parsed.y.toLocaleString(); } } } },
          scales: gridOpts()
        }
      });
    });

    // Popular services pie
    registerChart(function () {
      makeChart('chart-services', {
        type: 'doughnut',
        data: {
          labels: ['Braids', 'Nails', 'Lashes & Brows', 'Make-Up', 'Wigs & Colour'],
          datasets: [{
            data: [38, 22, 16, 14, 10],
            backgroundColor: [COLORS.gold, COLORS.powder, COLORS.espresso, COLORS.taupe, COLORS.stone],
            borderWidth: 2,
            borderColor: isDark() ? '#221B17' : '#FFFFFF'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '62%',
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 14 } } }
        }
      });
    });
  }

  /* ---------------- BOOKINGS ---------------- */
  if (page === 'bookings') {
    var state = { q: '', status: 'all', type: 'all', from: '', to: '' };
    var body = document.getElementById('bookings-body');
    var countEl = document.getElementById('bookings-count');

    function rowsFiltered() {
      return BOOKINGS.filter(function (b) {
        if (state.status !== 'all' && b.status !== state.status) return false;
        if (state.type !== 'all' && b.type !== state.type) return false;
        if (state.q) {
          var hay = (b.client + ' ' + b.id + ' ' + b.venue + ' ' + b.type).toLowerCase();
          if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
        }
        if (state.from && iso(b.date) < state.from) return false;
        if (state.to && iso(b.date) > state.to) return false;
        return true;
      });
    }

    function renderBookings() {
      var rows = rowsFiltered();
      if (countEl) countEl.textContent = rows.length + ' booking' + (rows.length === 1 ? '' : 's');
      body.innerHTML = rows.length ? rows.map(function (b) {
        var idx = BOOKINGS.indexOf(b);
        return '<tr data-idx="' + idx + '">' +
          '<td><span class="cell-strong">' + esc(b.client) + '</span><span class="cell-sub">' + b.id + ' · ' + esc(b.phone) + '</span></td>' +
          '<td>' + esc(b.type) + '</td>' +
          '<td>' + pretty(b.date) + '</td>' +
          '<td><span class="cell-sub" style="font-size:0.84rem;color:var(--a-ink)">' + esc(b.venue) + '</span></td>' +
          '<td>' + esc(b.pkg) + '</td>' +
          '<td class="num">' + fmtGHS(b.amount) + '</td>' +
          '<td>' + badge(b.status) + '</td>' +
          '</tr>';
      }).join('') : '<tr class="empty-row"><td colspan="7">No bookings match these filters. Try widening your search.</td></tr>';

      body.querySelectorAll('tr[data-idx]').forEach(function (tr) {
        tr.addEventListener('click', function () { openBookingDrawer(parseInt(tr.getAttribute('data-idx'), 10)); });
      });
    }

    ['bk-search', 'bk-status', 'bk-type', 'bk-from', 'bk-to'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        state.q = document.getElementById('bk-search').value;
        state.status = document.getElementById('bk-status').value;
        state.type = document.getElementById('bk-type').value;
        state.from = document.getElementById('bk-from').value;
        state.to = document.getElementById('bk-to').value;
        renderBookings();
      });
    });

    // Drawer
    var backdrop = document.getElementById('drawer-backdrop');
    var drawer = document.getElementById('booking-drawer');
    var drawerBody = document.getElementById('drawer-body');
    var drawerTitle = document.getElementById('drawer-title');

    function closeDrawer() {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
    }
    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

    function openBookingDrawer(idx) {
      var b = BOOKINGS[idx];
      drawerTitle.textContent = b.id + ' — ' + b.client;
      drawerBody.innerHTML =
        '<ul class="detail-list">' +
        '<li><span>Status</span><span>' + badge(b.status) + '</span></li>' +
        '<li><span>Service</span><span>' + esc(b.type) + '</span></li>' +
        '<li><span>Date</span><span>' + pretty(b.date) + '</span></li>' +
        '<li><span>Stylist</span><span>' + esc(b.venue) + '</span></li>' +
        '<li><span>Package</span><span>' + esc(b.pkg) + '</span></li>' +
        '<li><span>Total amount</span><span>' + fmtGHS(b.amount) + '</span></li>' +
        '<li><span>Deposit paid</span><span>' + fmtGHS(b.deposit) + '</span></li>' +
        '<li><span>Balance</span><span>' + fmtGHS(b.amount - b.deposit) + '</span></li>' +
        '<li><span>Phone</span><span>' + esc(b.phone) + '</span></li>' +
        '</ul>' +
        '<div class="a-field"><label>Notes</label><p style="font-size:0.88rem;">' + esc(b.notes) + '</p></div>' +
        '<div class="a-field"><label>Update status</label>' +
        '<select class="a-select" id="drawer-status">' +
        ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(function (s) {
          return '<option' + (s === b.status ? ' selected' : '') + '>' + s + '</option>';
        }).join('') +
        '</select></div>';
      drawerBody.querySelector('#drawer-status').addEventListener('change', function (e) {
        b.status = e.target.value;
        renderBookings();
        toast('Status updated to "' + b.status + '"');
        openBookingDrawer(idx);
      });
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
    }

    // Add booking
    var addBtn = document.getElementById('add-booking');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        drawerTitle.textContent = 'New Booking';
        drawerBody.innerHTML =
          '<div class="a-field"><label>Client name</label><input class="a-input" id="nb-client" placeholder="e.g. Ama Owusu"></div>' +
          '<div class="a-field"><label>Phone</label><input class="a-input" id="nb-phone" placeholder="024 000 0000"></div>' +
          '<div class="a-field"><label>Service</label><select class="a-select" id="nb-type"><option>Braids</option><option>Wigs</option><option>Nails</option><option>Lashes</option><option>Brows</option><option>Make-Up</option><option>Facial</option><option>Piercing</option></select></div>' +
          '<div class="a-field"><label>Date</label><input class="a-input" type="date" id="nb-date" value="' + iso(d(2)) + '"></div>' +
          '<div class="a-field"><label>Stylist</label><input class="a-input" id="nb-venue" placeholder="Who is doing it?"></div>' +
          '<div class="a-field"><label>Package</label><select class="a-select" id="nb-pkg"><option>Single Service</option><option>Glow</option><option>Radiance</option><option>Icon</option></select></div>' +
          '<div class="a-field"><label>Amount (GHS)</label><input class="a-input" type="number" id="nb-amount" placeholder="8000"></div>' +
          '<button class="a-btn a-btn--gold" id="nb-save" style="margin-top:0.4rem;">Save Booking</button>';
        drawerBody.querySelector('#nb-save').addEventListener('click', function () {
          var client = drawerBody.querySelector('#nb-client').value.trim();
          if (!client) { toast('Please enter a client name'); return; }
          var dateVal = drawerBody.querySelector('#nb-date').value;
          BOOKINGS.unshift({
            id: 'BK-' + (2042 + Math.floor(BOOKINGS.length)),
            client: client,
            phone: drawerBody.querySelector('#nb-phone').value || '—',
            type: drawerBody.querySelector('#nb-type').value,
            date: dateVal ? new Date(dateVal + 'T12:00:00') : d(14),
            venue: drawerBody.querySelector('#nb-venue').value || 'To be confirmed',
            pkg: drawerBody.querySelector('#nb-pkg').value,
            amount: parseInt(drawerBody.querySelector('#nb-amount').value, 10) || 0,
            deposit: 0, status: 'Pending', notes: 'Added from admin dashboard.'
          });
          renderBookings();
          closeDrawer();
          toast('Booking added for ' + client);
        });
        drawer.classList.add('is-open');
        backdrop.classList.add('is-open');
      });
    }

    renderBookings();
  }

  /* ---------------- INVENTORY ---------------- */
  if (page === 'inventory') {
    var invGrid = document.getElementById('inv-grid');
    var invCat = 'all';

    function invStatus(item) {
      var avail = item.total - item.out;
      var ratio = avail / item.total;
      if (avail === 0) return { cls: 'badge--out', bar: 'danger', label: 'All rented' };
      if (ratio < 0.2) return { cls: 'badge--low', bar: 'warn', label: 'Low stock' };
      return { cls: 'badge--available', bar: '', label: 'Available' };
    }

    function renderInventory() {
      var items = INVENTORY.filter(function (i) { return invCat === 'all' || i.cat === invCat; });
      invGrid.innerHTML = items.map(function (item, i) {
        var st = invStatus(item);
        var avail = item.total - item.out;
        var pct = Math.round((avail / item.total) * 100);
        return '<div class="inv-card">' +
          '<div class="inv-card-head"><div><div class="inv-name">' + esc(item.name) + '</div><div class="inv-cat">' + esc(item.cat) + ' · ' + esc(item.condition) + '</div></div>' +
          '<span class="badge ' + st.cls + '">' + st.label + '</span></div>' +
          '<div class="inv-bar ' + st.bar + '"><span style="width:' + pct + '%"></span></div>' +
          '<div class="inv-meta"><span>' + avail + ' available</span><span>' + item.out + ' rented / ' + item.total + ' total</span></div>' +
          (item.event ? '<div class="inv-assign">Assigned: <strong>' + esc(item.event) + '</strong></div>' : '') +
          '</div>';
      }).join('');

      // Summary chips
      var totals = { items: 0, out: 0, low: 0 };
      INVENTORY.forEach(function (item) {
        totals.items += item.total; totals.out += item.out;
        var st = invStatus(item);
        if (st.bar) totals.low++;
      });
      var el;
      if ((el = document.getElementById('inv-total'))) el.textContent = totals.items.toLocaleString();
      if ((el = document.getElementById('inv-out'))) el.textContent = totals.out.toLocaleString();
      if ((el = document.getElementById('inv-low'))) el.textContent = totals.low;
    }

    document.querySelectorAll('[data-inv-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-inv-cat]').forEach(function (b) { b.classList.remove('a-btn--gold'); b.classList.add('a-btn--ghost'); });
        btn.classList.add('a-btn--gold'); btn.classList.remove('a-btn--ghost');
        invCat = btn.getAttribute('data-inv-cat');
        renderInventory();
      });
    });

    var invAdd = document.getElementById('add-item');
    var invBackdrop = document.getElementById('drawer-backdrop');
    var invDrawer = document.getElementById('inv-drawer');
    if (invAdd && invDrawer) {
      var closeInv = function () { invDrawer.classList.remove('is-open'); invBackdrop.classList.remove('is-open'); };
      document.getElementById('drawer-close').addEventListener('click', closeInv);
      invBackdrop.addEventListener('click', closeInv);
      invAdd.addEventListener('click', function () {
        invDrawer.classList.add('is-open');
        invBackdrop.classList.add('is-open');
      });
      document.getElementById('inv-save').addEventListener('click', function () {
        var name = document.getElementById('ni-name').value.trim();
        if (!name) { toast('Please enter an item name'); return; }
        INVENTORY.unshift({
          name: name,
          cat: document.getElementById('ni-cat').value,
          total: parseInt(document.getElementById('ni-total').value, 10) || 0,
          out: 0,
          condition: document.getElementById('ni-cond').value,
          event: null
        });
        renderInventory();
        closeInv();
        toast('"' + name + '" added to inventory');
      });
    }

    renderInventory();
  }

  /* ---------------- CLIENTS ---------------- */
  if (page === 'clients') {
    var clBody = document.getElementById('clients-body');
    var clQ = '';

    function renderClients() {
      var rows = CLIENTS.filter(function (c) {
        return !clQ || (c.name + ' ' + c.phone + ' ' + c.email).toLowerCase().indexOf(clQ.toLowerCase()) !== -1;
      });
      clBody.innerHTML = rows.length ? rows.map(function (c) {
        var idx = CLIENTS.indexOf(c);
        return '<tr data-idx="' + idx + '">' +
          '<td><div class="cell-with-avatar">' + avatar(c.name, idx) + '<div><span class="cell-strong">' + esc(c.name) + '</span><span class="cell-sub">' + esc(c.email) + '</span></div></div></td>' +
          '<td>' + esc(c.phone) + '</td>' +
          '<td class="num">' + c.events + '</td>' +
          '<td class="num">' + fmtGHS(c.spent) + '</td>' +
          '<td>' + pretty(c.last) + '</td>' +
          '<td><span class="badge badge--completed">' + esc(c.src) + '</span></td>' +
          '</tr>';
      }).join('') : '<tr class="empty-row"><td colspan="6">No clients found — try a different search.</td></tr>';

      clBody.querySelectorAll('tr[data-idx]').forEach(function (tr) {
        tr.addEventListener('click', function () { openClientDrawer(parseInt(tr.getAttribute('data-idx'), 10)); });
      });
    }

    var clSearch = document.getElementById('cl-search');
    if (clSearch) clSearch.addEventListener('input', function () { clQ = clSearch.value; renderClients(); });

    var clBackdrop = document.getElementById('drawer-backdrop');
    var clDrawer = document.getElementById('client-drawer');
    var clDrawerBody = document.getElementById('drawer-body');
    var clDrawerTitle = document.getElementById('drawer-title');
    var closeCl = function () { clDrawer.classList.remove('is-open'); clBackdrop.classList.remove('is-open'); };
    document.getElementById('drawer-close').addEventListener('click', closeCl);
    clBackdrop.addEventListener('click', closeCl);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCl(); });

    function openClientDrawer(idx) {
      var c = CLIENTS[idx];
      clDrawerTitle.textContent = c.name;
      var history = BOOKINGS.filter(function (b) { return b.client === c.name; });
      clDrawerBody.innerHTML =
        '<ul class="detail-list">' +
        '<li><span>Phone</span><span>' + esc(c.phone) + '</span></li>' +
        '<li><span>Email</span><span>' + esc(c.email) + '</span></li>' +
        '<li><span>Total visits</span><span>' + c.events + '</span></li>' +
        '<li><span>Total spent</span><span>' + fmtGHS(c.spent) + '</span></li>' +
        '<li><span>Last visit</span><span>' + pretty(c.last) + '</span></li>' +
        '<li><span>Source</span><span>' + esc(c.src) + '</span></li>' +
        '</ul>' +
        '<div class="a-field"><label>Notes</label><p style="font-size:0.88rem;">' + esc(c.notes) + '</p></div>' +
        '<div class="a-field"><label>Booking history</label>' +
        (history.length
          ? '<ul class="detail-list">' + history.map(function (b) {
              return '<li><span>' + b.id + ' · ' + esc(b.type) + '</span><span>' + fmtGHS(b.amount) + '</span></li>';
            }).join('') + '</ul>'
          : '<p style="font-size:0.85rem;color:var(--a-ink-soft);font-style:italic;">Past visits will show here once appointments are linked.</p>') +
        '</div>';
      clDrawer.classList.add('is-open');
      clBackdrop.classList.add('is-open');
    }

    var addClient = document.getElementById('add-client');
    if (addClient) {
      addClient.addEventListener('click', function () {
        clDrawerTitle.textContent = 'New Client';
        clDrawerBody.innerHTML =
          '<div class="a-field"><label>Full name</label><input class="a-input" id="nc-name" placeholder="e.g. Yaa Asantewaa"></div>' +
          '<div class="a-field"><label>Phone</label><input class="a-input" id="nc-phone" placeholder="024 000 0000"></div>' +
          '<div class="a-field"><label>Email</label><input class="a-input" id="nc-email" placeholder="name@email.com"></div>' +
          '<div class="a-field"><label>Source</label><select class="a-select" id="nc-src"><option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Google Search</option><option>Referral</option><option>Phone Call</option><option>Community</option></select></div>' +
          '<div class="a-field"><label>Notes</label><input class="a-input" id="nc-notes" placeholder="Anything to remember…"></div>' +
          '<button class="a-btn a-btn--gold" id="nc-save" style="margin-top:0.4rem;">Save Client</button>';
        clDrawerBody.querySelector('#nc-save').addEventListener('click', function () {
          var name = clDrawerBody.querySelector('#nc-name').value.trim();
          if (!name) { toast('Please enter the client name'); return; }
          CLIENTS.unshift({
            name: name,
            phone: clDrawerBody.querySelector('#nc-phone').value || '—',
            email: clDrawerBody.querySelector('#nc-email').value || '—',
            events: 0, spent: 0, last: new Date(),
            src: clDrawerBody.querySelector('#nc-src').value,
            notes: clDrawerBody.querySelector('#nc-notes').value || '—'
          });
          renderClients();
          closeCl();
          toast('Client "' + name + '" added');
        });
        clDrawer.classList.add('is-open');
        clBackdrop.classList.add('is-open');
      });
    }

    renderClients();
  }

  /* ---------------- ANALYTICS ---------------- */
  if (page === 'analytics') {
    // Revenue trend line (12 months)
    registerChart(function () {
      makeChart('chart-trend', {
        type: 'line',
        data: {
          labels: monthLabels12(),
          datasets: [{
            label: 'Revenue',
            data: [14200, 16800, 12400, 19600, 21500, 18200, 26400, 31800, 24600, 38200, 29800, 41200],
            borderColor: COLORS.gold,
            backgroundColor: function (ctx) {
              var g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
              g.addColorStop(0, 'rgba(169, 113, 66,0.28)'); g.addColorStop(1, 'rgba(169, 113, 66,0)');
              return g;
            },
            fill: true, tension: 0.42, borderWidth: 2.5,
            pointRadius: 3, pointBackgroundColor: COLORS.goldLight
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return 'GHS ' + c.parsed.y.toLocaleString(); } } } },
          scales: gridOpts()
        }
      });
    });

    // Bookings by event type doughnut
    registerChart(function () {
      makeChart('chart-types', {
        type: 'doughnut',
        data: {
          labels: ['Braids', 'Nails', 'Lashes', 'Brows', 'Make-Up', 'Facials'],
          datasets: [{
            data: [34, 19, 14, 13, 9, 11],
            backgroundColor: [COLORS.gold, COLORS.powder, COLORS.espresso, COLORS.taupe, COLORS.stone, COLORS.amber],
            borderWidth: 2, borderColor: isDark() ? '#221B17' : '#FFFFFF'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12 } } }
        }
      });
    });

    // Popular services horizontal bar
    registerChart(function () {
      var th = chartTheme();
      makeChart('chart-popular', {
        type: 'bar',
        data: {
          labels: ['Braids', 'Nail extensions', 'Mink lashes', 'Ombre brows', 'Make-up', 'Facials'],
          datasets: [{
            data: [86, 71, 64, 58, 33, 29],
            backgroundColor: [COLORS.gold, COLORS.goldLight, COLORS.espresso, COLORS.stone, COLORS.taupe, COLORS.powder],
            borderRadius: 7, maxBarThickness: 26
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.parsed.x + ' bookings'; } } } },
          scales: {
            x: { grid: { color: th.grid }, border: { display: false } },
            y: { grid: { display: false } }
          }
        }
      });
    });

    // Acquisition pie
    registerChart(function () {
      makeChart('chart-sources', {
        type: 'pie',
        data: {
          labels: ['WhatsApp / Referral', 'Instagram', 'Google Search', 'Facebook', 'Walk-in / Phone'],
          datasets: [{
            data: [36, 27, 17, 12, 8],
            backgroundColor: [COLORS.espresso, COLORS.powder, COLORS.gold, COLORS.stone, COLORS.taupe],
            borderWidth: 2, borderColor: isDark() ? '#221B17' : '#FFFFFF'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 12 } } }
        }
      });
    });

    // Year-over-year grouped bar
    registerChart(function () {
      var thisYear = new Date().getFullYear();
      makeChart('chart-yoy', {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            { label: String(thisYear - 1), data: [38400, 52600, 47100, 78300], backgroundColor: COLORS.stone, borderRadius: 7, maxBarThickness: 38 },
            { label: String(thisYear), data: [50400, 66200, 61800, 94600], backgroundColor: COLORS.gold, borderRadius: 7, maxBarThickness: 38 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': GHS ' + c.parsed.y.toLocaleString(); } } } },
          scales: gridOpts()
        }
      });
    });

    // Seasonal heatmap (rendered as divs)
    var heat = document.getElementById('heatmap');
    if (heat) {
      var ROWS = [
        { label: 'Braids', data: [4, 3, 5, 6, 5, 7, 6, 8, 6, 7, 9, 12] },
        { label: 'Birthdays', data: [3, 2, 3, 4, 4, 3, 5, 4, 3, 4, 5, 8] },
        { label: 'Nails', data: [5, 4, 6, 4, 3, 4, 5, 6, 4, 3, 4, 5] },
        { label: 'Corporate', data: [2, 1, 2, 3, 2, 3, 2, 2, 3, 4, 6, 9] }
      ];
      var max = 12;
      var html = '<div class="hm-label"></div>' + MONTHS.map(function (m) { return '<div class="hm-month">' + m + '</div>'; }).join('');
      ROWS.forEach(function (row) {
        html += '<div class="hm-label">' + row.label + '</div>';
        row.data.forEach(function (v, mi) {
          var op = 0.08 + (v / max) * 0.92;
          html += '<div class="hm-cell" style="opacity:' + op.toFixed(2) + '" title="' + row.label + ' · ' + MONTHS[mi] + ': ' + v + ' appointments"></div>';
        });
      });
      heat.innerHTML = html;
    }
  }
})();
