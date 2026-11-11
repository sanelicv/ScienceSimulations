/* Utility & domain helpers */

const TEXTURE_PATHS = {
  sun: "./textures/512_sun.png"
};

const TEXTURE_CATALOG = {
  mercury: { name: "Mercurio", path: "./textures/512_mercury.png", relativeRadius: 0.38 },
  venus: { name: "Venus", path: "./textures/512_venus_surface.png", relativeRadius: 0.95 },
  earth: { name: "Tierra", path: "./textures/512_earth_daymap.png", relativeRadius: 1.00 },
  mars: { name: "Marte", path: "./textures/512_mars.png", relativeRadius: 0.53 },
  jupiter: { name: "Júpiter", path: "./textures/512_jupiter.png", relativeRadius: 3.50 },
  saturn: { name: "Saturno", path: "./textures/512_saturn.png", relativeRadius: 3.00 },
  uranus: { name: "Urano", path: "./textures/512_uranus.png", relativeRadius: 2.10 },
  neptune: { name: "Neptuno", path: "./textures/512_neptune.png", relativeRadius: 2.00 },
  exoplanet1: { name: "Exoplaneta 1 (Rocoso Árido)", procedural: true, relativeRadius: 1.30 },
  exoplanet2: { name: "Exoplaneta 2 (Mundo Océano)", procedural: true, relativeRadius: 1.10 },
  exoplanet3: { name: "Exoplaneta 3 (Basalto Volcánico)", procedural: true, relativeRadius: 0.85 },
  exoplanet4: { name: "Exoplaneta 4 (Gigante Azul)", procedural: true, relativeRadius: 2.80 },
  exoplanet5: { name: "Exoplaneta 5 (Mundo Criógeno)", procedural: true, relativeRadius: 1.60 }
};

function getBaseEarthRadius() {
  return (typeof CONFIG !== "undefined" && CONFIG.earthRadius !== undefined) ? CONFIG.earthRadius : 12;
}

