// === SKETCH EN MODO INSTANCIA (WEBGL) ===
const host = document.getElementById("canvas-host");

let linesCoordinates = [];
let cubeWidth = 600;
let nCubes = 3;
let linesDelta = cubeWidth/nCubes;
let galaxycoordinates = [];
let textCoordinates = [];
let cameraSwitch = true;
let cameraDistance0 = (window.innerWidth < 900) ? 2500 : 1200;
const cameraPos0 = sphericalToCartesian(cameraDistance0, -Math.PI/3, Math.PI/6);
const localCameraPos0 = [linesDelta/2, linesDelta/2, linesDelta/2];
const localCameraConfig0 = [linesDelta/2, linesDelta/2, linesDelta/2, 0, 0, -100, 0, 1, 0];

const miSketch = (p) => {
  let angle = 0;
  let cameraSelect = document.getElementById("cameraSelect");
  let scaleFactorRange = document.getElementById("scaleFactorRange");
  let w = host.clientWidth;
  let h = host.clientHeight;

  p.preload = () => {
    font = p.loadFont('./fonts/Roboto-Bold.otf');
  };

  p.setup = () => {

    const canvas = p.createCanvas(w, h, p.WEBGL);
    canvas.parent("canvas-host");
    p.camera(cameraPos0.x, cameraPos0.y, cameraPos0.z, 0, 0, 0, 0, 1, 0);
    setCoordinates(cubeWidth, nCubes);
    p.textFont(font);
    p.textAlign(p.CENTER);
    p.textSize(10);
    
    // Forzar que lookState exista desde el inicio
    myLookControl(p);

  };

  p.draw = () => {
    //drawAxes(p);
    let scaleFactor = Number(scaleFactorRange.value);
    p.background(0);

    if (cameraSelect.value == "Global"){
      p.textSize(10*scaleFactor);
      p.orbitControl();
      drawCube(p);
      drawGalaxies(p);
      drawTexts(p);
    }else{
      // let cameraConfig = [1000, 1000, 1000, 0, 0, -100, 0, 1, 0];
      // p.camera(...cameraConfig);
      //p.orbitControl();
      
      myLookControl(p);
      p.push();
        //p.translate(linesDelta/2, linesDelta/2, linesDelta/2);
        drawCube(p);
        drawGalaxies(p);
        drawTexts(p);
      p.pop();
    }
    
  };  

  

};

// === CREACIÓN DE LA INSTANCIA ===
let myp5 = new p5(miSketch, "canvas-host");
