/* Sistema de rayos: segmentos cortos que viajan en línea recta. */
(function () {
class RaySystem {
  constructor(scene, max = 6000, opts = {}) {
    this.max = max;
    this.rays = [];
    this.pos = new Float32Array(max * 6);
    this.col = new Float32Array(max * 6);
    const g = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.colAttr = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.posAttr);
    g.setAttribute('color', this.colAttr);
    g.setDrawRange(0, 0);
    this.geometry = g;
    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: opts.depthTest ?? true,
    });
    this.lines = new THREE.LineSegments(g, this.material);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = opts.renderOrder ?? 1;
    scene.add(this.lines);
  }

  /* r = { o, d, speed, length, sStop, sMax, color:[r,g,b], onStop, marks:[{s, fn}] } */
  add(r) {
    if (this.rays.length >= this.max) return null;
    r.s = r.s ?? 0;
    r.sStop = r.sStop ?? Infinity;
    r.sMax = r.sMax ?? 100;
    r.length = r.length ?? 1;
    r.stopped = false;
    r.marks = r.marks ?? [];
    this.rays.push(r);
    return r;
  }

  clear() { this.rays.length = 0; }

  update(dt) {
    const rays = this.rays;
    let i = 0;
    while (i < rays.length) {
      const r = rays[i];
      r.s += r.speed * dt;
      while (r.marks.length && r.s >= r.marks[0].s) r.marks.shift().fn(r);
      if (!r.stopped && r.s >= r.sStop) { r.stopped = true; r.onStop && r.onStop(r); }
      const end = Math.min(r.sStop, r.sMax);
      const tail = Math.max(0, r.s - r.length);
      if (tail >= end) { rays[i] = rays[rays.length - 1]; rays.pop(); continue; }
      i++;
    }
    const n = rays.length;
    for (let k = 0; k < n; k++) {
      const r = rays[k];
      const end = Math.min(r.sStop, r.sMax);
      const head = Math.max(0, Math.min(r.s, end));
      const tail = Math.max(0, r.s - r.length);
      const o = r.o, d = r.d, j = k * 6;
      this.pos[j] = o.x + d.x * tail; this.pos[j + 1] = o.y + d.y * tail; this.pos[j + 2] = o.z + d.z * tail;
      this.pos[j + 3] = o.x + d.x * head; this.pos[j + 4] = o.y + d.y * head; this.pos[j + 5] = o.z + d.z * head;
      const c = r.color, f = r.fade ?? 0.08;
      this.col[j] = c[0] * f; this.col[j + 1] = c[1] * f; this.col[j + 2] = c[2] * f;
      this.col[j + 3] = c[0]; this.col[j + 4] = c[1]; this.col[j + 5] = c[2];
    }
    this.geometry.setDrawRange(0, n * 2);
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
  }
}
SIM.RaySystem = RaySystem;
})();