function getRadiusForTexture(key, fallbackType = "rocky") {
  const info = TEXTURE_CATALOG[key];
  if (info && typeof info.relativeRadius === "number") {
    return getBaseEarthRadius() * info.relativeRadius;
  }
  return fallbackType === "rocky" ? 10 : 30;
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

function keplerAngularSpeed(r, k = 2600) {
  // ω ∝ r^(-3/2). k is a visual tuning constant for the classroom.
  return k / Math.pow(Math.max(r, 1), 1.5);
}

function niceId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/* Procedural Exoplanet Texture Generator (100% Seamless WebGL Equirectangular Sphere Mapping) */
function createExoplanetDataUrl(type) {
  const W = 512, H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Helper to wrap drawing horizontally across the X=0 / X=W meridian seam
  function wrapX(drawFn, x, r = 120) {
    drawFn(x);
    if (x - r < 0) drawFn(x + W);
    if (x + r > W) drawFn(x - W);
  }

  if (type === "exoplanet1") { // Kepler-style Arid Super-Earth
    const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
    baseGrad.addColorStop(0, "#6e4732");
    baseGrad.addColorStop(0.5, "#9c6d4e");
    baseGrad.addColorStop(1, "#6e4732");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.filter = "blur(14px)";
    for (let i = 0; i < 35; i++) {
      const cx = Math.random() * W;
      const cy = Math.random() * H;
      const r = 40 + Math.random() * 80;
      wrapX((x) => {
        const g = ctx.createRadialGradient(x, cy, 0, x, cy, r);
        g.addColorStop(0, "#3d2b22");
        g.addColorStop(0.7, "#5c4133");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }, cx, r);
    }

    ctx.filter = "blur(18px)";
    for (let i = 0; i < 18; i++) {
      const dx = Math.random() * W;
      const dy = Math.random() * H;
      const dr = 60 + Math.random() * 100;
      wrapX((x) => {
        const dg = ctx.createRadialGradient(x, dy, 0, x, dy, dr);
        dg.addColorStop(0, "rgba(196, 148, 110, 0.45)");
        dg.addColorStop(1, "transparent");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(x, dy, dr, 0, Math.PI * 2);
        ctx.fill();
      }, dx, dr);
    }

    ctx.filter = "none";
    for (let i = 0; i < 30; i++) {
      const crx = Math.random() * W;
      const cry = Math.random() * H;
      const rad = 6 + Math.random() * 18;
      wrapX((x) => {
        ctx.strokeStyle = "rgba(35, 25, 20, 0.45)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x, cry, rad, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(215, 190, 165, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x - 1, cry - 1, rad * 0.9, 0, Math.PI * 2);
        ctx.stroke();
      }, crx, rad);
    }

    ctx.filter = "blur(6px)";
    const polarTop = ctx.createLinearGradient(0, 0, 0, 45);
    polarTop.addColorStop(0, "rgba(225, 230, 235, 0.7)");
    polarTop.addColorStop(1, "transparent");
    ctx.fillStyle = polarTop;
    ctx.fillRect(0, 0, W, 45);

    const polarBot = ctx.createLinearGradient(0, H - 45, 0, H);
    polarBot.addColorStop(0, "transparent");
    polarBot.addColorStop(1, "rgba(225, 230, 235, 0.7)");
    ctx.fillStyle = polarBot;
    ctx.fillRect(0, H - 45, W, 45);

  } else if (type === "exoplanet2") { // Realistic Ocean World
    const oceanBase = ctx.createLinearGradient(0, 0, 0, H);
    oceanBase.addColorStop(0, "#051324");
    oceanBase.addColorStop(0.5, "#0b2645");
    oceanBase.addColorStop(1, "#051324");
    ctx.fillStyle = oceanBase;
    ctx.fillRect(0, 0, W, H);

    ctx.filter = "blur(16px)";
    for (let i = 0; i < 25; i++) {
      const ox = Math.random() * W;
      const oy = Math.random() * H;
      const or = 50 + Math.random() * 90;
      wrapX((x) => {
        const og = ctx.createRadialGradient(x, oy, 0, x, oy, or);
        og.addColorStop(0, "rgba(32, 110, 140, 0.65)");
        og.addColorStop(0.6, "rgba(18, 70, 95, 0.35)");
        og.addColorStop(1, "transparent");
        ctx.fillStyle = og;
        ctx.beginPath();
        ctx.arc(x, oy, or, 0, Math.PI * 2);
        ctx.fill();
      }, ox, or);
    }

    ctx.filter = "blur(10px)";
    ctx.fillStyle = "rgba(245, 250, 255, 0.32)";
    for (let y = 25; y < H - 25; y += 18) {
      const wx = Math.random() * W;
      const wrx = 80 + Math.random() * 160;
      const wry = 10 + Math.random() * 18;
      wrapX((x) => {
        ctx.beginPath();
        ctx.ellipse(x, y, wrx, wry, 0.05, 0, Math.PI * 2);
        ctx.fill();
      }, wx, wrx);
    }

    ctx.filter = "blur(3px)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    for (let i = 0; i < 18; i++) {
      const cx = Math.random() * W;
      const cy = Math.random() * H;
      const rx = 40 + Math.random() * 70;
      const ry = 4 + Math.random() * 8;
      wrapX((x) => {
        ctx.beginPath();
        ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }, cx, rx);
    }

  } else if (type === "exoplanet3") { // Realistic Dark Volcanic Basalt
    ctx.fillStyle = "#141312";
    ctx.fillRect(0, 0, W, H);

    ctx.filter = "blur(16px)";
    for (let i = 0; i < 22; i++) {
      const vx = Math.random() * W;
      const vy = Math.random() * H;
      const vr = 30 + Math.random() * 65;
      wrapX((x) => {
        const vg = ctx.createRadialGradient(x, vy, 0, x, vy, vr);
        vg.addColorStop(0, "rgba(180, 40, 15, 0.7)");
        vg.addColorStop(0.5, "rgba(110, 22, 10, 0.35)");
        vg.addColorStop(1, "transparent");
        ctx.fillStyle = vg;
        ctx.beginPath();
        ctx.arc(x, vy, vr, 0, Math.PI * 2);
        ctx.fill();
      }, vx, vr);
    }

    ctx.filter = "blur(8px)";
    for (let i = 0; i < 28; i++) {
      const ax = Math.random() * W;
      const ay = Math.random() * H;
      const ar = 25 + Math.random() * 50;
      wrapX((x) => {
        ctx.fillStyle = "rgba(45, 42, 39, 0.85)";
        ctx.beginPath();
        ctx.arc(x, ay, ar, 0, Math.PI * 2);
        ctx.fill();
      }, ax, ar);
    }

    ctx.filter = "none";
    for (let i = 0; i < 35; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      wrapX((x) => {
        ctx.beginPath();
        ctx.strokeStyle = Math.random() > 0.3 ? "rgba(215, 60, 25, 0.85)" : "rgba(140, 30, 12, 0.65)";
        ctx.lineWidth = 1 + Math.random() * 2;
        let currX = x;
        let currY = sy;
        ctx.moveTo(currX, currY);
        for (let j = 0; j < 5; j++) {
          currX += (Math.random() - 0.5) * 55;
          currY += (Math.random() - 0.5) * 28;
          ctx.lineTo(currX, currY);
        }
        ctx.stroke();
      }, sx, 100);
    }

  } else if (type === "exoplanet4") { // Muted Cobalt Gas Giant
    ctx.filter = "blur(18px)";
    const bandColors = ["#0f1f33", "#183252", "#234773", "#345f91", "#234773", "#183252", "#0f1f33"];
    for (let y = 0; y < H; y += 8) {
      const idx = Math.floor((y / H) * bandColors.length);
      const color = bandColors[idx] || "#183252";
      ctx.fillStyle = color;
      ctx.fillRect(0, y - 5, W, 18);
    }

    ctx.filter = "blur(12px)";
    for (let i = 0; i < 20; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      const srx = 60 + Math.random() * 120;
      const sry = 8 + Math.random() * 16;
      wrapX((x) => {
        ctx.fillStyle = "rgba(140, 175, 210, 0.22)";
        ctx.beginPath();
        ctx.ellipse(x, sy, srx, sry, 0, 0, Math.PI * 2);
        ctx.fill();
      }, sx, srx);
    }

    ctx.filter = "blur(6px)";
    const stormX = 290, stormY = 145;
    wrapX((x) => {
      const stormG = ctx.createRadialGradient(x, stormY, 4, x, stormY, 42);
      stormG.addColorStop(0, "rgba(70, 115, 160, 0.75)");
      stormG.addColorStop(0.7, "rgba(35, 65, 100, 0.4)");
      stormG.addColorStop(1, "transparent");
      ctx.fillStyle = stormG;
      ctx.beginPath();
      ctx.ellipse(x, stormY, 45, 22, -0.08, 0, Math.PI * 2);
      ctx.fill();
    }, stormX, 50);

  } else if (type === "exoplanet5") { // Cryo Glaciated Ice World
    const iceBase = ctx.createLinearGradient(0, 0, 0, H);
    iceBase.addColorStop(0, "#91b5c2");
    iceBase.addColorStop(0.5, "#bcd6e0");
    iceBase.addColorStop(1, "#91b5c2");
    ctx.fillStyle = iceBase;
    ctx.fillRect(0, 0, W, H);

    ctx.filter = "blur(14px)";
    for (let i = 0; i < 30; i++) {
      const ix = Math.random() * W;
      const iy = Math.random() * H;
      const ir = 40 + Math.random() * 85;
      wrapX((x) => {
        const ig = ctx.createRadialGradient(x, iy, 0, x, iy, ir);
        ig.addColorStop(0, "rgba(75, 110, 128, 0.5)");
        ig.addColorStop(1, "transparent");
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(x, iy, ir, 0, Math.PI * 2);
        ctx.fill();
      }, ix, ir);
    }

    ctx.filter = "blur(12px)";
    ctx.fillStyle = "rgba(245, 252, 255, 0.35)";
    for (let i = 0; i < 18; i++) {
      const fx = Math.random() * W;
      const fy = Math.random() * H;
      const frx = 70 + Math.random() * 110;
      const fry = 12 + Math.random() * 25;
      wrapX((x) => {
        ctx.beginPath();
        ctx.ellipse(x, fy, frx, fry, 0, 0, Math.PI * 2);
        ctx.fill();
      }, fx, frx);
    }

    ctx.filter = "none";
    for (let i = 0; i < 28; i++) {
      const cx = Math.random() * W;
      const cy = Math.random() * H;
      wrapX((x) => {
        ctx.strokeStyle = "rgba(50, 85, 100, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 20);
        ctx.stroke();
      }, cx, 50);
    }
  }

  // --- Final Horizontal Seam Crossfade Pass ---
  // Smoothly blend left edge (x=0..32) with right edge (x=480..512)
  const blendW = 32;
  const tempC = document.createElement("canvas");
  tempC.width = blendW;
  tempC.height = H;
  const tempCtx = tempC.getContext("2d");
  tempCtx.drawImage(canvas, 0, 0, blendW, H, 0, 0, blendW, H);

  ctx.filter = "none";
  ctx.save();
  for (let i = 0; i < blendW; i++) {
    const alpha = i / blendW;
    ctx.globalAlpha = 1 - alpha;
    ctx.drawImage(tempC, i, 0, 1, H, W - blendW + i, 0, 1, H);
  }
  ctx.restore();

  return canvas.toDataURL("image/png");
}

