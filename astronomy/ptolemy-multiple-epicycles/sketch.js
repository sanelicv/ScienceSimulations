let deferenteRadiusSlider;
let epiciclo1RadiusSlider;
let epiciclo2RadiusSlider;
let epiciclo3RadiusSlider;

let spanVector = [];
let spanLabels = ['Deferente','Epiciclo 1','Epiciclo 2', 'Epiciclo 3'];

let spanTitle;

function setup() {
  canvas = createCanvas(850, 850);
  canvas.parent("sketch-container-1"); 

  deferent = document.getElementById("deferent");
  epicycle1 = document.getElementById("epicycle1");
  epicycle2 = document.getElementById("epicycle2");
  epicycle3 = document.getElementById("epicycle3");

}

function draw() {
  background(255);

  
  let deferenteRadius = 200;
  let epiciclo1Radius = Number(epicycle1.value);
  let epiciclo2Radius = Number(epicycle2.value);
  let epiciclo3Radius = Number(epicycle3.value);

  translate(width / 2, height / 2); // Mover el origen al centro del lienzo
  
  // Dibujar la Tierra
  push();
    fill(100,100,255);
    noStroke();
    circle(0, 0, 30);
  pop();

  // Dibujar el deferente
  noFill();
  stroke(0);
  circle(0, 0, deferenteRadius * 2);
  
  // Calcular posición en el deferente
  let deferenteAngle = frameCount * 0.01;
  let deferenteX = cos(deferenteAngle) * deferenteRadius;
  let deferenteY = sin(deferenteAngle) * deferenteRadius;

  // Posición para el primer epiciclo
  push();
  translate(deferenteX, deferenteY);
    push();
      fill(100);
      circle(0,0,5);
    pop();
  stroke(100);
  circle(0, 0, epiciclo1Radius * 2);
  let epiciclo1Angle = frameCount * 0.02;
  let epiciclo1X = cos(epiciclo1Angle) * epiciclo1Radius;
  let epiciclo1Y = sin(epiciclo1Angle) * epiciclo1Radius;

  // Posición para el segundo epiciclo
  translate(epiciclo1X, epiciclo1Y);
    push();
      fill(150);
      circle(0,0,5);
    pop();
  stroke(150);
  circle(0, 0, epiciclo2Radius * 2);
  let epiciclo2Angle = frameCount * 0.04;
  let epiciclo2X = cos(epiciclo2Angle) * epiciclo2Radius;
  let epiciclo2Y = sin(epiciclo2Angle) * epiciclo2Radius;

  // Posición para el tercer epiciclo
  translate(epiciclo2X, epiciclo2Y);
    push();
      fill(200);
      circle(0,0,5);
    pop();
  stroke(200);
  circle(0, 0, epiciclo3Radius * 2);
  let epiciclo3Angle = frameCount * 0.08;
  let epiciclo3X = cos(epiciclo3Angle) * epiciclo3Radius;
  let epiciclo3Y = sin(epiciclo3Angle) * epiciclo3Radius;

  // Dibujar el planeta
  fill('red');
  noStroke();
  circle(epiciclo3X, epiciclo3Y, 20);
  pop();
}
