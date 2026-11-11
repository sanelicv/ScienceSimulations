import * as THREE from 'three';

const parseColor = (col) => {
  if (typeof col === 'string' && col.startsWith('#') && col.length === 9) {
    col = col.substring(0, 7);
  }
  return new THREE.Color(col);
};

export class Planet extends THREE.Group {
  constructor(sphereRadius, color, size, orbitalParams) {
    super();
    this.sphereRadius = sphereRadius;

    // orbitalParams expects:
    // { deferentRadius, epicycleRadius, deferentSpeed, epicycleSpeed, deferentPhase, epicyclePhase }
    this.orbitalParams = orbitalParams;
    const { deferentRadius, epicycleRadius } = orbitalParams;

    const parsedColor = parseColor(color);
    this.baseColor = parsedColor;

    // 1. The Physical Planet (Sphere in 3D space)
    // Check if Custom Color is Sun (#FFD700)
    const isSun = parsedColor.getHexString() === 'ffd700';

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
      const initialSunLight = (window.CONFIG && window.CONFIG.SUN_LIGHT_INTENSITY !== undefined)
        ? window.CONFIG.SUN_LIGHT_INTENSITY
        : 10;
      this.sunLight = new THREE.PointLight(0xffffff, initialSunLight, 0, 0);
      this.physicalMesh = new THREE.Mesh(physicalGeometry, physicalMaterial);
      this.physicalMesh.add(this.sunLight);
    } else {
      // Planet: Standard Material for real 3D day/night phases
      const textureLoader = new THREE.TextureLoader();
      const texturePath = orbitalParams.texturePath || './assets/textures/512_venus_atmosphere.png';
      const texture = textureLoader.load(texturePath);

      physicalMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // White to show texture colors
        map: texture,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x000000 // Sin luz propia para sombra real
      });
      this.physicalMesh = new THREE.Mesh(physicalGeometry, physicalMaterial);
    }

    this.add(this.physicalMesh);

    // 2. Visualization Lines (Deferent & Epicycle) - Now 3D Tubes
    const tubeRadius = (window.CONFIG && window.CONFIG.ORBIT_TUBE_RADIUS !== undefined) ? window.CONFIG.ORBIT_TUBE_RADIUS : 2; // Thickness of the orbit tube
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
      color: parsedColor,
      emissive: parsedColor.clone().multiplyScalar(0.2), // Slight glow
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
    // Keep planet mesh color as pure white to preserve texture colors
    if (this.physicalMesh && !this.sunLight) {
      this.physicalMesh.material.color.setHex(0xffffff);
    }

    // Maintain orbit custom colors (baseColor) across themes
    if (this.deferentMesh) {
      this.deferentMesh.material.color.copy(this.baseColor);
      this.deferentMesh.material.emissive.copy(this.baseColor).multiplyScalar(0.2);
    }
    if (this.epicycleMesh) {
      this.epicycleMesh.material.color.copy(this.baseColor);
      this.epicycleMesh.material.emissive.copy(this.baseColor).multiplyScalar(0.2);
    }
  }

  toggleOrbits(visible) {
    this.orbitsVisible = (visible !== undefined) ? visible : (this.orbitsVisible !== undefined ? this.orbitsVisible : true);
    if (this.isLineMode) {
      if (this.deferentMesh) this.deferentMesh.visible = false;
      if (this.epicycleMesh) this.epicycleMesh.visible = false;
      if (this.deferentLine) this.deferentLine.visible = this.orbitsVisible;
      if (this.epicycleLine) this.epicycleLine.visible = this.orbitsVisible;
    } else {
      if (this.deferentLine) this.deferentLine.visible = false;
      if (this.epicycleLine) this.epicycleLine.visible = false;
      if (this.deferentMesh) this.deferentMesh.visible = this.orbitsVisible;
      if (this.epicycleMesh) this.epicycleMesh.visible = this.orbitsVisible;
    }
  }

  setSunLightIntensity(intensity) {
    if (this.sunLight) this.sunLight.intensity = intensity;
    if (window.CONFIG) window.CONFIG.SUN_LIGHT_INTENSITY = intensity;
    window.SUN_LIGHT_INTENSITY = intensity;
  }

  setPhysicalRadius(radius) {
    if (this.physicalMesh) {
      this.physicalMesh.geometry.dispose();
      this.physicalMesh.geometry = new THREE.SphereGeometry(radius, 32, 32);
    }
  }

  updateOrbitalRadii(deferentRadius, epicycleRadius, customTubeRadius, customTubularSegments, isLineMode) {
    if (deferentRadius !== undefined) this.orbitalParams.deferentRadius = deferentRadius;
    if (epicycleRadius !== undefined) this.orbitalParams.epicycleRadius = epicycleRadius;
    if (isLineMode !== undefined) this.isLineMode = isLineMode;

    const currentDefR = this.orbitalParams.deferentRadius;
    const currentEpiR = this.orbitalParams.epicycleRadius;

    const tubeRadius = (customTubeRadius !== undefined)
      ? customTubeRadius
      : ((window.CONFIG && window.CONFIG.ORBIT_TUBE_RADIUS !== undefined) ? window.CONFIG.ORBIT_TUBE_RADIUS : 2);
    const tubularSegments = (customTubularSegments !== undefined) ? customTubularSegments : 128;
    const lineWidth = (window.CONFIG && window.CONFIG.REALISTIC_ORBIT_LINE_WIDTH !== undefined)
      ? window.CONFIG.REALISTIC_ORBIT_LINE_WIDTH : 0.5;

    const createCirclePoints = (radius, segments) => {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
      }
      return points;
    };

    const isVisible = (this.orbitsVisible !== undefined) ? this.orbitsVisible : true;

    if (this.isLineMode) {
      if (this.deferentMesh) this.deferentMesh.visible = false;
      if (this.epicycleMesh) this.epicycleMesh.visible = false;

      if (currentDefR !== undefined && currentDefR > 0) {
        const points = createCirclePoints(currentDefR, tubularSegments);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        if (!this.deferentLine) {
          const lineMat = new THREE.LineBasicMaterial({
            color: this.baseColor,
            linewidth: lineWidth,
            transparent: true,
            opacity: 0.8
          });
          this.deferentLine = new THREE.LineLoop(lineGeo, lineMat);
          this.add(this.deferentLine);
        } else {
          this.deferentLine.geometry.dispose();
          this.deferentLine.geometry = lineGeo;
          this.deferentLine.material.linewidth = lineWidth;
        }
        this.deferentLine.visible = isVisible;
      }
    } else {
      if (this.deferentLine) this.deferentLine.visible = false;
      if (this.epicycleLine) this.epicycleLine.visible = false;

      if (currentDefR !== undefined && currentDefR > 0) {
        const points = createCirclePoints(currentDefR, tubularSegments);
        const defCurve = new THREE.CatmullRomCurve3(points);
        defCurve.closed = true;
        const defGeo = new THREE.TubeGeometry(defCurve, tubularSegments, tubeRadius, 8, true);

        if (!this.deferentMesh) {
          const tubeMaterial = new THREE.MeshPhongMaterial({
            color: this.baseColor,
            emissive: this.baseColor.clone().multiplyScalar(0.2),
            specular: 0x111111,
            shininess: 30,
            transparent: true,
            opacity: 0.8
          });
          this.deferentMesh = new THREE.Mesh(defGeo, tubeMaterial);
          this.add(this.deferentMesh);
        } else {
          this.deferentMesh.geometry.dispose();
          this.deferentMesh.geometry = defGeo;
        }
        this.deferentMesh.visible = isVisible;
      }
    }
  }

  setOrbitTubeRadius(radius) {
    if (window.CONFIG) window.CONFIG.ORBIT_TUBE_RADIUS = radius;
    window.ORBIT_TUBE_RADIUS = radius;
    window.ORBIT_TUBE_WIDTH = radius;
    this.updateOrbitalRadii(this.orbitalParams.deferentRadius, this.orbitalParams.epicycleRadius);
  }

  setOrbitColor(colorHex) {
    const c = parseColor(colorHex);
    this.baseColor = c;
    if (this.deferentMesh) {
      this.deferentMesh.material.color.copy(c);
      this.deferentMesh.material.emissive.copy(c).multiplyScalar(0.2);
    }
    if (this.deferentLine) {
      this.deferentLine.material.color.copy(c);
    }
    if (this.epicycleMesh) {
      this.epicycleMesh.material.color.copy(c);
      this.epicycleMesh.material.emissive.copy(c).multiplyScalar(0.2);
    }
    if (this.epicycleLine) {
      this.epicycleLine.material.color.copy(c);
    }
  }
}