/* Texture loading (p5.js) */
let TEX_CACHE = {
  sun: null,
  byKey: {},
  rockyKeys: ["mercury", "venus", "earth", "mars", "exoplanet1", "exoplanet2"],
  giantKeys: ["jupiter", "saturn", "uranus", "neptune", "exoplanet3", "exoplanet4", "exoplanet5"]
};

function preloadTextures(p) {
  try { TEX_CACHE.sun = p.loadImage(TEXTURE_PATHS.sun); } catch (e) { TEX_CACHE.sun = null; }

  // Load all catalog textures
  for (const [key, item] of Object.entries(TEXTURE_CATALOG)) {
    if (item.procedural) {
      try {
        const dataUrl = createExoplanetDataUrl(key);
        TEX_CACHE.byKey[key] = p.loadImage(dataUrl);
      } catch (e) {
        TEX_CACHE.byKey[key] = null;
      }
    } else if (item.path) {
      try {
        TEX_CACHE.byKey[key] = p.loadImage(item.path);
      } catch (e) {
        TEX_CACHE.byKey[key] = null;
      }
    }
  }
}

/* Helper to extract true WebGL camera distance including orbitControl zoom */
function getWebGLCameraDistance(p) {
  try {
    const cam = p._renderer ? p._renderer._curCamera : null;
    if (cam) {
      if (typeof cam._distance === "number" && cam._distance > 0) {
        return cam._distance;
      }
      if (cam.eyeX !== undefined && cam.eyeY !== undefined && cam.eyeZ !== undefined) {
        const d = Math.hypot(cam.eyeX, cam.eyeY, cam.eyeZ);
        if (d > 0) return d;
      }
    }
    const mv = p._renderer ? (p._renderer.uModelViewMatrix || p._renderer.uMVMatrix) : null;
    if (mv && mv.mat4) {
      const m = mv.mat4;
      const dist = Math.hypot(m[12], m[13], m[14]);
      if (dist > 0) return dist;
    }
  } catch (e) {}
  return 800;
}

