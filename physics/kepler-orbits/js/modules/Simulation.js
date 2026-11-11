import { KeplerSystem } from './KeplerSystem.js';

export class Simulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.system = new KeplerSystem();

    this.isRunning = true;
    this.showTrails = false;
    this.showLabels = true;
    this.showOrbits = false;
    this.speedFactor = 1.0;
    this.scale = 1.0;
    this.labEccentricity = 0.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Zoom Listener
    this.canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });

    // Pan Listeners
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
  }

  handleZoom(e) {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
    this.scale *= delta;
    this.scale = Math.min(Math.max(0.1, this.scale), 10);
  }

  handleMouseDown(e) {
    if (e.button === 0) { // Left click
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  handleMouseMove(e) {
    if (this.isDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;

      // Dividimos entre this.scale para que el paneo se sienta consistente independientemente del zoom
      this.offsetX += dx / this.scale;
      this.offsetY += dy / this.scale;

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  }

  handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = 'default';
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setSpeed(val) {
    this.speedFactor = val;
  }

  toggleTrails(val) {
    this.showTrails = val;
  }

  toggleLabels(val) {
    this.showLabels = val;
  }

  toggleOrbits(val) {
    this.showOrbits = val;
  }

  setSelectedPlanet(name) {
    this.selectedPlanet = name === 'all' ? null : name;
  }

  setLabEccentricity(val) {
    this.labEccentricity = val;
  }

  reset() {
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.system.reset();
  }

  focusOnPlanet(name) {
    const body = this.system.getBodyByName(name);
    if (!body) return null;

    // 1. Cálculo de Zoom (Escala)
    // El radio máximo de la órbita (Afelio) es a * (1 + e)
    const maxRadius = body.a * (1 + body.e);
    // Queremos que el afelio quepa con un margen del 20% en la mitad de la dimensión menor
    const padding = 1.2;
    const screenLimit = Math.min(this.width, this.height) / 2;
    this.scale = screenLimit / (maxRadius * padding);
    
    // Limitar escala razonablemente
    this.scale = Math.min(Math.max(this.scale, 0.1), 8);

    // 2. Cálculo de Velocidad
    // El periodo P está en años.
    // La fórmula de frames por órbita es: N = P / (0.005 * speedFactor)
    // Para T = 20 segundos a 60fps, necesitamos N = 1200 frames.
    // 1200 = P / (0.005 * speedFactor) -> speedFactor = P / (1200 * 0.005) = P / 6
    this.speedFactor = body.period / 6;

    // Reset de paneo
    this.offsetX = 0;
    this.offsetY = 0;

    return {
      scale: this.scale,
      speedFactor: this.speedFactor
    };
  }

  animate() {
    if (!this.isRunning) return;

    // Clear Canvas
    // Usamos clearRect para que el canvas sea transparente y se vea el fondo configurado por CSS
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Starfield (optional visual flair)
    // Could enable if desired, but keep simple for now.

    // Update System
    this.system.update(this.speedFactor);

    // Apply Zoom (Scale around center)
    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(-this.width / 2, -this.height / 2);

    // Apply Pan
    this.ctx.translate(this.offsetX, this.offsetY);

    // Draw System
    this.system.draw(this.ctx, this.width, this.height, this.showTrails, this.showLabels, this.showOrbits, this.selectedPlanet, this.scale, this.labEccentricity);

    this.ctx.restore();

    requestAnimationFrame(() => this.animate());
  }

  start() {
    this.animate();
  }
}
