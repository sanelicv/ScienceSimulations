// sketch.js
// p5 instance mode: único responsable del dibujo y la simulación.
// Expone una API mínima para que la UI (script.js) controle el sketch.

const dopplerSketch = (p) => {
  // Parámetros de estado
  let v = 0.0;          // velocidad actual (fracción de c)
  let lambdaEm = 550.0; // longitud de onda emitida (nm)
  let running = false;  // ¿simulación en curso?
  let moving = false;   // ¿la fuente aún se mueve?

  // Geometría, pulsos y tiempo
  let pulses = [];
  let lastEmissionTime = 0;
  const emissionInterval = 0.5; // s entre pulsos (c=1)
  let maxRadius;
  let startTime = 0;
  let freezeTime = null;

  // Movimiento de la fuente (escena)
  let sourceX;
  const sourceY = 0;
  let startX, endX;
  const pixelsPerSec = 50; // px/s para c=1

  // Tablas para performance y paleta angular relativista
  const STEPS = 64;
  const TWO_PI = Math.PI * 2;
  const dTheta = TWO_PI / STEPS;
  const cosT = new Array(STEPS);
  const sinT = new Array(STEPS);
  const nextIdx = new Array(STEPS);
  let palette = new Array(STEPS); // [r,g,b,a] por ángulo
  let paletteDirty = true;

  // Fill trig tables una sola vez
  for (let i = 0; i < STEPS; i++) {
    const th = i * dTheta;
    cosT[i] = Math.cos(th);
    sinT[i] = Math.sin(th);
    nextIdx[i] = (i + 1) % STEPS;
  }

  p.setup = () => {
    const canvas = p.createCanvas(getW(), getH());
    canvas.parent("canvas-host");
    p.angleMode(p.RADIANS);
    p.pixelDensity(1);

    startX = 0.25 * p.width;
    endX   = 0.75 * p.width;
    sourceX = startX;

    maxRadius = Math.max(p.width, p.height) * 1.0;

    // Estado inicial: modo "preview"
    resetSimulation();

    // Exponer API pública para la UI
    window.SketchAPI = {
      startSimulation,
      resetSimulation,
      setLambdaPreview,
    };
  };

  p.windowResized = () => {
    p.resizeCanvas(getW(), getH());
    startX = 0.25 * p.width;
    endX   = 0.75 * p.width;
    if (!running) sourceX = startX;
    maxRadius = Math.max(p.width, p.height) * 1.0;
  };

  function startSimulation(vIn, lambdaIn) {
    // Reinicia y arranca
    startX = 0.25 * p.width;
    endX   = 0.75 * p.width;
    sourceX = startX;

    pulses = [{ born: 0, x: sourceX, y: sourceY }];
    moving = true;
    running = true;
    freezeTime = null;

    startTime = p.millis() / 1000;
    lastEmissionTime = 0;

    v = Number(vIn);
    lambdaEm = Number(lambdaIn);
    paletteDirty = true;
  }

  function resetSimulation() {
    // Vuelve a preview (fuente fija y v=0)
    startX = 0.25 * p.width;
    endX   = 0.75 * p.width;
    sourceX = startX;

    pulses = [{ born: 0, x: sourceX, y: sourceY }];
    moving = false;
    running = false;
    freezeTime = null;

    startTime = p.millis() / 1000;
    lastEmissionTime = 0;

    v = 0.0; // preview: sin movimiento
    paletteDirty = true;
  }

  function setLambdaPreview(lam) {
    lambdaEm = Number(lam);
    paletteDirty = true;
    // En modo running también actualizamos colores (λ cambia “en vivo”).
  }

  function updatePalette() {
    const gamma = 1.0 / Math.sqrt(1.0 - v * v);
    for (let i = 0; i < STEPS; i++) {
      const lamObs = lambdaEm * gamma * (1.0 - v * cosT[i]); // λ′(θ)
      palette[i] = wavelengthToRGB(lamObs);
    }
    paletteDirty = false;
  }

  p.draw = () => {
    if (paletteDirty) updatePalette();

    p.background(18, 20, 28);
    p.translate(0, p.height / 2);

    const now = p.millis() / 1000;
    const elapsed = freezeTime !== null ? freezeTime : (now - startTime);

    // Movimiento de la fuente
    if (running && moving) {
      sourceX = startX + v * pixelsPerSec * elapsed;
      if (sourceX >= endX) {
        sourceX = endX;
        moving = false;
        freezeTime = elapsed; // congelar escena al llegar
      }
    }

    // Emisión de pulsos
    if (elapsed - lastEmissionTime > emissionInterval) {
      pulses.push({ born: elapsed, x: sourceX, y: sourceY });
      lastEmissionTime = elapsed;
    }

    // Culling y caché de radios
    const alive = [];
    for (let i = pulses.length - 1; i >= 0; i--) {
      const age = elapsed - pulses[i].born;
      const r = age * pixelsPerSec;
      if (r <= maxRadius && r > 0) {
        alive.push({ cx: pulses[i].x, cy: pulses[i].y, r });
      } else if (r > maxRadius) {
        pulses.splice(i, 1);
      }
    }

    // Dibujo: por ángulo, para todos los pulsos vivos
    p.strokeWeight(2);
    for (let t = 0; t < STEPS; t++) {
      const t2 = nextIdx[t];
      const c1 = cosT[t], s1 = sinT[t];
      const c2 = cosT[t2], s2 = sinT[t2];

      const col = palette[t];
      p.stroke(col[0], col[1], col[2], col[3]);

      for (let i = 0; i < alive.length; i++) {
        const R = alive[i].r;
        const cx = alive[i].cx, cy = alive[i].cy;
        const x1 = cx + R * c1;
        const y1 = cy + R * s1;
        const x2 = cx + R * c2;
        const y2 = cy + R * s2;
        p.line(x1, y1, x2, y2);
      }
    }

    // Fuente
    let sourceColor = wavelengthToRGB(lambdaEm);
    p.noStroke();
    p.fill(sourceColor);
    p.circle(sourceX, sourceY, 10);

    // Observadores (delante y detrás)
    drawObserverWavelengths(p, v, lambdaEm, sourceY);
  };

  function getW() {
    const holder = document.getElementById("canvas-host");
    //const w = holder.getBoundingClientRect().width;
    //return Math.max(320, Math.floor(w - 40));
    return holder.clientWidth;
  }
  function getH() {
    const holder = document.getElementById("canvas-host");
    //const w = holder.getBoundingClientRect().width;
    //return Math.max(280, Math.floor(0.75 * w));
    return holder.clientHeight;
  }

  function wavelengthToRGB(lambdaNm) {
    const lam = lambdaNm;
    let R = 0, G = 0, B = 0;
    let alpha = 255;

    if (lam < 400 || lam > 700) return [125, 125, 125];

    if (lam >= 400 && lam < 440) {
      R = -(lam - 440) / (440 - 400); G = 0.0; B = 1.0;
    } else if (lam >= 440 && lam < 490) {
      R = 0.0; G = (lam - 440) / (490 - 440); B = 1.0;
    } else if (lam >= 490 && lam < 510) {
      R = 0.0; G = 1.0; B = -(lam - 510) / (510 - 490);
    } else if (lam >= 510 && lam < 580) {
      R = (lam - 510) / (580 - 510); G = 1.0; B = 0.0;
    } else if (lam >= 580 && lam < 645) {
      R = 1.0; G = -(lam - 645) / (645 - 580); B = 0.0;
    } else if (lam >= 645 && lam <= 700) {
      R = 1.0; G = 0.0; B = 0.0;
    }

    let factor = 1.0;
    if (lam > 680) factor = 0.3 + 0.7 * (700 - lam) / (20);
    else if (lam < 420) factor = 0.3 + 0.7 * (lam - 400) / (20);

    const gamma = 0.8;
    const to8 = (c) =>
      c <= 0 ? 0 : Math.round(255 * factor * Math.pow(c, gamma));
    return [to8(R), to8(G), to8(B), alpha];
  }

  function drawObserverWavelengths(p, v, lambdaEm, y0) {
    const gamma = 1.0 / Math.sqrt(1.0 - v * v);
    const lambdaBack  = lambdaEm * gamma * (1 + v); // detrás
    const lambdaFront = lambdaEm * gamma * (1 - v); // delante

    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);

    function drawStickMan(x, yCenter, colorText, textLabel, observerLabel) {
      p.push();
        p.translate(x, 0);
        getW() > 900 ? p.scale(getW()/1200) : p.scale(getW()/600); 
        
        
        p.stroke(255);
        p.strokeWeight(3);
        p.noFill();

        p.circle(0, yCenter - 40, 20);
        p.line(0, yCenter - 30, 0, yCenter);
        p.line(0, yCenter - 20, 0 - 15, yCenter - 35);
        p.line(0, yCenter - 20, 0 + 15, yCenter - 35);
        p.line(0, yCenter, 0 - 15, yCenter + 25);
        p.line(0, yCenter, 0 + 15, yCenter + 25);

        const yText = yCenter - 80;
        const w = p.textWidth(textLabel) + 20;
        const h = 40;

        p.noStroke();
        p.fill(0, 180);
        p.rectMode(p.CENTER);
        p.rect(0, yText, w, h, 8);

        p.fill(colorText[0], colorText[1], colorText[2]);
        p.text(textLabel, 0, yText);

        const yObserverLabelText = yCenter + 75;
        p.fill(255);
        p.text(observerLabel, 0, yObserverLabelText);
      p.pop();      
    }

    const textBack  = `${Math.round(lambdaBack)} nm`;
    const colBack   = wavelengthToRGB(lambdaBack);
    drawStickMan(p.width / 8, y0, colBack, textBack, "A");

    const textFront = `${Math.round(lambdaFront)} nm`;
    const colFront  = wavelengthToRGB(lambdaFront);
    drawStickMan(p.width - p.width / 8, y0, colFront, textFront, "B");
  }
};

new p5(dopplerSketch, "canvas-host");
