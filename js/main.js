import { initHero } from './hero.js';
import { bindModal } from './modal.js';
import { CASES, mobile, reduced } from './data.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const onView = (el, fn, opts = { threshold: 0.3 }) => {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), opts);
  io.observe(el);
};

/* ------------------------------------------------------------------ */
/* WhatsApp: mensagem pronta por serviço                               */
/* ------------------------------------------------------------------ */
const WHATSAPP = '5547997599749';
const WA_MSG = {
  geral: 'Olá, Emanuel! Vim pelo seu site e gostaria de conversar.',
  orcamento: 'Olá, Emanuel! Vim pelo seu site e gostaria de solicitar um orçamento.',
  tour: 'Olá, Emanuel! Vi os tours 360° no seu site e quero um para a minha empresa.',
  seo: 'Olá, Emanuel! Quero posicionar minha empresa no Google com tour virtual 360°.',
  imersivo: 'Olá, Emanuel! Tenho interesse em um projeto digital imersivo exclusivo.',
  audiovisual: 'Olá, Emanuel! Tenho interesse em produção audiovisual (vídeo, fotos, drone ou IA).',
  site: 'Olá, Emanuel! Quero um site / bio-site e o cartão NFC de avaliação para minha empresa.',
};
$$('[data-wa]').forEach((a) => {
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_MSG[a.dataset.wa] || WA_MSG.orcamento)}`;
  a.target = '_blank';
  a.rel = 'noopener';
});

/* ------------------------------------------------------------------ */
/* Smooth scroll                                                       */
/* ------------------------------------------------------------------ */
let lenis = null;
if (window.Lenis && !reduced) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
function scrollToEl(el, offset = 0) {
  if (lenis) lenis.scrollTo(el, { duration: 1.6, offset });
  else el.scrollIntoView({ behavior: 'smooth' });
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const t = $(id);
  if (!t) return;
  e.preventDefault();
  scrollToEl(t);
}));

/* ------------------------------------------------------------------ */
/* Cases grid (built from data)                                        */
/* ------------------------------------------------------------------ */
$('#cases').innerHTML = CASES.map((c, i) => `
  <button class="case reveal" type="button" data-tour="${c.key}" style="--d:${(i % 3) * 0.07}s">
    <span class="case-img"><img src="assets/cases/${c.key}.webp" alt="" loading="lazy"><span class="case-360"><svg class="i"><use href="#i-360"/></svg></span></span>
    ${c.logo ? `<img class="case-logo" src="assets/cases/${c.logo}.webp" alt="" loading="lazy">` : ''}
    <span class="case-body">
      <span class="case-place">${c.place}</span>
      <b>${c.name}</b>
      <em>${c.brand || c.segment}</em>
      <span class="case-cta">Entrar no tour 360° <svg class="i"><use href="#i-arrow"/></svg></span>
    </span>
  </button>`).join('');

/* ------------------------------------------------------------------ */
/* Hero + modal                                                        */
/* ------------------------------------------------------------------ */
const loader = $('#loader');
const done = () => loader.classList.add('done');
initHero().then(() => setTimeout(done, 250)).catch(done);
setTimeout(done, 6000);
bindModal(lenis);
if (location.search.includes('debug')) loader.style.display = 'none';

const topbar = $('#topbar');
const hero = $('#hero');

/* ------------------------------------------------------------------ */
/* Reveal + counters                                                   */
/* ------------------------------------------------------------------ */
const fmt = (n, suffix = '') => Math.round(n).toLocaleString('pt-BR') + suffix;
function countTo(el, from, to, suffix = '', dur = 1800) {
  if (reduced) { el.textContent = fmt(to, suffix); return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = clamp((now - t0) / dur);
    el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 4)), suffix);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach((el) => countTo(el, 0, +el.dataset.count, el.dataset.suffix || ''));
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => io.observe(el));

$$('.marquee-track').forEach((t) => { t.insertAdjacentHTML('beforeend', t.innerHTML.replace(/<span>/g, '<span aria-hidden="true">')); });

const words = $('[data-words]');
if (words) {
  const GOLD = new Set(['escolha.', 'decide']);
  words.innerHTML = words.textContent.trim().split(/\s+/).map((w) => `<span class="w${GOLD.has(w) ? ' gold' : ''}">${w}</span>`).join(' ');
}
const wordEls = words ? $$('.w', words) : [];

/* ------------------------------------------------------------------ */
/* Plano Premium: layers                                               */
/* ------------------------------------------------------------------ */
const layers = $$('.layer');
const panels = $$('.lp');
function showLayer(i, { scroll = false } = {}) {
  layers.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
  panels.forEach((p, k) => {
    const on = k === i;
    p.hidden = !on;
    p.classList.remove('play');
    if (on) {
      $$('li, .lp-note', p).forEach((li, n) => li.style.setProperty('--i', n));
      void p.offsetWidth; // restart the staggered entrance
      p.classList.add('play');
    }
  });
  if (scroll && mobile) scrollToEl($('#layer-panels'), -90);
}
layers.forEach((b, i) => b.addEventListener('click', () => showLayer(i, { scroll: true })));
onView($('.layers'), () => showLayer(0), { threshold: 0.3 });

/* ------------------------------------------------------------------ */
/* Report: 6 → 12 months                                               */
/* ------------------------------------------------------------------ */
const SERIES = [192, 184, 172, 160, 146, 131, 116, 98, 80, 62, 43, 22];
(function buildChart() {
  const pts = SERIES.map((y, i) => [i * 100, y]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  $('#chart-line').setAttribute('d', d);
  $('#chart-area').setAttribute('d', `${d} V220 H0Z`);
})();
const clipRect = $('#chart-clip-rect');
const dash = $('#dash');
let period = 0, clipW = 0, autoTimer = null;
function animateClip(to) {
  const from = clipW, t0 = performance.now(), dur = reduced ? 1 : 1600;
  const step = (now) => {
    const k = clamp((now - t0) / dur);
    clipW = from + (to - from) * (1 - Math.pow(1 - k, 3));
    clipRect.setAttribute('width', clipW.toFixed(1));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function setPeriod(m) {
  if (m === period) return;
  const prev = period;
  period = m;
  $$('[data-period]').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.period === m)));
  $$('.kpi', dash).forEach((k) => {
    const b = $('b', k), i = $('i', k);
    countTo(b, prev ? +b.dataset[`v${prev}`] : 0, +b.dataset[`v${m}`]);
    i.textContent = i.dataset[`p${m}`];
  });
  dash.classList.toggle('is12', m === 12);
  animateClip(m === 12 ? 1100 : 505);
}
$$('[data-period]').forEach((b) => b.addEventListener('click', () => { clearTimeout(autoTimer); setPeriod(+b.dataset.period); }));
onView(dash, () => { setPeriod(6); autoTimer = setTimeout(() => setPeriod(12), 3200); }, { threshold: 0.45 });

/* ------------------------------------------------------------------ */
/* Solutions: card fans                                                */
/* ------------------------------------------------------------------ */
const decks = $$('[data-deck]');
function layoutDeck(sol) {
  const deck = $('.deck', sol);
  const cards = $$('.dc', deck);
  const n = cards.length;
  if (mobile) return;
  // cards share the row: when open they sit side by side without covering each other
  const cw = Math.max(150, Math.min(210, (deck.clientWidth - (n - 1) * 14) / n));
  deck.style.setProperty('--cw', `${cw.toFixed(1)}px`);
  deck.classList.toggle('compact', cw < 172);
  const step = Math.min(cw + 14, (deck.clientWidth - cw) / Math.max(1, n - 1));
  deck.style.setProperty('--step', `${step.toFixed(1)}px`);
  deck.style.setProperty('--mid', ((n - 1) / 2).toFixed(2));
  cards.forEach((c, i) => c.style.setProperty('--i', i));
}
function openDeck(sol) {
  sol.classList.add('open');
  $$('video', sol).forEach((v) => { if (!v.getAttribute('src')) v.src = v.dataset.src; v.play().catch(() => {}); });
}
decks.forEach((sol) => {
  layoutDeck(sol);
  if (!mobile) sol.addEventListener('mouseenter', () => openDeck(sol));
  onView(sol, openDeck, { threshold: mobile ? 0.2 : 0.5 });
  new IntersectionObserver(([e]) => {
    $$('video', sol).forEach((v) => { if (!e.isIntersecting) v.pause(); else if (sol.classList.contains('open')) v.play().catch(() => {}); });
  }).observe(sol);
});
addEventListener('resize', () => decks.forEach(layoutDeck));

/* ------------------------------------------------------------------ */
/* História / Biografia: click, hover or scroll                        */
/* ------------------------------------------------------------------ */
$$('[data-reveal]').forEach((btn) => {
  const panel = document.getElementById(btn.dataset.reveal);
  const open = () => { panel.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); btn.classList.add('active'); };
  btn.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.classList.toggle('active', isOpen);
  });
  if (!mobile) btn.addEventListener('mouseenter', open);
  onView(btn, open, { rootMargin: '0px 0px -38% 0px', threshold: 1 });
});

/* ------------------------------------------------------------------ */
/* Castello video                                                      */
/* ------------------------------------------------------------------ */
const video = $('#castello-video');
const phone = $('#phone');
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { if (!video.getAttribute('src')) video.src = 'assets/video/castello.mp4'; video.play().catch(() => {}); } else video.pause();
}, { threshold: 0.25 }).observe(video);

/* ------------------------------------------------------------------ */
/* Planet (closing section) — loaded only when near                    */
/* ------------------------------------------------------------------ */
onView($('#planet'), (c) => import('./planet.js').then((m) => m.initPlanet(c)), { rootMargin: '600px 0px' });

/* ------------------------------------------------------------------ */
/* Custom cursor over 360° canvases                                    */
/* ------------------------------------------------------------------ */
const cursor = $('#cursor');
if (!mobile) {
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    const over = e.target.closest?.('[data-cursor="drag"]');
    const overUi = e.target.closest?.('a, button');
    cursor.classList.toggle('on', !!over && !overUi);
  });
  const loop = () => { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`; requestAnimationFrame(loop); };
  loop();
}

/* ------------------------------------------------------------------ */
/* Per-frame scroll effects                                            */
/* ------------------------------------------------------------------ */
function tick() {
  requestAnimationFrame(tick);
  const vh = innerHeight;
  topbar.classList.toggle('solid', hero.getBoundingClientRect().bottom < 80);
  if (wordEls.length) {
    const r = words.getBoundingClientRect();
    const k = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
    const n = Math.round(k * wordEls.length);
    wordEls.forEach((w, i) => w.classList.toggle('on', i < n));
  }
  const pr = phone.getBoundingClientRect();
  if (pr.top < vh && pr.bottom > 0) {
    const k = clamp((vh - pr.top) / (vh + pr.height));
    phone.style.setProperty('--py', `${(-18 + k * 30).toFixed(2)}deg`);
    phone.style.setProperty('--px', `${(6 - k * 8).toFixed(2)}deg`);
  }
}
requestAnimationFrame(tick);
