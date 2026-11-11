// OLD - update slider with text
function updateSliderValue(value) {
    var slider = document.getElementById("mySlider");
    var output = document.getElementById("sliderValue");
    output.innerHTML = slider.value;
}

// Update Range and Input accordingly
document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById("mySlider");
    var input = document.getElementById("myInput");

    // Function to sync the input value with the slider value
    function syncInputToSlider() {
        input.value = slider.value;
    }

    // Function to sync the slider value with the input value
    function syncSliderToInput() {
        slider.value = input.value;
    }

    // Add event listeners
    slider.addEventListener('input', syncInputToSlider);
    input.addEventListener('input', syncSliderToInput);
});


// get color from wavelength in nm
function wavelengthToColor(wavelength) {
    let r, g, b;
    if (wavelength >= 380 && wavelength < 440) {
      r = -(wavelength - 440) / (440 - 380);
      g = 0;
      b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
      r = 0;
      g = (wavelength - 440) / (490 - 440);
      b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
      r = 0;
      g = 1;
      b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
      r = (wavelength - 510) / (580 - 510);
      g = 1;
      b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
      r = 1;
      g = -(wavelength - 645) / (645 - 580);
      b = 0;
    } else if (wavelength >= 645 && wavelength <= 780) {
      r = 1;
      g = 0;
      b = 0;
    } else {
      r = 0;
      g = 0;
      b = 0;
    }

    // Adjust intensity near the vision limits
    let factor = 1.0;
    if (wavelength >= 380 && wavelength < 420) {
      factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if (wavelength >= 420 && wavelength < 645) {
      factor = 1.0;
    } else if (wavelength >= 645 && wavelength <= 780) {
      factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 645);
    }

    r = Math.round(r * factor * 255);
    g = Math.round(g * factor * 255);
    b = Math.round(b * factor * 255);

    return { r, g, b };
  }