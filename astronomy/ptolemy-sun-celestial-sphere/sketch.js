let step = 0.01;
const Pi = 3.1416;
let starPos = [], dayTime, minTime, imgEarth, imgSun, myFont;
let checkboxRun, checkboxSun, checkboxSunPath, checkboxEcliptic, checkboxEarth, checkDays, checkboxSunLight, checkboxEquator, checkboxAmbient;
let checkboxSphere, checkboxStars;
let checkboxOmegaC;
let dateText;
const ambientColor = 200;
let WIDTH = 900;
let HEIGHT = WIDTH / 4 * 3;

let buttonOmegaC_P, buttonOmegaC_M;
let buttonOmegaE_P, buttonOmegaE_M, buttonOmegaE_R;
let buttonSpeedUp, buttonSpeedDown;
let b_SolD, b_EquiM, b_SolJ, b_EquiS;
let spanE, spanE_Val, spanC, spanC_Val, spanDays, spanDays_Val, spanAux;
let spanSection2;
let checkboxHorizon;
let debug1 = 0;

let numberLat;
let a;

let sld_AmbientLight;
let span_Lat, rangeLat;

let tiltAngle = 23.4 / 180 * Pi;
let nStars = 150;
const radius = {
  cel: 800,
  sunCel: 600,
  earth: 100,
  sun: 50,
  star: 2
};
const omega = {
  celestial: 1,
  ecliptic: 1 / 365
};
let time_ini = 0.25 * (2 * Pi / omega.ecliptic) - 0.5 * (2 * Pi / omega.celestial);
let time = time_ini;

let latitude = 0;

let nDays = 0;

let speedValue = 1;

let rangeSpeed = document.getElementById("rangeSpeed");
let spanSpeed = document.getElementById("spanSpeed");
let rangeEcliptic = document.getElementById("rangeEcliptic");
let spanEcliptic = document.getElementById("spanEcliptic");

////////////////////////////////////////////////////////////////
////////////////////////// PRELOAD /////////////////////////////


function preload() {
  myFont = loadFont("Roboto-Bold.ttf");
  personModel = loadModel("./models/low-polygon-person.obj");
}



////////////////////////////////////////////////////////////////
////////////////////////// SETUP ///////////////////////////////

function setup() {
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.parent('containerSketch');
  frameRate(60);
  camera(2000, -2000, 0, 0, 0, 0, 0, 0, -1) //Fix WebGL Coordinate System 1/3
  imgEarth = loadImage("earthmap1k.jpg");
  imgSun = loadImage("2k_sun.jpg");

  checkboxRun = document.getElementById("checkboxRun");

  // buttonSpeedUp = document.getElementById("buttonSpeedUp");
  // buttonSpeedUp = document.getElementById("buttonSpeedDown");

  checkboxSphere = document.getElementById("checkboxSphere");
  checkboxStars = document.getElementById("checkboxStars");
  checkboxOmegaC = document.getElementById("checkboxOmegaC");

  checkboxEarth = document.getElementById("checkboxEarth");

  checkboxSun = document.getElementById("checkboxSun");
  checkboxSunPath = document.getElementById("checkboxSunPath");
  checkboxEcliptic = document.getElementById("checkboxEcliptic");

  checkboxSunLight = document.getElementById("checkboxSunLight");

  checkboxAmbient = document.getElementById("checkboxAmbient");

  sld_AmbientLight = document.getElementById("sld_AmbientLight");

  checkboxEquator = document.getElementById("checkboxEquator");

  let fechaText = document.getElementById("fechaText");

  textFont(myFont);
  textAlign(CENTER, CENTER);

  // Initialize stars
  for (let i = 0; i < nStars; i++) {
    starPos.push(p5.Vector.random3D().mult(radius.cel));
  }

  checkboxHorizon = document.getElementById("checkboxHorizon");

  rangeLat = document.getElementById("rangeLat");
  numberLat = document.getElementById("numberLat");

  dateText = document.getElementById("dateText");

}

