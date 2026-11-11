/**
 * Simulador: Efecto Fotoeléctrico (3D Premium)
 * Cada fotón lleva su energía individual. Efectos de Glow e Impacto.
 */

// --- Estado y Física ---
let state = {
    wavelength: 500,
    intensity: 50,
    workFunction: 1.95,
};
window.isLightTheme = localStorage.getItem('theme') === 'light';

const CONSTANTS = {
    h: 4.136e-15,
    c: 3e17,
    electronColor: 0x00f0ff,
    impactColor: 0xffffff
};

// Textura de Glow para fotones y efectos
function createGlowTexture(colorStr = 'white') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, colorStr);
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

function wavelengthToHex(wl) {
    let r, g, b;
    if (wl < 380) { r = 0.6; g = 0; b = 1; }
    else if (wl < 440) { r = (440 - wl) / 60; g = 0; b = 1; }
    else if (wl < 490) { r = 0; g = (wl - 440) / 50; b = 1; }
    else if (wl < 510) { r = 0; g = 1; b = (510 - wl) / 20; }
    else if (wl < 580) { r = (wl - 510) / 70; g = 1; b = 0; }
    else if (wl < 645) { r = 1; g = (645 - wl) / 65; b = 0; }
    else if (wl <= 780) { r = 1; g = 0; b = 0; }
    else { r = 0.5; g = 0; b = 0; }
    return new THREE.Color(r, g, b).getHex();
}

function wavelengthToRGBString(wl) {
    let r, g, b;
    if (wl < 380) { r = 0.6; g = 0; b = 1; }
    else if (wl < 440) { r = (440 - wl) / 60; g = 0; b = 1; }
    else if (wl < 490) { r = 0; g = (wl - 440) / 50; b = 1; }
    else if (wl < 510) { r = 0; g = 1; b = (510 - wl) / 20; }
    else if (wl < 580) { r = (wl - 510) / 70; g = 1; b = 0; }
    else if (wl < 645) { r = 1; g = (645 - wl) / 65; b = 0; }
    else if (wl <= 780) { r = 1; g = 0; b = 0; }
    else { r = 0.5; g = 0; b = 0; }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

// --- Configuración Three.js ---

const canvas = document.getElementById('mainCanvas');
const wrapper = canvas.parentElement;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, wrapper.clientWidth / wrapper.clientHeight, 0.1, 1000);
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Controles de Órbita
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Efecto de inercia/suavizado
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.8;
controls.minDistance = 10;
controls.maxDistance = 100;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Luz focalizada desde el láser para coherencia visual
const laserLight = new THREE.SpotLight(wavelengthToHex(state.wavelength), 1.2);
laserLight.position.set(-15, 12, 0);
laserLight.target.position.set(0, 0, 0);
laserLight.angle = Math.PI / 8;
laserLight.penumbra = 0.3;
laserLight.decay = 1;
laserLight.distance = 60;
scene.add(laserLight);
scene.add(laserLight.target);

// Placa de Metal
const metalPlate = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.5, 24),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.2, metalness: 0.8 })
);
scene.add(metalPlate);

// Láser
const laserGrp = new THREE.Group();
laserGrp.position.set(-15, 12, 0);
laserGrp.lookAt(0, 0, 0);
scene.add(laserGrp);

const laserBody = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
);
laserBody.rotation.x = Math.PI / 2;
laserGrp.add(laserBody);


// --- Clases ---

