import * as THREE from 'three';

export class CelestialSphere extends THREE.Group {
  constructor(radius) {
    super();
    this.radius = radius;
    this.createEquatorialGrid();
    this.createEcliptic();
    //this.createVernalPoint();
  }

  updateTheme(isLight) {
    // Update Grid Color
    if (this.gridMaterial) {
      const color = isLight ? 0x8888AA : 0xccccff; // Darker blue for light mode
      this.gridMaterial.color.setHex(color);
      this.gridMaterial.opacity = isLight ? 0.4 : 0.3;
    }
    // Ecliptic/Equator could stay same or adjust if needed.
    // Orange and Cyan are generally visible on both, maybe slightly adjust brightness.
  }

  createEquatorialGrid() {
    this.gridMaterial = new THREE.LineBasicMaterial({ color: 0xccccff, transparent: true, opacity: 0.3 });
    const vertices = [];

    // RA Lines (Longitudes) - 24 hours
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;

      // Vertical circles (RA lines)
      const segmentCount = 64;

      // A meridian is a circle passing through poles
      // Rotate circle in YZ plane around Y axis by 'angle'.

      for (let k = 0; k <= segmentCount; k++) {
        const theta = (k / segmentCount) * Math.PI * 2;
        const r = this.radius;

        vertices.push(
          r * Math.cos(theta) * Math.cos(angle),
          r * Math.sin(theta),
          r * Math.cos(theta) * Math.sin(angle)
        );

        const thetaNext = ((k + 1) / segmentCount) * Math.PI * 2;
        vertices.push(
          r * Math.cos(thetaNext) * Math.cos(angle),
          r * Math.sin(thetaNext),
          r * Math.cos(thetaNext) * Math.sin(angle)
        );
      }
    }

    // Dec Circles (Latitudes)
    // Every 15 degrees: -90, -75, ..., 90
    for (let j = -6; j <= 6; j++) {
      if (j === 0) continue; // Equator drawn separately or included
      const dec = j * 15 * (Math.PI / 180);
      const r = this.radius * Math.cos(dec);
      const y = this.radius * Math.sin(dec);

      const segmentCount = 64;
      for (let k = 0; k < segmentCount; k++) {
        const ra = (k / segmentCount) * Math.PI * 2;
        const raNext = ((k + 1) / segmentCount) * Math.PI * 2;

        vertices.push(r * Math.cos(ra), y, r * Math.sin(ra));
        vertices.push(r * Math.cos(raNext), y, r * Math.sin(raNext));
      }
    }

    // Equator (emphasized)
    // Handled in separate loop or just keep in same geometry. 
    // Let's add equator here too.
    const rEq = this.radius;
    const segmentCount = 128;
    for (let k = 0; k < segmentCount; k++) {
      const ra = (k / segmentCount) * Math.PI * 2;
      const raNext = ((k + 1) / segmentCount) * Math.PI * 2;
      vertices.push(rEq * Math.cos(ra), 0, rEq * Math.sin(ra));
      vertices.push(rEq * Math.cos(raNext), 0, rEq * Math.sin(raNext));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.grid = new THREE.LineSegments(geometry, this.gridMaterial);
    this.add(this.grid);
  }

  createEcliptic() {
    const material = new THREE.LineBasicMaterial({ color: 0xffa500 }); // Orange
    const points = [];
    const segmentCount = 128;

    // Create a flat circle in the XZ plane (aligned with Equator initially)
    for (let i = 0; i <= segmentCount; i++) {
      const lambda = (i / segmentCount) * Math.PI * 2;
      const x = this.radius * Math.cos(lambda);
      const z = this.radius * Math.sin(lambda);
      points.push(new THREE.Vector3(x, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.ecliptic = new THREE.Line(geometry, material); // Store as property
    this.add(this.ecliptic);
  }

  createVernalPoint() {
    // Line from origin to (R, 0, 0)
    const material = new THREE.LineBasicMaterial({ color: 0xff6666 });
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(this.radius, 0, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    this.add(line);
  }
}
