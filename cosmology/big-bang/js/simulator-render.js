// Cosmological Simulator Coordinator (Loop & Camera manager)
const T0 = 2.7255; // Current CMB temperature in Kelvin

let physicsData = null;
let timelineMilestones = [];
let isPlaying = false;
let simProgress = 0; // 0 to 1
let lastTime = 0;
let animationFrameId = null;
let lastNotifiedMilestoneKey = null;

// Camera configuration
const camera = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    zoom: 1,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    targetZoom: 1,
    update() {
        this.x += (this.targetX - this.x) * 0.08;
        this.y += (this.targetY - this.y) * 0.08;
        this.zoom += (this.targetZoom - this.zoom) * 0.08;
    }
};

// Canvas Setup
const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.targetX = canvas.width / 2;
    camera.targetY = canvas.height / 2;
    camera.x = camera.targetX;
    camera.y = camera.targetY;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Math equation rendering initialization
window.addEventListener('load', () => {
    initKaTeX();
    if (window.lucide) lucide.createIcons();
    // Start with initial solver run
    initSimulation();
    updateSimulationFrame();
});
setTimeout(() => {
    initKaTeX();
    if (window.lucide) lucide.createIcons();
}, 100);

// Milestone state flags
const milestonesReached = {
    bbnBegins: false,
    bbnEnds: false,
    recombinationBegins: false,
    cmbDecouples: false,
    recombinationEnds: false,
    firstStars: false,
    firstGalaxies: false,
    firstPlanets: false,
    firstEarthlyPlanets: false,
    presentDay: false
};

// Physics Solver Initialization
function initSimulation() {
    const Rm = parseFloat(sliderRm.value);
    const RL = parseFloat(sliderRl.value);
    physicsData = simulateUniverseCreator(Rm, RL);

    // Build dynamic timeline milestones
    const ms = physicsData.milestones;
    const SECONDS_PER_YEAR = 31557600;
    const tStart = 1.0 / SECONDS_PER_YEAR; // Hard starting time at exactly 1.0 second
    const tEnd = ms.presentDay.cosmicTimeYears;

    // Set slider range to normalized progress bounds
    timelineRange.min = 0;
    timelineRange.max = 1000;
    timelineRange.step = 1;

    const potentialMilestones = [
        { name: 'Early Universe', key: 'start', t: tStart, scaleFactor: 1e-10 },
        { name: 'BBN Begins', key: 'bbnBegins', t: ms.bbnBegins.cosmicTimeYears, scaleFactor: ms.bbnBegins.scaleFactor },
        { name: 'BBN Ends', key: 'bbnEnds', t: ms.bbnEnds.cosmicTimeYears, scaleFactor: ms.bbnEnds.scaleFactor },
        { name: 'Recombination Begins', key: 'recombinationBegins', t: ms.recombinationBegins.cosmicTimeYears, scaleFactor: ms.recombinationBegins.scaleFactor },
        { name: 'CMB Decoupling', key: 'cmbDecouples', t: ms.cmbDecouples.cosmicTimeYears, scaleFactor: ms.cmbDecouples.scaleFactor },
        { name: 'Recombination Ends', key: 'recombinationEnds', t: ms.recombinationEnds.cosmicTimeYears, scaleFactor: ms.recombinationEnds.scaleFactor },
        { name: 'First Stars', key: 'firstStars', t: ms.firstStars.cosmicTimeYears, scaleFactor: ms.firstStars.scaleFactor },
        { name: 'First Galaxies', key: 'firstGalaxies', t: ms.firstGalaxies.cosmicTimeYears, scaleFactor: ms.firstGalaxies.scaleFactor },
        { name: 'First Planets', key: 'firstPlanets', t: ms.firstPlanets.cosmicTimeYears, scaleFactor: ms.firstPlanets.scaleFactor },
        { name: 'First Earthly Planets', key: 'firstEarthlyPlanets', t: ms.firstEarthlyPlanets.cosmicTimeYears, scaleFactor: ms.firstEarthlyPlanets.scaleFactor },
        { name: 'Present Day', key: 'presentDay', t: tEnd, scaleFactor: 1.0 }
    ];

    // Filter out "Never" or null milestones, milestones that occur after Present Day, and milestones that happen before the 1.0 second start time
    const rawActive = potentialMilestones.filter(m => {
        if (m.t === "Never" || m.t === null || isNaN(m.t)) return false;
        if (m.scaleFactor === "Never" || m.scaleFactor === null) return false;
        const sf = parseFloat(m.scaleFactor);
        if (m.key !== 'presentDay' && !isNaN(sf) && sf > 1.0) return false;
        if (m.key !== 'start' && m.t < tStart) return false;
        return true;
    });

    // Sort chronologically by physical time
    rawActive.sort((a, b) => a.t - b.t);

    // Ensure strictly non-decreasing order
    for (let i = 1; i < rawActive.length; i++) {
        if (rawActive[i].t < rawActive[i - 1].t) {
            rawActive[i].t = rawActive[i - 1].t;
        }
    }

    // Deduplicate identical or extremely close milestone times to prevent slider freezing
    const active = [];
    rawActive.forEach(m => {
        if (active.length === 0) {
            active.push(m);
        } else {
            const prev = active[active.length - 1];
            if (Math.abs(m.t - prev.t) / prev.t > 1e-4) {
                active.push(m);
            }
        }
    });

    // Update the properties in ms to maintain consistency
    for (let key in ms) {
        if (ms[key] && ms[key].cosmicTimeYears !== "Never" && ms[key].cosmicTimeYears !== null) {
            if (ms[key].cosmicTimeYears < tStart) ms[key].cosmicTimeYears = tStart;
            if (ms[key].cosmicTimeYears > tEnd) ms[key].cosmicTimeYears = tEnd;
        }
    }

    // Distribute progress `p` evenly among these active milestones
    const count = active.length;
    timelineMilestones = active.map((m, index) => {
        return {
            name: m.name,
            key: m.key,
            t: m.t,
            p: index / (count - 1)
        };
    });

    setupParticles(physicsData.bbn.heliumPercentageBBN);
    stars = [];
    planets = [];
    galaxyStars = [];
    starCenters = [];
    otherClusters = [];
    collapsingSystems = [];
    lastNotifiedMilestoneKey = null;

    for (let key in milestonesReached) {
        milestonesReached[key] = false;
    }
}

