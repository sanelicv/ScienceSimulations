/* Tracks: tubos 3D que se quedan como rastro de lo ocurrido, y la marca del choque. */
(function () {
  const {
    NU_COLOR, NU_TRAIL_FROM, NU_TRAIL_TO, LEPTONS,
    TRACK_RADIUS, PARTICLE_RADIUS, PARTICLE_GLOW_SIZE, TRACK_HALO_SIZE, TRACK_HALO_OPACITY, TRACK_GHOST, VERTEX_GLOW_SIZE, VERTEX_GLOW_OPACITY,
  } = SUPERK.settings;
  const { scene } = SUPERK.scene;

// Tamaño aparente: en la vista de la montaña (cámara a kilómetros) los tracks y las esferas se agrandan
// para seguir viéndose; a la distancia de la vista inicial tienen su tamaño normal.
let viewK = 1;

const trackGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 48, true);
trackGeo.translate(0, 0.5, 0);   // de y = 0 (inicio) a y = 1 (punta)
const Y_AXIS = new THREE.Vector3(0, 1, 0);

const TRACK_VERTEX = `
  uniform float uLen, uTaper;
  varying float vS; varying vec3 vN, vV;
  void main() {
    vS = position.y * uLen;
    // El tubo se afina hacia su inicio, como la estela de un cometa
    float thick = mix(uTaper, 1.0, smoothstep(0.0, 1.0, position.y));
    vec4 mv = modelViewMatrix * vec4(position.x * thick, position.y, position.z * thick, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const TRACK_COMMON = `
  uniform float uLen, uHead, uHeadMix, uGhost, uHaloOpacity, uPulse, uUnderRock;
  uniform vec3 uActive, uTrailFrom, uTrailTo, uHighlight;
  uniform vec2 uFade;
  varying float vS; varying vec3 vN, vV;
  float headMask() { return uHeadMix * smoothstep(uLen - uHead, uLen - uHead * 0.25, vS); }
  vec3 bodyColor(float head) { return mix(mix(mix(uTrailFrom, uTrailTo, clamp(vS / uLen, 0.0, 1.0)), uActive, head), uHighlight, uPulse); }
  float startFade() { return smoothstep(uFade.x, uFade.y, vS); }`;

// Esfera con volumen: centro claro y bordes más oscuros
function sphereMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, fog: false,
    uniforms: { uColor: { value: new THREE.Color(color) } },
    vertexShader: `
      varying vec3 vN, vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vN, vV;
      void main() {
        float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
        vec3 col = uColor * (0.55 + 0.45 * ndv) + vec3(0.65 * pow(ndv, 3.0));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}
const SPHERE_GEO = new THREE.SphereGeometry(1, 24, 16);

// Las esferas y su resplandor también respetan la roca en el tour
// Con la roca translúcida, lo que se dibuja antes que ella pasa siempre la prueba de profundidad
// (no lo tapan los fotomultiplicadores de la pared cercana) pero escribe su profundidad, para que
// la roca que esté delante sí lo cubra.
const DEPTH_FUNC = (on) => (on ? THREE.AlwaysDepth : THREE.LessEqualDepth);
function setSphereUnderRock(sphere, on, normalOrder) {
  sphere.material.depthTest = !!on;
  sphere.material.depthWrite = !!on;
  sphere.material.depthFunc = DEPTH_FUNC(on);
  sphere.renderOrder = on ? 2.1 : normalOrder;
  for (const glow of sphere.children) {
    glow.material.depthTest = !!on;
    glow.material.depthFunc = DEPTH_FUNC(on);
    glow.renderOrder = on ? 2.3 : normalOrder - 1;
  }
}

class Track {
  constructor(active, trailFrom, trailTo, radius, headLen, taper) {
    this.radius = radius;
    this.u = {
      uLen: { value: 1 }, uHead: { value: headLen }, uHeadMix: { value: 1 }, uTaper: { value: taper },
      uActive: { value: new THREE.Color(active) },
      uTrailFrom: { value: new THREE.Color(trailFrom) }, uTrailTo: { value: new THREE.Color(trailTo) },
      uFade: { value: new THREE.Vector2(-2, -1) }, uHaloOpacity: { value: TRACK_HALO_OPACITY },
      uPulse: { value: 0 }, uHighlight: { value: new THREE.Color() }, uUnderRock: { value: 0 },
    };
    // El tubo normal, otra pasada que lo deja ver a través de la roca, y un halo suave alrededor
    this.solid = new THREE.Mesh(trackGeo, this.tubeMaterial(1, true));
    this.ghost = new THREE.Mesh(trackGeo, this.tubeMaterial(TRACK_GHOST, false));
    this.halo = new THREE.Mesh(trackGeo, this.haloMaterial());
    this.halo.renderOrder = 5.5; this.solid.renderOrder = 6; this.ghost.renderOrder = 7;
    // La partícula: una esfera en la punta del track, con un resplandor suave
    this.particle = new THREE.Mesh(SPHERE_GEO, sphereMaterial(active));
    this.particle.scale.setScalar(PARTICLE_RADIUS);
    this.headLen = headLen;
    this.particle.renderOrder = 9;
    this.particle.frustumCulled = false;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SIM.glowTexture(), color: active, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
    glow.scale.setScalar(PARTICLE_GLOW_SIZE / PARTICLE_RADIUS);
    glow.renderOrder = 8;
    this.particle.add(glow);
    this.glow = glow;
    this.meshes = [this.solid, this.ghost, this.halo];
    for (const m of this.meshes) { m.frustumCulled = false; scene.add(m); }
    scene.add(this.particle);
    this.hide();
  }
  tubeMaterial(ghostAlpha, depthTest) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest, fog: false,
      uniforms: { ...this.u, uGhost: { value: ghostAlpha } },
      vertexShader: TRACK_VERTEX,
      fragmentShader: TRACK_COMMON + `
        void main() {
          vec3 n = normalize(vN), v = normalize(vV), l = normalize(vec3(-0.4, 0.75, 0.5));
          float ndv = clamp(dot(n, v), 0.0, 1.0), head = headMask();
          float diff = 0.72 + 0.28 * max(dot(n, l), 0.0);
          float spec = pow(max(dot(reflect(-l, n), v), 0.0), 32.0);
          vec3 col = bodyColor(head) * diff;
          col = mix(col, vec3(1.0), pow(ndv, 4.0) * (0.3 + 0.35 * head));   // núcleo luminoso
          col += vec3(0.3 * spec);
          float edge = smoothstep(0.0, 0.42, ndv);                          // bordes suaves
          float alpha = edge * mix(uGhost, 1.0, max(head, uPulse)) * startFade();
          if (uUnderRock > 0.5 && alpha < 0.35) discard;   // los bordes casi invisibles no deben tapar la roca
          gl_FragColor = vec4(col, alpha);
        }`,
    });
  }
  haloMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending,
      uniforms: { ...this.u, uGhost: { value: 1 } },
      vertexShader: TRACK_VERTEX,
      fragmentShader: TRACK_COMMON + `
        void main() {
          float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), head = headMask();
          float a = pow(ndv, 2.4) * uHaloOpacity * (0.6 + 0.4 * head + 1.6 * uPulse) * startFade();
          gl_FragColor = vec4(bodyColor(head), a);
        }`,
    });
  }
  // Tramo visible de a a b. fadeFrom/fadeTo: distancia a la que el inicio aparece suavemente.
  set(a, b, fadeFrom = -2, fadeTo = -1) {
    const d = tmpD.subVectors(b, a), L = d.length();
    if (L < 1e-4) return;
    d.divideScalar(L);
    const r = this.radius * viewK * (0.72 + 0.28 * this.u.uHeadMix.value);
    this.u.uHead.value = this.headLen * viewK;
    for (const m of this.meshes) {
      const w = m === this.halo ? r * TRACK_HALO_SIZE : r;
      m.visible = m !== this.ghost || !this.underRock;
      m.position.copy(a);
      m.quaternion.setFromUnitVectors(Y_AXIS, d);
      m.scale.set(w, L, w);
    }
    this.u.uLen.value = L;
    this.u.uFade.value.set(fadeFrom, fadeTo);
    this.particle.position.copy(b);
    this.particle.scale.setScalar(PARTICLE_RADIUS * viewK);
    this.a = a; this.b = b; this.fadeFrom = fadeFrom; this.fadeTo = fadeTo;
  }
  // Colores de la partícula activa y de su rastro (el leptón cambia de un evento a otro)
  setColors(active, trailFrom, trailTo) {
    this.u.uActive.value.setHex(active);
    this.u.uTrailFrom.value.setHex(trailFrom);
    this.u.uTrailTo.value.setHex(trailTo);
    this.particle.material.uniforms.uColor.value.setHex(active);
    this.glow.material.color.setHex(active);
  }
  // Vuelve a aplicar el tamaño aparente
  refresh() { if (this.a && this.solid.visible) this.set(this.a, this.b, this.fadeFrom, this.fadeTo); }
  // En el tour, el track respeta la roca: se dibuja antes que ella y se ve a través de ella.
  // Fuera del tour, con la roca opaca, se ve encima de la montaña.
  setUnderRock(on) {
    if (this.underRock === !!on) return;
    this.underRock = !!on;
    this.u.uUnderRock.value = on ? 1 : 0;
    this.solid.material.depthWrite = !!on;
    this.solid.material.depthFunc = DEPTH_FUNC(on);
    this.halo.material.depthFunc = DEPTH_FUNC(on);
    this.solid.renderOrder = on ? 2 : 6;
    this.ghost.visible = !on && this.solid.visible;
    this.halo.material.depthTest = !!on;
    this.halo.renderOrder = on ? 2.2 : 5.5;
    setSphereUnderRock(this.particle, on, 9);
  }
  // Resalta el track con un color; con intensidad 0 vuelve a su aspecto normal
  setPulse(amount, color) {
    this.u.uPulse.value = amount;
    if (color) this.u.uHighlight.value.copy(color);
  }
  // La partícula aparece en el punto indicado
  start(at) {
    this.cooling = false;
    this.u.uHeadMix.value = 1;
    this.particle.position.copy(at);
    this.particle.scale.setScalar(PARTICLE_RADIUS * viewK);
    this.particle.visible = true;
  }
  // Deja de ser "lo que está pasando": cambia suavemente al color de rastro
  retire() { this.cooling = true; this.particle.visible = false; }
  update(dt) {
    if (!this.cooling) return;
    this.u.uHeadMix.value = Math.max(0, this.u.uHeadMix.value - dt / 0.7);
    this.set(this.a, this.b, this.fadeFrom, this.fadeTo);
    if (this.u.uHeadMix.value === 0) this.cooling = false;
  }
  hide() { for (const m of this.meshes) m.visible = false; this.particle.visible = false; this.cooling = false; }
}
const tmpD = new THREE.Vector3();

