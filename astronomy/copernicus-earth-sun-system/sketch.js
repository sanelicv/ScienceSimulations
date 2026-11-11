// MAIN CONFIG
let WIDTH = 900; 
let HEIGHT = WIDTH/4*3;
let backgroundColor = 50;

// SETUP CAMERA
let camRad = 0.8*WIDTH;
window.innerWidth < 900? camRad = 1*WIDTH : null;
let camTheta = 70*(3.1416/180);
let camPhi = 0*(3.1416/180);
// Notar el (-camPhi) debido a scale(1, -1, 1) en setupScene3D
let cameraPos = [Math.sin(camTheta)*Math.cos(-camPhi), Math.sin(camTheta)*Math.sin(-camPhi), Math.cos(camTheta)].map(element => element*camRad); 
let cameraCenter = [0, 0, 0];
// Notar el (-1) en Z debido a scale(1, -1, 1) en setupScene3D
let cameraUpVector = [0, 0, -1];

let zodiacNames = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
let personModel;
let showEarth = true;
// SETUP MENUS
if(window.innerWidth < 900){
  WIDTH = 0.9*window.innerWidth;
  HEIGHT = 0.9*window.innerWidth;
  // containerMenuPhone.style.display = "flex";
  // containerMenuPC.style.display = "none";
  // tab1.appendChild(tabContent1);
  // tab2.appendChild(tabContent2);
  // tab3.appendChild(tabContent3);
}else{
  // containerMenuPC.style.display = "flex";
  // containerMenuPhone.style.display = "none";
}

/***************  SETUP ****************/

let sunRadius = 50;
let earthRadius = 25;
let earthOrbitRadius = 300;
let celestialSphereRadius = 50000;
let translationSpeedFactor = 0.1;
let rotationSpeedFactor = translationSpeedFactor*365.25;
let axialTilt = 23.4;
let lat = 90;
let tableData = [];
// Initialize stars
let nStars = 150;
let starPos = [];

let debugText = document.getElementById("debugText");
let font_Roboto_B;
function preload() {
  font_Roboto_B = loadFont("./fonts/Roboto-Bold.otf");
  personModel = loadModel("./models/low-polygon-person.obj");
}
let imgEarth, imgSun;
let time0 = 0.5*2*Math.PI/translationSpeedFactor
let time = time0;
let cam;

let celestialSphere = new CelestialSphere;

let checkboxRun = document.getElementById("checkboxRun");
let spanSpeed = document.getElementById("spanSpeed");
let rangeSpeed = document.getElementById("rangeSpeed");
let checkboxSun = document.getElementById("checkboxSun");
let checkboxEarthOrbit = document.getElementById("checkboxEarthOrbit");
let checkboxHorizonte = document.getElementById("checkboxHorizonte");
let checkboxSolsEq = document.getElementById("checkboxSolsEq");
let checkboxEsferaEstrellasFijas = document.getElementById("checkboxEsferaEstrellasFijas");
let checkboxEcuadorCeleste = document.getElementById("checkboxEcuadorCeleste");
let checkboxSunLine = document.getElementById("checkboxSunLine");
//let checkboxSunProjection = document.getElementById("checkboxSunProjection");
let checkboxEcliptic = document.getElementById("checkboxEcliptic");
let inputLatitude = document.getElementById("inputLatitude");
let dateText = document.getElementById("dateText");
let checkboxMoon = document.getElementById("checkboxMoon");
let checkboxMoonOrbit = document.getElementById("checkboxMoonOrbit");
let checkboxEclipticPlane = document.getElementById("checkboxEclipticPlane");
let checkboxEclipticPlaneNormal = document.getElementById("checkboxEclipticPlaneNormal");
let checkboxRotationAxis = document.getElementById("checkboxRotationAxis");
let checkboxEarthEquator = document.getElementById("checkboxEarthEquator");

let inputAxialTilt = document.getElementById("inputAxialTilt");
let obliquityRange = document.getElementById("obliquityRange");



function setup(){
  canvas = createCanvas(WIDTH, HEIGHT, WEBGL);
  canvas.parent("containerSketch");
  
  frameRate(60);
  timeStep = 0.25*1/getTargetFrameRate();
  cam = createCamera();
  camera(...cameraPos, ...cameraCenter, ...cameraUpVector);
  perspective(1, WIDTH/HEIGHT, 50, 300000);

  textFont(font_Roboto_B);
  textSize(100);
  textAlign(CENTER, CENTER);

  earthTexture = loadImage("earthmap1k.jpg");
  sunTexture = loadImage("sun-texture.jpeg");

  randomSeed(2);
  // let polaris = createVector(radius*Math.sin(radians(89))*Math.cos(0), radius*Math.sin(radians(89))*Math.sin(0), radius*Math.cos(radians(89)));
  let polaris = sphericalToVector(celestialSphereRadius, radians(1), 0);
  starPos.push(polaris);
  for(let i = 0; i < nStars; i++){
    starPos.push(p5.Vector.random3D().mult(celestialSphereRadius));
  }
}

