import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CelestialSphere } from './objects/CelestialSphere.js';
import { Stars } from './objects/Stars.js';
import { Constellations } from './objects/Constellations.js'; // NEW
import { Planet } from './objects/Planet.js';
import { Moon } from './objects/Moon.js';

// Convert Coordinate System to match Astronomical Standards (Z is Up, XY is Equator plane)
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

class Simulation {
  constructor() {
    this.sceneManager = new SceneManager('canvas-container');
    this.params = {
      speed: 1,
      solarDay: 0,
      siderealDay: 0,
      solarDaysPerYear: 365.25,
      autoTime: false, // Disabled by default as requested
      sphereRadius: 500,
      isLightMode: false,
      latitude: -12
    };

    this.time = 0;
    this.objects = {};
    this.cases = [];
    this.currentCase = null;
    this.followedTarget = null; // New tracking state for Follow Astro focus

    this.init();
  }

  updateTimeFromSolarDay() {
    this.time = this.params.solarDay * 0.01; // Orbital clock
    const Y = this.params.solarDaysPerYear || 365.25;
    this.params.siderealDay = this.params.solarDay * (1 + 1 / Y);

    // The celestial sphere rotates exactly 2PI radians every 1 Sidereal Day.
    // The negative sign is because the Earth rotates West to East, so the sky appears to rotate East to West (-Z direction in our system)
    let zRotation = -this.params.siderealDay * 2 * Math.PI;

    // In Local View, we adjust the observer's Longitude by 180° (Math.PI) 
    // so that t=0 represents Sunrise (Sun in the East, -X) instead of Sunset (West, +X).
    if (this.sceneManager && this.sceneManager.isLocalView) {
      zRotation += Math.PI;
    }
    this.skyGroup.rotation.z = zRotation;

    // Update UI sliders
    const solSlider = document.getElementById('solar-day-range');
    const solVal = document.getElementById('solar-day-value');
    if (solSlider && solVal) {
      solSlider.value = this.params.solarDay;
      solVal.textContent = this.params.solarDay.toFixed(2);
      solVal.setAttribute('data-tooltip', this.params.solarDay.toFixed(5));
    }

    const sidSlider = document.getElementById('sidereal-day-range');
    const sidVal = document.getElementById('sidereal-day-value');
    if (sidSlider && sidVal) {
      sidSlider.value = this.params.siderealDay;
      sidVal.textContent = this.params.siderealDay.toFixed(2);
      sidVal.setAttribute('data-tooltip', this.params.siderealDay.toFixed(5));
    }
  }

  createTextSprite(message) {
    const canvas = document.createElement('canvas');
    // Ensure square aspect for best texture rendering bounds
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw solid bold bright red text
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7, // Added opacity
      depthTest: false // Ensures letters are always visible overlapping horizons
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    // Scale up the sprite to be visible from center (100 units away)
    sprite.scale.set(100, 100, 1);
    return sprite;
  }

  async init() {
    const R = this.params.sphereRadius;
    const tilt = 24;

    // 0. The Sky Group (Allows global rotation of all celestial objects)
    this.skyGroup = new THREE.Group();
    this.sceneManager.add(this.skyGroup);

    // 1. Celestial Sphere (Grid + Ecliptic)
    this.objects.sphere = new CelestialSphere(R);
    this.skyGroup.add(this.objects.sphere);

    // 2. Stars
    this.objects.stars = new Stars(R, './assets/myStars.xlsx');
    this.skyGroup.add(this.objects.stars);

    // 2b. Zodiac Constellations
    this.objects.zodiac = new Constellations(R, './assets/Constelaciones_zodiaco_notInverted.xlsx');
    this.objects.zodiac.visible = false; // Hidden by default as per checkbox
    this.skyGroup.add(this.objects.zodiac);

    // 3. Coordinate Axes
    this.objects.axes = new THREE.AxesHelper(R);
    this.objects.axes.visible = true; // Hidden by default
    this.sceneManager.add(this.objects.axes);

    // 4. Ground for Local View
    const groundGeo = new THREE.CircleGeometry(R, 64);
    const groundTex = new THREE.TextureLoader().load('./assets/textures/grass.png');
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(20, 20); // Tile it so it looks like grass
    const groundMat = new THREE.MeshLambertMaterial({
      map: groundTex,
      side: THREE.DoubleSide,
      transparent: false, // Default completely solid to occlude highlight rings
      opacity: 1,
      depthWrite: true // Must strictly write depth when solid to hide objects behind it
    });
    this.objects.ground = new THREE.Mesh(groundGeo, groundMat);
    this.objects.ground.visible = false; // Only visible in local view
    this.objects.ground.renderOrder = 2; // Force rendering AFTER stars(0) and planets(1)
    // En Z-Up, el plano XY es Z=0, CircleGeometry por defecto se crea en XY.
    this.sceneManager.add(this.objects.ground);

    // 4.5 The Neon Horizon Ring (Visible only when Transparent Ground is ON)
    // Tubería 3D (TorusGeometry) para evitar que se vuelva invisible al verse "de canto"
    const ringGeo = new THREE.TorusGeometry(R - 10, 0.5, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.objects.horizonRing = new THREE.Mesh(ringGeo, ringMat);
    this.objects.horizonRing.visible = false; // Tied to local view & transparent toggle
    this.objects.horizonRing.renderOrder = 2;
    this.sceneManager.add(this.objects.horizonRing);

    // 5. Compass Points (N, S, E, O) for Local View
    this.objects.compassGroup = new THREE.Group();

    // Helper to create both Sprite and vertical Line Segment
    const createCompassMarker = (text, x, y) => {
      const zHeight = 30;
      const markerGroup = new THREE.Group();

      const sprite = this.createTextSprite(text);
      sprite.position.set(0, 0, zHeight);
      sprite.renderOrder = 3; // Always on top of everything (Sun is 1, Ground is 2)
      // Force depth testing to ignore sorting and draw on top
      sprite.material.depthTest = false;
      markerGroup.add(sprite);

      // Red segment from ground Z=0 to slightly below Z=zHeight
      // Using a Cylinder instead of Line to allow adjustable thickness
      const compassLineWidth = 1; // Ajustable thickness variable

      const geo = new THREE.CylinderGeometry(compassLineWidth, compassLineWidth, zHeight - 15, 8);
      geo.rotateX(Math.PI / 2); // Lay cylinder flat along Z axis
      geo.translate(0, 0, (zHeight - 15) / 2); // Shift base to Z=0

      const mat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        depthTest: false // Ignore depth checks, always draw
      });
      const lineMesh = new THREE.Mesh(geo, mat);
      lineMesh.renderOrder = 3; // Render last, on top of all
      markerGroup.add(lineMesh);

      markerGroup.position.set(x, y, 0);
      return markerGroup;
    };