// Play/Pause Action triggers
btnStart.addEventListener('click', () => {
    if (isPlaying) {
        pauseSimulation();
    } else {
        playSimulation();
    }
});

function playSimulation() {
    if (simProgress >= 1.0) {
        simProgress = 0;
        timelineRange.value = 0;
        initSimulation();
    }
    isPlaying = true;
    if (window.lucide) {
        btnStart.innerHTML = '<i data-lucide="pause"></i>';
        lucide.createIcons();
    } else {
        btnStart.innerText = "⏸";
    }
    btnStart.title = "Pause Simulation";
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(loop);
}

function pauseSimulation() {
    isPlaying = false;
    if (window.lucide) {
        btnStart.innerHTML = '<i data-lucide="play"></i>';
        lucide.createIcons();
    } else {
        btnStart.innerText = "▶";
    }
    btnStart.title = "Start Simulation";
    cancelAnimationFrame(animationFrameId);
}

// Timeline Scrubbing Event Listener
timelineRange.addEventListener('input', () => {
    if (isPlaying) {
        pauseSimulation();
    }
    simProgress = parseFloat(timelineRange.value) / 1000;
    updateSimulationFrame();
});

// Balanced Pacing Timeline Mapping (Option 1)
function getCosmicTimeFromProgress(p) {
    if (timelineMilestones.length === 0) return 0;

    for (let i = 0; i < timelineMilestones.length - 1; i++) {
        const m1 = timelineMilestones[i];
        const m2 = timelineMilestones[i + 1];
        if (p >= m1.p && p <= m2.p) {
            const w = (p - m1.p) / (m2.p - m1.p);
            const log_t = Math.log(m1.t) + w * (Math.log(m2.t) - Math.log(m1.t));
            return Math.exp(log_t);
        }
    }
    return timelineMilestones[timelineMilestones.length - 1].t;
}

