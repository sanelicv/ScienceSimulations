const sketch1 = (p) => {
  // MAIN CONFIG
  let WIDTH = 1200;
  let HEIGHT = 900;
  let backgroundColor = 50;

  // SETUP CAMERA
  let camRad = 1.5 * WIDTH;
  if (window.innerWidth < 900) camRad = 1 * WIDTH;
  let camTheta = 60 * (3.1416 / 180);
  let camPhi = 0 * (3.1416 / 180);
  let cameraPos = [
    Math.sin(camTheta) * Math.cos(-camPhi),
    Math.sin(camTheta) * Math.sin(-camPhi),
    Math.cos(camTheta)
  ].map(e => e * camRad);
  let cameraCenter = [600, 0, 0];
  let cameraUpVector = [0, 0, -1];

    // POSITIONS
  const sunPos = [0, 0, 0];
  const earthPos = [600, 0, 0];

  // DYNAMICS
  let orbitRotationDirection = 1;    
  let axialTilt = -45.0;
  let sunRadius = 50;
  let earthRadius = 25;
  let planetOrbitRadius = 300;
  let celestialSphereRadius = 50000;
  let translationSpeedFactor = -orbitRotationDirection * 0.1;
  let rotationSpeedFactor = translationSpeedFactor * 365.25;
  let lat = 90;
  let nStars = 150;
  let starPos = [];
  let moonOrbitRadius = 100;
  let moonOrbitSpeed = 10;

  // TEXTURES & TIME
  let planetTexture, sunTexture;
  let time0 = 0.5 * 2 * Math.PI / translationSpeedFactor;
  let time = time0;
  let timeStep;
  let cam;

  // DOM ELEMENTS
  let debugText, checkboxRun, spanSpeed, rangeSpeed;

  p.preload = () => {
    p.font_Roboto_B = p.loadFont("./fonts/Roboto-Bold.otf");    
  };

  p.setup = () => {
    // adjust for small screens
    if (window.innerWidth < 900) {
      WIDTH  = 0.9 * window.innerWidth;
      HEIGHT = 0.9 * window.innerWidth;
    }

    const canvas = p.createCanvas(WIDTH, HEIGHT, p.WEBGL);
    canvas.parent("containerSketch1");
    p.frameRate(60);
    timeStep = 0.25 * 1 / p.getTargetFrameRate();

    cam = p.createCamera();
    p.camera(...cameraPos, ...cameraCenter, ...cameraUpVector);

    p.textFont(p.font_Roboto_B);
    p.textSize(100);
    p.textAlign(p.CENTER, p.CENTER);

    planetTexture = p.loadImage("2k_venus_atmosphere.jpg");
    earthTexture = p.loadImage("2k_earth_daymap.jpg");
    sunTexture   = p.loadImage("2k_sun.jpg");

    p.randomSeed(2);
    // Polaris
    const polaris = p.createVector(
      celestialSphereRadius * Math.sin(p.radians(89)) * Math.cos(0),
      celestialSphereRadius * Math.sin(p.radians(89)) * Math.sin(0),
      celestialSphereRadius * Math.cos(p.radians(89))
    );
    starPos.push(polaris);
    for (let i = 0; i < nStars; i++) {
      starPos.push(p5.Vector.random3D().mult(celestialSphereRadius));
    }

    // grab DOM elements
    checkboxRun = document.getElementById("checkboxRun1");
    spanSpeed   = document.getElementById("spanSpeed1");
    rangeSpeed  = document.getElementById("rangeSpeed1");
  };

  p.draw = () => {
    p.orbitControl();
    p.background(50);
    p.scale(1, -1, 1);

    const speedValue = rangeSpeed.value;
    spanSpeed.textContent = speedValue;
    lat = 0;

    // Sun lighting    
    sunLight(p);
    // Sun
    sunRender(p);
    // Planet orbit & rendering
    planetRender(p);
    // Earth
    earthRender(p);

    if (checkboxRun.checked) {
      time += timeStep * Number(speedValue);
    }

  };

  // Optional additional methods (if used elsewhere)
  p.earthPerspective = () => {
    const newCenter = [
      planetOrbitRadius * Math.cos(-translationSpeedFactor * time),
      planetOrbitRadius * Math.sin(-translationSpeedFactor * time),
      0
    ];
    p.camera(...cameraPos, ...newCenter, ...cameraUpVector);
  };

  p.camFromEarth = () => {
    // implement as needed
  };

  // Earth
  function earthRender(p){
    p.push();
      p.ambientLight(255);
      p.translate(...earthPos);
      p.noStroke();      
      p.texture(earthTexture);
      p.rotateX(Math.PI/2);
      p.scale(-1,-1,-1);      
      p.sphere(earthRadius);
    p.pop();
    // Orbit
    p.push();        
      p.noFill();
      p.strokeWeight(2);
      p.stroke(255);
      customCircle(p, 600);
    p.pop();
  }
  // Sun
  function sunRender(p){    
    p.push();
      p.ambientLight(255);
      p.translate(...sunPos);
      p.noStroke();      
      p.texture(sunTexture);
      p.sphere(earthRadius);
    p.pop();    
  }

  // Sun light
  function sunLight(p){
    for (let i = 0; i < 4; i++) {
      p.pointLight(255, 255, 255, ...sunPos);
    }
  }

  // Planet orbit & rendering
  function planetRender(p){  
    p.push();      
      // Orbit
      p.push();        
        p.noFill();
        p.strokeWeight(2);
        p.stroke(255);
        customCircle(p, planetOrbitRadius);
      p.pop();
      // Planet
      p.translate(
        planetOrbitRadius * Math.cos(translationSpeedFactor * time),
        planetOrbitRadius * Math.sin(translationSpeedFactor * time),
        0
      );
      p.push();
        p.rotateX(-p.radians(axialTilt));
        p.push();
          p.stroke(255);
        p.pop();
        p.push();
          p.rotateX(lat * p.PI / 180 - p.PI / 2);
        p.pop();
        p.rotateX(-p.PI / 2);
        p.scale(-1, 1, 1);
        p.noStroke();
        p.texture(planetTexture);
        p.sphere(earthRadius);
      p.pop();
    p.pop();
  }

};

new p5(sketch1, 'containerSketch1');

