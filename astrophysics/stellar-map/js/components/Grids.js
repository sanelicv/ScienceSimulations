
import * as THREE from 'three';
import { GEOMETRY_CONFIG } from '../config.js';

export class Grids {
  constructor(scene) {
    this.scene = scene;
    this.equator = null;
    this.grid = null;
    this.sphereRadius = GEOMETRY_CONFIG.LOCAL_GRID_RADIUS !== undefined
      ? GEOMETRY_CONFIG.LOCAL_GRID_RADIUS
      : (GEOMETRY_CONFIG.LOCAL_SPHERE_RADIUS !== undefined ? GEOMETRY_CONFIG.LOCAL_SPHERE_RADIUS : 100);
    this.vernalLine = null;
    this.vernalCone = null;
    this.vernalPointGroup = null;
    
    this.gridVisible = true;
    this.equatorVisible = false;
    this.showInGlobalMode = false;
    this.planeVisible = true;

    this.init();
  }

  init() {
    this.createEquator();
    this.createGrid();
    this.createVernalLine();
  }

  createEquator() {
    // Celestial Equator (Circle on XZ plane)
    const curve = new THREE.EllipseCurve(
      0, 0,            // ax, ay
      this.sphereRadius, this.sphereRadius,           // xRadius, yRadius
      0, 2 * Math.PI,  // aStartAngle, aEndAngle
      false,            // aClockwise
      0                 // aRotation
    );

    const points = curve.getPoints(128);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // Rotate to lie on XZ plane (since EllipseCurve is on XY)
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.LineBasicMaterial({
      color: GEOMETRY_CONFIG.EQUATOR_LINE_COLOR || 0x4da6ff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    this.equator = new THREE.Line(geometry, material);
    this.equator.visible = this.equatorVisible;
    this.scene.add(this.equator);
  }

  createGrid() {
    this.grid = new THREE.Group();

    // RA Lines (Longitudes) - 24 hours
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const curve = new THREE.EllipseCurve(
        0, 0,
        this.sphereRadius, this.sphereRadius,
        0, 2 * Math.PI
      );

      const points = curve.getPoints(64);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.rotateY(angle); // Rotate around Up axis

      const material = new THREE.LineBasicMaterial({
        color: GEOMETRY_CONFIG.GRID_LINE_COLOR || 0xffffff,
        transparent: true,
        opacity: GEOMETRY_CONFIG.GRID_LINE_OPACITY !== undefined ? GEOMETRY_CONFIG.GRID_LINE_OPACITY : 0.3,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      this.grid.add(line);
    }

    // Dec Lines (Parallels) - Every 10 or 15 degrees (incluyendo el paralelo central Dec = 0°)
    for (let i = -80; i <= 80; i += 10) {

      const theta = (i / 180) * Math.PI;
      const radius = this.sphereRadius * Math.cos(theta);
      const y = this.sphereRadius * Math.sin(theta);

      const curve = new THREE.EllipseCurve(
        0, 0,
        radius, radius,
        0, 2 * Math.PI
      );

      const points = curve.getPoints(128);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, y, 0);

      const isZeroDec = (i === 0);
      const lineColor = isZeroDec
        ? (GEOMETRY_CONFIG.LOCAL_GRID_ZERO_DEC_COLOR || 0x38bdf8)
        : (GEOMETRY_CONFIG.GRID_LINE_COLOR || 0xffffff);
      const lineOpacity = isZeroDec
        ? (GEOMETRY_CONFIG.LOCAL_GRID_ZERO_DEC_OPACITY !== undefined ? GEOMETRY_CONFIG.LOCAL_GRID_ZERO_DEC_OPACITY : 0.8)
        : (GEOMETRY_CONFIG.GRID_LINE_OPACITY !== undefined ? GEOMETRY_CONFIG.GRID_LINE_OPACITY : 0.3);

      const material = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: lineOpacity,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      this.grid.add(line);
    }

    this.grid.visible = this.isLocalMode ? this.gridVisible : false;
    this.scene.add(this.grid);
  }

  createVernalLine() {
    this.vernalPointGroup = new THREE.Group();

    const vernalColor = GEOMETRY_CONFIG.VERNAL_LINE_COLOR || 0xff3333;
    const length = this.sphereRadius;
    const coneHeight = Math.max(length * 0.035, 3.0);
    const coneRadius = coneHeight * 0.35;

    // The Line (stops at the base of the cone)
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.max(length - coneHeight, 0), 0, 0)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: vernalColor,
      transparent: true,
      opacity: 0.8
    });
    this.vernalLine = new THREE.Line(lineGeometry, lineMaterial);
    this.vernalPointGroup.add(this.vernalLine);

    // The Arrow Head (Cone tip ends exactly at X = length)
    const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
    coneGeometry.rotateZ(-Math.PI / 2); // Point along +X
    coneGeometry.translate(length - coneHeight / 2, 0, 0);

    const coneMaterial = new THREE.MeshBasicMaterial({
      color: vernalColor,
      transparent: true,
      opacity: 0.8
    });
    this.vernalCone = new THREE.Mesh(coneGeometry, coneMaterial);
    this.vernalPointGroup.add(this.vernalCone);

