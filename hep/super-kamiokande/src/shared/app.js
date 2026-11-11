/* Aplicación base: escena, cámara, renderer, controles y bucle. */
(function () {
SIM.createApp = function (opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.maxPixelRatio ?? 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (opts.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.background ?? 0x000000);

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 45, window.innerWidth / window.innerHeight, opts.near ?? 0.1, opts.far ?? 5000);
  camera.position.copy(opts.cameraPos ?? new THREE.Vector3(0, 10, 30));

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.copy(opts.target ?? new THREE.Vector3());
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.update();

  const app = {
    renderer, scene, camera, controls,
    timeScale: 1,
    paused: false,
    time: 0,
    updaters: [],
    onUpdate(fn) { this.updaters.push(fn); },
    // Se ejecuta tras mover la cámara y justo antes de dibujar: para lo que deba ir pegado a ella
    frameHooks: [],
    onFrame(fn) { this.frameHooks.push(fn); },
  };

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Al girar el dispositivo, algunos navegadores informan el tamaño nuevo con retraso
  window.addEventListener('orientationchange', () => setTimeout(() => window.dispatchEvent(new Event('resize')), 250));

  const clock = new THREE.Clock();
  // ?warm=N pre-simula N segundos antes del primer cuadro (útil para abrir la escena "en marcha")
  let warm = parseFloat(new URLSearchParams(window.location.search).get('warm')) || 0;
  function loop() {
    if (warm > 0) {
      for (let t = 0; t < warm; t += 1 / 30) { app.time += 1 / 30; for (const fn of app.updaters) fn(1 / 30, 1 / 30); }
      warm = 0;
      clock.getDelta();
    }
    requestAnimationFrame(loop);
    const raw = Math.min(clock.getDelta(), 0.05);
    const dt = app.paused ? 0 : raw * app.timeScale;
    app.time += dt;
    for (const fn of app.updaters) fn(dt, raw);
    controls.update();
    for (const fn of app.frameHooks) fn();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);

  // Atajos de teclado comunes
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { app.paused = !app.paused; e.preventDefault(); }
    else if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('hidden-ui');
    else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
    else if (SIM.fromMenu && (e.key === 'm' || e.key === 'M' || e.key === 'Backspace')) window.location.href = '../../index.html';
  });

  return app;
};
})();
