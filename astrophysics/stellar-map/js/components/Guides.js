
import * as THREE from 'three';
import { raDecToVector3 } from '../utils/MathUtils.js';
import { createCelestialSphereSurfaceMesh } from './sphereSurfaceBuilder.js';
import { createEquatorialGridGroup } from './equatorialGridBuilder.js';
import { createEquatorialCoordsGroup } from './equatorialCoordsBuilder.js';
import { disposeHierarchy, createTextSprite, createScreenSpaceTubeFromPoints } from './threeHelpers.js';
import { GEOMETRY_CONFIG } from '../config.js';

export class Guides {
  constructor(scene) {
    this.scene = scene;
    this.vectorLine = null;
    this.targetMarker = null;
    this.raArc = null;
    this.decArc = null;
    this.raProjectionLine = null;
    this.guideSphereGroup = null;
    this.guideLabelsGroup = null;
    this.currentSphereRadius = null;

    // State
    this.ra = 0;
    this.dec = 0;
    this.dist = 100;
    this.baseScale = 1;
    this.baseSizePercentage = 0.002;
    this.isVisible = true;
    this.metadata = { distanceUnit: 'ly', raMode: 'hours', raUnit: 'h' };
    this.visualScaleFactor = 1.0;

    this.init();
  }

  setMetadata(metadata) {
    if (metadata) {
      this.metadata = metadata;
      if (this.currentSphereRadius) {
        this.rebuildGuideSphere(this.currentSphereRadius);
      }
      this.updateGuide();
    }
  }

  setVisualScaleFactor(factor) {
    if (factor > 0) {
      this.visualScaleFactor = factor;
      this.updateGuide();
    }
  }

  init() {
    // Marker (The Arrowhead Cone)
    const markerGeo = new THREE.ConeGeometry(1, 1, 32);
    const markerMat = new THREE.MeshBasicMaterial({ 
      color: GEOMETRY_CONFIG.GUIDE_CONE_COLOR !== undefined ? GEOMETRY_CONFIG.GUIDE_CONE_COLOR : 0xfacc15,
      depthWrite: false,
      depthTest: true
    });
    this.targetMarker = new THREE.Mesh(markerGeo, markerMat);
    this.targetMarker.renderOrder = 100;
    this.scene.add(this.targetMarker);

    // Guide Text Labels Group (RA & Dec sprites)
    this.guideLabelsGroup = new THREE.Group();
    this.guideLabelsGroup.visible = this.isVisible;
    this.scene.add(this.guideLabelsGroup);

    // Guide Celestial Sphere Group
    this.guideSphereGroup = new THREE.Group();
    this.guideSphereGroup.visible = this.isVisible;
    this.scene.add(this.guideSphereGroup);

    this.updateGuide();
  }

  updateValues(ra, dec, dist) {
    this.ra = ra;
    this.dec = dec;
    this.dist = dist;
    this.updateGuide();
  }

  rebuildGuideSphere(radius) {
    if (!this.guideSphereGroup) return;

    disposeHierarchy(this.guideSphereGroup);
    this.currentSphereRadius = radius;

    if (radius <= 0) return;

    // 1. Translucent Celestial Sphere Shell (controlled by SHOW_SPHERE_SURFACE)
    if (GEOMETRY_CONFIG.SHOW_SPHERE_SURFACE) {
      const { sphereMesh } = createCelestialSphereSurfaceMesh({
        radius: radius,
        color: GEOMETRY_CONFIG.SPHERE_COLOR !== undefined ? GEOMETRY_CONFIG.SPHERE_COLOR : 0x1e293b,
        opacity: GEOMETRY_CONFIG.SPHERE_OPACITY !== undefined ? GEOMETRY_CONFIG.SPHERE_OPACITY : 0.15,
        roughness: 0.9
      });
      sphereMesh.renderOrder = 0;
      this.guideSphereGroup.add(sphereMesh);
    }

    // 2. Wireframe Grid (24 RA meridians & Dec parallels using GEOMETRY_CONFIG.GRID_LINE_WIDTH_PX)
    const { gridGroup } = createEquatorialGridGroup({
      radius: radius
    });
    gridGroup.renderOrder = 1;
    this.guideSphereGroup.add(gridGroup);

    // 3. Bold Equator Ring, 0h Meridian, Hour & Dec Labels
    const raMode = (this.metadata && this.metadata.raMode) ? this.metadata.raMode : 'hours';
    const { coordsGroup, poleLabelsGroup } = createEquatorialCoordsGroup({
      radius: radius,
      raMode: raMode,
      labelScaleFactor: GEOMETRY_CONFIG.GUIDE_GRID_RA_LABEL_SCALE_FACTOR !== undefined ? GEOMETRY_CONFIG.GUIDE_GRID_RA_LABEL_SCALE_FACTOR : 0.04,
      labelFontSize: GEOMETRY_CONFIG.GUIDE_GRID_RA_LABEL_FONT_SIZE !== undefined ? GEOMETRY_CONFIG.GUIDE_GRID_RA_LABEL_FONT_SIZE : 24,
      labelColor: GEOMETRY_CONFIG.GUIDE_GRID_RA_LABEL_COLOR !== undefined ? GEOMETRY_CONFIG.GUIDE_GRID_RA_LABEL_COLOR : '#facc15',
      tickWidthPx: GEOMETRY_CONFIG.GUIDE_GRID_RA_TICK_WIDTH_PX !== undefined ? GEOMETRY_CONFIG.GUIDE_GRID_RA_TICK_WIDTH_PX : 2.0,
      tickColor: GEOMETRY_CONFIG.GUIDE_GRID_RA_TICK_COLOR !== undefined ? GEOMETRY_CONFIG.GUIDE_GRID_RA_TICK_COLOR : '#facc15'
    });
    coordsGroup.renderOrder = 2;
    poleLabelsGroup.renderOrder = 2;
    this.guideSphereGroup.add(coordsGroup);
    this.guideSphereGroup.add(poleLabelsGroup);
  }

