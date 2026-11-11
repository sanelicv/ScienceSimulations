/**
 * TimeHudController (Co-located Component)
 * Módulo independiente y reutilizable para controlar la barra flotante de tiempo (Time HUD).
 * Encapsula el marcado HTML, estado y eventos de reproducción (Play/Pausa, Velocidad, Día).
 */

const SVG_ICONS = {
  PLAY: `<svg class="hud-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>`,
  PAUSE: `<svg class="hud-icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>`,
  SPEED: `<svg class="hud-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  CLOCK: `<svg class="hud-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
};

export class TimeHudController {
  /**
   * @param {Object} options Configuración del HUD
   * @param {string|HTMLElement} [options.container='body'] Contenedor donde inyectar el HUD si no existe
   * @param {number} [options.minDay=0] Día mínimo
   * @param {number} [options.maxDay=365] Día máximo
   * @param {number} [options.initialDay=0] Día inicial
   * @param {number} [options.minSpeed=0] Velocidad mínima
   * @param {number} [options.maxSpeed=30] Velocidad máxima
   * @param {number} [options.initialSpeed=1] Velocidad inicial
   * @param {boolean} [options.autoPlay=true] Iniciar reproduciendo
   * @param {boolean} [options.enableKeyboard=true] Habilitar barra espaciadora para Play/Pausa
   * @param {Function} [options.onPlayChange] Callback al cambiar play/pausa: (isPlaying) => {}
   * @param {Function} [options.onSpeedChange] Callback al cambiar velocidad: (speed) => {}
   * @param {Function} [options.onDayChange] Callback al cambiar día: (day, isUserInitiated) => {}
   */
  constructor(options = {}) {
    this.options = {
      container: options.container || 'body',
      minDay: options.minDay !== undefined ? options.minDay : 0,
      maxDay: options.maxDay !== undefined ? options.maxDay : 365,
      initialDay: options.initialDay !== undefined ? options.initialDay : 0,
      minSpeed: options.minSpeed !== undefined ? options.minSpeed : 0,
      maxSpeed: options.maxSpeed !== undefined ? options.maxSpeed : 30,
      initialSpeed: options.initialSpeed !== undefined ? options.initialSpeed : 1,
      autoPlay: options.autoPlay !== undefined ? options.autoPlay : true,
      enableKeyboard: options.enableKeyboard !== undefined ? options.enableKeyboard : true,
      onPlayChange: options.onPlayChange || null,
      onSpeedChange: options.onSpeedChange || null,
      onDayChange: options.onDayChange || null
    };

    this.state = {
      isPlaying: this.options.autoPlay,
      speed: this.options.initialSpeed,
      day: this.options.initialDay
    };

    this.initDOM();
    this.bindEvents();
    this.updateUI();
  }

  /**
   * Busca o crea la estructura DOM del HUD de forma inteligente.
   */
  initDOM() {
    let hud = document.getElementById('time-hud');

    if (!hud) {
      // Inyección automática inteligente si no existe en la página
      hud = document.createElement('div');
      hud.id = 'time-hud';
      hud.className = 'time-hud';
      hud.innerHTML = `
        <button id="btn-toggle-autotime" class="hud-play-btn" aria-label="Animar Tiempo (Auto)" title="Animar Tiempo (Espacio)">
          <span id="hud-play-icon">${SVG_ICONS.PAUSE}</span>
        </button>

        <div class="hud-divider"></div>

        <div class="hud-control-group">
          ${SVG_ICONS.SPEED}
          <label for="speed-range" class="hud-label">Velocidad:</label>
          <input type="range" id="speed-range" min="${this.options.minSpeed}" max="${this.options.maxSpeed}" value="${this.options.initialSpeed}">
          <span id="speed-value" class="hud-val">${this.options.initialSpeed}x</span>
        </div>

        <div class="hud-divider"></div>

        <div class="hud-control-group">
          ${SVG_ICONS.CLOCK}
          <label for="day-range" class="hud-label">Día:</label>
          <input type="range" id="day-range" min="${this.options.minDay}" max="${this.options.maxDay}" value="${this.options.initialDay}">
          <span id="day-value" class="hud-val">${Math.floor(this.options.initialDay)}</span>
        </div>
      `;

      const parentNode = typeof this.options.container === 'string'
        ? document.querySelector(this.options.container) || document.body
        : this.options.container;

      parentNode.appendChild(hud);
    }

    this.hudElement = hud;
    this.playBtn = hud.querySelector('#btn-toggle-autotime');
    this.playIconContainer = hud.querySelector('#hud-play-icon');
    this.speedRange = hud.querySelector('#speed-range');
    this.speedVal = hud.querySelector('#speed-value');
    this.dayRange = hud.querySelector('#day-range');
    this.dayVal = hud.querySelector('#day-value');

    // Retrocompatibilidad con checkbox oculto si existiera
    this.legacyCheckbox = document.getElementById('toggle-autotime');
  }

