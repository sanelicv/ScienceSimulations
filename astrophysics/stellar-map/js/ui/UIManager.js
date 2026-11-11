
import { GEOMETRY_CONFIG } from '../config.js';

export class UIManager {
  constructor(app) {
    this.app = app;
    this.isLocalMode = false;
    this.savedGlobalStarScale = GEOMETRY_CONFIG.GLOBAL_MODE_STAR_SIZE_DEFAULT !== undefined ? GEOMETRY_CONFIG.GLOBAL_MODE_STAR_SIZE_DEFAULT : 5.0;
    this.savedLocalStarScale = GEOMETRY_CONFIG.LOCAL_MODE_STAR_SIZE_DEFAULT !== undefined ? GEOMETRY_CONFIG.LOCAL_MODE_STAR_SIZE_DEFAULT : 1.5;
    this.savedGlobalCameraDistance = 200;
    this.init();
  }

  init() {
    // Sliders
    this.raSlider = document.getElementById('ra-slider');
    this.decSlider = document.getElementById('dec-slider');
    this.distSlider = document.getElementById('dist-slider');

    this.raValue = document.getElementById('ra-input');
    this.decValue = document.getElementById('dec-input');
    this.distValue = document.getElementById('dist-input');

    // Toggles & Buttons
    this.btnConfigureUnits = document.getElementById('btn-configure-units');

    this.setupListeners();
  }

