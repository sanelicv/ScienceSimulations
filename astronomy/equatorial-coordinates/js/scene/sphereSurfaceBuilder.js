import * as THREE from 'three';
import { GEOMETRY_CONFIG } from '../config.js';

/**
 * Pure factory function: Creates and returns a THREE.Mesh representing the translucent celestial sphere.
 * Can be imported and used in any independent Three.js project.
 *
 * @param {Object} options Configuration parameters
 * @param {number} [options.radius=120] Sphere radius
 * @param {number|string} [options.color=0x1e293b] Material color
 * @param {number} [options.opacity=0.4] Surface opacity
 * @param {number} [options.roughness=0.9] Material roughness
 * @returns {{ sphereMesh: THREE.Mesh, sphereMat: THREE.MeshStandardMaterial }}
 */
export function createCelestialSphereSurfaceMesh(options = {}) {
  const radius = options.radius !== undefined ? options.radius : GEOMETRY_CONFIG.SPHERE_RADIUS;
  const color = options.color !== undefined ? options.color : GEOMETRY_CONFIG.SPHERE_COLOR;
  const opacity = options.opacity !== undefined ? options.opacity : GEOMETRY_CONFIG.SPHERE_OPACITY;
  const roughness = options.roughness !== undefined ? options.roughness : 0.9;

  const sphereGeom = new THREE.SphereGeometry(radius, 48, 48);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide,
    roughness: roughness,
    depthWrite: false
  });

  const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
  return { sphereMesh, sphereMat };
}

/**
 * Scene adapter class for CelestialScene orchestration.
 */
export class SphereSurfaceBuilder {
  constructor(sceneInstance) {
    this.ctx = sceneInstance;
  }

  /**
   * Builds the celestial sphere mesh and adds it to the scene's sphereShellGroup.
   */
  createPermanentCelestialSphere() {
    const { sphereMesh, sphereMat } = createCelestialSphereSurfaceMesh({
      radius: this.ctx.sphereRadius,
      color: GEOMETRY_CONFIG.SPHERE_COLOR,
      opacity: GEOMETRY_CONFIG.SPHERE_OPACITY
    });
    this.ctx.sphereMat = sphereMat;
    this.ctx.sphereShellGroup.add(sphereMesh);
  }
}
