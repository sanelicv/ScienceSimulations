let sun, planet, vel;
    const GM = 1000;
    let a = 300;
    let e;
    let dt = 0.1;         // time step
    let steps = 10;        // integration sub-steps per frame
    let eccSlider, eccLabel;

    function setup() {
      let canvas = createCanvas(1000, 650);
      canvas.parent("containerSketch");
      sun = createVector(0.65*width , height / 2);
      eccSlider = document.getElementById('eccSlider');
      eccLabel = document.getElementById('eccLabel');
      eccSlider.addEventListener('input', resetOrbit);
      resetOrbit();
    }

    function resetOrbit() {
      e = parseFloat(eccSlider.value);
      a = 300;
      // start at perihelion
      let r_p = a * (1 - e);
      planet = createVector(sun.x + r_p, sun.y);
      // circular velocity at perihelion for elliptic orbit
      let v_p = sqrt(GM * (1 + e) / (a * (1 - e)));
      vel = createVector(0, -v_p);
    }

    function draw() {
      //scale(1.5)
      background(250);

      // simulation integration (semi-implicit Euler for stability)
      for (let i = 0; i < steps; i++) {
        let rVec = p5.Vector.sub(sun, planet);
        let dist = rVec.mag();
        let forceMag = GM / (dist * dist);
        let acc = rVec.copy().setMag(forceMag);
        vel.add(p5.Vector.mult(acc, dt));
        planet.add(p5.Vector.mult(vel, dt));
      }

      // Draw orbital path
      noFill();
      stroke(0);
      strokeWeight(1);
      let b = a * sqrt(1 - e * e);
      let c = a * e;
      ellipse(sun.x - c, sun.y, 2 * a, 2 * b);

      // Draw Sun
      noStroke();
      fill(255, 204, 0);
      ellipse(sun.x, sun.y, 40);

      // Draw planet
      fill(100, 150, 255);
      ellipse(planet.x, planet.y, 20);

      // Draw force arrow
      let r = p5.Vector.sub(sun, planet);
      let d = r.mag();
      let fMag = GM / (d * d);
      let arrowScale = 2000;
      let arrowDir = r.copy().normalize();
      let arrowVec = arrowDir.mult(fMag * arrowScale);
      let arrowEnd = p5.Vector.add(planet, arrowVec);

      stroke(255, 0, 0);
      strokeWeight(4);
      line(planet.x, planet.y, arrowEnd.x, arrowEnd.y);
      push();
      translate(arrowEnd.x, arrowEnd.y);
      rotate(atan2(arrowDir.y, arrowDir.x));
      let ah = 7;
      line(0, 0, -ah, ah / 2);
      line(0, 0, -ah, -ah / 2);
      pop();

      // Update label
      eccLabel.textContent = 'Excentricidad: e = ' + e.toFixed(2);
    }

    // function windowResized() {
    //   resizeCanvas(windowWidth, windowHeight);
    // }