////////////////////////////////////////////////////////////////
////////////////////////// DRAW ////////////////////////////////


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function draw() {

  let ambL = Number(sld_AmbientLight.value);
  ambientLight(ambL);

  let speedValue = rangeSpeed.value;
  spanSpeed.textContent = "x" + speedValue;

  tiltAngle = Number(rangeEcliptic.value) / 180 * PI;
  spanEcliptic.textContent = rangeEcliptic.value + "°";

  setupScene();
  if (checkboxSphere.checked) {
    drawCelestialSphere(radius.cel, omega.celestial, nStars, starPos);
  }
  if (checkboxStars.checked) {
    drawStars(omega.celestial, nStars, starPos);
  }

  if (!checkboxOmegaC.checked) {
    omega.celestial = 1;
  } else {
    omega.celestial = 0;
  }
  checkboxOmegaC.addEventListener("change", toggle_omegaC);

  //drawCoordinates(radius.cel);


  if (checkboxAmbient.checked) {
    ambientLight(200, 200, 200);
  }

  if (checkboxSun.checked) {
    drawSunAndLight(radius.cel, tiltAngle, omega, time, imgSun, radius.sun);
  }
  if (checkboxSunPath.checked) {
    drawSunTrayectory(radius.cel, tiltAngle, omega, time);
  }
  if (checkboxEcliptic.checked) {
    drawEcliptic(radius.cel, tiltAngle, omega, time);
  }

  if (checkboxEarth.checked) {
    drawEarthSphere(imgEarth, radius.earth);
  }



  if (checkboxRun.checked) {
    time += step * Number(speedValue);
  }

  if (checkboxHorizon.checked) {
    drawHorizon();
  } else {
  }

  if (checkboxEquator.checked) {
    drawEcuadorCeleste();
  }

  drawNorthSouthText(radius.cel);

  fechaText.textContent = "Fecha: " + dateString(omega.celestial, omega.ecliptic, time);
  dateText.textContent = dateString(omega.celestial, omega.ecliptic, time);

}



///////////////////////////////////////////////////////////////////////////
////////////////////////// EXTRA FUNCTIONS ////////////////////////////////

function setupScene() {
  // Setup
  background(50);
  orbitControl(1, 1, 1, { freeRotation: true });
  smooth();
  scale(-1, 1, 1); // Fix WebGL Coordinate System 2/3
  rotateZ(PI / 2); // Fix WebGL Coordinate System 3/3
  ambientLight(10, 10, 10);
}

function drawNorthSouthText(cRadius) {
  push();
  fill(255, 255, 255, 255);
  textSize(150);
  //rotateX(-PI/2);
  rotateY(PI);
  push();
  translate(0, 0, -cRadius - 10);
  text("N", 0, 0);
  pop();
  push();
  translate(0, 0, cRadius + 10);
  text("S", 0, 0);
  pop();
  pop();
}

function drawText(textContent, fontSize, posX, posY, posZ) {
  push();
  fill(255, 255, 255, 255);
  textSize(fontSize);
  rotateX(-PI / 2);
  rotateY(PI);
  translate(-posX, -posZ, -posY);
  text(textContent, 0, 0);
  pop();
}

function sunCoordinates(cRadius, tiltAngle, omega, time) {
  let phase = 0;
  let pos1 = [[cos(omega.ecliptic * time + phase)], [sin(omega.ecliptic * time + phase)], [0]];
  let rotation1 = [[cos(tiltAngle), 0, sin(tiltAngle)], [0, 1, 0], [-sin(tiltAngle), 0, cos(tiltAngle)]];
  let rotation2 = [[cos(omega.celestial * time), sin(omega.celestial * time), 0], [-sin(omega.celestial * time), cos(omega.celestial * time), 0], [0, 0, 1]];
  let sunPosVec = matrixMultiply(rotation2, matrixMultiply(rotation1, pos1));
  let sunPosAux = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    sunPosAux[i] = cRadius * sunPosVec[i][0];
  }
  return sunPosAux;
}

function drawSunAndLight(cRadius, tiltAngle, omega, time, imgSun, sunRadius) {
  let sunPos = sunCoordinates(cRadius, tiltAngle, omega, time);
  // Sun Light [FIXED FOR SCALE AND ROTATE]
  let lightCoord = fixCoord(sunPos);
  if (checkboxSunLight.checked) {
    directionalLight(255, 255, 255, -lightCoord[0], -lightCoord[1], -lightCoord[2]);
    directionalLight(255, 255, 255, -lightCoord[0], -lightCoord[1], -lightCoord[2]);
    directionalLight(255, 255, 255, -lightCoord[0], -lightCoord[1], -lightCoord[2]);
  }
  push();
  translate(sunPos[0], sunPos[1], sunPos[2]); // Move the sphere to (150, 100, 50);    
  noLights();
  //emissiveMaterial(100, 100, 0); // Orange color emission
  noStroke();
  texture(imgSun);
  sphere(sunRadius);
  pop();
}

