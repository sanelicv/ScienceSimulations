// Update Range and Input accordingly
document.addEventListener('DOMContentLoaded', function() {
  
  //  UPDATE VALUES OF RANGE AND NUMER FOR LATITUDE
  var slider = document.getElementById("rangeLat");
  var input = document.getElementById("numberLat");
  // Function to sync the input value with the slider value
  const syncInputToSlider = () => input.value = slider.value;
  // Function to sync the slider value with the input value
  const syncSliderToInput = () => slider.value = input.value;
  // Add event listeners
  slider.addEventListener('input', syncInputToSlider);
  input.addEventListener('input', syncSliderToInput);

});

function openTab(evt, tabName) {
  var i, tabcontent, tablinks;

  // Hide all tab contents
  tabcontent = document.getElementsByClassName("tab-content-container");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
      tabcontent[i].classList.remove("active");
  }

  // Remove the active class from all tab buttons
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.className += " active";
}

function drawHorizon(radius, isBottomActive = true, lat= 0){
  // Horizon Box
  push();
    let boxStepTop = 2.5*(radius/2);
    let boxStepZ = 1.1*(radius/2);
    beginShape();
      fill(250);
      vertex(-boxStepTop, -boxStepTop, 0);
      vertex(-boxStepTop, boxStepTop, 0);
      vertex(boxStepTop, boxStepTop, 0);
      vertex(boxStepTop, -boxStepTop, 0);
      vertex(-boxStepTop, -boxStepTop, 0);
    endShape();
    // BOX
    if(isBottomActive){
      noLights();
      beginShape();
        fill(250);
        vertex(-boxStepTop, -boxStepTop, -boxStepZ-boxStepZ);
        vertex(-boxStepTop, -boxStepTop, boxStepZ-boxStepZ);
        vertex(-boxStepTop, boxStepTop, boxStepZ-boxStepZ);
        vertex(-boxStepTop, boxStepTop, -boxStepZ-boxStepZ);
        vertex(-boxStepTop, -boxStepTop, -boxStepZ-boxStepZ);
      endShape();
      beginShape();
        fill(250);
        vertex(boxStepTop, -boxStepTop, -boxStepZ-boxStepZ);
        vertex(boxStepTop, -boxStepTop, boxStepZ-boxStepZ);
        vertex(boxStepTop, boxStepTop, boxStepZ-boxStepZ);
        vertex(boxStepTop, boxStepTop, -boxStepZ-boxStepZ);
        vertex(boxStepTop, -boxStepTop, -boxStepZ-boxStepZ);
      endShape();
      beginShape();
        fill(250);
        vertex(-boxStepTop, boxStepTop, -boxStepZ-boxStepZ);
        vertex(-boxStepTop, boxStepTop, boxStepZ-boxStepZ);
        vertex(boxStepTop, boxStepTop, boxStepZ-boxStepZ);
        vertex(boxStepTop, boxStepTop, -boxStepZ-boxStepZ);
        vertex(-boxStepTop, boxStepTop, -boxStepZ-boxStepZ);
      endShape();
      beginShape();
        fill(250);
        vertex(-boxStepTop, -boxStepTop, -boxStepZ-boxStepZ);
        vertex(-boxStepTop, -boxStepTop, boxStepZ-boxStepZ);
        vertex(boxStepTop, -boxStepTop, boxStepZ-boxStepZ);
        vertex(boxStepTop, -boxStepTop, -boxStepZ-boxStepZ);
        vertex(-boxStepTop, -boxStepTop, -boxStepZ-boxStepZ);
      endShape();
      beginShape();
        fill(250);
        vertex(-boxStepTop, -boxStepTop, -2*boxStepZ);
        vertex(-boxStepTop, boxStepTop, -2*boxStepZ);
        vertex(boxStepTop, boxStepTop, -2*boxStepZ);
        vertex(boxStepTop, -boxStepTop, -2*boxStepZ);
        vertex(-boxStepTop, -boxStepTop, -2*boxStepZ);
      endShape();
      lights();
    }
    
  pop();
  // Horizon circle
  push();
    noFill();
    stroke("blue");
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
  
function drawSunPath(radius, eclipticAngle, omega, lat, time){
  // Positon of the sun in the ecliptic over a year (No Earth rotation)
  let sunPosEcliptic = createVector( radius*cos(omega.ecliptic*time), radius*sin(omega.ecliptic*time), 0 );
  sunPosEcliptic.rotate3D(eclipticAngle*PI/180, 0, 0);
  push();
    noFill();
    strokeWeight(8);
    stroke("orange");
    rotateX(PI/2-lat*PI/180);
    customCircle(0, 0, sunPosEcliptic.z, Math.sqrt(pow(sunPosEcliptic.x,2) + pow(sunPosEcliptic.y,2)), 100, 0, 0, 0);
  pop();
}
  
function calcSunPos(radius, eclipticAngle, omega, lat, time){
  let sunPos = createVector( radius*cos(omega.ecliptic*time), radius*sin(omega.ecliptic*time), 0 );
  sunPos.rotate3D(eclipticAngle*PI/180, 0, 0);
  sunPos.rotate3D(0, 0, -omega.celestial*time + PI);
  sunPos.rotate3D(PI/2-lat*PI/180, 0, 0);
  return sunPos;
}
  
function drawSun(radius, eclipticAngle, omega, lat, time){
  push();
    translate(calcSunPos(radius, eclipticAngle, omega, lat, time));
    noStroke();
    fill(255, 255, 0)
    emissiveMaterial(255, 0, 0);
    sphere(30);
  pop();
}

function drawSolsEq(radius, eclipticAngle, lat){
  push();
    noFill();
    strokeWeight(4);
    stroke(0, 0, 255, 100);
    rotateX(Math.PI/2 - lat*(PI/180));
    customCircle(0, 0, radius*sin(eclipticAngle*(Math.PI/180)), radius*cos(eclipticAngle*(Math.PI/180)), 100);
    customCircle(0, 0, -radius*sin(eclipticAngle*(Math.PI/180)), radius*cos(eclipticAngle*(Math.PI/180)), 100);
    customCircle(0, 0, 0, radius, 100);
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

function setEqui1(){
  time = 0;
}

function setSol1(){
  time = 0.25*2*Math.PI/omega.ecliptic;
}

function setEqui2(){
  time = 0.5*2*Math.PI/omega.ecliptic;
}

function setSol2(){
  time = 0.75*2*Math.PI/omega.ecliptic;
}