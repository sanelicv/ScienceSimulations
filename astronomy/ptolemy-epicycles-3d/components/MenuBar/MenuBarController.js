/**
 * MenuBarController (Co-located Component)
 * Módulo independiente y reutilizable para controlar la interactividad del Menú Superior.
 * Maneja la apertura y cierre de desplegables, respuesta a clics externos y la tecla ESC.
 */
export class MenuBarController {
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

    this.menuItems = this.menuBar.querySelectorAll('.menu-item');
    this.dropdownMenus = this.menuBar.querySelectorAll('.dropdown-menu');
  }

  bindEvents() {
    if (!this.menuBar) return;

    // 1. Abrir / Cerrar desplegable al hacer clic en los botones del menú
    this.menuItems.forEach(item => {
      const btn = item.querySelector('.menu-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isActive = item.classList.contains('active');
          this.closeAllDropdowns();
          if (!isActive) {
            item.classList.add('active');
          }
        });
      }
    });

    // 2. Detener propagación de clics dentro del desplegable
    this.dropdownMenus.forEach(dropdown => {
      dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // 3. Clics fuera del menú cierran todos los desplegables
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    // 4. Tecla ESC cierra los desplegables abiertos
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });
  }

  /**
   * Cierra todos los desplegables abiertos en la barra de menú.
   */
  closeAllDropdowns() {
    if (this.menuItems) {
      this.menuItems.forEach(item => item.classList.remove('active'));
    }
  }
}
