import * as THREE from 'three';

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
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.add(this.mesh);

    this.moonColor = '#FFFFFF'; // Default White
  }

  updateTheme(isLight) {
    this.moonColor = isLight ? '#000000' : '#FFFFFF';
  }

  update(time) {
    const { omega1, omega2, A, delta, phaseFrequency, phaseOffset } = this.phaseParams;

    // Position Logic 
    const phi = omega1 * time + A * Math.sin(omega2 * time) + delta;

    const x = this.sphereRadius * Math.cos(phi);
    const z = this.sphereRadius * Math.sin(phi);
    const y = 0;

    this.mesh.position.set(x, y, z);

    // Orientation Logic: Tangent to sphere
    this.mesh.lookAt(0, 0, 0);

    // Phase Drawing Logic 
    this.drawPhases(time, phaseFrequency, phaseOffset);
  }

  drawPhases(time, phaseFrequency, phaseOffset) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const diameter = width * 0.95;
    const r = diameter / 2;
    const cx = width / 2;
    const cy = height / 2;

    const u = ((time * phaseFrequency) + phaseOffset) % 1;
    const uPos = u < 0 ? u + 1 : u;

    const waxing = (uPos < 0.5);
    const xi = Math.PI - 2 * Math.PI * uPos;
    const a = r * Math.abs(Math.cos(xi));
    const moreThanHalf = Math.cos(xi) >= 0;

    const N = 60;

    ctx.fillStyle = this.moonColor;
    ctx.beginPath();

    if (waxing) {
      // Waxing
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
    } else {
      // Waning
      for (let i = 0; i <= N; i++) {
        const ang = Math.PI / 2 - (i * Math.PI) / N;
        ctx.lineTo(cx - r * Math.cos(ang), cy + r * Math.sin(ang));
      }
      if (a < 1e-9) {
        ctx.lineTo(cx, cy - r);
      } else {
        const s = moreThanHalf ? 1 : -1;
        for (let i = 0; i <= N; i++) {
          const t = -Math.PI / 2 + (i * Math.PI) / N;
          ctx.lineTo(cx + s * a * Math.cos(t), cy + r * Math.sin(t));
        }
      }
    }

    ctx.closePath();
    ctx.fill();

    this.texture.needsUpdate = true;
  }
}
