/* Árboles minimalistas. */
(function () {
  const { LITE } = TAMBO.settings;
  const { scene } = TAMBO.scene;
  const { smooth, axis, height } = TAMBO.terrain;

(function plantTrees() {
  let seed = 4242;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const conifers = [], rounds = [], RANGE = 150, MAX_TREES = LITE ? 2200 : 5000;
  for (let t = 0; t < 40000 && conifers.length + rounds.length < MAX_TREES; t++) {
    const px = rnd() * 2 - 1, pz = rnd() * 2 - 1;    // más densidad cerca del centro de la escena
    const x = Math.sign(px) * Math.pow(Math.abs(px), 1.5) * RANGE, z = Math.sign(pz) * Math.pow(Math.abs(pz), 1.5) * RANGE;
    const X = x - axis(z);
    if (Math.abs(X) < 1.2) continue;                                  // no sobre el río
    if (X > 2.5 && X < 28 && Math.abs(z) < 33) continue;              // la zona de detectores queda despejada
    const y = height(x, z);
    if (y > 27) continue;                                             // límite de los árboles
    if (Math.hypot(height(x + 0.5, z) - y, height(x, z + 0.5) - y) > 0.42) continue;   // ni en pendientes fuertes
    if (SIM.fbm(x / 22, 2.2, z / 22, 3) + 0.25 * (1 - smooth(1, 8, y)) < 0.03) continue;   // forman bosquetes
    (rnd() < 0.62 ? conifers : rounds).push({ x, y, z, s: 0.55 + 0.5 * rnd(), g: rnd() });
  }
  const dark = new THREE.Color(0x35593a), light = new THREE.Color(0x6e8a45), trunkCol = new THREE.Color(0x5a4636), tint = new THREE.Color();
  const mat = new THREE.MeshLambertMaterial({ flatShading: true });
  const m = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  function forest(geo, list, useTrunkColor) {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((t, i) => {
      pos.set(t.x, t.y - 0.05, t.z); sv.set(t.s, t.s * (0.9 + 0.3 * t.g), t.s);
      m.compose(pos, q, sv);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, useTrunkColor ? trunkCol : tint.copy(dark).lerp(light, t.g));
    });
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
  const coneGeo = new THREE.ConeGeometry(0.34, 1.05, 6); coneGeo.translate(0, 0.72, 0);
  const roundGeo = new THREE.IcosahedronGeometry(0.36, 0); roundGeo.translate(0, 0.62, 0);
  const trunkGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.3, 5); trunkGeo.translate(0, 0.15, 0);
  forest(coneGeo, conifers);
  forest(roundGeo, rounds);
  forest(trunkGeo, conifers.concat(rounds), true);
})();
})();
