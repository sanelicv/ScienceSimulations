// --- Parámetros de Configuración Ajustables ---
const CONFIG = {
    minB: 0.1,      // Valor mínimo del campo magnético (B) en Tesla
    maxB: 1.5,      // Valor máximo del campo magnético (B) en Tesla
    initialB: 1,  // Valor inicial del campo magnético (B) en Tesla
    magnetDistance: 25.0, // Distancia entre los imanes (de centro a centro)
    minFieldLines: 4,  // Cantidad mínima de líneas de campo
    maxFieldLines: 36, // Cantidad máxima de líneas de campo

    maxOmega: 50.0, // Valor máximo de la rapidez angular (omega) en rad/s
    initialOmega: 5.0, // Valor inicial de la rapidez angular (omega) en rad/s

    maxN: 10,       // Valor máximo del número de vueltas (N)
    initialN: 5,    // Valor inicial del número de vueltas (N)
    minArea: 0.2,   // Área mínima de la espira en unidades cuadradas
    maxArea: 5.0,  // Área máxima de la espira en unidades cuadradas
    coilArea: 1, // Área actual/inicial de la espira

    fixedMinV: -150.0, // Límite inferior de voltaje fijo cuando autoplay está desactivado (modo AC)
    fixedMaxV: 150.0,  // Límite superior de voltaje fijo cuando autoplay está desactivado
    fixedMinFlux: -150.0, // Límite inferior de flujo fijo cuando autoplay está desactivado
    fixedMaxFlux: 150.0,  // Límite superior de flujo fijo cuando autoplay está desactivado
    plotLabels: {
        x: 'Tiempo (s)',
        y: 'Voltaje (V)'
    },
    fluxLabels: {
        x: 'Tiempo (s)',
        y: 'Flujo Magnético (Wb)'
    }
};

// --- Parámetros de Control Global ---
const state = {
    mode: 'AC',
    omegaSlider: CONFIG.initialOmega,
    omega: CONFIG.initialOmega,
    B: CONFIG.initialB,
    N: CONFIG.initialN,
    theta: 0.0,
    time: 0.0,
    showFieldLines: true,
    coilArea: CONFIG.coilArea,
    autoplay: true,
    isDraggingCoil: false
};

// --- Configuración de UI e Inputs ---
const modeSelect = document.getElementById('mode-select');
const velocitySlider = document.getElementById('velocity-slider');
const autoplayToggle = document.getElementById('autoplay-toggle');
const fieldSlider = document.getElementById('field-slider');
const turnsSlider = document.getElementById('turns-slider');
const areaSlider = document.getElementById('area-slider');

const velocityVal = document.getElementById('velocity-val');
const fieldVal = document.getElementById('field-val');
const turnsVal = document.getElementById('turns-val');
const areaVal = document.getElementById('area-val');

// Aplicar límites dinámicos y valores iniciales a los sliders HTML desde la configuración
velocitySlider.max = CONFIG.maxOmega;
velocitySlider.value = CONFIG.initialOmega;
velocityVal.textContent = CONFIG.initialOmega.toFixed(1);
fieldSlider.min = CONFIG.minB;
fieldSlider.max = CONFIG.maxB;
fieldSlider.value = CONFIG.initialB;
fieldVal.textContent = CONFIG.initialB.toFixed(1);
turnsSlider.max = CONFIG.maxN;
turnsSlider.value = CONFIG.initialN;
turnsVal.textContent = CONFIG.initialN;
areaSlider.min = CONFIG.minArea;
areaSlider.max = CONFIG.maxArea;
areaSlider.value = CONFIG.coilArea;
areaVal.textContent = CONFIG.coilArea.toFixed(1);

velocitySlider.addEventListener('input', (e) => {
    state.omegaSlider = parseFloat(e.target.value);
    velocityVal.textContent = e.target.value;
    if (state.autoplay) {
        state.omega = state.omegaSlider;
    }
});

autoplayToggle.addEventListener('change', (e) => {
    state.autoplay = e.target.checked;
    if (state.autoplay) {
        state.omega = state.omegaSlider;
    } else {
        state.omega = 0.0;
    }
});

fieldSlider.addEventListener('input', (e) => { state.B = parseFloat(e.target.value); fieldVal.textContent = e.target.value; updateMagnetScale(); });
turnsSlider.addEventListener('input', (e) => { state.N = parseInt(e.target.value); turnsVal.textContent = e.target.value; rebuildCoil(); });
areaSlider.addEventListener('input', (e) => { state.coilArea = parseFloat(e.target.value); areaVal.textContent = state.coilArea.toFixed(1); rebuildCoil(); });
modeSelect.addEventListener('change', (e) => {
    state.mode = e.target.value;
    updateContactsVisibility();
    rebuildCoil(); // Reconstruir bobina para ajustar los terminales dinámicamente
});

const fieldLinesToggle = document.getElementById('field-lines-toggle');
fieldLinesToggle.addEventListener('change', (e) => {
    state.showFieldLines = e.target.checked;
    updateFieldLines();
});