/* Custom Constant-Pixel-Width Orbit Rendering (Equivalent to Three.js Screen-Space Lines) */
function drawCustomOrbit(p, orbitRadius, inclination, targetPixelWidth = 2.0) {
  const camDist = getWebGLCameraDistance(p);
  const fov = (p._renderer && p._renderer._curCamera && p._renderer._curCamera.cameraFOV) ? p._renderer._curCamera.cameraFOV : (Math.PI / 3);
  const h = p.height || 600;

  // Dynamically scale 3D stroke weight so projected screen width is EXACTLY targetPixelWidth
  const sw3D = targetPixelWidth * (2 * camDist * Math.tan(fov / 2) / h);

  p.push();
    p.noFill();
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(Math.max(0.1, sw3D));

    p.rotateZ(inclination * Math.PI / 180);
    p.rotateX(Math.PI / 2);

    const detail = Math.max(64, Math.min(360, Math.floor(orbitRadius / 2)));
    p.beginShape();
    for (let i = 0; i <= detail; i++) {
      const angle = (i / detail) * Math.PI * 2;
      p.vertex(orbitRadius * Math.cos(angle), orbitRadius * Math.sin(angle), 0);
    }
    p.endShape();
  p.pop();
}

/* Domain classes */

class CelestialBody {
  constructor({ id, name, type, orbitRadius = 100, radiusPx, textureKey, textureImg, angle = 0, inclination = 0 }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.orbitRadius = orbitRadius;
    this.textureKey = textureKey || null;
    this.textureImg = textureImg || (this.textureKey ? TEX_CACHE.byKey[this.textureKey] : null);
    this.radiusPx = radiusPx || getRadiusForTexture(this.textureKey, this.type);
    this.angle = angle;
    this.inclination = inclination;
    this.precesion = Math.random() * 360;
    this.rotationAngle = 0;
    this.rotationSpeed = 0.5;
    this.planetRadius = 100;
  }

  setTextureKey(key) {
    this.textureKey = key;
    this.textureImg = TEX_CACHE.byKey[key] || null;
    this.radiusPx = getRadiusForTexture(key, this.type);
  }

