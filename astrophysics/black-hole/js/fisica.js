// Física del modelo de cascada (río de espacio), en coordenadas de Gullstrand-Painlevé:
//   ds² = -c²dt² + |dx - v dt|²,   v = -c √(rs/r) r̂
// El tiempo t es el que marca un reloj que cae con el espacio y las rebanadas de t
// constante son euclidianas, por eso las distancias r se pueden dibujar sin deformar.
(function (raiz) {
  'use strict';

  const C_KM_S = 299792.458;
  const RS_KM_POR_MASA_SOLAR = 2.953;
  const C = 8; // c en unidades de escena por segundo de simulación (cámara lenta)

  // Radio de Schwarzschild en km para una masa en masas solares.
  function radioSchwarzschildKm(masa) {
    return masa * RS_KM_POR_MASA_SOLAR;
  }

  // Rapidez de caída del espacio en r, como fracción de c.
  function rapidezEspacio(r, rs) {
    return Math.sqrt(rs / r);
  }

  // Avanza radialmente con el flujo. dr/dt = -c√(rs/r) tiene solución exacta en r^(3/2).
  function caer(r, rs, dt) {
    const u = Math.pow(r, 1.5) - 1.5 * C * Math.sqrt(rs) * dt;
    return u > 0 ? Math.pow(u, 2 / 3) : 0;
  }

  // Velocidad neta dr/dt (fracción de c) de algo que avanza radialmente hacia afuera
  // con rapidez beta medida respecto al espacio local.
  function velocidadContraCorriente(r, rs, beta) {
    return beta - rapidezEspacio(r, rs);
  }

  // Fracción que un reloj quieto en r se atrasa frente a uno muy lejano: 1 - √(1 - rs/r).
  // Escrita así para no perder precisión cuando rs/r es diminuto (Sol, Tierra).
  function atrasoGravitatorio(r, rs) {
    const x = rs / r;
    return x / (1 + Math.sqrt(1 - x));
  }

  // Γ - 1, con t = Γτ y Γ = 1/√(1 - rs/r), para un reloj quieto en r > rs.
  function gammaMenosUno(r, rs) {
    const a = atrasoGravitatorio(r, rs);
    return a / (1 - a);
  }

  // Gravedad en m/s² que mide un observador quieto en r: (c² rs / 2r²) Γ.
  function gravedadLocal(rKm, rsKm) {
    const gamma = 1 + gammaMenosUno(rKm, rsKm);
    return (1000 * C_KM_S * C_KM_S * rsKm * gamma) / (2 * rKm * rKm);
  }

  // Ecuaciones de Hamilton de un rayo de luz, con H = c|p| + v·p:
  //   dx/dt = c p̂ + v,   dp_i/dt = -(∂_i v_j) p_j
  // Son las geodésicas nulas exactas de la métrica; p̂ es la dirección de propagación
  // medida por quien cae con el espacio.
  function derivadasRayo(s, d, rs) {
    const x = s[0], y = s[1], z = s[2], px = s[3], py = s[4], pz = s[5];
    const r2 = x * x + y * y + z * z;
    const r = Math.sqrt(r2);
    const p = Math.sqrt(px * px + py * py + pz * pz);
    const k = C * Math.sqrt(rs);
    const r32 = r * Math.sqrt(r);
    d[0] = (C * px) / p - (k * x) / r32;
    d[1] = (C * py) / p - (k * y) / r32;
    d[2] = (C * pz) / p - (k * z) / r32;
    const q = (1.5 * (x * px + y * py + z * pz)) / (r2 * r32);
    d[3] = k * (px / r32 - q * x);
    d[4] = k * (py / r32 - q * y);
    d[5] = k * (pz / r32 - q * z);
  }

  const k1 = new Float64Array(6), k2 = new Float64Array(6), k3 = new Float64Array(6),
    k4 = new Float64Array(6), aux = new Float64Array(6);

  // Paso RK4; s = [x, y, z, px, py, pz] se modifica en su lugar.
  function pasoRayo(s, rs, dt) {
    let i;
    derivadasRayo(s, k1, rs);
    for (i = 0; i < 6; i++) aux[i] = s[i] + 0.5 * dt * k1[i];
    derivadasRayo(aux, k2, rs);
    for (i = 0; i < 6; i++) aux[i] = s[i] + 0.5 * dt * k2[i];
    derivadasRayo(aux, k3, rs);
    for (i = 0; i < 6; i++) aux[i] = s[i] + dt * k3[i];
    derivadasRayo(aux, k4, rs);
    for (i = 0; i < 6; i++) s[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }

  // Avanza un rayo un tiempo dt con subpasos proporcionales a r/c.
  function avanzarRayo(s, rs, dt) {
    let resta = dt;
    while (resta > 0) {
      const r = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
      const h = Math.min(resta, Math.max((0.04 * r) / C, 1e-3));
      pasoRayo(s, rs, h);
      resta -= h;
      if (r < 0.05 * rs) return;
    }
  }

  const Fisica = {
    C, C_KM_S, radioSchwarzschildKm, rapidezEspacio, caer,
    velocidadContraCorriente, gammaMenosUno, gravedadLocal, avanzarRayo,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Fisica;
  else raiz.Fisica = Fisica;
})(typeof window !== 'undefined' ? window : globalThis);
