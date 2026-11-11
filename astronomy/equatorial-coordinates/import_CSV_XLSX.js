/**
 * import_CSV_XLSX.js: Handles CSV and Excel star data parsing, validation, and auto-import
 */

const MAX_FILE_SIZE = 1 * 1024 * 1024;  // 1 MB
const MAX_ROWS = 10000;
const MAX_CELL_LEN = 40;

// Expected headers and validation rules
const expectedHeaders = ['ra', 'dec'];
const validationRules = {
  ra: { min: 0, max: 24, required: true },
  dec: { min: -90, max: 90, required: true }
};

let validatedData = [];

// DOM Elements
const csvInput = document.getElementById('csvInput');
const fileDropzone = document.getElementById('fileDropzone');
const dropzoneText = document.getElementById('dropzoneText');
const dropzoneFileInfo = document.getElementById('dropzoneFileInfo');
const starIndexCheckbox = document.getElementById('starIndexCheckbox');

// Sober Error Modal DOM Elements
const errorModal = document.getElementById('errorModal');
const errorModalTitle = document.getElementById('errorModalTitle');
const errorModalBody = document.getElementById('errorModalBody');
const closeErrorModalButton = document.getElementById('closeErrorModalButton');

/**
 * Display sober error modal instead of native alert()
 */
function showErrorModal(title, message) {
  if (errorModalTitle && errorModalBody && errorModal) {
    errorModalTitle.textContent = title || 'Error de archivo';
    errorModalBody.textContent = message || 'Ocurrió un error inesperado al procesar el archivo.';
    errorModal.classList.add('active');
  }
}

if (closeErrorModalButton && errorModal) {
  closeErrorModalButton.addEventListener('click', () => {
    errorModal.classList.remove('active');
  });
  errorModal.addEventListener('click', (e) => {
    if (e.target === errorModal) {
      errorModal.classList.remove('active');
    }
  });
}

/**
 * Drag and Drop visual feedback & file handling
 */
if (fileDropzone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    fileDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropzone.classList.add('dragover');
    }, false);
  });

  fileDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileDropzone.classList.remove('dragover');
  }, false);

  fileDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileDropzone.classList.remove('dragover');

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0 && csvInput) {
      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(e.dataTransfer.files[0]);
        csvInput.files = dataTransfer.files;
        csvInput.dispatchEvent(new Event('change'));
      } catch (err) {
        // Fallback for older browsers
        handleFileSelection(e.dataTransfer.files[0]);
      }
    }
  }, false);
}

