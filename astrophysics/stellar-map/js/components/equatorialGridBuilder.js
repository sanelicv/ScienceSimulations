import * as THREE from 'three';
import { GEOMETRY_CONFIG, CAMERA_CONFIG } from '../config.js';
import { raDecToVector3 } from './astroMath.js';
import { createTubeFromPoints, createLineFromPoints, createScreenSpaceTubeFromPoints, disposeHierarchy } from './threeHelpers.js';

/**
 * Pure factory function: Generates a THREE.Group containing all wireframe grid lines
 * (24 Right Ascension meridians and declination parallels).
 * Can be imported and used in any independent Three.js project.
 *
 * @param {Object} options Configuration parameters
 * @param {number} [options.radius=120] Sphere radius
 * @param {number} [options.widthPx] Line width in screen pixels
 * @param {number|string} [options.gridColor] Color of grid lines
 * @param {number} [options.gridOpacity] Opacity of grid lines
 * @returns {{ gridGroup: THREE.Group, gridMeshes: THREE.Mesh[] }}
 */
export function createEquatorialGridGroup(options = {}) {
  const gridGroup = new THREE.Group();
  const gridMeshes = [];

  const R = options.radius !== undefined ? options.radius : GEOMETRY_CONFIG.SPHERE_RADIUS;
  const gridColor = options.gridColor !== undefined ? options.gridColor : GEOMETRY_CONFIG.GRID_LINE_COLOR;
  const gridOpacity = options.gridOpacity !== undefined ? options.gridOpacity : GEOMETRY_CONFIG.GRID_LINE_OPACITY;
  const widthPx = options.widthPx !== undefined 
    ? options.widthPx 
    : (GEOMETRY_CONFIG.GRID_LINE_WIDTH_PX !== undefined ? GEOMETRY_CONFIG.GRID_LINE_WIDTH_PX : 1.5);

  // 1. Meridians (24 lines of constant RA)
  const nMeridians = 24;
  for (let i = 0; i < nMeridians; i++) {
    const ra = i;
    const points = [];
    for (let dec = -90; dec <= 90; dec += 4) {
      points.push(raDecToVector3(ra, dec, R));
    }
    const line = widthPx <= 0.0 
      ? new THREE.Group()
      : createScreenSpaceTubeFromPoints(points, gridColor, gridOpacity, widthPx, false);
    line.userData.originalColor = GEOMETRY_CONFIG.GRID_LINE_COLOR;
    line.userData.originalOpacity = GEOMETRY_CONFIG.GRID_LINE_OPACITY;
    gridMeshes.push(line);
    gridGroup.add(line);
  }

  // 2. Parallels (Lines of constant Dec)
  const decSteps = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
  for (const dec of decSteps) {
    const isZeroParallel = (dec === 0);
    const baseWidth = isZeroParallel ? GEOMETRY_CONFIG.PARALLEL_ZERO_WIDTH : GEOMETRY_CONFIG.PARALLEL_WIDTH;
    if (baseWidth <= 0) continue;

    const points = [];
    for (let ra = 0; ra <= 24; ra += 0.4) {
      points.push(raDecToVector3(ra, dec, R));
    }

    const color = isZeroParallel ? GEOMETRY_CONFIG.PARALLEL_ZERO_COLOR : gridColor;
    const opacity = isZeroParallel ? GEOMETRY_CONFIG.PARALLEL_ZERO_OPACITY : gridOpacity;

    const line = widthPx <= 0.0 
      ? new THREE.Group()
      : createScreenSpaceTubeFromPoints(points, color, opacity, widthPx, true);
    line.userData.originalColor = color;
    line.userData.originalOpacity = opacity;
    gridMeshes.push(line);
    gridGroup.add(line);
  }

  return { gridGroup, gridMeshes };
}

/**
 * Scene adapter class for CelestialScene orchestration.
 */
export class EquatorialGridBuilder {
  constructor(sceneInstance) {
    this.ctx = sceneInstance;
  }

  /**
   * Permanent Wireframe Grid (Meridians & Parallels)
   */
  createPermanentSphereGrid() {
    disposeHierarchy(this.ctx.sphereGridGroup, this.ctx.spriteTextureCache);
    this.ctx.gridMeshes = [];

    const isLocal = (this.ctx.cameraMode === 'camLatitude');
    const defaultFov = CAMERA_CONFIG.DEFAULT_LOCAL_FOV || 60;
    const currentFov = (isLocal && this.ctx.camera) ? this.ctx.camera.fov : defaultFov;
    const fovFactor = isLocal ? (Math.tan((currentFov * Math.PI) / 360) / Math.tan((defaultFov * Math.PI) / 360)) : 1.0;
    const widthFactor = (isLocal ? (GEOMETRY_CONFIG.LOCAL_GRID_LINE_WIDTH || 0.5) : 1.0) * fovFactor;

    const gridColor = isLocal
      ? (GEOMETRY_CONFIG.LOCAL_GRID_LINE_COLOR !== undefined ? GEOMETRY_CONFIG.LOCAL_GRID_LINE_COLOR : GEOMETRY_CONFIG.GRID_LINE_COLOR)
      : GEOMETRY_CONFIG.GRID_LINE_COLOR;
    const gridOpacity = isLocal
      ? (GEOMETRY_CONFIG.LOCAL_GRID_LINE_OPACITY !== undefined ? GEOMETRY_CONFIG.LOCAL_GRID_LINE_OPACITY : GEOMETRY_CONFIG.GRID_LINE_OPACITY)
      : GEOMETRY_CONFIG.GRID_LINE_OPACITY;

    const { gridGroup, gridMeshes } = createEquatorialGridGroup({
      radius: this.ctx.sphereRadius,
      widthFactor: widthFactor,
      gridColor: gridColor,
      gridOpacity: gridOpacity
    });

    this.ctx.gridMeshes = gridMeshes;
    while (gridGroup.children.length > 0) {
      this.ctx.sphereGridGroup.add(gridGroup.children[0]);
    }
  }

  /**
   * Dynamically rebuilds wireframe grid lines with scaled tube thickness during FOV zoom.
   */
  updateGridLineWidth() {
    if (!this.ctx.sphereGridGroup || this.ctx.cameraMode !== 'camLatitude') return;

    const currentFov = this.ctx.camera.fov;
    if (this.ctx.lastGridFov !== undefined && Math.abs(this.ctx.lastGridFov - currentFov) < 0.15) return;

    this.ctx.lastGridFov = currentFov;
    this.createPermanentSphereGrid();
    if (this.ctx.coordHelpersGroup && this.ctx.coordHelpersGroup.visible) {
      disposeHierarchy(this.ctx.coordHelpersGroup, this.ctx.spriteTextureCache);
      if (this.ctx.fixedPoleLabelsGroup) disposeHierarchy(this.ctx.fixedPoleLabelsGroup, this.ctx.spriteTextureCache);
      if (this.ctx.equatorialCoordsBuilder) {
        this.ctx.equatorialCoordsBuilder.createExplicitEquatorialCoordinates();
      }
    }
  }
}
