import * as THREE from 'three';

function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}
const defaultCircleTexture = createCircleTexture();

function createRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, Math.PI * 2);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}
const defaultRingTexture = createRingTexture();

export class Planet extends THREE.Group {
  constructor(sphereRadius, color, size, orbitalParams) {
    super();
    this.sphereRadius = sphereRadius;
    this.orbitalParams = orbitalParams; // { sunOmega1, distanceToSun, initialPhase } or similar for the Sun
    this.baseSize = size;
    this.baseColor = new THREE.Color(color);

    // Use CircleGeometry for a perfect 2D circle "projected" on the sphere
    // Size is diameter in p5, radius in Three.js geometry is size/2
    const geometry = new THREE.CircleGeometry(size / 2, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide // Ensure it's visible from any angle
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.add(this.mesh);

    // Sprite equivalent for perspective distortion immunity
    const spriteMat = new THREE.SpriteMaterial({
      map: defaultCircleTexture,
      color: color,
      transparent: true
    });
    this.sprite = new THREE.Sprite(spriteMat);
    this.sprite.scale.set(size, size, 1);
    this.sprite.visible = false; // By default hidden (Normal view uses Mesh)
    this.sprite.renderOrder = 1;
    this.mesh.renderOrder = 1;
    this.add(this.sprite);

    // Ring visual indicator for selection
    const ringMat = new THREE.SpriteMaterial({
      map: defaultRingTexture,
      color: 0xffffff,
      transparent: true
    });
    this.highlightRing = new THREE.Sprite(ringMat);
    // Unified scale of 25 for all UI highlight rings
    this.highlightRing.scale.set(25, 25, 1);
    this.highlightRing.visible = false;
    this.highlightRing.renderOrder = 2; // Always on top
    this.add(this.highlightRing);

    // Mesh ring indicator for global view (tangent to sphere)
    const ringGeometry = new THREE.RingGeometry(this.baseSize * 2, this.baseSize * 2.5, 32);
    const meshRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false // Ensures it renders cleanly on top of the planet mesh
    });
    this.highlightMesh = new THREE.Mesh(ringGeometry, meshRingMat);
    this.highlightMesh.visible = false;
    this.highlightMesh.renderOrder = 2; // Always on top
    this.add(this.highlightMesh);