function drawSunTrayectory(cRadius, tiltAngle, omega, time) {
  push();
  stroke(255, 255, 0);
  noFill();
  strokeWeight(5);
  let celPeriod = 2 * PI / omega.celestial;
  let eclPeriod = 2 * PI / omega.ecliptic;
  let tStep;
  if (omega.celestial != 0) {
    tStep = 0.1 / omega.celestial;
    tLimit = time - 2 * celPeriod;
    beginShape()
    for (let tAux = time; tAux > tLimit; tAux -= tStep) {
      //if (tAux - time_ini < 0) break;
      let sunPos = sunCoordinates(cRadius, tiltAngle, omega, tAux)
      vertex(sunPos[0], sunPos[1], sunPos[2]);
    }
    endShape();
  } else {
    let sunPos = sunCoordinates(cRadius, tiltAngle, omega, time);
    let sunZ = sunPos[2];
    let sunCircleR = sqrt(pow(radius.cel, 2) - pow(sunZ, 2));
    translate(0, 0, sunZ);
    customCircle(sunCircleR, 50);
    /*tStep = eclPeriod/500, tLimit = time - time_ini - eclPeriod;      
    beginShape()
    for (let tAux = time; tAux > tLimit ; tAux-=tStep){
      //if (tAux - time_ini < 0) break;        
      vertex(sunPos[0], sunPos[1], sunPos[2]);
    }
    endShape();*/
  }

  pop();
}

function drawEarthSphere(imgEarth, radius) {
  push();
  rotateX(-PI / 2);
  scale(-1, 1, 1);
  noStroke();
  emissiveMaterial(10, 10, 10); // Orange color emission
  texture(imgEarth);
  sphere(radius);
  pop();
}

function drawCelestialSphere(cRadius, omegaCelestial, nStars, starPos) {
  push();
  noFill();
  stroke(200, 200, 255, 75);
  strokeWeight(4);
  rotateZ(-omegaCelestial * time);
  drawMeridians(0, 0, cRadius, 50, 4);
  drawParallels(0, 0, cRadius, 50, 7);
  pop();
}

function drawStars(omegaCelestial, nStars, starPos) {

  push();
  rotateZ(-omegaCelestial * time);
  fill(255, 255, 255);
  emissiveMaterial(255, 255, 255);
  noStroke();

  for (let i = 0; i < nStars; i++) {
    push();
    translate(starPos[i]);
    sphere(2);
    pop();
  }
  pop();

}

function dateString(omegaCelestial, omegaEcliptic, time) {
  let deltaTime = time - time_ini;
  let nuevaFecha;
  if (omegaCelestial != 0) {
    dayTime = (2 * Pi / omegaCelestial) * 1.0027855;
    // if (dayTime > step){
    //   if( deltaTime % dayTime < step && deltaTime != 0){
    //     nDays = floor(deltaTime/dayTime);        
    //   }
    // } else{
    //   nDays = floor(deltaTime/dayTime);
    // }
    nDays = floor(deltaTime / dayTime);
    nuevaFecha = calcularNuevaFecha(20, 3, 2023, nDays);
  } else {
    dayTime = (2 * Pi / omegaEcliptic) / 365 / 1.0027855;
    nDays = round(deltaTime / dayTime);
    nuevaFecha = calcularNuevaFecha(20, 3, 2023, nDays);
  }
  return nuevaFecha;
}
function updateDays(omegaCelestial, omegaEcliptic, time) {
  let deltaTime = time - time_ini;
  if (omegaCelestial != 0) {
    dayTime = (2 * Pi / omegaCelestial) * 1.0027855;
    nDays = floor(deltaTime / dayTime);
    let nuevaFecha = calcularNuevaFecha(20, 3, 2023, nDays);
    fechaText.textContent = "Fecha: " + nuevaFecha;
  } else {
    dayTime = (2 * Pi / omegaEcliptic) / 365 / 1.0027855;
    nDays = round(deltaTime / dayTime);
    let nuevaFecha = calcularNuevaFecha(20, 3, 2023, nDays);
    fechaText.textContent = "Fecha: " + nuevaFecha;
  }
}


