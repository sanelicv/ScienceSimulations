/* ==========================================================================
   CONFIGURACIÓN GLOBAL DE LA SIMULACIÓN PTOLEMAICA 3D
   Modifica los valores en este archivo para ajustar el comportamiento del sistema.
   ========================================================================== */

window.CONFIG = {
  // Color de fondo de la escena Three.js (Gris oscuro)
  SCENE_BACKGROUND_COLOR: 0x0a0e17,

  // Intensidad de la luz ambiental (0.0 = penumbra total, 1.0 = luz uniforme)
  AMBIENT_LIGHT_INTENSITY: 0.0,
  // Intensidad de la luz emitida por el Sol
  SUN_LIGHT_INTENSITY: 10,

  // Radio de la Esfera Celeste
  SPHERE_RADIUS: 100000,
  // Radio de la órbita del Sol
  SUN_ORBIT_RADIUS: 1 * 2000,
  // Radio de la órbita (Deferente) de Venus
  VENUS_DEFERENT_RADIUS: 0.512 * 2000,
  // Radio del Epiciclo de Venus
  VENUS_EPICYCLE_RADIUS: 0.369 * 2000,

  // Velocidad angular del Sol y del centro del epiciclo de Venus (Período solar: 365.25 días ~ -1.7202 rad/t)
  SUN_ANGULAR_SPEED: -(2 * Math.PI * 100) / 365.25,

  // Velocidad angular propia del epiciclo de Venus (Período sideral de Venus: 224.70 días ~ -2.7963 rad/t)
  VENUS_EPICYCLE_SPEED: -(2 * Math.PI * 100) / 224.70,

  // Parámetros de Inclinación 3D para la Órbita del Epiciclo de Venus
  VENUS_INCLINATION: 3.39 * (Math.PI / 180),     // ~ 0.05917 rad (Inclinación orbital de Venus)
  VENUS_NODE_LONGITUDE: 76.68 * (Math.PI / 180), // ~ 1.33832 rad (Longitud del Nodo Ascendente)

  // --- PARÁMETROS PTOLEMAICOS PARA MARTE (Ptolomeo Estricto / Esferas Anidadas) ---
  MARS_DEFERENT_RADIUS: (60 / (60 - 39.5)) * 2000, // 5853.6585 u (Garantiza r_min = R_Sol)
  MARS_EPICYCLE_RADIUS: (39.5 / (60 - 39.5)) * 2000, // 3853.6585 u (Razón Almagesto 39.5/60)
  MARS_DEFERENT_SPEED: -(2 * Math.PI * 100) / 686.98,
  MARS_EPICYCLE_SPEED: -(2 * Math.PI * 100) / 365.25, // Idéntica a SUN_ANGULAR_SPEED
  MARS_INCLINATION: 1.0 * (Math.PI / 180), // Almagesto Libro XIII (1° para el deferente de Marte)
  MARS_NODE_LONGITUDE: 49.56 * (Math.PI / 180),
  MARS_RADIUS: 50,
  MARS_RADIUS_FOLLOW: 10,
  MARS_COLOR: '#ff5533',

  // --- PARÁMETROS PTOLEMAICOS PARA LA LUNA ---
  MOON_DEFERENT_RADIUS: 0.25 * 2000,
  MOON_EPICYCLE_RADIUS: 0.043 * 2000,
  MOON_DEFERENT_SPEED: -(2 * Math.PI * 100) / 27.32,
  MOON_EPICYCLE_SPEED: -(2 * Math.PI * 100) / 27.55,
  MOON_INCLINATION: 5.14 * (Math.PI / 180),
  MOON_NODE_LONGITUDE: 125.0 * (Math.PI / 180),
  MOON_RADIUS: 30,
  MOON_RADIUS_FOLLOW: 8,
  MOON_COLOR: '#e0e0e0',

  DEFAULT_SELECTED_ASTRO: 'venus',

  // Radios físicos de los astros en vista libre
  SUN_RADIUS: 100,
  EARTH_RADIUS: 50,
  VENUS_RADIUS: 50,
  // Radios físicos de los astros en modo seguimiento (Seguir Sol / Seguir Venus)
  SUN_RADIUS_FOLLOW: 100,
  EARTH_RADIUS_FOLLOW: 10,
  VENUS_RADIUS_FOLLOW: 10,

  // Inclinación inicial de la Eclíptica (grados)
  ECLIPTIC_TILT: 24,

  // Distancia máxima de alejamiento de la cámara (Zoom Máximo)
  MAX_ZOOM_DISTANCE: 50000,
  // Distancia mínima de acercamiento de la cámara (Zoom Mínimo)
  MIN_ZOOM_DISTANCE: 100,

  // Campo de visión (FOV) en modo seguimiento (grados)
  DEFAULT_FOV: 45, // Ángulo estándar de cámara
  MIN_FOV: 1,      // Zoom telescópico máximo (super aumento)
  MAX_FOV: 75,     // Gran angular máximo

  // Grosor / Ancho del tubo 3D de las órbitas en vista libre
  ORBIT_TUBE_RADIUS: 5,
  FOLLOW_ORBIT_TUBE_RADIUS: 0.5,

  // Coordenadas esféricas iniciales de la cámara:
  // 1. Distancia radial r desde el centro (0,0,0)
  CAMERA_RADIUS: 4000,
  CAMERA_AZIMUTH_ANGLE: 180,
  CAMERA_ELEVATION_ANGLE: 30,

  // Configuración de la Posición Aparente de Venus sobre la Esfera Celeste
  VENUS_APPARENT_POS_RADIUS: 120,  // Radio del círculo tangente en la esfera celeste
  VENUS_APPARENT_POS_COLOR: '#ff4444', // Color del círculo y rayo aparente

  // Configuración del Rastro Aparente (Trail) en Modo Seguimiento
  APPARENT_TRAIL_DAYS: 90,            // Días pasados a graficar en el rastro
  APPARENT_TRAIL_COLOR: '#ff3333',     // Color de los puntos del rastro (rojo contraste)
  APPARENT_TRAIL_SAMPLES_PER_DAY: 1,  // Densidad: cantidad de puntos/muestras por día
  APPARENT_TRAIL_POINT_SIZE: 6,       // Tamaño en píxeles de los puntos del rastro

  // Velocidad inicial del tiempo
  DEFAULT_SPEED: 1
};


