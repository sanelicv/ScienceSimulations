/* Etiquetas HTML ancladas a puntos 3D. */
(function () {
class Labels {
  constructor(camera) { this.camera = camera; this.items = []; this._v = new THREE.Vector3(); }
  add(html, target, cls = '') {
    const el = document.createElement('div');
    el.className = 'label ' + cls;
    el.innerHTML = html;
    document.body.appendChild(el);
    const it = { el, target, visible: true };
    this.items.push(it);
    return it;
  }
  remove(it) { it.el.remove(); this.items = this.items.filter((x) => x !== it); }
  update() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.updateMatrixWorld();   // la posición de la cámara de este mismo cuadro
    for (const it of this.items) {
      if (!it.visible) { it.el.style.display = 'none'; continue; }
      const p = it.target.isObject3D ? it.target.getWorldPosition(this._v) : this._v.copy(it.target);
      p.project(this.camera);
      if (p.z > 1 || p.z < -1) { it.el.style.display = 'none'; continue; }
      it.el.style.display = 'block';
      // transform (y no left/top) permite posiciones fraccionarias: el texto no salta de píxel en píxel
      const x = ((p.x + 1) / 2) * w, y = ((1 - p.y) / 2) * h - 8;
      it.el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
    }
  }
}
SIM.Labels = Labels;
})();
