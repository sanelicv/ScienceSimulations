/**
 * Config: Global Modular Configuration Parameters for Equatorial Coordinates Simulation
 */

export const OBLIQUITY_RAD = (23.44 * Math.PI) / 180; // Earth axial tilt ~ 23.44 deg
export const SCENE_BACKGROUND_COLOR = 0x0a0e17; // Color de fondo de la escena de Three.js

/**
 * Global customizable dimensions, opacities, colors, radii, and font styles for 3D celestial geometries
 */
export const GEOMETRY_CONFIG = {
  SPHERE_RADIUS: 120,

  // --- COLOR DE FONDO DE LA ESCENA ---
  SCENE_BACKGROUND_COLOR: 0x0a0e17,

  // --- LOCAL VIEW CELESTIAL SPHERE CONFIGURATION ---
  LOCAL_CELESTIAL_SPHERE_RADIUS: 10000, // Radio de la esfera celeste en vista local
  LANDSCAPE_GROUND_RADIUS: 2500,        // Radio del terreno/suelo
  MAX_VISUAL_DISTANCE: 500000,          // Límite de frustum lejano (far plane)

  // Personalización de la retícula / grid en vista local
  LOCAL_GRID_LINE_WIDTH: 0.5,           // Multiplicador de grosor de las líneas del grid en vista local
  LOCAL_GRID_LINE_COLOR: 0xffffff,      // Color de las líneas del grid en vista local
  LOCAL_GRID_LINE_OPACITY: 0.3,         // Opacidad de las líneas del grid en vista local
  LOCAL_SPHERE_SHELL_OPACITY: 0.05,     // Opacidad de la cáscara/superficie de la esfera en vista local

  // Celestial sphere shell appearance
  // --- SUPERFICIE DE LA ESFERA CELESTE ---
  SPHERE_COLOR: 0x1e293b,
  SPHERE_OPACITY: 0.4,

  // --- GRID ECUATORIAL (MERIDIANOS Y PARALELOS) ---
  GRID_LINE_COLOR: 0xffffff,
  GRID_LINE_OPACITY: 0.4,
  MERIDIAN_WIDTH: 0.1,              // Grosor de los 24 meridianos del grid
  PARALLEL_WIDTH: 0.1,              // Grosor de los paralelos de declinación del grid
  PARALLEL_ZERO_WIDTH: 0.1,         // Grosor especial para el paralelo de Declinación 0°
  PARALLEL_ZERO_COLOR: 0xffffff,
  PARALLEL_ZERO_OPACITY: 1.0,

  // --- MALLA DE COORDENADAS ECUATORIALES ---
  EQUATOR_LINE_WIDTH: 0.25,          // Grosor del aro del Ecuador Celeste
  EQUATOR_LINE_COLOR: '#e2e8f0',    // Color del aro del Ecuador Celeste
  MERIDIAN_MAJOR_WIDTH: 0.25,       // Grosor del arco del Meridiano 0h (Punto Vernal)
  MERIDIAN_MAJOR_COLOR: '#e2e8f0',  // Color del arco del Meridiano 0h
  HOUR_TICK_WIDTH: 0.1,             // Grosor de los ticks de horas en el Ecuador
  HOUR_TICK_COLOR: '#e2e8f0',       // Color de los ticks de horas en el Ecuador
  RA_LABEL_COLOR: '#e2e8f0',        // Color de las etiquetas de horas (0h..23h)
  RA_LABEL_FONT_SIZE: 48,           // Tamaño de fuente de las etiquetas de horas
  RA_LABEL_SCALE: 5,                // Escala visual 3D de las etiquetas de horas
  DEC_LABEL_COLOR: '#e2e8f0',       // Color de las etiquetas de declinación (-90°..+90°)
  DEC_LABEL_FONT_SIZE: 48,          // Tamaño de fuente de las etiquetas de declinación
  DEC_LABEL_SCALE: 5,               // Escala visual 3D de las etiquetas de declinación

  // --- OTROS ELEMENTOS Y AYUDAS VISUALES ---
  ECLIPTIC_LINE_WIDTH: 0.3,         // Grosor del anillo de la Eclíptica
  VERNAL_LINE_WIDTH: 0.3,           // Grosor del vector del Punto Vernal
  VERNAL_LINE_COLOR: 0xef4444,      // Color del vector del Punto Vernal
  BORDER_RING_WIDTH: 0.3,

  // Radios y color para las estrellas en 2D orientadas a la superficie
  STAR_CIRCLE_RADIUS: 1.0,
  STAR_CIRCLE_COLOR: 0x00FFFF,      // Color de las estrellas en la esfera celeste

  // --- CONFIGURACIÓN DE LA ESTRELLA GUÍA VECTORIAL ---
  // Arco meridiano (Declinación) y Arco ecuatorial (RA) de la Estrella Guía
  GUIDE_MERIDIAN_COLOR: 0xfacc15,
  GUIDE_MERIDIAN_WIDTH: 0.2,
  GUIDE_RA_ARC_COLOR: 0xfacc15,
  GUIDE_RA_ARC_WIDTH: 0.2,
  // Etiquetas de declinación y ascensión recta sobre los arcos de la Estrella Guía
  GUIDE_DEC_LABEL_COLOR: '#facc15',
  GUIDE_DEC_LABEL_FONT_SIZE: 48,
  GUIDE_RA_LABEL_COLOR: '#facc15',
  GUIDE_RA_LABEL_FONT_SIZE: 48,
  // Vector que une el origen con la Estrella Guía
  GUIDE_VECTOR_LINE_COLOR: 0xfacc15,
  GUIDE_VECTOR_LINE_WIDTH: 0.1,
  // Anillo de la Estrella Guía
  GUIDE_RING_INNER_RADIUS: 3.5,
  GUIDE_RING_OUTER_RADIUS: 4.5,
  GUIDE_RING_COLOR: 0xfacc15,

  // Fuente global para etiquetas
  LABEL_FONT_WEIGHT: 'normal',      // 'bold' | 'normal' | '500' | '600' | '700'
  STAR_INDEX_COLOR: '#38bdf8',      // Color para los números de índice de estrellas
  STAR_INDEX_FONT_SIZE: 32,
  STAR_INDEX_SCALE: 6,

  // --- PUNTOS CARDINALES (VISTA HORIZONTE) ---
  CARDINAL_LABEL_FONT_SIZE: 128,       // Tamaño de fuente para N, S, E, O
  CARDINAL_LABEL_COLOR: '#ffffff',    // Color de las letras cardinales
  CARDINAL_LABEL_SCALE: 25,           // Escala visual del sprite 3D
  CARDINAL_LABEL_HEIGHT: 15,          // Elevación / distancia al suelo (offset Y)
  CARDINAL_LABEL_DISTANCE: 500,       // Distancia radial desde el observador en el plano horizontal
  CARDINAL_LABEL_NORTH: 'N',          // Etiqueta Norte
  CARDINAL_LABEL_SOUTH: 'S',          // Etiqueta Sur
  CARDINAL_LABEL_EAST: 'E',           // Etiqueta Este
  CARDINAL_LABEL_WEST: 'O'            // Etiqueta Oeste
};

