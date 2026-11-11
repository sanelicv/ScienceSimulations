import * as THREE from 'three';
import { GEOMETRY_CONFIG } from '../config.js';

/**
 * Creates 3D TubeGeometry mesh along an array of 3D points.
 */
export function createTubeFromPoints(points, tubeRadius = 0.35, color = 0xffffff, opacity = 1.0, closed = false) {
  if (!points || points.length < 2 || tubeRadius <= 0) return new THREE.Group();
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
export function createTubeSegment(startVec, endVec, tubeRadius = 0.4, color = 0xffffff, opacity = 1.0) {
  if (tubeRadius <= 0) return new THREE.Group();
  const curve = new THREE.LineCurve3(startVec, endVec);
  const geometry = new THREE.TubeGeometry(curve, 1, tubeRadius, 8, false);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: opacity < 1.0,
    opacity: opacity,
    depthWrite: opacity >= 1.0
  });
  return new THREE.Mesh(geometry, material);
}

/**
 * Creates a TubeGeometry mesh whose width in screen pixels is constant (widthPx),
 * controlled directly by GEOMETRY_CONFIG.GRID_LINE_WIDTH_PX or custom widthPx.
 */
export function createScreenSpaceTubeFromPoints(points, color = 0xffffff, opacity = 1.0, widthPx = 1.5, closed = false) {
  if (!points || points.length < 2 || widthPx <= 0) return new THREE.Group();

  const curve = new THREE.CatmullRomCurve3(points, closed);
  const geometry = new THREE.TubeGeometry(curve, Math.max(32, points.length * 2), 1.0, 8, closed);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: opacity },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      widthPx: { value: widthPx }
    },
    vertexShader: `
      uniform vec2 resolution;
      uniform float widthPx;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        
        // Base TubeGeometry has radius 1.0 along normal. Subtract normal to get local spine center.
        vec3 spinePos = position - normal;
        vec4 worldSpine = modelMatrix * vec4(spinePos, 1.0);
        vec4 viewSpine = viewMatrix * worldSpine;

        float dist = -viewSpine.z;
        float pr11 = projectionMatrix[1][1];

        float desiredRadiusWorld = ((widthPx * 0.5) * dist) / ((resolution.y * 0.5) * pr11);

        vec3 viewNormal = normalize(normalMatrix * normal);
        vec3 finalViewPos = viewSpine.xyz + viewNormal * desiredRadiusWorld;

        gl_Position = projectionMatrix * vec4(finalViewPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;

      void main() {
        gl_FragColor = vec4(color, opacity);
      }
    `,
    transparent: opacity < 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true
  });

  const mesh = new THREE.Mesh(geometry, material);

  const resizeHandler = () => {
    if (material && material.uniforms && material.uniforms.resolution) {
      material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }
  };
  window.addEventListener('resize', resizeHandler);

  return mesh;
}

/**
 * Creates 1-pixel screen-space line using THREE.LineLoop or THREE.Line.
 * Maintains constant 1px pixel thickness on screen regardless of camera distance or sphere radius.
 */
export function createLineFromPoints(points, color = 0xffffff, opacity = 1.0, closed = false) {
  if (!points || points.length < 2) return new THREE.Group();
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: opacity < 1.0,
    opacity: opacity,
    depthWrite: false
  });
  return closed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
}

/**
 * Creates 1-pixel screen-space straight segment between startVec and endVec.
 */
export function createLineSegment(startVec, endVec, color = 0xffffff, opacity = 1.0) {
  const geometry = new THREE.BufferGeometry().setFromPoints([startVec, endVec]);
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: opacity < 1.0,
    opacity: opacity,
    depthWrite: false
  });
  return new THREE.Line(geometry, material);
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
    if (child.isMesh || child.isSprite || child.isLine || child.isLineLoop || child.isLineSegments) {
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

  const fontScaleRatio = Math.max(0.1, fontSize / 48);
  const effectiveScale = scale * fontScaleRatio;
  const aspect = canvasWidth / canvasHeight;
  sprite.scale.set(effectiveScale * aspect, effectiveScale, 1);
  return sprite;
}
