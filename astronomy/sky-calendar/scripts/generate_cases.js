const fs = require('fs');
const path = require('path');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomMultipleOf5(min, max) {
  const steps = Math.floor((max - min) / 5);
  return min + randomInt(0, steps) * 5;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

const cases = [];
const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3', '#FFFFFF', '#AAAAAA', '#FFD700'];

// Caso 0: La Tierra
cases.push({
  id: 'case-0',
  title: 'La Tierra',
  tropicalYear: 365.25,
  eclipticTilt: 24,
  latitude: -12, // Default latitude for Earth
  moons: [
    {
      synodicMonthDays: 29.5,
      phaseOffset: 0.3,
      size: 40 * (28 / 29.5),
      delta: 0.3 * 2 * Math.PI // Syncing Phase (0 = New Moon = 0 rad)
    }
  ],
  planets: [
    // Mercurio
    { color: '#FFFFFF', size: 2, tiltOffset: 7, distanceToSun: 0.39, initialPhase: randomFloat(-Math.PI, Math.PI) },
    // Venus
    { color: '#FFFFFF', size: 2, tiltOffset: 3.4, distanceToSun: 0.72, initialPhase: randomFloat(-Math.PI, Math.PI) },
    // Marte
    { color: '#FFFFFF', size: 2, tiltOffset: 1.85, distanceToSun: 1.52, initialPhase: randomFloat(-Math.PI, Math.PI) },
    // Júpiter
    { color: '#FFFFFF', size: 2, tiltOffset: 1.3, distanceToSun: 5.2, initialPhase: randomFloat(-Math.PI, Math.PI) },
    // Saturno
    { color: '#FFFFFF', size: 2, tiltOffset: 2.5, distanceToSun: 9.5, initialPhase: randomFloat(-Math.PI, Math.PI) }
  ]
});

for (let i = 1; i <= 50; i++) {
  const tropicalYear = randomFloat(100, 400);

  let numMoons = 1;
  if (i >= 41 && i <= 45) {
    numMoons = 2;
  } else if (i >= 46 && i <= 50) {
    numMoons = 3;
  }

  const moons = [];
  const possiblePhaseOffsets = [0.25, 0.75, 1];
  const usedSynodicMonths = new Set();

  for (let m = 0; m < numMoons; m++) {
    let synodicMonthDays;
    do {
      synodicMonthDays = randomInt(4, 10) * 4;
    } while (usedSynodicMonths.has(synodicMonthDays));
    usedSynodicMonths.add(synodicMonthDays);

    const phaseOffset = possiblePhaseOffsets[randomInt(0, possiblePhaseOffsets.length - 1)];
    const size = 40 * (28 / synodicMonthDays);
    const delta = phaseOffset * 2 * Math.PI; // Sync position with phase

    moons.push({
      synodicMonthDays: synodicMonthDays,
      phaseOffset: phaseOffset,
      size: size,
      delta: delta
    });
  }
  const planets = [];

  const numInnerPlanets = randomInt(2, 3);
  for (let j = 0; j < numInnerPlanets; j++) {
    const dist = randomFloat(0.2, 0.9);
    const initialPhase = randomFloat(-Math.PI, Math.PI);
    const tiltOffset = randomFloat(-3, 3);

    planets.push({
      color: '#FFFFFF',
      size: 2,
      tiltOffset: tiltOffset,
      distanceToSun: dist,
      initialPhase: initialPhase
    });
  }

  const numOuterPlanets = randomInt(1, 2);
  for (let j = 0; j < numOuterPlanets; j++) {
    const dist = randomFloat(1.1, 2.0);
    const initialPhase = randomFloat(-Math.PI, Math.PI);
    const tiltOffset = randomFloat(-3, 3);

    planets.push({
      color: '#FFFFFF',
      size: 2,
      tiltOffset: tiltOffset,
      distanceToSun: dist,
      initialPhase: initialPhase
    });
  }

  cases.push({
    id: `case-${i}`,
    title: `Caso ${i}`,
    tropicalYear: tropicalYear,
    eclipticTilt: randomInt(-30, 30),
    latitude: randomInt(-60, 60), // Random latitude for generated cases
    moons: moons,
    planets: planets
  });
}

const outputPath = path.join(__dirname, '..', 'assets', 'cases.json');
fs.writeFileSync(outputPath, JSON.stringify(cases, null, 2));
console.log('Successfully generated assets/cases.json');