class Photon3D {
    constructor(wavelength) {
        this.wavelength = wavelength;
        // Cada foton calcula su propia energia al nacer
        const freqHz = CONSTANTS.c / this.wavelength;
        this.energyVal = CONSTANTS.h * freqHz;
        this.colorHex = wavelengthToHex(this.wavelength);

        this.group = new THREE.Group();

        // Nucleo del foton
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        this.group.add(core);

        // Glow del foton (Sprite)
        const glowMat = new THREE.SpriteMaterial({
            map: createGlowTexture(wavelengthToRGBString(this.wavelength)),
            blending: window.isLightTheme ? THREE.NormalBlending : THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        this.glow = new THREE.Sprite(glowMat);
        this.glow.scale.set(1.5, 1.5, 1);
        this.group.add(this.glow);

        this.group.position.copy(laserGrp.position);
        this.target = new THREE.Vector3(
            (Math.random() - 0.5) * 18,
            0.25,
            (Math.random() - 0.5) * 10
        );

        this.speed = 18;
        this.alive = true;
        scene.add(this.group);
    }

    update(dt) {
        const direction = new THREE.Vector3().subVectors(this.target, this.group.position);
        if (direction.length() < 0.6) {
            this.alive = false;
            scene.remove(this.group);
            this.onImpact();
        } else {
            direction.normalize();
            this.group.position.add(direction.multiplyScalar(this.speed * dt));
        }
    }

    onImpact() {
        // Indicador de impacto visual
        impacts.push(new ImpactIndicator(this.target, this.colorHex));

        // Evaluar efecto fotoelectrico AL IMPACTAR: 1 FOTÓN = 1 ELECTRÓN
        if (this.energyVal >= state.workFunction) {
            const k = this.energyVal - state.workFunction;
            // Físicamente: Un cuanto de luz libera un solo electrón
            electrons.push(new Electron3D(this.target, k));
        }
    }
}

class Electron3D {
    constructor(pos, k) {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: window.isLightTheme ? 0x0088cc : CONSTANTS.electronColor })
        );
        this.mesh.position.copy(pos);

        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.sqrt(k) * 6;
        this.velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.random() * 4 + 2, // Componente hacia arriba (salto al vacío)
            Math.sin(angle) * speed
        );

        this.life = 1.0;
        this.alive = true;
        scene.add(this.mesh);
    }

    update(dt) {
        this.life -= dt * 0.8;
        if (this.life <= 0) {
            this.alive = false;
            scene.remove(this.mesh);
        } else {
            this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));

            // Ya no forzamos y=0.25, dejamos que suban
            this.mesh.material.transparent = true;
            this.mesh.material.opacity = this.life;
        }
    }
}

class ImpactIndicator {
    constructor(pos, colorHex) {
        // Radio interno casi igual al externo para que sea solo una circunferencia
        this.mesh = new THREE.Mesh(
            new THREE.RingGeometry(0.48, 0.5, 32),
            new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
        );
        this.mesh.position.copy(pos);
        this.mesh.position.y += 0.05;
        this.mesh.rotation.x = Math.PI / 2;
        this.life = 1.0;
        this.alive = true;
        scene.add(this.mesh);
    }

    update(dt) {
        this.life -= dt * 2;
        if (this.life <= 0) {
            this.alive = false;
            scene.remove(this.mesh);
        } else {
            this.mesh.scale.set(1 + (1 - this.life) * 2, 1 + (1 - this.life) * 2, 1);
            this.mesh.material.opacity = this.life;
        }
    }
}

// --- Animación ---

const photons = [];
const electrons = [];
const impacts = [];

let lastTime = performance.now();
let spawnTimer = 0;

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.1) return;

    spawnTimer += dt;
    // Tasa de spawn lineal: a 100% de intensidad, un fotón cada ~0.006s (150 fotones/seg)
    const maxRate = 100;
    const currentRate = (state.intensity / 100) * maxRate;
    const spawnInterval = currentRate > 0 ? 1 / currentRate : Infinity;

    while (spawnTimer > spawnInterval) {
        photons.push(new Photon3D(state.wavelength));
        spawnTimer -= spawnInterval;
    }

    photons.forEach((p, i) => { p.update(dt); if (!p.alive) photons.splice(i, 1); });
    electrons.forEach((e, i) => { e.update(dt); if (!e.alive) electrons.splice(i, 1); });
    impacts.forEach((imp, i) => { imp.update(dt); if (!imp.alive) impacts.splice(i, 1); });

    controls.update(); // Actualizar cámara según interacción
    updateUI();
    renderer.render(scene, camera);
}

