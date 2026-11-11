function drawMeridians(x, y, radius, nPoints, nMeridians = 4) {
	let angle = TWO_PI / nPoints;
	//let b = 3*PI/4;
	for (let a = 0; a < 2*PI; a += PI/nMeridians){
		beginShape();
		for (let b = 0; b <= TWO_PI; b += angle) {
			let sx = x + radius * sin(b) * cos(a);
			let sy = y + radius * sin(b) * sin(a);
			let sz = y + radius * cos(b);
			vertex(sx, sy, sz);
		}
		endShape(CLOSE);
	}
}

function drawParallels(x, y, radius, nPoints, nParallels = 3) {
	let angle = TWO_PI / nPoints;
	let step = PI / (nParallels + 1);
	for (let i = 1; i <= nParallels; i++) {
		let b = i * step; // Uniform angular step
		beginShape();
		for (let a = 0; a <= TWO_PI; a += angle) {
			let sx = x + radius * sin(b) * cos(a);
			let sy = y + radius * sin(b) * sin(a);
			let sz = y + radius * cos(b);
			vertex(sx, sy, sz);
		}
		endShape(CLOSE);
	}
}


function drawCelestialSphere(cRadius = 200, nPoints = 50, nMeridians = 4, nParallels = 7){
  push();
    noFill();
    drawMeridians(0, 0, cRadius, nPoints, nMeridians);
    drawParallels(0, 0, cRadius, nPoints, nParallels);    
  pop();
}

function drawHalfCelestialSphere(radius = 200, nPoints = 50, nMeridians = 4, nParallels = 7) {
	push();
	noFill();
  
	// Draw meridians
	let angleStep = PI / nPoints;
	for (let a = 0; a < TWO_PI; a += PI / nMeridians) {
	  beginShape();
	  for (let b = 0; b <= HALF_PI + angleStep; b += angleStep) {
		let sx = radius * sin(b) * cos(a);
		let sy = radius * sin(b) * sin(a);
		let sz = radius * cos(b);
		vertex(sx, sy, sz);
	  }
	  endShape();
	}
  
	// Draw parallels
	let parallelStep = HALF_PI / (nParallels + 1);
	for (let i = 1; i <= nParallels; i++) {
	  let b = i * parallelStep;
	  beginShape();
	  for (let a = 0; a <= TWO_PI; a += TWO_PI / nPoints) {
		let sx = radius * sin(b) * cos(a);
		let sy = radius * sin(b) * sin(a);
		let sz = radius * cos(b);
		vertex(sx, sy, sz);
	  }
	  endShape(CLOSE);
	}
  
	pop();
  }
  




class CelestialSphere {
	constructor(cRadius = 500, nPoints = 40, nMeridians = 4, nParallels = 7, equatorOn = false) {
	  this.cRadius = cRadius;
	  this.nPoints = nPoints;
	  this.nMeridians = nMeridians;
	  this.nParallels = nParallels;
	  this.equatorOn = false;
	}
  
	drawMeridians(x, y, radius, nPoints, nMeridians = 4) {
		let angle = TWO_PI / nPoints;
		for (let a = 0; a < 2*PI; a += PI/nMeridians){
			let cosA = cos(a);
			let sinA = sin(a);
			beginShape();			
			for (let b = 0; b <= TWO_PI; b += angle) {
				let sinB = sin(b);
				let sx = x + radius * sinB * cosA;
				let sy = y + radius * sinB * sinA;
				let sz = y + radius * cos(b);
				vertex(sx, sy, sz);
			}
			endShape(CLOSE);
		}
	}
  
	drawParallels(x, y, radius, nPoints, nParallels = 3) {
		let angle = TWO_PI / nPoints;
		let step = PI / (nParallels + 1);
		for (let i = 1; i <= nParallels; i++) {
			let b = i * step; // Uniform angular step
			let sinB = sin(b);
			let cosB = cos(b);
			push();
			if(b == PI/2 && this.equatorOn){
				stroke(0, 0, 255);
				fill(0, 0, 255, 50);
			} 
			beginShape();
			for (let a = 0; a <= TWO_PI; a += angle) {
				let sx = x + radius * sinB * cos(a);
				let sy = y + radius * sinB * sin(a);
				let sz = y + radius * cosB;
				vertex(sx, sy, sz);
			}
			endShape(CLOSE);
			pop();			
		}
	}
  
	draw() {
	  push();
	  noFill();
	  this.drawMeridians(0, 0, this.cRadius, this.nPoints, this.nMeridians);
	  this.drawParallels(0, 0, this.cRadius, this.nPoints, this.nParallels);
	  pop();
	}
  }