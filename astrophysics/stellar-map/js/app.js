import { SceneManager } from './core/SceneManager.js';
import { DataHandler } from './data/DataHandler.js';
import { StarSystem } from './components/StarSystem.js';
import { Grids } from './components/Grids.js';
import { Guides } from './components/Guides.js';
import { Constellations } from './components/constellations.js';
import { TooltipManager } from './components/TooltipManager.js';
import { UnitSelectorModal } from './components/UnitSelectorModal.js';
import { UIManager } from './ui/UIManager.js';
import { GEOMETRY_CONFIG, CAMERA_CONFIG } from './config.js';
import * as THREE from 'three';

class App {
  constructor() {
    console.log("Initializing Stellar Map 3D...");
    this.sceneManager = new SceneManager('canvas-container');
    this.dataHandler = new DataHandler();

    // Components
    this.starSystem = new StarSystem(this.sceneManager.scene, this.sceneManager.camera);
    this.grids = new Grids(this.sceneManager.scene);
    this.guides = new Guides(this.sceneManager.scene);
    this.constellations = new Constellations(this.grids.sphereRadius, './assets/Constelaciones_zodiaco.xlsx');
    this.sceneManager.add(this.constellations);

    // Tooltip Manager (Raycasting for stars) & Local Mode Check
    this.tooltipManager = new TooltipManager(this.sceneManager, this.starSystem);
    this.isLocalObserverMode = false;

    this.sceneManager.onUpdateCallback = () => {
      if (this.tooltipManager) {
        this.tooltipManager.update();
      }

      // Si la Ley 1/d^2 está activa, actualizar dinámicamente la escala según la distancia a la cámara
      if (this.starSystem && this.starSystem.useApparentBrightness) {
        this.starSystem.rebuildStarScales();
      }
    };

    // Modal
    this.unitSelectorModal = new UnitSelectorModal();

    // Current dataset state
    this.currentStars = [];
    this.availableColumns = null;
    this.activeSelections = null;

    // UI
    this.uiManager = new UIManager(this);

    this.initTestObjects();
    this.initDefaultCameraScale();
    this.setupEventListeners();
    this.loadPresetCases();
  }

