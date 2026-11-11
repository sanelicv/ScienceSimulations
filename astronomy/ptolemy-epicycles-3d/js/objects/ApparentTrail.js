import * as THREE from 'three';

export class ApparentTrail extends THREE.Group {
  constructor(sphereRadius = 20000) {
    super();
    this.radius = sphereRadius;

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: (window.CONFIG && window.CONFIG.APPARENT_TRAIL_COLOR) || '#ff3333',
      size: (window.CONFIG && window.CONFIG.APPARENT_TRAIL_POINT_SIZE) || 8,
      sizeAttenuation: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // Prevent frustum culling from hiding trail
    this.frustumCulled = false;
    this.add(this.points);

    this.visible = false;
    this.allocatedSamples = 0;
  }

  update(planet, currentTime, sphereRadius) {
    if (!this.visible || !planet || !planet.orbitalParams) return;

    const R = sphereRadius || (window.CONFIG && window.CONFIG.SPHERE_RADIUS) || this.radius;
    const days = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_DAYS !== undefined) ? window.CONFIG.APPARENT_TRAIL_DAYS : 30;
    const samplesPerDay = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_SAMPLES_PER_DAY !== undefined) ? window.CONFIG.APPARENT_TRAIL_SAMPLES_PER_DAY : 1;
    const colorHex = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_COLOR) || '#ff3333';
    const pointSize = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_POINT_SIZE !== undefined) ? window.CONFIG.APPARENT_TRAIL_POINT_SIZE : 8;

    this.material.color.set(colorHex);
    this.material.size = pointSize;

    // 1 day = 0.01 time units (currentTime = day * 0.01)
    const currentDay = currentTime / 0.01;
    const totalPoints = Math.max(1, Math.round(days * samplesPerDay));

    // Allocate BufferAttribute ONLY when size changes (prevents WebGL VBO leaks)
    let posAttr = this.geometry.getAttribute('position');
    if (!posAttr || this.allocatedSamples !== totalPoints) {
      const positions = new Float32Array(totalPoints * 3);
      posAttr = new THREE.BufferAttribute(positions, 3);
      this.geometry.setAttribute('position', posAttr);
      this.allocatedSamples = totalPoints;
    }

    const vertices = posAttr.array;

    const {
      deferentRadius = 0,
      epicycleRadius = 0,
      deferentSpeed = 0,
      epicycleSpeed = 0,
      deferentPhase = 0,
      epicyclePhase = 0
    } = planet.orbitalParams;

    const inclination = (planet.orbitalParams && planet.orbitalParams.inclination !== undefined)
      ? planet.orbitalParams.inclination
      : (window.CONFIG && window.CONFIG.VENUS_INCLINATION ? window.CONFIG.VENUS_INCLINATION : 0);
    const nodeLongitude = (planet.orbitalParams && planet.orbitalParams.nodeLongitude !== undefined)
      ? planet.orbitalParams.nodeLongitude
      : (window.CONFIG && window.CONFIG.VENUS_NODE_LONGITUDE ? window.CONFIG.VENUS_NODE_LONGITUDE : 0);

    const parentRotation = (planet.parent && planet.parent.rotation) ? planet.parent.rotation : new THREE.Euler();

    const lastSampleIndex = Math.floor(currentDay * samplesPerDay);
    const firstSampleIndex = lastSampleIndex - totalPoints + 1;


    let count = 0;
    for (let s = firstSampleIndex; s <= lastSampleIndex; s++) {
      const sampleDay = s / samplesPerDay;
      const sampleTime = sampleDay * 0.01;

      // 1. Venus position in orbital plane XZ at sampleTime
      const defAngle = deferentSpeed * sampleTime + deferentPhase;
      const defX = deferentRadius * Math.cos(defAngle);
      const defZ = deferentRadius * Math.sin(defAngle);

      const epiAngle = epicycleSpeed * sampleTime + epicyclePhase;
      const epiX = epicycleRadius * Math.cos(epiAngle);
      const epiZ = epicycleRadius * Math.sin(epiAngle);

      const pos = new THREE.Vector3(defX + epiX, 0, defZ + epiZ);
      if (inclination) {
        const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), nodeLongitude);
        const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
        const q3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -nodeLongitude);
        pos.applyQuaternion(q3.multiply(q2).multiply(q1));
      }

      // 2. Apply ecliptic tilt (p1Group rotation)
      pos.applyEuler(parentRotation);

      // 3. Normalize and scale to Celestial Sphere radius R
      if (pos.lengthSq() > 0) {
        pos.normalize().multiplyScalar(R);
      }


      vertices[count * 3] = pos.x;
      vertices[count * 3 + 1] = pos.y;
      vertices[count * 3 + 2] = pos.z;
      count++;
    }

    posAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, count);
    this.geometry.computeBoundingSphere();
  }

  updateTheme(isLight) {
    if (this.material) {
      if (isLight) {
        this.material.color.setHex(0xcc0000);
      } else {
        const colorHex = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_COLOR) || '#ff3333';
        this.material.color.set(colorHex);
      }
    }
  }
}