/****************************** DRAW *******************************/
function draw(){
  setupScene3D(backgroundColor);
  let speedValue = rangeSpeed.value;
  spanSpeed.textContent = speedValue;
  axialTilt = Number(inputAxialTilt.value);
  lat = Number(inputLatitude.value);
  //drawCoordinates();

  // Draw Sun
  if(checkboxSun.checked){
    push();
      noStroke();
      texture(sunTexture);
      sphere(50);     
    pop();
    pointLight(255, 255, 255, 0, 0, 0);
    pointLight(255, 255, 255, 0, 0, 0);
    pointLight(255, 255, 255, 0, 0, 0);
    pointLight(255, 255, 255, 0, 0, 0);  
    ambientLight(100);
  }


  // Draw Earth
  push();
    translate(earthOrbitRadius*Math.cos(translationSpeedFactor*time), earthOrbitRadius*Math.sin(translationSpeedFactor*time), 0);

    if(lookAtEarth){
      cam.lookAt(earthOrbitRadius*Math.cos(-translationSpeedFactor*time), earthOrbitRadius*Math.sin(-translationSpeedFactor*time), 0);
    }       
    
    // Earth
    push();
      rotateX(-radians(axialTilt));
      // Earth's Rotation Axis
      if(checkboxRotationAxis.checked){
        push();
          // line
          strokeWeight(5);
          stroke(255);
          line(0, 0, -100, 0, 0, 100);
          // cone
          translate(0, 0, 100)
          strokeWeight(1);
          rotateX(PI/2);
          noStroke();
          fill(255);
          cone(5, 20)
        pop();
      }
      // Ecuador Terrestre
      if(checkboxEarthEquator.checked){
        push();
          noFill();
          strokeWeight(5);
          stroke("white")
          circle(0, 0, 51);
        pop();
      }
      rotateZ(rotationSpeedFactor*time);
      push();
        rotateX(lat*PI/180 - PI/2);
        if(lookFromEarth){
          showEarth = false;
          //cam.setPosition(earthOrbitRadius*Math.cos(-translationSpeedFactor*time), earthOrbitRadius*Math.sin(-translationSpeedFactor*time), 0);
          cam.lookAt(0, 0, 0);
          //cam.lookAt(0, 0, 0);
          //cam.setUp(0, 0, 1);
          //camera(...cameraPos, ...cameraCenter, ...cameraUpVector);
        }
        if(checkboxHorizonte.checked){
          fill(255);
          customCircle(0, 0, 0, earthOrbitRadius);
          drawHorizon(earthOrbitRadius, lat);
          drawPersonModel(0.5, Math.PI/4);          
          push();
            stroke('lightblue');
            strokeWeight(2);
            drawHalfCelestialSphere(earthOrbitRadius, 50, 4, 7);
          pop();
        }
      pop();

      // draw Earth
      if(!checkboxHorizonte.checked && showEarth == true){
        rotateX(-PI/2)
        scale(-1, 1, 1);
        noStroke();
        texture(earthTexture);    
        sphere(25);
      } 
    pop();

    // Moon
    push();
      let moonOrbitRadius = 100;
      let moonOrbitSpeed = rotationSpeedFactor/30;
      //let moonOrbitSpeed = 1;
      let moonPrecessionSpeed = 1;
      let moonOrbitInclination = 10/180*PI;
      rotateZ(moonPrecessionSpeed*(time-time0));
      rotateX(moonOrbitInclination);
      // Moon Orbit
      if(checkboxMoonOrbit.checked){        
        push();
          fill(0, 255, 0, 100)
          stroke(0, 255, 0);
          strokeWeight(5);
          customCircle(0, 0, 0, moonOrbitRadius);
        pop();
      }
      // Moon Sphere
      if(checkboxMoon.checked){
        push();
          noStroke();
          fill(100);
          translate(moonOrbitRadius*Math.cos(moonOrbitSpeed*(time-time0)), moonOrbitRadius*Math.sin(moonOrbitSpeed*(time-time0)), 0);
          sphere(5);
        pop();
      }
    pop(); // End Moon
    

  pop();
  
  // Draw Normal to ecliptic
  if(checkboxEclipticPlaneNormal.checked){
    push();
      translate(earthOrbitRadius*Math.cos(translationSpeedFactor*time), earthOrbitRadius*Math.sin(translationSpeedFactor*time), 0);
      stroke("yellow");
      strokeWeight(5);
      line(0, 0, -200, 0, 0, 200);
    pop();
  }
  // Draw Ecliptic Plane
  if(checkboxEclipticPlane.checked){
    push();
      stroke('yellow');
      strokeWeight(5)
      line(0, 0, 0, earthOrbitRadius*Math.cos(translationSpeedFactor*time), earthOrbitRadius*Math.sin(translationSpeedFactor*time), 0);
      noStroke();
      fill(255, 255, 255, 100);
      customCircle(0, 0, 0, earthOrbitRadius);
    pop();
  }
  



  // Draw Earth Orbit
  if(checkboxEarthOrbit.checked){
    push();
      noFill();
      //fill(255, 255, 255, 30);
      stroke(200, 200, 255, 255);
      strokeWeight(2);
      customCircle(0, 0, 0, earthOrbitRadius);
    pop();
  }

  // Draw Sols Equi Lines
  if(checkboxSolsEq.checked){
    push();
      stroke(255, 255, 255, 75);
      line(0, earthOrbitRadius, 0, 0, -earthOrbitRadius, 0);
      line(earthOrbitRadius, 0, 0, -earthOrbitRadius, 0, 0);
    pop();
    push();
      translate(0, earthOrbitRadius, 10);  
      rotateX(-PI/2);      
      fill(255);
      textSize(20);      
      text("Sols. Dic.", 0, 0);
    pop();
    push();
      translate(earthOrbitRadius, 0, 10);  
      rotateZ(-PI/2);
      rotateX(-PI/2);      
      fill(255);
      textSize(20);      
      text("Equi. Set.", 0, 0);
    pop();
    push();
      translate(-earthOrbitRadius, 0, 10);  
      rotateZ(PI/2);
      rotateX(-PI/2);      
      fill(255);
      textSize(20);      
      text("Equi. Mar.", 0, 0);
    pop();
    push();
      translate(0, -earthOrbitRadius, 10);  
      rotateZ(-PI);
      rotateX(-PI/2);      
      fill(255);
      textSize(20);      
      text("Sols. Jun.", 0, 0);
    pop();
    
  }

  // Draw Mini Ecuador Celeste
  // if(checkboxMiniEcuadorCeleste.checked){
  //   push();
  //   translate(earthOrbitRadius*Math.cos(translationSpeedFactor*time), earthOrbitRadius*Math.sin(translationSpeedFactor*time), 0);
  //   rotateX(-radians(axialTilt));
  //   fill(0, 0, 255, 100);
  //   noStroke();
  //   customCircle(0, 0, 0, 1.5*earthOrbitRadius);
  // pop();
  // }


  // Draw Sun Proyection Arrow
  if(checkboxSunLine.checked){
    push();
      let pos1 = [earthOrbitRadius*Math.cos(translationSpeedFactor*time), earthOrbitRadius*Math.sin(translationSpeedFactor*time), 0];
      let pos2 = [-celestialSphereRadius*Math.cos(translationSpeedFactor*time), -celestialSphereRadius*Math.sin(translationSpeedFactor*time), 0];
      strokeWeight(4);
      stroke(255, 255, 0)
      line(...pos1, ...pos2);
      // if(checkboxSunProjection.checked){
      if(true){
        push();
          fill('yellow');
          let rotAngle = translationSpeedFactor*time;
          rotateZ(rotAngle);
          translate(-celestialSphereRadius, 0, 0);
          rotateY(PI/2)
          customCircle(0, 0, 0, 1000);
          // translate(...pos2);
          // noLights();
          // emissiveMaterial(255, 125, 0);
          // noStroke();          
          // rotateY(PI/2);
          // //rotateX(PI/2)
          // customCircle(0, 0, 0, 10000);
          //sphere(0.05*celestialSphereRadius);
        pop();
      }

    pop();
  }


  // Draw Ecliptic
  if(checkboxEcliptic.checked){
    push();
      noFill();
      stroke(250, 100, 0);
      strokeWeight(3);
      customCircle(0, 0, 0, celestialSphereRadius);
    pop();
  }

  if(checkboxEsferaEstrellasFijas.checked){
    // Draw Celestial Sphere
    drawZodiac();
    drawStars(0, nStars, starPos, 0, time);
    push();
      rotateX(-radians(axialTilt));
      noFill();
      stroke(255, 255, 255, 100);
      strokeWeight(2);
      celestialSphere.cRadius = celestialSphereRadius;
      line(0, 0, -celestialSphereRadius, 0, 0, celestialSphereRadius);
      checkboxEcuadorCeleste.checked ? celestialSphere.equatorOn = true : celestialSphere.equatorOn = false;
      celestialSphere.draw();
    pop();
    
  }

  //dateText.textContent = "aa";
  let fecha = calcularNuevaFecha(20, 3, 2025, 10);
  dateText.textContent = calcularNuevaFecha(20, 3, 2025, (time - 0.5*2*Math.PI/translationSpeedFactor)/(2*Math.PI/translationSpeedFactor)*368);

  checkboxRun.checked ? time += timeStep*Number(speedValue) : null;
  debugText.textContent = "debutTextElement";


}





