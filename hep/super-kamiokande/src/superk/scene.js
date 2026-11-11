/* Escena, cámara con encuadre adaptable, luces, cielo y ambiente (montaña o caverna). */
(function () {
  const { SKY_HORIZON, SKY_ZENITH, CAVE_DARK, LITE } = SUPERK.settings;

const HOME_POSITION = new THREE.Vector3(50, 20, 56), HOME_TARGET = new THREE.Vector3(0, -2, 0);
const app = SIM.createApp({
  maxPixelRatio: LITE ? 1.5 : 2,
  background: CAVE_DARK,
  cameraPos: HOME_POSITION,
  target: HOME_TARGET,
  near: 0.1,
  far: 60000,
});
const { scene, camera, controls } = app;
scene.fog = new THREE.Fog(CAVE_DARK, 130, 420);
controls.minDistance = 2;
controls.maxDistance = 90;   // dentro de la caverna; en el tour se amplía para ver la montaña

// Encuadre adaptable: en pantallas verticales se abre el ángulo y, si no basta, la cámara se aleja
const BASE_FOV = 45, MAX_FOV = 62, FIT_ASPECT = 1.1;   // por debajo de FIT_ASPECT se ajusta el encuadre
let fitDistance = 1;
function fitCamera() {
  const halfTan = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2));
  const wanted = halfTan * Math.max(1, FIT_ASPECT / camera.aspect);
  const fov = Math.min(MAX_FOV, THREE.MathUtils.radToDeg(2 * Math.atan(wanted)));
  const distance = wanted / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  camera.fov = fov;
  camera.updateProjectionMatrix();
  // Conserva el zoom que haya elegido el usuario: solo aplica el cambio relativo
  const offset = camera.position.clone().sub(controls.target).multiplyScalar(distance / fitDistance);
  camera.position.copy(controls.target).add(offset);
  fitDistance = distance;
}
fitCamera();
window.addEventListener('resize', fitCamera);

scene.add(new THREE.HemisphereLight(0xc9dcff, 0x3b2f22, 0.6));
const sunL = new THREE.DirectionalLight(0xffe8c8, 0.75);
sunL.position.set(-0.5, 0.7, 0.4);
scene.add(sunL);

// Cielo: degradado del horizonte al cenit. Bajo tierra (o mirando hacia abajo) todo es roca oscura.
const skyU = { uH: { value: new THREE.Color(SKY_HORIZON) }, uZ: { value: new THREE.Color(SKY_ZENITH) }, uDark: { value: new THREE.Color(CAVE_DARK) }, uOutside: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(50000, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: 'varying float vH; void main() { vH = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 uH, uZ, uDark; uniform float uOutside; varying float vH;
    void main() {
      vec3 c = mix(uH, uZ, smoothstep(0.0, 0.45, vH));
      c = mix(c, uDark, smoothstep(-0.02, -0.25, vH));   // bajo el horizonte: el interior de la Tierra
      gl_FragColor = vec4(mix(uDark, c, uOutside), 1.0);
    }`,
}));
sky.renderOrder = -1;
sky.frustumCulled = false;
scene.add(sky);

// Ambiente según dónde esté la cámara: al aire libre (cielo, niebla lejana) o bajo tierra (oscuro)
const fogOut = new THREE.Color(SKY_HORIZON), fogIn = new THREE.Color(CAVE_DARK);
let outside = 0;
function setOutside(v) {
  outside = v;
  skyU.uOutside.value = v;
  scene.fog.color.copy(fogIn).lerp(fogOut, v);
  scene.fog.near = 130 + (4000 - 130) * v;
  scene.fog.far = 420 + (26000 - 420) * v;
  sky.position.copy(camera.position);
}

// El plano cercano se ajusta a la distancia: precisión de profundidad tanto en el tanque como en la montaña
app.onFrame(() => {
  const near = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) / 400, 0.05, 15);
  if (Math.abs(near - camera.near) > camera.near * 0.1) { camera.near = near; camera.updateProjectionMatrix(); }
  sky.position.copy(camera.position);
});

// Vista inicial, ajustada al tamaño actual de la pantalla
function homeView() {
  const position = HOME_POSITION.clone().sub(HOME_TARGET).multiplyScalar(fitDistance).add(HOME_TARGET);
  return { position, target: HOME_TARGET.clone() };
}

SUPERK.scene = { app, scene, camera, homeView, viewScale: () => fitDistance, setOutside, get outside() { return outside; } };
})();
