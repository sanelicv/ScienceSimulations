/**
 * OrbitLocalViewController.js
 * 
 * Standalone, modular ES6 class for Three.js.
 * Transforms standard OrbitControls into a 1st-person / 360° panoramic horizon observer
 * without modifying OrbitControls source code.
 * 
 * Reusable across any Three.js project.
 */

import * as THREE from 'three';
import { SmoothZoomController } from 'SmoothZoomController';

export class OrbitLocalViewController {
  /**
   * @param {THREE.PerspectiveCamera} camera 
   * @param {Object} controls - Three.js OrbitControls instance
   * @param {HTMLElement} domElement - Renderer DOM element for event binding
   * @param {Object} options - Configuration overrides
   */
  constructor(camera, controls, domElement, options = {}) {
    if (!camera || !controls || !domElement) {
      throw new Error('OrbitLocalViewController requires camera, controls, and domElement.');
    }

    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement;

    // Options & Defaults
    this.config = Object.assign({
      observerEyeHeight: options.OBSERVER_EYE_HEIGHT ?? 1.0,
      localViewRadius: options.LOCAL_VIEW_RADIUS ?? 0.1,
      defaultGlobalFov: options.DEFAULT_GLOBAL_FOV ?? 45,
      defaultLocalFov: options.DEFAULT_LOCAL_FOV ?? 60,
      minLocalFov: options.MIN_LOCAL_FOV ?? 1,
      maxLocalFov: options.MAX_LOCAL_FOV ?? 90,
      baseLocalRotateSpeed: options.BASE_LOCAL_ROTATE_SPEED ?? -0.15,
      baseGlobalRotateSpeed: options.BASE_GLOBAL_ROTATE_SPEED ?? 1.0,
      nearPlane: options.NEAR_PLANE ?? 0.05,
      farPlane: options.FAR_PLANE ?? 500000,
      smoothZoomDamping: options.SMOOTH_ZOOM_DAMPING ?? 0.08,
      zoomSensitivity: options.ZOOM_SENSITIVITY ?? 0.001,
      minGlobalDistance: options.MIN_GLOBAL_DISTANCE ?? 10,
      maxGlobalDistance: options.MAX_GLOBAL_DISTANCE ?? 2500
    }, options);

    // View State
    this.isLocalView = false;
    this.trackedObject = null;

    // Saved State Buffers for Global View restoration
    this.savedCameraPosition = new THREE.Vector3();
    this.savedControlsTarget = new THREE.Vector3();
    this.savedFov = camera.fov;
    this.savedRotateSpeed = controls.rotateSpeed || 1.0;
    this.savedNear = camera.near;

    // Ensure camera near and far planes match config to avoid clipping
    this.camera.near = this.config.nearPlane;
    this.camera.far = this.config.farPlane;
    this.camera.updateProjectionMatrix();

    // Initialize SmoothZoomController for Global View
    this.smoothZoomController = null;
    this.initSmoothZoom();

    // Bind Wheel Event Listener (used for Local View FOV Zoom)
    this.onWheelBound = this.onWheel.bind(this);
    this.domElement.addEventListener('wheel', this.onWheelBound, { passive: false });

    // Cancel Astro Tracking on User Drag Interaction
    this.onControlStartBound = this.onControlStart.bind(this);
    if (typeof this.controls.addEventListener === 'function') {
      this.controls.addEventListener('start', this.onControlStartBound);
    }
  }

  /**
   * Initializes SmoothZoomController for Global View distance zoom
   */
  initSmoothZoom() {
    if (!this.smoothZoomController && typeof SmoothZoomController !== 'undefined') {
      try {
        this.smoothZoomController = new SmoothZoomController(
          this.camera,
          this.controls,
          this.domElement,
          {
            minDistance: this.config.minGlobalDistance,
            maxDistance: this.config.maxGlobalDistance,
            zoomSensitivity: this.config.zoomSensitivity,
            damping: this.config.smoothZoomDamping
          }
        );
      } catch (e) {
        this.smoothZoomController = null;
      }
    }
  }

