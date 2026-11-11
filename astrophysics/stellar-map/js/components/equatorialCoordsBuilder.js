import * as THREE from 'three';
import { GEOMETRY_CONFIG, CAMERA_CONFIG, OBLIQUITY_RAD } from '../config.js';
import { raDecToVector3 } from './astroMath.js';
import { createTubeFromPoints, createTubeSegment, createLineFromPoints, createLineSegment, createTextSprite, createScreenSpaceTubeFromPoints, disposeHierarchy } from './threeHelpers.js';

/**
 * Pure factory function: Creates bold Equator ring, 0h Meridian, hour labels (0h..23h), and declination ticks.
 *
 * @param {Object} options Configuration parameters
 * @param {number} [options.radius=120] Sphere radius
 * @param {number} [options.widthFactor=1.0] Width factor for local zoom
 * @param {Map} [options.textureCache] Sprite texture cache
 * @returns {{ coordsGroup: THREE.Group, poleLabelsGroup: THREE.Group, raLabelSprites: THREE.Sprite[] }}
 */
export function createEquatorialCoordsGroup(options = {}) {
  const coordsGroup = new THREE.Group();
  const poleLabelsGroup = new THREE.Group();
  const raLabelSprites = [];

  const R = options.radius !== undefined ? options.radius : GEOMETRY_CONFIG.SPHERE_RADIUS;
  const widthFactor = options.widthFactor !== undefined ? options.widthFactor : 1.0;
  const textureCache = options.textureCache;
  const coordsOpacity = options.coordsOpacity !== undefined 
    ? options.coordsOpacity 
    : (GEOMETRY_CONFIG.EQUATORIAL_COORDS_OPACITY !== undefined ? GEOMETRY_CONFIG.EQUATORIAL_COORDS_OPACITY : 0.5);
  const labelsOpacity = options.labelsOpacity !== undefined 
    ? options.labelsOpacity 
    : (GEOMETRY_CONFIG.EQUATORIAL_LABELS_OPACITY !== undefined ? GEOMETRY_CONFIG.EQUATORIAL_LABELS_OPACITY : 0.9);

  // 1. Bold Equator Ring
  const equatorWidth = GEOMETRY_CONFIG.EQUATOR_LINE_WIDTH * widthFactor;
  if (equatorWidth > 0) {
    const equatorPoints = [];
    for (let ra = 0; ra <= 24; ra += 0.4) {
      equatorPoints.push(raDecToVector3(ra, 0, R));
    }
    const equatorRing = createTubeFromPoints(
      equatorPoints,
      equatorWidth,
      GEOMETRY_CONFIG.EQUATOR_LINE_COLOR,
      coordsOpacity,
      true
    );
    coordsGroup.add(equatorRing);
  }

  // 2. Bold 0h Meridian Arc
  const meridianWidth = GEOMETRY_CONFIG.MERIDIAN_MAJOR_WIDTH * widthFactor;
  if (meridianWidth > 0) {
    const zeroMeridianPoints = [];
    for (let dec = -90; dec <= 90; dec += 2) {
      zeroMeridianPoints.push(raDecToVector3(0, dec, R));
    }
    const zeroMeridianRing = createTubeFromPoints(
      zeroMeridianPoints,
      meridianWidth,
      GEOMETRY_CONFIG.MERIDIAN_MAJOR_COLOR,
      coordsOpacity,
      false
    );
    coordsGroup.add(zeroMeridianRing);
  }

  // 3. Hour / Degree Labels (0h..23h or 0°..345°) and tick marks
  const raMode = options.raMode || 'hours';
  const labelScaleFactor = options.labelScaleFactor !== undefined ? options.labelScaleFactor : 0.04;
  const labelFontSize = options.labelFontSize !== undefined ? options.labelFontSize : GEOMETRY_CONFIG.RA_LABEL_FONT_SIZE;
  const labelColor = options.labelColor || GEOMETRY_CONFIG.RA_LABEL_COLOR;
  const tickWidthPx = options.tickWidthPx !== undefined ? options.tickWidthPx : GEOMETRY_CONFIG.HOUR_TICK_WIDTH_PX;
  const tickWidth = options.tickWidth !== undefined ? options.tickWidth : GEOMETRY_CONFIG.HOUR_TICK_WIDTH;
  const tickColor = options.tickColor || GEOMETRY_CONFIG.HOUR_TICK_COLOR;

  const labelScale = R * labelScaleFactor * widthFactor;

  for (let i = 0; i < 24; i++) {
    const pos = raDecToVector3(i, 0, R * 1.07);
    const labelText = raMode === 'degrees' ? `${i * 15}°` : `${i}h`;
    const sprite = createTextSprite(
      labelText,
      labelColor,
      labelFontSize,
      labelScale,
      GEOMETRY_CONFIG.LABEL_FONT_WEIGHT,
      textureCache
    );
    if (sprite.material) sprite.material.opacity = labelsOpacity;
    sprite.position.copy(pos);
    sprite.userData = { hour: i };
    raLabelSprites.push(sprite);
    coordsGroup.add(sprite);

    // Hour / RA tick mark segment
    const tickStart = raDecToVector3(i, 0, R * 0.97);
    const tickEnd = raDecToVector3(i, 0, R * 1.03);

    if (tickWidthPx && tickWidthPx > 0) {
      const tickTube = createScreenSpaceTubeFromPoints(
        [tickStart, tickEnd],
        tickColor,
        coordsOpacity,
        tickWidthPx * widthFactor
      );
      coordsGroup.add(tickTube);
    } else if (tickWidth && tickWidth > 0) {
      const tickTube = createTubeSegment(
        tickStart,
        tickEnd,
        tickWidth * widthFactor,
        tickColor,
        coordsOpacity
      );
      coordsGroup.add(tickTube);
    }
  }

  // 4. Declination tick marks and labels along RA 0h meridian
  const decLabels = [-90, -75, -60, -45, -30, -15, 15, 30, 45, 60, 75, 90];
  for (const dec of decLabels) {
    const pos = raDecToVector3(0, dec, R * 1.05);
    const labelText = dec > 0 ? `+${dec}°` : `${dec}°`;
    const sprite = createTextSprite(
      labelText,
      GEOMETRY_CONFIG.DEC_LABEL_COLOR,
      GEOMETRY_CONFIG.DEC_LABEL_FONT_SIZE,
      labelScale,
      GEOMETRY_CONFIG.LABEL_FONT_WEIGHT,
      textureCache
    );
    if (sprite.material) sprite.material.opacity = labelsOpacity;
    sprite.position.copy(pos);

    if (Math.abs(dec) === 90) {
      poleLabelsGroup.add(sprite);
    } else {
      coordsGroup.add(sprite);
    }
  }

  return { coordsGroup, poleLabelsGroup, raLabelSprites };
}

