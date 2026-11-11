import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls-custom.js';


// --- Constants ---
const CMB_RADIUS = 10000;

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, CMB_RADIUS * 2);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Camera Initial Position ---
camera.position.set(0, 0, 3); // Start near Earth

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.2; // Don't clip into Earth
controls.maxDistance = CMB_RADIUS * 0.8; // Stay inside CMB

// --- Lighting ---
// Sun light direction (approximate, for Earth illumination)
const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(5, 3, 5); // Arbitrary "sun" position
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040, 1.0); // Soft white light
scene.add(ambientLight);

// --- Texture Loader ---
const textureLoader = new THREE.TextureLoader();

// --- Earth ---
// Earth is our reference frame: Equatorial Coordinates.
// Y is North Celestial Pole. X/Z define the Equatorial Plane.
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
  map: textureLoader.load('./assets/earth.jpg'),
  specular: new THREE.Color('grey'),
  shininess: 20
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// --- CMB Sphere ---
// The CMB texture is in Galactic Coordinates.
// We need to rotate the sphere so that the Galactic Coordinate system aligns
// with the Equatorial Coordinate system defined by the Earth (Y=North).

const cmbGeometry = new THREE.SphereGeometry(CMB_RADIUS, 64, 64);
// Render on the inside
const cmbMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('./assets/cmb.jpg'),
  side: THREE.BackSide
});
const cmbSphere = new THREE.Mesh(cmbGeometry, cmbMaterial);


// Galactic North Pole vector in Equatorial coordinates
const alpha_p = 192.85948 * (Math.PI / 180);
const delta_p = 27.12825 * (Math.PI / 180);

const gnp = new THREE.Vector3(
  Math.cos(delta_p) * Math.cos(alpha_p), // X
  Math.sin(delta_p),                     // Y (Equatorial North is Y in Three.js? standard Three.js is Y-up)
  Math.cos(delta_p) * Math.sin(alpha_p)  // Z
);

const ra_gnp = THREE.MathUtils.degToRad(192.85948);
const dec_gnp = THREE.MathUtils.degToRad(27.12825);

// Convert spherical (r=1) to cartesian (x,y,z) where Y is up
const gnp_vector = new THREE.Vector3(
  Math.cos(dec_gnp) * Math.cos(ra_gnp), // X
  Math.sin(dec_gnp),                    // Y (North)
  Math.cos(dec_gnp) * Math.sin(ra_gnp)  // Z
);


// Galactic Center (GC) vector in Equatorial coordinates
// RA = 266.405 deg, Dec = -28.936 deg
const ra_gc = THREE.MathUtils.degToRad(266.4051);
const dec_gc = THREE.MathUtils.degToRad(-28.936175);

const gc_vector = new THREE.Vector3(
  Math.cos(dec_gc) * Math.cos(ra_gc),
  Math.sin(dec_gc),
  Math.cos(dec_gc) * Math.sin(ra_gc)
);



const x_axis_target = gc_vector.clone().normalize();
const y_axis_target = gnp_vector.clone().normalize();

const z_axis = new THREE.Vector3().crossVectors(x_axis_target, y_axis_target).normalize(); // Points to l=270? or l=90?
const x_axis = new THREE.Vector3().crossVectors(y_axis_target, z_axis).normalize(); // Corrected X axis pointing at GC

const rotMatrix = new THREE.Matrix4();
rotMatrix.makeBasis(x_axis, y_axis_target, z_axis);
cmbSphere.setRotationFromMatrix(rotMatrix);
scene.add(cmbSphere);


// --- Equatorial Grid Helper ---
function createEquatorialGrid(radius, color, thickness = 0.5) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });

  // Parallels (Declination)
  // -80 to +80. Every 10 degrees.
  for (let i = -80; i <= 80; i += 10) {
    const dec = THREE.MathUtils.degToRad(i);
    const r = radius * Math.cos(dec);
    const y = radius * Math.sin(dec);

    const points = [];
    // Create points for the circle
    for (let j = 0; j <= 360; j += 5) { // 5 degree steps for smoothness
      const ra = THREE.MathUtils.degToRad(j);
      points.push(new THREE.Vector3(
        r * Math.cos(ra),
        y,
        r * Math.sin(ra)
      ));
    }
    // Close the loop
    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = true;

    const geometry = new THREE.TubeGeometry(curve, 128, thickness, 8, true);
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  }

  // Meridians (Right Ascension)
  // 0 to 360 aka 0h to 24h. Every 15 degrees (1 hour).
  for (let i = 0; i < 360; i += 15) {
    const ra = THREE.MathUtils.degToRad(i);
    const points = [];
    for (let j = -90; j <= 90; j += 5) {
      const dec = THREE.MathUtils.degToRad(j);
      points.push(new THREE.Vector3(
        radius * Math.cos(dec) * Math.cos(ra),
        radius * Math.sin(dec),
        radius * Math.cos(dec) * Math.sin(ra)
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = false;

    const geometry = new THREE.TubeGeometry(curve, 128, thickness, 8, false);
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  }

  // Ecliptic/Equator emphasis
  // Equator (Dec=0)
  // const equatorPoints = [];
  // for (let j = 0; j <= 360; j += 5) {
  //   const ra = THREE.MathUtils.degToRad(j);
  //   equatorPoints.push(new THREE.Vector3(
  //     radius * Math.cos(ra),
  //     0,
  //     radius * Math.sin(ra)
  //   ));
  // }
  // const equatorCurve = new THREE.CatmullRomCurve3(equatorPoints);
  // equatorCurve.closed = true;
  // const equatorGeo = new THREE.TubeGeometry(equatorCurve, 128, thickness * 2, 8, true); // Double thickness
  // const equatorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  // group.add(new THREE.Mesh(equatorGeo, equatorMat));

  return group;
}



const grid = createEquatorialGrid(CMB_RADIUS * 0.99, 0x000000, 10); // Yellow grid, thickness 20
scene.add(grid);

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Resize Handler ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
