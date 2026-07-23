# Karil Hair & Beauty Lounge — Website & Admin Suite

A production-grade sample website for **Karil Hair & Beauty Lounge** — braids, wigs,
frontals, hair colouring, nails, lashes, brows, make-up, facials and piercing in
Greater Accra, Ghana.

> Designed & Developed by [Perkins Creative](https://perkins-swart.vercel.app)

---

## What's inside

```
karil-beauty/
  index.html          Home — hero slideshow, services, stats, look book, packages, testimonials
  services.html       All 6 service groups + before/after slider + smart recommendations
  gallery.html        Filterable look book (7 categories) with FLIP animations and lightbox
  about.html          Story, timeline, values, team
  packages.html       3 packages + interactive service builder (live total → WhatsApp)
  contact.html        4-step booking form with instant price estimate + map + contact channels
  admin/
    dashboard.html    Today — appointments, money collected, week ahead
    bookings.html     Appointments — search / filter, detail drawer, status updates
    inventory.html    Products & Stock — hair, nails, lashes & brows, skin
    clients.html      Clients — visit history and notes
    analytics.html    Earnings — revenue trend, popular services, busiest months
  css/
    style.css         Design system + the Karil "aura" animation layer
    animations.css    Keyframes & motion utilities
    admin.css         Admin design system (light + dark)
  js/
    main.js           Nav, preloader, shimmer canvas, counters, reveals, WhatsApp float
    animations.js     GSAP ScrollTrigger layer, hero choreography, tilt, before/after
    gallery.js        Look book filters (FLIP) + lightbox
    booking.js        Multi-step booking form, price estimator, service builder
    ai-chat.js        "Karil Beauty Assistant" chat widget (simulated)
    admin.js          Admin engine: mock data, tables, drawers, Chart.js, dark mode
  assets/
    icons/favicon.svg
    images/           (drop the client's real client photos here later)
```

## How to run

No build step. No install. Plain HTML/CSS/JS with relative paths.

- **Quickest:** double-click `index.html`.
- **Recommended:** serve the folder — `python -m http.server` inside it, or VS Code Live Server.
- **Hosting:** upload the folder as-is to any static host (Netlify, Vercel, cPanel, GitHub Pages).

Admin is at `/admin/dashboard.html` — deliberately not linked from the public site.
Open it directly when demoing.

## The palette

Bronze, espresso, cream, stone grey, powder blue and onyx. Everything is driven by CSS
variables at the top of `css/style.css` — change `--gold` or `--espresso` and every
gradient, button, hover state and chart follows automatically.

## The "aura" layer

Added for this build, on top of the shared design system. All of it is GPU-composited
(transform/opacity only) and switches off under 640px and under `prefers-reduced-motion`:

- **Aurora silk** — two slow-drifting blurred light blooms behind dark sections (`.aura`)
- **Bronze shimmer sweep** — a highlight that travels across every script heading
- **Breathing CTA glow** — a soft pulse behind the primary gold button
- **Satin sheen** — a light sweep across service and package cards on hover
- **Powder-blue nav underline** — draws in from the left on hover
- **Ring pulse** — an expanding ring behind the services badge
- **Rising shimmer canvas** — four-point sparkles with soft halos drifting upward in the hero

## Admin — built for a non-technical owner

Plain-English labels throughout: *Today*, *Appointments*, *Products & Stock*, *Clients*,
*Earnings*. No jargon, no configuration screens, no nested settings. Every page answers
one question:

- **Today** — who is coming in, how much came in, what needs confirming
- **Appointments** — the full diary, searchable by client name or phone
- **Products & Stock** — what is running low and needs ordering this week
- **Clients** — who they are, what they book, what to remember about them
- **Earnings** — how the month is going and which services earn most

Works on a phone: the sidebar collapses to a hamburger and tables scroll inside their
own box rather than breaking the page.

## Demo notes (for the pitch)

- **Everything is frontend-only.** The booking form, chat, estimate and admin data are
  mock — nothing is sent anywhere. Production would add a backend (appointments DB,
  WhatsApp Business API, deposits).
- **WhatsApp** buttons genuinely open `wa.me/233541834750` with pre-filled messages.
- **Dark mode** (admin sidebar toggle) persists via localStorage.
- **Price estimator** lives in `SERVICE_PRICES` at the top of `js/booking.js` and matches
  the builder on the packages page. Booking 2+ services applies a bundle discount.
- Sample pricing: braids from GHS 300 · frontal install GHS 250 · nails GHS 180 ·
  lashes GHS 150 · ombré brows GHS 400 · make-up GHS 200.

## Mobile

Verified at 375px: no horizontal scroll, all 21 booking inputs ≥16px so iOS never
auto-zooms, shimmer canvas and aurora blooms skipped entirely on phones so scrolling
stays smooth on mid-range Android.

## Business details baked in

- Karil Hair & Beauty Lounge · Greater Accra, Ghana
- Phones: 054 183 4750 · 024 340 8001
- WhatsApp: 054 183 4750 · Email placeholder: hello@karilbeautylounge.com
- Services from the shopfront: braids, wig caps, frontals, pedicure, manicure, facials,
  nail extensions, ombré brows, piercing, lashes / mink lashes, make-up, hair colouring

## Customising

- Colours/typography: CSS variables at the top of `css/style.css` and `css/admin.css`.
- Copy: all text is plain HTML in each page.
- Look book: add/remove `.gallery-item` blocks in `gallery.html` (`data-cat`, `data-title`, `data-full`).
- Prices: `SERVICE_PRICES` in `js/booking.js` + `data-price` attributes in `packages.html`.
- Mock admin data: arrays at the top of `js/admin.js`.
- Recommendations: the small inline script at the bottom of `services.html`.
