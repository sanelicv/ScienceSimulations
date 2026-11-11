// Epoch Graphic Renderers

// 1. Primordial Gas Rendering (BBN & Recombination)
function renderPrimordialGas(tCurrent, collapseFactor = 1.0, forceDots = false, limitToCircle = true) {
    const isDecoupled = tCurrent >= physicsData.milestones.cmbDecouples.cosmicTimeYears;

    // BBN progress (based on physical cosmic time)
    let bbnProgress = 0;
    if (tCurrent >= physicsData.milestones.bbnBegins.cosmicTimeYears) {
        const log_t = Math.log(tCurrent);
        const log_start = Math.log(physicsData.milestones.bbnBegins.cosmicTimeYears);
        const log_end = Math.log(physicsData.milestones.bbnEnds.cosmicTimeYears);
        bbnProgress = Math.max(0, Math.min(1, (log_t - log_start) / (log_end - log_start)));
    }

    // Recombination progress (based on physical cosmic time)
    let recProgress = 0;
    if (tCurrent >= physicsData.milestones.recombinationBegins.cosmicTimeYears) {
        const log_t = Math.log(tCurrent);
        const log_start = Math.log(physicsData.milestones.recombinationBegins.cosmicTimeYears);
        const log_end = Math.log(physicsData.milestones.recombinationEnds.cosmicTimeYears);
        recProgress = Math.max(0, Math.min(1, (log_t - log_start) / (log_end - log_start)));
    }

    const boundX = canvas.width / 2;
    const boundY = canvas.height / 2;

    // Update Helium clusters center position/movement
    heliumClusters.forEach(cluster => {
        if (cluster.initialized) {
            cluster.x += cluster.vx;
            cluster.y += cluster.vy;

            // Bounce off boundary
            if (cluster.x < -boundX + 20 || cluster.x > boundX - 20) cluster.vx *= -1;
            if (cluster.y < -boundY + 20 || cluster.y > boundY - 20) cluster.vy *= -1;
        }
    });

    // Update and Render Nucleons (protons and neutrons)
    nucleons.forEach((p, idx) => {
        if (p.heliumId !== null) {
            const cluster = heliumClusters[p.heliumId];
            const Tj = (p.heliumId + 0.5) / heliumClusters.length;

            if (bbnProgress >= Tj) {
                if (!cluster.initialized) {
                    const clusterParticles = nucleons.filter(n => n.heliumId === p.heliumId);
                    let sumX = 0, sumY = 0;
                    clusterParticles.forEach(cp => {
                        sumX += cp.x;
                        sumY += cp.y;
                    });
                    cluster.x = sumX / clusterParticles.length;
                    cluster.y = sumY / clusterParticles.length;
                    cluster.initialized = true;
                }

                if (!p.bound) {
                    const targetX = cluster.x + p.localOffsetX;
                    const targetY = cluster.y + p.localOffsetY;

                    const dx = targetX - p.x;
                    const dy = targetY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 1.5) {
                        p.x += dx * 0.1;
                        p.y += dy * 0.1;
                    } else {
                        p.bound = true;
                        p.x = targetX;
                        p.y = targetY;
                        cluster.boundCount++;
                    }
                } else {
                    p.x = cluster.x + p.localOffsetX;
                    p.y = cluster.y + p.localOffsetY;
                }
            } else {
                // Pre-fusion or scrubbed backward
                p.bound = false;
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off boundary
                if (p.x < -boundX || p.x > boundX) p.vx *= -1;
                if (p.y < -boundY || p.y > boundY) p.vy *= -1;
            }
        } else {
            // Free protons (Hydrogen)
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off boundary
            if (p.x < -boundX || p.x > boundX) p.vx *= -1;
            if (p.y < -boundY || p.y > boundY) p.vy *= -1;
        }
    });

    // Update and Render Electrons
    electrons.forEach((e, idx) => {
        let centerX = 0;
        let centerY = 0;
        let targetFound = false;

        const isRecombined = (idx / electrons.length) < recProgress;

        if (isRecombined) {
            if (e.isHeliumOrbit) {
                // Find all nucleons bound to this helium ID (should have 2 protons, 2 neutrons)
                const clusterParticles = nucleons.filter(n => n.heliumId === e.targetNucleus);
                if (clusterParticles.length > 0) {
                    let sumX = 0, sumY = 0;
                    clusterParticles.forEach(cp => {
                        sumX += cp.x;
                        sumY += cp.y;
                    });
                    centerX = sumX / clusterParticles.length;
                    centerY = sumY / clusterParticles.length;
                    targetFound = true;
                }
            } else {
                // Nucleus is a free proton (Hydrogen)
                const freeProtons = nucleons.filter(p => p.type === 'p' && p.heliumId === null);
                if (freeProtons.length > 0) {
                    const proton = freeProtons[e.targetNucleus % freeProtons.length];
                    centerX = proton.x;
                    centerY = proton.y;
                    targetFound = true;
                }
            }

            if (targetFound) {
                e.orbitAngle += e.orbitSpeed;
                e.x = centerX + Math.cos(e.orbitAngle) * e.orbitRadius;
                e.y = centerY + Math.sin(e.orbitAngle) * e.orbitRadius;
            } else {
                e.x += e.vx;
                e.y += e.vy;
            }
        } else {
            e.x += e.vx;
            e.y += e.vy;
        }

        if (e.x < -boundX || e.x > boundX) e.vx *= -1;
        if (e.y < -boundY || e.y > boundY) e.vy *= -1;
    });

    // Update and Render Photons
    photons.forEach(ph => {
        ph.x += ph.vx;
        ph.y += ph.vy;
        ph.phase += 0.35;

        if (ph.x < -boundX) ph.x = boundX;
        if (ph.x > boundX) ph.x = -boundX;
        if (ph.y < -boundY) ph.y = boundY;
        if (ph.y > boundY) ph.y = -boundY;

        if (!isDecoupled) {
            nucleons.forEach(p => {
                if (!p.bound) {
                    const dx = p.x - ph.x;
                    const dy = p.y - ph.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 15) {
                        const angle = Math.random() * Math.PI * 2;
                        ph.vx = Math.cos(angle) * electronSpeed;
                        ph.vy = Math.sin(angle) * electronSpeed;
                    }
                }
            });
        }
    });

    // Tiling configurations for infinite universe view
    const zoomVal = camera.zoom;
    const tilesX = Math.ceil(1.0 / zoomVal);
    const tilesY = Math.ceil(1.0 / zoomVal);
    const W = canvas.width;
    const H = canvas.height;

    // Transition to simple dots when zoom scale gets small
    const isSimplified = forceDots || (zoomVal < 0.01);
    const limitRadius = Math.min(W, H) * 1.2;

    for (let tx = -tilesX; tx <= tilesX; tx++) {
        for (let ty = -tilesY; ty <= tilesY; ty++) {
            const offsetX = tx * W;
            const offsetY = ty * H;

            // Draw nucleons
            nucleons.forEach(p => {
                const px = p.x + offsetX;
                const py = p.y + offsetY;
                if (limitToCircle && (px * px + py * py > limitRadius * limitRadius)) {
                    return;
                }
                ctx.fillStyle = forceDots ? '#fff3cd' : p.color;
                ctx.beginPath();
                const size = isSimplified ? 1.5 : p.size;
                ctx.arc(px * collapseFactor, py * collapseFactor, size, 0, Math.PI * 2);
                ctx.fill();
            });

            if (isSimplified) {
                // Simplified dust rendering using original colors, overridden to white if forceDots
                electrons.forEach(e => {
                    const ex = e.x + offsetX;
                    const ey = e.y + offsetY;
                    if (limitToCircle && (ex * ex + ey * ey > limitRadius * limitRadius)) {
                        return;
                    }
                    ctx.fillStyle = forceDots ? '#ffffff' : e.color;
                    ctx.beginPath();
                    ctx.arc(ex * collapseFactor, ey * collapseFactor, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                });
                photons.forEach(ph => {
                    const px = ph.x + offsetX;
                    const py = ph.y + offsetY;
                    if (limitToCircle && (px * px + py * py > limitRadius * limitRadius)) {
                        return;
                    }
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(px * collapseFactor, py * collapseFactor);
                    ctx.lineTo((px + ph.vx * 0.5) * collapseFactor, (py + ph.vy * 0.5) * collapseFactor);
                    ctx.stroke();
                });
            } else {
                // Detailed electrons and orbits
                electrons.forEach((e, idx) => {
                    const ex = e.x + offsetX;
                    const ey = e.y + offsetY;
                    if (limitToCircle && (ex * ex + ey * ey > limitRadius * limitRadius)) {
                        return;
                    }
                    let centerX = 0;
                    let centerY = 0;
                    let targetFound = false;

                    const isRecombined = (idx / electrons.length) < recProgress;

                    if (isRecombined) {
                        if (e.isHeliumOrbit) {
                            const clusterParticles = nucleons.filter(n => n.heliumId === e.targetNucleus);
                            if (clusterParticles.length > 0) {
                                let sumX = 0, sumY = 0;
                                clusterParticles.forEach(cp => {
                                    sumX += cp.x;
                                    sumY += cp.y;
                                });
                                centerX = sumX / clusterParticles.length;
                                centerY = sumY / clusterParticles.length;
                                targetFound = true;
                            }
                        } else {
                            const freeProtons = nucleons.filter(p => p.type === 'p' && p.heliumId === null);
                            if (freeProtons.length > 0) {
                                const proton = freeProtons[e.targetNucleus % freeProtons.length];
                                centerX = proton.x;
                                centerY = proton.y;
                                targetFound = true;
                            }
                        }
                    }

                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.arc(ex * collapseFactor, ey * collapseFactor, e.size, 0, Math.PI * 2);
                    ctx.fill();

                    if (isRecombined && targetFound) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.arc((centerX + offsetX) * collapseFactor, (centerY + offsetY) * collapseFactor, e.orbitRadius * collapseFactor, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });

                // Detailed wavy photons
                photons.forEach(ph => {
                    const px = ph.x + offsetX;
                    const py = ph.y + offsetY;
                    if (limitToCircle && (px * px + py * py > limitRadius * limitRadius)) {
                        return;
                    }
                    ctx.strokeStyle = isDecoupled ? 'rgba(255, 255, 0, 1)' : '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();

                    const segmentLength = 12;
                    const dirX = ph.vx / 12;
                    const dirY = ph.vy / 12;
                    const normalX = -dirY;
                    const normalY = dirX;

                    for (let j = 0; j < segmentLength; j++) {
                        const t = j / segmentLength;
                        const posX = (px - dirX * j * 2.2 + Math.sin(ph.phase + t * 6.5) * normalX * 4.5) * collapseFactor;
                        const posY = (py - dirY * j * 2.2 + Math.sin(ph.phase + t * 6.5) * normalY * 4.5) * collapseFactor;
                        if (j === 0) ctx.moveTo(posX, posY);
                        else ctx.lineTo(posX, posY);
                    }
                    ctx.stroke();
                });
            }
        }
    }
}

function ensureStarCenters() {
    if (starCenters && starCenters.length > 1) return;

    starCenters = [{ x: 0, y: 0 }]; // Start with main central star
    const numOthers = 35; // Number of clusters
    const maxR = Math.min(canvas.width, canvas.height) * 1.2; // Large circle matching gas limit
    const minDist = 300; // Minimum distance between other star systems to prevent overlaps

    let attempts = 0;
    while (starCenters.length < numOthers + 1 && attempts < 2000) {
        const r = Math.sqrt(Math.random()) * maxR; // Homogeneous distribution in a circle
        const angle = Math.random() * Math.PI * 2;
        const cx = Math.cos(angle) * r;
        const cy = Math.sin(angle) * r;

        // Check distance to prevent overlaps
        let tooClose = false;
        for (let j = 0; j < starCenters.length; j++) {
            const existing = starCenters[j];
            const dx = cx - existing.x;
            const dy = cy - existing.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const requiredDist = (j === 0) ? 280 : minDist; // Main central system is larger
            if (dist < requiredDist) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            starCenters.push({ x: cx, y: cy });
        }
        attempts++;
    }
}

// 2. Stellar Collapse Rendering (Deterministic based on progress)
function renderStellarCollapse(p) {
    const progress = Math.max(0, Math.min(1.0, p));

    // 0% -> 60%: Zoom out phase (collapseFactor = 1.0, detailed rendering)
    // 60% -> 85%: Detailed collapse (collapseFactor goes from 1.0 to 0.15, detailed rendering)
    // 85% -> 100%: Dot collapse (collapseFactor goes from 0.15 to 0.0, simplified dot rendering)

    let collapseFactor = 1.0;
    let forceDots = false;

    if (progress < 0.6) {
        collapseFactor = 1.0;
        forceDots = false;
    } else if (progress < 0.85) {
        // Linear decrease from 1.0 to 0.15
        const t = (progress - 0.6) / (0.85 - 0.6);
        collapseFactor = 1.0 - t * 0.85;
        forceDots = false;
    } else {
        // Linear decrease from 0.15 to 0.0
        const t = (progress - 0.85) / (1.0 - 0.85);
        collapseFactor = 0.15 - t * 0.15;
        forceDots = true;
    }

    const tCurrent = getCosmicTimeFromProgress(simProgress);

    // Draw central gas collapse (primordial gas collapses as now, don't change that)
    renderPrimordialGas(tCurrent, collapseFactor, forceDots, true);

    // Only when atoms are replaced by dots (progress >= 0.85), add other collapsing dot clusters in a circular area
    if (forceDots) {
        if (otherClusters.length === 0) {
            ensureStarCenters();
            const colors = ['#ffffff', '#fff3cd', '#ffeaa7', '#fffae6', '#fcf8e3', '#fef5d1']; // White or yellowish dots
            starCenters.forEach((center, idx) => {
                if (idx === 0) return; // skip center star
                
                // Generate random collapsing dot particles for this cluster
                const dots = [];
                const numDots = 12 + Math.floor(Math.random() * 12);
                for (let j = 0; j < numDots; j++) {
                    const dotR = Math.random() * 50;
                    const dotAngle = Math.random() * Math.PI * 2;
                    dots.push({
                        dx: Math.cos(dotAngle) * dotR,
                        dy: Math.sin(dotAngle) * dotR,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 0.8 + Math.random() * 0.8
                    });
                }
                otherClusters.push({ x: center.x, y: center.y, dots: dots });
            });
        }

        // Render each cluster of collapsing dots towards its center
        const clusterFactor = (1.0 - progress) / 0.15; // goes from 1.0 down to 0.0
        otherClusters.forEach(cluster => {
            cluster.dots.forEach(dot => {
                const px = cluster.x + dot.dx * clusterFactor;
                const py = cluster.y + dot.dy * clusterFactor;
                ctx.fillStyle = dot.color;
                ctx.beginPath();
                ctx.arc(px, py, dot.size, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    // Star ignition flash for all formed stars
    if (progress > 0.97) {
        const flashProgress = (progress - 0.97) / 0.03;
        const size = flashProgress * 20;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffeaa7';
        ctx.shadowBlur = 30;

        // Main star
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Other stars
        if (otherClusters.length > 0) {
            otherClusters.forEach(cluster => {
                ctx.beginPath();
                ctx.arc(cluster.x, cluster.y, size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.shadowBlur = 0;
    }
}

// 3. Supernova explosion and accretion disk (Deterministic based on progress)
function renderPlanetaryAccretion(p) {
    const progress = Math.max(0, Math.min(1.0, p));

    // Phase 1: Star explosion (progress 0 to 0.3)
    if (progress <= 0.3) {
        const expProgress = progress / 0.3;

        // Initialize planets/explosion for each star center if empty
        if (planets.length === 0) {
            ensureStarCenters();
            const centers = starCenters.length > 0 ? starCenters : [{ x: 0, y: 0 }];
            centers.forEach(center => {
                const colors = ['#ffffff', '#fff3cd', '#ffeaa7', '#fffae6', '#fcf8e3', '#fef5d1'];
                const starColor = center.x === 0 && center.y === 0 ? '#fffae6' : `hsl(${Math.random() * 40 + 20}, 100%, 70%)`;
                const systemPlanets = [];
                const numParticles = center.x === 0 && center.y === 0 ? 100 : 20;

                for (let i = 0; i < numParticles; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * (center.x === 0 && center.y === 0 ? 160 : 60) + 20;
                    systemPlanets.push({
                        angle: angle,
                        speed: speed,
                        color: colors[Math.floor(Math.random() * colors.length)]
                    });
                }

                planets.push({
                    x: center.x,
                    y: center.y,
                    starColor: starColor,
                    particles: systemPlanets,
                    starSize: center.x === 0 && center.y === 0 ? 18 : 6
                });
            });
        }

        planets.forEach(sys => {
            sys.particles.forEach(pl => {
                const currentR = pl.speed * expProgress;
                const x = sys.x + Math.cos(pl.angle) * currentR;
                const y = sys.y + Math.sin(pl.angle) * currentR;
                ctx.fillStyle = pl.color;
                ctx.beginPath();
                ctx.arc(x, y, sys.x === 0 && sys.y === 0 ? 1.8 : 1.0, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sys.x, sys.y, Math.max(0, (sys.x === 0 && sys.y === 0 ? 25 : 8) * (1 - expProgress)), 0, Math.PI * 2);
            ctx.fill();
        });
    }
    // Phase 2: Accretion disks (progress 0.3 to 1.0)
    else {
        const accProgress = (progress - 0.3) / 0.7;
        const orbitalRadii = [30, 50, 70, 95];
        const mainOrbitalRadii = orbitalRadii;
        const planetColors = ['#a4b0be', '#f6b93b', '#2980b9', '#e74c3c'];

        planets.forEach(sys => {
            const isMain = sys.x === 0 && sys.y === 0;
            const radii = isMain ? mainOrbitalRadii : orbitalRadii;

            sys.particles.forEach((pl, idx) => {
                const ringIdx = idx % 4;
                const targetR = radii[ringIdx];
                const currentR = pl.speed * (1 - accProgress) + targetR * accProgress;
                const orbitAngle = pl.angle + accProgress * 6 + (accProgress >= 1.0 ? performance.now() * 0.001 : 0);
                const x = sys.x + Math.cos(orbitAngle) * currentR;
                const y = sys.y + Math.sin(orbitAngle) * currentR;

                ctx.fillStyle = pl.color;
                ctx.fillRect(x, y, isMain ? 1.5 : 1.0, isMain ? 1.5 : 1.0);
            });

            // Center Sun
            ctx.fillStyle = sys.starColor;
            ctx.shadowColor = sys.starColor === '#fffae6' ? '#ffd32a' : sys.starColor;
            ctx.shadowBlur = isMain ? 20 : 8;
            ctx.beginPath();
            ctx.arc(sys.x, sys.y, sys.starSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            radii.forEach((r, idx) => {
                const orbitAngle = (accProgress * 3 * (5 - idx) + (accProgress >= 1.0 ? performance.now() * 0.0005 * (5 - idx) : 0)) % (Math.PI * 2);
                const pSize = (isMain ? 4 : 1.2) + idx * (isMain ? 1.5 : 0.4);
                const px = sys.x + Math.cos(orbitAngle) * r;
                const py = sys.y + Math.sin(orbitAngle) * r;

                ctx.fillStyle = planetColors[idx];
                ctx.beginPath();
                ctx.arc(px, py, pSize * accProgress, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.beginPath();
                ctx.arc(sys.x, sys.y, r, 0, Math.PI * 2);
                ctx.stroke();
            });
        });
    }
}

// 4. Galaxy Spiral assembly (Deterministic spiral based on progress)
function renderGalaxySpiral(p, overrideAlpha = null) {
    const progress = Math.max(0, Math.min(1.0, p));

    // Initialize galaxy stars if empty
    if (galaxyStars.length === 0) {
        const a = 5;
        const b = 0.22;
        for (let i = 0; i < 4000; i++) {
            const arm = i % 2 === 0 ? 0 : Math.PI;
            const theta = Math.random() * 15;
            const r = a * Math.exp(b * theta) + (Math.random() - 0.5) * (theta * 8);
            galaxyStars.push({
                r: r,
                theta: theta + arm,
                speed: 0.01 / (r * 0.01 + 1),
                color: `hsl(${Math.random() * 60 + 200}, 80%, ${Math.random() * 40 + 60}%)`,
                size: Math.random() * 1.5 + 0.5
            });
        }
    }

    // Initialize collapsing mini-systems if empty (linked to the planets/starCenters from the previous epoch!)
    if (collapsingSystems.length === 0) {
        ensureStarCenters();
        const colors = ['#f6b93b', '#e74c3c', '#2980b9', '#9b59b6', '#1abc9c', '#e67e22'];
        const list = starCenters.length > 0 ? starCenters : [{ x: 0, y: 0 }];

        list.forEach(center => {
            const starColor = center.x === 0 && center.y === 0 ? '#fffae6' : `hsl(${Math.random() * 50 + 15}, 100%, 75%)`;
            const starSize = center.x === 0 && center.y === 0 ? 10 : 3.5;

            // 2 to 4 orbiting planets per system
            const numPlanets = 2 + Math.floor(Math.random() * 3);
            const planetsList = [];
            for (let j = 0; j < numPlanets; j++) {
                planetsList.push({
                    orbitRadius: (center.x === 0 && center.y === 0 ? 30 : 12) + j * (center.x === 0 && center.y === 0 ? 20 : 8) + Math.random() * 5,
                    orbitSpeed: 0.02 + Math.random() * 0.03,
                    angle: Math.random() * Math.PI * 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: center.x === 0 && center.y === 0 ? 1.5 + Math.random() * 1.5 : 0.8 + Math.random() * 0.6
                });
            }

            collapsingSystems.push({
                startX: center.x,
                startY: center.y,
                starColor,
                starSize,
                planets: planetsList
            });
        });
    }

    // Collapse and fade controls: systems collapse and fade out over GALAXY_COLLAPSE_DURATION of progress
    const dFactor = Math.max(0, 1.0 - progress / GALAXY_COLLAPSE_DURATION);
    const systemOpacity = Math.max(0, 1.0 - progress / GALAXY_COLLAPSE_DURATION);
    const galaxyOpacity = overrideAlpha !== null ? overrideAlpha : Math.min(1.0, progress / GALAXY_FADE_IN_DURATION);

    // 1. Draw galaxy stars with fading-in opacity
    ctx.save();
    ctx.scale(GALAXY_FINAL_RENDER_SCALE, GALAXY_FINAL_RENDER_SCALE);
    
    galaxyStars.forEach(s => {
        const timeRotation = performance.now() * 0.0005;
        const currentTheta = s.theta + progress * 8 * s.speed + timeRotation * (s.speed * 80);
        const x = Math.cos(currentTheta) * s.r;
        const y = Math.sin(currentTheta) * s.r;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = galaxyOpacity;
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw galaxy core with fading-in opacity
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 35;
    ctx.globalAlpha = galaxyOpacity;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
    ctx.globalAlpha = 1.0;

    // 2. Draw collapsing systems with fading-out opacity
    if (systemOpacity > 0) {
        collapsingSystems.forEach(sys => {
            const systemX = sys.startX * dFactor;
            const systemY = sys.startY * dFactor;

            // Draw central star
            ctx.fillStyle = sys.starColor;
            ctx.globalAlpha = systemOpacity;
            ctx.beginPath();
            ctx.arc(systemX, systemY, sys.starSize, 0, Math.PI * 2);
            ctx.fill();

            // Draw planets and orbits
            sys.planets.forEach(pl => {
                pl.angle += pl.orbitSpeed;
                const px = systemX + Math.cos(pl.angle) * pl.orbitRadius;
                const py = systemY + Math.sin(pl.angle) * pl.orbitRadius;

                // Orbit line
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * systemOpacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.arc(systemX, systemY, pl.orbitRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Planet
                ctx.fillStyle = pl.color;
                ctx.beginPath();
                ctx.arc(px, py, pl.size, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        ctx.globalAlpha = 1.0;
    }
}

// 5. Present day solar system zoom in
function renderSolarSystem(isEarthHighlight) {
    const orbitalRadii = [80, 140, 200, 260];
    const planetColors = ['#a4b0be', '#f6b93b', '#2980b9', '#e74c3c'];

    // Sun
    ctx.fillStyle = '#fffae6';
    ctx.shadowColor = '#ffd32a';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    orbitalRadii.forEach((r, idx) => {
        const speed = (0.02 / Math.sqrt(r * 0.005)) * PLANET_ORBIT_SPEED_MULTIPLIER;
        const angle = (performance.now() * speed) % (Math.PI * 2);
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = planetColors[idx];

        if (idx === 2 && isEarthHighlight) {
            if (physicsData && physicsData.milestones.firstEarthlyPlanets.cosmicTimeYears !== "Never") {
                ctx.fillStyle = '#4bc0c0'; // Ocean
            } else {
                ctx.fillStyle = '#7f8c8d'; // Cratered grey rock
            }
        }

        ctx.beginPath();
        ctx.arc(px, py, idx === 2 ? 10 : 8, 0, Math.PI * 2);
        ctx.fill();

        if (idx === 2 && isEarthHighlight && physicsData.milestones.firstEarthlyPlanets.cosmicTimeYears !== "Never") {
            ctx.fillStyle = '#2ecc71'; // Green continents
            ctx.beginPath();
            ctx.arc(px + 2, py - 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px - 3, py + 3, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}
