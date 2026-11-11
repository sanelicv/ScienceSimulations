const waveCanvas = document.getElementById('waveCanvas');
const particleCanvas = document.getElementById('particleCanvas');
const ctxW = waveCanvas.getContext('2d');
const ctxP = particleCanvas.getContext('2d');

const wavelengthSlider = document.getElementById('wavelengthSlider');
const fluxSlider = document.getElementById('fluxSlider');
const wavelengthDisplay = document.getElementById('wavelengthDisplay');
const fluxDisplay = document.getElementById('fluxDisplay');

let width, height;
function resize() {
    width = waveCanvas.parentElement.clientWidth;
    height = waveCanvas.parentElement.clientHeight;
    waveCanvas.width = particleCanvas.width = width;
    waveCanvas.height = particleCanvas.height = height;
}
window.addEventListener('resize', resize);
resize();

let time = 0;
let particles = [];

/**
 * Converts wavelength in nanometers to an RGB color string and object.
 * Piecewise linear approximation of the visible spectrum.
 */
function wavelengthToRGB(wavelength) {
    let r, g, b, alpha;
    const wl = wavelength;

    if (wl >= 380 && wl < 440) {
        // More scientific violet: Red should be lower than Blue
        r = 0.5 * -(wl - 440) / (440 - 380);
        g = 0;
        b = 1;
    } else if (wl >= 440 && wl < 490) {
        r = 0;
        g = (wl - 440) / (490 - 440);
        b = 1;
    } else if (wl >= 490 && wl < 510) {
        r = 0;
        g = 1;
        b = -(wl - 510) / (510 - 490);
    } else if (wl >= 510 && wl < 580) {
        r = (wl - 510) / (580 - 510);
        g = 1;
        b = 0;
    } else if (wl >= 580 && wl < 645) {
        r = 1;
        g = -(wl - 645) / (645 - 580);
        b = 0;
    } else if (wl >= 645 && wl <= 780) {
        r = 1;
        g = 0;
        b = 0;
    } else {
        r = 0; g = 0; b = 0;
    }

    // Intensity falloff at the edges of visible spectrum
    if (wl >= 380 && wl < 420) alpha = 0.3 + 0.7 * (wl - 380) / (420 - 380);
    else if (wl >= 420 && wl < 700) alpha = 1.0;
    else if (wl >= 700 && wl <= 780) alpha = 0.3 + 0.7 * (780 - wl) / (780 - 700);
    else alpha = 0;

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`
    };
}

function createParticles(count) {
    const baseSpeed = 2.5; // Pixels per frame
    particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: (height / 2) + (Math.random() - 0.5) * 60,
            speed: baseSpeed,
            size: 2 + Math.random() * 4
        });
    }
}

// Initial particle creation
createParticles(parseInt(fluxSlider.value));

const infoWavelength = document.getElementById('infoWavelength');
const infoFrequency = document.getElementById('infoFrequency');
const infoEnergyJ = document.getElementById('infoEnergyJ');
const infoEnergyEv = document.getElementById('infoEnergyEv');

wavelengthSlider.oninput = () => {
    const val = wavelengthSlider.value;
    wavelengthDisplay.innerText = `${val} nm`;
    infoWavelength.innerText = `${val} nm`;
    
    // Constant definitions
    const c = 2.99792458e8;  // Speed of light (m/s)
    const h = 6.62607015e-34; // Planck's constant (J·s)
    const eV = 1.60217663e-19; // 1 eV in Joules
    
    // lambda in meters
    const lambda = val * 1e-9;
    
    // Frequency: f = c / lambda
    const freq = c / lambda;
    infoFrequency.innerText = `${(freq / 1e12).toFixed(1)} THz`;
    
    // Energy: E = h * f
    const energyJ = h * freq;
    infoEnergyJ.innerText = energyJ.toExponential(2) + ' J';
    
    // Energy in eV
    const energyEv = energyJ / eV;
    infoEnergyEv.innerText = energyEv.toFixed(2) + ' eV';
};

fluxSlider.oninput = () => {
    const val = parseInt(fluxSlider.value);
    fluxDisplay.innerText = val < 60 ? 'Baja' : val < 130 ? 'Media' : 'Alta';
    createParticles(val);
};

function drawWave() {
    ctxW.clearRect(0, 0, width, height);
    
    const wl = parseFloat(wavelengthSlider.value);
    const rgb = wavelengthToRGB(wl);
    const flux = parseInt(fluxSlider.value);
    
    // EXAGGERATED SCALING: Map 380-750nm to 20-300 pixels for a more dramatic effect
    // Formula: ( (val - min) / (max - min) ) * (newMax - newMin) + newMin
    const visualWavelength = ((wl - 380) / (750 - 380)) * (300 - 20) + 20;
    
    // PHYSICAL ACCURACY: In the classical wave model, intensity (flux) 
    // is proportional to the square of the amplitude.
    // Adjusted scaling to account for the larger range of 'flux'
    const dynamicAmplitude = 5 + (flux * 0.4);
    
    // To keep constant horizontal speed V:
    const baseSpeed = 2.5; 
    const omega = baseSpeed * (2 * Math.PI / visualWavelength);
    
    ctxW.beginPath();
    ctxW.lineWidth = 3;
    ctxW.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
    
    // Visual glow (bloom) also scales with flux
    ctxW.shadowBlur = flux / 1.5 + 5;
    ctxW.shadowColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    for (let x = 0; x < width; x++) {
        const y = height / 2 + dynamicAmplitude * Math.sin((x / visualWavelength) * 2 * Math.PI - time * omega);
        if (x === 0) ctxW.moveTo(x, y);
        else ctxW.lineTo(x, y);
    }
    ctxW.stroke();
    ctxW.shadowBlur = 0;

    // Central axis
    ctxW.beginPath();
    ctxW.strokeStyle = 'rgba(255,255,255,0.05)';
    ctxW.moveTo(0, height / 2);
    ctxW.lineTo(width, height / 2);
    ctxW.stroke();
}

function drawParticles() {
    ctxP.clearRect(0, 0, width, height);
    
    const wl = parseFloat(wavelengthSlider.value);
    const rgb = wavelengthToRGB(wl);

    particles.forEach(p => {
        // All particles now use the same speed constant
        p.x += p.speed;
        if (p.x > width) {
            p.x = -10;
            p.y = (height / 2) + (Math.random() - 0.5) * 60;
        }

        // Glow effect
        const grad = ctxP.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
        grad.addColorStop(1, 'transparent');

        ctxP.fillStyle = grad;
        ctxP.beginPath();
        ctxP.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctxP.fill();

        // Core
        ctxP.fillStyle = '#fff';
        ctxP.beginPath();
        ctxP.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctxP.fill();
    });

    // Central axis
    ctxP.beginPath();
    ctxP.strokeStyle = 'rgba(255,255,255,0.05)';
    ctxP.moveTo(0, height / 2);
    ctxP.lineTo(width, height / 2);
    ctxP.stroke();
}

/**
 * Main animation loop
 */
function animate() {
    time += 1;
    drawWave();
    drawParticles();
    requestAnimationFrame(animate);
}

// Start animation
animate();