/**
 * Pure factory function: Creates the Vernal Equinox vector line group.
 */
export function createVernalLineGroup(options = {}) {
  const vernalGroup = new THREE.Group();
  const R = options.radius !== undefined ? options.radius : GEOMETRY_CONFIG.SPHERE_RADIUS;
  const vernalPos = raDecToVector3(0, 0, R);
  const vernalTube = createTubeSegment(
    new THREE.Vector3(0, 0, 0),
    vernalPos,
    GEOMETRY_CONFIG.VERNAL_LINE_WIDTH,
    GEOMETRY_CONFIG.VERNAL_LINE_COLOR
  );
  vernalGroup.add(vernalTube);
  return vernalGroup;
}

/**
 * Pure factory function: Creates the Celestial Equator plane disc group.
 */
export function createEquatorDiskGroup(options = {}) {
  const equatorDiskGroup = new THREE.Group();
  const R = options.radius !== undefined ? options.radius : GEOMETRY_CONFIG.SPHERE_RADIUS;
  const geometry = new THREE.CircleGeometry(R, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide
  });
  const disk = new THREE.Mesh(geometry, material);
  disk.rotation.x = Math.PI / 2;
  equatorDiskGroup.add(disk);
  return equatorDiskGroup;
}

/**
 * Pure factory function: Creates the Ecliptic ring group.
 */
