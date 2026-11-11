// MAIN CONFIG

// let stars = [
//   [
//     [
//       [1, 54, 54],
//       [19, 24, 54]
//     ],
//     [
//       [1, 56, 0],
//       [20, 55, 43]
//     ],
//     [
//       [2, 8, 34],
//       [23, 34, 44]
//     ],
//     [
//       [2, 51, 27],
//       [27, 22, 42]
//     ]
//   ]
// ];


let WIDTH = 900; 
let HEIGHT = WIDTH/4*3;
let backgroundColor = 255;

let camRad = 1.5*WIDTH;
window.innerWidth < 900? camRad = 3*WIDTH : null;
let camTheta = 70*(3.1416/180);
let camPhi = 20*(3.1416/180);
let cameraPos = [Math.sin(camTheta)*Math.cos(-camPhi), Math.sin(camTheta)*Math.sin(-camPhi), Math.cos(camTheta)].map(element => element*camRad); // Debido a la inversión del eje Y
let cameraCenter = [0, 0, 0];
let cameraUpVector = [0, 0, -1]; //  Debido a la inversión del eje Y

let font_Roboto_B;
let debugText;
let time_0 = 0;
let time = time_0, timeStep;
let timeStep0 = 0.001;

let personModel;

// Variables
let radius = 500;
let eclipticAngle = 23.5;
let lat, lastLat = lat, latHorizon = 0, lastLatHorizon = latHorizon;
let omega = {
  ecliptic: 0.1,
  celestial: 365*0.1
  //celestial: 0
}
let consteData = true;

let tableData = [];
let jsonArray;

async function preload() {
  font_Roboto_B = loadFont("./fonts/Roboto-Bold.otf");
  personModel = loadModel("./models/low-polygon-person.obj");

  consteData = await loadAndParseCSV('starData.csv');

  // fetch('starData.json')
  // .then(response => response.json()) // Automatically parses the JSON data
  // .then(data => {
  //   jsonArray = data;
  //   console.log(jsonArray); // This will be a JavaScript array
  // })
  // .catch(error => console.error('Error loading JSON:', error));

}

const containerMenuPhone = document.getElementById("containerMenuPhone");
const containerMenuPC = document.getElementById("containerMenuPC");

let selectMode = document.getElementById("selectMode");
let checkboxRun = document.getElementById("checkboxRun");
let spanSpeed = document.getElementById("spanSpeed");
let rangeSpeed = document.getElementById("rangeSpeed");
let rangeLat = document.getElementById("rangeLat");
let numberLat = document.getElementById("numberLat");
let rangeLatHorizon = document.getElementById("rangeLatHorizon");

let checkboxStars = document.getElementById("checkboxStars");
let checkboxMoveHorizon = document.getElementById("checkboxMoveHorizon");
let checkboxEqsol = document.getElementById("checkboxEqsol");
let checkboxSunPath = document.getElementById("checkboxSunPath");
let checkboxSun = document.getElementById("checkboxSun");
let checkboxGrid = document.getElementById("checkboxGrid");
let checkboxEcliptic = document.getElementById("checkboxEcliptic");
let checkboxBox = document.getElementById("checkboxBox");
let buttonEqui1 = document.getElementById("buttonEqui1");

let tabContent1 = document.getElementById("tabContent1");
let tabContent2 = document.getElementById("tabContent2");
let tabContent3 = document.getElementById("tabContent3");

let tab1 = document.getElementById("Tab1");
let tab2 = document.getElementById("Tab2");
let tab3 = document.getElementById("Tab3");

if(window.innerWidth < 900){
  WIDTH = 0.9*window.innerWidth;
  HEIGHT = 0.9*window.innerWidth;
  containerMenuPhone.style.display = "flex";
  containerMenuPC.style.display = "none";
  tab1.appendChild(tabContent1);
  tab2.appendChild(tabContent2);
  tab3.appendChild(tabContent3);
}else{
  containerMenuPC.style.display = "flex";
  containerMenuPhone.style.display = "none";
}


// Initialize stars
let nStars = 150;
let starPos = [];

/***************  SETUP ****************/
function setup(){

  canvas = createCanvas(WIDTH, HEIGHT, WEBGL);
  canvas.parent("containerSketch");
  
  frameRate(60);
  timeStep = 1/getTargetFrameRate();
  camera(...cameraPos, ...cameraCenter, ...cameraUpVector);
  debugText = document.getElementById("debugText");
  

  textFont(font_Roboto_B);
  textSize(100);
  textAlign(CENTER, CENTER);

  randomSeed(2);
  // let polaris = createVector(radius*Math.sin(radians(89))*Math.cos(0), radius*Math.sin(radians(89))*Math.sin(0), radius*Math.cos(radians(89)));
  let polaris = sphericalToVector(radius, radians(1), 0);
  starPos.push(polaris);
  for(let i = 0; i < nStars; i++){
    starPos.push(p5.Vector.random3D().mult(radius));
  }

  myCelestialSphere = new CelestialSphere(radius);
  myCelestialSphere.nPoints = 45;
  
}

// DRAW
function draw(){


  
  lat = Number(numberLat.value);
  latHorizon = Number(rangeLatHorizon.value);

  let speedValue = rangeSpeed.value;
  spanSpeed.textContent = "x" + speedValue;

  setupScene3D(50);
  //drawCoordinates();

  checkboxStars.checked ? drawStars(omega.celestial, nStars, starPos, PI/2-lat*PI/180, time) : null;

  // push();
  //   stroke(100);
  //   strokeWeight(2);
  //   myCelestialSphere.draw();
  // pop();
   // Draw the celestial sphere
  
  
  if( selectMode.value == "movReal"){
    timeStep = timeStep0;    
    ambientLight(150);
    let mySunPos = calcSunPos(radius, eclipticAngle, omega, lat, time);
    if(checkboxBox.checked && checkboxSun.checked && mySunPos.z > 0){
      drawSun(radius, eclipticAngle, omega, lat, time);
      directionalLight(255, 255, 255, -mySunPos.x, mySunPos.y, -mySunPos.z);
    }else if (checkboxSun.checked){
      drawSun(radius, eclipticAngle, omega, lat, time);
      if( mySunPos.z > 0) {
        directionalLight(255, 255, 255, -mySunPos.x, mySunPos.y, -mySunPos.z);
      }
    }    
  }else if(selectMode.value == "arcoDiurno"){
    timeStep = 10*timeStep0;
    ambientLight(255);
  }

  // Draw Horizon and Person
  push();
    rotateX(latHorizon*PI/180);
    // rotateX(lat);
    drawHorizon(radius, checkboxBox.checked, lat);
    drawPersonModel(0.75, Math.PI/4);
  pop();
  
  checkboxSunPath.checked ? drawSunPath(radius, eclipticAngle, omega, lat, time) : null;

  checkboxEqsol.checked ? drawSolsEq(radius, eclipticAngle, lat) : null;

  // Draw Celestial Sphere
  if(checkboxGrid.checked){
    push();
      rotateX(PI/2-radians(lat));
      rotateZ(-omega.celestial*time);
      stroke(200);
      strokeWeight(1.5);
      // drawCelestialSphere(radius, 40);
      myCelestialSphere.draw();
    pop();    
  }
  
  checkboxEcliptic.checked ? drawEcliptic(radius, omega.celestial, lat, time) : null;

  

  //timeStep = 2*PI/omega.celestial*Number(speedValue);
  checkboxRun.checked ? time += timeStep*Number(speedValue) : null;

  
  //debugText.textContent = selectMode.value;
  
}