    // El Polo Norte Celeste se acuesta hacia -Y, el Polo Sur hacia +Y
    // Si miramos al Sur (+Y), nuestra derecha es +X. Y a la derecha del Sur está el Oeste.
    this.objects.compassGroup.add(createCompassMarker('N', 0, -R + 20)); // -Y
    this.objects.compassGroup.add(createCompassMarker('S', 0, R - 20));  // +Y
    this.objects.compassGroup.add(createCompassMarker('E', -R + 20, 0)); // -X
    this.objects.compassGroup.add(createCompassMarker('O', R - 20, 0));  // +X

    // Hidden by default, un-tilted (does not live in skyGroup), living rigidly on World axes.
    this.objects.compassGroup.visible = false;
    this.sceneManager.add(this.objects.compassGroup);

    // 5.5 Target Crosshair for "Follow Astro" GUI
    const crossCanvas = document.createElement('canvas');
    crossCanvas.width = 128; crossCanvas.height = 128;
    const crossCtx = crossCanvas.getContext('2d');
    crossCtx.strokeStyle = '#00FFFF'; // Cyan
    crossCtx.lineWidth = 4;
    crossCtx.beginPath();
    // Segmento Superior
    crossCtx.moveTo(64, 10); crossCtx.lineTo(64, 44);
    // Segmento Inferior
    crossCtx.moveTo(64, 84); crossCtx.lineTo(64, 118);
    // Segmento Izquierdo
    crossCtx.moveTo(10, 64); crossCtx.lineTo(44, 64);
    // Segmento Derecho
    crossCtx.moveTo(84, 64); crossCtx.lineTo(118, 64);
    crossCtx.stroke();
    const crossTex = new THREE.CanvasTexture(crossCanvas);
    crossTex.minFilter = THREE.LinearFilter;

    this.objects.targetCrosshair = new THREE.Sprite(new THREE.SpriteMaterial({
      map: crossTex,
      transparent: true,
      depthTest: false,
      color: 0x00FFFF
    }));
    this.objects.targetCrosshair.scale.set(30, 30, 1); // Slightly larger than typical ASTRO rings
    this.objects.targetCrosshair.visible = false;
    this.objects.targetCrosshair.renderOrder = 4; // Always on top of everything
    this.sceneManager.add(this.objects.targetCrosshair);

    // Initial setup ends here. The rest is loaded dynamically via loadCases()
    this.setupUI();
    this.animate();

