import * as THREE from 'three';
import { GEOMETRY_CONFIG } from '../config.js';
import { raDecToVector3, getSurfaceOrientation } from '../astroMath.js';
import { createTextSprite, disposeHierarchy } from '../utils/threeHelpers.js';

export class StarRenderers {
  constructor(sceneInstance) {
    this.ctx = sceneInstance;
  }

  /**
   * Creates a surface-oriented 2D flat solid circle star mesh at position on celestial sphere
   */
  createSurfaceCircleStar(
    radius = GEOMETRY_CONFIG.STAR_CIRCLE_RADIUS,
    color = GEOMETRY_CONFIG.STAR_CIRCLE_COLOR
  ) {
    const geometry = new THREE.CircleGeometry(radius, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      depthTest: true
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Adds single user star
   */
  addUserStar(ra, dec) {
    this.ctx.userStars.push([ra, dec]);
    this.renderUserStars();
  }

  renderUserStars() {
    disposeHierarchy(this.ctx.userStarsGroup, this.ctx.spriteTextureCache);
    const R = this.ctx.sphereRadius;

    this.ctx.userStars.forEach(([ra, dec]) => {
      const pos = raDecToVector3(ra, dec, R);
      const starMesh = this.createSurfaceCircleStar(
        GEOMETRY_CONFIG.STAR_CIRCLE_RADIUS,
        GEOMETRY_CONFIG.STAR_CIRCLE_COLOR
      );
      starMesh.position.copy(pos);
      getSurfaceOrientation(pos, starMesh.quaternion);
      this.ctx.userStarsGroup.add(starMesh);
    });
  }

  /**
   * Sets imported CSV/XLSX stars
   */
  setCsvStars(dataArray) {
    this.ctx.csvStars = dataArray;
    this.renderCsvStars();
  }

  renderCsvStars() {
    disposeHierarchy(this.ctx.csvStarsGroup, this.ctx.spriteTextureCache);
    const R = this.ctx.sphereRadius;

    this.ctx.csvStars.forEach((star, index) => {
      const pos = raDecToVector3(star.ra, star.dec, R);

      const starMesh = this.createSurfaceCircleStar(
        GEOMETRY_CONFIG.STAR_CIRCLE_RADIUS,
        GEOMETRY_CONFIG.STAR_CIRCLE_COLOR
      );
      starMesh.position.copy(pos);
      getSurfaceOrientation(pos, starMesh.quaternion);
      this.ctx.csvStarsGroup.add(starMesh);

      if (this.ctx.showIndices) {
        const labelPos = raDecToVector3(star.ra, star.dec, R * 1.04);
        const sprite = createTextSprite(
          `${index + 1}`,
          GEOMETRY_CONFIG.STAR_INDEX_COLOR || '#38bdf8',
          GEOMETRY_CONFIG.STAR_INDEX_FONT_SIZE,
          GEOMETRY_CONFIG.STAR_INDEX_SCALE,
          GEOMETRY_CONFIG.LABEL_FONT_WEIGHT,
          this.ctx.spriteTextureCache
        );
        sprite.position.copy(labelPos);
        this.ctx.csvStarsGroup.add(sprite);
      }
    });
  }

  /**
   * Clears user stars and imported stars
   */
  clearAllStars() {
    this.ctx.userStars = [];
    this.ctx.csvStars = [];
    disposeHierarchy(this.ctx.userStarsGroup, this.ctx.spriteTextureCache);
    disposeHierarchy(this.ctx.csvStarsGroup, this.ctx.spriteTextureCache);
    if (this.ctx.spriteTextureCache) {
      this.ctx.spriteTextureCache.forEach(texture => texture.dispose());
      this.ctx.spriteTextureCache.clear();
    }
  }
}
