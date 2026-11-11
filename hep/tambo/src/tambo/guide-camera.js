/* Cámara de la demostración guiada: acompaña al protagonista de cada paso. */
(function () {
  const { app, camera, homeView, viewScale } = TAMBO.scene;
  const { controls } = app;

  const SMOOTH = 2.5;      // cuanto mayor, más rápido alcanza a su objetivo
  let mode = null;         // null, 'follow' (sigue al protagonista) o 'home' (vuelve al inicio)
  const goal = new THREE.Vector3(), homePos = new THREE.Vector3(), homeTarget = new THREE.Vector3();
  const delta = new THREE.Vector3(), offset = new THREE.Vector3();
  let goalDist = 0, userZoomed = false;

  // Si el usuario toma el control, se respeta: conserva su ángulo y su zoom, y el regreso se cancela
  controls.addEventListener('start', () => {
    userZoomed = true;
    if (mode === 'home') mode = null;
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
      controls.target.lerp(homeTarget, k);
      camera.position.lerp(homePos, k);
      if (camera.position.distanceToSquared(homePos) < 0.01 && controls.target.distanceToSquared(homeTarget) < 0.01) {
        controls.target.copy(homeTarget);
        camera.position.copy(homePos);
        mode = null;
      }
    }
  });

  TAMBO.guideCamera = {
    // Lleva la cámara hacia un punto, a cierta distancia; al cambiar de distancia, vuelve a aplicar el zoom
    focus(point, distance) {
      mode = 'follow';
      goal.copy(point);
      if (distance !== goalDist) { goalDist = distance; userZoomed = false; }
      controls.enablePan = false;
    },
    // Regresa suavemente a la vista inicial
    goHome() {
      const home = homeView();
      homePos.copy(home.position);
      homeTarget.copy(home.target);
      goalDist = 0;
      mode = 'home';
      controls.enablePan = true;
    },
  };
})();
