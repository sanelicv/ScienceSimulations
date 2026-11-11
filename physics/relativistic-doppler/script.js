// script.js
// UI glue: attach listeners and call window.SketchAPI when available

document.addEventListener("DOMContentLoaded", () => {
  const speedRange = document.getElementById("speedRange");
  const speedInput = document.getElementById("speedInput");
  const lambdaRange = document.getElementById("lambdaRange");
  const lambdaInput = document.getElementById("lambdaInput");
  const speedValue = document.getElementById("speedValue");
  const lambdaValue = document.getElementById("lambdaValue");
  const startButton = document.getElementById("startButton");
  const resetButton = document.getElementById("resetButton");
  const speedHint = document.getElementById("speedHint");
  const lambdaHint = document.getElementById("lambdaHint");

  //
  speedRange.addEventListener("input", () => {
    speedInput.value = speedRange.value;
    speedHint.textContent = `La fuente se mueve al ${Math.round(speedInput.value * 100)}% de la velocidad de la luz.`;
  });
  speedInput.addEventListener("input", ()=>{
    speedRange.value = speedInput.value;
    speedHint.textContent = `La fuente se mueve al ${Math.round(speedInput.value * 100)}% de la velocidad de la luz.`;
  })
  lambdaRange.addEventListener("input", ()=>{
    lambdaInput.value = lambdaRange.value;
    lambdaHint.textContent = `La fuente emite luz de longitud de onda de ${lambdaRange.value} nm.`;
  })
  lambdaInput.addEventListener("input", ()=>{
    lambdaRange.value = lambdaInput.value;
    lambdaHint.textContent = `La fuente emite luz de longitud de onda de ${lambdaRange.value} nm.`;
  })

  // helper to wait for the sketch API to be ready
  function whenSketchReady(cb) {
    if (window.SketchAPI) return cb();
    const handle = setInterval(() => {
      if (window.SketchAPI) {
        clearInterval(handle);
        cb();
      }
    }, 50);
  }

  // Live preview: lambda slider changes immediate preview using SketchAPI.setLambdaPreview
  lambdaRange.addEventListener("input", () => {
    whenSketchReady(() => {
      window.SketchAPI.setLambdaPreview(Number(lambdaRange.value));
    });
  });
  lambdaInput.addEventListener("input", () => {
    whenSketchReady(() => {
      window.SketchAPI.setLambdaPreview(Number(lambdaInput.value));
    });
  });

  // Speed slider updates label only (value is locked at Start)
  // speedRange.addEventListener("input", () => {
  //   speedValue.textContent = parseFloat(speedRange.value).toFixed(3);
  // });

  // Start button: lock current slider values and start simulation
  startButton.addEventListener("click", () => {
    const v = Number(speedInput.value);
    const lambda = Number(lambdaInput.value);
    whenSketchReady(() => {
      window.SketchAPI.startSimulation(v, lambda);
    });
  });

  // Reset button
  resetButton.addEventListener("click", () => {
    whenSketchReady(() => {
      window.SketchAPI.resetSimulation();
      window.SketchAPI.setLambdaPreview(Number(lambdaRange.value));
    });
  });

  // Ensure that when SketchAPI appears we set initial preview lambda
  whenSketchReady(() => {
    window.SketchAPI.setLambdaPreview(Number(lambdaRange.value));
  });



});
