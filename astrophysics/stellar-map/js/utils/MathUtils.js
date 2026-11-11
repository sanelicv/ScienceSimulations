
/**
 * Converts Right Ascension (RA), Declination (Dec), and Distance into 3D Cartesian coordinates.
 * Assumes a Y-up coordinate system where Y points to the North Celestial Pole.
 * 
 * @param {number} ra - Right Ascension in hours (0-24) or degrees (0-360).
 * @param {number} dec - Declination in degrees (-90 to +90).
 * @param {number} dist - Distance in Light Years, Parsecs, or AU.
 * @param {string} raMode - 'hours' (0..24) or 'degrees' (0..360).
 * @returns {object} {x, y, z}
 */
export function raDecToVector3(ra, dec, dist, raMode = 'hours') {
    const phi = (raMode === 'degrees' || raMode === '°') 
        ? (ra / 180) * Math.PI 
        : (ra / 24) * Math.PI * 2; // RA to Radians (Azimuth)
    const theta = (dec / 180) * Math.PI; // Dec to Radians (Elevation)

    const y = dist * Math.sin(theta);
    const rc = dist * Math.cos(theta); // Radius on the XZ plane
    const x = rc * Math.cos(phi);
    const z = -rc * Math.sin(phi); 

    return { x, y, z };
}

export function degToRad(deg) {
    return (deg / 180) * Math.PI;
}

export function radToDeg(rad) {
    return (rad / Math.PI) * 180;
}
