/* Destellos: sprites que crecen y se desvanecen. */
(function () {
class Flashes {
  constructor(scene) { this.scene = scene; this.items = []; }
  spawn(pos, color = 0xffffff, size = 1, duration = 0.6, opts = {}) {
    const m = new THREE.SpriteMaterial({
      map: SIM.glowTexture(), color, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: opts.depthTest ?? true,
    });
    const s = new THREE.Sprite(m);
    s.position.copy(pos);
    s.scale.setScalar(size * 0.3);
    s.renderOrder = opts.renderOrder ?? 3;
    this.scene.add(s);
    this.items.push({ s, t: 0, duration, size, grow: opts.grow ?? 1 });
    return s;
  }
  clear() { for (const it of this.items) this.scene.remove(it.s); this.items.length = 0; }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const u = it.t / it.duration;
      if (u >= 1) { this.scene.remove(it.s); it.s.material.dispose(); this.items.splice(i, 1); continue; }
      it.s.scale.setScalar(it.size * (0.3 + 0.7 * Math.min(1, u * 4) * it.grow + (1 - it.grow) * 0.7));
      it.s.material.opacity = u < 0.25 ? 1 : 1 - (u - 0.25) / 0.75;
    }
  }
}
SIM.Flashes = Flashes;
})();
