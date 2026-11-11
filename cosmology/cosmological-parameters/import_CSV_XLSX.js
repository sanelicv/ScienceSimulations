// import_CSV_XLSX.js
// Módulo de importación genérico: lee CSV/XLSX y deja todo en window.snImport

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const MAX_ROWS      = 5000;
const MAX_CELL_LEN  = 20;

// 1. Esquema configurable
// role: 'data'  → valor por fila
// role: 'param' → valor solo de la primera fila (las demás pueden venir vacías)
const columnsSchema = [
  { name: 'z',  label: 'z',  type: 'number', role: 'data',  required: true  },
  { name: 'dl', label: 'dL [Mly]', type: 'number', role: 'data',  required: true  },
  { name: 'h0', label: 'H0 [km/s/Mly]', type: 'number', role: 'param', required: true }
];

// 2. Cabeceras esperadas (en el mismo orden)
const expectedHeaders = columnsSchema.map(col => cleanHeader(col.label));

// 3. Helpers
function cleanHeader(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')                 // quita acentos
    .replace(/[\u0300-\u036f]/g, '')  // quita marcas de acento
    .replace(/\u00A0/g, '')           // quita NBSP
    .replace(/\s+/g, '')              // quita espacios
    .replace(/[^a-z0-9]/g, '');       // quita todo lo demás
}


function cleanCell(str) {
  return String(str)
    .replace(/\u00A0/g, '')
    .trim()
    .replace(/,/g, '.');
}

function normalizeData(text) {
  const lines = text.split(/\r?\n/);
  const firstLine = lines.find(line => line.trim() !== '') || '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount     = (firstLine.match(/,/g) || []).length;

  if (semicolonCount > commaCount) {
    return lines.map(line => {
      if (line.trim() === '') return '';
      const cells = line.split(';');
      const normalizedCells = cells.map(cell =>
        String(cell)
          .replace(/\u00A0/g, '')
          .trim()
          .replace(/,/g, '.')
      );
      return normalizedCells.join(',');
    }).join('\n');
  }
  return text;
}

// 4. Listener principal: SOLO lee y guarda
document.getElementById('csvInput').addEventListener('change', evt => {
  const file = evt.target.files[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    alert('Archivo demasiado grande (máx 1 MB).');
    evt.target.value = '';
    return;
  }

  const name = file.name.toLowerCase();
  const isCSV   = name.endsWith('.csv');
  const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');

  const reader = new FileReader();
  reader.onerror = () => {
    alert('ERROR leyendo el archivo.');
    evt.target.value = '';
  };

  if (isCSV) {
    reader.onload = e => {
      const rawText = e.target.result;
      const normalizedText = normalizeData(rawText);
      processTextData(normalizedText);
    };
    reader.readAsText(file);
  } else if (isExcel) {
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];

        let aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        aoa = aoa.filter(row => row.some(cell => String(cell).trim() !== ''));

        if (!aoa.length) throw new Error("La hoja está vacía.");

        aoa = aoa.map(row => row.slice(0, expectedHeaders.length));

        const normalizedText = aoa.map(r => r.map(cell =>
          cleanCell(cell)
        ).join(',')).join('\n');

        processTextData(normalizedText);
      } catch (err) {
        alert('ERROR: Excel inválido\n\n' + err.message);
        evt.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('ERROR: formato no permitido. Usa .csv, .xls o .xlsx');
    evt.target.value = '';
  }
});

// 5. Procesador de texto ya normalizado
function processTextData(normalizedText) {
  const lines = normalizedText
    .split(/\r?\n/)
    .filter(line => line.trim() !== '');

  if (lines.length < 2) {
    alert('ERROR: el archivo debe tener cabecera y al menos una fila de datos.');
    return;
  }

  // leer y validar cabeceras
  const headers = lines[0]
    .split(',')
    .slice(0, expectedHeaders.length)
    .map(h => cleanHeader(h));

  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i] !== expectedHeaders[i]) {
      alert(`ERROR:\n\nLas cabeceras deben ser: ${columnsSchema.map(c => c.label).join(', ')}`);
      return;
    }
  }

  const rows = [];
  const params = {};

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',');
    const cols    = rawCols.slice(0, expectedHeaders.length).map(cleanCell);

    // si la fila está completamente vacía, terminamos
    if (cols.every(c => c === '')) break;

    const rowData = {};
    let stopHere = false;

    for (let c = 0; c < columnsSchema.length; c++) {
      const colDef = columnsSchema[c];
      const rawVal = cols[c];
      const numVal = parseFloat(rawVal);

      if (colDef.role === 'data') {
        // estas columnas deben existir en todas las filas útiles
        if (rawVal === '' || isNaN(numVal)) {
          stopHere = true;
          break;
        }
        rowData[colDef.name] = numVal;
      } else if (colDef.role === 'param') {
        // solo la primera fila define los params
        if (i === 1 && rawVal !== '' && !isNaN(numVal)) {
          params[colDef.name] = numVal;
        }
        // en filas siguientes podemos ignorarlo
      }
    }

    if (stopHere) break;
    rows.push(rowData);

    if (rows.length > MAX_ROWS) {
      alert(`ERROR: demasiadas filas (máx ${MAX_ROWS}).`);
      break;
    }
  }

  if (!rows.length) {
    alert('ERROR: no se encontraron filas de datos válidas.');
    return;
  }

  // 6. Guardamos TODO en un solo objeto global
  window.dataImport = {
    rows: rows,               // datos por fila (z, dl, ...)
    params: params,           // parámetros de la primera fila (h0, ...)
    headers: expectedHeaders, // ['z', 'dl', 'h0']
    schema: columnsSchema,    // para otras apps
    lastUpdated: new Date()
  };

  console.log('snImport actualizado:', window.dataImport);
  alert('Archivo validado correctamente.');
}
