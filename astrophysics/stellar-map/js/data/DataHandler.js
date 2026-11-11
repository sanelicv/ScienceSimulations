export class DataHandler {
  constructor() {
    this.MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
    this.MAX_ROWS = 5000;

    // Mapa de alias de encabezados astronómicos comunes
    this.headerAliases = {
      ra: [
        'ra', 'r.a.', 'r_a', 'ar', 'a.r.', 'a_r',
        'ascensionrecta', 'rightascension', 'alpha', 'alfa',
        'ra_h', 'rah', 'ra_hours', 'ra_deg', 'radeg', 'raj2000', 'ra2000',
        'ra_j2000_deg', 'raj2000deg', 'ra_j2000_h', 'raj2000h',
        '_ra.icrs', 'ra.icrs', '_ra_icrs', 'ra_icrs', 'raicrs', '_ra'
      ],
      dec: [
        'dec', 'd.e.c.', 'decl', 'declin',
        'declinacion', 'declination', 'delta',
        'dec_deg', 'decdeg', 'dec_grados', 'dej2000', 'dec2000',
        'dec_j2000_deg', 'decj2000deg',
        '_de.icrs', 'de.icrs', '_dec.icrs', 'dec.icrs', '_de_icrs', 'de_icrs', 'deicrs', '_de', '_dec'
      ],
      d: [
        'd', 'dist', 'distancia', 'distance', 'r', 'radius', 'rad',
        'd_ly', 'dly', 'dist_ly', 'distance_ly',
        'd_pc', 'dpc', 'dist_pc', 'distance_pc',
        'd_kpc', 'dkpc', 'dist_kpc', 'distance_kpc', 'kpc',
        'd_mpc', 'dmpc', 'dist_mpc', 'distance_mpc', 'mpc',
        'd_mly', 'dmly', 'dist_mly', 'distance_mly', 'mly',
        'd_au', 'dau', 'dist_au', 'distance_au'
      ],
      id: [
        'id', 'identifier', 'identificador', 'designation', 'designacion', 'codigo', 'code',
        'nombre', 'name', 'star', 'estrella', 'starname', 'nombreestrella', 'nombredelastro', 'nombreastro',
        'star_name', 'proper_name', 'propername',
        'label', 'etiqueta', 'object', 'objeto',
        'hip', 'hipparcos', 'hd', 'gl', 'gliese', 'hr', 'bayer', 'flamsteed', 'gaia', 'tyc', 'tycho'
      ],
      lum: [
        'l', 'lum', 'luminosity', 'luminosidad',
        'l_lsun', 'llsun', 'l_lsol', 'llsol',
        'luminosity_lsun', 'luminositylsun', 'lsun', 'lsol',
        'l_sun', 'l_sol', 'lum_lsun', 'lum_lsol',
        'luminosidad_lsun', 'luminosidad_lsol', 'l_l_sun', 'l_l_sol'
      ]
    };
  }

  async parseFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject("No file provided");
      if (file.size > this.MAX_FILE_SIZE) return reject("File too large (max 1MB)");

      const name = file.name.toLowerCase();
      const isCSV = name.endsWith('.csv');
      const isExcel = name.endsWith('.xls') || name.endsWith('.xlsx');

      if (!isCSV && !isExcel) return reject("Invalid file type. Use .csv, .xls, or .xlsx");

      const reader = new FileReader();
      reader.onerror = () => reject("Error reading file");

      if (isCSV) {
        reader.onload = (e) => {
          try {
            const aoa = this.parseCSVToAOA(e.target.result);
            const data = this.processAOA(aoa);
            resolve(data);
          } catch (err) {
            reject(err.message || err);
          }
        };
        reader.readAsText(file);
      } else {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

            const processedData = this.processAOA(aoa);
            resolve(processedData);
          } catch (err) {
            reject("Invalid Excel file: " + (err.message || err));
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  }

  async parseArrayBuffer(arrayBuffer, filename = '') {
    return new Promise((resolve, reject) => {
      try {
        const name = filename.toLowerCase();
        if (name.endsWith('.csv')) {
          const text = new TextDecoder('utf-8').decode(arrayBuffer);
          const aoa = this.parseCSVToAOA(text);
          const data = this.processAOA(aoa);
          return resolve(data);
        }

        const dataArr = new Uint8Array(arrayBuffer);
        const wb = XLSX.read(dataArr, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const processedData = this.processAOA(aoa);
        resolve(processedData);
      } catch (err) {
        reject("Error al procesar el archivo: " + (err.message || err));
      }
    });
  }

  parseCSVToAOA(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    return lines.map(line => line.split(','));
  }

  matchHeaderCategory(headerStr) {
    if (!headerStr) return null;
    const norm = String(headerStr)
      .toLowerCase()
      .replace(/\u00A0/g, '')
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/[\s_\-\.\#\°\/]/g, '');

    for (const [key, aliases] of Object.entries(this.headerAliases)) {
      if (aliases.some(alias => alias.toLowerCase().replace(/[\s_\-\.\#\°\/]/g, '') === norm)) {
        return key;
      }
    }
    return null;
  }

  processAOA(aoa) {
    const rows = aoa.filter(row => row && row.some(cell => String(cell).trim() !== ''));
    if (rows.length < 2) {
      throw new Error("El archivo debe contener una fila de encabezado y al menos una fila de datos.");
    }

    const rawHeaders = rows[0].map(h => String(h).trim());

    const raOptions = [];
    const decOptions = [];
    const distanceOptions = [];
    const idOptions = [];
    const lumOptions = [];

    rawHeaders.forEach((h, colIdx) => {
      const category = this.matchHeaderCategory(h);
      if (!category) return;

      const normLower = h.toLowerCase();

      if (category === 'id') {
        idOptions.push({
          colIdx,
          key: `col_${colIdx}_id`,
          rawHeader: h,
          label: `${h} (Identificador / Nombre)`
        });
      } else if (category === 'lum') {
        lumOptions.push({
          colIdx,
          key: `col_${colIdx}_lum`,
          rawHeader: h,
          label: `${h} (Luminosidad L☉)`
        });
      } else if (category === 'ra') {
        const isDeg = /deg|°|grado|icrs/i.test(normLower);
        const mode = isDeg ? 'degrees' : 'hours';
        const unit = isDeg ? '°' : 'h';
        const label = `${h} (${isDeg ? 'Grados: 0-360°' : 'Horas: 0-24h'})`;
        raOptions.push({
          colIdx,
          key: `col_${colIdx}_ra`,
          rawHeader: h,
          mode,
          unit,
          label
        });
      } else if (category === 'dec') {
        decOptions.push({
          colIdx,
          key: `col_${colIdx}_dec`,
          rawHeader: h,
          mode: 'degrees',
          unit: '°',
          label: `${h} (Grados: -90° a +90°)`
        });
      } else if (category === 'd') {
        let unit = 'ly';
        let label = `${h} (Años Luz - ly)`;

        if (/mpc|megaparsec/i.test(normLower)) {
          unit = 'Mpc';
          label = `${h} (Megaparsecs - Mpc)`;
        } else if (/kpc|kiloparsec/i.test(normLower)) {
          unit = 'kpc';
          label = `${h} (Kiloparsecs - kpc)`;
        } else if (/mly|million.*ly|millionly/i.test(normLower)) {
          unit = 'Mly';
          label = `${h} (Millones Años Luz - Mly)`;
        } else if (/pc|parsec/i.test(normLower)) {
          unit = 'pc';
          label = `${h} (Parsecs - pc)`;
        } else if (/au|astronomical/i.test(normLower)) {
          unit = 'au';
          label = `${h} (Unidades Astronómicas - au)`;
        }

        distanceOptions.push({
          colIdx,
          key: `col_${colIdx}_d`,
          rawHeader: h,
          unit,
          label
        });
      }
    });

    if (raOptions.length === 0 || decOptions.length === 0 || distanceOptions.length === 0) {
      throw new Error("Encabezados obligatorios no encontrados. El archivo debe incluir columnas para Ascensión Recta (RA), Declinación (Dec) y Distancia (d).");
    }

    const validatedData = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => String(c).trim() !== '')) continue;

      const coords = {};
      let hasValidRa = false;
      let hasValidDec = false;
      let hasValidD = false;

      // Extract all RA candidates
      raOptions.forEach(opt => {
        const valRaw = String(row[opt.colIdx] !== undefined ? row[opt.colIdx] : '').replace(/\u00A0/g, '').trim().replace(/,/g, '.');
        const val = parseFloat(valRaw);
        if (!isNaN(val)) {
          coords[opt.key] = val;
          hasValidRa = true;
        }
      });

      // Extract all Dec candidates
      decOptions.forEach(opt => {
        const valRaw = String(row[opt.colIdx] !== undefined ? row[opt.colIdx] : '').replace(/\u00A0/g, '').trim().replace(/,/g, '.');
        const val = parseFloat(valRaw);
        if (!isNaN(val)) {
          coords[opt.key] = val;
          hasValidDec = true;
        }
      });

      // Extract all Distance candidates
      distanceOptions.forEach(opt => {
        const valRaw = String(row[opt.colIdx] !== undefined ? row[opt.colIdx] : '').replace(/\u00A0/g, '').trim().replace(/,/g, '.');
        const val = parseFloat(valRaw);
        if (!isNaN(val)) {
          coords[opt.key] = val;
          hasValidD = true;
        }
      });

      // Extract all ID candidates
      idOptions.forEach(opt => {
        const idRaw = String(row[opt.colIdx] !== undefined ? row[opt.colIdx] : '').replace(/\u00A0/g, '').trim();
        if (idRaw !== '') {
          coords[opt.key] = idRaw;
        }
      });

      // Extract all Luminosity candidates
      lumOptions.forEach(opt => {
        const lumRaw = String(row[opt.colIdx] !== undefined ? row[opt.colIdx] : '').replace(/\u00A0/g, '').trim().replace(/,/g, '.');
        const lumVal = parseFloat(lumRaw);
        if (!isNaN(lumVal)) {
          coords[opt.key] = lumVal;
        }
      });

      // Skip row if completely missing any of the 3 required dimensions
      if (!hasValidRa || !hasValidDec || !hasValidD) continue;

      const rowObj = { coords };

      // Also set backward-compatible ra, dec, d fields using default first option for convenience
      rowObj.ra = coords[raOptions[0].key];
      rowObj.dec = coords[decOptions[0].key];
      rowObj.d = coords[distanceOptions[0].key];
      if (idOptions.length > 0 && coords[idOptions[0].key]) {
        rowObj.id = coords[idOptions[0].key];
      }
      if (lumOptions.length > 0 && coords[lumOptions[0].key] !== undefined) {
        rowObj.lum = coords[lumOptions[0].key];
      }

      validatedData.push(rowObj);
      if (validatedData.length >= this.MAX_ROWS) break;
    }

    if (validatedData.length === 0) {
      throw new Error("No se encontraron filas con datos astronómicos válidos.");
    }

    const availableColumns = {
      raOptions,
      decOptions,
      distanceOptions,
      idOptions,
      lumOptions
    };

    const activeSelections = {
      raKey: raOptions[0].key,
      decKey: decOptions[0].key,
      distKey: distanceOptions[0].key,
      idKey: idOptions.length > 0 ? idOptions[0].key : null,
      lumKey: lumOptions.length > 0 ? lumOptions[0].key : null
    };

    const hasMultipleOptions = (
      raOptions.length > 1 ||
      decOptions.length > 1 ||
      distanceOptions.length > 1 ||
      idOptions.length > 1 ||
      lumOptions.length > 1
    );

    return {
      stars: validatedData,
      availableColumns,
      activeSelections,
      hasMultipleOptions,
      metadata: {
        distanceUnit: distanceOptions[0].unit,
        raMode: raOptions[0].mode,
        raUnit: raOptions[0].unit
      }
    };
  }
}
