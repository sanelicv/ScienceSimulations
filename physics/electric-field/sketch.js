// Global variables
let charge1Pos, charge2Pos;
let scaleFactor = 1.0;    // We'll recalc this in setup and windowResized
let draggingCharge = null;
let offsetX = 0, offsetY = 0;

function setup() {
  // Create a canvas that’s limited to 600×600 but also shrinks if the device is narrower
  createCanvas(min(windowWidth, 600), min(windowWidth, 600));
  
  // Calculate scaleFactor relative to our "base" size (600)
  scaleFactor = min(width, height) / 600.0;
  
  // Position the charges with scaled offsets
  charge1Pos = createVector(width / 2 - 100 * scaleFactor, height / 2);
  charge2Pos = createVector(width / 2 + 100 * scaleFactor, height / 2);
}

function draw() {
  background(50);

  // Get charge values from script.js
  let Q1 = getCharge1();
  let Q2 = getCharge2();
  
  // For coloring sign
  let sign1 = getCharge1SignOnly();
  let sign2 = getCharge2SignOnly();
  
  // Grid resolution (user’s dropdown)
  let nGrid = getGridResolution();

// 1) Conditionally draw electric field vectors
  if (getDrawVectors() === 1) {
    drawFieldVectors(Q1, Q2, charge1Pos, charge2Pos, nGrid);
  }

  // After drawFieldVectors(...) and drawCharge(...):
  let nLines = getNumFieldLines();  // from script.js
  drawFieldLines(Q1, Q2, charge1Pos, charge2Pos, nLines);
    
  // --- Draw both charges
  drawCharge(charge1Pos, sign1);
  drawCharge(charge2Pos, sign2);

    // **New**: draw equipotentials
    let nEquip = getNumEquipotentials();
    drawEquipotentials(Q1, Q2, charge1Pos, charge2Pos, nEquip);
}



function windowResized() {
  // Resize the canvas
  resizeCanvas(min(windowWidth, 600), min(windowHeight, 600));
  
  // Recompute scale factor
  scaleFactor = min(width, height) / 600.0;
  
  // (Optional) If you want to preserve each charge's fractional position
  // after a resize, you can do something like:
  //
  // let fracX1 = charge1Pos.x / width;
  // let fracY1 = charge1Pos.y / height;
  // let fracX2 = charge2Pos.x / width;
  // let fracY2 = charge2Pos.y / height;
  //
  // Then after resizeCanvas():
  // charge1Pos.set(fracX1 * width, fracY1 * height);
  // charge2Pos.set(fracX2 * width, fracY2 * height);
  
  // Otherwise, if you do nothing, the charges stay at the same absolute (x,y).
}

// ================================================
// Mouse interactions remain basically the same
// ================================================
function mousePressed() {
  if (dist(mouseX, mouseY, charge1Pos.x, charge1Pos.y) < 15 * scaleFactor) {
    draggingCharge = 1;
    offsetX = charge1Pos.x - mouseX;
    offsetY = charge1Pos.y - mouseY;
  } 
  else if (dist(mouseX, mouseY, charge2Pos.x, charge2Pos.y) < 15 * scaleFactor) {
    draggingCharge = 2;
    offsetX = charge2Pos.x - mouseX;
    offsetY = charge2Pos.y - mouseY;
  }
}

function mouseDragged() {
  if (draggingCharge === 1) {
    charge1Pos.x = mouseX + offsetX;
    charge1Pos.y = mouseY + offsetY;
  } else if (draggingCharge === 2) {
    charge2Pos.x = mouseX + offsetX;
    charge2Pos.y = mouseY + offsetY;
  }
}

function mouseReleased() {
  draggingCharge = null;
}

// ================================================
// Drawing helper functions
// ================================================

function potentialAt(r, pos1, Q1, pos2, Q2) {
  let rVec1 = p5.Vector.sub(r, pos1);
  let dist1 = rVec1.mag();
  let rVec2 = p5.Vector.sub(r, pos2);
  let dist2 = rVec2.mag();

  // Avoid dividing by zero if the point is exactly on a charge
  let V1 = (dist1 < 1e-6) ? 1e6 * Math.sign(Q1) : Q1 / dist1;
  let V2 = (dist2 < 1e-6) ? 1e6 * Math.sign(Q2) : Q2 / dist2;
  return V1 + V2;
}

