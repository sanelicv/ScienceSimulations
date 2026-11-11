/* Espacio de nombres de las utilidades compartidas.
 * Usa la versión clásica (global THREE) de three.js r147 para poder abrir
 * los archivos con doble clic, sin servidor y sin internet. */
const SIM = {};

// Abierta desde el menú general (?menu=1). Sin ese parámetro, la simulación funciona sola.
SIM.fromMenu = new URLSearchParams(window.location.search).has('menu');
