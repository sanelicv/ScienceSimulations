/* Interfaz: menú, narración, leyenda y escala de color por tiempo. */
(function () {
SIM.buildPanel = function ({ title, subtitle, info, keys }) {
  const p = document.createElement('div');
  p.className = 'panel';
  p.innerHTML = `
    ${SIM.fromMenu ? '<a class="back" href="../../index.html">← Menú (M)</a>' : ''}
    <h1>${title}</h1>
    ${subtitle ? `<p class="sub">${subtitle}</p>` : ''}
    <div class="controls"></div>
    <div class="stats"></div>
    ${info ? `<div class="info">${info}</div>` : ''}
    <div class="keys">${keys ?? ''}Espacio: pausa · H: ocultar interfaz · F: pantalla completa · ratón: girar / zoom</div>`;
  document.body.appendChild(p);
  const controls = p.querySelector('.controls');
  const statsEl = p.querySelector('.stats');

  const api = {
    el: p,
    // Grupo de botones excluyentes
    radio(label, options, initial, onChange) {
      const g = document.createElement('div');
      g.className = 'group';
      g.innerHTML = `<div class="group-label">${label}</div><div class="row"></div>`;
      const row = g.querySelector('.row');
      const btns = {};
      const set = (val, fire = true) => {
        for (const k in btns) btns[k].classList.toggle('active', k === val);
        if (fire) onChange(val);
      };
      for (const o of options) {
        const b = document.createElement('button');
        b.className = 'btn';
        b.innerHTML = o.label + (o.key ? `<kbd>${o.key}</kbd>` : '');
        b.onclick = () => set(o.value);
        btns[o.value] = b;
        row.appendChild(b);
        if (o.key) window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === o.key.toLowerCase()) set(o.value); });
      }
      set(initial, false);
      controls.appendChild(g);
      return { set };
    },
    button(label, key, onClick, groupLabel) {
      const g = document.createElement('div');
      g.className = 'group';
      g.innerHTML = groupLabel ? `<div class="group-label">${groupLabel}</div>` : '';
      const b = document.createElement('button');
      b.className = 'btn';
      b.innerHTML = label + (key ? `<kbd>${key}</kbd>` : '');
      b.onclick = onClick;
      g.appendChild(b);
      controls.appendChild(g);
      if (key) window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === key.toLowerCase()) onClick(); });
      return b;
    },
    toggle(label, key, initial, onChange) {
      let state = initial;
      const b = api.button(label, key, () => { state = !state; b.classList.toggle('active', state); onChange(state); });
      b.classList.toggle('active', state);
      return { get: () => state, set: (v) => { state = v; b.classList.toggle('active', v); onChange(v); } };
    },
    slider(label, min, max, step, initial, fmt, onChange) {
      const g = document.createElement('div');
      g.className = 'group';
      g.innerHTML = `<div class="group-label">${label}</div>
        <div class="slider-row"><input class="slider" type="range" min="${min}" max="${max}" step="${step}" value="${initial}"><span></span></div>`;
      const inp = g.querySelector('input');
      const span = g.querySelector('span');
      const upd = () => { span.textContent = fmt(+inp.value); onChange(+inp.value); };
      inp.oninput = upd;
      span.textContent = fmt(initial);
      controls.appendChild(g);
      return inp;
    },
    stats(rows) {
      statsEl.innerHTML = rows.map(([k, v]) => `<div class="k">${k}</div><div class="v">${v}</div>`).join('');
    },
  };
  return api;
};

SIM.caption = (function () {
  let el = null;
  return function (html) {
    if (!el) { el = document.createElement('div'); el.className = 'caption'; document.body.appendChild(el); }
    el.innerHTML = html ?? '';
  };
})();

SIM.legend = function (html) {
  const el = document.createElement('div');
  el.className = 'legend';
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
};

// Escala de colores tiempo de llegada (convención de los event displays de IceCube/TAMBO)
SIM.timeColor = function (u, target = new THREE.Color()) {
  u = Math.min(1, Math.max(0, u));
  return target.setHSL(0.0 + 0.75 * u, 1.0, 0.55);
};
SIM.timeGradientCSS = 'linear-gradient(90deg, hsl(0,100%,55%), hsl(60,100%,55%), hsl(120,100%,55%), hsl(180,100%,55%), hsl(240,100%,60%), hsl(270,100%,60%))';
})();