export function createEclipticGroup(options = {}) {
  const eclipticGroup = new THREE.Group();
  const R = options.radius !== undefined ? options.radius : GEOMETRY_CONFIG.SPHERE_RADIUS;
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(R * Math.cos(angle), 0, R * Math.sin(angle)));
  }
  const eclipticRing = createTubeFromPoints(points, GEOMETRY_CONFIG.ECLIPTIC_LINE_WIDTH, 0xf59e0b, 1.0, true);
  eclipticRing.rotation.x = OBLIQUITY_RAD;
  eclipticGroup.add(eclipticRing);
  return eclipticGroup;
}

/**
 * Scene adapter class for CelestialScene orchestration.
 */
export class EquatorialCoordsBuilder {
  constructor(sceneInstance) {
    this.ctx = sceneInstance;
  }

  createExplicitEquatorialCoordinates() {
    const R = this.ctx.sphereRadius;
    const isLocal = (this.ctx.cameraMode === 'camLatitude');
    const defaultFov = CAMERA_CONFIG.DEFAULT_LOCAL_FOV || 60;
    const currentFov = (isLocal && this.ctx.camera) ? this.ctx.camera.fov : defaultFov;
    const fovFactor = isLocal ? (Math.tan((currentFov * Math.PI) / 360) / Math.tan((defaultFov * Math.PI) / 360)) : 1.0;
    const widthFactor = (isLocal ? (GEOMETRY_CONFIG.LOCAL_GRID_LINE_WIDTH || 0.5) : 1.0) * fovFactor;

    const { coordsGroup, poleLabelsGroup, raLabelSprites } = createEquatorialCoordsGroup({
      radius: R,
      widthFactor: widthFactor,
      textureCache: this.ctx.spriteTextureCache
    });

    this.ctx.equatorialRALabelSprites = raLabelSprites;

    while (coordsGroup.children.length > 0) {
      this.ctx.coordHelpersGroup.add(coordsGroup.children[0]);
    }
    while (poleLabelsGroup.children.length > 0) {
      this.ctx.fixedPoleLabelsGroup.add(poleLabelsGroup.children[0]);
    }

    this.updateEquatorialRALabelVisibility();
  }

  createVernalEquinoxLine() {
    const vGroup = createVernalLineGroup({ radius: this.ctx.sphereRadius });
    while (vGroup.children.length > 0) {
      this.ctx.vernalGroup.add(vGroup.children[0]);
    }
  }

  createCelestialEquator() {
    const eqGroup = createEquatorDiskGroup({ radius: this.ctx.sphereRadius });
    while (eqGroup.children.length > 0) {
      this.ctx.equatorDiskGroup.add(eqGroup.children[0]);
    }
  }

  createEcliptic() {
    const ecGroup = createEclipticGroup({ radius: this.ctx.sphereRadius });
    while (ecGroup.children.length > 0) {
      this.ctx.eclipticGroup.add(ecGroup.children[0]);
    }
  }

  updateEquatorialRALabelVisibility() {
    if (!this.ctx.equatorialRALabelSprites) return;

    const isGuideActive = this.ctx.guideGroup && this.ctx.guideGroup.visible;
    const guideRA = this.ctx.guideRA || 0;

    this.ctx.equatorialRALabelSprites.forEach(sprite => {
      if (sprite.userData && sprite.userData.hour !== undefined) {
        const hour = sprite.userData.hour;
        if (isGuideActive && hour > 0 && hour <= guideRA) {
          sprite.visible = false;
        } else {
          sprite.visible = true;
        }
      }
    });
  }
}

// Alias for backward compatibility if imported elsewhere
export { EquatorialCoordsBuilder as CoordHelpersBuilder };
