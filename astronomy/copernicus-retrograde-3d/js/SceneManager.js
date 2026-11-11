import * as THREE from 'three';
import { ThreeSceneController } from '../components/ThreeScene/ThreeSceneController.js';

/**
 * SceneManager (Adaptador específico para el Modelo Copernicano 3D)
 * Herencia de la clase base reutilizable ThreeSceneController.
 * Añade comportamientos astronómicos específicos como transiciones de cámara
 * en modo seguimiento y control de zoom suave personalizado.
 */
export class SceneManager extends ThreeSceneController {
    constructor(containerId) {
        const initialBgColor = (window.CONFIG && window.CONFIG.SCENE_BACKGROUND_COLOR)
            ? window.CONFIG.SCENE_BACKGROUND_COLOR : 0x0a0e17;
        const initialAmbient = (window.CONFIG && window.CONFIG.AMBIENT_LIGHT_INTENSITY !== undefined)
            ? window.CONFIG.AMBIENT_LIGHT_INTENSITY : 0.0;

        const radius = (window.CONFIG && window.CONFIG.CAMERA_RADIUS !== undefined) ? window.CONFIG.CAMERA_RADIUS : 4000;
        const azimuth = (window.CONFIG && window.CONFIG.CAMERA_AZIMUTH_ANGLE !== undefined) ? window.CONFIG.CAMERA_AZIMUTH_ANGLE : 180;
        const elevation = (window.CONFIG && window.CONFIG.CAMERA_ELEVATION_ANGLE !== undefined) ? window.CONFIG.CAMERA_ELEVATION_ANGLE : 30;

        const theta = azimuth * (Math.PI / 180);
        const phi = elevation * (Math.PI / 180);

        super({
            container: document.getElementById(containerId) || containerId,
            backgroundColor: initialBgColor,
            fov: 45,
            near: 0.1,
            far: 200000,
            cameraPos: {
                x: radius * Math.cos(phi) * Math.sin(theta),
                y: radius * Math.sin(phi),
                z: radius * Math.cos(phi) * Math.cos(theta)
            },
            ambientLightIntensity: initialAmbient,
            enableControls: true,
            enableDamping: true,
            dampingFactor: 0.1
        });

        if (this.controls) {
            this.controls.enableZoom = false; // Desactivar zoom nativo para usar zoom suave personalizado
            this.controls.enablePan = false;
        }

        // Estado de Zoom Suave Personalizado
        this.targetDistance = this.camera.position.length();
        this.minDistance = (window.CONFIG && window.CONFIG.MIN_ZOOM_DISTANCE !== undefined) ? window.CONFIG.MIN_ZOOM_DISTANCE : 1000;
        this.maxDistance = (window.CONFIG && window.CONFIG.MAX_ZOOM_DISTANCE !== undefined) ? window.CONFIG.MAX_ZOOM_DISTANCE : 50000;
        this.zoomSensitivity = 0.001;
        this.zoomDamping = 0.1;

        // Modos de Cámara y Escala
        this.cameraMode = 'SUN';
        this.isRealisticMode = false;
        this.lastEarthPos = null;

        // Estado FOV Personalizado para Modo Seguimiento
        this.defaultFOV = (window.CONFIG && window.CONFIG.DEFAULT_FOV !== undefined) ? window.CONFIG.DEFAULT_FOV : 45;
        this.minFOV = (window.CONFIG && window.CONFIG.MIN_FOV !== undefined) ? window.CONFIG.MIN_FOV : 5;
        this.maxFOV = (window.CONFIG && window.CONFIG.MAX_FOV !== undefined) ? window.CONFIG.MAX_FOV : 110;
        this.targetFOV = this.defaultFOV;
        this.fovDamping = 0.1;

        // Estado de Transiciones de Cámara
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

        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });
        }
    }

    onMouseWheel(event) {
        event.preventDefault();
        const amount = event.deltaY;

        if (this.isFollowing || (this.transition && this.transition.active && this.transition.type === 'TO_FOLLOW')) {
            // Zoom por FOV telescópico en Modo Seguimiento
            if (amount < 0) {
                this.targetFOV *= 0.92;
            } else {
                this.targetFOV *= 1.08;
            }
            this.targetFOV = Math.max(this.minFOV, Math.min(this.maxFOV, this.targetFOV));
        } else {
            // Zoom por distancia radial en Modo Libre
            if (amount < 0) {
                this.targetDistance *= (1 - this.zoomSensitivity * 100);
            } else {
                this.targetDistance *= (1 + this.zoomSensitivity * 100);
            }
            this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
        }
    }

    update() {
        // Interpolación Suave de FOV
        if (Math.abs(this.camera.fov - this.targetFOV) > 0.01) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, this.fovDamping);
            this.camera.updateProjectionMatrix();
        }

        // Mantener vector Up vertical al seguir un astro
        if (this.isFollowing || (this.transition && this.transition.active && this.transition.type === 'TO_FOLLOW')) {
            this.camera.up.set(0, 1, 0);
        }

        // Lógica de Transiciones de Cámara
        if (this.transition && this.transition.active) {
            const now = performance.now();
            const elapsed = now - this.transition.startTime;
            const t = Math.min(elapsed / this.transition.duration, 1);
            const alpha = t * t * (3 - 2 * t); // Interpolación Smoothstep

            if (this.transition.type === 'TO_FOLLOW') {
                const targetPos = this.followCameraPos || new THREE.Vector3(0, 0, 0);
                this.camera.position.lerpVectors(this.transition.startPos, targetPos, alpha);

                if (this.followTargetPos) {
                    const currentLookAt = new THREE.Vector3().lerpVectors(this.transition.startTarget, this.followTargetPos, alpha);
                    this.camera.up.set(0, 1, 0);
                    this.camera.lookAt(currentLookAt);
                    this.controls.target.copy(currentLookAt);
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
                    this.targetDistance = this.camera.position.distanceTo(this.controls.target);
                }
            }
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // Actualización de Zoom Personalizado
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
            if (this.followCameraPos) {
                this.camera.position.copy(this.followCameraPos);
            } else {
                this.camera.position.set(0, 0, 0);
            }

            if (this.followTargetPos) {
                this.camera.up.set(0, 1, 0);
                this.camera.lookAt(this.followTargetPos);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    setFollowMode(active) {
        if (this.isFollowing === active && !this.transition.active) return;

        this.transition.active = true;
        this.transition.startTime = performance.now();
        this.transition.startPos.copy(this.camera.position);

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
            this.transition.type = 'TO_FOLLOW';
            this.isFollowing = false;
            this.controls.enabled = false;

            this.savedState.position.copy(this.camera.position);
            this.savedState.target.copy(this.controls.target);

        } else {
            this.transition.type = 'TO_FREE';
            this.isFollowing = false;
            this.controls.enabled = false;
            this.targetFOV = this.defaultFOV;

            if (this.savedState.position.lengthSq() === 0) {
                const radius = (window.CONFIG && window.CONFIG.CAMERA_RADIUS !== undefined) ? window.CONFIG.CAMERA_RADIUS : 4000;
                const azimuth = (window.CONFIG && window.CONFIG.CAMERA_AZIMUTH_ANGLE !== undefined) ? window.CONFIG.CAMERA_AZIMUTH_ANGLE : 180;
                const elevation = (window.CONFIG && window.CONFIG.CAMERA_ELEVATION_ANGLE !== undefined) ? window.CONFIG.CAMERA_ELEVATION_ANGLE : 30;
                const theta = azimuth * (Math.PI / 180);
                const phi = elevation * (Math.PI / 180);

                this.transition.endPos.set(
                    radius * Math.cos(phi) * Math.sin(theta),
                    radius * Math.sin(phi),
                    radius * Math.cos(phi) * Math.cos(theta)
                );
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

    updateCameraPosition(pos) {
        this.followCameraPos = pos;
    }

    updateTheme(isLight) {
        if (isLight) {
            this.scene.background = new THREE.Color(0xffffff);
        } else {
            const darkBgColor = (window.CONFIG && window.CONFIG.SCENE_BACKGROUND_COLOR) ? window.CONFIG.SCENE_BACKGROUND_COLOR : 0x0a0e17;
            this.scene.background = new THREE.Color(darkBgColor);
        }
    }

    setAmbientLightIntensity(intensity) {
        super.setAmbientLightIntensity(intensity);
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

    setInitialCameraPosition(radius, azimuth, elevation) {
        if (radius !== undefined) {
            if (window.CONFIG) window.CONFIG.CAMERA_RADIUS = radius;
            window.CAMERA_RADIUS = radius;
        }
        if (azimuth !== undefined) {
            if (window.CONFIG) window.CONFIG.CAMERA_AZIMUTH_ANGLE = azimuth;
            window.CAMERA_AZIMUTH_ANGLE = azimuth;
            window.CAMERA_AZIMUTH = azimuth;
            window.CAMERA_THETA = azimuth;
        }
        if (elevation !== undefined) {
            if (window.CONFIG) window.CONFIG.CAMERA_ELEVATION_ANGLE = elevation;
            window.CAMERA_ELEVATION_ANGLE = elevation;
            window.CAMERA_ELEVATION = elevation;
            window.CAMERA_PHI = elevation;
        }

        const r = (window.CONFIG && window.CONFIG.CAMERA_RADIUS !== undefined) ? window.CONFIG.CAMERA_RADIUS : 4000;
        const az = (window.CONFIG && window.CONFIG.CAMERA_AZIMUTH_ANGLE !== undefined) ? window.CONFIG.CAMERA_AZIMUTH_ANGLE : 180;
        const el = (window.CONFIG && window.CONFIG.CAMERA_ELEVATION_ANGLE !== undefined) ? window.CONFIG.CAMERA_ELEVATION_ANGLE : 30;

        const theta = az * (Math.PI / 180);
        const phi = el * (Math.PI / 180);

        this.camera.position.set(
            r * Math.cos(phi) * Math.sin(theta),
            r * Math.sin(phi),
            r * Math.cos(phi) * Math.cos(theta)
        );
        if (this.controls) {
            this.controls.update();
        }
        this.targetDistance = this.camera.position.length();
    }

    setCameraMode(mode, targetWorldPos) {
        this.cameraMode = mode;

        if (this.isRealisticMode) {
            this.minDistance = (window.CONFIG && window.CONFIG.REALISTIC_MIN_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.REALISTIC_MIN_ZOOM_DISTANCE : 4;
            this.maxDistance = (window.CONFIG && window.CONFIG.REALISTIC_MAX_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.REALISTIC_MAX_ZOOM_DISTANCE : 50000;
        } else {
            this.minDistance = (window.CONFIG && window.CONFIG.MIN_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.MIN_ZOOM_DISTANCE : 1000;
            this.maxDistance = (window.CONFIG && window.CONFIG.MAX_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.MAX_ZOOM_DISTANCE : 50000;
        }

        const centerPos = targetWorldPos ? targetWorldPos.clone() : new THREE.Vector3(0, 0, 0);

        if (mode === 'EARTH') {
            const targetDist = this.isRealisticMode ? 50 : 200;
            let offset = this.camera.position.clone().sub(centerPos);
            if (offset.lengthSq() < 0.001 || isNaN(offset.x)) {
                offset.set(0, targetDist * 0.4, targetDist);
            }
            offset.normalize().multiplyScalar(targetDist);
            const targetCameraPos = centerPos.clone().add(offset);

            this.controls.target.copy(centerPos);
            this.camera.position.copy(targetCameraPos);
            this.targetDistance = targetDist;

            if (this.transition && this.transition.active && this.transition.type === 'TO_FREE') {
                this.transition.endTarget.copy(centerPos);
                this.transition.endPos.copy(targetCameraPos);
            }
        } else if (mode === 'SUN') {
            const sunPos = new THREE.Vector3(0, 0, 0);
            const targetDist = Math.max(this.minDistance, Math.min(this.maxDistance, this.camera.position.distanceTo(sunPos)));
            let offset = this.camera.position.clone().sub(sunPos);
            if (offset.lengthSq() < 0.001 || isNaN(offset.x)) {
                offset.set(0, targetDist * 0.4, targetDist);
            }
            offset.normalize().multiplyScalar(targetDist);
            const targetCameraPos = sunPos.clone().add(offset);

            this.controls.target.copy(sunPos);
            this.camera.position.copy(targetCameraPos);
            this.targetDistance = targetDist;

            if (this.transition && this.transition.active && this.transition.type === 'TO_FREE') {
                this.transition.endTarget.copy(sunPos);
                this.transition.endPos.copy(targetCameraPos);
            }
        }

        if (this.controls) {
            this.controls.update();
        }
    }

    updateEarthPosition(currentEarthPos) {
        if (!currentEarthPos) return;

        if (this.lastEarthPos) {
            const delta = new THREE.Vector3().copy(currentEarthPos).sub(this.lastEarthPos);

            if (this.cameraMode === 'EARTH') {
                if (this.transition && this.transition.active) {
                    this.transition.startTarget.add(delta);
                    this.transition.startPos.add(delta);
                    this.transition.endTarget.add(delta);
                    this.transition.endPos.add(delta);
                } else if (!this.isFollowing) {
                    this.camera.position.add(delta);
                    this.controls.target.add(delta);
                }
            }
        }
        this.lastEarthPos = currentEarthPos.clone();
    }

    setRealisticMode(isRealistic) {
        this.isRealisticMode = isRealistic;
        if (isRealistic) {
            this.minDistance = (window.CONFIG && window.CONFIG.REALISTIC_MIN_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.REALISTIC_MIN_ZOOM_DISTANCE : 4;
            this.maxDistance = (window.CONFIG && window.CONFIG.REALISTIC_MAX_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.REALISTIC_MAX_ZOOM_DISTANCE : 50000;
            this.minFOV = 0.05;
        } else {
            this.minDistance = (window.CONFIG && window.CONFIG.MIN_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.MIN_ZOOM_DISTANCE : 1000;
            this.maxDistance = (window.CONFIG && window.CONFIG.MAX_ZOOM_DISTANCE !== undefined)
                ? window.CONFIG.MAX_ZOOM_DISTANCE : 50000;
            this.minFOV = (window.CONFIG && window.CONFIG.MIN_FOV !== undefined) ? window.CONFIG.MIN_FOV : 5;
        }
        this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
        this.targetFOV = Math.max(this.minFOV, Math.min(this.maxFOV, this.targetFOV));
    }
}
