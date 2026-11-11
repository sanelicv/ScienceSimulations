(function () {
  'use strict';

  const F = window.Fisica;
  const ESCALA_COHETE = window.CONFIG.ESCALA_COHETE;
  const ESCALA_NODRIZA = window.CONFIG.ESCALA_NODRIZA;
  const COLA_NAVE = 1.6 * ESCALA_COHETE;
  const PUNTA_NAVE = 1.65 * ESCALA_COHETE;
  const R_MUNDO = 40; // radio de la zona visible, en unidades de escena
  const ZONA_MIN_KM = 400;
  const TAMANO_MAX = 30; // radio máximo del cuerpo en pantalla, en unidades de escena
  const N_PARTICULAS = 3500;
  const CELDA_RETICULA = 10;
  const SUBDIVISIONES = 10;
  const MAX_RAYOS = 480;
  // Lo que se aleja sigue su camino: la luz se apaga poco a poco y la nave se reduce con la distancia
  const DESVANECE_LUZ_DESDE = 600;
  const DESVANECE_LUZ_HASTA = 6000;
  const R_LEJOS_NAVE = 20000;
  const TRAZA = 140;
  const TIEMPO_MAX = 40;
  const G_TIERRA = 9.80665; // m/s²

  const est = {
    masa: 20, // M☉
    radioKm: 10,
    pausa: false,
    camaraDentro: false, // la cámara cruzó el horizonte
    rapidez: 1,
    distancia: 0.54, // posición del observador en su control, de 0 a 1
    beta: 0.6,
    // Derivados, ver calcularCuerpo()
    tipo: 'agujero',
    rsKm: 0,
    zonaKm: 0,
    kmPorU: 1,
    rs: 0,
    frontera: 0,
    rAbsorcion: 0,
  };

  const $ = (id) => document.getElementById(id);

  // Los navegadores pueden restaurar los controles al recargar; siempre se parte de los valores del HTML
  document.querySelectorAll('input').forEach(function (control) {
    if (control.type === 'checkbox') control.checked = control.defaultChecked;
    else control.value = control.defaultValue;
  });

  // Punto decimal; los miles se separan con un espacio fino para no confundirlos con decimales
  const conPunto = (x, opciones) => x.toLocaleString('en-US', opciones).replace(/,/g, '\u202f');
  const num = (x, d) => conPunto(x, { minimumFractionDigits: d, maximumFractionDigits: d });
  const sig = (x, n) => conPunto(x, { maximumSignificantDigits: n });
  // Acepta también una coma al escribir un valor
  const leerNumero = (texto) => parseFloat(texto.replace(',', '.'));

  // Radio de la zona visible para un cuerpo de tamaño L. Hasta cierto L la escala es fija;
  // después el cuerpo sigue creciendo en pantalla, cada vez más lento, para que siempre se
  // note un cambio de radio aunque abarque de km a millones de km.
  function zonaVisibleKm(L) {
    const umbral = ZONA_MIN_KM / 6;
    if (L <= umbral) return ZONA_MIN_KM;
    const tamano = Math.min(TAMANO_MAX, (R_MUNDO / 6) + 3.67 * Math.log10(L / umbral));
    return (L * R_MUNDO) / tamano;
  }

  // Clasifica el cuerpo: agujero negro si R <= rs, astro si R > rs, vacío sin masa.
  function calcularCuerpo() {
    est.rsKm = F.radioSchwarzschildKm(est.masa);
    est.zonaKm = zonaVisibleKm(Math.max(est.radioKm, F.radioSchwarzschildKm(est.masa)));
    est.kmPorU = est.zonaKm / R_MUNDO;
    est.rs = est.rsKm / est.kmPorU;
    const rCuerpo = est.radioKm / est.kmPorU;
    if (est.masa <= 0) {
      est.tipo = 'vacio';
      est.frontera = 0;
      est.rAbsorcion = 0;
    } else if (est.radioKm <= est.rsKm) {
      est.tipo = 'agujero';
      est.frontera = est.rs;
      est.rAbsorcion = 0.1 * est.rs;
    } else {
      est.tipo = 'astro';
      est.frontera = rCuerpo;
      est.rAbsorcion = rCuerpo;
    }
  }
  calcularCuerpo();

  // ---------- Escena ----------

  const contenedor = $('escena');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    $('error-webgl').hidden = false;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  contenedor.prepend(renderer.domElement);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x05070f);
  const camara = new THREE.PerspectiveCamera(50, 1, 0.5, 40000);
  camara.position.set(32, 24, 76);
  const controles = new THREE.OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.minDistance = 4;
  controles.maxDistance = 200;

  function texturaBrillo(color) {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = 64;
    const g = lienzo.getContext('2d');
    const degradado = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    degradado.addColorStop(0, color);
    degradado.addColorStop(0.25, color);
    degradado.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = degradado;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(lienzo);
  }

  function lineasAditivas(flotantes, conColor) {
    const geo = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(new Float32Array(flotantes), 3);
    pos.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', pos);
    if (conColor) {
      const col = new THREE.BufferAttribute(new Float32Array(flotantes), 3);
      col.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('color', col);
    }
    const mat = new THREE.LineBasicMaterial({
      vertexColors: conColor,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lineas = new THREE.LineSegments(geo, mat);
    lineas.frustumCulled = false;
    escena.add(lineas);
    return lineas;
  }

  // Rampa divergente centrada en c: azul por debajo, blanco en c, rojo por encima.
  const PARADAS = [
    [0, 0.16, 0.32, 0.62],
    [0.5, 0.25, 0.7, 0.95],
    [1, 1, 1, 1],
    [1.5, 1, 0.55, 0.25],
    [2, 1, 0.15, 0.25],
  ];
  const TABLA = new Float32Array(3 * 129);
  for (let i = 0; i <= 128; i++) {
    const v = (i / 128) * 2;
    let j = 0;
    while (j < PARADAS.length - 2 && v > PARADAS[j + 1][0]) j++;
    const a = PARADAS[j], b = PARADAS[j + 1];
    const t = (v - a[0]) / (b[0] - a[0]);
    for (let k = 0; k < 3; k++) TABLA[3 * i + k] = a[k + 1] + t * (b[k + 1] - a[k + 1]);
  }
  const indiceColor = (v) => 3 * Math.min(128, Math.floor(v * 64));

  // Estrellas de fondo, para orientarse al girar
  (function () {
    const n = 1400, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = 2 * Math.random() - 1, a = Math.random() * 2 * Math.PI, s = Math.sqrt(1 - u * u), R = 25000 + Math.random() * 10000;
      pos[3 * i] = R * s * Math.cos(a);
      pos[3 * i + 1] = R * u;
      pos[3 * i + 2] = R * s * Math.sin(a);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    escena.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8c9ac0, size: 1.1, sizeAttenuation: false })));
  })();

  // ---------- Cuerpo central: singularidad y horizonte, o astro con superficie ----------

  const singularidad = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  singularidad.renderOrder = 2;
  escena.add(singularidad);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texturaBrillo('rgba(255,180,90,0.75)'),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  }));
  halo.renderOrder = 2;
  escena.add(halo);

  const VERTICE_ESFERA =
    'varying vec3 vN; varying vec3 vV;' +
    'void main(){ vec4 p = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-p.xyz); gl_Position = projectionMatrix*p; }';

  const horizonte = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: { uTranslucido: { value: 0 } },
      vertexShader: VERTICE_ESFERA,
      fragmentShader:
        'uniform float uTranslucido; varying vec3 vN; varying vec3 vV;' +
        'void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);' +
        ' gl_FragColor = vec4(vec3(1.0,0.95,0.85) * f * mix(0.3, 1.0, uTranslucido), mix(1.0, 0.86 + 0.14*f, uTranslucido)); }',
    })
  );
  horizonte.renderOrder = 1;
  escena.add(horizonte);

  // Superficie opaca: la retícula y la corriente terminan en ella
  const astro = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    new THREE.ShaderMaterial({
      vertexShader: VERTICE_ESFERA,
      fragmentShader:
        'varying vec3 vN; varying vec3 vV;' +
        'void main(){ float f = abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(mix(vec3(0.72,0.28,0.08), vec3(1.0,0.86,0.58), pow(f, 0.6)), 1.0); }',
    })
  );
  escena.add(astro);

  function actualizarCuerpoVisual() {
    const rs = est.rs;
    const esAgujero = est.tipo === 'agujero', esAstro = est.tipo === 'astro';
    const translucido = $('v-translucido').checked;
    horizonte.visible = esAgujero;
    // Opaco, el horizonte tapa por sí solo lo que cae adentro, como en un agujero negro real
    horizonte.material.transparent = translucido;
    horizonte.material.depthWrite = !translucido;
    horizonte.material.uniforms.uTranslucido.value = translucido ? 1 : 0;
    // Desde adentro del horizonte la singularidad siempre está a la vista
    singularidad.visible = esAgujero && (translucido || est.camaraDentro);
    astro.visible = esAstro;
    halo.visible = singularidad.visible || esAstro;
    if (!esAgujero && !esAstro) controles.minDistance = 1;
    if (esAgujero) {
      horizonte.scale.setScalar(rs);
      // Tamaño simbólico, pero siempre dentro del horizonte aunque este sea muy pequeño
      const radioSingularidad = Math.max(0.01 * rs, Math.min(0.02, 0.05 * rs));
      singularidad.scale.setScalar(radioSingularidad);
      halo.scale.setScalar(Math.max(0.7 * rs, Math.min(0.5, 1.5 * rs)));
      controles.minDistance = 6 * radioSingularidad;
    } else if (esAstro) {
      astro.scale.setScalar(est.frontera);
      halo.scale.setScalar(2.8 * est.frontera);
      controles.minDistance = 1.15 * est.frontera;
    }
  }

  // ---------- Retícula de espacio ----------
  //
  // Cada vértice cae con dr/dt = -c√(rs/r), cuya solución es s = s0 - kt con s = r^(3/2).
  // La retícula es cartesiana al nacer y cae durante un tiempo acotado; su deformación
  // k·edad crece con la masa y se anula con M = 0. Las generaciones se relevan con un frente
  // que barre desde el borde hasta el centro: la nueva se ve por fuera y la vieja por dentro,
  // de modo que lo más deformado siempre queda más cerca de la masa.

  const S_BORDE = Math.pow(R_MUNDO, 1.5);
  const S_FRENTE = 0.15 * S_BORDE; // medio ancho de la franja donde se funden dos generaciones
  const PERIODO_RETICULA = 8.7;
  const GENERACIONES = 3;
  let edadReticula = 0;

  const K_MAX_RETICULA = 1.5 * F.C * Math.sqrt(TAMANO_MAX); // rs nunca pasa de TAMANO_MAX

  const geometriaReticula = (function () {
    const rFuera = Math.pow(S_BORDE + K_MAX_RETICULA * PERIODO_RETICULA + S_FRENTE, 2 / 3);
    const n = Math.ceil(rFuera / CELDA_RETICULA);
    const paso = CELDA_RETICULA / SUBDIVISIONES;
    const dentro = (x, y, z) => x * x + y * y + z * z <= rFuera * rFuera;
    const pos = [];
    const agregar = (x, y, z, dx, dy, dz) => {
      const xf = x + dx, yf = y + dy, zf = z + dz;
      if (dentro(x, y, z) && dentro(xf, yf, zf)) pos.push(x, y, z, xf, yf, zf);
    };
    const celda = (i) => (i + 0.5) * CELDA_RETICULA; // desplazada para no pasar por el centro
    const total = (2 * n) * SUBDIVISIONES;
    for (let i = -n; i < n; i++) {
      for (let j = -n; j < n; j++) {
        const a = celda(i), b = celda(j);
        for (let k = 0; k < total; k++) {
          const t = -n * CELDA_RETICULA + k * paso;
          agregar(t, a, b, paso, 0, 0);
          agregar(a, t, b, 0, paso, 0);
          agregar(a, b, t, 0, 0, paso);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    return geo;
  })();

  const VERTICE_RETICULA = `
    uniform float uDesplazamiento;
    uniform float uRs;
    uniform float uRMundo;
    uniform float uCorte;
    uniform float uFrente;
    uniform float uAnchoFrente;
    uniform float uPorFuera;
    varying vec3 vColor;
    varying float vBrillo;

    vec3 rampa(float v) {
      if (v < 0.5) return mix(vec3(0.16, 0.32, 0.62), vec3(0.25, 0.7, 0.95), v / 0.5);
      if (v < 1.0) return mix(vec3(0.25, 0.7, 0.95), vec3(1.0), (v - 0.5) / 0.5);
      if (v < 1.5) return mix(vec3(1.0), vec3(1.0, 0.55, 0.25), (v - 1.0) / 0.5);
      return mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.15, 0.25), clamp((v - 1.5) / 0.5, 0.0, 1.0));
    }

    void main() {
      float R = length(position);
      float s = pow(R, 1.5) - uDesplazamiento;
      float r = s > 0.0 ? pow(s, 2.0 / 3.0) : 0.0;
      vec3 p = position / R * r;
      vec4 enCamara = modelViewMatrix * vec4(p, 1.0);

      float frente = smoothstep(uFrente - uAnchoFrente, uFrente + uAnchoFrente, s);
      float fundido = uPorFuera > 0.5 ? frente : 1.0 - frente;
      float borde = 1.0 - smoothstep(0.82 * uRMundo, uRMundo, r);
      float centro = smoothstep(uCorte, 3.5 * uCorte + 0.001, r);
      float profundidad = mix(1.0, 0.15, smoothstep(50.0, 115.0, -enCamara.z));
      // Donde la caída comprime las líneas se atenúan, para que no saturen a blanco
      float densidad = mix(0.3, 1.0, r / R);

      vColor = rampa(sqrt(uRs / max(r, 0.001)));
      vBrillo = fundido * borde * centro * profundidad * densidad;
      gl_Position = projectionMatrix * enCamara;
    }
  `;

  const FRAGMENTO_RETICULA = `
    uniform float uOpacidad;
    varying vec3 vColor;
    varying float vBrillo;
    void main() {
      gl_FragColor = vec4(vColor * vBrillo * uOpacidad, 1.0);
    }
  `;

  const reticula = [];
  for (let g = 0; g < GENERACIONES; g++) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uDesplazamiento: { value: 0 },
        uRs: { value: est.rs },
        uRMundo: { value: R_MUNDO },
        uCorte: { value: 0 },
        uFrente: { value: 0 },
        uAnchoFrente: { value: S_FRENTE },
        uPorFuera: { value: 1 },
        uOpacidad: { value: parseFloat($('opacidad').value) },
      },
      vertexShader: VERTICE_RETICULA,
      fragmentShader: FRAGMENTO_RETICULA,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lineas = new THREE.LineSegments(geometriaReticula, material);
    lineas.frustumCulled = false;
    escena.add(lineas);
    reticula.push(lineas);
  }

  function actualizarReticula(dt) {
    edadReticula = (edadReticula + dt) % (GENERACIONES * PERIODO_RETICULA);
    const k = 1.5 * F.C * Math.sqrt(est.rs);
    const mostrar = $('v-reticula').checked;
    reticula.forEach(function (lineas, g) {
      const edad = (edadReticula + g * PERIODO_RETICULA) % (GENERACIONES * PERIODO_RETICULA);
      lineas.visible = mostrar && edad < 2 * PERIODO_RETICULA;
      const u = lineas.material.uniforms;
      const porFuera = edad < PERIODO_RETICULA;
      const avance = (porFuera ? edad : edad - PERIODO_RETICULA) / PERIODO_RETICULA;
      u.uDesplazamiento.value = k * edad;
      u.uRs.value = est.rs;
      // Solo el agujero negro necesita apagar el centro: un astro ya oculta su interior
      u.uCorte.value = est.tipo === 'agujero' ? est.rAbsorcion : 0;
      u.uFrente.value = S_BORDE * (1 - avance);
      u.uPorFuera.value = porFuera ? 1 : 0;
    });
  }

  function ponerOpacidadReticula(valor) {
    reticula.forEach((lineas) => { lineas.material.uniforms.uOpacidad.value = valor; });
  }

  // ---------- Corriente de espacio ----------

  const corriente = lineasAditivas(N_PARTICULAS * 6, true);
  const dirP = new Float32Array(N_PARTICULAS * 3);
  const radP = new Float32Array(N_PARTICULAS);

  function direccionAzar(d, i) {
    const u = 2 * Math.random() - 1, a = Math.random() * 2 * Math.PI, s = Math.sqrt(1 - u * u);
    d[i] = s * Math.cos(a); d[i + 1] = u; d[i + 2] = s * Math.sin(a);
  }

  function iniciarParticulas() {
    for (let i = 0; i < N_PARTICULAS; i++) {
      direccionAzar(dirP, 3 * i);
      // Distribución uniforme en tiempo de vuelo: el flujo ya arranca estacionario
      radP[i] = R_MUNDO * Math.pow(Math.random(), 2 / 3);
    }
  }

  function actualizarParticulas(dt) {
    const pos = corriente.geometry.attributes.position.array;
    const col = corriente.geometry.attributes.color.array;
    const rs = est.rs, rMin = est.rAbsorcion;
    for (let i = 0; i < N_PARTICULAS; i++) {
      let r = F.caer(radP[i], rs, dt);
      if (r < rMin || r <= 0) {
        r = R_MUNDO;
        direccionAzar(dirP, 3 * i);
      }
      radP[i] = r;
      const v = F.rapidezEspacio(r, rs);
      const cola = r + Math.min(v * F.C * 0.3, 0.6 * r + 0.2);
      const dx = dirP[3 * i], dy = dirP[3 * i + 1], dz = dirP[3 * i + 2];
      const p = 6 * i;
      pos[p] = dx * r; pos[p + 1] = dy * r; pos[p + 2] = dz * r;
      pos[p + 3] = dx * cola; pos[p + 4] = dy * cola; pos[p + 5] = dz * cola;
      const ic = indiceColor(v);
      const borde = Math.min(1, (R_MUNDO - r) / (0.12 * R_MUNDO));
      const brillo = (0.25 + 0.75 * borde) * borde * 0.55;
      for (let k = 0; k < 3; k++) {
        col[p + k] = TABLA[ic + k] * brillo;
        col[p + 3 + k] = TABLA[ic + k] * brillo * 0.2;
      }
    }
    corriente.geometry.attributes.position.needsUpdate = true;
    corriente.geometry.attributes.color.needsUpdate = true;
  }

  // ---------- Observador ----------

  // Nave nodriza quieta: la proa (+z) mira hacia afuera y los propulsores empujan contra la caída
  const propulsores = [];

  function propulsor(x, y, z, radio, largo) {
    const geo = new THREE.ConeGeometry(radio, largo, 16, 1, true);
    geo.translate(0, largo / 2, 0);
    geo.rotateX(-Math.PI / 2);
    const llama = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xffc23d,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }));
    llama.position.set(x, y, z);
    llama.renderOrder = 2;
    propulsores.push(llama);
    return llama;
  }

  const emisor = (function () {
    const casco = new THREE.MeshPhongMaterial({ color: 0xc9d2e3, shininess: 60 });
    const oscuro = new THREE.MeshPhongMaterial({ color: 0x5b6579, shininess: 40 });
    const luzAzul = new THREE.MeshBasicMaterial({ color: 0x8fd8ff });
    const luzRoja = new THREE.MeshBasicMaterial({ color: 0xff5a4d });
    const grupo = new THREE.Group();

    const pieza = (geo, material, x, y, z) => {
      const malla = new THREE.Mesh(geo, material);
      malla.position.set(x, y, z);
      grupo.add(malla);
      return malla;
    };
    const giro = (perfil, segmentos) => new THREE.LatheGeometry(perfil.map((p) => new THREE.Vector2(p[0], p[1])), segmentos);
    const giroLargo = (perfil) => giro(perfil, 28).rotateX(Math.PI / 2);

    // Platillo, con puente arriba y un anillo de luces en el borde
    const yPlatillo = 0.45, zPlatillo = 1.05;
    pieza(giro([[0, -0.2], [0.6, -0.18], [1.15, -0.08], [1.3, 0], [1.15, 0.1], [0.7, 0.2], [0, 0.22]], 48), casco, 0, yPlatillo, zPlatillo);
    pieza(new THREE.SphereGeometry(0.22, 20, 12), oscuro, 0, yPlatillo + 0.2, zPlatillo).scale.y = 0.6;
    pieza(new THREE.TorusGeometry(1.16, 0.022, 8, 64), luzAzul, 0, yPlatillo + 0.075, zPlatillo).rotation.x = Math.PI / 2;

    // Cuello y casco inferior, con el plato deflector al frente
    const cuello = pieza(new THREE.BoxGeometry(0.2, 0.62, 0.75), casco, 0, 0.12, 0.05);
    cuello.rotation.x = 0.45;
    pieza(giroLargo([[0.14, -1.75], [0.31, -1.5], [0.37, -0.6], [0.31, 0.1], [0.13, 0.42], [0, 0.5]]), casco, 0, -0.2, -0.45);
    pieza(new THREE.SphereGeometry(0.1, 16, 12), luzAzul, 0, -0.2, 0.02);

    // Dos góndolas sobre pilones, con tomas rojas al frente y toberas atrás
    [-1, 1].forEach(function (lado) {
      const xG = lado * 1.05, yG = 0.55, zG = -1.05;
      const pilon = pieza(new THREE.BoxGeometry(1.2, 0.06, 0.42), oscuro, lado * 0.52, 0.17, -1.05);
      pilon.rotation.z = lado * 0.68;
      pieza(giroLargo([[0.08, -1.15], [0.15, -1], [0.16, 0.85], [0.1, 1.1]]), casco, xG, yG, zG);
      pieza(new THREE.SphereGeometry(0.105, 16, 12), luzRoja, xG, yG, zG + 1.1);
      grupo.add(propulsor(xG, yG, zG - 1.15, 0.1, 1.5));
    });
    grupo.add(propulsor(0, -0.2, -2.2, 0.13, 1.8));

    // Es ilustrativa: conserva su tamaño aunque atraviese el cuerpo central
    grupo.scale.setScalar(ESCALA_NODRIZA);
    escena.add(grupo);
    return grupo;
  })();

  // El control va en escala logarítmica entre un mínimo que depende del cuerpo y el borde.
  // En un agujero negro permite entrar al horizonte; en un astro, llegar a la superficie.
  function rObservadorKm() {
    const rMax = 0.95 * est.zonaKm;
    let rMin = 0.02 * est.zonaKm;
    if (est.tipo === 'agujero') rMin = 0.5 * est.rsKm;
    else if (est.tipo === 'astro') rMin = 1.001 * est.radioKm;
    rMin = Math.min(rMax * 0.9, Math.max(rMin, 0.005 * est.zonaKm));
    return rMin * Math.pow(rMax / rMin, est.distancia);
  }
  const rEmisor = () => rObservadorKm() / est.kmPorU;

  const vEmisor = new THREE.Vector3();

  function actualizarEmisor() {
    const r = rEmisor();
    emisor.position.set(r, 0, 0);
    emisor.lookAt(vEmisor.set(2 * r, 0, 0));
  }

  // Empuje según la gravedad que debe vencer, en escala logarítmica porque abarca muchos órdenes
  // de magnitud. Dentro del horizonte va al máximo, aunque ya no alcance para quedarse quieta.
  function actualizarPropulsores() {
    const rKm = rObservadorKm();
    let empuje = 0;
    if (est.tipo !== 'vacio' && est.rsKm > 0) {
      empuje = rKm <= est.rsKm ? 1 : Math.max(0.12, Math.min(1, Math.log10(1 + F.gravedadLocal(rKm, est.rsKm) / G_TIERRA) / 12));
    }
    propulsores.forEach(function (llama) {
      llama.visible = empuje > 0;
      llama.scale.z = empuje * (est.pausa ? 1 : 0.9 + 0.2 * Math.random());
    });
  }

  // ---------- Destellos de luz ----------

  const trazos = lineasAditivas(MAX_RAYOS * (TRAZA - 1) * 6, true);
  trazos.renderOrder = 2;
  const frentes = (function () {
    const geo = new THREE.BufferGeometry();
    const atr = new THREE.BufferAttribute(new Float32Array(MAX_RAYOS * 3), 3);
    atr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', atr);
    const brillos = new THREE.BufferAttribute(new Float32Array(MAX_RAYOS * 3), 3);
    brillos.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('color', brillos);
    const puntos = new THREE.Points(geo, new THREE.PointsMaterial({
      vertexColors: true,
      map: texturaBrillo('rgba(255,235,160,1)'),
      size: 1.1,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    puntos.frustumCulled = false;
    puntos.renderOrder = 2;
    escena.add(puntos);
    return puntos;
  })();

  let rayos = [];

  function direccionesDestello() {
    const dirs = [];
    const n = 72, aureo = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (2 * (i + 0.5)) / n, s = Math.sqrt(1 - y * y), a = i * aureo;
      dirs.push([s * Math.cos(a), y, s * Math.sin(a)]);
    }
    return dirs;
  }

  function emitirDestello() {
    const dirs = direccionesDestello();
    while (rayos.length + dirs.length > MAX_RAYOS) rayos.shift();
    const r0 = rEmisor();
    dirs.forEach(function (d) {
      rayos.push({
        s: new Float64Array([r0, 0, 0, d[0], d[1], d[2]]),
        traza: new Float32Array(TRAZA * 3),
        n: 0, cabeza: 0,
        fin: null, vivo: true, vida: 1, edad: 0,
      });
    });
  }

  function agregarPuntoTraza(ray) {
    const x = ray.s[0], y = ray.s[1], z = ray.s[2];
    if (ray.n > 0) {
      const i = 3 * ((ray.cabeza + TRAZA - 1) % TRAZA);
      const dx = x - ray.traza[i], dy = y - ray.traza[i + 1], dz = z - ray.traza[i + 2];
      if (dx * dx + dy * dy + dz * dz < 0.09) return;
    }
    const c = 3 * ray.cabeza;
    ray.traza[c] = x; ray.traza[c + 1] = y; ray.traza[c + 2] = z;
    ray.cabeza = (ray.cabeza + 1) % TRAZA;
    if (ray.n < TRAZA) ray.n++;
  }

  function actualizarRayos(dt) {
    const rs = est.rs;
    for (const ray of rayos) {
      if (ray.vivo) {
        F.avanzarRayo(ray.s, rs, dt);
        ray.edad += dt;
        const r = Math.hypot(ray.s[0], ray.s[1], ray.s[2]);
        if (!ray.fin && r < est.frontera) {
          ray.fin = 'capturado';
        } else if (!ray.fin && r > R_MUNDO) {
          ray.fin = 'escapa';
        }
        agregarPuntoTraza(ray);
        if (r > DESVANECE_LUZ_DESDE) ray.vida = 1 - (r - DESVANECE_LUZ_DESDE) / (DESVANECE_LUZ_HASTA - DESVANECE_LUZ_DESDE);
        // El límite de tiempo es para la luz que sigue atrapada cerca del cuerpo
        if (r < est.rAbsorcion || (r < R_MUNDO && ray.edad > TIEMPO_MAX)) ray.vivo = false;
      } else {
        ray.vida -= dt / 2.5;
      }
    }
    rayos = rayos.filter((ray) => ray.vida > 0);
  }

  function dibujarRayos() {
    const pos = trazos.geometry.attributes.position.array;
    const col = trazos.geometry.attributes.color.array;
    const frente = frentes.geometry.attributes.position.array;
    const brilloFrente = frentes.geometry.attributes.color.array;
    let p = 0, f = 0;
    for (const ray of rayos) {
      const capturado = ray.fin === 'capturado';
      const cr = 1, cg = capturado ? 0.42 : 0.86, cb = capturado ? 0.16 : 0.42;
      const inicio = (ray.cabeza + TRAZA - ray.n) % TRAZA;
      for (let k = 0; k < ray.n - 1; k++) {
        const a = 3 * ((inicio + k) % TRAZA), b = 3 * ((inicio + k + 1) % TRAZA);
        const brilloA = (0.08 + 0.92 * (k / ray.n)) * ray.vida, brilloB = (0.08 + 0.92 * ((k + 1) / ray.n)) * ray.vida;
        pos[p] = ray.traza[a]; pos[p + 1] = ray.traza[a + 1]; pos[p + 2] = ray.traza[a + 2];
        col[p] = cr * brilloA; col[p + 1] = cg * brilloA; col[p + 2] = cb * brilloA;
        pos[p + 3] = ray.traza[b]; pos[p + 4] = ray.traza[b + 1]; pos[p + 5] = ray.traza[b + 2];
        col[p + 3] = cr * brilloB; col[p + 4] = cg * brilloB; col[p + 5] = cb * brilloB;
        p += 6;
      }
      if (ray.vivo) {
        frente[f] = ray.s[0]; frente[f + 1] = ray.s[1]; frente[f + 2] = ray.s[2];
        brilloFrente[f] = brilloFrente[f + 1] = brilloFrente[f + 2] = ray.vida;
        f += 3;
      }
    }
    trazos.geometry.setDrawRange(0, p / 3);
    trazos.geometry.attributes.position.needsUpdate = true;
    trazos.geometry.attributes.color.needsUpdate = true;
    frentes.geometry.setDrawRange(0, f / 3);
    frentes.geometry.attributes.position.needsUpdate = true;
    frentes.geometry.attributes.color.needsUpdate = true;
  }

  // ---------- Esfera de polvo ----------

  const lineasEsfera = lineasAditivas(2 * 3 * 900, false);
  lineasEsfera.material.color.set(0x7df0c0);
  lineasEsfera.material.blending = THREE.NormalBlending;
  lineasEsfera.renderOrder = 2;
  let esfera = null;

  function construirEsfera(cx, cz, radio) {
    const verts = [], segs = [];
    const agregar = (x, y, z) => verts.push([cx + x * radio, y * radio, cz + z * radio]) - 1;
    const LAT = 8, LON = 14, PASOS = 14;
    for (let la = 1; la < LAT; la++) {
      const th = (la / LAT) * Math.PI, primero = verts.length;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * 2 * Math.PI;
        agregar(Math.sin(th) * Math.cos(a), Math.cos(th), Math.sin(th) * Math.sin(a));
        segs.push([primero + i, primero + (i + 1) % 28]);
      }
    }
    for (let lo = 0; lo < LON; lo++) {
      const a = (lo / LON) * 2 * Math.PI;
      let previo = -1;
      for (let i = 0; i <= PASOS; i++) {
        const th = (i / PASOS) * Math.PI;
        const v = agregar(Math.sin(th) * Math.cos(a), Math.cos(th), Math.sin(th) * Math.sin(a));
        if (previo >= 0) segs.push([previo, v]);
        previo = v;
      }
    }
    const n = verts.length;
    const dir = new Float32Array(n * 3), rad = new Float32Array(n);
    verts.forEach(function (v, i) {
      const r = Math.hypot(v[0], v[1], v[2]);
      rad[i] = r;
      dir[3 * i] = v[0] / r; dir[3 * i + 1] = v[1] / r; dir[3 * i + 2] = v[2] / r;
    });
    return { dir, rad, segs, edad: 0 };
  }

  function soltarEsfera() {
    const r0 = Math.max(rEmisor(), Math.min(2.2 * est.frontera, (est.frontera + R_MUNDO) / 2));
    const a = -0.6;
    const radio = Math.min(2.4, 0.35 * r0);
    esfera = construirEsfera(r0 * Math.cos(a), r0 * Math.sin(a), radio);
  }

  function actualizarEsfera(dt) {
    if (!esfera) return;
    let rMax = 0;
    for (let i = 0; i < esfera.rad.length; i++) {
      // Cae hasta la superficie, o hasta desaparecer dentro del horizonte
      esfera.rad[i] = Math.max(F.caer(esfera.rad[i], est.rs, dt), est.tipo === 'astro' ? est.frontera : 0);
      rMax = Math.max(rMax, esfera.rad[i]);
    }
    esfera.edad += dt;
    if (rMax <= est.rAbsorcion * 1.001 || esfera.edad > TIEMPO_MAX) esfera = null;
  }

  function dibujarEsfera() {
    lineasEsfera.visible = !!esfera;
    if (!esfera) return;
    const pos = lineasEsfera.geometry.attributes.position.array;
    let p = 0;
    for (const s of esfera.segs) {
      for (let e = 0; e < 2; e++, p += 3) {
        const v = s[e], r = esfera.rad[v];
        pos[p] = esfera.dir[3 * v] * r;
        pos[p + 1] = esfera.dir[3 * v + 1] * r;
        pos[p + 2] = esfera.dir[3 * v + 2] * r;
      }
    }
    lineasEsfera.geometry.setDrawRange(0, p / 3);
    lineasEsfera.geometry.attributes.position.needsUpdate = true;
  }

  // ---------- Nave contra corriente ----------

  // Cohete con la punta hacia +z, que es hacia donde apunta lookAt. Solo él usa luces.
  escena.add(new THREE.HemisphereLight(0xcfe0ff, 0x2a2238, 0.9));
  const luzNave = new THREE.DirectionalLight(0xffffff, 0.8);
  luzNave.position.set(1, 1.5, 1);
  escena.add(luzNave);

  function piezaGiratoria(perfil, material) {
    const geo = new THREE.LatheGeometry(perfil.map((p) => new THREE.Vector2(p[0], p[1])), 32);
    geo.rotateX(Math.PI / 2);
    return new THREE.Mesh(geo, material);
  }

  function llama(largo, radio, color) {
    const geo = new THREE.ConeGeometry(radio, largo, 16, 1, true);
    geo.translate(0, largo / 2, 0);
    geo.rotateX(-Math.PI / 2);
    geo.scale(ESCALA_COHETE, ESCALA_COHETE, ESCALA_COHETE);
    const malla = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }));
    malla.position.z = -COLA_NAVE;
    malla.renderOrder = 2;
    return malla;
  }

  const llamaExterior = llama(1.5, 0.3, 0xff7a2e);
  const llamaInterior = llama(0.9, 0.16, 0xfff0b0);

  const piezasNave = [];

  const naveMalla = (function () {
    const casco = new THREE.MeshPhongMaterial({ color: 0xdde4f0, shininess: 70 });
    const acento = new THREE.MeshPhongMaterial({ color: 0xff4f86, shininess: 50 });
    const metal = new THREE.MeshPhongMaterial({ color: 0x4a5266, shininess: 90, side: THREE.DoubleSide });
    const grupo = new THREE.Group();

    grupo.add(piezaGiratoria([[0.3, -1.25], [0.42, -0.95], [0.48, -0.35], [0.48, 0.2], [0.4, 0.8], [0.25, 1.25]], casco));
    grupo.add(piezaGiratoria([[0.25, 1.25], [0.14, 1.5], [0, 1.65]], acento));
    grupo.add(piezaGiratoria([[0.2, -1.2], [0.22, -1.35], [0.34, -1.6]], metal));

    const banda = new THREE.Mesh(new THREE.TorusGeometry(0.485, 0.03, 8, 40), metal);
    banda.position.z = -0.35;
    grupo.add(banda);

    // Ventanilla con marco, en el lado superior
    const ventanilla = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), new THREE.MeshBasicMaterial({ color: 0x8fe3ff }));
    ventanilla.scale.y = 0.45;
    ventanilla.position.set(0, 0.43, 0.45);
    ventanilla.rotation.x = 0.12;
    grupo.add(ventanilla);
    const marco = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.03, 8, 28), metal);
    marco.position.copy(ventanilla.position);
    marco.rotation.x = Math.PI / 2 + 0.12;
    grupo.add(marco);

    // Cuatro aletas alrededor de la cola
    const perfilAleta = new THREE.Shape();
    perfilAleta.moveTo(0.3, -0.45);
    perfilAleta.lineTo(0.38, -0.35);
    perfilAleta.lineTo(0.95, -1.3);
    perfilAleta.lineTo(0.95, -1.6);
    perfilAleta.lineTo(0.28, -1.15);
    perfilAleta.closePath();
    const geoAleta = new THREE.ExtrudeGeometry(perfilAleta, { depth: 0.05, bevelEnabled: false });
    geoAleta.translate(0, 0, -0.025);
    geoAleta.rotateX(Math.PI / 2);
    for (let i = 0; i < 4; i++) {
      const aleta = new THREE.Mesh(geoAleta, acento);
      aleta.rotation.z = Math.PI / 4 + (i * Math.PI) / 2;
      grupo.add(aleta);
    }

    // Cada pieza guarda su forma original en coordenadas de la nave, para deformarla punto a punto
    grupo.children.slice().forEach(function (pieza) {
      pieza.updateMatrix();
      pieza.geometry = pieza.geometry.clone();
      pieza.geometry.applyMatrix4(pieza.matrix);
      // La escala queda en la geometría: la marea debe actuar sobre el tamaño real
      pieza.geometry.scale(ESCALA_COHETE, ESCALA_COHETE, ESCALA_COHETE);
      pieza.position.set(0, 0, 0);
      pieza.rotation.set(0, 0, 0);
      pieza.scale.set(1, 1, 1);
      pieza.frustumCulled = false;
      piezasNave.push({ geo: pieza.geometry, base: pieza.geometry.attributes.position.array.slice() });
    });

    grupo.add(llamaExterior, llamaInterior);
    grupo.visible = false;
    escena.add(grupo);
    return grupo;
  })();
  let nave = null;
  // Marea rs/r³ (en unidades de escena) a partir de la cual la nave dibujada empieza a deformarse
  const MAREA_UMBRAL = 6.7e-4;
  const ANCHO_MIN_NAVE = 0.08; // para que el hilo final no deje de verse
  let naveDeformada = false;

  // Espaguetización con la ley exacta del polvo que cae: s = r^(3/2) baja igual para todos los
  // puntos, y cada punto conserva su dirección desde el centro. Un punto a una distancia z del
  // centro de la nave, medida a lo largo, conserva su diferencia de s respecto al centro desde r0,
  // el radio donde la marea alcanza el umbral. Así nada que cruzó el horizonte vuelve a salir.
  function diferenciaS(r0, z) {
    return Math.pow(Math.max(r0 + z, 0), 1.5) - Math.pow(r0, 1.5);
  }

  function deformarNave(sCentro) {
    const r0 = Math.cbrt(est.rs / MAREA_UMBRAL);
    const rCentro = Math.pow(Math.max(sCentro, 0), 2 / 3);
    if (rCentro >= r0) {
      if (naveDeformada) {
        piezasNave.forEach(function (pieza) {
          pieza.geo.attributes.position.array.set(pieza.base);
          pieza.geo.attributes.position.needsUpdate = true;
        });
        llamaExterior.position.z = llamaInterior.position.z = -COLA_NAVE;
        llamaExterior.scale.x = llamaExterior.scale.y = 1;
        llamaInterior.scale.x = llamaInterior.scale.y = 1;
        naveDeformada = false;
      }
      return rCentro;
    }
    naveDeformada = true;
    // Devuelve la posición a lo largo y el factor de ancho del punto que estaba a z del centro
    let zNueva = 0, ancho = 1;
    const punto = function (z) {
      const r = Math.pow(Math.max(sCentro + diferenciaS(r0, z), 0), 2 / 3);
      zNueva = r - rCentro;
      ancho = Math.max(r / Math.max(r0 + z, 1e-3), ANCHO_MIN_NAVE);
    };
    piezasNave.forEach(function (pieza) {
      const pos = pieza.geo.attributes.position.array, base = pieza.base;
      for (let i = 0; i < pos.length; i += 3) {
        punto(base[i + 2]);
        pos[i] = base[i] * ancho;
        pos[i + 1] = base[i + 1] * ancho;
        pos[i + 2] = zNueva;
      }
      pieza.geo.attributes.position.needsUpdate = true;
    });
    punto(-COLA_NAVE);
    llamaExterior.position.z = llamaInterior.position.z = zNueva;
    llamaExterior.scale.x = llamaExterior.scale.y = ancho;
    llamaInterior.scale.x = llamaInterior.scale.y = ancho;
    return rCentro;
  }
  const vNave = new THREE.Vector3();

  function lanzarNave() {
    // Sale a un costado de la nave nodriza, junto a sus góndolas, y luego sigue su propia radial
    const x = rEmisor();
    const costado = 1.6 * ESCALA_NODRIZA + 1.2 * ESCALA_COHETE;
    // Dentro del horizonte el costado no puede sacarla: parte desde el mismo radio que la nodriza
    const r = x < est.rs ? x : Math.hypot(x, costado);
    nave = { r: r, angulo: Math.atan2(costado, x), beta: est.beta, fin: null, sColapso: null };
  }

  function actualizarNave(dt) {
    if (!nave || nave.fin) return;
    const rs = est.rs;
    if (nave.sColapso !== null) {
      // El centro ya llegó; el resto de la nave sigue cayendo hasta que la punta también llega
      nave.sColapso -= 1.5 * F.C * Math.sqrt(rs) * dt;
      const sPunta = nave.sColapso + diferenciaS(Math.cbrt(rs / MAREA_UMBRAL), PUNTA_NAVE);
      if (sPunta <= Math.pow(est.rAbsorcion, 1.5)) nave.fin = 'cayo';
      return;
    }
    let resta = dt;
    while (resta > 0) {
      const h = Math.min(resta, Math.max((0.02 * nave.r) / F.C, 1e-3));
      nave.r += F.velocidadContraCorriente(nave.r, rs, nave.beta) * F.C * h;
      resta -= h;
      if (nave.r < est.rAbsorcion) break;
    }
    if (nave.r < est.rAbsorcion) {
      if (est.tipo === 'agujero') nave.sColapso = Math.pow(nave.r, 1.5);
      else nave.fin = 'cayo';
    }
    else if (nave.r > R_LEJOS_NAVE) nave.fin = 'salio';
  }

  function dibujarNave() {
    naveMalla.visible = !!nave && !nave.fin;
    if (!naveMalla.visible) return;
    const ca = Math.cos(nave.angulo), sa = Math.sin(nave.angulo);
    const rCentro = deformarNave(nave.sColapso !== null ? nave.sColapso : Math.pow(nave.r, 1.5));
    naveMalla.position.set(rCentro * ca, 0, rCentro * sa);
    naveMalla.lookAt(vNave.set(2 * ca, 0, 2 * sa).add(naveMalla.position));
    // La llama crece con la rapidez de la nave y parpadea; sin propulsión no hay llama
    const parpadeo = est.pausa ? 1 : 0.88 + 0.24 * Math.random();
    const largoLlama = (0.35 + 1.1 * nave.beta) * parpadeo;
    llamaExterior.visible = llamaInterior.visible = nave.beta > 0;
    llamaExterior.scale.z = largoLlama;
    llamaInterior.scale.z = largoLlama;
  }

  // ---------- Etiquetas sobre la escena ----------

  const proy = new THREE.Vector3();
  function ponerEtiqueta(el, posicion, despY, visible) {
    proy.copy(posicion).project(camara);
    if (!visible || proy.z > 1) { el.style.display = 'none'; return; }
    el.style.display = '';
    const x = (proy.x * 0.5 + 0.5) * contenedor.clientWidth;
    const y = (-proy.y * 0.5 + 0.5) * contenedor.clientHeight;
    el.style.transform = 'translate(' + x.toFixed(0) + 'px,' + (y + despY).toFixed(0) + 'px) translate(-50%,-50%)';
  }

  const vEt = new THREE.Vector3(), vCentro = new THREE.Vector3();
  function actualizarEtiquetas() {
    const esAgujero = est.tipo === 'agujero';
    // Los bordes se rotulan arriba de la esfera, tal como se ve desde la cámara
    vEt.setFromMatrixColumn(camara.matrixWorld, 1).multiplyScalar(est.frontera);
    if (esAgujero) {
      ponerEtiqueta($('et-cuerpo'), vCentro, 18, singularidad.visible);
      ponerEtiqueta($('et-horizonte'), vEt, -14, !est.camaraDentro);
    } else {
      ponerEtiqueta($('et-cuerpo'), vEt, -14, est.tipo === 'astro');
      ponerEtiqueta($('et-horizonte'), vEt, -14, false);
    }
    ponerEtiqueta($('et-emisor'), emisor.position, -36, true);
  }

  // ---------- Panel ----------

  function fmtKm(km) {
    return (km < 10 ? sig(km, 3) : num(km, 0)) + ' km';
  }

  // Notación científica con exponente en superíndice: 2,12 × 10⁻⁶
  function cientifica(x) {
    const exp = Math.floor(Math.log10(x));
    const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    return sig(x / Math.pow(10, exp), 3) + ' × 10' + String(exp).replace(/./g, (c) => SUP[c]);
  }

  const cantidad = (x) => (x === 0 ? '0' : x >= 1e6 || x < 0.01 ? cientifica(x) : sig(x, 3));

  function actualizarLecturas() {
    const rsKm = est.rsKm, rKm = rObservadorKm();
    const conMasa = est.tipo !== 'vacio' && rsKm > 0;

    $('et-cuerpo').textContent = est.tipo === 'agujero' ? 'Singularidad' : 'Superficie';
    if (est.tipo === 'agujero') {
      $('d-gravedad').textContent = 'sin superficie';
      $('d-escape').textContent = '1 c en el horizonte';
    } else if (conMasa) {
      $('d-gravedad').textContent = cantidad(F.gravedadLocal(est.radioKm, rsKm) / G_TIERRA) + ' g';
      // La velocidad de escape en r es igual a la rapidez de caída del espacio en r
      $('d-escape').textContent = cantidad(F.rapidezEspacio(est.radioKm, rsKm)) + ' c';
    } else {
      $('d-gravedad').textContent = '0 g';
      $('d-escape').textContent = '0 c';
    }

    $('distancia-val').textContent = fmtKm(rKm);
    $('rapidez-val').textContent = '×' + sig(est.rapidez, 2);
    $('opacidad-val').textContent = num(parseFloat($('opacidad').value) * 100, 0) + ' %';
    $('beta-val').textContent = num(est.beta, 2) + ' c';

    // Resumen en la barra de menú, visible aunque las ventanas estén cerradas
    $('b-masa').textContent = sig(est.masa, 4);
    $('b-radio').textContent = fmtKm(est.radioKm);

  }

  function aplicarCuerpo() {
    calcularCuerpo();
    actualizarCuerpoVisual();
    actualizarEmisor();
    actualizarLecturas();
  }

  function limpiarExperimentos() {
    rayos = [];
    esfera = null;
    nave = null;
  }

  function aplicarVisibilidad() {
    corriente.visible = $('v-particulas').checked;
  }

  function ponerMasa(masa, desdeCampo) {
    est.masa = masa;
    if (desdeCampo !== 'num') $('masa-num').value = masa;
    if (desdeCampo !== 'rango') $('masa').value = masa;
    limpiarExperimentos();
    aplicarCuerpo();
  }

  function ponerRadio(km, desdeCampo) {
    est.radioKm = km;
    if (desdeCampo !== 'num') $('radio-num').value = km;
    if (desdeCampo !== 'rango') $('radio').value = Math.log10(km);
    limpiarExperimentos();
    aplicarCuerpo();
  }

  $('masa').addEventListener('input', (e) => ponerMasa(parseFloat(e.target.value), 'rango'));
  $('masa-num').addEventListener('input', function (e) {
    const m = leerNumero(e.target.value);
    if (m >= 0) ponerMasa(m, 'num');
  });
  $('radio').addEventListener('input', function (e) {
    ponerRadio(parseFloat(Math.pow(10, parseFloat(e.target.value)).toPrecision(3)), 'rango');
  });
  $('radio-num').addEventListener('input', function (e) {
    const km = leerNumero(e.target.value);
    if (km >= 0.1) ponerRadio(km, 'num');
  });
  $('distancia').addEventListener('input', function (e) {
    est.distancia = parseFloat(e.target.value);
    actualizarEmisor();
    actualizarLecturas();
  });
  $('opacidad').addEventListener('input', function (e) {
    ponerOpacidadReticula(parseFloat(e.target.value));
    actualizarLecturas();
  });
  $('rapidez').addEventListener('input', function (e) {
    est.rapidez = Math.pow(10, parseFloat(e.target.value));
    actualizarLecturas();
  });
  $('beta').addEventListener('input', function (e) {
    est.beta = parseFloat(e.target.value);
    actualizarLecturas();
  });
  $('b-destello').addEventListener('click', emitirDestello);
  $('b-esfera').addEventListener('click', soltarEsfera);
  $('b-nave').addEventListener('click', lanzarNave);
  $('b-limpiar').addEventListener('click', function () {
    limpiarExperimentos();
    actualizarLecturas();
  });
  $('b-camara').addEventListener('click', function () {
    // Sin amortiguación, update() anula la inercia del último giro, que desviaría la cámara
    controles.enableDamping = false;
    controles.update();
    controles.reset();
    controles.enableDamping = true;
  });
  // El botón flotante, el menú y la barra espaciadora comparten un solo estado de pausa
  const hud = new window.TimeHudController({
    onPlayChange: function (reproduciendo) {
      est.pausa = !reproduciendo;
      $('b-pausa').textContent = reproduciendo ? 'Pausar' : 'Continuar';
    },
  });
  $('b-pausa').addEventListener('click', () => hud.togglePlay());
  $('v-translucido').addEventListener('change', actualizarCuerpoVisual);
  ['v-particulas', 'v-reticula'].forEach((id) => $(id).addEventListener('change', aplicarVisibilidad));

  // ---------- Bucle principal ----------

  function ajustarTamano() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  window.addEventListener('resize', ajustarTamano);

  iniciarParticulas();
  limpiarExperimentos();
  aplicarVisibilidad();
  aplicarCuerpo();
  ajustarTamano();

  const reloj = new THREE.Clock();
  function cuadro() {
    requestAnimationFrame(cuadro);
    const delta = Math.min(reloj.getDelta(), 0.05);

    const dt = est.pausa ? 0 : delta * est.rapidez;
    actualizarParticulas(dt);
    actualizarReticula(dt);
    if (dt > 0) {
      actualizarRayos(dt);
      actualizarEsfera(dt);
      actualizarNave(dt);
    }
    dibujarRayos();
    dibujarEsfera();
    dibujarNave();
    actualizarPropulsores();
    controles.update();
    const distanciaCamara = camara.position.length();
    const dentro = est.tipo === 'agujero' && distanciaCamara < est.rs;
    if (dentro !== est.camaraDentro) {
      est.camaraDentro = dentro;
      actualizarCuerpoVisual();
    }
    // El plano cercano sigue a la cámara, para no recortar lo que tiene delante al acercarse
    const cercano = Math.max(0.01, Math.min(0.5, 0.05 * distanciaCamara));
    if (cercano !== camara.near) {
      camara.near = cercano;
      camara.updateProjectionMatrix();
    }
    renderer.render(escena, camara);
    actualizarEtiquetas();
  }
  cuadro();
})();
