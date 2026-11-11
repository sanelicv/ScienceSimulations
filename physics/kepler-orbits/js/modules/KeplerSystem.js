import { Body } from './Body.js';

export class KeplerSystem {
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
      saturn: "#C5AB6E"
    };

    // Global Scale
    const AU = 80; // pixels per AU

    // 1. Sun (Center)
    // Parent is null, static.
    const sun = new Body("Sol", colors.sun, 14, 0, 0, 0, null);
    this.bodies.push(sun);

    // 2. Planets (Orbit Sun)

    // Mercury
    // a = 0.387 AU, e = 0.2056, P = 0.241 yrs
    this.bodies.push(new Body(
      "Mercurio",
      colors.mercury,
      5,
      0.387 * AU,
      0.2056,
      0.241,
      sun
    ));

    // Venus
    // a = 0.723 AU, e = 0.0067, P = 0.615 yrs
    this.bodies.push(new Body(
      "Venus",
      colors.venus,
      7,
      0.723 * AU,
      0.0067,
      0.615,
      sun
    ));

    // Earth
    // a = 1.000 AU, e = 0.0167, P = 1.000 yrs
    const earth = new Body(
      "Tierra",
      colors.earth,
      10,
      1.0 * AU,
      0.0167,
      1.0,
      sun
    );
    this.bodies.push(earth);

    // Moon (Orbits Earth)
    // Stylized: a = 20px (0.25 AU scaled), e = 0.0549, P = 0.0748 yrs (~27.3 days)
    // We treat it as a mini-Keplerian system where Earth is the center.
    this.bodies.push(new Body(
      "Luna",
      colors.moon,
      3,
      20, // Stylized radius 
      0.0549,
      0.0748,
      earth
    ));

    // Mars
    // a = 1.524 AU, e = 0.0934, P = 1.881 yrs
    this.bodies.push(new Body(
      "Marte",
      colors.mars,
      6,
      1.524 * AU,
      0.0934,
      1.881,
      sun
    ));

    // Jupiter
    // a = 5.203 AU, e = 0.0484, P = 11.86 yrs
    this.bodies.push(new Body(
      "Júpiter",
      colors.jupiter,
      16,
      5.203 * AU,
      0.0484,
      11.86,
      sun
    ));

    // Saturn
    // a = 9.537 AU, e = 0.0541, P = 29.46 yrs
    this.bodies.push(new Body(
      "Saturno",
      colors.saturn,
      14,
      9.537 * AU,
      0.0541,
      29.46,
      sun
    ));
  }

  update(speedFactor) {
    // Base time step
    // In original code, dt = 0.01 * speedFactor.
    // If we assume speedFactor = 1 means "real time" scaled, we need to decide what 1 second equals.
    // If speedFactor = 1, let's say 1 second = 1/60 year ~ 6 days per frame @ 60fps? Too fast.
    // Original: Earth speed = 1. dAngle = 1 * dt. Period = 2pi / speed = 2pi.
    // So 1 year = 2pi units of time.
    // Here we use period in years. n = 2pi / period.
    // So if we pass time in years, it works.
    // Let's say dt represents fraction of a year.
    // Original dt = 0.01. So 100 frames = 1 "radian-time".
    // Let's stick to a convenient visual speed.
    // dt = 0.005 years per frame * speedFactor.

    // 0.005 years * 365 = 1.8 days per frame.
    // At 60fps, 1 sec = 110 days. ~3 sec per year. Good for visualization.

    const dt = 0.005 * speedFactor;

    this.bodies.forEach(body => {
      body.update(dt);
    });
  }

  draw(ctx, width, height, showTrails, showLabels, showOrbits, selectedPlanet = null, scale = 1.0, labEccentricity = null) {
    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Filter visible bodies
    let visibleBodies = this.bodies;
    if (selectedPlanet && selectedPlanet !== 'all') {
      // Show Sun and the selected planet
      visibleBodies = this.bodies.filter(b => b.name === 'Sol' || b.name === selectedPlanet);
    }

    // 1. Draw Orbits
    // If specific planet selected, always show its orbit with foci.
    // If 'all', show orbits based on showOrbits toggle.
    visibleBodies.forEach(body => {
      // Don't draw Sun's orbit (it has none)
      if (body.parent) {
        const isSelected = selectedPlanet && body.name === selectedPlanet;
        if (isSelected || showOrbits) {
          const userEcc = isSelected ? labEccentricity : null;
          body.drawOrbit(ctx, isSelected, scale, userEcc);
          if (isSelected) {
            body.drawAxes(ctx, scale, userEcc);
          }
        }
      }
    });

    // 2. Draw Bodies and Trails
    visibleBodies.forEach(body => {
      let sizeMult = 1.0;
      
      // Focus enhancement for selected planet
      if (selectedPlanet && selectedPlanet !== 'all') {
        if (body.name === 'Sol') {
          sizeMult = 0.4; // Sun shrinks slightly less than before (0.25 -> 0.4)
        } else if (body.name === selectedPlanet) {
          sizeMult = 2.0; // Selected planet gets a 2x boost to be clearly visible
        }
      }

      body.draw(ctx, showTrails, showLabels, sizeMult, scale);
    });

    ctx.restore();
  }

  getBodyByName(name) {
    return this.bodies.find(b => b.name === name);
  }

  reset() {
    this.bodies = [];
    this.init();
  }
}
