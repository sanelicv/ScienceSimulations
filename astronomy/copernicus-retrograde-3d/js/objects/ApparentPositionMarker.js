import * as THREE from 'three';

export class ApparentPositionMarker extends THREE.Group {
  constructor(sphereRadius = 20000, color = '#ff4444', circleRadius = 120) {
    super();

    this.sphereRadius = sphereRadius;
    this.color = new THREE.Color(color);
    this.circleRadius = circleRadius;

    // 1. Rayo de Visión (Segmento de línea de 2 puntos)
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

    // 2. Disco Relleno Tangente (CircleGeometry con relleno sólido)
    const circleGeometry = new THREE.CircleGeometry(this.circleRadius, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    this.circle = new THREE.Mesh(circleGeometry, circleMaterial);
    this.add(this.circle);

    this.visible = false; // Desactivado por defecto
  }

  update(targetWorldPos, currentSphereRadius, observerWorldPos) {
    if (!this.visible || !targetWorldPos) return;

    const R = currentSphereRadius || (window.CONFIG && window.CONFIG.SPHERE_RADIUS) || this.sphereRadius;
    const origin = observerWorldPos ? observerWorldPos.clone() : new THREE.Vector3(0, 0, 0);

    // Vector unitario desde el observador (Tierra o centro) hacia Venus
    const dir = targetWorldPos.clone().sub(origin).normalize();
    if (dir.lengthSq() === 0) return;

    // Intersección con la Esfera Celeste centrada en (0,0,0) de radio R
    // |origin + t * dir|^2 = R^2 => t^2 + 2 t (origin . dir) + |origin|^2 - R^2 = 0
    const b = origin.dot(dir);
    const c = origin.lengthSq() - R * R;
    const discriminant = b * b - c;

    let spherePoint;
    if (discriminant >= 0) {
      const t = -b + Math.sqrt(discriminant);
      spherePoint = origin.clone().add(dir.clone().multiplyScalar(t));
    } else {
      spherePoint = dir.clone().multiplyScalar(R);
    }

    // Actualizar los vértices del rayo (origin -> spherePoint)
    const linePositions = new Float32Array([
      origin.x, origin.y, origin.z,
      spherePoint.x, spherePoint.y, spherePoint.z
    ]);
    this.line.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.line.geometry.attributes.position.needsUpdate = true;

    // Posicionar el disco y orientarlo TANGENTE a la superficie (mirando hacia 0,0,0)
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
}
