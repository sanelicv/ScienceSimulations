// ==========================================
// 1. CONSTANTS MODULE
// ==========================================
const CONSTANTS = {
    tau_n: 879.4,                 // Neutron mean lifetime (seconds)
    delta_m: 1.293e6,             // Neutron-proton mass difference in eV
    k_B: 8.617333262e-5,          // Boltzmann constant in eV/K
    T0: 2.7255,                   // Current CMB temperature in Kelvin
    SECONDS_PER_YEAR: 31557600,
    PLANETARY_DELAY_YEARS: 50e6,  // Local enrichment offset for Pop II planets
    c_light: 2.99792458e8,
    sigma_T: 6.6524587e-29
};

// ==========================================
// 2. CONTEXT BUILDER
// ==========================================
function buildCosmologicalContext(Rm, RL, h0 = 67.4, eta = 6e-10) {
    const T_freeze_eV = 0.8e6;
    const T_freeze_K = T_freeze_eV / CONSTANTS.k_B;
    const a_i = CONSTANTS.T0 / T_freeze_K;

    const initial_m_ratio = Math.pow(10, Rm);
    const initial_L_ratio = Math.pow(10, RL);

    const denominator = 1.0 + (initial_m_ratio / a_i) + (initial_L_ratio / Math.pow(a_i, 4));

    const omegaR = 1.0 / denominator;
    const omegaM = omegaR * (initial_m_ratio / a_i);
    const omegaL = omegaR * (initial_L_ratio / Math.pow(a_i, 4));
    const H0_s = h0 * 3.24078e-20;

    const a_start = Math.sqrt(2.0 * H0_s * Math.sqrt(omegaR));
    const T_start_K = CONSTANTS.T0 / a_start;

    return { omegaR, omegaM, omegaL, H0_s, a_start, T_start_K, T_freeze_K, eta };
}

// ==========================================
// 3. UTILITIES (DECOUPLED)
// ==========================================
function getGStar(T_kelvin) {
    const T_MeV = (T_kelvin * CONSTANTS.k_B) / 1e6;
    if (T_MeV > 10.0) return 10.75;
    if (T_MeV < 0.05) return 3.363;
    return 3.363 + 7.387 * 0.5 * (1.0 + Math.tanh(2.5 * Math.log(T_MeV / 0.511)));
}

function getDLnG_DLnT(T_kelvin) {
    const eps = 1.001;
    const g1 = getGStar(T_kelvin * eps);
    const g2 = getGStar(T_kelvin / eps);
    return Math.log(g1 / g2) / (2.0 * Math.log(eps));
}

