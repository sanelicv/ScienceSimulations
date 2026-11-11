let chi2P5Instance = null;

function createChi2Visualization(chi2Grid, omegaMValues, omegaLambdaValues, containerId) {
  // // 1. limpiar el contenedor si ya tenía un canvas
  // const container = document.getElementById(containerId);
  // if (container) {
  //   container.innerHTML = '';   // esto borra los canvases anteriores
  // }
  // si ya había una instancia, la quitamos
  if (chi2P5Instance) {
    chi2P5Instance.remove();   // elimina canvas y listeners
    chi2P5Instance = null;
  }
  
  chi2P5Instance = new p5((p) => {
    let minIndexM = 0;
    let minIndexL = 0;
    let chi2Min = Infinity;
    let h11, h22, h12;
    let angle, r1, r2;

    p.setup = function() {
      const canvas = p.createCanvas(1200, 800);
      canvas.parent(containerId);
      p.noLoop();

      // Find minimum chi2
      for (let i = 0; i < chi2Grid.length; i++) {
        for (let j = 0; j < chi2Grid[i].length; j++) {
          if (chi2Grid[i][j] < chi2Min) {
            chi2Min = chi2Grid[i][j];
            minIndexM = i;
            minIndexL = j;
          }
        }
      }

      // Numeric Hessian at best-fit
      const i = minIndexM;
      const j = minIndexL;
      const dM = omegaMValues[1] - omegaMValues[0];
      const dL = omegaLambdaValues[1] - omegaLambdaValues[0];
      const getVal = (ii, jj) => chi2Grid[ii] && chi2Grid[ii][jj] !== undefined ? chi2Grid[ii][jj] : chi2Min;

      h11 = (getVal(i+1,j) - 2*chi2Min + getVal(i-1,j)) / (dM*dM);
      h22 = (getVal(i,j+1) - 2*chi2Min + getVal(i,j-1)) / (dL*dL);
      h12 = (
        getVal(i+1,j+1) - getVal(i+1,j-1)
        - getVal(i-1,j+1) + getVal(i-1,j-1)
      ) / (4*dM*dL);

      // Eigen-decomposition
      const tr = h11 + h22;
      const disc = Math.sqrt((h11 - h22)*(h11 - h22) + 4*h12*h12);
      const lambda1 = (tr + disc)/2;
      const lambda2 = (tr - disc)/2;
      angle = 0.5 * Math.atan2(2*h12, (h11 - h22));

      // 1σ delta χ² for two parameters
      const deltaChi2 = 2.3;
      r1 = Math.sqrt(deltaChi2 / lambda1);
      r2 = Math.sqrt(deltaChi2 / lambda2);
    };

    p.draw = function() {
      p.background(255);
      const margin = 60;
      const bestM = omegaMValues[minIndexM];
      const bestL = omegaLambdaValues[minIndexL];

      // Compute data extents including ellipse
      const dxExtent = Math.sqrt((r1 * Math.cos(angle)) ** 2 + (r2 * Math.sin(angle)) ** 2);
      const dyExtent = Math.sqrt((r1 * Math.sin(angle)) ** 2 + (r2 * Math.cos(angle)) ** 2);

      // Limit the plot to the physical range [0, 5] in both parameters
      let xMin = Math.max(0, Math.min(...omegaMValues, bestM - dxExtent));
      let xMax = Math.min(5, Math.max(...omegaMValues, bestM + dxExtent));
      let yMin = Math.max(0, Math.min(...omegaLambdaValues, bestL - dyExtent));
      let yMax = Math.min(5, Math.max(...omegaLambdaValues, bestL + dyExtent));

      const plotWidth = p.width - 2 * margin;
      const plotHeight = p.height - 2 * margin;

      // Convert best-fit to pixels
      const bestX = p.map(bestM, xMin, xMax, margin, p.width - margin);
      const bestY = p.map(bestL, yMin, yMax, p.height - margin, margin);

      // Gridlines and ticks at step 0.1
      p.stroke(220);
      p.strokeWeight(1);
      p.noFill();

      // X-axis ticks
      const xStart = Math.ceil(xMin / 0.1) * 0.1;
      for (let xVal = xStart; xVal <= xMax; xVal = Math.round((xVal + 0.1) * 100) / 100) {
        const xPos = p.map(xVal, xMin, xMax, margin, p.width - margin);
        p.line(xPos, margin, xPos, p.height - margin);
        p.stroke(0);
        p.textSize(0.01 * p.width);
        p.line(xPos, p.height - margin, xPos, p.height - margin + 5);
        p.noStroke();
        p.fill(0);
        p.textAlign(p.CENTER, p.TOP);
        p.text(xVal.toFixed(1), xPos, p.height - margin + 8);
        p.stroke(220);
        p.noFill();
      }

      // Y-axis ticks
      const yStart = Math.ceil(yMin / 0.1) * 0.1;
      for (let yVal = yStart; yVal <= yMax; yVal = Math.round((yVal + 0.1) * 100) / 100) {
        const yPos = p.map(yVal, yMin, yMax, p.height - margin, margin);
        p.line(margin, yPos, p.width - margin, yPos);
        p.stroke(0);
        p.textSize(0.01 * p.width);
        p.line(margin - 5, yPos, margin, yPos);
        p.noStroke();
        p.fill(0);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(yVal.toFixed(1), margin - 8, yPos);
        p.stroke(220);
        p.noFill();
      }

      // Special gridlines at best-fit
      p.stroke(150);
      p.strokeWeight(1.5);
      p.line(bestX, margin, bestX, p.height - margin);
      p.line(margin, bestY, p.width - margin, bestY);

      // Axes
      p.stroke(0);
      p.strokeWeight(1.5);
      p.line(margin, p.height - margin, p.width - margin, p.height - margin);
      p.line(margin, margin, margin, p.height - margin);

      // Axis labels
      p.push();
      p.noStroke();
      p.textSize(0.01 * p.width);
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      drawSubscript(p, 'Ω', 16, 'm', 12, p.width / 2, p.height - margin / 4);
      p.translate(margin / 4, p.height / 2);
      p.rotate(-p.HALF_PI);
      drawSubscript(p, 'Ω', 16, 'Λ', 12, 0, 0);
      p.pop();

      // === Elipse con CLIPPING ===
      // Definir rectángulo de clipping: el área del plot
      const ctx = p.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(margin, margin, plotWidth, plotHeight);
      ctx.clip();
        // Dibujar la elipse dentro del clipping
        p.push();
        p.translate(bestX, bestY);
        p.rotate(angle);
        p.fill(200, 200, 200, 100);
        p.stroke(255, 0, 0);
        p.strokeWeight(2);
        const w = (r1 / (xMax - xMin)) * plotWidth;
        const h = (r2 / (yMax - yMin)) * plotHeight;
        p.ellipse(0, 0, w * 2, h * 2);
        p.pop();
        // Restaurar contexto (quitar clipping)
      ctx.restore();

      // Best-fit marker
      p.fill(255, 0, 0);
      p.noStroke();
      p.ellipse(bestX, bestY, 8, 8);

      // Label
      p.fill(0);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(0.015 * p.width);
      const label = `(${bestM.toFixed(3)}, ${bestL.toFixed(3)})`;
      p.text(label, bestX + 10, bestY - 10);
    };

  }, containerId);
}
