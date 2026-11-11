function drawCoordinates(hasLines = true, hasBox = true, hasPlanes = false){
  if(hasLines){
    push();
      strokeWeight(3);
      stroke(255,0,0);
      line(0,0,0,500,0,0);
      stroke(0,255,0);
      line(0,0,0,0,500,0);
      stroke(0,0,255);
      line(0,0,0,0,0,500);
    pop();
  }
  if(hasPlanes){
    push();
      noStroke();
      fill(100, 100, 100, 50);
      rect(-500, -500, 1000, 1000);
      rotateX(PI/2);
      rect(-500, -500, 1000, 1000);
      rotateY(PI/2);
      rect(-500, -500, 1000, 1000);
    pop();
  }
  hasBox ? box(20, 20, 20) : null;
}

function setupScene3D(backgroundColor = 255, scaleY = true){
  background(backgroundColor);
  orbitControl();
  if (scaleY){
    scale(1,-1,1);
  }
}