import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CelestialSphere } from './objects/CelestialSphere.js';
import { Stars } from './objects/Stars.js';
import { Constellations } from './objects/Constellations.js';
import { Planet } from './objects/Planet.js';
import { ApparentPositionMarker } from './objects/ApparentPositionMarker.js';
import { ApparentTrail } from './objects/ApparentTrail.js';
import { MenuBarController } from '../components/MenuBar/MenuBarController.js';
import { TimeHudController } from '../components/TimeHud/TimeHudController.js';

class Simulation {
  constructor() {
    this.sceneManager = new SceneManager('canvas-container');

    const initialSpeed = (window.CONFIG && window.CONFIG.DEFAULT_SPEED !== undefined) ? window.CONFIG.DEFAULT_SPEED : 1;
    const initialRadius = (window.CONFIG && window.CONFIG.SPHERE_RADIUS !== undefined) ? window.CONFIG.SPHERE_RADIUS : 3000;

    this.params = {
      speed: initialSpeed,
      day: 0,
      autoTime: true,
      sphereRadius: initialRadius,
      isLightMode: false
    };

    this.selectedAstro = 'venus'; // 'venus', 'mars', 'moon'
    this.followTarget = 'NONE'; // 'NONE', 'ASTRO'
    this.cameraMode = 'SUN'; // 'SUN', 'EARTH', 'ASTRO'
    this.isRealisticMode = false;

    this.time = 0;
    this.objects = {};

    this.init();
  }

