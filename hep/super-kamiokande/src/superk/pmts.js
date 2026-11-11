/* Los 11 146 fotomultiplicadores del detector interno (a tamaño real) y cómo se marcan al recibir luz. */
(function () {
  const { R, HH, PMT_RADIUS, PMT_IDLE, PMT_GROW_MAX, BAR_RADIUS, MARK_GROW_TIME } = SUPERK.settings;
  const { scene } = SUPERK.scene;

// Disposición real: 51 filas × 150 columnas en la pared, y una rejilla de 70 cm en el techo y el fondo
const pmt = [];   // { p: posición, n: hacia el centro, part: 'top' | 'barrel' | 'bottom', phi, y, x, z }
const COLS = 150, ROWS = 51;
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const phi = (i + 0.5 * (j % 2)) / COLS * Math.PI * 2;
  const y = -HH + 0.4 + j * (2 * HH - 0.8) / (ROWS - 1);
  pmt.push({ p: new THREE.Vector3(R * Math.cos(phi), y, R * Math.sin(phi)), n: new THREE.Vector3(-Math.cos(phi), 0, -Math.sin(phi)), part: 'barrel', phi, y });
}
const SP = 0.697;
for (const s of [1, -1]) for (let x = -R; x <= R; x += SP) for (let z = -R; z <= R; z += SP) {
  if (x * x + z * z > (R - 0.45) ** 2) continue;
  pmt.push({ p: new THREE.Vector3(x, s * HH, z), n: new THREE.Vector3(0, -s, 0), part: s > 0 ? 'top' : 'bottom', x, z });
}
pmt.length = Math.min(pmt.length, 11146);   // número real de fotomultiplicadores del detector interno
const N_PMT = pmt.length;

const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 7), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), N_PMT);
mesh.frustumCulled = false;
scene.add(mesh);
const IDLE = new THREE.Color(PMT_IDLE);
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3();
function setPmt(i, size, color) {
  m4.makeScale(size, size, size).setPosition(pmt[i].p);
  mesh.setMatrixAt(i, m4);
  mesh.setColorAt(i, color);
}

// Barras (opción de config.js): salen de la pared hacia el centro del tanque
const BARS = CONFIG.marcaPMT === 'barras';
const barGeo = new THREE.CylinderGeometry(BAR_RADIUS, BAR_RADIUS, 1, 6);
barGeo.translate(0, 0.5, 0);   // la base en la pared
const barShade = new Float32Array(barGeo.attributes.position.count * 3);
for (let i = 0; i < barGeo.attributes.position.count; i++) {
  const k = 0.6 + 0.5 * barGeo.attributes.position.getY(i);   // más oscura en la base, más clara en la punta
  barShade.set([k, k, k], i * 3);
}
barGeo.setAttribute('color', new THREE.BufferAttribute(barShade, 3));
const bars = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }), BARS ? N_PMT : 1);
bars.count = 0;
bars.frustumCulled = false;
bars.setColorAt(0, IDLE);
scene.add(bars);
const Y = new THREE.Vector3(0, 1, 0);

// Encendidos en este evento, en orden de llegada: { i, color, amount (0 a 1), age }
let lit = [];

function resetPmts() {
  for (let i = 0; i < N_PMT; i++) setPmt(i, PMT_RADIUS, IDLE);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  lit = [];
  bars.count = 0;
}
resetPmts();

// Cuánta luz recibió, en una escala de 0 a 1 (logarítmica, igual para todos los eventos)
const amountOf = (q) => Math.min(1, Math.log10(1 + 3 * q) / 2.4);

function draw(k, color) {
  const h = lit[k], e = 1 - Math.pow(1 - Math.min(1, h.age / MARK_GROW_TIME), 3);
  if (BARS) {
    setPmt(h.i, PMT_RADIUS * 1.25, color);
    s3.set(1, Math.max(0.001, e * Math.max(0.12, h.amount) * CONFIG.alturaMaximaBarras), 1);
    q4.setFromUnitVectors(Y, pmt[h.i].n);
    m4.compose(pmt[h.i].p, q4, s3);
    bars.setMatrixAt(k, m4);
    bars.setColorAt(k, color);
  } else {
    setPmt(h.i, PMT_RADIUS * (1 + (1.2 + (PMT_GROW_MAX - 1.2) * h.amount - 1) * e), color);
  }
}
function flag() {
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  if (BARS) { bars.count = lit.length; bars.instanceMatrix.needsUpdate = true; bars.instanceColor.needsUpdate = true; }
}

// Un fotomultiplicador recibe la luz: se pinta con el color del tiempo y su marca empieza a crecer
function lightPmt(i, q, color) {
  lit.push({ i, color: color.clone(), amount: amountOf(q), age: 0 });
  draw(lit.length - 1, color);
  flag();
}

function update(dt) {
  let changed = false;
  for (let k = 0; k < lit.length; k++) {
    const h = lit[k];
    if (h.age >= MARK_GROW_TIME) continue;
    h.age = Math.min(MARK_GROW_TIME, h.age + dt);
    draw(k, h.color);
    changed = true;
  }
  if (changed) flag();
}

// Último paso: todos los encendidos se tiñen a la vez del color de resaltado (amount 0 = su color)
const tmpC = new THREE.Color();
function setHighlight(amount, color) {
  for (let k = 0; k < lit.length; k++) draw(k, tmpC.copy(lit[k].color).lerp(color, amount));
  flag();
}

SUPERK.pmts = { pmt, N_PMT, resetPmts, lightPmt, update, setHighlight, get lit() { return lit; } };
})();