function getWavelengthVisibility(wl) {
    // Rango visible humano aprox 380nm a 750nm
    if (wl < 360 || wl > 780) return 0;
    if (wl < 400) return (wl - 360) / 40; // Fade in UV
    if (wl > 720) return (780 - wl) / 60; // Fade out IR
    return 1;
}

function updateLightSystem() {
    const visibility = getWavelengthVisibility(state.wavelength);
    const baseIntensity = (state.intensity / 100) * 2;
    laserLight.intensity = baseIntensity * visibility;
}

function updateUI() {
    const freqHz = CONSTANTS.c / state.wavelength;
    const E = CONSTANTS.h * freqHz;

    const displayCurrent = electrons.length / 15;
    document.getElementById('current-display').innerText = `${displayCurrent.toFixed(2)} mA`;
    document.getElementById('current-fill').style.width = `${Math.min(100, displayCurrent * 10)}%`;
    document.getElementById('photon-energy-display').innerText = `${E.toFixed(2)} eV`;

    const tag = document.getElementById('emision-tag');
    if (E >= state.workFunction) {
        tag.innerText = "EMISIÓN ACTIVA";
        tag.style.background = "rgba(0, 240, 255, 0.1)";
        tag.style.color = "var(--accent-color)";
    } else {
        tag.innerText = "ENERGÍA INSUFICIENTE";
        tag.style.background = "rgba(255, 75, 43, 0.1)";
        tag.style.color = "#ff4b2b";
    }
}

// --- Eventos ---

window.addEventListener('resize', () => {
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    camera.aspect = wrapper.clientWidth / wrapper.clientHeight;
    camera.updateProjectionMatrix();
});

document.getElementById('wavelength-slider').addEventListener('input', (e) => {
    state.wavelength = parseInt(e.target.value);
    document.getElementById('wavelength-display').innerText = `${state.wavelength} nm`;

    // Sincronizar color de la luz focalizada
    laserLight.color.setHex(wavelengthToHex(state.wavelength));
    updateLightSystem();
});

document.getElementById('intensity-slider').addEventListener('input', (e) => {
    state.intensity = parseInt(e.target.value);
    document.getElementById('intensity-display').innerText = `${state.intensity}%`;

    // Sincronizar intensidad de la fuente de luz
    updateLightSystem();
});

document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.workFunction = parseFloat(btn.dataset.val);
    });
});

animate();

// --- Theme Toggle ---
function updateThreeJsTheme() {
    if (window.isLightTheme) {
        metalPlate.material.color.setHex(0xf0f4f8);
        metalPlate.material.metalness = 0.3; // Reduce metalness to prevent dark reflections
        laserBody.material.color.setHex(0xd0d0d0);
    } else {
        metalPlate.material.color.setHex(0x333333);
        metalPlate.material.metalness = 0.8;
        laserBody.material.color.setHex(0x111111);
    }
    const newBlending = window.isLightTheme ? THREE.NormalBlending : THREE.AdditiveBlending;
    photons.forEach(p => {
        if (p.glow) p.glow.material.blending = newBlending;
    });
    const targetElectronColor = window.isLightTheme ? 0x0088cc : CONSTANTS.electronColor;
    electrons.forEach(e => {
        if (e.mesh) e.mesh.material.color.setHex(targetElectronColor);
    });
}
updateThreeJsTheme(); // Apply initial colors

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    if (window.isLightTheme) {
        document.body.classList.add('light-theme');
        themeToggle.innerText = '🌙'; 
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        window.isLightTheme = document.body.classList.contains('light-theme');
        
        if (window.isLightTheme) {
            localStorage.setItem('theme', 'light');
            themeToggle.innerText = '🌙';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerText = '☀️';
        }
        updateThreeJsTheme();
    });
}
