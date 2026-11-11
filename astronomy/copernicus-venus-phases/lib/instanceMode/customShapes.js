function customPolygon(p, x, y, radius, npoints, thicknessRatio) {
	let angle = p.TWO_PI / npoints;
	p.beginShape();
	// CW
	for (let a = 0; a <= p.TWO_PI; a += angle) {
		let sx = x + p.cos(a) * radius;
		let sy = y + p.sin(a) * radius;
		p.vertex(sx, sy, 0);
	}
	// beginContour();
	// CCW
	for (let a = p.TWO_PI; a >= 0; a -= angle) {
		let sx = x + p.cos(a) * radius * thicknessRatio;
		let sy = y + p.sin(a) * radius * thicknessRatio;
		p.vertex(sx, sy, 0);
	}
	// endContour();
	p.endShape(p.CLOSE);
}

function customCircle(p, radius = 100, nPoints = 50, posX = 0, posY = 0, posZ = 0, xRotAngle = 0, yRotAngle = 0, zRotAngle = 0) {
	let angleStep = 2 * p.PI / nPoints;
	p.push();
	p.translate(posX, posY, posZ);
	p.rotateZ(zRotAngle);
	p.rotateY(yRotAngle);
	p.rotateX(xRotAngle);
	p.beginShape();
	for (let a = 0; a <= 2 * p.PI; a += angleStep) {
		let vx = radius * p.cos(a);
		let vy = radius * p.sin(a);
		p.vertex(vx, vy, 0);
	}
	p.endShape(p.CLOSE);
	p.pop();
}

function drawPerson(p, width = 100, nPoints = 50) {
	p.push();
	p.scale(width);
	p.beginShape();
	p.vertex(0, 3, 0);
	p.vertex(-1, 0, 0);
	p.vertex(-2, 0, 0);
	p.vertex(-1, 4, 0);
	p.vertex(-1, 6, 0);
	p.vertex(-2, 4, 0);
	p.vertex(-3, 4, 0);
	p.vertex(-1, 8, 0);
	p.vertex(1, 8, 0);
	p.vertex(3, 4, 0);
	p.vertex(2, 4, 0);
	p.vertex(1, 6, 0);
	p.vertex(1, 4, 0);
	p.vertex(2, 0, 0);
	p.vertex(1, 0, 0);
	p.vertex(1, 0, 0);
	p.vertex(0, 3, 0);
	p.endShape();
	customCircle(p, 0, 9, 0, 1, nPoints);
	p.pop();
}
