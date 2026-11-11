import { LocationModalController } from './ui/locationModal.js';
import { GuideStarWidgetController } from './ui/guideStarWidget.js';
import { MenuBarController } from './ui/menubarController.js';

export class UIController {
  constructor(celestialScene) {
    this.scene = celestialScene;
    this.initDOM();

    // Instantiate Sub-Controllers
    this.menuBarController = new MenuBarController();
    this.locationModalController = new LocationModalController(this);
    this.guideStarWidgetController = new GuideStarWidgetController(this);

    this.bindEvents();
    this.guideStarWidgetController.updateVectorState();
  }

  initDOM() {
    // Inputs & Sliders (Horizon Widget)
    this.latitudeInput = document.getElementById('latitudeInput');
    this.latitudeRange = document.getElementById('latitudeRange');
    this.earthRotationRange = document.getElementById('earthRotationRange');

    // Checkboxes
    this.gridCheckbox = document.getElementById('gridCheckbox');
    this.sphereCheckbox = document.getElementById('sphereCheckbox');
    this.coordCheckbox = document.getElementById('coordCheckbox');
    this.equatorCheckbox = document.getElementById('equatorCheckbox');
    this.eclipticCheckbox = document.getElementById('eclipticCheckbox');
    this.vernalCheckbox = document.getElementById('vernalCheckbox');
    this.starIndexCheckbox = document.getElementById('starIndexCheckbox');

    // Buttons & Camera Selectors
    this.clearStarsButton = document.getElementById('clearStarsButton');
    this.camSelect = document.getElementById('camSelect');
    this.camSphereRadio = document.getElementById('camSphereRadio');
    this.camLatitudeRadio = document.getElementById('camLatitudeRadio');

    // Floating Widgets
    this.horizonWidget = document.getElementById('horizonWidget');

    // Modals
    this.importModal = document.getElementById('importModal');
    this.openImportModalBtn = document.getElementById('openImportModalBtn');
    this.closeImportModalButton = document.getElementById('closeImportModalButton');
    this.cancelImportModalButton = document.getElementById('cancelImportModalButton');

    this.helpModal = document.getElementById('helpModal');
    this.openHelpModalBtn = document.getElementById('openHelpModalBtn');
    this.closeHelpModalButton = document.getElementById('closeHelpModalButton');
    this.acceptHelpModalButton = document.getElementById('acceptHelpModalButton');

    this.confirmModal = document.getElementById('confirmModal');
    this.cancelConfirmModalButton = document.getElementById('cancelConfirmModalButton');
    this.acceptConfirmModalButton = document.getElementById('acceptConfirmModalButton');
    this.closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');

    this.errorModal = document.getElementById('errorModal');
    this.closeErrorModalBtn = document.getElementById('closeErrorModalBtn');
  }