function drawZodiac(){
  // Draw Zodiac
  let zodiacRadius = 50000;
  push();
    rotateX(0)
    for (let iZodiac = 0; iZodiac < zodiacNames.length; iZodiac++) {
      push();
        fill(255);
        textSize(4000);
        rotateZ(25/180*PI + 2*PI/24 + 2*PI/12*iZodiac)
        translate(zodiacRadius, 0, 0)
        rotateZ(PI/2)
        rotateY(PI)   
        rotateX(PI/2)    
        text(zodiacNames[iZodiac], 0, 0, 0)
      pop();
      push()
        stroke(255);
        strokeWeight(5);
        rotateZ(25/180*PI + 2*PI/12*iZodiac);
        translate(zodiacRadius, 0, 0);
        line(0, 0, -2000, 0, 0, 2000)
      pop()
    }
  pop();
}

function setEqui1(){
  time = 0.5*2*Math.PI/translationSpeedFactor;
}

function setSol1(){
  time = 0.5*2*Math.PI/translationSpeedFactor + 0.25*2*Math.PI/translationSpeedFactor;
}

function setEqui2(){
  time = 0.5*2*Math.PI/translationSpeedFactor + 0.5*2*Math.PI/translationSpeedFactor;
}

function setSol2(){
  time = 0.5*2*Math.PI/translationSpeedFactor + 0.75*2*Math.PI/translationSpeedFactor;
}

