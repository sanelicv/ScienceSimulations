import { Simulation } from './Simulation.js';
import { UI } from './UI.js';

document.addEventListener('DOMContentLoaded', () => {
  const sim = new Simulation('simCanvas');
  const ui = new UI(sim);

  sim.start();
});
