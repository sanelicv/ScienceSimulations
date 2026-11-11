import * as THREE from 'three';

export class Planet extends THREE.Group {
  constructor(sphereRadius, color, size, orbitalParams) {
    super();
    this.sphereRadius = sphereRadius;

    // orbitalParams expects:
    // { deferentRadius, epicycleRadius, deferentSpeed, epicycleSpeed, deferentPhase, epicyclePhase }
    this.orbitalParams = orbitalParams;
    const { deferentRadius, epicycleRadius } = orbitalParams;

    // 1. The Physical Planet (Sphere in 3D space)
    // Check if Custom Color is Sun (#FFD700)
    const isSun = new THREE.Color(color).getHexString() === 'ffd700';

    const physicalGeometry = new THREE.SphereGeometry(size / 2, 32, 32);

    let physicalMaterial;
    if (isSun) {
      // Sun: BASIC Material for max brightness
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load('assets/textures/sun_2k.jpg');

      physicalMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xffffff
      });

      // Add PointLight to Sun
      // Decay 0 = No physical falloff (infinite), ensuring light reaches far planets
      const sunLight = new THREE.PointLight(0xffffff, 1.5, 0, 0);
      this.physicalMesh = new THREE.Mesh(physicalGeometry, physicalMaterial);
      this.physicalMesh.add(sunLight);
    } else {
      // Planet: PHONG Material
      const textureLoader = new THREE.TextureLoader();
      const texturePath = orbitalParams.texturePath || './assets/textures/512_neptune.png';
      const texture = textureLoader.load(texturePath);

      physicalMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff, // White to show texture colors
        map: texture,
        specular: 0x333333,
        shininess: 50,
        emissive: 0x444444 // Increased emissive for better visibility
      });
      this.physicalMesh = new THREE.Mesh(physicalGeometry, physicalMaterial);
    }

    this.add(this.physicalMesh);

    // 2. Visualization Lines (Deferent & Epicycle) - Now 3D Tubes
    const tubeRadius = 1; // Thickness of the orbit tube
    const tubeRadialSegments = 8; // Cross-section resolution
    const tubeTubularSegments = 128; // Length resolution

    // Helper to create circular path points
    const createCirclePoints = (radius, segments) => {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        // Create on XZ plane directly: x = cos, z = sin
        points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
      }
      return points;
    };

    // Material for tubes - Phong for 3D lighting interaction
    const tubeMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.2), // Slight glow
      specular: 0x111111,
      shininess: 30,
      transparent: true,
      opacity: 0.8
    });

    // Deferent Tube
    if (deferentRadius > 0) {
      const defPoints = createCirclePoints(deferentRadius, 128);
      // Close the loop explicitly for CatmullRom if needed, or rely on Closed boolean
      const defCurve = new THREE.CatmullRomCurve3(defPoints);
      defCurve.closed = true;

      const defGeo = new THREE.TubeGeometry(defCurve, tubeTubularSegments, tubeRadius, tubeRadialSegments, true);
      // No rotation needed if points are already on XZ

      this.deferentMesh = new THREE.Mesh(defGeo, tubeMaterial.clone()); // Clone material to allow individual color updates if needed
      this.add(this.deferentMesh);
    }

    // Epicycle Tube
    if (epicycleRadius > 0) {
      const epiPoints = createCirclePoints(epicycleRadius, 64);
      const epiCurve = new THREE.CatmullRomCurve3(epiPoints);
      epiCurve.closed = true;

      const epiGeo = new THREE.TubeGeometry(epiCurve, 64, tubeRadius, tubeRadialSegments, true);

      this.epicycleMesh = new THREE.Mesh(epiGeo, tubeMaterial.clone());
      this.add(this.epicycleMesh);
    }

    // Store original color for theming
    this.baseColor = new THREE.Color(color);
  }

  update(time) {
    const {
      deferentRadius,
      epicycleRadius,
      deferentSpeed,
      epicycleSpeed,
      deferentPhase = 0,
      epicyclePhase = 0
    } = this.orbitalParams;

    // --- Geocentric Calculation ---
    // 1. Deferent Center (Center of the epicycle)
    const defAngle = deferentSpeed * time + deferentPhase;
    const defX = deferentRadius * Math.cos(defAngle);
    const defZ = deferentRadius * Math.sin(defAngle);

    // 2. Planet Position (Relative to Deferent Center)
    const epiAngle = epicycleSpeed * time + epicyclePhase;
    const epiX = epicycleRadius * Math.cos(epiAngle);
    const epiZ = epicycleRadius * Math.sin(epiAngle);

    // 3. Absolute Position
    const x = defX + epiX;
    const z = defZ + epiZ;
    const y = 0;

    // Update Physical Mesh
    this.physicalMesh.position.set(x, y, z);

    // Update Epicycle Visualization Position
    if (this.epicycleMesh) {
      this.epicycleMesh.position.set(defX, 0, defZ);
    }
  }

  updateTheme(isLight) {
    // Determine target color based on baseColor and mode
    let targetColor;

    // Check if it's the Sun (approximate check by hex if passed as string previously, or just check generic logic)
    // Here we can use this.baseColor set in constructor
    const isYellow = this.baseColor.getHexString() === 'ffd700';

    if (isYellow) {
      // Sun stays white to show texture
      targetColor = 0xffffff;
    } else {
      // Planets switch black/white
      targetColor = isLight ? 0x000000 : 0xFFFFFF;
    }

    if (this.physicalMesh) this.physicalMesh.material.color.setHex(targetColor);

    // Update lines too
    if (this.deferentMesh) this.deferentMesh.material.color.setHex(targetColor);
    if (this.epicycleMesh) this.epicycleMesh.material.color.setHex(targetColor);
  }

  toggleOrbits(visible) {
    if (this.deferentMesh) this.deferentMesh.visible = visible;
    if (this.epicycleMesh) this.epicycleMesh.visible = visible;
  }
}
