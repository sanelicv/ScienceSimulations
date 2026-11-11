import * as THREE from 'three';
import { GEOMETRY_CONFIG, CAMERA_CONFIG } from '../config.js';
import { createTextSprite, disposeHierarchy } from '../utils/threeHelpers.js';

export class HorizonBuilder {
  constructor(sceneInstance) {
    this.ctx = sceneInstance;
  }

  /**
   * Horizon Ground Disk
   */
  createHorizonGround() {
    const radius = GEOMETRY_CONFIG.LANDSCAPE_GROUND_RADIUS || 2500;
    const size = radius * 2;
    const geometry = new THREE.PlaneGeometry(size, size, 32, 32);

    const repeatFactor = Math.max(10, Math.floor(radius / 5));
    const groundTexture = this.ctx.grassTexture ? this.ctx.grassTexture.clone() : null;
    if (groundTexture) {
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(repeatFactor, repeatFactor);
      if (this.ctx.renderer) {
        groundTexture.anisotropy = this.ctx.renderer.capabilities.getMaxAnisotropy();
      }
    }

    const material = new THREE.MeshStandardMaterial({
      map: groundTexture || this.ctx.grassTexture,
      side: THREE.DoubleSide,
      depthWrite: true,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -0.1;
    ground.renderOrder = 2;
    this.ctx.horizonGroup.add(ground);
  }

  /**
   * Cardinal Points Labels (N, S, E, O) on the Horizon Plane
   */
  createCardinalPoints() {
    if (this.ctx.cardinalGroup) {
      disposeHierarchy(this.ctx.cardinalGroup, this.ctx.spriteTextureCache);
    } else {
      this.ctx.cardinalGroup = new THREE.Group();
      this.ctx.horizonGroup.add(this.ctx.cardinalGroup);
    }
    this.ctx.cardinalSprites = [];

    const dist = GEOMETRY_CONFIG.CARDINAL_LABEL_DISTANCE !== undefined ? GEOMETRY_CONFIG.CARDINAL_LABEL_DISTANCE : 200;
    const height = GEOMETRY_CONFIG.CARDINAL_LABEL_HEIGHT !== undefined ? GEOMETRY_CONFIG.CARDINAL_LABEL_HEIGHT : 15;
    const fontSize = GEOMETRY_CONFIG.CARDINAL_LABEL_FONT_SIZE || 64;
    const color = GEOMETRY_CONFIG.CARDINAL_LABEL_COLOR || '#38bdf8';
    const baseScale = GEOMETRY_CONFIG.CARDINAL_LABEL_SCALE || 25;
    const visualScale = baseScale * (fontSize / 64);

    const points = [
      { text: GEOMETRY_CONFIG.CARDINAL_LABEL_NORTH || 'N', dirX: 0, dirZ: 1 },
      { text: GEOMETRY_CONFIG.CARDINAL_LABEL_SOUTH || 'S', dirX: 0, dirZ: -1 },
      { text: GEOMETRY_CONFIG.CARDINAL_LABEL_EAST || 'E', dirX: -1, dirZ: 0 },
      { text: GEOMETRY_CONFIG.CARDINAL_LABEL_WEST || 'O', dirX: 1, dirZ: 0 }
    ];

    points.forEach(pt => {
      const sprite = createTextSprite(pt.text, color, fontSize, visualScale, 'bold', this.ctx.spriteTextureCache);
      sprite.position.set(pt.dirX * dist, height, pt.dirZ * dist);
      const aspect = sprite.scale.x / (sprite.scale.y || 1);
      sprite.userData = {
        dirX: pt.dirX,
        dirZ: pt.dirZ,
        aspect: aspect
      };
      this.ctx.cardinalSprites.push(sprite);
      this.ctx.cardinalGroup.add(sprite);
    });

    this.updateCardinalScale();
  }

  /**
   * Dynamically rescales Cardinal Points 3D scale and elevation based on camera FOV.
   */
  updateCardinalScale() {
    if (!this.ctx.cardinalGroup || !this.ctx.horizonGroup.visible || !this.ctx.cardinalSprites) return;

    const defaultFov = CAMERA_CONFIG.DEFAULT_LOCAL_FOV || 60;
    const currentFov = this.ctx.camera.fov;
    const eyeHeight = CAMERA_CONFIG.OBSERVER_EYE_HEIGHT !== undefined ? CAMERA_CONFIG.OBSERVER_EYE_HEIGHT : 1.0;

    const fovFactor = Math.tan((currentFov * Math.PI) / 360) / Math.tan((defaultFov * Math.PI) / 360);

    const baseDist = GEOMETRY_CONFIG.CARDINAL_LABEL_DISTANCE !== undefined ? GEOMETRY_CONFIG.CARDINAL_LABEL_DISTANCE : 200;
    const baseHeight = GEOMETRY_CONFIG.CARDINAL_LABEL_HEIGHT !== undefined ? GEOMETRY_CONFIG.CARDINAL_LABEL_HEIGHT : 15;
    const fontSize = GEOMETRY_CONFIG.CARDINAL_LABEL_FONT_SIZE || 64;
    const baseScale = GEOMETRY_CONFIG.CARDINAL_LABEL_SCALE || 25;

    const visualScale = baseScale * (fontSize / 64) * fovFactor;

    const deltaHeight = baseHeight - eyeHeight;
    const currentHeight = eyeHeight + (deltaHeight * fovFactor);

    this.ctx.cardinalSprites.forEach(sprite => {
      const aspect = sprite.userData.aspect || 2.0;
      sprite.scale.set(visualScale * aspect, visualScale, 1);

      sprite.position.x = sprite.userData.dirX * baseDist;
      sprite.position.y = currentHeight;
      sprite.position.z = sprite.userData.dirZ * baseDist;
    });
  }
}
