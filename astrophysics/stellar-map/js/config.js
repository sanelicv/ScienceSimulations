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

  // --- ESCALA Y DIMENSIONES VISUALES 3D NORMALIZADAS ---
  MIN_STAR_VISUAL_DISTANCE: 500,   // Distancia fija en unidades 3D para la estrella más cercana (d_min)
  PLANE_SIZE_FACTOR: 1.5,          // Multiplicador del tamaño del plano respecto a la estrella más lejana (d_max_visual * PLANE_SIZE_FACTOR)
  CELESTIAL_SPHERE_FACTOR: 0.5,    // Radio de la Esfera Celeste Global respecto a la estrella más cercana (MIN_STAR_VISUAL_DISTANCE * CELESTIAL_SPHERE_FACTOR)

  // --- ESCALA DE LUMINOSIDAD Y LEY 1/d² ---
  LUMINOSITY_SCALING_ENABLED: false, // Activar/desactivar escalado por luminosidad
  USE_LOGARITHMIC_APPARENT_BRIGHTNESS: false, // true = escala logarítmica (magnitud astronómica), false = escala lineal directa (L/d²)
  LUMINOSITY_LOG_FACTOR: 0.35,      // Factor k de aceleración logarítmica para log10(L)
  LUMINOSITY_MIN_SCALE: 0.4,        // Factor de escala mínimo relativo al tamaño base
  LUMINOSITY_MAX_SCALE: 4.0,        // Factor de escala máximo relativo al tamaño base
  APPARENT_BRIGHTNESS_MIN_SCALE: 0.1, // Límite inferior de escala 3D para Ley 1/d²
  APPARENT_BRIGHTNESS_MAX_SCALE: 50.0,   // Límite superior de escala 3D para Ley 1/d²
  APPARENT_BRIGHTNESS_INTENSITY: 1.0,  // Intensidad de la Ley 1/d² (0.0 = 0% efecto / uniforme, 1.0 = 100% efecto real)

  // --- VISTA GLOBAL / MAPA 3D ---
  GLOBAL_STAR_MIN_RADIUS_PX: 2.0,   // Radio mínimo estricto en píxeles de pantalla (Vista Global)
  GLOBAL_STAR_MAX_RADIUS_PX: 24.0,  // Radio máximo estricto en píxeles de pantalla (Vista Global)

  // --- VISTA LOCAL / OBSERVADOR (ZOOM = 0) ---
  LOCAL_SPHERE_RADIUS: 100,        // Radio en unidades 3D de la Esfera Celeste Local (Vista Observador)
  LOCAL_MODE_ZOOM_THRESHOLD: 10.0,  // Umbral de distancia de cámara al origen para activar automáticamente la Esfera Local
  LOCAL_STAR_MIN_RADIUS_PX: 1.5,   // Radio mínimo estricto en píxeles de pantalla (Vista Observador)
  LOCAL_STAR_MAX_RADIUS_PX: 12.0,  // Radio máximo estricto en píxeles de pantalla (Vista Observador)
  LOCAL_MODE_STAR_SIZE_DEFAULT: 1.5, // Multiplicador base del slider en vista local
  LOCAL_MODE_STAR_SIZE_MIN: 0.1,   // Tamaño mínimo del slider en vista local
  LOCAL_MODE_STAR_SIZE_MAX: 3.0,    // Tamaño máximo del slider en vista local
  GLOBAL_MODE_STAR_SIZE_DEFAULT: 5.0, // Multiplicador base del slider en vista global (Zoom > 0)

  // --- CONTROL DE FOV CON RUEDA DEL RATÓN EN VISTA LOCAL (ZOOM = 0) ---
  LOCAL_FOV_WHEEL_ENABLED: true,   // Activar la manipulación de FOV con la rueda del ratón en vista local (Zoom = 0)
  LOCAL_FOV_DEFAULT: 45.0,         // FOV por defecto en grados al entrar a vista local
  LOCAL_FOV_MIN: 5.0,              // FOV mínimo en grados (máximo acercamiento / telescopio)
  LOCAL_FOV_MAX: 45.0,            // FOV máximo en grados (gran angular / ojo de pez)
  LOCAL_FOV_STEP: 3.0,             // Sensibilidad / variación de FOV en grados por cada movimiento de la rueda

  // --- ESTÉTICA Y HALO DE ESTRELLAS (GLOW) ---
  STAR_GLOW_ENABLED: true,       // Activar/desactivar halo radial procedural alrededor de las estrellas
  STAR_CORE_RATIO: 0.15,         // Radio relativo del núcleo blanco denso (0.0 a 1.0)
  STAR_HALO_INTENSITY: 0.85,      // Intensidad y transparencia del halo difuso (0.0 a 1.0)
  STAR_HALO_FALLOFF: 5,        // Velocidad de decaimiento del halo (mayor = halo más compacto)
  STAR_HIGHLIGHT_COLOR: 0x38bdf8, // Color hexadecimal de resaltado (highlight) al pasar el mouse sobre una estrella
  STAR_HIGHLIGHT_SCALE_BOOST: 1.00, // Multiplicador de tamaño (escala 3D) de la estrella al pasar el mouse sobre ella

  // --- COLOR DE FONDO DE LA ESCENA ---
  SCENE_BACKGROUND_COLOR: 0x0a0e17,

  // --- LOCAL VIEW CELESTIAL SPHERE CONFIGURATION ---
  LOCAL_CELESTIAL_SPHERE_RADIUS: 10000, // Radio de la esfera celeste en vista local
  LANDSCAPE_GROUND_RADIUS: 2500,        // Radio del terreno/suelo
  MAX_VISUAL_DISTANCE: 500000,          // Límite de frustum lejano (far plane)

  // Personalización de la retícula / grid en vista local
  LOCAL_GRID_RADIUS: 100,               // Radio en unidades 3D de la Esfera Celeste y Grid en vista local
  LOCAL_GRID_LINE_WIDTH: 0.5,           // Multiplicador de grosor de las líneas del grid en vista local
  LOCAL_GRID_LINE_COLOR: 0xffffff,      // Color de las líneas del grid en vista local
  LOCAL_GRID_LINE_OPACITY: 0.3,         // Opacidad de las líneas del grid en vista local
  LOCAL_GRID_ZERO_DEC_COLOR: 0x38bdf8,  // Color celeste (cyan/light blue) para el círculo central de Declinación 0°
  LOCAL_GRID_ZERO_DEC_OPACITY: 0.8,     // Opacidad para el círculo central de Declinación 0°
  LOCAL_SPHERE_SHELL_OPACITY: 0.05,     // Opacidad de la cáscara/superficie de la esfera en vista local

  // --- PUNTO VERNAL EN MODO LOCAL ---
  LOCAL_VERNAL_CIRCLE_COLOR: 0xff3333,   // Color del círculo indicador del Punto Vernal en modo local
  LOCAL_VERNAL_CIRCLE_RADIUS: 2.5,       // Radio en unidades 3D del círculo del Punto Vernal
  LOCAL_VERNAL_CIRCLE_OPACITY: 0.5,      // Opacidad del círculo del Punto Vernal

  // Celestial sphere shell appearance
  // --- SUPERFICIE DE LA ESFERA CELESTE ---
  SHOW_SPHERE_SURFACE: true,        // Activar (true) o desactivar (false) la visibilidad de la superficie esférica translúcida
  SPHERE_COLOR: 0x1e293b,            // Color de la superficie esférica
  SPHERE_OPACITY: 0.25,              // Opacidad de la superficie esférica (0.0 a 1.0)

  // --- GRID ECUATORIAL (MERIDIANOS Y PARALELOS) ---
  GRID_LINE_COLOR: 0xffffff,
  GRID_LINE_OPACITY: 0.2,
  GRID_LINE_WIDTH_PX: 1,           // Grosor en píxeles de pantalla para los meridianos y paralelos (fijo e independiente de la distancia y zoom)
  MERIDIAN_WIDTH: 0.05,              // Grosor de los 24 meridianos del grid
  PARALLEL_WIDTH: 0.05,              // Grosor de los paralelos de declinación del grid
  PARALLEL_ZERO_WIDTH: 0.05,         // Grosor especial para el paralelo de Declinación 0°
  PARALLEL_ZERO_COLOR: 0xffffff,
  PARALLEL_ZERO_OPACITY: 1.0,

  // --- MALLA DE COORDENADAS ECUATORIALES ---
  EQUATORIAL_COORDS_OPACITY: 1.0,     // Opacidad de las líneas de la malla (aro, meridiano 0h y ticks)
  EQUATORIAL_LABELS_OPACITY: 1.0,     // Opacidad de las etiquetas numéricas de texto (horas y declinaciones)
  EQUATOR_LINE_WIDTH_PX: 2.0,         // Grosor en píxeles de pantalla para el aro del Ecuador Celeste (0.0 para ocultar)
  EQUATOR_LINE_WIDTH: 0.0,          // Grosor alternativo en unidades 3D
  EQUATOR_LINE_COLOR: '#070707',    // Color del aro del Ecuador Celeste
  MERIDIAN_MAJOR_WIDTH_PX: 2.0,      // Grosor en píxeles de pantalla para el Meridiano 0h (0.0 para ocultar)
  MERIDIAN_MAJOR_WIDTH: 0.0,       // Grosor alternativo en unidades 3D
  MERIDIAN_MAJOR_COLOR: '#e2e8f0',  // Color del arco del Meridiano 0h
  HOUR_TICK_WIDTH_PX: 2.0,          // Grosor en píxeles fijos de pantalla para los ticks de horas en el Ecuador
  HOUR_TICK_WIDTH: 0.1,             // Grosor de los ticks de horas en el Ecuador
  HOUR_TICK_COLOR: '#e2e8f0',       // Color de los ticks de horas en el Ecuador
  RA_LABEL_COLOR: '#e2e8f0',        // Color de las etiquetas de horas (0h..23h)
  RA_LABEL_FONT_SIZE: 24,           // Tamaño de fuente de las etiquetas de horas
  RA_LABEL_SCALE: 5,                // Escala visual 3D de las etiquetas de horas
  DEC_LABEL_COLOR: '#e2e8f0',       // Color de las etiquetas de declinación (-90°..+90°)
  DEC_LABEL_FONT_SIZE: 24,          // Tamaño de fuente de las etiquetas de declinación
  DEC_LABEL_SCALE: 5,               // Escala visual 3D de las etiquetas de declinación

  // --- OTROS ELEMENTOS Y AYUDAS VISUALES ---
  ECLIPTIC_LINE_WIDTH: 0.3,         // Grosor del anillo de la Eclíptica
  VERNAL_LINE_WIDTH: 0.3,           // Grosor del vector del Punto Vernal
  VERNAL_LINE_COLOR: 0xef4444,      // Color del vector del Punto Vernal
  BORDER_RING_WIDTH: 0.3,

  // Radios y color para las estrellas en 2D orientadas a la superficie
  STAR_CIRCLE_RADIUS: 1.0,
  STAR_CIRCLE_COLOR: 0x00FFFF,      // Color de las estrellas en la esfera celeste

  // --- CONFIGURACIÓN DE LA FLECHA GUÍA VECTORIAL ---
  // Cabeza de la flecha (cono) con punta fija exactamente en el radio de la esfera celeste (distancia d)
  GUIDE_CONE_LENGTH_FACTOR: 0.04,     // Longitud del cono como factor del radio d (ej. 0.04 = 4% de d)
  GUIDE_CONE_RADIUS_FACTOR: 0.015,    // Radio de la base del cono como factor del radio d (ej. 0.015 = 1.5% de d)
  GUIDE_CONE_COLOR: 0xfacc15,         // Color de la cabeza de la flecha / cono

  // Color y grosor unificado en píxeles fijos de pantalla para las líneas de la Estrella/Flecha Guía
  GUIDE_LINE_COLOR: 0xfacc15,          // Color unificado (arcos RA, Dec, vector origen y proyección)
  GUIDE_LINE_WIDTH_PX: 3.0,           // Grosor en píxeles fijos de pantalla (pantalla independiente de zoom/distancia)

  // Arcos y Vectores individuales (mantenidos para retrocompatibilidad o personalización avanzada)
  GUIDE_MERIDIAN_COLOR: 0xfacc15,
  GUIDE_RA_ARC_COLOR: 0xfacc15,
  GUIDE_VECTOR_LINE_COLOR: 0xfacc15,

  // Etiquetas de declinación y ascensión recta sobre los arcos de la Estrella Guía
  GUIDE_DEC_LABEL_COLOR: '#facc15',
  GUIDE_DEC_LABEL_FONT_SIZE: 24,
  GUIDE_DEC_LABEL_SCALE_FACTOR: 0.15,  // Factor de escala 3D proporcional al radio (d) de la esfera guía
  GUIDE_RA_LABEL_COLOR: '#facc15',
  GUIDE_RA_LABEL_FONT_SIZE: 24,
  GUIDE_RA_LABEL_SCALE_FACTOR: 0.15,   // Factor de escala 3D proporcional al radio (d) de la esfera guía

  // Etiquetas y Ticks de ascensión recta (RA) sobre el grid ecuatorial de la Estrella Guía
  GUIDE_GRID_RA_TICK_WIDTH_PX: 2.0,       // Grosor en píxeles fijos de pantalla para los segmentos de los ticks del grid RA de la guía
  GUIDE_GRID_RA_TICK_COLOR: '#e2e8f0',      // Color de los segmentos de los ticks de la guía
  GUIDE_GRID_RA_LABEL_COLOR: '#e2e8f0',
  GUIDE_GRID_RA_LABEL_FONT_SIZE: 24,
  GUIDE_GRID_RA_LABEL_SCALE_FACTOR: 0.15, // Factor de escala 3D proporcional al radio (d) de la esfera guía

  // Marcador / Anillo de la Estrella Guía
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
  CARDINAL_LABEL_WEST: 'O',           // Etiqueta Oeste

  // --- TOOLTIP FLOTANTE Y RAYCASTING ---
  SHOW_STAR_TOOLTIP: true,            // Activar/Desactivar la inspección al pasar el mouse por las estrellas
  TOOLTIP_BG_COLOR: 'rgba(15, 23, 42, 0.85)',
  TOOLTIP_BORDER_COLOR: 'rgba(56, 189, 248, 0.4)',
  TOOLTIP_FONT_SIZE: '1.25rem',       // Tamaño de fuente del tooltip flotante (ej. '0.85rem', '14px')
  TOOLTIP_WIDTH: 'auto'               // Ancho del tooltip flotante (ej. '240px', 'auto')
};

