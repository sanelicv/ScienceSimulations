import * as THREE from 'three';

export class Constellations extends THREE.Group {
  constructor(radius, url) {
    super();
    this.radius = radius;
    this.url = url;
    this.starsMaterial = null;
    this.linesMaterial = null;

    // Default Colors
    this.colors = {
      dark: 0x00FFFF, // Cyan for Dark Mode
      light: 0x0088AA // Dark Cyan/Blue for Light Mode
    };

    this.loadData();
  }

  async loadData() {
    try {
      const response = await fetch(this.url);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // header: 1 means array of arrays [ [A,B,C...], [A,B,C...] ]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Structure:
      // Col 0: Constellation Name
      // Col 1: Star Index
      // Col 2: RA
      // Col 3: Dec
      // Col 4+: Connection Indices

      const constellations = {}; // { "Aries": { stars: { id: Vector3 }, connections: [] } }

      // Process Rows (Skip header if any? Usually sheet_to_json handles keys if header exists, 
      // but user described columns. Let's assume raw data starts row 0 or 1.
      // We'll iterate and check data types.)

      rows.forEach((row, rowIndex) => {
        if (row.length < 4) return; // Skip empty/invalid rows

        const name = row[0];
        const index = row[1];
        const ra = Number(row[2]);
        const dec = Number(row[3]);

        // Validate numbers
        if (isNaN(ra) || isNaN(dec)) return;

        if (!constellations[name]) {
          constellations[name] = { stars: {}, connections: [] };
        }

        // Calculate Position
        const phi = (ra / 24) * Math.PI * 2;
        const theta = (dec * Math.PI) / 180;

        const x = this.radius * Math.cos(theta) * Math.cos(phi);
        const y = this.radius * Math.sin(theta);
        const z = this.radius * Math.cos(theta) * Math.sin(phi);
        const position = new THREE.Vector3(x, y, z);

        // Store Star
        constellations[name].stars[index] = position;

        // Parse Connections
        // Columns 4, 5, 6... contain indices to connect TO.
        for (let i = 4; i < row.length; i++) {
          const connectTo = row[i];
          if (connectTo !== undefined && connectTo !== null && connectTo !== '') {
            constellations[name].connections.push({ from: index, to: connectTo });
          }
        }
      });

      this.buildGeometry(constellations);

    } catch (error) {
      console.error("Error loading constellations:", error);
    }
  }

  buildGeometry(constellations) {
    // We can put all stars in one Points object and all lines in one LineSegments object
    // to match the requested style (all same color).

    const starVertices = [];
    const lineVertices = [];

    // Iterate Constellations
    Object.values(constellations).forEach(constellation => {
      // 1. Compile Stars
      Object.values(constellation.stars).forEach(vec => {
        starVertices.push(vec.x, vec.y, vec.z);
      });

      // 2. Compile Lines
      constellation.connections.forEach(conn => {
        const start = constellation.stars[conn.from];
        const end = constellation.stars[conn.to];

        if (start && end) {
          lineVertices.push(start.x, start.y, start.z);
          lineVertices.push(end.x, end.y, end.z);
        }
      });
    });

    // --- POINTS ---
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    this.starsMaterial = new THREE.PointsMaterial({
      color: this.colors.dark,
      size: 4,
      sizeAttenuation: false
    });
    this.add(new THREE.Points(starGeo, this.starsMaterial));

    // --- LINES ---
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
    this.linesMaterial = new THREE.LineBasicMaterial({
      color: this.colors.dark,
      transparent: true,
      opacity: 0.6
    });
    this.add(new THREE.LineSegments(lineGeo, this.linesMaterial));

    console.log("Zodiac Constellations Loaded");
  }

  updateTheme(isLight) {
    const color = isLight ? this.colors.light : this.colors.dark;

    if (this.starsMaterial) {
      this.starsMaterial.color.setHex(color);
    }
    if (this.linesMaterial) {
      this.linesMaterial.color.setHex(color);
    }
  }
}
