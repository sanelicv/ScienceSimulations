import * as THREE from 'three';
import { raDecToVector3 } from '../utils/MathUtils.js';
import { GEOMETRY_CONFIG, CAMERA_CONFIG } from '../config.js';

export class StarSystem {
  constructor(scene) {
    this.scene = scene;
    this.camera = null;
    this.mesh = null;
    this.starsData = [];
    this.maxDistance = 100; // Default view distance
    this.linesMesh = null;
    this.showProjections = true;
    this.baseSizePercentage = 0.002; // 0.2% of max distance
    this.useLuminosityScaling = GEOMETRY_CONFIG.LUMINOSITY_SCALING_ENABLED !== undefined ? GEOMETRY_CONFIG.LUMINOSITY_SCALING_ENABLED : false;
    this.useApparentBrightness = true;
    this.currentStarScaleFactor = 1.0;
    this.hoveredStarIndex = null;
  }

  updateStars(data, metadata = null, activeSelections = null, availableColumns = null) {
    if (data && data.stars) {
      this.starsData = data.stars;
      this.metadata = data.metadata || { distanceUnit: 'ly', raMode: 'hours', raUnit: 'h' };
      this.activeSelections = data.activeSelections || activeSelections;
      this.availableColumns = data.availableColumns || availableColumns;
    } else {
      this.starsData = Array.isArray(data) ? data : [];
      this.metadata = metadata || { distanceUnit: 'ly', raMode: 'hours', raUnit: 'h' };
      this.activeSelections = activeSelections;
      this.availableColumns = availableColumns;
    }

    this.applyActiveSelections();
  }

  applyActiveSelections(activeSelections = null, metadata = null) {
    if (activeSelections) this.activeSelections = activeSelections;
    if (metadata) this.metadata = metadata;

    const sel = this.activeSelections;

    // Resolve star active coordinates from star.coords
    this.starsData.forEach(star => {
      if (star.coords) {
        if (sel && sel.raKey && star.coords[sel.raKey] !== undefined) {
          star.ra = star.coords[sel.raKey];
        }
        if (sel && sel.decKey && star.coords[sel.decKey] !== undefined) {
          star.dec = star.coords[sel.decKey];
        }
        if (sel && sel.distKey && star.coords[sel.distKey] !== undefined) {
          star.d = star.coords[sel.distKey];
        }
        if (sel && sel.idKey && star.coords[sel.idKey] !== undefined) {
          star.id = star.coords[sel.idKey];
        }
        if (sel && sel.lumKey && star.coords[sel.lumKey] !== undefined) {
          star.lum = star.coords[sel.lumKey];
        }
      }
    });

    // Calculate min and max physical distances to compute normalized visual scale factor
    let minD = Infinity;
    let maxD = 0;
    this.starsData.forEach(star => {
      const d = parseFloat(star.d) || 0;
      if (d > 0 && d < minD) minD = d;
      if (d > maxD) maxD = d;
    });

    this.minDistance = minD !== Infinity ? minD : 1.0;
    this.maxDistance = maxD || 100;

    let minB = Infinity;
    let maxB = -Infinity;
    let minLogB = Infinity;
    let maxLogB = -Infinity;
    let minLogL = Infinity;
    let maxLogL = -Infinity;

    this.starsData.forEach(star => {
      const hasLum = star.lum !== undefined && star.lum !== null && !isNaN(parseFloat(star.lum));
      const L = hasLum ? Math.max(0.000001, parseFloat(star.lum)) : 1.0;
      if (hasLum) {
        const logL = Math.log10(L);
        if (logL < minLogL) minLogL = logL;
        if (logL > maxLogL) maxLogL = logL;
      }

      const dReal = parseFloat(star.d) || 1.0;
      const dNorm = Math.max(0.1, dReal / this.minDistance);
      const b = L / (dNorm * dNorm);

      if (b < minB) minB = b;
      if (b > maxB) maxB = b;

      const logB = Math.log10(Math.max(0.000001, b));
      if (logB < minLogB) minLogB = logB;
      if (logB > maxLogB) maxLogB = logB;
    });

    this.minB = minB !== Infinity ? minB : 0.001;
    this.maxB = maxB !== -Infinity ? maxB : 100.0;
    this.minLogB = minLogB;
    this.maxLogB = maxLogB;
    this.minLogL = minLogL !== Infinity ? minLogL : -2.0;
    this.maxLogL = maxLogL !== -Infinity ? maxLogL : 4.0;

    const targetMinVisual = GEOMETRY_CONFIG.MIN_STAR_VISUAL_DISTANCE !== undefined ? GEOMETRY_CONFIG.MIN_STAR_VISUAL_DISTANCE : 40;
    this.visualScaleFactor = targetMinVisual / this.minDistance;
    this.maxVisualDistance = this.maxDistance * this.visualScaleFactor;

    this.createInstancedMesh(this.starsData);
    this.createProjectionLines(this.starsData);
  }