  /**
   * Activates Local View (1st-person 360° Observer on Horizon)
   * @param {THREE.Vector3} [observerPosition] - Position vector of observer on ground
   */
  setLocalView(observerPosition = new THREE.Vector3(0, this.config.observerEyeHeight, 0)) {
    if (this.isLocalView) return;

    // Destroy SmoothZoomController in Local View so FOV zoom handles wheel events directly
    if (this.smoothZoomController) {
      this.smoothZoomController.destroy();
      this.smoothZoomController = null;
    }

    // 1. Save Global View State
    this.savedCameraPosition.copy(this.camera.position);
    this.savedControlsTarget.copy(this.controls.target);
    this.savedFov = this.camera.fov;
    this.savedRotateSpeed = this.controls.rotateSpeed;

    this.isLocalView = true;

    // 2. Set Orbit Target exactly at observer eye position
    this.controls.target.copy(observerPosition);

    // 3. Set Camera Position at infinitesimal radius (r = 0.1) from target
    this.camera.position.set(
      observerPosition.x,
      observerPosition.y,
      observerPosition.z + this.config.localViewRadius
    );

    // 4. Set Panoramic FOV and ensure camera near/far planes match configuration
    this.camera.fov = this.config.defaultLocalFov;
    this.camera.near = this.config.nearPlane;
    this.camera.far = Math.max(this.camera.far, this.config.farPlane || 500000);
    this.camera.updateProjectionMatrix();

    // 5. Disable native OrbitControls zoom/pan to handle custom FOV telescopic zoom
    this.controls.enableZoom = false;
    this.controls.enablePan = false;

    // 6. Invert and scale rotateSpeed for interior 360° view
    this.updateLocalRotateSpeed();

    // 7. Refresh controls
    this.controls.update();
  }

  /**
   * Restores Global View (3rd-person Orbit)
   */
  setGlobalView() {
    if (!this.isLocalView && this.smoothZoomController) return;

    this.isLocalView = false;
    this.stopTracking();

    // 1. Restore Camera Position & Target
    this.camera.position.copy(this.savedCameraPosition);
    this.controls.target.copy(this.savedControlsTarget);

    // 2. Restore FOV
    this.camera.fov = this.savedFov;
    this.camera.updateProjectionMatrix();

    // 3. Restore Orbit Controls settings
    this.controls.rotateSpeed = this.savedRotateSpeed;
    this.controls.enablePan = false;
    this.controls.enableZoom = true;

    // 4. Re-enable SmoothZoomController for Global View
    this.initSmoothZoom();

    // 5. Synchronize SmoothZoomController target distance to restored camera distance
    if (this.smoothZoomController) {
      const currentDist = this.camera.position.distanceTo(this.controls.target);
      this.smoothZoomController.setTargetDistance(currentDist);
    }

    this.controls.update();
  }

  /**
   * Toggles between Local View and Global View
   * @param {THREE.Vector3} [observerPosition]
   */
  toggleView(observerPosition) {
    if (this.isLocalView) {
      this.setGlobalView();
    } else {
      this.setLocalView(observerPosition);
    }
  }

  /**
   * Dynamic Mouse Sensitivity Scaling based on FOV
   * Smaller FOV (higher zoom) => Lower rotateSpeed for fine telescope control
   */
  updateLocalRotateSpeed() {
    if (!this.isLocalView) return;
    const fovRatio = this.camera.fov / 90.0;
    this.controls.rotateSpeed = this.config.baseLocalRotateSpeed * fovRatio;
  }