function drawEquipotentials(Q1, Q2, pos1, pos2, numEquip) {
  // If user selects 0, skip
  if (numEquip === 0) return;

  // We'll reference the same radius you use to draw your charges.
  // (If your drawCharge function uses 15*scaleFactor, use the same here.)
  let rCharge = 15 * scaleFactor;

  // Grid for potential sampling
  let nx = 100;
  let ny = 100;
  let dx = width / nx;
  let dy = height / ny;

  // -- 1) Sample potential at each cell corner --
  //    Mark corners inside a charge as null
  let potVals = [];
  let minV = Number.POSITIVE_INFINITY;
  let maxV = Number.NEGATIVE_INFINITY;

  for (let j = 0; j <= ny; j++) {
    let row = [];
    for (let i = 0; i <= nx; i++) {
      let x = i * dx;
      let y = j * dy;
      let p = createVector(x, y);

      // NEW: Check if inside either charge
      let dist1 = p5.Vector.dist(p, pos1);
      let dist2 = p5.Vector.dist(p, pos2);
      let insideCharge = (dist1 < rCharge) || (dist2 < rCharge);

      if (insideCharge) {
        // Mark as null so we skip it later
        row.push(null);
      } else {
        // Otherwise compute potential
        let v = potentialAt(p, pos1, Q1, pos2, Q2);
        row.push(v);
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
    potVals.push(row);
  }

  // If everything is null, do nothing
  if (minV === Number.POSITIVE_INFINITY || maxV === Number.NEGATIVE_INFINITY) {
    return;
  }

  // -- 2) Split the user-chosen number of equipotentials
  //       between negative side and positive side
  let nNeg = 0;
  let nPos = 0;
  if (minV < 0 && maxV > 0) {
    nNeg = Math.floor(numEquip / 2);
    nPos = numEquip - nNeg;
  } else if (maxV <= 0) {
    nNeg = numEquip;
    nPos = 0;
  } else {
    nNeg = 0;
    nPos = numEquip;
  }

  // -- 3) Build log-spaced negative levels (if needed) --
  let negLevels = [];
  if (nNeg > 0 && minV < 0) {
    let absMin = Math.abs(minV);
    let absMax = 0.01 * absMin;
    if (absMax < 1e-9) absMax = 1e-9;
    negLevels = buildLogLevels(absMax, absMin, nNeg).map(val => -val);
  }

  // -- 4) Build log-spaced positive levels (if needed) --
  let posLevels = [];
  if (nPos > 0 && maxV > 0) {
    let minFrac = 0.01;
    let vMinPos = maxV * minFrac;
    if (vMinPos < 1e-9) vMinPos = 1e-9;
    posLevels = buildLogLevels(vMinPos, maxV, nPos);
  }

  let allLevels = [...negLevels, ...posLevels];

  // -- 5) Draw the equipotentials via marching squares for each level --
  stroke(255, 255, 0); // Yellow
  noFill();

  for (let level of allLevels) {
    // March cell-by-cell
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        let v00 = potVals[j][i];
        let v10 = potVals[j][i + 1];
        let v01 = potVals[j + 1][i];
        let v11 = potVals[j + 1][i + 1];

        // NEW: Skip if any corner is null => that cell is inside a charge
        if (v00 === null || v10 === null || v01 === null || v11 === null) {
          continue;
        }

        let x0 = i * dx;
        let x1 = (i + 1) * dx;
        let y0 = j * dy;
        let y1 = (j + 1) * dy;
        let pts = [];

        function interpX(yFixed, vA, vB, xA, xB) {
          let t = (level - vA) / (vB - vA + 1e-12);
          return lerp(xA, xB, t);
        }
        function interpY(xFixed, vA, vB, yA, yB) {
          let t = (level - vA) / (vB - vA + 1e-12);
          return lerp(yA, yB, t);
        }

        // Check each edge for crossing
        if ((v00 - level) * (v10 - level) < 0) {
          let xC = interpX(y0, v00, v10, x0, x1);
          pts.push(createVector(xC, y0));
        }
        if ((v01 - level) * (v11 - level) < 0) {
          let xC = interpX(y1, v01, v11, x0, x1);
          pts.push(createVector(xC, y1));
        }
        if ((v00 - level) * (v01 - level) < 0) {
          let yC = interpY(x0, v00, v01, y0, y1);
          pts.push(createVector(x0, yC));
        }
        if ((v10 - level) * (v11 - level) < 0) {
          let yC = interpY(x1, v10, v11, y0, y1);
          pts.push(createVector(x1, yC));
        }

        if (pts.length === 2) {
          beginShape();
          vertex(pts[0].x, pts[0].y);
          vertex(pts[1].x, pts[1].y);
          endShape();
        }
      }
    }
  }
}

