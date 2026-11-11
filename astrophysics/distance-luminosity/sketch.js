let width = 1200;
let height = 600;

let pos0 = 50;

let slider_pos1, slider_pos2;
let slider_rad1, slider_rad2;

function setup() {
  
  canvas = createCanvas(width, height);
  canvas.parent("containerSketch");
    
  slider_pos1 = createSlider(pos0 + 400, pos0 + 1000, pos0 + 1000, 1);
  slider_pos1.size(200);
  slider_pos1.position(150, 43);
  slider_pos1.style('position', 'absolute');
  slider_pos1.parent("containerSketch");
  slider_rad1 = createSlider(25, 150, 150, 1);
  slider_rad1.position(150, 63);
  slider_rad1.size(200);
  slider_rad1.style('position', 'absolute');
  slider_rad1.parent("containerSketch");
  
  slider_pos2 = createSlider(pos0 + 400, pos0 + 1000, pos0 + 400, 1);
  slider_pos2.size(200);
  slider_pos2.position(150, 510);
  slider_pos2.style('position', 'absolute');
  slider_pos2.parent("containerSketch");
  slider_rad2 = createSlider(25, 150, 25, 1);
  slider_rad2.position(150, 530);
  slider_rad2.size(200);
  slider_rad2.style('position', 'absolute');
  slider_rad2.parent("containerSketch");
  
}

function draw() {
  background(50);
  
  drawText(); 
  
  drawStar(slider_pos1.value(),height/2-150,slider_rad1.value());
  drawStar(slider_pos2.value(),height/2+200-50,slider_rad2.value());

  push();
    fill(200, 200, 255);
    circle(-50 , height/2, 300);
    fill(50, 50, 255);
    circle(-50 , height/2, 270);
    fill(0);
    rect(20, height/2-200, 150, 100, 10);
    rect(20, height/2+200-100, 150, 100, 10);   
  pop();
  
  push();
    let smallRad1 = 1-(slider_pos1.value()-pos0-400)/(600) 
                    + (slider_rad1.value()-25)/(150-25);
    circle(20+150/2, 150, 20*(smallRad1));
    let smallRad2 = 1-(slider_pos2.value()-pos0-400)/(600) 
                    + (slider_rad2.value()-25)/(150-25);
    circle(20+150/2, height/2+200-50, 20*(smallRad2));
  pop();
  
  
  
  
}

function drawStar(starX, starY, starRad){
  push();
    fill(255, 255, 0);
    stroke(245, 176, 66);
    strokeWeight(5);
    circle(starX, starY, starRad);
  pop();
}

function drawText(){
  push();
    fill(255);
    textSize(20);
    text("Distancia", 10, 63);
    text("Luminosidad", 10, 83);
    text("Distancia", 10, 530);
    text("Luminosidad", 10, 550);
  pop();
}