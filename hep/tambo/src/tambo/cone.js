/* Envolvente de la cascada: un cono ajustado al terreno. */
(function () {
  const { CONE_OPACITY, CONE_GHOST, CONE_REST } = TAMBO.settings;
  const { scene } = TAMBO.scene;

// Envolvente de la cascada: un cono que crece con el frente de partículas. Se dibuja dos veces:
// con normalidad y, más tenue, a través de la montaña, para que se vea desde cualquier ángulo.
// Cada generatriz (línea del vértice al borde) termina donde toca el terreno, no en un corte plano.
const CONE_COLS = 96;
const envGeo = new THREE.BufferGeometry();
const envPos = new THREE.BufferAttribute(new Float32Array((CONE_COLS + 1) * 6), 3).setUsage(THREE.DynamicDrawUsage);
const envNrm = new THREE.BufferAttribute(new Float32Array((CONE_COLS + 1) * 6), 3);
const envEnd = new Float32Array((CONE_COLS + 1) * 2);
const envIdx = [];
for (let k = 0; k <= CONE_COLS; k++) {
  envEnd[2 * k + 1] = 1;   // 0 = vértice, 1 = extremo de la generatriz
  if (k < CONE_COLS) { const a = 2 * k; envIdx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
}
envGeo.setAttribute('position', envPos);
envGeo.setAttribute('normal', envNrm);
envGeo.setAttribute('aEnd', new THREE.BufferAttribute(envEnd, 1));
envGeo.setIndex(envIdx);
const envOpacity = { value: CONE_OPACITY };
function coneMaterial(gain, depthTest) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest, side: THREE.DoubleSide, fog: false,
    uniforms: { uOpacity: envOpacity, uGain: { value: gain } },
    vertexShader: `
      attribute float aEnd;
      varying float vU; varying vec3 vN, vV;
      void main() {
        vU = aEnd;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity, uGain;
      varying float vU; varying vec3 vN, vV;
      void main() {
        float f = abs(dot(normalize(vN), normalize(vV)));
        // Núcleo suave y borde marcado se complementan: siempre queda algo visible, también mirando por el eje
        float shape = 0.55 * pow(f, 1.5) + 0.75 * pow(1.0 - f, 3.0);
        float along = smoothstep(0.0, 0.05, vU) * (1.0 - smoothstep(0.93, 1.0, vU));
        vec3 col = mix(vec3(1.0, 0.92, 0.68), vec3(1.0, 0.56, 0.22), smoothstep(0.0, 0.7, vU));
        gl_FragColor = vec4(col, min(1.0, uOpacity * uGain * shape * along));
      }`,
  });
}
const envelope = new THREE.Mesh(envGeo, coneMaterial(1, true));
const envGhost = new THREE.Mesh(envGeo, coneMaterial(CONE_GHOST, false));
envelope.renderOrder = 4; envGhost.renderOrder = 5;
envelope.frustumCulled = envGhost.frustumCulled = false;
envelope.visible = envGhost.visible = false;
scene.add(envelope, envGhost);

// Muestra el cono en el punto de decaimiento, con la forma calculada para este evento
function showCone(D, cols) {
  envOpacity.value = CONE_OPACITY;
  for (const m of [envelope, envGhost]) {
    m.visible = true;
    m.position.copy(D);
  }
  for (let k = 0; k <= CONE_COLS; k++) {
    const c = cols[k % CONE_COLS];
    envNrm.setXYZ(2 * k, c.n.x, c.n.y, c.n.z);
    envNrm.setXYZ(2 * k + 1, c.n.x, c.n.y, c.n.z);
  }
  envNrm.needsUpdate = true;
  setConeFront(cols, 0.05);
}

function hideCone() { envelope.visible = envGhost.visible = false; }

// El cono crece con el frente de partículas sin pasar del terreno
function setConeFront(cols, front) {
  for (let k = 0; k <= CONE_COLS; k++) {
    const c = cols[k % CONE_COLS], s = Math.min(front, c.L);
    envPos.setXYZ(2 * k + 1, c.d.x * s, c.d.y * s, c.d.z * s);
  }
  envPos.needsUpdate = true;
}

// Al terminar, se atenúa sin desaparecer del todo
function fadeCone(dt) { envOpacity.value = Math.max(CONE_OPACITY * CONE_REST, envOpacity.value - dt * 0.15); }

TAMBO.cone = { CONE_COLS, envelope, showCone, hideCone, setConeFront, fadeCone };
})();
