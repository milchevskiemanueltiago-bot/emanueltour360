import * as THREE from 'three';
import { TourViewer } from './tour.js';
import { CASES, CASE, mobile, reduced, panoUrl } from './data.js';

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */
const PLACES = {
  it: { lat: 45.7519, lon: 8.5312 },          // Castello Dal Pozzo
  sc: { lat: -27.3, lon: -49.7 },              // Santa Catarina
  lagom: { lat: CASE.lagom.lat, lon: CASE.lagom.lon },
};
const VIEW_START = { lat: 22, lon: -22 };       // Atlantic: Brazil + Europe, Italy in view
const VIEW_BRAZIL = { lat: -15, lon: -50 };
const VIEW_REGION = { lat: -27.31, lon: -48.575 };  // Florianópolis → Blue Sea, all clients in frame
const VIEW_END = PLACES.lagom;

/* flight routes (airport coordinates) */
const AP = {
  gru: [-23.43, -46.47], gig: [-22.81, -43.25], fln: [-27.67, -48.55], mxp: [45.63, 8.72], lis: [38.77, -9.13],
  cdg: [49.0, 2.55], jfk: [40.64, -73.78], mia: [25.79, -80.29], dxb: [25.25, 55.36], eze: [-34.82, -58.53],
  scl: [-33.39, -70.79], mad: [40.47, -3.56], lhr: [51.47, -0.45], cpt: [-33.97, 18.6], nrt: [35.77, 140.39],
};
const ROUTES = [
  ['fln', 'mxp', true], ['gru', 'lis'], ['gig', 'cdg'], ['gru', 'jfk'], ['gru', 'mia'], ['gru', 'dxb'],
  ['fln', 'eze'], ['gru', 'scl'], ['lis', 'jfk'], ['mad', 'gru'], ['lhr', 'dxb'], ['gru', 'cpt'], ['dxb', 'nrt'],
];

const DEG = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerpLog = (a, b, t) => Math.exp(lerp(Math.log(a), Math.log(b), t));

