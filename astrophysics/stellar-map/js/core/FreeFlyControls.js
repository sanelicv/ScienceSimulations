import * as THREE from 'three';
import { CAMERA_CONFIG } from '../config.js';

export class FreeFlyControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;
    this.enabled = false;

    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
      ctrl: false,
      shift: false
    };

    this.isMouseDown = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.clock = new THREE.Clock();
    this.simulationScale = 1000.0; // Default scale until dataset is loaded

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

    this.initEventListeners();
  }

  setSimulationScale(scale) {
    if (scale && scale > 0) {
      this.simulationScale = scale;
    }
  }

  initEventListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    if (this.domElement) {
      this.domElement.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      this.domElement.addEventListener('contextmenu', this.onContextMenu);
    }
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.clock.start();

    // Sync initial Euler angles with camera direction
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');

    // Protect against accidental tab closure (e.g. Ctrl+W)
    this.onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', this.onBeforeUnload);

    // Request Keyboard Lock API in modern browsers to capture system hotkeys
    if (navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
      navigator.keyboard.lock(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ControlLeft', 'ControlRight', 'Space', 'ShiftLeft', 'ShiftRight']).catch(() => {});
    }
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.isMouseDown = false;

    // Reset key states
    Object.keys(this.keys).forEach(k => this.keys[k] = false);

    if (this.onBeforeUnload) {
      window.removeEventListener('beforeunload', this.onBeforeUnload);
      this.onBeforeUnload = null;
    }

    if (navigator.keyboard && typeof navigator.keyboard.unlock === 'function') {
      navigator.keyboard.unlock();
    }
  }

  onContextMenu(event) {
    if (this.enabled) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }

  onKeyDown(event) {
    if (!this.enabled) return;

    // Avoid hijacking key presses when typing in inputs/textareas
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return;
    }

    const code = event.code;

    // Prevent native browser shortcuts (such as Ctrl+W, Ctrl+S, Ctrl+A, Ctrl+D, Space scrolling)
    if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyC', 'Space', 'ControlLeft', 'ControlRight', 'Control', 'ShiftLeft', 'ShiftRight', 'Shift'].includes(code) || event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (code === 'KeyW') this.keys.w = true;
    if (code === 'KeyS') this.keys.s = true;
    if (code === 'KeyA') this.keys.a = true;
    if (code === 'KeyD') this.keys.d = true;
    if (code === 'Space') this.keys.space = true;
    if (code === 'ControlLeft' || code === 'ControlRight' || code === 'Control' || code === 'KeyC') this.keys.ctrl = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Shift') this.keys.shift = true;
  }

  onKeyUp(event) {
    if (!this.enabled) return;

    const code = event.code;

    if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyC', 'Space', 'ControlLeft', 'ControlRight', 'Control', 'ShiftLeft', 'ShiftRight', 'Shift'].includes(code) || event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (code === 'KeyW') this.keys.w = false;
    if (code === 'KeyS') this.keys.s = false;
    if (code === 'KeyA') this.keys.a = false;
    if (code === 'KeyD') this.keys.d = false;
    if (code === 'Space') this.keys.space = false;
    if (code === 'ControlLeft' || code === 'ControlRight' || code === 'Control' || code === 'KeyC') this.keys.ctrl = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Shift') this.keys.shift = false;
  }

  onPointerDown(event) {
    if (!this.enabled) return;

    // Only drag look on primary button (left click) or middle button
    if (event.button === 0 || event.button === 1) {
      this.isMouseDown = true;
      this.lastMousePos.x = event.clientX;
      this.lastMousePos.y = event.clientY;
    }
  }

  onPointerMove(event) {
    if (!this.enabled || !this.isMouseDown) return;

    const dx = event.clientX - this.lastMousePos.x;
    const dy = event.clientY - this.lastMousePos.y;

    this.lastMousePos.x = event.clientX;
    this.lastMousePos.y = event.clientY;

    const sensitivity = (CAMERA_CONFIG && CAMERA_CONFIG.FREE_FLY_MOUSE_SENSITIVITY)
      ? CAMERA_CONFIG.FREE_FLY_MOUSE_SENSITIVITY
      : 0.003;

    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.euler.y -= dx * sensitivity; // Yaw (look left/right)
    this.euler.x -= dy * sensitivity; // Pitch (look up/down)

    // Clamp pitch to prevent camera flipping upside down (-89 to +89 degrees)
    const maxPitch = (Math.PI / 2) - 0.02;
    this.euler.x = Math.max(-maxPitch, Math.min(maxPitch, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  onPointerUp() {
    if (this.isMouseDown) {
      this.isMouseDown = false;
    }
  }

  update() {
    if (!this.enabled) return;

    const delta = this.clock.getDelta();
    const baseFactor = (CAMERA_CONFIG && CAMERA_CONFIG.FREE_FLY_SPEED_FACTOR !== undefined)
      ? CAMERA_CONFIG.FREE_FLY_SPEED_FACTOR
      : 0.35;
    const shiftFactor = (CAMERA_CONFIG && CAMERA_CONFIG.FREE_FLY_SHIFT_SPEED_FACTOR !== undefined)
      ? CAMERA_CONFIG.FREE_FLY_SHIFT_SPEED_FACTOR
      : 1.0;

    const speedFactor = this.keys.shift ? shiftFactor : baseFactor;
    const speed = this.simulationScale * speedFactor;

    const moveVector = new THREE.Vector3(0, 0, 0);

    // Forward direction from camera orientation
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    // Right direction = forward x (0,1,0)
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // World Up direction = (0, 1, 0)
    const up = new THREE.Vector3(0, 1, 0);

    if (this.keys.w) moveVector.add(forward);
    if (this.keys.s) moveVector.sub(forward);
    if (this.keys.d) moveVector.add(right);
    if (this.keys.a) moveVector.sub(right);
    if (this.keys.space) moveVector.add(up);
    if (this.keys.ctrl) moveVector.sub(up);

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(speed * delta);
      this.camera.position.add(moveVector);
    }
  }

  dispose() {
    this.disable();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    if (this.domElement) {
      this.domElement.removeEventListener('pointerdown', this.onPointerDown);
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    }
  }
}
