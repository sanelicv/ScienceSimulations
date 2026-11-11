import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

/**
 * ThreeSceneController (Co-located Component)
 * Módulo independiente y reutilizable para crear y administrar una escena Three.js base.
 * Administra el lienzo WebGL, la cámara de perspectiva, el renderizador, la luz ambiental,
 * los controles de órbita y el ajuste responsivo de pantalla de forma transparente.
 */
export class ThreeSceneController {
  /**
   * @param {Object} [options={}] Configuración inicial de la escena
   * @param {string|HTMLElement} [options.container='#canvas-container'] Selector o elemento DOM del contenedor
   * @param {number|string} [options.backgroundColor=0x0a0e17] Color de fondo hexadecimal o CSS
   * @param {number} [options.fov=45] Campo de visión inicial de la cámara (grados)
   * @param {number} [options.near=0.1] Plano cercano de frustum
   * @param {number} [options.far=100000] Plano lejano de frustum
   * @param {Object} [options.cameraPos={x:0, y:1000, z:2000}] Posición inicial de la cámara {x, y, z}
   * @param {number} [options.ambientLightIntensity=0.5] Intensidad inicial de la luz ambiental
   * @param {boolean} [options.enableControls=true] Habilitar controles de órbita (OrbitControls)
   * @param {boolean} [options.enableDamping=true] Habilitar inercia/amortiguación en controles
   * @param {number} [options.dampingFactor=0.05] Factor de amortiguación de controles
   * @param {Function} [options.onRender=null] Callback ejecutado en cada fotograma del bucle
   */
  constructor(options = {}) {
    this.options = {
      container: options.container || '#canvas-container',
      backgroundColor: options.backgroundColor !== undefined ? options.backgroundColor : 0x0a0e17,
      fov: options.fov || 45,
      near: options.near || 0.1,
      far: options.far || 100000,
      cameraPos: options.cameraPos || { x: 0, y: 1000, z: 2000 },
      ambientLightIntensity: options.ambientLightIntensity !== undefined ? options.ambientLightIntensity : 0.5,
      enableControls: options.enableControls !== undefined ? options.enableControls : true,
      enableDamping: options.enableDamping !== undefined ? options.enableDamping : true,
      dampingFactor: options.dampingFactor !== undefined ? options.dampingFactor : 0.05,
      onRender: options.onRender || null
    };

    this.isLoopRunning = false;
    this.animationFrameId = null;

    this.initDOM();
    this.initThree();
    this.bindEvents();
  }

  /**
   * Busca el elemento contenedor o lo inyecta dinámicamente si no existe.
   */
  initDOM() {
    let container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!container) {
      container = document.createElement('div');
      container.id = 'canvas-container';
      document.body.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Inicializa los componentes centrales de Three.js.
   */
  initThree() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    // 1. Escena 3D
    this.scene = new THREE.Scene();
    this.setBackgroundColor(this.options.backgroundColor);

    // 2. Cámara de Perspectiva
    this.camera = new THREE.PerspectiveCamera(
      this.options.fov,
      this.width / this.height,
      this.options.near,
      this.options.far
    );
    this.camera.position.set(
      this.options.cameraPos.x,
      this.options.cameraPos.y,
      this.options.cameraPos.z
    );

    // 3. Renderizador WebGL
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 4. Controles de Órbitas (OrbitControls)
    if (this.options.enableControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = this.options.enableDamping;
      this.controls.dampingFactor = this.options.dampingFactor;
    }

    // 5. Luz Ambiental
    this.ambientLight = new THREE.AmbientLight(0xffffff, this.options.ambientLightIntensity);
    this.scene.add(this.ambientLight);
  }

  /**
   * Registra los event listeners globales (Resize).
   */
  bindEvents() {
    this.resizeHandler = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Adapta el lienzo y la cámara al cambiar el tamaño de la ventana.
   */
  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  // ==========================================================================
  // API PÚBLICA REUTILIZABLE
  // ==========================================================================

  /**
   * Agrega un objeto u 3D Mesh / Group a la escena.
   * @param {THREE.Object3D} object 
   */
  add(object) {
    if (object) this.scene.add(object);
  }

  /**
   * Remueve un objeto de la escena.
   * @param {THREE.Object3D} object 
   */
  remove(object) {
    if (object) this.scene.remove(object);
  }

  /**
   * Establece el color de fondo de la escena.
   * @param {number|string|THREE.Color} color 
   */
  setBackgroundColor(color) {
    this.scene.background = new THREE.Color(color);
  }

  /**
   * Establece la intensidad de la luz ambiental.
   * @param {number} intensity 
   */
  setAmbientLightIntensity(intensity) {
    if (this.ambientLight) {
      this.ambientLight.intensity = intensity;
    }
  }

  /**
   * Modifica la posición de la cámara de forma directa.
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  setCameraPosition(x, y, z) {
    if (this.camera) {
      this.camera.position.set(x, y, z);
      if (this.controls) this.controls.update();
    }
  }

  /**
   * Realiza una actualización de fotograma (controles + callback opcional + render).
   */
  update() {
    if (this.controls) this.controls.update();
    if (typeof this.options.onRender === 'function') {
      this.options.onRender();
    }
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Inicia el bucle continuo de animación (requestAnimationFrame).
   */
  startLoop() {
    if (this.isLoopRunning) return;
    this.isLoopRunning = true;

    const loop = () => {
      if (!this.isLoopRunning) return;
      this.animationFrameId = requestAnimationFrame(loop);
      this.update();
    };
    loop();
  }

  /**
   * Detiene el bucle continuo de animación.
   */
  stopLoop() {
    this.isLoopRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Destruye la escena, remueve el lienzo del DOM y remueve event listeners.
   */
  destroy() {
    this.stopLoop();
    window.removeEventListener('resize', this.resizeHandler);

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
    }
  }
}
