let time = 0;

let baseWidth = 800;
let baseHeight = baseWidth/4*3;

let width = 800;
let height = width/4*3;

let orbitsX0 = 300;
let orbitsY0 = 100;
let orbitsWidth = 200;
let orbitsHeight = 400;
let energyNames = ["-13.6", "-3.4", "-1.51", "-0.85", "-0.54", "-0.38"];
let photonEnergyNames = ["+1.89 eV", "+2.55 eV", "+2.86 eV", "+3.02 eV"];
let energiesLevels = [0, 6, 10, 13, 15, 16]; // Alturas relativas de las líneas
let yEnergyLevels = [];

let aniRunning = false;

let photonButton;
let photonTime = 0;
let photonBool = false;
let photonBool2 = false;
let photonTheta2;
let photonThetaBool = false;
let photonColor;
let photonWavelength;
let sliderWavelength;


let quantumWavelengths = [410, 434, 486, 656];
let electronBool = false;
let electront0;
let quantumLevel = 2;

let energyTime = 0;

function setup() {

  canvas = createCanvas(width, height);
  canvas.parent('sketch'); 
  frameRate = 60;
  step = 1/frameRate;

  calcYEnergyLevels();

  //photonButton = createButton("asdasd");
  photonButton = select('#myButton');
  photonButton.mousePressed(launchPhoton);

  sliderWavelength = document.getElementById("mySlider");
  photonWavelength = sliderWavelength.value;
  photonColor = wavelengthToColor(sliderWavelength.value);

    
}
  
function draw() {
  background(245);
  // Fix coordinates and scale
  translate(0, height);
  scale(width/baseWidth, -height/baseHeight);

  drawTime();
  drawEnergyLevels();
  drawPhoton();

 
  if(electronBool == false){
    push();
      fill("#94ffb0");
      circle(orbitsX0 + orbitsWidth/2 + 2*random(), yEnergyLevels[1] + 2*random(), 30);
    pop();    
  }
  




  time += step;

  if(electronBool == true){
    updateQuantumLevel();
    let electronTime = time - electront0;
    push();
      fill("#94ffb0");
      circle(orbitsX0 + orbitsWidth/2 + 5*random(), yEnergyLevels[quantumLevel] + 5*random(), 30);
    pop();
    
    energyTime = 0;
    drawEnergy();
    if(electronTime > 4.0){
      photonThetaBool = true;
      photonBool2 = true;
      electronBool = false;
    }    
  }
  drawPhoton2();









}
  


function drawText(content, posX, posY){
  push();
    scale(1, -1);
    translate(0, -2*posY);
    text(content, posX, posY);
  pop();
}

function drawTime(){
  drawText(round(time,1), width-30, 0);
}


// Calculas las posiciones de las órbitas.
function calcYEnergyLevels(){
  let maxDeltaEnergies = energiesLevels[energiesLevels.length - 1] - energiesLevels[0];
  let deltaEnergies = []; 
  for (let i = 0; i < energiesLevels.length - 1; i++){
    deltaEnergies.push((energiesLevels[i+1] - energiesLevels[0])/maxDeltaEnergies*orbitsHeight);
  }
  yEnergyLevels.push(orbitsY0);
  for (let i = 0; i < energiesLevels.length - 1; i++) {
    yEnergyLevels.push(orbitsY0 + deltaEnergies[i]);
  }
}

// Graficar las líneas de niveles junto a los valores de energías
function drawEnergyLevels(){
  for (let i = 0; i < yEnergyLevels.length; i++){
    push();
      textSize(14);
      line(orbitsX0, yEnergyLevels[i], orbitsX0 + orbitsWidth,  yEnergyLevels[i]);
      drawText(energyNames[i], orbitsX0 + orbitsWidth + 10,  yEnergyLevels[i]-4.5);
      drawText(i+1, orbitsX0 - 15,  yEnergyLevels[i]-4.5);
    pop();
  }
  push();
    textStyle(BOLD);
    textSize(14);
    drawText("E [eV]", orbitsX0 + orbitsWidth + 10,  yEnergyLevels[5] + 30);
  pop();  

}



