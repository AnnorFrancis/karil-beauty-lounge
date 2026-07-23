/* ============================================================
   KARIL HAIR & BEAUTY LOUNGE — ai-chat.js
   "Karil Beauty Assistant" — frontend-simulated concierge chat.
   Injects its own markup, so a single script tag enables it
   on any page. Responses are scripted/keyword-matched (demo).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Markup ---------- */
  var root = document.createElement('div');
  root.innerHTML =
    '<button class="chat-fab" aria-label="Open Karil Beauty Assistant" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
        '<path d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.1 2.6 5.5-.2 1.2-.8 2.3-1.6 3.1 1.7 0 3.2-.6 4.4-1.4 1.1.4 2.3.7 3.6.7 5 0 9-3.6 9-7.9S17 3 12 3z"/>' +
        '<path d="M8.5 11h.01M12 11h.01M15.5 11h.01" stroke-linecap="round" stroke-width="2.4"/>' +
      '</svg>' +
      '<span class="chat-dot"></span>' +
    '</button>' +
    '<div class="chat-window" role="dialog" aria-label="Karil Beauty Assistant chat">' +
      '<div class="chat-header">' +
        '<div class="chat-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 2c1.8 2.5 1.8 5.5 0 8-1.8-2.5-1.8-5.5 0-8zM12 10c2.5-1.8 5.5-1.8 8 0-2.5 1.8-5.5 1.8-8 0zM12 10c-2.5-1.8-5.5-1.8-8 0 2.5 1.8 5.5 1.8 8 0zM12 10v10" stroke-linecap="round"/></svg></div>' +
        '<div class="chat-header-info">' +
          '<div class="chat-header-name">Karil Beauty Assistant</div>' +
          '<div class="chat-header-status">Online — replies instantly</div>' +
        '</div>' +
        '<button class="chat-close" aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg></button>' +
      '</div>' +
      '<div class="chat-body" aria-live="polite"></div>' +
      '<div class="chat-quick"></div>' +
      '<form class="chat-input">' +
        '<input type="text" placeholder="Ask about pricing, dates, services…" aria-label="Type your message">' +
        '<button type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12l16-7-6 16-2.5-6.5L4 12z" stroke-linejoin="round"/></svg></button>' +
      '</form>' +
      '<div class="chat-powered">Powered by Karil AI · Demo</div>' +
    '</div>';
  while (root.firstChild) document.body.appendChild(root.firstChild);

  var fab = document.querySelector('.chat-fab');
  var win = document.querySelector('.chat-window');
  var body = win.querySelector('.chat-body');
  var quick = win.querySelector('.chat-quick');
  var form = win.querySelector('.chat-input');
  var input = form.querySelector('input');
  var closeBtn = win.querySelector('.chat-close');

  var opened = false;

  /* ---------- Helpers ---------- */
  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function addMsg(html, who) {
    var m = document.createElement('div');
    m.className = 'chat-msg chat-msg--' + who;
    m.innerHTML = html;
    body.appendChild(m);
    scrollDown();
  }

  function typing(ms) {
    return new Promise(function (resolve) {
      var t = document.createElement('div');
      t.className = 'chat-typing';
      t.innerHTML = '<i></i><i></i><i></i>';
      body.appendChild(t);
      scrollDown();
      window.setTimeout(function () { t.remove(); resolve(); }, ms);
    });
  }

  function botSay(html, delay) {
    return typing(delay || 1100).then(function () { addMsg(html, 'bot'); });
  }

  function setQuickReplies(replies) {
    quick.innerHTML = '';
    replies.forEach(function (r) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = r.label;
      b.addEventListener('click', function () { handleUser(r.label, r.intent); });
      quick.appendChild(b);
    });
  }

  var DEFAULT_QUICK = [
    { label: 'View Packages', intent: 'packages' },
    { label: 'Book Appointment', intent: 'consult' },
    { label: 'How Long Does It Take?', intent: 'availability' },
    { label: 'Speak to Team', intent: 'team' }
  ];

  /* ---------- Scripted opening conversation ---------- */
  function playIntro() {
    botSay('Hey love \u2728 Welcome to <strong>Karil Hair &amp; Beauty Lounge</strong>. I can help with prices, availability or what to book. What are you thinking of getting done?', 900)
      .then(function () {
        return new Promise(function (r) { window.setTimeout(r, 1400); });
      })
      .then(function () {
        addMsg('How much for knotless braids?', 'user');
        return botSay(
          'Great choice \U0001F4AB Knotless braids start from <strong>GHS 300</strong>, and the final price depends on length and size.<br><br>' +
          '\u2022 Shoulder length \u2014 from GHS 300<br>' +
          '\u2022 Mid-back \u2014 from GHS 380<br>' +
          '\u2022 Waist length \u2014 from GHS 450<br><br>' +
          'Are you bringing your own hair, or would you like us to supply it?', 1500);
      })
      .then(function () {
        return new Promise(function (r) { window.setTimeout(r, 1600); });
      })
      .then(function () {
        addMsg('Bringing my own. Can I add lashes too?', 'user');
        return botSay(
          'Absolutely \u2014 and booking them together saves you money. \U0001F495<br><br>' +
          'Braids + a <strong>mink lash set</strong> in one visit comes to about <strong>GHS 420</strong> after our bundle discount, and takes roughly 4\u20135 hours.<br><br>' +
          'Shall I check which days we have free this week?', 1700);
      })
      .then(function () {
        setQuickReplies(DEFAULT_QUICK);
      });
  }

  /* ---------- Keyword intelligence (demo) ---------- */
  var RESPONSES = [
    { match: /(price|pricing|cost|how much|charge|rate)/i, intent: 'packages' },
    { match: /(package|glow|radiance|icon|bundle)/i, intent: 'packages' },
    { match: /(book|appointment|slot|available|availability|free)/i, intent: 'consult' },
    { match: /(braid|knotless|cornrow|twist|ghana weaving)/i, intent: 'braids' },
    { match: /(wig|frontal|closure|install|colour|color|dye|highlight)/i, intent: 'wigs' },
    { match: /(nail|manicure|pedicure|acrylic|gel|extension)/i, intent: 'nails' },
    { match: /(lash|mink|volume|hybrid)/i, intent: 'lashes' },
    { match: /(brow|ombre|ombr\u00e9|lamination|microblading)/i, intent: 'brows' },
    { match: /(make.?up|glam|bridal|wedding|beat)/i, intent: 'makeup' },
    { match: /(facial|skin|acne|piercing|pierce)/i, intent: 'skin' },
    { match: /(long|duration|how many hours|take)/i, intent: 'availability' },
    { match: /(team|human|person|call|speak|talk)/i, intent: 'team' },
    { match: /(where|location|accra|address|find you|open)/i, intent: 'location' },
    { match: /(hello|hi|hey|good (morning|afternoon|evening)|akwaaba)/i, intent: 'greet' },
    { match: /(thank|medaase)/i, intent: 'thanks' }
  ];

  var INTENT_REPLIES = {
    packages:
      'Here is the quick price list:<br><br>' +
      '\u2022 Braids \u2014 from GHS 300<br>' +
      '\u2022 Frontal install \u2014 from GHS 250<br>' +
      '\u2022 Nail extensions \u2014 from GHS 180<br>' +
      '\u2022 Mink lashes \u2014 from GHS 150<br>' +
      '\u2022 Ombr\u00e9 brows \u2014 from GHS 400<br>' +
      '\u2022 Make-up \u2014 from GHS 200<br><br>' +
      'Booking two or more together always works out cheaper \u2014 build your own on the <a href="./packages.html" style="color:#A97142;font-weight:700;text-decoration:underline;">Packages page</a>.',
    consult:
      'Let\u2019s get you booked \U0001F4C5 We are open <strong>Mon\u2013Sun, 8am\u20137pm</strong>. Saturdays fill up first, so midweek is easier for long appointments. Use our <a href="./contact.html" style="color:#A97142;font-weight:700;text-decoration:underline;">booking form</a> or WhatsApp <strong>054 183 4750</strong> \u2014 which do you prefer?',
    braids:
      'Braids are our signature \U0001F4AB Knotless, box braids, cornrows, twists and Ghana weaving \u2014 from <strong>GHS 300</strong> depending on length and size. We braid gently so your edges survive the style. Are you bringing your own hair?',
    wigs:
      'We do wig caps, custom wigs, frontal and closure installs, revamps and full colouring. \u2728 Installs start from <strong>GHS 250</strong>, colouring from <strong>GHS 220</strong>. We bleach and pluck properly so the hairline actually looks like yours.',
    nails:
      'Nails start at <strong>GHS 120</strong> for a manicure and pedicure, and <strong>GHS 180</strong> for a full set of extensions. \U0001F485 Any shape, any length, plus art and chrome finishes. Refills welcome even if the set was done elsewhere.',
    lashes:
      'Lashes from <strong>GHS 150</strong> \u2014 classic, hybrid, mink volume and mega volume. \U0001F441\uFE0F We map every set to your eye shape first, so it opens the eye instead of dragging it down. Refills are cheaper than a fresh set.',
    brows:
      'Ombr\u00e9 brows are <strong>GHS 400</strong> and include your 6-week touch-up. \u2728 We map and draw them on first so you approve the shape before anything is permanent. Shaping and tinting alone start from GHS 50.',
    makeup:
      'Make-up from <strong>GHS 200</strong> for soft glam. \U0001F484 Bridal is from GHS 800 and includes a trial beforehand. We shade-match at your jaw in daylight, so you never go grey in photos. What is the occasion?',
    skin:
      'Facials from <strong>GHS 160</strong> \u2014 deep cleansing, hydrating and acne treatments built for Accra heat and dust. \U0001F9F4 Piercing is from <strong>GHS 80</strong> with a sterile single-use needle and full aftercare.',
    availability:
      'Rough timings so you can plan your day \u23F1\uFE0F<br><br>\u2022 Braids \u2014 3 to 6 hours<br>\u2022 Frontal install \u2014 2 to 3 hours<br>\u2022 Nail extensions \u2014 about 90 minutes<br>\u2022 Lashes \u2014 90 minutes to 2 hours<br>\u2022 Make-up \u2014 about an hour<br><br>We book realistic slots, so you are not left waiting.',
    team:
      'Of course! Our team is a call or message away:<br><br>\U0001F4DE 054 183 4750<br>\U0001F4DE 024 340 8001<br><br>Or tap the green WhatsApp button to chat instantly. We reply within minutes during opening hours (Mon\u2013Sun, 8am\u20137pm).',
    location:
      'We are in <strong>Greater Accra</strong> \U0001F4CD and open <strong>Mon\u2013Sun, 8am\u20137pm</strong>. Walk-ins are welcome whenever a chair is free, but booking guarantees your slot. Map is on our <a href="./contact.html" style="color:#A97142;font-weight:700;text-decoration:underline;">contact page</a>.',
    greet:
      'Hey love \u2728 So glad you are here. Ask me anything about braids, wigs, nails, lashes, brows, make-up or facials \u2014 or tap a quick option below.',
    thanks:
      'You are so welcome! \U0001F495 We cannot wait to have you in the chair. Anything else I can help with?',
    fallback:
      'Good question! For that one our team will answer best \u2014 reach them on <strong>054 183 4750</strong> or tap <em>Speak to Team</em> below. Meanwhile, would you like to see prices or check availability?'
  };

  function detectIntent(text) {
    for (var i = 0; i < RESPONSES.length; i++) {
      if (RESPONSES[i].match.test(text)) return RESPONSES[i].intent;
    }
    return 'fallback';
  }

  function handleUser(text, intent) {
    addMsg(text.replace(/</g, '&lt;'), 'user');
    quick.innerHTML = '';
    var key = intent || detectIntent(text);
    botSay(INTENT_REPLIES[key] || INTENT_REPLIES.fallback, 1200).then(function () {
      setQuickReplies(DEFAULT_QUICK);
    });
  }

  /* ---------- Events ---------- */
  function setOpen(open) {
    win.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && !opened) { opened = true; playIntro(); }
    if (open) window.setTimeout(function () { input.focus(); }, 450);
  }
  fab.addEventListener('click', function () { setOpen(!win.classList.contains('is-open')); });
  closeBtn.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && win.classList.contains('is-open')) setOpen(false);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleUser(text);
  });
})();