  bindEvents() {
    // Escape Key Listener for Modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll('.modal-overlay.active');
        activeModals.forEach(modal => modal.classList.remove('active'));
      }
    });

    // 2. Latitude Synchronization
    const handleLatitudeChange = () => {
      const raw = this.latitudeInput.value;
      if (raw === '' || raw === '-' || raw.endsWith('.') || raw.endsWith(',')) return;
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        if (this.latitudeRange) this.latitudeRange.value = val;
        this.scene.setLatitude(val);
        this.locationModalController.updateCityBadge(val);
      }
    };
    if (this.latitudeInput) {
      this.latitudeInput.addEventListener('input', handleLatitudeChange);
      this.latitudeInput.addEventListener('change', () => {
        let val = parseFloat(this.latitudeInput.value);
        if (isNaN(val)) val = 0;
        val = Math.max(-90, Math.min(90, val));
        this.latitudeInput.value = val;
        if (this.latitudeRange) this.latitudeRange.value = val;
        this.scene.setLatitude(val);
        this.locationModalController.updateCityBadge(val);
      });
    }

    if (this.latitudeRange) {
      this.latitudeRange.addEventListener('input', () => {
        if (this.latitudeInput) this.latitudeInput.value = this.latitudeRange.value;
        this.scene.setLatitude(this.latitudeRange.value);
        this.locationModalController.updateCityBadge(this.latitudeRange.value);
      });
    }

    // 3. Earth Rotation Range
    if (this.earthRotationRange) {
      this.earthRotationRange.addEventListener('input', () => {
        this.scene.setEarthRotation(this.earthRotationRange.value);
      });
    }

    // 4. Visual Helpers Checkboxes
    if (this.eclipticCheckbox) {
      this.eclipticCheckbox.addEventListener('change', () => {
        this.scene.setHelpersVisibility({ ecliptic: this.eclipticCheckbox.checked });
      });
    }
    if (this.gridCheckbox) {
      this.gridCheckbox.addEventListener('change', () => {
        this.scene.setHelpersVisibility({ grid: this.gridCheckbox.checked });
      });
    }
    if (this.sphereCheckbox) {
      this.sphereCheckbox.addEventListener('change', () => {
        this.scene.setHelpersVisibility({ sphere: this.sphereCheckbox.checked });
      });
    }
    if (this.coordCheckbox) {
      this.coordCheckbox.addEventListener('change', () => {
        this.scene.setHelpersVisibility({ coord: this.coordCheckbox.checked });
      });
    }
    if (this.equatorCheckbox) {
      this.equatorCheckbox.addEventListener('change', () => {
        this.scene.setHelpersVisibility({ equator: this.equatorCheckbox.checked });
      });
    }
    if (this.vernalCheckbox) {
      this.vernalCheckbox.addEventListener('change', () => {
        this.scene.setHelpersVisibility({ vernal: this.vernalCheckbox.checked });
      });
    }
    if (this.starIndexCheckbox) {
      this.starIndexCheckbox.addEventListener('change', () => {
        this.scene.setHelpersVisibility({ indices: this.starIndexCheckbox.checked });
      });
    }

    // 5. Clear Stars Confirmation Modal
    if (this.clearStarsButton && this.confirmModal) {
      this.clearStarsButton.addEventListener('click', () => {
        this.closeAllDropdowns();
        this.confirmModal.classList.add('active');
      });
      if (this.cancelConfirmModalButton) {
        this.cancelConfirmModalButton.addEventListener('click', () => {
          this.confirmModal.classList.remove('active');
        });
      }
      if (this.closeConfirmModalBtn) {
        this.closeConfirmModalBtn.addEventListener('click', () => {
          this.confirmModal.classList.remove('active');
        });
      }
      if (this.acceptConfirmModalButton) {
        this.acceptConfirmModalButton.addEventListener('click', () => {
          this.scene.clearAllStars();
          this.confirmModal.classList.remove('active');
        });
      }
      this.confirmModal.addEventListener('click', (e) => {
        if (e.target === this.confirmModal) {
          this.confirmModal.classList.remove('active');
        }
      });
    }

    // 6. Import Catalog Modal
    if (this.openImportModalBtn && this.importModal) {
      this.openImportModalBtn.addEventListener('click', () => {
        this.closeAllDropdowns();
        this.importModal.classList.add('active');
      });
      if (this.closeImportModalButton) {
        this.closeImportModalButton.addEventListener('click', () => {
          this.importModal.classList.remove('active');
        });
      }
      if (this.cancelImportModalButton) {
        this.cancelImportModalButton.addEventListener('click', () => {
          this.importModal.classList.remove('active');
        });
      }
      this.importModal.addEventListener('click', (e) => {
        if (e.target === this.importModal) {
          this.importModal.classList.remove('active');
        }
      });
    }

    // 7. Help Modal
    if (this.openHelpModalBtn && this.helpModal) {
      this.openHelpModalBtn.addEventListener('click', () => {
        this.closeAllDropdowns();
        this.helpModal.classList.add('active');
      });
      if (this.closeHelpModalButton) {
        this.closeHelpModalButton.addEventListener('click', () => {
          this.helpModal.classList.remove('active');
        });
      }
      if (this.acceptHelpModalButton) {
        this.acceptHelpModalButton.addEventListener('click', () => {
          this.helpModal.classList.remove('active');
        });
      }
      this.helpModal.addEventListener('click', (e) => {
        if (e.target === this.helpModal) {
          this.helpModal.classList.remove('active');
        }
      });
    }

    // 8. Error Modal
    if (this.closeErrorModalBtn && this.errorModal) {
      this.closeErrorModalBtn.addEventListener('click', () => {
        this.errorModal.classList.remove('active');
      });
    }

    // 9. Camera Selectors
    const handleCameraModeChange = (mode) => {
      if (this.camSelect) this.camSelect.value = mode;
      if (mode === 'camSphere') {
        if (this.camSphereRadio) this.camSphereRadio.checked = true;
        if (this.horizonWidget) this.horizonWidget.style.display = 'none';
        if (this.guideStarWidgetController.vectorCheckbox) {
          this.guideStarWidgetController.vectorCheckbox.disabled = false;
        }
        this.scene.setCameraMode('camSphere');
      } else {
        if (this.camLatitudeRadio) this.camLatitudeRadio.checked = true;
        if (this.horizonWidget) this.horizonWidget.style.display = 'flex';
        if (this.guideStarWidgetController.vectorCheckbox) {
          this.guideStarWidgetController.vectorCheckbox.checked = false;
        }
        if (this.equatorCheckbox) this.equatorCheckbox.checked = false;
        this.guideStarWidgetController.updateVectorState();
        this.scene.setHelpersVisibility({
          vector: false,
          equator: false
        });
        this.scene.setCameraMode('camLatitude');
      }
    };

    if (this.camSphereRadio) {
      this.camSphereRadio.addEventListener('change', () => handleCameraModeChange('camSphere'));
    }
    if (this.camLatitudeRadio) {
      this.camLatitudeRadio.addEventListener('change', () => handleCameraModeChange('camLatitude'));
    }
    if (this.camSelect) {
      this.camSelect.addEventListener('change', () => handleCameraModeChange(this.camSelect.value));
    }

    if (this.latitudeInput) {
      this.locationModalController.updateCityBadge(this.latitudeInput.value);
    }
  }

  closeAllDropdowns() {
    if (this.menuBarController) {
      this.menuBarController.closeAllDropdowns();
    }
  }

  // Forwarding helpers for backward compatibility
  updateGuideStar() {
    this.guideStarWidgetController.updateGuideStar();
  }

  updateVectorState() {
    this.guideStarWidgetController.updateVectorState();
  }

  updateCityBadge(latVal, explicitCityName = null) {
    this.locationModalController.updateCityBadge(latVal, explicitCityName);
  }
}
