// Update Range and Input accordingly
document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById("rangeLat");
    var input = document.getElementById("numberLat");

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