  async init() {
    const R = (window.CONFIG && window.CONFIG.SPHERE_RADIUS !== undefined) ? window.CONFIG.SPHERE_RADIUS : 3000;
    this.params.sphereRadius = R;

    const tilt = (window.CONFIG && window.CONFIG.ECLIPTIC_TILT !== undefined) ? window.CONFIG.ECLIPTIC_TILT : 24;

    const sunRadius = (window.CONFIG && window.CONFIG.SUN_RADIUS !== undefined) ? window.CONFIG.SUN_RADIUS : 100;
    const earthRadius = (window.CONFIG && window.CONFIG.EARTH_RADIUS !== undefined) ? window.CONFIG.EARTH_RADIUS : 50;
    const venusRadius = (window.CONFIG && window.CONFIG.VENUS_RADIUS !== undefined) ? window.CONFIG.VENUS_RADIUS : 50;
    const marsRadius = (window.CONFIG && window.CONFIG.MARS_RADIUS !== undefined) ? window.CONFIG.MARS_RADIUS : 40;
    const moonRadius = (window.CONFIG && window.CONFIG.MOON_RADIUS !== undefined) ? window.CONFIG.MOON_RADIUS : 20;

    // 1. Esfera Celeste (Rejilla Ecuatorial + Eclíptica)
    this.objects.sphere = new CelestialSphere(R);
    this.objects.sphere.rotation.x = -tilt * (Math.PI / 180);
    this.sceneManager.add(this.objects.sphere);
    const toggleGridEl = document.getElementById('toggle-grid');
    if (toggleGridEl) this.objects.sphere.visible = toggleGridEl.checked;

    // 2. Estrellas de Fondo
    this.objects.stars = new Stars(R, './assets/myStars.xlsx');
    this.objects.stars.rotation.x = -tilt * (Math.PI / 180);
    this.sceneManager.add(this.objects.stars);
    const toggleStarsEl = document.getElementById('toggle-stars');
    if (toggleStarsEl) this.objects.stars.visible = toggleStarsEl.checked;

    // 2b. Constelaciones Zodiacales
    this.objects.zodiac = new Constellations(R, './assets/Constelaciones_zodiaco.xlsx');
    this.objects.zodiac.rotation.x = -tilt * (Math.PI / 180);
    this.sceneManager.add(this.objects.zodiac);
    const toggleZodiacEl = document.getElementById('toggle-zodiac');
    if (toggleZodiacEl) this.objects.zodiac.visible = toggleZodiacEl.checked;

    // 3. Grupo del Sistema Solar Heliocéntrico
    this.objects.solarSystem = new THREE.Group();
    this.objects.solarSystem.rotation.x = 0;
    this.sceneManager.add(this.objects.solarSystem);

    // SOL
    this.objects.sun = new Planet(R, '#FFD700', sunRadius * 2, {
      deferentRadius: 0,
      epicycleRadius: 0,
      deferentSpeed: 0,
      epicycleSpeed: 0,
      deferentPhase: 0
    });
    this.objects.solarSystem.add(this.objects.sun);

    // TIERRA (Heliocéntrico)
    const earthPeriod = (window.CONFIG && window.CONFIG.EARTH_ORBITAL_PERIOD) || 365.25;
    const earthSpeed = -(2 * Math.PI) / (earthPeriod / 100);
    const earthOrbitRadius = (window.CONFIG && window.CONFIG.EARTH_ORBIT_RADIUS) || 2000;
    const earthOrbitColor = (window.CONFIG && window.CONFIG.EARTH_ORBIT_COLOR) || '#759cffff';
    const earthInitialAngle = (window.CONFIG && window.CONFIG.EARTH_INITIAL_ANGLE) || 0;
    const earthPhase = earthInitialAngle * (Math.PI / 180);

    this.objects.earth = new Planet(R, earthOrbitColor, earthRadius * 2, {
      deferentRadius: earthOrbitRadius,
      epicycleRadius: 0,
      deferentSpeed: earthSpeed,
      epicycleSpeed: 0,
      deferentPhase: earthPhase,
      texturePath: 'assets/textures/earthmap_1k.jpg'
    });
    if (this.objects.earth.physicalMesh) {
      this.objects.earth.physicalMesh.rotation.z = tilt * (Math.PI / 180);
    }
    this.objects.solarSystem.add(this.objects.earth);

    // VENUS (Planeta Interior Heliocéntrico)
    const venusGroup = new THREE.Group();
    const venusInclination = (window.CONFIG && window.CONFIG.VENUS_INCLINATION) || 3.39;
    venusGroup.rotation.x = venusInclination * (Math.PI / 180);
    this.sceneManager.add(venusGroup);
    this.objects.venusGroup = venusGroup;

    const venusPeriod = (window.CONFIG && window.CONFIG.VENUS_ORBITAL_PERIOD) || 224.7;
    const venusSpeed = -(2 * Math.PI) / (venusPeriod / 100);
    const venusOrbitRadius = (window.CONFIG && window.CONFIG.VENUS_ORBIT_RADIUS) || 1446;
    const venusOrbitColor = (window.CONFIG && window.CONFIG.VENUS_ORBIT_COLOR) || '#ffd27dff';
    const venusInitialAngle = (window.CONFIG && window.CONFIG.VENUS_INITIAL_ANGLE) || 45;
    const venusPhase = venusInitialAngle * (Math.PI / 180);

    this.objects.venus = new Planet(R, venusOrbitColor, venusRadius * 2, {
      deferentRadius: venusOrbitRadius,
      epicycleRadius: 0,
      deferentSpeed: venusSpeed,
      epicycleSpeed: 0,
      deferentPhase: venusPhase,
      texturePath: 'assets/textures/512_venus.png'
    });
    this.objects.p1 = this.objects.venus; // Alias de compatibilidad
    venusGroup.add(this.objects.venus);

    // MARTE (Planeta Exterior Heliocéntrico)
    const marsGroup = new THREE.Group();
    const marsInclination = (window.CONFIG && window.CONFIG.MARS_INCLINATION) || 1.85;
    marsGroup.rotation.x = marsInclination * (Math.PI / 180);
    this.sceneManager.add(marsGroup);
    this.objects.marsGroup = marsGroup;

    const marsPeriod = (window.CONFIG && window.CONFIG.MARS_ORBITAL_PERIOD) || 686.98;
    const marsSpeed = -(2 * Math.PI) / (marsPeriod / 100);
    const marsOrbitRadius = (window.CONFIG && window.CONFIG.MARS_ORBIT_RADIUS) || 3048;
    const marsOrbitColor = (window.CONFIG && window.CONFIG.MARS_ORBIT_COLOR) || '#ff5533ff';
    const marsInitialAngle = (window.CONFIG && window.CONFIG.MARS_INITIAL_ANGLE) || 90;
    const marsPhase = marsInitialAngle * (Math.PI / 180);

    this.objects.mars = new Planet(R, marsOrbitColor, marsRadius * 2, {
      deferentRadius: marsOrbitRadius,
      epicycleRadius: 0,
      deferentSpeed: marsSpeed,
      epicycleSpeed: 0,
      deferentPhase: marsPhase,
      texturePath: 'assets/textures/512_mars.png'
    });
    marsGroup.add(this.objects.mars);

    // LUNA (Satélite Geocéntrico adjunto a la Tierra)
    // Cancela los 24° Z de oblicuidad del eje terrestre para mantener los 5.14° X exactos respecto a la eclíptica
    const moonCenterGroup = new THREE.Group();
    moonCenterGroup.rotation.z = -tilt * (Math.PI / 180);
    this.objects.earth.physicalMesh.add(moonCenterGroup);

    const moonGroup = new THREE.Group();
    const moonInclination = (window.CONFIG && window.CONFIG.MOON_INCLINATION) || 5.14;
    moonGroup.rotation.x = moonInclination * (Math.PI / 180);
    moonCenterGroup.add(moonGroup);
    this.objects.moonGroup = moonGroup;

    const moonPeriod = (window.CONFIG && window.CONFIG.MOON_ORBITAL_PERIOD) || 27.32;
    const moonSpeed = -(2 * Math.PI) / (moonPeriod / 100);
    const moonOrbitRadius = (window.CONFIG && window.CONFIG.MOON_ORBIT_RADIUS) || 350;
    const moonOrbitColor = (window.CONFIG && window.CONFIG.MOON_ORBIT_COLOR) || '#ccccccff';
    const moonInitialAngle = (window.CONFIG && window.CONFIG.MOON_INITIAL_ANGLE) || 0;
    const moonPhase = moonInitialAngle * (Math.PI / 180);

    this.objects.moon = new Planet(R, moonOrbitColor, moonRadius * 2, {
      deferentRadius: moonOrbitRadius,
      epicycleRadius: 0,
      deferentSpeed: moonSpeed,
      epicycleSpeed: 0,
      deferentPhase: moonPhase,
      texturePath: 'assets/textures/512_moon.png'
    });
    moonGroup.add(this.objects.moon);

    // Marcador de Posición Aparente
    const appPosRadius = (window.CONFIG && window.CONFIG.VENUS_APPARENT_POS_RADIUS !== undefined)
      ? window.CONFIG.VENUS_APPARENT_POS_RADIUS : 120;
    const appPosColor = (window.CONFIG && window.CONFIG.APPARENT_COLORS && window.CONFIG.APPARENT_COLORS.venus) || '#ff4444';

    this.objects.venusApparentPos = new ApparentPositionMarker(R, appPosColor, appPosRadius);
    this.sceneManager.add(this.objects.venusApparentPos);

    // Rastro (Trail) de Posiciones Aparentes en la Esfera Celeste
    this.objects.apparentTrail = new ApparentTrail(R);
    this.sceneManager.add(this.objects.apparentTrail);

    this.setupUI();
    this.setSelectedAstro('venus');
    this.animate();
  }