    await this.loadCases();
  }

  async loadCases() {
    try {
      const response = await fetch('./assets/cases.json');
      this.cases = await response.json();
      this.populateCaseSelector();
      if (this.cases.length > 0) {
        this.loadCase(this.cases[0].id); // Load the first case by default
      }
    } catch (e) {
      console.error("Failed to load cases", e);
    }
  }

  populateCaseSelector() {
    const selector = document.getElementById('case-selector');
    if (!selector) return;

    selector.innerHTML = '';
    const optionsData = [];

    this.cases.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.title; // Usamos title para UI amigable
      selector.appendChild(option);
      optionsData.push({ text: c.title, value: c.id });
    });

    // Destruir instancia previa si existe para evitar duplicados en recargas
    if (this.slimSelectInstance) {
      this.slimSelectInstance.destroy();
    }

    this.slimSelectInstance = new SlimSelect({
      select: '#case-selector',
      settings: {
        showSearch: false,
      },
      events: {
        afterChange: (newVal) => {
          if (newVal && newVal.length > 0) {
            this.loadCase(newVal[0].value);
          }
        }
      }
    });
  }

  loadCase(caseId) {
    const caseData = this.cases.find(c => c.id === caseId);
    if (!caseData) return;

    this.currentCase = caseData;
    this.params.solarDaysPerYear = caseData.tropicalYear;
    const R = this.params.sphereRadius;
    const isLight = this.params.isLightMode;
    const tilt = caseData.eclipticTilt !== undefined ? caseData.eclipticTilt : 24;

    // 1. Remove existing dynamically loaded components
    if (this.objects.solarSystem) {
      this.skyGroup.remove(this.objects.solarSystem);
    }
    if (this.objects.moonGroups) {
      this.objects.moonGroups.forEach(g => this.skyGroup.remove(g));
    }
    if (this.objects.planetGroups) {
      this.objects.planetGroups.forEach(g => this.skyGroup.remove(g));
    }

    // 2. Recreate Solar System Base (Sun always exists)
    this.objects.solarSystem = new THREE.Group();
    // Tilt now happens around X or Y instead of X for depth? 
    // In Z-Up, the equator is XY. Tilting the ecliptic means tilting the XZ or YZ plane.
    // Usually, you tilt around X-axis:
    this.objects.solarSystem.rotation.x = tilt * (Math.PI / 180);
    this.skyGroup.add(this.objects.solarSystem);

    const observerOmega = (2 * Math.PI) / (caseData.tropicalYear / 100);

    this.objects.sun = new Planet(R + 1, '#FFD700', 40, {
      sunOmega1: observerOmega
    });
    this.objects.sun.updateTheme(isLight);
    this.objects.solarSystem.add(this.objects.sun);

    // 3. Recreate Moons dynamically
    this.objects.moonGroups = [];
    this.objects.moons = [];

    // Fallback if older cases.json without moons array is used
    const moonsData = caseData.moons || [{
      synodicMonthDays: caseData.synodicMonthDays,
      phaseOffset: caseData.phaseOffset !== undefined ? caseData.phaseOffset : 0,
      size: 40
    }];

    moonsData.forEach((mData) => {
      const moonGroup = new THREE.Group();
      moonGroup.rotation.x = tilt * (Math.PI / 180); // Dynamic tilt
      this.skyGroup.add(moonGroup);
      this.objects.moonGroups.push(moonGroup);

      const moonOmega = observerOmega + (2 * Math.PI) / (mData.synodicMonthDays / 100);

      const moon = new Moon(R, mData.size, {
        omega1: moonOmega,
        delta: mData.delta !== undefined ? mData.delta : 1.5,
        synodicMonthDays: mData.synodicMonthDays,
        phaseOffset: mData.phaseOffset !== undefined ? mData.phaseOffset : 0
      });
      moon.updateTheme(isLight);

      this.objects.moons.push(moon);
      moonGroup.add(moon);
    });

    // 3.5 Apply default visibility for Moons based on UI toggle
    const toggleMoons = document.getElementById('toggle-moons');
    const isMoonsVisible = toggleMoons ? toggleMoons.checked : true;
    this.objects.moonGroups.forEach(g => g.visible = isMoonsVisible);

    // 4. Recreate Planets dynamically
    this.objects.planetGroups = [];
    this.objects.planets = [];

    caseData.planets.forEach((pData) => {
      const pGroup = new THREE.Group();
      pGroup.rotation.x = (tilt + pData.tiltOffset) * (Math.PI / 180);
      this.skyGroup.add(pGroup);
      this.objects.planetGroups.push(pGroup);

      const planet = new Planet(R, pData.color, pData.size * 2, {
        sunOmega1: observerOmega, // Observer's angular velocity
        distanceToSun: pData.distanceToSun,
        initialPhase: pData.initialPhase
      });
      planet.updateTheme(isLight);

      this.objects.planets.push(planet);
      pGroup.add(planet);
    });

    // 5. Reset the Ecliptic Visual Grid UI independently
    const tiltInput = document.getElementById('ecliptic-tilt');
    const tiltVal = document.getElementById('ecliptic-tilt-val');
    const isEarth = (caseId === 'case-0');

    if (tiltInput && tiltVal) {
      if (isEarth) {
        tiltInput.value = 24;
        tiltVal.textContent = '24°';
      } else {
        tiltInput.value = 0;
        tiltVal.textContent = '0°';
      }
    }
    if (this.objects.sphere && this.objects.sphere.ecliptic) {
      const initialTilt = isEarth ? 24 : 0;
      this.objects.sphere.ecliptic.rotation.set(initialTilt * (Math.PI / 180), 0, 0);
    }

    // 6. Dynamic Toggles (Stars and Zodiac) logic


    // UI Containers
    const starsContainer = document.getElementById('stars-toggle-container');
    const zodiacContainer = document.getElementById('zodiac-toggle-container');
    const planetsHighlightContainer = document.getElementById('highlight-planets-toggle-container');
    const starsToggle = document.getElementById('toggle-stars');
    const zodiacToggle = document.getElementById('toggle-zodiac');
    const planetsHighlightToggle = document.getElementById('toggle-highlight-planets');

    if (isEarth) {
      // Earth: Show Toggles, respect their current checked states
      if (starsContainer) starsContainer.style.display = 'flex';
      if (zodiacContainer) zodiacContainer.style.display = 'flex';
      if (planetsHighlightContainer) planetsHighlightContainer.style.display = 'flex';

      if (this.objects.stars) this.objects.stars.visible = starsToggle.checked;
      if (this.objects.zodiac) this.objects.zodiac.visible = zodiacToggle.checked;

      if (this.objects.planets && planetsHighlightToggle) {
        this.objects.planets.forEach(p => p.setHighlight(planetsHighlightToggle.checked, isLight));
      }
    } else {
      // Not Earth: Hide Toggles, Force Stars ON, Force Zodiac OFF
      if (starsContainer) starsContainer.style.display = 'none';
      if (zodiacContainer) zodiacContainer.style.display = 'none';
      if (planetsHighlightContainer) planetsHighlightContainer.style.display = 'none';

      if (planetsHighlightToggle) planetsHighlightToggle.checked = false;

      if (this.objects.stars) this.objects.stars.visible = true;
      if (this.objects.zodiac) this.objects.zodiac.visible = false;

      if (this.objects.planets) {
        this.objects.planets.forEach(p => p.setHighlight(false, isLight));
      }
    }

    // 7. Dynamic Stars Rotation
    const caseIndex = parseInt(caseId.split('-')[1]) || 0;
    const rotX = caseIndex === 0 ? 0 : Math.sin(caseIndex * 1.5) * Math.PI;
    const rotY = caseIndex === 0 ? 0 : Math.cos(caseIndex * 2.3) * Math.PI;
    const rotZ = caseIndex === 0 ? 0 : Math.sin(caseIndex * 3.7) * Math.PI;

    if (this.objects.stars) {
      this.objects.stars.rotation.set(rotX, rotY, rotZ);
    }
    if (this.objects.zodiac) {
      this.objects.zodiac.rotation.set(rotX, rotY, rotZ);
    }

    // 8. Apply Render Mode (Sprite vs Mesh) based on View toggle to prevent edge distortion
    const toggleLocalView = document.getElementById('toggle-local-view');
    const isLocalView = toggleLocalView ? toggleLocalView.checked : false;

    if (this.objects.sun) this.objects.sun.setRenderMode(isLocalView);
    if (this.objects.moons) this.objects.moons.forEach(m => m.setRenderMode(isLocalView));
    if (this.objects.planets) this.objects.planets.forEach(p => p.setRenderMode(isLocalView));

    // Force an immediate update
    this.updateObjects();
  }

  setupUI() {
    const speedRange = document.getElementById('speed-range');
    const speedVal = document.getElementById('speed-value');
    speedRange.addEventListener('input', (e) => {
      this.params.speed = Number(e.target.value);
      speedVal.textContent = this.params.speed + 'x';
    });

    // Vista Local Toggle
    const toggleLocalView = document.getElementById('toggle-local-view');

    // Latitude Slider
    const latitudeSlider = document.getElementById('latitude-slider');
    const latitudeVal = document.getElementById('latitude-val');
    if (latitudeSlider && latitudeVal) {
      latitudeSlider.addEventListener('input', (e) => {
        this.params.latitude = Number(e.target.value);
        latitudeVal.textContent = this.params.latitude + '°';
        if (toggleLocalView && toggleLocalView.checked) {
          this.skyGroup.rotation.x = (90 - this.params.latitude) * (Math.PI / 180);
          if (!this.params.autoTime) {
            this.sceneManager.update();
          }
        }
      });
    }

    if (toggleLocalView) {
      // Ensure initial state
      this.skyGroup.rotation.set(0, 0, 0);

      toggleLocalView.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        if (isActive) {
          // Incline the celestial sphere based on latitude and enable local mode
          this.skyGroup.rotation.x = (90 - this.params.latitude) * (Math.PI / 180);
          this.sceneManager.setLocalView(true);
          if (this.objects.ground) {
            this.objects.ground.visible = true;
            // Opaque by default as per user request
            if (this.objects.ground.material) {
              this.objects.ground.material.transparent = false;
              this.objects.ground.material.opacity = 1.0;
              this.objects.ground.material.depthWrite = true;
              this.objects.ground.material.needsUpdate = true;
            }
          }
          if (this.objects.horizonRing) this.objects.horizonRing.visible = false;

          if (this.objects.compassGroup) this.objects.compassGroup.visible = true;

          const latControls = document.getElementById('latitude-controls');
          if (latControls) latControls.style.display = 'flex';

          // Show azimuthal and transparent ground toggle buttons in local view
          const btnAzimuthal = document.getElementById('btn-toggle-azimuthal-grid');
          if (btnAzimuthal) btnAzimuthal.style.display = 'flex';

          const btnGround = document.getElementById('btn-toggle-transparent-ground');
          if (btnGround) {
            btnGround.style.display = 'flex';
            btnGround.classList.remove('active'); // Reset to inactive (opaque)
          }

        } else {
          // Restore default view
          this.skyGroup.rotation.set(0, 0, 0);
          this.sceneManager.setLocalView(false);
          if (this.objects.ground) {
            this.objects.ground.visible = false;
            // Reset to opaque
            if (this.objects.ground.material) {
              this.objects.ground.material.transparent = false;
              this.objects.ground.material.opacity = 1.0;
              this.objects.ground.material.depthWrite = true;
              this.objects.ground.material.needsUpdate = true;
            }
          }
          if (this.objects.horizonRing) this.objects.horizonRing.visible = false;
          if (this.objects.compassGroup) this.objects.compassGroup.visible = false;

          const latControls = document.getElementById('latitude-controls');
          if (latControls) latControls.style.display = 'none';

          // Hide azimuthal and ground toggle buttons when leaving local view
          const btnAzimuthal = document.getElementById('btn-toggle-azimuthal-grid');
          if (btnAzimuthal) btnAzimuthal.style.display = 'none';

          const btnGround = document.getElementById('btn-toggle-transparent-ground');
          if (btnGround) {
            btnGround.style.display = 'none';
            btnGround.classList.remove('active');
          }

          if (this.objects.sphere && this.objects.sphere.azimuthalGrid) {
            this.objects.sphere.azimuthalGrid.visible = false;
          }
        }

        // Toggle distortion-free Sprites for massive celestial bodies
        if (this.objects.sun) this.objects.sun.setRenderMode(isActive);
        if (this.objects.moons) this.objects.moons.forEach(m => m.setRenderMode(isActive));
        if (this.objects.planets) this.objects.planets.forEach(p => p.setRenderMode(isActive));

        // Toggle Star Highlight rings based on view mode
        if (this.starHighlightRings && this.starHighlightMeshes) {
          for (let [instanceId, ring] of this.starHighlightRings.entries()) {
            const meshRing = this.starHighlightMeshes.get(instanceId);
            // Verify if it is currently highlighted by checking its color against default, or simply if either of rings are visible
            if (ring.visible || (meshRing && meshRing.visible)) {
              ring.visible = isActive;
              if (meshRing) meshRing.visible = !isActive;
            }
          }
        }

        this.updateTimeFromSolarDay(); // Apply or remove the longitude offset

        if (!this.params.autoTime) {
          this.updateObjects();
          this.sceneManager.update();
        }
      });
    }

    const btnToggleTransparentGround = document.getElementById('btn-toggle-transparent-ground');
    if (btnToggleTransparentGround) {
      btnToggleTransparentGround.addEventListener('click', () => {
        if (this.objects.ground && this.objects.ground.material) {
          const isTransparent = !this.objects.ground.material.transparent;

          this.objects.ground.material.transparent = isTransparent;
          this.objects.ground.material.opacity = isTransparent ? 0.3 : 1.0;
          this.objects.ground.material.depthWrite = !isTransparent;
          this.objects.ground.material.needsUpdate = true;

          btnToggleTransparentGround.classList.toggle('active', isTransparent);

          if (this.objects.horizonRing) {
            this.objects.horizonRing.visible = isTransparent;
          }

          if (!this.params.autoTime) {
            this.sceneManager.update();
          }
        }
      });
    }

    // Ctrl + Drag to rotate sky on Z axis (Raycaster physical tracking approach)
    let isDraggingSky = false;
    let initialSkyZ = 0;
    let startPhi = 0;

    const virtualSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), this.params.sphereRadius);
    const raycaster = new THREE.Raycaster();

    const getSpherePhi = (clientX, clientY) => {
      // Normalised device coordinates
      const ndcX = (clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.sceneManager.camera);

      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectSphere(virtualSphere, target);

      if (hit) {
        // Un-tilt the point by generating the inverse quaternion of the current X rotation.
        const tiltQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.skyGroup.rotation.x);
        const inverseTilt = tiltQuat.clone().invert();

        const untiltedPoint = hit.clone().applyQuaternion(inverseTilt);
        return Math.atan2(untiltedPoint.y, untiltedPoint.x);
      }
      return null;
    };

    document.addEventListener('pointerdown', (e) => {
      if (toggleLocalView && toggleLocalView.checked && e.ctrlKey && e.button === 0) {
        const phi = getSpherePhi(e.clientX, e.clientY);
        if (phi !== null) {
          this.sceneManager.controls.enabled = false; // Disable OrbitControls temporarily
          isDraggingSky = true;
          startPhi = phi;
          initialSkyZ = this.skyGroup.rotation.z;
        }
      }
    });

    document.addEventListener('pointermove', (e) => {
      if (isDraggingSky) {
        const currentPhi = getSpherePhi(e.clientX, e.clientY);
        if (currentPhi !== null) {
          let deltaPhi = currentPhi - startPhi;

          // Normalize angular difference to avoid wrap-around jumps
          if (deltaPhi > Math.PI) deltaPhi -= 2 * Math.PI;
          if (deltaPhi < -Math.PI) deltaPhi += 2 * Math.PI;

          this.skyGroup.rotation.z = initialSkyZ + deltaPhi;

          // Backcalculate time from physical rotation
          let newSkyZ = initialSkyZ + deltaPhi;
          if (this.sceneManager && this.sceneManager.isLocalView) {
            newSkyZ -= Math.PI; // Remove longitude offset for absolute time calculation
          }
          const newSiderealDay = -newSkyZ / (2 * Math.PI);
          const Y = this.params.solarDaysPerYear || 365.25;

          // Apply to the master Solar clock
          this.params.solarDay = newSiderealDay / (1 + 1 / Y);
          this.updateTimeFromSolarDay();
          // Note: updateTimeFromSolarDay overrides skyGroup.rotation.z rigorously

          if (!this.params.autoTime) {
            this.updateObjects();
            this.sceneManager.update();
          }
        }
      }
    });

    // Cleanup events for Ctrl+Drag
    const endDragState = () => {
      if (isDraggingSky) {
        isDraggingSky = false;
        // Re-enable orbit controls (for lookAt dragging) only if we're not forcefully disabling later
        this.sceneManager.controls.enabled = true;
      }
    };

    document.addEventListener('pointerup', endDragState);
    document.addEventListener('pointercancel', endDragState);

    const solSlider = document.getElementById('solar-day-range');
    const sidSlider = document.getElementById('sidereal-day-range');

    if (solSlider) {
      solSlider.addEventListener('input', (e) => {
        // Round to nearest integer for manual dragging as per user request
        this.params.solarDay = Math.round(Number(e.target.value));
        this.updateTimeFromSolarDay();
        if (!this.params.autoTime) {
          this.updateObjects();
          this.sceneManager.update();
        }
      });
    }

    if (sidSlider) {
      sidSlider.addEventListener('input', (e) => {
        // Round to nearest integer for manual dragging as per user request
        const sidDay = Math.round(Number(e.target.value));
        const Y = this.params.solarDaysPerYear || 365.25;
        this.params.solarDay = sidDay / (1 + 1 / Y);
        this.updateTimeFromSolarDay();
        if (!this.params.autoTime) {
          this.updateObjects();
          this.sceneManager.update();
        }
      });
    }

    // Spinner Buttons Logic
    const bindSpinnerBtn = (id, sliderElem, isSolar, isIncrement) => {
      const btn = document.getElementById(id);
      if (btn && sliderElem) {
        btn.addEventListener('click', () => {
          // Use internal precision state as reference instead of rounded slider value
          let currentVal = isSolar ? this.params.solarDay : this.params.siderealDay;

          let newVal = currentVal + (isIncrement ? 1 : -1);
          newVal = Math.max(Number(sliderElem.min), Math.min(Number(sliderElem.max), newVal));

          // Dispatch the logic equivalent to slider movement but with ±1.00 precise increment
          if (isSolar) {
            this.params.solarDay = newVal;
          } else {
            const Y = this.params.solarDaysPerYear || 365.25;
            this.params.solarDay = newVal / (1 + 1 / Y);
          }

          this.updateTimeFromSolarDay();
          if (!this.params.autoTime) {
            this.updateObjects();
            this.sceneManager.update();
          }
        });
      }
    };

    bindSpinnerBtn('solar-minus', solSlider, true, false);
    bindSpinnerBtn('solar-plus', solSlider, true, true);
    bindSpinnerBtn('sidereal-minus', sidSlider, false, false);
    bindSpinnerBtn('sidereal-plus', sidSlider, false, true);

    // Cancel Astro Tracking on User Manual Camera Intervention
    this.sceneManager.controls.addEventListener('start', () => {
      if (this.followedTarget) {
        this.followedTarget = null;
        if (this.objects.targetCrosshair) this.objects.targetCrosshair.visible = false;
        console.log("Follow target cancelled by user interaction.");
      }
    });

    // Mathematical keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Allow spacebar interactions to toggle time animation, even if a slider is focused
      if (e.code === 'Space') {
        const isTextInput = e.target.tagName === 'INPUT' &&
          !['range', 'checkbox', 'radio'].includes(e.target.type) &&
          e.target.tagName !== 'TEXTAREA';

        if (!isTextInput) {
          e.preventDefault(); // Prevent page scrolling or slider movement
          if (e.target.blur) e.target.blur(); // Remove "white highlight" focus

          const toggleAutoTime = document.getElementById('toggle-auto-time');
          if (toggleAutoTime) toggleAutoTime.click();
          return;
        }
      }

      if (e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') return;

      const Y = this.params.solarDaysPerYear || 365.25;
      let timeChanged = false;

      if (e.key === '+' || e.key === '=') {
        if (e.shiftKey) {
          const nextSidereal = this.params.siderealDay + 1;
          this.params.solarDay = nextSidereal / (1 + 1 / Y);
        } else {
          this.params.solarDay += 1;
        }
        timeChanged = true;
      } else if (e.key === '-' || e.key === '_') {
        if (e.shiftKey) {
          const nextSidereal = this.params.siderealDay - 1;
          this.params.solarDay = nextSidereal / (1 + 1 / Y);
        } else {
          this.params.solarDay -= 1;
        }
        timeChanged = true;
      }

      if (timeChanged) {
        this.updateTimeFromSolarDay();
        if (!this.params.autoTime) {
          this.updateObjects();
          this.sceneManager.update();
        }
      }
    });

    const toggleAutoTime = document.getElementById('toggle-auto-time'); // Match the HTML ID precisely
    const speedControls = document.getElementById('speed-controls');

    if (toggleAutoTime) {
      // Set initial visibility
      if (speedControls) {
        speedControls.style.display = toggleAutoTime.checked ? 'flex' : 'none';
      }

      toggleAutoTime.addEventListener('change', (e) => {
        this.params.autoTime = e.target.checked;
        if (speedControls) {
          speedControls.style.display = e.target.checked ? 'flex' : 'none';
        }
      });
    }

    // Visibility Toggles
    const btnToggleGrid = document.getElementById('btn-toggle-grid');
    if (btnToggleGrid) {
      btnToggleGrid.addEventListener('click', () => {
        if (this.objects.sphere && this.objects.sphere.equatorialGrid) {
          const isVisible = !this.objects.sphere.equatorialGrid.visible;
          this.objects.sphere.equatorialGrid.visible = isVisible;
          btnToggleGrid.classList.toggle('active', isVisible);
          if (!this.params.autoTime) {
            this.sceneManager.update();
          }
        }
      });
    }

    const btnToggleAzimuthal = document.getElementById('btn-toggle-azimuthal-grid');
    if (btnToggleAzimuthal) {
      btnToggleAzimuthal.addEventListener('click', () => {
        if (this.objects.sphere && this.objects.sphere.azimuthalGrid) {
          const isVisible = !this.objects.sphere.azimuthalGrid.visible;
          this.objects.sphere.azimuthalGrid.visible = isVisible;
          btnToggleAzimuthal.classList.toggle('active', isVisible);
          if (!this.params.autoTime) {
            this.sceneManager.update();
          }
        }
      });
    }

    // New Equator Toggle
    const toggleEquator = document.getElementById('toggle-equator');
    toggleEquator.addEventListener('change', (e) => {
      if (this.objects.sphere && this.objects.sphere.equator) {
        this.objects.sphere.equator.visible = e.target.checked;
      }
    });

    document.getElementById('toggle-stars').addEventListener('change', (e) => {
      if (this.objects.stars) this.objects.stars.visible = e.target.checked;
    });

    const toggleMoons = document.getElementById('toggle-moons');
    if (toggleMoons) {
      toggleMoons.addEventListener('change', (e) => {
        if (this.objects.moonGroups) {
          const isVisible = e.target.checked;
          this.objects.moonGroups.forEach(g => g.visible = isVisible);
        }
      });
    }

    document.getElementById('toggle-zodiac').addEventListener('change', (e) => {
      if (this.objects.zodiac) this.objects.zodiac.visible = e.target.checked;
    });

    const togglePlanetHighlight = document.getElementById('toggle-highlight-planets');
    if (togglePlanetHighlight) {
      togglePlanetHighlight.addEventListener('change', (e) => {
        const isHighlighted = e.target.checked;
        if (this.objects.planets) {
          const isLight = this.params.isLightMode;
          this.objects.planets.forEach(p => p.setHighlight(isHighlighted, isLight));
        }
        if (!this.params.autoTime) {
          this.sceneManager.update();
        }
      });
    }

    const toggleAxes = document.getElementById('toggle-axes');
    if (toggleAxes) {
      if (this.objects.axes) {
        this.objects.axes.visible = toggleAxes.checked;
      }
      toggleAxes.addEventListener('change', (e) => {
        if (this.objects.axes) {
          this.objects.axes.visible = e.target.checked;
        }
      });
    }

    // Ecliptic Toggle & Controls
    const eclipticToggle = document.getElementById('toggle-ecliptic');
    const eclipticControls = document.getElementById('ecliptic-controls');

    // Initialize Ecliptic State based on checkbox
    if (this.objects.sphere && this.objects.sphere.ecliptic) {
      const isEclipticVisible = eclipticToggle.checked;
      this.objects.sphere.ecliptic.visible = isEclipticVisible;
      eclipticControls.style.display = isEclipticVisible ? 'flex' : 'none';
    }

    // Initialize Equator State
    if (this.objects.sphere && this.objects.sphere.equator) {
      this.objects.sphere.equator.visible = toggleEquator.checked;
    }

    eclipticToggle.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      if (this.objects.sphere && this.objects.sphere.ecliptic) {
        this.objects.sphere.ecliptic.visible = isVisible;
      }
      eclipticControls.style.display = isVisible ? 'flex' : 'none';
    });

    // Ecliptic Rotation Logic
    const tiltInput = document.getElementById('ecliptic-tilt');
    const tiltVal = document.getElementById('ecliptic-tilt-val');

    const updateEcliptic = () => {
      if (this.objects.sphere && this.objects.sphere.ecliptic) {
        const tilt = 1 * Number(tiltInput.value) * (Math.PI / 180);

        // Allow rotation on Z (Node) to just be 0 for now as requested
        // Only apply Tilt (X rotation)
        this.objects.sphere.ecliptic.rotation.set(tilt, 0, 0);
      }
    };

    tiltInput.addEventListener('input', (e) => {
      tiltVal.textContent = e.target.value + '°';
      updateEcliptic();
    });

    // UI Overlay Toggle Logic
    const uiOverlay = document.getElementById('ui-overlay');
    const uiToggleBtn = document.getElementById('ui-overlay-toggle');

    if (uiOverlay && uiToggleBtn) {
      // Check local storage for initial state
      const isCollapsed = localStorage.getItem('uiOverlayCollapsed') === 'true';
      if (isCollapsed) {
        uiOverlay.classList.add('collapsed');
      }

      uiToggleBtn.addEventListener('click', () => {
        uiOverlay.classList.toggle('collapsed');
        const currentState = uiOverlay.classList.contains('collapsed');
        localStorage.setItem('uiOverlayCollapsed', currentState);
      });
    }

    // Theme Toggle Logic
    const themeBtn = document.getElementById('theme-toggle');
    const sunIcon = themeBtn.querySelector('.sun-icon');
    const moonIcon = themeBtn.querySelector('.moon-icon');

    const toggleTheme = () => {
      this.params.isLightMode = !this.params.isLightMode;
      const isLight = this.params.isLightMode;

      // 1. Toggle CSS class
      document.body.classList.toggle('light-mode', isLight);

      // 2. Toggle Icons
      sunIcon.style.display = isLight ? 'block' : 'none';
      moonIcon.style.display = isLight ? 'none' : 'block';

      // 3. Update Three.js Objects
      this.sceneManager.updateTheme(isLight);
      if (this.objects.sphere) this.objects.sphere.updateTheme(isLight);
      if (this.objects.stars) this.objects.stars.updateTheme(isLight);

      // Update Moons
      if (this.objects.moons) {
        this.objects.moons.forEach(m => m.updateTheme(isLight));
      }

      // Update Planets
      if (this.objects.planets) {
        this.objects.planets.forEach(p => p.updateTheme(isLight));
      }

      // Sun/Planets/Moon generally look okay on both, but could be tweaked here.
    };

    themeBtn.addEventListener('click', toggleTheme);

    // Interactive Raycaster for Color Palette
    const astroRaycaster = new THREE.Raycaster();
    const popup = document.getElementById('color-palette-popup');
    let selectedAstro = null; // Can hold { type: 'planet'|'moon', object: Object3D } or { type: 'star', instanceId: int }

    if (popup) {
      document.addEventListener('contextmenu', (e) => {
        // Only trigger on the canvas
        if (e.target.tagName !== 'CANVAS') return;
        e.preventDefault();

        // Normalize mouse coordinates (-1 to +1)
        const mouse = new THREE.Vector2(
          (e.clientX / window.innerWidth) * 2 - 1,
          -(e.clientY / window.innerHeight) * 2 + 1
        );

        astroRaycaster.setFromCamera(mouse, this.sceneManager.camera);

        // Build list of hittable objects
        const hittables = [];
        if (this.objects.planets) {
          this.objects.planets.forEach(p => {
            if (p.mesh && p.mesh.visible) hittables.push(p.mesh);
            if (p.sprite && p.sprite.visible) hittables.push(p.sprite);
          });
        }
        if (this.objects.moons) {
          this.objects.moons.forEach(m => {
            if (m.mesh && m.mesh.visible) hittables.push(m.mesh);
            if (m.sprite && m.sprite.visible) hittables.push(m.sprite);
          });
        }
        if (this.objects.stars && this.objects.stars.visible && this.objects.stars.instancedMesh) {
          hittables.push(this.objects.stars.instancedMesh);
        }
        // Include the Sun in hittable targets
        if (this.objects.sun) {
          if (this.objects.sun.mesh && this.objects.sun.mesh.visible) hittables.push(this.objects.sun.mesh);
          if (this.objects.sun.sprite && this.objects.sun.sprite.visible) hittables.push(this.objects.sun.sprite);
        }

        const intersects = astroRaycaster.intersectObjects(hittables, false);

        if (intersects.length > 0) {
          // Get the closest hit
          const hit = intersects[0];

          // Determine what was hit
          if (hit.object === (this.objects.stars && this.objects.stars.instancedMesh)) {
            selectedAstro = { type: 'star', instanceId: hit.instanceId };
          } else {
            // Find parent Planet or Moon class instance by looking up the tree
            const parentGroup = hit.object.parent;
            if (this.objects.sun && parentGroup === this.objects.sun) {
              selectedAstro = { type: 'sun', ref: parentGroup };
            } else if (this.objects.planets && this.objects.planets.includes(parentGroup)) {
              selectedAstro = { type: 'planet', ref: parentGroup };
            } else if (this.objects.moons && this.objects.moons.includes(parentGroup)) {
              selectedAstro = { type: 'moon', ref: parentGroup };
            }
          }

          if (selectedAstro) {
            // Show popup at mouse position
            popup.style.display = 'block';
            popup.style.left = e.clientX + 'px';
            popup.style.top = e.clientY + 'px';
          }
        } else {
          popup.style.display = 'none';
          selectedAstro = null;
        }
      });

      // Hide popup on regular click
      document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('color-swatch') && !popup.contains(e.target)) {
          popup.style.display = 'none';
          selectedAstro = null;
        }
      });

      // Setup swatches logic
      const swatches = popup.querySelectorAll('.color-swatch');
      swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          if (!selectedAstro) return;
          const hexColorStr = e.target.getAttribute('data-color');
          const colorObj = new THREE.Color(hexColorStr);

          if (selectedAstro.type === 'star') {
            const starsMesh = this.objects.stars.instancedMesh;
            starsMesh.setColorAt(selectedAstro.instanceId, colorObj);
            starsMesh.instanceColor.needsUpdate = true;

            // Highlight ring for individual stars
            if (!this.starRingTexture) {
              const canvas = document.createElement('canvas');
              canvas.width = 128; canvas.height = 128;
              const ctx = canvas.getContext('2d');
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 10;
              ctx.beginPath();
              ctx.arc(64, 64, 58, 0, Math.PI * 2);
              ctx.stroke();
              this.starRingTexture = new THREE.CanvasTexture(canvas);
              this.starRingTexture.minFilter = THREE.LinearFilter;
            }
            if (!this.starHighlightRings) this.starHighlightRings = new Map();
            if (!this.starHighlightMeshes) this.starHighlightMeshes = new Map();

            let ring = this.starHighlightRings.get(selectedAstro.instanceId);
            let meshRing = this.starHighlightMeshes.get(selectedAstro.instanceId);

            const matrix = new THREE.Matrix4();
            starsMesh.getMatrixAt(selectedAstro.instanceId, matrix);
            const pos = new THREE.Vector3().setFromMatrixPosition(matrix);

            if (!ring) {
              ring = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.starRingTexture, transparent: true
              }));

              const ringScale = 25; // Unified global scale for all UI rings
              ring.scale.set(ringScale, ringScale, 1);
              ring.renderOrder = 2;

              this.objects.stars.add(ring);
              this.starHighlightRings.set(selectedAstro.instanceId, ring);
            }
            ring.position.copy(pos);
            ring.material.color.copy(colorObj);

            if (!meshRing) {
              // Same exact CircleGeometry idea as Planets
              const ringGeometry = new THREE.RingGeometry(1.5 * 5, 1.5 * 4, 16);
              const meshRingMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                depthTest: false
              });
              meshRing = new THREE.Mesh(ringGeometry, meshRingMat);
              meshRing.renderOrder = 2;

              this.objects.stars.add(meshRing);
              this.starHighlightMeshes.set(selectedAstro.instanceId, meshRing);
            }
            meshRing.position.copy(pos);
            meshRing.lookAt(0, 0, 0); // Geometric tangent
            meshRing.material.color.copy(colorObj);

            // Toggle visibility based on view mode
            ring.visible = this.sceneManager.isLocalView;
            meshRing.visible = !this.sceneManager.isLocalView;

          } else if (selectedAstro.type === 'planet' || selectedAstro.type === 'sun') {
            const p = selectedAstro.ref;
            if (p.setCustomColor) p.setCustomColor(hexColorStr);
          } else if (selectedAstro.type === 'moon') {
            const m = selectedAstro.ref;
            if (m.setCustomColor) m.setCustomColor(hexColorStr);
            m.update(this.time, this.sceneManager.camera, this.objects.sun); // Force redraw
          }

          if (!this.params.autoTime) {
            this.sceneManager.update();
          }

          // Close popup after selection
          popup.style.display = 'none';
          selectedAstro = null;
        });
      });

      const removeBtn = document.getElementById('remove-highlight-btn');
      const followBtn = document.getElementById('follow-astro-btn');

      if (followBtn) {
        followBtn.addEventListener('click', () => {
          if (!selectedAstro) return;
          // Capture the selected astro to track it indefinitely, until user pans the camera
          this.followedTarget = { ...selectedAstro };

          if (!this.params.autoTime) {
            this.sceneManager.update();
          }

          popup.style.display = 'none';
          // Do not null selectedAstro here because we might want it alive? No, we hide the popup.
          selectedAstro = null;
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          if (!selectedAstro) return;

          if (selectedAstro.type === 'star') {
            const starsMesh = this.objects.stars.instancedMesh;
            const defaultColor = this.params.isLightMode ? new THREE.Color(0x333333) : new THREE.Color(0xffffff);
            starsMesh.setColorAt(selectedAstro.instanceId, defaultColor);
            starsMesh.instanceColor.needsUpdate = true;

            if (this.starHighlightRings) {
              const ring = this.starHighlightRings.get(selectedAstro.instanceId);
              if (ring) ring.visible = false;
            }
            if (this.starHighlightMeshes) {
              const meshRing = this.starHighlightMeshes.get(selectedAstro.instanceId);
              if (meshRing) meshRing.visible = false;
            }
          } else if (selectedAstro.type === 'planet' || selectedAstro.type === 'sun') {
            selectedAstro.ref.removeCustomColor(this.params.isLightMode);
          } else if (selectedAstro.type === 'moon') {
            selectedAstro.ref.removeCustomColor();
            selectedAstro.ref.update(this.time, this.sceneManager.camera, this.objects.sun, this.sceneManager.isLocalView);
          }

          if (!this.params.autoTime) {
            this.sceneManager.update();
          }

          popup.style.display = 'none';
          selectedAstro = null;
        });
      }
    }

    // Help Modal Logic
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help-btn');

    if (helpBtn && helpModal && closeHelpBtn) {
      const openModal = () => {
        helpModal.style.display = 'flex';
        // Add a small delay to allow display flex to apply before animation
        setTimeout(() => {
          helpModal.style.opacity = '1';
        }, 10);
      };

      const closeModal = () => {
        helpModal.style.opacity = '0';
        setTimeout(() => {
          helpModal.style.display = 'none';
        }, 300); // Matches the CSS transition/animation duration
      };

      helpBtn.addEventListener('click', openModal);
      closeHelpBtn.addEventListener('click', closeModal);

      // Close on clicking outside the modal content
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          closeModal();
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.style.display === 'flex') {
          closeModal();
        }
      });
    }
  }

  updateObjects() {
    if (this.objects.sphere) this.objects.sphere.update(this.skyGroup);
    if (this.objects.sun) this.objects.sun.update(this.time);
    if (this.objects.moons) {
      this.objects.moons.forEach((m) => {
        // Pass the camera and sun references to the Moon for accurate physical phase rotation
        m.update(this.time, this.sceneManager.camera, this.objects.sun, this.sceneManager.isLocalView);
      });
    }
    if (this.objects.planets) {
      // Speed factor must be strictly 1 for all to maintain relative physical Keplerian kinematics
      this.objects.planets.forEach((p) => p.update(this.time));
    }

    // Follow Astro Logic (Universal Camera Chase)
    const toggleLocalView = document.getElementById('toggle-local-view');

    if (toggleLocalView && toggleLocalView.checked && this.followedTarget) {
      // 1. Force update the world matrix of the entire sky group 
      this.skyGroup.updateMatrixWorld(true);

      const astroPosition = new THREE.Vector3();

      // Determine real world coordinates based on the type of astro we are following
      if (this.followedTarget.type === 'star') {
        const matrix = new THREE.Matrix4();
        this.objects.stars.instancedMesh.getMatrixAt(this.followedTarget.instanceId, matrix);
        astroPosition.setFromMatrixPosition(matrix);
        // Instanced meshes hold positions local to their parent, apply world matrix
        astroPosition.applyMatrix4(this.objects.stars.instancedMesh.matrixWorld);
      } else if (this.followedTarget.type === 'planet') {
        this.followedTarget.ref.mesh.getWorldPosition(astroPosition);
      } else if (this.followedTarget.type === 'moon') {
        this.followedTarget.ref.mesh.getWorldPosition(astroPosition);
      } else if (this.followedTarget.type === 'sun') {
        this.objects.sun.mesh.getWorldPosition(astroPosition); // futureproofing
      }

      // 2. The Local View camera target is at (0, 0, 10) natively
      const targetPos = this.sceneManager.controls.target;

      // 3. Direction vector from target towards the Astro
      const direction = new THREE.Vector3().subVectors(astroPosition, targetPos).normalize();

      // 4. Place the camera exactly 0.1 units BEHIND the target, looking along the direction vector
      // This causes OrbitControls to seamlessly gaze at the Astro without breaking the FPS illusion.
      this.sceneManager.camera.position.copy(targetPos).sub(direction.multiplyScalar(0.1));
      this.sceneManager.controls.update();

      // Place target crosshair physically in World space hovering over the target
      if (this.objects.targetCrosshair) {
        this.objects.targetCrosshair.position.copy(astroPosition);
        this.objects.targetCrosshair.visible = true;
      }
    } else {
      if (this.objects.targetCrosshair) {
        this.objects.targetCrosshair.visible = false;
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.params.autoTime) {
      const dayIncrement = this.params.speed * 0.0001; // half speed (was 0.1)
      this.params.solarDay += dayIncrement;
      this.updateTimeFromSolarDay();
    }

    this.updateObjects();
    this.sceneManager.update();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new Simulation();
});
