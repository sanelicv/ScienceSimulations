/* La luz del evento: qué fotomultiplicadores la reciben, cuándo y cuánta, y los fotones dibujados.
 * Causalidad: cada fotomultiplicador se enciende solo cuando le llega un fotón dibujado (en el mismo
 * instante en que ese fotón se detiene en él). Todo fotón termina donde toca la pared. */
(function () {
  const { CHER, C_VAC, C_WATER, ATT, LIGHT_COLOR, PHOTON_LENGTH, WALL_PHOTONS, ELECTRON_LEN, ELECTRON_TRACK, LEPTONS } = SUPERK.settings;
  const { scene } = SUPERK.scene;
  const { toWall } = SUPERK.tank;
  const { pmt, N_PMT } = SUPERK.pmts;

const photons = new SIM.RaySystem(scene, 6000);
photons.material.fog = false;
photons.lines.renderOrder = 3.5;
const spray = new SIM.RaySystem(scene, 200);   // la cascada del electrón
spray.material.fog = false;
spray.lines.renderOrder = 3.6;
const flashes = new SIM.Flashes(scene);

const randn = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
function deflect(d, ang) {
  const r = new THREE.Vector3().randomDirection();
  r.addScaledVector(d, -r.dot(d)).normalize();
  return d.clone().multiplyScalar(Math.cos(ang)).addScaledVector(r, Math.sin(ang)).normalize();
}

// Tramos rectos que emiten luz: { o, d, len, t0 (ns en que empieza), q (luz por tramo) }
function segmentsOf(ev) {
  const { V, lepDir, L } = ev;
  if (ev.kind === 'muon') return [{ o: V.clone(), d: lepDir.clone(), len: L, t0: 0, q: 140 }];
  // Electrón: un tramo corto y luego una cascada de partículas que se dispersan (anillo difuso)
  const segs = [{ o: V.clone(), d: lepDir.clone(), len: ev.L, t0: 0, q: 120 }];
  const nSub = 45, qSub = 330 * ev.E / nSub * 1.6;
  for (let k = 0; k < nSub; k++) {
    const o = V.clone().addScaledVector(lepDir, Math.random() * ELECTRON_LEN * 0.6);
    const d = deflect(lepDir, Math.abs(randn()) * 0.33);
    const len = Math.min(0.3 + Math.random() * 1.0, toWall(o, d) - 0.2);
    if (len <= 0.05) continue;
    segs.push({ o, d, len, t0: o.distanceTo(V) / C_VAC, q: qSub, sub: true });
  }
  return segs;
}

// Planifica la luz del evento: ev.hits (en orden de llegada), ev.photons y ev.spray (rayos para dibujar)
function planLight(ev) {
  const segs = segmentsOf(ev);
  const tanC = Math.tan(CHER), sinC = Math.sin(CHER), cosC = Math.cos(CHER);
  const hitQ = new Float32Array(N_PMT), hitT = new Float64Array(N_PMT).fill(Infinity);
  const emit = new Array(N_PMT);
  const v = new THREE.Vector3();
  for (const g of segs) {
    for (let k = 0; k < N_PMT; k++) {
      v.subVectors(pmt[k].p, g.o);
      const a = v.dot(g.d);
      const b = Math.sqrt(Math.max(1e-6, v.lengthSq() - a * a));
      const s = a - b / tanC;                 // punto del tramo desde donde la luz llega con 41°
      if (s < 0 || s > g.len) continue;
      const D = b / sinC;
      hitQ[k] += g.q * Math.exp(-D / ATT) / b;
      const te = g.t0 + s / C_VAC, t = te + D / C_WATER;
      if (t < hitT[k]) { hitT[k] = t; emit[k] = { o: g.o.clone().addScaledVector(g.d, s), te, D }; }
    }
  }
  // La luz se convierte en fotomultiplicadores encendidos con azar, como los fotones reales
  ev.hits = [];
  ev.photons = [];
  const color = LIGHT_COLOR;
  for (let k = 0; k < N_PMT; k++) {
    if (!(hitQ[k] > 0) || Math.random() >= 1 - Math.exp(-hitQ[k])) continue;
    const e = emit[k];
    const h = { i: k, q: hitQ[k], t: e.te + e.D / C_WATER };
    ev.hits.push(h);
    // El fotón que lo enciende: sale del track y se detiene justo en el fotomultiplicador
    ev.photons.push({ o: e.o, d: pmt[k].p.clone().sub(e.o).divideScalar(e.D), speed: C_WATER, length: Math.min(PHOTON_LENGTH, e.D),
      s: -e.te * C_WATER, sStop: e.D, sMax: e.D, color, fade: 0.05, hit: h });
  }
  // Más fotones que caen en la pared entre fotomultiplicadores (no encienden nada)
  const weights = segs.map((g) => g.len * g.q);
  const total = weights.reduce((a, b) => a + b, 0);
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), u = new THREE.Vector3();
  for (let n = 0, nWall = Math.round(WALL_PHOTONS * ev.hits.length); n < nWall; n++) {
    let r = Math.random() * total, g = segs[0];
    for (let k = 0; k < segs.length; k++) { r -= weights[k]; if (r <= 0) { g = segs[k]; break; } }
    e1.crossVectors(g.d, Math.abs(g.d.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
    e2.crossVectors(g.d, e1);
    const s = Math.random() * g.len, a = Math.random() * 2 * Math.PI;
    u.copy(g.d).multiplyScalar(cosC).addScaledVector(e1, sinC * Math.cos(a)).addScaledVector(e2, sinC * Math.sin(a));
    const o = g.o.clone().addScaledVector(g.d, s), D = toWall(o, u);
    const te = g.t0 + s / C_VAC;
    ev.photons.push({ o, d: u.clone(), speed: C_WATER, length: Math.min(PHOTON_LENGTH, D), s: -te * C_WATER, sStop: D, sMax: D, color, fade: 0.05 });
  }
  // La cascada del electrón: partículas que se frenan en el agua
  const c = new THREE.Color(LEPTONS.electron.active);
  ev.spray = segs.filter((g) => g.sub).map((g) => ({ o: g.o, d: g.d, speed: C_VAC, length: 0.35, s: -g.t0 * C_VAC, sStop: g.len, sMax: g.len,
    color: [c.r, c.g, c.b], fade: 0.1 }));

  ev.hits.sort((a, b) => a.t - b.t);
  ev.t0 = ev.hits.length ? ev.hits[0].t : 0;
  ev.t1 = ev.hits.length ? ev.hits[ev.hits.length - 1].t : 1;
  ev.tEnd = Math.max(ev.t1, ...ev.photons.map((p) => (p.sStop - p.s) / C_WATER)) + 1;   // ya no queda luz en vuelo
  ev.ringCenter = V0(ev).addScaledVector(ev.lepDir, toWall(ev.V, ev.lepDir));
}
const V0 = (ev) => ev.V.clone();

// Lanza la luz y la cascada; onArrive(h) se llama cuando un fotón llega a su fotomultiplicador
function start(ev, onArrive) {
  photons.clear(); spray.clear();
  for (const p of ev.photons) {
    const r = { ...p };   // copias: el original sirve para volver a recorrer el evento
    if (p.hit) r.onStop = () => onArrive(p.hit);
    photons.add(r);
  }
  for (const p of ev.spray) spray.add({ ...p });
}

// Avanza la luz dtNs nanosegundos
function update(dtNs) {
  photons.update(dtNs);
  spray.update(dtNs);
}

function clear() { photons.clear(); spray.clear(); photons.update(0); spray.update(0); }

SUPERK.light = { planLight, start, update, clear, flashes, deflect, randn, photons };
})();
