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
      sphereRadius: 2000,
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

    // 1. Celestial Sphere (Grid, Equator, Ecliptic)
    this.objects.sphere = new CelestialSphere(R);
    this.objects.sphere.rotation.x = -tilt * (Math.PI / 180); // Tilt Sphere negative to align Ecliptic to Horizontal
    this.sceneManager.add(this.objects.sphere);

    // Initialize visibility based on checkboxes
    if (this.objects.sphere.grid) {
      this.objects.sphere.grid.visible = document.getElementById('toggle-grid').checked;
    }
    if (this.objects.sphere.ecliptic) {
      this.objects.sphere.ecliptic.visible = document.getElementById('toggle-ecliptic').checked;
    }


    // 2. Stars
    this.objects.stars = new Stars(R, './assets/myStars.xlsx');
    this.objects.stars.rotation.x = -tilt * (Math.PI / 180); // Tilt Stars negative
    this.sceneManager.add(this.objects.stars);

    // 2b. Zodiac Constellations
    this.objects.zodiac = new Constellations(R, './assets/Constelaciones_zodiaco.xlsx');
    this.objects.zodiac.rotation.x = -tilt * (Math.PI / 180); // Tilt Zodiac negative
    this.objects.zodiac.visible = false; // Hidden by default as per checkbox
    this.sceneManager.add(this.objects.zodiac);

    // 3. Solar System Group (Rotated by Obliquity)
    this.objects.solarSystem = new THREE.Group();
    this.objects.solarSystem.rotation.x = 0; // Solar System is 'Flat' on Ecliptic
    this.sceneManager.add(this.objects.solarSystem);

    // Sun
    // Sun (Heliocentric - Center, Static)
    // Sun is now at 0,0,0
    this.objects.sun = new Planet(R, '#FFD700', 80, {
      deferentRadius: 0,
      epicycleRadius: 0,
      deferentSpeed: 0,
      epicycleSpeed: 0,
      deferentPhase: 0
    });
    this.objects.solarSystem.add(this.objects.sun);


    // Earth (Moving around Sun)
    // Replaces the static Earth from SceneManager
    // Uses sunOmega1 for annual motion speed
    // Earth (Moving around Sun)
    // Replaces the static Earth from SceneManager
    // Uses sunOmega1 for annual motion speed
    const tropicalYear = 365;
    const earthSpeed = -(2 * Math.PI) / (tropicalYear / 100); // Inverted direction

    // Earth Orbit Radius = 1000 (was Sun's deferent)
    this.objects.earth = new Planet(R, '#66CCFF', 20, {
      deferentRadius: 1000,
      epicycleRadius: 0,
      deferentSpeed: earthSpeed,
      epicycleSpeed: 0,
      deferentPhase: Math.PI,
      texturePath: 'assets/textures/earthmap_1k.jpg'
    });
    // Axial Tilt for Earth
    if (this.objects.earth.physicalMesh) {
      this.objects.earth.physicalMesh.rotation.z = tilt * (Math.PI / 180); // Axial Tilt
    }
    this.objects.solarSystem.add(this.objects.earth);


    // Planet 1 (Inner Planet - Venus-like)
    // Closer to Sun than Earth (e.g. 720 vs 1000)
    // No epicycle.
    // Faster speed.
    // const p1Group = new THREE.Group();
    // p1Group.rotation.x = 2 * (Math.PI / 180); // 2 degrees inclination relative to Ecliptic
    // this.sceneManager.add(p1Group);

    // const planetSpeed = earthSpeed * 1.62; // Approx ratio for Venus (1.6x faster angular velocity)

    // this.objects.p1 = new Planet(R, '#FFFFFF', 20, {
    //   deferentRadius: 400,
    //   epicycleRadius: 0,
    //   deferentSpeed: planetSpeed,
    //   epicycleSpeed: 0,
    //   deferentPhase: 0
    // });
    //p1Group.add(this.objects.p1);

    // Initial Camera Position: Earth Position (or close to it)
    // But for initial view, maybe just keep it where it was, or set near Earth.
    // Let's keep the standard view from SceneManager defaults to start.

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

    document.getElementById('toggle-stars').addEventListener('change', (e) => {
      if (this.objects.stars) this.objects.stars.visible = e.target.checked;
    });

    document.getElementById('toggle-zodiac').addEventListener('change', (e) => {
      if (this.objects.zodiac) this.objects.zodiac.visible = e.target.checked;
    });

    // Ecliptic Toggle
    const eclipticToggle = document.getElementById('toggle-ecliptic');

    // Initialize Ecliptic State based on checkbox
    if (this.objects.sphere && this.objects.sphere.ecliptic) {
      const isEclipticVisible = eclipticToggle.checked;
      this.objects.sphere.ecliptic.visible = isEclipticVisible;

      // Fixed tilt (24 degrees)
      const tilt = 24 * (Math.PI / 180);
      this.objects.sphere.ecliptic.rotation.set(tilt, 0, 0);
    }

    eclipticToggle.addEventListener('change', (e) => {
      const isVisible = e.target.checked;
      if (this.objects.sphere && this.objects.sphere.ecliptic) {
        this.objects.sphere.ecliptic.visible = isVisible;
      }
    });



    // Theme Toggle Logic
    // Toggle Orbits (Deferents/Epicycles)
    const toggleOrbits = document.getElementById('toggle-orbits');
    if (toggleOrbits) {
      toggleOrbits.addEventListener('change', (e) => {
        const showOrbits = e.target.checked;
        if (this.objects.sun) this.objects.sun.toggleOrbits(showOrbits);
        if (this.objects.earth) this.objects.earth.toggleOrbits(showOrbits);
        // if (this.objects.p1) this.objects.p1.toggleOrbits(showOrbits);
        // if (this.objects.p2) this.objects.p2.toggleOrbits(showOrbits);
        // if (this.objects.p3) this.objects.p3.toggleOrbits(showOrbits);
      });

      // Initialize state based on default checkbox value
      const initialShowOrbits = toggleOrbits.checked;
      if (this.objects.sun) this.objects.sun.toggleOrbits(initialShowOrbits);
      if (this.objects.earth) this.objects.earth.toggleOrbits(initialShowOrbits);
      // if (this.objects.p1) this.objects.p1.toggleOrbits(initialShowOrbits);
      // if (this.objects.p2) this.objects.p2.toggleOrbits(initialShowOrbits);
      // if (this.objects.p3) this.objects.p3.toggleOrbits(initialShowOrbits);
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

      // Update Planets
      if (this.objects.earth) this.objects.earth.updateTheme(isLight);
      if (this.objects.p1) this.objects.p1.updateTheme(isLight);
      if (this.objects.p2) this.objects.p2.updateTheme(isLight);
      if (this.objects.p3) this.objects.p3.updateTheme(isLight);

      // Sun/Planets/Moon generally look okay on both, but could be tweaked here.
    };

    themeBtn.addEventListener('click', toggleTheme);
  }

  updateObjects() {
    if (this.objects.sun) this.objects.sun.update(this.time);
    if (this.objects.earth) this.objects.earth.update(this.time);
    if (this.objects.moon) this.objects.moon.update(this.time);
    if (this.objects.p1) this.objects.p1.update(this.time);
    if (this.objects.p2) this.objects.p2.update(this.time);
    if (this.objects.p3) this.objects.p3.update(this.time * 0.3); // Speed factor for P3
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

    if (this.followSun) {
      const sunPos = new THREE.Vector3(0, 0, 0); // Sun is at center
      if (this.objects.sun && this.objects.sun.physicalMesh) {
        this.objects.sun.physicalMesh.getWorldPosition(sunPos);
      }
      this.sceneManager.updateFollowTarget(sunPos);

      // Camera Position -> Earth
      if (this.objects.earth && this.objects.earth.physicalMesh) {
        const earthPos = new THREE.Vector3();
        // We want the camera ON the earth (or slightly above?) 
        // Actually user said "camera on Earth", usually means earth's position. 
        // But if we are literally inside the sphere we might not see anything if backface culling is on.
        // Adjusting slightly might be good, but let's try exact position first.
        // Usually we want to be *at* the earth looking *at* the sun.
        this.objects.earth.physicalMesh.getWorldPosition(earthPos);

        // Small offset to not be inside the mesh?
        // earthPos.y += 2; 

        this.sceneManager.updateCameraPosition(earthPos);
      }
    }

    this.sceneManager.update();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new Simulation();
});
