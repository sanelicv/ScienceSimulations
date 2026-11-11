let earthRadius = 15;
let deferentRadiusSlider;
let epicycleRadiusSlider;
let fixedStarsRadius = 300; // Radius for the fixed stars
let deferentAngle = 0;
let epicycleAngle = 0;
let spanDeferent, spanEpicycle;
const numStars = 70;

function setup() {
  canvas = createCanvas(650, 650);
  canvas.parent("containerSketch1")
  angleMode(DEGREES);

  deferentRadiusRange = document.getElementById("deferentRadius");
  epiclycleRadiusRange = document.getElementById("epiclycleRadius");
}

function draw() {
  background(255);
  
  // Update radius values from sliders
  let deferentRadius = Number(deferentRadiusRange.value);
  let epicycleRadius = Number(epiclycleRadiusRange.value);
  
  // Draw fixed stars circunference
  noFill();
  stroke(0);
  strokeWeight(1);
  circle(width / 2, height / 2, fixedStarsRadius * 2);

  // Draw Earth
  fill(100, 100, 255, 255);
  noStroke();
  circle(width / 2, height / 2, earthRadius * 2);

  // Calculate deferent position (center of epicycle)
  let deferentX = width / 2 + cos(deferentAngle) * deferentRadius;
  let deferentY = height / 2 + sin(deferentAngle) * deferentRadius;

  // Draw Deferent
  push();
    stroke(150);
    noFill();
    ellipse(width/2, height/2, 2*deferentRadius);
  pop();

  // Draw epicycle
  push();
    noFill();
    stroke(255, 100, 100);
    strokeWeight(1);
    circle(deferentX, deferentY, epicycleRadius * 2);
    // center
    fill(0);
    noStroke();
    circle(deferentX, deferentY, 5);
  pop();
  

  // Calculate planet position
  let planetX = deferentX + cos(epicycleAngle) * epicycleRadius;
  let planetY = deferentY + sin(epicycleAngle) * epicycleRadius;

  // Draw planet
  fill(255, 100, 100);
  noStroke();
  circle(planetX, planetY, 20);

  // Draw line from Earth through the planet to the fixed stars
  stroke('#fcba03');
  line(width / 2, height / 2, planetX, planetY);
  
  // Calculate the end point on the fixed stars circumference
  let angleToPlanet = atan2(planetY - height / 2, planetX - width / 2);
  let lineEndX = width / 2 + cos(angleToPlanet) * fixedStarsRadius;
  let lineEndY = height / 2 + sin(angleToPlanet) * fixedStarsRadius;
  line(planetX, planetY, lineEndX, lineEndY);

  // Draw the ellipse representing the projected image of the planet on the fixed stars
  push();
    let distance = dist(width/2, height/2, planetX, planetY);
    let bright = (1.25-distance/fixedStarsRadius)*255;
    fill(255, 100, 100, bright);
    noStroke();
    translate(lineEndX, lineEndY);
    rotate(angleToPlanet + 90);
    ellipse(0, 0, 30, 15); // Adjust size as needed
  pop();

  // Update angles
  deferentAngle += 0.25;
  epicycleAngle += 2;
  
  // Draw stars along the circumference of the fixed stars  
  drawStarsAroundCircumference(); 

  
  
}

function drawStarsAroundCircumference() {
  push();        
    fill(0); // Color for stars
    noStroke();
    for (let i = 0; i < numStars; i++) {
      let angle = 360 / numStars * i;
      let x = width / 2 + cos(angle) * (fixedStarsRadius + 5);
      let y = height / 2 + sin(angle) * (fixedStarsRadius + 5);
      push();
        //translate(x,y);
        //rotate(angleToPlanet + 90);
        //star(0, 0, 2, 5, 5);
        star(x, y, 2, 5, 5);
      pop();      
    }
  pop();
}

function star(x, y, radius1, radius2, npoints) {
  let angle = 360 / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < 360; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}