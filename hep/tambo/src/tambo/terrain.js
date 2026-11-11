/* Relieve del valle y la cordillera, y el río. */
(function () {
  const { SKY_HORIZON, LITE } = TAMBO.settings;
  const { app, scene, camera } = TAMBO.scene;

/* ---------- Relieve: el valle en el centro y una cordillera alrededor ---------- */
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// El río serpentea; lejos de los detectores describe curvas más amplias
const axis = (z) => 3 * Math.sin(z / 18) + 22 * smooth(45, 220, Math.abs(z)) * Math.sin(z / 75);
// Volcanes nevados en el horizonte: [x, z, altura, radio]
const VOLCANOES = [[35, -310, 62, 72], [-185, -255, 50, 60], [265, -205, 54, 62], [-270, 90, 46, 58], [240, 240, 48, 60]];
function height(x, z) {
  const X = x - axis(z), d = Math.abs(X);
  const H = X < 0 ? 17 : 15;
  const base = H * (1 - Math.exp(-Math.pow(d / 14, 1.6)));
  const rough = 1.8 * SIM.fbm(x / 11 + 5, 0.3, z / 11, 5) * Math.min(1, d / 5);
  const ridges = 1.2 * Math.abs(SIM.noise3(x / 6, 1.7, z / 6)) * Math.min(1, d / 8);
  let y = base + rough + ridges - 0.4;
  // Más allá de los bordes del valle se levantan crestas cada vez mayores
  const w = smooth(30, 110, d);
  if (w > 0) {
    let crest = 0, amp = 1, f = 1 / 62;
    for (let o = 0; o < 4; o++) { crest += amp * (1 - Math.abs(SIM.noise3(x * f + 9, 4.1 + o, z * f - 3))); amp *= 0.5; f *= 2.1; }
    y += w * 32 * Math.pow(crest / 1.875, 2.2);
  }
  for (const [vx, vz, vh, vr] of VOLCANOES) {
    const r = Math.hypot(x - vx, z - vz);
    if (r < vr * 3) y += vh * Math.exp(-Math.pow(r / vr, 1.4));
  }
  return y;
}
// Malla con más detalle en el centro y celdas más grandes hacia el horizonte
const TW = 800, TD = 800, GRID_X = LITE ? 280 : 420, GRID_Z = LITE ? 250 : 380;
const warp = (u, L, n) => { const a = 0.5 / (L * 2 / n); return L * (a * u + (1 - a) * Math.sign(u) * Math.pow(Math.abs(u), 5)); };
const tGeo = new THREE.PlaneGeometry(2, 2, GRID_X, GRID_Z);
tGeo.rotateX(-Math.PI / 2);
const tp = tGeo.attributes.position;
const cols = new Float32Array(tp.count * 3);
for (let i = 0; i < tp.count; i++) {
  const x = warp(tp.getX(i), TW / 2, GRID_X), z = warp(tp.getZ(i), TD / 2, GRID_Z);
  tp.setXYZ(i, x, height(x, z), z);
}
tGeo.computeVertexNormals();
const nrm = tGeo.attributes.normal;
const cLow = new THREE.Color(0x66803f), cPuna = new THREE.Color(0x8b8a5e), cRock = new THREE.Color(0x85694f),
  cHigh = new THREE.Color(0x8d8880), cSnow = new THREE.Color(0xf4f6f8), c = new THREE.Color();
for (let i = 0; i < tp.count; i++) {
  const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), steep = 1 - nrm.getY(i);
  const patch = SIM.noise3(x / 18, 3.3, z / 18), grain = 0.05 * SIM.noise3(x * 0.8, 0, z * 0.8);
  c.copy(cLow).lerp(cPuna, smooth(1.5, 8, y + 3 * patch));
  c.lerp(cRock, smooth(0.06, 0.26, steep));
  c.lerp(cHigh, smooth(24, 38, y));
  c.lerp(cSnow, smooth(40, 50, y + 6 * patch) * (1 - 0.6 * smooth(0.3, 0.55, steep)));
  cols.set([c.r + grain, c.g + grain, c.b + grain], i * 3);
}
tGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
// El terreno solo es transparente cuando se activa la opción: si lo fuera siempre, se ordenaría
// por distancia junto con el cono y, según el ángulo, se pintaría encima de él.
const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true, opacity: 1 });
// Curvas de nivel discretas y bordes del mapa que se funden con el horizonte
// Opacidad de cada ladera: a la izquierda del río, la montaña que atraviesa el neutrino;
// a la derecha, la de los detectores
const rockUniforms = { uRockSource: { value: 1 }, uRockDetectors: { value: 1 } };
terrainMat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, rockUniforms);
  sh.uniforms.uEdgeColor = { value: new THREE.Color(SKY_HORIZON) };
  sh.uniforms.uHalf = { value: new THREE.Vector2(TW / 2, TD / 2) };
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vTerrainPos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTerrainPos = position;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vTerrainPos;\nuniform vec3 uEdgeColor;\nuniform vec2 uHalf;\nuniform float uRockSource, uRockDetectors;\nfloat riverAxis(float z) { float t = clamp((abs(z) - 45.0) / 175.0, 0.0, 1.0); t = t * t * (3.0 - 2.0 * t); return 3.0 * sin(z / 18.0) + 22.0 * t * sin(z / 75.0); }')
    .replace('#include <fog_fragment>', `
      float cf = vTerrainPos.y / 2.0, cw = fwidth(cf);
      float cl = (1.0 - min(abs(fract(cf - 0.5) - 0.5) / max(cw, 1e-4), 1.0)) * (1.0 - smoothstep(0.03, 0.12, cw));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.72, cl * 0.55);
      #include <fog_fragment>
      vec2 ed = uHalf - abs(vTerrainPos.xz);
      gl_FragColor.rgb = mix(uEdgeColor, gl_FragColor.rgb, smoothstep(0.0, 60.0, min(ed.x, ed.y)));
      // Cada ladera con su opacidad; el cambio es suave a lo largo del río
      gl_FragColor.a *= mix(uRockSource, uRockDetectors, smoothstep(-2.0, 2.0, vTerrainPos.x - riverAxis(vTerrainPos.z)));`);
};
const terrain = new THREE.Mesh(tGeo, terrainMat);
terrain.frustumCulled = false;
scene.add(terrain);

