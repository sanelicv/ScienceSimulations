import * as THREE from 'three';

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

export class Moon extends THREE.Group {
  constructor(sphereRadius, size, phaseParams) {
    super();
    this.sphereRadius = sphereRadius;
    this.phaseParams = phaseParams;

    // Canvas Setup (Same as before)
    this.canvas = document.createElement('canvas');
    this.canvas.width = 128;
    this.canvas.height = 128;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    // Important: MinFilter modulation for smoother look if scaled down
    this.texture.minFilter = THREE.LinearFilter;

    // Geometry: Using a PlaneGeometry (Square) to hold the texture.
    // Since the texture contains a transparent circular moon, the visual result is a circle.
    // Using Plane (Square) is better for UV mapping (0..1) than CircleGeometry.
    // Tangent orientation ensures it looks "painted" on the sphere.
    const geometry = new THREE.PlaneGeometry(size, size);

    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5 // Discards completely transparent bounding box corners, fixing Z-sorting occlusion 
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.add(this.mesh);

    // Sprite equivalent for perspective distortion immunity
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.5 // Same hardware discard parameter here
    }));
    this.sprite.scale.set(size, size, 1);
    this.sprite.visible = false; // Default off
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
    // User requested the ring to be exactly 120% of the Moon's size
    this.highlightRing.scale.set(size * 1.5, size * 1.5, 1);
    this.highlightRing.visible = false;
    this.highlightRing.renderOrder = 2; // Always on top
    this.add(this.highlightRing);

    // Mesh ring indicator for global view (tangent to sphere)
    const meshRingGeo = new THREE.PlaneGeometry(size * 1.5, size * 1.5);
    const meshRingMat = new THREE.MeshBasicMaterial({
      map: defaultRingTexture,
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      alphaTest: 0.5
    });
    this.highlightMesh = new THREE.Mesh(meshRingGeo, meshRingMat);
    this.highlightMesh.visible = false;
    this.highlightMesh.renderOrder = 10; // High render order
    this.add(this.highlightMesh);

    // Material fix for alpha and depth
    meshRingMat.depthWrite = false;
    meshRingMat.depthTest = false;
    // ...


    this.moonColor = '#FFFFFF'; // Default White
    this.customColor = null; // Used for interactive highlighting
  }

  setCustomColor(hexColor) {
    this.customColor = hexColor;
    if (this.highlightRing) {
      this.highlightRing.material.color.set(hexColor);
      this.highlightRing.visible = this.sprite.visible;
    }
    if (this.highlightMesh) {
      this.highlightMesh.material.color.set(hexColor);
      this.highlightMesh.visible = this.mesh.visible;
    }
  }

  removeCustomColor() {
    this.customColor = null;
    if (this.highlightRing) this.highlightRing.visible = false;
    if (this.highlightMesh) this.highlightMesh.visible = false;
  }

  updateTheme(isLight) {
    this.moonColor = isLight ? '#000000' : '#FFFFFF';
  }

  update(time, camera, sun, isLocalView = false) {
    const { omega1, delta } = this.phaseParams;

    // Position Logic 
    const phi = omega1 * time + delta;

    const rOrbit = this.sphereRadius - 10;
    const x = rOrbit * Math.cos(phi);
    const y = rOrbit * Math.sin(phi); // was z
    const z = 0; // base floor

    this.mesh.position.set(x, y, z);
    if (this.sprite) this.sprite.position.set(x, y, z);
    if (this.highlightRing) this.highlightRing.position.set(x, y, z);
    if (this.highlightMesh) this.highlightMesh.position.set(x, y, z);

    // Orientation Logic Phase 1: Tangent to sphere for the mesh
    this.mesh.lookAt(0, 0, 0);
    if (this.highlightMesh) this.highlightMesh.lookAt(0, 0, 0);

    let phaseFraction = 0;

    // Astronomical Phase & Screen-Space Orientation
    if (camera && sun) {
      sun.mesh.updateMatrixWorld(true);
      this.mesh.updateMatrixWorld(true);

      // 1. Calculate physical true anomaly / phase angle
      const moonPhi = Math.atan2(y, x);
      const sunLocalPos = sun.mesh.position;
      const sunPhi = Math.atan2(sunLocalPos.y, sunLocalPos.x);

      let theta = Math.abs(moonPhi - sunPhi);
      if (theta > Math.PI) theta = 2 * Math.PI - theta;

      // phaseFraction goes from 0 (New) to 0.5 (Full)
      phaseFraction = theta / (2 * Math.PI);

      // 2. Screen-Space vs 3D-Space Rotation towards Sun
      const sunWorldPos = new THREE.Vector3();
      sun.mesh.getWorldPosition(sunWorldPos);

      const moonWorldPos = new THREE.Vector3();
      this.mesh.getWorldPosition(moonWorldPos);

      // 3D Direction from Moon to Sun
      const lightDir = new THREE.Vector3().subVectors(sunWorldPos, moonWorldPos).normalize();

      if (isLocalView) {
        // --- SCREEN SPACE LOGIC (Visually intuitive for Local View) ---
        // Small step in 3D towards the sun to get screen direction robustly
        const moonWorldPos2 = moonWorldPos.clone().add(lightDir.multiplyScalar(10));

        // Project 3D world coordinates onto the 2D Screen space (NDC: -1 to 1)
        const proj1 = moonWorldPos.clone().project(camera);
        const proj2 = moonWorldPos2.clone().project(camera);

        // Calculating the 2D vector from the Moon pointing towards the Sun on the screen
        const dx = proj2.x - proj1.x;
        const dy = proj2.y - proj1.y;

        // Calculate polar angle (0 radians is +X, Pi/2 is +Y...)
        const angle = Math.atan2(dy, dx);

        // The canvas draws the bright phase on the Right (+X).
        // So rotating the Sprite by 'angle' will point the Right side directly to the Sun.
        if (this.sprite) {
          this.sprite.material.rotation = angle;
        }

        // Rotate the physical mesh as well on its local Z axis (rolling like a barrel)
        this.mesh.rotateZ(angle);
      } else {
        // --- 3D SPACE LOGIC (Physically accurate for Global View) ---
        // We want the moon's drawn bright side (+X in canvas) to point to the Sun in 3D.

        // Use World-to-Local transformation to find the Sun relative to the Moon's current orientation
        const sunWorldPos = new THREE.Vector3();
        sun.mesh.getWorldPosition(sunWorldPos);

        const localSunPos = this.mesh.worldToLocal(sunWorldPos.clone());

        // Find the angle of the light in the Moon's local X-Y tangent plane
        const angle = Math.atan2(localSunPos.y, localSunPos.x);

        // Apply rotation to the mesh
        this.mesh.rotateZ(angle);

        // Keep sprite in sync if used
        if (this.sprite) {
          this.sprite.material.rotation = angle;
        }
      }
    } else {
      // Fallback if camera/sun missing: Use blind time progression
      const { synodicMonthDays, phaseOffset } = this.phaseParams;
      const u = (((time * 100) / synodicMonthDays) + phaseOffset) % 1;
      const uPos = u < 0 ? u + 1 : u;
      phaseFraction = uPos > 0.5 ? 1 - uPos : uPos; // map back to 0-0.5 for drawing
    }

    // Phase Drawing Logic 
    this.drawPhases(phaseFraction);
  }

  drawPhases(phaseFraction) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const diameter = width * 0.95;
    const r = diameter / 2;
    const cx = width / 2;
    const cy = height / 2;

    // phaseFraction goes from 0 (New) to 0.5 (Full)
    const xi = Math.PI - 2 * Math.PI * phaseFraction;
    const a = r * Math.abs(Math.cos(xi));
    const moreThanHalf = Math.cos(xi) >= 0;

    const N = 60;

    ctx.fillStyle = this.customColor || this.moonColor;
    ctx.beginPath();

    // Waxing arc (Right side)
    for (let i = 0; i <= N; i++) {
      const ang = Math.PI / 2 - (i * Math.PI) / N;
      ctx.lineTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
    }

    if (a < 1e-9) {
      ctx.lineTo(cx, cy - r);
    } else {
      const s = moreThanHalf ? -1 : 1;
      for (let i = 0; i <= N; i++) {
        const t = -Math.PI / 2 + (i * Math.PI) / N;
        ctx.lineTo(cx + s * a * Math.cos(t), cy + r * Math.sin(t));
      }
    }

    ctx.closePath();
    ctx.fill();

    this.texture.needsUpdate = true;
  }

  setRenderMode(isLocalView) {
    if (this.mesh) this.mesh.visible = !isLocalView;
    if (this.sprite) this.sprite.visible = isLocalView;

    // Toggle highlight visibility only if the moon is currently highlighted
    if (this.customColor || (this.highlightRing && this.highlightRing.visible) || (this.highlightMesh && this.highlightMesh.visible)) {
      if (this.highlightRing) this.highlightRing.visible = isLocalView;
      if (this.highlightMesh) this.highlightMesh.visible = !isLocalView;
    }
  }
}
