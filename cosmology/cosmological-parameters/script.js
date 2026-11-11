// script.js
// Versión para trabajar con el nuevo importador genérico que deja TODO en window.dataImport

let redshiftData = [];
let dLData = [];
let chi2Grid = [];
let omegaMValues = [];
let omegaLambdaValues = [];
let bestChi2 = Infinity;
let bestOmegaM = 0;
let bestOmegaLambda = 0;

const calculateBtn = document.getElementById('calculateButton');
const calculatingSpan   = document.getElementById('calculatingSpan');
const fileInput    = document.getElementById('csvInput');

calculateBtn.addEventListener('click', () => {
  // 1. verificar si ya hay datos importados por el importador
  if (!window.dataImport || !window.dataImport.rows || window.dataImport.rows.length === 0) {
    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Primero selecciona un archivo CSV/XLSX con las columnas esperadas.');
      return;
    }
    // el importador solo guarda datos al subir archivo;
    // si llegamos aquí es que aún no terminó o no se pudo leer
    alert('El archivo todavía no ha sido procesado. Súbelo de nuevo o espera a que termine.');
    return;
  }

  calculatingSpan.innerHTML = 
  "Datos importados correctamente.<br>" +
  "Iniciando el análisis de &chi;<sup>2</sup> de los parámetros cosmológicos.<br>" +
  "Este proceso puede tardar algunos segundos.<br>" +
  "Por favor, espera...";

  //statusSpan.style.display = 'inline';
  setTimeout(runCosmologyCalculation, 0);

});

/*--------------------------------------------------------
   FUNCIÓN PRINCIPAL DE CÁLCULO COSMOLÓGICO
--------------------------------------------------------*/
function runCosmologyCalculation() {
  // 1. obtener datos desde el importador genérico
  const dataImport = window.dataImport;

  if (!dataImport || !dataImport.rows || dataImport.rows.length === 0) {
    alert('No hay datos válidos en memoria. Importa un archivo primero.');
    return;
  }

  // 2. extraer parámetros del modelo (como H0) desde dataImport.params
  const params = dataImport.params || {};
  const hubbleParameter = typeof params.h0 !== 'undefined' ? parseFloat(params.h0) : NaN;

  if (!hubbleParameter || isNaN(hubbleParameter) || hubbleParameter <= 0) {
    alert('El archivo no contiene un parámetro válido H0 en la primera fila.');
    return;
  }

  // 3. convertir las filas en arrays de trabajo
  redshiftData = [];
  dLData = [];
  for (let i = 0; i < dataImport.rows.length; i++) {
    const row = dataImport.rows[i];
    const z   = parseFloat(row.z);
    const dL  = parseFloat(row.dl);
    if (isNaN(z) || isNaN(dL)) {
      alert(`Dato inválido en la fila ${i + 2} (z o dL no numéricos).`);
      return;
    }
    redshiftData.push(z);
    dLData.push(dL);
  }

  // 4. obtener los rangos del HTML
  const omegaMMin      = parseFloat(document.getElementById('omegaMMin').value);
  const omegaMMax      = parseFloat(document.getElementById('omegaMMax').value);
  const omegaLambdaMin = parseFloat(document.getElementById('omegaLambdaMin').value);
  const omegaLambdaMax = parseFloat(document.getElementById('omegaLambdaMax').value);
  const numDivisions   = parseInt(document.getElementById('numDivisions').value);

  calculatingSpan.textContent = 'Calculando los parámetros cosmológicos...';

  // 5. construir las mallas
  omegaMValues = [];
  omegaLambdaValues = [];
  const omegaMStep      = (omegaMMax - omegaMMin) / numDivisions;
  const omegaLambdaStep = (omegaLambdaMax - omegaLambdaMin) / numDivisions;

  for (let i = 0; i <= numDivisions; i++) {
    omegaMValues.push(omegaMMin + i * omegaMStep);
    omegaLambdaValues.push(omegaLambdaMin + i * omegaLambdaStep);
  }

  // 6. barrido en el espacio de parámetros
  chi2Grid        = [];
  bestChi2        = Infinity;
  bestOmegaM      = 0;
  bestOmegaLambda = 0;

  for (let i = 0; i < omegaMValues.length; i++) {
    chi2Grid[i] = [];
    for (let j = 0; j < omegaLambdaValues.length; j++) {
      const omegaM      = omegaMValues[i];
      const omegaLambda = omegaLambdaValues[j];
      const chi2        = calculateChi2(omegaM, omegaLambda, hubbleParameter);
      chi2Grid[i][j]    = chi2;

      if (chi2 < bestChi2) {
        bestChi2        = chi2;
        bestOmegaM      = omegaM;
        bestOmegaLambda = omegaLambda;
      }
    }
  }

  // 7. mostrar resultados
  document.getElementById("results").style = "display: block";
  document.getElementById('hubbleConstantValue').innerText      = params.h0 + " km/s/Mly";
  document.getElementById('bestOmegaM').innerText      = bestOmegaM.toFixed(4);
  document.getElementById('bestOmegaLambda').innerText = bestOmegaLambda.toFixed(4);
  document.getElementById('minChi2').innerText         = bestChi2.toFixed(4);

  // 8. dibujar visualizaciones
  createChi2Visualization(chi2Grid, omegaMValues, omegaLambdaValues, "chi2plotVisualization");
  createPlotVisualization(bestOmegaM, bestOmegaLambda, hubbleParameter);

  calculatingSpan.textContent = '';
}

/*--------------------------------------------------------
   CÁLCULO DE χ²
--------------------------------------------------------*/
function calculateChi2(omegaM, omegaLambda, H0) {
  let chi2 = 0;
  for (let i = 0; i < redshiftData.length; i++) {
    const z          = redshiftData[i];
    const dLObserved = dLData[i];
    const dLModel    = luminosityDistance(omegaM, omegaLambda, H0, z);

    const sigma = 0.05 * dLObserved;
    chi2 += Math.pow((dLObserved - dLModel) / sigma, 2);
  }
  return chi2;
}

/*--------------------------------------------------------
   DISTANCIA DE LUMINOSIDAD
--------------------------------------------------------*/
function luminosityDistance(omegaM, omegaLambda, H0, z) {
  const c = 299792.458; // km/s
  const omegaK = 1.0 - (omegaM + omegaLambda);
  const N = 10000;
  const dz = z / N;
  const mpcToMly = 1;

  function Ez(zPrime) {
    return Math.sqrt(
      omegaM * Math.pow(1 + zPrime, 3) +
      omegaK * Math.pow(1 + zPrime, 2) +
      omegaLambda
    );
  }

  let integral = 0.0;
  for (let i = 0; i <= N; i++) {
    const zPrime = i * dz;
    const weight = (i === 0 || i === N) ? 1 : (i % 2 === 0 ? 2 : 4);
    integral += weight / Ez(zPrime);
  }
  integral *= dz / 3.0;

  const DC = (c / H0) * integral;

  let DM;
  if (omegaK > 0.0) {
    const sqrtOmegaK = Math.sqrt(omegaK);
    DM = (c / H0) / sqrtOmegaK * Math.sinh(sqrtOmegaK * H0 * DC / c);
  } else if (omegaK === 0.0) {
    DM = DC;
  } else {
    const sqrtAbsOmegaK = Math.sqrt(-omegaK);
    DM = (c / H0) / sqrtAbsOmegaK * Math.sin(sqrtAbsOmegaK * H0 * DC / c);
  }

  const dL = (1 + z) * DM * mpcToMly;
  return dL;
}