// Translate physical cosmic time back to timeline progress (0.0 to 1.0)
function getProgressFromCosmicTime(t) {
    if (timelineMilestones.length === 0) return 0;
    const tMin = timelineMilestones[0].t;
    const tMax = timelineMilestones[timelineMilestones.length - 1].t;

    if (t <= tMin) return 0;
    if (t >= tMax) return 1.0;

    for (let i = 0; i < timelineMilestones.length - 1; i++) {
        const m1 = timelineMilestones[i];
        const m2 = timelineMilestones[i + 1];
        if (t >= m1.t && t <= m2.t) {
            const log_t = Math.log(t);
            const log_t1 = Math.log(m1.t);
            const log_t2 = Math.log(m2.t);
            const w = (log_t2 - log_t1) > 0 ? (log_t - log_t1) / (log_t2 - log_t1) : 0;
            return m1.p + w * (m2.p - m1.p);
        }
    }
    return 1.0;
}

// Get cosmological epoch name based on actual physical cosmic time
function getEpochName(t, currentPhys) {
    if (!physicsData) return "--";
    const SECONDS_PER_YEAR = 31557600;
    const t_lepton_end = 10.0 / SECONDS_PER_YEAR;

    if (t < t_lepton_end) {
        return "Lepton Epoch";
    }

    const a = currentPhys ? currentPhys.scaleFactor : getInstantaneousPhysicalAttributes(t).scaleFactor;

    const omegaR = physicsData.deducedParametersToday.omegaRadiationToday;
    const omegaM = physicsData.deducedParametersToday.omegaMatterToday;
    const omegaL = physicsData.deducedParametersToday.omegaLambdaToday;

    const rhoR = omegaR / Math.pow(a, 4);
    const rhoM = omegaM / Math.pow(a, 3);
    const rhoL = omegaL;

    if (rhoR >= rhoM && rhoR >= rhoL) {
        return "Radiation Epoch";
    } else if (rhoM >= rhoR && rhoM >= rhoL) {
        return "Matter Epoch";
    } else {
        return "Dark Energy Epoch";
    }
}

// Main Frame Update Function (shared by playing and scrubbing)
function updateSimulationFrame() {
    const tCurrent = getCosmicTimeFromProgress(simProgress);

    // Update timeline progress bar value and track color gradient
    timelineRange.value = Math.round(simProgress * 1000);
    const valPct = simProgress * 100;
    timelineRange.style.background = `linear-gradient(to right, #3498db 0%, #3498db ${valPct}%, rgba(255, 255, 255, 0.1) ${valPct}%, rgba(255, 255, 255, 0.1) 100%)`;

    const currentPhys = getInstantaneousPhysicalAttributes(tCurrent);
    const realEpochName = getEpochName(tCurrent, currentPhys);
    updateHUD(tCurrent, currentPhys.temperatureKelvin, currentPhys.scaleFactor, realEpochName);
    checkMilestoneTransitions(tCurrent);

    // Trigger notification when crossing milestone boundary (works scrubbing both forward/backward)
    let passedMilestone = null;
    for (let i = 0; i < timelineMilestones.length; i++) {
        if (simProgress >= timelineMilestones[i].p) {
            passedMilestone = timelineMilestones[i];
        }
    }
    if (passedMilestone && passedMilestone.key !== lastNotifiedMilestoneKey) {
        lastNotifiedMilestoneKey = passedMilestone.key;
        let detailsHtml = `
            <span><strong>t:</strong> ${formatTime(tCurrent, 3)}</span>
            <span>&bull;</span>
            <span><strong>Temp:</strong> ${formatTemperature(currentPhys.temperatureKelvin)}</span>
            <span>&bull;</span>
            <span><strong>a:</strong> ${formatScientificHTML(currentPhys.scaleFactor, 4)}</span>
        `;
        if (passedMilestone.key === 'presentDay') {
            const omegaMVal = physicsData.deducedParametersToday.omegaMatterToday;
            const omegaLVal = physicsData.deducedParametersToday.omegaLambdaToday;
            detailsHtml += `
                <span>&bull;</span>
                <span><strong>&Omega;<sub>M</sub>:</strong> ${omegaMVal.toFixed(4)}</span>
                <span>&bull;</span>
                <span><strong>&Omega;<sub>&Lambda;</sub>:</strong> ${omegaLVal.toFixed(4)}</span>
            `;
        }
        showNotification(passedMilestone.name, detailsHtml);
    }

    let currentMilestone = null;
    let localProgress = 0;

    for (let i = 0; i < timelineMilestones.length - 1; i++) {
        const m1 = timelineMilestones[i];
        const m2 = timelineMilestones[i + 1];
        if (simProgress >= m1.p && simProgress <= m2.p) {
            currentMilestone = m1;
            localProgress = (m2.p - m1.p) > 0 ? (simProgress - m1.p) / (m2.p - m1.p) : 0;
            break;
        }
    }

    if (!currentMilestone && timelineMilestones.length > 0) {
        currentMilestone = timelineMilestones[timelineMilestones.length - 1];
        localProgress = 1.0;
    }

    const key = currentMilestone ? currentMilestone.key : 'start';

    updateCamera(key, localProgress);
    updateAndRender(key, localProgress, tCurrent);
}

