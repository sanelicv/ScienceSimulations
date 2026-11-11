/**
 * TimeHudController (Co-located Component)
 * Botón flotante para pausar y continuar una simulación, con la barra espaciadora como atajo.
 * Script clásico (window.TimeHudController): los módulos ES no cargan desde file://.
 */
(function () {
  'use strict';

  const SVG_ICONS = {
    PLAY: '<svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21" fill="currentColor"/></svg>',
    PAUSE: '<svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>',
  };

  // Con el foco aquí, el Espacio ya tiene su propia función: marcar, pulsar o escribir
  const USAN_ESPACIO = 'input:not([type="range"]), textarea, select, button, a[href], [contenteditable]';

  class TimeHudController {
    /**
     * @param {Object} options Configuración del HUD
     * @param {string|HTMLElement} [options.container='body'] Contenedor donde inyectar el HUD
     * @param {boolean} [options.autoPlay=true] Iniciar reproduciendo
     * @param {boolean} [options.enableKeyboard=true] Habilitar la barra espaciadora
     * @param {Function} [options.onPlayChange] Se llama al cambiar el estado: (isPlaying) => {}
     */
    constructor(options = {}) {
      this.options = {
        container: options.container || 'body',
        enableKeyboard: options.enableKeyboard !== false,
        onPlayChange: options.onPlayChange || null,
      };
      this.isPlaying = options.autoPlay !== false;

      this.initDOM();
      this.bindEvents();
      this.updateUI();
    }

    initDOM() {
      const hud = document.createElement('div');
      hud.className = 'time-hud';
      hud.innerHTML = '<button type="button" class="hud-play-btn"></button>';

      const parentNode = typeof this.options.container === 'string'
        ? document.querySelector(this.options.container) || document.body
        : this.options.container;
      parentNode.appendChild(hud);

      this.hudElement = hud;
      this.playBtn = hud.querySelector('.hud-play-btn');
    }

    bindEvents() {
      this.playBtn.addEventListener('click', () => this.togglePlay());

      if (!this.options.enableKeyboard) return;
      this.keyboardListener = (e) => {
        if (e.code !== 'Space' || e.repeat || e.target.closest(USAN_ESPACIO)) return;
        e.preventDefault();
        this.togglePlay();
      };
      window.addEventListener('keydown', this.keyboardListener);
    }

    /**
     * Alterna entre reproducir y pausar la simulación.
     */
    togglePlay() {
      this.setPlaying(!this.isPlaying);
    }

    /**
     * Establece el estado de reproducción y avisa si cambió.
     * @param {boolean} isPlaying
     */
    setPlaying(isPlaying) {
      const nuevo = Boolean(isPlaying);
      if (nuevo === this.isPlaying) return;
      this.isPlaying = nuevo;
      this.updateUI();
      if (this.options.onPlayChange) this.options.onPlayChange(nuevo);
    }

    updateUI() {
      const accion = this.isPlaying ? 'Pausar' : 'Continuar';
      this.playBtn.innerHTML = this.isPlaying ? SVG_ICONS.PAUSE : SVG_ICONS.PLAY;
      this.playBtn.setAttribute('aria-label', accion);
      this.playBtn.title = accion + ' (Espacio)';
      this.hudElement.classList.toggle('is-paused', !this.isPlaying);
    }

    /**
     * Destruye el componente y limpia event listeners.
     */
    destroy() {
      if (this.keyboardListener) window.removeEventListener('keydown', this.keyboardListener);
      this.hudElement.remove();
    }
  }

  window.TimeHudController = TimeHudController;
})();
