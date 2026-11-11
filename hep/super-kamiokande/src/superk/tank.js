/* El tanque: pared de acero, el contorno del detector interno y la geometría para calcular choques con la pared. */
(function () {
  const { R, HH, R_OUT, HH_OUT } = SUPERK.settings;
  const { scene } = SUPERK.scene;

// Pared exterior: acero, casi transparente para poder ver lo que pasa dentro
const wallMat = new THREE.MeshBasicMaterial({ color: 0x5f86ad, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, fog: false });
const wall = new THREE.Mesh(new THREE.CylinderGeometry(R_OUT, R_OUT, 2 * HH_OUT, 96, 1, true), wallMat);
scene.add(wall);
const lid = new THREE.Mesh(new THREE.CircleGeometry(R_OUT, 96), wallMat);
lid.rotation.x = -Math.PI / 2;
lid.position.y = HH_OUT;
scene.add(lid);

// Contornos: arriba y abajo del tanque, y del detector interno
const ringMat = (opacity) => new THREE.LineBasicMaterial({ color: 0x8fb8e0, transparent: true, opacity, fog: false });
function ring(radius, y, opacity) {
  const pts = Array.from({ length: 161 }, (_, i) => new THREE.Vector3(Math.cos(i / 160 * 2 * Math.PI) * radius, y, Math.sin(i / 160 * 2 * Math.PI) * radius));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat(opacity)));
}
ring(R_OUT, HH_OUT, 0.55); ring(R_OUT, -HH_OUT, 0.55);
ring(R + 0.3, HH + 0.3, 0.3); ring(R + 0.3, -HH - 0.3, 0.3);
// Algunas generatrices verticales: dan volumen al cilindro sin taparlo
const lines = [];
for (let k = 0; k < 24; k++) {
  const a = k / 24 * 2 * Math.PI;
  lines.push(Math.cos(a) * R_OUT, -HH_OUT, Math.sin(a) * R_OUT, Math.cos(a) * R_OUT, HH_OUT, Math.sin(a) * R_OUT);
}
const lg = new THREE.BufferGeometry();
lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
scene.add(new THREE.LineSegments(lg, ringMat(0.12)));

// Distancia desde o (dentro del cilindro) hasta su pared, en la dirección d
function toCylinder(o, d, radius, half) {
  let t = Infinity;
  const a = d.x * d.x + d.z * d.z;
  if (a > 1e-9) {
    const b = o.x * d.x + o.z * d.z, c = o.x * o.x + o.z * o.z - radius * radius;
    t = (-b + Math.sqrt(Math.max(0, b * b - a * c))) / a;
  }
  if (d.y > 1e-9) t = Math.min(t, (half - o.y) / d.y);
  if (d.y < -1e-9) t = Math.min(t, (-half - o.y) / d.y);
  return t;
}
const toWall = (o, d) => toCylinder(o, d, R, HH);              // hasta los fotomultiplicadores
const toOuterWall = (o, d) => toCylinder(o, d, R_OUT, HH_OUT);  // hasta la pared de acero

SUPERK.tank = { toWall, toOuterWall };
})();
