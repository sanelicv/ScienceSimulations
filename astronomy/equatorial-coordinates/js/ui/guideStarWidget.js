import { formatRA, formatDec } from '../astroMath.js';

export class GuideStarWidgetController {
  constructor(uiController) {
    this.ui = uiController;
    this.scene = uiController.scene;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.RAInput = document.getElementById('RAInput');
    this.RARange = document.getElementById('RARange');
    this.DecInput = document.getElementById('DecInput');
    this.DecRange = document.getElementById('DecRange');
    this.vectorCheckbox = document.getElementById('vectorCheckbox');
    this.guideStarWidget = document.getElementById('guideStarWidget');
    this.closeGuideStarWidgetBtn = document.getElementById('closeGuideStarWidgetBtn');
    this.overlayText = document.getElementById('overlayText');
    this.RAOverlayText = document.getElementById('RAOverlayText');
    this.DecOverlayText = document.getElementById('DecOverlayText');
    this.addStarButton = document.getElementById('addStarButton');
  }

  bindEvents() {
    // Synchronize RA Input & Range
    const handleRAChange = () => {
      const raw = this.RAInput.value;
      if (raw === '' || raw === '-' || raw.endsWith('.') || raw.endsWith(',')) return;
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        this.RARange.value = val;
        this.updateGuideStar();
      }
    };
    this.RAInput.addEventListener('input', handleRAChange);
    this.RAInput.addEventListener('change', () => {
      let val = parseFloat(this.RAInput.value);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(24, val));
      this.RAInput.value = val;
      this.RARange.value = val;
      this.updateGuideStar();
    });
    this.RARange.addEventListener('input', () => {
      this.RAInput.value = this.RARange.value;
      this.updateGuideStar();
    });

    // Synchronize Dec Input & Range
    const handleDecChange = () => {
      const raw = this.DecInput.value;
      if (raw === '' || raw === '-' || raw.endsWith('.') || raw.endsWith(',')) return;
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        this.DecRange.value = val;
        this.updateGuideStar();
      }
    };
    this.DecInput.addEventListener('input', handleDecChange);
    this.DecInput.addEventListener('change', () => {
      let val = parseFloat(this.DecInput.value);
      if (isNaN(val)) val = 0;
      val = Math.max(-90, Math.min(90, val));
      this.DecInput.value = val;
      this.DecRange.value = val;
      this.updateGuideStar();
    });
    this.DecRange.addEventListener('input', () => {
      this.DecInput.value = this.DecRange.value;
      this.updateGuideStar();
    });

    // Toggle Vector Checkbox
    if (this.vectorCheckbox) {
      this.vectorCheckbox.addEventListener('change', () => {
        this.updateVectorState();
      });
    }

    if (this.closeGuideStarWidgetBtn) {
      this.closeGuideStarWidgetBtn.addEventListener('click', () => {
        if (this.vectorCheckbox) this.vectorCheckbox.checked = false;
        this.updateVectorState();
      });
    }

    // Add Star Button
    if (this.addStarButton) {
      this.addStarButton.addEventListener('click', () => {
        if (this.vectorCheckbox && this.vectorCheckbox.checked) {
          const ra = parseFloat(this.RAInput.value) || 0;
          const dec = parseFloat(this.DecInput.value) || 0;
          this.scene.addUserStar(ra, dec);
        }
      });
    }

    // Arrow key navigation listener
    document.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (!this.vectorCheckbox || !this.vectorCheckbox.checked) return;
        if (document.querySelector('.modal-overlay.active')) return;

        const active = document.activeElement;
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
        if (active && active.tagName === 'INPUT' && (active.type === 'text' || active.type === 'file' || active.type === 'password' || active.type === 'search')) return;

        e.preventDefault();

        let ra = parseFloat(this.RAInput.value) || 0;
        let dec = parseFloat(this.DecInput.value) || 0;

        switch (e.key) {
          case 'ArrowLeft':
            ra = Math.max(0, Math.min(24, Math.round((ra - 0.01) * 100) / 100));
            break;
          case 'ArrowRight':
            ra = Math.max(0, Math.min(24, Math.round((ra + 0.01) * 100) / 100));
            break;
          case 'ArrowUp':
            dec = Math.max(-90, Math.min(90, Math.round((dec + 0.01) * 100) / 100));
            break;
          case 'ArrowDown':
            dec = Math.max(-90, Math.min(90, Math.round((dec - 0.01) * 100) / 100));
            break;
        }

        this.RAInput.value = ra;
        this.RARange.value = ra;
        this.DecInput.value = dec;
        this.DecRange.value = dec;
        this.updateGuideStar();
      }
    });
  }

  updateGuideStar() {
    const ra = parseFloat(this.RAInput.value) || 0;
    const dec = parseFloat(this.DecInput.value) || 0;

    if (this.RAOverlayText) this.RAOverlayText.textContent = formatRA(ra);
    if (this.DecOverlayText) this.DecOverlayText.textContent = formatDec(dec);

    if (this.vectorCheckbox && this.vectorCheckbox.checked) {
      this.scene.updateGuideVector(ra, dec);
    }
  }

  updateVectorState() {
    const isChecked = this.vectorCheckbox ? this.vectorCheckbox.checked : false;
    if (this.RAInput) this.RAInput.disabled = !isChecked;
    if (this.RARange) this.RARange.disabled = !isChecked;
    if (this.DecInput) this.DecInput.disabled = !isChecked;
    if (this.DecRange) this.DecRange.disabled = !isChecked;
    if (this.addStarButton) this.addStarButton.disabled = !isChecked;
    if (this.overlayText) this.overlayText.style.display = isChecked ? 'flex' : 'none';

    if (this.guideStarWidget) {
      this.guideStarWidget.style.display = isChecked ? 'flex' : 'none';
    }

    this.scene.setHelpersVisibility({ vector: isChecked });

    if (isChecked) {
      this.updateGuideStar();
    }
  }
}