  getStarVisualPos(star) {
    const ra = parseFloat(star.ra) || 0;
    const dec = parseFloat(star.dec) || 0;
    const distReal = parseFloat(star.d) || 0;
    const distVisual = distReal * this.visualScaleFactor;
    const raMode = (this.metadata && this.metadata.raMode) ? this.metadata.raMode : 'hours';
    return raDecToVector3(ra, dec, distVisual, raMode);
  }

  createProjectionLines(data) {
    if (this.linesMesh) {
      this.scene.remove(this.linesMesh);
      this.linesMesh.geometry.dispose();
      this.linesMesh.material.dispose();
      this.linesMesh = null;
    }

    const count = data.length * 2;

    // Use TubeGeometry - Centered on Origin (0,0,0) so scaling matches midpoint positioning
    // Range -0.5 to 0.5 (Length 1)
    const path = new THREE.LineCurve3(new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.5, 0));
    const geometry = new THREE.TubeGeometry(path, 1, 1, 6, false); // Radius 1 (base), 6 segments

    // Custom Shader to keep constant screen width (approx 2px)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        opacity: { value: 0.5 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        widthPx: { value: 1.0 } // Requested 2px
      },
      vertexShader: `
        uniform vec2 resolution;
        uniform float widthPx;
        varying vec2 vUv;
        varying float vDepth;

        void main() {
          vUv = uv;
          
          // Original local position
          // Tube is along Y axis (-0.5 to 0.5)
          
          // 1. Calculate the Center of this "slice" of the tube in World Space
          // The center has the same Y, but X and Z are 0.
          
          vec4 worldCenter = modelMatrix * instanceMatrix * vec4(0.0, position.y, 0.0, 1.0);
          vec4 viewCenter = viewMatrix * worldCenter;
          
          // 2. Calculate the Vertex Position in World Space
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vec4 viewPos = viewMatrix * worldPos;

          // 3. Vector from Center to Vertex (Radius Vector) in View Space
          vec3 radiusVec = viewPos.xyz - viewCenter.xyz;
          
          // 4. Calculate Desired Radius in View Space to match Pixel Width
          float dist = -viewCenter.z;
          float pr11 = projectionMatrix[1][1]; // 1 / tan(fov/2)
          
          float desiredRadiusWorld = ( (widthPx * 0.5) * dist ) / ( (resolution.y * 0.5) * pr11 );
          
          // 5. Scale the radius vector
          vec3 newPosView = viewCenter.xyz + normalize(radiusVec) * desiredRadiusWorld;
          
          gl_Position = projectionMatrix * vec4(newPosView, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        
        void main() {
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Fix for transparency artifacts and cutting
      depthTest: true
    });

    this.linesMesh = new THREE.InstancedMesh(geometry, material, count);

    // Hook for resizing to update resolution uniform
    window.addEventListener('resize', () => {
      if (this.linesMesh && this.linesMesh.material.uniforms) {
        this.linesMesh.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
      }
    });

    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0); // Tube default axis
    let instanceIndex = 0;

    // Small offset to prevent Z-fighting on the grid plane - REMOVED for accuracy
    const Y_OFFSET = 0.0;

    data.forEach(star => {
      const pos = this.getStarVisualPos(star);

      // Points
      const origin = new THREE.Vector3(0, Y_OFFSET, 0); // Origin at (0,0,0)
      const projected = new THREE.Vector3(pos.x, Y_OFFSET, pos.z); // Projected point at y=0
      const actual = new THREE.Vector3(pos.x, pos.y, pos.z); // Actual star position

      // --- Line 1: Origin to Projection ---
      const dist1 = origin.distanceTo(projected);
      if (dist1 > 0.01) {
        const mid1 = new THREE.Vector3().addVectors(origin, projected).multiplyScalar(0.5);
        dummy.position.copy(mid1);
        dummy.scale.set(1, dist1, 1); // Scale Y (Length), Keep X/Z 1
        dummy.quaternion.setFromUnitVectors(up, projected.clone().sub(origin).normalize());
        dummy.updateMatrix();
        this.linesMesh.setMatrixAt(instanceIndex++, dummy.matrix);
      } else {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        this.linesMesh.setMatrixAt(instanceIndex++, dummy.matrix);
      }

      // --- Line 2: Projection to Star ---
      const dist2 = projected.distanceTo(actual);
      if (dist2 > 0.01) {
        const mid2 = new THREE.Vector3().addVectors(projected, actual).multiplyScalar(0.5);
        dummy.position.copy(mid2);
        dummy.scale.set(1, dist2, 1);
        dummy.quaternion.setFromUnitVectors(up, actual.clone().sub(projected).normalize());
        dummy.updateMatrix();
        this.linesMesh.setMatrixAt(instanceIndex++, dummy.matrix);
      } else {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        this.linesMesh.setMatrixAt(instanceIndex++, dummy.matrix);
      }
    });

    this.linesMesh.instanceMatrix.needsUpdate = true;
    this.linesMesh.visible = this.showProjections;
    this.scene.add(this.linesMesh);
  }

  toggleProjections(visible) {
    this.showProjections = visible;
    if (this.linesMesh) {
      this.linesMesh.visible = visible;
    }
  }

  calculateStarLuminosityScale(star) {
    if (!this.useLuminosityScaling && !this.useApparentBrightness) {
      return 1.0;
    }

    const hasLum = star.lum !== undefined && star.lum !== null && !isNaN(parseFloat(star.lum));
    const lumVal = hasLum ? parseFloat(star.lum) : 1.0;

    const logFactor = GEOMETRY_CONFIG.LUMINOSITY_LOG_FACTOR !== undefined ? GEOMETRY_CONFIG.LUMINOSITY_LOG_FACTOR : 0.35;
    const minScale = GEOMETRY_CONFIG.LUMINOSITY_MIN_SCALE !== undefined ? GEOMETRY_CONFIG.LUMINOSITY_MIN_SCALE : 0.4;
    const maxScale = GEOMETRY_CONFIG.LUMINOSITY_MAX_SCALE !== undefined ? GEOMETRY_CONFIG.LUMINOSITY_MAX_SCALE : 2.5;

    if (this.useApparentBrightness) {
      const pos = this.getStarVisualPos(star);
      const distReal = parseFloat(star.d) || 1.0;
      const distVisual = distReal * (this.visualScaleFactor || 1.0);

      // Distancia dinámica desde la cámara a cada estrella (Vista Global o Local)
      const distToCam = (this.camera && this.camera.position) ? Math.max(0.1, this.camera.position.distanceTo(pos)) : distVisual;

      const refDist = (this.visualScaleFactor && this.visualScaleFactor > 0) ? (this.minDistance * this.visualScaleFactor) : 40;
      const dNorm = Math.max(0.1, distToCam / refDist);
      const b = lumVal / (dNorm * dNorm);
      const useLog = GEOMETRY_CONFIG.USE_LOGARITHMIC_APPARENT_BRIGHTNESS !== undefined
        ? GEOMETRY_CONFIG.USE_LOGARITHMIC_APPARENT_BRIGHTNESS
        : true;

      let t = 0.0;

      if (useLog) {
        const logB = Math.log10(Math.max(0.000001, b));
        const minLog = (this.minLogB !== undefined && this.minLogB !== Infinity) ? this.minLogB : -2.0;
        const maxLog = (this.maxLogB !== undefined && this.maxLogB !== -Infinity) ? this.maxLogB : 2.0;
        const range = Math.max(0.001, maxLog - minLog);
        t = Math.min(Math.max((logB - minLog) / range, 0.0), 1.0);
      } else {
        const minB = (this.minB !== undefined && this.minB !== Infinity) ? this.minB : 0.001;
        const maxB = (this.maxB !== undefined && this.maxB !== -Infinity) ? this.maxB : 100.0;
        const range = Math.max(0.000001, maxB - minB);
        t = Math.min(Math.max((b - minB) / range, 0.0), 1.0);
      }

      // Límites estrictos en píxeles configurados en config.js (Vista Global vs Vista Local)
      const minPx = this.isLocalMode
        ? (GEOMETRY_CONFIG.LOCAL_STAR_MIN_RADIUS_PX !== undefined ? GEOMETRY_CONFIG.LOCAL_STAR_MIN_RADIUS_PX : 1.5)
        : (GEOMETRY_CONFIG.GLOBAL_STAR_MIN_RADIUS_PX !== undefined ? GEOMETRY_CONFIG.GLOBAL_STAR_MIN_RADIUS_PX : 2.0);

      const maxPx = this.isLocalMode
        ? (GEOMETRY_CONFIG.LOCAL_STAR_MAX_RADIUS_PX !== undefined ? GEOMETRY_CONFIG.LOCAL_STAR_MAX_RADIUS_PX : 12.0)
        : (GEOMETRY_CONFIG.GLOBAL_STAR_MAX_RADIUS_PX !== undefined ? GEOMETRY_CONFIG.GLOBAL_STAR_MAX_RADIUS_PX : 24.0);

      // Radio en píxeles de pantalla resultante
      const rPx = minPx + t * (maxPx - minPx);

      // Factor de conversión WebGL de píxeles a unidades 3D usando FOV de la cámara
      const fovDeg = (this.camera && this.camera.fov) ? this.camera.fov : 60;
      const fovRad = (fovDeg * Math.PI) / 180;
      const windowH = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 1080;
      const projFactor = (2.0 * Math.tan(fovRad * 0.5)) / windowH;

      const baseScale = (this.maxVisualDistance || 100) * this.baseSizePercentage;

      // Radio 3D necesario para proyectar exactamente rPx píxeles en pantalla según distancia a la cámara
      const R3D = rPx * distToCam * projFactor;

      // Retornar ratio respecto a baseScale para que dummy.scale sea exactamente R3D
      return R3D / Math.max(0.00001, baseScale);
    }

    if (!hasLum) {
      return 1.0; // Tamaño uniforme para estrellas sin dato de luminosidad
    }

    const safeLum = Math.max(0.000001, lumVal);
    const logL = Math.log10(safeLum);
    const minLog = this.minLogL !== undefined ? this.minLogL : -2.0;
    const maxLog = this.maxLogL !== undefined ? this.maxLogL : 4.0;
    const range = Math.max(0.001, maxLog - minLog);

    // Interpolación t en [0, 1] respecto al conjunto de datos cargado
    const t = Math.min(Math.max((logL - minLog) / range, 0.0), 1.0);
    return minScale + t * (maxScale - minScale);
  }

  setLocalMode(isLocal) {
    if (this.isLocalMode !== !!isLocal) {
      this.isLocalMode = !!isLocal;
      this.rebuildStarScales();
    }
  }

  setLuminosityScaling(enabled) {
    this.useLuminosityScaling = enabled;
    this.rebuildStarScales();
  }

  setApparentBrightness(enabled) {
    if (this.useApparentBrightness !== enabled) {
      this.useApparentBrightness = enabled;
      this.rebuildStarScales();
    }
  }

  setApparentBrightnessIntensity(intensity) {
    GEOMETRY_CONFIG.APPARENT_BRIGHTNESS_INTENSITY = Math.min(Math.max(intensity, 0.0), 1.0);
    this.rebuildStarScales();
  }

  createInstancedMesh(data) {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    const count = data.length;
    const geometry = new THREE.SphereGeometry(1, 16, 16); // Base size 1, scaled later
    // Use White color for stars, basic material (unlit), ignore fog
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uGlowEnabled: { value: GEOMETRY_CONFIG.STAR_GLOW_ENABLED !== false ? 1.0 : 0.0 },
        uCoreRatio: { value: GEOMETRY_CONFIG.STAR_CORE_RATIO !== undefined ? GEOMETRY_CONFIG.STAR_CORE_RATIO : 0.35 },
        uHaloIntensity: { value: GEOMETRY_CONFIG.STAR_HALO_INTENSITY !== undefined ? GEOMETRY_CONFIG.STAR_HALO_INTENSITY : 0.85 },
        uHaloFalloff: { value: GEOMETRY_CONFIG.STAR_HALO_FALLOFF !== undefined ? GEOMETRY_CONFIG.STAR_HALO_FALLOFF : 3.2 }
      },
      vertexShader: `
        #ifndef USE_INSTANCING
        attribute mat4 instanceMatrix;
        #endif

        #ifndef USE_INSTANCING_COLOR
        attribute vec3 instanceColor;
        #endif

        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vColor;

        void main() {
          vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vec4 mvPosition = viewMatrix * worldPosition;

          mat3 normalMat = mat3(viewMatrix * modelMatrix * instanceMatrix);
          vNormal = normalize(normalMat * normal);

          vViewPosition = -mvPosition.xyz;
          vColor = instanceColor;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uGlowEnabled;
        uniform float uCoreRatio;
        uniform float uHaloIntensity;
        uniform float uHaloFalloff;

        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vColor;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          float dotNV = max(0.0, dot(normal, viewDir));

          vec3 baseColor = (length(vColor) > 0.0) ? vColor : vec3(1.0, 1.0, 1.0);

          if (uGlowEnabled < 0.5) {
            gl_FragColor = vec4(baseColor, 1.0);
            return;
          }

          // Core: bright central core (from dotNV = 1.0 down to 1.0 - uCoreRatio)
          float core = smoothstep(1.0 - uCoreRatio, 1.0, dotNV);

          // Halo: smooth exponential decay towards rim edge
          float halo = pow(dotNV, uHaloFalloff) * uHaloIntensity;

          float alpha = clamp(core + halo, 0.0, 1.0);
          gl_FragColor = vec4(baseColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });







    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.renderOrder = 100;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // If we animate

    const dummy = new THREE.Object3D();

    // Dynamic base scale
    const baseScale = (this.maxVisualDistance || 100) * this.baseSizePercentage;

    data.forEach((star, i) => {
      const pos = this.getStarVisualPos(star);
      dummy.position.set(pos.x, pos.y, pos.z);
      const lumScale = this.calculateStarLuminosityScale(star);
      const finalScale = baseScale * lumScale * (this.currentStarScaleFactor || 1.0);
      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
      this.mesh.setColorAt(i, new THREE.Color(0xffffff));
    });

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.hoveredStarIndex = null;
    this.scene.add(this.mesh);

    console.log(`Rendered ${count} stars. Max Vis Dist: ${this.maxVisualDistance}. Base Scale: ${baseScale}`);
  }

  updateScaleFactor(factor) {
    if (factor !== undefined) this.currentStarScaleFactor = factor;
    if (!this.mesh) return;

    const dummy = new THREE.Object3D();

    const baseScale = (this.maxVisualDistance || 100) * this.baseSizePercentage;

    this.starsData.forEach((star, i) => {
      const pos = this.getStarVisualPos(star);
      dummy.position.set(pos.x, pos.y, pos.z);
      const lumScale = this.calculateStarLuminosityScale(star);
      const finalScale = baseScale * lumScale * (this.currentStarScaleFactor || 1.0);
      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    });

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  rebuildStarScales() {
    this.updateScaleFactor(this.currentStarScaleFactor);
  }

  getStarMatrix(index, scaleMultiplier = 1.0) {
    const star = this.starsData[index];
    if (!star) return null;
    const dummy = new THREE.Object3D();
    const pos = this.getStarVisualPos(star);
    dummy.position.set(pos.x, pos.y, pos.z);
    const baseScale = (this.maxVisualDistance || 100) * this.baseSizePercentage;
    const lumScale = this.calculateStarLuminosityScale(star);
    const finalScale = baseScale * lumScale * (this.currentStarScaleFactor || 1.0) * scaleMultiplier;
    dummy.scale.set(finalScale, finalScale, finalScale);
    dummy.updateMatrix();
    return dummy.matrix;
  }

  highlightStar(index) {
    if (!this.mesh) return;

    const highlightColorHex = GEOMETRY_CONFIG.STAR_HIGHLIGHT_COLOR !== undefined
      ? GEOMETRY_CONFIG.STAR_HIGHLIGHT_COLOR
      : 0x38bdf8;
    const scaleBoost = GEOMETRY_CONFIG.STAR_HIGHLIGHT_SCALE_BOOST !== undefined
      ? GEOMETRY_CONFIG.STAR_HIGHLIGHT_SCALE_BOOST
      : 1.35;

    const defaultColor = new THREE.Color(0xffffff);
    // Multiply RGB by 1.8 so additive blending produces a bright intense core instead of looking faint/transparent
    const highlightColor = new THREE.Color(highlightColorHex).multiplyScalar(1.8);

    let colorsNeedUpdate = false;
    let matrixNeedsUpdate = false;

    if (this.hoveredStarIndex !== null && this.hoveredStarIndex !== index) {
      const prevIdx = this.hoveredStarIndex;
      if (prevIdx >= 0 && prevIdx < this.starsData.length) {
        this.mesh.setColorAt(prevIdx, defaultColor);
        const normalMatrix = this.getStarMatrix(prevIdx, 1.0);
        if (normalMatrix) this.mesh.setMatrixAt(prevIdx, normalMatrix);
        colorsNeedUpdate = true;
        matrixNeedsUpdate = true;
      }
      this.hoveredStarIndex = null;
    }

    if (index !== null && index >= 0 && index < this.starsData.length) {
      this.mesh.setColorAt(index, highlightColor);
      const boostedMatrix = this.getStarMatrix(index, scaleBoost);
      if (boostedMatrix) this.mesh.setMatrixAt(index, boostedMatrix);
      this.hoveredStarIndex = index;
      colorsNeedUpdate = true;
      matrixNeedsUpdate = true;
    }

    if (colorsNeedUpdate && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    if (matrixNeedsUpdate) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

}
