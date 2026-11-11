/* Cámara de la demostración guiada: acompaña al protagonista de cada paso. */
(function () {
  const { app, camera, homeView, viewScale } = SUPERK.scene;
  const { controls } = app;

  const SMOOTH = 2.5;      // cuanto mayor, más rápido alcanza a su objetivo
  let mode = null;         // null, 'follow' (sigue al protagonista), 'view' (va a un encuadre) o 'home'
  const goal = new THREE.Vector3(), viewPos = new THREE.Vector3(), viewTarget = new THREE.Vector3();
  const delta = new THREE.Vector3(), offset = new THREE.Vector3();
  let goalDist = 0, userZoomed = false, viewKey = null;

  // Si el usuario toma el control, se respeta: conserva su ángulo y su zoom, y los encuadres se cancelan
  controls.addEventListener('start', () => {
    userZoomed = true;
    if (mode === 'home' || mode === 'view') mode = null;
  });

  app.onUpdate((dt, raw) => {
    if (!mode) return;
    const k = 1 - Math.exp(-raw * SMOOTH);
    if (mode === 'follow') {
      // Mueve el objetivo y la cámara juntos, para no cambiar el ángulo elegido
      delta.subVectors(goal, controls.target).multiplyScalar(k);
      controls.target.add(delta);
      camera.position.add(delta);
      if (!userZoomed) {
        offset.subVectors(camera.position, controls.target);
        const length = offset.length();
        offset.multiplyScalar((length + (goalDist * viewScale() - length) * k) / length);
        camera.position.copy(controls.target).add(offset);
      }
    } else {
      controls.target.lerp(viewTarget, k);
      camera.position.lerp(viewPos, k);
      const eps = 1e-4 * Math.max(1, viewPos.distanceTo(viewTarget));
      if (camera.position.distanceToSquared(viewPos) < eps && controls.target.distanceToSquared(viewTarget) < eps) {
        controls.target.copy(viewTarget);
        camera.position.copy(viewPos);
        mode = null;
      }
    }
  });

  SUPERK.guideCamera = {
    get busy() { return mode !== null; },
    // Lleva la cámara hacia un punto, a cierta distancia; al cambiar de distancia, vuelve a aplicar el zoom
    focus(point, distance) {
      mode = 'follow';
      viewKey = null;
      goal.copy(point);
      if (distance !== goalDist) { goalDist = distance; userZoomed = false; }
      controls.enablePan = false;
    },
    // Va a un encuadre fijo (posición y punto de mira). Se pide una vez por encuadre: si el usuario
    // lo interrumpe, no se vuelve a imponer.
    view(key, position, target) {
      if (key === viewKey) return;
      viewKey = key;
      mode = 'view';
      viewPos.copy(position);
      viewTarget.copy(target);
      goalDist = 0;
      controls.enablePan = false;
    },
    // Regresa suavemente a la vista inicial
    goHome() {
      const home = homeView();
      viewPos.copy(home.position);
      viewTarget.copy(home.target);
      goalDist = 0;
      viewKey = null;
      mode = 'view';
      controls.enablePan = true;
    },
    // Olvida el último encuadre pedido (al retroceder, el mismo encuadre se vuelve a aplicar)
    reset() { viewKey = null; },
  };
})();