// Main Playing Loop
function loop(timestamp) {
    if (!isPlaying) return;

    const dt = timestamp - lastTime;
    lastTime = timestamp;

    simProgress += dt / simDuration;
    if (simProgress >= 1.0) {
        simProgress = 1.0;
        updateSimulationFrame();
        pauseSimulation();
        return;
    }

    updateSimulationFrame();
    animationFrameId = requestAnimationFrame(loop);
}

// Logarithmic Interpolation between milestones
function getInstantaneousPhysicalAttributes(t) {
    const ms = physicsData.milestones;
    const SECONDS_PER_YEAR = 31557600;
    const tStart = 1.0 / SECONDS_PER_YEAR;
    const tEnd = ms.presentDay.cosmicTimeYears;

    const getVal = (mObj) => {
        if (!mObj || mObj.cosmicTimeYears === "Never") {
            return tEnd;
        }
        return mObj.cosmicTimeYears;
    };

    // Calculate t = 1.0s boundary properties dynamically
    const H0_s = 67.4 * 3.24078e-20;
    const omegaR = physicsData.deducedParametersToday.omegaRadiationToday;
    const a_start = Math.sqrt(2.0 * H0_s * Math.sqrt(omegaR));
    const T_start_K = T0 / a_start;

    const list = [
        { name: 'Early Universe', t: tStart, T: T_start_K, a: a_start }
    ];

    const potential = [
        { name: 'BBN Begins', t: ms.bbnBegins.cosmicTimeYears, T: ms.bbnBegins.temperatureKelvin, a: ms.bbnBegins.scaleFactor },
        { name: 'BBN Ends', t: ms.bbnEnds.cosmicTimeYears, T: ms.bbnEnds.temperatureKelvin, a: ms.bbnEnds.scaleFactor },
        { name: 'Recombination Begins', t: ms.recombinationBegins.cosmicTimeYears, T: ms.recombinationBegins.temperatureKelvin, a: ms.recombinationBegins.scaleFactor },
        { name: 'CMB Decoupling', t: getVal(ms.cmbDecouples), T: ms.cmbDecouples.temperatureKelvin || T0, a: ms.cmbDecouples.scaleFactor || 1 },
        { name: 'Recombination Ends', t: ms.recombinationEnds.cosmicTimeYears, T: ms.recombinationEnds.temperatureKelvin, a: ms.recombinationEnds.scaleFactor }
    ];

    potential.forEach(m => {
        if (m.t !== "Never" && m.t !== null && !isNaN(m.t) && m.t >= tStart) {
            list.push(m);
        }
    });

    if (physicsData.milestones.firstStars.cosmicTimeYears !== "Never" && parseFloat(ms.firstStars.scaleFactor) <= 1.0) {
        list.push({ name: 'First Stars', t: ms.firstStars.cosmicTimeYears, T: ms.firstStars.temperatureKelvin, a: ms.firstStars.scaleFactor });
    }
    if (physicsData.milestones.firstGalaxies.cosmicTimeYears !== "Never" && parseFloat(ms.firstGalaxies.scaleFactor) <= 1.0) {
        list.push({ name: 'First Galaxies', t: ms.firstGalaxies.cosmicTimeYears, T: ms.firstGalaxies.temperatureKelvin, a: ms.firstGalaxies.scaleFactor });
    }
    if (physicsData.milestones.firstPlanets.cosmicTimeYears !== "Never" && parseFloat(ms.firstPlanets.scaleFactor) <= 1.0) {
        list.push({ name: 'First Planets', t: ms.firstPlanets.cosmicTimeYears, T: ms.firstPlanets.temperatureKelvin, a: ms.firstPlanets.scaleFactor });
    }
    if (physicsData.milestones.firstEarthlyPlanets.cosmicTimeYears !== "Never" && parseFloat(ms.firstEarthlyPlanets.scaleFactor) <= 1.0) {
        list.push({ name: 'First Earthly Planets', t: ms.firstEarthlyPlanets.cosmicTimeYears, T: ms.firstEarthlyPlanets.temperatureKelvin, a: ms.firstEarthlyPlanets.scaleFactor });
    }
    list.push({ name: 'Present Day', t: tEnd, T: ms.presentDay.temperatureKelvin, a: ms.presentDay.scaleFactor });

    list.forEach(m => {
        if (m.t === "Never" || m.t === null || isNaN(m.t)) {
            m.t = tEnd;
        }
        if (m.t < tStart) m.t = tStart;
        if (m.t > tEnd) m.t = tEnd;
    });

    // Sort chronologically by physical time
    list.sort((a, b) => a.t - b.t);

    for (let i = 1; i < list.length; i++) {
        if (list[i].t < list[i - 1].t) {
            list[i].t = list[i - 1].t;
        }
    }

    const uniqueList = [];
    list.forEach(m => {
        if (uniqueList.length === 0) {
            uniqueList.push(m);
        } else {
            const prev = uniqueList[uniqueList.length - 1];
            if (Math.abs(m.t - prev.t) / prev.t > 1e-4) {
                uniqueList.push(m);
            }
        }
    });
    list.length = 0;
    list.push(...uniqueList);

    if (t <= list[0].t) {
        return { temperatureKelvin: list[0].T, scaleFactor: list[0].a, epochName: list[0].name };
    }
    if (t >= list[list.length - 1].t) {
        return { temperatureKelvin: list[list.length - 1].T, scaleFactor: list[list.length - 1].a, epochName: 'Present Day' };
    }

    for (let i = 0; i < list.length - 1; i++) {
        const m1 = list[i];
        const m2 = list[i + 1];
        if (t >= m1.t && t <= m2.t) {
            const log_t = Math.log(t);
            const log_t1 = Math.log(m1.t);
            const log_t2 = Math.log(m2.t);
            const w = (log_t - log_t1) / (log_t2 - log_t1);

            const log_T = Math.log(m1.T) + w * (Math.log(m2.T) - Math.log(m1.T));
            const log_a = Math.log(m1.a) + w * (Math.log(m2.a) - Math.log(m1.a));

            return {
                temperatureKelvin: Math.exp(log_T),
                scaleFactor: Math.exp(log_a),
                epochName: m1.name
            };
        }
    }
    return { temperatureKelvin: T0, scaleFactor: 1.0, epochName: 'Unknown' };
}

