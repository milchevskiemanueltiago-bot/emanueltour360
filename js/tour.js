import * as THREE from 'three';

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * Equirectangular 360° viewer: drag to look around, inertia, slow auto-rotate,
 * cross-fade between panoramas. Renders only while `active`.
 */
export class TourViewer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = { fov: 72, autoRotate: 2.2, latMin: -28, latMax: 48, interactive: true, ...opts };
    const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.opts.fov, 1, 0.1, 100);
    this.lon = opts.lon ?? 0;
    this.lat = opts.lat ?? 0;
    this.vLon = 0; this.vLat = 0;
    this.lastInput = -1e9;
    this.active = false;
    this.listeners = new Set();
    this.cache = new Map();
    this.loader = new THREE.TextureLoader();
    this.maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    const geo = new THREE.SphereGeometry(10, 96, 64);
    geo.scale(-1, 1, 1);
    this.layers = [0, 1].map((i) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      m.renderOrder = i;
      this.scene.add(m);
      return m;
    });
    this.front = 0;

    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    new ResizeObserver(this.resize).observe(canvas);
    this.resize();
    if (this.opts.interactive) this.bindInput();
    this.clock = new THREE.Clock();
    requestAnimationFrame(this.tick);
  }

  onChange(fn) { this.listeners.add(fn); }

  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  texture(url) {
    if (!this.cache.has(url)) {
      this.cache.set(url, new Promise((res, rej) => {
        const attempt = (n) => this.loader.load(url, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = this.maxAniso;
          t.generateMipmaps = true;
          res(t);
        }, undefined, (e) => (n > 1 ? setTimeout(() => attempt(n - 1), 700) : rej(e)));
        attempt(3);
      }));
    }
    return this.cache.get(url);
  }

  /** load a panorama; cross-fades from the current one */
  async show(url, { lon, lat } = {}) {
    const token = (this.token = Symbol());
    const tex = await this.texture(url);
    if (token !== this.token) return;
    const next = this.layers[1 - this.front];
    const prev = this.layers[this.front];
    next.material.map = tex;
    next.material.needsUpdate = true;
    next.material.opacity = 0;
    next.renderOrder = 2; prev.renderOrder = 1;
    this.front = 1 - this.front;
    if (lon !== undefined) this.targetLon = lon;
    if (lat !== undefined) this.lat = lat;
    this.fade = { start: performance.now(), next, prev, dur: prev.material.map ? 900 : 10 };
    this.renderer.initTexture?.(tex);
    this.dirty = true;
  }

  preload(url) { return this.texture(url).catch(() => {}); }

  bindInput() {
    const c = this.canvas;
    let down = null;
    c.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, lon: this.lon, lat: this.lat, t: performance.now(), id: e.pointerId, moved: false };
      this.vLon = this.vLat = 0;
      this.lastInput = performance.now();
    });
    addEventListener('pointermove', (e) => {
      if (!down || e.pointerId !== down.id) return;
      const k = this.camera.fov / c.clientHeight;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) > 4) {
        down.moved = true;
        try { c.setPointerCapture(e.pointerId); } catch (_) {}
      }
      const nl = down.lon - dx * k, nt = clamp(down.lat + dy * k, this.opts.latMin, this.opts.latMax);
      this.vLon = (nl - this.lon); this.vLat = (nt - this.lat);
      this.lon = nl; this.lat = nt;
      this.lastInput = performance.now();
      this.targetLon = undefined;
      this.dirty = true;
    });
    const up = (e) => { if (down && e.pointerId === down.id) down = null; };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }

  tick() {
    requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.active) return;
    this.step(dt);
  }

  /** render a single frame immediately (QA / hidden tabs) */
  renderOnce() { if (this.fade) { this.fade.next.material.opacity = 1; this.fade.prev.material.opacity = 0; this.fade = null; } if (this.targetLon !== undefined) { this.lon = this.targetLon; this.targetLon = undefined; } this.step(0); }

  step(dt) {
    const now = performance.now();
    const idle = now - this.lastInput > 2600;

    if (this.targetLon !== undefined) {
      const d = ((this.targetLon - this.lon + 540) % 360) - 180;
      this.lon += d * Math.min(1, dt * 2.4);
      if (Math.abs(d) < 0.05) this.targetLon = undefined;
    } else if (idle) {
      this.lon += this.opts.autoRotate * dt;
    } else {
      this.lon += this.vLon * 0.9; this.lat = clamp(this.lat + this.vLat * 0.9, this.opts.latMin, this.opts.latMax);
      this.vLon *= 0.9; this.vLat *= 0.9;
    }

    if (this.fade) {
      const t = clamp((now - this.fade.start) / this.fade.dur, 0, 1);
      const e = t * t * (3 - 2 * t);
      this.fade.next.material.opacity = e;
      if (t >= 1) { this.fade.prev.material.opacity = 0; this.fade = null; }
    }

    const phi = (90 - this.lat) * DEG, th = this.lon * DEG;
    this.camera.lookAt(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
    this.renderer.render(this.scene, this.camera);
    const heading = ((this.lon % 360) + 360) % 360;
    this.listeners.forEach((fn) => fn(heading, this.lat));
  }

  setFov(f) {
    if (Math.abs(this.camera.fov - f) < 0.01) return;
    this.camera.fov = f;
    this.camera.updateProjectionMatrix();
  }
}
