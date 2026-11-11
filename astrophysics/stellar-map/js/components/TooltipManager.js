import * as THREE from 'three';
import { GEOMETRY_CONFIG } from '../config.js';

export class TooltipManager {
  constructor(sceneManager, starSystem) {
    this.sceneManager = sceneManager;
    this.camera = sceneManager.camera;
    this.starSystem = starSystem;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-10, -10);
    this.mouseScreenPos = { x: 0, y: 0 };
    this.hoveredInstanceId = null;
    this.metadata = { distanceUnit: 'ly', raMode: 'hours', raUnit: 'h' };

    this.visibleFields = {
      id: true,
      name: true,
      index: true,
      ra: true,
      dec: true,
      distSun: true,
      distObs: true,
      lum: true,
      flux: true
    };

    this.tooltipEl = null;
    this.init();
  }

  setMetadata(metadata) {
    if (metadata) {
      this.metadata = metadata;
    }
  }

  resetFieldsConfig() {
    this.visibleFields = {
      id: true,
      name: true,
      index: true,
      ra: true,
      dec: true,
      distSun: true,
      distObs: true,
      lum: true,
      flux: true
    };
  }

  applyConfig(config) {
    if (!config) return;

    if (config.fontSize && this.tooltipEl) {
      this.tooltipEl.style.fontSize = typeof config.fontSize === 'number'
        ? `${config.fontSize}px`
        : config.fontSize;
    }
    if (config.width && this.tooltipEl) {
      this.tooltipEl.style.width = typeof config.width === 'number'
        ? `${config.width}px`
        : config.width;
    }

    const fields = config.fields || config.fieldsToShow || config;
    const knownKeys = ['id', 'name', 'showName', 'index', 'showIndex', 'ra', 'dec', 'distSun', 'distObs', 'lum', 'flux'];
    knownKeys.forEach(key => {
      if (fields[key] !== undefined) {
        this.visibleFields[key] = !!fields[key];
      }
    });
  }

  init() {
    // Create tooltip DOM element if not present
    this.tooltipEl = document.getElementById('star-tooltip');
    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.id = 'star-tooltip';
      this.tooltipEl.className = 'star-tooltip';
      document.body.appendChild(this.tooltipEl);
    }

    if (GEOMETRY_CONFIG.TOOLTIP_FONT_SIZE) {
      this.tooltipEl.style.fontSize = typeof GEOMETRY_CONFIG.TOOLTIP_FONT_SIZE === 'number'
        ? `${GEOMETRY_CONFIG.TOOLTIP_FONT_SIZE}px`
        : GEOMETRY_CONFIG.TOOLTIP_FONT_SIZE;
    }
    if (GEOMETRY_CONFIG.TOOLTIP_WIDTH && GEOMETRY_CONFIG.TOOLTIP_WIDTH !== 'auto') {
      this.tooltipEl.style.width = typeof GEOMETRY_CONFIG.TOOLTIP_WIDTH === 'number'
        ? `${GEOMETRY_CONFIG.TOOLTIP_WIDTH}px`
        : GEOMETRY_CONFIG.TOOLTIP_WIDTH;
    }
    if (GEOMETRY_CONFIG.TOOLTIP_BG_COLOR) {
      this.tooltipEl.style.backgroundColor = GEOMETRY_CONFIG.TOOLTIP_BG_COLOR;
    }
    if (GEOMETRY_CONFIG.TOOLTIP_BORDER_COLOR) {
      this.tooltipEl.style.borderColor = GEOMETRY_CONFIG.TOOLTIP_BORDER_COLOR;
    }

    const canvas = this.sceneManager.renderer.domElement;

    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerleave', () => this.onPointerLeave());
  }

  onPointerMove(event) {
    this.mouseScreenPos.x = event.clientX;
    this.mouseScreenPos.y = event.clientY;

    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerLeave() {
    this.mouse.set(-10, -10);
    if (this.starSystem) {
      this.starSystem.highlightStar(null);
    }
    this.hoveredInstanceId = null;
    this.hide();
  }

  calculateObserverDistance(star) {
    if (!this.starSystem || !this.camera || !star) return 0;
    const starPos = this.starSystem.getStarVisualPos(star);
    const dist3D = this.camera.position.distanceTo(starPos);
    const scaleFactor = (this.starSystem.visualScaleFactor && this.starSystem.visualScaleFactor > 0)
      ? this.starSystem.visualScaleFactor
      : 1.0;
    return dist3D / scaleFactor;
  }

  update() {
    if (!GEOMETRY_CONFIG.SHOW_STAR_TOOLTIP || !this.starSystem || !this.starSystem.mesh) {
      this.hide();
      return;
    }

    const data = this.starSystem.starsData;
    if (!data || data.length === 0) {
      this.hide();
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    const intersects = this.raycaster.intersectObject(this.starSystem.mesh, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const instanceId = hit.instanceId;

      if (instanceId !== undefined && instanceId >= 0 && instanceId < data.length) {
        if (this.hoveredInstanceId !== instanceId) {
          this.hoveredInstanceId = instanceId;
          if (this.starSystem) {
            this.starSystem.highlightStar(instanceId);
          }
        }
        const star = data[instanceId];
        this.renderTooltipContent(star, instanceId);

        this.positionTooltip(this.mouseScreenPos.x, this.mouseScreenPos.y);
        this.show();
        document.body.style.cursor = 'pointer';
        return;
      }
    }

    // No hit
    if (this.hoveredInstanceId !== null) {
      this.hoveredInstanceId = null;
      if (this.starSystem) {
        this.starSystem.highlightStar(null);
      }
      document.body.style.cursor = 'default';
    }
    this.hide();
  }

  renderTooltipContent(star, index) {
    const posIndex = `#${index + 1}`;
    const customId = (star.id !== undefined && star.id !== null && String(star.id).trim() !== '')
      ? String(star.id).trim()
      : ((star.name !== undefined && star.name !== null && String(star.name).trim() !== '')
        ? String(star.name).trim()
        : null);

    const ra = parseFloat(star.ra) || 0;
    const dec = parseFloat(star.dec) || 0;
    const distSun = parseFloat(star.d) || 0;
    const distObs = this.calculateObserverDistance(star);

    const raUnit = (this.metadata && this.metadata.raUnit) ? this.metadata.raUnit : 'h';
    const distUnit = (this.metadata && this.metadata.distanceUnit) ? this.metadata.distanceUnit : 'ly';

    const fields = this.visibleFields || {
      id: true,
      name: true,
      index: true,
      ra: true,
      dec: true,
      distSun: true,
      distObs: true,
      lum: true,
      flux: true
    };

    const showName = (fields.name !== undefined ? !!fields.name : (fields.showName !== undefined ? !!fields.showName : true));
    const showIndex = (fields.index !== undefined ? !!fields.index : (fields.showIndex !== undefined ? !!fields.showIndex : true));

    let displayId = '';
    if (customId) {
      if (showName && showIndex) {
        displayId = `${customId} (${posIndex})`;
      } else if (showName) {
        displayId = customId;
      } else if (showIndex) {
        displayId = posIndex;
      } else {
        displayId = customId;
      }
    } else {
      displayId = posIndex;
    }

    const rows = [];

    if (fields.id !== false) {
      rows.push(`
      <div class="tooltip-row">
        <span class="tooltip-label">ID:</span>
        <span class="tooltip-value">${displayId}</span>
      </div>`);
    }

    if (fields.ra !== false) {
      rows.push(`
      <div class="tooltip-row">
        <span class="tooltip-label">Ascensión Recta:</span>
        <span class="tooltip-value">${ra.toFixed(2)} ${raUnit}</span>
      </div>`);
    }

    if (fields.dec !== false) {
      rows.push(`
      <div class="tooltip-row">
        <span class="tooltip-label">Declinación:</span>
        <span class="tooltip-value">${dec >= 0 ? '+' : ''}${dec.toFixed(2)}°</span>
      </div>`);
    }

    if (fields.distSun !== false) {
      rows.push(`
      <div class="tooltip-row">
        <span class="tooltip-label">Dist. al Sol:</span>
        <span class="tooltip-value">${distSun.toFixed(2)} ${distUnit}</span>
      </div>`);
    }

    if (fields.distObs !== false) {
      rows.push(`
      <div class="tooltip-row">
        <span class="tooltip-label">Dist. al Observador:</span>
        <span class="tooltip-value">${distObs.toFixed(2)} ${distUnit}</span>
      </div>`);
    }

    const hasLum = star.lum !== undefined && star.lum !== null && !isNaN(parseFloat(star.lum));
    const lumVal = hasLum ? parseFloat(star.lum) : 1.0;

    if (fields.lum !== false && hasLum) {
      let formattedLum;
      if (Math.abs(lumVal) >= 100000 || (Math.abs(lumVal) < 0.001 && lumVal !== 0)) {
        formattedLum = lumVal.toExponential(2);
      } else if (Number.isInteger(lumVal)) {
        formattedLum = lumVal.toString();
      } else {
        formattedLum = lumVal.toFixed(2);
      }
      rows.push(`
      <div class="tooltip-row">
        <span class="tooltip-label">Luminosidad:</span>
        <span class="tooltip-value">${formattedLum} L<sub>☉</sub></span>
      </div>`);
    }

    if (fields.flux !== false) {
      // Convert distance to light-years (ly) for flux calculation (L_☉ / ly²)
      const distanceUnitToLy = {
        ly: 1,
        pc: 3.261563777,
        kpc: 3261.563777,
        Mpc: 3261563.777,
        Mly: 1000000,
        au: 0.000015812507
      };
      const factorToLy = distanceUnitToLy[distUnit] || 1;
      const distLy = distSun * factorToLy;

      if (distLy > 0) {
        const flux = lumVal / (distLy * distLy);
        let formattedFlux;
        if (flux > 0 && (flux < 0.000001 || flux >= 1000000)) {
          formattedFlux = flux.toExponential(6);
        } else {
          formattedFlux = flux.toFixed(6);
        }
        rows.push(`
      <div class="tooltip-row">
        <span class="tooltip-label">Flujo:</span>
        <span class="tooltip-value">${formattedFlux} L<sub>☉</sub>/ly<sup>2</sup></span>
      </div>`);
      }
    }

    this.tooltipEl.innerHTML = rows.join('');
  }

  positionTooltip(clientX, clientY) {
    if (!this.tooltipEl) return;

    const offset = 16;
    const rect = this.tooltipEl.getBoundingClientRect();
    let left = clientX + offset;
    let top = clientY + offset;

    // Boundary checks against viewport edges
    if (left + rect.width > window.innerWidth - 12) {
      left = clientX - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight - 12) {
      top = clientY - rect.height - offset;
    }

    this.tooltipEl.style.left = `${Math.max(12, left)}px`;
    this.tooltipEl.style.top = `${Math.max(12, top)}px`;
  }

  show() {
    if (this.tooltipEl && !this.tooltipEl.classList.contains('visible')) {
      this.tooltipEl.classList.add('visible');
    }
  }

  hide() {
    if (this.tooltipEl && this.tooltipEl.classList.contains('visible')) {
      this.tooltipEl.classList.remove('visible');
    }
  }
}
