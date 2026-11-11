import { Body } from './Body.js';

export class TychoSystem {
  constructor() {
    this.bodies = [];
    this.init();
  }

  init() {
    // Colors
    const colors = {
      earth: "#2271B3",
      sun: "#FFD700",
      moon: "#AAAAAA",
      mercury: "#A5A5A5",
      venus: "#E3BB76",
      mars: "#E27B58",
      jupiter: "#D39C7E",
      saturn: "#C5AB6E" // Kept in palette but unused
    };

    // 1. Earth (Center)
    // distance 0, speed 0
    const earth = new Body("Tierra", colors.earth, 8, 0, 0, null);
    this.bodies.push(earth);

    // 2. Moon (Orbits Earth)
    // Real scale is tiny (0.002 AU), but we need it visible. 
    // Stylized but faster than Sun. Period ~27 days vs 365 days => ~13x faster.
    const moon = new Body("Luna", colors.moon, 2, 20, 13.0, earth);
    this.bodies.push(moon);

    // 3. Sun (Orbits Earth in Tycho model)
    // Scale: 1 AU = 80 pixels
    const AU = 80;
    // Reference Speed: Earth's orbit (Sun's apparent motion) = 1.0 (1 year period)
    const yearSpeed = 1.0;

    // Sun orbits Earth at 1 AU
    const sun = new Body("Sol", colors.sun, 12, 1.0 * AU, yearSpeed, earth);
    this.bodies.push(sun);

    // 4. Planets (Orbit Sun)

    // Mercury
    // Dist: 0.39 AU, Period: 0.24 years -> Speed: 1/0.24 = 4.16
    this.bodies.push(new Body("Mercurio", colors.mercury, 3, 0.39 * AU, 1.0 / 0.24, sun));

    // Venus
    // Dist: 0.72 AU, Period: 0.615 years -> Speed: 1/0.615 = 1.62
    this.bodies.push(new Body("Venus", colors.venus, 5, 0.72 * AU, 1.0 / 0.615, sun));

    // Mars
    // Dist: 1.52 AU, Period: 1.88 years -> Speed: 1/1.88 = 0.53
    this.bodies.push(new Body("Marte", colors.mars, 4, 1.52 * AU, 1.0 / 1.88, sun));

    // Jupiter
    // Dist: 5.2 AU, Period: 11.86 years -> Speed: 1/11.86 = 0.084
    this.bodies.push(new Body("Júpiter", colors.jupiter, 10, 5.2 * AU, 1.0 / 11.86, sun));

    // Saturn Removed
  }

  update(speedFactor) {
    // Base time step
    const dt = 0.01 * speedFactor;

    this.bodies.forEach(body => {
      body.update(dt);
    });
  }

  draw(ctx, width, height, showTrails, showLabels, showOrbits, scale = 1.0) {
    // Center the view on the canvas
    // We assume Earth (index 0) is at (0,0) world space.
    // We translate canvas center to world (0,0).

    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Draw orbital lines for Sun around Earth
    // And orbits for planets around Sun

    // 1. Draw Orbits first (background)
    if (showOrbits) {
      this.bodies.forEach(body => {
        body.drawOrbit(ctx, false, scale);
      });
    }

    // 2. Draw Bodies and Trails
    this.bodies.forEach(body => {
      body.draw(ctx, showTrails, showLabels, 1.0, scale);
    });

    ctx.restore();
  }

  reset() {
    this.bodies = [];
    this.init();
  }
}
