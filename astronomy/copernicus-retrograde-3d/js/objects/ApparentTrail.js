import * as THREE from 'three';

/**
 * ApparentTrail - Rastro de Posiciones Aparentes de Venus sobre la Esfera Celeste.
 * Renderiza un conjunto de puntos estelares discretos e inmóviles proyectados
 * desde la Tierra hacia Venus durante los últimos X días de simulación.
 */
export class ApparentTrail extends THREE.Group {
  constructor(sphereRadius = 20000) {
    super();

    this.sphereRadius = sphereRadius;
    this.allocatedSamples = 0;

    const initialColor = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_COLOR) || window.APPARENT_TRAIL_COLOR || '#ff3333';
    const initialSize = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_POINT_SIZE !== undefined)
      ? window.CONFIG.APPARENT_TRAIL_POINT_SIZE
      : (window.APPARENT_TRAIL_POINT_SIZE !== undefined ? window.APPARENT_TRAIL_POINT_SIZE : 8);

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(initialColor),
      size: initialSize,
      sizeAttenuation: false // Puntos de tamaño en píxeles de pantalla constante (estilo estrellas)
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.add(this.points);

    // Evitar frustum culling para prevenir que Three.js oculte los puntos al rotar la cámara
    this.points.frustumCulled = false;
    this.frustumCulled = false;

    this.visible = false; // Desactivado por defecto hasta que se active en modo seguir o toggle aparente
  }

  /**
   * Actualiza los puntos del rastro sobre la Esfera Celeste.
   * Soporta selección dinámica de astro activo ('venus', 'mars', 'moon').
   * Reutiliza un único Float32Array para prevenir memory leaks WebGL VBO.
   */
  update(currentDay, sphereRadius, activeAstroKey = 'venus') {
    if (!this.visible) return;

    const R = sphereRadius || (window.CONFIG && window.CONFIG.SPHERE_RADIUS) || window.SPHERE_RADIUS || this.sphereRadius;

    // Obtener parámetros globales de configuración
    const days = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_DAYS !== undefined)
      ? window.CONFIG.APPARENT_TRAIL_DAYS : (window.APPARENT_TRAIL_DAYS || 120);
    const samplesPerDay = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_SAMPLES_PER_DAY !== undefined)
      ? window.CONFIG.APPARENT_TRAIL_SAMPLES_PER_DAY : (window.APPARENT_TRAIL_SAMPLES_PER_DAY || 1);
    
    // Obtener color del astro activo desde CONFIG
    const apparentColors = (window.CONFIG && window.CONFIG.APPARENT_COLORS) || {
      venus: '#ff4444',
      mars: '#ff5533',
      moon: '#44aaff'
    };
    const trailColorHex = apparentColors[activeAstroKey] || (window.CONFIG && window.CONFIG.APPARENT_TRAIL_COLOR) || '#ff3333';
    const pointSize = (window.CONFIG && window.CONFIG.APPARENT_TRAIL_POINT_SIZE !== undefined)
      ? window.CONFIG.APPARENT_TRAIL_POINT_SIZE : (window.APPARENT_TRAIL_POINT_SIZE || 8);

    // Actualización dinámica de material si cambió color o tamaño
    if (this.material.size !== pointSize) {
      this.material.size = pointSize;
    }
    const currentColorHex = '#' + this.material.color.getHexString();
    if (currentColorHex.toLowerCase() !== trailColorHex.toLowerCase()) {
      this.material.color.set(trailColorHex);
    }

    // Parámetros orbitales heliocéntricos de la Tierra
    const earthPeriod = (window.CONFIG && window.CONFIG.EARTH_ORBITAL_PERIOD) || 365.25;
    const earthSpeed = -(2 * Math.PI) / (earthPeriod / 100);
    let earthRadius = (window.CONFIG && window.CONFIG.EARTH_ORBIT_RADIUS) || 2000;
    const earthInitialDeg = (window.CONFIG && window.CONFIG.EARTH_INITIAL_ANGLE) || 0;
    const earthPhase = earthInitialDeg * (Math.PI / 180);

    // Parámetros del astro activo seleccionado
    let astroPeriod = 224.7;
    let astroRadius = 1446;
    let astroInitialDeg = 45;
    let astroInclinationDeg = 3.39;
    const isGeocentricSatellite = (activeAstroKey === 'moon');

    if (activeAstroKey === 'mars') {
      astroPeriod = (window.CONFIG && window.CONFIG.MARS_ORBITAL_PERIOD) || 686.98;
      astroRadius = (window.CONFIG && window.CONFIG.MARS_ORBIT_RADIUS) || 3048;
      astroInitialDeg = (window.CONFIG && window.CONFIG.MARS_INITIAL_ANGLE) || 90;
      astroInclinationDeg = (window.CONFIG && window.CONFIG.MARS_INCLINATION) || 1.85;
    } else if (activeAstroKey === 'moon') {
      astroPeriod = (window.CONFIG && window.CONFIG.MOON_ORBITAL_PERIOD) || 27.32;
      astroRadius = (window.CONFIG && window.CONFIG.MOON_ORBIT_RADIUS) || 350;
      astroInitialDeg = (window.CONFIG && window.CONFIG.MOON_INITIAL_ANGLE) || 0;
      astroInclinationDeg = (window.CONFIG && window.CONFIG.MOON_INCLINATION) || 5.14;
    } else {
      // Venus (Default)
      astroPeriod = (window.CONFIG && window.CONFIG.VENUS_ORBITAL_PERIOD) || 224.7;
      astroRadius = (window.CONFIG && window.CONFIG.VENUS_ORBIT_RADIUS) || 1446;
      astroInitialDeg = (window.CONFIG && window.CONFIG.VENUS_INITIAL_ANGLE) || 45;
      astroInclinationDeg = (window.CONFIG && window.CONFIG.VENUS_INCLINATION) || 3.39;
    }

    // Escala realista
    if (window.app && window.app.isRealisticMode) {
      const R_Sol = (window.CONFIG && window.CONFIG.SUN_RADIUS_REALISTIC) || 80;
      const ratios = (window.CONFIG && window.CONFIG.REALISTIC_RATIOS) || {
        EARTH_ORBIT_RADIUS: 149597870 / 696340,
        VENUS_ORBIT_RADIUS: 108208000 / 696340,
        MARS_ORBIT_RADIUS: 227939200 / 696340,
        MOON_ORBIT_RADIUS: 384400 / 696340
      };
      earthRadius = R_Sol * ratios.EARTH_ORBIT_RADIUS;
      if (activeAstroKey === 'mars') astroRadius = R_Sol * ratios.MARS_ORBIT_RADIUS;
      else if (activeAstroKey === 'moon') astroRadius = R_Sol * ratios.MOON_ORBIT_RADIUS;
      else astroRadius = R_Sol * ratios.VENUS_ORBIT_RADIUS;
    }

    const astroSpeed = -(2 * Math.PI) / (astroPeriod / 100);
    const astroPhase = astroInitialDeg * (Math.PI / 180);
    const eulerTilt = new THREE.Euler(astroInclinationDeg * (Math.PI / 180), 0, 0, 'XYZ');

    // Cálculo de número de puntos y gestión de BufferAttribute
    const totalPoints = Math.max(1, Math.floor(days * samplesPerDay));
    let posAttr = this.geometry.getAttribute('position');

    if (!posAttr || this.allocatedSamples !== totalPoints) {
      const positions = new Float32Array(totalPoints * 3);
      posAttr = new THREE.BufferAttribute(positions, 3);
      this.geometry.setAttribute('position', posAttr);
      this.allocatedSamples = totalPoints;
    }

    const vertices = posAttr.array;

    // Determinación de la ventana de tiempo de los últimos X días
    const lastSampleIndex = Math.floor(currentDay * samplesPerDay);
    const firstSampleIndex = lastSampleIndex - totalPoints + 1;

    const dir = new THREE.Vector3();
    const astroWorld = new THREE.Vector3();

    for (let i = 0; i < totalPoints; i++) {
      const sampleIndex = firstSampleIndex + i;
      const sampleDay = sampleIndex / samplesPerDay;
      const sampleTime = sampleDay * 0.01;

      // Posición heliocéntrica de la Tierra a tiempo sampleTime
      const earthAngle = earthSpeed * sampleTime + earthPhase;
      const earthX = earthRadius * Math.cos(earthAngle);
      const earthZ = earthRadius * Math.sin(earthAngle);
      const earthPos = new THREE.Vector3(earthX, 0, earthZ);

      // Posición del astro activo a tiempo sampleTime
      const astroAngle = astroSpeed * sampleTime + astroPhase;
      const aLocalX = astroRadius * Math.cos(astroAngle);
      const aLocalZ = astroRadius * Math.sin(astroAngle);

      if (isGeocentricSatellite) {
        // La Luna orbita alrededor de la Tierra
        const moonOffset = new THREE.Vector3(aLocalX, 0, aLocalZ).applyEuler(eulerTilt);
        astroWorld.copy(earthPos).add(moonOffset);
      } else {
        // Planetas heliocéntricos (Venus, Marte) orbitan alrededor del Sol
        astroWorld.set(aLocalX, 0, aLocalZ).applyEuler(eulerTilt);
      }

      // Vector director de la visión desde la Tierra hacia el astro
      dir.set(astroWorld.x - earthX, astroWorld.y - earthPos.y, astroWorld.z - earthZ);
      if (dir.lengthSq() > 0) {
        dir.normalize();
      }

      // Intersección del rayo desde la Tierra (earthPos) a través del astro con la Esfera Celeste centrada en (0,0,0) de radio R
      const b = earthPos.dot(dir);
      const c = earthPos.lengthSq() - R * R;
      const discriminant = b * b - c;

      let spherePoint;
      if (discriminant >= 0) {
        const t = -b + Math.sqrt(discriminant);
        spherePoint = earthPos.clone().add(dir.clone().multiplyScalar(t));
      } else {
        spherePoint = dir.clone().multiplyScalar(R);
      }

      // Posición proyectada exacta en la Esfera Celeste
      vertices[i * 3] = spherePoint.x;
      vertices[i * 3 + 1] = spherePoint.y;
      vertices[i * 3 + 2] = spherePoint.z;
    }

    posAttr.needsUpdate = true;
  }
}
