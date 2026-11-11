let WIDTH = 900; 
let HEIGHT = 900;


let orbits = [];
let orbitStep;
const numPlanets = 7;
let orbitSizes = [];
const speeds = [0.03, 0.02, 0.01, 0.005, 0.0025, 0.001, 0.0005];
const colors = ['#CECECE','#525252','#FF8E68','#ffff00','#ff7373','#ffd373','#ff7c2b']; 
const names = ['Luna','Mercurio','Venus','Sol','Marte','Júpiter','Saturno'];
let showNamesCheckbox; // Checkbox to toggle planet names

let checkboxNames = document.getElementById("checkboxNames");

if(window.innerWidth < 900){
  WIDTH = 0.9*window.innerWidth;
  HEIGHT = 0.9*window.innerWidth;
}

function setup() {
  canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent("containerSketch");
  orbitStep = WIDTH/15;
  for (let i = 0; i < numPlanets; i++) {
    orbitSizes.push(orbitStep + orbitStep * i);
  }
  for (let i = 0; i < orbitSizes.length; i++) {
    orbits.push(new Orbit(orbitSizes[i], speeds[i], colors[i], names[i]));
  }
}

function draw() {
  background(255);
  translate(width / 2, height / 2); // Move the origin to the center of the canvas

  // Draw Earth
  fill('#2bc0ff'); // Blue color for Earth
  ellipse(0, 0, orbitStep, orbitStep); // Earth at the center

  // Draw orbits and planets
  orbits.forEach((orbit) => {
    orbit.update();
    orbit.display();
    if (orbit.mouseOverPlanet() || checkboxNames.checked) {
      push();
        fill(0); // White color for text
        noStroke();
        textSize(20);
        textAlign(CENTER);
        text(orbit.name, orbit.planetX, orbit.planetY - 20); // Display the name above the planet
      pop();      
    }
  });
}

class Orbit {
  constructor(radius, speed, colour, name) {
    this.radius = radius;
    this.angle = random(TWO_PI);
    this.speed = speed;
    this.colour = colour;
    this.name = name;
    this.planetX = 0; // X position of the planet
    this.planetY = 0; // Y position of the planet
  }

  update() {
    this.angle += this.speed; // Update the planet's position
    this.planetX = this.radius * cos(this.angle); // Calculate current x position
    this.planetY = this.radius * sin(this.angle); // Calculate current y position
  }

  display() {
    push();
      stroke(125); // color for orbits
      noFill();
      ellipse(0, 0, this.radius * 2, this.radius * 2); // Draw orbit
      fill(this.colour); // Planet color
      stroke(0); // color for planets
      ellipse(this.planetX, this.planetY, 20, 20); // Draw planet at updated position
    pop();    
  }

  mouseOverPlanet() {
    let d = dist(mouseX - width / 2, mouseY - height / 2, this.planetX, this.planetY);
    return d < 10; // Assuming the planet radius is 10
  }
}
