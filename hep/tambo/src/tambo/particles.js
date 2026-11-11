/* Partículas de la cascada: dónde aterriza cada una y qué detectores activa. */
(function () {
  const { C_LIGHT, US_PER_S, BAR_PER_DECADE, CONE_REACH, LITE } = TAMBO.settings;
  const { scene } = TAMBO.scene;
  const { height } = TAMBO.terrain;
  const { up, panelPos, N_P, panelAt } = TAMBO.detectors;
  const { CONE_COLS } = TAMBO.cone;

const shower = new SIM.RaySystem(scene, 2500);
shower.material.fog = false;
shower.lines.renderOrder = 3.5;   // en el aire: siempre delante de la roca translúcida
const flashes = new SIM.Flashes(scene);

// Distancia a la que un rayo toca el terreno (0 si no llega antes de sEnd)
const rayP = new THREE.Vector3();
function landing(o, d, sEnd) {
  for (let s = 0.5; s < sEnd;) {
    rayP.copy(o).addScaledVector(d, s);
    const clearance = rayP.y - height(rayP.x, rayP.z);
    if (clearance <= 0) return s;
    s += Math.max(0.12, clearance * 0.5);
  }
  return 0;
}

// Cada detector se activa porque una partícula aterriza en él, y toda partícula termina donde
// aterriza: sobre un panel o en el suelo. Ninguna sigue de largo.
function planParticles(ev) {
  const { D, dir, coneTan } = ev;
  const sEnd = ev.sHit + CONE_REACH;
  const speed = C_LIGHT * US_PER_S;
  const hitOf = new Map();
  ev.particles = [];
  const particle = (d, stop, s0, hot) => ev.particles.push({ o: D.clone(), d, speed, length: 1.2 + Math.random(), sStop: stop, sMax: stop, s: s0,
    color: [1, 0.55 + 0.4 * hot, 0.25 + 0.5 * hot], fade: 0.05 });

  // Detectores dentro de la cascada, con vista directa al punto de decaimiento (sin roca de por medio)
  const v = new THREE.Vector3(), target = new THREE.Vector3();
  for (let i = 0; i < N_P; i++) {
    v.copy(panelPos[i]).sub(D);
    const s = v.dot(dir);
    if (s <= 0 || s > sEnd) continue;
    const dist = v.length();
    const dp = v.addScaledVector(dir, -s).length(), r = coneTan * s;
    if (dp > r) continue;   // solo los detectores dentro del cono
    const N = 3000 * Math.exp(-dp / (0.28 * r)) / (1 + 0.08 * s) * Math.exp(0.2 * randn());   // con algo de azar, como en un detector real
    if (N < 1) continue;
    const d = target.copy(panelPos[i]).sub(D).normalize().clone();
    if (landing(D, d, dist - 0.5)) continue;
    const delay = 0.03 * dp * dp;   // el frente de la cascada es curvo: lejos del eje llega un poco después
    const h = { i, t: dist / C_LIGHT + delay, N, barH: 0.25 + BAR_PER_DECADE * Math.log10(N), age: 0 };
    hitOf.set(i, h);
    particle(d, dist, -C_LIGHT * delay, Math.random());   // la primera partícula: su llegada activa el detector
    const extra = 1 + Math.round(3 * Math.log10(N));      // más partículas donde la barra será más alta
    for (let k = 0; k < extra; k++) {
      target.copy(panelPos[i]);
      target.x += (Math.random() - 0.5) * 0.4; target.z += (Math.random() - 0.5) * 0.3;
      const dk = target.sub(D);
      const L = dk.length();
      const s0 = -C_LIGHT * delay - Math.random() * 1.2;
      particle(dk.clone().divideScalar(L), L, s0, Math.random());
      h.t = Math.min(h.t, (L - s0) / C_LIGHT);   // el detector se enciende con la primera que llegue
    }
  }

  // El resto de la cascada termina en el suelo. Si por azar cae sobre un panel, también lo activa.
  const perp1 = new THREE.Vector3().crossVectors(dir, up).normalize();
  const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize();
  // Geometría del cono: hasta dónde llega cada generatriz
  ev.coneCols = [];
  ev.coneLen = []; ev.coneLand = [];
  for (let k = 0; k < CONE_COLS; k++) {
    const a = 2 * Math.PI * k / CONE_COLS;
    const radial = perp1.clone().multiplyScalar(Math.cos(a)).addScaledVector(perp2, Math.sin(a));
    const d = dir.clone().addScaledVector(radial, coneTan).normalize();
    const land = landing(D, d, sEnd);
    const L = land || sEnd;
    ev.coneCols.push({ d, L, n: radial.clone().addScaledVector(dir, -coneTan).normalize() });
    ev.coneLen.push(L); ev.coneLand.push(land > 0);
  }
  ev.coneMax = Math.max(...ev.coneLen);
  for (let k = 0; k < (LITE ? 800 : 1400); k++) {
    const a = Math.random() * Math.PI * 2, rr = coneTan * Math.min(1, Math.abs(randn()) * 0.45);
    const d = dir.clone().addScaledVector(perp1, Math.cos(a) * rr).addScaledVector(perp2, Math.sin(a) * rr).normalize();
    const stop = landing(D, d, sEnd);
    if (!stop) continue;
    const s0 = -Math.random() * 0.6;
    particle(d, stop, s0, Math.random());
    rayP.copy(D).addScaledVector(d, stop);
    const i = panelAt(rayP.x, rayP.z);
    if (i < 0) continue;
    const t = (stop - s0) / C_LIGHT;
    const h = hitOf.get(i);
    if (h) h.t = Math.min(h.t, t);
    else { const N = 1.5 + Math.random() * 3; hitOf.set(i, { i, t, N, barH: 0.25 + BAR_PER_DECADE * Math.log10(N), age: 0 }); }
  }

  ev.hits = [...hitOf.values()].sort((a, b) => a.t - b.t);
  if (ev.hits.length) { ev.t0 = ev.hits[0].t; ev.t1 = ev.hits[ev.hits.length - 1].t; }
}

function randn() { return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()); }

TAMBO.particles = { shower, flashes, planParticles };
})();
