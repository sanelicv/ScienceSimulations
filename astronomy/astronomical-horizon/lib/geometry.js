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

function sphericalToVector(radius, theta, phi) {
	// Convert spherical coordinates to Cartesian coordinates
	let x = radius * sin(theta) * cos(phi);
	let y = radius * sin(theta) * sin(phi);
	let z = radius * cos(theta);
	
	// Create and return a p5.Vector with these coordinates
	return createVector(x, y, z);
  }
