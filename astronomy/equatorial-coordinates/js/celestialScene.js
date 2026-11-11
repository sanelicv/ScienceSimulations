import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { OrbitLocalViewController } from '../assets/lib/orbitLocalViewController.js';
import { GEOMETRY_CONFIG, CAMERA_CONFIG } from './config.js';
import { disposeHierarchy } from './utils/threeHelpers.js';
import { SphereSurfaceBuilder } from './scene/sphereSurfaceBuilder.js';
import { EquatorialGridBuilder } from './scene/equatorialGridBuilder.js';
import { EquatorialCoordsBuilder } from './scene/equatorialCoordsBuilder.js';
import { GuideStarBuilder } from './scene/guideStarBuilder.js';
import { HorizonBuilder } from './scene/horizonBuilder.js';
import { StarRenderers } from './scene/starRenderers.js';

export class CelestialScene {
  constructor(containerElement) {
    this.container = containerElement;
    this.sphereRadius = GEOMETRY_CONFIG.SPHERE_RADIUS;

    // State data
    this.userStars = [];
    this.csvStars = [];
    this.showIndices = false;
    this.spriteTextureCache = new Map();

    // Current inputs
    this.guideRA = 0;
    this.guideDec = 0;
    this.latitude = -12.05;
    this.earthRotation = 0;
    this.cameraMode = 'camSphere'; // 'camSphere' | 'camLatitude'

    // Instantiate Sub-Builders (3 Decoupled Modules)
    this.sphereSurfaceBuilder = new SphereSurfaceBuilder(this);
    this.equatorialGridBuilder = new EquatorialGridBuilder(this);
    this.equatorialCoordsBuilder = new EquatorialCoordsBuilder(this);
    this.guideStarBuilder = new GuideStarBuilder(this);
    this.horizonBuilder = new HorizonBuilder(this);
    this.starRenderers = new StarRenderers(this);

    // Backward compatibility aliases
    this.gridBuilder = this.equatorialGridBuilder;
    this.coordHelpersBuilder = this.equatorialCoordsBuilder;

    // Scene setup
    this.initThree();
    this.initTextures();
    this.buildScene();

    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(GEOMETRY_CONFIG.SCENE_BACKGROUND_COLOR);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.DEFAULT_GLOBAL_FOV,
      width / height,
      CAMERA_CONFIG.NEAR_PLANE,
      CAMERA_CONFIG.FAR_PLANE
    );

    const initPos = CAMERA_CONFIG.INITIAL_GLOBAL_CAMERA_POS || { x: 300, y: 120, z: -300 };
    this.camera.position.set(initPos.x, initPos.y, initPos.z);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = CAMERA_CONFIG.ENABLE_DAMPING !== undefined ? CAMERA_CONFIG.ENABLE_DAMPING : true;
    this.controls.dampingFactor = CAMERA_CONFIG.DAMPING_FACTOR !== undefined ? CAMERA_CONFIG.DAMPING_FACTOR : 0.05;
    this.controls.enablePan = false;