// Río
const RIVER_W = 0.18, riverPos = [], riverIdx = [];
for (let z = -TD / 2, k = 0; z <= TD / 2; z += 0.5, k++) {
  for (const sgn of [-1, 1]) { const x = axis(z) + sgn * RIVER_W; riverPos.push(x, height(x, z) + 0.12, z); }
  if (k) { const a = 2 * k; riverIdx.push(a - 2, a, a - 1, a - 1, a, a + 1); }
}
const riverGeo = new THREE.BufferGeometry();
riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPos, 3));
riverGeo.setIndex(riverIdx);
scene.add(new THREE.Mesh(riverGeo, new THREE.MeshBasicMaterial({ color: 0x5aa6d8, side: THREE.DoubleSide })));

function inRock(p) { return p.y < height(p.x, p.z); }

// Roca translúcida. En el tour se dibuja después de las partículas, para que lo subterráneo se vea
// a través de ella. Esta primera pasada solo marca la capa más cercana del terreno, así las laderas
// no se acumulan unas sobre otras y la roca no se ve turbia.
const terrainDepth = new THREE.Mesh(tGeo, new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
terrainDepth.frustumCulled = false;
terrainDepth.renderOrder = 3;
terrainDepth.visible = false;
scene.add(terrainDepth);

// Interior de la tierra: lo que se ve a través de la roca translúcida. Sin esto se vería el cielo
// y la roca quedaría gris y lavada.
const rockInterior = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshBasicMaterial({ color: 0x33271e }));
rockInterior.rotation.x = -Math.PI / 2;
rockInterior.position.y = -30;
rockInterior.frustumCulled = false;
rockInterior.visible = false;
scene.add(rockInterior);

let tourView = false, manualView = false, tourAmount = 0;
function applyRockView() {
  const manual = manualView ? 0.55 : 1;
  const fade = (target) => Math.min(manual, 1 + (target - 1) * tourAmount);
  rockUniforms.uRockSource.value = fade(CONFIG.rocaOpacidadOrigen);
  rockUniforms.uRockDetectors.value = fade(CONFIG.rocaOpacidadDetectores);
  const layered = tourAmount > 0;
  const transparent = Math.min(rockUniforms.uRockSource.value, rockUniforms.uRockDetectors.value) < 1;
  if (terrainMat.transparent !== transparent) { terrainMat.transparent = transparent; terrainMat.needsUpdate = true; }
  terrainMat.depthWrite = !(transparent && (layered || manualView));
  terrain.renderOrder = layered ? 3.1 : 0;
  terrainDepth.visible = layered;
  rockInterior.visible = layered;
}
// Del tour: la roca se aclara u opaca suavemente
function setTourRockView(on) { tourView = on; }
// De la tecla T
function setManualRockView(on) { manualView = on; applyRockView(); }
app.onUpdate((dt, raw) => {
  const goal = tourView ? 1 : 0;
  if (tourAmount === goal) return;
  tourAmount = goal > tourAmount ? Math.min(1, tourAmount + raw / 0.6) : Math.max(0, tourAmount - raw / 0.6);
  applyRockView();
});

// La cámara no puede meterse bajo el terreno: desde abajo la montaña desaparece
app.onUpdate(() => {
  camera.position.y = Math.max(camera.position.y, height(camera.position.x, camera.position.z) + 1.5);
});

TAMBO.terrain = { smooth, axis, height, inRock, terrainMat, rockUniforms, setTourRockView, setManualRockView };
})();