  getActiveAstro() {
    if (this.selectedAstro === 'mars') return this.objects.mars;
    if (this.selectedAstro === 'moon') return this.objects.moon;
    return this.objects.venus || this.objects.p1;
  }

  getAstroName(astroKey = this.selectedAstro) {
    if (astroKey === 'mars') return 'Marte';
    if (astroKey === 'moon') return 'Luna';
    return 'Venus';
  }

  updateAstroVisibility() {
    const activeKey = this.selectedAstro;

    if (this.objects.venusGroup) {
      this.objects.venusGroup.visible = (activeKey === 'venus');
    }
    if (this.objects.marsGroup) {
      this.objects.marsGroup.visible = (activeKey === 'mars');
    }
    if (this.objects.moonGroup) {
      this.objects.moonGroup.visible = (activeKey === 'moon');
    }
  }

  setSelectedAstro(astroKey) {
    this.selectedAstro = astroKey;

    // 1. Mostrar únicamente el astro seleccionado y ocultar los demás
    this.updateAstroVisibility();

    // 2. Actualizar color de la marca aparente según el astro
    const apparentColors = (window.CONFIG && window.CONFIG.APPARENT_COLORS) || {
      venus: '#ff4444',
      mars: '#ff5533',
      moon: '#44aaff'
    };
    const newColor = apparentColors[astroKey] || '#ff4444';
    if (this.objects.venusApparentPos) {
      this.objects.venusApparentPos.setColor(newColor);
    }

    // 3. Actualizar visibilidad de marcadores y objetivos de cámara
    const isFollowing = (this.followTarget === 'ASTRO');
    const toggleApparentEl = document.getElementById('toggle-apparent-pos') || document.getElementById('toggle-apparent-venus');
    const isApparentChecked = toggleApparentEl ? toggleApparentEl.checked : false;

    if (this.objects.venusApparentPos) {
      this.objects.venusApparentPos.visible = isFollowing ? false : isApparentChecked;
    }
    if (this.objects.apparentTrail) {
      this.objects.apparentTrail.visible = isFollowing || isApparentChecked;
    }

    if (isFollowing) {
      // Si la cámara está en modo seguimiento ("Seguir al Astro"), enfocar el nuevo astro activo inmediatamente
      const targetPos = new THREE.Vector3();
      const activeAstro = this.getActiveAstro();
      if (activeAstro && activeAstro.physicalMesh) {
        activeAstro.physicalMesh.getWorldPosition(targetPos);
        this.sceneManager.updateFollowTarget(targetPos);
      }
      this.updateFollowPlanetRadii(true);
      this.updateOrbitTubesForMode(true);
    }
  }