  /**
   * Handles Mouse Wheel events for Optical FOV Zoom (Local View only)
   * Pivots camera direction toward the mouse cursor so that the point under the cursor
   * remains stationary on screen during zoom (Stellarium-style cursor zoom).
   * @param {WheelEvent} event 
   */
  onWheel(event) {
    if (this.isLocalView) {
      event.preventDefault();

      // Calculate normalized device coordinates (NDC [-1, 1]) for mouse position
      const rect = this.domElement.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const mouseVec = new THREE.Vector2(mouseX, mouseY);

      // 1. Ray direction under mouse cursor BEFORE FOV zoom
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseVec, this.camera);
      const rayDirBefore = raycaster.ray.direction.clone().normalize();

      // 2. Apply FOV Zoom step
      const delta = event.deltaY;
      let newFov = this.camera.fov + delta * 0.05;
      newFov = Math.max(this.config.minLocalFov, Math.min(this.config.maxLocalFov, newFov));

      if (Math.abs(newFov - this.camera.fov) < 1e-5) return;

      this.camera.fov = newFov;
      this.camera.updateProjectionMatrix();

      // 3. Ray direction under mouse cursor AFTER FOV update (without camera rotation)
      raycaster.setFromCamera(mouseVec, this.camera);
      const rayDirAfter = raycaster.ray.direction.clone().normalize();

      // 4. Calculate angular shift vector to keep mouse cursor pinned to world direction
      const shift = new THREE.Vector3().subVectors(rayDirBefore, rayDirAfter);

      // 5. Current camera look direction vector from observer target to camera position
      const observerPos = this.controls.target;
      const currentDir = new THREE.Vector3().subVectors(observerPos, this.camera.position).normalize();

      // 6. Rotate camera direction vector towards cursor
      const newDir = currentDir.add(shift).normalize();

      // 7. Reposition camera at localViewRadius behind observer target in newDir direction
      this.camera.position.copy(observerPos).sub(newDir.multiplyScalar(this.config.localViewRadius));

      // Recalculate dynamic mouse sensitivity
      this.updateLocalRotateSpeed();

      // Refresh OrbitControls state
      this.controls.update();
    }
  }

  /**
   * Directs the local observer view towards a specific 3D coordinate in world space
   * @param {THREE.Vector3} worldTargetPosition 
   */
  lookAt(worldTargetPosition) {
    if (!this.isLocalView) return;

    const observerPos = this.controls.target; // Observer eye level (0, EYE_HEIGHT, 0)
    const direction = new THREE.Vector3()
      .subVectors(worldTargetPosition, observerPos)
      .normalize();

    // Position camera infinitesimal radius BEHIND the target pointing toward the object
    this.camera.position
      .copy(observerPos)
      .sub(direction.multiplyScalar(this.config.localViewRadius));

    this.controls.update();
  }

  /**
   * Continuously tracks a 3D object in space (e.g., celestial body or guide star)
   * @param {THREE.Object3D} threeObject 
   */
  trackObject(threeObject) {
    this.trackedObject = threeObject;
  }

  /**
   * Stops object tracking
   */
  stopTracking() {
    this.trackedObject = null;
  }

  /**
   * Callback fired when user starts manual dragging with mouse/touch
   */
  onControlStart() {
    if (this.trackedObject) {
      this.stopTracking();
    }
  }

  /**
   * Animation frame update call
   */
  update() {
    if (this.isLocalView && this.trackedObject) {
      const worldPos = new THREE.Vector3();
      this.trackedObject.getWorldPosition(worldPos);
      this.lookAt(worldPos);
    } else if (!this.isLocalView && this.smoothZoomController) {
      this.smoothZoomController.update();
    }
  }

  /**
   * Cleanup method to prevent memory leaks when removing the controller
   */
  destroy() {
    if (this.smoothZoomController) {
      this.smoothZoomController.destroy();
      this.smoothZoomController = null;
    }
    if (this.domElement && this.onWheelBound) {
      this.domElement.removeEventListener('wheel', this.onWheelBound);
    }
    if (this.controls && typeof this.controls.removeEventListener === 'function' && this.onControlStartBound) {
      this.controls.removeEventListener('start', this.onControlStartBound);
    }
  }
}

