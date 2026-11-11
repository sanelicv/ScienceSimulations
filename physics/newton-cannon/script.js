// Physics Constants
const G = 6.67430e-11;
const EARTH_MASS = 5.972e24;
const EARTH_RADIUS = 6.371e6; // meters
const MOUNTAIN_HEIGHT = 0.5 * 1000 * 1000; // 500 km high mountain for visualization (still exaggerated but reasonable for demo)
const TOTAL_RADIUS = EARTH_RADIUS + MOUNTAIN_HEIGHT;

// Simulation State
let state = {
  isRunning: false,
  particles: [],
  scale: 0.1, // Starting scale (Zoomed out)
  offsetX: 0,
  offsetY: 0,
  timeScale: 10,
  cameraTarget: { x: 0, y: TOTAL_RADIUS } // Target to lock onto
};

// Canvas Setup
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
let width, height;

// Resize handling
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);

// Input Handling
const velocitySlider = document.getElementById('velocitySlider');
const velocityValue = document.getElementById('velocityValue');
const fireBtn = document.getElementById('fireBtn');
const resetBtn = document.getElementById('resetBtn');

let initialVelocity = 5;
const gravitySelect = document.getElementById('gravityModel');
let gravityExponent = parseInt(gravitySelect.value);

gravitySelect.addEventListener('change', (e) => {
  gravityExponent = parseInt(e.target.value);
});

velocitySlider.addEventListener('input', (e) => {
  // Custom Stepped Mapping:
  // 0-10: Step 1 (0-10 m/s) -> Slider 0-10
  // 10-100: Step 10 (20-100 m/s) -> Slider 11-19
  // 100-1000: Step 100 (200-1000 m/s) -> Slider 20-28
  // 1000-10000: Step 100 (1100-10000 m/s) -> Slider 29-118
  // 10000-20000: Step 1000 -> Slider 119-128

  const val = parseInt(e.target.value);

  if (val <= 10) {
    initialVelocity = val;
  } else if (val <= 19) {
    initialVelocity = 10 + (val - 10) * 10;
  } else if (val <= 28) {
    initialVelocity = 100 + (val - 19) * 100;
  } else if (val <= 118) {
    initialVelocity = 1000 + (val - 28) * 100;
  } else {
    // 10000+: Step 1000 (11000-20000 m/s) -> Slider 119-128
    initialVelocity = 10000 + (val - 118) * 1000;
  }

  // Round for display
  velocityValue.textContent = `${initialVelocity.toFixed(0)} m/s`;
});

fireBtn.addEventListener('click', fireCannon);
resetBtn.addEventListener('click', resetSimulation);

// Zoom Handling
const zoomSlider = document.getElementById('zoomSlider');

// We need a stable range for the slider.
// Let's define min/max scale constants based on initial logical assumptions
// Min: Earth fits in screen (approx)
// Max: 1px = 10m (0.1)
const MAX_SCALE = 0.1;
const MIN_SCALE = 0.000005; // Adjusted to keep Earth visible (approx 20px radius)

// Helper to convert scale to slider value (0-100) using Logarithmic scale
function scaleToSlider(s) {
  const logMin = Math.log(MIN_SCALE);
  const logMax = Math.log(MAX_SCALE);
  const logVal = Math.log(s);
  // Normalize to 0-1
  const norm = (logVal - logMin) / (logMax - logMin);
  return Math.max(0, Math.min(100, norm * 100));
}

// Helper to convert slider value (0-100) to scale
function sliderToScale(v) {
  const logMin = Math.log(MIN_SCALE);
  const logMax = Math.log(MAX_SCALE);
  const norm = v / 100;
  const logVal = logMin + norm * (logMax - logMin);
  return Math.exp(logVal);
}

// Initialize slider based on current scale
zoomSlider.value = scaleToSlider(state.scale);

zoomSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  state.scale = sliderToScale(val);
});

// We want to zoom in/out centering on the cameraTarget (the cannon)
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomIntensity = 0.1;
  const direction = e.deltaY < 0 ? 1 : -1;

  let newScale = state.scale * (1 + direction * zoomIntensity);

  // Clamping
  newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
  state.scale = newScale;

  // Sync slider
  zoomSlider.value = scaleToSlider(state.scale);
}, { passive: false });


class Cannonball {
  constructor(velocity) {
    this.pos = { x: 0, y: TOTAL_RADIUS };
    // Tangential velocity at the pole is purely in X direction
    this.vel = { x: velocity, y: 0 };
    this.acc = { x: 0, y: 0 };
    // Connect start: Initialize trail with the launch position
    // This ensures no gap between cannon and first physics step
    this.trail = [{ x: 0, y: TOTAL_RADIUS }];
    this.crashed = false;
    this.color = `hsl(${Math.random() * 360}, 100%, 55%)`; // Highly vibrant rainbow range for contrast
  }

