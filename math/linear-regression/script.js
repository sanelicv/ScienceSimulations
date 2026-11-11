/* Orquesta la interacción UI <-> importador <-> funciones <-> sketch */
let currentData = [];
let currentHeaders = { x: "x", y: "y" };
let currentFit = null;

// Montar sketch una vez al cargar
document.addEventListener('DOMContentLoaded', () => {
  mountSketch();
  // Mostrar placeholders
  document.getElementById('headerBox').textContent = "Esperando datos…";
  document.getElementById('statsBox').textContent  = "Esperando datos…";
  document.getElementById('statsBoxDetails').textContent  = "Esperando datos…";
  document.getElementById('sigmaBox').textContent  = "Esperando datos…";
  
});

// Recibido desde import_CSV_XLSX.js
function onCSVDataLoaded(payload) {
  const { data, headers } = payload;
  currentData = data.slice(); // [{x,y}]
  currentHeaders = {
    x: (headers[0] || 'x'),
    y: (headers[1] || 'y')
  };

  // chi2 fit
  const xs = currentData.map(d => d.x);
  const ys = currentData.map(d => d.y);
  let fit;
  try {
    fit = chi2LinearFit(xs, ys);
  } catch (e) {
    alert("No se pudo ajustar: " + e.message);
    return;
  }
  currentFit = fit;

  
  // Populate headerBox
  document.getElementById('headerBox').textContent =
    `  Eje X: ${currentHeaders.x}\n  Eje Y: ${currentHeaders.y}`;
  const { a, b, sigma_a, sigma_b, cov_ab, s2, dof } = fit;

  // Populate statsText
  const yCutSign = a > 0 ? "+" : "-";
  const statsText =
  `  ${currentHeaders.y} = ${b.toFixed(2)} * ${currentHeaders.x} ${yCutSign} ${Math.abs(a.toFixed(2))}`;
  document.getElementById('statsBox').textContent = statsText;

  // Populate statsTextDetails
  const statsTextDetails =
  `  y = m * x + b

  m = ${b.toFixed(6)}
  b = ${a.toFixed(6)}`;
  document.getElementById('statsBoxDetails').textContent = statsTextDetails;

  // Populate sigmaBox
  const sigText =
`  m: ${pm1sigma(b, sigma_b)}
  b: ${pm1sigma(a, sigma_a)}`;
  document.getElementById('sigmaBox').textContent = sigText;

  // Pasar al sketch
  const arrXY = currentData.map(d => ({ x: d.x, y: d.y }));
  const hdrs  = { x: currentHeaders.x, y: currentHeaders.y };
  // Asegurar que el sketch exista (re-montar por si acaso)
  if (!p5Instance) mountSketch();
  p5Instance._setDataAndFit(arrXY, hdrs, currentFit);
}
