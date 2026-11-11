import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a); // Dark grey like p5 sketch

        // Camera
        // Matching p5.js initial camera angles approx
        // camTheta = 65 deg, camPhi = 45 deg
        const fov = 45;
        this.camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 0.1, 10000);

        // Position logic for Z-Up
        // Let's place it diagonally from the top so we see the XYZ axes nicely
        const R = 1500;
        this.camera.position.set(R * 0.7, R * 0.7, R * 0.5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enableZoom = false; // Disable native zoom
        this.controls.enablePan = false;

        // Custom Smooth Zoom State
        this.targetDistance = this.camera.position.length();
        this.minDistance = 100;
        this.maxDistance = 2000;
        this.zoomSensitivity = 0.001;
        this.zoomDamping = 0.1;

        // Local View State
        this.isLocalView = false;
        this.defaultCameraFov = fov;
        this.defaultRotateSpeed = this.controls.rotateSpeed;
        this.savedCameraPosition = new THREE.Vector3();
        this.savedControlsTarget = new THREE.Vector3();

        this.renderer.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Resize Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onMouseWheel(event) {
        event.preventDefault();

        if (this.isLocalView) {
            // FOV-based zoom for local view mode (simulates telescope zoom)
            let newFov = this.camera.fov + event.deltaY * 0.05;
            newFov = Math.max(1, Math.min(90, newFov));

            this.camera.fov = newFov;
            this.camera.updateProjectionMatrix();

            // Adjust sensitivity: higher zoom = slower rotation mapping
            this.controls.rotateSpeed = -0.15 * (this.camera.fov / 90);
        } else {
            // Distance-based zoom for free view mode
            const amount = event.deltaY;
            if (amount < 0) {
                this.targetDistance *= (1 - this.zoomSensitivity * 100);
            } else {
                this.targetDistance *= (1 + this.zoomSensitivity * 100);
            }
            this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
        }
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    update() {
        if (!this.isLocalView) {
            // Custom Zoom Update (Distance Lerp)
            const offset = new THREE.Vector3().copy(this.camera.position).sub(this.controls.target);
            const currentDist = offset.length();

            if (Math.abs(currentDist - this.targetDistance) > 0.1) {
                const newDist = THREE.MathUtils.lerp(currentDist, this.targetDistance, this.zoomDamping);
                offset.normalize().multiplyScalar(newDist);
                this.camera.position.copy(this.controls.target).add(offset);
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    add(object) {
        this.scene.add(object);
    }

    setLocalView(isActive) {
        this.isLocalView = isActive;

        if (isActive) {
            // Save state
            this.savedCameraPosition.copy(this.camera.position);
            this.savedControlsTarget.copy(this.controls.target);

            // Configure Local View Camera
            // We want the camera to be virtually at (0, 0, 100).
            // OrbitControls works by rotating the camera around the `target`.
            // To make a "fixed" camera that looks around, the `target` must be the fixed position.
            this.controls.target.set(0, 0, 10);

            // To look towards East (-X), the camera is placed slightly in the +X direction from the target.
            this.camera.position.set(0.1, 0, 10);

            this.camera.fov = 60; // Wide field of view
            this.camera.updateProjectionMatrix();

            this.controls.rotateSpeed = -0.15; // Invert drag for celestial globe illusion

        } else {
            // Restore Free View Camera
            this.camera.position.copy(this.savedCameraPosition);
            this.controls.target.copy(this.savedControlsTarget);

            this.camera.fov = this.defaultCameraFov;
            this.camera.updateProjectionMatrix();

            this.controls.rotateSpeed = this.defaultRotateSpeed;
            // Ensure target distance stays synced
            this.targetDistance = this.camera.position.distanceTo(this.controls.target);
        }
        this.controls.update();
    }

    updateTheme(isLight) {
        if (isLight) {
            this.scene.background = new THREE.Color(0xffffff); // Pure white
        } else {
            this.scene.background = new THREE.Color(0x1a1a1a); // Dark background
        }
    }

    remove(object) {
        this.scene.remove(object);
    }
}
