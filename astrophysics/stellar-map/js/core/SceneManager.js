import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { FreeFlyControls } from './FreeFlyControls.js';
import { GEOMETRY_CONFIG, CAMERA_CONFIG } from '../config.js';
import { raDecToVector3 } from '../utils/MathUtils.js';

export class SceneManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510); // Matches CSS bg
    // this.scene.fog = new THREE.FogExp2(0x050510, 0.0001); // REMOVED: Causes stars to darken/disappear

    // Camera
    const initialFov = CAMERA_CONFIG.DEFAULT_GLOBAL_FOV || 45;
    this.camera = new THREE.PerspectiveCamera(
      initialFov,
      window.innerWidth / window.innerHeight,
      0.1,
      10000000 // Huge default far clip plane
    );
    this.camera.position.set(200, 200, -200);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;

    // Free Fly Controls
    this.freeFlyControls = new FreeFlyControls(this.camera, this.renderer.domElement);
    this.isFreeFly = false;
    this.isLocalObserverMode = false;

    // Lights
    this.setupLights();

    // Helpers (Axes)
    // const axesHelper = new THREE.AxesHelper( 50 );
    // this.scene.add( axesHelper );

    // Event Listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.setupLocalFovWheelControl();

    // Animation Loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  setupLights() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    this.scene.add(ambientLight);

    // Sun Light (Point Light) - Central Star
    const sunLight = new THREE.PointLight(0xffffff, 2, 0, 1);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    if (this.isFreeFly && this.freeFlyControls) {
      this.freeFlyControls.update();
    } else if (this.controls) {
      this.controls.update(); // required if damping enabled
    }

    if (typeof this.onUpdateCallback === 'function') {
      this.onUpdateCallback();
    }
    this.renderer.render(this.scene, this.camera);
  }

  toggleFreeFly(enabled) {
    this.isFreeFly = !!enabled;
    if (this.isFreeFly) {
      this.controls.enabled = false;
      this.freeFlyControls.enable();
    } else {
      this.freeFlyControls.disable();
      this.controls.enabled = true;

      // Reset camera and OrbitControls target back to exact initial app loading configuration
      const defaultDist = this.defaultCameraDistance || 200;
      this.controls.target.set(0, 0, 0);

      const initialDir = new THREE.Vector3(1, 1, -1).normalize();
      this.camera.position.copy(initialDir.multiplyScalar(defaultDist));
      this.camera.lookAt(0, 0, 0);
      this.controls.update();
    }
  }

  updateCamera(farClip, maxDistance) {
    const safeFar = Math.max((maxDistance || farClip) * 4, 500000);
    this.camera.far = safeFar;
    this.camera.updateProjectionMatrix();

    // Also adjust controls max distance and zoom sensitivity
    if (this.controls) {
      this.controls.maxDistance = maxDistance || (farClip * 2);
      this.controls.minDistance = 0.01; // Allow zooming very close
      this.controls.zoomSpeed = 1.2;
    }

    // Update simulation scale for WASD FreeFlyControls
    if (this.freeFlyControls) {
      this.freeFlyControls.setSimulationScale(farClip);
    }
  }

  setCameraDistance(distance) {
    if (!this.controls) return;

    this.defaultCameraDistance = distance;

    const target = this.controls.target.clone();
    const currentPos = this.camera.position.clone();
    const direction = currentPos.sub(target).normalize();

    // If camera is exactly at target (distance 0), assume typical direction (e.g. Z+)
    if (direction.lengthSq() < 0.0001) {
      direction.set(0, 0, 1);
    }

    const newPos = target.add(direction.multiplyScalar(distance));
    this.camera.position.copy(newPos);
    this.controls.update();
  }

  getCameraDistance() {
    if (!this.controls) return 0;
    return this.camera.position.distanceTo(this.controls.target);
  }

  lookAtEquatorial(ra, dec, raMode = 'hours') {
    const pos = raDecToVector3(ra, dec, 1.0, raMode);
    const dirVec = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();

    if (this.controls) {
      if (this.isLocalObserverMode) {
        // En Vista desde la Tierra, mantener el pivote en (0,0,0) a distancia 0.1 para evitar paralaje
        this.controls.target.set(0, 0, 0);
        this.camera.position.copy(dirVec.clone().multiplyScalar(-0.1));
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
      } else {
        const currentDist = this.getCameraDistance() || (this.defaultCameraDistance || 200);
        this.controls.target.set(0, 0, 0);
        this.camera.position.copy(dirVec.clone().multiplyScalar(currentDist));
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
      }
    }
  }

  // Helper to add objects from other modules
  add(object) {
    this.scene.add(object);
  }

  setupLocalFovWheelControl() {
    if (!this.renderer || !this.renderer.domElement) return;

    this.renderer.domElement.addEventListener('wheel', (event) => {
      const isFovEnabled = GEOMETRY_CONFIG.LOCAL_FOV_WHEEL_ENABLED !== false;
      if (!isFovEnabled) return;

      const isLocal = !!this.isLocalObserverMode;

      if (isLocal) {
        const minFov = GEOMETRY_CONFIG.LOCAL_FOV_MIN || 5.0;
        const maxFov = GEOMETRY_CONFIG.LOCAL_FOV_MAX || 60.0;
        const fovStep = GEOMETRY_CONFIG.LOCAL_FOV_STEP || 3.0;

        const delta = Math.sign(event.deltaY);

        if (delta !== 0) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          let newFov = this.camera.fov + delta * fovStep;
          newFov = Math.max(minFov, Math.min(maxFov, newFov));

          if (Math.abs(this.camera.fov - newFov) > 0.01) {
            this.camera.fov = newFov;
            this.camera.updateProjectionMatrix();
          }
        }
      }
    }, { capture: true, passive: false });
  }

  remove(object) {
    this.scene.remove(object);
  }
}
