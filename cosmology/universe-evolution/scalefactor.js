/**
 * Solves the Friedmann–Lemaître ODE (matter + Λ; no radiation).
 * Minimal fixes:
 *  - Remove Math.abs in H.
 *  - Detect the turning point by H^2 ≡ E(a) ≈ 0, not by a·H small.
 *  - Flip the sign once when E(a) <= eps; never take sqrt of a negative.
 *
 * @param {number} omegaM  Matter density parameter ΩM
 * @param {number} omegaDE Dark-energy density parameter ΩΛ
 * @param {number} H0      Hubble constant (km/s/Mly)
 * @param {number} a0      Initial scale factor a(tMin)
 * @param {number} tMin    Initial time (Mly/c units before normalization)
 * @param {number} tMax    Final time (Mly/c units before normalization)
 * @param {number} dt      Time step (normalized time units; see tH below)
 * @returns {{sol: Array<[t, a]>, tr: number|null}}
 */
/**
 * Solves the Friedmann–Lemaître ODE (matter + Λ; no radiation).
 * Now with detailed console messages for any interruption or non-physical event.
 */
function integrateFriedmannRK4({ omegaM, omegaDE, H0, a0, tMin, tMax, dt }) {
  const omegaK = 1 - omegaM - omegaDE;

  // Convert external times to "Hubble time units" so that dt is dimensionless.
  const absH0 = Math.max(Math.abs(H0), 1e-5);
  const tH = 299.5 / absH0; // ~ (c/H0) in Myr if H0 in km/s/Mly
  let t = tMin / tH;
  const tEnd = tMax / tH;

  let a = a0;
  let sgn = +1; // expansion (+1) or contraction (−1)
  let tr = null;
  const sol = [];

  function H2(aVal) {
    return omegaM / (aVal ** 3) + omegaDE + omegaK / (aVal ** 2);
  }

  function deriv(aVal) {
    const e = H2(aVal);
    if (e < 0) return NaN; // non-physical
    return sgn * aVal * Math.sqrt(e);
  }

  const EPS = 1e-6; // turning-point tolerance

  while (t <= tEnd && a > 0) {
    const t_real = t * tH;
    sol.push([t_real, a, sgn]);

    const eNow = H2(a);

    if (eNow < 0) {
      console.warn(
        `Integración detenida: E(a) < 0 (no físico) en t = ${t_real.toFixed(4)}, a = ${a.toFixed(6)}, E = ${eNow.toExponential(3)}`
      );
      break;
    }

    // Turning-point detection
    if (eNow <= EPS && tr === null) {
      tr = t;
      console.log(
        `Giro detectado: E(a) ≈ 0 en t = ${t_real.toFixed(4)}, a = ${a.toFixed(6)}`
      );
      sgn = -1;
      if (eNow === 0) a *= 1 - 1e-12;
    }

    // RK4 step
    const k1a = deriv(a);
    if (!isFinite(k1a)) {
      console.error(`Error numérico: derivada no finita en k1a (t = ${t_real.toFixed(4)}, a = ${a.toFixed(6)})`);
      break;
    }

    const a2 = a + 0.5 * dt * k1a;
    const k2a = deriv(a2);
    if( a2 < 0 ){
      console.warn(`Big Crunch detectado en  (t = ${t_real.toFixed(4)}, a = ${a2.toFixed(6)})`);
      break;
    }
    if (!isFinite(k2a)) {
      console.error(`Error numérico: derivada no finita en k2a (t = ${t_real.toFixed(4)}, a = ${a2.toFixed(6)})`);
      break;
    }

    const a3 = a + 0.5 * dt * k2a;
    const k3a = deriv(a3);
    if( a3 < 0 ){
      console.warn(`Big Crunch detectado en  (t = ${t_real.toFixed(4)}, a = ${a3.toFixed(6)})`);
      break;
    }
    if (!isFinite(k3a)) {
      console.error(`Error numérico: derivada no finita en k3a (t = ${t_real.toFixed(4)}, a = ${a3.toFixed(6)})`);
      break;
    }

    const a4 = a + dt * k3a;
    const k4a = deriv(a4);
    if( a4 < 0 ){
      console.warn(`Big Crunch detectado en  (t = ${t_real.toFixed(4)}, a = ${a4.toFixed(6)})`);
      break;
    }
    if (!isFinite(k4a)) {
      console.error(`Error numérico: derivada no finita en k4a (t = ${t_real.toFixed(4)}, a = ${a4.toFixed(6)})`);
      break;
    }

    a += (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
    t += dt;

    if (!isFinite(a) || a <= 0) {
      console.error(
        `Integración detenida: valor no físico de a (a = ${a}) en t = ${t_real.toFixed(4)}`
      );
      break;
    }
  }

  if (t > tEnd) {
    console.log("Integración completada correctamente (se alcanzó tMax).");
  }

  return { sol, tr };
}

// Ejemplo:
// const { sol, tr } = integrateFriedmannRK4({
//   omegaM: 3,
//   omegaDE: 0.1,
//   H0: 22,
//   a0: 1,
//   tMin: 0,
//   tMax: 10,
//   dt: 1e-3
// });
// console.log(sol[sol.length - 1], tr);
