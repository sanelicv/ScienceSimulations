import * as THREE from 'three';
import { GEOMETRY_CONFIG, OBLIQUITY_RAD } from './config.js';

export { GEOMETRY_CONFIG, OBLIQUITY_RAD };

/**
 * Converts Right Ascension (hours) and Declination (degrees) to a 3D position vector on a sphere of radius R.
 */
export function raDecToVector3(raHours, decDegrees, radius = GEOMETRY_CONFIG.SPHERE_RADIUS, targetVector = new THREE.Vector3()) {
  const phi = (raHours / 24) * 2 * Math.PI; // RA in radians
  const decRad = (decDegrees * Math.PI) / 180; // Dec in radians

  const cosDec = Math.cos(decRad);
  const sinDec = Math.sin(decRad);

  const x = radius * Math.cos(phi) * cosDec;
  const y = radius * sinDec;
  const z = -radius * Math.sin(phi) * cosDec;

  return targetVector.set(x, y, z);
}

const _tempNormal = new THREE.Vector3();
const _defaultNormal = new THREE.Vector3(0, 0, 1);

/**
 * Computes a quaternion to orient a flat 2D mesh (whose default normal is +Z)
 * so that its normal aligns with a sphere surface normal vector.
 */
export function getSurfaceOrientation(positionVector, targetQuaternion = new THREE.Quaternion()) {
  _tempNormal.copy(positionVector).normalize();
  return targetQuaternion.setFromUnitVectors(_defaultNormal, _tempNormal);
}

/**
 * Formats RA hours into string.
 */
export function formatRA(raHours) {
  return `${Number(raHours).toFixed(2)} h`;
}

/**
 * Formats Dec degrees into +dd.d° or -dd.d°.
 */
export function formatDec(decDegrees) {
  const val = Number(decDegrees);
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}°`;
}
