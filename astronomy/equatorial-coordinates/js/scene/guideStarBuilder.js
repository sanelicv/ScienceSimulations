import * as THREE from 'three';
import { GEOMETRY_CONFIG } from '../config.js';
import { raDecToVector3, getSurfaceOrientation } from '../astroMath.js';
import { createTubeFromPoints, createTubeSegment, createTextSprite, disposeHierarchy } from '../utils/threeHelpers.js';

export class GuideStarBuilder {
  constructor(sceneInstance) {
    this.ctx = sceneInstance;
  }

  /**
   * Creates a surface-oriented 2D flat open ring mesh for the Guide Star
   */
  createSurfaceRingStar(
    innerRadius = GEOMETRY_CONFIG.GUIDE_RING_INNER_RADIUS,
    outerRadius = GEOMETRY_CONFIG.GUIDE_RING_OUTER_RADIUS,
    color = GEOMETRY_CONFIG.GUIDE_RING_COLOR
  ) {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      depthTest: true
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Updates interactive guide vector, target open ring, dynamic declination arc (from equator to dec),
   * dynamic right ascension arc (from vernal point RA=0 to RA), and declination labels
   */
  updateGuideVector(ra, dec) {
    this.ctx.guideRA = ra;
    this.ctx.guideDec = dec;
    disposeHierarchy(this.ctx.guideGroup, this.ctx.spriteTextureCache);

    const R = this.ctx.sphereRadius;
    const pos = raDecToVector3(ra, dec, R);

    // 1. Dynamic Equatorial Arc for Right Ascension (from Vernal Point RA=0 to current RA at Dec=0)
    if (Math.abs(ra) > 0.0001) {
      const raPoints = [];
      const raSteps = Math.max(16, Math.ceil(Math.abs(ra) * 10));
      for (let i = 0; i <= raSteps; i++) {
        const r = (ra * i) / raSteps;
        raPoints.push(raDecToVector3(r, 0, R));
      }
      if (raPoints.length >= 2) {
        const guideRAArc = createTubeFromPoints(
          raPoints,
          GEOMETRY_CONFIG.GUIDE_RA_ARC_WIDTH !== undefined ? GEOMETRY_CONFIG.GUIDE_RA_ARC_WIDTH : GEOMETRY_CONFIG.GUIDE_MERIDIAN_WIDTH,
          GEOMETRY_CONFIG.GUIDE_RA_ARC_COLOR !== undefined ? GEOMETRY_CONFIG.GUIDE_RA_ARC_COLOR : GEOMETRY_CONFIG.GUIDE_MERIDIAN_COLOR,
          0.85,
          false
        );
        this.ctx.guideGroup.add(guideRAArc);
      }
    }

    // 2. Dynamic Meridian Arc for Declination (from Equator Dec=0 to current Dec at RA=ra)
    if (Math.abs(dec) > 0.0001) {
      const decPoints = [];
      const decSteps = Math.max(16, Math.ceil(Math.abs(dec) * 2));
      for (let i = 0; i <= decSteps; i++) {
        const d = (dec * i) / decSteps;
        decPoints.push(raDecToVector3(ra, d, R));
      }
      if (decPoints.length >= 2) {
        const guideDecArc = createTubeFromPoints(
          decPoints,
          GEOMETRY_CONFIG.GUIDE_MERIDIAN_WIDTH,
          GEOMETRY_CONFIG.GUIDE_MERIDIAN_COLOR,
          0.85,
          false
        );
        this.ctx.guideGroup.add(guideDecArc);
      }
    }

    // 3. Dynamic Right Ascension (RA) hour labels along the Guide Star equatorial arc (spatial position normalized to R * 1.07)
    for (let h = 1; h <= 24; h++) {
      if (h <= ra) {
        const labelPos = raDecToVector3(h, 0, R * 1.07);
        const sprite = createTextSprite(
          `${h}h`,
          GEOMETRY_CONFIG.GUIDE_RA_LABEL_COLOR || GEOMETRY_CONFIG.GUIDE_DEC_LABEL_COLOR,
          GEOMETRY_CONFIG.GUIDE_RA_LABEL_FONT_SIZE || GEOMETRY_CONFIG.GUIDE_DEC_LABEL_FONT_SIZE,
          GEOMETRY_CONFIG.RA_LABEL_SCALE || 5,
          GEOMETRY_CONFIG.LABEL_FONT_WEIGHT,
          this.ctx.spriteTextureCache
        );
        sprite.position.copy(labelPos);
        this.ctx.guideGroup.add(sprite);
      }
    }

    // 4. Dynamic Declination angle labels along the Guide Star meridian arc
    const decLabels = [-90, -75, -60, -45, -30, -15, 15, 30, 45, 60, 75, 90];
    for (const d of decLabels) {
      const isOnArc = (dec >= 0) ? (d > 0 && d <= dec) : (d < 0 && d >= dec);
      if (isOnArc) {
        const labelPos = raDecToVector3(ra, d, R * 1.05);
        const labelText = d > 0 ? `+${d}°` : `${d}°`;
        const sprite = createTextSprite(
          labelText,
          GEOMETRY_CONFIG.GUIDE_DEC_LABEL_COLOR,
          GEOMETRY_CONFIG.GUIDE_DEC_LABEL_FONT_SIZE,
          GEOMETRY_CONFIG.DEC_LABEL_SCALE,
          GEOMETRY_CONFIG.LABEL_FONT_WEIGHT,
          this.ctx.spriteTextureCache
        );
        sprite.position.copy(labelPos);
        this.ctx.guideGroup.add(sprite);
      }
    }

    // 5. Guide vector line from origin to surface using TubeGeometry
    const guideTube = createTubeSegment(
      new THREE.Vector3(0, 0, 0),
      pos,
      GEOMETRY_CONFIG.GUIDE_VECTOR_LINE_WIDTH,
      GEOMETRY_CONFIG.GUIDE_VECTOR_LINE_COLOR
    );
    this.ctx.guideGroup.add(guideTube);

    // 6. Target open ring on sphere surface oriented to spherical tangent
    const targetRing = this.createSurfaceRingStar(
      GEOMETRY_CONFIG.GUIDE_RING_INNER_RADIUS,
      GEOMETRY_CONFIG.GUIDE_RING_OUTER_RADIUS,
      GEOMETRY_CONFIG.GUIDE_RING_COLOR
    );
    targetRing.position.copy(pos);
    getSurfaceOrientation(pos, targetRing.quaternion);
    this.ctx.guideGroup.add(targetRing);

    // Synchronize grid hour labels to hide duplicates covered by the guide star arc
    if (this.ctx.coordHelpersBuilder) {
      this.ctx.coordHelpersBuilder.updateEquatorialRALabelVisibility();
    }
  }
}
