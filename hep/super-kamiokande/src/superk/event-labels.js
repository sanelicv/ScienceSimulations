/* Etiquetas sobre la escena. */
(function () {
  const { app, camera } = SUPERK.scene;
  const { peakPoint } = SUPERK.mountain;
  const { t, onChange } = SUPERK.i18n;

const labels = new SIM.Labels(camera);
const lMountain = labels.add(t('mountain'), peakPoint, 'small');
const lNu = labels.add('ν', new THREE.Vector3(), 'big'); lNu.el.style.color = 'var(--neutrino)';
const lLep = labels.add('μ', new THREE.Vector3(), 'big');
const lLight = labels.add(t('light'), new THREE.Vector3(), '');
const lHit = labels.add(t('impact'), new THREE.Vector3(), 'small');
const eventLabels = [lNu, lLep, lLight, lHit];
for (const l of eventLabels) l.visible = false;

// El nombre del monte solo se ve desde fuera de la montaña
app.onFrame(() => {
  lMountain.visible = SUPERK.scene.outside > 0.5;
  labels.update();
});
onChange(() => {
  lMountain.el.innerHTML = t('mountain');
  lLight.el.innerHTML = t('light');
  lHit.el.innerHTML = t('impact');
});

SUPERK.labels = { labels, lNu, lLep, lLight, lHit, eventLabels };
})();
