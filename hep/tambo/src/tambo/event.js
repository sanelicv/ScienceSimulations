/* El evento: la secuencia neutrino, choque, tau, decaimiento y cascada. */
(function () {
  const { NU_AZIMUTH_MAX, NU_ELEVATION_MIN, NU_ELEVATION_MAX, HIGHLIGHT_COLOR, HIGHLIGHT_PERIOD, C_LIGHT, US_PER_S, BAR_GROW_TIME, SHOWER_SPREAD, NU_TRAIL, TAU_TRAIL, NU_LEN, NU_SPEED, TAU_SPEED } = TAMBO.settings;
  const { app, camera } = TAMBO.scene;
  const { axis, height, inRock, setTourRockView } = TAMBO.terrain;
  const { panelPos, panels, setPanel, resetPanels, bars, setBar } = TAMBO.detectors;
  const { lNu, lTau, lShower, lHit, lDecay, eventLabels } = TAMBO.labels;
  const { nuTrack, tauTrack, vHit, vDecay, setTracksUnderRock } = TAMBO.tracks;
  const { showCone, hideCone, setConeFront, fadeCone } = TAMBO.cone;
  const { shower, flashes, planParticles } = TAMBO.particles;
const steps = TAMBO.steps;
const guide = TAMBO.guideCamera;
const GUIDED_NU_SPEED = 0.45;   // en la demostración, el neutrino viaja más despacio para poder seguirlo
const FINAL_TRACK_SHOWN = 22;   // en el último paso, cuánto del track del neutrino entra en el encuadre
const FINAL_FRAMING = 1.3;      // cuánto se aleja la cámara respecto a lo que debe encuadrar
const GUIDED_NU_REST = 0.6;     // dónde espera el neutrino en el primer paso (fracción de su recorrido)
steps.onFinish = () => { clearHighlight(); guide.goHome(); };
steps.onBack = (n) => goBackTo(n);

let ev = null;

// Pausa de una etapa, una sola vez por evento. Devuelve true si el evento quedó detenido.
function pauseOnce(name) {
  if (ev[name]) return false;
  ev[name] = true;
  return steps.stop();
}

// Último paso: el track del neutrino y las barras parpadean juntos, para conectar visualmente
// la información de los detectores con el neutrino que la originó
const highlightColor = new THREE.Color(HIGHLIGHT_COLOR);
const barColor = new THREE.Color();
function updateHighlight(dt) {
  ev.highlightT = (ev.highlightT || 0) + dt;
  const amount = 0.5 - 0.5 * Math.cos(2 * Math.PI * ev.highlightT / HIGHLIGHT_PERIOD);
  nuTrack.setPulse(amount, highlightColor);
  ev.hits.forEach((h, k) => bars.setColorAt(k, barColor.copy(h.color).lerp(highlightColor, amount)));
  bars.instanceColor.needsUpdate = true;
}
function clearHighlight() {
  nuTrack.setPulse(0);
  for (let k = 0; k < ev.nHit; k++) bars.setColorAt(k, ev.hits[k].color);
  bars.instanceColor.needsUpdate = true;
}

// Quién protagoniza el momento actual de la demostración, y a qué distancia mirarlo
const focusPoint = new THREE.Vector3();
function followProtagonist() {
  const { phase } = ev;
  if (phase === 'nu') {
    // El neutrino, desde que entra en la zona visible de su recorrido
    guide.focus(focusPoint.copy(ev.start).addScaledVector(ev.dir, Math.max(ev.s, 60)), 40);
  } else if (phase === 'pause') {
    guide.focus(ev.I, 24);
  } else if (phase === 'tau') {
    guide.focus(focusPoint.copy(ev.I).addScaledVector(ev.dir, ev.s), 20);
  } else if (phase === 'shower' && ev.nHit === 0) {
    // El frente de la cascada
    guide.focus(focusPoint.copy(ev.D).addScaledVector(ev.dir, Math.min(ev.tUs * C_LIGHT, ev.sHit)), 42);
  } else if (ev.hits.length) {
    // Los detectores que recibieron partículas
    focusPoint.set(0, 0, 0);
    for (const h of ev.hits) focusPoint.add(panelPos[h.i]);
    focusPoint.divideScalar(ev.hits.length);
    focusPoint.y += 1.5;
    if (phase === 'done') {
      // Último paso: se aleja hasta encuadrar juntos el final del track y las barras
      const trackEnd = ev.I.clone().addScaledVector(ev.dir, -FINAL_TRACK_SHOWN);
      const span = focusPoint.distanceTo(trackEnd);
      guide.focus(focusPoint.add(trackEnd).multiplyScalar(0.5), Math.max(55, Math.round(span * FINAL_FRAMING * (camera.aspect < 1 ? 1.3 : 1))));
    } else {
      guide.focus(focusPoint, 40);
    }
  }
}

function clearScene() {
  shower.clear(); flashes.clear(); resetPanels(); nuTrack.hide(); tauTrack.hide();
  vHit.visible = vDecay.visible = false;
  hideCone();
  bars.count = 0;
  for (const l of eventLabels) l.visible = false;
  lNu.el.style.color = 'var(--neutrino)'; lTau.el.style.color = 'var(--tau)';
}

// Primer paso del tour: el neutrino solo, en reposo a medio camino
function restNeutrino() {
  nuTrack.start(ev.start);
  nuTrack.setPulse(0);
  lNu.visible = true;
  ev.s = NU_LEN * GUIDED_NU_REST;
  const tip = ev.start.clone().addScaledVector(ev.dir, ev.s);
  nuTrack.set(ev.start, tip, 0, 35);
  lNu.target = tip.clone().add(LIFT);
  steps.show(1);
}

// Retroceder: vuelve al inicio de este mismo evento y lo recorre al instante hasta el paso pedido
function goBackTo(n) {
  clearHighlight();
  clearScene();
  Object.assign(ev, { phase: 'nu', nHit: 0, tUs: 0, s: 0, wait: 0, highlightT: 0, tauDone: false, showerDone: false, arrivalDone: false });
  for (const h of ev.hits) h.age = 0;
  restNeutrino();
  if (n === 1) { steps.stop(); return; }
  steps.replay(n, () => {
    for (let guard = 0; !steps.holding && guard < 20000; guard++) simulate(1 / 30);
  });
  flashes.clear();   // sin los destellos del recorrido rápido
}

// Elige al azar hasta que el evento sea válido; tras muchos intentos acepta el que haya
const MIN_DETECTORS = 12, MAX_ATTEMPTS = 40;

function launch(guided, attempt = 0) {
  clearScene();
  const retry = () => launch(guided, attempt + 1);
  const zc = (Math.random() - 0.5) * 60;
  const azimuth = THREE.MathUtils.degToRad((Math.random() * 2 - 1) * NU_AZIMUTH_MAX);
  const elevation = THREE.MathUtils.degToRad(NU_ELEVATION_MIN + Math.random() * (NU_ELEVATION_MAX - NU_ELEVATION_MIN));
  const dir = new THREE.Vector3(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation));
  // Punto donde el tau sale de la roca, en la ladera izquierda
  const ex = axis(zc) - 9 - Math.random() * 4;
  const E = new THREE.Vector3(ex, height(ex, zc), zc);
  const I = E.clone().addScaledVector(dir, -(2 + Math.random() * 3));   // choque dentro de la roca
  const D = E.clone().addScaledVector(dir, 1.5 + Math.random() * 2);    // el tau decae en el aire
  if (!inRock(I) || inRock(D)) return retry();
  // Hasta dónde llega el eje de la cascada antes de tocar la ladera opuesta
  let sHit = 0;
  const p = new THREE.Vector3();
  for (let s = 0.5; s < 80; s += 0.1) { p.copy(D).addScaledVector(dir, s); if (inRock(p)) { sHit = s; break; } }
  if (!sHit) return retry();
  // Que el eje de la cascada toque la zona con detectores
  p.copy(D).addScaledVector(dir, sHit);
  const hitX = p.x - axis(p.z);
  if (hitX < 6 || hitX > 25 || Math.abs(p.z) > 27) return retry();

  ev = { phase: 'nu', dir, E, I, D, sHit, hits: [], t0: 0, t1: 1, nHit: 0, tUs: 0, s: 0, wait: 0,
         coneTan: (0.35 + SHOWER_SPREAD * sHit) / sHit,
         start: I.clone().addScaledVector(dir, -NU_LEN), L: I.distanceTo(D), exitS: I.distanceTo(E), exited: false };
  planParticles(ev);
  if (ev.hits.length < MIN_DETECTORS && attempt < MAX_ATTEMPTS) return retry();
  nuTrack.start(ev.start);
  nuTrack.setPulse(0);
  lNu.visible = true;
  const leavingGuide = steps.active && !guided;
  steps.begin(guided);
  if (leavingGuide) guide.goHome();
  if (guided) {
    restNeutrino();
    steps.stop();
  }
}

function interaction() {
  ev.phase = 'pause'; ev.wait = 0.6;
  // El track del neutrino se queda, con su etiqueta, y aparece la marca del choque
  nuTrack.retire();
  lNu.target = ev.I.clone().addScaledVector(ev.dir, -9).add(LIFT);
  lNu.el.style.color = '#' + new THREE.Color(NU_TRAIL).getHexString();
  vHit.position.copy(ev.I); vHit.visible = true;
  lHit.target = ev.I.clone().add(new THREE.Vector3(0, -1.4, 0)); lHit.visible = true;
  flashes.spawn(ev.I, 0xffffff, 5, 1.4, { depthTest: false });
  steps.show(2);
  steps.stop();
}

function decay() {
  ev.phase = 'shower';
  ev.tUs = 0;
  // El track del tau también se queda
  tauTrack.retire();
  lTau.target = ev.I.clone().lerp(ev.D, 0.5).add(LIFT);
  lTau.el.style.color = '#' + new THREE.Color(TAU_TRAIL).getHexString();
  vDecay.position.copy(ev.D); vDecay.visible = true;
  lDecay.target = ev.D.clone().add(new THREE.Vector3(0, -1.4, 0)); lDecay.visible = true;
  lShower.visible = true;
  flashes.spawn(ev.D, 0xffd2a0, 7, 1.6, { renderOrder: 3.5 });
  showCone(ev.D, ev.coneCols);
  steps.show(4);
  for (const r of ev.particles) shower.add({ ...r });   // copias: el original sirve para volver a recorrer el evento
}

const tmpC = new THREE.Color(), tmpB = new THREE.Vector3(), LIFT = new THREE.Vector3(0, 1.4, 0);
function simulate(dt) {
  flashes.update(dt);
  nuTrack.update(dt);
  tauTrack.update(dt);
  if (ev && steps.active) followProtagonist();
  // Durante todo el tour (y en los demás eventos, si config.js lo pide), la roca es translúcida
  // y las partículas se ven a través de ella
  const seeThroughRock = steps.active || CONFIG.rocaTranslucidaEnEvento === true;
  setTracksUnderRock(seeThroughRock);
  setTourRockView(seeThroughRock);
  if (steps.holding) return;   // la escena queda congelada hasta pulsar Siguiente
  shower.update(dt);
  if (ev) {
    if (ev.phase === 'nu') {
      ev.s = Math.min(NU_LEN, ev.s + NU_SPEED * (steps.active ? GUIDED_NU_SPEED : 1) * dt);
      tmpB.copy(ev.start).addScaledVector(ev.dir, ev.s);
      nuTrack.set(ev.start, tmpB.clone(), 0, 35);   // aparece suavemente, ya bajo la montaña
      lNu.target = tmpB.clone().add(LIFT);
      if (ev.s >= NU_LEN) interaction();
    } else if (ev.phase === 'pause') {
      ev.wait -= dt;
      if (ev.wait <= 0) { ev.phase = 'tau'; ev.s = 0; tauTrack.start(ev.I); lTau.visible = true; steps.show(3); }
    } else if (ev.phase === 'tau') {
      ev.s = Math.min(ev.L, ev.s + TAU_SPEED * dt);
      tmpB.copy(ev.I).addScaledVector(ev.dir, ev.s);
      tauTrack.set(ev.I, tmpB.clone());
      lTau.target = tmpB.clone().add(LIFT);
      if (ev.s >= ev.L && !pauseOnce('tauDone')) decay();
    } else {
      if (ev.phase === 'shower') ev.tUs += dt * US_PER_S;
      if (ev.phase === 'shower') setConeFront(ev.coneCols, Math.max(0.05, ev.tUs * C_LIGHT));
      if (ev.phase === 'done') fadeCone(dt);
      lShower.target = ev.D.clone().addScaledVector(ev.dir, Math.min(ev.tUs * C_LIGHT, ev.sHit)).add(new THREE.Vector3(0, 2, 0));
      // Justo antes de que la primera partícula toque un detector
      if (ev.nHit === 0 && ev.hits.length && ev.hits[0].t <= ev.tUs) {
        if (pauseOnce('showerDone')) return;
      }
      if (steps.finishing) updateHighlight(dt);
      let changed = false, growing = false;
      while (ev.nHit < ev.hits.length && ev.hits[ev.nHit].t <= ev.tUs) {
        const k = ev.nHit++, h = ev.hits[k];
        SIM.timeColor((h.t - ev.t0) / Math.max(1e-3, ev.t1 - ev.t0), tmpC);
        setPanel(h.i, 1.2, tmpC);
        bars.setColorAt(k, tmpC);
        h.color = tmpC.clone();
        setBar(k, h, 0);
        bars.count = ev.nHit;
        flashes.spawn(panelPos[h.i], tmpC.getHex(), 0.7 + 0.25 * Math.log10(h.N), 0.6, { renderOrder: 3.5 });
        changed = true;
        if (k === 0) { steps.show(5); lShower.visible = false; }
      }
      for (let k = 0; k < ev.nHit; k++) {
        const h = ev.hits[k];
        if (h.age >= BAR_GROW_TIME) continue;
        h.age += dt;
        setBar(k, h, h.age / BAR_GROW_TIME);
        growing = true;
      }
      if (changed) { panels.instanceMatrix.needsUpdate = true; panels.instanceColor.needsUpdate = true; bars.instanceColor.needsUpdate = true; }
      if (changed || growing) bars.instanceMatrix.needsUpdate = true;
      if (ev.phase === 'shower' && ev.nHit === ev.hits.length && ev.tUs > ev.t1 + 4 && ev.tUs * C_LIGHT >= ev.coneMax && shower.rays.length === 0 && !pauseOnce('arrivalDone')) {
        ev.phase = 'done'; lShower.visible = false;
        steps.show(6);
        steps.askFinish();
      }
    }
  }
}
app.onUpdate(simulate);

TAMBO.event = {
  newEvent: () => launch(false),     // un evento de corrido
  startGuide: () => launch(true),    // la demostración guiada
  get ev() { return ev; },
};
})();
