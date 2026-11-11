/* Menú, atajo de teclado y leyenda. */
(function () {
  const { setManualRockView } = TAMBO.terrain;
  const { newEvent, startGuide } = TAMBO.event;
  const i18n = TAMBO.i18n;
  const { t } = i18n;

// Menú mínimo para dejar libre la escena: logo, un evento de corrido o la demostración guiada
const panel = SIM.buildPanel({ title: '<img class="logo" src="src/assets/tambo-logo-white.png" width="1200" height="334" alt="TAMBO">' });
panel.el.classList.add('compact');
const newBtn = panel.button(t('newEvent'), 'n', newEvent);
const tourBtn = panel.button(t('guidedTour'), 'g', startGuide);
i18n.onChange(() => {
  newBtn.innerHTML = `${t('newEvent')}<kbd>n</kbd>`;
  tourBtn.innerHTML = `${t('guidedTour')}<kbd>g</kbd>`;
});

// Esquina superior derecha: idioma y pantalla completa
const corner = document.createElement('div');
corner.className = 'corner-tools';
document.body.appendChild(corner);

const langToggle = document.createElement('div');
langToggle.className = 'lang-toggle';
langToggle.setAttribute('role', 'group');
langToggle.innerHTML = ['es', 'en'].map((code) => `<button type="button" data-lang="${code}">${code.toUpperCase()}</button>`).join('');
const langButtons = [...langToggle.querySelectorAll('button')];
for (const b of langButtons) b.onclick = () => { b.blur(); i18n.setLang(b.dataset.lang); };
const refreshLang = () => {
  langToggle.setAttribute('aria-label', t('language'));
  for (const b of langButtons) {
    const on = b.dataset.lang === i18n.lang;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  }
};
i18n.onChange(refreshLang);
refreshLang();
corner.appendChild(langToggle);

// Pantalla completa: un icono en la esquina. Algunos dispositivos (como el iPhone) no la permiten:
// ahí no se muestra. El atajo F ya lo atiende la aplicación base.
if (document.fullscreenEnabled) {
  const ICON = (path) => `<svg class="fs-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="${path}"/></svg>`;
  const EXPAND = ICON('M1 5.5V1h4.5M10.5 1H15v4.5M15 10.5V15h-4.5M5.5 15H1v-4.5');
  const SHRINK = ICON('M5.5 1v4.5H1M15 5.5h-4.5V1M10.5 15v-4.5H15M1 10.5h4.5V15');
  const fsBtn = document.createElement('button');
  fsBtn.className = 'btn fs-btn';
  fsBtn.onclick = () => {
    fsBtn.blur();
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };
  const refresh = () => {
    const on = !!document.fullscreenElement;
    const label = t(on ? 'exitFullscreen' : 'fullscreen');
    fsBtn.innerHTML = on ? SHRINK : EXPAND;
    fsBtn.title = label;
    fsBtn.setAttribute('aria-label', label);
  };
  document.addEventListener('fullscreenchange', refresh);
  i18n.onChange(refresh);
  refresh();
  corner.appendChild(fsBtn);
}

// La roca semitransparente sigue disponible con la tecla T
let rockSeeThrough = false;
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 't') return;
  rockSeeThrough = !rockSeeThrough;
  setManualRockView(rockSeeThrough);
});
const legendHtml = () => `${t('legendColor')}
  <div class="bar" style="background:${SIM.timeGradientCSS}"></div>
  <div class="ends"><span>${t('legendBefore')}</span><span>${t('legendAfter')}</span></div>
  <div class="sep"></div>
  <div class="barkey"><i style="height:6px"></i><i style="height:13px"></i><i style="height:22px"></i><span>${t('legendHeight')}</span></div>`;
const legend = SIM.legend(legendHtml());
i18n.onChange(() => { legend.innerHTML = legendHtml(); });
})();