/**
 * Camera Configuration for Global / Local View switching
 */
export const CAMERA_CONFIG = {
  OBSERVER_EYE_HEIGHT: 1.0,
  LOCAL_VIEW_RADIUS: 0.1,
  DEFAULT_GLOBAL_FOV: 45,
  DEFAULT_LOCAL_FOV: 60,
  MIN_LOCAL_FOV: 1,
  MAX_LOCAL_FOV: 90,
  BASE_LOCAL_ROTATE_SPEED: -0.15,
  BASE_GLOBAL_ROTATE_SPEED: 1.0,

  // --- CONTROLES DE INERCIA Y DESACELERACIÓN ---
  ENABLE_DAMPING: true,
  DAMPING_FACTOR: 0.1, // (0.01 = mucha inercia / desaceleración muy suave, 0.2 = frenado rápido)

  // --- CONTROLES DE SMOOTH ZOOM (ZOOM INERCIAL EN VISTA GLOBAL) ---
  SMOOTH_ZOOM_DAMPING: 0.08,    // (0.01 = ultra inercial / suave, 0.2 = frenado rápido)
  ZOOM_SENSITIVITY: 0.001,      // Sensibilidad del scroll de la rueda del ratón
  MIN_GLOBAL_DISTANCE: 10,      // Distancia mínima permitida en vista global
  MAX_GLOBAL_DISTANCE: 2500,    // Distancia máxima permitida en vista global

  NEAR_PLANE: 0.05,
  FAR_PLANE: 500000,

  // --- POSICIÓN INICIAL DE LA CÁMARA EN VISTA GLOBAL ---
  INITIAL_GLOBAL_CAMERA_POS: { x: 300, y: 120, z: -300 }
};

