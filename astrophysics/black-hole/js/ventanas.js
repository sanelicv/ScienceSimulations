// Barra de menú y ventanas flotantes: abrir, cerrar, arrastrar y traer al frente.
(function () {
  'use strict';

  // Fórmulas: cada [data-tex] guarda su texto simple por si KaTeX no cargara
  document.querySelectorAll('[data-tex]').forEach(function (el) {
    window.katex.render(el.dataset.tex, el, { throwOnError: false });
  });

  const ALTO_BARRA = 48;
  const MARGEN = 12;

  const menu = new window.MenuBarController();
  const ventanas = Array.from(document.querySelectorAll('.ventana'));
  const casillaDe = (ventana) => document.querySelector('[data-ventana="' + ventana.id + '"]');
  let capaMaxima = 50;

  function traerAlFrente(ventana) {
    ventana.style.zIndex = ++capaMaxima;
  }

  function mover(ventana, x, y) {
    const maxX = window.innerWidth - ventana.offsetWidth;
    const maxY = window.innerHeight - ventana.offsetHeight;
    ventana.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    ventana.style.top = Math.max(ALTO_BARRA, Math.min(y, maxY)) + 'px';
  }

  const seSolapan = (a, b) => a.x < b.right && a.x + a.w > b.left && a.y < b.bottom && a.y + a.h > b.top;

  // Primera vez que se abre: columnas desde la izquierda, debajo de las que ya están abiertas
  function colocar(ventana) {
    const w = ventana.offsetWidth, h = ventana.offsetHeight;
    const abiertas = ventanas
      .filter((otra) => otra !== ventana && !otra.hidden)
      .map((otra) => otra.getBoundingClientRect());
    let x = MARGEN;
    let y = ALTO_BARRA + MARGEN;
    for (let intentos = 0; intentos < 40; intentos++) {
      const choque = abiertas.find((r) => seSolapan({ x, y, w, h }, r));
      if (!choque) break;
      y = choque.bottom + MARGEN;
      if (y + h > window.innerHeight) {
        x += w + MARGEN;
        y = ALTO_BARRA + MARGEN;
      }
    }
    mover(ventana, x, y);
    ventana.dataset.colocada = 'si';
  }

  function abrir(ventana) {
    ventana.hidden = false;
    if (!ventana.dataset.colocada) colocar(ventana);
    else mover(ventana, ventana.offsetLeft, ventana.offsetTop);
    traerAlFrente(ventana);
    casillaDe(ventana).checked = true;
  }

  function cerrar(ventana) {
    ventana.hidden = true;
    casillaDe(ventana).checked = false;
  }

  ventanas.forEach(function (ventana) {
    const casilla = casillaDe(ventana);
    const titulo = ventana.querySelector('.ventana-titulo');
    const botonCerrar = ventana.querySelector('.ventana-cerrar');

    casilla.addEventListener('change', () => (casilla.checked ? abrir(ventana) : cerrar(ventana)));
    ventana.addEventListener('pointerdown', () => traerAlFrente(ventana));

    botonCerrar.addEventListener('click', function () {
      cerrar(ventana);
      // El foco no debe perderse con la ventana: vuelve al menú que la puede abrir de nuevo
      document.getElementById('menu-ventanas').focus();
    });

    let inicio = null;
    titulo.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.ventana-cerrar')) return;
      inicio = { x: e.clientX - ventana.offsetLeft, y: e.clientY - ventana.offsetTop };
      titulo.setPointerCapture(e.pointerId);
    });
    titulo.addEventListener('pointermove', function (e) {
      if (inicio) mover(ventana, e.clientX - inicio.x, e.clientY - inicio.y);
    });
    const soltar = () => { inicio = null; };
    titulo.addEventListener('pointerup', soltar);
    titulo.addEventListener('pointercancel', soltar);
  });

  document.getElementById('b-cerrar-ventanas').addEventListener('click', function () {
    ventanas.forEach(cerrar);
  });

  // Mostrar u ocultar elementos que no son ventanas
  [['v-leyenda', 'leyenda'], ['v-etiquetas', 'etiquetas']].forEach(function (par) {
    const casilla = document.getElementById(par[0]);
    const elemento = document.getElementById(par[1]);
    casilla.addEventListener('change', () => { elemento.hidden = !casilla.checked; });
  });

  const botonPantalla = document.getElementById('b-pantalla');
  botonPantalla.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', function () {
    botonPantalla.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
  });

  window.addEventListener('resize', function () {
    ventanas.filter((v) => !v.hidden).forEach((v) => mover(v, v.offsetLeft, v.offsetTop));
  });

  // Las ventanas marcadas en el HTML empiezan abiertas
  ventanas.filter((v) => v.dataset.abierta !== undefined).forEach(abrir);
  menu.closeAllDropdowns();
})();
