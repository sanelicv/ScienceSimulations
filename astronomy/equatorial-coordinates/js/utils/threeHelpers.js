import * as THREE from 'three';
import { GEOMETRY_CONFIG } from '../config.js';

/**
 * Creates 3D TubeGeometry mesh along an array of 3D points.
 */
export function createTubeFromPoints(points, tubeRadius = 0.35, color = 0xffffff, opacity = 1.0, closed = false) {
  if (!points || points.length < 2) return new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points, closed);
  const geometry = new THREE.TubeGeometry(curve, Math.max(20, points.length * 2), tubeRadius, 8, closed);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: opacity < 1.0,
    opacity: opacity,
    depthWrite: opacity >= 1.0
  });
  return new THREE.Mesh(geometry, material);
}

/**
 * Creates 3D TubeGeometry for a straight segment between startVec and endVec.
 */
export function createTubeSegment(startVec, endVec, tubeRadius = 0.4, color = 0xffffff) {
  const curve = new THREE.LineCurve3(startVec, endVec);
  const geometry = new THREE.TubeGeometry(curve, 1, tubeRadius, 8, false);
  const material = new THREE.MeshBasicMaterial({ color: color });
  return new THREE.Mesh(geometry, material);
}

/**
 * Checks whether a texture is cached in spriteTextureCache.
 */
export function isTextureCached(texture, spriteTextureCache) {
  if (!spriteTextureCache) return false;
  for (const cachedTex of spriteTextureCache.values()) {
    if (cachedTex === texture) return true;
  }
  return false;
}

/**
 * Safely disposes underlying Geometries, Materials, and Textures from GPU memory.
 */
export function disposeHierarchy(object3D, spriteTextureCache) {
  if (!object3D) return;

  object3D.traverse((child) => {
    if (child.isMesh || child.isSprite) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat.map && !isTextureCached(mat.map, spriteTextureCache)) {
              mat.map.dispose();
            }
            mat.dispose();
          });
        } else {
          if (child.material.map && !isTextureCached(child.material.map, spriteTextureCache)) {
            child.material.map.dispose();
          }
          child.material.dispose();
        }
      }
    }
  });

  if (typeof object3D.clear === 'function') {
    object3D.clear();
  }
}

/**
 * Creates camera-facing canvas text sprite with texture caching and dynamic resolution.
 */
export function createTextSprite(text, color = '#ffffff', fontSize = 36, scale = 8, fontWeight = GEOMETRY_CONFIG.LABEL_FONT_WEIGHT, spriteTextureCache = null) {
  const key = `${text}_${color}_${fontSize}_${fontWeight}`;
  let texture = spriteTextureCache ? spriteTextureCache.get(key) : null;
  let canvasWidth, canvasHeight;

  if (!texture) {
    const canvas = document.createElement('canvas');
    canvasWidth = Math.max(128, Math.ceil(fontSize * Math.max(2, String(text).length * 1.2)));
    canvasHeight = Math.max(64, Math.ceil(fontSize * 1.6));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');

    ctx.font = `${fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.userData = { canvasWidth, canvasHeight };

    if (spriteTextureCache) {
      spriteTextureCache.set(key, texture);
    }
  } else {
    canvasWidth = texture.userData.canvasWidth || 128;
    canvasHeight = texture.userData.canvasHeight || 64;
  }

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMaterial);

  const aspect = canvasWidth / canvasHeight;
  sprite.scale.set(scale * aspect, scale, 1);
  return sprite;
}