// --- Inicialización de Three.js ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1f5f9);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(15, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// --- Elementos Estáticos (Estator) ---
// Imanes de doble polo (cada uno de tamaño total 4x6x8, compuesto por dos mitades de 2x6x8)
const poleGeom = new THREE.BoxGeometry(2, 6, 8);
const materialNorte = new THREE.MeshStandardMaterial({ color: 0xff4b4b, roughness: 0.4 }); // Rojo
const materialSur = new THREE.MeshStandardMaterial({ color: 0x4b7bff, roughness: 0.4 }); // Azul

// Imán Izquierdo (Polo Norte hacia adentro, Polo Sur hacia afuera)
const leftMagnetN = new THREE.Mesh(poleGeom, materialNorte);
const leftMagnetS = new THREE.Mesh(poleGeom, materialSur);
scene.add(leftMagnetN);
scene.add(leftMagnetS);

// Imán Derecho (Polo Sur hacia adentro, Polo Norte hacia afuera)
const rightMagnetS = new THREE.Mesh(poleGeom, materialSur);
const rightMagnetN = new THREE.Mesh(poleGeom, materialNorte);
scene.add(rightMagnetS);
scene.add(rightMagnetN);

// --- Líneas de Campo Magnético (Estator) ---
const fieldLinesGroup = new THREE.Group();
scene.add(fieldLinesGroup);

// Generación dinámica de posiciones (y, z) ordenadas por distancia al origen (aparecen del centro hacia afuera)
const linePositions = [];
let K = 1;
while (K * K < CONFIG.maxFieldLines) {
    K += 2;
}

const gridValues = [];
if (K === 1) {
    gridValues.push(0.0);
} else {
    const step = 6.0 / (K - 1);
    for (let i = 0; i < K; i++) {
        gridValues.push(-3.0 + i * step);
    }
}

const candidates = [];
for (const y of gridValues) {
    for (const z of gridValues) {
        candidates.push({ y, z, distSq: y * y + z * z });
    }
}
candidates.sort((a, b) => a.distSq - b.distSq);

for (let i = 0; i < Math.min(candidates.length, CONFIG.maxFieldLines); i++) {
    linePositions.push(candidates[i]);
}

// Material tubular celeste semitransparente con opacidad adecuada
const lineMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.2,
    metalness: 0.1
});

// Generar los tubos de campo magnético y conos direccionales (+X)
const innerX = CONFIG.magnetDistance / 2 - 2; // Cara interna de los imanes (ancho de imán es 4)
const coneOffset = innerX * 0.58; // Posicionamiento proporcional de las puntas de flecha

linePositions.forEach(pos => {
    const lineContainer = new THREE.Group();

    // El tubo va de la cara interior de N a la cara interior de S
    const curve = new THREE.LineCurve3(new THREE.Vector3(-innerX, pos.y, pos.z), new THREE.Vector3(innerX, pos.y, pos.z));
    const tubeGeom = new THREE.TubeGeometry(curve, 1, 0.04, 6, false);
    const tubeMesh = new THREE.Mesh(tubeGeom, lineMat);
    lineContainer.add(tubeMesh);

    // Flechas de flujo: Conos a lo largo de la línea
    const coneGeom = new THREE.ConeGeometry(0.12, 0.3, 5);
    coneGeom.rotateZ(-Math.PI / 2); // Rotar para que apunte hacia +X (Norte a Sur)

    const cone1 = new THREE.Mesh(coneGeom, lineMat);
    cone1.position.set(-coneOffset, pos.y, pos.z);

    const cone2 = new THREE.Mesh(coneGeom, lineMat);
    cone2.position.set(coneOffset, pos.y, pos.z);

    lineContainer.add(cone1, cone2);
    fieldLinesGroup.add(lineContainer);
});

function updateFieldLines() {
    if (!state.showFieldLines) {
        fieldLinesGroup.visible = false;
        return;
    }
    fieldLinesGroup.visible = true;

    // Calcular cuántas líneas mostrar en función de B (de minFieldLines a maxFieldLines)
    const fraction = (state.B - CONFIG.minB) / (CONFIG.maxB - CONFIG.minB);
    const activeRange = CONFIG.maxFieldLines - CONFIG.minFieldLines;
    const activeCount = Math.max(CONFIG.minFieldLines, Math.min(CONFIG.maxFieldLines, Math.round(CONFIG.minFieldLines + fraction * activeRange)));

    for (let i = 0; i < fieldLinesGroup.children.length; i++) {
        fieldLinesGroup.children[i].visible = (i < activeCount);
    }
}

// Escobillas Fijas 
const brushGeom = new THREE.BoxGeometry(0.8, 0.4, 1.2);
const brushMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
const escobilla1 = new THREE.Mesh(brushGeom, brushMat);
const escobilla2 = new THREE.Mesh(brushGeom, brushMat);
scene.add(escobilla1, escobilla2);

