import { initHero } from './hero.js';
import { TourViewer } from './tour.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ------------------------------------------------------------------ */
/* WhatsApp: mensagem pronta por serviço                               */
/* ------------------------------------------------------------------ */
const WHATSAPP = '5547997599749';
const WA_MSG = {
  geral: 'Olá, Emanuel! Vim pelo seu site e gostaria de conversar.',
  orcamento: 'Olá, Emanuel! Vim pelo seu site e gostaria de solicitar um orçamento.',
  seo: 'Olá, Emanuel! Quero posicionar minha empresa no Google com tour virtual 360°.',
  imersivo: 'Olá, Emanuel! Tenho interesse em um projeto digital imersivo exclusivo.',
  audiovisual: 'Olá, Emanuel! Tenho interesse em produção audiovisual (vídeo, fotos e drone).',
  site: 'Olá, Emanuel! Quero um site personalizado / bio-site para minha empresa.',
};
$$('[data-wa]').forEach((a) => {
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_MSG[a.dataset.wa] || WA_MSG.orcamento)}`;
  a.target = '_blank';
  a.rel = 'noopener';
});

/* ------------------------------------------------------------------ */
/* Tours 360°                                                          */
/* ------------------------------------------------------------------ */
const TOURS = {
  lagom: {
    name: 'Lagom Perequê', place: 'Itapema · Santa Catarina', lon: 48, lat: 2,
    maps: 'https://www.google.com/maps/place/Lagom+Perequ%C3%AA+-+Porto+Belo/@-27.1498755,-48.5828492,3a,75y,4.6h,89.76t/data=!3m7!1e1!3m5!1sCIABIhAtq8hDXiV7Y5l3fAGgkEXU!2e10!7i11968!8i5984!4m9!3m8!1s0x94d8afac199b2585:0xbb5825314aa6d305!8m2!3d-27.1488594!4d-48.581779!10e5!16s%2Fg%2F11vj56j3mz',
  },
  majestic: {
    name: 'Majestic Palace Hotel', place: 'Florianópolis · Santa Catarina', lon: 232, lat: 6,
    maps: 'https://www.google.com/maps/place/Majestic+Palace+Hotel/@-27.5832155,-48.5444415,3a,75y,163.42h,94.23t/data=!3m7!1e1!3m5!1sCIABIhBSHCPmwdMnpmnRPJyOaoOh!2e10!7i8400!8i4200!4m12!3m11!1s0x952738114f2ff87d:0xb271411bf8880135!5m2!4m1!1i2!8m2!3d-27.5833216!4d-48.5444964!10e5!16s%2Fg%2F1w2y_m6c',
  },
  concept: {
    name: 'Academia Concept Club', place: 'Itapema · Santa Catarina', lon: 252, lat: 4,
    maps: 'https://www.google.com/maps/place/Academia+Concept+Club/@-27.142847,-48.5840579,3a,75y,68.31h,76.2t/data=!3m7!1e1!3m5!1sCIABIhCMU8FDmvfKUOAuT5kHbs10!2e10!7i11968!8i5984!4m9!3m8!1s0x94d8afa1a6d504bd:0xdd79f675eeb97eae!8m2!3d-27.1429208!4d-48.5841015!10e5!16s%2Fg%2F11zbmqzzhp',
  },
  castello: {
    name: 'Castello Dal Pozzo', place: 'Oleggio Castello · Itália', lon: 196, lat: 6,
    maps: 'https://www.google.com/maps/place/Castello+Dal+Pozzo/@45.7521437,8.5313718,3a,75y,149.08h,89.24t/data=!3m8!1e1!3m6!1sCIABIhBZ-GlfQrNEo_5YQE0Dz7_m!2e10!3e11!7i6530!8i3265!4m12!3m11!1s0x478671f64a13d927:0x9da3b7c69ee36550!5m2!4m1!1i2!8m2!3d45.7518584!4d8.5312244!10e5!16s%2Fg%2F11hdb9dw2_',
  },
};
const panoUrl = (k) => `assets/pano/${k}-${mobile ? '2k' : '4k'}.webp`;
$$('[data-maps]').forEach((a) => { a.href = TOURS[a.dataset.maps].maps; });

/* ------------------------------------------------------------------ */
/* Smooth scroll                                                       */
/* ------------------------------------------------------------------ */
let lenis = null;
if (window.Lenis && !reduced) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
function scrollToEl(el) {
  if (lenis) lenis.scrollTo(el, { duration: 1.8 });
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
/* Hero                                                                */
/* ------------------------------------------------------------------ */
const loader = $('#loader');
const done = () => loader.classList.add('done');
initHero({ mobile, reduced }).then(() => setTimeout(done, 250)).catch(done);
setTimeout(done, 6000); // never keep the visitor waiting
if (location.search.includes('debug')) { loader.style.display = 'none'; window.__tour = (k) => { openTour(k); return k; }; window.__tourRender = () => tourViewer.renderOnce(); }

const topbar = $('#topbar');
const hero = $('#hero');

/* ------------------------------------------------------------------ */
/* Reveal + counters                                                   */
/* ------------------------------------------------------------------ */
function countUp(el) {
  const target = +el.dataset.count, suffix = el.dataset.suffix || '';
  const dur = 1800 + Math.min(1200, target / 10);
  const t0 = performance.now();
  const fmt = (n) => Math.round(n).toLocaleString('pt-BR') + suffix;
  if (reduced) { el.textContent = fmt(target); return; }
  const step = (now) => {
    const k = clamp((now - t0) / dur);
    el.textContent = fmt(target * (1 - Math.pow(1 - k, 4)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(countUp);
    if (e.target.matches('[data-count]')) countUp(e.target);
    io.unobserve(e.target);
  });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => io.observe(el));

/* client marquees: duplicate the track so the loop is seamless */
$$('.marquee-track').forEach((t) => { t.insertAdjacentHTML('beforeend', t.innerHTML.replace(/<span>/g, '<span aria-hidden="true">')); });

/* manifesto: words light up as you scroll */
const words = $('[data-words]');
if (words) {
  const GOLD = new Set(['escolha.', 'decide']);
  words.innerHTML = words.textContent.trim().split(/\s+/).map((w) => `<span class="w${GOLD.has(w) ? ' gold' : ''}">${w}</span>`).join(' ');
}
const wordEls = words ? $$('.w', words) : [];

/* ------------------------------------------------------------------ */
/* Tours gallery                                                       */
/* ------------------------------------------------------------------ */
const viewerEl = $('#viewer');
const tourViewer = new TourViewer($('#tour-canvas'), { fov: mobile ? 82 : 72, autoRotate: 4 });
const tName = $('#tour-name'), tPlace = $('#tour-place'), tLink = $('#tour-link');
const hint = $('#viewer-hint');
let currentTour = null;
function openTour(key, { scroll = false } = {}) {
  const t = TOURS[key];
  if (!t) return;
  $$('.tour-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tour === key)));
  if (key !== currentTour) {
    currentTour = key;
    tName.style.opacity = 0;
    setTimeout(() => { tName.textContent = t.name; tPlace.textContent = t.place; tName.style.opacity = 1; }, 250);
    tLink.href = t.maps;
    tourViewer.show(panoUrl(key), { lon: t.lon, lat: t.lat });
  }
  if (scroll) scrollToEl(viewerEl);
}
$$('.tour-tab').forEach((b) => b.addEventListener('click', () => openTour(b.dataset.tour)));
$$('[data-open-tour]').forEach((b) => b.addEventListener('click', () => openTour(b.dataset.openTour, { scroll: true })));
let preloaded = false;
new IntersectionObserver(([e]) => {
  tourViewer.active = e.isIntersecting;
  if (e.isIntersecting && !currentTour) openTour('lagom');
  if (e.isIntersecting && !preloaded) {
    preloaded = true;
    setTimeout(() => Object.keys(TOURS).forEach((k) => tourViewer.preload(panoUrl(k))), 1500);
  }
}, { rootMargin: '200px 0px' }).observe(viewerEl);
$('#tour-canvas').addEventListener('pointerdown', () => hint.classList.add('gone'), { once: true });

/* compass */
const ticks = $('#compass-ticks');
let tickSvg = '';
for (let a = 0; a < 360; a += 15) {
  const major = a % 90 === 0;
  const r1 = major ? 40 : 45, r2 = 51;
  const rad = (a - 90) * Math.PI / 180;
  tickSvg += `<line class="${major ? 'major' : ''}" x1="${(60 + r1 * Math.cos(rad)).toFixed(2)}" y1="${(60 + r1 * Math.sin(rad)).toFixed(2)}" x2="${(60 + r2 * Math.cos(rad)).toFixed(2)}" y2="${(60 + r2 * Math.sin(rad)).toFixed(2)}"/>`;
}
ticks.innerHTML = tickSvg;
const deg = $('#compass-deg');
tourViewer.onChange((h) => {
  ticks.setAttribute('transform', `rotate(${(-h).toFixed(2)} 60 60)`);
  deg.textContent = `${Math.round(h)}°`;
});

/* ------------------------------------------------------------------ */
/* Plano Premium: 3D ring                                              */
/* ------------------------------------------------------------------ */
const metodo = $('#metodo');
const ring = $('#ring');
const pillars = $$('.pillar', ring);
const monthsBar = $('#months-bar');
const STEP = 360 / pillars.length;
function ringRadius() {
  const cw = pillars[0].offsetWidth || 300;
  return Math.round((cw / 2) / Math.tan(Math.PI / pillars.length) * 1.12);
}
let R = ringRadius();
addEventListener('resize', () => { R = ringRadius(); });

/* ------------------------------------------------------------------ */
/* Castello video: load + play only when visible                       */
/* ------------------------------------------------------------------ */
const video = $('#castello-video');
const phone = $('#phone');
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) {
    if (!video.getAttribute('src')) video.src = 'assets/video/castello.mp4';
    video.play().catch(() => {});
  } else video.pause();
}, { threshold: 0.25 }).observe(video);

/* ------------------------------------------------------------------ */
/* Cards: 3D tilt + light                                              */
/* ------------------------------------------------------------------ */
if (!mobile) {
  $$('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${((x - 0.5) * 12).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
}

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
function sectionProgress(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
}
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

  const mr = metodo.getBoundingClientRect();
  if (mr.top < vh && mr.bottom > 0) {
    const p = sectionProgress(metodo);
    // snap: each pillar rests at the front for a moment before the ring turns again
    const pos = p * (pillars.length - 1), base = Math.floor(pos), f = pos - base;
    const snapped = base + (f <= 0.3 ? 0 : f >= 0.7 ? 1 : (() => { const t = (f - 0.3) / 0.4; return t * t * (3 - 2 * t); })());
    const rot = -snapped * STEP;
    ring.style.transform = `translateZ(${-R}px) rotateY(${rot.toFixed(2)}deg)`;
    const frontIdx = ((Math.round(-rot / STEP) % pillars.length) + pillars.length) % pillars.length;
    pillars.forEach((el, i) => {
      el.style.transform = `rotateY(${i * STEP}deg) translateZ(${R}px)`;
      el.classList.toggle('front', i === frontIdx);
    });
    monthsBar.style.setProperty('--m', (0.08 + p * 0.92).toFixed(3));
  }

  const pr = phone.getBoundingClientRect();
  if (pr.top < vh && pr.bottom > 0) {
    const k = clamp((vh - pr.top) / (vh + pr.height));
    phone.style.setProperty('--py', `${(-18 + k * 30).toFixed(2)}deg`);
    phone.style.setProperty('--px', `${(6 - k * 8).toFixed(2)}deg`);
  }
}
requestAnimationFrame(tick);
