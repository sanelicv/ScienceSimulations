import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

export class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || (window.innerHeight - 48);

        // Scene
        const initialBg = (window.CONFIG && window.CONFIG.SCENE_BACKGROUND_COLOR !== undefined)
            ? window.CONFIG.SCENE_BACKGROUND_COLOR
            : '#1a1a1a';
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(initialBg);

        // Camera
        // Matching p5.js initial camera angles approx
        // camTheta = 65 deg, camPhi = 45 deg
        const fov = 45;
        this.camera = new THREE.PerspectiveCamera(fov, this.width / this.height, 0.1, 200000);

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
        this.minDistance = (window.CONFIG && window.CONFIG.MIN_ZOOM_DISTANCE !== undefined) ? window.CONFIG.MIN_ZOOM_DISTANCE : 100;
        this.maxDistance = (window.CONFIG && window.CONFIG.MAX_ZOOM_DISTANCE !== undefined) ? window.CONFIG.MAX_ZOOM_DISTANCE : 4000;
        this.zoomSensitivity = 0.001;
        this.zoomDamping = 0.1;

        // Custom Smooth FOV Telescopic Zoom State (Follow Mode)
        this.defaultFOV = (window.CONFIG && window.CONFIG.DEFAULT_FOV !== undefined) ? window.CONFIG.DEFAULT_FOV : 45;
        this.minFOV = (window.CONFIG && window.CONFIG.MIN_FOV !== undefined) ? window.CONFIG.MIN_FOV : 5;
        this.maxFOV = (window.CONFIG && window.CONFIG.MAX_FOV !== undefined) ? window.CONFIG.MAX_FOV : 75;
        this.targetFOV = this.defaultFOV;
        this.fovDamping = 0.1;

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
        const initialAmbient = (window.CONFIG && window.CONFIG.AMBIENT_LIGHT_INTENSITY !== undefined)
            ? window.CONFIG.AMBIENT_LIGHT_INTENSITY
            : 0.25;
        this.ambientLight = new THREE.AmbientLight(0xffffff, initialAmbient);
        this.scene.add(this.ambientLight);

        // Earth
        const earthRadius = (window.CONFIG && window.CONFIG.EARTH_RADIUS !== undefined) ? window.CONFIG.EARTH_RADIUS : 10;
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('assets/textures/earthmap_1k.jpg', (texture) => {
            const geometry = new THREE.SphereGeometry(earthRadius, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.8,
                metalness: 0.1
            });
            this.earth = new THREE.Mesh(geometry, material);
            this.scene.add(this.earth);
        });

        // Resize Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setAmbientLightIntensity(intensity) {
        if (this.ambientLight) {
            this.ambientLight.intensity = intensity;
        }
        if (window.CONFIG) window.CONFIG.AMBIENT_LIGHT_INTENSITY = intensity;
        window.AMBIENT_LIGHT_INTENSITY = intensity;
    }

    setEarthRadius(radius) {
        if (this.earth) {
            this.earth.geometry.dispose();
            this.earth.geometry = new THREE.SphereGeometry(radius, 32, 32);
        }
    }

    setMaxZoomDistance(dist) {
        this.maxDistance = dist;
        if (window.CONFIG) window.CONFIG.MAX_ZOOM_DISTANCE = dist;
        window.MAX_ZOOM_DISTANCE = dist;
    }

    setMinZoomDistance(dist) {
        this.minDistance = dist;
        if (window.CONFIG) window.CONFIG.MIN_ZOOM_DISTANCE = dist;
        window.MIN_ZOOM_DISTANCE = dist;
    }

    onMouseWheel(event) {
        event.preventDefault();
        const amount = event.deltaY;

        if (this.isFollowing || (this.transition && this.transition.active && this.transition.type === 'TO_FOLLOW')) {
            // === MODO SEGUIMIENTO: ZOOM ÓPTICO / TELESCÓPICO POR FOV ===
            if (amount < 0) {
                // Rueda hacia arriba: reducir FOV (Zoom in telescópico)
                this.targetFOV *= 0.92;
            } else {
                // Rueda hacia abajo: aumentar FOV (Zoom out gran angular)
                this.targetFOV *= 1.08;
            }
            // Restringir dentro de los límites [MIN_FOV, MAX_FOV]
            this.targetFOV = Math.max(this.minFOV, Math.min(this.maxFOV, this.targetFOV));
        } else {
            // === MODO LIBRE: ZOOM POR DISTANCIA 3D ===
            if (amount < 0) {
                this.targetDistance *= (1 - this.zoomSensitivity * 100);
            } else {
                this.targetDistance *= (1 + this.zoomSensitivity * 100);
            }
            this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
        }
    }

    onWindowResize() {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || (window.innerHeight - 48);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    update() {
        // Interpolación suave de FOV (Campo de visión)
        if (Math.abs(this.camera.fov - this.targetFOV) > 0.01) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, this.fovDamping);
            this.camera.updateProjectionMatrix();
        }

        if (this.isFollowing || (this.transition && this.transition.active && this.transition.type === 'TO_FOLLOW')) {
            this.camera.up.set(0, 1, 0);
        }

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

            // Resetear FOV al valor estándar
            this.targetFOV = this.defaultFOV;

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
            const bg = (window.CONFIG && window.CONFIG.SCENE_BACKGROUND_COLOR !== undefined)
                ? window.CONFIG.SCENE_BACKGROUND_COLOR
                : '#1a1a1a';
            this.scene.background = new THREE.Color(bg); // Dark background
        }
    }

    remove(object) {
        this.scene.remove(object);
    }
}
