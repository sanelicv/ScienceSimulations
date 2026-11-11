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
      const initialSunLight = (window.CONFIG && window.CONFIG.SUN_LIGHT_INTENSITY !== undefined)
        ? window.CONFIG.SUN_LIGHT_INTENSITY
        : 3.5;
      this.sunLight = new THREE.PointLight(0xffffff, initialSunLight, 0, 0);
      this.physicalMesh = new THREE.Mesh(physicalGeometry, physicalMaterial);
      this.physicalMesh.add(this.sunLight);
    } else {
      // Planet: Standard Material for realistic directional lighting and terminator shadows
      const textureLoader = new THREE.TextureLoader();
      const texturePath = (orbitalParams && orbitalParams.texturePath)
        ? orbitalParams.texturePath
        : './assets/textures/512_venus.png';
      const texture = textureLoader.load(texturePath);

      physicalMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // Pure white so texture map colors render correctly
        map: texture,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x000000 // Zero emissive so shadow side is realistically dark
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

      const inclination = (orbitalParams && orbitalParams.inclination !== undefined) ? orbitalParams.inclination : 0;
      const nodeLong = (orbitalParams && orbitalParams.nodeLongitude !== undefined) ? orbitalParams.nodeLongitude : 0;

      if (inclination) {
        const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), nodeLong);
        const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
        const q3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -nodeLong);
        const orbitQuaternion = q3.multiply(q2).multiply(q1);

        if (this.deferentMesh) {
          this.deferentMesh.quaternion.copy(orbitQuaternion);
        }
        this.epicycleMesh.quaternion.copy(orbitQuaternion);
      }

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

    const inclination = (this.orbitalParams.inclination !== undefined) ? this.orbitalParams.inclination : 0;
    const nodeLongitude = (this.orbitalParams.nodeLongitude !== undefined) ? this.orbitalParams.nodeLongitude : 0;

    // --- Geocentric Calculation (2D Orbital Plane -> 3D Inclined System) ---
    const defAngle = deferentSpeed * time + deferentPhase;
    const defPos = new THREE.Vector3(deferentRadius * Math.cos(defAngle), 0, deferentRadius * Math.sin(defAngle));

    const epiAngle = epicycleSpeed * time + epicyclePhase;
    const epiPos = new THREE.Vector3(epicycleRadius * Math.cos(epiAngle), 0, epicycleRadius * Math.sin(epiAngle));

    const totalPos = new THREE.Vector3().addVectors(defPos, epiPos);

    if (inclination) {
      const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), nodeLongitude);
      const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
      const q3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -nodeLongitude);
      const orbitQuaternion = q3.multiply(q2).multiply(q1);

      defPos.applyQuaternion(orbitQuaternion);
      totalPos.applyQuaternion(orbitQuaternion);
    }

    // Update Physical Mesh Position
    this.physicalMesh.position.copy(totalPos);

    // Update Epicycle Center Position
    if (this.epicycleMesh) {
      this.epicycleMesh.position.copy(defPos);
    }
  }


  setSunLightIntensity(intensity) {
    if (this.sunLight) {
      this.sunLight.intensity = intensity;
    }
    if (window.CONFIG) window.CONFIG.SUN_LIGHT_INTENSITY = intensity;
    window.SUN_LIGHT_INTENSITY = intensity;
  }

  setPhysicalRadius(radius) {
    if (this.physicalMesh) {
      this.physicalMesh.geometry.dispose();
      this.physicalMesh.geometry = new THREE.SphereGeometry(radius, 32, 32);
    }
  }

  updateOrbitalRadii(deferentRadius, epicycleRadius) {
    if (deferentRadius !== undefined) this.orbitalParams.deferentRadius = deferentRadius;
    if (epicycleRadius !== undefined) this.orbitalParams.epicycleRadius = epicycleRadius;

    const currentDefR = this.orbitalParams.deferentRadius;
    const currentEpiR = this.orbitalParams.epicycleRadius;

    let tubeRadius;
    if (this.isFollowingMode) {
      tubeRadius = (window.CONFIG && window.CONFIG.FOLLOW_ORBIT_TUBE_RADIUS !== undefined) ? window.CONFIG.FOLLOW_ORBIT_TUBE_RADIUS : 1.0;
    } else {
      tubeRadius = (window.CONFIG && window.CONFIG.ORBIT_TUBE_RADIUS !== undefined) ? window.CONFIG.ORBIT_TUBE_RADIUS : 0.5;
    }

    const tubeRadialSegments = 8;
    const tubeTubularSegments = 128;

    const createCirclePoints = (radius, segments) => {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
      }
      return points;
    };

    if (this.deferentMesh && currentDefR !== undefined && currentDefR > 0) {
      const defPoints = createCirclePoints(currentDefR, 128);
      const defCurve = new THREE.CatmullRomCurve3(defPoints);
      defCurve.closed = true;
      this.deferentMesh.geometry.dispose();
      this.deferentMesh.geometry = new THREE.TubeGeometry(defCurve, tubeTubularSegments, tubeRadius, tubeRadialSegments, true);
    }

    if (this.epicycleMesh && currentEpiR !== undefined && currentEpiR > 0) {
      const epiPoints = createCirclePoints(currentEpiR, 64);
      const epiCurve = new THREE.CatmullRomCurve3(epiPoints);
      epiCurve.closed = true;
      this.epicycleMesh.geometry.dispose();
      this.epicycleMesh.geometry = new THREE.TubeGeometry(epiCurve, 64, tubeRadius, tubeRadialSegments, true);
    }
  }

  setFollowMode(isFollowing) {
    this.isFollowingMode = isFollowing;
    this.updateOrbitalRadii(this.orbitalParams.deferentRadius, this.orbitalParams.epicycleRadius);
  }

  setOrbitTubeRadius(radius) {
    if (window.CONFIG) window.CONFIG.ORBIT_TUBE_RADIUS = radius;
    window.ORBIT_TUBE_RADIUS = radius;
    window.ORBIT_TUBE_WIDTH = radius;
    this.updateOrbitalRadii(this.orbitalParams.deferentRadius, this.orbitalParams.epicycleRadius);
  }

  updateTheme(isLight) {
    // Planets physical mesh always keeps white material base to show full textures under Sun light
    if (this.physicalMesh) {
      this.physicalMesh.material.color.setHex(0xffffff);
    }

    // Update orbit lines color based on theme
    const lineColor = isLight ? 0x333333 : 0xcccccc;
    if (this.deferentMesh) this.deferentMesh.material.color.setHex(lineColor);
    if (this.epicycleMesh) this.epicycleMesh.material.color.setHex(lineColor);
  }

  toggleOrbits(visible) {
    if (this.deferentMesh) this.deferentMesh.visible = visible;
    if (this.epicycleMesh) this.epicycleMesh.visible = visible;
  }
}