  async loadPresetCases() {
    try {
      const response = await fetch(`get_cases.php?_t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const cases = await response.json();
      if (Array.isArray(cases)) {
        this.presetCases = cases;
      }
    } catch (err) {
      console.warn("No se pudieron cargar los casos predeterminados:", err);
    }
  }

  async loadCaseByCode(inputCode) {
    const fileStatus = document.getElementById('file-status');
    const feedbackEl = document.getElementById('case-code-feedback');
    const code = (inputCode || '').trim();

    if (!code) {
      if (feedbackEl) {
        feedbackEl.textContent = 'Ingrese un código de caso.';
        feedbackEl.className = 'code-feedback error';
        feedbackEl.classList.remove('hidden');
      }
      return;
    }

    if (!this.presetCases) {
      await this.loadPresetCases();
    }

    const normCode = code.toLowerCase();
    const matchingCase = (this.presetCases || []).find(c => {
      const cCode = c.code !== undefined && c.code !== null ? String(c.code).trim().toLowerCase() : '';
      const cName = c.name !== undefined && c.name !== null ? String(c.name).trim().toLowerCase() : '';
      const cFile = c.filename !== undefined && c.filename !== null ? String(c.filename).trim().toLowerCase() : '';
      const cFileNoExt = cFile.replace(/\.[^/.]+$/, '');
      return normCode === cCode || normCode === cName || normCode === cFile || normCode === cFileNoExt;
    });

    if (!matchingCase) {
      if (feedbackEl) {
        feedbackEl.textContent = 'Código no válido. Verifique e intente nuevamente.';
        feedbackEl.className = 'code-feedback error';
        feedbackEl.classList.remove('hidden');
      }
      return;
    }

    if (feedbackEl) {
      feedbackEl.textContent = `${matchingCase.name} cargado correctamente.`;
      feedbackEl.className = 'code-feedback success';
      feedbackEl.classList.remove('hidden');
    }

    if (fileStatus) {
      fileStatus.textContent = "Cargando caso predeterminado...";
    }

    try {
      const casePath = matchingCase.path;
      const fetchUrl = `${casePath}${casePath.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      const res = await fetch(fetchUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error("No se pudo descargar el archivo del caso");
      const buffer = await res.arrayBuffer();

      this.currentCaseConfig = matchingCase.config || null;

      const result = await this.dataHandler.parseArrayBuffer(buffer, casePath);
      this.currentStars = result.stars || [];
      this.availableColumns = result.availableColumns;
      this.activeSelections = result.activeSelections;

      const fileInput = document.getElementById('csvInput');
      if (fileInput) fileInput.value = '';

      if (this.uiManager) {
        this.uiManager.showConfigureUnitsButton(result.hasMultipleOptions);
      }

      if (result.hasMultipleOptions) {
        this.unitSelectorModal.show(
          this.availableColumns,
          this.activeSelections,
          (selectedSelections) => {
            this.applyDatasetSelections(selectedSelections);
          }
        );
        this.applyDatasetSelections(this.activeSelections);
      } else {
        this.applyDatasetSelections(this.activeSelections);
      }

      if (fileStatus) {
        fileStatus.textContent = `${matchingCase.name} cargado: ${this.currentStars.length} estrellas.`;
      }
    } catch (error) {
      console.error(error);
      if (feedbackEl) {
        feedbackEl.textContent = "Error al cargar el caso: " + (error.message || error);
        feedbackEl.className = 'code-feedback error';
        feedbackEl.classList.remove('hidden');
      }
      if (fileStatus) {
        fileStatus.textContent = "Error: " + (error.message || error);
      }
    }
  }

  applyCaseConfig(config) {
    if (!config) return;

    // 1. View Mode (earth vs global)
    if (config.viewMode === 'earth') {
      this.setObserverMode(true);
    } else if (config.viewMode === 'global') {
      this.setObserverMode(false);
    }

    // 2. Escala de Estrellas (starScale / starSize)
    const starScaleVal = config.starScale !== undefined ? config.starScale : config.starSize;
    if (starScaleVal !== undefined && !isNaN(parseFloat(starScaleVal))) {
      const scaleVal = parseFloat(starScaleVal);
      const sizeSlider = document.getElementById('star-size-slider');
      if (sizeSlider) sizeSlider.value = scaleVal;
      if (this.starSystem) this.starSystem.updateScaleFactor(scaleVal);
      if (this.uiManager) {
        if (this.isLocalObserverMode) {
          this.uiManager.savedLocalStarScale = scaleVal;
        } else {
          this.uiManager.savedGlobalStarScale = scaleVal;
        }
      }
    }

    // 3. Camera Orientation (RA, Dec)
    if (config.targetCamera && config.targetCamera.ra !== undefined && config.targetCamera.dec !== undefined) {
      const raMode = (this.starSystem && this.starSystem.metadata) ? this.starSystem.metadata.raMode : 'hours';
      this.sceneManager.lookAtEquatorial(config.targetCamera.ra, config.targetCamera.dec, raMode);
    }

    // 4. Campo de visión de la cámara (FOV)
    const rawFov = config.fov !== undefined ? config.fov : (config.targetCamera ? config.targetCamera.fov : undefined);
    if (rawFov !== undefined && !isNaN(parseFloat(rawFov))) {
      const fovVal = Math.max(1.0, Math.min(170.0, parseFloat(rawFov)));
      if (this.sceneManager && this.sceneManager.camera) {
        this.sceneManager.camera.fov = fovVal;
        this.sceneManager.camera.updateProjectionMatrix();
      }
    }

    // 3. Toggles (Zodiac, Plane, Projections, Vernal, Apparent Brightness)
    if (config.toggles) {
      if (config.toggles.zodiac !== undefined) {
        const toggleZodiac = document.getElementById('toggle-zodiac');
        if (toggleZodiac) toggleZodiac.checked = !!config.toggles.zodiac;
        if (this.constellations) this.constellations.toggle(!!config.toggles.zodiac);
      }
      if (config.toggles.plane !== undefined) {
        const togglePlane = document.getElementById('toggle-plane');
        if (togglePlane) togglePlane.checked = !!config.toggles.plane;
        if (this.grids) this.grids.togglePlane(!!config.toggles.plane);
      }
      if (config.toggles.projections !== undefined) {
        const toggleProj = document.getElementById('toggle-projections');
        if (toggleProj) toggleProj.checked = !!config.toggles.projections;
        if (this.starSystem) this.starSystem.toggleProjections(!!config.toggles.projections);
      }
      if (config.toggles.vernal !== undefined) {
        const toggleVernal = document.getElementById('toggle-vernal');
        if (toggleVernal) toggleVernal.checked = !!config.toggles.vernal;
        if (this.grids) this.grids.toggleVernalPoint(!!config.toggles.vernal);
      }
      if (config.toggles.apparentBrightness !== undefined) {
        const toggleApparent = document.getElementById('toggle-apparent-brightness');
        if (toggleApparent) toggleApparent.checked = !!config.toggles.apparentBrightness;
        if (this.starSystem) this.starSystem.setApparentBrightness(!!config.toggles.apparentBrightness);
      }
    }

    // 5. Bloqueo de rotación y arrastre de cámara con mouse (lockCamera / disableRotate)
    const isCameraLocked = !!(config.lockCamera || (config.uiRestrictions && (config.uiRestrictions.lockCamera || config.uiRestrictions.disableRotate)));
    if (this.sceneManager && this.sceneManager.controls) {
      this.sceneManager.controls.enableRotate = !isCameraLocked;
      this.sceneManager.controls.enablePan = !isCameraLocked;
    }

    // 6. UI Restrictions
    if (config.uiRestrictions && config.uiRestrictions.hideSidebar) {
      const sidebar = document.getElementById('ui-sidebar');
      if (sidebar) sidebar.classList.add('hidden');
    }

    // 7. Personalización de Tooltip (campos visibles, fontSize, width)
    if (this.tooltipManager) {
      this.tooltipManager.resetFieldsConfig();
      const tooltipCfg = config.tooltip || config.tooltipFields;
      if (tooltipCfg) {
        this.tooltipManager.applyConfig(tooltipCfg);
      }
    }
  }

  initTestObjects() {
    // Central Sun mesh setup if needed
  }

  calculateMaxZoom(maxVisualDistance) {
    const planeFactor = GEOMETRY_CONFIG.PLANE_SIZE_FACTOR !== undefined ? GEOMETRY_CONFIG.PLANE_SIZE_FACTOR : 1.5;
    const gridRadius = maxVisualDistance * planeFactor;
    const cornerRadius = gridRadius * Math.SQRT2;

    const fovDeg = CAMERA_CONFIG.DEFAULT_GLOBAL_FOV || 45;
    const halfFovRad = (fovDeg / 2) * (Math.PI / 180);
    const baseFitDistance = cornerRadius / Math.sin(halfFovRad);

    const maxDistanceFactor = CAMERA_CONFIG.MAX_GLOBAL_DISTANCE_FACTOR !== undefined
      ? CAMERA_CONFIG.MAX_GLOBAL_DISTANCE_FACTOR
      : 1.25;

    return baseFitDistance * maxDistanceFactor;
  }

  initDefaultCameraScale() {
    const maxVisualDistance = (this.starSystem && this.starSystem.maxVisualDistance) ? this.starSystem.maxVisualDistance : (GEOMETRY_CONFIG.MIN_STAR_VISUAL_DISTANCE || 500);
    const maxZoom = this.calculateMaxZoom(maxVisualDistance);

    if (this.sceneManager) {
      this.sceneManager.updateCamera(maxVisualDistance, maxZoom);
    }
    if (this.uiManager) {
      this.uiManager.updateZoomSliderLimits(maxZoom, this.sceneManager ? this.sceneManager.getCameraDistance() : maxVisualDistance * 1.2);
    }
  }

  applyDatasetSelections(selections) {
    if (!selections || !this.availableColumns || !this.currentStars) return;

    this.activeSelections = selections;

    // Derive metadata for active selections
    const raOpt = this.availableColumns.raOptions.find(o => o.key === selections.raKey) || this.availableColumns.raOptions[0];
    const distOpt = this.availableColumns.distanceOptions.find(o => o.key === selections.distKey) || this.availableColumns.distanceOptions[0];

    const metadata = {
      distanceUnit: distOpt ? distOpt.unit : 'ly',
      raMode: raOpt ? raOpt.mode : 'hours',
      raUnit: raOpt ? raOpt.unit : 'h'
    };

    console.log(`Applying dataset selections:`, selections, metadata);

    // Update StarSystem active coordinates & 3D meshes
    this.starSystem.updateStars(this.currentStars, metadata, selections, this.availableColumns);

    const visualScaleFactor = this.starSystem.visualScaleFactor || 1.0;
    const maxVisualDistance = this.starSystem.maxVisualDistance || 100;

    if (this.guides) {
      this.guides.setMetadata(metadata);
      this.guides.setVisualScaleFactor(visualScaleFactor);
    }
    if (this.tooltipManager) {
      this.tooltipManager.setMetadata(metadata);
    }

    // Normalized scale updates
    let maxDist = 0;
    let minDist = Infinity;

    this.currentStars.forEach(s => {
      const d = parseFloat(s.d) || 0;
      if (d > maxDist) maxDist = d;
      if (d > 0 && d < minDist) minDist = d;
    });

    if (maxDist === 0) maxDist = 100;
    if (minDist === Infinity) minDist = 10;

    const planeFactor = GEOMETRY_CONFIG.PLANE_SIZE_FACTOR !== undefined ? GEOMETRY_CONFIG.PLANE_SIZE_FACTOR : 1.5;
    const gridRadius = maxVisualDistance * planeFactor;

    if (this.grids) {
      this.grids.updatePlane(maxVisualDistance);
      this.grids.updateSphere(gridRadius);
      this.grids.updateVernalPoint(gridRadius);

      if (this.constellations) {
        this.constellations.updateRadius(gridRadius);
      }
    }

    if (this.sceneManager) {
      const maxZoom = this.calculateMaxZoom(maxVisualDistance);
      this.sceneManager.updateCamera(maxVisualDistance, maxZoom);
      this.sceneManager.setCameraDistance(maxVisualDistance * 1.2);

      if (this.uiManager) {
        this.uiManager.updateZoomSliderLimits(maxZoom, this.sceneManager.getCameraDistance());
      }

      if (this.uiManager) {
        this.uiManager.updateDatasetMetadata(metadata);
        this.uiManager.updateDistSliderMax(maxDist);
        this.uiManager.showGuideToggle();

        if (this.guides) {
          this.guides.updateBaseScale(maxDist);
        }

        const sidebar = document.getElementById('ui-sidebar');
        if (sidebar) sidebar.classList.remove('centered');

        const panelViz = document.getElementById('panel-viz');
        const panelGuide = document.getElementById('panel-guide');
        if (panelViz) panelViz.classList.remove('hidden');
        if (panelGuide) panelGuide.classList.remove('hidden');

        const toggleVernal = document.getElementById('toggle-vernal');
        if (toggleVernal) {
          toggleVernal.checked = true;
          if (this.grids) this.grids.toggleVernalPoint(true);
        }
      }
    }

    if (this.currentCaseConfig) {
      this.applyCaseConfig(this.currentCaseConfig);
    }
  }

  setupEventListeners() {
    const fileInput = document.getElementById('csvInput');
    const fileStatus = document.getElementById('file-status');
    const btnLoadCaseCode = document.getElementById('btnLoadCaseCode');
    const caseCodeInput = document.getElementById('caseCodeInput');

    if (btnLoadCaseCode && caseCodeInput) {
      btnLoadCaseCode.addEventListener('click', () => {
        this.loadCaseByCode(caseCodeInput.value);
      });

      caseCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.loadCaseByCode(caseCodeInput.value);
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (caseCodeInput) caseCodeInput.value = '';
        const feedbackEl = document.getElementById('case-code-feedback');
        if (feedbackEl) feedbackEl.classList.add('hidden');

        this.currentCaseConfig = null;
        if (this.sceneManager && this.sceneManager.controls) {
          this.sceneManager.controls.enableRotate = true;
          this.sceneManager.controls.enablePan = true;
        }
        const sidebar = document.getElementById('ui-sidebar');
        if (sidebar) sidebar.classList.remove('hidden');

        fileStatus.textContent = "Cargando...";
        try {
          const result = await this.dataHandler.parseFile(file);
          this.currentStars = result.stars || [];
          this.availableColumns = result.availableColumns;
          this.activeSelections = result.activeSelections;

          console.log(`Loaded ${this.currentStars.length} stars. Multiple options? ${result.hasMultipleOptions}`);

          if (this.uiManager) {
            this.uiManager.showConfigureUnitsButton(result.hasMultipleOptions);
          }

          if (result.hasMultipleOptions) {
            // Prompt modal to user
            this.unitSelectorModal.show(
              this.availableColumns,
              this.activeSelections,
              (selectedSelections) => {
                this.applyDatasetSelections(selectedSelections);
              }
            );
            // Apply default selection initially
            this.applyDatasetSelections(this.activeSelections);
          } else {
            this.applyDatasetSelections(this.activeSelections);
          }

          fileStatus.textContent = `Cargado: ${this.currentStars.length} estrellas.`;
        } catch (error) {
          console.error(error);
          fileStatus.textContent = "Error: " + (error.message || error);
        } finally {
          // Permite volver a seleccionar el mismo archivo (si no, el evento change no se dispara)
          event.target.value = '';
        }
      });
    }
  }

  setObserverMode(isLocal) {
    this.isLocalObserverMode = isLocal;

    if (this.sceneManager) {
      this.sceneManager.isLocalObserverMode = isLocal;
      if (isLocal) {
        this.sceneManager.toggleFreeFly(false);
      }
      if (this.sceneManager.controls) {
        this.sceneManager.controls.enableZoom = !isLocal;
      }
      if (isLocal) {
        this.sceneManager.setCameraDistance(0.1);
        const targetFov = GEOMETRY_CONFIG.LOCAL_FOV_DEFAULT || 60.0;
        this.sceneManager.camera.fov = targetFov;
        this.sceneManager.camera.updateProjectionMatrix();
      } else {
        const savedDist = (this.uiManager && this.uiManager.savedGlobalCameraDistance)
          ? this.uiManager.savedGlobalCameraDistance
          : (this.sceneManager.defaultCameraDistance || 200);
        this.sceneManager.setCameraDistance(savedDist);
        if (this.uiManager && this.uiManager.zoomSlider) {
          this.uiManager.zoomSlider.value = savedDist;
        }
        const defaultGlobalFov = CAMERA_CONFIG.DEFAULT_GLOBAL_FOV || 45.0;
        this.sceneManager.camera.fov = defaultGlobalFov;
        this.sceneManager.camera.updateProjectionMatrix();
      }
    }

    if (this.grids) {
      this.grids.toggleLocalMode(isLocal);
      if (isLocal) {
        this.grids.toggleVernalPoint(false);
      } else {
        const toggleVernal = document.getElementById('toggle-vernal');
        const showVernal = toggleVernal ? toggleVernal.checked : false;
        this.grids.toggleVernalPoint(showVernal);

        const togglePlane = document.getElementById('toggle-plane');
        const showPlane = togglePlane ? togglePlane.checked : true;
        this.grids.togglePlane(showPlane);
      }
    }
    if (this.constellations) {
      this.constellations.setLocalMode(isLocal);
    }
    if (this.starSystem) {
      this.starSystem.setLocalMode(isLocal);
      this.starSystem.setApparentBrightness(true);

      if (isLocal) {
        this.starSystem.toggleProjections(false);
      } else {
        const toggleProj = document.getElementById('toggle-projections');
        const showProj = toggleProj ? toggleProj.checked : true;
        this.starSystem.toggleProjections(showProj);
      }
    }
    if (this.uiManager) {
      this.uiManager.syncViewModeToggle(isLocal);
      this.uiManager.syncApparentBrightnessToggle(true);
      this.uiManager.setStarSizeSliderRange(isLocal);
      this.uiManager.syncZodiacToggleVisibility(isLocal);
      this.uiManager.syncProjectionsToggleVisibility(isLocal);
      this.uiManager.syncVernalToggleVisibility(isLocal);
      this.uiManager.syncPlaneToggleVisibility(isLocal);
      this.uiManager.syncFreeFlyToggleVisibility(isLocal);
      this.uiManager.syncZoomSliderVisibility(!isLocal);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
