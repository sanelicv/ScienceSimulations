/* Idiomas: todos los textos de la simulación, en español e inglés. Para corregir uno, edítalo aquí. */
(function () {
  const C = (color, text) => `<span style="color:var(--${color})">${text}</span>`;

  // Cómo se marca la cantidad de luz, según config.js (marcaPMT)
  const BARS = CONFIG.marcaPMT === 'barras';

  const TEXTS = {
    es: {
      // Menú y controles
      newEvent: 'Nuevo evento',
      guidedTour: 'Tour guiado',
      fullscreen: 'Pantalla completa (F)',
      exitFullscreen: 'Salir de pantalla completa (F)',
      language: 'Idioma',
      prevStep: 'Paso anterior (←)',
      nextStep: 'Paso siguiente (→)',
      finishTour: 'Finalizar el tour (→)',
      // Etiquetas sobre la escena
      impact: 'choque',
      light: 'luz Cherenkov',
      mountain: 'Monte Ikeno',
      unrolled: 'El tanque desplegado: techo, pared y fondo',
      // Leyenda
      legendColor: '<b>Color:</b> cuándo llegó la luz',
      legendBefore: 'antes',
      legendAfter: 'después',
      legendAmount: BARS ? '<b>Altura:</b> cuánta luz' : '<b>Tamaño:</b> cuánta luz',
      // Descripciones del tour guiado, según el leptón que nace en el choque
      steps(kind) {
        const muon = kind === 'muon';
        const NU = C('neutrino', muon ? 'neutrino muónico' : 'neutrino electrónico');
        const LEP = muon ? C('muon', 'muón') : C('electron', 'electrón');
        return [
          `Un ${NU}, nacido en la atmósfera, viaja hacia <b>Super-Kamiokande</b>: un detector enterrado 1000 m bajo el monte Ikeno, en Japón. La roca frena casi todas las demás partículas, pero el neutrino la atraviesa sin problema, e incluso puede cruzar la Tierra entera.`,
          'El neutrino llega al <b>tanque</b>: 50 000 toneladas de agua ultrapura, con las paredes cubiertas por unos 11 000 <b>fotomultiplicadores</b>, sensores capaces de detectar un solo fotón.',
          `De los muchísimos neutrinos que cruzan el tanque, solo unos pocos al día <b>chocan</b> con un núcleo del agua. Este lo hizo y se transformó en un ${LEP}, ` +
            (muon ? 'una partícula con carga eléctrica unas 200 veces más pesada que el electrón.' : 'una partícula con carga eléctrica.'),
          muon
            ? `El ${LEP} viaja más rápido que la luz en el agua, que allí va un 25 % más lenta que en el vacío. Como un avión que rompe la barrera del sonido, deja una onda de choque: un <b>cono de luz azul</b>, la luz Cherenkov.`
            : `El ${LEP} también supera a la luz en el agua, que allí va un 25 % más lenta que en el vacío, y emite luz Cherenkov. Pero choca enseguida con los átomos y produce una pequeña <b>cascada</b> de partículas, cada una con su luz en una dirección algo distinta.`,
          `Desde dentro del tanque: la luz llega a las paredes y cada fotomultiplicador que la recibe se enciende. El <b>color</b> indica cuándo llegó y ${BARS ? 'la <b>altura</b> de su barra' : 'el <b>tamaño</b>'}, cuánta luz recibió. Juntos dibujan un <b>anillo</b>.`,
          `Un anillo de <b>borde ${muon ? 'nítido' : 'difuso'}</b> delata ${muon ? 'un muón' : 'un electrón'} y, por tanto, un ${NU}. La cantidad de luz revela su energía, y el anillo, su dirección. Comparando los que bajan del cielo con los que suben atravesando la Tierra, Super-K descubrió en 1998 que los neutrinos cambian de tipo.`,
        ];
      },
    },
    en: {
      newEvent: 'New event',
      guidedTour: 'Guided tour',
      fullscreen: 'Full screen (F)',
      exitFullscreen: 'Exit full screen (F)',
      language: 'Language',
      prevStep: 'Previous step (←)',
      nextStep: 'Next step (→)',
      finishTour: 'Finish the tour (→)',
      impact: 'interaction',
      light: 'Cherenkov light',
      mountain: 'Mount Ikeno',
      unrolled: 'The tank unrolled: top, wall and bottom',
      legendColor: '<b>Color:</b> when the light arrived',
      legendBefore: 'earlier',
      legendAfter: 'later',
      legendAmount: BARS ? '<b>Height:</b> how much light' : '<b>Size:</b> how much light',
      steps(kind) {
        const muon = kind === 'muon';
        const NU = C('neutrino', muon ? 'muon neutrino' : 'electron neutrino');
        const LEP = muon ? C('muon', 'muon') : C('electron', 'electron');
        return [
          `A ${NU}, born in the atmosphere, travels toward <b>Super-Kamiokande</b>: a detector buried 1000 m under Mount Ikeno, in Japan. The rock stops almost every other particle, but the neutrino passes through it with ease, and can even cross the entire Earth.`,
          'The neutrino reaches the <b>tank</b>: 50,000 tonnes of ultrapure water, with walls covered by about 11,000 <b>photomultipliers</b>, sensors able to detect a single photon.',
          `Of the countless neutrinos crossing the tank, only a few per day <b>strike</b> a nucleus in the water. This one did, and turned into ${muon ? 'a' : 'an'} ${LEP}, ` +
            (muon ? 'an electrically charged particle about 200 times heavier than the electron.' : 'an electrically charged particle.'),
          muon
            ? `The ${LEP} travels faster than light does in water, where light is 25% slower than in vacuum. Like a plane breaking the sound barrier, it leaves a shock wave: a <b>cone of blue light</b>, called Cherenkov light.`
            : `The ${LEP} also outruns light in water, where light is 25% slower than in vacuum, and emits Cherenkov light. But it soon collides with atoms and produces a small <b>shower</b> of particles, each shining in a slightly different direction.`,
          `From inside the tank: the light reaches the walls and every photomultiplier it touches lights up. The <b>color</b> shows when it arrived and ${BARS ? 'the <b>height</b> of its bar' : 'the <b>size</b>'}, how much light it received. Together they draw a <b>ring</b>.`,
          `A ring with a <b>${muon ? 'sharp' : 'fuzzy'} edge</b> reveals ${muon ? 'a muon' : 'an electron'}, and therefore ${muon ? 'a' : 'an'} ${NU}. The amount of light gives its energy, and the ring, its direction. By comparing those coming down from the sky with those coming up through the Earth, Super-K discovered in 1998 that neutrinos change type.`,
        ];
      },
    },
  };

  const STORAGE_KEY = 'superk-lang';
  const listeners = [];

  // El idioma inicial lo decide index.html, para que también el aviso de carga salga traducido
  let lang = TEXTS[document.documentElement.lang] ? document.documentElement.lang : 'es';

  SUPERK.i18n = {
    get lang() { return lang; },
    t: (key, ...args) => {
      const v = TEXTS[lang][key];
      return typeof v === 'function' ? v(...args) : v;
    },
    // Avisa a quien muestre textos cuando cambie el idioma
    onChange: (fn) => listeners.push(fn),
    setLang(next) {
      if (next === lang || !TEXTS[next]) return;
      lang = next;
      document.documentElement.lang = lang;
      // Solo se guarda lo que elige el usuario. Si el navegador lo bloquea, simplemente no se recuerda.
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* no se recuerda */ }
      for (const fn of listeners) fn();
    },
  };
})();
