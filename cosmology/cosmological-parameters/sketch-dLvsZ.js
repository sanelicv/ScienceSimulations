// p5.js visualization for dL vs z
function createPlotVisualization(bestOmegaM, bestOmegaLambda, H0) {
    // Create or select the plot container
    let plotDiv = document.getElementById('plotVisualization');
    if (!plotDiv) {
        plotDiv = document.createElement('div');
        plotDiv.id = 'plotVisualization';
        plotDiv.style.marginTop = '20px'; // Optional styling
        document.body.appendChild(plotDiv);
    } else {
        plotDiv.innerHTML = ''; // Clear previous canvas if any
    }

    let sketch = function(p) {
        let canvasWidth = 1200;
        let canvasHeight = 700;
        let margin = {top: 60, right: 100, bottom: 60, left: 100};
        let plotWidth = canvasWidth - margin.left - margin.right;
        let plotHeight = canvasHeight - margin.top - margin.bottom;
        let zMin, zMax, dLMin, dLMax;
        let theoreticalZ = [];
        let theoreticalDL = [];
        let concordanceZ = [];
        let concordanceDL = [];

        p.setup = function() {
            let canvas = p.createCanvas(canvasWidth, canvasHeight);
            canvas.parent('plotVisualization');
            p.noLoop();

            // Determine ranges
            zMin = 0;
            zMax = Math.max(...redshiftData) * 1.1 || 1;
            dLMin = 0;
            dLMax = Math.max(...dLData) * 1.1 || 1;

            // Prepare theoretical curve data
            let numPoints = 200;
            for (let i = 0; i <= numPoints; i++) {
                let z = p.map(i, 0, numPoints, zMin, zMax);
                let dL = luminosityDistance(bestOmegaM, bestOmegaLambda, H0, z);
                let cdL = luminosityDistance(0.3, 0.7, H0, z);
                theoreticalZ.push(z);
                concordanceZ.push(z);
                theoreticalDL.push(dL);
                concordanceDL.push(cdL);
                if (dL > dLMax) dLMax = dL;
                if (cdL > dLMax) dLMax = cdL;
            }
        };

        p.draw = function() {
            p.background(255);

            // Translate to account for margins
            p.push();
            p.translate(margin.left, margin.top);            

            // Scaling functions
            let xScale = z => p.map(z, zMin, zMax, 0, plotWidth);
            let yScale = dL => p.map(dL, dLMin, dLMax, plotHeight, 0);

            // Compute tick values
            let xTickStep = 0.2;
            let xStart = Math.ceil(zMin / xTickStep) * xTickStep;
            let xTicks = [];
            for (let t = xStart; t <= zMax; t = +(t + xTickStep).toFixed(10)) {
                xTicks.push(t);
            }
            
            // Dynamic yTickStep
            let yTickStep = dLMax > 16000 ? 2000 
                : dLMax > 10000 ? 1000 
                : dLMax > 5000 ? 500 
                : dLMax > 2000 ? 200 
                : 100;
            let yStart = Math.ceil(dLMin / yTickStep) * yTickStep;
            let yTicks = [];
            for (let t = yStart; t <= dLMax; t += yTickStep) {
                yTicks.push(t);
            }

            // Draw grid lines
            p.stroke(200);
            p.strokeWeight(1);
            for (let t of xTicks) {
                let x = xScale(t);
                p.line(x, 0, x, plotHeight);
            }
            for (let t of yTicks) {
                let y = yScale(t);
                p.line(0, y, plotWidth, y);
            }

            // Draw axes
            p.stroke(0);
            p.strokeWeight(2);
            // Y-axis
            p.line(0, 0, 0, plotHeight);
            // X-axis
            p.line(0, plotHeight, plotWidth, plotHeight);

            // Draw axis ticks and labels
            let tickSize = 6;
            p.textSize(16);
            // X-axis ticks
            for (let t of xTicks) {
                let x = xScale(t);
                p.stroke(0);
                p.line(x, plotHeight, x, plotHeight + tickSize);
                p.noStroke();
                p.fill(0);
                p.textAlign(p.CENTER, p.TOP);
                p.text(t.toFixed(1), x, plotHeight + tickSize + 2);
            }
            // Y-axis ticks
            for (let t of yTicks) {
                let y = yScale(t);
                p.stroke(0);
                p.line(0, y, -tickSize, y);
                p.noStroke();
                p.fill(0);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(t.toString(), -tickSize - 2, y);
            }

            // Labels
            p.fill(0);
            p.textSize(18);
            p.textAlign(p.CENTER, p.CENTER);
            // Y-axis label
            p.push();
            p.translate(-70, plotHeight / 2);
            p.rotate(-Math.PI / 2);
            p.noStroke();
            p.text("Distancia de Luminosidad [Mly]", 0, 0);
            p.pop();
            // X-axis label
            p.noStroke();
            p.text("Redshift (z)", plotWidth / 2, plotHeight + 40);

            // Title
            p.push();
            p.textSize(18);
            p.noStroke();
            p.text("Distancia de luminosidad vs Redshift", plotWidth / 2, -30);
            p.pop();

            // Draw data points
            p.fill(255, 0, 0);
            p.noStroke();
            for (let i = 0; i < redshiftData.length; i++) {
                let x = xScale(redshiftData[i]);
                let y = yScale(dLData[i]);
                p.ellipse(x, y, 10, 10);
            }

            // Draw theoretical curve
            p.stroke(0, 0, 255);
            p.strokeWeight(3);
            p.noFill();
            p.beginShape();
            for (let i = 0; i < theoreticalZ.length; i++) {
                let x = xScale(theoreticalZ[i]);
                let y = yScale(theoreticalDL[i]);
                p.vertex(x, y);
            }
            p.endShape();
            // Draw Concordance curve
            // p.stroke(0, 200, 0);
            // p.strokeWeight(3);
            // p.noFill();
            // p.beginShape();
            // for (let i = 0; i < theoreticalZ.length; i++) {
            //     let x = xScale(concordanceZ[i]);
            //     let y = yScale(concordanceDL[i]);
            //     p.vertex(x, y);
            // }
            // p.endShape();

            // Legends
            p.push()
                p.strokeWeight(3);
                p.noStroke();
                p.fill(0);
                p.textSize(18);
                p.textAlign(p.LEFT, p.CENTER);
                p.translate(20, 20);
                p.push();
                    p.fill(255);
                    p.noStroke();
                    p.rect(-10, -20, 480, 60);
                p.pop();                
                // p.push();                    
                //     p.stroke(0, 200, 0);
                //     p.line(0, 0, 20, 0);
                //     p.translate(30, 0);
                //     p.noStroke();
                //     p.text("Modelo Estándar de la Cosmología", 0, 0);
                // p.pop();
                p.push();                    
                    p.noStroke();
                    p.fill(255, 0, 0);
                    p.ellipse(10, 0, 10, 10);
                    p.translate(30, 0);
                    p.fill(0);
                    p.noStroke();
                    p.text("Datos experimentales.", 0, 0);
                p.pop();
                p.translate(0, 20);
                p.push();                    
                    p.stroke(0, 0, 255);
                    p.line(0, 0, 20, 0);
                    p.translate(30, 0);
                    p.noStroke();
                    p.text("Mejor ajuste cosmológico a los datos experimentales.", 0, 0);
                p.pop();                
            p.pop()

            p.pop(); // Restore original state

        };
    };

    new p5(sketch);
}