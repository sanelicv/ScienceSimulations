/* La caverna excavada en la roca donde está el tanque (agrandada para poder mirarlo desde fuera). */
(function () {
  const { HH_OUT, LITE } = SUPERK.settings;
  const { app, scene, camera } = SUPERK.scene;
  const { controls } = app;

const FLOOR = -HH_OUT;          // el tanque se apoya en el suelo de la caverna
const RADIUS = 125;             // radio de la caverna (la real es mucho más ajustada al tanque)
const CEILING = 105;            // altura de la bóveda sobre el suelo

// Bóveda irregular de roca, con el suelo plano. Se ve desde dentro (caras interiores).
const geo = new THREE.SphereGeometry(1, LITE ? 64 : 96, LITE ? 32 : 48);
const p = geo.attributes.position;
const v = new THREE.Vector3();
for (let i = 0; i < p.count; i++) {
  v.fromBufferAttribute(p, i);
  const n = 1 + 0.07 * SIM.fbm(v.x * 2.5 + 11, v.y * 2.5, v.z * 2.5, 4);   // roca rugosa
  if (v.y >= 0) {
    p.setXYZ(i, v.x * RADIUS * n, FLOOR + v.y * CEILING * n, v.z * RADIUS * n);
  } else {
    // Hemisferio inferior aplastado: el suelo, con algunas piedras sueltas
    const r = Math.hypot(v.x, v.z) * RADIUS * n;
    const a = Math.atan2(v.z, v.x);
    p.setXYZ(i, Math.cos(a) * r, FLOOR - 0.05 + 0.6 * Math.max(0, SIM.noise3(v.x * 9, 4, v.z * 9)) * Math.min(1, (r - 30) / 40), Math.sin(a) * r);
  }
}
geo.computeVertexNormals();
const toned = geo.toNonIndexed();   // caras planas, aspecto low-poly
toned.computeVertexNormals();
const tp = toned.attributes.position, tn = toned.attributes.normal;
const cols = new Float32Array(tp.count * 3);
// Iluminación fija: la lámpara de la bóveda. El sol de la montaña no llega hasta aquí.
const LAMP = new THREE.Vector3(0, FLOOR + CEILING * 0.85, 0);
const toLamp = new THREE.Vector3(), inward = new THREE.Vector3();
const c1 = new THREE.Color(0x4a4339), c2 = new THREE.Color(0x2f2b26), cFloor = new THREE.Color(0x3b3833), c = new THREE.Color();
for (let i = 0; i < tp.count; i++) {
  v.fromBufferAttribute(tp, i);
  c.copy(c2).lerp(c1, 0.5 + 0.5 * SIM.noise3(v.x / 14, v.y / 14, v.z / 14));
  if (v.y < FLOOR + 1) c.copy(cFloor);
  inward.fromBufferAttribute(tn, i).negate();
  toLamp.subVectors(LAMP, v).normalize();
  const shade = 0.55 + 0.6 * Math.max(0, inward.dot(toLamp));
  cols.set([c.r * shade, c.g * shade, c.b * shade], i * 3);
}
toned.setAttribute('color', new THREE.BufferAttribute(cols, 3));
const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
const rockU = { uRock: { value: 1 } };
mat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, rockU);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uRock;')
    .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.a *= uRock;');
};
const cavern = new THREE.Mesh(toned, mat);
cavern.frustumCulled = false;
scene.add(cavern);

// ¿Está la cámara dentro de la caverna? (0 fuera, 1 dentro). Desde fuera la caverna no se dibuja:
// así, en la vista de la montaña, el tanque se ve sin una cáscara oscura alrededor.
function insideAmount() {
  const q = camera.position;
  const e = Math.hypot(q.x / RADIUS, Math.max(0, q.y - FLOOR) / CEILING);
  return 1 - Math.min(1, Math.max(0, (e - 0.82) / 0.18));
}

let seeThrough = false, amount = 0;
app.onUpdate((dt, raw) => {
  const goal = seeThrough ? 1 : 0;
  if (amount !== goal) amount = goal > amount ? Math.min(1, amount + raw / 0.6) : Math.max(0, amount - raw / 0.6);
});
app.onFrame(() => {
  const inside = insideAmount();
  const opacity = Math.min(1 + (CONFIG.rocaOpacidadCaverna - 1) * amount, inside);
  rockU.uRock.value = opacity;
  cavern.visible = opacity > 0.01;
  const transparent = opacity < 1;
  if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true; }
  mat.depthWrite = !transparent;
  // Translúcida, se pinta después de los tracks: así se ven a través de la roca
  cavern.renderOrder = transparent ? 3.1 : 0;
  // Dentro de la caverna, la cámara no atraviesa el suelo
  if (inside > 0.5 && camera.position.y < FLOOR + 1.5 && controls.target.y > FLOOR) camera.position.y = FLOOR + 1.5;
});

// Del tour (o de config.js): la roca se aclara u opaca suavemente
function setCavernSeeThrough(on) { seeThrough = on; }

SUPERK.cavern = { FLOOR, RADIUS, CEILING, setCavernSeeThrough, insideAmount };
})();