  updateGuide() {
    const raMode = (this.metadata && this.metadata.raMode) ? this.metadata.raMode : 'hours';
    const distVisual = (this.dist || 0) * (this.visualScaleFactor || 1.0);
    const pos = raDecToVector3(this.ra, this.dec, distVisual, raMode);
    const vec = new THREE.Vector3(pos.x, pos.y, pos.z);
    const d = distVisual;

    const phi = raMode === 'degrees'
      ? (this.ra / 180) * Math.PI
      : (this.ra / 24) * Math.PI * 2;
    const theta = (this.dec / 180) * Math.PI;

    // Unit direction vector pointing from origin to (RA, Dec)
    const u = d > 0 ? vec.clone().normalize() : new THREE.Vector3(1, 0, 0);

    // Proportional factors for Arrowhead Cone
    const lengthFactor = GEOMETRY_CONFIG.GUIDE_CONE_LENGTH_FACTOR !== undefined ? GEOMETRY_CONFIG.GUIDE_CONE_LENGTH_FACTOR : 0.04;
    const radiusFactor = GEOMETRY_CONFIG.GUIDE_CONE_RADIUS_FACTOR !== undefined ? GEOMETRY_CONFIG.GUIDE_CONE_RADIUS_FACTOR : 0.015;

    const coneLength = d * lengthFactor;
    const coneRadius = d * radiusFactor;

    // Update & position the Arrowhead Cone
    if (this.targetMarker) {
      if (d > 0) {
        this.targetMarker.visible = this.isVisible;
        // Update color from config
        if (this.targetMarker.material) {
          const coneColor = GEOMETRY_CONFIG.GUIDE_CONE_COLOR !== undefined ? GEOMETRY_CONFIG.GUIDE_CONE_COLOR : 0xfacc15;
          this.targetMarker.material.color.set(coneColor);
        }
        // Scale unit ConeGeometry(1, 1, 32)
        this.targetMarker.scale.set(coneRadius, coneLength, coneRadius);

        // Center of cone must be positioned at distance (d - coneLength / 2)
        // so that tip (+height/2) ends EXACTLY at distance d on the celestial sphere surface
        this.targetMarker.position.copy(u).multiplyScalar(d - coneLength / 2);

        // Orient cone's local +Y axis along unit direction vector u
        const defaultUp = new THREE.Vector3(0, 1, 0);
        this.targetMarker.quaternion.setFromUnitVectors(defaultUp, u);
      } else {
        this.targetMarker.visible = false;
      }
    }

    // RA Point on equator (Origin to RA projection)
    const raPoint = new THREE.Vector3(
      d * Math.cos(phi),
      0,
      -d * Math.sin(phi)
    );

    const guideColor = GEOMETRY_CONFIG.GUIDE_LINE_COLOR !== undefined ? GEOMETRY_CONFIG.GUIDE_LINE_COLOR : 0xfacc15;
    const guideWidthPx = GEOMETRY_CONFIG.GUIDE_LINE_WIDTH_PX !== undefined ? GEOMETRY_CONFIG.GUIDE_LINE_WIDTH_PX : 2.0;
    const opacity = 0.85;

    // 1. Direct Vector Line Shaft (Origin to Base of Cone Head)
    if (this.vectorLine) {
      this.scene.remove(this.vectorLine);
      disposeHierarchy(this.vectorLine);
    }
    const shaftEndPos = u.clone().multiplyScalar(Math.max(0, d - coneLength));
    const vectorPoints = [new THREE.Vector3(0, 0, 0), shaftEndPos];
    this.vectorLine = createScreenSpaceTubeFromPoints(vectorPoints, guideColor, opacity, guideWidthPx);
    this.vectorLine.renderOrder = 10;
    this.vectorLine.visible = this.isVisible;
    this.scene.add(this.vectorLine);

    // 2. RA Projection Line (Origin to Equatorial RA Point)
    if (this.raProjectionLine) {
      this.scene.remove(this.raProjectionLine);
      disposeHierarchy(this.raProjectionLine);
    }
    const projectionPoints = [new THREE.Vector3(0, 0, 0), raPoint];
    this.raProjectionLine = createScreenSpaceTubeFromPoints(projectionPoints, guideColor, opacity, guideWidthPx);
    this.raProjectionLine.renderOrder = 10;
    this.raProjectionLine.visible = this.isVisible;
    this.scene.add(this.raProjectionLine);

    // 3. RA Arc (Equatorial Arc from 0h to current RA)
    if (this.raArc) {
      this.scene.remove(this.raArc);
      disposeHierarchy(this.raArc);
    }
    if (Math.abs(phi) > 0.0001) {
      const raPoints = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const p = (i / segments) * phi;
        raPoints.push(new THREE.Vector3(
          d * Math.cos(p),
          0,
          -d * Math.sin(p)
        ));
      }
      this.raArc = createScreenSpaceTubeFromPoints(raPoints, guideColor, opacity, guideWidthPx);
      this.raArc.renderOrder = 10;
      this.raArc.visible = this.isVisible;
      this.scene.add(this.raArc);
    } else {
      this.raArc = new THREE.Group();
    }

