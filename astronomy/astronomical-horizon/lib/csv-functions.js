// csvParser.js
async function loadAndParseCSV(filename) {
  try {
    const response = await fetch(filename);
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}

function parseCSV(text) {
  const rows = text.split('\n');
  
  // Trim spaces after commas in the header row
  const header = rows[0].split(',').map(column => column.trim());
  
  const data = rows.slice(1).map(row => {
    const values = row.split(',');
    const entry = {};
    header.forEach((key, i) => {
      entry[key] = values[i];
    });
    return entry;
  });

  return data;
}
