// We no longer use sliders for sign, so we remove the old slider logic.
// Instead, we have drop-downs for both sign and magnitude.

let drawVectors = 1; // default: on

let numFieldLinesSelect;
let numFieldLines = 0; // default

let numEquipotentials = 0; // default

let charge1SignSelect, charge2SignSelect;
let charge1MagSelect, charge2MagSelect;
let gridResolutionSelect;

// Variables for the numeric values
let charge1Sign = 1;
let charge2Sign = 1;
let charge1Mag = 1;
let charge2Mag = 1;
let gridResolution = 20;

window.addEventListener("DOMContentLoaded", () => {
  // Sign drop-down references
  charge1SignSelect = document.getElementById("charge1Sign");
  charge2SignSelect = document.getElementById("charge2Sign");

  // Magnitude drop-down references
  charge1MagSelect = document.getElementById("charge1Mag");
  charge2MagSelect = document.getElementById("charge2Mag");

  // Grid resolution
  gridResolutionSelect = document.getElementById("gridResolution");

  // Event listeners for sign drop-downs
  charge1SignSelect.addEventListener("change", () => {
    charge1Sign = parseFloat(charge1SignSelect.value);
  });
  
  charge2SignSelect.addEventListener("change", () => {
    charge2Sign = parseFloat(charge2SignSelect.value);
  });

  // Event listeners for magnitude drop-downs
  charge1MagSelect.addEventListener("change", () => {
    charge1Mag = parseFloat(charge1MagSelect.value);
  });

  charge2MagSelect.addEventListener("change", () => {
    charge2Mag = parseFloat(charge2MagSelect.value);
  });

  // Event listener for grid resolution
  gridResolutionSelect.addEventListener("change", () => {
    gridResolution = parseInt(gridResolutionSelect.value);
  });

  // 1) Get the dropdown element
  numFieldLinesSelect = document.getElementById("numFieldLines");
  // 2) Listen for changes
  numFieldLinesSelect.addEventListener("change", () => {
    numFieldLines = parseInt(numFieldLinesSelect.value);
  });

  // Get dropdown element
  const numEquipotentialsSelect = document.getElementById("numEquipotentials");
  // Listen for changes
  numEquipotentialsSelect.addEventListener("change", () => {
    numEquipotentials = parseInt(numEquipotentialsSelect.value);
  });

  // Reference to the new dropdown
  const drawVectorsSelect = document.getElementById("drawVectors");
  // Listen for changes
  drawVectorsSelect.addEventListener("change", () => {
    drawVectors = parseInt(drawVectorsSelect.value); 
    // 1 => On, 0 => Off
  });
  
});

// Provide a getter function for sketch.js
function getDrawVectors() {
  return drawVectors;
}

// Provide a getter for use in sketch.js
function getNumEquipotentials() {
  return numEquipotentials;
}

// Provide a getter to use in sketch.js
function getNumFieldLines() {
  return numFieldLines;
}

// Functions to be used in sketch.js
function getCharge1() {
  // numeric charge = sign * magnitude
  return charge1Sign * charge1Mag;
}

function getCharge2() {
  return charge2Sign * charge2Mag;
}

// If you still want to color the charge differently 
// for positive vs negative, you can get just the sign:
function getCharge1SignOnly() {
  return charge1Sign;
}
function getCharge2SignOnly() {
  return charge2Sign;
}

function getGridResolution() {
  return gridResolution;
}
