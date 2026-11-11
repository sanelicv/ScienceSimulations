// Configuration parameters for the Ellipse Eccentricity simulation

window.CONFIG = {
  // Geometric parameters
  geometry: {
    baseSemiMajorAxis: 500,  // Tamaños objetivo en px (se adapta automáticamente en pantallas más pequeñas)
    minEccentricity: 0.00,   // Minimum eccentricity (e = 0: circle)
    maxEccentricity: 0.95,   // Maximum eccentricity
    focusRadius: 5,          // Radius of focus dots in pixels
    screenMargin: 60         // Margen de pantalla para evitar recorte en pantallas pequeñas
  },

  // Visual styles
  style: {
    backgroundColor: "#ffffff",
    ellipseStrokeColor: "#000000",
    ellipseLineWidth: 2,
    focusFillColor: "#ff0000"
  }
};
