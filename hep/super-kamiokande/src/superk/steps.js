/* Tour guiado: las descripciones y la navegación entre las etapas del evento. */
(function () {
  const { t, onChange } = SUPERK.i18n;

  const ICON = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  const ICON_PREV = ICON('M15 5l-7 7 7 7');
  const ICON_NEXT = ICON('M9 5l7 7-7 7');
  const ICON_FINISH = ICON('M5 13l4.5 4.5L19 7');

  let active = false;     // si hay un tour en curso
  let holding = false;    // si el evento está detenido, esperando a que se avance
  let finishing = false;  // si está en el último paso, esperando a que se termine
  let current = 0;        // paso que se está mostrando
  let replayTarget = 0;   // al retroceder: paso hasta el que se recorre el evento sin detenerse
  let kind = 'muon';      // el leptón del evento: cambia las descripciones
  let onFinish = null, onBack = null;
  let prevBtn = null, nextBtn = null, textEls = [];

  function setButton(btn, icon, label, enabled) {
    btn.innerHTML = icon;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.disabled = !enabled;
  }

  // Solo se navega con la escena detenida; mientras avanza, las flechas quedan en reposo
  function refreshNav() {
    const stopped = holding || finishing;
    setButton(prevBtn, ICON_PREV, t('prevStep'), stopped && current > 1);
    if (finishing) setButton(nextBtn, ICON_FINISH, t('finishTour'), true);
    else setButton(nextBtn, ICON_NEXT, t('nextStep'), stopped);
  }

  function forward() {
    if (holding) {
      holding = false;
      refreshNav();
    } else if (finishing) {
      finishing = false;
      active = false;
      SIM.caption('');
      if (onFinish) onFinish();
    }
  }

  function back() {
    if (!active || !(holding || finishing) || current <= 1) return;
    holding = finishing = false;
    if (onBack) onBack(current - 1);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') forward();
    else if (e.key === 'ArrowLeft') back();
  });

  // Todas las descripciones ocupan la misma celda, ocultas salvo la actual: así la caja toma
  // desde el principio el tamaño de la más larga y no cambia al avanzar.
  function buildCaption() {
    SIM.caption(`<div class="step-box">
        <button class="btn step-nav step-prev"></button>
        <div class="step-body">
          <div class="step-texts">${t('steps', kind).map((text) => `<div class="step-text">${text}</div>`).join('')}</div>
        </div>
        <button class="btn step-nav next"></button>
      </div>`);
    const box = document.querySelector('.caption');
    textEls = [...box.querySelectorAll('.step-text')];
    prevBtn = box.querySelector('.step-prev');
    nextBtn = box.querySelector('.next');
    prevBtn.onclick = () => { prevBtn.blur(); back(); };
    nextBtn.onclick = () => { nextBtn.blur(); forward(); };
  }

  // Al cambiar de idioma, el tour sigue en el mismo paso con los textos traducidos
  onChange(() => {
    if (!active) return;
    t('steps', kind).forEach((text, i) => { textEls[i].innerHTML = text; });
    refreshNav();
  });

  SUPERK.steps = {
    get active() { return active; },
    get holding() { return holding; },
    get finishing() { return finishing; },
    get current() { return current; },
    get replaying() { return replayTarget > 0; },
    set onFinish(fn) { onFinish = fn; },
    set onBack(fn) { onBack = fn; },
    // Al lanzar un evento: guiado (con textos y pausas) o de corrido (sin textos)
    begin(guided, eventKind) {
      active = guided;
      kind = eventKind;
      holding = finishing = false;
      current = 0;
      if (guided) { buildCaption(); refreshNav(); }
      else SIM.caption('');
    },
    // Muestra la descripción de una etapa (de 1 a 6)
    show(n) {
      if (!active) return;
      current = n;
      textEls.forEach((el, i) => el.classList.toggle('current', i === n - 1));
      refreshNav();
    },
    // Detiene el evento hasta que se avance. Devuelve true si se detuvo.
    stop() {
      if (!active || current < replayTarget) return false;
      holding = true;
      refreshNav();
      return true;
    },
    // Último paso: la flecha pasa a ser el botón de terminar
    askFinish() {
      if (!active) return;
      finishing = true;
      refreshNav();
    },
    // Recorre el evento sin detenerse hasta el paso indicado
    replay(target, run) {
      replayTarget = target;
      run();
      replayTarget = 0;
    },
  };
})();