function calculateRadiationTime(T_target_K, ctx) {
    const T_10MeV_K = 1.1604e11; // 10 MeV in Kelvin

    if (T_target_K >= T_10MeV_K) {
        const g = getGStar(T_target_K);
        const H_T = ctx.H0_s * Math.sqrt(ctx.omegaR * (g / 3.363)) * Math.pow(T_target_K / CONSTANTS.T0, 2);
        return 1.0 / (2.0 * H_T);
    }

    let T_cur = T_10MeV_K;
    const g_start = getGStar(T_cur);
    const H_start = ctx.H0_s * Math.sqrt(ctx.omegaR * (g_start / 3.363)) * Math.pow(T_cur / CONSTANTS.T0, 2);
    let t_running = 1.0 / (2.0 * H_start);

    const steps = 2000;
    const dT = (T_target_K - T_cur) / steps;

    for (let i = 0; i < steps; i++) {
        let dt_dT = (T_val) => {
            const g = getGStar(T_val);
            const H_T = ctx.H0_s * Math.sqrt(ctx.omegaR * (g / 3.363)) * Math.pow(T_val / CONSTANTS.T0, 2);
            const dln_g = getDLnG_DLnT(T_val);
            return (-1.0 / (H_T * T_val)) * (1.0 + dln_g / 3.0);
        };

        let k1 = dt_dT(T_cur);
        let k2 = dt_dT(T_cur + 0.5 * dT);
        let k3 = dt_dT(T_cur + 0.5 * dT);
        let k4 = dt_dT(T_cur + dT);

        t_running += (dT / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
        T_cur += dT;
    }

    return t_running;
}

function calculateTimeAtScaleFactor(a_target, ctx) {
    if (a_target <= ctx.a_start) return 1.0 / CONSTANTS.SECONDS_PER_YEAR;
    let x_start = Math.log(ctx.a_start);
    let x_end = Math.log(a_target);
    let t_running = 1.0;
    const steps = 1000;
    const dx_t = (x_end - x_start) / steps;
    let cur_x = x_start;

    for (let i = 0; i < steps; i++) {
        let dt_dx = (x_val) => {
            const exp_x = Math.exp(x_val);
            const inv_a3 = 1.0 / Math.pow(exp_x, 3);
            const inv_a4 = inv_a3 / exp_x;
            const H_x = ctx.H0_s * Math.sqrt(ctx.omegaR * inv_a4 + ctx.omegaM * inv_a3 + ctx.omegaL);
            return 1.0 / H_x;
        };
        let k1 = dt_dx(cur_x);
        let k2 = dt_dx(cur_x + 0.5 * dx_t);
        let k3 = dt_dx(cur_x + 0.5 * dx_t);
        let k4 = dt_dx(cur_x + dx_t);

        t_running += (dx_t / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
        cur_x += dx_t;
    }
    return t_running / CONSTANTS.SECONDS_PER_YEAR;
}

// ==========================================
// 4. EPOCH SOLVERS
// ==========================================
function solveBBN(ctx) {
    // Standard Saha equation for the absolute bottleneck breakdown
    const absoluteBreakdownExponent = -Math.log(ctx.eta) + 1.5 * Math.log(938e6 / 0.1e6);

    // Physical Correction: Shift to the thermodynamic onset of rapid fusion (adds ~5.5 to the entropy denominator)
    const kineticOnsetExponent = absoluteBreakdownExponent - 5.5;

    const T_BBN_START_K = (2.22e6 / kineticOnsetExponent) / CONSTANTS.k_B;
    const T_BBN_END_K = 0.01e6 / CONSTANTS.k_B;

    const t_freeze_sec = calculateRadiationTime(ctx.T_freeze_K, ctx);
    const t_start_bbn_sec = calculateRadiationTime(T_BBN_START_K, ctx);
    const t_end_bbn_sec = calculateRadiationTime(T_BBN_END_K, ctx);

    const X_n0 = 1.0 / (1.0 + Math.exp(CONSTANTS.delta_m / (ctx.T_freeze_K * CONSTANTS.k_B)));

    let X_n_final = t_start_bbn_sec > t_freeze_sec
        ? X_n0 * Math.exp(-(t_start_bbn_sec - t_freeze_sec) / CONSTANTS.tau_n)
        : X_n0;

    const heliumPercentage = 2.0 * X_n_final * 100;

    return {
        T_BBN_START_K, t_start_bbn_sec,
        T_BBN_END_K, t_end_bbn_sec,
        hydrogenPercentage: 100 - heliumPercentage,
        heliumPercentage
    };
}

function solveRecombination(ctx) {
    const T_REC_START_K = 6500;
    const T_REC_END_K = 2600;
    const a_rec_start = CONSTANTS.T0 / T_REC_START_K;
    const t_start_rec_years = calculateTimeAtScaleFactor(a_rec_start, ctx);

    let x_rec = Math.log(CONSTANTS.T0 / T_REC_START_K);
    const x_rec_end = Math.log(CONSTANTS.T0 / T_REC_END_K);
    const dx_rec = 0.002;

    let t_rec = t_start_rec_years * CONSTANTS.SECONDS_PER_YEAR;
    let X_e = 1.0;

    let decoupling = { formed: false, timeYears: null, tempK: null, scaleFactor: null };

    const n_gamma_0 = (2.0 * 1.2020569 / Math.PI / Math.PI) * Math.pow((1.380649e-23 * CONSTANTS.T0) / (1.0545718e-34 * CONSTANTS.c_light), 3);
    const n_b_0 = ctx.eta * n_gamma_0;

    while (x_rec <= x_rec_end) {
        const T_cur = CONSTANTS.T0 * Math.exp(-x_rec);
        const exp_x = Math.exp(x_rec);
        const inv_a3 = 1.0 / Math.pow(exp_x, 3);
        const inv_a4 = inv_a3 / exp_x;

        const H_x = ctx.H0_s * Math.sqrt(ctx.omegaR * inv_a4 + ctx.omegaM * inv_a3 + ctx.omegaL);
        const n_b = n_b_0 * inv_a3;

        const alpha_B = 4.309e-19 * Math.pow(T_cur / 10000, -0.6166);
        const f_saha = Math.pow((9.1093837e-31 * 1.380649e-23 * T_cur) / (2.0 * Math.PI * 1.0545718e-34 * 1.0545718e-34), 1.5);
        const beta = alpha_B * f_saha * Math.exp(-13.6 / (CONSTANTS.k_B * T_cur));

        const K_Lyman = Math.pow(1215.67e-10, 3) / (8.0 * Math.PI * H_x);
        const C_peebles = (1.0 + K_Lyman * 8.224 * n_b * (1.0 - X_e)) / (1.0 + K_Lyman * (8.224 + beta) * n_b * (1.0 - X_e));

        const coeff_prod = (C_peebles * beta) / H_x;
        const coeff_dest = (C_peebles * alpha_B * n_b * X_e) / H_x;
        X_e = (X_e + dx_rec * coeff_prod) / (1.0 + dx_rec * coeff_prod + dx_rec * coeff_dest);

        const gamma_ge = X_e * n_b * CONSTANTS.sigma_T * CONSTANTS.c_light;
        if (gamma_ge <= H_x && !decoupling.formed) {
            decoupling = { formed: true, timeYears: t_rec / CONSTANTS.SECONDS_PER_YEAR, tempK: T_cur, scaleFactor: exp_x };
        }

        t_rec += (dx_rec / H_x);
        x_rec += dx_rec;
    }

    if (!decoupling.formed) {
        decoupling = { formed: true, timeYears: t_rec / CONSTANTS.SECONDS_PER_YEAR, tempK: T_REC_END_K, scaleFactor: Math.exp(x_rec_end) };
    }

    return { T_REC_START_K, t_start_rec_years, T_REC_END_K, t_rec_end_sec: t_rec, x_rec_end, decoupling };
}

function solveStructureEvolution(ctx, recData) {
    let x = recData.x_rec_end;
    const x_max = 8.0;
    const dx = 0.01;
    let t = recData.t_rec_end_sec;

    let delta_star = 0.022, psi_star = 0.022;
    let delta_gal = 0.015, psi_gal = 0.015;
    let delta_terr = 0.0047, psi_terr = 0.0047;

    let stars = { formed: false, timeYears: null, tempK: null, scaleFactor: null };
    let gals = { formed: false, timeYears: null, tempK: null, scaleFactor: null };
    let terrs = { formed: false, timeYears: null, tempK: null, scaleFactor: null };

    function calculateDerivates(x_val, state) {
        const exp_x = Math.exp(x_val);
        const inv_a3 = 1.0 / Math.pow(exp_x, 3);
        const inv_a4 = inv_a3 / exp_x;
        const term_R = ctx.omegaR * inv_a4;
        const term_M = ctx.omegaM * inv_a3;
        const base_H2 = term_R + term_M + ctx.omegaL;

        const H_x = ctx.H0_s * Math.sqrt(base_H2);
        const dH_H2 = 0.5 * (-4.0 * term_R - 3.0 * term_M) / base_H2;
        const term_source = 1.5 * term_M / base_H2;

        return [
            1.0 / H_x,
            state[2], -(2.0 + dH_H2) * state[2] + term_source * state[1],
            state[4], -(2.0 + dH_H2) * state[4] + term_source * state[3],
            state[6], -(2.0 + dH_H2) * state[6] + term_source * state[5]
        ];
    }

    while (x <= x_max) {
        if (delta_star >= 1.0 && !stars.formed) {
            stars = { formed: true, timeYears: t / CONSTANTS.SECONDS_PER_YEAR, scaleFactor: Math.exp(x), tempK: CONSTANTS.T0 / Math.exp(x) };
        }
        if (delta_gal >= 1.0 && !gals.formed) {
            gals = { formed: true, timeYears: t / CONSTANTS.SECONDS_PER_YEAR, scaleFactor: Math.exp(x), tempK: CONSTANTS.T0 / Math.exp(x) };
        }
        if (delta_terr >= 1.0 && !terrs.formed) {
            terrs = { formed: true, timeYears: t / CONSTANTS.SECONDS_PER_YEAR, scaleFactor: Math.exp(x), tempK: CONSTANTS.T0 / Math.exp(x) };
        }

        if (stars.formed && gals.formed && terrs.formed) break;
        if (psi_star < 1e-6 && psi_gal < 1e-6 && psi_terr < 1e-6 && Math.exp(x) > 1.0) break;

        let state = [t, delta_star, psi_star, delta_gal, psi_gal, delta_terr, psi_terr];
        let k1 = calculateDerivates(x, state);
        let s_k2 = state.map((v, i) => v + 0.5 * dx * k1[i]);
        let k2 = calculateDerivates(x + 0.5 * dx, s_k2);
        let s_k3 = state.map((v, i) => v + 0.5 * dx * k2[i]);
        let k3 = calculateDerivates(x + 0.5 * dx, s_k3);
        let s_k4 = state.map((v, i) => v + dx * k3[i]);
        let k4 = calculateDerivates(x + dx, s_k4);

        t += (dx / 6.0) * (k1[0] + 2.0 * k2[0] + 2.0 * k3[0] + k4[0]);
        delta_star += (dx / 6.0) * (k1[1] + 2.0 * k2[1] + 2.0 * k3[1] + k4[1]);
        psi_star += (dx / 6.0) * (k1[2] + 2.0 * k2[2] + 2.0 * k3[2] + k4[2]);
        delta_gal += (dx / 6.0) * (k1[3] + 2.0 * k2[3] + 2.0 * k3[3] + k4[3]);
        psi_gal += (dx / 6.0) * (k1[4] + 2.0 * k2[4] + 2.0 * k3[4] + k4[4]);
        delta_terr += (dx / 6.0) * (k1[5] + 2.0 * k2[5] + 2.0 * k3[5] + k4[5]);
        psi_terr += (dx / 6.0) * (k1[6] + 2.0 * k2[6] + 2.0 * k3[6] + k4[6]);
        x += dx;
    }

    let planets = { formed: stars.formed, timeYears: null, tempK: null, scaleFactor: null };
    if (stars.formed) {
        planets.timeYears = stars.timeYears + CONSTANTS.PLANETARY_DELAY_YEARS;
        let x_t = recData.x_rec_end;
        let t_t = recData.t_rec_end_sec;
        const steps = 5000;
        const dx_t = (8.0 - x_t) / steps;

        for (let i = 0; i < steps; i++) {
            let dt_dx = (x_val) => {
                const exp_x = Math.exp(x_val);
                const H_x = ctx.H0_s * Math.sqrt(ctx.omegaR * Math.pow(exp_x, -4) + ctx.omegaM * Math.pow(exp_x, -3) + ctx.omegaL);
                return 1.0 / H_x;
            };
            t_t += (dx_t / 6.0) * (dt_dx(x_t) + 4.0 * dt_dx(x_t + 0.5 * dx_t) + dt_dx(x_t + dx_t));
            x_t += dx_t;
            if ((t_t / CONSTANTS.SECONDS_PER_YEAR) >= planets.timeYears) {
                planets.scaleFactor = Math.exp(x_t);
                planets.tempK = CONSTANTS.T0 / planets.scaleFactor;
                break;
            }
        }
        if (!planets.scaleFactor) {
            planets.scaleFactor = Math.exp(8.0);
            planets.tempK = CONSTANTS.T0 / planets.scaleFactor;
        }
    }

    return { stars, gals, terrs, planets };
}

// ==========================================
// 5. MAIN ORCHESTRATOR
// ==========================================
function simulateUniverseCreator(Rm, RL, h0 = 67.4, eta = 6e-10) {
    const ctx = buildCosmologicalContext(Rm, RL, h0, eta);

    const bbnData = solveBBN(ctx);
    const recData = solveRecombination(ctx);
    const structData = solveStructureEvolution(ctx, recData);

    const a_eq = ctx.omegaM > 0 ? ctx.omegaR / ctx.omegaM : null;
    const radiationEndYears = (a_eq !== null && a_eq > ctx.a_start)
        ? parseFloat(calculateTimeAtScaleFactor(a_eq, ctx).toFixed(2))
        : "Never";

    const a_mL = ctx.omegaL > 0 ? Math.pow(ctx.omegaM / ctx.omegaL, 1 / 3) : null;
    const matterEndYears = (a_mL !== null && a_mL > ctx.a_start)
        ? parseFloat(calculateTimeAtScaleFactor(a_mL, ctx).toFixed(2))
        : "Never";

    const t0TimeYears = calculateTimeAtScaleFactor(1.0, ctx);

    return {
        deducedParametersToday: {
            omegaRadiationToday: parseFloat(ctx.omegaR.toExponential(4)),
            omegaMatterToday: parseFloat(ctx.omegaM.toFixed(4)),
            omegaLambdaToday: parseFloat(ctx.omegaL.toFixed(4))
        },
        bbn: {
            hydrogenPercentageBBN: parseFloat(bbnData.hydrogenPercentage.toFixed(2)),
            heliumPercentageBBN: parseFloat(bbnData.heliumPercentage.toFixed(2))
        },
        cosmologicalErasEnd: {
            radiationDominationEndYears: radiationEndYears,
            matterDominationEndYears: matterEndYears
        },
        milestones: {
            bbnBegins: {
                cosmicTimeYears: parseFloat((bbnData.t_start_bbn_sec / CONSTANTS.SECONDS_PER_YEAR).toExponential(4)),
                temperatureKelvin: parseFloat(bbnData.T_BBN_START_K.toFixed(2)),
                scaleFactor: parseFloat((CONSTANTS.T0 / bbnData.T_BBN_START_K).toExponential(4))
            },
            bbnEnds: {
                cosmicTimeYears: parseFloat((bbnData.t_end_bbn_sec / CONSTANTS.SECONDS_PER_YEAR).toExponential(4)),
                temperatureKelvin: parseFloat(bbnData.T_BBN_END_K.toFixed(2)),
                scaleFactor: parseFloat((CONSTANTS.T0 / bbnData.T_BBN_END_K).toExponential(4))
            },
            recombinationBegins: {
                cosmicTimeYears: parseFloat(recData.t_start_rec_years.toFixed(2)),
                temperatureKelvin: parseFloat(recData.T_REC_START_K.toFixed(2)),
                scaleFactor: parseFloat((CONSTANTS.T0 / recData.T_REC_START_K).toExponential(4))
            },
            cmbDecouples: {
                cosmicTimeYears: recData.decoupling.formed ? parseFloat(recData.decoupling.timeYears.toFixed(2)) : null,
                temperatureKelvin: recData.decoupling.formed ? parseFloat(recData.decoupling.tempK.toFixed(2)) : null,
                scaleFactor: recData.decoupling.formed ? parseFloat(recData.decoupling.scaleFactor.toExponential(4)) : null
            },
            recombinationEnds: {
                cosmicTimeYears: parseFloat((recData.t_rec_end_sec / CONSTANTS.SECONDS_PER_YEAR).toFixed(2)),
                temperatureKelvin: parseFloat(recData.T_REC_END_K.toFixed(2)),
                scaleFactor: parseFloat((CONSTANTS.T0 / recData.T_REC_END_K).toExponential(4))
            },
            firstStars: {
                cosmicTimeYears: structData.stars.formed ? parseFloat(structData.stars.timeYears.toFixed(2)) : "Never",
                temperatureKelvin: structData.stars.formed ? parseFloat(structData.stars.tempK.toFixed(2)) : "Never",
                scaleFactor: structData.stars.formed ? parseFloat(structData.stars.scaleFactor.toExponential(4)) : "Never"
            },
            firstGalaxies: {
                cosmicTimeYears: structData.gals.formed ? parseFloat(structData.gals.timeYears.toFixed(2)) : "Never",
                temperatureKelvin: structData.gals.formed ? parseFloat(structData.gals.tempK.toFixed(2)) : "Never",
                scaleFactor: structData.gals.formed ? parseFloat(structData.gals.scaleFactor.toExponential(4)) : "Never"
            },
            firstPlanets: {
                cosmicTimeYears: structData.planets.formed ? parseFloat(structData.planets.timeYears.toFixed(2)) : "Never",
                temperatureKelvin: structData.planets.formed ? parseFloat(structData.planets.tempK.toFixed(2)) : "Never",
                scaleFactor: structData.planets.formed ? parseFloat(structData.planets.scaleFactor.toExponential(4)) : "Never"
            },
            firstEarthlyPlanets: {
                cosmicTimeYears: structData.terrs.formed ? parseFloat(structData.terrs.timeYears.toFixed(2)) : "Never",
                temperatureKelvin: structData.terrs.formed ? parseFloat(structData.terrs.tempK.toFixed(2)) : "Never",
                scaleFactor: structData.terrs.formed ? parseFloat(structData.terrs.scaleFactor.toExponential(4)) : "Never"
            },
            presentDay: {
                cosmicTimeYears: parseFloat(t0TimeYears.toFixed(2)),
                temperatureKelvin: CONSTANTS.T0,
                scaleFactor: 1.0
            }
        },
        currentCosmicTime: {
            instantT0Years: parseFloat(t0TimeYears.toFixed(2))
        }
    };
}

// Verification Call
console.log(simulateUniverseCreator(-5.9882, -34.2477));