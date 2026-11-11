/* Ajustes técnicos de la simulación. Define también el espacio de nombres SUPERK. */
const SUPERK = {};

(function () {
// Unidades: 1 = 1 m. El tanque está en el origen; la cima del monte Ikeno, unos 1000 m encima.
// Detector interno (el que ven los fotomultiplicadores): 33.8 m de diámetro y 36.2 m de alto.
const R = 16.9, HH = 18.1;              // radio y media altura del detector interno
const R_OUT = 19.65, HH_OUT = 20.7;      // tanque completo, con el detector externo (39.3 m × 41.4 m)
const N_WATER = 1.334;                   // índice de refracción del agua
const CHER = Math.acos(1 / N_WATER);     // ángulo Cherenkov: unos 41°
const C_VAC = 0.2998;                    // velocidad de la luz en el vacío, m/ns (el leptón va casi a esta)
const C_WATER = C_VAC / N_WATER;         // velocidad de la luz en el agua, m/ns
const ATT = 80;                          // longitud de atenuación de la luz en el agua ultrapura, m
const NS_PER_S = 24;                     // 1 s de animación = 24 ns durante la luz
const GUIDED_NS_FACTOR = 0.6;            // en el tour, la luz avanza más despacio

// Neutrino
const NU_COLOR = 0x22e8ff;               // esfera y haz mientras viaja
const NU_TRAIL_FROM = 0x0b8fb0, NU_TRAIL_TO = 0x7af3ff;   // rastro que queda
const NU_TRAIL = 0x4fe6ff;               // color de su etiqueta cuando ya pasó
const NU_LEN = 140;                      // recorrido visible en "Nuevo evento", m (empieza dentro de la roca)
const NU_SPEED = 70;                     // m por segundo de animación en "Nuevo evento"
const NU_TOUR_LEN = 2600;                // en el tour: recorrido completo, desde fuera de la montaña
const NU_TOUR_REST = 1300;               // en el primer paso, a cuántos metros del choque espera
const NU_TOUR_K = 0.9;                   // en el tour, se acerca cada vez más despacio (fracción por segundo)
const NU_TOUR_MIN_SPEED = 16;            // ...sin bajar de esta velocidad, m/s
const NU_DOWN_MAX = 1;                   // direcciones: de -1 (sube desde abajo) a 1 (baja del cielo); todas valen

// Evento del tour guiado: siempre el mismo, para que la explicación sea clara y se repita igual.
// Un neutrino muónico horizontal (paralelo al techo y al fondo) que pasa por el centro del tanque;
// el muón nace cerca del centro y sigue la misma dirección, así el cono se abre por completo y
// dibuja un anillo entero en la pared.
const TOUR_NU_DIR = [-0.67, 0, -0.75];   // dirección horizontal (se normaliza); el anillo queda frente a la vista inicial
const TOUR_VERTEX_BACK = 1.5;            // el choque, a esta distancia antes del centro (m)
const TOUR_MUON_LEN = 3.5;               // recorrido del muón (m): el anillo cabe entero en la pared
const TOUR_SEED = 7;                     // semilla del azar de la luz: los mismos fotomultiplicadores cada vez

// Leptones: muón en rojo y naranja; electrón en naranja cálido, como una cascada
const LEPTONS = {
  muon: { active: 0xff7a59, from: 0xe23c78, to: 0xffa45e, label: 0xff6f8a },
  electron: { active: 0xffb347, from: 0xff7b2e, to: 0xffd28a, label: 0xffb347 },
};
const MUON_E_MIN = 0.5, MUON_E_MAX = 2.6;     // energía del muón, GeV (pierde unos 0.23 GeV por metro)
const MUON_MIN_LEN = 2.5;                     // se descartan muones que salen del tanque casi enseguida
const ELECTRON_E_MIN = 0.3, ELECTRON_E_MAX = 1.4;
const ELECTRON_LEN = 2.5;                     // la cascada del electrón mide unos 2 a 3 m
const ELECTRON_TRACK = 0.9;                   // tramo dibujado del electrón antes de que se disperse

// Luz Cherenkov
const LIGHT_COLOR = [0.2, 0.36, 0.62];   // fotones (azul); tenue porque se suman muchos y no deben saturar a blanco
const LIGHT_HEX = 0x8fd0ff;              // el mismo color, para el cono
const CONE_OPACITY = 0.45;               // intensidad del cono de luz
const PHOTON_LENGTH = 1.6;               // largo de cada fotón dibujado, m
const WALL_PHOTONS = 0.6;                // fotones extra que caen entre fotomultiplicadores, por cada uno que enciende uno

// Fotomultiplicadores (tamaño real: 50 cm de diámetro)
const PMT_RADIUS = 0.25;
const PMT_IDLE = 0x3d3424;               // fotocátodo dorado oscuro, apagado (oscuro para que resalte el anillo)
const PMT_GROW_MAX = 2.8;                // con marca 'tamano': cuánto crece el que más luz recibe
const BAR_RADIUS = 0.13;                 // grosor de las barras (marca 'barras')
const MARK_GROW_TIME = 0.35;             // segundos que tarda una marca en crecer

// Último paso: el track del neutrino y los fotomultiplicadores parpadean a la vez en este color
const HIGHLIGHT_COLOR = 0xfff04d;
const HIGHLIGHT_PERIOD = 1.0;

// Tracks y marcas (a la distancia de la vista inicial; en la vista de la montaña se agrandan)
const TRACK_RADIUS = 0.09;
const PARTICLE_RADIUS = 0.3;
const PARTICLE_GLOW_SIZE = 2.2;
const TRACK_HALO_SIZE = 4;
const TRACK_HALO_OPACITY = 0.42;
const TRACK_GHOST = 1.0;                 // cuánto se ve un track a través de la roca
const VERTEX_GLOW_SIZE = 2.2;
const VERTEX_GLOW_OPACITY = 0.8;
const VIEW_REF_DIST = 70;                // distancia de cámara a la que los tamaños anteriores son los reales

// Entorno
const SKY_HORIZON = 0xa9bfd3, SKY_ZENITH = 0x34598c;
const CAVE_DARK = 0x07080b;              // lo que se ve detrás de la roca translúcida, y la niebla de la caverna

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

SUPERK.settings = {
  R, HH, R_OUT, HH_OUT, N_WATER, CHER, C_VAC, C_WATER, ATT, NS_PER_S, GUIDED_NS_FACTOR,
  NU_COLOR, NU_TRAIL_FROM, NU_TRAIL_TO, NU_TRAIL, NU_LEN, NU_SPEED, NU_TOUR_LEN, NU_TOUR_REST, NU_TOUR_K, NU_TOUR_MIN_SPEED, NU_DOWN_MAX,
  TOUR_NU_DIR, TOUR_VERTEX_BACK, TOUR_MUON_LEN, TOUR_SEED,
  LEPTONS, MUON_E_MIN, MUON_E_MAX, MUON_MIN_LEN, ELECTRON_E_MIN, ELECTRON_E_MAX, ELECTRON_LEN, ELECTRON_TRACK,
  LIGHT_COLOR, LIGHT_HEX, CONE_OPACITY, PHOTON_LENGTH, WALL_PHOTONS: LITE ? WALL_PHOTONS * 0.5 : WALL_PHOTONS,
  PMT_RADIUS, PMT_IDLE, PMT_GROW_MAX, BAR_RADIUS, MARK_GROW_TIME,
  HIGHLIGHT_COLOR, HIGHLIGHT_PERIOD,
  TRACK_RADIUS, PARTICLE_RADIUS, PARTICLE_GLOW_SIZE, TRACK_HALO_SIZE, TRACK_HALO_OPACITY, TRACK_GHOST, VERTEX_GLOW_SIZE, VERTEX_GLOW_OPACITY, VIEW_REF_DIST,
  SKY_HORIZON, SKY_ZENITH, CAVE_DARK, LITE,
};
})();
