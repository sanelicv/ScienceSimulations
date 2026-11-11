function customPolygon(x, y, radius, npoints, thicknessRatio) {
	let angle = TWO_PI / npoints;
	beginShape();
	//CW
	for (let a = 0; a <= TWO_PI; a += angle) {
		let sx = x + cos(a) * radius;
		let sy = y + sin(a) * radius;
		vertex(sx, sy, 0);
	}
	// beginContour();
	// CCW
	for (let a = TWO_PI; a >= 0; a -= angle) {
		let sx = x + cos(a) * radius * thicknessRatio;
		let sy = y + sin(a) * radius * thicknessRatio;
		vertex(sx, sy, 0);
	}
	// endContour();
	endShape(CLOSE);
}

function customCircle(posX = 0, posY = 0, posZ = 0, radius = 100, nPoints = 50, xRotAngle = 0, yRotAngle = 0, zRotAngle = 0) {
  let angleStep = 2*3.1416 / nPoints;  
  push();
    translate(posX, posY, posZ);
    rotateZ(zRotAngle);
    rotateY(yRotAngle);
    rotateX(xRotAngle);    
    beginShape();
      for (let a = 0; a <= 2*3.1416; a += angleStep) {
        let vx = radius * cos(a);
        let vy = radius * sin(a);
        vertex(vx, vy, 0);
      }
    endShape(CLOSE);
  pop();  
}

function drawPerson(width = 100, nPoints = 50){
	push();
		scale(width);
		beginShape();
			vertex(0, 3, 0);
			vertex(-1, 0, 0);
			vertex(-2, 0, 0);
			vertex(-1, 4, 0);
			vertex(-1, 6, 0);
			vertex(-2, 4, 0);
			vertex(-3, 4, 0);
			vertex(-1, 8, 0);
			vertex(1, 8, 0);
			vertex(3, 4, 0);
			vertex(2, 4, 0);
			vertex(1, 6, 0);
			vertex(1, 4, 0);
			vertex(2, 0, 0);
			vertex(1, 0, 0);
			vertex(1, 0, 0);
			vertex(0, 3, 0);
		endShape();
		customCircle(0, 9, 0, 1, nPoints)
	pop();
		
} 