// Check epoch milestone entries
function checkMilestoneTransitions(t) {
    const ms = physicsData.milestones;

    if (t >= ms.bbnEnds.cosmicTimeYears) {
        drawAbundanceChart(physicsData.bbn.hydrogenPercentageBBN, physicsData.bbn.heliumPercentageBBN);
        abundancePanel.classList.remove('hidden');
    } else {
        abundancePanel.classList.add('hidden');
    }
}

// Camera transition controller
function updateCamera(key, localProgress) {
    camera.targetX = canvas.width / 2;
    camera.targetY = canvas.height / 2;

    const ms = physicsData.milestones;
    const hasStars = ms.firstStars.cosmicTimeYears !== "Never" && parseFloat(ms.firstStars.scaleFactor) <= 1.0;
    const hasPlanets = ms.firstPlanets.cosmicTimeYears !== "Never" && parseFloat(ms.firstPlanets.scaleFactor) <= 1.0;

    if (['start', 'bbnBegins', 'bbnEnds', 'recombinationBegins', 'cmbDecouples'].includes(key)) {
        camera.targetZoom = 1.0;
    } else if (key === 'recombinationEnds') {
        if (hasStars) {
            camera.targetZoom = 1.0 - localProgress * 0.5; // smooth transition to 0.5 (keeps the collapse and star larger)
        } else {
            camera.targetZoom = 1.0;
        }
    } else if (key === 'firstStars') {
        if (hasPlanets) {
            camera.targetZoom = 0.5 + localProgress * 0.8; // transition from 0.5 to 1.3 (zoom in to planetary accretion)
        } else {
            camera.targetZoom = 0.5;
        }
    } else if (key === 'firstPlanets') {
        camera.targetZoom = 1.3; // stay zoomed in on solar systems
    } else if (key === 'firstGalaxies') {
        camera.targetZoom = 1.3 - localProgress * 0.3; // zoom out from 1.3 to 1.0 to see the galaxy formation
    } else if (key === 'firstEarthlyPlanets') {
        camera.targetZoom = 1.0 + localProgress * 0.3; // zoom back in to focus on the central system
    } else if (key === 'presentDay') {
        camera.targetZoom = 1.3;
    }
    camera.update();
}