  setType(newType) {
    if (this.type === newType) return;
    this.type = newType;
    if (newType === "rocky" && !TEX_CACHE.rockyKeys.includes(this.textureKey)) {
      this.setTextureKey(pickRandom(TEX_CACHE.rockyKeys));
    } else if (newType === "giant" && !TEX_CACHE.giantKeys.includes(this.textureKey)) {
      this.setTextureKey(pickRandom(TEX_CACHE.giantKeys));
    } else if (this.textureKey) {
      this.radiusPx = getRadiusForTexture(this.textureKey, newType);
    }
  }

  step(dt) {
    const omega = keplerAngularSpeed(this.orbitRadius);
    if (traslationToggle.checked) {
      this.angle -= omega * dt;
    }
    this.rotationAngle += this.rotationSpeed * dt;
  }

  draw(p) {
    p.push();
      // Precession rotation applies to the whole orbital system
      p.rotateY(this.precesion * Math.PI / 180);

      // Draw orbit circle
      if (orbitToggle.checked) {
        drawCustomOrbit(p, this.orbitRadius, this.inclination, 1.5);
      }

      // Render planet name label at the TOP of orbit ring (consistent position as diagram)
      if (typeof nameToggle !== "undefined" && nameToggle.checked) {
        const baseLabelDist = (typeof CONFIG !== "undefined" && CONFIG.labelDistance !== undefined) ? CONFIG.labelDistance : 18;
        const distScaleFactor = (typeof CONFIG !== "undefined" && CONFIG.labelDistanceScaleFactor !== undefined) ? CONFIG.labelDistanceScaleFactor : 0.05;
        const effectiveLabelDist = baseLabelDist + this.orbitRadius * distScaleFactor;

        const baseFontSize = (typeof CONFIG !== "undefined" && CONFIG.labelBaseFontSize !== undefined) ? CONFIG.labelBaseFontSize : 12;
        const scaleFactor = (typeof CONFIG !== "undefined" && CONFIG.labelScaleFactor !== undefined) ? CONFIG.labelScaleFactor : 0.1;
        
        // Font size scales proportionally with orbit radius without upper cap restrictions
        const scaledFontSize = Math.max(1, baseFontSize + (this.orbitRadius * scaleFactor));

        p.push();
          p.rotateZ(this.inclination * Math.PI / 180);
          p.rotateX(Math.PI / 2);
          
          // Position at the TOP of the orbit circle: (0, -(orbitRadius + effectiveLabelDist))
          const labelR = this.orbitRadius + effectiveLabelDist;
          p.translate(0, -labelR, 0);

          p.fill(240, 244, 255);
          p.noStroke();
          if (typeof appFont !== "undefined" && appFont) p.textFont(appFont);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.textSize(scaledFontSize);
          p.text(this.name, 0, 0);
        p.pop();
      }

      p.noStroke();

      const x = this.orbitRadius * Math.cos(this.angle);
      const y = 0;
      const z = this.orbitRadius * Math.sin(this.angle);

      p.push();
        p.rotateZ(this.inclination * Math.PI / 180);
        p.translate(x, y, z);

        p.push();
          p.rotateY(this.rotationAngle);
          if (this.textureImg) p.texture(this.textureImg);
          p.sphere(this.radiusPx, 24, 18);
        p.pop();

      p.pop();
    p.pop();
  }
}

class Belt {
  constructor({ id, name, orbitRadius = 100, count = 200, width = 50 }) {
    this.id = id;
    this.name = name;
    this.type = "belt";
    this.orbitRadius = orbitRadius;
    this.count = count;
    this.width = width;

    this.generateParticles();
  }

  generateParticles() {
    this.particles = Array.from({ length: this.count }, () => ({
      theta: Math.random() * Math.PI * 2,
      dR: (Math.random() - 0.5) * this.width,
      y: (Math.random() - 0.5) * this.width * 0.2
    }));
  }

  step(dt) {
    if (traslationToggle.checked) {
      const omega = keplerAngularSpeed(this.orbitRadius);
      for (const p of this.particles) {
        p.theta -= omega * dt * (0.5 + Math.random() * 0.5);
      }
    }
  }

  draw(p) {
    p.push();
      const pColor = (typeof CONFIG !== "undefined" && CONFIG.belt && CONFIG.belt.particleColor) ? CONFIG.belt.particleColor : 180;
      if (Array.isArray(pColor)) {
        p.ambientMaterial(...pColor);
      } else {
        p.ambientMaterial(pColor);
      }
      for (const pt of this.particles) {
        const r = this.orbitRadius + pt.dR;
        const x = r * Math.cos(pt.theta);
        const z = r * Math.sin(pt.theta);
        p.push();
        p.translate(x, pt.y, z);
        p.sphere(2, 8, 6);
        p.pop();
      }
    p.pop();
  }