// --- Foco de Luz y Conexión de Cables ---
const lightbulbGroup = new THREE.Group();
lightbulbGroup.position.set(0, -7.0, 5.0);
scene.add(lightbulbGroup);

// Base del foco (aumentado un 20%)
const baseGeom = new THREE.CylinderGeometry(0.576, 0.576, 0.576, 16);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
const baseMesh = new THREE.Mesh(baseGeom, baseMat);
baseMesh.position.y = -0.288;
lightbulbGroup.add(baseMesh);

// Casquillo metálico de contacto (rosca, aumentado un 20%)
const threadGeom = new THREE.CylinderGeometry(0.432, 0.432, 0.288, 16);
const threadMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
const threadMesh = new THREE.Mesh(threadGeom, threadMat);
threadMesh.position.y = 0.144;
lightbulbGroup.add(threadMesh);

// Vidrio/Esfera del foco (aumentado un 20%)
const bulbGeom = new THREE.SphereGeometry(0.72, 24, 24);
// Material emisivo para que brille
const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0xeab308, // Amarillo
    emissiveIntensity: 0.0,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9
});
const bulbMesh = new THREE.Mesh(bulbGeom, bulbMat);
bulbMesh.position.y = 0.864;
lightbulbGroup.add(bulbMesh);

// Punto de luz dinámico (PointLight) para proyectar iluminación sobre la escena
const bulbLight = new THREE.PointLight(0xfef08a, 0, 8); // Amarillo claro, intensidad inicial 0, distancia 8
bulbLight.position.set(0, -6.136, 5.0); // Misma posición que la esfera del foco
scene.add(bulbLight);

// Cables usando TubeGeometry
let wireMesh1 = null;
let wireMesh2 = null;
const wireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }); // Cables color gris oscuro

function rebuildWires() {
    if (wireMesh1) scene.remove(wireMesh1);
    if (wireMesh2) scene.remove(wireMesh2);

    const yBrush1 = (state.mode === 'AC') ? -5.2 : -5.6;
    const yBrush2 = (state.mode === 'AC') ? -6.0 : -5.6;

    // Cable 1 (Izquierdo) - Trayecto cuadrado (ortogonal de 90 grados)
    const pointA1 = new THREE.Vector3(-1.5, yBrush1, 0);
    const pointB1 = new THREE.Vector3(-1.5, yBrush1, 5.0);
    const pointC1 = new THREE.Vector3(-1.5, -7.288, 5.0);
    const pointD1 = new THREE.Vector3(-0.3, -7.288, 5.0);

    const path1 = new THREE.CurvePath();
    path1.add(new THREE.LineCurve3(pointA1, pointB1));
    path1.add(new THREE.LineCurve3(pointB1, pointC1));
    path1.add(new THREE.LineCurve3(pointC1, pointD1));

    const geom1 = new THREE.TubeGeometry(path1, 40, 0.08, 8, false);
    wireMesh1 = new THREE.Mesh(geom1, wireMat);
    scene.add(wireMesh1);

    // Cable 2 (Derecho) - Trayecto cuadrado (ortogonal de 90 grados)
    const pointA2 = new THREE.Vector3(1.5, yBrush2, 0);
    const pointB2 = new THREE.Vector3(1.5, yBrush2, 5.0);
    const pointC2 = new THREE.Vector3(1.5, -7.288, 5.0);
    const pointD2 = new THREE.Vector3(0.3, -7.288, 5.0);

    const path2 = new THREE.CurvePath();
    path2.add(new THREE.LineCurve3(pointA2, pointB2));
    path2.add(new THREE.LineCurve3(pointB2, pointC2));
    path2.add(new THREE.LineCurve3(pointC2, pointD2));

    const geom2 = new THREE.TubeGeometry(path2, 40, 0.08, 8, false);
    wireMesh2 = new THREE.Mesh(geom2, wireMat);
    scene.add(wireMesh2);
}

// --- Elementos Dinámicos (Rotor) ---
const rotorGroup = new THREE.Group();
scene.add(rotorGroup);

let coilMesh = null;