function buttonOmegaC_P_f() {
  omega.celestial += 0.5;
  time = time_ini;
  nDays = 0;
  //changeSpanText(spanC_Val, omega.celestial);
}
function buttonOmegaC_M_f() {
  if (omega.celestial > 0) {
    omega.celestial -= 1;
  }
  else {
    omega.celestial = 1;
  }
  time = time_ini;
  nDays = 0;
  //changeSpanText(spanC_Val, omega.celestial);
}
function buttonOmegaE_P_f() {
  omega.ecliptic += 0.1;
  time = time_ini;
  nDays = 0;
  //changeSpanText(spanE_Val, round(omega.ecliptic, 1));
}
function buttonOmegaE_M_f() {
  if (omega.ecliptic > 0) { omega.ecliptic -= 0.1; }
  else { omega.ecliptic = 0; }
  time = time_ini;
  nDays = 0;
  //changeSpanText(spanE_Val, round(omega.ecliptic, 1));
}
function buttonOmegaE_R_f() {
  omega.celestial = 1;
  omega.ecliptic = (omega.celestial) / 365;
  time = time_ini;
  nDays = 0;
  step = 0.01;
  checkboxEarth.checked = true;
  checkboxStars.checked = true;
  checkboxSphere.checked = false;
  checkboxEquator.checked = false;
  checkboxSun.checked = true;
  checkboxSunLight.checked = true;
  checkboxSunPath.checked = false;
  checkboxEcliptic.checked = false;
  checkboxOmegaC.checked = false;
  checkboxAmbient.checked = false;
  checkboxHorizon.checked = false;
  numberLat.value = 0;
  rangeLat.value = 0;
}

function buttonSpeedUp_f() {
  step += 0.01;
}

function buttonSpeedDown_f() {
  if (step >= 0.01) {
    step -= 0.01;
  }
  else {
    step = 0.01;
  }

}

function changeSpanText(mySpan, newText) {
  mySpan.html(newText);
}

function calcularNuevaFecha(dia, mes, año, diasTranscurridos) {
  // Crear una fecha con los inputs proporcionados
  let fecha = new Date(año, mes - 1, dia);

  // Agregar los días transcurridos a la fecha
  fecha.setDate(fecha.getDate() + diasTranscurridos);

  // Extraer la nueva fecha
  let diaResultante = fecha.getDate();
  let mesResultante = mesNombre(fecha.getMonth()); // getMonth() devuelve un índice basado en cero, así que se suma 1
  let añoResultante = fecha.getFullYear();

  // Devolver la nueva fecha en formato dd/mm/aaaa
  return `${diaResultante} ${mesResultante}`;
}

function EquiM_f() {
  if (omega.celestial != 0) {
    dayTime = (2 * Pi / omega.celestial) * 1.0027855 * 24 * 60;
    time = time_ini + 0 * dayTime / 24 / 60;
  } else {
    dayTime = (2 * Pi / omega.ecliptic) / 365;
    time = time_ini + 0 * dayTime;
  }
  updateDays(omega.celestial, omega.ecliptic, time);
}
function SolJ_f() {
  if (omega.celestial != 0) {
    dayTime = (2 * Pi / omega.celestial) * 1.0027855 * 24 * 60;
    time = time_ini + 92.5 * dayTime / 24 / 60;
  } else {
    dayTime = (2 * Pi / omega.ecliptic) / 365;
    time = time_ini + 1 * 92.0 * dayTime;
  }
  updateDays(omega.celestial, omega.ecliptic, time);
}
function EquiS_f() {
  if (omega.celestial != 0) {
    dayTime = (2 * Pi / omega.celestial) * 1.0027855 * 24 * 60;
    time = time_ini + 2 * 92.5 * dayTime / 24 / 60;
  } else {
    dayTime = (2 * Pi / omega.ecliptic) / 365;
    time = time_ini + 2 * 92. * dayTime;
  }
  updateDays(omega.celestial, omega.ecliptic, time);
}
function SolD_f() {
  if (omega.celestial != 0) {
    dayTime = (2 * Pi / omega.celestial) * 1.0027855 * 24 * 60;
    time = time_ini + 3 * 92.5 * dayTime / 24 / 60;
  } else {
    dayTime = (2 * Pi / omega.ecliptic) / 365;
    time = time_ini + 3 * 92. * dayTime;
  }
  updateDays(omega.celestial, omega.ecliptic, time);
}

function toggle_omegaC() {
  if (!checkboxOmegaC.checked) {
    time = time_ini;
    step = 0.01;
  } else {
    time = time_ini;
    step = 1;
  }
  //console.log(variable); 
}

function drawEcuadorCeleste() {
  push();
  fill(0, 0, 200, 75);
  rotateX(0);
  polygon(0, 0, radius.cel, 51, 0);
  pop();
}

