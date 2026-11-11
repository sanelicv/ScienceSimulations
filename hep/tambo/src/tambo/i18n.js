/* Idiomas: todos los textos de la simulación, en español e inglés. Para corregir uno, edítalo aquí. */
(function () {
  const NU_ES = '<span style="color:var(--neutrino)">neutrino tau</span>';
  const NU_EN = '<span style="color:var(--neutrino)">tau neutrino</span>';
  const TAU = '<span style="color:var(--tau)">tau</span>';

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
      river: 'Río',
      shower: 'cascada de partículas',
      impact: 'choque',
      decay: 'decae',
      // Leyenda
      legendColor: '<b>Color:</b> cuándo llegó la cascada',
      legendBefore: 'antes',
      legendAfter: 'después',
      legendHeight: '<b>Altura:</b> cuántas partículas',
      // Descripciones del tour guiado
      steps: [
        `<b>El ${NU_ES}</b> es una partícula sin carga y casi sin masa, que apenas interactúa con la materia. Puede atravesar kilómetros de roca de la montaña.`,
        `Dentro de la roca, el ${NU_ES} <b>impacta</b> con un núcleo atómico. Solo alrededor de 1 de cada 1000 lo hace.`,
        `<b>Nace un ${TAU}</b>: una partícula cargada que sale de la roca al aire del valle. Vive menos de una billonésima de segundo, pero gracias a la relatividad recorre cientos de metros.`,
        '<b>El tau decae</b> y produce una <b>cascada</b> de millones de partículas que cruza el valle a casi la velocidad de la luz.',
        '<b>La cascada llega a la ladera</b> y cada detector tocado se enciende. Esto es representado gráficamente por barras: cuantas más partículas recibe, más alta crece.',
        'La huella queda dibujada en la ladera. Conociendo <b>cuántas</b> partículas llegaron a cada detector (altura) y <b>cuándo</b> (color) se reconstruyen la energía y la dirección del neutrino.',
      ],
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
      river: 'River',
      shower: 'particle shower',
      impact: 'impact',
      decay: 'decay',
      legendColor: '<b>Color:</b> when the shower arrived',
      legendBefore: 'earlier',
      legendAfter: 'later',
      legendHeight: '<b>Height:</b> how many particles',
      steps: [
        `<b>The ${NU_EN}</b> is a particle with no charge and almost no mass, which barely interacts with matter. It can pass through kilometers of mountain rock.`,
        `Inside the rock, the ${NU_EN} <b>strikes</b> an atomic nucleus. Only about 1 in 1000 do.`,
        `<b>A ${TAU} is born</b>: a charged particle that leaves the rock and enters the air of the valley. It lives for less than a trillionth of a second, but thanks to relativity it travels hundreds of meters.`,
        '<b>The tau decays</b> and produces a <b>shower</b> of millions of particles that crosses the valley at nearly the speed of light.',
        '<b>The shower reaches the slope</b> and each detector it touches lights up. This is shown graphically with bars: the more particles a detector receives, the taller its bar grows.',
        'The footprint is now drawn on the slope. Knowing <b>how many</b> particles reached each detector (height) and <b>when</b> (color), we can reconstruct the energy and direction of the neutrino.',
      ],
    },
  };

  const STORAGE_KEY = 'tambo-lang';
  const listeners = [];

  // El idioma inicial lo decide index.html, para que también el aviso de carga salga traducido
  let lang = TEXTS[document.documentElement.lang] ? document.documentElement.lang : 'es';

  TAMBO.i18n = {
    get lang() { return lang; },
    t: (key) => TEXTS[lang][key],
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