    this.vernalPointGroup.visible = false; // Hidden by default
    this.scene.add(this.vernalPointGroup);
  }

  toggleEquator(visible) {
    this.equatorVisible = visible;
    if (this.equator) this.equator.visible = this.isLocalMode ? visible : false;
  }

  toggleGrid(visible) {
    this.gridVisible = visible;
    if (this.grid) this.grid.visible = this.isLocalMode ? visible : false;
  }

  toggleVernalPoint(visible) {
    this.vernalPointVisible = visible;
    if (this.vernalPointGroup) {
      this.vernalPointGroup.visible = this.isLocalMode ? false : visible;
    }
  }

  updatePlane(size) {
    if (this.planeGroup) {
      this.scene.remove(this.planeGroup);
    }

    this.planeGroup = new THREE.Group();

    const planeFactor = GEOMETRY_CONFIG.PLANE_SIZE_FACTOR !== undefined ? GEOMETRY_CONFIG.PLANE_SIZE_FACTOR : 1.2;
    const planeSize = size * planeFactor;
    const divisions = 30;

    // GridHelper (XZ plane)
    const gridHelper = new THREE.GridHelper(planeSize * 2, divisions, 0xffffff, 0xffffff);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.depthWrite = false; // Prevent occlusion
    this.planeGroup.add(gridHelper);

    this.scene.add(this.planeGroup);
  }

  updateSphere(radius) {
    if (this.equator) {
      this.scene.remove(this.equator);
      this.equator.geometry.dispose();
      this.equator.material.dispose();
      this.equator = null;
    }
    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.grid = null;
    }

    this.sphereRadius = radius;
    this.createEquator();
    this.createGrid();
    this.updateVernalPoint(this.sphereRadius);
    this.createLocalVernalCircle();
  }

  updateVernalPoint(length) {
    const coneHeight = Math.max(length * 0.035, 3.0);
    const coneRadius = coneHeight * 0.35;

    if (this.vernalLine) {
      this.vernalLine.geometry.dispose();
      this.vernalLine.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.max(length - coneHeight, 0), 0, 0)
      ]);
    }

    if (this.vernalCone) {
      this.vernalCone.geometry.dispose();
      const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
      coneGeometry.rotateZ(-Math.PI / 2);
      coneGeometry.translate(length - coneHeight / 2, 0, 0);
      this.vernalCone.geometry = coneGeometry;
    }
  }

  createLocalSphere() {
    if (this.localSphereGroup) {
      this.scene.remove(this.localSphereGroup);
    }
    this.localSphereGroup = new THREE.Group();

    const radius = this.sphereRadius;
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: GEOMETRY_CONFIG.SPHERE_COLOR || 0x1e293b,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false
    });
    const sphereMesh = new THREE.Mesh(geometry, material);
    this.localSphereGroup.add(sphereMesh);
    this.localSphereGroup.visible = false;
    this.scene.add(this.localSphereGroup);
  }

  createLocalVernalCircle() {
    if (this.localVernalMesh) {
      this.scene.remove(this.localVernalMesh);
      if (this.localVernalMesh.geometry) this.localVernalMesh.geometry.dispose();
      if (this.localVernalMesh.material) this.localVernalMesh.material.dispose();
      this.localVernalMesh = null;
    }

    const radius = GEOMETRY_CONFIG.LOCAL_VERNAL_CIRCLE_RADIUS !== undefined ? GEOMETRY_CONFIG.LOCAL_VERNAL_CIRCLE_RADIUS : 2.5;
    const color = GEOMETRY_CONFIG.LOCAL_VERNAL_CIRCLE_COLOR || 0xff3333;
    const opacity = GEOMETRY_CONFIG.LOCAL_VERNAL_CIRCLE_OPACITY !== undefined ? GEOMETRY_CONFIG.LOCAL_VERNAL_CIRCLE_OPACITY : 0.5;

    const geometry = new THREE.CircleGeometry(radius, 32);
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(this.sphereRadius, 0, 0);

    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.localVernalMesh = new THREE.Mesh(geometry, material);
    this.localVernalMesh.visible = !!this.isLocalMode;
    this.scene.add(this.localVernalMesh);
  }

  setGlobalModeVisibility(show) {
    this.showInGlobalMode = !!show;
    this.updateVisibility();
  }

  toggleLocalMode(isLocal) {
    this.isLocalMode = isLocal;
    this.updateVisibility();
  }

  togglePlane(visible) {
    this.planeVisible = visible;
    if (this.planeGroup) {
      this.planeGroup.visible = !this.isLocalMode && this.planeVisible;
    }
  }

  updateVisibility() {
    const shouldBeVisible = this.isLocalMode || this.showInGlobalMode;

    if (!this.localSphereGroup) {
      this.createLocalSphere();
    }
    if (!this.localVernalMesh) {
      this.createLocalVernalCircle();
    }
    if (this.localSphereGroup) {
      this.localSphereGroup.visible = shouldBeVisible;
    }
    if (this.localVernalMesh) {
      this.localVernalMesh.visible = shouldBeVisible;
    }
    if (this.grid) {
      this.grid.visible = shouldBeVisible && this.gridVisible;
    }
    if (this.equator) {
      this.equator.visible = shouldBeVisible && this.equatorVisible;
    }
    if (this.planeGroup) {
      this.planeGroup.visible = !this.isLocalMode && (this.planeVisible !== undefined ? this.planeVisible : true);
    }
    if (this.vernalPointGroup) {
      this.vernalPointGroup.visible = this.isLocalMode ? false : (this.vernalPointVisible !== undefined ? this.vernalPointVisible : false);
    }
  }
}