/**
 * Camera Configuration for Global / Local View switching
 */
export const CAMERA_CONFIG = {
  OBSERVER_EYE_HEIGHT: 1.0,
  LOCAL_VIEW_RADIUS: 0.1,
  DEFAULT_GLOBAL_FOV: 45,
  DEFAULT_LOCAL_FOV: 60,
  MIN_LOCAL_FOV: 5,
  MAX_LOCAL_FOV: 120,
  LOCAL_FOV_STEP: 3.0,
  BASE_LOCAL_ROTATE_SPEED: -0.15,
  BASE_GLOBAL_ROTATE_SPEED: 1.0,

  // --- CONTROLES DE NAVEGACIÓN LIBRE WASD ---
  FREE_FLY_SPEED_FACTOR: 0.35,       // Rapidez WASD normal como fracción del tamaño de la simulación por segundo (ej: 0.35 = recorre 35% del radio visual por segundo)
  FREE_FLY_SHIFT_SPEED_FACTOR: 0.05,  // Rapidez al mantener presionado Shift
  FREE_FLY_MOUSE_SENSITIVITY: 0.002, // Sensibilidad de rotación al arrastrar el ratón

  // --- CONTROLES DE INERCIA Y DESACELERACIÓN ---
  ENABLE_DAMPING: true,
  DAMPING_FACTOR: 0.2, // (0.01 = mucha inercia / desaceleración muy suave, 0.2 = frenado rápido)

  // --- CONTROLES DE SMOOTH ZOOM (ZOOM INERCIAL EN VISTA GLOBAL) ---
  SMOOTH_ZOOM_DAMPING: 0.08,    // (0.01 = ultra inercial / suave, 0.2 = frenado rápido)
  ZOOM_SENSITIVITY: 0.001,      // Sensibilidad del scroll de la rueda del ratón
  MIN_GLOBAL_DISTANCE: 10,      // Distancia mínima permitida en vista global
  MAX_GLOBAL_DISTANCE_FACTOR: 0.75, // Factor multiplicador de la longitud del lado del plano horizontal para la distancia máxima de la cámara y slider en vista global

  NEAR_PLANE: 0.05,
  FAR_PLANE: 500000,

  // --- POSICIÓN INICIAL DE LA CÁMARA EN VISTA GLOBAL ---
  INITIAL_GLOBAL_CAMERA_POS: { x: 300, y: 120, z: -300 }
};

