import * as THREE from 'three';

export class Constellations extends THREE.Group {
  constructor(radius, url) {
    super();
    this.radius = radius;
    this.url = url;
    this.starsMaterial = null;
    this.linesMaterial = null;
    this.data = null; // Store parsed data to rebuild on resize

    // Colors
    this.colors = {
      default: 0xFFD700, // Gold for Zodiac
    };

    this.isLocalMode = false;
    this.showInGlobalMode = false;
    this.userEnabled = true; // Enabled by default so when shown it displays lines
    this.visible = false; // Hidden by default
    this.loadData();
  }

  async loadData() {
    try {
      const response = await fetch(this.url);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Structure expected:
      // Col 0: Constellation Name
      // Col 1: Star Index (ID - Local to constellation)
      // Col 2: RA (hours)
      // Col 3: Dec (degrees)
      // Col 4+: Connection Indices (Star IDs to connect to within same constellation)

      this.data = {}; // { ConstellationName: { id: { ra, dec, connections: [] } } }

      rows.forEach((row, rowIndex) => {
        if (!row || row.length < 4) return;

        // Skip header if first row is text
        if (rowIndex === 0 && typeof row[2] === 'string') return;

        const constName = row[0];
        const id = row[1];
        const ra = parseFloat(row[2]);
        const dec = parseFloat(row[3]);

        if (!constName || id === undefined || isNaN(ra) || isNaN(dec)) return;

        // Initialize Constellation group if needed
        if (!this.data[constName]) {
          this.data[constName] = {};
        }

        const connections = [];
        for (let i = 4; i < row.length; i++) {
          const conn = row[i];
          if (conn !== undefined && conn !== null && conn !== '') {
            connections.push(conn);
          }
        }

        this.data[constName][id] = { ra, dec, connections };
      });

      this.buildGeometry();

    } catch (error) {
      console.error("Error loading constellations:", error);
    }
  }

  updateRadius(radius) {
    this.radius = radius;
    if (this.data) {
      this.buildGeometry();
    }
  }

  buildGeometry() {
    // Clear existing
    this.clear();

    if (!this.data) return;

    // Materials
    this.linesMaterial = new THREE.LineBasicMaterial({
      color: this.colors.default,
      transparent: true,
      opacity: 0.6,
      depthWrite: false // Prevent occlusion with grid
    });

    const lineVertices = [];

    // Helper to calculate position on sphere surface
    const getPosition = (ra, dec) => {
      const phi = (ra / 24) * Math.PI * 2; // RA to radians
      const theta = (dec * Math.PI) / 180; // Dec to radians

      // Standard conversion
      const x = this.radius * Math.cos(theta) * Math.cos(phi);
      const y = this.radius * Math.sin(theta);
      const z = -this.radius * Math.cos(theta) * Math.sin(phi);

      return new THREE.Vector3(x, y, z);
    };

    // Iterate Constellations
    Object.keys(this.data).forEach(constName => {
      const stars = this.data[constName];

      // Iterate Stars in Constellation
      Object.keys(stars).forEach(id => {
        const star = stars[id];
        const pos = getPosition(star.ra, star.dec);

        // 1. Draw Star
        this.addStarCircle(pos);

        // 2. Collect Lines (Local scope connections)
        star.connections.forEach(targetId => {
          const target = stars[targetId]; // Look up IN THIS CONSTELLATION
          if (target) {
            const targetPos = getPosition(target.ra, target.dec);
            lineVertices.push(pos.x, pos.y, pos.z);
            lineVertices.push(targetPos.x, targetPos.y, targetPos.z);
          }
        });
      });
    });

    // Create Lines Geometry
    if (lineVertices.length > 0) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
      const lines = new THREE.LineSegments(lineGeo, this.linesMaterial);
      this.add(lines);
    }

    // Ensure visibility state is maintained
    this.visible = this.visible;
  }

  addStarCircle(position) {
    // Create a small circle
    const circleRadius = this.radius * 0.015; // 1.5% of sphere radius
    const curve = new THREE.EllipseCurve(
      0, 0,
      circleRadius, circleRadius,
      0, 2 * Math.PI,
      false,
      0
    );

    const points = curve.getPoints(16);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: this.colors.default,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    const circle = new THREE.Line(geometry, material);

    // Orient the circle to be tangent to the sphere surface at 'position'
    // The default ellipse is on XY plane. center at 0,0.
    // We move it to 'position'.
    // We look at 'center' (0,0,0) from 'position'.

    circle.position.copy(position);
    circle.lookAt(0, 0, 0); // Z axis points to center

    this.add(circle);
  }

  toggle(visible) {
    this.userEnabled = visible;
    this.visible = !!this.userEnabled;
  }

  setLocalMode(isLocal) {
    this.isLocalMode = isLocal;
    this.visible = !!this.userEnabled;
  }
}