// Alias globales directos para modificación ultra fácil en código o consola
window.AMBIENT_LIGHT_INTENSITY = window.CONFIG.AMBIENT_LIGHT_INTENSITY;
window.SUN_LIGHT_INTENSITY = window.CONFIG.SUN_LIGHT_INTENSITY;
window.SPHERE_RADIUS = window.CONFIG.SPHERE_RADIUS;
window.SUN_ORBIT_RADIUS = window.CONFIG.SUN_ORBIT_RADIUS;
window.VENUS_DEFERENT_RADIUS = window.CONFIG.VENUS_DEFERENT_RADIUS;
window.VENUS_EPICYCLE_RADIUS = window.CONFIG.VENUS_EPICYCLE_RADIUS;
window.EARTH_RADIUS = window.CONFIG.EARTH_RADIUS;
window.SUN_RADIUS = window.CONFIG.SUN_RADIUS;
window.VENUS_RADIUS = window.CONFIG.VENUS_RADIUS;
window.EARTH_RADIUS_FOLLOW = window.CONFIG.EARTH_RADIUS_FOLLOW;
window.SUN_RADIUS_FOLLOW = window.CONFIG.SUN_RADIUS_FOLLOW;
window.VENUS_RADIUS_FOLLOW = window.CONFIG.VENUS_RADIUS_FOLLOW;
window.MAX_ZOOM_DISTANCE = window.CONFIG.MAX_ZOOM_DISTANCE;
window.MIN_ZOOM_DISTANCE = window.CONFIG.MIN_ZOOM_DISTANCE;
window.DEFAULT_FOV = window.CONFIG.DEFAULT_FOV;
window.MIN_FOV = window.CONFIG.MIN_FOV;
window.MAX_FOV = window.CONFIG.MAX_FOV;
window.ORBIT_TUBE_RADIUS = window.CONFIG.ORBIT_TUBE_RADIUS;
window.ORBIT_TUBE_WIDTH = window.CONFIG.ORBIT_TUBE_RADIUS;
window.FOLLOW_ORBIT_TUBE_RADIUS = window.CONFIG.FOLLOW_ORBIT_TUBE_RADIUS;
window.FOLLOW_ORBIT_TUBE_WIDTH = window.CONFIG.FOLLOW_ORBIT_TUBE_RADIUS;
window.VENUS_EPICYCLE_SPEED = window.CONFIG.VENUS_EPICYCLE_SPEED;
window.SUN_ANGULAR_SPEED = window.CONFIG.SUN_ANGULAR_SPEED;
window.SUN_ORBIT_SPEED = window.CONFIG.SUN_ANGULAR_SPEED;
window.CAMERA_RADIUS = window.CONFIG.CAMERA_RADIUS;
window.CAMERA_AZIMUTH_ANGLE = window.CONFIG.CAMERA_AZIMUTH_ANGLE;
window.CAMERA_ELEVATION_ANGLE = window.CONFIG.CAMERA_ELEVATION_ANGLE;
window.CAMERA_AZIMUTH = window.CONFIG.CAMERA_AZIMUTH_ANGLE;
window.CAMERA_ELEVATION = window.CONFIG.CAMERA_ELEVATION_ANGLE;
window.CAMERA_THETA = window.CONFIG.CAMERA_AZIMUTH_ANGLE;
window.CAMERA_PHI = window.CONFIG.CAMERA_ELEVATION_ANGLE;
window.VENUS_APPARENT_POS_RADIUS = window.CONFIG.VENUS_APPARENT_POS_RADIUS;
window.VENUS_APPARENT_POS_COLOR = window.CONFIG.VENUS_APPARENT_POS_COLOR;
window.APPARENT_TRAIL_DAYS = window.CONFIG.APPARENT_TRAIL_DAYS;
window.APPARENT_TRAIL_COLOR = window.CONFIG.APPARENT_TRAIL_COLOR;
window.APPARENT_TRAIL_SAMPLES_PER_DAY = window.CONFIG.APPARENT_TRAIL_SAMPLES_PER_DAY;
window.APPARENT_TRAIL_POINT_SIZE = window.CONFIG.APPARENT_TRAIL_POINT_SIZE;
window.VENUS_INCLINATION = window.CONFIG.VENUS_INCLINATION;
window.VENUS_NODE_LONGITUDE = window.CONFIG.VENUS_NODE_LONGITUDE;
window.SCENE_BACKGROUND_COLOR = window.CONFIG.SCENE_BACKGROUND_COLOR;


