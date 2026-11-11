/* El monte Ikeno y las montañas de alrededor. Solo se ven desde fuera, en el primer paso del tour. */
(function () {
  const { SKY_HORIZON, LITE } = SUPERK.settings;
  const { app, scene, camera } = SUPERK.scene;

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const BASE = 40;                         // fondo de los valles, apenas sobre el tanque (que está en y = 0)
const PEAK = 1000;                       // la cima, unos 1000 m sobre el tanque
// Un río serpentea al pie del monte (como los valles de Kamioka)
const riverAxis = (z) => 2600 + 450 * Math.sin(z / 1500);
function ridged(x, z, oct) {
  let s = 0, a = 1, f = 1, n = 0;
  for (let o = 0; o < oct; o++) { s += a * (1 - Math.abs(SIM.noise3(x * f + 3.1, 7.7 + o, z * f - 1.3))); n += a; a *= 0.5; f *= 2.07; }
  return s / n;
}
function height(x, z) {
  const r = Math.hypot(x, z);
  let h = BASE + (PEAK - BASE) * Math.exp(-Math.pow(r / 1700, 1.5));
  h += 170 * Math.pow(ridged(x / 1100, z / 1100, 4), 2) * smooth(200, 1500, r);       // crestas y quebradas
  h += 1100 * Math.pow(ridged(x / 4200 + 5, z / 4200, 4), 2.4) * smooth(3500, 10000, r);   // cordilleras lejanas
  const d = Math.abs(x - riverAxis(z));
  h = BASE + (h - BASE) * (0.2 + 0.8 * smooth(120, 1100, d));
  return h;
}

// Malla con más detalle en el centro y celdas más grandes hacia el horizonte
const L = 18000, GRID = LITE ? 220 : 340;
const warp = (u) => L * (0.3 * u + 0.7 * Math.sign(u) * u * u);
const geo = new THREE.PlaneGeometry(2, 2, GRID, GRID);
geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = warp(pos.getX(i)), z = warp(pos.getZ(i));
  pos.setXYZ(i, x, height(x, z), z);
}
geo.computeVertexNormals();
const nrm = geo.attributes.normal;
const cols = new Float32Array(pos.count * 3);
// Bosques de Japón: verde en los valles, bosque oscuro en las laderas, roca en lo empinado
const cValley = new THREE.Color(0x5c7d3e), cForest = new THREE.Color(0x36592f), cRock = new THREE.Color(0x77705d),
  cHigh = new THREE.Color(0x8c8a7c), cSnow = new THREE.Color(0xeef1f4), c = new THREE.Color();
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), steep = 1 - nrm.getY(i);
  const patch = SIM.noise3(x / 600, 2.2, z / 600);
  c.copy(cValley).lerp(cForest, smooth(80, 260, y + 80 * patch));
  c.lerp(cRock, smooth(0.28, 0.5, steep) * 0.8);
  c.lerp(cHigh, smooth(1100, 1500, y));
  c.lerp(cSnow, smooth(1700, 2000, y + 150 * patch));
  const g = 0.04 * SIM.noise3(x / 90, 0, z / 90);
  cols.set([c.r + g, c.g + g, c.b + g], i * 3);
}
geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
const rockU = { uRock: { value: 1 } };
mat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, rockU);
  sh.uniforms.uEdgeColor = { value: new THREE.Color(SKY_HORIZON) };
  sh.uniforms.uHalf = { value: L };
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vTerrainPos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTerrainPos = position;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vTerrainPos;\nuniform vec3 uEdgeColor;\nuniform float uHalf, uRock;')
    .replace('#include <fog_fragment>', `
      // Curvas de nivel discretas, cada 100 m
      float cf = vTerrainPos.y / 100.0, cw = fwidth(cf);
      float cl = (1.0 - min(abs(fract(cf - 0.5) - 0.5) / max(cw, 1e-4), 1.0)) * (1.0 - smoothstep(0.03, 0.12, cw));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.75, cl * 0.5);
      #include <fog_fragment>
      vec2 ed = vec2(uHalf) - abs(vTerrainPos.xz);
      gl_FragColor.rgb = mix(uEdgeColor, gl_FragColor.rgb, smoothstep(0.0, 2500.0, min(ed.x, ed.y)));
      gl_FragColor.a *= uRock;`);
};
const mountain = new THREE.Mesh(geo, mat);
mountain.frustumCulled = false;
scene.add(mountain);

// Roca translúcida en el tour: esta pasada marca solo la capa más cercana del terreno, para que las
// laderas no se acumulen unas sobre otras; después se pinta la roca encima de las partículas.
const depthPass = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
depthPass.frustumCulled = false;
depthPass.renderOrder = 3;
depthPass.visible = false;
scene.add(depthPass);

let seeThrough = false, amount = 0;
function apply() {
  const opacity = 1 + (CONFIG.rocaOpacidadMontana - 1) * amount;
  rockU.uRock.value = opacity;
  const transparent = opacity < 1;
  if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true; }
  mat.depthWrite = !transparent;
  mountain.renderOrder = transparent ? 3.1 : 0;
  depthPass.visible = transparent;
}
// Del tour: la montaña se aclara u opaca suavemente
function setMountainSeeThrough(on) { seeThrough = on; }
app.onUpdate((dt, raw) => {
  const goal = seeThrough ? 1 : 0;
  if (amount === goal) return;
  amount = goal > amount ? Math.min(1, amount + raw / 0.6) : Math.max(0, amount - raw / 0.6);
  apply();
});

// Fuera de la montaña, el cielo; bajo tierra, la oscuridad de la roca
app.onFrame(() => {
  const above = camera.position.y - height(camera.position.x, camera.position.z);
  const outside = smooth(-60, 40, above);
  SUPERK.scene.setOutside(outside);
  // Bajo tierra no se dibuja: a través de la roca translúcida se verían laderas desde abajo
  mountain.visible = depthPass.visible = outside > 0.001;
  if (outside <= 0.001) return;
  depthPass.visible = mat.transparent;
});

const peakPoint = new THREE.Vector3(0, height(0, 0) + 60, 0);

SUPERK.mountain = { height, peakPoint, setMountainSeeThrough };
})();
