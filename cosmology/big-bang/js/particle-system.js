// Particle System Manager

// Particle state buffers
let nucleons = [];  // Protons and Neutrons
let electrons = []; // Electrons
let photons = [];   // Light waves
let heliumClusters = []; // Rigid Helium-4 centers of mass
let starCenters = [];       // Centers for multiple collapsing stars
let otherClusters = [];     // Collapsing clusters of dots in stellar collapse
let stars = [];            // Star formation nodes
let collapsingSystems = []; // Collapsing mini-systems during galaxy formation
let planets = [];   // Accreting planet systems
let galaxyStars = []; // Galaxy stars

// Particle Setup based on BBN Output
function setupParticles(heliumPct) {
    nucleons = [];
    electrons = [];
    photons = [];
    heliumClusters = [];

    const heliumFraction = heliumPct / 100;

    // Calculate Helium-4 nuclei count (needs 2p, 2n)
    const numHelium = Math.round((totalNucleons * heliumFraction) / 4);
    const numNeutrons = numHelium * 2;
    const numProtons = totalNucleons - numNeutrons;

    // Initialize Helium clusters coordinates (uninitialized at start)
    for (let i = 0; i < numHelium; i++) {
        heliumClusters.push({
            id: i,
            x: 0,
            y: 0,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            boundCount: 0,
            initialized: false
        });
    }

    // Generate Neutrons (bound to Helium-4)
    for (let i = 0; i < numNeutrons; i++) {
        const heliumId = Math.floor(i / 2);
        const localOffsetX = (i % 2 === 0) ? 5 : -5;
        const localOffsetY = (i % 2 === 0) ? -5 : 5;

        nucleons.push({
            x: (Math.random() - 0.5) * canvas.width,
            y: (Math.random() - 0.5) * canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            type: 'n',
            color: '#7f8c8d', // gray
            size: 6,
            heliumId: heliumId,
            bound: false,
            localOffsetX: localOffsetX,
            localOffsetY: localOffsetY
        });
    }

    // Generate Protons
    for (let i = 0; i < numProtons; i++) {
        const isHeliumBound = i < (numHelium * 2);
        const heliumId = isHeliumBound ? Math.floor(i / 2) : null;
        const localOffsetX = isHeliumBound ? ((i % 2 === 0) ? -5 : 5) : 0;
        const localOffsetY = isHeliumBound ? ((i % 2 === 0) ? -5 : 5) : 0;

        nucleons.push({
            x: (Math.random() - 0.5) * canvas.width,
            y: (Math.random() - 0.5) * canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            type: 'p',
            color: '#db3434ff', // blue
            size: 6,
            heliumId: heliumId,
            bound: false,
            localOffsetX: localOffsetX,
            localOffsetY: localOffsetY
        });
    }

    // Generate Electrons
    for (let i = 0; i < numProtons; i++) {
        let targetNucleus = null;
        let isHeliumOrbit = false;

        if (i < numHelium * 2) {
            targetNucleus = Math.floor(i / 2);
            isHeliumOrbit = true;
        } else {
            targetNucleus = i - (numHelium * 2);
        }

        electrons.push({
            x: (Math.random() - 0.5) * canvas.width,
            y: (Math.random() - 0.5) * canvas.height,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            type: 'e',
            color: '#2ecc71', // green
            size: 3,
            targetNucleus: targetNucleus,
            isHeliumOrbit: isHeliumOrbit,
            orbitRadius: isHeliumOrbit ? (i % 2 === 0 ? 30 : 50) : 30,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitSpeed: 0.1 + Math.random() * 0.05
        });
    }

    // Generate Photons
    for (let i = 0; i < 100; i++) {
        photons.push({
            x: (Math.random() - 0.5) * canvas.width,
            y: (Math.random() - 0.5) * canvas.height,
            vx: (Math.random() - 0.5) * electronSpeed,
            vy: (Math.random() - 0.5) * electronSpeed,
            wavelength: Math.random() * 20 + 10,
            phase: Math.random() * Math.PI * 2
        });
    }
}
