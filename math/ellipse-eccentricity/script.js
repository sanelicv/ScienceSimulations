// App Logic for Ellipse Eccentricity (Pure Vanilla JS HTML5 Canvas)

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("ellipseCanvas");
  const ctx = canvas.getContext("2d");
  const eRange = document.getElementById("eRange");
  const eInput = document.getElementById("eInput");
  const eLabel = document.getElementById("eLabel");
  const eValue = document.getElementById("eValue");

  // Fallback default config
  const cfgFallback = {
    geometry: {
      baseSemiMajorAxis: 300,
      minEccentricity: 0.00,
      maxEccentricity: 0.95,
      focusRadius: 5
    },
    style: {
      backgroundColor: "#ffffff",
      ellipseStrokeColor: "#000000",
      ellipseLineWidth: 2,
      focusFillColor: "#ff0000"
    }
  };

  function getCfg() {
    if (typeof window !== "undefined" && window.CONFIG) return window.CONFIG;
    if (typeof CONFIG !== "undefined") return CONFIG;
    return cfgFallback;
  }

  let width = 0;
  let height = 0;
  let dpr = 1;

  // Resize canvas to fit screen resolution with HiDPI support
  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    draw();
  }

  // Draw ellipse and foci onto canvas
  function draw() {
    if (!ctx) return;

    const cfg = getCfg();

    // Reset transform & clear background
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = cfg.style.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Get current eccentricity e
    let e = parseFloat(eRange.value);
    if (isNaN(e)) e = 0;
    e = Math.min(Math.max(e, cfg.geometry.minEccentricity), cfg.geometry.maxEccentricity);

    // Semi-major axis 'a' from CONFIG, scaled down smoothly if screen size is smaller than baseSemiMajorAxis
    const baseA = cfg.geometry.baseSemiMajorAxis || 500;
    const margin = cfg.geometry.screenMargin || 60;
    const maxAllowedA = Math.min((width - margin) / 2, (height - margin) / 2);
    const a = Math.max(50, Math.min(baseA, maxAllowedA));

    // Calculate c and b
    const c = a * e;
    const b = a * Math.sqrt(1 - e * e);

    // Center coordinates
    const cx = width / 2;
    const cy = height / 2;

    // Draw ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy, a, b, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = cfg.style.ellipseStrokeColor;
    ctx.lineWidth = cfg.style.ellipseLineWidth;
    ctx.stroke();

    // Draw left and right foci
    const focusRadius = cfg.geometry.focusRadius;
    ctx.fillStyle = cfg.style.focusFillColor;

    // Left focus
    ctx.beginPath();
    ctx.arc(cx - c, cy, focusRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Right focus
    ctx.beginPath();
    ctx.arc(cx + c, cy, focusRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Update eccentricity value without layout shift
    if (eValue) {
      eValue.textContent = e.toFixed(2);
    } else if (eLabel) {
      eLabel.textContent = `Excentricidad: e = ${e.toFixed(2)}`;
    }
  }

  // Sync inputs with 2 decimal precision
  eRange.addEventListener("input", () => {
    let v = parseFloat(eRange.value);
    if (isNaN(v)) v = 0;
    eInput.value = v.toFixed(2);
    draw();
  });

  eInput.addEventListener("input", () => {
    let v = parseFloat(eInput.value);
    if (isNaN(v)) v = 0;
    const cfg = getCfg();
    const min = cfg.geometry.minEccentricity;
    const max = cfg.geometry.maxEccentricity;
    v = Math.min(Math.max(v, min), max);
    eRange.value = v.toFixed(2);
    draw();
  });

  eInput.addEventListener("change", () => {
    let v = parseFloat(eInput.value);
    if (isNaN(v)) v = 0;
    const cfg = getCfg();
    const min = cfg.geometry.minEccentricity;
    const max = cfg.geometry.maxEccentricity;
    v = Math.min(Math.max(v, min), max);
    eInput.value = v.toFixed(2);
    eRange.value = v.toFixed(2);
    draw();
  });

  // Global redraw helper
  window.redrawCanvas = draw;

  // Handle window resize
  window.addEventListener("resize", resizeCanvas);

  // Initial setup
  resizeCanvas();
});