function rebuildCoil() {
    if (coilMesh) rotorGroup.remove(coilMesh);

    const points = [];
    // Reescalar la bobina proporcionalmente para que su tamaño visual esté acotado entre [0.45, 1.2]
    const minVisualScale = 0.45;
    const maxVisualScale = 0.90;
    const denom = Math.sqrt(CONFIG.maxArea) - Math.sqrt(CONFIG.minArea);
    const norm = denom > 0 ? (Math.sqrt(state.coilArea) - Math.sqrt(CONFIG.minArea)) / denom : 0;
    const areaScale = minVisualScale + norm * (maxVisualScale - minVisualScale);

    const rX = 2.5 * areaScale;
    const rY = 3.5 * areaScale;
    const dz = 0.15; // Desplazamiento paso helicoidal entre vueltas 

    const dz_effective = (state.N > 1) ? dz : 0;
    const totalWindingPoints = 4 * state.N;

    // Coordenadas Z para los extremos de la bobina (inicio y fin)
    const z_start = -((totalWindingPoints - 1) / 8) * dz_effective;
    const z_end = ((totalWindingPoints - 1) / 8) * dz_effective;

    // Alturas de contacto dinámicas dependiendo del tipo de generador
    const yContact1 = (state.mode === 'AC') ? -5.2 : -5.6;
    const yContact2 = (state.mode === 'AC') ? -6.0 : -5.6;

    // Terminal 1: Conexión desde el contacto izquierdo hacia el inicio de la bobina
    points.push(new THREE.Vector3(-1.2, yContact1, 0));
    points.push(new THREE.Vector3(-0.3, yContact1, 0));
    points.push(new THREE.Vector3(-0.3, -rY, z_start));

    // Generación geométrica del bobinado helicoidal y simétrico
    for (let k = 0; k < totalWindingPoints; k++) {
        const corner = k % 4;
        let x, y;
        if (corner === 0) {
            x = -rX; y = -rY; // Inferior izquierda
        } else if (corner === 1) {
            x = -rX; y = rY;  // Superior izquierda
        } else if (corner === 2) {
            x = rX; y = rY;   // Superior derecha
        } else {
            x = rX; y = -rY;  // Inferior derecha
        }

        // El avance en Z se distribuye simétricamente en cada segmento de espira
        const z = (k - (totalWindingPoints - 1) / 2) * (dz_effective / 4);
        points.push(new THREE.Vector3(x, y, z));
    }

    // Terminal 2: Conexión desde el final de la bobina hacia el contacto derecho
    points.push(new THREE.Vector3(0.3, -rY, z_end));
    points.push(new THREE.Vector3(0.3, yContact2, 0));
    points.push(new THREE.Vector3(1.2, yContact2, 0));

    const curve = new THREE.CurvePath();
    for (let i = 0; i < points.length - 1; i++) {
        curve.add(new THREE.LineCurve3(points[i], points[i + 1]));
    }
    // Resolución del tubo proporcional al número de vueltas N para mantener fluidez visual
    const numSegments = Math.max(64, state.N * 40);
    const tubeGeom = new THREE.TubeGeometry(curve, numSegments, 0.12, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }); // Cobre
    coilMesh = new THREE.Mesh(tubeGeom, tubeMat);
    rotorGroup.add(coilMesh);
}

// Contactos: Anillos Colectores (AC) 
const acGroup = new THREE.Group();
const ringGeom = new THREE.TorusGeometry(1.2, 0.25, 8, 32); // Aumentado el tamaño
const brassMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.8, side: THREE.DoubleSide });
const ring1 = new THREE.Mesh(ringGeom, brassMat);
ring1.rotation.x = Math.PI / 2;
ring1.position.y = -5.2;
const ring2 = ring1.clone();
ring2.position.y = -6.0;
acGroup.add(ring1, ring2);
rotorGroup.add(acGroup);

// Contactos: Conmutador de dos delgas (DC) 
const dcGroup = new THREE.Group();
const delgaGeom1 = new THREE.CylinderGeometry(1.2, 1.2, 1.0, 16, 1, true, 0, Math.PI * 0.85); // Aumentado el tamaño
const delgaGeom2 = new THREE.CylinderGeometry(1.2, 1.2, 1.0, 16, 1, true, Math.PI * 1.05, Math.PI * 0.85);
const delga1 = new THREE.Mesh(delgaGeom1, brassMat);
const delga2 = new THREE.Mesh(delgaGeom2, brassMat);
dcGroup.add(delga1, delga2);
dcGroup.position.y = -5.6;
dcGroup.rotation.y = Math.PI / 2; // Alinear las delgas con el desfase físico de la bobina
rotorGroup.add(dcGroup);

function updateContactsVisibility() {
    if (state.mode === 'AC') {
        acGroup.visible = true;
        dcGroup.visible = false;
        escobilla1.position.set(-1.5, -5.2, 0); // Ajustadas al nuevo radio
        escobilla2.position.set(1.5, -6.0, 0);
    } else {
        acGroup.visible = false;
        dcGroup.visible = true;
        escobilla1.position.set(-1.5, -5.6, 0); // Ajustadas al nuevo radio
        escobilla2.position.set(1.5, -5.6, 0);
    }
    rebuildWires();
}

function updateMagnetScale() {
    const halfDist = CONFIG.magnetDistance / 2;

    // Imán Izquierdo (centrado en -halfDist)
    leftMagnetS.position.set(-halfDist - 1.0, 0, 0);
    leftMagnetN.position.set(-halfDist + 1.0, 0, 0);

    // Imán Derecho (centrado en halfDist)
    rightMagnetS.position.set(halfDist - 1.0, 0, 0);
    rightMagnetN.position.set(halfDist + 1.0, 0, 0);

    updateFieldLines();
}

// Inicialización geométrica estática y dinámica
rebuildCoil();
updateContactsVisibility();
updateMagnetScale();