/**
 * Return an array of 'n' log-spaced values between minVal and maxVal (both > 0).
 * E.g. buildLogLevels(1, 100, 4) => roughly [1.78, 3.16, 5.62, 10].
 */
function buildLogLevels(minVal, maxVal, n) {
  let levels = [];
  let logMin = Math.log(minVal);
  let logMax = Math.log(maxVal);

  for (let i = 1; i <= n; i++) {
    let frac = i / (n + 1);
    let val = Math.exp(lerp(logMin, logMax, frac));
    levels.push(val);
  }
  return levels;
}


/**
 * Build 'n' log-spaced values between minVal and maxVal (both > 0).
 * For example, buildLogLevels(1, 100, 4) => [1.78, 3.16, 5.62, 10].
 * Use p5's 'lerp' in log space.
 */
function buildLogLevels(minVal, maxVal, n) {
  let levels = [];
  let logMin = Math.log(minVal);
  let logMax = Math.log(maxVal);
  for (let i = 1; i <= n; i++) {
    let frac = i / (n + 1);
    let val = Math.exp(lerp(logMin, logMax, frac));
    levels.push(val);
  }
  return levels;
}



function drawCharge(pos, sign) {
  // Scale the radius
  let r = 15 * scaleFactor;

  push();
  strokeWeight(2);
  if (sign > 0) {
    fill(255, 100, 100); 
    stroke(200, 50, 50);
  } else {
    fill(100, 100, 255); 
    stroke(50, 50, 200);
  }
  circle(pos.x, pos.y, r * 2);

  // Draw +/- in the circle
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16 * scaleFactor);
  if (sign > 0) {
    text("+", pos.x, pos.y);
  } else {
    text("-", pos.x, pos.y);
  }
  pop();
}

// Compute electric field at a point r
function electricField(r, r1, Q1, r2, Q2) {
  let E = createVector(0, 0);

  // Contribution from charge 1
  let rVec1 = p5.Vector.sub(r, r1);
  let dist1 = rVec1.mag();
  if (dist1 !== 0) {
    let E1 = rVec1.copy().normalize().mult(Q1 / (dist1 * dist1));
    E.add(E1);
  }

  // Contribution from charge 2
  let rVec2 = p5.Vector.sub(r, r2);
  let dist2 = rVec2.mag();
  if (dist2 !== 0) {
    let E2 = rVec2.copy().normalize().mult(Q2 / (dist2 * dist2));
    E.add(E2);
  }
  return E;
}

