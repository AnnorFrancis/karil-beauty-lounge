/* ============================================================
   KARIL HAIR & BEAUTY LOUNGE — admin.js
   Simple salon manager: appointments, walk-ins, customers,
   payments, reports and staff. No charts, no jargon.
   Everything is frontend-only (demo) and talks to the client
   through WhatsApp. Website bookings arrive via localStorage.
   ============================================================ */
(function () {
  'use strict';

  /* ================= THEME ================= */
  try {
    var savedTheme = localStorage.getItem('khb-admin-theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (e) {}
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('khb-admin-theme', next); } catch (e) {}
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
  function money(n) { return 'GHS ' + Math.round(n).toLocaleString(); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function d(offsetDays) { var dt = new Date(); dt.setHours(12, 0, 0, 0); dt.setDate(dt.getDate() + offsetDays); return dt; }
  function iso(dt) { var m = ('0' + (dt.getMonth() + 1)).slice(-2), day = ('0' + dt.getDate()).slice(-2); return dt.getFullYear() + '-' + m + '-' + day; }
  function pretty(dt) { return dt.getDate() + ' ' + MONTHS[dt.getMonth()] + ' ' + dt.getFullYear(); }
  function sameDay(a, b) { return iso(a) === iso(b); }
  function daysFromNow(dt) { return Math.floor((dt - new Date()) / 86400000); }

  var STATUS_CLASS = {
    'Confirmed': 'badge--confirmed', 'Pending': 'badge--pending',
    'In Progress': 'badge--progress', 'Completed': 'badge--completed', 'Cancelled': 'badge--cancelled'
  };
  function badge(status) {
    return '<span class="badge ' + (STATUS_CLASS[status] || 'badge--pending') + '">' + esc(status) + '</span>';
  }
  function sourceTag(b) {
    if (b.source === 'Website') return '<span class="src-tag src-web">Website</span>';
    if (b.source === 'Walk-in') return '<span class="src-tag src-walk">Walk-in</span>';
    return '';
  }

  var AVATAR_COLORS = ['#A97142', '#3B2A21', '#6B5B50', '#5B8FB0', '#C0AFA1', '#B08968'];
  function avatar(name, i) {
    var initials = name.split(' ').map(function (p) { return p.charAt(0); }).slice(0, 2).join('').toUpperCase();
    return '<span class="client-avatar" style="background:' + AVATAR_COLORS[i % AVATAR_COLORS.length] + '">' + initials + '</span>';
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
    var start = null, dur = 1100;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (prefix || '') + Math.round(target * eased).toLocaleString() + (suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setTimeout(function () { el.textContent = (prefix || '') + Math.round(target).toLocaleString() + (suffix || ''); }, dur + 150);
  }

  /* ================= WHATSAPP ================= */
  var SALON_NAME = 'KARIL HAIR & BEAUTY LOUNGE';
  var SALON_LINE = 'Greater Accra  |  054 183 4750';
  function waNumber(phone) {
    var n = String(phone || '').replace(/[^0-9]/g, '');
    if (n.indexOf('233') === 0) return n;
    if (n.charAt(0) === '0') return '233' + n.slice(1);
    return n;
  }
  function waSend(phone, text) {
    window.open('https://wa.me/' + (waNumber(phone) || '') + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
  function firstName(s) { return String(s || '').split(' ')[0]; }

  function receiptText(b) {
    var balance = b.amount - b.deposit;
    return '*' + SALON_NAME + '*\n' + SALON_LINE + '\n' +
      '--------------------------------\n' +
      '*RECEIPT*  ' + b.id + '\n' + 'Date: ' + pretty(b.date) + '\n\n' +
      'Client:  ' + b.client + '\n' +
      'Service: ' + b.type + (b.pkg && b.pkg !== 'Single Service' && b.pkg !== 'From website' ? '  (' + b.pkg + ')' : '') + '\n' +
      'Stylist: ' + b.venue + '\n' +
      '--------------------------------\n' +
      'Total:    ' + money(b.amount) + '\n' + 'Paid:     ' + money(b.deposit) + '\n' +
      (balance > 0 ? 'Balance:  ' + money(balance) + '\n' : '*PAID IN FULL*\n') +
      '--------------------------------\n' +
      'Thank you for choosing Karil.\nWe cannot wait to see you again.';
  }
  function reminderText(b) {
    var balance = b.amount - b.deposit;
    return 'Hi ' + firstName(b.client) + ',\n\n' +
      'A friendly reminder of your appointment at *Karil Hair & Beauty Lounge*:\n\n' +
      'Date:    ' + pretty(b.date) + '\nService: ' + b.type + '\nStylist: ' + b.venue + '\n' +
      (balance > 0 ? 'Balance due: ' + money(balance) + '\n' : '') +
      '\nPlease come with clean, detangled hair if you are booked for braids or an install.\nReply here if you need to move your time.';
  }
  function confirmText(b) {
    return 'Hi ' + firstName(b.client) + ',\n\n' +
      'Good news — your appointment at *Karil Hair & Beauty Lounge* is *CONFIRMED*. ✅\n\n' +
      'Date:    ' + pretty(b.date) + '\nService: ' + b.type + '\n\n' +
      'Please arrive 10 minutes early. Reply here if anything changes. See you soon!';
  }
  function rejectText(b) {
    return 'Hi ' + firstName(b.client) + ',\n\n' +
      'Thank you for booking *' + b.type + '* with Karil Hair & Beauty Lounge.\n\n' +
      'Unfortunately that time (' + pretty(b.date) + ') is fully booked. \U0001F64F\n' +
      'Please reply with another day or time that suits you and we will lock it in right away.\n\n' +
      'We really do not want to miss you. — Karil';
  }

  /* ================= WEBSITE BOOKINGS BRIDGE =================
     The public booking form saves each request into localStorage.
     Here we read them so they appear in Appointments automatically. */
  var WEB_KEY = 'khb-web-bookings';
  function loadWeb() { try { return JSON.parse(localStorage.getItem(WEB_KEY) || '[]'); } catch (e) { return []; } }
  function saveWeb(arr) { try { localStorage.setItem(WEB_KEY, JSON.stringify(arr)); } catch (e) {} }
  function setWebStatus(webId, status) {
    var arr = loadWeb(), changed = false;
    for (var i = 0; i < arr.length; i++) { if (arr[i].id === webId) { arr[i].status = status; changed = true; } }
    if (changed) saveWeb(arr);
  }

  /* ================= MOCK DATA ================= */
  var BOOKINGS = [
    { id: 'APT-2041', client: 'Akosua Danso', phone: '024 555 1201', type: 'Braids', date: d(0), venue: 'Karil', pkg: 'Radiance', amount: 680, deposit: 200, status: 'Confirmed', source: 'Instagram', notes: 'Knotless, waist length. Bringing her own hair. Allow 5 hours.' },
    { id: 'APT-2040', client: 'Naa Adjeley Tetteh', phone: '020 441 8890', type: 'Lashes', date: d(0), venue: 'Selina', pkg: 'Single Service', amount: 150, deposit: 0, status: 'Confirmed', source: 'TikTok', notes: 'Hybrid refill. Lunch break slot — must finish by 2pm.' },
    { id: 'APT-2039', client: 'Priscilla Amoah', phone: '027 660 3321', type: 'Make-Up', date: d(1), venue: 'Maame', pkg: 'Icon', amount: 1800, deposit: 900, status: 'Confirmed', source: 'Referral', notes: 'Bridal. Trial already done. Opening early at 6am for the party.' },
    { id: 'APT-2038', client: 'Efua Boakye', phone: '030 277 4410', type: 'Brows', date: d(2), venue: 'Selina', pkg: 'Single Service', amount: 400, deposit: 100, status: 'Confirmed', source: 'Instagram', notes: 'Ombré brows, first session. Patch test done last week.' },
    { id: 'APT-2037', client: 'Adjoa Serwaa', phone: '024 118 7745', type: 'Nails', date: d(2), venue: 'Abena', pkg: 'Glow', amount: 300, deposit: 0, status: 'Pending', source: 'Phone', notes: 'Full set plus pedicure. Waiting for her to confirm the time.' },
    { id: 'APT-2036', client: 'Ama Owusu', phone: '026 909 2288', type: 'Wigs', date: d(3), venue: 'Karil', pkg: 'Single Service', amount: 250, deposit: 100, status: 'Confirmed', source: 'Instagram', notes: 'Frontal install + styling. Wig already dropped off.' },
    { id: 'APT-2035', client: 'Linda Mensah', phone: '055 302 6614', type: 'Braids', date: d(-1), venue: 'Karil', pkg: 'Radiance', amount: 720, deposit: 720, status: 'Completed', source: 'Walk-in', notes: 'Loved the result — ask for a photo and a review.' },
    { id: 'APT-2034', client: 'Gifty Asare', phone: '024 700 5512', type: 'Facial', date: d(4), venue: 'Maame', pkg: 'Single Service', amount: 160, deposit: 0, status: 'Confirmed', source: 'Instagram', notes: 'Deep cleanse. Sensitive skin — no strong exfoliant.' },
    { id: 'APT-2033', client: 'Sandra Nyarko', phone: '020 655 0091', type: 'Nails', date: d(-3), venue: 'Abena', pkg: 'Single Service', amount: 180, deposit: 180, status: 'Completed', source: 'Walk-in', notes: 'Almond set, nude. Refill due in about 3 weeks.' },
    { id: 'APT-2032', client: 'Yaa Pokuaa', phone: '027 233 8181', type: 'Make-Up', date: d(6), venue: 'Maame', pkg: 'Single Service', amount: 200, deposit: 0, status: 'Pending', source: 'TikTok', notes: 'Birthday glam. Awaiting deposit to hold the slot.' },
    { id: 'APT-2031', client: 'Rita Agyeman', phone: '024 866 2299', type: 'Wigs', date: d(-6), venue: 'Karil', pkg: 'Single Service', amount: 470, deposit: 470, status: 'Completed', source: 'Referral', notes: 'Colour + install. Honey blonde came out beautifully.' },
    { id: 'APT-2030', client: 'Josephine Larbi', phone: '055 121 7648', type: 'Lashes', date: d(-9), venue: 'Selina', pkg: 'Glow', amount: 270, deposit: 270, status: 'Completed', source: 'Walk-in', notes: 'Volume set plus brow tint. Very happy.' },
    { id: 'APT-2029', client: 'Comfort Adjei', phone: '030 290 1177', type: 'Braids', date: d(-14), venue: 'Karil', pkg: 'Single Service', amount: 380, deposit: 380, status: 'Completed', source: 'Walk-in', notes: 'Cornrows. Third visit this year — regular client.' },
    { id: 'APT-2028', client: 'Vida Ansah', phone: '026 480 3350', type: 'Nails', date: d(8), venue: 'Abena', pkg: 'Single Service', amount: 180, deposit: 50, status: 'Cancelled', source: 'Phone', notes: 'Travelling — will rebook when back. Deposit carried forward.' }
  ];

  var CLIENTS = [
    { name: 'Akosua Danso', phone: '024 555 1201', email: 'akosua.d@gmail.com', events: 6, spent: 3400, last: d(0), src: 'Instagram', notes: 'Braids every 6–7 weeks. Prefers knotless, waist length. Always on time.' },
    { name: 'Priscilla Amoah', phone: '027 660 3321', email: 'priscilla.a@gmail.com', events: 3, spent: 2900, last: d(1), src: 'Referral', notes: 'Bride. Trial done. Bringing 4 bridesmaids on the day.' },
    { name: 'Linda Mensah', phone: '055 302 6614', email: 'lindam@yahoo.com', events: 8, spent: 4100, last: d(-1), src: 'Walk-in', notes: 'One of our longest clients. Happy to give a testimonial.' },
    { name: 'Naa Adjeley Tetteh', phone: '020 441 8890', email: 'naa.tetteh@gmail.com', events: 11, spent: 1850, last: d(0), src: 'TikTok', notes: 'Lash refills every 3 weeks, always on her lunch break. Keep slots short.' },
    { name: 'Efua Boakye', phone: '030 277 4410', email: 'efua.b@gmail.com', events: 2, spent: 560, last: d(2), src: 'Instagram', notes: 'Ombré brows in progress. Touch-up due in 6 weeks — remind her.' },
    { name: 'Rita Agyeman', phone: '024 866 2299', email: 'rita.agyeman@gmail.com', events: 5, spent: 2300, last: d(-6), src: 'Referral', notes: 'Loves colour. Books a change every season.' },
    { name: 'Adjoa Serwaa', phone: '024 118 7745', email: 'adjoaserwaa@icloud.com', events: 4, spent: 980, last: d(2), src: 'Facebook', notes: 'Nails regular. Sometimes reschedules — confirm the day before.' },
    { name: 'Ama Owusu', phone: '026 909 2288', email: 'ama.owusu@gmail.com', events: 3, spent: 890, last: d(3), src: 'Instagram', notes: 'Drops her wig off ahead of time. Very easy client.' },
    { name: 'Yaa Pokuaa', phone: '027 233 8181', email: 'yaa.p@gmail.com', events: 1, spent: 200, last: d(6), src: 'TikTok', notes: 'First time. Birthday glam — deposit still pending.' },
    { name: 'Josephine Larbi', phone: '055 121 7648', email: 'jlarbi@outlook.com', events: 7, spent: 1620, last: d(-9), src: 'Walk-in', notes: 'Lashes and brows together. Great photos — ask before posting.' }
  ];

  var STAFF = [
    { name: 'Karil', role: 'Owner · Lead Stylist', phone: '054 183 4750', since: 2019, skills: 'Braids, Wigs, Frontals, Colour' },
    { name: 'Selina', role: 'Lash & Brow Artist', phone: '024 700 1180', since: 2021, skills: 'Mink lashes, Ombré brows' },
    { name: 'Abena', role: 'Nail Technician', phone: '020 553 9924', since: 2022, skills: 'Manicure, Pedicure, Nail art' },
    { name: 'Maame', role: 'Make-Up Artist', phone: '026 118 4472', since: 2020, skills: 'Bridal & event make-up, Facials' }
  ];

  // Payments received log — seeded from real deposits plus a few of today's cash sales.
  var PAYMENTS = [];
  BOOKINGS.forEach(function (b) {
    if (b.deposit > 0 && b.status !== 'Cancelled') PAYMENTS.push({ client: b.client, service: b.type, amount: b.deposit, when: b.date });
  });
  PAYMENTS.push({ client: 'Akua Sarpong', service: 'Nails', amount: 180, when: d(0) });
  PAYMENTS.push({ client: 'Esi Quaye', service: 'Braids', amount: 400, when: d(0) });
  PAYMENTS.push({ client: 'Mavis Boateng', service: 'Lashes', amount: 250, when: d(0) });

  // Merge website bookings (newest first) into the top of Appointments.
  loadWeb().slice().reverse().forEach(function (w) {
    BOOKINGS.unshift({
      id: w.id, client: w.name, phone: w.phone, type: w.service,
      date: new Date((w.date || iso(d(2))) + 'T12:00:00'),
      venue: 'Not assigned', pkg: 'From website', amount: w.amount || 0, deposit: 0,
      status: w.status || 'Pending', source: 'Website', web: true, webId: w.id,
      notes: (w.notes ? w.notes + '\n\n' : '') + 'Booked through the website. Confirm the time with the client.'
    });
  });

  /* ================= GENERIC DRAWER ================= */
  var drawer = document.getElementById('page-drawer');
  var drawerBackdrop = document.getElementById('drawer-backdrop');
  var drawerBody = document.getElementById('drawer-body');
  var drawerTitle = document.getElementById('drawer-title');
  function openDrawer(title, html) {
    if (!drawer) return;
    drawerTitle.textContent = title;
    drawerBody.innerHTML = html;
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-open');
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawerBackdrop.classList.remove('is-open');
  }
  if (drawer) {
    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    drawerBackdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  }

  /* ================= SHARED SUMS ================= */
  function totalOwed() {
    return BOOKINGS.filter(function (b) { return b.status !== 'Cancelled'; })
      .reduce(function (s, b) { return s + Math.max(0, b.amount - b.deposit); }, 0);
  }
  function pendingCount() { return BOOKINGS.filter(function (b) { return b.status === 'Pending'; }).length; }
  function todaysAppts() { return BOOKINGS.filter(function (b) { return sameDay(b.date, new Date()) && b.status !== 'Cancelled'; }); }

  var page = document.body.getAttribute('data-page');

  /* ================================================================
     DASHBOARD — a simple launcher with a one-line summary
     ================================================================ */
  if (page === 'dashboard') {
    var dateEl = document.getElementById('today-date');
    if (dateEl) { var n = new Date(); dateEl.textContent = DAYS[n.getDay()] + ', ' + pretty(n); }

    var today = todaysAppts().length;
    var pend = pendingCount();
    var owed = totalOwed();

    var sum = document.getElementById('dash-summary');
    if (sum) {
      sum.innerHTML = 'You have <strong>' + today + '</strong> appointment' + (today === 1 ? '' : 's') + ' today' +
        ' · <strong>' + pend + '</strong> waiting to confirm' +
        ' · <strong>' + money(owed) + '</strong> still owed.';
    }
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
    set('tile-today', today);
    set('tile-confirm', pend + ' to confirm');
    set('tile-customers', CLIENTS.length);
    set('tile-owed', money(owed) + ' owed');
    set('tile-staff', STAFF.length);
  }

  /* ================================================================
     APPOINTMENTS
     ================================================================ */
  if (page === 'bookings') {
    var state = { q: '', type: 'all', chip: 'all' };
    if (location.hash === '#today') state.chip = 'today';
    var body = document.getElementById('bookings-body');
    var countEl = document.getElementById('bookings-count');
    var chipConfirm = document.getElementById('chip-confirm');

    function matchesChip(b) {
      if (state.chip === 'today') return sameDay(b.date, new Date()) && b.status !== 'Cancelled';
      if (state.chip === 'toconfirm') return b.status === 'Pending';
      if (state.chip === 'upcoming') return daysFromNow(b.date) >= 0 && b.status !== 'Cancelled';
      return true;
    }
    function rows() {
      return BOOKINGS.filter(function (b) {
        if (!matchesChip(b)) return false;
        if (state.type !== 'all' && b.type !== state.type) return false;
        if (state.q) {
          var hay = (b.client + ' ' + b.id + ' ' + b.phone + ' ' + b.type).toLowerCase();
          if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
        }
        return true;
      });
    }
    function render() {
      var r = rows();
      if (countEl) countEl.textContent = r.length + ' appointment' + (r.length === 1 ? '' : 's');
      if (chipConfirm) chipConfirm.textContent = pendingCount();
      body.innerHTML = r.length ? r.map(function (b) {
        var idx = BOOKINGS.indexOf(b);
        return '<tr data-idx="' + idx + '">' +
          '<td><span class="cell-strong">' + esc(b.client) + ' ' + sourceTag(b) + '</span><span class="cell-sub">' + esc(b.phone) + '</span></td>' +
          '<td>' + esc(b.type) + '</td>' +
          '<td>' + pretty(b.date) + '</td>' +
          '<td><span class="cell-sub" style="color:var(--a-ink)">' + esc(b.venue) + '</span></td>' +
          '<td class="num">' + money(b.amount) + '</td>' +
          '<td>' + badge(b.status) + '</td>' +
          '</tr>';
      }).join('') : '<tr class="empty-row"><td colspan="6">Nothing here yet. Try another tab or add a new appointment.</td></tr>';
      body.querySelectorAll('tr[data-idx]').forEach(function (tr) {
        tr.addEventListener('click', function () { openBooking(parseInt(tr.getAttribute('data-idx'), 10)); });
      });
    }

    document.querySelectorAll('#bk-chips [data-chip]').forEach(function (c) {
      if (c.getAttribute('data-chip') === state.chip) {
        document.querySelectorAll('#bk-chips [data-chip]').forEach(function (x) { x.classList.remove('is-active'); });
        c.classList.add('is-active');
      }
      c.addEventListener('click', function () {
        document.querySelectorAll('#bk-chips [data-chip]').forEach(function (x) { x.classList.remove('is-active'); });
        c.classList.add('is-active');
        state.chip = c.getAttribute('data-chip');
        render();
      });
    });
    var bkSearch = document.getElementById('bk-search');
    var bkType = document.getElementById('bk-type');
    if (bkSearch) bkSearch.addEventListener('input', function () { state.q = bkSearch.value; render(); });
    if (bkType) bkType.addEventListener('change', function () { state.type = bkType.value; render(); });

    function openBooking(idx) {
      var b = BOOKINGS[idx];
      var balance = b.amount - b.deposit;
      var isPending = b.status === 'Pending';
      var html =
        '<ul class="detail-list">' +
        '<li><span>Status</span><span>' + badge(b.status) + '</span></li>' +
        (b.source === 'Website' ? '<li><span>Came from</span><span>Website booking</span></li>' : (b.source === 'Walk-in' ? '<li><span>Came from</span><span>Walk-in</span></li>' : '')) +
        '<li><span>Service</span><span>' + esc(b.type) + '</span></li>' +
        '<li><span>Date</span><span>' + pretty(b.date) + '</span></li>' +
        '<li><span>Stylist</span><span>' + esc(b.venue) + '</span></li>' +
        '<li><span>Total price</span><span>' + money(b.amount) + '</span></li>' +
        '<li><span>Paid</span><span>' + money(b.deposit) + '</span></li>' +
        '<li><span>Balance</span><span>' + money(balance) + '</span></li>' +
        '<li><span>Phone</span><span>' + esc(b.phone) + '</span></li>' +
        '</ul>' +
        '<div class="a-field"><label>Notes</label><p style="font-size:0.9rem;white-space:pre-line;">' + esc(b.notes) + '</p></div>';

      if (isPending) {
        html += '<div class="drawer-actions drawer-actions--decide">' +
          '<button class="a-btn a-btn--green" id="dr-confirm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Confirm &amp; message</button>' +
          '<button class="a-btn a-btn--soft-red" id="dr-reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>Reject / reschedule</button>' +
          '</div>';
      }
      html += '<div class="drawer-actions">' +
        '<button class="a-btn a-btn--gold" id="dr-receipt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" stroke-linejoin="round"/><path d="M9 8h6M9 12h6" stroke-linecap="round"/></svg>Send receipt</button>' +
        '<button class="a-btn a-btn--ghost" id="dr-remind"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a6 6 0 016 6v4l2 3H4l2-3V9a6 6 0 016-6z" stroke-linejoin="round"/><path d="M10 19a2 2 0 004 0" stroke-linecap="round"/></svg>Send reminder</button>' +
        (balance > 0 ? '<button class="a-btn a-btn--ghost" id="dr-paid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Mark fully paid</button>' : '') +
        '</div>' +
        '<details class="drawer-more"><summary>Change status by hand</summary>' +
        '<select class="a-select" id="dr-status" style="margin-top:0.6rem;">' +
        ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(function (s) {
          return '<option' + (s === b.status ? ' selected' : '') + '>' + s + '</option>';
        }).join('') + '</select></details>' +
        '<p class="drawer-hint">Every button opens WhatsApp with the message already written — you just press send.</p>';

      openDrawer(b.client, html);

      var el;
      if ((el = document.getElementById('dr-confirm'))) el.addEventListener('click', function () {
        b.status = 'Confirmed'; if (b.web) setWebStatus(b.webId, 'Confirmed');
        waSend(b.phone, confirmText(b)); toast(b.client + ' confirmed'); render(); openBooking(idx);
      });
      if ((el = document.getElementById('dr-reject'))) el.addEventListener('click', function () {
        b.status = 'Cancelled'; if (b.web) setWebStatus(b.webId, 'Cancelled');
        waSend(b.phone, rejectText(b)); toast('Message sent — asked her to pick a new time'); render(); openBooking(idx);
      });
      document.getElementById('dr-receipt').addEventListener('click', function () { waSend(b.phone, receiptText(b)); toast('Receipt ready in WhatsApp'); });
      document.getElementById('dr-remind').addEventListener('click', function () { waSend(b.phone, reminderText(b)); toast('Reminder ready in WhatsApp'); });
      if ((el = document.getElementById('dr-paid'))) el.addEventListener('click', function () {
        var paid = b.amount - b.deposit;
        b.deposit = b.amount; if (b.status !== 'Cancelled') b.status = 'Completed';
        PAYMENTS.push({ client: b.client, service: b.type, amount: paid, when: new Date() });
        toast(b.client + ' marked fully paid'); render(); openBooking(idx);
      });
      document.getElementById('dr-status').addEventListener('change', function (e) {
        b.status = e.target.value; if (b.web) setWebStatus(b.webId, b.status);
        toast('Status set to "' + b.status + '"'); render(); openBooking(idx);
      });
    }

    var addBtn = document.getElementById('add-booking');
    if (addBtn) addBtn.addEventListener('click', function () {
      openDrawer('New appointment',
        '<div class="a-field"><label>Customer name</label><input class="a-input" id="nb-client" placeholder="e.g. Ama Owusu"></div>' +
        '<div class="a-field"><label>Phone / WhatsApp</label><input class="a-input" id="nb-phone" type="tel" placeholder="024 000 0000"></div>' +
        '<div class="a-field"><label>Service</label><select class="a-select" id="nb-type"><option>Braids</option><option>Wigs</option><option>Nails</option><option>Lashes</option><option>Brows</option><option>Make-Up</option><option>Facial</option><option>Piercing</option></select></div>' +
        '<div class="a-field"><label>Date</label><input class="a-input" type="date" id="nb-date" value="' + iso(d(2)) + '"></div>' +
        '<div class="a-field"><label>Stylist</label><select class="a-select" id="nb-venue">' + STAFF.map(function (s) { return '<option>' + s.name + '</option>'; }).join('') + '</select></div>' +
        '<div class="a-field"><label>Price (GHS)</label><input class="a-input" type="number" id="nb-amount" inputmode="numeric" placeholder="e.g. 250"></div>' +
        '<button class="a-btn a-btn--gold a-btn--lg" id="nb-save">Save appointment</button>');
      document.getElementById('nb-save').addEventListener('click', function () {
        var name = document.getElementById('nb-client').value.trim();
        if (!name) { toast('Please enter a customer name'); return; }
        var dv = document.getElementById('nb-date').value;
        BOOKINGS.unshift({
          id: 'APT-' + (2042 + BOOKINGS.length), client: name,
          phone: document.getElementById('nb-phone').value || '—',
          type: document.getElementById('nb-type').value,
          date: dv ? new Date(dv + 'T12:00:00') : d(2),
          venue: document.getElementById('nb-venue').value,
          pkg: 'Single Service',
          amount: parseInt(document.getElementById('nb-amount').value, 10) || 0,
          deposit: 0, status: 'Confirmed', source: 'Phone', notes: 'Added by hand from the admin.'
        });
        closeDrawer(); render(); toast('Appointment saved for ' + name);
      });
    });

    render();
  }

  /* ================================================================
     WALK-IN
     ================================================================ */
  if (page === 'walkin') {
    var staffSel = document.getElementById('wi-staff');
    if (staffSel) staffSel.innerHTML = STAFF.map(function (s) { return '<option>' + s.name + '</option>'; }).join('');

    function renderWalkins() {
      var list = BOOKINGS.filter(function (b) { return b.source === 'Walk-in' && sameDay(b.date, new Date()); });
      var body = document.getElementById('walkin-today');
      var cnt = document.getElementById('wi-count');
      if (cnt) cnt.textContent = list.length + ' walk-in' + (list.length === 1 ? '' : 's') + ' so far today';
      body.innerHTML = list.length ? list.map(function (b) {
        var bal = b.amount - b.deposit;
        return '<tr><td class="cell-strong">' + esc(b.client) + '</td><td>' + esc(b.type) + '</td><td>' + esc(b.venue) + '</td>' +
          '<td class="num">' + money(b.deposit) + '</td><td class="num">' + (bal > 0 ? money(bal) : '—') + '</td></tr>';
      }).join('') : '<tr class="empty-row"><td colspan="5">No walk-ins recorded yet today.</td></tr>';
    }

    var wiSave = document.getElementById('wi-save');
    if (wiSave) wiSave.addEventListener('click', function () {
      var name = document.getElementById('wi-name').value.trim();
      if (!name) { toast('Please enter the client name'); return; }
      var amount = parseInt(document.getElementById('wi-amount').value, 10) || 0;
      var paid = parseInt(document.getElementById('wi-paid').value, 10) || 0;
      if (paid > amount) paid = amount;
      var service = document.getElementById('wi-service').value;
      var stylist = document.getElementById('wi-staff').value;
      var phone = document.getElementById('wi-phone').value || '—';
      BOOKINGS.unshift({
        id: 'WLK-' + (Date.now() % 100000), client: name, phone: phone, type: service,
        date: d(0), venue: stylist, pkg: 'Single Service', amount: amount, deposit: paid,
        status: 'In Progress', source: 'Walk-in', notes: 'Walked in today.'
      });
      if (paid > 0) PAYMENTS.push({ client: name, service: service, amount: paid, when: new Date() });
      // add to customer list if new
      var exists = CLIENTS.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); });
      if (!exists) CLIENTS.unshift({ name: name, phone: phone, email: '—', events: 1, spent: paid, last: new Date(), src: 'Walk-in', notes: 'Added from a walk-in visit.' });
      ['wi-name', 'wi-phone', 'wi-amount', 'wi-paid'].forEach(function (id) { document.getElementById(id).value = ''; });
      renderWalkins();
      toast(name + ' saved to today’s appointments');
    });

    renderWalkins();
  }

  /* ================================================================
     CUSTOMERS
     ================================================================ */
  if (page === 'clients') {
    var clBody = document.getElementById('clients-body');
    var clCount = document.getElementById('clients-count');
    var clQ = '';
    function renderClients() {
      var r = CLIENTS.filter(function (c) { return !clQ || (c.name + ' ' + c.phone + ' ' + c.email).toLowerCase().indexOf(clQ.toLowerCase()) !== -1; });
      if (clCount) clCount.textContent = CLIENTS.length + ' customer' + (CLIENTS.length === 1 ? '' : 's');
      clBody.innerHTML = r.length ? r.map(function (c) {
        var idx = CLIENTS.indexOf(c);
        return '<tr data-idx="' + idx + '">' +
          '<td><div class="cell-with-avatar">' + avatar(c.name, idx) + '<div><span class="cell-strong">' + esc(c.name) + '</span><span class="cell-sub">' + esc(c.email) + '</span></div></div></td>' +
          '<td>' + esc(c.phone) + '</td>' +
          '<td class="num">' + c.events + '</td>' +
          '<td class="num">' + money(c.spent) + '</td>' +
          '<td>' + pretty(c.last) + '</td>' +
          '<td><span class="badge badge--completed">' + esc(c.src) + '</span></td>' +
          '</tr>';
      }).join('') : '<tr class="empty-row"><td colspan="6">No customers found — try a different search.</td></tr>';
      clBody.querySelectorAll('tr[data-idx]').forEach(function (tr) {
        tr.addEventListener('click', function () { openClient(parseInt(tr.getAttribute('data-idx'), 10)); });
      });
    }
    var clSearch = document.getElementById('cl-search');
    if (clSearch) clSearch.addEventListener('input', function () { clQ = clSearch.value; renderClients(); });

    function openClient(idx) {
      var c = CLIENTS[idx];
      var history = BOOKINGS.filter(function (b) { return b.client === c.name; });
      openDrawer(c.name,
        '<ul class="detail-list">' +
        '<li><span>Phone</span><span>' + esc(c.phone) + '</span></li>' +
        '<li><span>Email</span><span>' + esc(c.email) + '</span></li>' +
        '<li><span>Total visits</span><span>' + c.events + '</span></li>' +
        '<li><span>Total spent</span><span>' + money(c.spent) + '</span></li>' +
        '<li><span>Last visit</span><span>' + pretty(c.last) + '</span></li>' +
        '<li><span>Found us via</span><span>' + esc(c.src) + '</span></li>' +
        '</ul>' +
        '<div class="a-field"><label>Notes</label><p style="font-size:0.9rem;">' + esc(c.notes) + '</p></div>' +
        '<div class="drawer-actions"><button class="a-btn a-btn--gold" id="cl-msg"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-1 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 22h-.01a9.87 9.87 0 01-5-1.4l-.4-.2-3.7 1 1-3.7-.2-.4A9.9 9.9 0 1112 22z"/></svg>Message on WhatsApp</button></div>' +
        '<div class="a-field" style="margin-top:1rem;"><label>Recent visits</label>' +
        (history.length ? '<ul class="detail-list">' + history.slice(0, 6).map(function (b) {
          return '<li><span>' + esc(b.type) + ' · ' + pretty(b.date) + '</span><span>' + money(b.amount) + '</span></li>';
        }).join('') + '</ul>' : '<p style="font-size:0.85rem;color:var(--a-ink-soft);font-style:italic;">No visits recorded yet.</p>') +
        '</div>');
      document.getElementById('cl-msg').addEventListener('click', function () {
        waSend(c.phone, 'Hi ' + firstName(c.name) + ', it’s Karil Hair & Beauty Lounge ❤️ Just checking in — would you like to book your next appointment?');
        toast('Message ready in WhatsApp');
      });
    }

    var addClient = document.getElementById('add-client');
    if (addClient) addClient.addEventListener('click', function () {
      openDrawer('New customer',
        '<div class="a-field"><label>Full name</label><input class="a-input" id="nc-name" placeholder="e.g. Yaa Asantewaa"></div>' +
        '<div class="a-field"><label>Phone / WhatsApp</label><input class="a-input" id="nc-phone" type="tel" placeholder="024 000 0000"></div>' +
        '<div class="a-field"><label>Email (optional)</label><input class="a-input" id="nc-email" placeholder="name@email.com"></div>' +
        '<div class="a-field"><label>How did they find you?</label><select class="a-select" id="nc-src"><option>Instagram</option><option>TikTok</option><option>Facebook</option><option>WhatsApp</option><option>Referral</option><option>Walk-in</option><option>Google Search</option></select></div>' +
        '<button class="a-btn a-btn--gold a-btn--lg" id="nc-save">Save customer</button>');
      document.getElementById('nc-save').addEventListener('click', function () {
        var name = document.getElementById('nc-name').value.trim();
        if (!name) { toast('Please enter the customer name'); return; }
        CLIENTS.unshift({ name: name, phone: document.getElementById('nc-phone').value || '—', email: document.getElementById('nc-email').value || '—', events: 0, spent: 0, last: new Date(), src: document.getElementById('nc-src').value, notes: 'Added by hand.' });
        closeDrawer(); renderClients(); toast('Customer "' + name + '" added');
      });
    });

    renderClients();
  }

  /* ================================================================
     PAYMENTS
     ================================================================ */
  if (page === 'payments') {
    function madeIn(days) {
      var since = new Date(); since.setDate(since.getDate() - days);
      return PAYMENTS.filter(function (p) { return p.when >= since; }).reduce(function (s, p) { return s + p.amount; }, 0);
    }
    function madeToday() { return PAYMENTS.filter(function (p) { return sameDay(p.when, new Date()); }).reduce(function (s, p) { return s + p.amount; }, 0); }

    function renderPayments() {
      var tEl = document.getElementById('pay-today'); if (tEl) animateCount(tEl, madeToday(), 'GHS ');
      var wEl = document.getElementById('pay-week'); if (wEl) animateCount(wEl, madeIn(7), 'GHS ');
      var oEl = document.getElementById('pay-owed'); if (oEl) animateCount(oEl, totalOwed(), 'GHS ');

      var owing = BOOKINGS.filter(function (b) { return b.status !== 'Cancelled' && (b.amount - b.deposit) > 0; });
      var oc = document.getElementById('owed-count'); if (oc) oc.textContent = owing.length + ' customer' + (owing.length === 1 ? '' : 's') + ' with a balance';
      document.getElementById('owed-body').innerHTML = owing.length ? owing.map(function (b) {
        var idx = BOOKINGS.indexOf(b);
        return '<tr><td class="cell-strong">' + esc(b.client) + '</td><td>' + esc(b.type) + '</td>' +
          '<td class="num money-owed">' + money(b.amount - b.deposit) + '</td>' +
          '<td class="row-actions"><button class="a-btn a-btn--gold a-btn--sm" data-pay="' + idx + '">Record</button>' +
          '<button class="a-btn a-btn--ghost a-btn--sm" data-remind="' + idx + '">Remind</button></td></tr>';
      }).join('') : '<tr class="empty-row"><td colspan="4">Everyone is paid up. Nice! ✨</td></tr>';

      var recent = PAYMENTS.slice().sort(function (a, b) { return b.when - a.when; }).slice(0, 12);
      document.getElementById('paid-body').innerHTML = recent.map(function (p) {
        return '<tr><td class="cell-strong">' + esc(p.client) + '</td><td>' + esc(p.service) + '</td>' +
          '<td class="num money-in">' + money(p.amount) + '</td><td>' + (sameDay(p.when, new Date()) ? 'Today' : pretty(p.when)) + '</td></tr>';
      }).join('');

      document.querySelectorAll('[data-pay]').forEach(function (btn) {
        btn.addEventListener('click', function () { recordPayment(parseInt(btn.getAttribute('data-pay'), 10)); });
      });
      document.querySelectorAll('[data-remind]').forEach(function (btn) {
        btn.addEventListener('click', function () { var b = BOOKINGS[parseInt(btn.getAttribute('data-remind'), 10)]; waSend(b.phone, reminderText(b)); toast('Reminder ready in WhatsApp'); });
      });
    }

    function recordPayment(idx) {
      var b = BOOKINGS[idx];
      var bal = b.amount - b.deposit;
      openDrawer('Record a payment',
        '<ul class="detail-list"><li><span>Customer</span><span>' + esc(b.client) + '</span></li>' +
        '<li><span>Service</span><span>' + esc(b.type) + '</span></li>' +
        '<li><span>Balance owed</span><span>' + money(bal) + '</span></li></ul>' +
        '<div class="a-field"><label>Amount received now (GHS)</label><input class="a-input" type="number" id="rp-amt" inputmode="numeric" value="' + bal + '"></div>' +
        '<button class="a-btn a-btn--gold a-btn--lg" id="rp-save">Save payment</button>' +
        '<p class="drawer-hint">This reduces what they owe and adds to today’s takings.</p>');
      document.getElementById('rp-save').addEventListener('click', function () {
        var amt = parseInt(document.getElementById('rp-amt').value, 10) || 0;
        if (amt <= 0) { toast('Enter an amount'); return; }
        if (amt > bal) amt = bal;
        b.deposit += amt;
        if (b.amount - b.deposit <= 0 && b.status !== 'Cancelled') b.status = 'Completed';
        PAYMENTS.push({ client: b.client, service: b.type, amount: amt, when: new Date() });
        closeDrawer(); renderPayments(); toast(money(amt) + ' recorded for ' + b.client);
      });
    }

    var recBtn = document.getElementById('pay-record');
    if (recBtn) recBtn.addEventListener('click', function () {
      var owing = BOOKINGS.filter(function (b) { return b.status !== 'Cancelled' && (b.amount - b.deposit) > 0; });
      if (!owing.length) { toast('No outstanding balances'); return; }
      recordPayment(BOOKINGS.indexOf(owing[0]));
    });

    renderPayments();
  }

  /* ================================================================
     REPORTS — plain numbers only, no charts
     ================================================================ */
  if (page === 'reports') {
    // Figures are kept internally consistent — each period's headline totals
    // equal the sum of its breakdown table, so nothing ever looks off.
    var REPORT = {
      week: { earned: 4180, appts: 14, newC: 3, busy: 'Saturday', range: 'The last 7 days',
        rows: [['Braids', 5, 2100], ['Nails', 3, 720], ['Make-Up', 2, 900], ['Lashes', 2, 340], ['Brows', 2, 120]] },
      month: { earned: 18640, appts: 71, newC: 15, busy: 'Saturdays', range: MONTHS[new Date().getMonth()] + ' ' + new Date().getFullYear(),
        rows: [['Braids', 26, 10800], ['Nails', 15, 3200], ['Lashes', 12, 2040], ['Make-Up', 9, 1980], ['Brows', 9, 620]] },
      year: { earned: 214800, appts: 812, newC: 173, busy: 'December Saturdays', range: 'January to December ' + new Date().getFullYear(),
        rows: [['Braids', 300, 118000], ['Nails', 176, 38200], ['Make-Up', 104, 26400], ['Lashes', 140, 23800], ['Brows', 92, 8400]] }
    };

    function renderReport(period) {
      var r = REPORT[period];
      var top = r.rows.slice().sort(function (a, b) { return b[2] - a[2]; })[0];
      var eEl = document.getElementById('rep-earned'); if (eEl) animateCount(eEl, r.earned, 'GHS ');
      var aEl = document.getElementById('rep-appts'); if (aEl) animateCount(aEl, r.appts);
      var nEl = document.getElementById('rep-new'); if (nEl) animateCount(nEl, r.newC);
      document.getElementById('rep-busy').textContent = r.busy;
      document.getElementById('rep-range').textContent = r.range;
      document.getElementById('rep-breakdown').innerHTML = r.rows.map(function (row) {
        return '<tr><td class="cell-strong">' + row[0] + '</td><td class="num">' + row[1] + '</td><td class="num money-in">' + money(row[2]) + '</td></tr>';
      }).join('');
      document.getElementById('rep-note').innerHTML =
        'You earned <strong>' + money(r.earned) + '</strong> from <strong>' + r.appts + '</strong> appointments. ' +
        '<strong>' + top[0] + '</strong> brought in the most money, and your busiest time was <strong>' + r.busy + '</strong>.';
    }

    document.querySelectorAll('#rep-chips [data-period]').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('#rep-chips [data-period]').forEach(function (x) { x.classList.remove('is-active'); });
        c.classList.add('is-active');
        renderReport(c.getAttribute('data-period'));
      });
    });
    renderReport('week');
  }

  /* ================================================================
     STAFF
     ================================================================ */
  if (page === 'staff') {
    function apptsThisWeek(name) {
      return BOOKINGS.filter(function (b) { return b.venue === name && b.status !== 'Cancelled' && daysFromNow(b.date) >= -7 && daysFromNow(b.date) <= 7; }).length;
    }
    function workingToday() {
      return STAFF.filter(function (s) { return BOOKINGS.some(function (b) { return b.venue === s.name && sameDay(b.date, new Date()) && b.status !== 'Cancelled'; }); }).length;
    }
    function renderStaff() {
      var cEl = document.getElementById('staff-count'); if (cEl) animateCount(cEl, STAFF.length);
      var wEl = document.getElementById('staff-today'); if (wEl) wEl.textContent = workingToday();
      var aEl = document.getElementById('staff-appts');
      if (aEl) aEl.textContent = BOOKINGS.filter(function (b) { return b.status !== 'Cancelled' && daysFromNow(b.date) >= -7 && daysFromNow(b.date) <= 7; }).length;
      document.getElementById('staff-grid').innerHTML = STAFF.map(function (s, i) {
        return '<div class="staff-card">' +
          '<div class="staff-top">' + avatar(s.name, i) + '<div><div class="staff-name">' + esc(s.name) + '</div><div class="staff-role">' + esc(s.role) + '</div></div></div>' +
          '<div class="staff-meta"><span>' + esc(s.skills) + '</span></div>' +
          '<div class="staff-stats"><div><strong>' + apptsThisWeek(s.name) + '</strong><span>appts this week</span></div><div><strong>' + (new Date().getFullYear() - s.since) + 'y</strong><span>with Karil</span></div></div>' +
          '<button class="a-btn a-btn--ghost a-btn--sm staff-msg" data-phone="' + esc(s.phone) + '" data-name="' + esc(s.name) + '">Message ' + esc(firstName(s.name)) + '</button>' +
          '</div>';
      }).join('');
      document.querySelectorAll('.staff-msg').forEach(function (btn) {
        btn.addEventListener('click', function () {
          waSend(btn.getAttribute('data-phone'), 'Hi ' + firstName(btn.getAttribute('data-name')) + ', quick note from Karil about today’s schedule:');
          toast('Message ready in WhatsApp');
        });
      });
    }

    var addStaff = document.getElementById('add-staff');
    if (addStaff) addStaff.addEventListener('click', function () {
      openDrawer('Add staff',
        '<div class="a-field"><label>Name</label><input class="a-input" id="ns-name" placeholder="e.g. Adwoa"></div>' +
        '<div class="a-field"><label>Role</label><input class="a-input" id="ns-role" placeholder="e.g. Nail Technician"></div>' +
        '<div class="a-field"><label>Phone / WhatsApp</label><input class="a-input" id="ns-phone" type="tel" placeholder="024 000 0000"></div>' +
        '<div class="a-field"><label>What they do</label><input class="a-input" id="ns-skills" placeholder="e.g. Manicure, Pedicure"></div>' +
        '<button class="a-btn a-btn--gold a-btn--lg" id="ns-save">Save staff</button>');
      document.getElementById('ns-save').addEventListener('click', function () {
        var name = document.getElementById('ns-name').value.trim();
        if (!name) { toast('Please enter a name'); return; }
        STAFF.push({ name: name, role: document.getElementById('ns-role').value || 'Stylist', phone: document.getElementById('ns-phone').value || '—', since: new Date().getFullYear(), skills: document.getElementById('ns-skills').value || '—' });
        closeDrawer(); renderStaff(); toast(name + ' added to the team');
      });
    });

    renderStaff();
  }
})();