// Visual updates per frame router
function updateAndRender(key, localProgress, tCurrent) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Constant space-black background
    ctx.fillStyle = '#08090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const ms = physicsData.milestones;
    const hasStars = ms.firstStars.cosmicTimeYears !== "Never" && parseFloat(ms.firstStars.scaleFactor) <= 1.0;
    const hasPlanets = ms.firstPlanets.cosmicTimeYears !== "Never" && parseFloat(ms.firstPlanets.scaleFactor) <= 1.0;

    if (['start', 'bbnBegins', 'bbnEnds', 'recombinationBegins', 'cmbDecouples'].includes(key)) {
        renderPrimordialGas(tCurrent);
    } else if (key === 'recombinationEnds') {
        if (hasStars) {
            renderStellarCollapse(localProgress);
        } else {
            renderPrimordialGas(tCurrent);
        }
    } else if (key === 'firstStars') {
        if (hasPlanets) {
            renderPlanetaryAccretion(localProgress);
        } else {
            renderGalaxySpiral(localProgress);
        }
    } else if (key === 'firstPlanets') {
        renderPlanetaryAccretion(1.0); // Show mature orbiting planetary systems (all 36 systems)
    } else if (key === 'firstGalaxies') {
        renderGalaxySpiral(localProgress); // Collapse systems globally and fade in galaxy spiral
    } else if (key === 'firstEarthlyPlanets' || key === 'presentDay') {
        if (hasPlanets) {
            if (key === 'firstEarthlyPlanets' && localProgress < GALAXY_TRANSITION_DURATION) {
                const tVal = localProgress / GALAXY_TRANSITION_DURATION;
                
                // Draw zooming-in and fading-out galaxy
                ctx.save();
                const transX = tVal * GALAXY_TRANSITION_TRANSLATION[0];
                const transY = tVal * (-GALAXY_TRANSITION_TRANSLATION[1]);
                ctx.translate(transX, transY);
                const galaxyScale = 1.0 + tVal * (GALAXY_TRANSITION_MAX_SCALE / GALAXY_FINAL_RENDER_SCALE - 1.0);
                ctx.scale(galaxyScale, galaxyScale);
                renderGalaxySpiral(1.0, 1.0 - tVal); // fully formed galaxy at (1 - tVal) opacity
                ctx.restore();

                // Draw fading-in solar system
                ctx.save();
                ctx.globalAlpha = tVal;
                renderSolarSystem(true);
                ctx.restore();
            } else {
                renderSolarSystem(true);
            }
        } else if (hasStars) {
            renderGalaxySpiral(1.0);
        } else {
            renderPrimordialGas(tCurrent);
        }
    }

    ctx.restore();
}
