import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { CelestialSphere } from './objects/CelestialSphere.js';
import { Stars } from './objects/Stars.js';
import { Constellations } from './objects/Constellations.js'; // NEW
import { Planet } from './objects/Planet.js';
import { Moon } from './objects/Moon.js';

class Simulation {
  constructor() {
    this.sceneManager = new SceneManager('canvas-container');
    this.params = {
      speed: 1,
      day: 0,
      autoTime: true,
      sphereRadius: 3000,
      isLightMode: false
    };

    this.followSun = false;

    this.time = 0;
    this.objects = {};

    this.init();
  }

  async init() {
    const R = this.params.sphereRadius;
    const tilt = 24;

    // 1. Celestial Sphere (Grid + Ecliptic)
    this.objects.sphere = new CelestialSphere(R);
    this.sceneManager.add(this.objects.sphere);
    // Initialize visibility based on checkbox
    if (this.objects.sphere.grid) {
      this.objects.sphere.grid.visible = document.getElementById('toggle-grid').checked;
    }

    // 2. Stars
    this.objects.stars = new Stars(R, './assets/myStars.xlsx');
    this.sceneManager.add(this.objects.stars);

    // 2b. Zodiac Constellations
    this.objects.zodiac = new Constellations(R, './assets/Constelaciones_zodiaco.xlsx');
    this.objects.zodiac.visible = false; // Hidden by default as per checkbox
    this.sceneManager.add(this.objects.zodiac);

    // 3. Solar System Group (Rotated by Obliquity)
    this.objects.solarSystem = new THREE.Group();
    this.objects.solarSystem.rotation.x = tilt * (Math.PI / 180); // Tilt
    this.sceneManager.add(this.objects.solarSystem);

    // Sun
    // Sun (Simple Orbit - Geocentric)
    const tropicalYear = 365;
    const sunOmega1 = - (2 * Math.PI) / (tropicalYear / 100);

    // We place the Sun inside the sphere. 
    // Say Deferent R = 60% of Sphere Radius? Or just large enough.
    // Let's say R_sun = 350.
    this.objects.sun = new Planet(R, '#FFD700', 80, {
      deferentRadius: 1000,
      epicycleRadius: 0,
      deferentSpeed: sunOmega1,
      epicycleSpeed: 0,
      deferentPhase: 0
    });
    this.objects.solarSystem.add(this.objects.sun);

    // 4. Solar Sphere (Equatorial Grid with Solar Orbit Radius)
    this.objects.solarSphere = new CelestialSphere(1000); // 1000 is defined as deferentRadius of the sun
    this.sceneManager.add(this.objects.solarSphere);

    // Hide parts not requested, only display the grid
    if (this.objects.solarSphere.ecliptic) this.objects.solarSphere.ecliptic.visible = false;
    if (this.objects.solarSphere.equator) this.objects.solarSphere.equator.visible = false;
    this.objects.solarSphere.visible = false; // Hidden by default

    // Hide the sun's internal orbits since we now have the solar sphere
    this.objects.sun.toggleOrbits(false);

    // Initial Camera Position: Half sphere radius (R/2), opposite to Sun
    // Sun is at Phase 0 (+X), so opposite is -X.
    const camR = R / 2;
    const camElevation = 0 * (Math.PI / 180); // Slight elevation to see orbits 
    const camX = -camR * Math.cos(camElevation); // Opposite to Sun (+X) -> -X
    const camY = camR * Math.sin(camElevation);
    const camZ = 0;

    this.sceneManager.camera.position.set(camX, camY, camZ);
    this.sceneManager.camera.lookAt(0, 0, 0); // Look at center
    // Update SceneManager's smooth zoom target to match this new distance
    this.sceneManager.targetDistance = this.sceneManager.camera.position.length();
    this.sceneManager.controls.saveState(); // Save as reset state if needed

    this.setupUI();
    this.animate();
  }