function drawHorizon() {
  //ambientLight(255,255,255);
  //ambientLight(100,100,100);
  push();
  //fill(0,150,0,255);    
  //latitude = -45;
  latitude = Number(rangeLat.value);
  rotateY((90 + latitude) / 180 * Pi);
  // circuferencia horizonte
  push();
  stroke(0, 150, 0);
  noFill();
  strokeWeight(10);
  polygon(0, 0, radius.cel, 51, 1);
  pop();
  // Línea Zenith
  push();
  stroke(100, 100, 255);
  strokeWeight(3);
  noFill();
  line(0, 0, 0, 0, 0, -radius.cel + 50);
  drawText('C', 100, 0, 0, -radius.cel)
  pop();
  // Plano Horizonte
  push();
  translate(0, 0, 0.5 * radius.cel);
  fill(220);
  //noStroke();
  box(2.5 * radius.cel, 2.5 * radius.cel, radius.cel);
  pop();
  // Persona
  drawPersonModel(2, Math.PI / 4);
  // Puntos Cardinales
  if (Number(rangeLat.value) != 90 && rangeLat != -90) {
    push();
    fill(255, 0, 0);
    textSize(100);
    push();
    translate(radius.cel, 0, -50);
    rotateText();
    rotateY(-Pi / 2);
    text('S', 0, 0);
    pop();
    push();
    translate(-radius.cel, 0, -50);
    rotateText();
    rotateY(Pi / 2);
    text('N', 0, 0);
    pop();
    push();
    rotateZ(Pi / 2);
    translate(radius.cel, 0, -50);
    rotateText();
    rotateY(3 * Pi / 2);
    text('O', 0, 0);
    pop();
    push();
    rotateZ(-Pi / 2);
    translate(radius.cel, 0, -50);
    rotateText();
    rotateY(-3 * Pi / 2);
    text('E', 0, 0);
    pop();
    pop();
  }
  pop();


}

function eclipticPoints(cRadius, tiltAngle, omega, time) {
  let phase = 0;
  let pos1 = [[cos(omega.ecliptic * time + phase)], [sin(omega.ecliptic * time + phase)], [0]];
  let rotation1 = [[cos(tiltAngle), 0, sin(tiltAngle)], [0, 1, 0], [-sin(tiltAngle), 0, cos(tiltAngle)]];
  //let rotation2 = [[cos(omega.celestial*time), sin(omega.celestial*time), 0],[-sin(omega.celestial*time), cos(omega.celestial*time), 0],[0, 0, 1]];
  let sunPosVec = matrixMultiply(rotation1, pos1);
  let sunPosAux = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    sunPosAux[i] = cRadius * sunPosVec[i][0];
  }
  console.log(sunPosAux[0]);
  return sunPosAux;
}
function drawEcliptic(cRadius, tiltAngle, omega, time) {
  push();
  rotateZ(-omega.celestial * time);
  stroke('#ffae00');
  noFill();
  strokeWeight(5);
  //let celPeriod = 2*PI/omega.celestial;
  let eclPeriod = 2 * PI / omega.ecliptic;
  let tStep = eclPeriod / 50, tLimit = eclPeriod;
  /*if (omega.celestial != 0){
    tStep = 0.1/omega.celestial;
    tLimit = time - 2*celPeriod;
  }*/
  beginShape()
  for (let tAux = 0; tAux <= tLimit; tAux += tStep) {
    //if (tAux - time_ini < 0) break;
    let sunPos = eclipticPoints(cRadius, tiltAngle, omega, tAux)
    vertex(sunPos[0], sunPos[1], sunPos[2]);
    //console.log(String(tAux) + ' ' + (sunPos))
  }
  endShape();
  pop();
}

function customCircle(rad, nPoints) {
  let stepAux = 2 * Pi / nPoints;
  beginShape();
  for (let i = 0; i <= nPoints; i += 1) {
    let x = rad * cos(i * stepAux);
    let y = rad * sin(i * stepAux);
    vertex(x, y);
  }
  endShape();
}

function rotateText() {
  rotateX(-PI / 2);
  rotateY(PI);
}

function update_LatSliderFromInput() {
  let inputValue = numberLat.value;
  // Check if the input value is a number and within the slider's range
  if (!isNaN(inputValue) && inputValue >= -90 && inputValue <= 90) {
    rangeLat.value = inputValue; // Update the slider value
  }
}

function update_numberLatFromSlider() {
  numberLat.value(rangeLat.value()); // Update the input field with the slider's current value
}

function drawPersonModel(personScale = 6, direction = PI / 2) {
  push();
  fill(100);
  noStroke();
  scale(2);
  rotateZ(direction + Math.PI / 2);
  rotateX(-PI / 2);
  model(personModel);
  pop();
}