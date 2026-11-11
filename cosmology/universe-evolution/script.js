let lastSol = [];

// CSV exporter: (ya no se usa para descarga, lo conservamos intacto por si se requiere en el futuro)
function exportSolToCSV(sol, filename = 'solution.csv') {
  const header = 't[Gyr],a';
  const rows = sol.map(([t, a]) => `${t},${a}`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- NUEVO: exportar a XLSX con SheetJS ---
function exportSolToXLSX(sol, filename = 'a_vs_t.xlsx') {
  // Construir hoja como array de objetos para encabezados claros
  const data = sol.map(([t, a]) => ({ 't[Gyr]': t, 'a': a }));
  const ws = XLSX.utils.json_to_sheet(data, { header: ['t[Gyr]', 'a'] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'solution');
  XLSX.writeFile(wb, filename);
}

// --- Muestreo para el plot (máx. 200 puntos) ---
function sampleForPlot(sol, maxPoints = 400) {
  if (!Array.isArray(sol) || sol.length === 0) return [];
  if (sol.length <= maxPoints) return sol;
  const step = (sol.length - 1) / (maxPoints - 1);
  const sampled = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    sampled.push(sol[idx]);
  }
  return sampled;
}

function plotScaleFactor(sol) {
  const sampled = sampleForPlot(sol, 400);
  const t = sampled.map(d => d[0]);
  const a = sampled.map(d => d[1]);

  const trace = {
    x: t,
    y: a,
    mode: 'lines',
    name: 'a(t)'
  };
  const layout = {
    margin: { l: 60, r: 20, t: 10, b: 50 },
    xaxis: { title: 't [Gyr]', zeroline: false },
    yaxis: { title: 'a(t)', zeroline: false },
    showlegend: false
  };
  Plotly.newPlot('plot', [trace], layout, { displayModeBar: true });
}

// === A=1 highlighting helpers ===
function findCrossingAEqualsOne(sol, H0) {
  if (!sol || sol.length < 2) return null;
  if (H0 === undefined) {
    H0 = parseFloat(document.getElementById('H0')?.value || '20.66');
  }
  // If H0 > 0, we look for a crossing where a increases (expanding)
  // If H0 < 0, we look for a crossing where a decreases (contracting)
  for (let i = 0; i < sol.length - 1; i++) {
    const [t0, a0, sgn0] = sol[i];
    const [t1, a1, sgn1] = sol[i + 1];
    if ((a0 - 1) * (a1 - 1) <= 0) {
      const isExpanding = (a1 > a0);
      if ((H0 >= 0 && isExpanding) || (H0 < 0 && !isExpanding)) {
        const alpha = (a1 - a0) === 0 ? 0 : (1 - a0) / (a1 - a0);
        const tStar = t0 + alpha * (t1 - t0);
        return { t: tStar, a: 1, index: i };
      }
    }
  }
  // Fallback: any crossing
  for (let i = 0; i < sol.length - 1; i++) {
    const [t0, a0] = sol[i];
    const [t1, a1] = sol[i + 1];
    if ((a0 - 1) * (a1 - 1) <= 0) {
      const alpha = (a1 - a0) === 0 ? 0 : (1 - a0) / (a1 - a0);
      const tStar = t0 + alpha * (t1 - t0);
      return { t: tStar, a: 1, index: i };
    }
  }
  return null;
}

function generateHubbleData(sol, H0, omegaM, omegaDE) {
  const crossing = findCrossingAEqualsOne(sol, H0);
  if (!crossing) {
    if (H0 < 0) {
      alert("El modelo cosmológico seleccionado no llega a la fase de contracción (a = 1) en el rango de tiempo simulado.\nIntente aumentar t_max o usar parámetros que permitan la contracción (ej. un valor mayor de Ω_M).");
    } else {
      alert("No se encontró el instante presente (a = 1) en la simulación. Intente aumentar t_max.");
    }
    return null;
  }

  const idxNow = crossing.index;
  const omegaK = 1 - omegaM - omegaDE;
  const cSpeedOfLight = 299792.458; // km/s
  const cMlyPerGyr = 1000; // Mly/Gyr

  // We integrate backwards from idxNow to 0 to compute comoving distance r(t_e)
  const r = new Array(idxNow + 1);
  r[idxNow] = 0;

  for (let i = idxNow - 1; i >= 0; i--) {
    const [t0, a0] = sol[i];
    const [t1, a1] = sol[i + 1];
    const dtVal = t1 - t0;
    const stepR = cMlyPerGyr * 0.5 * dtVal * (1 / a0 + 1 / a1);
    r[i] = r[i + 1] + stepR;
  }

  const data = [];
  const absH0 = Math.max(Math.abs(H0), 1e-5);

  for (let i = 0; i <= idxNow; i++) {
    const [t_e, a_e, sgn_e] = sol[i];

    // E(a) = omegaM/a^3 + omegaDE + omegaK/a^2
    const E = omegaM / (a_e ** 3) + omegaDE + omegaK / (a_e ** 2);
    const H_t = sgn_e * absH0 * Math.sqrt(Math.max(E, 0));

    const d_now = r[i];
    const d_em = a_e * d_now;
    const v_rec = H_t * d_em;

    // Filter galaxies with recession speed <= 1.25c (in absolute value)
    if (Math.abs(v_rec) <= 1.1 * cSpeedOfLight) {
      data.push({
        'Tiempo de Emisión [Gyr]': Number(t_e.toFixed(4)),
        'Factor de Escala [a]': Number(a_e.toFixed(6)),
        'Redshift [z]': Number((1 / a_e - 1).toFixed(6)),
        'Distancia de Emisión [Mly]': Number(d_em.toFixed(2)),
        'Distancia Actual [Mly]': Number(d_now.toFixed(2)),
        'Velocidad de Recesión [km/s]': Number(v_rec.toFixed(2))
      });
    }
  }

  // Ordenar en orden ascendente de distancia actual (comóvil)
  data.sort((a, b) => a['Distancia Actual [Mly]'] - b['Distancia Actual [Mly]']);

  return data;
}

function decoratePlotWithAEqualsOne(sol) {
  const gd = document.getElementById('plot');
  const cross = findCrossingAEqualsOne(sol);
  if (!gd || !cross) return;

  Plotly.addTraces(gd, [{
    x: [cross.t],
    y: [1],
    mode: 'markers',
    name: 'a = 1',
    marker: { size: 12, symbol: 'circle-open' },
    hovertemplate: 't = %{x:.3f} Gyr<br>a = %{y:.3f}<extra></extra>',
    hoverlabel: { bgcolor: 'white', font: { color: 'black' } }
  }]);

  // Líneas que llegan solo al punto
  const shapes = [
    { // línea vertical: desde y=0 hasta y=1
      type: 'line',
      x0: cross.t,
      x1: cross.t,
      y0: 0,
      y1: 1,
      line: { dash: 'dot', width: 1.5 }
    },
    { // línea horizontal: desde el inicio hasta x=cross.t
      type: 'line',
      x0: sol[0][0],
      x1: cross.t,
      y0: 1,
      y1: 1,
      line: { dash: 'dot', width: 1.5 }
    }
  ];

  Plotly.relayout(gd, { shapes });
}


document.addEventListener('DOMContentLoaded', () => {
  const calcPlotBtn = document.getElementById('calcPlotBtn');
  const downloadXlsxBtn = document.getElementById('downloadXlsxBtn');

  calcPlotBtn.addEventListener('click', () => {
    const params = {
      omegaM: parseFloat(document.getElementById('omegaM').value),
      omegaDE: parseFloat(document.getElementById('omegaDE').value),
      H0: parseFloat(document.getElementById('H0').value),
      a0: parseFloat(document.getElementById('a0').value),
      tMin: parseFloat(document.getElementById('tMin').value),
      tMax: parseFloat(document.getElementById('tMax').value),
      dt: parseFloat(document.getElementById('dt').value)
    };
    const { sol } = integrateFriedmannRK4(params);
    lastSol = sol;
    plotScaleFactor(sol);
    //decoratePlotWithAEqualsOne(sol);
  });

  {
    const params = {
      omegaM: parseFloat(document.getElementById('omegaM').value),
      omegaDE: parseFloat(document.getElementById('omegaDE').value),
      H0: parseFloat(document.getElementById('H0').value),
      a0: parseFloat(document.getElementById('a0').value),
      tMin: parseFloat(document.getElementById('tMin').value),
      tMax: parseFloat(document.getElementById('tMax').value),
      dt: parseFloat(document.getElementById('dt').value)
    };
    const { sol } = integrateFriedmannRK4(params);
    lastSol = sol;
    plotScaleFactor(sol);
  }

  downloadXlsxBtn.addEventListener('click', () => {
    if (!lastSol || lastSol.length === 0) {
      alert('Primero calcula la solución para poder descargar el XLSX.');
      return;
    }
    exportSolToXLSX(lastSol, 'a_vs_t.xlsx');
  });

  const downloadHubbleBtn = document.getElementById('downloadHubbleBtn');
  downloadHubbleBtn.addEventListener('click', () => {
    if (!lastSol || lastSol.length === 0) {
      alert('Primero calcula la solución para poder descargar el XLSX.');
      return;
    }
    const omegaM = parseFloat(document.getElementById('omegaM').value);
    const omegaDE = parseFloat(document.getElementById('omegaDE').value);
    const H0 = parseFloat(document.getElementById('H0').value);

    const data = generateHubbleData(lastSol, H0, omegaM, omegaDE);
    if (data && data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hubble Law');
      XLSX.writeFile(wb, 'velocidad_vs_distancia.xlsx');
    } else if (data) {
      alert('No se encontraron galaxias observables con velocidad de recesión menor o igual a c.');
    }
  });
});