function resetCamera(){
  camera(...cameraPos, ...cameraCenter, ...cameraUpVector);
}

function earthPerspective(){
  let newcameraPos = 1;
  let newcameraCenter = [earthOrbitRadius*Math.cos(-translationSpeedFactor*time), earthOrbitRadius*Math.sin(-translationSpeedFactor*time), 0];
  let newcameraUpVector = 1;
  camera(...cameraPos, ...newcameraCenter, ...cameraUpVector);
}

function drawHorizon(radius, lat= 0){
  // Horizon circle
  push();
    noFill();
    stroke("black");
    strokeWeight(2);
    customCircle(0, 0, 0, radius, 100);
  pop();
  // Coordinates
  push();
    if( lat != 90 && lat != -90){
      fill(255, 0, 0);
      textSize(radius/10);
      push();
        translate(radius, 0, 0);
        rotateZ(PI/2);
        rotateX(PI/2);
        text("O", 0, 20);
      pop();
      push();
        translate(-radius, 0, 0);
        rotateZ(PI/2);
        rotateX(PI/2);
        text("E", 0, 20);
      pop();
      push();
        translate(0, -radius, 0);
        rotateX(PI/2);      
        text("N", 0, 20);
      pop();
      push();
        translate(0, radius, 0);
        rotateZ(PI);
        rotateX(PI/2);
        text("S", 0, 20);
      pop();
      push();
        stroke(255, 0, 0);
        strokeWeight(5);
        line(radius - radius/50, 0, 0, radius + radius/50, 0, 0);
        line(-radius - radius/50, 0, 0, -radius + radius/50, 0, 0);
        line(0, radius - radius/50, 0, 0, radius + radius/50, 0);
        line(0, -radius - radius/50, 0, 0, -radius + radius/50, 0);
      pop();
    }      
  pop();
}

function drawPersonModel(personScale = 1, direction = 0){
  push();
  fill(75);
  noStroke();
  scale(personScale);
  rotateZ(direction + Math.PI/2);
  rotateX(PI/2);    
  model(personModel);
  pop();
}

function drawStars(omegaCelestial, nStars, starPos, lat, time){ 
    
  push();
    
    fill(255,255,255);
    emissiveMaterial(255,255,255);
    noStroke();

    for(let i = 0; i < nStars; i++){ 
      push();
        translate(starPos[i]);
        sphere(200);
      pop();      
    }
  pop();   
  
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

function camFromEarth(){


}