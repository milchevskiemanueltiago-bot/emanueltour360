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
  <article class="case reveal" style="--d:${(i % 3) * 0.07}s">
    <a class="case-img" href="${c.maps}" target="_blank" rel="noopener" aria-label="Entrar no Tour 360° de ${c.name} no Google Maps"><img src="assets/cases/${c.key}.webp" alt="" loading="lazy"><span class="case-360"><svg class="i"><use href="#i-360"/></svg></span></a>
    ${c.logo ? `<img class="case-logo" src="assets/cases/${c.logo}.webp" alt="" loading="lazy">` : ''}
    <div class="case-body">
      <span class="case-place">${c.place}</span>
      <b>${c.name}</b>
      <em>${c.brand || c.segment}</em>
      <div class="case-actions">
        <a class="case-cta" href="${c.maps}" target="_blank" rel="noopener">Entrar no Tour 360° <svg class="i"><use href="#i-arrow"/></svg></a>
        ${c.site ? `<a class="case-site" href="${c.site}" target="_blank" rel="noopener">Página Oficial <svg class="i"><use href="#i-link"/></svg></a>` : ''}
      </div>
    </div>
  </article>`).join('');

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
/* Plano Premium: "Saiba mais" — opens on click and, item by item,     */
/* as the scroll passes each one (stays open to avoid layout jumps)    */
/* ------------------------------------------------------------------ */
function setAcc(item, open) {
  item.classList.toggle('open', open);
  $('.acc-head', item).setAttribute('aria-expanded', String(open));
  $('.more span', item).textContent = open ? 'Fechar' : 'Saiba mais';
  if (open) {
    $$('li, .lp-note', item).forEach((li, n) => li.style.setProperty('--i', n));
    item.classList.remove('play'); void item.offsetWidth; item.classList.add('play');
  }
}
$$('[data-acc]').forEach((item) => {
  $('.acc-head', item).addEventListener('click', () => setAcc(item, !item.classList.contains('open')));
  onView(item, () => { if (!item.classList.contains('open')) setAcc(item, true); }, { rootMargin: '0px 0px -42% 0px', threshold: 0 });
});

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
/* Solutions: 3D squares — videos load and play only while visible     */
/* ------------------------------------------------------------------ */
$$('.sq video').forEach((v) => {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!v.getAttribute('src')) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }, { threshold: 0.2 }).observe(v);
});
$$('.squares').forEach((g) => $$('.sq', g).forEach((s, i) => s.style.setProperty('--d', `${(i * 0.08).toFixed(2)}s`)));

/* 3D tilt + light following the pointer (desktop) */
if (!mobile) {
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
}

/* "Palavras-chave" art: a search being typed, keyword after keyword */
$$('[data-type]').forEach((el) => {
  const words = el.dataset.type.split('|');
  let w = 0, i = 0, dir = 1, running = false;
  const step = () => {
    const word = words[w];
    i += dir;
    el.textContent = word.slice(0, i);
    let wait = dir > 0 ? 70 + Math.random() * 60 : 28;
    if (dir > 0 && i >= word.length) { dir = -1; wait = 1500; }
    else if (dir < 0 && i <= 0) { dir = 1; w = (w + 1) % words.length; wait = 350; }
    setTimeout(step, reduced ? 2000 : wait);
  };
  onView(el, () => { if (!running) { running = true; step(); } }, { threshold: 0.2 });
});

/* Biografia: text lights up word by word as the visitor scrolls, so it reads in parts */
const bioWords = [];
$$('#bio p, #bio h3').forEach((p) => {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const s = document.createElement('span'); s.className = 'bw'; s.textContent = t; frag.appendChild(s); bioWords.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(p);
});
const bioEl = document.getElementById('bio');

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
const castello = $('#castello');
const castelloCopy = $('.castello-copy');
let luxK = 0.5;
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
  if (bioWords.length && bioEl.classList.contains('open')) {
    const r = bioEl.getBoundingClientRect();
    const k = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.1));
    const n = Math.round(k * bioWords.length);
    bioWords.forEach((w, i) => w.classList.toggle('on', i < n));
  }
  const cr = castello.getBoundingClientRect();
  if (cr.top < vh && cr.bottom > 0) {
    // slow, weighted parallax: the phone floats against the copy as the visitor scrolls
    const k = clamp((vh - cr.top) / (vh + cr.height));
    luxK += (k - luxK) * 0.06;
    phone.style.setProperty('--py', `${(-16 + luxK * 26).toFixed(2)}deg`);
    phone.style.setProperty('--px', `${(5 - luxK * 7).toFixed(2)}deg`);
    phone.style.setProperty('--ty', `${((0.5 - luxK) * 120).toFixed(1)}px`);
    castelloCopy.style.setProperty('--ty', `${((0.5 - luxK) * -50).toFixed(1)}px`);
  }
}
requestAnimationFrame(tick);
