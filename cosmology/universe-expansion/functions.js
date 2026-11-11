/**
 * Genera las coordenadas de las líneas del cubo y las posiciones de las galaxias en el espacio 3D.
 * @param {number} cubeWidth - Ancho total del cubo en unidades del espacio 3D.
 * @param {number} nCubes - Número de subdivisiones por eje; determina la densidad de líneas y galaxias.
 * @returns {void} Esta función no devuelve ningún valor; actualiza variables globales.
 */
function setCoordinates(cubeWidth, nCubes){
  linesCoordinates = [];
  galaxycoordinates = [];
  let linesDelta = cubeWidth/nCubes;
  for ( let i = 0; i <= nCubes; i++){
    for( let j = 0; j <= nCubes; j++){
      // Lines
      let c1 = -cubeWidth/2 + linesDelta*i;
      let c2 = -cubeWidth/2 + linesDelta*j;
      let c3 = cubeWidth/2;
      const vertices = [
        [c1, c2, -c3], [c1, c2, c3],
        [-c3, c1, c2], [c3, c1, c2],
        [c1, -c3, c2], [c1, c3, c2]
      ];
      for (const v of vertices){
        linesCoordinates.push(v);
      }

      // spheres for galaxies
      for( let k = 0; k <= nCubes; k++){
        // spheres for galaxies
        let c4 = -cubeWidth/2 + linesDelta*k;
        galaxycoordinates.push([c1,c2,c4]);
      }

      // text
      for( let k = 0; k < nCubes; k++){
        // spheres for galaxies
        let c4 = -cubeWidth/2 + linesDelta/2 + linesDelta*k;
      }

    }
  }
}

function drawCube(p){
  p.stroke(255, 255, 255, 100)
  p.strokeWeight(1);
  p.noFill();
  p.beginShape(p.LINES);
    for( let i = 0; i < linesCoordinates.length; i++){
      p.vertex(...linesCoordinates[i]);
    }
  p.endShape()
}

function drawGalaxies(p){
  p.noStroke();
  p.fill(150, 150, 255);
  galaxycoordinates.forEach( (c) => {
    p.push()
      p.translate(...c);
      p.sphere(5);
    p.pop()
  })
}

/**
 * Calcula las coordenadas de los puntos medios de todas las aristas
 * de los subcubos generados al subdividir un cubo principal.
 *
 * Devuelve tres arrays, correspondientes a los puntos medios
 * de las aristas paralelas a los ejes X, Y y Z, respectivamente.
 *
 * @param {number} cubeWidth - Ancho total del cubo principal.
 * @param {number} nCubes - Número de subdivisiones por eje.
 * @returns {[Array<Array<number>>, Array<Array<number>>, Array<Array<number>>]}
 *          Un array con tres componentes:
 *          [0] puntos medios de aristas paralelas a X,
 *          [1] puntos medios de aristas paralelas a Y,
 *          [2] puntos medios de aristas paralelas a Z.
 */
function getEdgeCenters(cubeWidth, nCubes) {
  const delta = cubeWidth / nCubes;
  const half = cubeWidth / 2;

  const centersX = [];
  const centersY = [];
  const centersZ = [];

  for (let i = 0; i <= nCubes; i++) {
    for (let j = 0; j <= nCubes; j++) {
      for (let k = 0; k <= nCubes; k++) {
        const x = -half + i * delta;
        const y = -half + j * delta;
        const z = -half + k * delta;

        // Aristas paralelas al eje X → entre (x, y, z) y (x + delta, y, z)
        if (i < nCubes) {
          centersX.push([x + delta / 2, y, z]);
        }
        // Aristas paralelas al eje Y → entre (x, y, z) y (x, y + delta, z)
        if (j < nCubes) {
          centersY.push([x, y + delta / 2, z]);
        }
        // Aristas paralelas al eje Z → entre (x, y, z) y (x, y, z + delta)
        if (k < nCubes) {
          centersZ.push([x, y, z + delta / 2]);
        }
      }
    }
  }

  return [centersX, centersY, centersZ];
}

function drawTexts(p){
  let basicLength = 100;
  let edgeLength = (basicLength*scaleFactorRange.value).toFixed(0) + " Mly";
  const centers = getEdgeCenters(cubeWidth, nCubes);
  p.fill(255);
  p.noStroke();
  centers[0].forEach( v => {
    p.push();
      p.translate(...v);
      p.text(edgeLength, 0, 0);
    p.pop();
  })
  centers[1].forEach( v => {
    p.push();
      p.translate(...v);
      p.rotateZ(-Math.PI/2);
      p.text(edgeLength, 0, 0);
    p.pop();
  })
  centers[2].forEach( v => {
    p.push();
      p.translate(...v);
      p.rotateY(-Math.PI/2);
      p.text(edgeLength, 0, 0);
    p.pop();
  })
}

function drawAxes(p){
  p.push();
    p.stroke(255, 0, 0);
    p.line(0, 0, 0, 1000, 0, 0);
    p.stroke(0, 255, 0);
    p.line(0, 0, 0, 0, 10000, 0);
    p.stroke(0, 0, 255);
    p.line(0, 0, 0, 0, 0, 1000);
  p.pop();
  
}

/**
 * Convierte coordenadas esféricas (r, θ, φ) a coordenadas cartesianas (x, y, z).
 *
 * @param {number} r - Radio (distancia al origen).
 * @param {number} theta - Ángulo polar en radianes (medido desde el eje Z).
 * @param {number} phi - Ángulo azimutal en radianes (medido desde el eje X en el plano XY).
 * @returns {{x: number, y: number, z: number}} Coordenadas cartesianas correspondientes.
 */
function sphericalToCartesian(r, theta, phi) {
  const x = r * Math.sin(theta) * Math.cos(phi);
  const y = r * Math.sin(theta) * Math.sin(phi);
  const z = r * Math.cos(theta);
  return { x, y, z };
}

function setCameraPosition(p, x, y, z) {
  const state = p._renderer.lookState;
  state.eyeX = x;
  state.eyeY = y;
  state.eyeZ = z;
}

function setFullCameraState(p, eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX = 0, upY = 1, upZ = 0) {
  const cam = p._renderer._curCamera;
  let state = p._renderer.lookState;

  // Si no existe lookState, inicialízalo
  if (!state) {
    state = {};
    p._renderer.lookState = state;
  }

  // Posición del ojo
  state.eyeX = eyeX;
  state.eyeY = eyeY;
  state.eyeZ = eyeZ;

  // Calcular nueva orientación y distancia
  const dx = centerX - eyeX;
  const dy = centerY - eyeY;
  const dz = centerZ - eyeZ;

  state.theta = Math.atan2(dx, dz);                      // yaw
  state.phi   = Math.atan2(dy, Math.hypot(dx, dz));      // pitch
  state.dist  = Math.hypot(dx, dy, dz);                  // distancia ojo→centro

  // Aplicar a la cámara actual
  cam.setPosition(eyeX, eyeY, eyeZ);
  cam.lookAt(centerX, centerY, centerZ);
  cam.setUp(upX, upY, upZ);
}