    this.isHighlighted = false;
    this.hasCustomColor = false;
  }

  setCustomColor(hexColor) {
    const colorObj = new THREE.Color(hexColor);
    this.hasCustomColor = true;
    if (this.mesh && this.mesh.material) this.mesh.material.color.copy(colorObj);
    if (this.sprite && this.sprite.material) this.sprite.material.color.copy(colorObj);
    if (this.highlightRing) {
      this.highlightRing.material.color.copy(colorObj);
      this.highlightRing.visible = this.sprite.visible;
    }
    if (this.highlightMesh) {
      this.highlightMesh.material.color.copy(colorObj);
      this.highlightMesh.visible = this.mesh.visible;
    }
  }

  removeCustomColor(isLightMode) {
    this.hasCustomColor = false;
    if (this.highlightRing) this.highlightRing.visible = this.isHighlighted && this.sprite.visible;
    if (this.highlightMesh) this.highlightMesh.visible = this.isHighlighted && this.mesh.visible;
    this.updateTheme(isLightMode);
  }

  update(time) {
    const params = this.orbitalParams;
    const observerOmega = params.sunOmega1;
    const observerAngle = observerOmega * time - Math.PI;
    const observerX = Math.cos(observerAngle);
    const observerZ = Math.sin(observerAngle);

    if (params.distanceToSun === undefined) {
      // It's the Sun
      // Vector from observer to sun (0,0)
      const apparentPhi = Math.atan2(0 - observerZ, 0 - observerX);
      const rOrbit = this.sphereRadius + 10;
      const x = rOrbit * Math.cos(apparentPhi);
      const y = rOrbit * Math.sin(apparentPhi); // was z
      this.mesh.position.set(x, y, 0);
      this.sprite.position.set(x, y, 0);
      if (this.highlightRing) this.highlightRing.position.set(x, y, 0);
      if (this.highlightMesh) this.highlightMesh.position.set(x, y, 0);
    } else {
      // It's a proper Planet using Kepler's laws.
      const dist = params.distanceToSun;
      const planetOmega = observerOmega / Math.pow(dist, 1.5);
      const planetAngle = planetOmega * time + params.initialPhase;

      const planetX = dist * Math.cos(planetAngle);
      const planetZ = dist * Math.sin(planetAngle);

      const apparentPhi = Math.atan2(planetZ - observerZ, planetX - observerX);
      const rOrbit = this.sphereRadius + 2;
      const x = rOrbit * Math.cos(apparentPhi);
      const y = rOrbit * Math.sin(apparentPhi); // was z
      this.mesh.position.set(x, y, 0);
      this.sprite.position.set(x, y, 0);
      if (this.highlightRing) this.highlightRing.position.set(x, y, 0);
      if (this.highlightMesh) this.highlightMesh.position.set(x, y, 0);
    }

    // Update Orientation: Tangent to the sphere (Perpendicular to radius vector)
    this.mesh.lookAt(0, 0, 0);
    if (this.highlightMesh) this.highlightMesh.lookAt(0, 0, 0);
  }

  updateTheme(isLight) {
    if (this.mesh && this.mesh.material) {
      if (this.baseColor.getHex() === 0xffd700) {
        // It's the Sun (Yellow). Restore to yellow if not highlighted or just keep yellow.
        this.mesh.material.color.copy(this.baseColor);
        if (this.sprite) this.sprite.material.color.copy(this.baseColor);
      } else {
        // It's a Planet (White/Black)
        let newHex = 0xffffff;
        if (this.isHighlighted) {
          newHex = 0x39ff14; // 
        } else if (isLight) {
          newHex = 0x000000; // Black for light mode
        }

        this.mesh.material.color.setHex(newHex);
        if (this.sprite) this.sprite.material.color.setHex(newHex);
      }

      // Handle Ring Visibility based on theme factors
      const shouldShowRing = this.isHighlighted || this.hasCustomColor;
      if (this.highlightRing) {
        this.highlightRing.visible = shouldShowRing && this.sprite.visible;
        // If it's a global highlight and NOT a custom color, use neon green for the ring too
        if (this.isHighlighted && !this.hasCustomColor) {
          this.highlightRing.material.color.setHex(0x39ff14);
        }
      }
      if (this.highlightMesh) {
        this.highlightMesh.visible = shouldShowRing && this.mesh.visible;
        if (this.isHighlighted && !this.hasCustomColor) {
          this.highlightMesh.material.color.setHex(0x39ff14);
        }
      }
    }
  }

  setHighlight(isHighlighted, isLightMode) {
    this.isHighlighted = isHighlighted;
    // Scale changes removed per user request
    this.updateTheme(isLightMode);
  }

  setScale(scaleMultiplier) {
    if (this.mesh) {
      this.mesh.scale.set(scaleMultiplier, scaleMultiplier, 1);
    }
    if (this.sprite) {
      this.sprite.scale.set(this.baseSize * scaleMultiplier, this.baseSize * scaleMultiplier, 1);
    }
    if (this.highlightRing) {
      this.highlightRing.scale.set(25 * scaleMultiplier, 25 * scaleMultiplier, 1);
    }
  }

  setRenderMode(isLocalView) {
    if (this.mesh) this.mesh.visible = !isLocalView;
    if (this.sprite) this.sprite.visible = isLocalView;

    const shouldShowRing = this.isHighlighted || this.hasCustomColor;
    if (this.highlightRing) this.highlightRing.visible = shouldShowRing && isLocalView;
    if (this.highlightMesh) this.highlightMesh.visible = shouldShowRing && !isLocalView;
  }
}
