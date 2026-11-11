import SlimSelect from '../../lib/slim-select/slimselect.es.js';

export class UI {
  constructor(simulation) {
    this.sim = simulation;
    this.setupListeners();
  }

  setupListeners() {
    // Speed Slider
    const speedSlider = document.getElementById('speedSlider');
    speedSlider.addEventListener('input', (e) => {
      this.sim.setSpeed(parseFloat(e.target.value));
    });

    // Planet Selector & Lab Controls
    const planetSelectorElement = document.getElementById('planetSelector');
    new SlimSelect({
      select: planetSelectorElement,
      settings: {
        showSearch: false,
      }
    });
    
    const labControls = document.getElementById('labControls');
    const eccSlider = document.getElementById('eccSlider');
    const eccInput = document.getElementById('eccInput');

    const syncEccentricity = (valStr) => {
      let val = parseFloat(valStr);
      if (isNaN(val)) val = 0.0;
      if (val < 0) val = 0.0;
      if (val > 0.99) val = 0.99;
      
      eccSlider.value = val;
      // Fixed to 2 dec
      eccInput.value = val.toFixed(2);
      
      if (this.sim.setLabEccentricity) {
        this.sim.setLabEccentricity(val);
      }
    };

    eccSlider.addEventListener('input', (e) => syncEccentricity(e.target.value));
    eccInput.addEventListener('change', (e) => syncEccentricity(e.target.value));

    // UI Toggles
    const rowToggleTrails = document.getElementById('rowToggleTrails');
    const rowToggleOrbits = document.getElementById('rowToggleOrbits');
    
    const trailsCheckbox = document.getElementById('toggleTrailsCheckbox');
    const namesCheckbox = document.getElementById('toggleNamesCheckbox');
    const orbitsCheckbox = document.getElementById('toggleOrbitsCheckbox');

    planetSelectorElement.addEventListener('change', (e) => {
      // In multiple select it might be an array, but here it's single
      const val = Array.isArray(e.target.value) ? e.target.value[0] : e.target.value;
      if (val === 'all') {
        labControls.style.display = 'none';
        rowToggleTrails.style.display = 'flex';
        rowToggleOrbits.style.display = 'flex';
      } else {
        labControls.style.display = 'block';
        rowToggleTrails.style.display = 'none';
        rowToggleOrbits.style.display = 'none';
        // Reset lab eccentricity
        syncEccentricity(0);
      }
      this.sim.setSelectedPlanet(val);

      if (val === 'all') {
        this.sim.scale = 1.0;
        this.sim.speedFactor = 1.0;
        this.sim.offsetX = 0;
        this.sim.offsetY = 0;
        speedSlider.value = 1.0;
      } else {
        const data = this.sim.focusOnPlanet(val);
        if (data) {
          speedSlider.value = data.speedFactor;
        }
      }
    });

    // Trails Toggle
    trailsCheckbox.addEventListener('change', (e) => {
      this.sim.showTrails = e.target.checked;
      this.sim.toggleTrails(this.sim.showTrails);
    });

    // Labels Toggle
    namesCheckbox.addEventListener('change', (e) => {
      this.sim.showLabels = e.target.checked;
      this.sim.toggleLabels(this.sim.showLabels);
    });

    // Orbits Toggle
    orbitsCheckbox.addEventListener('change', (e) => {
      this.sim.showOrbits = e.target.checked;
      this.sim.toggleOrbits(this.sim.showOrbits);
    });

    // Reset Button currently removed in index.html, but keep listener logic if re-added
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.sim.reset();
      });
    }
  }
}
