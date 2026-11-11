import * as THREE from 'three';

export class ApparentPositionMarker extends THREE.Group {
  constructor(sphereRadius = 10000, color = '#ff4444', circleRadius = 80) {
    super();

    this.sphereRadius = sphereRadius;
    this.color = new THREE.Color(color);
    this.circleRadius = circleRadius;

    // 1. Ray Line Segment from Earth (0,0,0) to Celestial Sphere
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.color,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, this.sphereRadius)
    ]);

    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.add(this.line);

    // 2. Tangent Circle on the Celestial Sphere Surface (Filled Disk)
    const circleGeometry = new THREE.CircleGeometry(this.circleRadius, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    this.circle = new THREE.Mesh(circleGeometry, circleMaterial);
    this.add(this.circle);

    this.visible = false; // Off by default as per checkbox
  }

  update(targetWorldPos, currentSphereRadius) {
    if (!this.visible || !targetWorldPos) return;

    const R = currentSphereRadius || (window.CONFIG && window.CONFIG.SPHERE_RADIUS) || this.sphereRadius;

    // Direction vector from Earth (0,0,0) to Venus
    const dir = targetWorldPos.clone().normalize();
    if (dir.lengthSq() === 0) return;

    // Intersection point on celestial sphere
    const spherePoint = dir.clone().multiplyScalar(R);

    // Update Line Segment endpoints (0,0,0) -> spherePoint
    const linePositions = new Float32Array([
      0, 0, 0,
      spherePoint.x, spherePoint.y, spherePoint.z
    ]);
    this.line.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.line.geometry.attributes.position.needsUpdate = true;

    // Update Tangent Circle position and orient tangent to sphere (facing origin)
    this.circle.position.copy(spherePoint);
    this.circle.lookAt(0, 0, 0);
  }

  setCircleRadius(radius) {
    this.circleRadius = radius;
    if (this.circle) {
      this.circle.geometry.dispose();
      this.circle.geometry = new THREE.CircleGeometry(radius, 64);
    }
    if (window.CONFIG) window.CONFIG.VENUS_APPARENT_POS_RADIUS = radius;
    window.VENUS_APPARENT_POS_RADIUS = radius;
  }

  setColor(colorHex) {
    this.color.set(colorHex);
    if (this.line) this.line.material.color.copy(this.color);
    if (this.circle) this.circle.material.color.copy(this.color);
    if (window.CONFIG) window.CONFIG.VENUS_APPARENT_POS_COLOR = colorHex;
    window.VENUS_APPARENT_POS_COLOR = colorHex;
  }

  setFollowMode(isFollowingAny) {
    if (this.line) {
      this.line.visible = !isFollowingAny;
    }
  }
}