  bindEvents() {
    // 1. Botón Play / Pause
    if (this.playBtn) {
      this.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    // 2. Slider de Velocidad
    if (this.speedRange) {
      this.speedRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.state.speed = val;
        if (this.speedVal) this.speedVal.textContent = `${val}x`;
        if (this.options.onSpeedChange) this.options.onSpeedChange(val);
      });
    }

    // 3. Slider de Día (Interacción del usuario)
    if (this.dayRange) {
      this.dayRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.state.day = val;
        if (this.dayVal) this.dayVal.textContent = Math.floor(val);

        // Sincronizar badge superior en index.html si existe
        const topBadge = document.getElementById('menubar-day-val');
        if (topBadge) topBadge.textContent = Math.floor(val);

        if (this.options.onDayChange) this.options.onDayChange(val, true);
      });
    }

    // 4. Hotkeys de teclado (Espacio para Play/Pausa)
    if (this.options.enableKeyboard) {
      this.keyboardListener = (e) => {
        // Evitar activar si el usuario está escribiendo en un input de texto
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && document.activeElement?.type !== 'range') {
          return;
        }

        if (e.code === 'Space') {
          e.preventDefault();
          this.togglePlay();
        }
      };
      window.addEventListener('keydown', this.keyboardListener);
    }
  }

  /**
   * Alterna entre reproducir y pausar la simulación.
   */
  togglePlay() {
    this.setPlaying(!this.state.isPlaying);
  }

  /**
   * Establece el estado de reproducción.
   * @param {boolean} isPlaying
   */
  setPlaying(isPlaying) {
    this.state.isPlaying = Boolean(isPlaying);

    if (this.playIconContainer) {
      this.playIconContainer.innerHTML = this.state.isPlaying ? SVG_ICONS.PAUSE : SVG_ICONS.PLAY;
    }

    if (this.playBtn) {
      this.playBtn.title = this.state.isPlaying ? 'Pausar Tiempo (Espacio)' : 'Animar Tiempo (Espacio)';
    }

    if (this.legacyCheckbox) {
      this.legacyCheckbox.checked = this.state.isPlaying;
    }

    if (this.options.onPlayChange) {
      this.options.onPlayChange(this.state.isPlaying);
    }
  }

  /**
   * Actualiza el valor del día del año en la UI y sincroniza badges.
   * @param {number} day 
   * @param {boolean} [updateSlider=true] 
   */
  setDay(day, updateSlider = true) {
    this.state.day = day;
    const roundedDay = Math.floor(day);

    if (updateSlider && this.dayRange && document.activeElement !== this.dayRange) {
      this.dayRange.value = day;
    }

    if (this.dayVal) {
      this.dayVal.textContent = roundedDay;
    }

    // Sincronizar badge superior si existe
    const topBadge = document.getElementById('menubar-day-val');
    if (topBadge) {
      topBadge.textContent = roundedDay;
    }
  }

  /**
   * Actualiza el valor de velocidad en la UI.
   * @param {number} speed 
   * @param {boolean} [updateSlider=true] 
   */
  setSpeed(speed, updateSlider = true) {
    this.state.speed = speed;
    if (updateSlider && this.speedRange) {
      this.speedRange.value = speed;
    }
    if (this.speedVal) {
      this.speedVal.textContent = `${speed}x`;
    }
  }

  /**
   * Refresca todos los elementos de la interfaz.
   */
  updateUI() {
    this.setPlaying(this.state.isPlaying);
    this.setSpeed(this.state.speed);
    this.setDay(this.state.day);
  }

  /**
   * Retorna el estado actual del HUD.
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Destruye el componente y limpia event listeners.
   */
  destroy() {
    if (this.keyboardListener) {
      window.removeEventListener('keydown', this.keyboardListener);
    }
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
  }
}
