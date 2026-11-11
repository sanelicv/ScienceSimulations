const parametersData = [
    { id: 1, name: "Posición Galáctica", symbol: "Rgal (kpc)", type: "Continuo", dist: "Uniforme", min: 0, max: 50, earth: 8, description: "Distancia al centro galáctico. Si es muy cerca hay radiación letal; muy lejos faltan metales pesados." },
    { id: 2, name: "Estabilidad del Eje", symbol: "Variación Δϵ (°)", type: "Continuo", dist: "Uniforme", min: 0, max: 90, earth: 1.5, earthDisplay: "<2°", description: "Atractores gravitacionales que mantienen el clima estable. La Luna cumple este rol para la Tierra." },
    { id: 3, name: "Densidad de Asteroides", symbol: "ρast (Flujo relativo)", type: "Continuo", dist: "Log-Normal", min: 0, max: 500, meanLog: 0.5, stdDevLog: 1.2, earth: 1, description: "Tasa de impactos en el sistema. Una alta densidad extingue la vida constantemente." },
    { id: 4, name: "Estabilidad Estelar", symbol: "Variabilidad ΔL⋆ (%)", type: "Continuo", dist: "Log-Normal", min: 0, max: 30, meanLog: -1.0, stdDevLog: 1.5, earth: 0.001, description: "Constancia en la emisión de luz de la estrella anfitriona. Estrellas inestables calcinan sus planetas." },
    { id: 5, name: "Periodo de Rotación", symbol: "Prot (horas)", type: "Continuo", dist: "Log-Normal", min: 4, max: 10000, meanLog: 3.5, stdDevLog: 1.5, earth: 24, description: "Duración del día. Rotaciones muy lentas causan temperaturas extremas entre día y noche." },
    { id: 6, name: "Oblicuidad", symbol: "ϵ (°)", type: "Continuo", dist: "Normal", min: 0, max: 180, mean: 20, stdDev: 15, earth: 23.5, description: "Inclinación del eje. Responsable de crear las estaciones del año y moderar el clima global." },
    { id: 7, name: "Albedo Planetario", symbol: "α", type: "Continuo", dist: "Normal", min: 0, max: 1, mean: 0.3, stdDev: 0.15, earth: 0.3, description: "Fracción de luz estelar reflejada. Controla el equilibrio termodinámico del planeta." },
    { id: 8, name: "Espesor de Corteza", symbol: "zc (km)", type: "Continuo", dist: "Log-Normal", min: 5, max: 100, meanLog: 3.0, stdDevLog: 0.6, earth: 35, description: "Grosor de la capa exterior. Vital para permitir la tectónica de placas y el reciclaje de nutrientes." },
    { id: 9, name: "Calor Radiogénico", symbol: "Qrad (TW)", type: "Continuo", dist: "Log-Normal", min: 0, max: 300, meanLog: 2.5, stdDevLog: 1.0, earth: 20, description: "Calor interno emitido por isótopos. Mantiene el núcleo fundido y genera el campo magnético." },
    { id: 10, name: "Capa de Ozono", symbol: "CO3 (DU)", type: "Continuo", dist: "Normal", min: 0, max: 600, mean: 300, stdDev: 100, earth: 300, description: "Concentración de ozono atmosférico. Escudo protector indispensable contra la radiación ultravioleta." },
    { id: 11, name: "Ciclo del Nitrógeno", symbol: "Eficiencia EN", type: "Continuo", dist: "Normal", min: 0, max: 1, mean: 0.5, stdDev: 0.2, earth: 1, description: "Nivel de reciclaje biológico de nitrógeno. Sin él, la construcción de ADN es imposible." },
    { id: 12, name: "Relación Tierra-Agua", symbol: "fL", type: "Continuo", dist: "Normal", min: 0, max: 1, mean: 0.5, stdDev: 0.2, earth: 0.29, description: "Fracción de masa continental sobre los océanos. Crea hábitats diversos y regula cambios climáticos." },
    { id: 13, name: "Fósforo Disponible", symbol: "[P] rel", type: "Continuo", dist: "Normal", min: 0, max: 3, mean: 1.0, stdDev: 0.5, earth: 1, description: "Abundancia de fósforo accesible. Elemento cuello-de-botella indispensable para el almacenamiento de energía (ATP)." },
    { id: 14, name: "Simbiogénesis", symbol: "Eventos S", type: "Discreto", options: [0, 1], earth: 1, description: "Fusión de organismos simples (ej. mitocondrias). Salto evolutivo necesario para la vida compleja." },
    { id: 15, name: "Fotosíntesis Oxigénica", symbol: "ΦO2", type: "Discreto", options: [0, 1], earth: 1, description: "Evolución de un metabolismo basado en oxígeno. Genera una atmósfera reactiva que soporta vida animal." },
    { id: 16, name: "Frecuencia Extinciones", symbol: "fext (Giga-año⁻¹)", type: "Continuo", dist: "Log-Normal", min: 0, max: 40, meanLog: 1.5, stdDevLog: 0.8, earth: 10, description: "Tasa de eventos catastróficos. Necesaria para abrir nichos ecológicos, pero letal en exceso." },
    { id: 17, name: "Metales Superficiales", symbol: "Macc", type: "Continuo", dist: "Uniforme", min: 0, max: 1, earth: 0.9, description: "Accesibilidad geológica a metales. Requerida para un progreso tecnológico por inteligencias." },
    { id: 18, name: "Gravedad Superficial", symbol: "g (m/s²)", type: "Continuo", dist: "Log-Normal", min: 1, max: 30, meanLog: 2.0, stdDevLog: 0.5, earth: 9.8, description: "Fuerza gravitatoria. Si es muy alta aplasta la biología compleja; si es baja, el planeta pierde su atmósfera." },
    { id: 19, name: "Relación Satélite", symbol: "μ=Mm/Mp", type: "Continuo", dist: "Uniforme", min: 0, max: 0.1, earth: 0.012, description: "Proporción de masa de la luna vs planeta. Genera mareas esenciales para la química prebiótica." },
    { id: 20, name: "Ciclos Milankovitch", symbol: "AM", type: "Continuo", dist: "Uniforme", min: 0, max: 1, earth: 0.5, description: "Variaciones orbitales periódicas. Proveen 'pulsos' evolutivos que estimulan la adaptabilidad biológica." }
];