  setupListeners() {
    if (this.btnConfigureUnits) {
      this.btnConfigureUnits.addEventListener('click', () => {
        if (this.app.unitSelectorModal && this.app.availableColumns) {
          this.app.unitSelectorModal.show(
            this.app.availableColumns,
            this.app.activeSelections,
            (selectedSelections) => {
              this.app.applyDatasetSelections(selectedSelections);
            }
          );
        }
      });
    }
    const updateGuides = () => {
      const ra = parseFloat(this.raSlider.value);
      const dec = parseFloat(this.decSlider.value);
      const dist = parseFloat(this.distSlider.value);

      // No need to update textContent here as we now use inputs
      // but we should ensure they have the right value if needed

      if (this.app.guides) {
        this.app.guides.updateValues(ra, dec, dist);
      }
    };

    const updateFromInput = (e) => {
      const id = e.target.id;
      const val = parseFloat(e.target.value);

      if (id === 'ra-input') this.raSlider.value = val;
      if (id === 'dec-input') this.decSlider.value = val;
      if (id === 'dist-input') this.distSlider.value = val;

      updateGuides();
    };

    const updateFromSlider = (e) => {
      const id = e.target.id;
      const val = parseFloat(e.target.value);

      if (id === 'ra-slider') this.raValue.value = val;
      if (id === 'dec-slider') this.decValue.value = val;
      if (id === 'dist-slider') this.distValue.value = val;

      updateGuides();
    };

    this.raSlider.addEventListener('input', updateFromSlider);
    this.decSlider.addEventListener('input', updateFromSlider);
    this.distSlider.addEventListener('input', updateFromSlider);

    this.raValue.addEventListener('input', updateFromInput);
    this.decValue.addEventListener('input', updateFromInput);
    this.distValue.addEventListener('input', updateFromInput);
    this.raValue.addEventListener('change', updateFromInput);
    this.decValue.addEventListener('change', updateFromInput);
    this.distValue.addEventListener('change', updateFromInput);

    // Stellar Guide Toggle
    this.toggleGuide = document.getElementById('toggle-guide');
    this.guideControls = document.getElementById('stellar-guide-controls');
    this.guideContainer = document.getElementById('stellar-guide-container');

    if (this.toggleGuide) {
      this.toggleGuide.addEventListener('change', (e) => {
        const isVisible = e.target.checked;
        if (this.guideControls) {
          if (isVisible) {
            this.guideControls.classList.remove('hidden');
            if (this.app.starSystem && this.app.starSystem.maxDistance) {
              const maxDist = this.app.starSystem.maxDistance;
              const planeFactor = GEOMETRY_CONFIG.PLANE_SIZE_FACTOR !== undefined ? GEOMETRY_CONFIG.PLANE_SIZE_FACTOR : 1.2;
              const initialDist = maxDist * planeFactor;
              if (this.distSlider) this.distSlider.value = initialDist;
              if (this.distValue) this.distValue.value = initialDist;
              updateGuides();
            }
          } else {
            this.guideControls.classList.add('hidden');
          }
        }
        if (this.app.guides) {
          this.app.guides.setVisibility(isVisible);
        }
      });

      // Initialize state (hidden by default as per HTML structure)
      if (this.app.guides) {
        this.app.guides.setVisibility(this.toggleGuide.checked);
      }
    }

    this.toggleVernal = document.getElementById('toggle-vernal');

    if (this.app.grids) {
      this.app.grids.toggleGrid(true);
      if (this.toggleVernal) this.app.grids.toggleVernalPoint(this.toggleVernal.checked);
    }

    this.toggleProjections = document.getElementById('toggle-projections');

    if (this.toggleVernal) {
      this.toggleVernal.addEventListener('change', (e) => {
        if (this.app.grids) this.app.grids.toggleVernalPoint(e.target.checked);
      });
    }

    const toggleZodiac = document.getElementById('toggle-zodiac');
    if (toggleZodiac) {
      toggleZodiac.addEventListener('change', (e) => {
        if (this.app.constellations) {
          this.app.constellations.toggle(e.target.checked);
        }
      });
    }

    const toggleTooltip = document.getElementById('toggle-tooltip');
    if (toggleTooltip) {
      toggleTooltip.addEventListener('change', (e) => {
        GEOMETRY_CONFIG.SHOW_STAR_TOOLTIP = e.target.checked;
        if (!e.target.checked && this.app.tooltipManager) {
          this.app.tooltipManager.hide();
        }
      });
    }

    const toggleViewMode = document.getElementById('toggle-view-mode');
    if (toggleViewMode) {
      toggleViewMode.addEventListener('change', (e) => {
        if (this.app) {
          this.app.setObserverMode(e.target.checked);
        }
      });
    }

    const toggleGlobalGrid = document.getElementById('toggle-global-grid');
    if (toggleGlobalGrid) {
      toggleGlobalGrid.addEventListener('change', (e) => {
        if (this.app.grids) {
          this.app.grids.setGlobalModeVisibility(e.target.checked);
        }
      });
    }

    const togglePlane = document.getElementById('toggle-plane');
    if (togglePlane) {
      togglePlane.addEventListener('change', (e) => {
        if (this.app.grids) {
          this.app.grids.togglePlane(e.target.checked);
        }
      });
    }

    const toggleApparent = document.getElementById('toggle-apparent-brightness');
    if (toggleApparent) {
      toggleApparent.addEventListener('change', (e) => {
        if (this.app.starSystem) {
          this.app.starSystem.setApparentBrightness(e.target.checked);
        }
      });
    }

    const toggleFreeFly = document.getElementById('toggle-free-fly');
    const zoomGroup = document.getElementById('zoom-control-group');

    if (toggleFreeFly) {
      toggleFreeFly.addEventListener('change', (e) => {
        const isFreeFly = e.target.checked;
        if (this.app.sceneManager) {
          this.app.sceneManager.toggleFreeFly(isFreeFly);
          if (!isFreeFly && this.zoomSlider) {
            this.zoomSlider.value = this.app.sceneManager.getCameraDistance();
          }
        }
        if (zoomGroup) {
          if (isFreeFly) {
            zoomGroup.classList.add('hidden');
          } else {
            zoomGroup.classList.remove('hidden');
          }
        }
      });
    }

    if (this.toggleProjections) {
      this.toggleProjections.addEventListener('change', (e) => {
        if (this.app.starSystem) this.app.starSystem.toggleProjections(e.target.checked);
      });
      // Initialize state
      if (this.app.starSystem) {
        this.app.starSystem.toggleProjections(this.toggleProjections.checked);
      }
    }

    // Star Size
    const sizeSlider = document.getElementById('star-size-slider');
    if (sizeSlider) {
      const initialScale = parseFloat(sizeSlider.value);
      this.savedGlobalStarScale = initialScale;
      if (this.app.starSystem) this.app.starSystem.updateScaleFactor(initialScale);

      sizeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.isLocalMode) {
          this.savedLocalStarScale = val;
        } else {
          this.savedGlobalStarScale = val;
        }
        if (this.app.starSystem) {
          this.app.starSystem.updateScaleFactor(val);
        }
      });
    }

    // Zoom Slider
    this.zoomSlider = document.getElementById('zoom-slider');
    if (this.zoomSlider) {
      // 1. UI -> App
      this.zoomSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.app.sceneManager) {
          this.app.sceneManager.setCameraDistance(val);
        }
        if (!this.isLocalMode) {
          this.savedGlobalCameraDistance = val;
        }
      });

      // 2. App (OrbitControls) -> UI
      // We need to listen to change event from controls
      if (this.app.sceneManager && this.app.sceneManager.controls) {
        this.app.sceneManager.controls.addEventListener('change', () => {
          const dist = this.app.sceneManager.getCameraDistance();
          if (this.zoomSlider) {
            this.zoomSlider.value = dist;
          }
          if (!this.isLocalMode && dist > 1.0) {
            this.savedGlobalCameraDistance = dist;
          }
        });
      }
    }

    // Initial update
    updateGuides();
  }

  updateZoomSliderLimits(maxZoom, currentDist) {
    if (this.zoomSlider) {
      this.zoomSlider.min = 0.01;
      this.zoomSlider.max = maxZoom;
      this.zoomSlider.step = 0.01;
      if (currentDist !== undefined) {
        this.zoomSlider.value = currentDist;
      }
    }
  }

  showGuideToggle() {
    if (this.guideContainer) {
      this.guideContainer.classList.remove('hidden');
    }
  }

  updateDistSliderMax(maxDist) {
    const planeFactor = GEOMETRY_CONFIG.PLANE_SIZE_FACTOR !== undefined ? GEOMETRY_CONFIG.PLANE_SIZE_FACTOR : 1.2;
    const maxPlaneDist = maxDist * planeFactor; // Iguala la mitad del lado del plano horizontal

    const rawStep = maxPlaneDist > 0 ? maxPlaneDist / 1000 : 0.1;
    const step = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const defaultValue = maxPlaneDist;

    if (this.distSlider) {
      this.distSlider.max = maxPlaneDist;
      this.distSlider.step = step;
      this.distSlider.value = defaultValue;
    }
    if (this.distValue) {
      this.distValue.max = maxPlaneDist;
      this.distValue.step = step;
      this.distValue.value = defaultValue;
    }

    // Update the actual guides component state
    if (this.app.guides) {
      this.app.guides.updateValues(
        parseFloat(this.raSlider.value) || 0,
        parseFloat(this.decSlider.value) || 0,
        defaultValue
      );
    }

    // Update visualization immediately if guide is active
    if (this.toggleGuide && this.toggleGuide.checked) {
      const event = new Event('input');
      this.distSlider.dispatchEvent(event);
    }
  }

  updateDatasetMetadata(metadata) {
    if (!metadata) return;
    this.metadata = metadata;

    const raLabel = document.getElementById('ra-slider-label');
    const distLabel = document.getElementById('dist-slider-label');

    if (metadata.raMode === 'degrees') {
      if (raLabel) raLabel.textContent = 'RA [°]';
      if (this.raSlider) {
        this.raSlider.min = 0;
        this.raSlider.max = 360;
        this.raSlider.step = 0.1;
      }
      if (this.raValue) {
        this.raValue.min = 0;
        this.raValue.max = 360;
        this.raValue.step = 0.1;
      }
    } else {
      if (raLabel) raLabel.textContent = 'RA [h]';
      if (this.raSlider) {
        this.raSlider.min = 0;
        this.raSlider.max = 24;
        this.raSlider.step = 0.01;
      }
      if (this.raValue) {
        this.raValue.min = 0;
        this.raValue.max = 24;
        this.raValue.step = 0.01;
      }
    }

    const distUnit = metadata.distanceUnit || 'ly';
    if (distLabel) {
      distLabel.textContent = `Distancia [${distUnit}]`;
    }
  }

  showConfigureUnitsButton(show = true) {
    if (this.btnConfigureUnits) {
      if (show) {
        this.btnConfigureUnits.classList.remove('hidden');
      } else {
        this.btnConfigureUnits.classList.add('hidden');
      }
    }
  }

  syncViewModeToggle(isLocal) {
    const toggleViewMode = document.getElementById('toggle-view-mode');
    if (toggleViewMode) {
      toggleViewMode.checked = isLocal;
    }
  }

  syncApparentBrightnessToggle(isApparent) {
    const toggleApparent = document.getElementById('toggle-apparent-brightness');
    if (toggleApparent) {
      toggleApparent.checked = isApparent;
    }
  }

  syncZoomSliderVisibility(visible) {
    const zoomGroup = document.getElementById('zoom-control-group');
    if (zoomGroup) {
      if (visible) {
        zoomGroup.classList.remove('hidden');
      } else {
        zoomGroup.classList.add('hidden');
      }
    }
  }

  syncZodiacToggleVisibility(isLocal) {
    const zodiacGroup = document.getElementById('zodiac-toggle-group');
    if (zodiacGroup) {
      zodiacGroup.classList.remove('hidden');
    }
  }

  syncPlaneToggleVisibility(isLocal) {
    const planeGroup = document.getElementById('plane-toggle-group');
    if (planeGroup) {
      if (isLocal) {
        planeGroup.classList.add('hidden');
      } else {
        planeGroup.classList.remove('hidden');
      }
    }
  }

  syncProjectionsToggleVisibility(isLocal) {
    const projGroup = document.getElementById('projections-toggle-group');
    if (projGroup) {
      if (isLocal) {
        projGroup.classList.add('hidden');
      } else {
        projGroup.classList.remove('hidden');
      }
    }
  }

  syncVernalToggleVisibility(isLocal) {
    const vernalGroup = document.getElementById('vernal-toggle-group');
    if (vernalGroup) {
      if (isLocal) {
        vernalGroup.classList.add('hidden');
      } else {
        vernalGroup.classList.remove('hidden');
      }
    }
  }

  syncFreeFlyToggleVisibility(isLocal) {
    const freeFlyGroup = document.getElementById('free-fly-toggle-group');
    const toggleFreeFly = document.getElementById('toggle-free-fly');
    if (freeFlyGroup) {
      if (isLocal) {
        freeFlyGroup.classList.add('hidden');
        if (toggleFreeFly && toggleFreeFly.checked) {
          toggleFreeFly.checked = false;
          if (this.app && this.app.sceneManager) {
            this.app.sceneManager.toggleFreeFly(false);
          }
        }
      } else {
        freeFlyGroup.classList.remove('hidden');
      }
    }
  }

  setStarSizeSliderRange(isLocal) {
    this.isLocalMode = isLocal;
    const sizeSlider = document.getElementById('star-size-slider');
    if (!sizeSlider) return;

    if (isLocal) {
      sizeSlider.min = GEOMETRY_CONFIG.LOCAL_MODE_STAR_SIZE_MIN !== undefined ? GEOMETRY_CONFIG.LOCAL_MODE_STAR_SIZE_MIN : 0.1;
      sizeSlider.max = GEOMETRY_CONFIG.LOCAL_MODE_STAR_SIZE_MAX !== undefined ? GEOMETRY_CONFIG.LOCAL_MODE_STAR_SIZE_MAX : 3.0;
      sizeSlider.step = 0.1;
      sizeSlider.value = this.savedLocalStarScale;
    } else {
      sizeSlider.min = 0.1;
      sizeSlider.max = 10.0;
      sizeSlider.step = 0.1;
      sizeSlider.value = this.savedGlobalStarScale;
    }

    if (this.app.starSystem) {
      this.app.starSystem.updateScaleFactor(parseFloat(sizeSlider.value));
    }
  }
}