  update(dt) {
    if (this.crashed) return;

    // Sub-stepping for stability with high velocities/large time steps
    const subSteps = 10;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      const r2 = this.pos.x * this.pos.x + this.pos.y * this.pos.y;
      const r = Math.sqrt(r2);

      if (r <= EARTH_RADIUS) {
        this.crashed = true;
        this.pos.x = (this.pos.x / r) * EARTH_RADIUS;
        this.pos.y = (this.pos.y / r) * EARTH_RADIUS;
        break;
      }

      const g0 = (G * EARTH_MASS) / (EARTH_RADIUS * EARTH_RADIUS);
      let forceMag = 0;

      switch (gravityExponent) {
        case 1:
          forceMag = g0 * (r / EARTH_RADIUS);
          break;
        case -1:
          forceMag = g0 * (EARTH_RADIUS / r);
          break;
        case -2:
          // forceMag = (G * M) / r^2
          forceMag = g0 * ((EARTH_RADIUS * EARTH_RADIUS) / r2);
          break;
        case -3:
          forceMag = g0 * (Math.pow(EARTH_RADIUS, 3) / (r * r2));
          break;
      }

      this.acc.x = -forceMag * (this.pos.x / r);
      this.acc.y = -forceMag * (this.pos.y / r);

      this.vel.x += this.acc.x * subDt;
      this.vel.y += this.acc.y * subDt;

      this.pos.x += this.vel.x * subDt;
      this.pos.y += this.vel.y * subDt;
    }

    // Trail logic
    // Only add point if it's far enough from the last one to save performance
    // Adaptive sampling:
    // For small parabolas (low velocity), we need fine steps (e.g., 50m).
    // For large orbits (high velocity), we can afford larger steps (e.g., 5000m).
    // Let's base step size on velocity?

    // v^2 = vx^2 + vy^2
    const v2 = this.vel.x * this.vel.x + this.vel.y * this.vel.y;
    // v (approx)
    // threshold ~ v * time_step?
    // Let's say we want a point every ~0.1s of simulation time visually?
    // Or just clamp between 50m and 10000m based on speed.
    // If v=100m/s -> 100m step. If v=8000m/s -> 4000m step.

    // Simple heuristic: threshold = max(50, min(10000, sqrt(v2) * 0.5))
    const v = Math.sqrt(v2);
    const threshold = Math.max(50, Math.min(5000, v * 0.5));

    const lastPoint = this.trail.length > 0 ? this.trail[this.trail.length - 1] : this.pos;
    const distSq = (this.pos.x - lastPoint.x) ** 2 + (this.pos.y - lastPoint.y) ** 2;

    if (this.trail.length === 0 || distSq > threshold ** 2) {
      this.trail.push({ x: this.pos.x, y: this.pos.y });
    }

