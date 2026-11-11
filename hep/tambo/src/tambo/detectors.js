/* Detectores (paneles de plástico centelleador) y sus barras. */
(function () {
  const { BAR_RADIUS } = TAMBO.settings;
  const { scene } = TAMBO.scene;
  const { axis, height } = TAMBO.terrain;

const SP = 1.5;   // 150 m entre detectores
const panelPos = [], panelQuat = [];
const up = new THREE.Vector3(0, 1, 0);
for (let row = 0, z = -30; z <= 30; z += SP * Math.sqrt(3) / 2, row++) {
  for (let X = 4 + (row % 2) * SP / 2; X <= 26; X += SP) {
    const x = axis(z) + X, y = height(x, z);
    const e = 0.2;
    const n = new THREE.Vector3(height(x - e, z) - height(x + e, z), 2 * e, height(x, z - e) - height(x, z + e)).normalize();
    panelPos.push(new THREE.Vector3(x, y + 0.12, z));
    panelQuat.push(new THREE.Quaternion().setFromUnitVectors(up, n));
  }
}
const N_P = panelPos.length;
const panels = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.08, 0.38), new THREE.MeshLambertMaterial({ color: 0xffffff }), N_P);
const IDLE = new THREE.Color(0xd8dde6);
const m4 = new THREE.Matrix4(), sc = new THREE.Vector3();
function setPanel(i, s, color) {
  sc.set(s, s, s);
  m4.compose(panelPos[i], panelQuat[i], sc);
  panels.setMatrixAt(i, m4);
  panels.setColorAt(i, color);
}
function resetPanels() {
  for (let i = 0; i < N_P; i++) setPanel(i, 1, IDLE);
  panels.instanceMatrix.needsUpdate = true;
  panels.instanceColor.needsUpdate = true;
}
resetPanels();
panels.frustumCulled = false;
const panelGrid = new Map();
const gridKey = (x, z) => Math.round(x / SP) + ',' + Math.round(z / SP);
panelPos.forEach((q, i) => {
  const k = gridKey(q.x, q.z);
  if (!panelGrid.has(k)) panelGrid.set(k, []);
  panelGrid.get(k).push(i);
});
const PANEL_CATCH = 0.5;   // una partícula que aterriza a esta distancia del centro cae sobre el panel
function panelAt(x, z) {
  let best = -1, bestD = PANEL_CATCH;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    for (const i of panelGrid.get(gridKey(x + a * SP, z + b * SP)) ?? []) {
      const d = Math.hypot(panelPos[i].x - x, panelPos[i].z - z);
      if (d < bestD) { bestD = d; best = i; }
    }
  }
  return best;
}
scene.add(panels);

// Barras: una sobre cada detector alcanzado. La altura indica cuántas partículas recibió.
const barGeo = new THREE.CylinderGeometry(BAR_RADIUS, BAR_RADIUS, 1, 6);
barGeo.translate(0, 0.5, 0);   // la base queda en y = 0 y la barra crece hacia arriba
const barShade = new Float32Array(barGeo.attributes.position.count * 3);
for (let i = 0; i < barGeo.attributes.position.count; i++) {
  const k = 0.6 + 0.55 * barGeo.attributes.position.getY(i);   // más oscura abajo, más clara arriba
  barShade.set([k, k, k], i * 3);
}
barGeo.setAttribute('color', new THREE.BufferAttribute(barShade, 3));
const bars = new THREE.InstancedMesh(barGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), N_P);
bars.setColorAt(0, IDLE);
bars.count = 0;
bars.frustumCulled = false;
scene.add(bars);
const barQuat = new THREE.Quaternion(), barScale = new THREE.Vector3();
function setBar(k, h, grow) {
  const e = 1 - Math.pow(1 - Math.min(1, grow), 3);
  barScale.set(1, Math.max(0.001, h.barH * e), 1);
  m4.compose(panelPos[h.i], barQuat, barScale);
  bars.setMatrixAt(k, m4);
}

TAMBO.detectors = { up, panelPos, panels, N_P, setPanel, resetPanels, panelAt, PANEL_CATCH, bars, setBar };
})();
