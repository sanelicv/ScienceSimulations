import * as THREE from 'three';

export class CelestialSphere extends THREE.Group {
  constructor(radius) {
    super();
    this.radius = radius;
    this.createEquatorialGrid();
    this.createAzimuthalGrid(); // New fixed grid for local view
    this.createEcliptic();
    this.createEquator();
    this.createVernalPoint();
  }

  updateTheme(isLight) {
    // Update Grid Colors
    const gridColor = isLight ? 0x8888AA : 0xccccff;
    const gridOpacity = isLight ? 0.4 : 0.3;

    if (this.gridMaterial) {
      this.gridMaterial.color.setHex(gridColor);
      this.gridMaterial.opacity = gridOpacity;
    }
    if (this.azimuthalMaterial) {
      this.azimuthalMaterial.color.setHex(gridColor);
      this.azimuthalMaterial.opacity = gridOpacity;
    }
  }

  update(skyGroup) {
    if (this.azimuthalGrid && this.azimuthalGrid.visible) {
      // The sphere is a child of skyGroup.
      // To keep azimuthalGrid fixed in world space (horizon),
      // its world quaternion must be Identity (or aligned with horizon).
      // Since its parent (CelestialSphere) and grandparent (skyGroup) rotate,
      // we set its local quaternion to the inverse of its world-parent's quaternion.

      this.azimuthalGrid.quaternion.copy(skyGroup.quaternion).invert();
    }

    if (this.vernalPoint && this.equator && this.ecliptic) {
      this.vernalPoint.visible = this.equator.visible && this.ecliptic.visible;
    }
  }

  createEquator() {
    const material = new THREE.MeshBasicMaterial({ color: 0x00FFFF }); // Cyan
    const points = [];
    const segmentCount = 128;

    for (let i = 0; i < segmentCount; i++) {
      const theta = (i / segmentCount) * Math.PI * 2;
      const x = this.radius * Math.cos(theta);
      const y = this.radius * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, 0)); // was x, 0, z
    }

    const path = new THREE.CatmullRomCurve3(points, true);
    const tubeRadius = this.radius * 0.00150; // Width of the line (configurable)
    const geometry = new THREE.TubeGeometry(path, segmentCount, tubeRadius, 8, true);

    this.equator = new THREE.Mesh(geometry, material);
    this.add(this.equator);
  }

  createEquatorialGrid() {
    const material = new THREE.LineBasicMaterial({ color: 0xccccff, transparent: true, opacity: 0.3 });
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
          r * Math.cos(theta) * Math.sin(angle),
          r * Math.sin(theta)
        );

        const thetaNext = ((k + 1) / segmentCount) * Math.PI * 2;
        vertices.push(
          r * Math.cos(thetaNext) * Math.cos(angle),
          r * Math.cos(thetaNext) * Math.sin(angle),
          r * Math.sin(thetaNext)
        );
      }
    }

    // Dec Circles (Latitudes)
    // Every 15 degrees: -90, -75, ..., 90
    for (let j = -6; j <= 6; j++) {
      if (j === 0) continue; // Equator drawn separately or included
      const dec = j * 15 * (Math.PI / 180);
      const r = this.radius * Math.cos(dec);
      const z = this.radius * Math.sin(dec); // was y

      const segmentCount = 64;
      for (let k = 0; k < segmentCount; k++) {
        const ra = (k / segmentCount) * Math.PI * 2;
        const raNext = ((k + 1) / segmentCount) * Math.PI * 2;

        vertices.push(r * Math.cos(ra), r * Math.sin(ra), z); // was r*cos, y, r*sin
        vertices.push(r * Math.cos(raNext), r * Math.sin(raNext), z);
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
      vertices.push(rEq * Math.cos(ra), rEq * Math.sin(ra), 0); // was cos, 0, sin
      vertices.push(rEq * Math.cos(raNext), rEq * Math.sin(raNext), 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.gridMaterial = material;
    this.equatorialGrid = new THREE.LineSegments(geometry, material);
    this.add(this.equatorialGrid);
  }

  createAzimuthalGrid() {
    const material = new THREE.LineBasicMaterial({ color: 0xccccff, transparent: true, opacity: 0.3 });
    const vertices = [];

    // Azimuth Lines (Vertical circles meeting at Zenith/Nadir)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const segmentCount = 64;
      for (let k = 0; k <= segmentCount; k++) {
        const theta = (k / segmentCount) * Math.PI * 2;
        const r = this.radius;

        vertices.push(
          r * Math.cos(theta) * Math.cos(angle),
          r * Math.cos(theta) * Math.sin(angle),
          r * Math.sin(theta)
        );

        const thetaNext = ((k + 1) / segmentCount) * Math.PI * 2;
        vertices.push(
          r * Math.cos(thetaNext) * Math.cos(angle),
          r * Math.cos(thetaNext) * Math.sin(angle),
          r * Math.sin(thetaNext)
        );
      }
    }

    // Altitude Circles (Horizontals)
    for (let j = -6; j <= 6; j++) {
      if (j === 0) continue;
      const alt = j * 15 * (Math.PI / 180);
      const r = this.radius * Math.cos(alt);
      const z = this.radius * Math.sin(alt);

      const segmentCount = 64;
      for (let k = 0; k < segmentCount; k++) {
        const ra = (k / segmentCount) * Math.PI * 2;
        const raNext = ((k + 1) / segmentCount) * Math.PI * 2;

        vertices.push(r * Math.cos(ra), r * Math.sin(ra), z);
        vertices.push(r * Math.cos(raNext), r * Math.sin(raNext), z);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.azimuthalMaterial = material;
    this.azimuthalGrid = new THREE.LineSegments(geometry, material);
    this.azimuthalGrid.visible = false; // Hidden by default
    // This grid will be added to sceneManager.scene directly (un-rotated) 
    // or handled via parent logic in main.js. 
    // Actually, adding it as child of 'this' (the sphere group) means it rotates WITH the sphere.
    // To make it FIXED to horizontal, we must NOT add it to this group if 'this' is rotated.
    // However, in main.js skyGroup is rotated, and sphere is in skyGroup.
    // So AzimuthalGrid should probably be a separate object or added to the scene directly.
    this.add(this.azimuthalGrid);
  }

  createEcliptic() {
    const material = new THREE.MeshBasicMaterial({ color: 0xffa500 }); // Orange
    const points = [];
    const segmentCount = 128;

    // Create a flat circle in the XY plane (aligned with Equator initially)
    for (let i = 0; i < segmentCount; i++) {
      const lambda = (i / segmentCount) * Math.PI * 2;
      const x = this.radius * Math.cos(lambda);
      const y = this.radius * Math.sin(lambda);
      points.push(new THREE.Vector3(x, y, 0)); // was x, 0, z
    }

    const path = new THREE.CatmullRomCurve3(points, true);
    const tubeRadius = this.radius * 0.00150; // Width of the ecliptic line (configurable)
    const geometry = new THREE.TubeGeometry(path, segmentCount, tubeRadius, 8, true);

    this.ecliptic = new THREE.Mesh(geometry, material); // Store as property
    this.add(this.ecliptic);
  }

  createVernalPoint() {
    // Small red circle/sphere at (this.radius, 0, 0)
    const geometry = new THREE.SphereGeometry(this.radius * 0.005, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red

    this.vernalPoint = new THREE.Mesh(geometry, material);
    this.vernalPoint.position.set(this.radius, 0, 0);
    this.add(this.vernalPoint);
  }
}
