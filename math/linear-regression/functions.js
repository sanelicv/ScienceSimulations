/* ---- Estadística y utilidades para el sketch ---- */

/**
 * Ajuste lineal por chi-cuadrado sin pesos explícitos (w_i = 1).
 * Modelo: y = a + b x
 * Devuelve {a, b, sigma_a, sigma_b, cov_ab, chi2, dof, s2, xRange, yRange}
 */
function chi2LinearFit(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) throw new Error("Se requieren al menos 2 puntos.");

  let S = n, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i];
    Sx  += x;
    Sy  += y;
    Sxx += x * x;
    Sxy += x * y;
  }
  const Delta = S * Sxx - Sx * Sx;
  if (Delta === 0) throw new Error("Puntos degenerados (Δ=0).");

  const b = (S * Sxy - Sx * Sy) / Delta;
  const a = (Sxx * Sy - Sx * Sxy) / Delta;

  // Residuos y varianza residual s^2
  let RSS = 0;
  for (let i = 0; i < n; i++) {
    const r = ys[i] - (a + b * xs[i]);
    RSS += r * r;
  }
  const dof = Math.max(n - 2, 1);
  const s2  = RSS / dof;

  // Covarianza de parámetros escalada por s^2
  const var_a = (Sxx / Delta) * s2;
  const var_b = (S  / Delta) * s2;
  const cov_ab = (-Sx / Delta) * s2;

  // Rangos para ploteo
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  return {
    a, b,
    sigma_a: Math.sqrt(var_a),
    sigma_b: Math.sqrt(var_b),
    cov_ab,
    chi2: RSS,     // chi2 reducida = dof si s2 = RSS/dof; aquí devolvemos chi2 "no reducida"
    dof,
    s2,
    xRange: [xMin, xMax],
    yRange: [yMin, yMax]
  };
}

/** Formatea valor ± 1σ en notación científica moderada */
function pm1sigma(val, sigma, digits = 3) {
  // Si sigma ~ 0, muestra fijo
  if (!isFinite(sigma) || sigma === 0) {
    return `${val.toExponential(digits)}`;
  }
  // Ajustar dígitos con base en sigma
  const k = Math.max(0, -Math.floor(Math.log10(Math.abs(sigma)))) + 1;
  const v = val.toFixed(Math.min(8, Math.max(k, digits)));
  const s = sigma.toFixed(Math.min(8, Math.max(k, digits)));
  return `${v} ± ${s}`;
}

/** 'Nice' ticks para ejes lineales */
function makeNiceTicks(minVal, maxVal, tickCount = 6) {
  if (minVal === maxVal) {
    const d = Math.abs(minVal) || 1;
    minVal -= 0.5 * d;
    maxVal += 0.5 * d;
  }
  const span = maxVal - minVal;
  const stepRaw = span / Math.max(1, tickCount - 1);
  const pow10 = Math.pow(10, Math.floor(Math.log10(stepRaw)));
  const candidates = [1, 2, 2.5, 5, 10];
  let step = candidates[0] * pow10;
  for (const c of candidates) {
    const s = c * pow10;
    if (Math.abs(stepRaw - s) < Math.abs(stepRaw - step)) step = s;
  }
  const t0 = Math.ceil(minVal / step) * step;
  const ticks = [];
  for (let t = t0; t <= maxVal + 1e-12; t += step) ticks.push(+t.toFixed(12));
  return { ticks, step, min: minVal, max: maxVal };
}

/** Margen porcentual para escalas del plot */
function expandRange([minV, maxV], frac = 0.1) {
  if (minV === maxV) {
    const d = Math.abs(minV) || 1;
    return [minV - d, maxV + d];
  }
  const span = maxV - minV;
  return [minV - frac * span, maxV + frac * span];
}
