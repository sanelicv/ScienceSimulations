/* El cono de luz Cherenkov del muón: la onda de choque que deja al ir más rápido que la luz en el agua.
 * Es la envolvente exacta de los fotones dibujados: cada punto de la superficie es la posición, en este
 * instante, de la luz emitida desde un punto del track. Termina donde esa luz toca la pared. */
(function () {
  const { CHER, C_VAC, C_WATER, LIGHT_HEX, CONE_OPACITY } = SUPERK.settings;
  const { scene } = SUPERK.scene;
  const { toWall } = SUPERK.tank;

const COLS = 96, ROWS = 24;   // alrededor del eje y a lo largo del track
const N = COLS * ROWS;
const geo = new THREE.BufferGeometry();
const posA = new THREE.BufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage);
const aliveA = new THREE.BufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage);
const rowA = new THREE.BufferAttribute(new Float32Array(N), 1);
const idx = [];
for (let j = 0; j < ROWS; j++) for (let k = 0; k < COLS; k++) {
  rowA.setX(j * COLS + k, j / (ROWS - 1));
  if (j < ROWS - 1) {
    const a = j * COLS + k, b = j * COLS + (k + 1) % COLS, c = a + COLS, d = b + COLS;
    idx.push(a, c, b, b, c, d);
  }
}
geo.setAttribute('position', posA);
geo.setAttribute('aAlive', aliveA);
geo.setAttribute('aRow', rowA);
geo.setIndex(idx);
geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N * 3), 3));

const opacityU = { value: CONE_OPACITY };
const cone = new THREE.Mesh(geo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uOpacity: opacityU, uColor: { value: new THREE.Color(LIGHT_HEX) } },
  vertexShader: `
    attribute float aAlive, aRow;
    varying float vAlive, vRow; varying vec3 vN, vV;
    void main() {
      vAlive = aAlive; vRow = aRow;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uOpacity; uniform vec3 uColor;
    varying float vAlive, vRow; varying vec3 vN, vV;
    void main() {
      // Donde la superficie todavía no se abrió (en el choque o junto al muón), no hay normal válida
      float ln = length(vN);
      float f = ln > 1e-3 ? abs(dot(vN / ln, normalize(vV))) : 0.0;
      if (ln <= 1e-3) discard;
      // Núcleo suave y borde marcado: siempre queda algo visible, también mirando por el eje
      float shape = 0.5 * pow(f, 1.5) + 0.8 * pow(1.0 - f, 3.0);
      vec3 col = mix(uColor, vec3(1.0), 0.35 * vRow);   // más claro cerca del muón
      gl_FragColor = vec4(col, uOpacity * shape * vAlive);
    }`,
}));
cone.renderOrder = 4;
cone.frustumCulled = false;
cone.visible = false;
scene.add(cone);

let plan = null;   // { V, d, L, dirs: [u por columna], wall: [distancia a la pared por fila y columna] }

// Prepara la forma del cono para un muón que sale de V en la dirección d y recorre L metros
function prepare(V, d, L) {
  const e1 = new THREE.Vector3().crossVectors(d, Math.abs(d.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(d, e1);
  const dirs = [], wall = new Float32Array(N);
  for (let k = 0; k < COLS; k++) {
    const a = 2 * Math.PI * k / COLS;
    dirs.push(d.clone().multiplyScalar(Math.cos(CHER)).addScaledVector(e1, Math.sin(CHER) * Math.cos(a)).addScaledVector(e2, Math.sin(CHER) * Math.sin(a)));
  }
  const P = new THREE.Vector3();
  for (let j = 0; j < ROWS; j++) {
    P.copy(V).addScaledVector(d, L * j / (ROWS - 1));
    for (let k = 0; k < COLS; k++) wall[j * COLS + k] = toWall(P, dirs[k]);
  }
  plan = { V: V.clone(), d: d.clone(), L, dirs, wall };
}

// Coloca el cono en el instante t (ns desde el choque)
const P = new THREE.Vector3();
function setTime(t) {
  if (!plan) return;
  const { V, d, L, dirs, wall } = plan;
  const head = Math.min(t * C_VAC, L);
  let any = false;
  for (let j = 0; j < ROWS; j++) {
    const s = Math.min(L * j / (ROWS - 1), head);
    const dist = Math.max(0, t - s / C_VAC) * C_WATER;   // cuánto avanzó la luz emitida en ese punto
    P.copy(V).addScaledVector(d, s);
    for (let k = 0; k < COLS; k++) {
      const n = j * COLS + k, w = wall[n], r = Math.min(dist, w);
      posA.setXYZ(n, P.x + dirs[k].x * r, P.y + dirs[k].y * r, P.z + dirs[k].z * r);
      const alive = Math.min(1, Math.max(0, (w - dist) / 1.5));   // se apaga al tocar la pared
      aliveA.setX(n, alive);
      if (alive > 0) any = true;
    }
  }
  posA.needsUpdate = true;
  aliveA.needsUpdate = true;
  geo.computeVertexNormals();
  cone.visible = any;
}

function show() { setTime(0); }
function hide() { cone.visible = false; plan = null; }

SUPERK.cherenkov = { prepare, setTime, show, hide };
})();
