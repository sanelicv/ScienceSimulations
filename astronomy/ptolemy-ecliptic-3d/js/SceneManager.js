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
        this.camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 0.1, 15000);

        // Position logic from p5 (approximate)
        // R * sin(theta) * cos(phi) ...
        const R = 100;
        const theta = 65 * (Math.PI / 180);
        const phi = -45 * (Math.PI / 180); // p5 used -phi

        this.camera.position.set(
            R * Math.sin(theta) * Math.cos(phi),
            R * Math.cos(theta),
            R * Math.sin(theta) * Math.sin(phi)
        );

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
        this.maxDistance = 9000;
        this.zoomSensitivity = 0.001;
        this.zoomDamping = 0.1;

        // Transition State
        this.transition = {
            active: false,
            startTime: 0,
            duration: 2000,
            startPos: new THREE.Vector3(),
            startTarget: new THREE.Vector3(),
            endPos: new THREE.Vector3(),
            endTarget: new THREE.Vector3(),
            type: 'NONE'
        };
        this.savedState = {
            position: new THREE.Vector3(),
            target: new THREE.Vector3()
        };

        this.renderer.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        // Earth
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('assets/textures/earthmap_1k.jpg', (texture) => {
            const geometry = new THREE.SphereGeometry(10, 32, 32); // Diameter 40
            const material = new THREE.MeshStandardMaterial({ map: texture });
            const earth = new THREE.Mesh(geometry, material);
            this.scene.add(earth);
        });

        // Resize Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onMouseWheel(event) {
        event.preventDefault();
        const amount = event.deltaY;
        if (amount < 0) {
            this.targetDistance *= (1 - this.zoomSensitivity * 100);
        } else {
            this.targetDistance *= (1 + this.zoomSensitivity * 100);
        }
        this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    update() {
        // Transition Logic
        if (this.transition && this.transition.active) {
            const now = performance.now();
            const elapsed = now - this.transition.startTime;
            const t = Math.min(elapsed / this.transition.duration, 1);
            const alpha = t * t * (3 - 2 * t); // Smoothstep

            if (this.transition.type === 'TO_FOLLOW') {
                this.camera.position.lerpVectors(this.transition.startPos, new THREE.Vector3(0, 0, 0), alpha);
                if (this.followTargetPos) {
                    const currentTarget = new THREE.Vector3().lerpVectors(this.transition.startTarget, this.followTargetPos, alpha);
                    this.camera.lookAt(currentTarget);
                    this.controls.target.copy(currentTarget);
                }
            } else if (this.transition.type === 'TO_FREE') {
                this.camera.position.lerpVectors(this.transition.startPos, this.transition.endPos, alpha);
                const currentTarget = new THREE.Vector3().lerpVectors(this.transition.startTarget, this.transition.endTarget, alpha);
                this.camera.lookAt(currentTarget);
                this.controls.target.copy(currentTarget);
            }

            if (t >= 1) {
                this.transition.active = false;
                if (this.transition.type === 'TO_FOLLOW') {
                    this.isFollowing = true;
                } else {
                    this.controls.enabled = true;
                    // Sync zoom state
                    this.targetDistance = this.camera.position.distanceTo(this.controls.target);
                }
            }
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // Custom Zoom Update
        if (!this.isFollowing) {
            const offset = new THREE.Vector3().copy(this.camera.position).sub(this.controls.target);
            const currentDist = offset.length();

            if (Math.abs(currentDist - this.targetDistance) > 0.1) {
                const newDist = THREE.MathUtils.lerp(currentDist, this.targetDistance, this.zoomDamping);
                offset.normalize().multiplyScalar(newDist);
                this.camera.position.copy(this.controls.target).add(offset);
            }
            this.controls.update();
        } else {
            // Follow Mode: Camera at Center, looking at target
            this.camera.position.set(0, 0, 0); // Center
            if (this.followTargetPos) {
                this.camera.lookAt(this.followTargetPos);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    setFollowMode(active) {
        if (this.isFollowing === active && !this.transition.active) return;

        // Start Transition
        this.transition.active = true;
        this.transition.startTime = performance.now();
        this.transition.startPos.copy(this.camera.position);
        // Determine start target based on context
        if (active) {
            this.transition.startTarget.copy(this.controls.target);
        } else {
            if (this.followTargetPos) {
                this.transition.startTarget.copy(this.followTargetPos);
            } else {
                this.transition.startTarget.copy(this.controls.target);
            }
        }

        if (active) {
            // TO_FOLLOW
            this.transition.type = 'TO_FOLLOW';
            this.isFollowing = false; // logic handled by transition, set true at end
            this.controls.enabled = false;

            // Save current state
            this.savedState.position.copy(this.camera.position);
            this.savedState.target.copy(this.controls.target);

        } else {
            // TO_FREE
            this.transition.type = 'TO_FREE';
            this.isFollowing = false;
            this.controls.enabled = false;

            // Set end goal to saved state
            // If we never saved (e.g. started in follow mode?), fallback to default
            if (this.savedState.position.lengthSq() === 0) {
                this.transition.endPos.set(0, 1500, 2598);
                this.transition.endTarget.set(0, 0, 0);
            } else {
                this.transition.endPos.copy(this.savedState.position);
                this.transition.endTarget.copy(this.savedState.target);
            }
        }
    }

    updateFollowTarget(pos) {
        this.followTargetPos = pos;
    }

    add(object) {
        this.scene.add(object);
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