  setupUI() {
    const speedRange = document.getElementById('speed-range');
    const speedVal = document.getElementById('speed-value');
    speedRange.addEventListener('input', (e) => {
      this.params.speed = Number(e.target.value);
      speedVal.textContent = this.params.speed + 'x';
    });

    const dayRange = document.getElementById('day-range');
    const dayVal = document.getElementById('day-value');
    const updateTimeFromDay = () => {
      this.time = this.params.day * 0.01; // Scale factor matching p5 logic
      // Also force update objects immediately if paused so user sees change
      if (!this.params.autoTime) {
        this.updateObjects();
        this.sceneManager.update();
      }
    };

    dayRange.addEventListener('input', (e) => {
      this.params.day = Number(e.target.value);
      dayVal.textContent = this.params.day;
      updateTimeFromDay();
    });

    document.getElementById('toggle-autotime').addEventListener('change', (e) => {
      this.params.autoTime = e.target.checked;
    });

    // Visibility Toggles
    document.getElementById('toggle-grid').addEventListener('change', (e) => {
      if (this.objects.sphere && this.objects.sphere.grid) {
        this.objects.sphere.grid.visible = e.target.checked;
      }
    });

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

    document.getElementById('toggle-zodiac').addEventListener('change', (e) => {
      if (this.objects.zodiac) this.objects.zodiac.visible = e.target.checked;
    });

    // Ecliptic Toggle & Controls
    const eclipticToggle = document.getElementById('toggle-ecliptic');

    // Initialize Ecliptic State based on checkbox
    if (this.objects.sphere && this.objects.sphere.ecliptic) {
      const isEclipticVisible = eclipticToggle.checked;
      this.objects.sphere.ecliptic.visible = isEclipticVisible;

      // Hardcode tilt to 24 degrees
      const tilt = 24 * (Math.PI / 180);
      this.objects.sphere.ecliptic.rotation.set(tilt, 0, 0);
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
    });

    // Theme Toggle Logic
    // Toggle Esfera Solar
    const toggleSolarSphere = document.getElementById('toggle-solar-sphere');
    if (toggleSolarSphere) {
      toggleSolarSphere.addEventListener('change', (e) => {
        if (this.objects.solarSphere) {
          this.objects.solarSphere.visible = e.target.checked;
        }
      });
      // Initialize state
      if (this.objects.solarSphere) {
        this.objects.solarSphere.visible = toggleSolarSphere.checked;
      }
    }

    // Toggle Follow Sun
    const toggleFollow = document.getElementById('toggle-follow-sun');
    if (toggleFollow) {
      toggleFollow.addEventListener('change', (e) => {
        this.followSun = e.target.checked;
        this.sceneManager.setFollowMode(this.followSun);
      });
    }

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

      // Update Moon
      if (this.objects.moon) this.objects.moon.updateTheme(isLight);

      // Update Solar Sphere Theme
      if (this.objects.solarSphere) this.objects.solarSphere.updateTheme(isLight);

      // Sun/Planets/Moon generally look okay on both, but could be tweaked here.
    };

    themeBtn.addEventListener('click', toggleTheme);
  }

  updateObjects() {
    if (this.objects.sun) this.objects.sun.update(this.time);
    if (this.objects.moon) this.objects.moon.update(this.time);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.params.autoTime) {
      const dayIncrement = this.params.speed * 0.01; // half speed (was 0.1)
      this.params.day += dayIncrement;
      this.time = this.params.day * 0.01;

      // Sync UI
      const dayRange = document.getElementById('day-range');
      const dayVal = document.getElementById('day-value');
      if (dayRange && dayVal) {
        dayRange.value = Math.floor(this.params.day) % 365;
        dayVal.textContent = Math.floor(this.params.day); // Continuous day count
      }
    }

    this.updateObjects();

    if (this.followSun && this.objects.sun && this.objects.sun.physicalMesh) {
      const sunPos = new THREE.Vector3();
      this.objects.sun.physicalMesh.getWorldPosition(sunPos);
      this.sceneManager.updateFollowTarget(sunPos);
    }

    this.sceneManager.update();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new Simulation();
});
