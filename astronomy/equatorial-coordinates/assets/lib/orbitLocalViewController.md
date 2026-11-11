# OrbitLocalViewController.js

**OrbitLocalViewController.js** is a standalone, modular ES6 class for [Three.js](https://threejs.org/) that seamlessly transforms standard `OrbitControls` into a **1st-person / 360° panoramic horizon observer** with Stellarium-style cursor-centered optical FOV zoom, dynamic mouse sensitivity scaling, and object tracking—without modifying Three.js core or `OrbitControls` source code.

---

## 🌟 Key Features

- **Dual Camera Mode Architecture**: Effortlessly switch between 3rd-person global Orbit view and 1st-person 360° local observer view on the ground.
- **Stellarium-Style Cursor-Centered Zoom**: Optical FOV telescopic zoom pivots toward the mouse cursor position so whatever 3D object is under the pointer stays anchored under the cursor during zoom.
- **Dynamic Mouse Sensitivity Scaling**: Automatically scales drag rotation speed (`rotateSpeed`) proportionally with `camera.fov` to provide fine telescope control at narrow FOVs (e.g. 1°).
- **Smooth Object Tracking (`trackObject`)**: Lock onto and track moving 3D celestial objects or vectors in world space.
- **Zero-Dependencies & Plug-and-Play**: Standard ES6 module with clean memory lifecycle management (`destroy()`).

---

## 📦 Installation & Import

Save `orbitLocalViewController.js` into your project's JavaScript directory:

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitLocalViewController } from './js/orbitLocalViewController.js';
```

---

## 🚀 Quick Start Example

```javascript
// 1. Setup Three.js Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 500000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

// 2. Setup standard OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// 3. Initialize OrbitLocalViewController
const localViewController = new OrbitLocalViewController(
  camera,
  controls,
  renderer.domElement,
  {
    observerEyeHeight: 1.0,  // Observer eye level above ground
    defaultLocalFov: 60,     // Default local panoramic FOV
    minLocalFov: 1,          // Maximum telescopic zoom in degrees
    maxLocalFov: 90          // Wide angle FOV in degrees
  }
);

// 4. Activate Local View (1st-person 360° observer)
localViewController.setLocalView();

// 5. Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Update controller & OrbitControls
  localViewController.update();
  controls.update();

  renderer.render(scene, camera);
}
animate();
```

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `observerEyeHeight` | `Number` | `1.0` | Y-coordinate elevation of observer's eyes above ground level. |
| `localViewRadius` | `Number` | `0.1` | Infinitesimal offset radius between camera position and orbit target. |
| `defaultGlobalFov` | `Number` | `45` | Camera FOV used in global 3rd-person view. |
| `defaultLocalFov` | `Number` | `60` | Default camera FOV when entering 1st-person local view. |
| `minLocalFov` | `Number` | `1` | Minimum allowed optical FOV in degrees (1° telescopic zoom). |
| `maxLocalFov` | `Number` | `90` | Maximum allowed optical FOV in degrees (90° wide angle). |
| `baseLocalRotateSpeed` | `Number` | `-0.15` | Base rotation speed multiplier for 360° interior panoramic dragging. |
| `nearPlane` | `Number` | `0.05` | Camera near clipping plane distance. |
| `farPlane` | `Number` | `500000` | Camera far clipping plane distance. |

---

## 🛠️ API Reference

### Methods

#### `setLocalView(observerPosition?: THREE.Vector3)`
Switches to 1st-person local observer view at the specified ground coordinates (defaults to `(0, eyeHeight, 0)`). Saves the previous global view position and target for later restoration.

```javascript
localViewController.setLocalView(new THREE.Vector3(0, 1.0, 0));
```

#### `setGlobalView()`
Restores the 3rd-person global orbital view, returning the camera to its previous distance, target, and FOV.

```javascript
localViewController.setGlobalView();
```

#### `toggleView(observerPosition?: THREE.Vector3)`
Toggles between 1st-person local observer view and 3rd-person global orbit view.

```javascript
localViewController.toggleView();
```

#### `lookAt(worldTargetPosition: THREE.Vector3)`
Directs the observer's line of sight toward a specific 3D coordinate in world space.

```javascript
const starPos = new THREE.Vector3(100, 200, -300);
localViewController.lookAt(starPos);
```

#### `trackObject(threeObject: THREE.Object3D)`
Continuously tracks a moving 3D object in world space frame-by-frame. Tracking automatically pauses if the user manually drags the view.

```javascript
localViewController.trackObject(guideStarMesh);
```

#### `stopTracking()`
Stops object tracking.

```javascript
localViewController.stopTracking();
```

#### `update()`
Must be called inside your requestAnimationFrame render loop.

```javascript
localViewController.update();
```

#### `destroy()`
Unbinds event listeners and cleans up internal resources. Call this when unmounting or removing the view.

```javascript
localViewController.destroy();
```

---

## 🎯 Advanced Features & Mechanics

### Stellarium-Style Cursor Zoom
When the user scrolls the mouse wheel in Local View, `OrbitLocalViewController` calculates the 3D ray direction under the mouse cursor before and after FOV adjustment, pivoting the camera direction so that the celestial object under the mouse pointer remains stationary during zooming.

### Dynamic Mouse Sensitivity
As the user zooms in (smaller FOV), manual drag speed (`rotateSpeed`) scales down automatically:
$$\text{rotateSpeed} = \text{baseLocalRotateSpeed} \times \left(\frac{\text{camera.fov}}{90^\circ}\right)$$
This ensures fine, millimeter-accurate telescope alignment even at 1° FOV magnification.

---

## 📄 License
MIT License. Free for commercial and non-commercial use in any Three.js project.
