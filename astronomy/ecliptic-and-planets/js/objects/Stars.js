import * as THREE from 'three';

export class Stars extends THREE.Group {
  constructor(radius, url, starDiameter = 3) {
    super();
    this.radius = radius;
    this.url = url;
    this.starDiameter = starDiameter;
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

      // We filter out valid stars first
      const validStars = [];
      data.forEach(star => {
        if (star.ra !== undefined && star.dec !== undefined) {
          validStars.push(star);
        }
      });

      const starCount = validStars.length;

      // Circle geometry and basic material
      // We use 8 segments to look like a circle from afar, enough detailing but low poly count.
      const geometry = new THREE.CircleGeometry(this.starDiameter / 2, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      });

      this.instancedMesh = new THREE.InstancedMesh(geometry, material, starCount);
      // Let's set the matrix explicitly so it can be updated
      this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const dummy = new THREE.Object3D();
      const color = new THREE.Color(1, 1, 1);

      validStars.forEach((star, index) => {
        const ra = star.ra; // Hours 0-24
        const dec = star.dec; // Degrees -90 to 90

        const phi = (ra / 24) * Math.PI * 2;
        const theta = (dec * Math.PI) / 180;

        const x = this.radius * Math.cos(theta) * Math.cos(phi);
        const y = this.radius * Math.cos(theta) * Math.sin(phi); // swapped from z
        const z = this.radius * Math.sin(theta); // swapped from y

        dummy.position.set(x, y, z);
        // Make the circle face the center, just like Planet.js does
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();

        this.instancedMesh.setMatrixAt(index, dummy.matrix);
        this.instancedMesh.setColorAt(index, color);
      });

      // Update the instance matrix
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }

      this.add(this.instancedMesh);

      console.log(`Loaded ${starCount} stars as circles.`);

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
    if (this.instancedMesh && this.instancedMesh.material) {
      if (isLight) {
        this.instancedMesh.material.color.setHex(0x333333); // Dark stars
      } else {
        this.instancedMesh.material.color.setHex(0xffffff); // White stars
      }
    }
  }
}
