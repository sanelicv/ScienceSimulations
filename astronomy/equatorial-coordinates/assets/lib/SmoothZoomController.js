import * as THREE from 'three';

/**
 * SmoothZoomController - Control de zoom in/out inercial y suave para Three.js y OrbitControls.
 * 
 * Permite realizar un zoom ultra-suave mediante la rueda del ratón (mouse wheel)
 * utilizando interpolación lineal (lerp) en cada frame para evitar saltos bruscos.
 */
export class SmoothZoomController {
    /**
     * @param {THREE.PerspectiveCamera} camera - Instancia de la cámara perspectiva.
     * @param {OrbitControls} controls - Instancia de OrbitControls.
     * @param {HTMLElement} [domElement] - Elemento HTML contenedor donde se capturan los eventos (por defecto window/document).
     * @param {Object} [options] - Configuración personalizable del zoom.
     * @param {number} [options.minDistance=2] - Distancia mínima permitida.
     * @param {number} [options.maxDistance=100] - Distancia máxima permitida.
     * @param {number} [options.zoomSensitivity=0.001] - Sensibilidad del scroll de la rueda.
     * @param {number} [options.damping=0.1] - Factor de suavizado/inercia (0.01 = ultra suave, 0.3 = rápido).
     */
    constructor(camera, controls, domElement = document.body, options = {}) {
        this.camera = camera;
        this.controls = controls;
        this.domElement = domElement;

        // Parámetros de configuración
        this.minDistance = options.minDistance ?? 2;
        this.maxDistance = options.maxDistance ?? 100;
        this.zoomSensitivity = options.zoomSensitivity ?? 0.001;
        this.damping = options.damping ?? 0.1;

        // Desactivar el zoom nativo de OrbitControls para evitar interferencias
        this.controls.enableZoom = false;

        // Distancia objetivo inicial sincronizada con la cámara
        this.targetDistance = this.camera.position.distanceTo(this.controls.target);

        // Bind handler para la rueda del ratón
        this._onWheelBound = this._onWheel.bind(this);
        this.domElement.addEventListener('wheel', this._onWheelBound, { passive: false });
    }

    /**
     * Manejador del evento de rueda de ratón (wheel).
     * @private
     */
    _onWheel(event) {
        event.preventDefault();

        const amount = event.deltaY;
        if (amount < 0) {
            // Rueda hacia arriba -> Acercar (Zoom In)
            this.targetDistance *= (1 - this.zoomSensitivity * 100);
        } else {
            // Rueda hacia abajo -> Alejar (Zoom Out)
            this.targetDistance *= (1 + this.zoomSensitivity * 100);
        }

        // Restringir entre los límites definidos
        this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    }

    /**
     * Actualiza la posición de la cámara aplicando interpolación lineal (`lerp`).
     * DEBE LLAMARSE EN EL BUCLE DE ANIMACIÓN (requestAnimationFrame) ANTES DE `controls.update()`.
     */
    update() {
        // Calcular el vector dirección desde el target hacia la cámara
        const offset = new THREE.Vector3().copy(this.camera.position).sub(this.controls.target);
        const currentDist = offset.length();

        // Si la distancia actual difiere de la objetivo, interpolar suavemente
        if (Math.abs(currentDist - this.targetDistance) > 0.001) {
            const newDist = THREE.MathUtils.lerp(currentDist, this.targetDistance, this.damping);
            offset.normalize().multiplyScalar(newDist);
            this.camera.position.copy(this.controls.target).add(offset);
        }
    }

    /**
     * Realiza un Zoom In programático.
     * @param {number} [factor=0.25] - Fracción de acercamiento (ej: 0.25 = 25% más cerca).
     */
    zoomIn(factor = 0.25) {
        this.setTargetDistance(this.targetDistance * (1 - factor));
    }

    /**
     * Realiza un Zoom Out programático.
     * @param {number} [factor=0.25] - Fracción de alejamiento (ej: 0.25 = 25% más lejos).
     */
    zoomOut(factor = 0.25) {
        this.setTargetDistance(this.targetDistance * (1 + factor));
    }

    /**
     * Define directamente la distancia objetivo del zoom.
     * @param {number} distance - Nueva distancia en unidades de escena Three.js.
     */
    setTargetDistance(distance) {
        this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
    }

    /**
     * Ajusta dinámicamente el nivel de suavizado/inercia.
     * @param {number} dampingFactor - Valor entre 0.01 (súper fluido) y 1.0 (inmediato).
     */
    setDamping(dampingFactor) {
        this.damping = Math.max(0.001, Math.min(1.0, dampingFactor));
    }

    /**
     * Destruye la instancia y restaura los listeners.
     */
    destroy() {
        this.domElement.removeEventListener('wheel', this._onWheelBound);
        this.controls.enableZoom = true;
    }
}
