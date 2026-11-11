/* El evento: el neutrino llega, choca con el agua, nace un muón o un electrón, su luz Cherenkov
 * viaja hasta las paredes y los fotomultiplicadores dibujan un anillo. */
(function () {
  const {
    C_VAC, C_WATER, CHER, NS_PER_S, GUIDED_NS_FACTOR, NU_TRAIL, NU_LEN, NU_SPEED, NU_TOUR_LEN, NU_TOUR_REST, NU_TOUR_K, NU_TOUR_MIN_SPEED,
    TOUR_NU_DIR, TOUR_VERTEX_BACK, TOUR_MUON_LEN, TOUR_SEED,
    LEPTONS, MUON_E_MIN, MUON_E_MAX, MUON_MIN_LEN, ELECTRON_E_MIN, ELECTRON_E_MAX, ELECTRON_TRACK, R, HH,
    HIGHLIGHT_COLOR, HIGHLIGHT_PERIOD, VIEW_REF_DIST,
  } = SUPERK.settings;
  const { app, camera, viewScale } = SUPERK.scene;
  const { controls } = app;
  const { height, setMountainSeeThrough } = SUPERK.mountain;
  const { setCavernSeeThrough } = SUPERK.cavern;
  const { toWall, toOuterWall } = SUPERK.tank;
  const pmts = SUPERK.pmts;
  const unrolled = SUPERK.unrolled;
  const { lNu, lLep, lLight, lHit, eventLabels } = SUPERK.labels;
  const { nuTrack, lepTrack, vHit, setTracksUnderRock, setViewScale } = SUPERK.tracks;
  const cherenkov = SUPERK.cherenkov;
  const light = SUPERK.light;
  const { flashes, deflect } = light;
  const steps = SUPERK.steps;
  const guide = SUPERK.guideCamera;

const UP = new THREE.Vector3(0, 1, 0);
const LIFT = new THREE.Vector3(0, 1.2, 0);
const BORN_WAIT = 0.35;          // en "Nuevo evento", breve pausa entre el choque y la salida del leptón
const MIN_HITS = 150, MAX_ATTEMPTS = 40;   // eventos con muy poca luz se descartan
const CAVERN_MAX_DIST = 95;      // zoom máximo dentro de la caverna
const FLIGHT_PAUSE = 0.35;        // la pausa del cono de luz, como fracción del tiempo hasta que llega a la pared
const MOUNTAIN_VIEW = 2.3;       // en el primer paso, la cámara se aleja tantas veces la distancia neutrino-tanque
steps.onFinish = () => { clearHighlight(); unrolled.show(!!CONFIG.vistaDesplegadaEnEvento); guide.goHome(); };
steps.onBack = (n) => goBackTo(n);

let ev = null;

// Pausa de una etapa, una sola vez por evento. Devuelve true si el evento quedó detenido.
function pauseOnce(name) {
  if (ev[name]) return false;
  ev[name] = true;
  return steps.stop();
}

// Último paso: el track del neutrino y los fotomultiplicadores encendidos parpadean juntos, para
// conectar visualmente la señal registrada con el neutrino que la originó
const highlightColor = new THREE.Color(HIGHLIGHT_COLOR);
function updateHighlight(dt) {
  ev.highlightT = (ev.highlightT || 0) + dt;
  const amount = 0.5 - 0.5 * Math.cos(2 * Math.PI * ev.highlightT / HIGHLIGHT_PERIOD);
  nuTrack.setPulse(amount, highlightColor);
  pmts.setHighlight(amount, highlightColor);
  unrolled.draw(pmts.lit, amount, highlightColor);
}
function clearHighlight() {
  if (!ev) return;
  ev.highlightT = 0;
  nuTrack.setPulse(0);
  pmts.setHighlight(0, highlightColor);
  unrolled.draw(pmts.lit);
}

/* ---------- Encuadres de la demostración ---------- */
const focusPoint = new THREE.Vector3();
const nuTip = () => ev.start.clone().addScaledVector(ev.nuDir, ev.s);

// Primer paso: desde fuera, de costado a la trayectoria, con la montaña y el tanque
function mountainView() {
  const tip = ev.start.clone().addScaledVector(ev.nuDir, ev.total - NU_TOUR_REST);
  const target = tip.lerp(ev.V, 0.45);
  const dist = NU_TOUR_REST * MOUNTAIN_VIEW * viewScale();
  let side = new THREE.Vector3().crossVectors(ev.nuDir, UP);
  if (side.lengthSq() < 0.04) side.set(1, 0, 0);
  side.normalize();
  let best = null;
  for (const elev of [0.25, 0.4, 0.55, 0.7, 0.85, 1.0]) {
    for (const sign of [1, -1]) {
      const dir = side.clone().multiplyScalar(sign * Math.cos(elev)).addScaledVector(UP, Math.sin(elev)).normalize();
      const pos = target.clone().addScaledVector(dir, dist);
      if (pos.y > height(pos.x, pos.z) + 250) { best = pos; break; }
    }
    if (best) break;
  }
  return { position: best || target.clone().addScaledVector(UP, dist), target };
}

// Paso de la luz en las paredes: dentro del tanque, detrás del choque, mirando hacia el anillo
function insideView() {
  const back = toWall(ev.V, ev.lepDir.clone().negate());
  const position = ev.V.clone().addScaledVector(ev.lepDir, -Math.max(0, back - 2.5));
  return { position, target: ev.ringCenter.clone() };
}

// Choque y cono de luz: la cámara entra al tanque sin cambiar de dirección (sigue viendo de costado)
// y se queda a esta distancia del muón, dentro del agua (el radio del tanque es 16.9 m)
const SIDE_INSIDE_DIST = 13;

// Último paso: se aleja hasta encuadrar la llegada del neutrino y los fotomultiplicadores encendidos
function finalView() {
  const target = ev.V.clone().addScaledVector(ev.nuDir, -18).lerp(new THREE.Vector3(), 0.45);
  let side = new THREE.Vector3().crossVectors(ev.nuDir, UP);
  if (side.lengthSq() < 0.04) side.set(1, 0, 0);
  side.normalize();
  // Del lado desde el que se ve mejor el anillo (el que mira hacia la cámara)
  const ringSide = ev.ringCenter.clone().setY(0);
  if (ringSide.lengthSq() > 1 && side.dot(ringSide) > 0) side.negate();
  const dir = side.multiplyScalar(0.85).addScaledVector(UP, 0.35).addScaledVector(ev.nuDir, -0.3).normalize();
  const dist = Math.min(105, 82 * viewScale());
  return { position: target.clone().addScaledVector(dir, dist), target };
}

function followProtagonist() {
  const { phase } = ev;
  if (phase === 'nu') {
    const remaining = ev.total - ev.s;
    if (steps.current === 1 && steps.holding) {
      const v = mountainView();
      guide.view('mountain', v.position, v.target);
    } else {
      // Se acerca con el neutrino: desde la montaña hasta el tanque
      focusPoint.copy(nuTip()).lerp(ev.V, 0.45);
      guide.focus(focusPoint, Math.max(75, remaining * MOUNTAIN_VIEW));
    }
  } else if (phase === 'born' || (phase === 'light' && ev.nHit === 0)) {
    // La distancia no se amplía en pantallas verticales: la cámara debe quedar dentro del tanque
    guide.focus(focusPoint.copy(ev.V).addScaledVector(ev.lepDir, ev.L * 0.5), SIDE_INSIDE_DIST / viewScale());
  } else if (phase === 'light') {
    const v = insideView();
    guide.view('inside', v.position, v.target);
  } else if (phase === 'done') {
    const v = finalView();
    guide.view('final', v.position, v.target);
  }
}

/* ---------- Escena ---------- */
function clearScene() {
  flashes.clear(); light.clear(); pmts.resetPmts(); cherenkov.hide();
  nuTrack.hide(); lepTrack.hide();
  vHit.visible = false;
  for (const l of eventLabels) l.visible = false;
  lNu.el.style.color = 'var(--neutrino)';
  unrolled.show(false);
}

// Primer paso del tour: el neutrino solo, en reposo, todavía lejos del tanque
function restNeutrino() {
  nuTrack.start(ev.start);
  nuTrack.setPulse(0);
  lNu.visible = true;
  ev.s = ev.total - NU_TOUR_REST;
  const tip = nuTip();
  nuTrack.set(ev.start, tip, 0, 300);
  lNu.target = tip.add(LIFT);
  steps.show(1);
}

function resetState() {
  Object.assign(ev, { phase: 'nu', s: 0, t: 0, wait: 0, nHit: 0, highlightT: 0,
    enterDone: false, bornDone: false, flightDone: false, arrivalDone: false, lepDone: false });
}

// Retroceder: vuelve al inicio de este mismo evento y lo recorre al instante hasta el paso pedido
function goBackTo(n) {
  clearHighlight();
  clearScene();
  resetState();
  guide.reset();
  restNeutrino();
  if (n === 1) { steps.stop(); return; }
  steps.replay(n, () => {
    for (let guard = 0; !steps.holding && guard < 40000; guard++) simulate(1 / 30);
  });
  flashes.clear();   // sin los destellos del recorrido rápido
}

// Un punto al azar dentro del volumen fiducial (a más de 2 m de las paredes)
function randomVertex() {
  let V;
  do { V = new THREE.Vector3((Math.random() * 2 - 1) * (R - 2), (Math.random() * 2 - 1) * (HH - 2), (Math.random() * 2 - 1) * (R - 2)); }
  while (V.x * V.x + V.z * V.z > (R - 2) ** 2);
  return V;
}

// Generador de azar con semilla (mulberry32): el tour reproduce siempre la misma luz
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// El evento del tour: siempre el mismo neutrino muónico (ver settings.js)
function tourEvent() {
  const nuDir = new THREE.Vector3(...TOUR_NU_DIR).normalize();
  const V = nuDir.clone().multiplyScalar(-TOUR_VERTEX_BACK);
  return { kind: 'muon', V, nuDir, lepDir: nuDir.clone(), L: TOUR_MUON_LEN, E: TOUR_MUON_LEN * 0.23 };
}

function launch(guided, attempt = 0) {
  clearScene();
  if (guided) return setup(true, tourEvent(), attempt);
  const kind = Math.random() < 0.5 ? 'muon' : 'electron';
  const V = randomVertex();
  // Desde cualquier dirección: bajando del cielo o subiendo después de cruzar la Tierra
  const nuDir = new THREE.Vector3().randomDirection();
  const lepDir = deflect(nuDir, kind === 'muon' ? 0.12 + 0.2 * Math.random() : 0.15 + 0.25 * Math.random());
  let L, E;
  if (kind === 'muon') {
    E = MUON_E_MIN + Math.random() * (MUON_E_MAX - MUON_E_MIN);
    L = Math.min(E / 0.23, toWall(V, lepDir));   // pierde unos 0.23 GeV por metro de agua
    if (L < MUON_MIN_LEN && attempt < MAX_ATTEMPTS) return launch(guided, attempt + 1);
  } else {
    E = ELECTRON_E_MIN + Math.random() * (ELECTRON_E_MAX - ELECTRON_E_MIN);
    L = Math.min(ELECTRON_TRACK, toWall(V, lepDir) - 0.2);
  }
  return setup(false, { kind, V, nuDir, lepDir, L, E }, attempt);
}

function setup(guided, base, attempt) {
  const { kind, V, nuDir, lepDir, L } = base;
  const total = guided ? NU_TOUR_LEN : NU_LEN;
  ev = { ...base, total, guided, start: V.clone().addScaledVector(nuDir, -total),
         sEnter: total - toOuterWall(V, nuDir.clone().negate()) };
  if (guided) {
    // Mismo azar cada vez: los mismos fotomultiplicadores encendidos y los mismos fotones
    const random = Math.random;
    Math.random = seeded(TOUR_SEED);
    try { light.planLight(ev); } finally { Math.random = random; }
  } else {
    light.planLight(ev);
    if (ev.hits.length < MIN_HITS && attempt < MAX_ATTEMPTS) return launch(false, attempt + 1);
  }
  resetState();
  if (kind === 'muon') cherenkov.prepare(V, lepDir, L);
  const lc = LEPTONS[kind];
  lepTrack.setColors(lc.active, lc.from, lc.to);
  lNu.el.innerHTML = kind === 'muon' ? 'ν<sub>μ</sub>' : 'ν<sub>e</sub>';
  lLep.el.innerHTML = kind === 'muon' ? 'μ' : 'e';
  lLep.el.style.color = '#' + new THREE.Color(lc.label).getHexString();

  nuTrack.start(ev.start);
  nuTrack.setPulse(0);
  lNu.visible = true;
  const leavingGuide = steps.active && !guided;
  steps.begin(guided, kind);
  guide.reset();
  if (leavingGuide) guide.goHome();
  if (guided) {
    restNeutrino();
    steps.stop();
  }
}

// El neutrino llega al punto del choque: desaparece y nace el leptón
function interaction() {
  ev.phase = 'born'; ev.wait = BORN_WAIT; ev.t = 0;
  nuTrack.retire();
  lNu.target = ev.V.clone().addScaledVector(ev.nuDir, -9).add(LIFT);
  lNu.el.style.color = '#' + new THREE.Color(NU_TRAIL).getHexString();
  vHit.position.copy(ev.V); vHit.visible = true;
  lHit.target = ev.V.clone().add(new THREE.Vector3(0, -1.5, 0)); lHit.visible = true;
  flashes.spawn(ev.V, 0xffffff, 5, 1.2, { depthTest: false });
  lepTrack.start(ev.V);
  lLep.target = ev.V.clone().add(LIFT); lLep.visible = true;
  steps.show(3);
  pauseOnce('bornDone');
}

// El leptón sale y empieza a emitir luz
function startLight() {
  ev.phase = 'light';
  light.start(ev, arrive);
  if (ev.kind === 'muon') cherenkov.show();
  steps.show(4);
}

// Un fotón llega a su fotomultiplicador: se enciende con el color de su tiempo de llegada
const tmpC = new THREE.Color();
function arrive(h) {
  SIM.timeColor((h.t - ev.t0) / Math.max(1e-3, ev.t1 - ev.t0), tmpC);
  pmts.lightPmt(h.i, h.q, tmpC);
  if (ev.nHit++ === 0) { steps.show(5); lLight.visible = false; }
}

// Dónde poner la etiqueta de la luz: sobre el frente de luz, del lado de arriba
const lightAxis = new THREE.Vector3();
function placeLightLabel() {
  lightAxis.copy(UP).addScaledVector(ev.lepDir, -UP.dot(ev.lepDir));
  if (lightAxis.lengthSq() < 0.01) lightAxis.set(1, 0, 0);
  lightAxis.normalize().multiplyScalar(Math.sin(CHER)).addScaledVector(ev.lepDir, Math.cos(CHER));
  const reach = Math.min(ev.t * C_WATER, toWall(ev.V, lightAxis) - 1);
  lLight.target = ev.V.clone().addScaledVector(lightAxis, Math.max(0, reach)).add(LIFT);
}

const tmpV = new THREE.Vector3();
function simulate(dt) {
  flashes.update(dt);
  nuTrack.update(dt);
  lepTrack.update(dt);
  if (ev && steps.active) followProtagonist();
  // En el tour (y en los demás eventos, si config.js lo pide), la roca es translúcida y las
  // partículas se ven a través de ella. La montaña, solo en el tour.
  const seeThrough = steps.active || CONFIG.rocaTranslucidaEnEvento === true;
  setTracksUnderRock(seeThrough);
  setCavernSeeThrough(seeThrough);
  setMountainSeeThrough(steps.active);
  if (steps.holding || !ev) return;   // la escena queda congelada hasta pulsar Siguiente
  pmts.update(dt);

  if (ev.phase === 'nu') {
    const speed = steps.active ? Math.max(NU_TOUR_MIN_SPEED, NU_TOUR_K * (ev.total - ev.s)) : NU_SPEED;
    ev.s = Math.min(ev.total, ev.s + speed * dt);
    // En el tour, se detiene al llegar al tanque
    if (steps.active && ev.s >= ev.sEnter && !ev.enterDone) {
      ev.s = ev.sEnter;
      steps.show(2);
      if (pauseOnce('enterDone')) { drawNeutrino(); return; }
    }
    drawNeutrino();
    if (ev.s >= ev.total) interaction();
  } else if (ev.phase === 'born') {
    ev.wait -= dt;
    if (ev.wait <= 0 || steps.active) startLight();
  } else {
    const dtNs = dt * NS_PER_S * (steps.active ? GUIDED_NS_FACTOR : 1);
    // Con la luz a medio camino de la pared: el cono se ve entero en el agua, entre el muón y la pared
    if (ev.phase === 'light' && ev.nHit === 0 && ev.hits.length && ev.t + dtNs >= ev.t0 * FLIGHT_PAUSE) {
      if (pauseOnce('flightDone')) return;
    }
    ev.t += dtNs;
    light.update(dtNs);
    if (ev.kind === 'muon') cherenkov.setTime(ev.t);
    // El leptón: avanza casi a la velocidad de la luz en el vacío y desaparece donde se detiene
    const sl = Math.min(ev.t * C_VAC, ev.L);
    const head = tmpV.copy(ev.V).addScaledVector(ev.lepDir, Math.max(0.02, sl));
    if (!ev.lepDone) {
      lepTrack.set(ev.V, head.clone());
      lLep.target = head.clone().add(LIFT);
      if (sl >= ev.L) { ev.lepDone = true; lepTrack.retire(); lLep.target = ev.V.clone().lerp(head, 0.5).add(LIFT); }
    }
    // La etiqueta de la luz aparece cuando el frente ya se separó del choque (no tapa "choque")
    if (ev.phase === 'light' && ev.nHit === 0) { lLight.visible = ev.t * C_WATER > 4; if (lLight.visible) placeLightLabel(); }
    if (ev.phase === 'light' && ev.t >= ev.tEnd && ev.nHit === ev.hits.length && !pauseOnce('arrivalDone')) {
      ev.phase = 'done';
      lLight.visible = false;
      steps.show(6);
      steps.askFinish();
      if (steps.active || CONFIG.vistaDesplegadaEnEvento) { unrolled.show(true); unrolled.draw(pmts.lit); }
    }
    if (ev.phase === 'done' && steps.finishing) updateHighlight(dt);
  }
}

function drawNeutrino() {
  const tip = nuTip();
  nuTrack.set(ev.start, tip.clone(), 0, steps.active ? 300 : 30);   // aparece suavemente, ya dentro de la roca
  lNu.target = tip.add(LIFT);
}
app.onUpdate(simulate);

// Límites de la cámara: en el tour puede salir a ver la montaña; si no, se queda en la caverna.
// En el primer paso no se puede meter bajo el terreno (desde abajo la montaña no se ve).
app.onUpdate(() => {
  const dist = camera.position.distanceTo(controls.target);
  if (steps.active) controls.maxDistance = 8000;
  else if (dist <= CAVERN_MAX_DIST) controls.maxDistance = CAVERN_MAX_DIST;
  if (ev && steps.active && steps.current === 1 && steps.holding && !guide.busy) {
    camera.position.y = Math.max(camera.position.y, height(camera.position.x, camera.position.z) + 40);
  }
});

// Tamaño aparente de tracks y esferas según la distancia de la cámara
app.onFrame(() => setViewScale(Math.max(1, camera.position.distanceTo(controls.target) / VIEW_REF_DIST)));

SUPERK.event = {
  newEvent: () => launch(false),     // un evento de corrido
  startGuide: () => launch(true),    // la demostración guiada
  get ev() { return ev; },
  simulate,
};
})();