// --- Configuración de las Gráficas con Chart.js ---
const graphCanvas = document.getElementById('graph-canvas');
const graphCtx = graphCanvas.getContext('2d');
const fluxCanvas = document.getElementById('flux-canvas');
const fluxCtx = fluxCanvas.getContext('2d');
const maxPoints = 200; // Puntos fijos en pantalla para una onda limpia y óptimo rendimiento
const simulationHistory = [];
let lastHistoryTime = 0.0;
const historyMaxDuration = 5.0; // Mantener 5 segundos de historial para remuestreo dinámico

// Obtener tamaño de fuente para los ticks del gráfico desde la variable CSS :root
const cssStyle = getComputedStyle(document.documentElement);
const tickSizeStr = cssStyle.getPropertyValue('--fs-plot-ticks').trim();
const plotTickSize = tickSizeStr.endsWith('rem') ? parseFloat(tickSizeStr) * 16 : parseFloat(tickSizeStr) || 10;

const labelSizeStr = cssStyle.getPropertyValue('--fs-plot-labels').trim();
const plotLabelSize = labelSizeStr.endsWith('rem') ? parseFloat(labelSizeStr) * 16 : parseFloat(labelSizeStr) || 11;

const chartData = Array(maxPoints).fill(0);
const fluxChartData = Array(maxPoints).fill(0);

// Inicializar el historial con un punto inicial para evitar arreglos vacíos
simulationHistory.push({
    time: 0.0,
    voltage: 0.0,
    flux: state.N * state.B * state.coilArea
});

