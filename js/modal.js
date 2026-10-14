import { TourViewer } from './tour.js';
import { CASES, CASE, panoUrl, mobile } from './data.js';

/* Full-screen 360° tour, opened from the map pins and the case cards. */
let viewer = null, current = -1, lenisRef = null;
const el = document.getElementById('tour-modal');
const nameEl = el.querySelector('[data-m="name"]');
const placeEl = el.querySelector('[data-m="place"]');
const mapsEl = el.querySelector('[data-m="maps"]');
const hint = el.querySelector('.tm-hint');
const loading = el.querySelector('.tm-loading');

export function bindModal(lenis) {
  lenisRef = lenis;
  el.querySelector('[data-m="close"]').addEventListener('click', closeTour);
  el.querySelector('[data-m="prev"]').addEventListener('click', () => step(-1));
  el.querySelector('[data-m="next"]').addEventListener('click', () => step(1));
  addEventListener('keydown', (e) => {
    if (el.hidden) return;
    if (e.key === 'Escape') closeTour();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tour]');
    if (!t) return;
    e.preventDefault();
    openTour(t.dataset.tour);
  });
}

export function openTour(key) {
  const c = CASE[key];
  if (!c) return;
  current = CASES.indexOf(c);
  if (!viewer) viewer = new TourViewer(document.getElementById('tm-canvas'), { fov: mobile ? 84 : 74, autoRotate: 3.5 });
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('open'));
  document.documentElement.classList.add('modal-open');
  lenisRef?.stop();
  viewer.active = true;
  viewer.resize();
  nameEl.textContent = c.name + (c.brand ? ` · ${c.brand}` : '');
  placeEl.textContent = `${c.place} · ${c.segment}`;
  mapsEl.href = c.maps;
  hint.classList.remove('gone');
  loading.classList.add('on');
  viewer.show(panoUrl(key), { lon: c.heading, lat: 3 }).then(() => loading.classList.remove('on'));
  // warm up the neighbours
  [1, -1].forEach((d) => viewer.preload(panoUrl(CASES[(current + d + CASES.length) % CASES.length].key)));
}

function step(d) { openTour(CASES[(current + d + CASES.length) % CASES.length].key); }

export function closeTour() {
  el.classList.remove('open');
  document.documentElement.classList.remove('modal-open');
  lenisRef?.start();
  setTimeout(() => { el.hidden = true; if (viewer) viewer.active = false; }, 450);
}

document.getElementById('tm-canvas').addEventListener('pointerdown', () => hint.classList.add('gone'));
