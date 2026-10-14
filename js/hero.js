import * as THREE from 'three';
import { TourViewer } from './tour.js';

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */
const PLACES = {
  lagom: { lat: -27.14886, lon: -48.58178 },     // Lagom Perequê, Porto Belo/Itapema
  floripa: { lat: -27.5833, lon: -48.5445 },     // Majestic Palace Hotel
  rj: { lat: -22.906, lon: -43.173 },
  it: { lat: 45.7519, lon: 8.5312 },             // Castello Dal Pozzo
};
const VIEW_START = { lat: 30, lon: -6 };          // Europe + Atlantic, Italy in view
const VIEW_BRAZIL = { lat: -15, lon: -50 };       // whole Brazil
const VIEW_END = PLACES.lagom;

const DEG = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function latLonToVec(lat, lon, r = 1) {
  const phi = (90 - lat) * DEG, th = (lon + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
function viewRotation(lat, lon) {
  const v = latLonToVec(lat, lon);
  return { x: Math.atan2(v.y, Math.hypot(v.x, v.z)), y: Math.atan2(-v.x, v.z) };
}
// shortest-path longitude interpolation
function lerpLon(a, b, t) { const d = ((b - a + 540) % 360) - 180; return a + d * t; }

/* shared day-light shading (light comes from the camera side, so it is always daytime where we look) */
const LIGHT_GLSL = /* glsl */`
  vec3 shade(vec3 albedo, vec3 n, vec3 v, float water){
    vec3 L = normalize(v + vec3(-.35, .45, 0.));
    float diff = max(dot(n, L), 0.);
    vec3 col = albedo * (.42 + .78 * diff);
    vec3 h = normalize(L + v);
    col += vec3(.8,.88,1.) * pow(max(dot(n, h), 0.), 140.) * .16 * water;
    float rim = pow(1. - max(dot(n, v), 0.), 2.5);
    col = mix(col, vec3(.5,.72,1.), rim * .28);
    return col;
  }`;

export function initHero({ mobile, reduced }) {
  const canvas = document.getElementById('globe');
  const stage = canvas.parentElement;
  const hero = document.getElementById('hero');
  const portal = document.getElementById('portal');
  const lens = document.getElementById('lens');
  const chapters = [...hero.querySelectorAll('.chapter')];
  const railItems = [...hero.querySelectorAll('.rail li')];
  const hudEl = hero.querySelector('.hud');
  const railEl = hero.querySelector('.rail');
  const pinEls = Object.fromEntries([...hero.querySelectorAll('.pin')].map((el) => [el.dataset.pin, el]));
  const hud = { lat: document.getElementById('hud-lat'), lon: document.getElementById('hud-lon'), alt: document.getElementById('hud-alt') };
  const panoCanvas = document.getElementById('hero-pano');

  /* the 360° Lagom tour that lives behind the final headline */
  const pano = new TourViewer(panoCanvas, { fov: 78, autoRotate: 3, lon: mobile ? 40 : 18, lat: mobile ? 2 : 6 });
  const PANO = `assets/pano/lagom-${mobile ? '2k' : '4k'}.webp`;

  let renderer = null;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', logarithmicDepthBuffer: false }); } catch (e) { renderer = null; }

  if (!renderer || reduced) {
    document.documentElement.classList.add('static');
    canvas.style.display = 'none';
    pano.show(PANO);
    pano.active = true;
    chapters.forEach((c) => { const on = c.dataset.ch === '3'; c.style.opacity = on ? 1 : 0; c.classList.toggle('live', on); });
    return Promise.resolve();
  }

  const DPR = Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.0004, 50);
  const globe = new THREE.Group();
  scene.add(globe);
  const loader = new THREE.TextureLoader();
  const tex = (url, tries = 3) => new Promise((res) => loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); res(t); }, undefined,
    () => (tries > 1 ? setTimeout(() => tex(url, tries - 1).then(res), 700) : res(null))));

  /* stars */
  {
    const n = mobile ? 900 : 1800, p = [];
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(18 + Math.random() * 10);
      p.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false })));
  }

  /* earth */
  const earthMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null }, uWater: { value: null } },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform sampler2D uWater; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      ${LIGHT_GLSL}
      void main(){
        vec3 alb = texture2D(uMap, vUv).rgb;
        float w = texture2D(uWater, vUv).r;
        gl_FragColor = vec4(shade(alb, normalize(vN), normalize(vV), w), 1.);
        #include <colorspace_fragment>
      }`,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), earthMat);
  // SphereGeometry uv.x=0 sits at lon -180 when rotated -90° around Y relative to our latLonToVec convention
  earth.rotation.y = 0;
  globe.add(earth);

  /* atmosphere */
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uK: { value: 1 } },
    vertexShader: /* glsl */`varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: /* glsl */`uniform float uK; varying vec3 vN; void main(){ float i = pow(max(.62 - dot(vN, vec3(0.,0.,1.)), 0.), 3.4); gl_FragColor = vec4(.4,.68,1., 1.) * i * .95 * uK; }`,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  atmo.scale.setScalar(1.1);
  scene.add(atmo);

  /* satellite detail patches (Sentinel-2 cloudless 2016, EOX — CC BY 4.0) */
  const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2));
  function makePatch(b, lift, seg) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= seg; j++) {
      const lat = lerp(b.latN, b.latS, j / seg);
      for (let i = 0; i <= seg; i++) {
        const lon = lerp(b.lonW, b.lonE, i / seg);
        const v = latLonToVec(lat, lon, 1 + lift);
        pos.push(v.x, v.y, v.z);
        uv.push(i / seg, (mercY(lat) - mercY(b.latS)) / (mercY(b.latN) - mercY(b.latS)));
      }
    }
    for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i, c = a + seg + 1;
      idx.push(a, c, a + 1, a + 1, c, c + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: null }, uA: { value: 0 }, uFeather: { value: 0.12 } },
      vertexShader: /* glsl */`
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.); vN = normalize(wp.xyz); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; uniform float uA; uniform float uFeather; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        ${LIGHT_GLSL}
        void main(){
          vec2 e = min(vUv, 1. - vUv);
          float f = smoothstep(0., uFeather, min(e.x, e.y));
          vec3 alb = texture2D(uMap, vUv).rgb * 1.08;
          gl_FragColor = vec4(shade(alb, normalize(vN), normalize(vV), 0.), f * uA);
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.renderOrder = 1 + patches.length; // finer layers always draw on top
    globe.add(mesh);
    return m;
  }

  /* arc Itália → Itapema */
  function makeArc(a, b, lift) {
    const va = latLonToVec(a.lat, a.lon, 1.002), vb = latLonToVec(b.lat, b.lon, 1.002);
    const mid = va.clone().add(vb).normalize().multiplyScalar(1 + lift);
    const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(va, mid, vb), 180, 0.004, 6, false);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uProg: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 } },
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: /* glsl */`
        uniform float uProg; uniform float uTime; uniform float uFade; varying vec2 vUv;
        void main(){ float t = vUv.x; float head = exp(-pow((t - fract(uTime * .16)) * 11., 2.));
          gl_FragColor = vec4(mix(vec3(1.,.86,.56), vec3(1.), head), (.45 + head) * step(t, uProg) * uFade); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    globe.add(new THREE.Mesh(geo, mat));
    return mat;
  }
  const arc = makeArc(PLACES.it, PLACES.lagom, 0.5);
  const pinVec = Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, latLonToVec(p.lat, p.lon, 1.00001)]));

  /* loading: base earth first (fast), then detail layers in the background */
  const patches = [];
  const ready = Promise.all([tex(`assets/img/earth-${mobile ? '2k' : '4k'}.webp`), tex('assets/img/earth-water.webp')]).then(([m, w]) => {
    earthMat.uniforms.uMap.value = m;
    earthMat.uniforms.uWater.value = w;
  });
  fetch('assets/img/sat-bounds.json').then((r) => r.json()).then(async (B) => {
    const defs = [['sat-sul', 0.000012, 0.16], ['sat-sc', 0.000024, 0.18], ['sat-itapema', 0.000036, 0.22]];
    for (const [name, lift, feather] of defs) {
      if (!B[name]) continue;
      const m = makePatch(B[name], lift, 48);
      m.uniforms.uFeather.value = feather;
      patches.push(m);
      m.uniforms.uMap.value = await tex(`assets/img/${name}.webp`);
    }
  }).catch(() => {});
  ready.then(() => pano.preload(PANO));

  /* layout */
  let W = 0, H = 0, farDist = 3.6;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const vHalf = (camera.fov / 2) * DEG;
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    farDist = clamp(1 / Math.sin(Math.min(vHalf, hHalf * (mobile ? 1.15 : 1)) * (mobile ? 0.86 : 0.62)), 2.6, 8.5);
  }
  resize();
  addEventListener('resize', resize);

  const WIN = [[-1, 0, 0.09, 0.15], [0.2, 0.26, 0.36, 0.42], [0.5, 0.55, 0.63, 0.67], [0.77, 0.86, 2, 3]];
  const cache = new Map();
  function setChapter(el, a, dy) {
    const v = Math.round(a * 1000) / 1000;
    if (cache.get(el) === v) return;
    cache.set(el, v);
    el.style.opacity = v;
    if (!el.classList.contains('no-move')) el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
    el.classList.toggle('live', v > 0.6);
  }

  const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
  function project(v) {
    tmp.copy(v).applyMatrix4(globe.matrixWorld);
    camDir.copy(camera.position).sub(tmp).normalize();
    const facing = tmp.clone().normalize().dot(camDir);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H, facing, front: tmp.z < 1 };
  }

  let pSmooth = 0, lastRail = -1, debugQ = null;
  const clock = new THREE.Clock();

  function frame(t, q) {
    /* --- camera path: Europe → turn to Brazil → dive to Lagom --- */
    const turn = ease(ramp(0.04, 0.28, q));
    const dive = ease(ramp(0.4, 0.64, q));
    const idle = 1 - ramp(0, 0.06, q);
    let lat = lerp(VIEW_START.lat, VIEW_BRAZIL.lat, turn);
    let lon = lerpLon(VIEW_START.lon, VIEW_BRAZIL.lon, turn) + Math.sin(t * 0.1) * 6 * idle;
    const glide = ease(ramp(0.4, 0.53, q)); // travel over SC first, then descend
    lat = lerp(lat, VIEW_END.lat, glide);
    lon = lerpLon(lon, VIEW_END.lon, glide);
    const rot = viewRotation(lat, lon);
    globe.rotation.set(rot.x, rot.y, 0, 'XYZ');

    // altitude above surface, interpolated in log space for a natural zoom
    const altFar = farDist - 1, altBrazil = mobile ? 3.3 : 1.4, altEnd = 0.0016;
    let alt = Math.exp(lerp(Math.log(altFar), Math.log(altBrazil), turn));
    alt = Math.exp(lerp(Math.log(alt), Math.log(altEnd), dive));
    const dist = 1 + alt;
    const yOff = lerp(mobile ? -0.07 : -0.17, 0, turn) * farDist;
    camera.position.set(0, -yOff, dist);
    camera.lookAt(0, -yOff, 0);
    camera.near = Math.max(0.00005, alt * 0.25);
    camera.updateProjectionMatrix();
    globe.updateMatrixWorld();

    // detail layers fade in as we descend
    const fadeBy = [[1.2, 0.5], [0.12, 0.05], [0.02, 0.008]];
    patches.forEach((m, i) => { m.uniforms.uA.value = ramp(fadeBy[i][0], fadeBy[i][1], alt); });
    atmo.material.uniforms.uK.value = ramp(0.15, 0.6, alt);

    arc.uniforms.uTime.value = t;
    arc.uniforms.uProg.value = clamp((t - 0.5) / 2.4);
    arc.uniforms.uFade.value = 1 - ramp(0.3, 0.42, q);

    /* pins */
    const pinA = {
      it: 1 - ramp(0.1, 0.18, q),
      rj: ramp(0.18, 0.26, q) * (1 - ramp(0.4, 0.46, q)),
      floripa: ramp(0.18, 0.26, q) * (1 - ramp(0.44, 0.5, q)),
      lagom: ramp(0.0, 0.02, q) * (1 - ramp(0.6, 0.64, q)),
    };
    for (const k in pinEls) {
      const s = project(pinVec[k]);
      const vis = ramp(0.04, 0.22, s.facing) * pinA[k] * (s.front ? 1 : 0) * clamp((t - 0.8) / 0.8);
      pinEls[k].style.opacity = vis.toFixed(3);
      pinEls[k].style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
    }
    pinEls.lagom.classList.toggle('pin-near', q > 0.42);

    /* portal: the lens opens on Lagom and becomes the live 360° tour */
    const sc = project(pinVec.lagom);
    const open = ease(ramp(0.63, 0.78, q));
    const maxR = Math.hypot(Math.max(sc.x, W - sc.x), Math.max(sc.y, H - sc.y)) + 4;
    const R = open * maxR;
    const cx = lerp(sc.x, W / 2, open), cy = lerp(sc.y, H / 2, open);
    portal.style.clipPath = R < 0.5 ? 'circle(0px at 50% 50%)' : `circle(${R.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
    portal.style.setProperty('--shade', ramp(0.76, 0.88, q).toFixed(3));
    pano.active = q > 0.58;
    pano.setFov(lerp(40, mobile ? 82 : 76, ease(ramp(0.63, 0.86, q))));

    const lensIn = ramp(0.58, 0.63, q);
    lens.style.opacity = (lensIn * (1 - ramp(0.74, 0.8, q))).toFixed(3);
    const lensR = Math.max(R, 36 * lensIn);
    lens.style.width = lens.style.height = `${(lensR * 2).toFixed(1)}px`;
    lens.style.transform = `translate3d(${(cx - lensR).toFixed(1)}px, ${(cy - lensR).toFixed(1)}px, 0)`;
    lens.style.setProperty('--r', `${lensR.toFixed(1)}px`);
    lens.style.setProperty('--a', `${(-45 + t * 60).toFixed(1)}deg`);

    chapters.forEach((el) => {
      const w = WIN[+el.dataset.ch];
      const a = ramp(w[0], w[1], q) * (1 - ramp(w[2], w[3], q));
      setChapter(el, a, (1 - ramp(w[0], w[1], q)) * 26 - ramp(w[2], w[3], q) * 26);
    });
    const uiA = (1 - ramp(0.72, 0.8, q)).toFixed(3);
    hudEl.style.opacity = uiA; railEl.style.opacity = uiA;
    const step = q < 0.17 ? 0 : q < 0.45 ? 1 : q < 0.72 ? 2 : 3;
    if (step !== lastRail) { railItems.forEach((li, i) => li.classList.toggle('on', i === step)); lastRail = step; }

    hud.lat.textContent = lat.toFixed(4);
    hud.lon.textContent = lon.toFixed(4);
    hud.alt.textContent = (alt * 6371).toLocaleString('pt-BR', { maximumFractionDigits: alt * 6371 < 100 ? 1 : 0 });

    const globeOn = q < 0.8;
    canvas.style.visibility = globeOn ? 'visible' : 'hidden';
    return globeOn;
  }

  function loop() {
    requestAnimationFrame(loop);
    const r = hero.getBoundingClientRect();
    if (r.bottom < 0 && debugQ === null) { pano.active = false; return; }
    const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
    pSmooth = debugQ ?? lerp(pSmooth, p, 0.14);
    const t = debugQ !== null ? 6 : clock.getElapsedTime();
    if (frame(t, pSmooth)) renderer.render(scene, camera);
  }

  if (location.search.includes('debug')) {
    window.__renderAt = (q) => { debugQ = q; cache.clear(); if (frame(6, q)) renderer.render(scene, camera); if (q > 0.58) pano.renderOnce(); return q; };
  }

  // the tour starts loading once the earth is visible
  ready.then(() => pano.show(PANO));
  requestAnimationFrame(loop);
  return ready;
}
