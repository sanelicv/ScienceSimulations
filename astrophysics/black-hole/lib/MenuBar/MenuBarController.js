/**
 * MenuBarController (Co-located Component)
 * Módulo independiente y reutilizable para controlar la interactividad del Menú Superior.
 * Maneja la apertura y cierre de desplegables, clics externos, teclado y el cambio de
 * menú al pasar el cursor mientras hay uno abierto.
 * Script clásico (window.MenuBarController): los módulos ES no cargan desde file://.
 */
(function () {
  'use strict';

  const ENFOCABLES = '.dropdown-item:not(:disabled), .dropdown-checkbox input:not(:disabled), .dropdown-radio input:not(:disabled)';

  class MenuBarController {
    /**
     * @param {Object} options Configuración opcional
     * @param {string} [options.containerSelector='.top-menubar'] Selector del contenedor principal del menú
     */
    constructor(options = {}) {
      this.containerSelector = options.containerSelector || '.top-menubar';
      this.initDOM();
      this.bindEvents();
    }

    initDOM() {
      this.menuBar = document.querySelector(this.containerSelector);
      if (!this.menuBar) {
        console.warn(`[MenuBarController] No se encontró el elemento con el selector: ${this.containerSelector}`);
        return;
      }

      this.menuItems = Array.from(this.menuBar.querySelectorAll('.menu-item'));
      this.menuItems.forEach((item) => {
        const btn = item.querySelector('.menu-btn');
        if (!btn) return;
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
      });
    }

    bindEvents() {
      if (!this.menuBar) return;

      this.menuItems.forEach((item, indice) => {
        const btn = item.querySelector('.menu-btn');
        const dropdown = item.querySelector('.dropdown-menu');
        if (!btn) return;

        // 1. Abrir / Cerrar desplegable al hacer clic en los botones del menú
        btn.addEventListener('click', () => {
          const isActive = item.classList.contains('active');
          this.closeAllDropdowns();
          if (!isActive) this.open(item);
        });

        // 2. Con un menú abierto, pasar el cursor sobre otro botón cambia de menú
        btn.addEventListener('pointerenter', () => {
          if (this.getOpenItem() && !item.classList.contains('active')) {
            this.closeAllDropdowns();
            this.open(item);
          }
        });

        // 3. Teclado en el botón: flechas para abrir y moverse entre menús
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.open(item);
            this.moveFocus(item, 0);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            this.moveToMenu(indice, e.key === 'ArrowRight' ? 1 : -1, !!this.getOpenItem());
          }
        });

        if (!dropdown) return;

        // 4. Las acciones cierran el menú; las casillas lo dejan abierto para marcar varias
        dropdown.addEventListener('click', (e) => {
          if (e.target.closest('.dropdown-item')) this.closeAllDropdowns();
        });

        // 5. Teclado dentro del desplegable
        dropdown.addEventListener('keydown', (e) => {
          const lista = Array.from(dropdown.querySelectorAll(ENFOCABLES));
          const actual = lista.indexOf(document.activeElement);
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const paso = e.key === 'ArrowDown' ? 1 : -1;
            this.moveFocus(item, (actual + paso + lista.length) % lista.length);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            this.moveToMenu(indice, e.key === 'ArrowRight' ? 1 : -1, true);
          } else if (e.key === 'Enter' && e.target.matches('input[type="checkbox"]')) {
            e.preventDefault();
            e.target.click();
          }
        });
      });

      // 6. Pulsar fuera del menú cierra los desplegables. Se usa pointerdown en captura
      // porque los controles de cámara del lienzo capturan el puntero y pueden tragarse el clic.
      document.addEventListener('pointerdown', (e) => {
        if (!this.menuBar.contains(e.target)) this.closeAllDropdowns();
      }, true);

      // 7. Tecla ESC cierra los desplegables abiertos y devuelve el foco a su botón
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const abierto = this.getOpenItem();
        if (!abierto) return;
        this.closeAllDropdowns();
        abierto.querySelector('.menu-btn').focus();
      });
    }

    getOpenItem() {
      return this.menuItems.find((item) => item.classList.contains('active')) || null;
    }

    open(item) {
      item.classList.add('active');
      item.querySelector('.menu-btn').setAttribute('aria-expanded', 'true');
    }

    moveFocus(item, indice) {
      const lista = item.querySelectorAll(ENFOCABLES);
      if (lista[indice]) lista[indice].focus();
    }

    moveToMenu(indice, paso, abrir) {
      const destino = this.menuItems[(indice + paso + this.menuItems.length) % this.menuItems.length];
      this.closeAllDropdowns();
      destino.querySelector('.menu-btn').focus();
      if (abrir) this.open(destino);
    }

    /**
     * Cierra todos los desplegables abiertos en la barra de menú.
     */
    closeAllDropdowns() {
      if (!this.menuItems) return;
      this.menuItems.forEach((item) => {
        item.classList.remove('active');
        const btn = item.querySelector('.menu-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  window.MenuBarController = MenuBarController;
})();
