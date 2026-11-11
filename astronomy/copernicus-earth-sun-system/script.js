let lookAtEarth = false;
let lookFromEarth = false;
//let cam

document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('checkboxHorizonte').addEventListener('change', function () {
    const box = document.getElementById('latitudeBox');
    box.style.display = this.checked ? 'block' : 'none';
  });

  document.getElementById('lookAtEarthButton').addEventListener('click', function() {
    lookFromEarth = false;
    lookAtEarth = true;
    earthPerspective();    
  });

  document.getElementById('buttonCameraSun').addEventListener('click', function(){
    showEarth = true;
    lookFromEarth = false;
    lookAtEarth = false;
    resetCamera();
  });

  document.getElementById('lookFromEarthButton').addEventListener('click', function(){
    showEarth = true;
    lookAtEarth = false;
    lookFromEarth = true;

  });

  const inputAxialTilt = document.getElementById("inputAxialTilt");
  const obliquityRange = document.getElementById("obliquityRange");
  inputAxialTilt.addEventListener( "input", function(){
    obliquityRange.value = inputAxialTilt.value;
  });
  obliquityRange.addEventListener( "input", function(){
    inputAxialTilt.value = obliquityRange.value;
  });

});




  