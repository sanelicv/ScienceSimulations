/**
 * Solar System Gravity Simulation
 * A visualization of gravity propagation speed (Newtonian vs Einsteinian).
 */

class Planet {
  constructor(data, canvasWidth, canvasHeight) {
    this.dist = data.dist;
    this.speed = data.speed;
    this.size = data.size;
    this.color = data.color;
    this.name = data.name;

    // Start at random angle
    this.angle = Math.random() * Math.PI * 2;

    // Position
    this.x = 0;
    this.y = 0;

    // Velocity vector (for when gravity is lost)
    this.vx = 0;
    this.vy = 0;

    this.feelingGravity = true;
    this.path = [];
  }

  update(width, height) {
    if (this.feelingGravity) {
      // Orbital motion
      this.angle += this.speed;
      this.x = Math.cos(this.angle) * this.dist;
      this.y = Math.sin(this.angle) * this.dist;

      // Calculate instantaneous tangential velocity
      // v_tangential = r * omega
      // Velocity vector is perpendicular to the radius vector
      // If position is (cos, sin), velocity direction is (-sin, cos)
      const vMagnitude = this.dist * this.speed;
      this.vx = -Math.sin(this.angle) * vMagnitude;
      this.vy = Math.cos(this.angle) * vMagnitude;
    } else {
      // Linear motion (Newton's First Law)
      this.x += this.vx;
      this.y += this.vy;
    }

    // Trace path when gravity is lost
    if (!this.feelingGravity) {
      this.path.push({ x: this.x, y: this.y });
      // Limit path length for performance (restored to 5000 to keep trails long)
      if (this.path.length > 5000) {
        this.path.shift();
      }
    }
  }

  draw(ctx, currentScale = 1) {
    const cx = 0;
    const cy = 0;

    // Draw Orbit Trace (only when still in orbit)
    if (this.feelingGravity) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1 / currentScale;
      ctx.arc(cx, cy, this.dist, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Path (trail) when flying off
    if (!this.feelingGravity && this.path.length > 1) {
      ctx.beginPath();
      ctx.moveTo(cx + this.path[0].x, cy + this.path[0].y);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(cx + this.path[i].x, cy + this.path[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5 / currentScale;
      ctx.setLineDash([4 / currentScale, 4 / currentScale]); // Dashed text for trajectory
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Planet
    ctx.beginPath();
    ctx.arc(cx + this.x, cy + this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;

    // Simple glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }
}

class Simulation {
  constructor() {
    this.canvas = document.getElementById('solarCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.uiPanel = document.getElementById('ui');
    this.killBtn = document.getElementById('killSun');
    this.restartBtn = document.getElementById('restartBtn');
    this.modeBtns = document.querySelectorAll('.mode-btn');

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.planets = [];
    this.sun = {
      radius: 35,
      visible: true,
      exploding: false
    };

    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    this.gravityMode = 'newton'; // 'newton' or 'einstein'
    this.animationId = null;

    this.planetData = [
      { name: "Mercury", dist: 60, speed: 0.04, size: 4, color: "#A5A5A5" },
      { name: "Venus", dist: 90, speed: 0.015, size: 7, color: "#E3BB76" },
      { name: "Earth", dist: 130, speed: 0.01, size: 7.5, color: "#2271B3" },
      { name: "Mars", dist: 170, speed: 0.008, size: 5, color: "#E27B58" },
      { name: "Jupiter", dist: 230, speed: 0.004, size: 18, color: "#D39C7E" },
      { name: "Saturn", dist: 290, speed: 0.003, size: 15, color: "#C5AB6E" },
      { name: "Uranus", dist: 340, speed: 0.002, size: 10, color: "#BBE1E4" },
      { name: "Neptune", dist: 380, speed: 0.0015, size: 10, color: "#6081FF" }
    ];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.resetState();

    this.setupEventListeners();
    this.animate();
  }

  resetState() {
    this.planets = [];
    this.planetData.forEach(data => {
      this.planets.push(new Planet(data, this.width, this.height));
    });

    this.sun = {
      radius: 35,
      visible: true,
      exploding: false
    };

    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;

    // Reset UI Logic
    this.killBtn.disabled = false;
    this.modeBtns.forEach(btn => btn.style.pointerEvents = 'auto');
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setupEventListeners() {
    // Mode Switching
    this.modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gravityMode = btn.dataset.value;
      });
    });

    // Trigger Event
    this.killBtn.addEventListener('click', () => this.triggerEvent());

    // Restart Event
    this.restartBtn.addEventListener('click', () => this.resetState());

    // Zoom setup
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const zoomFactor = 1 - (e.deltaY * zoomSensitivity);

      let newScale = this.scale * zoomFactor;
      newScale = Math.max(0.05, Math.min(newScale, 50)); // Limit scale

      const actualZoomFactor = newScale / this.scale;

      const mouseX = e.clientX - this.width / 2;
      const mouseY = e.clientY - this.height / 2;

      this.offsetX = mouseX - (mouseX - this.offsetX) * actualZoomFactor;
      this.offsetY = mouseY - (mouseY - this.offsetY) * actualZoomFactor;

      this.scale = newScale;
    }, { passive: false });

    // Panning setup
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // Right click
        this.isPanning = true;
        this.startX = e.clientX - this.offsetX;
        this.startY = e.clientY - this.offsetY;
        this.canvas.style.cursor = 'grabbing';
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.offsetX = e.clientX - this.startX;
        this.offsetY = e.clientY - this.startY;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isPanning = false;
        this.canvas.style.cursor = '';
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Prevent context menu
    });
  }

  triggerEvent() {
    this.sun.exploding = true;
    this.killBtn.disabled = true; // Disable button to prevent double click
    this.modeBtns.forEach(btn => btn.style.pointerEvents = 'none'); // Lock controls during event

    // Handle Gravity Cutoff
    this.planets.forEach(p => {
      if (this.gravityMode === 'newton') {
        // Newton: Instantaneous action at a distance
        p.feelingGravity = false;
      } else {
        // Einstein: Information travels at speed of light (simulated)
        // We use a factor to make it visible in the animation
        // 50ms per pixel unit of distance
        const delay = p.dist * 50;
        setTimeout(() => {
          // Only execute if not reset in the meantime
          // Note: If user hits reset immediately, these timeouts might still fire. 
          // Ideally we save timeout IDs and clear them on reset, but for this simple sim, 
          // re-creating the planets array isolates the new instances from these callbacks.
          // The old planets will be garbage collected or just not drawn.
          p.feelingGravity = false;
        }, delay);
      }
    });
  }

  drawSun() {
    if (!this.sun.visible) return;

    if (this.sun.exploding) {
      this.sun.radius -= 0.8;
      if (this.sun.radius <= 0) {
        this.sun.radius = 0;
        this.sun.exploding = false;
        this.sun.visible = false;
      }
    }

    const cx = 0;
    const cy = 0;

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, this.sun.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#FFD700";

    // Dynamic glow
    const blurAmount = this.sun.exploding ? this.sun.radius * 3 : 50;
    this.ctx.shadowBlur = blurAmount;
    this.ctx.shadowColor = "#FF8C00";

    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.shadowBlur = 0;
  }

  animate() {
    // Clear canvas
    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(this.width / 2 + this.offsetX, this.height / 2 + this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    // Draw Sun
    this.drawSun();

    // Update and Draw Planets
    this.planets.forEach(p => {
      p.update(this.width, this.height);
      p.draw(this.ctx, this.scale);
    });

    this.ctx.restore();

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// Start simulation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Simulation();
});
