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
    const cfg = window.CONFIG || {};
    this.params = {
      speed: cfg.DEFAULT_SPEED || 1,
      day: 0,
      autoTime: true,
      sphereRadius: cfg.SPHERE_RADIUS || 1400,
      isLightMode: false,
      ambientLightIntensity: cfg.AMBIENT_LIGHT_INTENSITY !== undefined ? cfg.AMBIENT_LIGHT_INTENSITY : 0.25,
      sunLightIntensity: cfg.SUN_LIGHT_INTENSITY !== undefined ? cfg.SUN_LIGHT_INTENSITY : 3.5
    };

    this.selectedAstro = cfg.DEFAULT_SELECTED_ASTRO || 'venus';
    this.followAstro = false;

    this.time = 0;
    this.objects = {};

    this.init();
  }

  async init() {
    const R = this.params.sphereRadius;
    const tilt = 24;
    const cfg = window.CONFIG || {};

    // 1. Celestial Sphere (Grid + Ecliptic)
    this.objects.sphere = new CelestialSphere(R);
    this.sceneManager.add(this.objects.sphere);
    this.objects.sphere.visible = document.getElementById('toggle-grid')?.checked || false;

    // 2. Stars
    this.objects.stars = new Stars(R, './assets/myStars.xlsx');
    this.sceneManager.add(this.objects.stars);

    // 2b. Zodiac Constellations
    this.objects.zodiac = new Constellations(R, './assets/Constelaciones_zodiaco.xlsx');
    const toggleZodiac = document.getElementById('toggle-zodiac');
    this.objects.zodiac.visible = toggleZodiac ? toggleZodiac.checked : true;
    this.sceneManager.add(this.objects.zodiac);

    // 3. Solar System Group (Rotated by Obliquity)
    this.objects.solarSystem = new THREE.Group();
    this.objects.solarSystem.rotation.x = tilt * (Math.PI / 180);
    this.sceneManager.add(this.objects.solarSystem);

    // Sun (Simple Orbit - Geocentric)
    const sunOmega1 = cfg.SUN_ANGULAR_SPEED !== undefined
      ? cfg.SUN_ANGULAR_SPEED
      : - (2 * Math.PI) / (365 / 100);
    const sunOrbitR = cfg.SUN_ORBIT_RADIUS !== undefined ? cfg.SUN_ORBIT_RADIUS : 2000;
    const sunBodyR = cfg.SUN_RADIUS !== undefined ? cfg.SUN_RADIUS : 100;

    this.objects.sun = new Planet(R, '#FFD700', sunBodyR * 2, {
      deferentRadius: sunOrbitR,
      epicycleRadius: 0,
      deferentSpeed: sunOmega1,
      epicycleSpeed: 0,
      deferentPhase: 0
    });
    this.objects.solarSystem.add(this.objects.sun);

    // --- CELESTIAL BODIES (Geocentric Ptolemaic Epicycles) ---

    // 1. Venus
    const venusDefR = cfg.VENUS_DEFERENT_RADIUS || 1024;
    const venusEpiR = cfg.VENUS_EPICYCLE_RADIUS || 738;
    const venusBodyR = cfg.VENUS_RADIUS || 50;
    const venusEpiSpeed = cfg.VENUS_EPICYCLE_SPEED || -2.7963;
    const venusInc = cfg.VENUS_INCLINATION || 3.39 * (Math.PI / 180);
    const venusNode = cfg.VENUS_NODE_LONGITUDE || 76.68 * (Math.PI / 180);

    const venusGroup = new THREE.Group();
    venusGroup.rotation.x = tilt * (Math.PI / 180);
    this.sceneManager.add(venusGroup);

    this.objects.venus = new Planet(R, '#FFFFFF', venusBodyR * 2, {
      deferentRadius: venusDefR,
      epicycleRadius: venusEpiR,
      deferentSpeed: sunOmega1,
      epicycleSpeed: venusEpiSpeed,
      deferentPhase: 0,
      epicyclePhase: -1.5,
      inclination: venusInc,
      nodeLongitude: venusNode,
      texturePath: './assets/textures/512_venus.png'
    });
    venusGroup.add(this.objects.venus);
    this.objects.venusGroup = venusGroup;

    // 2. Mars (Marte)
    const marsDefR = cfg.MARS_DEFERENT_RADIUS || 1500;
    const marsEpiR = cfg.MARS_EPICYCLE_RADIUS || 986;
    const marsBodyR = cfg.MARS_RADIUS || 45;
    const marsDefSpeed = cfg.MARS_DEFERENT_SPEED || -0.914;
    const marsEpiSpeed = cfg.MARS_EPICYCLE_SPEED || sunOmega1;
    const marsInc = cfg.MARS_INCLINATION || 1.85 * (Math.PI / 180);
    const marsNode = cfg.MARS_NODE_LONGITUDE || 49.56 * (Math.PI / 180);

    const marsGroup = new THREE.Group();
    marsGroup.rotation.x = tilt * (Math.PI / 180);
    this.sceneManager.add(marsGroup);

    this.objects.mars = new Planet(R, cfg.MARS_COLOR || '#FF5533', marsBodyR * 2, {
      deferentRadius: marsDefR,
      epicycleRadius: marsEpiR,
      deferentSpeed: marsDefSpeed,
      epicycleSpeed: marsEpiSpeed,
      deferentPhase: 0,
      epicyclePhase: 0,
      inclination: marsInc,
      nodeLongitude: marsNode,
      texturePath: './assets/textures/512_mars.png'
    });
    marsGroup.add(this.objects.mars);
    this.objects.marsGroup = marsGroup;

    // 3. Moon (Luna)
    const moonDefR = cfg.MOON_DEFERENT_RADIUS || 500;
    const moonEpiR = cfg.MOON_EPICYCLE_RADIUS || 86;
    const moonBodyR = cfg.MOON_RADIUS || 30;
    const moonDefSpeed = cfg.MOON_DEFERENT_SPEED || -23.0;
    const moonEpiSpeed = cfg.MOON_EPICYCLE_SPEED || -22.8;
    const moonInc = cfg.MOON_INCLINATION || 5.14 * (Math.PI / 180);
    const moonNode = cfg.MOON_NODE_LONGITUDE || 125.0 * (Math.PI / 180);

    const moonGroup = new THREE.Group();
    moonGroup.rotation.x = tilt * (Math.PI / 180);
    this.sceneManager.add(moonGroup);

    this.objects.moon = new Planet(R, cfg.MOON_COLOR || '#E0E0E0', moonBodyR * 2, {
      deferentRadius: moonDefR,
      epicycleRadius: moonEpiR,
      deferentSpeed: moonDefSpeed,
      epicycleSpeed: moonEpiSpeed,
      deferentPhase: 0,
      epicyclePhase: 0,
      inclination: moonInc,
      nodeLongitude: moonNode,
      texturePath: './assets/textures/512_moon.png'
    });
    moonGroup.add(this.objects.moon);
    this.objects.moonGroup = moonGroup;

    // Apparent Position Marker on Celestial Sphere
    const appPosRadius = cfg.VENUS_APPARENT_POS_RADIUS || 120;
    const appPosColor = cfg.VENUS_APPARENT_POS_COLOR || '#ff4444';
    this.objects.apparentPos = new ApparentPositionMarker(R, appPosColor, appPosRadius);
    this.sceneManager.add(this.objects.apparentPos);

    // Apparent Position Trail for Follow Modes
    this.objects.apparentTrail = new ApparentTrail(R);
    this.sceneManager.add(this.objects.apparentTrail);

    // Initial Camera Position
    const camR = cfg.CAMERA_RADIUS || 4000;
    const camAzimuthDeg = cfg.CAMERA_AZIMUTH_ANGLE || 180;
    const camElevationDeg = cfg.CAMERA_ELEVATION_ANGLE || 30;

    const theta = camAzimuthDeg * (Math.PI / 180);
    const phi = camElevationDeg * (Math.PI / 180);

    const camY = camR * Math.sin(phi);
    const camX = camR * Math.cos(phi) * Math.cos(theta);
    const camZ = camR * Math.cos(phi) * Math.sin(theta);

    this.sceneManager.camera.position.set(camX, camY, camZ);
    this.sceneManager.camera.lookAt(0, 0, 0);
    this.sceneManager.targetDistance = this.sceneManager.camera.position.length();
    this.sceneManager.controls.saveState();

    this.setAmbientLight(this.params.ambientLightIntensity);
    this.setSunLight(this.params.sunLightIntensity);

    this.updateAstroVisibility();
    this.setupUI();
    this.animate();
  }

  getActiveAstro() {
    return this.objects[this.selectedAstro] || this.objects.venus;
  }

  updateAstroVisibility() {
    const activeKey = this.selectedAstro;
    ['venus', 'mars', 'moon'].forEach(key => {
      const group = this.objects[key + 'Group'];
      if (group) {
        group.visible = (key === activeKey);
      }
    });

    const isFollowing = this.followAstro;
    this.updateFollowOrbitTubes(isFollowing);
    this.updateFollowPlanetRadii(isFollowing);
    this.updateFollowApparentMarker(isFollowing);
  }

  setAmbientLight(val) {
    this.params.ambientLightIntensity = val;
    if (window.CONFIG) window.CONFIG.AMBIENT_LIGHT_INTENSITY = val;
    window.AMBIENT_LIGHT_INTENSITY = val;
    if (this.sceneManager) this.sceneManager.setAmbientLightIntensity(val);
  }

  setSunLight(val) {
    this.params.sunLightIntensity = val;
    if (window.CONFIG) window.CONFIG.SUN_LIGHT_INTENSITY = val;
    window.SUN_LIGHT_INTENSITY = val;
    if (this.objects.sun) this.objects.sun.setSunLightIntensity(val);
  }

  updateFollowOrbitTubes(isFollowingAny) {
    ['venus', 'mars', 'moon'].forEach(key => {
      if (this.objects[key]) this.objects[key].setFollowMode(isFollowingAny);
    });
    if (this.objects.sun) this.objects.sun.setFollowMode(isFollowingAny);
  }

  updateFollowPlanetRadii(isFollowingAny) {
    const cfg = window.CONFIG || {};

    const earthR = isFollowingAny ? (cfg.EARTH_RADIUS_FOLLOW || 15) : (cfg.EARTH_RADIUS || 30);
    const sunR = isFollowingAny ? (cfg.SUN_RADIUS_FOLLOW || 30) : (cfg.SUN_RADIUS || 50);

    if (this.sceneManager) this.sceneManager.setEarthRadius(earthR);
    if (this.objects.sun) this.objects.sun.setPhysicalRadius(sunR);

    ['venus', 'mars', 'moon'].forEach(key => {
      const astro = this.objects[key];
      if (astro) {
        const followRadiusKey = key.toUpperCase() + '_RADIUS_FOLLOW';
        const defaultRadiusKey = key.toUpperCase() + '_RADIUS';
        const radius = isFollowingAny
          ? (cfg[followRadiusKey] || 10)
          : (cfg[defaultRadiusKey] || 30);
        astro.setPhysicalRadius(radius);
      }
    });
  }

  updateFollowApparentMarker(isFollowingAny) {
    if (this.objects.apparentPos) {
      this.objects.apparentPos.setFollowMode(isFollowingAny);
    }
  }

  setupUI() {
    this.menuBarController = new MenuBarController();

    this.timeHudController = new TimeHudController({
      container: '#canvas-container',
      minDay: 0,
      maxDay: 365,
      initialDay: this.params.day,
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

    // Visibility Toggles
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

    // Toggle Orbits
    const toggleOrbits = document.getElementById('toggle-orbits');
    if (toggleOrbits) {
      toggleOrbits.addEventListener('change', (e) => {
        const showOrbits = e.target.checked;
        if (this.objects.sun) this.objects.sun.toggleOrbits(showOrbits);
        ['venus', 'mars', 'moon'].forEach(key => {
          if (this.objects[key]) this.objects[key].toggleOrbits(showOrbits);
        });
      });

      const initialShowOrbits = toggleOrbits.checked;
      if (this.objects.sun) this.objects.sun.toggleOrbits(initialShowOrbits);
      ['venus', 'mars', 'moon'].forEach(key => {
        if (this.objects[key]) this.objects[key].toggleOrbits(initialShowOrbits);
      });
    }

    // Radio Astro Selection (Luna / Venus / Marte)
    const astroRadios = document.querySelectorAll('input[name="selected-astro"]');
    astroRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedAstro = e.target.value;
          this.updateAstroVisibility();
        }
      });
    });

    // Camera Mode Radio Inputs (Centrar en la Tierra / Seguir al Astro)
    const cameraRadios = document.querySelectorAll('input[name="camera-mode"]');
    cameraRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.followAstro = (e.target.value === 'astro');
          const isFollowingAny = this.followAstro;
          this.sceneManager.setFollowMode(isFollowingAny);
          this.updateFollowOrbitTubes(isFollowingAny);
          this.updateFollowPlanetRadii(isFollowingAny);
          this.updateFollowApparentMarker(isFollowingAny);
        }
      });
    });

    // Toggle Apparent Position Marker (en el menú "Ver")
    const toggleApparentPos = document.getElementById('toggle-apparent-pos');
    if (toggleApparentPos) {
      toggleApparentPos.addEventListener('change', (e) => {
        if (this.objects.apparentPos) {
          this.objects.apparentPos.visible = e.target.checked;
        }
      });
      if (this.objects.apparentPos) {
        this.objects.apparentPos.visible = toggleApparentPos.checked;
      }
    }
  }

  updateObjects() {
    if (this.objects.sun) this.objects.sun.update(this.time);
    if (this.objects.venus) this.objects.venus.update(this.time);
    if (this.objects.mars) this.objects.mars.update(this.time);
    if (this.objects.moon) this.objects.moon.update(this.time);

    const activeAstro = this.getActiveAstro();

    if (this.objects.apparentPos && this.objects.apparentPos.visible && activeAstro && activeAstro.physicalMesh) {
      const astroWorldPos = new THREE.Vector3();
      activeAstro.physicalMesh.getWorldPosition(astroWorldPos);
      this.objects.apparentPos.update(astroWorldPos, window.CONFIG ? window.CONFIG.SPHERE_RADIUS : this.params.sphereRadius);
    }

    if (this.objects.apparentTrail) {
      const showApparentPos = this.objects.apparentPos && this.objects.apparentPos.visible;

      if ((this.followAstro || showApparentPos) && activeAstro) {
        this.objects.apparentTrail.visible = true;
        this.objects.apparentTrail.update(activeAstro, this.time, window.CONFIG ? window.CONFIG.SPHERE_RADIUS : this.params.sphereRadius);
      } else {
        this.objects.apparentTrail.visible = false;
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.params.autoTime) {
      const dayIncrement = this.params.speed * 0.01;
      this.params.day += dayIncrement;
      this.time = this.params.day * 0.01;

      if (this.timeHudController) {
        this.timeHudController.setDay(this.params.day);
      }
    }

    this.updateObjects();

    if (this.followAstro) {
      const activeAstro = this.getActiveAstro();
      if (activeAstro && activeAstro.physicalMesh) {
        const astroPos = new THREE.Vector3();
        activeAstro.physicalMesh.getWorldPosition(astroPos);
        this.sceneManager.updateFollowTarget(astroPos);
      }
    }

    this.sceneManager.update();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new Simulation();
});
