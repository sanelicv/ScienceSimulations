/* Ajustes de la simulación. Define también el espacio de nombres TAMBO. */
const TAMBO = {};

(function () {
// Unidades: 1 = 100 m. Valle de ~1.5 km de profundidad y ~4.5 km de ancho (como el Colca).
const C_LIGHT = 3;        // 0.3 km/μs = 3 unidades/μs
const US_PER_S = 1.6;     // 1 s de animación = 1.6 μs durante la cascada
const SKY_HORIZON = 0x8ea3bb, SKY_ZENITH = 0x2b4a78;
const BAR_RADIUS = 0.3;     // grosor de las barras
const BAR_PER_DECADE = 1.7; // altura que gana una barra cada vez que las partículas se multiplican por 10
const BAR_GROW_TIME = 0.8;  // segundos que tarda una barra en crecer
const CONE_OPACITY = 0.55;  // intensidad de la envolvente de la cascada
const CONE_REACH = 10;       // cuánto puede seguir la cascada ladera arriba tras tocar el suelo en su eje
const SHOWER_SPREAD = 0.085;  // cuánto se ensancha la cascada con la distancia
const CONE_GHOST = 0.35;    // cuánto se ve la envolvente a través de la montaña (0 = nada)
const CONE_REST = 0.35;     // intensidad que conserva la envolvente al terminar (fracción de CONE_OPACITY)
// Tracks ya recorridos: degradado desde su inicio hasta su final
// Neutrino: cian, para que resalte sobre el terreno
const NU_COLOR = 0x22e8ff;                                  // esfera y haz mientras viaja
const NU_TRAIL_FROM = 0x0b8fb0, NU_TRAIL_TO = 0x7af3ff;
const TAU_TRAIL_FROM = 0xe23c78, TAU_TRAIL_TO = 0xffa45e;   // termina en un tono cercano al de la cascada
const NU_TRAIL = 0x4fe6ff, TAU_TRAIL = 0xff6f8a;            // color de sus etiquetas
// Último paso: el track del neutrino y las barras parpadean a la vez en este color
const HIGHLIGHT_COLOR = 0xfff04d;
const HIGHLIGHT_PERIOD = 1.0;   // segundos que dura cada parpadeo
const TRACK_RADIUS = 0.075;     // grosor de los tracks (la trayectoria)
const PARTICLE_RADIUS = 0.24;   // tamaño de las esferas (la partícula)
const PARTICLE_GLOW_SIZE = 2.0; // tamaño del resplandor alrededor de la esfera
const TRACK_HALO_SIZE = 4;     // ancho del halo respecto al tubo
const TRACK_HALO_OPACITY = 0.42;
const VERTEX_GLOW_SIZE = 2;      // tamaño del resplandor que queda en el choque y el decaimiento
const VERTEX_GLOW_OPACITY = 0.8; // su intensidad
const TRACK_GHOST = 1.0;    // cuánto se ve un track ya recorrido a través de la roca
// Variedad de las direcciones del neutrino, en grados
const NU_AZIMUTH_MAX = 35;      // desvío horizontal máximo, a cada lado
const NU_ELEVATION_MIN = 1;     // ángulo de subida: casi horizontal, como en un neutrino que roza la Tierra
const NU_ELEVATION_MAX = 11;
const NU_LEN = 110, NU_SPEED = 55, TAU_SPEED = 2.2;

// Tamaños de config.js, según la pantalla (los mismos cortes que en style.css). Se aplican con
// reglas CSS: al girar el dispositivo o cambiar la ventana, se actualizan solos.
function sizeRules(section) {
  const fonts = Object.entries(CONFIG.fontSizes[section]).map(([name, px]) => `--fs-${name}: ${px * CONFIG.escalaGeneral}px;`);
  const buttons = Object.entries(CONFIG.botones[section]).map(([name, px]) => `--btn-${name}: ${px}px;`);
  const logo = `--logo-ancho: ${CONFIG.botones[section].logoAncho * CONFIG.escalaLogo}px;`;
  return fonts.concat(buttons, logo).join(' ');
}
const sizeStyle = document.createElement('style');
sizeStyle.textContent = `
  :root { ${sizeRules('escritorio')} }
  @media (max-width: 1100px), (pointer: coarse) { :root { ${sizeRules('tablet')} } }
  @media (max-width: 700px), (max-height: 500px) { :root { ${sizeRules('celular')} } }`;
document.head.appendChild(sizeStyle);

// Celulares y tablets: misma escena con menos carga para el procesador
const LITE = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 700;

TAMBO.settings = {
  C_LIGHT, US_PER_S, SKY_HORIZON, SKY_ZENITH,
  BAR_RADIUS, BAR_PER_DECADE, BAR_GROW_TIME,
  CONE_OPACITY, CONE_REACH, SHOWER_SPREAD, CONE_GHOST, CONE_REST,
  NU_COLOR, NU_TRAIL_FROM, NU_TRAIL_TO, TAU_TRAIL_FROM, TAU_TRAIL_TO, NU_TRAIL, TAU_TRAIL,
  HIGHLIGHT_COLOR, HIGHLIGHT_PERIOD, TRACK_RADIUS, PARTICLE_RADIUS, PARTICLE_GLOW_SIZE, TRACK_HALO_SIZE, TRACK_HALO_OPACITY, TRACK_GHOST, VERTEX_GLOW_SIZE, VERTEX_GLOW_OPACITY,
  NU_AZIMUTH_MAX, NU_ELEVATION_MIN, NU_ELEVATION_MAX, NU_LEN, NU_SPEED, TAU_SPEED, LITE,
};
})();
