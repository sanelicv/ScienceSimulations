/* Textura de resplandor y ruido para relieves. */
(function () {
SIM.glowTexture = (function () {
  let tex = null;
  return function () {
    if (tex) return tex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    tex = new THREE.CanvasTexture(c);
    return tex;
  };
})();

// Ruido de valor 3D (suficiente para texturas y relieves)
SIM.noise3 = (function () {
  const perm = new Uint8Array(512);
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const vals = new Float32Array(256).map(() => rnd() * 2 - 1);
  const h = (x, y, z) => vals[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];
  const s = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  return function (x, y, z) {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    const fx = s(x - X), fy = s(y - Y), fz = s(z - Z);
    return lerp(
      lerp(lerp(h(X, Y, Z), h(X + 1, Y, Z), fx), lerp(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), fx), fy),
      lerp(lerp(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), fx), lerp(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), fx), fy),
      fz);
  };
})();

SIM.fbm = function (x, y, z, oct = 5) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) { s += a * SIM.noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
  return s;
};
})();