    // Reusable Modular Camera Controller
    this.cameraController = new OrbitLocalViewController(
      this.camera,
      this.controls,
      this.renderer.domElement,
      CAMERA_CONFIG
    );

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(100, 150, 100);
    this.scene.add(dirLight);
  }

  initTextures() {
    const textureLoader = new THREE.TextureLoader();
    this.grassTexture = textureLoader.load('assets/textures/grass.png', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      if (this.renderer) {
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      }
    }, undefined, () => {
      textureLoader.load('grass.png', (fallbackTex) => {
        fallbackTex.wrapS = THREE.RepeatWrapping;
        fallbackTex.wrapT = THREE.RepeatWrapping;
        this.grassTexture = fallbackTex;
      });
    });
  }

  buildScene() {
    // Root group for Celestial Objects that rotate with Latitude / Earth Rotation
    this.skyPivotGroup = new THREE.Group();
    this.scene.add(this.skyPivotGroup);

    // Sub-groups
    this.sphereShellGroup = new THREE.Group();
    this.sphereGridGroup = new THREE.Group();
    this.coordHelpersGroup = new THREE.Group();
    this.fixedPoleLabelsGroup = new THREE.Group();
    this.vernalGroup = new THREE.Group();
    this.equatorDiskGroup = new THREE.Group();
    this.eclipticGroup = new THREE.Group();
    this.guideGroup = new THREE.Group();
    this.userStarsGroup = new THREE.Group();
    this.csvStarsGroup = new THREE.Group();

    this.skyPivotGroup.add(this.sphereShellGroup);
    this.skyPivotGroup.add(this.sphereGridGroup);
    this.skyPivotGroup.add(this.coordHelpersGroup);
    this.coordHelpersGroup.add(this.fixedPoleLabelsGroup);
    this.skyPivotGroup.add(this.vernalGroup);
    this.skyPivotGroup.add(this.equatorDiskGroup);
    this.skyPivotGroup.add(this.eclipticGroup);
    this.skyPivotGroup.add(this.guideGroup);
    this.skyPivotGroup.add(this.userStarsGroup);
    this.skyPivotGroup.add(this.csvStarsGroup);

    // Permanent groups always visible
    this.sphereShellGroup.visible = true;
    this.sphereGridGroup.visible = true;

    // Toggleable helpers - Disabled by default on startup
    this.coordHelpersGroup.visible = false;
    this.vernalGroup.visible = false;
    this.equatorDiskGroup.visible = false;
    this.eclipticGroup.visible = false;

    // Horizon ground group (fixed relative to observer)
    this.horizonGroup = new THREE.Group();
    this.scene.add(this.horizonGroup);
    this.horizonGroup.visible = false;

    // Delegate component construction to 3 decoupled sub-builders
    this.sphereSurfaceBuilder.createPermanentCelestialSphere();
    this.equatorialGridBuilder.createPermanentSphereGrid();
    this.equatorialCoordsBuilder.createExplicitEquatorialCoordinates();
    this.equatorialCoordsBuilder.createVernalEquinoxLine();
    this.equatorialCoordsBuilder.createCelestialEquator();
    this.equatorialCoordsBuilder.createEcliptic();
    this.horizonBuilder.createHorizonGround();
    this.horizonBuilder.createCardinalPoints();
    this.guideStarBuilder.updateGuideVector(0, 0);
  }

  // --- DELEGATED API METHODS ---

  updateGuideVector(ra, dec) {
    this.guideStarBuilder.updateGuideVector(ra, dec);
  }

  addUserStar(ra, dec) {
    this.starRenderers.addUserStar(ra, dec);
  }

  renderUserStars() {
    this.starRenderers.renderUserStars();
  }

  setCsvStars(dataArray) {
    this.starRenderers.setCsvStars(dataArray);
  }

  renderCsvStars() {
    this.starRenderers.renderCsvStars();
  }

  clearAllStars() {
    this.starRenderers.clearAllStars();
  }

  setHelpersVisibility(options = {}) {
    if (options.grid !== undefined) this.sphereGridGroup.visible = options.grid;
    if (options.sphere !== undefined) this.sphereShellGroup.visible = options.sphere;
    if (options.coord !== undefined) this.coordHelpersGroup.visible = options.coord;
    if (options.vernal !== undefined) this.vernalGroup.visible = options.vernal;
    if (options.equator !== undefined) this.equatorDiskGroup.visible = options.equator;
    if (options.ecliptic !== undefined) this.eclipticGroup.visible = options.ecliptic;

    if (options.vector !== undefined) {
      this.guideGroup.visible = options.vector;
      if (this.fixedPoleLabelsGroup) {
        this.fixedPoleLabelsGroup.visible = !options.vector;
      }
    }

    if (options.indices !== undefined) {
      this.showIndices = options.indices;
      this.starRenderers.renderCsvStars();
    }

    this.coordHelpersBuilder.updateEquatorialRALabelVisibility();
  }

  updateSkyOrientation() {
    if (this.cameraMode === 'camLatitude') {
      const latRad = ((90 - this.latitude) * Math.PI) / 180;
      const rotRad = (this.earthRotation * Math.PI) / 180;

      this.skyPivotGroup.rotation.set(0, 0, 0);
      this.skyPivotGroup.rotation.x = latRad;
      this.skyPivotGroup.rotation.y = rotRad;

      const targetRadius = GEOMETRY_CONFIG.LOCAL_CELESTIAL_SPHERE_RADIUS || GEOMETRY_CONFIG.SPHERE_RADIUS;
      const baseScale = targetRadius / GEOMETRY_CONFIG.SPHERE_RADIUS;
      this.skyPivotGroup.scale.set(baseScale, baseScale, baseScale);

      const requiredFar = Math.max(
        GEOMETRY_CONFIG.MAX_VISUAL_DISTANCE || 500000,
        targetRadius * 5,
        (GEOMETRY_CONFIG.LANDSCAPE_GROUND_RADIUS || 2500) * 5
      );
      if (this.camera.far < requiredFar) {
        this.camera.far = requiredFar;
        this.camera.updateProjectionMatrix();
      }

      if (this.sphereMat) {
        const localOpacity = (GEOMETRY_CONFIG.LOCAL_SPHERE_SHELL_OPACITY !== undefined)
          ? GEOMETRY_CONFIG.LOCAL_SPHERE_SHELL_OPACITY
          : ((GEOMETRY_CONFIG.LOCAL_CELESTIAL_SPHERE_OPACITY !== undefined)
            ? GEOMETRY_CONFIG.LOCAL_CELESTIAL_SPHERE_OPACITY
            : GEOMETRY_CONFIG.SPHERE_OPACITY);
        this.sphereMat.opacity = localOpacity;
        this.sphereMat.transparent = true;
        this.sphereMat.depthWrite = false;
      }
    } else {
      this.skyPivotGroup.rotation.set(0, 0, 0);
      this.skyPivotGroup.scale.set(1, 1, 1);

      if (this.sphereMat) {
        this.sphereMat.opacity = GEOMETRY_CONFIG.SPHERE_OPACITY;
        this.sphereMat.transparent = true;
        this.sphereMat.depthWrite = false;
      }
    }
  }

  setLatitude(latDeg) {
    this.latitude = Number(latDeg);
    this.updateSkyOrientation();
  }

  setEarthRotation(rotDeg) {
    this.earthRotation = Number(rotDeg);
    this.updateSkyOrientation();
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    this.lastGridFov = undefined;

    if (mode === 'camSphere') {
      this.horizonGroup.visible = false;
      this.cameraController.setGlobalView();
      this.gridBuilder.createPermanentSphereGrid();
      this.updateSkyOrientation();
    } else if (mode === 'camLatitude') {
      this.horizonGroup.visible = true;
      const observerPos = new THREE.Vector3(0, CAMERA_CONFIG.OBSERVER_EYE_HEIGHT, 0);
      this.cameraController.setLocalView(observerPos);
      this.gridBuilder.createPermanentSphereGrid();
      this.updateSkyOrientation();
    }
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.cameraController.update();
    if (this.cameraMode === 'camLatitude') {
      this.horizonBuilder.updateCardinalScale();
      this.gridBuilder.updateGridLineWidth();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
