/* Configuration variables for the Solar System Creator */

const CONFIG = {
  // Luz ambiental general de la escena (ej: 150 o [R, G, B])
  ambientLight: 200,

  // Radio del Sol en píxeles/unidades
  sunRadius: 20,

  // Radio base de la Tierra en píxeles (proporción 1.0) para el cálculo de escalas
  earthRadius: 12,

  // Distancia prudencial inicial en píxeles entre el nombre y la línea de la órbita
  labelDistance: 0,

  // Factor de escalado de la distancia del nombre según el radio de la órbita
  labelDistanceScaleFactor: 0.01,
  // Tamaños de fuente para los nombres de las órbitas
  labelBaseFontSize: 12,

  // Factor de escalado del tamaño de la fuente según el radio de la órbita
  labelScaleFactor: 0.05,

  belt: {
    // Color RGBA para la corona circular del cinturón (ej: [R, G, B, Alpha])
    coronaColor: [0, 0, 255, 100],
    // Color material para las partículas de asteroides del cinturón
    particleColor: 180
  }
};

// Accesos directos globales por conveniencia
const AMBIENT_LIGHT = CONFIG.ambientLight;
const SUN_RADIUS = CONFIG.sunRadius;
const EARTH_RADIUS = CONFIG.earthRadius;
const LABEL_DISTANCE = CONFIG.labelDistance;
const LABEL_DISTANCE_SCALE_FACTOR = CONFIG.labelDistanceScaleFactor;
const LABEL_BASE_FONT_SIZE = CONFIG.labelBaseFontSize;
const LABEL_SCALE_FACTOR = CONFIG.labelScaleFactor;
const BELT_CORONA_COLOR = CONFIG.belt.coronaColor;
const BELT_PARTICLE_COLOR = CONFIG.belt.particleColor;
