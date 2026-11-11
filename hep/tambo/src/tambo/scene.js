/* Escena, cámara con encuadre adaptable, luces y cielo. */
(function () {
  const { SKY_HORIZON, SKY_ZENITH, LITE } = TAMBO.settings;

const HOME_POSITION = new THREE.Vector3(-14, 30, 62), HOME_TARGET = new THREE.Vector3(2, 5, 0);
const app = SIM.createApp({
  maxPixelRatio: LITE ? 1.5 : 2,
  background: SKY_HORIZON,
  cameraPos: HOME_POSITION,
  target: HOME_TARGET,
  near: 0.3,
  far: 2000,
});
const { scene, camera } = app;
scene.fog = new THREE.Fog(SKY_HORIZON, 95, 430);   // la distancia se difumina como en una cordillera real
app.controls.maxPolarAngle = Math.PI * 0.49;
app.controls.minDistance = 3;
app.controls.maxDistance = 230;

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
  const offset = camera.position.clone().sub(app.controls.target).multiplyScalar(distance / fitDistance);
  camera.position.copy(app.controls.target).add(offset);
  fitDistance = distance;
}
fitCamera();
window.addEventListener('resize', fitCamera);
scene.add(new THREE.HemisphereLight(0xc9dcff, 0x3b2f22, 0.62));
const sunL = new THREE.DirectionalLight(0xffe2b8, 0.72);
sunL.position.set(-40, 50, 30);
scene.add(sunL);

// Cielo: degradado suave del horizonte al cenit
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uH: { value: new THREE.Color(SKY_HORIZON) }, uZ: { value: new THREE.Color(SKY_ZENITH) } },
  vertexShader: 'varying float vH; void main() { vH = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 uH, uZ; varying float vH; void main() { gl_FragColor = vec4(mix(uH, uZ, smoothstep(0.0, 0.45, vH)), 1.0); }',
}));
sky.renderOrder = -1;
scene.add(sky);

// Vista inicial, ajustada al tamaño actual de la pantalla
function homeView() {
  const position = HOME_POSITION.clone().sub(HOME_TARGET).multiplyScalar(fitDistance).add(HOME_TARGET);
  return { position, target: HOME_TARGET.clone() };
}

TAMBO.scene = { app, scene, camera, homeView, viewScale: () => fitDistance };
})();
