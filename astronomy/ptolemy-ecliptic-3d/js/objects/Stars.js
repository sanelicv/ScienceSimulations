import * as THREE from 'three';

export class Stars extends THREE.Group {
  constructor(radius, url) {
    super();
    this.radius = radius;
    this.url = url;
    this.loadStars();
  }

  async loadStars() {
    try {
      const response = await fetch(this.url);
      const arrayBuffer = await response.arrayBuffer();

      // Assuming XLSX is loaded globally (via CDN in index.html)
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const vertices = [];
      const colors = [];

      data.forEach(star => {
        const ra = star.ra; // Hours 0-24
        const dec = star.dec; // Degrees -90 to 90

        if (ra === undefined || dec === undefined) return;

        // Conversion to Cartesian mapping (matching p5 logic)
        // p5: 
        // phi = ra / 24 * TWO_PI
        // theta = radians(dec)
        // x = R * cos(phi) * sin(PI/2 - theta)
        // y = R * sin(phi) * sin(PI/2 - theta)
        // z = R * cos(PI/2 - theta)

        // Wait, sin(PI/2 - theta) = cos(theta)
        // cos(PI/2 - theta) = sin(theta)
        // So:
        // x = R * cos(phi) * cos(theta)
        // y = R * sin(phi) * cos(theta)
        // z = R * sin(theta)

        // p5 code lines 424-426:
        // xPos = sphereRadius * Math.cos(phi) * Math.sin(p.PI / 2 - theta);
        // yPos = sphereRadius * Math.sin(phi) * Math.sin(p.PI / 2 - theta);
        // zPos = sphereRadius * Math.cos(p.PI / 2 - theta);

        // Note: p5 WEBGL coordinates are often different. 
        // But in general 3D math:
        // If Z is up (like in p5 sometimes), then Z = R*sin(theta).
        // Let's implement standard mapping based on the p5 code provided.

        const phi = (ra / 24) * Math.PI * 2;
        const theta = (dec * Math.PI) / 180;

        // p5 used Y as up? No, usually Y is down in 2D, but in 3D...
        // The p5 camera setup was:
        // p.cameraUpVectorSpace = [0, 0, -1];  (Z is up/down?)

        // Let's adhere to the generated CelestialSphere grid which used Y as pole?
        // In my CelestialSphere.js:
        // RA Lines rotated around Y. So Y is the polar axis (North/South).
        // Equator was in XZ plane (y=0).

        // So for the stars to align with my grid:
        // Dec (theta) is angle from Equator (XZ plane).
        // y = R * sin(theta)
        // Radius in XZ plane = R * cos(theta)
        // x = (R * cos(theta)) * cos(phi)
        // z = (R * cos(theta)) * sin(phi)

        // This matches standard Y-up coordinate system.

        const x = this.radius * Math.cos(theta) * Math.cos(phi);
        const y = this.radius * Math.sin(theta);
        const z = this.radius * Math.cos(theta) * Math.sin(phi);

        vertices.push(x, y, z);

        // Color (white/cyan)
        colors.push(1, 1, 1);
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 3,
        sizeAttenuation: false,
        vertexColors: true
      });
      this.pointsMaterial = material;

      const points = new THREE.Points(geometry, material);
      this.add(points);

      console.log(`Loaded ${data.length} stars.`);

      // Hide indicator
      const indicator = document.getElementById('loading-indicator');
      if (indicator) indicator.style.display = 'none';

    } catch (error) {
      console.error("Error loading stars:", error);
      const indicator = document.getElementById('loading-indicator');
      if (indicator) indicator.textContent = "Error al cargar estrellas.";
    }
  }

  updateTheme(isLight) {
    if (this.pointsMaterial) {
      // In Vertex Colors mode, the material color acts as a multiplier.
      // White * White = White.
      // White * DarkGrey = DarkGrey.
      // So we can just tint the material to dim/darken stars in light mode.
      if (isLight) {
        this.pointsMaterial.color.setHex(0x333333); // Dark stars
      } else {
        this.pointsMaterial.color.setHex(0xffffff); // White stars
      }
    }
  }
}