function normalizeData(text) {
  const lines = text.split(/\r?\n/);
  const firstLine = lines.find(line => line.trim() !== '') || '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

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

function cleanHeader(str) {
  return String(str)
    .toLowerCase()
    .replace(/\u00A0/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '');
}

function cleanCell(str) {
  return String(str)
    .replace(/\u00A0/g, '')
    .trim()
    .replace(/,/g, '.');
}

function resetFileInput(evt) {
  if (evt && evt.target) evt.target.value = '';
  if (csvInput) csvInput.value = '';
  if (dropzoneFileInfo) {
    dropzoneFileInfo.style.display = 'none';
    dropzoneFileInfo.textContent = '';
  }
}

function handleFileSelection(file, evt) {
  validatedData = [];

  if (!file) {
    resetFileInput(evt);
    return;
  }

  // Display loaded filename
  if (dropzoneFileInfo) {
    dropzoneFileInfo.textContent = `📄 ${file.name}`;
    dropzoneFileInfo.style.display = 'block';
  }

  if (file.size > MAX_FILE_SIZE) {
    showErrorModal('Archivo demasiado grande', 'El archivo excede el tamaño máximo permitido (1 MB).');
    resetFileInput(evt);
    return;
  }

  const name = file.name.toLowerCase();
  const isCSV = name.endsWith('.csv');
  const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');

  if (!isCSV && !isExcel) {
    showErrorModal('Formato no permitido', 'Tipo de archivo no válido. Por favor sube un archivo con extensión .csv, .xls o .xlsx.');
    resetFileInput(evt);
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => {
    showErrorModal('Error de lectura', 'No se pudo leer el contenido del archivo.');
    resetFileInput(evt);
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

        if (!aoa.length) throw new Error("La hoja de cálculo está vacía.");

        const normalizedText = aoa.map(r => r.map(cell =>
          cleanCell(cell)
        ).join(',')).join('\n');

        processTextData(normalizedText, evt);
      } catch (err) {
        showErrorModal('Error de formato Excel', err.message || 'La estructura del archivo Excel es inválida.');
        resetFileInput(evt);
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

if (csvInput) {
  csvInput.addEventListener('change', evt => {
    const file = evt.target.files && evt.target.files[0];
    handleFileSelection(file, evt);
  });
}

function processTextData(normalizedText, evt) {
  const lines = normalizedText
    .split(/\r?\n/)
    .filter(line => line.trim() !== '');

  if (lines.length < 2) {
    showErrorModal('Estructura incompleta', 'El archivo debe contener una fila de cabecera ("ra", "dec") y al menos una fila de datos.');
    resetFileInput(evt);
    return;
  }

  const headers = lines[0].split(',').map(h => cleanHeader(h));

  const raIndex = headers.indexOf('ra');
  const decIndex = headers.indexOf('dec');

  if (raIndex === -1 || decIndex === -1) {
    showErrorModal('Cabeceras faltantes', 'El archivo debe contener columnas llamadas exactamente "ra" y "dec".');
    resetFileInput(evt);
    return;
  }

  validatedData = [];
  let dataCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',');
    if (rawCols.every(c => cleanCell(c) === '')) continue;

    const raRaw = rawCols[raIndex] !== undefined ? cleanCell(rawCols[raIndex]) : '';
    const decRaw = rawCols[decIndex] !== undefined ? cleanCell(rawCols[decIndex]) : '';

    if (raRaw === '' && decRaw === '') continue;

    if (raRaw.length > MAX_CELL_LEN || decRaw.length > MAX_CELL_LEN) {
      showErrorModal('Valor excesivo', `Se encontró un valor excesivamente largo en la fila ${i + 1}.`);
      resetFileInput(evt);
      return;
    }

    const raVal = parseFloat(raRaw);
    const decVal = parseFloat(decRaw);

    const values = { ra: raVal, dec: decVal };

    let hasError = false;
    for (const h of expectedHeaders) {
      const val = values[h];
      const rule = validationRules[h];

      if (!rule) continue;

      if (rule.required && (val === null || isNaN(val))) {
        showErrorModal('Dato faltante', `Valor faltante o inválido en la columna "${h}", fila ${i + 1}.`);
        resetFileInput(evt);
        hasError = true;
        break;
      }
      if (rule.hasOwnProperty('min') && val < rule.min) {
        showErrorModal('Valor fuera de rango', `El valor de ${h.toUpperCase()} (${val}) es menor que ${rule.min} en la fila ${i + 1}.`);
        resetFileInput(evt);
        hasError = true;
        break;
      }
      if (rule.hasOwnProperty('max') && val > rule.max) {
        showErrorModal('Valor fuera de rango', `El valor de ${h.toUpperCase()} (${val}) es mayor que ${rule.max} en la fila ${i + 1}.`);
        resetFileInput(evt);
        hasError = true;
        break;
      }
    }

    if (hasError) return;

    validatedData.push({ ra: raVal, dec: decVal });
    dataCount++;

    if (dataCount > MAX_ROWS) {
      showErrorModal('Límite de filas excedido', `El archivo supera la cantidad máxima permitida de ${MAX_ROWS} filas.`);
      resetFileInput(evt);
      return;
    }
  }

  if (validatedData.length === 0) {
    showErrorModal('Sin datos válidos', 'No se encontraron filas con coordenadas astronómicas válidas.');
    resetFileInput(evt);
    return;
  }

  // AUTO-IMPORT SILENT SUCCESS: Instantly render stars without alert popups or manual button click
  if (window.celestialScene) {
    window.celestialScene.setCsvStars(validatedData);
  }
  if (starIndexCheckbox) {
    starIndexCheckbox.disabled = false;
  }
  const importModal = document.getElementById('importModal');
  if (importModal) {
    importModal.classList.remove('active');
  }
}