  drawCorona(p) {
    p.push();
    p.noStroke();
    const cColor = (typeof CONFIG !== "undefined" && CONFIG.belt && CONFIG.belt.coronaColor) ? CONFIG.belt.coronaColor : [50, 50, 255, 150];
    if (Array.isArray(cColor)) {
      p.fill(...cColor);
    } else {
      p.fill(cColor);
    }
    p.rotateX(Math.PI / 2);

    const inner = this.orbitRadius - this.width / 2;
    const outer = this.orbitRadius + this.width / 2;
    const detail = 100;

    p.beginShape(p.TRIANGLE_STRIP);
    for (let i = 0; i <= detail; i++) {
      const angle = (i / detail) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      p.vertex(outer * cosA, outer * sinA, 0);
      p.vertex(inner * cosA, inner * sinA, 0);
    }
    p.endShape();

    // Render belt name label at the TOP of the outer edge of belt plane when nameToggle is checked
    if (typeof nameToggle !== "undefined" && nameToggle.checked) {
      const baseLabelDist = (typeof CONFIG !== "undefined" && CONFIG.labelDistance !== undefined) ? CONFIG.labelDistance : 18;
      const distScaleFactor = (typeof CONFIG !== "undefined" && CONFIG.labelDistanceScaleFactor !== undefined) ? CONFIG.labelDistanceScaleFactor : 0.05;
      const effectiveLabelDist = baseLabelDist + outer * distScaleFactor;

      const baseFontSize = (typeof CONFIG !== "undefined" && CONFIG.labelBaseFontSize !== undefined) ? CONFIG.labelBaseFontSize : 12;
      const scaleFactor = (typeof CONFIG !== "undefined" && CONFIG.labelScaleFactor !== undefined) ? CONFIG.labelScaleFactor : 0.1;
      const scaledFontSize = Math.max(1, baseFontSize + (outer * scaleFactor));

      p.push();
        p.translate(0, -(outer + effectiveLabelDist), 0);
        p.fill(240, 244, 255);
        p.noStroke();
        if (typeof appFont !== "undefined" && appFont) p.textFont(appFont);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(scaledFontSize);
        p.text(this.name, 0, 0);
      p.pop();
    }

    p.pop();
  }
}

/* Helper to convert object between CelestialBody and Belt */
function convertAstroType(item, newType) {
  if (item.type === newType) return item;

  let newItem;
  if (newType === "belt") {
    newItem = new Belt({
      id: item.id,
      name: item.name,
      orbitRadius: item.orbitRadius,
      count: 300,
      width: 50
    });
  } else {
    const key = (item.type !== "belt" && item.textureKey)
      ? item.textureKey
      : (newType === "rocky" ? pickRandom(TEX_CACHE.rockyKeys) : pickRandom(TEX_CACHE.giantKeys));

    if (item.type === "belt") {
      newItem = newType === "rocky"
        ? makeRocky(item.id, item.name, item.orbitRadius, key)
        : makeGiant(item.id, item.name, item.orbitRadius, key);
    } else {
      // Switching rocky <-> giant directly
      item.setType(newType);
      return item;
    }
  }

  // Replace in AppState.items array
  const idx = window.AppState.items.findIndex(x => x.id === item.id);
  if (idx >= 0) {
    window.AppState.items[idx] = newItem;
  }
  return newItem;
}

/* Factory functions */

function makeRocky(id, name, orbitRadius, textureKey) {
  const key = textureKey || pickRandom(TEX_CACHE.rockyKeys);
  const textureImg = TEX_CACHE.byKey[key] || null;
  const radiusPx = getRadiusForTexture(key, "rocky");
  return new CelestialBody({ id, name, type: "rocky", orbitRadius, radiusPx, textureKey: key, textureImg });
}

function makeGiant(id, name, orbitRadius, textureKey) {
  const key = textureKey || pickRandom(TEX_CACHE.giantKeys);
  const textureImg = TEX_CACHE.byKey[key] || null;
  const radiusPx = getRadiusForTexture(key, "giant");
  return new CelestialBody({ id, name, type: "giant", orbitRadius, radiusPx, textureKey: key, textureImg });
}

function makeBelt(id, name, orbitRadius) {
  return new Belt({ id, name, orbitRadius, count: 300, width: 50 });
}