// Marca del punto donde cambia la historia: el choque
function makeVertex(color) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false }));
  m.renderOrder = 9; m.frustumCulled = false; m.visible = false;
  // Resplandor que perdura cuando se apaga el destello inicial
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SIM.glowTexture(), color, transparent: true, opacity: VERTEX_GLOW_OPACITY,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
  glow.scale.setScalar(VERTEX_GLOW_SIZE);
  glow.renderOrder = 8;
  m.add(glow);
  scene.add(m);
  return m;
}
const vHit = makeVertex(NU_COLOR);   // el choque, del color del neutrino

const nuTrack = new Track(NU_COLOR, NU_TRAIL_FROM, NU_TRAIL_TO, TRACK_RADIUS, 16, 0.35);
const lepTrack = new Track(LEPTONS.muon.active, LEPTONS.muon.from, LEPTONS.muon.to, TRACK_RADIUS, 1.5, 0.7);

function setTracksUnderRock(on) {
  nuTrack.setUnderRock(on);
  lepTrack.setUnderRock(on);
  setSphereUnderRock(vHit, on, 9);
}

// Ajusta el tamaño aparente según la distancia de la cámara (k = 1 en la vista inicial)
function setViewScale(k) {
  if (Math.abs(k - viewK) < viewK * 0.01) return;
  viewK = k;
  nuTrack.refresh();
  lepTrack.refresh();
  vHit.scale.setScalar(k);
}

SUPERK.tracks = { nuTrack, lepTrack, vHit, setTracksUnderRock, setViewScale };
})();
