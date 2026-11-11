
document.addEventListener("DOMContentLoaded", ()=>{

  const scaleFactorRange = document.getElementById("scaleFactorRange");
  
  const expansionFactorText = document.getElementById("expansionFactorText");
  const cameraSelect = document.getElementById("cameraSelect");
  
  
  

  scaleFactorRange.addEventListener( "input", () => {
    cubeWidth = 600*Number(scaleFactorRange.value);
    setCoordinates(cubeWidth, nCubes);
    expansionFactorText.textContent = `Factor de escala: a = ${scaleFactorRange.value}`;

    if(cameraSelect.value == "Local"){
      const cameraPos = localCameraPos0.map( x => x*scaleFactorRange.value)
      setCameraPosition(myp5, ...cameraPos);
    }
  })

  cameraSelect.addEventListener( "change", () =>{
    if(cameraSelect.value == "Global"){
      myp5.camera(cameraPos0.x, cameraPos0.y, cameraPos0.z, 0, 0, 0, 0, 1, 0);
    }else if(cameraSelect.value == "Local"){
      const cameraPos = localCameraPos0.map( x => x*scaleFactorRange.value)
      setCameraPosition(myp5, ...cameraPos);
    }
  })


})