document.addEventListener('DOMContentLoaded', () => {
    const toggleAllBtn = document.getElementById('toggle-all-btn');
    const rollBtn = document.getElementById('roll-btn');
    const autoSearchBtn = document.getElementById('auto-search-btn');
    const parametersGrid = document.getElementById('parameters-grid');
    const resultSummary = document.getElementById('results-summary');
    const template = document.getElementById('parameter-card-template');
    const travelAnimationContainer = document.getElementById('travel-animation');

    // Result elements
    const resultTitle = document.getElementById('result-title');
    const resultDescription = document.getElementById('result-description');
    const overallSimilarityEl = document.getElementById('overall-similarity');
    const similarityCirclePath = document.getElementById('similarity-circle-path');
    const scannedCounterEl = document.getElementById('scanned-counter');

    // Advanced Search Panel elements
    const settingsBtn = document.getElementById('auto-settings-btn');
    const advancedPanel = document.getElementById('advanced-search-panel');
    const thresholdSlider = document.getElementById('threshold-slider');
    const thresholdDisplay = document.getElementById('threshold-display');
    const speedSlider = document.getElementById('speed-slider');
    const speedDisplay = document.getElementById('speed-display');

    let isRolling = false;
    let rollInterval;

    // Auto-search state
    let isAutoSearching = false;
    let scannedCount = 0;
    let bestSimSeen = 0;
    let bestValuesSeen = null;
    let autoSearchStartTime = 0;

    // Initialize Parameters
    parametersData.forEach(param => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.parameter-card');

        card.dataset.id = param.id;

        const nameEl = card.querySelector('.param-name');
        nameEl.textContent = param.name;

        // Add tooltip to name element
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = param.description;
        nameEl.appendChild(tooltip);

        card.querySelector('.param-symbol').textContent = param.symbol;
        card.querySelector('.earth-value').textContent = param.earthDisplay || param.earth;

        // Make the entire card clickable
        card.addEventListener('click', () => {
            // Prevent toggling while rolling
            if (isRolling || isAutoSearching) return;

            card.classList.toggle('active');
            updateRollButtonState();
        });

        parametersGrid.appendChild(clone);
    });

    // Toggle All functionality
    toggleAllBtn.addEventListener('click', () => {
        if (isRolling || isAutoSearching) return;

        const cards = document.querySelectorAll('.parameter-card');
        const allActive = Array.from(cards).every(c => c.classList.contains('active'));

        cards.forEach(card => {
            if (allActive) {
                card.classList.remove('active');
            } else {
                card.classList.add('active');
            }
        });

        updateRollButtonState();
    });

    function updateRollButtonState() {
        const cards = document.querySelectorAll('.parameter-card');
        const activeCards = document.querySelectorAll('.parameter-card.active');
        const anyChecked = activeCards.length > 0;

        rollBtn.disabled = !anyChecked || isRolling || isAutoSearching;
        autoSearchBtn.disabled = !isAutoSearching && (!anyChecked || isRolling);
        settingsBtn.disabled = isAutoSearching || isRolling;

        if (activeCards.length === cards.length && cards.length > 0) {
            toggleAllBtn.textContent = 'Deseleccionar Todos';
        } else {
            toggleAllBtn.textContent = 'Seleccionar Todos';
        }
    }

    // Settings Panel Toggle
    settingsBtn.addEventListener('click', () => {
        advancedPanel.classList.toggle('hidden');
        settingsBtn.classList.toggle('active');
    });

    // Threshold Slider update
    thresholdSlider.addEventListener('input', (e) => {
        thresholdDisplay.textContent = `${e.target.value}%`;
    });

    // Speed Slider update logic
    speedSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        speedDisplay.classList.remove('warning', 'danger');

        if (val === 1) {
            speedDisplay.textContent = `Explorador (~60k/s)`;
        } else if (val === 2) {
            speedDisplay.textContent = `Estándar (~300k/s)`;
        } else if (val === 3) {
            speedDisplay.textContent = `Súper Computadora (~600k/s)`;
            speedDisplay.classList.add('warning');
        } else if (val === 4) {
            speedDisplay.textContent = `⚠️ Sobrecarga (~1.2M/s)`;
            speedDisplay.classList.add('danger');
        }
    });

    // Helper function for Standard Normal distribution (mean: 0, stdDev: 1)
    function randomStandardNormal() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // Helper functions
    function getRandomValue(param) {
        if (param.type === "Continuo") {
            let val;
            const range = param.max - param.min;

            if (param.dist === "Normal") {
                // Generar con distribución Normal basada en la media y desviación estándar específica
                let valNormal = param.mean + param.stdDev * randomStandardNormal();
                // Asegurar que no exceda los rangos absolutos por azares extremos matemáticos (clamp)
                val = Math.max(param.min, Math.min(param.max, valNormal));
            } else if (param.dist === "Log-Normal") {
                // Matemática de Distribución Log-Normal: val = exp(meanLog + stdDevLog * Z)
                let valLogNormal = Math.exp(param.meanLog + param.stdDevLog * randomStandardNormal());
                // Asegurar que quede dentro de [min, max]
                val = Math.max(param.min, Math.min(param.max, valLogNormal));
            } else {
                // Uniforme por defecto
                val = Math.random() * range + param.min;
            }

            // Round to max 4 decimal places
            return Math.round(val * 10000) / 10000;
        } else if (param.type === "Discreto") {
            const index = Math.floor(Math.random() * param.options.length);
            return param.options[index];
        }
    }

    function calculateSimilarity(param, rolledValue) {
        if (param.type === "Continuo") {
            const range = param.max - param.min;
            const diff = Math.abs(rolledValue - param.earth);

            // Fix: Usamos una tolerancia en lugar de todo el rango astronómico [min, max].
            // La tolerancia considera el valor central de la Tierra o un 5% del rango total,
            // lo cual asegura que desvíos enormes (como 234 horas de rotación vs 24 de la tierra)
            // duelan dramáticamente en el % de similitud en lugar de esconderse dentro del gigantesco rango.
            const tolerance = Math.max(param.earth, range * 0.05);

            let sim = 100 * (1 - (diff / tolerance));
            return Math.max(0, sim); // Ensure not below 0 if somehow out of bounds
        } else if (param.type === "Discreto") {
            return rolledValue === param.earth ? 100 : 0;
        }
        return 0;
    }

    function getColorClass(similarity) {
        if (similarity >= 80) return "high";
        if (similarity >= 40) return "med";
        return "low";
    }

    // Helper function to create warp lines
    function createWarpLines() {
        // Clear old ones
        const existingLines = travelAnimationContainer.querySelectorAll('.warp-line');
        existingLines.forEach(line => line.remove());

        // Clear old passing planets
        const existingPlanets = travelAnimationContainer.querySelectorAll('.passing-planet');
        existingPlanets.forEach(p => p.remove());

        const numLines = 20;
        for (let i = 0; i < numLines; i++) {
            const line = document.createElement('div');
            line.classList.add('warp-line');

            // Random styling
            const top = Math.random() * 100; // 0 to 100%
            const width = Math.random() * 100 + 50; // 50 to 150px
            const duration = Math.random() * 0.5 + 0.2; // 0.2s to 0.7s
            const delay = Math.random() * 0.5;

            line.style.top = `${top}%`;
            line.style.width = `${width}px`;
            line.style.animationDuration = `${duration}s`;
            line.style.animationDelay = `${delay}s`;

            travelAnimationContainer.appendChild(line);
        }
    }

    // Helper function to create passing planets for auto-search
    function createPassingPlanets() {
        const existingPlanets = travelAnimationContainer.querySelectorAll('.passing-planet');
        existingPlanets.forEach(p => p.remove());

        const numPlanets = 4;
        const baseColors = ['#335577', '#774433', '#447755', '#553377', '#776633', '#337777', '#884455'];

        for (let i = 0; i < numPlanets; i++) {
            const planet = document.createElement('div');
            planet.classList.add('passing-planet');

            const size = Math.random() * 40 + 15; // 15px to 55px
            const top = Math.random() * 80 + 10; // 10% to 90%
            const duration = Math.random() * 1.5 + 1.5; // 1.5s to 3.0s
            const delay = Math.random() * 2;
            const bgClass = baseColors[Math.floor(Math.random() * baseColors.length)];

            planet.style.width = `${size}px`;
            planet.style.height = `${size}px`;
            planet.style.top = `${top}%`;
            planet.style.backgroundColor = bgClass;
            planet.style.animationDuration = `${duration}s`;
            planet.style.animationDelay = `${delay}s`;
            planet.style.boxShadow = `inset -${size / 4}px -${size / 4}px ${size / 4}px rgba(0,0,0,0.6)`;

            travelAnimationContainer.appendChild(planet);
        }
    }

    // Helper function to generate unique planets
    function randomizePlanetColors() {
        // Base planet colors (often muted/realistic but varied)
        const baseColors = ['#335577', '#774433', '#447755', '#553377', '#776633', '#337777', '#884455'];
        // Feature colors (continents, distinct terrain)
        const featureColors = ['#1a334f', '#4f271a', '#224f33', '#2f1a4f', '#4f3f1a', '#1a4f4f', '#5c2233', '#88aa99', '#ccaabb'];

        const base = baseColors[Math.floor(Math.random() * baseColors.length)];
        // Get a feature color that is definitely different from base
        let feature = featureColors[Math.floor(Math.random() * featureColors.length)];

        const planetSVG = document.getElementById('exoplanet');
        if (planetSVG) {
            planetSVG.querySelector('.planet-base').setAttribute('fill', base);
            planetSVG.querySelector('.planet-feature').setAttribute('fill', feature);
            planetSVG.querySelector('.planet-feature-2').setAttribute('fill', feature);
        }
    }

    // Roll Dice (Initiate Travel)
    rollBtn.addEventListener('click', () => {
        if (isRolling || isAutoSearching) return;

        isRolling = true;
        updateRollButtonState(); // Disable buttons
        advancedPanel.classList.add('hidden'); // Cierra el panel si estaba abierto al arrancar
        settingsBtn.classList.remove('active');

        // Setup animation classes
        resultSummary.classList.remove('active', 'arrived');
        resultSummary.classList.add('traveling');
        createWarpLines();

        // Get active parameters
        const activeCards = Array.from(document.querySelectorAll('.parameter-card.active'));

        // Start spinning card animation
        activeCards.forEach(card => card.classList.add('rolling'));

        let frames = 0;
        const maxFrames = 40; // ~2 seconds travel time

        rollInterval = setInterval(() => {
            frames++;

            // Generate temporary random numbers for the animation
            activeCards.forEach(card => {
                const id = parseInt(card.dataset.id);
                const param = parametersData.find(p => p.id === id);
                const tempVal = getRandomValue(param);
                card.querySelector('.rolled-value').textContent = tempVal;
            });

            if (frames >= maxFrames) {
                clearInterval(rollInterval);
                finishRoll(activeCards);
            }
        }, 50);
    });

    // --- Auto Search Implementation --- //

    autoSearchBtn.addEventListener('click', () => {
        if (isAutoSearching) {
            stopAutoSearch(false, null, document.querySelectorAll('.parameter-card.active'));
        } else {
            startAutoSearch();
        }
    });

    function getAutoBatchSize() {
        const val = parseInt(speedSlider.value);
        if (val === 1) return 1000;
        if (val === 2) return 5000;
        if (val === 3) return 10000;
        if (val === 4) return 20000;
        return 5000;
    }

    function startAutoSearch() {
        if (isRolling || isAutoSearching) return;

        isRolling = true; // Temporarily set isRolling to true to disable roll button
        isAutoSearching = true;

        updateRollButtonState(); // Disable buttons
        settingsBtn.disabled = true; // Bloquea boton settings durante búsqueda
        advancedPanel.classList.add('hidden'); // Cierra panel visual
        settingsBtn.classList.remove('active');

        autoSearchBtn.textContent = "Detener Búsqueda";
        autoSearchBtn.classList.remove('auto');
        autoSearchBtn.classList.add('danger');

        scannedCount = 0;
        bestSimSeen = 0;
        bestValuesSeen = null;
        autoSearchStartTime = Date.now();

        scannedCounterEl.style.display = 'block';
        scannedCounterEl.textContent = `Comprobando: 0 sistemas | Mejor: 0.0%`;
        document.getElementById('traveling-title').textContent = "Búsqueda Automática";
        document.getElementById('traveling-subtitle').textContent = "Rastreando cuadrantes estelares profundos...";

        // Setup animation classes
        resultSummary.classList.remove('active', 'arrived');
        resultSummary.classList.add('traveling');
        createWarpLines();
        createPassingPlanets();

        // Get active parameters
        const activeCards = Array.from(document.querySelectorAll('.parameter-card.active'));
        activeCards.forEach(card => {
            card.classList.add('rolling');

            // Reset visual state
            const rolledValueEl = card.querySelector('.rolled-value');
            const simBar = card.querySelector('.similarity-bar');
            const simText = card.querySelector('.param-similarity-text');

            rolledValueEl.textContent = '...';
            simText.textContent = 'Buscando...';

            // Remove color classes
            simBar.className = 'similarity-bar';
            simText.className = 'param-similarity-text';
            rolledValueEl.className = 'value rolled-value';

            // Reset bar width
            simBar.style.width = '0%';
        });

        // Start search loop
        requestAnimationFrame(() => autoSearchLoop(activeCards));
    }

    function autoSearchLoop(activeCards) {
        if (!isAutoSearching) return;

        // Lee el valor target del slider UI
        const targetSim = parseInt(thresholdSlider.value);
        const maxSearchTimeMs = 60 * 5 * 1000; // Time out after 5 minutes to ensure it stops eventually
        const batchSize = getAutoBatchSize(); // Dinámico según slider
        let found = false;

        for (let i = 0; i < batchSize; i++) {
            scannedCount++;
            let totalSim = 0;
            let currentValues = {};

            for (let j = 0; j < activeCards.length; j++) {
                const card = activeCards[j];
                const id = parseInt(card.dataset.id);
                const param = parametersData.find(p => p.id === id);
                const val = getRandomValue(param);
                const sim = calculateSimilarity(param, val);
                totalSim += sim;
                currentValues[id] = val;
            }

            const avgSim = totalSim / activeCards.length;

            // Track best
            if (avgSim > bestSimSeen) {
                bestSimSeen = avgSim;
                bestValuesSeen = currentValues;
            }

            // Did we hit threshold?
            if (avgSim >= targetSim) {
                found = true;
                break;
            }
        }

        // Update UI every frame
        scannedCounterEl.textContent = `Comprobando: ${scannedCount.toLocaleString('es-ES')} sistemas | Mejor: ${bestSimSeen.toFixed(1)}%`;

        // Update a random value visually in the cards to show rolling effect
        if (scannedCount % 5 === 0) {
            activeCards.forEach(card => {
                const id = parseInt(card.dataset.id);
                const param = parametersData.find(p => p.id === id);
                card.querySelector('.rolled-value').textContent = getRandomValue(param);
            });
        }

        if (found) {
            stopAutoSearch(true, bestValuesSeen, activeCards);
        } else if (Date.now() - autoSearchStartTime > maxSearchTimeMs) {
            // Timeout reached, return best found
            stopAutoSearch(true, bestValuesSeen, activeCards);
        } else {
            // Keep searching next frame
            requestAnimationFrame(() => autoSearchLoop(activeCards));
        }
    }

    function stopAutoSearch(success, foundValues, activeCards) {
        if (!isAutoSearching) return;
        isAutoSearching = false;
        isRolling = false; // Reset isRolling as well

        autoSearchBtn.textContent = "Búsqueda Automática";
        autoSearchBtn.classList.remove('danger');
        autoSearchBtn.classList.add('auto');
        settingsBtn.disabled = false; // Rehabilitar botón settings

        if (success && foundValues) {
            finishRoll(activeCards, foundValues, scannedCount);
        } else {
            finishRoll(activeCards); // If no values found or stopped, just finish with current randoms
        }

        // Reset text after animation finishes
        setTimeout(() => {
            scannedCounterEl.style.display = 'none';
            document.getElementById('traveling-title').textContent = "Viajando a través del cosmos...";
            document.getElementById('traveling-subtitle').textContent = "Buscando mundos habitables";
        }, 1500);
    }

    function finishRoll(activeCards, precalculatedValues = null, totalScanned = 0) {
        // Randomize planet colors before it slides into view
        randomizePlanetColors();

        // Transition from 'traveling' to 'arrived' immediately
        resultSummary.classList.remove('traveling');
        resultSummary.classList.add('arrived');

        let totalSimilarity = 0;

        activeCards.forEach(card => {
            card.classList.remove('rolling');

            const id = parseInt(card.dataset.id);
            const param = parametersData.find(p => p.id === id);

            const finalValue = precalculatedValues ? precalculatedValues[id] : getRandomValue(param);
            const similarity = calculateSimilarity(param, finalValue);
            totalSimilarity += similarity;

            // Update UI for this card
            const rolledValueEl = card.querySelector('.rolled-value');
            const simBar = card.querySelector('.similarity-bar');
            const simText = card.querySelector('.param-similarity-text');

            rolledValueEl.textContent = finalValue;

            // Clean old colors
            simBar.className = 'similarity-bar';
            simText.className = 'param-similarity-text';
            rolledValueEl.className = 'value rolled-value';

            // Apply new values and colors
            setTimeout(() => {
                simBar.style.width = `${similarity}%`;
                const colorClass = getColorClass(similarity);
                simBar.classList.add(`color-${colorClass}`);
                simText.classList.add(`text-color-${colorClass}`);
                rolledValueEl.classList.add(`text-color-${colorClass}`);
            }, 50); // slight delay for animation

            simText.textContent = `${similarity.toFixed(1)}% similar`;
        });

        // Calculate and display overall similarity
        const averageSimilarity = totalSimilarity / activeCards.length;

        // Wait for the arrival animation (planet popping up) to complete before showing the text and circle
        setTimeout(() => {
            displayOverallResult(averageSimilarity, totalScanned);

            isRolling = false;
            toggleAllBtn.disabled = false;
            updateRollButtonState();

            // We keep 'arrived' so the rocket and planet stay visible in the background, 
            // but we add 'active' to fade back in the text/circle.
            resultSummary.classList.add('active');
        }, 1200); // 1.2s delay to let the CSS 'arrived' animation play out
    }

    function displayOverallResult(similarity, totalScanned = 0) {
        resultSummary.classList.add('active');

        // Update circle
        similarityCirclePath.style.strokeDasharray = `${similarity}, 100`;
        overallSimilarityEl.textContent = `${similarity.toFixed(1)}%`;

        // Update colors
        similarityCirclePath.className.baseVal = 'circle';
        overallSimilarityEl.className.baseVal = 'percentage';

        const colorClass = getColorClass(similarity);
        similarityCirclePath.classList.add(`color-${colorClass}`);
        overallSimilarityEl.classList.add(`text-color-${colorClass}`);

        // Update Text
        let scannedText = totalScanned > 0 ? ` (Encontrado tras analizar ${totalScanned.toLocaleString('es-ES')} sistemas).` : '';

        if (similarity >= 95) {
            resultTitle.textContent = "¡Una Tierra Paralela!";
            resultDescription.textContent = `Las condiciones son casi idénticas a las de la Tierra. La vida compleja prosperaría aquí.${scannedText}`;
        } else if (similarity >= 75) {
            resultTitle.textContent = "Mundo Habitable";
            resultDescription.textContent = `Existen diferencias notables, pero es un excelente candidato para albergar vida.${scannedText}`;
        } else if (similarity >= 50) {
            resultTitle.textContent = "Planeta Extremo";
            resultDescription.textContent = `Las condiciones son muy hostiles. Solo organismos extremófilos podrían sobrevivir.${scannedText}`;
        } else {
            resultTitle.textContent = "Roca Estéril";
            resultDescription.textContent = `Totalmente incompatible con la vida tal como la conocemos.${scannedText}`;
        }
    }
});
