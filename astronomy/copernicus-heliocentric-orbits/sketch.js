let orbits = [];
const numPlanets = 6; // Number of planets
let orbitSizes = [];
const speeds = [0.04, 0.015, 0.01, 0.005, 0.002, 0.0005]; // Speeds for planets
const moonSpeed = 0.1; // Speed for the moon
const colors = ['#525252','#FF8E68','#2bc0ff','#ff7373','#ffd373','#ff7c2b']; 
const names = ['Mercurio','Venus','Tierra','Marte','Júpiter','Saturno'];
let showNamesCheckbox; // Checkbox to toggle planet names

function setup() {
  canvas = createCanvas(800, 800);
  canvas.parent("sketch-container-1");
  for (let i = 0; i < numPlanets; i++) {
    orbitSizes.push(60 + 60 * i);
  }
  // Initialize orbits for planets
  for (let i = 0; i < orbitSizes.length; i++) {
    if(names[i] === "Tierra") { // Check if the planet is Earth to add the Moon
      let moon = new Satellite(20, moonSpeed, '#787878'); // Create the Moon for Earth
      orbits.push(new Orbit(orbitSizes[i], speeds[i], colors[i], names[i], moon)); // Add Earth with the Moon
    } else {
      orbits.push(new Orbit(orbitSizes[i], speeds[i], colors[i], names[i]));
    }
  }
  

  
}

function draw() {
  background(255);
  translate(width / 2, height / 2); // Move the origin to the center of the canvas

  //Draw sun
  push();
    fill(255,255,0);
    circle(0,0,40);
  pop();

  // Draw orbits and planets
  orbits.forEach((orbit) => {
    orbit.update();
    orbit.display();
    if (orbit.mouseOverPlanet() || true) {
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
  constructor(radius, speed, colour, name, satellite=null) {
    this.radius = radius;
    this.angle = random(TWO_PI);
    this.speed = speed;
    this.colour = colour;
    this.name = name;
    this.planetX = 0;
    this.planetY = 0;
    this.satellite = satellite; // Optional satellite (e.g., the Moon for Earth)
  }

  update() {
    this.angle += this.speed;
    this.planetX = this.radius * cos(this.angle);
    this.planetY = this.radius * sin(this.angle);
    if (this.satellite) {
      this.satellite.update(this.planetX, this.planetY);
    }
  }

  display() {
    push();
      stroke(125);
      noFill();
      ellipse(0, 0, this.radius * 2, this.radius * 2); // Draw orbit
      fill(this.colour);
      stroke(0);
      ellipse(this.planetX, this.planetY, 20, 20); // Draw planet
      if (this.satellite) {
        this.satellite.displayOrbit(this.planetX, this.planetY); // Draw the Moon's orbit
        this.satellite.display(); // Then draw the Moon itself
      }
    pop();    
  }

  mouseOverPlanet() {
    let d = dist(mouseX - width / 2, mouseY - height / 2, this.planetX, this.planetY);
    return d < 10;
  }
}

class Satellite {
  constructor(radius, speed, colour) {
    this.radius = radius;
    this.angle = 0;
    this.speed = speed;
    this.colour = colour;
    this.x = 0;
    this.y = 0;
  }

  update(planetX, planetY) {
    this.angle += this.speed;
    this.x = planetX + this.radius * cos(this.angle);
    this.y = planetY + this.radius * sin(this.angle);
  }

  display() {
    push();
      fill(this.colour);
      noStroke();
      ellipse(this.x, this.y, 10, 10); // Draw satellite (e.g., the Moon)
    pop();
  }

  displayOrbit(planetX, planetY) {
    push();
      stroke(125);
      noFill();
      ellipse(planetX, planetY, this.radius * 2, this.radius * 2); // Draw orbit of the Moon
    pop();
  }
}
