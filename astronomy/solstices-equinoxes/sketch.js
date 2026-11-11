// MAIN CONFIG

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
let lat;
let omega = {
  ecliptic: 0.15,
  celestial: 365.25*0.15
}
let isRunning = true;


function preload() {
  font_Roboto_B = loadFont("./fonts/Roboto-Bold.otf");
  personModel = loadModel("./models/low-polygon-person.obj");
}

const containerMenuPhone = document.getElementById("containerMenuPhone");
const containerMenuPC = document.getElementById("containerMenuPC");

let selectMode = document.getElementById("selectMode");
let checkboxRun = document.getElementById("checkboxRun");
let spanSpeed = document.getElementById("spanSpeed");
let rangeSpeed = document.getElementById("rangeSpeed");
let rangeLat = document.getElementById("rangeLat");
let numberLat = document.getElementById("numberLat");
let checkboxEqsol = document.getElementById("checkboxEqsol");
let checkboxSunPath = document.getElementById("checkboxSunPath");
let checkboxSun = document.getElementById("checkboxSun");
let checkboxGrid = document.getElementById("checkboxGrid");
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

  
  
  
}

// DRAW
function draw(){

  

  lat = Number(numberLat.value);
  let speedValue = rangeSpeed.value;
  spanSpeed.textContent = "x" + speedValue;

  setupScene3D(255);
  //drawCoordinates();
  
  
  if( selectMode.value == "movReal"){
    timeStep = timeStep0;    
    ambientLight(150);
    let mySunPos = calcSunPos(radius, eclipticAngle, omega, lat, time);
    if( mySunPos.z > 0) {
      drawSun(radius, eclipticAngle, omega, lat, time);
      directionalLight(255, 255, 255, -mySunPos.x, mySunPos.y, -mySunPos.z);
    }
  }else if(selectMode.value == "arcoDiurno"){
    timeStep = 10*timeStep0;
    ambientLight(255);
  }
  drawHorizon(radius, checkboxBox.checked, lat);
  

  checkboxSunPath.checked ? drawSunPath(radius, eclipticAngle, omega, lat, time) : null;

  checkboxEqsol.checked ? drawSolsEq(radius, eclipticAngle, lat) : null;

  checkboxGrid.checked ? drawCelestialSphere(radius) : null;
  
  drawPersonModel(0.75, Math.PI/4);

  checkboxRun.checked ? time += timeStep*Number(speedValue) : null;

  //debugText.textContent = selectMode.value;
  
}



