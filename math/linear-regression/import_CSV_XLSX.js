/* Importa .csv/.xls/.xlsx con exactamente 2 columnas numéricas.
   NO obliga nombres de cabecera; los conserva para etiquetas de ejes. */

const MAX_FILE_SIZE = 2 * 1024 * 1024;  // 2 MB
const MAX_ROWS = 100000;
const MAX_CELL_LEN = 128;

let validatedData = [];              // [{x:<num>, y:<num>}...]
let detectedHeaders = ["x", "y"];    // originales tal como vienen
const runButton = document.getElementById('runButton');

function normalizeData(text) {
  const lines = text.split(/\r?\n/);
  const firstLine = lines.find(line => line.trim() !== '') || '';
  const sc = (firstLine.match(/;/g) || []).length;
  const cc = (firstLine.match(/,/g) || []).length;
  // Si parece separado por ';', normaliza a ','
  if (sc > cc) {
    return lines.map(line => {
      if (!line.trim()) return '';
      return line.split(';').map(cell =>
        String(cell).replace(/\u00A0/g, '').trim().replace(/,/g, '.')
      ).join(',');
    }).join('\n');
  }
  return text;
}

function cleanCell(str) {
  return String(str).replace(/\u00A0/g, '').trim().replace(/,/g, '.');
}

function takeFirstTwo(row) {
  // Toma las primeras 2 celdas (si hay más, las ignora)
  const a = (row[0] ?? '').toString();
  const b = (row[1] ?? '').toString();
  return [a, b];
}

document.getElementById('csvInput').addEventListener('change', evt => {
  const file = evt.target.files[0];
  runButton.disabled = true;
  validatedData = [];
  detectedHeaders = ["x", "y"];

  if (!file) { evt.target.value = ''; return; }
  if (file.size > MAX_FILE_SIZE) {
    alert('Archivo demasiado grande (máx 2 MB).');
    evt.target.value = '';
    return;
  }

  const name = file.name.toLowerCase();
  const isCSV   = name.endsWith('.csv');
  const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');

  if (!isCSV && !isExcel) {
    alert('ERROR:\n\nTipo de archivo no permitido. Usa .csv, .xls o .xlsx');
    evt.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => {
    alert('ERROR:\n\nError leyendo el archivo.');
    evt.target.value = '';
  };

  if (isCSV) {
    reader.onload = e => {
      const rawText = e.target.result;
      const normalizedText = normalizeData(rawText);
      processTextData(normalizedText, evt);
    };
    reader.readAsText(file);
  } else {
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        let aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        aoa = aoa.filter(row => row.some(cell => String(cell).trim() !== ''));
        if (!aoa.length) throw new Error("La hoja está vacía.");

        // Cabeceras originales: primeras 2
        const hdrRaw = takeFirstTwo(aoa[0]);
        detectedHeaders = hdrRaw.map(h => h.toString().trim()).map(h => h || '—');

        // Normaliza a CSV con 2 columnas
        const rows = aoa.slice(1).map(r => takeFirstTwo(r).map(cleanCell));
        const normalizedText = [hdrRaw.join(','), ...rows.map(r => r.join(','))].join('\n');

        processTextData(normalizedText, evt);
      } catch (err) {
        alert('ERROR: Excel inválido\n\n' + err.message);
        evt.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }
});

function processTextData(normalizedText, evt) {
  const lines = normalizedText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    alert('ERROR:\n\nEl archivo debe tener cabecera y al menos una fila de datos.');
    evt.target.value = '';
    return;
  }

  // Tomar exactamente 2 cabeceras
  const rawHeaders = lines[0].split(',');
  if (rawHeaders.length < 2) {
    alert('ERROR:\n\nSe requieren exactamente 2 columnas con cabeceras.');
    evt.target.value = '';
    return;
  }
  detectedHeaders = takeFirstTwo(rawHeaders).map(h => h.toString().trim()).map(h => h || '—');

  validatedData = [];
  let dataCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',');
    if (rawCols.length === 0) continue;

    const [c0, c1] = takeFirstTwo(rawCols).map(cleanCell);
    if (c0 === '' && c1 === '') break;   // Fin “suave”

    if (c0.length > MAX_CELL_LEN || c1.length > MAX_CELL_LEN) {
      alert(`ERROR:\n\nValores excesivamente largos en fila ${i+1}.`);
      evt.target.value = '';
      return;
    }
    const x = parseFloat(c0);
    const y = parseFloat(c1);
    if (!isFinite(x) || !isFinite(y)) {
      // si encontramos no numéricos, detenemos en esa fila
      break;
    }

    validatedData.push({ x, y });
    dataCount++;

    if (dataCount > MAX_ROWS) {
      alert(`ERROR:\n\nDemasiadas filas (máx ${MAX_ROWS}).`);
      evt.target.value = '';
      return;
    }
  }

  if (validatedData.length === 0) {
    alert('ERROR:\n\nNo se encontraron filas de datos válidas.');
    evt.target.value = '';
    return;
  }

  const lastRow = validatedData.length + 1;
  alert(`¡Archivo validado correctamente!\n\nDatos importados hasta la fila ${lastRow}.\n\nAhora haz clic en Importar datos.`);

  // Habilitar el botón
  runButton.disabled = false;
}

// Entrega los datos al resto de la app
runButton.addEventListener('click', () => {
  if (typeof onCSVDataLoaded === 'function') {
    onCSVDataLoaded({ data: validatedData, headers: detectedHeaders });
  }
});