    // Limit trail size (increased for smoother, longer trails)
    if (this.trail.length > 5000) this.trail.shift();
  }

  draw() {
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2; // Fixed width? Or scale?
      // Fixed width is better for visibility usually.

      // Optimization: Don't draw points off screen? 
      // Canvas handles clipping efficiently usually.

      // Move to first point
      const start = worldToScreen(this.trail[0].x, this.trail[0].y);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < this.trail.length; i++) {
        const p = worldToScreen(this.trail[i].x, this.trail[i].y);
        ctx.lineTo(p.x, p.y);
      }

      // Draw line to current pos
      const current = worldToScreen(this.pos.x, this.pos.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
    }

    if (!this.crashed) {
      const p = worldToScreen(this.pos.x, this.pos.y);
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function fireCannon() {
  state.isRunning = true;
  // Don't clear previous particles, allows comparison!
  state.particles.push(new Cannonball(initialVelocity));
}

function resetSimulation() {
  state.isRunning = false;
  state.particles = [];
  drawScene();
}

// World to Screen Transformation
// Camera is locked to the cannon position (0, TOTAL_RADIUS)
// We want this position to be at (width/2, height * 0.8) usually, to give space for the orbit above.
// Visual Compression
// To ensure the mountain doesn't take up the entire screen when zoomed in,
// we visually compress the altitude between EARTH_RADIUS and TOTAL_RADIUS.
// Physics remains 1:1, but rendering uses this transformation.
function getVisualPos(p) {
  const r2 = p.x * p.x + p.y * p.y;
  const r = Math.sqrt(r2);

  // Check altitude relative to Earth Surface
  const altitude = r - EARTH_RADIUS;

  // Calculate maximum visual height for mountain (e.g., 35% of screen height)
  const maxVisHeightPx = height * 0.35;
  const maxVisHeightM = maxVisHeightPx / state.scale;

  const visMountainHeight = Math.min(MOUNTAIN_HEIGHT, maxVisHeightM);

  let visR = r;

  if (altitude > MOUNTAIN_HEIGHT) {
    // Above mountain: shift down by the compression amount
    // visR = EARTH_RADIUS + visMountainHeight + (altitude - MOUNTAIN_HEIGHT)
    visR = r - (MOUNTAIN_HEIGHT - visMountainHeight);
  } else if (altitude > 0) {
    // Within mountain: compress
    // visAlt = altitude * (visMountainHeight / MOUNTAIN_HEIGHT)
    const compression = visMountainHeight / MOUNTAIN_HEIGHT;
    visR = EARTH_RADIUS + altitude * compression;
  } else {
    // Below surface (e.g., from collision overlap before correction)
    // Clamp to surface visually to avoid artifacts
    visR = EARTH_RADIUS;
  }

  // Scale position vector
  if (r > 0.0001) {
    return {
      x: p.x * (visR / r),
      y: p.y * (visR / r)
    };
  }
  return p;
}

// World to Screen Transformation
function worldToScreen(wx, wy) {
  // Apply compression to the input point
  const visP = getVisualPos({ x: wx, y: wy });

  // Applying compression to camera target logic:
  // The camera is locked to physically (0, TOTAL_RADIUS).
  // Visually, this is (0, EARTH_RADIUS + visMountainHeight).
  // We want THIS visual point to be at screen center.
  const visTarget = getVisualPos(state.cameraTarget);

  // Relative to visual center
  const relX = visP.x - visTarget.x;
  const relY = visP.y - visTarget.y;

  const screenX = width / 2 + relX * state.scale;
  // Move to 0.3 * height (30% from top) to allow more space below for Earth
  const screenY = (height * 0.3) - relY * state.scale;

  return { x: screenX, y: screenY };
}

function drawScene() {
  // Clear - Fetch gradient colors from CSS variables dynamically
  const styles = getComputedStyle(document.documentElement);
  const colorTop = styles.getPropertyValue('--bg-gradient-top').trim() || '#0d1117';
  const colorBottom = styles.getPropertyValue('--bg-gradient-bottom').trim() || '#161b22';
  
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colorTop);
  gradient.addColorStop(1, colorBottom); 
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw Earth
  const colorEarth = styles.getPropertyValue('--earth-color').trim() || '#1a2233';
  const colorEarthBorder = styles.getPropertyValue('--earth-border-color').trim() || '#4a90e2';
  
  const earthCenter = worldToScreen(0, 0);
  const radiusPx = EARTH_RADIUS * state.scale;

  ctx.beginPath();
  ctx.arc(earthCenter.x, earthCenter.y, radiusPx, 0, Math.PI * 2);
  ctx.fillStyle = colorEarth;
  ctx.fill();
  ctx.strokeStyle = colorEarthBorder;
  ctx.lineWidth = 2 / Math.max(1, state.scale * 1000);
  ctx.stroke();

  // Draw Mountain
  // Mountain geometry needs to be adjusted for visual compression
  const mountTip = worldToScreen(0, TOTAL_RADIUS);

  // Limit visual width of mountain base
  // Max TOTAL width should be 1/4 (0.25) of screen.
  // So half-width (w) should be 1/8 (0.125) of screen.
  const maxHalfWidPx = width * 0.125;

  // Calculate effective half-width (w) in meters for drawing
  const w = Math.min(MOUNTAIN_HEIGHT * 0.8, maxHalfWidPx / state.scale);

  if (w < EARTH_RADIUS) {
    const baseY = Math.sqrt(EARTH_RADIUS ** 2 - w ** 2);
    // worldToScreen uses getVisualPos, which at altitude 0 is identity (visR = R)
    const leftBase = worldToScreen(-w, baseY);
    const rightBase = worldToScreen(w, baseY);

    const colorMountain = styles.getPropertyValue('--mountain-color').trim() || '#515d71';
    ctx.beginPath();
    ctx.fillStyle = colorMountain;
    ctx.moveTo(leftBase.x, leftBase.y);
    ctx.lineTo(mountTip.x, mountTip.y);
    ctx.lineTo(rightBase.x, rightBase.y);
    ctx.fill();
  }

  // Draw Cannon
  const cannonPos = worldToScreen(0, TOTAL_RADIUS);
  ctx.fillStyle = '#a5d8ff';
  // Double the size (was 8x8)
  ctx.fillRect(cannonPos.x - 8, cannonPos.y - 16, 16, 16);

  // Cannon Barrel
  ctx.beginPath();
  ctx.strokeStyle = '#a5d8ff';
  ctx.lineWidth = 6; // Thicker barrel (was 3)
  ctx.moveTo(cannonPos.x, cannonPos.y - 8);
  ctx.lineTo(cannonPos.x + 25, cannonPos.y - 8); // Longer barrel (was 15)
  ctx.stroke();

  // Draw Particles
  state.particles.forEach(p => p.draw());

  // Draw UI Text
  ctx.fillStyle = '#a5d8ff';
  ctx.font = '600 13px "Outfit", sans-serif';
  // Scale Legend
  const metersPer100px = 100 / state.scale;
  let label = '';
  if (metersPer100px > 1000000) label = (metersPer100px / 1000000).toFixed(1) + ' Mm';
  else if (metersPer100px > 1000) label = (metersPer100px / 1000).toFixed(1) + ' km';
  else label = metersPer100px.toFixed(1) + ' m';

  ctx.fillRect(20, height - 20, 100, 2);
  ctx.fillText(label, 20, height - 25);
}

function loop() {
  if (state.particles.length > 0) {
    state.particles.forEach(p => p.update(state.timeScale));
  }
  drawScene();
  requestAnimationFrame(loop);
}

resize();
loop();
