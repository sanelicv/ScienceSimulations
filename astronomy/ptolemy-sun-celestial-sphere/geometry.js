function polygon(x, y, radius, npoints, thicknessRatio) {
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

function drawCoordinates(cRadius){
	// Draw Axes
	push();
		stroke(255, 0, 0);
		line(0, 0, 0, cRadius, 0, 0);
	pop();
	push();
		stroke(0, 255, 0);
		line(0, 0, 0, 0, cRadius, 0);
	pop();
	push();
		stroke(0, 0, 255);
		line(0, 0, 0, 0, 0, cRadius);
	pop();
}

function drawMeridians(x, y, radius, npoints, nMeridians = 4) {
	let angle = TWO_PI / npoints;
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

function drawParallels(x, y, radius, npoints, nParallels = 3) {
	let angle = TWO_PI / npoints;
	let step = 2*radius/(nParallels+1);
	for (let z = -radius + step; z <= radius - step; z += step){
		let b = acos(z/radius);
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