  setupUI() {
    this.menuBar = new MenuBarController();

    this.timeHud = new TimeHudController({
      container: '#canvas-container',
      minDay: 0,
      maxDay: 365,
      initialDay: this.params.day,
      minSpeed: 0,
      maxSpeed: 30,
      initialSpeed: this.params.speed,
      autoPlay: this.params.autoTime,
      onPlayChange: (isPlaying) => {
        this.params.autoTime = isPlaying;
      },
      onSpeedChange: (speed) => {
        this.params.speed = speed;
      },
      onDayChange: (day, isUserInitiated) => {
        this.params.day = day;
        this.time = this.params.day * 0.01;
        if (!this.params.autoTime) {
          this.updateObjects();
          this.sceneManager.update();
        }
      }
    });

    // Escuchar selección de Astro
    const astroRadios = document.querySelectorAll('input[name="selected-astro"]');
    astroRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.setSelectedAstro(e.target.value);
      });
    });

    // Escuchar Cambios de Escala (Aumentada vs Realista)
    const scaleRadios = document.querySelectorAll('input[name="scale-mode"]');
    scaleRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.setRealisticScale(e.target.value === 'realistic');
      });
    });

    // Escuchar Cambios de Modo de Cámara
    const cameraRadios = document.querySelectorAll('input[name="camera-mode"]');
    cameraRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.setCameraMode(e.target.value);
      });
    });

    // Visibilidad de Capas
    const toggleGrid = document.getElementById('toggle-grid');
    if (toggleGrid) {
      toggleGrid.addEventListener('change', (e) => {
        if (this.objects.sphere) this.objects.sphere.visible = e.target.checked;
      });
    }

    const toggleStars = document.getElementById('toggle-stars');
    if (toggleStars) {
      toggleStars.addEventListener('change', (e) => {
        if (this.objects.stars) this.objects.stars.visible = e.target.checked;
      });
    }

    const toggleZodiac = document.getElementById('toggle-zodiac');
    if (toggleZodiac) {
      toggleZodiac.addEventListener('change', (e) => {
        if (this.objects.zodiac) this.objects.zodiac.visible = e.target.checked;
      });
    }

    // Toggle Órbitas
    const toggleOrbits = document.getElementById('toggle-orbits');
    if (toggleOrbits) {
      toggleOrbits.addEventListener('change', (e) => {
        const showOrbits = e.target.checked;
        const isFollowMode = this.followTarget !== 'NONE';
        if (this.objects.sun) this.objects.sun.toggleOrbits(showOrbits);
        if (this.objects.earth) this.objects.earth.toggleOrbits(isFollowMode ? false : showOrbits);
        if (this.objects.venus) this.objects.venus.toggleOrbits(showOrbits);
        if (this.objects.mars) this.objects.mars.toggleOrbits(showOrbits);
        if (this.objects.moon) this.objects.moon.toggleOrbits(showOrbits);
      });

      const initialShowOrbits = toggleOrbits.checked;
      const initialIsFollow = this.followTarget !== 'NONE';
      if (this.objects.sun) this.objects.sun.toggleOrbits(initialShowOrbits);
      if (this.objects.earth) this.objects.earth.toggleOrbits(initialIsFollow ? false : initialShowOrbits);
      if (this.objects.venus) this.objects.venus.toggleOrbits(initialShowOrbits);
      if (this.objects.mars) this.objects.mars.toggleOrbits(initialShowOrbits);
      if (this.objects.moon) this.objects.moon.toggleOrbits(initialShowOrbits);
    }

    // Toggle Posición Aparente
    const toggleApparent = document.getElementById('toggle-apparent-pos') || document.getElementById('toggle-apparent-venus');
    if (toggleApparent) {
      toggleApparent.addEventListener('change', (e) => {
        const isFollowingAstro = (this.followTarget === 'ASTRO');
        if (this.objects.venusApparentPos) {
          this.objects.venusApparentPos.visible = isFollowingAstro ? false : e.target.checked;
        }
        if (this.objects.apparentTrail) {
          this.objects.apparentTrail.visible = isFollowingAstro || e.target.checked;
        }
      });
      const isFollowingAstro = (this.followTarget === 'ASTRO');
      const isApparentChecked = toggleApparent.checked;

      if (this.objects.venusApparentPos) {
        this.objects.venusApparentPos.visible = isFollowingAstro ? false : isApparentChecked;
      }
      if (this.objects.apparentTrail) {
        this.objects.apparentTrail.visible = isFollowingAstro || isApparentChecked;
      }
    }
  }

  updateObjects() {
    if (this.objects.sun) this.objects.sun.update(this.time);
    if (this.objects.earth) this.objects.earth.update(this.time);
    if (this.objects.venus) this.objects.venus.update(this.time);
    if (this.objects.mars) this.objects.mars.update(this.time);
    if (this.objects.moon) this.objects.moon.update(this.time);

    // Proyección de posición aparente del astro activo
    const activeAstro = this.getActiveAstro();
    if (this.objects.venusApparentPos && this.objects.venusApparentPos.visible && activeAstro && activeAstro.physicalMesh) {
      const astroWorldPos = new THREE.Vector3();
      activeAstro.physicalMesh.getWorldPosition(astroWorldPos);

      const earthWorldPos = new THREE.Vector3();
      if (this.objects.earth && this.objects.earth.physicalMesh) {
        this.objects.earth.physicalMesh.getWorldPosition(earthWorldPos);
      }

      this.objects.venusApparentPos.update(
        astroWorldPos,
        window.CONFIG ? window.CONFIG.SPHERE_RADIUS : this.params.sphereRadius,
        earthWorldPos
      );
    }

    // Actualización del rastro (Trail) de posiciones aparentes del astro activo
    if (this.objects.apparentTrail && this.objects.apparentTrail.visible) {
      const sphereR = window.CONFIG ? window.CONFIG.SPHERE_RADIUS : this.params.sphereRadius;
      this.objects.apparentTrail.update(this.params.day, sphereR, this.selectedAstro);
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.params.autoTime) {
      const dayIncrement = this.params.speed * 0.01;
      this.params.day += dayIncrement;
      this.time = this.params.day * 0.01;

      if (this.timeHud) {
        this.timeHud.setDay(this.params.day);
      }
    }

    this.updateObjects();

    if (this.objects.earth && this.objects.earth.physicalMesh) {
      const currentEarthPos = new THREE.Vector3();
      this.objects.earth.physicalMesh.getWorldPosition(currentEarthPos);
      this.sceneManager.updateEarthPosition(currentEarthPos);
    }

    if (this.followTarget === 'ASTRO') {
      const targetPos = new THREE.Vector3();
      const activeAstro = this.getActiveAstro();
      if (activeAstro && activeAstro.physicalMesh) {
        activeAstro.physicalMesh.getWorldPosition(targetPos);
      }

      this.sceneManager.updateFollowTarget(targetPos);

      if (this.objects.earth && this.objects.earth.physicalMesh) {
        const earthPos = new THREE.Vector3();
        this.objects.earth.physicalMesh.getWorldPosition(earthPos);
        this.sceneManager.updateCameraPosition(earthPos);
      }
    }

    this.sceneManager.update();
  }

  updateFollowPlanetRadii(isFollowingAny) {
    const earthR = isFollowingAny
      ? ((window.CONFIG && window.CONFIG.EARTH_RADIUS_FOLLOW !== undefined) ? window.CONFIG.EARTH_RADIUS_FOLLOW : 10)
      : ((window.CONFIG && window.CONFIG.EARTH_RADIUS !== undefined) ? window.CONFIG.EARTH_RADIUS : 50);

    const sunR = isFollowingAny
      ? ((window.CONFIG && window.CONFIG.SUN_RADIUS_FOLLOW !== undefined) ? window.CONFIG.SUN_RADIUS_FOLLOW : 50)
      : ((window.CONFIG && window.CONFIG.SUN_RADIUS !== undefined) ? window.CONFIG.SUN_RADIUS : 100);

    const venusR = isFollowingAny
      ? ((window.CONFIG && window.CONFIG.VENUS_RADIUS_FOLLOW !== undefined) ? window.CONFIG.VENUS_RADIUS_FOLLOW : 10)
      : ((window.CONFIG && window.CONFIG.VENUS_RADIUS !== undefined) ? window.CONFIG.VENUS_RADIUS : 50);

    const marsR = isFollowingAny
      ? ((window.CONFIG && window.CONFIG.MARS_RADIUS_FOLLOW !== undefined) ? window.CONFIG.MARS_RADIUS_FOLLOW : 10)
      : ((window.CONFIG && window.CONFIG.MARS_RADIUS !== undefined) ? window.CONFIG.MARS_RADIUS : 40);

    const moonR = isFollowingAny
      ? ((window.CONFIG && window.CONFIG.MOON_RADIUS_FOLLOW !== undefined) ? window.CONFIG.MOON_RADIUS_FOLLOW : 5)
      : ((window.CONFIG && window.CONFIG.MOON_RADIUS !== undefined) ? window.CONFIG.MOON_RADIUS : 20);

    if (this.sceneManager) this.sceneManager.setEarthRadius(earthR);
    if (this.objects.earth) this.objects.earth.setPhysicalRadius(earthR);
    if (this.objects.sun) this.objects.sun.setPhysicalRadius(sunR);
    if (this.objects.venus) this.objects.venus.setPhysicalRadius(venusR);
    if (this.objects.mars) this.objects.mars.setPhysicalRadius(marsR);
    if (this.objects.moon) this.objects.moon.setPhysicalRadius(moonR);
  }

  updateOrbitTubesForMode(isFollowMode) {
    if (this.isRealisticMode) return;

    const tubeR = isFollowMode
      ? ((window.CONFIG && window.CONFIG.FOLLOW_ORBIT_TUBE_RADIUS !== undefined) ? window.CONFIG.FOLLOW_ORBIT_TUBE_RADIUS : 0.5)
      : ((window.CONFIG && window.CONFIG.ORBIT_TUBE_RADIUS !== undefined) ? window.CONFIG.ORBIT_TUBE_RADIUS : 5);

    const toggleOrbitsCheckbox = document.getElementById('toggle-orbits');
    const isOrbitsChecked = toggleOrbitsCheckbox ? toggleOrbitsCheckbox.checked : true;

    if (this.objects.earth) {
      this.objects.earth.updateOrbitalRadii(undefined, undefined, tubeR);
      this.objects.earth.toggleOrbits(isFollowMode ? false : isOrbitsChecked);
    }
    if (this.objects.venus) {
      this.objects.venus.updateOrbitalRadii(undefined, undefined, tubeR);
      this.objects.venus.toggleOrbits(isOrbitsChecked);
    }
    if (this.objects.mars) {
      this.objects.mars.updateOrbitalRadii(undefined, undefined, tubeR);
      this.objects.mars.toggleOrbits(isOrbitsChecked);
    }
    if (this.objects.moon) {
      this.objects.moon.updateOrbitalRadii(undefined, undefined, tubeR);
      this.objects.moon.toggleOrbits(isOrbitsChecked);
    }
  }

  setRealisticScale(isRealistic) {
    this.isRealisticMode = isRealistic;

    const scaleBadge = document.getElementById('menubar-scale-val');
    if (scaleBadge) {
      scaleBadge.textContent = isRealistic ? 'Escala realista' : 'Escala aumentada';
    }

    if (this.sceneManager) {
      this.sceneManager.setRealisticMode(isRealistic);
    }

    const isFollowingAny = (this.followTarget !== 'NONE');

    if (isRealistic) {
      const R_Sol = (window.CONFIG && window.CONFIG.SUN_RADIUS_REALISTIC) || 80;
      const ratios = (window.CONFIG && window.CONFIG.REALISTIC_RATIOS) || {
        EARTH_RADIUS: 6371 / 696340,
        VENUS_RADIUS: 6052 / 696340,
        MARS_RADIUS: 3389.5 / 696340,
        MOON_RADIUS: 1737.4 / 696340,
        EARTH_ORBIT_RADIUS: 149597870 / 696340,
        VENUS_ORBIT_RADIUS: 108208000 / 696340,
        MARS_ORBIT_RADIUS: 227939200 / 696340,
        MOON_ORBIT_RADIUS: 384400 / 696340
      };

      const sunR = isFollowingAny ? 50 : R_Sol;
      const earthR = isFollowingAny ? 10 : R_Sol * ratios.EARTH_RADIUS;
      const venusR = isFollowingAny ? 10 : R_Sol * ratios.VENUS_RADIUS;
      const marsR = isFollowingAny ? 10 : R_Sol * ratios.MARS_RADIUS;
      const moonR = isFollowingAny ? 5 : R_Sol * ratios.MOON_RADIUS;

      const earthOrbitR = R_Sol * ratios.EARTH_ORBIT_RADIUS;
      const venusOrbitR = R_Sol * ratios.VENUS_ORBIT_RADIUS;
      const marsOrbitR = R_Sol * ratios.MARS_ORBIT_RADIUS;
      const moonOrbitR = R_Sol * ratios.MOON_ORBIT_RADIUS;

      if (this.objects.sun) this.objects.sun.setPhysicalRadius(sunR);
      if (this.objects.earth) {
        this.objects.earth.setPhysicalRadius(earthR);
        this.objects.earth.updateOrbitalRadii(earthOrbitR, undefined, undefined, 2048, true);
      }
      if (this.objects.venus) {
        this.objects.venus.setPhysicalRadius(venusR);
        this.objects.venus.updateOrbitalRadii(venusOrbitR, undefined, undefined, 1024, true);
      }
      if (this.objects.mars) {
        this.objects.mars.setPhysicalRadius(marsR);
        this.objects.mars.updateOrbitalRadii(marsOrbitR, undefined, undefined, 2048, true);
      }
      if (this.objects.moon) {
        this.objects.moon.setPhysicalRadius(moonR);
        this.objects.moon.updateOrbitalRadii(moonOrbitR, undefined, undefined, 512, true);
      }

      const toggleOrbitsCheckbox = document.getElementById('toggle-orbits');
      const isOrbitsChecked = toggleOrbitsCheckbox ? toggleOrbitsCheckbox.checked : true;
      if (this.objects.sun) this.objects.sun.toggleOrbits(isOrbitsChecked);
      if (this.objects.earth) this.objects.earth.toggleOrbits(isFollowingAny ? false : isOrbitsChecked);
      if (this.objects.venus) this.objects.venus.toggleOrbits(isOrbitsChecked);
      if (this.objects.mars) this.objects.mars.toggleOrbits(isOrbitsChecked);
      if (this.objects.moon) this.objects.moon.toggleOrbits(isOrbitsChecked);

      if (!isFollowingAny) {
        const camEarthRadio = document.getElementById('cam-earth');
        if (camEarthRadio) camEarthRadio.checked = true;
        this.setCameraMode('EARTH');
      } else {
        const camAstroRadio = document.getElementById('cam-astro');
        if (camAstroRadio) camAstroRadio.checked = true;
        this.sceneManager.setFollowMode(true);
      }
    } else {
      const sunR = isFollowingAny ? 50 : ((window.CONFIG && window.CONFIG.SUN_RADIUS) || 100);
      const earthR = isFollowingAny ? 10 : ((window.CONFIG && window.CONFIG.EARTH_RADIUS) || 50);
      const venusR = isFollowingAny ? 10 : ((window.CONFIG && window.CONFIG.VENUS_RADIUS) || 50);
      const marsR = isFollowingAny ? 10 : ((window.CONFIG && window.CONFIG.MARS_RADIUS) || 40);
      const moonR = isFollowingAny ? 5 : ((window.CONFIG && window.CONFIG.MOON_RADIUS) || 20);

      const earthOrbitR = (window.CONFIG && window.CONFIG.EARTH_ORBIT_RADIUS) || 2000;
      const venusOrbitR = (window.CONFIG && window.CONFIG.VENUS_ORBIT_RADIUS) || 1446;
      const marsOrbitR = (window.CONFIG && window.CONFIG.MARS_ORBIT_RADIUS) || 3048;
      const moonOrbitR = (window.CONFIG && window.CONFIG.MOON_ORBIT_RADIUS) || 350;

      const tubeR = isFollowingAny ? 0.5 : 5;

      if (this.objects.sun) this.objects.sun.setPhysicalRadius(sunR);
      if (this.objects.earth) {
        this.objects.earth.setPhysicalRadius(earthR);
        this.objects.earth.updateOrbitalRadii(earthOrbitR, undefined, tubeR, 128, false);
      }
      if (this.objects.venus) {
        this.objects.venus.setPhysicalRadius(venusR);
        this.objects.venus.updateOrbitalRadii(venusOrbitR, undefined, tubeR, 128, false);
      }
      if (this.objects.mars) {
        this.objects.mars.setPhysicalRadius(marsR);
        this.objects.mars.updateOrbitalRadii(marsOrbitR, undefined, tubeR, 128, false);
      }
      if (this.objects.moon) {
        this.objects.moon.setPhysicalRadius(moonR);
        this.objects.moon.updateOrbitalRadii(moonOrbitR, undefined, tubeR, 128, false);
      }

      const toggleOrbitsCheckbox = document.getElementById('toggle-orbits');
      const isOrbitsChecked = toggleOrbitsCheckbox ? toggleOrbitsCheckbox.checked : true;
      if (this.objects.sun) this.objects.sun.toggleOrbits(isOrbitsChecked);
      if (this.objects.earth) this.objects.earth.toggleOrbits(isFollowingAny ? false : isOrbitsChecked);
      if (this.objects.venus) this.objects.venus.toggleOrbits(isOrbitsChecked);
      if (this.objects.mars) this.objects.mars.toggleOrbits(isOrbitsChecked);
      if (this.objects.moon) this.objects.moon.toggleOrbits(isOrbitsChecked);

      if (!isFollowingAny) {
        this.cameraMode = 'SUN';
        const camSunRadio = document.getElementById('cam-sun');
        if (camSunRadio) camSunRadio.checked = true;

        if (this.sceneManager) {
          this.sceneManager.setCameraMode('SUN');
          const r = (window.CONFIG && window.CONFIG.CAMERA_RADIUS !== undefined) ? window.CONFIG.CAMERA_RADIUS : 4000;
          const az = (window.CONFIG && window.CONFIG.CAMERA_AZIMUTH_ANGLE !== undefined) ? window.CONFIG.CAMERA_AZIMUTH_ANGLE : 180;
          const el = (window.CONFIG && window.CONFIG.CAMERA_ELEVATION_ANGLE !== undefined) ? window.CONFIG.CAMERA_ELEVATION_ANGLE : 30;
          this.sceneManager.setInitialCameraPosition(r, az, el);
        }
      } else {
        const camAstroRadio = document.getElementById('cam-astro');
        if (camAstroRadio) camAstroRadio.checked = true;
        this.sceneManager.setFollowMode(true);
      }
    }

    const toggleApparent = document.getElementById('toggle-apparent-pos') || document.getElementById('toggle-apparent-venus');
    const isApparentChecked = toggleApparent ? toggleApparent.checked : false;

    if (this.objects.venusApparentPos) {
      this.objects.venusApparentPos.visible = isFollowingAny ? false : isApparentChecked;
    }
    if (this.objects.apparentTrail) {
      this.objects.apparentTrail.visible = isFollowingAny || isApparentChecked;
    }
  }

  setCameraMode(mode) {
    this.cameraMode = mode;

    if (mode === 'ASTRO' || mode === 'VENUS') {
      this.followTarget = 'ASTRO';
      this.sceneManager.setFollowMode(true);
      this.updateOrbitTubesForMode(true);
      this.updateFollowPlanetRadii(true);
      const camAstroRadio = document.getElementById('cam-astro');
      if (camAstroRadio) camAstroRadio.checked = true;
    } else if (mode === 'EARTH') {
      if (this.followTarget !== 'NONE') {
        this.followTarget = 'NONE';
        if (this.sceneManager) this.sceneManager.setFollowMode(false);
        this.updateOrbitTubesForMode(false);
        this.updateFollowPlanetRadii(false);
      }
      const camEarthRadio = document.getElementById('cam-earth');
      if (camEarthRadio) camEarthRadio.checked = true;

      const earthWorldPos = new THREE.Vector3();
      if (this.objects.earth && this.objects.earth.physicalMesh) {
        this.objects.earth.physicalMesh.getWorldPosition(earthWorldPos);
      }
      this.sceneManager.setCameraMode('EARTH', earthWorldPos);
    } else if (mode === 'SUN') {
      if (this.followTarget !== 'NONE') {
        this.followTarget = 'NONE';
        if (this.sceneManager) this.sceneManager.setFollowMode(false);
        this.updateOrbitTubesForMode(false);
        this.updateFollowPlanetRadii(false);
      }
      const camSunRadio = document.getElementById('cam-sun');
      if (camSunRadio) camSunRadio.checked = true;

      this.sceneManager.setCameraMode('SUN');
    }

    const isFollowingAstro = (this.followTarget === 'ASTRO');
    const toggleApparent = document.getElementById('toggle-apparent-pos') || document.getElementById('toggle-apparent-venus');
    const isApparentChecked = toggleApparent ? toggleApparent.checked : false;

    if (this.objects.venusApparentPos) {
      this.objects.venusApparentPos.visible = isFollowingAstro ? false : isApparentChecked;
    }
    if (this.objects.apparentTrail) {
      this.objects.apparentTrail.visible = isFollowingAstro || isApparentChecked;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new Simulation();
});