    // 4. Dec Arc (Meridian Arc from Equator to current Dec)
    if (this.decArc) {
      this.scene.remove(this.decArc);
      disposeHierarchy(this.decArc);
    }
    if (Math.abs(theta) > 0.0001) {
      const decPoints = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * theta;
        decPoints.push(new THREE.Vector3(
          d * Math.cos(t) * Math.cos(phi),
          d * Math.sin(t),
          -d * Math.cos(t) * Math.sin(phi)
        ));
      }
      this.decArc = createScreenSpaceTubeFromPoints(decPoints, guideColor, opacity, guideWidthPx);
      this.decArc.renderOrder = 10;
      this.decArc.visible = this.isVisible;
      this.scene.add(this.decArc);
    } else {
      this.decArc = new THREE.Group();
    }

    // Update Guide Text Labels
    this.updateGuideLabels(raPoint, vec);

    // Update Celestial Sphere for Guide Star if radius changed
    if (d > 0 && this.currentSphereRadius !== d) {
      this.rebuildGuideSphere(d);
    }
  }

  updateGuideLabels(raPoint, targetVec) {
    if (!this.guideLabelsGroup) return;

    disposeHierarchy(this.guideLabelsGroup);

    if (this.dist <= 0) return;

    const distVisual = (this.dist || 0) * (this.visualScaleFactor || 1.0);

    const raScaleFactor = GEOMETRY_CONFIG.GUIDE_RA_LABEL_SCALE_FACTOR !== undefined ? GEOMETRY_CONFIG.GUIDE_RA_LABEL_SCALE_FACTOR : 0.06;
    const decScaleFactor = GEOMETRY_CONFIG.GUIDE_DEC_LABEL_SCALE_FACTOR !== undefined ? GEOMETRY_CONFIG.GUIDE_DEC_LABEL_SCALE_FACTOR : 0.06;

    const raLabelScale = distVisual * raScaleFactor;
    const decLabelScale = distVisual * decScaleFactor;

    // 1. RA Label Sprite
    const raFontSize = GEOMETRY_CONFIG.GUIDE_RA_LABEL_FONT_SIZE || 32;
    const raColor = GEOMETRY_CONFIG.GUIDE_RA_LABEL_COLOR || '#facc15';
    const raUnit = (this.metadata && this.metadata.raUnit) ? this.metadata.raUnit : ((this.metadata && this.metadata.raMode === 'degrees') ? '°' : 'h');
    const raSprite = createTextSprite(
      `RA: ${this.ra.toFixed(2)}${raUnit}`,
      raColor,
      raFontSize,
      raLabelScale,
      GEOMETRY_CONFIG.LABEL_FONT_WEIGHT
    );
    raSprite.position.copy(raPoint).multiplyScalar(1.05);
    this.guideLabelsGroup.add(raSprite);

    // 2. Dec Label Sprite
    const decFontSize = GEOMETRY_CONFIG.GUIDE_DEC_LABEL_FONT_SIZE || 32;
    const decColor = GEOMETRY_CONFIG.GUIDE_DEC_LABEL_COLOR || '#facc15';
    const decText = `Dec: ${this.dec >= 0 ? '+' : ''}${this.dec.toFixed(1)}°`;
    const decSprite = createTextSprite(
      decText,
      decColor,
      decFontSize,
      decLabelScale,
      GEOMETRY_CONFIG.LABEL_FONT_WEIGHT
    );
    decSprite.position.copy(targetVec).multiplyScalar(1.05);
    this.guideLabelsGroup.add(decSprite);
  }

  setVisibility(visible) {
    this.isVisible = visible;
    if (this.vectorLine) this.vectorLine.visible = visible;
    if (this.targetMarker) this.targetMarker.visible = visible;
    if (this.raArc) this.raArc.visible = visible;
    if (this.decArc) this.decArc.visible = visible;
    if (this.raProjectionLine) this.raProjectionLine.visible = visible;
    if (this.guideSphereGroup) this.guideSphereGroup.visible = visible;
    if (this.guideLabelsGroup) this.guideLabelsGroup.visible = visible;
  }

  updateBaseScale(maxDistance) {
    // No-op kept for backwards compatibility with app.js calls
  }

  updateMarkerScale() {
    // No-op kept for backwards compatibility
  }
}


