/* p5.js (instance mode). Solo lo fundamental del plot. */
const regressionSketch = (p) => {
  // Estado recibido desde script.js
  let data = [];            // [{x, y}]
  let headers = { x: "x", y: "y" };
  let fit = null;           // {a,b,sigma_a,sigma_b,...}

  // World to screen
  let xScale, yScale;
  let xRangePlot = [0, 1];
  let yRangePlot = [0, 1];

  p.setup = function () {
    const host = document.getElementById('canvas-host');
    const w = host.clientWidth;
    const h = host.clientHeight;
    const cnv = p.createCanvas(w, h);
    cnv.parent('canvas-host');
    //p.pixelDensity(1);
    p.noLoop();
  };

  p.windowResized = function () {
    const host = document.getElementById('canvas-host');
    p.resizeCanvas(host.clientWidth, host.clientHeight);
    p.redraw();
  };

  function computeScales() {
    // Set plot range
    if (data.length >= 2) {
      const xs = data.map(d => d.x);
      const ys = data.map(d => d.y);
      const xPad = expandRange([Math.min(...xs), Math.max(...xs)], 0.08);
      const yPad = expandRange([Math.min(...ys), Math.max(...ys)], 0.12);
      xRangePlot = xPad;
      yRangePlot = yPad;
    }
    const left = p.width > 900 ? 100 : 80; 
    const right = 30, top = 30, bottom = 60;
    const plotW = p.width - left - right;
    const plotH = p.height - top - bottom;

    const xMin = xRangePlot[0], xMax = xRangePlot[1];
    const yMin = yRangePlot[0], yMax = yRangePlot[1];

    xScale = (x) => left + ( (x - xMin) / (xMax - xMin) ) * plotW;
    yScale = (y) => top  + (1 - (y - yMin) / (yMax - yMin)) * plotH;

    return { left, right, top, bottom, plotW, plotH, xMin, xMax, yMin, yMax };
  }

  function drawAxes(ctx) {
    const { left, top, bottom, xMin, xMax, yMin, yMax } = ctx;

    p.stroke(200); p.strokeWeight(1); p.noFill();
    // Axes
    p.line(xScale(xMin), yScale(yMin), xScale(xMax), yScale(yMin));
    p.line(xScale(xMin), yScale(yMin), xScale(xMin), yScale(yMax));

    // Ticks
    const xt = makeNiceTicks(xMin, xMax, 6).ticks;
    const yt = makeNiceTicks(yMin, yMax, 6).ticks;
    const tickTextSize = p.width > 900 ? 15 : 12;
    p.textSize(tickTextSize);
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255); p.noStroke();
    for (const t of xt) {
      const sx = xScale(t);
      p.stroke(80); p.line(sx, yScale(yMin), sx, yScale(yMin) + 6);
      p.noStroke(); p.text(formatTick(t), sx, yScale(yMin) + 8);
    }
    p.textAlign(p.RIGHT, p.CENTER);
    for (const t of yt) {
      const sy = yScale(t);
      p.stroke(80); p.line(xScale(xMin) - 6, sy, xScale(xMin), sy);
      p.noStroke(); p.text(formatTick(t), xScale(xMin) - 8, sy);
    }

    // === GRIDLINES ===
    p.stroke(60);  // gris oscuro
    p.strokeWeight(1);
    p.noFill();
    // vertical
    for (const t of xt) {
      const sx = xScale(t);
      p.line(sx, yScale(yMin), sx, yScale(yMax));
    }
    // horizontal
    for (const t of yt) {
      const sy = yScale(t);
      p.line(xScale(xMin), sy, xScale(xMax), sy);
    }


    // Axes Label
    p.noStroke();
    p.fill(255);
    const labelTextSize = p.width > 900 ? 25 : 15;
    p.textSize(labelTextSize);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(headers.x, (xScale(xMin) + xScale(xMax)) / 2, p.height - 8);
    p.push();
    const translateY = p.width > 900 ? 30 : 20;
    p.translate(translateY, (yScale(yMin) + yScale(yMax)) / 2);
    p.rotate(-p.HALF_PI);
    p.text(headers.y, 0, 0);
    p.pop();
  }

  function formatTick(v) {
    const a = Math.abs(v);
    if (a === 0) return "0";
    if (a >= 1e4 || a < 1e-3) return v.toExponential(1);
    return +v.toFixed( (a < 1 ? 3 : (a < 10 ? 2 : 1)) );
  }

  function drawPoints() {
    p.noStroke(); p.fill(122, 162, 255, 230);
    const r = 4;
    for (const d of data) {
      p.circle(xScale(d.x), yScale(d.y), 2*r);
    }
  }

  function drawBestFit() {
    if (!fit) return;
    const [x0, x1] = xRangePlot;
    const y0 = fit.a + fit.b * x0;
    const y1 = fit.a + fit.b * x1;
    p.stroke(34, 197, 94); // verde suave (en tu paleta)
    p.strokeWeight(2.5);
    p.noFill();
    p.line(xScale(x0), yScale(y0), xScale(x1), yScale(y1));
  }

  p.draw = function () {
    p.background(getComputedStyle(document.body).getPropertyValue('--bg') || '#0f1220');
    if (!data.length) return;
    const ctx = computeScales();
    drawAxes(ctx);
    drawPoints();
    drawBestFit();
  };

  // === API for script.js ===
  p._setDataAndFit = function (arrXY, hdrs, fitObj) {
    data = arrXY;
    headers = hdrs || headers;
    fit = fitObj || null;
    p.redraw();
  };
};

let p5Instance = null;
function mountSketch() {
  if (p5Instance) { p5Instance.remove(); p5Instance = null; }
  p5Instance = new p5(regressionSketch);
}
