import * as THREE from 'three';
import { mobile } from './data.js';

/* Holographic blue planet for the closing section: dotted continents, glowing rim,
   orbit rings and data arcs. Starts facing Brazil and turns slowly forever.
   Renders only while visible. */
const DEG = Math.PI / 180;
function latLonToVec(lat, lon, r = 1) {
  const phi = (90 - lat) * DEG, th = (lon + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

export function initPlanet(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  const DPR = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.3, 5.1);
  camera.lookAt(0, 0, 0);
  const world = new THREE.Group();
  world.rotation.z = 0.22;
  scene.add(world);
  const planet = new THREE.Group();
  world.add(planet);

  const BLUE = new THREE.Color('#3aa0ff'), CYAN = new THREE.Color('#8fd8ff');

  /* ocean core + fresnel rim */
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uC: { value: BLUE } },
    vertexShader: /* glsl */`varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform vec3 uC; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1. - max(dot(vN, vV), 0.), 2.4); vec3 base = vec3(.02,.07,.16) * (.5 + .5 * max(dot(vN, vV), 0.)); gl_FragColor = vec4(base + uC * pow(f, 1.6) * .32, 1.); }`,
  })));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.ShaderMaterial({
    uniforms: { uC: { value: BLUE } },
    vertexShader: /* glsl */`varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uC; varying vec3 vN; void main(){ float i = pow(max(.66 - dot(vN, vec3(0.,0.,1.)), 0.), 3.); gl_FragColor = vec4(uC, 1.) * i * .5; }`,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  halo.scale.setScalar(1.16);
  world.add(halo);

  /* latitude / longitude grid */
  const grid = [];
  for (let lat = -60; lat <= 60; lat += 20) for (let lon = -180; lon < 180; lon += 4) { const a = latLonToVec(lat, lon, 1.003), b = latLonToVec(lat, lon + 4, 1.003); grid.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  for (let lon = -180; lon < 180; lon += 20) for (let lat = -84; lat < 84; lat += 4) { const a = latLonToVec(lat, lon, 1.003), b = latLonToVec(lat + 4, lon, 1.003); grid.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  planet.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.12, depthWrite: false })));

  /* orbit rings */
  const rings = [];
  [[1.35, 0.3, 0.4], [1.55, -0.5, 0.25], [1.8, 1.1, 0.15]].forEach(([r, tilt, op], i) => {
    const pts = [];
    for (let a = 0; a <= 360; a += 2) pts.push(new THREE.Vector3(Math.cos(a * DEG) * r, 0, Math.sin(a * DEG) * r));
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: CYAN, transparent: true, opacity: op, dashSize: 0.04 + i * 0.02, gapSize: 0.05, depthWrite: false }));
    line.computeLineDistances();
    const g = new THREE.Group(); g.rotation.x = Math.PI / 2 + tilt; g.rotation.z = tilt * 0.6; g.add(line);
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.018 + i * 0.004, 12, 12), new THREE.MeshBasicMaterial({ color: CYAN }));
    sat.position.set(r, 0, 0); g.add(sat);
    world.add(g);
    rings.push({ g, sat, r, speed: 0.25 - i * 0.07 });
  });

  /* data arcs from Brazil */
  const arcs = [];
  const BR = [-23.5, -46.6];
  [[40.7, -74], [38.7, -9.1], [45.6, 8.7], [25.2, 55.3], [-33.9, 18.4], [51.5, -0.1], [35.7, 139.7], [-34.6, -58.4]].forEach(([la, lo], i) => {
    const a = latLonToVec(BR[0], BR[1], 1.005), b = latLonToVec(la, lo, 1.005);
    const mid = a.clone().add(b).normalize().multiplyScalar(1 + 0.08 + a.angleTo(b) * 0.18);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const m = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uOff: { value: i / 8 } },
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: /* glsl */`uniform float uT; uniform float uOff; varying vec2 vUv;
        void main(){ float h = fract(uT * .18 + uOff); float d = h - vUv.x; float tr = d > 0. ? exp(-d * 9.) : 0.; gl_FragColor = vec4(.6,.88,1., .12 + tr); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    planet.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.004, 5, false), m));
    arcs.push(m);
  });

  /* dotted continents (land mask) */
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const land = (lat, lon) => d[(Math.min(c.height - 1, Math.floor((90 - lat) / 180 * c.height)) * c.width + Math.min(c.width - 1, Math.floor((lon + 180) / 360 * c.width))) * 4] > 127;
    const N = mobile ? 14000 : 26000, gold = Math.PI * (3 - Math.sqrt(5)), pos = [], rnd = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), th = gold * i;
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      let lon = Math.atan2(z, -x) / DEG - 180; if (lon < -180) lon += 360;
      if (!land(Math.asin(y) / DEG, lon)) continue;
      pos.push(x * 1.004, y * 1.004, z * 1.004); rnd.push(Math.random());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aR', new THREE.Float32BufferAttribute(rnd, 1));
    planet.add(new THREE.Points(g, dotMat));
  };
  const dotMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uPR: { value: DPR } },
    vertexShader: /* glsl */`attribute float aR; uniform float uT; uniform float uPR; varying float vA; varying float vR;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.); float f = dot(normalize(wp.xyz), normalize(cameraPosition - wp.xyz)); vA = smoothstep(-.05,.35,f); vR = aR;
        gl_Position = projectionMatrix * viewMatrix * wp; gl_PointSize = 2.9 * uPR; }`,
    fragmentShader: /* glsl */`uniform float uT; varying float vA; varying float vR;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5,.2,d); float tw = .65 + .35 * sin(uT * 1.6 + vR * 40.);
        vec3 col = mix(vec3(.35,.7,1.), vec3(.85,.96,1.), vR); gl_FragColor = vec4(col, min(1., a * vA * tw * 1.6)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  img.src = 'assets/img/land-mask.png';

  /* start facing Brazil */
  const br = latLonToVec(-12, -52);
  const startY = Math.atan2(-br.x, br.z);
  planet.rotation.x = Math.atan2(br.y, Math.hypot(br.x, br.z));

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px 0px' }).observe(canvas);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) { clock.getDelta(); return; }
    const t = clock.getElapsedTime();
    planet.rotation.y = startY + t * 0.08;
    dotMat.uniforms.uT.value = t;
    arcs.forEach((m) => { m.uniforms.uT.value = t; });
    rings.forEach((r) => { r.sat.position.set(Math.cos(t * r.speed) * r.r, 0, Math.sin(t * r.speed) * r.r); });
    renderer.render(scene, camera);
  })();
}