// Gráfica 1: Voltaje vs Tiempo
const physicsChart = new Chart(graphCtx, {
    type: 'line',
    data: {
        labels: Array(maxPoints).fill(''),
        datasets: [{
            label: 'Voltaje Inducido (V)',
            data: chartData,
            borderColor: '#0284c7',
            borderWidth: 2.5,
            fill: true,
            backgroundColor: 'rgba(2, 132, 199, 0.06)',
            pointRadius: 0,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    display: true,
                    color: '#64748b',
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 6,
                    font: {
                        family: 'Outfit',
                        size: plotTickSize
                    }
                },
                title: {
                    display: true,
                    text: CONFIG.plotLabels.x,
                    color: '#64748b',
                    font: {
                        family: 'Outfit',
                        size: plotLabelSize,
                        weight: 'bold'
                    }
                }
            },
            y: {
                min: -2,
                max: 2,
                grid: {
                    color: 'rgba(0, 0, 0, 0.04)'
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        family: 'Outfit',
                        size: plotTickSize
                    }
                },
                title: {
                    display: true,
                    text: CONFIG.plotLabels.y,
                    color: '#64748b',
                    font: {
                        family: 'Outfit',
                        size: plotLabelSize,
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

// Gráfica 2: Flujo Magnético vs Tiempo (Línea violeta premium)
const fluxChart = new Chart(fluxCtx, {
    type: 'line',
    data: {
        labels: Array(maxPoints).fill(''),
        datasets: [{
            label: 'Flujo Magnético (Wb)',
            data: fluxChartData,
            borderColor: '#8b5cf6', // Violet 500
            borderWidth: 2.5,
            fill: true,
            backgroundColor: 'rgba(139, 92, 246, 0.06)',
            pointRadius: 0,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    display: true,
                    color: '#64748b',
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 6,
                    font: {
                        family: 'Outfit',
                        size: plotTickSize
                    }
                },
                title: {
                    display: true,
                    text: CONFIG.fluxLabels.x,
                    color: '#64748b',
                    font: {
                        family: 'Outfit',
                        size: plotLabelSize,
                        weight: 'bold'
                    }
                }
            },
            y: {
                min: -2,
                max: 2,
                grid: {
                    color: 'rgba(0, 0, 0, 0.04)'
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        family: 'Outfit',
                        size: plotTickSize
                    }
                },
                title: {
                    display: true,
                    text: CONFIG.fluxLabels.y,
                    color: '#64748b',
                    font: {
                        family: 'Outfit',
                        size: plotLabelSize,
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

function drawGraph(maxV) {
    if (state.mode === 'AC') {
        physicsChart.data.datasets[0].borderColor = '#0284c7';
        physicsChart.data.datasets[0].backgroundColor = 'rgba(2, 132, 199, 0.06)';
    } else {
        physicsChart.data.datasets[0].borderColor = '#ea580c';
        physicsChart.data.datasets[0].backgroundColor = 'rgba(234, 88, 12, 0.06)';
    }

    if (!state.autoplay) {
        if (state.mode === 'AC') {
            physicsChart.options.scales.y.min = CONFIG.fixedMinV;
        } else {
            // En modo DC, usamos un pequeño margen negativo basado en fixedMinV para visibilidad del eje cero
            physicsChart.options.scales.y.min = CONFIG.fixedMinV * 0.05;
        }
        physicsChart.options.scales.y.max = CONFIG.fixedMaxV;
    } else {
        if (state.mode === 'AC') {
            physicsChart.options.scales.y.min = -maxV * 1.1 - 0.1;
        } else {
            physicsChart.options.scales.y.min = -maxV * 0.1 - 0.1;
        }
        physicsChart.options.scales.y.max = maxV * 1.1 + 0.1;
    }

    physicsChart.update('none');
}

function drawFluxGraph(maxFlux) {
    // El flujo máximo (NBA) no depende de la velocidad angular (omega). Por lo tanto,
    // escalamos siempre dinámicamente los límites del gráfico para que la curva sea siempre visible.
    fluxChart.options.scales.y.min = -maxFlux * 1.1 - 0.1;
    fluxChart.options.scales.y.max = maxFlux * 1.1 + 0.1;

    fluxChart.update('none');
}

// --- Lógica de Interacción 3D: Arrastre manual de la bobina ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const planeXZ = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let lastMouseAngle = 0;
let prevTheta = 0.0;

// Escuchar eventos de puntero en el canvas de Three.js
container.addEventListener('pointerdown', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(rotorGroup.children, true);

    if (intersects.length > 0) {
        state.isDraggingCoil = true;
        controls.enabled = false;
        renderer.domElement.style.cursor = 'grabbing';

        // Detener autoplay si está activo
        if (state.autoplay) {
            state.autoplay = false;
            autoplayToggle.checked = false;
        }

        const intersectionPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(planeXZ, intersectionPoint)) {
            lastMouseAngle = Math.atan2(intersectionPoint.z, intersectionPoint.x);
        }
        e.preventDefault();
    }
});

container.addEventListener('pointermove', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (state.isDraggingCoil) {
        const currentIntersectionPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(planeXZ, currentIntersectionPoint)) {
            const currentMouseAngle = Math.atan2(currentIntersectionPoint.z, currentIntersectionPoint.x);
            let deltaAngle = currentMouseAngle - lastMouseAngle;

            // Manejar salto de -PI a PI
            if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
            if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

            state.theta -= deltaAngle;
            lastMouseAngle = currentMouseAngle;
        }
    } else {
        // Detectar si pasa por encima de la bobina o conmutador para cambiar cursor a grab
        const intersects = raycaster.intersectObjects(rotorGroup.children, true);
        if (intersects.length > 0) {
            renderer.domElement.style.cursor = 'grab';
        } else {
            renderer.domElement.style.cursor = 'auto';
        }
    }
});

const endCoilDrag = () => {
    if (state.isDraggingCoil) {
        state.isDraggingCoil = false;
        controls.enabled = true;
        renderer.domElement.style.cursor = 'auto';
    }
};

container.addEventListener('pointerup', endCoilDrag);
container.addEventListener('pointercancel', endCoilDrag);
container.addEventListener('pointerleave', endCoilDrag);

// --- Bucle de Animación y Física ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    // Capturar variables al inicio del frame para interpolación temporal de la gráfica
    const timeStart = state.time;
    const thetaStart = state.theta;
    const omegaStart = state.omega;

    const dt = clock.getDelta();
    const dt_clamped = Math.max(0.001, dt);

    // Incrementar tiempo transcurrido para la gráfica
    state.time += dt;

    if (state.isDraggingCoil) {
        const rawOmega = (state.theta - prevTheta) / dt_clamped;
        // Filtro de paso bajo para suavizar la velocidad angular calculada
        state.omega = state.omega * 0.7 + rawOmega * 0.3;
        prevTheta = state.theta;
        rotorGroup.rotation.y = state.theta - Math.PI / 2; // Offset físico para que theta=0 sea perpendicular al campo B
    } else if (state.autoplay) {
        state.omega = state.omegaSlider;
        state.theta += state.omega * dt;
        rotorGroup.rotation.y = state.theta - Math.PI / 2; // Offset físico para que theta=0 sea perpendicular al campo B
        prevTheta = state.theta;
    } else {
        // Desacelerar suavemente o poner a 0 si no se está arrastrando
        state.omega = state.omega * 0.8;
        if (Math.abs(state.omega) < 0.01) state.omega = 0.0;
        rotorGroup.rotation.y = state.theta - Math.PI / 2; // Offset físico para que theta=0 sea perpendicular al campo B
        prevTheta = state.theta;
    }

    const timeEnd = state.time;
    const thetaEnd = state.theta;
    const omegaEnd = state.omega;

    // Evitar acumulaciones excesivas si el juego se pausa o la pestaña queda en segundo plano (más de 0.5s)
    if (timeEnd - lastHistoryTime > 0.5) {
        lastHistoryTime = timeEnd;
    }

    const totalFrameDt = timeEnd - timeStart;
    const historyDt = 0.002; // Alta resolución de 2 ms para el historial

    // Registrar muestras físicas constantes en el historial
    while (lastHistoryTime + historyDt <= timeEnd) {
        lastHistoryTime += historyDt;

        const fraction = totalFrameDt > 0.0001 ? (lastHistoryTime - timeStart) / totalFrameDt : 1.0;
        const interpTheta = thetaStart + (thetaEnd - thetaStart) * fraction;
        const interpOmega = omegaStart + (omegaEnd - omegaStart) * fraction;

        let valV = state.N * state.B * state.coilArea * interpOmega * Math.sin(interpTheta);
        if (state.mode === 'DC') {
            valV = Math.abs(valV);
        }

        const valFlux = state.N * state.B * state.coilArea * Math.cos(interpTheta);

        simulationHistory.push({
            time: lastHistoryTime,
            voltage: valV,
            flux: valFlux
        });
    }

    // Podar el historial para conservar solo los últimos 5 segundos
    while (simulationHistory.length > 0 && timeEnd - simulationHistory[0].time > historyMaxDuration) {
        simulationHistory.shift();
    }

    // Calcular la ventana de tiempo a mostrar W basada en la rapidez angular actual
    let W = 3.0; // Ventana por defecto para velocidad baja o modo manual
    if (state.autoplay) {
        const absOmega = Math.abs(state.omega);
        if (absOmega > 4.0) {
            W = Math.max(0.25, 12.0 / absOmega); // Mostrar entre 2 y 3 ciclos en autoplay
        }
    }

    // Rellenar las gráficas remuestreando el historial con interpolación lineal
    let historyIdx = 0;
    const tStart = timeEnd - W;
    const tStep = W / (maxPoints - 1);

    for (let i = 0; i < maxPoints; i++) {
        const tTarget = tStart + i * tStep;

        // Avanzar puntero en el historial
        while (historyIdx < simulationHistory.length - 1 && simulationHistory[historyIdx + 1].time < tTarget) {
            historyIdx++;
        }

        let valV = 0;
        let valFlux = 0;

        if (simulationHistory.length === 0) {
            valV = 0;
            valFlux = 0;
        } else if (tTarget <= simulationHistory[0].time) {
            valV = simulationHistory[0].voltage;
            valFlux = simulationHistory[0].flux;
        } else if (tTarget >= simulationHistory[simulationHistory.length - 1].time) {
            valV = simulationHistory[simulationHistory.length - 1].voltage;
            valFlux = simulationHistory[simulationHistory.length - 1].flux;
        } else {
            // Interpolación lineal
            const p0 = simulationHistory[historyIdx];
            const p1 = simulationHistory[historyIdx + 1];
            const t0 = p0.time;
            const t1 = p1.time;
            const f = (t1 - t0) > 0.00001 ? (tTarget - t0) / (t1 - t0) : 0.0;
            valV = p0.voltage + (p1.voltage - p0.voltage) * f;
            valFlux = p0.flux + (p1.flux - p0.flux) * f;
        }

        chartData[i] = valV;
        fluxChartData[i] = valFlux;
        physicsChart.data.labels[i] = tTarget.toFixed(2);
        fluxChart.data.labels[i] = tTarget.toFixed(2);
    }

    // Cálculo matemático de la FEM inducida en el estado actual
    const maxV = state.N * state.B * state.coilArea * Math.abs(state.omega);
    let currentV = state.N * state.B * state.coilArea * state.omega * Math.sin(state.theta);

    if (state.mode === 'DC') {
        currentV = Math.abs(currentV);
    }

    const maxFlux = state.N * state.B * state.coilArea;

    // Renderizar y actualizar escalas de la gráfica en pantalla
    drawGraph(maxV);
    drawFluxGraph(maxFlux);

    // El brillo y la intensidad luminosa del foco es proporcional al voltaje instantáneo inducido (y por ende a N, B, A, omega)
    // Para que escale de forma continua e interactiva en todo el rango dinámico de variables, normalizamos el voltaje
    // actual contra el máximo voltaje teórico posible y aplicamos una curva de potencia perceptiva (raíz cuadrada).
    const maxPossibleV = CONFIG.maxN * CONFIG.maxB * CONFIG.maxArea * CONFIG.maxOmega;
    const voltageRatio = maxPossibleV > 0 ? Math.abs(currentV) / maxPossibleV : 0;
    const brightnessFactor = Math.pow(voltageRatio, 0.5); // Ley de potencia de Stevens para percepción de brillo

    bulbMat.emissiveIntensity = brightnessFactor * 12.0;
    bulbLight.intensity = brightnessFactor * 15.0;

    controls.update();
    renderer.render(scene, camera);
}

// Ajuste dinámico ante redimensionamiento de ventana
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// --- Lógica de Paneles de Gráficas Flotantes (Arrastrar, Redimensionar en 8 Direcciones, Minimizar, Maximizar) ---
function makePanelInteractive(panelId, chart) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const header = panel.querySelector('.panel-header');
    const btnMin = panel.querySelector('.btn-minimize');
    const btnMax = panel.querySelector('.btn-maximize');

    let isDragging = false;
    let isResizing = false;
    let startX, startY;
    let startLeft, startTop;
    let startWidth, startHeight;

    // Traer al frente el panel clickeado
    panel.addEventListener('mousedown', () => {
        document.querySelectorAll('.floating-panel').forEach(p => {
            p.style.zIndex = '20';
        });
        panel.style.zIndex = '21';
    });

    // Arrastrar (Drag) a través de la cabecera
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.panel-controls')) return; // No arrastrar al hacer clic en controles
        if (panel.classList.contains('maximized')) return; // No arrastrar si está maximizado

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        panel.style.transition = 'none';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let left = startLeft + dx;
        let top = startTop + dy;

        const rect = panel.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width;
        const maxTop = window.innerHeight - rect.height;

        left = Math.max(0, Math.min(left, maxLeft));
        top = Math.max(0, Math.min(top, maxTop));

        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    }

    function onMouseUp() {
        isDragging = false;
        panel.style.transition = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // Redimensionar (Resize) en 8 direcciones
    const resizers = panel.querySelectorAll('.resizer');

    resizers.forEach(r => {
        r.addEventListener('mousedown', (e) => {
            if (panel.classList.contains('minimized') || panel.classList.contains('maximized')) return;

            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = panel.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = rect.left;
            startTop = rect.top;

            const currentResizer = e.target;

            panel.style.transition = 'none';

            function onResizeMouseMove(e) {
                if (!isResizing) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                // Modificar dimensiones según el tirador
                if (currentResizer.classList.contains('resizer-r') || currentResizer.classList.contains('resizer-tr') || currentResizer.classList.contains('resizer-br')) {
                    newWidth = startWidth + dx;
                }
                if (currentResizer.classList.contains('resizer-l') || currentResizer.classList.contains('resizer-tl') || currentResizer.classList.contains('resizer-bl')) {
                    newWidth = startWidth - dx;
                    newLeft = startLeft + dx;
                }
                if (currentResizer.classList.contains('resizer-b') || currentResizer.classList.contains('resizer-bl') || currentResizer.classList.contains('resizer-br')) {
                    newHeight = startHeight + dy;
                }
                if (currentResizer.classList.contains('resizer-t') || currentResizer.classList.contains('resizer-tl') || currentResizer.classList.contains('resizer-tr')) {
                    newHeight = startHeight - dy;
                    newTop = startTop + dy;
                }

                // Límites mínimos
                const minW = 280;
                const minH = 160;

                if (newWidth < minW) {
                    if (newLeft !== startLeft) {
                        newLeft = startLeft + (startWidth - minW);
                    }
                    newWidth = minW;
                }
                if (newHeight < minH) {
                    if (newTop !== startTop) {
                        newTop = startTop + (startHeight - minH);
                    }
                    newHeight = minH;
                }

                // Límites de la ventana del navegador
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - newWidth));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - newHeight));

                panel.style.width = `${newWidth}px`;
                panel.style.height = `${newHeight}px`;
                panel.style.left = `${newLeft}px`;
                panel.style.top = `${newTop}px`;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';

                if (chart) {
                    chart.resize();
                }
            }

            function onResizeMouseUp() {
                isResizing = false;
                panel.style.transition = '';
                document.removeEventListener('mousemove', onResizeMouseMove);
                document.removeEventListener('mouseup', onResizeMouseUp);
            }

            document.addEventListener('mousemove', onResizeMouseMove);
            document.addEventListener('mouseup', onResizeMouseUp);
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Iconos SVG reutilizables
    const svgMinus = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const svgPlus = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const svgMaximize = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;
    const svgRestore = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="4" width="12" height="12" rx="1.5"></rect><path d="M4 8v10a2 2 0 0 0 2 2h10"></path></svg>`;

    // Minimizar / Restaurar
    btnMin.addEventListener('click', () => {
        if (panel.classList.contains('maximized')) {
            panel.classList.remove('maximized');
            btnMax.innerHTML = svgMaximize;
            btnMax.title = 'Maximizar';
        }

        const isMin = panel.classList.toggle('minimized');
        btnMin.innerHTML = isMin ? svgPlus : svgMinus;
        btnMin.title = isMin ? 'Restaurar' : 'Minimizar';

        setTimeout(() => {
            if (chart) chart.resize();
        }, 300);
    });

    // Maximizar / Restaurar
    btnMax.addEventListener('click', () => {
        if (panel.classList.contains('minimized')) {
            panel.classList.remove('minimized');
            btnMin.innerHTML = svgMinus;
            btnMin.title = 'Minimizar';
        }

        const isMax = panel.classList.toggle('maximized');
        btnMax.innerHTML = isMax ? svgRestore : svgMaximize;
        btnMax.title = isMax ? 'Restaurar' : 'Maximizar';

        setTimeout(() => {
            if (chart) chart.resize();
        }, 300);
    });
}

// Inicializar interactividad para ambos paneles
makePanelInteractive('plot-panel', physicsChart);
makePanelInteractive('flux-panel', fluxChart);
animate();