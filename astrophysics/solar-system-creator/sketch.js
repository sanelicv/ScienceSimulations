//import { preloadTextures, TEX_CACHE } from "./functions.js";

let p5Canvas;
let lastMillis = 0;
let appFont = null;

window.preload = function () {
  preloadTextures(window);
  try {
    appFont = loadFont("./Roboto-Bold.otf");
  } catch (e) {
    appFont = null;
  }
};

window.setup = function () {
  const host = document.getElementById("canvas-host");
  p5Canvas = createCanvas(host.clientWidth, host.clientHeight, WEBGL);
  p5Canvas.parent(host);
  noStroke();
  perspective(PI / 3, width / height, 1, 50000);
  if (appFont) textFont(appFont);
};

window.windowResized = function () {
  const host = document.getElementById("canvas-host");
  resizeCanvas(host.clientWidth, host.clientHeight);
  perspective(PI / 3, width / height, 1, 50000);
};

function drawSun() {
  push();
    ambientLight(255);

    // Subtle glow-ish material + texture if available
    if (TEX_CACHE.sun) texture(TEX_CACHE.sun);

    // Keep Sun readable using configurable sunRadius
    const sunR = (typeof CONFIG !== "undefined" && CONFIG.sunRadius !== undefined) ? CONFIG.sunRadius : 40;
    sphere(sunR, 36, 24);
  pop();
}

function drawScene(dt) {
  background(5, 8, 20);

  // Camera controls
  orbitControl();
  const ambLight = (typeof CONFIG !== "undefined" && CONFIG.ambientLight !== undefined) ? CONFIG.ambientLight : 50;
  if (Array.isArray(ambLight)) {
    ambientLight(...ambLight);
  } else {
    ambientLight(ambLight);
  }
  pointLight(255, 255, 255, 0, 0, 0);
  pointLight(255, 255, 255, 0, 0, 0);

  // Sun
  push();
    drawSun();
  pop();

  // Bodies
  const items = window.AppState.items;
  for (const it of items) {
    it.step(dt);
    it.draw(window);
  }

  // --- NEW: draw coronas last ---
  for (const it of items) {
    if (it.type === "belt" && ringToggle.checked) {
      it.drawCorona(window); // separate method just for corona
    }
  }

}

window.draw = function () {
  const t = millis();
  const dt = lastMillis ? (t - lastMillis) / 1000 : 0;
  lastMillis = t;
  drawScene(dt*Number(speedFactor.value));
};
