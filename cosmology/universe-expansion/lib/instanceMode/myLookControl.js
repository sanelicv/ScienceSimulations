/**
 * myLookControl:
 *  - Fija la posición de la cámara.
 *  - Al arrastrar, rota el PUNTO DE MIRA (center) alrededor de la cámara.
 *  - Zoom cambia la distancia ojo→centro (o escala la proyección si es ortográfica).
 *  - Pan desplaza el centro lateral/vertical, manteniendo fijo el ojo.
 *
 * Uso: dentro de draw(): myLookControl(p, { ...opciones });
 */
function myLookControl(p, opts = {}) {
  const {
    // switches
    enableRotate   = true,
    enableZoom     = true,
    enablePan      = true,
    enableDamping  = true,
    freeRotation   = false,              // se mantiene por compatibilidad; no afecta lookAt
    disableTouchActions = true,

    // inversiones (rotación con click izq / 1 dedo)
    invertRotateX  = false,
    invertRotateY  = false,

    // sensibilidades
    rotateSensitivityX = 1,
    rotateSensitivityY = 1,
    zoomSensitivity    = 1,
    panSensitivity     = 1,

    // afinado
    dampingFactor = 0.85,
    rotateAccel   = 0.6,
    moveAccel     = 0.15,

    // límites
    minDistance   = 1e-3,
    maxDistance   = 1e6,
  } = opts;

  const cam = p._renderer._curCamera;

  // Desactivar menú contextual / wheel / touch-actions (como orbitControl)
  if (p.contextMenuDisabled !== true) { p.canvas.oncontextmenu = () => false; p._setProperty('contextMenuDisabled', true); }
  if (p.wheelDefaultDisabled !== true) { p.canvas.onwheel = () => false; p._setProperty('wheelDefaultDisabled', true); }
  if (p.touchActionsDisabled !== true && disableTouchActions) { p.canvas.style['touch-action'] = 'none'; p._setProperty('touchActionsDisabled', true); }

  // Estado interno persistente
  if (!p._renderer.rotateVelocity) p._renderer.rotateVelocity = new p.constructor.Vector(0, 0);
  if (!p._renderer.moveVelocity)   p._renderer.moveVelocity   = new p.constructor.Vector(0, 0);
  if (typeof p._renderer.zoomVelocity !== 'number') p._renderer.zoomVelocity = 0;

  if (!p._renderer.lookState) {
    // Ojo (fijo) y estado angular inicial desde la cámara actual
    const eyeX = cam.eyeX, eyeY = cam.eyeY, eyeZ = cam.eyeZ;
    const dx = cam.centerX - eyeX;
    const dy = cam.centerY - eyeY;
    const dz = cam.centerZ - eyeZ;
    const r0 = Math.hypot(dx, dy, dz) || 1;
    const theta0 = Math.atan2(dx, dz);                       // yaw
    const phi0   = Math.atan2(dy, Math.hypot(dx, dz));       // pitch

    p._renderer.lookState = {
      eyeX, eyeY, eyeZ,
      theta: theta0,
      phi:   phi0,
      dist:  r0
    };
  }

  const state = p._renderer.lookState;

  // Touches movidos (idéntico patrón a orbitControl)
  const movedTouches = [];
  p.touches.forEach(cur => {
    p._renderer.prevTouches.forEach(prev => {
      if (cur.id === prev.id) movedTouches.push({ x: cur.x, y: cur.y, px: prev.x, py: prev.y });
    });
  });
  p._renderer.prevTouches = p.touches;

  // Deltas de interacción
  let deltaRadius = 0, deltaTheta = 0, deltaPhi = 0, moveDeltaX = 0, moveDeltaY = 0;

  // Escalas internas
  const mouseZoomScale = 0.01;
  const touchZoomScale = 0.0004;
  const scaleFactor = (p.height < p.width ? p.height : p.width);

  // Inversiones
  const invX = invertRotateX ? -1 : 1;
  const invY = invertRotateY ? -1 : 1;

  // ¿mouse/touch dentro del canvas?
  let inCanvas = false;

  // ===== ENTRADA TOUCH =====
  if (movedTouches.length > 0) {
    inCanvas = movedTouches[0].x > 0 && movedTouches[0].x < p.width && movedTouches[0].y > 0 && movedTouches[0].y < p.height;

    if (movedTouches.length === 1 && enableRotate) {
      const t = movedTouches[0];
      deltaTheta = invX * ( - rotateSensitivityX * (t.x - t.px) / scaleFactor );
      deltaPhi   = invY * (   rotateSensitivityY * (t.y - t.py) / scaleFactor );
    } else if (movedTouches.length > 1) {
      const t0 = movedTouches[0], t1 = movedTouches[1];
      const dist = Math.hypot(t0.x - t1.x, t0.y - t1.y);
      const prev = Math.hypot(t0.px - t1.px, t0.py - t1.py);
      const dDist = dist - prev;

      if (enableZoom) deltaRadius = - dDist * zoomSensitivity * touchZoomScale;
      if (enablePan) {
        moveDeltaX = (0.5 * (t0.x + t1.x) - 0.5 * (t0.px + t1.px)) * panSensitivity;
        moveDeltaY = (0.5 * (t0.y + t1.y) - 0.5 * (t0.py + t1.py)) * panSensitivity;
      }
    }

    if (p.touches.length > 0 && inCanvas) {
      p._renderer.executeRotateAndMove = true;
      p._renderer.executeZoom = true;
    } else {
      p._renderer.executeRotateAndMove = false;
      p._renderer.executeZoom = false;
    }

  // ===== ENTRADA MOUSE =====
  } else {
    inCanvas = p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height;

    if (p._mouseWheelDeltaY !== 0) {
      if (enableZoom) {
        deltaRadius = Math.sign(p._mouseWheelDeltaY) * zoomSensitivity * mouseZoomScale;
        p._renderer.executeZoom = inCanvas;
      }
      p._mouseWheelDeltaY = 0;
    }

    if (p.mouseIsPressed) {
      if (p.mouseButton === p.LEFT && enableRotate) {
        deltaTheta = invX * ( - rotateSensitivityX * p.movedX / scaleFactor );
        deltaPhi   = invY * (   rotateSensitivityY * p.movedY / scaleFactor );
      } else if ((p.mouseButton === p.RIGHT || p.mouseButton === p.CENTER) && enablePan) {
        moveDeltaX = p.movedX * panSensitivity;
        moveDeltaY = p.movedY * panSensitivity * cam.yScale; // respeta inversión vertical
      }
      if (inCanvas) p._renderer.executeRotateAndMove = true;
    } else {
      p._renderer.executeRotateAndMove = false;
    }
  }

  // ===== ZOOM (ajusta distancia ojo→centro; en ortho ajusta proyección) =====
  if (enableZoom && deltaRadius !== 0 && p._renderer.executeZoom) {
    p._renderer.zoomVelocity = enableDamping ? (p._renderer.zoomVelocity + deltaRadius) : deltaRadius;
  }

  // Detectar ortho como en tu base
  const isOrtho = (cam.projMatrix.mat4[15] !== 0);

  if (Math.abs(p._renderer.zoomVelocity) > 0.001 || (!enableDamping && deltaRadius !== 0)) {
    const zv = enableDamping ? p._renderer.zoomVelocity : deltaRadius;

    if (isOrtho) {
      // ortho: escala la proyección
      cam.projMatrix.mat4[0] *= Math.pow(10, -zv);
      cam.projMatrix.mat4[5] *= Math.pow(10, -zv);
      p._renderer.uPMatrix.mat4[0] = cam.projMatrix.mat4[0];
      p._renderer.uPMatrix.mat4[5] = cam.projMatrix.mat4[5];
    } else {
      // perspectiva: cambiar distancia
      state.dist = p.constrain(state.dist * (1 + zv), minDistance, maxDistance);
    }

    if (enableDamping) p._renderer.zoomVelocity *= dampingFactor;
    else               p._renderer.zoomVelocity = 0;
  } else if (enableDamping) {
    p._renderer.zoomVelocity = 0;
  }

  // ===== ROTATE (actualiza θ, φ del vector de mirada) =====
  if (enableRotate && (deltaTheta !== 0 || deltaPhi !== 0) && p._renderer.executeRotateAndMove) {
    if (enableDamping) p._renderer.rotateVelocity.add(deltaTheta * rotateAccel, deltaPhi * rotateAccel);
    else               p._renderer.rotateVelocity.set(deltaTheta, deltaPhi);
  }
  if (p._renderer.rotateVelocity.magSq() > 0.000001 || (!enableDamping && (deltaTheta !== 0 || deltaPhi !== 0))) {
    const dTh = enableDamping ? p._renderer.rotateVelocity.x : deltaTheta;
    const dPh = enableDamping ? p._renderer.rotateVelocity.y : deltaPhi;

    state.theta += dTh;
    state.phi   += dPh;
    // limitar pitch
    const EPS = 0.001;
    state.phi = p.constrain(state.phi, -p.HALF_PI + EPS, p.HALF_PI - EPS);

    if (enableDamping) p._renderer.rotateVelocity.mult(dampingFactor);
    else               p._renderer.rotateVelocity.set(0, 0);
  } else if (enableDamping) {
    p._renderer.rotateVelocity.set(0, 0);
  }

  // ===== PAN (desplazar centro manteniendo ojo fijo) =====
  if (enablePan && (moveDeltaX !== 0 || moveDeltaY !== 0) && p._renderer.executeRotateAndMove) {
    const ndcX =  moveDeltaX * 2 / p.width;
    const ndcY = -moveDeltaY * 2 / p.height;

    if (enableDamping) p._renderer.moveVelocity.add(ndcX * moveAccel, ndcY * moveAccel);
    else               p._renderer.moveVelocity.set(ndcX, ndcY);
  }

  // Calcula centro actual desde (theta, phi, dist) para aplicar pan/actualizar lookAt
  const dirX = Math.sin(state.theta) * Math.cos(state.phi);
  const dirY = Math.sin(state.phi);
  const dirZ = Math.cos(state.theta) * Math.cos(state.phi);

  let centerX = state.eyeX + state.dist * dirX;
  let centerY = state.eyeY + state.dist * dirY;
  let centerZ = state.eyeZ + state.dist * dirZ;

  if (p._renderer.moveVelocity.magSq() > 0.000001 || (!enableDamping && (moveDeltaX !== 0 || moveDeltaY !== 0))) {
    // Convertir desplazamiento de pantalla a mundo usando los ejes locales de la cámara
    const mvx = enableDamping ? p._renderer.moveVelocity.x : (moveDeltaX * 2 / p.width);
    const mvy = enableDamping ? p._renderer.moveVelocity.y : (-moveDeltaY * 2 / p.height);

    const local = cam._getLocalAxes();

    // Para perspectiva: escalar por distancia al centro; para ortho, usar inversa de proyección
    let scaleX = 1, scaleY = 1;
    const uP = p._renderer.uPMatrix.mat4;

    if (isOrtho) {
      // similar a tu base (invertir proyección aprox.)
      scaleX = (1 / uP[0]);
      scaleY = (1 / uP[5]);
    } else {
      const viewZ = state.dist;
      scaleX = viewZ;
      scaleY = viewZ;
    }

    const dx = mvx * scaleX;
    const dy = mvy * scaleY;

    centerX += dx * local.x[0] + dy * local.y[0];
    centerY += dx * local.x[1] + dy * local.y[1];
    centerZ += dx * local.x[2] + dy * local.y[2];

    if (enableDamping) p._renderer.moveVelocity.mult(dampingFactor);
    else               p._renderer.moveVelocity.set(0, 0);

    // Recalcular (theta, phi, dist) desde el nuevo centro
    const nx = centerX - state.eyeX;
    const ny = centerY - state.eyeY;
    const nz = centerZ - state.eyeZ;
    const newDist = Math.hypot(nx, ny, nz) || state.dist;

    state.theta = Math.atan2(nx, nz);
    state.phi   = Math.atan2(ny, Math.hypot(nx, nz));
    state.dist  = p.constrain(newDist, minDistance, maxDistance);
  }

  // Asegurar ojo fijo y mirar al centro
  cam.setPosition(state.eyeX, state.eyeY, state.eyeZ);
  cam.lookAt(centerX, centerY, centerZ);
}