function drawFieldVectors(Q1, Q2, pos1, pos2, nGrid) {
  // The grid spacing already adapts to current width/height
  let spacingX = width / (nGrid + 1);
  let spacingY = height / (nGrid + 1);

  // We'll store the field at each grid point
  let fieldPoints = []; 
  let minMag = 1e-5;
  let maxMag = 1e-3;

  // First pass: gather magnitudes
  for (let i = 0; i <= nGrid + 1; i++) {
    for (let j = 0; j <= nGrid + 1; j++) {
      let x = i * spacingX;
      let y = j * spacingY;
      let field = electricField(createVector(x, y), pos1, Q1, pos2, Q2);
      let mag = field.mag();
      fieldPoints.push({ x, y, mag, dir: field.heading() });

      if (mag < minMag) minMag = mag;
      if (mag > maxMag) maxMag = mag;
    }
  }

  // Avoid tiny or zero values in log scale
  if (minMag < 1e-12) minMag = 1e-12;
  if (maxMag < 1e-12) maxMag = 1e-12;

  let logMin = Math.log(minMag);
  let logMax = Math.log(maxMag);

  // Second pass: draw each arrow
  for (let p of fieldPoints) {
    let logVal = Math.log(p.mag);
    let c = (logVal - logMin) / (logMax - logMin);
    c = constrain(c, 0, 1);
    if (c > 0.95) c = 1;

    // Map c in [0..1] to a hue from 240 (blue) to 0 (red)
    colorMode(HSB, 360, 100, 100);
    let hueVal = lerp(240, 0, c);
    let arrowColor = color(hueVal, 100, 100, 3*c);
    colorMode(RGB, 255);

    // Scale arrow length and tip size
    let arrowSize = 10 * scaleFactor;
    let arrowLength = 20 * scaleFactor;

    push();
    translate(p.x, p.y);
    rotate(p.dir);
    stroke(arrowColor);
    fill(arrowColor);
    line(0, 0, arrowLength, 0);
    triangle(arrowLength, 0, arrowLength - arrowSize, 3 * scaleFactor, arrowLength - arrowSize, -3 * scaleFactor);
    pop();
  }
}

function drawFieldLines(Q1, Q2, pos1, pos2, numLines) {
  if (numLines == 0 ) return 0;
  // White stroke for field lines
  stroke(255);
  noFill();

  // Scale factor from your existing approach:
  // (If you're using the code that sets scaleFactor in setup/windowResized)
  // make sure you have that variable accessible here.
  // If not, just set scaleFactor = 1 for a simpler approach.
  let stepSize = 4 * scaleFactor;   // how far we move each iteration
  let maxSteps = 300;              // max # of steps per line
  let rStart = 15 * scaleFactor;   // distance from charge center to start

  // Helper: trace a single field line from 'startPos'
  // If charge is negative, we reverse direction to follow field lines inward.
  function traceLine(startPos, signOfCharge) {
    let points = [];
    let current = startPos.copy();

    for (let i = 0; i < maxSteps; i++) {
      points.push(current.copy());

      // 1) Calculate field direction at current point
      let E = electricField(current, pos1, Q1, pos2, Q2);
      if (E.mag() < 1e-12) break;   // avoid dividing by zero

      E.normalize();
      if (signOfCharge < 0) {
        // Negative charge => lines go inward
        E.mult(-1);
      }

      // 2) Take a step in that direction
      current.add(E.mult(stepSize));

      // 3) Stop if we get too close to a charge
      let d1 = p5.Vector.dist(current, pos1);
      let d2 = p5.Vector.dist(current, pos2);
      if (d1 < rStart || d2 < rStart) {
        break;
      }
      
      // 4) Stop if we exit the canvas
      if (current.x < 0 || current.x > width ||
          current.y < 0 || current.y > height) {
        break;
      }
    }

    // Draw the collected points as a continuous line
    beginShape();
    for (let p of points) {
      vertex(p.x, p.y);
    }
    endShape();
  }

  // Function: for a single charge Q at pos, draw numLines lines
  function drawLinesForCharge(Q, pos) {
    if (Q === 0) return;  // no lines for zero charge
    let sign = (Q > 0) ? 1 : -1;
    for (let i = 0; i < numLines; i++) {
      // Evenly distribute seeds around the circle, from 0..2π
      let angle = map(i, 0, numLines, 0, TWO_PI);
      // Start each line slightly away from charge center
      let seed = p5.Vector.fromAngle(angle, rStart);
      seed.add(pos);
      traceLine(seed, sign);
    }
  }

  // Actually do it for each charge
  drawLinesForCharge(Q1, pos1);
  drawLinesForCharge(Q2, pos2);
}