function drawPhoton(){
  let photonY0 = 125 + yEnergyLevels[2-1];
  let photonX0 = 0;
  let photonV = 300;
  let photonTheta = -0.3;
  if(photonBool2 == false && photonBool == true && electronBool == false){
    push();
      noFill();
      stroke(photonColor.r, photonColor.g, photonColor.b);
      strokeWeight(5);
      translate(0, photonY0);
      rotate(photonTheta);       
      beginShape();
        for (let i = 0; i <= 32*PI; i+=2*PI/100) {
          //let auxX = photonX0 + i + photonV*photonTime;
          //
          //vertex( auxX*cos(photonTheta) + auxY*sin(photonTheta), -auxX*sin(photonTheta) + auxY*cos(photonTheta));
          let auxX = i + photonV*photonTime;
          let auxY = 10*sin(0.25*i + 32*photonTime);
          vertex( auxX, auxY);
        }
      endShape();
      let isQuantum = false;
      for (let i = 0; i < quantumWavelengths.length; i++) {
        if (quantumWavelengths[i] == photonWavelength){
          isQuantum = true;
        }        
      }      
      if(isQuantum && photonX0 + 32*PI + photonV*photonTime > 430){
        photonBool = false;
        photonTime = 0;
        electronBool = true;
        electront0 = time;
      }else if(photonX0 + 32*PI + photonV*photonTime > 1000){
        photonBool = false;
        photonTime = 0;
      };
      photonTime += step;
    pop();
  }
}

function drawPhoton2(){
  if(photonBool == false && photonBool2 == true && electronBool == false){
    let nLevel = 2;
    let photonY0 = yEnergyLevels[nLevel-1];
    let photonX0 = orbitsX0 + orbitsWidth/2;
    let photonV = 300;
    if(photonThetaBool == true){
      photonTheta2 = 2*PI*random();
      photonThetaBool = false;
    }
    push();
      noFill();
      stroke(photonColor.r, photonColor.g, photonColor.b);
      strokeWeight(5);
      //translate(photonX0, photonY0);
      //rotate(photonTheta);       
      beginShape();
        for (let i = 0; i <= 32*PI; i+=2*PI/100) {
          let auxX =  i + photonV*photonTime;
          let auxY =  10*sin(0.25*i + 32*photonTime);
          vertex( photonX0 + auxX*cos(photonTheta2) + auxY*sin(photonTheta2), photonY0 - auxX*sin(photonTheta2) + auxY*cos(photonTheta2));
          //let auxX = photonX0 + i + photonV*photonTime;
          //let auxY = photonY0 + 10*sin(0.25*i + 32*photonTime);
          //vertex( auxX, auxY);
        }
      endShape();
      if(photonX0 + 32*PI + photonV*photonTime > 1000){
        photonBool2 = false;
        photonTime = 0;
      };
      photonTime += step;
    pop();
  }
}

function launchPhoton(){
  photonWavelength = sliderWavelength.value;
  photonColor = wavelengthToColor(photonWavelength);
  if(photonBool2 == false && electronBool == false){
    photonBool = true;
  }  
}


function updateQuantumLevel(){
  switch(round(photonWavelength)){
    case quantumWavelengths[0]:
      quantumLevel = 5;
      break;
    case quantumWavelengths[1]:
      quantumLevel = 4;
      break;
    case quantumWavelengths[2]:
      quantumLevel = 3;
      break;
    case quantumWavelengths[3]:
      quantumLevel = 2;
      break;
    default:
      console.log("No matching wavelength found");
      break;
  }
}

function drawEnergy(){
  push();
    textSize(20);
    let energyText = photonEnergyNames[quantumLevel-2];
    drawText(energyText, orbitsX0 + orbitsWidth/2 + 20 + 3*random(), yEnergyLevels[quantumLevel] + 5 + 3*random());
  pop();
  



}