/* Etiquetas sobre la escena. */
(function () {
  const { app, camera } = TAMBO.scene;
  const { axis, height } = TAMBO.terrain;
  const { t, onChange } = TAMBO.i18n;

const labels = new SIM.Labels(camera);
const lRiver = labels.add(t('river'), new THREE.Vector3(axis(36), height(axis(36), 36) + 1, 36), 'small');
const lNu = labels.add('ν<sub>τ</sub>', new THREE.Vector3(), 'big'); lNu.el.style.color = 'var(--neutrino)';
const lTau = labels.add('τ', new THREE.Vector3(), 'big'); lTau.el.style.color = 'var(--tau)';
const lShower = labels.add(t('shower'), new THREE.Vector3(), '');
const lHit = labels.add(t('impact'), new THREE.Vector3(), 'small');
const lDecay = labels.add(t('decay'), new THREE.Vector3(), 'small');
const eventLabels = [lNu, lTau, lShower, lHit, lDecay];
for (const l of eventLabels) l.visible = false;
app.onFrame(() => labels.update());
onChange(() => {
  lRiver.el.innerHTML = t('river');
  lShower.el.innerHTML = t('shower');
  lHit.el.innerHTML = t('impact');
  lDecay.el.innerHTML = t('decay');
});

TAMBO.labels = { labels, lNu, lTau, lShower, lHit, lDecay, eventLabels };
})();