function latLonToVec(lat, lon, r = 1) {
  const phi = (90 - lat) * DEG, th = (lon + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
function viewRotation(lat, lon) {
  const v = latLonToVec(lat, lon);
  return { x: Math.atan2(v.y, Math.hypot(v.x, v.z)), y: Math.atan2(-v.x, v.z) };
}
function lerpLon(a, b, t) { const d = ((b - a + 540) % 360) - 180; return a + d * t; }

/* shared daylight shading: light comes from the camera side, so it is always daytime where we look */
const LIGHT_GLSL = /* glsl */`
  vec3 shade(vec3 albedo, vec3 n, vec3 v, float water){
    vec3 L = normalize(v + vec3(-.35, .45, 0.));
    float diff = max(dot(n, L), 0.);
    vec3 col = albedo * (.42 + .78 * diff);
    vec3 h = normalize(L + v);
    col += vec3(.8,.88,1.) * pow(max(dot(n, h), 0.), 160.) * .06 * water;
    float rim = pow(1. - max(dot(n, v), 0.), 2.5);
    col = mix(col, vec3(.5,.72,1.), rim * .28);
    return col;
  }`;

export function initHero() {
  const canvas = document.getElementById('globe');
  const stage = canvas.parentElement;
  const hero = document.getElementById('hero');
  const portal = document.getElementById('portal');
  const lens = document.getElementById('lens');
  const chapters = [...hero.querySelectorAll('.chapter')];
  const railItems = [...hero.querySelectorAll('.rail li')];
  const hudEl = hero.querySelector('.hud');
  const railEl = hero.querySelector('.rail');
  const pinsWrap = hero.querySelector('.pins');
  const pinEls = Object.fromEntries([...hero.querySelectorAll('.pin')].map((el) => [el.dataset.pin, el]));
  const clientLayer = hero.querySelector('.clients');
  const linesSvg = hero.querySelector('.client-lines');
  const hud = { lat: document.getElementById('hud-lat'), lon: document.getElementById('hud-lon'), alt: document.getElementById('hud-alt') };

  /* client pins on the coast (built from data) */
  const LOCAL = CASES.filter((c) => !c.abroad);
  const labelScale = mobile ? 0.62 : 1;
  const clientEls = LOCAL.map((c) => {
    const b = document.createElement('button');
    b.className = 'client';
    b.type = 'button';
    b.dataset.tour = c.key;
    b.setAttribute('aria-label', `Abrir tour 360° de ${c.name}`);
    b.innerHTML = `<i class="client-dot"></i><span class="client-label"><img src="assets/cases/${c.key}.webp" alt="" loading="lazy"><span><b><span class="nm-full">${c.name}</span><span class="nm-short">${c.short || c.name}</span></b><em>${c.place.split(' · ')[0]} · ver tour 360°</em></span></span>`;
    clientLayer.appendChild(b);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    linesSvg.appendChild(line);
    return { c, b, line, label: b.querySelector('.client-label'), v: latLonToVec(c.lat, c.lon, 1.000002) };
  });

  /* the 360° Lagom tour that lives behind the final headline */
  const pano = new TourViewer(document.getElementById('hero-pano'), { fov: 78, autoRotate: 3, lon: mobile ? 40 : 18, lat: mobile ? 2 : 6 });
  const PANO = panoUrl('lagom');

  let renderer = null;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }

  if (!renderer || reduced) {
    document.documentElement.classList.add('static');
    canvas.style.display = 'none';
    pano.show(PANO);
    pano.active = true;
    chapters.forEach((c) => { const on = c.dataset.ch === '4'; c.style.opacity = on ? 1 : 0; c.classList.toggle('live', on); });
    return Promise.resolve();
  }

  const DPR = Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.0004, 60);
  const globe = new THREE.Group();
  scene.add(globe);
  const loader = new THREE.TextureLoader();
  const tex = (url, tries = 3) => new Promise((res) => loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); res(t); }, undefined,
    () => (tries > 1 ? setTimeout(() => tex(url, tries - 1).then(res), 700) : res(null))));

  /* stars */
  {
    const n = mobile ? 900 : 1800, p = [];
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(18 + Math.random() * 10); p.push(v.x, v.y, v.z); }
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
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), earthMat));

  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uK: { value: 1 } },
    vertexShader: /* glsl */`varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: /* glsl */`uniform float uK; varying vec3 vN; void main(){ float i = pow(max(.62 - dot(vN, vec3(0.,0.,1.)), 0.), 3.4); gl_FragColor = vec4(.4,.68,1., 1.) * i * .95 * uK; }`,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  atmo.scale.setScalar(1.1);
  scene.add(atmo);

  /* satellite detail patches (Sentinel-2 cloudless 2016, EOX — CC BY 4.0) */
  const patches = [];
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
    for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, c = a + seg + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
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
    mesh.renderOrder = 1 + patches.length;
    globe.add(mesh);
    return m;
  }

  /* routes + planes */
  const routes = [];
  const planeShape = new THREE.Shape();
  // top-down airliner silhouette, nose towards +Y
  [[0, 1], [.09, .72], [.1, .2], [.62, -.08], [.62, -.2], [.1, -.06], [.08, -.62], [.28, -.8], [.28, -.9], [0, -.84],
    [-.28, -.9], [-.28, -.8], [-.08, -.62], [-.1, -.06], [-.62, -.2], [-.62, -.08], [-.1, .2], [-.09, .72]].forEach(([x, y], i) => (i ? planeShape.lineTo(x, y) : planeShape.moveTo(x, y)));
  const planeGeo = new THREE.ShapeGeometry(planeShape);
  const planeMat = new THREE.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,230,180,1)'); gr.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  ROUTES.forEach(([a, b, main]) => {
    const va = latLonToVec(AP[a][0], AP[a][1], 1.001), vb = latLonToVec(AP[b][0], AP[b][1], 1.001);
    const ang = va.angleTo(vb);
    const mid = va.clone().add(vb).normalize().multiplyScalar(1 + 0.05 + ang * 0.16);
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uHead: { value: 0 }, uFade: { value: 1 }, uBase: { value: main ? 0.55 : 0.16 } },
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: /* glsl */`
        uniform float uHead; uniform float uFade; uniform float uBase; varying vec2 vUv;
        void main(){ float d = uHead - vUv.x; float trail = d > 0. ? exp(-d * 6.) : 0.;
          gl_FragColor = vec4(mix(vec3(1.,.84,.52), vec3(1.), trail * .6), (uBase + trail * .9) * uFade); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    globe.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, main ? 0.0042 : 0.0026, 6, false), mat));
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.scale.setScalar(main ? 0.034 : 0.026);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(main ? 0.09 : 0.06);
    globe.add(plane, glow);
    routes.push({ curve, mat, plane, glow, speed: (0.035 + Math.random() * 0.03) / Math.max(ang, 0.4), t0: Math.random(), main });
  });
  const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _up = new THREE.Vector3(), _r = new THREE.Vector3(), _m = new THREE.Matrix4();

  const pinVec = Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, latLonToVec(p.lat, p.lon, 1.000002)]));

  /* loading */
  const ready = Promise.all([tex(`assets/img/earth-${mobile ? '2k' : '4k'}.webp`), tex('assets/img/earth-water.webp')]).then(([m, w]) => {
    earthMat.uniforms.uMap.value = m;
    earthMat.uniforms.uWater.value = w;
  });
  fetch('assets/img/sat-bounds.json').then((r) => r.json()).then(async (B) => {
    const defs = [['sat-sul', 0.000012, 0.16], ['sat-sc', 0.000024, 0.12], ['sat-itapema', 0.000036, 0.22]];
    for (const [name, lift, feather] of defs) {
      if (!B[name]) continue;
      const m = makePatch(B[name], lift, 48);
      m.uniforms.uFeather.value = feather;
      patches.push(m);
      m.uniforms.uMap.value = await tex(`assets/img/${name}.webp`);
    }
  }).catch(() => {});

  /* layout */
  let W = 0, H = 0, farDist = 3.6;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    linesSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const vHalf = (camera.fov / 2) * DEG;
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    farDist = clamp(1 / Math.sin(Math.min(vHalf, hHalf * (mobile ? 1.15 : 1)) * (mobile ? 0.86 : 0.62)), 2.6, 8.5);
  }
  resize();
  addEventListener('resize', resize);

  /* drag the globe (desktop) before the scroll story starts */
  let userLon = 0, userLat = 0, vLon = 0, vLat = 0, dragging = null, dragWeight = 1;
  if (!mobile) {
    canvas.addEventListener('pointerdown', (e) => {
      if (dragWeight < 0.5) return;
      dragging = { x: e.clientX, y: e.clientY, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('grabbing');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== dragging.id) return;
      const k = 0.22;
      vLon = -(e.clientX - dragging.x) * k; vLat = (e.clientY - dragging.y) * k;
      userLon += vLon; userLat = clamp(userLat + vLat, -60, 60);
      dragging.x = e.clientX; dragging.y = e.clientY;
    });
    const up = () => { dragging = null; canvas.classList.remove('grabbing'); };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }

  /* chapters: [inStart, inEnd, outStart, outEnd] */
  const WIN = [[-1, 0, 0.08, 0.13], [0.19, 0.24, 0.33, 0.38], [0.46, 0.5, 0.62, 0.66], [0.68, 0.71, 0.75, 0.78], [0.86, 0.93, 2, 3]];
  const cache = new Map();
  function setChapter(el, a, dy) {
    const v = Math.round(a * 1000) / 1000;
    if (cache.get(el) === v) return;
    cache.set(el, v);
    el.style.opacity = v;
    if (!el.classList.contains('no-move')) el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
    el.classList.toggle('live', v > 0.6);
  }

  const tmp = new THREE.Vector3(), camDir = new THREE.Vector3(), nrm = new THREE.Vector3();
  function project(v) {
    tmp.copy(v).applyMatrix4(globe.matrixWorld);
    nrm.copy(tmp).normalize();
    camDir.copy(camera.position).sub(tmp).normalize();
    const facing = nrm.dot(camDir);
    tmp.project(camera);
    return { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H, facing, front: tmp.z < 1 };
  }

  let pSmooth = 0, lastRail = -1, debugQ = null;
  const clock = new THREE.Clock();

  function frame(t, q) {
    /* user drag: inertia, then hand control back to the story as the visitor scrolls */
    dragWeight = 1 - ramp(0.015, 0.09, q);
    if (!dragging) { userLon += vLon; userLat = clamp(userLat + vLat, -60, 60); vLon *= 0.92; vLat *= 0.92; }
    if (dragWeight < 1) { userLon *= 0.9; userLat *= 0.9; }

    /* camera path: Atlantic → Brazil → SC coast (clients) → Lagom */
    const turn = ease(ramp(0.04, 0.26, q));
    const toRegion = ease(ramp(0.36, 0.46, q));
    const descendRegion = ease(ramp(0.36, 0.5, q));
    const toLagom = ease(ramp(0.64, 0.7, q));
    const descendLagom = ease(ramp(0.64, 0.76, q));
    const idle = 1 - ramp(0, 0.05, q);

    let lat = lerp(VIEW_START.lat, VIEW_BRAZIL.lat, turn) + userLat * dragWeight;
    let lon = lerpLon(VIEW_START.lon, VIEW_BRAZIL.lon, turn) + (userLon + t * 2.2 * idle) * dragWeight;
    lat = lerp(lat, VIEW_REGION.lat, toRegion); lon = lerpLon(lon, VIEW_REGION.lon, toRegion);
    lat = lerp(lat, VIEW_END.lat, toLagom); lon = lerpLon(lon, VIEW_END.lon, toLagom);
    lat = clamp(lat, -80, 80);
    const rot = viewRotation(lat, lon);
    globe.rotation.set(rot.x, rot.y, 0, 'XYZ');

    const altFar = farDist - 1, altBrazil = mobile ? 3.3 : 1.4, altRegion = mobile ? 0.03 : 0.0234, altEnd = 0.0016;
    let alt = lerpLog(altFar, altBrazil, turn);
    alt = lerpLog(alt, altRegion, descendRegion);
    alt = lerpLog(alt, altEnd, descendLagom);
    const yOff = lerp(mobile ? -0.07 : -0.17, 0, turn) * farDist;
    camera.position.set(0, -yOff, 1 + alt);
    camera.lookAt(0, -yOff, 0);
    camera.near = Math.max(0.00005, alt * 0.25);
    camera.updateProjectionMatrix();
    globe.updateMatrixWorld();

    const fadeBy = [[1.2, 0.5], [0.12, 0.05], [0.012, 0.006]];
    patches.forEach((m, i) => { m.uniforms.uA.value = ramp(fadeBy[i][0], fadeBy[i][1], alt); });
    atmo.material.uniforms.uK.value = ramp(0.15, 0.6, alt);

    /* planes */
    const routeFade = 1 - ramp(0.27, 0.36, q);
    routes.forEach((r) => {
      const u = (r.t0 + t * r.speed) % 1;
      const head = ease(u);
      r.mat.uniforms.uHead.value = head;
      r.mat.uniforms.uFade.value = routeFade * (r.main ? 1 : 1 - ramp(0.16, 0.24, q));
      r.curve.getPointAt(head, _p);
      r.curve.getTangentAt(head, _t);
      _up.copy(_p).normalize();
      _r.crossVectors(_t, _up).normalize();
      _t.crossVectors(_up, _r).normalize();
      _m.makeBasis(_r, _t, _up);
      r.plane.position.copy(_p).addScaledVector(_up, 0.004);
      r.plane.quaternion.setFromRotationMatrix(_m);
      r.glow.position.copy(r.plane.position);
      const vis = Math.min(1, Math.sin(Math.PI * u) * 3) * r.mat.uniforms.uFade.value;
      r.plane.visible = r.glow.visible = vis > 0.02;
      r.glow.material.opacity = vis * 0.8;
    });
    planeMat.opacity = routeFade;

    /* country / city pins */
    const pinA = { it: 1 - ramp(0.1, 0.18, q), sc: ramp(0.18, 0.24, q) * (1 - ramp(0.34, 0.4, q)), lagom: ramp(0.66, 0.68, q) * (1 - ramp(0.73, 0.76, q)) };
    for (const k in pinEls) {
      const s = project(pinVec[k]);
      const vis = ramp(0.04, 0.22, s.facing) * (pinA[k] ?? 0) * (s.front ? 1 : 0) * clamp((t - 0.8) / 0.8);
      pinEls[k].style.opacity = vis.toFixed(3);
      pinEls[k].style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
    }

    /* client pins on the coast: clickable, each opens its 360° tour */
    const clientA = ramp(0.47, 0.51, q) * (1 - ramp(0.63, 0.66, q));
    clientLayer.style.opacity = clientA.toFixed(3);
    linesSvg.style.opacity = clientA.toFixed(3);
    clientLayer.classList.toggle('live', clientA > 0.6);
    if (clientA > 0.001) {
      clientEls.forEach(({ c, b, line, label, v }) => {
        const s = project(v);
        // labels on the left side are right-aligned to their anchor, so both columns line up
        const dx = c.label[0] * labelScale, dy = c.label[1] * labelScale;
        const lx = dx < 0 ? dx - label.offsetWidth : dx;
        b.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
        label.style.transform = `translate3d(${lx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
        line.setAttribute('x1', s.x.toFixed(1)); line.setAttribute('y1', s.y.toFixed(1));
        line.setAttribute('x2', (s.x + dx).toFixed(1));
        line.setAttribute('y2', (s.y + dy + label.offsetHeight / 2).toFixed(1));
      });
    }

    /* portal: lens opens on Lagom and becomes the live 360° tour */
    const sc = project(pinVec.lagom);
    const open = ease(ramp(0.74, 0.86, q));
    const maxR = Math.hypot(Math.max(sc.x, W - sc.x), Math.max(sc.y, H - sc.y)) + 4;
    const R = open * maxR;
    const cx = lerp(sc.x, W / 2, open), cy = lerp(sc.y, H / 2, open);
    portal.style.clipPath = R < 0.5 ? 'circle(0px at 50% 50%)' : `circle(${R.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
    portal.style.setProperty('--shade', ramp(0.85, 0.93, q).toFixed(3));
    pano.active = q > 0.7;
    pano.setFov(lerp(40, mobile ? 82 : 76, ease(ramp(0.74, 0.92, q))));
    const lensIn = ramp(0.7, 0.74, q);
    lens.style.opacity = (lensIn * (1 - ramp(0.83, 0.88, q))).toFixed(3);
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
    const uiA = (1 - ramp(0.84, 0.9, q)).toFixed(3);
    hudEl.style.opacity = uiA; railEl.style.opacity = uiA;
    const step = q < 0.16 ? 0 : q < 0.42 ? 1 : q < 0.7 ? 2 : 3;
    if (step !== lastRail) { railItems.forEach((li, i) => li.classList.toggle('on', i === step)); lastRail = step; }
    canvas.classList.toggle('draggable', dragWeight > 0.5 && !mobile);

    hud.lat.textContent = lat.toFixed(4);
    hud.lon.textContent = (((lon + 540) % 360) - 180).toFixed(4);
    hud.alt.textContent = (alt * 6371).toLocaleString('pt-BR', { maximumFractionDigits: alt * 6371 < 100 ? 1 : 0 });

    const globeOn = q < 0.88;
    canvas.style.visibility = globeOn ? 'visible' : 'hidden';
    pinsWrap.style.visibility = globeOn ? 'visible' : 'hidden';
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
    window.__renderAt = (q) => { debugQ = q; cache.clear(); if (frame(6, q)) renderer.render(scene, camera); if (q > 0.7) pano.renderOnce(); return q; };
  }

  ready.then(() => pano.show(PANO));
  requestAnimationFrame(loop);
  return ready;
}
